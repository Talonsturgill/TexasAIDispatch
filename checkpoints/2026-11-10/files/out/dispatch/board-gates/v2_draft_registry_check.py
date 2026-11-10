import json, os, sys, shutil
from pathlib import Path
REPO = Path('/home/user/dispatch-editions/2026-11-10/TexasAIDispatch')
sys.path.insert(0, str(REPO / 'scripts'))
import modern_film
tmp = REPO / 'out/dispatch/board-gates/tmp-draft-repo'
if tmp.exists(): shutil.rmtree(tmp)
tmp.mkdir()
for child in REPO.iterdir():
    if child.name in ('config', 'out', '.git'): continue
    os.symlink(child, tmp / child.name)
shutil.copytree(REPO / 'config', tmp / 'config')
reg = json.loads((REPO / 'config/modern_episode_registry.json').read_text())
reg['episodes'].update(json.loads((REPO / 'out/dispatch/board-gates/registry-entry-draft.json').read_text()))
(tmp / 'config/modern_episode_registry.json').write_text(json.dumps(reg, indent=2))
board = json.loads((REPO / sys.argv[1]).read_text())
script = (REPO / 'out/dispatch/vo_script.txt').read_text()
claims = json.loads((REPO / 'out/dispatch/claims.json').read_text())
errs = modern_film.problems(board, repo=tmp) + modern_film.narration_problems(board, script=script, claims=claims, repo=tmp)
shutil.rmtree(tmp)
for e in errs: print(e)
print('PROBLEMS', len(errs))
sys.exit(1 if errs else 0)
