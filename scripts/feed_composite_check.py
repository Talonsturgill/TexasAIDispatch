#!/usr/bin/env python3
"""Render the finished film under measured feed furniture and hard-gate its geometry.

The code-level safe-area gate proves the film solves against the reserved rectangle. This gate
proves the other half of that relationship: the reserve still covers measured mobile and desktop
feed overlays, and the exact final film can be composited into both destinations. A passing run
writes a two-row contact sheet and a machine-readable report.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CONFIG = REPO / "config" / "feed_layout.json"
DEFAULT_OUT = REPO / "out" / "dispatch" / "feed-composite.png"
DEFAULT_REPORT = REPO / "out" / "dispatch" / "feed-composite.json"


def load_config(path: Path = CONFIG) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if raw.get("schema") != "dispatch_feed_layout/1":
        raise ValueError(f"{path} is not dispatch_feed_layout/1")
    return raw


def geometry_problems(config: dict, bottom_reserve: float, right_reserve: float) -> list[str]:
    profiles = config.get("profiles") or []
    ids = {str(p.get("id", "")) for p in profiles}
    out: list[str] = []
    if not any("mobile" in x for x in ids) or not any("desktop" in x for x in ids):
        out.append("feed layout must carry at least one measured mobile and desktop profile")
        return out
    margin = float(config.get("minimum_margin_fraction") or 0)
    for p in profiles:
        pid = p.get("id", "<unnamed>")
        try:
            bottom = float(p["bottom_overlay_fraction"])
            right = float(p["right_overlay_fraction"])
        except (KeyError, TypeError, ValueError):
            out.append(f"{pid}: missing numeric bottom/right overlay measurement")
            continue
        if bottom_reserve + 1e-9 < bottom + margin:
            out.append(f"{pid}: bottom overlay plus margin needs {bottom + margin:.4f}; "
                       f"the film reserves {bottom_reserve:.4f}")
        if right_reserve + 1e-9 < right + margin:
            out.append(f"{pid}: right overlay plus margin needs {right + margin:.4f}; "
                       f"the film reserves {right_reserve:.4f}")
    return out


def probe(film: Path) -> tuple[int, int, float]:
    cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0",
           "-show_entries", "stream=width,height:format=duration", "-of", "json", str(film)]
    raw = json.loads(subprocess.run(cmd, check=True, capture_output=True, text=True).stdout)
    stream = raw["streams"][0]
    return int(stream["width"]), int(stream["height"]), float(raw["format"]["duration"])


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def render_contact_sheet(film: Path, out: Path, config: dict,
                         bottom_reserve: float, right_reserve: float) -> dict:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("ffmpeg and ffprobe are required for destination compositing")
    width, height, duration = probe(film)
    if (width, height) != (1080, 1920):
        raise ValueError(f"the feed expects 1080x1920, got {width}x{height}")
    if duration < 2:
        raise ValueError(f"film is only {duration:.2f}s")
    times = [min(duration - 0.2, max(0.2, duration * f)) for f in (0.03, 0.25, 0.5, 0.75, 0.97)]
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        frames: list[Path] = []
        for row, profile in enumerate(config["profiles"]):
            bottom = float(profile["bottom_overlay_fraction"])
            right = float(profile["right_overlay_fraction"])
            for col, at in enumerate(times):
                frame = root / f"r{row}c{col}.png"
                # Red is destination furniture; green is the film's reserved safe rectangle.
                vf = (
                    "scale=270:480,"
                    f"drawbox=x=0:y=ih*(1-{bottom}):w=iw:h=ih*{bottom}:color=red@0.38:t=fill,"
                    f"drawbox=x=iw*(1-{right}):y=0:w=iw*{right}:h=ih:color=red@0.25:t=fill,"
                    f"drawbox=x=0:y=0:w=iw*(1-{right_reserve}):h=ih*(1-{bottom_reserve}):"
                    "color=lime@0.8:t=3"
                )
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{at:.3f}",
                                "-i", str(film), "-frames:v", "1", "-vf", vf, str(frame)],
                               check=True)
                frames.append(frame)
        inputs = [piece for frame in frames for piece in ("-i", str(frame))]
        row0 = "".join(f"[{i}:v]" for i in range(5)) + "hstack=inputs=5[row0]"
        row1 = "".join(f"[{i}:v]" for i in range(5, 10)) + "hstack=inputs=5[row1]"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
                        f"{row0};{row1};[row0][row1]vstack=inputs=2[out]", "-map", "[out]",
                        "-frames:v", "1", str(out)], check=True)
    return {"film": str(film), "film_sha256": sha256(film), "width": width,
            "height": height, "duration_s": round(duration, 3), "sample_times_s": times,
            "contact_sheet": str(out), "profiles": [p["id"] for p in config["profiles"]]}


def current_reserves() -> tuple[float, float]:
    sys.path.insert(0, str(REPO / "scripts"))
    from safe_area_check import constants
    c = constants()
    return float(c["FEED_BOTTOM_RESERVE"]), float(c["FEED_RIGHT_RESERVE"])


def binding_problems(manifest_path: Path, film: Path, board: Path) -> list[str]:
    sys.path.insert(0, str(REPO / "scripts"))
    from render_manifest import problems
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    return problems(manifest, film, board)


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    config = load_config()
    bottom, right = current_reserves()
    ok("the current reserve covers measured mobile and desktop furniture",
       not geometry_problems(config, bottom, right), str(geometry_problems(config, bottom, right)))
    old = geometry_problems(config, 0.0875, 0.0)
    ok("the overlay geometry that shipped is refused", bool(old), str(old))
    drifted = json.loads(json.dumps(config))
    drifted["profiles"][0]["bottom_overlay_fraction"] = 0.27
    ok("a feed overlay that grows beyond the reserve is refused",
       bool(geometry_problems(drifted, bottom, right)))

    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            film, sheet, board = root / "film.mp4", root / "sheet.png", root / "board.json"
            board.write_text("{}\n", encoding="utf-8")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                            "color=c=0x17324d:s=1080x1920:r=10:d=2.2", "-pix_fmt", "yuv420p",
                            str(film)], check=True)
            result = render_contact_sheet(film, sheet, config, bottom, right)
            ok("the actual mobile/desktop compositor produces a contact sheet",
               sheet.is_file() and sheet.stat().st_size > 0, str(result))
            sys.path.insert(0, str(REPO / "scripts"))
            from render_manifest import build
            manifest = root / "render-manifest.json"
            manifest.write_text(json.dumps(build(film, board)) + "\n", encoding="utf-8")
            ok("the exact rendered film is bound to current feed geometry",
               not binding_problems(manifest, film, board))
            film.write_bytes(film.read_bytes() + b"substituted")
            ok("an old or substituted MP4 cannot borrow current safe-area code",
               bool(binding_problems(manifest, film, board)))
    else:
        ok("ffmpeg and ffprobe are present for the shipping compositor", False)
    print(f"feed_composite_check: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--film")
    ap.add_argument("--board")
    ap.add_argument("--manifest")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--report", default=str(DEFAULT_REPORT))
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    try:
        config = load_config()
        bottom, right = current_reserves()
        problems = geometry_problems(config, bottom, right)
        if problems:
            for problem in problems:
                print(f"  - {problem}", file=sys.stderr)
            return 1
        if not args.film:
            print("feed_composite_check: geometry clean; pass --film for final-film compositing")
            return 0
        if not args.board or not args.manifest:
            print("feed_composite_check: --film requires --board and --manifest. An old MP4 "
                  "cannot borrow current safe-area source code.", file=sys.stderr)
            return 1
        binding = binding_problems(Path(args.manifest), Path(args.film), Path(args.board))
        if binding:
            for problem in binding:
                print(f"  - {problem}", file=sys.stderr)
            return 1
        result = render_contact_sheet(Path(args.film), Path(args.out), config, bottom, right)
        result.update({"schema": "dispatch_feed_composite/1", "pass": True,
                       "bottom_reserve_fraction": bottom, "right_reserve_fraction": right,
                       "render_manifest": str(args.manifest)})
        report = Path(args.report)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(f"feed_composite_check: final film fits both profiles -> {args.out}")
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.CalledProcessError, RuntimeError) as exc:
        print(f"feed_composite_check: refused: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
