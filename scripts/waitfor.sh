#!/usr/bin/env bash
# =============================================================================
# WAIT FOR A PROCESS TO FINISH, WITHOUT WAITING FOR YOURSELF.
#
# THE DEFECT THIS EXISTS FOR, and it cost this run about forty minutes of wall
# clock on a step that takes ninety seconds.
#
# A script wanted to wait out a render and wrote the obvious thing:
#
#     while pgrep -f "remotion render Dispatch" >/dev/null; do sleep 15; done
#
# `pgrep -f` matches against the FULL COMMAND LINE of every process on the box,
# and the waiting shell's own command line contains the pattern -- it is right
# there in the `while` condition. So the loop matched itself, the condition was
# true forever, and the script sat in a spin that could not end no matter what
# the render did. It reported nothing, exited nothing, and looked exactly like a
# slow render. Then the SAME mistake was made a second time, at the top level,
# by a wait written as `while pgrep -f finish_render.sh; do sleep 10; done`.
#
# Twice in one hour, by the same hand, because the failure is invisible: a
# self-matching wait and a genuinely slow job are indistinguishable from outside.
# There is nothing to see and nothing to read. That is what makes it worth a
# file rather than a comment.
#
# THE RULE. Never poll for a pattern you are also holding. Two guards here, and
# it needs both:
#
#   1. Exclude self, the parent, and the whole process group, via `pgrep`'s own
#      exclusion rather than by filtering text afterwards.
#   2. A HARD DEADLINE. Any wait that cannot time out is a wait that can hang the
#      run, and a run that hangs silently is worse than one that fails loudly.
#      The one outcome law says a blocked run reports an error; it cannot report
#      one from inside an infinite loop.
#
# Usage:
#   source scripts/waitfor.sh
#   wait_for_pattern "remotion render Dispatch" 1800   # pattern, timeout seconds
#
# Returns 0 when nothing matches any more, 1 if the deadline passes first.
# `--self-test` proves both the self-match trap and the deadline.
# =============================================================================

wait_for_pattern() {
  local pattern="$1" timeout_s="${2:-1800}" waited=0 interval=5

  # WHAT HAS TO BE EXCLUDED IS THE ANCESTOR CHAIN, not just $$ and not just the
  # process group. Three different things carry the pattern on their command lines:
  # this shell, the subshell that runs `pgrep` (same group), and the harness wrapper
  # that launched the script (a DIFFERENT group, because it is an ancestor rather
  # than a child). Excluding only the group left the wrapper matching and the loop
  # spun exactly as before, which the self-test caught and a comment would not have.
  local mypgid ancestors cur
  mypgid=$(ps -o pgid= -p $$ 2>/dev/null | tr -d ' ')
  ancestors=" $$ "
  cur=$$
  while :; do
    cur=$(ps -o ppid= -p "$cur" 2>/dev/null | tr -d ' ')
    case "$cur" in ''|0|1) break ;; esac
    ancestors="$ancestors$cur "
  done

  while :; do
    local hits=0 p pgid
    for p in $(pgrep -f -- "$pattern" 2>/dev/null); do
      case "$ancestors" in *" $p "*) continue ;; esac
      # A PID WE CANNOT INSPECT IS NOT EVIDENCE THE JOB IS RUNNING. The `$(...)`
      # subshells this loop spawns to read `ps` carry the pattern and then exit, so
      # `pgrep` hands back pids that are already gone by the time `ps` looks. Treating
      # that empty answer as a live match is what kept the loop spinning after the
      # ancestor exclusion was correct, and it is the same shape as the original bug:
      # the waiter seeing its own machinery and calling it the job.
      kill -0 "$p" 2>/dev/null || continue
      pgid=$(ps -o pgid= -p "$p" 2>/dev/null | tr -d ' ')
      [ -z "$pgid" ] && continue
      [ "$pgid" = "$mypgid" ] && continue
      hits=1
      break
    done
    [ "$hits" -eq 0 ] && return 0
    if [ "$waited" -ge "$timeout_s" ]; then
      echo "wait_for_pattern: '$pattern' still running after ${timeout_s}s. Not waiting" \
           "longer, because a wait with no deadline turns a slow step into a hung run." >&2
      return 1
    fi
    sleep "$interval"
    waited=$((waited + interval))
  done
}

# Wait on specific PIDs, which is the form to prefer whenever you have them:
# a PID cannot match itself and needs no exclusion reasoning at all.
wait_for_pids() {
  local timeout_s="$1"; shift
  local waited=0
  while :; do
    local alive=0
    for p in "$@"; do kill -0 "$p" 2>/dev/null && alive=1; done
    [ "$alive" -eq 0 ] && return 0
    if [ "$waited" -ge "$timeout_s" ]; then
      echo "wait_for_pids: $* still alive after ${timeout_s}s." >&2
      return 1
    fi
    sleep 5; waited=$((waited + 5))
  done
}

if [ "${1:-}" = "--self-test" ]; then
  fails=0
  say() { if [ "$1" = 0 ]; then echo "  ok    $2"; else echo "  FAIL  $2"; fails=$((fails+1)); fi; }

  # 1. THE TRAP ITSELF. The pattern is in this script's own command line, so a naive
  #    `pgrep -f` finds something. The helper must still return promptly.
  start=$(date +%s)
  wait_for_pattern "waitfor.sh --self-test" 20
  rc=$?
  elapsed=$(( $(date +%s) - start ))
  say $(( rc == 0 && elapsed < 15 ? 0 : 1 )) \
      "returns immediately when the only match is itself (rc=$rc, ${elapsed}s)"

  # 2. A REAL process is genuinely waited for.
  sleep 8 &
  real=$!
  start=$(date +%s)
  wait_for_pids 30 "$real"
  elapsed=$(( $(date +%s) - start ))
  say $(( elapsed >= 6 ? 0 : 1 )) "actually waits for a live pid (${elapsed}s)"

  # 3. THE DEADLINE FIRES. Without this the helper could hang the run it protects.
  sleep 60 &
  slow=$!
  start=$(date +%s)
  wait_for_pids 10 "$slow"
  rc=$?
  elapsed=$(( $(date +%s) - start ))
  kill "$slow" 2>/dev/null
  say $(( rc == 1 && elapsed < 20 ? 0 : 1 )) "gives up at the deadline rather than hanging (rc=$rc, ${elapsed}s)"

  echo "waitfor: $fails failure(s)"
  exit $(( fails > 0 ? 1 : 0 ))
fi
