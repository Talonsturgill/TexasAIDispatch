import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK, RustStreak, CalicheDust} from './lighting';
import {matFill} from './materials';
import {fitter, subber, rnd} from './scale';

// =============================================================================
// TEJANO — Mexican-American and border Texas, drawn with the same care as the cast.
//
// THE FIRST THING TO GET RIGHT IS THE TIMELINE. Spain made hundreds of land grants
// to ranching families along the lower Rio Grande in the late 1700s and early 1800s,
// with 363 Spanish and Mexican grants in South Texas alone, and the earliest settlers
// arrived in the 1730s. Drawing a Tejano family as newcomers is like drawing a Boston
// family as newcomers to Massachusetts. The border crossed them.
//
// WHAT THIS MODULE REFUSES TO DRAW, AND WHY
//
// The sombrero and the serape are the two garments almost nobody in Mexican-American
// Texas wears and the two an outsider reaches for first. The sleeping figure under a
// hat against a cactus is worse and has been named as a slur by Chicano writers for
// fifty years. None of that is here.
//
// Southwest restaurant graphics are not this community's visual language either.
// Chile pepper string lights, a howling coyote, a stepped Aztec fret used as a
// border, terracotta and turquoise. That is 1980s American restaurant branding and
// Santa Fe tourist design.
//
// LOTERIA AND DAY OF THE DEAD ICONOGRAPHY ARE NOT IN THIS MODULE, and that is a
// standing rule in this repo rather than a judgement made here. `knowledge/texas/
// CULTURE.md` and the repo CLAUDE.md both name them. The research for this wave came
// back arguing that both are real living family practice rather than borrowed
// imagery, which is true and which does not change the rule: a standing cultural
// policy is not something a single research brief gets to relax. If it ever changes
// it changes in that doc first, with the owner, and this module follows.
//
// Talavera tile GEOMETRY as a pattern system is explicitly fine and is used here.
//
// THE PALETTE CORRECTION THAT MATTERS MOST. The stock border palette is sepia, dust,
// barbed wire and a bleached wash. Real Mexican-American Texas is chromatically LOUD:
// the syrup rack, the concha crusts, the quinceanera dress, the candy paint, the
// tissue paper. If a frame needs heat, get it from LIGHT, a blown white in the aisle
// gap against a cool blue-green in the shade, never by draining the saturation.
//
// AND THE THROUGH LINE THE RESEARCH FOUND: hands doing skilled work. A hand rolling a
// tortilla, pinning a medal, on a switch box, on bronze. Every component here is
// built so a hand can be the subject of the shot.
// =============================================================================

export const TEJANO_M: Record<string, {h: number; note: string}> = {
  paleteroCart: {h: 1.0, note: 'the cart box at the lid, without the umbrella'},
  paleteroUmbrella: {h: 1.8, note: 'the canopy above the cart, at hand height plus'},
  panaderiaRack: {h: 1.9, note: 'an open bakery rack at the top shelf'},
  // MEASURED ACROSS, like the comal. A tray's thickness scales nothing, so the entry read
  // 0.02 and the drawing sized it as a fraction of however wide the rack was drawn. A tray
  // is a fixed real object and does not get wider when the rack does.
  charola: {h: 0.46, note: 'a bakery tray measured ACROSS, which is what sets the drawing'},
  raspaStand: {h: 3.0, note: 'a raspa shack at the awning'},
  accordion: {h: 0.42, note: 'a three row diatonic button accordion, bellows closed'},
  bajoSexto: {h: 1.05, note: 'a bajo sexto, body and neck, held upright'},
  lowrider: {h: 1.32, note: 'a big body on swangas at the roofline, dropped'},
  yardShrine: {h: 1.6, note: 'a front yard niche shrine at the top of the arch'},
  quinceCourt: {h: 1.62, note: 'a court member standing, which is the cast rig height'},
  mercadoStall: {h: 2.6, note: 'a market stall under a shared shed roof'},
  pinataStar: {h: 0.9, note: 'a seven point star piñata across the widest cone pair'},
  // MEASURED ACROSS, NOT THROUGH. A flat thing seen from anywhere but edge on is sized by
  // its DIAMETER, and its thickness scales nothing. The entry used to read 0.02, the height
  // of the disc off the burner, which no drawing can be fitted to. So Comal borrowed the
  // paletero CART's entry instead and rendered a 0.92 m tortilla, wider than the cook's
  // shoulders, under a sheet label reading 30 cm.
  comal: {h: 0.3, note: 'a comal measured ACROSS, which is the dimension that sets the drawing'},
  raspaCup: {h: 0.2, note: 'a tall styrofoam raspa cup at the rim, before the dome of ice on top'},
  photoWall: {h: 2.2, note: 'a grandmother s photograph wall, floor to the top frame'},
  rotulo: {h: 4.0, note: 'a corner store at the parapet'},
  colonia: {h: 3.4, note: 'a self built house at the eave'},
  pedestrianBridge: {h: 3.4, note: 'the caged walkway at the top of the mesh'},
  escaramuza: {h: 1.6, note: 'a rider on a horse at the rider s shoulder'},
};

const fit = fitter(TEJANO_M);
const sub = subber(TEJANO_M);

export interface TejanoProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
  night?: boolean;
  frame?: number;
}

/**
 * THE PALETERO'S CART. It is the sound before the object: four copper bells a street
 * over means a kid has about ninety seconds to find a dollar.
 *
 * THE SILHOUETTE TELL IS THE WHEELS, and they are ASYMMETRIC. Two large spoked
 * bicycle-style wheels at the back corners and one small swivel caster under the
 * front, so the cart sits NOSE DOWN slightly. Drawing four matched wheels makes it a
 * catering trolley.
 *
 * The flavours are the colour budget and they are specific: fresa deep red with seeds
 * visible, mango saturated orange, sandia pink flesh with a thin green rind stripe and
 * black seeds, coco bone white with flecks, limon pale acid green, pepino con chile
 * pale green dusted brick red.
 *
 * The adult reading is in the frame too. The man pushing it is doing hard outdoor
 * work in Texas heat so somebody else eats.
 */
export const PaleteroCart: React.FC<TejanoProps & {
  h?: number; umbrella?: boolean; flavours?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 121, wear = 0.4, facing = 1,
       h = 90, umbrella = true, flavours = 16}) => {
  const L = useLight();
  const K = fit('paleteroCart', h);
  const box = tones('#F0EDE4', L);
  const w = h * 1.9;
  const FLAV = ['#C42A34', '#E8892C', '#E8607A', '#F2EDE0', '#B8D44A', '#8A5A34',
                '#EDE2CC', '#A8C860', '#D4462C', '#F0B83C'];

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THE ASYMMETRIC WHEELS. Big spoked at the back, small caster at the front. */}
      <g>
        <circle cx={w * 0.30} cy={-h * 0.20} r={h * 0.20} fill="none" stroke="#3A3630"
          strokeWidth={h * 0.030} />
        {Array.from({length: 10}, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <line key={i} x1={w * 0.30} y1={-h * 0.20}
              x2={w * 0.30 + Math.cos(a) * h * 0.18} y2={-h * 0.20 + Math.sin(a) * h * 0.18}
              stroke="#8A8580" strokeWidth={h * 0.010} />
          );
        })}
        <circle cx={-w * 0.34} cy={-h * 0.09} r={h * 0.09} fill="#3A3630" />
      </g>
      <rect x={-w * 0.44} y={-h * 0.86} width={w * 0.88} height={h * 0.60} rx={h * 0.08}
        fill={box.core} />
      {/* the chrome or stainless band at the rim */}
      <rect x={-w * 0.44} y={-h * 0.92} width={w * 0.88} height={h * 0.07} rx={h * 0.02}
        fill="#C8CCD0" />
      {/* the flavour picture panel on the front face, a grid of small rectangles */}
      <g>
        {Array.from({length: flavours}, (_, i) => {
          const c = i % 4, r = Math.floor(i / 4);
          return (
            <rect key={i} x={-w * 0.40 + c * w * 0.19} y={-h * 0.78 + r * h * 0.13}
              width={w * 0.165} height={h * 0.11}
              fill={FLAV[(i * 3 + seed) % FLAV.length]} stroke={INK}
              strokeWidth={h * 0.008} />
          );
        })}
      </g>
      {/* the push bar at hand height, like a stroller */}
      <path fill="none" stroke="#8A8580" strokeWidth={h * 0.026}
        d={`M${w * 0.42},${-h * 0.70} L${w * 0.60},${-h * 1.04} L${w * 0.34},${-h * 1.04}`} />
      {umbrella && (
        <g>
          <rect x={w * 0.30} y={-h * 1.90} width={h * 0.020} height={h * 1.10}
            fill="#6A655C" />
          <path fill="#C42A34" d={
            `M${w * 0.30 - h * 1.0},${-h * 1.86} Q${w * 0.30},${-h * 2.16} ${w * 0.30 + h * 1.0},${-h * 1.86}` +
            ` Q${w * 0.30},${-h * 1.74} ${w * 0.30 - h * 1.0},${-h * 1.86} Z`} />
          {Array.from({length: 5}, (_, i) => (
            <line key={i} x1={w * 0.30 + h * 0.02} y1={-h * 1.90}
              x2={w * 0.30 - h * 1.0 + i * h * 0.5} y2={-h * 1.82}
              stroke="#9A2028" strokeWidth={h * 0.012} />
          ))}
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w * 0.44} y={-h * 0.44} w={w * 0.88} h={h * 0.20}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE PANADERIA RACK. The self-serve tray is the ritual: you are trusted to choose,
 * you overfill, and an adult puts something back.
 *
 * THE CASES ARE OPEN SHELVING, NOT SEALED GLASS. Five to seven levels of steel or
 * laminate racking holding full sheet pans, with handwritten cards. A sealed display
 * case is a different kind of bakery.
 *
 * THE THREE CANONICAL CONCHA CRUSTS ARE THE ANCHOR AND THEY MUST BE RIGHT: pink is a
 * chalky rose and never fuchsia, yellow is a pale butter, brown is cocoa. And the
 * SCORING is the identification, either concentric arcs radiating from an off-centre
 * point or a diagonal crosshatch.
 *
 * Every shape here is drawn by its scoring rather than by its outline, because a
 * marranito and an empanada are both brown half-discs until you cut them.
 */
export const PanaderiaRack: React.FC<TejanoProps & {
  h?: number; w?: number; shelves?: number; charola?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 122, wear = 0.25, facing = 1,
       h = 200, w = 300, shelves = 6, charola = false}) => {
  const L = useLight();
  const K = fit('panaderiaRack', h);
  const steel = tones('#B0B4B0', L);
  const CRUST = ['#E8A8B4', '#F0DFA0', '#8A5A38'];   // rose, butter, cocoa
  const BREAD = '#D8A96E';

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {[-1, 1].map((s) => (
        <rect key={s} x={s * w * 0.48 - h * 0.012} y={-h} width={h * 0.024} height={h}
          fill={steel.core} />
      ))}
      {Array.from({length: shelves}, (_, r) => {
        const sy = -h * (0.12 + r * (0.86 / shelves));
        return (
          <g key={r}>
            <rect x={-w * 0.48} y={sy} width={w * 0.96} height={h * 0.014}
              fill={steel.core} />
            {/* the sheet pan */}
            <rect x={-w * 0.46} y={sy - h * 0.016} width={w * 0.92} height={h * 0.018}
              fill="#9A9E9A" />
            {Array.from({length: 7}, (_, i) => {
              const px = -w * 0.40 + i * w * 0.133;
              const kind = (r + i) % 5;
              const crust = CRUST[(r + i) % 3];
              const R = h * 0.036;
              return (
                <g key={i} transform={`translate(${px} ${sy - h * 0.048})`}>
                  {kind === 0 && (
                    /* CONCHA: a dome with the sugar paste SCORED in arcs from an
                       off-centre point. The scoring is the whole identification. */
                    <g>
                      <ellipse cx={0} cy={0} rx={R} ry={R * 0.84} fill={BREAD} />
                      <ellipse cx={0} cy={-R * 0.10} rx={R * 0.86} ry={R * 0.68}
                        fill={crust} />
                      {Array.from({length: 5}, (_, k) => (
                        <path key={k} fill="none" stroke={BREAD} strokeWidth={R * 0.09}
                          d={`M${-R * 0.82},${-R * 0.10 + (k - 2) * R * 0.24}` +
                             ` Q${R * 0.20},${-R * 0.44 + (k - 2) * R * 0.30} ${R * 0.80},${-R * 0.10 + (k - 2) * R * 0.20}`} />
                      ))}
                    </g>
                  )}
                  {kind === 1 && (
                    /* CUERNITO: a crescent */
                    <path fill={BREAD} d={
                      `M${-R},${R * 0.3} Q${-R * 0.2},${-R * 1.1} ${R},${R * 0.3}` +
                      ` Q${0},${-R * 0.3} ${-R},${R * 0.3} Z`} />
                  )}
                  {kind === 2 && (
                    /* OREJA: a flat heart-shaped spiral with caramelised edges */
                    <g>
                      <path fill="#B87A3C" d={
                        `M0,${R * 0.5} Q${-R * 1.1},${-R * 0.2} ${-R * 0.5},${-R * 0.7}` +
                        ` Q0,${-R * 0.9} 0,${-R * 0.2}` +
                        ` Q0,${-R * 0.9} ${R * 0.5},${-R * 0.7}` +
                        ` Q${R * 1.1},${-R * 0.2} 0,${R * 0.5} Z`} />
                      <path fill="none" stroke="#8A5A2C" strokeWidth={R * 0.08}
                        d={`M0,${R * 0.4} Q${-R * 0.7},${-R * 0.2} ${-R * 0.35},${-R * 0.55}`} />
                    </g>
                  )}
                  {kind === 3 && (
                    /* EMPANADA: a half moon with a CRIMPED edge and two fork vents */
                    <g>
                      <path fill={BREAD} d={
                        `M${-R},${R * 0.3} A${R},${R} 0 0 1 ${R},${R * 0.3} Z`} />
                      {Array.from({length: 7}, (_, k) => (
                        <circle key={k} cx={-R + k * R * 0.33} cy={R * 0.3} r={R * 0.10}
                          fill="#C09858" />
                      ))}
                      <line x1={-R * 0.2} y1={-R * 0.2} x2={-R * 0.2} y2={0}
                        stroke="#A8763C" strokeWidth={R * 0.08} />
                      <line x1={R * 0.2} y1={-R * 0.2} x2={R * 0.2} y2={0}
                        stroke="#A8763C" strokeWidth={R * 0.08} />
                    </g>
                  )}
                  {kind === 4 && (
                    /* MARRANITO: a flat dense pig silhouette, ONE dot for an eye */
                    <g>
                      <path fill="#7A4A24" d={
                        `M${-R * 0.9},${R * 0.3} L${-R * 0.9},${-R * 0.2}` +
                        ` Q${-R * 0.6},${-R * 0.6} ${-R * 0.1},${-R * 0.55}` +
                        ` L${R * 0.5},${-R * 0.55} Q${R * 0.95},${-R * 0.5} ${R * 0.9},${-R * 0.1}` +
                        ` L${R * 0.9},${R * 0.3} Z`} />
                      <path fill="#7A4A24" d={`M${R * 0.5},${-R * 0.55} l${R * 0.12},${-R * 0.28} l${R * 0.20},${R * 0.22} Z`} />
                      <circle cx={R * 0.62} cy={-R * 0.32} r={R * 0.07} fill="#3A2214" />
                    </g>
                  )}
                </g>
              );
            })}
            {/* the handwritten price card */}
            <rect x={-w * 0.46} y={sy + h * 0.004} width={w * 0.10} height={h * 0.022}
              fill="#F2EDE0" />
          </g>
        );
      })}
      {charola && (
        /* the tray and tongs, issued at the door, scratched all over */
        <g transform={`translate(0 ${h * 0.08})`}>
          <rect x={-sub('charola', 'panaderiaRack', h) / 2} y={-h * 0.04}
            width={sub('charola', 'panaderiaRack', h)} height={h * 0.035} rx={h * 0.008}
            fill="#B4B8BA" />
          {Array.from({length: 14}, (_, i) => (
            <line key={i} x1={-w * 0.24 + rnd(seed, i) * w * 0.48} y1={-h * 0.036}
              x2={-w * 0.20 + rnd(seed, i) * w * 0.48} y2={-h * 0.014}
              stroke="#9AA0A2" strokeWidth={h * 0.003} opacity={0.7} />
          ))}
          <path fill="none" stroke="#C8CCD0" strokeWidth={h * 0.010}
            d={`M${-w * 0.14},${-h * 0.05} L${w * 0.06},${-h * 0.05} M${-w * 0.14},${-h * 0.036} L${w * 0.06},${-h * 0.03}`} />
        </g>
      )}
    </g>
  );
};

/**
 * THE RASPA STAND. Raspa is the South Texas word, from hielo raspado, and the word
 * itself sorts insiders from tourists.
 *
 * WHAT MAKES IT LOCAL IS NOT THE ICE, IT IS THE SOUR AND SPICY TOP LAYER. Chamoy
 * pours as a dark rust red-brown swirl and Tajin dusts on as brick orange powder.
 * A plain syrup cone is a snow cone and a different object.
 *
 * THE TEXTURE MATTERS: ice off a block shaver is FINE SNOW, not the round pellets of
 * a mall machine. And the front wall is almost entirely menu, a hand-lettered grid of
 * thirty to sixty flavour names in stacked columns, which is why this is drawn as a
 * wall of small rules rather than as a sign.
 */
export const RaspaStand: React.FC<TejanoProps & {
  h?: number; w?: number; syrups?: number; menuRows?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 123, wear = 0.4, facing = 1, night = false,
       h = 150, w = 200, syrups = 12, menuRows = 12}) => {
  const L = useLight();
  const K = fit('raspaStand', h);
  const body = tones('#EDE6D4', L);
  const SYRUP = ['#C42A34', '#2A78C4', '#3F9A4A', '#E8C42C', '#8A4AA8', '#8A5A34',
                 '#F0A8B8', '#E8892C'];

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={-h * 0.88} width={w} height={h * 0.88} fill={body.core} />
      <path fill={body.base} d={
        `M${-w / 2 - w * 0.04},${-h * 0.88} L0,${-h} L${w / 2 + w * 0.04},${-h * 0.88} Z`} />
      {/* THE MENU WALL. Thirty to sixty names in stacked columns, hand lettered. */}
      {Array.from({length: menuRows}, (_, r) =>
        Array.from({length: 3}, (_, c) => (
          <rect key={`${r}${c}`} x={-w * 0.44 + c * w * 0.30}
            y={-h * 0.82 + r * h * 0.036}
            width={w * (0.16 + rnd(seed, r * 3 + c) * 0.10)} height={h * 0.018}
            fill="#3A3630" opacity={0.75} />
        )))}
      {/* the service window with its sliding screen, and the awning over it */}
      <rect x={-w * 0.20} y={-h * 0.50} width={w * 0.40} height={h * 0.28}
        fill={night ? '#F4E4B0' : '#2E343A'} stroke={INK} strokeWidth={h * 0.010} />
      <rect x={-w * 0.30} y={-h * 0.54} width={w * 0.60} height={h * 0.030}
        fill="#C42A34" />
      <path fill="#C42A34" d={
        `M${-w * 0.30},${-h * 0.54} L${-w * 0.42},${-h * 0.40}` +
        ` L${w * 0.42},${-h * 0.40} L${w * 0.30},${-h * 0.54} Z`} />
      {/* THE SYRUP RACK. This is the picture, and it is loud on purpose. */}
      <g transform={`translate(0 ${-h * 0.22})`}>
        {Array.from({length: syrups}, (_, i) => (
          <g key={i} transform={`translate(${-w * 0.36 + i * w * 0.062} 0)`}>
            <rect x={-w * 0.020} y={-h * 0.14} width={w * 0.040} height={h * 0.14}
              rx={w * 0.008} fill={SYRUP[i % SYRUP.length]} />
            <rect x={-w * 0.008} y={-h * 0.175} width={w * 0.016} height={h * 0.038}
              fill="#D8D4CC" />
          </g>
        ))}
      </g>
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.22} w={w} h={h * 0.22}
        opacity={wear * 0.5} />}
    </g>
  );
};

/** A RASPA IN THE CUP, because at close range the cup is the artifact.
 *
 *  A tall styrofoam cup filled PAST THE RIM into a dome, with the chamoy swirl and
 *  the Tajin dust on top and a spoon-straw stuck into the side of the mound. The ice
 *  is fine snow. The build is layered, coarse at the bottom and fine on top, so the
 *  syrup travels down and the cup is banded rather than uniform. */
export const RaspaCup: React.FC<TejanoProps & {
  h?: number; syrup?: string; chamoy?: boolean; gummies?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 124, h = 70, syrup = '#E8607A',
       chamoy = true, gummies = 4}) => {
  const L = useLight();
  // Fitted on the CUP, whose body runs h * 0.86 to the rim in this local frame. It used to
  // borrow the paletero cart's entry and multiply by h/70, which sized a drink off a freezer
  // box and rendered a 1.03 m cup. The h/70 was quadratic as well, because every path
  // coordinate is already a multiple of h, so halving h quartered the drawing.
  const K = fit('raspaCup', h * 0.86);
  const w = h * 0.52;
  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <path fill="#F4F2EC" d={
        `M${-w * 0.40},0 L${-w * 0.50},${-h * 0.86} L${w * 0.50},${-h * 0.86} L${w * 0.40},0 Z`} />
      {/* the layering: the syrup travels DOWN, so the cup is banded */}
      <path fill={syrup} opacity={0.75} d={
        `M${-w * 0.44},${-h * 0.30} L${-w * 0.50},${-h * 0.86} L${w * 0.50},${-h * 0.86} L${w * 0.44},${-h * 0.30} Z`} />
      {/* the DOME above the rim. A flat fill is a drink. */}
      <path fill="#F0F4F6" d={
        `M${-w * 0.50},${-h * 0.86} Q0,${-h * 1.32} ${w * 0.50},${-h * 0.86} Z`} />
      <path fill={syrup} opacity={0.55} d={
        `M${-w * 0.32},${-h * 1.00} Q0,${-h * 1.30} ${w * 0.34},${-h * 0.98} Q0,${-h * 1.12} ${-w * 0.32},${-h * 1.00} Z`} />
      {chamoy && (
        <>
          <path fill="none" stroke="#8A3A1E" strokeWidth={h * 0.030} strokeLinecap="round"
            d={`M${-w * 0.34},${-h * 0.96} q${w * 0.24},${-h * 0.22} ${w * 0.36},${h * 0.02}` +
               ` q${w * 0.20},${-h * 0.16} ${w * 0.32},${h * 0.06}`} />
          {Array.from({length: 22}, (_, i) => (
            <circle key={i} cx={(rnd(seed, i) - 0.5) * w * 0.9}
              cy={-h * (0.92 + rnd(seed, 20 + i) * 0.30)} r={h * 0.012}
              fill="#C4522A" opacity={0.8} />
          ))}
        </>
      )}
      {Array.from({length: gummies}, (_, i) => (
        <rect key={i} x={(rnd(seed, 40 + i) - 0.5) * w * 0.7}
          y={-h * (1.02 + rnd(seed, 60 + i) * 0.22)} width={h * 0.05} height={h * 0.05}
          rx={h * 0.015} fill={['#D4462C', '#3F9A4A', '#E8C42C', '#2A78C4'][i % 4]} />
      ))}
      {/* the spoon-straw, in the SIDE of the mound */}
      <line x1={w * 0.20} y1={-h * 1.36} x2={w * 0.06} y2={-h * 0.80}
        stroke="#E8407A" strokeWidth={h * 0.032} />
    </g>
  );
};

/**
 * THE ACCORDION AND THE BAJO SEXTO, the two-instrument core of conjunto.
 *
 * This is working people's music and its own players said so. Narciso Martinez, the
 * father of modern conjunto, said it was for poor people and ranch people, and
 * musicians worked alongside their audience as fieldworkers and played the taco
 * circuit strung along the roads Texas-Mexican cotton pickers followed to the
 * harvests. Drawing the accordion is drawing a labour history.
 *
 * THE ACCORDION IS DIATONIC AND BUTTON, NOT PIANO KEY. Three arcs of round buttons on
 * the right hand block, curved to follow the hand, about thirty one of them. A piano
 * keyboard here is the wrong instrument and the wrong subgenre.
 *
 * THE BELLOWS IS THE DRAWABLE ELEMENT: a black accordion fold with a bright leather
 * trim strip capping each fold end, so open it reads as a striped concertina.
 *
 * THE BAJO SEXTO IS VISIBLY BIGGER AND DEEPER THAN A GUITAR, with twelve strings in
 * six DOUBLE courses and a wide headstock carrying six tuners a side. Drawing a
 * six-string guitar beside the accordion is the most common error in the whole beat.
 */
export const ConjuntoPair: React.FC<TejanoProps & {
  h?: number; bellows?: number; bodyColour?: string; bajo?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 125, wear = 0.3, facing = 1,
       h = 90, bellows = 0.5, bodyColour = '#A8202C', bajo = true, frame = 0}) => {
  const L = useLight();
  const K = fit('accordion', h);
  const body = tones(bodyColour, L);
  const pull = bellows + Math.sin(frame / 13) * 0.18;
  const bw = h * (0.34 + pull * 0.70);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {bajo && (
        /* held HIGH and played standing, and it is a big instrument */
        <g transform={`translate(${-h * 1.9} ${h * 0.30}) scale(${fit('bajoSexto', h) / fit('accordion', h) * 0.42})`}>
          <ellipse cx={0} cy={0} rx={h * 1.02} ry={h * 1.24} fill="#C89A5E" />
          <ellipse cx={0} cy={h * 0.34} rx={h * 1.10} ry={h * 1.06} fill="#C89A5E" />
          <ellipse cx={0} cy={-h * 0.10} rx={h * 0.34} ry={h * 0.34} fill="#2A1E16" />
          <ellipse cx={0} cy={-h * 0.10} rx={h * 0.40} ry={h * 0.40} fill="none"
            stroke="#8A6A3C" strokeWidth={h * 0.05} />
          <rect x={-h * 0.20} y={-h * 3.0} width={h * 0.40} height={h * 1.9}
            fill="#3A2A1E" />
          {/* the WIDE headstock, six tuners a side, twelve strings in six courses */}
          <rect x={-h * 0.34} y={-h * 3.5} width={h * 0.68} height={h * 0.56}
            fill="#241A12" />
          {Array.from({length: 6}, (_, i) => (
            <g key={i}>
              <circle cx={-h * 0.42} cy={-h * (3.42 - i * 0.09)} r={h * 0.055}
                fill="#C8CCD0" />
              <circle cx={h * 0.42} cy={-h * (3.42 - i * 0.09)} r={h * 0.055}
                fill="#C8CCD0" />
            </g>
          ))}
          {Array.from({length: 12}, (_, i) => (
            <line key={i} x1={-h * 0.17 + i * h * 0.031} y1={-h * 2.94}
              x2={-h * 0.30 + i * h * 0.055} y2={h * 0.34} stroke="#D8D4C8"
              strokeWidth={h * 0.012} opacity={0.8} />
          ))}
        </g>
      )}
      {/* THE BELLOWS. Striped by the leather fold caps, which is the whole read. */}
      <g transform={`translate(${-bw / 2} 0)`}>
        {Array.from({length: 9}, (_, i) => (
          <g key={i}>
            <rect x={(i * bw) / 9} y={-h * 0.42} width={bw / 9} height={h * 0.84}
              fill={i % 2 ? '#1A1A1E' : '#26262A'} />
            <rect x={(i * bw) / 9} y={-h * 0.44} width={bw / 18} height={h * 0.88}
              fill="#D8C8A0" opacity={0.85} />
          </g>
        ))}
      </g>
      {/* the two blocks, and the right hand carries THREE ARCS of round buttons */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * bw * 0.5 - (s > 0 ? 0 : h * 0.30)} y={-h * 0.48}
            width={h * 0.30} height={h * 0.96} rx={h * 0.04} fill={body.core} />
        </g>
      ))}
      {/* the stamped decorative grille over the treble reeds */}
      <g transform={`translate(${bw * 0.5 + h * 0.15} 0)`}>
        <rect x={-h * 0.11} y={-h * 0.40} width={h * 0.22} height={h * 0.34}
          fill="#C8CCD0" />
        {Array.from({length: 5}, (_, i) => (
          <line key={i} x1={-h * 0.09} y1={-h * 0.36 + i * h * 0.062}
            x2={h * 0.09} y2={-h * 0.36 + i * h * 0.062} stroke="#8A8F92"
            strokeWidth={h * 0.014} />
        ))}
        {Array.from({length: 3}, (_, r) =>
          Array.from({length: 9}, (_, i) => (
            <circle key={`${r}${i}`}
              cx={-h * 0.08 + r * h * 0.07 + Math.sin(i * 0.5) * h * 0.012}
              cy={h * 0.02 + i * h * 0.042} r={h * 0.022} fill="#E8E4D8" />
          )))}
      </g>
      {/* the two shoulder straps */}
      {[-1, 1].map((s) => (
        <path key={s} fill="none" stroke="#3A2A1E" strokeWidth={h * 0.030}
          d={`M${s * bw * 0.3},${-h * 0.46} q${s * h * 0.10},${-h * 0.30} ${s * h * 0.02},${-h * 0.56}`} />
      ))}
    </g>
  );
};

/**
 * THE LOWRIDER. A Chicano-invented American art form and an heirloom, and it is NOT a
 * threat cue. The clubs run school supply drives, the cars are passed down, and a show
 * is grandparents in folding chairs.
 *
 * THE STANCE IS THE WHOLE DRAWING: rocker panels a few inches off the pavement, the
 * roofline low and long, and SMALL wheels so the body reads huge above them. Thirteen
 * or fourteen inch wire spokes with a knock-off cap and a thin whitewall band.
 *
 * The hydraulics are the culture in one mechanism. Cities wrote height ordinances at
 * these cars and builders answered with a system that raises to legal height for
 * driving and drops for cruising, so `lift` is a political fact rather than a pose.
 *
 * CANDY PAINT IS NOT METALLIC PAINT. It is a translucent colour coat over a metallic
 * base, so it reads deep and WET, with a very dark saturated core in the shadow and a
 * bright base flake blowing out in the highlight. Draw the colour as a gradient
 * INSIDE a single panel, never as a flat fill. That one decision is what separates a
 * lowrider drawing from a car drawing.
 */
export const Lowrider: React.FC<TejanoProps & {
  h?: number; candy?: string; lift?: number; sparks?: boolean; plaque?: boolean;
  hoodUp?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 126, wear = 0.15, facing = 1, night = false,
       h = 100, candy = '#7A2A8A', lift = 0, sparks = false, plaque = true,
       hoodUp = false}) => {
  const L = useLight();
  const K = fit('lowrider', h);
  const uid = useUid('lr');
  const c = tones(candy, L);
  const w = h * 4.6;
  const drop = h * (0.10 - lift * 0.22);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <defs>
        {/* CANDY: a gradient INSIDE the panel, dark core to blown-out flake */}
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={c.base} />
          <stop offset="34%" stopColor={c.core} />
          <stop offset="72%" stopColor={c.shade} />
          <stop offset="100%" stopColor={c.core} />
        </linearGradient>
      </defs>
      {/* the long low body: LOW ROOF, long deck, formal roofline */}
      <path fill={`url(#${uid}c)`} d={
        `M${-w * 0.50},${-h * 0.28 - drop} L${-w * 0.46},${-h * 0.52 - drop}` +
        ` L${-w * 0.20},${-h * 0.56 - drop} L${-w * 0.13},${-h * 0.94 - drop}` +
        ` L${w * 0.17},${-h * 0.94 - drop} L${w * 0.24},${-h * 0.56 - drop}` +
        ` L${w * 0.47},${-h * 0.52 - drop} L${w * 0.50},${-h * 0.26 - drop}` +
        ` L${w * 0.44},${-h * 0.14 - drop} L${-w * 0.44},${-h * 0.16 - drop} Z`} />
      {/* the glasshouse, formal and shallow */}
      <path fill={night ? '#141822' : '#2A3644'} d={
        `M${-w * 0.11},${-h * 0.90 - drop} L${w * 0.15},${-h * 0.90 - drop}` +
        ` L${w * 0.20},${-h * 0.60 - drop} L${-w * 0.16},${-h * 0.60 - drop} Z`} />
      {/* pinstriping along the crease line, which is what candy paint always carries */}
      <path fill="none" stroke="#E8D48A" strokeWidth={h * 0.012} opacity={0.85}
        d={`M${-w * 0.46},${-h * 0.40 - drop} L${w * 0.46},${-h * 0.38 - drop}`} />
      <path fill="none" stroke="#E8D48A" strokeWidth={h * 0.008} opacity={0.6}
        d={`M${-w * 0.44},${-h * 0.34 - drop} L${w * 0.44},${-h * 0.32 - drop}`} />
      {/* the chrome bumpers and the vertical bar grille */}
      <rect x={-w * 0.52} y={-h * 0.30 - drop} width={w * 0.06} height={h * 0.14}
        fill="#D0D4D8" />
      <rect x={w * 0.46} y={-h * 0.28 - drop} width={w * 0.06} height={h * 0.14}
        fill="#D0D4D8" />
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={-w * 0.505 + i * w * 0.007} y={-h * 0.44 - drop}
          width={w * 0.003} height={h * 0.14} fill="#C8CCD0" />
      ))}
      {/* THE WHEELS: SMALL, so the body reads huge. Wire spokes, whitewall band. */}
      {[-0.32, 0.32].map((f, i) => (
        <g key={i} transform={`translate(${w * f} ${-h * 0.17 - drop * 0.4})`}>
          <circle cx={0} cy={0} r={h * 0.19} fill="#1A1A1C" />
          <circle cx={0} cy={0} r={h * 0.155} fill="#F0EDE4" />
          <circle cx={0} cy={0} r={h * 0.135} fill="#1A1A1C" />
          <circle cx={0} cy={0} r={h * 0.115} fill="#D8DCE0" />
          {Array.from({length: 30}, (_, k) => {
            const a = (k / 30) * Math.PI * 2;
            return (
              <line key={k} x1={0} y1={0} x2={Math.cos(a) * h * 0.11}
                y2={Math.sin(a) * h * 0.11} stroke="#9AA0A4" strokeWidth={h * 0.006} />
            );
          })}
          <circle cx={0} cy={0} r={h * 0.035} fill="#E8ECF0" />
        </g>
      ))}
      {hoodUp && (
        <path fill={`url(#${uid}c)`} d={
          `M${-w * 0.46},${-h * 0.52 - drop} L${-w * 0.40},${-h * 1.10 - drop}` +
          ` L${-w * 0.16},${-h * 1.04 - drop} L${-w * 0.20},${-h * 0.56 - drop} Z`} />
      )}
      {plaque && (
        /* the club plaque in the rear window, on two small chains */
        <g transform={`translate(${-w * 0.02} ${-h * 0.68 - drop})`}>
          <rect x={-w * 0.07} y={-h * 0.03} width={w * 0.14} height={h * 0.07}
            fill="#C8CCD0" stroke={INK} strokeWidth={h * 0.008} />
          {[-1, 1].map((s) => (
            <line key={s} x1={s * w * 0.05} y1={-h * 0.03} x2={s * w * 0.05}
              y2={-h * 0.09} stroke="#9AA0A4" strokeWidth={h * 0.006} />
          ))}
        </g>
      )}
      {sparks && lift > 0.4 && (
        <g>
          {Array.from({length: 12}, (_, i) => (
            <line key={i} x1={-w * 0.30 + rnd(seed, i) * w * 0.2}
              y1={-h * 0.04} x2={-w * 0.44 + rnd(seed, i) * w * 0.2}
              y2={h * 0.02 + rnd(seed, 20 + i) * h * 0.05}
              stroke="#FFD060" strokeWidth={h * 0.010} opacity={0.9} />
          ))}
        </g>
      )}
      {night && (
        /* the underglow, which reads as a wash on the ground and not as a light bar */
        <ellipse cx={0} cy={-h * 0.04} rx={w * 0.44} ry={h * 0.10} fill="#7A4AD8"
          opacity={0.28} />
      )}
    </g>
  );
};

/**
 * THE YARD SHRINE, and it is drawn as a NICHE rather than as an icon.
 *
 * Her image is the most reproduced in Mexican-American Texas and it is not
 * decorative. San Anto Cultural Arts, painting community murals on the West Side,
 * found that when they ask the neighbourhood what to paint, people ask for religious
 * figures, because it is a tie to their past.
 *
 * SO THIS DRAWS THE SHRINE AND LEAVES THE FIGURE AS A SILHOUETTE INSIDE IT. The
 * geometry of the icon is fixed and specific and getting it wrong reads as fake
 * immediately, and rendering it in detail at the scale a Dispatch actually uses would
 * be getting it wrong. The niche, the candles, the shells and the plastic flowers are
 * what a yard shrine looks like from the street, which is where the camera is.
 *
 * The niche forms are real and worth knowing: a half-buried bathtub set on end, a
 * stacked rock and cement grotto, or a wooden box, with a low fence of bricks or
 * shells in front. Christmas lights left up all year.
 */
export const YardShrine: React.FC<TejanoProps & {
  h?: number; form?: 'grotto' | 'tub' | 'box'; candles?: number; lights?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 127, wear = 0.35, facing = 1, night = false,
       h = 110, form = 'grotto', candles = 3, lights = true}) => {
  const L = useLight();
  const K = fit('yardShrine', h);
  const stone = tones('#CFC6B0', L);
  const w = h * 0.62;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {form === 'grotto' && (
        <g>
          <path fill={stone.core} d={
            `M${-w * 0.62},0 L${-w * 0.56},${-h * 0.52}` +
            ` Q${-w * 0.52},${-h * 0.92} 0,${-h * 0.98}` +
            ` Q${w * 0.52},${-h * 0.92} ${w * 0.56},${-h * 0.52} L${w * 0.62},0 Z`} />
          {/* the stacked rock, drawn as irregular lumps rather than as courses */}
          {Array.from({length: 26}, (_, i) => (
            <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 1.1}
              cy={-rnd(seed, 20 + i) * h * 0.94}
              rx={w * (0.06 + rnd(seed, 40 + i) * 0.06)}
              ry={h * (0.03 + rnd(seed, 60 + i) * 0.03)}
              fill={stone.base} opacity={0.5} />
          ))}
        </g>
      )}
      {form === 'tub' && (
        <path fill="#E4E0D6" d={
          `M${-w * 0.42},0 L${-w * 0.42},${-h * 0.56}` +
          ` A${w * 0.42},${w * 0.42} 0 0 1 ${w * 0.42},${-h * 0.56} L${w * 0.42},0 Z`} />
      )}
      {form === 'box' && (
        <g>
          <rect x={-w * 0.42} y={-h * 0.86} width={w * 0.84} height={h * 0.86}
            fill="#B49670" />
          <path fill="#8A6A48" d={
            `M${-w * 0.50},${-h * 0.86} L0,${-h} L${w * 0.50},${-h * 0.86} Z`} />
        </g>
      )}
      {/* THE NICHE, and the figure inside it as a silhouette. Read the header. */}
      <path fill={night ? '#3A2E1E' : '#2A2622'} d={
        `M${-w * 0.24},0 L${-w * 0.24},${-h * 0.48}` +
        ` A${w * 0.24},${w * 0.24} 0 0 1 ${w * 0.24},${-h * 0.48} L${w * 0.24},0 Z`} />
      <path fill={night ? '#8AA0C0' : '#6A7A94'} opacity={0.9} d={
        `M0,${-h * 0.68} q${-w * 0.13},${h * 0.06} ${-w * 0.115},${h * 0.30}` +
        ` L${-w * 0.10},${-h * 0.06} L${w * 0.10},${-h * 0.06}` +
        ` L${w * 0.115},${-h * 0.32} q${w * 0.015},${-h * 0.24} ${-w * 0.115},${-h * 0.30} Z`} />
      {/* the mandorla, as a plain almond of light behind her, which is honest at
          this scale and is also what a lit niche actually looks like at night */}
      {night && (
        <ellipse cx={0} cy={-h * 0.34} rx={w * 0.20} ry={h * 0.34} fill="#E8C878"
          opacity={0.22} />
      )}
      {Array.from({length: candles}, (_, i) => (
        <g key={i} transform={`translate(${(i - (candles - 1) / 2) * w * 0.17} 0)`}>
          <rect x={-w * 0.045} y={-h * 0.16} width={w * 0.09} height={h * 0.16}
            fill={night ? '#F0C060' : '#DCD6C8'} opacity={0.9} />
          {night && <circle cx={0} cy={-h * 0.13} r={w * 0.03} fill="#FFE8A0" />}
        </g>
      ))}
      {/* the low fence of bricks or shells in front */}
      {Array.from({length: 7}, (_, i) => (
        <ellipse key={i} cx={-w * 0.54 + i * w * 0.18} cy={h * 0.02}
          rx={w * 0.07} ry={h * 0.022} fill="#E8E2D2" />
      ))}
      {/* the plastic flowers, in saturated pink and yellow, all year */}
      {Array.from({length: 6}, (_, i) => (
        <g key={i} transform={`translate(${(rnd(seed, 80 + i) - 0.5) * w * 0.9} ${-h * 0.04})`}>
          {Array.from({length: 5}, (_, k) => {
            const a = (k / 5) * Math.PI * 2;
            return (
              <ellipse key={k} cx={Math.cos(a) * w * 0.026} cy={Math.sin(a) * w * 0.026}
                rx={w * 0.024} ry={w * 0.016}
                fill={i % 2 ? '#E0407A' : '#F0C030'} />
            );
          })}
        </g>
      ))}
      {lights && night && Array.from({length: 9}, (_, i) => (
        <circle key={i} cx={-w * 0.56 + i * w * 0.14}
          cy={-h * (0.72 + Math.sin((i / 8) * Math.PI) * 0.22)} r={w * 0.022}
          fill={['#F04040', '#40C060', '#F0C040', '#4080E0'][i % 4]} />
      ))}
    </g>
  );
};

/**
 * THE TIENDITA WITH ITS ROTULO. The sign is painted ON the building rather than on a
 * board, and it is painted by a specialist over several days and repainted when it
 * wears out, so a shop's identity can last decades and still be handmade.
 *
 * THE LETTERING IS DRAWN BY EYE, so the baseline DRIFTS, the strokes swell, and the
 * spacing is optically balanced rather than measured. A perfectly set line of type on
 * a stucco wall is the tell that a computer did it. This library draws the letters as
 * irregular blocks, and the irregularity IS the craft.
 *
 * `banner` is the modern layer and it is a whole story on its own: a printed vinyl
 * banner zip-tied over the painted sign, which is what happened after about 2005.
 */
export const Tiendita: React.FC<TejanoProps & {
  h?: number; w?: number; letters?: number; banner?: boolean; bars?: boolean;
  ghost?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 128, wear = 0.45, facing = 1, night = false,
       h = 150, w = 340, letters = 7, banner = false, bars = true, ghost = false}) => {
  const L = useLight();
  const K = fit('rotulo', h);
  const stucco = tones('#E8E0CC', L);
  const sign = tones('#C4302C', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={stucco.core} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={matFill('granite')}
        opacity={0.35} />
      <rect x={-w / 2} y={-h * 1.06} width={w} height={h * 0.08} fill={stucco.base} />
      {ghost && Array.from({length: 5}, (_, i) => (
        /* the previous rotulo showing through the repaint, which is the honest version */
        <rect key={i} x={-w * 0.36 + i * w * 0.15} y={-h * 0.62} width={w * 0.11}
          height={h * 0.14} fill="#B8A88E" opacity={0.3} />
      ))}
      {/* THE PAINTED NAME. Drawn by eye, so the baseline drifts and strokes swell. */}
      <g>
        {Array.from({length: letters}, (_, i) => {
          const lw = w * (0.070 + rnd(seed, i) * 0.030);
          const lx = -w * 0.40 + i * w * 0.115;
          const drift = (rnd(seed, 20 + i) - 0.5) * h * 0.035;
          const lh = h * (0.16 + rnd(seed, 40 + i) * 0.04);
          return (
            <g key={i}>
              {/* the hard drop shadow, offset down and right */}
              <rect x={lx + w * 0.008} y={-h * 0.82 + drift + h * 0.012} width={lw}
                height={lh} fill="#1A2A52" />
              <rect x={lx} y={-h * 0.82 + drift} width={lw} height={lh}
                fill={sign.core} stroke="#F0ECE0" strokeWidth={h * 0.006} />
            </g>
          );
        })}
        {/* the stacked list of what is sold, smaller */}
        {Array.from({length: 3}, (_, i) => (
          <rect key={i} x={-w * 0.36} y={-h * (0.56 - i * 0.06)}
            width={w * (0.30 + rnd(seed, 60 + i) * 0.22)} height={h * 0.030}
            fill="#1A2A52" opacity={0.8} />
        ))}
      </g>
      <rect x={-w * 0.34} y={-h * 0.42} width={w * 0.30} height={h * 0.34}
        fill={night ? '#F4E4B0' : '#3E4A54'} />
      <rect x={w * 0.10} y={-h * 0.44} width={w * 0.14} height={h * 0.44}
        fill="#5A6A5E" />
      {bars && (
        /* decorative security bars, which are on every one of them */
        <g>
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={-w * 0.32 + i * w * 0.046} y1={-h * 0.42}
              x2={-w * 0.32 + i * w * 0.046} y2={-h * 0.08} stroke="#F0ECE0"
              strokeWidth={h * 0.010} />
          ))}
          <path fill="none" stroke="#F0ECE0" strokeWidth={h * 0.010}
            d={`M${-w * 0.32},${-h * 0.25} q${w * 0.075},${-h * 0.06} ${w * 0.15},0` +
               ` q${w * 0.075},${h * 0.06} ${w * 0.15},0`} />
        </g>
      )}
      {/* the shallow metal awning over the sidewalk */}
      <path fill="#8A5A34" d={
        `M${-w * 0.54},${-h * 0.50} L${w * 0.54},${-h * 0.50}` +
        ` L${w * 0.50},${-h * 0.44} L${-w * 0.50},${-h * 0.44} Z`} />
      {banner && (
        <g>
          <rect x={-w * 0.42} y={-h * 0.86} width={w * 0.84} height={h * 0.20}
            fill="#F0F0EC" stroke="#2A78C4" strokeWidth={h * 0.014} />
          {Array.from({length: 2}, (_, i) => (
            <rect key={i} x={-w * 0.34} y={-h * (0.80 - i * 0.08)} width={w * 0.60}
              height={h * 0.05} fill="#2A78C4" opacity={0.85} />
          ))}
          {[-1, 1].map((s) => (
            <circle key={s} cx={s * w * 0.40} cy={-h * 0.84} r={h * 0.012}
              fill="#3A3630" />
          ))}
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.20} w={w} h={h * 0.20}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE COLONIA BLOCK, and this is the drawing where getting it wrong does damage.
 *
 * IT IS A HOUSING STRATEGY, NOT A SLUM. Families bought a lot and built the house
 * over years as they could afford it, so ONE BLOCK SHOWS EVERY STAGE OF A HOUSE AT
 * ONCE. That is the drawing: a finished stucco house on a slab with a swept yard,
 * beside a mobile home with a stick-framed room added and a new roof thrown over the
 * whole assembly, beside a poured slab with a started frame and the family living in
 * the travel trailer next to it.
 *
 * THE POINT IS THE FINISHED HOUSE NEXT TO THE UNFINISHED ONE. An unfinished house is
 * drawn visibly UNDER CONSTRUCTION, never abandoned.
 *
 * The light signature is caliche: a pale bone white road that throws light back UP
 * under everything, which is the one thing that makes a Valley frame look like the
 * Valley.
 */
export const ColoniaBlock: React.FC<TejanoProps & {
  h?: number; w?: number; lots?: number; tank?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 129, wear = 0.4, night = false,
       h = 110, w = 900, lots = 3, tank = true}) => {
  const L = useLight();
  const K = fit('colonia', h);
  const STAGES = ['finished', 'hybrid', 'building'] as const;
  const stucco = ['#DCD0B8', '#C8D4C0', '#D8CCC4'];

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {Array.from({length: lots}, (_, i) => {
        const lx = (i - (lots - 1) / 2) * (w / lots);
        const stage = STAGES[i % 3];
        const body = tones(stucco[i % 3], L);
        return (
          <g key={i} transform={`translate(${lx} 0)`}>
            {stage === 'finished' && (
              <g>
                <rect x={-h * 1.5} y={-h * 0.70} width={h * 3.0} height={h * 0.70}
                  fill={body.core} />
                <path fill="#8A7A62" d={
                  `M${-h * 1.62},${-h * 0.70} L0,${-h * 0.96} L${h * 1.62},${-h * 0.70} Z`} />
                {Array.from({length: 3}, (_, k) => (
                  <rect key={k} x={-h * 1.0 + k * h * 0.8} y={-h * 0.54}
                    width={h * 0.42} height={h * 0.34}
                    fill={night ? '#F2DFA8' : '#48525C'} />
                ))}
                {/* the carport, and the swept yard, which are the pride */}
                <g>
                  <rect x={h * 1.5} y={-h * 0.56} width={h * 1.1} height={h * 0.04}
                    fill={body.base} />
                  <rect x={h * 2.5} y={-h * 0.56} width={h * 0.05} height={h * 0.56}
                    fill={body.shade} />
                </g>
                <ellipse cx={0} cy={h * 0.03} rx={h * 2.0} ry={h * 0.05}
                  fill="#C8BE9E" />
              </g>
            )}
            {stage === 'hybrid' && (
              <g>
                {/* the trailer, plus the framed addition, plus ONE new roof over both */}
                <rect x={-h * 1.6} y={-h * 0.56} width={h * 1.9} height={h * 0.56}
                  fill="#D4CEBE" />
                <rect x={h * 0.3} y={-h * 0.62} width={h * 1.2} height={h * 0.62}
                  fill={body.core} />
                <path fill="#7A6A54" d={
                  `M${-h * 1.74},${-h * 0.62} L${-h * 0.2},${-h * 0.92}` +
                  ` L${h * 1.64},${-h * 0.62} Z`} />
                {Array.from({length: 3}, (_, k) => (
                  <rect key={k} x={-h * 1.4 + k * h * 0.62} y={-h * 0.44}
                    width={h * 0.34} height={h * 0.22}
                    fill={night ? '#F2DFA8' : '#48525C'} />
                ))}
                <rect x={-h * 1.6} y={-h * 0.10} width={h * 1.9} height={h * 0.10}
                  fill="#9A9080" />
                {wear > 0.3 && <RustStreak x={-h * 1.5} y={-h * 0.16} w={h * 0.3}
                  h={h * 0.16} opacity={wear * 0.5} />}
              </g>
            )}
            {stage === 'building' && (
              <g>
                {/* a poured slab and a STARTED FRAME. Visibly in progress. */}
                <rect x={-h * 1.4} y={-h * 0.06} width={h * 2.8} height={h * 0.06}
                  fill="#B8B2A4" />
                {Array.from({length: 9}, (_, k) => (
                  <rect key={k} x={-h * 1.35 + k * h * 0.33} y={-h * 0.70}
                    width={h * 0.07} height={h * 0.64} fill="#C8A870" />
                ))}
                <rect x={-h * 1.4} y={-h * 0.74} width={h * 2.8} height={h * 0.07}
                  fill="#C8A870" />
                <rect x={-h * 1.4} y={-h * 0.42} width={h * 2.8} height={h * 0.05}
                  fill="#C8A870" />
                {/* the travel trailer they are living in next to it */}
                <g transform={`translate(${h * 2.3} 0)`}>
                  <rect x={-h * 0.7} y={-h * 0.44} width={h * 1.4} height={h * 0.38}
                    rx={h * 0.06} fill="#E4E0D4" />
                  <circle cx={-h * 0.36} cy={-h * 0.06} r={h * 0.07} fill="#2A2622" />
                  <circle cx={h * 0.36} cy={-h * 0.06} r={h * 0.07} fill="#2A2622" />
                  <rect x={-h * 0.14} y={-h * 0.38} width={h * 0.22} height={h * 0.32}
                    fill={night ? '#F2DFA8' : '#48525C'} />
                </g>
              </g>
            )}
            {/* the citrus and the mesquite that every finished lot has */}
            <g transform={`translate(${-h * 2.1} 0)`}>
              <rect x={-h * 0.03} y={-h * 0.28} width={h * 0.06} height={h * 0.28}
                fill="#5A4433" />
              <ellipse cx={0} cy={-h * 0.44} rx={h * 0.28} ry={h * 0.24} fill="#385A38" />
              {Array.from({length: 4}, (_, k) => (
                <circle key={k} cx={(rnd(seed, i * 4 + k) - 0.5) * h * 0.4}
                  cy={-h * 0.44 + (rnd(seed, 40 + i * 4 + k) - 0.5) * h * 0.34}
                  r={h * 0.030} fill="#E8C33C" />
              ))}
            </g>
          </g>
        );
      })}
      {/* THE CALICHE ROAD, bone white, throwing light back UP under everything */}
      <rect x={-w * 0.62} y={h * 0.04} width={w * 1.24} height={h * 0.30}
        fill="#DED6C0" />
      {/* the ditch on each side, and no curb anywhere */}
      <rect x={-w * 0.62} y={h * 0.34} width={w * 1.24} height={h * 0.07}
        fill="#9A9470" opacity={0.6} />
      {/* the poles down one side with a heavy droop between them */}
      {Array.from({length: 5}, (_, i) => {
        const px = -w * 0.5 + i * w * 0.25;
        return (
          <g key={i}>
            <rect x={px - h * 0.025} y={-h * 1.5} width={h * 0.05} height={h * 1.5}
              fill="#7A6A54" />
            <rect x={px - h * 0.18} y={-h * 1.44} width={h * 0.36} height={h * 0.04}
              fill="#7A6A54" />
            {i > 0 && (
              <path fill="none" stroke="#3A3630" strokeWidth={h * 0.014}
                d={`M${px - w * 0.25},${-h * 1.42} q${w * 0.125},${h * 0.22} ${w * 0.25},0`} />
            )}
          </g>
        );
      })}
      {tank && (
        /* the plastic water tank on a timber stand, which is what no sewer looks like */
        <g transform={`translate(${w * 0.38} 0)`}>
          {[-1, 1].map((s) => (
            <rect key={s} x={s * h * 0.24 - h * 0.04} y={-h * 0.50} width={h * 0.08}
              height={h * 0.50} fill="#A8906A" />
          ))}
          <rect x={-h * 0.32} y={-h * 0.54} width={h * 0.64} height={h * 0.06}
            fill="#A8906A" />
          <ellipse cx={0} cy={-h * 0.58} rx={h * 0.28} ry={h * 0.10} fill="#3A5A78" />
          <rect x={-h * 0.28} y={-h * 0.94} width={h * 0.56} height={h * 0.36}
            fill="#4A6A88" />
          <ellipse cx={0} cy={-h * 0.94} rx={h * 0.28} ry={h * 0.10} fill="#5A7A98" />
        </g>
      )}
    </g>
  );
};

/**
 * THE PEDESTRIAN BRIDGE. This is a COMMUTE, not an event, and drawing it as drama is
 * the whole error.
 *
 * Students, workers, shoppers, grandmothers with a rolling cart. The longest lines
 * form on weekday mornings between six and nine, and the person who lives on both
 * sides has a word for themselves in El Paso, fronterizo.
 *
 * THE GEOMETRY: a narrow raised sidewalk along the outer edge of the roadway,
 * separated by a low curb and a pipe rail, with a tall mesh fence above it curving
 * INWARD at the top, so the crossing reads as a caged corridor with a strip of sky.
 * The Gateway bridge at Laredo is about 1,050 feet long and 42 feet wide with four
 * lanes and two walkways, carrying around 11,400 pedestrians a day.
 *
 * THE COLOUR DECISION THAT MAKES IT WORK: the galvanised mesh pushes everything toward
 * monochrome, so the ONLY colour in the frame is the people and what they are
 * carrying. Put the colour there deliberately. Everyone carries something.
 *
 * And compose for the river underneath, which is much narrower than a first-time
 * viewer expects.
 */
export const PedestrianBridge: React.FC<TejanoProps & {
  h?: number; w?: number; queue?: number; canopy?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 130, wear = 0.4, night = false,
       h = 200, w = 1080, queue = 12, canopy = true}) => {
  const L = useLight();
  const K = fit('pedestrianBridge', h);
  const mesh = tones('#9AA0A2', L);
  const CARRY = ['#C42A34', '#2A78C4', '#3F9A4A', '#E8C42C', '#8A4AA8', '#E8892C'];

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <rect x={-w / 2} y={-h * 0.06} width={w} height={h * 0.10} fill="#B0ACA4" />
      {/* the low curb and the pipe rail separating the walkway from the roadway */}
      <rect x={-w / 2} y={-h * 0.16} width={w} height={h * 0.10} fill="#C4C0B8" />
      <line x1={-w / 2} y1={-h * 0.36} x2={w / 2} y2={-h * 0.36} stroke={mesh.core}
        strokeWidth={h * 0.020} />
      {/* THE CAGE: mesh to a good height, CURVING INWARD at the top */}
      <path fill="none" stroke={mesh.shade} strokeWidth={h * 0.024} d={
        `M${-w / 2},${-h * 0.16} L${-w / 2},${-h * 0.86} Q${-w / 2},${-h * 1.02} ${-w * 0.42},${-h * 1.04}`} />
      <path fill="none" stroke={mesh.shade} strokeWidth={h * 0.024} d={
        `M${w / 2},${-h * 0.16} L${w / 2},${-h * 0.86} Q${w / 2},${-h * 1.02} ${w * 0.42},${-h * 1.04}`} />
      {Array.from({length: 46}, (_, i) => {
        const px = -w / 2 + i * (w / 45);
        return (
          <line key={i} x1={px} y1={-h * 0.16} x2={px} y2={-h * 0.96}
            stroke={mesh.core} strokeWidth={h * 0.006} opacity={0.55} />
        );
      })}
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={-w / 2} y1={-h * (0.24 + i * 0.09)} x2={w / 2}
          y2={-h * (0.24 + i * 0.09)} stroke={mesh.core} strokeWidth={h * 0.006}
          opacity={0.45} />
      ))}
      {canopy && (
        <rect x={-w * 0.30} y={-h * 1.10} width={w * 0.60} height={h * 0.05}
          fill="#8A8F8C" />
      )}
      {/* THE QUEUE. Single file, and every person carrying something. The only
          colour in an otherwise monochrome frame goes here, deliberately. */}
      {Array.from({length: queue}, (_, i) => {
        const f = i / Math.max(1, queue - 1);
        const px = -w * 0.42 + f * w * 0.84;
        const s = 1 - f * 0.30;
        const carry = CARRY[Math.floor(rnd(seed, i) * CARRY.length)];
        const child = rnd(seed, 40 + i) > 0.78;
        return (
          <g key={i} transform={`translate(${px} ${-h * 0.16}) scale(${s})`}>
            <rect x={-h * 0.05} y={-h * 0.34} width={h * 0.10} height={h * 0.34}
              fill={['#3A4A5E', '#5A4A3E', '#4E5A4A', '#6A4A5A'][i % 4]} />
            <circle cx={0} cy={-h * 0.38} r={h * 0.045} fill="#a8825e" />
            {/* what they are carrying, which is where the colour lives */}
            <rect x={h * 0.05} y={-h * 0.22} width={h * 0.08} height={h * 0.11}
              fill={carry} />
            {rnd(seed, 60 + i) > 0.6 && (
              /* a rolling cart, which is the most common thing on that walkway */
              <g>
                <rect x={-h * 0.16} y={-h * 0.20} width={h * 0.09} height={h * 0.14}
                  fill={CARRY[(i + 2) % CARRY.length]} />
                <circle cx={-h * 0.115} cy={-h * 0.03} r={h * 0.022} fill="#2A2622" />
              </g>
            )}
            {child && (
              /* a hand held by a smaller hand */
              <g transform={`translate(${-h * 0.10} ${h * 0.0}) scale(0.62)`}>
                <rect x={-h * 0.05} y={-h * 0.34} width={h * 0.10} height={h * 0.34}
                  fill="#6A5A7A" />
                <circle cx={0} cy={-h * 0.38} r={h * 0.045} fill="#a8825e" />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/**
 * THE ESCARAMUZA RIDER. Eight women riding SIDESADDLE in matched dresses, executing
 * synchronised crossings at speed inside a round arena.
 *
 * This is the only women's event in charreria and it is dangerous, and the name means
 * skirmish, after the Adelitas who rode out to raise a dust cloud so the attack could
 * come from somewhere else. It is not a costume parade and it is not a rodeo queen
 * wave.
 *
 * THE SADDLE IS THE WHOLE THING AND EVERYTHING FOLLOWS FROM IT. The albarda is a cut
 * down charro saddle with two leg restraints, so BOTH LEGS SIT ON THE NEAR SIDE while
 * the rider's spine stays VERTICAL and her shoulders stay SQUARE through a hard turn.
 * Drawing her leaning is drawing a different sport.
 *
 * THE DRESS opens into a bell in motion, long enough to cover the horse's haunches,
 * over several ruffled petticoats. All eight riders identical, one team colour.
 *
 * THE REAL VISUAL IS THE DUST: a pale ochre cloud raised to horse-chest height and lit
 * from behind.
 */
export const EscaramuzaRider: React.FC<TejanoProps & {
  h?: number; colour?: string; horse?: string; dust?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 131, facing = 1, h = 160,
       colour = '#A8202C', horse = '#4A3428', dust = true, frame = 0}) => {
  const L = useLight();
  const K = fit('escaramuza', h);
  const dress = tones(colour, L);
  const coat = tones(horse, L);
  const gait = Math.sin(frame / 5) * h * 0.03;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {dust && (
        <g>
          {Array.from({length: 10}, (_, i) => (
            <ellipse key={i} cx={-h * (0.5 + rnd(seed, i) * 1.4)}
              cy={-h * (0.06 + rnd(seed, 20 + i) * 0.34)}
              rx={h * (0.18 + rnd(seed, 40 + i) * 0.26)}
              ry={h * (0.10 + rnd(seed, 60 + i) * 0.14)}
              fill="#D8C69A" opacity={0.18 + rnd(seed, 80 + i) * 0.18} />
          ))}
        </g>
      )}
      {/* the horse, at a run, with the legs gathered */}
      <g transform={`translate(0 ${gait})`}>
        <path fill={coat.core} d={
          `M${-h * 0.72},${-h * 0.60} L${h * 0.52},${-h * 0.64}` +
          ` Q${h * 0.70},${-h * 0.60} ${h * 0.66},${-h * 0.40}` +
          ` L${h * 0.58},${-h * 0.16} L${h * 0.42},${-h * 0.16} L${h * 0.44},${-h * 0.38}` +
          ` L${-h * 0.48},${-h * 0.36} L${-h * 0.50},${-h * 0.14} L${-h * 0.66},${-h * 0.14}` +
          ` Q${-h * 0.80},${-h * 0.38} ${-h * 0.72},${-h * 0.60} Z`} />
        <path fill={coat.core} d={
          `M${h * 0.52},${-h * 0.62} L${h * 0.82},${-h * 0.86}` +
          ` Q${h * 0.94},${-h * 0.94} ${h * 0.98},${-h * 0.78}` +
          ` L${h * 0.94},${-h * 0.56} L${h * 0.78},${-h * 0.52} Z`} />
        <path fill={coat.shade} d={`M${h * 0.86},${-h * 0.90} l${h * 0.05},${-h * 0.10} l${h * 0.04},${h * 0.09} Z`} />
        <path fill={coat.shade} d={
          `M${-h * 0.72},${-h * 0.56} q${-h * 0.24},${h * 0.16} ${-h * 0.18},${h * 0.44}`} />
        {/* the mane and the tail, both streaming */}
        <path fill="none" stroke={coat.shade} strokeWidth={h * 0.05}
          d={`M${h * 0.50},${-h * 0.68} q${-h * 0.14},${-h * 0.10} ${-h * 0.34},${-h * 0.04}`} />
      </g>
      {/* THE RIDER: spine VERTICAL, shoulders SQUARE, both legs on the near side */}
      <g transform={`translate(${h * 0.10} ${-h * 0.60 + gait})`}>
        {/* the dress, opening into a bell over the haunches */}
        <path fill={dress.core} d={
          `M${-h * 0.10},${-h * 0.30} L${h * 0.10},${-h * 0.30}` +
          ` Q${h * 0.46},${h * 0.10} ${h * 0.30},${h * 0.44}` +
          ` L${-h * 0.44},${h * 0.44} Q${-h * 0.46},${h * 0.06} ${-h * 0.10},${-h * 0.30} Z`} />
        {/* the ruffled petticoats showing at the hem */}
        {Array.from({length: 3}, (_, i) => (
          <path key={i} fill={i % 2 ? '#F0ECE0' : dress.base} d={
            `M${-h * 0.42 + i * h * 0.02},${h * (0.44 - i * 0.06)}` +
            ` Q0,${h * (0.52 - i * 0.06)} ${h * 0.30},${h * (0.44 - i * 0.06)}` +
            ` L${h * 0.30},${h * (0.40 - i * 0.06)} Q0,${h * (0.48 - i * 0.06)} ${-h * 0.42},${h * (0.40 - i * 0.06)} Z`} />
        ))}
        <rect x={-h * 0.09} y={-h * 0.52} width={h * 0.18} height={h * 0.24}
          fill={dress.core} />
        {/* the wide ribbon bow at the throat */}
        <path fill={dress.base} d={
          `M${-h * 0.07},${-h * 0.50} l${h * 0.07},${h * 0.04} l${h * 0.07},${-h * 0.04}` +
          ` l0,${h * 0.05} l${-h * 0.14},0 Z`} />
        <circle cx={0} cy={-h * 0.58} r={h * 0.055} fill="#a8825e" />
        {/* the felt charro hat, moderate brim and a LOW crown */}
        <ellipse cx={0} cy={-h * 0.63} rx={h * 0.15} ry={h * 0.030} fill="#3A2E22" />
        <path fill="#3A2E22" d={
          `M${-h * 0.07},${-h * 0.64} L${-h * 0.06},${-h * 0.74} L${h * 0.06},${-h * 0.74} L${h * 0.07},${-h * 0.64} Z`} />
      </g>
    </g>
  );
};

/**
 * THE SEVEN POINTED STAR PINATA, which is the older and stranger object and which
 * almost nobody outside the culture draws.
 *
 * Its seven points were read as the seven deadly sins, the blindfold as faith, and
 * the stick as the thing that breaks them, an adaptation Augustinian friars made at
 * Acolman in 1586 to teach with. That is a far better thing to draw than a licensed
 * character, which is also what most kids actually got and is also somebody's
 * property.
 *
 * THE SURFACE IS THE DRAWING. Every inch is fringed tissue glued in overlapping
 * horizontal rows, each row's fringe hanging over the row below, so the whole object
 * reads as SHAGGY TEXTURE rather than as smooth colour. A clean flat-coloured star is
 * a paper decoration.
 *
 * The cones are spaced so no two read as a simple axis, and each is usually a
 * different colour with a foil tassel at the tip.
 */
export const StarPinata: React.FC<TejanoProps & {
  h?: number; cones?: number; swing?: number; rows?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 132, h = 120, cones = 7, swing = 0,
       rows = 6, frame = 0}) => {
  const K = fit('pinataStar', h);
  const COL = ['#D4462C', '#E8C42C', '#3F9A4A', '#2A78C4', '#C4409A', '#E8892C', '#F0ECE0'];
  const sway = Math.sin(frame / 17) * 8 * swing;
  const core = h * 0.28;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale}) rotate(${sway})`}>
      {/* the rope over a branch */}
      <line x1={0} y1={-h * 2.4} x2={0} y2={-core * 1.1} stroke="#B4A88C"
        strokeWidth={h * 0.020} />
      {Array.from({length: cones}, (_, i) => {
        /* spaced so no two read as a simple axis */
        const a = (i / cones) * Math.PI * 2 + rnd(seed, i) * 0.5;
        const len = core * (2.4 + rnd(seed, 20 + i) * 0.5);
        const col = COL[i % COL.length];
        const tipx = Math.cos(a) * len, tipy = Math.sin(a) * len;
        return (
          <g key={i}>
            <path fill={col} d={
              `M${Math.cos(a - 0.34) * core},${Math.sin(a - 0.34) * core}` +
              ` L${tipx},${tipy}` +
              ` L${Math.cos(a + 0.34) * core},${Math.sin(a + 0.34) * core} Z`} />
            {/* THE FRINGE ROWS, each hanging over the one below */}
            {Array.from({length: rows}, (_, r) => {
              const f = r / rows;
              const rr = core + (len - core) * f;
              const spread = 0.34 * (1 - f * 0.8);
              return (
                <path key={r} fill={r % 2 ? col : COL[(i + 3) % COL.length]}
                  opacity={0.9} d={
                    `M${Math.cos(a - spread) * rr},${Math.sin(a - spread) * rr}` +
                    ` L${Math.cos(a + spread) * rr},${Math.sin(a + spread) * rr}` +
                    ` L${Math.cos(a + spread) * (rr + core * 0.22)},${Math.sin(a + spread) * (rr + core * 0.22)}` +
                    ` L${Math.cos(a - spread) * (rr + core * 0.22)},${Math.sin(a - spread) * (rr + core * 0.22)} Z`} />
              );
            })}
            {/* the foil tassel at the tip */}
            {Array.from({length: 5}, (_, k) => (
              <line key={k} x1={tipx} y1={tipy}
                x2={tipx + Math.cos(a + (k - 2) * 0.22) * core * 0.5}
                y2={tipy + Math.sin(a + (k - 2) * 0.22) * core * 0.5}
                stroke="#D8C060" strokeWidth={h * 0.012} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
      {/* the core, fringed the same way */}
      <circle cx={0} cy={0} r={core} fill={COL[0]} />
      {Array.from({length: 5}, (_, r) => (
        <path key={r} fill={COL[(r + 2) % COL.length]} opacity={0.92} d={
          `M${-core},${-core + r * core * 0.4} L${core},${-core + r * core * 0.4}` +
          ` L${core},${-core + r * core * 0.4 + core * 0.28} L${-core},${-core + r * core * 0.4 + core * 0.28} Z`} />
      ))}
      <circle cx={0} cy={0} r={core} fill="none" stroke={INK} strokeWidth={h * 0.008}
        opacity={0.3} />
    </g>
  );
};

/**
 * THE COMAL. Nobody wrote the recipe down and the measurements were a handful of this.
 *
 * THE IMPERFECTION IS THE ENTIRE POINT. A rolled tortilla is an imperfect circle seven
 * to ten inches across, and a MACHINE-ROUND one reads as store-bought instantly. On
 * heat it inflates into a dome then relaxes, and it takes brown blisters in a
 * SCATTERED pattern, never an even toast.
 *
 * The comal is seasoned to a matte near-black with lighter concentric rings where the
 * flame hits, and the finished stack goes into a folded cloth towel.
 *
 * Which tortilla is in the pan quietly says which family you are looking at: flour is
 * the South Texas and border default at home, corn is more central Mexican and more
 * common in Houston's newer communities.
 */
export const Comal: React.FC<TejanoProps & {
  h?: number; puff?: number; stack?: number; corn?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 133, h = 90, puff = 0.5, stack = 4,
       corn = false, frame = 0}) => {
  const L = useLight();
  // The comal disc spans h * 1.20 across in this local frame, and that is what is fitted.
  const K = fit('comal', h * 1.2);
  const r = h * (corn ? 0.34 : 0.46);
  const rise = puff * (0.5 + 0.5 * Math.sin(frame / 11));

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {/* the gas flame at the edges of the frame */}
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <path key={i} fill="#4A78D8" opacity={0.75} d={
            `M${Math.cos(a) * h * 0.30},${h * 0.16 + Math.sin(a) * h * 0.08}` +
            ` l${h * 0.03},${-h * 0.09} l${h * 0.03},${h * 0.09} Z`} />
        );
      })}
      {/* the comal: seasoned near-black with lighter CONCENTRIC RINGS */}
      <ellipse cx={0} cy={0} rx={h * 0.60} ry={h * 0.20} fill="#1E1C1A" />
      {[0.72, 0.48, 0.26].map((f, i) => (
        <ellipse key={i} cx={0} cy={0} rx={h * 0.60 * f} ry={h * 0.20 * f} fill="none"
          stroke="#3A3430" strokeWidth={h * 0.012} opacity={0.7} />
      ))}
      {/* THE TORTILLA. An imperfect circle, and the imperfection is the point. */}
      <path fill="#F0E4CC" d={
        Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          const rr = r * (0.92 + rnd(seed, i) * 0.16);
          return `${i ? 'L' : 'M'}${Math.cos(a) * rr},${Math.sin(a) * rr * 0.34 - rise * h * 0.06}`;
        }).join(' ') + ' Z'} />
      {/* the dome as it inflates */}
      {rise > 0.2 && (
        <ellipse cx={0} cy={-rise * h * 0.10} rx={r * 0.62} ry={r * 0.26 * rise}
          fill="#F6EDD8" />
      )}
      {/* the blisters: SCATTERED, three or four near-black, never an even toast */}
      {Array.from({length: 11}, (_, i) => (
        <ellipse key={i} cx={(rnd(seed, 40 + i) - 0.5) * r * 1.5}
          cy={(rnd(seed, 60 + i) - 0.5) * r * 0.5 - rise * h * 0.06}
          rx={r * (0.06 + rnd(seed, 80 + i) * 0.07)}
          ry={r * (0.024 + rnd(seed, 100 + i) * 0.03)}
          fill={i < 3 ? '#3A2A18' : '#A8763C'} opacity={0.85} />
      ))}
      {stack > 0 && (
        /* the finished ones, in a folded printed cloth towel */
        <g transform={`translate(${h * 0.9} ${h * 0.05})`}>
          <ellipse cx={0} cy={0} rx={r * 0.9} ry={r * 0.34} fill="#C8A8B8" />
          {Array.from({length: stack}, (_, i) => (
            <ellipse key={i} cx={(rnd(seed, 120 + i) - 0.5) * r * 0.1}
              cy={-i * r * 0.05} rx={r * 0.68} ry={r * 0.24} fill="#F0E4CC" />
          ))}
          <path fill="#C8A8B8" opacity={0.85} d={
            `M${-r * 0.9},0 q${r * 0.4},${-r * 0.5} ${r * 0.5},${-r * 0.42}` +
            ` l${-r * 0.2},${r * 0.1} q${-r * 0.5},${-r * 0.02} ${-r * 0.3},${r * 0.32} Z`} />
        </g>
      )}
    </g>
  );
};

/**
 * THE PHOTOGRAPH WALL. Draw this first in any grandmother's front room, because it is
 * the strongest single element in the beat.
 *
 * Fifteen to forty frames in MISMATCHED sizes and finishes, hung tight with small
 * gaps, spanning a whole wall, with the oldest and most formal portraits largest and
 * near the centre and school photographs ringing outward in rows by age. It is a
 * family archive hung on a nail rather than kept in a box.
 *
 * Beside it, the home altar: a low shelf with a framed figure, one or two small
 * santos, a crucifix and votive candles in tall glass jars, with a doily under
 * everything.
 *
 * THE DETAIL THAT PROVES THE ARTIST KNEW: a palm frond tucked behind the wall
 * crucifix from last Palm Sunday.
 *
 * The light that makes the room read as real is one cold white spill from the
 * fluorescent kitchen through the doorway, against the warm room.
 */
export const PhotoWall: React.FC<TejanoProps & {
  h?: number; w?: number; frames?: number; altar?: boolean; kitchenSpill?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 134, wear = 0.2, h = 260, w = 420,
       frames = 26, altar = true, kitchenSpill = true}) => {
  const L = useLight();
  const K = fit('photoWall', h);
  const wall = tones('#E6DEC8', L);
  const GOLD = ['#B49A5E', '#7A5A3C', '#3A3630', '#C8C4B8'];

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={wall.core} />
      {Array.from({length: frames}, (_, i) => {
        // the oldest and most formal are LARGEST and near the centre
        const ring = Math.floor(Math.sqrt(i) * 1.2);
        const a = (i * 2.399);   // a spiral, so it packs tight without a grid
        const rr = ring * h * 0.11;
        const fx = Math.cos(a) * rr * 1.6;
        const fy = -h * 0.56 + Math.sin(a) * rr;
        const big = ring < 2;
        const fw = h * (big ? 0.16 : 0.09) * (0.8 + rnd(seed, i) * 0.5);
        const fh = fw * (1.1 + rnd(seed, 20 + i) * 0.4);
        return (
          <g key={i} transform={`translate(${fx} ${fy}) rotate(${(rnd(seed, 40 + i) - 0.5) * 3})`}>
            <rect x={-fw / 2} y={-fh / 2} width={fw} height={fh}
              fill={GOLD[i % GOLD.length]} />
            <rect x={-fw * 0.40} y={-fh * 0.40} width={fw * 0.80} height={fh * 0.80}
              fill={big ? '#C8BCA4' : '#9AA8B0'} />
            {/* the figures inside, as pale blocks. Never faces at this scale. */}
            <ellipse cx={0} cy={-fh * 0.14} rx={fw * 0.14} ry={fw * 0.16}
              fill="#D8CCB8" />
            <path fill="#8A8478" d={
              `M${-fw * 0.24},${fh * 0.36} q${fw * 0.24},${-fh * 0.30} ${fw * 0.48},0 Z`} />
          </g>
        );
      })}
      {altar && (
        <g transform={`translate(${w * 0.30} ${-h * 0.10})`}>
          <rect x={-h * 0.16} y={-h * 0.05} width={h * 0.32} height={h * 0.03}
            fill="#7A5A3C" />
          {/* the doily under everything */}
          <ellipse cx={0} cy={-h * 0.05} rx={h * 0.15} ry={h * 0.02} fill="#F0ECE0" />
          <rect x={-h * 0.05} y={-h * 0.22} width={h * 0.10} height={h * 0.17}
            fill="#B49A5E" />
          <rect x={-h * 0.035} y={-h * 0.205} width={h * 0.07} height={h * 0.14}
            fill="#6A7A94" />
          {Array.from({length: 3}, (_, i) => (
            <g key={i} transform={`translate(${-h * 0.11 + i * h * 0.11} 0)`}>
              <rect x={-h * 0.018} y={-h * 0.11} width={h * 0.036} height={h * 0.06}
                fill="#F0C060" opacity={0.9} />
              <circle cx={0} cy={-h * 0.10} r={h * 0.012} fill="#FFE8A0" />
            </g>
          ))}
          {/* THE CRUCIFIX with the palm frond behind it from last Palm Sunday */}
          <g transform={`translate(0 ${-h * 0.32})`}>
            <path fill="#7A9A4A" d={`M${-h * 0.02},${-h * 0.02} q${-h * 0.05},${-h * 0.05} ${-h * 0.03},${-h * 0.09}`}
              stroke="#7A9A4A" strokeWidth={h * 0.008} />
            <rect x={-h * 0.008} y={-h * 0.07} width={h * 0.016} height={h * 0.10}
              fill="#5A4433" />
            <rect x={-h * 0.030} y={-h * 0.052} width={h * 0.060} height={h * 0.014}
              fill="#5A4433" />
          </g>
        </g>
      )}
      {kitchenSpill && (
        /* the one COLD white spill through the doorway, against the warm room */
        <path fill="#D8E8E4" opacity={0.20} d={
          `M${-w / 2},${-h * 0.90} L${-w * 0.30},${-h * 0.90}` +
          ` L${-w * 0.16},0 L${-w / 2},0 Z`} />
      )}
    </g>
  );
};
