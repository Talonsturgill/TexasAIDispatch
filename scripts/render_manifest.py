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
PUBLIC = REPO / "video-engine" / "public"
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


def authored_media_paths(data: dict, repo: Path) -> list[Path]:
    """The Claude lane's pictures are authored source modules, not rasters under public. Bind exactly the two
    recorded receipts to their current bytes and to the board's own inventory rows, and keep evidence rows."""
    repo = Path(repo).resolve()
    plan = data.get("story_art") or {}
    entries = plan.get("entries") or []
    if len(entries) != 2:
        raise ValueError("authored story art needs both recorded source receipts")
    rows = {str(r.get("request_id")): r for r in data.get("native_media") or [] if not str(r.get("file", "")).startswith("evidence/")}
    paths = []
    for entry in entries:
        relative = str(entry.get("file") or "")
        path = (repo / relative).resolve()
        if not path.is_relative_to(repo) or ".." in Path(relative).parts or not path.is_file():
            raise ValueError("authored source module is missing or outside the repository")
        if file_sha256(path) != entry.get("sha256"):
            raise ValueError("authored source bytes changed after their receipt: " + relative)
        row = rows.get(str(entry.get("request_id")))
        if (not row or row.get("file") != relative or row.get("sha256") != entry.get("sha256")
                or len(str(row.get("basis") or "")) < 30):
            raise ValueError("authored inventory row differs from its receipt: " + relative)
        paths.append(path)
    for item in data.get("native_media") or []:
        relative = str(item.get("file") or "")
        if relative.startswith("evidence/"):
            asset = (repo / "video-engine/public" / relative).resolve()
            if not asset.is_file() or file_sha256(asset) != item.get("sha256") or len(str(item.get("basis") or "")) < 30:
                raise ValueError("native texture is missing, changed or lacks provenance: " + relative)
            paths.append(asset)
    return paths


def native_media_paths(data: dict, public: Path = PUBLIC) -> list[Path]:
    """Bind evidence textures or exact current request-bound fresh story artwork."""
    paths = []
    root = public.resolve()
    plan = data.get("story_art") or {}
    requests = plan.get("requests") or []
    entries = plan.get("entries") or []
    prefix = "generated/story-art/" + str(data.get("date") or "") + "/"
    import authored_story_art
    if authored_story_art.selected(data):
        return authored_media_paths(data, root.parents[1])

    def checked_path(relative):
        path = Path(relative)
        if path.is_absolute() or ".." in path.parts:
            raise ValueError("native texture path is absolute or traverses public")
        asset = public / path
        if not asset.resolve().is_relative_to(root) or not asset.is_file():
            raise ValueError("native texture is missing or resolves outside public")
        return asset

    def fresh_entry(relative, request_id=None):
        if (plan.get("version") != "fresh-story-art-v1"
                or not relative.startswith(prefix) or Path(relative).suffix != ".png"):
            raise ValueError("native texture must stay in public/evidence or exact current story art")
        matched = [e for e in entries if e.get("file") == relative]
        if len(matched) != 1:
            raise ValueError("native story art asset is unlisted or duplicated")
        entry = matched[0]
        reqs = [r for r in requests if r.get("id") == entry.get("request_id")]
        if (len(reqs) != 1 or reqs[0].get("file") != relative
                or request_id is not None and request_id != entry.get("request_id")):
            raise ValueError("native story art request identity or file mismatch")
        return entry

    for item in data.get("native_media") or []:
        relative = str(item.get("file") or "")
        if relative.startswith("evidence/"):
            entry = None
        else:
            if not item.get("request_id"):
                raise ValueError("native story art inventory lacks its request identity")
            entry = fresh_entry(relative, item["request_id"])
            if entry.get("sha256") != item.get("sha256"):
                raise ValueError("native story art inventory hash differs from its receipt")
        asset = checked_path(relative)
        if file_sha256(asset) != item.get("sha256"):
            raise ValueError("native texture bytes changed: " + relative)
        if len(str(item.get("basis") or "")) < 30:
            raise ValueError("native texture lacks recorded provenance")
        paths.append(asset)
    # Standalone story-art inventory retains its exact request, bytes and containment.
    for row in entries:
        relative = str(row.get("file") or "")
        entry = fresh_entry(relative)
        asset = checked_path(relative)
        if file_sha256(asset) != entry.get("sha256"):
            raise ValueError("fresh story-art bytes changed after generation")
        if asset not in paths:
            paths.append(asset)
    return paths


def generated_media_sha256(board: Path) -> str:
    """Digest every exceptional plate the board can put into the rendered pixels."""
    data = json.loads(board.read_text(encoding="utf-8"))
    h = hashlib.sha256()
    for scene in data.get("scenes") or []:
        media = scene.get("generated_media")
        if not isinstance(media, dict):
            continue
        relative = str(media.get("file") or "")
        path = PUBLIC / relative
        if not path.is_file():
            raise FileNotFoundError(f"generated plate missing: {path}")
        h.update(relative.encode())
        h.update(b"\0")
        h.update(path.read_bytes())
        h.update(b"\0")
    for path in native_media_paths(data):
        try:
            label = path.relative_to(PUBLIC.resolve()).as_posix()
        except ValueError:
            label = path.relative_to(REPO.resolve()).as_posix()   # an authored module lives outside public
        h.update(label.encode())
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
            "generated_media_sha256": generated_media_sha256(board),
            "safearea_sha256": file_sha256(SAFEAREA),
            "feed_layout_sha256": file_sha256(FEED_LAYOUT)}


def artifact_problems(manifest: dict, film: Path, board: Path) -> list[str]:
    """Check the immutable artifact pair without requiring today's source checkout.

    A needs-review package is allowed to preserve the last playable cut after a later source edit
    breaks rendering. Its manifest must still name the exact film and board it was built from,
    but comparing that historical engine hash with the now-edited worktree would make the safety
    copy impossible to recover. Publication uses :func:`problems`, which adds that current-source
    requirement back.
    """
    out = []
    if manifest.get("schema") != SCHEMA:
        return [f"manifest is not {SCHEMA}"]
    try:
        from metadata_continuation import baseline
        bound_board = baseline(board) or board
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["render metadata continuation invalid: " + str(exc)]
    expected = {"film_sha256": file_sha256(film), "board_sha256": file_sha256(bound_board)}
    for field in ("film_sha256", "board_sha256"):
        if manifest.get(field) != expected[field]:
            out.append(f"{field} differs from the exact artifact or source now presented")
    return out


def problems(manifest: dict, film: Path, board: Path) -> list[str]:
    out = artifact_problems(manifest, film, board)
    if out:
        return out
    expected = build(film, board)
    for field in ("engine_sha256", "generated_media_sha256", "safearea_sha256",
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
        manifest["engine_sha256"] = "historical-engine"
        film.write_bytes(b"film-one")
        board.write_text("{}\n", encoding="utf-8")
        ok("a historical engine remains valid review provenance",
           not artifact_problems(manifest, film, board))
        ok("...but cannot impersonate a current-source publication",
           bool(problems(manifest, film, board)))
    with tempfile.TemporaryDirectory() as td:
        root = Path(td); (root / "evidence").mkdir()
        texture = root / "evidence" / "capture.png"; texture.write_bytes(b"native-frame")
        data = {"native_media": [{"file": "evidence/capture.png", "sha256": file_sha256(texture),
                                  "basis": "Exact crop of a known native rendered illustration frame."}]}
        ok("native texture binds its recorded bytes", native_media_paths(data, root) == [texture])
        texture.write_bytes(b"changed-frame")
        try:
            native_media_paths(data, root); rejected = False
        except ValueError:
            rejected = True
        ok("changed native texture fails before rendering", rejected)
    with tempfile.TemporaryDirectory() as td:
        import copy
        root = Path(td) / "public"
        relative = "generated/story-art/2026-10-08/fly-hero.png"
        asset = root / relative
        asset.parent.mkdir(parents=True)
        asset.write_bytes(b"fresh-original-raster")
        sha = file_sha256(asset)
        data = {"date": "2026-10-08", "story_art": {
            "version": "fresh-story-art-v1",
            "requests": [{"id": "fly-hero", "file": relative}],
            "entries": [{"request_id": "fly-hero", "file": relative, "sha256": sha}]},
            "native_media": [{"request_id": "fly-hero", "file": relative, "sha256": sha,
                              "basis": "Fresh original conceptual artwork bound to its exact generation."}]}
        ok("valid exact fresh art binds once", native_media_paths(data, root) == [asset])

        def refuses(label, mutate):
            changed = copy.deepcopy(data)
            mutate(changed)
            try:
                native_media_paths(changed, root)
                rejected = False
            except (ValueError, OSError):
                rejected = True
            ok(label, rejected)

        refuses("unlisted generated asset refused",
                lambda d: d["native_media"][0].update(file="generated/story-art/2026-10-08/unlisted.png"))
        refuses("request identity mismatch refused",
                lambda d: d["native_media"][0].update(request_id="other-request"))
        refuses("request file mismatch refused",
                lambda d: d["story_art"]["requests"][0].update(file="generated/story-art/2026-10-08/other.png"))
        refuses("stale inventory hash refused",
                lambda d: d["native_media"][0].update(sha256="0"*64))
        def traversal(d):
            bad = "generated/story-art/2026-10-08/../fly-hero.png"
            d["native_media"][0]["file"] = bad
            d["story_art"]["requests"][0]["file"] = bad
            d["story_art"]["entries"][0]["file"] = bad
        refuses("matching-request path traversal refused", traversal)
        def stale_receipt(d):
            d["native_media"][0]["sha256"] = "0"*64
            d["story_art"]["entries"][0]["sha256"] = "0"*64
        refuses("stale receipt and matching inventory hash refused", stale_receipt)
        refuses("earlier edition namespace refused",
                lambda d: d.update(date="2026-10-09"))
        outside = Path(td) / "outside.png"
        outside.write_bytes(b"fresh-original-raster")
        asset.unlink()
        asset.symlink_to(outside)
        refuses("fresh art symlink escape refused", lambda d: None)
        # Evidence remains evidence-only, including resolved containment.
        (root / "evidence").mkdir()
        evidence = root / "evidence" / "capture.png"
        evidence.symlink_to(outside)
        escaped = {"native_media": [{"file": "evidence/capture.png", "sha256": sha,
                    "basis": "Original evidence crop with a retained source and provenance."}]}
        try:
            native_media_paths(escaped, root)
            rejected = False
        except ValueError:
            rejected = True
        ok("evidence symlink escape refused", rejected)
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
