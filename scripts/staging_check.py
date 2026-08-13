#!/usr/bin/env python3
"""staging_check.py — an animal has to belong where it is standing.

WHY THIS EXISTS

knowledge/texas/FAUNA_AND_FLORA.md ends by promising that "every animal is placed in
a region that actually has it", and names this file as what refuses a mis-placement.
Until it existed, that sentence was a hope. `fauna.tsx` exported a HABITAT map that
nothing on earth read.

THE DEFECT IT IS FOR. A pronghorn in the Piney Woods. It is the same class of error
as a Hill Country palette on a Panhandle story, and it is worse than a wrong colour
because a Texan can name it. Pronghorn are High Plains, Trans-Pecos and Rolling
Plains animals; East Texas has never had them. One frame like that costs the film
its authority with exactly the audience it was made for.

THREE THINGS IT CHECKS, and the second and third are the ones that catch the quiet
failures rather than the loud one.

  PLACEMENT. An animal staged inside <RegionLight region="X"> must list X in its
  HABITAT. This is the loud one and it is what the doctrine asks for.

  COVERAGE. Every animal component fauna.tsx exports must HAVE a HABITAT entry. A
  species added without one is invisible to the placement check forever, so the gate
  would keep passing while getting quieter. It found BatColumn missing on its first
  run, which is the whole argument for the check.

  TRUE SCALE. Every component that calls fit() must name a species in SIZE_M, and
  every SIZE_M entry must be used. `fauna.tsx` is built on the rule that scale={1}
  means one thing everywhere, and a fit() against a missing key or an orphan size
  entry is that rule quietly coming apart.

WHAT IT CANNOT SEE, said plainly. It reads TSX with regular expressions, so a region
passed through a variable, an animal rendered from a map over data, or a component
re-exported under another name are all beyond it. It is a lint, not a type system.
That is why COVERAGE matters more than PLACEMENT: coverage is exact.

A review sheet is not a scene and may carry, on its own line:

    // staging-check: exempt — <reason>

The reason is REQUIRED. An exemption nobody has to justify is a switch that gets
flipped once and never looked at again.

    staging_check.py
    staging_check.py --self-test

Exit 0 clean, 1 a problem, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ENGINE = REPO / "video-engine" / "src"
FAUNA = ENGINE / "lib" / "fauna.tsx"

# Components in fauna.tsx that are not animals and so carry no habitat or true size.
# Kept as an explicit list with reasons rather than a pattern, so adding one is a
# decision somebody wrote down.
NOT_AN_ANIMAL: dict[str, str] = {
    "HIDE": "a colour palette",
    "HABITAT": "the map itself",
    "SIZE_M": "the size table itself",
    "herdHides": "a helper that picks hides for a group",
}


def strip_comments(src: str) -> str:
    """Blank out comments, PRESERVING newlines so reported line numbers stay true.

    The engine's own lint learned this the hard way: it flagged a docstring that
    said a banned call was banned. A checker that reads its own advice as a
    violation is worse than no checker, because it trains you to ignore it.
    """
    out = []
    i, n = 0, len(src)
    while i < n:
        if src.startswith("//", i):
            j = src.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            out.append("".join(c if c == "\n" else " " for c in src[i:j]))
            i = j
        else:
            out.append(src[i])
            i += 1
    return "".join(out)


def parse_habitat(src: str) -> dict[str, list[str]]:
    m = re.search(r"HABITAT:\s*Record<[^>]*>\s*=\s*\{(.*?)\n\};", src, re.S)
    if not m:
        return {}
    out: dict[str, list[str]] = {}
    for key, body in re.findall(r"(\w+):\s*\[(.*?)\]", m.group(1), re.S):
        out[key] = re.findall(r"'([a-z_]+)'", body)
    return out


def parse_sizes(src: str) -> set[str]:
    m = re.search(r"SIZE_M:\s*Record<[^>]*>\s*=\s*\{(.*?)\n\};", src, re.S)
    return set(re.findall(r"(\w+):\s*\{ref:", m.group(1))) if m else set()


def parse_components(src: str) -> list[str]:
    """Exported React components, which is what a scene can actually stage."""
    return re.findall(r"export const (\w+):\s*React\.FC", src)


def parse_fit_calls(src: str) -> list[str]:
    return re.findall(r"fit\('(\w+)'", src)


def lower_first(name: str) -> str:
    return name[0].lower() + name[1:]


def scene_files() -> list[Path]:
    return sorted(p for p in ENGINE.glob("*.tsx"))


def exemption(src: str) -> tuple[bool, str]:
    m = re.search(r"staging-check:\s*exempt\s*(?:[-—]+\s*(.*))?", src)
    if not m:
        return False, ""
    return True, (m.group(1) or "").strip()


def region_blocks(src: str) -> list[tuple[str, str]]:
    """(region, body) for every wrapper that declares a region.

    ANY component, not just <RegionLight>. The first version matched RegionLight
    alone, and every real scene wraps its world in <Biome region="...">, so the
    placement check ran on the review sheet and on nothing else. It reported clean
    with a javelina standing in the Rolling Plains, which is a gate connected to
    nothing: the worst kind, because it is indistinguishable from a gate that works.

    So this matches any opening tag carrying a region prop whose value is one of the
    ten, and closes on that same tag. `blocks_scanned` below turns "found nothing
    anywhere" into a failure rather than a pass.

    Takes everything from the opening tag to the matching close, which over-reaches
    on nesting. Over-reaching is the safe direction: it can report an animal against
    an outer region, which is a false alarm a human resolves, rather than missing one.
    """
    out = []
    for m in re.finditer(r'<([A-Z]\w*)(?:\s[^>]*?)?\sregion=["\'](\w+)["\']', src):
        tag, region = m.group(1), m.group(2)
        if region not in REGIONS:
            continue
        # A SELF-CLOSING TAG HAS NO BLOCK.
        #
        # There is no `</Tag>` for `<Biome region="gulf" />`, so `find` returned -1 and the
        # block swallowed THE REST OF THE FILE: a correctly-wrapped scene further down had its
        # animals reported against the self-closed region as well, producing a false hard fail
        # on a placement that was right. The self-test assertion that claimed to cover this
        # passed only because its fixture's remainder happened to be 7 characters long.
        head_end = src.find(">", m.end())
        if head_end > 0 and src[m.end():head_end + 1].rstrip().endswith("/>"):
            out.append((region, ""))
            continue
        end = src.find(f"</{tag}>", m.end())
        if end < 0:
            # An unclosed tag is a broken file rather than a block reaching the end of it.
            out.append((region, ""))
            continue
        out.append((region, src[m.end():end]))
    return out


# The ten regions a wrapper may declare. Kept here rather than derived from the
# lighting module so this checker has no import into the engine it checks.
REGIONS = {"high_plains", "rolling_plains", "cross_timbers", "blackland", "post_oak",
           "piney_woods", "gulf", "south_texas", "hill_country", "trans_pecos"}


def check(verbose: bool = True) -> list[str]:
    if not FAUNA.exists():
        raise FileNotFoundError(f"no fauna at {FAUNA}")
    raw = FAUNA.read_text(encoding="utf-8")
    src = strip_comments(raw)

    habitat = parse_habitat(src)
    sizes = parse_sizes(src)
    comps = parse_components(src)
    fits = parse_fit_calls(src)
    problems: list[str] = []

    # ---- COVERAGE: every animal component has a habitat -----------------------
    for c in comps:
        if c in NOT_AN_ANIMAL:
            continue
        if lower_first(c) not in habitat:
            problems.append(
                f"{FAUNA.relative_to(REPO)}: <{c}> has no HABITAT entry, so nothing can "
                f"ever refuse it from a region it does not live in. Add "
                f"'{lower_first(c)}' to HABITAT, or list it in NOT_AN_ANIMAL with a reason.")

    for key in habitat:
        if key not in {lower_first(c) for c in comps}:
            problems.append(
                f"{FAUNA.relative_to(REPO)}: HABITAT has '{key}' but no component draws it. "
                f"A habitat for an animal that does not exist is a rule guarding nothing.")

    # ---- TRUE SCALE: fit() and SIZE_M agree -----------------------------------
    for species in fits:
        if species not in sizes:
            problems.append(
                f"{FAUNA.relative_to(REPO)}: fit('{species}') has no SIZE_M entry, so its "
                f"true size is undefined and scale={{1}} means nothing for it.")
    for key in sizes:
        if key not in fits:
            problems.append(
                f"{FAUNA.relative_to(REPO)}: SIZE_M declares '{key}' but nothing fits to it. "
                f"Either the drawing is not at true scale or the entry is dead.")

    # ---- PLACEMENT: an animal belongs where it stands -------------------------
    animals = {c for c in comps if c not in NOT_AN_ANIMAL}
    scanned = 0
    checked = 0
    for path in scene_files():
        text = path.read_text(encoding="utf-8")
        exempt, reason = exemption(text)
        if exempt:
            if not reason:
                problems.append(
                    f"{path.relative_to(REPO)}: claims a staging-check exemption with no "
                    f"reason. Write why after an em rule. An exemption nobody has to "
                    f"justify gets flipped once and never looked at again.")
            elif verbose:
                print(f"  exempt  {path.relative_to(REPO)}  ({reason})")
            continue
        checked += 1
        body = strip_comments(text)
        for region, block in region_blocks(body):
            scanned += 1
            for a in sorted(animals):
                if not re.search(rf"<{a}\b", block):
                    continue
                allowed = habitat.get(lower_first(a), [])
                if allowed and region not in allowed:
                    problems.append(
                        f"{path.relative_to(REPO)}: <{a}> staged in '{region}'. It lives in "
                        f"{', '.join(allowed)}. A Texan can name this one.")

    # ---- IS THIS CHECKER CONNECTED TO ANYTHING? -------------------------------
    # The question a green gate can never answer about itself. This one ran clean for
    # a while over zero region blocks, because it looked for a wrapper the scenes do
    # not use. Zero blocks across a repo full of scenes is not a pass, it is a
    # disconnected checker, and it fails here rather than reassuring anybody.
    if checked and not scanned:
        problems.append(
            f"scanned {checked} scene file(s) and found NO region blocks in any of them. "
            f"Either no scene declares a region, or this checker is looking for a wrapper "
            f"nothing uses. Both mean the placement rule is running on nothing, which is "
            f"worse than having no rule because it reads as a pass.")
    elif verbose and scanned:
        print(f"  scanned {scanned} region block(s) across {checked} scene file(s)")
    return problems


def self_test() -> int:
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    src = """
export const HABITAT: Record<string, string[]> = {
  pronghorn: ['high_plains', 'trans_pecos'],
  longhorn: ['hill_country', 'south_texas'],
};
export const SIZE_M: Record<string, {ref: number; dim: 'height'}> = {
  pronghorn: {ref: 0.87, dim: 'height'},
  longhorn: {ref: 1.45, dim: 'height'},
};
export const Pronghorn: React.FC<Beast> = () => { const K = fit('pronghorn', 90); };
export const Longhorn: React.FC<Beast> = () => { const K = fit('longhorn', 130); };
"""
    ok("habitat parses", parse_habitat(src)["pronghorn"] == ["high_plains", "trans_pecos"],
       str(parse_habitat(src)))
    ok("sizes parse", parse_sizes(src) == {"pronghorn", "longhorn"}, str(parse_sizes(src)))
    ok("components parse", parse_components(src) == ["Pronghorn", "Longhorn"],
       str(parse_components(src)))
    ok("fit calls parse", parse_fit_calls(src) == ["pronghorn", "longhorn"],
       str(parse_fit_calls(src)))

    # THE DEFECT THIS FILE IS FOR.
    scene = '<RegionLight region="piney_woods"><Pronghorn x={1} /></RegionLight>'
    blocks = region_blocks(scene)
    ok("a region block is found", blocks and blocks[0][0] == "piney_woods", str(blocks))
    ok("...and the pronghorn is inside it", "<Pronghorn" in blocks[0][1])
    ok("...and piney_woods is NOT in its habitat",
       "piney_woods" not in parse_habitat(src)["pronghorn"])

    # THE FAULT THAT MADE ALL OF THE ABOVE MEANINGLESS FOR A WHILE.
    #
    # Every real scene wraps its world in <Biome region="...">, not <RegionLight>.
    # Matching RegionLight alone meant this ran on the review sheet and on nothing
    # else, and it reported clean with a javelina standing in the Rolling Plains.
    # A gate connected to nothing is the worst kind: it is indistinguishable from a
    # gate that works, and it is the reason knowledge GATE_LESSONS exists.
    biome = '<Biome region="rolling_plains" frame={f}><Javelina x={1} /></Biome>'
    bb = region_blocks(biome)
    ok("a <Biome> wrapper is a region block too, not only <RegionLight>",
       bb and bb[0][0] == "rolling_plains", str(bb))
    ok("...and the animal inside it is seen", bb and "<Javelina" in bb[0][1])
    ok("a wrapper nobody anticipated works as well",
       region_blocks('<Establishing region="gulf"><Grackle /></Establishing>')[0][0] == "gulf")
    ok("a region value that is not a region is not a block",
       not region_blocks('<Card region="left"><Grackle /></Card>'))
    # THE ASSERTION THAT PASSED BY ACCIDENT. The old one checked the block was under 40
    # characters, and its fixture's remainder was 7, so it was satisfied by the fixture's
    # length rather than by any code. Appending 100 characters flipped it to False.
    long_tail = '<Biome region="gulf" />' + ("x" * 200) + \
                '<Biome region="high_plains"><Pronghorn/></Biome>'
    blocks = region_blocks(long_tail)
    ok("a self-closing tag yields an EMPTY block, whatever follows it",
       blocks[0] == ("gulf", ""), str(blocks[0]))
    ok("...so an animal further down the file is not reported against it",
       not any(b[0] == "gulf" and "Pronghorn" in b[1] for b in blocks), str(blocks))
    ok("...while the properly wrapped block below still carries its animal",
       any(b[0] == "high_plains" and "Pronghorn" in b[1] for b in blocks), str(blocks))
    ok("an UNCLOSED tag is an empty block rather than the rest of the file",
       region_blocks('<Biome region="gulf">' + "y" * 300)[0][1] == "")

    good = '<RegionLight region="trans_pecos"><Pronghorn x={1} /></RegionLight>'
    gb = region_blocks(good)
    ok("a pronghorn in the Trans-Pecos is fine", gb[0][0] in parse_habitat(src)["pronghorn"])

    # Comments must not be read as staging.
    commented = strip_comments('// <RegionLight region="piney_woods"> is wrong for a pronghorn\n')
    ok("a comment about a bad placement is not a bad placement", not region_blocks(commented))
    ok("...and stripping preserves line numbers",
       strip_comments("a\n// x\nb").count("\n") == 2)

    # Exemptions.
    ok("an exemption needs a reason", exemption("// staging-check: exempt")[1] == "")
    ok("...and a reason is carried",
       exemption("// staging-check: exempt — it is a reference sheet")[1]
       == "it is a reference sheet")
    ok("no marker is no exemption", not exemption("nothing here")[0])

    # Coverage: the check that found BatColumn.
    missing = src + "\nexport const Jackalope: React.FC<Beast> = () => {};\n"
    comps = parse_components(missing)
    ok("a species with no habitat entry is visible to the coverage check",
       "Jackalope" in comps and lower_first("Jackalope") not in parse_habitat(missing))

    # And the real repo. THE CONNECTIVITY ASSERTION comes first, because a clean
    # result over zero blocks is exactly the reassuring nothing this gate once was.
    import io
    import contextlib
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            real = check(verbose=True)
        out = buf.getvalue()
        m = re.search(r"scanned (\d+) region block", out)
        ok("this checker actually reaches the real scenes", bool(m) and int(m.group(1)) > 0,
           "it scanned ZERO region blocks in this repo, so the placement rule is running "
           "on nothing and a clean result below means nothing")
        ok("the repo itself is clean", not real, "\n      " + "\n      ".join(real))
    except FileNotFoundError as exc:
        ok("the repo itself is clean", False, str(exc))

    if failures:
        print(f"\nstaging_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nstaging_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        problems = check()
    except (OSError, FileNotFoundError) as exc:
        print(f"staging_check: cannot run: {exc}", file=sys.stderr)
        return 2
    if problems:
        print(f"staging check: {len(problems)} problem(s)\n", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    print("staging check: clean")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"staging_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
