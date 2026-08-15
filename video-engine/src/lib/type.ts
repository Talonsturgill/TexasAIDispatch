// =============================================================================
// TYPE — how wide a string is, and where to break it.
//
// WHY THIS FILE EXISTS
//
// `HandsetAlert` drew "FLASH FLOOD WARNING" at font size 9 inside a panel 70 units
// wide, and the string is about 12.3 ems, which is 111 units. It ran a third of the
// way out of the phone, across the lock screen and off the glass, on the one beat
// this show has about an emergency message. It shipped that way through every gate
// the repo has, because no gate reads type.
//
// THE HARDER HALF, and it is the reason this is a file rather than a shorter string.
// `headline` and `body` are PROPS. Shortening the one string this repo passes today
// fixes today and nothing else: the next caller writes a longer warning and the
// panel overflows again with no warning of its own. A drawing that accepts text has
// to be able to set that text.
//
// HOW THE WIDTHS WERE GOT. Measured, not guessed, and not from a font table either.
// A probe rendered real strings through the real renderer at font size 30, in BOTH
// shipped faces at BOTH weights, and the ink was measured off the PNG. The widest of
// the four is what each class is held to:
//
//                                 Manrope 400   Manrope 700   Fraunces 400   Fraunces 700
//     FLASH FLOOD WARNING            326 px        341 px        368 px         385 px
//     WARNING                        132           140           150            158
//     Move to higher ground now.     376           396           383            409
//     nnnnnnnnnn                     177           186           181            195
//     WWWWWWWWWW                     280           292           305            323
//
// The per-class numbers below sit ABOVE every realistic string in that set, so the
// estimate errs long and a line wraps early rather than running out of its box.
// `tests/type_fit.mjs` holds those measurements as fixtures and fails if a change
// makes the estimate optimistic about any of them.
//
// THEY WERE RE-MEASURED WHEN THE FACES CHANGED, and they had to be. The first set was
// taken from DejaVu Serif, which is what a Linux box substitutes for the Georgia this
// engine used to ask for and never shipped. Manrope's lowercase is wider: a run of
// n's measures 0.62 em against DejaVu's 0.497, so the old `lower: 0.52` was under the
// truth the moment the typeface changed. **A width table belongs to a face**, and
// changing the face without re-measuring would have put the estimate below reality
// while every gate still reported green.
//
// WHAT THIS CANNOT DO, said plainly. It is an estimate of a proportional face, so a
// string of nothing but capital Ms or Ws is under-counted, by up to 1.3x for a run of
// Ws in Fraunces. Those two runs are in the fixtures as a record of the limit rather
// than as a bound the estimate has to clear. Wrapping is what makes it survivable: a
// wrong width estimate moves a line break, where a hand-tuned font size moved text
// off the edge.
// =============================================================================

/**
 * THE THREE STACKS, WRITTEN DOWN ONCE.
 *
 * `Georgia, serif` was written out at 61 sites, `ui-monospace, monospace` at 8 and
 * `'JetBrains Mono', monospace` at 5, and none of those faces was shipped. A stack
 * restated in seventy places is a stack that will be wrong in one of them, and here
 * every one of them was wrong at once.
 *
 * `display` is the film's voice and the sheets' headings. `body` is everything a
 * reader reads at length, and everything drawn INSIDE the world as user interface,
 * because a phone does not set its alerts in a display serif. `mono` is data.
 *
 * The fallbacks after each family are what a machine without the shipped face would
 * use. They are there so a missing file degrades instead of disappearing, not because
 * anything is expected to reach them: `font_check.py` refuses a family this repo does
 * not ship.
 */
export const FONT = {
  display: '"Fraunces", Georgia, serif',
  body: '"Manrope", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

/** Advance width in ems, per character class, ABOVE the measured worst realistic case. */
const EM = {
  upper: 0.74,   // real headlines run 0.572 to 0.752 across the four faces
  lower: 0.62,   // sentences run 0.482 to 0.558, a run of n's reaches 0.620
  digit: 0.65,
  space: 0.30,
  punct: 0.40,
} as const;

/** Bold against regular, measured across both faces at about 1.05x. */
const BOLD = 1.08;

const classOf = (ch: string): keyof typeof EM => {
  if (ch === ' ') return 'space';
  if (ch >= '0' && ch <= '9') return 'digit';
  if (ch >= 'A' && ch <= 'Z') return 'upper';
  if (ch >= 'a' && ch <= 'z') return 'lower';
  return 'punct';
};

/**
 * How wide `s` is, in ems, erring long.
 *
 * Multiply by the font size to get draw units in the frame the text is drawn in.
 */
export function widthEm(s: string, bold = false): number {
  let w = 0;
  for (const ch of s) w += EM[classOf(ch)];
  return bold ? w * BOLD : w;
}

/** Draw units, which is what a caller with a box actually wants to compare against. */
export const widthOf = (s: string, fontSize: number, bold = false) =>
  widthEm(s, bold) * fontSize;

/**
 * Break `s` into lines that each fit `maxUnits` at `fontSize`.
 *
 * A word longer than the whole line is NOT broken mid-word and NOT dropped: it goes
 * on a line of its own and overflows, because a silently truncated warning is worse
 * than an ugly one and a caller needs to be able to see what they did. `overflows`
 * reports it so a gate can refuse it.
 */
export function wrapToWidth(
  s: string, maxUnits: number, fontSize: number, bold = false,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && widthOf(candidate, fontSize, bold) > maxUnits) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** The lines of `s` that still do not fit, which is only ever an unbreakable word. */
export const overflows = (
  s: string, maxUnits: number, fontSize: number, bold = false,
): string[] =>
  wrapToWidth(s, maxUnits, fontSize, bold)
    .filter((l) => widthOf(l, fontSize, bold) > maxUnits);
