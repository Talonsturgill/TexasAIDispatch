#!/usr/bin/env python3
"""Explicit loudness mastering, with measured dynamics and unchanged duration."""
import json
import subprocess
import tempfile
import wave
from pathlib import Path
from preflight_animatic import FFMPEG
from production_quality import policy, audio_measurement, audio_problems
from vo_soundcheck import TARGET_LUFS

def master(path):
    before = audio_measurement(path)
    with wave.open(str(path)) as w:
        rate, samples, channels = w.getframerate(), w.getnframes(), w.getnchannels()
    cfg = policy()
    with tempfile.TemporaryDirectory() as td:
        output = Path(td) / "master.wav"
        # Dynamic loudness control is explicit and reported. It changes gain, never timing.
        # The source mix has already refused clipping before this stage.
        compression = "acompressor=threshold=0.1259:ratio=3:attack=10:release=160:knee=2.828:makeup=1"
        filters = compression + f",loudnorm=I={TARGET_LUFS}:TP={cfg['master_true_peak_dbtp']}:LRA=11:linear=false:print_format=json"
        analysis = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(path),
                                   "-vn", "-af", filters, "-f", "null", "-"],
                                  capture_output=True, text=True, check=True)
        log = analysis.stderr
        measured = json.loads(log[log.rfind("{"):log.rfind("}") + 1])
        filters += (f":measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
                    f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
                    f":offset={measured['target_offset']}")
        result = subprocess.run([FFMPEG, "-v", "info", "-y", "-i", str(path), "-af", filters,
                                 "-ar", str(rate), "-ac", str(channels), "-c:a", "pcm_s16le", str(output)],
                                capture_output=True, text=True, check=True)
        with wave.open(str(output)) as w:
            if (w.getframerate(), w.getnframes(), w.getnchannels()) != (rate, samples, channels):
                raise ValueError("mastering changed the sample count, rate or channels")
        errors = audio_problems(output)
        if errors:
            raise ValueError("; ".join(errors) + " " + str(audio_measurement(output)))
        after = audio_measurement(output)
        log = result.stderr
        measurement = json.loads(log[log.rfind("{"):log.rfind("}") + 1])
        path.write_bytes(output.read_bytes())
    return {"method": "FFmpeg loudnorm dynamic gain control", "before": before, "after": after,
            "filter": filters, "measurement": measurement, "samples": samples,
            "sample_rate": rate, "time_stretch": 1.0, "limiter": True}
