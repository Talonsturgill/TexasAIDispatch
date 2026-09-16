import {widthOf, wrapBreakableToWidth, wrapToWidth} from './type';

/** Balance complete phrases without inventing word timings or dropping a word. */
export function captionLayout(text: string, width: number): {lines: string[]; size: number} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return {lines: [], size: 48};
  for (let size = 48; size >= 32; size -= 2) {
    const greedy = wrapToWidth(text, width, size, true);
    if (greedy.length > 3 || greedy.some((line) => widthOf(line, size, true) > width)) continue;
    const count = greedy.length;
    const target = widthOf(words.join(' '), size, true) / count;
    // At most three lines. Minimise raggedness across all lines, including the last,
    // so a lone trailing word doesn't hang below a nearly full paragraph.
    const solve = (start: number, remaining: number): {lines: string[]; cost: number} | null => {
      if (!remaining) return start === words.length ? {lines: [], cost: 0} : null;
      let best: {lines: string[]; cost: number} | null = null;
      for (let end = start + 1; end <= words.length - remaining + 1; end++) {
        const line = words.slice(start, end).join(' ');
        const measured = widthOf(line, size, true);
        if (measured > width) break;
        const tail = solve(end, remaining - 1);
        if (!tail) continue;
        const cost = (measured - target) ** 2 + tail.cost;
        if (!best || cost < best.cost) best = {lines: [line, ...tail.lines], cost};
      }
      return best;
    };
    return {lines: solve(0, count)?.lines ?? greedy, size};
  }
  throw new Error('Caption is too dense for three readable lines. Rebuild shorter cues from measured speech boundaries.');
}

export type CreditRow = {text: string; heading: boolean; y: number; size: number};

/** Keep the supplied source/music text intact; the masthead supplies the brand separately. */
export function creditLayout(text: string, width: number, top: number, bottom: number): CreditRow[] {
  const raw = text.split('\n').map((line) => line.trim()).filter(Boolean)
    .filter((line) => line.toUpperCase() !== 'TEXAS AI DOCKET');
  for (const size of [32, 30, 28, 26]) {
    const rows: CreditRow[] = [];
    let y = top;
    for (const line of raw) {
      const heading = line === line.toUpperCase() && line.length < 24;
      if (heading && rows.length) y += 22;
      // Headers are monospaced with tracking; keep their full advance inside the box.
      const rowSize = heading ? 22 : size;
      const wrapWidth = heading ? width - line.length * 3 : width;
      for (const part of wrapBreakableToWidth(line, wrapWidth, rowSize)) {
        y += heading ? 30 : size * 1.32;
        rows.push({text: part, heading, y, size: rowSize});
      }
      if (heading) y += 8;
    }
    if (y + 10 <= bottom) return rows;
  }
  throw new Error('Credits exceed the readable end-card area. Use compact source labels and preserve the complete music attribution.');
}
