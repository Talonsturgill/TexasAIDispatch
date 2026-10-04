"""Strict county metadata correction with retained render and review provenance."""
from __future__ import annotations
import copy
import hashlib
import json
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCHEMA = "dispatch-geographic-metadata-continuation/1"
SIDECAR = "metadata-continuation.json"
MECHANISM = "carton-geographic-metadata-v1"
CORE_EVIDENCE = {"film.mp4", "preflight.mp4", "preflight.json", "storyboard_critic.json",
    "render-manifest.json", "vo_script.txt", "claims.json", "captions.json", "words.json",
    "mix.wav", "mix.json", "story_selection.json", "script_audit.json", "validation.json",
    "cinema/proof.json", "cinema/hero-review.json", "openings/comparison.json", "openings/selection.json"}


def evidence_manifest(refs):
    if len({r["file"] for r in refs}) != len(refs):
        raise ValueError("duplicate metadata evidence references")
    return hashlib.sha256(json.dumps(sorted(refs,key=lambda r:r["file"]),sort_keys=True,separators=(",",":")).encode()).hexdigest()


def required_evidence(root):
    names = set(CORE_EVIDENCE)
    proof = read(root / "cinema/proof.json")
    names.add("cinema/" + proof["hero"]["file"])
    for pairs in proof["samples"].values():
        for pair in pairs:
            names.update("cinema/" + x["file"] for x in pair.values())
    names.add("cinema/" + read(root / "cinema/hero-review.json")["response"]["file"])
    comparison = read(root / "openings/comparison.json")
    for option in comparison["options"]:
        for key in ("board", "film", "inspection"):
            names.add("openings/" + option[key]["file"])
    continuation = read(root / "openings/technical-continuation.json")
    names.add("openings/technical-continuation.json")
    names.update("openings/" + continuation[k]["file"] for k in
                 ("before_source", "failure", "code_review", "inspection_a", "inspection_b"))
    return names


def collect_evidence(root):
    names = required_evidence(root)
    names.update(p.relative_to(root).as_posix() for folder in
        ("sources", "takes", "alignment", "audio", "openings") for p in (root/folder).rglob("*") if p.is_file())
    for name in ("vo.wav", "voice.wav", "voice-stem.wav", "mix_voice.wav", "sfx_events.json", "vo_direction.json",
                 "acoustic-asr.json", "acoustic-asr-meta.json", "alignment_aliases.json", "alignment_reconciliation.json"):
        if (root/name).is_file():
            names.add(name)
    return [{"file":n,"sha256":digest(root/n)} for n in sorted(names)]


def read(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def correction_problems(before, after, county_map):
    """Exactly eight known Travis region corrections; no other JSON value changes."""
    try:
        if before.get("cinematic_template") != "carton-unload-v1" or after.get("cinematic_template") != "carton-unload-v1":
            raise ValueError("only the independently audited carton route is admitted")
        corrected = copy.deepcopy(before)
        scenes = corrected["scenes"]
        if [s["id"] for s in scenes] != [f"s{i}" for i in range(1, 9)]:
            raise ValueError("requires the complete eight-scene sequence")
        if county_map["counties"]["Travis"]["region"] != "blackland":
            raise ValueError("authoritative Travis map changed")
        for scene in scenes:
            if scene.get("county") != "Travis" or scene.get("region") != "hill_country":
                raise ValueError("baseline county or region is outside the diagnosed correction")
            scene["region"] = "blackland"
        if corrected != after:
            raise ValueError("changed inputs extend beyond the eight region fields")
        return []
    except (ValueError, KeyError, TypeError) as exc:
        return [str(exc)]


def local(root, ref):
    name = Path(ref["file"])
    if name.is_absolute() or ".." in name.parts:
        raise ValueError("metadata evidence must use portable local references")
    path = (root / name).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError("metadata evidence leaves the run")
    if str(name) == "film.mp4" and not path.exists():
        path = root / "dispatch.mp4"
    if digest(path) != ref["sha256"]:
        raise ValueError("metadata evidence changed: " + str(name))
    return path


def baseline(board_path):
    """Resolve only a fully authorized, independently audited, fresh evidence chain."""
    board_path = Path(board_path)
    sidecar = board_path.with_name(SIDECAR)
    if not sidecar.exists():
        return None
    root = board_path.parent
    value = read(sidecar)
    if value.get("schema") != SCHEMA or value.get("current_board_sha256") != digest(board_path):
        raise ValueError("metadata continuation does not bind this board")
    before_path = local(root, value["baseline"])
    before, after = read(before_path), read(board_path)
    cmap_path = local(root, value["county_map"])
    if digest(cmap_path) != digest(REPO / "config/county_regions.json"):
        raise ValueError("metadata continuation uses a stale authoritative map")
    errors = correction_problems(before, after, read(cmap_path))
    if errors:
        raise ValueError("; ".join(errors))
    diagnosis = read(local(root, value["diagnosis"]))
    audit = read(local(root, value["audit"]))
    expected = value["bindings"]
    from critic_gate import renderer_digest, concept_digest
    from daily_production import story_digest
    from render_manifest import engine_sha256, generated_media_sha256
    actual = {"before_board_sha256": digest(before_path), "after_board_sha256": digest(board_path),
              "before_concept_sha256": concept_digest(before), "after_concept_sha256": concept_digest(after),
              "before_story_sha256": story_digest(before), "after_story_sha256": story_digest(after),
              "renderer_sha256": renderer_digest(after), "engine_sha256": engine_sha256(),
              "generated_media_sha256": generated_media_sha256(board_path),
              "diagnosis_sha256": value["diagnosis"]["sha256"],
              "evidence_manifest_sha256": evidence_manifest(value["evidence"])}
    names = {r["file"] for r in value["evidence"]}
    if not required_evidence(root).issubset(names):
        raise ValueError("metadata continuation lost required phone/native/source/audio evidence")
    if expected != actual or renderer_digest(before) != actual["renderer_sha256"]:
        raise ValueError("metadata renderer, story or source bindings changed")
    assessment = diagnosis["render_dependency_assessment"]
    if (diagnosis.get("schema") != "dispatch-independent-technical-diagnosis/1"
            or diagnosis.get("failure_category") != "source" or diagnosis.get("verdict") != "revise"
            or assessment.get("rendered_inputs_change") is not False
            or assessment.get("board_sha256_before") != actual["before_board_sha256"]
            or assessment.get("renderer_sha256_before") != actual["renderer_sha256"]
            or assessment.get("engine_sha256") != actual["engine_sha256"]):
        raise ValueError("independent unused-field diagnosis is missing or stale")
    state = read(root / "run_state.json")
    from production_lifecycle import allowance_problems
    if allowance_problems(state):
        raise ValueError("metadata continuation has invalid allowance history")
    if state.get("active_repair"):
        raise ValueError("metadata repair must be authorized before reuse")
    event = state["events"][value["repair_event_index"]]
    if event != value["repair_event"] or event.get("kind") != "repair_authorized" or event.get("repair_scope") != "technical-integrity":
        raise ValueError("metadata authorization event changed or missing")
    plan = event["repair_plan"]
    rows = plan["changed_inputs"]
    if (plan.get("mechanism_id") != MECHANISM or len(rows) != 1
            or Path(rows[0]["path"]).name != "storyboard.json"
            or rows[0]["before_sha256"] != actual["before_board_sha256"]
            or rows[0]["after_sha256"] != actual["after_board_sha256"]
            or plan["failure_evidence_sha256"] != value["diagnosis"]["sha256"]):
        raise ValueError("metadata repair plan does not bind the exact correction")
    prior = state["events"][:value["repair_event_index"]]
    starts = [i for i,e in enumerate(prior) if e.get("kind") == "repair_started"
              and e.get("failure_sha256") == value["diagnosis"]["sha256"]]
    interval = prior[starts[0]+1:] if len(starts) == 1 else []
    charges = [e for e in interval if e.get("kind") == "reserved" and "reboards" in e.get("resources",{})]
    if (len(starts) != 1 or prior[starts[0]].get("mechanism_id") != MECHANISM
            or prior[starts[0]].get("repair_scope") != "technical-integrity"
            or any(e.get("kind") in {"repair_started","repair_authorized"} for e in interval)
            or len(charges) != 1 or charges[0].get("resources") != {"reboards":1}):
        raise ValueError("metadata repair lacks its charged corrective reboard")
    identity = diagnosis.get("reviewer_identity")
    if (not identity or identity == plan["director_identity"] or audit.get("reviewer_identity") != identity
            or not diagnosis.get("reviewed_at") or not audit.get("reviewed_at")
            or audit.get("verdict") != "pass" or audit.get("blocking_defects") != []
            or audit.get("bindings") != actual):
        raise ValueError("independent corrected-metadata audit is missing or stale")
    for ref in value["evidence"]:
        local(root, ref)
    films = {r["file"]:r["sha256"] for r in value["evidence"]}
    if (films.get("film.mp4") != assessment.get("film_sha256")
            or films.get("preflight.mp4") != assessment.get("preflight_sha256")):
        raise ValueError("metadata continuation lost the independently diagnosed films")
    return before_path


def prepare(board_path, audit_path):
    """Create a portable receipt only after root authorization and independent audit."""
    board_path = Path(board_path); root = board_path.parent
    folder = root / "repairs/geography12"
    state = read(root / "run_state.json")
    events = [(i,e) for i,e in enumerate(state["events"]) if e.get("kind") == "repair_authorized"
              and (e.get("repair_plan") or {}).get("mechanism_id") == MECHANISM]
    if len(events) != 1:
        raise ValueError("exact metadata authorization event required")
    index, event = events[0]
    def ref(path):
        path = Path(path)
        return {"file":path.relative_to(root).as_posix(),"sha256":digest(path)}
    shutil.copy2(REPO / "config/county_regions.json", folder / "county_regions.json")
    from critic_gate import renderer_digest, concept_digest
    from daily_production import story_digest
    from render_manifest import engine_sha256, generated_media_sha256
    before_path = folder / "before-storyboard.json"
    before, after = read(before_path), read(board_path)
    value = {"schema":SCHEMA,"current_board_sha256":digest(board_path),"baseline":ref(before_path),
             "county_map":ref(folder / "county_regions.json"),"diagnosis":ref(folder / "diagnosis.json"),
             "audit":ref(audit_path),"repair_event_index":index,"repair_event":event}
    value["bindings"] = {"before_board_sha256":digest(before_path),"after_board_sha256":digest(board_path),
        "before_concept_sha256":concept_digest(before),"after_concept_sha256":concept_digest(after),
        "before_story_sha256":story_digest(before),"after_story_sha256":story_digest(after),
        "renderer_sha256":renderer_digest(after),"engine_sha256":engine_sha256(),
        "generated_media_sha256":generated_media_sha256(board_path),"diagnosis_sha256":value["diagnosis"]["sha256"]}
    value["evidence"] = collect_evidence(root)
    value["bindings"]["evidence_manifest_sha256"] = evidence_manifest(value["evidence"])
    inspections = {key: ref(folder / (key + "-current-inspection.json")) for key in ("a","b")
                   if (folder / (key + "-current-inspection.json")).is_file()}
    if inspections:
        value["structural_inspections"] = inspections
    sidecar = root / SIDECAR
    sidecar.write_text(json.dumps(value,indent=2)+"\n")
    try:
        baseline(board_path)
    except Exception:
        sidecar.unlink()
        raise
    return sidecar


def structural_inspection(board_path, option_id):
    """Actual new read-only measurements; never replace an old report or its verdict."""
    board_path = Path(board_path); root = board_path.parent
    if baseline(board_path) is None:
        return None
    value = read(root / SIDECAR)
    ref = (value.get("structural_inspections") or {}).get(option_id)
    if ref is None:
        return None
    report = read(local(root,ref))
    from opening_compare import inspection_producer
    comparison = read(root / "openings/comparison.json")
    option = next(o for o in comparison["options"] if o["id"] == option_id)
    if (report.get("board_sha256") != option["board"]["sha256"]
            or report.get("film_sha256") != option["film"]["sha256"]
            or report.get("renderer_sha256") != option["renderer_sha256"]
            or report.get("inspector_sha256") != inspection_producer()
            or report.get("pass") is not True or report.get("problems") != [] or report.get("inspection_error")):
        raise ValueError("fresh retained-opening structural inspection is stale or failed")
    return report


def package(source, destination):
    """Copy the complete evidence closure before archive gates resolve any baseline."""
    source, destination = Path(source), Path(destination)
    if not (source / SIDECAR).exists():
        return
    baseline(source / "storyboard.json")
    value = read(source / SIDECAR)
    for ref in ([value[k] for k in ("baseline","county_map","diagnosis","audit")] + value["evidence"]
                + list(value.get("structural_inspections",{}).values())):
        path = local(source,ref)
        if ref["file"] == "film.mp4":
            if digest(destination / "dispatch.mp4") != ref["sha256"]:
                raise ValueError("archive film differs from retained native film")
            continue
        target = destination / ref["file"]
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,target)
    shutil.copy2(source / SIDECAR,destination / SIDECAR)
    baseline(destination / "storyboard.json")


if __name__ == "__main__":
    import argparse
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board",type=Path,required=True)
    p.add_argument("--prepare",type=Path)
    a=p.parse_args()
    print(prepare(a.board,a.prepare) if a.prepare else baseline(a.board))
