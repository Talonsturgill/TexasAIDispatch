# Texas AI Dispatch

A daily narrated 2.5D video about AI in Texas. Remotion engine, hand-authored SVG, a Texas art
library, and a routine that ships one every day.

The automation is bounded by `config/run_limits.json` and `scripts/run_controller.py`. A run ends
as either a hash-bound `publishable` package or a durable playable `needs_review` package. It can
spend at most five three-judge panels; after panel five the controller permits hard-fail and
deterministic cleanup only, never a sixth panel. Five normal renders, one cleanup render, and one
artifact-rescue render are separately bounded. A run cannot become terminal without an exact MP4,
and review cuts persist under `runs/review/`. A failed replacement preserves the immutable
last-good cut; if none exists, the renderer automatically creates a review-only reel from the
inspected animatic or timed storyboard cards. Music is opt-in; no bed is the default.

Sibling of [TexasAIDocket](https://github.com/Talonsturgill/TexasAIDocket), which keeps the
public record and the site. This repo writes exactly one file there: the videos feed.

- `prompts/dispatch_routine.md` — what the routine does, in order.
- `knowledge/texas/` — the research every art decision traces to.
- `knowledge/craft/` — how the show is made.
- `video-engine/` — the Remotion project.
- `scripts/preflight_animatic.py` — the cheap board/motion check before full rendering.
- `scripts/rescue_video.py` — deterministic review video when the full renderer fails.
- `scripts/package_review_run.sh` — persists a playable non-published run instead of ending empty.
- `scripts/deliver_run.sh --verify-only` — the publishing-disabled package rehearsal.

Read `CLAUDE.md` first. It carries the laws.
