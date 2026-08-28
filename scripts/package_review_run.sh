#!/usr/bin/env bash
# Persist a playable run that cannot publish unattended. This is deliberately separate from
# deliver_run.sh: it saves the work, commits it to the run branch, and never writes the variety
# ledger, merges, or touches the Docket feed.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"

DATE=""; SLUG=""; REASON=""; NO_PUSH=0
STATE="out/dispatch/run_state.json"
while [ $# -gt 0 ]; do
  case "$1" in
    --date) DATE="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    --reason) REASON="$2"; shift 2 ;;
    --state) STATE="$2"; shift 2 ;;
    --no-push) NO_PUSH=1; shift ;;
    *) echo "package_review_run: unknown argument $1" >&2; exit 2 ;;
  esac
done

[ -n "$DATE" ] && [ -n "$SLUG" ] && [ -n "$REASON" ] \
  || { echo "package_review_run: --date, --slug, and --reason are required" >&2; exit 2; }
[[ "$DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] \
  || { echo "package_review_run: --date must be YYYY-MM-DD" >&2; exit 2; }
[[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] \
  || { echo "package_review_run: --slug must be lower-case and hyphenated" >&2; exit 2; }

OUT="$REPO/out/dispatch"
DEST="$REPO/runs/review/$DATE-$SLUG"
[ -f "$STATE" ] || { echo "package_review_run: missing $STATE" >&2; exit 2; }

python3 scripts/run_controller.py --state "$STATE" check-deliverable

if ! git -C "$REPO" diff --cached --quiet; then
  echo "package_review_run: refusing a pre-existing staged index" >&2
  exit 1
fi

# The controller copies from its immutable last-good snapshot, not from mutable out/ files a
# failed replacement may have truncated or moved beyond the registered board.
python3 scripts/run_controller.py --state "$STATE" materialize-deliverable \
  --directory "$DEST"
for name in poster.png claims.json captions.json words.json mix.json sfx_events.json \
            vo_direction.json vo_script.txt story.md research_notes.md scale_notes.md \
            credits.txt feed-composite.json feed-composite.png report_card.json rescue.json; do
  [ ! -f "$OUT/$name" ] || cp "$OUT/$name" "$DEST/$name"
done

# Only now may the controller become terminal: the exact MP4, board and manifest already exist
# in the tracked review namespace rather than only in gitignored scratch.
python3 scripts/run_controller.py --state "$STATE" finish --result needs_review \
  --reason "$REASON" --review-package "$DEST"
cp "$STATE" "$DEST/run_state.json"

echo "package_review_run: durable playable video -> ${DEST#$REPO/}/dispatch.mp4"
echo "package_review_run: no ledger, merge, live run path, or feed entry was touched"

BRANCH=$(git -C "$REPO" branch --show-current)
[ -n "$BRANCH" ] && [ "$BRANCH" != "main" ] \
  || { echo "package_review_run: review evidence must be committed on a run branch" >&2; exit 1; }
git -C "$REPO" add -- "$DEST"
git -C "$REPO" status --short -- "$DEST" | sed -n '1,40p'
if git -C "$REPO" diff --cached --quiet -- "$DEST"; then
  echo "package_review_run: exact review package is already committed"
else
  git -C "$REPO" commit -m "Save the $DATE Dispatch for review"
  git -C "$REPO" log -1 --stat | sed -n '1,30p'
fi

[ "$NO_PUSH" -eq 1 ] && { echo "package_review_run: --no-push"; exit 0; }
delay=2
for attempt in 1 2 3 4 5; do
  git -C "$REPO" push -u origin "$BRANCH" && break
  [ "$attempt" -eq 5 ] \
    && { echo "package_review_run: push failed after 5 attempts" >&2; exit 1; }
  echo "package_review_run: push attempt $attempt failed; retrying in ${delay}s"
  sleep "$delay"
  delay=$((delay * 2))
done
echo "package_review_run: pushed review evidence; do not merge or publish it automatically"
