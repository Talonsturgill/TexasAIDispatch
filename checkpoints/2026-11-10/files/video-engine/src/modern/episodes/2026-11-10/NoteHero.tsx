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
 *  - an OUTLINED check mark comes down from above the screen at full strength and HOVERS over the slot.
 *    It never lands, by design: no source says a check was done, so the board keeps it ready but not
 *    placed, its soft shadow on the page beside the slot (s6 to s10). This is a held non-contact, not an
 *    unfinished landing: it arrives on a performed descent and holds still at one height to the end;
 *  - in the close, a vendor thread and a statute thread meet at the slot, the statute thread carries
 *    a small tag reading Texas law requires review for diagnostic use up to it, a card asking how well
 *    the check works is lowered from behind the chin with an empty field that takes a drawn not stated
 *    mark, and three small source cards slide in from the frame edge to the screen's side (s10).
 *  - the film opens on a performed move: the screen is drawn out from the wall on its swing arm (s1).
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
export const TRAY={x:496,y:798,w:220,h:50};
export const STRIP={x:318,y:500,w:126,h:350};
/** The strip's rows of source words; its label is printed at its foot, so a close on the rows needs no tabs. */
export const STRIP_ROWS=[534,570,606,642,678,714,750];
export const MATCH_ROW=3;
export const LINK_FROM:Pt=[620,590];
export const LINK_TO:Pt=[STRIP.x+STRIP.w-2,STRIP_ROWS[MATCH_ROW]];
export const SLOT_IN:Pt=[SLOT.x-4,SLOT.y+SLOT.s/2+2];
/** Where the outlined check hovers over the slot, and the height above the screen it comes down from. */
export const HOVER={x:820,y:532,from:330};
export const HOWWELL={x:688,y:800,w:212,h:150};
/** How far the how well card is lowered from behind the screen, and how far the tabs rise from behind it. */
export const HOW_DROP=166,TAB_RISE=72;
/** The AI draft chip sits under the header at the page's left, just above the draft line it labels. */
export const CHIP={x:PAGE.x+20,y:530,w:widthOf('AI draft',26,true)+28,h:38};
export const LABEL_SIZE=22;
export const LABEL={x:512,y:622,w:widthOf('for diagnostic use',LABEL_SIZE,true)+24,h:3*LABEL_SIZE*1.16+24,lines:['Texas law','requires review','for diagnostic use']};
/** Every type size the hero prints, chosen so it reads at 390 pixels in the widest shot that shows it. */
export const HERO_TYPE={page:26,chip:26,strip:24,tab:22,howwell:26,card:20};
const tabW=(t:string,bold:boolean)=>widthOf(t,HERO_TYPE.tab,bold)+14;
/** The two clip-on tabs, each wholly inside the screen's width so it can rise unseen from behind it. */
export const TABS=[{text:'Linked Evidence',bold:true,d:0},{text:'Abridge says',bold:false,d:.25}].map((g,i,all)=>{
 const w=tabW(g.text,g.bold);
 return {...g,w,x:i===0?SCREEN.x+10+w/2:SCREEN.x+SCREEN.w-10-w/2};
});
/** The speech ribbon's path: off the foot of the exam table, up over the room and into the page. */
export const RIBBON={p0:[410,842] as Pt,c1:[352,700] as Pt,c2:[436,600] as Pt,p1:[DRAFT.x0,DRAFT.y] as Pt};
export function ribbonPoint(u:number):Pt{
 const q=clamp(u),a=(1-q)**3,b=3*q*(1-q)**2,c=3*q*q*(1-q),d=q**3,R=RIBBON;
 return [a*R.p0[0]+b*R.c1[0]+c*R.c2[0]+d*R.p1[0],a*R.p0[1]+b*R.c1[1]+c*R.c2[1]+d*R.p1[1]];
}
function ribbonAngle(u:number){const a=ribbonPoint(u-.01),b=ribbonPoint(u+.01);return Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;}
/** Where the three source cards settle at the screen's left edge. */
export const SOURCE_CARD={w:222,h:88};
/** The three source cards come to rest fanned against the screen's chin, beside the how well card (s10). */
export const SOURCE_CARDS:{x:number;y:number;r:number;label:string}[]=[
 {x:446,y:800,r:-4,label:'UTHealth post'},{x:452,y:822,r:-1,label:'Abridge release'},{x:458,y:846,r:2,label:'Texas bill text'}];

export type HeroIds={note?:string;draftline?:string;checkbox?:string;record?:string;speech?:string;source?:string;links?:string;
 verify?:string;check?:string;statute?:string;design?:string;howwell?:string;sources?:string};
export type HeroState={
 /** s1: the screen's swing out from the wall at the film's first frame, 1 folded to 0 at rest */
 swing:number;
 /** the world x of this camera's left frame edge, where arriving cards start out of sight */
 edgeL:number;
 /** variant b keeps four accent ticks round the slot in every shot, the same in world space */
 reticle:boolean;
 /** s1: the word ribbon's head and tail along its path, 0 to 1; null when not drawn */
 ribbon:{head:number;tail:number}|null;
 write:number;chip:number;slot:number;tray:number;
 /** s6 */
 /** hover: how far the outlined check has come down to its hover over the slot */
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
 // both threads come in to the slot's left edge from below, between the law's tag and the slot
 const b:Pt=kind==='design'?[SLOT.x-SLOT.s/2,SLOT.y-6]:[SLOT.x-SLOT.s/2+1,SLOT.y+12];
 return kind==='design'?{a:from,c1:[from[0]+20,from[1]-170],c2:[b[0]-70,b[1]+80],b}
  :{a:from,c1:[from[0]+10,from[1]-250],c2:[b[0]-60,b[1]+110],b};
}

/** A point on a thread's cubic at parameter u. */
export function cubicPoint(t:{a:Pt;c1:Pt;c2:Pt;b:Pt},u:number):Pt{
 const q=clamp(u),A=(1-q)**3,B=3*q*(1-q)**2,C=3*q*q*(1-q),D=q**3;
 return [A*t.a[0]+B*t.c1[0]+C*t.c2[0]+D*t.b[0],A*t.a[1]+B*t.c1[1]+C*t.c2[1]+D*t.b[1]];
}
/** The swing: the screen folded toward the wall, as a transform about the arm's wall mount. */
export const SWING={dx:190,dy:-8,shrink:.06,mount:[1066,640] as Pt};
export function swingTransform(s:number){
 if(s<=0)return undefined;
 const k=1-SWING.shrink*s,[mx,my]=SWING.mount;
 return `translate(${f2(SWING.dx*s)} ${f2(SWING.dy*s)}) translate(${mx} ${my}) scale(${f2(k)}) translate(${-mx} ${-my})`;
}
export const NoteHero:React.FC<{pal:Pal;st:HeroState;layer:'back'|'front';ids?:HeroIds}>=({pal,st,layer,ids={}})=>{
 if(layer==='front')return <g transform={swingTransform(st.swing)}><HeroFront pal={pal} st={st} ids={ids}/></g>;
 const S=SCREEN,P=PAGE;
 const trayOpen=smooth(st.tray);
 const stripP=smooth(st.strip);
 const tagP=st.tags;
 const howP=smooth(st.howWell);
 // the arm's elbow folds as the screen is drawn out from the wall; the wall mount never moves
 const sw=st.swing,end:Pt=[912+SWING.dx*sw,640+SWING.dy*sw],elbow:Pt=[986+.55*SWING.dx*sw,668-34*sw];
 return <g data-part="note-hero">
  {/* the swing arm, out of the right wall, behind the screen */}
  <g data-part="arm">
   <rect x={1046} y={586} width={40} height={112} rx={8} fill="#55666B" stroke={pal.ink} strokeWidth={3}/>
   <path d={`M1060 636L${f2(elbow[0])} ${f2(elbow[1])}L${f2(end[0])} ${f2(end[1])}`} stroke="#2C393E" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
   <path d={`M1058 628L${f2(elbow[0])} ${f2(elbow[1]-8)}L${f2(end[0]+2)} ${f2(end[1]-8)}`} stroke="#6E8186" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={.8}/>
   <circle cx={f2(elbow[0])} cy={f2(elbow[1])} r={17} fill="#3A484D" stroke={pal.ink} strokeWidth={3}/><circle cx={f2(elbow[0]-4)} cy={f2(elbow[1]-5)} r={6} fill="#8FA0A4"/>
  </g>
  <g transform={swingTransform(sw)}>
  {/* the screen's soft shadow on the wall, lower right of it */}
  <rect x={S.x+16} y={S.y+20} width={S.w} height={S.h} rx={S.r} fill={pal.ink} opacity={.26} filter="url(#nc1110-soft)"/>
  {/* two paper tabs that rise from behind the screen and clip onto its top edge (s6): the vendor's feature
      name and its attribution. They are drawn behind the screen, so before they rise they are out of sight. */}
  {tagP>0&&<g data-part="evidence-tags">
   {TABS.map((g,i)=>{
    const p=clamp((tagP-g.d)/(1-g.d));if(p<=0)return null;const k=smooth(p);
    return <g key={i} transform={`translate(${g.x} ${f2(S.y+4+TAB_RISE*(1-k))}) rotate(${f2(-4*(1-k)*(i?-1:1))})`}>
     <rect x={-g.w/2+6} y={-58} width={g.w} height={56} rx={8} fill={pal.ink} opacity={.18} filter="url(#nc1110-soft)"/>
     <path d={`M${-g.w/2} -62H${g.w/2-12}L${g.w/2} -50V0H${-g.w/2}Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={2.5} strokeLinejoin="round"/>
     <Txt x={-g.w/2+7} y={-22} size={HERO_TYPE.tab} bold={g.bold} italic={!g.bold} fill={pal.ink}>{g.text}</Txt>
     <rect x={-12} y={-8} width={24} height={18} rx={3} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>
     <path d="M-6 -8V-16M6 -8V-16" stroke="#8FA0A4" strokeWidth={2.5} strokeLinecap="round"/>
    </g>;})}
  </g>}
  {/* the card that asks how well the check works is lowered from behind the screen and hangs from its
      chin (s10); before it is lowered it is wholly behind the screen */}
  {howP>0&&<I id={ids.howwell}><g data-part="how-well" transform={`translate(${HOWWELL.x} ${f2(HOWWELL.y-HOW_DROP*(1-howP))}) rotate(${f2(4*(1-howP))} ${HOWWELL.w/2} 0)`}>
   <rect x={8} y={10} width={HOWWELL.w} height={HOWWELL.h} rx={8} fill={pal.ink} opacity={.22} filter="url(#nc1110-soft)"/>
   <rect x={0} y={0} width={HOWWELL.w} height={HOWWELL.h} rx={8} fill={pal.paper} stroke={pal.ink} strokeWidth={3}/>
   {[30,HOWWELL.w-30].map((x,i)=><rect key={i} x={x-8} y={-12} width={16} height={22} rx={3} fill="#3E4B50" stroke={pal.ink} strokeWidth={2}/>)}
   <Txt x={14} y={40} size={HERO_TYPE.howwell} bold fill={pal.ink}>how well the</Txt>
   <Txt x={14} y={72} size={HERO_TYPE.howwell} bold fill={pal.ink}>check works</Txt>
   <rect x={12} y={86} width={HOWWELL.w-24} height={50} rx={6} fill="#FBF8F0" stroke={pal.ink} strokeWidth={2.5} strokeDasharray="9 7"/>
   <g transform={`translate(${HOWWELL.w/2} 111)`}><DrawnMark pal={pal} text="not stated" size={24} p={st.stamp} rot={-6}/></g>
  </g></I>}
  {/* strip of source words, unrolling from a wall hook beside the screen (s6) */}
  {stripP>0&&<I id={ids.source}><g data-part="source-strip">
   <path d={`M${STRIP.x+STRIP.w/2-10} ${STRIP.y-20}q10 -14 20 0`} stroke="#59666A" strokeWidth={5} fill="none" strokeLinecap="round"/>
   <defs><clipPath id="nc1110-strip"><rect x={STRIP.x-10} y={STRIP.y-6} width={STRIP.w+30} height={f2(6+STRIP.h*stripP+12)}/></clipPath></defs>
   <g clipPath="url(#nc1110-strip)">
    <rect x={STRIP.x+8} y={STRIP.y+10} width={STRIP.w} height={STRIP.h} rx={4} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
    <path d={`M${STRIP.x} ${STRIP.y}H${STRIP.x+STRIP.w}V${STRIP.y+STRIP.h-14}L${STRIP.x+STRIP.w-12} ${STRIP.y+STRIP.h}H${STRIP.x}Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={2.5}/>
    <path d={`M${STRIP.x+STRIP.w-12} ${STRIP.y+STRIP.h}V${STRIP.y+STRIP.h-12}H${STRIP.x+STRIP.w}`} fill="#E2D7C0" stroke={pal.ink} strokeWidth={2}/>
    <rect x={STRIP.x+3} y={STRIP.y+3} width={4} height={STRIP.h-20} fill="#ffffff" opacity={.5}/>
    <Txt x={STRIP.x+10} y={STRIP.y+298} size={HERO_TYPE.strip} bold fill={pal.ink}>source</Txt>
    <Txt x={STRIP.x+10} y={STRIP.y+324} size={HERO_TYPE.strip} bold fill={pal.ink}>data</Txt>
    {STRIP_ROWS.map((y,i)=>{const lit=i===MATCH_ROW?st.link>=.999:false;
     return <g key={i}>
      {/* the matching row lights only once the thread has reached it: the effect follows its cause */}
      {lit&&<rect x={STRIP.x+6} y={y-14} width={STRIP.w-12} height={28} rx={6} fill="#F6C9A2"/>}
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
   <rect x={TRAY.x+6} y={TRAY.y+24} width={TRAY.w-12} height={f2(4+16*trayOpen)} fill={trayOpen>0?'#30403F':'#4A6062'}/>
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
   <Txt x={P.x+20} y={P.y+36} size={HERO_TYPE.page} bold fill={pal.ink}>Visit note</Txt>
   <path d={`M${P.x+20} ${P.y+50}H${P.x+P.w-20}`} stroke="#C9C3B2" strokeWidth={2}/>
   {/* the AI draft chip is written on beside the header from its left edge, as the line is written */}
   {st.chip>0&&<g transform={`translate(${CHIP.x} ${CHIP.y})`}>
    <defs><clipPath id="nc1110-chip"><rect x={-4} y={-4} width={f2((CHIP.w+8)*smooth(st.chip))} height={CHIP.h+8}/></clipPath></defs>
    <g clipPath="url(#nc1110-chip)">
     <rect x={0} y={0} width={CHIP.w} height={CHIP.h} rx={CHIP.h/2} fill="#DCE8E5" stroke={pal.foreground} strokeWidth={2.5}/>
     <Txt x={CHIP.w/2} y={CHIP.h/2+HERO_TYPE.chip*.36} size={HERO_TYPE.chip} bold anchor="middle" fill={pal.ink}>AI draft</Txt>
    </g></g>}
   {/* two empty template rows below the draft line */}
   {[648,690].map((y,i)=><path key={i} d={`M${DRAFT.x0} ${y}H${DRAFT.x0+180-i*40}`} stroke="#CFC8B6" strokeWidth={3} strokeDasharray="10 9" strokeLinecap="round"/>)}
   <I id={ids.draftline}><g data-part="draft-line">
    <WordMarks x0={DRAFT.x0} x1={DRAFT.x1} y={DRAFT.y} h={15} p={st.write} seed={7} fill={pal.ink} opacity={.82}/>
    {st.write>0&&st.write<1&&<rect x={f2(lerp(DRAFT.x0,DRAFT.x1,st.write)+3)} y={DRAFT.y-16} width={3.5} height={32} rx={1.5} fill={pal.foreground}
     transform={`rotate(4 ${f2(lerp(DRAFT.x0,DRAFT.x1,st.write)+4)} ${DRAFT.y})`}/>}
   </g></I>
   {/* the crooked check slot, drawn round as it opens */}
   {st.slot>0&&<I id={ids.checkbox??ids.check}><g data-part="check-slot" transform={`rotate(${SLOT.rot} ${SLOT.x} ${SLOT.y})`}>
    <rect x={SLOT.x-SLOT.s/2} y={SLOT.y-SLOT.s/2} width={SLOT.s} height={SLOT.s} rx={7} fill="none"
     stroke={pal.accent} strokeWidth={5} pathLength={100} strokeDasharray={`${f2(100*clamp(st.slot))} 100`}/>
   </g></I>}
  </g></I>
  </g>
 </g>;
};

/** A box marked on as p goes 0 to 1: its accent border is drawn round, then its words are written in. */
const DrawnMark:React.FC<{pal:Pal;text:string;size:number;p:number;rot:number}>=({pal,text,size,p,rot})=>{
 if(p<=0)return null;
 const w=widthOf(text,size,true)+30,h=size*1.15+18,border=clamp(p/.55),write=smooth((p-.4)/.6);
 return <g transform={`rotate(${rot})`}>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={6} fill="none" stroke={pal.accent} strokeWidth={4.5} pathLength={1000} strokeDasharray={`${f2(1000*border)} 1000`} strokeLinecap="round"/>
  {write>0&&<><defs><clipPath id="nc1110-notstated"><rect x={-w/2} y={-h/2} width={f2(w*write)} height={h}/></clipPath></defs>
   <g clipPath="url(#nc1110-notstated)"><Txt x={0} y={size*.36} size={size} bold anchor="middle" fill={pal.accent}>{text}</Txt></g></>}
 </g>;
};

/** The parts that stand in front of everything else: the link thread, the speech ribbon, the outlined
 * check drawn into the slot, variant b's slot ticks, the close's two threads and label, and the source cards. */
const HeroFront:React.FC<{pal:Pal;st:HeroState;ids:HeroIds}>=({pal,st,ids})=>{
 const r=st.ribbon;
 const marks:React.ReactNode[]=[];
 if(r&&r.head>r.tail){
  const n=16;
  for(let k=0;k<n;k++){
   const u=r.tail+(r.head-r.tail)*(k+.5)/n;
   if(u>.975)continue;
   const p=ribbonPoint(u),a=ribbonAngle(u),w=10+16*hashN(200+k),wave=7*Math.sin(u*13+k*.4);
   // the ribbon is a stroke of word marks paid out from the table: the newest mark grows out of the one behind it
   const lead=k>=n-2?.35+.65*smooth((r.head-u)*20):1;
   marks.push(<g key={k} transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(a)}) translate(0 ${f2(wave)}) scale(${f2(lead)} 1)`}>
    <rect x={-w/2} y={-6} width={w} height={12} rx={6} fill={pal.ink}/>
    <rect x={-w/2+2} y={-5} width={w*.5} height={3} rx={1.5} fill="#ffffff" opacity={.35}/>
   </g>);
  }
 }
 const drawn=smooth(st.hover);
 const dTh=st.designFrom?closeThread(st.designFrom,'design'):null,sTh=st.statuteFrom?closeThread(st.statuteFrom,'statute'):null;
 // the law's condition rides up the statute thread at its head, then settles beside the slot it names
 const ride=clamp(st.statute/.72),settle=smooth((st.statute-.72)/.28);
 const anchorRest:Pt=[LABEL.x+LABEL.w,LABEL.y+LABEL.h/2];
 const head:Pt|null=sTh?cubicPoint(sTh,ride):null;
 const labelAt:Pt=head?[lerp(head[0],anchorRest[0],settle)-LABEL.w,lerp(head[1],anchorRest[1],settle)-LABEL.h/2]:[LABEL.x,LABEL.y];
 const leader=smooth((st.statute-.86)/.14);
 return <g data-part="note-hero-front">
  {r&&marks.length>0&&<I id={ids.speech}><g data-part="speech-ribbon">{marks}</g></I>}
  {st.link>0&&<I id={ids.links}><HeroThread a={LINK_FROM} c1={[LINK_FROM[0]-20,LINK_FROM[1]-70]} c2={[LINK_TO[0]+34,LINK_TO[1]-94]} b={LINK_TO} p={st.link} color={pal.foreground} w={5}/></I>}
  {dTh&&st.design>0&&<I id={ids.design}><HeroThread {...dTh} p={st.design} color="#2F7C80" w={6}/></I>}
  {sTh&&st.statute>0&&<I id={ids.statute}><HeroThread {...sTh} p={st.statute} color={pal.ink} w={6}/></I>}
  {sTh&&st.statute>0&&<I id={ids.check}><g data-part="slot-label">
   {/* a short leader from the settled condition to the slot, drawn once the condition has arrived */}
   {leader>0&&<path d={`M${f2(anchorRest[0])} ${f2(anchorRest[1])}L${SLOT.x-SLOT.s/2-4} ${SLOT.y+16}`} stroke={pal.ink} strokeWidth={2.5} strokeDasharray="6 5"
    pathLength={1000} strokeDashoffset={f2(1000*(1-leader))}/>}
   <g transform={`translate(${f2(labelAt[0])} ${f2(labelAt[1])}) rotate(${f2(-3*(1-settle))} ${f2(LABEL.w)} ${f2(LABEL.h/2)})`}>
    <rect x={4} y={5} width={f2(LABEL.w)} height={f2(LABEL.h)} rx={8} fill={pal.ink} opacity={.16}/>
    <rect x={0} y={0} width={f2(LABEL.w)} height={f2(LABEL.h)} rx={8} fill="#F8DCC4" stroke={pal.accent} strokeWidth={2.5}/>
    {LABEL.lines.map((l,i)=><Txt key={i} x={12} y={12+LABEL_SIZE*1.16*(i+.86)} size={LABEL_SIZE} bold fill={pal.ink}>{l}</Txt>)}
   </g>
  </g></I>}
  {drawn>0&&<I id={ids.verify??ids.check}><g data-part="hover-check">
   {/* the outlined check comes down at full strength from above the screen's top edge and holds still over
       the slot; its soft shadow gathers on the page beside the slot as it nears, apart from the mark */}
   <ellipse cx={SLOT.x+14} cy={SLOT.y-6} rx={26} ry={9} fill={pal.ink} opacity={f2(.16*drawn)} filter="url(#nc1110-soft)"/>
   <g transform={`translate(${HOVER.x} ${f2(lerp(HOVER.from,HOVER.y,drawn))})`}><CheckOutline pal={pal}/></g>
  </g></I>}
  {st.reticle&&st.slot>0&&<g data-part="slot-reticle" stroke={pal.accent} strokeWidth={4.5} fill="none" strokeLinecap="round">
   {/* variant b's fixed point: four accent ticks round the slot, in world space, so every cut keeps them the same */}
   {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy],i)=>{const r=SLOT.s/2+13,k=15;
    return <path key={i} d={`M${f2(SLOT.x+sx*r)} ${f2(SLOT.y+sy*(r-k))}V${f2(SLOT.y+sy*r)}H${f2(SLOT.x+sx*(r-k))}`}/>;})}
  </g>}
  {st.cards>0&&<I id={ids.sources}><g data-part="source-cards">{SOURCE_CARDS.map((c,i)=>{
   // each card slides in from the camera's left frame edge, so it is never seen arriving from nothing
   const p=smooth(clamp((st.cards-i*.18)/(1-.36)));if(p<=0)return null;
   const from=st.edgeL-SOURCE_CARD.w-40;
   const x=lerp(from,c.x,p),y=c.y-26*Math.sin(Math.PI*p);
   const W=SOURCE_CARD.w,H=SOURCE_CARD.h;
   return <g key={i} transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(c.r-8*(1-p))})`}>
    <rect x={6} y={8} width={W} height={H} rx={6} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
    <path d={`M0 0H${W-14}L${W} 14V${H}H0Z`} fill={pal.paper} stroke={pal.ink} strokeWidth={2.5}/>
    <path d={`M${W-14} 0V14H${W}`} fill="#E2D7C0" stroke={pal.ink} strokeWidth={2}/>
    <Txt x={10} y={30} size={HERO_TYPE.card} bold fill={pal.ink}>{c.label}</Txt>
    <WordMarks x0={10} x1={W-24} y={54} h={8} seed={300+i} fill={pal.ink} opacity={.5}/>
    <WordMarks x0={10} x1={W-50} y={72} h={8} seed={320+i} fill={pal.ink} opacity={.5}/>
   </g>;})}</g></I>}
 </g>;
};
