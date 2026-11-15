# Texas AI Dispatch

A daily narrated vertical film about somebody in Texas using AI at work in a real place. The
repository holds the Remotion engine, original Texas art library, evidence, daily runbook and
shipped editions.

## Current daily lane

`prompts/daily_routine.md` is the production source of truth and `scripts/lean.py` is its command
surface. Every run starts a fresh film for that date, builds the whole rough cut before polishing,
checks the finished film, merges it, drafts its delivery copy and performs the authorized social
delivery. A production run completes only as `shipped`.

The controller, lease, checkpoint, capture-authorization, review-package and phase-prompt system
is retired. It stays in the tree so earlier editions and their regression tests remain
reproducible. A current daily run never calls it and never resumes an unfinished older edition.

## Start and environment

- `prompts/CLAUDE_ROUTINE_PROMPT.txt` is the thin scheduled-run pointer.
- `prompts/ROUTINE_PROMPT.txt` is the compatibility pointer for an existing local trigger.
- Both pointers lead to `prompts/daily_routine.md`; neither contains a second production policy.
- Every command runs through `bash scripts/run_with_env.sh ...`.
- Voice synthesis needs `GEMINI_API_KEY`. Local setup uses
  `scripts/set-dispatch-gemini-key.sh`; hosted runs receive it from their environment.
- `out/dispatch/` is scratch. Shipped artifacts under `runs/<date>/` are immutable.

Locked media setup uses `/usr/share/miniconda/bin/conda` by default. On another host, provision
official Conda 24.9 or newer separately, verify its vendor checksum, and select its absolute
executable path with `DISPATCH_CONDA_EXE`. The installer neither downloads Conda nor searches
`PATH`. It retains the complete official conda-forge artifact lock, SHA256 verification, isolated
home and caches, and TLS verification. Only the verified FFmpeg and ffprobe wrappers are exposed.

```sh
DISPATCH_CONDA_EXE=/absolute/provisioned/miniconda/bin/conda \
  bash scripts/run_with_env.sh python3 scripts/ci_ffmpeg.py --ensure \
  --conda-lock config/ci_ffmpeg_linux64.explicit.txt
```

The sibling [TexasAIDocket](https://github.com/Talonsturgill/TexasAIDocket) owns the public record
and site. Dispatch may change only its videos feed during the feed step. TexasAIScanner has no
write overlap.

Read `CLAUDE.md` before any work. It carries the repository laws, ownership boundaries and merge
policy.
