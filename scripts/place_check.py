#!/usr/bin/env python3
"""place_check.py: a current film stands in its county's region, and its episode lets it show.

WHY THIS EXISTS

PlaceStage (video-engine/src/modern/PlaceStage.tsx) draws each scene's region behind the episode:
outdoors the region's plate fills the frame, indoors it is outside a window in the back wall. That
is only worth anything if a viewer can see it, and every episode is authored new for its story. An
episode that paints a full-frame background of its own, as both episodes on the route did before
October 9th, 2026, hides the region completely, and the film looks exactly as it did when place was
the show's weakest axis. No board field and no code review says so. A render does.

So this renders the film's own frames with the plate replaced by solid magenta (the board's
`__placeProbe`), one still per shot at the point a viewer is most likely to be looking, and counts
the magenta left in the finished frame. A shot that shows less than PLACE_MIN_SHARE of its frame
as region fails, and names the shot. Overhead shots look down at a floor, where no horizon could
show, and source scenes show a source's own picture, so neither is held to it.

It also checks what needs no render: that the plates' manifest holds a plate for every scene's
region, so a story in a region nobody baked fails here rather than throwing in the renderer.

The stage is on for boards dated from the manifest's effective date and for a board that opts in
with its version; for any other board this passes and says the stage is off.

    place_check.py --board out/dispatch/storyboard.json            plates exist for every scene
    place_check.py --board out/dispatch/storyboard.json --render   and the region shows in every shot
    place_check.py --board experiments/modern-film-2026-10-07/board-a.json --opt-in --render
                                                                   an older film, put on the stage in memory
    place_check.py --self-test

Exit 0 clean, 1 a check failed, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "video-engine"
MANIFEST = ENGINE / "src" / "modern" / "placePlates.json"
REPORT = REPO / "out" / "dispatch" / "place_check.json"

# A shot must show at least this share of its frame as region. Measured on October 9th, 2026 with
# both films on the route put on the stage: the October 7th cooling film showed 0.135 to 0.219 of
# every frame and the October 8th fly film 0.156 to 0.318, the lowest being a wide interior, whose
# window is about a quarter of the frame with the units in front of it. The October 7th film with
# its old full-frame wall put back showed 0.000 in every shot.
PLACE_MIN_SHARE = 0.05
EXEMPT_STRATEGIES = {"sourcePicture", "sourceFootage"}
EXEMPT_FRAMINGS = {"overhead"}
# A diagram or a document is drawn on plain wall when its episode lists the view in `wall_views`
# (config/modern_episode_registry.json). No more than this share of a film's shots may be, so a
# film can't step out of its place by listing every view.
WALL_SHARE_MAX = 0.4
REGISTRY = REPO / "config" / "modern_episode_registry.json"
SHOT_POINT = 0.6          # how far into a shot the probe still is taken


def load_manifest(path: Path = MANIFEST) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def active(board: dict, policy: dict) -> bool:
    """PlaceStage.placeActive, from the same manifest numbers."""
    if (board.get("place") or {}).get("version") == policy["version"]:
        return True
    date = str(board.get("date") or "")
    return len(date) >= 10 and date[:4].isdigit() and date >= policy["effective_date"]


def county_name(c) -> str:
    return re.sub(r"\s+county$", "", str(c or "").strip(), flags=re.I).lower()


def plate_for(scene: dict, manifest: dict) -> tuple[str | None, str | None]:
    """PlaceStage.plateFor, the same rule: a named place_plate if the plate lists the county, else the
    county's own plate, else the region's. Returns the plate id, or None and the reason."""
    plates = manifest["plates"]
    region, county = scene.get("region"), county_name(scene.get("county"))
    in_region = sorted((p for p in plates.values() if p["region"] == region), key=lambda p: p["id"])
    if not in_region:
        return None, f"no place plate for region {region!r}; bake one with scripts/place_bake.py"
    named = scene.get("place_plate")
    if named:
        p = plates.get(named)
        if not p or p["region"] != region:
            return None, f"place_plate {named!r} is not a {region} plate"
        scope = [county_name(c) for c in (p.get("counties") or []) + (p.get("also") or [])]
        if scope and county not in scope:
            return None, f"place_plate {named!r} is not for {scene.get('county')} County"
        return named, None
    own = next((p for p in in_region if county in [county_name(c) for c in p.get("counties") or []]), None)
    base = next((p for p in in_region if not p.get("counties") and not p.get("also")), None)
    if not (own or base):
        return None, f"region {region} has no plate of its own"
    return (own or base)["id"], None


def static_problems(board: dict, manifest: dict) -> list[str]:
    out = []
    for s in board.get("scenes", []):
        pid, why = plate_for(s, manifest)
        if pid is None:
            out.append(f"scene {s.get('id')}: {why}")
    return out


def wall_views(board: dict, registry: dict) -> set[str]:
    ep = (board.get("film_direction") or {}).get("episode")
    return set((registry.get("episodes", {}).get(ep) or {}).get("wall_views") or [])


def probed_shots(board: dict, walls: set[str] = frozenset()) -> list[dict]:
    """Every shot a viewer should see the region in, with the frame its probe still is taken at."""
    scenes = {s["id"]: s for s in board.get("scenes", [])}
    shots = []
    for shot in (board.get("film_direction") or {}).get("shots", []):
        scene = scenes.get(shot.get("scene_id"), {})
        exempt = shot.get("framing") in EXEMPT_FRAMINGS or scene.get("camera_strategy") in EXEMPT_STRATEGIES
        frame = int((shot["start_s"] + shot["duration_s"] * SHOT_POINT) * 30)
        shots.append({"id": shot["id"], "scene_id": shot["scene_id"], "framing": shot.get("framing"),
                      "view": shot.get("view"), "frame": frame, "exempt": exempt,
                      "wall": not exempt and shot.get("view") in walls})
    return shots


def wall_problems(board: dict, registry: dict, shots: list[dict]) -> list[str]:
    ep = (board.get("film_direction") or {}).get("episode")
    entry = registry.get("episodes", {}).get(ep) or {}
    walls, washes = set(entry.get("wall_views") or []), set(entry.get("wash_views") or [])
    out = [f"wall view {v!r} is not one of episode {ep}'s views" for v in sorted(walls - set(entry.get("views") or []))]
    out += [f"wash view {v!r} is not one of episode {ep}'s views" for v in sorted(washes - set(entry.get("views") or []))]
    out += [f"view {v!r} is listed as both a wall view and a wash view; it is one or the other" for v in sorted(walls & washes)]
    held = [s for s in shots if not s["exempt"]]
    on_wall = [s for s in held if s["wall"]]
    if held and len(on_wall) / len(held) > WALL_SHARE_MAX:
        out.append(f"{len(on_wall)} of {len(held)} shots are wall views, over {WALL_SHARE_MAX:.0%}: a film stands in "
                   f"its place, and only its diagrams and documents step out of it")
    return out


def probe_share(rgb: np.ndarray) -> float:
    """The share of a frame still showing the probe's solid magenta."""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return float(np.mean((r >= 230) & (g <= 40) & (b >= 230)))


def judge(shots: list[dict], shares: dict[str, float]) -> list[str]:
    fails = []
    for s in shots:
        if s["exempt"] or s.get("wall"):
            continue
        share = shares.get(s["id"])
        if share is None:
            fails.append(f"shot {s['id']}: no probe frame was rendered")
        elif share < PLACE_MIN_SHARE:
            fails.append(f"shot {s['id']} ({s['framing']} {s['view']}): the region shows on {share:.3f} of the frame, "
                         f"under {PLACE_MIN_SHARE}. The episode covers its place: leave its background open "
                         f"and draw the room's floor and props in front of the stage")
    return fails


def render_probes(board: dict, shots: list[dict], work: Path) -> dict[str, float]:
    props = dict(board, __placeProbe=True)
    props_path = work / "probe-props.json"
    props_path.write_text(json.dumps(props), encoding="utf-8")
    jobs = [{"kind": "still", "props": str(props_path), "frame": s["frame"], "output": str(work / f"{s['id']}.png")}
            for s in shots if not s["exempt"] and not s["wall"]]
    if not jobs:
        return {}
    spec = work / "batch.json"
    spec.write_text(json.dumps({"jobs": jobs}), encoding="utf-8")
    r = subprocess.run(["node", str(ENGINE / "scripts" / "render-batch.mjs"), str(spec)], cwd=ENGINE,
                       capture_output=True, text=True, env=dict(os.environ))
    if r.returncode != 0:
        raise RuntimeError("the probe render failed: " + (r.stderr or r.stdout).strip()[-600:])
    shares = {}
    for s in shots:
        out = work / f"{s['id']}.png"
        if not s["exempt"] and not s["wall"] and out.exists():
            shares[s["id"]] = round(probe_share(np.asarray(Image.open(out).convert("RGB"))), 4)
    return shares


def check(board_path: Path, render: bool, report: Path | None = REPORT, opt_in: bool = False) -> tuple[int, list[str]]:
    board = json.loads(board_path.read_text(encoding="utf-8"))
    manifest = load_manifest()
    policy = manifest["policy"]
    if opt_in:                     # put an older film on the stage, as the proofs and CI do
        board["place"] = {"version": policy["version"]}
    if not active(board, policy):
        return 0, [f"place_check: the stage is off for this board (dated {board.get('date')!r}, before "
                   f"{policy['effective_date']}, and no {policy['version']} opt-in)"]
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    shots = probed_shots(board, wall_views(board, registry))
    lines = static_problems(board, manifest) + wall_problems(board, registry, shots)
    shares: dict[str, float] = {}
    if render and not lines:
        # out/ is ignored by git, so a fresh checkout has none until something makes it
        (REPO / "out").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=REPO / "out") as td:
            shares = render_probes(board, shots, Path(td))
        lines += judge(shots, shares)
    if report:
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps({"schema": "dispatch-place-check/1", "board": str(board_path),
                                      "min_share": PLACE_MIN_SHARE, "rendered": render,
                                      "shots": [dict(s, share=shares.get(s["id"])) for s in shots],
                                      "problems": lines}, indent=1) + "\n", encoding="utf-8")
    if lines:
        return 1, [f"FAIL {x}" for x in lines]
    measured = [shares[k] for k in shares]
    tail = f", region on {min(measured):.3f} to {max(measured):.3f} of each frame" if measured else ""
    return 0, [f"place_check: ok, {len(board.get('scenes', []))} scenes have plates{tail}"]


def self_test() -> int:
    fails: list[str] = []

    def ok(cond, what):
        if not cond:
            fails.append(what)

    policy = {"version": "place-plates-v2", "effective_date": "2026-10-10"}
    ok(not active({"date": "2026-10-08"}, policy), "a film dated before the effective date was put on the stage")
    ok(active({"date": "2026-10-10"}, policy), "a film dated on the effective date was left off the stage")
    ok(active({"date": "2026-10-08", "place": {"version": "place-plates-v2"}}, policy), "an opt-in was ignored")
    ok(not active({"date": "draft"}, policy), "an undated board was put on the stage")
    man = {"plates": {"gulf-wide": {"id": "gulf-wide", "region": "gulf"},
                      "gulf-houston": {"id": "gulf-houston", "region": "gulf", "counties": ["Harris"]},
                      "gulf-shipchannel": {"id": "gulf-shipchannel", "region": "gulf", "also": ["Harris", "Galveston"]}}}
    ok(not static_problems({"scenes": [{"id": "s1", "region": "gulf"}]}, man), "a baked region failed")
    ok(static_problems({"scenes": [{"id": "s1", "region": "trans_pecos"}]}, man), "an unbaked region passed")
    ok(plate_for({"region": "gulf", "county": "Harris County"}, man)[0] == "gulf-houston", "Harris did not get its own plate")
    ok(plate_for({"region": "gulf", "county": "Matagorda"}, man)[0] == "gulf-wide", "Matagorda did not get the region's")
    ok(plate_for({"region": "gulf", "county": "Harris", "place_plate": "gulf-shipchannel"}, man)[0] == "gulf-shipchannel",
       "a ship channel story in Harris could not name the refineries")
    ok(plate_for({"region": "gulf", "county": "Cameron", "place_plate": "gulf-shipchannel"}, man)[0] is None,
       "Cameron County was given the ship channel")
    ok(plate_for({"region": "gulf", "county": "Harris", "place_plate": "nope"}, man)[0] is None, "an unknown plate passed")
    frame = np.zeros((100, 100, 3), dtype=np.uint8)
    frame[:30, :] = [255, 0, 255]
    ok(abs(probe_share(frame) - 0.3) < 1e-9, "probe share miscounted")
    frame[:30, :] = [255, 64, 255]                 # a magenta the episode tinted is not the region showing
    ok(probe_share(frame) == 0.0, "tinted probe counted as region")
    board = {"scenes": [{"id": "s1", "camera_strategy": "dollyThrough"}, {"id": "s2", "camera_strategy": "sourcePicture"}],
             "film_direction": {"shots": [
                 {"id": "a", "scene_id": "s1", "framing": "wide", "start_s": 0, "duration_s": 2},
                 {"id": "b", "scene_id": "s1", "framing": "overhead", "start_s": 2, "duration_s": 2},
                 {"id": "c", "scene_id": "s2", "framing": "close", "start_s": 4, "duration_s": 2}]}}
    shots = probed_shots(board)
    ok([s["exempt"] for s in shots] == [False, True, True], f"exemptions wrong: {shots}")
    reg = {"episodes": {"e": {"views": ["v1", "v2"], "wall_views": ["v2"]}}}
    film = {"film_direction": {"episode": "e", "shots": [
        {"id": f"s{i}", "scene_id": "s1", "framing": "wide", "view": v, "start_s": i, "duration_s": 1}
        for i, v in enumerate(["v1", "v2", "v1", "v1", "v1"])]}, "scenes": [{"id": "s1"}]}
    fs = probed_shots(film, wall_views(film, reg))
    ok([s["wall"] for s in fs] == [False, True, False, False, False], f"wall views wrong: {fs}")
    ok(not wall_problems(film, reg, fs), "one wall view in five was refused")
    ok(not judge(fs, {"s0": .2, "s2": .2, "s3": .2, "s4": .2}), "a wall view was held to the window's share")
    heavy = json.loads(json.dumps(film))
    for sh in heavy["film_direction"]["shots"][:3]:
        sh["view"] = "v2"
    ok(wall_problems(heavy, reg, probed_shots(heavy, wall_views(heavy, reg))), "three wall views in five passed")
    stray = {"episodes": {"e": {"views": ["v1"], "wall_views": ["nope"]}}}
    ok(wall_problems(film, stray, fs), "a wall view the episode doesn't have passed")
    ok(wall_problems(film, {"episodes": {"e": {"views": ["v1", "v2"], "wash_views": ["nope"]}}}, fs), "a stray wash view passed")
    ok(wall_problems(film, {"episodes": {"e": {"views": ["v1", "v2"], "wall_views": ["v2"], "wash_views": ["v2"]}}}, fs),
       "a view both on the wall and in the wash passed")
    ok(shots[0]["frame"] == 36, f"probe frame wrong: {shots[0]['frame']}")
    ok(not judge(shots, {"a": 0.2}), "a shot showing its region failed")
    ok(judge(shots, {"a": 0.01}), "a covered shot passed")
    ok(judge(shots, {}), "a shot with no probe frame passed")
    if fails:
        print("place_check self-test FAILED:")
        for f in fails:
            print("  " + f)
        return 1
    print("place_check self-test: ok")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--board", type=Path, default=REPO / "out" / "dispatch" / "storyboard.json")
    ap.add_argument("--render", action="store_true", help="render a probe still per shot and measure it")
    ap.add_argument("--report", type=Path, default=REPORT)
    ap.add_argument("--opt-in", action="store_true", help="put a film dated before the stage on it, in memory")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        code, lines = check(a.board, a.render, a.report, a.opt_in)
    except (OSError, ValueError, KeyError, RuntimeError) as exc:
        print(f"place_check: could not run: {exc}")
        return 2
    print("\n".join(lines))
    return code


if __name__ == "__main__":
    sys.exit(main())
