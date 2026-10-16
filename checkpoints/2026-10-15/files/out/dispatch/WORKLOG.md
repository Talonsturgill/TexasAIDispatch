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
