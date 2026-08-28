#!/usr/bin/env python3
"""run_controller.py - enforce the cost and terminal-state contract for one Dispatch.

The August 18th run had budgets written as warnings and a law that allowed only delivery. That
combination could describe runaway work and could not stop it. This controller owns the opposite
contract. Expensive work is reserved before it is spent and a limit is mechanical, but a refused
optional spend can never terminate an empty run. It switches the run to completion mode until a
playable, hash-bound MP4 is durably packaged as either ``publishable`` or ``needs_review``.

The prompt makes editorial decisions. This file decides whether another expensive action is
allowed.

    python3 scripts/run_controller.py init --run-id 2026-08-27 --mode production
    python3 scripts/run_controller.py consume --resource research_agents --note "oilfield"
    python3 scripts/run_controller.py panel --judges 3 --note "first finished cut"
    python3 scripts/run_controller.py finish --result publishable \
        --report out/dispatch/report_card.json
    python3 scripts/run_controller.py check-delivery \
        --report out/dispatch/report_card.json
    python3 scripts/run_controller.py --self-test

Exit 0 means the transition was accepted, 1 means the run is not allowed to continue or deliver,
and 2 means the command or state could not be read.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LIMITS_FILE = REPO / "config" / "run_limits.json"
RUBRIC_FILE = REPO / "config" / "dispatch_rubric.yaml"
DEFAULT_STATE = REPO / "out" / "dispatch" / "run_state.json"
SCHEMA = "dispatch_run_state/1"
TERMINAL = {"publishable", "needs_review"}
CLEANUP_PHASE = "hard_fail_cleanup"
COMPLETION_PHASE = "deliverable_completion"
CLEANUP_RENDER_RESOURCE = "cleanup_renders"
RESCUE_RENDER_RESOURCE = "rescue_renders"
CONTROLLED_RENDER_RESOURCES = {CLEANUP_RENDER_RESOURCE, RESCUE_RENDER_RESOURCE}
PANEL_RESOURCES = {"panel_rounds", "scorer_calls"}
LOCKED_PHASES = {CLEANUP_PHASE, COMPLETION_PHASE}


def now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def limits(path: Path = LIMITS_FILE) -> dict[str, int]:
    raw = load_json(path)
    resources = raw.get("resources") or {}
    if not resources or any(not isinstance(v, int) or v < 1 for v in resources.values()):
        raise ValueError(f"{path} has no positive integer resource limits")
    return resources


def threshold(path: Path = RUBRIC_FILE) -> float:
    import yaml

    return float(yaml.safe_load(path.read_text(encoding="utf-8"))["rubric"]["ship_threshold"])


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def save(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, sort_keys=True)
            f.write("\n")
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def read_state(path: Path) -> dict:
    state = load_json(path)
    if state.get("schema") != SCHEMA:
        raise ValueError(f"{path} is not {SCHEMA}")
    expected = set(limits())
    present = set(state.get("limits") or {})
    if expected != present:
        raise ValueError(
            f"{path} snapshots {sorted(present)}, but the controller owns {sorted(expected)}. "
            "Start a new run from the current limits rather than silently changing one in flight."
        )
    return state


def event(state: dict, kind: str, **fields: object) -> None:
    state.setdefault("events", []).append({"at": now(), "kind": kind, **fields})
    state["updated_at"] = now()


def initialise(path: Path, run_id: str, mode: str) -> tuple[bool, str]:
    if path.exists():
        try:
            state = read_state(path)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            return False, f"run controller: cannot resume {path}: {exc}"
        if state.get("run_id") != run_id or state.get("mode") != mode:
            return False, (
                f"run controller: {path} belongs to {state.get('run_id')} in {state.get('mode')} "
                f"mode, not {run_id} in {mode} mode. Never overwrite another run's ledger."
            )
        return True, f"run controller: resumed {run_id} in {mode} mode"

    owned = limits()
    state = {
        "schema": SCHEMA,
        "run_id": run_id,
        "mode": mode,
        "created_at": now(),
        "updated_at": now(),
        "phase": "wake",
        "terminal_state": None,
        "terminal_reason": None,
        "review_required": False,
        "review_reasons": [],
        "limits": owned,
        "usage": {name: 0 for name in owned},
        "events": [],
    }
    event(state, "initialised", mode=mode)
    save(path, state)
    return True, f"run controller: initialised {run_id} in {mode} mode at {path}"


def reserve(path: Path, amounts: dict[str, int], note: str = "", *, _panel: bool = False
            ) -> tuple[bool, str]:
    state = read_state(path)
    if state.get("terminal_state"):
        return False, (
            f"run controller: {state['terminal_state']} is terminal. "
            "No further expensive action is allowed."
        )
    unknown = sorted(set(amounts) - set(state["limits"]))
    if unknown:
        return False, f"run controller: unknown resource(s): {', '.join(unknown)}"
    invalid = {k: v for k, v in amounts.items() if not isinstance(v, int) or v < 1}
    if invalid:
        return False, f"run controller: every reservation must be a positive integer: {invalid}"
    if PANEL_RESOURCES.intersection(amounts) and not _panel:
        return False, (
            "run controller: panel_rounds and scorer_calls are one controller-owned atomic "
            "reservation; use the panel command with exactly three judges"
        )

    # This allowance is deliberately not a public spend token. Once the fifth panel has been
    # reserved, a normal full-render reservation automatically debits the one cleanup render as
    # well. A caller cannot book it separately, reset it in another shell, or disguise a second
    # cleanup render as an ordinary render.
    controlled = CONTROLLED_RENDER_RESOURCES.intersection(amounts)
    if controlled:
        return False, (
            f"run controller: {', '.join(sorted(controlled))} is controller-owned and is "
            "charged automatically by a full-render request in cleanup or rescue mode"
        )

    # Five panels are room to improve, not permission to start another loop. The controller
    # locks this phase when the fifth panel is reserved. Refusing a sixth panel is intentionally
    # non-terminal: the run may still batch deterministic hard-fail and cheap gate repairs.
    if state.get("phase") in LOCKED_PHASES and PANEL_RESOURCES.intersection(amounts):
        event(state, "panel_refused_in_cleanup", attempted=amounts, note=note)
        save(path, state)
        return False, (
            "run controller: no-panel completion is active. A sixth full panel and any further "
            "scorer calls are closed; finish the best playable video with hard-fail and "
            "deterministic repairs only."
        )

    amounts = dict(amounts)
    if state.get("phase") == CLEANUP_PHASE and "full_renders" in amounts:
        amounts[CLEANUP_RENDER_RESOURCE] = amounts.pop("full_renders")
    elif (state.get("phase") == COMPLETION_PHASE and "full_renders" in amounts
          and int(state["usage"].get("full_renders", 0)) + amounts["full_renders"]
          > int(state["limits"]["full_renders"])):
        amounts[RESCUE_RENDER_RESOURCE] = amounts.pop("full_renders")

    over = []
    for name, amount in amounts.items():
        after = int(state["usage"].get(name, 0)) + amount
        if after > int(state["limits"][name]):
            over.append((name, after, int(state["limits"][name])))
    if over:
        reason = "; ".join(f"{name} would be {after} over its {cap} cap"
                           for name, after, cap in over)
        state["review_required"] = True
        review_reason = "budget exhausted: " + reason
        if review_reason not in state.setdefault("review_reasons", []):
            state["review_reasons"].append(review_reason)
        state["phase"] = COMPLETION_PHASE
        event(state, "budget_exhausted", attempted=amounts, note=note, reason=reason)
        save(path, state)
        return False, (
            f"run controller: {reason}. The attempted work was not spent. Full panels are now "
            "closed, but the run is NOT terminal: use the best existing material, produce and "
            "register a playable MP4, then save a durable needs-review package."
        )

    for name, amount in amounts.items():
        state["usage"][name] = int(state["usage"].get(name, 0)) + amount
    if ({"full_renders", CLEANUP_RENDER_RESOURCE, RESCUE_RENDER_RESOURCE}.intersection(amounts)
            and state.get("deliverable")):
        # Registration snapshots immutable files. Keep that last-good deliverable while a new
        # render is attempted: reserving work is not evidence that the replacement succeeded.
        event(state, "render_reserved_with_last_good_preserved",
              film_sha256=state["deliverable"].get("film_sha256"))
    event(state, "reserved", resources=amounts, note=note)
    if ("panel_rounds" in amounts
            and state["usage"]["panel_rounds"] == state["limits"]["panel_rounds"]):
        state["phase"] = CLEANUP_PHASE
        event(
            state,
            "panel_cap_reached",
            panel_rounds=state["usage"]["panel_rounds"],
            next_mode="hard fails and deterministic no-panel fixes only",
        )
    save(path, state)
    used = ", ".join(f"{k}={state['usage'][k]}/{state['limits'][k]}" for k in amounts)
    suffix = (
        "; fifth panel reserved, so hard-fail cleanup is now locked and no sixth panel exists"
        if state.get("phase") == CLEANUP_PHASE and "panel_rounds" in amounts else ""
    )
    return True, f"run controller: reserved {used}{suffix}"


def set_phase(path: Path, name: str) -> tuple[bool, str]:
    state = read_state(path)
    if state.get("terminal_state"):
        return False, f"run controller: {state['terminal_state']} is terminal"
    if name in LOCKED_PHASES:
        return False, (
            f"run controller: {name} is controller-owned, not a phase a prompt can select"
        )
    if state.get("phase") in LOCKED_PHASES:
        return False, (
            f"run controller: {state.get('phase')} is locked. A phase command cannot reopen "
            "panels or abandon deliverable completion."
        )
    state["phase"] = name
    event(state, "phase", name=name)
    save(path, state)
    return True, f"run controller: phase {name}"


def report_result(path: Path) -> tuple[float, list[str]]:
    report = load_json(path)
    score = float(report.get("score") or report.get("weighted_score") or 0)
    hard = [str(x) for x in report.get("hard_fails") or []]
    if report.get("ship") is False and not hard:
        hard.append("the report explicitly says ship:false")
    return score, hard


def board_runtime(board: dict) -> float:
    declared = float(board.get("runtime_s") or 0)
    scene_end = max((float(s.get("start_s") or 0) + float(s.get("duration_s") or 0)
                     for s in board.get("scenes") or []), default=0.0)
    return max(declared, scene_end)


def playability_problems(film: Path, expected_duration: float | None = None) -> list[str]:
    """Require the real Dispatch shape and runtime, not merely decodable bytes named .mp4."""
    try:
        proc = subprocess.run([
            "ffprobe", "-v", "error", "-show_entries",
            "stream=codec_type,width,height,duration:format=duration", "-of", "json", str(film),
        ], capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError) as exc:
        return [f"ffprobe could not inspect the film: {exc}"]
    if proc.returncode != 0:
        return [f"ffprobe cannot decode the film: {proc.stderr.strip()[:240]}"]
    try:
        data = json.loads(proc.stdout)
        streams = data.get("streams") or []
        videos = [s for s in streams if s.get("codec_type") == "video"]
        audio = [s for s in streams if s.get("codec_type") == "audio"]
        duration = float((data.get("format") or {}).get("duration") or 0)
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        return [f"ffprobe returned unreadable media metadata: {exc}"]
    errs = []
    if not videos:
        errs.append("the film has no video stream")
    elif (int(videos[0].get("width") or 0), int(videos[0].get("height") or 0)) != (1080, 1920):
        errs.append("the video stream is not the Dispatch's 1080x1920 delivery frame")
    if not audio:
        errs.append("the film has no audio stream")
    if duration <= 0:
        errs.append("the film has no positive duration")
    if expected_duration is not None and expected_duration > 0:
        video_duration = duration
        if videos and videos[0].get("duration") is not None:
            video_duration = float(videos[0]["duration"])
        if abs(video_duration - expected_duration) > 0.15:
            errs.append(
                f"the video lasts {video_duration:.3f}s but its board lasts "
                f"{expected_duration:.3f}s"
            )
    return errs


def deliverable_problems(state: dict, *, publication: bool = False) -> list[str]:
    saved = state.get("deliverable") or {}
    if not saved:
        return ["no playable deliverable is registered"]
    try:
        film = Path(saved["film"])
        board = Path(saved["board"])
        manifest_path = Path(saved["manifest"])
        if not film.is_file() or not board.is_file() or not manifest_path.is_file():
            return ["the registered film, board, or render manifest is missing"]
        board_data = load_json(board)
        media_errs = playability_problems(film, board_runtime(board_data))
        if media_errs:
            return media_errs
        if digest(film) != saved.get("film_sha256"):
            return ["the registered film changed after it was rendered"]
        if digest(board) != saved.get("board_sha256"):
            return ["the registered board changed after the film was rendered"]
        if digest(manifest_path) != saved.get("manifest_sha256"):
            return ["the registered render manifest changed after registration"]
        from render_manifest import artifact_problems, problems
        if publication and saved.get("review_only"):
            return ["the registered film is an explicit review-only rescue"]
        checker = problems if publication else artifact_problems
        return checker(load_json(manifest_path), film, board)
    except (OSError, ValueError, KeyError, json.JSONDecodeError, ImportError) as exc:
        return [f"the registered deliverable cannot be verified: {exc}"]


def copy_exact(source: Path, target: Path, *, refuse_different: bool = False) -> None:
    """Copy through a same-directory temporary file so a crash cannot expose half an MP4."""
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_file():
        if digest(target) == digest(source):
            return
        if refuse_different:
            raise ValueError(f"refusing to replace a different existing artifact at {target}")
    fd, tmp_name = tempfile.mkstemp(prefix=target.name + ".", dir=target.parent)
    os.close(fd)
    try:
        shutil.copy2(source, tmp_name)
        os.replace(tmp_name, target)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def snapshot_deliverable(state_path: Path, film: Path, board: Path, manifest: Path
                         ) -> tuple[Path, Path, Path]:
    hashes = (digest(film), digest(board), digest(manifest))
    identity = "-".join(value[:16] for value in hashes)
    root = state_path.parent / "deliverables" / identity
    saved_film = root / "dispatch.mp4"
    saved_board = root / "storyboard.json"
    saved_manifest = root / "render-manifest.json"
    for source, target in (
        (film, saved_film), (board, saved_board), (manifest, saved_manifest)
    ):
        copy_exact(source, target)
    return saved_film.resolve(), saved_board.resolve(), saved_manifest.resolve()


def register_deliverable(path: Path, film: Path, board: Path, manifest: Path,
                         *, review_only: bool = False, reason: str = ""
                         ) -> tuple[bool, str]:
    state = read_state(path)
    if state.get("terminal_state"):
        return False, f"run controller: {state['terminal_state']} is terminal"
    try:
        from render_manifest import problems
        board_data = load_json(board)
        media_errs = playability_problems(film, board_runtime(board_data))
        if media_errs:
            return False, "run controller: film is not playable: " + "; ".join(media_errs)
        manifest_data = load_json(manifest)
        errs = problems(manifest_data, film, board)
    except (OSError, ValueError, json.JSONDecodeError, ImportError) as exc:
        return False, f"run controller: cannot verify rendered deliverable: {exc}"
    if errs:
        return False, "run controller: rendered deliverable is not exact: " + "; ".join(errs)
    if review_only and not reason.strip():
        return False, "run controller: a review-only deliverable requires an evidence-based reason"
    try:
        saved_film, saved_board, saved_manifest = snapshot_deliverable(
            path, film, board, manifest)
    except (OSError, ValueError) as exc:
        return False, f"run controller: cannot preserve rendered deliverable: {exc}"
    state["deliverable"] = {
        "film": str(saved_film),
        "film_sha256": digest(saved_film),
        "board": str(saved_board),
        "board_sha256": digest(saved_board),
        "manifest": str(saved_manifest),
        "manifest_sha256": digest(saved_manifest),
        "review_only": review_only,
        "review_reason": reason.strip() if review_only else None,
        "registered_at": now(),
    }
    if review_only:
        state["review_required"] = True
        state["phase"] = COMPLETION_PHASE
        if reason.strip() not in state.setdefault("review_reasons", []):
            state["review_reasons"].append(reason.strip())
    event(state, "deliverable_registered",
          film_sha256=state["deliverable"]["film_sha256"],
          manifest_sha256=state["deliverable"]["manifest_sha256"],
          review_only=review_only)
    save(path, state)
    suffix = " as review-only rescue" if review_only else ""
    return True, f"run controller: playable deliverable snapshotted and hash-bound{suffix}"


def check_deliverable(path: Path) -> tuple[bool, str]:
    errs = deliverable_problems(read_state(path))
    if errs:
        return False, "run controller: deliverable is not ready: " + "; ".join(errs)
    return True, "run controller: playable deliverable is present and hash-bound"


def materialize_deliverable(path: Path, directory: Path) -> tuple[bool, str]:
    state = read_state(path)
    errs = deliverable_problems(state)
    if errs:
        return False, "run controller: deliverable cannot be copied: " + "; ".join(errs)
    saved = state["deliverable"]
    try:
        for source, name in (
            (saved["film"], "dispatch.mp4"),
            (saved["board"], "storyboard.json"),
            (saved["manifest"], "render-manifest.json"),
        ):
            copy_exact(Path(source), directory / name, refuse_different=True)
    except (OSError, ValueError) as exc:
        return False, f"run controller: cannot materialize deliverable: {exc}"
    return True, f"run controller: exact playable deliverable copied to {directory}"


def review_package_problems(state: dict, package: Path) -> list[str]:
    saved = state.get("deliverable") or {}
    required = {
        "dispatch.mp4": saved.get("film_sha256"),
        "storyboard.json": saved.get("board_sha256"),
        "render-manifest.json": saved.get("manifest_sha256"),
    }
    errs = []
    for name, expected in required.items():
        target = package / name
        if not target.is_file():
            errs.append(f"review package is missing {name}")
        elif not expected or digest(target) != expected:
            errs.append(f"review package {name} differs from the registered deliverable")
    return errs


def finish(path: Path, result: str, reason: str = "", report: Path | None = None,
           review_package: Path | None = None, *, review_root: Path | None = None
           ) -> tuple[bool, str]:
    if result not in TERMINAL:
        return False, f"run controller: unknown terminal state {result}"
    state = read_state(path)
    current = state.get("terminal_state")
    if current:
        if current == result == "needs_review" and review_package is not None:
            saved_package = (state.get("review_package") or {}).get("path")
            if saved_package and Path(saved_package).resolve() == review_package.resolve():
                return True, f"run controller: resumed durable needs-review package {review_package}"
        return False, f"run controller: state is already terminal as {current}"

    if result == "needs_review":
        if not reason.strip():
            return False, "run controller: needs_review requires an evidence-based reason"
        ready, message = check_deliverable(path)
        if not ready:
            return False, message + ". An empty run cannot become terminal."
        if review_package is None or not review_package.is_dir():
            return False, (
                "run controller: needs_review requires a durable --review-package directory; "
                "out/dispatch is gitignored and is not a deliverable"
            )
        allowed_root = (review_root or (REPO / "runs" / "review")).resolve()
        try:
            review_package.resolve().relative_to(allowed_root)
        except ValueError:
            return False, (
                f"run controller: review package must live under {allowed_root}; a temporary "
                "directory is not durable run output"
            )
        state = read_state(path)
        package_errs = review_package_problems(state, review_package)
        if package_errs:
            return False, "run controller: " + "; ".join(package_errs)
        state["review_required"] = True
        if reason.strip() not in state.setdefault("review_reasons", []):
            state["review_reasons"].append(reason.strip())
        state["terminal_state"] = result
        state["terminal_reason"] = reason.strip()
        state["review_package"] = {
            "path": str(review_package),
            "film_sha256": state["deliverable"]["film_sha256"],
            "manifest_sha256": state["deliverable"]["manifest_sha256"],
        }
        event(state, "finished", result=result, reason=reason.strip(),
              review_package=str(review_package))
        save(path, state)
        return True, f"run controller: {result} with durable video at {review_package}"

    if report is None or not report.is_file():
        return False, "run controller: publishable requires an existing --report"
    state = read_state(path)
    publication_errs = deliverable_problems(state, publication=True)
    if publication_errs:
        return False, (
            "run controller: video is not publication-ready: "
            + "; ".join(publication_errs)
            + ". Preserve it for review or complete a current full-resolution render."
        )
    score, hard = report_result(report)
    bar = threshold()
    if score < bar or hard:
        why = ([f"panel score {score:.3f} is below the rubric"] if score < bar else []) + hard
        state["review_required"] = True
        state["phase"] = COMPLETION_PHASE
        for item in why:
            if item not in state.setdefault("review_reasons", []):
                state["review_reasons"].append(item)
        event(state, "publish_refused", score=score, report=str(report), reasons=why)
        save(path, state)
        return False, (
            "run controller: NEEDS REVIEW, but not empty and not terminal. "
            + "; ".join(why)
            + ". Save the registered film as a durable review package."
        )

    state["terminal_state"] = "publishable"
    state["terminal_reason"] = None
    state["final_report"] = {
        "path": str(report),
        "sha256": digest(report),
        "score": score,
        "film_sha256": state["deliverable"]["film_sha256"],
    }
    event(state, "finished", result="publishable", score=score,
          report_sha256=state["final_report"]["sha256"])
    save(path, state)
    return True, f"run controller: publishable at panel score {score:.3f}"


def check_package(path: Path, report: Path) -> tuple[bool, str]:
    """Re-prove the hash-bound editorial result without granting publication authority.

    This is the check a publishing-disabled rehearsal uses. It deliberately works in dry-run
    mode, but it grants only permission to verify the package, never permission to copy, commit,
    push, merge, or update the feed.
    """
    state = read_state(path)
    if state.get("terminal_state") != "publishable":
        return False, (
            f"run controller: terminal state is {state.get('terminal_state')!r}, not publishable"
        )
    errs = deliverable_problems(state, publication=True)
    if errs:
        return False, "run controller: deliverable changed: " + "; ".join(errs)
    saved = state.get("final_report") or {}
    if saved.get("film_sha256") != (state.get("deliverable") or {}).get("film_sha256"):
        return False, "run controller: the passing report belongs to a different film"
    if not report.is_file() or digest(report) != saved.get("sha256"):
        return False, (
            "run controller: the report presented for delivery is missing or differs from the "
            "passing report that closed the run"
        )
    score, hard = report_result(report)
    if score < threshold() or hard:
        return False, "run controller: the delivery report no longer clears the rubric"
    return True, "run controller: package matches the hash-bound passing report"


def check_delivery(path: Path, report: Path) -> tuple[bool, str]:
    state = read_state(path)
    if state.get("mode") != "production":
        return False, "run controller: dry-run mode can never deliver"
    accepted, message = check_package(path, report)
    if not accepted:
        return accepted, message
    return True, "run controller: delivery authorised by the hash-bound passing report"


def record_telemetry(path: Path, resource: str, elapsed_ms: int, tokens: int,
                     note: str = "") -> tuple[bool, str]:
    """Record observed cost after a reserved call returns.

    Call count is reserved before spend. Providers report elapsed time and tokens only after a
    response, so those observations are appended afterward. Reported tokens still consume the
    run-wide token budget; crossing it closes optional iteration and requires deliverable
    completion, but never creates an empty terminal run.
    """
    if elapsed_ms < 0 or tokens < 0:
        return False, "run controller: telemetry values cannot be negative"
    accepted, message = True, ""
    if tokens:
        accepted, message = reserve(
            path, {"reported_tokens": tokens}, f"telemetry for {resource}: {note}".strip())
    state = read_state(path)
    event(state, "telemetry", resource=resource, elapsed_ms=elapsed_ms,
          reported_tokens=tokens, note=note)
    save(path, state)
    if not accepted:
        return False, message
    return True, (
        f"run controller: recorded {resource} telemetry: {elapsed_ms} ms, {tokens} token(s)"
    )


def owner_override(path: Path, report: Path, reason: str, confirmation: str
                   ) -> tuple[bool, str]:
    state = read_state(path)
    if confirmation != "OWNER DIRECTED PUBLISH":
        return False, "run controller: owner override confirmation did not match"
    if state.get("mode") != "production":
        return False, "run controller: a dry run cannot be overridden into delivery"
    if state.get("terminal_state") != "needs_review":
        return False, "run controller: owner override applies only to needs_review"
    if not reason.strip() or not report.is_file():
        return False, "run controller: owner override requires --reason and an existing --report"
    errs = deliverable_problems(state, publication=True)
    if errs:
        return False, "run controller: owner override has no exact video: " + "; ".join(errs)
    score, hard = report_result(report)
    state["terminal_state"] = "publishable"
    state["terminal_reason"] = None
    state["owner_override"] = {"reason": reason.strip(), "at": now(), "score": score,
                               "hard_fails": hard}
    state["final_report"] = {
        "path": str(report),
        "sha256": digest(report),
        "score": score,
        "film_sha256": state["deliverable"]["film_sha256"],
    }
    event(state, "owner_override", reason=reason.strip(), score=score,
          hard_fails=hard, report_sha256=state["final_report"]["sha256"])
    save(path, state)
    return True, "run controller: owner-directed publish recorded and hash-bound"


def reserve_panel(path: Path, judges: int, note: str = "") -> tuple[bool, str]:
    """Reserve one complete panel atomically.

    A panel in this production contract is three independent lenses. Allowing a prompt to call a
    one-judge check a round would spend the round counter without buying the review the owner
    authorised; allowing more would silently defeat the scorer-call ceiling's meaning.
    """
    if judges != 3:
        return False, "run controller: a full panel is exactly three judges"
    return reserve(path, {"panel_rounds": 1, "scorer_calls": judges}, note, _panel=True)


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        if not condition:
            failures += 1

    # These are policy, not implementation defaults. Keeping the expected contract in the
    # self-test means a future edit cannot make a runaway run "pass" by silently raising the
    # source-of-truth ceiling. mutation_check.py weakens each value and requires this test to
    # notice.
    expected_limits = {
        "research_agents": 3,
        "validator_agents": 1,
        "storyboard_critics": 1,
        "preflight_renders": 6,
        "reboards": 4,
        "voice_directors": 1,
        "panel_rounds": 5,
        "scorer_calls": 15,
        "full_renders": 5,
        "cleanup_renders": 1,
        "rescue_renders": 1,
        "tts_calls": 4,
        "reported_tokens": 250000,
    }
    actual_limits = limits()
    ok("the approved run-wide cost contract has not drifted",
       actual_limits == expected_limits,
       f"expected {expected_limits}, got {actual_limits}")

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        seed_film = root / "seed.mp4"
        made_seed = subprocess.run([
            "ffmpeg", "-v", "error", "-y",
            "-f", "lavfi", "-i", "color=c=black:s=1080x1920:r=30:d=0.5",
            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
            "-t", "0.5", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-shortest", str(seed_film),
        ], capture_output=True).returncode == 0
        ok("the self-test can create a real playable fixture", made_seed)

        def attach_deliverable(state_path: Path, label: str, *, review_only: bool = False
                               ) -> tuple[Path, Path, Path]:
            from render_manifest import build
            film = root / f"{label}.mp4"
            board = root / f"{label}-board.json"
            manifest = root / f"{label}-manifest.json"
            film.write_bytes(seed_film.read_bytes())
            board.write_text(
                '{"runtime_s": 0.5, "scenes": [{"start_s": 0, "duration_s": 0.5}]}\n',
                encoding="utf-8")
            manifest.write_text(json.dumps(build(film, board), indent=2) + "\n",
                                encoding="utf-8")
            accepted, _ = register_deliverable(
                state_path, film, board, manifest, review_only=review_only,
                reason="full renderer failed" if review_only else "")
            ok(f"{label} registers a playable hash-bound deliverable", accepted)
            return film, board, manifest

        def durable_review(state_path: Path, label: str) -> Path:
            state = read_state(state_path)
            saved = state["deliverable"]
            package = root / "runs" / "review" / label
            package.mkdir(parents=True)
            for source, name in (
                (saved["film"], "dispatch.mp4"),
                (saved["board"], "storyboard.json"),
                (saved["manifest"], "render-manifest.json"),
            ):
                (package / name).write_bytes(Path(source).read_bytes())
            return package

        p = root / "snapshot-state.json"
        initialise(p, "snapshot", "dry-run")
        source_film, source_board, source_manifest = attach_deliverable(p, "snapshot")
        saved_snapshot = read_state(p)["deliverable"]
        ok("registration snapshots files away from mutable working outputs",
           Path(saved_snapshot["film"]) != source_film
           and Path(saved_snapshot["board"]) != source_board)
        source_film.write_bytes(b"failed replacement")
        source_board.write_text('{"runtime_s": 99}\n', encoding="utf-8")
        source_manifest.write_text("{}\n", encoding="utf-8")
        ok("a failed replacement cannot destroy the last registered cut",
           check_deliverable(p)[0])
        materialized = root / "materialized"
        ok("the immutable cut can be materialized for review",
           materialize_deliverable(p, materialized)[0])
        ok("materialization copies the exact registered trio",
           digest(materialized / "dispatch.mp4") == saved_snapshot["film_sha256"]
           and digest(materialized / "storyboard.json") == saved_snapshot["board_sha256"]
           and digest(materialized / "render-manifest.json")
           == saved_snapshot["manifest_sha256"])

        p = root / "review-rescue-state.json"
        initialise(p, "review-rescue", "production")
        attach_deliverable(p, "review-rescue", review_only=True)
        rescue_report = root / "review-rescue-report.json"
        rescue_report.write_text(json.dumps({
            "score": threshold(), "ship": True, "hard_fails": []
        }) + "\n", encoding="utf-8")
        ok("a rescue film is playable but explicitly review-required",
           check_deliverable(p)[0] and read_state(p)["review_required"])
        ok("a perfect score cannot publish a review-only rescue",
           not finish(p, "publishable", report=rescue_report)[0])
        rescue_package = durable_review(p, "review-rescue")
        ok("the rescue still closes honestly with a durable video",
           finish(p, "needs_review", reason="full renderer failed",
                  review_package=rescue_package,
                  review_root=root / "runs" / "review")[0])

        p = root / "corrupt-state.json"
        initialise(p, "corrupt", "dry-run")
        corrupt = root / "corrupt.mp4"
        corrupt_board = root / "corrupt-board.json"
        corrupt_manifest = root / "corrupt-manifest.json"
        corrupt.write_bytes(b"not a video")
        corrupt_board.write_text(
            '{"runtime_s": 0.5, "scenes": [{"start_s": 0, "duration_s": 0.5}]}\n',
            encoding="utf-8")
        from render_manifest import build as build_manifest
        corrupt_manifest.write_text(
            json.dumps(build_manifest(corrupt, corrupt_board), indent=2) + "\n",
            encoding="utf-8")
        ok("bytes merely named mp4 cannot satisfy the deliverable contract",
           not register_deliverable(p, corrupt, corrupt_board, corrupt_manifest)[0])

        p = root / "wrong-runtime-state.json"
        initialise(p, "wrong-runtime", "dry-run")
        wrong_runtime_board = root / "wrong-runtime-board.json"
        wrong_runtime_manifest = root / "wrong-runtime-manifest.json"
        wrong_runtime_board.write_text(
            '{"runtime_s": 1.5, "scenes": [{"start_s": 0, "duration_s": 1.5}]}\n',
            encoding="utf-8")
        wrong_runtime_manifest.write_text(
            json.dumps(build_manifest(seed_film, wrong_runtime_board), indent=2) + "\n",
            encoding="utf-8")
        ok("a short film cannot register against a longer board",
           not register_deliverable(
               p, seed_film, wrong_runtime_board, wrong_runtime_manifest)[0])

        small_film = root / "small.mp4"
        made_small = subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", str(seed_film),
            "-vf", "scale=64:64", "-c:v", "libx264", "-c:a", "copy", str(small_film),
        ], capture_output=True).returncode == 0
        p = root / "small-state.json"
        initialise(p, "small", "dry-run")
        small_board = root / "small-board.json"
        small_manifest = root / "small-manifest.json"
        small_board.write_text(
            '{"runtime_s": 0.5, "scenes": [{"start_s": 0, "duration_s": 0.5}]}\n',
            encoding="utf-8")
        small_manifest.write_text(
            json.dumps(build_manifest(small_film, small_board), indent=2) + "\n",
            encoding="utf-8")
        ok("a decodable video in the wrong frame cannot register",
           made_small and not register_deliverable(
               p, small_film, small_board, small_manifest)[0])

        p = root / "research.json"
        ok("initialises a production ledger", initialise(p, "r1", "production")[0])
        for n in range(3):
            ok(f"research reservation {n + 1} clears",
               reserve(p, {"research_agents": 1}, "candidate")[0])
        allowed, _ = reserve(p, {"research_agents": 1}, "the fourth candidate")
        s = read_state(p)
        ok("a fourth researcher is refused", not allowed)
        ok("budget exhaustion requires review without terminating empty",
           s["review_required"] and s["terminal_state"] is None
           and s["phase"] == COMPLETION_PHASE)
        ok("the refused call was not counted", s["usage"]["research_agents"] == 3)
        ok("an empty run cannot finish needs_review",
           not finish(p, "needs_review", reason="research budget exhausted",
                      review_package=root / "missing")[0])
        attach_deliverable(p, "research-fallback")
        rp = durable_review(p, "research-fallback")
        ok("the same run can finish once its fallback video is durable",
           finish(p, "needs_review", reason="research budget exhausted",
                  review_package=rp, review_root=root / "runs" / "review")[0])
        ok("durable review completion is idempotent after a crash",
           finish(p, "needs_review", reason="research budget exhausted",
                  review_package=rp, review_root=root / "runs" / "review")[0])

        p = root / "panels.json"
        initialise(p, "r2", "production")
        ok("scorer calls cannot be spent outside an atomic panel",
           not reserve(p, {"scorer_calls": 3}, "side-door judges")[0])
        ok("a partial panel cannot consume a full-panel round", not reserve_panel(p, 1)[0])
        for n in range(5):
            ok(f"panel {n + 1} reserves one round and three judges",
               reserve_panel(p, 3, f"round {n + 1}")[0])
        s = read_state(p)
        ok("the fifth panel locks hard-fail cleanup", s["phase"] == CLEANUP_PHASE)
        ok("five panels consumed exactly fifteen scorer calls",
           s["usage"]["panel_rounds"] == 5 and s["usage"]["scorer_calls"] == 15)
        ok("a sixth panel is mechanically refused without killing cheap cleanup",
           not reserve_panel(p, 3, "round six")[0]
           and read_state(p)["terminal_state"] is None)
        ok("a phase command cannot escape hard-fail cleanup",
           not set_phase(p, "panel")[0] and read_state(p)["phase"] == CLEANUP_PHASE)
        ok("the cleanup allowance cannot be consumed by name",
           not reserve(p, {CLEANUP_RENDER_RESOURCE: 1}, "manual debit")[0])
        ok("the rescue allowance cannot be consumed by name",
           not reserve(p, {RESCUE_RENDER_RESOURCE: 1}, "manual debit")[0])
        ok("one post-panel cleanup render is allowed and charged atomically",
           reserve(p, {"full_renders": 1}, "batched cleanup")[0])
        s = read_state(p)
        ok("the cleanup render uses its protected ledger, not an ordinary round render",
           s["usage"]["full_renders"] == 0 and s["usage"][CLEANUP_RENDER_RESOURCE] == 1)
        ok("a second post-panel cleanup render is refused but still not an empty terminal",
           not reserve(p, {"full_renders": 1}, "another cleanup render")[0]
           and read_state(p)["terminal_state"] is None)

        p = root / "rescue.json"
        initialise(p, "r2-rescue", "dry-run")
        for n in range(5):
            ok(f"ordinary full render {n + 1} is reserved",
               reserve(p, {"full_renders": 1}, f"render {n + 1}")[0])
        ok("an ordinary render over cap switches to completion instead of ending empty",
           not reserve(p, {"full_renders": 1}, "failed sixth attempt")[0]
           and read_state(p)["phase"] == COMPLETION_PHASE)
        ok("completion mode retains one controller-owned rescue render",
           reserve(p, {"full_renders": 1}, "deliverable rescue")[0]
           and read_state(p)["usage"][RESCUE_RENDER_RESOURCE] == 1)

        p = root / "boards.json"
        initialise(p, "r2b", "dry-run")
        ok("initial low-resolution preflight is allowed",
           reserve(p, {"preflight_renders": 1}, "first board")[0])
        for n in range(4):
            ok(f"corrective reboard {n + 1} is allowed",
               reserve(p, {"reboards": 1}, f"structural fix {n + 1}")[0])
        ok("the reboard's second preflight is allowed",
           reserve(p, {"preflight_renders": 1}, "reboard")[0])
        for n in range(3, 7):
            ok(f"preflight {n} is allowed",
               reserve(p, {"preflight_renders": 1}, f"preview {n}")[0])
        ok("a seventh preflight is mechanically refused",
           not reserve(p, {"preflight_renders": 1}, "another preview")[0])
        # A separate state makes the reboard case independent of completion mode.
        p = root / "reboards.json"
        initialise(p, "r2c", "dry-run")
        for n in range(4):
            reserve(p, {"reboards": 1}, f"structural correction {n + 1}")
        ok("a fifth reboard is mechanically refused",
           not reserve(p, {"reboards": 1}, "another board")[0])

        p = root / "tts.json"
        initialise(p, "r3", "production")
        for n in range(4):
            ok(f"TTS call {n + 1} clears", reserve(p, {"tts_calls": 1}, "take")[0])
        ok("a fifth TTS call is refused", not reserve(p, {"tts_calls": 1}, "take five")[0])

        low = root / "low.json"
        low.write_text(json.dumps({"score": threshold() - 0.1, "hard_fails": []}) + "\n")
        p = root / "low-state.json"
        initialise(p, "r4", "production")
        attach_deliverable(p, "low")
        accepted, _ = finish(p, "publishable", report=low)
        ok("a below-bar report cannot become publishable", not accepted)
        ok("...but it remains open until a durable video package exists",
           read_state(p)["terminal_state"] is None and read_state(p)["review_required"])
        low_review = durable_review(p, "low")
        ok("a correctly shaped package outside the tracked review root is refused",
           not finish(p, "needs_review", reason="fifth panel remained below bar",
                      review_package=low_review, review_root=root / "somewhere-else")[0])
        ok("the below-bar run closes only with its video package",
           finish(p, "needs_review", reason="fifth panel remained below bar",
                  review_package=low_review, review_root=root / "runs" / "review")[0])

        high = root / "high.json"
        high.write_text(json.dumps({"score": threshold(), "ship": True, "hard_fails": []}) + "\n")
        p = root / "dry.json"
        initialise(p, "r5", "dry-run")
        attach_deliverable(p, "dry")
        ok("a passing dry run may finish its editorial work",
           finish(p, "publishable", report=high)[0])
        ok("...and may verify the package without publishing",
           check_package(p, high)[0])
        ok("...but dry-run mode cannot deliver", not check_delivery(p, high)[0])

        p = root / "prod.json"
        initialise(p, "r6", "production")
        attach_deliverable(p, "prod")
        ok("a passing production report becomes publishable",
           finish(p, "publishable", report=high)[0])
        ok("the exact report is authorised", check_delivery(p, high)[0])
        high.write_text(json.dumps({"score": threshold() + 1, "ship": True}) + "\n")
        ok("a changed report is refused after approval", not check_delivery(p, high)[0])

        p = root / "override.json"
        initialise(p, "r7", "production")
        attach_deliverable(p, "override")
        override_review = durable_review(p, "override")
        finish(p, "needs_review", reason="panel budget exhausted",
               review_package=override_review, review_root=root / "runs" / "review")
        ok("an owner override needs the exact confirmation",
           not owner_override(p, low, "owner accepts this cut", "yes")[0])
        ok("an explicit owner override is recorded",
           owner_override(p, low, "owner accepts this cut", "OWNER DIRECTED PUBLISH")[0])
        ok("the override remains visible in the ledger", bool(read_state(p).get("owner_override")))

        p = root / "telemetry.json"
        initialise(p, "r8", "dry-run")
        reserve(p, {"tts_calls": 1}, "take one")
        ok("observed call telemetry is recorded",
           record_telemetry(p, "tts_calls", 421, 87, "take one")[0])
        s = read_state(p)
        ok("...with elapsed time and provider-reported tokens",
           s["events"][-1]["elapsed_ms"] == 421
           and s["usage"]["reported_tokens"] == 87)

    print(f"run_controller: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--state", default=str(DEFAULT_STATE))
    sub = ap.add_subparsers(dest="command")

    p = sub.add_parser("init")
    p.add_argument("--run-id", required=True)
    p.add_argument("--mode", choices=("production", "dry-run"), required=True)

    p = sub.add_parser("consume")
    p.add_argument("--resource", required=True)
    p.add_argument("--amount", type=int, default=1)
    p.add_argument("--note", default="")

    p = sub.add_parser("panel")
    p.add_argument("--judges", type=int, default=3)
    p.add_argument("--note", default="")

    p = sub.add_parser("phase")
    p.add_argument("--name", required=True)

    p = sub.add_parser("finish")
    p.add_argument("--result", choices=sorted(TERMINAL), required=True)
    p.add_argument("--reason", default="")
    p.add_argument("--report")
    p.add_argument("--review-package")

    p = sub.add_parser("register-deliverable")
    p.add_argument("--film", required=True)
    p.add_argument("--board", required=True)
    p.add_argument("--manifest", required=True)
    p.add_argument("--review-only", action="store_true")
    p.add_argument("--reason", default="")

    sub.add_parser("check-deliverable")

    p = sub.add_parser("materialize-deliverable")
    p.add_argument("--directory", required=True)

    p = sub.add_parser("check-delivery")
    p.add_argument("--report", required=True)

    p = sub.add_parser("check-package")
    p.add_argument("--report", required=True)

    p = sub.add_parser("telemetry")
    p.add_argument("--resource", required=True)
    p.add_argument("--elapsed-ms", type=int, required=True)
    p.add_argument("--tokens", type=int, default=0)
    p.add_argument("--note", default="")

    p = sub.add_parser("owner-override")
    p.add_argument("--report", required=True)
    p.add_argument("--reason", required=True)
    p.add_argument("--confirm", required=True)

    sub.add_parser("status")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.command:
        ap.print_usage(sys.stderr)
        return 2

    state_path = Path(a.state)
    try:
        if a.command == "init":
            accepted, message = initialise(state_path, a.run_id, a.mode)
        elif a.command == "consume":
            accepted, message = reserve(state_path, {a.resource: a.amount}, a.note)
        elif a.command == "panel":
            accepted, message = reserve_panel(state_path, a.judges, a.note)
        elif a.command == "phase":
            accepted, message = set_phase(state_path, a.name)
        elif a.command == "finish":
            accepted, message = finish(
                state_path, a.result, a.reason, Path(a.report) if a.report else None,
                Path(a.review_package) if a.review_package else None)
        elif a.command == "register-deliverable":
            accepted, message = register_deliverable(
                state_path, Path(a.film), Path(a.board), Path(a.manifest),
                review_only=a.review_only, reason=a.reason)
        elif a.command == "check-deliverable":
            accepted, message = check_deliverable(state_path)
        elif a.command == "materialize-deliverable":
            accepted, message = materialize_deliverable(
                state_path, Path(a.directory))
        elif a.command == "check-delivery":
            accepted, message = check_delivery(state_path, Path(a.report))
        elif a.command == "check-package":
            accepted, message = check_package(state_path, Path(a.report))
        elif a.command == "telemetry":
            accepted, message = record_telemetry(
                state_path, a.resource, a.elapsed_ms, a.tokens, a.note)
        elif a.command == "owner-override":
            accepted, message = owner_override(
                state_path, Path(a.report), a.reason, a.confirm)
        else:
            print(json.dumps(read_state(state_path), indent=2, sort_keys=True))
            return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError, ImportError) as exc:
        print(f"run controller: cannot run: {exc}", file=sys.stderr)
        return 2
    print(message, file=sys.stdout if accepted else sys.stderr)
    return 0 if accepted else 1


if __name__ == "__main__":
    sys.exit(main())
