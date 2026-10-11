import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';

/**
 * ChartHero, the fresh authored hero group for the 2026-10-09-claude-pilot edition.
 *
 * One patient chart carries the film: a worn hardboard clipboard with teal card-stock
 * dividers and a ruled record page with blank fields. One question card, one answer card
 * and ONE set of three citation cards travel through the film; nothing is ever duplicated
 * or clipped to the patient chart. The answer card carries its own two slots: a Sources slot
 * that fills when the citations arrive and an Accuracy slot that is drawn empty and never
 * filled. The release's unpublished measures hang from the answer card's own clip.
 *
 * Every tag hangs from a drawn pin at its local origin (0,0), so the episode places the pin
 * on a real surface: a rail, the record boundary, the share bar or the answer's clip. Tag
 * bodies are sized from the measured text, so no line runs past its tag.
 *
 * Disclosed explanatory illustration. Nothing here is UTMB's screen, a vendor interface,
 * any answer's content, a clinician, a patient or patient detail. Every field is a blank bar.
 *
 * Light: a soft Gulf Coast window key from the upper left with a cool fill from the right.
 * Highlights sit on upper-left edges, cast shadows fall down and right, and every object has
 * a contact shadow on what it rests on. Corners, tabs and edges carry seeded hand-made
 * irregularity and small wear. Pure function of its props; the episode drives every prop
 * from the film frame clock.
 */

type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
export type TagId = 'announced'|'live'|'report'|'accuracy'|'care'|'evaluating'|'decision';
export type CitationKind = 'literature'|'guidelines'|'other';
export type ChartHeroProps =
 | {part:'chart'; seed?:number}
 | {part:'question'; typed:number; plain?:number; lift?:number}
 | {part:'answer'; sources?:number; ring?:number; limits?:number; limitText?:number; lift?:number}
 | {part:'citation'; kind:CitationKind; lift?:number; glow?:number}
 | {part:'tag'; tag:TagId; swing?:number; second?:number; drop?:number; side?:'left'|'right'}
 | {part:'thread'; from:[number,number]; to:[number,number]; reach:number};

/** Fixed sizes of each part in its own local units; the episode positions them. */
export const HERO_SIZE = {chart:[340,470], question:[250,150], answer:[344,250], citation:[320,184]} as const;
/** Answer-card anchors in its local units, for threads and camera details. */
export const ANSWER_SOURCES:[number,number]=[96,182];
export const ANSWER_ACCURACY:[number,number]=[254,182];
export const ANSWER_CLIP:[number,number]=[14,6];

const TAG_SIZE=25, TAG_X=52, TAG_PAD=26;
const TAGS: Record<TagId,{lines:[string,string];tone:'hero'|'accent'|'ink';open?:boolean}> = {
 announced:{lines:['Announced','September 22nd'],tone:'hero'},
 live:{lines:['Live since','March'],tone:'hero'},
 report:{lines:["UTMB's own",'report'],tone:'ink'},
 accuracy:{lines:['Accuracy','Not in release'],tone:'accent',open:true},
 care:{lines:['Patient care','Not in release'],tone:'accent',open:true},
 evaluating:{lines:['Evaluating use','and experience'],tone:'hero'},
 decision:{lines:['Clinical','decision support'],tone:'hero'},
};
/** Tag body width from the measured type plus the open-slot glyph, never a fixed guess. */
export function tagWidth(tag:TagId):number{
 const spec=TAGS[tag];
 const text=Math.max(...spec.lines.map(l=>widthOf(l,TAG_SIZE,true)));
 return Math.ceil(TAG_X+text+TAG_PAD+(spec.open?40:0));
}
export const TAG_HEIGHT=108;
/** The tag body hangs this far below and right of its pin. */
export const TAG_DROP:[number,number]=[-14,34];

const CITATIONS: Record<CitationKind,{label:string;tone:'hero'|'midground'|'accent'}> = {
 literature:{label:'Medical literature',tone:'hero'},
 guidelines:{label:'Clinical guidelines',tone:'midground'},
 other:{label:'Other sources',tone:'accent'},
};

const clamp = (v:number) => Math.min(1, Math.max(0, v));
const hash = (n:number) => {const s = Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s);};
/** Seeded hand wobble: the same seed always draws the same lopsided edge. */
const wob = (seed:number, i:number, amp:number) => (hash(seed*31.7+i*7.3)-.5)*2*amp;
/** A rounded rectangle whose corners and edges are each a little different. */
export function handRect(x:number,y:number,w:number,h:number,r:number,seed:number,amp=2.2):string{
 const j=(i:number)=>wob(seed,i,amp), rr=(i:number)=>Math.max(2,r+wob(seed,20+i,r*.35));
 const tl=[x+j(1),y+j(2)],tr=[x+w+j(3),y+j(4)],br=[x+w+j(5),y+h+j(6)],bl=[x+j(7),y+h+j(8)];
 return `M${tl[0]+rr(0)} ${tl[1]}Q${(tl[0]+tr[0])/2} ${tl[1]+j(9)} ${tr[0]-rr(1)} ${tr[1]}`
  +`Q${tr[0]} ${tr[1]} ${tr[0]} ${tr[1]+rr(1)}Q${tr[0]+j(10)} ${(tr[1]+br[1])/2} ${br[0]} ${br[1]-rr(2)}`
  +`Q${br[0]} ${br[1]} ${br[0]-rr(2)} ${br[1]}Q${(bl[0]+br[0])/2} ${br[1]+j(11)} ${bl[0]+rr(3)} ${bl[1]}`
  +`Q${bl[0]} ${bl[1]} ${bl[0]} ${bl[1]-rr(3)}Q${bl[0]+j(12)} ${(tl[1]+bl[1])/2} ${tl[0]} ${tl[1]+rr(0)}`
  +`Q${tl[0]} ${tl[1]} ${tl[0]+rr(0)} ${tl[1]}Z`;
}
const usePal = ():Pal => {
 const ad = useArtDirection();
 if (!ad) throw new Error('Chart hero requires the executed art direction profile');
 return ad.palette;
};
export const mix = (a:string,b:string,t:number) => {
 const p=(h:string)=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
 const [x,y]=[p(a),p(b)];
 return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*clamp(t)).toString(16).padStart(2,'0')).join('');
};

/** Shared filters and gradients. Ids are stable so repeated parts reuse identical definitions. */
const Defs:React.FC<{c:Pal}> = ({c}) => <defs>
 <filter id="ch-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>
 <filter id="ch-softer" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
 <filter id="ch-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={11} result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .32  0 0 0 0 .27  0 0 0 0 .2  0 0 0 .085 0" result="g"/>
  <feComposite in="g" in2="SourceAlpha" operator="in" result="gg"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gg"/></feMerge>
 </filter>
 <linearGradient id="ch-board" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#8E7A60"/><stop offset=".55" stopColor="#6E5D49"/><stop offset="1" stopColor="#56493B"/>
 </linearGradient>
 <linearGradient id="ch-paper" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={mix(c.paper,'#ffffff',.35)}/><stop offset=".6" stopColor={c.paper}/><stop offset="1" stopColor={mix(c.paper,c.midground,.22)}/>
 </linearGradient>
 <linearGradient id="ch-steel" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#E9ECEA"/><stop offset=".35" stopColor="#B8BFBE"/><stop offset=".7" stopColor="#7F8A8B"/><stop offset="1" stopColor="#A9B2B1"/>
 </linearGradient>
 <linearGradient id="ch-teal" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor={mix(c.hero,'#ffffff',.22)}/><stop offset="1" stopColor={mix(c.hero,c.ink,.25)}/>
 </linearGradient>
 <linearGradient id="ch-fill" x1="0" y1="0" x2="1" y2="0">
  <stop offset=".55" stopColor="#B9D3D6" stopOpacity={0}/><stop offset="1" stopColor="#B9D3D6" stopOpacity={.22}/>
 </linearGradient>
</defs>;

/** Drop shadow that tightens as the object settles onto its surface. */
const Shadow:React.FC<{w:number;h:number;lift:number;c:Pal;r?:number}> = ({w,h,lift,c,r=14}) =>
 <g opacity={.34-.16*clamp(lift)} filter={lift>.35?'url(#ch-softer)':'url(#ch-soft)'}>
  <rect x={8+20*lift} y={12+30*lift} width={w} height={h} rx={r} fill={c.ink}/>
 </g>;

const Label:React.FC<{x:number;y:number;size:number;fill:string;weight?:number;children:React.ReactNode;anchor?:'start'|'middle'|'end'}> =
 ({x,y,size,fill,weight=700,children,anchor='start'}) =>
 <text x={x} y={y} fontFamily={FONT.body} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}>{children}</text>;

/** A brass push pin seen from the front; the tag string ends on its head. */
const Pin:React.FC<{c:Pal}> = ({c}) => <g data-subject="tag pin">
 <ellipse cx={3} cy={7} rx={10} ry={5} fill={c.ink} opacity={.28} filter="url(#ch-soft)"/>
 <circle r={9} fill="#B8924E" stroke="#6E5530" strokeWidth={2}/>
 <circle cx={-3} cy={-3} r={3} fill="#F3DFAE"/>
</g>;

const Chart:React.FC<{c:Pal;seed:number}> = ({c,seed}) => {
 const [W,H]=HERO_SIZE.chart;
 const tabs=[64,150,238,322];
 const tabFill=[ 'url(#ch-teal)', mix(c.hero,c.paper,.35), mix(c.hero,c.midground,.45), mix(c.hero,c.paper,.15)];
 return <g data-hero="patient-chart">
  <Shadow w={W} h={H} lift={0} c={c} r={18}/>
  {tabs.map((y,i)=><path key={i} d={handRect(W-26,y+wob(seed,40+i,5),58+wob(seed,50+i,5),66+wob(seed,60+i,6),9,seed+i)}
   fill={tabFill[i]} stroke={mix(c.hero,c.ink,.45)} strokeWidth={2}/>)}
  {tabs.map((y,i)=><path key={'e'+i} d={`M${W+20+wob(seed,70+i,3)} ${y+12}v${40+wob(seed,80+i,6)}`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={3} strokeLinecap="round"/>)}
  <path d={handRect(0,0,W,H,18,seed)} fill="url(#ch-board)" stroke="#3F352B" strokeWidth={3}/>
  <path d={`M${W-30} ${H-2}q14 -3 26 -18`} stroke="#A99576" strokeWidth={3} fill="none" opacity={.7}/>
  <path d="M6 120q-2 26 1 54M10 300q-3 18 0 40" stroke="#A99576" strokeWidth={2} fill="none" opacity={.6}/>
  <path d={handRect(10,10,W-20,H-20,14,seed+3,1.5)} fill="none" stroke="#ffffff" strokeOpacity={.12} strokeWidth={2}/>
  {/* the ruled record page; blank fields only, never patient detail */}
  <g filter="url(#ch-grain)">
   <path d={handRect(22,56,W-46,H-82,6,seed+5,1.6)} fill="url(#ch-paper)" stroke={mix(c.paper,c.ink,.35)} strokeWidth={1.5}/>
  </g>
  <path d={`M${W-24-34} ${H-26}l34 -34v34z`} fill={mix(c.paper,c.midground,.35)} stroke={mix(c.paper,c.ink,.35)} strokeWidth={1.2}/>
  <path d={`M${W-24-34} ${H-26}l34 -34`} stroke="#ffffff" strokeOpacity={.6} strokeWidth={1.5}/>
  <rect x={44} y={86} width={118} height={16} rx={5} fill={mix(c.paper,c.midground,.42)}/>
  <rect x={176} y={86} width={70} height={16} rx={5} fill={mix(c.paper,c.midground,.3)}/>
  <rect x={44} y={112} width={86} height={12} rx={4} fill={mix(c.paper,c.midground,.26)}/>
  <path d={`M60 ${132}V${H-34}`} stroke={c.hero} strokeOpacity={.45} strokeWidth={2}/>
  {Array.from({length:12},(_,i)=><path key={i} d={`M36 ${146+i*24+wob(seed,90+i,.8)}H${W-34+wob(seed,110+i,4)}`}
   stroke="#9FB4B8" strokeOpacity={.5} strokeWidth={1.4}/>)}
  {[0,1,2,3,4,5].map(i=><rect key={i} x={70} y={152+i*48} width={70+hash(seed+i)*130} height={9} rx={4}
   fill={mix(c.paper,c.ink,.18)} opacity={.55}/>)}
  <path d={`M66 ${H-82}a28 22 0 1 1 18 26`} fill="none" stroke="#7A6248" strokeOpacity={.08} strokeWidth={4}/>
  <g transform={`translate(${W/2-74+wob(seed,150,4)} -18)`}>
   <ellipse cx={74} cy={74} rx={86} ry={12} fill={c.ink} opacity={.22} filter="url(#ch-soft)"/>
   <path d="M0 26Q2 4 24 2H124Q148 4 150 26V60Q148 72 132 72H18Q2 72 0 60Z" fill="url(#ch-steel)" stroke="#5E6767" strokeWidth={2.5}/>
   <path d="M12 14H138" stroke="#ffffff" strokeOpacity={.7} strokeWidth={3} strokeLinecap="round"/>
   <circle cx={22} cy={58} r={5} fill="#6F7979"/><circle cx={128} cy={58} r={5} fill="#6F7979"/>
   <path d="M30 26Q74 -22 118 26" fill="none" stroke="#5E6767" strokeWidth={9} strokeLinecap="round"/>
   <path d="M30 26Q74 -22 118 26" fill="none" stroke="#DDE2E1" strokeWidth={4} strokeLinecap="round"/>
  </g>
  <rect x={0} y={0} width={W} height={H} fill="url(#ch-fill)" opacity={.9} rx={18}/>
 </g>;
};

const Question:React.FC<{c:Pal;typed:number;plain:number;lift:number}> = ({c,typed,plain,lift}) => {
 const [W,H]=HERO_SIZE.question;
 const words=[[24,58],[90,40],[138,72],[24,34],[66,86],[160,44]];
 const rows=[66,96];
 const shown=clamp(typed)*words.length;
 const lineOf=(i:number)=>i<3?0:1;
 const last=Math.min(words.length-1,Math.floor(shown));
 const caretX=shown>=words.length?null:words[last][0]+words[last][1]*clamp(shown-last)+4;
 return <g data-subject="question-card">
  <Shadow w={W} h={H} lift={lift} c={c}/>
  <g filter="url(#ch-grain)"><path d={handRect(0,0,W,H,12,7)} fill="url(#ch-paper)" stroke={mix(c.paper,c.ink,.4)} strokeWidth={2}/></g>
  <path d={handRect(0,0,W,40,12,8,1.2)+`M0 26H${W}V40H0Z`} fill="url(#ch-teal)"/>
  <Label x={16} y={30} size={25} fill="#ffffff">Question</Label>
  {words.map((w,i)=>{const p=clamp(shown-i);return p>0&&<rect key={i} x={w[0]} y={rows[lineOf(i)]-14} width={w[1]*p} height={14} rx={5}
   fill={c.ink} opacity={.78}/>;})}
  {caretX!==null&&<rect x={caretX} y={rows[lineOf(last)]-20} width={4} height={24} fill={c.hero}/>}
  <g opacity={clamp(plain)}>
   <path d={handRect(10,H-42,232,34,12,9,1)} fill={mix(c.hero,c.paper,.75)} stroke={c.hero} strokeWidth={2}/>
   <Label x={20} y={H-17} size={24} fill={mix(c.hero,c.ink,.4)}>Plain language</Label>
  </g>
  <path d={`M${W-18} ${H-2}q10 -2 16 -12`} stroke={mix(c.paper,c.ink,.3)} strokeWidth={2} fill="none"/>
  <rect x={0} y={0} width={W} height={H} rx={12} fill="url(#ch-fill)"/>
 </g>;
};

/** The tag body with its string up to a pin at local (0,0). It hangs right of the pin, or
 * left of it when `side` is left; `drop` lengthens the string so stacked tags never overlap. */
const Tag:React.FC<{c:Pal;tag:TagId;swing:number;second:number;drop:number;side:'left'|'right'}> = ({c,tag,swing,second,drop,side}) => {
 const spec=TAGS[tag];
 const W=tagWidth(tag), H=TAG_HEIGHT;
 const tone=spec.tone==='hero'?c.hero:spec.tone==='accent'?c.accent:c.ink;
 const seed=tag.length*13+tag.charCodeAt(0);
 const dx=side==='left'?-W-4:TAG_DROP[0], dy=TAG_DROP[1]+drop;
 const shape=`M28 ${wob(seed,1,2)}H${W+wob(seed,2,3)}Q${W+4} ${H/2} ${W+wob(seed,3,3)} ${H}H28L${wob(seed,4,2)} ${H-28}V28Z`;
 return <g data-subject={'tag '+tag}>
  <g transform={`rotate(${swing})`}>
   <path d={`M0 0C4 ${dy*.4} ${dx+10} ${dy+H/2-30} ${dx+18} ${dy+H/2}`} stroke={mix(c.paper,c.ink,.45)} strokeWidth={2.5} fill="none"/>
   <g transform={`translate(${dx} ${dy})`}>
    <g opacity={.3} filter="url(#ch-soft)"><path d={shape} transform="translate(8 12)" fill={c.ink}/></g>
    <g filter="url(#ch-grain)"><path d={shape} fill={mix(c.paper,'#ffffff',.2)} stroke={mix(tone,c.ink,.25)} strokeWidth={2.5}/></g>
    <path d={`M30 6V${H-6}`} stroke={tone} strokeWidth={8} strokeOpacity={.85}/>
    <circle cx={18} cy={H/2} r={9} fill={c.paper} stroke={mix(c.paper,c.ink,.5)} strokeWidth={3}/>
    <Label x={TAG_X} y={44} size={TAG_SIZE} fill={c.ink}>{spec.lines[0]}</Label>
    <g opacity={clamp(second)}><Label x={TAG_X} y={80} size={TAG_SIZE} fill={spec.tone==='accent'?mix(c.accent,c.ink,.3):mix(tone,c.ink,.15)}>{spec.lines[1]}</Label></g>
    {spec.open&&<rect x={W-42} y={H/2-12} width={24} height={24} rx={4} fill="none" stroke={c.accent} strokeWidth={3}/>}
   </g>
  </g>
  <Pin c={c}/>
 </g>;
};

/** The returned answer. Its Sources slot fills when the citations arrive; its Accuracy slot stays empty. */
const Answer:React.FC<{c:Pal;sources:number;ring:number;limits:number;limitText:number;lift:number}> = ({c,sources,ring,limits,limitText,lift}) => {
 const [W,H]=HERO_SIZE.answer;
 const bars=[[20,66,206],[20,92,164],[20,118,190]];
 const chips=[c.hero,mix(c.midground,c.ink,.25),c.accent];
 const s=clamp(sources);
 return <g data-subject="answer-card">
  <Shadow w={W} h={H} lift={lift} c={c}/>
  <g filter="url(#ch-grain)"><path d={handRect(0,0,W,H,14,17)} fill="url(#ch-paper)" stroke={mix(c.paper,c.ink,.45)} strokeWidth={2}/></g>
  <path d={handRect(0,0,W,46,14,18,1.2)+`M0 30H${W}V46H0Z`} fill={mix(c.ink,c.foreground,.3)}/>
  <Label x={18} y={33} size={27} fill="#ffffff">Answer</Label>
  {bars.map((b,i)=><rect key={i} x={b[0]} y={b[1]-10} width={b[2]} height={10} rx={4} fill={mix(c.paper,c.ink,.32)}/>)}
  {/* Sources slot: three source-type chips slide in as the citations arrive */}
  <g data-subject="sources-slot">
   <path d={handRect(16,140,152,92,10,19,1.2)} fill={mix(c.paper,c.hero,.08+.1*s)} stroke={c.hero} strokeWidth={2.5}/>
   <Label x={26} y={170} size={27} fill={mix(c.hero,c.ink,.35)}>Sources</Label>
   {chips.map((col,i)=><g key={i} opacity={clamp(s*3-i)} transform={`translate(${30+i*44} ${186+12*(1-clamp(s*3-i))})`}>
    <path d={handRect(0,0,36,30,6,40+i,1)} fill={col} stroke={c.ink} strokeOpacity={.35} strokeWidth={1.5}/>
    <path d="M7 10H29M7 19H22" stroke="#ffffff" strokeOpacity={.8} strokeWidth={3} strokeLinecap="round"/>
   </g>)}
  </g>
  {/* Accuracy slot: drawn empty and never filled */}
  <g data-subject="accuracy-slot unmarked-answer">
   <path d={handRect(178,140,152,92,10,21,1.2)} fill="none" stroke={c.accent} strokeWidth={3} strokeDasharray="9 7"/>
   <Label x={188} y={170} size={25} fill={mix(c.accent,c.ink,.35)}>Accuracy</Label>
   <circle cx={ANSWER_ACCURACY[0]} cy={ANSWER_ACCURACY[1]+18} r={17} fill="none" stroke={c.accent} strokeWidth={3} strokeDasharray="6 5"/>
   {ring>0&&<circle cx={ANSWER_ACCURACY[0]} cy={ANSWER_ACCURACY[1]+18} r={17+22*clamp(ring)} fill="none" stroke={c.accent} strokeWidth={3} opacity={.7*(1-clamp(ring))}/>}
  </g>
  {/* the answer's own clip, from which the release's unpublished measures hang */}
  <g transform={`translate(${ANSWER_CLIP[0]-26} -12)`} data-subject="answer clip">
   <path d="M0 8Q0 0 8 0H44Q52 0 52 8V24H0Z" fill="url(#ch-steel)" stroke="#5E6767" strokeWidth={2}/>
   <path d="M8 4H44" stroke="#ffffff" strokeOpacity={.7} strokeWidth={2}/>
  </g>
  {limits>0&&<g data-subject="unmeasured-tags">
   {(['accuracy','care'] as const).map((tag,i)=>{const p=clamp(limits*1.6-i*.6);
    return p>0&&<g key={tag} transform={`translate(${ANSWER_CLIP[0]} ${ANSWER_CLIP[1]+6}) rotate(${4-i*6})`} opacity={clamp(p*3)}>
     <g transform={`translate(0 ${-60*(1-p)})`}><Tag c={c} tag={tag} swing={-12*(1-p)} second={limitText} drop={i*124} side="left"/></g>
    </g>;})}
  </g>}
  <rect x={0} y={0} width={W} height={H} rx={14} fill="url(#ch-fill)"/>
 </g>;
};

const Glyph:React.FC<{kind:CitationKind;ink:string;x:number;y:number}> = ({kind,ink,x,y}) => {
 if (kind==='literature') return <g transform={`translate(${x} ${y})`} stroke={ink} strokeWidth={3} fill="none" strokeLinejoin="round">
  <path d="M0 8Q22 0 44 8V56Q22 48 0 56Z"/><path d="M44 8Q66 0 88 8V56Q66 48 44 56Z"/>
  <path d="M8 20Q22 15 36 20M8 32Q22 27 36 32M52 20Q66 15 80 20M52 32Q66 27 80 32" strokeOpacity={.55} strokeWidth={2}/>
 </g>;
 if (kind==='guidelines') return <g transform={`translate(${x} ${y})`} stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
  {[0,1,2].map(i=><g key={i}><circle cx={6} cy={10+i*20} r={5} fill={ink}/><path d={`M20 ${10+i*20}H${70-i*12}`}/></g>)}
  <path d="M0 -4H80" strokeOpacity={.4}/>
 </g>;
 return <g transform={`translate(${x} ${y})`} stroke={ink} strokeWidth={3} fill="none" strokeLinejoin="round">
  <path d="M14 0H58L70 12V54H14Z"/><path d="M6 8V62H58" strokeOpacity={.6}/><path d="M24 22H58M24 34H52" strokeOpacity={.5} strokeWidth={2}/>
 </g>;
};

const Citation:React.FC<{c:Pal;kind:CitationKind;lift:number;glow:number}> = ({c,kind,lift,glow}) => {
 const [W,H]=HERO_SIZE.citation;
 const spec=CITATIONS[kind];
 const tone=spec.tone==='hero'?c.hero:spec.tone==='accent'?c.accent:mix(c.midground,c.ink,.25);
 const seed=kind==='literature'?31:kind==='guidelines'?37:41;
 return <g data-subject={'citation-cards source-types '+kind}>
  <Shadow w={W} h={H} lift={lift} c={c}/>
  {glow>0&&<rect x={-10} y={-10} width={W+20} height={H+20} rx={20} fill={tone} opacity={.35*clamp(glow)} filter="url(#ch-soft)"/>}
  <path d={handRect(0,14,W,H-14,12,seed)} fill={mix(tone,c.paper,.82)} stroke={mix(tone,c.ink,.35)} strokeWidth={2.5} filter="url(#ch-grain)"/>
  <path d={handRect(6+wob(seed,1,3),0,302+wob(seed,2,4),50,11,seed+1,1.4)} fill={tone} stroke={mix(tone,c.ink,.4)} strokeWidth={2}/>
  <Label x={18} y={34} size={23} fill="#ffffff">{spec.label}</Label>
  <Glyph kind={kind} ink={mix(tone,c.ink,.3)} x={22} y={80}/>
  {[0,1,2].map(i=><rect key={i} x={128} y={86+i*24} width={128-i*26+wob(seed,9+i,8)} height={9} rx={4} fill={mix(tone,c.ink,.2)} opacity={.4}/>)}
  <path d={`M${W-26} ${H-4}q12 -2 22 -16`} stroke={mix(tone,c.ink,.3)} strokeWidth={2} fill="none" opacity={.6}/>
  <rect x={0} y={14} width={W} height={H-14} rx={12} fill="url(#ch-fill)"/>
 </g>;
};

const Thread:React.FC<{c:Pal;from:[number,number];to:[number,number];reach:number}> = ({c,from,to,reach}) => {
 const p=clamp(reach);
 const mid:[number,number]=[(from[0]+to[0])/2,Math.min(from[1],to[1])-70];
 const x=(1-p)*(1-p)*from[0]+2*(1-p)*p*mid[0]+p*p*to[0], y=(1-p)*(1-p)*from[1]+2*(1-p)*p*mid[1]+p*p*to[1];
 const cx=(1-p)*from[0]+p*mid[0], cy=(1-p)*from[1]+p*mid[1];
 return <g data-subject="citation pointer">
  <path d={`M${from[0]} ${from[1]}Q${cx} ${cy} ${x} ${y}`} fill="none" stroke={c.hero} strokeWidth={5} strokeLinecap="round"/>
  <circle cx={from[0]} cy={from[1]} r={8} fill={c.hero}/>
  {p>.02&&<circle cx={x} cy={y} r={10} fill={c.paper} stroke={c.hero} strokeWidth={4}/>}
 </g>;
};

/** The single entry point of the hero group. */
export const ChartHero:React.FC<ChartHeroProps> = (props) => {
 const c=usePal();
 let body:React.ReactNode;
 switch(props.part){
 case 'chart':body=<Chart c={c} seed={props.seed??3}/>;break;
 case 'question':body=<Question c={c} typed={props.typed} plain={props.plain??0} lift={props.lift??0}/>;break;
 case 'answer':body=<Answer c={c} sources={props.sources??0} ring={props.ring??0} limits={props.limits??0} limitText={props.limitText??1} lift={props.lift??0}/>;break;
 case 'citation':body=<Citation c={c} kind={props.kind} lift={props.lift??0} glow={props.glow??0}/>;break;
 case 'tag':body=<Tag c={c} tag={props.tag} swing={props.swing??0} second={props.second??1} drop={props.drop??0} side={props.side??'right'}/>;break;
 case 'thread':body=<Thread c={c} from={props.from} to={props.to} reach={props.reach}/>;break;
 }
 return <g data-art-group="chart-and-citations"><Defs c={c}/>{body}</g>;
};
