# 2026-10-15 Dispatch worklog (cloud, Sonnet director)

State: production OPEN, phase research/validation. Not shipped. No paid voice, render or scorer call has been made.

Done
- Wake: pending empty, checkpoints 2026-10-11 and 2026-10-09-claude-pilot finished. Bootstrap, env_check, engine_lint, staging, composition, wiring, tsc all exit 0.
- run_controller init 2026-10-15, adopted frozen envelope, claude-host.json marker, checkpoint saved.
- Research: 3 researcher agents used (3/3). Rejected oilfield Diamondback (secondary sources, 73 days old), TxDOT Project Nexus (company-only claims), WTAMU feedlot (no AI mechanism).
- Selected: UT San Antonio solar flood station, Docket tx-2026-0141, primary https://news.utsa.edu/2026/09/ut-san-antonio-researcher-builds-self-powered-smart-warning-system-to-catch-local-floods-before-disaster-strikes/ dated September 8th, 2026. story_selection.json passes story_selection_check.
- claims.json c1 to c19 drafted from snapshot out/dispatch/sources/utsa.txt. Opus validator verified all 19 verbatim (verdicts in claims.json still read PENDING until a PASS is saved).
- vo_script.txt written, 9 sentences. Validator pass 2 judged s1 to s9 supported except s5 needed "can carry". The director applied that edit.

BLOCKER
- validator_agents is 2 of 2 (escalation ceiling 2). Pass 1 returned REVISE on story_selection framing, pass 2 returned REVISE on the single word in s5. validation_check requires result PASS. A third validator pass on the corrected script is needed.
- config/autonomous_completion.json eligible_resources does not include validator_agents. extend-agent-ceiling and grant-owner-review refuse a frozen-envelope run without explicit owner authorization.
- Director mistake to avoid next time: send story_selection, claims and the script to the validator together in ONE pass.

Next executable step (needs owner decision)
- Owner either grants one validator_agents increment for this ledger (run_controller grant-owner-review or extend-agent-ceiling with owner authorization), or adds validator_agents to autonomous completion eligible resources. Then SendMessage the same validator (agent a3d805ce25b8b417c) with the corrected out/dispatch/vo_script.txt, save its validation object unchanged as out/dispatch/validation.json, set claim verdicts VERIFIED, run validation_check, then continue Phase 2 (two treatment boards, authoring packet, scene-builder).
- Docket tx-2026-0141 misdates the announcement as September 28th, 2026. Primary says September 8th. Needs a separate Docket repair branch in the correct lane.

## Review scope for the corrected same-worker code re-review (owner clarification 2026-10-16)
Same critic (a407e8e20bf633e6f) reads in full: every packet-bound required guide, both complete current boards (A and B, storyboard.json = A),
the new FloodStationFilm, FloodStationHero, StreetHubSupport and the executed dependencies they actually use (PlaceStage, CountyLocator, overlays).
The renderer closure stays mechanically hash-bound and verified by the director; unchanged unrelated closure files need not be read, and unrelated old
episode implementations and whole controller modules are out of scope. The critic returns a per-input table separating read-in-full from verified-by-hash.
No mandatory guide may be reported covered unless it was read.

## 2026-10-16 session (Sonnet director, fresh container) 
- Restored 2026-10-15 from checkpoint to /home/user/restore/2026-10-15; Docket sibling is a worktree at /home/user/restore/TexasAIDocket (sparse, runs/ excluded). Bootstrap/env_check/contract check exit 0. Hook probe denial retained (evidence/capture-hook-probe-denial-20261016.txt).
- Headroom recovered to 20.6 GiB by sparse-excluding runs/ in the two primary checkouts and dropping uv/pip caches (no data deleted).
- Opening comparison rendered and both inspections pass (openings/comparison.json). Preflight identity collisions retained in evidence/animatic-*.md; three infra retries recorded.
- Contact sheets openings/review/{a,b}-sheet.png; phone critic reserved (storyboard_critics 3/3) and running. Next: selection.json, copy chosen board to storyboard.json + critic + preflight.mp4, preflight inspect, daily_production, voice.
- HOLD (owner, 2026-10-16): phone critic evidence was one midpoint image per scene. Don't accept a phone pass or start voice on it. Preserve its handback. Need an authorized chronological image sequence from BOTH exact 270x480 phone MP4s (claude_motion_review.py is native-only). Same critic ae808544fe3730f4f is kept for the content follow-up. See evidence/phone-media-basis-finding-20261016.md. Every worktree shell command: cd inside scripts/run_with_env.sh.
- 2026-10-16 (after PR163 ff to 78ab3ff): finish-current funded (evidence/finish-current-funding-20261016.md, no grant needed). Chronological phone extractions motion-a and motion-b done (two prepared preflight charges), phone-critic-packet.json built (sha cc323c7a...), storyboard_critics 4 reserved, same critic ae808544fe3730f4f resumed for the content follow-up. Next: save its JSON unchanged as openings/selection.json and the phone report, critic_gate, copy chosen board/critic/film to storyboard.json etc, preflight inspect, voice.
- 2026-10-16 07:29Z: ff to 317fe5c (PR165). Fresh packets: openings/review/phone-base-packet-2.json, phone-critic-packet-2.json (sha a5be5436...), plan phone-critic-followup2-assignment.json. Funding re-checked (feasible, critics remaining 2 required 2). Reserved storyboard_critics 5/5 (ceiling 7), resumed same critic ae808544fe3730f4f with sequential-read protocol (smoke test B sequence-000 first). Next: save handback unchanged (selection, report, coverage), claude_runtime.py verify-images, critic_gate, then storyboard.json <- chosen board, voice.

## 2026-10-16/17 session (Sonnet director, restored at /home/user/ed1015/TexasAIDispatch, main 13ec786)
- Source pivot funded: evidence/r8-funding (source-plan, source-capacity-plan, complete-source-capacity-plan); grant preflight+1 critics+4 tts+2 validator+1. Helper refusal retained (helper-refusal-20261016.md); PR186 merged fix.
- delivery-routing.json bound (private, owner-instructed from preceding accepted draft metadata).
- R8 proposals frozen: evidence/proposal-r8 (MANIFEST.sha256.json, EVIDENCE-NOTES.md honest build history). Script sha 38b9ae7f.... Mechanical picture_precheck passes except story_art, which needs run_state beside the board; artverify-05-a/b exit 0.
- Critic 15 of 15 reserved; agent a110876b976dcc812 (storyboard-critic, Opus High) dispatched with consolidated-review-packet-r8.md. Next: save verbatim handback + receipt, build pivot_review JSON, begin-repair with final plan, reboard, apply declared bytes, authorize-repair, then validator reservation + validation, verify-validation.
- 2026-10-16 late: R8 REVISE, R9 PASS, validator REVISE (s13), R10 correction, validator PASS verified, R11 metadata repair, code review full coverage PASS (critic 19), critic_gate passes; disk recovered (own fix clone removed, Docket sibling reshaped blobless sparse, restored worktree sparse with 3 runs kept); renewed opening comparison rendered with both inspections passing (openings/comparison.json identity 6075b6b9). Old comparison preserved at evidence/openings-pre-r10-comparison. Budget: critics 19/21, preflight 14/17. Next: claude_motion_review phone a and b (prepare), phone-packet, silent phone critic 20 (one of two left), select, then voice.

## 2026-10-16 late (alignment fixed, runtime crowding found)
- PR187 merged (2a2b0b4): vo_align joins micro-pauses inside one recognized multi-part number. Real take 7 now aligns (16 cues, 132/132 words). Proof in evidence/align-fix-proof. Failed pre-fix run kept in evidence/take-7.
- board_captions on the authored 54.1 s board FAILS (cues past runtime) and board_retime FAILS (needs 57.9 s). Dry run on a copy at runtime 59.5 (evidence/dryrun-runtime-595) retimes, but storyboard_check flags ONE problem: scene s7 is 11.3 s (ceiling 9.5). Measured read of sentences 11 to 13 is 10.6 s (long breaths around the 98.82% figure) vs 8.76 s projected.
- Plan: technical-integrity (runtime) board correction: split the s7 beat so the clause "The announcement reports no field result." moves into the following scene as its own shot (no-field-card view); TSX ids renamed to match. Needs precharged independent critic classification (technical_repair.findings) before begin-repair; critics are 21/22, preflight 19/19, so a completion-capacity grant is likely needed.
- Do NOT edit storyboard.json live before begin-repair. The live storyboard.json currently equals the accepted A board (sha unchanged).

## 2026-10-16/17 (Sonnet director, restored checkout, main 410b94bb after PR190)
- PR187 aligner fix, PR188 taxonomy fix, PR190 read-timeout recovery merged; PR189 held outside production until archive shipped (do not merge).
- R13 (technical-integrity, report 22) applied events 230-233; R14 (report 25, conform B + sync opening-a) applied events 242-245. Real mix 64.4 s; take 7; script 67d7ae45, claims 49b2379c unchanged.
- Critics: 23 code-plan (A, B, storyboard), report24 current bytes A (gate accepts), report25 diagnosis, B code plan. Gates accept opening-a/opening-b/storyboard critic files.
- Renewed opening comparison rendered (both inspections pass). Host phone pages stripped ([media removed: request limit], director-projected coverage + helper accepted). Provider comparison attempt 1 ReadTimeout (charged, evidence r14-phone-transport). PR190 receipt printed: independent-review-cache/8ec9.../read-timeout-recovery.json. Child recovery running; log provider-compare-recovery.log; output provider-phone-report-r14-recovery.json.
- Budget: enriched plan shows full renewal minimums; no-plan diagnostics show only finish-only deficit preflight 1. After a genuine verdict fund that deficit with the verdict as evidence; never a capacity-only critic.
- Next: verify the provider reports (independent_review.py --verify), stage chosen board/movie, preflight --inspect-only, funding, timed phone with audio, native hero/full, 3 AV + 3 scorers, delivery, unsent draft, shipped, archive.
storage: housekeeping verified rc=0 free 20.19 GiB; reclaimed 1.33 GiB via sparse
