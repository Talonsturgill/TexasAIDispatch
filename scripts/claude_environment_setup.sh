#!/usr/bin/env bash
# Saved in the Texas cloud environment. Runs before Claude Code launches.
set -euo pipefail
dispatch_tools=/opt/texas-dispatch-tools
if [ ! -d "$dispatch_tools/.git" ]; then
  # Prelaunch needs the tools and source, not another copy of every published film.
  # Select the cache view before the first checkout so archived media stays on GitHub.
  git clone --depth 1 --filter=blob:none --no-checkout https://github.com/Talonsturgill/TexasAIDispatch.git "$dispatch_tools"
  printf '%s\n' '/*' '!/runs/' | git -C "$dispatch_tools" sparse-checkout set --no-cone --stdin
  git -C "$dispatch_tools" checkout --detach HEAD
else
  git -C "$dispatch_tools" fetch --depth 1 origin main
  git -C "$dispatch_tools" checkout --detach FETCH_HEAD
fi
cd "$dispatch_tools"
export DISPATCH_CLOUD_CACHE=/opt/texas-dispatch-runtime
bash scripts/run_with_env.sh python3 scripts/cloud_bootstrap.py --install
bash scripts/run_with_env.sh python3 scripts/cloud_bootstrap.py --bind-legacy-cache
bash scripts/run_with_env.sh python3 scripts/bootstrap_claude_hooks.py --workspace /home/user --prelaunch-router
