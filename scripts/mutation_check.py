#!/usr/bin/env python3
"""mutation_check.py — a self-test that cannot go red is guarding nothing.

WHY THIS EXISTS

Every gate in this repo has a `--self-test`, and CI runs all of them, and they are
all green. None of that is evidence. A green self-test means either "the checker
works" or "the checker is disconnected from the thing it checks", and THOSE TWO
LOOK IDENTICAL from the outside. `knowledge/craft/GATE_LESSONS.md` is most of the
way a record of the second one: a habitat check that matched a wrapper no scene
uses, an orphan check that counted its own CI run as wiring, a rest check that
measured cuts instead of events.

The deep review found the smallest version of the same fault, three assertions that
could not fail whatever the code did:

    ok("a story sharing only channel words is fresh", check(...)[0] or True)
    ok("no key is reported as blocked", blocked_code() == 3)   # its own constant
    ok("...so a time-stretch cannot be reached even by accident", True)

Each was fixed at the source. This is the general question those three raise:
**if the number a gate guards moved, would its self-test notice?**

So it moves them, one at a time, and requires the self-test to go red. A threshold
that survives its own mutation is a threshold nothing is holding. The table below
is also documentation: every row names the thing the mutation breaks, so reading
the table tells you what each number is for.

WHAT THIS IS NOT. It is not a full mutation-testing suite, and it should not grow
into one. It covers the DECLARED THRESHOLDS -- the numbers a person would be
tempted to nudge to make a run pass -- because that is the edit this project will
actually see. Coverage of every branch is a different job with a different cost.

    mutation_check.py
    mutation_check.py --self-test

Exit 0 every mutation was caught, 1 one survived, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

# (target file, self-test file, text as written, mutated text, what the mutation breaks)
#
# Each `new` value is chosen to make the threshold VACUOUS rather than merely
# different, because a small nudge can land inside a fixture's slack and survive
# for an honest reason. A vacuous threshold has no honest reason to survive.
MUTATIONS: list[tuple[str, str, str, str, str]] = [
    ("scripts/flow_check.py", "scripts/flow_check.py",
     "MAX_REST_S = 5.0", "MAX_REST_S = 99.0",
     "the never-rest cadence: how long the picture may sit still"),
    ("scripts/ship_gate.py", "scripts/ship_gate.py",
     "MAX_SCENE_S = 5.0", "MAX_SCENE_S = 99.0",
     "the hard fail on a scene that outstays the cut"),
    ("scripts/storyboard_check.py", "scripts/storyboard_check.py",
     "MAX_SCENE_S = 5.0", "MAX_SCENE_S = 99.0",
     "the same ceiling at Gate 0, before a frame is rendered"),
    ("scripts/vo_align.py", "scripts/vo_align.py",
     "MIN_GAP_S = 0.12", "MIN_GAP_S = 9.0",
     "what counts as a silence worth anchoring a caption to"),
    ("scripts/vo_align.py", "scripts/vo_align.py",
     "MAX_CUE_CHARS = 84", "MAX_CUE_CHARS = 9999",
     "whether a short trailing run joins the cue before it or flashes on its own"),
    ("scripts/vo_soundcheck.py", "scripts/vo_soundcheck.py",
     "MIN_PITCH_VARIANCE = 1.8", "MIN_PITCH_VARIANCE = 0.0",
     "the drone: a read with no pitch movement in it"),
    ("scripts/vo_soundcheck.py", "scripts/vo_soundcheck.py",
     "MAX_INSERTION = 0.06", "MAX_INSERTION = 1.0",
     "words the narrator added that the script does not contain"),
    ("scripts/mix.py", "scripts/mix.py",
     "MAX_OVERAGE = 0.04", "MAX_OVERAGE = 9.0",
     "a voice that runs past the cut, which is TRIM THE SCRIPT and never stretch"),
    ("scripts/dedupe.py", "scripts/dedupe.py",
     "DUP_TOKENS = 2", "DUP_TOKENS = 99",
     "how many shared subject tokens make two stories the same story"),
]

# The new bounded-run and board contracts live in data so every consumer reads one source of
# truth. Their tests intentionally live in the enforcing scripts, so these are cross-file
# mutations: alter the data, then run the controller or board self-test that owns the policy.
for _name, _value in {
    "research_agents": 3,
    "validator_agents": 1,
    "storyboard_critics": 1,
    "preflight_renders": 6,
    "reboards": 4,
    "voice_directors": 1,
    "panel_rounds": 5,
    "scorer_calls": 15,
    "full_renders": 5,
    "cleanup_renders": 1,
    "rescue_renders": 1,
    "tts_calls": 4,
    "reported_tokens": 250000,
}.items():
    MUTATIONS.append((
        "config/run_limits.json", "scripts/run_controller.py",
        f'"{_name}": {_value}', f'"{_name}": 999999',
        f"the approved run-wide {_name} ceiling",
    ))

for _name, _value, _mutated in [
    ("min_runtime_s", "35", "0"),
    ("max_runtime_s", "55", "999"),
    ("min_scenes", "6", "0"),
    ("max_scenes", "10", "999"),
    ("max_visual_family_share", "0.4", "1.0"),
    ("max_top_two_family_share", "0.67", "1.0"),
    ("max_text_panel_share", "0.34", "1.0"),
    ("max_same_family_in_last_three", "2", "999"),
    ("hook_payoff_by_s", "2.0", "999.0"),
]:
    MUTATIONS.append((
        "config/run_limits.json", "scripts/storyboard_check.py",
        f'"{_name}": {_value}', f'"{_name}": {_mutated}',
        f"the approved board {_name} boundary",
    ))


def survives(path: Path, old: str, new: str, timeout: int = 600,
             gate: Path | None = None) -> tuple[bool, str]:
    """Mutate, run the owning --self-test, restore. True if it stayed green.

    ``check`` calls this only inside a disposable copy of the repository. The
    original text is still restored in a `finally` so the next mutation sees a clean
    fixture, but safety does not depend on cleanup: even SIGKILL can only strand a
    temporary copy, never weaken the working source.
    """
    src = path.read_text(encoding="utf-8")
    if old not in src:
        return True, f"pattern not present: {old!r} (the table is stale)"
    try:
        path.write_text(src.replace(old, new, 1), encoding="utf-8")
        test_path = gate or path
        r = subprocess.run([sys.executable, str(test_path), "--self-test"],
                           capture_output=True, timeout=timeout, cwd=REPO)
        return r.returncode == 0, ""
    except (OSError, subprocess.SubprocessError) as exc:
        return True, f"could not run the self-test: {exc}"
    finally:
        path.write_text(src, encoding="utf-8")


def check() -> list[str]:
    out: list[str] = []
    with tempfile.TemporaryDirectory(prefix="dispatch-mutations-") as td:
        sandbox = Path(td) / "repo"
        shutil.copytree(
            REPO,
            sandbox,
            ignore=shutil.ignore_patterns(
                ".git", "node_modules", "out", "runs", "__pycache__", ".pytest_cache"
            ),
        )
        for rel, gate_rel, old, new, why in MUTATIONS:
            p = sandbox / rel
            gate = sandbox / gate_rel
            if not p.exists():
                out.append(f"MISSING: {rel} is in the mutation table and not on disk.")
                continue
            if not gate.exists():
                out.append(f"MISSING: {gate_rel} owns a mutation test and is not on disk.")
                continue
            lived, note = survives(p, old, new, gate=gate)
            label = f"{rel}: {old} -> {new}"
            if lived:
                out.append(
                    f"SURVIVED: {label}. That threshold guards {why}, and its own self-test "
                    f"stays green when it is made vacuous, so nothing is holding it. "
                    f"{note}".strip())
            print(f"  {'SURVIVED' if lived else 'caught  '}  {label}")
    return out


def self_test() -> int:
    """Prove the harness can report SURVIVED, on a file built to survive."""
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    with tempfile.TemporaryDirectory() as td:
        # A gate whose self-test asserts something real about its threshold.
        guarded = Path(td) / "guarded.py"
        guarded.write_text(
            "import sys\n"
            "LIMIT = 5\n"
            "def over(n): return n > LIMIT\n"
            "if '--self-test' in sys.argv:\n"
            "    sys.exit(0 if over(6) and not over(4) else 1)\n",
            encoding="utf-8")
        lived, note = survives(guarded, "LIMIT = 5", "LIMIT = 99")
        ok("a threshold its self-test really checks is CAUGHT when made vacuous",
           not lived, note or "it survived")

        # The same file with a self-test that never looks at the threshold. This is
        # the shape the whole checker exists to find, and if the harness cannot see
        # it here it cannot see it anywhere.
        loose = Path(td) / "loose.py"
        loose.write_text(
            "import sys\n"
            "LIMIT = 5\n"
            "def over(n): return n > LIMIT\n"
            "if '--self-test' in sys.argv:\n"
            "    sys.exit(0)\n",
            encoding="utf-8")
        lived2, _ = survives(loose, "LIMIT = 5", "LIMIT = 99")
        ok("a threshold nothing checks is reported as SURVIVED", lived2)

        ok("...and the file is restored either way",
           loose.read_text(encoding="utf-8").count("LIMIT = 5") == 1
           and guarded.read_text(encoding="utf-8").count("LIMIT = 5") == 1)

        # A stale table entry must not read as a pass. It is reported as survived,
        # because a mutation that was never applied proves nothing.
        lived3, note3 = survives(guarded, "LIMIT = 12345", "LIMIT = 99")
        ok("a pattern that is no longer in the file is SURVIVED, not silently skipped",
           lived3 and "stale" in note3, note3)

        # Policy often lives in JSON while its executable assertion lives in a checker. Prove
        # that the harness runs the selected owner rather than trying to execute the data file.
        policy = Path(td) / "policy.json"
        policy.write_text('{"limit": 5}\n', encoding="utf-8")
        cross_gate = Path(td) / "cross_gate.py"
        cross_gate.write_text(
            "import json, pathlib, sys\n"
            f"p = pathlib.Path({str(policy)!r})\n"
            "ok = json.loads(p.read_text())['limit'] == 5\n"
            "sys.exit(0 if '--self-test' in sys.argv and ok else 1)\n",
            encoding="utf-8")
        lived4, note4 = survives(
            policy, '"limit": 5', '"limit": 999', gate=cross_gate)
        ok("a data threshold is caught by its owning cross-file self-test",
           not lived4, note4 or "it survived")
        ok("...and the data file is restored",
           policy.read_text(encoding="utf-8") == '{"limit": 5}\n')

    ok("the table covers every gate that declares a threshold",
       len({m[0] for m in MUTATIONS}) >= 7, f"{len({m[0] for m in MUTATIONS})} files")

    if failures:
        print(f"\nmutation_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nmutation_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()

    print(f"mutating {len(MUTATIONS)} declared thresholds\n")
    problems = check()
    if problems:
        print(f"\nmutation: {len(problems)} threshold(s) guarded by nothing\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    print(f"\nmutation: all {len(MUTATIONS)} caught. Every declared threshold is held by a test.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"mutation_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
