#!/usr/bin/env python3
"""run_discipline.py — the process faults this machine has actually committed, checked.

WHY THIS FILE EXISTS, and it is a different reason from every other gate here.

The rest of the gates check the PRODUCT: is the board staged right, does a numeral trace,
is the film newer than its inputs. This one checks the RUN. A session found five ways to
waste an hour and lose work, none of which any product gate can see, because every one of
them left the product correct and the process wrong:

  1. A wait loop that matched its own command line and spun forever. Forty minutes on a
     ninety second step, twice in one hour, invisible because a self-matching wait and a
     slow job produce identical evidence.
  2. `git commit ... >/dev/null`, which hid the fact that the commit did not happen. The
     working tree looked committed and was not, and the next stop-hook found it.
  3. One render per fix. Fourteen minutes each, spent one at a time on defects that were
     each a two line change and could have gone in one pass.
  4. Editing a DERIVED field. `at_s` is recomputed from `at_s_authored`, so a hand edit to
     it is discarded silently and the run ships the old value believing it shipped the new.
  5. Showing a panel stills from a SECOND render rather than from the film, which cannot
     catch the film disagreeing with its own board.

Every one of those is a rule now, and a rule nobody checks is a rule that lasts one run.
This is the checker. Run it before you commit and before you ship.

    python3 scripts/run_discipline.py                  # lint the machine
    python3 scripts/run_discipline.py --renders 3      # ...and report the run's render count
    python3 scripts/run_discipline.py --self-test      # prove each rule can go red
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# A run that renders more than this is almost certainly spending a render per fix rather
# than batching. It is a WARNING and not a failure, because a genuinely hard round can
# need several, and a gate that blocks honest work gets disabled.
RENDER_BUDGET = 4


def _is_comment(line: str) -> bool:
    """A line that only talks about a pattern is not a line that runs it."""
    t = line.lstrip()
    return t.startswith("#") or t.startswith("//") or t.startswith("*") or t.startswith(">")


def _executable_lines(p: Path):
    """Yield (lineno, line) for lines that could actually RUN.

    PROSE THAT DESCRIBES AN ANTI-PATTERN IS NOT THE ANTI-PATTERN, and this check learned
    that twice on its first two real runs. It flagged the comment in `finish_render.sh`
    that warns against self-matching waits, and then it flagged the paragraph in the
    routine that teaches the same rule. Both times the "fix" it was demanding was to delete
    the warning, which would have removed the only thing standing between the next author
    and the bug.
    So a markdown file is scanned ONLY inside fenced code blocks, which is the part of a
    prompt a run actually executes, and comment lines are skipped everywhere.
    """
    fenced = p.suffix != ".md"      # code files are executable throughout
    for i, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if p.suffix == ".md" and line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if not fenced or _is_comment(line):
            continue
        yield i, line


def _shell_and_py() -> list[Path]:
    out: list[Path] = []
    for d in ("scripts", "prompts"):
        for p in sorted((REPO / d).rglob("*")):
            if p.is_file() and p.suffix in (".sh", ".py", ".md"):
                out.append(p)
    return out


def check_self_matching_waits() -> list[str]:
    """RULE 1. Never poll for a pattern your own command line contains.

    `pgrep -f "<pattern>"` matches every process on the box, including the shell running
    the loop, so the condition can never go false. `scripts/waitfor.sh` excludes the
    ancestor chain and carries a deadline; anything else waiting on a pattern is the bug.
    """
    errs = []
    pat = re.compile(r"(while|until).*pgrep\s+-f", re.I)
    for p in _shell_and_py():
        if p.name in ("waitfor.sh", "run_discipline.py"):
            continue
        for i, line in _executable_lines(p):
            if pat.search(line):
                errs.append(
                    f"{p.relative_to(REPO)}:{i}: waits on a `pgrep -f` pattern. Its own "
                    f"command line contains that pattern, so the loop matches itself and "
                    f"spins forever, looking exactly like a slow job. "
                    f"`source scripts/waitfor.sh` and use wait_for_pattern or wait_for_pids.")
    return errs


def check_silenced_git() -> list[str]:
    """RULE 2. Never send a command's output to /dev/null when the output IS the signal.

    `git commit >/dev/null` hid a commit that did not happen. This repo already runs its
    gates BY EXIT CODE rather than by their last line for the same reason, one layer up.
    """
    errs = []
    pat = re.compile(r"git\s+(commit|push|merge)[^\n|;&]*>\s*/dev/null")
    for p in _shell_and_py():
        if p.name == "run_discipline.py":
            continue
        for i, line in _executable_lines(p):
            if pat.search(line):
                errs.append(
                    f"{p.relative_to(REPO)}:{i}: silences a git write. A commit that did "
                    f"not happen looks identical to one that did with its output thrown "
                    f"away. Check `git log -1` after, or let it print.")
    return errs


def check_derived_fields() -> list[str]:
    """RULE 3. `at_s` is derived from `at_s_authored`. Editing the derived one is a no-op.

    The prompt has to say so where an author will read it, because the failure is silent:
    `board_retime` overwrites `at_s` by design, so a hand edit vanishes and the run ships
    the old timing believing it shipped the new one.
    """
    routine = REPO / "prompts" / "dispatch_routine.md"
    if not routine.exists():
        return [f"{routine.relative_to(REPO)} is missing"]
    text = routine.read_text(encoding="utf-8")
    if "at_s_authored" not in text:
        return ["prompts/dispatch_routine.md never mentions `at_s_authored`. A run that "
                "moves a beat will edit `at_s`, board_retime will discard it silently, and "
                "the film will ship the old timing. Write the rule where it will be read."]
    return []


def check_panel_frames_come_from_the_film() -> list[str]:
    """RULE 4. The panel looks at the FILM, never at a second render of the board.

    A still rendered from the board cannot catch the board and the film disagreeing, which
    is the one thing a still is there to catch.
    """
    out = REPO / "out" / "dispatch"
    film, frames = out / "film.mp4", sorted(out.glob("scene_s*.png"))
    if not film.exists() or not frames:
        return []           # nothing built yet, which is not a discipline failure
    fm = film.stat().st_mtime
    stale = [f.name for f in frames if f.stat().st_mtime < fm - 1.0]
    if stale:
        return [f"{len(stale)} panel frame(s) predate film.mp4 ({', '.join(stale[:4])}"
                f"{'...' if len(stale) > 4 else ''}). Re-run scripts/extract_frames.sh so "
                f"the panel sees what ships rather than a second render of the board."]
    return []


def check_concurrency_claims() -> list[str]:
    """RULE 5. Do not write a concurrency above the core count into anything.

    Remotion refuses it outright and the render dies before it bundles. `render_bench.py`
    measured this; the routine records the answer. This stops the next run rediscovering
    the cap the expensive way.
    """
    errs = []
    # `100%` is the CORRECT form and must not be flagged: the fault is a bare
    # integer, which pins a count that is wrong the first time the box resizes.
    pat = re.compile(r"--concurrency[= ](\d+)(?!\s*%)(?![%\d])")
    for p in _shell_and_py():
        if p.name in ("render_bench.py", "run_discipline.py"):
            continue
        for i, line in _executable_lines(p):
            for m in pat.finditer(line):
                errs.append(
                    f"{p.relative_to(REPO)}:{i}: hardcodes --concurrency={m.group(1)}. "
                    f"Remotion caps concurrency at the CORE COUNT of whatever box the run "
                    f"lands on and refuses anything higher. Write `100%`, which follows "
                    f"the machine.")
    return errs


CHECKS = [
    ("self-matching waits", check_self_matching_waits),
    ("silenced git writes", check_silenced_git),
    ("derived-field rule is written down", check_derived_fields),
    ("panel frames come from the film", check_panel_frames_come_from_the_film),
    ("no hardcoded concurrency", check_concurrency_claims),
]


def self_test() -> int:
    """Break each rule on purpose in a scratch tree and prove the checker goes red.

    GATE_LESSONS: the way to find out whether a gate works is not to read it, it is to
    break the product on purpose and watch.
    """
    import tempfile
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    global REPO
    real = REPO
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        (root / "scripts").mkdir()
        (root / "prompts").mkdir()
        (root / "out" / "dispatch").mkdir(parents=True)
        REPO = root

        (root / "prompts" / "dispatch_routine.md").write_text("mentions at_s_authored\n")
        ok("clean tree is clean", all(not fn()[1:] and not fn() for _, fn in CHECKS)
           or all(not fn() for _, fn in CHECKS))

        (root / "scripts" / "bad_wait.sh").write_text(
            'while pgrep -f "remotion render" >/dev/null; do sleep 5; done\n')
        ok("catches a self-matching wait", bool(check_self_matching_waits()))

        (root / "scripts" / "bad_git.sh").write_text('git commit -m x >/dev/null\n')
        ok("catches a silenced git write", bool(check_silenced_git()))

        (root / "prompts" / "dispatch_routine.md").write_text("no mention of the rule\n")
        ok("catches the derived-field rule going missing", bool(check_derived_fields()))

        (root / "scripts" / "bad_conc.sh").write_text('remotion render --concurrency=16\n')
        ok("catches a hardcoded concurrency", bool(check_concurrency_claims()))

        # PROSE IS NOT CODE. A doc that teaches the rule must not trip it, or the only
        # repair the gate accepts is deleting the lesson. The offending scratch scripts
        # from the cases above are cleared first, so this case tests the doc and nothing
        # else: a self-test whose earlier fixtures leak into a later assertion is proving
        # something other than what it says.
        (root / "scripts" / "bad_wait.sh").unlink()
        (root / "scripts" / "bad_git.sh").unlink()
        (root / "prompts" / "dispatch_routine.md").write_text(
            "mentions at_s_authored\n\n"
            "Never write `while pgrep -f ...` and never `git commit >/dev/null`.\n")
        ok("does not flag prose that teaches the rule",
           not check_self_matching_waits() and not check_silenced_git())
        (root / "prompts" / "dispatch_routine.md").write_text(
            "mentions at_s_authored\n\n```\nwhile pgrep -f render; do sleep 1; done\n```\n")
        ok("...but does flag it inside a fenced block",
           bool(check_self_matching_waits()))

        film = root / "out" / "dispatch" / "film.mp4"
        frame = root / "out" / "dispatch" / "scene_s01.png"
        frame.write_bytes(b"x")
        import os, time
        time.sleep(0.01)
        film.write_bytes(b"x")
        os.utime(frame, (time.time() - 600, time.time() - 600))
        ok("catches panel frames older than the film",
           bool(check_panel_frames_come_from_the_film()))

    REPO = real
    print(f"run_discipline: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--renders", type=int, default=None,
                    help="how many full renders this run has done, for the batching report")
    a = ap.parse_args()
    if a.self_test:
        return self_test()

    problems = []
    for label, fn in CHECKS:
        errs = fn()
        print(f"  {'ok  ' if not errs else 'FAIL'}  {label}")
        problems += errs

    if a.renders is not None and a.renders > RENDER_BUDGET:
        print(f"\n  note  {a.renders} renders this run, over the {RENDER_BUDGET} budget. "
              f"That is usually a render spent per fix rather than a batch. Cheap precise "
              f"fixes are free to batch: the expensive step is the render, not the edit.")

    if problems:
        print("\nrun_discipline: " + f"{len(problems)} problem(s)\n")
        for e in problems:
            print(f"  - {e}")
        return 1
    print("\nrun_discipline: clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
