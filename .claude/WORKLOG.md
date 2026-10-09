# WORKLOG: county-true place for the modern film (step 5)

Owner's directive, October 9th, 2026, verbatim: "go ahead with step 5". Step 5 of the plan given
the same day: "Place, the weakest score. Large effort. None of the 20 repos solves this; your own
Texas 3D kit (115 models plus the regional lighting from the carousel) does. Render the 3D scenes
once as layered backgrounds and move them in Remotion. Add county map moments using Remotion's
map-timing rules. Use real local photos with their sources recorded; 10 of the last 14 films had
none."

Branch: `tsturg/hopeful-johnson-5mmhbb` (TexasAIDispatch). Identity Talon Sturgill. No AI
trailers. Ready PR, exact-head CI green, merge (CLAUDE.md delivery policy). Let PR #116 (the
October 8th run's archive) merge first, so its closing step never meets the new renderer hashes.

## Measured starting point

- place averages 6.36 over the last 10 report cards, weakest axis in 8 of 10 panels.
- 72 of the last 105 scenes (14 films) were interiors; all 6 of October 8th's were.
- directed-film-v2 episodes painted a flat full-frame gradient; nothing in `modern/` read
  `scene.region` or `scene.county`.
- 4 of the last 14 films carried any outside imagery, none an actual-site photo. Recent visual
  searches rejected almost every candidate for no reuse licence or no story action.

## Waves

| # | wave | status |
|---|---|---|
| 1 | `county_regions.py` computes all 254 counties from TPWD Gould polygons; ship_gate accepts measured straddles | DONE, pushed 62608f0 |
| 2 | Plates: `assets/place/plate.js` + 10 scene pages; `scripts/place_bake.py` bakes sky, ground (homography) and depth cards, checks reassembly, cover, slide; manifest `video-engine/src/modern/placePlates.json` | DONE locally (first design, three depth bands, sheared the ground; rebuilt as ground + cards). Bake of all ten finishing |
| 3 | `modern/PlaceStage.tsx`: exterior parallax via manifest profiles, interior window (below title band, high key), overhead; DirectedFilm wraps episodes; Cooling and FlyGene leave backgrounds open when placed | DONE locally |
| 4 | Gate `scripts/place_check.py --render` (magenta probe per shot), preship row, CI on board-a `--opt-in`; parity test `video-engine/tests/place_stage.mjs` | DONE locally; PLACE_MIN_SHARE comment needs the measured minimum |
| 5 | County locator `modern/CountyLocator.tsx` + `scripts/county_map.py` (LCC, fresh-build check); timing 2.5/1.0/0.7 s; no words | DONE locally |
| 6 | Real stills: `scripts/place_photos.py` (LoC Lyda Hill Texas Collection, advisory on record, `--fetch` writes provenance); 01-research.md and DAILY_PRODUCTION.md | DONE locally |
| 7 | Proof: render Oct 7 and Oct 8 films as shipped and on the stage, blind-grade the place question | TODO after bake |
| 8 | Finalize manifest (policy), re-hash board-a/board-b renderer_inputs, full local CI (`out/tools/ci_local.py`), commit, PR ready, CI green, merge | TODO |

## Files

- scripts: county_regions.py, place_bake.py, place_check.py, county_map.py, place_photos.py,
  modern_film.py (renderer_inputs adds the stage files), preship_check.py (place_check row)
- engine: src/modern/{PlaceStage,CountyLocator}.tsx, placePlates.json, texasCounties.json,
  DirectedFilm.tsx, CoolingFilm.tsx, FlyGeneFilm.tsx, tsconfig resolveJsonModule, tests/place_stage.mjs
- assets: assets/place/plate.js, assets/place/scenes/*.html, video-engine/public/place/*
- docs: MODERN_FILM.md, REGIONS.md, DAILY_PRODUCTION.md, GATE_LESSONS.md, CLAUDE.md,
  prompts/phases/01-research.md, 02-picture.md; CI guards.yml
- scratch: out/place-bake (bake log, posters), out/proof, out/tools, out/docket-main (Docket
  worktree at 6326b02db, remove with `git -C /home/user/TexasAIDocket worktree remove`)
