import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[3]
packet_path = root / 'out/dispatch/codex-picture-final-packet.json'
packet_bytes = packet_path.read_bytes()
packet = json.loads(packet_bytes)
packet_hash = hashlib.sha256(packet_bytes).hexdigest()
assert packet_hash == '0d36449696331df8cdc8226081dc4de4362edd5e231756e9946845392c60d15b'
board = json.loads(Path(packet['board']['path']).read_text())
coverage_path = Path(__file__).parent / 'codex-image-coverage.json'
assert hashlib.sha256(coverage_path.read_bytes()).hexdigest() == '6cb994c4642d3c71e5ffbd4ee96cec3897f0dc8c8039e1516b95efc8af9aca99'
coverage = json.loads(coverage_path.read_text())
bindings = []

def verify(value):
    if isinstance(value, dict):
        if isinstance(value.get('path'), str) and re.fullmatch('[0-9a-f]{64}', str(value.get('sha256', ''))):
            p = Path(value['path'])
            p = p if p.is_absolute() else root / p
            actual = hashlib.sha256(p.read_bytes()).hexdigest()
            assert actual == value['sha256'], str(p)
            bindings.append({'path': str(p), 'sha256': actual})
        for child in value.values():
            verify(child)
    elif isinstance(value, list):
        for child in value:
            verify(child)

verify(packet)
film_hash = packet['film']['sha256']
observations = [
    'The sandy equipment yard and dock are already visible; the dock lid opens to expose the white drone. No title card substitutes for the subject.',
    'The white drone lifts from the same dock and travels over the equipment; the Texas locator then connects the Permian Basin and Austin. The illustration does not identify the tested hardware as Air Max.',
    'The desk monitor and software interface light up, establishing the software subject. No anomaly flag is visible in this clause; that result is performed during the following conditional fragment of the same sentence.',
    'A blue anomaly flag appears at about 9.6 to 10.2 seconds; the companies-say tag enters from about 10.8 and settles near 11.8. This software claim remains distinct from the later infrared emission image.',
    'The approval letter slides into view and its lines fill. The date is spoken and captioned here; the physical date stamp follows in the next fragment. The document establishes the subject of the continuous approval sentence.',
    'The date stamp descends onto the letter at about 15.6 to 16.4 seconds and leaves the September date visible by 16.8. The letter stays recognizable through the contact.',
    'The same approval letter remains on the desk as a second stamp approaches and contacts it. This document illustration represents the approval process; it does not assert the Chevron pilot used Air Max hardware.',
    'The stamp lifts near 20.2 seconds, revealing Approved beside Periodic methane screening. The visible result scopes the authorization to the screening method.',
    'The drone returns above the equipment with its underslung camera visible; the close view near 23.8 seconds makes that camera especially clear.',
    'The drone advances along the marked route toward the equipment; a ring marks the point of interest, followed by the infrared inset showing a valve and gold emission plume.',
    'The seated inspector receives the same valve and plume footage on the monitor, leans toward it and raises the stylus. The recognizable footage preserves the causal handoff from collection to human review.',
    'The inspector draws a circle around the plume and a green check appears by about 31.2 seconds. The human hand and stylus perform the identification.',
    'A valve inset and follow-up tag appear, with the tag moving toward the valve before settling. This depicts a triggered follow-up task, without claiming that an on-site follow-up has already been completed.',
    'The protocol document scrolls on its stand, the AI letters receive a yellow highlight around 36 seconds, and the tag scopes the occurrence to the title. The image remains a document limitation rather than an invented AI performance result.',
    'The film cuts away from the drone and inspector to a separate-program card and calendar. A leak-reporting tag drops into the new setting, and the future calendar date is visible by about 40.8 seconds.',
    'The January calendar stays visible; an orange Delayed strip enters near 42.8 and settles around 43.4. The retained calendar makes the spoken future date readable without a new unrelated subject.',
    'The wider calendar yields to the October EPA release card; a proposal tag attaches with a clip. The dashed empty stamp box stays unfilled, supporting a prospective proposal rather than a completed rescission.',
    'The inspector and familiar infrared footage return; the stylus confirmation produces a green check pulse near 48.8. The confirmed human result remains while an empty AI box starts to develop.',
    'The empty AI box remains beside the confirmed footage, and the view widens at about 52.4 seconds while the dock closes outside. The composition retains both the known human confirmation and the unspecified AI contribution.'
]
clauses = []
for original, observed in zip(board['narration_picture']['clauses'], observations, strict=True):
    item = {k: original[k] for k in ('id', 'text', 'subject_ids', 'action_id', 'claim_ids', 'scene_id', 'cue_ids', 'event_ids', 'start_s', 'end_s')}
    item.update({'pass': True, 'observed': observed})
    clauses.append(item)

def modern(start, end, observed):
    return {'pass': True, 'start_s': start, 'end_s': end, 'observed': observed}

report = {
    'schema': 'dispatch_independent_picture_review/1',
    'role': 'picture',
    'date': packet['date'],
    'reviewer_identity': '/root/picture_score_21; gpt-6.1-sol; reasoning_effort=medium; session=01a161da-066f-7ff0-a209-d49e079f08c2; packet_sha256=' + packet_hash,
    'packet_sha256': packet_hash,
    'story_sha256': packet['story_sha256'],
    'board_sha256': packet['board']['sha256'],
    'claims_sha256': packet['claims']['sha256'],
    'film_sha256': film_hash,
    'quality_contract_sha256': 'f54137adf7cf5181ff077cb8b9fd85a44131cee44b1fb8139def2f12a088fdfa',
    'audiovisual_role': 'picture',
    'audiovisual_receipt_sha256': packet['av_receipt']['sha256'],
    'audiovisual_response_sha256': '2c78590240d7186f93bd441474c307503d6e80c18007a96889c8c7787b53f88a',
    'score': 7.27,
    'ship': True,
    'verdict': 'pass',
    'axes': {'hook': 6.8, 'story': 7.6, 'picture': 7.3, 'place': 7.2, 'craft': 7.4, 'voice': 7.3},
    'axis_reasons': {
        'hook': 'The dock opens and reveals its drone in the first two seconds. The low camera gives the object a clear silhouette, although the restrained opening lacks a strong surprise.',
        'story': 'The pilot claim, dated method approval, certified human inspection, limited AI reference and separate reporting-program proposal are distinguished. The final empty box answers the opening technology promise with an honest source limit.',
        'picture': 'Drone departure, software alert, two document contacts, route, inspector annotation and proposal attachment are recognizable performed developments. The late wide tableau is the least forceful composition.',
        'place': 'Dry light, sandy ground and oilfield separators, valves and tank support the Permian setting. The locator explicitly separates the operating region from the Austin company location; it is an illustrative yard rather than documentary site footage.',
        'craft': 'The camera changes support departure, document contact, camera inspection and stylus contact. Shading, lens, vents, dock scuffs and inspector details give the authored objects a finished surface. The inspector partly covers a minor monitor label without hiding the plume or hand action.',
        'voice': 'My voice judgment uses the assigned audible-media provider receipt, which reports clear balanced narration and motivated sound, plus unchanged-speed mix and acoustic alignment records. I did not directly listen. Captions visibly follow the measured sentence cues.'
    },
    'hard_fails': [],
    'defects': [],
    'weakest_axis': 'hook',
    'one_sentence_fix': 'Keep the final monitor at the preceding medium scale while retaining the dock closure within its window.',
    'attention_review': {
        'film_sha256': film_hash,
        'pass': True,
        'hook_observed': 'From 0 to 1.8 seconds the silver dock lid opens and exposes the white drone; by 2 to 3.8 seconds it lifts away over the equipment. This is an object action from the first frame.',
        'continuity_observed': 'At 25.8 to 26.2 seconds the camera produces a valve-and-plume infrared inset. At 27 seconds the same footage is on the seated inspector monitor; the stylus circles that plume at 30.2 to 30.8 seconds. The separate reporting calendar at 38.4 seconds explicitly changes subject.',
        'pacing_observed': 'The software lights at 7.2 to 7.8 seconds before the alert at 9.6 to 10.2 and attribution at 10.8 to 11.8. Document contacts at 15.6 to 16.4 and 18.8 to 20.2 provide readable setup and result. The inspector confirmation at 30.2 to 31.2 leads to the follow-up tag at 32.4 to 33. The last caption ends at 53.62; the approximately 2.7-second final tableau gives time to compare the check and empty AI box before credits at about 56.4. It is the weakest hold, but it retains the final contrast and creates no comprehension failure. No rushed transition obscures a principal action in the sampled sequence.',
        'comprehension_observed': 'The opening asks what the autonomous drone delivers. The middle separates a company software-alert claim from a specific screening approval, then shows the certified inspector making the emission call. The protocol-title highlight limits the AI inference. The separate delayed program and prospective rescission are distinct from approval. The final confirmed footage and empty AI box answer what is known and what the letter leaves unspecified. Simplified art does not imply documentary footage or prove AI performance.',
        'remembered_image': 'The inspector circles the gold plume and leaves a green check beside an empty AI box. The hand action identifies the supported decision-maker, while the blank box preserves the source limit.',
        'weakest_interval': '53.62 to 56.32 seconds: the final wide tableau makes the monitor smaller after the dock has shut. The retained contrast remains readable, but a medium view with the dock still visible in its window would make the ending more forceful. This is an optional composition preference, not a rejected attention criterion.',
        'weakest_at_s': 53.62,
        'weakest_end_s': 56.32,
        'audio_basis': 'No direct listening or normal-speed playback. Own hash-bound picture audiovisual receipt and raw response report audio_access=true and clear balanced narration, motor hum, stamp contact, chime and paper sound. Mix records report time_stretch=1.0, integrated loudness -16.08 LUFS and true peak -1.99 dBTP. Acoustic alignment matched 128 words; 46 interior word positions were anchored and 82 modeled, while caption cue boundaries are measured. These measurements do not independently establish vocal naturalness or precise sound synchronization.'
    },
    'modern_observations': {
        'film_sha256': film_hash,
        'first_frame': modern(0, 1.8, 'A silver dock sits among recognizable oilfield equipment in dry sandy light. Its lid opens and reveals the drone, giving the first image a story-specific subject and change.'),
        'visual_progression': modern(2, 47.52, 'The drone departs; software produces an alert; the letter receives dated and approval marks; the drone camera collects the valve image; the inspector annotates it; the protocol title is highlighted; a separate calendar is delayed and a proposal is attached to the release. These results add information across the cuts.'),
        'shot_variety': modern(0, 53.62, 'The film uses a low yard view, rising departure, monitor view, overhead document contacts, camera close-up, infrared inset, inspector medium and stylus close-up, then calendar and release-card views. Changes expose relevant evidence or contact.'),
        'performed_turn': modern(27.08, 33.82, 'The inspector leans toward the returned infrared footage, circles its plume with a stylus, produces a green confirmation and triggers a follow-up tag. The human action turns collection into identification.'),
        'pace': modern(0, 56.32, 'Readable developments recur through departure, alert, document contacts, infrared handoff, human annotation and proposal. The brief final comparison hold follows the completed dock closure. Its wider framing is weaker but leaves the closing result readable.'),
        'closing_answer': modern(48.04, 56.32, 'The inspector check returns, an empty AI box develops, and the dock shuts outside. Human confirmation is supported while the AI contribution stays unspecified. The final contrast resolves the opening drone promise without inventing an answer.'),
        'finished_art': modern(0, 56.32, 'The native crop details show a shaded drone shell, lens and vents, dock wear, layered equipment, articulated inspector hands, stylus and clothing detail. Contact and light hierarchy distinguish objects. The principal plume, annotation and check remain visible at phone scale; simplified modeling is coherent rather than unfinished.')
    },
    'narration_picture_observations': {'film_sha256': film_hash, 'clauses': clauses},
    'bounded_release': {
        'schema': 'dispatch_creative_assessment/1',
        'scope': 'panel',
        'retained_checks': {
            'source': {'pass': True, 'observed': 'Read all five bound source snapshots and all nineteen claims. The September approval is periodic screening with certified human review; company AI-anomaly claims are attributed. The separate program date and October prospective proposal retain their qualifiers. No claim equates the Chevron tested hardware with Air Max.'},
            'rights': {'pass': True, 'observed': 'The inspected film uses original authored illustrative equipment, documents and inspector rather than copied footage or brand marks. The visible credits identify illustration and sources; no unsupported asset-rights claim is needed for the visible authored surfaces.'},
            'legibility': {'pass': True, 'observed': 'The complete chronological sequence, feed composite and four native crops retain the drone silhouette, document contacts, infrared plume, stylus circle, confirmation and empty AI box. Minor monitor label occlusion does not hide the principal action.'},
            'comprehension': {'pass': True, 'observed': 'Recognizable valve footage passes from drone camera to inspector. Software assertion, regulatory method approval and separate reporting proposal remain distinct. The human check beside the empty AI box supplies the closing source limit.'},
            'technical_audio': {'pass': True, 'observed': 'Own exact-film audiovisual receipt reports audible access and clear balanced narration without an audio defect. Mix records use unchanged speech speed and show -16.08 LUFS and -1.99 dBTP. This is provider and measurement evidence, not personal listening.'},
            'captions': {'pass': True, 'observed': 'Read the full caption cues and measured narration bindings, with 128 acoustic words matched. Cue boundaries are measured; intermediate modeled word positions are disclosed. Visible cues follow the corresponding sentence fragments without a caption collision hiding the principal picture.'}
        },
        'defects': [],
        'score_only': True
    },
    'image_coverage': coverage,
    'coverage_artifact': {'path': str(coverage_path), 'sha256': '6cb994c4642d3c71e5ffbd4ee96cec3897f0dc8c8039e1516b95efc8af9aca99'},
    'input_bindings': bindings,
    'source_snapshots': [
        {'path': 'percept_letter.txt', 'sha256': 'aa19ae67bc5286d68c90fd5e7f62ac9369a63804078fa6cf0d71c865e82407f9'},
        {'path': 'dronelife.txt', 'sha256': '8aa46537d1e11dbe1f53cb9c8226a26c59ae9b6ed4c94cf3154dbd32d16c2092'},
        {'path': 'super.txt', 'sha256': 'af873f19a33d8e25c5b335b3ba8d78a1f3cdd2169edf59c270e69e622d92c3e0'},
        {'path': 'zeldin.txt', 'sha256': 'c2cd4e0aa77ad249148b65cf8c8942346e2b632b0ad13b8fcf4f3a202123c7fc'},
        {'path': 'percepto_matm.txt', 'sha256': '042b4ce0b9fb3cfd61ecebe228c8e59290e86798ddb10134334b8f402aeaa740'}
    ],
    'provider_crosscheck': {
        'observed': 'Read my own picture receipt and raw provider response only. Its overall finding of visible human review and limited AI claim agrees with my image reconstruction.',
        'timing_corrections': [
            'Provider places the companies-say tag at 10.2 seconds; my sequence shows its entry around 10.8 and settling near 11.8.',
            'Provider describes a calendar flip at 42.6 seconds; the date is already revealed near 40.8 and the delayed strip enters around 42.8.',
            'Provider describes a pullback at 54 to 56 seconds; the wide cut occurs near 52.4, followed by a retained tableau.',
            'Exact provider sound synchronization timestamps are not independently established by image-only access.'
        ]
    },
    'access_and_limitations': {
        'visual_basis': 'Personally inspected all 62 chronological pages in order, comprising 308 five-per-second film-decoded samples across the encoded film, credits and final frame. Each original public image event and immediate observation is retained in my verified coverage.',
        'supplemental_public_records': 'After the first complete export, personally inspected s1-1-normal, s5-1-normal, s9-2-normal, attention-review, feed-composite and s4-1-normal using the same public protocol. Their original records remain in my own session rollout separately from the immutable 62-page coverage. A repaired exporter may bind them later without repeating images or changing this judgment.',
        'motion_limit': 'No direct playback, normal-speed viewing or direct listening. Five-per-second samples establish visible states and sampled progression, not every intervening frame of the thirty-frame-per-second encode. Own audiovisual provider receipt supplies separate moving-picture and sound observation.',
        'text_review': 'Read all bound current guides, current board scene and story-contract fields including transitions and closing, all nineteen measured clauses, all claims, all five source snapshots, captions, mix, attention material and own raw audiovisual response. Historical serialized board_json and critique_json embedded in approved_retime provenance were not read in full and were not used as current approval evidence.',
        'native_crop_limit': 'Four available normal native crops inspected for surface, contact and closing details; no separate native-crop inventory was bound in this compact packet.',
        'independence': 'No other scorer inspected or grade supplied. No Claude call, recursive agent, paid round, rerender or production edit performed for this assessment.'
    }
}
weights = {'hook': .18, 'story': .20, 'picture': .20, 'place': .14, 'craft': .14, 'voice': .14}
assert abs(sum(report['axes'][k] * v for k, v in weights.items()) - report['score']) < 1e-9
assert len(clauses) == 19
assert all(x['end_s'] <= board['runtime_s'] for k, x in report['modern_observations'].items() if isinstance(x, dict))
text = json.dumps(report, indent=2, ensure_ascii=False) + '\n'
assert not re.search(r'\b(?:matter|matters|mattered|mattering)\b', text, re.I)
output = Path(__file__).parent / 'report.json'
assert not output.exists(), 'Preserve the first original report'
output.write_text(text)
print(json.dumps({'report': str(output), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'score': report['score'], 'ship': report['ship'], 'clauses': len(clauses), 'bound_inputs_verified': len(bindings)}))
