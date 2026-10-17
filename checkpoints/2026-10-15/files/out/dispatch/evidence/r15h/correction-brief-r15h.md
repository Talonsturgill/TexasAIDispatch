# R15h consolidated standard-scope correction brief (2026-10-15 edition)

Status: the repair batch is OPEN (begin-repair done on evidence/r15h/repair-plan-r15h.json, reboard 14/14 reserved). Edit only the declared files. Do NOT capture, render, preview or run any paid command. Do NOT launch agents. Return one handoff.

## Evidence (read first, in full)
- Independent classification (critic 43): /home/user/restore/TexasAIDispatch/out/dispatch/evidence/r15g/review-r15h-classification/report-verbatim.json
- Panel round 1 verbatim handbacks: /home/user/restore/TexasAIDispatch/out/dispatch/evidence/r15g/panel-round-1/ (picture, story, sound-corrected-json)
- Failure evidence bound to the plan: /home/user/restore/TexasAIDispatch/out/dispatch/evidence/r15h/picture-panel-report-reissued-verbatim.json
- Baselines (byte-identical copies of what you may change): /home/user/restore/TexasAIDispatch/out/dispatch/evidence/r15h/baseline/

## Files you may change (and only these)
- video-engine/src/modern/episodes/2026-10-15/FloodStationFilm.tsx
- video-engine/src/modern/episodes/2026-10-15/StreetHubSupport.tsx
- out/dispatch/storyboard.json, out/dispatch/opening-a.json, out/dispatch/opening-b.json (storyboard.json and opening-a.json stay byte-identical to each other, as before)
Everything else is unchanged: narration script, claims, voice, mix, captions, words, clause timing and every narration-picture binding id and its window. A board edit must pass board_diff showing no change to narration, claims, captions or clause windows. Do not edit renderer_inputs hashes, art receipts or native_media: the director rebinds those after your handback.

## The corrections (all of them, one consolidated pass)
Legibility and layout (renderer, per classification B1 to B5), proven in FINAL SCREEN SPACE for every frame of the shot in BOTH treatments (A dollyThrough, B truckAcross), including the PlaceSubject plate zoom:
1. B1 phone banner (s1, 5.6 to 8.6 s): lay the Flash Flood Warning banner out so "Flash Flood" and "Warning" fit inside the banner with at least 8 px margin. Do not shrink type below today's rendered size; reflow instead (own row for the icon, wider banner, or a larger phone only in this shot). Same strings.
2. B2 chip-glow detail push (s4, about 23.8 to 25.4 s): the enclosure, lamp and the "flood risk" bar label stay at least 40 px inside every edge.
3. B3 blank Field result card (s7 validation-card 48.0 to 49.2 s and s8 no-field-card 49.2 to 52.1 s): this is the THIRD crop in this family (R15e, R15f, now B3). Do NOT tweak push scale or focus again. Change the mechanism: a HELD framing (no push) with cards sized and placed inside the composed safe margins, with the full card body inside the frame at rest. Keep the R15f margins: 98.82 figure and its heading at least 40 px from the left edge, the assessments tag at least 30 px, "None reported" ending by x 1050, the disclosure chip (x 44 to 394, y 132 to about 220) clear, everything above the caption band, stamp contact preserved.
4. B4 s9 "Deployment goal" tag: move it so it overlaps neither the bench station nor the case pocket in either treatment, inside the B 1.45 camera frame.
5. B5 s6 flood-paths map: end the bezel above the caption band top for the whole shot (about 38.1 to 41.0 s).

Comprehension (board, classification B6 and B7; narration and clause windows stay exactly as bound):
6. B6 n3a: for the whole "Four optical sensors at different heights watch the water" clause (15.9 to 19.14 s) the picture must show only the four optical water sensors. Extend the optical-lens shot through the clause end and remove or relocate the Rain/Temperature/Humidity/Light weather labels so they cannot be read as the optical sensors (they may appear only after 19.14 s, or be dropped, if their event can move without changing any bound event id or window; otherwise drop them). Keep the "Illustration" disclosure chip on every station shot.
7. B7 n9a and closing_answer: replace the tuck-into-pocket-and-latch closing with a FORWARD reading that returns to the opening picture: the flooded yard and the dark phone, with the station ringed on the pole beside the "None reported" imprint or its tag, and no shelving gesture. The model station must stay visible (no fade) and the "Deployment goal" tag must not cover it. The independent pivot requirement for this closing was met by recording that the change is of mechanism (return to the opening yard and phone), not an offset tweak.

Modern floor (finish and pace, classification B8 to B10):
8. Closed eyes: the shared Head draws closed lid arcs whenever pitch < -0.45 (Responder pitch -0.62, Technician -0.55). Change the rule so seated and typing figures keep open eyes in every scene that uses Head.
9. Disembodied arms: attach the Reacher arms to a figure (shoulder anchored to a visible torso) at 50.0 to 51.0 s and 52.2 to 55.4 s, and keep the technician's arms outside the case and bag.
10. Holds: inside the existing shot and clause windows, start each performed action at its clause onset (chip pulse at 20.0 s, the 33.4 to 35.4 s and 29.4 to 31.0 s holds, the validation fill and number so the 98.82 arrives with its clause, the 57.4 to 59.4 s tail) so no held interval exceeds about 1.4 s. The credits card stays 5.0 s or less.

## Proof you must run yourself (free)
- `cd video-engine && npx tsc -p tsconfig.json --noEmit` (the real production typecheck).
- storyboard_check, native_sample_plan, place_check (per earlier handoffs), board_diff against the baselines, and caption/narration-binding checks (caption_board_fit, flow_check, documentary_check) on the edited boards.
- For every frame-edge bound above, show the composed-transform arithmetic (a bounded feasibility check over every frame, both treatments), not an eyeball.
No renders, stills, previews or captures. Run each shell command through `bash scripts/run_with_env.sh` with an explicit `cd /home/user/restore/TexasAIDispatch` inside it.

## Handback
One JSON-able summary: files changed with sha256 before and after, each of B1 to B10 and how it was met (with the bounds shown), what you could not do and why, and every risk. Do not claim any visual result you did not compute.
