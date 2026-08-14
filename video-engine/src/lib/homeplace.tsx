import React from 'react';
import {useUid} from './uid';
import {tones, useLight, INK, RustStreak, CalicheDust, Galvanized} from './lighting';
import {matFill} from './materials';
import {fitter, rnd} from './scale';

// =============================================================================
// HOMEPLACE — the house, the yard and the things kept in full view of the street.
//
// THE ARGUMENT THIS MODULE MAKES, AND IT IS THE WHOLE POINT
//
// Illustrators reach for a Victorian or a farmhouse and skip the 1970s brick ranch
// with the arched entry, which is where the largest number of Texans actually grew
// up. It is not picturesque, and that is exactly why drawing it accurately is an act
// of recognition for several million people.
//
// THE ONE RULE THIS MODULE WILL BE JUDGED ON: the trailer house is not a punchline.
// The sagging skirting, the tyre on the roof, the junked car, the sad palette. That
// is a caricature and a great many Texans grew up inside it. The truth is that the
// house arrived on a truck and everything around it was built by hand afterward, and
// the dignity lives in exactly that gap. Somebody framed that deck. Somebody planted
// those cannas along the skirting.
//
// SO THE LIBRARY LIGHTS IT THE SAME WAY IT LIGHTS THE BRICK RANCH. The refusal to
// change the lighting is the entire argument, and it is enforced here by
// construction: every house in this module goes through the same `useLight()` and
// takes the same `wear` default, so there is no dial that makes one of them shabby.
//
// A GARAGE HIDES AND A CARPORT SHOWS. They are different pieces of social equipment.
// The carport is where the second freezer, the washing machine and the work bench
// live in full view of the street, so it is the part of a house that tells the block
// how you are doing. If the drawing has a closed door on it the meaning is gone.
//
// AND THE GROUND: Texas dirt is not one brown. Red-orange in the east, a pale grey
// tan clay in the Blackland belt, bleached buff caliche in the Hill Country and South
// Texas. `soil` is a prop for that reason.
// =============================================================================

export const HOME_M: Record<string, {h: number; note: string}> = {
  brickRanch: {h: 4.6, note: 'a single storey brick ranch, grade to the ridge'},
  entryArch: {h: 2.6, note: 'the masonry entry arch opening, grade to the crown'},
  carport: {h: 2.7, note: 'a carport eave, deliberately lower than the house roof'},
  chestFreezer: {h: 0.88, note: 'a chest deep freeze, floor to the closed lid'},
  windowUnit: {h: 0.38, note: 'a bedroom window air conditioner at the case'},
  pierBeam: {h: 6.2, note: 'a pier and beam frame house at the ridge'},
  trailerHouse: {h: 3.6, note: 'a post-1976 single wide on piers, grade to the ridge'},
  chainLink: {h: 1.2, note: 'a back yard chain link fabric, four feet is a front yard'},
  propaneTank: {h: 1.15, note: 'a 500 gallon domestic tank at the top of the shell'},
  clothesline: {h: 1.9, note: 'a galvanised T post clothesline at the top wire'},
  agPool: {h: 1.25, note: 'an above ground pool wall, 48 to 52 inches'},
  porchGlider: {h: 0.86, note: 'a two person glider at the top of the back'},
  pecanYard: {h: 22, note: 'a yard pecan, which is the tree the whole lot is planned around'},
  satelliteDish: {h: 2.4, note: 'a 1980s mesh dish on its mount, at the rim top'},
  burnBarrel: {h: 0.88, note: 'a 55 gallon drum standing open'},
  washateria: {h: 4.2, note: 'a washateria storefront at the parapet'},
};

const fit = fitter(HOME_M);

export interface HomeProps {
  x?: number; y?: number; scale?: number; seed?: number; wear?: number;
  facing?: 1 | -1;
  night?: boolean;
  /**
   * THE GROUND IS NOT ONE BROWN, and dust on a truck should match the county it is
   * in. 'east' is red-orange iron, 'blackland' a pale grey tan clay, 'caliche' the
   * bleached buff of the Hill Country and South Texas.
   */
  soil?: 'east' | 'blackland' | 'caliche' | 'panhandle';
}

const SOIL: Record<NonNullable<HomeProps['soil']>, string> = {
  east: '#A85D3C', blackland: '#8A8378', caliche: '#D2C4A4', panhandle: '#B49A78',
};

/**
 * THE 1970s BRICK RANCH, with the arch. The house on the birthday party invitation.
 *
 * The silhouette is emphatically HORIZONTAL, three to five times wider than tall,
 * with a shallow roof. The whole front is brick veneer with a soldier course over the
 * windows, and the entry mass steps FORWARD a foot or two so the arch throws a deep
 * shadow. Behind the arch is a small stoop, so the arch reads as a black void with a
 * warmer colour deep inside it, and that void is the composition.
 *
 * Two details that are true and that illustrators clean up: the shutters are
 * DECORATIVE and too narrow to ever cover the window, and the house sits on a SLAB,
 * so there is no crawl space and no steps except one at the door.
 *
 * `brick` carries the era. Salmon-pink to peach dates it hard to the late seventies
 * and eighties. Red-brown with wide white mortar is the Dallas and Fort Worth
 * default. Pale sand or buff is Houston and San Antonio.
 */
export const BrickRanch: React.FC<HomeProps & {
  h?: number; w?: number; brick?: string; arch?: 'round' | 'segmental' | 'none';
  garage?: boolean; coachLamp?: boolean; shutters?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 101, wear = 0.3, facing = 1, night = false,
       h = 130, w = 520, brick = '#A8664C', arch = 'round', garage = true,
       coachLamp = true, shutters = true}) => {
  const L = useLight();
  const K = fit('brickRanch', h);
  const b = tones(brick, L);
  const trim = tones('#EDE8DC', L);
  const roof = tones('#4A4A46', L);
  const archW = h * 0.52, archH = h * 0.74;
  const archX = -w * 0.06;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <g>
        <rect x={-w / 2} y={-h * 0.74} width={w} height={h * 0.74} fill={b.core} />
        <rect x={-w / 2} y={-h * 0.74} width={w} height={h * 0.74}
          fill={matFill('granite')} opacity={0.55} />
        {/* the mortar grid, which is what makes brick read as brick at distance */}
        {Array.from({length: 16}, (_, i) => (
          <line key={i} x1={-w / 2} y1={-h * 0.72 + i * h * 0.046} x2={w / 2}
            y2={-h * 0.72 + i * h * 0.046} stroke="#DCD2C4" strokeWidth={h * 0.007}
            opacity={0.55} />
        ))}
      </g>
      <path fill={roof.core} d={
        `M${-w / 2 - w * 0.03},${-h * 0.74} L${-w * 0.20},${-h} L${w * 0.20},${-h}` +
        ` L${w / 2 + w * 0.03},${-h * 0.74} Z`} />
      <rect x={-w / 2 - w * 0.03} y={-h * 0.78} width={w * 1.06} height={h * 0.045}
        fill={trim.core} />
      {/* THE ENTRY MASS STEPS FORWARD, which is what throws the shadow */}
      {arch !== 'none' && (
        <g>
          <rect x={archX - archW * 0.85} y={-h * 0.80} width={archW * 1.7}
            height={h * 0.80} fill={b.base} />
          <rect x={archX - archW * 0.85} y={-h * 0.80} width={archW * 1.7}
            height={h * 0.80} fill={matFill('granite')} opacity={0.45} />
          {/* the void. Deep, dark, and warmer inside it at night. */}
          <path fill={night ? '#3A2E22' : '#231E1A'} d={
            arch === 'round'
              ? `M${archX - archW / 2},0 L${archX - archW / 2},${-archH + archW / 2}` +
                ` A${archW / 2},${archW / 2} 0 0 1 ${archX + archW / 2},${-archH + archW / 2}` +
                ` L${archX + archW / 2},0 Z`
              : `M${archX - archW / 2},0 L${archX - archW / 2},${-archH + archW * 0.18}` +
                ` Q${archX},${-archH} ${archX + archW / 2},${-archH + archW * 0.18}` +
                ` L${archX + archW / 2},0 Z`} />
          {/* the door, deep inside, which is the only warm thing in the void */}
          <rect x={archX - archW * 0.22} y={-archH * 0.76} width={archW * 0.44}
            height={archH * 0.76} fill={night ? '#8A6A3C' : '#5A4632'} />
        </g>
      )}
      {/* the wide low window, few and large */}
      <g>
        <rect x={-w * 0.44} y={-h * 0.58} width={w * 0.24} height={h * 0.30}
          fill={night ? '#F2DFA8' : '#4A5560'} stroke={trim.core}
          strokeWidth={h * 0.014} />
        {shutters && [-1, 1].map((s) => (
          /* DECORATIVE, and too narrow to ever close. Drawing them wide is the tell. */
          <rect key={s} x={-w * 0.32 + s * w * 0.145 - w * 0.024} y={-h * 0.58}
            width={w * 0.048} height={h * 0.30} fill="#3F5A4A" />
        ))}
      </g>
      {garage && (
        <g>
          {/* the garage door takes a THIRD of the front elevation */}
          <rect x={w * 0.10} y={-h * 0.62} width={w * 0.34} height={h * 0.62}
            fill={trim.core} stroke={b.shade} strokeWidth={h * 0.012} />
          {Array.from({length: 4}, (_, r) =>
            Array.from({length: 4}, (_, c) => (
              <rect key={`${r}${c}`} x={w * 0.12 + c * w * 0.082} y={-h * 0.58 + r * h * 0.145}
                width={w * 0.070} height={h * 0.118} fill="none" stroke={trim.shade}
                strokeWidth={h * 0.008} />
            )))}
        </g>
      )}
      {coachLamp && (
        <g transform={`translate(${archX + archW * 0.78} ${-h * 0.48})`}>
          <rect x={-h * 0.006} y={0} width={h * 0.012} height={h * 0.06} fill="#22201E" />
          <path fill={night ? '#F0C878' : '#2E2A26'} stroke="#22201E"
            strokeWidth={h * 0.008}
            d={`M${-h * 0.032},0 L${-h * 0.024},${-h * 0.07} L${h * 0.024},${-h * 0.07} L${h * 0.032},0 Z`} />
          {night && (
            <ellipse cx={0} cy={-h * 0.03} rx={h * 0.14} ry={h * 0.12} fill="#F0C878"
              opacity={0.18} />
          )}
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.18} w={w} h={h * 0.18}
        opacity={wear * 0.35} />}
    </g>
  );
};

/**
 * THE CARPORT, and the freezer under it.
 *
 * A shallow shed or low gable, DELIBERATELY LOWER than the house roof so the house
 * still reads as the taller mass, carried on three or four posts down the OUTER EDGE
 * only, the inner edge on the house wall. That asymmetry is why it reads as a lean-to
 * rather than a building.
 *
 * The posts date it precisely. Ornamental wrought iron with an S-curve or grapevine
 * scroll reads 1955 to 1972 and pairs with a low ranch house. A plain four by four
 * with a beam reads 1975 onward and also reads rural or self-built.
 *
 * THE FREEZER IS A CLASS FACT AND WORTH DRAWING RIGHT. A second freezer means the
 * household buys meat by the half animal or fills it from a deer or a garden, so it
 * is a record of how a family eats. Its top is ALWAYS covered in other things, there
 * is a heavy extension cord running to it, and there is a list taped to the lid in
 * somebody's handwriting.
 */
export const Carport: React.FC<HomeProps & {
  h?: number; w?: number; iron?: boolean; freezer?: boolean; oilStain?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 102, wear = 0.35, facing = 1, night = false,
       h = 80, w = 260, iron = true, freezer = true, oilStain = true}) => {
  const L = useLight();
  const K = fit('carport', h);
  const post = tones(iron ? '#22201E' : '#EDE8DC', L);
  const deck = tones('#E4E0D4', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={0} width={w} height={h * 0.10} fill="#B4B0A8" />
      {oilStain && (
        <ellipse cx={-w * 0.08} cy={h * 0.05} rx={w * 0.10} ry={h * 0.035}
          fill="#2A2622" opacity={0.4} />
      )}
      {/* the deck: a shallow shed, LOWER than the house, with an exposed underside */}
      <path fill={deck.shade} d={
        `M${-w / 2 - w * 0.02},${-h} L${w / 2 + w * 0.02},${-h * 0.90}` +
        ` L${w / 2 + w * 0.02},${-h * 0.84} L${-w / 2 - w * 0.02},${-h * 0.94} Z`} />
      <rect x={-w / 2 - w * 0.02} y={-h * 0.94} width={w * 1.04} height={h * 0.05}
        fill={deck.core} />
      {Array.from({length: 3}, (_, i) => {
        const px = -w * 0.42 + i * w * 0.42;
        const ph = h * (0.92 - i * 0.02);
        return (
          <g key={i}>
            <rect x={px - h * 0.020} y={-ph} width={h * 0.040} height={ph}
              fill={post.core} />
            {iron && (
              /* the S-curve scroll bracket at the top, which is the era in one shape */
              <path fill="none" stroke={post.core} strokeWidth={h * 0.020}
                d={`M${px},${-ph + h * 0.10} q${h * 0.10},${-h * 0.02} ${h * 0.13},${-h * 0.10}` +
                   ` M${px},${-ph + h * 0.10} q${-h * 0.10},${-h * 0.02} ${-h * 0.13},${-h * 0.10}`} />
            )}
            {wear > 0.4 && (
              <rect x={px - h * 0.024} y={-h * 0.08} width={h * 0.048} height={h * 0.08}
                fill="#8A5A34" opacity={wear * 0.6} />
            )}
          </g>
        );
      })}
      {freezer && (
        <g transform={`translate(${w * 0.30} 0)`}>
          <ChestFreezer x={0} y={0} scale={1} seed={seed + 7} night={night} />
        </g>
      )}
      {night && (
        <>
          {/* one bare bulb or a single fluorescent tube on the roof deck underside */}
          <rect x={-w * 0.06} y={-h * 0.86} width={w * 0.20} height={h * 0.020}
            fill="#F6F0DC" />
          <ellipse cx={w * 0.04} cy={-h * 0.44} rx={w * 0.34} ry={h * 0.46}
            fill="#F6F0DC" opacity={0.10} />
        </>
      )}
    </g>
  );
};

/** THE CHEST DEEP FREEZE. A low white box on a piano hinge, wider than it is tall,
 *  with a chrome latch handle at the front centre, one indicator lamp, and a
 *  handwritten list taped to the lid. Its top is never clear.
 *
 *  `open` is the shot worth having: the lid up in a dim garage, cold fog spilling
 *  over the rim, and the freezer becoming the only light source in the frame. */
export const ChestFreezer: React.FC<HomeProps & {
  h?: number; open?: boolean; clutter?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 103, wear = 0.25, night = false,
       h = 60, open = false, clutter = 3}) => {
  const L = useLight();
  const K = fit('chestFreezer', h);
  const box = tones('#EFEDE6', L);
  const w = h * 1.62;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx={h * 0.03} fill={box.core} />
      <rect x={-w / 2} y={-h * 0.08} width={w} height={h * 0.08} fill={box.shade} />
      {open ? (
        <g>
          {/* the lid up on its hinge, and the cold fog rolling over the rim */}
          <path fill={box.base} d={
            `M${-w / 2},${-h} L${-w / 2 + h * 0.20},${-h * 1.68}` +
            ` L${w / 2 + h * 0.20},${-h * 1.68} L${w / 2},${-h} Z`} />
          <rect x={-w / 2 + h * 0.04} y={-h * 0.98} width={w - h * 0.08} height={h * 0.10}
            fill="#B8D4E0" />
          {Array.from({length: 7}, (_, i) => (
            <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.9}
              cy={-h * 0.90 + rnd(seed, 20 + i) * h * 0.22}
              rx={h * (0.10 + rnd(seed, 40 + i) * 0.14)} ry={h * 0.05}
              fill="#DCEAF0" opacity={0.5} />
          ))}
          <rect x={-w / 2 + h * 0.04} y={-h * 0.88} width={w - h * 0.08} height={h * 0.80}
            fill="#C8DCE6" />
        </g>
      ) : (
        <g>
          <rect x={-w / 2} y={-h} width={w} height={h * 0.05} fill={box.base} />
          {/* the chrome latch, front centre */}
          <rect x={-h * 0.07} y={-h * 0.94} width={h * 0.14} height={h * 0.07}
            fill="#C4C8CC" stroke={INK} strokeWidth={h * 0.012} />
          {/* the list taped to the lid, in somebody's handwriting */}
          <rect x={w * 0.14} y={-h * 0.90} width={h * 0.30} height={h * 0.38}
            fill="#F4F0E4" transform={`rotate(${(rnd(seed, 1) - 0.5) * 6} ${w * 0.14} ${-h * 0.90})`} />
          {Array.from({length: clutter}, (_, i) => (
            <rect key={i} x={-w * 0.42 + i * w * 0.24} y={-h * 1.12}
              width={w * (0.14 + rnd(seed, 60 + i) * 0.08)} height={h * 0.14}
              fill={['#8A6A48', '#5A7A88', '#A85A44'][i % 3]} />
          ))}
        </g>
      )}
      <circle cx={-w * 0.40} cy={-h * 0.14} r={h * 0.030} fill="#D84A2A" />
      {wear > 0.2 && <RustStreak x={w * 0.36} y={-h * 0.30} w={h * 0.08} h={h * 0.30}
        opacity={wear * 0.4} />}
    </g>
  );
};

/**
 * THE WINDOW UNIT. The sound of the house, and it marks the room worth cooling,
 * which quietly ranks the rooms.
 *
 * THE DETAIL MOST DRAWINGS GET WRONG: it is set at a deliberate DOWNWARD TILT of a
 * few degrees so condensate runs out the back. Level is wrong. There is a brace under
 * it outside, a dark wet stain on the wall below, and a bare patch in the dirt at the
 * drip.
 *
 * `ribbon` ties a strip to the louver so you can see the air moving, which is the
 * cheapest possible way to animate a whole frame and is also a real thing people do.
 */
export const WindowUnit: React.FC<HomeProps & {
  h?: number; running?: boolean; ribbon?: boolean; frame?: number; era?: 'wood' | 'beige' | 'white';
}> = ({x = 0, y = 0, scale = 1, seed = 104, wear = 0.35, facing = 1, night = false,
       h = 48, running = true, ribbon = false, frame = 0, era = 'beige'}) => {
  const L = useLight();
  const K = fit('windowUnit', h);
  const body = tones(era === 'white' ? '#F0EEE8' : '#E0D8C0', L);
  const w = h * 1.6;
  const flutter = Math.sin(frame / 3.3) * 5 + Math.sin(frame / 1.7) * 2;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale}) rotate(3)`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={body.core} />
      {/* the grille: horizontal slats over the lower two thirds */}
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={-w * 0.46} y={-h * 0.72 + i * h * 0.070} width={w * 0.60}
          height={h * 0.034} fill={body.shade} opacity={0.85} />
      ))}
      {/* the adjustable vertical louvers in the middle */}
      {Array.from({length: 5}, (_, i) => (
        <rect key={i} x={w * 0.18 + i * w * 0.055} y={-h * 0.74} width={w * 0.030}
          height={h * 0.50} fill={body.shade} />
      ))}
      <rect x={w * 0.16} y={-h * 0.20} width={w * 0.28} height={h * 0.14}
        fill={body.base} />
      {[0, 1].map((i) => (
        <circle key={i} cx={w * 0.24 + i * w * 0.12} cy={-h * 0.13} r={h * 0.045}
          fill={era === 'wood' ? '#4A382A' : '#2E2A26'} />
      ))}
      {era === 'wood' && (
        <rect x={-w / 2} y={-h} width={w} height={h * 0.16} fill="#7A5638" />
      )}
      {/* the accordion side panels filling the sash gap */}
      {[-1, 1].map((s) => (
        <g key={s}>
          {Array.from({length: 9}, (_, i) => (
            <rect key={i} x={s * (w * 0.5 + i * w * 0.028)} y={-h * 0.92}
              width={w * 0.020} height={h * 0.84} fill={i % 2 ? '#C8C4B8' : '#DAD6CC'} />
          ))}
        </g>
      ))}
      {/* the brace underneath, which is a stack of scrap wood on most of them */}
      <rect x={-w * 0.20} y={h * 0.02} width={w * 0.40} height={h * 0.10}
        fill="#8A7050" />
      {/* the condensate stain, a vertical grey-green streak */}
      <rect x={-w * 0.06} y={h * 0.12} width={w * 0.10} height={h * 0.60}
        fill="#6A7268" opacity={wear * 0.4} />
      {ribbon && running && (
        <path fill="none" stroke="#D8506A" strokeWidth={h * 0.020} strokeLinecap="round"
          d={`M${w * 0.30},${-h * 0.50} q${flutter * 0.6},${h * 0.16} ${flutter},${h * 0.34}`} />
      )}
      {night && running && (
        <circle cx={w * 0.40} cy={-h * 0.13} r={h * 0.030} fill="#7ADCA0" />
      )}
      {wear > 0.3 && <RustStreak x={w * 0.30} y={-h * 0.30} w={h * 0.10} h={h * 0.30}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE PIER AND BEAM HOUSE. The gap under the floor is the whole feeling: air moves
 * under it, water runs under it, animals live under it, and a child learns early
 * which part of the yard is out of bounds.
 *
 * THE PIERS ARE NOT CONTINUOUS. They sit on six to eight foot centres, so the dark
 * band under the house is BROKEN by short vertical light gaps, and drawing a solid
 * shadow there is the tell. The skirting is almost never continuous all the way
 * around either.
 *
 * TWO COLOURS THAT DO A LOT OF WORK. The tin roof reads as alternating light and mid
 * grey bands about two and a half inches apart, streaked darker along the panel laps.
 * And the porch ceiling is often a pale blue-green, called haint blue in the Gulf
 * South, which is real and reads instantly to anyone from East Texas.
 */
export const PierBeamHouse: React.FC<HomeProps & {
  h?: number; w?: number; tin?: boolean; hauntBlue?: boolean; skirting?: 'lattice' | 'tin' | 'none';
  rain?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 105, wear = 0.45, facing = 1, night = false,
       soil = 'east', h = 200, w = 400, tin = true, hauntBlue = true,
       skirting = 'lattice', rain = false}) => {
  const L = useLight();
  const K = fit('pierBeam', h);
  const wall = tones('#EDE6D2', L);
  const roof = tones(tin ? '#A8A8A2' : '#5A5550', L);
  const lift = h * 0.11;
  const bodyH = h * 0.52;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {/* THE GAP. Genuinely near-black, and cooler and bluer than the roof shadow. */}
      <rect x={-w / 2} y={-lift} width={w} height={lift} fill="#141820" />
      {Array.from({length: 6}, (_, i) => (
        /* concrete pyramid piers, wider at the base and stepping in */
        <path key={i} fill="#9A9488" d={
          `M${-w * 0.44 + i * w * 0.176 - lift * 0.34},0` +
          ` L${-w * 0.44 + i * w * 0.176 - lift * 0.22},${-lift}` +
          ` L${-w * 0.44 + i * w * 0.176 + lift * 0.22},${-lift}` +
          ` L${-w * 0.44 + i * w * 0.176 + lift * 0.34},0 Z`} />
      ))}
      {skirting !== 'none' && Array.from({length: 3}, (_, i) => (
        /* NEVER continuous all the way around */
        <rect key={i} x={-w * 0.40 + i * w * 0.30} y={-lift * 0.92}
          width={w * 0.22} height={lift * 0.92}
          fill={skirting === 'tin' ? '#98948C' : '#8A7A5E'}
          opacity={skirting === 'lattice' ? 0.72 : 1} />
      ))}
      <g>
        <rect x={-w / 2} y={-lift - bodyH} width={w} height={bodyH} fill={wall.core} />
        <rect x={-w / 2} y={-lift - bodyH} width={w} height={bodyH}
          fill={matFill('planks')} opacity={0.5} />
      </g>
      <path fill={roof.core} d={
        `M${-w / 2 - w * 0.05},${-lift - bodyH} L0,${-h} L${w / 2 + w * 0.05},${-lift - bodyH} Z`} />
      {tin && Array.from({length: 22}, (_, i) => {
        const f = i / 21;
        return (
          <line key={i} x1={-w * 0.55 + f * w * 1.10} y1={-lift - bodyH}
            x2={-w * 0.55 + f * w * 1.10 + (f < 0.5 ? w * 0.275 : -w * 0.275) * 0}
            y2={-lift - bodyH} stroke="none" />
        );
      })}
      {tin && (
        <path fill={matFill('corrugated')} opacity={0.6} d={
          `M${-w / 2 - w * 0.05},${-lift - bodyH} L0,${-h} L${w / 2 + w * 0.05},${-lift - bodyH} Z`} />
      )}
      {/* the porch: its own shallower slope, tying in BELOW the main eave */}
      <g>
        <path fill={roof.base} d={
          `M${-w * 0.56},${-lift - bodyH * 0.94} L${-w * 0.10},${-lift - bodyH * 1.18}` +
          ` L${w * 0.10},${-lift - bodyH * 1.18} L${w * 0.56},${-lift - bodyH * 0.94}` +
          ` L${w * 0.56},${-lift - bodyH * 0.88} L${-w * 0.56},${-lift - bodyH * 0.88} Z`} />
        {hauntBlue && (
          <path fill="#9EC4BC" d={
            `M${-w * 0.56},${-lift - bodyH * 0.88} L${w * 0.56},${-lift - bodyH * 0.88}` +
            ` L${w * 0.50},${-lift - bodyH * 0.80} L${-w * 0.50},${-lift - bodyH * 0.80} Z`} />
        )}
        {[-1, 1].map((s) => (
          <rect key={s} x={s * w * 0.46 - w * 0.012} y={-lift - bodyH * 0.86}
            width={w * 0.024} height={bodyH * 0.86} fill={wall.base} />
        ))}
      </g>
      {Array.from({length: 3}, (_, i) => (
        <rect key={i} x={-w * 0.34 + i * w * 0.30} y={-lift - bodyH * 0.72}
          width={w * 0.15} height={bodyH * 0.48}
          fill={night ? '#F2DFA8' : '#3E4A54'} stroke={wall.shade}
          strokeWidth={h * 0.008} />
      ))}
      {/* the steps up to the porch, three or four of them */}
      {Array.from({length: 4}, (_, i) => (
        <rect key={i} x={-w * 0.09} y={-lift * (0.25 + i * 0.25)} width={w * 0.18}
          height={lift * 0.25} fill="#A89A80" />
      ))}
      {rain && (
        /* rain off a tin roof comes as a CURTAIN at the eave, not as drops */
        <>
          {[-1, 1].map((s) => (
            <rect key={s} x={s * w * 0.56 - w * 0.01} y={-lift - bodyH * 0.94}
              width={w * 0.02} height={lift + bodyH * 0.94} fill="#B8C8D0"
              opacity={0.55} />
          ))}
          {Array.from({length: 70}, (_, i) => (
            <line key={i} x1={rnd(seed, i) * w * 1.2 - w * 0.6}
              y1={-h - rnd(seed, 40 + i) * h * 0.3}
              x2={rnd(seed, i) * w * 1.2 - w * 0.6 - h * 0.04}
              y2={-h * 0.1 - rnd(seed, 40 + i) * h * 0.3}
              stroke="#C8D4DC" strokeWidth={1.4} opacity={0.35} />
          ))}
        </>
      )}
      <ellipse cx={0} cy={h * 0.01} rx={w * 0.60} ry={h * 0.018} fill={SOIL[soil]}
        opacity={0.5} />
    </g>
  );
};

/**
 * THE TRAILER HOUSE, drawn with its dignity intact. Read the module header first.
 *
 * THE THREE TELLS THAT COST NOTHING TO GET RIGHT and that most illustrations miss:
 *
 *   THE ROOF OVERHANG IS SHORT, often under twelve inches. Overdrawing it is the
 *   single most common error and it turns the drawing into a small house.
 *
 *   THE WINDOWS ARE ALL IDENTICAL horizontal sliders, evenly spaced, which gives the
 *   elevation a mechanical rhythm no site-built house has. Varying them is wrong.
 *
 *   THE SKIRTING'S BOTTOM EDGE FOLLOWS THE GROUND while its top edge is DEAD LEVEL,
 *   so on a sloping lot it forms a wedge that widens on the low side. Nobody draws
 *   that and everybody who has lived beside one has looked at it.
 *
 * Proportion: a post-1976 HUD-code single wide is 14 to 18 feet wide and 60 to 80
 * long, so the elevation is roughly six to one or worse, on a roof of about two or
 * three in twelve.
 *
 * `deck` is the human half and it is the point of the drawing. Somebody framed it,
 * out of square, out of treated pine gone silver, with a rail that matches nothing.
 */
export const TrailerHouse: React.FC<HomeProps & {
  h?: number; w?: number; windows?: number; deck?: boolean; slope?: number;
  doubleWide?: boolean; roofKit?: boolean;
}> = ({x = 0, y = 0, scale = 1, seed = 106, wear = 0.35, facing = 1, night = false,
       soil = 'east', h = 100, w = 620, windows = 5, deck = true, slope = 0.4,
       doubleWide = false, roofKit = false}) => {
  const L = useLight();
  const K = fit('trailerHouse', h);
  const siding = tones('#DCD6C6', L);
  const skirt = tones('#C8C2B4', L);
  const roof = tones(roofKit ? '#8A5A44' : '#CCCCC8', L);
  const lift = h * 0.14;
  const bodyH = h * 0.60;
  const ridge = doubleWide ? h * 0.22 : h * 0.10;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={-lift} width={w} height={lift} fill="#1A1E24" />
      {/* THE SKIRTING WEDGE: bottom follows the ground, top is dead level */}
      <path fill={skirt.core} d={
        `M${-w / 2},${-lift} L${w / 2},${-lift}` +
        ` L${w / 2},${lift * slope * 0.5} L${-w / 2},${-lift * slope * 0.5} Z`} />
      {Array.from({length: 26}, (_, i) => (
        <line key={i} x1={-w / 2 + i * w / 26} y1={-lift} x2={-w / 2 + i * w / 26}
          y2={lift * slope * 0.5 * ((i / 26) * 2 - 1)} stroke={skirt.shade}
          strokeWidth={h * 0.006} opacity={0.6} />
      ))}
      <g>
        <rect x={-w / 2} y={-lift - bodyH} width={w} height={bodyH} fill={siding.core} />
        {/* the factory accent stripe at window head height, which dates the unit */}
        <rect x={-w / 2} y={-lift - bodyH * 0.86} width={w} height={h * 0.030}
          fill={siding.shade} />
        {Array.from({length: 14}, (_, i) => (
          <line key={i} x1={-w / 2} y1={-lift - bodyH + i * bodyH / 14} x2={w / 2}
            y2={-lift - bodyH + i * bodyH / 14} stroke={siding.shade}
            strokeWidth={h * 0.005} opacity={0.5} />
        ))}
      </g>
      {/* the roof, VERY shallow, with a SHORT overhang. This is the proportion. */}
      {doubleWide ? (
        <path fill={roof.core} d={
          `M${-w / 2 - w * 0.008},${-lift - bodyH} L0,${-lift - bodyH - ridge}` +
          ` L${w / 2 + w * 0.008},${-lift - bodyH} Z`} />
      ) : (
        <path fill={roof.core} d={
          `M${-w / 2 - w * 0.008},${-lift - bodyH} L${-w * 0.16},${-lift - bodyH - ridge}` +
          ` L${w * 0.16},${-lift - bodyH - ridge} L${w / 2 + w * 0.008},${-lift - bodyH} Z`} />
      )}
      {doubleWide && (
        /* the faint vertical seam where the halves meet */
        <line x1={0} y1={-lift - bodyH} x2={0} y2={-lift} stroke={siding.shade}
          strokeWidth={h * 0.008} opacity={0.5} />
      )}
      {/* IDENTICAL horizontal sliders, evenly spaced. Do not vary them. */}
      {Array.from({length: windows}, (_, i) => (
        <g key={i}>
          <rect x={-w * 0.42 + i * (w * 0.84) / windows} y={-lift - bodyH * 0.70}
            width={w * 0.11} height={bodyH * 0.36}
            fill={night ? '#F2DFA8' : '#48525C'} stroke={siding.shade}
            strokeWidth={h * 0.008} />
          <line x1={-w * 0.42 + i * (w * 0.84) / windows + w * 0.055}
            y1={-lift - bodyH * 0.70}
            x2={-w * 0.42 + i * (w * 0.84) / windows + w * 0.055}
            y2={-lift - bodyH * 0.34} stroke={siding.shade} strokeWidth={h * 0.008} />
        </g>
      ))}
      {/* ONE door, off centre */}
      <rect x={w * 0.20} y={-lift - bodyH * 0.82} width={w * 0.055} height={bodyH * 0.82}
        fill="#8A7A62" stroke={siding.shade} strokeWidth={h * 0.008} />
      {deck && (
        <g>
          {/* out of square, treated pine gone silver, and somebody in the family
              built it. This is the half of the drawing that carries the meaning. */}
          <rect x={w * 0.10} y={-lift * 0.24} width={w * 0.26} height={h * 0.022}
            fill="#9A968C" transform={`rotate(${(rnd(seed, 1) - 0.5) * 1.6} ${w * 0.10} 0)`} />
          {Array.from({length: 5}, (_, i) => (
            <rect key={i} x={w * (0.11 + i * 0.051)} y={-lift * 0.24}
              width={w * 0.005} height={lift * 0.24} fill="#8A867C" />
          ))}
          <rect x={w * 0.10} y={-lift * 0.24 - h * 0.20} width={w * 0.006}
            height={h * 0.20} fill="#9A968C" />
          <rect x={w * 0.34} y={-lift * 0.24 - h * 0.20} width={w * 0.006}
            height={h * 0.20} fill="#9A968C" />
          <rect x={w * 0.10} y={-lift * 0.24 - h * 0.20} width={w * 0.246}
            height={h * 0.014} fill="#9A968C"
            transform={`rotate(${(rnd(seed, 2) - 0.5) * 1.2} ${w * 0.10} ${-lift * 0.24 - h * 0.20})`} />
          {/* the cannas somebody planted along the skirting */}
          {Array.from({length: 9}, (_, i) => (
            <g key={i} transform={`translate(${-w * 0.40 + i * w * 0.062} ${lift * 0.1})`}>
              <path fill="#4E7040" d={`M0,0 q${(i % 2 ? 5 : -5)},${-h * 0.06} ${(i % 2 ? 9 : -9)},${-h * 0.13}`}
                stroke="#4E7040" strokeWidth={h * 0.020} />
              {i % 3 === 0 && (
                <ellipse cx={(i % 2 ? 9 : -9)} cy={-h * 0.14} rx={h * 0.022} ry={h * 0.030}
                  fill="#D4462C" />
              )}
            </g>
          ))}
        </g>
      )}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-lift - h * 0.16} w={w} h={h * 0.16}
        opacity={wear * 0.35} />}
      <ellipse cx={0} cy={h * 0.01} rx={w * 0.56} ry={h * 0.016} fill={SOIL[soil]}
        opacity={0.45} />
    </g>
  );
};

/**
 * THE YARD. Chain link, a dog track worn along the inside, a white propane tank, a
 * clothesline, and St Augustine with a brown ring in it.
 *
 * ST AUGUSTINE IS NOT BERMUDA. Broad blunt-tipped blades running on thick above-ground
 * stolons, so its edge against a walk is a ROLLING MAT rather than a mown line. It is
 * also distinctly bluer and darker than bermuda.
 *
 * BROWN PATCH IS A DOUGHNUT, NOT A DEAD SPOT: roughly circular tan patches with a
 * darker outer ring and a centre that greens back up. That reads as October rather
 * than as drought, which is a different and browner picture.
 *
 * THE PROPANE TANK IS A LOCATION STATEMENT. It marks the property as off the natural
 * gas grid, which means rural or small town, so putting one in a Houston inner loop
 * yard is a place error. A 500 gallon domestic tank is about ten feet long and thirty
 * seven inches in diameter, and it is white or very pale by requirement so it
 * reflects heat.
 */
export const Yard: React.FC<HomeProps & {
  w?: number; depth?: number; fenceH?: number; propane?: boolean; clothesline?: boolean;
  brownPatch?: number; grass?: 'stAugustine' | 'bermuda' | 'bare';
}> = ({x = 0, y = 0, scale = 1, seed = 107, wear = 0.4, soil = 'blackland',
       w = 1080, depth = 260, fenceH = 60, propane = true, clothesline = true,
       brownPatch = 2, grass = 'stAugustine'}) => {
  const L = useLight();
  const K = fit('chainLink', fenceH);
  const g = tones(grass === 'bermuda' ? '#7A9448' : '#4E7A56', L);
  const mesh = tones('#B0B6BA', L);

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-w / 2} y={-depth} width={w} height={depth}
        fill={grass === 'bare' ? SOIL[soil] : g.core} />
      {grass !== 'bare' && Array.from({length: brownPatch}, (_, i) => {
        const cx = (rnd(seed, i) - 0.5) * w * 0.8;
        const cy = -depth * (0.2 + rnd(seed, 20 + i) * 0.6);
        const r = 40 + rnd(seed, 40 + i) * 70;
        return (
          /* the DOUGHNUT: darker ring, tan body, and the centre greening back */
          <g key={i}>
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.34} fill="#8A7A50" />
            <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.34} fill="none" stroke="#6A5A38"
              strokeWidth={5} opacity={0.6} />
            <ellipse cx={cx} cy={cy} rx={r * 0.44} ry={r * 0.15} fill={g.core} />
          </g>
        );
      })}
      {/* the fence, and the WORN DIRT TRACK the dog keeps on the inside of it */}
      <rect x={-w / 2} y={-depth - fenceH * K * 0.10} width={w} height={fenceH * K * 0.16}
        fill={SOIL[soil]} opacity={0.55} />
      <g transform={`translate(0 ${-depth}) scale(${K})`}>
        <rect x={-w / (2 * K)} y={-fenceH} width={w / K} height={fenceH * 0.05}
          fill={mesh.core} />
        {/* the diamond mesh, as two crossing hatches */}
        {Array.from({length: 70}, (_, i) => (
          <g key={i}>
            <line x1={-w / (2 * K) + i * (w / K) / 70} y1={-fenceH}
              x2={-w / (2 * K) + i * (w / K) / 70 + fenceH} y2={0}
              stroke={mesh.base} strokeWidth={fenceH * 0.018} opacity={0.55} />
            <line x1={-w / (2 * K) + i * (w / K) / 70} y1={-fenceH}
              x2={-w / (2 * K) + i * (w / K) / 70 - fenceH} y2={0}
              stroke={mesh.base} strokeWidth={fenceH * 0.018} opacity={0.55} />
          </g>
        ))}
        {Array.from({length: 9}, (_, i) => (
          <rect key={i} x={-w / (2 * K) + i * (w / K) / 8 - fenceH * 0.024} y={-fenceH * 1.02}
            width={fenceH * 0.048} height={fenceH * 1.02} fill={mesh.core} />
        ))}
      </g>
      {propane && (
        <PropaneTank x={w * 0.32} y={-depth * 0.30} scale={1} seed={seed + 3}
          wear={wear} />
      )}
      {clothesline && (
        <Clothesline x={-w * 0.26} y={-depth * 0.22} scale={1} seed={seed + 5}
          wear={wear} />
      )}
    </g>
  );
};

/** THE PROPANE TANK. A horizontal capsule on two low saddle legs, with a small hinged
 *  dome over the valve and a round dial gauge. Five hundred gallons is about ten feet
 *  by thirty seven inches, and it is WHITE or very pale by requirement so it reflects
 *  heat, which is why a dark propane tank is always wrong. */
export const PropaneTank: React.FC<HomeProps & {h?: number; gallons?: 250 | 500}> = ({
  x = 0, y = 0, scale = 1, seed = 108, wear = 0.35, h = 46, gallons = 500,
}) => {
  const L = useLight();
  const K = fit('propaneTank', h);
  const shell = tones('#EFEDE6', L);
  const w = h * (gallons === 500 ? 3.24 : 2.6);

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {[-1, 1].map((s) => (
        <path key={s} fill="#8A857C" d={
          `M${s * w * 0.30 - h * 0.10},0 L${s * w * 0.30 - h * 0.05},${-h * 0.28}` +
          ` L${s * w * 0.30 + h * 0.05},${-h * 0.28} L${s * w * 0.30 + h * 0.10},0 Z`} />
      ))}
      <path fill={shell.core} d={
        `M${-w * 0.36},${-h * 0.62} A${h * 0.34},${h * 0.34} 0 0 1 ${-w * 0.36},${-h * 0.28}` +
        ` L${w * 0.36},${-h * 0.28} A${h * 0.34},${h * 0.34} 0 0 1 ${w * 0.36},${-h * 0.62} Z`} />
      <ellipse cx={0} cy={-h * 0.45} rx={w * 0.40} ry={h * 0.17} fill={shell.core} />
      <ellipse cx={0} cy={-h * 0.52} rx={w * 0.38} ry={h * 0.10} fill={shell.base}
        opacity={0.55} />
      {/* the hinged dome over the valve, and the dial gauge */}
      <path fill="#4A4A46" d={
        `M${-h * 0.16},${-h * 0.60} A${h * 0.16},${h * 0.16} 0 0 1 ${h * 0.16},${-h * 0.60} Z`} />
      <circle cx={h * 0.06} cy={-h * 0.58} r={h * 0.055} fill="#D8D4C8" stroke={INK}
        strokeWidth={h * 0.012} />
      {wear > 0.2 && (
        <>
          <ellipse cx={-w * 0.14} cy={-h * 0.40} rx={w * 0.10} ry={h * 0.09}
            fill="#B8B2A4" opacity={wear * 0.35} />
          <RustStreak x={w * 0.24} y={-h * 0.50} w={h * 0.10} h={h * 0.22}
            opacity={wear * 0.3} />
        </>
      )}
    </g>
  );
};

/** THE CLOTHESLINE. Two galvanised T posts with three or four wires between them, or
 *  a single wire from the house to a tree, and a dip in the middle of every wire that
 *  gets deeper with what is on it. */
export const Clothesline: React.FC<HomeProps & {
  h?: number; span?: number; wires?: number; load?: number; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 109, wear = 0.35, h = 70, span = 220,
       wires = 4, load = 0.5, frame = 0}) => {
  const L = useLight();
  const K = fit('clothesline', h);
  const pipe = tones('#B4B8BA', L);
  const sway = Math.sin(frame / 19) * 4;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * span * 0.5 - h * 0.022} y={-h} width={h * 0.044} height={h}
            fill={pipe.core} />
          <rect x={s * span * 0.5 - h * 0.20} y={-h - h * 0.022} width={h * 0.40}
            height={h * 0.044} fill={pipe.core} />
        </g>
      ))}
      {Array.from({length: wires}, (_, i) => {
        const wy = -h + (i - (wires - 1) / 2) * h * 0.10;
        const dip = h * (0.05 + load * 0.12);
        return (
          <path key={i} fill="none" stroke="#9A968C" strokeWidth={h * 0.012}
            d={`M${-span * 0.5},${wy} Q0,${wy + dip} ${span * 0.5},${wy}`} />
        );
      })}
      {load > 0 && Array.from({length: Math.round(6 * load)}, (_, i) => {
        const px = (rnd(seed, i) - 0.5) * span * 0.8;
        const wy = -h + (Math.floor(rnd(seed, 20 + i) * wires) - (wires - 1) / 2) * h * 0.10;
        const col = ['#E8E4D8', '#5A7A9A', '#C8B48A', '#8A5A6A'][i % 4];
        return (
          <path key={i} fill={col} opacity={0.92}
            transform={`rotate(${sway * 0.4} ${px} ${wy})`}
            d={`M${px - h * 0.10},${wy} L${px + h * 0.10},${wy}` +
               ` L${px + h * 0.12},${wy + h * 0.34} L${px - h * 0.12},${wy + h * 0.34} Z`} />
        );
      })}
    </g>
  );
};

/**
 * THE ABOVE GROUND POOL. The pool you get when there is no pool, and its
 * TEMPORARINESS is the point.
 *
 * The proportion sells it: fifteen to twenty four feet across at forty eight to fifty
 * two inches of wall, so roughly six to one, very wide and very short. It STANDS ON
 * the ground rather than in it, so the whole wall and the grass meeting it are
 * visible.
 *
 * THE TOP RAIL RING IS THE IDENTIFICATION: eight to twelve curved segments meeting at
 * connector plates that sit over the vertical uprights. A smooth continuous rim is a
 * stock tank, which is a different object.
 *
 * `state` runs the whole season in one prop, and the four states are a video by
 * themselves: new in June, green by late August, tarped and sagging in winter, and
 * gone, leaving a perfect yellow circle in the St Augustine.
 */
export const AboveGroundPool: React.FC<HomeProps & {
  h?: number; diameter?: number; state?: 'fresh' | 'green' | 'covered' | 'gone';
  deck?: boolean; segments?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 110, wear = 0.4, night = false,
       h = 60, diameter = 300, state = 'fresh', deck = true, segments = 10}) => {
  const L = useLight();
  const K = fit('agPool', h);
  const wall = tones('#DCE0E4', L);
  const rail = tones('#E8E4D8', L);
  const water = state === 'green' ? '#5E7A4E' : '#4FA8C0';
  const rx = diameter / 2;

  if (state === 'gone') {
    return (
      <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
        {/* the yellow ring, and the levelled sand inside it. The best of the four. */}
        <ellipse cx={0} cy={0} rx={rx} ry={rx * 0.30} fill="#C8C08A" />
        <ellipse cx={0} cy={0} rx={rx * 0.90} ry={rx * 0.27} fill="#D8CFA8" />
        <ellipse cx={0} cy={0} rx={rx} ry={rx * 0.30} fill="none" stroke="#A89A60"
          strokeWidth={h * 0.08} opacity={0.5} />
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <ellipse cx={0} cy={0} rx={rx * 1.06} ry={rx * 0.32} fill="#C8C08A" opacity={0.6} />
      <path fill={wall.core} d={
        `M${-rx},0 L${-rx},${-h} A${rx},${rx * 0.30} 0 0 1 ${rx},${-h} L${rx},0` +
        ` A${rx},${rx * 0.30} 0 0 0 ${-rx},0 Z`} />
      {/* the printed tile-line band, which is the era and which is always faded */}
      <path fill="#6A8AA8" opacity={0.5} d={
        `M${-rx},${-h * 0.82} L${-rx},${-h * 0.68} A${rx},${rx * 0.30} 0 0 0 ${rx},${-h * 0.68}` +
        ` L${rx},${-h * 0.82} A${rx},${rx * 0.30} 0 0 1 ${-rx},${-h * 0.82} Z`} />
      {state === 'covered' ? (
        <ellipse cx={0} cy={-h * 0.86} rx={rx * 0.98} ry={rx * 0.29} fill="#3A4A58" />
      ) : (
        <>
          <ellipse cx={0} cy={-h * 0.82} rx={rx * 0.94} ry={rx * 0.28} fill={water} />
          <ellipse cx={-rx * 0.22} cy={-h * 0.86} rx={rx * 0.34} ry={rx * 0.09}
            fill="#FFFFFF" opacity={0.30} />
        </>
      )}
      {/* THE TOP RAIL RING, in segments, with connector plates over the uprights */}
      {Array.from({length: segments}, (_, i) => {
        const a0 = (i / segments) * Math.PI * 2, a1 = ((i + 1) / segments) * Math.PI * 2;
        return (
          <g key={i}>
            <path fill="none" stroke={rail.core} strokeWidth={h * 0.16}
              d={`M${Math.cos(a0) * rx},${-h + Math.sin(a0) * rx * 0.30}` +
                 ` A${rx},${rx * 0.30} 0 0 1 ${Math.cos(a1) * rx},${-h + Math.sin(a1) * rx * 0.30}`} />
            <rect x={Math.cos(a0) * rx - h * 0.10} y={-h + Math.sin(a0) * rx * 0.30 - h * 0.12}
              width={h * 0.20} height={h * 0.24} fill={rail.shade} />
          </g>
        );
      })}
      {/* the ladder, an A-frame straddling the wall */}
      <g transform={`translate(${rx * 0.34} ${-h})`}>
        {[-1, 1].map((s) => (
          <line key={s} x1={s * h * 0.14} y1={h} x2={s * h * 0.06} y2={-h * 0.34}
            stroke="#E0DCD0" strokeWidth={h * 0.06} />
        ))}
        {Array.from({length: 3}, (_, i) => (
          <line key={i} x1={-h * 0.12} y1={h * 0.6 - i * h * 0.42} x2={h * 0.12}
            y2={h * 0.6 - i * h * 0.42} stroke="#E0DCD0" strokeWidth={h * 0.05} />
        ))}
      </g>
      {deck && (
        /* on ONE ARC only, so the circle is interrupted, and built out of treated pine */
        <g>
          <path fill="#9A968C" d={
            `M${-rx * 1.02},${-h * 0.94} L${-rx * 0.24},${-h * 1.06}` +
            ` L${-rx * 0.24},${-h * 0.98} L${-rx * 1.02},${-h * 0.86} Z`} />
          <rect x={-rx * 1.04} y={-h * 0.96} width={rx * 0.06} height={h * 1.0}
            fill="#8A867C" />
        </g>
      )}
      {night && state !== 'covered' && (
        <ellipse cx={0} cy={-h * 0.82} rx={rx * 0.94} ry={rx * 0.28} fill="#7ADCF0"
          opacity={0.22} />
      )}
    </g>
  );
};

/** THE PORCH GLIDER, and the mechanical fact that makes it drawable: it TRAVELS
 *  LEVEL. A swing tilts, a glider does not. The seat rides forward and back on
 *  pivoting links while staying horizontal, which is a slow loopable motion and the
 *  cheapest reliable rhythm this library has.
 *
 *  `shell` is the other family: the formed steel motel chair with a scalloped fan
 *  back, a scrolled tubular arm and a springy Z-shaped cantilever leg, which reads
 *  1948 to 1965 and comes in that specific period palette of turquoise, mint,
 *  buttercup and tomato, all chalked matte after a decade outdoors. */
export const PorchGlider: React.FC<HomeProps & {
  h?: number; shell?: boolean; colour?: string; frame?: number; swing?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 111, wear = 0.4, facing = 1,
       h = 70, shell = false, colour = '#3F7A72', frame = 0, swing = 1}) => {
  const L = useLight();
  const K = fit('porchGlider', h);
  const t = tones(colour, L);
  const travel = Math.sin(frame / 24) * h * 0.14 * swing;
  const w = shell ? h * 0.86 : h * 1.5;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {shell ? (
        <g transform={`translate(${travel * 0.4} 0)`}>
          {/* the Z-shaped springy cantilever leg, which is the whole chair */}
          <path fill="none" stroke={t.shade} strokeWidth={h * 0.05} strokeLinecap="round"
            d={`M${-w * 0.42},0 L${-w * 0.10},0 L${-w * 0.34},${-h * 0.40} L${w * 0.30},${-h * 0.40}`} />
          {/* the scalloped fan back */}
          <path fill={t.core} d={
            `M${-w * 0.34},${-h * 0.40} L${-w * 0.42},${-h * 0.94}` +
            Array.from({length: 6}, (_, i) =>
              ` Q${-w * 0.42 + (i + 0.5) * w * 0.14},${-h * 1.04} ${-w * 0.42 + (i + 1) * w * 0.14},${-h * 0.94}`).join('') +
            ` L${w * 0.30},${-h * 0.40} Z`} />
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={-w * 0.40 + i * w * 0.12} y1={-h * 0.94}
              x2={-w * 0.32 + i * w * 0.11} y2={-h * 0.42} stroke={t.shade}
              strokeWidth={h * 0.012} opacity={0.5} />
          ))}
          <path fill="none" stroke={t.core} strokeWidth={h * 0.04}
            d={`M${w * 0.30},${-h * 0.40} q${h * 0.10},${-h * 0.10} ${h * 0.02},${-h * 0.22}`} />
        </g>
      ) : (
        <g>
          {/* the base frame stays put */}
          <rect x={-w * 0.46} y={-h * 0.10} width={w * 0.92} height={h * 0.05}
            fill={t.shade} />
          {[-1, 1].map((s) => (
            <line key={s} x1={s * w * 0.42} y1={-h * 0.08} x2={s * w * 0.42} y2={0}
              stroke={t.shade} strokeWidth={h * 0.05} />
          ))}
          {/* the links pivot; the SEAT STAYS LEVEL. That is a glider. */}
          {[-1, 1].map((s) => (
            <line key={s} x1={s * w * 0.34} y1={-h * 0.10}
              x2={s * w * 0.34 + travel} y2={-h * 0.36} stroke={t.shade}
              strokeWidth={h * 0.035} />
          ))}
          <g transform={`translate(${travel} 0)`}>
            <rect x={-w * 0.46} y={-h * 0.40} width={w * 0.92} height={h * 0.06}
              fill={t.core} />
            {Array.from({length: 7}, (_, i) => (
              <rect key={i} x={-w * 0.44} y={-h * (0.98 - i * 0.085)} width={w * 0.88}
                height={h * 0.045} fill={i % 2 ? t.base : t.core} />
            ))}
            {[-1, 1].map((s) => (
              <path key={s} fill="none" stroke={t.core} strokeWidth={h * 0.045}
                d={`M${s * w * 0.46},${-h * 0.36} L${s * w * 0.46},${-h * 0.58}` +
                   ` q${-s * h * 0.06},${-h * 0.06} ${-s * h * 0.16},${-h * 0.04}`} />
            ))}
          </g>
        </g>
      )}
      {wear > 0.3 && (
        <ellipse cx={-w * 0.36} cy={-h * 0.04} rx={h * 0.06} ry={h * 0.04}
          fill="#8A5A34" opacity={wear * 0.7} />
      )}
    </g>
  );
};

/** THE SATELLITE DISH. The six foot mesh dish on a polar mount is a hard 1980s stamp
 *  bolted to a yard, and the small grey offset dish on the eave is late 1990s onward.
 *  Almost nothing else in a Texas yard dates a scene as fast. */
export const SatelliteDish: React.FC<HomeProps & {h?: number; mesh?: boolean}> = ({
  x = 0, y = 0, scale = 1, seed = 112, wear = 0.4, facing = 1, h = 70, mesh = true,
}) => {
  const L = useLight();
  const K = fit('satelliteDish', h);
  const t = tones(mesh ? '#9A9E9A' : '#C8C4BC', L);
  const r = mesh ? h * 0.42 : h * 0.16;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      {mesh && (
        <>
          <rect x={-h * 0.05} y={-h * 0.52} width={h * 0.10} height={h * 0.52}
            fill={t.shade} />
          <ellipse cx={0} cy={0} rx={h * 0.14} ry={h * 0.05} fill="#8A8580" />
        </>
      )}
      <g transform={`translate(0 ${-h * 0.62}) rotate(-26)`}>
        <ellipse cx={0} cy={0} rx={r} ry={r * 0.94} fill={t.core} />
        {mesh && (
          <>
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI;
              return (
                <line key={i} x1={-Math.cos(a) * r} y1={-Math.sin(a) * r * 0.94}
                  x2={Math.cos(a) * r} y2={Math.sin(a) * r * 0.94}
                  stroke={t.shade} strokeWidth={h * 0.010} opacity={0.7} />
              );
            })}
            {[0.34, 0.66].map((f, i) => (
              <ellipse key={i} cx={0} cy={0} rx={r * f} ry={r * f * 0.94} fill="none"
                stroke={t.shade} strokeWidth={h * 0.010} opacity={0.7} />
            ))}
          </>
        )}
        {/* the LNB on its arms, out in front of the dish face */}
        {[-1, 1].map((s) => (
          <line key={s} x1={s * r * 0.6} y1={0} x2={0} y2={-r * 0.9}
            stroke={t.shade} strokeWidth={h * 0.014} />
        ))}
        <rect x={-h * 0.035} y={-r * 1.02} width={h * 0.07} height={h * 0.10}
          fill="#5A5F5C" />
      </g>
      {wear > 0.3 && <RustStreak x={-h * 0.06} y={-h * 0.30} w={h * 0.12} h={h * 0.30}
        opacity={wear * 0.5} />}
    </g>
  );
};

/**
 * THE WASHATERIA, and the word is the first thing. Texans say washateria and
 * outsiders do not, and the first self-service one opened in Fort Worth on April 18th,
 * 1934, which makes it a genuine Texas invention rather than a regionalism.
 *
 * THE NIGHT EXTERIOR IS THE SHOT. Storefront glass nearly the full width and floor to
 * a high transom, so from outside the whole interior reads as ONE GLOWING HORIZONTAL
 * RECTANGLE against a dark street. The contrast at the glass line between cold green
 * fluorescent inside and warm sodium outside is the entire image.
 *
 * Inside, the grid of dryer doors is the strongest graphic in the room and it costs
 * nothing to draw. The light is a green-leaning fluorescent that makes skin read
 * cooler than any other Texas interior, which is why every photograph taken in one
 * looks the way it does.
 */
export const Washateria: React.FC<HomeProps & {
  h?: number; w?: number; dryers?: number; occupied?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 113, wear = 0.4, facing = 1, night = true,
       h = 120, w = 420, dryers = 10, occupied = 1}) => {
  const L = useLight();
  const K = fit('washateria', h);
  const block = tones('#D8D4C4', L);
  const inside = '#D8E4D0';   // the green-leaning fluorescent, and it is the mood

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale * facing} ${K * scale})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={block.core} />
      <rect x={-w / 2} y={-h} width={w} height={h * 0.20} fill={block.base} />
      {/* THE ONE GLOWING RECTANGLE */}
      <rect x={-w * 0.46} y={-h * 0.76} width={w * 0.92} height={h * 0.70}
        fill={night ? inside : '#48525C'} />
      {night && (
        <>
          {/* the grid of dryer doors, in silhouette against the glow */}
          {Array.from({length: dryers}, (_, i) => {
            const c = i % 5, r = Math.floor(i / 5);
            return (
              <g key={i}>
                <rect x={-w * 0.42 + c * w * 0.088} y={-h * 0.70 + r * h * 0.30}
                  width={w * 0.074} height={h * 0.27} fill="#B8C4B4" />
                <circle cx={-w * 0.42 + c * w * 0.088 + w * 0.037}
                  cy={-h * 0.70 + r * h * 0.30 + h * 0.135} r={h * 0.085}
                  fill="#8A9A88" />
              </g>
            );
          })}
          {/* the folding table against the far wall, and whoever is at it */}
          <rect x={w * 0.06} y={-h * 0.34} width={w * 0.34} height={h * 0.030}
            fill="#C4C0B0" />
          {occupied > 0 && (
            <g>
              <rect x={w * 0.20} y={-h * 0.56} width={h * 0.09} height={h * 0.24}
                fill="#5A6A7A" />
              <circle cx={w * 0.20 + h * 0.045} cy={-h * 0.60} r={h * 0.045}
                fill="#a8825e" />
            </g>
          )}
          <ellipse cx={0} cy={-h * 0.20} rx={w * 0.60} ry={h * 0.40} fill={inside}
            opacity={0.14} />
        </>
      )}
      {/* the backlit box sign with vinyl letters, drawn as bars */}
      <rect x={-w * 0.30} y={-h * 1.22} width={w * 0.60} height={h * 0.20}
        fill={night ? '#F4EEDC' : '#DCD6C8'} stroke="#5A5550" strokeWidth={h * 0.012} />
      {Array.from({length: 2}, (_, i) => (
        <rect key={i} x={-w * (0.20 - i * 0.04)} y={-h * (1.16 - i * 0.08)}
          width={w * (0.40 + rnd(seed, i) * 0.10)} height={h * 0.05}
          fill="#2A3A52" opacity={0.85} />
      ))}
      {wear > 0.3 && <CalicheDust x={-w / 2} y={-h * 0.20} w={w} h={h * 0.20}
        opacity={wear * 0.4} />}
    </g>
  );
};

/** THE BURN BARREL. A fifty five gallon drum standing open, rusted through in places,
 *  with a wire mesh over the top and a black ring of scorched ground around it. It is
 *  ordinary rural infrastructure and not a sign of decline. */
export const BurnBarrel: React.FC<HomeProps & {
  h?: number; lit?: boolean; frame?: number;
}> = ({x = 0, y = 0, scale = 1, seed = 114, wear = 0.7, h = 50, lit = false, frame = 0}) => {
  const L = useLight();
  const K = fit('burnBarrel', h);
  const drum = tones('#7A5A44', L);
  const w = h * 0.62;

  return (
    <g transform={`translate(${x} ${y}) scale(${K * scale})`}>
      <ellipse cx={0} cy={h * 0.02} rx={w * 0.9} ry={h * 0.10} fill="#2A2622"
        opacity={0.45} />
      <path fill={drum.core} d={
        `M${-w / 2},0 L${-w / 2},${-h} L${w / 2},${-h} L${w / 2},0 Z`} />
      <ellipse cx={0} cy={-h} rx={w / 2} ry={h * 0.10} fill="#3A3028" />
      <ellipse cx={0} cy={-h} rx={w / 2} ry={h * 0.10} fill="none" stroke={drum.base}
        strokeWidth={h * 0.03} />
      {/* the two rolling hoops, which is what makes it a drum */}
      {[0.34, 0.66].map((f, i) => (
        <rect key={i} x={-w / 2} y={-h * f} width={w} height={h * 0.035}
          fill={drum.base} />
      ))}
      {Array.from({length: 5}, (_, i) => (
        <ellipse key={i} cx={(rnd(seed, i) - 0.5) * w * 0.7}
          cy={-h * (0.15 + rnd(seed, 20 + i) * 0.6)} rx={h * 0.05} ry={h * 0.04}
          fill="#2A2018" opacity={wear * 0.8} />
      ))}
      {lit && (
        <g>
          {Array.from({length: 6}, (_, i) => {
            const p = ((frame / 30) * 1.1 + rnd(seed, 40 + i)) % 1;
            return (
              <ellipse key={i} cx={(rnd(seed, 60 + i) - 0.5) * w * 0.5}
                cy={-h * 1.02 - p * h * 0.5} rx={h * 0.06 * (1 - p * 0.5)}
                ry={h * 0.10 * (1 - p * 0.4)}
                fill={p < 0.4 ? '#F0A030' : '#7A5A44'} opacity={(1 - p) * 0.85} />
            );
          })}
          <ellipse cx={0} cy={-h} rx={w * 0.42} ry={h * 0.08} fill="#F8C060" />
          <ellipse cx={0} cy={-h * 0.5} rx={w * 1.2} ry={h * 0.8} fill="#F0A030"
            opacity={0.12} />
        </g>
      )}
    </g>
  );
};
