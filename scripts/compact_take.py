#!/usr/bin/env python3
"""Remove excess dead air from one completed VO take without changing speech speed.

This is the bounded recovery for a correct continuous Gemini read that misses the 62-second
picture ceiling only because of long silent gaps. It never resamples, time-stretches, cuts a
voiced frame, or calls an external model. Every removed interval must be measured below the
declared RMS threshold, and the report hash-binds both source and edited WAVs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
import wave
from pathlib import Path

import numpy as np

from vo_synth_gemini import measure, write_wav


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError("compact_take requires 16-bit mono PCM")
        rate = w.getframerate()
        raw = w.readframes(w.getnframes())
    return np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0, rate


def silence_runs(x: np.ndarray, rate: int, threshold_db: float,
                 frame_ms: float = 10.0) -> list[tuple[int, int]]:
    hop = max(1, int(round(rate * frame_ms / 1000)))
    n = len(x) // hop
    if n == 0:
        return []
    frames = x[:n * hop].reshape(n, hop)
    rms = np.sqrt(np.mean(frames * frames, axis=1) + 1e-15)
    quiet = rms < 10 ** (threshold_db / 20)
    runs: list[tuple[int, int]] = []
    start = None
    for i, is_quiet in enumerate(quiet):
        if is_quiet and start is None:
            start = i
        elif not is_quiet and start is not None:
            runs.append((start * hop, i * hop))
            start = None
    if start is not None:
        runs.append((start * hop, n * hop))
    return runs


def compact(x: np.ndarray, rate: int, threshold_db: float, min_silence_s: float,
            max_silence_s: float, edge_silence_s: float) -> tuple[np.ndarray, list[dict]]:
    cuts: list[tuple[int, int]] = []
    evidence: list[dict] = []
    for start, end in silence_runs(x, rate, threshold_db):
        duration = (end - start) / rate
        is_leading = start <= int(0.03 * rate)
        is_trailing = end >= len(x) - int(0.03 * rate)
        keep = edge_silence_s if is_leading or is_trailing else max_silence_s
        if duration < min_silence_s or duration <= keep:
            continue
        remove = end - start - int(round(keep * rate))
        if is_leading:
            cut_start, cut_end = start, start + remove
        elif is_trailing:
            cut_start, cut_end = end - remove, end
        else:
            cut_start = start + int(round(keep * rate / 2))
            cut_end = end - int(round(keep * rate / 2))
        if cut_end <= cut_start:
            continue
        peak = float(np.max(np.abs(x[cut_start:cut_end]))) if cut_end > cut_start else 0.0
        cuts.append((cut_start, cut_end))
        evidence.append({
            "from_s": round(cut_start / rate, 4),
            "to_s": round(cut_end / rate, 4),
            "removed_s": round((cut_end - cut_start) / rate, 4),
            "peak_dbfs": round(20 * np.log10(max(peak, 1e-12)), 2),
        })
    parts: list[np.ndarray] = []
    cursor = 0
    for start, end in cuts:
        parts.append(x[cursor:start])
        cursor = end
    parts.append(x[cursor:])
    return np.concatenate(parts) if parts else x.copy(), evidence


def run(source: Path, output: Path, report: Path, threshold_db: float,
        min_silence_s: float, max_silence_s: float, edge_silence_s: float,
        takes_json: Path | None, take_id: str | None) -> dict:
    x, rate = read_wav(source)
    y, cuts = compact(x, rate, threshold_db, min_silence_s, max_silence_s,
                      edge_silence_s)
    if not cuts:
        raise ValueError("no qualifying silent interval was found; refusing a no-op edit")
    write_wav(output, y, rate)
    facts = measure(y, rate)
    data = {
        "schema": "dispatch_vo_silence_edit/1",
        "source": str(source),
        "source_sha256": sha256(source),
        "output": str(output),
        "output_sha256": sha256(output),
        "threshold_dbfs": threshold_db,
        "min_silence_s": min_silence_s,
        "max_retained_internal_silence_s": max_silence_s,
        "retained_edge_silence_s": edge_silence_s,
        "time_stretch": 1.0,
        "edit": "silence-only cuts from one continuous take",
        "removed_intervals": cuts,
        "removed_total_s": round(len(x) / rate - len(y) / rate, 4),
        "measurements": facts,
    }
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    if takes_json:
        rows = json.loads(takes_json.read_text(encoding="utf-8"))
        source_row = next((row for row in rows if row.get("id") == take_id), None)
        if source_row is None:
            raise ValueError(f"take id {take_id!r} is absent from {takes_json}")
        edited = dict(source_row)
        edited.update(facts)
        edited.update({
            "id": f"{take_id}_compact",
            "wav": str(output),
            "source_take_id": take_id,
            "silence_edit_report": str(report),
            "time_stretch": 1.0,
        })
        rows = [row for row in rows if row.get("id") != edited["id"]] + [edited]
        takes_json.write_text(json.dumps(rows, indent=2) + "\n", encoding="utf-8")
    return data


def self_test() -> int:
    rate = 48000
    tone = np.sin(2 * np.pi * 220 * np.arange(rate // 2) / rate) * 0.2
    x = np.concatenate([np.zeros(rate // 2), tone, np.zeros(rate), tone, np.zeros(rate // 2)])
    y, cuts = compact(x, rate, -45, 0.4, 0.24, 0.12)
    ok = bool(cuts) and len(y) < len(x) and len(y) > len(tone) * 2
    print(f"compact_take self-test: {'passed' if ok else 'FAILED'}")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source")
    ap.add_argument("--out")
    ap.add_argument("--report")
    ap.add_argument("--takes-json")
    ap.add_argument("--take-id")
    ap.add_argument("--threshold-db", type=float, default=-38.0)
    ap.add_argument("--min-silence", type=float, default=0.48)
    ap.add_argument("--max-silence", type=float, default=0.30)
    ap.add_argument("--edge-silence", type=float, default=0.12)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not (a.source and a.out and a.report):
        ap.error("--source, --out and --report are required")
    data = run(Path(a.source), Path(a.out), Path(a.report), a.threshold_db,
               a.min_silence, a.max_silence, a.edge_silence,
               Path(a.takes_json) if a.takes_json else None, a.take_id)
    print(f"compact_take: removed {data['removed_total_s']:.2f}s of measured dead air; "
          f"speech speed unchanged at 1.0; output {data['measurements']['duration_s']:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
