#!/usr/bin/env python3
"""Select, fetch, validate and register a real licensed Dispatch music track.

The source pool is metadata, not a music library. A candidate becomes usable only after this
program downloads its exact audio, proves it is decodable and long enough, and writes a complete
registry row. Recent published runs are excluded so the daily routine does not fall back to one
familiar cue. Project-synthesized beds never enter this path.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
import urllib.request
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parents[1]
POOL = REPO / "config" / "music" / "sources.json"
REGISTRY = REPO / "config" / "music" / "tracks.json"
RUNS = REPO / "runs"
ALLOWED = {"cc0", "cc-by-3.0", "cc-by-4.0"}
REQUIRED = {
    "id", "title", "artist", "source_url", "source_label", "download_url", "licence",
    "licence_url", "moods", "uses", "avoid", "traits", "energy", "era_texture",
    "era_fit", "speech_masking", "mix_gap_db",
}


def load_json(path: Path) -> list[dict]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError(f"{path} must contain a JSON array")
    return raw


def candidate_problems(track: dict) -> list[str]:
    tid = str(track.get("id") or "<no id>")
    out = [f"{tid}: missing {field}" for field in sorted(REQUIRED)
           if field not in track or track[field] in (None, "")]
    if track.get("licence") not in ALLOWED:
        out.append(f"{tid}: licence {track.get('licence')!r} is not an attribution-safe source licence")
    if track.get("energy") not in {"low", "medium", "high"}:
        out.append(f"{tid}: energy must be low, medium or high")
    if track.get("speech_masking") not in {"low", "medium", "high"}:
        out.append(f"{tid}: speech_masking must be low, medium or high")
    for field in ("moods", "uses", "avoid", "traits", "era_fit"):
        if not isinstance(track.get(field), list):
            out.append(f"{tid}: {field} must be a list")
    for field in ("source_url", "download_url", "licence_url"):
        if str(track.get(field, "")).strip() and urlparse(str(track[field])).scheme != "https":
            out.append(f"{tid}: {field} must use https")
    return out


def metadata_fits(track: dict, brief: dict) -> bool:
    moods = {str(x).lower() for x in brief.get("moods", [])}
    contexts = {str(x).lower() for x in brief.get("topics", [])}
    use = str(brief.get("use") or "").lower()
    contexts.add(use)
    avoid = {str(x).lower() for x in brief.get("avoid", [])}
    return bool(moods.intersection(str(x).lower() for x in track["moods"])) \
        and use in {str(x).lower() for x in track["uses"]} \
        and str(brief.get("energy") or "").lower() == track["energy"] \
        and str(brief.get("era") or "").lower() in {str(x).lower() for x in track["era_fit"]} \
        and not contexts.intersection(str(x).lower() for x in track["avoid"]) \
        and not avoid.intersection(str(x).lower() for x in track["traits"])


def recent_ids(limit: int = 10) -> list[str]:
    rows: list[tuple[str, str]] = []
    if not RUNS.is_dir():
        return []
    for report in RUNS.glob("20??-??-??/mix.json"):
        try:
            data = json.loads(report.read_text(encoding="utf-8"))
            tid = str(data.get("bed_track_id") or "").strip()
            if tid:
                rows.append((report.parent.name, tid))
        except (OSError, json.JSONDecodeError):
            continue
    rows.sort(reverse=True)
    return [tid for _, tid in rows[:limit]]


def select(pool: list[dict], brief: dict, used: list[str]) -> dict | None:
    fits = [t for t in pool if not candidate_problems(t) and metadata_fits(t, brief)]
    if not fits:
        return None
    recent = set(used)
    fresh = [t for t in fits if t["id"] not in recent]
    choices = fresh or fits
    moods = {str(x).lower() for x in brief.get("moods", [])}
    choices.sort(key=lambda t: (-len(moods.intersection(str(x).lower() for x in t["moods"])),
                                used.index(t["id"]) if t["id"] in used else -1, t["id"]))
    return choices[0]


def audio_facts(path: Path) -> dict:
    proc = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
        "stream=codec_name,duration:format=duration", "-of", "json", str(path),
    ], capture_output=True, text=True, timeout=60)
    if proc.returncode:
        raise ValueError(f"download is not decodable audio: {proc.stderr.strip()[:180]}")
    raw = json.loads(proc.stdout)
    if not raw.get("streams"):
        raise ValueError("download contains no audio stream")
    seconds = float(raw["streams"][0].get("duration") or raw.get("format", {}).get("duration") or 0)
    if seconds < 20:
        raise ValueError(f"download is only {seconds:.1f}s; a source bed must be at least 20s")
    return {"codec": raw["streams"][0].get("codec_name"), "duration_s": round(seconds, 3)}


def download(track: dict) -> tuple[Path, dict]:
    suffix = Path(urlparse(track["download_url"]).path).suffix.lower()
    if suffix not in {".mp3", ".ogg", ".wav", ".flac", ".m4a"}:
        suffix = ".audio"
    target = REPO / "assets" / "music" / f"{track['id']}{suffix}"
    target.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(track["download_url"], headers={
        "User-Agent": "Mozilla/5.0 (Texas AI Dispatch licensed music fetch)",
        "Referer": "https://incompetech.com/",
    })
    fd, tmp_name = tempfile.mkstemp(prefix=track["id"] + ".", suffix=suffix,
                                    dir=target.parent)
    os.close(fd)
    tmp = Path(tmp_name)
    try:
        with urllib.request.urlopen(request, timeout=240) as response, tmp.open("wb") as out:
            while chunk := response.read(1024 * 1024):
                out.write(chunk)
        if tmp.stat().st_size < 50_000:
            raise ValueError("download is too small to be a real music file")
        facts = audio_facts(tmp)
        os.replace(tmp, target)
        return target, facts
    finally:
        if tmp.exists():
            tmp.unlink()


def register(track: dict, asset: Path, registry_path: Path = REGISTRY) -> dict:
    rows = load_json(registry_path) if registry_path.exists() else []
    row = {k: v for k, v in track.items() if k != "download_url"}
    row.update({
        "transfer_rights": "none",
        "file": str(asset.relative_to(REPO)) if asset.is_relative_to(REPO) else str(asset),
        "verified_on": date.today().isoformat(),
        "modified": True,
        "enabled": True,
    })
    rows = [old for old in rows if old.get("id") != row["id"]] + [row]
    registry_path.parent.mkdir(parents=True, exist_ok=True)
    registry_path.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    return row


def self_test() -> int:
    pool = load_json(POOL)
    failures = 0

    def ok(label: str, condition: bool) -> None:
        nonlocal failures
        print(f"  {'ok  ' if condition else 'FAIL'}  {label}")
        failures += 0 if condition else 1

    ok("the source library contains at least ten real-track candidates", len(pool) >= 10)
    ok("every source candidate is structurally valid", not [p for t in pool for p in candidate_problems(t)])
    brief = {"moods": ["measured", "investigative"], "use": "public-records",
             "energy": "medium", "era": "contemporary",
             "topics": ["ai-policy"], "avoid": ["celebratory"]}
    first = select(pool, brief, [])
    ok("a fitting source is selected from story metadata", first is not None)
    second = select(pool, brief, [first["id"]] if first else [])
    ok("recent use is avoided when another fit exists", second is not None and second["id"] != first["id"])
    ok("project-original synthesis is absent from the source library",
       all(t.get("licence") != "project-original" for t in pool))
    print(f"source_music: {failures} failure(s)")
    return 1 if failures else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--brief")
    ap.add_argument("--track")
    ap.add_argument("--recent", type=int, default=10)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    try:
        pool = load_json(POOL)
        problems = [p for track in pool for p in candidate_problems(track)]
        if args.self_test:
            return self_test()
        if args.check:
            for problem in problems:
                print(f"  - {problem}")
            if problems:
                return 1
            print(f"source_music: {len(pool)} licensed source candidate(s) clean")
            return 0
        if problems:
            raise ValueError("source library is invalid; run --check")
        if not args.brief:
            raise ValueError("--brief is required")
        brief = json.loads(Path(args.brief).read_text(encoding="utf-8"))
        if args.track:
            chosen = next((t for t in pool if t["id"] == args.track), None)
            if chosen is None:
                raise ValueError(f"no source candidate {args.track!r}")
            if not metadata_fits(chosen, brief):
                raise ValueError(f"{args.track} does not fit the declared music brief")
        else:
            chosen = select(pool, brief, recent_ids(args.recent))
            if chosen is None:
                raise ValueError("no licensed source candidate fits; research and add one, do not synthesize")
        asset, facts = download(chosen)
        row = register(chosen, asset)
        print(f"source_music: downloaded {row['title']} by {row['artist']} "
              f"({facts['duration_s']:.1f}s {facts['codec']})")
        print(row["id"])
        return 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError,
            subprocess.SubprocessError) as exc:
        print(f"source_music: refused: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
