import sys, json
sys.path.insert(0, 'scripts')
import daily_production as dp
dp.handoff_limit = lambda d, c: 10 ** 9
d = dp.packet('out/dispatch/storyboard.json', 'out/dispatch/claims.json', 'scene-builder', sys.argv[2] if len(sys.argv) > 2 else None)
text = json.dumps(d, separators=(',', ':')) + '\n'
open(sys.argv[1], 'w').write(text)
print('compact packet chars', len(text))
