#!/usr/bin/env python3
"""Bind a rendered MP4 to the exact board, engine, and feed geometry that produced it."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "video-engine" / "src"
SAFEAREA = ENGINE / "lib" / "safearea.ts"
FEED_LAYOUT = REPO / "config" / "feed_layout.json"
SCHEMA = "dispatch_render_manifest/1"


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def engine_sha256(root: Path = ENGINE) -> str:
    h = hashlib.sha256()
    files = sorted(p for p in root.rglob("*") if p.is_file()
                   and p.suffix in {".ts", ".tsx", ".css"})
    for path in files:
        h.update(path.relative_to(root).as_posix().encode())
        h.update(b"\0")
        h.update(path.read_bytes())
        h.update(b"\0")
    return h.hexdigest()


def build(film: Path, board: Path) -> dict:
    return {"schema": SCHEMA,
            "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "film": str(film), "film_sha256": file_sha256(film),
            "board": str(board), "board_sha256": file_sha256(board),
            "engine_sha256": engine_sha256(),
            "safearea_sha256": file_sha256(SAFEAREA),
            "feed_layout_sha256": file_sha256(FEED_LAYOUT)}


def problems(manifest: dict, film: Path, board: Path) -> list[str]:
    out = []
    if manifest.get("schema") != SCHEMA:
        return [f"manifest is not {SCHEMA}"]
    expected = build(film, board)
    for field in ("film_sha256", "board_sha256", "engine_sha256", "safearea_sha256",
                  "feed_layout_sha256"):
        if manifest.get(field) != expected[field]:
            out.append(f"{field} differs from the exact artifact or source now presented")
    return out


def self_test() -> int:
    failures = 0

    def ok(label: str, condition: bool) -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}")
        failures += 0 if condition else 1

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        film, board = root / "film.mp4", root / "board.json"
        film.write_bytes(b"film-one")
        board.write_text("{}\n", encoding="utf-8")
        manifest = build(film, board)
        ok("an exact film, board, engine, and feed layout verify", not problems(manifest, film, board))
        film.write_bytes(b"film-two")
        ok("a substituted film is refused", bool(problems(manifest, film, board)))
        film.write_bytes(b"film-one")
        board.write_text('{"changed": true}\n', encoding="utf-8")
        ok("a board edited after rendering is refused", bool(problems(manifest, film, board)))
    print(f"render_manifest: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--film")
    ap.add_argument("--board")
    ap.add_argument("--out")
    ap.add_argument("--verify")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.film or not args.board:
        print("render_manifest: --film and --board are required", file=sys.stderr)
        return 2
    film, board = Path(args.film), Path(args.board)
    try:
        if args.verify:
            manifest = json.loads(Path(args.verify).read_text(encoding="utf-8"))
            errs = problems(manifest, film, board)
            for err in errs:
                print(f"  - {err}", file=sys.stderr)
            if errs:
                return 1
            print("render_manifest: exact artifact and source hashes match")
            return 0
        if not args.out:
            print("render_manifest: creation requires --out", file=sys.stderr)
            return 2
        target = Path(args.out)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(build(film, board), indent=2) + "\n", encoding="utf-8")
        print(f"render_manifest: bound final film -> {target}")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"render_manifest: cannot run: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
