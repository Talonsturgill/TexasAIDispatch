"""Scene-builder completion of the director's two planned boards for 2026-10-09-claude-pilot.

Reads the director's planned opening-a.json and opening-b.json, keeps every director-owned
field byte-for-byte (narration, claims, scene order and ids, event ids and their wording,
story_art requests, the story_contract wording, film_direction prose), and fills the
fields the gates require with the implemented clinic-answer-v1 renderer choices.
Writes both boards and keeps storyboard.json equal to opening-a.json.
Timing is an authored provisional cue plan for the silent comparison only.

Repair 1 (batch clinic-cited-answer-v1, independent critic D1 to D15) is applied as an explicit
overlay on the director-planned inputs, which stay byte-for-byte as the director wrote them:
the director's three script edits (n1a, n2a, n8), the scene timing those longer lines need,
interior scenes, event wording that matches the corrected picture, re-bound story_art
action_uses and the corrected closing prose. Recorded authored receipts already in the current
board are carried forward unchanged for the director's next record step.
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
 ('n1a','s1','A UTMB clinician asks a question.',None,'send-question',['question-card','hands','openevidence-tool'],['c1','c4'],['s1-event-1'],(0.25,1.95)),
 ('n1b','s1','The answer comes back with its sources.',None,'return-answer',['answer-card','citation-cards','openevidence-tool'],['c4'],['s1-event-2','s1-event-3'],(2.15,4.3)),
 ('n2a','s2','UTMB announced the OpenEvidence AI tool on September twenty-second,',None,'enter-record',['record-boundary','openevidence-tool','date-tags'],['c1'],['s2-event-1','s2-event-2'],(4.75,8.35)),
 ('n2b','s2','and says it went live in March.',None,'mark-live',['chart','date-tags'],['c2'],['s2-event-3'],(8.5,10.3)),
 ('n3a','s3','Clinicians sign in with their usual credentials',None,'sign-in',['credential-field','record-lock','hands'],['c3'],['s3-event-1'],(10.75,13.4)),
 ('n3b','s3','and ask in plain language.',None,'type-question',['question-card','hands','keyboard'],['c4'],['s3-event-2','s3-event-3'],(13.6,15.8)),
 ('n4a','s4','The answers carry citations',None,'return-citations',['citation-cards','answer-card'],['c4'],['s4-event-1'],(16.25,17.9)),
 ('n4b','s4','to medical literature and clinical guidelines.',None,'name-source-types',['citation-cards','source-types'],['c4'],['s4-event-2','s4-event-3'],(18.05,21.3)),
 ('n5','s5','UTMB says more than half of its clinicians now use it for clinical decision support.',
  [('UTMB says more than half of its clinicians',(21.75,24.25)),('now use it for clinical decision support.',(24.4,26.8))],
  'show-usage',['clinician-tokens','decision-tag'],['c5'],['s5-event-1','s5-event-2','s5-event-3'],(21.75,26.8)),
 ('n6a','s6',"That is UTMB's own report.",None,'attribute-report',['report-tag','clinician-tokens'],['c5'],['s6-event-1'],(27.25,28.9)),
 ('n6b','s6','The release publishes no measure of accuracy or patient care.',None,'show-limit',['unmeasured-tags','answer-card'],['c8'],['s6-event-2','s6-event-3'],(29.1,32.8)),
 ('n7a','s7','A citation shows where an answer says it came from.',None,'trace-citation',['citation-cards','answer-card','source-types'],['c4'],['s7-event-1'],(33.25,36.3)),
 ('n7b','s7',"It doesn't show the answer is right.",None,'withhold-verdict',['answer-card','accuracy-slot'],['c8'],['s7-event-2','s7-event-3'],(36.5,39.25)),
 ('n8','s8','UTMB says it will keep evaluating use and clinician experience.',None,'keep-evaluating',['evaluation-tag','chart'],['c8'],['s8-event-1','s8-event-2','s8-event-3'],(39.7,43.3)),
]
# event id -> (clause fraction start, end, motion curve, reward kind)
EVENTS = {
 's1-event-1':(.22,.72,'travel','action'), 's1-event-2':(.02,.45,'travel','action'), 's1-event-3':(.52,.95,'travel','consequence'),
 's2-event-1':(.05,.3,'smoothstep','reveal'), 's2-event-2':(.55,.85,'contact','evidence'), 's2-event-3':(.2,.6,'contact','evidence'),
 's3-event-1':(.45,.85,'contact','action'), 's3-event-2':(.05,.5,'linear','action'), 's3-event-3':(.6,.95,'travel','consequence'),
 's4-event-1':(.15,.75,'travel','reveal'), 's4-event-2':(.1,.4,'travel','evidence'), 's4-event-3':(.55,.85,'travel','evidence'),
 's5-event-1':(.02,.2,'smoothstep','reveal'), 's5-event-2':(.25,.45,'smoothstep','comparison'), 's5-event-3':(.62,.85,'contact','consequence'),
 's6-event-1':(.2,.8,'contact','evidence'), 's6-event-2':(.1,.35,'contact','reveal'), 's6-event-3':(.5,.75,'smoothstep','consequence'),
 's7-event-1':(.2,.5,'travel','evidence'), 's7-event-2':(.1,.45,'smoothstep','comparison'), 's7-event-3':(.55,.9,'smoothstep','reaction'),
 's8-event-1':(.05,.35,'contact','consequence'), 's8-event-2':(.58,.8,'smoothstep','consequence'), 's8-event-3':(.84,1.0,'smoothstep','consequence'),
}
# Repair 1: the director's script edits, the scene timing they need, and event wording that
# matches the corrected picture. Ids, order and claims are unchanged.
REPAIR = {
 'durations': {'s1':4.5,'s2':6.0,'s3':5.5,'s4':5.5,'s5':5.5,'s6':6.0,'s7':6.5,'s8':4.5},
 'vo': {'s1':'A UTMB clinician asks a question. The answer comes back with its sources.',
        's2':'UTMB announced the OpenEvidence AI tool on September twenty-second, and says it went live in March.',
        's8':'UTMB says it will keep evaluating use and clinician experience.'},
 'what': {
  's1-event-1':'The typed question card leaves the open chart and goes into the OpenEvidence tool.',
  's1-event-2':'One answer card slides back out of the OpenEvidence tool.',
  's1-event-3':'Three citation cards follow the answer out and tuck into its Sources slot.',
  's3-event-1':'Hands type a masked credential and the health record lock opens.',
  's5-event-1':'Blank clinician tokens begin to light on the usage share beside the chart.',
  's5-event-2':'More than half of the clinician tokens light and the share passes halfway.',
  's6-event-2':'Accuracy and patient care tags clip onto the returned answer.',
  's6-event-3':'Both tags read not in release while the Accuracy slot stays empty.',
  's8-event-1':'An evaluating use and experience tag pins to the usage share.',
  's8-event-2':'The answer holds beside the chart with its sources in its Sources slot.',
  's8-event-3':'The Accuracy slot stays empty while the picture holds.'},
 'film_direction': {
  'closing_answer':'A question goes in and an answer comes back with its sources. The release publishes no accuracy or patient-care measure, and UTMB says it will keep evaluating use and clinician experience.'},
 'creative_direction': {
  'emotional_turn':'The sources look like proof, then the open tags show the release publishes no measure of whether the answers are right.',
  'medium_choice':'News report / Explanatory animation, mechanism-led. No footage, licensed image or authenticated view of the tool exists, so original authored diagrams perform the described sequence; a static release excerpt would hide the question and its return.'},
}
STORY_ART_REPAIR = {
 'chart-and-citations': dict(
  scene_ids=['s1','s2','s3','s4','s5','s6','s7','s8'],
  prompt=("Author an original finished React and SVG object in the current Remotion engine. A tall clinical chart board in worn warm paper and teal card stock "
          "with a metal clip, a ruled record page with blank fields and a lopsided tabbed edge, in soft Gulf Coast window light from the upper left with cool fill. "
          "One typed question card, one answer card with a Sources slot that fills and an Accuracy slot that stays empty, and one set of three citation cards whose tabs read "
          "medical literature, clinical guidelines and other sources. Two pinned tags on the answer's own clip read accuracy and patient care, not in release. Every tag hangs "
          "from a drawn pin and is sized to its text. Grounded contact shadows, hand-made edges, slight wear, nothing symmetric. A disclosed illustration with no real interface, "
          "logo, face, patient detail or answer content."),
  purpose="Carry one patient chart, one question, one answer and one citation set through the film, so the answer's filled Sources slot and empty Accuracy slot show what a citation does and doesn't establish.",
  action_uses=[
   {'scene_id':'s1','event_id':'s1-event-1','view':'flow-wide','action_id':'send-question','subject_ids':['question-card']},
   {'scene_id':'s1','event_id':'s1-event-1','view':'desk-close','action_id':'send-question','subject_ids':['question-card','hands']},
   {'scene_id':'s4','event_id':'s4-event-1','view':'citation-stack','action_id':'return-citations','subject_ids':['citation-cards']},
   {'scene_id':'s6','event_id':'s6-event-2','view':'unmeasured-card','action_id':'show-limit','subject_ids':['unmeasured-tags']}]),
 'clinic-support': dict(
  scene_ids=['s1','s2','s3','s4','s5','s6','s7','s8'],
  prompt=("Author an original finished React and SVG environment group in the current Remotion engine. A Gulf Coast clinic room with a hazy marsh window, a worn laminate desk, "
          "a three-quarter workstation monitor with a blank lit screen, a blank-keyed keyboard and anonymous scrub-sleeved hands with planted wrists whose fingertips press keys, "
          "a masked credential card, a teal health record boundary with a lock that opens, a docked tool box labelled OpenEvidence with a mouth where cards go in and come out, "
          "and a usage share of blank clinician ID tokens that light past a halfway tick. Window key light with cool fill, sea-salt wear, grounded shadows, nothing symmetric. "
          "No real screens, logos, faces, identities, patient information or vendor interface."),
  purpose="Give the chart a believable Southeast Texas clinic: hands that sign in and ask, the OpenEvidence tool at the edge of the record where the question goes and the answer comes from, and UTMB's own more-than-half usage share.",
  source_limit="Disclosed illustration. The hands are anonymous, the tool label is native type rather than a product interface, and the lit tokens show UTMB's own more-than-half report as a share, not a count, a measurement or a map of UTMB's campuses.",
  action_uses=[
   {'scene_id':'s2','event_id':'s2-event-1','view':'chart-boundary','action_id':'enter-record','subject_ids':['record-boundary','openevidence-tool']},
   {'scene_id':'s3','event_id':'s3-event-1','view':'credential-gate','action_id':'sign-in','subject_ids':['credential-field','record-lock','hands']},
   {'scene_id':'s5','event_id':'s5-event-2','view':'share-grid','action_id':'show-usage','subject_ids':['clinician-tokens']}]),
}
CHANGE_TYPE = {'action':'mechanism','consequence':'consequence','reveal':'reveal','evidence':'evidence','comparison':'comparison','reaction':'resolution'}

# ---------------------------------------------------------------- shots per treatment
# (clause, view, framing) in order. A clause with two rows splits its window evenly.
SHOTS = {
 'a': [('n1a','flow-wide','wide'),('n1b','desk-close','close'),
       ('n2a','chart-boundary','medium'),('n2b','chart-boundary','close'),
       ('n3a','credential-gate','close'),('n3b','desk-close','detail'),
       ('n4a','citation-stack','close'),('n4b','source-types','medium'),
       ('n5','share-grid','wide'),('n5','share-grid','close'),
       ('n6a','unmeasured-card','close'),('n6b','unmeasured-card','medium'),
       ('n7a','source-types','medium'),('n7b','answer-close','detail'),
       ('n8','share-grid','close'),('n8','answer-close','medium')],
 'b': [('n1a','desk-close','close'),('n1b','flow-wide','wide'),
       ('n2a','chart-boundary','medium'),('n2b','chart-boundary','detail'),
       ('n3a','credential-gate','close'),('n3b','desk-close','detail'),
       ('n4a','citation-stack','detail'),('n4b','source-types','close'),
       ('n5','share-grid','wide'),('n5','share-grid','close'),
       ('n6a','unmeasured-card','close'),('n6b','unmeasured-card','detail'),
       ('n7a','answer-close','close'),('n7b','answer-close','detail'),
       ('n8','share-grid','close'),('n8','answer-close','medium')],
}
PURPOSE = {
 ('a','n1a'):'Wide on the clinic wall: hands type at the near keyboard, the question fills on the chart page, a final key strike sends it left to right into the OpenEvidence tool.',
 ('a','n1b'):'Close on the tool and the desk: one answer drops out of the tool mouth and three citation cards follow and tuck into its Sources slot.',
 ('a','n2a'):'Medium: the health record boundary and the OpenEvidence tool light together and the September 22nd tag pins to the boundary.',
 ('a','n2b'):'Close on the pinned tags: the March live tag settles under the announcement on the same boundary.',
 ('a','n3a'):'Close: the hands type a masked credential and the lock on the health record boundary opens in the same shot.',
 ('a','n3b'):'Detail: key strikes fill the question card on the chart page in word shapes with its plain-language pill, then it slides to the chart edge.',
 ('a','n4a'):'Close on the desk: the three citation cards fan left to right out of the answer card Sources slot.',
 ('a','n4b'):'Medium: the medical literature card lifts, then the clinical guidelines card lifts.',
 ('a','n5'):'The usage share on the wall above the tool lights its clinician tokens past halfway and a decision support tag pins to it.',
 ('a','n6a'):"Close on the share bar: UTMB's own report tag pins to its halfway pin.",
 ('a','n6b'):'Medium on the answer: accuracy and patient care tags clip onto its own clip and read not in release beside the empty Accuracy slot.',
 ('a','n7a'):'Medium on the answer: a thread runs from its Sources slot to the medical literature card tab.',
 ('a','n7b'):'Detail on the empty Accuracy slot: its ring pulses and nothing lands in it.',
 ('a','n8'):'The evaluating use and experience tag pins to the usage share, then the answer holds beside the chart with its sources and its empty Accuracy slot.',
 ('b','n1a'):'Close at desk height: hands finish typing, the right hand pushes the card once across the laminate and it slides into the OpenEvidence tool mouth.',
 ('b','n1b'):'Wide desk level: one answer slides back out of the tool toward the lens and three citation cards follow and tuck into its Sources slot.',
 ('b','n2a'):'Medium: the health record boundary and the OpenEvidence tool light together and the September 22nd tag pins to the boundary.',
 ('b','n2b'):'Detail on the pinned tags: the March live tag settles under the announcement.',
 ('b','n3a'):'Close: the hands type a masked credential and the lock at the foot of the health record boundary opens in the same shot.',
 ('b','n3b'):'Detail at the keyboard: keys go down under fingertips, the card fills in word shapes with its plain-language pill and one push slides it to the chart edge.',
 ('b','n4a'):'Detail on the desk: the three citation cards rise out of the answer card Sources slot toward the lens.',
 ('b','n4b'):'Close: the medical literature card lifts, then the clinical guidelines card lifts.',
 ('b','n5'):'The usage share above the tool lights its clinician tokens past halfway and a decision support tag pins to it.',
 ('b','n6a'):"Close on the share bar: UTMB's own report tag pins to its halfway pin.",
 ('b','n6b'):'Detail on the answer: accuracy and patient care tags clip onto its own clip and read not in release beside the empty Accuracy slot.',
 ('b','n7a'):'Close on the answer: a thread reaches from its Sources slot to the medical literature card tab.',
 ('b','n7b'):'Detail on the empty Accuracy slot: its ring pulses and nothing lands in it.',
 ('b','n8'):'The evaluating use and experience tag pins to the usage share, then the answer holds beside the chart with its sources and its empty Accuracy slot.',
}
CARRY = 'The same worn patient chart, the same OpenEvidence tool, one question card, one answer card and one set of three citation cards'

# ---------------------------------------------------------------- scene staging
SCENE = {
 's1': dict(beat='motion', role='hook', move='truckAcross', family='chart-flow', contract_role='action',
   subject='Anonymous hands, one question card, the OpenEvidence tool at the record edge, one answer and its citation cards',
   action='Hands type and send the question card into the OpenEvidence tool, and one answer comes back out with three citation cards.',
   emotion='Curiosity about what returns from a question asked inside the record.',
   annotation='Illustration. Not UTMB screen',
   takeaway='Hands send a typed question into the OpenEvidence tool and one answer returns with citation cards.',
   must=[('hands typed question card into tool',['s1-card','s1-tool']),('answer citation cards return from tool',['s1-sources','s1-tool'])],
   change='The question card goes into the tool mouth and the answer comes back out with three citation cards.',
   change_ids=['s1-card','s1-sources','s1-tool'],
   planes=[('Gulf window and clinic wall','s1-room','gulf window clinic wall desk chart'),
           ('OpenEvidence tool at the record edge','s1-tool','openevidence ai tool record edge question into tool answer citation cards return from tool'),
           ('answer card and citation cards','s1-sources','answer citation cards return from tool sources slot'),
           ('hands and question card','s1-card','hands typed question card into tool keyboard')]),
 's2': dict(beat='motion', role='movement', move='dollyThrough', family='record-boundary', contract_role='evidence',
   subject='The same chart inside the teal health record boundary, the OpenEvidence AI tool docked at its edge, and two pinned date tags',
   action='The boundary and the docked OpenEvidence tool light together and two date tags pin to the boundary.',
   emotion='The AI tool is placed at the edge of the record on dated terms.',
   annotation='OpenEvidence AI tool. Announced September 22nd. Live since March',
   takeaway='The OpenEvidence AI tool lights at the health record boundary and dated tags pin beside it.',
   must=[('openevidence ai tool health record boundary',['s2-boundary','s2-tool']),('announced tag live tag dates',['s2-tags','s2-boundary'])],
   change='The boundary and tool light, then the announced and live tags pin to the boundary.',
   change_ids=['s2-boundary','s2-tool','s2-tags'],
   planes=[('clinic wall and window','s2-room','clinic wall window desk'),
           ('health record boundary and chart','s2-boundary','health record boundary chart record pins'),
           ('docked OpenEvidence AI tool','s2-tool','openevidence ai tool health record boundary announced'),
           ('pinned date tags','s2-tags','announced tag live tag dates september 22nd march pinned boundary')]),
 's3': dict(beat='motion', role='mechanism', move='craneDown', family='credential-desk', contract_role='mechanism',
   subject='Anonymous hands, a masked credential card, the health record lock and the question card',
   action='Hands type a masked credential, the record lock opens, then the hands type the question in plain word shapes.',
   emotion='Ordinary sign-in, then an ordinary question.',
   annotation='Usual credentials. Plain language',
   takeaway='Hands sign in with usual credentials, the lock opens and the question is typed in plain language.',
   must=[('hands sign in usual credentials lock',['s3-credential','s3-lock']),('question card typed plain language hands',['s3-card','s3-hands'])],
   change='Dots fill the masked field, the lock opens, words fill the question card and one push slides it to the chart edge.',
   change_ids=['s3-credential','s3-lock','s3-card','s3-hands'],
   planes=[('clinic wall and window','s3-room','clinic wall window'),
           ('health record lock','s3-lock','health record lock opens sign in usual credentials'),
           ('masked credential card','s3-credential','usual credentials masked sign in hands lock'),
           ('hands, keyboard and question card','s3-card','question card typed plain language hands keyboard'),
           ('anonymous hands','s3-hands','hands question card typed plain language keyboard')]),
 's4': dict(beat='revelation', role='mechanism', move='riseWith', family='citation-cards', contract_role='mechanism',
   subject='The one returned answer card and its three citation cards naming source types',
   action='The citation cards fan out of the answer Sources slot and the literature and guidelines cards lift toward camera.',
   emotion='The sources look solid and specific.',
   annotation='Medical literature. Clinical guidelines',
   takeaway='Citation cards fan out of the answer and name medical literature and clinical guidelines.',
   must=[('citation cards fan from answer',['s4-card','s4-answer']),('medical literature clinical guidelines citation cards',['s4-card'])],
   change='Citation cards fan out of the Sources slot, then the literature and guidelines cards lift.',
   change_ids=['s4-card','s4-answer'],
   planes=[('desk surface out of focus','s4-room','desk surface clinic'),
           ('returned answer card','s4-answer','answer citation cards fan from answer sources slot'),
           ('chart and tool out of focus','s4-chart','patient chart openevidence tool'),
           ('citation cards lifting','s4-card','citation cards fan from answer medical literature clinical guidelines')]),
 's5': dict(beat='revelation', role='consequence', move='orbitReveal', family='usage-share', contract_role='consequence',
   subject='The usage share of blank clinician tokens on the wall above the tool, beside the same chart',
   action='Clinician tokens light past the halfway tick and a decision-support tag pins to the share.',
   emotion='The tool is already part of daily clinical work.',
   annotation='More than half. Clinical decision support',
   takeaway='More than half of the clinician tokens light while the same chart stands nearby.',
   must=[('more than half clinicians lit share',['s5-wall']),('clinical decision support tag share',['s5-tag','s5-wall'])],
   change='Tokens light past the halfway tick and the decision support tag pins beside the lit share.',
   change_ids=['s5-wall','s5-tag'],
   planes=[('clinic wall and window','s5-room','clinic wall window'),
           ('usage share of clinician tokens','s5-wall','more than half clinicians lit share half tokens'),
           ('chart and tool','s5-chart','patient chart openevidence tool'),
           ('decision support tag','s5-tag','clinical decision support tag share pinned')]),
 's6': dict(beat='revelation', role='limit', move='dollyThrough', family='unmeasured-tags', contract_role='limit',
   subject="UTMB's own report tag on the share, then two open tags clipped to the returned answer",
   action="A report tag pins to the lit share, then accuracy and patient care tags clip onto the answer and read not in release.",
   emotion='The adoption figure is a self-report and the outcomes are missing.',
   annotation='Not in release',
   takeaway="The share is UTMB's own report and the answer's accuracy and patient care tags read not in release.",
   must=[("UTMB own report tag",['s6-wall']),('accuracy patient care measure not in release tags',['s6-limits','s6-answer'])],
   change='The report tag pins to the share, then two tags clip onto the answer reading not in release.',
   change_ids=['s6-wall','s6-limits','s6-answer'],
   planes=[('clinic wall and window','s6-room','clinic wall window'),
           ('lit usage share','s6-wall',"lit share UTMB own report tag release"),
           ('returned answer card','s6-answer','answer accuracy slot empty sources slot measure'),
           ('limit tags on the answer clip','s6-limits','accuracy patient care measure not in release tags release publishes')]),
 's7': dict(beat='emotion', role='agency', move='truckAcross', family='answer-citation', contract_role='limit',
   subject='The answer card, its Sources slot, one citation card and its empty Accuracy slot',
   action='A thread runs from the answer Sources slot to its citation tab while the Accuracy slot stays empty.',
   emotion='A source line is not the same as a right answer.',
   annotation='Sources. Accuracy',
   takeaway='A thread links the answer to its source, and the answer Accuracy slot stays empty.',
   must=[('citation thread answer source',['s7-card','s7-sources']),('answer accuracy slot stays empty right',['s7-card'])],
   change='The thread reaches the citation tab, then the empty Accuracy ring pulses and stays unmarked.',
   change_ids=['s7-card','s7-sources'],
   planes=[('desk surface out of focus','s7-room','desk surface clinic'),
           ('chart out of focus','s7-chart','patient chart'),
           ('literature citation card','s7-sources','citation thread answer source literature card'),
           ('answer card with slots','s7-card','answer accuracy slot stays empty right citation thread answer source sources slot')]),
 's8': dict(beat='emotion', role='close', move='riseWith', family='chart-flow', contract_role='answer',
   subject='The usage share with its evaluation tag, and the answer held beside the chart with its sources and empty Accuracy slot',
   action='An evaluating use and experience tag pins to the usage share, then the answer holds beside the chart with its empty Accuracy slot.',
   emotion='Sources came back. Whether answers are right is not in the release.',
   annotation='Evaluating use and experience',
   takeaway='UTMB keeps evaluating use and clinician experience while the answer Accuracy slot stays empty.',
   must=[('keep evaluating use clinician experience tag',['s8-tags','s8-wall']),('answer sources chart accuracy empty',['s8-answer','s8-chart'])],
   change='The evaluation tag pins to the share, then the answer holds beside the chart with its sources and its empty Accuracy slot.',
   change_ids=['s8-tags','s8-answer','s8-chart'],
   planes=[('clinic wall and window','s8-room','clinic wall window'),
           ('usage share and evaluation tag','s8-wall','keep evaluating use clinician experience tag usage share'),
           ('patient chart and tool','s8-chart','patient chart answer sources chart'),
           ('evaluation tag on the share','s8-tags','keep evaluating use clinician experience tag pinned share'),
           ('answer held with its slots','s8-answer','answer sources chart accuracy empty slot')]),
}
TRANSITIONS = {
 ('s1','s2'):('same-subject','The same record and the OpenEvidence tool that answered are shown with when the tool was announced and went live.','The chart, the boundary and the docked OpenEvidence tool hold their places as the boundary lights.'),
 ('s2','s3'):('same-subject','After the dated facts, the same record is opened by an ordinary sign-in at its lock.','The same boundary, now with its lock, and the same hands at the keyboard.'),
 ('s3','s4'):('same-subject','The question the hands typed is answered by the same answer card, whose citations now fan out to be read.','The answer card with its filled Sources slot carries into a close reading surface.'),
 ('s4','s5'):('same-subject','The cited answers are used across the clinic, shown as lit clinician tokens on the usage share above the same tool.','The camera rises from the desk to the share above the same OpenEvidence tool and chart.'),
 ('s5','s6'):('same-subject','The lit share is labelled as UTMB own report, then the missing measures attach to the returned answer.','The lit share stays in view as the report tag pins, then the same answer card returns.'),
 ('s6','s7'):('same-subject','The answer with its open tags shows what its citation can and cannot establish.','The same answer card, its clip tags and its Sources slot stay in the close reading.'),
 ('s7','s8'):('same-subject','The unmarked answer returns to the clinic where the evaluation tag pins to the usage share, away from accuracy.','The answer card with its empty Accuracy slot carries back beside the chart.'),
}

def clause_rows():
    return {c[0]: c for c in CLAUSES}

def build(variant):
    planned = json.loads((OUT / 'director-planned' / f'opening-{variant}.json').read_text())
    board = copy.deepcopy(planned)
    current = OUT / f'opening-{variant}.json'
    recorded = json.loads(current.read_text())['story_art'].get('entries', []) if current.exists() else []
    # ---------- repair 1 overlay on the director-planned inputs
    t = 0.0
    for scene in board['scenes']:
        scene['start_s'] = round(t, 3); scene['duration_s'] = scene['duration_authored'] = REPAIR['durations'][scene['id']]
        t += scene['duration_s']
        scene['vo'] = REPAIR['vo'].get(scene['id'], scene['vo'])
        scene['interior'] = True
        for ev in scene['visual_events']:
            ev['what'] = REPAIR['what'].get(ev['id'], ev['what'])
        scene['on_screen'] = scene['what_moves'] = ' '.join(ev['what'] for ev in scene['visual_events'])
    board['runtime_s'] = round(t, 3)
    board['film_direction'].update(REPAIR['film_direction'])
    board['creative_direction'].update(REPAIR['creative_direction'])
    for req in board['story_art']['requests']:
        req.update(copy.deepcopy(STORY_ART_REPAIR[req['id']]))
    board['story_art']['entries'] = recorded
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
                        'closing_state': 'The answer holds beside the chart with its sources in its Sources slot, its Accuracy slot empty and its not-in-release tags, while the evaluation tag hangs on the usage share.',
                        'scene_ids': list(scenes)},
        'turn_scene': 's6',
        'button': 'Sources come back with the answer, and its Accuracy slot stays empty because the release publishes no such measure.'}
    # ---------- quality, cinema, documentary
    board['quality_plan'] = {'contract_sha256': sha(REPO / 'config/quality_contract.json'), 'scenes': [
        {'scene_id': sid, 'medium': 'diagram', 'subject': SCENE[sid]['subject'], 'action': SCENE[sid]['action'],
         'consequence': scenes[sid]['visual_events'][-1]['what'],
         'source_basis': 'Claims ' + ', '.join(scenes[sid]['vo_claims']) + '. ' + LIMIT_SHORT,
         'medium_evidence': 'Registered clinic-answer-v1 with the fresh authored ChartHero and ClinicSupport groups performing board events on the film clock.'}
        for sid in scenes]}
    board['cinema'] = {'version': 'creative-production-v1', 'hero_scene_id': 's6', 'hero_passage_end_scene_id': 's7',
        'dimensional_scene_ids': [],
        'visible_action': "UTMB's own report tag pins to the lit share, two tags clip onto the returned answer reading not in release, then a thread links the answer's Sources slot to its citation while its Accuracy slot stays empty.",
        'human_consequence': 'UTMB clinicians get cited answers inside the record, and the release gives patients and clinicians no published accuracy or care measure.',
        'source_limit': LIMIT_SHORT}
    board['documentary'] = {'schema': 'dispatch_documentary/1',
        'viewer_question': sc['opening_question'],
        'payoff': 'The answer returns with citation cards, and the accuracy and patient care tags stay open.',
        'source_limit': LIMIT_SHORT,
        'hero_image': 'The returned answer with its filled Sources slot, its empty Accuracy slot and two clipped tags reading not in release.',
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
             'intent': 'A soft paper slide follows the question card into the OpenEvidence tool mouth.', 'provenance': 'Original designed paper foley, no recorded clinic audio.'},
            {'id': 'cards-tuck', 'event_id': 's1-event-3', 'role': 'contact', 'duration_s': 0.4,
             'intent': 'A light card tap marks the citation cards tucking into the answer Sources slot.', 'provenance': 'Original designed card foley.'},
            {'id': 'lock-open', 'event_id': 's3-event-1', 'role': 'contact', 'duration_s': 0.3,
             'intent': 'A soft designed latch click marks the health record lock opening after the masked credential.', 'provenance': 'Original designed foley, not a recording of any real system.'},
            {'id': 'limit-quiet', 'event_id': 's6-event-2', 'role': 'quiet', 'duration_s': 1.2, 'gain': 0.3,
             'intent': 'Pull the music back while the accuracy and patient care tags clip onto the answer.', 'provenance': 'Authored event-clock background contrast.'},
        ]}
    # ---------- art direction (executed by clinic-answer-v1)
    hero_ids = sorted({i for s in scenes.values() for e in s['visual_events'] for i in e['item_ids'] if i.endswith(('-chart', '-answer'))})
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
    board['divergence_note'] = ('A stands back on a clinic wall from a higher camera: the chart hangs on a rail behind the desk, the OpenEvidence tool is wall-mounted at its right, '
                                'a key strike sends the question left to right off the chart page into the tool and the answer drops onto the desk; its citations fan left to right. '
                                'B sits at desk height: the chart stands propped beside the tool on the desk, the hands push the card once across the laminate into the tool mouth, '
                                'the answer slides back toward the lens, close and detail framings lead and its citations rise toward camera. '
                                'Both share the same narration, events, authored hero and support groups, one citation set and the same film clock.')
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
        'subject': 'One worn patient chart, one question card, the returned answer with its slots and one citation set' if r['role'] == 'hero'
                   else 'A Gulf Coast clinic room, anonymous hands, keyboard, masked credential, record boundary lock, OpenEvidence tool and usage share',
        'relevance': 'Performs the source-bound question, return, citation and limit actions in both treatments.' if r['role'] == 'hero'
                     else 'Stages the asking hands, sign-in, the OpenEvidence tool at the record edge and the more-than-half share around the same chart.',
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
    (OUT / 'vo_script.txt').write_text('\n'.join(s['vo'] for s in boards['a']['scenes']) + '\n')
    print('completed both treatment boards', boards['a']['runtime_s'])
