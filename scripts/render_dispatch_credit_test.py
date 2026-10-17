"""The render entry point runs the music package check first, unconditionally.

On the 2026-10-15 edition the end card carried sources and no music line while the mix held a
Creative Commons bed. Nothing noticed until delivery, after the render, the reviews and the panel
had all been spent on a cut that could not ship. render_dispatch.sh now runs the same
music.py --verify-package before it reserves anything. These tests drive the real entry point.
"""
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "render_dispatch.sh"
MESSAGE = "the music package is incomplete"
CREDITS = "TEXAS AI DOCKET\nSOURCES\nA source\n"


def run(mix_report="valid-no-bed", credits_file=CREDITS, board_credits=CREDITS):
    """Run the entry point on a temporary package and report (result, ledger untouched)."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        wav = root / "mix.wav"
        wav.write_bytes(b"RIFFfake")
        (root / "storyboard.json").write_text(json.dumps({"credits": board_credits, "runtime_s": 1, "credits_s": 1}))
        digest = hashlib.sha256(wav.read_bytes()).hexdigest()
        report = root / "mix.json"
        if mix_report == "valid-no-bed":
            report.write_text(json.dumps({"bed": False, "duration_s": 2, "master_sha256": digest}))
        elif mix_report == "bed-without-credit":
            report.write_text(json.dumps({"bed": True, "bed_track_id": "sincerely", "duration_s": 2,
                                          "master_sha256": digest}))
        elif mix_report == "malformed":
            report.write_text("{not json")
        # "missing" writes no report at all
        if credits_file is not None:
            (root / "credits.txt").write_text(credits_file)
        (root / "captions.json").write_text("{}")
        state = root / "run_state.json"
        state.write_text("{}")
        before = state.read_bytes()
        done = subprocess.run(
            ["bash", str(SCRIPT), "--board", str(root / "storyboard.json"), "--mix", str(wav),
             "--captions", str(root / "captions.json"), "--state", str(state)],
            capture_output=True, text=True, cwd=REPO)
        return done, state.read_bytes() == before


class RenderCreditGate(unittest.TestCase):
    def refused(self, done, untouched):
        self.assertEqual(done.returncode, 2, done.stderr)
        self.assertIn(MESSAGE, done.stderr)
        self.assertTrue(untouched, "the ledger must not change before the package is correct")

    def test_a_missing_mix_report_stops_before_anything_is_reserved(self):
        self.refused(*run(mix_report="missing"))

    def test_a_malformed_mix_report_stops_before_anything_is_reserved(self):
        self.refused(*run(mix_report="malformed"))

    def test_a_mixed_bed_with_no_music_credit_stops_before_anything_is_reserved(self):
        self.refused(*run(mix_report="bed-without-credit"))

    def test_credits_that_differ_from_the_board_stop_before_anything_is_reserved(self):
        self.refused(*run(credits_file=CREDITS + "EXTRA\n"))

    def test_a_valid_no_bed_package_passes_the_gate(self):
        done, _ = run()
        self.assertNotIn(MESSAGE, done.stderr)

    def test_the_gate_sits_before_the_first_reservation(self):
        text = SCRIPT.read_text()
        self.assertLess(text.index("--verify-package"), text.index("consume --resource full_renders"))


if __name__ == "__main__":
    unittest.main()
