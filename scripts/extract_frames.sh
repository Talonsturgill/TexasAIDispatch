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
OUT=out/dispatch
while [ $# -gt 0 ]; do
  case "$1" in
    --film) FILM="$2"; shift 2 ;;
    --board) BOARD="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    *) echo "extract_frames: unknown argument $1" >&2; exit 2 ;;
  esac
done
[ -f "$FILM" ] || { echo "no film at $FILM"; exit 2; }
[ -f "$BOARD" ] || { echo "no board at $BOARD"; exit 2; }
mkdir -p "$OUT"

rm -f "$OUT"/scene_s*.png "$OUT"/poster.png "$OUT"/credits_frame.png

FRAME_LIST=$(mktemp)
trap 'rm -f "$FRAME_LIST"' EXIT
python3 - "$BOARD" <<'PY' > "$FRAME_LIST"
import json, sys
b = json.load(open(sys.argv[1]))
for s in b['scenes']:
    print(s['id'], round(float(s['start_s']) + float(s['duration_s']) * 0.5, 3))
PY

while read -r id t; do
  ffmpeg -y -ss "$t" -i "$FILM" -frames:v 1 "$OUT/scene_$id.png" \
    -loglevel error </dev/null
done < "$FRAME_LIST"

DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$FILM")
# THE POSTER IS TAKEN AFTER THE TYPE HAS SETTLED, NOT AT THE HEAD OF THE FILM.
# At 0.4s the super and the caption plate are still fading up, so the feed thumbnail
# shipped a grey title and a grey chip over pale sky and was the least legible frame in
# the film. All three scorers said so independently, and one of them read it as the
# picture being washed out rather than as the capture being early. A poster is a still
# that has to work alone; it is taken where the frame is finished.
ffmpeg -y -ss 1.9 -i "$FILM" -frames:v 1 "$OUT/poster.png" -loglevel error </dev/null
ffmpeg -y -ss "$(python3 -c "print(max(0,$DUR-0.6))")" -i "$FILM" -frames:v 1 \
  "$OUT/credits_frame.png" -loglevel error </dev/null

ls -1 "$OUT"/scene_s*.png "$OUT"/poster.png "$OUT"/credits_frame.png
echo "frames extracted from $FILM (duration ${DUR}s)"
