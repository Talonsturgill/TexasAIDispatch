import json, sys
from pathlib import Path
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(Path(__file__).parent))
from spec import *
reg_path = REPO / 'config/modern_episode_registry.json'
reg = json.loads(reg_path.read_text())
boards = {v: json.loads((REPO / f'out/dispatch/opening-{v}.json').read_text()) for v in 'ab'}
views, nv = set(), {}
for v, b in boards.items():
    scene_subjects = {s['id']: sorted({i for e in s['visual_events'] for i in e['item_ids']}) for s in b['scenes']}
    for sh in b['film_direction']['shots']:
        views.add(sh['view'])
        sid = sh['scene_id']
        entry = nv.setdefault(sh['view'], {'subject_ids': set(), 'action_ids': set()})
        entry['subject_ids'] |= set(scene_subjects[sid]); entry['action_ids'].add(SCENES[sid]['action'])
nv = {k: {'subject_ids': sorted(v['subject_ids']), 'action_ids': sorted(v['action_ids'])} for k, v in sorted(nv.items())}
wall = ['wall-display', 'quote-card', 'calendar-months', 'week-strip', 'date-field', 'goal-tag-close', 'quote-over', 'headline-close', 'form-wide']
hero_scenes = {'s4', 's6', 's9'}
hero_views = sorted({sh['view'] for b in boards.values() for sh in b['film_direction']['shots'] if sh['scene_id'] in hero_scenes})
reg['episodes'][EPISODE] = {
    'module': DIR + 'AlloyFoundryFilm.tsx',
    'assets': [HERO_FILE, SUPPORT_FILE, 'video-engine/src/lib/direction.ts'],
    'views': sorted(views), 'wall_views': sorted(set(wall) & views),
    'subject': 'A planned automated alloy line where an AI panel proposes a recipe and a generic robotic arm mixes, melts and tests it, and the records around it: a periodic table of lit tiles and a mesh of mixes, recipe cards piling over a bench, a news release card with a dateline and grant tag, a quote card with a prediction gauge, calendar pages and a week strip, a GOAL stamp and a blank opening date field',
    'note': 'Fresh authored Claude-lane episode for 2026-10-25 (Texas A&M Engineering News of October 22nd, 2026 on the Aggie AI Foundry). Hero FoundryArmHero and support FoundrySupport are original React and SVG groups shared by both treatments. A follows the sample and the arm at bench level, B reads the same events from above the bench and through the window. Disclosed illustration of a planned lab, no brand marks, no real building, equipment, person or measured result.',
    'narration_views': nv,
    'authored_art': [
        {'role': 'hero', 'module': HERO_FILE, 'export': 'FoundryArmHero', 'views': hero_views},
        {'role': 'support', 'module': SUPPORT_FILE, 'export': 'FoundrySupport', 'views': sorted(views)}]}
reg_path.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + '\n')
print(len(views), 'views', len(set(wall) & views), 'wall')
