# Narration, sound and finished picture

Read knowledge/craft/VO_DIRECTION.md and knowledge/texas/SOUND.md. Voice begins after the
silent phone picture passes or the bounded creative policy establishes release eligibility
with the original artistic rejection retained. Follow knowledge/craft/BOUNDED_CREATIVE_RELEASE.md;
all source, rights, readable-picture and comprehension evidence remains mandatory. Use one whole-passage take by default; numeric call targets
and remaining allowances come from the controller. Every take includes its audible soundcheck.

At the finite creative boundary, have the same independent critic complete the separately
bound assessment template from the retained exact phone evidence, then verify it before voice:

```sh
python scripts/creative_release.py --board out/dispatch/storyboard.json --report out/dispatch/phone-critic-current.json --scope phone
```

This command preserves the original rejection and refuses missing integrity observations.

```sh
python scripts/script_evidence_check.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json
python scripts/run_controller.py consume --resource voice_directors --note "final continuous read"
```

Spawn `vo-director` with the current approved script and compact packet. Save per-line intent,
emphasis and energy in vo_direction.json. Its text must exactly match vo_script.txt.
Direction stays outside spoken wording. Run the prose scan before synthesis.

```sh
python scripts/vo_synth_gemini.py --script out/dispatch/vo_script.txt --direction out/dispatch/vo_direction.json --out out/dispatch/takes --takes 1 --run-state out/dispatch/run_state.json
python scripts/vo_soundcheck.py --takes out/dispatch/takes/takes.json --script out/dispatch/vo_script.txt --cut <story-runtime>
```

Never stretch or resample speech. For measured dead-air excess only, use the bounded
compact_take.py recovery in prompts/phases/tooling.md, preserving its waveform evidence.
Otherwise shorten the source-grounded script, refresh direction and continuity approval, and
synthesize the authorized changed passage. Reuse a good take while its spoken claims still fit.

Build motivated foley for visible contact and consequence. Each sfx_event has wav, at_s,
dur_s, gain and what naming its on-screen cause. Read assets/sfx/catalog.json after building.
Do not attach generic impacts to every cut.

```sh
python scripts/foley.py --build assets/sfx
python scripts/source_music.py --brief out/dispatch/music_brief.json
python scripts/music.py --select --brief out/dispatch/music_brief.json
python scripts/music.py --fit <track-id> --brief out/dispatch/music_brief.json
python scripts/music.py --credits <track-id> > out/dispatch/music_credit.txt
python scripts/prepare_music.py --track <track-id> --out out/dispatch/music_bed.wav --manifest out/dispatch/music_bed.json
```

Use a real named-artist recording permitting commercial synchronization/editing: evidenced
public domain, CC0 or CC BY. Match every music_brief field, avoid unsuitable vocals/context,
and respect recent-use avoidance. Missing rights or files require sourcing repair, not a
synthesized fallback. Keep the exact generated music credit; choose another track if its
unalterable title conflicts with the numeral policy. Credits contain compact source labels,
brand and generated attribution, without internal ids, repository URLs or commit hashes.

Mix through runtime_s + credits_s with the registry mix_gap_db; no universal gain scalar.
Mastering preserves sample count and records loudness/compression/peak evidence.

```sh
python scripts/mix.py --board out/dispatch/storyboard.json --vo out/dispatch/takes/<chosen>.wav --sfx out/dispatch/sfx_events.json --bed out/dispatch/music_bed.wav --bed-track <track-id> --bed-manifest out/dispatch/music_bed.json --bed-gap-db <registry-gap> --vo-at <measured-hook-space> --out out/dispatch/mix.wav --cut <story-plus-credit-runtime>
python scripts/vo_align.py --wav out/dispatch/mix.wav --script out/dispatch/vo_script.txt --voice out/dispatch/mix_vo.wav --out out/dispatch
python scripts/board_captions.py --board out/dispatch/storyboard.json --captions out/dispatch/captions.json
python scripts/board_retime.py --board out/dispatch/storyboard.json --words out/dispatch/words.json --sfx out/dispatch/sfx_events.json
```

Align on the final mix, detect phrases on its same-clock voice stem. Pinned whisper.cpp DTW
and reconciled measured speech runs supply word identity and cue grouping; missing/stale ASR
evidence fails. Never prompt ASR with the script or type timing overrides. Sourced name aliases
are spelling evidence only. Keep quiet consonants; repair a detector fault with negative tests.

After retiming moves cuts or foley, remix with the same voice offset, align again with --cuts
out/dispatch/storyboard.json, fold cues and confirm the retime is stable. Use authored event
timing; never manually change derived at_s. Split overlong pictured beats instead of holding.

Repeat the cheap board, source and caption checks. Then render the final timed phone preview
and obtain its current independent exact-film critique. If the assigned host worker cannot
start, follow prompts/phases/review-availability.md immediately. Inspect the longest caption in the
phone picture. If it hides the action, shorten groups at measured boundaries and rerender.

Before native proof, choose a hero passage that includes the causal antecedent of its narration
and captions. An ending that refers to a prior target check must include that check in the
review window. Preserve a rejected excerpt; use the strict review-context procedure in
prompts/phases/repair.md only when the full timed film and authored inputs remain exact.

```sh
python scripts/preflight_animatic.py --board out/dispatch/storyboard.json
python scripts/cinema_proof.py --board out/dispatch/storyboard.json --mix out/dispatch/mix.wav --state out/dispatch/run_state.json
python scripts/audiovisual_review.py --role hero --film out/dispatch/cinema/hero.mp4 --out out/dispatch/cinema/hero-review.json
python scripts/production_quality.py --board out/dispatch/storyboard.json --mix out/dispatch/mix.wav --preview
```

cinema_proof uses one bundle/browser for missing hero and stage samples. It can reuse exact
retained bytes only after dependency validation; an unrelated ending edit can reuse the hero.
The current whole-board proof, phone approval, stage ablation, provider verdict and final
film match remain mandatory. Do not repurchase a review of identical bytes for the same lens.

After native hero approval, run the sole full-render entry point:

```sh
bash scripts/render_dispatch.sh
```

It validates and reserves before rendering, uses native PNG capture and CRF 16, muxes without
-shortest, creates the exact render manifest, extracts frames and registers the actual film.
Inspect encoded dimensions, sharpness, captions and measured audio. A quarter-scale animatic
or rescue upscale is never delivery quality. Infrastructure failures go to active repair.

From the effective date in config/creative_production.json, execute CREATIVE_DIRECTION.md.
The voice director binds the current sound arc and selected opening; the mixer consumes
creative_direction.sound cues on the actual board clock. Supply matching sfx id/event_id
records and --board on every mix. Retime those records with board_retime.py, then remix.
The release gate refuses a stale sound/timing digest. Keep one narration take by default.
