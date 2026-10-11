import React from 'react';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';

/**
 * ClinicSupport, the fresh authored support group for the 2026-10-09-claude-pilot edition.
 *
 * A Southeast Texas clinic around the chart: a salt-weathered wall with a window onto flat
 * Gulf marsh under a white haze (cordgrass, a wind-leaned live oak, a grey bay line, no planted
 * palms), a worn laminate desk, a three-quarter workstation monitor with a blank lit screen,
 * a keyboard with blank keys, anonymous scrub-sleeved hands with no face or identity, a masked
 * credential card, the teal sleeve that marks the boundary of the health record with its lock,
 * the docked tool box labelled OpenEvidence where questions go in and answers come out, and a
 * wall of blank clinician ID tokens that light one by one to picture UTMB's own more-than-half
 * report as a share.
 *
 * Disclosed illustration. No real screen, logo, face, patient information, vendor interface or
 * map of UTMB's campuses. The tool label is native type, not a mark. The lit tokens are a share
 * picture, never a count. Pure function of its props; the episode drives every prop from the
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
 | {part:'hands'; side:'L'|'R'; lift?:number[]; reach?:number; elbow?:Pt; shoulder?:Pt}
 | {part:'credential'; dots:number}
 | {part:'boundary'; w:number; h:number; glow:number; lock:number; slot?:number; lockY?:number}
 | {part:'tool'; stage:ClinicStage; glow:number}
 | {part:'rail'; w:number}
 | {part:'shelf'; w:number}
 | {part:'stand'}
 | {part:'wall'; lit:number; share?:number; label?:number};

/** Keyboard geometry, shared with the episode so fingertips land exactly on key centres. */
export const KEY = {pitch:64, w:54, h:30, rowStep:38, x0:26, y0:18, rowShift:14, cols:8};
export const keyCenter=(row:number,col:number):Pt=>[KEY.x0+col*KEY.pitch+row*KEY.rowShift+KEY.w/2, KEY.y0+row*KEY.rowStep+KEY.h/2];
/** Right-hand fingertip offsets from the index tip (index, middle, ring, little), one key apart. */
export const FINGER_TIPS:Pt[]=[[0,0],[64,-6],[128,0],[190,14]];
/** Wall token layout and the pins the episode hangs tags from, in the wall's local units. */
export const WALL_TILES = 20;
export const WALL_LIT_SHARE_TILES = 11;
export const WALL_SIZE:Pt=[784,740];
export const WALL_PINS={start:[40,677] as Pt,half:[382,677] as Pt,end:[700,677] as Pt};
const BAR_Y=660;
/** Boundary pins along its top edge, as fractions of its width. */
export const BOUNDARY_PINS=[.18,.5,.82];
/** Tool box geometry: the mouth where cards go in and come out. */
export const TOOL={front:{w:272,h:176,mouthY:150},desk:{w:272,h:170,mouthY:150}};
const LIGHT_ORDER = [6,13,2,17,9,0,15,11,4,19,7,14,1,10,18,3,12,5,16,8];

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

const SKIN='#A9714C', SKIN_DARK='#7E4F33', SKIN_LIGHT='#C99272', SLEEVE='#6F8DA6', SLEEVE_DARK='#4F6A82';

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
 <linearGradient id="cs-skin" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={SKIN_LIGHT}/><stop offset=".55" stopColor={SKIN}/><stop offset="1" stopColor={SKIN_DARK}/>
 </linearGradient>
 <linearGradient id="cs-sleeve" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stopColor={mix(SLEEVE,'#ffffff',.15)}/><stop offset="1" stopColor={SLEEVE_DARK}/>
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

/** A keyboard lying on the desk, seen from the seated position. Keys are blank; listed keys are down. */
const Keyboard:React.FC<{c:Pal;down:number[]}> = ({c,down}) => <g data-subject="workstation keyboard">
 <ellipse cx={280} cy={186} rx={310} ry={26} fill={c.ink} opacity={.28} filter="url(#cs-soft)"/>
 <path d={blob(0,0,560,180,26,4,3)} fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={3}/>
 <path d="M18 6H540" stroke="#ffffff" strokeOpacity={.6} strokeWidth={3}/>
 {[0,1,2,3].map(r=>Array.from({length:KEY.cols-(r===3?2:0)},(_,k)=>{
  const i=r*KEY.cols+k, pressed=down.includes(i);
  const [x,y]=[KEY.x0+k*KEY.pitch+r*KEY.rowShift,KEY.y0+r*KEY.rowStep];
  const wide=r===3&&k===2;
  return <g key={i} transform={`translate(${x} ${y+(pressed?3:0)})`}>
   {!pressed&&<path d={blob(1,4,(wide?KEY.w*2+10:KEY.w),KEY.h,8,i+70,1)} fill="#8C928E" opacity={.6}/>}
   <path d={blob(0,0,wide?KEY.w*2+10:KEY.w,KEY.h,8,i+9,1.2)} fill={pressed?'#D3D5CF':hash(i)>.82?'#FBFAF5':'#E9EAE4'} stroke="#8C928E" strokeWidth={1.6}/>
   {!pressed&&<path d={`M6 5H${(wide?KEY.w*2+10:KEY.w)-8}`} stroke="#ffffff" strokeOpacity={.75} strokeWidth={2}/>}
  </g>;
 }))}
</g>;

/** Rest positions of the arm in hand-local units: the elbow sits off the desk toward the lens and
 * the shoulder is far below the frame, so every arm leaves the bottom edge in every shot. */
export const ARM_REST={elbow:[110,700] as Pt,shoulder:[180,1700] as Pt};
/** A tapered quad from a to b, wa wide at a and wb wide at b. */
function limb(a:Pt,b:Pt,wa:number,wb:number):string{
 const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 return `M${a[0]+nx*wa/2} ${a[1]+ny*wa/2}L${b[0]+nx*wb/2} ${b[1]+ny*wb/2}L${b[0]-nx*wb/2} ${b[1]-ny*wb/2}L${a[0]-nx*wa/2} ${a[1]-ny*wa/2}Z`;
}
/**
 * One anonymous arm in a short scrub sleeve, seen from the seated position, fingers pointing away.
 * Local (0,0) is the index fingertip. `lift[i]` raises a finger off its key (0 is contact, with a
 * contact shadow); `reach` extends the index for a push and curls the others. The forearm runs
 * from the wrist to `elbow` and pivots there; the upper arm runs on to `shoulder`, far below the
 * frame, so the limb always leaves the picture. No face, no name, no jewellery, no identity.
 */
const Hand:React.FC<{side:'L'|'R';lift:number[];reach:number;elbow:Pt;shoulder:Pt}> = ({side,lift,reach,elbow,shoulder}) => {
 const r=clamp(reach);
 const tips=FINGER_TIPS.map(([x,y],i)=>[x,y+(i===0?-26*r:22*r)+18*clamp(lift[i]??0)] as Pt);
 const knuckles:Pt[]=[[8,108],[68,100],[124,104],[176,118]];
 const wrist:Pt[]=[[24,214],[168,222]];
 const W:Pt=[96,220];
 const hem:Pt=[elbow[0]+(shoulder[0]-elbow[0])*.42,elbow[1]+(shoulder[1]-elbow[1])*.42];
 const fingerW=[30,31,29,25];
 const body=<g>
  {/* upper arm and sleeve run off the frame; the elbow joins them to a forearm that pivots */}
  <path d={limb(elbow,shoulder,200,250)} fill="url(#cs-skin)"/>
  <path d={limb(hem,shoulder,232,272)} fill="url(#cs-sleeve)" stroke={SLEEVE_DARK} strokeWidth={2}/>
  <path d={limb(hem,[hem[0]+(shoulder[0]-hem[0])*.04,hem[1]+(shoulder[1]-hem[1])*.04],236,236)} fill={SLEEVE_DARK} opacity={.5}/>
  <circle cx={elbow[0]} cy={elbow[1]} r={100} fill="url(#cs-skin)"/>
  <path d={limb(W,elbow,154,196)} fill="url(#cs-skin)"/>
  <path d={limb([W[0]+30,W[1]+20],[elbow[0]+34,elbow[1]-30],20,26)} fill={SKIN_DARK} opacity={.18}/>
  {/* back of the hand */}
  <path d={`M${knuckles[0][0]-16} ${knuckles[0][1]+4}Q${92} ${86} ${knuckles[3][0]+16} ${knuckles[3][1]+2}`
   +`L${wrist[1][0]+6} ${wrist[1][1]}Q${96} ${236} ${wrist[0][0]-8} ${wrist[0][1]}Z`} fill="url(#cs-skin)" stroke={SKIN_DARK} strokeWidth={2}/>
  {knuckles.map(([x,y],i)=><g key={i}>
   <path d={`M${x} ${y+12}Q${(x+96)/2} ${y+60} ${92+i*6} ${210}`} stroke={SKIN_DARK} strokeOpacity={.22} strokeWidth={3} fill="none"/>
   <ellipse cx={x-2} cy={y+2} rx={11} ry={6} fill={SKIN_LIGHT} opacity={.7}/>
  </g>)}
  <path d={`M${-8} 200Q${-46} 170 ${-62} ${120-20*r}`} stroke={SKIN_DARK} strokeWidth={32} strokeLinecap="round" fill="none"/>
  <path d={`M${-8} 200Q${-46} 170 ${-62} ${120-20*r}`} stroke="url(#cs-skin)" strokeWidth={27} strokeLinecap="round" fill="none"/>
  {tips.map(([tx,ty],i)=>{const [kx,ky]=knuckles[i];const curled=i>0&&r>0;const mid:Pt=[(kx+tx)/2,(ky+ty)/2+(curled?10*r:-4)];
   const down=clamp(lift[i]??0)<.05&&!(i>0&&r>.3);
   return <g key={'f'+i}>
    {down&&<ellipse cx={tx} cy={ty+8} rx={fingerW[i]*.55} ry={5} fill="#000" opacity={.25}/>}
    <path d={`M${kx} ${ky}Q${mid[0]} ${mid[1]} ${tx} ${ty+6}`} stroke={SKIN_DARK} strokeWidth={fingerW[i]+5} strokeLinecap="round" fill="none"/>
    <path d={`M${kx} ${ky}Q${mid[0]} ${mid[1]} ${tx} ${ty+6}`} stroke="url(#cs-skin)" strokeWidth={fingerW[i]} strokeLinecap="round" fill="none"/>
    <path d={`M${tx-fingerW[i]*.25} ${ty+2}q${fingerW[i]*.25} -5 ${fingerW[i]*.5} 0`} stroke="#E8C7B2" strokeWidth={4} strokeLinecap="round" fill="none" opacity={.8}/>
    <path d={`M${(kx+mid[0])/2-8} ${(ky+mid[1])/2}h14`} stroke={SKIN_DARK} strokeOpacity={.35} strokeWidth={2} strokeLinecap="round"/>
   </g>;})}
 </g>;
 return <g data-subject="hands anonymous scrub sleeve">{side==='R'?body:<g transform="scale(-1 1)">{body}</g>}</g>;
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

/** The record boundary, its lock and its pins. The lock opens on the film clock. */
const Boundary:React.FC<{c:Pal;w:number;h:number;glow:number;lock:number;slot:number;lockY:number}> = ({c,w,h,glow,lock,slot,lockY}) => {
 const g=clamp(glow), l=clamp(lock);
 const slotY=h*slot;
 const frame=`M0 22Q0 0 22 0H${w-22}Q${w} 0 ${w} 22V${slotY-50}M${w} ${slotY+50}V${h-22}Q${w} ${h} ${w-22} ${h}H22Q0 ${h} 0 ${h-22}Z`;
 return <g data-subject="record-boundary">
  <path d={frame} fill="none" stroke={c.hero} strokeWidth={22} opacity={.12+.28*g} filter="url(#cs-soft)"/>
  <path d={frame} fill="none" stroke={mix(c.hero,c.paper,.35-.3*g)} strokeWidth={7} strokeLinejoin="round"/>
  <path d={frame} fill="none" stroke="#ffffff" strokeOpacity={.25+.4*g} strokeWidth={2}/>
  <path d={`M${w-14} ${slotY-52}H${w+18}M${w-14} ${slotY+52}H${w+18}`} stroke={mix(c.hero,c.ink,.3)} strokeWidth={7} strokeLinecap="round"/>
  {BOUNDARY_PINS.map((f,i)=><circle key={i} cx={w*f} cy={0} r={6} fill={mix(c.hero,c.ink,.35)}/>)}
  <g opacity={.7+.3*g}>
   <path d={blob(10,-56,256,42,14,27,1.4)} fill={mix(c.hero,c.paper,.8)} stroke={c.hero} strokeWidth={2.5}/>
   <Label x={24} y={-26} size={26} fill={mix(c.hero,c.ink,.4)}>Health record</Label>
  </g>
  {/* the boundary lock at its lower left; the shackle lifts as the sign-in completes */}
  <g transform={`translate(-30 ${h*lockY-40})`} data-subject="record-lock">
   <ellipse cx={30} cy={84} rx={34} ry={6} fill={c.ink} opacity={.25} filter="url(#cs-soft)"/>
   <path d={`M14 36V${22-16*l}Q14 ${2-16*l} 30 ${2-16*l}Q46 ${2-16*l} 46 ${22-16*l}V${36-16*l}`} fill="none" stroke="#7F8A8B" strokeWidth={8} strokeLinecap="round"
    transform={l>0?`rotate(${-28*l} 46 ${36-16*l})`:undefined}/>
   <path d={blob(0,34,60,46,9,28,1.2)} fill={l>.95?c.hero:mix(c.hero,c.ink,.45)} stroke={mix(c.hero,c.ink,.5)} strokeWidth={2.5}/>
   <circle cx={30} cy={54} r={6} fill={l>.95?'#ffffff':mix(c.paper,c.ink,.6)}/>
   <path d="M30 58V68" stroke={l>.95?'#ffffff':mix(c.paper,c.ink,.6)} strokeWidth={4} strokeLinecap="round"/>
   {l>.95&&<circle cx={30} cy={56} r={40} fill={c.hero} opacity={.25} filter="url(#cs-soft)"/>}
  </g>
 </g>;
};

/**
 * The docked tool, labelled OpenEvidence, with a connector to the boundary slot on its left.
 * Front stage: wall-mounted; cards enter its left side and the answer drops out of its lower
 * mouth. Desk stage: it stands on the desk; cards slide into its front mouth and come back out
 * of it. Cards drawn before this part are hidden inside it, so nothing pops.
 */
const Tool:React.FC<{c:Pal;stage:ClinicStage;glow:number}> = ({c,stage,glow}) => {
 const g=clamp(glow);
 const {w,h,mouthY}=TOOL[stage];
 return <g data-subject="openevidence-tool AI">
  <ellipse cx={w/2+12} cy={h+10} rx={w*.55} ry={12} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
  <path d={`M-26 ${h*.45}H6`} stroke={mix(c.hero,c.ink,.3)} strokeWidth={14} strokeLinecap="round"/>
  {stage==='desk'&&<path d={`M8 -26L${w+8} -26L${w} 0L0 0Z`} fill={mix(c.hero,'#ffffff',.45)} stroke={mix(c.hero,c.ink,.4)} strokeWidth={2}/>}
  {stage==='front'&&<path d={`M${w/2-40} -38V0M${w/2+40} -38V0`} stroke="#6F7979" strokeWidth={6}/>}
  <path d={blob(0,0,w,h,16,71,1.5)} fill="url(#cs-tool)" stroke={mix(c.hero,c.ink,.45)} strokeWidth={3}/>
  <rect x={0} y={0} width={w} height={h} rx={16} fill="#ffffff" opacity={.18*g}/>
  <path d={`M10 8H${w-12}`} stroke="#ffffff" strokeOpacity={.55} strokeWidth={3} strokeLinecap="round"/>
  <Label x={16} y={48} size={29} fill="#ffffff">OpenEvidence</Label>
  <Label x={16} y={82} size={23} fill={mix(c.hero,'#ffffff',.75)}>AI tool</Label>
  <circle cx={w-24} cy={78} r={7} fill={mix('#ffffff',c.hero,.3-.3*g)} opacity={.6+.4*g}/>
  {g>0&&<circle cx={w-24} cy={78} r={20} fill="#ffffff" opacity={.35*g} filter="url(#cs-soft)"/>}
  {/* the mouth: a dark slot across the lower front */}
  <path d={`M14 ${mouthY}H${w-14}`} stroke={mix(c.hero,c.ink,.7)} strokeWidth={12} strokeLinecap="round"/>
  <path d={`M14 ${mouthY+7}H${w-14}`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2}/>
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

/** A wall of blank clinician ID tokens; the lit ones picture the reported share, never a count. */
const Wall:React.FC<{c:Pal;lit:number;share:number;label:number}> = ({c,lit,share,label}) => {
 const cols=4, rows=5, tw=150, th=104;
 const count=Math.round(clamp(lit)*WALL_LIT_SHARE_TILES);
 const on=new Set(LIGHT_ORDER.slice(0,count));
 const barW=WALL_SIZE[0]-20;
 return <g data-subject="clinic-workstations clinician tokens">
  <path d={blob(-24,-26,cols*196+30,rows*118+40,26,33,4)} fill={mix(c.background,c.midground,.22)} stroke={mix(c.midground,c.ink,.2)} strokeWidth={3}/>
  {Array.from({length:WALL_TILES},(_,i)=>{
   const r=Math.floor(i/cols), k=i%cols;
   const x=k*196+wob(40,i,9)+(r%2)*14, y=r*118+wob(41,i,7), lightOn=on.has(i);
   return <g key={i} transform={`translate(${x} ${y}) rotate(${wob(42,i,2.4)} ${tw/2} ${th/2})`} data-tile={lightOn?'lit':'dark'}>
    {lightOn&&<rect x={-10} y={-10} width={tw+20} height={th+20} rx={20} fill="#E9F7EF" opacity={.55} filter="url(#cs-soft)"/>}
    <path d={blob(0,0,tw,th,14,50+i,2)} fill={lightOn?mix(c.paper,'#ffffff',.3):mix(c.midground,c.ink,.28)} stroke={mix(c.midground,c.ink,.45)} strokeWidth={2}/>
    <rect x={tw/2-14} y={6} width={28} height={8} rx={4} fill={mix(c.ink,c.midground,.4)}/>
    <rect x={0} y={20} width={tw} height={14} fill={lightOn?c.hero:mix(c.midground,c.ink,.45)}/>
    <path d={blob(14,44,44,46,6,70+i,1)} fill={lightOn?mix(c.paper,c.midground,.25):mix(c.midground,c.ink,.4)}/>
    <rect x={70} y={50} width={62} height={8} rx={4} fill={lightOn?mix(c.paper,c.ink,.3):mix(c.midground,c.ink,.5)}/>
    <rect x={70} y={66} width={44} height={8} rx={4} fill={lightOn?mix(c.paper,c.ink,.22):mix(c.midground,c.ink,.5)}/>
    {lightOn&&<circle cx={tw-16} cy={th-16} r={8} fill={c.hero}/>}
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

/** The single entry point of the support group. */
export const ClinicSupport:React.FC<ClinicSupportProps> = (props) => {
 const c=usePal();
 let body:React.ReactNode;
 switch(props.part){
 case 'room':body=<Room c={c} stage={props.stage} spill={props.spill??0}/>;break;
 case 'desk':body=<Desk c={c} stage={props.stage}/>;break;
 case 'workstation':body=<Workstation c={c} glow={props.glow??0}/>;break;
 case 'keyboard':body=<Keyboard c={c} down={props.down??[]}/>;break;
 case 'hands':body=<Hand side={props.side} lift={props.lift??[0,0,0,0]} reach={props.reach??0} elbow={props.elbow??ARM_REST.elbow} shoulder={props.shoulder??ARM_REST.shoulder}/>;break;
 case 'credential':body=<Credential c={c} dots={props.dots}/>;break;
 case 'boundary':body=<Boundary c={c} w={props.w} h={props.h} glow={props.glow} lock={props.lock} slot={props.slot??.62} lockY={props.lockY??.8}/>;break;
 case 'tool':body=<Tool c={c} stage={props.stage} glow={props.glow}/>;break;
 case 'rail':body=<Rail c={c} w={props.w}/>;break;
 case 'shelf':body=<Shelf c={c} w={props.w}/>;break;
 case 'stand':body=<Stand c={c}/>;break;
 case 'wall':body=<Wall c={c} lit={props.lit} share={props.share??0} label={props.label??0}/>;break;
 }
 return <g data-art-group="clinic-support"><Defs c={c}/>{body}</g>;
};
