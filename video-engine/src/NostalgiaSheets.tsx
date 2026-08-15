import React from 'react';
import {useCurrentFrame} from 'remotion';
import * as Flora from './lib/flora';
import * as Skies from './lib/skies';
import * as Road from './lib/roadside';
import * as Town from './lib/hometown';
import * as Home from './lib/homeplace';
import * as Tejano from './lib/tejano';
import * as BlackTx from './lib/blacktexas';
import * as Ball from './lib/football';
import {Character, castProps} from './lib/Character';
import {RegionLight, RegionName, INK} from './lib/lighting';
import {MaterialDefs} from './lib/materials';
import {M} from './lib/scale';
import {FONT} from './lib/type';

// =============================================================================
// THE NOSTALGIA SHEETS — a review surface for the 113 artifacts of the nostalgia
// wave, and it exists for one reason: a drawing nobody has LOOKED AT is not
// finished.
//
// This repo has learned that twice already at cost. Wave V3 rendered the cast and
// found three bugs in one pass that no typecheck could see: every hat drew as a
// ring around the face, then the fix had the sign backwards and put the hats at the
// neck, and `y` was documented as the feet anchor while the local origin was at the
// shoulders. `GATE_LESSONS.md` entry 20 is about a defect that survived because the
// one review surface built to show a herd passed explicit seeds and so was
// structurally incapable of reproducing it.
//
// So the rule this file follows is the one from that lesson's second half, which is
// the half that matters more: WITHOUT A SHEET, NOBODY LOOKS AT ALL.
//
// THE SCALE OF EACH CELL IS COMPUTED, NEVER GUESSED. The first version of this file
// hand-picked a `scale=` number per artifact, and at true scale that is guaranteed
// wrong: a 30 m loblolly is eight people tall, so one scale that shows the tree
// buries the person and one that shows the person runs the tree off the top of the
// frame. The render proved it, twice. So every cell here fits its own artifact from
// the module's own metre table: `scale = boxPx / (metres * M)`. A number, from data,
// recomputable. That is this repo's first law and the sheet obeys it too.
//
// IT CARRIES A PERSON where the artifact is person height or taller, at the CELL's
// own scale, so the size is a picture and not only a printed metre. Below a person's
// height a figure would not fit the cell, so those cells print the metre alone.
//
// IT DOES NOT PASS SEEDS where a board would not. `seedFor()` fills the seed on a
// real board, so a row of unseeded duplicates is the ORDINARY case in production and
// a sheet that hand-seeds everything is testing a situation that never occurs. The
// cells leave the seed off and let the registry's default land, which is what a run
// actually does. Where two cells show the SAME artifact in two states, the second
// carries a seed only so the two are not identical twins.
//
// staging-check: exempt - a reference sheet, not a scene. It stages every artifact
// by hand for review and places nothing on a board, so it declares no habitat.
// =============================================================================

const BG = '#efe7da';
const W = 1080;
const LIGHT_INK = '#ece5d8';

// Layout constants, shared by every grid sheet.
const HEADER = 168;
const PAD = 30;
const GAP = 30;
const CELLH = 300;
const STRIDE = CELLH + GAP;

/** The height a grid sheet needs for `n` artifacts in `cols` columns. Exported so
 *  Root.tsx sets each composition to exactly this and nothing clips. A height is a
 *  number and it is computed here rather than typed in two places that drift. */
export const sheetHeight = (n: number, cols: number) =>
  HEADER + Math.ceil(n / cols) * STRIDE + PAD;

// Column counts live here once, so the component and the exported height that
// Root.tsx reads never disagree. A number restated in a second place gets wrong
// in one of them, which is this repo's first law and it holds for the sheets too.
const FLORA_COLS = 4;
const ROAD_COLS = 3;
const TOWN_COLS = 3;
const HOME_COLS = 4;
const TEJANO_COLS = 4;
const BLACK_COLS = 4;

/** The fit. Given a true height in metres and a box in draw pixels, the caller
 *  scale that renders the artifact `head` of the box tall. At scale 1 an artifact
 *  draws at `metres * M` px, by construction of `lib/scale.ts`, so the fit is a
 *  division. A true width, where the thing is wider than tall, caps it so a dance
 *  hall does not run out of its cell sideways. */
const fitCell = (mH: number, boxH: number, mW?: number, boxW?: number, head = 0.7) => {
  let s = (boxH * head) / (mH * M);
  if (mW && boxW) s = Math.min(s, (boxW * head) / (mW * M));
  return s;
};

/** A wrapped craft note. SVG text does not wrap, and the first version of the
 *  application sheets ran every note off the right edge mid sentence. The notes are
 *  where the REASON for a drawing lives, so half a sentence is the half nobody acts
 *  on, and shortening them to fit would delete the content to preserve the layout. */
const Note: React.FC<{
  x: number; y: number; w: number; text: string; size?: number; dark?: boolean;
}> = ({x, y, w, text, size = 15, dark = false}) => {
  const per = Math.floor(w / (size * 0.5));
  const lines: string[] = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if ((cur + ' ' + word).trim().length > per) { lines.push(cur.trim()); cur = word; }
    else cur += ' ' + word;
  }
  if (cur.trim()) lines.push(cur.trim());
  return (
    <g>
      {lines.map((l, i) => (
        <text key={i} x={x} y={y + i * (size * 1.32)} fontSize={size}
          fill={dark ? LIGHT_INK : INK} fontFamily={FONT.body} opacity={0.82}>{l}</text>
      ))}
    </g>
  );
};

const Head: React.FC<{title: string; sub: string; dark?: boolean}> = ({title, sub, dark}) => (
  <g>
    <text x={PAD} y={64} fontSize={38} fill={dark ? LIGHT_INK : INK}
      fontFamily={FONT.display} fontWeight="bold">{title}</text>
    <Note x={PAD} y={96} w={W - PAD * 2} text={sub} size={16} dark={dark} />
    <line x1={PAD} y1={HEADER - 24} x2={W - PAD} y2={HEADER - 24} stroke={dark ? LIGHT_INK : INK}
      strokeWidth={2} opacity={0.3} />
  </g>
);

/** A person at a given ground point and scale, for the size assertion. The 1.70 m
 *  bar shares the scale, so a wrong metre reads as a wrong picture. */
const PersonAt: React.FC<{x: number; y: number; scale: number; cast?: string}> = ({
  x, y, scale, cast = 'resident',
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.9}>
    <line x1={-46} y1={0} x2={-46} y2={-1.7 * M} stroke={INK} strokeWidth={2 / scale}
      opacity={0.35} />
    <Character {...castProps(cast)} frame={0} />
  </g>
);

/** One artifact, one component, and the shape a grid sheet is built from. */
type Spec = {
  comp: React.FC<any>;
  /** True height in metres, from the module's own metre table. Governs the fit. */
  m: number;
  /** True width in metres, set only where the thing is wider than tall. */
  w?: number;
  label: string;
  /** Extra props for the artifact (season, state, night, and so on). */
  p?: Record<string, unknown>;
  /** Draw a person beside it at the cell scale. Auto-on at m >= 1.5 unless set. */
  person?: boolean;
  /** Person casting, where a specific one reads better. */
  cast?: string;
  /** Render whole through a nested viewBox at the component's NATURAL scale, for two
   *  kinds of artifact the metre fit cannot place: a scene-width row that ignores
   *  scale (a module yard, a boot fence), and a fixed draw-unit prop that is sized
   *  relative to something else (a raspa cup sized to the cart, a sanctuary interior).
   *  A number is a native height with full 1080 width; an object frames it tightly.
   *  `ay` overrides where the component is anchored, for a field that grows DOWN. */
  field?: number | {w: number; h: number; ay?: number};
};

/** The engine of the file. Lays `specs` into a `cols` grid, computes each cell's
 *  scale from its metres, draws the artifact on the cell baseline with a faint
 *  frame, a person where one fits, and the true height as a printed datum. */
const GridSheet: React.FC<{
  title: string; sub: string; specs: Spec[]; cols: number;
  region?: RegionName; weather?: 'norther' | 'dust' | 'overcast' | 'night';
  bg?: string; dark?: boolean;
}> = ({title, sub, specs, cols, region = 'hill_country', weather, bg = BG, dark = false}) => {
  const f = useCurrentFrame();
  const H = sheetHeight(specs.length, cols);
  const colW = (W - PAD * 2) / cols;
  const ink = dark ? LIGHT_INK : INK;
  return (
    <RegionLight region={region} weather={weather}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{background: bg}}>
        {/* The material patterns the roadside, homeplace and hometown surfaces paint
            with. Without this the bark, corrugated tin and granite overlays resolve
            to nothing and the buildings lose their substance, which is exactly the
            production bug the paint-id gate caught: a matFill with no defs. */}
        <MaterialDefs />
        <Head title={title} sub={sub} dark={dark} />
        {specs.map((sp, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x0 = PAD + c * colW;
          const y0 = HEADER + r * STRIDE;
          const cx = x0 + colW / 2;
          const base = y0 + CELLH - 46; // baseline; the artifact grows up from here
          const s = fitCell(sp.m, CELLH - 60, sp.w, colW - 20);
          const showPerson = !sp.field && (sp.person ?? sp.m >= 1.5);
          // The person and the artifact split the cell so neither sits on the other.
          const ax = showPerson ? cx + colW * 0.16 : cx;
          const px = cx - colW * 0.28;
          return (
            <g key={i}>
              <clipPath id={`cell-${title.replace(/\W/g, '')}-${i}`}>
                <rect x={x0 + 4} y={y0 + 4} width={colW - 8} height={CELLH} rx={4} />
              </clipPath>
              <rect x={x0 + 4} y={y0 + 4} width={colW - 8} height={CELLH} rx={4}
                fill="none" stroke={ink} strokeWidth={1} opacity={0.16} />
              {sp.field ? (() => {
                // Fit the artifact whole through a viewBox, at its natural scale.
                const fw = typeof sp.field === 'number' ? 1080 : sp.field.w;
                const fh = typeof sp.field === 'number' ? sp.field : sp.field.h;
                // Anchor y: bottom by default, overridable for a field that grows DOWN
                // from its point (a scatter of fans) rather than up from a baseline.
                const ay = typeof sp.field === 'number' || sp.field.ay === undefined
                  ? fh - 12 : sp.field.ay;
                return (
                  <svg x={x0 + 8} y={y0 + 10} width={colW - 16} height={CELLH - 48}
                    viewBox={`0 0 ${fw} ${fh}`} preserveAspectRatio="xMidYMax meet">
                    {React.createElement(sp.comp, {x: fw / 2, y: ay, w: fw, frame: f, ...sp.p})}
                  </svg>
                );
              })() : (
                // Clip the cell so a wide ground band or an overhang stays in its box.
                <g clipPath={`url(#cell-${title.replace(/\W/g, '')}-${i})`}>
                  {showPerson && <PersonAt x={px} y={base} scale={s} cast={sp.cast} />}
                  {React.createElement(sp.comp, {x: ax, y: base, scale: s, frame: f, ...sp.p})}
                </g>
              )}
              <text x={x0 + 12} y={y0 + CELLH - 18} fontSize={13} fill={ink}
                fontFamily={FONT.body} fontWeight="bold" opacity={0.9}>{sp.label}</text>
              <text x={x0 + 12} y={y0 + CELLH - 3} fontSize={11.5} fill={ink}
                fontFamily={FONT.body} opacity={0.6}>
                {sp.m >= 1 ? `${sp.m} m` : `${(sp.m * 100).toFixed(0)} cm`} true
              </text>
            </g>
          );
        })}
      </svg>
    </RegionLight>
  );
};

// ---------------------------------------------------------------- FLORA
const FLORA_SPECS: Spec[] = [
  {comp: Flora.Loblolly, m: 30, label: 'loblolly pine', p: {season: 'summer'}, cast: 'hand'},
  {comp: Flora.BaldCypress, m: 30, w: 12, label: 'bald cypress', p: {season: 'fall', knees: 7}},
  {comp: Flora.Cottonwood, m: 25, w: 16, label: 'cottonwood', p: {season: 'fall'}},
  {comp: Flora.Pecan, m: 24, w: 20, label: 'pecan (state tree)', p: {nuts: true}},
  {comp: Flora.SabalPalm, m: 15, label: 'sabal palm', p: {skirt: true}},
  {comp: Flora.LiveOak, m: 14, w: 22, label: 'live oak', p: {}},
  {comp: Flora.PostOak, m: 12, w: 12, label: 'post oak (winter)', p: {season: 'winter'}},
  {comp: Flora.BoisDArc, m: 12, w: 12, label: "bois d'arc", p: {apples: true}},
  {comp: Flora.AsheJuniper, m: 8, label: 'ashe juniper (pollen)', p: {pollen: true}},
  {comp: Flora.CrepeMyrtle, m: 6, label: 'crepe myrtle', p: {bloom: 'watermelon'}},
  {comp: Flora.CrepeMyrtle, m: 6, label: 'crepe murder', p: {topped: true, bloom: 'none', seed: 7}},
  {comp: Flora.Huisache, m: 6, w: 7, label: 'huisache (bloom)', p: {season: 'winter'}},
  {comp: Flora.Ocotillo, m: 5, label: 'ocotillo (bare)', p: {}},
  {comp: Flora.Ocotillo, m: 5, label: 'ocotillo (leafed)', p: {leafed: true, blooming: true, seed: 9}},
  {comp: Flora.Sotol, m: 4.2, label: 'sotol (dead pole)', p: {deadStalk: true}},
  {comp: Flora.Yucca, m: 2.6, label: 'yucca (bloom)', p: {trunked: true, season: 'spring'}},
  {comp: Flora.Sunflower, m: 2, label: 'roadside sunflower', p: {}},
  {comp: Flora.GrassTuft, m: 0.6, label: 'bunchgrass tuft', p: {season: 'fall'}},
  {comp: Flora.Tumbleweed, m: 0.7, label: 'tumbleweed', p: {rolling: true}},
  {comp: Flora.Lechuguilla, m: 0.5, label: 'lechuguilla', p: {}},
  {comp: Flora.Bluebonnet, m: 0.4, label: 'bluebonnet spike', p: {}},
];

// The field-cover flora are NOT specimens. They ignore `scale` on purpose and draw
// a full scene-width band at true scale, because that is how they are used: a stand
// of grass across the near ground, not one plant. So they get their own sheet where
// each is a full-width band, fit by a nested viewBox the way the sky cards are, and
// reviewed as the ground cover they will actually be.
const FIELD_SPECS: {comp: React.FC<any>; label: string; nativeH: number; p?: Record<string, unknown>}[] = [
  {comp: Flora.WildflowerVerge, label: 'wildflower verge (blue and red together)', nativeH: 360, p: {density: 0.95}},
  {comp: Flora.Bluestem, label: 'little bluestem, October rust with silver seed', nativeH: 620, p: {season: 'fall'}},
  {comp: Flora.Cordgrass, label: 'gulf cordgrass on a coastal flat', nativeH: 620, p: {}},
  {comp: Flora.Sorghum, label: 'grain sorghum, the red brown head that is not corn', nativeH: 720, p: {rows: 4}},
  {comp: Flora.CottonField, label: 'cotton with the bolls opening', nativeH: 840, p: {opened: 0.7}},
  {comp: Flora.OrchardRow, label: 'peach orchard row in the Hill Country', nativeH: 3800, p: {crop: 'peach', fruit: true}},
];

export const FloraSheet: React.FC = () => (
  <GridSheet cols={FLORA_COLS} region="hill_country" title="Flora"
    specs={FLORA_SPECS}
    sub={
      "Twenty one specimen plants, each fit to its own cell from FLORA_M so the loblolly " +
      "at thirty metres and the bluebonnet at forty centimetres are both legible on one " +
      "sheet. The person is drawn at the CELL scale, so a big tree genuinely dwarfs the " +
      "figure and a yucca stands beside it. The failure mode to hunt is the lollipop: " +
      "every tree a green ball on a stick, told apart only by colour. Check the " +
      "silhouettes against each other, not the greens. The field-cover flora are on " +
      "their own sheet, since a stand of grass is not a specimen."} />
);

// --- FLORA FIELDS: the stands, each a full-width band at true scale.
const FIELD_BANDW = 620;      // on-screen band width; a field is repetitive so a
                              // half-width sample reads the same as the whole.
const FIELD_GAP = 40;
const FIELD_TOP = HEADER + 6;
// Each band's on-screen height keeps the field's own aspect, so a 30 m orchard row
// is a tall band and ankle-high bluestem is a short one, which is the honest picture.
const fieldBandH = (nativeH: number) => (FIELD_BANDW * nativeH) / 1080;
export const floraFieldHeight = () =>
  Math.ceil(FIELD_TOP + FIELD_SPECS.reduce((a, s) => a + fieldBandH(s.nativeH) + FIELD_GAP + 22, 0) + PAD);

export const FloraFieldSheet: React.FC = () => {
  const f = useCurrentFrame();
  let y = FIELD_TOP;
  return (
    <RegionLight region="blackland">
      <svg width={W} height={floraFieldHeight()} viewBox={`0 0 ${W} ${floraFieldHeight()}`}
        style={{background: BG}}>
        <MaterialDefs />
        <Head title="Flora, the fields" sub={
          "The stands, not the specimens. Each ignores scale on purpose and draws a full " +
          "scene-width band, so here each is a band, fit whole by its own viewBox and " +
          "shown at true internal scale. The one thing to check: a Panhandle sorghum " +
          "field is a RED BROWN head and not a corn tassel, and a cotton field carries " +
          "the open boll as a white point, not a flower."} />
        {FIELD_SPECS.map((s, i) => {
          const bh = fieldBandH(s.nativeH);
          const bx = (W - FIELD_BANDW) / 2;
          const band = (
            <g key={i}>
              <rect x={bx} y={y} width={FIELD_BANDW} height={bh} rx={4} fill="none"
                stroke={INK} strokeWidth={1} opacity={0.16} />
              <svg x={bx} y={y} width={FIELD_BANDW} height={bh}
                viewBox={`0 0 1080 ${s.nativeH}`} preserveAspectRatio="xMidYMax meet">
                {React.createElement(s.comp, {x: 540, y: s.nativeH - 24, w: 1080, frame: f, ...s.p})}
              </svg>
              <text x={bx} y={y + bh + 17} fontSize={13} fill={INK} fontFamily={FONT.body}
                opacity={0.85}>{s.label}</text>
            </g>
          );
          y += bh + FIELD_GAP + 22;
          return band;
        })}
      </svg>
    </RegionLight>
  );
};

// ---------------------------------------------------------------- SKIES
export const SkySheet: React.FC = () => {
  const f = useCurrentFrame();
  const states: {n: Skies.SkyName; label: string}[] = [
    {n: 'thunderhead', label: 'thunderhead: the ANVIL is the identification'},
    {n: 'supercell', label: 'supercell: dark base, GOLD rim, BRIGHT ground'},
    {n: 'shelfCloud', label: 'shelf: lit face, black under, SUNLIT ahead'},
    {n: 'blueNorther', label: 'norther: the DARKEST band is at the horizon'},
    {n: 'sunsetBands', label: 'sunset: BANDS, never a gradient'},
    {n: 'dustHaze', label: 'dust: the sun is a FLAT DISC you can look at'},
    {n: 'gulfOvercast', label: 'gulf overcast: NO cast shadows anywhere'},
    {n: 'seaFog', label: 'sea fog: subtraction is the technique'},
    {n: 'greenHail', label: 'green: strongest in the MID tones'},
    {n: 'smoke', label: 'smoke: deep red, and it LOSES the pink'},
    {n: 'starfield', label: 'dark sky: not black, deep blue with a grain'},
    {n: 'monsoonCells', label: 'monsoon: virga STOPS before the ground'},
  ];
  const cw = 340;
  const ch = 400;
  return (
    <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{background: BG}}>
      <Head title="Sky states" sub={
        "Twelve, each with the light it implies. The sky was a two stop gradient and on " +
        "the Llano Estacado the horizon sits in the bottom eighth of the frame, so that " +
        "gradient was seven eighths of the picture. Look for the value STRUCTURE, not " +
        "the prettiness: the norther is the one whose darkest band is at the bottom."} />
      {states.map((s, i) => {
        const c = i % 3;
        const r = Math.floor(i / 3);
        return (
          <g key={s.n} transform={`translate(${20 + c * cw} ${180 + r * (ch + 34)})`}>
            <svg width={cw - 18} height={ch} viewBox={`0 0 ${W} 1920`}
              preserveAspectRatio="xMidYMid slice">
              <Skies.Sky state={s.n} frame={f} horizonY={1500} />
            </svg>
            <rect x={0} y={0} width={cw - 18} height={ch} fill="none" stroke={INK}
              strokeWidth={1.5} opacity={0.35} />
            <Note x={0} y={ch + 18} w={cw - 22} text={s.label} size={12} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- ROADSIDE
const ROAD_SPECS: Spec[] = [
  {comp: Road.CottonGin, m: 12, w: 20, label: 'cotton gin (running)', p: {running: true, night: true}},
  {comp: Road.PoleSign, m: 11, label: 'pole sign (live)', p: {night: true, starburst: true}},
  {comp: Road.PoleSign, m: 11, label: 'pole sign (dead)', p: {dead: true, seed: 4}},
  {comp: Road.Billboard, m: 9, w: 15, label: 'billboard', p: {catwalk: true}},
  {comp: Road.StripedAFrame, m: 9, w: 12, label: 'striped A-frame', p: {night: true}},
  {comp: Road.StorefrontBlock, m: 9, w: 20, label: 'storefront block', p: {bays: 3}},
  {comp: Road.DanceHall, m: 8.5, w: 18, label: 'dance hall (open)', p: {night: true, open: true}},
  {comp: Road.CountryChurch, m: 8, w: 10, label: 'country church', p: {metal: true, graves: 5}},
  {comp: Road.FeedStore, m: 6.5, w: 12, label: 'feed store', p: {chicks: true}},
  {comp: Road.MansardBox, m: 5.2, w: 10, label: 'mansard box', p: {}},
  {comp: Road.Bandstand, m: 5, label: 'bandstand', p: {}},
  {comp: Road.Icehouse, m: 4.4, w: 12, label: 'icehouse', p: {night: true}},
  {comp: Road.DeerBlind, m: 4.2, label: 'deer blind', p: {feeder: true}},
  {comp: Road.RanchGate, m: 3.6, w: 9, label: 'ranch gate (working)', p: {}},
  {comp: Road.RanchGate, m: 3.6, w: 12, label: 'ranch gate (grand)', p: {grand: true, seed: 6}},
  {comp: Road.MotorCourt, m: 3.4, w: 16, label: 'motor court', p: {vacancy: true}},
  {comp: Road.DriveInStalls, m: 3.1, w: 14, label: 'drive-in stalls', p: {stalls: 4}},
  {comp: Road.CityLimitSign, m: 2.4, label: 'city limit sign', p: {}},
  {comp: Road.ModuleYard, m: 2.4, label: 'cotton module yard', p: {rows: 3, lint: true}, field: 1150},
  {comp: Road.HistoricalMarker, m: 1.15, label: 'historical marker', p: {}, person: true},
  {comp: Road.RoadsideMemorial, m: 0.8, label: 'roadside memorial', p: {tended: 0.35}},
  {comp: Road.BootFence, m: 1.35, label: 'boot fence', p: {posts: 7}, field: 820},
];

export const RoadsideSheet: React.FC = () => (
  <GridSheet cols={ROAD_COLS} region="rolling_plains" title="Roadside"
    specs={ROAD_SPECS}
    sub={
      "The drive-by Texas, for the far and mid planes. Two rules to check. The library " +
      "draws the FORM and never the MARK, so nothing here carries a wordmark and it is " +
      "still legible: the striped A-frame, the checkerboard feed store, the gin's " +
      "cyclones. And `closed` defaults FALSE on every building, because making every " +
      "frame a boarded window is a stranger telling a town it is dead. The dead pole " +
      "sign is the one deliberate exception, and it is the heaviest card here."} />
);

// ---------------------------------------------------------------- HOMETOWN
const TOWN_SPECS: Spec[] = [
  {comp: Town.LightMast, m: 24, label: 'light mast (halide)', p: {night: true, humidity: 0.7}},
  {comp: Town.LightMast, m: 24, label: 'light mast (LED)', p: {night: true, led: true, seed: 4}},
  {comp: Town.GoalPost, m: 9, label: 'goal post', p: {}},
  {comp: Town.ShowBarn, m: 7.5, w: 14, label: 'show barn', p: {fans: true}},
  {comp: Town.Bleachers, m: 7, w: 20, label: 'bleachers (Friday)', p: {night: true, crowd: 0.85, pressBox: true}},
  {comp: Town.RunThrough, m: 3.4, w: 8, label: 'run-through banner', p: {}},
  {comp: Town.PortableClassroom, m: 3.4, w: 9, label: 'portable classroom', p: {night: true}},
  {comp: Town.SchoolBus, m: 3.1, w: 11, label: 'school bus', p: {night: true, stopArm: true}},
  {comp: Town.SchoolMarquee, m: 2.6, w: 5, label: 'school marquee', p: {brick: true}},
  {comp: Town.DrumMajorStand, m: 1.6, label: 'drum major stand', p: {occupied: true}},
  {comp: Town.ShowSteer, m: 1.35, w: 2.2, label: 'show steer', p: {whiteFace: true, halter: true}},
  {comp: Town.HomecomingMum, m: 0.95, label: 'mum (freshman)', p: {tier: 1, seed: 3}, person: true},
  {comp: Town.HomecomingMum, m: 0.95, label: 'mum (senior triple)', p: {tier: 3, bells: 5, boa: true, seed: 9}, person: true},
  {comp: Town.MarchingBlock, m: 1.8, label: 'marching block (arc)', p: {form: 'arc', files: 7, ranks: 3}, field: {w: 1080, h: 820}},
];

export const HometownSheet: React.FC = () => (
  <GridSheet cols={TOWN_COLS} region="blackland" weather="night" bg="#171b23" dark
    title="Hometown" specs={TOWN_SPECS}
    sub={
      "Friday night, and the light is the subject. Metal halide reads pre-2015 and LED " +
      "after, and the switch is visible in one still frame: halide throws a warmer cone " +
      "and blooms in humid air, LED is cooler and cuts a harder edge. Field green under " +
      "artificial light goes ACID, closer to chartreuse than lawn. Check the mum against " +
      "the person, since if you can see the torso it is a freshman single and the senior " +
      "triple hangs to the knee."} />
);

// ---------------------------------------------------------------- HOMEPLACE
const HOME_SPECS: Spec[] = [
  {comp: Home.PierBeamHouse, m: 6.2, w: 11, label: 'pier and beam house', p: {tin: true}},
  {comp: Home.BrickRanch, m: 4.6, w: 16, label: '1970s brick ranch', p: {garage: true, coachLamp: true}},
  {comp: Home.Washateria, m: 4.2, w: 10, label: 'washateria', p: {occupied: 2}},
  {comp: Home.TrailerHouse, m: 3.6, w: 16, label: 'single-wide (with deck)', p: {deck: true, slope: 0.5}},
  {comp: Home.Carport, m: 2.7, w: 7, label: 'iron-post carport', p: {iron: true, freezer: true}},
  {comp: Home.SatelliteDish, m: 2.4, label: 'C-band mesh dish', p: {mesh: true}},
  {comp: Home.Clothesline, m: 1.9, w: 6, label: 'T-post clothesline', p: {load: 4}},
  {comp: Home.PropaneTank, m: 1.15, w: 3.4, label: 'propane tank', p: {gallons: 500}},
  {comp: Home.AboveGroundPool, m: 1.25, w: 5, label: 'pool (June)', p: {state: 'fresh'}},
  {comp: Home.AboveGroundPool, m: 1.25, w: 5, label: 'pool (late August)', p: {state: 'green', seed: 5}},
  {comp: Home.AboveGroundPool, m: 1.25, w: 5, label: 'pool (gone)', p: {state: 'gone', seed: 7}},
  {comp: Home.ChestFreezer, m: 0.88, w: 1.6, label: 'chest freezer', p: {open: true}, person: false},
  {comp: Home.BurnBarrel, m: 0.88, label: 'burn barrel (lit)', p: {lit: true}, person: false},
  {comp: Home.PorchGlider, m: 0.86, w: 1.8, label: 'porch glider', p: {shell: true, colour: '#3F7A72'}, person: false},
  {comp: Home.WindowUnit, m: 0.38, label: 'window unit', p: {ribbon: true, era: 'wood'}, person: false},
  {comp: Home.Yard, m: 1.2, w: 10, label: 'St Augustine yard', p: {brownPatch: 2}, person: false},
];

export const HomeplaceSheet: React.FC = () => (
  <GridSheet cols={HOME_COLS} region="post_oak" title="Homeplace"
    specs={HOME_SPECS}
    sub={
      "THE TEST FOR THIS SHEET: the trailer house and the brick ranch are lit the same " +
      "way. That is the module's whole argument and it is enforced by construction, since " +
      "every house here goes through the same useLight() and takes the same wear default. " +
      "If one of them looks shabbier than the other, the code is wrong, not the family. " +
      "The pool in three states is a whole summer in one row."} />
);

// ---------------------------------------------------------------- TEJANO
const TEJANO_SPECS: Spec[] = [
  {comp: Tejano.Tiendita, m: 4, w: 8, label: 'rotulo (painted)', p: {ghost: true}},
  {comp: Tejano.Tiendita, m: 4, w: 8, label: 'rotulo (vinyl over)', p: {banner: true, seed: 5}},
  {comp: Tejano.ColoniaBlock, m: 3.4, label: 'colonia block', p: {lots: 3}, field: {w: 1080, h: 900}},
  {comp: Tejano.PedestrianBridge, m: 3.4, w: 12, label: 'international bridge', p: {queue: 5, canopy: true}},
  {comp: Tejano.RaspaStand, m: 3, w: 5, label: 'raspa stand', p: {}},
  {comp: Tejano.PhotoWall, m: 2.2, w: 4, label: 'photo wall', p: {altar: true}},
  {comp: Tejano.PanaderiaRack, m: 1.9, w: 4, label: 'panaderia rack', p: {charola: true}},
  {comp: Tejano.EscaramuzaRider, m: 1.6, w: 2.4, label: 'escaramuza rider', p: {}},
  {comp: Tejano.YardShrine, m: 1.6, label: 'yard shrine', p: {night: true}},
  {comp: Tejano.Lowrider, m: 1.32, w: 5.5, label: 'lowrider (candy)', p: {lift: 0.6, sparks: true, night: true}, person: false},
  {comp: Tejano.PaleteroCart, m: 1.0, w: 1.6, label: 'paletero cart', p: {umbrella: true}, person: true},
  {comp: Tejano.StarPinata, m: 0.9, label: 'star pinata', p: {swing: 0}, field: {w: 720, h: 720}},
  {comp: Tejano.ConjuntoPair, m: 1.9, label: 'conjunto (accordion, bajo)', p: {bajo: true}, person: false},
  {comp: Tejano.RaspaCup, m: 0.18, label: 'raspa (chamoy)', p: {chamoy: true, gummies: 3}, field: {w: 240, h: 380}},
  {comp: Tejano.Comal, m: 0.3, label: 'comal (tortilla)', p: {puff: 0.8}, field: {w: 460, h: 360}},
];

export const TejanoSheet: React.FC = () => (
  <GridSheet cols={TEJANO_COLS} region="south_texas" title="Tejano and border Texas"
    specs={TEJANO_SPECS}
    sub={
      "The palette test: this sheet should be LOUD. The stock border palette is sepia and " +
      "a bleached wash, and the real thing is the syrup rack, the concha crusts, the candy " +
      "paint and the tissue paper. Heat comes from LIGHT, never from draining saturation. " +
      "Nothing here is a sombrero or a serape. Candy paint is a GRADIENT inside one panel, " +
      "and that single decision separates a lowrider from a car."} />
);

// ---------------------------------------------------------------- BLACK TEXAS
const BLACK_SPECS: Spec[] = [
  {comp: BlackTx.ShotgunHouse, m: 5.2, w: 5, label: 'shotgun house (row)', p: {row: 3}},
  {comp: BlackTx.EmancipationPark, m: 4.5, label: 'Emancipation pavilion', p: {era: 1940, crowd: 6}, field: {w: 1080, h: 1000}},
  {comp: BlackTx.Sanctuary, m: 3.4, label: 'country sanctuary', p: {country: true, band: true}, field: {w: 980, h: 400}},
  {comp: BlackTx.TrailRideColumn, m: 2.8, label: 'trail ride column', p: {riders: 6, wagons: 2}, field: {w: 1080, h: 780}},
  {comp: BlackTx.BarbecuePit, m: 2.6, w: 4, label: 'barbecue pit (tank)', p: {lit: true, hour: 0.15}},
  {comp: BlackTx.BuckingChute, m: 1.9, w: 4, label: 'bucking chute', p: {night: true}},
  {comp: BlackTx.HBCUBand, m: 1.8, label: 'HBCU band (high knee)', p: {ranks: 3, files: 6, spread: 620}, field: {w: 1080, h: 820}},
  {comp: BlackTx.BarbecuePit, m: 1.5, w: 3, label: 'barbecue pit (block)', p: {form: 'block', lit: true, seed: 4}},
  {comp: BlackTx.Frottoir, m: 0.55, label: 'frottoir (rubboard)', p: {played: true}, person: false},
  {comp: BlackTx.ChurchFan, m: 0.36, label: 'church fan', p: {showAd: true}, person: false},
  {comp: BlackTx.RedDrink, m: 0.28, label: 'red drink (bottle)', p: {kind: 'bottle'}, person: false},
  {comp: BlackTx.FanField, m: 0.36, label: 'fan field (a crowd)', p: {count: 22, depth: 300}, field: {w: 1080, h: 560, ay: 210}},
];

export const BlackTexasSheet: React.FC = () => (
  <GridSheet cols={BLACK_COLS} region="piney_woods" title="Black Texas"
    specs={BLACK_SPECS}
    sub={
      "The correction this sheet exists for: Black Texas is coastal and rural and OLD " +
      "before it is urban. Freedom was announced in a port. Black cowboys concentrated on " +
      "the Coastal Plain between the Sabine and the Guadalupe, the rodeo association formed " +
      "in 1947 and the trail rides have run since 1958. The barbecue pit's thin BLUE smoke " +
      "means the fire is running right, and red is a meaning rather than a theme colour."} />
);

// ---------------------------------------------------------------- FOOTBALL
const FOOTBALL_COLS = 4;
const FOOTBALL_SPECS: Spec[] = [
  {comp: Ball.GrandstandBowl, m: 14, label: 'grandstand and masts', p: {crowd: 0.8, masts: 2}, field: {w: 1080, h: 1200}},
  {comp: Ball.Scoreboard, m: 6, w: 9.3, label: 'scoreboard (halide)', p: {home: 21, guest: 14, qtr: 3}, cast: 'operator'},
  {comp: Ball.Scoreboard, m: 6, w: 9.3, label: 'scoreboard (LED)', p: {led: true, home: 35, guest: 7, seed: 5}, cast: 'operator'},
  {comp: Ball.Official, m: 1.8, label: 'official (the stripes)', p: {}},
  {comp: Ball.BlockingSled, m: 1.5, w: 2.6, label: 'blocking sled', p: {pads: 2}},
  {comp: Ball.ChainGang, m: 1.75, label: 'chain gang and down box', p: {down: 2}, field: {w: 1080, h: 760}},
  {comp: Ball.DrillTeam, m: 1.7, label: 'drill team (the kick line)', p: {count: 6, spread: 900}, field: {w: 1080, h: 820}},
  {comp: Ball.WaterCooler, m: 0.92, label: 'sideline cooler', p: {cart: true}, person: false},
  {comp: Ball.LettermanJacket, m: 0.72, label: 'letter jacket', p: {}, person: false},
  {comp: Ball.ShoulderPads, m: 0.5, label: 'shoulder pads', p: {stand: true}, person: false},
  {comp: Ball.Trophy, m: 0.5, label: 'trophy (the hat)', p: {kind: 'hat'}, person: false},
  {comp: Ball.EndZonePylon, m: 0.46, label: 'end-zone pylon', p: {}, person: false},
  {comp: Ball.Helmet, m: 0.30, w: 0.34, label: 'helmet (blank shell)', p: {mask: 'cage'}, person: false},
  {comp: Ball.Football, m: 0.17, w: 0.28, label: 'the ball', p: {stripes: true}, person: false},
  {comp: Ball.FootballAnnual, m: 0.28, label: 'preseason annual', p: {}, person: false},
];

export const FootballSheet: React.FC = () => (
  <GridSheet cols={FOOTBALL_COLS} region="blackland" weather="night" bg="#171b23" dark
    title="Football" specs={FOOTBALL_SPECS}
    sub={
      "The game as equipment, drawn FORM not MARK: no swoosh on the sleeve, no bolt on the " +
      "cooler, no title on the annual, no school monogram on the jacket, every stamped " +
      "surface left blank because the mark is live and the form carries the read anyway. Two " +
      "things to check. The scoreboard era: incandescent digits are amber and bloom, LED are " +
      "white and crisp, and that is a one-frame date stamp. And the facemask stands PROUD of " +
      "the shell on a clip, it is not painted flat on the front."} />
);

// The composition height each sheet needs, computed from its own spec count and
// column count. Root.tsx reads this so a sheet and its frame never disagree, and a
// new artifact grows the frame automatically rather than clipping off the bottom.
export const SHEET_H: Record<string, number> = {
  FloraSheet: sheetHeight(FLORA_SPECS.length, FLORA_COLS),
  FloraFieldSheet: floraFieldHeight(),
  SkySheet: 1920,
  RoadsideSheet: sheetHeight(ROAD_SPECS.length, ROAD_COLS),
  HometownSheet: sheetHeight(TOWN_SPECS.length, TOWN_COLS),
  HomeplaceSheet: sheetHeight(HOME_SPECS.length, HOME_COLS),
  TejanoSheet: sheetHeight(TEJANO_SPECS.length, TEJANO_COLS),
  BlackTexasSheet: sheetHeight(BLACK_SPECS.length, BLACK_COLS),
  FootballSheet: sheetHeight(FOOTBALL_SPECS.length, FOOTBALL_COLS),
};
