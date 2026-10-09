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
python scripts/daily_production.py --board out/dispatch/storyboard.json --claims out/dispatch/claims.json --state out/dispatch/run_state.json --packet vo-director --out out/dispatch/vo-director-packet.json
python scripts/agent_runtime.py --plan --role vo-director --packet out/dispatch/vo-director-packet.json --task-name voice_director --scope "Direct one continuous locked passage with connected phrases, clear grouping and pronunciation, source limits and the performed closing answer" --out out/dispatch/voice-director-assignment.json
python scripts/run_controller.py consume --resource voice_directors --note "final continuous read"
```

For current agent-runtime editions execute voice-director-assignment.json spawn_args; pre-effective ledgers keep the prior path. Flag every ambiguous word grouping in the same approved passage before synthesis. The actual soundcheck and alignment remain mandatory.

Spawn `vo-director` with the current approved script and vo-director-packet.json. Save per-line intent,
emphasis and energy in vo_direction.json. Its text must exactly match vo_script.txt.
Direction stays outside spoken wording. Run the prose scan before synthesis.

For newly planned editions from October 3rd, its bound guides connect the performance to the
chosen format and beat jobs. Direct emphasis to the visible discovery, explanation or source
limit. Flag picture/word mismatches in the consolidated correction before spending; preserve
approved narration and alignment when repairing pictures. Keep the same one-pass voice plan.

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

Before native capture, run scripts/native_headroom.py on the current board. It computes a complete native frame working set plus output reserve. Use that required_free_gib with the workspace housekeeping --require-headroom --min-free-gib option. Preserve active and unrelated work; native PNG capture, resolution and CRF16 stay fixed.

Before native proof, choose a hero passage that includes the causal antecedent of its narration
and captions. An ending that refers to a prior target check must include that check in the
review window. Preserve a rejected excerpt; use the strict review-context procedure in
prompts/phases/repair.md only when the full timed film and authored inputs remain exact.

```sh
python scripts/preflight_animatic.py --board out/dispatch/storyboard.json
python scripts/review_context.py --board out/dispatch/storyboard.json --film out/dispatch/preflight.mp4 --verify-report out/dispatch/preflight.json
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
For current art-profile boards, read knowledge/craft/ART_DIRECTION.md. Inspect the executed
anticipation, contact and settle windows before timing foley; a changed curve can shift the
visible contact inside an unchanged event. Keep the original measured voice and captions.
Prove focal sharpness, finished surfaces and grounded contact at native scale, plus the entire
action above the phone caption band. A profile or texture alone never approves the hero.


## Narration and picture use one clock

For new production from October 8th, every spoken clause has a narration-picture-v1 binding in board.narration_picture. Write exact clause text, concrete subject_ids, executable action_id, source claim_ids, scene_id, cue_ids and event_ids before voice production. Cover all words and qualifiers once in their original order. The registered episode declares which views actually implement those subjects and actions. A topic match, caption or label cannot replace a pictured causal step.

Before voice exists, use timing_mode authored with an explicit provisional cue plan for the silent two-treatment comparison. These estimated windows approve only planning. After alignment, board_retime.py replaces them with measured_caption_boundaries from the actual captions and acoustic word stream. Timed capture, preship and delivery require those measured inputs and reject an authored clock.

After acoustic alignment, compile every clause window from complete measured caption boundaries and the matched positional word stream. Use modern_film.compile_narration with the actual captions and words. Derive cut handoffs from silence between clauses. Only framing subdivisions inside the same subject/action may use fractions. Renderer performances consume requireNarration on the film-global clock, and retain completed consequences across cuts. Never stretch speech, scale cue times, or proportionally place a different narrated action inside a scene.

Run scripts/modern_film.py with --board, --captions, --words, --script and --claims before timed capture and preship. The gate rejects missing or duplicated clauses, omitted qualifiers, stale timing, wrong condition identity, incompatible renderer views and gaps in matching picture coverage. These checks establish bindings, not audience understanding. Code, phone and final reviewers inspect the actual subject and performed action for every clause. Return narration_picture_observations bound to the exact film, with ordered clauses containing id, pass, exact start_s/end_s and observed. Preserve a wrong or absent picture as a source/comprehension blocker even if provider metadata says pass.

A current clause must remain understandable with its captions covered. Introduce the spoken subject before its clause begins, perform the narrated change while it is heard, and retain the relevant result through the clause end. Distinguish selection, analysis, test condition, observed result and clinical limit. Generic clinical forms, a repeated test picture under an AI-selection line, or the normal condition under a patient-variant line fail this contract.
