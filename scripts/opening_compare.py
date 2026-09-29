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
# Reviewed inspection-only transition from d9e4493337a656862fdcef0c53d78472145424dc.
# Every other capture dependency is still recomputed from the current checkout.
LEGACY_ORCHESTRATOR_SHA256 = "a50859e01b487bb81ef814845c3d8b5aeb47f46106f698248732e184b76fb30d"


def body(board):
    value = copy.deepcopy(board)
    opening = value["scenes"][0]["id"]
    value["scenes"] = value["scenes"][1:]
    if "cinema" in value:
        value["cinema"]["dimensional_scene_ids"] = [sid for sid in value["cinema"].get("dimensional_scene_ids", []) if sid != opening]
    value.get("quality_plan", {})["scenes"] = value.get("quality_plan", {}).get("scenes", [])[1:]
    value.get("creative_direction", {})["edits"] = value.get("creative_direction", {}).get("edits", [])[1:]
    return value


def inspection_producer():
    """Bind reports to the measurement code and its policy dependencies."""
    files = ("opening_compare.py", "preflight_animatic.py", "creative_production.py", "documentary_check.py")
    return creative.fingerprint({name: creative.digest(REPO / "scripts" / name) for name in files})


def evidence_path(output, ref):
    path = (output / ref["file"]).resolve()
    if not path.is_relative_to(output.resolve()) or creative.digest(path) != ref["sha256"]:
        raise ValueError("retained opening evidence changed: " + str(ref.get("file")))
    return path


def capture_record(receipt):
    value = copy.deepcopy(receipt)
    for key in ("inspection_adoption", "inspection_pass", "inspection_problems"):
        value.pop(key, None)
    for option in value.get("options", []):
        option.pop("inspection", None)
    return value


def legacy_capture_problems(receipt, output):
    """Accept one reviewed old orchestration version, never arbitrary capture drift."""
    from critic_gate import renderer_digest
    output = Path(output)
    errors = []
    try:
        if receipt.get("producer_sha256") != creative.opening_producer(LEGACY_ORCHESTRATOR_SHA256):
            errors.append("legacy capture producer or a rendering dependency changed")
        if receipt.get("policy_sha256") != creative.digest(creative.POLICY):
            errors.append("legacy capture policy changed")
        options = receipt["options"]
        if len(options) != 2 or {o["id"] for o in options} != {"a", "b"}:
            errors.append("legacy capture needs both original options")
        ledger = creative.read(output.parent / "run_state.json")
        reservation = receipt["reservation"]
        event = ledger["events"][reservation["event_index"]]
        if (reservation["run_id"] != ledger["run_id"] or event.get("kind") != "reserved"
                or event.get("resources") != {"preflight_renders": 1}
                or event.get("preflight_identity") != reservation["identity"]
                or event.get("note") != "two opening comparison batch"):
            errors.append("legacy capture has no original charged reservation")
        for option in options:
            board = creative.read(evidence_path(output, option["board"]))
            evidence_path(output, option["film"])
            if board.get("date") != ledger["run_id"] or creative.opening_digest(board) != option["concept_sha256"]:
                errors.append("legacy capture board or edition changed")
            if renderer_digest(board) != receipt.get("renderer_sha256"):
                errors.append("legacy capture renderer or source assets changed")
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        errors.append("legacy capture evidence unavailable: " + str(exc))
    return errors


def adoption_problems(receipt, output):
    output = Path(output)
    try:
        adoption = receipt["inspection_adoption"]
        original = creative.read(evidence_path(output, adoption["original_comparison"]))
        errors = legacy_capture_problems(original, output)
        if original.get("inspection_adoption") or capture_record(receipt) != capture_record(original):
            errors.append("inspection adoption changed original capture evidence")
        if (adoption.get("legacy_orchestrator_sha256") != LEGACY_ORCHESTRATOR_SHA256
                or adoption.get("inspector_sha256") != inspection_producer()):
            errors.append("inspection adoption has unknown orchestration or stale inspector")
        return errors
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["inspection adoption unavailable: " + str(exc)]


def inspect_retained(root, state):
    """Adopt inspection evidence only; preserve the original capture and review hashes."""
    root, state = Path(root).resolve(), Path(state).resolve()
    if state != root / "run_state.json":
        raise ValueError("retained inspection must use its existing edition controller")
    output = root / "openings"
    comparison = output / "comparison.json"
    receipt = creative.read(comparison)
    if receipt.get("inspection_adoption"):
        errors = adoption_problems(receipt, output)
    else:
        errors = legacy_capture_problems(receipt, output)
    if errors:
        raise ValueError("; ".join(errors))
    if not receipt.get("inspection_adoption"):
        archive = output / ("comparison-original-" + creative.digest(comparison)[:16] + ".json")
        archive.write_bytes(comparison.read_bytes())
        receipt["inspection_adoption"] = {
            "original_comparison": {"file": archive.name, "sha256": creative.digest(archive)},
            "legacy_orchestrator_sha256": LEGACY_ORCHESTRATOR_SHA256,
            "inspector_sha256": inspection_producer()}
    return inspect_options(output, receipt)


def package_openings(source, destination):
    """Copy the complete hash-bound opening evidence graph, preserving original bytes."""
    import shutil
    source, destination = Path(source), Path(destination)
    errors = creative.opening_problems(source / "storyboard.json")
    if errors:
        raise ValueError("; ".join(errors))
    output = source / "openings"
    names = {"comparison.json", "selection.json"}

    def collect(receipt):
        for option in receipt["options"]:
            for key in ("board", "film", "inspection"):
                if key in option:
                    ref = option[key]
                    evidence_path(output, ref)
                    names.add(ref["file"])
        adoption = receipt.get("inspection_adoption")
        if adoption:
            ref = adoption["original_comparison"]
            path = evidence_path(output, ref)
            if ref["file"] not in names:
                names.add(ref["file"])
                collect(creative.read(path))

    collect(creative.read(output / "comparison.json"))
    hashes = {}
    for name in names:
        if Path(name).name != name:
            raise ValueError("opening evidence must name local files")
        hashes[name] = creative.digest(output / name)
        target = destination / "openings" / name
        if target.exists() and creative.digest(target) != hashes[name]:
            raise ValueError("refusing to overwrite different packaged opening evidence: " + name)
    target_root = destination / "openings"
    target_root.mkdir(parents=True, exist_ok=True)
    for name, sha in hashes.items():
        if creative.digest(output / name) != sha:
            raise ValueError("opening evidence changed during packaging: " + name)
        shutil.copy2(output / name, target_root / name)
        if creative.digest(target_root / name) != sha:
            raise ValueError("packaged opening evidence differs: " + name)
    errors = creative.opening_problems(destination / "storyboard.json")
    if errors:
        raise ValueError("packaged opening evidence failed validation: " + "; ".join(errors))
    return sorted(names)


def inspect_options(output, receipt):
    """Inspect both retained outputs without rendering; retain failed measurements."""
    from preflight_animatic import inspect_animatic
    from critic_gate import renderer_digest
    output = Path(output)
    for option in receipt["options"]:
        board_path = evidence_path(output, option["board"])
        film = evidence_path(output, option["film"])
        board = creative.read(board_path)
        bindings = {"board_sha256": creative.digest(board_path), "film_sha256": creative.digest(film),
                    "renderer_sha256": receipt.get("renderer_sha256", renderer_digest(board)),
                    "inspector_sha256": inspection_producer()}
        try:
            report, problems = inspect_animatic(board, film)
        except (OSError, ValueError, KeyError, TypeError, IndexError, RuntimeError, subprocess.SubprocessError) as exc:
            report, problems = {"schema": "dispatch_preflight/1", "inspection_error": str(exc)}, ["inspection could not complete: " + str(exc)]
        if creative.digest(board_path) != bindings["board_sha256"] or creative.digest(film) != bindings["film_sha256"]:
            problems = [*problems, "opening evidence changed during structural inspection"]
        report.update(bindings, **{"pass": not problems, "problems": problems, "film": film.name})
        # Content-addressed files preserve earlier failures if inspection code changes.
        name = f"{option['id']}-inspection-{creative.fingerprint(report)[:16]}.json"
        path = output / name
        path.write_text(json.dumps(report, indent=2) + "\n")
        option["inspection"] = {"file": name, "sha256": creative.digest(path)}
    receipt["inspection_problems"] = inspection_problems(receipt, output)
    receipt["inspection_pass"] = not receipt["inspection_problems"]
    comparison = output / "comparison.json"
    encoded = json.dumps(receipt, indent=2) + "\n"
    if comparison.exists() and comparison.read_text() != encoded:
        previous = output / ("comparison-before-inspection-" + creative.digest(comparison)[:16] + ".json")
        previous.write_bytes(comparison.read_bytes())
    comparison.write_text(encoded)
    return receipt


def inspection_problems(receipt, output, *, allow_bounded=False):
    """Normal review gate; diagnostic retention never grants approval."""
    from critic_gate import renderer_digest
    output = Path(output)
    errors = []
    options = receipt.get("options", [])
    if len(options) != 2 or {option.get("id") for option in options} != {"a", "b"}:
        errors.append("opening inspection requires both exact options")
    for option in options:
        prefix = "opening " + str(option.get("id")) + ": "
        try:
            board_path = evidence_path(output, option["board"])
            film = evidence_path(output, option["film"])
            report = creative.read(evidence_path(output, option["inspection"]))
            expected = {"board_sha256": creative.digest(board_path), "film_sha256": creative.digest(film),
                        "renderer_sha256": receipt.get("renderer_sha256", renderer_digest(creative.read(board_path))),
                        "inspector_sha256": inspection_producer()}
            for key, value in expected.items():
                if report.get(key) != value:
                    errors.append(prefix + "structural inspection has stale " + key)
            if report.get("pass") is not True or report.get("problems") != [] or report.get("inspection_error"):
                if allow_bounded and not report.get("inspection_error"):
                    from creative_release import structural_allows
                    if structural_allows(creative.read(board_path), report, output.parent):
                        continue
                errors.extend(prefix + str(problem) for problem in
                              (report.get("problems") or ["structural inspection did not pass"]))
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(prefix + "bound structural inspection unavailable: " + str(exc))
    return errors


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
            return inspect_options(output, old)
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
    return inspect_options(output, receipt)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=Path("out/dispatch"))
    parser.add_argument("--state", type=Path, default=Path("out/dispatch/run_state.json"))
    parser.add_argument("--retain-failed-inspection", action="store_true",
                        help="retain diagnostic failures for policy-authorized finishing; grants no approval")
    parser.add_argument("--inspect-retained", action="store_true",
                        help="inspect the reviewed legacy capture without reserving or rendering")
    args = parser.parse_args()
    try:
        result = inspect_retained(args.root, args.state) if args.inspect_retained else build(args.root, args.state)
        print(json.dumps(result, indent=2))
        failures = inspection_problems(result, args.root / "openings")
        if failures:
            print("opening structural inspection failed: " + "; ".join(failures), file=sys.stderr)
            return 0 if args.retain_failed_inspection else 1
        return 0
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        print("opening comparison refused: " + str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
