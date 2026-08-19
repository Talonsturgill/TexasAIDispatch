#!/usr/bin/env bash
# EXTRACT THE PANEL'S FRAMES FROM THE FILM, NEVER FROM THE ENGINE.
#
# The scorers were being shown stills rendered by `remotion still` off the same board the
# film was rendered from. That looks equivalent and is not: it is a SECOND render, so it
# cannot catch the one thing a still is there to catch, which is the film disagreeing with
# the board. A run already shipped a cut whose opening scene did not match its board and
# whose caption list was two passes old, and every still it showed the panel was clean,
# because the stills were made from the board rather than from the film.
#
# One frame per scene, taken from film.mp4 at the scene's own midpoint, plus the poster and
# the last frame so the credits card is looked at by somebody.
set -euo pipefail
cd "$(dirname "$0")/.."
FILM=out/dispatch/film.mp4
BOARD=out/dispatch/storyboard.json
[ -f "$FILM" ] || { echo "no film at $FILM"; exit 2; }

rm -f out/dispatch/scene_s*.png out/dispatch/poster.png out/dispatch/credits_frame.png

python3 - "$BOARD" <<'PY' > /tmp/_frames.txt
import json, sys
b = json.load(open(sys.argv[1]))
for s in b['scenes']:
    print(s['id'], round(float(s['start_s']) + float(s['duration_s']) * 0.5, 3))
PY

while read -r id t; do
  npx --prefix video-engine remotion ffmpeg -y -ss "$t" -i "$FILM" -frames:v 1 \
    "out/dispatch/scene_$id.png" -loglevel error </dev/null
done < /tmp/_frames.txt

DUR=$(npx --prefix video-engine remotion ffprobe "$FILM" 2>&1 | grep -oE "Duration: [0-9:.]+" | head -1 | sed -E "s/Duration: ([0-9]+):([0-9]+):([0-9.]+)/\1 \2 \3/" | awk "{print \$1*3600+\$2*60+\$3}")
# THE POSTER IS TAKEN AFTER THE TYPE HAS SETTLED, NOT AT THE HEAD OF THE FILM.
# At 0.4s the super and the caption plate are still fading up, so the feed thumbnail
# shipped a grey title and a grey chip over pale sky and was the least legible frame in
# the film. All three scorers said so independently, and one of them read it as the
# picture being washed out rather than as the capture being early. A poster is a still
# that has to work alone; it is taken where the frame is finished.
npx --prefix video-engine remotion ffmpeg -y -ss 1.9 -i "$FILM" -frames:v 1 \
  out/dispatch/poster.png -loglevel error </dev/null
npx --prefix video-engine remotion ffmpeg -y -ss "$(python3 -c "print(max(0,$DUR-0.6))")" \
  -i "$FILM" -frames:v 1 out/dispatch/credits_frame.png -loglevel error </dev/null

ls -1 out/dispatch/scene_s*.png out/dispatch/poster.png out/dispatch/credits_frame.png
echo "frames extracted from $FILM (duration ${DUR}s)"
