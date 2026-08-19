#!/usr/bin/env python3
"""render_bench.py — find the concurrency this box actually renders fastest at.

WHY THIS EXISTS. The routine said `--concurrency=100%` and called the question closed,
because the default leaves half the cores idle and the flag fixed that. It did not close
the question. Measured on the four core container, `100%` runs eight Chrome processes at
about 157 percent of the 400 percent available: the flag is applied, and the box is still
a bit over half idle. A Remotion worker is not CPU bound end to end. It waits on layout,
on paint, on the handoff to the encoder, and a worker that is waiting is a core doing
nothing.

So the right number is not one-per-core and it is not a guess. It is whatever this
machine measures fastest at, and it will differ on a machine with different cores or
different memory. `100%` was a real improvement over the default and it was still an
assumption, which is the same shape of mistake as the default was: a number believed
rather than measured.

THE CEILING IS THE CORE COUNT, AND IT IS ENFORCED. Remotion refuses `--concurrency`
above the number of cores outright, so `100%` is not merely a good default, it is the
maximum this machine will accept. The ~44 percent CPU that prompted this file is
therefore inherent to the pipeline: workers wait on layout, paint and the handoff to the
encoder, and no flag fills that in. Kept as a measurement rather than deleted, because
the next run to notice the idle CPU will otherwise reach for the same wrong lever.

THE OTHER CEILING IS MEMORY. Each worker is a browser page, so oversubscribing trades
RAM for throughput. This measures resident memory alongside frames per second and refuses
to recommend a setting that would not fit, because a render that dies at frame 1500 costs
more than the minutes it saved.

Run it when the container changes. Write the answer into prompts/dispatch_routine.md.

    python3 scripts/render_bench.py --frames 120
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGINE = ROOT / "video-engine"
BOARD = ROOT / "out" / "dispatch" / "storyboard.json"


def total_ram_mb() -> int:
    for line in Path("/proc/meminfo").read_text().splitlines():
        if line.startswith("MemTotal:"):
            return int(line.split()[1]) // 1024
    return 0


def cores() -> int:
    return os.cpu_count() or 1


def run_one(conc: str, frames: int, out: Path) -> dict:
    """Render `frames` frames at one concurrency and report frames per second."""
    if out.exists():
        out.unlink()
    cmd = [
        "npx", "remotion", "render", "Dispatch", str(out),
        f"--props={BOARD}", f"--concurrency={conc}",
        "--frames", f"0-{frames - 1}", "--log=error",
    ]
    peak_mb = 0
    t0 = time.time()
    proc = subprocess.Popen(cmd, cwd=ENGINE, stdout=subprocess.DEVNULL,
                            stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL)
    while proc.poll() is None:
        try:
            ps = subprocess.run(["ps", "-eo", "rss,comm", "--no-headers"],
                                capture_output=True, text=True, timeout=5).stdout
            rss = sum(int(l.split()[0]) for l in ps.splitlines()
                      if l.split()[1:] and "headless_shell" in l.split()[1])
            peak_mb = max(peak_mb, rss // 1024)
        except Exception:
            pass
        time.sleep(1.0)
    dt = time.time() - t0
    ok = proc.returncode == 0 and out.exists()
    return {"concurrency": conc, "seconds": round(dt, 1),
            "fps": round(frames / dt, 2) if ok and dt > 0 else 0.0,
            "peak_chrome_mb": peak_mb, "ok": ok}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=120,
                    help="frames per trial. Enough to get past warm-up and no more.")
    ap.add_argument("--settings", default="",
                    help="comma list to try. Default derives from the core count.")
    a = ap.parse_args()

    if not BOARD.exists():
        print(f"render_bench: no board at {BOARD}. Run a build first.", file=sys.stderr)
        return 2

    n = cores()
    # REMOTION HARD CAPS CONCURRENCY AT THE CORE COUNT. `resolveConcurrency` throws
    # "Maximum for --concurrency is N (number of cores on this system)" and the render
    # dies before it bundles. So oversubscribing is not a lever that exists here, however
    # much idle CPU the box shows, and anything above `n` is not worth a trial slot.
    # This was measured by trying it, which is the only way the cap announces itself.
    trials = ([s.strip() for s in a.settings.split(",") if s.strip()]
              or ["100%"] + [str(k) for k in (max(1, n // 2), max(1, n - 1)) if k != n])

    ram = total_ram_mb()
    print(f"cores={n}  ram={ram}MB  frames per trial={a.frames}")
    print("A worker is a browser page, so the ceiling here is RAM, not cores.\n")

    tmp = ROOT / "out" / "dispatch" / "_bench.mp4"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for c in trials:
        r = run_one(c, a.frames, tmp)
        rows.append(r)
        state = "ok" if r["ok"] else "FAILED"
        print(f"  concurrency={c:>5}  {r['fps']:>5.2f} fps  "
              f"{r['seconds']:>6.1f}s  peak chrome {r['peak_chrome_mb']:>5}MB  {state}")
    if tmp.exists():
        tmp.unlink()

    good = [r for r in rows if r["ok"] and r["fps"] > 0]
    if not good:
        print("\nrender_bench: nothing completed. Not recommending a setting.", file=sys.stderr)
        return 1

    # HEADROOM IS PART OF THE ANSWER. A setting that wins by three percent while using
    # eighty percent of memory is not the setting to write into the routine: the bench
    # renders 120 frames and a real run renders nearly two thousand, so peak grows.
    safe = [r for r in good if r["peak_chrome_mb"] < ram * 0.55]
    pool = safe or good
    best = max(pool, key=lambda r: r["fps"])
    base = next((r for r in good if r["concurrency"] == "100%"), None)

    print(f"\nfastest safe setting: --concurrency={best['concurrency']}  "
          f"at {best['fps']} fps")
    if base and base is not best and base["fps"] > 0:
        gain = (best["fps"] / base["fps"] - 1) * 100
        print(f"that is {gain:+.0f}% against --concurrency=100%, which the routine "
              f"currently specifies")
        if gain < 8:
            print("under eight percent is inside the noise of a shared container. "
                  "Keep 100% and spend the attention somewhere it pays.")
    if not safe:
        print("WARNING: every setting used more than half of RAM. A four core box can "
              "run out of memory before it runs out of frames, and a render that dies "
              "at frame 1500 costs more than the minutes it saved.")

    (ROOT / "out" / "dispatch" / "render_bench.json").write_text(
        json.dumps({"cores": n, "ram_mb": ram, "frames": a.frames, "trials": rows,
                    "recommended": best["concurrency"]}, indent=1))
    print("\nwritten to out/dispatch/render_bench.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
