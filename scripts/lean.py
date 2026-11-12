#!/usr/bin/env python3
"""lean.py: the daily lane. One fresh film a day, from a locked script to a delivered edition.

WHY THIS EXISTS (owner, November 12th, 2026). Nothing shipped between October 21st and November
12th. Editions took two to three days of repair, an unfinished edition blocked the next day's run,
and each day found a new refusal in a different ledger, lease, authorization or receipt. The
sibling Alaska routine ships daily with none of that. This file is the Texas engine and voice run
the same way: every step is one command, no step asks another step for permission, and nothing
here can refuse a film because of what a previous day did or did not finish.

Run it through the environment wrapper, from the repository root:

    bash scripts/run_with_env.sh python3 scripts/lean.py <command>

    init --date YYYY-MM-DD     start today's edition. Arms the run, clears nothing it did not make.
    script                     write vo_script.txt from the board's scene narration
    check --board              the board's mechanical faults, before any voice is paid for
    voice [--takes N]          Gemini TTS, soundcheck, forced alignment, then `time`
    time                       put scenes, shots, events, sounds and captions on the measured clock
    still --at 1.5,7,12        render stills from the timed board, half size, to look at
    cut [--draft]              time, mix, render and mux. --draft is the fast rough cut
    frames                     contact sheets and stills from the finished film, for the panel
    check                      the film's mechanical faults. Exit 1 is a work order, never a stop
    panel --scores a,b,c       record one panel round. Says REVISE or SHIP
    deliver                    copy the edition into runs/<date>/ and add it to the ledger
    feed --docket PATH --county C [--date YYYY-MM-DD]   add a released film to the feed
    feed-pending --docket PATH  compare released Daily films with Docket main, read-only
    email                      write runs/<date>/email.md and email.html for the Gmail draft
    commit                     stage and commit the edition, video files included
    receipt --draft-id ID      record the read-back draft. This is what ends the run
    no-exit                    exit 1 until the edition is delivered. Run before any stop
    status                     where the run is, always exit 0
    selftest [--render]

WHAT IT NEVER DOES. It never reads a budget, a lease, a capture authorization or a checkpoint. It
never resumes another date. It never sends email or posts. `check` and `deliver` can refuse only
for faults a run fixes in minutes: a film that does not play, narration the captions do not carry,
a claim with no source, loudness off target, a blank picture.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time as clock
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "out" / "dispatch"
ENGINE = REPO / "video-engine"
MARKER = OUT / "lean_run.json"
CONFIG = REPO / "config" / "lean_routine.json"
PY = sys.executable
RAW = "https://raw.githubusercontent.com/Talonsturgill/TexasAIDispatch/main"
SITE = "https://texasaidocket.com/videos/"

BANNED_COPY = [
    (re.compile(r"[\u2013\u2014]"), "an em dash or en dash"),
    (re.compile(r"[\u2018\u2019\u201c\u201d]"), "a curly quote"),
    (re.compile(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]"), "an emoji"),
    (re.compile(r";"), "a semicolon"),
    (re.compile(r"(?<!\d):(?!\d)"), "a colon"),
    (re.compile(r"\bcannot\b", re.I), '"cannot" (write "can\'t")'),
]


class Problem(Exception):
    """A fault with its fix in the message. Printed, exit 1, and the run carries on."""


def cfg() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def read(path: Path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    tmp.replace(path)


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run(cmd: list[str], cwd: Path = REPO, check: bool = True, quiet: bool = False) -> subprocess.CompletedProcess:
    proc = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, text=True)
    if not quiet:
        tail = (proc.stdout + proc.stderr).strip().splitlines()[-12:]
        for line in tail:
            print("    " + line)
    if check and proc.returncode != 0:
        raise Problem(f"`{' '.join(str(c) for c in cmd[:4])} ...` exited {proc.returncode}:\n"
                      + (proc.stdout + proc.stderr).strip()[-1500:])
    return proc


def marker() -> dict:
    if not MARKER.is_file():
        raise Problem("no run is armed. Start one: lean.py init --date YYYY-MM-DD")
    return read(MARKER)


def run_dir(date: str) -> Path:
    return REPO / "runs" / date


def ffprobe(path: Path) -> dict:
    proc = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json",
                           str(path)], capture_output=True, text=True)
    if proc.returncode != 0:
        raise Problem(f"{path} is not a playable media file: {proc.stderr.strip()[-300:]}")
    return json.loads(proc.stdout)


# ------------------------------------------------------------------ init

def cmd_init(a) -> int:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a.date):
        raise Problem("--date is YYYY-MM-DD, today's date in America/Chicago")
    if MARKER.is_file():
        old = read(MARKER)
        if old.get("date") == a.date:
            print(f"lean: {a.date} is already armed (started {old.get('started_at')}). Carrying on.")
            return 0
        # Another date's scratch is set aside whole, never deleted and never resumed.
        aside = REPO / "out" / f"aside-{old.get('date', 'unknown')}-{int(clock.time())}"
        OUT.rename(aside)
        print(f"lean: set the {old.get('date')} scratch aside at {aside.relative_to(REPO)}")
    elif OUT.exists() and any(OUT.iterdir()):
        aside = REPO / "out" / f"aside-unmarked-{int(clock.time())}"
        OUT.rename(aside)
        print(f"lean: set unmarked scratch aside at {aside.relative_to(REPO)}")
    OUT.mkdir(parents=True, exist_ok=True)
    write(MARKER, {"schema": "lean_run/1", "date": a.date, "started_at": now(),
                   "head": subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True,
                                          text=True).stdout.strip()})
    if not (REPO / "assets" / "sfx").is_dir() or not any((REPO / "assets" / "sfx").glob("*.wav")):
        print("lean: building the foley library")
        run([PY, "scripts/foley.py", "--build", "assets/sfx"], check=False)
    if run_dir(a.date).joinpath("dispatch.mp4").is_file():
        print(f"lean: runs/{a.date}/dispatch.mp4 already exists. This date shipped. Do not remake it.")
    print(f"lean: armed {a.date}. Scratch is out/dispatch/. Author out/dispatch/board.json and "
          "out/dispatch/claims.json, then: lean.py check --board")
    return 0


# ------------------------------------------------------------------ the board

def board_path() -> Path:
    return OUT / "board.json"


def load_board() -> dict:
    if not board_path().is_file():
        raise Problem("out/dispatch/board.json does not exist yet. prompts/daily_routine.md, "
                      "THE BOARD, has its shape.")
    return read(board_path())


def script_of(board: dict) -> str:
    return "\n".join(" ".join(str(s.get("vo", "")).split()) for s in board.get("scenes", []))


def regions() -> set[str]:
    plates = read(ENGINE / "src" / "modern" / "placePlates.json")["plates"]
    return {p["region"] for p in plates.values()}


def copy_problems(label: str, text: str) -> list[str]:
    return [f"{label} carries {why}: {text.strip()[:70]!r}" for rx, why in BANNED_COPY if rx.search(text or "")]


def board_problems(board: dict, date: str) -> tuple[list[str], list[str]]:
    hard, soft = [], []
    limits = cfg()["film"]
    if board.get("date") != date:
        hard.append(f"board.date is {board.get('date')!r}; this run is {date}")
    for key in ("title", "topic", "beat", "episode"):
        if not str(board.get(key) or "").strip():
            hard.append(f"board.{key} is missing")
    hard += copy_problems("the title", str(board.get("title") or ""))
    registry = (ENGINE / "src" / "daily" / "registry.tsx").read_text(encoding="utf-8")
    if board.get("episode") and f"'{board['episode']}'" not in registry:
        soft.append(f"episode {board['episode']!r} is not in video-engine/src/daily/registry.tsx yet")
    scenes = board.get("scenes") or []
    if not scenes:
        hard.append("the board has no scenes")
    claims = {}
    claims_file = OUT / "claims.json"
    if claims_file.is_file():
        data = read(claims_file)
        rows = data.get("claims", data) if isinstance(data, dict) else data
        claims = {str(c.get("id")): c for c in rows if isinstance(c, dict)}
    else:
        hard.append("out/dispatch/claims.json is missing. Every narrated fact traces to a fetched source.")
    known, ids = regions(), set()
    for i, s in enumerate(scenes):
        sid = str(s.get("id") or "")
        if not sid or sid in ids:
            hard.append(f"scene {i + 1} has a missing or repeated id")
        ids.add(sid)
        if s.get("region") not in known:
            hard.append(f"{sid}: region {s.get('region')!r} has no place plate. Use one of {sorted(known)}")
        if not str(s.get("county") or "").strip():
            hard.append(f"{sid}: county is missing")
        vo = str(s.get("vo") or "").strip()
        if not vo:
            hard.append(f"{sid}: no narration (vo)")
        hard += copy_problems(f"{sid} narration", vo)
        if re.match(r"^(And|But)\b", vo):
            hard.append(f"{sid}: narration opens with And or But")
        named = [str(c) for c in (s.get("vo_claims") or [])]
        if vo and not named:
            hard.append(f"{sid}: narration names no claim ids (vo_claims)")
        for cid in named:
            claim = claims.get(cid)
            if claims and not claim:
                hard.append(f"{sid}: claim {cid} is not in claims.json")
            elif claim and not (str(claim.get("url") or "").startswith("http") and str(claim.get("quote") or "").strip()):
                hard.append(f"claim {cid} needs a fetched url and the verbatim quote it rests on")
    shot_ids = set()
    for shot in board.get("shots") or []:
        if shot.get("scene_id") not in ids:
            hard.append(f"shot {shot.get('id')}: scene_id {shot.get('scene_id')!r} is not a scene")
        if shot.get("id") in shot_ids:
            hard.append(f"shot id {shot.get('id')} repeats")
        shot_ids.add(shot.get("id"))
        if shot.get("framing") not in ("wide", "medium", "close", "detail", "overhead", "split"):
            hard.append(f"shot {shot.get('id')}: framing must be wide, medium, close, detail, overhead or split")
        if not str(shot.get("view") or "").strip():
            hard.append(f"shot {shot.get('id')}: view is missing")
    words = len(script_of(board).split())
    lo, hi = limits["words_min"], limits["words_max"]
    if words and not lo <= words <= hi:
        hard.append(f"the narration is {words} words; the band is {lo} to {hi}. Add story or cut it, never pad")
    hard += plan_problems(board, limits, words)
    if not str(board.get("credits") or "").strip():
        soft.append("board.credits is empty. Sources and illustration credit belong on the end card.")
    try:
        entities = ",".join(board.get("entities") or [])
        if entities:
            proc = subprocess.run([PY, "scripts/dedupe.py", "check", "--entities", entities, "--today", date],
                                  cwd=REPO, capture_output=True, text=True)
            if proc.returncode == 1:
                soft.append("dedupe: " + proc.stdout.strip()[:240])
    except OSError:
        pass
    return hard, soft


def plan_problems(board: dict, limits: dict, words: int) -> list[str]:
    """The film on paper, held to the density the sibling Alaska films actually have.

    Every fault here is found before a voice is paid for or a frame is drawn, which is the cheapest
    place a thin film can be caught. The first Texas daily film was thin in exactly these ways."""
    out = []
    treatment = board.get("treatment") or {}
    for key in ("logline", "cold_open", "turn", "button"):
        if not str(treatment.get(key) or "").strip():
            out.append(f"treatment.{key} is missing. The film is pitched and chosen before it is boarded")
    hero = board.get("hero") or {}
    if not str(hero.get("name") or "").strip() or not str(hero.get("why") or "").strip():
        out.append("board.hero needs a name and a why: the ONE fresh drawing this film will be remembered for")
    through = board.get("throughline") or {}
    states = through.get("states") or []
    scene_ids = {s.get("id") for s in board.get("scenes") or []}
    if not str(through.get("object") or "").strip() or len(states) < limits["throughline_states_min"]:
        out.append(f"board.throughline needs one object and at least {limits['throughline_states_min']} states, "
                   "each in a named scene. It is on screen by the second scene and its last state is the button")
    elif any(st.get("scene_id") not in scene_ids or not str(st.get("state") or "").strip() for st in states):
        out.append("every throughline state names a real scene_id and says what the object looks like there")
    events = [(s.get("id"), e) for s in board.get("scenes") or [] for e in (s.get("visual_events") or [])]
    seconds = int(words / float(limits.get("words_per_second", 3.0)))
    need = max(1, -(-seconds // int(limits["beat_gap_s"])))
    if len(events) < need:
        out.append(f"{len(events)} beats for about {seconds} seconds. A new picture lands at least every "
                   f"{limits['beat_gap_s']:.0f} seconds, so this film needs {need} or more")
    labels = 0
    for sid, e in events:
        draw = e.get("draw") or {}
        if not str(draw.get("subject") or "").strip() or not str(draw.get("action") or "").strip():
            out.append(f"{sid} beat {e.get('id')}: draw needs a subject and an action, as 'X does Y'. "
                       "'A map is shown' is not a beat")
        sound = str(e.get("sound") or "").strip()
        if not sound:
            out.append(f"{sid} beat {e.get('id')}: no sound. Every beat lands with one")
        elif not (REPO / (sound if "/" in sound else f"assets/sfx/{sound.removesuffix('.wav')}.wav")).is_file():
            out.append(f"{sid} beat {e.get('id')}: sound {sound!r} is not in assets/sfx/. `ls assets/sfx` lists them")
        label = str(e.get("label") or "").strip()
        if label:
            labels += 1
            if len(label) > limits["label_chars_max"]:
                out.append(f"label {label!r} is over {limits['label_chars_max']} characters")
            out += copy_problems("a label", label)
    if events and labels < len(events) / 2:
        out.append(f"{labels} of {len(events)} beats carry a label. At least half do: the number, name or date "
                   "the narration just said, so a muted viewer can follow")
    for s in board.get("scenes") or []:
        if not s.get("visual_events"):
            out.append(f"{s.get('id')}: a scene with no beat is a held slide")
    shots = board.get("shots") or []
    if len(shots) < limits["shots_min"]:
        out.append(f"{len(shots)} shots; this film needs at least {limits['shots_min']}")
    views = {x.get("view") for x in shots}
    if len(views) < limits["views_min"]:
        out.append(f"{len(views)} distinct views; this film needs at least {limits['views_min']}")
    uses: dict[str, int] = {}
    for x in shots:
        uses[x.get("view", "")] = uses.get(x.get("view", ""), 0) + 1
    again = sorted(f"{v} x{n}" for v, n in uses.items() if n > 2)
    if again:
        out.append("a view may appear twice. These appear more: " + ", ".join(again))
    cast = sum(1 for x in shots if x.get("cast"))
    if shots and cast / len(shots) < limits["cast_share_min"]:
        out.append(f"{cast} of {len(shots)} shots name a person or character in `cast`. At least half do. This show "
                   "is somebody using a tool at work, and a film with no one in it has no one to care about")
    return out


def cmd_script(a) -> int:
    board = load_board()
    text = script_of(board)
    (OUT / "vo_script.txt").write_text(text + "\n", encoding="utf-8")
    print(f"lean: wrote out/dispatch/vo_script.txt, {len(text.split())} words, {len(board['scenes'])} scenes")
    return 0


# ------------------------------------------------------------------ voice

def lead_s() -> float:
    return float(cfg()["film"]["voice_lead_s"])


def cmd_voice(a) -> int:
    date = marker()["date"]
    board = load_board()
    hard, _ = board_problems(board, date)
    if hard:
        raise Problem("fix the board before paying for a voice:\n  " + "\n  ".join(hard))
    cmd_script(a)
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise Problem("GEMINI_API_KEY is not set in this environment. That is a HARD BLOCKER: "
                      "say so plainly in the run report. No silent film ships.")
    sys.path.insert(0, str(REPO / "scripts"))
    import vo_synth_gemini as synth
    import yaml
    # The daily lane pays for a call by making it. No ledger stands between the script and the voice.
    synth.budgeted_api = lambda url, payload, k, state, note: synth.call_api(url, payload, k)
    voice = yaml.safe_load((REPO / "config" / "voices.yaml").read_text(encoding="utf-8"))["voice"]["name"]
    script = (OUT / "vo_script.txt").read_text(encoding="utf-8")
    plan = read(OUT / "vo_direction.json") if (OUT / "vo_direction.json").is_file() else {}
    chosen = None
    for attempt in range(1, int(cfg()["voice"]["max_attempts"]) + 1):
        takes = OUT / "takes" / f"try{attempt}"
        takes.mkdir(parents=True, exist_ok=True)
        print(f"lean: voice attempt {attempt} ({voice})")
        code = synth.run(script, plan, takes, a.takes, voice, key, OUT / "lean_voice_state.json", evidence_dir=None)
        if code != 0:
            continue
        est = len(script.split()) / 2.3 + 8      # generous: the soundcheck refuses a take that overruns it
        proc = run([PY, "scripts/vo_soundcheck.py", "--takes", takes / "takes.json", "--script",
                    OUT / "vo_script.txt", "--cut", f"{est:.1f}"], check=False)
        found = re.search(r"chose (take\d+)", proc.stdout)
        if proc.returncode == 0 and found:
            chosen = takes / f"{found.group(1)}.wav"
            break
        print("lean: the soundcheck refused that take (wrong words, or a tag read aloud). Trying again.")
    if not chosen:
        raise Problem("no take passed the verbatim soundcheck. Read the soundcheck output above, "
                      "rewrite the line it stumbles on in board.json (spell out the hard token), and "
                      "run `lean.py voice` again. If Gemini itself is erroring on every call, that is "
                      "an API outage: wait ten minutes inside one command and retry before calling it a blocker.")
    shutil.copyfile(chosen, OUT / "vo.wav")
    align()
    return cmd_time(a)


def vo_seconds() -> float:
    return float(ffprobe(OUT / "vo.wav")["format"]["duration"])


def align() -> None:
    """Forced alignment on the voice exactly where the mix will place it."""
    work = OUT / "align"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)
    write(work / "sfx_events.json", [])
    total = lead_s() + vo_seconds() + float(cfg()["film"]["story_tail_s"])
    run([PY, "scripts/mix.py", "--vo", OUT / "vo.wav", "--sfx", work / "sfx_events.json", "--vo-at",
         str(lead_s()), "--out", work / "mix.wav", "--cut", f"{total:.3f}"])
    print("lean: forced alignment (about half a minute)")
    try:
        run([PY, "scripts/vo_align.py", "--wav", work / "mix.wav", "--script", OUT / "vo_script.txt",
             "--voice", work / "mix_vo.wav", "--out", work])
    except Problem as exc:
        # The strict aligner wants the recognizer to spell every word the way the script does. It
        # heard "line worker" for "lineworker" on November 12th and "a bridge" for "Abridge" two
        # days before, and each time it refused the whole film. The soundcheck has already proved
        # the take says the script, so the words are not in doubt, only their spelling. Align on
        # the recognizer's own measured word times instead.
        if not (work / "acoustic-asr.json").is_file():
            raise
        print("lean: the strict aligner disagreed with the recognizer's spelling, so the captions are\n"
              "      timed from the recognizer's measured word times instead. " + str(exc).splitlines()[-1][:160])
        tolerant_align(work)
    for name in ("words.json", "captions.json"):
        shutil.copyfile(work / name, OUT / name)


def match_times(tokens: list[str], heard: list[dict]) -> list[float]:
    """A measured centre time for every script word, in order.

    Words the recognizer spelled the same way take its time. A stretch it spelled differently
    ("line worker" for "lineworker") shares that stretch's own measured span. Nothing is scaled."""
    import difflib
    a = [norm(t) for t in tokens]
    b = [norm(h.get("text", "")) for h in heard]
    centers: list[float | None] = [None] * len(tokens)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                centers[i1 + k] = float(heard[j1 + k]["center"])
        elif tag == "replace":
            lo, hi = float(heard[j1]["center"]), float(heard[j2 - 1]["center"])
            n = i2 - i1
            for k in range(n):
                centers[i1 + k] = lo + (hi - lo) * (k / (n - 1) if n > 1 else 0.5)
    known = [(i, c) for i, c in enumerate(centers) if c is not None]
    if len(known) < max(2, len(tokens) // 2):
        raise Problem("the recognizer matched under half the script, so the take does not say it. "
                      "Run `lean.py voice` again.")
    for i in range(len(tokens)):                      # a word it missed sits between its neighbours
        if centers[i] is None:
            before = max(((j, c) for j, c in known if j < i), default=None)
            after = min(((j, c) for j, c in known if j > i), default=None)
            if before and after:
                centers[i] = before[1] + (after[1] - before[1]) * (i - before[0]) / (after[0] - before[0])
            else:
                centers[i] = (before or after)[1] + (0.3 * (i - (before or after)[0]))
    for i in range(1, len(centers)):                  # never out of order
        centers[i] = max(centers[i], centers[i - 1] + 0.04)
    return [float(c) for c in centers]


def cue_spans(tokens: list[str], limit: int = 46) -> list[tuple[int, int]]:
    """Break the script into caption cues at sentence ends, then commas, then the middle."""
    spans, start = [], 0
    for i, tok in enumerate(tokens):
        if re.search(r"[.!?][\"')]*$", tok) or i == len(tokens) - 1:
            spans.append((start, i + 1))
            start = i + 1
    out = []
    for lo, hi in spans:
        stack = [(lo, hi)]
        while stack:
            a, b = stack.pop(0)
            text = " ".join(tokens[a:b])
            if len(text) <= limit or b - a < 4:
                out.append((a, b))
                continue
            commas = [k + 1 for k in range(a + 1, b - 2) if tokens[k].endswith(",")]
            mid = (a + b) // 2
            cut = min(commas, key=lambda k: abs(k - mid)) if commas else mid
            stack = [(a, cut), (cut, b)] + stack
    return sorted(out)


def tolerant_align(work: Path) -> None:
    sys.path.insert(0, str(REPO / "scripts"))
    import vo_align
    heard = vo_align.acoustic_words(read(work / "acoustic-asr.json"))
    tokens = (OUT / "vo_script.txt").read_text(encoding="utf-8").split()
    centers = match_times(tokens, heard)
    words = []
    for i, tok in enumerate(tokens):
        back = (centers[i] - centers[i - 1]) / 2 if i else 0.18
        ahead = (centers[i + 1] - centers[i]) / 2 if i + 1 < len(tokens) else 0.22
        words.append({"word": tok, "start": round(max(0.0, centers[i] - min(back, 0.32)), 3),
                      "end": round(centers[i] + min(ahead, 0.32), 3), "anchored": False})
    cues = []
    for n, (a, b) in enumerate(cue_spans(tokens), 1):
        cues.append({"id": f"c{n}", "start": words[a]["start"], "end": words[b - 1]["end"],
                     "text": " ".join(tokens[a:b]), "source": "recognizer_word_times"})
    for prev, cur in zip(cues, cues[1:]):             # a cue holds to the next, never past it
        prev["end"] = round(min(max(prev["end"], prev["start"] + 0.6), cur["start"] - 0.04), 3)
    write(work / "words.json", {"method": "recognizer_word_times", "words": words})
    write(work / "captions.json", {"method": "recognizer_word_times", "cues": cues})
    print(f"lean: {len(cues)} cues from {len(heard)} recognized words")


# ------------------------------------------------------------------ time

def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", word.lower())


def phrase_index(tokens: list[str], phrase: str, lo: int, hi: int) -> int:
    want = [norm(w) for w in phrase.split() if norm(w)]
    if not want:
        raise Problem("an empty at_phrase")
    for i in range(lo, hi - len(want) + 1):
        if [norm(t) for t in tokens[i:i + len(want)]] == want:
            return i
    raise Problem(f"at_phrase {phrase!r} is not in its scene's narration, word for word")


def timed_board(board: dict, words: list[dict], cues: list[dict]) -> tuple[dict, list[dict]]:
    """Scenes cut in the pause before their first word. Everything else hangs off the scenes."""
    film = cfg()["film"]
    tokens = script_of(board).split()
    if len(tokens) != len(words):
        raise Problem(f"the board narrates {len(tokens)} words and the aligned voice has {len(words)}. "
                      "The narration changed after the voice was made. Run `lean.py voice` again.")
    scenes, cursor, spans = [], 0, []
    for s in board["scenes"]:
        n = len(" ".join(str(s.get("vo", "")).split()).split())
        spans.append((cursor, cursor + n))
        cursor += n
    story_end = round(float(words[-1]["end"]) + float(film["story_tail_s"]), 3)
    starts = []
    for i, (lo, hi) in enumerate(spans):
        if i == 0:
            starts.append(0.0)
        elif hi > lo:
            gap_from, gap_to = float(words[lo - 1]["end"]), float(words[lo]["start"])
            # Cut late in the pause, so the picture changes just ahead of the sentence it belongs to.
            starts.append(round(max(gap_from, gap_to - min(0.18, (gap_to - gap_from) * 0.5)), 3))
        else:
            starts.append(starts[-1])
    ends = starts[1:] + [story_end]
    out = dict(board)
    sfx, flat_shots = [], []
    authored_shots = board.get("shots") or []
    for s, (lo, hi), start, end in zip(board["scenes"], spans, starts, ends):
        dur = round(end - start, 3)
        if dur <= 0.2:
            raise Problem(f"scene {s['id']} has no time of its own. Give it narration or merge it.")
        scene = dict(s)
        scene.update(start_s=start, duration_s=dur)
        scene.setdefault("planes", [])
        scene.setdefault("interior", False)

        def offset(spec: dict, default: float) -> float:
            if spec.get("at_phrase"):
                return max(0.0, float(words[phrase_index(tokens, spec["at_phrase"], lo, hi)]["start"]) - start)
            if spec.get("at") is not None:
                return max(0.0, min(1.0, float(spec["at"]))) * dur
            return default

        events = []
        for e in s.get("visual_events") or []:
            at = offset(e, 0.0)
            length = float(e.get("duration_s") or 0.8)
            at = min(at, max(0.0, dur - 0.25))
            length = max(0.2, min(length, dur - at))
            events.append({**e, "at_s": round(at, 3), "duration_s": round(length, 3)})
        scene["visual_events"] = events
        by_id = {e.get("id"): e for e in events}
        declared = list(s.get("sound") or [])
        for e in events:                       # a beat names its sound in one word
            name = str(e.get("sound") or "").strip()
            if name and not any(x.get("event_id") == e.get("id") for x in declared):
                wav = name if "/" in name else f"assets/sfx/{name.removesuffix('.wav')}.wav"
                if (REPO / wav).is_file():
                    declared.append({"wav": wav, "event_id": e.get("id"), "gain": float(e.get("gain", 0.14)),
                                     "what": (e.get("draw") or {}).get("action", "")})
        for j, snd in enumerate(declared):
            anchor = by_id.get(snd.get("event_id"))
            at = start + (anchor["at_s"] if anchor else offset(snd, 0.0))
            sfx.append({"id": snd.get("id") or f"{s['id']}-snd{j + 1}", "event_id": snd.get("event_id") or "",
                        "wav": snd["wav"], "gain": float(snd.get("gain", 0.15)),
                        "what": snd.get("what", ""), "provenance": snd.get("provenance", "Original designed foley."),
                        "at_s": round(at, 3), "dur_s": float(snd.get("dur_s", 1.0))})
        mine = [x for x in authored_shots if x.get("scene_id") == s["id"]] or [
            {"id": f"{s['id']}-a", "scene_id": s["id"], "framing": "medium", "view": s.get("view") or "main"}]
        # A shot pinned to a phrase (or a fraction) starts there. The shots between two pins share
        # that stretch by their `share`. The first shot always opens the scene.
        pins = [offset(x, 0.0) if (x.get("at_phrase") or x.get("at") is not None) else None for x in mine]
        pins[0] = 0.0
        marks, k = list(pins), 0
        while k < len(mine):
            nxt = next((j for j in range(k + 1, len(mine)) if pins[j] is not None), len(mine))
            stop = pins[nxt] if nxt < len(mine) else dur
            weights = [float(x.get("share", 1)) for x in mine[k:nxt]]
            t = marks[k]
            for j, wgt in zip(range(k, nxt), weights):
                marks[j] = t
                t += (stop - marks[k]) * wgt / sum(weights)
            k = nxt
        for k in range(1, len(marks)):          # strictly increasing, each shot at least half a second
            marks[k] = max(marks[k], marks[k - 1] + 0.5)
        if marks[-1] > dur - 0.4 and len(marks) > 1:
            marks = [dur * k / len(marks) for k in range(len(marks))]
        for k, x in enumerate(mine):
            s0 = marks[k]
            s1 = marks[k + 1] if k + 1 < len(marks) else dur
            flat_shots.append({"transition": "cut", "purpose": "", "carry": "",
                               "event_id": (events[0]["id"] if events and events[0].get("id") else ""),
                               **x, "start_s": round(start + s0, 3), "duration_s": round(s1 - s0, 3)})
        scenes.append(scene)
    out["scenes"] = scenes
    out["shots"] = flat_shots
    out["runtime_s"] = story_end
    out["captions"] = [{"id": c.get("id", f"c{i + 1}"), "start": float(c["start"]),
                        "end": min(float(c["end"]), story_end), "text": c["text"]}
                       for i, c in enumerate(cues) if float(c["start"]) < story_end]
    out["credits_s"] = float(board.get("credits_s") or film["credits_s"])
    out["timed_at"] = now()
    return out, sfx


def music_credit(board: dict) -> str:
    track = (board.get("music") or {}).get("track")
    if not track:
        return ""
    proc = subprocess.run([PY, "scripts/music.py", "--credits", track], cwd=REPO, capture_output=True, text=True)
    return proc.stdout.strip() if proc.returncode == 0 else ""


def cmd_time(a) -> int:
    marker()
    board = load_board()
    for name in ("words.json", "captions.json"):
        if not (OUT / name).is_file():
            raise Problem(f"out/dispatch/{name} is missing. Run `lean.py voice` first.")
    words = read(OUT / "words.json")["words"]
    cues = read(OUT / "captions.json")["cues"]
    timed, sfx = timed_board(board, words, cues)
    credit = music_credit(board) if (OUT / "music_bed.wav").is_file() or (board.get("music") or {}).get("track") else ""
    credits = str(board.get("credits") or "").rstrip()
    if credit and credit.splitlines()[-1] not in credits:
        credits = (credits + "\n" + credit).strip()
    timed["credits"] = credits
    write(OUT / "storyboard.json", timed)
    write(OUT / "sfx_events.json", sfx)
    (OUT / "credits.txt").write_text(credits + "\n", encoding="utf-8")
    print(f"lean: timed. Story {timed['runtime_s']:.2f}s plus {timed['credits_s']:.0f}s credits, "
          f"{len(timed['scenes'])} scenes, {len(timed['shots'])} shots, {len(timed['captions'])} cues, {len(sfx)} sounds.")
    for s in timed["scenes"]:
        print(f"    {s['id']:<5} {s['start_s']:6.2f} to {s['start_s'] + s['duration_s']:6.2f}  {str(s.get('vo', ''))[:56]}")
    return 0


# ------------------------------------------------------------------ mix, render

def total_s(board: dict) -> float:
    credits = float(board.get("credits_s") or 0) if str(board.get("credits") or "").strip() else 0.0
    return float(board["runtime_s"]) + credits


def frames_of(board: dict) -> int:
    import math
    end = max(s["start_s"] + s["duration_s"] for s in board["scenes"])
    credits = math.ceil(float(board.get("credits_s") or 0) * 30) if str(board.get("credits") or "").strip() else 0
    return math.ceil(end * 30 - 1e-6) + credits


def mix(board: dict) -> None:
    cut = frames_of(board) / 30
    # mix.py loads any storyboard.json beside its output and holds a current-dated one to the
    # retired lane's whole contract. The daily mix is written to its own directory, where there
    # is no board to find, and copied back.
    audio = OUT / "audio"
    audio.mkdir(exist_ok=True)
    cmd = [PY, "scripts/mix.py", "--vo", OUT / "vo.wav", "--sfx", OUT / "sfx_events.json", "--vo-at",
           str(lead_s()), "--out", audio / "mix.wav", "--cut", f"{cut:.4f}"]
    track = (board.get("music") or {}).get("track")
    if track:
        try:
            run([PY, "scripts/prepare_music.py", "--track", track, "--out", OUT / "music_bed.wav",
                 "--manifest", OUT / "music_bed.json"], quiet=True)
            gap = (board.get("music") or {}).get("gap_db")
            if gap is None:
                rows = read(REPO / "config" / "music" / "sources.json")
                rows = rows.get("tracks", rows) if isinstance(rows, dict) else rows
                found = [r for r in (rows.values() if isinstance(rows, dict) else rows)
                         if isinstance(r, dict) and r.get("id") == track]
                gap = (found[0].get("mix_gap_db") if found else None) or 20
            cmd += ["--bed", OUT / "music_bed.wav", "--bed-track", track, "--bed-manifest",
                    OUT / "music_bed.json", "--bed-gap-db", str(gap)]
        except Problem as exc:
            # Music is never the reason a film does not ship. Without a bed the credit comes off too.
            print(f"lean: the bed {track!r} could not be prepared, so this cut has no music.\n{str(exc)[:300]}")
            (OUT / "music_bed.wav").unlink(missing_ok=True)
    try:
        run(cmd)
    except Problem:
        if "--bed" not in [str(c) for c in cmd]:
            raise
        print("lean: the mix refused the bed, so this cut has no music.")
        (OUT / "music_bed.wav").unlink(missing_ok=True)
        run(cmd[:[str(c) for c in cmd].index("--bed")])
    for name in ("mix.wav", "mix.json", "mix_vo.wav"):
        if (audio / name).is_file():
            shutil.copyfile(audio / name, OUT / name)


def render(board_file: Path, output: Path, draft: bool) -> None:
    quality = cfg()["render"]["draft" if draft else "final"]
    silent = output.with_name(output.stem + "-silent.mp4")
    (OUT / "render-started").write_text(now(), encoding="utf-8")
    cmd = ["npx", "--no-install", "remotion", "render", "src/index.ts", "Daily", str(silent),
           f"--props={board_file}", "--codec=h264", f"--crf={quality['crf']}", "--pixel-format=yuv420p",
           "--muted", f"--image-format={quality['image_format']}", f"--scale={quality['scale']}",
           f"--concurrency={os.environ.get('DISPATCH_RENDER_CONCURRENCY', quality['concurrency'])}",
           "--log=error"]
    started = clock.time()
    print(f"lean: rendering {'the rough cut' if draft else 'the film'} ({frames_of(read(board_file))} frames)")
    proc = subprocess.run(cmd, cwd=ENGINE, capture_output=True, text=True)
    if proc.returncode != 0 or not silent.is_file():
        raise Problem("the render failed. The engine's message names the fault and usually the fix:\n"
                      + (proc.stdout + proc.stderr).strip()[-2500:])
    run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", OUT / "mix.wav", "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", output], quiet=True)
    silent.unlink(missing_ok=True)
    print(f"lean: {output.relative_to(REPO)} in {clock.time() - started:.0f}s")


def cmd_cut(a) -> int:
    marker()
    cmd_time(a)
    board = read(OUT / "storyboard.json")
    mix(board)
    if not (OUT / "music_bed.wav").is_file() and (board.get("music") or {}).get("track"):
        # the bed fell out, so its credit must not stay on the card
        credit = music_credit(board)
        if credit:
            board["credits"] = "\n".join(l for l in board["credits"].splitlines() if l not in credit.splitlines()).strip()
            write(OUT / "storyboard.json", board)
    output = OUT / ("roughcut.mp4" if a.draft else "film.mp4")
    render(OUT / "storyboard.json", output, a.draft)
    if not a.draft:
        at = float(board.get("poster_at_s") or min(2.0, board["runtime_s"] / 2))
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{at:.2f}", "-i", output, "-frames:v", "1", OUT / "poster.png"], quiet=True)
        write(OUT / "film.json", {"film_sha256": sha(output), "board_sha256": sha(OUT / "storyboard.json"),
                                  "rendered_at": now()})
    else:
        print("lean: THE ROUGH CUT EXISTS. From here the only question is how good the film gets.")
    return 0


def cmd_still(a) -> int:
    marker()
    if not (OUT / "storyboard.json").is_file():
        cmd_time(a)
    out = OUT / "stills"
    out.mkdir(exist_ok=True)
    for raw in a.at.split(","):
        t = float(raw)
        target = out / f"t{t:06.2f}.png"
        proc = subprocess.run(["npx", "--no-install", "remotion", "still", "src/index.ts", "Daily", str(target),
                               f"--props={OUT / 'storyboard.json'}", f"--frame={int(round(t * 30))}",
                               f"--scale={a.scale}", "--log=error"], cwd=ENGINE, capture_output=True, text=True)
        if proc.returncode != 0:
            raise Problem(f"the still at {t}s failed to render:\n" + (proc.stdout + proc.stderr).strip()[-2000:])
        print(f"    {target.relative_to(REPO)}")
    return 0


def cmd_frames(a) -> int:
    marker()
    film = OUT / "film.mp4" if (OUT / "film.mp4").is_file() else OUT / "roughcut.mp4"
    if not film.is_file():
        raise Problem("there is no cut yet. Run `lean.py cut --draft`.")
    review = OUT / "review"
    if review.exists():
        shutil.rmtree(review)
    review.mkdir()
    duration = float(ffprobe(film)["format"]["duration"])
    step = max(1.0, duration / 36)      # three sheets of twelve: a 100 second film, a frame every 3 seconds
    run(["ffmpeg", "-v", "error", "-y", "-i", film, "-vf", f"fps=1/{step:.3f},scale=360:-2,tile=6x2",
         review / "sheet-%02d.png"], quiet=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", film, "-vf", f"fps=1/{max(2.0, duration / 14):.3f},scale=540:-2",
         review / "frame-%02d.png"], quiet=True)
    names = sorted(p.name for p in review.iterdir())
    print(f"lean: {len(names)} review images in out/dispatch/review/ from {film.name}: " + ", ".join(names))
    return 0


# ------------------------------------------------------------------ check

def loudness(film: Path) -> tuple[float, float]:
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(film), "-af", "ebur128=peak=true",
                           "-f", "null", "-"], capture_output=True, text=True)
    text = proc.stderr[proc.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", text)
    p = re.search(r"Peak:\s+(-?[\d.]+) dBFS", text)
    if not i or not p:
        raise Problem("ffmpeg could not measure the film's loudness")
    return float(i.group(1)), float(p.group(1))


def film_problems(date: str) -> tuple[list[str], list[str], dict]:
    hard, soft, facts = [], [], {}
    board = read(OUT / "storyboard.json") if (OUT / "storyboard.json").is_file() else None
    film = OUT / "film.mp4"
    if board is None or not film.is_file():
        return ["there is no finished film. Run `lean.py cut`."], soft, facts
    b_hard, b_soft = board_problems(load_board(), date)
    hard += b_hard
    soft += b_soft
    meta = ffprobe(film)
    kinds = {s["codec_type"] for s in meta["streams"]}
    if kinds != {"video", "audio"}:
        hard.append(f"the film has streams {sorted(kinds)}; it needs one video and one audio")
    duration = float(meta["format"]["duration"])
    facts["duration_s"] = round(duration, 2)
    want = frames_of(board) / 30
    if abs(duration - want) > 0.35:
        hard.append(f"the film runs {duration:.2f}s and the board says {want:.2f}s. Run `lean.py cut` again.")
    video = next((s for s in meta["streams"] if s["codec_type"] == "video"), {})
    if (video.get("width"), video.get("height")) != (1080, 1920):
        hard.append(f"the film is {video.get('width')}x{video.get('height')}, not 1080x1920")
    film_meta = read(OUT / "film.json") if (OUT / "film.json").is_file() else {}
    if film_meta.get("board_sha256") != sha(OUT / "storyboard.json") or film_meta.get("film_sha256") != sha(film):
        hard.append("the board changed after the film was rendered. Run `lean.py cut` again.")
    limits = cfg()["film"]
    if not limits["seconds_min"] <= float(board["runtime_s"]) <= limits["seconds_max"]:
        soft.append(f"the story runs {board['runtime_s']:.0f}s; the band is {limits['seconds_min']} to {limits['seconds_max']}")
    lufs, peak = loudness(film)
    facts.update(lufs=lufs, peak_dbfs=peak)
    audio = cfg()["audio"]
    if abs(lufs - audio["lufs_target"]) > audio["lufs_tolerance"]:
        hard.append(f"loudness is {lufs:.1f} LUFS; the target is {audio['lufs_target']} within {audio['lufs_tolerance']}")
    if peak > audio["peak_max_dbfs"]:
        hard.append(f"the peak is {peak:.1f} dBFS; the ceiling is {audio['peak_max_dbfs']}")
    spoken = [norm(w) for w in script_of(board).split() if norm(w)]
    shown = [norm(w) for c in board.get("captions", []) for w in c["text"].split() if norm(w)]
    if spoken != shown:
        hard.append("the captions do not carry the narration word for word. Run `lean.py voice` again.")
    for c in board.get("captions", []):
        if c["end"] - c["start"] < 0.25:
            hard.append(f"caption {c.get('id')} is on screen for under a quarter second")
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(film), "-vf",
                           "blackdetect=d=0.6:pic_th=0.98:pix_th=0.08", "-an", "-f", "null", "-"],
                          capture_output=True, text=True)
    for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", proc.stderr):
        if float(m.group(1)) < float(board["runtime_s"]) - 0.2:
            hard.append(f"the picture is black from {float(m.group(1)):.1f}s to {float(m.group(2)):.1f}s. "
                        "A dark frame is a render fault. Look at a still there and fix the scene.")
    registry = (ENGINE / "src" / "daily" / "registry.tsx").read_text(encoding="utf-8")
    if f"'{board.get('episode')}'" not in registry:
        hard.append(f"episode {board.get('episode')!r} is not registered")
    hard += source_problems()
    hard += beat_problems(board)
    soft += pacing_notes(board)
    return hard, soft, facts


def source_problems() -> list[str]:
    """What CI will refuse about the episode source, found here before the film is final.

    On November 12th an episode shipped two colour literals the engine lint refuses. CI caught them
    after delivery, the fix landed after the render, and the committed source no longer matched the
    film. Checked here, the fix lands before the last cut."""
    out = []
    lint = subprocess.run([PY, "scripts/engine_lint.py"], cwd=REPO, capture_output=True, text=True)
    if lint.returncode != 0:
        out.append("scripts/engine_lint.py fails on the episode source. Fix it, then `lean.py cut` again:\n"
                   + (lint.stdout + lint.stderr).strip()[-700:])
    tsc = subprocess.run(["npx", "--no-install", "tsc", "--noEmit"], cwd=ENGINE, capture_output=True, text=True)
    if tsc.returncode != 0:
        out.append("the engine does not typecheck:\n" + (tsc.stdout + tsc.stderr).strip()[-700:])
    return out


def beat_problems(board: dict) -> list[str]:
    """On the measured clock: the hook moves at once and no stretch goes without a new picture."""
    gap = float(cfg()["film"]["beat_gap_s"]) + 1.0
    starts = sorted(s["start_s"] + e["at_s"] for s in board["scenes"] for e in s.get("visual_events") or [])
    out = []
    if not starts:
        return ["the film has no beats"]
    if starts[0] > 1.3:
        out.append(f"the first beat lands at {starts[0]:.1f}s. The hook is moving by 1.3 seconds")
    marks = starts + [float(board["runtime_s"])]
    for a, b in zip(marks, marks[1:]):
        if b - a > gap:
            out.append(f"nothing new happens from {a:.1f}s to {b:.1f}s. Add a beat there (edit board.json, "
                       f"then `lean.py cut`, no new voice needed)")
    return out


def pacing_notes(board: dict) -> list[str]:
    """The two faults the first daily panel named, counted so a run sees them before a judge does."""
    notes = []
    shots = board.get("shots") or []
    uses: dict[str, int] = {}
    for shot in shots:
        uses[shot.get("view", "")] = uses.get(shot.get("view", ""), 0) + 1
    repeated = sorted(v for v, n in uses.items() if n > 2)
    if repeated:
        notes.append("these views are used more than twice, which reads as the same frame again: "
                     + ", ".join(f"{v} x{uses[v]}" for v in repeated))
    held = [f"{x['id']} ({x['duration_s']:.1f}s)" for x in shots if float(x.get("duration_s", 0)) > 6.0]
    if held:
        notes.append("these shots hold longer than six seconds. Cut inside them or give them a second action: "
                     + ", ".join(held))
    return notes


def cmd_check(a) -> int:
    date = marker()["date"]
    if a.board:
        hard, soft = board_problems(load_board(), date)
        facts = {}
    else:
        hard, soft, facts = film_problems(date)
    write(OUT / ("check-board.json" if a.board else "check.json"),
          {"date": date, "checked_at": now(), "hard": hard, "soft": soft, "facts": facts,
           "film_sha256": sha(OUT / "film.mp4") if not a.board and (OUT / "film.mp4").is_file() else None})
    for p in hard:
        print(f"  FIX   {p}")
    for p in soft:
        print(f"  note  {p}")
    if facts:
        print(f"  facts {facts}")
    if hard:
        print(f"\nlean check: {len(hard)} thing(s) to fix. This is a work order. Fix them and run it again.")
        return 1
    print("\nlean check: clean." + (" Notes above are judgement calls, not blockers." if soft else ""))
    return 0


# ------------------------------------------------------------------ panel

def bar() -> float:
    import yaml
    return float(yaml.safe_load((REPO / "config" / "dispatch_rubric.yaml").read_text(encoding="utf-8"))
                 ["rubric"]["ship_threshold"])


def cmd_panel(a) -> int:
    date = marker()["date"]
    if not (OUT / "film.mp4").is_file():
        raise Problem("the panel grades the finished film. Run `lean.py cut` first.")
    scores = sorted(float(x) for x in a.scores.split(","))
    judges = int(cfg()["panel"]["judges"])
    if len(scores) != judges:
        raise Problem(f"a round is {judges} independent scores, got {len(scores)}")
    median = scores[len(scores) // 2]
    path = OUT / "report_card.json"
    card = read(path) if path.is_file() else {"date": date, "rounds": []}
    film_hash = sha(OUT / "film.mp4")
    if card["rounds"] and card["rounds"][-1]["film_sha256"] == film_hash:
        raise Problem("this exact film was already graded. A new round grades a new cut.")
    card["rounds"].append({"round": len(card["rounds"]) + 1, "scores": scores, "median": median,
                           "film_sha256": film_hash, "hard_fails": [x for x in (a.hard_fail or []) if x],
                           "defects": a.defects or "", "graded_at": now()})
    cap, need = int(cfg()["panel"]["round_cap"]), bar()
    last = card["rounds"][-1]
    passed = median >= need and not last["hard_fails"]
    counted = sum(1 for r in card["rounds"] if not r["hard_fails"])
    at_cap = counted >= cap
    card.update(bar_source="config/dispatch_rubric.yaml", median=median, passed=passed,
                shortfall=round(max(0.0, need - median), 2))
    if passed:
        card.update(verdict="ship", release="panel_pass")
    elif last["hard_fails"]:
        card.update(verdict="revise", release=None)
    elif at_cap:
        # The owner's standing rule: the film ships at the creative boundary with the honest score and
        # the shortfall named. The bar is never moved and the round is never rewritten as a pass.
        card.update(verdict="ship", release="bounded_creative_release")
    else:
        card.update(verdict="revise", release=None)
    write(path, card)
    r = len(card["rounds"])
    if card["verdict"] == "ship" and passed:
        print(f"lean panel: round {r}, median {median}. SHIP. Stop editing. Run `lean.py check`, then deliver.")
    elif card["verdict"] == "ship":
        print(f"lean panel: graded round {counted} of {cap}, median {median}, short of the bar by {card['shortfall']}. "
              "This is the last round. SHIP THIS CUT and name the score and the shortfall in the email.")
    elif last["hard_fails"]:
        print(f"lean panel: round {r}. HARD FAIL: {'; '.join(last['hard_fails'])}. Fix exactly that, cut, "
              "and grade again. A hard fail is repaired, never shipped, and it does not use up a round.")
    else:
        print(f"lean panel: graded round {counted} of {cap}, median {median}, short by {card['shortfall']}. REVISE: fix the "
              "two defects the judges ranked highest, cut again, grade again.")
    return 0


# ------------------------------------------------------------------ deliver

def cmd_deliver(a) -> int:
    date = marker()["date"]
    hard, soft, facts = film_problems(date)
    if hard:
        raise Problem("the film has mechanical faults. Fix them, then deliver:\n  " + "\n  ".join(hard))
    card_path = OUT / "report_card.json"
    card = read(card_path) if card_path.is_file() else None
    film = OUT / "film.mp4"
    if not card or card.get("verdict") != "ship" or card["rounds"][-1]["film_sha256"] != sha(film):
        raise Problem("the panel has not said SHIP for this exact cut. Grade it: lean.py frames, three "
                      "scorers, then lean.py panel --scores a,b,c")
    post = OUT / "post.txt"
    if not post.is_file() or len(post.read_text(encoding="utf-8").strip()) < 80:
        raise Problem("out/dispatch/post.txt, the social caption, is missing or under 80 characters")
    bad = copy_problems("the caption", post.read_text(encoding="utf-8"))
    if bad:
        raise Problem("fix the caption:\n  " + "\n  ".join(bad))
    hashes = [str(r.get("film_sha256", "")) for r in card["rounds"]]
    stamps = [r.get("graded_at") for r in card["rounds"]]
    if (any(not re.fullmatch(r"[0-9a-f]{64}", h) for h in hashes) or len(set(hashes)) != len(hashes)
            or len(set(stamps)) != len(stamps)):
        soft.append("the panel record was not written round by round by `lean.py panel`, so its earlier "
                    "rounds can't be tied to the cuts they graded")
    dest = run_dir(date)
    if (dest / "dispatch.mp4").is_file() and sha(dest / "dispatch.mp4") != sha(film) and not (dest / "lean.json").is_file():
        raise Problem(f"runs/{date}/ already holds a different shipped film. Shipped artifacts are never overwritten.")
    dest.mkdir(parents=True, exist_ok=True)
    board = read(OUT / "storyboard.json")
    board["run_id"] = date
    write(dest / "storyboard.json", board)
    shutil.copyfile(film, dest / "dispatch.mp4")
    shutil.copyfile(OUT / "poster.png", dest / "poster.png")
    for name in ("claims.json", "captions.json", "words.json", "mix.json", "sfx_events.json", "vo_script.txt",
                 "credits.txt", "report_card.json", "post.txt", "vo_direction.json", "check.json"):
        if (OUT / name).is_file():
            shutil.copyfile(OUT / name, dest / name)
    for stale in ("dispatch-720.mp4", "poster-540.jpg"):
        (dest / stale).unlink(missing_ok=True)
    sys.path.insert(0, str(REPO / "scripts"))
    import publish_feed
    publish_feed.renditions(dest)
    write(dest / "lean.json", {
        "schema": "lean_edition/1", "date": date, "title": board.get("title"), "episode": board.get("episode"),
        "film_sha256": sha(dest / "dispatch.mp4"), "duration_s": facts.get("duration_s"),
        "lufs": facts.get("lufs"), "peak_dbfs": facts.get("peak_dbfs"),
        "panel": {"median": card["median"], "rounds": len(card["rounds"]), "release": card["release"],
                  "shortfall": card["shortfall"]},
        "notes": soft, "delivered_at": now()})
    history = read(REPO / "ledger" / "dispatch_history.json")
    if not any(e.get("date") == date and e.get("slug") == publish_feed.slug(board["title"]) for e in history["dispatches"]):
        history["dispatches"].append({
            "date": date, "topic": board.get("topic") or board["title"], "slug": publish_feed.slug(board["title"]),
            "beat": board.get("beat") or "", "entities": board.get("entities") or [],
            "fingerprint": board.get("fingerprint") or {}, "palette": (board.get("fingerprint") or {}).get("palette", "")})
        (REPO / "ledger" / "dispatch_history.json").write_text(json.dumps(history, indent=2, ensure_ascii=False) + "\n",
                                                                encoding="utf-8")
    size = (dest / "dispatch.mp4").stat().st_size / 1e6
    print(f"lean: runs/{date}/ holds the edition ({size:.1f} MB). NEXT: lean.py email, commit, push, open a READY "
          f"pull request, merge it, then the Docket feed, the Gmail draft and the social posts.")
    return 0


def git_read(repo: Path, *args: str) -> bytes:
    proc = subprocess.run(["git", *args], cwd=repo, capture_output=True)
    if proc.returncode:
        raise Problem("feed reconciliation could not read Git: " + proc.stderr.decode(errors="replace")[-400:])
    return proc.stdout


def main_snapshot(repo: Path) -> tuple[str, set[str]]:
    """No fetch or checkout here. The caller fetches; all reads then use one immutable main."""
    revision = git_read(repo, "rev-parse", "--verify", "origin/main^{commit}").decode().strip()
    paths = git_read(repo, "ls-tree", "-r", "--name-only", "-z", revision).decode().split("\0")
    return revision, set(paths)


def released_feed_info(repo: Path, revision: str, paths: set[str], date: str) -> tuple[dict, dict]:
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise Problem("feed --date must be YYYY-MM-DD")
    prefix = f"runs/{date}"
    needed = {f"{prefix}/{name}" for name in ("lean.json", "storyboard.json", "dispatch.mp4", "poster.png")}
    if not needed <= paths:
        raise Problem(f"{date} is not a complete released Daily edition on origin/main")
    try:
        info = json.loads(git_read(repo, "show", f"{revision}:{prefix}/lean.json"))
        board = json.loads(git_read(repo, "show", f"{revision}:{prefix}/storyboard.json"))
    except (ValueError, TypeError) as exc:
        raise Problem(f"invalid released edition metadata for {date}") from exc
    if (info.get("schema") != "lean_edition/1" or info.get("date") != date
            or not re.fullmatch(r"[0-9a-f]{64}", str(info.get("film_sha256", "")))
            or not board.get("title") or board.get("title") != info.get("title")):
        raise Problem(f"released edition identity is inconsistent for {date}")
    return info, board


def feed_rows(feed: dict | list) -> list[dict]:
    rows = feed.get("videos") if isinstance(feed, dict) else feed
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise Problem("Docket feed is not a list of video entries")
    return rows


def feed_identity_status(feed: dict | list, expected: dict) -> str:
    """Keep editorial copy intact. A same-path/id collision is work, never a second card."""
    base = feed.get("media_base", RAW).rstrip("/") if isinstance(feed, dict) else RAW

    def media(value):
        value = str(value or "")
        return base + value if value.startswith("/") else value

    matches = [row for row in feed_rows(feed) if row.get("id") == expected["id"]
               or row.get("video") == expected["video"]
               or media(row.get("video")) == RAW + expected["video"]]
    if not matches:
        return "missing"
    if len(matches) != 1:
        return "conflict"
    row = matches[0]
    return "listed" if (row.get("id") == expected["id"] and row.get("title") == expected["title"]
                        and row.get("date") == expected["date"] and media(row.get("video")) == RAW + expected["video"]
                        and media(row.get("poster")) == RAW + expected["poster"]) else "conflict"


def pending_feeds(repo: Path, docket: Path) -> dict:
    """Main's released artifacts and main's feed are the durable queue, not today's scratch."""
    import publish_feed
    dispatch_rev, paths = main_snapshot(repo)
    docket_rev, _ = main_snapshot(docket)
    feed = json.loads(git_read(docket, "show", f"{docket_rev}:docs/videos/videos.json"))
    feed_rows(feed)
    rows = []
    for path in sorted(paths):
        match = re.fullmatch(r"runs/(\d{4}-\d{2}-\d{2})/lean.json", path)
        if not match:
            continue
        date = match[1]
        info, board = released_feed_info(repo, dispatch_rev, paths, date)
        expected = publish_feed.entry(date, board, "", "", False, False)
        rows.append({"date": date, "id": expected["id"], "video": expected["video"],
                     "film_sha256": info["film_sha256"], "status": feed_identity_status(feed, expected)})
    return {"dispatch_main": dispatch_rev, "docket_main": docket_rev,
            "pending": [row for row in rows if row["status"] != "listed"],
            "listed": [row for row in rows if row["status"] == "listed"]}


def cmd_feed_pending(a) -> int:
    print(json.dumps(pending_feeds(REPO, Path(a.docket)), indent=2))
    return 0


def cmd_feed(a) -> int:
    # Explicit date is feed-only recovery, never init/voice/render of an older edition.
    date = a.date or marker()["date"]
    revision, paths = main_snapshot(REPO)
    info, board = released_feed_info(REPO, revision, paths, date)
    import publish_feed
    caption = (a.caption or "").strip() or board.get("feed_caption", "")
    fails = publish_feed.check_caption(caption)
    if fails:
        raise Problem("the feed caption (one or two plain sentences under the title): " + "; ".join(fails))
    docket = Path(a.docket)
    target = docket / "docs" / "videos" / "videos.json"
    if not target.is_file():
        raise Problem(f"{target} does not exist. --docket is the TexasAIDocket checkout.")
    before = target.read_bytes()
    feed = json.loads(before)
    entry = publish_feed.entry(date, board, caption, a.county,
                               f"runs/{date}/dispatch-720.mp4" in paths, f"runs/{date}/poster-540.jpg" in paths)
    status = feed_identity_status(feed, entry)
    if status == "listed":
        print(f"lean: {entry['id']} is already present. No feed or released artifact changed.")
        return 0
    if status == "conflict":
        raise Problem("the feed already has a conflicting card for this released film; inspect its existing PR, do not overwrite it")
    if isinstance(feed, dict) and feed.get("media_base", RAW).rstrip("/") != RAW:
        raise Problem("Docket media_base is not the released Dispatch main URL; do not add relative media under another host")
    if git_read(docket, "status", "--porcelain").strip():
        raise Problem("Docket worktree is not clean; reuse its existing feed PR or a separate clean worktree, never overwrite another worker")
    # Confirm the immutable main film, not a same-named local/scratch replacement.
    if hashlib.sha256(git_read(REPO, "show", f"{revision}:runs/{date}/dispatch.mp4")).hexdigest() != info["film_sha256"]:
        raise Problem("released film bytes do not match lean.json on origin/main")
    if target.read_bytes() != before:
        raise Problem("Docket feed changed during preparation; reread it before editing")
    if not isinstance(feed, dict):
        feed = {"videos": feed}
    # Recovering an old film must not put it ahead of newer films. Leave all existing
    # rows and their relative order/copy untouched; insert only this missing entry.
    rows = feed_rows(feed)
    index = next((i for i, row in enumerate(rows) if str(row.get("date", "")) < date), len(rows))
    feed["videos"] = rows[:index] + [entry] + rows[index:]
    feed.setdefault("media_base", RAW)
    target.write_text(json.dumps(feed, indent=2) + "\n", encoding="utf-8")
    print(f"lean: {entry['id']} is in {target}. The feed holds {len(feed['videos'])} films.")
    return 0


def cmd_email(a) -> int:
    date = marker()["date"]
    dest = run_dir(date)
    info, board = read(dest / "lean.json"), read(dest / "storyboard.json")
    post = (dest / "post.txt").read_text(encoding="utf-8").strip()
    base = f"{RAW}/runs/{date}"
    panel = info["panel"]
    score = (f"Panel median {panel['median']} after {panel['rounds']} round(s)."
             + ("" if panel["release"] == "panel_pass" else
                f" Shipped at the round cap, {panel['shortfall']} short of the bar. The judges' top defects are in report_card.json."))
    claims = read(dest / "claims.json") if (dest / "claims.json").is_file() else {"claims": []}
    rows = claims.get("claims", claims) if isinstance(claims, dict) else claims
    urls = list(dict.fromkeys(str(c.get("url")) for c in rows if isinstance(c, dict) and c.get("url")))
    credits = (dest / "credits.txt").read_text(encoding="utf-8").strip() if (dest / "credits.txt").is_file() else ""
    subject = f"Texas AI Dispatch {date} - {board['title']}"
    lines = [subject, "", f"Video (1080x1920): {base}/dispatch.mp4", f"Phone copy (720p): {base}/dispatch-720.mp4",
             f"Poster: {base}/poster.png", f"On the site: {SITE}", "",
             f"Runtime {info['duration_s']} seconds. {score}", "", "-----BEGIN CAPTION-----", post,
             "-----END CAPTION-----", "", "SOURCES"] + urls + ["", "CREDITS", credits]
    for extra in info.get("notes") or []:
        lines += ["", f"Note: {extra}"]
    if (OUT / "social.json").is_file():
        lines += ["", "SOCIAL", json.dumps(read(OUT / "social.json"), indent=2)]
    (dest / "email.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    esc = lambda s: (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    html = [f"<h2>{esc(board['title'])}</h2>",
            f'<p><a href="{base}/dispatch.mp4"><img src="{base}/poster-540.jpg" width="270" alt="poster"></a></p>',
            f'<p><a href="{base}/dispatch.mp4"><b>Download the video (1080x1920)</b></a> &middot; '
            f'<a href="{base}/dispatch-720.mp4">Phone copy (720p)</a> &middot; <a href="{SITE}">On the site</a></p>',
            f"<p>Runtime {info['duration_s']} seconds. {esc(score)}</p>", "<h3>Caption, ready to paste</h3>",
            f'<pre style="white-space:pre-wrap;font-family:inherit">{esc(post)}</pre>', "<h3>Sources</h3><ul>"]
    html += [f'<li><a href="{u}">{esc(u)}</a></li>' for u in urls]
    html += ["</ul>", "<h3>Credits</h3>", f'<pre style="white-space:pre-wrap;font-family:inherit">{esc(credits)}</pre>']
    (dest / "email.html").write_text("\n".join(html) + "\n", encoding="utf-8")
    print(f"lean: runs/{date}/email.md and email.html. Subject: {subject}\n"
          "Create the Gmail DRAFT with email.html as htmlBody, addressed to the connected profile's own "
          "address, read it back, then: lean.py receipt --draft-id <id>")
    return 0


def cmd_commit(a) -> int:
    """Stage and commit the edition. `--sparse` matters: a plain `git add` silently skips the
    video files in a sparse checkout, and the pull request then ships an edition with no film."""
    date = marker()["date"]
    dest = run_dir(date)
    if not (dest / "lean.json").is_file():
        raise Problem("deliver first: lean.py deliver")
    git = lambda *args: subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True)
    git("config", "user.name", "Talon Sturgill")
    git("config", "user.email", "Talon.sturgill@gmail.com")
    paths = [f"runs/{date}", "ledger/dispatch_history.json", "video-engine/src/daily", "video-engine/public"]
    added = git("add", "--sparse", "--", *paths)
    if added.returncode != 0:
        raise Problem("git add failed: " + added.stderr.strip()[-400:])
    staged = git("diff", "--cached", "--name-only").stdout.split()
    tracked = git("ls-files", "--", f"runs/{date}/dispatch.mp4").stdout.strip()
    if f"runs/{date}/dispatch.mp4" not in staged and not tracked:
        raise Problem("the film did not stage. Run: git add --sparse -f runs/%s/dispatch.mp4" % date)
    if not staged:
        print("lean: nothing new to commit.")
        return 0
    title = read(dest / "storyboard.json").get("title", "")
    done = git("commit", "-m", a.message or f"Dispatch {date}: {title}")
    if done.returncode != 0:
        raise Problem("git commit failed: " + (done.stdout + done.stderr).strip()[-600:])
    print(f"lean: committed {len(staged)} files for {date}. Push the branch and open a READY pull request.")
    return 0


def cmd_receipt(a) -> int:
    date = marker()["date"]
    if not (run_dir(date) / "lean.json").is_file():
        raise Problem("deliver first: lean.py deliver")
    write(OUT / "delivered.json", {"date": date, "draft_id": a.draft_id, "pull_request": a.pr or "",
                                   "merged": bool(a.merged), "recorded_at": now()})
    print(f"lean: {date} is delivered. The run may end after the short retro.")
    return 0


def state(date: str) -> list[tuple[str, bool]]:
    return [("board", board_path().is_file()), ("voice", (OUT / "vo.wav").is_file()),
            ("timed board", (OUT / "storyboard.json").is_file()), ("rough cut", (OUT / "roughcut.mp4").is_file()),
            ("film", (OUT / "film.mp4").is_file()), ("panel says ship", (OUT / "report_card.json").is_file()
             and read(OUT / "report_card.json").get("verdict") == "ship"),
            ("edition in runs/", (run_dir(date) / "lean.json").is_file()),
            ("draft read back", (OUT / "delivered.json").is_file())]


def cmd_status(a) -> int:
    if not MARKER.is_file():
        print("lean: no run is armed.")
        return 0
    date = read(MARKER)["date"]
    print(f"lean: {date}")
    for label, done in state(date):
        print(f"    {'done' if done else '....'}  {label}")
    return 0


def cmd_no_exit(a) -> int:
    date = marker()["date"]
    rows = state(date)
    if rows[-1][1]:
        print(f"lean no-exit: {date} is delivered. The run may end.")
        return 0
    todo = next(label for label, done in rows if not done)
    print(f"lean no-exit: {date} IS NOT DELIVERED. Next thing owed: {todo}. There is no stop state short of a "
          "delivered film. Out of time, context or budget means a simpler film, never no film. Carry on.")
    return 1


# ------------------------------------------------------------------ selftest

def cmd_selftest(a) -> int:
    fails = 0

    def ok(label, cond, extra=""):
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + str(extra)}")
        fails += 0 if cond else 1

    board = {"date": "2026-11-12", "title": "T", "episode": "daily-sample", "credits": "X", "scenes": [
        {"id": "s1", "county": "Taylor", "region": "rolling_plains", "vo": "One two three four.",
         "vo_claims": ["c1"], "visual_events": [{"id": "e1", "at_phrase": "three", "duration_s": 9}],
         "sound": [{"wav": "assets/sfx/x.wav", "event_id": "e1"}]},
        {"id": "s2", "county": "Taylor", "region": "rolling_plains", "vo": "Five six seven.", "vo_claims": ["c1"]}],
        "shots": [{"id": "a", "scene_id": "s1", "framing": "wide", "view": "v1"},
                  {"id": "b", "scene_id": "s1", "framing": "close", "view": "v2", "at_phrase": "three"},
                  {"id": "c", "scene_id": "s2", "framing": "medium", "view": "v3"}]}
    times = [0.5, 0.9, 1.4, 1.9, 3.0, 3.4, 3.9]
    words = [{"word": w, "start": t, "end": t + 0.3} for w, t in zip("One two three four. Five six seven.".split(), times)]
    cues = [{"start": 0.5, "end": 2.2, "text": "One two three four."}, {"start": 3.0, "end": 4.2, "text": "Five six seven."}]
    timed, sfx = timed_board(board, words, cues)
    s1, s2 = timed["scenes"]
    ok("the first scene starts at zero", s1["start_s"] == 0.0)
    ok("the second scene cuts in the pause before its first word", 2.2 <= s2["start_s"] < 3.0, s2["start_s"])
    ok("scenes tile the story with no hole", abs(s1["start_s"] + s1["duration_s"] - s2["start_s"]) < 1e-6
       and abs(s2["start_s"] + s2["duration_s"] - timed["runtime_s"]) < 1e-6)
    e = s1["visual_events"][0]
    ok("an event lands on its phrase", abs(e["at_s"] - 1.4) < 1e-6, e)
    ok("an event is clamped inside its scene", e["at_s"] + e["duration_s"] <= s1["duration_s"] + 1e-6, e)
    ok("a sound rides its event", sfx and abs(sfx[0]["at_s"] - 1.4) < 1e-6, sfx)
    shots = timed["shots"]
    ok("shots are in order and cover every scene", [x["id"] for x in shots] == ["a", "b", "c"]
       and abs(shots[1]["start_s"] - 1.4) < 1e-6 and abs(shots[2]["start_s"] - s2["start_s"]) < 1e-6, shots)
    ok("no shot is shorter than a blink", all(x["duration_s"] >= 0.4 for x in shots), shots)
    try:
        timed_board(board, words[:-1], cues)
        ok("a narration edit after the voice is refused", False)
    except Problem:
        ok("a narration edit after the voice is refused", True)
    ok("house style catches a dash and a colon and leaves a clock time",
       len(copy_problems("x", "A \u2014 b: c at 9:30")) == 2, copy_problems("x", "A \u2014 b: c at 9:30"))
    limits = cfg()["film"]
    thin = plan_problems(board, limits, 120)
    ok("a thin board is caught on paper: no treatment, no throughline, no one on screen, too few beats",
       sum(any(k in p for p in thin) for k in ("treatment.logline", "throughline", "beats for about",
                                               "shots name a person", "draw needs a subject")) == 5, thin)
    n = 12
    rich = {"treatment": {k: "x" for k in ("logline", "cold_open", "turn", "button")},
            "hero": {"name": "the pole camera", "why": "it is the machine the story is about"},
            "throughline": {"object": "the clipboard", "states": [{"scene_id": f"s{i}", "state": "changed"} for i in (1, 5, 12)]},
            "scenes": [{"id": f"s{i}", "visual_events": [
                {"id": f"s{i}-{j}", "draw": {"subject": "the lineworker", "action": "points at the pole"},
                 "sound": __file__, "label": "Crack found" if j == 0 else ""} for j in range(2)]} for i in range(1, n + 1)],
            "shots": [{"id": f"h{i}", "scene_id": f"s{i // 2 + 1}", "framing": "wide", "view": f"v{i // 2}",
                       "cast": ["lineworker"] if i % 3 else []} for i in range(2 * n)]}
    ok("a board with the full plan passes", plan_problems(rich, limits, 300) == [], plan_problems(rich, limits, 300))
    held = {"runtime_s": 30.0, "scenes": [{"start_s": 0.0, "visual_events": [{"at_s": 0.0}, {"at_s": 4.0}]},
                                          {"start_s": 12.0, "visual_events": [{"at_s": 9.5}]}]}
    ok("a stretch with no new picture is named on the measured clock",
       len(beat_problems(held)) == 2 and "4.0s to 21.5s" in beat_problems(held)[0], beat_problems(held))
    said = "The lineworker ticks the first box, and then she waits for the crew.".split()
    heard = [{"text": w, "center": 1.0 + 0.4 * i} for i, w in enumerate(
        "The line worker ticks the first box and then she waits for the crew".split())]
    got = match_times(said, heard)
    ok("a word the recognizer split still gets a measured time, in order",
       len(got) == len(said) and got == sorted(got) and abs(got[2] - heard[3]["center"]) < 1e-6, got)
    spans = cue_spans(said)
    ok("captions break at the comma and carry every word once",
       [w for a, b in spans for w in said[a:b]] == said and len(spans) == 2, spans)
    ok("the bar is read from the rubric", bar() > 0)
    ok("the config parses", cfg()["panel"]["judges"] >= 1 and cfg()["panel"]["round_cap"] >= 1)
    if a.render:
        work = REPO / "out" / "selftest"
        work.mkdir(parents=True, exist_ok=True)
        ref = read(REPO / "runs" / "2026-10-21" / "storyboard.json")
        ref["episode"] = "reference-2026-10-21"
        ref["shots"] = ref["film_direction"]["shots"]   # Remotion merges props over the default board
        write(work / "reference.json", ref)
        for name, props, frame in (("default", None, 60), ("reference", work / "reference.json", 300)):
            target = work / f"{name}.png"
            target.unlink(missing_ok=True)
            cmd = ["npx", "--no-install", "remotion", "still", "src/index.ts", "Daily", str(target),
                   f"--frame={frame}", "--scale=0.5", "--log=error"] + ([f"--props={props}"] if props else [])
            proc = subprocess.run(cmd, cwd=ENGINE, capture_output=True, text=True)
            ok(f"the Daily composition renders the {name} board", proc.returncode == 0 and target.is_file()
               and target.stat().st_size > 20000, (proc.stdout + proc.stderr)[-600:])
    print("\nlean selftest: " + ("clean" if not fails else f"{fails} failure(s)"))
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init"); p.add_argument("--date", required=True); p.set_defaults(fn=cmd_init)
    sub.add_parser("script").set_defaults(fn=cmd_script)
    p = sub.add_parser("voice"); p.add_argument("--takes", type=int, default=1); p.set_defaults(fn=cmd_voice)
    sub.add_parser("time").set_defaults(fn=cmd_time)
    p = sub.add_parser("still"); p.add_argument("--at", required=True); p.add_argument("--scale", default="0.5"); p.set_defaults(fn=cmd_still)
    p = sub.add_parser("cut"); p.add_argument("--draft", action="store_true"); p.set_defaults(fn=cmd_cut)
    sub.add_parser("frames").set_defaults(fn=cmd_frames)
    p = sub.add_parser("check"); p.add_argument("--board", action="store_true"); p.set_defaults(fn=cmd_check)
    p = sub.add_parser("panel"); p.add_argument("--scores", required=True)
    p.add_argument("--hard-fail", action="append"); p.add_argument("--defects"); p.set_defaults(fn=cmd_panel)
    sub.add_parser("deliver").set_defaults(fn=cmd_deliver)
    p = sub.add_parser("feed"); p.add_argument("--docket", required=True); p.add_argument("--county", required=True)
    p.add_argument("--caption"); p.add_argument("--date"); p.set_defaults(fn=cmd_feed)
    p = sub.add_parser("feed-pending"); p.add_argument("--docket", required=True); p.set_defaults(fn=cmd_feed_pending)
    sub.add_parser("email").set_defaults(fn=cmd_email)
    p = sub.add_parser("commit"); p.add_argument("--message"); p.set_defaults(fn=cmd_commit)
    p = sub.add_parser("receipt"); p.add_argument("--draft-id", required=True); p.add_argument("--pr")
    p.add_argument("--merged", action="store_true"); p.set_defaults(fn=cmd_receipt)
    sub.add_parser("status").set_defaults(fn=cmd_status)
    sub.add_parser("no-exit").set_defaults(fn=cmd_no_exit)
    p = sub.add_parser("selftest"); p.add_argument("--render", action="store_true"); p.set_defaults(fn=cmd_selftest)
    a = ap.parse_args()
    try:
        return a.fn(a)
    except Problem as exc:
        print(f"\nlean {a.cmd}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
