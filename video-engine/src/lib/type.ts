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
// A probe rendered real strings through the real renderer at font size 30 and the
// ink was measured off the PNG:
//
//     FLASH FLOOD WARNING   369 px    0.647 em/char   bold
//     WARNING               147 px    0.700 em/char   bold
//     MMMMMMMMMM            282 px    0.940 em/char   bold
//     Move to higher ...    340 px    0.436 em/char   regular
//     iiiiiiiiii             83 px    0.277 em/char   regular
//
// The per-class numbers below sit ABOVE every realistic string in that set, so the
// estimate errs long and a line wraps early rather than running out of its box.
// `tests/type_fit.mjs` holds those measurements as fixtures and fails if a change
// makes the estimate optimistic about any of them.
//
// WHAT THIS CANNOT DO, said plainly. It is an estimate of a proportional face, so a
// string of nothing but capital Ms or Ws is under-counted, and the exact face is not
// even known: every drawing in this engine asks for `Georgia, serif` and the repo
// ships no font, so the renderer substitutes whatever the machine has. These numbers
// were taken from that substitute. Wrapping is what makes that survivable: a wrong
// width estimate moves a line break, where a hand-tuned font size would have moved
// text off the edge.
// =============================================================================

/** Advance width in ems, per character class, ABOVE the measured worst realistic case. */
const EM = {
  upper: 0.75,   // measured 0.647 to 0.700 across real headlines
  lower: 0.52,   // measured 0.436 to 0.497
  digit: 0.62,
  space: 0.28,
  punct: 0.38,
} as const;

/** Bold is wider than regular in every face worth using. Measured at about 1.06x. */
const BOLD = 1.1;

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
