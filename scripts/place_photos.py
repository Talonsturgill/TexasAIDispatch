#!/usr/bin/env python3
"""place_photos.py: real photographs of the story's actual Texas place, with their rights on record.

WHY THIS EXISTS

Step five of the October 9th, 2026 plan: "Use real local photos with their sources recorded; 10 of
the last 14 films had none." The lane for a real still already exists (DAILY_PRODUCTION.md: a
native_media row with source, rights basis, story role and claim ids). What runs kept finding was
pictures they could not use. Over the eight editions before October 9th the bounded visual search
rejected almost every candidate for the same two reasons: no reuse licence was established, or the
picture did not show the story. Viewing access is not a licence, and a university headshot is
not a place.

This searches a source whose rights are explicit by construction. The Library of Congress holds The
Lyda Hill Texas Collection of Photographs in Carol M. Highsmith's America Project, thousands of
photographs of Texas towns, buildings, industry and land, given to the public, each catalogued with
the rights advisory "No known restrictions on publication", a credit line, a date and the place it
was made. A candidate is kept only when the Library's own record says all of that; the decision to
use one is still the run's, by the same rules as any other still: it has to show the story's actual
site or a stated, specific relationship to it, never mood.

    place_photos.py --place "Houston Ship Channel"              candidates, from the Library's records
    place_photos.py --place "Abilene" --limit 6 --out out/dispatch/place_photos.json
    place_photos.py --fetch https://www.loc.gov/item/2014632264/ --dest out/dispatch/media/ship-channel.jpg
    place_photos.py --self-test

--fetch downloads the Library's own derivative at FETCH_WIDTH pixels wide, and writes beside it a
.json holding everything the native_media row needs: source_url, image_url, creator, title, date,
rights_basis (the advisory verbatim), credit_line, retrieved_utc and sha256. Exit 0 found or fetched,
1 nothing usable, 2 the Library could not be reached.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
API = "https://www.loc.gov/photos/"
COLLECTION = "Lyda Hill Texas Collection"
RIGHTS = "No known restrictions on publication."
FETCH_WIDTH = 1840          # the Library's 25 percent derivative of a 7360 px master
TIMEOUT_S = 30
UA = "TexasAIDispatch place_photos (+https://texasaidocket.com)"


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        return json.loads(r.read().decode("utf-8"))


def search_url(place: str, n: int) -> str:
    q = urllib.parse.quote_plus(f"lyda hill texas collection {place}")
    return f"{API}?q={q}&fo=json&c={n}&at=results"


def record(item_json: dict) -> dict | None:
    """The fields a native_media row needs, from the Library's item record, or None when the record
    does not itself say the photograph is in the collection and free of known restrictions."""
    it = item_json.get("item") or {}
    notes = " ".join(it.get("notes") or [])
    credit = next((n.split("Credit line:", 1)[1].strip() for n in it.get("notes") or [] if "Credit line:" in n), "")
    advisory = (it.get("rights_advisory") or "").strip()
    if advisory != RIGHTS or COLLECTION.lower() not in (notes + " " + credit).lower():
        return None
    images = [u for u in it.get("image_url") or [] if "pct:25" in u]
    files = [f for res in item_json.get("resources") or [] for group in res.get("files") or [] for f in group]
    jpg = next((f for f in files if f.get("mimetype") == "image/jpeg" and f.get("width") == FETCH_WIDTH), None)
    image = (jpg or {}).get("url") or (images[0].split("#")[0] if images else "")
    if not image:
        return None
    creators = [re.sub(r",\s*\d{4}-.*$", "", c).strip() for c in it.get("contributor_names") or []]
    created = (it.get("created_published") or [it.get("date") or ""])[0]
    return {
        "source_url": (item_json.get("item") or {}).get("id") or item_json.get("id") or "",
        "image_url": image,
        "title": it.get("title", ""),
        "date": str(created).rstrip("."),
        "creator": "; ".join(creators),
        "place": [p for p in it.get("location") or []],
        "rights_basis": f"Library of Congress rights advisory: {advisory}",
        "credit_line": credit,
        "call_number": it.get("call_number", ""),
    }


def candidates(place: str, limit: int) -> list[dict]:
    found = get_json(search_url(place, max(limit * 2, 6))).get("results") or []
    rows = []
    for r in found:
        url = (r.get("id") or "").replace("http://", "https://")
        if not url.startswith("https://www.loc.gov/item/"):
            continue
        rec = record(get_json(url.rstrip("/") + "/?fo=json"))
        if rec:
            rec["source_url"] = url
            rows.append(rec)
        if len(rows) >= limit:
            break
    return rows


def fetch(item_url: str, dest: Path) -> dict:
    url = item_url.replace("http://", "https://").split("?")[0].rstrip("/") + "/"
    rec = record(get_json(url + "?fo=json"))
    if not rec:
        raise ValueError(f"{url} is not a {COLLECTION} photograph with the advisory {RIGHTS!r}")
    rec["source_url"] = url
    req = urllib.request.Request(rec["image_url"], headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
        data = r.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    rec.update(file=str(dest), sha256=hashlib.sha256(data).hexdigest(), bytes=len(data),
               retrieved_utc=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    dest.with_suffix(dest.suffix + ".json").write_text(json.dumps(rec, indent=1) + "\n", encoding="utf-8")
    return rec


def self_test() -> int:
    fails = []

    def ok(cond, what):
        if not cond:
            fails.append(what)

    good = {"item": {
        "id": "http://www.loc.gov/item/2014632264/",
        "title": "Aerial view in 2014 of the Houston Ship Channel and surrounding energy facilities in Houston, Texas",
        "created_published": ["2014-05-05."], "contributor_names": ["Highsmith, Carol M., 1946-, photographer"],
        "rights_advisory": "No known restrictions on publication.",
        "notes": ["Credit line: The Lyda Hill Texas Collection of Photographs in Carol M. Highsmith's America Project, "
                  "Library of Congress, Prints and Photographs Division."],
        "location": ["united states", "texas", "houston"], "call_number": "LC-DIG-highsm- 28064 (ONLINE) [P&P]",
        "image_url": ["https://tile.loc.gov/image-services/iiif/service:pnp:highsm:28000:28064/full/pct:25/0/default.jpg#h=1228&w=1840"]},
        "resources": [{"files": [[{"mimetype": "image/jpeg", "width": 1840,
                                   "url": "https://tile.loc.gov/image-services/iiif/service:pnp:highsm:28000:28064/full/pct:25/0/default.jpg"}]]}]}
    r = record(good)
    ok(r is not None, "a Lyda Hill photograph with the advisory was refused")
    if r:
        ok(r["creator"] == "Highsmith, Carol M.", f"creator {r['creator']!r}")
        ok(r["date"] == "2014-05-05", f"date {r['date']!r}")
        ok(r["rights_basis"].endswith(RIGHTS), "the advisory is not on record verbatim")
        ok(r["credit_line"].startswith("The Lyda Hill Texas Collection"), f"credit {r['credit_line']!r}")
        ok(r["image_url"].endswith("pct:25/0/default.jpg"), f"image {r['image_url']!r}")
        ok("houston" in r["place"], "the place tags were lost")
    restricted = json.loads(json.dumps(good))
    restricted["item"]["rights_advisory"] = "Rights status not evaluated."
    ok(record(restricted) is None, "a photograph without the advisory was kept")
    other = json.loads(json.dumps(good))
    other["item"]["notes"] = ["Credit line: Some other collection, Library of Congress."]
    ok(record(other) is None, "a photograph outside the collection was kept")
    bare = json.loads(json.dumps(good))
    bare["item"]["image_url"], bare["resources"] = [], []
    ok(record(bare) is None, "a record with no image was kept")
    ok("lyda+hill+texas+collection+Abilene" in search_url("Abilene", 4), search_url("Abilene", 4))
    if fails:
        print("place_photos self-test FAILED:")
        for f in fails:
            print("  " + f)
        return 1
    print("place_photos self-test: ok")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--place", help="the story's actual site, town or county, as words to search")
    ap.add_argument("--limit", type=int, default=8)
    ap.add_argument("--out", type=Path, help="write the candidates here as JSON")
    ap.add_argument("--fetch", metavar="ITEM_URL")
    ap.add_argument("--dest", type=Path)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        if a.fetch:
            if not a.dest:
                print("--fetch needs --dest")
                return 2
            rec = fetch(a.fetch, a.dest)
            print(json.dumps(rec, indent=1))
            return 0
        if not a.place:
            print("--place or --fetch is required")
            return 2
        rows = candidates(a.place, a.limit)
    except (OSError, ValueError) as exc:
        print(f"place_photos: could not reach or read the Library of Congress: {exc}")
        return 2
    if a.out:
        a.out.parent.mkdir(parents=True, exist_ok=True)
        a.out.write_text(json.dumps(rows, indent=1) + "\n", encoding="utf-8")
    for r in rows:
        print(f"{r['date']}  {r['title'][:90]}\n    {r['source_url']}")
    print(f"place_photos: {len(rows)} candidates with the advisory on record")
    return 0 if rows else 1


if __name__ == "__main__":
    sys.exit(main())
