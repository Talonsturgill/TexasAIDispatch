#!/usr/bin/env bash
# Saved in the Texas cloud environment. Runs before Claude Code launches.
set -euo pipefail
dispatch_tools=/opt/texas-dispatch-tools
if [ ! -d "$dispatch_tools/.git" ]; then
  git clone --depth 1 https://github.com/Talonsturgill/TexasAIDispatch.git "$dispatch_tools"
else
  git -C "$dispatch_tools" fetch --depth 1 origin main
  git -C "$dispatch_tools" checkout --detach FETCH_HEAD
fi
cd "$dispatch_tools"
export DISPATCH_CLOUD_CACHE=/opt/texas-dispatch-runtime
bash scripts/run_with_env.sh python3 scripts/cloud_bootstrap.py --install
bash scripts/run_with_env.sh python3 scripts/cloud_bootstrap.py --bind-legacy-cache
bash scripts/run_with_env.sh python3 scripts/bootstrap_claude_hooks.py --workspace /home/user --prelaunch-router
