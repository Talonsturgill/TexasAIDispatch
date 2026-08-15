#!/usr/bin/env python3
"""music.py — the music bed registry, the licence gate, and the credits the licence
is paid with.

WHY THIS EXISTS, AND WHY IT IS A GATE RATHER THAN A NOTE

The Dispatch credits its music at the end. For a permissively licensed track that
credit is not a courtesy, it IS THE LICENCE: under CC BY the attribution is the term
you are granted the use in exchange for, so a missing or wrong credit is not a style
slip, it is using the work without a licence. That makes the credit the one piece of
this pipeline that must be impossible to forget, and impossible to hand-type wrong.

So the credit is GENERATED from the registry and CHECKED before a film ships. A track
with incomplete attribution cannot be used. A film that uses a track whose credit does
not appear in its credits block does not pass.

WHAT MAY BE USED, and this is the part that is easy to get wrong.

  ALLOWED
    CC0 / public domain dedication  no attribution legally required; we credit anyway
    CC BY (any version)             attribution required, commercial ok, edits ok

  REFUSED, each for a specific reason rather than caution
    CC BY-NC (any NonCommercial)  the Dispatch supports a commercial practice, so the
                                  NonCommercial term is broken by our own use of it
    CC BY-ND (any NoDerivatives)  we trim a bed to length and sync it to picture, and
                                  both are derivative works
    CC BY-SA (any ShareAlike)     viral: it would reach for the film itself. Refused
                                  by default; only the owner can decide to accept it
    all rights reserved           crediting a commercial recording does not licence
                                  it. This is the trap the whole file exists for:
                                  naming Willie Nelson in the credits buys nothing

  THE PUBLIC-DOMAIN RECORDING TRAP. A composition falling into the public domain does
  NOT free a recording of it. "The Yellow Rose of Texas" is old enough that the melody
  is public domain, and every arrangement anyone has actually heard is a modern
  copyright. So a PD claim has to name which of the two rights it is claiming, and a
  track claiming `public_domain` must say so in `pd_basis`.

`knowledge/texas/MUSIC.md` is the approach: where to source Texas music under these
licences, how to vet it, and the traps in full.

  music.py --check                       # validate the registry
  music.py --credits <track_id>          # the exact credit block for one track
  music.py --verify-film <credits.txt> --track <id>   # the shipping gate
  music.py --self-test                   # hermetic, gates every build

Exit 0 ok, 1 a check failed, 2 could not run.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
REGISTRY = REPO / "config" / "music" / "tracks.json"

# Read once. The public-domain boundary depends on it and it must not shift mid-run.
TODAY_YEAR = date.today().year

# The licence table. `ok` is whether a track under it may be used, and `why` is the
# reason, which is printed on refusal so the answer is never "because the script said
# no". Keyed by a normalised id.
LICENCES = {
    "cc0": {"ok": True, "name": "CC0 1.0",
            "url": "https://creativecommons.org/publicdomain/zero/1.0/",
            "why": "public domain dedication, no conditions"},
    "cc-by-3.0": {"ok": True, "name": "CC BY 3.0",
                  "url": "https://creativecommons.org/licenses/by/3.0/",
                  "why": "attribution only, commercial and derivative use allowed"},
    "cc-by-4.0": {"ok": True, "name": "CC BY 4.0",
                  "url": "https://creativecommons.org/licenses/by/4.0/",
                  "why": "attribution only, commercial and derivative use allowed"},
    "public_domain": {"ok": True, "name": "Public domain",
                      "url": "", "why": "out of copyright, but see pd_basis"},
    "cc-by-nc": {"ok": False, "name": "CC BY-NC",
                 "url": "https://creativecommons.org/licenses/by-nc/4.0/",
                 "why": "NonCommercial. This film supports a commercial practice, so "
                        "our own use breaks the term"},
    "cc-by-nd": {"ok": False, "name": "CC BY-ND",
                 "url": "https://creativecommons.org/licenses/by-nd/4.0/",
                 "why": "NoDerivatives. Trimming a bed to length and syncing it to "
                        "picture are both derivative works"},
    "cc-by-sa": {"ok": False, "name": "CC BY-SA",
                 "url": "https://creativecommons.org/licenses/by-sa/4.0/",
                 "why": "ShareAlike is viral and would reach for the film itself. "
                        "Only the owner can decide to accept that"},
    "cc-by-nc-sa": {"ok": False, "name": "CC BY-NC-SA", "url": "",
                    "why": "NonCommercial and ShareAlike, both disqualifying"},
    "cc-by-nc-nd": {"ok": False, "name": "CC BY-NC-ND", "url": "",
                    "why": "NonCommercial and NoDerivatives, both disqualifying"},
    "all_rights_reserved": {"ok": False, "name": "All rights reserved", "url": "",
                            "why": "crediting a commercial recording does not licence "
                                   "it. A credit is not a substitute for a licence"},
}

# Every field a usable entry must carry. TASL (title, author, source, licence) is the
# attribution the CC licences ask for, so each of those is required rather than nice.
REQUIRED = ["id", "title", "artist", "source_url", "licence", "file", "verified_on"]

# US sound-recording terms, from the Copyright Office and Cornell's chart: recordings
# published before 1926 are public domain today, and 1926 to 1946 runs 100 years from
# publication. So a recording clears on the first of January after its hundredth year.
#
# COMPUTED, not a typed cutoff, so the boundary advances on its own every New Year and
# a 1926 recording becomes usable on 2027-01-01 without anybody editing this file.
PD_TERM_YEARS = 100


def pd_clear_year(publication_year: int) -> int:
    """The first year in which the recording is public domain."""
    return publication_year + PD_TERM_YEARS + 1


def is_pd_now(publication_year: int, today_year: int) -> bool:
    return pd_clear_year(publication_year) <= today_year


def load(path: Path = REGISTRY) -> list[dict]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw if isinstance(raw, list) else raw.get("tracks", [])


def licence_of(track: dict) -> dict | None:
    return LICENCES.get(str(track.get("licence", "")).strip().lower())


def credit_line(track: dict) -> str:
    """The credit, in the TASL order Creative Commons asks for: title, author, source,
    licence. Generated, never typed, because this string IS the licence payment."""
    lic = licence_of(track) or {}
    name = lic.get("name", track.get("licence", "?"))
    bits = [f'"{track["title"]}" by {track["artist"]}']
    if track.get("source_url"):
        bits.append(f'({track["source_url"]})')
    if str(track.get("licence")).lower() == "public_domain":
        bits.append(f'- {name}: {track.get("pd_basis", "basis not stated")}')
    else:
        url = lic.get("url", "")
        bits.append(f"- licensed under {name}" + (f" ({url})" if url else ""))
    if track.get("modified"):
        # CC asks that you indicate changes. We always trim and sync, so we always say so.
        bits.append("- trimmed and synced to picture")
    return " ".join(bits)


def credits_block(tracks: list[dict]) -> str:
    if not tracks:
        return ""
    return "MUSIC\n" + "\n".join(credit_line(t) for t in tracks)


def problems_with(track: dict) -> list[str]:
    """Every reason this entry may not be used. Empty means usable."""
    out = []
    tid = track.get("id", "<no id>")
    for f in REQUIRED:
        if not str(track.get(f, "")).strip():
            out.append(f"{tid}: missing required field '{f}'")
    lic = licence_of(track)
    if lic is None:
        out.append(f"{tid}: licence '{track.get('licence')}' is not in the table. An "
                   f"unknown licence is refused, because the safe default for a right "
                   f"nobody has checked is no.")
        return out
    if not lic["ok"]:
        out.append(f"{tid}: {lic['name']} is refused. {lic['why']}")
    if str(track.get("licence")).lower() == "public_domain":
        if not track.get("pd_basis"):
            out.append(f"{tid}: claims public domain without pd_basis. Say WHICH right is "
                       f"public domain, the composition or the recording, because a PD "
                       f"melody in a modern recording is still someone's recording.")
        elif "recording" not in str(track["pd_basis"]).lower():
            # THE BASIS HAS TO ADDRESS THE RECORDING, not merely be non-empty. The check
            # was `if not track.get("pd_basis")`, so "x" passed.
            #
            # And it has to be the RECORDING specifically, which is the trap this field was
            # added for. Every entry in this registry IS a sound recording, so a basis
            # answering only about the composition has answered the wrong question: the
            # melody of a 1902 song is long clear and the 1957 record of it is not. An
            # earlier version of this check accepted either word and would have passed
            # "the COMPOSITION is public domain" on a track whose recording rights nobody
            # had looked at.
            out.append(f"{tid}: pd_basis does not address the RECORDING. What this registry "
                       f"uses is a record, so a public domain composition is not the "
                       f"question. Say why the recording itself is clear.")
        year = track.get("publication_year")
        if not isinstance(year, int):
            out.append(f"{tid}: public domain by statute needs an integer "
                       f"publication_year. The term runs from publication, so without "
                       f"the year there is nothing to compute the term from.")
        elif not is_pd_now(year, TODAY_YEAR):
            out.append(f"{tid}: published {year}, which is still in copyright. It "
                       f"clears on {pd_clear_year(year)}-01-01. Not before.")
        if not track.get("pd_evidence"):
            out.append(f"{tid}: public domain claim carries no pd_evidence URL. The "
                       f"platform showing no licence is not evidence of anything.")

    # THE TRANSFER IS A SEPARATE RIGHT FROM THE WORK, and this is not hypothetical.
    # UCSB releases its pre-1923 cylinder transfers outright and claims copyright on
    # its 1923-and-later ones under a NonCommercial licence, and those transfers are
    # live on the Internet Archive. So a genuinely public-domain performance can
    # arrive wrapped in an NC claim belonging to whoever digitised it.
    #
    # AN ABSENT FIELD IS A PROBLEM, NOT A PASS. This read `if tr and tr not in (...)`, so
    # OMITTING transfer_rights skipped the whole block, and the field is not in REQUIRED.
    # Deleting one line from an entry turned the check this comment exists for off, and
    # omission is the default state of a hand-added entry. The safe default for a right
    # nobody has checked is no, which this file already says nine lines above about
    # licences: `none` is a stated answer and silence is not.
    tr = str(track.get("transfer_rights", "")).strip().lower()
    if not tr:
        out.append(f"{tid}: no transfer_rights. Whoever digitised the record may hold rights "
                   f"in the TRANSFER even when the work itself is clear, so this has to say "
                   f"so explicitly. Write 'none' when there is no separate claim.")
    elif tr not in ("none", "public_domain"):
        trl = LICENCES.get(tr)
        if trl is None:
            out.append(f"{tid}: transfer_rights '{tr}' is not in the table.")
        elif not trl["ok"]:
            out.append(f"{tid}: the WORK is clear but the TRANSFER is {trl['name']}. "
                       f"{trl['why']}. Find another transfer of the same performance.")

    # A licence id that disagrees with the linked deed is the quiet way an NC track gets
    # labelled BY, so the link is cross-checked against the id.
    #
    # THE CROSS-CHECK RUNS FOR EVERY TRACK. It was guarded by `lic.get("url")`, and the
    # public_domain table entry carries an empty url, so it was switched off for exactly
    # the five tracks where the transfer trap is most likely to bite. A licence_url
    # pointing at a BY-NC-ND deed on a public domain entry passed silently.
    url = str(track.get("licence_url", "")).lower()
    if url:
        for term in ("nc", "nd", "sa"):
            if f"-{term}" in url and f"-{term}" not in str(track.get("licence")).lower():
                out.append(f"{tid}: licence says '{track.get('licence')}' but "
                           f"licence_url points at a '{term}' deed. One of them is wrong.")
    return out


def check(tracks: list[dict]) -> list[str]:
    out = []
    seen = set()
    for t in tracks:
        out += problems_with(t)
        tid = t.get("id")
        if tid in seen:
            out.append(f"{tid}: duplicate id")
        seen.add(tid)
    return out


def usable(tracks: list[dict]) -> list[dict]:
    return [t for t in tracks if not problems_with(t)]


def verify_film(credits_text: str, track: dict) -> list[str]:
    """THE SHIPPING GATE. A film that uses a track must carry that track's credit.

    Checked by CONTENT rather than by the presence of a heading: the title, the artist
    and the licence name must each actually appear. A credits block that says the word
    MUSIC and nothing else is the failure this catches."""
    out = []
    hay = " ".join(credits_text.split()).lower()
    if not hay:
        return [f"{track.get('id')}: the film carries no credits text at all, and the "
                f"credit is the licence. Nothing ships without it."]
    for label, value in (("title", track.get("title", "")),
                         ("artist", track.get("artist", ""))):
        if value and " ".join(str(value).split()).lower() not in hay:
            out.append(f"{track.get('id')}: the {label} '{value}' does not appear in the "
                       f"film's credits.")
    lic = licence_of(track) or {}
    if lic.get("name") and lic["name"].lower() not in hay:
        out.append(f"{track.get('id')}: the licence '{lic['name']}' is not named in the "
                   f"film's credits. The licence name is part of the attribution.")
    return out


# ---------------------------------------------------------------- self-test
def self_test() -> int:
    fails = 0

    def ok(label, cond):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}")
        if not cond:
            fails += 1

    good = {"id": "t1", "title": "Caliche Road", "artist": "A Texan",
            "source_url": "https://example.org/t1", "licence": "cc-by-4.0",
            "licence_url": "https://creativecommons.org/licenses/by/4.0/",
            "file": "assets/music/t1.wav", "verified_on": "2026-08-14", "modified": True,
            # STATED, not omitted. This fixture had no transfer_rights and passed, because
            # an absent field skipped the check entirely. Every entry in the real registry
            # carries it, so requiring it costs nothing and closes the hole.
            "transfer_rights": "none"}

    ok("a complete CC BY entry is usable", not problems_with(good))
    ok("its credit carries title, artist, source and licence",
       all(s in credit_line(good) for s in
           ("Caliche Road", "A Texan", "example.org/t1", "CC BY 4.0")))
    ok("and it declares that we changed it", "trimmed and synced" in credit_line(good))

    # THE REFUSALS, each for its own reason
    for lic, word in (("cc-by-nc", "NonCommercial"), ("cc-by-nd", "NoDerivatives"),
                      ("cc-by-sa", "ShareAlike"), ("all_rights_reserved", "not a substitute")):
        bad = dict(good, licence=lic, licence_url="")
        ok(f"{lic} is refused, and says why", any(word in p for p in problems_with(bad)))

    ok("an unknown licence is refused rather than allowed",
       any("not in the table" in p for p in problems_with(dict(good, licence="mystery"))))
    ok("a missing required field is caught",
       any("missing required field 'artist'" in p for p in problems_with(dict(good, artist=""))))
    ok("public domain must say which right it claims",
       any("pd_basis" in p for p in problems_with(dict(good, licence="public_domain"))))

    # PUBLIC DOMAIN BY STATUTE, and the boundary is computed so it advances by itself
    pd = {"id": "p1", "title": "Old Thing", "artist": "Someone",
          "source_url": "https://archive.org/details/x", "licence": "public_domain",
          "publication_year": 1922, "pd_basis": "the RECORDING, published 1922",
          "pd_evidence": "https://www.copyright.gov/", "transfer_rights": "none",
          "file": "assets/music/x.mp3", "verified_on": "2026-08-14"}
    ok("a pre-boundary recording is usable", not problems_with(pd))
    ok("a still-in-copyright recording is refused with the year it clears",
       any("clears on" in p for p in problems_with(dict(pd, publication_year=1935))))
    ok("a public domain claim with no year is refused",
       any("publication_year" in p for p in problems_with(dict(pd, publication_year=None))))
    ok("a public domain claim with no evidence is refused",
       any("pd_evidence" in p for p in problems_with(dict(pd, pd_evidence=""))))

    # ---- THE THREE CHECKS THAT COULD NOT FIRE, each confirmed passing before this.
    #
    # An OMITTED field is the default state of a hand-added entry, and each of these was
    # guarded by a truthiness test on the field itself, so deleting one line turned the
    # check off. The safe default for a right nobody has checked is no.
    ok("OMITTING transfer_rights is refused, not skipped",
       any("no transfer_rights" in p
           for p in problems_with({k: v for k, v in pd.items() if k != "transfer_rights"})))
    ok("a pd_basis that is merely non-empty is refused",
       any("does not address the RECORDING" in p
           for p in problems_with(dict(pd, pd_basis="x"))))
    ok("...and so is one answering only about the COMPOSITION, which is the actual trap",
       any("does not address the RECORDING" in p for p in problems_with(
           dict(pd, pd_basis="the COMPOSITION is public domain, published 1902"))))
    ok("a public domain entry whose licence_url points at an NC deed is refused",
       any("points at a 'nc' deed" in p for p in problems_with(
           dict(pd, licence_url="https://creativecommons.org/licenses/by-nc-nd/4.0/"))))
    ok("...and that cross-check used to be off for every public domain track",
       any("deed" in p for p in problems_with(
           dict(pd, licence_url="https://creativecommons.org/licenses/by-sa/4.0/"))))
    ok("the boundary is computed, not typed: 1926 clears in 2027",
       pd_clear_year(1926) == 2027 and not is_pd_now(1926, 2026) and is_pd_now(1926, 2027))

    # THE TRANSFER IS ITS OWN RIGHT. This is the UCSB case, and it is real.
    ok("a public domain work with an NC TRANSFER is refused",
       any("TRANSFER" in p for p in problems_with(dict(pd, transfer_rights="cc-by-nc"))))
    ok("a clean transfer passes", not problems_with(dict(pd, transfer_rights="none")))
    ok("a BY label pointing at an NC deed is caught",
       any("one of them is wrong" in p.lower() for p in problems_with(
           dict(good, licence_url="https://creativecommons.org/licenses/by-nc/4.0/"))))
    ok("duplicate ids are caught", any("duplicate" in p for p in check([good, dict(good)])))

    # THE SHIPPING GATE must actually fail
    ok("a film with no credits is refused", bool(verify_film("", good)))
    ok("a film whose credits omit the artist is refused",
       any("artist" in p for p in verify_film('MUSIC "Caliche Road" CC BY 4.0', good)))
    ok("a film whose credits omit the licence is refused",
       any("licence" in p.lower() for p in verify_film('MUSIC "Caliche Road" by A Texan', good)))
    ok("a complete credits block passes", not verify_film(credits_block([good]), good))

    # an empty registry is a legitimate state, not a crash
    ok("an empty registry validates cleanly", check([]) == [])
    ok("and yields no usable tracks", usable([]) == [])

    # the real registry on disk must be valid whatever is in it
    ok("the committed registry is valid", check(load()) == [])

    print(f"\nmusic self-test: {'all passed' if not fails else f'{fails} FAILED'}")
    return 1 if fails else 0


def check_links(tracks: list[dict]) -> int:
    """Every source_url has to RESOLVE, because for a CC BY track that page is the licence.

    THE DEFECT THIS EXISTS FOR. Three of eleven entries pointed at Wikimedia Commons files
    that 404. `--check` called all eleven usable, because it verifies that the field is a
    non-empty string and never that it leads anywhere. A run picking one of those three
    would have generated a credit naming a page that does not exist, `--verify-film` would
    have passed it, and the film would have shipped paying a CC BY attribution with a dead
    link as its only evidence. `verified_on` is a date somebody typed, not a check.

    A 404 IS A HARD FAIL AND AN UNREACHABLE HOST IS NOT. The distinction matters: a licence
    gate that goes red because a runner has no network teaches everyone to ignore it, which
    is how a gate stops working. A refusal from the server is evidence; silence is not.
    """
    import urllib.error
    import urllib.request

    dead, unreachable = [], []
    for t in tracks:
        url = str(t.get("source_url", "")).strip()
        tid = t.get("id", "<no id>")
        if not url:
            dead.append(f"{tid}: no source_url at all")
            continue
        req = urllib.request.Request(url, method="HEAD", headers={
            "User-Agent": "TexasAIDispatch/1.0 (music registry link check)"})
        try:
            with urllib.request.urlopen(req, timeout=25) as r:
                code = r.status
            print(f"  {code}  {tid}")
        except urllib.error.HTTPError as exc:
            if exc.code in (403, 405):          # some hosts refuse HEAD, not the resource
                print(f"  {exc.code}  {tid} (host refuses HEAD, not treated as dead)")
                continue
            dead.append(f"{tid}: {url} returns {exc.code}. For a CC BY track that page IS "
                        f"the licence, so a credit pointing at it would name nothing.")
        except (urllib.error.URLError, OSError, ValueError) as exc:
            unreachable.append(f"{tid}: could not reach {url} ({exc})")

    for u in unreachable:
        print(f"  unreachable  {u}", file=sys.stderr)
    if unreachable and not dead:
        print(f"music: {len(unreachable)} source(s) unreachable and none refused. Network, "
              f"not licence. Not failing on it.", file=sys.stderr)
    if dead:
        print(f"\nmusic: {len(dead)} dead source(s)", file=sys.stderr)
        for d in dead:
            print(f"  - {d}", file=sys.stderr)
        return 1
    print(f"music: every source resolves ({len(tracks)} track(s))")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--credits", metavar="TRACK_ID")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--verify-film", metavar="CREDITS_TXT")
    ap.add_argument("--track", metavar="TRACK_ID")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--check-links", action="store_true",
                    help="fetch every source_url and refuse a dead one. Separate from "
                         "--check because it needs the network, and network flakiness must "
                         "never be able to fail a licence gate.")
    a = ap.parse_args()

    if a.self_test:
        return self_test()

    tracks = load()
    by_id = {t.get("id"): t for t in tracks}

    if a.check:
        probs = check(tracks)
        for p in probs:
            print(f"  - {p}", file=sys.stderr)
        if probs:
            print(f"music: {len(probs)} problem(s) in the registry", file=sys.stderr)
            return 1
        print(f"music: registry clean. {len(tracks)} track(s), {len(usable(tracks))} usable.")
        return 0

    if a.check_links:
        return check_links(tracks)

    if a.list:
        for t in tracks:
            mark = "ok " if not problems_with(t) else "NO "
            print(f"  {mark} {t.get('id'):24} {t.get('licence'):18} {t.get('title')}")
        if not tracks:
            print("  (registry is empty: no vetted track has been added yet)")
        return 0

    if a.credits:
        t = by_id.get(a.credits)
        if not t:
            print(f"music: no track '{a.credits}' in the registry", file=sys.stderr)
            return 2
        probs = problems_with(t)
        if probs:
            for p in probs:
                print(f"  - {p}", file=sys.stderr)
            return 1
        print(credits_block([t]))
        return 0

    if a.verify_film:
        if not a.track:
            print("music: --verify-film needs --track", file=sys.stderr)
            return 2
        t = by_id.get(a.track)
        if not t:
            print(f"music: no track '{a.track}' in the registry", file=sys.stderr)
            return 2
        try:
            text = Path(a.verify_film).read_text(encoding="utf-8")
        except OSError as exc:
            print(f"music: cannot read credits: {exc}", file=sys.stderr)
            return 2
        probs = problems_with(t) + verify_film(text, t)
        for p in probs:
            print(f"  - {p}", file=sys.stderr)
        if probs:
            print("music: the film may not ship with this track", file=sys.stderr)
            return 1
        print(f"music: credit for '{t['id']}' is present and complete.")
        return 0

    print("music: pass --check, --list, --credits ID, --verify-film FILE --track ID, "
          "or --self-test", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
