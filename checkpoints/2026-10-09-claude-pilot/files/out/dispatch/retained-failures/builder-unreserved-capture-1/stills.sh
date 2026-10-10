#!/usr/bin/env bash
SP=/tmp/claude-0/-home-user/17806335-eb01-56a5-8fcf-f21186d58f19/scratchpad
cd /home/user/TexasAIDispatch/video-engine
for v in a b; do while read id view f; do
  npx --no-install remotion still $SP/bundle Dispatch $SP/stills/$v-$id-$view.png --props=$SP/inspect-$v.json --frame=$f --scale=0.5 --log=error >/dev/null 2>&1 || echo "FAIL $v $id"
done < $SP/frames-$v.txt; done
echo done
