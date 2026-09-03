#!/usr/bin/env python3
"""preship_check.py — run the cheap gates BEFORE spending the expensive judges.

WHY THIS EXISTS, AND WHAT THE ORDERING COST ON 2026-08-28

Panel round 5 returned a mean over the rubric bar with no hard fail from any of three
judges, and the run called it done. `deliver_run.sh` then re-ran every gate and found
THREE red on the exact board the panel had just cleared: `board_scale_check` refused the
derrick, `flow_check` refused a scene whose picture had stopped naming its own subject,
and `run_discipline` refused the render count. By then `publishable` was terminal, so
the controller correctly refused the render that would have fixed them, and the run had
to be reopened with a scar.

**A PANEL DOES NOT CERTIFY DELIVERABILITY.** Three judges read the film, the board, the
claims and the frames. They never open the debt ledger and they never run a gate, so
their verdict is not evidence about either. The gates are also the CHEAPER half: running
them first would have caught all three for free, and running them second spent a panel
round and three scorer calls on a film that could not ship.

The routine already said this in prose. Prose is not a boundary against an ordering
mistake, so this is the boundary: `run_controller panel` refuses a reservation unless a
current preship verdict exists for the board being judged.

WHAT MAKES THE VERDICT CURRENT. It is stamped with the sha256 of the board it passed on.
Edit the board and the verdict no longer matches, which is the same shape as the
sibling's `guards_local --verdict`: a question about state rather than a log somebody
reads the top of. There is no state a half-finished run can leave that reads as green.

WHAT IT DELIBERATELY LEAVES OUT. Anything that needs the controller's terminal state
(`package_authority`), anything that needs the film to be final, and the panel itself.
This answers one question only: if the judges love it, can it actually ship.

    preship_check.py --board out/dispatch/storyboard.json
    preship_check.py --board out/dispatch/storyboard.json --verdict
    preship_check.py --self-test

Exit 0 every gate passed and a verdict was written, 1 something is red, 2 could not run.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "out" / "gates"
VERDICT = OUT / "preship.json"

# The gates a panel cannot see, each with the arguments it actually needs. Every one of
# these ran red on a board a panel had cleared, or guards something a judge cannot open.
def gates(board: Path, claims: Path, script: Path, captions: Path,
          audio: Path, sfx: Path, state: Path) -> list[tuple[str, list[str]]]:
    s = str(REPO / "scripts")
    return [
        ("storyboard_check", [f"{s}/storyboard_check.py", "--board", str(board)]),
        ("staging_check", [f"{s}/staging_check.py", "--board", str(board)]),
        ("flow_check", [f"{s}/flow_check.py", "--board", str(board), "--sfx", str(sfx)]),
        ("board_scale_check", [f"{s}/board_scale_check.py", "--board", str(board)]),
        ("floor_check", [f"{s}/floor_check.py", "--board", str(board)]),
        ("script_evidence_check", [f"{s}/script_evidence_check.py", "--board", str(board),
                                   "--claims", str(claims)]),
        ("super_evidence_check", [f"{s}/super_evidence_check.py", "--board", str(board),
                                  "--claims", str(claims)]),
        ("acoustic_alignment", [f"{s}/vo_align.py", "--verify", "--wav", str(audio.with_suffix(".wav")),
                                "--voice", str(audio.with_name("mix_vo.wav")), "--script", str(script),
                                "--out", str(captions.parent), "--cuts", str(board)]),
        ("safe_area_check", [f"{s}/safe_area_check.py"]),
        ("font_check", [f"{s}/font_check.py"]),
        ("engine_lint", [f"{s}/engine_lint.py"]),
        ("bar_check", [f"{s}/bar_check.py"]),
        ("run_discipline", [f"{s}/run_discipline.py", "--state", str(state)]),
    ]


def digest(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def run(board: Path, claims: Path, script: Path, captions: Path, audio: Path,
        sfx: Path, state: Path) -> tuple[int, list[str]]:
    lines: list[str] = []
    red: list[str] = []
    for name, cmd in gates(board, claims, script, captions, audio, sfx, state):
        if not Path(cmd[0]).exists():
            lines.append(f"  skip  {name} (not in this checkout)")
            continue
        # BY EXIT CODE, never by the last line. A report that prints advice on failure and
        # one clean line on success looks reassuring either way under `tail -1`.
        r = subprocess.run([sys.executable, *cmd], capture_output=True, text=True, cwd=REPO)
        ok = r.returncode == 0
        lines.append(f"  {'ok  ' if ok else 'FAIL'}  {name}")
        if not ok:
            red.append(name)
            tail = (r.stdout or r.stderr).strip().splitlines()[-6:]
            lines += [f"        {t}" for t in tail]

    if red:
        lines.append("")
        lines.append(f"preship: {len(red)} gate(s) red. DO NOT SPEND A PANEL ON THIS.")
        lines.append("  Three judges cannot see any of these, and the panel is the expensive")
        lines.append("  half. Fix them, then reserve the round.")
        VERDICT.unlink(missing_ok=True)
        return 1, lines

    OUT.mkdir(parents=True, exist_ok=True)
    VERDICT.write_text(json.dumps({
        "schema": "dispatch_preship/1",
        "board_sha256": digest(board),
        "gates": [n for n, _ in gates(board, claims, script, captions, audio, sfx, state)],
    }, indent=1), encoding="utf-8")
    lines.append("")
    lines.append(f"preship: clean. The board can ship if the panel likes it. -> {VERDICT}")
    return 0, lines


def current_for(board: Path) -> tuple[bool, str]:
    """Is there a verdict for THIS board. Used by run_controller before a panel."""
    if not VERDICT.exists():
        return False, ("no preship verdict. Run `preship_check.py --board <board>` before "
                       "reserving a panel: the gates are the cheap half and a panel cannot "
                       "see them.")
    try:
        v = json.loads(VERDICT.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return False, f"the preship verdict is unreadable: {exc}"
    if not board.exists():
        return False, f"no board at {board}"
    if v.get("board_sha256") != digest(board):
        return False, ("the preship verdict is for a DIFFERENT board than the one about to "
                       "be judged. Re-run preship_check after every board edit.")
    return True, "preship verdict is current for this board"


def self_test() -> int:
    import tempfile
    fails = 0

    def ok(label: str, cond: bool, extra: str = "") -> None:
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    global VERDICT
    real = VERDICT
    with tempfile.TemporaryDirectory() as td:
        VERDICT = Path(td) / "preship.json"
        b = Path(td) / "board.json"
        b.write_text('{"scenes": []}', encoding="utf-8")

        good, why = current_for(b)
        ok("no verdict means no panel", not good and "no preship verdict" in why, why)

        VERDICT.write_text(json.dumps({"board_sha256": digest(b)}), encoding="utf-8")
        good, why = current_for(b)
        ok("a verdict for this exact board permits the panel", good, why)

        # THE CASE THAT MATTERS: the board moved after the gates ran. This is what
        # happened on 2026-08-28, where a panel graded a board the gates had not seen.
        b.write_text('{"scenes": [1]}', encoding="utf-8")
        good, why = current_for(b)
        ok("EDITING THE BOARD INVALIDATES THE VERDICT, so a panel cannot grade an ungated cut",
           not good and "DIFFERENT board" in why, why)

        VERDICT.write_text("not json", encoding="utf-8")
        good, why = current_for(b)
        ok("an unreadable verdict is refused rather than trusted", not good, why)

        VERDICT.unlink()
        ok("a deleted verdict is refused", not current_for(b)[0])
    VERDICT = real
    print(f"preship_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    d = REPO / "out" / "dispatch"
    ap.add_argument("--board", default=str(d / "storyboard.json"))
    ap.add_argument("--claims", default=str(d / "claims.json"))
    ap.add_argument("--script", default=str(d / "vo_script.txt"))
    ap.add_argument("--captions", default=str(d / "captions.json"))
    ap.add_argument("--audio", default=str(d / "mix.json"))
    ap.add_argument("--sfx", default=str(d / "sfx_events.json"))
    ap.add_argument("--state", default=str(d / "run_state.json"))
    ap.add_argument("--verdict", action="store_true",
                    help="ask whether a current verdict exists, run nothing")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    board = Path(a.board)
    if a.verdict:
        good, why = current_for(board)
        print(f"preship: {why}")
        return 0 if good else 1
    try:
        code, lines = run(board, Path(a.claims), Path(a.script), Path(a.captions),
                          Path(a.audio), Path(a.sfx), Path(a.state))
    except OSError as exc:
        print(f"preship_check: could not run: {exc}", file=sys.stderr)
        return 2
    print("\n".join(lines))
    return code


if __name__ == "__main__":
    sys.exit(main())
