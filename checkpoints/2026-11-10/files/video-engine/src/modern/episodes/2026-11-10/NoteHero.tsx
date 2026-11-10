import React from 'react';
import {FONT,widthOf} from '../../../lib/type';

/**
 * NoteHero, the fresh authored hero group for the 2026-11-10 edition (note-check-v1).
 *
 * ONE generic wall note screen on a worn swing arm, drawn new for this story. It is the object the
 * opening question is about and it changes state across the whole film:
 *  - a ribbon of small spoken word marks rises off the exam table and runs into the page, where it
 *    becomes one draft line with a hand-set cursor (s1);
 *  - a crooked burnt orange check slot outlines beside the line and the record tray under the screen
 *    slides open, empty (s1);
 *  - two paper tags clip onto the bezel (Linked Evidence, Abridge says), a strip of source words
 *    unrolls from a wall hook beside the screen and a thread draws from the draft line back to the
 *    matching row of source words (s6);
 *  - an OUTLINED check mark comes down over the slot and HOVERS there. It never lands: its soft shadow
 *    stays apart from it on the page, so the check is ready but not placed (s6 to s10);
 *  - in the close, a vendor thread and a statute thread meet at the empty slot, a small tag reading
 *    required for diagnostic use hangs beside it, a card asking how well the check works hangs from
 *    the chin with an empty field and a not stated stamp, and three small source cards settle at the
 *    screen edge (s10).
 *
 * The page carries no readable patient detail: every line of the note is word marks. No logo, no
 * product interface, no brand mark. Soft humid daylight from the window on the upper left gives
 * every part a lit upper-left edge and a short soft shadow to the lower right.
 * Pure function of its props; the episode drives every prop from the film frame clock.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
/** The same value for the same index on every frame and every render. */
export const hashN=(i:number)=>{const x=Math.sin(i*91.7+17.3)*43758.5453;return x-Math.floor(x);};

// ---- geometry, in the room's world pixels (the wide framing is the identity camera) ----------------------
export const SCREEN={x:470,y:456,w:430,h:336,r:24};
export const PAGE={x:490,y:476,w:390,h:258};
export const DRAFT={x0:512,x1:772,y:598};
export const SLOT={x:820,y:598,s:48,rot:-5};
export const HOVER={x:820,y:534};
export const TRAY={x:496,y:798,w:220,h:50};
export const STRIP={x:318,y:470,w:126,h:322};
export const STRIP_ROWS=[524,560,596,634,672,710,748];
export const MATCH_ROW=3;
export const LINK_FROM:Pt=[612,606];
export const LINK_TO:Pt=[STRIP.x+STRIP.w-2,STRIP_ROWS[MATCH_ROW]];
export const SLOT_IN:Pt=[SLOT.x-4,SLOT.y+SLOT.s/2+2];
export const HOWWELL={x:724,y:800,w:178,h:136};
export const LABEL={x:640,y:620,w:150,h:58};
/** The speech ribbon's path: off the foot of the exam table, up over the room and into the page. */
export const RIBBON={p0:[410,842] as Pt,c1:[352,700] as Pt,c2:[436,600] as Pt,p1:[DRAFT.x0,DRAFT.y] as Pt};
export function ribbonPoint(u:number):Pt{
 const q=clamp(u),a=(1-q)**3,b=3*q*(1-q)**2,c=3*q*q*(1-q),d=q**3,R=RIBBON;
 return [a*R.p0[0]+b*R.c1[0]+c*R.c2[0]+d*R.p1[0],a*R.p0[1]+b*R.c1[1]+c*R.c2[1]+d*R.p1[1]];
}
function ribbonAngle(u:number){const a=ribbonPoint(u-.01),b=ribbonPoint(u+.01);return Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;}
/** Where the three source cards settle at the screen's left edge. */
export const SOURCE_CARDS:{x:number;y:number;r:number;label:string}[]=[
 {x:356,y:700,r:-7,label:'UTHealth Houston post'},{x:366,y:724,r:-2,label:'Abridge release'},{x:378,y:748,r:4,label:'Texas bill text'}];

export type HeroIds={note?:string;draftline?:string;checkbox?:string;record?:string;speech?:string;source?:string;links?:string;
 verify?:string;check?:string;statute?:string;design?:string;howwell?:string;sources?:string};
export type HeroState={
 /** s1: the word ribbon's head and tail along its path, 0 to 1; null when not drawn */
 ribbon:{head:number;tail:number}|null;
 write:number;chip:number;slot:number;tray:number;
 /** s6 */
 tags:number;strip:number;link:number;hover:number;
 /** s10 */
 design:number;statute:number;designFrom:Pt|null;statuteFrom:Pt|null;label:number;howWell:number;stamp:number;cards:number;
};
type Pal={ink:string;paper:string;hero:string;accent:string;foreground:string;midground:string;background:string};

const I:React.FC<{id?:string;children:React.ReactNode}>=({id,children})=>id?<g data-item={id}>{children}</g>:<>{children}</>;
const Txt:React.FC<{x:number;y:number;size:number;bold?:boolean;fill:string;anchor?:'start'|'middle'|'end';children:React.ReactNode;opacity?:number;italic?:boolean}>=
 ({x,y,size,bold=false,fill,anchor='start',children,opacity=1,italic=false})=>
 <text x={f2(x)} y={f2(y)} fontFamily={FONT.body} fontSize={size} fontWeight={bold?800:600} fill={fill} textAnchor={anchor} opacity={opacity}
  fontStyle={italic?'italic':undefined}>{children}</text>;

/** A row of word marks between x0 and x1, revealed to `p`, never readable words. */
export const WordMarks:React.FC<{x0:number;x1:number;y:number;h:number;p?:number;seed:number;fill:string;opacity?:number}>=
 ({x0,x1,y,h,p=1,seed,fill,opacity=1})=>{
 const out:React.ReactNode[]=[];let x=x0,k=0;const end=lerp(x0,x1,clamp(p));
 while(x<x1-6&&k<40){
  const w=h*(1.4+3.2*hashN(seed*31+k)),gap=h*.55;
  const right=Math.min(x+w,x1);
  if(x>=end)break;
  const shown=Math.min(right,end)-x;
  if(shown>.5)out.push(<rect key={k} x={f2(x)} y={f2(y-h/2)} width={f2(shown)} height={f2(h)} rx={f2(Math.min(h/2,shown/2))} fill={fill} opacity={opacity}/>);
  x=right+gap;k++;
 }
 return <g>{out}</g>;
};

/** The outlined check mark, its tip at the origin of its own box (about 56 by 46). */
const CHECK='M-24 0L-8 16L24 -22';
export const CheckOutline:React.FC<{pal:Pal;o?:number}>=({pal,o=1})=><g opacity={f2(o)}>
 <path d={CHECK} stroke={pal.hero} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
 <path d={CHECK} stroke={pal.accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="13 7"/>
</g>;

/** A small paper tag with a punched hole, its hole at the origin; lines are drawn below it. */
export const HeroTag:React.FC<{pal:Pal;lines:string[];size:number;w:number;bold?:boolean;tone?:'paper'|'accent'}>=({pal,lines,size,w,bold=true,tone='paper'})=>{
 const h=lines.length*size*1.18+20;
 return <g>
  <rect x={-w/2+5} y={8} width={w} height={h} rx={8} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)"/>
  <path d={`M${-w/2} 10H${w/2-10}L${w/2} 20V${h+2}H${-w/2}Z`} fill={tone==='accent'?'#F8DCC4':pal.paper} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round"/>
  <circle cx={0} cy={0} r={5} fill="none" stroke={pal.ink} strokeWidth={2.2}/>
  {lines.map((l,i)=><Txt key={i} x={-w/2+12} y={10+size*(i+1)*1.1+4} size={size} bold={bold} fill={pal.ink}>{l}</Txt>)}
 </g>;
};

/** A thread drawn from a to b through two controls, revealed to p, with a knot where it ties. */
export const HeroThread:React.FC<{a:Pt;c1:Pt;c2:Pt;b:Pt;p:number;color:string;w?:number;knot?:boolean}>=
 ({a,c1,c2,b,p,color,w=4,knot=true})=>{
 if(p<=0)return null;
 const d=`M${f2(a[0])} ${f2(a[1])}C${f2(c1[0])} ${f2(c1[1])} ${f2(c2[0])} ${f2(c2[1])} ${f2(b[0])} ${f2(b[1])}`;
 const L=1000,dash=`${f2(L*clamp(p))} ${L}`;
 return <g>
  <path d={d} stroke="#ffffff" strokeOpacity={.5} strokeWidth={w+3} fill="none" pathLength={L} strokeDasharray={dash} strokeLinecap="round"/>
  <path d={d} stroke={color} strokeWidth={w} fill="none" pathLength={L} strokeLinecap="round" strokeDasharray={dash}/>
  <circle cx={f2(a[0])} cy={f2(a[1])} r={w*1.3} fill={color}/>
  {knot&&p>=.999&&<circle cx={f2(b[0])} cy={f2(b[1])} r={w*1.6} fill={color} stroke="#ffffff" strokeOpacity={.6} strokeWidth={1.5}/>}
 </g>;
};

/** The vendor and statute threads' paths to the slot, shared with the episode's bounds checks. */
export function closeThread(from:Pt,kind:'design'|'statute'):{a:Pt;c1:Pt;c2:Pt;b:Pt}{
 const b:Pt=kind==='design'?[SLOT_IN[0]-14,SLOT_IN[1]]:[SLOT_IN[0]+6,SLOT_IN[1]+2];
 return kind==='design'?{a:from,c1:[from[0]+20,from[1]-170],c2:[b[0]-120,b[1]+90],b}
  :{a:from,c1:[from[0]+10,from[1]-250],c2:[b[0]-260,b[1]+150],b};
}

export const NoteHero:React.FC<{pal:Pal;st:HeroState;layer:'back'|'front';ids?:HeroIds}>=({pal,st,layer,ids={}})=>{
 if(layer==='front')return <HeroFront pal={pal} st={st} ids={ids}/>;
 const S=SCREEN,P=PAGE;
 const trayOpen=smooth(st.tray);
 const stripP=smooth(st.strip);
 const tagP=st.tags;
 const howP=smooth(st.howWell);
 return <g data-part="note-hero">
  {/* the swing arm, out of the right wall, behind the screen */}
  <g data-part="arm">
   <rect x={1046} y={586} width={40} height={112} rx={8} fill="#55666B" stroke={pal.ink} strokeWidth={3}/>
   <path d="M1060 636L986 668L912 640" stroke="#2C393E" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   <path d="M1058 628L986 660L914 632" stroke="#6E8186" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={.8}/>
   <circle cx={986} cy={668} r={17} fill="#3A484D" stroke={pal.ink} strokeWidth={3}/><circle cx={982} cy={663} r={6} fill="#8FA0A4"/>
  </g>
  {/* the screen's soft shadow on the wall, lower right of it */}
  <rect x={S.x+16} y={S.y+20} width={S.w} height={S.h} rx={S.r} fill={pal.ink} opacity={.26} filter="url(#nc1110-soft)"/>
  {/* strip of source words, unrolling from a wall hook beside the screen (s6) */}
  {stripP>0&&<I id={ids.source}><g data-part="source-strip">
   <path d={`M${STRIP.x+STRIP.w/2-10} ${STRIP.y-20}q10 -14 20 0`} stroke="#59666A" strokeWidth={5} fill="none" strokeLinecap="round"/>
   <defs><clipPath id="nc1110-strip"><rect x={STRIP.x-10} y={STRIP.y-6} width={STRIP.w+30} height={f2(6+STRIP.h*stripP+12)}/></clipPath></defs>
   <g clipPath="url(#nc1110-strip)">
    <rect x={STRIP.x+8} y={STRIP.y+10} width={STRIP.w} height={STRIP.h} rx={4} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
    <path d={`M${STRIP.x} ${STRIP.y}H${STRIP.x+STRIP.w}V${STRIP.y+STRIP.h-14}L${STRIP.x+STRIP.w-12} ${STRIP.y+STRIP.h}H${STRIP.x}Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={2.5}/>
    <path d={`M${STRIP.x+STRIP.w-12} ${STRIP.y+STRIP.h}V${STRIP.y+STRIP.h-12}H${STRIP.x+STRIP.w}`} fill="#E2D7C0" stroke={pal.ink} strokeWidth={2}/>
    <rect x={STRIP.x+3} y={STRIP.y+3} width={4} height={STRIP.h-20} fill="#ffffff" opacity={.5}/>
    <Txt x={STRIP.x+10} y={STRIP.y+30} size={17} bold fill={pal.ink}>source</Txt>
    <Txt x={STRIP.x+10} y={STRIP.y+50} size={17} bold fill={pal.ink}>words</Txt>
    {STRIP_ROWS.map((y,i)=>{const lit=i===MATCH_ROW?smooth((st.link-.82)/.18):0;
     return <g key={i}>
      {lit>0&&<rect x={STRIP.x+6} y={y-14} width={STRIP.w-12} height={28} rx={6} fill="#F6C9A2" opacity={f2(lit)}/>}
      <WordMarks x0={STRIP.x+12} x1={STRIP.x+STRIP.w-12} y={y} h={10} seed={60+i} fill={pal.ink} opacity={.62}/>
     </g>;})}
   </g>
   <rect x={STRIP.x+STRIP.w/2-16} y={STRIP.y-10} width={32} height={18} rx={4} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>
  </g></I>}
  {/* the record tray under the screen: back panel, then a front lip that slides forward, open and empty */}
  <I id={ids.record}><g data-part="record-tray">
   <rect x={TRAY.x+10} y={TRAY.y+12} width={TRAY.w} height={TRAY.h} rx={6} fill={pal.ink} opacity={.22} filter="url(#nc1110-soft)"/>
   <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={30} rx={5} fill="#4F6A6E" stroke={pal.ink} strokeWidth={3}/>
   <path d={`M${TRAY.x+8} ${TRAY.y+6}H${TRAY.x+TRAY.w-30}`} stroke="#9DB3B3" strokeWidth={3} strokeLinecap="round" opacity={.7}/>
   <rect x={TRAY.x+6} y={TRAY.y+24} width={TRAY.w-12} height={f2(4+16*trayOpen)} fill="#22302F" opacity={f2(.25+.45*trayOpen)}/>
   <g transform={`translate(0 ${f2(14*trayOpen)})`}>
    <path d={`M${TRAY.x-4} ${TRAY.y+26}H${TRAY.x+TRAY.w+4}L${TRAY.x+TRAY.w-6} ${TRAY.y+TRAY.h-6}H${TRAY.x+6}Z`} fill="#6A8487" stroke={pal.ink} strokeWidth={3} strokeLinejoin="round"/>
    <path d={`M${TRAY.x+4} ${TRAY.y+30}H${TRAY.x+TRAY.w-60}`} stroke="#B9CACA" strokeWidth={2.5} strokeLinecap="round"/>
    {/* a bent corner on the lip: maintained but worn */}
    <path d={`M${TRAY.x+TRAY.w-24} ${TRAY.y+TRAY.h-6}l14 -6l2 -12`} stroke={pal.ink} strokeWidth={2} fill="none"/>
   </g>
  </g></I>
  {/* the screen itself */}
  <I id={ids.note}><g data-part="note-screen">
   <rect x={S.x} y={S.y} width={S.w} height={S.h} rx={S.r} fill="#25343A" stroke={pal.ink} strokeWidth={4}/>
   <path d={`M${S.x+6} ${S.y+S.h-30}V${S.y+S.r}Q${S.x+6} ${S.y+6} ${S.x+S.r} ${S.y+6}H${S.x+S.w-40}`} stroke="#6C8187" strokeWidth={4} fill="none" strokeLinecap="round" opacity={.85}/>
   <rect x={S.x+6} y={P.y+P.h+4} width={S.w-12} height={S.y+S.h-P.y-P.h-10} rx={14} fill="#2E3F45"/>
   <circle cx={S.x+30} cy={P.y+P.h+30} r={5} fill="#86C2B3"/>
   <path d={`M${S.x+S.w-120} ${P.y+P.h+40}l38 -5`} stroke="#5D7075" strokeWidth={2} strokeLinecap="round"/>
   <defs><radialGradient id="nc1110-glow" cx=".42" cy=".38" r=".75"><stop offset="0" stopColor="#F2F6F1"/><stop offset=".7" stopColor={pal.hero}/><stop offset="1" stopColor="#E9E4D3"/></radialGradient></defs>
   <rect x={P.x} y={P.y} width={P.w} height={P.h} rx={8} fill="url(#nc1110-glow)"/>
   <rect x={P.x} y={P.y} width={P.w} height={6} rx={3} fill={pal.ink} opacity={.12}/>
   <Txt x={P.x+20} y={P.y+32} size={20} bold fill={pal.ink}>Visit note</Txt>
   <path d={`M${P.x+20} ${P.y+46}H${P.x+P.w-20}`} stroke="#C9C3B2" strokeWidth={2}/>
   {/* the AI draft chip arrives with the line */}
   {st.chip>0&&<g opacity={f2(smooth(st.chip))} transform={`translate(${f2(P.x+150)} ${f2(P.y+12+6*(1-smooth(st.chip)))})`}>
    <rect x={0} y={0} width={92} height={28} rx={14} fill="#DCE8E5" stroke={pal.foreground} strokeWidth={2.5}/>
    <Txt x={46} y={20} size={17} bold anchor="middle" fill={pal.ink}>AI draft</Txt></g>}
   {/* two empty template rows below the draft line */}
   {[648,690].map((y,i)=><path key={i} d={`M${DRAFT.x0} ${y}H${DRAFT.x0+180-i*40}`} stroke="#CFC8B6" strokeWidth={3} strokeDasharray="10 9" strokeLinecap="round"/>)}
   <I id={ids.draftline}><g data-part="draft-line">
    <WordMarks x0={DRAFT.x0} x1={DRAFT.x1} y={DRAFT.y} h={15} p={st.write} seed={7} fill={pal.ink} opacity={.82}/>
    {st.write>0&&st.write<1&&<rect x={f2(lerp(DRAFT.x0,DRAFT.x1,st.write)+3)} y={DRAFT.y-16} width={3.5} height={32} rx={1.5} fill={pal.foreground}
     transform={`rotate(4 ${f2(lerp(DRAFT.x0,DRAFT.x1,st.write)+4)} ${DRAFT.y})`}/>}
   </g></I>
   {/* the crooked check slot, drawn round as it opens */}
   {st.slot>0&&<I id={ids.checkbox??ids.check}><g data-part="check-slot" transform={`rotate(${SLOT.rot} ${SLOT.x} ${SLOT.y})`}>
    <rect x={SLOT.x-SLOT.s/2+2} y={SLOT.y-SLOT.s/2+3} width={SLOT.s} height={SLOT.s} rx={7} fill={pal.ink} opacity={f2(.12*smooth(st.slot))}/>
    <rect x={SLOT.x-SLOT.s/2} y={SLOT.y-SLOT.s/2} width={SLOT.s} height={SLOT.s} rx={7} fill={pal.hero} fillOpacity={f2(smooth(st.slot))}
     stroke={pal.accent} strokeWidth={5} pathLength={100} strokeDasharray={`${f2(100*clamp(st.slot))} 100`}/>
   </g></I>}
  </g></I>
  {/* two paper tags clipped on the bezel's top edge (s6): the vendor's feature name and its attribution */}
  {tagP>0&&<g data-part="evidence-tags">
   {[{x:574,lines:['Linked Evidence'],w:widthOf('Linked Evidence',21,true)+24,bold:true,d:0},{x:786,lines:['Abridge says'],w:widthOf('Abridge says',21)+24,bold:false,d:.25}].map((g,i)=>{
    const p=clamp((tagP-g.d)/(1-g.d));if(p<=0)return null;
    const sw=-34*(1-smooth(p));
    // a clip-on tab standing up from the bezel's top edge, swinging up into place about its clip
    return <g key={i} transform={`translate(${g.x} ${S.y+4}) rotate(${f2(sw)})`} opacity={f2(clamp(p*4))}>
     <rect x={-g.w/2+6} y={-58} width={g.w} height={56} rx={8} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)"/>
     <path d={`M${-g.w/2} -62H${g.w/2-12}L${g.w/2} -50V0H${-g.w/2}Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round"/>
     <Txt x={-g.w/2+12} y={-24} size={21} bold={g.bold} italic={!g.bold} fill={pal.ink}>{g.lines[0]}</Txt>
     <rect x={-12} y={-8} width={24} height={18} rx={3} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>
     <path d="M-6 -8V-16M6 -8V-16" stroke="#8FA0A4" strokeWidth={2.5} strokeLinecap="round"/>
    </g>;})}
  </g>}
  {/* the card that asks how well the check works, hung from the chin (s10) */}
  {howP>0&&<I id={ids.howwell}><g data-part="how-well" transform={`translate(${HOWWELL.x} ${f2(HOWWELL.y-40*(1-howP))}) rotate(${f2(5*(1-howP))} ${HOWWELL.w/2} 0)`} opacity={f2(clamp(howP*3))}>
   <rect x={10} y={12} width={HOWWELL.w} height={HOWWELL.h} rx={8} fill={pal.ink} opacity={.22} filter="url(#nc1110-soft)"/>
   <rect x={0} y={0} width={HOWWELL.w} height={HOWWELL.h} rx={8} fill={pal.paper} stroke={pal.ink} strokeWidth={3}/>
   {[30,HOWWELL.w-30].map((x,i)=><rect key={i} x={x-8} y={-12} width={16} height={22} rx={3} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>)}
   <Txt x={14} y={36} size={22} bold fill={pal.ink}>how well the</Txt>
   <Txt x={14} y={62} size={22} bold fill={pal.ink}>check works</Txt>
   <rect x={14} y={78} width={HOWWELL.w-28} height={42} rx={6} fill="#ffffff" fillOpacity={.55} stroke={pal.ink} strokeWidth={2.5} strokeDasharray="9 7"/>
   {st.stamp>0&&<g transform={`translate(${HOWWELL.w/2} 99) rotate(-8) scale(${f2(1.3-.3*smooth(st.stamp))})`} opacity={f2(clamp(st.stamp*2.2))}>
    <rect x={-74} y={-21} width={148} height={42} rx={6} fill="none" stroke={pal.accent} strokeWidth={4}/>
    <rect x={-68} y={-15} width={136} height={30} rx={4} fill="none" stroke={pal.accent} strokeWidth={1.6}/>
    <Txt x={0} y={9} size={24} bold anchor="middle" fill={pal.accent}>not stated</Txt>
   </g>}
  </g></I>}
 </g>;
};

/** The parts that stand in front of everything else: the link thread, the speech ribbon, the hovering
 * outlined check, the close's two threads and label, and the settled source cards. */
const HeroFront:React.FC<{pal:Pal;st:HeroState;ids:HeroIds}>=({pal,st,ids})=>{
 const r=st.ribbon;
 const marks:React.ReactNode[]=[];
 if(r&&r.head>r.tail){
  const n=16;
  for(let k=0;k<n;k++){
   const u=r.tail+(r.head-r.tail)*(k+.5)/n;
   if(u>.975)continue;
   const p=ribbonPoint(u),a=ribbonAngle(u),w=10+16*hashN(200+k),wave=7*Math.sin(u*13+k*.4);
   const lead=k>=n-2?smooth((r.head-u)*20):1;
   marks.push(<g key={k} transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(a)}) translate(0 ${f2(wave)})`} opacity={f2(.88*lead)}>
    <rect x={-w/2} y={-6} width={w} height={12} rx={6} fill={pal.ink}/>
    <rect x={-w/2+2} y={-5} width={w*.5} height={3} rx={1.5} fill="#ffffff" opacity={.35}/>
   </g>);
  }
 }
 const hover=smooth(st.hover);
 const label=smooth(st.label);
 const dTh=st.designFrom?closeThread(st.designFrom,'design'):null,sTh=st.statuteFrom?closeThread(st.statuteFrom,'statute'):null;
 return <g data-part="note-hero-front">
  {r&&marks.length>0&&<I id={ids.speech}><g data-part="speech-ribbon">{marks}</g></I>}
  {st.link>0&&<I id={ids.links}><HeroThread a={LINK_FROM} c1={[LINK_FROM[0]-10,LINK_FROM[1]+118]} c2={[LINK_TO[0]+60,LINK_TO[1]+96]} b={LINK_TO} p={st.link} color={pal.foreground} w={4}/></I>}
  {dTh&&st.design>0&&<I id={ids.design}><HeroThread {...dTh} p={st.design} color="#2F7C80" w={5}/></I>}
  {sTh&&st.statute>0&&<I id={ids.statute}><HeroThread {...sTh} p={st.statute} color={pal.ink} w={5}/></I>}
  {label>0&&<I id={ids.check}><g data-part="slot-label" opacity={f2(label)} transform={`translate(0 ${f2(-10*(1-label))})`}>
   <path d={`M${LABEL.x+LABEL.w-6} ${LABEL.y+8}L${SLOT.x-20} ${SLOT.y+18}`} stroke={pal.ink} strokeWidth={2} strokeDasharray="5 4"/>
   <rect x={LABEL.x+4} y={LABEL.y+5} width={LABEL.w} height={LABEL.h} rx={8} fill={pal.ink} opacity={.16}/>
   <rect x={LABEL.x} y={LABEL.y} width={LABEL.w} height={LABEL.h} rx={8} fill="#F8DCC4" stroke={pal.accent} strokeWidth={2.5}/>
   <Txt x={LABEL.x+10} y={LABEL.y+24} size={19} bold fill={pal.ink}>required for</Txt>
   <Txt x={LABEL.x+10} y={LABEL.y+47} size={19} bold fill={pal.ink}>diagnostic use</Txt>
  </g></I>}
  {hover>0&&<I id={ids.verify??ids.check}><g data-part="hover-check">
   {/* the shadow stays on the page beside the slot, apart from the mark: hovering, not placed */}
   <ellipse cx={SLOT.x+14} cy={SLOT.y-6} rx={26} ry={9} fill={pal.ink} opacity={f2(.16*hover)} filter="url(#nc1110-soft)"/>
   <g transform={`translate(${HOVER.x} ${f2(HOVER.y-60*(1-hover))})`}><CheckOutline pal={pal} o={hover}/></g>
  </g></I>}
  {st.cards>0&&<I id={ids.sources}><g data-part="source-cards">{SOURCE_CARDS.map((c,i)=>{
   const p=smooth(clamp((st.cards-i*.18)/(1-.36)));if(p<=0)return null;
   const x=lerp(c.x-300,c.x,p),y=lerp(c.y+120,c.y,p);
   return <g key={i} transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(c.r+10*(1-p))})`}>
    <rect x={6} y={8} width={150} height={84} rx={6} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
    <path d="M0 0H136L150 14V84H0Z" fill={pal.paper} stroke={pal.ink} strokeWidth={2.5}/>
    <path d="M136 0V14H150" fill="#E2D7C0" stroke={pal.ink} strokeWidth={2}/>
    <Txt x={10} y={26} size={15} bold fill={pal.ink}>{c.label}</Txt>
    <WordMarks x0={10} x1={128} y={48} h={8} seed={300+i} fill={pal.ink} opacity={.5}/>
    <WordMarks x0={10} x1={100} y={66} h={8} seed={320+i} fill={pal.ink} opacity={.5}/>
   </g>;})}</g></I>}
 </g>;
};
