import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK, RustStreak, CalicheDust} from './lighting';
import {matFill} from './materials';
import {fitter, subber, rnd} from './scale';

// =============================================================================
// BLACK TEXAS. The single most important correction this whole wave carries.
//
// THE ERROR THAT DOES THE MOST DAMAGE IS TREATING BLACK TEXAS AS AN URBAN
// FOOTNOTE. An outsider draws Houston, maybe Dallas, and stops. Black Texas is
// coastal and rural and OLD before it is urban. Freedom was announced in
// Galveston, a port. Black cowboys concentrated in the ranching country of the
// Coastal Plain between the Sabine and the Guadalupe, which is not the Hill
// Country and not West Texas. Freedmen's towns were founded across the countryside
// after 1865, not only inside city limits. The Negro Cowboys Rodeo Association was
// formed in 1947 by East Texas ranchers.
//
// So this module draws a coastal prairie road and a country church with a pit
// behind it, alongside the Houston material, and the city is one setting among
// several rather than the whole map.
//
// THE SECOND CORRECTION: THE COWBOY. Historians estimate roughly one in four
// cowboys on the Texas trail drives were Black, alongside counts of five to eight
// thousand Black drovers. Bose Ikard was Charles Goodnight's top hand and also his
// detective and his banker on the trail. Daniel W. Wallace, called 80 John, owned
// more than 1,200 acres near Loraine. Bill Pickett, born in Travis County,
// invented bulldogging. A mixed crew is the DEFAULT in any nineteenth century
// cattle scene, because that is what a crew looked like.
//
// And the present tense matters as much as the history. Trail riding clubs and
// Black rodeo have run continuously since the 1940s and 1950s, so the register is
// ordinary and current, not archival and rare. The riders are grandmothers and
// eight year olds, and drawing only fit young men is a distortion.
//
// THE THIRD CORRECTION IS ABOUT BARBECUE, and it is small and it matters. What
// cooks at a Juneteenth is the older Black East Texas and Gulf Coast PIT
// tradition, a trench with a grate or a cut steel tank, cooking large cuts slowly
// over hardwood with a thin vinegar and pepper mop. That is a separate lineage
// from the Central Texas German and Czech meat market counter, which is the one
// that usually gets called Texas barbecue. Both are Texan. Only one of them shows
// up in a churchyard on June 19th, and it is not a kettle grill.
//
// WHAT THIS MODULE DOES NOT DRAW: the SLAB, which lives in `tejano.tsx` beside the
// lowrider so the two forms sit next to each other and cannot be confused. A slab
// is Houston, a lowrider is Los Angeles by way of Chicano Texas, and they are not
// interchangeable. Cross-reference rather than duplicate.
// =============================================================================

export const BLACKTX_M: Record<string, {h: number; note: string}> = {
  bbqPit: {h: 1.5, note: 'a cut tank pit on a trailer, at the top of the closed lid'},
  pitStack: {h: 2.6, note: 'the smokestack at the end of an offset pit'},
  churchFan: {h: 0.36, note: 'a church fan, blade top to the end of the handle'},
  churchPew: {h: 0.95, note: 'a wooden pew at the top of the back'},
  choirLoft: {h: 1.1, note: 'a raised choir loft above the sanctuary floor'},
  organLeslie: {h: 1.2, note: 'a rotating speaker cabinet beside the organ'},
  trailWagon: {h: 2.8, note: 'a customised trail ride wagon at the roof'},
  trailRider: {h: 2.4, note: 'a mounted rider, ground to the top of the hat'},
  rodeoChute: {h: 1.9, note: 'a bucking chute gate at the top rail'},
  rubboard: {h: 0.55, note: 'a vest frottoir, shoulder hooks to the bottom edge'},
  shotgunHouse: {h: 5.2, note: 'a shotgun house at the ridge, gable to the street'},
  brickStreet: {h: 0.08, note: 'a laid brick street, which is a surface'},
  emancipationPavilion: {h: 4.5, note: 'an open air pavilion at the eave'},
  sousaphone: {h: 0.76, note: 'a sousaphone bell diameter, which is how they are sized'},
  // A BAND IS MADE OF PEOPLE, so the block is scaled by a person and not by a horn.
  // HBCUBand used to fit on the sousaphone and then multiply by 0.16, which cancelled the
  // metre conversion it had just done and rendered the whole block 13 cm tall. The drum
  // major stood ankle high on any cast member sharing the plane. A bell diameter is still
  // the right way to size a sousaphone and the wrong way to size the person carrying it.
  bandMember: {h: 1.7, note: 'a marching band member standing, the same rig height as the cast'},
  redDrink: {h: 0.22, note: 'a bottle of red soda'},
};

const fit = fitter(BLACKTX_M);
const sub = subber(BLACKTX_M);

export interface BlackTxProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
  night?: boolean;
  frame?: number;
}

/**
 * THE PIT. Draw a real one, not a kettle grill.
 *
 * Three forms, all correct. A TRENCH dug in the ground with a grate over it. A cut
 * and hinged steel tank on a trailer with a smokestack at one end and an offset
 * firebox at the other. Or a cinder block pit built in a churchyard and used for
 * decades.
 *
 * THE SHOT WORTH HAVING is the pit at dawn, one person tending it alone, smoke
 * lying low across the grass, hours before anybody else arrives. That is the labour
 * under the celebration and it is the honest opening for a Juneteenth sequence.
 *
 * SMOKE LIES LOW IN THE MORNING and rises later, so `hour` drives the smoke rather
 * than a constant plume. Thin blue smoke is a fire running right. Thick white smoke
 * means it is choking, and drawing a barbecue with a white column above it says the
 * cook is having a bad morning.
 */
export const BarbecuePit: React.FC<BlackTxProps & {
  h?: number; form?: 'tank' | 'trench' | 'block'; lit?: boolean; hour?: number;
  lidOpen?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 141, wear = 0.55, facing = 1, night = false,
       h = 100, form = 'tank', lit = true, hour = 0.15, lidOpen = false, frame = 0}) => {
  const L = useLight();
  const K = fit('bbqPit', h);
  const steel = tones('#4A423A', L);
  const w = h * 2.6;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {form === 'tank' && (
        <g>
          {/* the trailer under it, because most of these travel */}
          <rect x={-w * 0.44} y={-h * 0.24} width={w * 0.88} height={h * 0.08}
            fill="#3A342E" />
          {[-0.28, 0.24].map((f, i) => (
            <circle key={i} cx={w * f} cy={-h * 0.10} r={h * 0.14} fill="#26241F" />
          ))}
          {/* the cut tank: a horizontal cylinder with a hinged lid along its length */}
          <path fill={steel.core} d={
            `M${-w * 0.40},${-h * 0.24} L${-w * 0.40},${-h * 0.62}` +
            ` A${h * 0.38},${h * 0.38} 0 0 1 ${w * 0.34},${-h * 0.62}` +
            ` L${w * 0.34},${-h * 0.24} Z`} />
          <ellipse cx={-w * 0.03} cy={-h * 0.62} rx={w * 0.37} ry={h * 0.16}
            fill={lidOpen ? '#1A1614' : steel.base} />
          {lidOpen ? (
            <g>
              <path fill={steel.base} d={
                `M${-w * 0.40},${-h * 0.62} L${-w * 0.32},${-h * 1.10}` +
                ` L${w * 0.42},${-h * 1.10} L${w * 0.34},${-h * 0.62} Z`} />
              {/* the grate, and what is on it */}
              {Array.from({length: 9}, (_, i) => (
                <line key={i} x1={-w * 0.36 + i * w * 0.085} y1={-h * 0.70}
                  x2={-w * 0.36 + i * w * 0.085} y2={-h * 0.52} stroke="#8A8580"
                  strokeWidth={h * 0.012} />
              ))}
              {Array.from({length: 4}, (_, i) => (
                <ellipse key={i} cx={-w * 0.26 + i * w * 0.17} cy={-h * 0.62}
                  rx={w * 0.07} ry={h * 0.06} fill="#5A2E1E" />
              ))}
            </g>
          ) : (
            <>
              {/* the lid handle and the two hinges along the back */}
              <rect x={-w * 0.05} y={-h * 0.78} width={w * 0.10} height={h * 0.030}
                fill="#8A8580" />
              <rect x={-w * 0.02} y={-h * 0.76} width={w * 0.02} height={h * 0.14}
                fill="#8A8580" />
            </>
          )}
          {/* THE OFFSET FIREBOX at one end, LOWER than the chamber */}
          <rect x={-w * 0.56} y={-h * 0.52} width={w * 0.18} height={h * 0.28}
            fill={steel.shade} />
          <rect x={-w * 0.54} y={-h * 0.46} width={h * 0.10} height={h * 0.14}
            fill={lit ? '#F09030' : '#1A1614'} />
          {/* the stack at the OTHER end. Diagonal across the pit is the whole design. */}
          <rect x={w * 0.28} y={-h * 1.30} width={h * 0.11} height={h * 0.70}
            fill={steel.core} />
          <rect x={w * 0.26} y={-h * 1.34} width={h * 0.15} height={h * 0.06}
            fill={steel.base} />
        </g>
      )}
      {form === 'trench' && (
        <g>
          <rect x={-w * 0.40} y={-h * 0.10} width={w * 0.80} height={h * 0.20}
            fill="#1A1614" />
          <rect x={-w * 0.42} y={-h * 0.14} width={w * 0.84} height={h * 0.05}
            fill="#6A6058" />
          {Array.from({length: 13}, (_, i) => (
            <line key={i} x1={-w * 0.38 + i * w * 0.063} y1={-h * 0.13}
              x2={-w * 0.38 + i * w * 0.063} y2={h * 0.02} stroke="#8A8580"
              strokeWidth={h * 0.014} />
          ))}
          {lit && Array.from({length: 8}, (_, i) => (
            <ellipse key={i} cx={-w * 0.34 + i * w * 0.096} cy={-h * 0.02}
              rx={h * 0.06} ry={h * 0.030} fill="#E86828" opacity={0.7} />
          ))}
        </g>
      )}
      {form === 'block' && (
        <g>
          <rect x={-w * 0.40} y={-h * 0.66} width={w * 0.80} height={h * 0.66}
            fill="#B4AEA0" />
          {Array.from({length: 5}, (_, r) =>
            Array.from({length: 8}, (_, c) => (
              <rect key={`${r}${c}`} x={-w * 0.39 + c * w * 0.0975}
                y={-h * 0.64 + r * h * 0.128} width={w * 0.092} height={h * 0.12}
                fill="none" stroke="#9A9488" strokeWidth={h * 0.008} />
            )))}
          <rect x={-w * 0.42} y={-h * 0.70} width={w * 0.84} height={h * 0.05}
            fill="#6A6058" />
        </g>
      )}
      {lit && (
        /* THIN BLUE SMOKE means the fire is running right. A white column means it
           is choking, which is a bad morning and not a barbecue. */
        Array.from({length: 14}, (_, i) => {
          const p = ((frame / 30) * 0.16 + rnd(seed, i)) % 1;
          // low at dawn, rising later
          const lift = hour < 0.3 ? 0.30 : 1;
          return (
            <ellipse key={i}
              cx={w * (form === 'tank' ? 0.33 : 0) + p * w * (hour < 0.3 ? 1.4 : 0.4)
                  + (rnd(seed, 30 + i) - 0.5) * w * 0.2}
              cy={-h * (form === 'tank' ? 1.34 : 0.2) - p * h * 1.2 * lift}
              rx={h * (0.10 + p * 0.40)} ry={h * (0.06 + p * 0.22)}
              fill="#9AA6AC" opacity={(1 - p) * 0.30} />
          );
        })
      )}
      {wear > 0.4 && <RustStreak x={-w * 0.30} y={-h * 0.50} w={w * 0.6} h={h * 0.26}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE CHURCH FAN, and it is the cheapest good animation in this entire library.
 *
 * A field of small oscillating rectangles at RANDOM PHASE reads as heat, time and a
 * crowd all at once, which is three things for the price of one drawing.
 *
 * THE OBJECT IS A SMALL ECONOMY. Black owned funeral homes gave them to churches
 * free, so the fan carried an image of Black families back to a congregation at a
 * time when almost no other printed image did, and it kept Black dollars circulating
 * inside the community. The advertisement on the BACK is not a blemish on the
 * picture. It is the meaning.
 *
 * So the two sides showing alternately as the fan turns is the whole visual idea,
 * and `flip` drives it. The illustration side is warm full colour. The
 * advertisement side is one or two ink colours on the same cream stock.
 *
 * The handle is a FLAT WOODEN PADDLE stapled through the card, not a stick.
 */
export const ChurchFan: React.FC<BlackTxProps & {
  h?: number; phase?: number; amp?: number; showAd?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 142, h = 60, phase = 0, amp = 1,
       showAd = false, frame = 0}) => {
  const L = useLight();
  const K = fit('churchFan', h);
  const card = tones('#F0E8D4', L);
  const swing = Math.sin(frame / 6.5 + phase) * 26 * amp;
  // the two sides alternate as it turns, which is the whole gag and the whole meaning
  const facingAd = showAd || Math.cos(frame / 6.5 + phase) < 0;
  const bw = h * 0.62;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale}) rotate(${swing})`}>
      <rect x={-h * 0.035} y={-h * 0.30} width={h * 0.070} height={h * 0.44}
        rx={h * 0.030} fill="#C8B48A" />
      {/* the blade: rounded corners, sometimes scalloped, wider at the top */}
      <path fill={card.core} d={
        `M${-bw * 0.5},${-h * 0.28} L${-bw * 0.56},${-h * 0.78}` +
        ` Q0,${-h * 0.92} ${bw * 0.56},${-h * 0.78} L${bw * 0.5},${-h * 0.28} Z`} />
      {facingAd ? (
        /* the advertisement side: one or two inks on cream, often hand-set type */
        <g>
          <rect x={-bw * 0.40} y={-h * 0.70} width={bw * 0.80} height={h * 0.06}
            fill="#2A2A32" />
          {Array.from({length: 4}, (_, i) => (
            <rect key={i} x={-bw * (0.32 - i * 0.03)} y={-h * (0.60 - i * 0.07)}
              width={bw * (0.64 - i * 0.06)} height={h * 0.035}
              fill={i === 1 ? '#8A2A2A' : '#2A2A32'} opacity={0.85} />
          ))}
        </g>
      ) : (
        /* the illustration side: warm full colour lithography, soft and slightly
           oversaturated, and it is a picture of people */
        <g>
          <rect x={-bw * 0.44} y={-h * 0.76} width={bw * 0.88} height={h * 0.44}
            fill="#A8C4D8" />
          <ellipse cx={0} cy={-h * 0.36} rx={bw * 0.46} ry={h * 0.12} fill="#7A9A5E" />
          {Array.from({length: 3}, (_, i) => (
            <g key={i} transform={`translate(${(i - 1) * bw * 0.24} 0)`}>
              <circle cx={0} cy={-h * 0.58} r={h * 0.035} fill="#8A5E3C" />
              <path fill={['#C4302C', '#E8DCC0', '#3A5A7A'][i]} d={
                `M${-h * 0.036},${-h * 0.54} L${h * 0.036},${-h * 0.54}` +
                ` L${h * 0.046},${-h * 0.38} L${-h * 0.046},${-h * 0.38} Z`} />
            </g>
          ))}
        </g>
      )}
      {/* the staples through the card, which is how it is actually assembled */}
      {[-1, 1].map((s) => (
        <rect key={s} x={s * h * 0.02 - h * 0.008} y={-h * 0.30} width={h * 0.016}
          height={h * 0.014} fill="#8A8580" />
      ))}
    </g>
  );
};

/** A WHOLE CONGREGATION OF THEM, which is what the shot actually is. Forty fans at
 *  forty different angles and phases, moving out of sync, in a hot room. */
export const FanField: React.FC<BlackTxProps & {
  w?: number; depth?: number; count?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 143, w = 900, depth = 260, count = 34,
       frame = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {Array.from({length: count}, (_, i) => {
      const u = rnd(seed, i), v = Math.pow(rnd(seed, 500 + i), 0.7);
      return (
        <ChurchFan key={i} x={(u - 0.5) * w} y={v * depth}
          scale={0.5 + v * 0.7} seed={seed + i * 13}
          phase={rnd(seed, 900 + i) * Math.PI * 2}
          amp={0.6 + rnd(seed, 700 + i) * 0.8} frame={frame} />
      );
    })}
  </g>
);

/**
 * THE SANCTUARY. Outsiders draw a choir and a preacher and stop.
 *
 * WHAT THEY LEAVE OUT IS THE BAND. The organ with its ROTATING SPEAKER CABINET
 * beside it, the drum kit, the bass amp, the ushers in white gloves at the aisle
 * ends. A Black church without a drum kit in it is missing the instrument the room
 * is actually built around.
 *
 * The raised choir loft sits BEHIND AND ABOVE the pulpit, in two or three rows, and
 * the robe colour sets the whole frame: royal blue, burgundy, gold, purple, white,
 * or black with a coloured stole.
 *
 * In a small country church, add a window unit high in the back wall and a ceiling
 * fan turning too slowly to help. That is the East Texas version and it is older
 * than most of the Houston ones.
 */
export const Sanctuary: React.FC<BlackTxProps & {
  h?: number; w?: number; pews?: number; robe?: string; country?: boolean;
  choir?: number; band?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 144, wear = 0.25, night = false,
       h = 300, w = 900, pews = 5, robe = '#2C4A8C', country = false,
       choir = 9, band = true, frame = 0}) => {
  const L = useLight();
  const wall = tones('#E4DCC4', L);
  const wood = tones('#8A6440', L);
  const r = tones(robe, L);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={wall.core} />
      {/* the warm side light through the glass, which is the room's whole mood */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path fill={night ? '#2A3038' : '#E8C878'} d={
            `M${s * w * 0.42},${-h * 0.86} L${s * w * 0.42},${-h * 0.46}` +
            ` L${s * w * 0.30},${-h * 0.46} L${s * w * 0.30},${-h * 0.78}` +
            ` Q${s * w * 0.36},${-h * 0.92} ${s * w * 0.42},${-h * 0.86} Z`} />
          {!night && (
            <path fill="#E8C878" opacity={0.14} d={
              `M${s * w * 0.42},${-h * 0.86} L${s * w * 0.30},${-h * 0.46}` +
              ` L${s * w * 0.06},${0} L${s * w * 0.30},${0} Z`} />
          )}
        </g>
      ))}
      {/* THE CHOIR LOFT, raised, behind and above the pulpit */}
      <rect x={-w * 0.26} y={-h * 0.52} width={w * 0.52} height={h * 0.10}
        fill={wood.shade} />
      {Array.from({length: choir}, (_, i) => {
        const row = i < Math.ceil(choir / 2) ? 0 : 1;
        const k = row ? i - Math.ceil(choir / 2) : i;
        const per = row ? Math.floor(choir / 2) : Math.ceil(choir / 2);
        const cx = (k / Math.max(1, per - 1) - 0.5) * w * 0.44;
        return (
          <g key={i} transform={`translate(${cx} ${-h * (0.52 + row * 0.09)})`}>
            <path fill={row ? r.base : r.core} d={
              `M${-w * 0.024},0 L${-w * 0.030},${-h * 0.15}` +
              ` L${w * 0.030},${-h * 0.15} L${w * 0.024},0 Z`} />
            <rect x={-w * 0.010} y={-h * 0.155} width={w * 0.020} height={h * 0.06}
              fill="#F0ECE0" />
            <circle cx={0} cy={-h * 0.175} r={w * 0.016} fill="#8A5E3C" />
          </g>
        );
      })}
      {/* the pulpit, with a panel front */}
      <path fill={wood.core} d={
        `M${-w * 0.07},${-h * 0.42} L${-w * 0.09},${-h * 0.20}` +
        ` L${w * 0.09},${-h * 0.20} L${w * 0.07},${-h * 0.42} Z`} />
      {band && (
        <g>
          {/* THE ORGAN and its ROTATING SPEAKER CABINET. The cabinet is the detail
              that says this is the tradition and not a generic church. */}
          <g transform={`translate(${-w * 0.34} ${-h * 0.20})`}>
            <rect x={-w * 0.06} y={-h * 0.16} width={w * 0.12} height={h * 0.16}
              fill="#5A4330" />
            <rect x={-w * 0.055} y={-h * 0.17} width={w * 0.11} height={h * 0.02}
              fill="#F0ECE0" />
            <rect x={w * 0.07} y={-h * 0.22} width={w * 0.06} height={h * 0.22}
              fill="#4A3828" />
            {Array.from({length: 5}, (_, i) => (
              <line key={i} x1={w * 0.075} y1={-h * (0.20 - i * 0.03)}
                x2={w * 0.125} y2={-h * (0.20 - i * 0.03)} stroke="#2A2018"
                strokeWidth={h * 0.008} />
            ))}
          </g>
          {/* the kit, which outsiders leave out and which is always there */}
          <g transform={`translate(${w * 0.32} ${-h * 0.20})`}>
            <ellipse cx={0} cy={-h * 0.05} rx={w * 0.045} ry={h * 0.05} fill="#C4B08A" />
            <ellipse cx={-w * 0.05} cy={-h * 0.13} rx={w * 0.026} ry={h * 0.012}
              fill="#D8C088" />
            <ellipse cx={w * 0.05} cy={-h * 0.16} rx={w * 0.030} ry={h * 0.008}
              fill="#D8B860" />
            <line x1={w * 0.05} y1={-h * 0.16} x2={w * 0.05} y2={-h * 0.02}
              stroke="#8A8580" strokeWidth={h * 0.006} />
          </g>
        </g>
      )}
      {/* the pews: shallow curved backs, hymnal racks on the back of each */}
      {Array.from({length: pews}, (_, i) => {
        const v = i / Math.max(1, pews - 1);
        const py = -h * 0.02 + v * h * 0.0;
        const s = 1 + v * 0.24;
        return (
          <g key={i} transform={`translate(0 ${-h * (0.16 - v * 0.16)}) scale(${s} 1)`}>
            <path fill={wood.core} d={
              `M${-w * 0.36},0 L${-w * 0.36},${-h * 0.10}` +
              ` Q0,${-h * 0.12} ${w * 0.36},${-h * 0.10} L${w * 0.36},0 Z`} />
            <rect x={-w * 0.36} y={-h * 0.038} width={w * 0.72} height={h * 0.012}
              fill={wood.shade} />
          </g>
        );
      })}
      {country && (
        <>
          {/* the window unit high in the back wall, and a ceiling fan too slow to help */}
          <rect x={-w * 0.05} y={-h * 0.94} width={w * 0.10} height={h * 0.07}
            fill="#B0B4B0" stroke={INK} strokeWidth={h * 0.005} />
          <g transform={`translate(0 ${-h * 0.98}) rotate(${(frame * 1.1) % 360})`}>
            {Array.from({length: 5}, (_, i) => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <ellipse key={i} cx={Math.cos(a) * w * 0.05} cy={Math.sin(a) * h * 0.012}
                  rx={w * 0.035} ry={h * 0.008} fill="#8A6440" />
              );
            })}
          </g>
        </>
      )}
      {/* the ushers, at the aisle ends, in WHITE GLOVES */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * w * 0.42} ${-h * 0.02})`}>
          <rect x={-w * 0.014} y={-h * 0.17} width={w * 0.028} height={h * 0.17}
            fill="#F0ECE4" />
          <circle cx={0} cy={-h * 0.19} r={w * 0.014} fill="#7A5232" />
          <circle cx={s * w * 0.018} cy={-h * 0.11} r={w * 0.010} fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
};

/**
 * THE TRAIL RIDE. The most cinematic thing in this whole brief.
 *
 * IT IS NOT A REENACTMENT. The Prairie View Trail Ride Association was founded in
 * 1957 by James Francis and Myrtis Dightman Sr. and made its first ride in 1958
 * with two wagons and twenty riders, covering about 88 miles from Hempstead to
 * Houston. It started during segregation, and accounts of the early rides describe
 * the first Black riders needing an armed escort to enter Memorial Park at the end.
 * So the ride is a claim on public road and public space, made annually, on
 * horseback.
 *
 * THE WAGONS ARE WHERE OUTSIDERS GO WRONG. Some are bowed canvas. A great many are
 * PICKUP-DRAWN FLATBED TRAILERS, heavily customised, with a built body, a roof,
 * rails, club lettering down the side, and LARGE BOX SPEAKERS at the back. The
 * loudness is on purpose and it is current, not a period detail.
 *
 * The column is the composition: half a mile or more, riders two and three abreast,
 * wagons interspersed, a support caravan alongside. And the arrival in Houston with
 * downtown behind them is the political point in one frame.
 */
export const TrailRideColumn: React.FC<BlackTxProps & {
  h?: number; span?: number; riders?: number; wagons?: number; dust?: boolean;
  speakers?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 145, wear = 0.35, facing = 1,
       h = 130, span = 1000, riders = 9, wagons = 2, dust = true, speakers = true,
       frame = 0}) => {
  const L = useLight();
  const K = fit('trailRider', h);
  const COAT = ['#6A4028', '#3A2A1E', '#B49A70', '#8A6A48', '#9A9490', '#5A4838'];
  const CLUB = ['#C4302C', '#2A5AA8', '#E8B824', '#3F8A4A', '#7A3A8A'];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {dust && Array.from({length: 16}, (_, i) => (
        <ellipse key={i} cx={(rnd(seed, i) - 0.5) * span}
          cy={-h * K * (0.05 + rnd(seed, 20 + i) * 0.30)}
          rx={h * K * (0.30 + rnd(seed, 40 + i) * 0.5)}
          ry={h * K * (0.12 + rnd(seed, 60 + i) * 0.18)}
          fill="#CFC0A0" opacity={0.12 + rnd(seed, 80 + i) * 0.14} />
      ))}
      {Array.from({length: riders + wagons}, (_, i) => {
        const f = i / (riders + wagons - 1);
        const px = (f - 0.5) * span;
        // the column recedes, so scale falls and the far end is small
        const s = K * (1 - Math.abs(f - 0.2) * 0.34);
        const isWagon = i % Math.ceil((riders + wagons) / wagons) === 3;
        const gait = Math.sin(frame / 6 + i) * h * 0.012;

        if (isWagon) {
          return (
            <g key={i} transform={`translate(${px} ${gait}) scale(${s * facing} ${s})`}>
              {/* THE FLATBED, not a covered wagon */}
              <rect x={-h * 1.5} y={-h * 0.34} width={h * 3.0} height={h * 0.10}
                fill="#3A342E" />
              {[-1.1, -0.6, 0.7, 1.2].map((wf, k) => (
                <circle key={k} cx={h * wf} cy={-h * 0.16} r={h * 0.17} fill="#26241F" />
              ))}
              <rect x={-h * 1.4} y={-h * 1.20} width={h * 2.8} height={h * 0.86}
                fill={CLUB[i % CLUB.length]} />
              {/* the club lettering down the side, as blocks */}
              {Array.from({length: 5}, (_, k) => (
                <rect key={k} x={-h * 1.1 + k * h * 0.46} y={-h * 0.92}
                  width={h * 0.32} height={h * 0.22} fill="#F0ECE0" opacity={0.9} />
              ))}
              <rect x={-h * 1.5} y={-h * 1.36} width={h * 3.0} height={h * 0.16}
                fill="#4A423A" />
              {speakers && [-1, 1].map((sd) => (
                <g key={sd}>
                  <rect x={sd * h * 1.05 - h * 0.20} y={-h * 1.14} width={h * 0.40}
                    height={h * 0.62} fill="#26241F" />
                  <circle cx={sd * h * 1.05} cy={-h * 0.90} r={h * 0.14} fill="#4A4640" />
                  <circle cx={sd * h * 1.05} cy={-h * 0.66} r={h * 0.08} fill="#4A4640" />
                </g>
              ))}
              {/* people ON the flatbed, because that is where the party is */}
              {Array.from({length: 3}, (_, k) => (
                <g key={k} transform={`translate(${(k - 1) * h * 0.6} ${-h * 1.36})`}>
                  <rect x={-h * 0.09} y={-h * 0.50} width={h * 0.18} height={h * 0.50}
                    fill={['#C4302C', '#2A5AA8', '#E8E4D8'][k]} />
                  <circle cx={0} cy={-h * 0.56} r={h * 0.09} fill="#7A5232" />
                </g>
              ))}
            </g>
          );
        }
        return (
          <g key={i} transform={`translate(${px} ${gait}) scale(${s * facing} ${s})`}>
            {/* the horse */}
            <path fill={COAT[i % COAT.length]} d={
              `M${-h * 0.62},${-h * 0.54} L${h * 0.44},${-h * 0.58}` +
              ` Q${h * 0.60},${-h * 0.54} ${h * 0.56},${-h * 0.34}` +
              ` L${h * 0.50},${-h * 0.10} L${h * 0.36},${-h * 0.10} L${h * 0.38},${-h * 0.32}` +
              ` L${-h * 0.42},${-h * 0.30} L${-h * 0.44},${-h * 0.08} L${-h * 0.58},${-h * 0.08}` +
              ` Q${-h * 0.70},${-h * 0.32} ${-h * 0.62},${-h * 0.54} Z`} />
            <path fill={COAT[i % COAT.length]} d={
              `M${h * 0.44},${-h * 0.56} L${h * 0.70},${-h * 0.78}` +
              ` Q${h * 0.80},${-h * 0.86} ${h * 0.84},${-h * 0.70}` +
              ` L${h * 0.80},${-h * 0.50} L${h * 0.66},${-h * 0.46} Z`} />
            {/* THE RIDER: working western dress, and a club shirt or jacket */}
            <g transform={`translate(${-h * 0.06} ${-h * 0.58})`}>
              <rect x={-h * 0.11} y={-h * 0.40} width={h * 0.22} height={h * 0.44}
                fill={CLUB[(i + 2) % CLUB.length]} />
              <circle cx={0} cy={-h * 0.46} r={h * 0.085} fill="#7A5232" />
              {/* straw in warm months, felt in winter. The brim is the read. */}
              <ellipse cx={0} cy={-h * 0.51} rx={h * 0.20} ry={h * 0.035}
                fill={i % 3 ? '#D8C088' : '#2A2420'} />
              <path fill={i % 3 ? '#D8C088' : '#2A2420'} d={
                `M${-h * 0.085},${-h * 0.52} L${-h * 0.075},${-h * 0.64}` +
                ` L${h * 0.075},${-h * 0.64} L${h * 0.085},${-h * 0.52} Z`} />
              {/* the crease down the crown, which every real hat has */}
              <line x1={0} y1={-h * 0.635} x2={0} y2={-h * 0.535} stroke={INK}
                strokeWidth={h * 0.010} opacity={0.4} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

/**
 * THE BUCKING CHUTE, and the arena around it.
 *
 * The lineage is old and Texan. Bill Pickett, born in Travis County, invented
 * bulldogging and entered the National Cowboy Hall of Fame in 1971. The Negro
 * Cowboys Rodeo Association formed in 1947, weekend Black rodeos have run
 * continuously since the late 1940s, and the Bill Pickett Invitational, founded in
 * 1984, is the longest running touring Black rodeo. None of this is a revival.
 *
 * THE CHUTE IS STEEL PIPE PANELS with a HORIZONTAL SLIDING gate, and the announcer
 * stand is raised over it. The arena dirt goes to a dust haze in the light beams,
 * and in an indoor arena the overhead lights make hard pools with airborne dust in
 * them, which is the signature look and the reason to draw this at all.
 *
 * Chaps are often loud on purpose, fringed, in turquoise, magenta, gold and white,
 * and they are one of the few places saturated colour belongs in a rodeo frame.
 */
export const BuckingChute: React.FC<BlackTxProps & {
  h?: number; gates?: number; announcer?: boolean; dust?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 146, wear = 0.4, facing = 1, night = true,
       h = 150, gates = 4, announcer = true, dust = 0.5, frame = 0}) => {
  const L = useLight();
  const K = fit('rodeoChute', h);
  const pipe = tones('#9AA0A2', L);
  const paint = tones('#A8302C', L);
  const w = h * 0.9;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {Array.from({length: gates}, (_, i) => {
        const gx = (i - (gates - 1) / 2) * w;
        return (
          <g key={i} transform={`translate(${gx} 0)`}>
            {/* the vertical pipe posts, and the horizontal rails between them */}
            {[-1, 1].map((s) => (
              <rect key={s} x={s * w * 0.46 - h * 0.020} y={-h} width={h * 0.040}
                height={h} fill={i % 2 ? pipe.core : paint.core} />
            ))}
            {Array.from({length: 5}, (_, r) => (
              <rect key={r} x={-w * 0.46} y={-h * (0.16 + r * 0.20)} width={w * 0.92}
                height={h * 0.030} fill={i % 2 ? pipe.base : paint.base} />
            ))}
            {/* the number plate over each chute */}
            <rect x={-h * 0.09} y={-h * 1.14} width={h * 0.18} height={h * 0.14}
              fill="#F0ECE0" stroke={INK} strokeWidth={h * 0.008} />
            <rect x={-h * 0.04} y={-h * 1.10} width={h * 0.08} height={h * 0.07}
              fill="#2A2A32" />
          </g>
        );
      })}
      {announcer && (
        <g transform={`translate(0 ${-h * 1.14})`}>
          <rect x={-w * 1.1} y={-h * 0.06} width={w * 2.2} height={h * 0.06}
            fill={pipe.shade} />
          <rect x={-w * 0.7} y={-h * 0.52} width={w * 1.4} height={h * 0.46}
            fill="#6A6058" />
          <rect x={-w * 0.62} y={-h * 0.44} width={w * 1.24} height={h * 0.22}
            fill={night ? '#F0DFA8' : '#39424c'} />
        </g>
      )}
      {night && (
        <>
          {/* HARD POOLS of overhead light with the dust visible in them */}
          {Array.from({length: 3}, (_, i) => (
            <path key={i} fill="#FFF6DC" opacity={0.09}
              d={`M${(i - 1) * w * 1.4},${-h * 2.0} l${-w * 0.9},${h * 2.0}` +
                 ` l${w * 1.8},0 Z`} />
          ))}
          {Array.from({length: Math.round(40 * dust)}, (_, i) => {
            const p = ((frame / 30) * 0.1 + rnd(seed, i)) % 1;
            return (
              <circle key={i} cx={(rnd(seed, 100 + i) - 0.5) * w * 4}
                cy={-p * h * 1.8} r={h * 0.004} fill="#F0E6CC"
                opacity={(1 - p) * 0.5} />
            );
          })}
        </>
      )}
      {wear > 0.3 && <CalicheDust x={-w * 2} y={-h * 0.30} w={w * 4} h={h * 0.30}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE FROTTOIR, and the fact that makes it a Texas object.
 *
 * The washboard VEST was invented in Texas. Clifton Chenier designed the first one
 * with his brother Cleveland, and it turned a hand-held kitchen board into a
 * wearable instrument so the player could stand up and move. Southeast Texas is
 * where modern zydeco was formed, by Creole families who came to Houston, Beaumont
 * and Port Arthur for work, especially after the 1927 Mississippi flood.
 *
 * DO NOT DRAW A LAUNDRY WASHBOARD IN A WOOD FRAME. That is the older la la
 * instrument and a different era.
 *
 * The corrugation pitch is roughly half an inch, so at distance it reads as a fine
 * horizontal ribbed panel catching a HARD SPECULAR HIGHLIGHT, and that highlight
 * moving is what animates the player. It is usually the brightest object on a dark
 * stage, which is a gift compositionally: run the whole scene warm and let the metal
 * be the cold accent.
 *
 * It is played with BOTTLE OPENERS, one per hand, in a fast down and up scrub.
 */
export const Frottoir: React.FC<BlackTxProps & {
  h?: number; played?: boolean; worn?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 147, wear = 0.4, facing = 1,
       h = 90, played = true, worn = true, frame = 0}) => {
  const L = useLight();
  const K = fit('rubboard', h);
  const zinc = tones('#C4CACE', L);
  const w = h * 0.66;
  const scrub = Math.sin(frame / 2.2) * h * 0.10;
  // the specular streak travelling across the ribs is what makes it read as metal
  const glint = ((frame / 12) % 1) * w - w * 0.5;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THE SHOULDER HOOKS. This is a vest and it hangs flat against the chest. */}
      {[-1, 1].map((s) => (
        <path key={s} fill="none" stroke={zinc.core} strokeWidth={h * 0.05}
          strokeLinecap="round"
          d={`M${s * w * 0.34},${-h * 0.94} q${s * h * 0.10},${-h * 0.16} ${-s * h * 0.06},${-h * 0.22}`} />
      ))}
      <rect x={-w / 2} y={-h * 0.96} width={w} height={h * 0.96} fill={zinc.core} />
      {/* the corrugation, running HORIZONTAL, at about a half inch pitch */}
      {Array.from({length: 22}, (_, i) => (
        <g key={i}>
          <rect x={-w / 2} y={-h * 0.94 + i * h * 0.042} width={w} height={h * 0.018}
            fill={zinc.base} />
          <rect x={-w / 2} y={-h * 0.928 + i * h * 0.042} width={w} height={h * 0.008}
            fill="#F0F4F6" opacity={0.7} />
        </g>
      ))}
      {/* the rolled or bound bottom edge, and the free hang that lets it resonate */}
      <rect x={-w / 2} y={-h * 0.06} width={w} height={h * 0.06} fill={zinc.shade} />
      {/* THE GLINT. A hard specular streak travelling across the ribs. */}
      <rect x={glint - w * 0.06} y={-h * 0.96} width={w * 0.12} height={h * 0.90}
        fill="#FFFFFF" opacity={0.35} />
      {played && (
        <g>
          {[-1, 1].map((s) => (
            <g key={s} transform={`translate(${s * w * 0.22} ${-h * 0.50 + s * scrub})`}>
              {/* the bottle opener, one per hand */}
              <rect x={-h * 0.020} y={-h * 0.10} width={h * 0.040} height={h * 0.22}
                rx={h * 0.012} fill="#B8BCC0" />
              <circle cx={0} cy={-h * 0.13} r={h * 0.034} fill="none" stroke="#B8BCC0"
                strokeWidth={h * 0.014} />
              {/* the hand */}
              <ellipse cx={0} cy={h * 0.14} rx={h * 0.055} ry={h * 0.045}
                fill="#7A5232" />
            </g>
          ))}
        </g>
      )}
      {worn && wear > 0.3 && (
        Array.from({length: 5}, (_, i) => (
          <rect key={i} x={(rnd(seed, i) - 0.5) * w * 0.7} y={-h * (0.2 + rnd(seed, 20 + i) * 0.6)}
            width={w * 0.12} height={h * 0.03} fill="#8A9094" opacity={wear * 0.5} />
        ))
      )}
    </g>
  );
};

/**
 * THE SHOTGUN HOUSE, and the brick street in front of it.
 *
 * The form came from West Africa by way of Haiti and New Orleans, so the house
 * itself is a record of a route. In Houston's Fourth Ward, Freedmen's Town,
 * formerly enslaved people arriving after 1865 built the houses and the churches and
 * then LAID THE BRICK STREETS THEMSELVES, paying out of pocket, because the city
 * would not. Those bricks are still there and have been fought over in court.
 *
 * A BRICK IN THAT STREET IS NOT PAVING. IT IS A RECEIPT. So `bricks` draws the road
 * surface as the subject, worn CONVEX on top so it reads as a fine mottled texture
 * rather than a flat plane, in a range of oranges and red-browns because the bricks
 * came from several makers.
 *
 * THE HOUSE: twelve to twenty four feet wide, gable FACING THE STREET, front and
 * rear doors ALIGNED, which is the defining feature and the reason for the name.
 * Raised on piers. A shallow porch, three or four steps, two slender posts.
 *
 * `row` is the strongest composition the form offers: identical gables stepping
 * down a block, which is one of the most rhythmically useful shapes in this whole
 * library.
 */
export const ShotgunHouse: React.FC<BlackTxProps & {
  h?: number; row?: number; camelback?: boolean; bricks?: boolean; colour?: string;
}> = ({x = 0, y = 0, scale = 1, seed = 148, wear = 0.4, facing = 1, night = false,
       h = 150, row = 1, camelback = false, bricks = true, colour = '#EDE8DA'}) => {
  const L = useLight();
  const K = fit('shotgunHouse', h);
  const PAINT = ['#EDE8DA', '#EFE2B4', '#CBE0D2', '#CEDCE8', '#E8D8CC'];
  const roof = tones('#8A7A68', L);
  const w = h * 0.44;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {bricks && (
        <g>
          {/* the street the residents laid, drawn as the subject it is */}
          <rect x={-w * (row + 1)} y={h * 0.06} width={w * (row * 2 + 2)} height={h * 0.34}
            fill="#A8664A" />
          {Array.from({length: 200}, (_, i) => {
            const bx = (rnd(seed, i) - 0.5) * w * (row * 2 + 2);
            const by = h * (0.08 + rnd(seed, 500 + i) * 0.30);
            const hue = ['#B87050', '#A05C3E', '#C48058', '#94523A', '#B06848'];
            return (
              <rect key={i} x={bx} y={by} width={w * 0.05} height={h * 0.020}
                rx={h * 0.006} fill={hue[i % hue.length]}
                transform={`rotate(${(i % 2) * 90} ${bx} ${by})`} />
            );
          })}
        </g>
      )}
      {Array.from({length: row}, (_, i) => {
        const ox = (i - (row - 1) / 2) * w * 1.24;
        const paint = tones(row > 1 ? PAINT[i % PAINT.length] : colour, L);
        const lift = h * 0.09;
        const step = i * h * 0.02;   // stepping down the block
        return (
          <g key={i} transform={`translate(${ox} ${step})`}>
            <rect x={-w / 2} y={-lift} width={w} height={lift} fill="#1E2228" />
            {[-0.38, 0, 0.38].map((f, k) => (
              <rect key={k} x={f * w - h * 0.018} y={-lift} width={h * 0.036}
                height={lift} fill="#8A8478" />
            ))}
            <rect x={-w / 2} y={-lift - h * 0.56} width={w} height={h * 0.56}
              fill={paint.core} />
            <rect x={-w / 2} y={-lift - h * 0.56} width={w} height={h * 0.56}
              fill={matFill('planks')} opacity={0.45} />
            {/* THE GABLE FACES THE STREET. That is the whole silhouette. */}
            <path fill={roof.core} d={
              `M${-w * 0.58},${-lift - h * 0.56} L0,${-lift - h * 0.92}` +
              ` L${w * 0.58},${-lift - h * 0.56} Z`} />
            {camelback && (
              /* the second storey at the REAR only, so the profile steps up behind */
              <g>
                <rect x={w * 0.30} y={-lift - h * 1.20} width={w * 0.44} height={h * 0.64}
                  fill={paint.base} />
                <path fill={roof.base} d={
                  `M${w * 0.26},${-lift - h * 1.20} L${w * 0.52},${-lift - h * 1.44}` +
                  ` L${w * 0.78},${-lift - h * 1.20} Z`} />
              </g>
            )}
            {/* the shallow porch on two slender posts */}
            <path fill={roof.base} d={
              `M${-w * 0.54},${-lift - h * 0.40} L${w * 0.54},${-lift - h * 0.40}` +
              ` L${w * 0.50},${-lift - h * 0.34} L${-w * 0.50},${-lift - h * 0.34} Z`} />
            {[-1, 1].map((s) => (
              <rect key={s} x={s * w * 0.44 - h * 0.010} y={-lift - h * 0.38}
                width={h * 0.020} height={h * 0.38} fill={paint.base} />
            ))}
            {/* the door, and one or two tall narrow two-over-two windows */}
            <rect x={-w * 0.24} y={-lift - h * 0.34} width={w * 0.16} height={h * 0.34}
              fill={night ? '#F2DFA8' : '#5A4632'} />
            <rect x={w * 0.02} y={-lift - h * 0.32} width={w * 0.15} height={h * 0.24}
              fill={night ? '#F2DFA8' : '#3E4A54'} />
            <line x1={w * 0.02} y1={-lift - h * 0.20} x2={w * 0.17} y2={-lift - h * 0.20}
              stroke={paint.shade} strokeWidth={h * 0.008} />
            {/* the three or four steps */}
            {Array.from({length: 3}, (_, k) => (
              <rect key={k} x={-w * 0.22} y={-lift * (0.30 + k * 0.30)} width={w * 0.18}
                height={lift * 0.30} fill="#A89A80" />
            ))}
            {/* the restrained sawn bracket in the gable, if there is any ornament */}
            {rnd(seed, 40 + i) > 0.5 && (
              <path fill={paint.base} d={
                `M${-w * 0.18},${-lift - h * 0.62} q${w * 0.18},${-h * 0.06} ${w * 0.36},0` +
                ` l0,${h * 0.03} q${-w * 0.18},${-h * 0.03} ${-w * 0.36},0 Z`} />
            )}
            {wear > 0.3 && <CalicheDust x={-w / 2} y={-lift - h * 0.14} w={w}
              h={h * 0.14} opacity={wear * 0.35} />}
          </g>
        );
      })}
    </g>
  );
};

/**
 * THE MARCHING BAND, HBCU style, and it is a distinct discipline rather than a
 * college band with different uniforms.
 *
 * `hometown.tsx` draws the high school drill block. This draws the thing high school
 * bands in Texas are aiming at, and the difference is in the BODY.
 *
 * THE HIGH KNEE is the identification and it is the fastest way to signal the
 * tradition: the thigh lifts to HORIZONTAL with the toe pointed DOWN, which is a
 * completely different leg line from a corps-style band. Horns snap to a hard angle
 * and the whole rank hits it on the same instant.
 *
 * The drum major is out front and is the show, with a high strut and a DEEP BACK
 * BEND, plume nearly touching the turf.
 *
 * Prairie View's Marching Storm is roughly 300 people in purple and gold with the
 * Black Foxes dance line. Texas Southern's Ocean of Soul, in Houston, dates to 1969
 * under Benjamin J. Butler II and wears maroon and grey. Get the colours right or do
 * not name them, which is why this component takes them as a prop and names nobody.
 *
 * The sousaphone bells are the biggest circles in the frame and the best
 * compositional anchor available.
 */
export const HBCUBand: React.FC<BlackTxProps & {
  h?: number; ranks?: number; files?: number; spread?: number;
  colours?: [string, string]; drumMajor?: boolean; danceLine?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 149, night = true, h = 90,
       ranks = 4, files = 10, spread = 620, colours = ['#4A2A7A', '#D8B03C'],
       drumMajor = true, danceLine = 5, frame = 0}) => {
  const L = useLight();
  // Fitted on the PERSON, whose sole-to-crown run is h * 1.09 in this local frame.
  const K = fit('bandMember', h * 1.09);
  const [uni, braid] = colours;
  const u = tones(uni, L);
  const brass = '#D8A83C';

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {drumMajor && (
        <g transform={`translate(0 ${h * 0.9}) scale(${K * 1.25})`}>
          {/* THE BACK BEND. Plume nearly to the turf, which is the pose everyone
              waits for. */}
          <path fill={u.core} d={
            `M${-h * 0.10},0 L${-h * 0.16},${-h * 0.60}` +
            ` Q${-h * 0.30},${-h * 0.94} ${-h * 0.70},${-h * 0.86}` +
            ` L${-h * 0.72},${-h * 0.70} Q${-h * 0.14},${-h * 0.80} ${h * 0.06},${-h * 0.56}` +
            ` L${h * 0.10},0 Z`} />
          <circle cx={-h * 0.76} cy={-h * 0.80} r={h * 0.12} fill="#7A5232" />
          <path fill={u.shade} d={
            `M${-h * 0.86},${-h * 0.86} L${-h * 0.94},${-h * 1.02} L${-h * 0.74},${-h * 1.08} L${-h * 0.68},${-h * 0.90} Z`} />
          {/* the plume, and it is long */}
          <rect x={-h * 1.10} y={-h * 1.14} width={h * 0.34} height={h * 0.09}
            rx={h * 0.04} fill={braid} transform={`rotate(-24 ${-h * 0.94} ${-h * 1.06})`} />
          <rect x={-h * 0.20} y={-h * 0.56} width={h * 0.34} height={h * 0.07}
            fill={braid} />
          {/* the mace, out and up */}
          <line x1={h * 0.06} y1={-h * 0.40} x2={h * 0.90} y2={-h * 0.90}
            stroke="#E0DCD0" strokeWidth={h * 0.05} />
          <circle cx={h * 0.90} cy={-h * 0.90} r={h * 0.10} fill={braid} />
        </g>
      )}
      {Array.from({length: ranks * files}, (_, i) => {
        const r = Math.floor(i / files), f = i % files;
        const fx = (f / (files - 1) - 0.5) * spread;
        const fy = -r * 62;
        const s = K * (1 - r * 0.05);
        const isSousa = r === ranks - 1 && f % 3 === 0;
        // THE HIGH KNEE: alternating, thigh to horizontal, toe DOWN
        const lift = Math.sin(frame / 5 + f * 0.4) > 0;
        return (
          <g key={i} transform={`translate(${fx} ${fy}) scale(${s})`}>
            {/* the legs, and the lifted one is the whole identification */}
            <rect x={-h * 0.09} y={-h * 0.42} width={h * 0.07} height={h * 0.42}
              fill={u.shade} />
            {lift ? (
              <g>
                <rect x={h * 0.02} y={-h * 0.46} width={h * 0.28} height={h * 0.07}
                  fill={u.shade} />
                <rect x={h * 0.24} y={-h * 0.46} width={h * 0.07} height={h * 0.30}
                  fill={u.shade} />
                {/* the toe POINTED DOWN */}
                <path fill="#1A1A1C" d={`M${h * 0.24},${-h * 0.18} l${h * 0.09},${h * 0.10} l${-h * 0.09},${h * 0.02} Z`} />
              </g>
            ) : (
              <rect x={h * 0.02} y={-h * 0.42} width={h * 0.07} height={h * 0.42}
                fill={u.shade} />
            )}
            {/* the military-cut jacket with HEAVY BRAID across the chest */}
            <rect x={-h * 0.13} y={-h * 0.92} width={h * 0.26} height={h * 0.50}
              fill={u.core} />
            {Array.from({length: 4}, (_, k) => (
              <rect key={k} x={-h * 0.13} y={-h * (0.86 - k * 0.09)} width={h * 0.26}
                height={h * 0.035} fill={braid} />
            ))}
            {/* the gauntlets */}
            <rect x={-h * 0.17} y={-h * 0.62} width={h * 0.07} height={h * 0.11}
              fill={braid} />
            <circle cx={0} cy={-h * 0.99} r={h * 0.10} fill="#7A5232" />
            <path fill={u.shade} d={
              `M${-h * 0.10},${-h * 1.06} L${-h * 0.12},${-h * 1.28} L${h * 0.12},${-h * 1.28} L${h * 0.10},${-h * 1.06} Z`} />
            <rect x={-h * 0.04} y={-h * 1.56} width={h * 0.08} height={h * 0.30}
              fill={braid} />
            {isSousa ? (
              <g>
                <circle cx={h * 0.04} cy={-h * 0.86} r={h * 0.40} fill="none"
                  stroke={brass} strokeWidth={h * 0.09} />
                {/* THE BELL IS SIZED FROM ITS OWN ENTRY. It was rx={h * 0.28}, a 0.56
                    local diameter, which measured 0.873 m against the 0.76 m the table
                    records for a sousaphone bell. The horn is the biggest circle in the
                    frame, so it is the one thing here worth getting right. */}
                <ellipse cx={h * 0.22} cy={-h * 1.26}
                  rx={sub('sousaphone', 'bandMember', h * 1.09) / 2}
                  ry={sub('sousaphone', 'bandMember', h * 1.09) * 0.23}
                  fill={brass} />
              </g>
            ) : (
              /* HORNS AT ONE ANGLE, and every one of them hits it at the same instant */
              <g transform={`rotate(-32 ${h * 0.10} ${-h * 0.78})`}>
                <rect x={h * 0.10} y={-h * 0.80} width={h * 0.30} height={h * 0.07}
                  fill={brass} />
                <path fill={brass} d={`M${h * 0.40},${-h * 0.84} l${h * 0.18},${-h * 0.07} l0,${h * 0.22} l${-h * 0.18},${-h * 0.07} Z`} />
              </g>
            )}
          </g>
        );
      })}
      {danceLine > 0 && Array.from({length: danceLine}, (_, i) => {
        const fx = ((i / Math.max(1, danceLine - 1)) - 0.5) * spread * 0.6;
        return (
          <g key={i} transform={`translate(${fx} ${h * 0.5}) scale(${K * 1.05})`}>
            {/* the dance line, and its costume is the SATURATION SPIKE in an
                otherwise disciplined field of two colours */}
            <rect x={-h * 0.10} y={-h * 0.70} width={h * 0.20} height={h * 0.34}
              fill={braid} />
            <rect x={-h * 0.07} y={-h * 0.36} width={h * 0.06} height={h * 0.36}
              fill="#7A5232" />
            <rect x={h * 0.02} y={-h * 0.36} width={h * 0.06} height={h * 0.36}
              fill="#7A5232" />
            <circle cx={0} cy={-h * 0.78} r={h * 0.09} fill="#7A5232" />
            {Array.from({length: 8}, (_, k) => (
              <circle key={k} cx={(rnd(seed, i * 8 + k) - 0.5) * h * 0.18}
                cy={-h * (0.42 + rnd(seed, 40 + i * 8 + k) * 0.26)} r={h * 0.018}
                fill="#F0ECE0" opacity={0.9} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/**
 * THE EMANCIPATION PAVILION AND RACE TRACK. Ten acres bought in 1872 by formerly
 * enslaved people in Houston's Third Ward, so there would be a place to hold
 * Juneteenth. It is the oldest park in Houston and in Texas.
 *
 * IT EXISTS BECAUSE THEY WERE NOT ALLOWED IN THE CITY PARKS, so they pooled about a
 * thousand dollars and bought their own. A park you had to buy in order to be
 * allowed to gather is a different object from a park a city gave you.
 *
 * THE EARLIEST PLAN IS VERY SIMPLE AND VERY STRONG TO DRAW: open ground with a race
 * track running the perimeter and an open air pavilion in the CENTRE. A ring and a
 * dot. That is the 1870s version and it is the one worth having, because the
 * geometry itself carries the argument.
 *
 * `era` moves it forward: the late 1930s added a recreation building, a rectangular
 * pool and a bathhouse, so the mid-century version is a low brick building, a pool
 * with a chain link fence and a concrete apron, and mature shade.
 */
export const EmancipationPark: React.FC<BlackTxProps & {
  h?: number; w?: number; era?: 1870 | 1940; crowd?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 150, wear = 0.3, night = false,
       h = 120, w = 900, era = 1870, crowd = 0.6}) => {
  const L = useLight();
  const K = fit('emancipationPavilion', h);
  const ground = tones('#8A9A62', L);
  const wood = tones('#B49A72', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* worn St Augustine and bare packed dirt under the trees, patchwork not lawn */}
      <ellipse cx={0} cy={0} rx={w * 0.56} ry={h * 1.1} fill={ground.core} />
      {Array.from({length: 14}, (_, i) => (
        <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.9}
          cy={(rnd(seed, 20 + i) - 0.5) * h * 1.6}
          rx={w * (0.04 + rnd(seed, 40 + i) * 0.06)} ry={h * 0.10}
          fill="#A89A78" opacity={0.5} />
      ))}
      {era === 1870 ? (
        <g>
          {/* THE RING AND THE DOT. The whole argument in a plan. */}
          <ellipse cx={0} cy={0} rx={w * 0.48} ry={h * 0.92} fill="none"
            stroke="#A08A64" strokeWidth={h * 0.10} />
          <ellipse cx={0} cy={0} rx={w * 0.48} ry={h * 0.92} fill="none"
            stroke="#8A7450" strokeWidth={h * 0.012} opacity={0.6} />
          <g transform={`translate(0 ${h * 0.1}) scale(${K})`}>
            {/* the open air pavilion: posts, a hip roof, no walls */}
            {Array.from({length: 6}, (_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <rect key={i} x={Math.cos(a) * h * 0.9 - h * 0.030} y={-h * 0.62}
                  width={h * 0.060} height={h * 0.62} fill={wood.core} />
              );
            })}
            <path fill={wood.shade} d={
              `M${-h * 1.14},${-h * 0.62} L0,${-h * 1.0} L${h * 1.14},${-h * 0.62} Z`} />
            <ellipse cx={0} cy={-h * 0.62} rx={h * 1.02} ry={h * 0.16}
              fill={wood.base} />
          </g>
          {/* wagons and horses at the edge */}
          {Array.from({length: 4}, (_, i) => (
            <g key={i} transform={`translate(${(i - 1.5) * w * 0.22} ${h * 0.94})`}>
              <rect x={-h * 0.26} y={-h * 0.22} width={h * 0.52} height={h * 0.14}
                fill="#8A7450" />
              <circle cx={-h * 0.18} cy={-h * 0.06} r={h * 0.08} fill="#4A3828" />
              <circle cx={h * 0.18} cy={-h * 0.06} r={h * 0.08} fill="#4A3828" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {/* the 1930s layer: recreation building, pool, bathhouse, chain link */}
          <rect x={-w * 0.34} y={-h * 0.70} width={w * 0.34} height={h * 0.60}
            fill="#B87A5A" />
          <rect x={-w * 0.34} y={-h * 0.70} width={w * 0.34} height={h * 0.60}
            fill={matFill('granite')} opacity={0.45} />
          <rect x={-w * 0.36} y={-h * 0.76} width={w * 0.38} height={h * 0.08}
            fill="#A06A4A" />
          <rect x={w * 0.04} y={-h * 0.16} width={w * 0.36} height={h * 0.44}
            fill="#B8B2A4" />
          <rect x={w * 0.07} y={-h * 0.10} width={w * 0.30} height={h * 0.32}
            fill="#6ABAD0" />
          {Array.from({length: 18}, (_, i) => (
            <line key={i} x1={w * (0.02 + i * 0.023)} y1={-h * 0.20}
              x2={w * (0.02 + i * 0.023)} y2={-h * 0.02} stroke="#B0B6BA"
              strokeWidth={h * 0.008} opacity={0.6} />
          ))}
        </g>
      )}
      {/* the live oaks and water oaks that give the heavy dark canopy */}
      {Array.from({length: 5}, (_, i) => {
        const tx = (i - 2) * w * 0.24 + (rnd(seed, 60 + i) - 0.5) * w * 0.08;
        return (
          <g key={i} transform={`translate(${tx} ${-h * 1.0})`}>
            <rect x={-h * 0.05} y={0} width={h * 0.10} height={h * 0.44} fill="#5A4433" />
            <ellipse cx={0} cy={-h * 0.20} rx={h * 0.66} ry={h * 0.40} fill="#3E5A3A" />
            <ellipse cx={-h * 0.24} cy={-h * 0.32} rx={h * 0.42} ry={h * 0.28}
              fill="#4E6A46" />
          </g>
        );
      })}
      {crowd > 0 && Array.from({length: Math.round(50 * crowd)}, (_, i) => {
        const cx = (rnd(seed, 200 + i) - 0.5) * w * 0.8;
        const cy = (rnd(seed, 300 + i) - 0.5) * h * 1.4;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${0.7 + (cy + h) / (h * 3)})`}>
            <rect x={-h * 0.020} y={-h * 0.14} width={h * 0.040} height={h * 0.14}
              fill={['#E8E4D8', '#3A4A6A', '#8A3A3A', '#D8C088', '#4A6A4A'][i % 5]} />
            <circle cx={0} cy={-h * 0.16} r={h * 0.020} fill="#7A5232" />
          </g>
        );
      })}
    </g>
  );
};

/** THE RED DRINK, and it is a meaning rather than a theme colour.
 *
 *  Red at a Juneteenth carries West African symbolic use of red and predates the
 *  Waco soda by generations, so hibiscus and kola derived drinks read deeper and
 *  more crimson while the bottled cream soda is a hot pink-red with a purple lean.
 *  Both are correct, and `kind` picks.
 *
 *  It stains a white shirt and a tongue, and a red tongue at a birthday party is
 *  the memory. It should GLOW when backlit, which is why it is drawn with a
 *  translucent core rather than a flat fill. */
export const RedDrink: React.FC<BlackTxProps & {
  h?: number; kind?: 'bottle' | 'cup' | 'pitcher'; ice?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 151, h = 60, kind = 'bottle', ice = true}) => {
  const uid = useUid('rd');
  const w = h * 0.34;

  return (
    <g transform={`translate(${x} ${y}) scale(${fit('redDrink', h) * scale})`}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8A1428" />
          <stop offset="34%" stopColor="#E01840" />
          <stop offset="60%" stopColor="#F04868" />
          <stop offset="100%" stopColor="#A01830" />
        </linearGradient>
      </defs>
      {kind === 'bottle' && (
        <g>
          {/* the contour bottle: a slight waist and a shoulder taper */}
          <path fill={`url(#${uid}g)`} d={
            `M${-w * 0.5},0 L${-w * 0.5},${-h * 0.52}` +
            ` Q${-w * 0.44},${-h * 0.62} ${-w * 0.46},${-h * 0.70}` +
            ` Q${-w * 0.48},${-h * 0.82} ${-w * 0.26},${-h * 0.88}` +
            ` L${-w * 0.24},${-h * 0.98} L${w * 0.24},${-h * 0.98}` +
            ` L${w * 0.26},${-h * 0.88} Q${w * 0.48},${-h * 0.82} ${w * 0.46},${-h * 0.70}` +
            ` Q${w * 0.44},${-h * 0.62} ${w * 0.5},${-h * 0.52} L${w * 0.5},0 Z`} />
          <rect x={-w * 0.28} y={-h * 1.02} width={w * 0.56} height={h * 0.06}
            fill="#C8CCD0" />
          {/* the label band across the middle third */}
          <rect x={-w * 0.5} y={-h * 0.46} width={w} height={h * 0.26} fill="#F0ECE4" />
          <rect x={-w * 0.42} y={-h * 0.40} width={w * 0.84} height={h * 0.09}
            fill="#C4202C" />
          <path fill="#FFFFFF" opacity={0.28} d={
            `M${-w * 0.36},${-h * 0.10} L${-w * 0.30},${-h * 0.86} L${-w * 0.20},${-h * 0.86} L${-w * 0.26},${-h * 0.10} Z`} />
        </g>
      )}
      {kind === 'cup' && (
        <g>
          <path fill="#F4F2EC" d={
            `M${-w * 0.44},0 L${-w * 0.54},${-h * 0.92} L${w * 0.54},${-h * 0.92} L${w * 0.44},0 Z`} />
          <path fill={`url(#${uid}g)`} d={
            `M${-w * 0.46},${-h * 0.16} L${-w * 0.53},${-h * 0.86} L${w * 0.53},${-h * 0.86} L${w * 0.46},${-h * 0.16} Z`} />
          {ice && Array.from({length: 7}, (_, i) => (
            <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.8}
              cy={-h * (0.30 + rnd(seed, 20 + i) * 0.52)} rx={w * 0.10} ry={h * 0.05}
              fill="#F8C8D4" opacity={0.6} />
          ))}
          {/* the pellet ice at the top, which people have opinions about */}
          <ellipse cx={0} cy={-h * 0.86} rx={w * 0.53} ry={h * 0.05} fill="#F0D8DC" />
        </g>
      )}
      {kind === 'pitcher' && (
        <g>
          <path fill={`url(#${uid}g)`} d={
            `M${-w * 0.7},0 L${-w * 0.76},${-h * 0.88} L${w * 0.66},${-h * 0.88} L${w * 0.6},0 Z`} />
          <path fill="none" stroke="#E8E4D8" strokeWidth={h * 0.05}
            d={`M${w * 0.64},${-h * 0.70} q${w * 0.34},${h * 0.10} ${-w * 0.02},${h * 0.40}`} />
          <path fill="#F0ECE4" opacity={0.5} d={
            `M${-w * 0.76},${-h * 0.88} L${w * 0.66},${-h * 0.88} L${w * 0.62},${-h * 0.80} L${-w * 0.72},${-h * 0.80} Z`} />
        </g>
      )}
    </g>
  );
};
