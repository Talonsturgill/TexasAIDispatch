// =============================================================================
// SCALE — the metre, defined once.
//
// WHY THIS FILE EXISTS
//
// `const M = 610 / 1.7` was written out in TEN modules. Nothing was wrong with any
// of them, which is exactly the condition CLAUDE.md names as the dangerous one: a
// number restated in a second place is a number that will be wrong in one of them.
// The sibling lost five panel rounds to a threshold written down twice, and this
// engine's most load-bearing constant was written down ten times.
//
// The consequence of a divergence here is worse than a wrong threshold, because it
// is silent. Every drawing in a module is sized against its own copy, so a module
// whose copy drifted renders internally consistent and wrong only in comparison:
// a longhorn from one file standing beside a person from another, both perfectly
// proportioned, at two different scales. `staging_check.py` measures against the
// declared metre, so a bad metre passes its own check.
//
// The nostalgia wave was about to add eight more copies. One definition instead.
//
// `engine_lint.py` fails on a second definition of the metre anywhere in the engine.
// =============================================================================

/**
 * Draw units per metre.
 *
 * From the Character rig, which is 610 draw units sole to crown at 1.70 m. Every
 * dimension table in the engine is real-world metres, and every drawing converts
 * through this, so `scale={1}` means the same thing in every module and a board
 * author never discovers a component's private convention by rendering it.
 */
export const M = 610 / 1.7;

/**
 * A module's own `fit`, bound to its dimension table.
 *
 * `local` is the reference height in the drawing's own coordinate frame, the number
 * the paths were built around. The table says what that height IS in metres. The
 * product is the scale factor that puts the drawing on the stage at true size.
 *
 * Each module still owns its table, because the measurement of a grain elevator
 * belongs beside the grain elevator. Only the metre is shared.
 */
export function fitter<T extends Record<string, {h: number}>>(table: T) {
  return (k: keyof T, local: number) => (table[k].h * M) / local;
}

/**
 * Deterministic 0..1 from a seed and a channel.
 *
 * Remotion renders frames independently, so anything that varies has to vary the
 * same way on every frame and on every re-render. A critic who asks for one fix and
 * gets a different picture back cannot tell whether the fix worked.
 *
 * `ch` is a channel number so one seed drives many independent-looking choices in a
 * single drawing: which way a post leans, where the dent is, how the tail vane sits.
 */
export function rnd(seed: number, ch: number): number {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
}
