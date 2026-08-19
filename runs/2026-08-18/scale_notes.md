# Board scale calibration, measured by rendering (2026-08-18)

M = 610 draw units per 1.70 m (lib/scale.ts). Every rig is TRUE SCALE at `scale: 1`,
so `scale` is a uniform world zoom and not a per-element size dial.

  frame width  metres = 3.01 / scale
  frame height metres = 5.35 / scale
  a person renders 610 * scale pixels tall

Measured against rendered probes:
  scale 1.00 -> 3.0 m of world across the frame. A person is 610px. A pivot, a truck
               or a CT gantry is far larger than the frame, which is correct and not
               a bug.
  scale 0.25 -> 12 m across. A person is 152px.
  scale 0.12 -> 25 m across. A tractor unit and trailer just fit. A person is 73px.
  scale 0.05 -> 60 m across.

SO: everything sharing a shot shares roughly one scale, or the shot is no longer true
scale. Size difference between a hero and its background comes from staging items on
different PLANES at different scales, not from zooming one element inside a plane.

Depth does NOT do much of that work on its own: PERSPECTIVE is 1400, so a plane at
z=700 renders 0.67 of its authored size and z=90 renders 0.94. Depth buys PARALLAX
under a moving camera. It does not buy scale.

Sky elements in lib/skies are PANELS and take w and h. Placed without them they draw a
small rectangle rather than a backdrop, which is the silent-empty-plane failure one
level along. The Biome already draws a sky, so a skies element is an addition to it.
