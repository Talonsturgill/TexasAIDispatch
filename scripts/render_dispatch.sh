#!/usr/bin/env bash
# The only full-render entry point. It reserves the spend before Remotion, proves the passing
# animatic belongs to the exact board, then muxes and extracts review frames from what will ship.
set -euo pipefail
cd "$(dirname "$0")/.."

# A caller may export this before launching bash, but macOS strips DYLD_* variables when a
# protected system shell starts. Restore the lookup beside Remotion's bundled ffmpeg here, in
# the process that actually launches it. Other platforms simply keep their existing PATH.
COMPOSITOR_BIN="$PWD/video-engine/node_modules/@remotion/compositor-darwin-arm64"
if [ -x "$COMPOSITOR_BIN/ffmpeg" ]; then
  export PATH="$COMPOSITOR_BIN:$PATH"
  export DYLD_LIBRARY_PATH="$COMPOSITOR_BIN${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi

BOARD="out/dispatch/storyboard.json"
MIX="out/dispatch/mix.wav"
CAPTIONS="out/dispatch/captions.json"
STATE="out/dispatch/run_state.json"
PREFLIGHT="out/dispatch/preflight.json"
PREFLIGHT_FILM="out/dispatch/preflight.mp4"
SILENT="out/dispatch/silent.mp4"
FILM="out/dispatch/film.mp4"
STARTED="out/dispatch/render_started"
MANIFEST="out/dispatch/render-manifest.json"
RESCUE_REPORT="out/dispatch/rescue.json"

while [ $# -gt 0 ]; do
  case "$1" in
    --board) BOARD="$2"; shift 2 ;;
    --mix) MIX="$2"; shift 2 ;;
    --captions) CAPTIONS="$2"; shift 2 ;;
    --state) STATE="$2"; shift 2 ;;
    --preflight) PREFLIGHT="$2"; shift 2 ;;
    --preflight-film) PREFLIGHT_FILM="$2"; shift 2 ;;
    --silent) SILENT="$2"; shift 2 ;;
    --film) FILM="$2"; shift 2 ;;
    --started) STARTED="$2"; shift 2 ;;
    --manifest) MANIFEST="$2"; shift 2 ;;
    --rescue-report) RESCUE_REPORT="$2"; shift 2 ;;
    *) echo "render_dispatch: unknown argument $1" >&2; exit 2 ;;
  esac
done

for input in "$BOARD" "$MIX" "$CAPTIONS" "$STATE"; do
  [ -f "$input" ] || { echo "render_dispatch: missing $input" >&2; exit 2; }
done

mkdir -p "$(dirname "$SILENT")" "$(dirname "$FILM")"
REVIEW_ONLY=0
RESCUE_REASON=""
RESERVED=1
if ! python3 scripts/run_controller.py --state "$STATE" consume --resource full_renders \
  --note "full-resolution Dispatch render"; then
  RESERVED=0
  if python3 scripts/run_controller.py --state "$STATE" check-deliverable; then
    echo "render_dispatch: render allowance closed; preserving the immutable last-good video"
    exit 0
  fi
  RESCUE_REASON="render allowance closed before any playable video existed"
fi

PRIMARY_OK=0
if [ "$RESERVED" -eq 1 ] && [ -f "$PREFLIGHT" ] && [ -f "$PREFLIGHT_FILM" ] \
   && python3 scripts/generated_media.py --board "$BOARD" --verify \
   && python3 scripts/preflight_animatic.py --board "$BOARD" --film "$PREFLIGHT_FILM" \
      --verify-report "$PREFLIGHT"; then
  touch "$STARTED"
  BOARD_ABS="$(realpath "$BOARD")"
  # BSD realpath on macOS has no GNU `-m` flag. The output directory already exists, so
  # resolve that directory and append the filename without requiring the file to exist yet.
  SILENT_DIR_ABS="$(cd "$(dirname "$SILENT")" && pwd)"
  SILENT_ABS="$SILENT_DIR_ABS/$(basename "$SILENT")"
  if (
    cd video-engine
    npx remotion render Dispatch "$SILENT_ABS" --props="$BOARD_ABS" \
      --concurrency=100% --log=warn
  ) && ffmpeg -v error -y -i "$SILENT" -i "$MIX" -map 0:v:0 -map 1:a:0 \
       -c:v copy -c:a aac -b:a 320k "$FILM"; then
    PRIMARY_OK=1
  else
    RESCUE_REASON="full-resolution render or final audio mux failed"
  fi
elif [ -z "$RESCUE_REASON" ]; then
  RESCUE_REASON="no passing hash-bound final-board animatic was available to the full renderer"
fi

if [ "$PRIMARY_OK" -eq 0 ]; then
  REVIEW_ONLY=1
  touch "$STARTED"
  python3 scripts/rescue_video.py --board "$BOARD" --mix "$MIX" \
    --preflight "$PREFLIGHT_FILM" --preflight-report "$PREFLIGHT" \
    --out "$FILM" --report "$RESCUE_REPORT" --reason "$RESCUE_REASON"
else
  rm -f "$RESCUE_REPORT"
fi

python3 scripts/generated_media.py --board "$BOARD" --verify
python3 scripts/freshness_check.py --film "$FILM" --started "$STARTED" \
  --inputs "$BOARD" "$MIX" "$CAPTIONS"
python3 scripts/render_manifest.py --film "$FILM" --board "$BOARD" --out "$MANIFEST"
if [ "$REVIEW_ONLY" -eq 1 ]; then
  python3 scripts/run_controller.py --state "$STATE" register-deliverable \
    --film "$FILM" --board "$BOARD" --manifest "$MANIFEST" \
    --review-only --reason "$RESCUE_REASON"
else
  python3 scripts/run_controller.py --state "$STATE" register-deliverable \
    --film "$FILM" --board "$BOARD" --manifest "$MANIFEST"
fi
bash scripts/extract_frames.sh --film "$FILM" --board "$BOARD" --out "$(dirname "$FILM")"
if [ "$REVIEW_ONLY" -eq 1 ]; then
  echo "render_dispatch: full renderer failed; playable review rescue registered, never publish it"
else
  echo "render_dispatch: full render, mux, freshness, and film-derived frames are complete"
fi
