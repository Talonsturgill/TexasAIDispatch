import sys,json
sys.path.insert(0,'/home/user/ed1015/fix2/scripts')
import vo_align as v
x,r=v.read_wav(v.Path('/home/user/ed1015/TexasAIDispatch/out/dispatch/mix_vo.wav'))
runs=v.speech_runs(x,r)
raw=json.load(open('/home/user/ed1015/TexasAIDispatch/out/dispatch/acoustic-asr.json'))
h=v.acoustic_words(raw)
print([ (round(a,2),round(b,2)) for a,b in runs][-9:])
for w in h:
    if len(v.canonical(w['text']))>1: print(w)
m,e=v.merge_internal_pauses(runs,h);print(len(runs),len(m),e)
