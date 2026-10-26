"""After make_boards.py: attach recorded art entries and the native_media inventory to both treatment boards."""
import json
from pathlib import Path
D = Path(__file__).resolve().parents[1]
ent = json.loads((D / 'tools/entries.json').read_text())
claims = [c['id'] for c in json.loads((D / 'claims.json').read_text())['claims']]
SUBJ = {
 'order-rig-hero': ('A generic phone over a table code, a menu with a tapped dish, a pay button that turns to a paid mark, a kitchen ticket printer that prints only after the paid mark arrives, a wok that flares and a tip jar with tags, performing the reported pay-first order',
                    'Carries the one order and its money through the film: the scan, the tap, the paid mark, the printed ticket, the flare and the jar.', ['s3', 's4', 's6', 's10']),
 'restaurant-support': ('A small restaurant room, an empty sign frame, a host panel named Haniya, a ledger card with a monthly tag and an owner count stamp, a federal rule card, a folder with a blank box, a customer quote card and the tags',
                        'Stages the room and the records the sentences cite so each limit has a drawn object.', [f's{i}' for i in range(1, 11)])}
rows = []
for e in ent:
    subject, relevance, scenes = SUBJ[e['request_id']]
    rows.append({k: e[k] for k in ('request_id', 'file', 'sha256', 'request_sha256', 'creation_id', 'created_at', 'tool')} | {
        'source_url': f"authored://2026-10-26/{e['request_id']}", 'original_url': f"authored://2026-10-26/{e['request_id']}",
        'subject': subject, 'relevance': relevance,
        'inspection': 'Authored in this edition, type-checked and gate-checked; rendered pixels still need the independent code, phone and final reviews.',
        'rights_basis': 'Fresh original authored React and SVG illustration created for this edition; no third-party image.',
        'basis': 'Disclosed original illustration of reported statements, with a generic phone, printer and jar and no brand marks. It is not observed footage, the restaurant, its software, a pay record or a measured result.',
        'story_role': 'context', 'scene_ids': scenes, 'claim_ids': None})
for v in 'ab':
    p = D / f'opening-{v}.json'; b = json.loads(p.read_text())
    used = sorted({c for sc in b['scenes'] for c in (sc.get('vo_claims') or [])}, key=lambda x: int(x[1:]))
    b['story_art']['entries'] = ent; b['native_media'] = [dict(r, claim_ids=used) for r in rows]
    p.write_text(json.dumps(b, indent=1, ensure_ascii=False))
(D / 'storyboard.json').write_text((D / 'opening-a.json').read_text())
print('ok', len(rows))
