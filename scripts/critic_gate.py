#!/usr/bin/env python3
"""Require a passing independent storyboard critique for the current creative plan.

The September 25 run spent sixteen preflights after its critic had returned REVISE.
Pixel-motion checks cannot decide whether those pixels explain the sourced action.
This gate makes that verdict a prerequisite to another render. Timing, caption and
credit work may continue without invalidating a critique of the visual concept.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import sys
from pathlib import Path


def concept_digest(board: dict) -> str:
    plan = copy.deepcopy(board)
    for key in ("runtime_s", "credits_s", "credits", "captions", "caption_method",
                "retimed_to", "retime_evidence"):
        plan.pop(key, None)
    for scene in plan.get("scenes") or []:
        for key in ("start_s", "duration_s", "caption"):
            scene.pop(key, None)
        for event in scene.get("visual_events") or []:
            event.pop("at_s", None)
            event.pop("duration_s", None)
    raw = json.dumps(plan, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def problems(board: dict, report: dict) -> list[str]:
    if str(board.get("date") or "") < "2026-09-25":
        return []
    errors = []
    if report.get("verdict") != "pass":
        errors.append("the independent storyboard critic has not passed this concept")
    if report.get("concept_sha256") != concept_digest(board):
        errors.append("the independent critique belongs to a different creative plan")
    if not str(report.get("reviewer_identity") or "").strip() or not str(report.get("reviewed_at") or "").strip():
        errors.append("the critique lacks reviewer identity or review time")
    if not str(report.get("weakest_frame") or "").strip():
        errors.append("the critique does not name the weakest frame")
    return errors


def check(board_path: Path, report_path: Path) -> list[str]:
    board = json.loads(board_path.read_text())
    if str(board.get("date") or "") < "2026-09-25":
        return []
    if not report_path.is_file():
        return ["independent storyboard critique is missing before preflight"]
    return problems(board, json.loads(report_path.read_text()))


def self_test() -> int:
    board={"date":"2026-09-25","scenes":[{"id":"s1","vo":"A source-backed action",
          "start_s":0,"duration_s":4,"visual_events":[{"id":"e","at_s":.1,
          "at_s_authored":.1,"duration_s":.7,"duration_s_authored":.7}]}]}
    report={"verdict":"revise","concept_sha256":concept_digest(board),
            "reviewer_identity":"independent critic","reviewed_at":"2026-09-25T12:00:00Z",
            "weakest_frame":"s1"}
    checks=[]
    checks.append(("revise blocks the render",bool(problems(board,report))))
    report["verdict"]="pass"
    checks.append(("pass unlocks only the reviewed concept",not problems(board,report)))
    changed=copy.deepcopy(board);changed["scenes"][0]["vo"]="Another story"
    checks.append(("creative revision invalidates the pass",bool(problems(changed,report))))
    timed=copy.deepcopy(board);timed["scenes"][0]["start_s"]=1.2
    timed["scenes"][0]["visual_events"][0]["at_s"]=.22
    timed["captions"]=[{"text":"A source-backed action"}]
    checks.append(("measured retime and captions retain it",not problems(timed,report)))
    for name,good in checks:print(('ok  ' if good else 'FAIL ')+name)
    return 0 if all(good for _,good in checks) else 1


def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--board',type=Path,default=Path('out/dispatch/storyboard.json'))
    ap.add_argument('--report',type=Path,default=Path('out/dispatch/storyboard_critic.json'))
    ap.add_argument('--self-test',action='store_true')
    args=ap.parse_args()
    if args.self_test:return self_test()
    try:errs=check(args.board,args.report)
    except (OSError,ValueError,KeyError,TypeError,json.JSONDecodeError) as exc:
        errs=[f'critique unreadable: {exc}']
    if errs:
        for error in errs:print('critic_gate: '+error,file=sys.stderr)
        return 1
    print('critic_gate: independent pass bound to the current creative plan')
    return 0


if __name__=='__main__':raise SystemExit(main())
