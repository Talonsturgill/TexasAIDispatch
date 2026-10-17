# R15e technical-integrity correction brief (s7-shot-2 numeral crop and disclosure overlap)

Status: PREPARATION ONLY. No edit, reservation or builder call until the independent classification, the complete-path funding and begin-repair are done.

## The genuine evidence
Independent provider verdict on the complete corrected film (A, reviewed_preflight_sha256 c0aee5b3c9af37a5333246e4bf8ca1c99fe59882bccb6beb70758a67eaef58af), report evidence/review-r15-provider-phone/provider-phone-report-r15d.json sha256 910bed386be94db9... : REVISE. Phone 7/7 and modern 7/7 observations pass, narration 14/15 pass. Mandatory findings, all in scene s7, shot s7-shot-2 (45.6 to 49.0 s), and nowhere else:
- M1 (legibility): the detail push-in crops the card's left edge so the printed figure 98.82% reads 8.82% while the narration says ninety eight point eight two percent (narration clause n7b fails; story review blocking).
- M2 (layout): the disclosure box overlaps the card heading and the "Initial assessments after training" tag is clipped at the card's left boundary (45.6 to 48.0 s).
The same report resolves the flood-severity concern by full context and treats hand anatomy as artistic styling, so neither is a mandatory finding. A partial worker observation is not an extra verdict.

## Cause, from the bytes
FloodStationFilm.tsx case 'validation-card' (both treatments use it): pic=<Cam f={[560,700]} s={lerp(1,1.3,push)} a={[560,700]}> with push=ease(raw(start..start+1)) for framing 'detail'. The card sits at At p={[150,400]} s={.8} and the tag at At p={[200,760]} s={.86}. At scale 1.3 about [560,700] the visible world x range is about 145 to 975, so the card's left edge and left glyph margin fall outside the frame, and the screen-space disclosure chip lands over the card heading once the card rises under it.

## The one consolidated correction (renderer-only, no board change)
In FloodStationFilm.tsx, case 'validation-card' only: bound the detail push so the whole card, its figure and the tag stay inside a safe area with margin, and keep the card heading clear of the disclosure chip at the end of the push. Compute the maximum scale and focus from the card and tag world extents and the frame (no magic number guessed), keep the push eased on the same clock and the same window, keep the framing 'detail' and every event id, window, duration, caption and narration unchanged. Apply identically to treatments A and B (they share this branch). If the tag placement still clips at the bounded push, move the tag anchor right inside the card region, not the board. StreetHubSupport.tsx may change only if the tag or disclosure geometry cannot be fixed in the Film branch.
Out of scope: s8 shots, hands, flood depth, any optional polish, any board field, script, claims, captions, mix, timing.

## Visible result to prove at phone size
At every frame of 45.6 to 49.0 s the full figure 98.82% (with its leading 9), the card heading and the whole "Initial assessments after training" tag are inside the frame, nothing overlaps the disclosure chip, and the push still reads as a push.
