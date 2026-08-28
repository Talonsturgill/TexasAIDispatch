#!/usr/bin/env python3
"""env_check.py - can this container actually MAKE a film, and does it find out at Phase 0.

WHY THIS EXISTS, AND WHAT IT COST ON 2026-08-28

Phase 0's preflight is `engine_lint`, `staging_check`, `composition_check`,
`wiring_check` and `tsc`. All five passed, green, on a container where the machine
could not have produced a film at all:

  numpy      absent. `foley.py --build` died at its first import in PHASE 5, after the
             board was final. `mix.py`, `vo_align.py`, `rescue_video.py` and
             `preflight_animatic.py` all import it too.
  Pillow     absent. `preflight_animatic.py` died on `from PIL import Image` AFTER
             Gate 0 had passed.
  ffmpeg     absent. Every mux, both feed renditions, and the WHOLE RESCUE PATH, which
             is the thing that exists so a run never ends with no film.
  ffprobe    absent. Same.
  browser    Remotion had none, so the first full render would have paid a 109 MB
             download INSIDE a metered `full_renders` reservation.

THE SHAPE IS THE ONE GATE_LESSONS KEEPS RECORDING: a green suite measuring something
narrower than the thing it appeared to certify. Phase 0 proves the ENGINE IS WIRED. It
proves nothing about whether audio can be synthesised or a film muxed, and every one of
those failures lands AFTER an expensive reservation rather than before it.

THE ORDERING IS THE WHOLE POINT. A missing dependency is free to fix at wake and
expensive to fix at Phase 5, because by then the run has spent researchers, a
validator, a critic, animatics and possibly a render. This check is cheap, it is
deterministic, and it belongs in front of all of them.

TWO RULES IT FOLLOWS, both learned here.

  THE MODULE LIST IS READ, NEVER RESTATED. `requirements.txt` is the one place a
  third-party dependency is named, and this file parses it. A second copy of that list
  is a list that will be wrong in one of them, which is this repo's founding defect.

  IT NAMES THE FIX. A checker that says "numpy missing" and stops has done half a job
  at wake, when the run is unattended and nobody is reading. It prints the exact
  command, because the next thing that happens is a machine running it.

    env_check.py
    env_check.py --self-test

Exit 0 everything present, 1 something is missing, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import importlib.util
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REQUIREMENTS = REPO / "requirements.txt"
ENGINE = REPO / "video-engine"

# Binaries the film cannot be finished without, and what each is for. The reason is
# printed on failure, because "install ffmpeg" is advice and "the rescue path cannot
# run without it" is a reason to do it now.
BINARIES = {
    "ffmpeg": "every mux, both feed renditions, and the review-only rescue reel",
    "ffprobe": "duration and stream checks in render_dispatch, publish_feed and the gates",
    "node": "Remotion renders through it",
    "npx": "every remotion invocation in preflight_animatic and render_dispatch",
}


def wanted_modules() -> list[tuple[str, str]]:
    """(import name, pip name) pairs, READ from requirements.txt.

    A requirement line may carry a version pin and an inline `# import: NAME` comment
    for the packages whose import name differs from their distribution name, which is
    the case this would otherwise get wrong: `Pillow` imports as `PIL`.
    """
    if not REQUIREMENTS.exists():
        raise FileNotFoundError(
            f"{REQUIREMENTS} does not exist. It is the single place this project names a "
            f"third-party dependency, and this checker reads it rather than keeping a "
            f"second copy that would drift.")
    out: list[tuple[str, str]] = []
    for raw in REQUIREMENTS.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        note = re.search(r"#\s*import:\s*([A-Za-z_][A-Za-z0-9_]*)", line)
        dist = re.split(r"[<>=!~\[;]", line.split("#")[0].strip())[0].strip()
        if not dist:
            continue
        out.append((note.group(1) if note else dist.replace("-", "_"), dist))
    return out


def missing_modules() -> list[tuple[str, str]]:
    return [(imp, dist) for imp, dist in wanted_modules()
            if importlib.util.find_spec(imp) is None]


def missing_binaries() -> list[tuple[str, str]]:
    return [(name, why) for name, why in BINARIES.items() if shutil.which(name) is None]


def browser_present() -> tuple[bool, str]:
    """Is a Remotion-usable browser already on disk.

    Remotion downloads a Chrome Headless Shell on first use. That download is 109 MB and
    it happens INSIDE whatever command triggers it, which on the normal path is the
    first metered render. Asking here is free.
    """
    if not (ENGINE / "node_modules").exists():
        return False, "video-engine/node_modules is absent, so `npm ci` has not run yet"
    hits = list((ENGINE / "node_modules" / ".remotion").rglob("chrome-headless-shell"))
    if hits:
        return True, str(hits[0].relative_to(REPO))
    return False, "no chrome-headless-shell under video-engine/node_modules/.remotion"


def report() -> tuple[int, list[str]]:
    lines: list[str] = []
    mods = missing_modules()
    bins = missing_binaries()
    ok_browser, browser_note = browser_present()

    for imp, dist in mods:
        lines.append(f"  MISSING  python module {imp!r} (pip name {dist})")
    for name, why in bins:
        lines.append(f"  MISSING  {name} on PATH, needed for {why}")
    if not ok_browser:
        lines.append(f"  MISSING  the Remotion browser: {browser_note}")

    if not lines:
        n = len(wanted_modules())
        return 0, [f"env: ready. {n} python module(s), {len(BINARIES)} binary(ies), "
                   f"and a Remotion browser at {browser_note}."]

    lines.append("")
    lines.append("  This run cannot finish a film. Fix it HERE, at wake, where it is free:")
    if mods:
        lines.append(f"    pip3 install {' '.join(d for _, d in mods)}")
    if bins:
        lines.append(f"    apt-get update && apt-get install -y "
                     f"{' '.join(n for n, _ in bins if n in ('ffmpeg',))or 'ffmpeg'}")
    if not ok_browser:
        lines.append("    cd video-engine && npm ci && npx remotion browser ensure")
    lines.append("")
    lines.append("  Every one of these fails LATER otherwise, after researchers, a validator,")
    lines.append("  animatics and possibly a full render have already been spent.")
    return 1, lines


def self_test() -> int:
    failures = 0

    def ok(label: str, cond: bool, extra: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    ok("requirements.txt exists, because this checker reads it rather than restating it",
       REQUIREMENTS.exists(), f"{REQUIREMENTS} is missing")

    pairs = wanted_modules()
    ok("the requirement list parses to at least one (import, dist) pair", bool(pairs), str(pairs))

    names = dict(pairs)
    ok("Pillow is mapped to its IMPORT name, which is the case a naive split gets wrong",
       names.get("PIL") == "Pillow",
       f"expected PIL -> Pillow, got {names.get('PIL')!r} in {pairs}")

    for need in ("numpy", "yaml", "PIL", "requests"):
        ok(f"{need} is declared", need in names, f"{need} missing from {sorted(names)}")

    # THE CHECKER MUST BE ABLE TO GO RED. A checker that cannot fail is not a checker,
    # and this repo has shipped one of those before (GATE_LESSONS 12 and 21).
    real = importlib.util.find_spec
    try:
        importlib.util.find_spec = lambda name, *a, **k: None   # type: ignore[assignment]
        ok("a missing module is detected", len(missing_modules()) == len(pairs))
    finally:
        importlib.util.find_spec = real                          # type: ignore[assignment]

    real_which = shutil.which
    try:
        shutil.which = lambda *_a, **_k: None                    # type: ignore[assignment]
        ok("a missing binary is detected", len(missing_binaries()) == len(BINARIES))
    finally:
        shutil.which = real_which                                # type: ignore[assignment]

    ok("ffmpeg is on the required list, because the rescue path cannot run without it",
       "ffmpeg" in BINARIES)

    print(f"env_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        code, lines = report()
    except (OSError, FileNotFoundError) as exc:
        print(f"env_check: could not run: {exc}", file=sys.stderr)
        return 2
    print("\n".join(lines))
    return code


if __name__ == "__main__":
    sys.exit(main())
