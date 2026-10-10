"""Run gate functions with ONLY the authored-entries recording check stubbed (director records later)."""
import sys, json, io, contextlib
sys.path.insert(0,'/home/user/TexasAIDispatch/scripts')
import authored_story_art as asa
orig=asa.problems
MSG='both fresh authored source groups must be recorded before animation'
def patched(board, repo=asa.REPO):
    errs=orig(board,repo)
    return [e for e in errs if e!=MSG] if errs==[MSG] else errs
asa.problems=patched
import story_art, modern_film, storyboard_check, watchability_check, documentary_check, shot_coherence, creative_production
for path in sys.argv[1:]:
    b=json.load(open(path))
    print('#####',path)
    print('request_problems', asa.request_problems(b))
    print('modern_film', modern_film.problems(b))
    print('creative plan', creative_production.plan_problems(b))
    print('shot_coherence', shot_coherence.check(b))
    print('watchability', watchability_check.check(b, open('/home/user/TexasAIDispatch/video-engine/src/Dispatch.tsx').read()))
    print('documentary', documentary_check.check(b))
    print('storyboard', storyboard_check.check(b))
