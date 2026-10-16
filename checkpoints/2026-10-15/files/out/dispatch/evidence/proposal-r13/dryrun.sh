#!/bin/sh
# Rebuild the R12 proposal and run the measured chain on a scratch copy (/home/user/ed1015/dry). Diagnostic only.
set -e
R=/home/user/ed1015/TexasAIDispatch; D=/home/user/ed1015/dry; P=$R/out/dispatch/evidence/proposal-r13; L=$R/out/dispatch
cd $R && python3 $P/build_split.py
cp $P/FloodStationFilm.tsx $D/video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx
cp $P/modern_episode_registry.json $D/config/modern_episode_registry.json
cd $D && bash scripts/run_with_env.sh sh -c "cd $D && python $P/stamp_renderer.py $D $P/storyboard-a.json $P/storyboard-a-stamped.json"
python3 - <<PY
import json
b=json.load(open('$P/storyboard-a-stamped.json')); b['runtime_s']=${RUNTIME:-59.5}
json.dump(b,open('$D/out/dispatch/storyboard.json','w'),indent=2,ensure_ascii=False)
PY
cp $L/sfx_events.json $L/words.json $L/captions.json $D/out/dispatch/
rm -rf $D/out/dispatch/precheck-last
bash scripts/run_with_env.sh sh -c "cd $D && python scripts/vo_align.py --wav $L/mix.wav --script out/dispatch/vo_script.txt --voice $L/mix_vo.wav --out out/dispatch --cuts out/dispatch/storyboard.json --clause-boundaries && python scripts/board_captions.py --board out/dispatch/storyboard.json --captions out/dispatch/captions.json && python scripts/board_retime.py --board out/dispatch/storyboard.json --words out/dispatch/words.json --captions out/dispatch/captions.json --sfx out/dispatch/sfx_events.json && python scripts/picture_precheck.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --out out/dispatch/precheck-last" 2>&1 | tail -16
