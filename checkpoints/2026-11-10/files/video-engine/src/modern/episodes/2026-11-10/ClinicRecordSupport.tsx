import React from 'react';
import {FONT,widthOf} from '../../../lib/type';

/**
 * ClinicRecordSupport, the fresh authored support group for the 2026-11-10 edition (note-check-v1).
 *
 * The note screen's world and its records, drawn new for this story:
 *  - a generic exam room seen past a worn laminate desk: a padded exam table with its back section
 *    raised and a paper sheet over the cushion, a rolling stool, a wall sanitizer dispenser; the room's
 *    window onto Houston is the place stage's, never painted here;
 *  - the desk: a teal laminate top lit from the window on the upper left, a scuffed corner, a coffee
 *    ring, a leaning cable organizer and a pen;
 *  - paper: flat cards with dog-eared corners (the school post, the press release, the initiative,
 *    the vendor design card, the statute card, the visit note), rounded luggage tags on strings,
 *    crooked rubber stamp impressions, binder clips;
 *  - the record shapes the sources describe: a dashed outline of one unified system with a progress
 *    bar that stops short, a past lane for pilot tags, a row of anonymous head-and-shoulders outlines
 *    that fill or stay dashed, a blank easel calendar, a framework frame, institution cards with small
 *    switches resting in the middle, an enrolled bill card with condition lines, a diagnosis tag, an AI
 *    tag, a stack of record cards each marked AI, a bracket, and a question mark tag.
 *
 * Warm paper on a teal desk, one burnt orange accent kept for stamps, the slot's world and the question.
 * No people are drawn: the outlines have no faces. No logos, seals, brand marks, real interface or
 * readable patient detail. Nothing is symmetric; everything is maintained but worn.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

export type Pt=[number,number];
type Pal={ink:string;paper:string;hero:string;accent:string;foreground:string;midground:string;background:string};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
export const hashS=(i:number)=>{const x=Math.sin(i*57.3+211.9)*43758.5453;return x-Math.floor(x);};
const ACCENT_LIGHT='#F8DCC4',PAPER_SHADE='#E2D7C0',DESK={top:'#7F9A97',lit:'#9CB4B0',edge:'#3A5256',face:'#2C4246'};

export const DESK_Y={back:884,front:1236,lip:1262};

const Txt:React.FC<{x:number;y:number;size:number;bold?:boolean;fill:string;anchor?:'start'|'middle'|'end';children:React.ReactNode;opacity?:number|string;italic?:boolean;display?:boolean}>=
 ({x,y,size,bold=false,fill,anchor='start',children,opacity=1,italic=false,display=false})=>
 <text x={f2(x)} y={f2(y)} fontFamily={display?FONT.display:FONT.body} fontSize={size} fontWeight={bold?800:600} fill={fill} textAnchor={anchor}
  opacity={opacity} fontStyle={italic?'italic':undefined}>{children}</text>;

const Marks:React.FC<{x0:number;x1:number;y:number;h:number;seed:number;fill:string;opacity?:number}>=({x0,x1,y,h,seed,fill,opacity=.5})=>{
 const out:React.ReactNode[]=[];let x=x0,k=0;
 while(x<x1-6&&k<30){const w=Math.min(h*(1.4+3*hashS(seed*13+k)),x1-x);out.push(<rect key={k} x={f2(x)} y={f2(y-h/2)} width={f2(w)} height={h} rx={h/2} fill={fill} opacity={opacity}/>);x+=w+h*.6;k++;}
 return <g>{out}</g>;
};
const Shadow:React.FC<{pal:Pal;x:number;y:number;w:number;h:number;r?:number;o?:number;dx?:number;dy?:number}>=({pal,x,y,w,h,r=8,o=.22,dx=8,dy=12})=>
 <rect x={x+dx} y={y+dy} width={w} height={h} rx={r} fill={pal.ink} opacity={o} filter="url(#nc1110-soft)"/>;

/** A binder clip seen from the front, its jaw at the origin. */
const Clip:React.FC<{pal:Pal;w?:number}>=({pal,w=26})=><g>
 <rect x={-w/2} y={-9} width={w} height={20} rx={3} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>
 <path d={`M${-w/4} -9V-19M${w/4} -9V-19`} stroke="#8FA0A4" strokeWidth={2.5} strokeLinecap="round"/>
 <path d={`M${-w/2+3} -5H${w/2-6}`} stroke="#7C8C90" strokeWidth={2} strokeLinecap="round"/>
</g>;

/** A flat paper card with a dog-eared top right corner, its top left at the origin. */
const Card:React.FC<{pal:Pal;w:number;h:number;header?:string;title?:string[];titleSize?:number;marks?:number;seed?:number;children?:React.ReactNode;tint?:string}>=
 ({pal,w,h,header,title=[],titleSize=36,marks=2,seed=1,children,tint})=>{
 const dog=22,ty0=header?64:20;
 return <g>
  <Shadow pal={pal} x={0} y={0} w={w} h={h}/>
  <path d={`M0 0H${w-dog}L${w} ${dog}V${h}H0Z`} fill={tint??pal.paper} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round"/>
  <path d={`M${w-dog} 0V${dog}H${w}`} fill={PAPER_SHADE} stroke={pal.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M3 4V${h-6}`} stroke="#ffffff" strokeOpacity={.55} strokeWidth={3}/>
  {header&&<><Txt x={18} y={34} size={20} bold fill={pal.foreground}>{header}</Txt><path d={`M18 46H${w-40}`} stroke="#CDBFA4" strokeWidth={2}/></>}
  {title.map((l,i)=><Txt key={i} x={18} y={ty0+titleSize*(i+.85)} size={titleSize} bold fill={pal.ink}>{l}</Txt>)}
  {Array.from({length:marks}).map((_,i)=><Marks key={i} x0={18} x1={w-30-i*40} y={ty0+titleSize*title.length+22+i*24} h={10} seed={seed*7+i} fill={pal.ink} opacity={.42}/>)}
  {children}
 </g>;
};

/** A rounded luggage tag on a short string, its hole at the origin and its body hanging to the right. */
export function tagSize(lines:string[],size:number){return {w:Math.max(...lines.map(l=>widthOf(l,size,true)))+44,h:lines.length*size*1.16+22};}
const Tag:React.FC<{pal:Pal;lines:string[];size:number;tone?:'paper'|'accent'|'teal';swing?:number}>=({pal,lines,size,tone='paper',swing=0})=>{
 const {w,h}=tagSize(lines,size);
 const fill=tone==='accent'?ACCENT_LIGHT:tone==='teal'?'#D7E6E3':pal.paper,stroke=tone==='accent'?pal.accent:pal.ink;
 return <g transform={`rotate(${f2(swing)})`}>
  <rect x={6} y={-h/2+8} width={w} height={h} rx={10} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)"/>
  <path d={`M0 0L18 ${-h/2}H${w-8}Q${w} ${-h/2} ${w} ${-h/2+8}V${h/2-8}Q${w} ${h/2} ${w-8} ${h/2}H18Z`} fill={fill} stroke={stroke} strokeWidth={2.6} strokeLinejoin="round"/>
  <circle cx={14} cy={0} r={4.5} fill="none" stroke={pal.ink} strokeWidth={2}/>
  {lines.map((l,i)=><Txt key={i} x={30} y={-h/2+11+size*(i+.92)*1.08} size={size} bold fill={pal.ink}>{l}</Txt>)}
 </g>;
};

/** A rubber stamp impression, centred at the origin, landing as p goes 0 to 1. */
const Stamp:React.FC<{pal:Pal;lines:string[];size:number;p:number;rot?:number}>=({pal,lines,size,p,rot=-6})=>{
 if(p<=0)return null;
 const w=Math.max(...lines.map(l=>widthOf(l,size,true)))+34,h=lines.length*size*1.15+20,k=smooth(p);
 return <g transform={`rotate(${rot}) scale(${f2(1.3-.3*k)})`} opacity={f2(clamp(p*2.2)*.92)}>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={6} fill="#ffffff" fillOpacity={.25} stroke={pal.accent} strokeWidth={4}/>
  <rect x={-w/2+6} y={-h/2+6} width={w-12} height={h-12} rx={4} fill="none" stroke={pal.accent} strokeWidth={1.6}/>
  {lines.map((l,i)=><Txt key={i} x={0} y={-h/2+10+size*(i+.9)*1.1} size={size} bold anchor="middle" fill={pal.accent}>{l}</Txt>)}
 </g>;
};

/** A head-and-shoulders outline with no face, its base centre at the origin, about 84 by 190. */
const FIG='M0 -186C-24 -186 -32 -166 -30 -148C-28 -128 -16 -116 0 -116C17 -116 29 -130 30 -150C31 -170 22 -186 0 -186Z M-40 0C-44 -54 -36 -92 -6 -100H6C38 -94 46 -56 42 0Z';

export type SupportPart=
 |{part:'room'}
 |{part:'desk'}
 |{part:'deskProps'}
 |{part:'card';w:number;h:number;header?:string;title?:string[];titleSize?:number;marks?:number;seed?:number;tint?:string}
 |{part:'tag';lines:string[];size:number;tone?:'paper'|'accent'|'teal';swing?:number}
 |{part:'stamp';lines:string[];size:number;p:number;rot?:number}
 |{part:'clip';w?:number}
 |{part:'thread';a:Pt;c:Pt;b:Pt;p:number;color?:string;w?:number}
 |{part:'pilotLane';w:number}
 |{part:'platform';w:number;h:number;draw:number;fill:number;stopAt:number;working:number}
 |{part:'figure';filled:number}
 |{part:'calendar'}
 |{part:'arrow';w:number;p:number;label:string}
 |{part:'framework';w:number;h:number;draw:number}
 |{part:'institution';w:number;h:number;sw:number}
 |{part:'bill';w:number;h:number;diag:number;ai:number;aiFrame:number;stamp:number;hl:number;std:number;dframe:number}
 |{part:'records';n:number}
 |{part:'bracket';x:number;y0:number;y1:number;from:Pt;p:number}
 |{part:'visitNote'}
 |{part:'question';p:number};

export const BILL={w:560,h:310,lines:[1012,1042,1072].map(y=>y-904),diag:{x:26,y:196,w:168,h:44},ai:{x:204,y:196,w:72,h:44},
 stamp:{x:428,y:254},std:{x:330,y:152}};

export const ClinicRecordSupport:React.FC<{pal:Pal}&SupportPart>=(props)=>{
 const {pal}=props;
 switch(props.part){
 case 'room':return <g data-part="exam-room">
  {/* a wall sanitizer dispenser beside the window, worn at its push plate */}
  <g transform="translate(1004 520)">
   <rect x={4} y={6} width={58} height={112} rx={10} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
   <rect x={0} y={0} width={58} height={112} rx={10} fill="#E9EEEC" stroke={pal.ink} strokeWidth={3}/>
   <rect x={10} y={64} width={38} height={30} rx={5} fill="#B9C7C6" stroke={pal.ink} strokeWidth={2}/>
   <rect x={22} y={110} width={14} height={10} rx={2} fill="#8B9A9A"/>
  </g>
  {/* the rolling stool, its seat just showing past the desk */}
  <g transform="translate(486 868)">
   <path d="M0 0V40" stroke="#56676B" strokeWidth={10}/>
   <ellipse cx={0} cy={0} rx={44} ry={14} fill="#2F3D42" stroke={pal.ink} strokeWidth={3}/>
   <ellipse cx={-10} cy={-4} rx={22} ry={5} fill="#6F8186" opacity={.7}/>
  </g>
  {/* the padded exam table: back section raised at the left, a paper sheet over the cushion */}
  <g data-part="exam-table">
   <rect x={110} y={846} width={330} height={60} rx={10} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)"/>
   <path d="M98 878L138 760Q146 748 160 752L196 764Q206 768 202 780L180 850Z" fill="#4E6E72" stroke={pal.ink} strokeWidth={3} strokeLinejoin="round"/>
   <path d="M146 766L180 776" stroke="#8DB0B1" strokeWidth={4} strokeLinecap="round"/>
   <rect x={168} y={838} width={268} height={42} rx={14} fill="#567A7E" stroke={pal.ink} strokeWidth={3}/>
   <path d="M180 846H420" stroke="#93B6B6" strokeWidth={4} strokeLinecap="round"/>
   <path d="M232 838V880M330 836V878" stroke="#3C5A5E" strokeWidth={2}/>
   {/* the paper sheet, crinkled and a little skewed */}
   <path d="M186 832L404 828L412 852L398 850L392 870L190 874Z" fill="#F4F0E4" stroke="#A8A08C" strokeWidth={2} strokeLinejoin="round" opacity={.95}/>
   <path d="M246 836L250 868M300 834L296 870" stroke="#D9D1BC" strokeWidth={2}/>
   <rect x={96} y={872} width={350} height={14} rx={4} fill="#9AA6A7" stroke={pal.ink} strokeWidth={2.5}/>
  </g>
 </g>;
 case 'desk':return <g data-part="desk">
  <defs><linearGradient id="nc1110-desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={DESK.lit}/><stop offset=".55" stopColor={DESK.top}/><stop offset="1" stopColor="#6C8885"/></linearGradient></defs>
  <path d={`M-60 ${DESK_Y.back}H1140V${DESK_Y.front}H-60Z`} fill="url(#nc1110-desk)"/>
  <path d={`M-60 ${DESK_Y.back}H1140`} stroke={DESK.edge} strokeWidth={5}/>
  <path d={`M-60 ${DESK_Y.back+8}H1140`} stroke="#B5C9C5" strokeWidth={2} opacity={.6}/>
  {/* wear: a scuffed front corner, a few scratches and a coffee ring */}
  <ellipse cx={40} cy={1218} rx={70} ry={20} fill="#B9CAC6" opacity={.35}/>
  <path d="M640 1186l90 -8M662 1200l60 -4M180 980l70 -6" stroke="#5F7A77" strokeWidth={2} opacity={.5} strokeLinecap="round"/>
  <ellipse cx={968} cy={1192} rx={34} ry={14} fill="none" stroke="#5D7471" strokeWidth={3} opacity={.45}/>
  <rect x={-60} y={DESK_Y.front} width={1200} height={DESK_Y.lip-DESK_Y.front} fill={DESK.edge}/>
  <path d={`M-60 ${DESK_Y.front+3}H1140`} stroke="#6E8C8C" strokeWidth={3}/>
  <rect x={-60} y={DESK_Y.lip} width={1200} height={1400} fill={DESK.face}/>
  <rect x={-60} y={DESK_Y.lip} width={1200} height={14} fill={pal.ink} opacity={.35}/>
 </g>;
 case 'deskProps':return <g data-part="desk-props">
  {/* a leaning wire cable organizer at the back right, and a pen left at the front */}
  <g transform="translate(930 872) rotate(-6)">
   <rect x={6} y={8} width={74} height={50} rx={6} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
   <path d="M0 0H72L66 50H6Z" fill="none" stroke="#4B5B60" strokeWidth={4} strokeLinejoin="round"/>
   <path d="M18 0L20 50M36 0V50M54 0L52 50" stroke="#4B5B60" strokeWidth={2.5}/>
   <path d="M30 -2C36 -30 60 -26 58 -6" stroke="#1F2A2D" strokeWidth={5} fill="none"/>
  </g>
  <g transform="translate(64 1196) rotate(-11)">
   <rect x={4} y={6} width={150} height={12} rx={6} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
   <rect x={0} y={0} width={150} height={12} rx={6} fill="#1F3A40"/><path d="M150 6l18 -1" stroke="#1F3A40" strokeWidth={4} strokeLinecap="round"/>
   <rect x={18} y={-4} width={8} height={18} rx={2} fill="#A9B5B5"/>
  </g>
 </g>;
 case 'card':return <Card pal={pal} w={props.w} h={props.h} header={props.header} title={props.title} titleSize={props.titleSize} marks={props.marks} seed={props.seed} tint={props.tint}/>;
 case 'tag':return <Tag pal={pal} lines={props.lines} size={props.size} tone={props.tone} swing={props.swing}/>;
 case 'stamp':return <Stamp pal={pal} lines={props.lines} size={props.size} p={props.p} rot={props.rot}/>;
 case 'clip':return <Clip pal={pal} w={props.w}/>;
 case 'thread':{
  const {a,c,b,p}=props,color=props.color??pal.foreground,w=props.w??4;if(p<=0)return null;
  const d=`M${f2(a[0])} ${f2(a[1])}Q${f2(c[0])} ${f2(c[1])} ${f2(b[0])} ${f2(b[1])}`,dash=`${f2(1000*clamp(p))} 1000`;
  return <g>
   <path d={d} stroke="#ffffff" strokeOpacity={.45} strokeWidth={w+3} fill="none" pathLength={1000} strokeDasharray={dash} strokeLinecap="round"/>
   <path d={d} stroke={color} strokeWidth={w} fill="none" pathLength={1000} strokeDasharray={dash} strokeLinecap="round"/>
   <circle cx={f2(a[0])} cy={f2(a[1])} r={w*1.2} fill={color}/>
   {p>=.999&&<g><circle cx={f2(b[0])} cy={f2(b[1])} r={w*1.7} fill={color}/><path d={`M${f2(b[0]-6)} ${f2(b[1]+4)}l-8 10M${f2(b[0]+4)} ${f2(b[1]+5)}l6 11`} stroke={color} strokeWidth={2.4} strokeLinecap="round"/></g>}
  </g>;}
 case 'pilotLane':return <g data-part="pilot-lane">
  <Shadow pal={pal} x={0} y={0} w={props.w} h={56} o={.16}/>
  <rect x={0} y={0} width={props.w} height={56} rx={8} fill="#E6EBE5" stroke={pal.ink} strokeWidth={2.5} strokeDasharray="12 6"/>
  <Txt x={14} y={36} size={22} bold fill={pal.foreground}>pilots</Txt>
  <path d={`M92 28H${props.w-14}`} stroke="#B8C3BE" strokeWidth={2}/>
 </g>;
 case 'platform':{
  const {w,h,draw,fill,stopAt,working}=props,track={x:24,y:h-46,w:w-62};
  const head=track.x+track.w*stopAt*clamp(fill);
  return <g data-part="platform">
   {/* the dashed outline draws on from the left as a sweep; its inside stays empty */}
   <defs><clipPath id="nc1110-plat"><rect x={-10} y={-10} width={f2((w+20)*clamp(draw*1.3))} height={h+20}/></clipPath></defs>
   <g clipPath="url(#nc1110-plat)">
    <rect x={0} y={0} width={w} height={h} rx={22} fill="#ffffff" fillOpacity={.18} stroke={pal.ink} strokeWidth={4} strokeDasharray="18 12"/>
   </g>
   <Txt x={24} y={96} size={26} bold fill={pal.ink} opacity={f2(smooth((draw-.3)/.5))}>one unified system</Txt>
   <rect x={track.x} y={track.y-9} width={track.w} height={18} rx={9} fill="#E3E7E1" stroke={pal.ink} strokeWidth={2.4} opacity={f2(smooth(draw*2))}/>
   {fill>0&&<rect x={track.x} y={track.y-9} width={f2(head-track.x)} height={18} rx={9} fill={pal.foreground}/>}
   <path d={`M${track.x+track.w+14} ${track.y-26}V${track.y+26}`} stroke={pal.ink} strokeWidth={4} strokeDasharray="7 6" opacity={f2(smooth(draw*2))}/>
   {working>0&&<g transform={`translate(${f2(head)} ${track.y-16})`} opacity={f2(smooth(working))}>
    <path d="M0 0V-26" stroke={pal.ink} strokeWidth={2.5}/>
    <g transform="translate(-8 -48)"><Tag pal={pal} lines={['working toward']} size={20} tone="teal" swing={-2+6*(1-smooth(working))}/></g>
   </g>}
  </g>;}
 case 'figure':{
  const f=smooth(props.filled);
  return <g data-part="figure">
   <path d={FIG} fill={pal.ink} opacity={.14*f} transform="translate(6 6)" filter="url(#nc1110-soft)"/>
   <path d={FIG} fill={pal.paper} fillOpacity={f2(f)} stroke={pal.ink} strokeWidth={f>.5?3.2:2.6} strokeDasharray={f>.5?undefined:'9 7'} fillRule="nonzero"/>
   {f>0&&<path d="M-22 -8C-22 -50 -12 -82 0 -86" stroke="#ffffff" strokeOpacity={.55*f} strokeWidth={4} fill="none" strokeLinecap="round"/>}
  </g>;}
 case 'calendar':return <g data-part="calendar">
  <path d="M30 150L58 10M170 150L142 10" stroke="#4B5B60" strokeWidth={6} strokeLinecap="round"/>
  <Shadow pal={pal} x={6} y={8} w={186} h={136}/>
  <rect x={4} y={12} width={190} height={134} rx={8} fill={pal.paper} stroke={pal.ink} strokeWidth={3}/>
  <rect x={4} y={12} width={190} height={30} rx={8} fill="#C9D6D2" stroke={pal.ink} strokeWidth={3}/>
  {[52,98,146].map((x,i)=><path key={i} d={`M${x} 4v22`} stroke="#59666A" strokeWidth={5} strokeLinecap="round"/>)}
  <rect x={44} y={60} width={110} height={70} rx={8} fill="none" stroke={pal.ink} strokeWidth={2.6} strokeDasharray="10 7"/>
  <path d="M8 144l14 -3" stroke="#B7AB91" strokeWidth={2}/>
 </g>;
 case 'arrow':{
  const {w,p,label}=props;if(p<=0)return null;
  return <g data-part="eventually" opacity={f2(smooth(p*1.5))}>
   <path d={`M0 0H${f2(w*smooth(p))}`} stroke={pal.ink} strokeWidth={3.5} strokeDasharray="12 9" strokeLinecap="round"/>
   {p>.6&&<path d={`M${w-14} -10L${w} 0L${w-14} 10`} stroke={pal.ink} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={f2(smooth((p-.6)/.4))}/>}
   <Txt x={w/2} y={-14} size={24} bold anchor="middle" fill={pal.ink} opacity={f2(smooth((p-.3)/.5))}>eventually</Txt>
  </g>;}
 case 'framework':{
  const {w,h,draw}=props,d=smooth(draw);
  return <g data-part="framework">
   <rect x={0} y={0} width={w} height={h} rx={14} fill="#E3ECE9" fillOpacity={f2(.85*d)} stroke={pal.ink} strokeWidth={4}
    pathLength={1000} strokeDasharray={`${f2(1000*clamp(draw*1.25))} 1000`}/>
   <Txt x={22} y={38} size={30} bold fill={pal.ink} opacity={f2(smooth((draw-.35)/.4))}>framework</Txt>
   <Txt x={22} y={68} size={22} fill={pal.foreground} opacity={f2(smooth((draw-.5)/.4))}>Abridge</Txt>
   <g transform={`translate(${w-208} ${h/2})`} opacity={f2(smooth((draw-.6)/.4))}><Tag pal={pal} lines={['Abridge says']} size={20}/></g>
  </g>;}
 case 'institution':{
  const {w,h,sw}=props,s=smooth(sw);
  return <g data-part="institution">
   <Shadow pal={pal} x={0} y={0} w={w} h={h}/>
   <path d={`M0 0H${w-18}L${w} 18V${h}H0Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round"/>
   <path d={`M${w-18} 0V18H${w}`} fill={PAPER_SHADE} stroke={pal.ink} strokeWidth={2}/>
   <Txt x={14} y={34} size={22} bold fill={pal.ink}>UT health</Txt>
   <Txt x={14} y={60} size={22} bold fill={pal.ink}>institution</Txt>
   {/* its own small switch, resting in the middle: lit when it is that card's to set */}
   <g transform={`translate(${w/2} ${h-30})`}>
    <rect x={-34} y={-14} width={68} height={28} rx={14} fill={s>0?`rgba(224,123,46,${f2(.25+.45*s)})`:'#DCDFD8'} stroke={pal.ink} strokeWidth={2.6}/>
    <path d="M0 -10V10" stroke={pal.ink} strokeWidth={1.6} strokeDasharray="3 3" opacity={.6}/>
    <circle cx={0} cy={0} r={11} fill={s>0?'#ffffff':'#F3F1EA'} stroke={pal.ink} strokeWidth={2.6}/>
    {s>0&&<circle cx={0} cy={0} r={18} fill="none" stroke={pal.accent} strokeWidth={2} opacity={f2(.8*s*(1-.6*s))}/>}
   </g>
  </g>;}
 case 'bill':{
  const {w,h,diag,ai,aiFrame,stamp,hl,std,dframe}=props,B=BILL;
  const dg=smooth(diag),aiP=smooth(ai);
  return <g data-part="bill-card">
   <Shadow pal={pal} x={0} y={0} w={w} h={h}/>
   <path d={`M0 0H${w-24}L${w} 24V${h}H0Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={3} strokeLinejoin="round"/>
   <path d={`M${w-24} 0V24H${w}`} fill={PAPER_SHADE} stroke={pal.ink} strokeWidth={2.4}/>
   <path d={`M3 4V${h-6}`} stroke="#ffffff" strokeOpacity={.55} strokeWidth={3}/>
   <Txt x={22} y={42} size={28} bold fill={pal.ink}>Texas Senate Bill 1188</Txt>
   <Txt x={22} y={68} size={18} fill={pal.foreground}>enrolled bill text</Txt>
   <Txt x={22} y={98} size={18} bold fill={pal.foreground}>conditions</Txt>
   {B.lines.map((y,i)=>i===1?<g key={i}>
     {hl>0&&<rect x={18} y={y-17} width={f2(8+(w-60)*smooth(hl))} height={32} rx={6} fill={ACCENT_LIGHT}/>}
     {hl<1&&<Marks x0={26} x1={w-60} y={y} h={10} seed={40+i} fill={pal.ink} opacity={.4*(1-smooth(hl))}/>}
     {hl>0&&<Txt x={26} y={y+8} size={22} bold fill={pal.ink} opacity={f2(smooth((hl-.25)/.5))}>review all AI-created records</Txt>}
    </g>:<Marks key={i} x0={26} x1={w-60-i*30} y={y} h={10} seed={40+i} fill={pal.ink} opacity={.4}/>)}
   {/* the diagnosis tag lights; the AI tag slides in beside it; a thin frame draws round both */}
   <g transform={`translate(${B.diag.x} ${B.diag.y})`}>
    <rect x={0} y={0} width={B.diag.w} height={B.diag.h} rx={22} fill={dg>0?`rgba(224,123,46,${f2(.18+.3*dg+.25*smooth(dframe))})`:'#E5E1D5'} stroke={pal.ink} strokeWidth={2.6}/>
    <Txt x={B.diag.w/2} y={30} size={23} bold anchor="middle" fill={pal.ink} opacity={f2(.45+.55*dg)}>diagnosis</Txt>
   </g>
   {ai>0&&<g transform={`translate(${f2(B.ai.x+(1-aiP)*(w-B.ai.x+40))} ${B.ai.y})`} opacity={f2(clamp(ai*3))}>
    <rect x={0} y={0} width={B.ai.w} height={B.ai.h} rx={10} fill="#D7E6E3" stroke={pal.ink} strokeWidth={2.6}/>
    <Txt x={B.ai.w/2} y={30} size={23} bold anchor="middle" fill={pal.ink}>AI</Txt>
   </g>}
   {aiFrame>0&&<rect x={B.diag.x-10} y={B.diag.y-10} width={B.ai.x+B.ai.w-B.diag.x+20} height={B.diag.h+20} rx={14} fill="none" stroke={pal.foreground} strokeWidth={3}
    pathLength={1000} strokeDasharray={`${f2(1000*clamp(aiFrame))} 1000`}/>}
   {/* s9: the law's own word, framed in the accent */}
   {dframe>0&&<rect x={B.diag.x-6} y={B.diag.y-6} width={B.diag.w+12} height={B.diag.h+12} rx={26} fill="none" stroke={pal.accent} strokeWidth={5}
    pathLength={1000} strokeDasharray={`${f2(1000*clamp(dframe))} 1000`}/>}
   <g transform={`translate(${B.stamp.x} ${B.stamp.y})`}><Stamp pal={pal} lines={['Effective','September 1st, 2025']} size={19} p={stamp} rot={-7}/></g>
   {/* s8: the standards tag, clipped on a short string under the highlighted condition line */}
   {std>0&&<g>
    <path d={`M${f2(26+widthOf('review all AI-created records',22,true)*.92)} ${B.lines[1]+10}Q${B.std.x+24} ${B.lines[1]+14} ${B.std.x+4} ${f2(B.std.y-30*(1-smooth(std)))}`}
     stroke={pal.ink} strokeWidth={2} fill="none" opacity={f2(smooth(std))}/>
    <g transform={`translate(${B.std.x} ${f2(B.std.y-30*(1-smooth(std)))})`} opacity={f2(clamp(std*3))}>
     <Tag pal={pal} lines={['Texas Medical','Board standards']} size={19} tone="teal" swing={-3+8*(1-smooth(std))}/></g>
   </g>}
  </g>;}
 case 'records':return <g data-part="record-stack">
  {Array.from({length:props.n}).map((_,i)=>{const r=(hashS(70+i)-.5)*7,x=(hashS(80+i)-.5)*14,y=-i*20;
   return <g key={i} transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(r)} 110 70)`}>
    <Shadow pal={pal} x={0} y={0} w={220} h={140} o={.16} dy={8}/>
    <path d="M0 0H200L220 20V140H0Z" fill={i%2?'#F6F0E2':pal.paper} stroke={pal.ink} strokeWidth={2.6}/>
    <Marks x0={16} x1={150} y={30} h={9} seed={90+i} fill={pal.ink} opacity={.4}/>
    <Marks x0={16} x1={120} y={52} h={9} seed={95+i} fill={pal.ink} opacity={.4}/>
    <rect x={150} y={14} width={50} height={30} rx={8} fill="#D7E6E3" stroke={pal.ink} strokeWidth={2.2}/>
    <Txt x={175} y={36} size={19} bold anchor="middle" fill={pal.ink}>AI</Txt>
   </g>;})}
  <Txt x={16} y={124} size={20} bold fill={pal.foreground}>records</Txt>
 </g>;
 case 'bracket':{
  const {x,y0,y1,from,p}=props;if(p<=0)return null;
  // the serifs turn toward what the bracket holds: away from the line it comes from
  const k=from[0]>x?-18:18;
  const d=`M${f2(from[0])} ${f2(from[1])}C${f2(from[0]-30)} ${f2(from[1])} ${f2(x+30)} ${f2(y0+20)} ${f2(x)} ${f2(y0+20)}M${f2(x+k)} ${f2(y0)}H${f2(x)}V${f2(y1)}H${f2(x+k)}`;
  return <path data-part="bracket" d={d} stroke={pal.accent} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
   pathLength={1000} strokeDasharray={`${f2(1000*clamp(p))} 1000`}/>;}
 case 'visitNote':return <g data-part="visit-note">
  <Card pal={pal} w={226} h={118} header="visit note" marks={0}/>
  <Marks x0={18} x1={190} y={76} h={12} seed={7} fill={pal.ink} opacity={.78}/>
  <rect x={150} y={8} width={52} height={26} rx={13} fill="#DCE8E5" stroke={pal.foreground} strokeWidth={2}/>
  <Txt x={176} y={27} size={16} bold anchor="middle" fill={pal.ink}>AI</Txt>
  <path d="M18 100H120" stroke="#CFC8B6" strokeWidth={3} strokeDasharray="9 8"/>
 </g>;
 case 'question':{
  const k=smooth(props.p);if(k<=0)return null;
  return <g data-part="question" opacity={f2(clamp(props.p*3))}>
   <rect x={-30} y={-34} width={60} height={64} rx={14} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)" transform="translate(6 8)"/>
   <rect x={-30} y={-34} width={60} height={64} rx={14} fill={ACCENT_LIGHT} stroke={pal.accent} strokeWidth={3.5}/>
   <Txt x={0} y={18} size={48} bold anchor="middle" fill={pal.accent} display>?</Txt>
  </g>;}
 }
};
export {Tag as SupportTag,lerp as supportLerp};
