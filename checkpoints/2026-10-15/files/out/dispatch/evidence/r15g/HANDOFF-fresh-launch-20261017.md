# Handoff for the fresh supported launch (2026-10-17, written by the old writer before it stops)

## Durable state
- Edition 2026-10-15, controller active_repair. Latest checkpoint is on claude/checkpoint/2026-10-15. The ordinary recover (6e5e5d1c, 3445 files, 933,682,380 B, marker cleared) was followed by a save carrying the handoff notes (cd9495b4). Root verified ledger SHA 297585ad... from 6e5e5d1c.
- Source pin of the working copy: 44f8f452 (PR199). Main is now f54faae4 (PR201 9ff251e5, PR197 a0661a9c, PR198 f54faae4). Adopt with a normal ff-only once matching main CI is green, then pin f54faae4 in the final free checkpoint.
- Film out/dispatch/film.mp4 sha256 ab7058fff988ce8bce16226c97600985d74e1a49fa26d5dd2a6942c22d8db077 is UNCHANGED and is the retained failed cut (music credit package). Timed phone PASS 0033dc89 on preflight film 3aa79cfc, hero PASS, motion sequence for ab7058ff all retained.
- Uncommitted authored modules (video-engine/src/modern/episodes/2026-10-15/, registry edits) stay uncommitted and are carried by the checkpoint.
- Usage now: audiovisual 12, preflight 39 of 39, full renders 2 of 2, reboards 12 of 12, storyboard critics 39, tts 14, scorers 0, panel 0. The held old writer's distinct failed reservation is retained separately (evidence/old-writer-oct17), not in this count.

## The one mandatory correction
Music end-card credit (rights). music.py --verify-package fails on board 3758e9bc: the end card carries no MUSIC line for the Sincerely bed (evidence/r15g/music-package-failure-board-3758e9bc.log). Offline-verified fix in evidence/r15g/credit-repair-prep/ (credits.txt, storyboard.proposed.json). concept_digest ignores credits and credits_s, so code reviews and the phone PASS stay bound. Mix already covers runtime 59.4 + credits 5 = 64.4 s. No voice, mix or caption change.
repair-plan-r15g.template.json keeps classification fields as FILLED_AFTER_CLASSIFICATION. Do not submit it before a real independent storyboard-critic classification. Compute every hash from owned bytes (failed_film_sha256 was corrected from a bad placeholder to the file's real hash).

## Whole-sequence resource reconciliation (from the phase commands and the ledger; grant the exact figures from production-budget when funding)
- Reboard 1 (at ceiling).
- Independent classification critic 1, then the timed phone critic 1 (storyboard_critics at 39).
- Capture entries, each prepaid once through capture_guard authorize --prepare: timed phone preview 1, native hero 1 unless the unchanged planner refuses the identical identity and the existing hero approval is reused, exact-film motion extraction 1. So 2 or 3 preflight entries, not 2 without extraction.
- Full render: the last render consumed two full_renders (my explicit reservation for the capture authorization plus the script's own). Request the grant for both, or prove pairing in the planner, before rendering.
- Audiovisual lenses picture, story, sound 3, scorers 3, panel 1.
- Run music.py --verify-package and PR200's pre-render check before any render reservation.

## Storage
Required evidence now 933,682,380 B. The corrected film adds about 111 to 116 MB, which needs the PR201 cap (1280 MiB). That changes claude_checkpoint.py, so the prelaunch codec identity guard needs a proper fresh supported setup and launch before paid work. Render-cache: 55 byte-verified duplicates were moved to out/dispatch/tmp/owned-cinema-cache (mapping in evidence/r15g/render-cache-move-mapping.json); put them back before any cinema_proof that reuses those keys.

## Retained evidence of refusals and failures
evidence/r15g/render-cache-move-REFUSED.md, evidence/r15g/auto-mode-diagnosis/ (rule text, effective config, proposed settings diff, helper fetch refusal), evidence/old-writer-oct17/ (base, delta, six originals, denials), evidence/r15g/cinema-proof-refusal-phone-review-not-recorded.log, evidence/r15g/storage-forecast.md.

## No paid work was started after recover
