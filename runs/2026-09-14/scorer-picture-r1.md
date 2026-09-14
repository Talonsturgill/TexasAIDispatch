# Independent picture-first review, round one

Film SHA256: e15c9075f8315b4bd5f427e678409754015c402cdcaf32a07619cfe0e676a604. Actual film hash matches render-manifest. Rubric and scorer brief read directly. Score is 6.788, computed from the six axis weights without rounding up. Ship false on weighted quality. No discussion with other reviewers.

I inspected all eight full-size film-derived scene frames, the credits frame, the feed composite and an additional 22-frame sequence extracted directly from the final film, including zero, eight-tenths and one-point-eight seconds and paired times for every scene. The extra sequence is scorer-picture-motion-r1.png. This is sampled motion inspection, not uninterrupted playback. Direct listening is unavailable; I did not hear this film. Voice judgments rely on the actual alignment, mix and voice-review reports and are limited accordingly.

## Axis reasoning

- Hook 6.5: The opening paper road develops a square missing seam within the first two seconds, a real visual event rather than a pure title hold. But a binder, a worried presenter and a truck already occupy an abstract stage at zero; the stakes require the caption and heading. The first composition does not yet convey a particular highway operation to a stranger.
- Story 7.8: Dated company disclosure, honest definition, Texas plan, existing freight and remaining work are clear. The distinction between completion percentage and trip probability earns the turn. Geography and launch limits survive the final script. The omission of the prior comparison makes movement less sharp, but does not make the story false.
- Picture 7.2: Paired final-film samples show the paper gap opening, progress fill, separated claim/evidence pages joining, the number migrating toward the binder, the Texas shape translating, the freight vehicle crossing, and the case closing. Thus this is not a held slide. Several shots are still word-bearing rectangles beside the same presenter; the separate verification activities are only named on the binder, which limits visual revelation.
- Place 6.0: The workshop is region-neutral and does not contradict Dallas, but it offers very little local credibility beyond the names. The existing-freight vehicle reads as a rigid short box truck with a continuous cargo body rather than a clearly articulated long-haul tractor and trailer. That is the most useful place/kit correction. Do not add a newly claimed launch lane or county.
- Craft 6.2: Cream/plum contrast, paper edges, binder rotation and layered planes are coherent. The final heading runs to the extreme right edge and crosses the feed reserve; it should wrap. In scene five, INITIAL LAUNCH MARKET sits partly beyond the cream Texas shape in dark lettering on the dark room and becomes difficult to read. The secondary qualifier is also tiny in the feed composite. The repetitive generic presenter and virtually pristine kit limit the stage's credibility.
- Voice 6.5: Exact acoustic reconciliation and measured caption edges are evidence in its favor. The pitch report shows variance but cannot establish a natural performance. The master reports -18.37 LUFS, below its own target, and the last spoken boundary is 33.3 seconds in a 43-second film; the extended visual close and five-second credits account for the remainder. I make no claim about timbre, pronunciation or audible mix quality without listening.

## Hard-fail audit

- Numerals: 93 percent and the September eighth dateline occur in c1's fetched quote. The probability correction reuses the same sourced figure and is explicitly interpretation of c2, not a new statistical claim. The credit licence version is the narrow exception; package verification should remain part of the ship gate.
- Captions: captions.json uses measured boundaries for every cue, based on the final 43-second mixed waveform in words.json. Interior word positions are explicitly modelled, but those positions are not the caption edges. Current ship_gate.py explicitly accepts silence_anchored alongside forced_alignment; I found no hand shift or scaled caption edge and do not mislabel this phoneme forced alignment.
- Stretch: mix.json says 1.0 for the master and every track; voice-review agrees. No stretch evidence found.
- Region: interior schematic has no contradictory ecology or region. Weak place score is not a fabricated wrong-region hard fail.
- Retired motifs and hats: none observed in the sampled final frames.
- Held slides: paired final-film frames reveal real object motion and state change in all scenes. Credits last five seconds, not longer than five.
- Rendered binding: all narrated ideas have specific physical items and changes; several are diagrammatic, but they are present. Bespoke highway-safety-case-v1 is registered by the board, with a continuous unfinished case, probability turn, closing binder and source credits actually observed.

## Executable correction

Replace the rigid box-truck drawing with a semitrailer silhouette with a distinct tractor cab, fifth-wheel/articulation gap and trailer wheels. Wrap A TARGET, NOT A LAUNCH onto two lines within the same safe width as the other supers. Move INITIAL LAUNCH MARKET onto a cream or plum-backed plate with contrasting text fully inside the feed-safe area. Preserve the factual script and recheck the final film after rerendering.
