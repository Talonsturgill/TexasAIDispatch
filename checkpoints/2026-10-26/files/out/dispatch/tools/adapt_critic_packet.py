import sys, json
sys.path.insert(0, 'scripts')
import claude_runtime as c
d = json.load(open('out/dispatch/critic-packet.json'))
d = c.adapt_packet(d)
open('out/dispatch/critic-packet.json', 'w').write(json.dumps(d, indent=1))
print('bindings', 'code_report_bindings' in d, 'conditional' , 'conditional_recovery' in d)
