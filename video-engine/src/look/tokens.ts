/**
 * LOOK V2 TOKENS (owner, November 13th, 2026).
 *
 * The owner, that day, on the daily films: "very 2D ... every corner is very sharp ... faded colors.
 * I want more pungent ... think about how Apple MacBook they do it ... sometimes I'll see a floating
 * arm ... you could tell it's code as art." The same day the measured TikTok curves put the Texas
 * film at 48% of viewers left at three seconds, and the sibling Alaska film at 74%.
 *
 * Look v2 is a LAYER. It never edits a shared drawing under `src/lib/` or `src/modern/`, and it is on
 * ONLY when the timed board says `look: "v2"`. `lean.py time` stamps that on every board dated on or
 * after `look.v2_from` in config/lean_routine.json. A storyboard without the field (every edition
 * shipped before look v2) renders exactly as it did, byte for byte.
 *
 * knowledge/craft/LOOK_V2.md is the blueprint these numbers come from.
 */
export const LOOK_V2_FROM = '2026-11-14';   // documentation only; config/lean_routine.json decides

export type LookBoard = {date?: string; look?: string; tone?: string};

export const lookActive = (board: LookBoard): boolean => board.look === 'v2';

/**
 * THE FIVE TONES. Every film declares one, the board check rotates them, and the tone picks the
 * grade. A tone is how the story should leave a viewer, never a judgment of the people in it.
 */
export type Tone = 'wonder' | 'explainer' | 'win' | 'watch' | 'people';
export const TONES: Tone[] = ['wonder', 'explainer', 'win', 'watch', 'people'];

export type Grade = {
  /** key light, a warm or cool glow from the top of frame */
  key: string;
  /** the colour the highlights lean toward */
  high: string;
  /** the colour the shadows lean toward */
  low: string;
  /** the accent the captions and chips spend on the word that matters */
  accent: string;
  accentInk: string;
  /** a second accent for gradients on chips */
  accent2: string;
  /** sky multiply, top and mid */
  sky: string;
  sky2: string;
  /** ground overlay */
  ground: string;
  saturate: number;
  contrast: number;
  brightness: number;
};

/**
 * Saturated, separated, lit. Each grade lifts the shared drawings out of the haze by about a third
 * in chroma and pushes highlights and shadows apart in hue, which is what reads as "lit" rather
 * than "printed". Values were picked by eye on real frames of the November 12th film and then
 * checked for caption contrast (white 800 weight on the accent pill is above 4.5 to 1 on all five).
 */
export const GRADES: Record<Tone, Grade> = {
  wonder: {key: '#ffd27a', sky: '#3d6fd6', sky2: '#9cc4ff', ground: '#ff9a3c', high: '#ffb347', low: '#1b3a8a', accent: '#ffcc00', accentInk: '#1a1200',
    accent2: '#ff8a00', saturate: 1.55, contrast: 1.2, brightness: 0.99},
  explainer: {key: '#bfe9ff', sky: '#2f8fe0', sky2: '#a6dcff', ground: '#ffb35c', high: '#6fd3ff', low: '#2a1e78', accent: '#22d3ee', accentInk: '#04212a',
    accent2: '#6366f1', saturate: 1.5, contrast: 1.18, brightness: 0.97},
  win: {key: '#fff1a8', sky: '#3aa0e8', sky2: '#b8e6ff', ground: '#ffc24a', high: '#ffd166', low: '#0f5b4a', accent: '#a3e635', accentInk: '#142200',
    accent2: '#22c55e', saturate: 1.55, contrast: 1.18, brightness: 1.01},
  watch: {key: '#ffb199', sky: '#5b4bc4', sky2: '#e2a6c8', ground: '#ff7a45', high: '#ff7a59', low: '#1e1b4b', accent: '#ff5d5d', accentInk: '#2a0505',
    accent2: '#f59e0b', saturate: 1.45, contrast: 1.22, brightness: 0.97},
  people: {key: '#ffd6a5', sky: '#4a7be0', sky2: '#ffc7a8', ground: '#ff9a52', high: '#ff9f6b', low: '#3b1f5e', accent: '#ff9f1c', accentInk: '#2a1300',
    accent2: '#ff4d6d', saturate: 1.52, contrast: 1.18, brightness: 0.97},
};

export const gradeFor = (tone?: string): Grade => GRADES[(TONES as string[]).includes(String(tone)) ?
  (tone as Tone) : 'explainer'];

/** Soft, rounded, layered. The radius and shadow every v2 surface shares. */
export const SURFACE = {
  radius: 28,
  shadow: '0 18px 40px rgba(8, 10, 30, 0.35), 0 4px 10px rgba(8, 10, 30, 0.25)',
  ink: '#101326',
  paper: '#fbf8f2',
};
