"""Conservative native render storage planning, without changing media quality."""
import argparse
import json
import math
import shutil
from pathlib import Path

def estimate(board):
    from run_controller import board_runtime
    frames = math.ceil(board_runtime(board) * 30)
    # Full native RGBA for every frame exceeds the compressed PNG working set.
    # Proof and delivery renders run sequentially, while retained MP4s are small.
    raw_gib = frames * 1080 * 1920 * 4 / (1024 ** 3)
    return {"native_width": 1080, "native_height": 1920, "fps": 30,
            "frames": frames, "uncompressed_frame_gib": round(raw_gib, 3),
            "reserve_gib": 5, "required_free_gib": math.ceil(raw_gib + 5)}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--board", default="out/dispatch/storyboard.json")
    p.add_argument("--out", default="out/dispatch/native-headroom.json")
    a = p.parse_args()
    board_path = Path(a.board)
    board = json.loads(board_path.read_text())
    result = estimate(board)
    result.update(schema="dispatch_native_headroom/1",
                  free_gib=round(shutil.disk_usage(board_path.parent).free/(1024**3), 3),
                  quality="Native PNG capture and CRF16 remain required.")
    result["pass"] = result["free_gib"] >= result["required_free_gib"]
    Path(a.out).write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1

if __name__ == "__main__":
    raise SystemExit(main())
