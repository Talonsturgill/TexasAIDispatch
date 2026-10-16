"""Stamp the board's renderer_inputs from a repo root that already holds the proposed renderer bytes.
Usage: python stamp_renderer.py <repo_root> <board_in> <board_out>"""
import json, sys
repo, src, dst = sys.argv[1:4]
sys.path.insert(0, repo + '/scripts')
import modern_film
from pathlib import Path
b = json.load(open(src))
b['film_direction']['renderer_inputs'] = modern_film.renderer_inputs(b['film_direction']['episode'], Path(repo))
json.dump(b, open(dst, 'w'), indent=2, ensure_ascii=False)
print('stamped', len(b['film_direction']['renderer_inputs']))
