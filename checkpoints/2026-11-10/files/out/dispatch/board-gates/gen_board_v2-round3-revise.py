#!/usr/bin/env python3
"""Generate the 2026-11-10 planning boards (storyboard.json, opening-a.json, opening-b.json)."""
import json, math, re, sys, copy, hashlib
from pathlib import Path

REPO = Path('/home/user/dispatch-editions/2026-11-10/TexasAIDispatch')
sys.path.insert(0, str(REPO / 'scripts'))
OUT = REPO / 'out/dispatch'
PACE = 2.9      # words per second, planning estimate
LEAD = 0.45
PAUSE = 0.2

bind = json.loads((OUT / 'vo_bindings.json').read_text())['sentences']
EP = 'note-check-v1'
EDITION = '2026-11-10'
DIR = 'video-engine/src/modern/episodes/2026-11-10/'
HERO = DIR + 'NoteHero.tsx'
SUPPORT = DIR + 'ClinicRecordSupport.tsx'
FILM = DIR + 'NoteCheckFilm.tsx'

# ---- clauses (split only at the script's own punctuation) -------------------------------
CLAUSES = {
 's1': ["In Texas, when documentation is AI-generated,", "who verifies the output?"],
 's2': ["UT Physicians is working toward adopting a unified system,", "Epic's ambient listening platform.", "It follows pilot programs involving DAX and Abridge."],
 's3': ["The technology would eventually be available to physicians,", "with an Epic refresher."],
 's4': ["On October 8th, 2026,", "Abridge announced an enterprise-wide agreement,", "with University of Texas REAL Health AI."],
 's5': ["Abridge says institutions can access Abridge,", "preserving local decision-making."],
 's6': ["Linked Evidence, Abridge says,", "maps documentation to source data.", "Clinicians can then verify the output."],
 's7': ["A Texas Act took effect September 1st, 2025.", "It covers artificial intelligence used for diagnostic purposes."],
 's8': ["One condition is review.", "The practitioner reviews all records,", "created with artificial intelligence,", "under Texas Medical Board standards."],
 's9': ["That law is written around diagnosis.", "The bill doesn't say whether a visit note counts."],
 's10': ["Clinicians can verify the output,", "and the practitioner reviews all records.", "No source here says how well that check works."],
}
LET = 'abcd'
for s in bind:
    assert ' '.join(CLAUSES[s['id']]) == s['text'], s['id']
for sid, cl in CLAUSES.items():
    for c in cl:
        assert len(c) <= 64, (sid, c, len(c))

def toks(t):
    return [re.sub(r'[^a-z0-9]', '', w.lower()) for w in t.split() if re.sub(r'[^a-z0-9]', '', w.lower())]

# ---- scene content ----------------------------------------------------------------------
# subs: ordered (suffix, label). actions and csubs: one entry per clause.
S = {}
S['s1'] = dict(
 noun='room', role='hook', beat='motion', cam=('riseWith', 'dollyThrough'),
 disclosure='Illustration. No real clinic or screen',
 subs=[('room', 'exam room with a padded exam table, a rolling stool and a wall note screen, no people drawn'),
       ('speech', 'ribbon of spoken word marks drifting from the exam table toward the screen'),
       ('note', 'wall note screen showing a blank visit note page'),
       ('draftline', 'first draft line of documentation writing itself onto the note page'),
       ('checkbox', 'empty check box outline beside the draft line'),
       ('record', 'open record tray under the screen, empty')],
 actions=('speech-becomes-draft', 'check-slot-opens'),
 csubs=(['room', 'speech', 'note', 'draftline'], ['note', 'draftline', 'checkbox', 'record']),
 events=[
  ('a', ['room', 'speech'], 'A spoken sentence rises from the exam table as a ribbon of word marks drifting toward the wall note screen.', 'travel', 'location_reveal'),
  ('a', ['speech', 'note', 'draftline'], 'The word ribbon reaches the note screen and a first draft line writes itself onto the page, matching the words.', 'smoothstep', 'mechanism'),
  ('b', ['note', 'draftline', 'checkbox', 'record'], 'An empty check box outlines beside the draft line while the record tray below the screen stays open and empty.', 'contact', 'reveal')],
 claims=['c5', 'c6'], claim_split=(['c5'], ['c5', 'c6']),
 title='Spoken words become a draft line and an empty check box asks who verifies it',
 mute='Spoken words from an exam room turn into a draft line on a note screen, and an empty check box waits beside it.',
 must=[('exam room and note screen', ['room', 'note']), ('documentation draft line from spoken words', ['speech', 'draftline']), ('empty check box and record tray', ['checkbox', 'record'])],
 change=('An empty check box outlines beside the new draft line above an empty record tray.', ['draftline', 'checkbox', 'record']),
 emotion='Plain curiosity as words become text on their own.',
 sound=('environment', 'Soft room tone with a faint keyboard-free tick as the draft line writes.', 'Original designed ambience, not recorded in any clinic.'),
 sentence_subject='An illustrated exam room where a spoken sentence becomes a draft line on a note screen',
)
S['s2'] = dict(
 noun='post', role='movement', beat='revelation', cam=('truckAcross', 'craneDown'),
 disclosure='Illustration. No real page or interface',
 subs=[('post', 'school post card headed UTHealth Houston with its dateline'),
       ('platform', 'dashed outline of one unified ambient listening platform tagged Epic, its inside left empty'),
       ('progress', 'bar that fills a short way and stops at a dashed end marker tagged working toward'),
       ('pilots', 'pilot tags reading DAX and Abridge resting on a past lane')],
 actions=('working-toward-unified', 'epic-platform-named', 'pilots-precede-plan'),
 csubs=(['post', 'platform', 'progress'], ['platform', 'post'], ['pilots', 'platform']),
 events=[
  ('a', ['post'], 'A school post card slides onto the desk beside the note screen, headed UTHealth Houston with its dateline.', 'travel', 'evidence'),
  ('a', ['platform', 'progress'], 'A dashed outline of one unified system draws beside the post card and a progress bar under it fills a short way and stops at a dashed end marker tagged working toward.', 'smoothstep', 'comparison'),
  ('b', ['post', 'platform'], 'The dashed outline takes a tag reading Epic ambient listening while its inside stays empty.', 'smoothstep', 'mechanism'),
  ('c', ['pilots', 'platform'], 'Small pilot tags reading DAX and Abridge settle onto a past lane behind the outline.', 'contact', 'reveal')],
 claims=['c1'], claim_split=(['c1'], ['c1'], ['c1']),
 title='A school post card shows one unified platform still being worked toward after two pilots',
 mute='A dated school post card sits beside a dashed, unfinished platform outline tagged Epic while earlier pilot tags rest behind it.',
 must=[('dated school post card', ['post']), ('dashed unified platform outline', ['platform']), ('two pilot tags', ['pilots'])],
 change=('The progress bar stops at a dashed end marker and the pilot tags settle on the past lane.', ['progress', 'pilots', 'platform']),
 emotion='A steady sense of a plan that is under way and unfinished.',
 sound=('contact', 'A paper slide, then two soft tag taps as the pilots settle.', 'Original designed foley, not recorded at any school.'),
 sentence_subject='A dated school post card beside a dashed unified platform outline and two pilot tags',
)
S['s3'] = dict(
 noun='rollout', role='movement', beat='motion', cam=('dollyThrough', 'riseWith'),
 disclosure='Illustration. No real people or schedule',
 subs=[('rollout', 'row of generic physician outlines that fill from the left while the right end stays dashed'),
       ('nodate', 'blank calendar slot above the row tagged no date stated'),
       ('refresher', 'Epic refresher tag clipped to the front of the row')],
 actions=('rollout-eventually', 'refresher-pairs'),
 csubs=(['rollout', 'nodate'], ['refresher', 'rollout']),
 events=[
  ('a', ['rollout'], 'A row of generic physician outlines fills in from the left one at a time, and the right end stays dashed.', 'smoothstep', 'mechanism'),
  ('a', ['rollout', 'nodate'], 'A calendar slot above the row stays blank under a small tag reading no date stated.', 'smoothstep', 'evidence'),
  ('b', ['refresher', 'rollout'], 'An Epic refresher tag clips onto the front of the row.', 'contact', 'consequence')],
 claims=['c2'], claim_split=(['c2'], ['c2']),
 title='A row of physician outlines fills slowly with no date attached',
 mute='A row of physician outlines fills from the left but never completes, under a blank calendar slot, and a refresher tag clips on.',
 must=[('row of physician outlines', ['rollout']), ('blank calendar slot', ['nodate']), ('refresher tag', ['refresher'])],
 change=('The refresher tag clips onto a row whose right end stays dashed.', ['refresher', 'rollout']),
 emotion='Patience, since the plan has no stated finish.',
 sound=('contact', 'A soft clip as the refresher tag lands.', 'Original designed foley, not recorded anywhere.'),
 sentence_subject='A row of physician outlines that fills in turn, a blank calendar slot and a refresher tag',
)
S['s4'] = dict(
 noun='release', role='consequence', beat='motion', cam=('truckAcross', 'dollyThrough'),
 disclosure='Illustration. No real logo or document',
 subs=[('release', 'Abridge press release card with a header and a date impression'),
       ('date', 'date impression reading October 8th, 2026'),
       ('initiative', 'card for the University of Texas REAL Health AI initiative'),
       ('agreement', 'enterprise-wide agreement tag with a loose thread')],
 actions=('release-dated', 'agreement-announced', 'agreement-reaches-initiative'),
 csubs=(['release', 'date'], ['release', 'agreement'], ['initiative', 'agreement', 'release']),
 events=[
  ('a', ['release', 'date'], 'A press release card drops onto the desk and a date impression lands on its corner.', 'contact', 'evidence'),
  ('b', ['agreement', 'release'], 'An enterprise-wide agreement tag clips onto the release card and trails a loose thread.', 'smoothstep', 'mechanism'),
  ('c', ['initiative', 'release'], 'A second card for the University of Texas REAL Health AI initiative slides in opposite the release card.', 'travel', 'location_reveal'),
  ('c', ['agreement', 'initiative'], 'The loose thread draws across the desk and ties to the initiative card.', 'smoothstep', 'consequence')],
 claims=['c3', 'c8'], claim_split=(['c3'], ['c3'], ['c3', 'c8']),
 title='A dated company release carries an agreement tag that ties to a Texas health AI initiative',
 mute='A dated press release card takes an agreement tag and a thread from it ties to a facing initiative card.',
 must=[('dated press release card', ['release', 'date']), ('agreement tag on the card', ['agreement']), ('initiative card tied by a thread', ['initiative'])],
 change=('The loose thread draws across the desk and ties the agreement tag to the initiative card.', ['agreement', 'initiative', 'release']),
 emotion='Quiet recognition that a second, separate event has arrived.',
 sound=('contact', 'A rubber date stamp thump, then a tag click and a thread whisper.', 'Original designed foley, not recorded at any company.'),
 sentence_subject='A dated press release card, an agreement tag and a University of Texas health AI initiative card',
)
S['s5'] = dict(
 noun='framework', role='mechanism', beat='revelation', cam=('riseWith', 'truckAcross'),
 disclosure='Illustration. No real institutions or switches',
 subs=[('framework', 'wide framework frame across the top labelled framework, with Abridge beneath it'),
       ('access', 'access threads running from the framework to each institution card'),
       ('institutions', 'generic cards labelled UT health institution, one per institution'),
       ('decisions', 'one small decision switch per card resting in a neutral middle position')],
 actions=('framework-grants-access', 'each-decides'),
 csubs=(['framework', 'access', 'institutions'], ['institutions', 'decisions']),
 events=[
  ('a', ['framework'], 'A wide frame labelled framework draws across the top of the screen with Abridge beneath it.', 'smoothstep', 'mechanism'),
  ('a', ['framework', 'access', 'institutions'], 'Generic institution cards each receive an access thread from the framework.', 'travel', 'consequence'),
  ('b', ['institutions', 'decisions'], 'Each institution card lights its own small decision switch and leaves it resting in a neutral middle position.', 'contact', 'reveal')],
 claims=['c4'], claim_split=(['c4'], ['c4']),
 title='One framework offers access and each institution card keeps its own switch',
 mute='A framework frame sends access threads to institution cards and each card lights its own undecided switch.',
 must=[('framework frame', ['framework']), ('institution cards with access threads', ['institutions', 'access']), ('one decision switch per card', ['decisions'])],
 change=('Each institution card lights its own decision switch in a neutral middle position.', ['institutions', 'decisions']),
 emotion='Even, shared footing across separate places.',
 sound=('contact', 'Small switch clicks, one per card.', 'Original designed foley, not a recorded interface.'),
 sentence_subject='A framework frame with access threads to institution cards that each hold a switch',
)
S['s6'] = dict(
 noun='link', role='mechanism', beat='revelation', cam=('dollyThrough', 'orbitReveal'),
 disclosure='Illustration. Vendor design, not a real screen',
 subs=[('note', 'wall note screen with one draft line and corner tags reading Linked Evidence and Abridge says'),
       ('draftline', 'draft line on the note screen'),
       ('source', 'strip of source words beside the screen'),
       ('links', 'thread drawn from the draft line back to the matching source words'),
       ('verify', 'outlined check mark hovering over the linked line, not yet placed')],
 actions=('vendor-names-linked-evidence', 'draft-links-to-source', 'clinician-can-verify'),
 csubs=(['note', 'draftline', 'source'], ['draftline', 'source', 'links'], ['draftline', 'verify', 'links']),
 events=[
  ('a', ['note', 'draftline', 'source'], 'A draft line on the note screen and a strip of source words appear side by side, with Linked Evidence and Abridge says tags in the screen corner.', 'smoothstep', 'evidence'),
  ('b', ['draftline', 'links', 'source'], 'A thread draws from the draft line back to the matching source words.', 'travel', 'mechanism'),
  ('c', ['draftline', 'verify', 'links'], 'An outlined check mark hovers over the linked line, ready but not yet placed.', 'smoothstep', 'consequence')],
 claims=['c5'], claim_split=(['c5'], ['c5'], ['c5']),
 title='A draft line is threaded back to the words it came from',
 mute='A draft line on the note screen draws a thread back to its source words and an unplaced check mark hovers over it.',
 must=[('draft line on the note screen', ['draftline', 'note']), ('thread back to source words', ['links', 'source']), ('unplaced check mark', ['verify'])],
 change=('An outlined check mark hovers over the linked draft line.', ['verify', 'draftline', 'links']),
 emotion='A clear, followable trail with the final step left open.',
 sound=('contact', 'A thread whisper, then a soft hover tone as the check mark outlines.', 'Original designed foley, not a recorded interface.'),
 sentence_subject='A draft line threaded back to source words with an unplaced check mark over it',
)
S['s7'] = dict(
 noun='bill', role='limit', beat='motion', cam=('truckAcross', 'riseWith'),
 disclosure='Illustration. No real seal or page',
 subs=[('bill', 'enrolled bill card headed with a generic bill title and no seal'),
       ('effective', 'effective date stamp reading September 1st, 2025'),
       ('diagnosis', 'diagnosis tag lit on the bill card'),
       ('aitag', 'generic AI tag drawn beside the diagnosis tag')],
 actions=('act-takes-effect', 'act-covers-ai-diagnosis'),
 csubs=(['bill', 'effective'], ['bill', 'diagnosis', 'aitag']),
 events=[
  ('a', ['bill', 'effective'], 'An enrolled bill card settles on the desk and an effective date stamp lands crooked on its corner.', 'contact', 'evidence'),
  ('b', ['bill', 'diagnosis'], 'A diagnosis tag lights on the bill card.', 'smoothstep', 'mechanism'),
  ('b', ['diagnosis', 'aitag'], 'A generic AI tag slides in beside the diagnosis tag and a thin frame draws round both.', 'smoothstep', 'evidence')],
 claims=['c6', 'c7'], claim_split=(['c7'], ['c6']),
 title='A dated bill covers AI used for diagnosis',
 mute='An enrolled bill card takes an effective date stamp, then a diagnosis tag and an AI tag light inside one frame.',
 must=[('bill card with effective date', ['bill', 'effective']), ('diagnosis tag', ['diagnosis']), ('AI tag beside it', ['aitag'])],
 change=('An AI tag slides in beside the diagnosis tag and a frame draws round both.', ['diagnosis', 'aitag']),
 emotion='Formal weight as a rule enters the room.',
 sound=('contact', 'A rubber stamp thump, then two soft tag clicks.', 'Original designed foley, not recorded at any legislature.'),
 sentence_subject='A bill card with an effective date stamp, a diagnosis tag and an AI tag',
)
S['s8'] = dict(
 noun='review', role='agency', beat='motion', cam=('dollyThrough', 'truckAcross'),
 disclosure='Illustration. No real person or seal',
 subs=[('bill', 'bill card with a short list of conditions drawn as plain gray lines'),
       ('condition', 'one condition line highlighted and labelled review'),
       ('practitioner', 'generic practitioner outline with no face resting a hand on a stack of cards'),
       ('records', 'stack of record cards each marked AI'),
       ('standards', 'standards tag reading Texas Medical Board standards')],
 actions=('condition-is-review', 'practitioner-reviews-records', 'records-made-with-ai', 'standards-tag-clips'),
 csubs=(['bill', 'condition'], ['practitioner', 'records'], ['records'], ['standards', 'condition']),
 events=[
  ('a', ['bill', 'condition'], 'One condition line on the bill card highlights and takes a label reading review.', 'smoothstep', 'evidence'),
  ('b', ['practitioner', 'records'], 'A generic practitioner outline slides up to a stack of record cards and rests a hand on the top card.', 'travel', 'mechanism'),
  ('c', ['records'], 'Each record card in the stack takes a small AI mark.', 'contact', 'evidence'),
  ('d', ['standards', 'condition'], 'A standards tag reading Texas Medical Board standards clips beside the highlighted condition line.', 'contact', 'consequence')],
 claims=['c6'], claim_split=(['c6'], ['c6'], ['c6'], ['c6']),
 title='One condition is review of every AI record by the practitioner under board standards',
 mute='A bill card highlights a review condition, a practitioner outline rests a hand on a stack of AI-marked record cards and a standards tag clips on.',
 must=[('highlighted review condition', ['bill', 'condition']), ('practitioner with stack of AI-marked records', ['practitioner', 'records']), ('standards tag', ['standards'])],
 change=('A standards tag clips beside the highlighted review condition.', ['standards', 'condition']),
 emotion='Formal, careful attention to every record.',
 sound=('contact', 'A soft highlighter squeak, a paper settle and a tag click.', 'Original designed foley, not recorded anywhere.'),
 sentence_subject='A bill card with a review condition, a practitioner outline over AI-marked records and a standards tag',
)
S['s9'] = dict(
 noun='scope', role='limit', beat='emotion', cam=('riseWith', 'dollyThrough'),
 disclosure='Illustration. No real page or seal',
 subs=[('bill', 'bill card with the word diagnosis highlighted inside a drawn frame'),
       ('diagnosis', 'diagnosis frame drawn round the highlighted word'),
       ('visitnote', 'visit note card carrying one draft line'),
       ('question', 'question mark tag rising at the edge of the diagnosis frame')],
 actions=('law-written-around-diagnosis', 'note-unaddressed'),
 csubs=(['bill', 'diagnosis'], ['visitnote', 'bill', 'question', 'diagnosis']),
 events=[
  ('a', ['bill', 'diagnosis'], 'The word diagnosis on the bill card highlights and a frame draws round it.', 'smoothstep', 'evidence'),
  ('b', ['visitnote', 'bill'], 'A visit note card slides toward the diagnosis frame and stops at its edge.', 'travel', 'comparison'),
  ('b', ['visitnote', 'question', 'diagnosis'], 'A question mark tag rises over the edge, with a dashed line where the frame meets the visit note card.', 'smoothstep', 'reveal')],
 claims=['c6'], claim_split=(['c6'], ['c6']),
 title='The law frames diagnosis and the visit note stops at its edge with a question',
 mute='A bill card highlights the word diagnosis inside a frame, a visit note card slides up to the frame edge and a question mark rises.',
 must=[('diagnosis frame on the bill', ['bill', 'diagnosis']), ('visit note card', ['visitnote']), ('question mark at the frame edge', ['question'])],
 change=('A question mark rises where the visit note card meets the diagnosis frame.', ['question', 'visitnote', 'diagnosis']),
 emotion='Honest uncertainty at the edge of the rule.',
 sound=('quiet', 'The music bed drops away so the question mark rises over room tone and a soft slide.', 'Original designed foley, not recorded anywhere.'),
 sentence_subject='A bill card with a diagnosis frame, a visit note card at its edge and a question mark',
)
S['s10'] = dict(
 noun='answer', role='close', beat='revelation', cam=('craneDown', 'riseWith'),
 disclosure='Illustration. No real person or product',
 subs=[('design', 'vendor design card with a thread bending toward the check slot'),
       ('statute', 'statute card with a thread bending toward the check slot'),
       ('check', 'clinician check mark and its slot on the draft line'),
       ('note', 'draft note on the screen moving into the record tray'),
       ('howwell', 'empty field labelled how well the check works, stamped not published'),
       ('sources', 'the source cards stacked at the screen edge')],
 actions=('clinician-verifies-output', 'practitioner-reviews-records', 'how-well-unstated'),
 csubs=(['design', 'check', 'note'], ['statute', 'check', 'note'], ['howwell', 'check', 'sources']),
 events=[
  ('a', ['design', 'check'], 'A thread from the vendor design card bends toward the check slot on the draft line.', 'travel', 'comparison'),
  ('b', ['statute', 'check', 'note'], 'A thread from the statute card joins it, a clinician check mark lands in the slot and the draft note moves into the record tray.', 'contact', 'resolution'),
  ('c', ['howwell'], 'A field labelled how well the check works appears beside the check mark and takes a not published stamp.', 'contact', 'evidence'),
  ('c', ['howwell', 'check', 'sources'], 'The source cards settle at the screen edge while the check mark and the stamped empty field hold together.', 'smoothstep', 'resolution')],
 claims=['c5', 'c6'], claim_split=(['c5'], ['c6'], ['c5', 'c6']),
 title='Both the design and the rule point the check at the clinician and its quality is blank',
 mute='Two threads bend to a check slot, a check mark lands and the note enters the record, while a how well field stays stamped not published.',
 must=[('design and statute threads to the check slot', ['design', 'statute']), ('check mark and note entering the record', ['check', 'note']), ('empty how well field', ['howwell'])],
 change=('The check mark lands and the how well field takes a not published stamp.', ['check', 'note', 'howwell']),
 emotion='Level, unhurried closure with the open question left in plain sight.',
 sound=('contact', 'A soft click as the check lands, then a single low stamp thump.', 'Original designed foley, not recorded anywhere.'),
 sentence_subject='A check mark landing in the slot on the draft note beside an empty how well field',
)
SIDS = [f's{i}' for i in range(1, 11)]

# ---- timing -----------------------------------------------------------------------------
def build_clock():
    t = 0.0
    scenes = {}
    clauses = []
    cursor_words = 0
    for n, sid in enumerate(SIDS):
        start = t
        lead = LEAD if n == 0 else 0.0
        cur = start + lead
        rows = []
        for j, text in enumerate(CLAUSES[sid]):
            w = len(toks(text))
            d = round(w / PACE, 2)
            rows.append(dict(id=f'n{sid[1:]}{LET[j]}', text=text, start=round(cur, 2), end=round(cur + d, 2), words=w, wr=[cursor_words, cursor_words + w]))
            cursor_words += w
            cur += d
        end = round(cur + (PAUSE if n < 9 else 0.3), 2)
        scenes[sid] = dict(start=round(start, 2), dur=round(end - start, 2), rows=rows)
        t = end
    return scenes, round(t, 2)

CLOCK, RUNTIME = build_clock()

# ---- events -----------------------------------------------------------------------------
def build_events(sid):
    sc, c = CLOCK[sid], S[sid]
    rows = {r['id'][-1]: r for r in sc['rows']}
    per = {l: [e for e in c['events'] if e[0] == l] for l in LET}
    out = []
    n = 0
    for letter in LET[:len(CLAUSES[sid])]:
        r = rows[letter]
        d = r['end'] - r['start']
        k = len(per[letter])
        for j, (_, subs, what, curve, ctype) in enumerate(per[letter]):
            n += 1
            span = d / k
            dur = round(min(1.1, max(0.5, span * 0.7)), 2)
            if sid == 's1' and j == 0 and letter == 'a':
                dur = 0.9
            if letter == 'a' and sid == 's1' and j == 0:
                at = r['start'] + 0.05
            else:
                at = r['start'] + j * span + span * 0.15
            at = min(at, r['end'] - dur)
            fs = (at - r['start']) / d
            fe = (at + dur - r['start']) / d
            out.append(dict(id=f'{sid}-event-{n}', narration_id=r['id'], items=[f'{sid}-{x}' for x in subs], what=what, curve=curve, ctype=ctype,
                            abs_at=at, dur=dur, fs=round(fs, 6), fe=round(fe, 6)))
    return out

EVENTS = {sid: build_events(sid) for sid in SIDS}

# ---- views ------------------------------------------------------------------------------
FRAMES = ['wide', 'medium', 'close', 'detail', 'check', 'split']
FRAMING = {'wide': 'wide', 'medium': 'medium', 'close': 'close', 'detail': 'detail', 'check': 'close', 'split': 'split'}
WALL = ['bill-detail', 'scope-detail']
WASH = [f'{S[s]["noun"]}-split' for s in SIDS]

def view(sid, f):
    return f'{S[sid]["noun"]}-{f}'

A_CYCLE = {'s1': ['wide', 'medium', 'close', 'detail'], 'default': ['wide', 'medium', 'close', 'detail']}
B_CYCLE = ['check', 'split', 'medium', 'detail', 'close']

def pick_a(sid, i, n):
    base = ['wide', 'medium', 'close', 'detail']
    off = SIDS.index(sid) % 2
    seq = base[off:] + base[:off] if i == 0 else None
    return None

def shots_for(treatment):
    plan = []
    shotn = {}
    for si, sid in enumerate(SIDS):
        sc = CLOCK[sid]
        rows = sc['rows']
        # boundaries
        bounds = [sc['start']]
        for a, b in zip(rows, rows[1:]):
            bounds.append(round((a['end'] + b['start']) / 2, 2))
        bounds.append(round(sc['start'] + sc['dur'], 2))
        seq = []
        for ci, row in enumerate(rows):
            lo, hi = bounds[ci], bounds[ci + 1]
            k = max(1, math.ceil((hi - lo) / 4.3))
            for j in range(k):
                a = lo + (hi - lo) * j / k
                b = lo + (hi - lo) * (j + 1) / k
                seq.append((row['id'], a, b))
        # assign views
        total = len(seq)
        if treatment == 'a':
            wide_first = ['wide', 'medium', 'close', 'detail', 'medium', 'close']
            rot = si % 3
            cyc = ['medium', 'wide', 'close', 'detail', 'medium', 'close'] if rot == 1 else (['wide', 'close', 'medium', 'detail', 'close', 'medium'] if rot == 2 else wide_first)
            names = cyc[:total]
            trans = ['cut'] + [('match' if x % 2 == 0 else 'continuous') for x in range(1, total)]
        else:
            cyc = ['check', 'medium', 'split', 'detail', 'close', 'medium']
            if sid in ('s4', 's8', 's9', 's10'):
                cyc = ['check', 'split', 'detail', 'medium', 'close', 'split']
            names = cyc[:total]
            trans = ['cut'] + [('occlusion' if x % 2 == 1 else 'match') for x in range(1, total)]
        evs = EVENTS[sid]
        for idx, (cid, a, b) in enumerate(seq):
            # event overlapping most
            best = max(evs, key=lambda e: max(0, min(b, e['abs_at'] + e['dur']) - max(a, e['abs_at'])))
            ov = min(b, best['abs_at'] + best['dur']) - max(a, best['abs_at'])
            assert ov > 0.02, (treatment, sid, idx, a, b)
            shotn[sid] = shotn.get(sid, 0) + 1
            f = names[idx]
            plan.append(dict(id=f'{sid}-shot-{shotn[sid]}', scene_id=sid, start_s=round(a, 4), duration_s=round(b - a, 4),
                             framing=FRAMING[f], transition=trans[idx], view=view(sid, f), event_id=best['id'], narration_ids=[cid], frame=f))
    for eid, f in FORCED.items():
        sid = eid.split('-')[0]
        ev = next(e for e in EVENTS[sid] if e['id'] == eid)
        cand = [x for x in plan if x['scene_id'] == sid]
        sh = max(cand, key=lambda x: max(0, min(x['start_s'] + x['duration_s'], ev['abs_at'] + ev['dur']) - max(x['start_s'], ev['abs_at'])))
        assert min(sh['start_s'] + sh['duration_s'], ev['abs_at'] + ev['dur']) - max(sh['start_s'], ev['abs_at']) > 0.02, eid
        sh['event_id'] = eid
        sh['frame'] = f
        sh['framing'] = FRAMING[f]
        sh['view'] = view(sid, f)
    return plan

FORCED = {'s1-event-2': 'medium', 's6-event-2': 'close', 's10-event-2': 'close',
          's2-event-2': 'medium', 's5-event-2': 'wide', 's9-event-1': 'medium'}

def wall_share(plan):
    wall = sum(1 for s in plan if s['view'] in WALL)
    return wall / len(plan)

# ---- planes -----------------------------------------------------------------------------
def planes(sid, treatment):
    c = S[sid]
    subs = [(f'{sid}-{k}', l) for k, l in c['subs']]
    groups = [subs[i::3] for i in range(3)] if treatment == 'a' else [subs[i:i + 2] for i in range(0, len(subs), 2)]
    groups = [g for g in groups if g]
    if treatment == 'b':
        groups = list(reversed(groups))
    zs = [700, 500, 300, 200]
    out = [dict(z=900, label='exam room window with Houston showing outside, soft humid daylight',
                items=[dict(id=f'{sid}-window', kind='applicationRecord', x=540, y=900, scale=1,
                            props=dict(label='exam room window with Houston showing outside, soft humid daylight'))])]
    for z, g in zip(zs, groups):
        label = '; '.join(l for _, l in g) if len(g) == 1 else ' and '.join(l.split(',')[0] for _, l in g)
        out.append(dict(z=z, label=label[:140], items=[dict(id=i, kind='applicationRecord', x=540, y=900, scale=1, props=dict(label=l)) for i, l in g]))
    out.append(dict(z=100, label='worn laminate desk edge with a scuffed corner and a leaning cable organizer',
                    items=[dict(id=f'{sid}-desk', kind='applicationRecord', x=540, y=900, scale=1,
                                props=dict(label='worn laminate desk edge with a scuffed corner and a leaning cable organizer'))]))
    return out

# ---- board assembly ---------------------------------------------------------------------
def scene_rows(treatment):
    rows = []
    for si, sid in enumerate(SIDS):
        c, sc = S[sid], CLOCK[sid]
        evs = EVENTS[sid]
        events = []
        for e in evs:
            events.append(dict(
                id=e['id'], at_s_authored=round(e['abs_at'] - sc['start'], 4), duration_s_authored=e['dur'], item_ids=e['items'],
                what=e['what'], motion=dict(curve=e['curve'], anticipation=0.0, settle=0.03), narration_id=e['narration_id'],
                clause_fraction_start=e['fs'], clause_fraction_end=e['fe'],
                at_s=round(e['abs_at'] - sc['start'], 4), duration_s=e['dur']))
        moves = ' '.join(e['what'] for e in evs)
        cam = c['cam'][0 if treatment == 'a' else 1]
        row = dict(
            id=sid, start_s=sc['start'], duration_s=sc['dur'], duration_authored=sc['dur'],
            county='Harris', region='gulf', interior=True, cast=[], beat=c['beat'], story_role=c['role'],
            vo=' '.join(CLAUSES[sid]), vo_claims=next(s for s in bind if s['id'] == sid)['claim_ids'],
            super='', caption='', on_screen=moves, what_moves=moves, production_disclosure=c['disclosure'],
            visual_events=events, camera_strategy=cam, visual_family=f'note-{sid}-{treatment}', payload_mode='picture',
            treatment=treatment, hero='draft visit note on a wall note screen', place_plate='gulf-houston',
            visual_sentence=dict(subject=c['sentence_subject'], action=moves, emotion=c['emotion'], annotation=c['disclosure']),
            planes=planes(sid, treatment),
            visual_proof=dict(mute_takeaway=c['mute'],
                              must_show=[dict(concept=k, item_ids=[f'{sid}-{x}' for x in v]) for k, v in c['must']],
                              change=dict(description=c['change'][0], item_ids=[f'{sid}-{x}' for x in c['change'][1]])),
            hook_strategy='visual_anomaly', hook_payoff_s=0.9)
        rows.append(row)
    return rows

def clause_rows():
    out = []
    ci = 0
    for sid in SIDS:
        c = S[sid]
        for j, r in enumerate(CLOCK[sid]['rows']):
            ci += 1
            letter = LET[j]
            evids = [e['id'] for e in EVENTS[sid] if e['narration_id'] == r['id']]
            out.append(dict(id=r['id'], text=r['text'], cue_ids=[f'c{ci}'], scene_id=sid,
                            subject_ids=[f'{sid}-{x}' for x in c['csubs'][j]], action_id=c['actions'][j],
                            claim_ids=c['claim_split'][j], event_ids=evids, start_s=r['start'], end_s=r['end'], word_range=r['wr']))
    return out

def captions():
    out = []
    ci = 0
    for sid in SIDS:
        for r in CLOCK[sid]['rows']:
            ci += 1
            out.append(dict(id=f'c{ci}', start=r['start'], end=r['end'], text=r['text'], source='authored_estimate', start_measured=False, end_measured=False))
    return out

def rewards(plan, treatment):
    out = []
    for sid in SIDS:
        sc = CLOCK[sid]
        for e in EVENTS[sid]:
            frac = 0.5
            t = e['abs_at'] + e['dur'] * frac
            shot = next(s for s in plan if s['scene_id'] == sid and s['start_s'] - 1e-6 <= t <= s['start_s'] + s['duration_s'] + 1e-6)
            kind = {'mechanism': 'action', 'location_reveal': 'reveal', 'evidence': 'evidence', 'comparison': 'comparison',
                    'consequence': 'consequence', 'reveal': 'reveal', 'resolution': 'consequence'}[e['ctype']]
            out.append(dict(shot_id=shot['id'], event_id=e['id'], at_s=round(t, 4), kind=kind, visible_change=e['what'], event_fraction=frac))
    return out

def film_direction(treatment):
    plan = shots_for(treatment)
    # fractional anchors
    for s in plan:
        sc = CLOCK[s['scene_id']]
        s['scene_fraction_start'] = (s['start_s'] - sc['start']) / sc['dur']
        s['scene_fraction_end'] = (s['start_s'] + s['duration_s'] - sc['start']) / sc['dur']
        sid = s['scene_id']
        ev = next(e for e in EVENTS[sid] if e['id'] == s['event_id'])
        s['purpose'] = ev['what']
        s['carry'] = 'The one draft visit note and its note screen, carried through the same exam room.' if treatment == 'a' else 'The empty check slot on the note screen, carried as the fixed point of each scene.'
        s.pop('frame')
    ordered = []
    for s in plan:
        ordered.append({k: s[k] for k in ['id', 'scene_id', 'start_s', 'duration_s', 'framing', 'transition', 'view', 'event_id', 'purpose', 'carry', 'narration_ids', 'scene_fraction_start', 'scene_fraction_end']})
    if treatment == 'a':
        angle = ('Follow one draft visit note through a single exam room. The camera starts wide on the room, comes in on the note screen and stays with the same screen as each source card and rule arrives beside it, so the viewer sees the draft before the record that surrounds it.')
        promise = 'Watch spoken words become a draft line on a note screen, then see who the record says should check it.'
        turn = 'A thread links the draft line back to its source words and an outlined check mark hovers over it, so a person is the one who verifies.'
        closing = 'The design and the rule both point the check at the clinician, shown as a check mark landing on the draft note beside a blank how well field.'
    else:
        angle = ('Stay on the empty check slot. Every scene opens close on that slot on the note screen, then widens to the evidence card that surrounds it, so the viewer keeps one open question in view while the school post, the agreement and the law arrive. Comparisons use split framing.')
        promise = 'Watch an empty check slot appear beside a new draft line and keep asking who fills it.'
        turn = 'Two threads from the vendor design and the statute bend to the same check slot, and a clinician check mark lands in it.'
        closing = 'The check slot is filled by the clinician and the field for how well it works stays stamped not published.'
    return dict(version='directed-film-v2', episode=EP, variant=treatment, angle=angle, opening_promise=promise,
                performed_turn=turn, closing_answer=closing, shots=ordered, rewards=rewards(plan, treatment), renderer_inputs=[]), plan

def edits(treatment):
    out = []
    for i, sid in enumerate(SIDS):
        c = S[sid]
        evs = EVENTS[sid]
        nxt = S[SIDS[i + 1]] if i + 1 < len(SIDS) else None
        if treatment == 'a':
            enter = evs[0]['what']
            leave = evs[-1]['what']
            nc = (f'The same note screen stays in frame as {nxt["sentence_subject"]} arrives.' if nxt else 'The closing note screen holds with the check mark placed and the how well field stamped.')
        else:
            enter = 'Close on the empty check slot on the note screen, then widen to ' + c['sentence_subject'].lower() + '.'
            leave = evs[-1]['what']
            nc = (f'The check slot stays at the edge of frame as {nxt["sentence_subject"]} arrives.' if nxt else 'The check slot holds filled beside the stamped empty field.')
        row = dict(scene_id=sid, enter_on=enter, leave_on=leave, cut_after_event_id=evs[-1]['id'], next_connection=nc,
                   sentence_to_shot=dict(clause=' '.join(CLAUSES[sid]), subject=c['sentence_subject'],
                                         relationship=' '.join(e['what'] for e in evs),
                                         source_limit='Disclosed illustration of the sources. It shows no real clinic, clinician, patient, software interface or brand mark.'))
        out.append(row)
    return out

def story_contract():
    roles = {'s1': 'action', 's2': 'evidence', 's3': 'evidence', 's4': 'evidence', 's5': 'mechanism', 's6': 'mechanism',
             's7': 'evidence', 's8': 'consequence', 's9': 'limit', 's10': 'answer'}
    rows = []
    for sid in SIDS:
        c = S[sid]
        rows.append(dict(scene_id=sid, role=roles[sid], claim_ids=next(s for s in bind if s['id'] == sid)['claim_ids'],
                         advances=c['title'] + '. ' + ' '.join(e['what'] for e in EVENTS[sid])))
    kinds = {('s1', 's2'): ('causal-consequence', 'The question about who verifies the draft leads to the school plan for the platform that would draft it.', 'The question tag fades as the note screen slides aside and the school post card arrives.'),
             ('s2', 's3'): ('same-subject', 'The unified platform plan leads to who is meant to get it.', 'The dashed platform outline stays while a row of physician outlines draws under it.'),
             ('s3', 's4'): ('causal-consequence', 'The unfinished school plan sits beside a separate company announcement.', 'The row of outlines slides back and a press release card drops onto the desk.'),
             ('s4', 's5'): ('same-subject', 'The agreement tied to the initiative leads to what it lets institutions do.', 'The agreement tag becomes the top of a framework frame.'),
             ('s5', 's6'): ('causal-consequence', 'Access to the vendor tool leads to how the tool presents its draft.', 'The framework frame retreats and the note screen returns with a draft line.'),
             ('s6', 's7'): ('causal-consequence', 'The unplaced check mark leads to a law that covers AI used for diagnosis.', 'The outlined check mark stays while the bill card lands beside the note screen.'),
             ('s7', 's8'): ('same-subject', 'The bill card that covers AI diagnosis leads to its review condition.', 'The same bill card lifts one condition line toward a practitioner outline.'),
             ('s8', 's9'): ('causal-consequence', 'The review condition leads to what the law is written around and what it leaves open.', 'The standards tag stays while the bill card frames the word diagnosis.'),
             ('s9', 's10'): ('causal-consequence', 'The question about the visit note leads to the closing picture of who is pointed at.', 'The question mark slides down while threads bend toward the check slot on the note screen.')}
    trans = []
    for (a, b), (k, because, bridge) in kinds.items():
        trans.append(dict(**{'from': a, 'to': b}, kind=k, because=because, visible_bridge=bridge))
    return dict(
        opening_question="In Texas, when documentation is AI-generated, who verifies the output?",
        actor='UT Physicians, Abridge, University of Texas REAL Health AI and the Texas Act that took effect September 1st, 2025.',
        action="UT Physicians is working toward Epic's ambient listening platform, Abridge announced an agreement with University of Texas REAL Health AI and the Texas Act conditions AI diagnostic use on review of AI records.",
        change='Visit notes at UT health institutions can be drafted by AI from the conversation for a clinician to verify.',
        affected_people='Physicians who review the drafts and the patients whose visits are the source. No person is named or drawn.',
        consequence='A clinician is expected to review a draft note that software wrote from the visit.',
        source_limit="The Abridge claims are the vendor's own. The school page gives no date, accuracy or time figure. The bill is written around diagnosis and doesn't say whether a visit note counts.",
        closing_answer="The vendor's design and the statute's review condition both point the check at the clinician, and none of these sources says how well that check works.",
        director_identity='claude-sonnet-5-5 director, this session', scenes=rows, transitions=trans)

def quality_plan():
    import quality_contract
    rows = []
    for sid in SIDS:
        c = S[sid]
        evs = EVENTS[sid]
        rows.append(dict(scene_id=sid, medium='diagram', subject=c['sentence_subject'], action=evs[0]['what'], consequence=c['change'][0],
                         source_basis='Claims ' + ', '.join(next(s for s in bind if s['id'] == sid)['claim_ids']) + '. Disclosed illustration of the sources. It shows no real clinic, clinician, patient, interface or brand mark.',
                         medium_evidence='Registered ' + EP + ' with the fresh authored NoteHero and ClinicRecordSupport groups performing board events on the film clock.'))
    return dict(contract_sha256=quality_contract.fingerprint(), scenes=rows)

def attention():
    out = []
    prev = None
    for sid in SIDS:
        for e in EVENTS[sid]:
            out.append(dict(id=e['id'] + '-attention', event_id=e['id'], item_ids=e['items'], change_type=e['ctype'],
                            visible_change=e['what'], viewer_reward=e['what'],
                            continuity_from='The one draft visit note and note screen that every scene returns to.' if prev is None else f'The previous beat, {prev}',
                            sound_action=S[sid]['sound'][1]))
            prev = e['what'][:80].rstrip('.,') + '.'
    return out

def sound(treatment):
    cues = []
    for sid in SIDS:
        role, intent, prov = S[sid]['sound']
        ev = EVENTS[sid][1 if len(EVENTS[sid]) > 1 else 0]
        cue = dict(id=f'cue-{sid}', role=role, duration_s=1.0, intent=intent, provenance=prov, event_id=ev['id'])
        if role == 'quiet':
            cue['gain'] = 0.3
        cues.append(cue)
    return dict(perspective='Designed illustration sound for an exam room, paper cards and a wall screen. Never recorded in a real clinic.',
                music_arc='A soft low bed under the room, lightening for the school and company cards, held under the law, dropping away at the empty fields and returning softly for the close.',
                voice_arc='Plain and even at the question, steady through the sources, and slower and level on the last two sentences.', cues=cues)

def creative_direction(treatment):
    import creative_production
    return dict(
        viewer_question="In Texas, when documentation is AI-generated, who verifies the output?",
        visible_answer="The vendor's design and the statute's review condition point the check at the clinician, shown as a check mark landing on the draft beside a field for how well it works that stays stamped not published.",
        emotional_turn='Plain curiosity at the exam room, steady attention through the sources, a quiet doubt at the question mark on the visit note and an even answer at the check slot.',
        medium_choice='News report / Evidence-led imagery, mechanism-led ordering. No inspected photograph or footage of a Texas exam room or the products exists in the sources, so original authored illustration performs the input, transformation, check and limit. A static page excerpt would show the sentences but hide the draft line, the thread back to source words and the check slot they describe.',
        sound=sound(treatment), edits=edits(treatment),
        policy_sha256=creative_production.digest(creative_production.POLICY))

def art_direction(treatment, plan):
    shots = {}
    flat = {}
    for sid in SIDS:
        flat[sid] = dict(scale=1, x=0, y=0, reason='Hold the authored composition. The episode camera moves only with the performing card, thread or mark while the window region stays still behind the room.')
    return dict(
        version='directed-world-v1',
        palette=dict(background='#C8D5D1', midground='#8CA7A3', foreground='#3A5256', ink='#1B2A2E', paper='#F3ECDD', hero='#FBF7EA', accent='#E07B2E'),
        palette_reason='Humid Gulf daylight gives a soft gray green wall, a deeper teal midground carries the desk and cards, warm paper carries every record, the pale hero note screen is the one clean value and a single burnt orange is kept for the empty check slot, the stamps and the question mark.',
        shape_language='Soft rounded note screen and cards against the square exam room window, a long straight desk edge and thin curved threads. Nothing is symmetric. The stool leans, a card corner is dog-eared, a stamp lands crooked and the dashed outlines never close evenly.',
        lighting=dict(motivation='Soft shadowless humid daylight from the exam room window on the upper left, a cooler screen glow on the paper cards and a small warm lamp bounce on the desk, so every card throws a short soft shadow to the lower right.',
                      ambient=0.9, exposure=1.0,
                      key=dict(position=[-6, 4, 6], color='#FFF1DA', intensity=1.6),
                      fill=dict(position=[5, 2, 5], color='#CFE0E4', intensity=0.9),
                      rim=dict(position=[2, 5, -3], color='#FFF7E6', intensity=0.5)),
        hero=dict(asset=HERO,
                  silhouette='A wall note screen with a rounded bezel and a pale paper note page, a ribbon of word marks arriving on its left, one draft line on the page, an empty check slot beside the line and an open record tray beneath it.',
                  finish='Lit upper-left bezel with a soft highlight, a cool inner glow on the page, a hairline draft line with a hand-set cursor, a crooked check slot outline in burnt orange, a worn tray with a bent corner and a soft contact shadow on the wall and desk.',
                  subject_ids=['s1-note', 's1-draftline', 's6-note', 's6-draftline', 's10-check', 's10-note']),
        focal_hierarchy='The draft line and its check slot first, the card or rule that is arriving second, the source threads and stamps third, the desk and exam room fourth and the Houston window last.',
        motion_language='Cards slide and settle without bounce, threads draw at an even speed, stamps and marks land once and stay, switches click once, the ribbon of words travels with continuous acceleration and the camera holds while objects perform.',
        shots=shots,
        signature_shot=dict(scene_id='s10', event_id=EVENTS['s10'][1]['id'], reason='The clinician check mark lands in the slot on the draft line and the note moves into the record, the whole answer in one movement.'),
        flat_shots=flat)

def story_art():
    sceneids = SIDS
    def au(sid, idx, view):
        e = EVENTS[sid][idx]
        j = LET.index(e['narration_id'][-1])
        assert {x[len(sid) + 1:] for x in e['items']} <= set(S[sid]['csubs'][j]), (sid, idx)
        return dict(scene_id=sid, event_id=e['id'], view=view, action_id=S[sid]['actions'][j], subject_ids=list(e['items']))
    return dict(
        version='authored-story-art-v1', runtime='claude-sonnet-v1', edition_id=EDITION,
        requests=[
            dict(id='note-hero', role='hero', file=HERO, export='NoteHero', scene_ids=sceneids,
                 purpose='Give the film one wall note screen with a draft visit note that receives a ribbon of spoken word marks, grows a draft line, threads that line back to source words, receives a clinician check mark in its slot and passes into an open record tray, so the object the question is about changes state across the film.',
                 prompt='Author an original finished React and SVG object in the current Remotion engine. A wall note screen with a rounded bezel and a pale paper note page, a ribbon of small word marks that flows in from the left, a single draft line with a hand-set cursor, a thin thread that draws from the line to a strip of source words, a crooked burnt orange check slot beside the line that receives an outlined and then solid check mark, and an open worn record tray beneath the screen. Soft shadowless humid daylight from the upper left, a cool glow on the page and a soft contact shadow on the wall. No logos, no brand marks, no real product interface and no readable patient detail. Maintained but worn, nothing symmetric. A disclosed illustration, never a real screen.',
                 source_limit='Disclosed illustration of a generic wall note screen and draft note. Not an Abridge, Epic or DAX screen, not a UT Physicians interface and not a real clinic, clinician or patient.',
                 action_uses=[au('s1', 1, 'room-medium'), au('s6', 1, 'link-close'), au('s10', 1, 'answer-close')]),
            dict(id='clinic-record-support', role='support', file=SUPPORT, export='ClinicRecordSupport', scene_ids=sceneids,
                 purpose='Give the note its world and its records, an exam room with a padded table and stool and a window onto Houston, a desk, a school post card, a dashed platform outline with a stalled progress bar and two pilot tags, a physician outline row with a blank calendar slot and a refresher tag, a press release card with an agreement tag, a system initiative card and a tying thread, a framework frame with institution cards and switches, a bill card with an effective stamp, diagnosis and AI tags, a highlighted review condition, a practitioner outline over a stack of AI-marked record cards, a standards tag, a diagnosis frame, a visit note card with a question mark, source cards and an empty how well field with a not published stamp.',
                 prompt='Author an original finished React and SVG support group in the current Remotion engine. A generic exam room with a padded exam table, a rolling stool and a window opening onto Houston, no people, a worn laminate desk edge with a cable organizer, flat paper cards with dog-eared corners for the school post, press release, initiative, bill, record stack and visit note, dashed outlines, thin curved threads, small rounded tags, a row of anonymous physician outlines, a faceless practitioner outline, institution cards with small switches, a crooked date and effective stamp, a not published stamp, and an empty labelled field. Warm paper cards, teal desk, one burnt orange accent. No logos, no seals, no brand marks, no readable patient detail and no real interface.',
                 source_limit='Disclosed illustration of the sources. No real clinic, room, institution card, seal, interface, logo, clinician or patient. The empty field shows an absence in the sources, not a measurement.',
                 action_uses=[au('s2', 1, 'post-medium'), au('s5', 1, 'framework-wide'), au('s9', 0, 'scope-medium')])],
        entries=[])

def registry_entry():
    views = {}
    for sid in SIDS:
        c = S[sid]
        subj = sorted([f'{sid}-{k}' for k, _ in c['subs']])
        for f in FRAMES:
            views[view(sid, f)] = dict(subject_ids=subj, action_ids=sorted(c['actions']))
    hero_views = [v for v in views if v.split('-')[0] in ('room', 'link', 'answer') or v.split('-')[1] in ('close', 'check')]
    return {
        'module': FILM, 'assets': [HERO, SUPPORT, 'video-engine/src/lib/direction.ts'],
        'views': sorted(views), 'wall_views': WALL, 'wash_views': sorted(WASH),
        'subject': 'One wall note screen with a draft visit note in an illustrated Houston exam room, the spoken word ribbon that becomes its draft line, the thread back to source words, the check slot and record tray, and the records around it: a school post card with a dashed platform outline and two pilot tags, a physician outline row with a refresher tag, a press release card with an agreement tag tied to an initiative card, a framework with institution cards, a bill card with an effective stamp and diagnosis and AI tags, a review condition with a practitioner outline over AI-marked records and a standards tag, a diagnosis frame with a visit note card and a question mark, and an empty how well field stamped not published',
        'note': 'Fresh authored Claude-lane episode for 2026-11-10 (UT Physicians and Epic ambient listening, the Abridge enterprise-wide agreement with University of Texas REAL Health AI and the Texas Act on AI used for diagnosis). Hero NoteHero and support ClinicRecordSupport are original React and SVG groups shared by both treatments. A follows one note screen through a single exam room, B keeps the empty check slot in frame at the start of every scene. Disclosed illustration, no brand marks, no real clinic, clinician, patient, interface or seal.',
        'narration_views': views,
        'authored_art': [dict(role='hero', module=HERO, export='NoteHero', views=sorted(hero_views)),
                         dict(role='support', module=SUPPORT, export='ClinicRecordSupport', views=sorted(views))]}

def build(treatment):
    fd, plan = film_direction(treatment)
    np_ = dict(version='narration-picture-v1', timing_mode='authored',
               cue_plan='Provisional authored cue estimate for the silent two-treatment comparison only. board_retime.py replaces it with measured_caption_boundaries after acoustic alignment; it approves nothing.',
               clauses=clause_rows())
    board = dict(
        date=EDITION, edition_id=EDITION, run_id=EDITION, title='Who checks the draft',
        topic='UT Physicians is working toward Epic ambient listening, Abridge announced an agreement with University of Texas REAL Health AI, and a Texas Act conditions AI diagnostic use on review of AI records, while no source says how well a clinician check works',
        beat='clinic-and-bench', entities=['UT Physicians', 'UTHealth Houston', 'Abridge', 'Epic', 'University of Texas REAL Health AI'],
        runtime_s=RUNTIME, credits_s=5,
        credits='TEXAS AI DOCKET\nSOURCES\nUTHealth Houston school post\nAbridge release\nTexas enrolled bill text\nILLUSTRATION\nOriginal authored diagrams, no brand marks\n',
        derived_from='scratch', cinematic_template='directed-film-v2', daily_production=True,
        fauna_scope=dict(status='none', reason='This clinic note story names no animal action, habitat or wildlife claim.'),
        scenes=scene_rows(treatment), story_art=story_art(), film_direction=fd, narration_picture=np_,
        story_contract=story_contract(),
        cinematic_contract=dict(
            throughline=dict(subject='One draft visit note on a wall note screen and the check slot beside its draft line, from the spoken words that make it to the record tray it waits to enter',
                             opening_state='A ribbon of spoken word marks turns into a first draft line beside an empty check box.',
                             closing_state="A clinician check mark sits in the slot on the draft note beside a how well field stamped not published.", scene_ids=SIDS),
            turn_scene='s6', button='The check mark lands on the draft and the how well field stays blank, so the check is placed with the clinician and its quality is unstated.'),
        cinema=dict(version='creative-production-v1', hero_scene_id='s6', hero_passage_end_scene_id='s7', dimensional_scene_ids=[],
                    visible_action='A draft line threads back to its source words, an outlined check mark hovers over it and a bill card then conditions AI diagnostic use on review of all AI records.',
                    human_consequence='Physicians who review the drafts and the patients whose visits are the source. No person is named or drawn.',
                    source_limit='Disclosed illustration of the sources. It shows no real clinic, clinician, patient, interface or seal, and no source says how well the check works.'),
        fingerprint=(dict(pov='instrument-screen', motion_vector='assemble-build', hero_treatment='absence-as-subject', layout='hud-instrument-frame', register='editorial-schematic',
                          camera_strategy='riseWith', light_story='humid-glare', palette='Humid gray green, teal desk, warm paper, pale note screen and one burnt orange check slot',
                          metaphor='A draft line waits for the person who checks it') if treatment == 'a' else
                     dict(pov='macro-closeup', motion_vector='accumulate-fill', hero_treatment='data-as-subject', layout='grid-modular', register='tactile-collage',
                          camera_strategy='craneDown', light_story='humid-glare', palette='Humid gray green, teal desk, warm paper, pale note screen and one burnt orange check slot',
                          metaphor='One empty slot stays in view while the evidence arrives around it')),
        divergence_note=('A follows one note screen through a single exam room, coming in from a wide room view to the screen and keeping the same screen in frame as each source card arrives beside it, with the records as inserts.' if treatment == 'a' else
                         'B opens every scene close on the empty check slot on the note screen and then widens to the card or rule beside it, using split framing for comparisons and detail views for stamps, so the open question is the fixed point and the evidence moves around it.'),
        hook_strategy='visual_anomaly', hook_payoff_s=0.9,
        creative_direction=creative_direction(treatment),
        documentary=dict(schema='dispatch_documentary/1', viewer_question="In Texas, when documentation is AI-generated, who verifies the output?",
                         payoff='The check mark lands in the slot on the draft line, so the check sits with the clinician while the how well field stays blank.',
                         source_limit='Disclosed illustration of the sources. No source says how often drafts are checked or how accurate they are, and the bill text doesn\'t say whether a visit note counts.',
                         hero_image='A wall note screen where spoken word marks become a draft line, the line threads back to source words and a check mark lands in its slot.',
                         closing_answer="The vendor's design and the statute's review condition both point the check at the clinician, and none of these sources says how well it works.",
                         hook_payoff_event=EVENTS['s1'][0]['id']),
        visual_research=dict(
            searches=[dict(query='UTHealth Houston and UT Physicians pages, Abridge release and the Texas Act for any reusable photograph, figure or screen', finding='The three pages are text only. The Abridge release carries vendor imagery with unknown reuse rights and no page offers a Texas exam room photograph.'),
                      dict(query='Library of Congress Lyda Hill Texas Collection for an exam room or Houston clinic photograph', finding='The collection has no clinical interior that a source ties to this story, so no photograph is used.')],
            candidates=[dict(url='https://www.abridge.com/press-release/ut-health-enterprise-wide', decision='reject', reason='Vendor imagery has no established reuse licence and would show a product screen the sources do not describe.'),
                        dict(url='https://med.uth.edu/about-us/2026/09/09/deans-dialogue-highlights-progress-plans-for-year-ahead/', decision='reject', reason='The page is text only and its images are not needed to tell the story.'),
                        dict(url='authored://2026-11-10/note-hero', decision='use', reason='Fresh original authored hero group performs the spoken words becoming a draft line, the thread to source words and the check slot.'),
                        dict(url='authored://2026-11-10/clinic-record-support', decision='use', reason='Fresh original authored support group stages the exam room and the source cards, rule card and empty fields.')],
            decision='No external photograph or footage helps tell this story honestly, so fresh authored illustration performs the sourced mechanism. The cards quote the sources only through short labels and every figure traces to a claim.'),
        art_direction=art_direction(treatment, plan),
        captions=captions(),
        quality_plan=quality_plan(), attention_beats=attention(),
        caption_method='authored_estimate',
        native_media=[])
    return board

if __name__ == '__main__':
    boards = {t: build(t) for t in 'ab'}
    for t, b in boards.items():
        plan = b['film_direction']['shots']
        print(t, 'shots', len(plan), 'wall share', round(sum(1 for s in plan if s['view'] in WALL) / len(plan), 3),
              'framings', sorted({s['framing'] for s in plan}), 'max shot', max(s['duration_s'] for s in plan))
    print('runtime', RUNTIME, [(s, CLOCK[s]['dur']) for s in SIDS])
    (OUT / 'opening-a.json').write_text(json.dumps(boards['a'], indent=2) + '\n')
    (OUT / 'opening-b.json').write_text(json.dumps(boards['b'], indent=2) + '\n')
    (OUT / 'storyboard.json').write_text(json.dumps(boards['a'], indent=2) + '\n')
    gates = OUT / 'board-gates'
    gates.mkdir(exist_ok=True)
    (gates / 'registry-entry-draft.json').write_text(json.dumps({EP: registry_entry()}, indent=2) + '\n')
