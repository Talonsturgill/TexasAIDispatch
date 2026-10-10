"""Director's planned boards for 2026-10-09-claude-pilot. The scene-builder completes and proves them."""
import json, copy
ED = "2026-10-09-claude-pilot"; DATE = "2026-10-09"
NS = f"video-engine/src/modern/episodes/{ED}/"
SUBJ = "A clinician's question, the patient chart it enters and the citation cards that return"
LIMIT = ("Disclosed explanatory illustration of what UTMB's release describes. It is not UTMB's screen, a vendor interface, "
         "any answer's content, a clinician or a patient. UTMB's own report. The release publishes no accuracy or patient-care measure.")

scenes_spec = [
 # id, dur, vo, claims, role, what
 ("s1", 4.5, "A UTMB clinician types a question. The answer comes back with its sources.", ["c1", "c4"], "hook",
  ["A typed question card leaves the open chart.", "The question crosses the chart edge and returns.", "A stack of citation cards lands beside the chart."]),
 ("s2", 5.0, "UTMB announced it on September twenty-second, and says it went live in March.", ["c1", "c2"], "action",
  ["The chart edge glows where the tool enters the record.", "A September 22nd announcement tag attaches to the chart.", "A March live tag settles on the same chart."]),
 ("s3", 5.5, "Clinicians sign in with their usual credentials and ask in plain language.", ["c3", "c4"], "mechanism",
  ["A credential badge touches the reader and the chart unlocks.", "The question card is typed in plain words.", "The card slides to the chart edge."]),
 ("s4", 5.5, "The answers carry citations to medical literature and clinical guidelines.", ["c4"], "mechanism",
  ["Citation cards fan out from the returning answer.", "One card labelled medical literature lifts.", "One card labelled clinical guidelines lifts."]),
 ("s5", 5.5, "UTMB says more than half of its clinicians now use it for clinical decision support.", ["c5"], "consequence",
  ["A grid of clinic workstations appears with the chart.", "More than half of the workstations light.", "The lit share holds beside a decision-support tag."]),
 ("s6", 6.0, "That is UTMB's own report. The release publishes no measure of accuracy or patient care.", ["c5", "c8"], "limit",
  ["An UTMB's own report tag labels the lit share.", "Two empty tags appear, accuracy and patient care.", "Both tags stay open and read not published."]),
 ("s7", 6.5, "A citation shows where an answer says it came from. It doesn't show the answer is right.", ["c4", "c8"], "limit",
  ["A citation card points back to its source type.", "The answer card beside it stays unmarked.", "No check mark lands on the answer."]),
 ("s8", 3.5, "UTMB says it will keep evaluating.", ["c8"], "answer",
  ["The question returns to the chart edge with its sources.", "The evaluation tag stays open on the chart.", "The chart holds with its sources and the open tags."]),
]
VIEWS = {  # per scene: (A order), (B order)
 "s1": (["flow-wide", "desk-close"], ["desk-close", "flow-wide"]),
 "s2": (["chart-boundary", "chart-boundary"], ["chart-boundary", "chart-boundary"]),
 "s3": (["credential-gate", "desk-close"], ["desk-close", "credential-gate"]),
 "s4": (["citation-stack", "source-types"], ["citation-stack", "source-types"]),
 "s5": (["share-grid", "share-grid"], ["share-grid", "share-grid"]),
 "s6": (["unmeasured-card", "unmeasured-card"], ["unmeasured-card", "unmeasured-card"]),
 "s7": (["source-types", "answer-close"], ["answer-close", "source-types"]),
 "s8": (["answer-close", "flow-wide"], ["flow-wide", "answer-close"]),
}
FRAMING = {"flow-wide": "wide", "desk-close": "close", "credential-gate": "medium", "chart-boundary": "medium", "citation-stack": "close",
           "source-types": "medium", "share-grid": "wide", "unmeasured-card": "close", "answer-close": "medium"}

def scenes():
    out, t = [], 0.0
    for sid, dur, vo, claims, role, whats in scenes_spec:
        events = [{"id": f"{sid}-event-{i+1}", "at_s_authored": round(0.3 + i * (dur - 0.9) / 3, 3), "duration_s_authored": 1.0,
                   "item_ids": [f"{sid}-chart", f"{sid}-card"], "what": w, "motion": {"curve": "travel", "anticipation": 0, "settle": 0.03},
                   "narration_id": "n" + sid[1:]} for i, w in enumerate(whats)]
        out.append({"id": sid, "start_s": round(t, 3), "duration_s": dur, "duration_authored": dur, "county": "Galveston", "region": "gulf",
                    "interior": False, "cast": [], "beat": "clinic-and-bench", "story_role": role, "vo": vo, "vo_claims": claims,
                    "super": "", "caption": "", "on_screen": " ".join(whats), "what_moves": " ".join(whats),
                    "production_disclosure": "Illustration. Not UTMB's screen", "visual_events": events})
        t += dur
    return out, round(t, 3)

def shots(variant):
    idx = 0 if variant == "a" else 1
    result = []
    for sid, dur, *_ in scenes_spec:
        views = VIEWS[sid][idx]
        cut = round(dur / 2, 3) if len(set(views)) > 1 or True else dur
        start = 0.0
        for k, view in enumerate(views):
            d = round(dur / 2, 3) if k == 0 else round(dur - dur / 2, 3)
            result.append({"id": f"{sid}-shot-{k+1}", "scene_id": sid, "start_s": start, "duration_s": d, "framing": FRAMING[view],
                           "transition": "cut", "view": view, "event_id": f"{sid}-event-{1 if k == 0 else 3}",
                           "purpose": f"{view} performs the scene's sourced change", "carry": SUBJ, "narration_ids": ["n" + sid[1:]],
                           "scene_fraction_start": round(start / dur, 4), "scene_fraction_end": round((start + d) / dur, 4)})
            start += d
    return result

USES_HERO = [("s1", "flow-wide", "send-question", ["question-card", "chart"], "s1-event-1"),
             ("s4", "citation-stack", "return-citations", ["citation-cards"], "s4-event-1"),
             ("s6", "unmeasured-card", "show-limit", ["unmeasured-tags"], "s6-event-2")]
USES_SUPPORT = [("s2", "chart-boundary", "enter-record", ["record-boundary"], "s2-event-1"),
                ("s3", "credential-gate", "sign-in", ["badge-reader", "workstation"], "s3-event-1"),
                ("s5", "share-grid", "show-usage", ["clinic-workstations"], "s5-event-2")]
def uses(rows): return [{"scene_id": s, "event_id": e, "view": v, "action_id": a, "subject_ids": ids} for s, v, a, ids, e in rows]

story_art = {"version": "authored-story-art-v1", "runtime": "claude-sonnet-v1", "edition_id": ED, "requests": [
 {"id": "chart-and-citations", "role": "hero", "file": NS + "ChartHero.tsx", "export": "ChartHero",
  "scene_ids": ["s1", "s4", "s6", "s7", "s8"],
  "purpose": "Carry one patient chart through the film as the physical object a clinician's question enters and the cited answer returns to, so the opening question and the closing answer are the same picture.",
  "prompt": "Author an original finished React and SVG object in the current Remotion engine. A tall clinical chart board in worn warm paper and teal card stock with a metal clip, a ruled record page, a tabbed edge and a soft Gulf Coast window light from the upper left with cool fill. A typed question card with a plain sans line slides out of its slot and crosses the chart's edge, then returns with a fanned stack of three citation cards whose tabs read medical literature, clinical guidelines and other sources. Include a final pair of open tags reading accuracy and patient care not published that stay unmarked. Grounded contact shadows, lopsided hand-made tab edges, slight wear and rounded corners, no symmetric clip-art. Everything is a disclosed illustration with no real interface, logo, face, patient detail or answer content.",
  "source_limit": "Disclosed illustration of the relationship UTMB describes. It does not show UTMB's screen, a vendor interface, any answer's content, a clinician or a patient, and it measures nothing.",
  "action_uses": uses(USES_HERO)},
 {"id": "clinic-support", "role": "support", "file": NS + "ClinicSupport.tsx", "export": "ClinicSupport",
  "scene_ids": ["s2", "s3", "s5", "s8"],
  "purpose": "Give the chart a believable Southeast Texas clinic around it, a credential reader, a workstation and a wall of clinic workstations whose lit share shows more than half in use as UTMB's own report.",
  "prompt": "Author an original finished React and SVG environment group in the current Remotion engine. A clinic desk edge with a badge reader that blinks teal when touched, a plain workstation monitor frame seen from the side with a blank lit screen, and a back wall of rounded workstation tiles in a loose uneven grid that can light individually. Gulf Coast daylight through a window with a cool fill, sea-salt weathering at the edges, grounded shadows on a worn laminate desk, nothing symmetric. Include a restrained maintained but worn finish. No real screens, logos, faces, patient information or vendor interface.",
  "source_limit": "Disclosed illustration. The lit workstations show UTMB's own more-than-half report as a share and are not a count, a measurement or a map of UTMB's campuses.",
  "action_uses": uses(USES_SUPPORT)}], "entries": []}

def board(variant):
    sc, runtime = scenes()
    angle = ("The question and its sources travel left to right across one chart, so the viewer watches the sources arrive." if variant == "a"
             else "The camera stays close on the desk and the chart, so the viewer sees who asks and what is missing from the answer.")
    return {
        "date": DATE, "edition_id": ED, "run_id": ED, "title": "The answer arrives with its sources",
        "topic": "UTMB puts OpenEvidence's cited AI answers inside its health record", "beat": "clinic-and-bench",
        "entities": ["UTMB", "OpenEvidence"], "runtime_s": runtime, "credits_s": 5,
        "credits": "TEXAS AI DOCKET\nSOURCES\nUTMB news release\nSeptember 22nd\nILLUSTRATION\nOriginal authored clinic diagrams\n",
        "derived_from": "scratch", "cinematic_template": "directed-film-v2", "daily_production": True,
        "fauna_scope": {"status": "none", "reason": "This clinic software story names no animal action, habitat or wildlife claim."},
        "scenes": sc,
        "story_art": copy.deepcopy(story_art),
        "film_direction": {"version": "directed-film-v2", "episode": "clinic-answer-v1", "variant": variant, "angle": angle,
                           "opening_promise": "Watch one question enter a patient chart and see exactly what comes back with it.",
                           "performed_turn": "The returned answer carries its source cards, and the two tags that would show whether it is right stay open.",
                           "closing_answer": "A question goes in and sources come back. Whether the answers are right, UTMB hasn't published, and it says it will keep evaluating.",
                           "shots": shots(variant)},
        "story_contract": {
            "opening_question": "What comes back when a UTMB clinician asks a medical question inside the record?",
            "actor": "UTMB and OpenEvidence", "action": "Put cited AI answers inside UTMB's electronic health record.",
            "change": "Clinicians sign in with their usual credentials and get answers with citations.",
            "affected_people": "UTMB clinicians, and the patients whose records the tool sits inside.",
            "consequence": "UTMB says more than half of its clinicians use it for clinical decision support.",
            "source_limit": LIMIT,
            "closing_answer": "Sources come back with the answer, and UTMB hasn't published whether the answers are right.",
            "director_identity": "claude-sonnet-5-5 director, this session"},
        "creative_direction": {"viewer_question": "What comes back when a UTMB clinician asks a medical question inside the record?",
                               "visible_answer": "The answer returns with source cards, and the accuracy and patient-care tags stay open.",
                               "emotional_turn": "The sources look like proof, then the open tags show the release never measured whether the answers are right.",
                               "medium_choice": "Explanatory animation, mechanism-led. No footage, licensed image or authenticated view of the tool exists, so original authored diagrams perform the described sequence."},
    }

if __name__ == "__main__":
    for v in ("a", "b"):
        json.dump(board(v), open(f"out/dispatch/opening-{v}.json", "w"), indent=2)
    json.dump(board("a"), open("out/dispatch/storyboard.json", "w"), indent=2)
    open("out/dispatch/vo_script.txt", "w").write("\n".join(s[2] for s in scenes_spec) + "\n")
    print("planned boards written", board("a")["runtime_s"])
