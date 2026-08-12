#!/usr/bin/env python3
"""wiring_check.py — everything that exists is reachable, and everything named exists.

WHY THIS EXISTS

The failure this whole project was set up to prevent, in the maintainer's own words at the start:
you move stuff from the old repo into the new one **and then forget to wire it up.** A file that
exists and is never invoked is worse than a missing one, because the repo looks complete and the
run silently does less than the prompt says it does.

It happened here. `.claude/agents/scorer.md` sat on disk fully written while Phase 6 of the routine
said only "then the panel" and never named the agent, so no run would ever have spawned it. Every
gate was green. The sibling repo's `port_audit` carries this check and this one did not.

FOUR THINGS, and they are two pairs pointing opposite ways.

  ORPHANS. Every agent in `.claude/agents/` must be invoked BY NAME somewhere in `prompts/`. An
  agent nothing spawns is a capability the run does not have.

  GHOSTS. Every agent named in a prompt must exist on disk. A prompt that spawns an agent which is
  not there fails at the worst possible moment, mid-run, with the work already done.

  The same pair for SCRIPTS: every script in `scripts/` must be invoked by a prompt or a workflow,
  and every script a prompt calls must exist.

A `--self-test` mention is NOT wiring. The sibling learned that one the hard way: counting CI
self-tests as invocation made the orphan check structurally incapable of failing for any gate,
because every gate is in CI by definition. Invocation means the prompt or a workflow actually RUNS
it on real inputs.

    wiring_check.py
    wiring_check.py --self-test

Exit 0 clean, 1 something is unwired, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# Scripts that are legitimately run by a person and not by a routine. Each needs a reason,
# because "it is standalone" is what an orphan says about itself.
STANDALONE = {
    "wiring_check.py": "this file, run by CI and by hand",
}


def prompt_text() -> str:
    return "\n".join(p.read_text(encoding="utf-8")
                     for p in sorted((REPO / "prompts").glob("*.md")))


def workflow_text() -> str:
    d = REPO / ".github" / "workflows"
    return "\n".join(p.read_text(encoding="utf-8") for p in sorted(d.glob("*.yml"))) if d.exists() else ""


def invokes(text: str, script: str) -> bool:
    """A real invocation, NOT a --self-test mention.

    `python3 scripts/foo.py --self-test` proves the checker works. It does not prove anything
    runs it on the product. Counting it as wiring is how an orphan check stops being able to fail.
    """
    for m in re.finditer(rf"scripts/{re.escape(script)}([^\n]*)", text):
        if "--self-test" not in m.group(1):
            return True
    return False


def check() -> list[str]:
    p: list[str] = []
    prompts = prompt_text()
    flows = workflow_text()

    # ---- agents
    agent_dir = REPO / ".claude" / "agents"
    on_disk = {f.stem for f in agent_dir.glob("*.md")} if agent_dir.exists() else set()
    for a in sorted(on_disk):
        if not re.search(rf"`{re.escape(a)}`", prompts):
            p.append(f"ORPHAN AGENT: .claude/agents/{a}.md exists and no prompt spawns it by name. "
                     f"An agent nothing invokes is a capability the run does not have. This is the "
                     f"exact fault that left `scorer` unwired while every gate stayed green.")
    for named in sorted(set(re.findall(r"`([a-z][a-z0-9-]{3,})`", prompts))):
        # only treat it as an agent reference if a prompt says it is spawned
        if re.search(rf"[Ss]pawn[^.\n]*`{re.escape(named)}`", prompts) and named not in on_disk:
            p.append(f"GHOST AGENT: a prompt spawns `{named}` and .claude/agents/{named}.md does "
                     f"not exist. That fails mid-run, with the work already done.")

    # ---- scripts
    for f in sorted((REPO / "scripts").glob("*.py")):
        if f.name in STANDALONE:
            continue
        if not (invokes(prompts, f.name) or invokes(flows, f.name)):
            p.append(f"ORPHAN SCRIPT: scripts/{f.name} is never run on real inputs by a prompt or "
                     f"a workflow. A --self-test in CI proves the checker works and proves nothing "
                     f"runs it on the product. Wire it, or list it in STANDALONE with a reason.")
    for name in sorted(set(re.findall(r"scripts/([a-z_]+\.py)", prompts))):
        if not (REPO / "scripts" / name).exists():
            p.append(f"GHOST SCRIPT: a prompt calls scripts/{name} and it does not exist.")
    return p


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # THE LESSON THE SIBLING PAID FOR.
    ok("a --self-test mention is NOT wiring",
       not invokes("python3 scripts/foo.py --self-test", "foo.py"))
    ok("...but a real invocation is",
       invokes("python3 scripts/foo.py --board out/x.json", "foo.py"))
    ok("...and a file that has BOTH counts as wired",
       invokes("python3 scripts/foo.py --self-test\npython3 scripts/foo.py --board x", "foo.py"))
    ok("a bare invocation with no arguments counts",
       invokes("python3 scripts/foo.py\n", "foo.py"))
    ok("a different script's name does not satisfy it",
       not invokes("python3 scripts/foobar.py --board x", "foo.py"))

    real = check()
    ok("the repo itself is fully wired", not real, "\n      " + "\n      ".join(real))

    if failures:
        print(f"\nwiring_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nwiring_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        problems = check()
    except OSError as exc:
        print(f"wiring_check: cannot run: {exc}", file=sys.stderr)
        return 2
    if problems:
        print(f"wiring: {len(problems)} problem(s)\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    print("wiring: clean. Every agent and script is invoked, and everything invoked exists.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"wiring_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
