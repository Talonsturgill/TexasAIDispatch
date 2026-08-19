#!/usr/bin/env bash
# Wait out the render, then mux, prove freshness, and extract the panel's frames.
# One script rather than a chain of shell calls, because a multi-line command passed
# through the tool gets flattened onto one line and `done echo ...` is not a program.
set -uo pipefail
cd /home/user/TexasAIDispatch

# NEVER `while pgrep -f "<pattern>"` here. This script's own command line contains
# whatever pattern it waits on, so the loop matches itself and spins forever. It did
# exactly that and looked like a slow render for forty minutes. `waitfor.sh` excludes
# the ancestor chain and carries a hard deadline, and its --self-test proves both.
# The render log path is an ARGUMENT with a default, not a literal. It was literal, so every
# round edited this file to bump render6 to render7, which is a source change with no meaning
# that shows up in every diff and is one typo away from tailing the previous round's log and
# reporting the previous round's result.
LOG="${1:-/tmp/render.log}"

source "$(dirname "$0")/waitfor.sh"
wait_for_pattern "remotion render Dispatch" 2400 || {
  echo "render did not finish inside the deadline" >&2; exit 3; }
echo "RENDER: $(tail -1 "$LOG")"

cd video-engine
npx remotion ffmpeg -y -i ../out/dispatch/silent.mp4 -i ../out/dispatch/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k ../out/dispatch/film.mp4 \
  -loglevel error </dev/null
echo "MUX exit=$?"
cd /home/user/TexasAIDispatch

for f in silent.mp4 mix.wav film.mp4; do
  printf '%-11s ' "$f"
  npx --prefix video-engine remotion ffprobe "out/dispatch/$f" 2>&1 </dev/null \
    | grep -oE 'Duration: [0-9:.]+' | head -1
done

python3 scripts/freshness_check.py --film out/dispatch/film.mp4 \
  --started out/dispatch/render_started \
  --inputs out/dispatch/storyboard.json out/dispatch/mix.wav out/dispatch/captions.json
echo "freshness exit=$?"

bash scripts/extract_frames.sh 2>&1 | tail -2
