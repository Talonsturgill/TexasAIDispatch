import React from 'react';
import {tones, FormGradient, ContactShadow, useLight, INK} from './lighting';

// =============================================================================
// CIVICS — where the decisions on this beat are actually taken.
//
// Almost every story here happens in one of four places: a hearing room, a
// commission dais, a courthouse square, or the Capitol. The engine could draw a
// data centre and a pumpjack and had nothing for any of them, which meant a film
// about a rule could only ever illustrate the rule's consequences.
//
// TRUE SCALE, the same rule as fauna and vehicles: 610 draw units is 1.70 m,
// which is the Character rig. A dais a person can sit behind is only correct if
// the bench top lands at their chest, and that is arithmetic rather than luck.
//
// TWO THINGS THIS FILE IS NOT ALLOWED TO DRAW, from knowledge/texas/CULTURE.md,
// and they are not stylistic preferences:
//
//   THE SIX FLAGS COMPOSITE. One of the six is the Confederate flag. Only the
//   Republic-era Lone Star and the current state flag. This is why the Capitol
//   rotunda's terrazzo is not drawn here: the star is surrounded by the six seals
//   and there is no honest way to show the floor without them.
//
//   A CONFEDERATE MONUMENT AS DECORATION. Texas has removed 31, more than any
//   state, and it is a live fight rather than set dressing. A courthouse square is
//   a core Texas image and many squares carry a contested monument. Draw the
//   square WITHOUT making the monument the subject, and if the story is genuinely
//   about it, that is reported rather than staged.
// =============================================================================

const M = 610 / 1.7;

export const CIVIC_M: Record<string, {h: number; note: string}> = {
  capitol: {h: 92.2, note: 'to the star in the Goddess of Liberty\'s hand'},
  courthouse: {h: 34.0, note: 'to the top of the clock tower, a typical county seat'},
  dais: {h: 1.55, note: 'bench top above the gallery floor, on a raised platform'},
  witnessTable: {h: 0.75, note: 'a table'},
  podium: {h: 1.22, note: 'to the reading surface'},
};

const fit = (k: keyof typeof CIVIC_M, local: number) => (CIVIC_M[k].h * M) / local;

interface Civic {
  x?: number; y?: number; scale?: number; frame?: number; facing?: 1 | -1; seed?: number;
}

const rnd = (seed: number, ch: number) => {
  const k = ((seed * 2654435761) ^ (ch * 40503)) >>> 0;
  return ((k >>> 8) % 10000) / 10000;
};

// =============================================================================
// THE CAPITOL — and THE MISTAKE is the whole entry.
//
// DRAW THE DOME PINK. It is sunset-red granite from Marble Falls, and drawing it
// white is the single most common Texas error in national media. Every stock
// illustration of "the Texas Capitol" is a white US-Capitol dome with a star
// stuck on it. A Texan sees that instantly and stops believing anything else in
// the frame.
//
// It is also TALLER than the United States Capitol, which Texans enjoy, and the
// figure on top is the Goddess of Liberty holding a gold star up at arm's length.
// =============================================================================
export const Capitol: React.FC<Civic & {lit?: boolean}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 1, lit = false,
}) => {
  const L = useLight();
  // THE PINK. Sunset-red granite, and it is the reason this component exists.
  const t = tones('#c98a7a', L);
  const K = fit('capitol', 200);                        // local frame: 200 units to the star
  const uid = `cap${seed}`;
  const glow = lit ? 0.35 + Math.sin(frame / 40) * 0.05 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K})`}>
      <defs><FormGradient id={`${uid}_g`} t={t} softness={0.75} /></defs>
      <ContactShadow cx={0} cy={1} rx={120} opacity={0.24} blur={10} />

      {/* the wings, long and low either side, which is most of the building */}
      <path d="M-118,0 L-118,-40 L-40,-40 L-40,-52 L40,-52 L40,-40 L118,-40 L118,0 Z"
        fill={`url(#${uid}_g)`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {Array.from({length: 18}, (_, i) => -112 + i * 13).map((wx) => (
        <rect key={wx} x={wx} y={-34} width={6} height={14} rx={1} fill="#5d6a78"
          opacity={0.85} />
      ))}
      {/* the central block */}
      <path d="M-40,-52 L-40,-84 L40,-84 L40,-52 Z" fill={`url(#${uid}_g)`} stroke={INK}
        strokeWidth={3} strokeLinejoin="round" />
      {/* the portico: a pediment on columns, at the centre of the south face */}
      <path d="M-26,-84 L0,-100 L26,-84 Z" fill={t.core} stroke={INK} strokeWidth={2.8}
        strokeLinejoin="round" />
      {[-20, -10, 0, 10, 20].map((cx2) => (
        <rect key={cx2} x={cx2 - 3} y={-84} width={6} height={32} fill={t.key}
          stroke={INK} strokeWidth={1.8} />
      ))}

      {/* the drum and THE DOME. Pink. Not white. */}
      <path d="M-30,-100 L-30,-124 L30,-124 L30,-100 Z" fill={`url(#${uid}_g)`}
        stroke={INK} strokeWidth={3} />
      {[-22, -11, 0, 11, 22].map((cx2) => (
        <rect key={cx2} x={cx2 - 3} y={-122} width={6} height={22} fill={t.key}
          stroke={INK} strokeWidth={1.6} />
      ))}
      <path d="M-32,-124 C-32,-158 32,-158 32,-124 Z" fill={`url(#${uid}_g)`}
        stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      {/* the ribs that make a dome read as a dome rather than as a half circle */}
      {[-22, -11, 0, 11, 22].map((rx2) => (
        <path key={rx2} d={`M${rx2},-124 C${rx2 * 0.9},-142 ${rx2 * 0.45},-152 0,-156`}
          stroke={t.shade} strokeWidth={1.6} fill="none" opacity={0.6} />
      ))}
      {/* lantern */}
      <path d="M-8,-156 L-8,-170 L8,-170 L8,-156 Z" fill={t.core} stroke={INK} strokeWidth={2.4} />
      <path d="M-10,-170 C-10,-180 10,-180 10,-170 Z" fill={t.key} stroke={INK} strokeWidth={2.2} />

      {/* THE GODDESS OF LIBERTY, holding the gold star up at arm's length */}
      <g transform="translate(0 -180)">
        <path d="M-3,0 L-3,-14 Q0,-18 3,-14 L3,0 Z" fill="#e8e2d4" stroke={INK} strokeWidth={2} />
        <circle cx={0} cy={-17} r={3} fill="#e8e2d4" stroke={INK} strokeWidth={1.8} />
        <path d="M2,-16 L9,-22" stroke="#e8e2d4" strokeWidth={2.4} strokeLinecap="round" />
        <path d="M9,-28 l2.2,4.6 l5,0.7 l-3.6,3.5 0.9,5 -4.5,-2.4 -4.5,2.4 0.9,-5
                 -3.6,-3.5 5,-0.7 Z" fill="#e0b23f" stroke={INK} strokeWidth={1.6}
          strokeLinejoin="round" />
      </g>
      {lit && (
        <ellipse cx={0} cy={-130} rx={60} ry={54} fill="#ffdca8" opacity={glow}
          style={{mixBlendMode: 'screen'}} />
      )}
    </g>
  );
};

/**
 * THE GREAT WALK's pavement, black and white diamonds, a verified detail.
 * A ground treatment rather than an object, so it takes a width and a depth.
 */
export const GreatWalk: React.FC<{x?: number; y?: number; w?: number; rows?: number}> = ({
  x = 0, y = 0, w = 600, rows = 6,
}) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({length: rows}, (_, r) => {
      const s = 26 - r * 2.6;                            // recedes
      const ry = -r * s * 0.5;
      const n = Math.ceil(w / s);
      return Array.from({length: n}, (_, c) => (
        <path key={`${r}-${c}`}
          d={`M${-w / 2 + c * s},${ry} l${s / 2},${-s * 0.32} l${s / 2},${s * 0.32}
              l${-s / 2},${s * 0.32} Z`}
          fill={(r + c) % 2 ? '#1d1f24' : '#e4ded2'} opacity={0.9 - r * 0.09} />
      ));
    })}
  </g>
);

// =============================================================================
// COUNTY COURTHOUSE ON A SQUARE — the most Texas civic image there is. 254
// counties, and the courthouse is the centre of the county seat.
//
// THE RULE FROM KIT.md: the TOWER IS CENTRED and the SQUARE IS ASYMMETRIC. A
// symmetric square is the tell, because a real one grew a bank on one corner, a
// vacant storefront on another and a restored hotel on a third over a hundred and
// forty years.
//
// The monument on many squares is contested. It is NOT drawn here. That is a
// decision from CULTURE.md rather than an omission: draw the square without
// making it the subject, and if a story is genuinely about it, it gets reported
// rather than staged.
// =============================================================================
export const Courthouse: React.FC<Civic & {clockHour?: number}> = ({
  x = 0, y = 0, scale = 1, frame = 0, seed = 2, clockHour = 10.6,
}) => {
  const L = useLight();
  const t = tones('#b08466', L);
  const K = fit('courthouse', 170);                     // local frame: 170 units to the finial
  const uid = `ch${seed}`;
  const hand = (clockHour / 12) * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K})`}>
      <defs><FormGradient id={`${uid}_g`} t={t} softness={0.7} /></defs>
      <ContactShadow cx={0} cy={1} rx={96} opacity={0.26} blur={9} />
      {/* the block, Romanesque and heavy at the base */}
      <path d="M-92,0 L-92,-56 L-58,-56 L-58,-72 L58,-72 L58,-56 L92,-56 L92,0 Z"
        fill={`url(#${uid}_g)`} stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      {Array.from({length: 12}, (_, i) => -86 + i * 15).map((wx) => (
        <g key={wx}>
          <path d={`M${wx},-20 L${wx},-40 Q${wx + 5},-48 ${wx + 10},-40 L${wx + 10},-20 Z`}
            fill="#4e5a66" stroke={INK} strokeWidth={1.8} opacity={0.9} />
        </g>
      ))}
      {/* the entrance arch, which is what makes it Romanesque rather than a box */}
      <path d="M-14,0 L-14,-30 Q0,-46 14,-30 L14,0 Z" fill="#3b444e" stroke={INK}
        strokeWidth={2.8} strokeLinejoin="round" />
      <path d="M-20,-30 Q0,-52 20,-30" fill="none" stroke={t.key} strokeWidth={5} />

      {/* THE TOWER, CENTRED */}
      <path d="M-24,-72 L-24,-124 L24,-124 L24,-72 Z" fill={`url(#${uid}_g)`}
        stroke={INK} strokeWidth={3.2} />
      {[-16, 0, 16].map((wx) => (
        <path key={wx} d={`M${wx - 5},-84 L${wx - 5},-104 Q${wx},-112 ${wx + 5},-104 L${wx + 5},-84 Z`}
          fill="#4e5a66" stroke={INK} strokeWidth={1.8} />
      ))}
      {/* the clock */}
      <circle cx={0} cy={-134} r={16} fill="#e8e2d4" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-134} r={12} fill="none" stroke={INK} strokeWidth={1.2} opacity={0.4} />
      <path d={`M0,-134 L${Math.cos(hand) * 9},${-134 + Math.sin(hand) * 9}`} stroke={INK}
        strokeWidth={2.4} strokeLinecap="round" />
      <path d="M0,-134 L0,-141" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <path d="M-26,-124 L26,-124 L20,-118 L-20,-118 Z" fill={t.core} stroke={INK}
        strokeWidth={2.6} strokeLinejoin="round" />
      {/* mansard cap and finial */}
      <path d="M-20,-148 L0,-166 L20,-148 Z" fill="#4a4a52" stroke={INK} strokeWidth={2.8}
        strokeLinejoin="round" />
      <path d="M-22,-148 L22,-148" stroke={INK} strokeWidth={2.6} />
      <path d="M0,-166 L0,-176" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

      {/* live oaks, low and spreading, and DELIBERATELY ASYMMETRIC across the square */}
      {[[-118, 0.9], [-146, 0.7], [124, 1.05]].map(([ox, os], i) => (
        <g key={i} transform={`translate(${ox} 0) scale(${os})`}>
          <path d="M-3,0 L-3,-18 M-3,-14 q-8,-3 -12,-9 M-3,-12 q8,-4 13,-10"
            stroke="#5a4632" strokeWidth={5} fill="none" strokeLinecap="round" />
          <ellipse cx={-2} cy={-34} rx={26} ry={15} fill="#4a5c3a" stroke={INK}
            strokeWidth={2.6} />
          <ellipse cx={-14} cy={-28} rx={14} ry={10} fill="#55683f" opacity={0.9} />
          <ellipse cx={10} cy={-30} rx={13} ry={9} fill="#3f5033" opacity={0.85} />
        </g>
      ))}
    </g>
  );
};

// =============================================================================
// THE HEARING DAIS — where a rule on this beat is actually made or refused.
//
// A raised bench with members behind it, name plates, gooseneck microphones, and
// the seal on the front panel. It takes a SEAT COUNT because the same piece of
// furniture is a three-commissioner PUCT bench and a fifteen-member legislative
// committee, and drawing three when it was fifteen is a claim about the room.
//
// Characters sit BEHIND it. The bench top is at chest height on a seated person
// by arithmetic, so a cast member placed behind it looks like they are sitting at
// it rather than standing in a hole.
// =============================================================================
export const HearingDais: React.FC<Civic & {seats?: number; seal?: boolean; width?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 3, seats = 3, seal = true, width = 300,
}) => {
  const L = useLight();
  const t = tones('#6b4a30', L);
  const K = fit('dais', 100);                           // local frame: 100 units to the bench top
  const uid = `dz${seed}`;
  const w = width;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K})`}>
      <defs><FormGradient id={`${uid}_w`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={w * 0.55} opacity={0.26} blur={8} />
      {/* the platform the bench stands on: a dais is raised, and that is the point */}
      <path d={`M${-w / 2 - 14},0 L${-w / 2 - 14},-26 L${w / 2 + 14},-26 L${w / 2 + 14},0 Z`}
        fill={t.shade} stroke={INK} strokeWidth={3} />
      {/* the bench front */}
      <path d={`M${-w / 2},-26 L${-w / 2},-92 L${w / 2},-92 L${w / 2},-26 Z`}
        fill={`url(#${uid}_w)`} stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
      {/* panelling, because a flat field of wood reads as a wall */}
      {Array.from({length: Math.max(2, Math.round(w / 52))}, (_, i) => {
        const px = -w / 2 + 18 + i * ((w - 36) / Math.max(1, Math.round(w / 52)));
        return <rect key={i} x={px} y={-82} width={(w - 36) / Math.max(1, Math.round(w / 52)) - 12}
          height={44} rx={2} fill="none" stroke={t.shade} strokeWidth={2.4} opacity={0.8} />;
      })}
      {/* the writing surface, overhanging */}
      <path d={`M${-w / 2 - 8},-92 L${w / 2 + 8},-92 L${w / 2 + 8},-100 L${-w / 2 - 8},-100 Z`}
        fill={t.key} stroke={INK} strokeWidth={3} strokeLinejoin="round" />

      {seal && (
        <g transform="translate(0 -58)">
          <circle r={17} fill="#e4d8c3" stroke={INK} strokeWidth={2.8} opacity={0.95} />
          <circle r={13} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.5} />
          {/* A LONE STAR AND NOTHING ELSE. The six-flags composite is retired and
              this is the one mark that carries the state without it. */}
          <path d="M0,-9 l2.7,5.6 l6.2,0.9 l-4.5,4.3 1.1,6.1 -5.5,-2.9 -5.5,2.9 1.1,-6.1
                   -4.5,-4.3 6.2,-0.9 Z" fill="#1d2a4a" stroke={INK} strokeWidth={1.4}
            strokeLinejoin="round" />
        </g>
      )}

      {/* name plates and gooseneck microphones, one per seat */}
      {Array.from({length: seats}, (_, i) => {
        const sx = -w / 2 + (w / (seats + 1)) * (i + 1);
        return (
          <g key={i} transform={`translate(${sx} -100)`}>
            <path d="M-20,0 L20,0 L16,-11 L-16,-11 Z" fill="#3b3128" stroke={INK}
              strokeWidth={2.4} strokeLinejoin="round" />
            <path d="M-13,-4 L13,-4" stroke="#d8cdb6" strokeWidth={2.6} opacity={0.85} />
            <path d={`M${8 + rnd(seed, i) * 4},-11 q2,-14 ${-6 - rnd(seed, 9 + i) * 4},-20`}
              stroke="#2f3338" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            <ellipse cx={0} cy={-33} rx={3.4} ry={2.4} fill="#2f3338" stroke={INK}
              strokeWidth={1.6}
              transform={`translate(${2 + rnd(seed, i) * 4} 0)`} />
          </g>
        );
      })}
    </g>
  );
};

// =============================================================================
// WITNESS TABLE — the other side of the room, and the more interesting one. A
// table, a microphone, a card with a name on it, and a stack of paper that is
// either three pages or four hundred.
//
// `pages` is a real parameter because the height of that stack is the whole
// visual argument in a story about a comment period.
// =============================================================================
export const WitnessTable: React.FC<Civic & {pages?: number; card?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 4, pages = 40, card = true,
}) => {
  const L = useLight();
  const t = tones('#7a5c3e', L);
  const K = fit('witnessTable', 100);                   // local frame: 100 units to the top
  const uid = `wt${seed}`;
  const stack = Math.min(46, Math.sqrt(Math.max(0, pages)) * 3.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K})`}>
      <defs><FormGradient id={`${uid}_w`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={96} opacity={0.24} blur={7} />
      <path d="M-88,-88 L88,-88 L88,-100 L-88,-100 Z" fill={t.key} stroke={INK}
        strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M-84,-88 L-84,-30 L-78,-30 L-78,-88 Z M78,-88 L78,-30 L84,-30 L84,-88 Z"
        fill={`url(#${uid}_w)`} stroke={INK} strokeWidth={2.8} />
      <path d="M-84,-34 L84,-34" stroke={t.shade} strokeWidth={4} />
      {/* the modesty panel, which every hearing table has */}
      <path d="M-80,-56 L80,-56 L80,-84 L-80,-84 Z" fill={t.core} stroke={INK}
        strokeWidth={2.6} opacity={0.95} />
      {/* THE STACK. Its height is the argument. */}
      {stack > 2 && (
        <g transform={`translate(-42 -100)`}>
          <path d={`M-22,0 L22,0 L22,${-stack} L-22,${-stack} Z`} fill="#efe9dc"
            stroke={INK} strokeWidth={2.4} />
          {Array.from({length: Math.min(14, Math.round(stack / 3.2))}, (_, i) => (
            <path key={i} d={`M-22,${-3 - i * 3.2} L22,${-3 - i * 3.2}`} stroke="#cfc7b4"
              strokeWidth={1.2} />
          ))}
        </g>
      )}
      <path d="M34,-100 q3,-18 -5,-26" stroke="#2f3338" strokeWidth={2.4} fill="none"
        strokeLinecap="round" />
      <ellipse cx={27} cy={-128} rx={4} ry={2.8} fill="#2f3338" stroke={INK} strokeWidth={1.8} />
      {card && (
        <path d="M52,-100 L84,-100 L80,-114 L56,-114 Z" fill="#efe9dc" stroke={INK}
          strokeWidth={2.4} strokeLinejoin="round" />
      )}
    </g>
  );
};

// =============================================================================
// PODIUM — a press conference, an announcement, a bill signing. The seal panel
// takes a colour so the same object serves a state agency, a county and a
// company without pretending to be a specific one.
// =============================================================================
export const Podium: React.FC<Civic & {sealColor?: string; mics?: number}> = ({
  x = 0, y = 0, scale = 1, seed = 5, sealColor = '#1d2a4a', mics = 3,
}) => {
  const L = useLight();
  const t = tones('#6b4a30', L);
  const K = fit('podium', 100);                         // local frame: 100 units to the top
  const uid = `pd${seed}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * K})`}>
      <defs><FormGradient id={`${uid}_w`} t={t} softness={0.6} /></defs>
      <ContactShadow cx={0} cy={1} rx={40} opacity={0.24} blur={6} />
      <path d="M-22,0 L-16,-72 L16,-72 L22,0 Z" fill={`url(#${uid}_w)`} stroke={INK}
        strokeWidth={3.2} strokeLinejoin="round" />
      <path d="M-30,-72 L30,-72 L34,-86 L-34,-86 Z" fill={t.key} stroke={INK}
        strokeWidth={3.2} strokeLinejoin="round" />
      <g transform="translate(0 -40)">
        <circle r={13} fill="#e4d8c3" stroke={INK} strokeWidth={2.6} />
        <path d="M0,-7 l2.1,4.3 l4.8,0.7 l-3.5,3.3 0.9,4.8 -4.3,-2.3 -4.3,2.3 0.9,-4.8
                 -3.5,-3.3 4.8,-0.7 Z" fill={sealColor} stroke={INK} strokeWidth={1.2}
          strokeLinejoin="round" />
      </g>
      {Array.from({length: mics}, (_, i) => {
        const a = -18 + i * (36 / Math.max(1, mics - 1));
        return (
          <g key={i} transform={`translate(${a} -86) rotate(${a * 0.5})`}>
            <path d="M0,0 q2,-16 -3,-24" stroke="#2f3338" strokeWidth={2.2} fill="none"
              strokeLinecap="round" />
            <ellipse cx={-3} cy={-26} rx={4} ry={3} fill="#2f3338" stroke={INK}
              strokeWidth={1.8} />
          </g>
        );
      })}
    </g>
  );
};
