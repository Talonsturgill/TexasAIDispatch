#!/usr/bin/env python3
"""asset_index.py: the shelf, as a list a run can read in two minutes.

The first daily film reused one truck drawing five times and put no person on screen, while the
library held a ten-person cast, a fleet, a bestiary and a dozen workplaces nobody had listed. The
sibling Alaska routine composes from its shelf first because it has an index of it. This writes
that index for Texas: every exported drawing in video-engine/src/lib, by module, with the first
line of its own comment and its props.

    python3 scripts/asset_index.py            # rewrite knowledge/craft/ASSET_INDEX.md
    python3 scripts/asset_index.py --check    # exit 1 if the committed index is stale
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LIB = REPO / "video-engine" / "src" / "lib"
LOOK = REPO / "video-engine" / "src" / "look"
LOOK_FILES = ["Figure.tsx", "CharacterV2.tsx", "machines.tsx", "props.tsx", "regions.tsx", "Kit.tsx"]
OUT = REPO / "knowledge" / "craft" / "ASSET_INDEX.md"
COMPONENT = re.compile(r"^export const ([A-Z][A-Za-z0-9]+)\s*:\s*React\.FC(?:<(.*?)>)?\s*=", re.M | re.S)
SKIP = {"fonts.tsx", "uid.ts", "type.ts", "scale.ts", "safearea.ts", "registry.tsx"}


PEOPLE = [
    "## Older boards: people from `Character.tsx`", "",
    "One rig, a cast of ten authored together (`CAST`, roster and reasoning in `knowledge/texas/CAST.md`).",
    "Put a person from it in most shots. A film about somebody using a tool at work has somebody in it.", "",
    "```tsx",
    "import {Character, castProps} from '../../../lib/Character';",
    "<Character frame={frame} {...castProps('lineworker')} x={420} y={1180} scale={1.4}",
    "  pose=\"point\" emotion=\"worried\" facing={-1} talking={0.6} />",
    "```", "",
    "- cast ids: engineer, rancher, executive, dctech, owner, operator, hand, clinician, lineworker, resident,",
    "  and the rest of `CAST`. `castProps(id)` returns outfit, headgear, skin, face and build.",
    "- `pose`: stand, arms-crossed, point, panic, raise, carry, hands-hips.",
    "- `emotion`: neutral, angry, worried, shock, smug, wry. Change it on the beat. A face that reacts is",
    "  what makes a fact land.",
    "- `facing` 1 or -1, `walking` with `walkPhase`, `talking` 0 to 1, `gesture` and `farGesture` 0 to 1,",
    "  `scale`, `x`, `y` (feet), `glasses`, `seed` for idle life.",
    "- `headgearConflict(outfit, headgear)` refuses a costume. A hat is real on a rancher and a costume on",
    "  a software executive.", "",
]


V2_FIRST = [
    "## On a look v2 board, cast from `src/look/` first", "",
    "Every board dated on or after `look.v2_from` renders in look v2. Its people, machines, animals and",
    "props come from these files, drawn to `knowledge/craft/LOOK_V2.md`. The registry galleries",
    "`look-v2-regions`, `look-v2-cast`, `look-v2-machines` and `look-v2-props` show each one beside the",
    "library drawing it replaces. Reach for `src/lib/` only for what this shelf lacks, and then light it",
    "the v2 way.", "",
    "```tsx",
    "import {Figure, castV2} from '../../../look/Figure';",
    "import {AutoTruckV2} from '../../../look/machines';",
    "<Figure frame={frame} {...castV2('lineworker')} x={420} y={1180} scale={1.4} pose=\"point\" emotion=\"worried\" />",
    "<AutoTruckV2 frame={frame} x={700} y={1300} scale={0.06} mood=\"happy\" speed={0.6} />",
    "```", "",
    "- `Figure` poses: stand, wave, point, cheer, think, hold, shrug, reach, hips, crossed, panic, raise.",
    "  Emotions: neutral, happy, excited, worried, surprised, thinking, proud, determined, angry, smug. `castV2(id)`",
    "  takes the roster ids (engineer, rancher, executive, dctech, owner, operator, hand, clinician,",
    "  lineworker, resident, farmer, technician, hydrologist) and nurse, coder, teacher, scientist, trucker.",
    "- Exteriors need nothing. `RegionStageV2` stands every exterior shot in its county's region,",
    "  redrawn, with parallax and a blurred foreground.",
    "- An old-rig call (`<Character {...castProps(id)} />`) becomes `<CharacterV2 cast={id} ... />` with the",
    "  same pose and emotion names.",
    "- Library drawings take `scale` 1 as true size. So do the v2 machines, animals and props.",
    "- `src/look/shelf/` holds v2 redraws of library sets, each named for the library drawing plus `V2`",
    "  with the same props (Mesquite becomes MesquiteV2). On a v2 board use the V2 name. Its",
    "  `look-v2-shelf-<set>` gallery shows each beside the library drawing.", "",
]


def section(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    rows = [(m.group(1), props_of(m.group(2)), comment_before(text, m.start())) for m in COMPONENT.finditer(text)]
    if not rows:
        return []
    head = re.search(r"/\*\*(.*?)\*/", text, re.S)
    about = ""
    if head:
        first = " ".join(re.sub(r"^\s*\*\s?", "", ln).strip() for ln in head.group(1).splitlines()).strip()
        about = re.split(r"(?<=[.!?])\s", first, maxsplit=1)[0][:200]
    if path.parent == LOOK:
        title = f"look/{path.name}"
    elif path.parent == LOOK / "shelf":
        title = f"look/shelf/{path.name}"
    else:
        title = path.name
    out = [f"## `{title}` ({len(rows)})", ""]
    if about:
        out += [about, ""]
    for name, props, why in rows:
        line = f"- **{name}**"
        if props:
            line += f" ({props})"
        if why:
            line += f": {why}"
        out.append(line)
    out.append("")
    return out


def comment_before(text: str, index: int) -> str:
    head = text[:index].rstrip()
    if head.endswith("*/"):
        block = head[head.rfind("/*"):]
        lines = [re.sub(r"^\s*/?\*+/?\s?", "", ln).strip() for ln in block.splitlines()]
    else:
        lines = []
        for ln in reversed(head.splitlines()):
            if not ln.strip().startswith("//"):
                break
            lines.insert(0, ln.strip().lstrip("/").strip())
    words = " ".join(x for x in lines if x).removesuffix("*/").strip()
    first = re.split(r"(?<=[.!?])\s", words, maxsplit=1)[0] if words else ""
    return first[:170]


def props_of(generic: str | None) -> str:
    if not generic:
        return ""
    names = re.findall(r"([a-zA-Z_][A-Za-z0-9_]*)\??\s*:", generic)
    seen = [n for i, n in enumerate(names) if n not in names[:i]]
    return ", ".join(seen[:10])


def build() -> str:
    out = ["# The shelf: what the Texas library can already draw", "",
           "Generated by `scripts/asset_index.py`. Do not edit by hand.", "",
           "Cast and stage from here FIRST. Import from `video-engine/src/lib/<module>`. Read the",
           "component's own comment and props in its file before using it. To see a module drawn, the",
           "review sheets in `video-engine/src/Root.tsx` render most of them.", ""]
    out += V2_FIRST
    total = 0
    for name in LOOK_FILES:
        part = section(LOOK / name)
        total += sum(1 for ln in part if ln.startswith("- **"))
        out += part
    for path in sorted((LOOK / "shelf").glob("*.tsx")):
        part = section(path)
        total += sum(1 for ln in part if ln.startswith("- **"))
        out += part
    out += PEOPLE
    for path in sorted(LIB.glob("*.ts*")):
        if path.name in SKIP:
            continue
        part = section(path)
        total += sum(1 for ln in part if ln.startswith("- **"))
        out += part
    out.insert(3, f"{total} drawings in {sum(1 for l in out if l.startswith('## '))} modules.")
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    text = build()
    if "--check" in sys.argv:
        if not OUT.is_file() or OUT.read_text(encoding="utf-8") != text:
            print("asset index is stale. Run: python3 scripts/asset_index.py")
            return 1
        print("asset index: current")
        return 0
    OUT.write_text(text, encoding="utf-8")
    print(f"asset index: wrote {OUT.relative_to(REPO)}, {len(text.splitlines())} lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
