#!/usr/bin/env python3
"""live_check.py — did the film actually reach the PUBLIC SITE.

WHY THIS EXISTS, AND WHAT IT COST ON 2026-08-29

The run merged both repos, rebuilt the site, and reported the video live. The owner
looked at texasaidocket.com and could not find it, and asked why nobody had checked.

Nobody had. Every gate that ran was correct and not one of them was pointed at the
site. `publish_feed.py` writes the entry. `site_fresh_check` proves the built pages
match a fresh rebuild byte for byte. `ownership_check` proves the write stayed in its
lane. Then the run said "verified on main: the feed holds both films", and what it had
actually verified was A JSON FILE IN A GIT CHECKOUT.

**Every one of those checks would have passed identically if GitHub Pages had never
deployed at all**, or if the media had 404'd, or if the CDN were serving a ten minute
old copy. The build was proven. The PUBLICATION was assumed.

That day it resolved on its own: Pages finished nine minutes after the merge and the
feed carries `cache-control: max-age=600`, so the owner looked inside the window where
the site was genuinely stale. The outcome was fine and the process was not, and a run
that cannot tell those apart will one day report a film live that is not.

THE GENERAL SHAPE, which GATE_LESSONS records over and over: a green suite measuring
something narrower than the thing it appeared to certify. This one is the widest
version yet, because the gap is between the repository and the internet.

WHAT IT CHECKS, all against the live origin and never against the working tree:

  1. The published feed is fetchable and parses.
  2. TODAY'S ENTRY IS IN IT, by id. Not "the feed has N films", which is the check that
     passes while serving yesterday's file.
  3. Every media URL the entry names answers 200 with a non-trivial length. A poster
     that 404s is a broken card, and the feed page prefers the phone rendition, so a
     missing `video_mobile` is a broken video on the device most readers use.

WHAT IT DELIBERATELY DOES NOT DO. It does not fail merely because a deploy is still in
flight, because that is normal and not a defect. `--wait` polls for a bounded time and
reports the delay it observed, so a slow deploy is visible as a number rather than as a
red gate somebody learns to rerun.

    live_check.py --date 2026-08-28
    live_check.py --date 2026-08-28 --wait 600
    live_check.py --self-test

Exit 0 the film is live, 1 it is not, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# The published feed, read from the brand config rather than typed here, because a URL
# restated in a second place is a URL that will be wrong in one of them. That is this
# project's founding defect and it has already put the wrong host on three decks.
BRAND = REPO.parent / "TexasAIDocket" / "config" / "brand.yaml"
FALLBACK_SITE = "https://texasaidocket.com"

# A media file smaller than this is a placeholder, an error page, or an LFS pointer.
MIN_MEDIA_BYTES = 10_000

UA = "TexasAIDispatch-live-check/1 (+https://texasaidocket.com)"


def site_url() -> str:
    """The public origin, READ from the sibling's brand config where possible."""
    try:
        for line in BRAND.read_text(encoding="utf-8").splitlines():
            s = line.strip()
            if s.startswith("site:"):
                v = s.split(":", 1)[1].strip()
                # STRIP THE TRAILING COMMENT BEFORE THE QUOTES, not after. The value in
                # brand.yaml is `"https://texasaidocket.com"   # close slide, ...`, so
                # stripping quotes first leaves the comment glued to the host and the
                # first draft of this self-test caught exactly that.
                if '#' in v:
                    q = v[0] if v[:1] in ('"', "'") else ''
                    v = v.split(q + '#', 1)[0] if q and (q + '#') in v else v.split('#', 1)[0]
                v = v.strip().strip("\"'").strip()
                if v.startswith("http"):
                    return v.rstrip("/")
                if v:
                    return "https://" + v.rstrip("/")
    except OSError:
        pass
    return FALLBACK_SITE


def fetch(url: str, timeout: float = 20.0) -> tuple[int, bytes, dict]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, b"", dict(getattr(e, "headers", {}) or {})


def head_len(url: str, timeout: float = 20.0) -> tuple[int, int]:
    """(status, content-length). HEAD, because a 25 MB master is not worth downloading."""
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": UA, "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, int(r.headers.get("Content-Length") or 0)
    except urllib.error.HTTPError as e:
        return e.code, 0
    except OSError as e:                                                # noqa: BLE001
        raise RuntimeError(f"{url}: {e}") from e


def entry_problems(feed: dict, date: str, site: str) -> tuple[list[str], dict | None]:
    videos = feed.get("videos") if isinstance(feed, dict) else None
    if not isinstance(videos, list):
        return ["the published feed has no `videos` list"], None
    hit = next((v for v in videos if str(v.get("date")) == date), None)
    if hit is None:
        have = ", ".join(sorted(str(v.get("date")) for v in videos)) or "nothing"
        return ([f"THE FILM IS NOT IN THE PUBLISHED FEED. Looked for {date}, the live "
                 f"feed carries {have}. Either the deploy has not landed or the entry "
                 f"never shipped."], None)
    return [], hit


def media_problems(entry: dict, feed: dict, site: str) -> list[str]:
    base = str(feed.get("media_base") or site).rstrip("/")
    problems: list[str] = []
    for field in ("video", "poster", "video_mobile", "poster_thumb"):
        path = entry.get(field)
        if not path:
            problems.append(f"the entry names no {field}")
            continue
        url = str(path) if str(path).startswith("http") else base + str(path)
        status, length = head_len(url)
        if status != 200:
            problems.append(f"{field} answers {status}: {url}")
        elif length < MIN_MEDIA_BYTES:
            problems.append(f"{field} is only {length} bytes, which is not a media file: {url}")
    return problems


def check(date: str, wait_s: float = 0.0) -> tuple[int, list[str]]:
    site = site_url()
    feed_url = f"{site}/videos/videos.json"
    deadline = time.monotonic() + max(0.0, wait_s)
    waited = 0.0
    lines: list[str] = []

    while True:
        status, body, _ = fetch(feed_url)
        if status != 200:
            problems = [f"the published feed answers {status}: {feed_url}"]
            entry = None
        else:
            try:
                feed = json.loads(body.decode("utf-8"))
            except (ValueError, UnicodeDecodeError) as exc:
                return 1, [f"the published feed is not JSON: {exc}"]
            problems, entry = entry_problems(feed, date, site)
            if not problems and entry is not None:
                problems = media_problems(entry, feed, site)

        if not problems:
            lines.append(f"live: {date} is published at {site}/videos/ and every media URL "
                         f"answers 200.")
            if waited:
                lines.append(f"  the deploy took {waited:.0f}s to appear after this check "
                             f"started, which is normal and worth knowing.")
            return 0, lines

        if time.monotonic() >= deadline:
            lines.append("live_check: the film is NOT live.")
            lines.extend("  - " + p for p in problems)
            lines.append("")
            lines.append("  Every build gate can be green and this still fail. site_fresh_check")
            lines.append("  proves the BUILD; this proves the PUBLICATION. If a deploy is simply")
            lines.append("  still in flight, re-run with --wait 600 rather than ignoring it.")
            return 1, lines

        time.sleep(10.0)
        waited += 10.0


def self_test() -> int:
    fails = 0

    def ok(label: str, cond: bool, extra: str = "") -> None:
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    site = site_url()
    ok("the public origin is read rather than typed, and is texasaidocket.com",
       site.endswith("texasaidocket.com"), site)
    ok("...and it is never the github.io host, which is the owner's personal name",
       "github.io" not in site, site)

    feed = {"media_base": "https://example.invalid",
            "videos": [{"date": "2026-08-28", "video": "/a.mp4", "poster": "/b.png",
                        "video_mobile": "/c.mp4", "poster_thumb": "/d.jpg"}]}

    # THE CHECK MUST GO RED WHEN THE FILM IS ABSENT, which is the whole point. A feed
    # that carries yesterday's film is the exact state this exists to catch, and a
    # "the feed has N videos" check passes on it.
    probs, hit = entry_problems(feed, "2026-08-29", site)
    ok("a feed missing TODAY'S film fails, even though it is a valid feed with a film in it",
       bool(probs) and hit is None)
    ok("...and the failure names what it looked for and what it found",
       any("2026-08-29" in p and "2026-08-28" in p for p in probs), str(probs))

    probs, hit = entry_problems(feed, "2026-08-28", site)
    ok("the film being present passes", not probs and hit is not None)

    probs, _ = entry_problems({"videos": []}, "2026-08-28", site)
    ok("an empty published feed fails", bool(probs))
    probs, _ = entry_problems({}, "2026-08-28", site)
    ok("a feed with no videos list fails", bool(probs))

    # A MEDIA FILE THAT IS TOO SMALL IS NOT A MEDIA FILE. An error page, a placeholder
    # and an LFS pointer all answer 200.
    real_head = globals()["head_len"]
    try:
        globals()["head_len"] = lambda url, timeout=20.0: (200, 12)
        probs = media_problems(feed["videos"][0], feed, site)
        ok("a 200 that returns 12 bytes is refused, because an error page answers 200 too",
           len(probs) == 4, str(probs))
        globals()["head_len"] = lambda url, timeout=20.0: (404, 0)
        probs = media_problems(feed["videos"][0], feed, site)
        ok("a 404 on every media URL is refused", len(probs) == 4, str(probs))
        globals()["head_len"] = lambda url, timeout=20.0: (200, 5_000_000)
        probs = media_problems(feed["videos"][0], feed, site)
        ok("...and real media passes", not probs, str(probs))
        # The phone rendition is the one a reader most often gets, so its absence is a
        # broken video rather than a cosmetic gap.
        thin = dict(feed["videos"][0])
        thin.pop("video_mobile")
        probs = media_problems(thin, feed, site)
        ok("a missing phone rendition fails, because the feed page prefers it",
           any("video_mobile" in p for p in probs), str(probs))
    finally:
        globals()["head_len"] = real_head

    print(f"live_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", help="the run date, YYYY-MM-DD, whose entry must be live")
    ap.add_argument("--wait", type=float, default=0.0,
                    help="seconds to keep polling while a deploy lands (try 600)")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.date:
        print("live_check: --date is required", file=sys.stderr)
        return 2
    try:
        code, lines = check(a.date, a.wait)
    except (OSError, RuntimeError) as exc:
        print(f"live_check: could not reach the site: {exc}", file=sys.stderr)
        return 2
    print("\n".join(lines))
    return code


if __name__ == "__main__":
    sys.exit(main())
