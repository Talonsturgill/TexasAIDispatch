#!/usr/bin/env python3
"""story_selection_check.py — make the Dispatch move the Docket, not chase AI vibes.

The selected story must name a dated Texas movement: who decided, filed, bought,
built, tested, opened, limited or challenged what; where; what changes; what happens
next; and whether a Texan still has a way in. Application reporting remains essential,
but it now hangs from a public movement instead of floating as a generic demo.

    story_selection_check.py --selection out/dispatch/story_selection.json
    story_selection_check.py --self-test
"""
from __future__ import annotations

import argparse
from datetime import date
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


STATUSES = {"in-record", "candidate-for-record", "outside-record"}
EVENTS = {"filed", "hearing", "ordered", "voted", "contracted", "launched", "published",
          "effective", "comment-deadline", "rehearing", "built", "tested"}


def substantial(value: object, words: int = 7) -> bool:
    return len(re.findall(r"[A-Za-z0-9']+", str(value or ""))) >= words


def http_url(value: object) -> bool:
    p = urlparse(str(value or ""))
    return p.scheme in {"http", "https"} and bool(p.netloc)


def problems(data: dict) -> list[str]:
    out: list[str] = []
    if data.get("schema") != "dispatch_story_selection/1":
        out.append("schema must be dispatch_story_selection/1")
    selected = data.get("selected")
    if not isinstance(selected, dict):
        return out + ["selected story is missing"]

    for field in ("title", "beat", "county", "texas_link"):
        if not str(selected.get(field) or "").strip():
            out.append(f"selected.{field} is missing")
    status = str(selected.get("record_status") or "")
    if status not in STATUSES:
        out.append(f"selected.record_status must be one of {', '.join(sorted(STATUSES))}")
    if status == "in-record":
        if not str(selected.get("record_id") or "").strip():
            out.append("an in-record story needs its Texas AI Docket record_id")
        if not http_url(selected.get("record_url")):
            out.append("an in-record story needs its Texas AI Docket record_url")

    movement = selected.get("movement")
    if not isinstance(movement, dict):
        out.append("selected.movement is missing")
        movement = {}
    for field in ("actor", "action", "object"):
        if not substantial(movement.get(field), 2):
            out.append(f"selected.movement.{field} is too thin")
    if movement.get("event_type") not in EVENTS:
        out.append(f"selected.movement.event_type must be one of {', '.join(sorted(EVENTS))}")
    try:
        date.fromisoformat(str(movement.get("date") or ""))
    except ValueError:
        out.append("selected.movement.date must be an ISO date")

    for field in ("why_today", "consequence", "application_change", "counter_image",
                  "earned_take"):
        if not substantial(selected.get(field)):
            out.append(f"selected.{field} needs a concrete sentence, not a label")

    agency = selected.get("agency")
    if not isinstance(agency, dict):
        out.append("selected.agency is missing")
        agency = {}
    if not substantial(agency.get("next_step"), 5):
        out.append("selected.agency.next_step must say what happens next")
    if not substantial(agency.get("who_can_act"), 3):
        out.append("selected.agency.who_can_act must name who still has a way in, or say why none")
    if not str(agency.get("open") or "") in {"yes", "no", "unknown"}:
        out.append("selected.agency.open must be yes, no, or unknown")

    sources = selected.get("sources")
    if not isinstance(sources, list) or not sources:
        out.append("selected.sources needs at least one fetched source")
    else:
        if not any(isinstance(source, dict) and source.get("source_type") == "primary"
                   and http_url(source.get("url")) for source in sources):
            out.append("selected.sources needs at least one primary-source URL")
        for i, source in enumerate(sources, 1):
            if not isinstance(source, dict) or not http_url(source.get("url")):
                out.append(f"selected.sources #{i} has no valid URL")
            elif not str(source.get("retrieved") or "").strip():
                out.append(f"selected.sources #{i} has no retrieval date")

    rejected = data.get("rejected")
    if not isinstance(rejected, list) or len(rejected) < 1:
        out.append("rejected needs at least one real alternative so 'why this one' is inspectable")
    else:
        for i, candidate in enumerate(rejected, 1):
            if not isinstance(candidate, dict) or not substantial(candidate.get("reason"), 5):
                out.append(f"rejected candidate #{i} needs a concrete reason")
    return out


def self_test() -> int:
    import copy
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    good = {
        "schema": "dispatch_story_selection/1",
        "selected": {
            "title": "The sentence the table dropped", "beat": "the-road", "county": "Harris",
            "texas_link": "A University of Houston team joined Texas police narratives to state pavement records.",
            "record_status": "candidate-for-record", "record_id": None, "record_url": None,
            "movement": {"actor": "University of Houston researchers", "action": "published a model study",
                         "object": "Texas crash narratives joined to pavement records",
                         "event_type": "published", "date": "2026-08-29"},
            "why_today": "The paper became public this week and supplies a new inspectable Texas road record.",
            "consequence": "Road engineers receive candidate segments to inspect rather than an automated repair order.",
            "application_change": "Narrative detail that tables discard can now enter the first screening pass.",
            "counter_image": "The model establishes association, not causation, and a field engineer still chooses the repair.",
            "earned_take": "The useful output is not a decision; it is the sentence the table had dropped.",
            "agency": {"next_step": "Engineers can inspect the flagged segments against field conditions and repair history.",
                       "who_can_act": "Road owners and researchers can validate the candidate list.", "open": "unknown"},
            "sources": [{"url": "https://example.edu/paper", "source_type": "primary",
                         "retrieved": "2026-08-30"}],
        },
        "rejected": [{"title": "A generic model launch",
                      "reason": "It had no dated Texas decision, place, user, or consequence."}],
    }
    ok("a dated Docket movement with consequence and agency passes", not problems(good),
       str(problems(good)))
    no_move = copy.deepcopy(good)
    no_move["selected"].pop("movement")
    ok("a generic trend with no movement is refused", any("movement" in p for p in problems(no_move)))
    no_primary = copy.deepcopy(good)
    no_primary["selected"]["sources"][0]["source_type"] = "journalism"
    ok("a story chosen from headlines alone is refused",
       any("primary-source" in p for p in problems(no_primary)))
    no_agency = copy.deepcopy(good)
    no_agency["selected"]["agency"]["next_step"] = "none"
    ok("a Docket story must say what happens next", any("next_step" in p for p in problems(no_agency)))
    no_choice = copy.deepcopy(good)
    no_choice["rejected"] = []
    ok("the selection must expose at least one alternative",
       any("why this one" in p for p in problems(no_choice)))
    print(f"story_selection_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--selection")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.selection:
        print("story_selection_check: --selection is required", file=sys.stderr)
        return 2
    try:
        data = json.loads(Path(args.selection).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"story_selection_check: cannot read selection: {exc}", file=sys.stderr)
        return 2
    found = problems(data)
    if found:
        print("story_selection_check: REFUSED", file=sys.stderr)
        for problem in found:
            print(f"  - {problem}", file=sys.stderr)
        return 1
    print("story_selection_check: dated Texas movement, consequence, counter-image and agency present")
    return 0


if __name__ == "__main__":
    sys.exit(main())
