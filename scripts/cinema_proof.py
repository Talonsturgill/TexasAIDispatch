#!/usr/bin/env python3
"""Render a full-quality hero passage and measure the shared stage's visible contribution."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from production_quality import REPO, POLICY, digest, engine_sha256, read, plan_problems
from run_controller import reserve

def run(argv, cwd=None):
    subprocess.run(argv, cwd=cwd, check=True)

def build(board, mix, state):
    board_bytes = board.read_bytes()
    data = json.loads(board_bytes)
    expected = {"board_sha256": hashlib.sha256(board_bytes).hexdigest(),
                "engine_sha256": engine_sha256(), "policy_sha256": digest(POLICY),
                "mix_sha256": digest(mix)}
    errors = plan_problems(data)
    if errors or not data.get("cinema"):
        raise ValueError("; ".join(errors) or "a current cinema plan is required")
    ok, message = reserve(state, {"preflight_renders": 1}, "finished cinematic hero and stage ablation batch")
    if not ok:
        raise ValueError(message)
    root = board.parent / "cinema"
    root.mkdir(parents=True, exist_ok=True)
    # Invalidate old approval before starting a new attempt.
    (root / "proof.json").unlink(missing_ok=True)
    (root / "hero-review.json").unlink(missing_ok=True)
    props = root / "render-props.json"
    props.write_bytes(board_bytes)
    without = root / "without-stage-props.json"
    without.write_text(json.dumps(dict(data, __cinemaProofWithoutStage=True)))
    scenes = {s["id"]: s for s in data["scenes"]}
    hero = scenes[data["cinema"]["hero_scene_id"]]
    passage_end = scenes[data["cinema"].get("hero_passage_end_scene_id", hero["id"])]
    begin = round(float(hero["start_s"]) * 30)
    end = round((float(passage_end["start_s"]) + float(passage_end["duration_s"])) * 30) - 1
    base = ["npx", "remotion"]
    args = ["--gl=angle", "--concurrency=50%", "--log=error"]
    run(base + ["render", "Dispatch", str((root / "hero-silent.mp4").resolve()),
                "--props=" + str(props.resolve()), f"--frames={begin}-{end}"] + args,
        REPO / "video-engine")
    clip = root / "hero.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(root / "hero-silent.mp4"),
         "-ss", str(begin / 30), "-i", str(mix), "-t", str((end - begin + 1) / 30),
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", str(clip)])
    def entry(path):
        return {"file": path.name, "sha256": digest(path)}
    proof = {**expected, "hero": entry(clip), "samples": {}}
    for sid in data["cinema"]["dimensional_scene_ids"]:
        scene = scenes[sid]
        ev = scene["visual_events"][0]
        start = float(scene["start_s"]) + float(ev["at_s"])
        times = [start, start + float(ev["duration_s"])]
        pairs = []
        for index, at in enumerate(times):
            pair = {}
            for kind, sample_props in (("normal", props), ("without_stage", without)):
                path = root / f"{sid}-{index}-{kind}.png"
                run(base + ["still", "Dispatch", str(path.resolve()),
                            "--props=" + str(sample_props.resolve()), "--frame=" + str(round(at * 30)),
                            "--gl=angle", "--log=error"], REPO / "video-engine")
                pair[kind] = entry(path)
            pairs.append(pair)
        proof["samples"][sid] = pairs
    actual = {"board_sha256": digest(board), "engine_sha256": engine_sha256(),
              "policy_sha256": digest(POLICY), "mix_sha256": digest(mix)}
    if actual != expected:
        raise ValueError("production inputs changed during hero rendering; preview approval invalid")
    (root / "proof.json").write_text(json.dumps(proof, indent=2) + "\n")
    print("cinema_proof: rendered proof; hero audiovisual approval is still required")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board", type=Path, default=Path("out/dispatch/storyboard.json"))
    p.add_argument("--mix", type=Path, default=Path("out/dispatch/mix.wav"))
    p.add_argument("--state", type=Path, default=Path("out/dispatch/run_state.json"))
    a = p.parse_args()
    try:
        build(a.board, a.mix, a.state)
    except (ValueError, OSError, KeyError, subprocess.SubprocessError) as e:
        print("cinema_proof: " + str(e), file=sys.stderr)
        sys.exit(1)
