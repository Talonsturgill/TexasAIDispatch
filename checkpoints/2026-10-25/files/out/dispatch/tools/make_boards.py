"""Build the two planned treatment boards for 2026-10-25 from spec.py (director scratch)."""
import copy, hashlib, json, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'scripts'))
sys.path.insert(0, str(Path(__file__).parent))
from spec import *  # noqa
from modern_film import narration_tokens  # noqa

OUT = REPO / 'out/dispatch'
BASE = json.loads((REPO / 'runs/2026-10-21/openings/a.json').read_text())
sha = lambda p: hashlib.sha256((REPO / p).read_bytes()).hexdigest()
r4 = lambda x: round(x, 4)


def clause_clock():
    t, rows, scene_start, order = 0.0, [], {}, []
    by_scene = {}
    for c in CLAUSES:
        by_scene.setdefault(c[1], []).append(c)
    clock = {}
    cursor = 0.0
    scenes = {}
    for sid in by_scene:
        s0 = cursor
        at = s0 + (LEAD if sid == 's1' else 0.36)
        for cid, _, text, _c in by_scene[sid]:
            words = len(text.split())
            dur = r4(0.30 * words + 0.45)
            clock[cid] = (r4(at), r4(at + dur))
            at += dur + GAP_IN
        end = r4(at - GAP_IN + 0.3)
        scenes[sid] = (r4(s0), r4(end - s0))
        cursor = end
    return clock, scenes, cursor


def build(variant):
    other = 'b' if variant == 'a' else 'a'
    clock, sc_clock, total = clock_cache
    b = copy.deepcopy(BASE)
    for k in ('native_media', 'retimed_to', 'retime_evidence', 'captions', 'caption_method'):
        b.pop(k, None)
    b['date'] = EDITION; b['edition_id'] = EDITION; b['run_id'] = EDITION
    b['title'] = 'Only the melt can answer'
    b['topic'] = ("Texas A&M announced a $2 million grant for the Aggie AI Foundry, a planned lab where AI proposes alloys "
                  "and robotic arms mix, melt and test them, and its own researcher says no computer tool can predict an alloy")
    b['beat'] = 'science-machines'
    b['entities'] = ['Texas A&M', 'WoodNext Foundation', 'Aggie AI Foundry']
    b['credits_s'] = CREDITS_S
    b['runtime_s'] = r4(total)
    b['credits'] = ('TEXAS AI DOCKET\nSOURCES\nTexas A&M Engineering News, October 22nd, 2026\n'
                    'Texas AI Docket record of the grant\nILLUSTRATION\nOriginal authored diagrams, no brand marks')
    b['fauna_scope'] = {'status': 'none', 'reason': 'This alloy lab story names no animal action, habitat or wildlife claim.'}
    # scenes
    scenes, claims_by_scene = [], {}
    for cid, sid, text, cl in CLAUSES:
        claims_by_scene.setdefault(sid, [])
        for x in cl:
            if x not in claims_by_scene[sid]:
                claims_by_scene[sid].append(x)
    clause_rows = {c[0]: c for c in CLAUSES}
    for sid, S in SCENES.items():
        start, dur = sc_clock[sid]
        vo = ' '.join(c[2] for c in CLAUSES if c[1] == sid)
        events = []
        for suffix, cid, f0, f1, curve, ctype, what, subj, snd in S['events']:
            if cid is None:
                length = 1.2
                at_abs = start + dur - 3.0
                events.append(dict(id=f'{sid}-{suffix}', at_s_authored=r4(at_abs - start), duration_s_authored=r4(length),
                                   item_ids=subj, what=what, motion=dict(curve=curve, anticipation=0.0, settle=0.03),
                                   at_s=r4(at_abs - start), duration_s=r4(length)))
                continue
            cs, ce = clock[cid]
            span = ce - cs
            length = min(1.2, max(0.5, (f1 - f0) * span))
            length = min(length, {'s1-event-1': 0.85}.get(f'{sid}-{suffix}', 9))
            at_abs = cs + f0 * span
            at_abs = min(at_abs, ce - length)
            events.append(dict(id=f'{sid}-{suffix}', at_s_authored=r4(at_abs - start), duration_s_authored=r4(length),
                               item_ids=subj, what=what, motion=dict(curve=curve, anticipation=0.0, settle=0.03),
                               narration_id=cid, clause_fraction_start=(at_abs - cs) / span,
                               clause_fraction_end=(at_abs + length - cs) / span,
                               at_s=r4(at_abs - start), duration_s=r4(length)))
        planes = [dict(z=z, label=label, items=[dict(id=i, kind='applicationRecord', x=540, y=900, scale=1,
                                                   props=dict(label=dict(S['items'])[i])) for i in ids])
                  for z, label, ids in S['planes']]
        mute, must, change = S['proof']
        on = ' '.join(e['what'] for e in events)
        cam = CAMERA[variant][sid]
        scenes.append(dict(
            id=sid, start_s=start, duration_s=dur, duration_authored=dur, county='Brazos', region='post_oak',
            interior=S['interior'], cast=[], beat=S['beat'], story_role=S['role'], vo=vo,
            vo_claims=claims_by_scene[sid], super='', caption='', on_screen=on, what_moves=on,
            production_disclosure=S['disclosure'], visual_events=events, camera_strategy=cam,
            visual_family=f'alloy-{sid}-{variant}', payload_mode='picture', treatment=variant, hero=S['hero'][:62],
            place_plate='post-oak-wide',
            visual_sentence=dict(subject=S['subject'], action=on, emotion=S['emotion'], annotation=S['disclosure']),
            planes=planes,
            visual_proof=dict(mute_takeaway=mute,
                              must_show=[dict(concept=c, item_ids=i) for c, i in must],
                              change=dict(description=change[0], item_ids=change[1])),
            hook_strategy='visual_anomaly', hook_payoff_s=0.75))
    b['scenes'] = scenes
    sc = {s['id']: s for s in scenes}
    ev = {e['id']: (s, e) for s in scenes for e in s['visual_events']}
    # narration picture
    cursor = 0
    clauses = []
    for i, (cid, sid, text, cl) in enumerate(CLAUSES, 1):
        n = len(narration_tokens(text))
        subj, evs = [], []
        for e in sc[sid]['visual_events']:
            if e.get('narration_id') == cid:
                evs.append(e['id'])
                subj += [x for x in e['item_ids'] if x not in subj]
        clauses.append(dict(id=cid, text=text, cue_ids=[f'c{i}'], scene_id=sid, subject_ids=sorted(subj),
                            action_id=SCENES[sid]['action'], claim_ids=cl, event_ids=evs,
                            start_s=clock[cid][0], end_s=clock[cid][1], word_range=[cursor, cursor + n]))
        cursor += n
    b['narration_picture'] = dict(version='narration-picture-v1', timing_mode='authored',
        cue_plan='Provisional authored cue estimate for the silent two-treatment comparison only. board_retime.py replaces it with measured_caption_boundaries after acoustic alignment; it approves nothing.',
        clauses=clauses)
    b['captions'] = [dict(id=f'c{i}', start=clock[c[0]][0], end=clock[c[0]][1], text=c[2], source='authored_estimate',
                          start_measured=False, end_measured=False) for i, c in enumerate(CLAUSES, 1)]
    # film direction
    shots, rewards = [], []
    for sid in SCENES:
        st, du = sc_clock[sid]
        scene_end = st + du
        evs = {e['id']: e for e in sc[sid]['visual_events']}
        spec = SHOTS[variant][sid]
        ev_start = lambda e: st + e['at_s']
        ev_end = lambda e: st + e['at_s'] + e['duration_s']
        starts = []
        for n, (view, framing, trans, cid, esuf) in enumerate(spec):
            e = evs[f'{sid}-{esuf}']
            if n == 0:
                starts.append(st)
            else:
                prev = evs[f'{sid}-{spec[n - 1][4]}']
                if spec[n - 1][3] != cid:
                    starts.append(clock[cid][0])
                else:
                    a, bnd = ev_end(prev), ev_start(e)
                    starts.append(r4(max(starts[-1] + 0.5, min(bnd, (a + bnd) / 2 if a > bnd else bnd) - 0.05)))
        starts.append(scene_end)
        for n, (view, framing, trans, cid, esuf) in enumerate(spec):
            e = evs[f'{sid}-{esuf}']
            s0, s1 = starts[n], starts[n + 1]
            shots.append(dict(id=f'{sid}-shot-{n + 1}', scene_id=sid, start_s=r4(s0), duration_s=r4(s1 - s0),
                              framing=framing, transition=trans, view=view, event_id=e['id'], purpose=e['what'],
                              carry=SCENES[sid]['subject'][:90], narration_ids=[cid],
                              scene_fraction_start=(s0 - st) / du, scene_fraction_end=(s1 - st) / du))
    ev = {e['id']: (s, e) for s in scenes for e in s['visual_events']}
    kinds = {'location_reveal': 'reveal', 'mechanism': 'action', 'resolution': 'consequence', 'consequence': 'consequence',
             'evidence': 'evidence', 'human_action': 'action', 'comparison': 'comparison'}
    ctypes = {f"{sid}-{x[0]}": x[5] for sid in SCENES for x in SCENES[sid]['events']}
    for sh in shots:
        s, e = ev[sh['event_id']]
        e0, e1 = s['start_s'] + e['at_s'], s['start_s'] + e['at_s'] + e['duration_s']
        lo, hi = max(e0, sh['start_s']), min(e1, sh['start_s'] + sh['duration_s'])
        assert hi > lo, ('shot does not overlap its event', sh['id'], sh['event_id'])
        t = lo + 0.25 * (hi - lo)
        rewards.append(dict(shot_id=sh['id'], event_id=e['id'], at_s=r4(t), kind=kinds[ctypes[e['id']]],
                            visible_change=e['what'], event_fraction=r4((t - e0) / e['duration_s'])))
    rewards.sort(key=lambda r: (r['at_s'], r['event_id']))
    angle = {
        'a': ('Follow one alloy candidate from the periodic table mesh to the foundry line at bench level, so the viewer watches the sample before the people and the paper.',
              'Watch a trillion mixes narrow to one sample on a planned line, then see what only the melt can say.',
              'The arm tips the crucible and the amber melt pours while the suggested recipe card dims, so the melt is the answer.',
              'A suggested recipe card dims beside a glowing melt on the test rig, so the AI suggests and only the melt answers.'),
        'b': ('Start at the bench and the record. The mesh, the pile, the release and the quote reach the viewer from overhead and through the window, and the foundry line is seen as a planned room, so the limit lands before the machine.',
              'See the question as paperwork on a bench, then watch the planned line answer it.',
              'The prediction gauge stays empty over the alloy sample, so the limit is on screen before the arm touches any metal.',
              'The suggested recipe card dims beside the glowing melt in the mold, so only the melt answers.')}[variant]
    b['film_direction'] = dict(version='directed-film-v2', episode=EPISODE, variant=variant, angle=angle[0],
        opening_promise=angle[1], performed_turn=angle[2], closing_answer=angle[3], shots=shots, rewards=rewards,
        renderer_inputs=[])
    # story art plan
    hero_uses = [dict(scene_id='s4', event_id='s4-event-2', view='arm-vials', action_id='ai-proposes-arms-mix-melt-test', subject_ids=['s4-arm', 's4-vials']),
                 dict(scene_id='s4', event_id='s4-event-3', view='furnace-glow', action_id='ai-proposes-arms-mix-melt-test', subject_ids=['s4-arm', 's4-furnace']),
                 dict(scene_id='s6', event_id='s6-event-2', view='rig-load', action_id='metal-is-tested', subject_ids=['s6-sample', 's6-rig']),
                 dict(scene_id='s9', event_id='s9-event-2', view='melt-pour', action_id='melt-answers', subject_ids=['s9-arm', 's9-melt'])]
    support_uses = [dict(scene_id='s1', event_id='s1-event-2', view='wall-display', action_id='elements-mix-trillion', subject_ids=['s1-table', 's1-mesh']),
                    dict(scene_id='s3', event_id='s3-event-2', view='release-desk', action_id='grant-announced', subject_ids=['s3-date', 's3-release']),
                    dict(scene_id='s5', event_id='s5-event-3', view='unknown-sample', action_id='computer-cannot-predict-alloy', subject_ids=['s5-gauge', 's5-sample']),
                    dict(scene_id='s7', event_id='s7-event-3', view='goal-tag', action_id='goal-week-not-months', subject_ids=['s7-week', 's7-goal'])]
    all_scenes = list(SCENES)
    b['story_art'] = dict(version='authored-story-art-v1', runtime='claude-sonnet-v1', edition_id=EDITION, requests=[
        dict(id='foundry-arm-hero', role='hero', file=HERO_FILE, export='FoundryArmHero', scene_ids=['s4', 's6', 's9'],
             purpose='Give the film one recognizable robotic arm and sample line that changes state through the film: it takes element vials into a crucible, sets the crucible in a glowing furnace, carries the sample to a test rig, loads and bends the real metal, and at the close tips the melt into a mold, so the planned Aggie AI Foundry action is a drawn object a viewer can follow.',
             prompt='Author an original finished React and SVG object in the current Remotion engine. A generic multi-axis robotic arm with a rounded warm gray shell, a visible wrist joint and a two finger gripper holding tongs, no brand marks. Beside it a rack of glass element vials, a ceramic crucible, a furnace opening that glows amber with a heat shimmer, and a sample test rig with a clamp and a needle gauge. Soft key light from the upper left through a lab window, cool fill from the right, contact shadows on a worn steel line bed, scuffed paint and a slightly leaning sample tray so nothing is symmetric. A disclosed illustration of a planned lab, never a real arm, furnace, rig or Texas A&M building.',
             source_limit='Disclosed illustration of a planned automated alloy line. Not an existing Texas A&M facility, not a named arm or furnace model, not a real melting method, and the test shows no measured result.',
             action_uses=hero_uses),
        dict(id='foundry-support', role='support', file=SUPPORT_FILE, export='FoundrySupport', scene_ids=all_scenes,
             purpose='Give the arm its world and its records: a periodic table wall display with tiles that light, a mesh of mixes, a stream of recipe cards and a pile over a bench edge, a news release card with a dateline stamp and a $2 million tag, a planned foundry bay outline, an AI panel writing a recipe card, a quote card with a prediction gauge that fills partway and stops, calendar month pages and a one-week strip, a goal stamp, a not a result tag and a blank opening date field.',
             prompt='Author an original finished React and SVG support group in the current Remotion engine. A generic metals lab wall with a window onto post oak woods and grass, a periodic table display whose tiles light amber, a fine mesh of lines between lit tiles, hand-sized recipe cards with ruled lines, a worn bench with a rolling pencil, a plain news release card with a crooked rubber dateline stamp and a paper tag, a pencil outline of a foundry bay with a PLANNED stamp, a flat AI panel with a recipe card, a quote card with a pen signature line, a prediction gauge with a needle, a stack of wall calendar pages, a seven cell week strip, a GOAL stamp, a not a result tag and a blank form field with a dash. Maintained but worn, nothing symmetric, warm paper against cool gray steel. No logos, no university marks, no brand marks.',
             source_limit='Disclosed illustration of the university release and its stated plan. It shows no real Texas A&M building, equipment, person, university mark or measured result, and the gauge, rig needle and calendar are illustrations of statements, not data.',
             action_uses=support_uses)], entries=[])
    b['story_art'].pop('entries')
    # story contract
    b['story_contract'] = dict(
        opening_question='How do you find one good alloy among a trillion possible mixes?',
        actor='Texas A&M University Department of Materials Science and Engineering, which announced a $2 million WoodNext Foundation grant',
        action='Announced a grant to build the Aggie AI Foundry, a planned lab where AI proposes alloys and computer-controlled robotic arms mix, melt and test them.',
        change='Alloy development would move toward an automated line where AI proposes and robotic arms make and test the metal, with a goal of a week or less instead of months.',
        affected_people='Materials scientists and students at Texas A&M. No person is named beyond the quoted researcher.',
        consequence='The metal still has to be made and tested, because a computer can predict some behavior but no computer tool can predict an alloy.',
        source_limit='Every verb about the facility is future tense. The release gives no opening date, building, melting method or measured result, and a week or less is the university\'s goal.',
        closing_answer='The AI can suggest, and only the melt can answer.',
        director_identity='claude-sonnet-5-5 director, this session',
        scenes=[dict(scene_id=sid, role=SCENES[sid]['role'] if SCENES[sid]['role'] in ('action', 'mechanism', 'consequence', 'evidence', 'limit', 'answer') else {'hook': 'action', 'movement': 'evidence', 'scale': 'consequence', 'agency': 'limit', 'close': 'answer'}[SCENES[sid]['role']],
                     claim_ids=claims_by_scene[sid], advances=sc[sid]['on_screen']) for sid in SCENES],
        transitions=[])
    bridges = {
        ('s1', 's2'): ('same-subject', 'The mesh of mixes becomes the stream of cards that someone would have to sort.', 'The mesh sheds recipe cards that fall toward the bench.'),
        ('s2', 's3'): ('causal-consequence', 'Too many mixes to sort leads to the grant announced to build an answer.', 'The pile slides off and the release card takes its place on the desk.'),
        ('s3', 's4'): ('same-subject', 'The planned bay outline fills in as the line that the grant would build.', 'The PLANNED outline fills in as the line with the AI panel and arm.'),
        ('s4', 's5'): ('causal-consequence', 'The line depends on what a computer can and cannot predict about a sample.', 'The sample from the rig sits beside the quote card.'),
        ('s5', 's6'): ('causal-consequence', 'Because no tool predicts the alloy, the sample has to go to the rig.', 'The empty gauge hands over to the arm lifting the sample.'),
        ('s6', 's7'): ('same-subject', 'The tested sample leads to how long each cycle takes.', 'The rig fades to calendar pages with the sample on the first page.'),
        ('s7', 's8'): ('same-subject', 'The goal on the week strip is stamped as a goal rather than a result.', 'The week strip stays and takes a GOAL stamp.'),
        ('s8', 's9'): ('causal-consequence', 'After the limits, the film returns to the line for its answer.', 'The blank date field falls away and the arm tips the crucible.')}
    for (f, t), (k, because, bridge) in bridges.items():
        b['story_contract']['transitions'].append(dict(**{'from': f}, to=t, kind=k, because=because, visible_bridge=bridge))
    # creative direction
    edits = []
    ordered = list(SCENES)
    for i, sid in enumerate(ordered):
        s = sc[sid]; evs = s['visual_events']
        nxt = SCENES[ordered[i + 1]]['subject'] if i + 1 < len(ordered) else 'the end card and credits'
        cl = ' '.join(c[2] for c in CLAUSES if c[1] == sid)
        edits.append(dict(scene_id=sid, enter_on=evs[0]['what'], leave_on=evs[-1]['what'], cut_after_event_id=evs[-1]['id'],
                          next_connection=f"From {SCENES[sid]['subject'][:70]} to {nxt[:70]}.",
                          sentence_to_shot=dict(clause=cl, subject=SCENES[sid]['subject'], relationship=s['on_screen'],
                                                source_limit='Disclosed illustration of the sources. It shows no real building, equipment, person or measured result, and the release gives no opening date.')))
    cues = []
    for sid in ordered:
        e = SCENES[sid]['events'][1] if len(SCENES[sid]['events']) > 1 else SCENES[sid]['events'][0]
        cues.append(dict(id=f'cue-{sid}', role='contact' if e[4] == 'contact' else 'environment', duration_s=1.2,
                         intent=(e[8] if len(e[8]) >= 25 else e[8].rstrip('.') + ' over low room tone.'), provenance='Original designed foley and ambience, not recorded at any lab.',
                         event_id=f'{sid}-{e[0]}'))
    cues.append(dict(id='mark-quiet', role='quiet', duration_s=1.2,
                     intent='Pull the music back while the glowing melt holds beside the dimmed recipe card.',
                     provenance='Authored event-clock background contrast.', event_id='s9-event-3', gain=0.3))
    b['creative_direction'] = dict(
        viewer_question='How do you find one good alloy among a trillion possible mixes?',
        visible_answer='By making and testing the metal, shown as a suggested recipe card dimming beside a glowing melt.',
        emotional_turn='Curiosity at the size of the number, a small doubt when the gauge stays empty, and a level answer at the melt.',
        medium_choice='Explanatory animation with a report spine, mechanism-led ordering. No licensed photograph or footage of the planned lab exists, so original authored illustration performs what the release states and labels it planned. A static page excerpt would hide the arm, the melt and the empty gauge that the sentences describe.',
        edits=edits,
        sound=dict(perspective='Designed illustration sound for a lab bench, paper, servos and a furnace. Never recorded in a real lab, furnace or Texas A&M building.',
                   music_arc='A low steady pulse under the number, rising slightly through the mechanism, thinning at the empty gauge and the blank date, and settling softly for the close.',
                   voice_arc='Plain and curious at the number, even through the grant and the plan, a touch drier at the limit, and slower and level on the last two lines.',
                   cues=cues),
        policy_sha256=sha('config/creative_production.json'))
    # documentary, cinema, contracts
    b['documentary'] = dict(schema='dispatch_documentary/1', viewer_question='How do you find one good alloy among a trillion possible mixes?',
        payoff='The arm tips the crucible and the melt pours while the suggested recipe card dims, so only the melt answers.',
        source_limit='Disclosed illustration of a planned lab. The release gives no opening date or measured result, and a week or less is the university\'s goal.',
        hero_image='A robotic arm setting a crucible in a glowing furnace and carrying the sample to a test rig.',
        closing_answer='The AI can suggest, and only the melt can answer.', hook_payoff_event='s1-event-1')
    b['cinema'] = dict(version='creative-production-v1', hero_scene_id='s4', hero_passage_end_scene_id='s4', dimensional_scene_ids=[],
        visible_action='An AI panel writes a recipe card, then a robotic arm takes vials into a crucible, sets it in a glowing furnace and carries the sample to a test rig that clamps it.',
        human_consequence='Texas A&M materials scientists and students whose release says the process can still take a toll on humans. No person is shown and no outcome is claimed.',
        source_limit='Disclosed illustration of a planned lab. It shows no real Texas A&M building, equipment or measured result, and the release names no melting method.')
    b['cinematic_contract'] = dict(throughline=dict(subject='One alloy candidate and the sample line it would travel, from the mesh of mixes to the melt.',
        opening_state='Several dozen periodic table tiles light on a lab wall.', closing_state='A glowing sample holds on the test rig beside a dimmed recipe card.', scene_ids=ordered),
        turn_scene='s5', button='The recipe card dims and the melt glows, so the AI suggests and the melt answers.')
    b['fingerprint'] = dict(pov=('eye-level-immersive' if variant == 'a' else 'orbital-aerial'),
        motion_vector=('horizontal-traverse' if variant == 'a' else 'scroll-data'),
        hero_treatment=('machine-as-subject' if variant == 'a' else 'record-as-subject'),
        layout=('centered-hero-lowerthird' if variant == 'a' else 'grid-modular'), register='naturalistic-scene',
        camera_strategy=CAMERA[variant]['s1'], light_story='window-soft-amber',
        palette='Warm paper, cool slate steel, post oak green through the window and one amber melt glow',
        metaphor='A trillion recipes and one melt that answers')
    b['divergence_note'] = {'a': 'A follows one sample and the robotic arm at bench level through the line, with the paper records as short inserts, and holds on the melt for its close.',
        'b': 'B reads the same events from above the bench and through the window, so the records, the calendar and the empty gauge come before the arm, and it closes wide on the planned line.'}[variant]
    b['hook_strategy'] = 'visual_anomaly'; b['hook_payoff_s'] = 0.75
    b['cinematic_template'] = 'directed-film-v2'; b['derived_from'] = 'scratch'
    b['daily_production'] = True
    # art direction
    ad = copy.deepcopy(BASE['art_direction'])
    ad['palette'] = dict(background='#CFC7B4', midground='#8D959B', foreground='#3A4147', ink='#1B2227', paper='#F1EAD8', hero='#D9DEE0', accent='#E48A1C')
    ad['palette_reason'] = 'Warm paper carries the records, cool slate steel holds the line, post oak green sits outside the window, the pale shell is the one clean value and a single amber is kept for the melt, the lit tiles and the goal stamp.'
    ad['shape_language'] = 'A rounded arm shell against rectangular steel benches, boxy furnace and rig, and flat paper cards with worn corners. Nothing is symmetric: the tray leans, the stamp lands crooked, the pencil rolls off.'
    ad['lighting'] = dict(motivation='Soft window light from the upper left warms the bench and the paper, cool fill from the right shades the steel, and the amber melt throws its own warm light on the arm.',
                          ambient=0.8, exposure=1.0, key=dict(position=[-6, 5, 4], color='#FFE6BE', intensity=1.8),
                          fill=dict(position=[5, 2, 3], color='#C4D0DE', intensity=0.8), rim=dict(position=[2, 5, -4], color='#FFF1D8', intensity=0.6))
    ad['hero'] = dict(asset=HERO_FILE, silhouette='A rounded multi-axis robotic arm with a two finger gripper beside a crucible furnace and a clamp test rig on a worn steel line.',
                      finish='Lit upper-left shell with a soft highlight, cool shaded right side, scuffed paint, a furnace opening glowing amber with a heat shimmer, a needle gauge and soft contact shadows on worn steel.',
                      subject_ids=['s4-arm', 's6-arm', 's9-arm'])
    ad['focal_hierarchy'] = 'The arm or the glowing melt first, the recipe card or the gauge second, the tags and stamps third, the lab wall and window last.'
    ad['motion_language'] = 'The arm moves with continuous acceleration and braking, cards slide and settle without bounce, stamps land once, the gauge needle swings and settles, and the camera holds while objects perform.'
    ad['shots'] = {}
    ad['signature_shot'] = dict(scene_id='s9', event_id='s9-event-2', reason='The arm tips the crucible and the amber melt pours while the recipe card dims, the whole answer in one movement.')
    ad['flat_shots'] = {sid: dict(scale=1, x=0, y=0, reason='Hold the authored composition; the episode camera moves only with the performing arm, card or stamp.') for sid in ordered}
    b['art_direction'] = ad
    # visual research
    b['visual_research'] = dict(searches=[
        dict(query='Library of Congress Lyda Hill Texas Collection College Station Bryan RELLIS photograph and Texas A&M Aggie AI Foundry images, rights and reuse',
             finding='No College Station, Bryan or RELLIS photograph is in the collection and the release lead photo is Getty Images stock of a generic lab with no licence terms, so no photograph is admitted.'),
        dict(query='Aggie AI Foundry facility footage or rendering from Texas A&M or the WoodNext Foundation',
             finding='None exists. The only rendering found belongs to the separate NSF ARM-MIP facility and needs written permission, so it is not used.')],
        candidates=[dict(url='https://news.engineering.tamu.edu/news/2026/10/22/texas-am-researchers-pursue-autonomous-ai-foundry/', decision='reject',
                         reason='The lead photo is Getty Images stock of a generic lab with no licence terms and does not show the facility.'),
                    dict(url='authored://2026-10-25/foundry-arm-hero', decision='use', reason='Fresh original authored hero group performs the arm, crucible, furnace and test rig.'),
                    dict(url='authored://2026-10-25/foundry-support', decision='use', reason='Fresh original authored support group stages the table, mesh, cards, release, gauge, calendar and stamps.')],
        decision='No external photograph or footage helps tell this story honestly, so fresh authored illustration performs the stated plan with an Illustration disclosure and a PLANNED label.')
    # attention beats and quality plan
    typemap = {}
    beats = []
    for s in scenes:
        for e in s['visual_events']:
            ctype = next(x[5] for x in SCENES[s['id']]['events'] if f"{s['id']}-{x[0]}" == e['id'])
            snd = next(x[8] for x in SCENES[s['id']]['events'] if f"{s['id']}-{x[0]}" == e['id'])
            beats.append(dict(id=f"{e['id']}-attention", event_id=e['id'], item_ids=e['item_ids'], change_type=ctype,
                              visible_change=e['what'], viewer_reward=e['what'],
                              continuity_from='The one alloy candidate and the sample line that every later scene returns to.',
                              sound_action=snd))
    b['attention_beats'] = beats
    b['quality_plan'] = dict(contract_sha256=sha('config/quality_contract.json'), scenes=[
        dict(scene_id=sid, medium='diagram', subject=SCENES[sid]['subject'], action=sc[sid]['visual_events'][0]['what'],
             consequence=sc[sid]['visual_events'][-1]['what'],
             source_basis=f"{SCENES[sid]['claim_note']} Disclosed illustration of the sources. It shows no real building, equipment, person or measured result.",
             medium_evidence='Registered alloy-foundry-v1 with the fresh authored FoundryArmHero and FoundrySupport groups performing board events on the film clock.')
        for sid in ordered])
    b['caption_method'] = 'silence_anchored'
    return b


clock_cache = clause_clock()
if __name__ == '__main__':
    for v in ('a', 'b'):
        board = build(v)
        (OUT / f'opening-{v}.json').write_text(json.dumps(board, indent=1, ensure_ascii=False))
        print(v, len(json.dumps(board)), board['runtime_s'], len(board['film_direction']['shots']), len(board['film_direction']['rewards']))
    (OUT / 'storyboard.json').write_text((OUT / 'opening-a.json').read_text())
