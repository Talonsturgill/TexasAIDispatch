import React from 'react';
import {useUid} from '../../../lib/uid';

/**
 * RobotaxiHero, the fresh authored hero group for the 2026-10-19 edition.
 *
 * ONE generic white driverless car carries the film. It is drawn as no real model and carries no
 * logo, badge, wordmark or livery: a long, softly rounded electric sport utility body, a squat white
 * roof sensor dome on a dark plinth with a dark scanning band, small black sensor pods on the front
 * fender and the rear quarter, a glass cabin whose dark glass still shows an EMPTY driver seat and a
 * steering wheel, black wheel arch cladding, five spoke rims, slim headlamps with a running light,
 * slim brake lamps, amber hazard lamps at the four corners and on the mirror, and a curbside rear door
 * that opens on its front hinge. Maintained but worn: a shallow dent and scuffs low on the rear door,
 * a chip on the front bumper, road film on the rocker. A mud line rises on the body when the car has
 * stood in floodwater, and stays.
 *
 * The same group draws the car straight down from above (the roof dome as a ringed disc, the glass
 * as dark panes, the curbside rear door swinging out), and the cabin from the rear seat: the empty
 * driver seat and headrest, a steering wheel that turns with no hands on it, a dark dashboard, a
 * centre screen with a plain route line and an open windshield the region's own light comes through.
 *
 * Light: late sodium light low from the upper left warms the white panels, a cool storm fill from
 * the right shades the lower body, a long soft shadow falls to the right. Nothing is symmetric: the
 * dome sits behind the roof's centre, the side sensors differ front and rear, the dent is on one door.
 *
 * Performed uses. The side drawing performs the curb arrival, A's creek carry (creek-wide, car-swept), the
 * stranded street car, the lane roll into standing water and the open door at the curb; the cab performs the
 * empty steering wheel. From the October 20th repair, B performs its s3 creek-swept use (s3-event-3) through
 * the overhead creek-plan view in both of its s3 shots: the top part, the same car design seen straight down
 * with its roof dome, dark glass panes and mirrors, is drawn on the creek plan, held closer in B's second
 * shot, while the current carries it off the shallow shelf. No new geometry was needed for that use.
 *
 * Disclosed illustration of a generic car. Not a Waymo vehicle, not a vehicle named in the recall,
 * no real road, speed, depth or rider. Pure function of its props; the episode drives every prop
 * from the film frame clock.
 */

export type Pt = [number, number];
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const mixHex = (a: string, b: string, p: number) => {
 const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
 return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(p))).toString(16).padStart(2, '0')).join('');
};

/** Side geometry in car units: facing +x, ground at y 0, up is negative y. About 520 units long. */
export const CAR = {
 front: 264, rear: -264, top: -250,
 wheels: [-168, 172] as const, axleY: -49, tireR: 49, rimR: 33, wellR: 57, archR: 66,
 hinge: -42, doorEnd: -178,
 tail: [-258, -114] as Pt, nose: [254, -100] as Pt, hazardFront: [247, -101] as Pt, hazardRear: [-257, -97] as Pt,
 mirror: [126, -150] as Pt, cabin: [-40, -168] as Pt, driverSeat: [20, -170] as Pt,
};
/** The side drawing's bounding box in car units, for frame-edge checks. */
export const SIDE_BOX: [number, number, number, number] = [-268, -252, 268, 6];
/** The plan drawing's bounding box in car units (facing +x), door swing included. */
export const TOP_BOX: [number, number, number, number] = [-266, -134, 266, 230];
/** The car's lamp and paint values, so tags and icons elsewhere can match the hero. */
export const CAR_PAINT = {lit: '#FBFCFD', body: '#E9EEF2', shade: '#BFC7CE', deep: '#9EA7B0', trim: '#1F242A',
 glass: '#1D2630', tire: '#17191C', amber: '#FFB52E', amberOff: '#9C6B22', brake: '#FF3B2F', brakeOff: '#7E1F1C'};

export const BODY = 'M244 -30C258 -34 266 -58 264 -80C262 -100 250 -110 226 -116C196 -122 160 -128 136 -134'
 + 'C112 -152 82 -182 40 -196C20 -202 -10 -205 -40 -205L-150 -200C-186 -197 -214 -182 -234 -160'
 + 'C-252 -140 -262 -118 -263 -96C-264 -70 -260 -44 -248 -30Z';
const GLASS = 'M126 -139C104 -158 80 -178 44 -190C20 -196 -10 -198 -40 -198L-150 -194C-180 -190 -204 -178 -220 -160L-226 -148Z';
const REAR_DOOR = 'M-44 -197L-150 -194C-166 -191 -176 -182 -179 -166L-181 -122C-190 -96 -186 -60 -176 -30L-40 -30L-42 -142Z';
const REAR_DOOR_GLASS = 'M-46 -195L-150 -192C-164 -189 -172 -181 -176 -168L-178 -147L-48 -143Z';
const POD_DOME = 'M-78 -212C-78 -236 -66 -248 -40 -249C-14 -248 -2 -236 -2 -212Z';

const archOuter = (cx: number) => {
 const y0 = -30, cy = CAR.axleY, ro = CAR.archR, ri = CAR.wellR;
 const dxo = Math.sqrt(ro * ro - (y0 - cy) ** 2), dxi = Math.sqrt(ri * ri - (y0 - cy) ** 2);
 return `M${cx - dxo} ${y0}A${ro} ${ro} 0 1 1 ${cx + dxo} ${y0}L${cx + dxi} ${y0}A${ri} ${ri} 0 1 0 ${cx - dxi} ${y0}Z`;
};
const wellPath = (cx: number) => {
 const y0 = -30, cy = CAR.axleY, ri = CAR.wellR, dx = Math.sqrt(ri * ri - (y0 - cy) ** 2);
 return `M${cx - dx} ${y0}A${ri} ${ri} 0 1 1 ${cx + dx} ${y0}Z`;
};

/** One road wheel: tyre, sidewall, a five spoke rim turned by `deg`. */
const Wheel: React.FC<{cx: number; deg: number; id: string}> = ({cx, deg, id}) => {
 const cy = CAR.axleY;
 return <g data-part="wheel">
  <circle cx={cx} cy={cy} r={CAR.tireR} fill={CAR_PAINT.tire}/>
  <circle cx={cx} cy={cy} r={CAR.tireR - 2} fill="none" stroke="#2C3034" strokeWidth={3}/>
  <circle cx={cx} cy={cy} r={41} fill="none" stroke="#24282C" strokeWidth={9}/>
  <circle cx={cx} cy={cy} r={CAR.rimR} fill="#3B4248"/>
  <g transform={`rotate(${deg.toFixed(2)} ${cx} ${cy})`}>
   {[0, 1, 2, 3, 4].map(k => <path key={k} transform={`rotate(${k * 72} ${cx} ${cy})`}
    d={`M${cx - 5} ${cy - 8}L${cx - 8} ${cy - 31}L${cx + 8} ${cy - 31}L${cx + 5} ${cy - 8}Z`} fill={`url(#${id}rim)`} stroke="#6F777E" strokeWidth={.8}/>)}
   <circle cx={cx} cy={cy - 24} r={2.2} fill="#7C858C"/>
  </g>
  <circle cx={cx} cy={cy} r={CAR.rimR} fill="none" stroke="#C9CFD4" strokeWidth={2.5}/>
  <circle cx={cx} cy={cy} r={8} fill="#C3C9CE"/><circle cx={cx} cy={cy} r={3} fill="#5B636A"/>
  <path d={`M${cx - 30} ${cy - 22}A37 37 0 0 1 ${cx + 6} ${cy - 37}`} stroke="#FFFFFF" strokeOpacity={.35} strokeWidth={2} fill="none"/>
 </g>;
};

/** How far past fully open (1) a held-open curbside door may ease as it settles onto its check stop. */
export const DOOR_STOP = 1.1;

export type SideProps = {
 /** wheel rotation, degrees */ wheel?: number;
 /** brake lamps 0..1 */ brake?: number;
 /** amber hazard lamps 0..1 (the episode blinks it) */ hazard?: number;
 /** mud line height above the ground, car units; it only rises */ wetTo?: number;
 /** curbside rear door open 0..1; up to DOOR_STOP past 1 the held-open door eases on to its check stop */ door?: number;
 /** nose dip, degrees, about the rear axle */ dip?: number;
 /** ground and contact shadow 0..1 (0 when the car floats) */ shadow?: number;
 /** how clearly the empty cabin reads through the glass 0..1 */ cabin?: number;
 /** seed for the mud edge */ seed?: number;
};

const Side: React.FC<SideProps> = ({wheel = 0, brake = 0, hazard = 0, wetTo = 0, door = 0, dip = 0, shadow = 1, cabin = .5, seed = 3}) => {
 const id = useUid('rtx');
 const [wr, wf] = CAR.wheels;
 const amber = mixHex(CAR_PAINT.amberOff, CAR_PAINT.amber, hazard);
 const red = mixHex(CAR_PAINT.brakeOff, CAR_PAINT.brake, brake);
 const glassOpacity = lerp(.9, .55, clamp(cabin));
 // From cabin .75 up the glass turns SEE-THROUGH: daylight from the far-side windows fills the cabin
 // and the empty seats stand dark against it, two low headrests on posts with clear glass above them
 // and no head anywhere. Lower values keep the dark tinted glass the curb shots were drawn with.
 const see = clamp((cabin - .75) / .25);
 const cabinLight = mixHex('#2B333C', '#B7C4CE', see), seatInk = mixHex('#5D636A', '#3A4048', see);
 const mudEdge = wetTo > 0 ? Array.from({length: 23}, (_, i) => {
  const x = -264 + i * 24;
  return `${i ? 'L' : 'M'}${x} ${(-wetTo + 3.2 * Math.sin(x * .071 + seed) + 1.6 * Math.sin(x * .19 + seed * 2)).toFixed(1)}`;
 }).join('') : '';
 const openAng = 64 * Math.min(DOOR_STOP, Math.max(0, door));
 const k = Math.cos(openAng * Math.PI / 180);
 return <g data-part="robotaxi-side">
  <defs>
   <linearGradient id={`${id}body`} x1="0" y1="-250" x2="0" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={CAR_PAINT.lit}/><stop offset=".42" stopColor="#EEF2F5"/>
    <stop offset=".7" stopColor="#D5DBE0"/><stop offset="1" stopColor={CAR_PAINT.deep}/>
   </linearGradient>
   <radialGradient id={`${id}key`} cx="-120" cy="-190" r="300" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#FFE9C8" stopOpacity={.42}/><stop offset="1" stopColor="#FFE9C8" stopOpacity={0}/>
   </radialGradient>
   <linearGradient id={`${id}fill`} x1="-264" y1="0" x2="264" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset=".55" stopColor="#BFCBDA" stopOpacity={0}/><stop offset="1" stopColor="#9FB0C4" stopOpacity={.32}/>
   </linearGradient>
   <linearGradient id={`${id}glass`} x1="0" y1="-200" x2="0" y2="-140" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#C9D5DE" stopOpacity={.75}/><stop offset=".45" stopColor="#5A6B7A" stopOpacity={.55}/>
    <stop offset="1" stopColor="#1A222B" stopOpacity={.4}/>
   </linearGradient>
   <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#F4F6F8"/><stop offset="1" stopColor="#9AA2A9"/>
   </linearGradient>
   <radialGradient id={`${id}dome`} cx="-56" cy="-244" r="52" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#FFFFFF"/><stop offset=".7" stopColor="#E3E8EC"/><stop offset="1" stopColor="#A9B2BA"/>
   </radialGradient>
   <radialGradient id={`${id}shadow`} cx=".5" cy=".5" r=".5">
    <stop offset="0" stopColor="#0E1013" stopOpacity={.42}/><stop offset=".7" stopColor="#0E1013" stopOpacity={.18}/>
    <stop offset="1" stopColor="#0E1013" stopOpacity={0}/>
   </radialGradient>
   <radialGradient id={`${id}glowR`}><stop offset="0" stopColor="#FF5A3C" stopOpacity={.9}/><stop offset="1" stopColor="#FF5A3C" stopOpacity={0}/></radialGradient>
   <radialGradient id={`${id}glowA`}><stop offset="0" stopColor="#FFC24A" stopOpacity={.95}/><stop offset="1" stopColor="#FFC24A" stopOpacity={0}/></radialGradient>
   <radialGradient id={`${id}glowW`}><stop offset="0" stopColor="#FFF6E2" stopOpacity={.8}/><stop offset="1" stopColor="#FFF6E2" stopOpacity={0}/></radialGradient>
   <mask id={`${id}arches`} maskUnits="userSpaceOnUse" x="-300" y="-300" width="600" height="320">
    <rect x="-300" y="-300" width="600" height="320" fill="#FFFFFF"/>
    {CAR.wheels.map(cx => <circle key={cx} cx={cx} cy={CAR.axleY} r={CAR.wellR} fill="#000000"/>)}
   </mask>
   <clipPath id={`${id}clip`}><path d={BODY}/></clipPath>
   <clipPath id={`${id}dome`}><path d={POD_DOME}/></clipPath>
  </defs>
  {shadow > 0 && <g opacity={shadow} data-part="ground-shadow">
   <ellipse cx={34} cy={3} rx={300} ry={19} fill={`url(#${id}shadow)`}/>
   {CAR.wheels.map(cx => <ellipse key={cx} cx={cx + 4} cy={1.5} rx={42} ry={6} fill="#0B0C0E" opacity={.55}/>)}
  </g>}
  {/* wells and tyres sit behind the body, which is cut round them */}
  {CAR.wheels.map(cx => <path key={'w' + cx} d={wellPath(cx)} fill="#0D0F11"/>)}
  <Wheel cx={wr} deg={wheel} id={id}/><Wheel cx={wf} deg={wheel} id={id}/>
  <g transform={`rotate(${dip.toFixed(3)} ${wr} ${CAR.axleY})`}>
   <g mask={`url(#${id}arches)`}>
    <path d={BODY} fill={`url(#${id}body)`}/>
    <path d={BODY} fill={`url(#${id}key)`}/>
    <path d={BODY} fill={`url(#${id}fill)`}/>
    {/* character line catching the key light, and the crease under it */}
    <path d="M206 -98C120 -102 0 -106 -238 -114" stroke="#FFFFFF" strokeOpacity={.7} strokeWidth={2.6} fill="none"/>
    <path d="M206 -94C120 -98 0 -102 -238 -110" stroke="#8D98A2" strokeOpacity={.45} strokeWidth={1.4} fill="none"/>
    {/* road film on the rocker, a chip on the bumper, a dent and scuffs low on the rear door */}
    <path d="M-110 -30L110 -30L108 -46C40 -48 -40 -48 -108 -46Z" fill="#2C3137"/>
    <path d="M-108 -46C-40 -48 40 -48 108 -46" stroke="#5B636B" strokeWidth={1.2} fill="none"/>
    <ellipse cx={-112} cy={-66} rx={16} ry={9} fill="#9EA8B1" opacity={.42}/>
    <path d="M-126 -71C-118 -76 -106 -76 -98 -70" stroke="#FFFFFF" strokeOpacity={.75} strokeWidth={1.5} fill="none"/>
    {[[-152, -52, -128, -54], [-146, -47, -112, -50], [-90, -55, -70, -53], [236, -44, 246, -47]].map(([a, b, c, d2], i) =>
     <path key={i} d={`M${a} ${b}L${c} ${d2}`} stroke="#8B949C" strokeWidth={1.3} strokeLinecap="round"/>)}
    {/* doors, handles, mirror */}
    <path d="M128 -138L120 -88M-42 -142L-40 -32M-178 -148L-182 -114" stroke="#7C868F" strokeWidth={1.6} fill="none"/>
    <rect x={56} y={-126} width={30} height={5} rx={2.5} fill="#CBD2D8" stroke="#8E979F" strokeWidth={.8}/>
    <rect x={-104} y={-128} width={30} height={5} rx={2.5} fill="#CBD2D8" stroke="#8E979F" strokeWidth={.8}/>
    {/* glass cabin: the interior first, empty, then the glass over it */}
    <path d={GLASS} fill={cabinLight}/>
    <g data-part="empty-cabin" opacity={.55 + .45 * clamp(cabin)}>
     {see > 0 && <path d="M-226 -150L126 -140L126 -139L-226 -148Z" fill="#6E7A84" opacity={.5 * see}/>}
     <path d="M-2 -142L2 -166C6 -172 34 -172 38 -166L40 -142Z" fill={seatInk}/>
     {see > 0 && <path d="M14 -166V-176M28 -166V-176" stroke={seatInk} strokeWidth={2.4}/>}
     <rect x={8} y={-190 + 8 * see} width={24} height={24 - 10 * see} rx={9 - 3 * see} fill={see > 0 ? seatInk : '#727880'}/>
     <path d="M-132 -144L-130 -162C-128 -168 -100 -168 -96 -162L-94 -144Z" fill={seatInk}/>
     {see > 0 && <path d="M-120 -162V-172M-106 -162V-172" stroke={seatInk} strokeWidth={2.4}/>}
     <rect x={-124} y={-184 + 8 * see} width={22} height={22 - 10 * see} rx={8 - 3 * see} fill={see > 0 ? seatInk : '#6E747B'}/>
     <ellipse cx={92} cy={-154} rx={5} ry={19} transform="rotate(-24 92 -154)" fill="none" stroke="#14181C" strokeWidth={4}/>
    </g>
    <path d={GLASS} fill={`url(#${id}glass)`} opacity={glassOpacity * (1 - .55 * see)}/>
    <path d="M60 -186L20 -146L34 -146L72 -184Z" fill="#FFFFFF" opacity={.16}/>
    <path d="M-32 -141L-30 -198L-48 -198L-50 -142Z" fill={CAR_PAINT.trim}/>
    <path d="M-168 -146L-160 -193L-172 -192L-180 -147Z" fill={CAR_PAINT.trim}/>
    <path d={GLASS} fill="none" stroke={CAR_PAINT.trim} strokeWidth={3}/>
    {/* lamps */}
    <path d="M212 -114C230 -116 248 -110 259 -98L256 -92C244 -100 228 -104 210 -106Z" fill="#D9E3EA" stroke="#5E6870" strokeWidth={1}/>
    <path d="M214 -112C232 -113 246 -108 256 -99" stroke="#FFFFFF" strokeWidth={2.2} fill="none"/>
    <path d="M206 -52C228 -54 248 -52 260 -46L256 -36C240 -40 222 -42 204 -42Z" fill="#2A2F35"/>
    <path d="M-263 -112C-256 -122 -244 -126 -230 -126L-231 -118C-244 -118 -254 -114 -261 -104Z" fill={red}/>
    <path d="M-258 -50C-250 -44 -240 -40 -226 -40L-226 -32L-248 -30C-254 -34 -258 -42 -258 -50Z" fill="#2A2F35"/>
    <rect x={238} y={-104} width={16} height={6} rx={2} fill={amber}/>
    <rect x={-262} y={-101} width={10} height={7} rx={2} fill={amber}/>
    {/* side sensors, front fender and rear quarter */}
    <rect x={192} y={-129} width={20} height={11} rx={4} fill="#22282E"/><circle cx={206} cy={-123.5} r={3} fill="#4E6A7E"/>
    <rect x={-247} y={-133} width={17} height={10} rx={4} fill="#22282E"/><circle cx={-235} cy={-128} r={2.6} fill="#4E6A7E"/>
    {/* mud line from standing in floodwater */}
    {wetTo > 0 && <g clipPath={`url(#${id}clip)`} data-part="mud-line">
     <path d={`${mudEdge}L264 6L-264 6Z`} fill="#6E5537" opacity={.5}/>
     <path d={mudEdge} stroke="#5A4329" strokeWidth={2.4} fill="none" opacity={.8}/>
    </g>}
   </g>
   {CAR.wheels.map(cx => <path key={'a' + cx} d={archOuter(cx)} fill="#24292E"/>)}
   {/* mirror with its amber repeater */}
   <path d="M118 -146C110 -150 108 -162 116 -166L136 -166C142 -162 142 -152 136 -146Z" fill="#E4E9ED" stroke="#8B959E" strokeWidth={1}/>
   <path d="M117 -148L136 -147" stroke={amber} strokeWidth={2.6}/>
   <path d="M124 -146L128 -139L134 -139L132 -146Z" fill="#1E2328"/>
   {/* the roof sensor dome on its plinth */}
   <path d="M-100 -204C-96 -210 -90 -212 -80 -212L14 -212C24 -212 30 -209 32 -204Z" fill="#2A3036"/>
   <rect x={18} y={-219} width={13} height={8} rx={2} fill="#1E2328"/>
   <path d={POD_DOME} fill={`url(#${id}dome)`} stroke="#9AA4AD" strokeWidth={1}/>
   <g clipPath={`url(#${id}dome)`}>
    <rect x={-80} y={-233} width={80} height={9} fill="#1C232A"/>
    <path d="M-72 -231L-40 -231" stroke="#7FA0B8" strokeWidth={1.4} opacity={.7}/>
   </g>
   <ellipse cx={-42} cy={-247} rx={20} ry={2.6} fill="#FFFFFF" opacity={.8}/>
   {/* curbside rear door: the aperture and its empty rear seat, then the door swung out on its hinge */}
   {door > 0 && <g data-part="rear-door-open">
    <g mask={`url(#${id}arches)`}>
     <path d={REAR_DOOR} fill="#15191D"/>
     <path d="M-170 -36L-168 -84C-150 -96 -80 -96 -50 -88L-48 -36Z" fill="#CFC3AE"/>
     <path d="M-164 -86L-160 -150C-150 -158 -110 -160 -96 -150L-94 -90Z" fill="#BDB09A"/>
     <path d="M-160 -120L-96 -118" stroke="#9E927E" strokeWidth={1.4}/>
     <path d={REAR_DOOR} fill="#000000" opacity={.25 * (1 - k)}/>
    </g>
    <g transform={`translate(${CAR.hinge} 0) scale(${k.toFixed(4)} ${(1 + .07 * clamp(door)).toFixed(4)}) translate(${-CAR.hinge} 0)`}>
     <g clipPath={`url(#${id}clip)`} mask={`url(#${id}arches)`}>
      <path d={REAR_DOOR} fill={`url(#${id}body)`}/>
      <path d={REAR_DOOR} fill={`url(#${id}key)`}/>
      <path d={REAR_DOOR_GLASS} fill="#3A4652"/>
      <path d={REAR_DOOR_GLASS} fill={`url(#${id}glass)`}/>
      <rect x={-104} y={-128} width={30} height={5} rx={2.5} fill="#CBD2D8"/>
      <ellipse cx={-112} cy={-66} rx={16} ry={9} fill="#9EA8B1" opacity={.42}/>
     </g>
     <path d={REAR_DOOR} fill="none" stroke="#6F7982" strokeWidth={1.6}/>
    </g>
    <path d={`M${lerp(CAR.doorEnd, CAR.hinge, 1 - k).toFixed(1)} -150L${lerp(CAR.doorEnd, CAR.hinge, 1 - k).toFixed(1)} -34`}
     stroke="#4C555E" strokeWidth={6 * clamp(door * 2)} opacity={.9}/>
   </g>}
  </g>
  {/* lit lamps throw light past the body */}
  <ellipse cx={CAR.nose[0] + 10} cy={CAR.nose[1]} rx={46} ry={16} fill={`url(#${id}glowW)`} opacity={.55}/>
  {brake > 0 && <ellipse cx={CAR.tail[0] - 4} cy={CAR.tail[1]} rx={58} ry={26} fill={`url(#${id}glowR)`} opacity={brake}/>}
  {hazard > 0 && <g data-part="hazard-glow" opacity={hazard}>
   <circle cx={CAR.hazardFront[0] + 6} cy={CAR.hazardFront[1]} r={34} fill={`url(#${id}glowA)`}/>
   <circle cx={CAR.hazardRear[0] - 2} cy={CAR.hazardRear[1]} r={30} fill={`url(#${id}glowA)`}/>
   <circle cx={127} cy={-147} r={20} fill={`url(#${id}glowA)`}/>
  </g>}
 </g>;
};

export type TopProps = {brake?: number; hazard?: number; door?: number; shadow?: number; wetTo?: number};
const TOP_BODY = 'M-256 -92C-262 -50 -262 50 -256 92C-248 106 -228 112 -196 112L188 110C226 108 250 98 258 72'
 + 'C264 30 264 -30 258 -72C250 -98 226 -108 188 -110L-196 -112C-228 -112 -248 -106 -256 -92Z';
/** The car straight down from above, facing +x. Its curbside (right) is +y. */
const Top: React.FC<TopProps> = ({brake = 0, hazard = 0, door = 0, shadow = 1, wetTo = 0}) => {
 const id = useUid('rtt');
 const amber = mixHex(CAR_PAINT.amberOff, CAR_PAINT.amber, hazard);
 const red = mixHex(CAR_PAINT.brakeOff, CAR_PAINT.brake, brake);
 return <g data-part="robotaxi-top">
  <defs>
   <linearGradient id={`${id}b`} x1="-260" y1="-112" x2="200" y2="112" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor={CAR_PAINT.lit}/><stop offset=".6" stopColor={CAR_PAINT.body}/><stop offset="1" stopColor={CAR_PAINT.shade}/>
   </linearGradient>
   <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#4D5E6E"/><stop offset=".5" stopColor="#1E2731"/><stop offset="1" stopColor="#141A21"/>
   </linearGradient>
   <radialGradient id={`${id}d`} cx="-54" cy="-14" r="56" gradientUnits="userSpaceOnUse">
    <stop offset="0" stopColor="#FFFFFF"/><stop offset=".75" stopColor="#E1E6EA"/><stop offset="1" stopColor="#AAB3BB"/>
   </radialGradient>
   <radialGradient id={`${id}a`}><stop offset="0" stopColor="#FFC24A" stopOpacity={.95}/><stop offset="1" stopColor="#FFC24A" stopOpacity={0}/></radialGradient>
   <radialGradient id={`${id}r`}><stop offset="0" stopColor="#FF5A3C" stopOpacity={.9}/><stop offset="1" stopColor="#FF5A3C" stopOpacity={0}/></radialGradient>
   <clipPath id={`${id}c`}><path d={TOP_BODY}/></clipPath>
  </defs>
  {shadow > 0 && <path d={TOP_BODY} transform="translate(18 16)" fill="#0E1013" opacity={.3 * shadow}/>}
  {[[-206, -126], [-206, 104], [134, -124], [134, 102]].map(([x, y], i) => <rect key={i} x={x} y={y} width={76} height={22} rx={8} fill="#17191C"/>)}
  <path d={TOP_BODY} fill={`url(#${id}b)`} stroke="#9AA4AD" strokeWidth={1.4}/>
  {wetTo > 0 && <path d={TOP_BODY} fill="#6E5537" opacity={.12 * clamp(wetTo / 60)} clipPath={`url(#${id}c)`}/>}
  <path d="M190 -84C222 -70 240 -40 244 0C240 40 222 70 190 84" stroke="#C3CBD2" strokeWidth={2} fill="none"/>
  <path d="M138 -90C120 -96 92 -98 66 -98L66 98C92 98 120 96 138 90C146 60 146 -60 138 -90Z" fill={`url(#${id}g)`}/>
  <path d="M-150 -92L-150 92C-170 90 -192 84 -204 76C-210 30 -210 -30 -204 -76C-192 -84 -170 -90 -150 -92Z" fill={`url(#${id}g)`}/>
  <path d="M66 -98L-150 -94L-150 -84L66 -88ZM66 98L-150 94L-150 84L66 88Z" fill="#1E2731"/>
  <path d="M106 -110L118 -132L134 -130L128 -110ZM106 110L118 132L134 130L128 110Z" fill="#E4E9ED" stroke="#8B959E" strokeWidth={1}/>
  <path d="M118 -131L134 -129M118 131L134 129" stroke={amber} strokeWidth={3}/>
  {/* the roof dome from above: a white disc, its dark scanning band as a ring, a lit cap */}
  <rect x={-98} y={-40} width={112} height={80} rx={20} fill="#2A3036"/>
  <circle cx={-40} cy={0} r={46} fill={`url(#${id}d)`} stroke="#9AA4AD" strokeWidth={1}/>
  <circle cx={-40} cy={0} r={40} fill="none" stroke="#1C232A" strokeWidth={6}/>
  <circle cx={-48} cy={-8} r={14} fill="#FFFFFF" opacity={.6}/>
  {/* lamps at the corners */}
  <path d="M248 -92L258 -70L252 -66L242 -86ZM248 92L258 70L252 66L242 86Z" fill="#E2EAF0"/>
  <path d="M-256 -88L-250 -64L-256 -62L-262 -84ZM-256 88L-250 64L-256 62L-262 84Z" fill={red}/>
  {[[238, -100], [238, 100], [-246, -100], [-246, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={5} fill={amber}/>)}
  {brake > 0 && <g opacity={brake}>{[-74, 74].map(y => <ellipse key={y} cx={-274} cy={y} rx={34} ry={22} fill={`url(#${id}r)`}/>)}</g>}
  {hazard > 0 && <g opacity={hazard} data-part="hazard-glow">{[[238, -100], [238, 100], [-246, -100], [-246, 100]].map(([x, y], i) =>
   <circle key={i} cx={x} cy={y} r={30} fill={`url(#${id}a)`}/>)}</g>}
  {/* curbside rear door swung out on its front hinge, the empty rear seat inside */}
  {door > 0 && <g data-part="rear-door-open">
   <rect x={-176} y={80} width={134} height={32} fill="#15191D"/>
   <rect x={-168} y={84} width={84} height={24} rx={6} fill="#CFC3AE"/>
   <g transform={`rotate(${(-58 * clamp(door)).toFixed(2)} ${CAR.hinge} 110)`}>
    <rect x={-178} y={104} width={136} height={12} rx={4} fill={`url(#${id}b)`} stroke="#8B959E" strokeWidth={1.2}/>
    <rect x={-174} y={104} width={128} height={4} fill="#1E2731"/>
   </g>
  </g>}
 </g>;
};

export type CabProps = {
 /** steering wheel turn, degrees, positive clockwise */ steer: number;
 /** what the windshield shows; the region stands behind it */ outside?: React.ReactNode;
 /** the centre screen's route progress 0..1 */ route?: number;
};
/** The windshield opening in frame coordinates; the episode draws its outside world inside it. */
export const CAB_WINDSHIELD = 'M140 306C380 262 700 262 940 306L1010 960L70 960Z';
export const CAB = {wheel: [330, 1012] as Pt, wheelR: 150, driverHead: [250, 1150, 160, 118] as [number, number, number, number],
 passengerHead: [722, 1166, 148, 110] as [number, number, number, number], screen: [566, 1000, 236, 140] as [number, number, number, number]};
/** The cabin from the rear seat, drawn in frame coordinates. The driver seat is EMPTY. */
const Cab: React.FC<CabProps> = ({steer, outside, route = 0}) => {
 const id = useUid('rtc');
 const [wx, wy] = CAB.wheel, R = CAB.wheelR;
 const [sx, sy, sw, sh] = CAB.screen;
 const routePts: Pt[] = [[.12, .82], [.3, .74], [.46, .58], [.62, .5], [.8, .36], [.86, .22]];
 const at = (q: number): Pt => {
  const n = routePts.length - 1, f = clamp(q) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i;
  return [lerp(routePts[i][0], routePts[i + 1][0], u), lerp(routePts[i][1], routePts[i + 1][1], u)];
 };
 const car = at(.55 + .45 * clamp(route));
 const seat = (x0: number, y0: number, w: number) => `M${x0 - 30} 1960C${x0} 1500 ${x0} 1400 ${x0 + 10} 1322C${x0 + 30} 1292 ${x0 + 40} 1292 ${x0 + 40} 1292C${x0 + 80} 1266 ${x0 + w - 80} 1266 ${x0 + w - 40} 1292C${x0 + w - 10} 1322 ${x0 + w} 1500 ${x0 + w + 30} 1960Z`;
 return <g data-part="robotaxi-cabin">
  <defs>
   <clipPath id={`${id}ws`}><path d={CAB_WINDSHIELD}/></clipPath>
   <linearGradient id={`${id}roof`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A4F57"/><stop offset="1" stopColor="#2D3137"/></linearGradient>
   <linearGradient id={`${id}dash`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#31363C"/><stop offset=".3" stopColor="#212428"/><stop offset="1" stopColor="#16181B"/></linearGradient>
   <linearGradient id={`${id}seat`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5E656C"/><stop offset="1" stopColor="#373C42"/></linearGradient>
   <linearGradient id={`${id}pillar`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2C3036"/><stop offset="1" stopColor="#474C53"/></linearGradient>
   <linearGradient id={`${id}scr`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8EEF2"/><stop offset="1" stopColor="#C9D4DC"/></linearGradient>
  </defs>
  {/* the outside, seen through the glass: the region behind and whatever the episode places */}
  <g clipPath={`url(#${id}ws)`} data-part="windshield-view">{outside}
   <path d="M120 300L420 300L160 960L70 960Z" fill="#FFFFFF" opacity={.05}/>
   <path d="M150 940C330 930 450 932 520 944M560 946C660 934 800 932 960 944" stroke="#15181B" strokeWidth={9} strokeLinecap="round" fill="none"/>
  </g>
  <path d="M-20 -20H1100V300C1040 296 980 300 940 306C700 262 380 262 140 306C100 300 40 296 -20 300Z" fill={`url(#${id}roof)`}/>
  <rect x={470} y={196} width={140} height={44} rx={14} fill="#24282D"/>
  <circle cx={505} cy={218} r={7} fill="#F3E7C9" opacity={.8}/><circle cx={575} cy={218} r={7} fill="#F3E7C9" opacity={.8}/>
  <path d="M548 240L556 292" stroke="#1E2226" strokeWidth={14}/>
  <rect x={452} y={290} width={210} height={56} rx={20} fill="#1E2226"/>
  <rect x={464} y={300} width={186} height={36} rx={14} fill="#55636F"/>
  <path d="M-20 300C40 296 100 300 140 306L70 960L-20 980Z" fill={`url(#${id}pillar)`}/>
  <path d="M1100 300C1040 296 980 300 940 306L1010 960L1100 980Z" fill={`url(#${id}pillar)`}/>
  {/* the dashboard, its instrument hood and the centre screen with a plain route line */}
  <path d="M-20 960C160 922 400 908 540 908C680 908 920 922 1100 960L1100 1960L-20 1960Z" fill={`url(#${id}dash)`}/>
  <path d="M-20 960C160 922 400 908 540 908C680 908 920 922 1100 960" stroke="#5A6068" strokeWidth={3} fill="none"/>
  {Array.from({length: 14}, (_, i) => <path key={i} d={`M${560 + i * 18} 926L${566 + i * 18} 940`} stroke="#0F1113" strokeWidth={4}/>)}
  <path d="M206 936C236 896 420 890 462 930L452 968L218 968Z" fill="#191B1E"/>
  <rect x={236} y={934} width={196} height={28} rx={8} fill="#2F4558"/>
  <path d="M250 954L300 942L360 946L420 940" stroke="#8FB6D3" strokeWidth={3} fill="none" opacity={.8}/>
  <rect x={sx - 8} y={sy - 8} width={sw + 16} height={sh + 16} rx={16} fill="#0F1113"/>
  <rect x={sx} y={sy} width={sw} height={sh} rx={10} fill={`url(#${id}scr)`}/>
  <g data-part="route-screen">
   {[.2, .45, .7].map(f => <path key={'h' + f} d={`M${sx + 8} ${sy + sh * f}L${sx + sw - 8} ${sy + sh * f - 10}`} stroke="#FFFFFF" strokeWidth={5}/>)}
   {[.3, .62].map(f => <path key={'v' + f} d={`M${sx + sw * f} ${sy + 6}L${sx + sw * f + 14} ${sy + sh - 6}`} stroke="#FFFFFF" strokeWidth={5}/>)}
   <path d={'M' + routePts.map(([u, v]) => `${(sx + u * sw).toFixed(1)} ${(sy + v * sh).toFixed(1)}`).join('L')} stroke="#2F7BBF" strokeWidth={5} fill="none" strokeLinejoin="round"/>
   <circle cx={sx + .86 * sw} cy={sy + .22 * sh} r={9} fill="#1F2630" stroke="#FFFFFF" strokeWidth={2}/>
   <circle cx={sx + car[0] * sw} cy={sy + car[1] * sh} r={8} fill="#FFFFFF" stroke="#1F2630" strokeWidth={3}/>
  </g>
  {/* steering column and the wheel, turning with no hands on it */}
  <path d={`M${wx - 30} ${wy + 20}L${wx + 30} ${wy + 20}L${wx + 42} ${wy + 120}L${wx - 42} ${wy + 120}Z`} fill="#15171A"/>
  <g transform={`rotate(${steer.toFixed(2)} ${wx} ${wy})`} data-part="steering-wheel">
   <circle cx={wx} cy={wy} r={R} fill="none" stroke="#131518" strokeWidth={28}/>
   <path d={`M${wx - R * .92} ${wy - R * .38}A${R} ${R} 0 0 1 ${wx + R * .1} ${wy - R * .99}`} stroke="#3E444C" strokeWidth={7} fill="none" strokeLinecap="round"/>
   <path d={`M${wx - R + 10} ${wy + 6}L${wx - 34} ${wy + 10}M${wx + R - 10} ${wy + 6}L${wx + 34} ${wy + 10}M${wx} ${wy + 34}L${wx} ${wy + R - 12}`} stroke="#1B1E22" strokeWidth={26} strokeLinecap="round"/>
   <ellipse cx={wx} cy={wy + 8} rx={48} ry={40} fill="#22262A" stroke="#2F343A" strokeWidth={3}/>
   <ellipse cx={wx} cy={wy + 6} rx={16} ry={11} fill="#2F343A"/>
   {/* a pale leather top-centre band and a lit grip arc on the rim: the turn reads as a moving mark */}
   <path d={`M${wx - 16} ${wy - R - 12}h32v26h-32Z`} fill="#D8C79E" stroke="#8E7E58" strokeWidth={2}/>
   <path d={`M${wx + R * .26} ${wy - R * .97}A${R} ${R} 0 0 1 ${wx + R * .86} ${wy - R * .5}`} stroke="#8A919A" strokeWidth={9} fill="none" strokeLinecap="round"/>
  </g>
  {/* the two front seats, both empty: a headrest and a seat back with nobody in front of them */}
  <path d="M-20 1380C200 1350 880 1350 1100 1380L1100 1960L-20 1960Z" fill="#26292E"/>
  <path d={seat(150, 1262, 360)} fill={`url(#${id}seat)`}/>
  <path d={seat(642, 1276, 310)} fill={`url(#${id}seat)`}/>
  <path d="M500 1960L540 1310L626 1310L666 1960Z" fill="#1A1C20"/>
  {[[CAB.driverHead, 'd'], [CAB.passengerHead, 'p']].map(([b, k]) => {
   const [x, y, w, h] = b as [number, number, number, number];
   return <g key={k as string} data-part={k === 'd' ? 'empty-driver-headrest' : 'passenger-headrest'}>
    <rect x={x + w * .28} y={y + h - 4} width={10} height={26} fill="#8E949A"/><rect x={x + w * .66} y={y + h - 4} width={10} height={26} fill="#8E949A"/>
    <rect x={x} y={y} width={w} height={h} rx={40} fill={`url(#${id}seat)`}/>
    <path d={`M${x + 22} ${y + 18}C${x + w * .4} ${y + 6} ${x + w * .6} ${y + 6} ${x + w - 26} ${y + 16}`} stroke="#7A8188" strokeWidth={3} fill="none"/>
   </g>;
  })}
 </g>;
};

export type HeroProps =
 | ({part: 'side'} & SideProps)
 | ({part: 'top'} & TopProps)
 | ({part: 'cab'} & CabProps);

/** The hero group's one export: the car from the side, from above, and its cabin. */
export const RobotaxiHero: React.FC<HeroProps> = (props) => {
 if (props.part === 'side') return <Side {...props}/>;
 if (props.part === 'top') return <Top {...props}/>;
 if (props.part === 'cab') return <Cab {...props}/>;
 throw new Error('Unknown robotaxi part');
};
