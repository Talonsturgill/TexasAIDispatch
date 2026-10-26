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
wall = WALL_VIEWS
hero_scenes = {'s3', 's4', 's6', 's10'}
hero_views = sorted({sh['view'] for b in boards.values() for sh in b['film_direction']['shots'] if sh['scene_id'] in hero_scenes})
reg['episodes'][EPISODE] = {
    'module': FILM_FILE,
    'assets': [HERO_FILE, SUPPORT_FILE, 'video-engine/src/lib/direction.ts'],
    'views': sorted(views), 'wall_views': sorted(set(wall) & views),
    'subject': 'A small restaurant where an AI host takes orders by table code and phone and payment comes before cooking, and the records around it: a ledger card with a monthly tag and an owner count stamp, a federal rule card with a no tip credit box, a restaurant folder with the same box blank, a customer quote card and a tip jar with owner says and no record shown tags',
    'note': 'Fresh authored Claude-lane episode for 2026-10-26 (FOX 26 Houston of October 20th, 2026, Muslim Mirror of October 19th and KPRC Click2Houston of October 21st on Wok and Karahi in Spring). Hero OrderRigHero and support RestaurantSupport are original React and SVG groups shared by both treatments. A follows one order at counter level, B reads the same events from above the dining room and the back desk. Disclosed illustration of reports, no brand marks, no real restaurant, software, person or pay record.',
    'narration_views': nv,
    'authored_art': [
        {'role': 'hero', 'module': HERO_FILE, 'export': 'OrderRigHero', 'views': hero_views},
        {'role': 'support', 'module': SUPPORT_FILE, 'export': 'RestaurantSupport', 'views': sorted(views)}]}
reg_path.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + '\n')
print(len(views), 'views', len(set(wall) & views), 'wall')
