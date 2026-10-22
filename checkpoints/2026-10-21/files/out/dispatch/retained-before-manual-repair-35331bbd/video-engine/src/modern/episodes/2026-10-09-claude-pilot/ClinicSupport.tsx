import React from 'react';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';

/**
 * ClinicSupport, the fresh authored support group for the 2026-10-09-claude-pilot edition.
 *
 * A Southeast Texas clinic around the chart: a salt-weathered wall with a window onto flat
 * Gulf marsh under a white haze (cordgrass, a wind-leaned live oak, a grey bay line, no planted
 * palms), a worn laminate desk, a three-quarter workstation monitor with a blank lit screen,
 * a keyboard with blank keys and one teal send key, anonymous hands in white-coat sleeves over
 * scrub cuffs (articulated fingers, knuckles, thumbs, nails, contact and cast shadows, no face or
 * identity), a masked credential card, the teal sleeve that marks the boundary of the health
 * record with a light that runs along it, the record's padlock, the docked tool box labelled
 * OpenEvidence with an intake slot on its side, seams, bevels, screws, a vent, status lamps and an
 * output mouth, where questions go in and answers come out, a
 * framed share board of anonymous clinician figures (head and shoulders in a white coat or
 * scrubs with a clipped badge, never a face) that light one by one to picture UTMB's own
 * more-than-half report as a share, and the clinic's back wall with its framed window and sill
 * for the close reading shots.
 *
 * Disclosed illustration. No real screen, logo, face, patient information, vendor interface or
 * map of UTMB's campuses. The tool label is native type, not a mark. The lit figures are a share
 * picture, never a count: the release gives no clinician number. Every figure is the same
 * line work with no facial feature; only the hair or cap outline, shoulders and workwear vary,
 * and those variations are spread evenly across lit and unlit figures. Pure function of its props; the episode drives every prop from the
 * film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
type Pt = [number,number];
export type ClinicStage = 'front'|'desk';
export type ClinicSupportProps =
 | {part:'room'; stage:ClinicStage; spill?:number}
 | {part:'desk'; stage:ClinicStage}
 | {part:'workstation'; glow?:number}
 | {part:'keyboard'; down?:number[]}
 | {part:'hands'; side:'L'|'R'; lift?:number[]; bob?:number; reach?:number; elbow?:Pt; shoulder?:Pt}
 | {part:'credential'; dots:number}
 | {part:'boundary'; w:number; h:number; glow:number; slot?:number; gap?:number; pulse?:number; label?:'left'|'right'}
 | {part:'lock'; open:number; halo?:number}
 | {part:'tool'; stage:ClinicStage; glow:number; intake?:number; leds?:number; emit?:number}
 | {part:'rail'; w:number}
 | {part:'shelf'; w:number}
 | {part:'stand'}
 | {part:'wall'; lit:number; share?:number; label?:number}
 | {part:'backwall'; stage:ClinicStage; h:number; glazed?:boolean};

/** Keyboard geometry, shared with the episode so fingertips land exactly on key centres. */
export const KEY = {pitch:64, w:54, h:30, rowStep:38, x0:26, y0:18, rowShift:14, cols:8, bodyW:600, bodyH:184, enterW:92, spaceW:182, travel:6};
/** Row 3 carries two keys, the space bar over columns 2 to 4, then two more keys. */
const ROW_KEYS=[[0,1,2,3,4,5,6,7],[0,1,2,3,4,5,6,7],[0,1,2,3,4,5,6,7],[0,1,2,5,6]];
export const keyCenter=(row:number,col:number):Pt=>[KEY.x0+col*KEY.pitch+row*KEY.rowShift+KEY.w/2, KEY.y0+row*KEY.rowStep+KEY.h/2];
/** The send key: the wide teal key at the right end of the home row. */
export const ENTER_KEY = KEY.cols+7;
const keyWidth=(i:number)=>i===ENTER_KEY?KEY.enterW:i===3*KEY.cols+2?KEY.spaceW:KEY.w;
/** The centre of key index i (row*cols+col), wide keys included, in keyboard units. */
export const keyTarget=(i:number):Pt=>{const r=Math.floor(i/KEY.cols),k=i%KEY.cols;
 return [KEY.x0+k*KEY.pitch+r*KEY.rowShift+keyWidth(i)/2, KEY.y0+r*KEY.rowStep+KEY.h/2];};
/** Right-hand fingertip offsets from the index tip (index, middle, ring, little), one key apart. */
export const FINGER_TIPS:Pt[]=[[0,0],[64,-6],[128,0],[190,14]];
/** Share board layout and the pins the episode hangs tags from, in the board's local units.
 * Twelve clinician figures, seven lit: more than half, drawn as a share and never as a count. */
export const WALL_TILES = 12;
export const WALL_LIT_SHARE_TILES = 7;
const WALL_COLS = 4, WALL_ROWS = 3, FIG_W = 172, FIG_H = 184, FIG_PITCH:Pt = [196,200];
export const WALL_SIZE:Pt=[784,740];
export const WALL_PINS={start:[40,677] as Pt,half:[382,677] as Pt,end:[700,677] as Pt};
const BAR_Y=660;
/** Boundary pins along its top edge, as fractions of its width. */
export const BOUNDARY_PINS=[.18,.5,.82];
/** Tool box geometry: the output mouth on the front face, the side face depth, and (front stage)
 * the intake slit on the left side face where the question card goes in, in tool-local units. */
export const TOOL={front:{w:272,h:176,mouthY:150,depth:26,intakeX:-15,intakeY0:30,intakeY1:146},
 desk:{w:272,h:170,mouthY:150,depth:22,intakeX:-12,intakeY0:40,intakeY1:130}};
/** Lighting order: the first seven lit figures are spread over all three rows. */
const LIGHT_ORDER = [5,0,10,3,8,1,11,6,2,9,4,7];

const clamp = (v:number) => Math.min(1, Math.max(0, v));
const hash = (n:number) => {const s = Math.sin(n*91.3+47.1)*24634.6345; return s-Math.floor(s);};
const wob = (seed:number, i:number, amp:number) => (hash(seed*17.9+i*5.1)-.5)*2*amp;
const mix = (a:string,b:string,t:number) => {
 const p=(h:string)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const [x,y]=[p(a),p(b)];
 return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*clamp(t)).toString(16).padStart(2,'0')).join('');
};
function blob(x:number,y:number,w:number,h:number,r:number,seed:number,amp=2):string{
 const j=(i:number)=>wob(seed,i,amp);
 return `M${x+r+j(1)} ${y+j(2)}H${x+w-r+j(3)}Q${x+w+j(4)} ${y+j(5)} ${x+w+j(6)} ${y+r}V${y+h-r+j(7)}`
  +`Q${x+w+j(8)} ${y+h} ${x+w-r} ${y+h+j(9)}H${x+r+j(10)}Q${x+j(11)} ${y+h} ${x} ${y+h-r}V${y+r+j(12)}Q${x} ${y} ${x+r+j(1)} ${y+j(2)}Z`;
}
const usePal = ():Pal => {
 const ad = useArtDirection();
 if (!ad) throw new Error('Clinic support requires the executed art direction profile');
 return ad.palette;
};
const Label:React.FC<{x:number;y:number;size:number;fill:string;children:React.ReactNode;anchor?:'start'|'middle'|'end'}> =
 ({x,y,size,fill,children,anchor='start'}) =>
 <text x={x} y={y} fontFamily={FONT.body} fontSize={size} fontWeight={700} fill={fill} textAnchor={anchor}>{children}</text>;

const SKIN='#A9714C', SKIN_DARK='#7E4F33', SKIN_LIGHT='#C99272', SKIN_LINE='#5E3925', NAIL='#E4BFA6', SLEEVE='#6F8DA6', SLEEVE_DARK='#4F6A82';
const COAT='#F3F1EA', COAT_SHADE='#C6CBC6', COAT_EDGE='#86908F';

const Defs:React.FC<{c:Pal}> = ({c}) => <defs>
 <filter id="cs-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10"/></filter>
 <filter id="cs-haze" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter>
 <filter id="cs-deep" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
 <filter id="cs-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves={3} seed={23} result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .25  0 0 0 0 .24  0 0 0 0 .2  0 0 0 .07 0" result="g"/>
  <feComposite in="g" in2="SourceAlpha" operator="in" result="gg"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gg"/></feMerge>
 </filter>
 <linearGradient id="cs-wall" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={mix(c.paper,'#ffffff',.25)}/><stop offset=".45" stopColor={c.background}/><stop offset="1" stopColor={mix(c.background,c.midground,.42)}/>
 </linearGradient>
 <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#F4F3EC"/><stop offset=".7" stopColor="#E3E5DF"/><stop offset="1" stopColor="#D6DCD7"/>
 </linearGradient>
 <linearGradient id="cs-marsh" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#AFA978"/><stop offset=".5" stopColor="#8F8C5C"/><stop offset="1" stopColor="#5F6347"/>
 </linearGradient>
 <linearGradient id="cs-deskplane" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#B9B19F"/><stop offset=".35" stopColor="#CDC5B2"/><stop offset="1" stopColor="#D9D1BE"/>
 </linearGradient>
 <linearGradient id="cs-shaft" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#FFF6DE" stopOpacity={.5}/><stop offset="1" stopColor="#FFF6DE" stopOpacity={0}/>
 </linearGradient>
 <radialGradient id="cs-screen" cx=".5" cy=".5" r=".5">
  <stop offset="0" stopColor="#E6FBF6" stopOpacity={.85}/><stop offset="1" stopColor="#BDE8E0" stopOpacity={0}/>
 </radialGradient>
 <linearGradient id="cs-plastic" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#F1F0EA"/><stop offset=".6" stopColor="#C9CCC6"/><stop offset="1" stopColor="#9EA5A1"/>
 </linearGradient>
 <linearGradient id="cs-tool" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={mix(c.hero,'#ffffff',.2)}/><stop offset=".7" stopColor={c.hero}/><stop offset="1" stopColor={mix(c.hero,c.ink,.3)}/>
 </linearGradient>
 {/* skin and coat gradients come in a mirrored pair, so the left hand (drawn mirrored) is still
     lit from the window at the upper left */}
 <linearGradient id="cs-skin" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={SKIN_LIGHT}/><stop offset=".55" stopColor={SKIN}/><stop offset="1" stopColor={SKIN_DARK}/>
 </linearGradient>
 <linearGradient id="cs-skin-l" x1="1" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor={SKIN_LIGHT}/><stop offset=".55" stopColor={SKIN}/><stop offset="1" stopColor={SKIN_DARK}/>
 </linearGradient>
 <linearGradient id="cs-coat" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stopColor="#FFFFFF"/><stop offset=".45" stopColor={COAT}/><stop offset="1" stopColor={COAT_SHADE}/>
 </linearGradient>
 <linearGradient id="cs-coat-l" x1="1" y1="0" x2="0" y2="0">
  <stop offset="0" stopColor="#FFFFFF"/><stop offset=".45" stopColor={COAT}/><stop offset="1" stopColor={COAT_SHADE}/>
 </linearGradient>
 <linearGradient id="cs-sleeve" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stopColor={mix(SLEEVE,'#ffffff',.15)}/><stop offset="1" stopColor={SLEEVE_DARK}/>
 </linearGradient>
 <linearGradient id="cs-side" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stopColor={mix(c.hero,c.ink,.55)}/><stop offset="1" stopColor={mix(c.hero,c.ink,.3)}/>
 </linearGradient>
 <linearGradient id="cs-recess" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stopColor="#0B1416"/><stop offset="1" stopColor={mix(c.hero,c.ink,.75)}/>
 </linearGradient>
 <linearGradient id="cs-brass" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#E9CF8E"/><stop offset=".5" stopColor="#B8924E"/><stop offset="1" stopColor="#7E6233"/>
 </linearGradient>
</defs>;

/** The Gulf window view: flat, hazy, white sky, cordgrass and a wind-leaned live oak. */
const GulfWindow:React.FC<{c:Pal;x:number;y:number;w:number;h:number;deep:boolean}> = ({c,x,y,w,h,deep}) => {
 const horizon=y+h*.56;
 const id=deep?'cs-win-deep':'cs-win-front';
 return <g data-subject="gulf-window">
  <defs><clipPath id={id}><rect x={x} y={y} width={w} height={h}/></clipPath></defs>
  <g clipPath={`url(#${id})`} filter={deep?'url(#cs-deep)':'url(#cs-haze)'}>
   <rect x={x} y={y} width={w} height={h} fill="url(#cs-sky)"/>
   <path d={`M${x} ${horizon}H${x+w}V${horizon+h*.05}H${x}Z`} fill="#A8B7B8"/>
   <path d={`M${x} ${horizon+h*.04}H${x+w}V${y+h}H${x}Z`} fill="url(#cs-marsh)"/>
   <path d={`M${x} ${horizon+h*.2}Q${x+w*.3} ${horizon+h*.16} ${x+w*.55} ${horizon+h*.23}T${x+w} ${horizon+h*.19}`} stroke="#9FB0AE" strokeWidth={h*.025} fill="none" opacity={.8}/>
   {Array.from({length:26},(_,i)=><path key={i} d={`M${x+i*w/25+wob(5,i,6)} ${y+h}l${3+wob(6,i,4)} ${-h*(.16+hash(i)*.12)}`}
    stroke="#7C7A4C" strokeWidth={3} opacity={.7}/>)}
   {/* a live oak shaped by the prevailing wind: short leaning trunk, broad low crown pushed to one side */}
   <path d={`M${x+w*.58} ${horizon+h*.08}C${x+w*.6} ${horizon+h*.0} ${x+w*.63} ${horizon-h*.04} ${x+w*.7} ${horizon-h*.07}`}
    stroke="#4A4636" strokeWidth={w*.028} fill="none" strokeLinecap="round"/>
   <path d={`M${x+w*.66} ${horizon-h*.05}L${x+w*.82} ${horizon-h*.09}M${x+w*.64} ${horizon-h*.04}L${x+w*.52} ${horizon-h*.07}`}
    stroke="#4A4636" strokeWidth={w*.012} fill="none" strokeLinecap="round"/>
   {[[.5,-.075,.09,.035],[.6,-.1,.11,.045],[.73,-.11,.12,.05],[.86,-.095,.1,.04],[.95,-.075,.07,.03],[.66,-.07,.13,.03],[.8,-.065,.11,.028]].map(([cx,cy,rx,ry],i)=>
    <ellipse key={i} cx={x+w*cx+wob(30,i,3)} cy={horizon+h*cy+wob(31,i,2)} rx={w*rx} ry={h*ry} fill={i%2?'#56633F':'#4C5839'}/>)}
   {[[.6,-.115,.06,.018],[.75,-.13,.07,.02],[.88,-.11,.05,.016]].map(([cx,cy,rx,ry],i)=>
    <ellipse key={'h'+i} cx={x+w*cx} cy={horizon+h*cy} rx={w*rx} ry={h*ry} fill="#7A8758" opacity={.7}/>)}
   <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" opacity={.28}/>
  </g>
  <rect x={x} y={y} width={w} height={h} fill="none" stroke={mix(c.paper,c.ink,.35)} strokeWidth={14}/>
  <rect x={x+4} y={y+4} width={w-8} height={h-8} fill="none" stroke="#ffffff" strokeOpacity={.6} strokeWidth={3}/>
  <path d={`M${x+w*.5+wob(3,1,2)} ${y}V${y+h}`} stroke={mix(c.paper,c.ink,.3)} strokeWidth={9}/>
  <path d={`M${x-22} ${y+h+10}H${x+w+26}`} stroke={mix(c.paper,c.ink,.25)} strokeWidth={18} strokeLinecap="round"/>
  <path d={`M${x-20} ${y+h+4}H${x+w+22}`} stroke="#ffffff" strokeOpacity={.55} strokeWidth={4} strokeLinecap="round"/>
  <path d={`M${x+8} ${y+h-6}q18 -8 30 2M${x+w-40} ${y+h-8}q14 -6 30 0`} stroke="#ffffff" strokeOpacity={.5} strokeWidth={5} fill="none"/>
 </g>;
};

const Room:React.FC<{c:Pal;stage:ClinicStage;spill:number}> = ({c,stage,spill}) => {
 const win=stage==='front'?{x:40,y:190,w:300,h:330}:{x:40,y:250,w:430,h:470};
 return <g data-subject="clinic-room">
  <rect x={-400} y={-200} width={2400} height={2320} fill="url(#cs-wall)"/>
  <g filter="url(#cs-grain)"><rect x={-400} y={-200} width={2400} height={2320} fill={c.background} opacity={.12}/></g>
  <rect x={640} y={-200} width={1360} height={2320} fill="#BFD3D5" opacity={.16}/>
  <GulfWindow c={c} x={win.x} y={win.y} w={win.w} h={win.h} deep={stage==='desk'}/>
  <path d={`M${win.x+20} ${win.y+win.h}L${win.x+win.w} ${win.y+win.h}L${win.x+win.w+520} ${1240}L${win.x+300} ${1240}Z`}
   fill="url(#cs-shaft)" opacity={.55+.35*clamp(spill)} filter="url(#cs-soft)"/>
 </g>;
};

/** The laminate desk plane. Front stage: a higher camera sees more of it and its far edge sits lower. */
const Desk:React.FC<{c:Pal;stage:ClinicStage}> = ({c,stage}) => {
 const far=stage==='front'?[980,968]:[910,880];
 return <g data-subject="laminate-desk">
  <path d={`M-400 ${far[0]}L2000 ${far[1]}L2000 2120L-400 2120Z`} fill="url(#cs-deskplane)"/>
  <path d={`M-400 ${far[0]}L2000 ${far[1]}`} stroke="#7F7766" strokeWidth={8}/>
  <path d={`M-400 ${far[0]-3}L2000 ${far[1]-3}`} stroke="#ffffff" strokeOpacity={.45} strokeWidth={2}/>
  {Array.from({length:12},(_,i)=><path key={i} d={`M${160*i-260+wob(9,i,10)} ${far[0]}L${-700+i*300} 2120`} stroke="#A79F8C" strokeOpacity={.2} strokeWidth={2}/>)}
  <path d="M60 1210q140 -10 300 6M640 1050q120 -6 220 2" stroke="#ffffff" strokeOpacity={.22} strokeWidth={5} fill="none"/>
  <ellipse cx={890} cy={1180} rx={46} ry={12} fill="none" stroke="#8C7F69" strokeOpacity={.3} strokeWidth={3}/>
  <path d={`M-400 ${far[0]+2}L2000 ${far[1]+2}L2000 ${far[1]+40}L-400 ${far[0]+40}Z`} fill={c.ink} opacity={.05}/>
 </g>;
};

/** A three-quarter monitor with a blank lit screen, standing on the desk's far edge. */
const Workstation:React.FC<{c:Pal;glow:number}> = ({c,glow}) => {
 const g=clamp(glow);
 return <g data-subject="workstation">
  <ellipse cx={120} cy={110} rx={170} ry={200} fill="url(#cs-screen)" opacity={.35+.45*g}/>
  <ellipse cx={70} cy={262} rx={96} ry={9} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
  <path d="M6 258Q70 238 134 258Z" fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={2}/>
  <path d="M60 250L66 186H84L82 250Z" fill="#9BA29E" stroke="#6E7572" strokeWidth={1.5}/>
  <path d="M-20 12L-2 0L6 180L-12 188Z" fill="#9EA5A1" stroke="#5F6663" strokeWidth={2}/>
  <path d="M-2 0L166 26L164 164L6 180Z" fill="url(#cs-plastic)" stroke="#5F6663" strokeWidth={2.5} strokeLinejoin="round"/>
  <path d="M10 14L154 36L152 154L16 168Z" fill={mix('#DDF2EC',c.hero,.12)}/>
  <path d="M10 14L154 36L152 154L16 168Z" fill="#ffffff" opacity={.25+.45*g}/>
  <path d="M24 26L84 36L82 94L28 104Z" fill="#ffffff" opacity={.18}/>
  <path d="M0 4L164 29" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2.5}/>
 </g>;
};

/** A keyboard lying on the desk, seen from the seated position: a bevelled plastic body with a
 * front lip and feet, blank keys on skirts, two worn shiny keys and one wide teal send key with
 * a return arrow. A listed key is down: its cap drops into the well, loses its skirt and darkens. */
const Keyboard:React.FC<{c:Pal;down:number[]}> = ({c,down}) => {
 const {bodyW:BW,bodyH:BH}=KEY;
 return <g data-subject="workstation keyboard">
  <ellipse cx={BW/2+14} cy={BH+12} rx={BW*.55} ry={24} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
  {[40,BW-40].map((x,i)=><ellipse key={i} cx={x+6} cy={BH+6} rx={26} ry={6} fill={c.ink} opacity={.35}/>)}
  {/* front lip: the body's thickness, darker, under the top deck */}
  <path d={blob(2,14,BW-4,BH,24,5,2)} fill="#8E9591" stroke="#5F6663" strokeWidth={2.5}/>
  <path d={blob(0,0,BW,BH-8,26,4,2.5)} fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={3}/>
  <path d={`M20 6H${BW-24}`} stroke="#ffffff" strokeOpacity={.65} strokeWidth={3} strokeLinecap="round"/>
  <path d={`M8 22V${BH-34}`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2.5} strokeLinecap="round"/>
  {/* the key well, a shallow recessed tray */}
  <path d={blob(KEY.x0-12,KEY.y0-8,BW-KEY.x0-14,4*KEY.rowStep+6,12,6,1.5)} fill="#B7BCB6" opacity={.55}/>
  {ROW_KEYS.map((cols,r)=>cols.map(k=>{
   const i=r*KEY.cols+k, pressed=down.includes(i), w=keyWidth(i), enter=i===ENTER_KEY;
   const [x,y]=[KEY.x0+k*KEY.pitch+r*KEY.rowShift,KEY.y0+r*KEY.rowStep];
   const worn=i===10||i===13;
   const cap=enter?(pressed?mix('#CFE5E2',c.hero,.35):'#CFE5E2'):(pressed?'#C9CCC5':hash(i)>.82?'#FBFAF5':'#E9EAE4');
   return <g key={i} transform={`translate(${x} ${y+(pressed?KEY.travel:0)})`} data-key={enter?'send':undefined}>
    {/* the well under the key shows when it is down */}
    {pressed&&<path d={blob(-2,-KEY.travel-1,w+4,KEY.h+4,8,i+90,1)} fill="#5E6562" opacity={.55}/>}
    {!pressed&&<path d={blob(1,5,w,KEY.h,8,i+70,1)} fill="#7F8682" opacity={.75}/>}
    <path d={blob(0,0,w,KEY.h,8,i+9,1.2)} fill={cap} stroke={enter?mix(c.hero,'#8C928E',.4):'#8C928E'} strokeWidth={1.6}/>
    {!pressed&&<path d={`M6 5H${w-8}`} stroke="#ffffff" strokeOpacity={.8} strokeWidth={2}/>}
    {pressed&&<path d={`M5 4H${w-6}`} stroke="#4F5653" strokeOpacity={.4} strokeWidth={2}/>}
    {worn&&!pressed&&<ellipse cx={w/2-4} cy={KEY.h/2-2} rx={12} ry={6} fill="#ffffff" opacity={.55}/>}
    {enter&&<path d={`M${w-24} 9V18H${w-58}M${w-50} 12L${w-58} 18L${w-50} 24`} stroke={mix(c.hero,c.ink,.25)} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
   </g>;
  }))}
 </g>;
};

/** Rest positions of the arm in hand-local units: the elbow sits off the desk toward the lens and
 * the shoulder is far below the frame, so every arm leaves the bottom edge in every shot. */
export const ARM_REST={elbow:[110,700] as Pt,shoulder:[180,1700] as Pt};
/** A tapered quad from a to b, wa wide at a and wb wide at b. */
function limb(a:Pt,b:Pt,wa:number,wb:number):string{
 const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 return `M${a[0]+nx*wa/2} ${a[1]+ny*wa/2}L${b[0]+nx*wb/2} ${b[1]+ny*wb/2}L${b[0]-nx*wb/2} ${b[1]-ny*wb/2}L${a[0]-nx*wa/2} ${a[1]-ny*wa/2}Z`;
}
/** Knuckle (MCP) positions in hand-local units, index to little finger. */
const KNUCKLES:Pt[]=[[8,112],[70,104],[128,108],[180,124]];
const FINGER_W=[31,32,30,25];
const unit=(a:Pt,b:Pt):Pt=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return [dx/L,dy/L];};
const along=(a:Pt,b:Pt,f:number,off:Pt=[0,0]):Pt=>[a[0]+(b[0]-a[0])*f+off[0],a[1]+(b[1]-a[1])*f+off[1]];
/** One finger or thumb as three tapered phalanges with joint creases, a nail and a lit edge. */
const Digit:React.FC<{pts:Pt[];w:number;m:number;skin:string;lift:number}> = ({pts,w,m,skin,lift}) => {
 const [K,P,D,T]=pts, ws=[w,w*.92,w*.84].map(x=>x*(1+.1*lift));
 const seg=[[K,P],[P,D],[D,T]] as [Pt,Pt][];
 const u=unit(D,T), n:Pt=[-u[1],u[0]];
 const ang=Math.atan2(u[1],u[0])*180/Math.PI+90;
 const crease=(J:Pt,a:Pt,b:Pt,ww:number)=>{const v=unit(a,b),q:Pt=[-v[1],v[0]];
  return `M${J[0]-q[0]*ww*.3} ${J[1]-q[1]*ww*.3}Q${J[0]+v[0]*3} ${J[1]+v[1]*3} ${J[0]+q[0]*ww*.3} ${J[1]+q[1]*ww*.3}`;};
 const lit=-m*.24;
 return <g>
  {seg.map(([a,b],i)=><path key={'o'+i} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={SKIN_LINE} strokeWidth={ws[i]+5} strokeLinecap="round"/>)}
  {seg.map(([a,b],i)=><path key={'f'+i} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={skin} strokeWidth={ws[i]} strokeLinecap="round"/>)}
  {/* the window side of each phalanx catches the light */}
  {seg.map(([a,b],i)=><path key={'h'+i} d={`M${a[0]+lit*ws[i]} ${a[1]}L${b[0]+lit*ws[i]} ${b[1]}`} stroke={SKIN_LIGHT} strokeWidth={3} strokeLinecap="round" opacity={.7}/>)}
  <path d={crease(P,K,P,ws[0])} stroke={SKIN_LINE} strokeOpacity={.5} strokeWidth={2.2} fill="none" strokeLinecap="round"/>
  <path d={crease(D,P,D,ws[1])} stroke={SKIN_LINE} strokeOpacity={.45} strokeWidth={2} fill="none" strokeLinecap="round"/>
  <ellipse cx={P[0]-m*2} cy={P[1]+2} rx={ws[0]*.28} ry={ws[0]*.2} fill={SKIN_LIGHT} opacity={.55}/>
  <g transform={`translate(${T[0]-u[0]*ws[2]*.22+n[0]*0} ${T[1]-u[1]*ws[2]*.22}) rotate(${ang})`}>
   <rect x={-ws[2]*.3} y={-ws[2]*.36} width={ws[2]*.6} height={ws[2]*.66} rx={ws[2]*.28} fill={NAIL} stroke={SKIN_DARK} strokeWidth={1.4}/>
   <path d={`M${-ws[2]*.16} ${-ws[2]*.22}h${ws[2]*.22}`} stroke="#ffffff" strokeOpacity={.7} strokeWidth={2} strokeLinecap="round"/>
  </g>
 </g>;
};
/**
 * One anonymous arm, seen from the seated position, fingers pointing away. The forearm is in a
 * white coat sleeve with a stitched turned-back cuff and a button, a scrub cuff shows under it,
 * and the hand has a shaped back with tendons, knuckle highlights, articulated fingers (three
 * phalanges, joint creases, nails) and a two-joint thumb. Local (0,0) is the index fingertip.
 * `lift[i]` raises a finger off its key (0 is contact with a crisp contact shadow; raised, the
 * tip lifts toward the lens and its shadow separates and softens on the key below). `bob` lifts
 * the whole hand for an emphatic strike, `reach` extends the index for a push and curls the
 * others. The forearm runs from the wrist to `elbow` and the upper arm on to `shoulder`, far below
 * the frame, so the limb always leaves the picture. No face, no name, no jewellery, no identity.
 */
const Hand:React.FC<{side:'L'|'R';lift:number[];bob:number;reach:number;elbow:Pt;shoulder:Pt}> = ({side,lift,bob,reach,elbow,shoulder}) => {
 const r=clamp(reach), b=clamp(bob), m=side==='R'?1:-1;
 const skin=m>0?'url(#cs-skin)':'url(#cs-skin-l)', coat=m>0?'url(#cs-coat)':'url(#cs-coat-l)';
 const L=FINGER_TIPS.map((_,i)=>clamp(lift[i]??0));
 const lifted=b*14;
 const fingers=FINGER_TIPS.map(([tx,ty],i)=>{
  const K=KNUCKLES[i], curl=i>0?r:0, l=L[i];
  const T:Pt=[tx-6*curl*(i/3), ty-30*l+(i===0?-26*r:46*curl)];
  const P=along(K,T,.44,[m*0,3-4*l]), D=along(K,T,.76,[0,1-2*l]);
  return {pts:[K,P,D,T] as Pt[],l};
 });
 const W:Pt=[98,232], a=unit(W,elbow), pa:Pt=[-a[1],a[0]];
 const off=(p:Pt,k:number,s=0):Pt=>[p[0]+a[0]*k+pa[0]*s,p[1]+a[1]*k+pa[1]*s];
 const hem:Pt=[elbow[0]+(shoulder[0]-elbow[0])*.06,elbow[1]+(shoulder[1]-elbow[1])*.06];
 const thumb:Pt[]=[[18,206],[-22,174],[-46,134+12*r],[-60,100+22*r]];
 const backPath=`M${KNUCKLES[0][0]-18} ${KNUCKLES[0][1]+8}Q38 92 ${KNUCKLES[1][0]} ${KNUCKLES[1][1]-3}Q100 96 ${KNUCKLES[2][0]} ${KNUCKLES[2][1]-2}`
  +`Q156 104 ${KNUCKLES[3][0]+15} ${KNUCKLES[3][1]+5}C202 156 186 204 172 240L28 236C8 204 -12 164 ${KNUCKLES[0][0]-18} ${KNUCKLES[0][1]+8}Z`;
 const body=<g>
  {/* shadows on the keys stay put while the hand lifts: the hand's soft cast shadow, then each
      fingertip's contact shadow, crisp on contact and separating as the finger rises */}
  <g data-subject="hand shadow">
   <ellipse cx={100+m*(14+8*b)} cy={150+18+10*b} rx={128} ry={92} fill="#000" opacity={.16} filter="url(#cs-soft)"/>
   {FINGER_TIPS.map(([tx,ty],i)=>{const l=Math.max(L[i],b*.8), down=l<.05&&!(i>0&&r>.3);
    return <ellipse key={i} cx={tx+m*(3+10*l)} cy={ty+8+12*l} rx={FINGER_W[i]*(.5+.35*l)} ry={5+3*l} fill="#000"
     opacity={down?.38:.24*(1-.5*l)} filter={l>.08?'url(#cs-haze)':undefined}/>;})}
  </g>
  <g transform={`translate(0 ${-lifted})`}>
   {/* the coat sleeve: upper arm off frame, elbow, forearm with folds and a seam */}
   <path d={limb(hem,shoulder,232,268)} fill={coat} stroke={COAT_EDGE} strokeWidth={2.5}/>
   <circle cx={elbow[0]} cy={elbow[1]} r={112} fill={coat} stroke={COAT_EDGE} strokeWidth={2.5}/>
   <path d={limb(off(W,26),elbow,186,226)} fill={coat} stroke={COAT_EDGE} strokeWidth={2.5}/>
   {[120,250].map((k,i)=>{const A=off(W,k,-92),B=off(W,k+18,96),Cc=off(W,k+34+i*8,0);
    return <path key={i} d={`M${A[0]} ${A[1]}Q${Cc[0]} ${Cc[1]} ${B[0]} ${B[1]}`} stroke={COAT_EDGE} strokeOpacity={.4} strokeWidth={3} fill="none"/>;})}
   {(()=>{const A=off(W,40,-m*82),B=off(W,330,-m*100);return <path d={`M${A[0]} ${A[1]}L${B[0]} ${B[1]}`} stroke={COAT_EDGE} strokeOpacity={.5} strokeWidth={2} strokeDasharray="7 6"/>;})()}
   {/* the thumb runs under the back of the hand */}
   <Digit pts={thumb} w={33} m={m} skin={skin} lift={0}/>
   <path d={backPath} fill={skin} stroke={SKIN_LINE} strokeWidth={2.6} strokeLinejoin="round"/>
   {/* little-finger side in shade, tendons fanning from the wrist to each knuckle */}
   <path d={`M${KNUCKLES[3][0]+14} ${KNUCKLES[3][1]+6}C198 158 184 204 172 238L140 236C156 196 166 160 ${KNUCKLES[3][0]-8} ${KNUCKLES[3][1]+4}Z`} fill={SKIN_DARK} opacity={.28}/>
   {KNUCKLES.map(([x,y],i)=><path key={'t'+i} d={`M${x} ${y+16}Q${(x+98)/2+m*0} ${y+70} ${80+i*12} ${226}`} stroke={SKIN_LIGHT} strokeOpacity={.35} strokeWidth={4} fill="none" strokeLinecap="round"/>)}
   {fingers.map((f,i)=><Digit key={i} pts={f.pts} w={FINGER_W[i]} m={m} skin={skin} lift={f.l}/>)}
   {KNUCKLES.map(([x,y],i)=><g key={'k'+i}>
    <ellipse cx={x-m*3} cy={y-1} rx={13} ry={8} fill={SKIN_LIGHT} opacity={.8}/>
    <path d={`M${x-10} ${y+9}q10 5 20 0`} stroke={SKIN_LINE} strokeOpacity={.4} strokeWidth={2} fill="none" strokeLinecap="round"/>
   </g>)}
   {/* scrub cuff under the turned-back coat cuff, with its stitch line and button */}
   <path d={limb(off(W,-12),off(W,4),168,172)} fill={SLEEVE} stroke={SLEEVE_DARK} strokeWidth={2}/>
   <path d={limb(off(W,-4),off(W,34),190,194)} fill={coat} stroke={COAT_EDGE} strokeWidth={2.8}/>
   {(()=>{const A=off(W,24,-90),B=off(W,24,90);return <path d={`M${A[0]} ${A[1]}L${B[0]} ${B[1]}`} stroke={COAT_EDGE} strokeOpacity={.65} strokeWidth={2} strokeDasharray="6 5"/>;})()}
   {(()=>{const A=off(W,0,-92),B=off(W,0,92);return <path d={`M${A[0]} ${A[1]}L${B[0]} ${B[1]}`} stroke="#ffffff" strokeOpacity={.75} strokeWidth={3}/>;})()}
   {(()=>{const p=off(W,15,-m*70);return <g><circle cx={p[0]} cy={p[1]} r={8} fill="#E6E2D6" stroke={COAT_EDGE} strokeWidth={2}/>
    <circle cx={p[0]-1.5} cy={p[1]-1.5} r={1.4} fill={COAT_EDGE}/><circle cx={p[0]+1.5} cy={p[1]+1.5} r={1.4} fill={COAT_EDGE}/></g>;})()}
  </g>
 </g>;
 return <g data-subject="hands anonymous white-coat sleeve">{side==='R'?body:<g transform="scale(-1 1)">{body}</g>}</g>;
};

/** A masked sign-in card: blank field, dots fill as keys are struck. */
const Credential:React.FC<{c:Pal;dots:number}> = ({c,dots}) => {
 const n=Math.round(clamp(dots)*8);
 return <g data-subject="credential-field masked">
  <ellipse cx={150} cy={150} rx={160} ry={12} fill={c.ink} opacity={.25} filter="url(#cs-soft)"/>
  <path d={blob(0,0,300,140,12,61,1.5)} fill={mix(c.paper,'#ffffff',.2)} stroke={mix(c.paper,c.ink,.4)} strokeWidth={2}/>
  <path d={blob(0,0,300,40,12,62,1)+'M0 26H300V40H0Z'} fill={mix(c.ink,c.foreground,.3)}/>
  <Label x={14} y={30} size={24} fill="#ffffff">Usual credentials</Label>
  <path d={blob(16,62,268,48,8,63,1)} fill="#ffffff" stroke={c.hero} strokeWidth={2.5}/>
  {Array.from({length:8},(_,i)=><circle key={i} cx={40+i*26} cy={86} r={8} fill={c.ink} opacity={i<n?.85:0}/>)}
  {n<8&&<rect x={30+n*26} y={72} width={4} height={28} fill={c.hero}/>}
 </g>;
};

/** The record boundary, its pins and its opening on the right edge where the tool docks. `pulse`
 * runs a bright bead out of that opening, up and down the frame, lighting the edge behind it. */
const Boundary:React.FC<{c:Pal;w:number;h:number;glow:number;slot:number;gap:number;pulse:number;label:'left'|'right'}> = ({c,w,h,glow,slot,gap,pulse,label}) => {
 const g=clamp(glow), p=clamp(pulse);
 const slotY=h*slot;
 const frame=`M0 22Q0 0 22 0H${w-22}Q${w} 0 ${w} 22V${slotY-gap}M${w} ${slotY+gap}V${h-22}Q${w} ${h} ${w-22} ${h}H22Q0 ${h} 0 ${h-22}Z`;
 const runs=[`M${w} ${slotY-gap}V22Q${w} 0 ${w-22} 0H22Q0 0 0 22V${h-22}`,`M${w} ${slotY+gap}V${h-22}Q${w} ${h} ${w-22} ${h}H22Q0 ${h} 0 ${h-22}`];
 const lx=label==='left'?10:w-266;
 return <g data-subject="record-boundary">
  <path d={frame} fill="none" stroke={c.hero} strokeWidth={22} opacity={.12+.28*g} filter="url(#cs-soft)"/>
  <path d={frame} fill="none" stroke={mix(c.hero,c.paper,.35-.3*g)} strokeWidth={7} strokeLinejoin="round"/>
  <path d={frame} fill="none" stroke="#ffffff" strokeOpacity={.25+.4*g} strokeWidth={2}/>
  {p>0&&runs.map((d,i)=><g key={i}>
   <path d={d} pathLength={1} fill="none" stroke={mix(c.hero,'#ffffff',.25)} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${p} 2`}/>
   {p<1&&<path d={d} pathLength={1} fill="none" stroke="#ffffff" strokeWidth={26} strokeLinecap="round" strokeDasharray=".03 2" strokeDashoffset={-(p-.03)} opacity={.55} filter="url(#cs-soft)"/>}
   {p<1&&<path d={d} pathLength={1} fill="none" stroke="#ffffff" strokeWidth={12} strokeLinecap="round" strokeDasharray=".03 2" strokeDashoffset={-(p-.03)}/>}
  </g>)}
  <path d={`M${w-14} ${slotY-gap-2}H${w+18}M${w-14} ${slotY+gap+2}H${w+18}`} stroke={mix(c.hero,c.ink,.3)} strokeWidth={7} strokeLinecap="round"/>
  {BOUNDARY_PINS.map((f,i)=><circle key={i} cx={w*f} cy={0} r={6} fill={mix(c.hero,c.ink,.35)}/>)}
  <g opacity={.75+.25*Math.max(g,p)}>
   <path d={blob(lx,-56,256,42,14,27,1.4)} fill={mix(c.hero,c.paper,.8)} stroke={c.hero} strokeWidth={2.5}/>
   <Label x={lx+14} y={-26} size={26} fill={mix(c.hero,c.ink,.4)}>Health record</Label>
  </g>
 </g>;
};

/** The record's padlock: a bevelled teal body with rivets and a keyhole on a steel shackle. As it
 * opens the shackle's free leg lifts out of the body and swings, the keyhole lights and the body
 * brightens. Local origin is the body's top-left; the shackle stands above it. */
const Lock:React.FC<{c:Pal;open:number;halo:number}> = ({c,open,halo}) => {
 const l=clamp(open), lift=24*l, done=l>.92;
 const body=done?c.hero:mix(c.hero,c.ink,.45*(1-l)+.05);
 return <g data-subject="record-lock">
  <ellipse cx={36} cy={88} rx={40} ry={7} fill={c.ink} opacity={.32} filter="url(#cs-soft)"/>
  {done&&halo>0&&<circle cx={30} cy={52} r={52} fill={c.hero} opacity={.28*clamp(halo)} filter="url(#cs-soft)"/>}
  <g transform={`rotate(${-38*l} 47 ${30-lift})`}>
   <path d={`M13 40V${22-lift}Q13 ${-2-lift} 30 ${-2-lift}Q47 ${-2-lift} 47 ${22-lift}V${40-lift}`} fill="none" stroke="#56605F" strokeWidth={12} strokeLinecap="round"/>
   <path d={`M13 40V${22-lift}Q13 ${-2-lift} 30 ${-2-lift}Q47 ${-2-lift} 47 ${22-lift}V${40-lift}`} fill="none" stroke="url(#cs-plastic)" strokeWidth={7} strokeLinecap="round"/>
  </g>
  <path d={blob(0,32,60,50,10,28,1.2)} fill={body} stroke={mix(c.hero,c.ink,.6)} strokeWidth={2.8}/>
  <path d="M8 38H50M6 42V72" stroke="#ffffff" strokeOpacity={.4} strokeWidth={2.5} strokeLinecap="round"/>
  <path d="M10 78H54M56 40V76" stroke={c.ink} strokeOpacity={.3} strokeWidth={2.5} strokeLinecap="round"/>
  {[[8,40],[52,40],[8,74],[52,74]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={2.2} fill={mix(c.hero,c.ink,.7)}/>)}
  <circle cx={30} cy={53} r={7} fill={done?'#ffffff':mix(c.paper,c.ink,.7)}/>
  <path d="M30 57V68" stroke={done?'#ffffff':mix(c.paper,c.ink,.7)} strokeWidth={5} strokeLinecap="round"/>
 </g>;
};

/**
 * The docked tool, labelled OpenEvidence, with a connector to the boundary slot on its left.
 * Front stage: wall-mounted; cards enter its left side and the answer drops out of its lower
 * mouth. Desk stage: it stands on the desk; cards slide into its front mouth and come back out
 * of it. Cards drawn before this part are hidden inside it, so nothing pops.
 */
const Tool:React.FC<{c:Pal;stage:ClinicStage;glow:number;intake:number;leds:number;emit:number}> = ({c,stage,glow,intake,leds,emit}) => {
 const g=clamp(glow), k=clamp(intake), e=clamp(emit);
 const T=TOOL[stage], {w,h,mouthY,depth:D}=T;
 const seamY=112, ventX=w-62;
 const edge=mix(c.hero,c.ink,.5);
 // three status lamps run a chase while the tool is reading; all lit once it has read
 const lamp=(i:number)=>leds<=0?0:leds>=1?1:clamp(Math.sin(Math.PI*(leds*6-i*.6))*1.2);
 return <g data-subject="openevidence-tool AI">
  {/* grounded shadow: on the wall behind a wall-mounted box, on the desk under a standing one */}
  {stage==='front'
   ?<path d={blob(-D+14,18,w+D+6,h+8,18,72,2)} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
   :<ellipse cx={w/2+10} cy={h+6} rx={w*.6} ry={14} fill={c.ink} opacity={.4} filter="url(#cs-soft)"/>}
  {stage==='front'&&[w/2-44,w/2+40].map((x,i)=><g key={i}>
   <path d={`M${x} -40H${x+10}V2H${x}Z`} fill="url(#cs-plastic)" stroke="#5E6767" strokeWidth={2}/>
   <path d={`M${x-8} -44H${x+18}V-34H${x-8}Z`} fill="#9EA5A1" stroke="#5E6767" strokeWidth={2}/>
   <circle cx={x+5} cy={-39} r={2.5} fill="#5E6767"/>
  </g>)}
  {stage==='desk'&&<g>
   <path d={`M${-D+6} -20L${w-12} -26L${w} 0L0 0Z`} fill={mix(c.hero,'#ffffff',.45)} stroke={edge} strokeWidth={2}/>
   {[30,w-40].map((x,i)=><rect key={i} x={x} y={h-6} width={26} height={10} rx={4} fill="#2A3436"/>)}
  </g>}
  {/* the left side face, its depth receding toward the centre of the frame */}
  <path d={`M${-D} 9L0 0V${h}L${-D} ${h-9}Z`} fill="url(#cs-side)" stroke={edge} strokeWidth={2.5} strokeLinejoin="round"/>
  <path d={`M${-D+3} 12L-3 4`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2}/>
  {stage==='front'&&<g data-subject="tool intake slot">
   {/* the intake: a docking collar round a dark vertical slit; its sprung flap folds inward
       while a card passes and the collar glows */}
   <path d={`M${T.intakeX-8} ${T.intakeY0-12}L${T.intakeX+8} ${T.intakeY0-14}V${T.intakeY1+14}L${T.intakeX-8} ${T.intakeY1+12}Z`}
    fill={mix(c.hero,'#ffffff',.25)} stroke={edge} strokeWidth={2}/>
   {k>0&&<path d={`M${T.intakeX} ${T.intakeY0-8}V${T.intakeY1+8}`} stroke={mix(c.hero,'#ffffff',.6)} strokeWidth={22} opacity={.6*k} filter="url(#cs-soft)" strokeLinecap="round"/>}
   <path d={`M${T.intakeX-3} ${T.intakeY0}L${T.intakeX+4} ${T.intakeY0-2}V${T.intakeY1+2}L${T.intakeX-3} ${T.intakeY1}Z`} fill="url(#cs-recess)"/>
   <path d={`M${T.intakeX+4} ${T.intakeY0-2}L${T.intakeX+4-9*(1-k)} ${T.intakeY0+3}V${T.intakeY1-3}L${T.intakeX+4} ${T.intakeY1+2}Z`}
    fill={mix(c.hero,c.ink,.2)} stroke={edge} strokeWidth={1.2} opacity={.95}/>
  </g>}
  {/* the front face with a bevel, panel seams, screws, a vent grille and the label */}
  <path d={blob(0,0,w,h,16,71,1.5)} fill="url(#cs-tool)" stroke={edge} strokeWidth={3}/>
  <rect x={0} y={0} width={w} height={h} rx={16} fill="#ffffff" opacity={.18*g}/>
  <path d={`M10 7H${w-14}M7 12V${h-18}`} stroke="#ffffff" strokeOpacity={.55} strokeWidth={3} strokeLinecap="round"/>
  <path d={`M12 ${h-5}H${w-10}M${w-5} 14V${h-14}`} stroke={c.ink} strokeOpacity={.3} strokeWidth={3} strokeLinecap="round"/>
  <path d={`M8 ${seamY}H${w-8}M${ventX} 12V${seamY}`} stroke={mix(c.hero,c.ink,.55)} strokeWidth={2.2}/>
  <path d={`M8 ${seamY+2.5}H${w-8}M${ventX+2.5} 12V${seamY}`} stroke="#ffffff" strokeOpacity={.3} strokeWidth={1.5}/>
  {[0,1,2,3,4].map(i=><path key={i} d={`M${ventX+12} ${48+i*11}H${w-14}`} stroke={mix(c.hero,c.ink,.7)} strokeWidth={4.5} strokeLinecap="round"/>)}
  {[[12,12],[w-12,12],[12,h-12],[w-12,h-12]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={4.2} fill="#B8BFBE" stroke="#4E5858" strokeWidth={1.2}/>
   <path d={`M${x-2.6} ${y+1}l5.2 -2`} stroke="#4E5858" strokeWidth={1.3}/></g>)}
  <Label x={20} y={50} size={29} fill="#ffffff">OpenEvidence</Label>
  <Label x={20} y={84} size={23} fill={mix(c.hero,'#ffffff',.75)}>AI tool</Label>
  {[0,1,2].map(i=>{const v=lamp(i);return <g key={i}>
   <circle cx={24+i*22} cy={100} r={5.5} fill={v>0?mix(mix(c.hero,'#ffffff',.3),'#ffffff',v):mix(c.hero,c.ink,.55)} stroke={mix(c.hero,c.ink,.6)} strokeWidth={1.2}/>
   {v>.2&&<circle cx={24+i*22} cy={100} r={13} fill="#ffffff" opacity={.35*v} filter="url(#cs-haze)"/>}
  </g>;})}
  <circle cx={ventX+30} cy={28} r={6} fill={mix('#ffffff',c.hero,.3-.3*g)} opacity={.6+.4*g}/>
  {g>0&&<circle cx={ventX+30} cy={28} r={18} fill="#ffffff" opacity={.35*g} filter="url(#cs-soft)"/>}
  {/* the output mouth: a recessed slot with an inner shadow and a worn lower lip */}
  {e>0&&<rect x={6} y={mouthY-16} width={w-12} height={34} rx={14} fill={mix(c.hero,'#ffffff',.55)} opacity={.55*e} filter="url(#cs-soft)"/>}
  <rect x={14} y={mouthY-9} width={w-28} height={17} rx={8} fill="url(#cs-recess)" stroke={mix(c.hero,c.ink,.75)} strokeWidth={2}/>
  <path d={`M20 ${mouthY-6}H${w-20}`} stroke="#000" strokeOpacity={.45} strokeWidth={3}/>
  <path d={`M16 ${mouthY+11}H${w-16}`} stroke="#ffffff" strokeOpacity={.45+.3*e} strokeWidth={2.5} strokeLinecap="round"/>
  <path d={`M${w*.62} ${mouthY+12}q10 2 22 0`} stroke={c.ink} strokeOpacity={.25} strokeWidth={2} fill="none"/>
 </g>;
};

const Rail:React.FC<{c:Pal;w:number}> = ({c,w}) => <g data-subject="chart-rail">
 <rect x={4} y={10} width={w} height={22} rx={6} fill={c.ink} opacity={.22} filter="url(#cs-soft)"/>
 <path d={blob(0,0,w,22,7,81,1.5)} fill="#8C7A62" stroke="#4E4334" strokeWidth={2.5}/>
 <path d={`M8 5H${w-10}`} stroke="#C2AE8E" strokeWidth={3} strokeLinecap="round"/>
 {[.04,.31,.58,.93].map((f,i)=><g key={i}><circle cx={w*f+wob(82,i,6)} cy={11} r={5} fill="#B8BFBE" stroke="#5E6767" strokeWidth={1.5}/>
  <path d={`M${w*f+wob(82,i,6)-3} ${11}h6`} stroke="#5E6767" strokeWidth={1.5}/></g>)}
</g>;

const Shelf:React.FC<{c:Pal;w:number}> = ({c,w}) => <g data-subject="return-shelf">
 <path d={`M10 14H${w-6}L${w-20} 70H24Z`} fill={c.ink} opacity={.18} filter="url(#cs-soft)"/>
 <path d={blob(0,0,w,16,4,91,1.2)} fill="#9C8A70" stroke="#4E4334" strokeWidth={2.5}/>
 <path d={`M6 4H${w-8}`} stroke="#D3C3A6" strokeWidth={3}/>
 {[.16,.82].map((f,i)=><path key={i} d={`M${w*f} 16V50L${w*f+26} 16`} fill="none" stroke="#6F7979" strokeWidth={6} strokeLinejoin="round"/>)}
</g>;

const Stand:React.FC<{c:Pal}> = ({c}) => <g data-subject="chart-stand">
 <ellipse cx={170} cy={500} rx={210} ry={16} fill={c.ink} opacity={.32} filter="url(#cs-soft)"/>
 <path d="M-10 486Q170 470 352 488L360 500Q170 486 -14 500Z" fill="#DCE7E6" opacity={.8} stroke="#8FA3A0" strokeWidth={2}/>
 <path d="M300 488L250 120" stroke="#DCE7E6" strokeWidth={10} opacity={.55}/>
 <path d="M4 492H340" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2}/>
</g>;

/**
 * One anonymous clinician as a head-and-shoulders figure on a clipped ID card. No face is drawn:
 * the head is one flat silhouette tone for every figure, so no fill carries identity. Hair or cap
 * outline, shoulder width and workwear (white coat, coat over scrubs, scrubs) vary on fixed
 * schedules spread evenly across the board. A lit card is bright paper with a teal badge; an
 * unlit card is the same drawing in the board's dusk tones.
 */
const Figure:React.FC<{c:Pal;i:number;on:boolean}> = ({c,i,on}) => {
 const tw=FIG_W, th=FIG_H, cx=tw/2+wob(43,i,4);
 const hair=i%4, top=i%3, sw=[0,7,-6][(i>>1)%3];
 const head=on?mix(c.ink,c.foreground,.35):mix(c.midground,c.ink,.6);
 const coat=on?'#FBFAF4':mix(c.midground,c.ink,.38);
 const coatEdge=on?mix(c.paper,c.ink,.42):mix(c.midground,c.ink,.58);
 const scrub=on?(i%2?mix(SLEEVE,'#ffffff',.2):mix(c.hero,'#ffffff',.28)):mix(c.midground,c.ink,.42);
 const cap=on?mix(c.hero,'#ffffff',.12):mix(c.midground,c.ink,.46);
 const card=on?mix(mix(c.paper,'#ffffff',.2),c.hero,.16):mix(c.midground,c.ink,.18);
 const hy=66, rx=27+wob(44,i,2), ry=31+wob(45,i,2);
 const sh=70+sw, ny=104;
 const body=`M${cx-sh} ${th-8}C${cx-sh} ${ny+30} ${cx-sh+16} ${ny+8} ${cx-22} ${ny+2}L${cx+22} ${ny+2}C${cx+sh-16} ${ny+8} ${cx+sh} ${ny+30} ${cx+sh} ${th-8}Z`;
 return <g data-subject={'clinician-tokens clinician figure '+(on?'lit':'unlit')}>
  {on&&<rect x={-12} y={-12} width={tw+24} height={th+24} rx={22} fill="#EAF7F0" opacity={.6} filter="url(#cs-soft)"/>}
  <path d={blob(4,6,tw,th,16,150+i,2)} fill={c.ink} opacity={on?.16:.22} filter="url(#cs-soft)"/>
  <path d={blob(0,0,tw,th,16,50+i,2)} fill={card} stroke={mix(c.midground,c.ink,.45)} strokeWidth={2}/>
  <path d={`M10 6H${tw-14}`} stroke="#ffffff" strokeOpacity={on?.7:.18} strokeWidth={2.5} strokeLinecap="round"/>
  <rect x={tw/2-15} y={7} width={30} height={9} rx={4.5} fill={mix(c.ink,c.midground,.4)}/>
  {/* hair or cap behind the head: one silhouette, its outline varies */}
  {hair===2&&<path d={`M${cx-rx-2} ${hy-8}Q${cx-rx-8} ${hy+38} ${cx-rx+4} ${hy+50}L${cx+rx-4} ${hy+50}Q${cx+rx+8} ${hy+38} ${cx+rx+2} ${hy-8}Z`} fill={head}/>}
  {hair===1&&<circle cx={cx+5} cy={hy-ry-6} r={12} fill={head}/>}
  <path d={`M${cx-11} ${hy+ry-8}H${cx+11}V${ny+8}H${cx-11}Z`} fill={head}/>
  <ellipse cx={cx} cy={hy} rx={rx} ry={ry} fill={head}/>
  {hair===0&&<path d={`M${cx-rx} ${hy-4}Q${cx-rx-2} ${hy-ry-3} ${cx+4} ${hy-ry-2}Q${cx+rx+3} ${hy-ry+2} ${cx+rx} ${hy-6}Z`} fill={head}/>}
  {hair===3&&<g>
   <path d={`M${cx-rx-1} ${hy-2}Q${cx-rx-3} ${hy-ry-6} ${cx} ${hy-ry-6}Q${cx+rx+3} ${hy-ry-6} ${cx+rx+1} ${hy-2}Q${cx} ${hy-12} ${cx-rx-1} ${hy-2}Z`} fill={cap} stroke={coatEdge} strokeWidth={1.5}/>
   <path d={`M${cx+rx-2} ${hy-6}l12 10M${cx+rx-2} ${hy-6}l6 14`} stroke={cap} strokeWidth={4} strokeLinecap="round"/>
  </g>}
  {/* shoulders: white coat with lapels over scrubs, a coat alone, or scrubs alone */}
  <path d={body} fill={top===2?scrub:coat} stroke={coatEdge} strokeWidth={2}/>
  {top!==2&&<path d={`M${cx-21} ${ny+3}L${cx} ${ny+46}L${cx+21} ${ny+3}Z`} fill={top===0?scrub:mix(coat,c.ink,.08)}/>}
  {top!==2&&<path d={`M${cx-21} ${ny+3}L${cx-5} ${ny+50}L${cx-30} ${th-8}M${cx+21} ${ny+3}L${cx+5} ${ny+50}L${cx+30} ${th-8}`} stroke={coatEdge} strokeWidth={2} fill="none"/>}
  {top===2&&<path d={`M${cx-17} ${ny+3}L${cx} ${ny+26}L${cx+17} ${ny+3}`} stroke={mix(scrub,c.ink,.35)} strokeWidth={3} fill="none"/>}
  {top===1&&<g stroke={on?mix(c.ink,c.foreground,.4):mix(c.midground,c.ink,.55)} strokeWidth={3.5} fill="none" strokeLinecap="round">
   <path d={`M${cx-17} ${ny+4}Q${cx-30} ${ny+40} ${cx-12} ${ny+56}`}/><circle cx={cx-10} cy={ny+60} r={5}/>
  </g>}
  {/* the clipped ID badge on the chest */}
  <g transform={`translate(${cx+26+wob(46,i,3)} ${ny+22}) rotate(${wob(47,i,4)})`}>
   <path d="M11 -8V2" stroke={coatEdge} strokeWidth={2}/>
   <path d={blob(0,0,22,30,4,160+i,.8)} fill={on?'#ffffff':mix(c.midground,c.ink,.36)} stroke={coatEdge} strokeWidth={1.5}/>
   <rect x={0} y={0} width={22} height={8} rx={3} fill={on?c.hero:mix(c.midground,c.ink,.5)}/>
   <path d="M5 16H17M5 22H13" stroke={on?mix(c.paper,c.ink,.4):mix(c.midground,c.ink,.5)} strokeWidth={2} strokeLinecap="round"/>
  </g>
 </g>;
};

/** A framed share board of anonymous clinician figures; the lit ones picture the reported share, never a count. */
const Wall:React.FC<{c:Pal;lit:number;share:number;label:number}> = ({c,lit,share,label}) => {
 const count=Math.round(clamp(lit)*WALL_LIT_SHARE_TILES);
 const on=new Set(LIGHT_ORDER.slice(0,count));
 const barW=WALL_SIZE[0]-20;
 const pw=WALL_COLS*FIG_PITCH[0]+30, ph=WALL_ROWS*FIG_PITCH[1]+30;
 return <g data-subject="clinic-workstations clinician-tokens share-board">
  {/* the board: a fabric panel in a worn wood frame with real depth and a contact shadow on the wall */}
  <path d={blob(-30,-28,pw+32,ph+28,30,34,4)} fill={c.ink} opacity={.24} filter="url(#cs-soft)"/>
  <path d={blob(-40,-42,pw+32,ph+28,30,35,4)} fill="#9C8A70" stroke="#4E4334" strokeWidth={3}/>
  <path d={`M-26 -36H${pw-20}`} stroke="#D3C3A6" strokeWidth={4} strokeLinecap="round"/>
  <path d={`M${pw-12} -24V${ph-28}`} stroke="#6E5D49" strokeWidth={4} strokeLinecap="round"/>
  <path d={blob(-24,-26,pw,ph,22,33,4)} fill={mix(c.background,c.midground,.3)} stroke="#6E5D49" strokeWidth={2.5}/>
  <path d={`M-22 -20H${pw-30}`} stroke={c.ink} strokeOpacity={.14} strokeWidth={8}/>
  <path d={`M60 ${ph-60}q60 -6 110 2M${pw-200} ${ph-48}q40 4 80 -2`} stroke="#ffffff" strokeOpacity={.18} strokeWidth={3} fill="none"/>
  {[[-32,-34],[pw-16,-34],[-32,ph-22],[pw-16,ph-22]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={4} fill="#B8BFBE" stroke="#5E6767" strokeWidth={1.5}/>)}
  {Array.from({length:WALL_TILES},(_,i)=>{
   const r=Math.floor(i/WALL_COLS), k=i%WALL_COLS;
   const x=k*FIG_PITCH[0]+wob(40,i,8)+(r%2)*12, y=r*FIG_PITCH[1]+wob(41,i,6), lightOn=on.has(i);
   return <g key={i} transform={`translate(${x} ${y}) rotate(${wob(42,i,2)} ${FIG_W/2} ${FIG_H/2})`} data-tile={lightOn?'lit':'dark'}>
    <Figure c={c} i={i} on={lightOn}/>
   </g>;
  })}
  <g transform={`translate(0 ${BAR_Y})`}>
   <defs><linearGradient id="cs-share" x1="0" y1="0" x2="1" y2="0">
    <stop offset=".88" stopColor={c.hero}/><stop offset="1" stopColor={c.hero} stopOpacity={0}/>
   </linearGradient></defs>
   <path d={blob(0,0,barW,34,17,61,1.5)} fill={mix(c.paper,c.midground,.25)} stroke={mix(c.midground,c.ink,.35)} strokeWidth={2.5}/>
   {share>0&&<path d={blob(0,0,Math.max(40,barW*.62*clamp(share)),34,17,62,1.2)} fill="url(#cs-share)"/>}
   <path d={`M${barW/2} -14V48`} stroke={c.ink} strokeWidth={4}/>
   <g opacity={clamp(label)}><Label x={barW/2+18} y={-14} size={42} fill={c.ink}>More than half</Label></g>
   <Label x={barW/2-18} y={-14} size={40} fill={mix(c.ink,c.midground,.4)} anchor="end">Half</Label>
   {/* pins on the bar for the tags that belong to the share */}
   {[WALL_PINS.start,WALL_PINS.half,WALL_PINS.end].map((q,i)=><circle key={i} cx={q[0]} cy={q[1]-BAR_Y} r={6} fill={c.ink}/>)}
  </g>
 </g>;
};

/**
 * The clinic's back wall behind the desk in the close reading shots: salt-weathered paint lit
 * from the window side, and the same Gulf window as the room, with a frame, a recessed reveal,
 * a sill with a front face and the sill's contact shadow on the wall. `glazed` false leaves the
 * window out when the shot hangs the share board on this wall instead. It ends at `h`, where the
 * episode draws the desk's back edge.
 */
const BackWall:React.FC<{c:Pal;stage:ClinicStage;h:number;glazed:boolean}> = ({c,stage,h,glazed}) => {
 const win=stage==='front'?{x:80,y:-330,w:540,h:470}:{x:150,y:-300,w:580,h:470};
 const sillY=win.y+win.h+19;
 return <g data-subject="clinic back-wall">
  <rect x={-400} y={-400} width={1880} height={h+400} fill="url(#cs-wall)"/>
  <g filter="url(#cs-grain)"><rect x={-400} y={-400} width={1880} height={h+400} fill={c.background} opacity={.12}/></g>
  <path d={`M-400 ${h-10}H1480`} stroke={mix(c.background,c.ink,.25)} strokeOpacity={.35} strokeWidth={10}/>
  {glazed&&<g>
   <GulfWindow c={c} x={win.x} y={win.y} w={win.w} h={win.h} deep={true}/>
   {/* the reveal: the frame's depth shades the top and left inside edges */}
   <path d={`M${win.x+7} ${win.y+7}H${win.x+win.w-7}L${win.x+win.w-20} ${win.y+20}H${win.x+20}V${win.y+win.h-20}L${win.x+7} ${win.y+win.h-7}Z`} fill={c.ink} opacity={.14}/>
   {/* the sill's front face, its worn edge and its contact shadow on the wall */}
   <rect x={win.x-28} y={sillY+8} width={win.w+66} height={16} rx={8} fill={c.ink} opacity={.28} filter="url(#cs-soft)"/>
   <path d={`M${win.x-31} ${sillY-2}H${win.x+win.w+35}V${sillY+14}Q${win.x+win.w+35} ${sillY+18} ${win.x+win.w+30} ${sillY+18}H${win.x-26}Q${win.x-31} ${sillY+18} ${win.x-31} ${sillY+14}Z`}
    fill={mix(c.paper,c.ink,.32)} stroke={mix(c.paper,c.ink,.5)} strokeWidth={1.5}/>
   <path d={`M${win.x+60} ${sillY+8}q30 4 70 0M${win.x+win.w-120} ${sillY+9}q20 3 46 0`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2} fill="none"/>
  </g>}
 </g>;
};

/** The single entry point of the support group. */
export const ClinicSupport:React.FC<ClinicSupportProps> = (props) => {
 const c=usePal();
 let body:React.ReactNode;
 switch(props.part){
 case 'room':body=<Room c={c} stage={props.stage} spill={props.spill??0}/>;break;
 case 'desk':body=<Desk c={c} stage={props.stage}/>;break;
 case 'workstation':body=<Workstation c={c} glow={props.glow??0}/>;break;
 case 'keyboard':body=<Keyboard c={c} down={props.down??[]}/>;break;
 case 'hands':body=<Hand side={props.side} lift={props.lift??[0,0,0,0]} bob={props.bob??0} reach={props.reach??0} elbow={props.elbow??ARM_REST.elbow} shoulder={props.shoulder??ARM_REST.shoulder}/>;break;
 case 'credential':body=<Credential c={c} dots={props.dots}/>;break;
 case 'boundary':body=<Boundary c={c} w={props.w} h={props.h} glow={props.glow} slot={props.slot??.62} gap={props.gap??50} pulse={props.pulse??0} label={props.label??'left'}/>;break;
 case 'lock':body=<Lock c={c} open={props.open} halo={props.halo??0}/>;break;
 case 'tool':body=<Tool c={c} stage={props.stage} glow={props.glow} intake={props.intake??0} leds={props.leds??0} emit={props.emit??0}/>;break;
 case 'rail':body=<Rail c={c} w={props.w}/>;break;
 case 'shelf':body=<Shelf c={c} w={props.w}/>;break;
 case 'stand':body=<Stand c={c}/>;break;
 case 'wall':body=<Wall c={c} lit={props.lit} share={props.share??0} label={props.label??0}/>;break;
 case 'backwall':body=<BackWall c={c} stage={props.stage} h={props.h} glazed={props.glazed??true}/>;break;
 }
 return <g data-art-group="clinic-support"><Defs c={c}/>{body}</g>;
};
