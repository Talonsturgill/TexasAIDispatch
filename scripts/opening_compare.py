#!/usr/bin/env python3
"""Render exactly two cheap opening alternatives in one reserved shared batch.

Both cuts share the same body. The existing phone critic chooses between the actual
preview bytes, then the chosen film becomes the first phone preflight without a rerender.
"""
from __future__ import annotations
import argparse
import copy
import json
from pathlib import Path
import subprocess
import sys
import creative_production as creative

REPO = Path(__file__).resolve().parents[1]


def body(board):
    value = copy.deepcopy(board)
    opening = value["scenes"][0]["id"]
    value["scenes"] = value["scenes"][1:]
    if "cinema" in value:
        value["cinema"]["dimensional_scene_ids"] = [sid for sid in value["cinema"].get("dimensional_scene_ids", []) if sid != opening]
    value.get("quality_plan", {})["scenes"] = value.get("quality_plan", {}).get("scenes", [])[1:]
    value.get("creative_direction", {})["edits"] = value.get("creative_direction", {}).get("edits", [])[1:]
    return value


def build(root, state):
    root, state = Path(root).resolve(), Path(state).resolve()
    if state.parent != root:
        raise ValueError("opening batch must use its edition's existing controller")
    from run_controller import reserve, read_state, preflight_identity
    from critic_gate import problems, renderer_digest
    from daily_production import structure_problems
    from storyboard_check import check
    from render_manifest import native_media_paths
    from super_evidence_check import check as supers
    from script_evidence_check import check as narration
    from story_selection_check import problems as selection_problems
    from engine_lint import check_files, LIB
    from documentary_check import check as documentary
    boards = [creative.read(root / f"opening-{key}.json") for key in ("a", "b")]
    ledger = read_state(state)
    if ledger["run_id"] != boards[0].get("date") or creative.read(root / "storyboard.json") not in boards:
        raise ValueError("opening alternatives must belong to the current owned edition and provisional board")
    if not all(creative.required(b) for b in boards) or body(boards[0]) != body(boards[1]):
        raise ValueError("two openings must share the current dated story, assets and complete body")
    if boards[0]["scenes"][0]["duration_s"] != boards[1]["scenes"][0]["duration_s"]:
        raise ValueError("opening alternatives must keep the same planned cut boundary")
    if creative.opening_digest(boards[0]) == creative.opening_digest(boards[1]):
        raise ValueError("opening alternatives must differ visibly")
    claims = creative.read(root / "claims.json")
    errors = check_files(LIB)
    errors += selection_problems(creative.read(root / "story_selection.json"), edition=boards[0]["date"])
    for key, board in zip(("a", "b"), boards):
        errors += check(board) + structure_problems(board, claims) + documentary(board)
        errors += supers(board, claims)[0]
        errors += narration(board, claims)
        review = creative.read(root / f"opening-{key}-critic.json")
        errors += problems(board, review)
        if (review.get("story_review") or {}).get("claims_sha256") != creative.digest(root / "claims.json"):
            errors.append("opening critic reviewed different source claims")
        native_media_paths(board)
    if errors:
        raise ValueError("opening checks failed before reservation: " + "; ".join(sorted(set(errors))))
    for key, board in zip(("a", "b"), boards):
        command = ["node", str(REPO / "video-engine/tests/caption_board_fit.mjs"), "--board", str(root / f"opening-{key}.json")]
        if not board.get("captions") and not any(board.get(k) for k in ("caption_method", "retimed_to", "retime_evidence")):
            command.append("--early-muted-animatic")
        subprocess.run(command, cwd=REPO / "video-engine", check=True)
    expected_renderer = renderer_digest(boards[0])
    expected_producer = creative.opening_producer()
    if expected_renderer != renderer_digest(boards[1]):
        raise ValueError("opening options must use the same inspected renderer and asset set")
    output = root / "openings"
    identity = preflight_identity(state, "two opening comparison batch")
    existing = output / "comparison.json"
    if existing.exists():
        old = creative.read(existing)
        if old.get("reservation", {}).get("identity") == identity:
            if (old.get("policy_sha256") != creative.digest(creative.POLICY) or old.get("renderer_sha256") != expected_renderer
                    or old.get("producer_sha256") != expected_producer):
                raise ValueError("retained opening approval dependencies changed; preserve it before repair")
            for item in old["options"]:
                for key in ("board", "film"):
                    if creative.digest(output / item[key]["file"]) != item[key]["sha256"]:
                        raise ValueError("retained opening evidence changed; repair from the failed evidence")
            return old
        raise ValueError("preserve the rejected comparison in the defect package before a changed batch")
    accepted, message = reserve(state, {"preflight_renders": 1}, "two opening comparison batch")
    if not accepted:
        raise ValueError(message)
    ledger = read_state(state)
    reservation = {"identity": identity, "run_id": ledger["run_id"], "event_index": len(ledger["events"])-1}
    output.mkdir(parents=True, exist_ok=True)
    jobs, options = [], []
    for key, board in zip(("a", "b"), boards):
        path = output / f"{key}.json"
        path.write_text(json.dumps(board, indent=2)+"\n")
        film = output / f"{key}.mp4"
        jobs.append({"kind": "video", "props": str(path), "output": str(film), "preview": True})
        options.append({"id": key, "concept_sha256": creative.opening_digest(board),
                        "board": {"file": path.name, "sha256": creative.digest(path)},
                        "film": {"file": film.name}})
    spec = output / "batch.json"
    spec.write_text(json.dumps({"jobs": jobs, "report": str(output / "batch-report.json")}, indent=2)+"\n")
    subprocess.run(["node", str(REPO / "video-engine/scripts/render-batch.mjs"), str(spec)],
                   cwd=REPO / "video-engine", check=True)
    if renderer_digest(boards[0]) != expected_renderer or preflight_identity(state, "two opening comparison batch") != identity:
        raise ValueError("opening inputs changed during rendering; retain the charged attempt")
    if creative.opening_producer() != expected_producer:
        raise ValueError("opening capture tools changed during rendering; retain the charged attempt")
    for option in options:
        option["film"]["sha256"] = creative.digest(output / option["film"]["file"])
    if len({o["film"]["sha256"] for o in options}) != 2:
        raise ValueError("opening alternatives rendered identical pictures; preserve the charged attempt")
    receipt = {"schema": "dispatch-opening-comparison/1", "policy_sha256": creative.digest(creative.POLICY),
               "renderer_sha256": expected_renderer, "producer_sha256": expected_producer, "reservation": reservation, "options": options}
    existing.write_text(json.dumps(receipt, indent=2)+"\n")
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=Path("out/dispatch"))
    parser.add_argument("--state", type=Path, default=Path("out/dispatch/run_state.json"))
    args = parser.parse_args()
    try:
        result = build(args.root, args.state)
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        print("opening comparison refused: " + str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
