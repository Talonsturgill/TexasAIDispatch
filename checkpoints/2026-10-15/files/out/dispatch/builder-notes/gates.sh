#!/usr/bin/env bash
# usage: gates.sh <board path relative to repo> [outdir]
B="$1"; OUT="${2:-/tmp/claude-0/-home-user/d9716588-d928-5f3e-9241-8688cc5aed89/scratchpad/gate-out}"
mkdir -p "$OUT"
cd /home/user/TexasAIDispatch
W="bash scripts/run_with_env.sh"
tag=$(basename "$B" .json)
run(){ name="$1"; shift; "$@" > "$OUT/$tag.$name.txt" 2>&1; ec=$?; echo "$ec $name"; }
run registry $W python scripts/registry_check.py
run storyboard $W python scripts/storyboard_check.py --board "$B"
run watchability $W python scripts/watchability_check.py --board "$B"
run documentary $W python scripts/documentary_check.py --board "$B"
run shot_coherence $W python scripts/shot_coherence.py --board "$B"
run staging $W python scripts/staging_check.py --board "$B"
run board_scale $W python scripts/board_scale_check.py --board "$B"
run floor $W python scripts/floor_check.py --board "$B"
run script_evidence $W python scripts/script_evidence_check.py --board "$B" --claims out/dispatch/claims.json --planning-only
run super_evidence $W python scripts/super_evidence_check.py --board "$B" --claims out/dispatch/claims.json
run caption_fit $W node video-engine/tests/caption_board_fit.mjs --board "$B"
run modern_film $W python scripts/modern_film.py --board "$B"
run native_sample $W python scripts/native_sample_plan.py --board "$B"
