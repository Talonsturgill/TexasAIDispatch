# Scorer review-access gap: source-backed diagnosis and complete-path budget (2026-10-11)

No worker was launched, no schema resume bought, no creative edit made while writing this.

## Diagnosis (each line cites its source)
1. `.claude/agents/scorer.md` frontmatter is `tools: Read`. Read can't decode an MP4, so a scorer sees stills, board text and the provider receipt only. Observed: all three returned "I did not watch or hear the film".
2. Resumed workers keep that tool set (owner-verified against Claude documentation). Resuming can't add video access, so no further schema resume is useful.
3. `prompts/phases/review-availability.md` covers only an observed host transport failure with a retained `dispatch_review_transport_failure/1` error. Inability to play MP4 isn't one of its supported errors, so provider fallback doesn't apply and none was used.
4. Current scorer evidence is `scripts/extract_frames.sh`: one midpoint still per scene, a poster and the last frame (nine stills). Two judges' defects (s2/s3/s6 crops, s1 opening) came from that sampling, and the 0.42 s contact sheet contradicted one of them. Stills are too sparse to support a timed attention or continuity pass.
5. The attention gate (`panel_triage`, `modern_film.review_problems`) wants timed observations on the exact film bytes. The three provider receipts (`out/dispatch/cinema/{picture,story,sound}-review.json`, film dadac9bb) bind that film but the scorers can't confirm them.
6. Raw provider `modern_observations.film_sha256` strings differ (picture df1fe1da..., story/sound 4a10a3f6...) and `independent_review.project()` overwrites them on projection. They are retained unchanged. Receipts bind dadac9bb.

## Narrow recovery scope (what the source repair must supply)
- Complete timed motion-image sequences decoded from the exact film out/dispatch/film.mp4 (sha dadac9bb...), with each frame's film time and hash, bound into the existing picture/story/sound scorer packets next to the existing audiovisual receipts.
- Same three separate Sonnet-medium scorers, new panel round, unchanged rubric, no provider fallback, no score edit or deferral of the access limit.
- Audible evidence stays the provider receipt plus mix.json measurement. Scorers still can't hear, and must say so.

## Complete-path budget (production-budget at 2026-10-11, snapshot in review-access-recovery-budget-snapshot.json)
- Feasible: false. Deficit: preflight_renders 2 (ceiling 27, used 27, remaining 0, required 2).
- Decoding the exact film with ffmpeg -i is capture-gated (capture_guard CAPTURE_COMMAND), so the packet builder needs a hook precharge plus an internal helper reservation: two preflight_renders units if built on the existing preflight route.
- Funded: panel_rounds 7 left (need 1), scorer_calls 21 left (need 3), audiovisual_reviews 39 left (existing receipts reused, none needed), full_renders 10 left (no re-render planned), tts 4 left (2 reserved, unused), storyboard_critics 2 left (none planned).
- So the only shortfall is the two decode reservations. It needs the owner's source repair to name its resource, then `completion-capacity` against an exact bound plan before any decode. No other deficit.

## Release prep done without spend
See RELEASE-PREP-2026-10-11.md.
