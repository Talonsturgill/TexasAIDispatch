import React from 'react';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';

/**
 * ClinicSupport, the fresh authored support group for the 2026-10-09-claude-pilot edition.
 *
 * A Southeast Texas clinic room around the chart: a salt-weathered wall with a window onto
 * flat Gulf marsh under a white haze (cordgrass, a wind-leaned live oak, a grey bay line,
 * no planted palms), a worn laminate desk, a workstation monitor seen from the side with a
 * blank lit screen, a badge reader with a badge on a reel cord, the teal sleeve that marks
 * the boundary of the health record, and a back wall of rounded workstation tiles that can
 * light one by one to picture UTMB's own more-than-half report as a share.
 *
 * Disclosed illustration. No real screen, logo, face, patient information, vendor interface
 * or map of UTMB's campuses. The lit tiles are a share picture, never a count.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
export type ClinicStage = 'front'|'desk';
export type ClinicSupportProps =
 | {part:'room'; stage:ClinicStage; spill?:number}
 | {part:'desk'; stage:ClinicStage}
 | {part:'workstation'; stage:ClinicStage; glow?:number}
 | {part:'keyboard'; press?:number}
 | {part:'reader'; blink?:number; badge?:number; showBadge?:boolean}
 | {part:'boundary'; w:number; h:number; glow:number; dock:number; slot?:number}
 | {part:'rail'; w:number}
 | {part:'shelf'; w:number}
 | {part:'stand'}
 | {part:'wall'; lit:number; share?:number; label?:number};

/** Number of workstation tiles and the deterministic order in which they light. */
export const WALL_TILES = 20;
export const WALL_LIT_SHARE_TILES = 11;
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
 <linearGradient id="cs-laminate" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stopColor="#D7CFBD"/><stop offset=".5" stopColor="#C6BDA9"/><stop offset="1" stopColor="#B2AB9A"/>
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
  {/* sea-salt bloom at the lower sash corners */}
  <path d={`M${x+8} ${y+h-6}q18 -8 30 2M${x+w-40} ${y+h-8}q14 -6 30 0`} stroke="#ffffff" strokeOpacity={.5} strokeWidth={5} fill="none"/>
 </g>;
};

const Room:React.FC<{c:Pal;stage:ClinicStage;spill:number}> = ({c,stage,spill}) => {
 const win=stage==='front'?{x:62,y:300,w:330,h:420}:{x:40,y:250,w:470,h:520};
 return <g data-subject="clinic-room">
  <rect x={-400} y={-200} width={1880} height={2320} fill="url(#cs-wall)"/>
  <g filter="url(#cs-grain)"><rect x={-400} y={-200} width={1880} height={2320} fill={c.background} opacity={.12}/></g>
  {/* cool fill from the right side of the room */}
  <rect x={640} y={-200} width={840} height={2320} fill="#BFD3D5" opacity={.16}/>
  <GulfWindow c={c} x={win.x} y={win.y} w={win.w} h={win.h} deep={stage==='desk'}/>
  {/* the window's warm haze falls down and to the right across the wall and desk */}
  <path d={`M${win.x+20} ${win.y+win.h}L${win.x+win.w} ${win.y+win.h}L${win.x+win.w+520} ${1240}L${win.x+300} ${1240}Z`}
   fill="url(#cs-shaft)" opacity={.55+.35*clamp(spill)} filter="url(#cs-soft)"/>
  {stage==='front'&&<g>
   <path d="M-400 1004H1480" stroke={mix(c.background,c.ink,.18)} strokeWidth={10} opacity={.5}/>
   <path d="M-400 1000H1480" stroke="#ffffff" strokeOpacity={.3} strokeWidth={3}/>
  </g>}
 </g>;
};

const Desk:React.FC<{c:Pal;stage:ClinicStage}> = ({c,stage}) => {
 if (stage==='front') return <g data-subject="laminate-desk">
  <path d="M-400 1084H1480V1110H-400Z" fill="url(#cs-laminate)"/>
  <path d="M-400 1084H1480" stroke="#ffffff" strokeOpacity={.55} strokeWidth={3}/>
  <path d="M-400 1110H1480V1124H-400Z" fill="#7F7766"/>
  <path d="M-400 1124H1480V2120H-400Z" fill={mix(c.foreground,c.midground,.25)}/>
  <path d="M-400 1124H1480V1300H-400Z" fill="#000000" opacity={.08}/>
  {/* drawer fronts under the laminate, each pull a little off true */}
  {[[-120,1],[250,2],[620,3],[990,4]].map(([x,i])=><g key={i}>
   <path d={blob(x,1146,330,120,10,100+i,2)} fill={mix(c.foreground,c.midground,.38)} stroke={mix(c.foreground,c.ink,.35)} strokeWidth={2.5}/>
   <path d={`M${x+130+wob(110,i,6)} ${1180+wob(111,i,2)}h${70+wob(112,i,6)}`} stroke="#B8BFBE" strokeWidth={8} strokeLinecap="round"/>
   <path d={`M${x+10} 1150h300`} stroke="#ffffff" strokeOpacity={.12} strokeWidth={3}/>
  </g>)}
  {/* chips and scuffs from years of carts and elbows */}
  <path d="M212 1110l10 6 14 -6M640 1110l8 5 9 -5M880 1110l12 7 16 -7" fill={mix(c.foreground,c.ink,.3)}/>
  <path d="M90 1096q60 -4 120 2M520 1094q90 -3 160 3" stroke="#ffffff" strokeOpacity={.25} strokeWidth={3} fill="none"/>
  <ellipse cx={760} cy={1097} rx={26} ry={6} fill="none" stroke="#8C7F69" strokeOpacity={.4} strokeWidth={2.5}/>
 </g>;
 // Desk-level stage: the laminate recedes to a far edge just below the chart's foot.
 return <g data-subject="laminate-desk">
  <path d="M-400 910L1480 880L1480 2120L-400 2120Z" fill="url(#cs-deskplane)"/>
  <path d="M-400 910L1480 880" stroke="#7F7766" strokeWidth={8}/>
  <path d="M-400 907L1480 877" stroke="#ffffff" strokeOpacity={.45} strokeWidth={2}/>
  {Array.from({length:9},(_,i)=><path key={i} d={`M${120*i-60+wob(9,i,10)} 900L${-400+i*230} 1920`} stroke="#A79F8C" strokeOpacity={.22} strokeWidth={2}/>)}
  <path d="M120 1180q140 -10 300 6M600 1010q120 -6 220 2" stroke="#ffffff" strokeOpacity={.22} strokeWidth={5} fill="none"/>
  <ellipse cx={850} cy={1040} rx={46} ry={12} fill="none" stroke="#8C7F69" strokeOpacity={.35} strokeWidth={3}/>
 </g>;
};

const Workstation:React.FC<{c:Pal;stage:ClinicStage;glow:number}> = ({c,stage,glow}) => {
 const g=clamp(glow);
 if (stage==='front') return <g data-subject="workstation">
  <ellipse cx={230} cy={930} rx={170} ry={200} fill="url(#cs-screen)" opacity={.35+.45*g}/>
  <ellipse cx={176} cy={1088} rx={96} ry={9} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
  <path d="M112 1084Q176 1064 240 1084Z" fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={2}/>
  <path d="M166 1076L172 1012H190L188 1076Z" fill="#9BA29E" stroke="#6E7572" strokeWidth={1.5}/>
  {/* back and side of the monitor, then the bezel and the blank lit screen, turned toward the chart */}
  <path d="M86 838L104 826L112 1006L94 1014Z" fill="#9EA5A1" stroke="#5F6663" strokeWidth={2}/>
  <path d="M104 826L272 852L270 990L112 1006Z" fill="url(#cs-plastic)" stroke="#5F6663" strokeWidth={2.5} strokeLinejoin="round"/>
  <path d="M116 840L260 862L258 980L122 994Z" fill={mix('#DDF2EC',c.hero,.12)}/>
  <path d="M116 840L260 862L258 980L122 994Z" fill="#ffffff" opacity={.25+.45*g}/>
  <path d="M130 852L190 862L188 920L134 930Z" fill="#ffffff" opacity={.18}/>
  <path d="M106 830L270 855" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2.5}/>
  <circle cx={190} cy={999} r={3} fill={c.hero} opacity={.5+.5*g}/>
  <path d="M206 1072L366 1066L374 1082L210 1086Z" fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={2}/>
  <path d="M218 1071L358 1066" stroke="#7E8682" strokeWidth={3} strokeDasharray="9 5"/>
 </g>;
 return <g data-subject="workstation">
  <ellipse cx={170} cy={760} rx={210} ry={260} fill="url(#cs-screen)" opacity={.4+.45*g}/>
  <path d="M-40 520Q-30 508 -16 508H96Q110 510 112 524V880Q110 896 94 896H-20Q-38 894 -40 878Z" fill="url(#cs-plastic)" stroke="#5F6663" strokeWidth={3}/>
  <path d="M112 528V876" stroke="#E6FBF6" strokeWidth={7} opacity={.6+.4*g}/>
  <path d="M30 896V930H60V896Z" fill="#9BA29E"/>
  <ellipse cx={46} cy={934} rx={96} ry={14} fill={c.ink} opacity={.25} filter="url(#cs-soft)"/>
 </g>;
};

/** A near keyboard for the desk-level camera. Keys are blank; wear lightens a few caps. */
const Keyboard:React.FC<{c:Pal;press:number}> = ({c,press}) => {
 const rows=[0,1,2,3];
 const active=Math.floor(clamp(press)*23.999);
 return <g data-subject="workstation keyboard" transform="translate(-60 1130) rotate(-4)">
  <ellipse cx={300} cy={190} rx={330} ry={28} fill={c.ink} opacity={.28} filter="url(#cs-soft)"/>
  <path d={blob(0,0,560,180,26,4,3)} fill="url(#cs-plastic)" stroke="#6E7572" strokeWidth={3}/>
  {rows.map(r=>Array.from({length:8-(r===3?2:0)},(_,k)=>{
   const i=r*6+k, down=press>0&&press<1&&(i*7)%23===active%23;
   return <g key={r+'-'+k} transform={`translate(${26+k*64+r*14} ${18+r*38+(down?3:0)})`}>
    <path d={blob(0,0,54,30,8,i+9,1.2)} fill={hash(i)>.82?'#FBFAF5':'#E3E4DE'} stroke="#8C928E" strokeWidth={1.6}/>
    <path d="M6 5H46" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2}/>
   </g>;
  }))}
 </g>;
};

const Reader:React.FC<{c:Pal;blink:number;badge:number;showBadge:boolean}> = ({c,blink,badge,showBadge}) => {
 const b=clamp(badge);
 const bx=-150+150*b, by=-190+170*b, tilt=-18+18*b;
 return <g data-subject="badge-reader">
  <ellipse cx={58} cy={64} rx={70} ry={9} fill={c.ink} opacity={.3} filter="url(#cs-soft)"/>
  <path d={blob(0,0,118,62,14,12,2)} fill="url(#cs-plastic)" stroke="#5F6663" strokeWidth={2.5}/>
  <path d="M14 12L104 8L100 40L18 44Z" fill={mix(c.ink,c.foreground,.4)}/>
  <circle cx={94} cy={52} r={6} fill={mix(c.hero,'#ffffff',.4*clamp(blink))}/>
  <circle cx={94} cy={52} r={18} fill={c.hero} opacity={.5*clamp(blink)} filter="url(#cs-soft)"/>
  <rect x={10} y={4} width={98} height={44} rx={8} fill={c.hero} opacity={.45*clamp(blink)}/>
  {/* reel cord from off-frame to the badge; the badge is blank: no face, no name, no logo */}
  {showBadge&&<g>
  <path d={`M${bx+46} ${by}C${bx+40} ${by-90} ${bx-60} ${by-120} ${bx-120} ${by-210}`} stroke="#5E6767" strokeWidth={3} fill="none"/>
  <g transform={`translate(${bx} ${by}) rotate(${tilt} 46 60)`} data-subject="credential badge">
   <rect x={6} y={8} width={92} height={128} rx={10} fill={c.ink} opacity={.25} filter="url(#cs-soft)"/>
   <path d={blob(0,0,92,128,10,14,1.5)} fill="#F7F6F1" stroke="#5E6767" strokeWidth={2.5}/>
   <rect x={0} y={20} width={92} height={18} fill={c.hero}/>
   <rect x={18} y={50} width={56} height={40} rx={6} fill={mix(c.paper,c.midground,.35)}/>
   <rect x={16} y={100} width={60} height={7} rx={3} fill={mix(c.paper,c.ink,.3)}/>
   <rect x={16} y={112} width={40} height={6} rx={3} fill={mix(c.paper,c.ink,.2)}/>
   <rect x={38} y={-6} width={16} height={14} rx={4} fill="#9BA29E"/>
  </g>
  </g>}
 </g>;
};

/** The teal sleeve that marks the boundary of the health record, with its entry slot. */
const Boundary:React.FC<{c:Pal;w:number;h:number;glow:number;dock:number;slot:number}> = ({c,w,h,glow,dock,slot}) => {
 const g=clamp(glow), d=clamp(dock);
 const slotY=h*slot;
 const frame=`M0 22Q0 0 22 0H${w-22}Q${w} 0 ${w} 22V${slotY-52}M${w} ${slotY+52}V${h-22}Q${w} ${h} ${w-22} ${h}H22Q0 ${h} 0 ${h-22}Z`;
 return <g data-subject="record-boundary">
  <path d={frame} fill="none" stroke={c.hero} strokeWidth={22} opacity={.3*g} filter="url(#cs-soft)"/>
  <path d={frame} fill="none" stroke={mix(c.hero,c.paper,.35-.3*g)} strokeWidth={7} strokeLinejoin="round"/>
  <path d={frame} fill="none" stroke="#ffffff" strokeOpacity={.25+.4*g} strokeWidth={2}/>
  <path d={`M${w-14} ${slotY-54}H${w+14}M${w-14} ${slotY+54}H${w+14}`} stroke={mix(c.hero,c.ink,.3)} strokeWidth={7} strokeLinecap="round"/>
  <g transform={`translate(${w+150-160*d} ${slotY-28})`} opacity={d>0?1:0} data-subject="evidence-tool-tab">
   <ellipse cx={46} cy={66} rx={52} ry={7} fill={c.ink} opacity={.25} filter="url(#cs-soft)"/>
   <path d={blob(0,0,96,56,14,21,1.5)} fill={c.hero} stroke={mix(c.hero,c.ink,.4)} strokeWidth={2.5}/>
   <path d="M18 18H64M18 30H74M18 42H52" stroke="#ffffff" strokeOpacity={.85} strokeWidth={5} strokeLinecap="round"/>
  </g>
  <g opacity={.55+.45*g}>
   <path d={blob(10,-54,214,40,14,27,1.4)} fill={mix(c.hero,c.paper,.8)} stroke={c.hero} strokeWidth={2.5}/>
   <Label x={24} y={-26} size={23} fill={mix(c.hero,c.ink,.4)}>Health record</Label>
  </g>
 </g>;
};

const Wall:React.FC<{c:Pal;lit:number;share:number;label:number}> = ({c,lit,share,label}) => {
 const cols=4, rows=5, tw=176, th=104;
 const count=Math.round(clamp(lit)*WALL_LIT_SHARE_TILES);
 const on=new Set(LIGHT_ORDER.slice(0,count));
 return <g data-subject="clinic-workstations">
  <path d={blob(-24,-26,cols*196+30,rows*124+40,26,33,4)} fill={mix(c.background,c.midground,.22)} stroke={mix(c.midground,c.ink,.2)} strokeWidth={3}/>
  {Array.from({length:WALL_TILES},(_,i)=>{
   const r=Math.floor(i/cols), k=i%cols;
   const x=k*196+wob(40,i,9)+(r%2)*14, y=r*124+wob(41,i,7), lightOn=on.has(i);
   return <g key={i} transform={`translate(${x} ${y}) rotate(${wob(42,i,1.6)} ${tw/2} ${th/2})`} data-tile={lightOn?'lit':'dark'}>
    {lightOn&&<rect x={-12} y={-12} width={tw+24} height={th+24} rx={22} fill="#E9F7EF" opacity={.55} filter="url(#cs-soft)"/>}
    <path d={blob(0,0,tw,th,18,50+i,2)} fill={lightOn?mix(c.paper,'#ffffff',.3):mix(c.midground,c.ink,.25)} stroke={mix(c.midground,c.ink,.45)} strokeWidth={2}/>
    <path d={blob(40,14,96,58,8,70+i,1.2)} fill={lightOn?mix(c.hero,'#ffffff',.55):mix(c.foreground,c.ink,.35)} stroke={mix(c.ink,c.midground,.3)} strokeWidth={2}/>
    {lightOn&&<path d="M52 26H112M52 40H96" stroke="#ffffff" strokeOpacity={.75} strokeWidth={4} strokeLinecap="round"/>}
    <path d="M82 72V84M64 88H104" stroke={mix(c.ink,c.midground,.3)} strokeWidth={4} strokeLinecap="round"/>
   </g>;
  })}
  {/* the share bar: the lit side passes the halfway tick, with a feathered edge, never a figure */}
  <g transform={`translate(0 ${rows*124+40})`} opacity={clamp(share*2)}>
   <defs><linearGradient id="cs-share" x1="0" y1="0" x2="1" y2="0">
    <stop offset=".88" stopColor={c.hero}/><stop offset="1" stopColor={c.hero} stopOpacity={0}/>
   </linearGradient></defs>
   <path d={blob(0,0,cols*196-20,34,17,61,1.5)} fill={mix(c.paper,c.midground,.25)} stroke={mix(c.midground,c.ink,.35)} strokeWidth={2.5}/>
   {share>0&&<path d={blob(0,0,Math.max(40,(cols*196-20)*.62*clamp(share)),34,17,62,1.2)} fill="url(#cs-share)"/>}
   <path d={`M${(cols*196-20)/2} -14V48`} stroke={c.ink} strokeWidth={4}/>
   <g opacity={clamp(label)}><Label x={(cols*196-20)/2+14} y={86} size={30} fill={c.ink}>More than half</Label></g>
   <Label x={(cols*196-20)/2-14} y={86} size={24} fill={mix(c.ink,c.midground,.4)} anchor="end">Half</Label>
  </g>
 </g>;
};

/** A worn chart rail screwed to the wall; the screws are not evenly spaced. */
const Rail:React.FC<{c:Pal;w:number}> = ({c,w}) => <g data-subject="chart-rail">
 <rect x={4} y={10} width={w} height={22} rx={6} fill={c.ink} opacity={.22} filter="url(#cs-soft)"/>
 <path d={blob(0,0,w,22,7,81,1.5)} fill="#8C7A62" stroke="#4E4334" strokeWidth={2.5}/>
 <path d={`M8 5H${w-10}`} stroke="#C2AE8E" strokeWidth={3} strokeLinecap="round"/>
 {[.07,.38,.71,.94].map((f,i)=><g key={i}><circle cx={w*f+wob(82,i,6)} cy={11} r={5} fill="#B8BFBE" stroke="#5E6767" strokeWidth={1.5}/>
  <path d={`M${w*f+wob(82,i,6)-3} ${11}h6`} stroke="#5E6767" strokeWidth={1.5}/></g>)}
</g>;

/** A short wall shelf where the returned answer and its sources come to rest. */
const Shelf:React.FC<{c:Pal;w:number}> = ({c,w}) => <g data-subject="return-shelf">
 <path d={`M10 14H${w-6}L${w-20} 70H24Z`} fill={c.ink} opacity={.18} filter="url(#cs-soft)"/>
 <path d={blob(0,0,w,16,4,91,1.2)} fill="#9C8A70" stroke="#4E4334" strokeWidth={2.5}/>
 <path d={`M6 4H${w-8}`} stroke="#D3C3A6" strokeWidth={3}/>
 {[.16,.82].map((f,i)=><path key={i} d={`M${w*f} 16V50L${w*f+26} 16`} fill="none" stroke="#6F7979" strokeWidth={6} strokeLinejoin="round"/>)}
</g>;

/** A bent acrylic desk stand that props the chart at desk level, with its contact on the laminate. */
const Stand:React.FC<{c:Pal}> = ({c}) => <g data-subject="chart-stand">
 <ellipse cx={170} cy={500} rx={210} ry={16} fill={c.ink} opacity={.32} filter="url(#cs-soft)"/>
 <path d="M-10 486Q170 470 352 488L360 500Q170 486 -14 500Z" fill="#DCE7E6" opacity={.8} stroke="#8FA3A0" strokeWidth={2}/>
 <path d="M300 488L250 120" stroke="#DCE7E6" strokeWidth={10} opacity={.55}/>
 <path d="M4 492H340" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2}/>
</g>;

/** The single entry point of the support group. */
export const ClinicSupport:React.FC<ClinicSupportProps> = (props) => {
 const c=usePal();
 let body:React.ReactNode;
 switch(props.part){
 case 'room':body=<Room c={c} stage={props.stage} spill={props.spill??0}/>;break;
 case 'desk':body=<Desk c={c} stage={props.stage}/>;break;
 case 'workstation':body=<Workstation c={c} stage={props.stage} glow={props.glow??0}/>;break;
 case 'keyboard':body=<Keyboard c={c} press={props.press??0}/>;break;
 case 'reader':body=<Reader c={c} blink={props.blink??0} badge={props.badge??0} showBadge={props.showBadge??false}/>;break;
 case 'boundary':body=<Boundary c={c} w={props.w} h={props.h} glow={props.glow} dock={props.dock} slot={props.slot??.62}/>;break;
 case 'rail':body=<Rail c={c} w={props.w}/>;break;
 case 'shelf':body=<Shelf c={c} w={props.w}/>;break;
 case 'stand':body=<Stand c={c}/>;break;
 case 'wall':body=<Wall c={c} lit={props.lit} share={props.share??0} label={props.label??0}/>;break;
 }
 return <g data-art-group="clinic-support"><Defs c={c}/>{body}</g>;
};
