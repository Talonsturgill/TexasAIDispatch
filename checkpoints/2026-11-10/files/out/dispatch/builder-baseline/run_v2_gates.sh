#!/usr/bin/env bash
cd /home/user/dispatch-editions/2026-11-10/TexasAIDispatch
G=out/dispatch/board-gates; R="bash scripts/run_with_env.sh python3"
$R $G/gen_board_v2.py > $G/v2-gen.log 2>&1; echo gen $?
$R scripts/registry_check.py > $G/v2-registry_check.log 2>&1; echo registry_check $?
for pair in "main:out/dispatch/storyboard.json" "a:out/dispatch/opening-a.json" "b:out/dispatch/opening-b.json"; do t=${pair%%:*}; b=${pair#*:}
 $R scripts/daily_production.py --board $b --claims out/dispatch/claims.json --structure-only > $G/v2-$t-daily_structure.log 2>&1; echo $t daily_structure $?
 $R scripts/storyboard_check.py --board $b > $G/v2-$t-storyboard_check.log 2>&1; echo $t storyboard_check $?
 $R scripts/watchability_check.py --board $b > $G/v2-$t-watchability.log 2>&1; echo $t watchability $?
 $R scripts/documentary_check.py --board $b > $G/v2-$t-documentary.log 2>&1; echo $t documentary $?
 $R scripts/shot_coherence.py --board $b > $G/v2-$t-shot_coherence.log 2>&1; echo $t shot_coherence $?
 $R scripts/staging_check.py --board $b > $G/v2-$t-staging.log 2>&1; echo $t staging $?
 $R scripts/board_scale_check.py --board $b > $G/v2-$t-board_scale.log 2>&1; echo $t board_scale $?
 $R scripts/floor_check.py --board $b > $G/v2-$t-floor.log 2>&1; echo $t floor $?
 $R scripts/script_evidence_check.py --board $b --claims out/dispatch/claims.json --planning-only > $G/v2-$t-script_evidence.log 2>&1; echo $t script_evidence $?
 $R scripts/super_evidence_check.py --board $b --claims out/dispatch/claims.json > $G/v2-$t-super_evidence.log 2>&1; echo $t super_evidence $?
 $R scripts/modern_film.py --board $b --script out/dispatch/vo_script.txt --claims out/dispatch/claims.json > $G/v2-$t-modern_film.log 2>&1; echo $t modern_film $?
 $R scripts/retime_feasibility.py --board $b > $G/v2-$t-retime_feasibility.log 2>&1; echo $t retime_feasibility $?
 $R scripts/native_sample_plan.py --board $b > $G/v2-$t-native_sample_plan.log 2>&1; echo $t native_sample_plan $?
 $R $G/v2_draft_registry_check.py $b > $G/v2-$t-modern_film_draft_registry.log 2>&1; echo $t modern_film_draft_registry $?
done
