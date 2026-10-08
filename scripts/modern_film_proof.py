"""Two complete owner-requested engineering treatments; never a shipment package."""
import copy
import json
from pathlib import Path
from modern_film import REPO, renderer_inputs, problems, capture_timing


def board(variant):
    data = json.loads((REPO / 'runs/2026-10-07/storyboard.json').read_text())
    data['reference_only'] = True
    data['story_art'] = json.loads((REPO / 'experiments/modern-film-2026-10-07/story-art.json').read_text())
    data['cinematic_template'] = 'directed-film-v2'
    data['title'] = 'The warmer unit | modern engineering treatment ' + variant.upper()
    art = data['art_direction']
    art['palette'] = dict(background='#CBD5D6', midground='#91A9B4', foreground='#304B59',
                          ink='#162733', paper='#FFF4DD', hero='#66ADA5', accent='#E76E50')
    art['palette_reason'] = 'Cool teal equipment and warm coral heat separate the reported clue from the inspected outcome.'
    art['hero']['asset'] = 'video-engine/src/modern/CoolingAssets.tsx'
    art['hero']['finish'] = 'Rounded lit metal housing, recessed grilles, surface highlights, copper pipe, grounded feet and source-bound qualitative heat.'
    art['lighting']['motivation'] = 'A soft warm upper-left work light models the cabinet while cool room fill preserves its recessed grilles.'
    rows = [
        ('s1',0,2.1,'thermal-detail','detail',1,'A large warm cabinet poses the first physical question.'),
        ('s1',2.1,4.5,'paired-room','wide',2,'The room reveals the cool comparison unit and conserves the first cabinet.'),
        ('s2',4.5,7,'paired-room','medium',1,'The inspecting lens moves into the same two-unit example.'),
        ('s2',7,9.7,'inspection-lens','close',2,'The foreground lens makes the robot inspection visible at phone size.'),
        ('s2',9.7,11.42,'inspection-lens','detail',3,'The physical flag lands on the unit the vendor says needed a check.'),
        ('s3',11.42,13.2,'tool-check','medium',1,'A gloved hand brings a separate handheld instrument to the same unit.'),
        ('s3',13.2,14.62,'tool-check','detail',3,'The close check makes the human confirmation distinct from the robot flag.'),
        ('s4',14.62,17.5,'repair-detail','detail',1,'A generic repair gesture illustrates the reported repair without diagnosing a component.'),
        ('s4',17.5,20.32,'cool-result','medium',2,'The original unit returns to cool and its checked work card carries the reported outcome.'),
        ('s5',20.32,23.2,'intermittent-detail','close',1,'The second unit is now the subject and its qualitative heat rises.'),
        ('s5',23.2,25.8,'intermittent-detail','detail',2,'The heat falls again to express intermittent spikes rather than a confirmed persistent fault.'),
        ('s5',25.8,28.36,'pending-work','medium',3,'A flag and unfilled work card leave the second unit visibly awaiting inspection.'),
        ('s6',28.36,31.7,'source-update','close',1,'A reproduced update labels the vendor source and its ongoing pilot date.'),
        ('s6',31.7,34.7,'limit-bookend','wide',2,'The two conserved units now show a completed check and an unresolved flag together.'),
        ('s6',34.7,37.86,'limit-bookend','medium',3,'The completed first work card and blank second work card answer the opening without granting certainty to the robot.')]
    if variant == 'b':
        rows[0] = (*rows[0][:3], 'paired-room','medium',1,
                   'The opening immediately contrasts both units, with the inspecting lens entering the same room.')
        rows[1] = (*rows[1][:3], 'thermal-detail','detail',2,
                   'A close thermal clue isolates the warmer unit after the initial side-by-side comparison.')
        rows[2] = (*rows[2][:3], 'inspection-lens','close',1,
                   'The inspecting lens leads the viewer into the reported pilot before the two-unit context returns.')
        rows[3] = (*rows[3][:3], 'paired-room','wide',2,
                   'A wide comparison identifies the cabinet that the foreground lens was examining.')
    shots=[]
    for i,(sid,start,end,view,size,event,purpose) in enumerate(rows):
        shots.append(dict(id=f'shot-{i+1}',scene_id=sid,start_s=start,duration_s=round(end-start,3),
                          view=view,framing=size,transition='match' if i in (1,6,8,13) else 'cut',
                          event_id=f'{sid}-event-{event}',purpose=purpose,
                          carry='The same two generic units retain their identity plaques, heat state and reported outcome.'))
    rewards=[]
    for scene in data['scenes']:
        for event in scene['visual_events']:
            at=scene['start_s']+event['at_s']+event['duration_s']*.5
            shot=next(s for s in shots if s['start_s']<=at<s['start_s']+s['duration_s'])
            rewards.append(dict(event_id=event['id'],shot_id=shot['id'],at_s=round(at,4),
                                kind='consequence' if event['id'].endswith('3') else 'action',
                                visible_change=shot['purpose']))
    data['film_direction']=dict(version='directed-film-v2',episode='cooling-check-v2',variant=variant,
       renderer_inputs=renderer_inputs('cooling-check-v2'),
       angle='A robot flag becomes a reported repair only after a separate check; the second unit remains unresolved.',
       opening_promise='Which warmer cooling unit led to a checked repair, and which signal still needs inspection?',
       performed_turn='The second cabinet gains a flag and blank work card rather than the first cabinet\'s completed check.',
       closing_answer='One checked outcome and one unresolved work card show why the robot initiates rather than completes maintenance.',
       shots=shots,rewards=rewards)
    capture_timing(data)
    return data


if __name__=='__main__':
    target=REPO/'experiments/modern-film-2026-10-07'
    target.mkdir(parents=True,exist_ok=True)
    for variant in ('a','b'):
        data=board(variant)
        errors=problems(data)
        if errors:raise ValueError('; '.join(errors))
        (target/f'board-{variant}.json').write_text(json.dumps(data,indent=2)+'\n')
    print('Two complete engineering boards generated; both use the original narration and event clock.')
