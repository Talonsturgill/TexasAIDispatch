# R8 source map and answers to the six report14 blockers (report sha 97a41235)

All timings below are PROJECTED from measured take 5 and take 6 rates. Measured post-TTS retiming governs the actual film.

- "Some people could have ankle-deep water in their yard." -> c12 (source line 94)
- "UT San Antonio says the phone warning can come after that." -> c12 (source line 94)
- "So its researchers built a flood station." -> c1 (source line 95)
- "It charges itself from light and needs no cell tower." -> c5 (source line 109), c6 (source line 110), c14 (source line 97)
- "Four optical sensors at different heights watch the water." -> c2 (source line 102)
- "A small chip on the station runs the AI itself." -> c3 (source line 106), c18 (source line 106)
- "So it judges flood risk without a central server." -> c3 (source line 106)
- "Its radio signal can carry more than a half-mile in streets." -> c6 (source line 110)
- "In open country, up to five miles, to a hub." -> c6 (source line 110)
- "At the hub, a second, larger AI maps flood paths for responders." -> c7 (source line 112), c16 (source line 112), c17 (source line 114), c20 (source line 113)
- "The university reports early chip AI assessments." -> c4 (source line 107), c18 (source line 106)
- "Validation accuracy was ninety eight point eight two percent." -> c4 (source line 107)
- "The university reports no field result." -> c4 (source line 107)
- "It names no town with an installed station." -> c1 (source line 95), c10 (source line 118)
- "Deployment is still the goal." -> c9 (source line 117), c10 (source line 118)

## Blockers
- R7-1 absolute no field result: "The university reports no field result." and "It names no town with an installed station." The university is the subject of both, so the antecedent chain holds, and nothing asserts the world has no field result.
- R7-2 figure on the wrong model: the figure follows "The university reports early chip AI assessments." and the chip AI is named in the sentence before it. In the source the 98.82 percent belongs to the on-device TinyML AI (line 107, after the on-device paragraph at line 106). The hub model is introduced earlier as "a second, larger AI". The on-screen tag "Initial assessments after training" remains under the card in both treatments, and the word "training" (distorted in take 6) is not spoken.
- R7-3 runtime: words fell from 163 to 133 and sentences from 18 to 15. duration-projection.json gives speech end typical 52.38 s, slow 55.88 s, fast 48.6 s against a runtime of 54.4 s (limit 62 s). Scene windows follow the typical projection, every scene is under the 9.5 s ceiling and every shot under 5.0 s.
- R7-4 event widths: build_proposal.py asserts every event is at most 1.2 s on the slow projection and at least 0.2 s on the fast projection. The hook payoff ends at about 0.934 s typical (limit 1.5 s).
- R7-5 same-view cuts (artistic, still blocking until reviewed): no clause cuts to an identical view. A clause without its own picture is covered by the previous shot. The only same-view pairs are validation-card then validation-card (A s7, B s7) and chip-glow then chip-glow (A s4), each a detail push joined by a continuous edit that the renderer implements for those views.
- R7-6 close direction and metadata: no direction field references another line by number, and verification, sentence_map and hashes describe the 15 sentence script.

Open and honest: D1 (take 6 distortion) is unresolved until a take reconciles under pinned alignment. D2 (caption fit) is unresolved until a measured set passes. D5 stays a process observation.
