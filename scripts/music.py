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
  music.py --select --brief music_brief.json  # prints a fitting id or NO_BED
  music.py --fit <track_id> --brief music_brief.json
  music.py --credits <track_id>          # the exact credit block for one track
  music.py --verify-package <credits.txt> --mix <mix.json>  # the shipping gate
  music.py --self-test                   # hermetic, gates every build

Exit 0 ok, 1 a check failed, 2 could not run.
"""
from __future__ import annotations

import argparse
import hashlib
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
    "project-original": {"ok": True, "name": "Project original", "url": "",
                         "why": "synthesised in this repository from original code; no "
                                "third-party recording or sample"},
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
EDITORIAL_REQUIRED = [
    "enabled", "moods", "uses", "avoid", "traits", "energy", "era_texture",
    "era_fit", "speech_masking", "mix_gap_db",
]
ENERGY = {"low", "medium", "high"}
MASKING = {"low", "medium", "high"}

# US sound-recording terms, from the Copyright Office and Cornell's chart: recordings
# published before 1926 are public domain today, and 1926 to 1946 runs 100 years from
# publication. So a recording clears on the first of January after its hundredth year.
#
# COMPUTED, not a typed cutoff, so the boundary advances on its own every New Year and
# a 1926 recording becomes usable on 2027-01-01 without anybody editing this file.
PD_TERM_YEARS = 100


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def repo_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO / path


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
    if str(track.get("licence")).lower() == "project-original":
        bits.append("- Project original, synthesised in the Texas AI Docket repository")
    elif str(track.get("licence")).lower() == "public_domain":
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
    for f in EDITORIAL_REQUIRED:
        if f not in track:
            out.append(f"{tid}: missing editorial field '{f}'")
    if "enabled" in track and not isinstance(track.get("enabled"), bool):
        out.append(f"{tid}: enabled must be true or false")
    for f in ("moods", "uses", "avoid", "traits", "era_fit"):
        value = track.get(f)
        if value is not None and (not isinstance(value, list)
                                  or any(not str(x).strip() for x in value)):
            out.append(f"{tid}: {f} must be a list of non-empty tags")
    for f in ("moods", "uses", "traits", "era_fit"):
        if isinstance(track.get(f), list) and not track[f]:
            out.append(f"{tid}: {f} cannot be empty")
    if track.get("energy") not in ENERGY:
        out.append(f"{tid}: energy must be one of {', '.join(sorted(ENERGY))}")
    if track.get("speech_masking") not in MASKING:
        out.append(f"{tid}: speech_masking must be one of {', '.join(sorted(MASKING))}")
    if not str(track.get("era_texture", "")).strip():
        out.append(f"{tid}: era_texture must describe what the recording sounds like")
    gap = track.get("mix_gap_db")
    if not isinstance(gap, (int, float)) or isinstance(gap, bool) or not 12 <= gap <= 30:
        out.append(f"{tid}: mix_gap_db must be a number from 12 to 30 dB below the voice")
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
    if track.get("enabled") is True:
        asset = REPO / str(track.get("file", ""))
        if not asset.is_file():
            out.append(f"{tid}: enabled but its playable asset is missing at {asset}. "
                       "A catalogue row is not a music library.")
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
    return [t for t in tracks if t.get("enabled") is True and not problems_with(t)]


def fit_problems(track: dict, brief: dict) -> list[str]:
    """Why this legally valid track does not fit this film's declared sound brief."""
    out = problems_with(track)
    tid = track.get("id", "<no id>")
    if track.get("enabled") is not True:
        out.append(f"{tid}: disabled; it has no approved playable asset")
        return out

    mood_raw = brief.get("moods", brief.get("mood", []))
    moods = {str(x).strip().lower() for x in (
        mood_raw if isinstance(mood_raw, list) else [mood_raw]) if str(x).strip()}
    use = str(brief.get("use", "")).strip().lower()
    energy = str(brief.get("energy", "")).strip().lower()
    era = str(brief.get("era", "")).strip().lower()
    avoid_raw = brief.get("avoid", [])
    avoid = {str(x).strip().lower() for x in (
        avoid_raw if isinstance(avoid_raw, list) else [avoid_raw]) if str(x).strip()}
    topics_raw = brief.get("topics", [])
    contexts = {str(x).strip().lower() for x in (
        topics_raw if isinstance(topics_raw, list) else [topics_raw]) if str(x).strip()}
    contexts.add(use)

    if not moods or not use or energy not in ENERGY or not era:
        out.append(f"{tid}: the brief must declare moods, use, energy, and era")
        return out
    if not moods.intersection(str(x).lower() for x in track.get("moods", [])):
        out.append(f"{tid}: no mood overlap with {sorted(moods)}")
    if use not in {str(x).lower() for x in track.get("uses", [])}:
        out.append(f"{tid}: not approved for use {use!r}")
    if energy != track.get("energy"):
        out.append(f"{tid}: energy is {track.get('energy')}, not {energy}")
    if era not in {str(x).lower() for x in track.get("era_fit", [])}:
        out.append(f"{tid}: era {era!r} does not fit its {track.get('era_texture')}")
    collisions = contexts.intersection(str(x).lower() for x in track.get("avoid", []))
    if collisions:
        out.append(f"{tid}: explicitly avoided context(s): {', '.join(sorted(collisions))}")
    traits = {str(x).lower() for x in track.get("traits", [])}
    collisions = avoid.intersection(traits)
    if collisions:
        out.append(f"{tid}: brief rejects its trait(s): {', '.join(sorted(collisions))}")
    return out


def select_track(tracks: list[dict], brief: dict) -> dict | None:
    """A missing fit means no bed. It never means 'pick the only file on disk'."""
    fitting = [t for t in tracks if not fit_problems(t, brief)]
    if not fitting:
        return None
    moods = {str(x).strip().lower() for x in
             (brief.get("moods") or [brief.get("mood")]) if str(x).strip()}
    fitting.sort(key=lambda t: (-len(moods.intersection(
        str(x).strip().lower() for x in t.get("moods", []))), t["id"]))
    return fitting[0]


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
            "file": "assets/music/sallie_gooden_1923.mp3", "verified_on": "2026-08-14",
            "modified": True, "enabled": True, "moods": ["measured"],
            "uses": ["policy-history"], "avoid": ["data-centers"],
            "traits": ["acoustic", "restrained"], "energy": "low",
            "era_texture": "clean acoustic recording", "era_fit": ["contemporary"],
            "speech_masking": "low", "mix_gap_db": 18,
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
          "file": "assets/music/x.mp3", "verified_on": "2026-08-14",
          "enabled": False, "moods": ["archival"], "uses": ["music-history"],
          "avoid": [], "traits": ["shellac-noise"], "energy": "medium",
          "era_texture": "archival shellac", "era_fit": ["1920s"],
          "speech_masking": "high", "mix_gap_db": 20}
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
    ok("an enabled catalogue row with no playable asset is refused",
       any("playable asset is missing" in p for p in problems_with(
           dict(good, id="missing", file="assets/music/does-not-exist.wav"))))

    brief = {"moods": ["measured"], "use": "policy-history", "energy": "low",
             "era": "contemporary", "avoid": ["busy-midrange"], "topics": ["water"]}
    ok("a track must match mood, use, energy, era, and avoid tags",
       not fit_problems(good, brief))
    ok("an explicitly avoided story context rejects the track",
       any("avoided context" in p for p in fit_problems(
           good, dict(brief, topics=["data-centers"]))))
    ok("no matching track resolves to no bed",
       select_track([good], dict(brief, energy="high")) is None)

    # THE SHIPPING GATE must actually fail
    ok("a film with no credits is refused", bool(verify_film("", good)))
    ok("a film whose credits omit the artist is refused",
       any("artist" in p for p in verify_film('MUSIC "Caliche Road" CC BY 4.0', good)))
    ok("a film whose credits omit the licence is refused",
       any("licence" in p.lower() for p in verify_film('MUSIC "Caliche Road" by A Texan', good)))
    ok("a complete credits block passes", not verify_film(credits_block([good]), good))

    import tempfile
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        credits, mix_report = root / "credits.txt", root / "mix.json"
        board, master = root / "board.json", root / "mix.wav"
        prepared, preparation = root / "bed.wav", root / "bed-preparation.json"
        credits.write_text(credits_block([good]) + "\n", encoding="utf-8")
        board.write_text(json.dumps({"credits": credits.read_text()}) + "\n", encoding="utf-8")
        master.write_bytes(b"master")
        prepared.write_bytes(b"prepared-bed")
        source_hash = file_sha256(REPO / good["file"])
        preparation.write_text(json.dumps({
            "schema": "dispatch_music_preparation/1", "track_id": "t1",
            "source_sha256": source_hash, "prepared_sha256": file_sha256(prepared),
            "time_stretch": 1.0}) + "\n", encoding="utf-8")
        base_mix = {"bed": True, "bed_track_id": "t1", "bed_gap_below_voice_db": 18,
                    "bed_file": str(prepared), "bed_file_sha256": file_sha256(prepared),
                    "bed_source_sha256": source_hash,
                    "bed_preparation_manifest": str(preparation),
                    "bed_preparation_sha256": file_sha256(preparation),
                    "master_sha256": file_sha256(master)}
        mix_report.write_text(json.dumps(base_mix) + "\n",
                              encoding="utf-8")
        ok("a mixed bed is bound to its registry row, approved gap, and exact credit",
           not verify_package(credits, mix_report, board, master, [good]))
        mix_report.write_text(json.dumps(dict(base_mix, bed_track_id="wrong")) + "\n")
        ok("a generic or substituted bed id is refused",
           any("not in the registry" in x
               for x in verify_package(credits, mix_report, board, master, [good])))
        mix_report.write_text(json.dumps(dict(base_mix, bed_gap_below_voice_db=12)) + "\n")
        ok("a bed mixed above its approved level is refused",
           any("approved registry metadata" in x
               for x in verify_package(credits, mix_report, board, master, [good])))
        prepared.write_bytes(b"substituted-bed")
        mix_report.write_text(json.dumps(base_mix) + "\n")
        ok("a prepared asset changed after mixing is refused",
           any("prepared bed" in x
               for x in verify_package(credits, mix_report, board, master, [good])))
        prepared.write_bytes(b"prepared-bed")
        no_bed_mix = {"bed": False, "bed_track_id": None,
                      "master_sha256": file_sha256(master)}
        mix_report.write_text(json.dumps(no_bed_mix) + "\n")
        ok("a no-bed mix is refused a stray music credit",
           any("credits music" in x
               for x in verify_package(credits, mix_report, board, master, [good])))
        credits.write_text("", encoding="utf-8")
        board.write_text('{"credits": ""}\n', encoding="utf-8")
        ok("no bed and no music credit is a clean package",
           not verify_package(credits, mix_report, board, master, [good]))

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


def verify_package(credits_path: Path, mix_path: Path, board_path: Path, master_path: Path,
                   tracks: list[dict]) -> list[str]:
    """Bind the recorded bed id, registry approval, mix level, and generated credit.

    Crediting a bed the film does not contain is merely untrue. Containing one the film
    does not credit is USING THE WORK WITHOUT THE LICENCE, because for CC BY and for a
    public-domain recording being attributed, the credit is the whole of what is owed.
    This check existed for the string and not for the sound: it read the end card and had
    no idea whether any music was in the mix. `mix.py` now records the bed and this reads
    both sides.
    """
    errs: list[str] = []
    if not mix_path.is_file():
        return [f"the mix report is missing at {mix_path}; bed use cannot be verified"]
    try:
        mix_report = json.loads(mix_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read the mix report {mix_path}: {exc}"]
    try:
        credits_text = credits_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        credits_text = ""
    except OSError as exc:
        return [f"cannot read credits {credits_path}: {exc}"]
    try:
        board = json.loads(board_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"cannot read the rendered board {board_path}: {exc}"]
    rendered_credits = str(board.get("credits") or "")
    if " ".join(rendered_credits.split()) != " ".join(credits_text.split()):
        errs.append("the board Remotion renders does not carry the exact generated credits.txt. "
                    "A correct sidecar cannot pay a licence for a credit absent from the film.")
    if not master_path.is_file():
        errs.append(f"the mixed master is missing at {master_path}")
    elif mix_report.get("master_sha256") != file_sha256(master_path):
        errs.append("the mixed master differs from the audio hash recorded by mix.py")
    credited = bool(re.search(r"(?im)^\s*MUSIC\s*$", credits_text))
    mixed = bool(mix_report.get("bed"))
    if credited and not mixed:
        errs.append("the end card credits music and mix.json records no bed. Either the "
                    "bed was never passed to mix.py, or the credit names a track the film "
                    "does not contain.")
    if mixed and not credited:
        errs.append("mix.json records a music bed and the end card credits none. THAT IS "
                    "THE LICENCE UNPAID: for these licences the credit is the whole of "
                    "what is owed for the use.")
    if not mixed:
        stale = [name for name in ("bed_track_id", "bed_file_sha256", "bed_source_sha256")
                 if mix_report.get(name)]
        if stale:
            errs.append("mix.json records no bed but still carries bed evidence: "
                        + ", ".join(stale))
        return errs

    track_id = str(mix_report.get("bed_track_id") or "").strip()
    if not track_id:
        errs.append("mix.json records a bed but no bed_track_id. The old generic 'bed' label "
                    "cannot prove which recording is in the film.")
        return errs
    by_id = {str(t.get("id")): t for t in tracks}
    track = by_id.get(track_id)
    if not track:
        errs.append(f"mix.json names bed {track_id!r}, which is not in the registry")
        return errs
    errs.extend(problems_with(track))
    if track.get("enabled") is not True:
        errs.append(f"{track_id}: the mixed bed is disabled")
    errs.extend(verify_film(credits_text, track))
    source = REPO / str(track.get("file") or "")
    if not source.is_file() or mix_report.get("bed_source_sha256") != file_sha256(source):
        errs.append(f"{track_id}: the registry source differs from the source hash mix.py used")
    prepared_value = str(mix_report.get("bed_file") or "")
    prepared = repo_path(prepared_value) if prepared_value else Path("")
    if not prepared_value or not prepared.is_file() \
            or mix_report.get("bed_file_sha256") != file_sha256(prepared):
        errs.append(f"{track_id}: the prepared bed is missing or differs from the file mix.py used")
    prep_value = str(mix_report.get("bed_preparation_manifest") or "")
    prep_path = repo_path(prep_value) if prep_value else Path("")
    try:
        prep = json.loads(prep_path.read_text(encoding="utf-8"))
        prep_hash_ok = mix_report.get("bed_preparation_sha256") == file_sha256(prep_path)
        prep_fields_ok = (prep.get("schema") == "dispatch_music_preparation/1"
                          and prep.get("track_id") == track_id
                          and prep.get("source_sha256") == mix_report.get("bed_source_sha256")
                          and prep.get("prepared_sha256") == mix_report.get("bed_file_sha256")
                          and float(prep.get("time_stretch")) == 1.0)
        if not prep_hash_ok or not prep_fields_ok:
            errs.append(f"{track_id}: the preparation manifest is changed or does not bind the "
                        "same source and prepared audio")
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        errs.append(f"{track_id}: the hash-bound music preparation manifest is missing or invalid")
    try:
        actual_gap = float(mix_report.get("bed_gap_below_voice_db"))
        approved_gap = float(track.get("mix_gap_db"))
        if abs(actual_gap - approved_gap) > 0.01:
            errs.append(f"{track_id}: mix.json used a {actual_gap:g} dB bed gap but the approved "
                        f"registry metadata requires {approved_gap:g} dB")
    except (TypeError, ValueError):
        errs.append(f"{track_id}: mix.json or the registry has no numeric approved bed gap")
    return errs


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--credits", metavar="TRACK_ID")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--select", action="store_true",
                    help="select a fitting enabled asset, or print NO_BED")
    ap.add_argument("--fit", metavar="TRACK_ID",
                    help="prove one enabled asset fits --brief")
    ap.add_argument("--brief", metavar="JSON",
                    help="sound brief with moods, use, energy, era, avoid, and topics")
    ap.add_argument("--verify-film", metavar="CREDITS_TXT")
    ap.add_argument("--verify-package", metavar="CREDITS_TXT",
                    help="bind mix.json bed identity and level to the registry and credit")
    ap.add_argument("--mix", default="out/dispatch/mix.json",
                    help="mix report used by --verify-package")
    ap.add_argument("--board", default="out/dispatch/storyboard.json",
                    help="exact rendered board used by --verify-package")
    ap.add_argument("--master", default="out/dispatch/mix.wav",
                    help="mixed master whose hash is used by --verify-package")
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
            mark = "ready" if t in usable(tracks) else ("off  " if not problems_with(t) else "NO   ")
            print(f"  {mark} {t.get('id'):24} {t.get('licence'):18} {t.get('title')}")
        if not tracks:
            print("  (registry is empty: no vetted track has been added yet)")
        return 0

    if a.select or a.fit:
        if not a.brief:
            print("music: --select and --fit require --brief", file=sys.stderr)
            return 2
        try:
            brief = json.loads(Path(a.brief).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"music: cannot read brief: {exc}", file=sys.stderr)
            return 2
        if a.fit:
            track = by_id.get(a.fit)
            if not track:
                print(f"music: no track '{a.fit}' in the registry", file=sys.stderr)
                return 2
            probs = fit_problems(track, brief)
            if probs:
                for p in probs:
                    print(f"  - {p}", file=sys.stderr)
                print("music: this bed does not fit. Ship with no bed.", file=sys.stderr)
                return 1
            print(f"music: {track['id']} fits; mix it {track['mix_gap_db']} dB below the voice")
            return 0
        track = select_track(tracks, brief)
        if track is None:
            print("NO_BED")
        else:
            print(track["id"])
        return 0

    if a.credits:
        t = by_id.get(a.credits)
        if not t:
            print(f"music: no track '{a.credits}' in the registry", file=sys.stderr)
            return 2
        probs = problems_with(t)
        if t.get("enabled") is not True:
            probs.append(f"{t['id']}: disabled; no approved playable asset")
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
        if t.get("enabled") is not True:
            probs.append(f"{t['id']}: disabled; no approved playable asset")
        for p in probs:
            print(f"  - {p}", file=sys.stderr)
        if probs:
            print("music: the film may not ship with this track", file=sys.stderr)
            return 1
        print(f"music: credit for '{t['id']}' is present and complete.")
        return 0

    if a.verify_package:
        probs = verify_package(Path(a.verify_package), Path(a.mix), Path(a.board),
                               Path(a.master), tracks)
        for p in probs:
            print(f"  - {p}", file=sys.stderr)
        if probs:
            print("music: bed, registry, mix, and credit do not form one package", file=sys.stderr)
            return 1
        print("music: bed choice, approved level, and generated credit form one package")
        return 0

    print("music: pass --check, --list, --select/--fit with --brief, --credits ID, "
          "--verify-film FILE --track ID, --verify-package CREDITS --mix MIX, "
          "or --self-test", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
