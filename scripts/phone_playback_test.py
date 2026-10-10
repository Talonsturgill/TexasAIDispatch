"""Phone playback evidence: the retained real Chromium record passes, and each way to fake it fails."""
import copy
import hashlib
import json
import os
import tempfile
import unittest
from pathlib import Path

import shipment_check as shipment

REPO = Path(__file__).resolve().parents[1]
RECORD = REPO / "knowledge/validation/2026-10-10-claude-phone-playback/phone_playback.json"
FILM = "643bb423a902c14ac87ec76bc9e32f14b4cb25cd56e7d6acd53179ede89477cc"
LIVE = "https://texasaidocket.com/videos/#2026-10-09-freight-moves-the-observer-stays"
MOBILE = "https://raw.githubusercontent.com/Talonsturgill/TexasAIDispatch/main/runs/2026-10-09/dispatch-720.mp4"


def problems(raw):
    return (shipment.playback_problems(raw, LIVE, MOBILE, FILM)
            + shipment.claude_playback_problems(raw))


class PhonePlaybackEvidence(unittest.TestCase):
    def setUp(self):
        self.cwd = os.getcwd()
        os.chdir(REPO)  # screenshot paths in the record are repository relative
        self.raw = json.loads(RECORD.read_text())

    def tearDown(self):
        os.chdir(self.cwd)

    def test_retained_oct9_observation_passes_every_assertion(self):
        self.assertEqual([], problems(self.raw))
        self.assertEqual(LIVE, self.raw["url"])
        self.assertEqual(MOBILE, self.raw["samples"][0]["currentSrc"])
        self.assertEqual(FILM, self.raw["master_sha256"])
        self.assertEqual(FILM, self.raw["published_bytes"]["master"]["sha256"])

    def test_tool_is_named_honestly(self):
        self.assertIn("not Computer Use", self.raw["tool"])
        lying = copy.deepcopy(self.raw)
        lying["tool"] = "Computer Use"
        self.assertTrue(any("browser automation" in e for e in problems(lying)))

    def fails(self, mutate, expected):
        raw = copy.deepcopy(self.raw)
        mutate(raw)
        found = problems(raw)
        self.assertTrue(any(expected in e for e in found), found)

    def test_scripted_play_without_trusted_input_fails(self):
        def scripted(raw):
            raw["input_events"] = [dict(e, isTrusted=False) for e in raw["input_events"]]
        self.fails(scripted, "no trusted user input")

    def test_no_tap_on_the_play_control_fails(self):
        self.fails(lambda r: r.update(interactions=[i for i in r["interactions"] if i["control"] != "play-pause"]),
                   "real tap on the page's Play control")

    def test_clock_that_does_not_advance_fails(self):
        def frozen(raw):
            for sample in raw["samples"]:
                sample["currentTime"] = 3.0
        self.fails(frozen, "strictly advancing clock")

    def test_two_samples_are_not_enough_for_the_cloud_route(self):
        self.fails(lambda r: r.update(samples=r["samples"][:2]), "at least three samples")

    def test_muted_playback_fails(self):
        def muted(raw):
            raw["samples"][-1]["muted"] = True
        self.fails(muted, "not audible")

    def test_feed_that_started_muted_needs_a_sound_tap(self):
        self.fails(lambda r: r.update(interactions=[i for i in r["interactions"] if i["control"] != "tap-for-sound"]),
                   "no tap enabled sound")

    def test_wrong_source_fails(self):
        def other(raw):
            raw["samples"][1]["currentSrc"] = MOBILE.replace("2026-10-09", "2026-10-08")
        self.fails(other, "published rendition")

    def test_media_error_and_unready_media_fail(self):
        self.fails(lambda r: r["samples"][0].update(error={"code": 4, "message": "unsupported"}), "published rendition")
        self.fails(lambda r: r["samples"][0].update(readyState=0), "published rendition")

    def test_desktop_viewport_fails(self):
        self.fails(lambda r: r.update(viewport={"width": 1280, "height": 800}), "phone viewport")
        self.fails(lambda r: r.update(viewport={"width": 360, "height": 800}), "390x844")

    def test_browser_without_h264_fails(self):
        self.fails(lambda r: r.update(h264_support=""), "H.264")

    def test_page_error_fails(self):
        self.fails(lambda r: r.update(console=[{"type": "pageerror", "text": "boom"}]), "uncaught error")

    def test_other_film_fails(self):
        self.fails(lambda r: r.update(master_sha256="0" * 64), "another edition")

    def test_published_bytes_must_be_hashed(self):
        self.fails(lambda r: r.update(published_bytes={}), "hash the published master")

    def test_changed_screenshot_is_detected(self):
        with tempfile.TemporaryDirectory() as directory:
            copied = Path(directory) / "shot.png"
            copied.write_bytes(b"not the screenshot")
            raw = copy.deepcopy(self.raw)
            raw["screenshots"][0] = {"label": "x", "path": str(copied), "sha256": hashlib.sha256(b"other").hexdigest()}
            self.assertTrue(any("missing or changed" in e for e in problems(raw)))

    def test_identical_screenshots_do_not_show_motion(self):
        def same(raw):
            first = raw["screenshots"][0]
            raw["screenshots"] = [first, dict(first)]
        self.fails(same, "page change while playing")

    def test_historical_computer_use_record_keeps_its_original_standard(self):
        legacy = {"url": LIVE, "master_sha256": FILM, "tool": "Computer Use", "observed_at": "2026-10-09T00:00:00Z",
                  "viewport": {"width": 390, "height": 844},
                  "samples": [{"currentSrc": MOBILE, "currentTime": 1.0, "readyState": 4, "paused": False, "error": None},
                              {"currentSrc": MOBILE, "currentTime": 3.0, "readyState": 4, "paused": False, "error": None}],
                  "screenshots": copy.deepcopy(self.raw["screenshots"][:1])}
        self.assertEqual([], shipment.playback_problems(legacy, LIVE, MOBILE, FILM))
        self.assertEqual([], shipment.claude_playback_problems(legacy))


if __name__ == "__main__":
    unittest.main()
