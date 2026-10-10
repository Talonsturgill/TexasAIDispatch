"""Canonical phone playback through real cloud Chromium UI automation.

The Codex route used Computer Use on a desktop. A Claude cloud session has no desktop, so this
tool drives a real Chromium page emulating a 390x844 phone against the published canonical URL.
It does not call video.play() or set a source. It finds the edition's own stage, taps its Play
button with real touch input, taps the page's "tap for sound" control when the feed starts muted,
and samples the media element while the clock runs. The output is the `phone_playback` evidence
that shipment_check.playback_problems already accepts, plus interaction proof the Claude route adds.

The tool name is recorded honestly. This is automation of a headless browser, not Computer Use.
Remotion's managed chrome-headless-shell is used because it decodes H.264. Playwright's own bundled
Chromium reports no avc1 support and cannot play the published renditions at all.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parents[1]
SCHEMA = "dispatch_phone_playback/2"
VIEWPORT = {"width": 390, "height": 844}
H264 = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'

PROBE = """(src) => {
  const all = [...document.querySelectorAll('video')];
  const v = all.find(x => (x.currentSrc || x.src || x.dataset.src) === src);
  if (!v) return null;
  const e = v.error;
  return {currentSrc: v.currentSrc, currentTime: v.currentTime, duration: v.duration,
          readyState: v.readyState, networkState: v.networkState, paused: v.paused,
          ended: v.ended, muted: v.muted, volume: v.volume,
          videoWidth: v.videoWidth, videoHeight: v.videoHeight,
          error: e ? {code: e.code, message: e.message} : null,
          bodyClass: document.body.className};
}"""

# Records whether the tap that started playback was a trusted user event, which a script's
# synthetic dispatchEvent or a direct video.play() can never be.
LISTENER = """() => {
  window.__dispatchInputs = [];
  for (const type of ['pointerup', 'touchend', 'click']) {
    document.addEventListener(type, (event) => {
      const t = event.target;
      window.__dispatchInputs.push({type, isTrusted: event.isTrusted,
        target: (t.id ? '#' + t.id : '') + (t.className && t.className.baseVal === undefined ? '.' + String(t.className).split(' ').join('.') : t.tagName.toLowerCase()),
        label: t.getAttribute ? (t.getAttribute('aria-label') || t.textContent || '').trim().slice(0, 40) : ''});
    }, true);
  }
}"""


def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def fetch_bytes(url, timeout=120):
    request = urllib.request.Request(url, headers={"User-Agent": "texas-ai-dispatch-phone-playback"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def managed_browser():
    """Remotion's pinned headless shell, resolved from the locked engine install."""
    found = sorted((REPO / "video-engine/node_modules/.remotion").glob("chrome-headless-shell/*/*/chrome-headless-shell"))
    if not found:
        raise RuntimeError("managed Remotion browser is missing; run scripts/cloud_bootstrap.py --install")
    return found[0]


def edition_urls(feed_url, edition_id):
    feed = json.loads(fetch_bytes(feed_url))
    base = str(feed.get("media_base") or "").rstrip("/")
    for entry in feed["videos"]:
        if entry.get("id") == edition_id:
            def media(key):
                value = entry[key]
                return value if value.startswith("https://") else base + "/" + value.lstrip("/")
            return media("video"), media("video_mobile")
    raise ValueError(f"edition {edition_id} is not in the published feed")


def tap(page, locator, record, name):
    """Real touch input at the control's centre, never an element.click() from script."""
    locator.scroll_into_view_if_needed(timeout=5000)
    box = locator.bounding_box()
    if not box:
        raise RuntimeError(f"{name} has no visible box to tap")
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.touchscreen.tap(x, y)
    record.append({"action": "touch_tap", "control": name, "x": round(x, 1), "y": round(y, 1), "at": now()})


def observe(page, mobile_url, shot_dir, label, shots):
    state = page.evaluate(PROBE, mobile_url)
    if state is None:
        raise RuntimeError("the edition's video element is not on the page")
    path = shot_dir / f"{label}.png"
    page.screenshot(path=str(path))
    # Inside the repository the evidence is portable, so a later checkout can verify it.
    try:
        shown = str(path.resolve().relative_to(REPO))
    except ValueError:
        shown = str(path)
    shots.append({"label": label, "path": shown, "sha256": digest(path)})
    return {**state, "observed_at": now()}


def run(args):
    from playwright.sync_api import sync_playwright
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    master_url, mobile_url = edition_urls(args.feed_url, args.edition_id)
    bytes_check = {}
    if args.verify_bytes:
        for name, url in (("master", master_url), ("mobile", mobile_url)):
            data = fetch_bytes(url)
            bytes_check[name] = {"url": url, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        if bytes_check["master"]["sha256"] != args.film_sha256:
            raise ValueError("the published master does not serve the expected film hash")
    live_url = args.url or f"{args.site.rstrip('/')}/videos/#{args.edition_id}"
    console, failures, clicks, samples, shots = [], [], [], [], []
    paused_state = None
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=str(managed_browser()))
        try:
            context = browser.new_context(viewport=VIEWPORT, device_scale_factor=2, is_mobile=True, has_touch=True,
                                          user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
                                                      "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"))
            page = context.new_page()
            page.add_init_script("(" + LISTENER + ")()")
            page.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}) if m.type in {"error", "warning"} else None)
            page.on("pageerror", lambda e: console.append({"type": "pageerror", "text": str(e)[:300]}))
            page.on("requestfailed", lambda r: failures.append({"url": r.url[:200], "failure": r.failure}))
            engine = browser.version
            can_play = page.evaluate("(t) => document.createElement('video').canPlayType(t)", H264)
            page.goto(live_url, wait_until="networkidle", timeout=60000)
            page.wait_for_function("() => document.body.classList.contains('feedready')", timeout=30000)
            # The hash selects the edition; the page then scrolls to it and loads its stage.
            page.wait_for_function("(src) => [...document.querySelectorAll('video')].some(v => (v.currentSrc || v.src) === src)",
                                   arg=mobile_url, timeout=30000)
            stage = page.locator(".stage", has=page.locator(f'video[data-src="{mobile_url}"]')).first
            stage.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(1500)
            baseline = observe(page, mobile_url, out, "01-before-tap", shots)
            play = stage.locator("button.tap")
            playing = "(src) => [...document.querySelectorAll('video')].some(v => (v.currentSrc || v.src) === src && !v.paused && v.readyState >= 2)"
            paused = "(src) => [...document.querySelectorAll('video')].some(v => (v.currentSrc || v.src) === src && v.paused)"
            # The feed autoplays muted. A real tap toggles pause, so the proof is a tap that pauses
            # and a second tap that plays again, whichever state the page loaded in.
            if baseline["paused"]:
                tap(page, play, clicks, "play-pause")
            else:
                tap(page, play, clicks, "play-pause")
                page.wait_for_function(paused, arg=mobile_url, timeout=10000)
                paused_state = observe(page, mobile_url, out, "02-paused-by-tap", shots)
                tap(page, play, clicks, "play-pause")
            page.wait_for_function(playing, arg=mobile_url, timeout=30000)
            if page.evaluate("() => document.body.classList.contains('muted')"):
                tap(page, page.locator("#unmute"), clicks, "tap-for-sound")
                page.wait_for_function("() => !document.body.classList.contains('muted')", timeout=10000)
                page.wait_for_function(playing, arg=mobile_url, timeout=10000)
            samples.append(observe(page, mobile_url, out, "03-playing-a", shots))
            page.wait_for_timeout(int(args.interval * 1000))
            samples.append(observe(page, mobile_url, out, "04-playing-b", shots))
            page.wait_for_timeout(int(args.interval * 1000))
            samples.append(observe(page, mobile_url, out, "05-playing-c", shots))
            inputs = page.evaluate("() => window.__dispatchInputs")
        finally:
            browser.close()
    result = {
        "schema": SCHEMA,
        "url": live_url,
        "edition_id": args.edition_id,
        "master_sha256": args.film_sha256,
        "master_url": master_url,
        "mobile_url": mobile_url,
        "tool": f"playwright-python {args.playwright_version} driving Remotion chrome-headless-shell {engine} "
                f"in a cloud Linux container, emulated touch phone. Browser UI automation, not Computer Use.",
        "observed_at": now(),
        "viewport": dict(VIEWPORT),
        "device_scale_factor": 2,
        "h264_support": can_play,
        "before_tap": baseline,
        "paused_by_tap": paused_state,
        "interactions": clicks,
        "input_events": inputs,
        "samples": samples,
        "screenshots": [{k: s[k] for k in ("label", "path", "sha256")} for s in shots],
        "published_bytes": bytes_check,
        "console": console,
        "failed_requests": failures,
    }
    target = out / "phone_playback.json"
    target.write_text(json.dumps(result, indent=2) + "\n")
    return target, result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--edition-id", required=True)
    parser.add_argument("--film-sha256", required=True, help="reviewed master hash; the published master must serve it")
    parser.add_argument("--out-dir", required=True, help="keep outside the shipped runs directory")
    parser.add_argument("--site", default="https://texasaidocket.com")
    parser.add_argument("--url", help="canonical URL when it differs from <site>/videos/#<edition-id>")
    parser.add_argument("--interval", type=float, default=2.5)
    parser.add_argument("--no-verify-bytes", dest="verify_bytes", action="store_false")
    args = parser.parse_args(argv)
    from importlib.metadata import version
    args.playwright_version = version("playwright")
    args.feed_url = args.site.rstrip("/") + "/videos/videos.json"
    target, result = run(args)
    from shipment_check import playback_problems, claude_playback_problems
    problems = playback_problems(result, result["url"], result["mobile_url"], result["master_sha256"])
    problems += claude_playback_problems(result)
    print(json.dumps({"evidence": str(target), "problems": problems}, indent=2))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    raise SystemExit(main())
