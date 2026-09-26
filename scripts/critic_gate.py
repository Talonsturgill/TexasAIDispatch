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
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


def renderer_digest(board: dict) -> str | None:
    """Bind the critic to the actual cinematic scene code, not board prose alone.

    September 25's false-green board review survived large edits to its bespoke
    episode because only the storyboard was hashed. The approved physical action
    has to be the code the renderer still executes when a preflight is spent.
    """
    template = str(board.get("cinematic_template") or "")
    if not template:
        return None
    router = REPO / "video-engine" / "src" / "Dispatch.tsx"
    source = router.read_text()
    branch = re.search(
        r"if\s*\(\s*cinematic_template\s*===\s*['\"]" + re.escape(template) +
        r"['\"]\s*\)\s*\{\s*return\s*<([A-Za-z][A-Za-z0-9_]*)", source)
    if not branch:
        raise ValueError(f"cinematic template {template!r} has no explicit renderer route")
    component = branch.group(1)
    imported = re.search(
        r"import\s*\{\s*" + re.escape(component) +
        r"\s*\}\s*from\s*['\"]\./([^'\"]+)['\"]", source)
    if not imported:
        raise ValueError(f"cannot find renderer source import for {component}")
    files = [router, REPO / "video-engine" / "src" / (imported.group(1) + ".tsx"),
             REPO / "video-engine" / "src" / "lib" / "cinema" / "CinematicStage.tsx",
             REPO / "video-engine" / "src" / "lib" / "direction.ts"]
    h = hashlib.sha256()
    for file in files:
        h.update(str(file.relative_to(REPO)).encode())
        h.update(b"\0")
        h.update(file.read_bytes())
        h.update(b"\0")
    for scene in board.get("scenes") or []:
        media = scene.get("generated_media")
        if not isinstance(media, dict):
            continue
        relative = str(media.get("file") or "")
        path = REPO / "video-engine" / "public" / relative
        if not relative.startswith("generated/") or not path.is_file():
            raise ValueError(f"reviewed generated asset is missing: {relative}")
        h.update(relative.encode())
        h.update(b"\0")
        h.update(path.read_bytes())
        h.update(b"\0")
    return h.hexdigest()


def concept_digest(board: dict) -> str:
    plan = copy.deepcopy(board)
    for key in ("runtime_s", "credits_s", "credits", "captions", "caption_method",
                "retimed_to", "retime_evidence"):
        plan.pop(key, None)
    for scene in plan.get("scenes") or []:
        for key in ("start_s", "duration_s", "duration_authored", "caption"):
            scene.pop(key, None)
        for event in scene.get("visual_events") or []:
            event.pop("at_s", None)
            event.pop("duration_s", None)
            event.pop("at_s_authored", None)
            event.pop("duration_s_authored", None)
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
    if board.get("cinematic_template") and report.get("renderer_sha256") != renderer_digest(board):
        errors.append("the independent critique belongs to different cinematic scene code")
    if not str(report.get("reviewer_identity") or "").strip() or not str(report.get("reviewed_at") or "").strip():
        errors.append("the critique lacks reviewer identity or review time")
    if not str(report.get("weakest_frame") or "").strip():
        errors.append("the critique does not name the weakest frame")
    return errors


def film_review_problems(board: dict, report: dict, preflight: dict,
                         board_sha256: str, film_sha256: str) -> list[str]:
    """A finished hero needs an independent pass on the exact phone animatic.

    Code-plan approval alone missed a card hidden by the subtitle and a latch
    that moved only a few phone pixels. This second binding keeps those observed
    defects from becoming an expensive full-resolution hero attempt.
    """
    if str(board.get("date") or "") < "2026-09-25":
        return []
    errors = problems(board, report)
    if report.get("review_scope") != "exact-muted-phone-preflight":
        errors.append("the independent critic has not reviewed the exact phone animatic")
    if report.get("reviewed_preflight_sha256") != film_sha256:
        errors.append("the independent phone review belongs to different film bytes")
    if preflight.get("pass") is not True:
        errors.append("the phone animatic has no passing structural report")
    if preflight.get("board_sha256") != board_sha256:
        errors.append("the structural phone report belongs to a different board")
    if preflight.get("film_sha256") != film_sha256:
        errors.append("the structural phone report belongs to different film bytes")
    if preflight.get("renderer_sha256") != renderer_digest(board):
        errors.append("the structural phone report belongs to different scene code")
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
    timed["scenes"][0]["duration_authored"]=4
    timed["scenes"][0]["visual_events"][0]["at_s"]=.22
    timed["scenes"][0]["visual_events"][0]["at_s_authored"]=.1
    timed["scenes"][0]["visual_events"][0]["duration_s_authored"]=.7
    timed["captions"]=[{"text":"A source-backed action"}]
    checks.append(("measured retime and captions retain it",not problems(timed,report)))
    phone={**report,"review_scope":"exact-muted-phone-preflight",
           "reviewed_preflight_sha256":"film-a"}
    structural={"pass":True,"board_sha256":"board-a","film_sha256":"film-a",
                "renderer_sha256":None}
    checks.append(("exact phone visual pass permits a finished hero",
                   not film_review_problems(board,phone,structural,"board-a","film-a")))
    checks.append(("code-plan pass alone cannot permit a finished hero",
                   bool(film_review_problems(board,report,structural,"board-a","film-a"))))
    checks.append(("changed phone film invalidates visual approval",
                   bool(film_review_problems(board,phone,structural,"board-a","film-b"))))
    checks.append(("rejected structural phone report blocks a finished hero",
                   bool(film_review_problems(board,phone,{**structural,"pass":False},"board-a","film-a"))))
    cinematic=copy.deepcopy(board); cinematic["cinematic_template"]="freight-invitation-v1"
    bound={**report,"concept_sha256":concept_digest(cinematic),
           "renderer_sha256":renderer_digest(cinematic)}
    checks.append(("critic binds the routed cinematic scene code",not problems(cinematic,bound)))
    stale={**bound,"renderer_sha256":"0"*64}
    checks.append(("stale cinematic scene code cannot unlock preflight",bool(problems(cinematic,stale))))
    sample=REPO / "video-engine" / "public" / "generated" / "denton-civic-chamber.png"
    if sample.is_file():
        visual=copy.deepcopy(cinematic)
        visual["scenes"][0]["generated_media"]={"file":"generated/denton-civic-chamber.png"}
        checks.append(("generated image bytes join the renderer binding",
                       renderer_digest(visual) != renderer_digest(cinematic)))
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
