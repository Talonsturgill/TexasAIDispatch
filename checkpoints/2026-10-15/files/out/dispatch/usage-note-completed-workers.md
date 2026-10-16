# Completed-worker usage metadata (as reported in each completion notification, retained once per worker)
Source: the host task-completion notifications in this session. Fields are subagent_tokens, tool_uses and duration_ms exactly as reported. Whether a figure is cumulative across a resumed worker is NOT stated by the host, so it is recorded per notification and not summed. Cache creation/read split, requested versus observed effort and billing are unknown. No transcript scan was done for this note.

| worker (agent id) | role, model | completion notification | subagent_tokens | tool_uses | duration_s |
|---|---|---|---|---|---|
| aed778356c24e0904 | researcher (oilfield), Haiku | 1 | 220753 | 62 | 489.7 |
| a3c43ee3b884b83bd | researcher (Project Nexus), Haiku | 1 | 140289 | 46 | 391.9 |
| ac1008fac69cea153 | researcher (feedlot / fallback), Haiku | 1 | 154182 | 59 | 638.3 |
| a3d805ce25b8b417c | validator, Opus high | pass 1 | 103851 | 19 | 236.2 |
| a3d805ce25b8b417c | validator, Opus high | pass 2 (resumed) | 132626 | 6 | 128.2 |
| a3d805ce25b8b417c | validator, Opus high | pass 3 (resumed) | 186426 | 13 | 109.1 |
| a1c09641f377d307a | scene-builder, Opus high | initial authored build | 576491 | 108 | 2414.0 |
| a1c09641f377d307a | scene-builder, Opus high | first correction attempt, stopped by the director before any edit | not reported | not reported | not reported |
| a1c09641f377d307a | scene-builder, Opus high | correction 1 (resumed after restart) | 682413 | 21 | 849.4 |
| a407e8e20bf633e6f | storyboard-critic, Opus high | code review 1 (REVISE A and B) | 460076 | 68 | 735.0 |
| a407e8e20bf633e6f | storyboard-critic, Opus high | corrected code re-review (PASS A and B) | 781558 | 35 | 480.5 |

Controller charges are separate and unchanged: research_agents 3, validator_agents 3 (one under the owner grant), reboards 3, storyboard_critics 2, preflight_renders 2 (two spent capture authorizations, neither started a render). External provider usage: none yet (no voice, review provider or scorer call has been made).
