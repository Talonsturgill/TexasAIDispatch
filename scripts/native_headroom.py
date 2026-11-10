"""Conservative native render storage planning, without changing media quality."""
import argparse
import json
import math
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

def estimate(board):
    from run_controller import board_runtime
    frames = math.ceil(board_runtime(board) * 30)
    # Full native RGBA for every frame exceeds the compressed PNG working set.
    # Proof and delivery renders run sequentially, while retained MP4s are small.
    raw_gib = frames * 1080 * 1920 * 4 / (1024 ** 3)
    return {"native_width": 1080, "native_height": 1920, "fps": 30,
            "frames": frames, "uncompressed_frame_gib": round(raw_gib, 3),
            "reserve_gib": 5, "required_free_gib": math.ceil(raw_gib + 5)}

def capture_estimate(root, board_paths, command=None):
    """Advisory planning only; this neither reserves nor authorizes a capture."""
    boards = [(Path(path), json.loads(Path(path).read_text())) for path in board_paths]
    result = max((estimate(board) for _, board in boards), key=lambda p: p['required_free_gib'])
    if command is not None:
        from bounded_capture import plan
        profile = plan(root, [command], boards)
        if profile is not None:
            result = {**result, 'required_free_gib': profile['required_free_gib'],
                      'storage_profile': profile, 'advisory_only': True}
    return result


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--board", action="append", help="exact board; repeat for both opening treatments")
    p.add_argument("--capture-command", help="exact upcoming wrapped operator; advisory source-proven storage planning only")
    p.add_argument("--out", default="out/dispatch/native-headroom.json")
    a = p.parse_args(argv)
    board_paths = [Path(path) for path in (a.board or ["out/dispatch/storyboard.json"])]
    board_path = board_paths[0]
    result = capture_estimate(REPO, board_paths, a.capture_command)
    result.update(schema="dispatch_native_headroom/1",
                  free_gib=round(shutil.disk_usage(board_path.parent).free/(1024**3), 3),
                  quality="Native PNG capture and CRF16 remain required.")
    result["pass"] = result["free_gib"] >= result["required_free_gib"]
    Path(a.out).write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1

if __name__ == "__main__":
    raise SystemExit(main())
