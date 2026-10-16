cd /home/user/restore/2026-10-15
B=out/dispatch/storyboard.json
for c in "python scripts/storyboard_check.py --board $B" "python scripts/watchability_check.py --board $B" "python scripts/documentary_check.py --board $B" "python scripts/shot_coherence.py --board $B" "python scripts/staging_check.py --board $B" "python scripts/board_scale_check.py --board $B" "python scripts/floor_check.py --board $B" "python scripts/script_evidence_check.py --board $B --claims out/dispatch/claims.json" "python scripts/super_evidence_check.py --board $B --claims out/dispatch/claims.json" "node video-engine/tests/caption_board_fit.mjs --board $B" "python scripts/place_check.py --board $B"; do
  echo "== $c"; $c 2>&1 | tail -6; echo "rc=${PIPESTATUS[0]}"
done
