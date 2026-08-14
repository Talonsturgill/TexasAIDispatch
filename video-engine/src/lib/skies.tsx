import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK} from './lighting';
import {rnd} from './scale';

// =============================================================================
// SKIES — the Texas sky states, as a module, because in most of this state the
// sky IS the landscape.
//
// WHY THIS COMES OUT OF `biomes`
//
// `biomes.tsx` drew the sky as a two-stop linear gradient. That is correct for a
// clear day and it is the whole sky the engine could draw, which meant every
// Dispatch happened on the same afternoon. On the Llano Estacado the horizon sits
// in the bottom eighth of the frame, so a two-stop gradient is seven eighths of
// the picture, and the research is blunt about what that costs: a Panhandle
// audience reads weather as an object arriving an hour before it gets to them, and
// can see a whole storm from base to anvil in one look. That is not decoration.
// It is the thing they are looking at.
//
// THE SKY IS THE CLOCK AND THE CALENDAR. A blue norther edge on the north horizon
// is November. A towering thunderhead is a summer afternoon. Sea fog is February on
// the coast. A scene that needs to say when it is can say it here rather than in
// narration.
//
// EACH STATE COUPLES TO THE LIGHT. A sky is not a backdrop pasted behind a lit
// scene, it is the source of the light in it, so every state below publishes the
// ground tint and shadow behaviour it implies and `SKY_LIGHT` carries them. A
// shelf cloud over a sunlit foreground is the whole drama of that image and it only
// works if the foreground is genuinely still lit.
//
// WHAT THIS MODULE REFUSES TO DRAW
//
// A clean purple gradient over red rock. That is Arizona. Texas humidity gives
// soft, hazy, LAYERED evening light with enormous piled cumulus, East Texas
// sunsets happen behind pines, and coastal ones happen through haze. The research
// named that as one of the outsider tells, so the sunset state here is built from
// bands and cloud undersides rather than from a gradient.
// =============================================================================

export type SkyName =
  | 'clearSummer' | 'winterClear' | 'thunderhead' | 'supercell' | 'shelfCloud'
  | 'blueNorther' | 'sunsetBands' | 'dustHaze' | 'gulfOvercast' | 'seaFog'
  | 'greenHail' | 'smoke' | 'starfield' | 'monsoonCells';

export interface SkyState {
  /** zenith, mid, horizon. Three stops, never two, because a Texas sky bands. */
  band: [string, string, string];
  /** what this sky does to the ground under it, as a multiplier and a tint */
  groundTint: string;
  groundTintAmount: number;
  /** 0 no cast shadows at all (overcast, fog), 1 hard-edged (winter clear) */
  shadowHardness: number;
  note: string;
}

/**
 * THE LIGHT EACH SKY IMPLIES. A scene mounts a sky and reads these to grade what
 * is under it, so the two cannot disagree.
 *
 * The values that matter most are the two extremes, because they are the ones a
 * renderer gets wrong by defaulting. Gulf overcast has `shadowHardness` 0, which
 * means NO cast shadows anywhere, only contact shadows, and that is most of what
 * makes a Houston February read as a Houston February. Winter clear is 1.0 with
 * strongly blue shadows, and it is the highest contrast daylight in the state.
 */
export const SKY_LIGHT: Record<SkyName, SkyState> = {
  clearSummer: {
    band: ['#4A7FB5', '#7FA6C8', '#C6D8E4'], groundTint: '#fff4d8', groundTintAmount: 0.10,
    shadowHardness: 0.85,
    note: 'hard flat mid blue paling almost to white at the horizon. High glare.',
  },
  winterClear: {
    band: ['#1C5296', '#3C74B4', '#86AEDA'], groundTint: '#e8f0ff', groundTintAmount: 0.06,
    shadowHardness: 1,
    note: 'the scrubbed blue after a norther. Holds saturation far down toward the horizon.',
  },
  thunderhead: {
    band: ['#3E6FA8', '#7C93AE', '#B4B8B4'], groundTint: '#dfe4e0', groundTintAmount: 0.18,
    shadowHardness: 0.6,
    note: 'a summer afternoon with a tower in it. Sun still out beside the storm.',
  },
  supercell: {
    band: ['#2E4457', '#4A5A66', '#C79B6E'], groundTint: '#c8bba8', groundTintAmount: 0.30,
    shadowHardness: 0.35,
    note: 'the base is dark and the horizon under it is BRIGHT. That inversion is the image.',
  },
  shelfCloud: {
    band: ['#2A3138', '#4C5560', '#9FB6C4'], groundTint: '#e6dcc4', groundTintAmount: 0.15,
    shadowHardness: 0.75,
    note: 'clear sunlit air AHEAD of it. The fifteen seconds before it arrives are quiet.',
  },
  blueNorther: {
    band: ['#5C8AB8', '#8CAAC4', '#2E3742'], groundTint: '#c4ccd4', groundTintAmount: 0.20,
    shadowHardness: 0.55,
    note: 'the odd one. The DARKEST band is at the horizon, because the line is low and north.',
  },
  sunsetBands: {
    band: ['#2C4A7C', '#9A7FB0', '#E85F2A'], groundTint: '#ffb070', groundTintAmount: 0.34,
    shadowHardness: 0.4,
    note: 'orange, then hot pink, then lavender, then blue. Bands, never a gradient.',
  },
  dustHaze: {
    band: ['#7C93AA', '#A8A88E', '#C8A87A'], groundTint: '#e0c090', groundTintAmount: 0.30,
    shadowHardness: 0.25,
    note: 'blue is gone near the horizon. The sun is a flat disc you can look at.',
  },
  gulfOvercast: {
    band: ['#B4B7B4', '#BEC0BC', '#C8C6C0'], groundTint: '#d8dad6', groundTintAmount: 0.22,
    shadowHardness: 0,
    note: 'NO cast shadows. The most common sky in half of Texas and almost never drawn.',
  },
  seaFog: {
    band: ['#D6D4CE', '#D8D6D0', '#DEDCD6'], groundTint: '#dcdad4', groundTintAmount: 0.45,
    shadowHardness: 0,
    note: 'subtraction is the technique. Depth cutoff does the whole drawing.',
  },
  greenHail: {
    band: ['#4A5A50', '#6E7C68', '#C8A03C'], groundTint: '#a8b494', groundTintAmount: 0.34,
    shadowHardness: 0.2,
    note: 'green light on tan grass reads as WRONG, which is the point. Not a tornado cue.',
  },
  smoke: {
    band: ['#8A5A34', '#B5622C', '#D4441E'], groundTint: '#e07a3c', groundTintAmount: 0.42,
    shadowHardness: 0.15,
    note: 'the sun is a small red disc you can look at. Sepia over everything.',
  },
  starfield: {
    band: ['#0A1424', '#0E1B2E', '#16243A'], groundTint: '#5a7a9a', groundTintAmount: 0.30,
    shadowHardness: 0.1,
    note: 'not black. Deep blue with a warm grain, lifting slightly toward the horizon.',
  },
  monsoonCells: {
    band: ['#2A64A8', '#6E8CB0', '#C0C4BC'], groundTint: '#f0dcb0', groundTintAmount: 0.16,
    shadowHardness: 0.7,
    note: 'several separate storms at once, sunlit desert directly beside each one.',
  },
};

export const SKY_NAMES = Object.keys(SKY_LIGHT) as SkyName[];

const W = 1080, H = 1920;

export interface SkyProps {
  seed?: number;
  frame?: number;
  /** where the land starts. Everything above it is this module's business. */
  horizonY?: number;
  /** 0 to 1, how much of the state's character to spend. Default 1. */
  intensity?: number;
}

/** The three-stop ground every sky sits on. A two-stop sky is the tell that a
 *  renderer treated the sky as background rather than as the subject. */
const Bands: React.FC<{uid: string; s: SkyState}> = ({uid, s}) => (
  <>
    <defs>
      <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={s.band[0]} />
        <stop offset="52%" stopColor={s.band[1]} />
        <stop offset="100%" stopColor={s.band[2]} />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill={`url(#${uid}b)`} />
  </>
);

/** A cumulus lobe stack. Firm, sculpted, CAULIFLOWER edges, never a soft blob.
 *  The lit side is near white with warm cream in the bulges and it falls through
 *  pale grey to a blue-grey shade side, so a cloud has three values and not one. */
const Lobes: React.FC<{
  seed: number; cx: number; cy: number; rx: number; ry: number; n?: number;
  lit: string; mid: string; shade: string; sunFrom?: -1 | 1;
}> = ({seed, cx, cy, rx, ry, n = 11, lit, mid, shade, sunFrom = -1}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const f = i / (n - 1);
      const a = f * Math.PI * 2 + rnd(seed, i) * 0.8;
      const d = 0.30 + rnd(seed, 20 + i) * 0.72;
      const lx = cx + Math.cos(a) * rx * d;
      const ly = cy + Math.sin(a) * ry * d;
      const lr = rx * (0.20 + rnd(seed, 40 + i) * 0.22);
      const side = Math.sign(lx - cx) === sunFrom;
      return (
        <ellipse key={i} cx={lx} cy={ly} rx={lr} ry={lr * (0.78 + rnd(seed, 60 + i) * 0.34)}
          fill={ly < cy ? (side ? lit : mid) : shade} />
      );
    })}
    <ellipse cx={cx} cy={cy} rx={rx * 0.78} ry={ry * 0.72} fill={mid} />
  </g>
);

// ---------------------------------------------------------------- the states
/**
 * A TOWERING THUNDERHEAD, which is the cloud every Texan has watched build all
 * afternoon while deciding whether to go outside.
 *
 * THE ANVIL IS THE IDENTIFICATION. A flat-topped plate spreading sideways well
 * beyond the tower, fibrous and streaked, with a sharp upwind edge. Without it this
 * is a fair weather cumulus and the whole meaning is gone. An overshooting bump
 * above the anvil marks a strong updraft, which is the detail a storm chaser looks
 * for and almost nobody draws.
 *
 * On the plains it can be fifty miles away and still fill the frame, which is a
 * scale relationship that exists almost nowhere else in the country.
 */
export const Thunderhead: React.FC<SkyProps & {
  cx?: number; anvil?: boolean; mammatus?: boolean; rainShaft?: boolean;
}> = ({seed = 61, frame = 0, horizonY = 1290, intensity = 1,
       cx = 620, anvil = true, mammatus = true, rainShaft = true}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.thunderhead;
  const lit = '#F6F2E6', mid = '#C4C8CC', shade = '#8E9AA8', base = '#4A5460';
  const top = horizonY - 1090 * intensity;
  const drift = Math.sin(frame / 260) * 14;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      <g transform={`translate(${drift} 0)`}>
        {anvil && (
          <g>
            {/* the plate, spreading well past the tower, fibrous and streaked */}
            <ellipse cx={cx - 90} cy={top + 60} rx={720 * intensity} ry={78}
              fill={mid} opacity={0.92} />
            <ellipse cx={cx - 130} cy={top + 44} rx={620 * intensity} ry={52} fill={lit} />
            {Array.from({length: 16}, (_, i) => (
              <ellipse key={i} cx={cx - 700 + i * 92 + rnd(seed, i) * 40} cy={top + 66}
                rx={70} ry={9} fill={shade} opacity={0.35} />
            ))}
            {/* THE OVERSHOOTING TOP: a hard bump above the anvil, strong updraft */}
            <ellipse cx={cx + 40} cy={top - 22} rx={112} ry={62} fill={lit} />
          </g>
        )}
        {/* the tower: firm lobes, WIDER AS IT RISES, on one flat base */}
        {Array.from({length: 5}, (_, i) => {
          const f = i / 4;
          return (
            <Lobes key={i} seed={seed + i * 17} cx={cx + (rnd(seed, i) - 0.5) * 70}
              cy={top + 120 + (1 - f) * 0 + f * (horizonY - top - 300)}
              rx={(180 + f * 130) * intensity} ry={130 + f * 60} n={9}
              lit={lit} mid={mid} shade={shade} />
          );
        })}
        {/* the base is FLAT and it is at ONE LEVEL. A ragged base is a rain shower. */}
        <rect x={cx - 340 * intensity} y={horizonY - 300} width={680 * intensity}
          height={64} fill={base} />
        <ellipse cx={cx} cy={horizonY - 300} rx={340 * intensity} ry={54} fill={base} />
        {mammatus && Array.from({length: 13}, (_, i) => (
          <ellipse key={i} cx={cx - 600 + i * 96 + rnd(seed, 90 + i) * 30}
            cy={top + 96 + rnd(seed, 100 + i) * 14}
            rx={44} ry={30 + rnd(seed, 110 + i) * 16} fill={shade} opacity={0.7} />
        ))}
        {rainShaft && (
          /* soft vertical hatching, fading BEFORE it reaches ground when it is virga */
          <g opacity={0.4}>
            {Array.from({length: 26}, (_, i) => (
              <line key={i} x1={cx - 300 + i * 24} y1={horizonY - 240}
                x2={cx - 320 + i * 24} y2={horizonY - 20 - rnd(seed, 200 + i) * 100}
                stroke={base} strokeWidth={7} opacity={0.5} />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
};

/**
 * THE SUPERCELL BASE, which is unique to a small part of the world and is the
 * reason people drive across states to stand on the Llano Estacado in May.
 *
 * IT LOOKS MACHINED RATHER THAN WEATHERED. Concentric circular striations, smooth
 * plates stacked and slightly offset, curving around a central axis, so the base
 * reads as a spiral staircase or a stack of dinner plates. That regularity is what
 * makes it uncanny, and softening it into an ordinary lumpy cloud throws the whole
 * image away.
 *
 * THE COLOUR RELATIONSHIP THAT CARRIES IT: the underside is deep slate, and the
 * OUTER RIM catches low sun and goes warm gold, with bright clear sky beneath and
 * beyond the storm. Dark thing, bright edge, bright ground. Not a dark sky.
 */
export const Supercell: React.FC<SkyProps & {
  cx?: number; plates?: number; wallCloud?: boolean;
}> = ({seed = 62, frame = 0, horizonY = 1290, intensity = 1,
       cx = 560, plates = 7, wallCloud = true}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.supercell;
  const spin = (frame / 30) * 4;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* the precipitation curtain behind, with a SHARP vertical edge */}
      <rect x={cx + 280} y={0} width={W} height={horizonY} fill="#3A444E" opacity={0.75} />
      <g transform={`translate(${cx} ${horizonY - 520})`}>
        {Array.from({length: plates}, (_, i) => {
          const f = i / (plates - 1);
          const rx = (620 - f * 300) * intensity;
          const ry = (96 - f * 40);
          const off = Math.sin(spin / 40 + i * 0.7) * 26;
          // the rim catches low sun and goes GOLD. Everything else is slate.
          const rim = f > 0.6;
          return (
            <g key={i}>
              <ellipse cx={off} cy={f * 250} rx={rx} ry={ry}
                fill={`hsl(210 14% ${20 + f * 12}%)`} />
              <ellipse cx={off} cy={f * 250 - ry * 0.2} rx={rx * 0.97} ry={ry * 0.8}
                fill={rim ? '#C79B6E' : `hsl(210 12% ${26 + f * 10}%)`}
                opacity={rim ? 0.5 : 1} />
            </g>
          );
        })}
        {wallCloud && (
          <ellipse cx={Math.sin(spin / 30) * 20} cy={272} rx={190 * intensity} ry={78}
            fill="#2E3742" />
        )}
      </g>
      {/* the bright sunlit strip UNDER the storm, which is the whole composition */}
      <rect x={0} y={horizonY - 90} width={W} height={90} fill="#E8C08C" opacity={0.5} />
    </svg>
  );
};

/**
 * THE SHELF CLOUD, the most drawable single weather object in Texas and the one
 * that reads as menace without needing a tornado.
 *
 * The geometry has two halves and they must not be the same. The LEADING FACE is
 * smooth and layered, like stacked lips, and it takes light, so it can be
 * surprisingly PALE against a bright normal sky. Underneath it is ragged,
 * turbulent, lumpy and near black. The contrast between the lit front and the black
 * interior is the entire image.
 *
 * And the ground ahead of it is STILL IN SUNLIGHT. That is what sells the moment,
 * because a shelf cloud marks exactly where the wind will hit and the fifteen
 * seconds before it arrives are quiet and bright.
 */
export const ShelfCloud: React.FC<SkyProps & {
  approach?: number; scud?: boolean;
}> = ({seed = 63, frame = 0, horizonY = 1290, intensity = 1, approach = 0.5, scud = true}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.shelfCloud;
  const wedgeY = horizonY - 300 - approach * 620;
  const face = '#C4C2BA', deep = '#2A3138';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* the solid curtain of rain BEHIND it, top of frame down */}
      <rect x={0} y={0} width={W} height={wedgeY + 120} fill={deep} />
      {/* the wedge: lower at the front, rising toward the rear into the storm body */}
      <path fill={deep} d={
        `M0,${wedgeY + 240} L0,${wedgeY - 100} L${W},${wedgeY - 260} L${W},${wedgeY + 40} Z`} />
      {/* THE LEADING FACE, smooth and layered like stacked lips, and it takes light */}
      {Array.from({length: 5}, (_, i) => {
        const f = i / 4;
        return (
          <path key={i} fill={face} opacity={0.30 + f * 0.42} d={
            `M0,${wedgeY + 220 - i * 34} Q${W * 0.4},${wedgeY + 250 - i * 40} ${W},${wedgeY + 30 - i * 30}` +
            ` L${W},${wedgeY - i * 30} Q${W * 0.4},${wedgeY + 200 - i * 40} 0,${wedgeY + 170 - i * 34} Z`} />
        );
      })}
      {scud && Array.from({length: 16}, (_, i) => {
        // scud fragments hang below and RACE UPWARD into it
        const p = ((frame / 30) * 0.4 + rnd(seed, i)) % 1;
        return (
          <ellipse key={i} cx={rnd(seed, 40 + i) * W}
            cy={wedgeY + 250 - p * 90} rx={30 + rnd(seed, 60 + i) * 40} ry={12}
            fill={deep} opacity={(1 - p) * 0.6} />
        );
      })}
      {/* CLEAR SUNLIT AIR AHEAD. Without this the drawing is just a dark sky. */}
      <rect x={0} y={wedgeY + 250} width={W} height={horizonY - wedgeY - 250}
        fill="#9FB6C4" />
      <rect x={0} y={horizonY - 130} width={W} height={130} fill="#E6DCC4" opacity={0.6} />
    </svg>
  );
};

/**
 * THE BLUE NORTHER EDGE — and the reason it is drawn as its own state is that its
 * value structure is UPSIDE DOWN from every other sky in this module.
 *
 * The line is a dark blue-grey band low on the NORTH horizon, and it is DARKER
 * than the sky above it. Everywhere else in this file the sky lightens toward the
 * horizon. Here it does not, and getting that inversion right is the whole
 * identification.
 *
 * It advances without visibly changing shape, which is the uncanny part, and behind
 * it the sky washes to a hard clean blue with the dust scrubbed out. Sources
 * genuinely disagree about which blue the name refers to, the blue-black of the
 * approaching cloud or the blue that follows, so `passed` draws the second one and
 * a sequence can show both rather than the library picking a side.
 */
export const BlueNorther: React.FC<SkyProps & {
  passed?: boolean; lineY?: number; roll?: boolean;
}> = ({seed = 64, frame = 0, horizonY = 1290, intensity = 1,
       passed = false, lineY, roll = true}) => {
  const uid = useUid('sky');
  const s = passed ? SKY_LIGHT.winterClear : SKY_LIGHT.blueNorther;
  const ly = lineY ?? horizonY - 240 - intensity * 120;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {!passed && (
        <g>
          {/* the deck behind the line: low, flat, featureless */}
          <rect x={0} y={ly} width={W} height={horizonY - ly} fill="#2E3742" />
          {/* THE LINE. Straight, spanning the whole width, defined top edge, ragged
              bottom, and advancing without changing shape. */}
          <path fill="#232B34" d={
            `M0,${ly} L${W},${ly - 18} L${W},${ly + 60} ` +
            Array.from({length: 14}, (_, i) => {
              const x = W - i * (W / 13);
              return `L${x},${ly + 40 + rnd(seed, i) * 44}`;
            }).join(' ') + ` Z`} />
          {roll && (
            <ellipse cx={W * 0.5} cy={ly + 8} rx={W * 0.56} ry={20} fill="#3A444E" />
          )}
          {/* scud racing AHEAD of it, low down */}
          {Array.from({length: 9}, (_, i) => {
            const p = ((frame / 30) * 0.55 + rnd(seed, 30 + i)) % 1;
            return (
              <ellipse key={i} cx={rnd(seed, 50 + i) * W} cy={ly + 90 + p * 90}
                rx={40 + rnd(seed, 70 + i) * 50} ry={11} fill="#3A444E"
                opacity={(1 - p) * 0.55} />
            );
          })}
        </g>
      )}
      {passed && Array.from({length: 5}, (_, i) => (
        /* a few small hard-edged fair weather cumulus, flat based, well separated */
        <g key={i}>
          <Lobes seed={seed + i * 23} cx={140 + i * 220} cy={horizonY - 700 - rnd(seed, i) * 260}
            rx={92} ry={44} n={7} lit="#FFFFFF" mid="#E8ECF0" shade="#B8C4D0" />
          <rect x={140 + i * 220 - 92} y={horizonY - 700 - rnd(seed, i) * 260 + 30}
            width={184} height={8} fill="#B8C4D0" />
        </g>
      ))}
    </svg>
  );
};

/**
 * THE TEXAS SUNSET, and there is a physical reason it looks exaggerated.
 *
 * Dust and aerosols scatter the shorter blue wavelengths out of low-angle light,
 * and Texas gets both Saharan dust across the Gulf in summer and its own soil dust
 * in spring. So a faithful drawing STILL LOOKS OVERSATURATED, and that is correct.
 *
 * IT IS BANDS, NOT A GRADIENT. Orange to near vermilion at the horizon, a wide belt
 * of hot pink and coral above it, a lavender transition, then deepening blue. A
 * smooth two-stop ramp from orange to blue is the Arizona version and it is the
 * single fastest way to look like somebody who has not been here.
 *
 * The clouds do the work. High thin cirrus and altocumulus catch light FROM BELOW
 * after the sun is gone, which is what produces the extreme colour, so a clear sky
 * gives a clean gradient and no drama. `beltOfVenus` draws the pink band sitting on
 * the earth's own shadow rising in the EAST, which happens at the same moment and
 * which people rarely think to turn around and look at.
 */
export const SunsetBands: React.FC<SkyProps & {
  cirrus?: number; beltOfVenus?: boolean; phase?: number;
}> = ({seed = 65, frame = 0, horizonY = 1290, intensity = 1,
       cirrus = 9, beltOfVenus = false, phase = 0.5}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.sunsetBands;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C4A7C" />
          <stop offset="34%" stopColor="#5C5E96" />
          <stop offset="54%" stopColor="#9A7FB0" />
          <stop offset="74%" stopColor="#E8748C" />
          <stop offset="92%" stopColor="#E85F2A" />
          <stop offset="100%" stopColor="#F2913C" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}s)`} />
      {/* the cirrus: long streaked bands, lit from BELOW, going white to gold to
          magenta to deep purple as the phase advances */}
      {Array.from({length: cirrus}, (_, i) => {
        const f = i / (cirrus - 1);
        const cy = horizonY - 120 - f * 940 * intensity;
        // the lower the band, the hotter it is, because the light comes from under
        const heat = Math.max(0, 1 - f * 1.3) * phase;
        const col = heat > 0.66 ? '#FFD9A0' : heat > 0.4 ? '#F2A05C'
          : heat > 0.18 ? '#D4628C' : '#6E5A8E';
        return (
          <g key={i}>
            <ellipse cx={W * (0.2 + rnd(seed, i) * 0.6)} cy={cy}
              rx={W * (0.30 + rnd(seed, 20 + i) * 0.34)} ry={10 + rnd(seed, 40 + i) * 14}
              fill={col} opacity={0.42 + heat * 0.4} />
            <ellipse cx={W * (0.3 + rnd(seed, 60 + i) * 0.5)} cy={cy + 12}
              rx={W * 0.22} ry={6} fill={col} opacity={0.3} />
          </g>
        );
      })}
      {beltOfVenus && (
        /* the pink band on the earth's own shadow, rising in the east */
        <>
          <rect x={0} y={horizonY - 300} width={W} height={140} fill="#E8A0B4"
            opacity={0.5} />
          <rect x={0} y={horizonY - 160} width={W} height={160} fill="#5A6A8C"
            opacity={0.55} />
        </>
      )}
    </svg>
  );
};

/**
 * DUST HAZE — a dusty day, not a dust wall. There is no storm in this one, just an
 * atmosphere full of suspended soil, and it changes every colour in the frame.
 *
 * THE SKY LOSES BLUE ENTIRELY near the horizon and becomes a dirty tan to amber.
 * The sun becomes a flat disc you can look at directly, pale yellow to orange, with
 * no glare and no rays, and that is the detail that tells a viewer what they are
 * looking at. Shadows go weak and WARM rather than blue, which is the opposite of
 * every other daylight state here.
 *
 * `wall` is the haboob instead: documented near Lubbock at heights around a
 * thousand feet, a solid moving cliff with a rounded lobed leading edge, dark and
 * turbulent at the base and lighter tan at the top, with completely NORMAL daylight
 * still visible ahead of it. The seam between the two is the drawable moment.
 */
export const DustHaze: React.FC<SkyProps & {
  wall?: number; sunX?: number;
}> = ({seed = 66, frame = 0, horizonY = 1290, intensity = 1, wall = 0, sunX = 780}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.dustHaze;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* THE FLAT DISC. No glare, no rays, no bloom. That is the whole tell. */}
      <circle cx={sunX} cy={horizonY - 620} r={46} fill="#E8C070" opacity={0.9} />
      {wall > 0 && (
        <g>
          {/* the wall: lighter tan at the top, dark and turbulent at the base, with a
              ROUNDED LOBED leading edge that rolls forward */}
          <path fill="#B08A52" d={
            `M${W * (1 - wall) - 260},${horizonY} ` +
            Array.from({length: 9}, (_, i) => {
              const f = i / 8;
              const x = W * (1 - wall) - 260 + f * 300;
              const y = horizonY - 40 - Math.sin(f * Math.PI) * 40 - f * (1000 * intensity);
              return `Q${x - 40},${y + 60} ${x},${y}`;
            }).join(' ') +
            ` L${W},${horizonY - 1000 * intensity} L${W},${horizonY} Z`} />
          <path fill="#7A5A38" opacity={0.7} d={
            `M${W * (1 - wall) - 200},${horizonY} L${W},${horizonY - 340} L${W},${horizonY} Z`} />
          {Array.from({length: 22}, (_, i) => {
            const p = ((frame / 30) * 0.2 + rnd(seed, i)) % 1;
            return (
              <ellipse key={i} cx={W * (1 - wall) - 180 + rnd(seed, 30 + i) * 420}
                cy={horizonY - p * 900 * intensity}
                rx={60 + rnd(seed, 50 + i) * 90} ry={40} fill="#C8A87A"
                opacity={(1 - p) * 0.3} />
            );
          })}
        </g>
      )}
    </svg>
  );
};

/**
 * GULF OVERCAST — the most common sky in half of Texas and almost never drawn,
 * because the state's image is sunshine.
 *
 * THE DIFFICULTY IS THAT IT HAS NO SHAPES IN IT. A smooth continuous stratus deck
 * with at most a barely darker underside where it is thicker. No edges, no
 * gradient toward the horizon except a slight lightening. The value range is
 * narrow and the narrowness IS the subject, so a version with interesting clouds in
 * it is a different sky.
 *
 * `shadowHardness` is 0, which is the part a renderer has to honour: no cast
 * shadows anywhere, only contact shadows. Anyone from Houston or Beaumont knows a
 * February week of this, and it is the right sky for a serious subject because
 * shadowless light lets one foreground object carry the whole frame.
 */
export const GulfOvercast: React.FC<SkyProps & {scud?: number}> = ({
  seed = 67, frame = 0, horizonY = 1290, scud = 3,
}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.gulfOvercast;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* the barely-there mottling. Any more than this and it stops being overcast. */}
      {Array.from({length: 7}, (_, i) => (
        <ellipse key={i} cx={rnd(seed, i) * W} cy={rnd(seed, 20 + i) * horizonY}
          rx={W * 0.4} ry={140} fill="#A8ACA8" opacity={0.13} />
      ))}
      {Array.from({length: scud}, (_, i) => {
        const p = ((frame / 30) * 0.06 + rnd(seed, 40 + i)) % 1.2;
        return (
          <ellipse key={i} cx={p * (W + 400) - 200} cy={horizonY - 180 - rnd(seed, 60 + i) * 160}
            rx={130} ry={22} fill="#9EA29E" opacity={0.3} />
        );
      })}
    </svg>
  );
};

/**
 * COASTAL SEA FOG — the only Texas sky where SUBTRACTION is the technique.
 *
 * Warm moist air over cool winter water, dense enough to close a ship channel and
 * stubborn enough to last days. Unlike inland fog it does NOT burn off with the
 * sun, which is why a Galveston ferry line can sit all afternoon.
 *
 * Objects do not fade evenly, they fade BY DISTANCE IN DISCRETE STEPS, so a row of
 * pilings goes dark, grey, gone across a short span. Any light inside it blooms
 * into a soft halo.
 *
 * `ceiling` draws the version that is the better image: the fog has a defined TOP,
 * so a refinery flare or a bridge tower stands ABOVE it in clear air. That does
 * occur and it is one of the strongest frames the coast offers.
 */
export const SeaFog: React.FC<SkyProps & {
  ceiling?: number; lamps?: {x: number; y: number}[];
}> = ({seed = 68, frame = 0, horizonY = 1290, intensity = 1, ceiling = 0, lamps = []}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.seaFog;
  const top = ceiling > 0 ? horizonY - ceiling : 0;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ceiling > 0 ? '#9FB0BE' : '#D6D4CE'} />
          <stop offset="100%" stopColor="#DEDCD6" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}f)`} />
      {ceiling > 0 && (
        /* the defined top, so anything tall enough stands above it in clear air */
        <rect x={0} y={top} width={W} height={horizonY - top} fill="#DEDCD6"
          opacity={0.96} />
      )}
      {lamps.map((l, i) => (
        /* every light inside it BLOOMS into a halo, in three falloff steps */
        <g key={i}>
          <circle cx={l.x} cy={l.y} r={110 * intensity} fill="#FFEEC8" opacity={0.10} />
          <circle cx={l.x} cy={l.y} r={54 * intensity} fill="#FFEEC8" opacity={0.18} />
          <circle cx={l.x} cy={l.y} r={16} fill="#FFF6DC" opacity={0.8} />
        </g>
      ))}
      {Array.from({length: 5}, (_, i) => {
        const p = ((frame / 30) * 0.03 + rnd(seed, i)) % 1.3;
        return (
          <ellipse key={i} cx={p * (W + 600) - 300} cy={horizonY - 90 - rnd(seed, 20 + i) * 200}
            rx={280} ry={54} fill="#E8E6E0" opacity={0.4} />
        );
      })}
    </svg>
  );
};

/**
 * THE GREEN HAIL SKY, with the honest caveat attached.
 *
 * SCIENTISTS DO NOT AGREE ON THE MECHANISM. One leading explanation is that large
 * amounts of water and ice in the updraft scatter and absorb selectively, with
 * water droplets absorbing red and leaving shorter wavelengths dominant. Green does
 * NOT guarantee a tornado. It does indicate a storm capable of large hail. This
 * library draws it and does not explain it, because a routine that narrated the
 * mechanism would be asserting something the science has not settled.
 *
 * The colour is strongest in the MID TONES of the cloud, not in the darkest parts,
 * and it is usually paired with a bright yellow-orange band at the horizon where
 * the sun is getting under the storm, which sharpens the green by contrast.
 * Green light falling on tan grass reads as WRONG, which is the entire point.
 */
export const GreenHailSky: React.FC<SkyProps & {hailShaft?: boolean}> = ({
  seed = 69, frame = 0, horizonY = 1290, intensity = 1, hailShaft = true,
}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.greenHail;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* heavy low base filling most of the frame. The COLOUR is the subject. */}
      <rect x={0} y={0} width={W} height={horizonY - 160} fill="#4E5A4E" opacity={0.72} />
      {Array.from({length: 12}, (_, i) => (
        <ellipse key={i} cx={rnd(seed, i) * W} cy={rnd(seed, 20 + i) * (horizonY - 300)}
          rx={200 + rnd(seed, 40 + i) * 200} ry={90} fill="#6E7C68"
          opacity={0.22 + rnd(seed, 60 + i) * 0.25} />
      ))}
      {hailShaft && (
        /* a brighter, WHITER column inside the darker rain */
        <rect x={W * 0.44} y={horizonY - 460} width={190} height={430} fill="#C8CEC0"
          opacity={0.4 * intensity} />
      )}
      {/* the sun getting under the storm, which is what sharpens the green */}
      <rect x={0} y={horizonY - 150} width={W} height={150} fill="#D8A03C" opacity={0.6} />
    </svg>
  );
};

/**
 * WILDFIRE SMOKE. Ranch country remembers this one specifically, and it is the
 * honest sky over a black pasture with the dead mesquite still standing in it.
 *
 * Near the fire everything turns orange. Accounts of the Smokehouse Creek Fire,
 * which started on February 26th, 2024 and burned about a million acres, describe
 * the smoke blocking out the sky and tinting the whole area an eerie sepia. The sun
 * becomes a small flat red disc you can look at directly.
 *
 * THE DIFFERENCE FROM SUNSET DUST, and it is worth knowing: smoke particles are
 * LARGER, so they scatter differently. A sunrise under smoke goes deep red and
 * LOSES the pink and violet entirely. Drawing a pretty pink smoke sky is drawing
 * the wrong physics.
 */
export const SmokeSky: React.FC<SkyProps & {
  plume?: number; distance?: number;
}> = ({seed = 70, frame = 0, horizonY = 1290, intensity = 1, plume = 0.4, distance = 0.3}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.smoke;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {/* the tilted plume, rising from a LINE source and shearing off downwind */}
      <path fill="#5A4436" opacity={0.7 * intensity} d={
        `M${W * plume - 300},${horizonY} L${W * plume + 240},${horizonY}` +
        ` Q${W * plume + 520},${horizonY * 0.5} ${W},${horizonY * 0.12}` +
        ` L${W},0 L${W * plume - 520},0 Q${W * plume - 460},${horizonY * 0.5} ${W * plume - 300},${horizonY} Z`} />
      {Array.from({length: 18}, (_, i) => {
        const p = ((frame / 30) * 0.12 + rnd(seed, i)) % 1;
        return (
          <ellipse key={i} cx={W * plume + p * (W * 0.7) + rnd(seed, 30 + i) * 120}
            cy={horizonY - p * horizonY * 0.9}
            rx={90 + p * 200} ry={60 + p * 120} fill="#7A5A40"
            opacity={(1 - p) * 0.28} />
        );
      })}
      {/* the sun as a small flat BLOOD ORANGE disc, directly viewable */}
      <circle cx={W * 0.28} cy={horizonY - 700} r={38} fill="#D4441E"
        opacity={0.85 + distance * 0.1} />
    </svg>
  );
};

/**
 * BIG BEND NIGHT — measured by the National Park Service as the darkest sky in the
 * lower forty eight, and the argument for dark-sky protection needs no caption
 * because the ABSENCE of an orange light dome is the entire content of the image.
 *
 * THE SKY IS NOT BLACK. It is a very deep blue with a slight warm grain, lifting
 * toward the horizon. Painting it pure black loses the one thing a real dark sky
 * looks like.
 *
 * The Milky Way is a STRUCTURED object here, not a faint smudge: a warm cream and
 * dust-brown band with dark rifts running through it and visible asymmetry. Bright
 * stars carry real colour, blue-white, yellow and orange, and a field of identical
 * white dots is the tell.
 */
export const Starfield: React.FC<SkyProps & {
  stars?: number; milkyWay?: boolean; angle?: number; airglow?: boolean;
}> = ({seed = 71, frame = 0, horizonY = 1290, intensity = 1,
       stars = 460, milkyWay = true, angle = -24, airglow = true}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.starfield;
  const STAR = ['#ffffff', '#dce8ff', '#fff2cc', '#ffd8a8', '#ffc088'];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {milkyWay && (
        <g transform={`rotate(${angle} ${W / 2} ${horizonY * 0.5})`} opacity={intensity}>
          <ellipse cx={W / 2} cy={horizonY * 0.5} rx={W * 1.3} ry={190}
            fill="#3E4458" opacity={0.5} />
          <ellipse cx={W / 2} cy={horizonY * 0.5} rx={W * 1.1} ry={110}
            fill="#8A8878" opacity={0.42} />
          <ellipse cx={W * 0.42} cy={horizonY * 0.5} rx={W * 0.42} ry={72}
            fill="#D8CBA8" opacity={0.34} />
          {/* THE DARK RIFTS. Without them it is a smear rather than a galaxy. */}
          {Array.from({length: 7}, (_, i) => (
            <ellipse key={i} cx={W * (0.1 + rnd(seed, i) * 0.9)}
              cy={horizonY * 0.5 + (rnd(seed, 20 + i) - 0.5) * 130}
              rx={90 + rnd(seed, 40 + i) * 160} ry={20 + rnd(seed, 60 + i) * 26}
              fill="#0C1626" opacity={0.6} />
          ))}
        </g>
      )}
      {Array.from({length: stars}, (_, i) => {
        const bright = rnd(seed, 500 + i);
        const twinkle = 0.72 + 0.28 * Math.sin(frame / 9 + rnd(seed, 700 + i) * 30);
        return (
          <circle key={i} cx={rnd(seed, 100 + i) * W} cy={rnd(seed, 300 + i) * horizonY}
            r={0.6 + Math.pow(bright, 6) * 3.4}
            fill={STAR[Math.floor(rnd(seed, 900 + i) * STAR.length)]}
            opacity={(0.35 + bright * 0.65) * twinkle} />
        );
      })}
      {airglow && (
        <rect x={0} y={horizonY - 190} width={W} height={190} fill="#2A5A48"
          opacity={0.16} />
      )}
    </svg>
  );
};

/**
 * MONSOON CELLS — July into September in the Trans-Pecos and Big Bend, and it is
 * the most useful storm composition in the library.
 *
 * The storms build OVER THE MOUNTAINS specifically, so the cell sits on the range
 * while the plain in front of it stays sunlit. Several separate cells can be
 * visible at once in different directions, each with its own rain shaft, each with
 * VIRGA hanging under it that visibly stops before reaching the ground.
 *
 * Virga is the detail worth having as its own thing: rain that evaporates on the
 * way down. It only looks like that in air this dry, and drawing shafts that reach
 * the ground puts the frame somewhere wetter.
 */
export const MonsoonCells: React.FC<SkyProps & {
  cells?: number; virga?: boolean;
}> = ({seed = 72, frame = 0, horizonY = 1290, intensity = 1, cells = 3, virga = true}) => {
  const uid = useUid('sky');
  const s = SKY_LIGHT.monsoonCells;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {Array.from({length: cells}, (_, i) => {
        const cx = W * (0.16 + (i / Math.max(1, cells - 1)) * 0.72) + rnd(seed, i) * 60;
        const scale = 0.55 + rnd(seed, 20 + i) * 0.7;
        const cy = horizonY - 560 - rnd(seed, 40 + i) * 300;
        return (
          <g key={i}>
            <Lobes seed={seed + i * 31} cx={cx} cy={cy} rx={200 * scale * intensity}
              ry={140 * scale} n={9} lit="#F2EEE2" mid="#C0C4BC" shade="#8A94A0" />
            <ellipse cx={cx} cy={cy + 120 * scale} rx={190 * scale * intensity} ry={34}
              fill="#6E7A84" />
            {virga && Array.from({length: 12}, (_, k) => {
              // it STOPS before the ground. That is what makes it this desert.
              const drop = (200 + rnd(seed, 100 + i * 12 + k) * 180) * scale;
              return (
                <line key={k} x1={cx - 160 * scale + k * 28 * scale}
                  y1={cy + 130 * scale}
                  x2={cx - 178 * scale + k * 28 * scale} y2={cy + 130 * scale + drop}
                  stroke="#8A94A0" strokeWidth={6} opacity={0.30} strokeLinecap="round" />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

/** The plain clear skies, which are still two states and not one. Summer is a hard
 *  flat mid blue paling almost to white at the horizon, and winter is a deeper,
 *  cleaner blue that HOLDS its saturation far further down, because the air is dry.
 *  That difference is why a winter plains scene is more colourful than a summer one:
 *  cured gold grass against a saturated blue is a complementary pair, and the same
 *  grass under a washed-out summer sky is not. */
export const ClearSky: React.FC<SkyProps & {
  winter?: boolean; cumulus?: number;
}> = ({seed = 73, frame = 0, horizonY = 1290, winter = false, cumulus = 0}) => {
  const uid = useUid('sky');
  const s = winter ? SKY_LIGHT.winterClear : SKY_LIGHT.clearSummer;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Bands uid={uid} s={s} />
      {Array.from({length: cumulus}, (_, i) => {
        const cx = ((frame / 30) * 6 + rnd(seed, i) * W) % (W + 300) - 150;
        const cy = horizonY - 420 - rnd(seed, 20 + i) * 620;
        const r = 70 + rnd(seed, 40 + i) * 90;
        return (
          <g key={i}>
            <Lobes seed={seed + i * 19} cx={cx} cy={cy} rx={r} ry={r * 0.5} n={7}
              lit="#FFFFFF" mid="#EEF2F6" shade="#C0CCD8" />
            {/* FLAT BASE. Every fair weather cumulus has one and it is at one level. */}
            <rect x={cx - r} y={cy + r * 0.34} width={r * 2} height={7} fill="#C0CCD8" />
          </g>
        );
      })}
    </svg>
  );
};

/** Mount a named sky by name, so a storyboard can pick one from data. Falls back
 *  loudly rather than silently: an unknown name is a `resolve()` problem, and the
 *  registry throws for exactly the reason this one does not need to. */
export const Sky: React.FC<SkyProps & {state: SkyName}> = ({state, ...p}) => {
  switch (state) {
    case 'thunderhead': return <Thunderhead {...p} />;
    case 'supercell': return <Supercell {...p} />;
    case 'shelfCloud': return <ShelfCloud {...p} />;
    case 'blueNorther': return <BlueNorther {...p} />;
    case 'sunsetBands': return <SunsetBands {...p} />;
    case 'dustHaze': return <DustHaze {...p} />;
    case 'gulfOvercast': return <GulfOvercast {...p} />;
    case 'seaFog': return <SeaFog {...p} />;
    case 'greenHail': return <GreenHailSky {...p} />;
    case 'smoke': return <SmokeSky {...p} />;
    case 'starfield': return <Starfield {...p} />;
    case 'monsoonCells': return <MonsoonCells {...p} />;
    case 'winterClear': return <ClearSky {...p} winter />;
    default: return <ClearSky {...p} />;
  }
};
