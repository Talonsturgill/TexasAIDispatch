"""Write the solved camera boxes into NoteCheckFilm.tsx's BOXES table (only views the boards use)."""
import json, re, sys
SP, FILM = sys.argv[1], sys.argv[2]
res = json.load(open(f'{SP}/solve.json'))
SCENE = {'room': 's1', 'post': 's2', 'rollout': 's3', 'release': 's4', 'framework': 's5', 'link': 's6',
         'bill': 's7', 'review': 's8', 'scope': 's9', 'answer': 's10'}
src = open(FILM).read()
start = src.index('export const BOXES:Record<string,Boxes>={')
end = src.index('};', start) + 2
body = src[start:end]
rows = {}
for m in re.finditer(r"\n (s\d+):\{(.*?)\},(?=\n)", body):
    rows[m.group(1)] = m.group(2)
def parse_row(text):
    out = {}
    for k, v in re.findall(r"(wide|medium|close|detail|check|split):(\[\[.*?\]\]|\[[^\[\]]*\])", text):
        out[k] = json.loads(v)
    return out
table = {sid: parse_row(t) for sid, t in rows.items()}
changed = []
for view, r in res.items():
    prefix, kind = view.rsplit('-', 1)
    sid = SCENE[prefix]
    if r.get('identity') or r.get('fail'):
        continue
    def rnd(b): return [round(v, 1) for v in b]
    if 'panes' in r:
        table[sid]['split'] = [rnd(p['box']) for p in r['panes']]
    else:
        table[sid][kind] = rnd(r['box'])
    changed.append(view)
order = ['wide', 'medium', 'close', 'detail', 'check', 'split']
lines = ['export const BOXES:Record<string,Boxes>={']
for sid in sorted(table, key=lambda s: int(s[1:])):
    parts = [f"{k}:{json.dumps(table[sid][k], separators=(',', ':'))}" for k in order if k in table[sid]]
    lines.append(f" {sid}:{{{','.join(parts)}}},")
lines.append('};')
src = src[:start] + '\n'.join(lines) + src[end:]
open(FILM, 'w').write(src)
print('wrote', sorted(changed))
