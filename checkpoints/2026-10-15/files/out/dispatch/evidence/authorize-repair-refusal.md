# authorize-repair refusal (actual), 2026-10-16

Command: bash scripts/run_with_env.sh python scripts/run_controller.py --state out/dispatch/run_state.json authorize-repair --plan out/dispatch/repair-plan-code1-v2-bound.json
Result verbatim: repair plan changed input is stale or unchanged
Exit: 1

Cause (from repair_plan_evidence in scripts/run_controller.py, per-item test: before == after fails): registry.tsx was registered at begin-repair and its bytes did not change.
authorize_repair also requires the plan changed_inputs to equal the baselines registered at begin-repair, so the row can neither be removed nor ignored.

## Declared inputs, before and after sha256 (plan as filled)
- out/dispatch/opening-a.json | before f9ce0330704e6f4d95428fe2da92c4269546a5ce50f5449f6abe735a979f18c8 | after 497bbc92ee131341d97b067d574e98d276c586033408650a069a97335b24bfe0 | changed
- out/dispatch/opening-b.json | before 5261e5b3847a2f4ec4226ffe2fe83f8071fa3190f596a3908f02b93dced6460d | after 846d776d60b259c86ce73447ed0b4db5ad73dacd3ba8e924cdabcea022616c99 | changed
- out/dispatch/storyboard.json | before f9ce0330704e6f4d95428fe2da92c4269546a5ce50f5449f6abe735a979f18c8 | after 497bbc92ee131341d97b067d574e98d276c586033408650a069a97335b24bfe0 | changed
- video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx | before 5f5b9f705d43df0eed44d83347e4bd3f9afffb0e1d16a1297c2eff44dec5743f | after 8943704cb4527a9900f162a85b6e7d264e2e8f955a20149a39608e4b200cbfb4 | changed
- video-engine/src/modern/episodes/2026-10-15/FloodStationHero.tsx | before 87db5bbeb6b714cb97222c7097a74a2230efa9f810d102223e0f78417786a07c | after f3dbf42717bbea88758c825d05cfeda588ebbe2ddbfcf493e3c5ddd86cc5461c | changed
- video-engine/src/modern/episodes/2026-10-15/StreetHubSupport.tsx | before b34557b5b9fa5e60b97a41d0083000aed7cfe44702c888554481c07ebb68e2c6 | after 916e12f7be70b88b289e29b42c6e4961fe22dfd0e70027943339dc61edf3de91 | changed
- video-engine/src/modern/registry.tsx | before af13d1b7c7441af66a265d7f4bac7bf13d085d1138dfcd14675f0bd818d0ff03 | after af13d1b7c7441af66a265d7f4bac7bf13d085d1138dfcd14675f0bd818d0ff03 | UNCHANGED

## State
active_repair baselines 7 reboards_before 2 usage reboards 3
last events ['reserved', 'autonomous_completion_code_adopted', 'repair_started', 'reserved']

Plan file sha256 (filled):
a33dc0ff6502d4b457e709ed78bd422e0fc3aefa1d247d87b783a2ff68254e3f  out/dispatch/repair-plan-code1-v2-bound.json
Pre-fill plan sha256:
da0bc669a633d2f3f4b41c413563aba7657bac3862ab3cdb9e0914bbf27860c9  out/dispatch/evidence/repair-plan-code1-v2-bound-before-after-fill.json
