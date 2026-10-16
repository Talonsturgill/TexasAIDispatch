"""R12 proposal: move the clause "The announcement reports no field result." and its stamp shot out of scene s7
into the front of scene s8, because the MEASURED read of sentences 11 to 13 is 10.6 s and a scene may not pass 9.5 s.
Reads the accepted live board bytes and the live renderer/registry, writes only under evidence/proposal-r12/.
Run from the checkout root: python out/dispatch/evidence/proposal-r12/build_split.py"""
import copy, json, re, sys, hashlib
R = 'out/dispatch/'
OUT = R + 'evidence/proposal-r12/'
FILM = 'video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx'
REG = 'config/modern_episode_registry.json'
b = json.load(open(R + 'evidence/proposal-r12/storyboard-before.json'))
sc = {s['id']: s for s in b['scenes']}
s7, s8 = sc['s7'], sc['s8']
S7_TXT = ('The validation bar fills across its card and the university\'s reported figure appears and holds. '
          'An initial assessments after training tag pins under the validation card.')
STAMP = 'The field result card stays blank and a none reported stamp presses onto it.'
MAP_TXT = s8['on_screen']
assert s7['on_screen'] == S7_TXT + ' ' + STAMP

# ---- clauses and cues
cl = {c['id']: c for c in b['narration_picture']['clauses']}
n7c, n8a = cl['n7c'], cl['n8a']
n8a['id'] = 'n8b'; n8a['cue_ids'] = ['n8b-a']
n7c['id'] = 'n8a'; n7c['cue_ids'] = ['n8a-a']; n7c['scene_id'] = 's8'
n7c['subject_ids'] = ['s8-valcard', 's8-blank']; n7c['event_ids'] = ['s8-event-0']
for cue in b['captions']:
    if cue['id'] == 'n8a-a': cue['id'] = 'n8b-a'
    elif cue['id'] == 'n7c-a': cue['id'] = 'n8a-a'

# ---- scene s7: two sentences, no stamp
ev3 = [e for e in s7['visual_events'] if e['id'] == 's7-event-3'][0]
SLIDE = 'The blank field result card slides in at the edge, beside the validation card.'
slide = copy.deepcopy(ev3)
slide.update(what=SLIDE, motion={'curve': 'travel', 'anticipation': 0, 'settle': 0.03}, narration_id='n7b',
             clause_fraction_start=0.72, clause_fraction_end=0.95)
s7['visual_events'] = [e for e in s7['visual_events'] if e['id'] != 's7-event-3'] + [slide]
cl['n7b']['event_ids'] = ['s7-event-2', 's7-event-3']
s7['vo'] = 'The university reports early chip AI validation. Accuracy was ninety eight point eight two percent.'
s7['vo_claims'] = ['c4', 'c18']
S7_ALL = S7_TXT + ' ' + SLIDE
for k in ('on_screen', 'what_moves'): s7[k] = S7_ALL
s7['visual_sentence'] = {'subject': 'The validation card with its bar, figure and tag, the edge of the blank field result card beside it',
    'action': S7_ALL, 'emotion': 'Restraint, a lab figure.', 'annotation': s7['visual_sentence']['annotation']}
s7['visual_proof']['must_show'] = [m for m in s7['visual_proof']['must_show'] if m['concept'] != 'no field result']

# ---- scene s8: the stamp first, then the map
ev3 = copy.deepcopy(ev3)
ev3['id'] = 's8-event-0'; ev3['item_ids'] = ['s8-blank', 's8-card2']; ev3['narration_id'] = 'n8a'
for e in s8['visual_events']: e['narration_id'] = 'n8b'
s8['visual_events'] = [ev3] + s8['visual_events']
s8['vo'] = 'The announcement reports no field result. It names no town with an installed station.'
s8['vo_claims'] = ['c1', 'c4', 'c10']
for k in ('on_screen', 'what_moves'): s8[k] = STAMP + ' ' + MAP_TXT
s8['visual_sentence'] = {'subject': 'The validation card beside the blank field result card, stamped, then the paper street map pinned to the chain link fence with no installed pin',
    'action': STAMP + ' ' + s8['visual_sentence']['action'], 'emotion': 'Plainness, no field result and no town named.',
    'annotation': 'Illustration. Not a real report or map'}
s8['production_disclosure'] = 'Illustration. Not a real report or map'
cards = {900: ('chain link fence at the curb and a second card for a field result', 's8-card2', 'second card for a field result'),
         700: ('paper map pinned to the fence and the validation card', 's8-valcard', 'validation accuracy card reading 98.82 percent, the university reported figure'),
         500: ('street grid and creek with no pin and the validation bar', 's8-valbar', 'validation accuracy bar filling to 98.82 percent'),
         300: ('search ring sweeping the map and the assessment tag', 's8-assess', 'initial assessments after training tag'),
         150: ('tag pinned to the map and the blank field result card', 's8-blank', 'field result card left blank, none reported')}
for plane in s8['planes']:
    lab, i, pl = cards[plane['z']]
    plane['label'] = lab
    plane['items'].append({'id': i, 'kind': 'applicationRecord', 'x': 540, 'y': 900, 'scale': 1, 'props': {'label': pl}})
s8['visual_proof']['must_show'] = [{'concept': 'no field result', 'item_ids': ['s8-blank']}] + s8['visual_proof']['must_show']

# ---- shots and rewards
shots = b['film_direction']['shots']
for x in shots:
    if x['id'] == 's7-shot-3':
        x['id'] = 's8-shot-1'; x['scene_id'] = 's8'; x['event_id'] = 's8-event-0'; x['narration_ids'] = ['n8a']
    elif x['id'] == 's8-shot-1':
        x['id'] = 's8-shot-2'; x['narration_ids'] = ['n8b']
shots.sort(key=lambda x: x['start_s'])
for r in b['film_direction']['rewards']:
    if r['event_id'] == 's7-event-3': r['event_id'] = 's8-event-0'; r['shot_id'] = 's8-shot-1'
    elif r['event_id'].startswith('s8-event-'): r['shot_id'] = 's8-shot-2'

rw = [r for r in b['film_direction']['rewards'] if r['event_id'] == 's7-event-2'][0]
b['film_direction']['rewards'].append(dict(rw, event_id='s7-event-3', visible_change=SLIDE))
# ---- attention beats and sound cue
for a in b['attention_beats']:
    if a['event_id'] == 's7-event-3':
        a['event_id'] = 's8-event-0'; a['id'] = 's8-event-0-attention'; a['item_ids'] = ['s8-blank', 's8-card2']
att = [a for a in b['attention_beats'] if a['event_id'] == 's7-event-2'][0]
new_att = copy.deepcopy(att)
new_att.update(id='s7-event-3-attention', event_id='s7-event-3', item_ids=['s7-blank', 's7-card2'], change_type='evidence',
               visible_change=SLIDE, viewer_reward=SLIDE)
b['attention_beats'].append(new_att)
b['attention_beats'].sort(key=lambda a: (int(a['event_id'].split('-')[0][1:]), int(a['event_id'].split('-')[2])))
for c in b['creative_direction']['sound']['cues']:
    if c['event_id'] == 's7-event-3': c['event_id'] = 's8-event-0'

# ---- quality plan, story contract, creative direction
qp = {q['scene_id']: q for q in b['quality_plan']['scenes']}
qp['s7'].update(subject='The validation card with its bar, figure and tag, the edge of the blank field result card beside it', consequence=SLIDE)
qp['s8'].update(subject=s8['visual_sentence']['subject'], action=STAMP, consequence='A no installation named tag pins to the map.',
                source_basis=qp['s8']['source_basis'].replace('Claims c1, c10.', 'Claims c1, c4, c10.'))
stc = {s['scene_id']: s for s in b['story_contract']['scenes']}
stc['s7'].update(advances=S7_ALL)
stc['s8'].update(claim_ids=['c1', 'c4', 'c10'], advances=STAMP + ' ' + MAP_TXT)
for t in b['story_contract']['transitions']:
    if t['from'] == 's7' and t['to'] == 's8':
        t['because'] = 'After the figure, the same card sits beside a field result card the announcement leaves blank.'
        t['visible_bridge'] = 'The validation card stays in frame as the blank field result card takes its none reported stamp.'
ed = {e['scene_id']: e for e in b['creative_direction']['edits']}
ed['s7'].update(leave_on=SLIDE, cut_after_event_id='s7-event-3',
    next_connection='From the validation card with its bar, figure and tag to both cards side by side with the blank field result card stamped.')
ed['s7']['sentence_to_shot'].update(clause=s7['vo'], subject=s7['visual_sentence']['subject'], relationship=S7_ALL)
ed['s8'].update(enter_on=STAMP, sentence_to_shot=dict(ed['s8']['sentence_to_shot'], clause=s8['vo'], subject=s8['visual_sentence']['subject'],
    relationship=STAMP + ' ' + MAP_TXT))
json.dump(b, open(OUT + 'storyboard-a.json', 'w'), indent=2, ensure_ascii=False)

# ---- renderer: the no-field-card view follows the board it is given
t = open(FILM).read()
def sub(old, new):
    global t
    assert t.count(old) == 1, old
    t = t.replace(old, new)
sub("s7e3=p('s7-event-3');", "s7e3=pOpt('s7-event-3',0);")
sub("  if(view==='validation-card'){",
    "  // The stamp event and the cards' item ids follow the board: scene s8 owns them once its own stamp event exists,\n"
    "  // and s7-event-3 is then only the blank card sliding in at the edge of the validation shots.\n"
    "  const moved=!!W['s8-event-0'], stampId=moved?'s8-event-0':'s7-event-3', stamp=moved?p('s8-event-0'):s7e3;\n"
    "  if(view==='validation-card'){")
sub("   const resAt:Pt=v==='a'?[900,470]:[-330,470];",
    "   const slide=moved?ease(s7e3):1;\n   const resAt:Pt=v==='a'?[lerp(1300,900,slide),470]:[lerp(-730,-330,slide),470];")
sub("  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s7-event-3').start})):0;",
    "  const ids=moved?{card:'s8-valcard',bar:'s8-valbar',tag:'s8-assess',card2:'s8-card2',blank:'s8-blank'}:{card:'s7-card',bar:'s7-bar',tag:'s7-tag',card2:'s7-card2',blank:'s7-blank'};\n"
    "  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win(stampId).start})):0;")
sub('''   <Item id="s7-card"><Item id="s7-bar"><At p={[40,560]} s={.62}>''', '''   <Item id={ids.card}><Item id={ids.bar}><At p={[40,560]} s={.62}>''')
sub('''   <Item id="s7-tag"><At p={[60,810]}>''', '''   <Item id={ids.tag}><At p={[60,810]}>''')
sub('''   <Item id="s7-card2"><Item id="s7-blank"><At p={[460,500]} s={.95}><StreetHubSupport part="result" stamp={s7e3} pal={pal}/>''',
    '''   <Item id={ids.card2}><Item id={ids.blank}><At p={[460,500]} s={.95}><StreetHubSupport part="result" stamp={stamp} pal={pal}/>''')
open(OUT + 'FloodStationFilm.tsx', 'w').write(t)

# ---- registry: the moved view's subject ids
reg = json.load(open(REG))
def find(o):
    if isinstance(o, dict):
        if 'flood-station-v1' in o: return o['flood-station-v1']
        for v in o.values():
            x = find(v)
            if x: return x
e = find(reg)
v = e['narration_views']['no-field-card']
v['subject_ids'] = v['subject_ids'] + ['s8-valcard', 's8-valbar', 's8-assess', 's8-blank', 's8-card2']
json.dump(reg, open(OUT + 'modern_episode_registry.json', 'w'), indent=2, ensure_ascii=False)
open(OUT + 'modern_episode_registry.json', 'a').write('\n')
print('ok')
