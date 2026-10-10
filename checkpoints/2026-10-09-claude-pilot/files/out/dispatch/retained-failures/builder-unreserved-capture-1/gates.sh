#!/usr/bin/env bash
# usage: gates.sh <board> [gate-name-filter]
cd /home/user/TexasAIDispatch
B=$1; C=out/dispatch/claims.json; F=${2:-.}
run(){ name=$1; shift; if [[ "$name" =~ $F ]]; then out=$(bash scripts/run_with_env.sh "$@" 2>&1); code=$?; echo "=== $name exit=$code"; [ $code -ne 0 ] && echo "$out" | head -${LINES_MAX:-40}; fi; }
run registry python3 scripts/registry_check.py
run storyboard python3 scripts/storyboard_check.py --board $B
run watchability python3 scripts/watchability_check.py --board $B
run documentary python3 scripts/documentary_check.py --board $B
run shot_coherence python3 scripts/shot_coherence.py --board $B
run staging python3 scripts/staging_check.py --board $B
run board_scale python3 scripts/board_scale_check.py --board $B
run floor python3 scripts/floor_check.py --board $B
run script_evidence python3 scripts/script_evidence_check.py --board $B --claims $C --planning-only
run super_evidence python3 scripts/super_evidence_check.py --board $B --claims $C
run modern_film python3 scripts/modern_film.py --board $B
run digest python3 scripts/daily_production.py --board $B --digest
run caption_fit node video-engine/tests/caption_board_fit.mjs --board $B
run authored_verify python3 scripts/authored_story_art.py --board $B verify
