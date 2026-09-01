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

# A login shell is allowed to rebuild PATH from the host's profile. On the local workspace that
# discarded the external Dispatch virtualenv after this helper had activated it, so the documented
# compound-command form failed the wake check while direct invocations passed. Compound commands
# need shell parsing, not a second login. Normalize the old form so saved triggers remain safe.
if [ "$#" -ge 2 ] && [ "$1" = "bash" ] && [ "$2" = "-lc" ]; then
  shift 2
  set -- bash -c "$@"
fi

if [ -x "$workspace_runner" ]; then
  exec "$workspace_runner" "$@"
fi

cd "$repo_root"
exec "$@"
