import React from 'react';
import {useUid} from '../../../lib/uid';
import {FONT,widthOf} from '../../../lib/type';

/**
 * OrderRigHero, the fresh authored hero group for the 2026-10-26 edition (order-pass-v1).
 *
 * ONE order rig carries the film from the table to the kitchen and the tip jar. None of it is a real
 * product: no logo, wordmark, app, card network, restaurant name, serial or real code.
 *
 *  - a generic phone with a rounded off-white body, a worn lower corner and a dark bezel. Its screen
 *    performs the whole ordering flow: a camera viewfinder whose corner brackets close on the table code
 *    (or hunt and never close), a menu sheet that slides up with five dish rows, one row named Chow mein
 *    whose plain price chip lights (no numeral is ever drawn), a Talk button and a Pay button that
 *    morphs into the round red paid mark;
 *  - the hand that holds it and the index finger that taps it, skin as a fill only;
 *  - a hand-drawn square code card in a clear acrylic table stand. Its pattern is seeded and irregular and
 *    is not a working code;
 *  - a boxy thermal kitchen ticket printer with a slot on its top face, a standby lamp that turns red, a
 *    feed button and a worn sticker, standing under a leaning steel ticket rail on two posts. A printed
 *    ticket rises out of the slot top first until its top edge reaches the rail, where a ball bearing grips it;
 *  - a carbon steel wok resting in its ring on a gas burner over a steel range front: empty and unlit (no
 *    flame drawn at all) until it is loaded, then flaring orange; the cook's hand on its handle rocks the pan
 *    about the ring, and that movement is what lifts the noodles; the cook's forearm and hand with a steel
 *    bowl of raw noodles that pours;
 *  - a glass tip jar with a threaded neck that fills with plain coins and folded plain notes;
 *  - top views of the jar, the printer and the wok for the plan shots, and the loose coin and note.
 *
 * Colour carries meaning once: the chili red is only the paid mark, the printer lamp that answers it, the
 * wok's flare and (in the support group) the owner count stamp. The phone is the one clean light value.
 *
 * Light: warm tungsten from the upper left lights the shells and the steel, a cool fill from the right
 * shades the lower right, and the screens and the flame are their own sources. The episode lays contact
 * shadows. Pure function of its props: no clock, no state, no random input.
 *
 * Disclosed illustration of a reported ordering flow. Not the restaurant, not its software, not a working
 * code or payment screen, and the jar holds no real money or record.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
/** A fixed scatter: the same value for the same index on every frame and every render. */
export const hash=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};

export const HP={body:'#EAE5DA',bodyLit:'#FAF7F0',bodyShade:'#CFC7B7',bodyDeep:'#A39A89',ink:'#1E1612',bezel:'#191E22',screen:'#141B21',
 menu:'#FBF7EE',menuShade:'#EFE7D8',line:'#D8CDB8',bar:'#C6B9A1',terracotta:'#A0674A',terracottaDeep:'#7C4B33',butter:'#F3CF79',
 red:'#D2402A',redDeep:'#9A2918',redLit:'#EE6A4E',white:'#FFFDF6',
 steel:'#B6BCBE',steelLit:'#E4E7E6',steelDeep:'#7B8487',steelDark:'#525A5E',charcoal:'#2C3034',charcoalLit:'#4B5258',charcoalDeep:'#1A1D20',
 paper:'#FBF8F0',paperShade:'#E5DECE',thermal:'#2B2B2B',
 flameBlue:'#4F86D2',flameCore:'#CDE6FF',flameOrange:'#F2862A',flameYellow:'#FFD56E',flameRed:'#D2402A',
 wok:'#2A2421',wokLit:'#5C4C42',wood:'#6F4529',woodLit:'#93613D',
 glass:'#E3EFEE',coinGold:'#C49B45',coinGoldLit:'#EAD08C',coinGoldDeep:'#8E6C28',coinSilver:'#B5BBBD',coinSilverLit:'#E2E6E6',coinSilverDeep:'#7E8689',
 bill:'#9FB39B',billLit:'#C6D4C1',billDeep:'#6C856A',noodle:'#D9A653',noodleDeep:'#A3712F',onion:'#5E9A4A',carrot:'#E07B39',
 skin:['#8B5A3C','#C58B5E','#E1B48E','#5D3B28','#A86F47']};

// ---- the paid mark ----------------------------------------------------------------------------------------
/** The round red paid mark: a disc, a lighter rim and a white check that draws in with `check`. */
export const PaidMark:React.FC<{r:number;check?:number;ring?:number}>=({r,check=1,ring=0})=>{
 const c=clamp(check),len=2.05*r;
 return <g data-part="paid-mark">
  {ring>0&&<circle r={r*(1+.7*ring)} fill="none" stroke={HP.red} strokeWidth={r*.12} opacity={f2(.6*(1-ring))}/>}
  <circle r={r} fill={HP.red} stroke={HP.redDeep} strokeWidth={Math.max(1.5,r*.07)}/>
  <path d={`M${f2(-r*.62)} ${f2(-r*.62)}A${f2(r*.88)} ${f2(r*.88)} 0 0 1 ${f2(r*.5)} ${f2(-r*.72)}`} stroke={HP.redLit} strokeWidth={r*.1} fill="none" opacity={.7} strokeLinecap="round"/>
  {c>0&&<path d={`M${f2(-r*.46)} ${f2(r*.02)}L${f2(-r*.12)} ${f2(r*.36)}L${f2(r*.5)} ${f2(-r*.34)}`} stroke={HP.white} strokeWidth={r*.2}
   fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={f2(len)} strokeDashoffset={f2(len*(1-c))}/>}
 </g>;
};

// ---- the code card ----------------------------------------------------------------------------------------
/** The card's printed face, a seeded irregular block pattern with three rounded corner marks. It reads as a
 * table code at a glance and is deliberately not a working code. Drawn at size s from its top left. */
export const CodePattern:React.FC<{s:number;ink?:string}>=({s,ink=HP.ink})=>{
 const n=11,c=s/n,cells:React.ReactNode[]=[];
 const corner=(i:number,j:number)=>(i<3&&j<3)||(i>7&&j<3)||(i<3&&j>7);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  if(corner(i,j))continue;
  if(hash(i*17+j*31+5)>.5)cells.push(<rect key={i+'-'+j} x={f2(i*c+c*.08)} y={f2(j*c+c*.08)} width={f2(c*.84)} height={f2(c*.84)} rx={f2(c*.18)} fill={ink}/>);
 }
 const mark=(x:number,y:number,k:number)=><g key={k}><rect x={f2(x)} y={f2(y)} width={f2(c*3)} height={f2(c*3)} rx={f2(c*.7)} fill="none" stroke={ink} strokeWidth={f2(c*.62)}/>
  <rect x={f2(x+c*.95)} y={f2(y+c*.95)} width={f2(c*1.1)} height={f2(c*1.1)} rx={f2(c*.3)} fill={ink}/></g>;
 return <g data-part="code-pattern">{cells}{mark(c*.2,c*.2,0)}{mark(s-c*3.2,c*.2,1)}{mark(c*.2,s-c*3.2,2)}
  <circle cx={f2(s-c*1.7)} cy={f2(s-c*1.7)} r={f2(c*1.05)} fill="none" stroke={ink} strokeWidth={f2(c*.5)}/></g>;
};
/** Card face in the front view, in stand units (origin at the base's bottom centre). */
export const CODE_FACE={x:-75,y:-226,s:150};
export const CODE_STAND_BOX:[number,number,number,number]=[-100,-246,100,2];
const CodeStand:React.FC<{}>=()=>{
 const id=useUid('orcode');
 const F=CODE_FACE;
 return <g data-part="code-stand">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={.55}/><stop offset=".5" stopColor="#FFFFFF" stopOpacity={.08}/><stop offset="1" stopColor="#FFFFFF" stopOpacity={.3}/></linearGradient></defs>
  <rect x={-94} y={-26} width={188} height={26} rx={6} fill={HP.wood} stroke={HP.ink} strokeWidth={3}/>
  <rect x={-90} y={-24} width={150} height={6} rx={3} fill={HP.woodLit} opacity={.8}/>
  <path d="M-88 -26L-84 -240H84L88 -26Z" fill="#D6E4E6" opacity={.35} stroke={HP.ink} strokeWidth={2.4} strokeOpacity={.55}/>
  <rect x={F.x-6} y={F.y-6} width={F.s+12} height={F.s+70} rx={8} fill={HP.white} stroke={HP.ink} strokeWidth={2.4}/>
  <g transform={`translate(${F.x} ${F.y})`}><CodePattern s={F.s}/></g>
  <path d={`M${F.x+40} ${F.y+F.s+30}q35 -12 70 0`} stroke={HP.terracotta} strokeWidth={5} fill="none" strokeLinecap="round"/>
  <path d={`M${F.x+50} ${F.y+F.s+30}a25 14 0 0 0 50 0`} fill={HP.terracotta} opacity={.85}/>
  <path d="M-84 -240H84L88 -26H-88Z" fill={`url(#${id})`}/>
  <path d="M-70 -232L-40 -40" stroke="#FFFFFF" strokeWidth={5} opacity={.35} strokeLinecap="round"/>
  <path d="M60 -40l18 -3" stroke={HP.ink} strokeWidth={2} opacity={.4}/>
 </g>;
};
/** The same stand seen from above and in front, its face foreshortened: for the overhead table shots. */
export const CODE_TOP={w:190,depth:26,face:150,fy:.46};
const CodeStandTop:React.FC<{}>=()=>{
 const F=CODE_TOP;
 return <g data-part="code-stand-top">
  <rect x={-F.w/2} y={0} width={F.w} height={F.depth*1.8} rx={6} fill={HP.wood} stroke={HP.ink} strokeWidth={3}/>
  <g transform={`translate(0 0) scale(1 ${F.fy})`}>
   <rect x={-86} y={-226} width={172} height={226} rx={8} fill={HP.white} stroke={HP.ink} strokeWidth={3/F.fy*.8}/>
   <g transform="translate(-75 -214)"><CodePattern s={150}/></g>
  </g>
 </g>;
};

// ---- the phone ----------------------------------------------------------------------------------------------
/** Phone units: the body is 300 by 600 about its centre; the screen is 264 by 540 from SCREEN's corner. */
export const PHONE={w:300,h:600,screen:{x:-132,y:-270,w:264,h:540}};
/** Screen points the performance touches (screen units from the screen's top left). */
export const PHONE_UI={rowY:70,rowH:76,chowRow:1,chow:[150,184] as Pt,pay:[190,503] as Pt,paid:[214,503] as Pt,paidBig:[132,360] as Pt,mic:[44,503] as Pt,code:{x:57,y:175,s:150}};
/** A screen point in phone units. */
export const screenPt=(p:Pt):Pt=>[PHONE.screen.x+p[0],PHONE.screen.y+p[1]];
export type PhoneState={scan?:number;lock?:number;menu?:number;lit?:number;tap?:number;tapAt?:Pt;pay?:number;hunt?:Pt;huntScale?:number;dim?:number};
const DishIcon:React.FC<{k:number}>=({k})=>{
 if(k===0)return <g><circle r={18} fill="#F3EEE4" stroke={HP.ink} strokeWidth={1.6}/><ellipse cy={2} rx={12} ry={7} fill="#E9E1C9"/><circle cx={-4} cy={0} r={3} fill={HP.onion}/><circle cx={5} cy={3} r={2.6} fill={HP.carrot}/></g>;
 if(k===1)return <g><circle r={18} fill="#F3EEE4" stroke={HP.ink} strokeWidth={1.6}/>
  {[0,1,2,3].map(i=><path key={i} d={`M${-11+i*2} ${-4+i*3}q6 -6 11 0t11 0`} stroke={i%2?HP.noodleDeep:HP.noodle} strokeWidth={2.6} fill="none" strokeLinecap="round"/>)}<circle cx={6} cy={-6} r={2.4} fill={HP.onion}/></g>;
 if(k===2)return <g><circle r={18} fill="#F3EEE4" stroke={HP.ink} strokeWidth={1.6}/>{[-7,0,7].map((x,i)=><path key={i} d={`M${x-6} ${3}q6 -12 12 0z`} fill="#F1E3C4" stroke={HP.ink} strokeWidth={1.2}/>)}</g>;
 if(k===3)return <g><circle r={18} fill="#F3EEE4" stroke={HP.ink} strokeWidth={1.6}/><path d="M-12 8L10 -10" stroke={HP.wood} strokeWidth={2}/>{[-6,0,6].map((d,i)=><circle key={i} cx={d-1} cy={-d*.8+2} r={4} fill={i===1?HP.carrot:'#9A5B3A'}/>)}</g>;
 return <g><circle r={18} fill="#F3EEE4" stroke={HP.ink} strokeWidth={1.6}/><circle r={12} fill="#E8C98C"/><circle cx={-3} cy={-2} r={3} fill={HP.onion}/></g>;
};
/** The phone screen's content, in screen units. */
const PhoneScreen:React.FC<PhoneState>=({scan=1,lock=0,menu=0,lit=0,tap=0,tapAt,pay=0,hunt,huntScale=1})=>{
 const id=useUid('orscr');
 const S=PHONE.screen,U=PHONE_UI,C=U.code;
 const blur=hunt?3.4:(1-lock)*2.6;
 // the brackets: wide and breathing before the lock, closed on the code once locked; hunting never closes
 const pad=18,tx=C.x-pad,ty=C.y-pad,tw=C.s+2*pad;
 let bx=tx-40*(1-lock),by=ty-40*(1-lock),bw=tw+80*(1-lock);
 if(hunt){bw=tw*1.25*huntScale;bx=tx+tw/2-bw/2+hunt[0];by=ty+tw/2-bw/2+hunt[1];}
 const arm=bw*.2,bs=lock>.98&&!hunt?7:4.5;
 const corner=(x:number,y:number,dx:number,dy:number,k:number)=><path key={k} d={`M${f2(x)} ${f2(y+dy*arm)}V${f2(y)}H${f2(x+dx*arm)}`}
  stroke={HP.white} strokeWidth={bs} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={hunt?'10 7':undefined}/>;
 const m=smooth(menu),sheetY=S.h*(1-m);
 const pp=smooth(pay),payCx=lerp(U.pay[0],U.paid[0],pp),payW=lerp(120,52,pp),payR=lerp(23,26,pp);
 return <g data-part="phone-screen">
  <defs>
   <clipPath id={id+'c'}><rect x={0} y={0} width={S.w} height={S.h} rx={30}/></clipPath>
   <filter id={id+'b'} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={f2(Math.max(.01,blur))}/></filter>
   <linearGradient id={id+'v'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A4636"/><stop offset=".55" stopColor="#7C624B"/><stop offset="1" stopColor="#3E3027"/></linearGradient>
   <linearGradient id={id+'g'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0}/><stop offset=".46" stopColor="#FFFFFF" stopOpacity={0}/>
    <stop offset=".5" stopColor="#FFFFFF" stopOpacity={.08}/><stop offset=".56" stopColor="#FFFFFF" stopOpacity={0}/></linearGradient>
  </defs>
  <g clipPath={`url(#${id}c)`}>
   {scan>0&&m<1&&<g data-part="viewfinder" opacity={f2(scan)}>
    <rect x={0} y={0} width={S.w} height={S.h} fill={`url(#${id}v)`}/>
    <g filter={`url(#${id}b)`}>
     <ellipse cx={40} cy={470} rx={70} ry={30} fill="#E9E1D2" opacity={.5}/>
     <rect x={C.x-14} y={C.y-14} width={C.s+28} height={C.s+80} rx={10} fill={HP.white}/>
     <g transform={`translate(${C.x} ${C.y})`}><CodePattern s={C.s}/></g>
     <rect x={C.x-34} y={C.y+C.s+70} width={C.s+68} height={22} rx={6} fill={HP.wood}/>
    </g>
    {corner(bx,by,1,1,0)}{corner(bx+bw,by,-1,1,1)}{corner(bx,by+bw,1,-1,2)}{corner(bx+bw,by+bw,-1,-1,3)}
    {lock>0&&!hunt&&<rect x={tx} y={ty} width={tw} height={tw} rx={10} fill="none" stroke={HP.white} strokeWidth={2.4} opacity={f2(.85*lock)}/>}
    <circle cx={S.w/2} cy={S.h-46} r={22} fill="none" stroke={HP.white} strokeWidth={4} opacity={.8}/>
   </g>}
   {m>0&&<g data-part="menu" transform={`translate(0 ${f2(sheetY)})`}>
    <rect x={0} y={0} width={S.w} height={S.h} fill={HP.menu}/>
    <rect x={0} y={0} width={S.w} height={58} fill={HP.terracotta}/>
    <g transform="translate(30 30)"><path d="M-14 -2a14 11 0 0 0 28 0z" fill={HP.white}/><path d="M-8 -6q3 -9 0 -14M0 -6q3 -9 0 -14M8 -6q3 -9 0 -14" stroke={HP.white} strokeWidth={2} fill="none" opacity={.8}/></g>
    <rect x={60} y={24} width={120} height={12} rx={6} fill={HP.white} opacity={.85}/>
    {Array.from({length:5},(_,i)=>{const y=U.rowY+i*U.rowH,me=i===U.chowRow,L=me?lit:0;
     return <g key={i}>
      {L>0&&<rect x={6} y={y+5} width={S.w-12} height={U.rowH-10} rx={14} fill={HP.butter} opacity={f2(L)}/>}
      {L>0&&<rect x={6} y={y+5} width={7} height={U.rowH-10} rx={3.5} fill={HP.terracotta} opacity={f2(L)}/>}
      <g transform={`translate(38 ${y+U.rowH/2})`}><DishIcon k={i}/></g>
      {me?<text x={66} y={y+U.rowH/2+8} fontFamily={FONT.body} fontSize={f2(fit('Chow mein',23,126))} fontWeight={700} fill={HP.ink}>Chow mein</text>:
       <g><rect x={66} y={y+24} width={86+30*hash(i+3)} height={10} rx={5} fill={HP.bar}/><rect x={66} y={y+42} width={56+20*hash(i+9)} height={8} rx={4} fill={HP.line}/></g>}
      <rect x={200} y={y+U.rowH/2-13} width={52} height={26} rx={13} fill={L>.5?HP.terracotta:'#E7DECE'} stroke={HP.ink} strokeWidth={me?1.6:0} strokeOpacity={.4}/>
      <rect x={212} y={y+U.rowH/2-3} width={28} height={6} rx={3} fill={L>.5?HP.white:'#B6A98F'}/>
      {i<4&&<path d={`M18 ${y+U.rowH}H${S.w-18}`} stroke={HP.line} strokeWidth={1.4}/>}
     </g>;})}
    <rect x={0} y={462} width={S.w} height={S.h-462} fill={HP.menuShade}/>
    <g opacity={f2(1-.6*pp)}>
     <circle cx={U.mic[0]} cy={U.mic[1]} r={23} fill="#E2D6C3" stroke={HP.ink} strokeWidth={1.6}/>
     <rect x={U.mic[0]-5} y={U.mic[1]-12} width={10} height={16} rx={5} fill={HP.ink}/>
     <path d={`M${U.mic[0]-9} ${U.mic[1]}a9 9 0 0 0 18 0M${U.mic[0]} ${U.mic[1]+9}v5`} stroke={HP.ink} strokeWidth={2} fill="none"/>
     <text x={U.mic[0]+30} y={U.mic[1]+7} fontFamily={FONT.body} fontSize={17} fontWeight={700} fill={HP.ink} opacity={f2(1-pp)}>Talk</text>
    </g>
    <g data-part="pay-button">
     {pp<1&&<rect x={f2(payCx-payW/2)} y={U.pay[1]-payR} width={f2(payW)} height={f2(payR*2)} rx={f2(payR)} fill={pp>.5?HP.red:HP.ink} opacity={f2(1-smooth((pp-.6)/.3))}/>}
     {pp<.45&&<text x={payCx} y={U.pay[1]+8} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={700} fill={HP.white} opacity={f2(1-pp/.45)}>Pay</text>}
     {pp>.5&&<g transform={`translate(${U.paid[0]} ${U.paid[1]})`}><PaidMark r={26} check={smooth((pp-.55)/.4)}/></g>}
     {pp>.6&&<text x={U.paid[0]-36} y={U.paid[1]+8} textAnchor="end" fontFamily={FONT.body} fontSize={22} fontWeight={700} fill={HP.red} opacity={f2(smooth((pp-.6)/.3))}>Paid</text>}
    </g>
   </g>}
   {pp>.6&&(()=>{const g=smooth((pp-.6)/.4),c=[lerp(U.paid[0],U.paidBig[0],g),lerp(U.paid[1],U.paidBig[1],g)];
    return <g data-part="paid-confirmation" transform={`translate(${f2(c[0])} ${f2(c[1])}) scale(${f2(lerp(.3,1,g))})`}>
     <rect x={-108} y={-104} width={216} height={214} rx={24} fill={HP.white} stroke={HP.ink} strokeWidth={2.4} opacity={f2(g)}/>
     <g transform="translate(0 -20)"><PaidMark r={62} check={g}/></g>
     <text x={0} y={86} textAnchor="middle" fontFamily={FONT.body} fontSize={44} fontWeight={700} fill={HP.red} opacity={f2(g)}>Paid</text>
    </g>;})()}
   {tap>0&&tapAt&&<circle cx={tapAt[0]} cy={tapAt[1]} r={f2(10+34*tap)} fill={HP.white} opacity={f2(.45*(1-tap))}/>}
   <rect x={0} y={0} width={S.w} height={S.h} fill={`url(#${id}g)`}/>
  </g>
 </g>;
};
/** The phone, body and screen, about its centre. */
const Phone:React.FC<PhoneState>=(st)=>{
 const id=useUid('orph');
 const P=PHONE,S=P.screen;
 return <g data-part="phone">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={HP.bodyLit}/><stop offset=".55" stopColor={HP.body}/><stop offset="1" stopColor={HP.bodyShade}/></linearGradient></defs>
  <rect x={-P.w/2} y={-P.h/2} width={P.w} height={P.h} rx={46} fill={`url(#${id})`} stroke={HP.ink} strokeWidth={4}/>
  <rect x={-P.w/2-4} y={-170} width={6} height={58} rx={3} fill={HP.bodyDeep} stroke={HP.ink} strokeWidth={1.4}/>
  <rect x={P.w/2-2} y={-120} width={6} height={86} rx={3} fill={HP.bodyDeep} stroke={HP.ink} strokeWidth={1.4}/>
  <path d={`M${-P.w/2+14} ${-P.h/2+80}V${P.h/2-90}`} stroke={HP.white} strokeWidth={5} opacity={.7} strokeLinecap="round"/>
  <path d={`M${P.w/2-30} ${P.h/2-8}q18 -4 24 -22`} stroke={HP.bodyDeep} strokeWidth={3} fill="none" opacity={.8}/>
  <rect x={-P.w/2+10} y={-P.h/2+10} width={P.w-20} height={P.h-20} rx={38} fill={HP.bezel}/>
  <g transform={`translate(${S.x} ${S.y})`}><PhoneScreen {...st}/></g>
  {st.dim?<rect x={S.x} y={S.y} width={S.w} height={S.h} rx={30} fill={HP.bezel} opacity={f2(st.dim)}/>:null}
  <rect x={-28} y={-P.h/2+16} width={56} height={6} rx={3} fill="#3A4248"/>
 </g>;
};
/** A hand holding the phone from below, in phone units: `layer` back draws the palm and wrist behind the
 * phone, front the curled fingertips over its left edge and the thumb over its right edge. */
const PhoneHand:React.FC<{layer:'back'|'front';skin:string}>=({layer,skin})=>{
 const shade='#000000';
 if(layer==='back')return <g data-part="hand-back">
  <path d="M-150 120C-176 210 -150 300 -96 360C-70 420 -60 520 -50 700L-40 1900H190L170 700C176 560 196 430 186 320C180 250 168 190 150 150Z" fill={skin} stroke={HP.ink} strokeWidth={4}/>
  <path d="M-60 520C-40 470 40 450 120 470" stroke={shade} strokeWidth={3} opacity={.12} fill="none"/>
  <path d="M-58 640L-46 1960H196L178 640Z" fill="#3D5566" stroke={HP.ink} strokeWidth={4}/>
  <path d="M-52 656H176" stroke="#5E7A8C" strokeWidth={6}/>
 </g>;
 return <g data-part="hand-front">
  {[-40,30,100,170].map((y,i)=><g key={i}>
   <path d={`M-196 ${y+30}C-196 ${y} -170 ${y-8} -140 ${y-4}C-122 ${y-2} -118 ${y+22} -126 ${y+40}C-140 ${y+56} -180 ${y+58} -196 ${y+30}Z`} fill={skin} stroke={HP.ink} strokeWidth={3.4}/>
   <path d={`M-138 ${y+6}q8 10 2 24`} stroke="#FFFFFF" strokeWidth={2.4} opacity={.35} fill="none"/>
  </g>)}
  <path d="M196 230C206 170 184 110 160 70C148 52 132 58 132 78C132 110 140 150 150 190Z" fill={skin} stroke={HP.ink} strokeWidth={3.4}/>
  <path d="M140 84q-2 -12 10 -10" stroke="#FFFFFF" strokeWidth={2.4} opacity={.4} fill="none"/>
 </g>;
};
/** An index finger pointing up and left, its tip pad at the origin, the back of the hand trailing down and
 * right. `press` flattens the pad a little on contact. */
const Finger:React.FC<{skin:string;press?:number}>=({skin,press=0})=>{
 const k=1-.08*clamp(press);
 return <g data-part="finger" transform={`scale(1 ${f2(k)})`}>
  <path d="M330 400L760 1500H470L130 420Z" fill="#3D5566" stroke={HP.ink} strokeWidth={4}/>
  <path d="M120 150C150 130 230 150 290 210C340 260 360 330 340 420C320 450 160 450 130 420C110 340 96 260 120 150Z" fill={skin} stroke={HP.ink} strokeWidth={4}/>
  <path d="M150 260C190 236 236 246 262 280" stroke="#000" strokeWidth={3} opacity={.12} fill="none"/>
  <path d="M-16 6C-24 -10 -10 -24 6 -20C40 -10 120 70 156 130C170 156 150 178 126 170C90 150 10 60 -16 6Z" fill={skin} stroke={HP.ink} strokeWidth={4}/>
  <path d="M-6 -6C2 -14 14 -12 22 -4C30 6 26 18 16 20C6 20 -6 8 -6 -6Z" fill="#F4E3D6" opacity={.55} stroke={HP.ink} strokeWidth={1.6} strokeOpacity={.4}/>
  <path d="M70 70q12 -6 18 6M96 100q12 -6 18 6" stroke={HP.ink} strokeWidth={2} opacity={.35} fill="none"/>
 </g>;
};

// ---- the printer and its rail -------------------------------------------------------------------------------
/** Printer units: base centre at the origin. The slot is on the top face; a ticket rises out of it top first.
 * The rail's grip line sits exactly one ticket length above the slot, so a finished ticket reaches it. */
export const TICKET={w:170,len:160};
export const PRINTER={w:260,h:150,top:-190,slot:{x:7,y:-162,w:180},led:[92,-104] as Pt,
 rail:{y:-162-TICKET.len,x0:-206,x1:290,lean:-1.2,posts:[-196,276]}};
export const PRINTER_BOX:[number,number,number,number]=[-212,-352,296,4];
/** The rail's grip point is at the slot's x, so the leaning rail passes exactly through the ticket's top. */
export const railGrip=():Pt=>[PRINTER.slot.x,PRINTER.rail.y];
const Printer:React.FC<{led?:number;standby?:number}>=({led=0,standby=.5})=>{
 const id=useUid('orpr');
 const P=PRINTER,S=P.slot;
 return <g data-part="printer">
  <defs>
   <linearGradient id={id+'f'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={HP.charcoalLit}/><stop offset=".6" stopColor={HP.charcoal}/><stop offset="1" stopColor={HP.charcoalDeep}/></linearGradient>
   <linearGradient id={id+'t'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6A727A"/><stop offset="1" stopColor="#4A5258"/></linearGradient>
  </defs>
  <path d="M130 -150L160 -190V-36L130 0Z" fill={HP.charcoalDeep} stroke={HP.ink} strokeWidth={3}/>
  <path d="M-130 -150L-100 -190H160L130 -150Z" fill={`url(#${id}t)`} stroke={HP.ink} strokeWidth={3}/>
  <path d="M-60 -182q60 -26 150 0" stroke="#7E878E" strokeWidth={10} fill="none" opacity={.7} strokeLinecap="round"/>
  <path d={`M${S.x-S.w/2} ${S.y+4}H${S.x+S.w/2}L${S.x+S.w/2+5} ${S.y-4}H${S.x-S.w/2+5}Z`} fill="#0D0F11"/>
  <path d={`M${S.x-S.w/2+4} ${S.y+6}H${S.x+S.w/2}`} stroke="#9AA3A8" strokeWidth={2}/>
  {Array.from({length:18},(_,i)=><path key={i} d={`M${S.x-S.w/2+8+i*10} ${S.y+6}l4 3l4 -3`} stroke="#8D969B" strokeWidth={1.2} fill="none"/>)}
  <rect x={-130} y={-150} width={260} height={150} rx={18} fill={`url(#${id}f)`} stroke={HP.ink} strokeWidth={3.4}/>
  <path d="M-118 -136H118" stroke="#6C747A" strokeWidth={3} opacity={.7}/>
  <rect x={-108} y={-118} width={98} height={56} rx={8} fill="#E6DFCF" opacity={.85} stroke={HP.ink} strokeWidth={2}/>
  <rect x={-98} y={-104} width={60} height={8} rx={4} fill="#B4A88F"/><rect x={-98} y={-88} width={40} height={7} rx={3.5} fill="#C8BDA5"/>
  <path d="M-30 -70l18 6" stroke="#B9AD95" strokeWidth={3} opacity={.7}/>
  {Array.from({length:6},(_,i)=><rect key={i} x={-104+i*16} y={-40} width={8} height={24} rx={4} fill="#1E2226"/>)}
  <circle cx={P.led[0]} cy={P.led[1]} r={16} fill="#14171A" stroke={HP.ink} strokeWidth={2.4}/>
  <circle cx={P.led[0]} cy={P.led[1]} r={11} fill={led>.02?HP.red:'#C9A447'} opacity={f2(led>.02?.35+.65*led:.25+.5*standby)}/>
  {led>.02&&<circle cx={P.led[0]} cy={P.led[1]} r={f2(18+16*led)} fill={HP.red} opacity={f2(.25*led)}/>}
  {led>.02&&<circle cx={P.led[0]-3} cy={P.led[1]-3} r={3.5} fill="#FFD9CC" opacity={f2(led)}/>}
  <rect x={70} y={-70} width={44} height={22} rx={8} fill="#3C434A" stroke={HP.ink} strokeWidth={2}/>
  <path d="M-126 -10q20 4 40 0" stroke="#5B636A" strokeWidth={3} opacity={.6} fill="none"/>
  <path d="M148 -60q30 20 30 70" stroke="#1E2226" strokeWidth={8} fill="none" strokeLinecap="round"/>
  <path d="M-120 -146l22 -2" stroke="#9AA2A8" strokeWidth={3} opacity={.6} strokeLinecap="round"/>
 </g>;
};
/** The ticket rail on its two posts, in printer units. A bearing sits at the grip point; `roll` turns it. */
const Rail:React.FC<{roll?:number}>=({roll=0})=>{
 const id=useUid('orrl');
 const R=PRINTER.rail,g=railGrip();
 const bearings=[-150,-80,g[0],90,170,240];
 return <g data-part="rail">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={HP.steelLit}/><stop offset=".5" stopColor={HP.steel}/><stop offset="1" stopColor={HP.steelDeep}/></linearGradient></defs>
  {R.posts.map((x,k)=><g key={k}>
   <rect x={x-7} y={R.y+6} width={14} height={-R.y-6} fill={HP.steelDeep} stroke={HP.ink} strokeWidth={2.4}/>
   <path d={`M${x-3} ${R.y+14}V-6`} stroke={HP.steelLit} strokeWidth={2.4} opacity={.6}/>
   <rect x={x-18} y={-8} width={36} height={8} rx={2} fill={HP.steelDark} stroke={HP.ink} strokeWidth={2}/>
  </g>)}
  <g transform={`rotate(${R.lean} ${g[0]} ${g[1]})`}>
   <rect x={R.x0} y={R.y-18} width={R.x1-R.x0} height={26} rx={5} fill={`url(#${id})`} stroke={HP.ink} strokeWidth={3}/>
   <path d={`M${R.x0+6} ${R.y-2}H${R.x1-6}`} stroke={HP.steelDark} strokeWidth={4}/>
   {bearings.map((x,k)=><g key={k} transform={`translate(${x} ${R.y-2}) rotate(${f2(x===g[0]?roll*200:0)})`}>
    <circle r={7} fill={HP.steelLit} stroke={HP.ink} strokeWidth={1.8}/><path d="M-3 -3l3 1" stroke="#FFFFFF" strokeWidth={2}/></g>)}
   <path d={`M${R.x0+30} ${R.y-12}h60`} stroke="#FFFFFF" strokeWidth={3} opacity={.5} strokeLinecap="round"/>
   <path d={`M${R.x1-50} ${R.y-14}l14 6`} stroke={HP.steelDark} strokeWidth={2.4} opacity={.6}/>
  </g>
 </g>;
};
/** A kitchen ticket, its top edge at y 0, `len` of it out of the slot. The thermal print is anchored to the
 * paper's top edge, so the first printed lines lead out of the slot. `cut` draws the torn lower edge. */
/** Type sizes fitted to their space by the engine's measured width estimate, which errs long. */
const fit=(text:string,max:number,room:number)=>Math.min(max,room/widthOf(text,1,true));
const Ticket:React.FC<{len:number;cut?:number}>=({len,cut=0})=>{
 const id=useUid('ortk');
 const W=TICKET.w,L=Math.max(0,len);
 if(L<=.5)return null;
 const bottom=cut>0?Array.from({length:10},(_,i)=>`L${f2(W-(i+.5)*W/10)} ${f2(L+5*clamp(cut))}L${f2(W-(i+1)*W/10)} ${f2(L)}`).join(''):`L0 ${f2(L)}`;
 return <g data-part="ticket">
  <defs><clipPath id={id}><rect x={0} y={0} width={W} height={L}/></clipPath></defs>
  <path d={`M0 0H${W}V${f2(L)}${bottom}Z`} fill={HP.paper} stroke={HP.ink} strokeWidth={2.4}/>
  <g clipPath={`url(#${id})`}>
   <rect x={0} y={0} width={10} height={L} fill={HP.paperShade} opacity={.6}/>
   <g transform="translate(26 26)"><PaidMark r={15}/></g>
   <text x={48} y={34} fontFamily={FONT.body} fontSize={f2(fit('Chow mein',21,W-58))} fontWeight={700} fill={HP.thermal}>Chow mein</text>
   <rect x={14} y={58} width={96} height={8} rx={4} fill="#8F8A80"/>
   <rect x={14} y={76} width={64} height={8} rx={4} fill="#A9A397"/>
   <path d={`M10 102H${W-10}`} stroke="#8F8A80" strokeWidth={2} strokeDasharray="6 5"/>
   <rect x={14} y={118} width={110} height={8} rx={4} fill="#A9A397"/>
   <rect x={14} y={136} width={80} height={8} rx={4} fill="#B8B2A6"/>
  </g>
 </g>;
};

// ---- the wok on its burner -----------------------------------------------------------------------------------
/** Wok units: the burner grate's top at y 0 on the range, centre x 0. The rim ellipse centres at RIM. */
export const WOK={rim:[0,-122] as Pt,rx:170,ry:28,bottom:-34,handle:[-330,-160] as Pt,range:{w:420,h:150}};
export const WOK_BOX:[number,number,number,number]=[-340,-420,216,152];
const flameTongue=(x:number,base:number,h:number,w:number,bend:number)=>
 `M${f2(x-w)} ${f2(base)}C${f2(x-w*.9)} ${f2(base-h*.45)} ${f2(x+bend-w*.2)} ${f2(base-h*.7)} ${f2(x+bend)} ${f2(base-h)}C${f2(x+bend+w*.3)} ${f2(base-h*.62)} ${f2(x+w)} ${f2(base-h*.4)} ${f2(x+w)} ${f2(base)}Z`;
/** The wok ring the pan rests in: its centre is the pan's rocking pivot, so a tilted pan never leaves it. */
export const WOK_RING={c:[0,-50] as Pt,rx:84,ry:9};
/** The wok on its burner. `flame` 0 draws no flame at all (the burner is off); `food` 0 is an empty pan and 1
 * a loaded one; the pan group (bowl, handle, food and the cook's hand) rocks by `tilt` degrees about the ring;
 * `toss` lifts the noodles off the pan, which the episode drives from the pan's own shake. */
const Wok:React.FC<{flame:number;food:number;toss:number;tilt:number;hand:number;t:number;range?:boolean;skin?:string}>=
 ({flame,food,toss,tilt,hand,t,range=true,skin=HP.skin[0]})=>{
 const id=useUid('orwk');
 const W=WOK,[rx0,ry0]=W.rim,fl=clamp(flame),fd=clamp(food),R=WOK_RING;
 const tongues=fl<=.001?[]:Array.from({length:9},(_,i)=>{
  const x=-120+i*30,fk=Math.sin(t*13+i*1.9)*.5+Math.sin(t*7.3+i*.7)*.5;
  const high=150+70*hash(i+4)+40*fk*fl,outer=Math.abs(x)>70;
  return {x:x+(outer?Math.sign(x)*30*fl:0),h:(outer?high*1.15:high*.55)*fl,w:lerp(6,24,fl),bend:(outer?Math.sign(x)*(18+20*fl):0)+8*fk};
 });
 const strands=Math.round(12*fd),bits=Math.round(8*fd);
 return <g data-part="wok">
  <defs>
   <radialGradient id={id+'g'} cx="0.5" cy="0.8" r="0.6"><stop offset="0" stopColor={HP.flameYellow} stopOpacity={.75}/><stop offset="1" stopColor={HP.flameOrange} stopOpacity={0}/></radialGradient>
   <linearGradient id={id+'w'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={HP.wokLit}/><stop offset=".5" stopColor={HP.wok}/><stop offset="1" stopColor="#171310"/></linearGradient>
   <linearGradient id={id+'r'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={HP.steelLit}/><stop offset="1" stopColor={HP.steelDeep}/></linearGradient>
  </defs>
  {range&&<g data-part="range">
   <rect x={-W.range.w/2} y={0} width={W.range.w} height={W.range.h} rx={6} fill={`url(#${id}r)`} stroke={HP.ink} strokeWidth={3}/>
   <path d={`M${-W.range.w/2} 14H${W.range.w/2}`} stroke={HP.steelDark} strokeWidth={3}/>
   {[-120,0,120].map((x,k)=><g key={k} transform={`translate(${x} 82)`}><circle r={22} fill={HP.charcoal} stroke={HP.ink} strokeWidth={2.4}/>
    <rect x={-4} y={-20} width={8} height={18} rx={3} fill="#9AA2A6" transform={`rotate(${k===1?f2(-90+130*fl):k*25-10})`}/></g>)}
   <path d={`M${W.range.w/2-60} 40q10 30 4 70`} stroke="#8E6A4A" strokeWidth={3} opacity={.5} fill="none"/>
  </g>}
  <path d="M-150 0H150M-120 -8L-100 0M120 -8L100 0M-40 -8V0M40 -8V0" stroke={HP.charcoalDeep} strokeWidth={8} strokeLinecap="round"/>
  <ellipse cx={0} cy={-4} rx={80} ry={10} fill="#1B1E21"/>
  {[-56,0,56].map((x,k)=><circle key={k} cx={x} cy={-8} r={3} fill="#3A4045"/>)}
  {fl>0&&<ellipse cx={0} cy={-120} rx={f2(240*fl+40)} ry={f2(180*fl+20)} fill={`url(#${id}g)`} opacity={f2(.85*fl)}/>}
  {tongues.map((q,i)=><path key={'b'+i} d={flameTongue(q.x,-6,q.h,q.w,q.bend)} fill={fl>.15?HP.flameOrange:HP.flameBlue} opacity={f2(.55+.35*fl)}/>)}
  {tongues.map((q,i)=><path key={'c'+i} d={flameTongue(q.x,-6,q.h*.62,q.w*.55,q.bend*.6)} fill={fl>.15?(i%3?HP.flameYellow:HP.flameRed):HP.flameCore} opacity={f2(.8*Math.min(1,fl*4))}/>)}
  <path d={`M${-R.rx} ${R.c[1]}L-110 -8M${R.rx} ${R.c[1]}L110 -8M-20 ${R.c[1]+R.ry}L-40 -8`} stroke={HP.steelDark} strokeWidth={7} strokeLinecap="round"/>
  <path d={`M${-R.rx} ${R.c[1]}A${R.rx} ${R.ry} 0 0 1 ${R.rx} ${R.c[1]}`} stroke={HP.steelDark} strokeWidth={7} fill="none"/>
  <g data-part="pan" transform={`rotate(${f2(tilt)} ${R.c[0]} ${R.c[1]})`}>
   <path d={`M${rx0-W.rx} ${ry0}C${rx0-W.rx+10} ${ry0+60} ${-60} ${W.bottom} ${0} ${W.bottom}C${60} ${W.bottom} ${rx0+W.rx-10} ${ry0+60} ${rx0+W.rx} ${ry0}Z`} fill={`url(#${id}w)`} stroke={HP.ink} strokeWidth={3.4}/>
   <path d={`M${rx0-W.rx+26} ${ry0+22}C${-110} ${ry0+64} ${-60} ${W.bottom+12} ${-10} ${W.bottom+10}`} stroke="#8A7566" strokeWidth={4} fill="none" opacity={.5}/>
   {fl>0&&<path d={`M${rx0+W.rx-12} ${ry0+14}C${120} ${ry0+60} ${60} ${W.bottom+6} ${0} ${W.bottom+2}`} stroke={HP.flameOrange} strokeWidth={6} fill="none" opacity={f2(.6*fl)}/>}
   <path d={`M${rx0-W.rx+4} ${ry0-6}L${W.handle[0]+40} ${W.handle[1]+8}`} stroke={HP.steelDark} strokeWidth={12} strokeLinecap="round"/>
   <path d={`M${W.handle[0]+60} ${W.handle[1]+6}L${W.handle[0]} ${W.handle[1]-4}`} stroke={HP.wood} strokeWidth={24} strokeLinecap="round"/>
   <path d={`M${W.handle[0]+56} ${W.handle[1]-2}L${W.handle[0]+8} ${W.handle[1]-10}`} stroke={HP.woodLit} strokeWidth={5} strokeLinecap="round" opacity={.8}/>
   <path d={`M${rx0+W.rx-6} ${ry0+4}q36 -4 40 18q-4 18 -36 12`} stroke={HP.steelDark} strokeWidth={8} fill="none"/>
   <ellipse cx={rx0} cy={ry0} rx={W.rx} ry={W.ry} fill="#3B322C" stroke={HP.ink} strokeWidth={3.4}/>
   <ellipse cx={rx0} cy={ry0+2} rx={W.rx-12} ry={W.ry-6} fill="#241E1A"/>
   {fd>0&&<g data-part="noodles">
    <ellipse cx={0} cy={ry0+4} rx={f2(110*fd)} ry={f2(14*fd)} fill={HP.noodleDeep} opacity={.55}/>
    {Array.from({length:strands},(_,i)=>{const x=-120+i*21,y=ry0+4+6*Math.sin(i*1.7),lift=toss*(40+30*hash(i+2))*(i%2?1:.7);
     return <path key={i} d={`M${f2(x)} ${f2(y-lift*.4)}q14 ${f2(-12-lift)} 28 ${f2(-2-lift*.2)}t26 6`} stroke={i%3?HP.noodle:HP.noodleDeep} strokeWidth={6} fill="none" strokeLinecap="round"/>;})}
    {Array.from({length:bits},(_,i)=><rect key={i} x={f2(-100+i*27)} y={f2(ry0-4-toss*24*hash(i+11))} width={9} height={5} rx={2} fill={i%2?HP.onion:HP.carrot} transform={`rotate(${f2(40*hash(i))} ${f2(-96+i*27)} ${ry0})`}/>)}
   </g>}
   <path d={`M${rx0-W.rx+20} ${ry0-10}A${W.rx} ${W.ry} 0 0 1 ${rx0-20} ${ry0-W.ry+2}`} stroke="#9C8778" strokeWidth={4} fill="none" opacity={.7}/>
   {hand>0&&<g data-part="cook-hand" opacity={f2(clamp(hand))}>
    <path d={`M${W.handle[0]+26} ${W.handle[1]+6}L${W.handle[0]-220} ${W.handle[1]+520}L${W.handle[0]-60} ${W.handle[1]+560}L${W.handle[0]+70} ${W.handle[1]+40}Z`} fill="#F1EEE6" stroke={HP.ink} strokeWidth={3.4}/>
    <path d={`M${W.handle[0]+10} ${W.handle[1]+80}L${W.handle[0]-120} ${W.handle[1]+360}`} stroke="#CFC8BA" strokeWidth={4} opacity={.8}/>
    <path d={`M${W.handle[0]-4} ${W.handle[1]-26}C${W.handle[0]+30} ${W.handle[1]-34} ${W.handle[0]+66} ${W.handle[1]-18} ${W.handle[0]+70} ${W.handle[1]+6}C${W.handle[0]+72} ${W.handle[1]+34} ${W.handle[0]+30} ${W.handle[1]+46} ${W.handle[0]} ${W.handle[1]+36}C${W.handle[0]-20} ${W.handle[1]+20} ${W.handle[0]-24} ${W.handle[1]-14} ${W.handle[0]-4} ${W.handle[1]-26}Z`} fill={skin} stroke={HP.ink} strokeWidth={3.4}/>
    {[0,1,2].map(k=><path key={k} d={`M${W.handle[0]+14+k*16} ${W.handle[1]-24}q4 14 -2 30`} stroke={HP.ink} strokeWidth={2} opacity={.45} fill="none"/>)}
   </g>}
  </g>
  <path d={`M${-R.rx} ${R.c[1]}A${R.rx} ${R.ry} 0 0 0 ${R.rx} ${R.c[1]}`} stroke={HP.steelDark} strokeWidth={7} fill="none"/>
  {fl>0&&fd>0&&[0,1,2].map(i=>{const ph=(t*.9+i*.33)%1;return <path key={'s'+i} d={`M${-50+i*50} ${f2(ry0-30-ph*150)}q-14 -26 0 -52t0 -52`} stroke="#FFFFFF" strokeWidth={6} fill="none"
   opacity={f2(.35*fl*fd*Math.sin(Math.PI*ph))} strokeLinecap="round"/>;})}
 </g>;
};
/** The cook's forearm and hand holding a steel bowl of raw noodles and cut vegetables, the bowl's pouring lip
 * at the origin. `tilt` (degrees) lifts the bowl's far side about the lip; `left` 0 to 1 is what is left in it. */
const CookBowl:React.FC<{tilt:number;left:number;skin:string}>=({tilt,left,skin})=>{
 const id=useUid('orcb');
 const lf=clamp(left);
 return <g data-part="cook-bowl" transform={`rotate(${f2(tilt)})`}>
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={HP.steelLit}/><stop offset="1" stopColor={HP.steelDeep}/></linearGradient></defs>
  <path d="M-150 -6L-420 -330L-300 -400L-110 -40Z" fill="#F1EEE6" stroke={HP.ink} strokeWidth={3.4}/>
  <path d="M-170 -60L-330 -270" stroke="#CFC8BA" strokeWidth={4} opacity={.8}/>
  <path d="M-140 0C-140 60 -100 86 -70 86C-40 86 0 60 0 0Z" fill={`url(#${id})`} stroke={HP.ink} strokeWidth={3.4}/>
  {lf>0&&<g><path d={`M-128 0C${f2(-110)} ${f2(-26*lf)} ${f2(-30)} ${f2(-30*lf)} -12 0Z`} fill="#EBDDB4" stroke={HP.ink} strokeWidth={2}/>
   {Array.from({length:5},(_,i)=><path key={i} d={`M${-118+i*20} ${f2(-6-10*lf)}q8 -8 16 0`} stroke="#D4BE86" strokeWidth={4} fill="none" strokeLinecap="round"/>)}
   <rect x={-90} y={f2(-16*lf)} width={10} height={6} rx={2} fill={HP.onion}/><rect x={-56} y={f2(-20*lf)} width={10} height={6} rx={2} fill={HP.carrot}/></g>}
  <ellipse cx={-70} cy={0} rx={70} ry={14} fill="none" stroke={HP.ink} strokeWidth={3.4}/>
  <path d="M-136 -4A70 14 0 0 1 -40 -12" stroke="#FFFFFF" strokeWidth={3} opacity={.6} fill="none"/>
  <path d="M-150 -20C-176 -30 -186 10 -170 30C-160 46 -136 40 -130 20C-126 6 -134 -14 -150 -20Z" fill={skin} stroke={HP.ink} strokeWidth={3.2}/>
  <path d="M-146 -10q10 6 8 22" stroke={HP.ink} strokeWidth={2} opacity={.4} fill="none"/>
 </g>;
};
const WokTop:React.FC<{flame:number;t:number}>=({flame,t})=>{
 const fl=clamp(flame);
 return <g data-part="wok-top">
  <circle r={f2(150+40*fl)} fill={fl>.15?HP.flameOrange:HP.flameBlue} opacity={f2(.25+.25*fl)}/>
  <path d="M-150 0L-300 -30" stroke={HP.wood} strokeWidth={24} strokeLinecap="round"/>
  <circle r={140} fill="#3B322C" stroke={HP.ink} strokeWidth={4}/>
  <circle r={118} fill="#241E1A"/>
  {Array.from({length:14},(_,i)=>{const a=i*.45+t*.2*fl,r=30+60*hash(i+3);return <path key={i} d={`M${f2(r*Math.cos(a))} ${f2(r*Math.sin(a))}q14 -10 28 0`} stroke={i%3?HP.noodle:HP.noodleDeep} strokeWidth={7} fill="none" strokeLinecap="round"/>;})}
  <path d="M-100 -70A124 124 0 0 1 40 -116" stroke="#9C8778" strokeWidth={5} fill="none" opacity={.6}/>
 </g>;
};

// ---- the tip jar -------------------------------------------------------------------------------------------
/** Jar units: base centre at the origin. MOUTH is the opening's ellipse; NECK where a tag's loop sits. */
export const JAR={mouth:{y:-262,rx:70,ry:12},neck:{y:-240,rx:70},body:{rx:86,top:-212,bottom:-22},tagAt:[[44,-236],[-46,-236]] as Pt[],fillMax:150};
export const JAR_BOX:[number,number,number,number]=[-92,-276,92,6];
/** The pile's surface height above the jar's inner bottom for a fill 0 to 1 (jar units, positive up). */
export const pileTop=(fill:number)=>JAR.body.bottom-(14+JAR.fillMax*clamp(fill));
export const Coin:React.FC<{r:number;tone?:'gold'|'silver';tilt?:number}>=({r,tone='gold',tilt=.5})=>{
 const lit=tone==='gold'?HP.coinGoldLit:HP.coinSilverLit,mid=tone==='gold'?HP.coinGold:HP.coinSilver,deep=tone==='gold'?HP.coinGoldDeep:HP.coinSilverDeep;
 const ry=r*(.3+.7*clamp(tilt));
 return <g data-part="coin">
  <ellipse cx={0} cy={r*.12} rx={r} ry={ry} fill={deep} stroke={HP.ink} strokeWidth={Math.max(1,r*.09)}/>
  <ellipse cx={0} cy={0} rx={r} ry={ry} fill={mid} stroke={HP.ink} strokeWidth={Math.max(1,r*.09)}/>
  <ellipse cx={0} cy={0} rx={r*.7} ry={ry*.7} fill="none" stroke={lit} strokeWidth={Math.max(1,r*.12)}/>
  <ellipse cx={-r*.3} cy={-ry*.3} rx={r*.25} ry={ry*.18} fill={lit} opacity={.8}/>
 </g>;
};
export const Bill:React.FC<{w:number;fold?:number}>=({w,fold=.5})=>{
 const h=w*.46,f=clamp(fold);
 return <g data-part="bill">
  <path d={`M${-w/2} ${-h/2}H${w/2-w*.1*f}L${w/2} ${h/2}H${-w/2+w*.1*f}Z`} fill={HP.bill} stroke={HP.ink} strokeWidth={Math.max(1,w*.03)}/>
  <rect x={-w/2+w*.1} y={-h/2+h*.18} width={w*.8-w*.1*f} height={h*.64} rx={h*.1} fill="none" stroke={HP.billDeep} strokeWidth={Math.max(1,w*.025)}/>
  <ellipse cx={0} cy={0} rx={w*.12} ry={h*.22} fill={HP.billLit} opacity={.9}/>
  <path d={`M${f2(-w*.05)} ${-h/2}L${f2(w*.05)} ${h/2}`} stroke={HP.billDeep} strokeWidth={Math.max(1,w*.02)} opacity={.6}/>
 </g>;
};
/** The pile inside the jar for a fill 0 to 1, clipped by the episode to the jar's inner wall. */
const JarPile:React.FC<{fill:number}>=({fill})=>{
 const top=pileTop(fill),rows:React.ReactNode[]=[];
 if(fill<=.001)return null;
 let k=0;
 for(let y=JAR.body.bottom-8;y>top+4;y-=11){
  for(let x=-78;x<80;x+=19){
   const j=hash(k*7+3),r=11+4*hash(k+5),xx=x+8*(j-.5)+(Math.floor((JAR.body.bottom-y)/11)%2?9:0);
   rows.push(hash(k+13)>.82?<g key={k} transform={`translate(${f2(xx)} ${f2(y)}) rotate(${f2(40*(j-.5))})`}><Bill w={44}/></g>:
    <g key={k} transform={`translate(${f2(xx)} ${f2(y)})`}><Coin r={r} tone={hash(k+21)>.45?'gold':'silver'} tilt={.25+.3*j}/></g>);
   k++;
  }
 }
 return <g data-part="jar-pile">
  <path d={`M-90 ${f2(top+10)}Q0 ${f2(top-12)} 90 ${f2(top+10)}V${JAR.body.bottom+10}H-90Z`} fill="#8C7A55" opacity={.35}/>
  {rows}
 </g>;
};
export const jarInnerPath=()=>{const B=JAR.body,N=JAR.neck;
 return `M${-B.rx+8} ${B.bottom-4}V${B.top+10}C${-B.rx+8} ${B.top-12} ${-N.rx+6} ${N.y+10} ${-N.rx+6} ${N.y}V${JAR.mouth.y}H${N.rx-6}V${N.y}C${N.rx-6} ${N.y+10} ${B.rx-8} ${B.top-12} ${B.rx-8} ${B.top+10}V${B.bottom-4}Q${B.rx-8} ${B.bottom+8} ${B.rx-20} ${B.bottom+8}H${-B.rx+20}Q${-B.rx+8} ${B.bottom+8} ${-B.rx+8} ${B.bottom-4}Z`;};
/** The tip jar. `layer` back draws the far glass and the pile, front the near glass, rim and highlights;
 * the episode draws falling coins between the two so they pass behind the near wall. */
const Jar:React.FC<{fill:number;layer?:'back'|'front'|'all';children?:React.ReactNode}>=({fill,layer='all',children})=>{
 const id=useUid('orjar');
 const B=JAR.body,N=JAR.neck,M=JAR.mouth;
 const outer=`M${-B.rx} ${B.bottom}V${B.top+8}C${-B.rx} ${B.top-16} ${-N.rx} ${N.y+12} ${-N.rx} ${N.y}V${M.y}H${N.rx}V${N.y}C${N.rx} ${N.y+12} ${B.rx} ${B.top-16} ${B.rx} ${B.top+8}V${B.bottom}Q${B.rx} ${B.bottom+20} ${B.rx-22} ${B.bottom+20}H${-B.rx+22}Q${-B.rx} ${B.bottom+20} ${-B.rx} ${B.bottom}Z`;
 const back=<g>
  <defs><clipPath id={id+'c'}><path d={jarInnerPath()}/></clipPath></defs>
  <path d={outer} fill={HP.glass} opacity={.28}/>
  <ellipse cx={0} cy={M.y} rx={M.rx-4} ry={M.ry-3} fill="#5D6A6A" opacity={.35}/>
  <g clipPath={`url(#${id}c)`}><JarPile fill={fill}/>{children}</g>
 </g>;
 const front=<g>
  <path d={outer} fill="none" stroke={HP.ink} strokeWidth={3.4} strokeOpacity={.75}/>
  <path d={`M${-B.rx+14} ${B.bottom-10}V${B.top+18}C${-B.rx+14} ${B.top} ${-N.rx+16} ${N.y+16} ${-N.rx+16} ${N.y+4}`} stroke="#FFFFFF" strokeWidth={9} fill="none" opacity={.55} strokeLinecap="round"/>
  <path d={`M${B.rx-20} ${B.bottom-30}V${B.top+40}`} stroke="#FFFFFF" strokeWidth={5} opacity={.35} strokeLinecap="round"/>
  <path d={`M${-B.rx+6} ${B.bottom+6}Q0 ${B.bottom+26} ${B.rx-6} ${B.bottom+6}`} stroke="#FFFFFF" strokeWidth={3} opacity={.4} fill="none"/>
  {[0,1,2].map(i=><path key={i} d={`M${-N.rx} ${M.y+4+i*6}Q0 ${M.y+12+i*6} ${N.rx} ${M.y+4+i*6}`} stroke={HP.ink} strokeWidth={2} opacity={.35} fill="none"/>)}
  <ellipse cx={0} cy={M.y} rx={M.rx} ry={M.ry} fill="none" stroke={HP.ink} strokeWidth={3.4} strokeOpacity={.8}/>
  <path d={`M${-M.rx+10} ${M.y-4}A${M.rx} ${M.ry} 0 0 1 ${M.rx-30} ${M.y-M.ry+2}`} stroke="#FFFFFF" strokeWidth={3} opacity={.7} fill="none"/>
  <path d={`M${B.rx-30} ${B.top+60}l10 -6`} stroke={HP.ink} strokeWidth={2} opacity={.3}/>
 </g>;
 return <g data-part="jar">{layer!=='front'&&back}{layer!=='back'&&front}</g>;
};
const JarTop:React.FC<{fill:number}>=({fill})=>{
 const f=clamp(fill);
 return <g data-part="jar-top">
  <circle r={88} fill={HP.glass} opacity={.3} stroke={HP.ink} strokeWidth={2.4} strokeOpacity={.4}/>
  <circle r={70} fill="#55625F" opacity={.35} stroke={HP.ink} strokeWidth={3.4}/>
  {Array.from({length:Math.round(4+14*f)},(_,i)=>{const a=i*2.4,r=8+50*hash(i+2);
   return <g key={i} transform={`translate(${f2(r*Math.cos(a))} ${f2(r*Math.sin(a))})`}>{hash(i+9)>.8?<Bill w={40}/>:<Coin r={12} tone={hash(i+4)>.5?'gold':'silver'} tilt={1}/>}</g>;})}
  <path d="M-52 -40A66 66 0 0 1 20 -66" stroke="#FFFFFF" strokeWidth={5} fill="none" opacity={.6}/>
 </g>;
};
/** The printer from above: its slot's centre and its lamp, in printer-top units. */
export const PRINTER_TOP={slot:[6,26] as Pt,led:[98,56] as Pt};
const PrinterTop:React.FC<{led?:number}>=({led=0})=><g data-part="printer-top">
 <rect x={-130} y={-80} width={260} height={160} rx={18} fill={HP.charcoal} stroke={HP.ink} strokeWidth={3.4}/>
 <rect x={-100} y={-62} width={200} height={70} rx={30} fill="#596168"/>
 <rect x={-90} y={18} width={192} height={16} rx={3} fill="#0D0F11" stroke={HP.steelDeep} strokeWidth={2}/>
 {Array.from({length:12},(_,i)=><path key={i} d={`M${-84+i*16} 34l5 4l5 -4`} stroke="#8D969B" strokeWidth={1.4} fill="none"/>)}
 <circle cx={98} cy={56} r={15} fill="#14171A" stroke={HP.ink} strokeWidth={2.4}/>
 <circle cx={98} cy={56} r={10} fill={led>.02?HP.red:'#C9A447'} opacity={f2(led>.02?.4+.6*led:.6)}/>
 {led>.02&&<circle cx={98} cy={56} r={f2(18+16*led)} fill={HP.red} opacity={f2(.25*led)}/>}
</g>;

type Part=
 ({part:'phone'}&PhoneState)|{part:'handBack';skin:string}|{part:'handFront';skin:string}|{part:'finger';skin:string;press?:number}|
 {part:'codeStand'}|{part:'codeStandTop'}|{part:'printer';led?:number;standby?:number}|{part:'rail';roll?:number}|{part:'ticket';len:number;cut?:number}|
 {part:'wok';flame:number;food:number;toss:number;tilt:number;hand:number;t:number;range?:boolean;skin?:string}|{part:'cookBowl';tilt:number;left:number;skin:string}|{part:'wokTop';flame:number;t:number}|
 {part:'jar';fill:number;layer?:'back'|'front'|'all';children?:React.ReactNode}|{part:'jarTop';fill:number}|{part:'printerTop';led?:number}|
 {part:'paidMark';r:number;check?:number;ring?:number}|{part:'coin';r:number;tone?:'gold'|'silver';tilt?:number}|{part:'bill';w:number;fold?:number};
export const OrderRigHero:React.FC<Part>=(p)=>{
 switch(p.part){
 case 'phone':{const {part:_part,...st}=p;return <Phone {...st}/>;}
 case 'handBack':return <PhoneHand layer="back" skin={p.skin}/>;
 case 'handFront':return <PhoneHand layer="front" skin={p.skin}/>;
 case 'finger':return <Finger skin={p.skin} press={p.press}/>;
 case 'codeStand':return <CodeStand/>;
 case 'codeStandTop':return <CodeStandTop/>;
 case 'printer':return <Printer led={p.led} standby={p.standby}/>;
 case 'rail':return <Rail roll={p.roll}/>;
 case 'ticket':return <Ticket len={p.len} cut={p.cut}/>;
 case 'wok':return <Wok flame={p.flame} food={p.food} toss={p.toss} tilt={p.tilt} hand={p.hand} t={p.t} range={p.range} skin={p.skin}/>;
 case 'cookBowl':return <CookBowl tilt={p.tilt} left={p.left} skin={p.skin}/>;
 case 'wokTop':return <WokTop flame={p.flame} t={p.t}/>;
 case 'jar':return <Jar fill={p.fill} layer={p.layer}>{p.children}</Jar>;
 case 'jarTop':return <JarTop fill={p.fill}/>;
 case 'printerTop':return <PrinterTop led={p.led}/>;
 case 'paidMark':return <PaidMark r={p.r} check={p.check} ring={p.ring}/>;
 case 'coin':return <Coin r={p.r} tone={p.tone} tilt={p.tilt}/>;
 case 'bill':return <Bill w={p.w} fold={p.fold}/>;
 }
};
