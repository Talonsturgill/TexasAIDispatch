#!/bin/sh
# Measured chain for treatment B on a scratch copy (live files untouched). Fails on any step.
set -e
R=/home/user/ed1015/TexasAIDispatch; L=$R/out/dispatch; S=$L/evidence/proposal-r14/scratch-b
cd $R && bash scripts/run_with_env.sh sh -c "set -e; cd $R && python scripts/vo_align.py --wav $L/mix.wav --script $S/vo_script.txt --voice $L/mix_vo.wav --out $S --cuts $S/storyboard.json --clause-boundaries && python scripts/board_captions.py --board $S/storyboard.json --captions $S/captions.json && python scripts/board_retime.py --board $S/storyboard.json --words $S/words.json --captions $S/captions.json"
