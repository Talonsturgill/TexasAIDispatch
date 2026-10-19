#!/usr/bin/env python3
"""Refuse a validator report that belongs to another Dispatch.

The September 9 package once copied a still-valid September 8 report into the new run. Every
film gate passed because the validator file existed, but its date and findings described a
different story. This check binds the report to the board date and to the current claims before
delivery can copy it into ``runs/``.
"""
from __future__ import annotations

import argparse
from datetime import date as calendar_date
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


def check(validation_path: Path, claims_path: Path, board_path: Path | None = None,
          *, edition_date: str | None = None) -> list[str]:
    problems: list[str] = []
    try:
        validation = load(validation_path)
        claims = load(claims_path)
        if (board_path is None) == (edition_date is None):
            raise ValueError("supply one storyboard or an explicit early-phase edition date")
        if edition_date is not None:
            if calendar_date.fromisoformat(edition_date).isoformat() != edition_date:
                raise ValueError("early-phase edition date must be YYYY-MM-DD")
            board = {"date": edition_date}
        else:
            board = load(board_path)
    except ValueError as exc:
        return [str(exc)]

    board_date = str(board.get("date") or "")
    report_date = str(validation.get("date") or "")
    if not board_date:
        problems.append("the storyboard has no date, so the validation can't be bound to a run")
    elif report_date != board_date:
        binding_label = "edition" if edition_date is not None else "storyboard"
        problems.append(
            f"validation date {report_date!r} does not match {binding_label} date {board_date!r}. "
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
    # A complete independent PASS may have nothing to reject or correct. Requiring
    # invented findings contradicts the research handoff and alters the review.
    # Empty findings are valid only when every supplied claim is independently
    # verified; drops and incomplete claim sets retain the findings requirement.
    claim_rows = claims.get("claims")
    complete_pass = (
        validation.get("result") == "PASS"
        and isinstance(claim_rows, list) and bool(claim_rows)
        and all(isinstance(row, dict) and row.get("id")
                and row.get("verdict") == "VERIFIED" for row in claim_rows)
    )
    for field in ("rejected", "required_edits_applied"):
        value = validation.get(field)
        if not isinstance(value, list) or (not value and not complete_pass) or not all(
                isinstance(item, str) and item.strip() for item in value):
            problems.append(f"validation {field} must be a list of findings; only a complete "
                            "PASS over independently verified claims may use an empty list")
    state_path = validation_path.parent / 'run_state.json'
    if state_path.is_file():
        from validation_completion import source_validation_problems
        problems += source_validation_problems(load(state_path), validation_path.parent)
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
        ok("the same complete report can be checked before a board exists",
           not check(validation, claims, edition_date="2026-09-09"))
        ok("early validation refuses a report from another edition",
           bool(check(validation, claims, edition_date="2026-09-10")))
        ok("early validation refuses an invalid or ambiguous date",
           bool(check(validation, claims, edition_date="20260909")) and
           bool(check(validation, claims, board, edition_date="2026-09-09")))

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
        ok("early validation still refuses unknown and missing claim ids",
           bool(check(validation, claims, edition_date="2026-09-09")))

        validation.write_text(json.dumps({**good, "result": "FAIL"}), encoding="utf-8")
        ok("a failed validation can't enter delivery", bool(check(validation, claims, board)))
        ok("a failed validation can't enter picture production",
           bool(check(validation, claims, edition_date="2026-09-09")))

        complete_claims = {"claims": [
            {"id": "c1", "verdict": "VERIFIED"},
            {"id": "c2", "verdict": "VERIFIED"},
        ]}
        complete = {**good, "result": "PASS", "verified_claim_ids": ["c1", "c2"],
                    "rejected": [], "required_edits_applied": []}
        claims.write_text(json.dumps(complete_claims), encoding="utf-8")
        validation.write_text(json.dumps(complete), encoding="utf-8")
        ok("a complete independent PASS needs no invented rejection or edit",
           not check(validation, claims, board)
           and not check(validation, claims, edition_date="2026-09-09"))
        validation.write_text(json.dumps({**complete, "required_edits_applied":
                                         ["the spoken qualifier was corrected"]}), encoding="utf-8")
        ok("a complete PASS can retain real edits and an empty rejected list",
           not check(validation, claims, board))

        for field in ("rejected", "required_edits_applied"):
            for value in (None, "none", [""], ["   "], [1]):
                validation.write_text(json.dumps({**complete, field: value}), encoding="utf-8")
                ok(f"complete PASS refuses malformed {field} {value!r}",
                   bool(check(validation, claims, board)))
            missing_field = {k: v for k, v in complete.items() if k != field}
            validation.write_text(json.dumps(missing_field), encoding="utf-8")
            ok(f"complete PASS still requires {field}", bool(check(validation, claims, board)))

        for change in ({"verified_claim_ids": ["c1"]}, {"verified_claim_ids": ["c1", "c9"]},
                       {"date": "2026-09-08"}, {"result": "FAIL"},
                       {"result": "PASS_WITH_DROPS"}, {"source": ""}):
            validation.write_text(json.dumps({**complete, **change}), encoding="utf-8")
            ok(f"empty findings do not bypass {change!r}", bool(check(validation, claims, board)))

        validation.write_text(json.dumps(complete), encoding="utf-8")
        for rows in ([], [{"id": "c1", "verdict": "VERIFIED"},
                         {"id": "c2", "verdict": "REJECTED"}],
                     [{"id": "c1", "verdict": "VERIFIED"},
                      {"id": "c2", "verdict": "PARTIAL"}],
                     [{"verdict": "VERIFIED"}], [None]):
            claims.write_text(json.dumps({"claims": rows}), encoding="utf-8")
            ok("empty findings refuse an empty, incomplete or unverified claim set",
               bool(check(validation, claims, board)))
        for rows in ([], [{"id": "c1", "verdict": "VERIFIED"},
                         {"id": "c2", "verdict": "REJECTED"}]):
            claims.write_text(json.dumps({"claims": rows}), encoding="utf-8")
            reported_ids = [row["id"] for row in rows if row["verdict"] == "VERIFIED"]
            validation.write_text(json.dumps({**complete, "verified_claim_ids": reported_ids}),
                                  encoding="utf-8")
            ok("matching ids cannot hide an empty or partly rejected claim set",
               bool(check(validation, claims, board)))

    print(f"validation_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--validation", default="out/dispatch/validation.json")
    parser.add_argument("--claims", default="out/dispatch/claims.json")
    binding = parser.add_mutually_exclusive_group()
    binding.add_argument("--board", default="out/dispatch/storyboard.json")
    binding.add_argument("--date", help="check the source handoff before storyboarding; delivery still uses --board")
    parser.add_argument("--all", action="store_true",
                        help="check every shipped run that carries a validator report")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.all and args.date:
        parser.error("--all cannot use an early-phase --date")
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
        problems = check(Path(args.validation), Path(args.claims),
                         None if args.date else Path(args.board), edition_date=args.date)
    if problems:
        print("validation_check: FAIL")
        for problem in problems:
            print(f"  - {problem}")
        return 1
    binding_name = "edition date" if args.date else "board"
    print(f"validation_check: OK — {checked} validator report(s) match their {binding_name} and claims")
    return 0


if __name__ == "__main__":
    sys.exit(main())
