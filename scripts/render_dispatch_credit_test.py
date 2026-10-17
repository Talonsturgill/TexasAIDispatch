"""The render entry point refuses a film that mixes a music bed but carries no credit for it.

On the 2026-10-15 edition the end card carried sources and no music line while the mix held a
Creative Commons bed. Nothing noticed until delivery, after the render, the reviews and the panel
had all been spent on a cut that could not ship. render_dispatch.sh now runs the music package
check first, before it reserves anything.
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


def run(bed):
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        wav = root / "mix.wav"
        wav.write_bytes(b"RIFFfake")
        board = root / "storyboard.json"
        board.write_text(json.dumps({"credits": "TEXAS AI DOCKET\nSOURCES\nA source\n", "runtime_s": 1, "credits_s": 1}))
        (root / "mix.json").write_text(json.dumps({
            "bed": bed, "duration_s": 2, "master_sha256": hashlib.sha256(wav.read_bytes()).hexdigest(),
            "bed_track_id": "sincerely" if bed else ""}))
        (root / "captions.json").write_text("{}")
        state = root / "run_state.json"
        state.write_text("{}")
        before = state.read_bytes()
        done = subprocess.run(
            ["bash", str(SCRIPT), "--board", str(board), "--mix", str(wav), "--captions", str(root / "captions.json"),
             "--state", str(state)], capture_output=True, text=True, cwd=REPO)
        return done, state.read_bytes() == before


class RenderCreditGate(unittest.TestCase):
    def test_a_mixed_bed_without_its_credit_stops_before_anything_is_reserved(self):
        done, untouched = run(True)
        self.assertEqual(done.returncode, 2, done.stderr)
        self.assertIn(MESSAGE, done.stderr)
        self.assertTrue(untouched, "the ledger must not change before the credit is correct")

    def test_the_gate_is_skipped_when_no_bed_is_mixed(self):
        done, _ = run(False)
        self.assertNotIn(MESSAGE, done.stderr)

    def test_the_gate_sits_before_the_first_reservation(self):
        text = SCRIPT.read_text()
        self.assertLess(text.index("--verify-package"), text.index("consume --resource full_renders"))


if __name__ == "__main__":
    unittest.main()
