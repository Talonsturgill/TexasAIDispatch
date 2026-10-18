import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject} from '../../PlaceStage';
import {LOCATOR_START_S,LOCATOR_END_S} from '../../CountyLocator';
import type {FilmRenderProps} from '../../types';
import {FloodStationHero,STATION,CUTAWAY_LAMP,podPoint,type Pal,type Pt} from './FloodStationHero';
import {StreetHubSupport,PORCH,CASE,TECH,mirrorAbout,indexTip,reach,type HandPose} from './StreetHubSupport';

/**
 * flood-station-v1: UT San Antonio's solar flood station, as the university describes the design.
 *
 * ONE station and ONE rising waterline carry the film. Water reaches the station's lowest optical
 * lens at ankle height, and in the sensing scene it rises past all four lenses, each lighting as the
 * waterline crosses it; every lens it has crossed stays lit. The battery bar the sun fills, the
 * weather lamps and the amber risk lamp the chip lights stay in their new state for the rest of the
 * film, so each later shot of the station carries what earlier shots performed.
 *
 * FLOOD WATER IS A SURFACE. Every flooded place draws finished reflective water (StreetHubSupport
 * `water`): a sky-lit far band, muddy body, and the posts, boots and lamps standing in it mirrored
 * about their own waterlines and broken by ripple bands. What stands in water is clipped at its
 * waterline, so it rises out of the surface rather than standing on a slab.
 *
 * A: the yard-first treatment. Flood water in the street tops the limestone curb, spreads across a
 * San Antonio yard, reaches the fence post's orange ankle mark (its flagging tag swings as the edge
 * arrives) and rises up the rain boots on the porch step while the phone stays dark; the warning
 * comes late. Then the station at the curb is found, charged, climbed, crossed lens by lens, opened
 * on its post to the chip that lights its large risk lamp and risk bar, set against a dark server
 * building across the road that a dashed line never reaches, followed by its radio rings down a
 * long street to the hub at its far end and across open country to the hub's mast, read on the
 * hub's flood path map by a seated responder, measured on two cards on a curb notice board, read by
 * a technician's finger along the blank paper map, and closed back in the opening yard, where the goal
 * is a dashed, unlit outline of the station ringed at the curb beside a none reported tag, the real
 * prototype stays in the closed case she holds, and the phone on the porch rail is still dark.
 * B: the instrument-first treatment. It opens in the water at the post, where the lowest lens goes
 * under and lights, and only then cuts to the yard and the late phone. It reads the battery before
 * the station, the lenses close, the housing window before the chip, the radio from above before the
 * street, the map before the desk, and closes in the same yard, closer, holding on the answer.
 *
 * Every visible state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. The county's region stands behind every exterior shot and the hub's
 * window; this episode never paints a full-frame background. The overhead radio and flood path maps
 * are wall views in the registry. Disclosed illustration: no installed station, real street, hub,
 * dashboard, responder, server, lab, deployment or field result.
 */

type V='a'|'b';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const mix=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];

/** The university's reported figure, verbatim from claim c4's quote, and the bar share it sets. */
const VALIDATION={text:'98.82%',share:.9882};

// ---- R15h layouts. Every number a frame-edge bound depends on lives here and is exported, so the
// bound check composes the very values this file draws with (Cam, then the plate camera's
// PlaceSubject) for every frame of each shot in both treatments, instead of a copy of them. ----
/** s1 phone-late: the phone is wider in this shot only, so the banner reflows inside it at today's
 * type size (25 units at the shot's 1.5 scale). The banner slides in over the first SLIDE seconds of
 * s1-event-3; the phone then buzzes twice on the wet rail inside the same event. */
export const PHONE_LATE={w:248,h:451,font:25,scale:1.5,squash:.85,at:{a:[540,938] as Pt,b:[560,948] as Pt},rot:{a:-10,b:8},
 slide:1.05,buzz:[[1.4,1.75],[2.1,2.45]] as [number,number][]};
/** s3 water-marks in the s3-event-3 shot: the tilt (content rises by this much over tiltS seconds) that
 * brings all four underwater lenses above the caption band, and each lens flare's outer radius. */
export const S3_PULSE={tilt:{a:400,b:450},tiltS:.5,flareR:70};
/** s4 chip-glow: the opened housing is centred so its door, box, lamp and the flood risk label keep
 * 40 px at the push's end; the detail push is a centred 1.12 about the frame point PUSH. */
export const CHIP={c:[621,800] as Pt,s:1.1,push:[540,800] as Pt,scale:1.12};
/** s6 flood-paths: the screen bezel ends at y 1236, above the caption band's top. */
export const MAP_SCREEN={x:50,y:280,w:980,h:930};
/** s7 validation-card, HELD (no push in either framing): the validation card upper left, its tag
 * under it, the field result card sliding in to rest lower right. Sized to the composed margins. */
export const S7={card:{at:[172,420] as Pt,s:.72},tag:{at:[205,700] as Pt,s:.78},result:{at:[560,720] as Pt,s:.56,from:{a:1240,b:-420}}};
/** s8 no-field-card, HELD: the two cards in a column on the left, the technician standing at the
 * board on the right, stamping the field result card with her own arm. */
export const S8={card:{at:[150,440] as Pt,s:.6},tag:{at:[170,680] as Pt,s:.64},result:{at:[180,790] as Pt,s:.6},
 tech:{feet:[640,1240] as Pt,s:1},stamp:.8};
/** s8 paper map on the fence, read by the same technician's finger: close (A) and wide (B). */
export const MAPSHOT={close:{m:[130,380] as Pt,w:600,h:660,ground:1400,tech:{feet:[860,1400] as Pt,s:1.25}},
 wide:{m:[360,600] as Pt,w:430,h:470,ground:1236,tech:{feet:[900,1236] as Pt,s:.9}}};
/** The finger's path in map units: along the creek's right reach, then up the street past a blank pin hole. */
export const MAP_READ:Pt[]=[[.84,.63],[.62,.66],[.62,.48],[.62,.3]];
/** s9: the opening yard again. The goal is drawn as a dashed, unlit outline of the station at the curb
 * (no footing, no lamp, no lit lens: not installed and not operating), ringed. The technician stands in
 * the water holding the deployment plan open in her left hand and the prototype's closed case by its
 * handle in her right; the real prototype is in that case. Both treatments shoot it on a wide plate, A
 * at Cam 1.15 and B closer at Cam 1.32, and THE FRAME HOLDS ON THE ANSWER to the end of the shot (R15h
 * pass 4): after the clause she lowers the open plan and turns her head toward the porch rail, and the
 * camera only settles evenly by `settle` (a 2.5 percent ease out over the whole tail), so the ring and
 * both tags stay in view with no whip.
 * The porch rail keeps ordinary yard detail at real size: a phone 44 yard units on its long edge (about
 * 17 cm against the 436 unit technician, about 24 cm against the 172 unit rail) stands on its lowest
 * corner on the rail cap and leans right against the rim of a small terracotta pot (34 units), with
 * contact shadows under both, left of the technician so her body and arms never cover it. Nothing makes
 * it a payoff: no move to it and no beat on it. `tail` times the performed continuation in seconds from
 * s9-event-3's end. */
const PHONE9_L=44;
export const S9={station:{base:[480,1100] as Pt,s:.58},ring:{c:[494,615] as Pt,rx:100,ry:168},
 goal:{at:[640,480] as Pt,s:.72},none:{at:[640,600] as Pt,s:.72},tech:{feet:[350,1300] as Pt,s:.6,wade:40},
 plan:{c:[345,1045] as Pt,w:160,lower:70,tilt:9},case:{s:.26},
 phone:{corner:176,L:PHONE9_L,w:PHONE9_L/2.05,rot:14},pot:{rimW:32,baseW:24,h:34},
 tail:{lower:[.06,.76] as [number,number],turn:[.4,1.1] as [number,number],settle:.025},
 cam:{a:{from:{f:[520,900] as Pt,a:[540,900] as Pt,s:1.15}},b:{from:{f:[553.6,880.3] as Pt,a:[540,826] as Pt,s:1.32}}}};
/** The s9 tail's performed state at film time t (w3End is s9-event-3's end): how far the plan is
 * lowered and how far her head has turned toward the porch rail. ONE CALCULATION, shared by the drawing
 * and the bound check. */
export function s9Tail(t:number,w3End:number){
 const k=S9.tail,w=([a,b]:[number,number])=>ease((t-(w3End+a))/(b-a));
 return {lower:w(k.lower),turn:w(k.turn)};
}
/** Where her left palm pinches the plan's left edge, and the plan's tilt, for a lowering progress. */
export function s9PlanHold(lower:number):{palm:Pt;rot:number}{
 const P=S9.plan;return {palm:[P.c[0]-P.w/2-2-6*lower,P.c[1]+P.lower*lower],rot:P.tilt*lower};
}
const PORCH_RAIL_CAP=-262;
/** The leaning phone, in yard units: the bottom centre its drawing rotates about. The phone leans right
 * by `rot` degrees, so its lowest corner (bottom right, at x `corner`) rests on the rail cap, and its right
 * edge meets the pot's rim `pot.h` above the cap. */
export const s9PhoneFoot=():Pt=>{const ph=S9.phone,r=ph.rot*Math.PI/180,cap=YARD.porch[1]+PORCH_RAIL_CAP;
 return [ph.corner-ph.w/2*Math.cos(r),cap-ph.w/2*Math.sin(r)];};
/** The pot the phone leans on: its centre on the rail cap, placed so its rim touches the phone's edge. */
export const s9PotCentre=():Pt=>{const ph=S9.phone,k=S9.pot,r=ph.rot*Math.PI/180;
 return [ph.corner+k.h*Math.tan(r)+k.rimW/2,YARD.porch[1]+PORCH_RAIL_CAP];};
/** The s9 camera at film time t: the treatment's framing, held, then from s9-event-3's end a single even
 * settle (scale eased out by `settle`, about the same frame point) to the end of the shot. There is no
 * push, pull or move to any other subject. ONE CALCULATION, shared by the drawing and the bound check. */
export function s9Cam(t:number,w3End:number,shotEnd:number,v:'a'|'b'):{f:Pt;s:number;a:Pt;phase:'open'|'settle'}{
 const C0=S9.cam[v].from;
 if(t<w3End)return {...C0,phase:'open'};
 const u=clamp((t-w3End)/(shotEnd-w3End)), e=1-(1-u)*(1-u);
 return {f:C0.f,s:C0.s*(1-S9.tail.settle*e),a:C0.a,phase:'settle'};
}
/** Where the carried case hangs: its handle in her right palm, for her right wrist (her units). */
export function caseFromWrist(o:Placed,W:Pt,cs:number):Pt{
 const a=reach(TECH.SR,W,TECH.upper,TECH.fore).deg*Math.PI/180;
 const palm=techPt(o,[W[0]+TECH.hand*18*Math.cos(a),W[1]+TECH.hand*18*Math.sin(a)]);
 return [palm[0],palm[1]+(CASE.h+38)*cs];
}
/** The yard both s1 and s9 stand in. */
export const YARD={curbY:1086,streetTop:1032,fence:[520,1215] as Pt,fs:1.2,porch:[-30,1250] as Pt,oak:[1000,1150] as Pt};
/** The s9 goal: a dashed, unlit outline of the station in station units (foot at 0,0), drawn as a plan
 * mark rather than an object. Paper under ink so it reads on any ground, at full strength, never faded.
 * No footing, no lamp, no halo, no lit lens: nothing in it is installed or operating. */
const GoalOutline:React.FC<{ink:string;paper:string}>=({ink,paper})=>{
 const H=STATION.housing, cy=H.y+H.h/2, tilt=H.tilt*Math.PI/180;
 const rot=(x:number,y:number):Pt=>[x*Math.cos(tilt)-(y-cy)*Math.sin(tilt),cy+x*Math.sin(tilt)+(y-cy)*Math.cos(tilt)];
 const poly=(ps:Pt[],close=true)=>'M'+ps.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+(close?'Z':'');
 const pa=-14*Math.PI/180, sk=Math.tan(-10*Math.PI/180);
 const panel=(x:number,y:number):Pt=>{const xs=x+sk*y;return [STATION.panel[0]+xs*Math.cos(pa)-y*Math.sin(pa),STATION.panel[1]+xs*Math.sin(pa)+y*Math.cos(pa)];};
 const big=[
  poly([[-15,40],[-15,-1040],[15,-1040],[15,40]],false),
  poly([[-4,-252],[10,-252],[10,-20],[-4,-20]]),
  poly([[H.x,H.y],[H.x+H.w,H.y],[H.x+H.w,H.y+H.h],[H.x,H.y+H.h]].map(([x,y])=>rot(x,y))),
  poly([[-104,-62],[86,-62],[86,30],[-104,30]].map(([x,y])=>panel(x,y))),
  `M${H.x+H.w-20} ${H.y-30}L${H.x+H.w-12} ${H.y-150}Q${H.x+H.w-9} ${H.y-196} ${H.x+H.w+4} ${H.y-210}`,
  `M74 -812H134M118 -830H162M120 -790H160`];
 const pods=STATION.pods.map((y,i)=>{const x=14+STATION.podDx[i];return {x,y};});
 return <g data-part="goal-outline">
  {big.map((d,i)=><path key={'u'+i} d={d} stroke={paper} strokeWidth={15} fill="none" strokeLinejoin="round" strokeLinecap="round"/>)}
  {pods.map(({x,y},i)=><rect key={'pu'+i} x={x-17.5} y={y-18.75} width={50} height={37.5} rx={10} stroke={paper} strokeWidth={11} fill="none"/>)}
  {big.map((d,i)=><path key={'i'+i} d={d} stroke={ink} strokeWidth={7} fill="none" strokeDasharray="22 14" strokeLinejoin="round" strokeLinecap="round"/>)}
  {pods.map(({x,y},i)=><g key={'p'+i}><rect x={x-17.5} y={y-18.75} width={50} height={37.5} rx={10} stroke={ink} strokeWidth={4} fill="none"/>
   <circle cx={x+7.5} cy={y} r={13} stroke={ink} strokeWidth={3.5} fill="none"/></g>)}
 </g>;
};

type Placed={feet:Pt;s:number};
/** The technician's own units to the frame: her floor row lands on `feet`, at scale s. */
export const techPt=(o:Placed,p:Pt):Pt=>[o.feet[0]+(p[0]-TECH.head[0])*o.s,o.feet[1]+(p[1]-TECH.ground)*o.s];
const techInv=(o:Placed,p:Pt):Pt=>[TECH.head[0]+(p[0]-o.feet[0])/o.s,TECH.ground+(p[1]-o.feet[1])/o.s];
/** A wrist (her units) for the hand to put its index fingertip ('tip') or palm ('palm') on a frame
 * point. Returns the wrist and whether her arm can reach it without stretching past its bones. */
export function techHand(o:Placed,side:'left'|'right',world:Pt,pose:HandPose,what:'tip'|'palm'):{wrist:Pt;reachable:boolean}{
 const S=side==='left'?TECH.SL:TECH.SR, sd=side==='left'?-1:1, target=techInv(o,world);
 let W:Pt=target;
 for(let k=0;k<4;k++){
  const deg=reach(S,W,TECH.upper,TECH.fore).deg, a=deg*Math.PI/180;
  const off=what==='tip'?indexTip([0,0],deg,TECH.hand,pose,sd):[TECH.hand*18*Math.cos(a),TECH.hand*18*Math.sin(a)] as Pt;
  W=[target[0]-off[0],target[1]-off[1]];
 }
 return {wrist:W,reachable:Math.hypot(W[0]-S[0],W[1]-S[1])<=TECH.upper+TECH.fore-1};
}
/** Her arm hanging at her side, wrist in her units. */
export const techRest=(side:'left'|'right'):Pt=>side==='left'?[TECH.SL[0]-14,TECH.SL[1]+240]:[TECH.SR[0]+16,TECH.SR[1]+240];
/** Where a rubber stamp's base sits when its knob is in her left palm, for a wrist in her units. */
export function stampFromWrist(o:Placed,W:Pt,ks:number):Pt{
 const a=reach(TECH.SL,W,TECH.upper,TECH.fore).deg*Math.PI/180;
 const palm=techPt(o,[W[0]+TECH.hand*18*Math.cos(a),W[1]+TECH.hand*18*Math.sin(a)]);
 return [palm[0],palm[1]+150*ks];
}
const TechAt:React.FC<{o:Placed;children:React.ReactNode}>=({o,children})=>
 <g transform={`translate(${o.feet[0]-TECH.head[0]*o.s} ${o.feet[1]-TECH.ground*o.s}) scale(${o.s})`}>{children}</g>;
/** The water level, in station units, that each part of the story leaves behind. The lowest lens
 * goes under at ankle height; in the sensing scene the water rises past the fourth. It only rises. */
const LEVEL={start:-20,ankle:-60,top:-215};
/** Lens lamp from the water level: a lens begins to light as the water reaches its housing and is
 * fully lit once the waterline crosses its centre, and it stays lit. */
const podLit=(level:number,i:number)=>clamp((STATION.pods[i]+18-level)/18);
const DISCLOSURE_FONT=26, DISCLOSURE_MAX=330;
function disclosureLines(text:string):string[]{
 const words=text.split(' '), lines:string[]=[];let cur='';
 for(const w of words){const next=cur?cur+' '+w:w;if(cur&&widthOf(next,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=next;}
 if(cur)lines.push(cur);return lines;
}

const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) scale(${s})`} opacity={o}>{children}</g>;
/** A camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,820],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A subject standing on the region's ground outdoors rides the plate's camera with its base row. */
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;
/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
/** Draw only the part of a drawing between rows y0 and y1: above a waterline, or a reflection's band. */
const Band:React.FC<{k:string;y0?:number;y1:number;children:React.ReactNode}>=({k,y0=-6000,y1,children})=>
 <g><defs><clipPath id={'fsband-'+k}><rect x={-6000} y={y0} width={14000} height={Math.max(0,y1-y0)}/></clipPath></defs>
  <g clipPath={`url(#fsband-${k})`}>{children}</g></g>;
/** A dashed line that stops: two short slashes mark the break where it ends, joined to nothing. */
const BreakMark:React.FC<{from:Pt;to:Pt;ink:string}>=({from,to,ink})=>{
 const a=Math.atan2(to[1]-from[1],to[0]-from[0]),ux=Math.cos(a),uy=Math.sin(a),nx=-uy,ny=ux;
 return <g data-part="line-break">{[10,24].map(o=>{const c:Pt=[to[0]+ux*o,to[1]+uy*o];
  return <path key={o} d={`M${c[0]-nx*16-ux*6} ${c[1]-ny*16-uy*6}L${c[0]+nx*16+ux*6} ${c[1]+ny*16+uy*6}`} stroke={ink} strokeWidth={5} strokeLinecap="round"/>;})}</g>;
};

export const FloodStationFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Flood station film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Flood station film must read the single film frame clock');
 const pal:Pal=ad.palette, v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const win=(id:string)=>requireAction(W,id);
 const p=(id:string)=>actionProgress(win(id),t);
 /** A treatment-only event: absent in the other treatment, where its view never draws it. */
 const pOpt=(id:string,fallback=1)=>W[id]?actionProgress(W[id],t):fallback;
 const raw=(w:{start:number;end:number})=>clamp((t-w.start)/(w.end-w.start));
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id, at=(s:string)=>sid===s;
 const flat=ad.flat_shots?.[sid];
 const fr=shot.framing, view=shot.view;
 const st=t-scene.start_s;
 const exterior=!scene.interior&&fr!=='overhead';

 // ---- the performed states, each read from its own event on the film clock ----
 const s1e1=p('s1-event-1'), s1e2=p('s1-event-2'), s1e3=p('s1-event-3'), s1e0=pOpt('s1-event-0');
 const s2e1=p('s2-event-1'), s2e2=p('s2-event-2'), s2e3=p('s2-event-3');
 const s3e1=p('s3-event-1'), s3e2=p('s3-event-2'), s3e3=p('s3-event-3');
 const s4e1=p('s4-event-1'), s4e2=p('s4-event-2'), s4e3=p('s4-event-3');
 const s5e1=p('s5-event-1'), s5e2=p('s5-event-2'), s5e3=p('s5-event-3');
 const s6e1=p('s6-event-1'), s6e2=p('s6-event-2'), s6e3=p('s6-event-3');
 const s7e1=p('s7-event-1'), s7e2=p('s7-event-2'), s7e3=pOpt('s7-event-3',0);
 const s8e1=p('s8-event-1'), s8e2=p('s8-event-2'), s8e3=p('s8-event-3');
 const s9e1=p('s9-event-1'), s9e2=p('s9-event-2'), s9e3=p('s9-event-3');

 // ---- the station's carried state. The water only rises and nothing it has done is undone. ----
 // B's s1 design detail: the lowest, ankle-height lens goes under on s1-event-0 (no station stands in
 // the s1 yard in either treatment). s2: the prototype stands in ankle-deep water. s3: the water rises
 // past the second, third and fourth lenses on s3-event-2, and stays there.
 // s9 returns to the opening yard, where the water is ankle-deep; its goal is an unlit outline, so
 // none of these states is drawn there.
 const level=at('s1')?lerp(LEVEL.start,LEVEL.ankle,ease(s1e0))
  :at('s2')||at('s9')?LEVEL.ankle
  :at('s3')?lerp(LEVEL.ankle,LEVEL.top,s3e2)
  :LEVEL.top;
 const pods=[0,1,2,3].map(i=>podLit(level,i));
 const battery=at('s1')?.24:at('s2')?lerp(.24,1,s2e2):1;
 const weather=[0,1,2,3].map(k=>at('s1')||at('s2')?0:at('s3')?clamp(s3e3*4.2-k*1.05):1);
 const risk=['s1','s2','s3'].includes(sid)?0:at('s4')?s4e2:1;
 // From s4-event-1 ("A small chip on the station runs the AI itself") the readings keep arriving in
 // s4: the first wave runs on the event, the next waves follow at the same period, so the chip is seen
 // running rather than holding still until its judgment.
 const W4=win('s4-event-1'), period4=W4.end-W4.start;
 const readingWaves=!at('s4')||t<W4.start?0:Math.max(.06,((t-W4.start)/period4)%1);
 const station=(o:Partial<{pods:number[];battery:number;sun:number;sunStrength:number;risk:number;weather:number[];transmit:number;window:number;readings:number;wetTo:number;shadow:number}>={})=>
  <FloodStationHero part="station" pods={pods} battery={battery} risk={risk} weather={weather} wetTo={level} time={t} {...o}/>;
 const tag=(lines:string[],shown:number,o:{tone?:'ink'|'accent'|'paper';side?:'left'|'right';scale?:number;drop?:number;size?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${-40*(o.scale??1)*(1-ease(shown))})`} opacity={clamp(shown*3)}>
   <FloodStationHero part="tag" lines={lines} pal={pal} tone={o.tone} side={o.side} scale={o.scale} drop={o.drop} size={o.size}
    swing={10*(1-ease(shown))*(o.side==='left'?1:-1)}/></g>;
 /** A station standing in water at base b, scale s: clipped at its waterline, mirrored below it. */
 const wading=(k:string,b:Pt,s:number,node:React.ReactNode,depth=-level*s,below=900)=>{
  const wl=b[1]-depth;
  return {wl,obj:depth>0?<Band k={k+'o'} y1={wl}>{node}</Band>:node,
   refl:depth>0?<Band k={k+'r'} y0={wl} y1={wl+below}>{mirrorAbout(wl,<Band k={k+'m'} y1={wl}>{node}</Band>)}</Band>:null};
 };

 // ---- the disclosure chip; it names the county map only while the locator card is on screen ----
 const sceneList=board.scenes as unknown as {id:string;production_disclosure?:string}[];
 const namesMap=(d?:string)=>/\bMap\b/.test(d??'');
 const mapShown=t>LOCATOR_START_S&&t<LOCATOR_END_S;
 const plain=sceneList.find(s=>s.production_disclosure&&!namesMap(s.production_disclosure))?.production_disclosure??'Illustration';
 const mapped=sceneList.find(s=>namesMap(s.production_disclosure))?.production_disclosure;
 const own=scene.production_disclosure??'Illustration';
 const disclosureText=mapShown&&mapped?mapped:namesMap(own)?plain:own;
 const dLines=disclosureLines(disclosureText);
 const dW=Math.max(...dLines.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34, dH=dLines.length*32+24;
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={44} y={132} width={dW} height={dH} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;

 // ---- the curbside world: far verge, a street, the limestone curb and the yard, or all of it under
 // the risen water once the sensing scene has passed ----
 type Curbside={curbY:number;streetTop:number;water?:{front:number}|'flooded';grounded:boolean;reflect?:React.ReactNode};
 const curbside=(o:Curbside)=>{
  const g=o.grounded;
  if(o.water==='flooded')return <g data-world="curbside-flooded"><Grounded baseY={o.curbY+40} on={g}>
   <rect x={-60} y={o.streetTop-22} width={1200} height={26} fill="#8D9358"/>
   <StreetHubSupport part="water" x0={-60} x1={1140} y={o.streetTop} depth={1990-o.streetTop} t={t} edge="straight" reflect={o.reflect}/>
  </Grounded></g>;
  return <g data-world="curbside">
   <Grounded baseY={o.curbY+40} on={g}>
    <rect x={-60} y={o.streetTop-18} width={1200} height={22} fill="#8D9358"/>
    <StreetHubSupport part="street" x0={-60} x1={1140} yFar={o.streetTop} yNear={o.curbY} t={t}/>
    {o.water&&<StreetHubSupport part="water" x0={-60} x1={1140} y={o.streetTop+4} depth={o.curbY-o.streetTop-2} t={t} edge="straight" opacity={.92}/>}
    <StreetHubSupport part="curb" x0={-60} y0={o.curbY} x1={1140} y1={o.curbY-6} h={20}/>
    <StreetHubSupport part="lawn" d={`M-60 ${o.curbY+20}L1140 ${o.curbY+14}L1140 1980L-60 1980Z`} box={[-60,o.curbY+14,1200,1980-o.curbY]}/>
    {o.water&&<StreetHubSupport part="water" x0={-60} x1={1140} y={o.curbY+6} depth={Math.max(8,o.water.front-o.curbY)} t={t} seed={13} reflect={o.reflect}/>}
   </Grounded>
  </g>;
 };
 const rain=(op=.3)=><StreetHubSupport part="rain" t={t} w={1240} h={1920} opacity={op}/>;
 const ring=(x:number,y:number,w:number)=><StreetHubSupport part="waterline" x={x} y={y} w={w} t={t}/>;

 /** The San Antonio yard s1 floods and s9 returns to. p1 is s1-event-1's spread, e2 s1-event-2's
  * rise and sway the flagging tag's swing; `ids` names the s1 items (s9 names its own). s9 adds what
  * stands in its water: reflections, things standing at the curb behind the oak, things on the porch
  * rail and things in front of the porch. */
 const yard=(o:{p1:number;e2:number;sway:number;ids:boolean;rain:number;reflect?:React.ReactNode;curb?:React.ReactNode;onRail?:React.ReactNode;front?:React.ReactNode;railPhone?:React.ReactNode})=>{
  const {curbY,streetTop,fence,fs,porch,oak:oakAt}=YARD, post:Pt=[fence[0]+190*fs,fence[1]];
  const step=porch[1]-34, rail:Pt=[porch[0]+PORCH.railTop[0],porch[1]+PORCH.railTop[1]];
  const boots:Pt=[porch[0]+PORCH.w*.56,step];
  const p1=o.p1, over=clamp(p1/.18);
  const front=lerp(curbY+6,1292,clamp(p1/.6))+lerp(0,190,ease(o.e2));
  const dFence=33*ease(clamp((p1-.37)/.23))+4*ease(o.e2);
  const dPorch=30*ease(clamp((p1-.5)/.1))+44*ease(o.e2);
  const dBoots=Math.max(0,dPorch-34);
  const dOak=14*ease(clamp((p1-.12)/.3));
  const I=(id:string,n:React.ReactNode)=>o.ids?<Item id={id}>{n}</Item>:<g>{n}</g>;
  const fenceNode=<At p={fence} s={fs}><StreetHubSupport part="fence" x0={0} x1={380} h={300} posts={3} mark={1} sway={o.sway}/></At>;
  const porchNode=<At p={porch}><StreetHubSupport part="porch"/></At>;
  const bootsNode=<At p={boots}><StreetHubSupport part="boots"/></At>;
  const oakNode=<At p={oakAt}><StreetHubSupport part="oak" h={600} seed={9} flip/></At>;
  const F=wading('yf',fence,1,fenceNode,dFence,400), Pc=wading('yp',porch,1,porchNode,dPorch,500);
  const B=wading('yb',boots,1,bootsNode,dBoots,140), O=wading('yo',oakAt,1,oakNode,dOak,700);
  const yardWater=p1>0&&<StreetHubSupport part="water" x0={-60} x1={1140} y={curbY-14*over} depth={front-(curbY-14*over)} t={t} seed={13}
   reflect={<g>{O.refl}{F.refl}{Pc.refl}{B.refl}{o.reflect}</g>}/>;
  const node=<g>
   {I('s1-water',<Grounded baseY={curbY+40} on={exterior}>
    <rect x={-60} y={streetTop-18} width={1200} height={22} fill="#8D9358"/>
    <StreetHubSupport part="street" x0={-60} x1={1140} yFar={streetTop} yNear={curbY} t={t}/>
    <StreetHubSupport part="water" x0={-60} x1={1140} y={streetTop+3} depth={curbY-streetTop-3+8*over} t={t} edge="straight"/>
    <StreetHubSupport part="curb" x0={-60} y0={curbY} x1={1140} y1={curbY-6} h={20}/>
    <StreetHubSupport part="lawn" d={`M-60 ${curbY+20}L1140 ${curbY+14}L1140 1980L-60 1980Z`} box={[-60,curbY+14,1200,1980-curbY]}/>
    {yardWater}
   </Grounded>)}
   {o.curb}
   <Grounded baseY={oakAt[1]} on={exterior}>{O.obj}</Grounded>
   <Grounded baseY={fence[1]} on={exterior}>{I('s1-post',<>{F.obj}{dFence>0&&ring(post[0],post[1]-dFence,22)}</>)}</Grounded>
   <Grounded baseY={porch[1]} on={exterior}>{Pc.obj}
    {I('s1-boots',<>{B.obj}{dBoots>0&&ring(boots[0]+60,boots[1]-dBoots,70)}</>)}
    {o.railPhone??I('s1-phone',<At p={[rail[0]+60,rail[1]-10]}><g transform="scale(.3 .11) rotate(90)"><StreetHubSupport part="phone" pal={pal} banner={0} t={t}/></g></At>)}
    {o.onRail}</Grounded>
   {o.front}
   {rain(o.rain)}
  </g>;
  return {node,post};
 };

 let pic:React.ReactNode;
 switch(view){
 case 'street-yard':{
  // s1 wide: the university's general example, a San Antonio yard with NO station in it. From the
  // first frame the street is full of reflective flood water lapping at the limestone curb. On
  // s1-event-1 it tops the curb and spreads across the yard; by about 1.0 s in A its edge has reached
  // the chain link post, the orange flagging tag at the ankle mark swings as the edge arrives and the
  // waterline climbs to the orange ankle band. On s1-event-2 it rises over the porch's bottom step and
  // up the rain boots standing there, while the phone on the porch rail stays dark. Everything that
  // stands in the yard is clipped at its waterline and mirrored in the water. A holds and pushes in
  // slowly; B arrives on a match cut from the design detail's ankle-height lens to the ankle mark at
  // the same screen spot, then pulls back to the whole yard.
  const W1=win('s1-event-1');
  const ta=W1.start+.37*(W1.end-W1.start), dt=t-ta;
  const sway=dt>0?22*Math.exp(-3*dt)*Math.sin(2*Math.PI*1.6*dt):0;
  const {node:world,post}=yard({p1:s1e1,e2:s1e2,sway,ids:true,rain:.26});
  if(v==='a'){
   const push=ease(raw({start:shot.start_s,end:shot.start_s+shot.duration_s}));
   pic=<Cam f={mix([540,980],[660,1060],push)} s={lerp(1,1.08,push)} a={mix([540,980],[600,1020],push)}>{world}</Cam>;
  }else{
   const e=ease(raw({start:shot.start_s,end:W1.end}));
   pic=<Cam f={mix([post[0],post[1]-31],[540,1000],e)} s={lerp(2.2,1,e)} a={mix([560,1150],[540,1000],e)}>{world}</Cam>;
  }
  break;}
 case 'phone-late':{
  // s1 close, looking down at the porch rail's wide cap board. The worn phone lies on it, dark, the
  // flood below the balusters; the warning banner slides in only now, after the water is in the yard.
  // The banner slides in over the first PHONE_LATE.slide seconds of s1-event-3 on the event's own
  // contact curve; later in the same event the phone buzzes twice on the wet rail cap, so the late
  // warning keeps performing until the cut instead of holding still.
  const W3=win('s1-event-3'), L=PHONE_LATE;
  const banner=actionProgress({...W3,end:W3.start+L.slide},t);
  const buzz=L.buzz.map(([a,b])=>clamp((t-W3.start-a)/(b-a))).find(q=>q>0&&q<1)??0;
  const rot=L.rot[v], at0:Pt=L.at[v];
  const balusters=<g>{Array.from({length:6},(_,i)=><rect key={i} x={40+i*180+(v==='a'?0:60)} y={1280} width={34} height={420} fill="#EDE6D6" stroke="#BDB2A0" strokeWidth={2}/>)}</g>;
  pic=<g data-world="porch-rail">
   <Item id="s1-water"><StreetHubSupport part="water" x0={-60} x1={1140} y={1300} depth={660} t={t} edge="straight"/></Item>
   {balusters}
   <path d="M-40 700L1120 676L1120 1222L-40 1252Z" fill="#F3EEE3" stroke="#BDB2A0" strokeWidth={3}/>
   <path d="M-40 1252L1120 1222L1120 1282L-40 1314Z" fill="#D5CBB8"/>
   {[[150,780],[760,1170],[930,760],[300,1200]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={30+i*8} ry={4} fill="#B8AD98" opacity={.6}/>)}
   <path d="M-40 708L1120 684" stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
   <Item id="s1-phone"><At p={at0} s={L.scale} r={rot}><g transform={`scale(1 ${L.squash})`}>
    <Item id="s1-banner"><StreetHubSupport part="phone" pal={pal} banner={banner} buzz={buzz} t={t} w={L.w} h={L.h} font={L.font}/></Item></g></At></Item>
   {rain(.22)}
  </g>;
  break;}
 case 'station-wide':{
  // s2 wide: the whole prototype station at the curb, standing in ankle-deep water with its lowest lens
  // lit, revealed on s2-event-1 while "its researchers built a flood station" is heard. A tilts up from
  // the wet foot; B cranes down from the antenna tip to the whole station.
  const base:Pt=[500,1300], s=.84;
  const S=wading('sw',base,s,<At p={base} s={s}>{station({})}</At>);
  const world=<g>
   {curbside({curbY:1180,streetTop:1080,water:{front:1460},grounded:exterior,reflect:S.refl})}
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><Item id="s2-post"><Item id="s2-panel">{S.obj}</Item></Item></Item>
    {ring(base[0]+8,S.wl,34)}
    <At p={[base[0]+130,base[1]-860]}>{tag(['Prototype','flood station'],s2e1,{side:'right',drop:30,scale:.9})}</At></Grounded>
   {rain(.2)}
  </g>;
  const e=ease(raw({start:shot.start_s,end:win('s2-event-1').end}));
  pic=v==='a'
   ?<Cam f={mix([base[0],base[1]-140],[540,860],e)} s={lerp(1.7,1,e)} a={mix([540,1100],[540,860],e)}>{world}</Cam>
   :<Cam f={mix([base[0]+80*s,base[1]-1080*s],[540,860],e)} s={lerp(2.0,1,e)} a={mix([560,560],[540,860],e)}>{world}</Cam>;
  break;}
 case 'panel-charge':{
  // s2 close. Low sun from the upper left reaches the small panel, a glint crosses its cells and the
  // battery bar fills cell by cell on s2-event-2 ("that charges itself from light"). B holds this close
  // through "and needs no cell tower": a far cell tower stands on the horizon behind the antenna and a
  // dashed line toward it stops halfway, broken, on s2-event-3.
  const s=v==='a'?1.6:1.85, base:Pt=v==='a'?[560,2560]:[600,2830];
  const sun=s2e2, beam=clamp(s2e2*3)*(1-.4*clamp((s2e2-.8)*5));
  const tip:Pt=[base[0]+110*s,base[1]-1146*s], towerTop:Pt=[985,1036-460*.5];
  const end=mix(tip,towerTop,lerp(0,.5,ease(s2e3)));
  pic=<g data-world="panel-close">
   {v==='b'&&<Item id="s2-tower"><At p={[985,1036]} s={.5}><StreetHubSupport part="tower" h={420} dim={.25}/></At></Item>}
   <path d={`M-200 -200L${base[0]-28*s-200} ${base[1]-1062*s-120}L${base[0]-28*s+120} ${base[1]-1062*s+60}Z`} fill="#FFE2B6" opacity={.28*beam}/>
   <path d={`M-200 -200L${base[0]-28*s-120} ${base[1]-1062*s-40}`} stroke="#FFF1D8" strokeWidth={6} opacity={.35*beam}/>
   <Item id="s2-station"><At p={base} s={s}><Item id="s2-panel"><Item id="s2-battery">{station({sun,sunStrength:beam,shadow:0})}</Item></Item></At></Item>
   <At p={[120,560]}>{tag(['Charges from light'],s2e2,{side:'right',drop:24,scale:.85})}</At>
   {v==='b'&&s2e3>0&&<g data-part="unconnected-link"><path d={`M${tip[0]} ${tip[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round"/>
    <BreakMark from={tip} to={end} ink={pal.ink}/></g>}
   {v==='b'&&<At p={[1040,520]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:24,scale:.8})}</At>}
   {rain(.12)}
  </g>;
  break;}
 case 'no-tower':{
  // A s2 third shot. The station in the left foreground, a far cell tower on the horizon; a dashed
  // line leaves the antenna toward the tower and stops halfway, broken.
  const base:Pt=[300,1300], s=.86;
  const from:Pt=[base[0]+110*s,base[1]-1146*s], to:Pt=[820,1060-450*.8];
  const end=mix(from,to,lerp(0,.5,ease(s2e3)));
  const S=wading('nt',base,s,<At p={base} s={s}>{station({})}</At>);
  pic=<g data-world="curbside-tower">
   {curbside({curbY:1180,streetTop:1080,water:{front:1460},grounded:exterior,reflect:S.refl})}
   <Grounded baseY={1060} on={exterior}><Item id="s2-tower"><At p={[820,1060]} s={.8}><StreetHubSupport part="tower" h={420} dim={.25}/></At></Item></Grounded>
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><Item id="s2-panel">{S.obj}</Item></Item>{ring(base[0]+8,S.wl,32)}</Grounded>
   {s2e3>0&&<g data-part="unconnected-link"><path d={`M${from[0]} ${from[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="18 13" strokeLinecap="round"/>
    <BreakMark from={from} to={end} ink={pal.ink}/></g>}
   <At p={[780,760]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:28,scale:.95})}</At>
   {rain(.2)}
  </g>;
  break;}
 case 'sensor-stack':{
  // A s3 medium. The view climbs the post from its waterline past four optical lenses at four
  // different heights; each lens catches the low light as the view passes it on s3-event-1. The lowest
  // is already under the reflective water and lit.
  const base:Pt=[520,1500], s=2.4, wl=base[1]+level*s;
  const climb=ease(s3e1);
  const glints=[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i)));
  const S=wading('ss',base,s,<At p={base} s={s}>{station({shadow:0})}</At>);
  pic=<Cam f={[540,lerp(wl,1200,climb)]} s={lerp(1.3,1,climb)} a={[540,lerp(1150,1000,climb)]}><g data-world="post-climb">
   <Item id="s3-water"><StreetHubSupport part="water" x0={-400} x1={1500} y={1240} depth={900} t={t} edge="straight" reflect={S.refl}/></Item>
   {pods.map((g,i)=>{const q=podPoint(i),y=base[1]+q[1]*s;return y>wl&&g>0&&<ellipse key={'u'+i} cx={base[0]+(q[0]+20)*s} cy={y} rx={60} ry={34} fill="#FFC861" opacity={.4*g}/>;})}
   <Item id="s3-stack"><Item id="s3-marks">{S.obj}</Item></Item>
   {ring(base[0]+12,wl,70)}
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+6)*s} cy={base[1]+q[1]*s} r={44*glints[i]} fill="#FFF4DA" opacity={.55*glints[i]}/>;})}
   <At p={[base[0]+150,base[1]-560]}>{tag(['Four optical','sensors'],s3e1,{side:'right',drop:26,scale:.9})}</At>
  </g></Cam>;
  break;}
 case 'water-marks':{
  // The signature view. The post's lens column large, standing in reflective water whose far edge
  // lies just under the horizon. In s3 the camera rises with the water on s3-event-2: the waterline on
  // the post climbs past the second, third and fourth lenses and each lights as it is crossed, the
  // submerged ones glowing amber through the water, every lit lens mirrored in the surface. B s1
  // opens on it as a disclosed DESIGN DETAIL, no yard around it: the camera holds while the water
  // climbs over the lowest, ankle-height lens and it lights (s1-event-0). A frames the column left of
  // centre; B frames it right of centre and closer.
  const detail=at('s1');
  const s=detail?3.2:v==='a'?3.0:3.3;
  const xPost=detail?520:v==='a'?440:600;
  const Ys=detail?1150:lerp(1190,1080,s3e2);
  const base:Pt=[xPost,Ys-level*s];
  const glints=at('s3')?[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i))):[0,0,0,0];
  // n3a ends on the optical sensors alone. In the shot that carries s3-event-3 the camera tilts down
  // with the risen water until all four lit lenses under the surface sit above the caption band, and
  // each lens flares in turn from the highest to the lowest: four sensors at four heights, watching.
  const pulseShot=at('s3')&&shot.event_id==='s3-event-3';
  const D=pulseShot?S3_PULSE.tilt[v]*ease(raw({start:shot.start_s,end:shot.start_s+S3_PULSE.tiltS})):0;
  const flare=[0,1,2,3].map(i=>pulseShot?Math.sin(Math.PI*clamp(s3e3*4-(3-i))):0);
  const ids=detail?['s1-post','s1-marks','s1-water']:['s3-stack','s3-marks','s3-water'];
  const S=wading('wm',base,s,<At p={base} s={s}>{station({shadow:0})}</At>);
  const bank=<g data-part="far-bank">
   <path d="M-80 1012Q300 1004 620 1014T1160 1010L1160 1046L-80 1046Z" fill="#7E8A4A"/>
   {[[120,1030,90],[700,1026,120],[980,1032,70]].map(([x,y,h],i)=><At key={i} p={[x,y]}><StreetHubSupport part="oak" h={h} seed={30+i}/></At>)}
  </g>;
  pic=<g data-world={detail?'design-detail':'sensor-column'} transform={D?`translate(0 ${(-D).toFixed(2)})`:undefined}>
   {bank}
   <Item id={ids[2]}><StreetHubSupport part="water" x0={-80} x1={1160} y={1042} depth={900} t={t} edge="straight"
    reflect={<g>{mirrorAbout(1044,bank)}{S.refl}</g>}/></Item>
   {(()=>{const glow=pods.map((g,i)=>{const q=podPoint(i),y=base[1]+q[1]*s;return y>Ys+8&&g>0&&<g key={'u'+i}>
    <ellipse cx={base[0]+(q[0]+20)*s} cy={y} rx={90} ry={46} fill="#FFC861" opacity={.38*g}/>
    <ellipse cx={base[0]+(q[0]+20)*s} cy={y} rx={34} ry={18} fill="#FFE7AE" opacity={.5*g}/></g>;});
    return detail?<g>{glow}</g>:<Item id="s3-glow">{glow}</Item>;})()}
   <Item id={ids[0]}><Item id={ids[1]}>{S.obj}</Item></Item>
   {ring(xPost+14,Ys,96)}
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+10)*s} cy={base[1]+q[1]*s} r={56*glints[i]} fill="#FFF4DA" opacity={.5*glints[i]}/>;})}
   {pulseShot&&<Item id="s3-glow">{[0,1,2,3].map(i=>{const q=podPoint(i);return flare[i]>0&&<g key={'f'+i} data-part="lens-flare">
    <circle cx={base[0]+(q[0]+20)*s} cy={base[1]+q[1]*s} r={S3_PULSE.flareR*(.55+.45*flare[i])} fill="none" stroke="#FFE7AE" strokeWidth={6} opacity={.85*flare[i]}/>
    <ellipse cx={base[0]+(q[0]+20)*s} cy={base[1]+q[1]*s} rx={70} ry={36} fill="#FFC861" opacity={.35*flare[i]}/></g>;})}</Item>}
   {!detail&&rain(.16)}
  </g>;
  break;}
 case 'weather-row':{
  // s3 close on the housing. Rain, temperature, humidity and light lamps come on one by one on
  // s3-event-3, each with its label, and drops fall into the rain funnel.
  const s=v==='a'?2.6:2.9, c:Pt=v==='a'?[520,860]:[500,900];
  const base:Pt=[c[0]-14*s,c[1]+865*s];
  const labels=['Rain','Temperature','Humidity','Light'];
  const lamp=(k:number):Pt=>{const H=STATION.housing;return [base[0]+(H.x+30+k*26)*s,base[1]+(H.y+92)*s];};
  pic=<g data-world="housing-close">
   <Item id="s3-stack"><Item id="s3-weather"><At p={base} s={s}>{station({shadow:0})}</At></Item></Item>
   {[0,1,2].map(k=>{const ph=(t*1.4+k*.33)%1, fx=base[0]+(STATION.housing.x+26)*s, fy=base[1]+(STATION.housing.y-44)*s;return <circle key={k} cx={fx+(k-1)*14} cy={fy-220+220*ph} r={4} fill="#D6E4EC" opacity={.7*(1-ph*.6)}/>;})}
   {labels.map((l,k)=>{const on=weather[k], y=1090+k*58, q=lamp(k);return on>0&&<g key={l} opacity={clamp(on*2)}>
    <path d={`M${80+widthOf(l,30,true)+30} ${y-10}L${q[0]} ${q[1]+26}`} stroke={pal.ink} strokeWidth={2.4} opacity={.7}/>
    <At p={[70,y-36]}><StreetHubSupport part="label" text={l} pal={pal} size={30}/></At></g>;})}
   {rain(.15)}
  </g>;
  break;}
 case 'chip-glow':{
  // s4. The housing opened, still clamped to its post with its door hanging on the left hinges:
  // readings run in along thin traces from the four lenses and four weather sensors to one small chip
  // on s4-event-1 ("A small chip on the station runs the AI itself"). On s4-event-2 ("so it judges
  // flood risk") the chip sends its judgment along a trace: the large hooded amber lamp blazes and the
  // risk bar beside the board climbs from one low step to four. The detail framing pushes in on the
  // chip and the lamp. No cable leaves the box for a server.
  // THE PUSH IS BOUNDED IN FINAL SCREEN SPACE. The opened housing sits at CHIP.c so its door, box,
  // large lamp and flood risk label keep 40 px from every edge at rest, and the detail push is a
  // centred CHIP.scale about CHIP.push that still keeps them 40 px inside at its end. The readings
  // start with "A small chip..." and flow in two waves across the clause.
  const {c,s}=CHIP;
  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s4-event-2').start})):0;
  const chipGlow=Math.max(.35*s4e1,s4e2);
  const readings=readingWaves;
  pic=<g data-world="housing-cutaway"><Cam f={CHIP.push} s={lerp(1,CHIP.scale,push)} a={CHIP.push}>
   <Item id="s4-traces"><Item id="s4-chip"><Item id="s4-risk"><At p={c} s={s}>
    <FloodStationHero part="cutaway" readings={readings} chip={chipGlow} risk={s4e2} battery={battery}/></At></Item></Item></Item>
  </Cam>
   <At p={[90,300]}>{tag(['Judged on','the station'],s4e2,{side:'right',drop:24,scale:.9})}</At>
  </g>;
  break;}
 case 'no-server':{
  // s4. Close (B's opening shot of the scene): the station's housing large, its window glowing as
  // readings run along its traces to the chip on s4-event-1, seen from the street. Wide (both
  // treatments' last shot, "without a central server"): the station large in the right foreground in
  // the risen water, all four lenses and its amber risk lamp lit. Across the road, on the far verge, a
  // distant dark windowless server building stands unlit. On s4-event-3 a dashed line leaves the
  // station toward it and stops well short, broken, and never connects.
  if(fr==='close'){
   const base:Pt=[560,2300], s=1.5;
   pic=<g data-world="housing-window">
    <Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1,readings:readingWaves,shadow:0})}</At></Item></Item></Item>
    {rain(.14)}
   </g>;
   break;
  }
  const base:Pt=[790,1290], s=.92, server:Pt=[230,1050];
  const from:Pt=[base[0]+(STATION.housing.x-4)*s,base[1]+(STATION.housing.y+70)*s], to:Pt=[server[0]+150,server[1]-70];
  const end=mix(from,to,.6*ease(s4e3));
  const S=wading('ns',base,s,<At p={base} s={s}>{station({window:1})}</At>);
  pic=<g data-world="curbside-no-server">
   {curbside({curbY:1160,streetTop:1056,water:'flooded',grounded:exterior,reflect:S.refl})}
   <Grounded baseY={server[1]} on={exterior}><Item id="s4-server"><At p={server}><StreetHubSupport part="server" w={240}/></At>
    {ring(server[0]+20,server[1]-4,150)}
    <At p={[server[0]-60,server[1]-200]}>{tag(['Central server'],clamp(s4e3*2),{side:'right',drop:20,scale:.78,tone:'ink'})}</At></Item></Grounded>
   <Grounded baseY={base[1]} on={exterior}><Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces">{S.obj}</Item></Item></Item>{ring(base[0]+8,S.wl,38)}</Grounded>
   {s4e3>0&&<g data-part="unconnected-link"><path d={`M${from[0]} ${from[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={7} strokeDasharray="20 14" strokeLinecap="round"/>
    {s4e3>.2&&<BreakMark from={from} to={end} ink={pal.ink}/>}</g>}
   {rain(.18)}
  </g>;
  break;}
 case 'radio-rings':{
  // s5 at street level, on the Blackland plate. A long street of bungalows recedes to the hub at its
  // far end, the whole street under the risen, reflective water. A pulse flashes at the station's
  // antenna on s5-event-1 and amber rings run down the street over the water, shrinking with
  // distance, until the leading ring reaches the hub and its mast lamp and window light. On
  // s5-event-2 a scale bar draws itself down the street's centre line from the station's end to the
  // hub and its more than a half-mile tag pins.
  const V0:Pt=[640,984];
  const P=(X:number,Y:number,z:number):Pt=>[V0[0]+(X-V0[0])/z,V0[1]+(Y-V0[1])/z];
  const base:Pt=[170,1290], s=.74, tip:Pt=[base[0]+110*s,base[1]-1146*s];
  const ringStart=v==='a'?win('s5-event-1').start:shot.start_s, travel=raw({start:ringStart,end:win('s5-event-2').end});
  const lead=clamp(travel*1.25);
  const hubLamp=clamp((lead-.94)/.06);
  const houses=[1.35,1.9,2.7,3.8,5.4,7.6,10.5].flatMap((z,k)=>[{z,k,side:-1},{z,k,side:1}]).sort((a,b)=>b.z-a.z);
  const S=wading('rr',base,s,<At p={base} s={s}>{station({transmit:s5e1>0&&s5e1<1?s5e1:0})}</At>);
  const hubP=P(640,1340,13), hubS=.26;
  const bar0=P(640,1430,1.6), bar1=P(640,1430,12.5), barEnd=mix(bar0,bar1,ease(s5e2));
  pic=<g data-world="street-perspective">
   <Grounded baseY={1200} on={exterior}>
    <path d={`M-60 1980L${V0[0]-10} ${V0[1]+4}L${V0[0]+10} ${V0[1]+4}L1140 1980Z`} fill="#46433F"/>
    <path d={`M-60 1420L${V0[0]-10} ${V0[1]+4}L-60 ${V0[1]+4}Z`} fill="#6F7E45"/>
    <path d={`M1140 1420L${V0[0]+10} ${V0[1]+4}L1140 ${V0[1]+4}Z`} fill="#6F7E45"/>
    <StreetHubSupport part="water" x0={-60} x1={1140} y={V0[1]+6} depth={1990-V0[1]} t={t} edge="straight" opacity={.9}
     reflect={<g>{houses.map(({z,k,side})=>{const q=P(side<0?-240:1320-360,1330,z);
      return <g key={'r'+k+side}>{mirrorAbout(q[1],<At p={q}><StreetHubSupport part="house" w={360/z} seed={4+k*3+(side>0?1:0)} color={['#D8CDB8','#CFC6B6','#E2D8C4'][k%3]}/></At>)}</g>;})}{S.refl}</g>}/>
   </Grounded>
   {houses.map(({z,k,side})=>{const q=P(side<0?-240:1320-360,1330,z);return <Grounded key={k+'-'+side} baseY={q[1]} on={exterior}>
    <At p={q}><StreetHubSupport part="house" w={360/z} seed={4+k*3+(side>0?1:0)} color={['#D8CDB8','#CFC6B6','#E2D8C4'][k%3]}/></At></Grounded>;})}
   <Item id="s5-hub"><Grounded baseY={hubP[1]} on={exterior}><At p={hubP} s={hubS}><StreetHubSupport part="hub" lamp={hubLamp} glow={hubLamp} pal={pal}/></At></Grounded></Item>
   <Item id="s5-ring"><g data-part="street-rings">
    {[0,1,2].map(k=>{const u=clamp(travel*1.25-k*.12);if(u<=0||u>=1)return null;const z=lerp(1.15,13,Math.pow(u,1.6)),c=P(640,1420,z);
     return <ellipse key={k} cx={c[0]} cy={c[1]} rx={560/z} ry={150/z} fill="none" stroke={pal.accent} strokeWidth={Math.max(2.5,11/Math.sqrt(z))} opacity={.95-.3*u}/>;})}
    <At p={tip}><StreetHubSupport part="rings" p={clamp(travel*3)} rx={150} ry={150} n={2} pal={pal}/></At>
   </g></Item>
   <Item id="s5-tags"><Item id="s5-halfmile">{s5e2>0&&<g data-part="scale-bar">
    <path d={`M${bar0[0]} ${bar0[1]}L${barEnd[0]} ${barEnd[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="22 12"/>
    <path d={`M${bar0[0]-44} ${bar0[1]}H${bar0[0]+44}`} stroke={pal.ink} strokeWidth={7}/>
    {s5e2>.95&&<path d={`M${bar1[0]-12} ${bar1[1]}H${bar1[0]+12}`} stroke={pal.ink} strokeWidth={4}/>}
   </g>}
    <At p={[704,1040]}>{tag(['More than','a half-mile'],s5e2,{side:'right',drop:18,scale:.82,tone:'accent'})}</At></Item></Item>
   <Grounded baseY={base[1]} on={exterior}><Item id="s5-antenna">{S.obj}</Item>{ring(base[0]+8,S.wl,30)}</Grounded>
   {rain(.12)}
  </g>;
  break;}
 case 'radio-open':
 case 'hub-wide':{
  // s5 open country, on the Blackland plate's own open ground (no city skyline). The station stays the
  // source in frame in an inset at the upper left, its antenna pulsing. Rings roll out from the inset
  // across the open fields; the leading ring reaches the hub's rooftop mast, placed low in the frame,
  // at the middle of s5-event-3, and the mast lamp, the receiver and the hub window light as it
  // arrives, as the five-mile tag pins ("up to five miles in open country, to a hub").
  const open=view==='radio-open';
  const hubAt:Pt=open?[700,1250]:[600,1262], hs=open?.82:.98;
  const mast:Pt=[hubAt[0]+(-126)*hs,hubAt[1]+(-622)*hs];
  const inset={x:56,y:296,w:300,h:340}, isB:Pt=[257,724], ant:Pt=[isB[0]+110*.3,isB[1]-1146*.3];
  const R=Math.hypot(mast[0]-ant[0],mast[1]-ant[1]);
  const e3=win('s5-event-3'), tm=(e3.start+e3.end)/2;
  const ringP=clamp((t-shot.start_s)/(tm-shot.start_s));
  const lamp=clamp((t-tm)/.12);
  // The station keeps sending: after the first rings land, the next set leaves the inset and reaches
  // the mast one travel time later, again until the cut, and the mast flashes as each set lands.
  const period=tm-shot.start_s, wave=Math.max(0,Math.floor((t-tm)/period));
  const ringP2=t>tm?((t-tm)/period)%1:0, land2=t>tm+period?(t-tm)-wave*period:-1;
  const flash2=land2>=0?Math.exp(-4*land2):0;
  pic=<g data-world="open-country">
   <Grounded baseY={1080} on={exterior}>
    <StreetHubSupport part="lawn" d="M-60 988L1140 980L1140 1980L-60 1980Z" box={[-60,980,1200,1000]} seed={23}/>
    {Array.from({length:6},(_,i)=><path key={i} d={`M${-60+i*240} 1980L${300+i*90} 992`} stroke="#7E8A4A" strokeWidth={22} opacity={.35}/>)}
    <path d="M-60 1040Q500 1024 1140 1060" stroke="#C9B994" strokeWidth={18} fill="none"/>
   </Grounded>
   <Grounded baseY={1120} on={exterior}><At p={[60,1120]} s={.8}><StreetHubSupport part="fence" x0={0} x1={460} h={240} posts={4} mark={-1}/></At></Grounded>
   <Item id="s5-hub"><Grounded baseY={hubAt[1]} on={exterior}><At p={hubAt} s={hs}><StreetHubSupport part="hub" lamp={lamp} glow={lamp} pal={pal}/></At></Grounded></Item>
   <Item id="s5-ring"><g data-part="open-rings">{[ringP,ringP2].flatMap((P,w)=>[0,1,2].map(k=>{const u=P*1.0-k*.18;if(u<=0||u>1.08)return null;
    return <circle key={w+'-'+k} cx={ant[0]} cy={ant[1]} r={R*u} fill="none" stroke={pal.accent} strokeWidth={8*(1.2-.5*Math.min(1,u))} opacity={Math.min(.95,1.6-1.2*u)}/>;}))}
    {flash2>.02&&<circle cx={mast[0]} cy={mast[1]} r={(14+60*(1-flash2))*hs} fill="none" stroke={pal.accent} strokeWidth={5} opacity={flash2}/>}</g></Item>
   <Item id="s5-antenna"><g data-part="station-inset">
    <defs><clipPath id="fs-inset"><rect x={inset.x} y={inset.y} width={inset.w} height={inset.h} rx={18}/></clipPath></defs>
    <rect x={inset.x+6} y={inset.y+10} width={inset.w} height={inset.h} rx={18} fill="#1E1A16" opacity={.25}/>
    <rect x={inset.x} y={inset.y} width={inset.w} height={inset.h} rx={18} fill="#D9DCD6"/>
    <g clipPath="url(#fs-inset)">
     <rect x={inset.x} y={inset.y+inset.h-70} width={inset.w} height={70} fill="#7B6A4C"/>
     <At p={isB} s={.3}>{station({transmit:clamp(((t-shot.start_s)*1.6)%1)})}</At>
    </g>
    <rect x={inset.x} y={inset.y} width={inset.w} height={inset.h} rx={18} fill="none" stroke={pal.ink} strokeWidth={5}/>
    <rect x={inset.x+14} y={inset.y+14} width={118} height={38} rx={8} fill={pal.paper} stroke={pal.ink} strokeWidth={2}/>
    <text x={inset.x+28} y={inset.y+42} fontFamily={FONT.body} fontSize={24} fontWeight={800} fill={pal.ink}>Station</text>
   </g></Item>
   <Item id="s5-tags"><Item id="s5-fivemile"><At p={[90,760]}>{tag(['Up to five miles','in open country'],s5e3,{side:'right',drop:22,scale:.8,tone:'accent'})}</At></Item></Item>
  </g>;
  break;}
 case 'radio-map':{
  // B s5 overhead. The street map from above: a ring leaves the station dot on s5-event-1 and spreads
  // over the city grid toward open country and the hub. The half-mile circle is a tenth of the
  // five-mile circle, and each label appears only as the ring reaches its circle.
  const m:Pt=[80,300], mw=840, mh=960, stationAt:Pt=[300,330], hubAt:Pt=[700,860];
  const lead=clamp(s5e1*1.3);
  pic=<g data-world="radio-map">
   <Item id="s5-station-dot"><Item id="s5-ring"><At p={m}><StreetHubSupport part="radiomap" w={mw} h={mh} ring={s5e1} half={.6} five={.6} hub={0} pal={pal} station={stationAt} hubAt={hubAt}/></At></Item></Item>
   <Item id="s5-tags"><g opacity={clamp((lead-.1)*8)}><At p={[m[0]+stationAt[0]+90,m[1]+stationAt[1]-110]}><StreetHubSupport part="label" text="More than a half-mile" pal={pal} size={30}/></At></g>
   <g opacity={clamp((lead-.92)*12)}><At p={[m[0]+330,m[1]+mh-120]}><StreetHubSupport part="label" text="Up to five miles" pal={pal} size={30}/></At></g></Item>
  </g>;
  break;}
 case 'hub-desk':{
  // s6 inside the hub, close on the desk; the window behind is only soft light. A complete responder
  // sits at the desk end in a navy work jacket. A: as the station dots arrive and the second, larger
  // model tag pins (s6-event-1), his near arm reaches from his lap to the keyboard, shoulder, elbow,
  // wrist and fingers, and his index finger presses a key; then his head turns up to the map. B: with
  // the map already drawn, on s6-event-3 he reaches up and touches a dashed higher-risk zone on the
  // screen, then brings his forearm to rest on the desk beside the monitor as the responders tag pins.
  const scr:[number,number,number,number]=[110,400,680,480];
  const rest:Pt=[790,1150], keyW:Pt=[604,1080], touchW:Pt=[640,820], deskRest:Pt=[742,1070];
  let hand:Pt, pose:'open'|'point'|'rest'|'press'='rest', look=0, press=0;
  if(v==='a'){
   const e=ease(raw({start:win('s6-event-1').start,end:win('s6-event-1').end}));
   hand=mix(rest,keyW,e); pose=e<.05?'rest':'point';
   press=clamp((e-.82)/.18)*(1-clamp((t-win('s6-event-1').end-.25)/.2));
   look=ease(raw({start:win('s6-event-1').end-.15,end:win('s6-event-1').end+.55}));
  }else{
   const w3=win('s6-event-3'), q=raw(w3);
   hand=q<.6?mix(keyW,touchW,ease(q/.6)):mix(touchW,deskRest,ease((q-.6)/.4)); pose=q<.62?'point':'rest'; look=1;
  }
  pic=<g data-world="hub-desk">
   <Item id="s6-dashboard"><Item id="s6-hand"><StreetHubSupport part="desk" screen={scr} hand={hand} pose={pose} look={look} t={t} press={press}>
    <Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones"><StreetHubSupport part="dashboard" w={scr[2]} h={scr[3]} dots={v==='a'?s6e1:1} paths={v==='a'?.15*s6e1:1} zones={v==='a'?0:s6e3} t={t} pal={pal}/></Item></Item></Item>
   </StreetHubSupport></Item></Item>
   {v==='a'&&<At p={[560,236]}>{tag(['A second,','larger model'],s6e1,{side:'right',drop:22,scale:.85})}</At>}
   {v==='b'&&<At p={[560,236]}>{tag(['For emergency','responders'],s6e3,{side:'right',drop:22,scale:.85})}</At>}
  </g>;
  break;}
 case 'flood-paths':{
  // s6 overhead on the hub's screen: the flood path map. Orange flood paths spread along the creek
  // from the first station dots, then down the low streets to the low points (s6-event-2, "maps flood
  // paths"). A: higher-risk zones outline themselves and the responders tag pins (s6-event-3). B opens
  // here: the dots arrive and the second, larger model tag pins (s6-event-1) before the paths spread.
  // The bezel ends at y + h + 26, above the caption band's top for the whole shot.
  const {x,y,w,h}=MAP_SCREEN;
  pic=<g data-world="dashboard-screen">
   <rect x={x-26} y={y-26} width={w+52} height={h+52} rx={18} fill="#26292B" stroke="#121415" strokeWidth={4}/>
   <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
    <Item id="s6-dashboard"><Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones">
     <StreetHubSupport part="dashboard" w={w} h={h} dots={v==='a'?1:s6e1} paths={s6e2} zones={v==='a'?s6e3:0} t={t} pal={pal}/></Item></Item></Item></Item>
   </svg>
   <At p={[600,400]}>{v==='a'?tag(['For emergency','responders'],s6e3,{side:'right',drop:20,scale:.8}):tag(['A second,','larger model'],s6e1,{side:'right',drop:20,scale:.8})}</At>
  </g>;
  break;}
 case 'validation-card':
 case 'no-field-card':{
  // s7 and the first shot of s8, outdoors at the curb: a notice board on two weathered posts stands on
  // the verge, the wet street and its reflective standing water in front, the region behind. In
  // clause order in both treatments. s7-event-1, from the first words of "The university reports
  // early chip AI validation": an orange tape strip is pressed along the validation card's bar from
  // end to end. s7-event-2, from the first words of "Accuracy was ninety eight point eight two
  // percent": the university's reported figure appears on the full bar, then the initial assessments
  // tag is pinned under the card. s7-event-3: the blank field result card slides onto the board and a
  // pushpin presses it home. s8-event-0: the technician standing at the board brings a rubber stamp
  // down onto the blank card with her own arm, presses none reported and lifts it away.
  //
  // HELD FRAMINGS, NO PUSH (R15h). Twice a push or an offset was tuned to keep these cards in the
  // frame and twice a card still left it, because the group already rides the plate camera
  // (PlaceSubject: the framing's zoom about film row 960 and the scene's dolly, truck or crane). Now
  // neither view pushes. Each holds one layout (S7, S8) whose cards are sized and placed inside the
  // composed safe margins at every frame of both treatments.
  const moved=!!W['s8-event-0'], stamp=moved?p('s8-event-0'):s7e3;
  const boardW=<g>
   <g>
    <StreetHubSupport part="lawn" d="M-60 1150L1140 1140L1140 1262L-60 1268Z" box={[-60,1140,1200,128]} seed={71}/>
    <StreetHubSupport part="curb" x0={-60} y0={1262} x1={1140} y1={1256} h={20}/>
    <StreetHubSupport part="street" x0={-60} x1={1140} yFar={1282} yNear={1990} t={t}/>
    <StreetHubSupport part="water" x0={-60} x1={1140} y={1290} depth={700} t={t} edge="straight" opacity={.92}
     reflect={mirrorAbout(1262,<g>{[160,914].map(x=><rect key={x} x={x-16} y={960} width={34} height={302} fill="#6B4E33"/>)}<rect x={110} y={330} width={860} height={630} fill="#8C6A49"/></g>)}/>
   </g>
   <StreetHubSupport part="board" x0={110} x1={970} y0={330} y1={960} ground={1240}/>
  </g>;
  if(view==='validation-card'){
   const {card,tag:tg,result:rs}=S7;
   // The card is pinned up as the scene opens (its first pin pressed home), the tape strip is laid on
   // s7-event-1, the spent roll drops away and the second pin is pressed: the shot keeps performing
   // until the cut. The figure arrives on s7-event-2, with "Accuracy was ninety eight point eight two
   // percent", and the after training tag pins in the rest of that event.
   const W1e=win('s7-event-1'), up=ease(raw({start:scene.start_s,end:scene.start_s+.4}));
   const pin1=clamp((t-scene.start_s-.25)/.2), rollOut=raw({start:W1e.end,end:W1e.end+.6}), pin2=clamp((t-W1e.end-.62)/.25);
   const r2=raw(win('s7-event-2')), figure=ease(clamp(r2/.35)), tagShown=clamp((r2-.35)/.65);
   const slide=moved?ease(clamp(s7e3/.8)):1, pinIn=moved?clamp((s7e3-.8)/.2):1;
   const resAt:Pt=[lerp(rs.from[v],rs.at[0],slide),rs.at[1]];
   pic=<Grounded baseY={1240} on={exterior}><g data-world="curb-notice-board">
    {boardW}
    <Item id="s7-card"><Item id="s7-bar"><g opacity={clamp(up*2)} transform={`translate(0 ${(-30*(1-up)).toFixed(2)})`}>
     <At p={card.at} s={card.s}><StreetHubSupport part="card" fill={s7e1} figure={figure} rollOut={rollOut} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At>
     {pin1>0&&<At p={[card.at[0]+22,card.at[1]+11]}><StreetHubSupport part="pin" color="#C84B3A" press={pin1}/></At>}
     {pin2>0&&<At p={[card.at[0]+610*card.s,card.at[1]+10]}><StreetHubSupport part="pin" color="#3E7A9C" press={pin2}/></At>}</g></Item></Item>
    <Item id="s7-tag"><At p={tg.at}>{tag(['Initial assessments','after training'],tagShown,{side:'right',drop:30,scale:tg.s})}</At></Item>
    <Item id="s7-card2"><Item id="s7-blank">{(moved?s7e3>0:true)&&<g><At p={resAt} s={rs.s}><StreetHubSupport part="result" stamp={0} pal={pal}/></At>
     {slide>=1&&<At p={[resAt[0]+280*rs.s,resAt[1]+12]}><StreetHubSupport part="pin" color="#E3A32B" press={pinIn}/></At>}</g>}</Item></Item>
   </g></Grounded>;
   break;
  }
  const ids=moved?{card:'s8-valcard',bar:'s8-valbar',tag:'s8-assess',card2:'s8-card2',blank:'s8-blank'}:{card:'s7-card',bar:'s7-bar',tag:'s7-tag',card2:'s7-card2',blank:'s7-blank'};
  const SW=win(moved?'s8-event-0':'s7-event-3');
  const {card,tag:tg,result:rs,tech,stamp:ks}=S8;
  // The stamp hangs in the technician's hand at her side, rises to hover over the blank card before
  // the event, comes down, presses and lifts on the event, and her arm returns to her side after it.
  // The stamp's knob is always in her palm: its base is placed from her hand, never on its own.
  const mark:Pt=[rs.at[0]+280*rs.s,rs.at[1]+250*rs.s];
  const restBase=stampFromWrist(tech,techRest('left'),ks);
  const hover:Pt=[mark[0]+30,mark[1]-160], down:Pt=[mark[0],mark[1]+12];
  const raise=ease(raw({start:shot.start_s+.15,end:SW.start})), lower=ease(raw({start:SW.end,end:SW.end+.7}));
  const press=stamp<.45?ease(stamp/.45):stamp<.66?1:1-ease((stamp-.66)/.34);
  const base:Pt=stamp<=0?mix(restBase,hover,raise):stamp<1?mix(hover,down,press):mix(hover,restBase,lower);
  const squash=stamp>.45&&stamp<.66?Math.sin(Math.PI*(stamp-.45)/.21)*.06:0;
  const printed=clamp((stamp-.45)/.06);
  const wrist=techHand(tech,'left',[base[0],base[1]-150*ks],'grip','palm').wrist;
  const techProps={left:wrist,right:techRest('right'),leftPose:'grip' as const,rightPose:'rest' as const,look:[-.9,-.15] as Pt,t,ground:TECH.ground};
  pic=<Grounded baseY={1240} on={exterior}><g data-world="curb-notice-board-two-cards">
   {boardW}
   <Item id={ids.card}><Item id={ids.bar}><At p={card.at} s={card.s}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At>
    <At p={[card.at[0]+20,card.at[1]+10]}><StreetHubSupport part="pin" color="#C84B3A"/></At></Item></Item>
   <Item id={ids.tag}><At p={tg.at}>{tag(['Initial assessments','after training'],s7e2,{side:'right',drop:24,scale:tg.s})}</At></Item>
   <Item id={ids.card2}><Item id={ids.blank}><At p={rs.at} s={rs.s}><StreetHubSupport part="result" stamp={printed} pal={pal}/></At>
    <At p={[rs.at[0]+280*rs.s,rs.at[1]+12]}><StreetHubSupport part="pin" color="#E3A32B"/></At>
    <g data-part="stamping">
     <TechAt o={tech}><StreetHubSupport part="technician" {...techProps} layer="body"/></TechAt>
     <At p={base}><g transform={`scale(${ks*(1+squash)} ${ks*(1-squash)})`}><StreetHubSupport part="stamp"/></g></At>
     <TechAt o={tech}><StreetHubSupport part="technician" {...techProps} layer="arms"/></TechAt>
    </g></Item></Item>
  </g></Grounded>;
  break;}
 case 'empty-map':
 case 'station-return':{
  // s8's second shot, outdoors at the curb: the one paper street map pinned to the chain link fence,
  // the region behind it and the wet street below. A frames it close (empty-map), B wide on the curb
  // (station-return). The technician who stamped the card stands at the fence beside the map, her
  // whole figure attached to the hand that reads it. s8-event-1: the map settles on the mesh.
  // s8-event-2: her hand comes up, one finger slides along the creek's right reach and up a street
  // past a blank pin hole, and her arm goes back to her side; the map keeps its blank holes.
  // s8-event-3: the announcement names no installation tag pins beside it.
  const close=view==='empty-map', L=close?MAPSHOT.close:MAPSHOT.wide;
  const settle=ease(s8e1);
  const m:Pt=[L.m[0],L.m[1]+lerp(-24,0,settle)];
  const mw=L.w, mh=L.h;
  const w2=win('s8-event-2'), approach=raw({start:win('s8-event-1').end,end:w2.start}), exit=raw({start:w2.end,end:w2.end+.5});
  const q=s8e2, touch=clamp(q/.12)*(1-clamp((q-.82)/.18)), slide=ease(clamp((q-.12)/.68));
  const trace=MAP_READ.map(([u,vv])=>[m[0]+u*mw,m[1]+vv*mh] as Pt);
  const along=(u:number):Pt=>{const seg=trace.slice(1).map((pt,i)=>Math.hypot(pt[0]-trace[i][0],pt[1]-trace[i][1]));let d=u*seg.reduce((a,b)=>a+b,0);
   for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1)return mix(trace[i],trace[i+1],seg[i]?clamp(d/seg[i]):0);d-=seg[i];}return trace[trace.length-1];};
  const tipAt=along(slide), lift=1-touch, hs=L.tech.s;
  const target:Pt=[tipAt[0]-10*lift*hs,tipAt[1]-22*lift*hs];
  const restW=techRest('left'), touchW=techHand(L.tech,'left',target,'point','tip').wrist;
  const startW=techHand(L.tech,'left',[trace[0][0]-10*hs,trace[0][1]-22*hs],'point','tip').wrist;
  const wrist:Pt=q<=0?mix(restW,startW,ease(approach)):exit<=0?touchW:mix(touchW,restW,ease(exit));
  const resting=(q<=0&&approach<=0)||exit>=1;
  const techProps={left:wrist,right:techRest('right'),leftPose:(resting?'rest':'point') as HandPose,rightPose:'rest' as const,look:[-1,-.1] as Pt,t,ground:TECH.ground};
  const fence=close?<At p={[-40,1400]} s={2.6}><StreetHubSupport part="fence" x0={0} x1={460} h={420} posts={3} lean={1.5} mark={-1}/></At>
   :<At p={[300,1232]}><StreetHubSupport part="fence" x0={0} x1={640} h={660} posts={3} lean={1.5} mark={-1}/></At>;
  const groundY=L.ground;
  pic=<Grounded baseY={groundY} on={exterior}><g data-world="paper-map-on-fence">
   <g>
    <StreetHubSupport part="lawn" d={`M-60 ${groundY-40}L1140 ${groundY-46}L1140 ${groundY+40}L-60 ${groundY+44}Z`} box={[-60,groundY-46,1200,90]} seed={81}/>
    <StreetHubSupport part="curb" x0={-60} y0={groundY+40} x1={1140} y1={groundY+36} h={20}/>
    <StreetHubSupport part="water" x0={-60} x1={1140} y={groundY+62} depth={1990-groundY} t={t} edge="straight"
     reflect={mirrorAbout(groundY+40,fence)}/>
   </g>
   <Item id="s8-fence">{fence}</Item>
   <Item id="s8-map"><Item id="s8-nopin"><At p={m} r={lerp(4,-1,settle)} o={clamp(settle*3+.2)}>
    <StreetHubSupport part="mapcard" w={mw} h={mh} pal={pal}/></At></Item></Item>
   {[[m[0]+30,m[1]+14],[m[0]+mw-34,m[1]+18]].map(([x,y2],i)=><circle key={i} cx={x} cy={y2} r={close?10:7} fill="#5A5249" stroke="#2E2A26" strokeWidth={2}/>)}
   <TechAt o={L.tech}><StreetHubSupport part="technician" {...techProps} layer="body"/></TechAt>
   <Item id="s8-hand">
    {q>0&&touch>.3&&<ellipse cx={target[0]+6} cy={target[1]+6} rx={16*hs} ry={6*hs} fill="#1E1A16" opacity={.18*touch}/>}
    <TechAt o={L.tech}><StreetHubSupport part="technician" {...techProps} layer="arms"/></TechAt>
   </Item>
   <Item id="s8-tag"><At p={close?[m[0]+mw-60,m[1]+40]:[m[0]+mw-30,m[1]+30]}>{tag(['Announcement names','no installation'],s8e3,{side:'left',drop:26,scale:close?.92:.78,tone:'ink'})}</At></Item>
  </g></Grounded>;
  break;}
 case 'curb-table':{
  // s9 RETURNS TO THE OPENING (R15h). "Deployment is still the goal" closes forward, in the yard the
  // film opened in: the same flooded street, limestone curb, chain link fence with its orange ankle
  // mark, live oak and porch, with a real-size phone leaning on a pot on the porch rail. The goal at the
  // curb is a dashed, unlit OUTLINE of the station: no footing, no lamp, no lit lens, so nothing there
  // is installed or operating. The real prototype is in the closed carry case the technician who
  // stamped the field result card holds by its handle in her right hand, standing in the water with the
  // deployment plan in her left. s9-event-1, from the clause's first word: she opens the folded plan
  // out. s9-event-2: she looks up from the plan to the curb, an amber goal ring draws itself around the
  // outline and a field result tag, none reported, pins beside it. s9-event-3: the deployment goal tag
  // pins beside the ringed outline, never over it. THE TAIL (after the clause, from the same clock):
  // she lowers the open plan and turns her head from the goal toward the porch rail, while the frame
  // holds on the answer with only an even settle (s9Cam). The small phone on the rail is ordinary yard
  // detail at real size, never a payoff. Nothing is
  // folded away, packed, lifted or installed. Her hand holds the case by its handle only, so no arm
  // passes through the case.
  const w2=win('s9-event-2'), w3=win('s9-event-3');
  const r2=raw(w2), ringDraw=ease(clamp(r2/.7)), noneShown=clamp((r2-.35)/.65), look=ease(clamp(r2/.5));
  const C9=s9Cam(t,w3.end,shot.start_s+shot.duration_s,v), tail=s9Tail(t,w3.end);
  const SB=S9.station.base, ss=S9.station.s, T=S9.tech, P=S9.plan;
  const goal=<At p={SB} s={ss}><GoalOutline ink={pal.ink} paper={pal.paper}/></At>;
  const wl9=SB[1]+LEVEL.ankle*ss;
  const hold=s9PlanHold(tail.lower);
  const leftW=techHand(T,'left',hold.palm,'pinch','palm').wrist;
  const rightW=techRest('right'), caseAt=caseFromWrist(T,rightW,S9.case.s);
  const lookX=lerp(lerp(0,1,look),-1,tail.turn), lookY=lerp(lerp(-.5,.05,look),0,tail.turn);
  const techProps={left:leftW,right:rightW,leftPose:'pinch' as const,rightPose:'grip' as const,look:[lookX,lookY] as Pt,t,ground:TECH.ground};
  const techNode=<TechAt o={T}><StreetHubSupport part="technician" {...techProps} layer="body"/></TechAt>;
  const tw=wading('s9t',T.feet,1,techNode,T.wade,320);
  const ps=P.w/200;
  const R=S9.ring, ringLen=Math.PI*(3*(R.rx+R.ry)-Math.sqrt((3*R.rx+R.ry)*(R.rx+3*R.ry)));
  const ringD=`M${R.c[0]} ${R.c[1]-R.ry}A${R.rx} ${R.ry} 0 1 1 ${R.c[0]} ${R.c[1]+R.ry}A${R.rx} ${R.ry} 0 1 1 ${R.c[0]} ${R.c[1]-R.ry}`;
  const sway=4*Math.sin(t*1.7);
  // The phone at real size, ordinary yard detail: drawn as the 220 by 451 unit phone scaled down to
  // S9.phone.w, it stands on its lowest corner on the rail cap and leans right against the rim of a small
  // terracotta pot, screen to the yard and dark, with contact shadows under the phone's corner and the pot
  // and a soft shadow where the phone meets the rim. Nothing moves on it.
  const ph=S9.phone, foot=s9PhoneFoot(), k9=ph.w/220, PH=220*2.05, rr=ph.rot*Math.PI/180;
  const corner:Pt=[foot[0]+ph.w/2*Math.cos(rr),foot[1]+ph.w/2*Math.sin(rr)];
  const pot=S9.pot, pc=s9PotCentre(), rim:Pt=[pc[0]-pot.rimW/2,pc[1]-pot.h];
  const railPhone=<g data-part="s9-phone-on-rail">
   <ellipse cx={pc[0]+3} cy={pc[1]+1.2} rx={pot.baseW*.75} ry={2.2} fill="#1E1A16" opacity={.36}/>
   <g data-part="s9-rail-pot">
    {[[-3,-pot.h-12,-9,-pot.h-22],[2,-pot.h-14,4,-pot.h-26],[6,-pot.h-11,13,-pot.h-19]].map(([x0,y0,x1,y1],i)=>
     <path key={i} d={`M${pc[0]+x0} ${pc[1]-pot.h+2}Q${pc[0]+(x0+x1)/2-2} ${pc[1]+(y0+y1)/2} ${pc[0]+x1} ${pc[1]+y1}`} stroke="#5E7A4A" strokeWidth={3.2} fill="none" strokeLinecap="round"/>)}
    <path d={`M${pc[0]-pot.baseW/2} ${pc[1]}L${pc[0]-pot.rimW/2+2} ${pc[1]-pot.h+6}H${pc[0]+pot.rimW/2-2}L${pc[0]+pot.baseW/2} ${pc[1]}Z`} fill="#B5653A" stroke="#6E3A20" strokeWidth={1.2}/>
    <path d={`M${pc[0]+pot.baseW/2-5} ${pc[1]-1}L${pc[0]+pot.rimW/2-6} ${pc[1]-pot.h+7}`} stroke="#8E4A28" strokeWidth={4} opacity={.6}/>
    <rect x={rim[0]} y={rim[1]} width={pot.rimW} height={7} rx={1.5} fill="#C97A4A" stroke="#6E3A20" strokeWidth={1.2}/>
    <path d={`M${rim[0]+3} ${rim[1]+2}H${rim[0]+pot.rimW*.55}`} stroke="#E3A57A" strokeWidth={1.4} opacity={.8}/>
   </g>
   <ellipse cx={corner[0]-ph.w*.4} cy={corner[1]+1.2} rx={ph.w*.6} ry={2} fill="#1E1A16" opacity={.38}/>
   <path d={`M${rim[0]} ${rim[1]+7}l3 0l-1 12l-2 0Z`} fill="#1E1A16" opacity={.25}/>
   <At p={foot} r={ph.rot}><g transform={`scale(${k9})`}><g transform={`translate(0 ${-PH/2})`} data-part="s9-dark-phone">
    <StreetHubSupport part="phone" pal={pal} banner={0} t={t}/>
   </g></g></At></g>;
  const {node:world}=yard({p1:1,e2:1,sway,ids:false,rain:.2,reflect:<g>{tw.refl}</g>,railPhone,
   curb:<Grounded baseY={SB[1]} on={exterior}><Item id="s9-station"><Band k="s9g" y1={wl9}>{goal}</Band></Item></Grounded>,
   front:<g>
    <Grounded baseY={T.feet[1]} on={exterior}>
     <Item id="s9-tech">{tw.obj}{ring(T.feet[0],tw.wl,46)}</Item>
     <Item id="s9-case"><At p={caseAt} s={S9.case.s}><StreetHubSupport part="case" latch={1}/></At></Item>
     <TechAt o={T}><StreetHubSupport part="technician" {...techProps} layer="arms" only="right"/></TechAt>
     <Item id="s9-plan"><At p={hold.palm} r={hold.rot} s={ps}><g transform={`translate(${100+2/ps} 0)`}><StreetHubSupport part="plan" fold={2*(1-s9e1)} pal={pal}/></g></At></Item>
     <TechAt o={T}><StreetHubSupport part="technician" {...techProps} layer="arms" only="left"/></TechAt>
    </Grounded>
    <Grounded baseY={SB[1]} on={exterior}>
     {ringDraw>0&&<path d={ringD} fill="none" stroke={pal.accent} strokeWidth={7} strokeLinecap="round" data-part="goal-ring"
      strokeDasharray={`${(ringLen*ringDraw).toFixed(1)} ${ringLen.toFixed(1)}`} opacity={.9+.1*Math.sin(t*3)}/>}
     <At p={S9.none.at}>{tag(['Field result','None reported'],noneShown,{side:'right',drop:26,scale:S9.none.s})}</At>
     <Item id="s9-tag"><At p={S9.goal.at}>{tag(['Deployment goal'],s9e3,{side:'right',drop:26,scale:S9.goal.s,tone:'accent'})}</At></Item>
    </Grounded>
   </g>});
  pic=<Item id="s9-curb"><Cam f={C9.f} s={C9.s} a={C9.a}>{world}</Cam></Item>;
  break;}
 default:throw new Error('Unimplemented flood station view '+view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={st.toFixed(3)}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
/** Layout constants, exported for readers of the geometry above. */
export const FLOOD_STATION_LAYOUT={LEVEL,VALIDATION,STATION};
