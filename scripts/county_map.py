#!/usr/bin/env python3
"""county_map.py: the Texas county map the film's locator draws, computed from the committed counties.

WHY THIS EXISTS

The place stage puts a county on a Texas map for a few seconds near the start of a current film, so
a viewer knows where the story stands before the picture has to prove it. A map drawn by hand is a
claim about a border nobody checked. This one is projected from assets/geo/tx-counties.topo.json
(us-atlas counties-10m, from the Census Bureau's cartographic boundary files, the same file
config/county_regions.json is computed from) and written to video-engine/src/modern/texasCounties.json,
which the locator imports. CI rebuilds it and requires the committed bytes, so a file edited by hand
or left behind by a changed source fails.

METHOD

  - The Texas Statewide Mapping System's Lambert conformal conic, on a sphere: standard parallels
    27 25' N and 34 55' N, origin 31 10' N, 100 W. It is the projection Texas agencies draw the
    state in, so the outline has the shape a Texan knows.
  - Arcs, not rings, are simplified (Douglas-Peucker, SIMPLIFY in map units), so two counties that
    share a border still share it exactly after simplifying.
  - The state's outline is every arc only one county uses, stitched end to end into rings. The
    longest ring is the outline, started at the Panhandle's northwest corner and drawn clockwise,
    which is the order the locator draws it in. The others are the barrier islands.
  - A county's label point is the area centroid of its largest ring.

    county_map.py            verify the committed map equals a fresh build (CI)
    county_map.py --build    write it
    county_map.py --self-test

Exit 0 clean, 1 a check failed, 2 the inputs could not be read.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TOPO = REPO / "assets" / "geo" / "tx-counties.topo.json"
OUT = REPO / "video-engine" / "src" / "modern" / "texasCounties.json"

MAP_W = 400.0        # the map's width in its own units; the locator scales it
PAD = 4.0
SIMPLIFY = 0.45      # Douglas-Peucker tolerance in map units, a third of a pixel on the locator's card
DP = 1               # decimals kept in the paths
LCC = {"lat1": 27 + 25 / 60, "lat2": 34 + 55 / 60, "lat0": 31 + 10 / 60, "lon0": -100.0}


def lcc(lon: float, lat: float) -> tuple[float, float]:
    """Spherical Lambert conformal conic, Texas Statewide Mapping System parameters. y grows north."""
    r = math.radians
    p1, p2, p0 = r(LCC["lat1"]), r(LCC["lat2"]), r(LCC["lat0"])
    t = lambda p: math.tan(math.pi / 4 + p / 2)
    n = math.log(math.cos(p1) / math.cos(p2)) / math.log(t(p2) / t(p1))
    F = math.cos(p1) * t(p1) ** n / n
    rho, rho0 = F / t(r(lat)) ** n, F / t(p0) ** n
    th = n * r(lon - LCC["lon0"])
    return rho * math.sin(th), rho0 - rho * math.cos(th)


def douglas_peucker(pts: list[tuple[float, float]], tol: float) -> list[tuple[float, float]]:
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = pts[a], pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        best, at = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if L else math.hypot(px - ax, py - ay)
            if d > best:
                best, at = d, i
        if best > tol:
            keep[at] = True
            stack += [(a, at), (at, b)]
    return [p for p, k in zip(pts, keep) if k]


def ring_area(ring: list[tuple[float, float]]) -> float:
    """Shoelace area in screen axes (y down): positive is clockwise as seen."""
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1])) / 2.0


def centroid(ring: list[tuple[float, float]]) -> tuple[float, float]:
    a = ring_area(ring)
    if abs(a) < 1e-12:
        return sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)
    cx = sum((x0 + x1) * (x0 * y1 - x1 * y0) for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))
    cy = sum((y0 + y1) * (x0 * y1 - x1 * y0) for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]))
    return cx / (6 * a), cy / (6 * a)


def inside(p: tuple[float, float], ring: list[tuple[float, float]]) -> bool:
    x, y, hit = p[0], p[1], False
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0:
            hit = not hit
    return hit


def interior_point(ring: list[tuple[float, float]], y: float) -> tuple[float, float]:
    """The middle of the widest stretch of the ring's inside along the row y."""
    xs = sorted((x1 - x0) * (y - y0) / (y1 - y0) + x0 for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1])
                if (y0 > y) != (y1 > y))
    spans = [(xs[i + 1] - xs[i], (xs[i] + xs[i + 1]) / 2) for i in range(0, len(xs) - 1, 2)]
    return (max(spans)[1], y) if spans else ring[0]


def fmt(v: float) -> str:
    s = f"{v:.{DP}f}"
    return "0.0" if s == "-0.0" else s


def path(rings: list[list[tuple[float, float]]]) -> str:
    return "".join("M" + "L".join(f"{fmt(x)},{fmt(y)}" for x, y in r) + "Z" for r in rings)


def build(topo_path: Path = TOPO) -> dict:
    raw = topo_path.read_bytes()
    topo = json.loads(raw)
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    # each arc: its quantised integer points (exact keys for stitching) and projected points
    qarcs, parcs = [], []
    for arc in topo["arcs"]:
        x = y = 0
        q, pr = [], []
        for dx, dy in arc:
            x += dx
            y += dy
            q.append((x, y))
            pr.append(lcc(x * sx + tx, y * sy + ty))
        qarcs.append(q)
        parcs.append(pr)
    geoms = topo["objects"]["counties"]["geometries"]
    used: dict[int, int] = {}
    for g in geoms:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        for poly in polys:
            for ring in poly:
                for i in ring:
                    k = i if i >= 0 else ~i
                    used[k] = used.get(k, 0) + 1
    # fit the projection into MAP_W wide, y down
    xs = [p[0] for k in used for p in parcs[k]]
    ys = [p[1] for k in used for p in parcs[k]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    s = (MAP_W - 2 * PAD) / (x1 - x0)
    H = round((y1 - y0) * s + 2 * PAD, 1)
    to_map = lambda p: (PAD + (p[0] - x0) * s, PAD + (y1 - p[1]) * s)
    simple = {k: douglas_peucker([to_map(p) for p in parcs[k]], SIMPLIFY) for k in used}

    def ring_pts(idx: list[int]) -> list[tuple[float, float]]:
        out: list[tuple[float, float]] = []
        for i in idx:
            pts = simple[i] if i >= 0 else simple[~i][::-1]
            out += pts if not out else pts[1:]
        return out[:-1] if len(out) > 1 and out[0] == out[-1] else out

    counties = {}
    for g in geoms:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        rings = [ring_pts(r) for poly in polys for r in poly]
        rings = [r for r in rings if len(r) >= 3]
        big = max(rings, key=lambda r: abs(ring_area(r)))
        cx, cy = centroid(big)
        if not inside((cx, cy), big):                # a crescent's centroid can fall outside it
            cx, cy = interior_point(big, cy)
        counties[g["properties"]["name"]] = {"fips": str(g["id"]), "d": path(rings),
                                             "label": [round(cx, 1), round(cy, 1)]}
    # the outline: arcs used once, stitched by their exact quantised end points
    starts: dict[tuple[int, int], list[int]] = {}
    exterior = [k for k, c in used.items() if c == 1]
    for k in exterior:
        starts.setdefault(qarcs[k][0], []).append(k)
        starts.setdefault(qarcs[k][-1], []).append(~k)
    left = set(exterior)
    rings = []
    while left:
        k0 = min(left)
        left.discard(k0)
        seq = [k0]
        end = qarcs[k0][-1]
        while end != qarcs[k0][0]:
            nxt = [c for c in starts.get(end, []) if (c if c >= 0 else ~c) in left]
            if not nxt:
                break
            c = nxt[0]
            left.discard(c if c >= 0 else ~c)
            seq.append(c)
            end = qarcs[c][-1] if c >= 0 else qarcs[~c][0]
        rings.append(ring_pts(seq))
    rings.sort(key=lambda r: -abs(ring_area(r)))
    outline = rings[0]
    if ring_area(outline) < 0:
        outline = outline[::-1]
    start = min(range(len(outline)), key=lambda i: outline[i][0] + outline[i][1])
    outline = outline[start:] + outline[:start]
    islands = [r if ring_area(r) > 0 else r[::-1] for r in rings[1:]]
    return {
        "_why": ("The Texas county map the place stage's locator draws. Projected from assets/geo/tx-counties.topo.json "
                 "by scripts/county_map.py and checked against a fresh build in CI; never edited by hand."),
        "source": {"file": TOPO.relative_to(REPO).as_posix(), "sha256": hashlib.sha256(raw).hexdigest()},
        "projection": dict(LCC, name="Texas Statewide Mapping System, Lambert conformal conic, spherical"),
        "simplify": SIMPLIFY, "width": MAP_W, "height": H,
        "outline": path([outline]), "islands": path(islands) if islands else "",
        "counties": {k: counties[k] for k in sorted(counties)},
    }


def dump(doc: dict) -> str:
    return json.dumps(doc, separators=(",", ":"), ensure_ascii=True) + "\n"


def self_test() -> int:
    fails = []

    def ok(cond, what):
        if not cond:
            fails.append(what)

    # the projection puts Texas where Texas is
    el_paso, houston, amarillo, brownsville = lcc(-106.49, 31.76), lcc(-95.37, 29.76), lcc(-101.83, 35.22), lcc(-97.5, 25.9)
    ok(el_paso[0] < houston[0], "El Paso projected east of Houston")
    ok(amarillo[1] > brownsville[1], "Amarillo projected south of Brownsville")
    ok(abs(lcc(LCC["lon0"], LCC["lat0"])[0]) < 1e-12 and abs(lcc(LCC["lon0"], LCC["lat0"])[1]) < 1e-12,
       "the origin did not project to zero")
    # simplification keeps the ends and drops a straight run
    line = [(float(i), 0.0) for i in range(10)]
    ok(douglas_peucker(line, 0.1) == [(0.0, 0.0), (9.0, 0.0)], "a straight run kept its middle")
    bent = [(0.0, 0.0), (5.0, 3.0), (10.0, 0.0)]
    ok(douglas_peucker(bent, 0.5) == bent, "a real bend was simplified away")
    sq = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    ok(ring_area(sq) > 0 and abs(centroid(sq)[0] - 5) < 1e-9 and inside((5, 5), sq) and not inside((15, 5), sq),
       "area, centroid or point-in-ring wrong on a square")
    if TOPO.exists():
        doc = build()
        ok(len(doc["counties"]) == 254, f"{len(doc['counties'])} counties, not 254")
        h = doc["counties"].get("Harris", {})
        ok(h.get("fips") == "48201", "Harris is not FIPS 48201")
        hx, hy = h.get("label", [0, 0])
        rx, ry = doc["counties"]["Reeves"]["label"]
        ok(hx > rx, "Harris labelled west of Reeves")
        ok(doc["outline"].startswith("M") and doc["outline"].endswith("Z"), "the outline is not a closed path")
        first = doc["outline"][1:].split("L")[0].split(",")
        ok(float(first[0]) < doc["width"] * 0.35 and float(first[1]) < doc["height"] * 0.1,
           f"the outline does not start at the Panhandle's northwest corner: {first}")
        ok(dump(build()) == dump(doc), "two builds differ")
    if fails:
        print("county_map self-test FAILED:")
        for f in fails:
            print("  " + f)
        return 1
    print("county_map self-test: ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if not TOPO.exists():
        print(f"county_map: {TOPO.relative_to(REPO)} is missing")
        return 2
    fresh = dump(build())
    if a.build:
        OUT.write_text(fresh, encoding="utf-8")
        print(f"county_map: wrote {OUT.relative_to(REPO)}, {len(fresh) // 1024} KB")
        return 0
    if not OUT.exists() or OUT.read_text(encoding="utf-8") != fresh:
        print(f"FAIL {OUT.relative_to(REPO)} differs from a fresh build of {TOPO.relative_to(REPO)}; "
              f"run scripts/county_map.py --build")
        return 1
    print("county_map: ok, the committed map is a fresh build")
    return 0


if __name__ == "__main__":
    sys.exit(main())
