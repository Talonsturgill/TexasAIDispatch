import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject,usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {RobotaxiHero,CAR,SIDE_BOX,TOP_BOX,type SideProps,type TopProps} from './RobotaxiHero';
import {SanAntonioSupport,CURB,CURB_PLAN,CREEK,STREET,LANE,LOT,LOT_PLAN,LANE_PLAN,STREET_PLAN,CREEK_PLAN,
 recordLayout,REMEDY_ROW,QUOTE_TEXT,type Imprint} from './SanAntonioSupport';

/**
 * robotaxi-recall-v1: the ride and the recall (2026-10-19, Bexar County).
 *
 * ONE generic white driverless car (RobotaxiHero) carries the film; SanAntonioSupport draws its world
 * and the federal record. Every performed state below is a closed function of the film clock and the
 * board's event windows, so any frame renders alone and the same twice:
 *
 *  s1  the car brakes into the airport pickup curb (s1-event-1, travel), its steering wheel turns and
 *      returns with the driver seat empty as it rolls to the bay (s1-event-2), and it settles at the bay
 *      mark as the phone's request pin reaches the curb and turns to arriving (s1-event-3).
 *  s2  a San Antonio street map draws in (linear), a February calendar lands on it as the outline starts
 *      to trace, and the outline closes around the moving car pins with its sixty square miles tag.
 *  s3  rain streaks in and brown water rises over a low water crossing below a limestone bank, climbs
 *      the wheels of an EMPTY car, then lifts it sideways off the slab into the creek (travel). Illustrated,
 *      no occupant, no damage.
 *  s4  floodwater spreads along a residential street and climbs to a second empty car's wheel arches,
 *      the car creeps, stops (its speed follows the board's contact curve) and its amber hazards start to
 *      blink; the camera finds the empty cabin as the water stills. The mud line stays.
 *  s5  the recall record card slides onto a desk and its rows write in, a grid of car icons fills row by
 *      row, the counter tag settles and a software recall stamp lands on the card.
 *  s6  THE TURN. The car runs the higher speed lane, slows with its brake lamps lit (its speed eases
 *      down along the board's contact curve), releases and rolls on into standing water with a wake at
 *      its wheels. Its speed never reaches zero: there is no stop state and no crash. The recall
 *      sentence's word may lights as the front wheel meets the water.
 *  s7  the remedy row lights, a pen tip rests on it, an under development stamp lands on it.
 *  s8  a weather limits tag slides along a cord and clips above the fleet row, an April calendar flips
 *      to 20, and each car takes a check mark left to right as the vehicle map card is marked updated.
 *  s9  back at the same curb bay the same car waits, its curbside rear door swings open, the record card
 *      slides in beside the curb and its remedy row is underlined, still under development.
 *
 * The region stands behind every exterior shot (PlaceStage); this episode never paints a full-frame
 * background. Ground-standing worlds ride the plate camera through PlaceSubject. Documents and the map
 * plan are wall views in the registry. Disclosed illustration: a generic car with no brand mark, no
 * real airport, creek, street, road, rider, record page or app screen.
 */

type V='a'|'b';
type Pt=[number,number];
type Box=[number,number,number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const DEG=180/Math.PI;

// ---- the performed motion, read from the board's windows -----------------------------------------
/** Time integral (seconds) of a window's curve value from its start to t, using the same curve,
 * anticipation and settle that actionProgress uses. Lets a speed follow the board's curve exactly. */
export function curveIntegral(w:ActionWindow,t:number):number{
 const dur=w.end-w.start,a=w.motion?.anticipation??0,s=w.motion?.settle??0,curve=w.motion?.curve??'smoothstep';
 const p=clamp((t-w.start)/dur),span=1-a-s;
 if(p<=a)return 0;
 const q=clamp((p-a)/span);
 const C=curve==='contact'?q**4*(5-9*q+6*q*q-10/7*q**3):curve==='travel'?q**4*(2.5-3*q+q*q):curve==='linear'?q*q/2:q**3*(1-q/2);
 return dur*(span*C+Math.max(0,p-(1-s)))+Math.max(0,t-w.end);
}
/** Brake lamps for a car that stops between events: held lit while stopped, released as each stroke
 * starts, lit again through its braking half. */
function strokeBrake(r:number){return r<.5?1-smooth(r/.12):smooth((r-.5)/.25);}
/** Amber hazard flasher from t0: a soft-edged square wave at about 1.3 per second. */
export function blink(t:number,t0:number){return t<t0?0:clamp(.5+3*Math.sin(2*Math.PI*(t-t0)/.76-.6));}

/** Lane speeds in car units per second: running, and rolling on into the water. */
export const S6={vHi:1100,vLo:200,kWide:.7,kPlan:.5,F0wide:900,F0plan:780};
/** Every performed state of the film at time t. Pure: the drawing and the bound check share it. */
export function robotaxiState(W:Record<string,ActionWindow>,t:number){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const w=(id:string)=>W[id];
 // s1: braking in, rolling to the bay with the wheel turning, settling at the mark
 const p11=P('s1-event-1'),p12=P('s1-event-2'),p13=P('s1-event-3');
 const D1=534*p11+114*p12+23*p13;
 const phases:[string,number][]=[['s1-event-1',R('s1-event-1')],['s1-event-2',R('s1-event-2')],['s1-event-3',R('s1-event-3')]];
 let brake1=1;for(const [id,r] of phases){const x=w(id);if(x&&t>=x.start&&t<=x.end)brake1=strokeBrake(r);}
 const s1={D:D1,wheel:D1/CAR.tireR*DEG,brake:brake1,dip:1.1*Math.sin(Math.PI*smooth((R('s1-event-1')-.55)/.45))+.5*Math.sin(Math.PI*smooth(R('s1-event-3'))),
  steer:34*Math.sin(Math.PI*p12),route:.55*p12+.45*p13,pin:.5+.5*p13,status:clamp((p13-.3)/.4)};
 // s2: the map draws in, the calendar lands, the outline traces and closes
 const p23=P('s2-event-3');
 const s2={draw:P('s2-event-1'),cal:P('s2-event-2'),zone:.3*P('s2-event-2')+.7*p23,fill:clamp((p23-.8)/.2),tag:clamp((p23-.55)/.45)};
 // s3: rain, the water over the crossing, the sweep
 const s3={rain:.25+.75*P('s3-event-1'),lvl:4+26*P('s3-event-1')+22*P('s3-event-2'),sweep:P('s3-event-3')};
 // s4: water spreads and rises; the car creeps at a steady 60 world units a second, then its speed
 // follows s4-event-2's contact curve down to a stop; the hazards start blinking in that event
 const w42=w('s4-event-2'),t40=w('s4-event-1')?w('s4-event-1')!.start-.2:0,v4=60;
 const X4=423+v4*(Math.max(0,t-t40)-(w42?curveIntegral(w42,t):0));
 const p41=P('s4-event-1');
 const s4={front:lerp(-120,1200,p41),lvl:6+60*clamp((p41-.25)/.75),X:X4,wheel:(X4-423)/.8/CAR.tireR*DEG,
  hazard:w42?blink(t,w42.start)*clamp(R('s4-event-2')*4):0,calm:P('s4-event-3')};
 // s5: card, rows, grid, counter and stamp
 const w51=w('s5-event-1'),r53=R('s5-event-3');
 const s5={slide:P('s5-event-1'),rows:w51?clamp((t-(w51.start+.45*(w51.end-w51.start)))/1.5):0,grid:P('s5-event-2'),
  tag:smooth(r53/.5),stamp:r53,imprint:clamp((r53-.45)/.06)};
 // s6: running, slowing along s6-event-2's contact curve, rolling on into the water. Never zero speed.
 const w62=w('s6-event-2'),w63=w('s6-event-3'),t60=w('s6-event-1')?w('s6-event-1')!.start-.2:0;
 const X6at=(tt:number)=>S6.vHi*Math.max(0,tt-t60)+(w62?(S6.vLo-S6.vHi)*curveIntegral(w62,tt):0);
 const X6=X6at(t),Xw=w63?X6at(w63.start)+CAR.front+16:1e9;
 const r62=R('s6-event-2');
 const s6={X:X6,Xw,wheel:X6/CAR.tireR*DEG,brake:w62&&t>=w62.start&&t<=w62.end?clamp(r62*5)*(1-clamp((r62-.9)/.1)):0,
  dip:1.2*Math.sin(Math.PI*P('s6-event-2')),frontIn:clamp((X6+CAR.wheels[1]-Xw)/110),rearIn:clamp((X6+CAR.wheels[0]-Xw)/110),
  may:P('s6-event-3'),e1:P('s6-event-1'),e2:P('s6-event-2'),X2end:w62?X6at(w62.end):0};
 // s7: the remedy row lights, the pen rests, the stamp lands
 const r73=R('s7-event-3');
 const s7={lit:P('s7-event-1'),pen:P('s7-event-2'),stamp:r73,imprint:clamp((r73-.45)/.06)};
 // s8: tag clips on the cord, calendar flips, checks run left to right
 const s8={tag:P('s8-event-1'),flip:P('s8-event-2'),checks:P('s8-event-3')};
 // s9: door opens, card slides in, remedy underlined
 const s9={door:P('s9-event-1'),slide:P('s9-event-2'),underline:P('s9-event-3')};
 return {s1,s2,s3,s4,s5,s6,s7,s8,s9};
}
export type RobotaxiState=ReturnType<typeof robotaxiState>;

// ---- layout. Every number a frame-edge bound depends on is here and exported, so the bound check
// composes the values this file draws with (Cam, then the plate camera's PlaceSubject). ------------
export const CURB_CAR={y:1240,s:.88,x0:90};
export const curbCarX=(D:number)=>CURB_CAR.x0+D*CURB_CAR.s;
export const CREEK_CAR={x:560,s:.72};
export const STREET_CAR={y:1222,s:.8};
export const LANE_CAR={s:.7};
export const LOT_CARS={y:1190,s:.34,xs:[-60,130,320,510,700,890]};
export const LIMITS_DETAIL={tag:[470,290] as Pt,calendar:[250,640] as Pt,map:[500,680] as Pt,icons:[130,270,410,550,690,830],iconY:1190};
export const CARD_W=760;
export const COUNT_TAG={at:[690,300] as Pt,size:40,lines:['Nearly 3,800','vehicles','3,791 potentially','affected in the record']};
export const LOT_TAG={x:480};
/** s1 overhead: the car comes up the curb lane, k plan pixels per car unit, to the bay at y 810. */
export const CURB_PLAN_CAR={y0:1347,k:.8};
export const MAP_CAL={stand:[760,600] as Pt,flat:[230,1000] as Pt,plan:[230,990] as Pt};
export const PHONE_HAIL={at:[96,646] as Pt,rot:-5,w:300};
/** Where the record card sits in each document view: top left and scale. */
export const CARD_AT:Record<string,{x:number;y:number;s:number}>={
 'record-desk':{x:130,y:420,s:.95},'count-grid':{x:60,y:290,s:.56},'record-wall':{x:122,y:300,s:1.04},
 'record-close':{x:80,y:300,s:1.0},'stamp-detail':{x:20,y:240,s:1.18},'record-slide':{x:50,y:950,s:.42},
 'curb-return':{x:40,y:880,s:.44},'curb-record-split':{x:54,y:0,s:1.08},'curb-plan':{x:644,y:980,s:.36}};
/** The s5 and s7 stamp marks, in card units. They stay on the card for the rest of the film. */
export function cardImprints(st:RobotaxiState):Imprint[]{
 const L=recordLayout(CARD_W),rem=L.rows[REMEDY_ROW];
 return [{text:'Software recall',p:st.s5.imprint,x:560,y:L.rows[0].y+46,rot:-8,size:40},
  {text:'Under development',p:st.s7.imprint,x:rem.vx+232,y:rem.y+rem.h/2,rot:-6,size:34}];
}
export type Cam={f:Pt;s:number;a:Pt};
const ID:Cam={f:[540,960],s:1,a:[540,960]};
/** The camera for each view at time t: world point f lands on screen point a at scale s. */
export function viewCam(view:string,sid:string,v:V,t:number,st:RobotaxiState,shot:{start_s:number;duration_s:number}):Cam{
 switch(view){
 case 'phone-hail':return {f:[680,1150],s:.9,a:[640,1100]};
 case 'curb-record-split':return {f:[680,1150],s:.95,a:[560,600]};
 case 'record-slide':return {f:[640,1120],s:1.08,a:[580,920]};
 case 'car-swept':{const sw=st.s3.sweep;return {f:[560+42*sw,1120+40*sw],s:1.45,a:[540,1000]};}
 case 'hazard-close':{const e=st.s4.calm,x=st.s4.X;return {f:[x+lerp(140,70,e),lerp(1120,1100,e)],s:2.4,a:[540,840]};}
 case 'wheel-water':{const e=st.s4.calm,x=st.s4.X;return {f:[x,lerp(1150,1110,e)],s:lerp(1.35,1.5,e),a:[540,930]};}
 case 'lane-wide':{const k=S6.kWide,follow=st.s6.X*k+180,hold=st.s6.X2end*k+180,F0=S6.F0wide;
  return {f:[(1-st.s6.e1)*F0+st.s6.e1*((1-st.s6.e2)*follow+st.s6.e2*hold),960],s:1,a:[540,960]};}
 case 'wheels-water':{const k=S6.kWide;return {f:[(st.s6.X+CAR.wheels[1])*k-75,1180],s:1.5/k,a:[540,1000]};}
 case 'lane-plan':{const k=S6.kPlan,Y=1400-st.s6.X*k,follow=Y-140,hold=1400-st.s6.X2end*k-140,F0=S6.F0plan;
  return {f:[540,(1-st.s6.e1)*F0+st.s6.e1*((1-st.s6.e2)*follow+st.s6.e2*hold)],s:1,a:[540,960]};}
 case 'limits-tag':return {f:[460,860],s:1.28,a:[540,820]};
 case 'map-zone':case 'map-table':case 'map-plan':return ID;
 default:return ID;
 }
}

// ---- small drawing helpers -------------------------------------------------------------------------
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${r.toFixed(3)}) scale(${s.toFixed(4)})`} opacity={o}>{children}</g>;
/** The place stage's plate centre in film pixels, about which its framing zoom scales a grounded subject. */
export const PLATE_CENTRE:Pt=[540,960];
/** Cam is the composite framing a view wants. A grounded subject is already scaled by the place stage's
 * framing zoom z about the plate centre, so the group applies scale s/z about the matching focus, and
 * the composite is the authored one. Overlays never sit inside a CamG. */
export function camTransform(c:Cam,z:number,outer=false){
 if(outer)return {a:[PLATE_CENTRE[0]+(c.a[0]-PLATE_CENTRE[0])/z,PLATE_CENTRE[1]+(c.a[1]-PLATE_CENTRE[1])/z] as Pt,s:c.s/z,f:c.f};
 const fx=PLATE_CENTRE[0]+z*(c.f[0]-PLATE_CENTRE[0]),fy=PLATE_CENTRE[1]+z*(c.f[1]-PLATE_CENTRE[1]);
 return {a:c.a,s:c.s/z,f:[fx,fy] as Pt};
}
/** Views whose world runs thousands of units along a road ground AFTER the camera: the stage's move
 * then acts on the framed picture at the car's screen base row, not on far world coordinates. */
export const OUTER_GROUND=new Set(['lane-wide','wheels-water']);
/** The screen row a camera puts a world row on, before the stage's own zoom. */
export const screenRow=(c:Cam,y:number)=>c.a[1]+c.s*(y-c.f[1]);
const CamG:React.FC<{c:Cam;z:number;outer?:boolean;children:React.ReactNode}>=({c,z,outer=false,children})=>{const k=camTransform(c,z,outer);
 return <g transform={`translate(${k.a[0].toFixed(2)} ${k.a[1].toFixed(2)}) scale(${k.s.toFixed(5)}) translate(${(-k.f[0]).toFixed(2)} ${(-k.f[1]).toFixed(2)})`}>{children}</g>;};
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;
/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const Clip:React.FC<{k:string;box:Box;children:React.ReactNode}>=({k,box,children})=>
 <g><defs><clipPath id={'rtxclip-'+k}><rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]}/></clipPath></defs>
  <g clipPath={`url(#rtxclip-${k})`}>{children}</g></g>;
const mirrorAbout=(y:number,node:React.ReactNode)=><g transform={`matrix(1 0 0 -1 0 ${2*y})`}>{node}</g>;
const side=(p:Pt,s:number,o:SideProps,r=0,flip=false)=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${r.toFixed(3)}) scale(${(flip?-s:s).toFixed(4)} ${s.toFixed(4)})`}><RobotaxiHero part="side" {...o}/></g>;
const top=(p:Pt,s:number,rot:number,o:TopProps)=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${rot}) scale(${s})`}><RobotaxiHero part="top" {...o}/></g>;
/** The car's box in world units for a side drawing at p, scale s. */
export const sideBox=(p:Pt,s:number):Box=>[p[0]+SIDE_BOX[0]*s,p[1]+SIDE_BOX[1]*s,p[0]+SIDE_BOX[2]*s,p[1]+SIDE_BOX[3]*s];
export const topBoxUp=(p:Pt,s:number):Box=>[p[0]-TOP_BOX[3]*s,p[1]-TOP_BOX[2]*s,p[0]-TOP_BOX[1]*s,p[1]-TOP_BOX[0]*s];

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=330;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}

export const RobotaxiFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Robotaxi film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Robotaxi film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const S=robotaxiState(W,t);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing;
 const exterior=!scene.interior&&fr!=='overhead';
 const flat=ad.flat_shots?.[sid];
 const cam=viewCam(view,sid,v,t,S,shot);
 const place=usePlace(),z=place&&place.mode==='exterior'?place.zoom:1;
 const imprints=cardImprints(S);
 const rain=(amount:number)=><SanAntonioSupport part="rain" t={t} amount={amount}/>;
 const tag=(lines:string[],shown:number,o:{size?:number;tone?:'paper'|'accent'|'ink';icon?:'rain';sub?:number;dir?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${(-36*(1-smooth(shown))).toFixed(2)})`} opacity={clamp(shown*3)}>
   <SanAntonioSupport part="tag" lines={lines} size={o.size} tone={o.tone} icon={o.icon} sub={o.sub} swing={9*(1-smooth(shown))*(o.dir??1)}/></g>;
 const card=(k:string,o:{rows:number;lit?:number;underline?:number})=>{const c=CARD_AT[k];
  return <At p={[c.x,c.y]} s={c.s}><SanAntonioSupport part="record" w={CARD_W} rows={o.rows} remedyLit={o.lit} underline={o.underline} imprints={imprints}/></At>;};
 /** The rubber stamp's choreography on a time fraction r of its event: lift, come down, press, lift away.
  * Its base lands on the screen point `mark`; `k` is its drawn scale. */
 const stampAt=(r:number,mark:Pt,k:number,rest:Pt)=>{
  const go=smooth(r/.45),back=smooth((r-.66)/.34);
  const base:Pt=r<=0||r>=1?rest:r<.45?[lerp(rest[0],mark[0],go),lerp(rest[1],mark[1],go)-150*k*Math.sin(Math.PI*go)]
   :r<.66?mark:[lerp(mark[0],rest[0],back),lerp(mark[1],rest[1],back)-150*k*Math.sin(Math.PI*back)];
  const squash=r>.45&&r<.66?Math.sin(Math.PI*(r-.45)/.21)*.07:0;
  return <g data-part="stamping"><At p={base}><g transform={`rotate(-6) scale(${(k*(1+squash)).toFixed(4)} ${(k*(1-squash)).toFixed(4)})`}><SanAntonioSupport part="stamp"/></g></At></g>;
 };
 const cardPoint=(k:string,lx:number,ly:number):Pt=>{const c=CARD_AT[k];return [c.x+c.s*lx,c.y+c.s*ly];};
 const L=recordLayout(CARD_W),rem=L.rows[REMEDY_ROW];

 // ---- the curb, shared by s1 and s9 eye-level views ----
 const s1Car=side([curbCarX(S.s1.D),CURB_CAR.y],CURB_CAR.s,{wheel:S.s1.wheel,brake:S.s1.brake,dip:S.s1.dip,cabin:.6});
 const s9Car=side([curbCarX(671),CURB_CAR.y],CURB_CAR.s,{wheel:671/CAR.tireR*DEG,brake:0,door:S.s9.door,cabin:.7});
 const benchPhone=(status:number,pin:number)=><g transform="translate(330 1040) rotate(-12) scale(.12)"><SanAntonioSupport part="phone" w={300} pin={pin} status={status} t={t}/></g>;
 const curbWorld=(car:React.ReactNode,ids:{curb:string;car:string;phone?:string},phone?:React.ReactNode)=>
  <Grounded baseY={CURB_CAR.y} on={exterior}>
   <Item id={ids.curb}><SanAntonioSupport part="curb" phone={ids.phone&&phone?<Item id={ids.phone}>{phone}</Item>:undefined}/></Item>
   <Item id={ids.car}>{car}</Item>
  </Grounded>;

 let pic:React.ReactNode;
 switch(view){
 case 'curb-wide':{
  // s1 wide, eye level across the pickup lane. The car starts half in frame at the left, pulls away,
  // and brakes into the bay on s1-event-1's travel curve; its brake lamps flare as it slows and stay
  // lit while it waits. The canopy, the leaning bay sign and the suitcase say airport without words.
  pic=<CamG c={cam} z={z}>{curbWorld(s1Car,{curb:'s1-curb',car:'s1-car',phone:'s1-phone'},benchPhone(S.s1.status,S.s1.pin))}</CamG>;
  break;}
 case 'cab-wheel':{
  // s1 detail from the rear seat: the steering wheel turns right and back on s1-event-2's contact
  // curve with no hands on it and nobody in the driver seat, while the curb and the bay sign slide past
  // the windshield as the car rolls to its bay. The region's own sky and oaks stand through the glass.
  const roll=114*clamp(S.s1.D>=534?(S.s1.D-534)/114:0);
  const k=1+.0021*roll,sx=lerp(720,930,roll/114);
  const outside=<g data-part="through-windshield" data-item="s1-curb">
   <path d={`M70 900L1010 860L1010 1000L70 1000Z`} fill="#4E5156"/>
   <path d={`M${lerp(560,420,roll/114)} 930L1010 ${lerp(842,836,roll/114)}L1010 820L${lerp(600,470,roll/114)} 912Z`} fill="#D3CBBB"/>
   <path d={`M${lerp(560,420,roll/114)} 930L1010 ${lerp(842,836,roll/114)}`} stroke="#EFEAE0" strokeWidth={4}/>
   <g transform={`translate(${sx} 905) scale(${k}) rotate(3)`}>
    <rect x={-7} y={-380} width={14} height={380} fill="#6D7479"/>
    <rect x={-80} y={-470} width={160} height={150} rx={12} fill="#2E4A62" stroke="#1E3346" strokeWidth={3}/>
    <path d="M-44 -420l34 -4l20 -24l9 2l-10 22l26 -2l8 -10l7 1l-5 13l5 13l-7 1l-8 -10l-26 -2l10 22l-9 2l-20 -24l-34 -4Z" fill="#E9EEF2"/>
    <path d="M-48 -352l8 -18c4 -8 12 -12 22 -12h36c10 0 18 4 22 12l8 18v12h-96Z" fill="#E9EEF2"/>
   </g>
  </g>;
  pic=<Item id="s1-car"><Item id="s1-wheel"><RobotaxiHero part="cab" steer={S.s1.steer} outside={outside} route={S.s1.route}/></Item></Item>;
  break;}
 case 'phone-hail':{
  // s1 close: the phone stands against the suitcase handle on the bench, its request pin reaches the
  // curb and the card turns to arriving on s1-event-3, while behind it the car settles at the bay mark.
  pic=<g>
   <CamG c={cam} z={z}>{curbWorld(s1Car,{curb:'s1-curb',car:'s1-car'})}</CamG>
   <g data-part="bench-foreground">
    <path d="M-40 1244L1120 1222L1120 1520L-40 1520Z" fill="#7E878C"/>
    {[0,1,2,3,4,5].map(k=><path key={k} d={`M-40 ${1244+k*48}L1120 ${1222+k*50}`} stroke="#5C6468" strokeWidth={6}/>)}
    <path d="M-40 1244L1120 1222" stroke="#C3CACE" strokeWidth={5}/>
    <ellipse cx={300} cy={1242} rx={150} ry={9} fill="#141618" opacity={.38}/>
   </g>
   <Item id="s1-phone"><At p={PHONE_HAIL.at} r={PHONE_HAIL.rot}><SanAntonioSupport part="phone" w={300} pin={S.s1.pin} status={S.s1.status} t={t}/></At></Item>
  </g>;
  break;}
 case 'map-table':
 case 'map-plan':
 case 'map-zone':{
  // s2. A: the map lies on a weathered picnic table, seen at an angle, and draws in; then the close
  // looks down on it as the February calendar lands and the outline closes. B: straight down on the
  // map (a wall view) as it draws in, then the same close.
  const plan=view==='map-plan',close=view==='map-zone';
  const mw=close?860:plan?860:780,mh=close?980:plan?900:760,mx=close?110:plan?110:90,my=close?330:plan?290:800,sy=close?.92:plan?1:.58;
  const map=<g transform={`translate(${mx} ${my}) scale(1 ${sy})`}><SanAntonioSupport part="map" w={mw} h={mh} draw={S.s2.draw} zone={S.s2.zone} fill={S.s2.fill} t={t}/></g>;
  const cal=close?<At p={[lerp(MAP_CAL.stand[0],MAP_CAL.flat[0],S.s2.cal),lerp(MAP_CAL.stand[1]+80,MAP_CAL.flat[1],S.s2.cal)]} r={lerp(16,-4,S.s2.cal)} s={lerp(1.12,1,S.s2.cal)}>
   <SanAntonioSupport part="calendar" month="February" w={200}/></At>
   :plan?<At p={MAP_CAL.plan} r={-4}><SanAntonioSupport part="calendar" month="February" w={200}/></At>
   :<At p={MAP_CAL.stand}><SanAntonioSupport part="calendar" month="February" w={180}/></At>;
  const zx=mx+.7*mw,zy=my+.3*mh*sy;
  pic=<g>
   {!plan&&<SanAntonioSupport part="table" y0={close?300:780}/>}
   {plan&&<rect x={mx-30} y={my-30} width={mw+60} height={mh+60} rx={10} fill="#3B3F46" opacity={.18}/>}
   <Item id="s2-map"><Item id="s2-zone"><Item id="s2-pin">{map}</Item></Item></Item>
   <Item id="s2-calendar">{cal}</Item>
   {close&&<At p={[zx-10,zy-210]}>{tag(['60 square miles','Limited area'],S.s2.tag,{size:40})}</At>}
  </g>;
  break;}
 case 'creek-wide':
 case 'car-swept':{
  // s3. Rain streaks in and the brown creek rises over the low crossing under the limestone bank; the
  // water climbs the wheels of the empty car; then the current lifts it sideways off the slab toward
  // the viewer, rolling a few degrees and settling deeper in the downstream water, cabin still empty.
  const {crossY,crossFace}=CREEK,lvl=S.s3.lvl,sw=S.s3.sweep;
  const p:Pt=[CREEK_CAR.x+42*sw,crossY+120*sw],ks=CREEK_CAR.s*(1+.06*sw),rot=-5*sw;
  const sheetY=crossY-lvl,down=crossY+crossFace+2;
  const car=side(p,ks,{wheel:0,brake:0,wetTo:Math.min(150,(lvl+90*sw)/ks),shadow:0,cabin:1},rot);
  const sheet=(o:number)=><g opacity={o}><SanAntonioSupport part="water" x0={-80} x1={1160} y={sheetY} depth={lvl+2} t={t} flow={1.4}/>
   <path d={`M-80 ${crossY}H1160V${down}H-80Z`} fill="#8C7553" opacity={lvl>6?.75:.2}/>
   {Array.from({length:22},(_,i)=><path key={i} d={`M${-60+i*55} ${crossY}v${crossFace}`} stroke="#E3D8C2" strokeWidth={3} opacity={lvl>6?.45:0}/>)}</g>;
  const world=<Grounded baseY={crossY} on={exterior}>
   <Item id="s3-creek"><SanAntonioSupport part="creekback" t={t} level={lvl}/></Item>
   <Item id="s3-crossing">{sheet(1)}</Item>
   <Item id="s3-car">{car}</Item>
   <g>{sheet(1-clamp(sw*3))}</g>
   <Item id="s3-creek"><SanAntonioSupport part="water" x0={-80} x1={1160} y={down} depth={1940-down} t={t} flow={1.8} toward
    reflect={mirrorAbout(down,car)}/></Item>
  </Grounded>;
  pic=<g><CamG c={cam} z={z}>{world}</CamG><Item id="s3-rain">{rain(S.s3.rain)}</Item></g>;
  break;}
 case 'creek-plan':{
  // s3 from above: the brown channel under rain rings, the slab across it with water spreading over
  // it, and the white roof with its dome on the crossing; ripples close in around the wheels.
  const {crossY,crossH}=CREEK_PLAN,over=clamp((S.s3.lvl-4)/48);
  pic=<g>
   <Item id="s3-creek"><Item id="s3-crossing"><Item id="s3-rain"><SanAntonioSupport part="creekplan" t={t} over={over} rain={S.s3.rain}/></Item></Item></Item>
   <Item id="s3-car">{top([560,crossY+crossH/2],.5,0,{shadow:.6})}
    {over>.4&&[-1,1].map(sgn=><path key={sgn} d={`M${480+40*sgn} ${crossY+crossH/2-74*sgn}q-30 ${-20*sgn} -70 ${-14*sgn}`} stroke="#E9E1CF" strokeWidth={4} fill="none" opacity={clamp((over-.4)*2)}/>)}</Item>
  </g>;
  break;}
 case 'street-flood':
 case 'hazard-close':
 case 'wheel-water':{
  // s4. Floodwater spreads from the left along a residential street and climbs to the wheel arches of
  // an empty car as it creeps; the car stops along s4-event-2's contact curve and its amber hazards
  // start to blink; closer, the camera finds the empty cabin while the water stills. The mud line stays.
  const {y,s}=STREET_CAR,lvl=S.s4.lvl,xc=S.s4.X,wl=y-lvl;
  const carProps:SideProps={wheel:S.s4.wheel,hazard:S.s4.hazard,wetTo:Math.max(0,lvl-6)/s,cabin:view==='street-flood'?.6:1,brake:S.s4.calm>0?.4:0};
  const car=side([xc,y],s,carProps);
  const front=S.s4.front;
  const world=<Grounded baseY={y} on={exterior}>
   <Item id="s4-street"><SanAntonioSupport part="street" houses={view!=='hazard-close'}/></Item>
   <Item id="s4-water">{front>-80&&<SanAntonioSupport part="water" x0={-80} x1={front} y={STREET.farCurb+12} depth={STREET.nearCurb+18-STREET.farCurb-12}
    t={t} flow={.8} calm={S.s4.calm} reflect={mirrorAbout(y,car)} opacity={.94}/>}</Item>
   <Item id="s4-car"><Item id="s4-hazard">{car}</Item></Item>
   {front>xc-220*s&&lvl>8&&<SanAntonioSupport part="water" x0={xc-230*s} x1={Math.min(front,xc+250*s)} y={wl} depth={STREET.nearCurb+18-wl} t={t} flow={.8} calm={S.s4.calm} seed={11} opacity={.97}/>}
  </Grounded>;
  pic=<CamG c={cam} z={z}>{world}</CamG>;
  break;}
 case 'street-plan':{
  // s4 from above: the water front runs along the street around the roof and dome of the car, which
  // creeps and stops; its four amber corners start blinking.
  const {y0,y1}=STREET_PLAN;
  pic=<g>
   <Item id="s4-street"><Item id="s4-water"><SanAntonioSupport part="streetplan" t={t} front={S.s4.front} calm={S.s4.calm}/></Item></Item>
   <Item id="s4-car"><Item id="s4-hazard">{top([S.s4.X,(y0+y1)/2],.5,0,{hazard:S.s4.hazard,shadow:.5,wetTo:S.s4.lvl})}</Item></Item>
  </g>;
  break;}
 case 'record-desk':
 case 'record-wall':
 case 'count-grid':
 case 'record-close':
 case 'stamp-detail':{
  if(view==='record-wall'&&sid==='s9'){pic=curbPlanS9();break;}
  const ids=sid==='s7'?{card:'s7-record',row:'s7-remedy'}:{card:'s5-record',row:'s5-record'};
  if(view==='record-desk'||(view==='record-wall'&&sid==='s5')){
   // s5: the record card slides onto the desk on s5-event-1's contact curve and its rows write in.
   const wall=view==='record-wall',c=CARD_AT[view],off=(1-S.s5.slide);
   pic=<g>
    <SanAntonioSupport part="desk" x0={wall?60:-40} x1={wall?1020:1120} y0={wall?250:700} h={wall?1060:820} top={wall}/>
    <Item id="s5-record"><At p={[c.x+off*(wall?0:900),c.y+off*(wall?-900:40)]} r={lerp(wall?-10:7,wall?-1:-1.5,S.s5.slide)} s={c.s}>
     <SanAntonioSupport part="record" w={CARD_W} rows={S.s5.rows} imprints={imprints}/></At></Item>
    <At p={wall?[880,1220]:[860,1180]}><SanAntonioSupport part="pen"/></At>
   </g>;
   break;
  }
  if(view==='count-grid'){
   // s5 close: beside the card the grid of car icons fills row by row (linear), the counter tag pins
   // and settles, and the software recall stamp lands on the card.
   const mark=cardPoint(view,560,L.rows[0].y+46);
   pic=<g>
    <SanAntonioSupport part="desk" x0={-40} x1={1120} y0={240} h={1100}/>
    <Item id="s5-record">{card(view,{rows:1})}</Item>
    <Item id="s5-count"><At p={[56,760]}><SanAntonioSupport part="grid" cols={10} rows={8} fill={S.s5.grid} dx={82} dy={58}/></At></Item>
    <Item id="s5-total"><At p={COUNT_TAG.at}>{tag(COUNT_TAG.lines,S.s5.tag,{size:COUNT_TAG.size,sub:2})}</At></Item>
    <Item id="s5-stamp">{stampAt(S.s5.stamp,mark,.9,[mark[0]+330,mark[1]+330])}</Item>
   </g>;
   break;
  }
  // s7: the card fills the frame and its remedy row lights; a pen tip comes to rest on the row; the
  // under development stamp lands on it (detail). B's overhead record-wall shows the first two.
  const k=view==='record-wall'?'record-wall':view,c=CARD_AT[k];
  const tip=cardPoint(k,rem.vx-18,rem.y+rem.h-14);
  const penAt:Pt=[lerp(tip[0]+520,tip[0],S.s7.pen),lerp(tip[1]+520,tip[1],S.s7.pen)];
  const mark=cardPoint(k,rem.vx+232,rem.y+rem.h/2);
  pic=<g>
   <SanAntonioSupport part="desk" x0={-40} x1={1120} y0={view==='record-wall'?250:220} h={1150} top={view==='record-wall'}/>
   <Item id={ids.card}><Item id={ids.row}>{card(k,{rows:1,lit:S.s7.lit})}</Item></Item>
   <Item id="s7-cursor">{S.s7.pen>0&&<At p={penAt}><SanAntonioSupport part="pen"/></At>}</Item>
   <Item id="s7-stamp">{stampAt(view==='stamp-detail'?S.s7.stamp:0,mark,c.s*(view==='stamp-detail'?1.05:.8),view==='stamp-detail'?[800,1150]:[c.x+c.s*CARD_W-60,c.y+c.s*L.h+150])}</Item>
  </g>;
  break;}
 case 'lane-wide':
 case 'wheels-water':{
  // s6, THE TURN. The car runs the higher speed lane; the camera picks it up on s6-event-1 and runs
  // with it; on s6-event-2 it slows with its brake lamps lit, its speed easing down the board's contact
  // curve, and the camera settles; it releases the brake and rolls on, never stopping, into the sheet
  // of standing water across the lane, a wake and spray at each wheel as it enters (s6-event-3). The
  // recall sentence card holds above, its word may lighting as the front wheel meets the water.
  const k=S6.kWide,X=S.s6.X,base=LANE.laneY,p:Pt=[X*k,base];
  const car=side(p,k,{wheel:S.s6.wheel,brake:S.s6.brake,dip:S.s6.dip,cabin:.6});
  const span=540/cam.s+260,xa=cam.f[0]-span,xb=cam.f[0]+span;
  const w0=S.s6.Xw*k,w1=(S.s6.Xw+1700)*k;
  const close=view==='wheels-water';
  const wheelAt=(i:0|1):Pt=>[(X+CAR.wheels[i])*k,base];
  const world=<g>
   <Item id="s6-lane"><SanAntonioSupport part="lane" xa={xa} xb={xb}/></Item>
   <Item id="s6-water"><SanAntonioSupport part="standing" x0={w0} x1={w1} y0={LANE.dashY+18} y1={LANE.shoulderY-4} t={t} reflect={mirrorAbout(base,car)}/></Item>
   <Item id="s6-car">{car}</Item>
   {([1,0] as const).map(i=>{const amt=i?S.s6.frontIn:S.s6.rearIn;return amt>0&&<At key={i} p={[wheelAt(i)[0]+CAR.tireR*k*.6,base-2]}>
    <SanAntonioSupport part="wake" amount={amt} t={t} scale={k*1.1}/></At>;})}
  </g>;
  const qw=close?780:720;
  pic=<g><Grounded baseY={screenRow(cam,base)} on={exterior}><CamG c={cam} z={z} outer>{world}</CamG></Grounded>
   <Item id="s6-quote"><At p={[close?70:60,close?290:300]} o={close?1:clamp(S.s6.e1*2)}><SanAntonioSupport part="quote" w={qw} lit={S.s6.may} size={close?36:32}/></At></Item>
  </g>;
  break;}
 case 'lane-plan':{
  // s6 from above: the roof and dome run up the lane, the brake lamps light as it slows, the camera
  // settles and the car rolls on toward the standing water lying across the lanes.
  const k=S6.kPlan,Y=1400-S.s6.X*k,yw=1400-S.s6.Xw*k;
  const ya=cam.f[1]-1100,yb=cam.f[1]+1100;
  pic=<CamG c={cam} z={z}>
   <Item id="s6-lane"><SanAntonioSupport part="laneplan" ya={ya} yb={yb}/></Item>
   <Item id="s6-water"><SanAntonioSupport part="puddleplan" x0={430} x1={820} y0={yw-760} y1={yw} t={t}/></Item>
   <Item id="s6-car">{top([615,Y],k,-90,{brake:S.s6.brake,shadow:.5})}</Item>
  </CamG>;
  break;}
 case 'calendar-fleet':
 case 'limits-tag':{
  // s8 at the fleet lot. The weather limits tag slides along the cord and clips above the row (contact);
  // the tear-off calendar on the pole flips from April to 20; each car takes a check, left to right,
  // and the small vehicle map card is marked updated.
  const {y,s,xs}=LOT_CARS,n=xs.length;
  const tagX=lerp(-260,LOT_TAG.x,S.s8.tag),cordY=LOT.cordY+40*(1-Math.pow((tagX-540)/480,2));
  const world=<Grounded baseY={y} on={exterior}>
   <SanAntonioSupport part="lot"/>
   <Item id="s8-fleet">{xs.map((x,i)=><g key={i}>{side([x,y],s,{wheel:0,shadow:1,cabin:.5,seed:i})}
    <At p={[x,y-260*s-40]}><SanAntonioSupport part="check" p={clamp(S.s8.checks*n-i)} r={30}/></At></g>)}</Item>
   <Item id="s8-calendar"><At p={[170,640]}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={200}/></At></Item>
   <Item id="s8-map"><At p={[330,760]}><SanAntonioSupport part="mapcard" updated={clamp((S.s8.checks-.75)/.25)} w={230}/></At></Item>
   <Item id="s8-limits"><At p={[tagX,cordY]}>{tag(['Weather limits','tightened'],S.s8.tag>0?1:0,{size:44,icon:'rain',dir:-1})}</At></Item>
  </Grounded>;
  pic=<CamG c={cam} z={z}>{world}</CamG>;
  break;}
 case 'fleet-plan':{
  // s8 from above: two rows of roofs and domes in their stalls; the weather limits tag slides in and
  // pins above the first row; the April calendar lies on the lot's edge, not yet turned.
  const {rows,stall,x0}=LOT_PLAN;
  pic=<g>
   <SanAntonioSupport part="lotplan"/>
   <Item id="s8-fleet">{rows.map((ry,r)=>[0,1,2,3,4].map(i=><g key={r+'-'+i}>{top([x0+stall/2+i*stall,ry],.5,-90,{shadow:.5})}
    <At p={[x0+stall/2+i*stall,ry-170]}><SanAntonioSupport part="check" p={clamp(S.s8.checks*10-(r*5+i))} r={24}/></At></g>))}</Item>
   <Item id="s8-limits"><At p={[lerp(-300,540,S.s8.tag),300]}>{tag(['Weather limits','tightened'],S.s8.tag>0?1:0,{size:40,icon:'rain',dir:-1})}</At></Item>
   <Item id="s8-calendar"><At p={[150,286]} r={-6}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={150}/></At></Item>
  </g>;
  break;}
 case 'limits-detail':{
  // s8 detail on the chain link: the tag hangs pinned, the calendar flips to 20, the map card is
  // marked updated and a row of car icons takes its checks left to right.
  pic=<g>
   <g data-part="chain-link-close" opacity={.85}>
    {[90,560,1000].map(x=><rect key={x} x={x-9} y={200} width={18} height={1080} fill="#7C8388"/>)}
    <path d={Array.from({length:44},(_,i)=>`M${-80+i*30} 220l120 1060`).join('')+Array.from({length:44},(_,i)=>`M${-80+i*30} 1280l120 -1060`).join('')}
     stroke="#A3AAAE" strokeWidth={2} opacity={.5}/>
   </g>
   <Item id="s8-limits"><At p={LIMITS_DETAIL.tag}>{tag(['Weather limits','tightened','Interim step'],1,{size:54,icon:'rain',sub:2})}</At></Item>
   <Item id="s8-calendar"><At p={LIMITS_DETAIL.calendar}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={250}/></At></Item>
   <Item id="s8-map"><At p={LIMITS_DETAIL.map}><SanAntonioSupport part="mapcard" updated={clamp((S.s8.checks-.75)/.25)} w={330}/></At></Item>
   <Item id="s8-fleet">{LIMITS_DETAIL.icons.map((x,i)=><g key={i} transform={`translate(${x} ${LIMITS_DETAIL.iconY})`}>
    <ellipse cx={4} cy={2} rx={58} ry={7} fill="#1A1814" opacity={.25}/>
    <g transform="scale(1.7)"><SanAntonioSupport part="caricon" fill={1}/></g>
    <At p={[0,-96]}><SanAntonioSupport part="check" p={clamp(S.s8.checks*6-i)} r={22}/></At></g>)}</Item>
  </g>;
  break;}
 case 'curb-plan':{
  if(sid==='s9'){pic=curbPlanS9();break;}
  // s1 from above: the roof and dome come up the curb lane and brake into the painted bay box.
  const y=CURB_PLAN_CAR.y0-CURB_PLAN_CAR.k*S.s1.D;
  pic=<g>
   <Item id="s1-curb"><SanAntonioSupport part="curbplan" phone={<Item id="s1-phone"><At p={[795,700]} r={8} s={.16}><SanAntonioSupport part="phone" w={300} pin={S.s1.pin} status={S.s1.status} t={t}/></At></Item>}/></Item>
   <Item id="s1-car">{top([550,y],.62,-90,{brake:S.s1.brake,shadow:.6})}</Item>
  </g>;
  break;}
 case 'curb-return':
 case 'record-slide':
 case 'curb-record-split':{
  // s9 at the same curb bay. The same car waits; its curbside rear door swings open on its hinge on
  // s9-event-1, the empty rear seat inside. The record card slides into the foreground on s9-event-2
  // and holds; on s9-event-3 its remedy row is underlined, still under development, while the door
  // stays open and the phone on the bench still says arriving. The split sets the two side by side.
  const world=curbWorld(s9Car,{curb:'s9-curb',car:'s9-car',phone:'s9-phone'},benchPhone(1,1));
  const shown=S.s9.slide;
  if(view==='curb-record-split'){
   const c=CARD_AT[view],panelY=930,rowTop=rem.y*c.s;
   pic=<g>
    <Clip k="split-top" box={[0,0,1080,panelY-12]}><CamG c={cam} z={z}>{world}</CamG></Clip>
    <rect x={0} y={panelY-12} width={1080} height={12} fill={pal.paper}/>
    <Clip k="split-bottom" box={[0,panelY,1080,1300]}>
     <Item id="s9-record"><At p={[c.x,panelY+40-rowTop+20]} s={c.s}><SanAntonioSupport part="record" w={CARD_W} rows={1} remedyLit={.6} underline={S.s9.underline} imprints={imprints}/></At></Item>
    </Clip>
   </g>;
   break;
  }
  const k=view;const c=CARD_AT[k];
  const from:Pt=[-c.s*CARD_W-60,c.y+40];
  pic=<g><CamG c={cam} z={z}>{world}</CamG>
   {shown>0&&<Item id="s9-record"><At p={[lerp(from[0],c.x,shown),lerp(from[1],c.y,shown)]} r={lerp(-8,-2,shown)} s={c.s}>
    <SanAntonioSupport part="record" w={CARD_W} rows={1} remedyLit={.5} underline={S.s9.underline} imprints={imprints}/></At></Item>}
  </g>;
  break;}
 default:throw new Error('Unimplemented robotaxi view '+view);
 }

 /** s9 from above (curb-plan and record-wall): the car in the bay with its curbside rear door swinging
  * open, the phone on the bench, and the record card sliding in flat onto the sidewalk beside the bay. */
 function curbPlanS9(){
  const c=CARD_AT['curb-plan'],sl=S.s9.slide;
  return <g>
   <Item id="s9-curb"><SanAntonioSupport part="curbplan" phone={<Item id="s9-phone"><At p={[795,700]} r={8} s={.16}><SanAntonioSupport part="phone" w={300} pin={1} status={1} t={t}/></At></Item>}/></Item>
   <Item id="s9-car">{top([550,810],.62,-90,{door:S.s9.door,shadow:.6})}</Item>
   {view==='record-wall'&&sl>0&&<Item id="s9-record"><At p={[lerp(1180,c.x,sl),c.y]} r={lerp(10,-2,sl)} s={c.s}>
    <SanAntonioSupport part="record" w={CARD_W} rows={1} remedyLit={.5} imprints={imprints}/></At></Item>}
  </g>;
 }

 // ---- the disclosure chip: the board's production_disclosure, on every scene ----
 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText);
 const dW=Math.max(...dLines.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,dH=dLines.length*32+24;
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={44} y={132} width={dW} height={dH} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}
   data-quote={view==='wheels-water'||view==='lane-wide'?QUOTE_TEXT.length:undefined}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
