# Texas AI Dispatch

A daily narrated 2.5D video about AI in Texas. Remotion engine, hand-authored SVG, a Texas art
library, and a routine that ships one every day.

The automation is bounded by `config/run_limits.json` and `scripts/run_controller.py`. A run ends
as either a hash-bound `publishable` package or an unshipped `needs_review` package. It cannot
spend a third panel, fifth audio-model call, fifth full render, or second reboard. Music is opt-in;
no bed is the default.

Sibling of [TexasAIDocket](https://github.com/Talonsturgill/TexasAIDocket), which keeps the
public record and the site. This repo writes exactly one file there: the videos feed.

- `prompts/dispatch_routine.md` — what the routine does, in order.
- `knowledge/texas/` — the research every art decision traces to.
- `knowledge/craft/` — how the show is made.
- `video-engine/` — the Remotion project.
- `scripts/preflight_animatic.py` — the cheap board/motion check before full rendering.
- `scripts/deliver_run.sh --verify-only` — the publishing-disabled package rehearsal.

Read `CLAUDE.md` first. It carries the laws.
