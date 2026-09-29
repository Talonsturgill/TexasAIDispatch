"""Reconcile one ASR article ambiguity using retained independent soundcheck evidence.

No fresh listening is claimed. Raw ASR, audio, script and DTW centers stay unchanged.
"""
from __future__ import annotations
import json
import shutil
import wave
from pathlib import Path
import numpy as np


def package(out, destination):
    """Archive original receipt and its local evidence without rewriting bindings."""
    from vo_align import digest
    out, destination = Path(out), Path(destination)
    try:
        out = out.resolve().relative_to(Path.cwd().resolve())
    except ValueError as exc:
        raise ValueError("alignment archive output must be inside the repository") from exc
    receipt = out / "alignment_reconciliation.json"
    if not receipt.exists():
        return
    data = json.loads(receipt.read_text())
    refs = [receipt, out / "alignment_aliases.json", out / "mix_vo.wav",
            out / "vo_script.txt", out / "acoustic-asr.json", Path(data["state_file"])]
    refs.extend(Path(data[key]["file"]) for key in ("takes", "source", "compact", "silence_edit"))
    root = destination / "alignment-evidence"
    # Validate all references before copying any evidence.
    manifest = []
    for source in refs:
        if source.is_absolute() or ".." in source.parts or not source.is_file():
            raise ValueError("alignment archive requires existing repository-relative evidence")
        target = root / source
        if target.exists() and digest(target) != digest(source):
            raise ValueError("alignment archive refuses replaced evidence")
        manifest.append({"file": str(source), "sha256": digest(source)})
    for row in manifest:
        target = root / row["file"]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(row["file"], target)
        if digest(target) != row["sha256"]:
            raise ValueError("alignment archive copy differs")
    (root / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def pcm(path):
    with wave.open(str(path), "rb") as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError("reconciliation requires mono PCM16 evidence")
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2"), w.getframerate()


def requantize(samples):
    # Exact existing PCM writer, not gain fitting or waveform tolerance.
    return (samples.astype(np.float64) / 32768 * 32767).astype("<i2")


def reconcile(path, voice, script, asr, heard, aliases):
    from vo_align import canonical, digest
    data = json.loads(Path(path).read_text())
    if data.get("schema") != "dispatch_alignment_reconciliation/1":
        raise ValueError("unknown reconciliation schema")
    for key, target in (("voice", voice), ("script", script), ("asr", asr)):
        if data.get(key + "_sha256") != digest(target):
            raise ValueError("stale reconciliation " + key)

    def bound(key):
        row = data[key]
        target = Path(row["file"])
        if digest(target) != row["sha256"]:
            raise ValueError("stale reconciliation " + key)
        return target

    takes = json.loads(bound("takes").read_text())
    take = next(t for t in takes if t.get("id") == data["source_take_id"])
    source = bound("source")
    if Path(take["wav"]).resolve() != source.resolve() or take.get("source_take_id"):
        raise ValueError("soundcheck must belong to the original take")
    event = data["soundcheck_event"]
    state = json.loads(Path(data["state_file"]).read_text())
    if (event not in state.get("events", []) or event.get("kind") != "telemetry"
            or event.get("resource") != "tts_calls"
            or not event.get("note", "").startswith("verbatim soundcheck with ")
            or event.get("reported_tokens", 0) <= 0):
        raise ValueError("missing original independent soundcheck event")

    report = json.loads(bound("silence_edit").read_text())
    compact = bound("compact")
    if (report.get("source_sha256") != digest(source)
            or report.get("output_sha256") != digest(compact)
            or report.get("time_stretch") != 1.0):
        raise ValueError("silence edit does not bind original and compact audio")
    x, rate = pcm(source)
    y, yrate = pcm(compact)
    from compact_take import compact as compact_audio
    expected, cuts = compact_audio(x.astype(float) / 32768, rate,
                                  report["threshold_dbfs"], report["min_silence_s"],
                                  report["max_retained_internal_silence_s"],
                                  report["retained_edge_silence_s"])
    if (cuts != report["removed_intervals"] or rate != yrate
            or not np.array_equal((expected * 32767).astype("<i2"), y)):
        raise ValueError("compact PCM differs from declared silence-only edit")
    v, vrate = pcm(voice)
    offset = data.get("voice_offset_samples")
    if type(offset) is not int or offset < 0 or offset + len(y) > len(v):
        raise ValueError("invalid voice placement")
    if (vrate != rate or np.any(v[:offset]) or np.any(v[offset + len(y):])
            or not np.array_equal(v[offset:offset + len(y)], requantize(y))):
        raise ValueError("voice stem is not preserved compact PCM on its timeline")

    names = {}
    for row in aliases:
        if row.get("kind") == "proper-name-tokenization":
            names[canonical(row["heard"])[0]] = canonical(row["script"])
    def normalized(text):
        return [p for word in canonical(text) for p in names.get(word, [word])]
    if normalized(take.get("transcript", "")) != normalized(Path(script).read_text()):
        raise ValueError("independent soundcheck does not corroborate the complete script")

    corrections = data.get("corrections", [])
    if len(corrections) != 1:
        raise ValueError("one occurrence-specific an/and ambiguity is supported")
    correction = corrections[0]
    if (correction.get("heard"), correction.get("script")) != ("and", "an"):
        raise ValueError("only corroborated and-to-an ambiguity is supported")
    occurrence = correction.get("occurrence")
    if type(occurrence) is not int or occurrence < 1:
        raise ValueError("a positive exact occurrence is required")
    positions = [i for i, word in enumerate(heard) if canonical(word["text"]) == ["and"]]
    if occurrence > len(positions):
        raise ValueError("reconciliation occurrence is absent")
    index = positions[occurrence - 1]
    if (correction.get("acoustic_word_index") != index
            or correction.get("dtw_center_s") != heard[index]["center"]):
        raise ValueError("reconciliation occurrence or acoustic center differs")
    revised = [dict(word) for word in heard]
    revised[index]["text"] = "an"
    # acoustic_groups still compares every reconciled token with the locked script.
    return revised, dict(data, evidence_sha256=digest(Path(path)),
                         limitation="Retained provider transcript; no fresh listening or phoneme measurement.")
