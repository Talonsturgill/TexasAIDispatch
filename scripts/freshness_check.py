#!/usr/bin/env python3
"""Refuse a film that is older than the board it claims to be a render of.

THE DEFECT THIS EXISTS FOR. A scorer graded a cut and reported that the film opens on a
server aisle while the board says it opens on a building off a frontage road, and that the
credits card prints a colon the board's credits string does not contain. Both were true.
The board had been edited after the render and nothing rebuilt from it, so the run was
grading, scoring and about to ship a film that was not a function of its own inputs.

Every gate was green, and every gate was RIGHT: `storyboard_check` reads the board,
`flow_check` reads the board, `ship_gate` reads the board. Not one of them reads the FILM.
The whole gate suite can pass on a board that no frame was ever rendered from, and the
greener the suite the more confident the wrong answer looks. GATE_LESSONS has this shape
recorded twice already in other clothes: a caption file that was honestly aligned and never
reached the picture, and a credits string fixed in a file the renderer does not read.

So this compares MODIFICATION TIMES, which is the only thing that can catch it. It is a
crude check and it is the right crude check: it does not care what changed, only that the
product is downstream of its inputs in time.

  python3 scripts/freshness_check.py --film out/dispatch/film.mp4 \\
      --inputs out/dispatch/storyboard.json out/dispatch/mix.wav out/dispatch/captions.json
  python3 scripts/freshness_check.py --self-test

Exit 0 fresh, 1 stale, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path

# A render takes minutes and its inputs are written seconds before it starts, so the film's
# mtime is legitimately LATER than every input. Any slack here would only forgive a real
# staleness, so there is none: the film must be strictly newer, to the second.
SLACK_S = 0.0


def engine_inputs(root: Path) -> list[Path]:
    """Every source file the renderer reads, so a code edit counts as an input.

    THE HOLE THIS CLOSES. `freshness_check` compared the film against the BOARD, the mix
    and the captions, and a run edited `lib/biomes.tsx` after starting a render. The gate
    stayed green, because a change to the code that draws the frame is invisible to a check
    that only knows about data. That is the same defect this file was written for, one
    layer down: a run reasoning about whether an edit "would have mattered" instead of
    re-rendering, except here the run never got the chance to reason, because nothing
    reported anything.

    A film is stale against the code that drew it exactly as it is stale against the board.
    """
    if not root.exists():
        return []
    return sorted(p for p in root.rglob("*")
                  if p.is_file() and p.suffix in (".tsx", ".ts", ".css"))


def engine_is_bit_identical(manifest: Path | None) -> bool:
    """True only when the engine ON DISK hashes to what the manifest recorded at render.

    WHY THIS EXISTS, and why it does NOT weaken the mtime rule.

    mtime answers "is the product downstream of its inputs in time", which is the right
    crude question and has one false positive: EDIT AND REVERT. On 2026-08-28 a run
    modified `lighting.tsx` to probe whether contact shadows were drawn at all, restored
    the file byte for byte, and the restore bumped the mtime past the film. The gate said
    STALE. It was right about the timestamps and wrong about the world, and the film was a
    faithful render of that exact engine.

    The tempting move there is to argue the change "would not have mattered", which this
    file forbids in as many words and is correct to forbid. So this does not argue. It
    asks a STRICTLY STRONGER question than mtime and answers it with a hash:
    `render_manifest.engine_sha256` digests every .ts, .tsx and .css under the engine, and
    the manifest written at render time carries the value from that moment. If today's
    digest equals it, the engine is not merely "probably unchanged", it is the same bytes.

    A real edit changes the digest and this returns False, so nothing that mtime would
    catch escapes. It only forgives the case where there is provably nothing to catch.
    An absent, unreadable or digest-less manifest returns False, because the whole point
    is to require evidence rather than to assume it.
    """
    if manifest is None or not manifest.exists():
        return False
    try:
        recorded = json.loads(manifest.read_text(encoding="utf-8")).get("engine_sha256")
        if not recorded:
            return False
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from render_manifest import engine_sha256
        return engine_sha256() == recorded
    except Exception:                                                   # noqa: BLE001
        return False


def check(film: Path, inputs: list[Path], started: Path | None = None,
          manifest: Path | None = None) -> list[str]:
    errs: list[str] = []
    if not film.exists():
        return [f"{film} does not exist, so there is nothing to ship. A run that reports a "
                f"delivered video without one is the fault this whole suite is for."]
    # THE REFERENCE IS WHEN THE RENDER BEGAN, NOT WHEN IT FINISHED.
    # Remotion bundles the engine at the START of a render, so a source file edited while
    # the render is running is NOT in the film, and its mtime is still older than the
    # film's, which is written a quarter of an hour later. The check therefore passed a
    # film that was already missing a committed fix. Comparing against a marker touched at
    # the start closes the window; without one the film's own time is used and this note
    # says why that is weaker.
    fm = started.stat().st_mtime if started and started.exists() else film.stat().st_mtime
    for src in inputs:
        if not src.exists():
            errs.append(f"{src} does not exist, so the film cannot be traced to it.")
            continue
        sm = src.stat().st_mtime
        if sm > fm + SLACK_S:
            # The one forgiven case, and it is settled by a hash rather than by judgement:
            # an ENGINE source whose bytes still digest to what the manifest recorded at
            # render time. Everything else, and every non-engine input, fails as before.
            if src.suffix in {".ts", ".tsx", ".css"} and engine_is_bit_identical(manifest):
                continue
            errs.append(
                f"{src.name} was modified {sm - fm:.0f}s AFTER {film.name} was written. The "
                f"film is not a render of the board it is about to ship with. Re-render, "
                f"re-mux and re-extract the frames, then run this again. Do NOT reason about "
                f"whether the change 'would have mattered' -- that judgement is exactly what "
                f"a stale render defeats.")
    return errs


def _self_test() -> int:
    fails = []

    def ok(label, cond):
        if not cond:
            fails.append(label)
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")

    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        board = d / "board.json"
        mix = d / "mix.wav"
        film = d / "film.mp4"

        board.write_text("{}")
        mix.write_text("x")
        time.sleep(0.02)
        film.write_text("v")
        ok("a film written after its inputs is fresh", not check(film, [board, mix]))

        time.sleep(0.02)
        board.write_text("{} ")                      # the board moves on
        errs = check(film, [board, mix])
        ok("a board edited AFTER the render is refused", bool(errs))
        ok("...and the message names the file that moved",
           any("board.json" in e for e in errs))
        ok("...and it says to re-render rather than to judge whether it mattered",
           any("would have mattered" in e for e in errs))

        # THE ENGINE IS AN INPUT. A source edit after the render is the same staleness as a
        # board edit, and it used to be invisible because this file only knew about data.
        src = d / "src" / "lib"
        src.mkdir(parents=True)
        comp = src / "biomes.tsx"
        comp.write_text("// drawn")
        os.utime(comp, (time.time() - 600, time.time() - 600))
        ok("an engine source older than the film is fresh",
           not check(film, engine_inputs(d / "src")))
        time.sleep(0.02)
        comp.write_text("// drawn differently")      # a component moves on
        ok("an engine source edited AFTER the render is refused",
           bool(check(film, engine_inputs(d / "src"))))
        # THE MID-RENDER WINDOW. A source edited while the render ran is not in the film,
        # and its mtime is still older than the film's, which is written much later. With a
        # start marker the edit is caught; without one it is not, which is the hole that
        # let a committed fix miss a render and the gate call it fresh.
        marker = d / "started"
        marker.write_text("")
        os.utime(marker, (time.time() - 300, time.time() - 300))   # render began 5 min ago
        mid = src / "kit.tsx"
        mid.write_text("// edited while the render ran")
        os.utime(mid, (time.time() - 100, time.time() - 100))      # edited 100s ago
        os.utime(film, (time.time() - 10, time.time() - 10))       # film written 10s ago
        ok("an edit made DURING the render passes without a start marker (the hole)",
           not check(film, [mid]))
        ok("...and is caught with one", bool(check(film, [mid], marker)))

        ok("...and engine_inputs only picks up source files",
           all(p.suffix in (".tsx", ".ts", ".css") for p in engine_inputs(d / "src")))
        ok("...and an input that did NOT move is not blamed",
           not any("mix.wav" in e for e in errs))

        # the fault this catches is one-sided: a film newer than everything is always fine
        os.utime(film, (time.time() + 5, time.time() + 5))
        ok("a film newer than every input passes", not check(film, [board, mix]))

        missing = check(film, [d / "nope.json"])
        ok("an input that does not exist is refused, not skipped", bool(missing))
        ok("a film that does not exist is refused", bool(check(d / "gone.mp4", [board])))

    # THE DIGEST ESCAPE MUST NOT BE AN ESCAPE. It forgives exactly one thing -- an engine
    # source whose bytes still hash to what the manifest recorded -- and a checker that
    # cannot prove it refuses a REAL edit is a hole with a comment on it.
    import json as _json
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        film = d / "film.mp4"; film.write_bytes(b"film")
        os.utime(film, (1_000_000, 1_000_000))
        repo = Path(__file__).resolve().parents[1]
        src = repo / "video-engine" / "src" / "lib" / "lighting.tsx"
        good = repo / "out" / "dispatch" / "render-manifest.json"
        if src.exists() and good.exists():
            touched = d / "touched.tsx"
            touched.write_bytes(src.read_bytes())
            os.utime(touched, (2_000_000, 2_000_000))      # newer than the film

            ok("an engine file whose digest still matches the manifest is forgiven",
               not check(film, [touched], manifest=good))

            bad = d / "bad-manifest.json"
            bad.write_text(_json.dumps({"engine_sha256": "0" * 64}))
            ok("...and it is NOT forgiven when the recorded digest differs",
               bool(check(film, [touched], manifest=bad)))
            ok("...nor when no manifest is supplied at all",
               bool(check(film, [touched])))
            ok("...nor when the manifest carries no engine digest",
               bool(check(film, [touched],
                         manifest=(d / "empty.json", (d / "empty.json").write_text("{}"))[0])))

            data = d / "board.json"; data.write_text("{}")
            os.utime(data, (2_000_000, 2_000_000))
            ok("...and a NON-engine input is never forgiven, digest match or not",
               bool(check(film, [data], manifest=good)))

    print()
    print("freshness self-test: " + ("all passed" if not fails else f"{len(fails)} FAILED"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--film")
    ap.add_argument("--inputs", nargs="*", default=[])
    ap.add_argument("--engine", default="video-engine/src",
                    help="the engine source tree. A film is stale against the CODE that "
                         "drew it as surely as against the board it drew from.")
    ap.add_argument("--started",
                    help="a marker file touched when the render BEGAN. Remotion bundles at "
                         "the start, so an edit made while the render runs is baked out of "
                         "the film and still leaves a source older than the film's write "
                         "time. Compare against the start, not the finish.")
    ap.add_argument("--manifest",
                    help="render-manifest.json. Its `engine_sha256` was recorded AT RENDER, "
                         "so an engine source whose bytes still digest to it is provably the "
                         "one that drew the film. That is the only case an mtime failure is "
                         "forgiven, and it is settled by a hash rather than by judgement.")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return _self_test()
    if not a.film:
        print("freshness_check: pass --film and --inputs, or --self-test", file=sys.stderr)
        return 2
    explicit = [Path(x) for x in a.inputs]
    engine = engine_inputs(Path(a.engine))
    started = Path(a.started) if a.started else None
    errs = check(Path(a.film), explicit + engine, started,
                 Path(a.manifest) if a.manifest else None)
    if errs:
        print("freshness: the film is STALE\n", file=sys.stderr)
        for e in errs:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"freshness: {a.film} is downstream of all {len(explicit) + len(engine)} data and "
          "engine inputs.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
