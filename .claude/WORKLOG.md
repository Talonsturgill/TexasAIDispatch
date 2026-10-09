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
| 7 | Proof round 1: renders + blind grade. Place 2.0 to 3.6, legibility 7.6 to 6.0, preferred 5 to 3. Grader: refinery view wrong for a Medical Center story; window behind macro subjects; dark mullions cross thin lines; locator half-drawn in stills | DONE |
| 7b | Fixes: county-scoped plates (gulf-houston Harris, blackland-dallas, -austin Travis, -san-antonio Bexar; gulf-shipchannel by place_plate only), region plates stripped of skylines and refineries; close/detail interiors are a soft wash; light window frame; ghost locator outline; wall_views; plate selection in stage and gate | DONE; bake-2 got austin, dallas, san-antonio, blackland-wide, then was stopped for 7c |
| 7c | Water read as concrete (Austin) and grass grew in rivers (San Antonio). `assets/place/water.js`: mirror water (reflects the world in its plane, Fresnel over a dark body), channel/pond/sheet outlines, dry() clears scatter off water. Five scenes moved onto it; Austin camera to 9 m, lake 320 m wide, skyline nearer; SA river offset right of the camera. place_bake records per-plate `modules` hashes (backfilled plate.js from the old global hash) and verify checks them. GATE_LESSONS + MODERN_FILM updated | code DONE; bake-4 (austin, san-antonio, cross-timbers, gulf-houston, gulf-shipchannel, gulf-wide, trans-pecos) running 03:39 |
| 7d | Above the eye is not ground: skylines (asGround) and terrain ridges were in the ground layer, moved 38 to 64 px by a rise (out/tools/above_horizon.py). plate.js draws the ground clipped at eye height (+0.5 m overlap), and each surface rising above the eye gets a tall card at the median depth of its above-eye vertices (lo/hi = 5th/95th) with seam points on the horizon. place_bake measures every tall-card pixel against the depth pass (Plate.surface_px) and the seam; self-test case added. water.js caches its reflection per camera so clipped passes reuse the full picture's. GATE_LESSONS entry | DONE; full bake-6 (all 15) started 03:52 |
| 7e | Hill Country plate was a bare field (trees, gate out of frame, no limestone). Reworked: camera 1.9 m, trees and gate in frame, terrain size 1600 at -800 (ridges within ~400 m), golden-grey grass, small limestone cobbles. First try (caliche + big rocks) read as snow | preview pending; must be on disk before bake-6 reaches it |
| 8 | Proof round 2: re-render both films (`out/tools/proof.py --render --after-only`), blind pairs new seed, fresh grader(s) with the round-1 prompt verbatim, README (PLATES_TABLE via out/tools/plates_table.py, BLIND_SECTION), compare.webp (out/tools/compare_sheet.py), locator.webp (batch-loc + 2.2 s) | TODO after bake-4 |
| 9 | Finalize manifest (policy), rehash fixtures (`out/tools/rehash.py`), place_stage.mjs, local CI (`out/tools/ci_local.py`), commit plates, merge origin/main, push, ready PR, CI green, merge, delete this file | TODO |

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
