#!/usr/bin/env bash
# deliver_run.sh — Phase 7, as a program rather than as a sequence a run retypes each day.
#
# WHY THIS FILE EXISTS
#
# Phase 7 is six steps that must happen in one order, and the order is the whole point: the
# variety ledger is written BEFORE the merge, because a run that ships without being recorded is
# a run the next one is free to re-skin. Typed out by hand each day it is six chances to do them
# in the wrong order, to skip the ledger, or to copy a film that is older than the board it is
# supposed to render. Every one of those leaves a green-looking run and a wrong repo.
#
# So the ordering is code now. What this script REFUSES to do is the load-bearing part:
#
#   - It re-runs the gates by EXIT CODE first, and stops on any red. A delivery is the one
#     moment a stale green is unrecoverable, because the merge publishes it.
#   - It re-proves freshness of the film against the board, the mix and the captions. The board
#     is the props, so a film older than the board is a film of a different show.
#   - It refuses to overwrite a run directory whose film is NEWER than out/dispatch/film.mp4,
#     which is the shape "deleting or overwriting shipped run artifacts" takes in practice.
#   - It never silences a git write. `run_discipline.py` rule 2 exists because
#     `git commit >/dev/null` hid a commit that did not happen.
#
# PR and merge stay OUT of this script on purpose. They go through the GitHub tools, which this
# environment has and a shell does not, and a half-written `gh` fallback here would be a second
# path that is wrong the first time anyone uses it.
#
#   bash scripts/deliver_run.sh --verify-only
#   bash scripts/deliver_run.sh --date 2026-08-18 --topic "..." --slug horizon-access \
#        --beat science-machines --entities "tacc,horizon,round rock,abilene"
#
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"

DATE=""; TOPIC=""; SLUG=""; BEAT=""; ENTITIES=""; SKIP_PUSH=0; VERIFY_ONLY=0
STATE="out/dispatch/run_state.json"; REPORT="out/dispatch/report_card.json"
while [ $# -gt 0 ]; do
  case "$1" in
    --date)     DATE="$2"; shift 2 ;;
    --topic)    TOPIC="$2"; shift 2 ;;
    --slug)     SLUG="$2"; shift 2 ;;
    --beat)     BEAT="$2"; shift 2 ;;
    --entities) ENTITIES="$2"; shift 2 ;;
    --state)    STATE="$2"; shift 2 ;;
    --report)   REPORT="$2"; shift 2 ;;
    --verify-only) VERIFY_ONLY=1; shift ;;
    --no-push)  SKIP_PUSH=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
if [ "$VERIFY_ONLY" -eq 0 ]; then
  for v in DATE TOPIC SLUG BEAT ENTITIES; do
    [ -n "${!v}" ] || { echo "missing --${v,,}" >&2; exit 2; }
  done
  [[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] \
    || { echo "--date must be YYYY-MM-DD" >&2; exit 2; }
  [[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] \
    || { echo "--slug must be a lower-case hyphenated slug" >&2; exit 2; }
fi

OUT="$REPO/out/dispatch"
DEST="$REPO/runs/$DATE"

say() { printf '\n=== %s\n' "$1"; }
GATE_LOG=$(mktemp)
trap 'rm -f "$GATE_LOG"' EXIT

# ---------------------------------------------------------------- 1. gates, by exit code
say "gates"
fail=0
run_gate() {
  local label="$1"; shift
  local rc=0
  if "$@" >"$GATE_LOG" 2>&1; then rc=0; else rc=$?; fi
  printf '  %-22s exit=%d\n' "$label" "$rc"
  if [ "$rc" -ne 0 ]; then fail=1; sed 's/^/      /' "$GATE_LOG" | tail -20; fi
}
if [ "$VERIFY_ONLY" -eq 1 ]; then
  run_gate package_authority python3 scripts/run_controller.py --state "$STATE" \
      check-package --report "$REPORT"
else
  run_gate delivery_authority python3 scripts/run_controller.py --state "$STATE" \
      check-delivery --report "$REPORT"
fi
run_gate run_discipline python3 scripts/run_discipline.py --state "$STATE"
run_gate storyboard_check python3 scripts/storyboard_check.py --board "$OUT/storyboard.json"
run_gate watchability     python3 scripts/watchability_check.py --board "$OUT/storyboard.json"
run_gate staging_check    python3 scripts/staging_check.py --board "$OUT/storyboard.json"
run_gate flow_check       python3 scripts/flow_check.py --board "$OUT/storyboard.json" \
    --sfx "$OUT/sfx_events.json"
run_gate acoustic_alignment python3 scripts/vo_align.py --verify --wav "$OUT/mix.wav" \
    --voice "$OUT/mix_vo.wav" --script "$OUT/vo_script.txt" --out "$OUT" --cuts "$OUT/storyboard.json"
# `--audio` wants mix.json, the mix REPORT, not mix.wav. Handed the wave file it dies on a
# decode error rather than reporting all clear, which is the correct way for a gate to be
# misused, and the invocation is written down here so the next run does not rediscover it.
run_gate ship_gate        python3 scripts/ship_gate.py --board "$OUT/storyboard.json" \
    --claims "$OUT/claims.json" --script "$OUT/vo_script.txt" \
    --captions "$OUT/captions.json" --audio "$OUT/mix.json" --report "$REPORT"
run_gate music_package    python3 scripts/music.py --verify-package "$OUT/credits.txt" \
    --mix "$OUT/mix.json" --board "$OUT/storyboard.json" --master "$OUT/mix.wav"
run_gate super_evidence   python3 scripts/super_evidence_check.py --board "$OUT/storyboard.json" \
    --claims "$OUT/claims.json"
run_gate board_scale      python3 scripts/board_scale_check.py --board "$OUT/storyboard.json"
run_gate floor_check      python3 scripts/floor_check.py --board "$OUT/storyboard.json"
run_gate safe_area_check  python3 scripts/safe_area_check.py
run_gate feed_composite   python3 scripts/feed_composite_check.py --film "$OUT/film.mp4" \
    --board "$OUT/storyboard.json" --manifest "$OUT/render-manifest.json" \
    --out "$OUT/feed-composite.png" --report "$OUT/feed-composite.json"
run_gate bar_check        python3 scripts/bar_check.py
run_gate mutation_check   python3 scripts/mutation_check.py
run_gate freshness_check  python3 scripts/freshness_check.py --film "$OUT/film.mp4" \
    --started "$OUT/render_started" --manifest "$OUT/render-manifest.json" \
    --inputs "$OUT/storyboard.json" "$OUT/mix.wav" "$OUT/captions.json"
[ "$fail" -eq 0 ] || { echo "a gate is red. Delivery stops here, which is the point." >&2; exit 1; }

if [ "$VERIFY_ONLY" -eq 1 ]; then
  say "publishing-disabled verification complete"
  echo "No ledger, run artifact, commit, push, PR, merge, or feed write was attempted."
  exit 0
fi

if ! git -C "$REPO" diff --cached --quiet; then
  echo "delivery refuses a pre-existing staged index. Commit or unstage it first so this " \
       "run cannot absorb unrelated work." >&2
  exit 1
fi

# ---------------------------------------------------------------- 2. the ledger, BEFORE the merge
say "variety ledger"
python3 scripts/dedupe.py add --date "$DATE" --topic "$TOPIC" --slug "$SLUG" \
    --beat "$BEAT" --entities "$ENTITIES" --fingerprint "$OUT/storyboard.json" || exit 1

# ---------------------------------------------------------------- 3. artifacts
say "artifacts -> runs/$DATE"
if [ -f "$DEST/dispatch.mp4" ] && [ "$DEST/dispatch.mp4" -nt "$OUT/film.mp4" ]; then
  echo "runs/$DATE/dispatch.mp4 is NEWER than the film about to replace it." >&2
  echo "That is a shipped artifact being overwritten by an older one. Stop and ask." >&2
  exit 1
fi
mkdir -p "$DEST"
cp "$OUT/film.mp4"        "$DEST/dispatch.mp4"
cp "$OUT/poster.png"      "$DEST/poster.png"
for f in storyboard.json claims.json captions.json words.json mix.json sfx_events.json \
         vo_direction.json vo_script.txt story.md research_notes.md scale_notes.md credits.txt \
         acoustic-asr.json acoustic-asr-meta.json alignment_aliases.json \
         script_audit.json validation.json \
         render-manifest.json feed-composite.json feed-composite.png; do
  [ -f "$OUT/$f" ] && cp "$OUT/$f" "$DEST/$f"
done
cp "$REPORT" "$DEST/report_card.json"
cp "$STATE" "$DEST/run_state.json"
ls -la "$DEST" | tail -n +2

# ---------------------------------------------------------------- 4. commit and push, out loud
say "commit"
git -C "$REPO" add -- "$DEST" ledger/dispatch_history.json
git -C "$REPO" status --short -- "$DEST" ledger/dispatch_history.json | sed -n '1,20p'
printf -v COMMIT_MESSAGE '%s\n\n%s\n\n%s\n%s' \
  "Ship the $DATE Dispatch" \
  "$TOPIC" \
  "Panel cleared the bar in config/dispatch_rubric.yaml. Artifacts and the variety" \
  "ledger entry land together, so the next run's dedupe sees this one."
if ! git -C "$REPO" commit -m "$COMMIT_MESSAGE"; then
  echo "commit failed"
  exit 1
fi
git -C "$REPO" log -1 --stat | sed -n '1,25p'

[ "$SKIP_PUSH" -eq 1 ] && { echo "--no-push, stopping before the network"; exit 0; }

say "push"
BRANCH=$(git -C "$REPO" branch --show-current)
delay=2
for attempt in 1 2 3 4 5; do
  git -C "$REPO" push -u origin "$BRANCH" && break
  [ "$attempt" -eq 5 ] && { echo "push failed after 5 attempts" >&2; exit 1; }
  echo "push attempt $attempt failed, retrying in ${delay}s"
  sleep "$delay"; delay=$((delay * 2))
done

say "pushed"
echo "Next, and NOT in this script: open a ready (not draft) PR and merge it in the same run,"
echo "then publish the feed on a clean TexasAIDocket claude/dispatch-$DATE branch."
echo "That branch and TXDOCKET_ACTOR=dispatch declare the lane; never write .git/ACTOR."
