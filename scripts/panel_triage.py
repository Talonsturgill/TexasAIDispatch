#!/usr/bin/env python3
"""panel_triage.py — spend the next round where the mean actually moves.

THE FAULT THIS EXISTS FOR, and it cost this machine a whole day.

A panel returns six axis scores and a page of findings per judge. Every finding is real. The
run then fixes THE DEFECTS IT CAN SEE MOST EASILY, which is not the same set as the defects
costing the most points, and it is not even correlated with them. On 2026-08-18 the run spent
round after round on props: an oak, a bucket truck, a pole sign, a building's width. Every one
was a genuine defect and every one was verified fixed. The mean went 6.74 to 6.75.

The arithmetic nobody was doing:

    what an axis costs = (bar - axis mean) * axis weight

Run on that day's panel it said picture was costing 0.167 and place 0.065, so place was worth
a QUARTER of picture and the run had been spending its rounds on place-shaped defects because
a mis-drawn pumpjack is easy to see and "the frame is mostly empty" is not. It also said story
was 1.10 OVER the bar and therefore worth nothing to improve, while three judges kept writing
paragraphs of praise about it.

A weighted mean does not care how many judges mentioned a thing, how confident they sounded,
or how concrete the fix was. It cares about the deficit times the weight. This computes that,
ranks it, and says what to work on. It is arithmetic the run kept not doing.

    python3 scripts/panel_triage.py --scores out/dispatch/panel.json
    python3 scripts/panel_triage.py --judge 6.3,7.9,6.4,6.1,6.3,6.6 \
                                    --judge 6.4,8.6,5.7,6.6,5.9,6.5 \
                                    --judge 6.8,7.8,6.4,6.9,6.7,6.9
    python3 scripts/panel_triage.py --self-test
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RUBRIC = REPO / "config" / "dispatch_rubric.yaml"
# COMMITTED, because the run's own trend is the only evidence that the machine is improving and
# it was living in a gitignored scratch file that dies with the container.
HISTORY = REPO / "ledger" / "panel_history.json"

# THE PLATEAU RULE, and it is the one thing here that changes what the run DOES.
#
# On 2026-08-19 the mean went 6.74, 6.75, 6.77, 6.75 across four consecutive rounds. Every round
# fixed real defects, every fix was verified, and the film did not move. The reason is structural:
# Phase 6 says a failing panel is an instruction to re-enter the loop, and the loop is
# fix -> render -> panel. It never returns to Phase 4. So a finding that is a BOARD-DESIGN fact
# (six interiors built from one shell, a closing beat that is one image three times, half a frame
# that pays nothing) can only ever be answered with a prop edit, and prop edits cannot reach it.
#
# A flat mean across this many rounds is therefore not bad luck and not a harder round. It is the
# run answering board questions with prop answers, and the only fix is to stop polishing.
PLATEAU_ROUNDS = 3
PLATEAU_SPAN = 0.06

# An axis this far over the bar is banked. Work on it returns nothing and the panel's praise for
# it is the most misleading feedback in the report, because it reads as encouragement to do more
# of what is already working.
BANKED_MARGIN = 0.25

# Below this, a fix is not worth a render on its own. It rides along in a batch or it waits.
RIDE_ALONG = 0.05


def read_rubric() -> tuple[float, dict[str, float]]:
    """THE BAR AND THE WEIGHTS ARE READ, NEVER QUOTED. Deliberately hand-parsed rather than
    imported, so this file never carries a copy of either."""
    bar, weights, axis = None, {}, None
    for raw in RUBRIC.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        if "ship_threshold:" in line:
            bar = float(line.split(":", 1)[1].strip())
        s = line.strip()
        indent = len(line) - len(line.lstrip())
        # Keyed off the ACTUAL indentation of the axis block rather than a guessed prefix. The
        # first version assumed six spaces, the file uses four, and it read zero weights and
        # said so instead of quietly returning an empty ranking. A parser that fails loudly on
        # a file it does not understand is the whole difference between this and a wrong answer.
        if s.endswith(":") and not s.startswith("#") and indent == 4:
            axis = s[:-1]
        elif s.startswith("weight:") and axis and indent > 4:
            weights[axis] = float(s.split(":", 1)[1].strip())
    if bar is None or not weights:
        raise SystemExit(f"panel_triage: could not read the bar and weights from {RUBRIC}")
    return bar, weights


def triage(judges: list[dict[str, float]], bar: float, weights: dict[str, float]) -> dict:
    axes = list(weights)
    means = {a: sum(j[a] for j in judges) / len(judges) for a in axes}
    mean = sum(means[a] * weights[a] for a in axes)
    rows = []
    for a in axes:
        cost = (bar - means[a]) * weights[a]
        spread = max(j[a] for j in judges) - min(j[a] for j in judges)
        rows.append({"axis": a, "mean": means[a], "weight": weights[a],
                     "cost": cost, "spread": spread})
    rows.sort(key=lambda r: -r["cost"])
    return {"mean": mean, "bar": bar, "gap": bar - mean, "rows": rows,
            "ship": mean >= bar}


def with_history(t: dict, history: list[dict]) -> dict:
    t["plateau"] = plateau(history, t["mean"])
    return t


def read_history() -> list[dict]:
    if not HISTORY.exists():
        return []
    try:
        return json.loads(HISTORY.read_text()).get("rounds", [])
    except Exception:
        return []


def plateau(history: list[dict], mean: float) -> tuple[bool, list[float]]:
    """Has the mean stopped moving? Includes THIS round, so it fires on the round it is true."""
    means = [float(r["mean"]) for r in history[-(PLATEAU_ROUNDS - 1):]] + [mean]
    if len(means) < PLATEAU_ROUNDS:
        return False, means
    return (max(means) - min(means)) < PLATEAU_SPAN, means


def render(t: dict) -> str:
    out = [f"\n  panel mean {t['mean']:.3f}   bar {t['bar']:.2f}   "
           + ("CLEARS THE BAR" if t["ship"] else f"gap {t['gap']:.3f}"), ""]
    out.append(f"  {'axis':<9}{'mean':>6}{'weight':>8}{'costs':>9}{'judges differ by':>18}")
    for r in t["rows"]:
        out.append(f"  {r['axis']:<9}{r['mean']:>6.2f}{r['weight']:>8.2f}"
                   f"{r['cost']:>+9.3f}{r['spread']:>18.1f}")
    out.append("")

    if t["ship"]:
        out.append("  Over the bar. Stop editing and deliver: every further round is a chance")
        out.append("  to regress something that already passes, and this run has done that.")
        return "\n".join(out)

    worth = [r for r in t["rows"] if r["cost"] >= RIDE_ALONG]
    banked = [r for r in t["rows"] if r["mean"] >= t["bar"] + BANKED_MARGIN]
    top = t["rows"][0]

    out.append(f"  WORK {top['axis'].upper()} FIRST. It is {top['cost']:.3f} of the "
               f"{t['gap']:.3f} gap.")
    if len(t["rows"]) > 1 and t["rows"][1]["cost"] > 0:
        ratio = top["cost"] / max(t["rows"][1]["cost"], 1e-9)
        out.append(f"  It is worth {ratio:.1f} times the next axis, so a fix that does not "
                   f"touch it waits.")
    if len(worth) >= 2:
        pair = worth[0]["cost"] + worth[1]["cost"]
        out.append(f"  The top two together are {pair:.3f} of the gap. Batch them into ONE "
                   f"render.")
    for r in t["rows"]:
        if 0 < r["cost"] < RIDE_ALONG:
            out.append(f"  {r['axis']} costs only {r['cost']:.3f}. It rides along in a batch "
                       f"and never justifies a render by itself.")
    for r in banked:
        out.append(f"  {r['axis']} is {r['mean'] - t['bar']:.2f} OVER the bar and is worth "
                   f"nothing to improve. Praise for it in the reports is the most misleading "
                   f"feedback in them.")
    stuck, means = t.get("plateau", (False, []))
    if stuck:
        out.append("")
        out.append("  THE MEAN HAS NOT MOVED IN "
                   f"{len(means)} ROUNDS ({', '.join(f'{m:.2f}' for m in means)}).")
        out.append("  STOP FIXING PROPS. Every round has fixed real defects and the film has not")
        out.append("  moved, which means the remaining findings are BOARD-DESIGN facts and a prop")
        out.append("  edit structurally cannot reach them. Re-enter PHASE 4 and change the board:")
        out.append("    - a scene whose composition repeats another's gets re-staged, not re-lit")
        out.append("    - a frame that pays nothing gets a different SHOT, not another object")
        out.append("    - a beat held across three scenes becomes one scene or three ideas")
        out.append("  A fourth round of prop edits is the run answering a board question with a")
        out.append("  prop answer, which is what produced this flat line in the first place.")
        out.append("")

    wide = [r for r in t["rows"] if r["spread"] >= 1.0]
    for r in wide:
        out.append(f"  The judges disagree by {r['spread']:.1f} on {r['axis']}, so read their "
                   f"evidence before acting: at least one of them is looking at something the "
                   f"others are not.")
    return "\n".join(out)


def self_test() -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    bar, weights = read_rubric()
    ok("the bar and all six weights come out of the rubric",
       bar > 0 and len(weights) == 6 and abs(sum(weights.values()) - 1.0) < 1e-9,
       f"bar={bar} weights={weights}")
    ok("...and this file contains no copy of the bar",
       str(bar) not in Path(__file__).read_text(encoding="utf-8"))

    # ROUND 24, REPLAYED. The real scores, and the ranking the run needed and did not compute.
    j = [dict(zip(weights, v)) for v in (
        (6.3, 7.9, 6.4, 6.1, 6.3, 6.6),
        (6.4, 8.6, 5.7, 6.6, 5.9, 6.5),
        (6.8, 7.8, 6.4, 6.9, 6.7, 6.9))]
    t = triage(j, bar, weights)
    ok("round 24's mean recomputes", abs(t["mean"] - 6.753) < 0.002, f"{t['mean']:.4f}")
    ok("...and picture is named first", t["rows"][0]["axis"] == "picture",
       t["rows"][0]["axis"])
    ok("...and story is identified as banked, not as a place to spend",
       any(r["axis"] == "story" and r["cost"] < 0 for r in t["rows"]))
    txt = render(t)
    ok("...and the report says to work picture first", "WORK PICTURE FIRST" in txt)
    ok("...and says story is over the bar", "story is" in txt and "OVER the bar" in txt)

    # A PASSING PANEL MUST STOP THE EDITING. The one outcome law is a delivered video, and a
    # run that keeps polishing past the bar is how a regression gets shipped.
    high = [dict(zip(weights, (9, 9, 9, 9, 9, 9)))]
    ht = triage(high, bar, weights)
    ok("a passing panel is told to deliver, not to keep editing",
       ht["ship"] and "deliver" in render(ht))

    # THE PLATEAU RULE, which is the only thing here that changes what the run DOES.
    flat = [{"mean": 6.743}, {"mean": 6.753}, {"mean": 6.769}]
    t2 = with_history(triage([dict(zip(weights, (6.6, 7.7, 6.5, 6.8, 6.2, 6.6)))], bar, weights),
                      flat)
    ok("a flat mean across three rounds is detected", t2["plateau"][0], str(t2["plateau"]))
    ok("...and the report says to stop fixing props and re-board",
       "STOP FIXING PROPS" in render(t2) and "PHASE 4" in render(t2))
    # AND IT MUST NOT FIRE ON A RUN THAT IS ACTUALLY CLIMBING, or it would send a working run
    # back to the board and cost it the round it was about to win.
    climbing = [{"mean": 6.20}, {"mean": 6.55}, {"mean": 6.80}]
    t3 = with_history(triage([dict(zip(weights, (7.1, 7.7, 6.9, 7.15, 6.8, 6.9)))], bar, weights),
                      climbing)
    ok("does NOT fire on a run whose mean is climbing", not t3["plateau"][0], str(t3["plateau"]))
    # Nor before there is enough history to know.
    t4 = with_history(triage([dict(zip(weights, (6.6, 7.7, 6.5, 6.8, 6.2, 6.6)))], bar, weights), [])
    ok("...nor on the first round, when there is nothing to compare", not t4["plateau"][0])

    # A WIDE SPREAD IS A SIGNAL, not noise to average away.
    split = [dict(zip(weights, (4, 7, 7, 7, 7, 7))), dict(zip(weights, (9, 7, 7, 7, 7, 7))),
             dict(zip(weights, (7, 7, 7, 7, 7, 7)))]
    ok("a 5 point disagreement is surfaced rather than averaged away",
       "judges disagree by 5.0" in render(triage(split, bar, weights)))

    print(f"panel_triage: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--scores", help="JSON: [{axis: score, ...}, ...] one object per judge")
    ap.add_argument("--judge", action="append", default=[],
                    help="one judge's scores, comma separated, in the rubric's axis order")
    ap.add_argument("--round", type=int, help="this panel round's number, to record the trend")
    ap.add_argument("--record", action="store_true",
                    help="append this round's mean to ledger/panel_history.json")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()

    bar, weights = read_rubric()
    judges: list[dict[str, float]] = []
    if a.scores:
        raw = json.loads(Path(a.scores).read_text())
        judges = [{k: float(v) for k, v in (j.get("axes") or j).items()} for j in raw]
    for spec in a.judge:
        vals = [float(x) for x in spec.split(",")]
        if len(vals) != len(weights):
            print(f"panel_triage: expected {len(weights)} scores "
                  f"({', '.join(weights)}), got {len(vals)}", file=sys.stderr)
            return 2
        judges.append(dict(zip(weights, vals)))
    if not judges:
        print("panel_triage: pass --scores or one --judge per judge, or --self-test",
              file=sys.stderr)
        return 2

    missing = [a_ for a_ in weights if any(a_ not in j for j in judges)]
    if missing:
        print(f"panel_triage: some judge is missing {missing}", file=sys.stderr)
        return 2

    history = read_history()
    t = with_history(triage(judges, bar, weights), history)
    print(render(t))

    if a.record:
        HISTORY.parent.mkdir(parents=True, exist_ok=True)
        rounds = history + [{"round": a.round, "mean": round(t["mean"], 3),
                             "axes": {r["axis"]: round(r["mean"], 2) for r in t["rows"]}}]
        HISTORY.write_text(json.dumps({"_why": (
            "The run's own trend. It lived in a gitignored scratch file until 2026-08-19, so "
            "every container rebuild erased the only evidence that the machine was or was not "
            "improving, and four flat rounds went unnoticed because nothing could see them."),
            "rounds": rounds}, indent=1) + "\n")
        print(f"\n  recorded round {a.round} at {t['mean']:.3f} in "
              f"{HISTORY.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
