#!/usr/bin/env python3
"""dedupe.py — the variety engine's memory. What has already been made, and how it looked.

WHY THIS EXISTS

Two Dispatches can be about different subjects and be the same film. The sibling in Alaska has the
scar and wrote it down: it shipped "a salmon video that looked just like the damn beluga video",
and its free-text archetype label never caught it because both entries read as "single-hero
portrait". **A NEW SUBJECT IS NOT A NEW COMPOSITION.**

So this ledger stores two different memories per run and they are checked separately:

  THE TOPIC, so the same story is not covered twice inside the window.
  THE COMPOSITION FINGERPRINT, so the same PICTURE is not made twice, whatever it is about.

`storyboard_check.py` reads the fingerprints and refuses a re-skin BEFORE a frame is rendered,
which is the only place that check is cheap.

THE STOPWORD LIST IS THE HARD-WON PART, and it is copied in spirit rather than in content.

The sibling's `check` calls a duplicate on any two shared word tokens, which is the right
threshold, but its tokeniser split multi-word entities into single words and the words it says in
EVERY dispatch were voting. It measured four consecutive refusals on pairs like machine+learning
and alaska+anchorage, and not one of them named a subject. A gate that is structurally incapable of
returning FRESH teaches a run to argue past it, which is exactly the ledger-gaming the routine bans
everywhere else.

The Texas version of that failure is worse, not better: this channel says texas, ai, data, center,
grid and ercot constantly, and houston plus dallas is a guaranteed pair for a state show. So the
fix is at the TOKENISER and never at the threshold. Geography the channel is named after, the
technology it is named after, and the institutions that recur across a third of the archive are
removed BEFORE the count. Everything that names a SUBJECT still votes.

    dedupe.py list --days 30
    dedupe.py check --entities "aurora,driverless,i-45" --beat the-road
    dedupe.py add --date 2026-08-12 --topic "..." --slug dispatch-... --beat the-road \\
                  --entities "a,b,c" --fingerprint out/dispatch/storyboard.json
    dedupe.py --self-test

Exit 0 fresh, 1 a repeat, 2 the tool could not run.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LEDGER = REPO / "ledger" / "dispatch_history.json"

# TOKENS THAT CARRY NO SUBJECT, SO THEY MAY NOT DECIDE A REPEAT.
#
# Every word here appears in a large share of this channel's entries by construction. If they are
# allowed to vote, the gate returns a duplicate on every run and stops meaning anything. Add a word
# here ONLY with the self-test green, because the self-test asserts that two genuinely different
# stories come back fresh AND that two genuinely identical ones do not.
STOP = {
    # grammar
    "the", "a", "an", "of", "in", "and", "for", "to", "on", "with", "by", "at", "as", "from",
    # the channel's own name, in every entry
    "ai", "artificial", "intelligence", "machine", "learning", "ml", "model", "models",
    "algorithm", "algorithms", "data", "system", "systems", "tech", "technology", "software",
    "automation", "automated", "autonomous", "digital", "compute", "computing",
    # the subject matter the channel is named after as much as the technology. "grid" was left
    # out of the first version and the self-test caught it immediately: it is a word this show
    # says on almost every run, so letting it vote is letting the channel name itself a repeat.
    "grid", "power", "electricity", "electric", "datacenter", "datacentre",
    # units, which appear across a third of entries and never name a subject
    "megawatt", "megawatts", "gigawatt", "gigawatts", "mw", "gw", "kilowatt", "acre", "acres",
    "percent", "million", "billion", "dollar", "dollars",
    # the state this channel is about, and the places it keeps happening in
    "texas", "texan", "texans", "tx", "state", "statewide", "lone", "star",
    "houston", "dallas", "austin", "san", "antonio", "fort", "worth", "el", "paso",
    "permian", "panhandle", "gulf", "coast", "hill", "country", "west", "east", "north", "south",
    "county", "counties", "city", "town",
    # the institutions and instruments that recur across a third of the archive
    "ercot", "puct", "puc", "rrc", "tceq", "twdb", "dir", "tea", "legislature", "commission",
    "university", "ut", "texas am", "tacc", "nsf", "doe", "epa", "nih", "federal", "governor",
    "docket", "filing", "rule", "rulemaking", "comment", "hearing", "bill", "session",
    "grant", "grants", "award", "awards", "project", "program", "research", "study",
    # organisation-shaped nouns that describe a form, never a subject
    "institute", "center", "centre", "department", "division", "office", "agency", "authority",
    "association", "corporation", "consortium", "council", "board", "bureau", "company", "inc",
    "llc", "corp",
    # citation scaffolding
    "fr", "cfr", "usc", "doc", "no", "vol", "id", "et", "al",
}

# Two shared SUBJECT tokens is a repeat. The threshold is the sibling's and it is right; what
# went wrong there was the tokeniser, which is why STOP above is long and this number is small.
DUP_TOKENS = 2

DEFAULT_DAYS = 30


def tokens(s: str) -> set[str]:
    """Subject-bearing tokens only. Stopwords are removed BEFORE anything counts."""
    return {w for w in re.findall(r"[a-z0-9']+", (s or "").lower())
            if w not in STOP and len(w) > 2}


def load() -> dict:
    if not LEDGER.exists():
        return {"dispatches": []}
    return json.loads(LEDGER.read_text(encoding="utf-8"))


def save(d: dict) -> None:
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    LEDGER.write_text(json.dumps(d, indent=2) + "\n", encoding="utf-8")


def recent(d: dict, days: int, today: str | None = None) -> list[dict]:
    """The window, which is a real window even when nobody passed a date.

    THIS RETURNED THE WHOLE LEDGER when `today` was None, and neither `list` nor
    `check` passes `--today`, so `--days` was a silent no-op on every real
    invocation and the window was the entire history. That direction of failure is
    the dangerous one: a window that never ends does not miss repeats, it invents
    them, and a gate that calls a genuinely new story a repeat is a gate a run
    learns to argue past. The docstring at the top of this file says so about the
    tokeniser and the same is true of the window.

    So the default is TODAY, and `--today` stays an override for tests rather than
    the only thing that makes the parameter mean anything.
    """
    cut = dt.date.fromisoformat(today or dt.date.today().isoformat()) - dt.timedelta(days=days)
    out = []
    for e in d.get("dispatches", []):
        try:
            if dt.date.fromisoformat(e.get("date", "")) >= cut:
                out.append(e)
        except ValueError:
            out.append(e)
    return out


def check_entities(entries: list[dict], ents: str) -> tuple[bool, str]:
    """FRESH, or the entry it collides with and the tokens that decided it."""
    mine = tokens(ents)
    if not mine:
        return False, ("no subject-bearing entities at all. Every word given was a stopword, which "
                       "means the entity list describes the channel rather than the story.")
    for e in entries:
        theirs = tokens(" ".join([e.get("topic", ""), " ".join(e.get("entities", []) or [])]))
        shared = mine & theirs
        if len(shared) >= DUP_TOKENS:
            return False, (f"overlaps {e.get('date')} \"{e.get('topic', '')[:60]}\" on "
                           f"{sorted(shared)}. Those are SUBJECT tokens, not channel words, so this "
                           f"is the same story.")
    return True, "fresh"


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    # THE FAILURE MODE THE SIBLING MEASURED, in its Texas form.
    ok("channel words carry no subject",
       tokens("Texas AI data center ERCOT grid Houston") == set(),
       str(tokens("Texas AI data center ERCOT grid Houston")))
    ok("...so two unrelated stories described in channel words do not collide",
       check_entities([{"date": "2026-08-01", "topic": "Texas AI data center",
                        "entities": ["ERCOT", "grid", "Houston"]}],
                      "Texas AI data center ERCOT Dallas")[0] is False)
    # ^ that one is refused for having NO subject tokens at all, which is the correct answer and a
    #   different answer from "this is a repeat". Check the reason, not just the boolean.
    fresh, why = check_entities([{"date": "2026-08-01", "topic": "Texas AI data center",
                                  "entities": ["ERCOT", "grid"]}],
                                "Texas AI ERCOT grid data")
    ok("...and the reason says the entity list described the channel",
       "describes the channel" in why or "describe" in why, why)

    hist = [
        {"date": "2026-08-01", "topic": "Aurora runs driverless freight to El Paso",
         "entities": ["Aurora", "driverless", "freight", "interstate"]},
        {"date": "2026-08-05", "topic": "Variable-rate pivots over the Ogallala",
         "entities": ["Ogallala", "pivot", "irrigation", "cotton"]},
    ]
    ok("a genuinely new story is FRESH",
       check_entities(hist, "MD Anderson, contouring, radiotherapy, sepsis")[0])
    ok("a genuine repeat is refused",
       not check_entities(hist, "Aurora, driverless, trucking")[0])
    ok("...and the message names the tokens that decided it",
       "aurora" in check_entities(hist, "Aurora, driverless, trucking")[1])
    ok("one shared token is not enough",
       check_entities(hist, "Aurora, contouring, radiotherapy")[0],
       "a single overlap is a coincidence; two is a subject")
    # THIS ASSERTION USED TO END IN `or True`, which made it the one line in this
    # file that could not go red. It was also testing the wrong thing: its fixture
    # shared "ogallala" with an earlier entry, so it only re-proved the line above
    # it about a single overlap. The label promised a story overlapping ONLY on
    # channel words, so that is what it stages now -- four shared words, every one
    # of them a stopword, no shared subject at all.
    channel = [{"date": "2026-08-01", "topic": "Texas AI data center filing at the commission",
                "entities": ["ERCOT", "docket", "rulemaking", "Abilene"]}]
    fresh_c, why_c = check_entities(channel, "Texas AI data center filing, MD Anderson, contouring")
    ok("a story overlapping a past one ONLY on channel words is fresh", fresh_c, why_c)
    ok("...and it really did share words, so that was not a miss",
       len({"texas", "ai", "data", "center", "filing"} &
           set(re.findall(r"[a-z0-9']+", channel[0]["topic"].lower()))) >= 4)

    # The window.
    d = {"dispatches": [{"date": "2026-01-01", "topic": "old"},
                        {"date": "2026-08-10", "topic": "new"}]}
    ok("the window drops what is out of range",
       [e["topic"] for e in recent(d, 30, "2026-08-12")] == ["new"],
       str([e["topic"] for e in recent(d, 30, "2026-08-12")]))
    ok("...and keeps what is inside it",
       len(recent(d, 400, "2026-08-12")) == 2)
    # THE WINDOW WITH NO DATE PASSED, which is every real invocation: neither `list`
    # nor `check` has a `--today`, so this path was the only one that ran and it
    # returned the whole ledger. `--days` did nothing at all.
    old = {"dispatches": [{"date": "1990-01-01", "topic": "long gone"},
                          {"date": dt.date.today().isoformat(), "topic": "today"}]}
    ok("the window applies even when nobody passes --today",
       [e["topic"] for e in recent(old, 30)] == ["today"],
       str([e["topic"] for e in recent(old, 30)]))
    ok("...and a wide enough window still reaches back",
       len(recent(old, 100000)) == 2)

    ok("an unparseable date is KEPT rather than silently dropped",
       len(recent({"dispatches": [{"date": "whenever", "topic": "x"}]}, 30, "2026-08-12")) == 1,
       "dropping it would let a malformed entry become a free pass to repeat")

    if failures:
        print(f"\ndedupe self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\ndedupe self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd")
    ap.add_argument("--self-test", action="store_true")

    pl = sub.add_parser("list")
    pl.add_argument("--days", type=int, default=DEFAULT_DAYS)
    pl.add_argument("--today")

    pc = sub.add_parser("check")
    pc.add_argument("--entities", required=True)
    pc.add_argument("--beat")
    pc.add_argument("--days", type=int, default=DEFAULT_DAYS)
    pc.add_argument("--today")

    pa = sub.add_parser("add")
    for f in ("date", "topic", "slug", "beat", "entities"):
        pa.add_argument(f"--{f}", required=f in ("date", "topic"))
    pa.add_argument("--fingerprint", help="out/dispatch/storyboard.json, for the composition memory")

    a = ap.parse_args()
    if a.self_test:
        return self_test()

    try:
        led = load()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"dedupe: cannot read the ledger: {exc}", file=sys.stderr)
        return 2

    if a.cmd == "list":
        entries = recent(led, a.days, a.today)
        print(f"# {len(entries)} Dispatch(es) in the last {a.days} days. Do not repeat these.")
        for e in entries:
            print(f"  {e.get('date')}  [{e.get('beat', '?')}]  {e.get('topic', '')}")
            if e.get("entities"):
                print(f"             entities: {', '.join(e['entities'])}")
        beats = [e.get("beat") for e in entries if e.get("beat")]
        if beats:
            counts = {b: beats.count(b) for b in set(beats)}
            print("\n# beats already used in the window, most recent first:")
            for b, n in sorted(counts.items(), key=lambda kv: -kv[1]):
                print(f"  {b}: {n}")
        return 0

    if a.cmd == "check":
        fresh, why = check_entities(recent(led, a.days, a.today), a.entities)
        print(("FRESH" if fresh else "DUP") + f": {why}")
        return 0 if fresh else 1

    if a.cmd == "add":
        entry = {"date": a.date, "topic": a.topic, "slug": a.slug, "beat": a.beat,
                 "entities": [x.strip() for x in (a.entities or "").split(",") if x.strip()]}
        if a.fingerprint:
            try:
                sb = json.loads(Path(a.fingerprint).read_text(encoding="utf-8"))
                entry["fingerprint"] = sb.get("fingerprint", {})
                entry["palette"] = (sb.get("fingerprint", {}) or {}).get("palette")
            except (OSError, json.JSONDecodeError) as exc:
                print(f"dedupe: cannot read the fingerprint: {exc}", file=sys.stderr)
                return 2
        else:
            print("dedupe: WARNING, no --fingerprint. The composition memory is how the next run "
                  "is stopped from re-skinning this one, and an entry without one is a free pass.",
                  file=sys.stderr)
        led.setdefault("dispatches", []).append(entry)
        save(led)
        print(f"dedupe: recorded {a.date} {a.topic!r}")
        return 0

    ap.print_help()
    return 2


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"dedupe: broke: {exc}", file=sys.stderr)
        sys.exit(2)
