#!/bin/bash
# usage: try.sh src.wav tag maxsil minsil
cd /home/user/dispatch-editions/2026-10-24/TexasAIDispatch
/usr/bin/python3 scripts/compact_take.py --source $1 --out out/dispatch/trial/$2.wav --report out/dispatch/trial/$2.json --max-silence $3 --min-silence $4 2>&1 | tail -1
/usr/bin/python3 scripts/mix.py --board out/dispatch/storyboard.json --vo out/dispatch/trial/$2.wav --sfx out/dispatch/sfx_events.json --bed out/dispatch/music_bed.wav --bed-track sincerely --bed-manifest out/dispatch/music_bed.json --bed-gap-db 19 --vo-at 0.48 --out out/dispatch/trial/$2_mix.wav --cut 64.92 2>&1 | tail -1
mkdir -p out/dispatch/trial/$2_o
cd scripts
/usr/bin/python3 - <<P 2>&1 | tail -25
import sys
sys.path.insert(0,'.')
import vo_align as v
orig=v.split_at_clauses
def dbg(groups,words,clauses):
    _,bd=v.clause_contract(words,clauses)
    for i in sorted(bd):
        w=words[i];a=words[i+1]
        print(i,w['word'],a['word'],round(a['start']-w['end'],3),w.get('anchored_end'),a.get('anchored_start'))
    return orig(groups,words,clauses)
v.split_at_clauses=dbg
sys.argv=['vo_align','--wav','../out/dispatch/trial/$2_mix.wav','--script','../out/dispatch/vo_script.txt','--voice','../out/dispatch/trial/$2_mix_vo.wav','--out','../out/dispatch/trial/$2_o','--cuts','../out/dispatch/storyboard.json','--clause-boundaries']
sys.exit(v.main())
P
