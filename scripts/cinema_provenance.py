"""Verify archived render dependencies in the recorded producer environment.

Cache lookup remains host-specific in cinema_cache. Archive verification reconstructs
that exact key using current content and the original producer environment.
"""
import json
import re
from pathlib import Path
import cinema_cache as cache


def binding_problems(board_path, proof, mix=None):
    board_path = Path(board_path)
    try:
        from metadata_continuation import baseline
        board_path = baseline(board_path) or board_path
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return ["cinematic metadata continuation invalid: " + str(exc)]
    record = proof.get("reuse")
    if not record or "render_environment" not in record:
        # Historical proofs retain their original contract. New proofs record provenance.
        return cache.binding_problems(board_path, proof, mix)
    environment = record["render_environment"]
    if (not isinstance(environment, list) or len(environment) != 3
            or not all(isinstance(x, str) and x.strip() for x in environment)
            or (environment[2] != "managed-pinned-browser"
                and re.fullmatch(r"[0-9a-f]{64}", environment[2]) is None)):
        return ["invalid recorded render environment"]
    if record.get("version") != cache.SCHEMA:
        return ["unknown cinematic reuse contract"]

    def picture_key(frames):
        recipe = cache.picture_recipe(board_path, frames)
        recipe["environment"] = environment
        return cache.digest_json(recipe)

    board = json.loads(board_path.read_text())
    frames = cache.hero_frames(board)
    errors = []
    if record.get("hero_picture_key") != picture_key(frames):
        errors.append("hero render dependencies changed")
    if mix is not None and record.get("hero_audio_key") != cache.audio_segment(mix, frames):
        errors.append("hero audible samples changed")
    expected = {
        sid: [{kind: cache.digest_json({"picture": picture_key([frame, frame]),
                                        "without_stage": kind == "without_stage"})
               for kind in ("normal", "without_stage")} for frame in times]
        for sid, times in cache.sample_frames(board).items()
    }
    if record.get("sample_keys") != expected:
        errors.append("cinematic stage sample dependencies changed")
    return errors
