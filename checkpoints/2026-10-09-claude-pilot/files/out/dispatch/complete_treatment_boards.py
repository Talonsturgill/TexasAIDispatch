"""Scene-builder completion of the director's two planned boards for 2026-10-09-claude-pilot.

Reads the director's planned opening-a.json and opening-b.json, keeps every director-owned
field byte-for-byte (narration, claims, scene order and ids, event ids and their wording,
story_art requests, the story_contract wording, film_direction prose), and fills the
fields the gates require with the implemented clinic-answer-v1 renderer choices.
Writes both boards and keeps storyboard.json equal to opening-a.json.
Timing is an authored provisional cue plan for the silent comparison only.
"""
import copy, hashlib, json, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'out/dispatch'
sys.path.insert(0, str(REPO / 'scripts'))
import modern_film  # noqa: E402

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
NS = 'video-engine/src/modern/episodes/2026-10-09-claude-pilot/'
ED = '2026-10-09-claude-pilot'
LIMIT_SHORT = ("Disclosed illustration of what UTMB's release describes. Not UTMB's screen, a vendor interface, "
               "an answer's content, a clinician or a patient. UTMB's own report, with no published accuracy or patient-care measure.")

# ---------------------------------------------------------------- clauses
# id, scene, text, cue texts, action, subjects, claims, event ids, (start, end) authored estimate
CLAUSES = [
 ('n1a','s1','A UTMB clinician types a question.',None,'send-question',['question-card','chart'],['c1','c4'],['s1-event-1'],(0.25,2.05)),
 ('n1b','s1','The answer comes back with its sources.',None,'return-answer',['question-card','chart','citation-cards','answer-card'],['c4'],['s1-event-2','s1-event-3'],(2.25,4.3)),
 ('n2a','s2','UTMB announced it on September twenty-second,',None,'enter-record',['record-boundary','chart','date-tags'],['c1'],['s2-event-1','s2-event-2'],(4.75,6.95)),
 ('n2b','s2','and says it went live in March.',None,'mark-live',['chart','date-tags'],['c2'],['s2-event-3'],(7.1,9.25)),
 ('n3a','s3','Clinicians sign in with their usual credentials',None,'sign-in',['badge-reader','workstation','chart'],['c3'],['s3-event-1'],(9.75,12.4)),
 ('n3b','s3','and ask in plain language.',None,'type-question',['question-card','workstation','chart'],['c4'],['s3-event-2','s3-event-3'],(12.6,14.8)),
 ('n4a','s4','The answers carry citations',None,'return-citations',['citation-cards','answer-card'],['c4'],['s4-event-1'],(15.25,16.9)),
 ('n4b','s4','to medical literature and clinical guidelines.',None,'name-source-types',['citation-cards','source-types'],['c4'],['s4-event-2','s4-event-3'],(17.05,20.3)),
 ('n5','s5','UTMB says more than half of its clinicians now use it for clinical decision support.',
  [('UTMB says more than half of its clinicians',(20.75,23.25)),('now use it for clinical decision support.',(23.4,25.8))],
  'show-usage',['clinic-workstations','chart'],['c5'],['s5-event-1','s5-event-2','s5-event-3'],(20.75,25.8)),
 ('n6a','s6',"That is UTMB's own report.",None,'attribute-report',['report-tag','clinic-workstations'],['c5'],['s6-event-1'],(26.25,27.9)),
 ('n6b','s6','The release publishes no measure of accuracy or patient care.',None,'show-limit',['unmeasured-tags'],['c8'],['s6-event-2','s6-event-3'],(28.1,31.8)),
 ('n7a','s7','A citation shows where an answer says it came from.',None,'trace-citation',['citation-cards','answer-card','source-types'],['c4'],['s7-event-1'],(32.25,35.3)),
 ('n7b','s7',"It doesn't show the answer is right.",None,'withhold-verdict',['answer-card','citation-cards'],['c8'],['s7-event-2','s7-event-3'],(35.5,38.25)),
 ('n8','s8','UTMB says it will keep evaluating.',None,'keep-evaluating',['chart','citation-cards','unmeasured-tags','evaluation-tag'],['c8'],['s8-event-1','s8-event-2','s8-event-3'],(38.7,41.0)),
]
# event id -> (clause fraction start, end, motion curve, reward kind)
EVENTS = {
 's1-event-1':(.2,.65,'travel','action'), 's1-event-2':(.05,.45,'travel','action'), 's1-event-3':(.55,.95,'contact','consequence'),
 's2-event-1':(.05,.4,'smoothstep','reveal'), 's2-event-2':(.55,.95,'contact','evidence'), 's2-event-3':(.25,.75,'contact','evidence'),
 's3-event-1':(.25,.65,'contact','action'), 's3-event-2':(.05,.5,'linear','action'), 's3-event-3':(.6,.95,'travel','consequence'),
 's4-event-1':(.15,.75,'travel','reveal'), 's4-event-2':(.1,.4,'travel','evidence'), 's4-event-3':(.55,.85,'travel','evidence'),
 's5-event-1':(.05,.25,'smoothstep','reveal'), 's5-event-2':(.35,.55,'smoothstep','comparison'), 's5-event-3':(.7,.9,'contact','consequence'),
 's6-event-1':(.2,.8,'contact','evidence'), 's6-event-2':(.1,.35,'contact','reveal'), 's6-event-3':(.5,.75,'smoothstep','consequence'),
 's7-event-1':(.2,.5,'travel','evidence'), 's7-event-2':(.1,.45,'travel','comparison'), 's7-event-3':(.55,.9,'smoothstep','reaction'),
 's8-event-1':(.05,.4,'travel','action'), 's8-event-2':(.45,.75,'contact','consequence'), 's8-event-3':(.8,1.0,'smoothstep','consequence'),
}
CHANGE_TYPE = {'action':'mechanism','consequence':'consequence','reveal':'reveal','evidence':'evidence','comparison':'comparison','reaction':'resolution'}

# ---------------------------------------------------------------- shots per treatment
# (clause, view, framing) in order. A clause with two rows splits its window evenly.
SHOTS = {
 'a': [('n1a','flow-wide','wide'),('n1b','desk-close','close'),
       ('n2a','chart-boundary','medium'),('n2b','chart-boundary','close'),
       ('n3a','credential-gate','medium'),('n3b','desk-close','close'),
       ('n4a','citation-stack','close'),('n4b','source-types','medium'),
       ('n5','share-grid','wide'),('n5','share-grid','medium'),
       ('n6a','unmeasured-card','medium'),('n6b','unmeasured-card','close'),
       ('n7a','source-types','medium'),('n7b','answer-close','close'),
       ('n8','answer-close','medium'),('n8','flow-wide','wide')],
 'b': [('n1a','desk-close','close'),('n1b','flow-wide','wide'),
       ('n2a','chart-boundary','close'),('n2b','chart-boundary','detail'),
       ('n3a','credential-gate','close'),('n3b','desk-close','detail'),
       ('n4a','citation-stack','detail'),('n4b','source-types','close'),
       ('n5','share-grid','medium'),('n5','share-grid','wide'),
       ('n6a','unmeasured-card','close'),('n6b','unmeasured-card','detail'),
       ('n7a','answer-close','close'),('n7b','source-types','medium'),
       ('n8','flow-wide','wide'),('n8','answer-close','close')],
}
PURPOSE = {
 ('a','n1a'):'Wide: the half-typed question card leaves the chart through its tabbed edge and travels left to right off the chart.',
 ('a','n1b'):'Close on the chart edge and shelf: the answer returns with the question and three citation cards land beside the chart.',
 ('a','n2a'):'Medium: the teal health-record boundary lights, an evidence tab docks in its slot and the September 22nd tag drops onto the rail.',
 ('a','n2b'):'Close on the rail tags: the March live tag settles under the announcement tag on the same chart.',
 ('a','n3a'):'Medium on desk and chart: the blank badge touches the reader, the reader lights and the chart clip unlocks.',
 ('a','n3b'):'Close on the chart page: the question card types out in word shapes, gains its plain-language pill and slides to the chart edge.',
 ('a','n4a'):'Close on the returned answer: three citation cards fan out from behind it.',
 ('a','n4b'):'Medium: the medical literature card lifts toward camera, then the clinical guidelines card lifts.',
 ('a','n5'):'The clinic workstation wall lights tile by tile past the halfway tick while the same chart stands on the desk.',
 ('a','n6a'):"Medium on the share bar: UTMB's own report tag drops onto the lit share.",
 ('a','n6b'):'Close on the chart: two open tags, accuracy and patient care, clip on and read not published.',
 ('a','n7a'):'Medium: a thread runs from the answer card to the literature card tab, showing where the answer says it came from.',
 ('a','n7b'):'Close on the answer card: its check ring stays empty while the citation card stays beside it.',
 ('a','n8'):'The question rides back to the chart edge with its sources, and the open evaluation tag hangs beside the chart.',
 ('b','n1a'):'Close at desk height: the half-typed card lies by the keyboard, then slides across the laminate and rises into the chart slot.',
 ('b','n1b'):'Wide desk level: the answer slides out of the chart toward camera and three citation cards fan beside it on the desk.',
 ('b','n2a'):'Close on the chart edge: the health-record boundary lights, the evidence tab docks and the September 22nd tag swings onto the chart.',
 ('b','n2b'):'Detail on the tags: the March live tag settles under the announcement on the same chart.',
 ('b','n3a'):'Close on the foreground reader: the blank badge drops onto it, the light wakes and the chart behind unlocks.',
 ('b','n3b'):'Detail at the keyboard: keys press, word shapes appear on the card with its plain-language pill and the card slides toward the chart.',
 ('b','n4a'):'Detail on the desk: three citation cards fan out from under the returned answer.',
 ('b','n4b'):'Close: the literature card and then the guidelines card lift off the desk toward camera.',
 ('b','n5'):'The workstation wall behind the desk lights past halfway while the propped chart holds the foreground.',
 ('b','n6a'):"Close on the share bar: UTMB's own report tag swings onto the lit share.",
 ('b','n6b'):'Detail on the chart page: accuracy and patient care tags clip on, open, reading not published.',
 ('b','n7a'):'Close on the answer lying on the desk: a thread reaches from it to the literature card tab.',
 ('b','n7b'):'Medium: the answer card and its citation stay side by side and the check ring stays empty.',
 ('b','n8'):'The question returns to the chart slot with its sources and the camera ends close on the open evaluation tag.',
}
CARRY = 'The same worn patient chart with its teal tabs, the same question card and the same three citation cards'

# ---------------------------------------------------------------- scene staging
SCENE = {
 's1': dict(beat='motion', role='hook', move='truckAcross', family='chart-flow', contract_role='action',
   subject='One worn patient chart, a typed question card and three citation cards',
   action='The half-typed question card leaves the chart and comes back as an answer with three citation cards.',
   emotion='Curiosity about what returns from a question asked inside the record.',
   annotation='Illustration. Not UTMB screen',
   takeaway='A question card leaves the chart and returns with an answer and citation cards.',
   must=[('typed question card leaves chart',['s1-card','s1-chart']),('citation cards return beside chart',['s1-sources','s1-chart'])],
   change='The question card exits the chart edge and the answer returns with citation cards beside it.',
   change_ids=['s1-card','s1-sources','s1-chart'],
   planes=[('Gulf window and clinic wall','s1-room','gulf window clinic wall desk'),
           ('wall shelf for returned sources','s1-sources','citation cards return beside chart sources shelf'),
           ('worn patient chart on rail','s1-chart','patient chart record typed question card leaves chart'),
           ('question card in flight','s1-card','typed question card leaves chart answer returns')]),
 's2': dict(beat='motion', role='movement', move='dollyThrough', family='record-boundary', contract_role='evidence',
   subject='The same chart inside a teal health record boundary with date tags',
   action='The record boundary lights, an evidence tab docks in its slot and two date tags attach to the chart.',
   emotion='The tool is placed inside the record on dated terms.',
   annotation='Announced September 22nd. Live since March',
   takeaway='The tool enters the chart record boundary and dated tags attach to the same chart.',
   must=[('health record boundary tool enters',['s2-boundary','s2-chart']),('announced tag live tag dates',['s2-tags','s2-chart'])],
   change='The boundary glows as the evidence tab docks, then the announced and live tags attach.',
   change_ids=['s2-boundary','s2-tags','s2-chart'],
   planes=[('clinic wall and window','s2-room','clinic wall window desk'),
           ('teal health record boundary','s2-boundary','health record boundary tool enters slot glows'),
           ('patient chart inside the record','s2-chart','patient chart record boundary tool enters'),
           ('dated tags on the chart','s2-tags','announced tag live tag dates september 22nd march chart')]),
 's3': dict(beat='motion', role='mechanism', move='craneDown', family='credential-desk', contract_role='mechanism',
   subject='A blank badge, the desk badge reader, the workstation and the chart',
   action='The badge touches the reader, the chart unlocks and a question is typed in plain word shapes.',
   emotion='Ordinary sign-in, then an ordinary question.',
   annotation='Usual credentials. Plain language',
   takeaway='A badge signs in at the reader, the chart unlocks and the question card is typed.',
   must=[('badge reader sign in credentials',['s3-reader','s3-chart']),('question card typed plain language',['s3-card','s3-chart'])],
   change='The badge contacts the reader, the clip unlocks, words fill the card and it slides to the chart edge.',
   change_ids=['s3-reader','s3-card','s3-chart'],
   planes=[('clinic wall and window','s3-room','clinic wall window'),
           ('desk badge reader and workstation','s3-reader','badge reader sign in credentials workstation'),
           ('unlocking patient chart','s3-chart','patient chart unlocks question card'),
           ('question card being typed','s3-card','question card typed plain language')]),
 's4': dict(beat='revelation', role='mechanism', move='riseWith', family='citation-cards', contract_role='mechanism',
   subject='The returned answer card and three citation cards naming source types',
   action='Citation cards fan out from the answer and the literature and guidelines cards lift toward camera.',
   emotion='The sources look solid and specific.',
   annotation='Medical literature. Clinical guidelines',
   takeaway='Citation cards fan from the answer and name medical literature and clinical guidelines.',
   must=[('citation cards fan from answer',['s4-card','s4-chart']),('medical literature clinical guidelines citation cards',['s4-card'])],
   change='Citation cards fan out, then the literature and guidelines cards lift.',
   change_ids=['s4-card','s4-chart'],
   planes=[('clinic wall and window','s4-room','clinic wall window'),
           ('shelf or desk where sources rest','s4-shelf','shelf desk sources answer'),
           ('patient chart behind the cards','s4-chart','patient chart answer citation cards fan'),
           ('citation cards lifting','s4-card','citation cards fan from answer medical literature clinical guidelines')]),
 's5': dict(beat='revelation', role='consequence', move='orbitReveal', family='workstation-wall', contract_role='consequence',
   subject='A wall of clinic workstation tiles beside the same chart',
   action='Workstation tiles light one by one past the halfway tick and a decision-support tag attaches.',
   emotion='The tool is already part of daily clinical work.',
   annotation='More than half. Clinical decision support',
   takeaway='More than half of the clinic workstation tiles light while the same chart stands nearby.',
   must=[('more than half clinic workstations lit',['s5-wall']),('clinical decision support tag chart',['s5-tag','s5-chart'])],
   change='Tiles light past the halfway tick and the decision support tag holds beside the lit share.',
   change_ids=['s5-wall','s5-tag','s5-chart'],
   planes=[('clinic wall and window','s5-room','clinic wall window'),
           ('workstation tile wall','s5-wall','more than half clinic workstations lit share half'),
           ('patient chart on the desk','s5-chart','patient chart clinical decision support'),
           ('decision support tag','s5-tag','clinical decision support tag chart')]),
 's6': dict(beat='revelation', role='limit', move='dollyThrough', family='unmeasured-tags', contract_role='limit',
   subject="UTMB's own report tag on the lit share and two open tags on the chart",
   action="A report tag labels the lit share, then accuracy and patient care tags clip on open and read not published.",
   emotion='The adoption figure is a self-report and the outcomes are missing.',
   annotation='Not published',
   takeaway="The share is UTMB's own report and accuracy and patient care tags stay open, not published.",
   must=[("UTMB own report tag",['s6-wall']),('accuracy patient care not published tags',['s6-limits','s6-chart'])],
   change='The report tag drops onto the share, then two open tags clip onto the chart reading not published.',
   change_ids=['s6-wall','s6-limits','s6-chart'],
   planes=[('clinic wall and window','s6-room','clinic wall window'),
           ('lit workstation share','s6-wall',"lit share UTMB own report tag"),
           ('patient chart','s6-chart','patient chart accuracy patient care not published tags'),
           ('open limit tags','s6-limits','accuracy patient care not published open tags')]),
 's7': dict(beat='emotion', role='agency', move='truckAcross', family='answer-citation', contract_role='limit',
   subject='The answer card, one citation card and the empty check ring',
   action='A thread runs from the answer to its citation tab while the answer check ring stays empty.',
   emotion='A source line is not the same as a right answer.',
   annotation='Right? Not shown',
   takeaway='A thread links the answer to its source, and the answer check ring stays empty.',
   must=[('citation thread answer source',['s7-card','s7-sources']),('answer check ring stays empty unmarked',['s7-card'])],
   change='The thread reaches the citation tab, then the empty ring pulses and stays unmarked.',
   change_ids=['s7-card','s7-sources'],
   planes=[('clinic wall and window','s7-room','clinic wall window'),
           ('patient chart behind','s7-chart','patient chart'),
           ('literature citation card','s7-sources','citation thread answer source literature card'),
           ('unmarked answer card','s7-card','answer check ring stays empty unmarked citation thread answer source')]),
 's8': dict(beat='emotion', role='close', move='riseWith', family='chart-flow', contract_role='answer',
   subject='The same chart holding its returned sources, the open tags and an evaluation tag',
   action='The question rides back to the chart edge with its sources and an open evaluation tag hangs beside it.',
   emotion='Sources came back. Whether answers are right is still open.',
   annotation='Still evaluating',
   takeaway='The chart holds its sources and open tags while an evaluation tag stays open.',
   must=[('question sources return chart edge',['s8-card','s8-chart']),('keep evaluating tag stays open',['s8-tags','s8-chart'])],
   change='The question returns to the chart edge and the open evaluation tag drops beside it.',
   change_ids=['s8-card','s8-tags','s8-chart'],
   planes=[('clinic wall and window','s8-room','clinic wall window'),
           ('open tags and evaluation tag','s8-tags','keep evaluating tag stays open accuracy patient care'),
           ('patient chart with sources','s8-chart','patient chart sources open tags question sources return chart edge'),
           ('question card returning','s8-card','question sources return chart edge')]),
}
TRANSITIONS = {
 ('s1','s2'):('same-subject','The same chart that sent the question now shows where the tool sits and when it began.','The chart, its teal tabs and the returned sources stay in place as the boundary lights.'),
 ('s2','s3'):('same-subject','After the dated facts, the same chart is unlocked by an ordinary sign-in.','The same chart and boundary stay in frame while the badge drops to the reader.'),
 ('s3','s4'):('same-subject','The question the clinician typed comes back as an answer with its citation cards.','The question card at the chart edge cuts to the answer on the shelf with the same cards.'),
 ('s4','s5'):('same-subject','The cited answers are used across the clinic, shown as lit workstation tiles beside the same chart.','The same chart with its attached citation tabs stands in front of the workstation wall.'),
 ('s5','s6'):('same-subject','The lit share is labelled as UTMB own report, then the missing measures attach to the chart.','The lit tile wall and share bar stay in view as the report tag drops.'),
 ('s6','s7'):('same-subject','The open tags raise the question the citation thread answers only in part.','The literature citation card and the answer card from the shelf come forward.'),
 ('s7','s8'):('same-subject','The unmarked answer returns to the chart where the open evaluation tag hangs.','The answer, its citation cards and the empty ring carry back to the same chart.'),
}

def clause_rows():
    return {c[0]: c for c in CLAUSES}

def build(variant):
    planned = json.loads((OUT / 'director-planned' / f'opening-{variant}.json').read_text())
    board = copy.deepcopy(planned)
    scenes = {s['id']: s for s in board['scenes']}
    rows = clause_rows()
    # ---------- captions: an explicit provisional cue plan (authored estimate)
    captions, cue_of = [], {}
    for cid, sid, text, cues, *_rest in CLAUSES:
        window = _rest[-1]
        parts = cues or [(text, window)]
        cue_of[cid] = []
        for ctext, (a, b) in parts:
            key = 'c%d' % (len(captions) + 1)
            captions.append({'id': key, 'start': a, 'end': b, 'text': ctext, 'source': 'authored_estimate',
                             'start_measured': False, 'end_measured': False})
            cue_of[cid].append(key)
    board['captions'] = captions
    # ---------- narration-picture clauses
    clauses, cursor = [], 0
    for cid, sid, text, cues, action, subjects, claims, events, (a, b) in CLAUSES:
        n = len(modern_film.narration_tokens(text))
        clauses.append({'id': cid, 'text': text, 'cue_ids': cue_of[cid], 'scene_id': sid, 'subject_ids': subjects,
                        'action_id': action, 'claim_ids': claims, 'event_ids': events, 'start_s': a, 'end_s': b,
                        'word_range': [cursor, cursor + n]})
        cursor += n
    board['narration_picture'] = {'version': 'narration-picture-v1', 'timing_mode': 'authored',
        'cue_plan': 'Provisional authored cue estimate for the silent two-treatment comparison only. board_retime.py replaces it with measured_caption_boundaries after acoustic alignment; it approves nothing.',
        'clauses': clauses}
    clause = {c['id']: c for c in clauses}
    event_clause = {e: c['id'] for c in clauses for e in c['event_ids']}
    # ---------- scenes
    for sid, scene in scenes.items():
        spec = SCENE[sid]
        scene.update(beat=spec['beat'], story_role=spec['role'], camera_strategy=spec['move'],
                     visual_family=spec['family'], payload_mode='picture', treatment=variant,
                     hero='worn patient chart with question and citation cards')
        scene['visual_sentence'] = {'subject': spec['subject'], 'action': spec['action'],
                                    'emotion': spec['emotion'], 'annotation': spec['annotation']}
        scene['planes'] = [{'z': 900 - 200 * i, 'label': label,
                            'items': [{'id': iid, 'kind': 'applicationRecord', 'x': 540, 'y': 900, 'scale': 1,
                                       'props': {'label': words}}]}
                           for i, (label, iid, words) in enumerate(spec['planes'])]
        items = [p['items'][0]['id'] for p in scene['planes']]
        for ev in scene['visual_events']:
            lo, hi, curve, _ = EVENTS[ev['id']]
            c = clause[event_clause[ev['id']]]
            start = c['start_s'] + lo * (c['end_s'] - c['start_s'])
            end = c['start_s'] + hi * (c['end_s'] - c['start_s'])
            ev['at_s'] = round(start - scene['start_s'], 4)
            ev['duration_s'] = round(end - start, 4)
            ev['at_s_authored'] = ev['at_s']; ev['duration_s_authored'] = ev['duration_s']
            ev['narration_id'] = c['id']
            ev['clause_fraction_start'] = lo; ev['clause_fraction_end'] = hi
            ev['motion'] = {'curve': curve, 'anticipation': 0, 'settle': .08 if curve == 'contact' else .03}
            ev['item_ids'] = [i for i in items if not i.endswith('-room')]
        scene['visual_proof'] = {'mute_takeaway': spec['takeaway'],
                                 'must_show': [{'concept': k, 'item_ids': v} for k, v in spec['must']],
                                 'change': {'description': spec['change'], 'item_ids': spec['change_ids']}}
        if sid == 's1':
            scene['hook_strategy'] = 'visual_anomaly'; scene['hook_payoff_s'] = 1.2
    # ---------- shots, from clause handoffs at the midpoint of the silence between clauses
    shots = []
    for sid, scene in scenes.items():
        scene_rows = [c for c in clauses if c['scene_id'] == sid]
        for n, row in enumerate(scene_rows):
            lo = scene['start_s'] if n == 0 else (scene_rows[n-1]['end_s'] + row['start_s']) / 2
            hi = scene['start_s'] + scene['duration_s'] if n + 1 == len(scene_rows) else (row['end_s'] + scene_rows[n+1]['start_s']) / 2
            assigned = [r for r in SHOTS[variant] if r[0] == row['id']]
            for k, (_, view, framing) in enumerate(assigned):
                a = lo + (hi - lo) * k / len(assigned); b = lo + (hi - lo) * (k + 1) / len(assigned)
                evs = [e for e in scene['visual_events'] if e['narration_id'] == row['id']]
                inside = [e for e in evs if scene['start_s'] + e['at_s'] < b and scene['start_s'] + e['at_s'] + e['duration_s'] > a]
                shots.append({'id': f"{sid}-shot-{len([s for s in shots if s['scene_id'] == sid]) + 1}", 'scene_id': sid,
                              'start_s': round(a, 4), 'duration_s': round(b - a, 4), 'framing': framing,
                              'transition': 'cut', 'view': view, 'event_id': (inside or evs)[0]['id'],
                              'purpose': PURPOSE[(variant, row['id'])], 'carry': CARRY, 'narration_ids': [row['id']],
                              'scene_fraction_start': round((a - scene['start_s']) / scene['duration_s'], 6),
                              'scene_fraction_end': round((b - scene['start_s']) / scene['duration_s'], 6)})
    # snap shot boundaries so the timeline tiles exactly
    for prev, nxt in zip(shots, shots[1:]):
        prev['duration_s'] = round(nxt['start_s'] - prev['start_s'], 4)
    last = shots[-1]; last['duration_s'] = round(board['runtime_s'] - last['start_s'], 4)
    rewards = []
    for scene in scenes.values():
        for ev in scene['visual_events']:
            at = scene['start_s'] + ev['at_s'] + ev['duration_s'] * .5
            owner = next(s for s in shots if s['scene_id'] == scene['id'] and ev['narration_id'] in s['narration_ids']
                         and s['start_s'] - .001 <= at < s['start_s'] + s['duration_s'] + .001)
            rewards.append({'shot_id': owner['id'], 'event_id': ev['id'], 'at_s': round(at, 4), 'kind': EVENTS[ev['id']][3],
                            'visible_change': ev['what'], 'event_fraction': .5})
    fd = board['film_direction']
    fd['renderer_inputs'] = modern_film.renderer_inputs(fd['episode'], REPO)
    fd['shots'] = shots; fd['rewards'] = rewards
    # ---------- story contract completion (director wording kept, rows added)
    sc = board['story_contract']
    sc['scenes'] = [{'scene_id': sid, 'role': SCENE[sid]['contract_role'], 'claim_ids': scenes[sid]['vo_claims'],
                     'advances': ' '.join(e['what'] for e in scenes[sid]['visual_events'])} for sid in scenes]
    sc['transitions'] = [{'from': a, 'to': b, 'kind': k, 'because': because, 'visible_bridge': bridge}
                         for (a, b), (k, because, bridge) in TRANSITIONS.items()]
    board['cinematic_contract'] = {
        'throughline': {'subject': 'One worn patient chart, its question card and the citation cards that return to it',
                        'opening_state': 'A half-typed question card sits on the chart, about to leave it.',
                        'closing_state': 'The chart holds the returned sources, the open accuracy and patient care tags and an open evaluation tag.',
                        'scene_ids': list(scenes)},
        'turn_scene': 's6',
        'button': 'Sources come back with the answer, and the tags that would show it is right stay open.'}
    # ---------- quality, cinema, documentary
    board['quality_plan'] = {'contract_sha256': sha(REPO / 'config/quality_contract.json'), 'scenes': [
        {'scene_id': sid, 'medium': 'diagram', 'subject': SCENE[sid]['subject'], 'action': SCENE[sid]['action'],
         'consequence': scenes[sid]['visual_events'][-1]['what'],
         'source_basis': 'Claims ' + ', '.join(scenes[sid]['vo_claims']) + '. ' + LIMIT_SHORT,
         'medium_evidence': 'Registered clinic-answer-v1 with the fresh authored ChartHero and ClinicSupport groups performing board events on the film clock.'}
        for sid in scenes]}
    board['cinema'] = {'version': 'creative-production-v1', 'hero_scene_id': 's6', 'hero_passage_end_scene_id': 's7',
        'dimensional_scene_ids': [],
        'visible_action': "UTMB's own report tag drops on the lit share, two open tags clip onto the chart reading not published, then a thread links the answer to its citation while the answer's check ring stays empty.",
        'human_consequence': 'UTMB clinicians get cited answers inside the record, and the release gives patients and clinicians no published accuracy or care measure.',
        'source_limit': LIMIT_SHORT}
    board['documentary'] = {'schema': 'dispatch_documentary/1',
        'viewer_question': sc['opening_question'],
        'payoff': 'The answer returns with citation cards, and the accuracy and patient care tags stay open.',
        'source_limit': LIMIT_SHORT,
        'hero_image': 'Two open tags, accuracy and patient care, clipped to the same chart that holds the returned citations.',
        'closing_answer': sc['closing_answer'],
        'hook_payoff_event': 's1-event-1'}
    # ---------- creative direction completion
    cd = board['creative_direction']
    cd['policy_sha256'] = sha(REPO / 'config/creative_production.json')
    edits = []
    for (sid, scene), nxt in zip(scenes.items(), list(scenes)[1:] + [None]):
        evs = scene['visual_events']
        bridge = TRANSITIONS.get((sid, nxt), (None, None, 'The closing picture holds the chart, its returned sources and the open tags as the answer.'))[2]
        edits.append({'scene_id': sid, 'enter_on': evs[0]['what'], 'leave_on': evs[-1]['what'],
                      'cut_after_event_id': evs[-1]['id'], 'next_connection': bridge,
                      'sentence_to_shot': {'clause': scene['vo'], 'subject': SCENE[sid]['subject'],
                                           'relationship': SCENE[sid]['action'], 'source_limit': LIMIT_SHORT}})
    cd['edits'] = edits
    cd['sound'] = {
        'perspective': 'Designed illustration sound for paper, card and a desk reader. Never recorded clinic audio, never a vendor sound.',
        'music_arc': 'A light curious pulse carries the question out and back, steadies under the dated facts, drops away at the open tags and returns softly for the evaluation close.',
        'voice_arc': 'Brisk question and return, plain dated facts, an ordinary sign-in, specific source types, a measured share, then a slower plain limit and a level close.',
        'cues': [
            {'id': 'card-slide', 'event_id': 's1-event-1', 'role': 'contact', 'duration_s': 0.5,
             'intent': 'A soft paper slide follows the question card as it leaves the chart edge.', 'provenance': 'Original designed paper foley, no recorded clinic audio.'},
            {'id': 'cards-land', 'event_id': 's1-event-3', 'role': 'contact', 'duration_s': 0.4,
             'intent': 'A light stacked-card tap marks the citation cards landing beside the chart.', 'provenance': 'Original designed card foley.'},
            {'id': 'reader-chirp', 'event_id': 's3-event-1', 'role': 'sonification', 'duration_s': 0.3,
             'intent': 'A quiet designed tone marks the badge touching the reader, not a recording of any real reader.', 'provenance': 'Original designed tone, not an actual device recording.'},
            {'id': 'limit-quiet', 'event_id': 's6-event-2', 'role': 'quiet', 'duration_s': 1.2, 'gain': 0.3,
             'intent': 'Pull the music back while the accuracy and patient care tags clip on open.', 'provenance': 'Authored event-clock background contrast.'},
        ]}
    # ---------- art direction (executed by clinic-answer-v1)
    hero_ids = sorted({i for s in scenes.values() for e in s['visual_events'] for i in e['item_ids'] if i.endswith('-chart')})
    board['art_direction'] = {
        'version': 'directed-world-v1',
        'palette': {'background': '#E2E4DC', 'midground': '#93A39E', 'foreground': '#41585A', 'ink': '#1E2F33',
                    'paper': '#F3ECDC', 'hero': '#1F7672', 'accent': '#C46F3A'},
        'palette_reason': 'Hazy Gulf Coast white wall and worn warm paper carry the clinic; teal card stock marks the chart and its returned sources; a copper accent is kept only for the open tags and the empty check ring.',
        'shape_language': 'A tall rounded hardboard chart with lopsided teal tabs against small soft-cornered cards and long thin tags; the workstation wall is a loose uneven grid of rounded tiles.',
        'focal_hierarchy': 'The chart first, the moving question or answer card second, the dated and open tags third, room and window last.',
        'motion_language': 'Cards travel on accelerating and braking paths from the chart edge and back, tags drop and settle without bounce, and the camera holds or makes one small move per shot tied to the moving card.',
        'lighting': {'motivation': 'Soft hazy Gulf Coast window light from the upper left warms the paper; a cool fill from the right shades card edges; contact shadows ground every card on its shelf, desk or chart.',
                     'ambient': 0.85, 'exposure': 1,
                     'key': {'position': [-5, 6, 4], 'color': '#FFF4DD', 'intensity': 1.8},
                     'fill': {'position': [5, 2, 3], 'color': '#C4D8D8', 'intensity': 0.9},
                     'rim': {'position': [2, 5, -4], 'color': '#FFF8EC', 'intensity': 0.7}},
        'hero': {'asset': NS + 'ChartHero.tsx',
                 'silhouette': 'A tall worn hardboard clipboard chart with a steel clip and uneven teal card-stock tabs standing proud on its right edge.',
                 'finish': 'Grained warm paper, ruled blank fields, a dog-eared corner, a faint ring stain, chipped board edges, steel clip highlights and soft contact shadows.',
                 'subject_ids': hero_ids},
        'signature_shot': {'scene_id': 's7', 'event_id': 's7-event-3', 'reason': "The answer's check ring pulses and stays empty beside the citation that names its source."},
        'shots': {},
        'flat_shots': {sid: {'scale': 1, 'x': 0, 'y': 0, 'reason': 'Hold the authored composition; the episode camera moves only with the performing card or tag.'} for sid in scenes},
    }
    board['fingerprint'] = {
        'pov': 'wall-chart-flow' if variant == 'a' else 'desk-level-close',
        'motion_vector': 'left-to-right-question-and-sources' if variant == 'a' else 'toward-camera-across-desk',
        'hero_treatment': 'authored-worn-patient-chart-with-teal-tabs',
        'layout': 'chart-on-wall-rail-with-return-shelf' if variant == 'a' else 'chart-propped-on-desk-with-near-reader',
        'register': 'disclosed-source-bound-illustration', 'camera_strategy': 'held-with-card-led-moves',
        'light_story': 'gulf-window-key-cool-fill', 'palette': 'Hazy white, warm paper, teal, copper',
        'metaphor': 'A question goes out of the chart and sources come back to it'}
    board['divergence_note'] = ('A stands back from a chart on the clinic wall: the question and its sources travel left to right across it, wide shots lead and the return lands on a shelf. '
                                'B sits at desk height: keyboard, badge reader and propped chart stay large, close and detail shots lead, cards slide across the desk toward camera and the film ends close on the open evaluation tag. '
                                'Both share the same narration, events, authored hero and support groups and film clock.')
    board['hook_strategy'] = 'action-first'; board['hook_payoff_s'] = 1.2
    # ---------- attention beats
    board['attention_beats'] = [{'id': f"{e['id']}-attention", 'event_id': e['id'], 'item_ids': e['item_ids'][:2],
        'change_type': CHANGE_TYPE[EVENTS[e['id']][3]], 'visible_change': e['what'], 'viewer_reward': e['what'],
        'continuity_from': 'The same worn chart with teal tabs and the same cards stay in view across the cut.',
        'sound_action': 'Designed paper and card sound follows the moving card or tag; music drops at the open tags.'}
        for s in scenes.values() for e in s['visual_events']]
    # ---------- visual research and native media for the authored source groups
    url = 'https://www.utmb.edu/utmb/news-article/utmb-news/2026/09/22/utmb-collaborates-with-openevidence-to-integrate-ai-platform-directly-into-clinical-workflows'
    board['visual_research'] = {
        'searches': [{'query': 'UTMB OpenEvidence September 22 2026 release images', 'finding': 'The release carries one lead photograph of a clinician at a workstation with no credit line or reuse licence; it shows no tool or answer.'},
                     {'query': 'OpenEvidence electronic health record integration screenshot', 'finding': 'Only vendor marketing views exist; using one would imply UTMB screen access and a vendor interface the film must not show.'}],
        'candidates': [{'url': url, 'decision': 'reject', 'reason': 'Release lead photograph has no reuse licence and shows a workplace, not the tool or any answer.'}]
                      + [{'url': f'authored://{ED}/{r["id"]}', 'decision': 'use', 'reason': 'Fresh original authored source group performs the disclosed source-bound question, citation and limit relationship.'}
                         for r in board['story_art']['requests']],
        'decision': 'Two fresh authored source groups, a chart-and-citation hero and a clinic support group, carry the reported relationship as disclosed illustration.'}
    board['native_media'] = [{
        'request_id': r['id'], 'file': r['file'], 'sha256': sha(REPO / r['file']), 'tool': 'original authored source',
        'source_url': f'authored://{ED}/{r["id"]}', 'original_url': f'authored://{ED}/{r["id"]}',
        'subject': 'One worn patient chart, its question card, the returned answer and citation cards' if r['role'] == 'hero'
                   else 'A Gulf Coast clinic room, badge reader, workstation, record boundary and workstation tile wall',
        'relevance': 'Performs the source-bound question, return, citation and limit actions in both treatments.' if r['role'] == 'hero'
                     else 'Stages sign-in, the record boundary and the more-than-half share around the same chart.',
        'inspection': 'Authored in this edition and type-checked; rendered pixels still need the independent code, phone and final reviews.',
        'rights_basis': 'Fresh original authored React and SVG illustration created for this edition; no third-party image.',
        'basis': 'Disclosed original illustration of the reported relationship, not observed footage or a real interface.',
        'story_role': 'context', 'scene_ids': r['scene_ids'],
        'claim_ids': sorted({c for s in r['scene_ids'] for c in scenes[s]['vo_claims']}, key=lambda x: int(x[1:]))}
        for r in board['story_art']['requests']]
    return board

if __name__ == '__main__':
    boards = {v: build(v) for v in ('a', 'b')}
    for v, b in boards.items():
        (OUT / f'opening-{v}.json').write_text(json.dumps(b, indent=2) + '\n')
    (OUT / 'storyboard.json').write_text(json.dumps(boards['a'], indent=2) + '\n')
    print('completed both treatment boards', boards['a']['runtime_s'])
