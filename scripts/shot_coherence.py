#!/usr/bin/env python3
"""shot_coherence.py — prove that the sentence is staged, not merely described.

The first version of the Dispatch checked ``on_screen`` and ``what_moves`` against
the voice-over. Those are two paragraphs written by the same author. Remotion does
not render either one; it renders ``planes[].items``. A board could therefore say
"180,000 pavement records join police narratives" while drawing a road and a
pickup, and the coherence gate would congratulate the paragraph.

This gate resolves every required idea to IDs on the ACTUAL ITEMS THE RENDERER
CONSUMES. It then derives visible words from the component name and its rendered
props. It deliberately does not read ``on_screen``, ``what_moves``, ``hero`` or a
free-text ``evidence`` field. Those fields may help a director, but none is pixels.

The contract on every narrated scene is::

  "visual_proof": {
    "mute_takeaway": "what a stranger should learn with the sound off",
    "must_show": [
      {"concept": "24,000 police narratives", "item_ids": ["reports"]}
    ],
    "change": {
      "description": "report strips enter the classifier and become labels",
      "item_ids": ["reports", "classifier"]
    }
  }

Bound items need stable ``id`` values. Visual events need ``item_ids`` too, so an
authored verb must point at the same staged objects. The gate is semantic, not
clairvoyant: it can prove that a component carrying visible words/data is present;
only a rendered review can prove that its silhouette reads. That review remains.

    shot_coherence.py --board out/dispatch/storyboard.json
    shot_coherence.py --self-test

Exit 0 coherent, 1 incoherent, 2 unreadable input.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


STOP = set("""a an and are as at be been but by can could did do does for from had has have
how if in into is it its may more most not of on or our out over than that the their them then
there these they this those to too under was were what when where which who will with would
about after before during through while scene screen shows showing visible viewer viewers
model machine system data thing things""".split())

# These components describe the weather or the place. They can be beautiful and useful, but a
# cloud cannot be the sole proof for a claim about a contract, a model, or a public decision.
ATMOSPHERE = {
    "sky", "clearSky", "gulfOvercast", "seaFog", "shelfCloud", "thunderhead",
    "supercell", "blueNorther", "sunsetBands", "dustHaze", "greenHailSky",
    "smokeSky", "starfield", "monsoonCells", "grassTuft", "wildflowerVerge",
}

# Props that are either literally drawn as text/data or change an unmistakable silhouette.
# This is kind-specific on purpose. Accepting every arbitrary string in ``props`` would let a
# board attach ``label: 24,000 RECORDS`` to a pickup that never renders that label and pass the
# same lie under a new field name.
VISIBLE_PROPS: dict[str, set[str]] = {
    "readout": {"rows"},
    "detections": {"items"},
    "mask": {"label"},
    "person": {"cast", "pose", "emotion"},
    "readingStation": {"alerts"},
    "generatedMedia": {"must_depict", "prompt"},
    # Reusable evidence components added to the engine by this upgrade.
    "documentStream": {"title", "count", "sample", "status"},
    "dataJoin": {"leftTitle", "leftCount", "rightTitle", "rightCount", "result"},
    "associationDiagram": {"leftLabel", "rightLabel", "relation", "limit"},
    "inspectionMap": {"title", "county", "segments", "status"},
}


def split_words(value: Any) -> list[str]:
    """Lower-case words with camelCase split before tokenisation."""
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", str(value or ""))
    return re.findall(r"[a-z]+|\d[\d,]*(?:\.\d+)?", text.lower())


def tokens(value: Any) -> set[str]:
    return {w.replace(",", "") for w in split_words(value)
            if w not in STOP and (len(w) > 2 or w[:1].isdigit())}


def strings(value: Any) -> list[str]:
    """Strings and numbers a component can actually receive as visible props."""
    if isinstance(value, dict):
        out: list[str] = []
        for key, child in value.items():
            # Geometry/config keys do not become marks a viewer can identify.
            if key in {"x", "y", "x1", "y1", "x2", "y2", "w", "h", "rx", "ry",
                       "cx", "cy", "p", "scale", "seed", "phase", "rpm", "wear",
                       "conf", "showConf", "vertical", "wrong", "facing"}:
                continue
            out.extend(strings(child))
        return out
    if isinstance(value, list):
        return [part for child in value for part in strings(child)]
    if isinstance(value, (str, int, float)) and not isinstance(value, bool):
        return [str(value)]
    return []


def item_visual_tokens(item: dict) -> set[str]:
    """Evidence derived from a rendered kind and its props, never its authored ID."""
    kind = str(item.get("kind") or "")
    out = tokens(kind)
    bag = {**item, **(item.get("props") or {})}
    visible = {key: bag.get(key) for key in VISIBLE_PROPS.get(kind, set()) if key in bag}
    out |= tokens(" ".join(strings(visible)))
    return out


def indexed_items(scene: dict) -> tuple[dict[str, dict], list[str]]:
    found: dict[str, dict] = {}
    problems: list[str] = []
    media = scene.get("generated_media")
    replaced = ({str(item_id) for item_id in (media.get("replaces_item_ids") or [])}
                if isinstance(media, dict) else set())
    for pi, plane in enumerate(scene.get("planes") or []):
        if not isinstance(plane, dict):
            continue
        for ii, item in enumerate(plane.get("items") or []):
            if not isinstance(item, dict):
                continue
            item_id = str(item.get("id") or "").strip()
            if not item_id:
                continue
            if item_id in replaced:
                continue
            if not re.fullmatch(r"[a-z][a-z0-9-]*", item_id):
                problems.append(
                    f"item id {item_id!r} at plane {pi} item {ii} is not a stable lower-case slug")
            elif item_id in found:
                problems.append(f"item id {item_id!r} is used twice in one scene")
            else:
                found[item_id] = item
    if isinstance(media, dict) and str(media.get("id") or "").strip():
        media_id = str(media["id"]).strip()
        if media_id in found:
            problems.append(f"generated-media id {media_id!r} duplicates a staged item id")
        else:
            # The media prompt and must_depict list are the only pre-render semantic surface.
            # A later media gate hash-binds the actual asset and a visual critic reviews it.
            found[media_id] = {"kind": "generatedMedia", "props": {
                "must_depict": media.get("must_depict") or [],
                "prompt": media.get("prompt") or "",
            }}
    return found, problems


def scene_visual_tokens(scene: dict) -> set[str]:
    """All tokens carried by actual staged elements. Useful to the sound/flow gate."""
    media = scene.get("generated_media")
    replaced = ({str(item_id) for item_id in (media.get("replaces_item_ids") or [])}
                if isinstance(media, dict) else set())
    staged = [item for plane in (scene.get("planes") or []) if isinstance(plane, dict)
              for item in (plane.get("items") or []) if isinstance(item, dict)
              and str(item.get("id") or "") not in replaced]
    if isinstance(media, dict):
        staged.append({"kind": "generatedMedia", "props": {
            "must_depict": media.get("must_depict") or [], "prompt": media.get("prompt") or ""}})
    return set().union(*(item_visual_tokens(item) for item in staged)) if staged else set()


def concept_match(concept: str, items: list[dict]) -> tuple[bool, set[str], set[str]]:
    need = tokens(concept)
    visible = set().union(*(item_visual_tokens(item) for item in items)) if items else set()
    overlap = need & visible
    # One concrete word is enough for a one-word concept. Longer concepts need two marks; this
    # stops a road from satisfying "180,000 pavement records" merely because it is a road.
    required = 1 if len(need) <= 1 else 2
    return len(overlap) >= min(required, len(need)), need, visible


def figures(text: str) -> set[str]:
    """Canonical figures, reusing the TTS fidelity parser rather than inventing another."""
    try:
        from vo_soundcheck import figures as spoken_figures
        return {str(v) for v in spoken_figures(text)}
    except (ImportError, ValueError, TypeError):
        return {m.replace(",", "") for m in re.findall(r"\d[\d,]*(?:\.\d+)?", text or "")}


def check_scene(scene: dict) -> list[str]:
    sid = str(scene.get("id") or "?")
    vo = str(scene.get("vo") or "").strip()
    if not vo:
        return []
    out: list[str] = []
    items, item_problems = indexed_items(scene)
    out.extend(f"scene {sid}: {problem}" for problem in item_problems)

    proof = scene.get("visual_proof")
    if not isinstance(proof, dict):
        return out + [
            f"scene {sid}: narrated scene has no visual_proof. on_screen and what_moves are "
            "authored prose; bind the spoken idea to the IDs of items Remotion actually draws."
        ]
    takeaway = str(proof.get("mute_takeaway") or "").strip()
    if len(tokens(takeaway)) < 4:
        out.append(f"scene {sid}: visual_proof.mute_takeaway is too thin to say what a muted "
                   "stranger learns from the shot")

    must = proof.get("must_show")
    if not isinstance(must, list) or not 1 <= len(must) <= 4:
        out.append(f"scene {sid}: visual_proof.must_show needs one to four concrete ideas")
        must = []

    bound: set[str] = set()
    concept_text: list[str] = []
    for bi, binding in enumerate(must, 1):
        if not isinstance(binding, dict):
            out.append(f"scene {sid}: must_show #{bi} is not an object")
            continue
        concept = str(binding.get("concept") or "").strip()
        refs = binding.get("item_ids")
        if not concept or not isinstance(refs, list) or not refs:
            out.append(f"scene {sid}: must_show #{bi} needs a concept and at least one item_id")
            continue
        concept_text.append(concept)
        missing = [str(ref) for ref in refs if str(ref) not in items]
        if missing:
            out.append(f"scene {sid}: {concept!r} points at unstaged item id(s): "
                       f"{', '.join(missing)}")
            continue
        ref_ids = [str(ref) for ref in refs]
        bound.update(ref_ids)
        selected = [items[ref] for ref in ref_ids]
        if all(str(item.get("kind")) in ATMOSPHERE for item in selected):
            out.append(f"scene {sid}: {concept!r} is proved only by atmosphere. Weather can "
                       "set a claim; it cannot depict one.")
        matched, need, visible = concept_match(concept, selected)
        if not matched:
            out.append(
                f"scene {sid}: {concept!r} resolves to real items, but their visible surface "
                f"({', '.join(sorted(visible)) or 'nothing'}) does not carry the idea. "
                f"Required concept words: {', '.join(sorted(need)) or 'none'}.")

    # A concrete figure in the sentence is visually decisive and cheap to show. Requiring it in
    # the bound items prevents a generic machine from standing in for the scale of the record.
    said_figures = figures(vo)
    shown_figures = figures(" ".join(
        " ".join(strings(items[item_id].get("props") or {}))
        for item_id in bound if item_id in items))
    missing_figures = sorted(said_figures - shown_figures)
    if missing_figures:
        out.append(f"scene {sid}: spoken figure(s) {', '.join(missing_figures)} never appear in "
                   "the props of a bound rendered item")

    change = proof.get("change")
    if not isinstance(change, dict):
        out.append(f"scene {sid}: visual_proof.change is missing. A noun inventory is a slide; "
                   "name the visible transformation.")
        change = {}
    description = str(change.get("description") or "").strip()
    change_ids = change.get("item_ids")
    if len(tokens(description)) < 3:
        out.append(f"scene {sid}: visual_proof.change.description does not name a visible action")
    if not isinstance(change_ids, list) or not change_ids:
        out.append(f"scene {sid}: visual_proof.change needs item_ids for the things that change")
        change_ids = []
    missing_change = [str(ref) for ref in change_ids if str(ref) not in items]
    if missing_change:
        out.append(f"scene {sid}: visual change points at unstaged item id(s): "
                   f"{', '.join(missing_change)}")
    if bound and not (bound & {str(ref) for ref in change_ids}):
        out.append(f"scene {sid}: the things that move do not include any item proving the claim")

    events = scene.get("visual_events") or []
    event_refs = {str(ref) for event in events if isinstance(event, dict)
                  for ref in (event.get("item_ids") or [])}
    if not events:
        out.append(f"scene {sid}: no visual_events. The shot declares a change but schedules none.")
    elif not event_refs:
        out.append(f"scene {sid}: visual_events name prose but no item_ids, so the events are not "
                   "connected to anything Remotion draws")
    elif bound and not (bound & event_refs):
        out.append(f"scene {sid}: no visual event acts on an item that proves the spoken idea")

    # At least one declared concept must carry real subject matter from the sentence. This is
    # intentionally a low bar; the item-to-concept checks above are the stricter half.
    vo_tokens = tokens(vo)
    concept_tokens = tokens(" ".join(concept_text))
    if concept_tokens and not (vo_tokens & concept_tokens) and not said_figures:
        out.append(f"scene {sid}: the required visual concepts share no subject with the voice")
    return out


def check(board: dict) -> list[str]:
    return [problem for scene in (board.get("scenes") or []) for problem in check_scene(scene)]


def self_test() -> int:
    import copy
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    good = {"scenes": [{
        "id": "s1",
        "vo": "The model read twenty-four thousand police narratives.",
        "on_screen": "this prose is deliberately not consulted",
        "planes": [{"items": [
            {"id": "reports", "kind": "readout", "props": {
                "rows": [["POLICE NARRATIVES", "24,000"], ["STATUS", "READ"]]}},
            {"id": "classifier", "kind": "readingStation", "props": {"label": "MODEL"}},
        ]}],
        "visual_proof": {
            "mute_takeaway": "police narratives visibly enter a model in large volume",
            "must_show": [
                {"concept": "24,000 police narratives", "item_ids": ["reports"]},
                {"concept": "reading station", "item_ids": ["classifier", "reports"]},
            ],
            "change": {"description": "reports enter the model and become a read status",
                       "item_ids": ["reports", "classifier"]},
        },
        "visual_events": [{"at_s": 1.0, "what": "reports enter",
                           "item_ids": ["reports", "classifier"]}],
    }]}
    ok("a claim bound to rendered items and their visible props passes", not check(good),
       str(check(good)))

    lying_prose = copy.deepcopy(good)
    lying_prose["scenes"][0]["on_screen"] = "a cactus dances on the moon"
    ok("authored on_screen prose cannot change the verdict", not check(lying_prose))

    phantom = copy.deepcopy(good)
    phantom["scenes"][0]["visual_proof"]["must_show"][0]["item_ids"] = ["not-staged"]
    got = check(phantom)
    ok("a binding to a phantom object is refused", any("unstaged item" in p for p in got), str(got))

    wrong_pixels = copy.deepcopy(good)
    wrong_pixels["scenes"][0]["planes"][0]["items"][0] = {
        "id": "reports", "kind": "pickup", "props": {}}
    got = check(wrong_pixels)
    ok("replacing the evidence with an unrelated rendered object makes the gate red",
       any("visible surface" in p for p in got), str(got))
    ok("the spoken figure disappears with the visual that carried it",
       any("spoken figure" in p for p in got), str(got))

    prose_event = copy.deepcopy(good)
    prose_event["scenes"][0]["visual_events"][0].pop("item_ids")
    ok("a prose-only visual event is refused",
       any("events are not connected" in p for p in check(prose_event)))

    no_proof = copy.deepcopy(good)
    no_proof["scenes"][0].pop("visual_proof")
    ok("a narrated scene cannot omit the contract",
       any("authored prose" in p for p in check(no_proof)))

    atmosphere = copy.deepcopy(good)
    atmosphere["scenes"][0]["planes"][0]["items"][0] = {
        "id": "reports", "kind": "gulfOvercast", "props": {
            "label": "24,000 POLICE NARRATIVES"}}
    ok("atmosphere cannot be the sole evidence even when its metadata repeats the claim",
       any("proved only by atmosphere" in p for p in check(atmosphere)))

    print(f"shot_coherence: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.board:
        print("shot_coherence: --board is required", file=sys.stderr)
        return 2
    try:
        board = json.loads(Path(args.board).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"shot_coherence: cannot read board: {exc}", file=sys.stderr)
        return 2
    problems = check(board)
    if problems:
        print("shot_coherence: REFUSED", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1
    print("shot_coherence: every narrated idea resolves to rendered items and visible change")
    return 0


if __name__ == "__main__":
    sys.exit(main())
