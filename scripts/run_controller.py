#!/usr/bin/env python3
"""run_controller.py - enforce the cost and terminal-state contract for one Dispatch.

The August 18th run had budgets written as warnings and a law that allowed only delivery. That
combination could describe runaway work and could not stop it. This controller owns the opposite
contract. Expensive work is reserved before it is spent, a limit is mechanical, and exhausting
one ends the run as ``needs_review``. Delivery is possible only from a hash-bound passing report
in production mode.

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
        "limits": owned,
        "usage": {name: 0 for name in owned},
        "events": [],
    }
    event(state, "initialised", mode=mode)
    save(path, state)
    return True, f"run controller: initialised {run_id} in {mode} mode at {path}"


def reserve(path: Path, amounts: dict[str, int], note: str = "") -> tuple[bool, str]:
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

    over = []
    for name, amount in amounts.items():
        after = int(state["usage"].get(name, 0)) + amount
        if after > int(state["limits"][name]):
            over.append((name, after, int(state["limits"][name])))
    if over:
        reason = "; ".join(f"{name} would be {after} over its {cap} cap"
                           for name, after, cap in over)
        state["terminal_state"] = "needs_review"
        state["terminal_reason"] = "budget exhausted: " + reason
        event(state, "budget_exhausted", attempted=amounts, note=note, reason=reason)
        save(path, state)
        return False, (
            f"run controller: NEEDS REVIEW. {reason}. The attempted work was not spent and "
            "delivery is now closed."
        )

    for name, amount in amounts.items():
        state["usage"][name] = int(state["usage"].get(name, 0)) + amount
    event(state, "reserved", resources=amounts, note=note)
    save(path, state)
    used = ", ".join(f"{k}={state['usage'][k]}/{state['limits'][k]}" for k in amounts)
    return True, f"run controller: reserved {used}"


def set_phase(path: Path, name: str) -> tuple[bool, str]:
    state = read_state(path)
    if state.get("terminal_state"):
        return False, f"run controller: {state['terminal_state']} is terminal"
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


def finish(path: Path, result: str, reason: str = "", report: Path | None = None
           ) -> tuple[bool, str]:
    if result not in TERMINAL:
        return False, f"run controller: unknown terminal state {result}"
    state = read_state(path)
    current = state.get("terminal_state")
    if current:
        return False, f"run controller: state is already terminal as {current}"

    if result == "needs_review":
        if not reason.strip():
            return False, "run controller: needs_review requires an evidence-based reason"
        state["terminal_state"] = result
        state["terminal_reason"] = reason.strip()
        event(state, "finished", result=result, reason=reason.strip())
        save(path, state)
        return True, f"run controller: {result}. {reason.strip()}"

    if report is None or not report.is_file():
        return False, "run controller: publishable requires an existing --report"
    score, hard = report_result(report)
    bar = threshold()
    if score < bar or hard:
        why = ([f"panel score {score:.3f} is below the rubric"] if score < bar else []) + hard
        state["terminal_state"] = "needs_review"
        state["terminal_reason"] = "; ".join(why)
        event(state, "publish_refused", score=score, report=str(report), reasons=why)
        save(path, state)
        return False, "run controller: NEEDS REVIEW. " + "; ".join(why)

    state["terminal_state"] = "publishable"
    state["terminal_reason"] = None
    state["final_report"] = {
        "path": str(report),
        "sha256": digest(report),
        "score": score,
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
    saved = state.get("final_report") or {}
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
    run-wide token budget; crossing it closes the run as ``needs_review``.
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
    score, hard = report_result(report)
    state["terminal_state"] = "publishable"
    state["terminal_reason"] = None
    state["owner_override"] = {"reason": reason.strip(), "at": now(), "score": score,
                               "hard_fails": hard}
    state["final_report"] = {"path": str(report), "sha256": digest(report), "score": score}
    event(state, "owner_override", reason=reason.strip(), score=score,
          hard_fails=hard, report_sha256=state["final_report"]["sha256"])
    save(path, state)
    return True, "run controller: owner-directed publish recorded and hash-bound"


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
        "preflight_renders": 3,
        "reboards": 1,
        "voice_directors": 1,
        "panel_rounds": 2,
        "scorer_calls": 6,
        "full_renders": 4,
        "tts_calls": 4,
        "reported_tokens": 250000,
    }
    actual_limits = limits()
    ok("the approved run-wide cost contract has not drifted",
       actual_limits == expected_limits,
       f"expected {expected_limits}, got {actual_limits}")

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)

        p = root / "research.json"
        ok("initialises a production ledger", initialise(p, "r1", "production")[0])
        for n in range(3):
            ok(f"research reservation {n + 1} clears",
               reserve(p, {"research_agents": 1}, "candidate")[0])
        allowed, _ = reserve(p, {"research_agents": 1}, "the fourth candidate")
        s = read_state(p)
        ok("a fourth researcher is refused", not allowed)
        ok("budget exhaustion becomes needs_review", s["terminal_state"] == "needs_review")
        ok("the refused call was not counted", s["usage"]["research_agents"] == 3)

        p = root / "panels.json"
        initialise(p, "r2", "production")
        ok("panel one reserves one round and three judges",
           reserve(p, {"panel_rounds": 1, "scorer_calls": 3}, "round one")[0])
        ok("panel two does too",
           reserve(p, {"panel_rounds": 1, "scorer_calls": 3}, "round two")[0])
        ok("panel three is mechanically refused",
           not reserve(p, {"panel_rounds": 1, "scorer_calls": 3}, "round three")[0])

        p = root / "boards.json"
        initialise(p, "r2b", "dry-run")
        ok("initial low-resolution preflight is allowed",
           reserve(p, {"preflight_renders": 1}, "first board")[0])
        ok("one reboard is allowed", reserve(p, {"reboards": 1}, "structural fix")[0])
        ok("the reboard's second preflight is allowed",
           reserve(p, {"preflight_renders": 1}, "reboard")[0])
        ok("the final timed-board preflight is allowed",
           reserve(p, {"preflight_renders": 1}, "timed board")[0])
        ok("a fourth preflight is mechanically refused",
           not reserve(p, {"preflight_renders": 1}, "another preview")[0])
        # Use a separate state because the refused fourth preflight is already terminal.
        p = root / "reboards.json"
        initialise(p, "r2c", "dry-run")
        reserve(p, {"reboards": 1}, "first structural correction")
        ok("a second reboard is mechanically refused",
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
        accepted, _ = finish(p, "publishable", report=low)
        ok("a below-bar report cannot become publishable", not accepted)
        ok("...and closes as needs_review", read_state(p)["terminal_state"] == "needs_review")

        high = root / "high.json"
        high.write_text(json.dumps({"score": threshold(), "ship": True, "hard_fails": []}) + "\n")
        p = root / "dry.json"
        initialise(p, "r5", "dry-run")
        ok("a passing dry run may finish its editorial work",
           finish(p, "publishable", report=high)[0])
        ok("...and may verify the package without publishing",
           check_package(p, high)[0])
        ok("...but dry-run mode cannot deliver", not check_delivery(p, high)[0])

        p = root / "prod.json"
        initialise(p, "r6", "production")
        ok("a passing production report becomes publishable",
           finish(p, "publishable", report=high)[0])
        ok("the exact report is authorised", check_delivery(p, high)[0])
        high.write_text(json.dumps({"score": threshold() + 1, "ship": True}) + "\n")
        ok("a changed report is refused after approval", not check_delivery(p, high)[0])

        p = root / "override.json"
        initialise(p, "r7", "production")
        finish(p, "needs_review", reason="panel budget exhausted")
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
            accepted, message = reserve(
                state_path, {"panel_rounds": 1, "scorer_calls": a.judges}, a.note)
        elif a.command == "phase":
            accepted, message = set_phase(state_path, a.name)
        elif a.command == "finish":
            accepted, message = finish(
                state_path, a.result, a.reason, Path(a.report) if a.report else None)
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
