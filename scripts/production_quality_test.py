#!/usr/bin/env python3
"""Adversarial tests through production entry points, using explicitly synthetic media."""
import copy
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch
import numpy as np
from PIL import Image
import production_quality as q
import run_controller as controller
import documentary_review
from render_manifest import build as manifest
from master_audio import master
from mix import write_wav

def write(path, value):
    path.write_text(json.dumps(value))
    return path

def run(*args):
    return subprocess.run(args, capture_output=True, text=True)

def receipt(root, film, role):
    raw = {"responseId": "synthetic-test-" + role, "candidates": [{"content": {"parts": [{"text": json.dumps({
        "pass": True, "audio_access": True,
        "visual_observations": [{"at_s": .1, "observation": "Synthetic red panel before the blue transformation."},
                                {"at_s": 1.0, "observation": "Synthetic blue panel after the deliberately visible change."}],
        "audio_observations": [{"at_s": .2, "observation": "Synthetic steady tone used only for this test fixture."},
                               {"at_s": 2.0, "observation": "Synthetic continuous tone used only for this test fixture."}],
        "pacing": "Synthetic test fixture has one deliberately visible transition.",
        "comprehension": "Synthetic test fixture is not an editorial approval.",
        "weakest_interval": "Synthetic constant color ending from one to four seconds.",
        "dimensional_action": "Synthetic pixel fixture does not claim to be a creative review."
    })}]}}]}
    response = write(root / (role + "-response.json"), raw)
    path = write(root / (role + "-review.json"), {
        "film_sha256": q.digest(film), "role": role, "request_id": "synthetic-test-" + role,
        "response": {"file": response.name, "sha256": q.digest(response)}})
    return path

def main():
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        cinema = root / "cinema"
        cinema.mkdir()
        wav = root / "mix.wav"
        rate = 24000
        t = np.arange(rate * 4) / rate
        write_wav(wav, .006 * np.sin(2 * np.pi * 440 * t), rate)
        assert q.audio_problems(wav), "quiet audio must fail before mastering"
        original_samples = len(t)
        result = master(wav)
        assert result["samples"] == original_samples
        assert not q.audio_problems(wav), "mastered audio must meet the measured policy"
        film = root / "film.mp4"
        r = run(q.FFMPEG, "-v", "error", "-y", "-f", "lavfi", "-i",
                "color=red:s=1080x1920:r=30:d=4,drawbox=color=blue:t=fill:enable='gte(t,0.5)'",
                "-i", str(wav), "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "320k", str(film))
        assert r.returncode == 0, r.stderr
        assert not q.audio_problems(film)
        board = write(root / "storyboard.json", {
            "date": "2026-09-25", "runtime_s": 4,
            "cinema": {"version": q.policy()["version"], "dimensional_scene_ids": ["s1"],
                       "hero_scene_id": "s1", "visible_action": "Test color changes from red to blue.",
                       "human_consequence": "Synthetic fixture only, no factual human claim.",
                       "source_limit": "Synthetic fixture only, never publish this test."},
            "scenes": [{"id": "s1", "start_s": 0, "duration_s": 4,
                        "visual_events": [{"at_s": .1, "duration_s": .8}]}]})
        proof = {"board_sha256": q.digest(board), "engine_sha256": q.engine_sha256(),
                 "policy_sha256": q.digest(q.POLICY), "mix_sha256": q.digest(wav),
                 "hero": {"file": "hero.mp4", "sha256": q.digest(film)}, "samples": {"s1": []}}
        (cinema / "hero.mp4").write_bytes(film.read_bytes())
        receipt(cinema, cinema / "hero.mp4", "hero")
        for i, at in enumerate((.1, .9)):
            normal = cinema / f"normal-{i}.png"
            Image.fromarray(q.frame(film, at, 1080, 1920)).save(normal)
            removed = cinema / f"removed-{i}.png"
            Image.new("RGB", (1080, 1920), "black").save(removed)
            proof["samples"]["s1"].append({
                "normal": {"file": normal.name, "sha256": q.digest(normal)},
                "without_stage": {"file": removed.name, "sha256": q.digest(removed)}})
        proof_path = write(cinema / "proof.json", proof)
        judges = []
        for role in ("picture", "story", "sound"):
            p = receipt(cinema, film, role)
            judges.append({"audiovisual_role": role, "audiovisual_receipt_sha256": q.digest(p)})
        assert not q.publication_problems(board, film, judges), q.publication_problems(board, film, judges)
        print("PASS complete synthetic evidence validates, including actual encoded audio and frame comparison")
        for key in ("board_sha256", "engine_sha256", "policy_sha256"):
            bad = copy.deepcopy(proof); bad[key] = "stale"; write(proof_path, bad)
            assert q.preview_problems(board, cinema), key
        write(proof_path, proof)
        assert q.preview_problems(board, cinema, mix=film), "changed mix must invalidate preview"
        bad = copy.deepcopy(proof)
        bad["samples"]["s1"][0]["without_stage"] = bad["samples"]["s1"][0]["normal"]
        write(proof_path, bad)
        assert any("too little" in x for x in q.preview_problems(board, cinema)), "unused stage must fail"
        write(proof_path, proof)
        changed = q.read(board)
        changed["cinema"]["dimensional_scene_ids"] = []
        assert q.plan_problems(changed)
        assert q.publication_problems(board, film, judges[:2])
        bad_judges = copy.deepcopy(judges); bad_judges[2] = bad_judges[1]
        assert q.publication_problems(board, film, bad_judges)
        response_path = cinema / "sound-response.json"
        raw = q.read(response_path)
        answer = json.loads(raw["candidates"][0]["content"]["parts"][0]["text"])
        answer["audio_access"] = False
        raw["candidates"][0]["content"]["parts"][0]["text"] = json.dumps(answer)
        write(response_path, raw)
        assert q.publication_problems(board, film, judges), "edited or transcript-only review must fail"
        receipt(cinema, film, "sound")
        judges[2]["audiovisual_receipt_sha256"] = q.digest(cinema / "sound-review.json")
        bad = copy.deepcopy(proof)
        changed_frame = cinema / "changed.png"
        Image.new("RGB", (1080, 1920), "lime").save(changed_frame)
        bad["samples"]["s1"][0]["normal"] = {"file": changed_frame.name, "sha256": q.digest(changed_frame)}
        write(proof_path, bad)
        assert any("final pixels differ" in e for e in q.preview_problems(board, cinema, film=film))
        write(proof_path, proof)
        duplicate = q.read(cinema / "sound-response.json")
        duplicate["responseId"] = q.read(cinema / "picture-response.json")["responseId"]
        write(cinema / "sound-response.json", duplicate)
        sr = q.read(cinema / "sound-review.json")
        sr["response"]["sha256"] = q.digest(cinema / "sound-response.json")
        write(cinema / "sound-review.json", sr)
        judges[2]["audiovisual_receipt_sha256"] = q.digest(cinema / "sound-review.json")
        assert any("same provider response" in e for e in q.publication_problems(board, film, judges))
        receipt(cinema, film, "sound")
        judges[2]["audiovisual_receipt_sha256"] = q.digest(cinema / "sound-review.json")
        # Remove required evidence and exercise real acceptance paths.
        proof_path.unlink()
        assert q.publication_problems(board, film, judges)
        args = [sys.executable, str(q.REPO / "scripts/production_quality.py"), "--board", str(board), "--film", str(film)]
        assert run(*args).returncode != 0
        state_path = root / "state.json"
        assert controller.initialise(state_path, "2026-09-25", "production")[0]
        manifest_path = write(root / "render-manifest.json", manifest(film, board))
        assert controller.register_deliverable(state_path, film, board, manifest_path)[0]
        report = write(root / "report_card.json", {"score": controller.threshold() + 1, "hard_fails": [], "judges": judges})
        accepted, message = controller.finish(state_path, "publishable", report=report)
        assert not accepted and "cinematic" in message, message
        accepted, message = controller.check_verification(state_path, report)
        assert not accepted and "cinematic" in message, message
        # Exercise the real shared function called by both triage and ship_gate.
        attention = write(root / "attention-review.json", {})
        with patch.object(documentary_review.direction, "check", return_value=[]),              patch.object(documentary_review, "report_problems", return_value=[]),              patch.object(documentary_review, "panel_problems", return_value=[]):
            errors = documentary_review.publication_problems(board, film, judges)
            assert any("cinematic" in e for e in errors), errors
        for caller, required_call in [
            ("render_dispatch.sh", "scripts/production_quality.py"),
            ("publish_feed.py", "publication_problems(run"),
            ("documentary_review.py", "quality_problems(board_path, film, judges)"),
            ("preship_check.py", "documentary_review.py"),
            ("ship_gate.py", "documentary_review.publication_problems"),
            ("panel_triage.py", "documentary_review.publication_problems"),
            ("deliver_run.sh", "run_gate ship_gate"),
        ]:
            assert required_call in (q.REPO / "scripts" / caller).read_text(), caller
        print("PASS stale inputs, missing proof, unused stage, duplicate judges and unavailable audio are refused")
        print("PASS publishable controller and delivery verification refuse a high score without cinematic proof")
        for day in ("2026-09-19", "2026-09-20", "2026-09-24"):
            b = q.REPO / "runs" / day / "storyboard.json"
            f = b.parent / "dispatch.mp4"
            assert not q.publication_problems(b, f, []), day
        repository = root / "ci-repository"
        repository.mkdir()
        def git(*args):
            r = subprocess.run(["git", *args], cwd=repository, capture_output=True, text=True)
            assert r.returncode == 0, r.stderr
        git("init", "-q")
        git("-c", "user.name=Talon Sturgill", "-c", "user.email=Talon.sturgill@gmail.com",
            "commit", "--allow-empty", "-qm", "Synthetic CI base")
        edition = repository / "runs" / "2026-09-25"
        edition.mkdir(parents=True)
        (edition / "storyboard.json").write_bytes(board.read_bytes())
        (edition / "dispatch.mp4").write_bytes(film.read_bytes())
        (edition / "report_card.json").write_bytes(report.read_bytes())
        git("add", "runs")
        git("-c", "user.name=Talon Sturgill", "-c", "user.email=Talon.sturgill@gmail.com",
            "commit", "-qm", "Synthetic unproven edition")
        assert q.changed_runs("HEAD^", repository), "CI must reject a manually committed unproven film"
        print("PASS Git-diff CI path rejects a manually committed unproven edition")
        print("PASS already published editions retain their original review contract")
    return 0

if __name__ == "__main__":
    sys.exit(main())
