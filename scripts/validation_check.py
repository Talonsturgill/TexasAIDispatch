#!/usr/bin/env python3
"""Refuse a validator report that belongs to another Dispatch.

The September 9 package once copied a still-valid September 8 report into the new run. Every
film gate passed because the validator file existed, but its date and findings described a
different story. This check binds the report to the board date and to the current claims before
delivery can copy it into ``runs/``.
"""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

# Earlier runs used different validator-report shapes. This contract starts with the run whose
# cross-day copy exposed the gap; history before it remains immutable rather than being rewritten
# to satisfy a gate that did not exist when those packages shipped.
CONTRACT_DATE = "2026-09-09"


def load(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"{path} is not readable JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{path} must contain one JSON object")
    return value


def check(validation_path: Path, claims_path: Path, board_path: Path) -> list[str]:
    problems: list[str] = []
    try:
        validation = load(validation_path)
        claims = load(claims_path)
        board = load(board_path)
    except ValueError as exc:
        return [str(exc)]

    board_date = str(board.get("date") or "")
    report_date = str(validation.get("date") or "")
    if not board_date:
        problems.append("the storyboard has no date, so the validation can't be bound to a run")
    elif report_date != board_date:
        problems.append(
            f"validation date {report_date!r} does not match storyboard date {board_date!r}. "
            "This report belongs to a different Dispatch."
        )

    current_verified = {
        str(claim.get("id"))
        for claim in claims.get("claims", [])
        if isinstance(claim, dict) and claim.get("verdict") == "VERIFIED" and claim.get("id")
    }
    reported = validation.get("verified_claim_ids")
    if not isinstance(reported, list) or not all(isinstance(item, str) for item in reported):
        problems.append("validation verified_claim_ids must be a list of claim ids")
    else:
        report_ids = set(reported)
        missing = sorted(current_verified - report_ids)
        unknown = sorted(report_ids - current_verified)
        if missing:
            problems.append("validation omits current verified claim ids: " + ", ".join(missing))
        if unknown:
            problems.append("validation names ids that are not current verified claims: " +
                            ", ".join(unknown))

    if validation.get("result") not in {"PASS", "PASS_WITH_DROPS"}:
        problems.append("validation result must be PASS or PASS_WITH_DROPS before delivery")
    if not validation.get("source"):
        problems.append("validation names no source")
    for field in ("rejected", "required_edits_applied"):
        value = validation.get(field)
        if not isinstance(value, list) or not value or not all(
                isinstance(item, str) and item.strip() for item in value):
            problems.append(f"validation {field} must be a non-empty list of findings")
    return problems


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool, extra: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}"
              f"{'' if condition else '  ' + extra}")
        if not condition:
            failures += 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        board = root / "storyboard.json"
        claims = root / "claims.json"
        validation = root / "validation.json"
        board.write_text(json.dumps({"date": "2026-09-09"}), encoding="utf-8")
        claims.write_text(json.dumps({"claims": [
            {"id": "c1", "verdict": "VERIFIED"},
            {"id": "c2", "verdict": "REJECTED"},
        ]}), encoding="utf-8")
        good = {
            "date": "2026-09-09",
            "source": "validator",
            "result": "PASS_WITH_DROPS",
            "verified_claim_ids": ["c1"],
            "rejected": ["an unsupported conclusion"],
            "required_edits_applied": ["the conclusion was removed"],
        }
        validation.write_text(json.dumps(good), encoding="utf-8")
        ok("a report bound to the current date and claims passes",
           not check(validation, claims, board))

        validation.write_text(json.dumps({**good, "date": "2026-09-08"}), encoding="utf-8")
        problems = check(validation, claims, board)
        ok("a prior day's report is refused", any("different Dispatch" in p for p in problems),
           str(problems))

        validation.write_text(json.dumps({**good, "verified_claim_ids": ["c9"]}),
                              encoding="utf-8")
        problems = check(validation, claims, board)
        ok("unknown and missing claim ids are both refused",
           any("omits" in p for p in problems) and any("not current" in p for p in problems),
           str(problems))

        validation.write_text(json.dumps({**good, "result": "FAIL"}), encoding="utf-8")
        ok("a failed validation can't enter delivery", bool(check(validation, claims, board)))

    print(f"validation_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validation", default="out/dispatch/validation.json")
    parser.add_argument("--claims", default="out/dispatch/claims.json")
    parser.add_argument("--board", default="out/dispatch/storyboard.json")
    parser.add_argument("--all", action="store_true",
                        help="check every shipped run that carries a validator report")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    if args.all:
        problems: list[str] = []
        checked = 0
        for validation in sorted((Path(__file__).resolve().parents[1] / "runs").glob(
                "????-??-??/validation.json")):
            if validation.parent.name < CONTRACT_DATE:
                continue
            checked += 1
            run = validation.parent
            for problem in check(validation, run / "claims.json", run / "storyboard.json"):
                problems.append(f"{run.name}: {problem}")
        if checked == 0:
            problems.append("no shipped validation report was found, so --all checked nothing")
    else:
        checked = 1
        problems = check(Path(args.validation), Path(args.claims), Path(args.board))
    if problems:
        print("validation_check: FAIL")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    print(f"validation_check: OK — {checked} validator report(s) match their board and claims")
    return 0


if __name__ == "__main__":
    sys.exit(main())
