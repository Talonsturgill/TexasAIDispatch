import React from 'react';
import {FONT,widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';
import {TUBES,RECIPE} from './FoundryArmHero';

/**
 * FoundrySupport, the fresh authored support group for the 2026-10-25 edition (alloy-foundry-v1).
 *
 * The arm's world and its records, every piece drawn for this story:
 *  - a periodic table cabinet: the release asks the reader to imagine the periodic table as a wall
 *    cabinet of elements, so each tile is a small drawer with a pull, and the tiles light amber one by
 *    one; a mesh of fine lines weaves between the lit tiles and one candidate point glows;
 *  - hand sized recipe cards with ruled lines and three swatches (the AI's card carries a cool blue
 *    stripe and the recipe tubes' own colours), a pile of them, a lab tray, a pencil, and a gloved
 *    hand in a lab coat cuff that sorts them;
 *  - a plain news release card that writes its headline in, a crooked rubber dateline stamp, paper tags
 *    on strings, a pencil outline of a foundry bay on blueprint paper, and a PLANNED stamp;
 *  - a flat AI panel on a pole that writes a recipe card, a quote card that writes its speaker's name,
 *    a computer monitor with a bar gauge, a question mark;
 *  - a wall calendar whose month pages flip away, a seven cell week strip, a GOAL stamp, an opening
 *    date form field left blank with a dash;
 *  - lab benches, a desk, an easel board, a bench top seen from above, a speckled floor, a mug, a
 *    beaker.
 *
 * Text printed here is only what the verified claims and the validated script support. Maintained but
 * worn: a dog eared corner, a coffee ring, a leaning stamp, a scuffed bench edge. Nothing symmetric.
 * Light: window key from the upper left, cool fill from the right. Pure function of its props: no clock,
 * no state, no random input; the tile order and mesh are fixed integer sequences. Disclosed
 * illustration of the release and its plan, no Texas A&M mark, building, person or measured result.
 */

export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);

export const SUPPORT_PAINT={paper:'#F1EAD8',paperShade:'#DCD2BC',card:'#F7F1E3',line:'#B9B0A0',ink:'#1B2227',inkSoft:'#4A5258',
 amber:'#E48A1C',amberLit:'#FFC064',amberDeep:'#B9650E',ai:'#4E8FA6',aiLit:'#9BD0DF',aiDeep:'#2F6378',slate:'#5E7F99',
 steel:'#8D959B',steelLit:'#BEC5CA',steelDark:'#5C646A',trim:'#262C31',epoxy:'#363C40',epoxyLit:'#5A6267',wood:'#A57C55',woodLit:'#C29B72',
 woodShade:'#7C5A3B',blueprint:'#DCE6EB',bpLine:'#3D6A86',stampRed:'#A13F2F',glove:'#6C84C0',gloveLit:'#93A8DA',gloveShade:'#4C6197',
 coat:'#F4F2EC',coatShade:'#C9C6BD',floor:'#A8A296',floorLit:'#BDB7AA',floorShade:'#8B8579',pencil:'#E3C14B',pencilShade:'#B8962C'};

// ---- the periodic table cabinet ---------------------------------------------------------------------
export const PT={cell:40,gap:4,fGap:16,pad:26};
type Tile={col:number;row:number;x:number;y:number};
/** The standard long form outline: 18 groups, 7 periods, the two f rows set below. */
export const TILES:Tile[]=(()=>{
 const out:Tile[]=[];const add=(col:number,row:number)=>out.push({col,row,x:col*PT.cell,y:row*PT.cell+(row>6?PT.fGap:0)});
 add(0,0);add(17,0);
 for(const r of [1,2]){add(0,r);add(1,r);for(let c=12;c<18;c++)add(c,r);}
 for(const r of [3,4,5,6])for(let c=0;c<18;c++)add(c,r);
 for(const r of [7,8])for(let c=2;c<17;c++)add(c,r);
 return out;
})();
export const PT_W=18*PT.cell,PT_H=9*PT.cell+PT.fGap;
/** The cabinet's outer box about its centre. */
export const CABINET={w:PT_W+2*PT.pad,h:PT_H+2*PT.pad+18};
/** Several dozen tiles, lit in a fixed order spread over the table (an integer stride, never random). */
export const LIT_COUNT=36;
export const LIT_ORDER:number[]=(()=>{const n=TILES.length,out:number[]=[];
 // 47 is coprime with the tile count, so i*47+13 visits every tile once; the first 36 main-table tiles win
 for(let i=0;i<n&&out.length<LIT_COUNT;i++){const k=(i*47+13)%n;if(TILES[k].row<7)out.push(k);}
 if(out.length!==LIT_COUNT)throw new Error('Periodic tile order is short');return out;})();
/** The mesh: every lit tile tied to three later ones by a fine curved line. */
export const MESH:[number,number][]=(()=>{const out:[number,number][]=[];
 for(let i=0;i<LIT_COUNT;i++)for(const d of [5,11,17])out.push([i,(i+d)%LIT_COUNT]);return out;})();
const tileCentre=(k:number):Pt=>[TILES[k].x+PT.cell/2-PT_W/2,TILES[k].y+PT.cell/2-PT_H/2];
/** The candidate point the mesh settles on, cabinet units about the centre. */
export const CANDIDATE:Pt=(()=>{
 // the mesh crossing nearest the table's centre-left, so its tag can hang to the right inside the frame
 let best:Pt=[0,0],d=1e9;
 for(const [i,j] of MESH){const a=tileCentre(LIT_ORDER[i]),b=tileCentre(LIT_ORDER[j]),m:Pt=[(a[0]+b[0])/2,(a[1]+b[1])/2],e=Math.hypot(m[0]+150,m[1]+20);if(e<d){d=e;best=m;}}
 return best;})();
const Periodic:React.FC<{lit:number;mesh:number;candidate:number;t:number;frame?:boolean}>=({lit,mesh,candidate,t,frame=true})=>{
 const P=SUPPORT_PAINT,id=useUid('fs-pt'),c=PT.cell,g=PT.gap;
 const litOf=(k:number)=>{const i=LIT_ORDER.indexOf(k);return i<0?0:clamp(lit-i);};
 return <g data-part="periodic-cabinet">
  <defs><radialGradient id={id+'l'} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor={P.amberLit}/><stop offset="1" stopColor={P.amber}/></radialGradient>
   <radialGradient id={id+'c'} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFF4DA" stopOpacity={1}/><stop offset=".4" stopColor={P.amberLit} stopOpacity={.7}/><stop offset="1" stopColor={P.amber} stopOpacity={0}/></radialGradient></defs>
  {frame&&<g>
   <rect x={-CABINET.w/2+10} y={-CABINET.h/2+14} width={CABINET.w} height={CABINET.h} rx={18} fill="#14181B" opacity={.25}/>
   <rect x={-CABINET.w/2} y={-CABINET.h/2} width={CABINET.w} height={CABINET.h} rx={16} fill={P.steelDark} stroke={P.trim} strokeWidth={4}/>
   <rect x={-CABINET.w/2+8} y={-CABINET.h/2+8} width={CABINET.w-16} height={CABINET.h-16} rx={11} fill="#2B3135"/>
   <path d={`M${-CABINET.w/2+16} ${-CABINET.h/2+6}H${CABINET.w/2-60}`} stroke={P.steelLit} strokeWidth={4} strokeLinecap="round" opacity={.7}/>
   <rect x={CABINET.w/2-90} y={CABINET.h/2-20} width={60} height={7} rx={3} fill={P.steel}/>
   <circle cx={-CABINET.w/2+22} cy={CABINET.h/2-17} r={4} fill={lit>0?P.amberLit:P.steel}/>
  </g>}
  <g transform={`translate(${-PT_W/2} ${-PT_H/2})`}>
   {TILES.map((tl,k)=>{const L=litOf(k),x=tl.x+g/2,y=tl.y+g/2,w=c-g;
    return <g key={k}>
     {/* a drawer of the element cabinet: dark slate until it lights amber */}
     <rect x={x} y={y} width={w} height={w} rx={5} fill={tl.row>6?'#343B41':'#3C454C'} stroke="#5F686F" strokeWidth={1.2}/>
     <path d={`M${x+2} ${y+3}h${w-8}`} stroke="#6B757C" strokeWidth={1.4} opacity={.8}/>
     {L>0&&<rect x={x} y={y} width={w} height={w} rx={5} fill={`url(#${id}l)`} opacity={L}/>}
     <path d={`M${x+7} ${y+11}h${7+(k*7)%6}M${x+7} ${y+17}h${4+(k*3)%5}`} stroke={L>.5?'#5A3307':'#8D969C'} strokeWidth={2.2} strokeLinecap="round"/>
     <path d={`M${x+w/2-7} ${y+w-7}h14`} stroke={L>.5?'#7A4710':'#7C868D'} strokeWidth={2.4} strokeLinecap="round"/>
     {L>0&&<rect x={x-3} y={y-3} width={w+6} height={w+6} rx={7} fill="none" stroke={P.amberLit} strokeWidth={2} opacity={.5*L*(1-clamp(lit-LIT_ORDER.indexOf(k)-1.5))}/>}
    </g>;})}
  </g>
  {/* the mesh of possible mixes: fine curved lines between lit tiles, drawn on in order */}
  {mesh>0&&<g data-part="mesh" fill="none">
   {MESH.map(([i,j],m)=>{const a=tileCentre(LIT_ORDER[i]),b=tileCentre(LIT_ORDER[j]);
    const p=clamp(mesh*1.7-m/MESH.length*.7);if(p<=0)return null;
    const mx=(a[0]+b[0])/2+((m*29)%60-30),my=(a[1]+b[1])/2+((m*17)%50-25);
    return <path key={m} d={`M${f2(a[0])} ${f2(a[1])}Q${f2(mx)} ${f2(my)} ${f2(b[0])} ${f2(b[1])}`} stroke={m%3?'#F5E7C8':'#FFD08A'} strokeWidth={m%4?1.3:2}
     opacity={.75} pathLength={1} strokeDasharray={1} strokeDashoffset={f2(1-p)}/>;})}
  </g>}
  {candidate>0&&<g data-part="candidate">
   <circle cx={CANDIDATE[0]} cy={CANDIDATE[1]} r={46+6*Math.sin(t*4)} fill={`url(#${id}c)`} opacity={candidate}/>
   <circle cx={CANDIDATE[0]} cy={CANDIDATE[1]} r={8} fill="#FFF6E0" stroke={P.amberDeep} strokeWidth={2.4} opacity={candidate}/>
   <circle cx={CANDIDATE[0]} cy={CANDIDATE[1]} r={16+10*smooth(candidate)} fill="none" stroke="#FFF6E0" strokeWidth={2} opacity={.8*candidate}/>
  </g>}
 </g>;};
/** The cabinet standing on two splayed legs (the room view in s1 and s2). Base on y 0, centre above. */
const CabinetStand:React.FC<{h:number}>=({h})=>{const P=SUPPORT_PAINT;
 return <g data-part="cabinet-stand">
  <ellipse cx={20} cy={2} rx={CABINET.w*.45} ry={12} fill="#14181B" opacity={.2}/>
  {[-1,1].map(s=><g key={s}><path d={`M${s*CABINET.w*.3} ${-h}L${s*CABINET.w*.34+s*14} 0`} stroke={P.steelDark} strokeWidth={18} strokeLinecap="round"/>
   <path d={`M${s*CABINET.w*.3-6} ${-h}L${s*CABINET.w*.34+s*14-6} -6`} stroke={P.steelLit} strokeWidth={3} opacity={.6}/>
   <rect x={s*CABINET.w*.34+s*14-22} y={-8} width={44} height={8} rx={3} fill={P.trim}/></g>)}
  <path d={`M${-CABINET.w*.31} ${-h*.42}H${CABINET.w*.31}`} stroke={P.steelDark} strokeWidth={10}/>
 </g>;};

// ---- tags, cards, stamps ----------------------------------------------------------------------------
/** A paper tag's size for its lines at a type size (draw units), shared with layout and bound checks. */
export function tagSize(lines:string[],size:number,extra=0){
 const w=Math.max(...lines.map(l=>widthOf(l,size,true)))+size*1.7+34,h=lines.length*size*1.18+size*.8+extra;return {w,h};
}
/** The hole sits at the origin; the tag hangs to the right. `swing` degrees about the hole. */
const Tag:React.FC<{lines:string[];size:number;tone?:'paper'|'amber'|'ai';swing?:number;extra?:number;children?:React.ReactNode}>=
 ({lines,size,tone='paper',swing=0,extra=0,children})=>{
 const P=SUPPORT_PAINT,{w,h}=tagSize(lines,size,extra),cut=h*.32;
 const fill=tone==='amber'?'#FBE3BC':tone==='ai'?'#DCEEF3':P.card,ink=tone==='amber'?P.amberDeep:tone==='ai'?P.aiDeep:P.ink;
 return <g transform={`rotate(${f2(swing)})`} data-part="tag">
  <path d={`M${-10} ${-h/2+cut+6}L${cut-4} ${-h/2+6}H${w}V${h/2+6}H${cut-4}L-10 ${h/2-cut+6}Z`} fill="#141719" opacity={.2}/>
  <path d={`M${-14} ${-h/2+cut}L${cut-8} ${-h/2}H${w-6}L${w-6} ${h/2-8}L${w-14} ${h/2}H${cut-8}L-14 ${h/2-cut}Z`} fill={fill} stroke={P.ink} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M${w-6} ${h/2-8}L${w-14} ${h/2-10}L${w-14} ${h/2}`} fill={P.paperShade} stroke={P.ink} strokeWidth={1.4}/>
  <circle cx={0} cy={0} r={size*.2+3} fill="none" stroke={P.inkSoft} strokeWidth={2.4}/>
  <circle cx={0} cy={0} r={size*.2} fill="#2A2F33" opacity={.7}/>
  {lines.map((l,i)=><text key={i} x={size*1.1+8} y={-h/2+size*.4+size*(i+.92)*1.18-extra/2} fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={ink}>{l}</text>)}
  {children&&<g transform={`translate(${size*1.1+8} ${f2(h/2-extra-2)})`}>{children}</g>}
 </g>;};
/** A recipe card, centre at the origin. `ai` gives it the AI's stripe and the recipe tubes' swatches. */
export const CARD={w:150,h:96};
const RecipeCard:React.FC<{w?:number;ai?:boolean;glow?:number;dim?:number;seed?:number}>=({w=CARD.w,ai=false,glow=0,dim=0,seed=0})=>{
 const P=SUPPORT_PAINT,h=w*CARD.h/CARD.w,s=w/CARD.w,id=useUid('fs-card');
 const sw=ai?RECIPE.map(k=>TUBES[k]):[0,1,2].map(i=>TUBES[(seed*3+i*2)%TUBES.length]);
 return <g data-part="recipe-card">
  <defs><radialGradient id={id} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.aiLit} stopOpacity={.85}/><stop offset="1" stopColor={P.ai} stopOpacity={0}/></radialGradient></defs>
  {glow>0&&<ellipse cx={0} cy={0} rx={w*.95} ry={h*1.05} fill={`url(#${id})`} opacity={glow}/>}
  <rect x={-w/2+3*s} y={-h/2+5*s} width={w} height={h} rx={6*s} fill="#121518" opacity={.18}/>
  <path d={`M${-w/2} ${-h/2+6*s}Q${-w/2} ${-h/2} ${-w/2+6*s} ${-h/2}H${w/2-14*s}L${w/2} ${-h/2+12*s}V${h/2-6*s}Q${w/2} ${h/2} ${w/2-6*s} ${h/2}H${-w/2+6*s}Q${-w/2} ${h/2} ${-w/2} ${h/2-6*s}Z`}
   fill={P.card} stroke={P.ink} strokeWidth={2*s+.4}/>
  <path d={`M${w/2-14*s} ${-h/2}L${w/2-12*s} ${-h/2+10*s}L${w/2} ${-h/2+12*s}`} fill={P.paperShade} stroke={P.ink} strokeWidth={1.2*s+.3}/>
  {ai&&<rect x={-w/2+1} y={-h/2+1} width={w*.08} height={h-2} rx={3*s} fill={P.ai}/>}
  {sw.map((c,i)=><g key={i}><rect x={-w/2+w*.14} y={-h/2+h*(.16+i*.26)} width={w*.13} height={h*.18} rx={3*s} fill={c} stroke={P.ink} strokeWidth={1.2*s}/>
   <path d={`M${-w/2+w*.33} ${-h/2+h*(.25+i*.26)}h${w*(.36+((seed+i)*13%20)/100)}`} stroke={P.line} strokeWidth={3*s} strokeLinecap="round"/></g>)}
  {dim>0&&<path d={`M${-w/2} ${-h/2}H${w/2}V${h/2}H${-w/2}Z`} fill="#6E7378" opacity={.55*dim}/>}
 </g>;};
/** A rubber stamp impression, centre at the origin: a ruled border and its words in ink. */
const Impression:React.FC<{text:string;size:number;color:string;p:number;rot?:number}>=({text,size,color,p,rot=0})=>{
 if(p<=0)return null;const w=widthOf(text,size,true)+size*1.1,h=size*1.55;
 return <g transform={`rotate(${f2(rot)})`} opacity={f2(.9*clamp(p))} data-part="impression">
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={size*.22} fill="none" stroke={color} strokeWidth={size*.11}/>
  <rect x={-w/2+size*.18} y={-h/2+size*.18} width={w-size*.36} height={h-size*.36} rx={size*.14} fill="none" stroke={color} strokeWidth={size*.04} opacity={.8}/>
  <text x={0} y={size*.36} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={color} letterSpacing={size*.04}>{text}</text>
  {[0,1,2].map(k=><path key={k} d={`M${f2(-w/2+w*(.18+k*.31))} ${f2(-h/2+2)}l${f2(size*.4)} ${f2(h*.5)}`} stroke="#FFFFFF" strokeWidth={size*.07} opacity={.35}/>)}
 </g>;};
/** A rubber stamp tool. `top` seen from above (a disc and handle knob), else from the side with its
 * rubber face on y 0. `lift` 0 pressed to 1 raised. */
const StampTool:React.FC<{w:number;top?:boolean;lift:number}>=({w,top=false,lift})=>{const P=SUPPORT_PAINT;
 if(top)return <g data-part="stamp-tool"><rect x={-w/2+10} y={-w*.28+14} width={w} height={w*.56} rx={10} fill="#111" opacity={.18*(1-lift)}/>
  <rect x={-w/2} y={-w*.28} width={w} height={w*.56} rx={10} fill={P.woodShade} stroke={P.trim} strokeWidth={3}/>
  <circle cx={0} cy={0} r={w*.2} fill={P.wood} stroke={P.trim} strokeWidth={3}/><circle cx={-w*.06} cy={-w*.06} r={w*.08} fill={P.woodLit}/></g>;
 const y=-lift*90;
 return <g data-part="stamp-tool" transform={`translate(0 ${f2(y)})`}>
  <rect x={-w/2} y={-12} width={w} height={12} rx={2} fill="#3A2B25"/>
  <rect x={-w/2-4} y={-34} width={w+8} height={24} rx={4} fill={P.wood} stroke={P.trim} strokeWidth={2.6}/>
  <path d={`M${-w/2} -28H${w/2-10}`} stroke={P.woodLit} strokeWidth={3}/>
  <path d={`M-10 -34L-16 -86Q0 -100 16 -86L10 -34Z`} fill={P.woodShade} stroke={P.trim} strokeWidth={2.6}/>
  <circle cx={0} cy={-100} r={20} fill={P.wood} stroke={P.trim} strokeWidth={2.6}/><circle cx={-6} cy={-106} r={6} fill={P.woodLit}/>
 </g>;};

// ---- the gloved hand, tray, pencil ------------------------------------------------------------------
/** A right hand in a nitrile glove and lab coat cuff reaching in from the right, the pinch between thumb
 * and index tip at the origin. `pinch` 0 open to 1 closed, `rot` degrees. */
const Hand:React.FC<{pinch:number;rot?:number}>=({pinch,rot=0})=>{const P=SUPPORT_PAINT,o=lerp(16,2,clamp(pinch));
 return <g transform={`rotate(${f2(rot)})`} data-part="gloved-hand">
  <path d={`M70 -30L520 -70L540 70L80 40Z`} fill={P.coat} stroke={P.trim} strokeWidth={3}/>
  <path d={`M90 20L520 50`} stroke={P.coatShade} strokeWidth={10} opacity={.7}/>
  <path d={`M66 -34L96 -36L104 42L74 44Z`} fill={P.coatShade} stroke={P.trim} strokeWidth={2.6}/>
  <path d={`M70 -26C40 -40 14 -30 4 ${-8-o}L-6 ${-14-o}Q-12 ${-12-o} -8 ${-4-o}L10 ${6-o*.4}C14 18 34 34 70 30Z`} fill={P.glove} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  {[0,1,2].map(k=><path key={k} d={`M${44-k*2} ${-22+k*12}C${26-k*4} ${-24+k*14} ${12+k*3} ${-12+k*16} ${10+k*8} ${2+k*12}`} stroke={P.gloveShade} strokeWidth={9} fill="none" strokeLinecap="round"/>)}
  <path d={`M52 6C38 16 22 ${18+o*.3} 6 ${10+o}L-2 ${10+o}Q-6 ${14+o} 0 ${17+o}C20 ${26+o} 42 30 64 24`} fill={P.gloveLit} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M60 -24C44 -30 26 -26 14 -14`} stroke={P.gloveLit} strokeWidth={4} fill="none" strokeLinecap="round" opacity={.8}/>
 </g>;};
const Tray:React.FC<{w:number}>=({w})=>{const P=SUPPORT_PAINT;
 return <g data-part="tray"><ellipse cx={8} cy={2} rx={w*.55} ry={7} fill="#121518" opacity={.25}/>
  <path d={`M${-w/2} -26L${-w/2+10} 0H${w/2-10}L${w/2} -26Z`} fill={P.steelLit} stroke={P.trim} strokeWidth={2.6} strokeLinejoin="round"/>
  <path d={`M${-w/2+2} -22H${w/2-4}`} stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
  <path d={`M${-w/2+14} -6H${w/2-16}`} stroke={P.steel} strokeWidth={2}/></g>;};
/** A hex pencil lying across the bench, centre at the origin, `spin` the roll in radians (its painted
 * flats and lettering-free stripe move as it rolls). */
const Pencil:React.FC<{spin:number}>=({spin})=>{const P=SUPPORT_PAINT,L=60,r=6,band=Math.sin(spin*3);
 return <g data-part="pencil">
  <rect x={-L} y={-r} width={2*L-16} height={2*r} rx={2} fill={P.pencil} stroke={P.trim} strokeWidth={1.8}/>
  <rect x={-L+2} y={f2(-r+2+band*2.4+2)} width={2*L-20} height={2.6} fill={P.pencilShade} opacity={.9}/>
  <rect x={-L+2} y={f2(-r+1-band*2+6)} width={2*L-20} height={1.6} fill="#FFF4C8" opacity={.7}/>
  <path d={`M${L-16} ${-r}L${L} 0L${L-16} ${r}Z`} fill="#E7C9A0" stroke={P.trim} strokeWidth={1.6}/>
  <path d={`M${L-5} -2L${L} 0L${L-5} 2Z`} fill={P.ink}/>
  <rect x={-L-12} y={-r} width={12} height={2*r} rx={2} fill="#C76E6E" stroke={P.trim} strokeWidth={1.6}/>
  <rect x={-L-2} y={-r} width={5} height={2*r} fill={P.steelLit}/>
 </g>;};

// ---- furniture and floor ----------------------------------------------------------------------------
/** A lab bench with a dark epoxy top: working surface on y 0 from x0 to x1, legs to `floor`. */
const Bench:React.FC<{x0:number;x1:number;floor:number;wood?:boolean}>=({x0,x1,floor,wood=false})=>{
 const P=SUPPORT_PAINT,top=wood?P.wood:P.epoxy,lit=wood?P.woodLit:P.epoxyLit,face=wood?P.woodShade:'#2A2F33';
 return <g data-part={wood?'desk':'bench'}>
  {[x0+26,x1-34].map((x,k)=><g key={k}><rect x={x-10} y={40} width={20} height={floor-40} fill={wood?P.woodShade:P.steelDark} stroke={P.trim} strokeWidth={2}/>
   <rect x={x-15} y={floor-7} width={30} height={7} rx={2} fill={P.trim}/></g>)}
  <ellipse cx={(x0+x1)/2+24} cy={floor} rx={(x1-x0)*.55} ry={12} fill="#121518" opacity={.2}/>
  {!wood&&<rect x={x0+40} y={44} width={x1-x0-90} height={floor*.55} rx={4} fill={P.steelDark} stroke={P.trim} strokeWidth={2} opacity={.92}/>}
  {!wood&&<path d={`M${x0+56} ${44+floor*.27}H${x1-66}`} stroke={P.steelLit} strokeWidth={2} opacity={.5}/>}
  {wood&&<rect x={x1-200} y={40} width={150} height={floor*.5} rx={4} fill={P.woodShade} stroke={P.trim} strokeWidth={2}/>}
  {wood&&<rect x={x1-140} y={40+floor*.22} width={36} height={7} rx={3} fill={P.steelLit}/>}
  <path d={`M${x0} 6L${x0+8} -16L${x1-6} -16L${x1} 6Z`} fill={top} stroke={P.trim} strokeWidth={2.4} strokeLinejoin="round"/>
  <path d={`M${x0+16} -10L${x1-60} -10`} stroke={lit} strokeWidth={2} opacity={.7}/>
  <path d={`M${x0+140} -4q30 -2 54 2`} stroke={lit} strokeWidth={1.4} opacity={.6} fill="none"/>
  <rect x={x0} y={6} width={x1-x0} height={36} fill={face} stroke={P.trim} strokeWidth={2.4}/>
  <path d={`M${x0+4} 10H${x1-4}`} stroke={lit} strokeWidth={3} opacity={.6}/>
  <path d={`M${x1-90} 6l6 10`} stroke={lit} strokeWidth={2} opacity={.5}/>
 </g>;};
/** A bench or desk top seen from straight above: the rectangle and its worn grain. */
const BenchTop:React.FC<{w:number;h:number;wood?:boolean}>=({w,h,wood=false})=>{const P=SUPPORT_PAINT;
 return <g data-part="bench-top">
  <rect x={-w/2+16} y={-h/2+20} width={w} height={h} rx={14} fill="#121518" opacity={.22}/>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={14} fill={wood?P.wood:P.epoxy} stroke={P.trim} strokeWidth={4}/>
  {Array.from({length:9},(_,k)=><path key={k} d={`M${-w/2+20} ${f2(-h/2+40+k*(h-80)/8)}q${w*.3} ${(k%3-1)*8} ${w-40} ${(k%2)*6-3}`} stroke={wood?P.woodLit:P.epoxyLit} strokeWidth={1.6} opacity={.35} fill="none"/>)}
  <circle cx={w*.3} cy={-h*.3} r={26} fill="none" stroke={wood?P.woodShade:'#20252A'} strokeWidth={5} opacity={.45}/>
  <path d={`M${-w/2+8} ${-h/2+10}H${w/2-30}`} stroke="#FFFFFF" strokeWidth={4} opacity={.18}/>
 </g>;};
/** A speckled lab floor from row y to the frame's foot, across x0..x1 (screen units of the view). */
const Floor:React.FC<{x0:number;x1:number;y:number;to:number}>=({x0,x1,y,to})=>{const P=SUPPORT_PAINT,id=useUid('fs-floor');
 return <g data-part="floor">
  <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={P.floorShade}/><stop offset=".25" stopColor={P.floor}/><stop offset="1" stopColor={P.floorLit}/></linearGradient></defs>
  <rect x={x0} y={y} width={x1-x0} height={to-y} fill={`url(#${id})`}/>
  <rect x={x0} y={y-10} width={x1-x0} height={12} fill="#6F6A60"/>
  {Array.from({length:40},(_,k)=><circle key={k} cx={x0+((k*197)%1000)/1000*(x1-x0)} cy={y+30+((k*311)%1000)/1000*(to-y-40)} r={1.6+(k%3)} fill={k%2?'#8E887C':'#C9C3B6'} opacity={.6}/>)}
  <path d={`M${x0} ${y+(to-y)*.45}L${x1} ${y+(to-y)*.38}`} stroke="#8E887C" strokeWidth={2} opacity={.5}/>
 </g>;};
const Mug:React.FC<{}>=()=>{const P=SUPPORT_PAINT;return <g data-part="mug">
 <ellipse cx={4} cy={2} rx={30} ry={6} fill="#121518" opacity={.25}/>
 <path d={`M30 -50q22 2 20 20q-2 16 -22 14`} stroke={P.slate} strokeWidth={8} fill="none"/>
 <path d={`M-28 -60L-24 0H24L28 -60Z`} fill={P.slate} stroke={P.trim} strokeWidth={2.4}/>
 <ellipse cx={0} cy={-60} rx={28} ry={6} fill="#3B4F60" stroke={P.trim} strokeWidth={2}/>
 <path d={`M-20 -52V-8`} stroke="#9DB3C6" strokeWidth={5} strokeLinecap="round" opacity={.7}/></g>;};
const Beaker:React.FC<{}>=()=>{const P=SUPPORT_PAINT;return <g data-part="beaker">
 <ellipse cx={4} cy={2} rx={26} ry={5} fill="#121518" opacity={.22}/>
 <path d={`M-22 -74H24L20 -66V0H-20V-66Z`} fill="#E3EEF0" stroke={P.trim} strokeWidth={2.2} opacity={.9}/>
 <rect x={-18} y={-30} width={36} height={28} fill="#C8D8DC"/>
 {[0,1,2].map(k=><path key={k} d={`M-20 ${-50+k*12}h${k===1?14:9}`} stroke={P.inkSoft} strokeWidth={1.6}/>)}
 <path d={`M-14 -66V-8`} stroke="#FFFFFF" strokeWidth={3} opacity={.8}/></g>;};
/** A whiteboard easel: board centre at the origin, legs to `floor` (draw units below the centre). */
const Easel:React.FC<{w:number;h:number;floor:number;legs?:boolean}>=({w,h,floor,legs=true})=>{const P=SUPPORT_PAINT;
 return <g data-part="easel">
  {legs&&<g><ellipse cx={20} cy={floor} rx={w*.45} ry={12} fill="#121518" opacity={.2}/>
   {[-1,1].map(s=><path key={s} d={`M${s*w*.32} ${h/2-10}L${s*w*.38+s*20} ${floor}`} stroke={P.steelDark} strokeWidth={14} strokeLinecap="round"/>)}
   <path d={`M0 ${h/2-10}L0 ${floor-10}`} stroke={P.steel} strokeWidth={10}/></g>}
  <rect x={-w/2+8} y={-h/2+12} width={w} height={h} rx={10} fill="#121518" opacity={.22}/>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={10} fill="#FBFAF6" stroke={P.steelDark} strokeWidth={10}/>
  <path d={`M${-w/2+20} ${-h/2+16}H${w/2-80}`} stroke="#FFFFFF" strokeWidth={6} opacity={.9}/>
  <path d={`M${w*.15} ${h*.3}q40 -12 70 4`} stroke="#C9CED2" strokeWidth={3} fill="none" opacity={.8}/>
  <rect x={-w/2+30} y={h/2-4} width={w-60} height={14} rx={4} fill={P.steel} stroke={P.trim} strokeWidth={2}/>
 </g>;};

// ---- the release card, the dateline, the bay outline ------------------------------------------------
export const RELEASE={w:440,h:310,headline:['Texas A&M researchers','pursue autonomous','AI foundry'],size:31};
/** The release card, top left at the origin. The headline writes in line by line with `write`. */
const Release:React.FC<{write:number}>=({write})=>{const P=SUPPORT_PAINT,{w,h,headline,size}=RELEASE,id=useUid('fs-rel');
 const per=1/headline.length;
 return <g data-part="release-card">
  <defs>{headline.map((l,i)=>{const p=clamp((write-i*per)/per);return <clipPath key={i} id={id+'h'+i}><rect x={20} y={70+i*size*1.2-size} width={f2(p*(widthOf(l,size,true)+10))} height={size*1.35}/></clipPath>;})}</defs>
  <rect x={8} y={12} width={w} height={h} rx={10} fill="#121518" opacity={.22}/>
  <path d={`M0 10Q0 0 10 0H${w-26}L${w} 26V${h-10}Q${w} ${h} ${w-10} ${h}H10Q0 ${h} 0 ${h-10}Z`} fill={P.card} stroke={P.ink} strokeWidth={2.6}/>
  <path d={`M${w-26} 0L${w-22} 22L${w} 26`} fill={P.paperShade} stroke={P.ink} strokeWidth={1.6}/>
  <rect x={20} y={18} width={150} height={12} rx={4} fill="#4F5961"/>
  <rect x={20} y={36} width={90} height={6} rx={3} fill={P.line}/>
  {headline.map((l,i)=><text key={i} clipPath={`url(#${id}h${i})`} x={20} y={70+i*size*1.2+size*.05} fontFamily={FONT.display} fontWeight={700} fontSize={size} fill={P.ink}>{l}</text>)}
  {Array.from({length:6},(_,k)=><rect key={k} x={20} y={70+headline.length*size*1.2+16+k*17} width={k===5?190:w-48-(k*23)%60} height={6} rx={3} fill={P.line} opacity={clamp(write*3-2-k*.1)}/>)}
  <circle cx={w-60} cy={h-44} r={22} fill="none" stroke="#C8BBA0" strokeWidth={4} opacity={.5}/>
 </g>;};
export const BAY={w:460,h:330};
/** The foundry bay outline on blueprint paper, top left at the origin. `p` draws the pencil lines on in
 * order; `title` writes the title block. No real building: a generic room, line, arm, furnace and rig. */
const Bay:React.FC<{p:number;title:number}>=({p,title})=>{const P=SUPPORT_PAINT,{w,h}=BAY,id=useUid('fs-bay');
 const paths=[`M40 40H${w-40}V${h-90}H40Z`,`M70 ${h-150}H${w-120}`,`M70 ${h-130}H${w-120}`,`M70 ${h-150}V${h-130}M${w-120} ${h-150}V${h-130}`,
  `M120 ${h-170}a18 18 0 1 0 0.1 0`,`M180 ${h-176}h46v26h-46Z`,`M260 ${h-176}h40v26h-40Z`,`M${w-100} 70h40v50h-40Z`,`M40 ${h-160}V${h-120}`,`M90 60l40 0M90 56v8M130 56v8`];
 return <g data-part="bay-outline">
  <defs><pattern id={id} width={20} height={20} patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#B8CAD4" strokeWidth={1}/></pattern></defs>
  <rect x={10} y={14} width={w} height={h} rx={6} fill="#121518" opacity={.2}/>
  <rect x={0} y={0} width={w} height={h} rx={6} fill={P.blueprint} stroke={P.ink} strokeWidth={2.4}/>
  <rect x={6} y={6} width={w-12} height={h-12} fill={`url(#${id})`}/>
  {paths.map((d,k)=>{const q=clamp(p*paths.length*.8-k*.8);return q<=0?null:<path key={k} d={d} fill="none" stroke={P.bpLine} strokeWidth={k===0?4:2.8}
   strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={f2(1-q)}/>;})}
  <rect x={w-210} y={h-76} width={190} height={56} fill="none" stroke={P.bpLine} strokeWidth={2.4} opacity={clamp(title*3)}/>
  <text x={w-200} y={h-40} fontFamily={FONT.body} fontWeight={800} fontSize={22} fill={P.bpLine} opacity={clamp(title*2-.5)}>Aggie AI Foundry</text>
 </g>;};

// ---- the AI panel, quote, monitor ---------------------------------------------------------------------
export const PANEL={w:170,h:212,cy:-336,pole:-230};
/** The AI panel on its pole, pole foot at the origin. `write` draws the recipe card on its screen, `glow`
 * lights it, `dim` greys it, `sent` says the printed card has left its slot. */
const AiPanel:React.FC<{write:number;glow:number;dim:number;sent:number}>=({write,glow,dim,sent})=>{
 const P=SUPPORT_PAINT,{w,h,cy}=PANEL,id=useUid('fs-ai'),x=-w/2,y=cy-h/2;
 return <g data-part="ai-panel">
  <defs><linearGradient id={id+'s'} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#25343D"/><stop offset="1" stopColor="#152027"/></linearGradient>
   <radialGradient id={id+'g'} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={P.aiLit} stopOpacity={.75}/><stop offset="1" stopColor={P.ai} stopOpacity={0}/></radialGradient></defs>
  <ellipse cx={6} cy={2} rx={46} ry={7} fill="#121518" opacity={.25}/>
  <rect x={-30} y={-12} width={60} height={12} rx={4} fill={P.steelDark} stroke={P.trim} strokeWidth={2}/>
  <rect x={-8} y={PANEL.pole} width={16} height={-PANEL.pole-10} fill={P.steel} stroke={P.trim} strokeWidth={2}/>
  <path d={`M-3 ${PANEL.pole+6}V-16`} stroke={P.steelLit} strokeWidth={3} opacity={.7}/>
  {glow>0&&<ellipse cx={0} cy={cy} rx={w*1.1} ry={h*.9} fill={`url(#${id}g)`} opacity={glow*(1-dim*.8)}/>}
  <rect x={x-12} y={y-12} width={w+24} height={h+40} rx={14} fill={P.steelDark} stroke={P.trim} strokeWidth={3}/>
  <rect x={x} y={y} width={w} height={h} rx={6} fill={`url(#${id}s)`}/>
  <text x={x+14} y={y+32} fontFamily={FONT.body} fontWeight={800} fontSize={24} fill={P.aiLit} opacity={1-dim*.6}>AI</text>
  <circle cx={x+w-18} cy={y+22} r={5} fill={P.ai} opacity={.6+.4*glow}/>
  <path d={`M${x+14} ${y+44}H${x+w-14}`} stroke={P.aiDeep} strokeWidth={2}/>
  {/* the recipe card it writes, on screen */}
  {write>0&&<g transform={`translate(0 ${cy+22}) scale(${f2(.85+.15*smooth(write*2))})`} opacity={f2(clamp(write*3)*(1-.35*sent*(1-glow)))}>
   <RecipeCard w={120} ai glow={glow} dim={dim}/>
  </g>}
  {write>0&&write<1&&<rect x={x+20} y={cy+80} width={f2((w-40)*write)} height={5} rx={2.5} fill={P.ai}/>}
  {/* the card slot */}
  <rect x={x+24} y={y+h+12} width={w-48} height={8} rx={3} fill="#0E1215"/>
  <path d={`M${x-6} ${y-4}H${x+w-40}`} stroke={P.steelLit} strokeWidth={3} opacity={.6}/>
  {dim>0&&<rect x={x} y={y} width={w} height={h} rx={6} fill="#0E1215" opacity={.35*dim}/>}
 </g>;};
export const QUOTE={w:540,size:27,lead:1.32,text:'"The computer can predict some behavior, but there\'s no computational tool anywhere in the world that can predict how an alloy is going to behave."',name:'Raymundo Arróyave'};
/** Break the quote into lines that fit the card. Pure; layout and the bound check share it. */
export function quoteLines():string[]{
 const words=QUOTE.text.split(' '),out:string[]=[],max=QUOTE.w-70;let cur='';
 for(const wd of words){const n=cur?cur+' '+wd:wd;if(cur&&widthOf(n,QUOTE.size)>max){out.push(cur);cur=wd;}else cur=n;}
 if(cur)out.push(cur);return out;
}
export function quoteHeight(){return 46+quoteLines().length*QUOTE.size*QUOTE.lead+80;}
/** The quote card, top left at the origin. `name` writes the speaker's name, `hl` underlines the words
 * some behavior in the quotation. */
const Quote:React.FC<{name:number;hl:number}>=({name,hl})=>{const P=SUPPORT_PAINT,{w,size,lead}=QUOTE,lines=quoteLines(),h=quoteHeight(),id=useUid('fs-q');
 const li=lines.findIndex(l=>l.includes('some behavior')),pre=li>=0?lines[li].slice(0,lines[li].indexOf('some behavior')):'';
 const hx=34+widthOf(pre,size),hw=widthOf('some behavior',size),nameW=widthOf(QUOTE.name,30,true);
 return <g data-part="quote-card">
  <defs><clipPath id={id}><rect x={34} y={h-70} width={f2(name*(nameW+12))} height={44}/></clipPath></defs>
  <rect x={10} y={14} width={w} height={h} rx={12} fill="#121518" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={12} fill={P.card} stroke={P.ink} strokeWidth={2.6}/>
  <rect x={0} y={0} width={10} height={h} rx={4} fill={P.slate}/>
  {li>=0&&hl>0&&<rect x={f2(hx-3)} y={f2(46+li*size*lead+6)} width={f2(hw*smooth(hl)+6)} height={7} rx={3} fill={P.ai} opacity={.8}/>}
  {lines.map((l,i)=><text key={i} x={34} y={46+i*size*lead} fontFamily={FONT.display} fontSize={size} fill={P.ink}>{l}</text>)}
  <path d={`M34 ${h-62}H${w-40}`} stroke={P.line} strokeWidth={2}/>
  <text clipPath={`url(#${id})`} x={34} y={h-34} fontFamily={FONT.body} fontWeight={800} fontSize={30} fill={P.ink}>{QUOTE.name}</text>
  {name>0&&name<1&&<path d={`M${f2(34+name*nameW)} ${h-60}l6 30`} stroke={P.inkSoft} strokeWidth={4} strokeLinecap="round"/>}
 </g>;};
export const MONITOR={w:300,h:190,cy:-232,gauge:{x:-110,y:-232,w:220,h:30}};
/** A computer monitor on its stand, foot at the origin, with a bar gauge across its screen. `fill`
 * 0..1 how far the prediction fills, `aim` a point (monitor units) the readout is pointed at. */
const Monitor:React.FC<{fill:number;aim?:Pt|null;aimP?:number;search?:number}>=({fill,aim=null,aimP=0,search=0})=>{
 const P=SUPPORT_PAINT,{w,h,cy}=MONITOR,G=MONITOR.gauge,x=-w/2,y=cy-h/2,segs=10,id=useUid('fs-mon');
 return <g data-part="monitor">
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#25343D"/><stop offset="1" stopColor="#141D23"/></linearGradient></defs>
  <ellipse cx={8} cy={2} rx={70} ry={8} fill="#121518" opacity={.25}/>
  <path d={`M-56 0L-40 -14H40L56 0Z`} fill={P.steelDark} stroke={P.trim} strokeWidth={2.2}/>
  <rect x={-12} y={cy+h/2} width={24} height={-cy-h/2-12} fill={P.steel} stroke={P.trim} strokeWidth={2}/>
  <rect x={x-12} y={y-12} width={w+24} height={h+24} rx={12} fill={P.steelDark} stroke={P.trim} strokeWidth={3}/>
  <rect x={x} y={y} width={w} height={h} rx={5} fill={`url(#${id})`}/>
  <path d={`M${x+12} ${y+18}h70M${x+12} ${y+32}h40`} stroke="#5F7884" strokeWidth={4} strokeLinecap="round"/>
  {/* the computer's model: a few small known property dots it can predict */}
  {[0,1,2,3].map(k=><circle key={k} cx={x+w-80+k*18} cy={y+26} r={5} fill={k<2?P.aiLit:'#3E525C'}/>)}
  <rect x={G.x-6} y={G.y-6} width={G.w+12} height={G.h+12} rx={8} fill="#0D1418" stroke="#5F7884" strokeWidth={2}/>
  {Array.from({length:segs},(_,k)=>{const on=clamp(fill*segs-k);return <g key={k}>
   <rect x={G.x+k*G.w/segs+2} y={G.y} width={G.w/segs-4} height={G.h} rx={3} fill="#22313A"/>
   {on>0&&<rect x={G.x+k*G.w/segs+2} y={G.y} width={f2((G.w/segs-4)*on)} height={G.h} rx={3} fill={P.ai}/>}</g>;})}
  {search>0&&<rect x={G.x+2} y={G.y} width={f2(Math.max(0,search)*G.w/segs*.6)} height={G.h} rx={3} fill={P.aiLit} opacity={.5}/>}
  {Array.from({length:segs+1},(_,k)=><path key={k} d={`M${G.x+k*G.w/segs} ${G.y+G.h+8}v${k%5?5:9}`} stroke="#8AA0AA" strokeWidth={1.6}/>)}
  {aim&&aimP>0&&<path d={`M${G.x+G.w+10} ${G.y+G.h/2}L${f2(lerp(G.x+G.w+10,aim[0],aimP))} ${f2(lerp(G.y+G.h/2,aim[1],aimP))}`} stroke={P.aiLit} strokeWidth={3} strokeDasharray="8 7"/>}
  <path d={`M${x+4} ${y+6}L${x+w*.45} ${y+6}`} stroke="#FFFFFF" strokeWidth={3} opacity={.18}/>
 </g>;};
const Question:React.FC<{p:number}>=({p})=>{if(p<=0)return null;const P=SUPPORT_PAINT,s=.6+.4*smooth(p);
 return <g transform={`scale(${f2(s)})`} opacity={f2(clamp(p*2))} data-part="question">
  <path d={`M4 30L16 64L26 28Z`} fill={P.card} stroke={P.ink} strokeWidth={3} strokeLinejoin="round"/>
  <circle cx={0} cy={0} r={40} fill={P.card} stroke={P.ink} strokeWidth={3.4}/>
  <path d={`M7 37L16 58L20 36Z`} fill={P.card}/>
  <text x={0} y={18} textAnchor="middle" fontFamily={FONT.display} fontWeight={800} fontSize={54} fill={P.ink}>?</text>
 </g>;};

// ---- calendar, week strip, form ---------------------------------------------------------------------
export const CAL={w:300,h:330,pages:4};
/** A wall calendar pad, its binding's centre at the origin. `flip` 0..1 sends the month pages up and
 * away one after another; the backing stays. */
const Calendar:React.FC<{flip:number}>=({flip})=>{const P=SUPPORT_PAINT,{w,h,pages}=CAL;
 const page=(k:number,p:number)=>{const a=smooth(p),sy=Math.cos(a*Math.PI*.92),lift=-a*70,o=1-smooth((p-.7)/.3);
  if(o<=0)return null;
  return <g key={k} transform={`translate(${f2(a*40+k*2)} ${f2(lift)}) scale(1 ${f2(sy)})`} opacity={f2(o)}>
   <rect x={-w/2+4} y={14} width={w-8} height={h-20} rx={4} fill={sy>0?P.card:P.paperShade} stroke={P.ink} strokeWidth={2.2}/>
   {sy>0&&<g><rect x={-w/2+18} y={30} width={w-36} height={30} rx={4} fill={[P.slate,'#7C8A6E','#8C6E6E','#6E7C8C'][k%4]}/>
    {Array.from({length:35},(_,i)=><rect key={i} x={-w/2+18+(i%7)*(w-36)/7+3} y={72+Math.floor(i/7)*46} width={(w-36)/7-6} height={40} rx={3} fill="none" stroke={P.line} strokeWidth={1.6}/>)}
    {Array.from({length:35},(_,i)=><circle key={'d'+i} cx={-w/2+18+(i%7)*(w-36)/7+10} cy={72+Math.floor(i/7)*46+10} r={2.2} fill={P.inkSoft} opacity={.6}/>)}</g>}
  </g>;};
 return <g data-part="calendar">
  <rect x={-w/2+10} y={22} width={w} height={h} rx={6} fill="#121518" opacity={.22}/>
  <rect x={-w/2} y={8} width={w} height={h} rx={6} fill="#B9AF9B" stroke={P.ink} strokeWidth={2.4}/>
  {Array.from({length:pages},(_,k)=>pages-1-k).map(k=>page(k,clamp(flip*(pages+1)-k*1.0)))}
  {Array.from({length:12},(_,k)=><g key={k}><rect x={-w/2+18+k*(w-36)/11-3} y={-8} width={6} height={26} rx={3} fill="none" stroke={P.steelDark} strokeWidth={3}/></g>)}
  <circle cx={0} cy={-22} r={5} fill={P.steelDark}/>
 </g>;};
export const WEEK={cell:72,gap:8,pad:14};
export const WEEK_W=7*WEEK.cell+6*WEEK.gap+2*WEEK.pad,WEEK_H=WEEK.cell+2*WEEK.pad;
/** A seven cell week strip, top left at the origin. `fill` 0..1 fills the days in order. */
const WeekStrip:React.FC<{fill:number}>=({fill})=>{const P=SUPPORT_PAINT,{cell,gap,pad}=WEEK;
 return <g data-part="week-strip">
  <rect x={8} y={12} width={WEEK_W} height={WEEK_H} rx={10} fill="#121518" opacity={.22}/>
  <rect x={0} y={0} width={WEEK_W} height={WEEK_H} rx={10} fill={P.card} stroke={P.ink} strokeWidth={2.6}/>
  {Array.from({length:7},(_,k)=>{const x=pad+k*(cell+gap),on=clamp(fill*7-k);return <g key={k}>
   <rect x={x} y={pad} width={cell} height={cell} rx={6} fill="#EDE6D6" stroke={P.inkSoft} strokeWidth={2}/>
   {on>0&&<rect x={x+4} y={f2(pad+4+(cell-8)*(1-on))} width={cell-8} height={f2((cell-8)*on)} rx={4} fill={P.slate}/>}
   {on>=1&&<path d={`M${x+20} ${pad+38}l12 12l22 -26`} stroke="#F7F1E3" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
  </g>;})}
 </g>;};
export const FORM={w:420,h:230,label:'Opening date'};
/** A form card, top left at the origin: its labelled opening date field left blank, `dash` drawing the
 * one stroke that marks it empty. */
const Form:React.FC<{dash:number}>=({dash})=>{const P=SUPPORT_PAINT,{w,h,label}=FORM;
 return <g data-part="form">
  <rect x={8} y={12} width={w} height={h} rx={8} fill="#121518" opacity={.22}/>
  <rect x={0} y={0} width={w} height={h} rx={8} fill={P.card} stroke={P.ink} strokeWidth={2.6}/>
  <rect x={22} y={20} width={170} height={12} rx={4} fill="#4F5961"/>
  <rect x={22} y={40} width={110} height={6} rx={3} fill={P.line}/>
  <text x={22} y={96} fontFamily={FONT.body} fontWeight={800} fontSize={30} fill={P.ink}>{label}</text>
  <rect x={22} y={112} width={w-44} height={70} rx={6} fill="#FFFDF7" stroke={P.ink} strokeWidth={3}/>
  {dash>0&&<path d={`M${w/2-30} 147h${f2(60*smooth(dash))}`} stroke={P.ink} strokeWidth={6} strokeLinecap="round"/>}
  <rect x={22} y={198} width={w*.5} height={6} rx={3} fill={P.line}/>
 </g>;};

// ---- the exported group -----------------------------------------------------------------------------
export type FoundrySupportProps=
 |{part:'periodic';lit:number;mesh:number;candidate:number;t:number;frame?:boolean}
 |{part:'cabinetStand';h:number}
 |{part:'tag';lines:string[];size:number;tone?:'paper'|'amber'|'ai';swing?:number;extra?:number;children?:React.ReactNode}
 |{part:'card';w?:number;ai?:boolean;glow?:number;dim?:number;seed?:number}
 |{part:'impression';text:string;size:number;color:string;p:number;rot?:number}
 |{part:'stamp';w:number;top?:boolean;lift:number}
 |{part:'hand';pinch:number;rot?:number}
 |{part:'tray';w:number}
 |{part:'pencil';spin:number}
 |{part:'bench';x0:number;x1:number;floor:number;wood?:boolean}
 |{part:'benchTop';w:number;h:number;wood?:boolean}
 |{part:'floor';x0:number;x1:number;y:number;to:number}
 |{part:'mug'}|{part:'beaker'}
 |{part:'easel';w:number;h:number;floor:number;legs?:boolean}
 |{part:'release';write:number}
 |{part:'bay';p:number;title:number}
 |{part:'aiPanel';write:number;glow:number;dim:number;sent:number}
 |{part:'quote';name:number;hl:number}
 |{part:'monitor';fill:number;aim?:Pt|null;aimP?:number;search?:number}
 |{part:'question';p:number}
 |{part:'calendar';flip:number}
 |{part:'week';fill:number}
 |{part:'form';dash:number};
export const FoundrySupport:React.FC<FoundrySupportProps>=(props)=>{
 switch(props.part){
 case 'periodic':return <Periodic lit={props.lit} mesh={props.mesh} candidate={props.candidate} t={props.t} frame={props.frame}/>;
 case 'cabinetStand':return <CabinetStand h={props.h}/>;
 case 'tag':return <Tag lines={props.lines} size={props.size} tone={props.tone} swing={props.swing} extra={props.extra}>{props.children}</Tag>;
 case 'card':return <RecipeCard w={props.w} ai={props.ai} glow={props.glow} dim={props.dim} seed={props.seed}/>;
 case 'impression':return <Impression text={props.text} size={props.size} color={props.color} p={props.p} rot={props.rot}/>;
 case 'stamp':return <StampTool w={props.w} top={props.top} lift={props.lift}/>;
 case 'hand':return <Hand pinch={props.pinch} rot={props.rot}/>;
 case 'tray':return <Tray w={props.w}/>;
 case 'pencil':return <Pencil spin={props.spin}/>;
 case 'bench':return <Bench x0={props.x0} x1={props.x1} floor={props.floor} wood={props.wood}/>;
 case 'benchTop':return <BenchTop w={props.w} h={props.h} wood={props.wood}/>;
 case 'floor':return <Floor x0={props.x0} x1={props.x1} y={props.y} to={props.to}/>;
 case 'mug':return <Mug/>;
 case 'beaker':return <Beaker/>;
 case 'easel':return <Easel w={props.w} h={props.h} floor={props.floor} legs={props.legs}/>;
 case 'release':return <Release write={props.write}/>;
 case 'bay':return <Bay p={props.p} title={props.title}/>;
 case 'aiPanel':return <AiPanel write={props.write} glow={props.glow} dim={props.dim} sent={props.sent}/>;
 case 'quote':return <Quote name={props.name} hl={props.hl}/>;
 case 'monitor':return <Monitor fill={props.fill} aim={props.aim} aimP={props.aimP} search={props.search}/>;
 case 'question':return <Question p={props.p}/>;
 case 'calendar':return <Calendar flip={props.flip}/>;
 case 'week':return <WeekStrip fill={props.fill}/>;
 case 'form':return <Form dash={props.dash}/>;
 }
};
