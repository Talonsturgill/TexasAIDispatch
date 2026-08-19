#!/usr/bin/env python3
"""registry_check.py — a drawing nothing can stage is dead weight.

WHY THIS EXISTS, AND THE WAY IT CAME TO EXIST

`video-engine/src/lib/registry.tsx` opens by claiming this file already did the
job:

    EVERY PLACEABLE THING IS REACHABLE FROM DATA. [...] `registry_check.py` walks
    the library and fails on any export that is missing here.

It did not exist. The header was written in the same session as the registry and
the checker was never built, so the guarantee lived entirely in a comment, in the
one repo whose founding fault is *moving a thing over and forgetting to wire it
up*. `wiring_check.py` could not catch it either: it checks that every script on
disk is invoked and that every script a prompt names exists, and a script named
only in a TSX comment is invisible to both directions.

So, the two directions, for drawings:

  ORPHAN DRAWING. A component in a stageable module that no name in `ELEMENTS`
  points at. It cannot appear in a Dispatch at all, however well it is drawn, and
  the library reads as though it can. This is the fauna sheet problem one level
  up: the review surface renders it, so it looks finished, and no board can reach
  it.

  GHOST ENTRY. A name in `ELEMENTS` pointing at something the module does not
  export. `tsc` catches the plain case of that, and does NOT catch it through the
  namespace-import indexing this registry uses, so it is checked here.

STAGEABLE is a declared list rather than a guess, and each exclusion carries its
reason. "It is not stageable" is what an orphan says about itself.

    registry_check.py
    registry_check.py --self-test

Exit 0 clean, 1 something is unreachable or missing, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LIB = REPO / "video-engine" / "src" / "lib"
REGISTRY = LIB / "registry.tsx"

# Modules whose exported components a board may place. Everything in one of these
# has to be in ELEMENTS.
STAGEABLE = [
    "kit", "fauna", "vehicles", "civics", "sensing",
    "agriculture", "freight", "compute", "clinic", "water", "plantfloor",
    # the nostalgia layer
    "flora", "skies", "roadside", "hometown", "homeplace", "tejano", "blacktexas",
    "football",
]

# Everything else, with the reason. A module is excluded because of WHAT IT IS,
# never because listing it would make this checker go red.
NOT_STAGEABLE = {
    "lighting": "light, ramps and surface treatments. Applied to a drawing, not placed as one.",
    "materials": "pattern defs emitted once per document by MaterialDefs.",
    "motion": "timing functions and the idle rig. No geometry of its own.",
    "stage3d": "the camera and the plane stack. A scene is built OF these, not staged with them.",
    "biomes": "the region wrapper a scene opens with. Dispatch mounts it directly.",
    "Character": "the cast rig, reached through the `person` name so a scene names a cast id.",
    "voice": "VO timing data for the mouth, not a drawing.",
    "registry": "this map.",
    "uid": "per-instance paint-server ids.",
    "scale": "the metre and the seeded rng. Numbers, not geometry.",
    "type": "how wide a string is and where to break it. Measurements, not geometry.",
    "safearea": "where the FEED puts its own furniture, so the film knows not to draw there. "
                "Two fractions and the frame they are fractions of. Nothing is staged with it, "
                "the film's screen-space chrome is SOLVED against it, and safe_area_check "
                "refuses a typed number in that geometry even when the number is legal.",
    "fonts": "the @font-face block and the hold that waits for it. Every composition carries it through withFonts, and composition_check refuses one that does not.",
}

# Components inside a stageable module that are deliberately not placeable on their
# own, each with the reason it is reached another way.
INTERNAL = {
    "MaterialDefs": "emitted once per document, not once per element",
}


def exported_components(src: str) -> list[str]:
    """Every `export const X: React.FC<...>` in a module.

    Only React components. A module may export a helper, a size table or a type
    without that being a drawing, and treating `SIZE_M` as an orphan drawing would
    be the kind of noise that gets a checker switched off.
    """
    return re.findall(r"^export const ([A-Z][A-Za-z0-9]*): React\.FC", src, re.M)


def registry_entries(src: str) -> dict[str, tuple[str, str]]:
    """`{name: (module_alias, Component)}` from the ELEMENTS map."""
    m = re.search(r"export const ELEMENTS: Record<string, React\.FC<any>> = \{(.*?)\n\};",
                  src, re.S)
    if not m:
        raise ValueError("could not find the ELEMENTS map. This checker reads it by "
                         "shape, so a change to that declaration has to come here too.")
    out: dict[str, tuple[str, str]] = {}
    for name, alias, comp in re.findall(
            r"^\s*([A-Za-z][A-Za-z0-9]*):\s*([A-Z][A-Za-z0-9]*)\.([A-Z][A-Za-z0-9]*),",
            m.group(1), re.M):
        out[name] = (alias, comp)
    return out


def alias_map(src: str) -> dict[str, str]:
    """`{alias: module}` from the namespace imports at the top of the registry."""
    return {alias: mod for mod, alias in
            [(mod, alias) for alias, mod in
             re.findall(r"import \* as ([A-Za-z]+) from '\./([A-Za-z]+)';", src)]}


def check(lib: Path = LIB, registry: Path = REGISTRY,
          stageable: list[str] | None = None) -> list[str]:
    stageable = STAGEABLE if stageable is None else stageable
    problems: list[str] = []

    rsrc = registry.read_text(encoding="utf-8")
    entries = registry_entries(rsrc)
    aliases = alias_map(rsrc)

    # Which component each module actually exports.
    exports: dict[str, list[str]] = {}
    for mod in stageable:
        p = lib / f"{mod}.tsx"
        if not p.exists():
            problems.append(f"MISSING MODULE: {mod}.tsx is listed as stageable and is not "
                            f"on disk.")
            continue
        exports[mod] = exported_components(p.read_text(encoding="utf-8"))

    registered: set[tuple[str, str]] = set()
    for name, (alias, comp) in entries.items():
        mod = aliases.get(alias)
        if mod is None:
            problems.append(f"UNKNOWN ALIAS: ELEMENTS['{name}'] uses `{alias}` and no "
                            f"`import * as {alias}` is at the top of the registry.")
            continue
        registered.add((mod, comp))
        if mod in exports and comp not in exports[mod]:
            problems.append(
                f"GHOST ENTRY: ELEMENTS['{name}'] points at {alias}.{comp} and {mod}.tsx "
                f"exports no such component. A namespace import does not make tsc check "
                f"this, so a board naming '{name}' fails at render time with the run's "
                f"work already done.")

    for mod in stageable:
        for comp in exports.get(mod, []):
            if comp in INTERNAL or (mod, comp) in registered:
                continue
            problems.append(
                f"ORPHAN DRAWING: {mod}.tsx exports {comp} and no name in ELEMENTS points "
                f"at it, so no board can ever stage it. Register it, or move it out of a "
                f"stageable module, or list it in INTERNAL with the reason it is reached "
                f"another way.")

    # And the declared list has to actually cover the library, or a whole module
    # could be added and go unwatched.
    on_disk = {p.stem for p in lib.glob("*.tsx")} | {p.stem for p in lib.glob("*.ts")}
    unclassified = sorted(on_disk - set(stageable) - set(NOT_STAGEABLE))
    for mod in unclassified:
        problems.append(
            f"UNCLASSIFIED MODULE: {mod} is in the library and is in neither STAGEABLE nor "
            f"NOT_STAGEABLE. A new module has to be declared one or the other, because the "
            f"default is silence and silence is how this check stops covering anything.")
    return problems


def self_test() -> int:
    import tempfile
    failures = 0

    def ok(label, cond, extra=""):
        nonlocal failures
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            failures += 1

    ok("a React.FC export is read as a drawing",
       exported_components("export const Pumpjack: React.FC<KitProps> = () => null;")
       == ["Pumpjack"])
    ok("...and a size table is NOT",
       exported_components("export const SIZE_M: Record<string, number> = {};") == [])
    ok("...and a plain helper is not either",
       exported_components("export function fit(a: number) { return a; }") == [])

    reg = ("import * as Kit from './kit';\n"
           "export const ELEMENTS: Record<string, React.FC<any>> = {\n"
           "  pumpjack: Kit.Pumpjack,\n"
           "  windmill: Kit.Windmill,\n"
           "};\n")
    ok("the ELEMENTS map parses to names and targets",
       registry_entries(reg) == {"pumpjack": ("Kit", "Pumpjack"),
                                 "windmill": ("Kit", "Windmill")},
       str(registry_entries(reg)))
    ok("...and the namespace imports resolve", alias_map(reg) == {"Kit": "kit"})

    with tempfile.TemporaryDirectory() as td:
        lib = Path(td)
        (lib / "kit.tsx").write_text(
            "export const Pumpjack: React.FC<any> = () => null;\n"
            "export const Windmill: React.FC<any> = () => null;\n", encoding="utf-8")
        r = lib / "registry.tsx"
        r.write_text(reg, encoding="utf-8")

        ok("a fully registered library is CLEAN",
           check(lib, r, ["kit"]) == [], str(check(lib, r, ["kit"])))

        # THE ORPHAN. The whole reason for the file.
        (lib / "kit.tsx").write_text(
            "export const Pumpjack: React.FC<any> = () => null;\n"
            "export const Windmill: React.FC<any> = () => null;\n"
            "export const CattleGuard: React.FC<any> = () => null;\n", encoding="utf-8")
        got = check(lib, r, ["kit"])
        ok("a drawing no name points at is REJECTED",
           len(got) == 1 and "ORPHAN DRAWING" in got[0] and "CattleGuard" in got[0],
           str(got))

        # THE GHOST, which tsc does not catch through a namespace import.
        r.write_text(reg.replace("  windmill: Kit.Windmill,\n",
                                 "  windmill: Kit.Windmill,\n  auger: Kit.Auger,\n"),
                     encoding="utf-8")
        (lib / "kit.tsx").write_text(
            "export const Pumpjack: React.FC<any> = () => null;\n"
            "export const Windmill: React.FC<any> = () => null;\n", encoding="utf-8")
        got = check(lib, r, ["kit"])
        ok("a name pointing at a component that does not exist is REJECTED",
           len(got) == 1 and "GHOST ENTRY" in got[0] and "Auger" in got[0], str(got))

        # A NEW MODULE nobody declared.
        r.write_text(reg, encoding="utf-8")
        (lib / "kit.tsx").write_text(
            "export const Pumpjack: React.FC<any> = () => null;\n"
            "export const Windmill: React.FC<any> = () => null;\n", encoding="utf-8")
        (lib / "gizmos.tsx").write_text(
            "export const Gizmo: React.FC<any> = () => null;\n", encoding="utf-8")
        got = check(lib, r, ["kit"])
        ok("a module in neither list is REJECTED rather than ignored",
           len(got) == 1 and "UNCLASSIFIED MODULE" in got[0] and "gizmos" in got[0],
           str(got))

    real = check()
    ok("the real library is fully registered", not real, "\n      " + "\n      ".join(real))

    if failures:
        print(f"\nregistry_check self-test: {failures} FAILED", file=sys.stderr)
        return 1
    print("\nregistry_check self-test: all passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    try:
        problems = check()
    except (OSError, ValueError) as exc:
        print(f"registry_check: cannot run: {exc}", file=sys.stderr)
        return 2
    if problems:
        print(f"registry: {len(problems)} problem(s)\n", file=sys.stderr)
        for x in problems:
            print(f"  - {x}", file=sys.stderr)
        return 1
    n = len(registry_entries(REGISTRY.read_text(encoding="utf-8")))
    print(f"registry: clean. {n} placeable names, every drawing reachable, "
          f"every name real.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:                                            # noqa: BLE001
        print(f"registry_check: broke: {exc}", file=sys.stderr)
        sys.exit(2)
