#!/usr/bin/env python3
"""publish_feed.py — the one file this repo writes in the sibling, written by a program.

THE FAULT THIS EXISTS FOR.

The routine's Phase 7 used to say, in prose, "prepend one entry to `docs/videos/videos.json`".
So the first run did, by hand, and the entry it wrote was missing the `id` field the feed uses
for deep links and for telling one card from another. Nothing failed. The feed page derives a
fallback id from the date and the title when the field is absent, precisely so a hand-written
entry is not a broken page, and that fallback is what shipped. A derived id is stable only for
as long as the title is, which for an editorial title is not a promise anybody made.

That is the same shape as every other fault in `GATE_LESSONS.md`: a step described in prose,
performed correctly enough to look right, and wrong in a field nothing read. The cure is the
same one `deliver_run.sh` applied to the rest of Phase 7. A step a run RETYPES each day is a
step that goes wrong on the day the run is tired. A step that is a program goes wrong once.

WHAT IT DERIVES RATHER THAN ASKS FOR, because everything derived is a field nobody can mistype:

    title       from the run's own storyboard, which is what was rendered
    beat        the same
    id          the date and a slug of the title, composed here and WRITTEN DOWN, so it is
                fixed at publish time rather than recomputed by a reader's browser
    video       the path the film actually landed at, checked to exist
    poster      the same

WHAT IT ASKS FOR, because neither is anywhere in the artifacts:

    --caption   the blurb under the title in the feed. House style is checked, not trusted.
    --county    where the story is, which is the field that makes this feed Texas rather than
                a list of files.

AND IT MAKES THE PHONE RENDITION, which is the other half of why this is a program. The master
is 1080x1920 at about 3.5 Mbit, which is right for the archive and punishing in a feed that
buffers the next film before you have asked for it. The feed page already prefers `video_mobile`
and `poster_thumb` on a narrow viewport or a metered connection and falls back when they are
absent, so the fields cost nothing when they are missing and save most of the bytes when they
are there. A step this mechanical was never going to be done by hand every day.

    python3 scripts/publish_feed.py --date 2026-08-18 --county Williamson \\
        --caption "..." --docket ../TexasAIDocket
    python3 scripts/publish_feed.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
FFMPEG = REPO / "video-engine" / "node_modules" / "@remotion" / \
    "compositor-linux-x64-gnu" / "ffmpeg"

# The rendition. 720x1280 keeps the vertical shape, and the bitrate is the one that held the
# subtitle band legible at 720 in a side by side, which is the only thing in this film that
# fails first under compression.
MOBILE_H = 1280
MOBILE_BITRATE = "1400k"
MOBILE_AUDIO = "96k"
THUMB_W = 540
THUMB_Q = 6

# House style, the subset a one paragraph blurb can actually break. The full set lives in
# CLAUDE.md and most of it is about long copy. These are the ones that have shipped wrong.
BANNED = [
    (re.compile(r"[—–]"), "an em dash or en dash. Ranges read X to Y."),
    (re.compile(r"[‘’“”]"), "a curly quote. Straight quotes only."),
    (re.compile(r";"), "a semicolon. Write two sentences."),
    (re.compile(r"(?<!\d):(?!\d)"), "a colon in prose. Write two sentences."),
    (re.compile(r"\bcannot\b", re.I), "\"cannot\". Always \"can't\"."),
    # Case insensitive, because the one that got past the first draft of this list was "We" at
    # the head of a sentence, which is the only place a first person pronoun is ever capitalised
    # and therefore the likeliest place to find one.
    (re.compile(r"\b(?:I|we|our|ours|us|my|mine|me)\b", re.I),
     "first person. Published copy has none."),
    (re.compile(r"^(And|But)\b", re.M), "a sentence opening with And or But."),
    (re.compile(r"[\U0001F300-\U0001FAFF☀-➿]"), "an emoji."),
]


def slug(text: str) -> str:
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", text.lower()))[:60]


def check_caption(text: str) -> list[str]:
    fails = [f"the caption carries {why}" for rx, why in BANNED if rx.search(text)]
    if not text.strip():
        fails.append("the caption is empty. The feed prints it under the title.")
    return fails


def entry(date: str, board: dict, caption: str, county: str,
          has_mobile: bool, has_thumb: bool) -> dict:
    title = board.get("title") or ""
    if not title:
        raise SystemExit("the storyboard has no title, so there is nothing to publish under")
    e = {
        "id": f"{date}-{slug(title)}",
        "date": date,
        "title": title,
        "caption": caption.strip(),
        "video": f"/runs/{date}/dispatch.mp4",
        "poster": f"/runs/{date}/poster.png",
    }
    if has_mobile:
        e["video_mobile"] = f"/runs/{date}/dispatch-720.mp4"
    if has_thumb:
        e["poster_thumb"] = f"/runs/{date}/poster-540.jpg"
    e["county"] = county
    e["beat"] = board.get("beat") or ""
    return e


def renditions(run: Path) -> tuple[bool, bool]:
    """Make the phone rendition and the thumb. Returns what actually exists afterwards.

    A MISSING FFMPEG IS NOT A FAILED PUBLISH. The feed falls back to the master when these
    fields are absent, so a container without the compositor still ships a working entry,
    which is the right trade for a step whose whole purpose is saving somebody else's bytes.
    """
    film, poster = run / "dispatch.mp4", run / "poster.png"
    mobile, thumb = run / "dispatch-720.mp4", run / "poster-540.jpg"
    if not FFMPEG.exists():
        print(f"  ffmpeg not found at {FFMPEG}, so no rendition. The feed falls back.")
        return mobile.exists(), thumb.exists()
    if not mobile.exists():
        subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(film),
                        "-vf", f"scale=-2:{MOBILE_H}", "-c:v", "libx264", "-preset", "medium",
                        "-b:v", MOBILE_BITRATE, "-profile:v", "high", "-pix_fmt", "yuv420p",
                        "-movflags", "+faststart",
                        "-c:a", "aac", "-b:a", MOBILE_AUDIO, str(mobile)], check=True)
    if not thumb.exists() and poster.exists():
        subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(poster),
                        "-vf", f"scale={THUMB_W}:-2", "-q:v", str(THUMB_Q), str(thumb)],
                       check=True)
    for p in (mobile, thumb):
        if p.exists():
            print(f"  {p.name}  {p.stat().st_size / 1e6:.1f} MB")
    return mobile.exists(), thumb.exists()


def publish(feed: dict, new: dict) -> dict:
    """Newest first, and a re-publish REPLACES rather than duplicates.

    The same date being published twice is a re-run, not two films, and two cards with one id
    is a deep link that lands on whichever the browser reached first.
    """
    vids = [v for v in (feed.get("videos") or []) if v and v.get("id") != new["id"]
            and v.get("date") != new["date"]]
    feed["videos"] = [new] + vids
    feed.setdefault("media_base",
                    "https://raw.githubusercontent.com/Talonsturgill/TexasAIDispatch/main")
    return feed


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    board = {"title": "The only machine you can check", "beat": "science-machines"}
    good = ("Horizon, the public supercomputer, has its first half running in a redeveloped "
            "call centre off a frontage road in Round Rock, and the operator's own user guide "
            "says access is limited to internal users. What makes a public machine public was "
            "never its size.")

    e = entry("2026-08-18", board, good, "Williamson", True, True)
    ok("composes the id from the date and the title",
       e["id"] == "2026-08-18-the-only-machine-you-can-check", e["id"])
    ok("the id is WRITTEN DOWN rather than left to the reader's browser", "id" in e)
    ok("carries the county that makes the feed Texas", e["county"] == "Williamson")
    ok("names the rendition when it exists", e["video_mobile"].endswith("dispatch-720.mp4"))
    ok("omits the rendition when it does not",
       "video_mobile" not in entry("2026-08-18", board, good, "Williamson", False, False))

    # THE ENTRY THAT SHIPPED WITHOUT AN ID had a caption that is otherwise clean, so the
    # style check must not fire on it. A gate that fails correct work gets switched off.
    ok("the shipped caption passes house style", not check_caption(good), str(check_caption(good)))

    for bad, why in [
        ("A machine, and a question: who gets in.", "colon"),
        ("It is live; the login is not.", "semicolon"),
        ("Half a machine — and no login.", "em dash"),
        ("We could not find a production date.", "first person"),
        ("The public cannot log in.", "cannot"),
        ("Half a machine and no login \U0001F60E", "emoji"),
    ]:
        ok(f"catches {why}", bool(check_caption(bad)), bad)

    # A RE-PUBLISH IS A REPLACEMENT. Two cards with one id is a deep link that lands on
    # whichever the browser reached first, which is a bug that only shows up on a re-run.
    feed = {"videos": [entry("2026-08-18", board, good, "Williamson", False, False)]}
    feed = publish(feed, entry("2026-08-18", {**board, "title": "A retitled cut"},
                               good, "Williamson", False, False))
    ok("a second publish for the same date replaces rather than duplicates",
       len(feed["videos"]) == 1 and feed["videos"][0]["title"] == "A retitled cut",
       json.dumps(feed))

    feed = publish(feed, entry("2026-08-19", board, good, "Travis", False, False))
    ok("a new date goes on the front", feed["videos"][0]["date"] == "2026-08-19"
       and len(feed["videos"]) == 2)
    ok("media_base is set when the feed had none", "media_base" in feed)

    print(f"publish_feed: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date")
    ap.add_argument("--caption")
    ap.add_argument("--county")
    ap.add_argument("--docket", default=str(REPO.parent / "TexasAIDocket"))
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    for v in ("date", "caption", "county"):
        if not getattr(a, v):
            print(f"publish_feed: missing --{v}", file=sys.stderr)
            return 2

    run = REPO / "runs" / a.date
    for f in ("dispatch.mp4", "poster.png", "storyboard.json"):
        if not (run / f).exists():
            print(f"publish_feed: runs/{a.date}/{f} does not exist. Deliver the run first.",
                  file=sys.stderr)
            return 1

    bad = check_caption(a.caption)
    if bad:
        print("\npublish_feed: the caption breaks house style\n", file=sys.stderr)
        for x in bad:
            print(f"  - {x}", file=sys.stderr)
        return 1

    print("renditions")
    has_mobile, has_thumb = renditions(run)

    board = json.loads((run / "storyboard.json").read_text(encoding="utf-8"))
    new = entry(a.date, board, a.caption, a.county, has_mobile, has_thumb)

    target = Path(a.docket) / "docs" / "videos" / "videos.json"
    if not target.parent.exists():
        print(f"publish_feed: {target.parent} does not exist. Is --docket right?",
              file=sys.stderr)
        return 1
    feed = {}
    if target.exists():
        feed = json.loads(target.read_text(encoding="utf-8"))
        if not isinstance(feed, dict):
            feed = {"videos": feed}
    feed = publish(feed, new)
    target.write_text(json.dumps(feed, indent=2) + "\n", encoding="utf-8")

    print(f"\npublished {new['id']} to {target}")
    print(json.dumps(new, indent=2))
    print(f"\nThe feed now holds {len(feed['videos'])} film(s). NEXT, and not in this script, "
          f"because writing the feed changes a number the site displays:\n"
          f"  cd {a.docket} && echo dispatch > .git/ACTOR\n"
          f"  python3 scripts/site/site_build.py && python3 scripts/site/site_fresh_check.py\n"
          f"  python3 scripts/shared/ownership_check.py --actor dispatch --diff HEAD")
    return 0


if __name__ == "__main__":
    sys.exit(main())
