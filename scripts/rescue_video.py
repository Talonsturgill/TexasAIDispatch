#!/usr/bin/env python3
"""Always leave a playable review reel when the full renderer cannot finish.

The preferred rescue is the inspected quarter-scale animatic, upscaled and muxed with the best
available audio. If that artifact is missing or no longer hash-bound, this builds timed storyboard
cards instead. Both paths are explicit review evidence, never publication output.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
FONT = REPO / "video-engine" / "public" / "fonts" / "Manrope-Var.ttf"
MONO = REPO / "video-engine" / "public" / "fonts" / "JetBrainsMono-Bold.ttf"
WIDTH, HEIGHT, FPS = 1080, 1920, 30


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def runtime(board: dict) -> float:
    declared = float(board.get("runtime_s") or 0)
    end = max((float(s.get("start_s") or 0) + float(s.get("duration_s") or 0)
               for s in board.get("scenes") or []), default=0.0)
    value = max(declared, end)
    if value <= 0:
        raise ValueError("the storyboard has no positive runtime")
    return value


def media(path: Path) -> dict:
    proc = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,width,height:format=duration", "-of", "json", str(path),
    ], capture_output=True, text=True, timeout=30)
    if proc.returncode:
        raise ValueError(f"ffprobe cannot decode {path}: {proc.stderr.strip()[:180]}")
    return json.loads(proc.stdout)


def audio_is_usable(path: Path | None) -> bool:
    if path is None or not path.is_file():
        return False
    try:
        return any(s.get("codec_type") == "audio" for s in media(path).get("streams") or [])
    except (OSError, ValueError, json.JSONDecodeError, subprocess.SubprocessError):
        return False


def preflight_is_usable(board_path: Path, film: Path | None, report: Path | None,
                        expected_runtime: float) -> tuple[bool, str]:
    if film is None or report is None or not film.is_file() or not report.is_file():
        return False, "no intact inspected animatic was available"
    try:
        saved = json.loads(report.read_text(encoding="utf-8"))
        sys.path.insert(0, str(REPO / "scripts"))
        from preflight_animatic import report_problems
        errs = report_problems(saved, board_path, film)
        info = media(film)
        videos = [s for s in info.get("streams") or [] if s.get("codec_type") == "video"]
        duration = float((info.get("format") or {}).get("duration") or 0)
        if not videos or (int(videos[0].get("width") or 0),
                          int(videos[0].get("height") or 0)) != (270, 480):
            errs.append("the inspected animatic is not 270x480")
        if abs(duration - expected_runtime) > 0.25:
            errs.append("the inspected animatic no longer spans the board")
        return not errs, "; ".join(errs) if errs else "hash-bound inspected animatic"
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.SubprocessError) as exc:
        return False, f"the inspected animatic could not be verified: {exc}"


def fit_lines(draw: ImageDraw.ImageDraw, value: str, font: ImageFont.FreeTypeFont,
              max_width: int, max_lines: int) -> str:
    words = value.strip().split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
        if len(lines) == max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(lines) == max_lines and len(" ".join(lines).split()) < len(words):
        lines[-1] = textwrap.shorten(lines[-1], width=max(8, len(lines[-1]) - 1),
                                     placeholder="…")
    return "\n".join(lines)


def card(scene: dict, index: int, total: int, out: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#07131f")
    draw = ImageDraw.Draw(image)
    title_font = ImageFont.truetype(str(FONT), 82)
    body_font = ImageFont.truetype(str(FONT), 42)
    mono_font = ImageFont.truetype(str(MONO), 28)
    accent = "#e6b54a"
    draw.rectangle((0, 0, WIDTH, 18), fill=accent)
    draw.text((72, 74), "TEXAS AI DISPATCH", font=mono_font, fill="#eaf2f7")
    draw.text((72, 122), "REVIEW RESCUE REEL", font=mono_font, fill=accent)

    headline = str(scene.get("super") or scene.get("title") or scene.get("id")
                   or "Storyboard beat")
    draw.multiline_text((72, 330), fit_lines(draw, headline, title_font, 936, 5),
                        font=title_font, fill="#ffffff", spacing=18)
    caption = str(scene.get("caption") or scene.get("on_screen") or
                  scene.get("what_moves") or "Visual beat preserved from the storyboard.")
    draw.multiline_text((72, 910), fit_lines(draw, caption, body_font, 936, 6),
                        font=body_font, fill="#b9c8d2", spacing=16)

    details = [
        f"SCENE  {scene.get('id', index + 1)}",
        f"FAMILY {scene.get('visual_family', 'unspecified')}",
        f"PLACE  {scene.get('county') or scene.get('region') or 'Texas'}",
        f"BEAT   {scene.get('beat', 'unspecified')}",
    ]
    y = 1420
    for line in details:
        draw.text((72, y), line.upper(), font=mono_font, fill="#7fa2b7")
        y += 54
    draw.rectangle((72, 1774, 1008, 1786), fill="#17354a")
    draw.rectangle((72, 1774, 72 + int(936 * ((index + 1) / total)), 1786), fill=accent)
    draw.text((72, 1812), f"PLAYABLE FALLBACK · {index + 1}/{total}",
              font=mono_font, fill="#7fa2b7")
    image.save(out)


def storyboard_visual(board: dict, seconds: float, out: Path, root: Path) -> None:
    scenes = sorted(board.get("scenes") or [], key=lambda s: float(s.get("start_s") or 0))
    if not scenes:
        scenes = [{"id": "s1", "super": "Storyboard unavailable",
                   "caption": "The run reached rescue mode before a scene list was preserved."}]
    cards = []
    starts = [max(0.0, float(scene.get("start_s") or 0)) for scene in scenes]
    for i, scene in enumerate(scenes):
        target = root / f"scene-{i:02d}.png"
        card(scene, i, len(scenes), target)
        start = starts[i]
        end = starts[i + 1] if i + 1 < len(starts) else seconds
        duration = max(1 / FPS, end - start)
        cards.append((target, duration))
    concat = root / "cards.ffconcat"
    lines = ["ffconcat version 1.0"]
    for image, duration in cards:
        lines.extend((f"file '{image.as_posix()}'", f"duration {duration:.6f}"))
    lines.append(f"file '{cards[-1][0].as_posix()}'")
    concat.write_text("\n".join(lines) + "\n", encoding="utf-8")
    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-safe", "0", "-f", "concat", "-i", str(concat),
        "-vf", f"fps={FPS},format=yuv420p", "-t", f"{seconds:.6f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-an", str(out),
    ], check=True)


def build(board_path: Path, out: Path, report_path: Path, reason: str,
          mix: Path | None = None, preflight: Path | None = None,
          preflight_report: Path | None = None) -> dict:
    board = json.loads(board_path.read_text(encoding="utf-8"))
    seconds = runtime(board)
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="dispatch-rescue-", dir=out.parent) as td:
        root = Path(td)
        visual = root / "visual.mp4"
        use_preflight, preflight_note = preflight_is_usable(
            board_path, preflight, preflight_report, seconds)
        if use_preflight:
            subprocess.run([
                "ffmpeg", "-v", "error", "-y", "-i", str(preflight),
                "-vf", f"scale={WIDTH}:{HEIGHT}:flags=lanczos,format=yuv420p",
                "-t", f"{seconds:.6f}", "-c:v", "libx264", "-preset", "veryfast",
                "-crf", "22", "-an", str(visual),
            ], check=True)
            visual_source = "inspected_animatic_upscale"
        else:
            storyboard_visual(board, seconds, visual, root)
            visual_source = "timed_storyboard_cards"

        staged = root / "dispatch-rescue.mp4"
        command = ["ffmpeg", "-v", "error", "-y", "-i", str(visual)]
        if audio_is_usable(mix):
            command += ["-i", str(mix), "-map", "0:v:0", "-map", "1:a:0",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "apad"]
            audio_source = "best_available_mix"
        else:
            command += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
                        "-c:a", "aac", "-b:a", "96k"]
            audio_source = "review_only_silence"
        command += ["-t", f"{seconds:.6f}", "-movflags", "+faststart", str(staged)]
        subprocess.run(command, check=True)
        info = media(staged)
        videos = [s for s in info.get("streams") or [] if s.get("codec_type") == "video"]
        audios = [s for s in info.get("streams") or [] if s.get("codec_type") == "audio"]
        duration = float((info.get("format") or {}).get("duration") or 0)
        if (not videos or not audios
                or (int(videos[0].get("width") or 0),
                    int(videos[0].get("height") or 0)) != (WIDTH, HEIGHT)
                or abs(duration - seconds) > 0.15):
            raise ValueError("the generated rescue reel failed its own media contract")
        os.replace(staged, out)

    result = {
        "schema": "dispatch_rescue_video/1",
        "review_only": True,
        "reason": reason.strip(),
        "visual_source": visual_source,
        "visual_source_note": preflight_note,
        "audio_source": audio_source,
        "duration_s": round(seconds, 3),
        "film": str(out),
        "film_sha256": digest(out),
        "board": str(board_path),
        "board_sha256": digest(board_path),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool) -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}")
        failures += 0 if condition else 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        board = root / "board.json"
        board.write_text(json.dumps({
            "runtime_s": 0.6,
            "scenes": [{"id": "s1", "start_s": 0, "duration_s": 0.6,
                        "super": "The fallback still tells you what survived",
                        "caption": "A review reel is better evidence than an empty run."}],
        }) + "\n", encoding="utf-8")
        film, report = root / "cards.mp4", root / "cards.json"
        card_result = build(board, film, report, "renderer unavailable")
        info = media(film)
        streams = info.get("streams") or []
        ok("a missing renderer still produces 1080x1920 video",
           any(s.get("codec_type") == "video" and s.get("width") == WIDTH
               and s.get("height") == HEIGHT for s in streams))
        ok("the rescue always carries an audio stream",
           any(s.get("codec_type") == "audio" for s in streams))
        ok("the no-input path is honest storyboard cards with review silence",
           card_result["visual_source"] == "timed_storyboard_cards"
           and card_result["audio_source"] == "review_only_silence")
        ok("the rescue report is bound to the bytes it describes",
           card_result["film_sha256"] == digest(film) and card_result["review_only"])

        preflight = root / "preflight.mp4"
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
            "testsrc2=s=270x480:r=12:d=0.6", "-pix_fmt", "yuv420p", str(preflight),
        ], check=True)
        preflight_report = root / "preflight.json"
        preflight_report.write_text(json.dumps({
            "pass": True, "board_sha256": digest(board),
            "film_sha256": digest(preflight),
        }) + "\n", encoding="utf-8")
        upscale, upscale_report = root / "upscale.mp4", root / "upscale.json"
        upscale_result = build(board, upscale, upscale_report, "full render failed",
                               preflight=preflight, preflight_report=preflight_report)
        ok("an intact inspected animatic is preferred over storyboard cards",
           upscale_result["visual_source"] == "inspected_animatic_upscale")
    print(f"rescue_video: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board")
    ap.add_argument("--out")
    ap.add_argument("--report")
    ap.add_argument("--reason", default="full-resolution renderer did not produce a film")
    ap.add_argument("--mix")
    ap.add_argument("--preflight")
    ap.add_argument("--preflight-report")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not all((args.board, args.out, args.report)):
        print("rescue_video: --board, --out, and --report are required", file=sys.stderr)
        return 2
    try:
        result = build(
            Path(args.board), Path(args.out), Path(args.report), args.reason,
            Path(args.mix) if args.mix else None,
            Path(args.preflight) if args.preflight else None,
            Path(args.preflight_report) if args.preflight_report else None,
        )
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.SubprocessError) as exc:
        print(f"rescue_video: cannot preserve a review reel: {exc}", file=sys.stderr)
        return 1
    print(f"rescue_video: playable review-only {result['visual_source']} -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
