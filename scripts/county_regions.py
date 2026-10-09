#!/usr/bin/env python3
"""county_regions.py: every Texas county's Gould vegetational areas, COMPUTED from polygons.

WHY THIS EXISTS

The first law of drawing Texas is that a scene's region comes from the story's county.
`config/county_regions.json` is what `ship_gate.py` checks a board against, and until October
9th, 2026 it was a hand-typed list of 80 counties "matched to county seats". Three things were
wrong with that, and each one cost the show on its weakest axis, place:

  1. ONE REGION PER COUNTY. Its own notes said "western Travis is hill_country" and "southern
     Bexar is south_texas", and the gate still failed any board that drew the true half of a
     straddling county. A rule that punishes the correct drawing teaches the run to draw the
     wrong one.
  2. UNKNOWN COUNTIES PASSED. 174 of 254 counties were absent, so a story there was "recorded"
     with whatever region the board claimed. The law had nothing behind it exactly where the
     show had never been.
  3. NOTHING WAS MEASURED. A typed region is a guess about a polygon nobody opened.

This script computes the table from the polygons instead. For every county it measures how much
of the county's area lies in each Gould region and writes the shares. The gate then accepts any
region holding at least ALLOW_SHARE of the county, so the west side of Travis can be the Hill
Country and an unknown county can no longer pass by default.

SOURCES (both recorded in the table with their digests)

  Regions: Texas Parks and Wildlife Department, "Gould Ecoregions" base layer, GouldRegions.zip.
           Geometry "created from map in Gould, F. W. 1975, updated by TPWD GIS Lab 1/09/2004".
           TPWD states it is not a surveyed product and makes no warranty of accuracy, which is
           why the gate tolerates a straddle rather than trusting a boundary to the mile.
           The raw polygons are NOT committed here. Their URL and sha256 are, so the table can
           be rebuilt and checked byte for byte by anyone who downloads the same file.
  Counties: us-atlas counties-10m (ISC), derived from US Census Bureau cartographic boundary
           files, committed at assets/geo/tx-counties.topo.json.

METHOD

Both layers are rasterised onto one grid of GRID_DEG degrees over Texas with an even-odd
scanline fill, so a hole in a ring is a hole. Each cell is weighted by the cosine of its
latitude, which makes a share a share of true area rather than of square degrees. A county's
share of a region is the weighted sum of its cells in that region over its classified cells.
Shares are rounded to SHARE_DP decimal places, half to even, which is Python's round(). Cells a
county has outside every Gould polygon (coastline slivers where the two drawings disagree) are
reported as `unclassified`, never assigned.

    county_regions.py                       verify the committed table (CI)
    county_regions.py --build --gould Z     recompute the table from GouldRegions.zip Z
    county_regions.py --lookup Travis       print one county's regions
    county_regions.py --self-test           prove the fill, the shares and the verifier

Exit 0 clean, 1 a check failed, 2 the inputs could not be read.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import struct
import sys
import zipfile
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[1]
TABLE = REPO / "config" / "county_regions.json"
COUNTIES_TOPO = REPO / "assets" / "geo" / "tx-counties.topo.json"

GOULD_URL = "https://tpwd.texas.gov/gis/data/baselayers/gouldecoregions-zip/at_download/file"
GOULD_PAGE = "https://tpwd.texas.gov/gis/data/baselayers/gouldecoregions-zip/view"

# A region must hold at least this share of a county's classified area before a board may set a
# scene there. Below it, a 1975 small-scale vegetation map and 1:10,000,000 county lines can't
# tell a real sliver from a drawing error, and TPWD itself says the layer is not surveyed.
ALLOW_SHARE = 0.10
GRID_DEG = 0.004          # about 440 m north to south; a typical county is thousands of cells
SHARE_DP = 3

# Gould's own names, as spelled in the TPWD attribute table, to the engine's RegionName.
# "Post Oak Savanah" is TPWD's spelling and is matched as written.
GOULD_TO_ENGINE = {
    "Piney Woods": "piney_woods",
    "Gulf Prairies": "gulf",
    "Post Oak Savanah": "post_oak",
    "Blackland Prairie": "blackland",
    "Cross Timbers": "cross_timbers",
    "South Texas Plains": "south_texas",
    "Edwards Plateau": "hill_country",
    "Rolling Plains": "rolling_plains",
    "High Plains": "high_plains",
    "Trans-Pecos": "trans_pecos",
}
ENGINE_REGIONS = tuple(GOULD_TO_ENGINE.values())


# ---------------------------------------------------------------------------------------------
# readers: a shapefile and a dBase table are small fixed binary formats, read here directly so
# the gate needs nothing beyond numpy.

def read_dbf(raw: bytes) -> list[dict]:
    n_rec, hdr_len, rec_len = struct.unpack("<IHH", raw[4:12])
    fields, off = [], 32
    while raw[off] != 0x0D:
        name = raw[off:off + 11].split(b"\0")[0].decode("ascii")
        fields.append((name, raw[off + 16]))
        off += 32
    rows = []
    for i in range(n_rec):
        rec = raw[hdr_len + i * rec_len: hdr_len + (i + 1) * rec_len]
        pos, row = 1, {}
        for name, length in fields:
            row[name] = rec[pos:pos + length].decode("latin-1").strip()
            pos += length
        rows.append(row)
    return rows


def read_shp_polygons(raw: bytes) -> list[list[np.ndarray]]:
    """Every record as a list of rings, each an (n, 2) array of lon/lat."""
    if struct.unpack(">i", raw[0:4])[0] != 9994:
        raise ValueError("not a shapefile")
    out, off = [], 100
    while off < len(raw):
        _, words = struct.unpack(">ii", raw[off:off + 8])
        body = raw[off + 8: off + 8 + 2 * words]
        off += 8 + 2 * words
        stype = struct.unpack("<i", body[0:4])[0]
        if stype == 0:
            out.append([])
            continue
        if stype != 5:
            raise ValueError(f"shape type {stype} is not a polygon")
        nparts, npoints = struct.unpack("<ii", body[36:44])
        parts = list(struct.unpack(f"<{nparts}i", body[44:44 + 4 * nparts])) + [npoints]
        pts = np.frombuffer(body, dtype="<f8", count=2 * npoints,
                            offset=44 + 4 * nparts).reshape(-1, 2)
        out.append([pts[parts[k]:parts[k + 1]] for k in range(nparts)])
    return out


def read_gould(zip_path: Path) -> tuple[list[tuple[str, list[np.ndarray]]], str]:
    raw = zip_path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = {Path(n).suffix.lower(): n for n in z.namelist()}
        rows = read_dbf(z.read(names[".dbf"]))
        polys = read_shp_polygons(z.read(names[".shp"]))
        prj = z.read(names[".prj"]).decode("ascii", "replace")
    if "GCS_North_American_1983" not in prj:
        raise ValueError(f"unexpected projection, the county layer is NAD83 lon/lat: {prj[:80]}")
    if len(rows) != len(polys):
        raise ValueError("attribute and shape record counts differ")
    feats = []
    for row, rings in zip(rows, polys):
        name = row.get("Name", "")
        if name not in GOULD_TO_ENGINE:
            raise ValueError(f"unknown Gould region name {name!r}")
        feats.append((GOULD_TO_ENGINE[name], rings))
    return feats, digest


def read_topo_counties(path: Path) -> list[tuple[str, str, list[np.ndarray]]]:
    """(fips, name, rings) for every county in a TopoJSON with a quantised transform."""
    topo = json.loads(path.read_text(encoding="utf-8"))
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        q = np.cumsum(np.asarray(arc, dtype=np.float64), axis=0)
        arcs.append(np.column_stack([q[:, 0] * sx + tx, q[:, 1] * sy + ty]))

    def ring(idx: list[int]) -> np.ndarray:
        pieces = []
        for k, i in enumerate(idx):
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pieces.append(a if k == 0 else a[1:])
        return np.vstack(pieces)

    out = []
    for g in topo["objects"]["counties"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        rings = [ring(r) for poly in polys for r in poly]
        out.append((str(g["id"]), g["properties"]["name"], rings))
    return out


# ---------------------------------------------------------------------------------------------
# the raster

class Grid:
    def __init__(self, west: float, south: float, east: float, north: float, step: float):
        self.west, self.north, self.step = west, north, step
        self.w = int(np.ceil((east - west) / step))
        self.h = int(np.ceil((north - south) / step))
        self.lat = north - (np.arange(self.h) + 0.5) * step
        self.lon = west + (np.arange(self.w) + 0.5) * step
        self.weight = np.cos(np.radians(self.lat))

    def fill(self, rings: list[np.ndarray]) -> np.ndarray:
        """Even-odd scanline fill of every ring together: a cell is inside when a ray from its
        centre crosses the boundary an odd number of times. Returns a boolean mask."""
        mask = np.zeros((self.h, self.w), dtype=bool)
        x1 = np.concatenate([r[:-1, 0] for r in rings] + [r[-1:, 0] for r in rings])
        y1 = np.concatenate([r[:-1, 1] for r in rings] + [r[-1:, 1] for r in rings])
        x2 = np.concatenate([r[1:, 0] for r in rings] + [r[:1, 0] for r in rings])
        y2 = np.concatenate([r[1:, 1] for r in rings] + [r[:1, 1] for r in rings])
        keep = y1 != y2
        x1, y1, x2, y2 = x1[keep], y1[keep], x2[keep], y2[keep]
        lo, hi = np.minimum(y1, y2), np.maximum(y1, y2)
        r0 = max(0, int(np.floor((self.north - hi.max()) / self.step)))
        r1 = min(self.h, int(np.ceil((self.north - lo.min()) / self.step)) + 1)
        for r in range(r0, r1):
            y = self.lat[r]
            hit = (lo <= y) & (y < hi)
            if not hit.any():
                continue
            xs = np.sort(x1[hit] + (y - y1[hit]) * (x2[hit] - x1[hit]) / (y2[hit] - y1[hit]))
            for a, b in zip(xs[0::2], xs[1::2]):
                c0 = int(np.ceil((a - self.west) / self.step - 0.5))
                c1 = int(np.ceil((b - self.west) / self.step - 0.5))
                if c1 > c0:
                    mask[r, max(c0, 0):min(c1, self.w)] = True
        return mask


def compute(regions: list[tuple[str, list[np.ndarray]]],
            counties: list[tuple[str, str, list[np.ndarray]]],
            step: float = GRID_DEG) -> dict[str, dict]:
    allpts = np.vstack([r for _, rings in regions for r in rings] +
                       [r for _, _, rings in counties for r in rings])
    pad = 2 * step
    grid = Grid(allpts[:, 0].min() - pad, allpts[:, 1].min() - pad,
                allpts[:, 0].max() + pad, allpts[:, 1].max() + pad, step)
    label = np.zeros((grid.h, grid.w), dtype=np.int8)
    for k, (_, rings) in enumerate(regions, start=1):
        label[grid.fill(rings)] = k
    names = [None] + [name for name, _ in regions]
    weight = np.repeat(grid.weight[:, None], grid.w, axis=1)
    out = {}
    for fips, name, rings in counties:
        inside = grid.fill(rings)
        if not inside.any():
            raise ValueError(f"county {name} ({fips}) covers no grid cell")
        lab, wt = label[inside], weight[inside]
        total = float(wt.sum())
        classified = float(wt[lab > 0].sum())
        acc: dict[str, float] = {}
        for k in np.unique(lab[lab > 0]):
            acc[names[k]] = acc.get(names[k], 0.0) + float(wt[lab == k].sum())
        if classified <= 0:
            raise ValueError(f"county {name} ({fips}) lies outside every Gould region")
        shares = {r: round(v / classified, SHARE_DP) for r, v in acc.items()}
        shares = {r: v for r, v in sorted(shares.items(), key=lambda kv: (-kv[1], kv[0])) if v > 0}
        out[name] = {"fips": fips, "shares": shares,
                     "unclassified": round((total - classified) / total, SHARE_DP),
                     "cells": int(inside.sum())}
    return out


def primary(shares: dict[str, float]) -> str:
    return sorted(shares.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def allowed(entry: dict) -> list[str]:
    """The regions a board may set in this county: every region at or over ALLOW_SHARE, and the
    primary even if a county is so evenly split that nothing reaches it."""
    shares = entry.get("shares") or {}
    if not shares:
        return [entry["region"]] if entry.get("region") else []
    keep = [r for r, v in shares.items() if v >= ALLOW_SHARE]
    p = primary(shares)
    return keep if p in keep else [p] + keep


def normalise(county: str) -> str:
    c = " ".join(str(county).replace("County", " ").split())
    return c.lower().replace(" ", "").replace(".", "").replace("'", "")


def find(table: dict, county: str) -> tuple[str | None, dict | None]:
    counties = table.get("counties") or {}
    if county in counties:
        return county, counties[county]
    want = normalise(county)
    for name, entry in counties.items():
        if normalise(name) == want:
            return name, entry
    return None, None


# ---------------------------------------------------------------------------------------------
# build and verify

HEADER = {
    "_why": ("The first law of drawing Texas is that the scene's region comes from the STORY'S "
             "COUNTY, never from what would look good. This table is what ship_gate.py checks a "
             "board against. Every share in it is COMPUTED by scripts/county_regions.py from "
             "TPWD's Gould ecoregion polygons and the Census county lines, never typed."),
    "_how_it_grows": ("It does not grow. All 254 counties are present. A correction is a rebuild "
                      "from a newer source file, recorded with that file's digest."),
    "_boundaries": ("A board may set a scene in any region holding at least allow_share of the "
                    "county. Straddles are data now: western Travis may be hill_country because "
                    "the polygons say part of Travis is."),
    "_source": "See source below. `seat` and `note` are older hand-written fields and are not computed.",
}


def build(zip_path: Path) -> dict:
    regions, gdigest = read_gould(zip_path)
    counties = read_topo_counties(COUNTIES_TOPO)
    shares = compute(regions, counties)
    old = json.loads(TABLE.read_text(encoding="utf-8")) if TABLE.exists() else {}
    old_counties = old.get("counties") or {}
    table = dict(HEADER)
    table["source"] = {
        "regions": {"publisher": "Texas Parks and Wildlife Department", "layer": "Gould Ecoregions",
                    "page": GOULD_PAGE, "url": GOULD_URL, "file": zip_path.name,
                    "sha256": gdigest, "bytes": zip_path.stat().st_size,
                    "credit": "Geometry created from map in Gould, F. W. 1975, updated by TPWD GIS "
                              "Lab 1/09/2004. Not a surveyed product."},
        "counties": {"file": "assets/geo/tx-counties.topo.json",
                     "sha256": hashlib.sha256(COUNTIES_TOPO.read_bytes()).hexdigest(),
                     "derived_from": "us-atlas counties-10m (ISC), from US Census Bureau "
                                     "cartographic boundary files"},
    }
    table["method"] = {"grid_degrees": GRID_DEG, "weight": "cos(latitude) per cell",
                       "fill": "even-odd scanline", "share_decimals": SHARE_DP,
                       "allow_share": ALLOW_SHARE}
    out = {}
    for name in sorted(shares):
        row = shares[name]
        entry = {"region": primary(row["shares"]), "fips": row["fips"], "shares": row["shares"],
                 "unclassified": row["unclassified"]}
        for keep in ("seat", "note"):
            if old_counties.get(name, {}).get(keep):
                entry[keep] = old_counties[name][keep]
        out[name] = entry
    table["counties"] = out
    return table


def verify(table: dict, check_files: bool = True) -> list[str]:
    bad = []
    counties = table.get("counties") or {}
    if len(counties) != 254:
        bad.append(f"{len(counties)} counties, Texas has 254")
    m = table.get("method") or {}
    if m.get("allow_share") != ALLOW_SHARE:
        bad.append(f"the table was built with allow_share {m.get('allow_share')}, the gate uses {ALLOW_SHARE}")
    src = (table.get("source") or {}).get("counties") or {}
    if check_files and src.get("sha256") != hashlib.sha256(COUNTIES_TOPO.read_bytes()).hexdigest():
        bad.append("assets/geo/tx-counties.topo.json changed since the table was computed; rebuild it")
    fips = set()
    for name, e in counties.items():
        sh = e.get("shares") or {}
        if not sh:
            bad.append(f"{name}: no computed shares")
            continue
        unknown = set(sh) - set(ENGINE_REGIONS)
        if unknown:
            bad.append(f"{name}: unknown regions {sorted(unknown)}")
        total = sum(sh.values())
        if abs(total - 1.0) > 0.5 * 10 ** -SHARE_DP * len(sh) + 1e-9:
            bad.append(f"{name}: shares sum to {total:.4f}")
        if e.get("region") != primary(sh):
            bad.append(f"{name}: region {e.get('region')} is not the largest share {primary(sh)}")
        if not str(e.get("fips", "")).startswith("48") or len(str(e.get("fips", ""))) != 5:
            bad.append(f"{name}: fips {e.get('fips')!r} is not a Texas county code")
        fips.add(e.get("fips"))
    if len(fips) != len(counties):
        bad.append("two counties share a fips code")
    return bad


def self_test() -> int:
    fails = 0

    def ok(label, cond):
        nonlocal fails
        print(("  ok    " if cond else "  FAIL  ") + label)
        fails += 0 if cond else 1

    sq = lambda x0, y0, x1, y1: np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], float)
    # a 1x1 degree square split down the middle between two regions, one county covering it
    regions = [("hill_country", [sq(0, 30, 0.5, 31)]), ("blackland", [sq(0.5, 30, 1, 31)])]
    counties = [("48999", "Mid", [sq(0, 30, 1, 31)]), ("48997", "West", [sq(0, 30, 0.4, 31)])]
    got = compute(regions, counties, step=0.01)
    ok("a county split down the middle measures half and half",
       got["Mid"]["shares"] == {"blackland": 0.5, "hill_country": 0.5})
    ok("a county wholly inside one region is one region", got["West"]["shares"] == {"hill_country": 1.0})
    # a hole: a region with a square hole, and a county exactly in the hole
    donut = [sq(0, 30, 1, 31), sq(0.25, 30.25, 0.75, 30.75)]
    got2 = compute([("gulf", donut), ("post_oak", [sq(0.25, 30.25, 0.75, 30.75)])],
                   [("48995", "Hole", [sq(0.3, 30.3, 0.7, 30.7)])], step=0.01)
    ok("a ring's hole is a hole, not the outer region", got2["Hole"]["shares"] == {"post_oak": 1.0})
    # area weighting: two equal-degree halves north and south at high latitude are not equal area
    got3 = compute([("high_plains", [sq(0, 30, 1, 45)]), ("rolling_plains", [sq(0, 45, 1, 60)])],
                   [("48993", "Tall", [sq(0, 30, 1, 60)])], step=0.05)
    ok("shares are true area, so the southern half of a tall county weighs more",
       got3["Tall"]["shares"]["high_plains"] > got3["Tall"]["shares"]["rolling_plains"])
    # allowed(): straddle and floor
    ok("a 0.62 / 0.38 straddle allows both", allowed({"shares": {"blackland": 0.62, "hill_country": 0.38}})
       == ["blackland", "hill_country"])
    ok("a 0.96 / 0.04 sliver allows only the main region",
       allowed({"shares": {"gulf": 0.96, "post_oak": 0.04}}) == ["gulf"])
    ok("an even three-way split below the floor still allows its largest",
       allowed({"shares": {"a": 0.09, "b": 0.08, "c": 0.07}})[0] == "a")
    ok("county names match without 'County', case or spacing",
       normalise("De Witt County") == normalise("DeWitt") and normalise("la salle") == normalise("La Salle"))
    # the verifier goes red
    good = {"method": {"allow_share": ALLOW_SHARE}, "source": {}, "counties": {
        f"C{i}": {"region": "gulf", "fips": f"48{i:03d}", "shares": {"gulf": 1.0}} for i in range(254)}}
    ok("a complete, consistent table verifies", verify(good, check_files=False) == [])
    short = json.loads(json.dumps(good)); short["counties"].pop("C0")
    ok("a missing county fails", any("253 counties" in b for b in verify(short, check_files=False)))
    typed = json.loads(json.dumps(good)); typed["counties"]["C1"] = {"region": "gulf", "fips": "48001"}
    ok("a typed region with no computed shares fails", any("no computed shares" in b for b in verify(typed, check_files=False)))
    wrong = json.loads(json.dumps(good)); wrong["counties"]["C2"]["region"] = "piney_woods"
    ok("a region that is not the largest share fails", any("not the largest share" in b for b in verify(wrong, check_files=False)))
    odd = json.loads(json.dumps(good)); odd["counties"]["C3"]["shares"] = {"gulf": 0.7}
    ok("shares that don't sum to one fail", any("sum to" in b for b in verify(odd, check_files=False)))
    # the committed table, if present, is the real one
    if TABLE.exists():
        real = json.loads(TABLE.read_text(encoding="utf-8"))
        ok("the committed table verifies", verify(real) == [])
        _, reeves = find(real, "Reeves")
        ok("Reeves County is the Trans-Pecos, never the Hill Country (REGIONS.md's own example)",
           reeves is not None and "trans_pecos" in allowed(reeves) and "hill_country" not in allowed(reeves))
        _, harris = find(real, "Harris County")
        ok("Harris County is Gulf light over black clay", harris is not None and harris["region"] == "gulf")
    print(f"county_regions self-test: {'PASS' if not fails else f'{fails} FAILED'}")
    return 1 if fails else 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--gould", type=Path, help="GouldRegions.zip, as downloaded from TPWD")
    ap.add_argument("--lookup", metavar="COUNTY")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args(argv)
    if a.self_test:
        return self_test()
    if a.build:
        if not a.gould or not a.gould.exists():
            print(f"--build needs --gould, the TPWD zip from {GOULD_URL}")
            return 2
        table = build(a.gould)
        bad = verify(table)
        if bad:
            print("the rebuilt table does not verify:\n  " + "\n  ".join(bad))
            return 1
        TABLE.write_text(json.dumps(table, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {TABLE.relative_to(REPO)}: {len(table['counties'])} counties")
        return 0
    try:
        table = json.loads(TABLE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"can't read {TABLE}: {e}")
        return 2
    if a.lookup:
        name, e = find(table, a.lookup)
        if e is None:
            print(f"{a.lookup!r} is not a Texas county")
            return 1
        print(json.dumps({"county": name, "allowed": allowed(e), **e}, indent=1))
        return 0
    bad = verify(table)
    for b in bad:
        print("  FAIL  " + b)
    print(f"county_regions: {'clean' if not bad else f'{len(bad)} problem(s)'}, "
          f"{len(table.get('counties') or {})} counties")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
