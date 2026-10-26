#!/usr/bin/env bash
# usage: gates.sh <board>
B=$1
run(){ echo "=== $*"; "$@" 2>&1 | tail -${TAILN:-6}; echo "exit=${PIPESTATUS[0]}"; }
run python scripts/modern_film.py --board $B
run python scripts/daily_production.py --board $B --claims out/dispatch/claims.json --structure-only
run python scripts/storyboard_check.py --board $B
run python scripts/watchability_check.py --board $B
run python scripts/documentary_check.py --board $B
run python scripts/shot_coherence.py --board $B
run python scripts/staging_check.py --board $B
run python scripts/board_scale_check.py --board $B
run python scripts/floor_check.py --board $B
run python scripts/script_evidence_check.py --board $B --claims out/dispatch/claims.json --planning-only
run python scripts/super_evidence_check.py --board $B --claims out/dispatch/claims.json
run node video-engine/tests/caption_board_fit.mjs --board $B
run python scripts/retime_feasibility.py --board $B
run python scripts/native_sample_plan.py --board $B
