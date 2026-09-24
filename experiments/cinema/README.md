# Through the lens

Open [the comparison player](deliverables/index.html) or play the
[full-resolution hybrid](deliverables/hybrid-master.mp4). The three treatments use the same
20-second action sequence and the same original sound. The player switches at the current time.

The selected direction is **hybrid**. The dimensional model gives the optics thickness,
reflections, depth and changing silhouettes. Small native annotations identify the lens groups
and sensor without covering the action. SVG remains useful for precise diagrams and expressive
illustration. No audience-retention gain has been measured.

## What was built

- A frame-driven Three.js lane inside the existing Remotion, React and TypeScript engine.
- Reusable procedural studio lighting, camera placement and motion functions.
- An original optical assembly with layered glass, an iris, metal rings, heat fins, fasteners,
  traces and a responding sensor grid.
- Three playable treatments, an exact-film contact sheet, a full-resolution master and a
  comparison player that works at phone size.
- Original mechanical foley and soft sonification, without narration or an external soundtrack.
- A bounded reproduction command and actual-render checks for both SVG and WebGL subjects.

The new craft guide is part of the daily routine. It requires a finished hero passage before
the whole episode, selects the renderer from the action, and preserves source, caption, panel
and publication checks. This study has its own composition entrypoint. It does not become a
daily episode or a reusable news script.

## Review findings

The actual MP4 contact sheet exposed a hidden SVG subject. A positioned background was covering
the unpositioned illustration. Explicit positioning fixed the layer order. The CI pixel probe
rejects a frame extracted from that defective film and accepts all three corrected subjects.

The first audiovisual model review identified harsh sensor clicks. They were replaced with
overlapping, softly enveloped tones. The exploded sequence now explicitly identifies its light
path as schematic. This is a conceptual design study with invented geometry, not a physical
optics simulation, a product specification or evidence about a real camera.

The final audiovisual model critique preferred the hybrid and reported no blocking defect.
Its raw response is preserved in [comparative-review.json](deliverables/comparative-review.json).
It is one model critique, not a human panel or an audience test. Some descriptions are inaccurate.
The iris stays open at the end, and the hybrid remains a 3D render throughout its exploded view.
Those descriptions were not accepted as evidence about the implementation.

The opening macro and the exploded assembly are the strongest images. The least effective
passage is the pullback around two to five seconds, where the camera does most of the work.
For a sourced daily film, use that interval for a visible operation or a human consequence.
The study is a rendering benchmark, not a substitute for documentary pacing and story structure.

## Verification

- All three corrected MP4s decode for their full duration.
- The selected master is 1080 by 1920 at 30 fps. Comparison previews are 540 by 960.
- Final AAC audio measures -18.4 LUFS integrated and -4.0 dBFS true peak.
- Frame-state seeking, camera clearance, action progression and dependency pins are tested.
- Actual rendered subject checks run in CI for all three treatments.
- The composition guard checks explicit entrypoints and rejects an id from the wrong root,
  missing entrypoints, unknown ids and missing font loading.
- The comparison was inspected at a 390-pixel phone viewport. Audio-enabled playback completed
  without a media error. Browser playback status is not a claim of human listening.
- Original comparison-server seeking failed because its server did not support byte ranges.
  The included local preview server supplies byte ranges.

Rendered hashes and observed timings are in
[render-evidence.json](deliverables/render-evidence.json). The corrected preview renders took
11.29 seconds for SVG and 14.64 seconds for dimensional. The full-resolution hybrid took
30.23 seconds including packaging on the local machine with a warm bundle cache.
These are development observations, not render-time guarantees.

## Reproduce

Run from the repository through its environment wrapper.

```sh
bash scripts/run_with_env.sh python3 experiments/cinema/render.py
bash scripts/run_with_env.sh python3 experiments/cinema/package.py
bash scripts/run_with_env.sh python3 experiments/cinema/preview.py
```

In an isolated workspace checkout, enter that checkout inside the shell passed to the canonical
wrapper. The workspace wrapper otherwise changes the working directory to its canonical repo.

The render command reserves each full render against out/cinema/run_state.json before running
it. Repeating the command retains the existing budget. It pins Chromium's angle backend,
keeps original timing, uses the same audio for every treatment and records source hashes.
The preview server binds only to 127.0.0.1. Open http://127.0.0.1:8783.

To use the dimensional lane in a sourced episode, read
[the production guide](../../knowledge/craft/CINEMATIC_PRODUCTION.md). Drive actions from the
board's existing event windows, register a story-specific cinematic template, and use the normal
Dispatch render and delivery path. The benchmark renderer is not a daily publishing shortcut.

## Sources and rights

The geometry, animation and sound were authored for this study. It uses the repository's
existing licensed fonts and brand mark. It downloads no stock model, photograph, texture or sound.

- [Remotion Three.js integration](https://www.remotion.dev/docs/three)
- [Frame-driven ThreeCanvas](https://www.remotion.dev/docs/three-canvas)
- [Three.js physical surfaces](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)

The implementation retains Remotion 4.0.399 and matches its Three.js adapter to the same version.
