#!/usr/bin/env python3
"""Render and inspect the cheap quarter-scale animatic before voice or full renders.

The board gate catches declared repetition. This program checks the declaration reached pixels:
the opening changes before two seconds, every motion/revelation scene visibly changes, and a
contact sheet from the animatic can be reviewed before expensive work begins. The shared run
controller permits the original board, four bounded corrections, and one final timing pass—never
an open-ended storyboard loop.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import shutil
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import documentary_check
import critic_gate

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "video-engine"
DEFAULT_BOARD = REPO / "out" / "dispatch" / "storyboard.json"
DEFAULT_FILM = REPO / "out" / "dispatch" / "preflight.mp4"
DEFAULT_SHEET = REPO / "out" / "dispatch" / "preflight-contact-sheet.png"
DEFAULT_REPORT = REPO / "out" / "dispatch" / "preflight.json"
DEFAULT_STATE = REPO / "out" / "dispatch" / "run_state.json"
MOTION_FLOOR = 0.006


def media_tool(name: str) -> str:
    """Prefer the real system binary over Remotion's private compositor helper.

    The environment wrapper intentionally puts Remotion's directory first so the renderer can
    find its own tools. That private FFmpeg is not a standalone install on macOS: launched by
    this script it may have no libavdevice loader path. Inspection needs a normal CLI binary.
    """
    homebrew = Path("/opt/homebrew/bin") / name
    if homebrew.is_file():
        return str(homebrew)
    found = shutil.which(name)
    return found or name


FFMPEG = media_tool("ffmpeg")
FFPROBE = media_tool("ffprobe")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def probe(film: Path) -> tuple[int, int, float]:
    raw = json.loads(subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height:format=duration", "-of", "json", str(film)],
        check=True, capture_output=True, text=True).stdout)
    stream = raw["streams"][0]
    return int(stream["width"]), int(stream["height"]), float(raw["format"]["duration"])


def report_problems(saved: dict, board: Path, film: Path) -> list[str]:
    errs = []
    if saved.get("pass") is not True:
        errs.append("the preflight report is not passing")
    if saved.get("board_sha256") != sha256(board):
        errs.append("the preflight report belongs to a different board")
    data = json.loads(board.read_text(encoding="utf-8"))
    if data.get("cinematic_template") and saved.get("renderer_sha256") != critic_gate.renderer_digest(data):
        errs.append("the preflight report belongs to different renderer code or generated image bytes")
    if not film.is_file():
        errs.append("the preflight film is missing")
    elif saved.get("film_sha256") != sha256(film):
        errs.append("the preflight film changed after inspection")
    return errs


def frame(film: Path, at_s: float, width: int = 135, height: int = 240) -> np.ndarray:
    # Remotion's small bundled FFmpeg intentionally omits the rawvideo muxer on
    # macOS, even though it includes the PNG encoder and image2pipe muxer. Asking
    # for rawvideo therefore fails after a completely successful animatic render.
    # A one-frame PNG pipe is lossless for this pixel-difference check and works
    # with both the bundled binary and a full system FFmpeg.
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-ss", f"{at_s:.4f}", "-i", str(film),
         "-frames:v", "1", "-vf", f"scale={width}:{height}", "-f", "image2pipe",
         "-vcodec", "png", "-"], check=True, capture_output=True).stdout
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
    except OSError as exc:
        raise ValueError(f"frame at {at_s:.3f}s is not a readable PNG") from exc
    if image.size != (width, height):
        raise ValueError(f"frame at {at_s:.3f}s is {image.size}, expected {(width, height)}")
    return np.asarray(image, dtype=np.uint8)


def motion_score(film: Path, left_s: float, right_s: float) -> float:
    left = frame(film, left_s).astype(np.float32)
    right = frame(film, right_s).astype(np.float32)
    return float(np.mean(np.abs(right - left)) / 255.0)


def inspect_animatic(board: dict, film: Path) -> tuple[dict, list[str]]:
    width, height, duration = probe(film)
    problems: list[str] = []
    if (width, height) != (270, 480):
        problems.append(f"preflight must be quarter-scale 270x480, got {width}x{height}")
    story_runtime = float(board.get("runtime_s") or 0)
    credit_tail = float(board.get("credits_s") or 0) if str(board.get("credits") or "").strip() else 0
    runtime = story_runtime + credit_tail
    if abs(duration - runtime) > 0.25:
        problems.append(f"animatic is {duration:.2f}s but the board is {runtime:.2f}s")

    rows = []
    for i, scene in enumerate(board.get("scenes") or []):
        start, length = float(scene["start_s"]), float(scene["duration_s"])
        left = min(duration - 0.05, start + max(0.08, length * 0.2))
        right = min(duration - 0.02, start + max(0.16, length * 0.8))
        # A fast action followed by a reading hold can finish before the old 20% sample.
        # Sample across the actual directed actions; keep the same motion threshold.
        # This measures visibility only. The exact-film attention panel judges meaning.
        if documentary_check.required(board) and scene.get("visual_events"):
            events = scene["visual_events"]
            left = max(start, start + min(e["at_s"] for e in events) - .12)
            right = min(start + length - .02,
                        start + max(e["at_s"] + e.get("duration_s", .6) for e in events) + .12)
        score = motion_score(film, left, right)
        required = scene.get("beat") in {"motion", "revelation"}
        row = {"id": scene.get("id", f"s{i + 1}"), "beat": scene.get("beat"),
               "left_s": round(left, 3), "right_s": round(right, 3),
               "pixel_motion": round(score, 5), "motion_required": required}
        rows.append(row)
        if required and score < MOTION_FLOOR:
            problems.append(f"scene {row['id']} declares {row['beat']} but changes only "
                            f"{score:.4f} of pixel range. It is a held slide in the animatic.")

    first = (board.get("scenes") or [{}])[0]
    hook_right = min(duration - 0.02, float(first.get("start_s", 0))
                     + min(1.9, float(first.get("duration_s", 1)) * 0.4))
    hook_score = motion_score(film, 0.08, hook_right)
    if hook_score < MOTION_FLOOR:
        problems.append(f"the first two seconds change only {hook_score:.4f} of pixel range. "
                        "The declared hook did not become visible motion or revelation.")
    return ({"schema": "dispatch_preflight/1", "width": width, "height": height,
             "duration_s": round(duration, 3), "hook_pixel_motion": round(hook_score, 5),
             "motion_floor": MOTION_FLOOR, "scenes": rows}, problems)


def contact_sheet(board: dict, film: Path, out: Path) -> None:
    """The words and the pixels in one review artifact.

    The old sheet printed only scene id and visual family. A reviewer had to keep the board open
    beside it, so the commonest defect — a valid frame illustrating the wrong sentence — hid in
    the gap between two windows. This deliberately repeats the VO, mute takeaway and required
    concepts next to the actual midpoint frame. Then the same sheet is reviewed once with its
    text covered, because a picture that needs its explanation still fails.
    """
    scenes = board.get("scenes") or []
    font_path = ENGINE / "public" / "fonts" / "Manrope-Var.ttf"
    try:
        regular = ImageFont.truetype(str(font_path), 16)
        small = ImageFont.truetype(str(font_path), 13)
    except OSError:
        regular = ImageFont.load_default()
        small = ImageFont.load_default()
    tiles = []
    for scene in scenes:
        at = float(scene["start_s"]) + float(scene["duration_s"]) * 0.5
        rgb = frame(film, at, 360, 640)
        image = Image.fromarray(rgb)
        tile = Image.new("RGB", (360, 844), "#081018")
        tile.paste(image, (0, 34))
        draw = ImageDraw.Draw(tile)
        draw.text((10, 8),
                  f"{scene.get('id')} · {scene.get('story_role', '?')} · "
                  f"{scene.get('visual_family')}", fill="#f3efe5", font=small)
        proof = scene.get("visual_proof") or {}
        concepts = " · ".join(str(row.get("concept") or "")
                              for row in (proof.get("must_show") or [])
                              if isinstance(row, dict))
        lines = [
            ("VO", str(scene.get("vo") or ""), "#f3efe5", regular),
            ("MUTE", str(proof.get("mute_takeaway") or ""), "#bcd5ce", small),
            ("MUST", concepts, "#e7b45c", small),
        ]
        yy = 682
        for label, value, color, font in lines:
            if not value:
                continue
            wrapped = textwrap.wrap(value, width=47 if label == "VO" else 55)[:2]
            draw.text((10, yy), f"{label}  {wrapped[0]}", fill=color, font=font)
            yy += 20
            if len(wrapped) > 1:
                draw.text((49, yy), wrapped[1], fill=color, font=font)
                yy += 20
            yy += 4
        tiles.append(tile)
    cols, rows = 4, math.ceil(len(tiles) / 4)
    sheet = Image.new("RGB", (cols * 360, rows * 844), "#081018")
    for i, tile in enumerate(tiles):
        sheet.paste(tile, ((i % cols) * 360, (i // cols) * 844))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)


def render(board: Path, film: Path, state: Path) -> None:
    sys.path.insert(0, str(REPO / "scripts"))
    from run_controller import reserve

    check = subprocess.run([sys.executable, str(REPO / "scripts" / "storyboard_check.py"),
                            "--board", str(board)])
    if check.returncode:
        raise RuntimeError("storyboard gate is red; no animatic was spent")
    media = subprocess.run([sys.executable, str(REPO / "scripts" / "generated_media.py"),
                            "--board", str(board), "--verify"])
    if media.returncode:
        raise RuntimeError("a requested generated plate is missing or stale; no animatic was spent")
    caption_fit = subprocess.run(["node", str(ENGINE / "tests" / "caption_board_fit.mjs"),
                                  "--board", str(board)], cwd=ENGINE)
    if caption_fit.returncode:
        raise RuntimeError("an exact board caption overflows the phone band; no animatic was spent")
    accepted, message = reserve(state, {"preflight_renders": 1}, "quarter-scale animatic")
    print(message, file=sys.stdout if accepted else sys.stderr)
    if not accepted:
        raise RuntimeError("preflight budget refused the render")
    film.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["npx", "remotion", "render", "Dispatch", str(film),
                    f"--props={board}", "--scale=0.25", "--crf=32", "--muted",
                    "--concurrency=100%", "--log=warn"], cwd=ENGINE, check=True)


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}{'' if condition else '  ' + detail}")
        failures += 0 if condition else 1

    if not Path(FFMPEG).is_file() or not Path(FFPROBE).is_file():
        print("preflight_animatic: ffmpeg and ffprobe are required", file=sys.stderr)
        return 1
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        static, moving = root / "static.mp4", root / "moving.mp4"
        # Remotion's bundled FFmpeg is deliberately small and has no lavfi source filters.
        # Build fixtures with Pillow so the self-test exercises only capabilities used by
        # production inspection: PNG input, H.264 output and PNG frame pipes.
        for name, animated in (("static", False), ("moving", True), ("early", True)):
            seq = root / name
            seq.mkdir()
            for i in range(27):
                fixture = Image.new("RGB", (270, 480), "#17324d")
                if animated:
                    draw = ImageDraw.Draw(fixture)
                    position = min(i, 3) * 3 if name == "early" else i
                    x = 8 + position * 8
                    draw.rectangle((x, 130, x + 72, 250), fill="#e7b45c")
                    draw.line((0, 320 + position * 2, 269, 250 + position * 2),
                              fill="#bcd5ce", width=12)
                fixture.save(seq / f"{i:03d}.png")
            subprocess.run([FFMPEG, "-v", "error", "-y", "-framerate", "12",
                            "-i", str(seq / "%03d.png"), "-c:v", "libx264",
                           "-pix_fmt", "yuv420p", str(root / (name + ".mp4"))],
                           check=True)
        still_score = motion_score(static, 0.2, 1.8)
        moving_score = motion_score(moving, 0.2, 1.8)
        ok("a held slide measures below the motion floor", still_score < MOTION_FLOOR,
           str(still_score))
        ok("real pixel change measures above the motion floor", moving_score > MOTION_FLOOR,
           str(moving_score))
        early_board = {"runtime_s": 2.25, "documentary": {"schema": "dispatch_documentary/1"},
                       "scenes": [{"id": "early", "start_s": 0, "duration_s": 2.25,
                                   "beat": "motion", "visual_events": [{"at_s": 0, "duration_s": .25}]}]}
        early_film = root / "early.mp4"
        ok("the old sample pair misses an early action followed by a hold",
           motion_score(early_film, .45, 1.8) < MOTION_FLOOR)
        ok("directed samples see the early action without lowering the floor",
           not inspect_animatic(early_board, early_film)[1])
        ok("inventing action times cannot rescue a held slide",
           bool(inspect_animatic(early_board, static)[1]))
        board = root / "board.json"
        board.write_text('{"runtime_s": 2.2, "scenes": []}\n', encoding="utf-8")
        saved = {"pass": True, "board_sha256": sha256(board),
                 "film_sha256": sha256(moving)}
        ok("a report is bound to both its board and inspected animatic",
           not report_problems(saved, board, moving))
        moving.write_bytes(static.read_bytes())
        ok("a substituted animatic is refused even when the board did not move",
           bool(report_problems(saved, board, moving)))
        sheet = root / "sheet.png"
        contact_sheet({"scenes": [{"id": "s1", "start_s": 0, "duration_s": 2,
                                   "story_role": "hook", "visual_family": "test",
                                   "vo": "The words sit beside the pixels.",
                                   "visual_proof": {"mute_takeaway": "one panel visibly changes",
                                                    "must_show": [{"concept": "visible change"}]}}]},
                      static, sheet)
        ok("the review artifact carries one full frame plus its semantic panel",
           Image.open(sheet).size == (1440, 844), str(Image.open(sheet).size))
    # This existing CI entry point also exercises the documentary policy and rejection path.
    import documentary_review
    failures += critic_gate.self_test()
    for test in ("audiovisual_review_test.py", "production_quality_test.py"):
        failures += int(subprocess.run([sys.executable, str(REPO / "scripts" / test)]).returncode != 0)
    failures += documentary_check.self_test()
    failures += documentary_review.self_test()
    print(f"preflight_animatic: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", default=str(DEFAULT_BOARD))
    ap.add_argument("--film", default=str(DEFAULT_FILM))
    ap.add_argument("--sheet", default=str(DEFAULT_SHEET))
    ap.add_argument("--report", default=str(DEFAULT_REPORT))
    ap.add_argument("--state", default=str(DEFAULT_STATE))
    ap.add_argument("--inspect-only", action="store_true")
    ap.add_argument("--verify-report",
                    help="verify a passing report is bound to --board; do not render")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    try:
        board_path, film = Path(args.board), Path(args.film)
        board = json.loads(board_path.read_text(encoding="utf-8"))
        direction_errors = documentary_check.check(board)
        if direction_errors:
            raise ValueError("; ".join(direction_errors))
        critique_errors = critic_gate.check(
            board_path, board_path.parent / "storyboard_critic.json")
        if critique_errors:
            raise ValueError("; ".join(critique_errors))
        if args.verify_report:
            saved = json.loads(Path(args.verify_report).read_text(encoding="utf-8"))
            errs = report_problems(saved, board_path, film)
            if errs:
                for err in errs:
                    print(f"preflight_animatic: {err}", file=sys.stderr)
                return 1
            print("preflight_animatic: passing animatic is hash-bound to this board and film")
            return 0
        if args.inspect_only and board.get("cinematic_template") and Path(args.report).is_file():
            old = json.loads(Path(args.report).read_text(encoding="utf-8"))
            stale = report_problems(old, board_path, film)
            if stale:
                raise ValueError("inspect-only cannot rebind an older cinematic film: " + "; ".join(stale))
        if not args.inspect_only:
            render(board_path.resolve(), film.resolve(), Path(args.state))
        report, problems = inspect_animatic(board, film)
        contact_sheet(board, film, Path(args.sheet))
        report.update({"pass": not problems, "problems": problems,
                       "board_sha256": sha256(board_path), "film_sha256": sha256(film),
                       "renderer_sha256": critic_gate.renderer_digest(board),
                       "film": str(film), "contact_sheet": str(args.sheet)})
        Path(args.report).parent.mkdir(parents=True, exist_ok=True)
        Path(args.report).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        if problems:
            for problem in problems:
                print(f"  - {problem}", file=sys.stderr)
            return 1
        if documentary_check.required(board):
            # The critic gets the same event player for the rough cut. A full render replaces
            # it with a pack bound to the final MP4; preship refuses the rough cut's hash.
            import documentary_review
            review_path = Path(args.report).parent / "attention-review.json"
            review = documentary_review.build(board_path, film, review_path)
            review_errors = documentary_review.report_problems(review, board_path, film, review_path)
            if review_errors:
                raise ValueError("; ".join(review_errors))
        print(f"preflight_animatic: motion and hook clear -> {args.sheet}")
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.CalledProcessError, RuntimeError) as exc:
        print(f"preflight_animatic: refused: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
