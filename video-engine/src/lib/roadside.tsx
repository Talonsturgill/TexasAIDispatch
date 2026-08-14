import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK, RustStreak, Galvanized, CalicheDust} from './lighting';
import {matFill, MaterialName} from './materials';
import {fitter, rnd} from './scale';

// =============================================================================
// ROADSIDE — the Texas you see from a car window, which is the Texas people
// actually remember.
//
// WHY THIS MODULE EXISTS
//
// Everything the engine could draw before this was a SUBJECT: a pumpjack because
// the story is about oil, a data hall because the story is about compute. Nostalgia
// is not a subject. It is what the story is set IN, at the edge of frame, unremarked.
// Nobody remembers a Dairy Queen because a film was about Dairy Queen. They remember
// it because it went past the window while somebody was talking about something else.
//
// So this is the drive-by inventory, and it is meant to be used in the FAR and MID
// planes while the story happens in front of it.
//
// THE TRADEMARK RULE, WHICH IS NOT NEGOTIABLE
//
// The most recognisable objects on a Texas highway are owned by companies. The
// research that fed this module named them by name, correctly, because that is what
// research is for. This library draws the FORM and never the MARK.
//
// So: a thirty foot A-frame in orange and white stripes, because that geometry is
// the memory and the stripes exist because the founder flew planes and wanted the
// buildings visible from the air. No wordmark, no logo, no flying letter. A low box
// with a steep red mansard, because that silhouette IS the small town highway stop,
// with no letters on it. This is not timidity. A published video that reproduces a
// live trademark has a problem the drawing does not solve, and the silhouette carries
// all of the recognition anyway, which is the whole point of the research.
//
// `engine_lint.py` refuses a brand string in this module.
//
// THE OTHER RULE, FROM THE RESEARCH, AND IT IS ABOUT RESPECT
//
// "Making every frame a boarded window and a tumbleweed is a stranger telling a town
// it is already dead. If you want the loss, draw one closed thing in an otherwise
// working street." Every building here takes `closed`, and the default is FALSE. A
// scene that wants decline draws one. A scene that draws a whole dead street is doing
// ruin porn and the audience it is about will read it as contempt.
// =============================================================================

/** True heights in metres. */
export const ROAD_M: Record<string, {h: number; note: string}> = {
  aFrame: {h: 9, note: 'the tall 1960s striped A-frame roof, ridge to grade'},
  mansardBox: {h: 5.2, note: 'a highway dairy bar, grade to the top of the mansard band'},
  driveInCanopy: {h: 3.1, note: 'the underside of a drive-in stall canopy, at truck-roof clearance'},
  orderPost: {h: 1.7, note: 'a stall menu post, which stands about at a standing adult s eye'},
  danceHall: {h: 8.5, note: 'a Central Texas hall at the ridge'},
  icehouse: {h: 4.4, note: 'a cinderblock icehouse at the awning edge'},
  cottonGin: {h: 12, note: 'the gin shed roof. The cyclones stand above it.'},
  cottonModule: {h: 2.4, note: 'a tarped module, which is eight feet by eight by thirty two'},
  feedStore: {h: 6.5, note: 'a metal feed store at the ridge'},
  marker: {h: 1.15, note: 'a state historical marker, plate top above grade'},
  ranchGate: {h: 3.6, note: 'the underside of the beam, at stock-trailer clearance'},
  fencePost: {h: 1.35, note: 'a cedar corner post above grade'},
  storefront: {h: 9, note: 'a two storey downtown brick block at the cornice'},
  motelRow: {h: 3.4, note: 'a single storey motor court at the eave'},
  poleSign: {h: 11, note: 'a highway pole sign, grade to the top of the panel'},
  billboard: {h: 9, note: 'a rural monopole billboard at the top of the face'},
  memorialCross: {h: 0.8, note: 'a roadside cross, ground to the top of the upright'},
  deerBlind: {h: 4.2, note: 'a box blind on stilts, ground to the roof'},
  cityLimit: {h: 2.4, note: 'a population sign on two posts'},
  churchSmall: {h: 8, note: 'a country church at the top of the steeple'},
  gazebo: {h: 5, note: 'a courthouse square bandstand at the finial'},
};

const fit = fitter(ROAD_M);

export interface RoadProps {
  x?: number;
  y?: number;
  scale?: number;
  seed?: number;
  /** 0 new, 1 falling in. Default 0.35, the house standard: maintained but worn. */
  wear?: number;
  facing?: 1 | -1;
  /**
   * A CLOSED BUSINESS IS A CHOICE, NEVER A DEFAULT. See the header. One boarded
   * storefront in a working street reads true. A whole dead street reads as contempt
   * for the town it is about.
   */
  closed?: boolean;
  /** Lit interiors and sign faces. Set on any night scene. */
  night?: boolean;
}

const W = 1080;

/** A wall face with a material overlay, which is how every building here gets to be
 *  a substance rather than a coloured rectangle. */
const Wall: React.FC<{
  d: string; base: string; material?: MaterialName; opacity?: number;
}> = ({d, base, material, opacity = 1}) => (
  <g opacity={opacity}>
    <path d={d} fill={base} />
    {material && <path d={d} fill={matFill(material)} />}
  </g>
);

// =============================================================================
// THE STRIPED A-FRAME — the strongest statewide signal there is.
//
// A thirty foot isosceles triangle whose roof planes run nearly to the ground, so the
// roof IS the building. Orange and white bands run down the slope from ridge to eave,
// so head on you read a triangle and from the side you read a striped fan.
//
// WHY THE STRIPES ARE THAT ORANGE. The founder flew, and painted the buildings in the
// orange and white that airports use on towers and hangars, so they would be visible
// from the air. Which means the building was designed to be legible from a mile away
// and it works exactly that well from a car at night. Get the orange too pale or too
// yellow and a Texan feels it is wrong before they can say why. It is a hard red
// leaning aviation orange.
//
// Almost all the tall ones are gone, phased out as codes capped fast food height, so
// this draws a memory rather than a place you can go. `low` is the 1974 form, a wider
// shallower triangle grafted onto a dining room, which is the one most people
// actually ate in.
// =============================================================================
export const StripedAFrame: React.FC<RoadProps & {
  h?: number; bands?: number; low?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 31, wear = 0.3, facing = 1,
       closed = false, night = false, h = 200, bands = 7, low = false}) => {
  const L = useLight();
  const K = fit('aFrame', h);
  const uid = useUid('afr');
  const orange = tones('#e2531f', L);          // aviation orange, red-leaning
  const white = tones('#f0ece4', L);
  const halfW = h * (low ? 0.92 : 0.62);
  const ridge = -h;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {low && (
        /* the 1974 dining room the low A-frame is grafted onto */
        <Wall d={`M${-halfW * 1.7},0 L${-halfW * 1.7},${-h * 0.42} L${halfW * 1.6},${-h * 0.42} L${halfW * 1.6},0 Z`}
          base={white.core} material="brushedMetal" />
      )}
      <defs>
        <clipPath id={`${uid}tri`}>
          <path d={`M0,${ridge} L${halfW},0 L${-halfW},0 Z`} />
        </clipPath>
      </defs>
      {/* THE BANDS run down the SLOPE, not horizontally. A horizontally banded
          triangle is a circus tent and it is the mistake this geometry invites. */}
      <g clipPath={`url(#${uid}tri)`}>
        <rect x={-halfW} y={ridge} width={halfW * 2} height={h} fill={white.core} />
        {Array.from({length: bands}, (_, i) => {
          if (i % 2) return null;
          const f0 = i / bands, f1 = (i + 1) / bands;
          return (
            <g key={i}>
              <path fill={orange.core} d={
                `M${-halfW * f0},${ridge + h * f0} L${-halfW * f1},${ridge + h * f1}` +
                ` L${halfW * f1},${ridge + h * f1} L${halfW * f0},${ridge + h * f0} Z`} />
            </g>
          );
        })}
      </g>
      {/* the glazed gable end. At night this is the whole light source in the frame. */}
      <path fill={night ? (closed ? '#20242c' : '#f4e6c0') : '#2a3038'}
        opacity={night && !closed ? 0.94 : 0.8}
        d={`M0,${ridge * 0.56} L${halfW * 0.50},${-h * 0.06} L${-halfW * 0.50},${-h * 0.06} Z`} />
      {/* mullions, so the glass reads as a storefront rather than as a dark shape */}
      {Array.from({length: 4}, (_, i) => (
        <line key={i} x1={(i - 1.5) * halfW * 0.22} y1={-h * 0.06}
          x2={(i - 1.5) * halfW * 0.13} y2={ridge * 0.42}
          stroke={INK} strokeWidth={h * 0.006} opacity={0.7} />
      ))}
      <path d={`M0,${ridge} L${halfW},0 L${-halfW},0 Z`} fill="none" stroke={INK}
        strokeWidth={h * 0.010} />
      {wear > 0.4 && <RustStreak x={halfW * 0.72} y={-h * 0.30} w={h * 0.05} h={h * 0.28}
        opacity={wear * 0.4} />}
      {closed && (
        <rect x={-halfW * 0.52} y={-h * 0.30} width={halfW * 1.04} height={h * 0.24}
          fill="#8a7a62" opacity={0.85} />
      )}
    </g>
  );
};

// =============================================================================
// THE MANSARD BOX — the highway stop at the edge of every small town.
//
// A low rectangular box with a false mansard band running around the top at a steep
// angle, projecting two or three feet out over the walls, flat roof hidden behind it.
// In hundreds of towns this building was not a restaurant, it was the town's living
// room: men at the front tables at six in the morning, women at the back in the
// afternoon, the whole high school after the game.
//
// That is why `closed` is a heavy card. A small town losing this building is
// understood locally as losing the room where the town happened, and the sign panel
// pulled out of an empty steel frame on the pole is the single strongest image of
// decline this module has. Use it once and never as background dressing.
// =============================================================================
export const MansardBox: React.FC<RoadProps & {
  h?: number; w?: number; roof?: string;
}> = ({x = 0, y = 0, scale = 1, seed = 32, wear = 0.35, facing = 1,
       closed = false, night = false, h = 110, w = 300, roof = '#8f2f28'}) => {
  const L = useLight();
  const K = fit('mansardBox', h);
  const body = tones('#e4dccc', L);
  const mans = tones(roof, L);
  const glass = night && !closed ? '#f2e2b8' : '#3a444e';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Wall d={`M${-w / 2},0 L${-w / 2},${-h * 0.66} L${w / 2},${-h * 0.66} L${w / 2},0 Z`}
        base={body.core} />
      {/* the storefront glass bank, which is most of the front wall */}
      <rect x={-w * 0.40} y={-h * 0.58} width={w * 0.80} height={h * 0.44} fill={glass}
        opacity={closed ? 0.5 : 0.95} />
      {Array.from({length: 5}, (_, i) => (
        <rect key={i} x={-w * 0.40 + (i + 1) * w * 0.133} y={-h * 0.58}
          width={w * 0.008} height={h * 0.44} fill={body.shade} />
      ))}
      {/* THE MANSARD: steep, projecting, and it is the whole silhouette */}
      <path fill={mans.core} d={
        `M${-w / 2 - w * 0.035},${-h * 0.66} L${-w / 2 + w * 0.02},${-h}` +
        ` L${w / 2 - w * 0.02},${-h} L${w / 2 + w * 0.035},${-h * 0.66} Z`} />
      <path fill={matFill('planks')} opacity={0.5} d={
        `M${-w / 2 - w * 0.035},${-h * 0.66} L${-w / 2 + w * 0.02},${-h}` +
        ` L${w / 2 - w * 0.02},${-h} L${w / 2 + w * 0.035},${-h * 0.66} Z`} />
      <path fill="none" stroke={INK} strokeWidth={h * 0.014} d={
        `M${-w / 2 - w * 0.035},${-h * 0.66} L${-w / 2 + w * 0.02},${-h}` +
        ` L${w / 2 - w * 0.02},${-h} L${w / 2 + w * 0.035},${-h * 0.66} Z`} />
      {closed && Array.from({length: 4}, (_, i) => (
        <rect key={i} x={-w * 0.40 + i * w * 0.20} y={-h * 0.58} width={w * 0.19}
          height={h * 0.44} fill="#9a8a70" opacity={0.9} />
      ))}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.22} w={w} h={h * 0.22}
        opacity={wear * 0.5} />}
    </g>
  );
};

// =============================================================================
// THE DRIVE-IN STALLS — the last place in America where eating in your own car is
// simply what you do.
//
// Two flat canopies out from a small kitchen, one post per stall divider, each stall
// with its own backlit menu post and a red button. The specific memory is the button,
// the pause, the tinny voice, and a tray hooked on a half rolled window.
//
// THE LIGHT IS THE SHOT and almost nobody draws it. The canopy underside carries strip
// lighting, so at dusk there is one glowing rectangle per car under a very large dark
// sky, with hard shadow between the stalls. That is a genuinely unusual lighting
// situation and it is the reason to have this in the library.
// =============================================================================
export const DriveInStalls: React.FC<RoadProps & {
  stalls?: number; span?: number; h?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 33, wear = 0.3, facing = 1,
       night = true, stalls = 5, span = 340, h = 90}) => {
  const L = useLight();
  const K = fit('driveInCanopy', h);
  const steel = tones('#a8b0b6', L);
  const pitch = span / stalls;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the canopy deck: long, shallow, and the underside is the light source */}
      <rect x={-span / 2} y={-h} width={span} height={h * 0.13} fill={steel.core} />
      <rect x={-span / 2} y={-h + h * 0.13} width={span} height={h * 0.04}
        fill={night ? '#f4eddc' : steel.shade} opacity={night ? 0.95 : 1} />
      {night && (
        /* the wash coming down off the deck, which is what a car roof sits in */
        <rect x={-span / 2} y={-h * 0.83} width={span} height={h * 0.83}
          fill="#f4eddc" opacity={0.10} />
      )}
      {Array.from({length: stalls + 1}, (_, i) => (
        <rect key={i} x={-span / 2 + i * pitch - h * 0.020} y={-h * 0.87}
          width={h * 0.040} height={h * 0.87} fill={steel.shade} />
      ))}
      {/* the order posts, one per stall, standing between the columns */}
      {Array.from({length: stalls}, (_, i) => {
        const px = -span / 2 + (i + 0.5) * pitch;
        const ph = h * 0.62;
        return (
          <g key={i} transform={`translate(${px} 0)`}>
            <rect x={-h * 0.012} y={-ph} width={h * 0.024} height={ph} fill={steel.shade} />
            {/* THE BACKLIT MENU PANEL. Brightest thing in the frame at dusk. */}
            <rect x={-h * 0.10} y={-ph - h * 0.20} width={h * 0.20} height={h * 0.24}
              fill={night ? '#fff4d2' : '#e8e2d4'} stroke={INK} strokeWidth={h * 0.008} />
            {Array.from({length: 5}, (_, k) => (
              <rect key={k} x={-h * 0.082} y={-ph - h * 0.175 + k * h * 0.042}
                width={h * (0.10 + rnd(seed, i * 5 + k) * 0.055)} height={h * 0.012}
                fill="#4a3a2c" opacity={0.65} />
            ))}
            <rect x={-h * 0.10} y={-ph + h * 0.05} width={h * 0.20} height={h * 0.10}
              fill={steel.core} stroke={INK} strokeWidth={h * 0.006} />
            {/* the speaker grille and THE RED BUTTON */}
            {Array.from({length: 4}, (_, k) => (
              <line key={k} x1={-h * 0.075} y1={-ph + h * 0.068 + k * h * 0.018}
                x2={h * 0.030} y2={-ph + h * 0.068 + k * h * 0.018}
                stroke={INK} strokeWidth={h * 0.006} opacity={0.5} />
            ))}
            <circle cx={h * 0.062} cy={-ph + h * 0.10} r={h * 0.022} fill="#c9382f"
              stroke={INK} strokeWidth={h * 0.006} />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE DANCE HALL — built by German and Czech farming communities as the community's
// one building, and still doing that job.
//
// THE DEFINING FEATURE, and the reason to draw it at night: a continuous row of large
// wooden shutters along both long walls, hinged at the TOP and propped outward on
// poles, so half the wall is air. Light comes out sideways into the dark through a row
// of open flaps, which is the most beautiful night exterior available in this whole
// library.
//
// What is inside is generational compression. Couples of every age on a floor with
// cornmeal scattered on it so boots slide, a little girl standing on her granddaddy's
// boots, babies asleep on blankets at the edge. Nobody is performing nostalgia. It is
// Saturday.
//
// Fayette County alone once had 73 of these and has lost 32, so the ones left carry
// the ones gone. `polygonal` is the rarer form, twelve-sided around a single centre
// pole that dancers circle counterclockwise, built only in the Czech and German belt
// and only for about forty years.
// =============================================================================
export const DanceHall: React.FC<RoadProps & {
  h?: number; w?: number; shutters?: number; open?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 34, wear = 0.45, facing = 1,
       closed = false, night = true, h = 160, w = 420, shutters = 7, open = true}) => {
  const L = useLight();
  const K = fit('danceHall', h);
  const board = tones('#b4ac9c', L);           // unpainted wood gone silver
  const tin = tones('#8a8078', L);
  const glow = '#f0c878';                      // bare bulbs inside, warm amber

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the tall side wall, most of which is shutters */}
      <Wall d={`M${-w / 2},0 L${-w / 2},${-h * 0.66} L${w / 2},${-h * 0.66} L${w / 2},0 Z`}
        base={board.core} material="planks" />
      {night && open && (
        /* the interior, seen through the gap the propped shutters leave */
        <rect x={-w / 2} y={-h * 0.60} width={w} height={h * 0.34} fill={glow}
          opacity={closed ? 0 : 0.88} />
      )}
      {Array.from({length: shutters}, (_, i) => {
        const sw = (w * 0.92) / shutters;
        const sx = -w * 0.46 + i * sw;
        const droop = rnd(seed, i) * h * 0.03;   // nothing is symmetric
        return open && !closed ? (
          <g key={i}>
            {/* HINGED AT THE TOP, propped outward and upward. The prop pole is the
                detail that makes it read as a dance hall and not as an awning. */}
            <path fill={board.base} stroke={INK} strokeWidth={h * 0.007}
              d={`M${sx + sw * 0.04},${-h * 0.60} L${sx + sw * 0.96},${-h * 0.60}` +
                 ` L${sx + sw * 0.90},${-h * 0.80 + droop} L${sx + sw * 0.10},${-h * 0.80 + droop} Z`} />
            <line x1={sx + sw * 0.5} y1={-h * 0.72 + droop} x2={sx + sw * 0.5}
              y2={-h * 0.42} stroke={board.shade} strokeWidth={h * 0.008} />
          </g>
        ) : (
          <rect key={i} x={sx + sw * 0.04} y={-h * 0.60} width={sw * 0.92} height={h * 0.34}
            fill={board.shade} stroke={INK} strokeWidth={h * 0.006} />
        );
      })}
      {/* high pitched corrugated roof, rust brown and dull silver in patches */}
      <path fill={tin.core} d={
        `M${-w / 2 - w * 0.03},${-h * 0.66} L0,${-h} L${w / 2 + w * 0.03},${-h * 0.66} Z`} />
      <path fill={matFill('corrugated')} opacity={0.8} d={
        `M${-w / 2 - w * 0.03},${-h * 0.66} L0,${-h} L${w / 2 + w * 0.03},${-h * 0.66} Z`} />
      {wear > 0.3 && Array.from({length: 3}, (_, i) => (
        <RustStreak key={i} x={-w * 0.3 + i * w * 0.3} y={-h * 0.82} w={w * 0.08}
          h={h * 0.18} opacity={wear * 0.5} />
      ))}
      <path fill="none" stroke={INK} strokeWidth={h * 0.010} d={
        `M${-w / 2 - w * 0.03},${-h * 0.66} L0,${-h} L${w / 2 + w * 0.03},${-h * 0.66} Z`} />
      {night && open && !closed && (
        /* light spilling onto the ground outside, in bands under each open shutter */
        Array.from({length: shutters}, (_, i) => {
          const sw = (w * 0.92) / shutters;
          const sx = -w * 0.46 + i * sw;
          return (
            <path key={i} fill={glow} opacity={0.16}
              d={`M${sx + sw * 0.04},${-h * 0.26} L${sx + sw * 0.96},${-h * 0.26}` +
                 ` L${sx + sw * 1.24},${h * 0.14} L${sx - sw * 0.24},${h * 0.14} Z`} />
          );
        })
      )}
    </g>
  );
};

// =============================================================================
// THE ICEHOUSE — the neighbourhood's shared backyard, and the only public room in
// Texas where nobody is dressed for anything.
//
// It started as a literal ice depot on the rail lines, which is why the signature is
// ROLL-UP GARAGE DOORS: ice was delivered through them. Rolled fully up, so the
// interior and the exterior are one space. A deep corrugated awning on pipe posts over
// a concrete slab, picnic tables, galvanised tubs of longnecks in ice, and usually a
// hackberry growing straight through the middle of the slab.
//
// A belt from San Antonio to the coast and south toward the Valley. Not a Panhandle
// object, and putting one in Amarillo is the same class of error as limestone in the
// Piney Woods.
// =============================================================================
export const Icehouse: React.FC<RoadProps & {
  h?: number; w?: number; doors?: number; tables?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 35, wear = 0.5, facing = 1,
       closed = false, night = false, h = 100, w = 300, doors = 3, tables = 3}) => {
  const L = useLight();
  const K = fit('icehouse', h);
  const block = tones('#e0dcc8', L);            // whitewashed cinderblock gone chalky
  const trim = tones('#3f7a72', L);             // the aqua that is on half of them
  const awn = tones('#a05a34', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Wall d={`M${-w / 2},0 L${-w / 2},${-h * 0.62} L${w / 2},${-h * 0.62} L${w / 2},0 Z`}
        base={block.core} material="granite" opacity={0.9} />
      {Array.from({length: doors}, (_, i) => {
        const dw = (w * 0.80) / doors;
        const dx = -w * 0.40 + i * dw;
        return closed ? (
          /* rolled DOWN and padlocked. The one honest way to draw a dead icehouse. */
          <g key={i}>
            <rect x={dx + dw * 0.05} y={-h * 0.56} width={dw * 0.90} height={h * 0.56}
              fill={trim.shade} />
            {Array.from({length: 7}, (_, k) => (
              <line key={k} x1={dx + dw * 0.05} y1={-h * 0.50 + k * h * 0.08}
                x2={dx + dw * 0.95} y2={-h * 0.50 + k * h * 0.08}
                stroke={INK} strokeWidth={h * 0.005} opacity={0.4} />
            ))}
          </g>
        ) : (
          <g key={i}>
            {/* the opening, and the rolled-up drum sitting above it */}
            <rect x={dx + dw * 0.05} y={-h * 0.56} width={dw * 0.90} height={h * 0.56}
              fill={night ? '#f2d99a' : '#2e3238'} opacity={night ? 0.85 : 0.9} />
            <rect x={dx + dw * 0.02} y={-h * 0.62} width={dw * 0.96} height={h * 0.07}
              fill={trim.core} stroke={INK} strokeWidth={h * 0.006} />
          </g>
        );
      })}
      {/* THE AWNING on pipe posts, out over the slab. Corrugated, rust and galvanised. */}
      <rect x={-w * 0.62} y={-h * 0.66} width={w * 1.24} height={h * 0.045}
        fill={awn.core} />
      <rect x={-w * 0.62} y={-h * 0.66} width={w * 1.24} height={h * 0.045}
        fill={matFill('corrugated')} opacity={0.7} />
      {Array.from({length: 4}, (_, i) => (
        <rect key={i} x={-w * 0.58 + i * w * 0.38} y={-h * 0.62} width={h * 0.022}
          height={h * 0.62} fill={awn.shade} />
      ))}
      {/* the slab, and the tables on it */}
      <rect x={-w * 0.64} y={0} width={w * 1.28} height={h * 0.10} fill="#8a8478"
        opacity={0.7} />
      {!closed && Array.from({length: tables}, (_, i) => {
        const tx = -w * 0.44 + i * w * 0.42;
        return (
          <g key={i} transform={`translate(${tx} ${h * 0.02})`}>
            <rect x={-h * 0.16} y={-h * 0.15} width={h * 0.32} height={h * 0.025}
              fill="#9a8156" />
            <rect x={-h * 0.13} y={-h * 0.15} width={h * 0.012} height={h * 0.15}
              fill="#7a6544" />
            <rect x={h * 0.118} y={-h * 0.15} width={h * 0.012} height={h * 0.15}
              fill="#7a6544" />
            <rect x={-h * 0.20} y={-h * 0.07} width={h * 0.40} height={h * 0.018}
              fill="#8a7550" />
          </g>
        );
      })}
      {night && !closed && (
        /* one buzzing sodium fixture. WARM ORANGE, not white, on anything pre-LED. */
        <>
          <circle cx={w * 0.28} cy={-h * 0.70} r={h * 0.030} fill="#ffd9a0" />
          <ellipse cx={w * 0.28} cy={-h * 0.30} rx={w * 0.22} ry={h * 0.34}
            fill="#ffb867" opacity={0.13} />
        </>
      )}
      {wear > 0.3 && <RustStreak x={-w * 0.5} y={-h * 0.62} w={w} h={h * 0.16}
        opacity={wear * 0.35} />}
    </g>
  );
};

// =============================================================================
// THE COTTON GIN — dead eleven months and roaring for one.
//
// A long galvanised shed with a stepped roofline, and on top a cluster of CYCLONE
// SEPARATORS linked by a web of large-diameter pipe that swoops and elbows between
// them. That cluster is the whole identification, and it is what makes a gin
// unmistakable from two miles across a field.
//
// THE DETAIL THAT NOBODY DRAWS, and it is the best one: the lint. Cotton blows off
// the modules and catches in every fence line and roadside weed for miles, so the
// ditches look like it snowed at eighty degrees. `ModuleYard` carries it.
// =============================================================================
export const CottonGin: React.FC<RoadProps & {
  h?: number; w?: number; cyclones?: number; running?: boolean; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 36, wear = 0.45, facing = 1,
       closed = false, night = false, h = 150, w = 380, cyclones = 6,
       running = false, frame = 0}) => {
  const L = useLight();
  const K = fit('cottonGin', h);
  const steel = tones('#9aa0a2', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* the stepped shed: sections of different height meeting, never one rectangle */}
      {[[-0.50, 0.34, 0.62], [-0.16, 0.42, 1.0], [0.26, 0.24, 0.78]].map(([f, ww, hh], i) => (
        <g key={i}>
          <Wall d={`M${w * f},0 L${w * f},${-h * hh} L${w * (f + ww)},${-h * hh} L${w * (f + ww)},0 Z`}
            base={steel.core} material="corrugated" />
          <path d={`M${w * f},0 L${w * f},${-h * hh} L${w * (f + ww)},${-h * hh} L${w * (f + ww)},0`}
            fill="none" stroke={INK} strokeWidth={h * 0.008} />
        </g>
      ))}
      {/* THE CYCLONES: vertical cylinders with conical bottoms, linked by fat pipe */}
      {Array.from({length: cyclones}, (_, i) => {
        const cx = -w * 0.30 + i * w * 0.115;
        const ch = h * (0.24 + rnd(seed, i) * 0.10);
        return (
          <g key={i}>
            <rect x={cx - h * 0.038} y={-h - ch} width={h * 0.076} height={ch}
              fill={steel.core} />
            <rect x={cx - h * 0.038} y={-h - ch} width={h * 0.076} height={ch}
              fill={matFill('brushedMetal')} />
            <path d={`M${cx - h * 0.038},${-h} L${cx},${-h + h * 0.07} L${cx + h * 0.038},${-h} Z`}
              fill={steel.shade} />
            <ellipse cx={cx} cy={-h - ch} rx={h * 0.038} ry={h * 0.012} fill={steel.base} />
            {i > 0 && (
              <path fill="none" stroke={steel.shade} strokeWidth={h * 0.024}
                d={`M${cx - w * 0.115},${-h - ch * 0.7} q${w * 0.057},${-h * 0.10} ${w * 0.115},0`} />
            )}
          </g>
        );
      })}
      {/* the suction boom, out over the yard */}
      <path fill="none" stroke={steel.shade} strokeWidth={h * 0.030} strokeLinecap="round"
        d={`M${-w * 0.40},${-h * 0.50} q${-w * 0.14},${-h * 0.02} ${-w * 0.22},${h * 0.30}`} />
      {running && night && (
        /* very bright work lights, hard shadows, floating dust. October, all night. */
        <>
          {Array.from({length: 3}, (_, i) => (
            <g key={i}>
              <circle cx={-w * 0.30 + i * w * 0.30} cy={-h * 0.86} r={h * 0.022}
                fill="#fff6dc" />
              <path fill="#fff2cc" opacity={0.12}
                d={`M${-w * 0.30 + i * w * 0.30},${-h * 0.86} l${-w * 0.16},${h * 0.86}` +
                   ` l${w * 0.32},0 Z`} />
            </g>
          ))}
          {Array.from({length: 40}, (_, i) => {
            const p = ((frame / 30) * 0.3 + rnd(seed, 200 + i)) % 1;
            return (
              <circle key={i} cx={(rnd(seed, 300 + i) - 0.5) * w}
                cy={-p * h * 0.9} r={h * 0.004} fill="#f0e6cc"
                opacity={(1 - p) * 0.5} />
            );
          })}
        </>
      )}
      {wear > 0.3 && Array.from({length: 4}, (_, i) => (
        <RustStreak key={i} x={-w * 0.4 + i * w * 0.25} y={-h * 0.4} w={w * 0.05}
          h={h * 0.40} opacity={wear * 0.45} />
      ))}
    </g>
  );
};

/** THE MODULE YARD, which is the graphic half of a gin and can stand alone.
 *
 *  Rectangular blocks eight feet by eight by thirty two, rows of them, each under a
 *  strapped tarp in a saturated yellow that is the strongest colour in the frame.
 *  `lint` puts the cotton in the fence line, which is the detail that does enormous
 *  work for anyone from cotton country and reads as pretty abstraction to everyone
 *  else. That is the best kind of artifact this library can hold. */
export const ModuleYard: React.FC<RoadProps & {
  w?: number; depth?: number; rows?: number; lint?: boolean; tarp?: string;
}> = ({x = 0, y = 0, scale = 1, seed = 37, wear = 0.3,
       w = 900, depth = 220, rows = 4, lint = true, tarp = '#d9b528'}) => {
  const L = useLight();
  const K = fit('cottonModule', 42);
  const t = tones(tarp, L);

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: rows}, (_, r) => {
        const v = r / Math.max(1, rows - 1);
        const ry = Math.pow(v, 1.4) * depth;
        const s = K * scale * (0.45 + v * 0.85);
        const per = Math.round(3 + v * 3);
        return (
          <g key={r} transform={`translate(0 ${ry}) scale(${s})`}>
            {Array.from({length: per}, (_, i) => {
              const px = ((i / Math.max(1, per - 1)) - 0.5) * (w / s);
              const sd = seed + r * 41 + i;
              return (
                <g key={i} transform={`translate(${px} 0)`}>
                  {/* the slightly ROUNDED top from compaction. A flat box is a dumpster. */}
                  <path fill={t.core} d={
                    `M-84,0 L-84,-30 Q-84,-42 -62,-42 L62,-42 Q84,-42 84,-30 L84,0 Z`} />
                  <path fill={t.shade} opacity={0.5} d={`M40,0 L40,-40 L84,-30 L84,0 Z`} />
                  {/* the straps along the sides */}
                  {Array.from({length: 4}, (_, k) => (
                    <line key={k} x1={-60 + k * 40} y1={-1} x2={-60 + k * 40} y2={-40}
                      stroke={t.shade} strokeWidth={3} />
                  ))}
                  {wear > 0.3 && (
                    <ellipse cx={(rnd(sd, 1) - 0.5) * 100} cy={-38} rx={14} ry={5}
                      fill="#f0ece2" opacity={0.5} />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {lint && Array.from({length: 70}, (_, i) => (
        /* THE LINT IN THE FENCE LINE. Not white. A dirty warm off-white with the
           trash still in it, caught at the height a bottom wire sits. */
        <ellipse key={i} cx={(rnd(seed, 700 + i) - 0.5) * w}
          cy={depth * (0.9 + rnd(seed, 800 + i) * 0.24)}
          rx={4 + rnd(seed, 900 + i) * 7} ry={3 + rnd(seed, 950 + i) * 4}
          fill="#e8e2d2" opacity={0.55 + rnd(seed, 990 + i) * 0.4} />
      ))}
    </g>
  );
};

// =============================================================================
// THE FEED STORE — the last store in a lot of towns that sells something you NEED.
//
// A metal building with a raised loading dock at truck-bed height, a shed awning over
// it, and stacks of fifty pound sacks. The red and white checkerboard is doing a
// specific job: the pattern was a dealer scheme and it became the sign for the whole
// category, so a checkerboard on a wall reads as feed store even with no words on it.
// That is exactly the trademark-free recognition this module is built to use.
//
// In spring there are chicks under a heat lamp in a stock tank by the door, and every
// child in town has stood over them.
// =============================================================================
export const FeedStore: React.FC<RoadProps & {
  h?: number; w?: number; checker?: boolean; chicks?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 38, wear = 0.4, facing = 1,
       closed = false, h = 130, w = 300, checker = true, chicks = false}) => {
  const L = useLight();
  const K = fit('feedStore', h);
  const metal = tones('#c8bfae', L);
  const red = tones('#a8332c', L);
  const dockH = h * 0.16;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Wall d={`M${-w / 2},${-dockH} L${-w / 2},${-h * 0.70} L${w / 2},${-h * 0.70} L${w / 2},${-dockH} Z`}
        base={metal.core} material="corrugated" />
      <path fill={metal.base} d={
        `M${-w / 2 - w * 0.02},${-h * 0.70} L0,${-h} L${w / 2 + w * 0.02},${-h * 0.70} Z`} />
      <path fill={matFill('corrugated')} opacity={0.6} d={
        `M${-w / 2 - w * 0.02},${-h * 0.70} L0,${-h} L${w / 2 + w * 0.02},${-h * 0.70} Z`} />
      {/* the roll-up door, and the dock at truck-bed height with its awning */}
      <rect x={-w * 0.10} y={-h * 0.62} width={w * 0.30} height={h * 0.46}
        fill={closed ? metal.shade : '#2e3238'} />
      <rect x={-w * 0.56} y={-dockH} width={w * 1.12} height={dockH} fill="#8a8478" />
      <rect x={-w * 0.56} y={-dockH} width={w * 1.12} height={h * 0.012} fill="#6f6a60" />
      <rect x={-w * 0.58} y={-h * 0.74} width={w * 1.16} height={h * 0.030}
        fill={metal.shade} />
      {Array.from({length: 4}, (_, i) => (
        <rect key={i} x={-w * 0.54 + i * w * 0.35} y={-h * 0.71} width={h * 0.016}
          height={h * 0.55} fill={metal.shade} />
      ))}
      {checker && (
        /* THE CHECKERBOARD. Faded and chalky, and often ghosting through newer paint. */
        <g opacity={0.85}>
          {Array.from({length: 24}, (_, i) => {
            const cx = i % 6, cy = Math.floor(i / 6);
            if ((cx + cy) % 2) return null;
            return (
              <rect key={i} x={-w * 0.46 + cx * w * 0.048} y={-h * 0.66 + cy * h * 0.048}
                width={w * 0.048} height={h * 0.048} fill={red.core} />
            );
          })}
          <rect x={-w * 0.46} y={-h * 0.66} width={w * 0.288} height={h * 0.192}
            fill="none" stroke={INK} strokeWidth={h * 0.008} />
        </g>
      )}
      {!closed && Array.from({length: 8}, (_, i) => {
        /* stacked sacks on the dock, which is the repeating graphic that says feed */
        const sx = w * 0.24 + (i % 4) * w * 0.055;
        const sy = -dockH - Math.floor(i / 4) * h * 0.05 - h * 0.048;
        return (
          <g key={i}>
            <rect x={sx} y={sy} width={w * 0.050} height={h * 0.046}
              fill={i % 3 ? '#c2a878' : '#e0dccc'} stroke={INK} strokeWidth={h * 0.005} />
            <rect x={sx + w * 0.008} y={sy + h * 0.014} width={w * 0.034}
              height={h * 0.010} fill={i % 2 ? '#3f6a44' : red.core} opacity={0.8} />
          </g>
        );
      })}
      {chicks && (
        /* the stock tank of chicks under a heat lamp, by the door, in March */
        <g transform={`translate(${-w * 0.36} ${-dockH})`}>
          <ellipse cx={0} cy={-h * 0.03} rx={h * 0.075} ry={h * 0.030} fill="#b0b6b4" />
          <ellipse cx={0} cy={-h * 0.045} rx={h * 0.075} ry={h * 0.028} fill="#8a8f8c" />
          {Array.from({length: 7}, (_, i) => (
            <circle key={i} cx={(rnd(seed, 40 + i) - 0.5) * h * 0.10}
              cy={-h * 0.048 + (rnd(seed, 50 + i) - 0.5) * h * 0.02} r={h * 0.010}
              fill="#f0dc8c" />
          ))}
          <path d={`M0,${-h * 0.20} L0,${-h * 0.09}`} stroke="#4a4038" strokeWidth={h * 0.006} />
          <path d={`M${-h * 0.03},${-h * 0.09} L${h * 0.03},${-h * 0.09} L${h * 0.018},${-h * 0.06} L${-h * 0.018},${-h * 0.06} Z`}
            fill="#c02c22" />
          <ellipse cx={0} cy={-h * 0.04} rx={h * 0.09} ry={h * 0.035} fill="#ff9a5a"
            opacity={0.28} />
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.30} w={w} h={h * 0.30}
        opacity={wear * 0.45} />}
    </g>
  );
};

// =============================================================================
// THE HISTORICAL MARKER — thousands of them, everybody has slowed down for one,
// almost nobody has stopped.
//
// The childhood memory is reading as much as you could at forty miles an hour and
// getting maybe six words. What is on them is almost never a battle. It is a church,
// a school that consolidated away, a family cemetery, a man who is buried nearby.
//
// THE FABRICATION DETAIL EXPLAINS THE LOOK, and it is why a flat silver-on-black
// drawing is wrong: the plaque is painted entirely black and then the top layer is
// SHAVED OFF the raised type to expose bare aluminium underneath. So the letters are
// unpolished metal, not paint, and they flare when light rakes across them or when
// headlights hit them.
//
// THE RULE: never write plausible marker text. Somebody will go looking for it. The
// type here is drawn as illegible rules, which is also what you get at forty.
// =============================================================================
export const HistoricalMarker: React.FC<RoadProps & {
  h?: number; lines?: number; raked?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 39, wear = 0.4, facing = 1,
       h = 90, lines = 11, raked = 0.5}) => {
  const L = useLight();
  const K = fit('marker', h);
  const alu = tones('#b6b8b4', L);
  const plateH = h * 0.62, plateW = plateH * 0.64;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-h * 0.014} y={-h * 0.42} width={h * 0.028} height={h * 0.42}
        fill={alu.shade} />
      <g transform={`translate(0 ${-h * 0.40 - plateH})`}>
        {/* flat black gone chalky grey on the sun face */}
        <rect x={-plateW / 2} y={0} width={plateW} height={plateH} fill="#20242a" />
        <rect x={-plateW / 2} y={0} width={plateW} height={plateH} fill="#7a7f84"
          opacity={wear * 0.25} />
        {/* the raised border and the star, in BARE metal that catches the light */}
        <rect x={-plateW / 2 + plateW * 0.045} y={plateH * 0.03}
          width={plateW * 0.91} height={plateH * 0.94} fill="none"
          stroke={alu.base} strokeWidth={plateW * 0.022} />
        <path fill={alu.base} d={
          Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 ? plateW * 0.035 : plateW * 0.082;
            return `${i ? 'L' : 'M'}${Math.cos(a) * r},${plateH * 0.14 + Math.sin(a) * r}`;
          }).join(' ') + ' Z'} />
        {/* the title line, larger, then the body: rules, never words */}
        <rect x={-plateW * 0.32} y={plateH * 0.25} width={plateW * 0.64}
          height={plateH * 0.035} fill={alu.base} />
        {Array.from({length: lines}, (_, i) => (
          <rect key={i} x={-plateW * 0.38} y={plateH * 0.36 + i * plateH * 0.052}
            width={plateW * (0.60 + rnd(seed, i) * 0.16)} height={plateH * 0.018}
            fill={alu.core} opacity={0.72 + raked * 0.25} />
        ))}
      </g>
    </g>
  );
};

// =============================================================================
// THE RANCH GATE — a door with no walls.
//
// You can see straight through it and it still means do not drive past. The brand cut
// out of steel plate on the beam is a family's signature, and reading brands off gates
// is something rural Texans do without thinking about it.
//
// THE JOKE EVERY TEXAN UNDERSTANDS, and this component makes drawable: the size of the
// gate is INVERSELY related to how much work happens behind it. A city person's small
// country place gets massive rock pillars and a twenty foot iron arch. A working ranch
// gets two cedar king posts and a cattle guard. So `grand` is not a quality setting.
// It is a character note about whoever lives up that drive.
// =============================================================================
export const RanchGate: React.FC<RoadProps & {
  h?: number; span?: number; grand?: boolean; brandPath?: string;
}> = ({x = 0, y = 0, scale = 1, seed = 40, wear = 0.4, facing = 1, night = false,
       h = 120, span = 260, grand = false, brandPath}) => {
  const L = useLight();
  const K = fit('ranchGate', h);
  const cedar = tones('#9a8f80', L);
  const stone = tones('#d0c4a8', L);
  const steel = tones('#3a3630', L);
  const postW = grand ? h * 0.20 : h * 0.10;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {[-1, 1].map((s) => (
        <g key={s}>
          {grand ? (
            <>
              <Wall d={`M${s * span / 2 - postW / 2},0 L${s * span / 2 - postW / 2},${-h * 0.92} L${s * span / 2 + postW / 2},${-h * 0.92} L${s * span / 2 + postW / 2},0 Z`}
                base={stone.core} material="granite" />
              <rect x={s * span / 2 - postW * 0.62} y={-h * 0.98} width={postW * 1.24}
                height={h * 0.06} fill={stone.base} />
            </>
          ) : (
            /* the cedar king post: rough, thick, and NOT perfectly vertical */
            <g transform={`rotate(${(rnd(seed, s + 2) - 0.5) * 3} ${s * span / 2} 0)`}>
              <Wall d={`M${s * span / 2 - postW / 2},0 L${s * span / 2 - postW * 0.42},${-h * 0.92} L${s * span / 2 + postW * 0.42},${-h * 0.92} L${s * span / 2 + postW / 2},0 Z`}
                base={cedar.core} material="bark" />
            </g>
          )}
        </g>
      ))}
      {/* the beam, at stock-trailer clearance, with a shallow arch on a grand one */}
      <path fill={grand ? steel.core : cedar.base} d={
        grand
          ? `M${-span / 2},${-h * 0.86} Q0,${-h * 1.06} ${span / 2},${-h * 0.86}` +
            ` L${span / 2},${-h * 0.80} Q0,${-h * 1.00} ${-span / 2},${-h * 0.80} Z`
          : `M${-span / 2 - postW * 0.3},${-h * 0.92} L${span / 2 + postW * 0.3},${-h * 0.92}` +
            ` L${span / 2 + postW * 0.3},${-h * 0.82} L${-span / 2 - postW * 0.3},${-h * 0.82} Z`} />
      {/* THE BRAND, cut from plate and standing against sky. Pure silhouette. */}
      <g transform={`translate(0 ${-h * (grand ? 1.02 : 0.92)}) scale(${h * 0.0028})`}>
        <path fill={steel.core} stroke={steel.core} strokeWidth={6} strokeLinejoin="round"
          d={brandPath ?? 'M-46,0 L-46,-46 L-16,-46 M-46,-24 L-22,-24 M6,0 L6,-46 L36,-46 L36,-24 L6,-24 M20,-24 L40,0'} />
      </g>
      {/* the cattle guard at the threshold: rails polished bright on top, rust below */}
      <g>
        <rect x={-span * 0.42} y={h * 0.03} width={span * 0.84} height={h * 0.10}
          fill="#1a1c1e" />
        {Array.from({length: 8}, (_, i) => (
          <g key={i}>
            <rect x={-span * 0.42} y={h * 0.035 + i * h * 0.0118} width={span * 0.84}
              height={h * 0.0062} fill="#c6c8c4" />
            <rect x={-span * 0.42} y={h * 0.0412 + i * h * 0.0118} width={span * 0.84}
              height={h * 0.0035} fill="#8a5a34" />
          </g>
        ))}
      </g>
      {night && grand && [-1, 1].map((s) => (
        <circle key={s} cx={s * span / 2} cy={-h * 1.00} r={h * 0.018} fill="#ffe6b0" />
      ))}
    </g>
  );
};

// =============================================================================
// BOOTS ON FENCEPOSTS — and the reason nobody agrees on is the reason it works.
//
// Ask five people and you get five answers. It keeps rain out of the post so it will
// not rot. A boot turned toward the house means the rancher is home and turned away
// means he is out. Each boot is a memorial for a person or a horse. All three are
// given seriously and none of them cancel the others.
//
// So a Texan driving past a long run of them is looking at something that is either
// practical, or a message, or a graveyard, and does not know which. That ambiguity is
// more affecting than any single explanation would be, and it is why this is worth
// drawing as a receding run rather than as one boot.
//
// It happens in other western states too. It is not a Texas invention and the library
// does not claim it is.
// =============================================================================
export const BootFence: React.FC<RoadProps & {
  posts?: number; span?: number; h?: number; boots?: number; wires?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 41, wear = 0.6,
       posts = 9, span = 900, h = 70, boots = 7, wires = 4}) => {
  const L = useLight();
  const K = fit('fencePost', h);
  const cedar = tones('#a89a88', L);
  const pitch = span / Math.max(1, posts - 1);
  // sun-bleached leather across a real range, oxblood down to chalky grey-white
  const HIDE = ['#5a2e26', '#7a4a30', '#9a7450', '#b8a184', '#cfc4b2', '#8a6a48'];

  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({length: wires}, (_, k) => (
        <path key={k} fill="none" stroke="#8a5a3a" strokeWidth={1.6} opacity={0.85}
          d={Array.from({length: posts}, (_, i) => {
            const px = -span / 2 + i * pitch;
            const py = -h * K * scale * (0.86 - k * 0.17);
            return `${i ? 'Q' + (px - pitch / 2) + ',' + (py + 6) + ' ' : 'M'}${px},${py}`;
          }).join(' ')} />
      ))}
      {Array.from({length: posts}, (_, i) => {
        const px = -span / 2 + i * pitch;
        const s = K * scale;
        const lean = (rnd(seed, i) - 0.5) * 4;
        const hasBoot = i < boots;
        return (
          <g key={i} transform={`translate(${px} 0) scale(${s}) rotate(${lean})`}>
            <Wall d={`M${-h * 0.055},0 L${-h * 0.045},${-h * 0.94} L${h * 0.045},${-h * 0.94} L${h * 0.055},0 Z`}
              base={cedar.core} material="bark" />
            {hasBoot && (
              /* INVERTED over the post, so the SOLE FACES THE SKY. That is what you see
                 from the road, and a boot drawn upright on a post is the whole thing
                 backwards. The two pull straps hang loose on either side. */
              <g transform={`translate(0 ${-h * 0.94})`}>
                <path fill={HIDE[i % HIDE.length]} stroke={INK} strokeWidth={h * 0.010}
                  d={`M${-h * 0.085},${h * 0.30} L${-h * 0.070},${-h * 0.14}` +
                     ` Q${-h * 0.075},${-h * 0.26} ${-h * 0.020},${-h * 0.27}` +
                     ` L${h * 0.115},${-h * 0.27} Q${h * 0.150},${-h * 0.26} ${h * 0.145},${-h * 0.18}` +
                     ` L${h * 0.080},${-h * 0.15} L${h * 0.078},${h * 0.30} Z`} />
                {/* the sole and the angled walking heel, seen from underneath */}
                <path fill="#cbbfa8" d={
                  `M${-h * 0.020},${-h * 0.27} L${h * 0.115},${-h * 0.27}` +
                  ` Q${h * 0.150},${-h * 0.26} ${h * 0.145},${-h * 0.18} L${-h * 0.014},${-h * 0.20} Z`} />
                {[-1, 1].map((s2) => (
                  <path key={s2} fill={HIDE[(i + 2) % HIDE.length]}
                    d={`M${s2 * h * 0.075},${h * 0.06} l${s2 * h * 0.030},${h * 0.02} l0,${h * 0.13} l${-s2 * h * 0.030},${-h * 0.02} Z`} />
                ))}
                <path fill="none" stroke={INK} strokeWidth={h * 0.006} opacity={wear * 0.8}
                  d={`M${-h * 0.06},${h * 0.06} q${h * 0.06},${h * 0.02} ${h * 0.12},0`} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE GHOST SIGN — a record of two losses at once.
//
// It only exists because the building next door came down, so the sign is evidence of
// the business that advertised AND of the building that fell. Painted by crews called
// wall dogs from the late 1800s to the early 1950s, usually two or three ads stacked
// over the years, so what survives is all of them at once, partially transparent
// through each other. Legible and unreadable at the same time.
//
// THE PALETTE RULE, which is the one thing that makes or breaks it: NEVER paint a
// ghost sign at full saturation, and never darker than the brick. Whites hold best and
// read as a chalky bloom. Reds fade to a dusty rose. Blacks go soft charcoal brown.
// Blues and greens usually vanish entirely, so a legible blue ghost sign is wrong.
//
// The library draws BLOCKS, not words. Inventing a real company's ad copy for a sign
// that never existed is the same error as writing marker text.
// =============================================================================
export const GhostSign: React.FC<RoadProps & {
  w?: number; h?: number; layers?: number; fade?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 42, wear = 0.5, w = 320, h = 260,
       layers = 2, fade = 0.72}) => {
  const L = useLight();
  const brick = tones('#b0765c', L);
  // only the pigments that actually survive
  const SURVIVES = ['#e4dcc8', '#d8a898', '#b09a86'];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Wall d={`M0,0 L0,${-h} L${w},${-h} L${w},0 Z`} base={brick.core} material="granite"
        opacity={0.95} />
      {/* the mortar courses, which the sign has to sit ON rather than over */}
      {Array.from({length: 26}, (_, i) => (
        <line key={i} x1={0} y1={-h + i * h / 26} x2={w} y2={-h + i * h / 26}
          stroke="#d8cdc0" strokeWidth={1.2} opacity={0.4} />
      ))}
      {Array.from({length: layers}, (_, l) => {
        const col = SURVIVES[l % SURVIVES.length];
        const op = fade * (0.44 - l * 0.13);
        const oy = -h * (0.86 - l * 0.30);
        return (
          <g key={l} opacity={op}>
            {/* display type, as blocks. Two to six feet tall on the real wall. */}
            {Array.from({length: 5}, (_, i) => (
              <rect key={i} x={w * (0.10 + i * 0.155)} y={oy}
                width={w * (0.075 + rnd(seed, l * 9 + i) * 0.05)} height={h * 0.115}
                fill={col} />
            ))}
            {/* the smaller copy under it */}
            {Array.from({length: 3}, (_, i) => (
              <rect key={`c${i}`} x={w * 0.14} y={oy + h * (0.16 + i * 0.055)}
                width={w * (0.44 + rnd(seed, l * 5 + i) * 0.24)} height={h * 0.028}
                fill={col} opacity={0.8} />
            ))}
          </g>
        );
      })}
      {/* the brick eating the paint back: bare patches where it has flaked */}
      {Array.from({length: 24}, (_, i) => (
        <ellipse key={i} cx={rnd(seed, 300 + i) * w} cy={-rnd(seed, 400 + i) * h}
          rx={6 + rnd(seed, 500 + i) * 22} ry={5 + rnd(seed, 600 + i) * 14}
          fill={brick.core} opacity={0.28 + wear * 0.3} />
      ))}
    </g>
  );
};

// =============================================================================
// THE ROADSIDE MEMORIAL — and the rule attached to it is the important part.
//
// There is no ambiguity about what it means and nobody will look away from it. The
// practice goes back over two hundred years in the Southwest, Texas permits them under
// guidelines, so they persist and they accumulate. What a Texan feels passing one is a
// small compression of the chest and a specific recalculation of speed.
//
// THE RULES, and they are not style preferences:
//   Never background dressing behind a joke or a product.
//   Never a real name on one.
//   Never push the camera into it.
// Passing it in a driving shot at real speed, so it registers for half a second, is
// the honest treatment. `nameplate` draws a BLANK plate, deliberately.
//
// The tell for how long it has been there, and how recently somebody came, is the
// contrast between fresh flowers and the ones that have gone white. `tended` is that.
// =============================================================================
export const RoadsideMemorial: React.FC<RoadProps & {
  h?: number; tended?: number; crosses?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 43, wear = 0.6, facing = 1,
       h = 60, tended = 0.4, crosses = 1}) => {
  const L = useLight();
  const K = fit('memorialCross', h);
  const paint = tones('#ddd8ce', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: crosses}, (_, j) => {
        const ox = (j - (crosses - 1) / 2) * h * 0.42;
        const lean = (rnd(seed, j) - 0.5) * 7;
        return (
          <g key={j} transform={`translate(${ox} 0) rotate(${lean})`}>
            <rect x={-h * 0.045} y={-h} width={h * 0.09} height={h} fill={paint.core} />
            <rect x={-h * 0.26} y={-h * 0.76} width={h * 0.52} height={h * 0.09}
              fill={paint.core} />
            {/* the paint flaking to bare grey wood at the edges */}
            {Array.from({length: 5}, (_, i) => (
              <rect key={i} x={-h * 0.04 + (rnd(seed, 20 + j * 5 + i) - 0.5) * h * 0.06}
                y={-h * (0.15 + rnd(seed, 30 + j * 5 + i) * 0.7)}
                width={h * 0.03} height={h * 0.05} fill="#9a9086" opacity={wear * 0.8} />
            ))}
            {/* a BLANK nameplate. The library never writes a name here. */}
            <rect x={-h * 0.15} y={-h * 0.74} width={h * 0.30} height={h * 0.055}
              fill="#b8b2a6" opacity={0.5} />
            {Array.from({length: 6}, (_, i) => {
              // the flowers. Fresh ones are the only saturated colour in the frame;
              // old ones have gone to bone, and both on one cross is the whole story.
              const fresh = rnd(seed, 60 + j * 6 + i) < tended;
              const a = (i / 6) * Math.PI * 2;
              return (
                <g key={i} transform={`translate(${Math.cos(a) * h * 0.13} ${-h * 0.72 + Math.sin(a) * h * 0.08})`}>
                  {Array.from({length: 5}, (_, k) => {
                    const aa = (k / 5) * Math.PI * 2;
                    return (
                      <ellipse key={k} cx={Math.cos(aa) * h * 0.028}
                        cy={Math.sin(aa) * h * 0.028} rx={h * 0.024} ry={h * 0.016}
                        fill={fresh ? (i % 2 ? '#d4357a' : '#e8a828') : '#e2ddd2'} />
                    );
                  })}
                  <circle cx={0} cy={0} r={h * 0.014} fill={fresh ? '#e8d040' : '#cfc9bc'} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// THE MOTOR COURT — built for a road that got replaced.
//
// A single storey run of ten to twenty rooms, each door and window opening directly
// onto the parking lot, no interior corridor, a window air conditioner under every
// window. Out front, a pole sign carrying the name in neon over a plastic panel with
// a smaller VACANCY below.
//
// WHAT TEXANS ACTUALLY FEEL about these is not romance. It is the specific melancholy
// of a business that stayed open for a while after it should have closed. The
// interstate went in somewhere else and the traffic left, and the sign is still
// standing because taking it down costs money.
//
// DEAD NEON IS GLASS, NOT LIGHT. Broken tubes leave empty mounting studs and hanging
// wire, and an unlit tube reads as a dull grey line, not as a dim coloured one. That
// distinction is most of what makes this drawing honest.
// =============================================================================
export const MotorCourt: React.FC<RoadProps & {
  rooms?: number; w?: number; h?: number; vacancy?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 44, wear = 0.55, facing = 1,
       closed = true, night = false, rooms = 8, w = 420, h = 90, vacancy = false}) => {
  const L = useLight();
  const K = fit('motelRow', h);
  const body = tones('#d8d2c0', L);
  const door = tones('#5a9a92', L);
  const pitch = (w * 0.94) / rooms;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Wall d={`M${-w / 2},0 L${-w / 2},${-h * 0.78} L${w / 2},${-h * 0.78} L${w / 2},0 Z`}
        base={body.core} />
      <rect x={-w / 2 - w * 0.02} y={-h * 0.88} width={w * 1.04} height={h * 0.12}
        fill={body.shade} />
      {Array.from({length: rooms}, (_, i) => {
        const rx = -w * 0.47 + i * pitch;
        const lit = night && !closed && rnd(seed, i) < 0.3;
        return (
          <g key={i}>
            <rect x={rx + pitch * 0.08} y={-h * 0.66} width={pitch * 0.30} height={h * 0.66}
              fill={door.core} stroke={INK} strokeWidth={h * 0.006} />
            <rect x={rx + pitch * 0.46} y={-h * 0.62} width={pitch * 0.42} height={h * 0.34}
              fill={lit ? '#f2dda2' : '#2c3238'} />
            {/* THE WINDOW UNIT under every window: the giveaway that a place never got
                central air, and there is one for every room. */}
            <rect x={rx + pitch * 0.54} y={-h * 0.30} width={pitch * 0.26} height={h * 0.14}
              fill="#a8aca8" stroke={INK} strokeWidth={h * 0.005} />
            {Array.from({length: 3}, (_, k) => (
              <line key={k} x1={rx + pitch * 0.57} y1={-h * 0.27 + k * h * 0.035}
                x2={rx + pitch * 0.77} y2={-h * 0.27 + k * h * 0.035}
                stroke={INK} strokeWidth={h * 0.004} opacity={0.5} />
            ))}
          </g>
        );
      })}
      {wear > 0.4 && <CalicheDust x={-w / 2} y={-h * 0.24} w={w} h={h * 0.24}
        opacity={wear * 0.5} />}
    </g>
  );
};

/** THE POLE SIGN, which outlives the business under it and is the strongest single
 *  composition on this list against a dusk sky.
 *
 *  A steel pole twenty to forty feet with a panel at the top, a starburst or a stacked
 *  chevron, and a smaller VACANCY panel below. `dead` is the version that matters: the
 *  panel pulled out leaving an empty steel frame, which says the business closed and
 *  somebody came back for the plastic. */
export const PoleSign: React.FC<RoadProps & {
  h?: number; dead?: boolean; neon?: number; starburst?: boolean; panel?: string;
}> = ({x = 0, y = 0, scale = 1, seed = 45, wear = 0.5, facing = 1, night = false,
       h = 180, dead = false, neon = 0.55, starburst = true, panel = '#e8dcc0'}) => {
  const L = useLight();
  const K = fit('poleSign', h);
  const steel = tones('#8a8078', L);
  const pw = h * 0.46, ph = h * 0.30;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-h * 0.020} y={-h * 0.84} width={h * 0.040} height={h * 0.84}
        fill={steel.core} />
      <RustStreak x={-h * 0.024} y={-h * 0.30} w={h * 0.048} h={h * 0.30}
        opacity={wear * 0.7} />
      {starburst && (
        <g transform={`translate(0 ${-h * 0.86})`}>
          {Array.from({length: 12}, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r = i % 2 ? h * 0.09 : h * 0.17;
            return (
              <line key={i} x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r}
                stroke={dead ? '#8a8a86' : '#e0563c'} strokeWidth={h * 0.010}
                opacity={dead ? 0.6 : 1} />
            );
          })}
        </g>
      )}
      <g transform={`translate(0 ${-h * 0.84 - ph})`}>
        {dead ? (
          /* THE EMPTY FRAME. The panel is gone and you can see sky through it. */
          <rect x={-pw / 2} y={0} width={pw} height={ph} fill="none"
            stroke={steel.shade} strokeWidth={h * 0.020} />
        ) : (
          <>
            {/* sun-yellowed plastic with the printing ghosted */}
            <rect x={-pw / 2} y={0} width={pw} height={ph} fill={panel}
              stroke={steel.shade} strokeWidth={h * 0.014} />
            {Array.from({length: 2}, (_, i) => (
              <rect key={i} x={-pw * 0.36} y={ph * (0.22 + i * 0.34)}
                width={pw * (0.5 + rnd(seed, i) * 0.22)} height={ph * 0.16}
                fill="#8a7050" opacity={0.55 - wear * 0.2} />
            ))}
            {/* the neon script over it. Lit, it blooms. Dead, it is grey GLASS. */}
            <path fill="none" strokeLinecap="round"
              stroke={night && neon > 0.5 ? '#ff7a52' : '#a8a4a0'}
              strokeWidth={h * 0.012} opacity={night && neon > 0.5 ? 1 : 0.75}
              d={`M${-pw * 0.34},${ph * 0.52} q${pw * 0.12},${-ph * 0.34} ${pw * 0.22},0` +
                 ` q${pw * 0.10},${ph * 0.30} ${pw * 0.20},0 q${pw * 0.11},${-ph * 0.32} ${pw * 0.24},${ph * 0.06}`} />
            {night && neon > 0.5 && (
              <path fill="none" stroke="#ff7a52" strokeWidth={h * 0.036} opacity={0.22}
                strokeLinecap="round"
                d={`M${-pw * 0.34},${ph * 0.52} q${pw * 0.12},${-ph * 0.34} ${pw * 0.22},0` +
                   ` q${pw * 0.10},${ph * 0.30} ${pw * 0.20},0 q${pw * 0.11},${-ph * 0.32} ${pw * 0.24},${ph * 0.06}`} />
            )}
            {/* the mounting studs a broken tube leaves behind */}
            {neon <= 0.5 && Array.from({length: 5}, (_, i) => (
              <circle key={i} cx={-pw * 0.30 + i * pw * 0.15} cy={ph * (0.3 + rnd(seed, i) * 0.3)}
                r={h * 0.005} fill="#5a5854" />
            ))}
          </>
        )}
      </g>
      <rect x={-pw * 0.30} y={-h * 0.84} width={pw * 0.60} height={h * 0.10}
        fill={dead ? 'none' : '#2a3a52'} stroke={steel.shade} strokeWidth={h * 0.008} />
    </g>
  );
};

/** THE RURAL BILLBOARD. A monopole, a rectangle, and one line of copy, and it is the
 *  only object in this module that can carry a joke. Copy is drawn as bars, never as
 *  words, for the same reason the marker is: this library does not put text on a sign
 *  that a viewer will try to read. A scene that needs real copy passes `lines` and
 *  composites its own type over the face. */
export const Billboard: React.FC<RoadProps & {
  h?: number; face?: string; lines?: number; catwalk?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 46, wear = 0.35, facing = 1, night = false,
       h = 170, face = '#e8c020', lines = 1, catwalk = true}) => {
  const L = useLight();
  const K = fit('billboard', h);
  const steel = tones('#7a746c', L);
  const bw = h * 1.15, bh = h * 0.44;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-h * 0.030} y={-h * 0.60} width={h * 0.060} height={h * 0.60}
        fill={steel.core} />
      <g transform={`translate(0 ${-h * 0.58 - bh})`}>
        <rect x={-bw / 2} y={0} width={bw} height={bh} fill={face}
          stroke={INK} strokeWidth={h * 0.008} />
        {Array.from({length: lines}, (_, i) => (
          <rect key={i} x={-bw * 0.38} y={bh * (0.34 + i * 0.20)}
            width={bw * (0.60 + rnd(seed, i) * 0.16)} height={bh * 0.14} fill={INK}
            opacity={0.85} />
        ))}
        {catwalk && (
          <>
            <rect x={-bw / 2} y={bh} width={bw} height={h * 0.014} fill={steel.shade} />
            {night && Array.from({length: 3}, (_, i) => (
              <g key={i}>
                <circle cx={(i - 1) * bw * 0.30} cy={bh + h * 0.03} r={h * 0.012}
                  fill="#fff2cc" />
                <path fill="#fff2cc" opacity={0.14}
                  d={`M${(i - 1) * bw * 0.30},${bh + h * 0.03} l${-bw * 0.2},${-bh} l${bw * 0.4},0 Z`} />
              </g>
            ))}
          </>
        )}
      </g>
      {wear > 0.3 && <RustStreak x={-h * 0.034} y={-h * 0.34} w={h * 0.068} h={h * 0.34}
        opacity={wear * 0.6} />}
    </g>
  );
};

// =============================================================================
// THE STOREFRONT BLOCK — what faces the courthouse on all four sides.
//
// Two and three storey brick with continuous party walls, ONE shared cornice line
// running the whole block, a metal canopy over the sidewalk, and transom windows above
// the shop glass. `civics.Courthouse` draws the building in the middle. This is the
// room around it.
//
// THE ERA LAYER worth knowing: storefronts got aluminium and plexiglass slipcovers in
// the sixties and seventies that hid the transoms, and a lot got stripped back off
// after 1999 when the state courthouse programme started funding restorations. So a
// square can honestly read as either era depending on which layer you draw, and
// `slipcovered` is that choice.
// =============================================================================
export const StorefrontBlock: React.FC<RoadProps & {
  bays?: number; w?: number; h?: number; slipcovered?: boolean; canopy?: boolean;
  vacant?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 47, wear = 0.4, night = false,
       bays = 5, w = 640, h = 190, slipcovered = false, canopy = true, vacant = 0}) => {
  const L = useLight();
  const K = fit('storefront', h);
  const BRICK = ['#a8664c', '#96604a', '#b07050', '#8f5a46', '#a26a52'];
  const pitch = w / bays;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale} ${K * scale})`}>
      {Array.from({length: bays}, (_, i) => {
        const bx = -w / 2 + i * pitch;
        const tall = rnd(seed, i) > 0.62;
        const bh = tall ? h : h * 0.78;
        const brick = tones(BRICK[i % BRICK.length], L);
        const isVacant = i < vacant;
        return (
          <g key={i}>
            <Wall d={`M${bx},0 L${bx},${-bh} L${bx + pitch},${-bh} L${bx + pitch},0 Z`}
              base={brick.core} material="granite" opacity={0.94} />
            {/* the parapet, often stepped or corbelled, sometimes with a date stone */}
            <rect x={bx - pitch * 0.02} y={-bh - h * 0.045} width={pitch * 1.04}
              height={h * 0.050} fill={brick.base} />
            {rnd(seed, 40 + i) > 0.6 && (
              <rect x={bx + pitch * 0.42} y={-bh - h * 0.035} width={pitch * 0.16}
                height={h * 0.030} fill="#d8cdb8" />
            )}
            {/* upper windows: tall, narrow, segmental-arched, and often bricked in */}
            {Array.from({length: 3}, (_, k) => {
              const wx = bx + pitch * (0.18 + k * 0.26);
              const bricked = rnd(seed, 60 + i * 3 + k) > 0.78;
              return (
                <g key={k}>
                  <path fill={bricked ? brick.shade : (night ? '#232a32' : '#38424c')}
                    d={`M${wx},${-bh * 0.42} L${wx},${-bh * 0.78}` +
                       ` Q${wx + pitch * 0.075},${-bh * 0.86} ${wx + pitch * 0.15},${-bh * 0.78}` +
                       ` L${wx + pitch * 0.15},${-bh * 0.42} Z`} />
                  {!bricked && (
                    <line x1={wx} y1={-bh * 0.60} x2={wx + pitch * 0.15} y2={-bh * 0.60}
                      stroke={brick.base} strokeWidth={h * 0.008} />
                  )}
                </g>
              );
            })}
            {/* the shop level */}
            {slipcovered ? (
              /* the sixties slipcover: a blank metal panel that hides everything above
                 the glass, including the transoms it was screwed over */
              <rect x={bx} y={-bh * 0.40} width={pitch} height={bh * 0.16}
                fill="#b8bcb8" stroke={INK} strokeWidth={h * 0.006} />
            ) : (
              Array.from({length: 4}, (_, k) => (
                <rect key={k} x={bx + pitch * (0.08 + k * 0.22)} y={-bh * 0.36}
                  width={pitch * 0.17} height={bh * 0.09}
                  fill={night ? '#2a3038' : '#7a8894'} opacity={0.9} />
              ))
            )}
            <rect x={bx + pitch * 0.06} y={-bh * 0.26} width={pitch * 0.88} height={bh * 0.26}
              fill={isVacant ? '#8a8070' : (night ? '#f2dfa8' : '#3a444e')}
              opacity={isVacant ? 0.9 : 0.94} />
            {isVacant && Array.from({length: 3}, (_, k) => (
              <line key={k} x1={bx + pitch * 0.06} y1={-bh * (0.20 - k * 0.06)}
                x2={bx + pitch * 0.94} y2={-bh * (0.22 - k * 0.06)}
                stroke="#6f6558" strokeWidth={h * 0.010} />
            ))}
          </g>
        );
      })}
      {canopy && (
        /* ONE canopy line the whole block, because the cornice line is continuous and
           that continuity is what makes a square a room rather than a row of buildings */
        <>
          <rect x={-w / 2 - w * 0.01} y={-h * 0.30} width={w * 1.02} height={h * 0.022}
            fill="#5a5248" />
          {Array.from({length: bays + 1}, (_, i) => (
            <line key={i} x1={-w / 2 + i * pitch} y1={-h * 0.30}
              x2={-w / 2 + i * pitch} y2={-h * 0.42} stroke="#5a5248"
              strokeWidth={h * 0.008} />
          ))}
        </>
      )}
    </g>
  );
};

// =============================================================================
// THE BOX BLIND — on stilts at the edge of a senderos, and there are more of these in
// Texas than there are of almost anything else on this list.
//
// A plywood or fibreglass box on four legs with a ladder up the back and a horizontal
// slot window on each side. It is where a very large number of Texans spent cold
// mornings as children, mostly not shooting anything, mostly being quiet next to their
// father for four hours, which is the actual memory.
//
// It sits over a feeder, so the pair is what reads. Drawn alone it is a shed on legs.
// =============================================================================
export const DeerBlind: React.FC<RoadProps & {
  h?: number; feeder?: boolean; camo?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 48, wear = 0.45, facing = 1,
       h = 120, feeder = true, camo = false}) => {
  const L = useLight();
  const K = fit('deerBlind', h);
  const ply = tones(camo ? '#5f6a4a' : '#a89272', L);
  const leg = tones('#6a6258', L);
  const bw = h * 0.52, bh = h * 0.40;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {[-1, 1].map((s) => [0, 1].map((d) => (
        <line key={`${s}${d}`} x1={s * bw * (0.32 + d * 0.12)} y1={0}
          x2={s * bw * 0.44} y2={-h * 0.60} stroke={leg.core}
          strokeWidth={h * 0.022} />
      )))}
      {/* cross bracing, which is the difference between a blind and a table */}
      {[-1, 1].map((s) => (
        <line key={s} x1={s * bw * 0.36} y1={-h * 0.10} x2={s * bw * 0.44} y2={-h * 0.44}
          stroke={leg.shade} strokeWidth={h * 0.012} />
      ))}
      <line x1={-bw * 0.40} y1={-h * 0.30} x2={bw * 0.40} y2={-h * 0.30}
        stroke={leg.shade} strokeWidth={h * 0.012} />
      <Wall d={`M${-bw / 2},${-h * 0.60} L${-bw / 2},${-h * 0.60 - bh} L${bw / 2},${-h * 0.60 - bh} L${bw / 2},${-h * 0.60} Z`}
        base={ply.core} material="planks" />
      {/* the SLOT window. Horizontal, narrow, and on every side. */}
      <rect x={-bw * 0.40} y={-h * 0.60 - bh * 0.66} width={bw * 0.80} height={bh * 0.22}
        fill="#1c2026" />
      <path fill={ply.base} d={
        `M${-bw * 0.56},${-h * 0.60 - bh} L0,${-h * 0.60 - bh - h * 0.07}` +
        ` L${bw * 0.56},${-h * 0.60 - bh} Z`} />
      {/* the ladder, always a bit too steep and always missing a rung */}
      {Array.from({length: 7}, (_, i) => (
        rnd(seed, i) > 0.12 ? (
          <line key={i} x1={bw * 0.46} y1={-h * 0.06 - i * h * 0.078}
            x2={bw * 0.66} y2={-h * 0.06 - i * h * 0.078} stroke={leg.core}
            strokeWidth={h * 0.010} />
        ) : null
      ))}
      <line x1={bw * 0.46} y1={0} x2={bw * 0.48} y2={-h * 0.60} stroke={leg.core}
        strokeWidth={h * 0.010} />
      <line x1={bw * 0.66} y1={0} x2={bw * 0.64} y2={-h * 0.60} stroke={leg.core}
        strokeWidth={h * 0.010} />
      {feeder && (
        /* the spin feeder on a tripod, forty yards out. The pair is what reads. */
        <g transform={`translate(${-bw * 1.5} 0) scale(0.72)`}>
          {[-1, 0, 1].map((s) => (
            <line key={s} x1={s * h * 0.10} y1={0} x2={s * h * 0.03} y2={-h * 0.40}
              stroke={leg.shade} strokeWidth={h * 0.012} />
          ))}
          <path fill="#8a8f8c" d={
            `M${-h * 0.11},${-h * 0.40} L${-h * 0.075},${-h * 0.58} L${h * 0.075},${-h * 0.58}` +
            ` L${h * 0.11},${-h * 0.40} Z`} />
          <ellipse cx={0} cy={-h * 0.58} rx={h * 0.078} ry={h * 0.020} fill="#a0a5a2" />
          <ellipse cx={0} cy={-h * 0.39} rx={h * 0.05} ry={h * 0.014} fill="#5a5f5c" />
        </g>
      )}
    </g>
  );
};

// =============================================================================
// THE TWO LANE — the surface everything above is seen FROM.
//
// A bar ditch on each side, a white fog line, a broken or solid yellow centre, and
// caliche or gravel on the shoulder. The one thing that dates it and locates it at
// once is the shoulder: an FM road has a narrow shoulder and a deep ditch, a US
// highway has a wide one.
//
// `caliche` is the unpaved version, and the note that matters is that caliche is
// BRIGHT. It glares white in sun, and a dirt road drawn brown is an East Texas road,
// which is a different place.
// =============================================================================
export const TwoLane: React.FC<RoadProps & {
  w?: number; horizonY?: number; caliche?: boolean; dashes?: number; shoulder?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 49, wear = 0.4,
       w = 1400, horizonY = -260, caliche = false, dashes = 9, shoulder = 0.16}) => {
  const L = useLight();
  const uid = useUid('rd');
  const top = tones(caliche ? '#d4c8a8' : '#3f4348', L);
  const sh = tones('#c8b088', L);
  const vanish = w * 0.02;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id={`${uid}rd`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={top.core} />
          <stop offset="100%" stopColor={top.base} />
        </linearGradient>
      </defs>
      {/* the shoulder, wider at the bottom because everything converges */}
      <path fill={sh.core} d={
        `M${-w / 2 - w * shoulder},0 L${-vanish * (1 + shoulder * 2)},${horizonY}` +
        ` L${vanish * (1 + shoulder * 2)},${horizonY} L${w / 2 + w * shoulder},0 Z`} />
      <path fill={`url(#${uid}rd)`} d={
        `M${-w / 2},0 L${-vanish},${horizonY} L${vanish},${horizonY} L${w / 2},0 Z`} />
      {!caliche && (
        <>
          {/* THE FOG LINE, both sides, which is what makes it a highway rather than a
              driveway, and it is what a night driving shot is actually following */}
          {[-1, 1].map((s) => (
            <path key={s} fill="#e8e4d8" opacity={0.85} d={
              `M${s * w * 0.47},0 L${s * vanish * 0.94},${horizonY}` +
              ` L${s * vanish * 0.88},${horizonY} L${s * w * 0.44},0 Z`} />
          ))}
          {Array.from({length: dashes}, (_, i) => {
            // dashes get SHORTER and CLOSER toward the horizon, which is the whole cue
            const f0 = Math.pow(i / dashes, 1.9), f1 = Math.pow((i + 0.45) / dashes, 1.9);
            const yy0 = horizonY * f0, yy1 = horizonY * f1;
            const hw0 = (w * 0.010) * (1 - f0), hw1 = (w * 0.010) * (1 - f1);
            return (
              <path key={i} fill="#e0c848" opacity={0.9} d={
                `M${-hw0},${yy0} L${-hw1},${yy1} L${hw1},${yy1} L${hw0},${yy0} Z`} />
            );
          })}
        </>
      )}
      {caliche && Array.from({length: 40}, (_, i) => {
        const f = Math.pow(rnd(seed, i), 1.6);
        return (
          <ellipse key={i} cx={(rnd(seed, 100 + i) - 0.5) * w * (1 - f * 0.96)}
            cy={horizonY * f} rx={(3 + rnd(seed, 200 + i) * 6) * (1 - f * 0.9)}
            ry={(1.6 + rnd(seed, 300 + i) * 2) * (1 - f * 0.9)}
            fill={INK} opacity={0.10} />
        );
      })}
      {/* the bar ditch: a darker band outside the shoulder, deeper than people draw it */}
      {[-1, 1].map((s) => (
        <path key={s} fill="#8a8a5e" opacity={0.55} d={
          `M${s * (w / 2 + w * shoulder)},0 L${s * vanish * (1 + shoulder * 2)},${horizonY}` +
          ` L${s * vanish * (1 + shoulder * 3.4)},${horizonY} L${s * (w / 2 + w * shoulder * 2.4)},0 Z`} />
      ))}
    </g>
  );
};

/** THE CITY LIMIT SIGN, with a population on it, which is a number every small town
 *  knows and argues about. Drawn as a blank plate on two posts, because the library
 *  does not write a number a viewer will try to check, and because a population the
 *  routine computes from real data can be composited over it. */
export const CityLimitSign: React.FC<RoadProps & {h?: number; lines?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 50, wear = 0.45, facing = 1, h = 70, lines = 3,
}) => {
  const L = useLight();
  const K = fit('cityLimit', h);
  const green = tones('#2c5a3c', L);
  const post = tones('#8a857c', L);
  const sw = h * 0.92, sh = h * 0.44;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {[-1, 1].map((s) => (
        <rect key={s} x={s * sw * 0.30 - h * 0.014} y={-h * 0.60} width={h * 0.028}
          height={h * 0.60} fill={post.core} />
      ))}
      <rect x={-sw / 2} y={-h * 0.60 - sh} width={sw} height={sh} fill={green.core}
        stroke="#e8e4d8" strokeWidth={h * 0.014} rx={h * 0.02} />
      {Array.from({length: lines}, (_, i) => (
        <rect key={i} x={-sw * (0.16 + rnd(seed, i) * 0.16)}
          y={-h * 0.60 - sh + sh * (0.16 + i * 0.26)}
          width={sw * (0.32 + rnd(seed, i) * 0.32)} height={sh * 0.14}
          fill="#e8e4d8" opacity={0.9} />
      ))}
      {wear > 0.4 && Array.from({length: 3}, (_, i) => (
        <circle key={i} cx={(rnd(seed, 20 + i) - 0.5) * sw * 0.8}
          cy={-h * 0.60 - sh * (0.2 + rnd(seed, 30 + i) * 0.6)} r={h * 0.014}
          fill="#1c1c1a" opacity={0.7} />
      ))}
    </g>
  );
};

/** THE COUNTRY CHURCH — white clapboard, a steeple, a gravel lot, and a cemetery
 *  behind it, at a crossroads with nothing else. Or the metal building version, which
 *  is what most congregations actually built after 1970 and which nobody draws because
 *  it is not picturesque. Both are true and `metal` picks. */
export const CountryChurch: React.FC<RoadProps & {
  h?: number; w?: number; metal?: boolean; graves?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 51, wear = 0.35, facing = 1, night = false,
       h = 150, w = 190, metal = false, graves = 0}) => {
  const L = useLight();
  const K = fit('churchSmall', h);
  const body = tones(metal ? '#c4c8c0' : '#eae6da', L);
  const roof = tones(metal ? '#8a4a3a' : '#5a5f66', L);
  const bodyH = h * (metal ? 0.44 : 0.50);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <Wall d={`M${-w / 2},0 L${-w / 2},${-bodyH} L${w / 2},${-bodyH} L${w / 2},0 Z`}
        base={body.core} material={metal ? 'corrugated' : 'planks'} />
      <path fill={roof.core} d={
        `M${-w / 2 - w * 0.05},${-bodyH} L0,${-bodyH - h * 0.22} L${w / 2 + w * 0.05},${-bodyH} Z`} />
      {/* the tall narrow windows, pointed on a clapboard one and square on a metal one */}
      {Array.from({length: 3}, (_, i) => {
        const wx = -w * 0.30 + i * w * 0.30;
        return metal ? (
          <rect key={i} x={wx - w * 0.045} y={-bodyH * 0.76} width={w * 0.09}
            height={bodyH * 0.40} fill={night ? '#f2dda2' : '#39424c'} />
        ) : (
          <path key={i} fill={night ? '#f2dda2' : '#39424c'}
            d={`M${wx - w * 0.045},${-bodyH * 0.30} L${wx - w * 0.045},${-bodyH * 0.66}` +
               ` Q${wx},${-bodyH * 0.86} ${wx + w * 0.045},${-bodyH * 0.66}` +
               ` L${wx + w * 0.045},${-bodyH * 0.30} Z`} />
        );
      })}
      {!metal && (
        <g>
          {/* the steeple: a square base, a short spire, and it is always slightly too
              small for the building, which is the thing that makes it a country church */}
          <rect x={-w * 0.075} y={-bodyH - h * 0.34} width={w * 0.15} height={h * 0.16}
            fill={body.base} />
          <path fill={roof.base} d={
            `M${-w * 0.095},${-bodyH - h * 0.32} L0,${-h} L${w * 0.095},${-bodyH - h * 0.32} Z`} />
          <line x1={0} y1={-h} x2={0} y2={-h - h * 0.06} stroke={INK}
            strokeWidth={h * 0.010} />
          <line x1={-h * 0.022} y1={-h - h * 0.042} x2={h * 0.022} y2={-h - h * 0.042}
            stroke={INK} strokeWidth={h * 0.010} />
        </g>
      )}
      {graves > 0 && Array.from({length: graves}, (_, i) => (
        <g key={i} transform={`translate(${w * 0.62 + (i % 4) * w * 0.10} ${-Math.floor(i / 4) * h * 0.05})`}>
          <path fill="#c4bfb2" d={
            `M${-w * 0.020},0 L${-w * 0.020},${-h * 0.045}` +
            ` Q0,${-h * 0.062} ${w * 0.020},${-h * 0.045} L${w * 0.020},0 Z`} />
        </g>
      ))}
    </g>
  );
};

/** THE SQUARE'S BANDSTAND. Octagonal, on a low deck, with a shingled cap and a finial,
 *  and it is where the Christmas lights get plugged in. Every third courthouse lawn
 *  has one and nobody has ever seen a band in it. */
export const Bandstand: React.FC<RoadProps & {h?: number; sides?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 52, wear = 0.3, h = 100, sides = 8, night = false,
}) => {
  const L = useLight();
  const K = fit('gazebo', h);
  const paint = tones('#e6e0d0', L);
  const roof = tones('#6a5a4a', L);
  const r = h * 0.46;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <ellipse cx={0} cy={0} rx={r * 1.12} ry={r * 0.30} fill="#b8ae9c" />
      <ellipse cx={0} cy={-h * 0.06} rx={r * 1.08} ry={r * 0.28} fill={paint.shade} />
      {Array.from({length: sides}, (_, i) => {
        const a = (i / sides) * Math.PI * 2;
        const px = Math.cos(a) * r;
        const front = Math.sin(a) > -0.2;
        return front ? (
          <rect key={i} x={px - h * 0.016} y={-h * 0.62} width={h * 0.032}
            height={h * 0.56} fill={paint.core} />
        ) : null;
      })}
      {/* the rail, which is the part kids sit on */}
      <ellipse cx={0} cy={-h * 0.30} rx={r} ry={r * 0.26} fill="none"
        stroke={paint.base} strokeWidth={h * 0.020} />
      <path fill={roof.core} d={
        `M${-r * 1.18},${-h * 0.62} Q0,${-h * 1.02} ${r * 1.18},${-h * 0.62}` +
        ` Q0,${-h * 0.50} ${-r * 1.18},${-h * 0.62} Z`} />
      <path fill={matFill('planks')} opacity={0.5} d={
        `M${-r * 1.18},${-h * 0.62} Q0,${-h * 1.02} ${r * 1.18},${-h * 0.62}` +
        ` Q0,${-h * 0.50} ${-r * 1.18},${-h * 0.62} Z`} />
      <line x1={0} y1={-h * 0.90} x2={0} y2={-h} stroke={roof.shade}
        strokeWidth={h * 0.020} />
      <circle cx={0} cy={-h} r={h * 0.028} fill={roof.base} />
      {night && Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI;
        return (
          <circle key={i} cx={-r * 1.14 * Math.cos(a)} cy={-h * 0.62 - Math.sin(a) * h * 0.30}
            r={h * 0.012} fill="#ffe0a0" />
        );
      })}
    </g>
  );
};
