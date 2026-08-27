#!/usr/bin/env bash
# The only full-render entry point. It reserves the spend before Remotion, proves the passing
# animatic belongs to the exact board, then muxes and extracts review frames from what will ship.
set -euo pipefail
cd "$(dirname "$0")/.."

BOARD="out/dispatch/storyboard.json"
MIX="out/dispatch/mix.wav"
CAPTIONS="out/dispatch/captions.json"
STATE="out/dispatch/run_state.json"
PREFLIGHT="out/dispatch/preflight.json"
SILENT="out/dispatch/silent.mp4"
FILM="out/dispatch/film.mp4"
STARTED="out/dispatch/render_started"
MANIFEST="out/dispatch/render-manifest.json"

while [ $# -gt 0 ]; do
  case "$1" in
    --board) BOARD="$2"; shift 2 ;;
    --mix) MIX="$2"; shift 2 ;;
    --captions) CAPTIONS="$2"; shift 2 ;;
    --state) STATE="$2"; shift 2 ;;
    --preflight) PREFLIGHT="$2"; shift 2 ;;
    --silent) SILENT="$2"; shift 2 ;;
    --film) FILM="$2"; shift 2 ;;
    --manifest) MANIFEST="$2"; shift 2 ;;
    *) echo "render_dispatch: unknown argument $1" >&2; exit 2 ;;
  esac
done

for input in "$BOARD" "$MIX" "$CAPTIONS" "$STATE" "$PREFLIGHT"; do
  [ -f "$input" ] || { echo "render_dispatch: missing $input" >&2; exit 2; }
done

python3 scripts/preflight_animatic.py --board "$BOARD" --verify-report "$PREFLIGHT"
python3 scripts/run_controller.py --state "$STATE" consume --resource full_renders \
  --note "full-resolution Dispatch render"

mkdir -p "$(dirname "$SILENT")" "$(dirname "$FILM")"
touch "$STARTED"
BOARD_ABS="$(realpath "$BOARD")"
SILENT_ABS="$(realpath -m "$SILENT")"
(
  cd video-engine
  npx remotion render Dispatch "$SILENT_ABS" --props="$BOARD_ABS" \
    --concurrency=100% --log=warn
)

ffmpeg -v error -y -i "$SILENT" -i "$MIX" -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 320k "$FILM"

python3 scripts/freshness_check.py --film "$FILM" --started "$STARTED" \
  --inputs "$BOARD" "$MIX" "$CAPTIONS"
python3 scripts/render_manifest.py --film "$FILM" --board "$BOARD" --out "$MANIFEST"
bash scripts/extract_frames.sh --film "$FILM" --board "$BOARD" --out "$(dirname "$FILM")"
echo "render_dispatch: full render, mux, freshness, and film-derived frames are complete"
