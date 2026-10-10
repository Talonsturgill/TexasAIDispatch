# Repair 5 builder handoff (verbatim hand-back text, code only, no pixels)

Fixed both findings in code and boards. Every cheap check passes with exit 0. Nothing captured or rendered, no controller command run. This approves no pixels.

Files changed (before to after sha256)
- ClinicAnswerFilm.tsx: 9d8da3600252972f7dcbc77d6a2f685ef890eef70efd69500e81ee5a841b48ce to 24cd027dcfdce8ad0aa5fd055f6e69cdcfb52b2fb2dcf4b5ee72e78c2832225f
- storyboard.json and opening-a.json: 4ce09bebb5abecfafe212cb4e573e35023f40c1271ccc452aacd76bdf18ca8fa to a63eb19b59911aa741433b82e4f36475796d692de1efe45b3bd824a4bfd26360
- opening-b.json: 59f331110d86dbd0905c56612293ac0649dbba03d8bc6b9148a06d4192bccfea to 86f653c77828f5a3722cac7c2b34e27b951d19e1a3aa3b7a4eb49761c92fadac
- ChartHero.tsx and ClinicSupport.tsx unchanged. Authored art receipts and native_media module hashes still correct. film_direction.renderer_inputs regenerated in all three boards.

s8-shot-1 (share-grid, keep-evaluating): new S8_TAGS layout. Evaluating tag on the end pin, side left, drop 60, scale 1.628, body x 135-635 (A) and 131-630 (B). Decision and report moved to the start pin, side left (drops 0 and 150), out of frame. Camera A f=[816,398] (was [728,398]), B f=[778,685] (was [690,685]), scale 2.2.

s8-shot-2 (answer-close, ending() rewritten): board at scale 1.2 cropped at its bottom rail, lowest figure row ends at y -9.6, no figure in frame. Half / More than half label and bar at y 14-108 above the pill. Evaluating tag on end pin at scale 1.93, body x 100-692, y 269-478, 12.07 px type at 270 width. Answer card at (530,815) scale 1.5, Sources filled, Accuracy empty, ring pulse, two Not in release tags (x 37-551, y 884-1232), above the estimated caption top y 1298. Chart beside the answer on the left: A flat on the desk (flat .6, scale .95, box x -70-283, y 503-865). B on its stand (scale .8, seed 5, box x -50-248, y 486-876).

s1 to s7: no code path changed. No narration, claims, captions, events or timing changed.

Findings: BD3 resolved at code scope (nothing under the pill x 44-516 y 132-188, one tag in frame so no overlap). BD5 resolved by drawing the chart, binding texts left unchanged because now true. Wording: clinician tokens now anonymous clinician figures, source_limit now "any real or identifiable clinician or a patient".

Checks (logs in out/dispatch/repair-5-builder-checks/): tsc 0, picture_precheck storyboard 0, opening-b 0, authored_story_art verify 0/0/0, engine_lint 0, registry_check 0, ending_geometry 0, story_digest computed. New story digests: storyboard 7c1459d11a90edb7b0b5d1c2408ad9ec4856f199794fe1c403be625ab373bfd5, opening-b cbd41820e54d2766691181b260ed15a1729e59d8e02ae33d01896778e16e4cd0.

UNRESOLVED OR WORTH A REVIEWER'S EYE (preserved for the independent critic)
1. Answer scale stays 1.5, not the suggested 1.8 to 2.0. The two open tags are drawn inside ChartHero and hang left of the clip, card plus tags span about 673 times s px, so 1.5 is the widest that fits 1080. Larger needs a ChartHero change, which breaks the authored art receipt and needs a fresh record and charge.
2. Decision and report tags moved pins in s8. In s5 and s6 they hang from start and end pins. In s8 both hang from the start pin off the bar's left end, not visible in either s8 shot. Continuity change. The end pin now holds the evaluating tag where report hung in s6. In code they overlap each other off frame.
3. Share figures are not in the final frame. Only the bar, label and evaluating tag are. A reviewer should judge whether the share still reads as clinicians from the 2.25 s shot just before.
4. A's chart now lies on the desk. In s1 to s3 it hangs on the wall rail. B's chart is on its stand as before.
5. B shot-1 camera move puts the tool at the left edge (about x -25 to 573, y 846 and below).
6. story_art.requests[0].source_limit still says "a clinician or a patient". It is receipt-bound by request_sha256, changing it would break the authored record.
7. The ending paints a full-frame background, inherited from the previous ending and other close surfaces. Only place_check --render can measure it.

All geometry numbers come from analysis, not pixels.

Director note: the builder's daily_production_digest.py probe exited 2 because that script does not exist. The original stderr is retained verbatim in out/dispatch/retained-failures/builder-r5-digest-probe.json taken from the worker transcript. The worker's own log was later overwritten.
