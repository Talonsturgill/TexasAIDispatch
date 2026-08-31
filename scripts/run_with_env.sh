#!/usr/bin/env bash
set -eu

# One stable command entry point for both local Codex runs and hosted runners.
#
# The local Texas AI workspace keeps its Python environment and Gemini secret outside
# this repository. Its wrapper activates that environment, exposes Remotion's pinned
# ffmpeg/ffprobe, and loads the key without evaluating or printing the secret file.
# A hosted runner already receives its environment externally, so the same command
# simply executes in this repository when the workspace wrapper is not present.

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
workspace_runner="$repo_root/../../scripts/in-dispatch-env.sh"

if [ "$#" -eq 0 ]; then
  printf 'usage: %s command [args...]\n' "$0" >&2
  exit 2
fi

if [ -x "$workspace_runner" ]; then
  exec "$workspace_runner" "$@"
fi

cd "$repo_root"
exec "$@"
