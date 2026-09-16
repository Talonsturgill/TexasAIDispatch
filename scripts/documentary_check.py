#!/usr/bin/env python3
"""Check the documentary's timed viewer rewards against its real storyboard events."""
from __future__ import annotations
import argparse
import copy
from datetime import date
import json
import math
from pathlib import Path
import sys

REPO = Path(__file__).resolve().parents[1]
POLICY = REPO / "config/documentary.json"
CHANGE_TYPES = {"mechanism", "consequence", "evidence", "human_action", "location_reveal",
                "comparison", "reveal", "resolution"}

def policy() -> dict:
    return json.loads(POLICY.read_text())

def required(board: dict) -> bool:
    cfg = policy()
    return bool(board.get("documentary")) or str(board.get("date") or "") >= cfg["effective_date"]

def finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def timeline(board: dict) -> tuple[list[dict], list[str]]:
    """Resolve scene-local event times afresh, including after acoustic board retiming."""
    errors, lookup, rows = [], {}, []
    scenes = board.get("scenes") or []
    if not isinstance(scenes, list):
        return [], ["scenes must be a list"]
    for scene in scenes:
        if not isinstance(scene, dict):
            errors.append("scene must be an object")
            continue
        sid = scene.get("id")
        items = {i.get("id") for p in scene.get("planes", []) if isinstance(p, dict)
                 for i in p.get("items", []) if isinstance(i, dict) and i.get("id")}
        events = scene.get("visual_events") or []
        if not isinstance(events, list):
            errors.append(f"{sid}: visual_events must be a list")
            continue
        for event in events:
            if not isinstance(event, dict):
                errors.append(f"{sid}: event must be an object")
                continue
            eid = event.get("id")
            if not isinstance(eid, str) or not eid:
                errors.append(f"{sid}: every visual event needs a stable id")
                continue
            if eid in lookup:
                errors.append(f"duplicate visual event id {eid}")
                continue
            at, length = event.get("at_s"), event.get("duration_s", .6)
            start, dur = scene.get("start_s"), scene.get("duration_s")
            if not all(finite(x) for x in (at, length, start, dur)):
                errors.append(f"{eid}: event/scene times must be finite numbers")
                continue
            if at < 0 or length <= 0 or at+length > dur+.001:
                errors.append(f"{eid}: action must start and finish within its scene")
            bound = event.get("item_ids")
            if not isinstance(bound, list) or not bound or any(not isinstance(x,str) or x not in items for x in bound):
                errors.append(f"{eid}: event needs actual rendered item_ids in {sid}")
                continue
            lookup[eid] = dict(event, scene_id=sid, start_s=round(start+at, 6),
                               end_s=round(start+at+length, 6))
    beats = board.get("attention_beats")
    if not isinstance(beats, list) or not beats:
        return [], errors+["attention_beats must name the performed events"]
    seen = set()
    for beat in beats:
        if not isinstance(beat, dict):
            errors.append("attention beat must be an object")
            continue
        eid = beat.get("event_id")
        if not isinstance(eid, str) or eid not in lookup:
            errors.append(f"attention beat refers to missing event {eid!r}")
            continue
        if eid in seen:
            errors.append(f"attention beat repeats event {eid}")
            continue
        seen.add(eid)
        event = lookup[eid]
        for key in ("viewer_reward", "visible_change", "continuity_from", "sound_action"):
            if not isinstance(beat.get(key), str) or len(beat[key].strip()) < 8:
                errors.append(f"{eid}: {key} needs a concrete direction")
        if beat.get("change_type") not in CHANGE_TYPES:
            errors.append(f"{eid}: camera movement or text replacement alone is not a viewer reward")
        declared = beat.get("item_ids")
        if not isinstance(declared,list) or not declared or any(x not in event["item_ids"] for x in declared):
            errors.append(f"{eid}: attention item_ids must be bound to the same rendered event")
        # No second authored clock: it would drift after board_retime.
        if any(k in beat for k in ("at_s", "start_s", "end_s")):
            errors.append(f"{eid}: derive time from event_id; do not keep a second attention clock")
        rows.append({**beat, "scene_id": event["scene_id"], "start_s":event["start_s"],
                     "end_s":event["end_s"], "event_duration_s":event.get("duration_s",.6)})
    missing = set(lookup)-seen
    if missing:
        errors.append("visual events missing from attention review: "+", ".join(sorted(missing)))
    rows.sort(key=lambda row: (row["start_s"], row["event_id"]))
    return rows, errors

def check(board: dict) -> list[str]:
    if not required(board):
        return []
    cfg = policy()
    doc = board.get("documentary")
    if not isinstance(doc,dict) or doc.get("schema") != "dispatch_documentary/1":
        return ["current boards require documentary.schema dispatch_documentary/1"]
    errors = []
    for key in ("viewer_question","payoff","source_limit","hero_image","closing_answer"):
        if not isinstance(doc.get(key),str) or len(doc[key].strip())<12:
            errors.append(f"documentary.{key} needs a specific editorial answer")
    runtime=board.get("runtime_s")
    if not finite(runtime) or runtime<=0:
        return errors+["runtime_s must be a positive finite number"]
    rows, problems=timeline(board);errors.extend(problems)
    if not rows:
        return errors+["no resolvable attention events"]
    hook=next((r for r in rows if r["event_id"]==doc.get("hook_payoff_event")),None)
    if not hook or hook["end_s"]>cfg["first_payoff_by_s"]+.001:
        errors.append("the hook's visible payoff must finish by "+str(cfg["first_payoff_by_s"])+"s")
    moments=[0.0]+[r["start_s"] for r in rows]+[runtime]
    gaps=[b-a for a,b in zip(moments,moments[1:]) if b-a>.001]
    if any(g>cfg["max_gap_s"]+.001 for g in gaps):
        errors.append(f"viewer reward gap {max(gaps):.2f}s exceeds {cfg['max_gap_s']:.1f}s; revise the actual actions")
    if gaps and sum(gaps)/len(gaps)>cfg["target_gap_s"]+.001:
        errors.append("average viewer reward spacing is too slow for the documentary direction")
    for row in rows:
        if row["start_s"]<0 or row["end_s"]>runtime+.001:
            errors.append(f"{row['event_id']}: reward outside the story")
        if not cfg["min_transition_s"]<=row["event_duration_s"]<=cfg["max_transition_s"]:
            errors.append(f"{row['event_id']}: action duration outside directed range")
    return errors

def self_test() -> int:
    scene={"id":"s1","start_s":0,"duration_s":6,"planes":[{"items":[{"id":"pump","kind":"freshwaterSystem"}]}],
           "visual_events":[{"id":"stop","at_s":.3,"duration_s":.7,"item_ids":["pump"]},
                            {"id":"spread","at_s":3,"duration_s":.6,"item_ids":["pump"]}]}
    good={"date":"2026-09-16","runtime_s":6,"scenes":[scene],
          "documentary":{"schema":"dispatch_documentary/1","viewer_question":"Where can this failure spread?",
            "payoff":"A connected consequence becomes visible","source_limit":"This is an illustrative proposed system",
            "hero_image":"One pump and its connected branches","closing_answer":"The proposed research still needs a field test",
            "hook_payoff_event":"stop"},
          "attention_beats":[{"event_id":k,"item_ids":["pump"],"change_type":"mechanism",
             "viewer_reward":"The state of this pump changes","visible_change":"The rotor stops and the branch warns",
             "continuity_from":"The same pump carries the action","sound_action":"A motor decays into silence"} for k in ("stop","spread")]}
    cases=[]
    def add(label, mutate):
        b=copy.deepcopy(good);mutate(b);cases.append((label,bool(check(b))))
    cases.append(("valid current film resolves",not check(good)))
    add("missing current contract fails",lambda b:b.pop("documentary"))
    add("bunched events cannot conceal a dead tail",lambda b:b["scenes"][0]["visual_events"][1].update(at_s=.9))
    add("unknown rendered item fails",lambda b:b["scenes"][0]["visual_events"][0].update(item_ids=["ghost"]))
    add("camera drift cannot be the reward",lambda b:b["attention_beats"][0].update(change_type="camera"))
    add("duplicate event fails",lambda b:b["scenes"][0]["visual_events"][1].update(id="stop"))
    add("second clock fails",lambda b:b["attention_beats"][0].update(at_s=1))
    add("NaN time fails",lambda b:b["scenes"][0]["visual_events"][0].update(at_s=float("nan")))
    add("late hook fails",lambda b:b["documentary"].update(hook_payoff_event="spread"))
    add("event after scene fails",lambda b:b["scenes"][0]["visual_events"][1].update(duration_s=5))
    moved=copy.deepcopy(good);moved["scenes"][0]["start_s"]=7
    rows,errs=timeline(moved);cases.append(("scene retiming moves derived reward clock",not errs and rows[0]["start_s"]==7.3))
    cases.append(("archived boards are not rewritten",not check({"date":"2026-09-15"})))
    for name,ok in cases: print(f"  {'ok' if ok else 'FAIL'} {name}")
    return int(not all(ok for _,ok in cases))

def main() -> int:
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--board");ap.add_argument("--self-test",action="store_true")
    a=ap.parse_args()
    if a.self_test:return self_test()
    if not a.board:ap.error("--board is required")
    try:
        board=json.loads(Path(a.board).read_text());errors=check(board)
        for error in errors:print("documentary_check: "+error,file=sys.stderr)
        if not errors:print("documentary_check: directed contract and derived attention timing clear" if required(board) else "documentary_check: historical board, documentary contract not retroactive")
        return int(bool(errors))
    except (OSError,ValueError,TypeError,KeyError) as e:
        print("documentary_check: "+str(e),file=sys.stderr);return 1
if __name__=="__main__":sys.exit(main())
