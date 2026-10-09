"""Batch existing inexpensive picture gates, preserving every real output. No paid work."""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import shlex
import time
import uuid
from pathlib import Path
import modern_film

REPO = Path(__file__).resolve().parents[1]


def checks(board, claims):
    b, c = str(Path(board).resolve()), str(Path(claims).resolve())
    rows = [("registry", ["python", "scripts/registry_check.py"])]
    for name in ("storyboard_check", "watchability_check", "documentary_check", "shot_coherence",
                 "staging_check", "board_scale_check", "floor_check"):
        rows.append((name, ["python", "scripts/" + name + ".py", "--board", b]))
    rows += [("script_evidence", ["python", "scripts/script_evidence_check.py", "--board", b, "--claims", c, "--planning-only"]),
             ("super_evidence", ["python", "scripts/super_evidence_check.py", "--board", b, "--claims", c]),
             ("caption_fit", ["node", "video-engine/tests/caption_board_fit.mjs", "--board", b])]
    if modern_film.required(json.loads(Path(board).read_text())):
        rows += [("modern_film", ["python", "scripts/modern_film.py", "--board", b, "--claims", c]),
                 ("story_art", ["python", "scripts/story_art.py", "--board", b, "verify"])]
    return rows


def run_checks(board, claims, out):
    tasks = checks(board, claims)
    directory = Path(out) / str(uuid.uuid4())
    directory.mkdir(parents=True, exist_ok=False)
    rows = []
    for name, args in tasks:
        started = time.monotonic()
        wrapped = ["bash", str(REPO / "scripts/run_with_env.sh"), "bash", "-lc",
                   "cd " + shlex.quote(str(REPO)) + " && exec " + shlex.join(args)]
        result = subprocess.run(wrapped,
                                cwd=REPO, capture_output=True)
        log = directory / (name + ".log")
        log.write_bytes(result.stdout + result.stderr)
        rows.append({"gate": name, "command": args, "exit_code": result.returncode,
                     "elapsed_ms": round((time.monotonic() - started) * 1000),
                     "log": str(log.resolve()), "log_sha256": hashlib.sha256(log.read_bytes()).hexdigest()})
    report = {"schema": "dispatch_picture_precheck/1", "pass": all(row["exit_code"] == 0 for row in rows),
              "checks": rows, "approval": False,
              "note": "Mechanical gate outputs only. Independent code, phone, native, audiovisual and shipment proof remain required."}
    (directory / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report, directory


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--board", type=Path, required=True)
    p.add_argument("--claims", type=Path, required=True)
    p.add_argument("--out", type=Path, required=True)
    a = p.parse_args()
    try:
        report, directory = run_checks(a.board, a.claims, a.out)
        failed = [row["gate"] for row in report["checks"] if row["exit_code"] != 0]
        print(json.dumps({"pass": report["pass"], "checks": len(report["checks"]),
                          "failed": failed, "evidence": str(directory.resolve())}))
        return int(bool(failed))
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print("picture precheck refused: " + str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
