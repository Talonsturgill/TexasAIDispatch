# Cinematic production

Owner-authorized visual upgrade, September 23rd, 2026.

The viewer should remember an action and an image. Begin visual development with the hardest
sequence. Render it with final light, surfaces, timing and sound before extending the film.
A passing technical gate is necessary and does not establish visual appeal.

## Choose the medium from the action

Use SVG for precise diagrams, maps, source extracts and expressive illustration.
Use Three.js for actions whose comprehension improves with depth, surface response, moving
light or a camera that travels around a mechanism. Use a hybrid when a dimensional action needs
a small editorial annotation. A topic is not a reason to repeat yesterday's scene.

The comparative optical study is in experiments/cinema. It is an illustrative design study,
not a news episode, a physical optics simulation or a measured audience-retention result.
Do not reuse its lens script as a daily story.

## Build the hero passage

1. Name the thing that changes. Choose one action that earns close attention.
2. Compose opening, transformation and consequence as distinct images. Keep an identifiable
   object or path across all three. Draw both the sourced limit and the useful result.
3. Build a short passage with final surfaces and light. Geometry needs thickness, edges,
   contact, fasteners and wear where the object calls for them. Decorative detail must not
   obscure the silhouette at phone size.
4. Animate anticipation, action and settling on the board's own event windows. Keep a dominant
   action; stagger its supporting motion. Use sound tied to the visible action. Mark modeled
   sound as sonification when it represents an invisible process.
5. Inspect the rendered clip muted and with audio when available. Record the basis of each
   judgment. Fix clutter, accidental crops, unreadable subjects and confusing handoffs before
   building the rest of the film.

Use the existing controller reservations for hero preflights. Stay within the existing resource
ceilings; no new shell or experiment resets a daily run's state.

## Keep the daily pace

Use the hook deadline, action lengths and reward spacing in `config/documentary.json`.
Block the visible action on that clock before polishing surfaces, then keep those event windows
through the finished passage. A more detailed model earns no extra screen time. The optical
study's camera-led pullback is a known weak interval, not an editing reference.

Enter on an action, show its consequence, and carry a recognizable subject into the next
development. Cut repeated setup and idle travel. Preserve a short hold when a reveal, comparison
or source limit needs to register. Every cut needs continuity and one dominant idea. Constant
motion can be tiring while a held camera can contain a fast, readable action.

Judge the actual phone-sized cut with labels mentally covered. Identify both an unearned pause
and any handoff that arrives too quickly to understand, if either exists. Trim redundant prose
before requesting a faster read, and never time-stretch narration. Use the existing animatic and
hero preflight budgets. Additional treatments are for unresolved visual questions.

## Deterministic dimensional scenes

Import CinematicStage from video-engine/src/lib/cinema/CinematicStage.tsx.
It provides the frame-compatible ThreeCanvas, authored studio environment, light and camera.
Pass explicit position and target values derived from the existing board event clock.
Import cue, mix and pointOn from lib/cinema/motion.ts for bounded easing and camera tracks.
Use actionWindows and actionProgress for production board events; the fixed clock in the optical
study belongs only to that benchmark.

Never use useFrame, requestAnimationFrame, Date.now, performance.now or Math.random to advance
a rendered subject. Any frame must reproduce when rendered alone, backwards or out of order.
Precompute simulations if a shot needs them, commit their provenance, and sample the result by
frame. Dispose replaced geometry and textures. Render native text outside the GPU canvas.

Render WebGL with Chromium angle. The pinned @remotion/three version must match Remotion.
Keep a short preflight at the actual render settings. A GPU context failure stops production;
it does not authorize a silent renderer fallback.

## Review and adoption

Compare the exact films using the same subject, action duration and sound. Judge composition,
readable mechanism, continuity, the least effective interval, and audio evidence separately.
Phone inspection and complete playback are required. Capture a contact sheet from the MP4,
not a second still renderer. A technical screen is not a creative vote. Do not invent a
viewer panel or infer retention gains from an agent's preference.

A visual study does not enter the daily feed. A new dimensional daily episode still registers
its own cinematic_template, uses the current source-bound storyboard, shared SubtitleTrack and
CreditsCard, measured final mix captions, final animatic, exact-film attention review, three
independent judges and every delivery gate. The shared stage changes how a subject is drawn,
not the evidence required to publish it.

## Technical references

- https://www.remotion.dev/docs/three
- https://www.remotion.dev/docs/three-canvas
- https://threejs.org/docs/pages/MeshPhysicalMaterial.html

Consult the installed version before using newer documentation features. This integration
deliberately retains the existing Remotion pin and does not depend on WebGPU-only APIs.
