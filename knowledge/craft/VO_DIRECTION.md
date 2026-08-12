# VO direction — designing the read before it is synthesised

A flat read is the fastest way to make good pictures feel like a corporate explainer. The voice
carries more of a Dispatch's authority than any single frame, and it is the one element a viewer
judges in the first two seconds without knowing they are judging it.

This is the plan the `vo-director` agent writes into `out/dispatch/vo_direction.json` before a
single sample is synthesised.

---

## The three rules that are not yours to change

### 1. Emotion lives in the notes, NEVER in a tag

Direction written inline **can be read aloud by the model.** A narrator who says the word
"excited" has ended the film, and no amount of good pictures recovers it.

`vo_soundcheck.py` greps every transcript for the direction vocabulary and refuses a take that
contains it, because a rule that depends on everyone remembering it is not a rule. But the check
is a net, not a method. **The method is to direct with intent, emphasis, pace and energy**, which
are things a model performs, rather than with adjectives, which are things a model may pronounce.

Write: *"lands the number flat, no lift on the last word, then a full beat."*
Never write: `[excited]`.

### 2. Never plan for a time-stretch

If a line runs long, the fix is a **shorter line.** Time-stretching audio to fit a cut is banned
in `CLAUDE.md` because it produces the chipmunk-or-molasses artefact that every viewer hears and
cannot name.

So when you mark a line as at risk of running long, you are asking the director to **cut words**,
and your note should say which ones you would lose.

### 3. The whole passage is one call

Gemini synthesises the entire read in a single request so sentence-to-sentence flow is natural.
Your plan is therefore for a **continuous read**, not for a set of independent lines. A line's
energy is relative to the line before it, and that only means anything if you planned them
together.

---

## What a good plan carries, per line

- **intent** — a few words on what this line is doing. Setting up, landing, turning, releasing.
- **emphasis** — which word carries it. One per line. Two is none.
- **energy** — relative to the previous line, on a scale you keep consistent through the piece.
- **pause after** — in beats. This is where most of the pacing actually lives.
- **risk** — long, awkward, or containing a name that will be mispronounced.

## Energy contrast is the whole craft

A read at one energy for sixty seconds is a drone however warm the voice is, and
`vo_soundcheck.py` measures that as pitch variance and refuses it.

**Plan the drops as deliberately as the lifts.** The quietest line in the piece should sit near
the most important fact, because a number delivered quietly after a loud line is heard, and the
same number delivered at the same energy as everything around it is not.

The commonest failure is a read that rises steadily to the end. That is a speech. A Dispatch
should land somewhere lower and more certain than its middle.

---

## Texas pronunciation is not optional

`TexasAIDocket`'s `knowledge/shared/TEXAS_PRONUNCIATION.md` carries the names a stranger gets
wrong, and getting one wrong in the first ten seconds costs the film its authority with exactly
the audience it is for.

The ones that recur on our beat: **Mexia**, **Boerne**, **Bexar**, **Manchaca**, **Refugio**,
**Palacios**, **Bowie**, **Burnet**, **Gruene**, **Llano**, **Miami** (the Texas one), **Nacogdoches**,
**Waxahachie**, **Quanah**, **Pedernales**.

**Spell the pronunciation phonetically in the script itself** when a name is one of these. The
model reads what it is given, and a note in a plan it never sees does nothing.

---

## The read this show is going for

Not a news anchor. Not a documentary hush. Not an explainer's bright upward lilt.

**A person who knows the subject, telling you something they think you should know**, at the pace
somebody actually talks. Slightly dry. Willing to leave a silence. The authority comes from the
facts being right, so the delivery does not have to work for it.

The test: **does this sound like somebody who has been to the county the story is about?** If it
sounds like it was read off a screen by somebody who has not, the read has failed even when every
word is correct.
