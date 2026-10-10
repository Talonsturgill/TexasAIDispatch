Timed animatic render failed at frame 880: "Modern shot timeline has an uncovered frame".
Cause: s6-shot-1 start 26.88 + duration 2.47 evaluates to 29.349999999999998 in JS, so DirectedFilm.filmShotAt rounds its end to frame 880, while s6-shot-2 start 29.35 rounds to frame 881 (Math.round of the exact half frame 880.5). Python round() hides this (banker's rounding).
Diagnosis only a float representation gap at a half-frame cut. Fix: s6-shot-1 duration_s written as 2.470000000000001 so the JS sum is not below 29.35. Same declared cut, no renderer or concept change (shot start_s/duration_s are outside the concept digest). Before-copy retained as storyboard.before.json.
The tooling cause (retime emits half-frame cuts, renderer rounds start and end separately) is reported, not fixed here.
