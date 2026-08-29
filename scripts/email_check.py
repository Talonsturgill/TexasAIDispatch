#!/usr/bin/env python3
"""email_check.py — the email that gates the POST must contain the POST.

WHY THIS EXISTS, AND IT IS THE PLAINEST FAULT THIS PROJECT HAS SHIPPED

On 2026-08-29 the run wrote its Gmail draft, and the owner opened it and found no
caption and no link to the video. Their words: the one thing I needed most is not
actually there.

The draft ran to about a hundred and forty lines. Panel scores, axis table, budget
ledger, eight machine defects with their root causes, a note on commit signatures.
Every word of it true and none of it postable. The film it exists to accompany was
not linked, and the words to post with it did not appear anywhere.

**THE ROUTINE'S OWN SPEC IS WHERE THIS CAME FROM, and that is the part worth fixing.**
`prompts/dispatch_routine.md` Phase 9 opened by calling this email "the only human
touchpoint, and it gates the POST", and then listed what to include: the honest score,
what the gates said, what degraded, the VO soundcheck, and the machine upgrades. Five
items, every one internal reporting, and THE POST IS NOT ONE OF THEM. A run following
that list exactly produces the email the owner got.

So this is not a discipline problem and it cannot be fixed by remembering. A deliverable
that is not in the spec is a deliverable that will be missing again next week.

WHAT THIS CHECKS. The run writes its draft body to `runs/<date>/email.md` before
creating the Gmail draft, so the thing that ships is a committed artifact rather than a
side effect of a tool call nothing can read back. This gate refuses that file unless:

  1. It carries the CAPTION, in a block a person can copy without editing.
  2. It links the VIDEO, by a URL that resolves to the run's own master.
  3. It links the PHONE RENDITION and the POSTER, because a post needs both.
  4. It links the film ON THE SITE, which is what a reader gets sent.
  5. The caption obeys the house rules, since it is published copy the moment it is
     pasted: no dashes, no colons or semicolons, no emojis, no first person outside a
     quote, no "cannot", and no sentence opening with And or But.
  6. THE POST COMES FIRST. The caption and the links must appear before the report, and
     the check is on POSITION rather than on presence, because an email that buries the
     deliverable under a hundred lines of retro has failed at the thing it is for even
     though every string is technically in the file.

    email_check.py --email runs/2026-08-28/email.md --date 2026-08-28
    email_check.py --self-test

Exit 0 the email is postable, 1 it is not, 2 the checker could not run.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

CAPTION_OPEN = "-----BEGIN CAPTION-----"
CAPTION_CLOSE = "-----END CAPTION-----"

# How far into the email the deliverable may sit before it is buried. The 2026-08-29
# draft put the score at line 20 and never reached a link at all; a reader who has to
# scroll past the retro to find the video has been handed a report, not a post.
POST_BY_LINE = 40

DASHES = "—–"
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
FIRST_PERSON = re.compile(r"\b(I|we|our|us|my|me)\b", re.I)


def house_problems(caption: str) -> list[str]:
    """The caption is published copy the moment it is pasted, so it is held to the rules."""
    p: list[str] = []
    if any(d in caption for d in DASHES):
        p.append("the caption contains an em or en dash, which this project never uses")
    if EMOJI.search(caption):
        p.append("the caption contains an emoji")
    if "cannot" in caption.lower():
        p.append("the caption says 'cannot', and the house rule is always \"can't\"")
    if "“" in caption or "’" in caption:
        p.append("the caption contains a curly quote, and the house rule is straight quotes")
    for sentence in re.split(r"(?<=[.!?])\s+", caption):
        s = sentence.strip()
        if re.match(r"^(And|But)\b", s):
            p.append(f"a sentence opens with And or But: {s[:48]!r}")
    # A colon or semicolon in prose. A clock time and a ratio are numbers, not
    # punctuation, so a colon between digits is left alone.
    for m in re.finditer(r"[;:]", caption):
        i = m.start()
        before = caption[i - 1] if i else ""
        after = caption[i + 1] if i + 1 < len(caption) else ""
        if m.group() == ":" and before.isdigit() and after.isdigit():
            continue
        p.append(f"the caption uses a colon or semicolon in prose near {caption[max(0,i-24):i+8]!r}")
        break
    quoted = " ".join(re.findall(r'"[^"]*"', caption))
    outside = caption
    for q in re.findall(r'"[^"]*"', caption):
        outside = outside.replace(q, " ")
    if FIRST_PERSON.search(outside):
        p.append("the caption uses first person outside a verbatim quote")
    return p


def check(email: Path, date: str) -> list[str]:
    if not email.exists():
        return [f"there is no email payload at {email}. The run must WRITE the draft body "
                f"before creating it in Gmail, so the thing that ships is an artifact a gate "
                f"can read rather than a side effect of a tool call."]
    text = email.read_text(encoding="utf-8")
    lines = text.splitlines()
    p: list[str] = []

    if CAPTION_OPEN not in text or CAPTION_CLOSE not in text:
        p.append(f"the email carries no fenced caption. It must sit between {CAPTION_OPEN} "
                 f"and {CAPTION_CLOSE} so a person can copy it without editing, and so this "
                 f"gate can hold it to the house rules.")
        caption = ""
    else:
        caption = text.split(CAPTION_OPEN, 1)[1].split(CAPTION_CLOSE, 1)[0].strip()
        if len(caption) < 80:
            p.append(f"the caption is {len(caption)} characters, which is not a post")
        p += house_problems(caption)

    # THE MEDIA. Named by what they are for, because "a link is present" is the check
    # that passes on an email linking only the repository.
    wanted = {
        "the full video": f"runs/{date}/dispatch.mp4",
        "the phone rendition": f"runs/{date}/dispatch-720.mp4",
        "the poster": f"runs/{date}/poster.png",
    }
    for label, frag in wanted.items():
        if frag not in text:
            p.append(f"the email does not link {label} ({frag})")
    if "texasaidocket.com/videos" not in text:
        p.append("the email does not link the film on the site, which is what a reader is sent")
    if "talonsturgill.github.io" in text.lower():
        p.append("the email links the github.io host, which carries the owner's personal name "
                 "and is never published on any surface")

    # THE POST COMES FIRST. Position, not presence.
    first_link = next((i for i, ln in enumerate(lines, 1)
                       if f"runs/{date}/dispatch.mp4" in ln), None)
    first_caption = next((i for i, ln in enumerate(lines, 1) if CAPTION_OPEN in ln), None)
    for label, at in (("the video link", first_link), ("the caption", first_caption)):
        if at is not None and at > POST_BY_LINE:
            p.append(f"{label} is at line {at}, past line {POST_BY_LINE}. The report goes "
                     f"UNDER the post, not over it. An email that buries the deliverable has "
                     f"failed at the one thing it is for.")
    return p


def self_test() -> int:
    import tempfile
    fails = 0

    def ok(label: str, cond: bool, extra: str = "") -> None:
        nonlocal fails
        print(f"  {'ok  ' if cond else 'FAIL'}  {label}{'' if cond else '  ' + extra}")
        if not cond:
            fails += 1

    d = "2026-08-28"
    good = f"""READY TO POST.

  Watch    https://texasaidocket.com/videos/
  Full     https://raw.githubusercontent.com/x/y/main/runs/{d}/dispatch.mp4
  Phone    https://raw.githubusercontent.com/x/y/main/runs/{d}/dispatch-720.mp4
  Poster   https://raw.githubusercontent.com/x/y/main/runs/{d}/poster.png

{CAPTION_OPEN}
Somebody drew the Grim Reaper on the gate around a drilling floor in Midland. The pipe
crossing that floor weighs roughly two thousand pounds and a machine turns it now.
Past the fence, most producers expect nothing off their break even price.
{CAPTION_CLOSE}

THE REPORT
Panel mean 7.193.
"""
    with tempfile.TemporaryDirectory() as td:
        f = Path(td) / "email.md"
        f.write_text(good, encoding="utf-8")
        ok("a postable email passes", not check(f, d), str(check(f, d)))

        # THE FAULT THAT SHIPPED: a true, thorough, complete report with no post in it.
        report_only = "THE SCORE\n" + "\n".join(f"line {i}" for i in range(200))
        f.write_text(report_only, encoding="utf-8")
        probs = check(f, d)
        ok("the email that actually shipped on 2026-08-29 is REFUSED", len(probs) >= 4, str(probs))
        ok("...and it says the caption is missing",
           any("no fenced caption" in x for x in probs), str(probs))
        ok("...and it says the video is not linked",
           any("the full video" in x for x in probs), str(probs))

        f.write_text(good.replace(f"runs/{d}/dispatch-720.mp4", "runs/x/none.mp4"), encoding="utf-8")
        ok("a missing phone rendition is refused",
           any("phone rendition" in x for x in check(f, d)))

        f.write_text(good.replace("https://texasaidocket.com/videos/",
                                  "https://talonsturgill.github.io/TexasAIDocket/videos/"),
                     encoding="utf-8")
        probs = check(f, d)
        ok("the github.io host is refused, because it is never published anywhere",
           any("github.io" in x for x in probs), str(probs))

        # POSITION, NOT PRESENCE. Everything is here and it is all at the bottom.
        buried = "\n".join(f"retro line {i}" for i in range(60)) + "\n" + good
        f.write_text(buried, encoding="utf-8")
        probs = check(f, d)
        ok("an email with the post buried under the report is refused on POSITION",
           any("past line" in x for x in probs), str(probs))

        for bad, why in [
            ("Somebody drew a reaper — on a gate in Midland, and it stayed there for years.",
             "an em dash"),
            ("I drove out to Midland and found a reaper drawn on the gate around the floor.",
             "first person"),
            ("The rule is simple: nobody stands on that floor any more, and the machine turns.",
             "a colon in prose"),
            ("Somebody drew a reaper on a gate in Midland. And the floor behind it is empty.",
             "a sentence opening with And"),
        ]:
            f.write_text(good.replace(good.split(CAPTION_OPEN)[1].split(CAPTION_CLOSE)[0],
                                      "\n" + bad + "\n"), encoding="utf-8")
            ok(f"a caption with {why} is refused", bool(check(f, d)), bad[:40])

        # A clock time is a number, not punctuation, and must not trip the colon rule.
        f.write_text(good.replace("Past the fence,",
                                  "At 12:30 the floor was still empty. Past the fence,"),
                     encoding="utf-8")
        ok("...but a clock time is left alone, because a colon between digits is a number",
           not check(f, d), str(check(f, d)))

    print(f"email_check: {fails} failure(s)")
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--email")
    ap.add_argument("--date")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.email or not a.date:
        print("email_check: --email and --date are required", file=sys.stderr)
        return 2
    problems = check(Path(a.email), a.date)
    if problems:
        print(f"email_check: {len(problems)} problem(s). This email gates the POST, so it "
              f"has to contain the post.\n")
        for x in problems:
            print(f"  - {x}\n")
        return 1
    print("email_check: the draft leads with the caption and every media link. Postable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
