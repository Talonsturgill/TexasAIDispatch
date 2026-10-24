import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {RoomCameraHero,ROOM_PAINT,TABLE,GURNEY,PLATE,PLAN,PLAN_WAIT,cameraLens,aimAt,markAt,tagFont,drapeShape,sideWallPoint,planGurney,crewShoulders,restGrip,armReach,type ClockMark,type HandPose,type ArmDraw,type PlanCrew} from './RoomCameraHero';
import {StudyRecordSupport,S4B,S5B,S6B,S7B,S8B,S9B,BLANK,PANEL,RESULT} from './StudyRecordSupport';

/**
 * room-clock-v1: the room that watches itself (2026-10-24, Harris County, the Gulf coast plate of Houston).
 * Correction 2, after the independent code review 2 of both treatments.
 *
 * ONE generic cardiothoracic operating room (RoomCameraHero) and its records (StudyRecordSupport) carry the
 * film. Every performed state is a closed function of the film frame clock, the board's event and clause
 * windows and the board's own shot cuts (clockState), so any frame renders alone and the same twice, and a
 * measured retime moves every action with its event. Three anonymous attendants (crew) are the visible agents of
 * every move of the gurney, the patient, the drape and the sheet: one pushes the gurney and slides the patient,
 * two stand behind the table, one carrying the folded drape until two of them take its corners and lay it.
 *
 *  s1  from the first second the four wall cameras power up: their heads lift from rest and begin to scan the
 *      room and their lamps glow on standby as the room lights up (s1-event-1); the suite plate settles
 *      (s1-event-2); the lamps go full amber one after another (s1-event-3); the attendant wheels the gurney
 *      with the patient up to the suite doorway while every camera head turns to it and its sight line
 *      reaches it (s1-event-4). B reads the same from the plan, the gurney coming along the corridor.
 *  s2  the clock ring draws on the pier, linked to a camera (s2-event-1). Each stamp is a pulse from a wall
 *      camera to the ring: Patient entry stamps as the gurney carries the patient over the door threshold
 *      (s2-event-2); after a cut that elides the transfer (the empty gurney stands beside the table), Draped
 *      stamps as the attendant's hands open and lay the folded drape (s2-event-3); after a cut, Turnover
 *      stamps as the draped patient leaves on the gurney through the door and the hands lay a fresh sheet on
 *      the bare table (s2-event-4). B shows the camera stamping a wall-mounted record panel and its plan clock.
 *  s3  the next patient is wheeled in through the door and slid onto the fresh sheet by the gloved hands while
 *      the surgeon's phone lights in a gloved hand and a link draws from a wall camera (s3-event-1); the hands
 *      open and lay the folded drape (s3-event-2); the amber text reading Patient draped slides onto the phone
 *      (s3-event-3).
 *  s4 to s9  the study's records, as before, on the suite's records desk (A) or a ledger page (B); the placebo
 *      test is eleven units, ten gray placebo bars and the teal suite bar, all the same height.
 *  s10 a dashed blank box draws beside the turnover marker (s10-event-1), the marker pulses and the box stays
 *      blank (s10-event-2), and the room light lowers while all four camera lamps stay lit (s10-event-3); the
 *      result card, the counter of about 25 more a month joined to the camera rollout tag by the dashed
 *      associated link, sits beside the box in every closing picture.
 *
 * Colour carries meaning once: amber is only the camera lamps, the placebo stamp and the text alert; teal is
 * the suite and its record. The region stands behind the room through the stage's window (PlaceStage); no
 * full-frame background is painted. Disclosed illustration: a generic room, no real staff, patient, vendor
 * interface, logo or second level timing.
 */

type V='a'|'b';
type Pt=[number,number];
type Rect=[number,number,number,number];
type Framing='wide'|'split'|'medium'|'close'|'detail'|'overhead';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
/** A renderer-only ease with zero velocity and acceleration at both ends. */
export const ease5=(q:number)=>{const x=clamp(q);return x*x*x*(10+x*(-15+6*x));};
/** The board's contact curve as a plain ease, for renderer-only sub-phases of one event. */
export const contactQ=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
/** Zero at both ends, one in the middle, zero slope at both ends. */
export const bell=(r:number)=>{const x=clamp(r);return 16*x*x*(1-x)*(1-x);};
/** The time integral of smoothstep((t-a)/T) from a to t: a speed that ramps in smoothly and then holds. */
export function smoothInt(t:number,a:number,T:number){const u=(t-a)/T;if(u<=0)return 0;if(u>=1)return T*.5+(t-a-T);return T*(u*u*u-u*u*u*u/2);}
const P0=ROOM_PAINT;

/** The clock hand's sweep, seconds per turn, and its angle at the start of s2. */
export const HAND={period:6,start:-40};
/** Where in its window each s2 marker is stamped (the pulse reaches the ring first). */
export const STAMP_AT=.45;
export const MARK_EVENTS=['s2-event-2','s2-event-3','s2-event-4'] as const;
export const MARK_LABELS=['Patient entry','Draped','Turnover'];
/** The gurney leaving at turnover, in path units a second (2 is parked, 1 at the threshold, 0 gone). */
export const EXIT_RATE=1.6;
/** Within the first s3 clause: the next gurney's arrival and the slide onto the table, as clause fractions. */
export const S3_ARRIVE:[number,number]=[0,.38],S3_SLIDE:[number,number]=[.48,.86];
/** In s3, seconds after the slide ends when the folded drape starts across to the table, and how long it takes. */
export const DRAPE_TAKE:[number,number]=[.22,.3];

/** The clock's board-driven times: scene starts and the two s2 cuts, all on the native frame grid. */
export type Starts={s1:number;s2:number;s3:number;s10:number;draped:number;turnover:number;n3a:[number,number]};

/** The screen box of a clock's lit Turnover tag at its marker angle, as ClockRing lays it out. Pure. */
export function turnoverTagBox(c:Pt,r:number,angle:number):Rect{
 const fs=tagFont(r),{tag}=markAt(r,angle,1.34),w=MARK_LABELS[2].length*fs*.58+26,left=tag[0]<-4?-w:tag[0]>4?0:-w/2;
 const x0=c[0]+tag[0]+left,y0=c[1]+tag[1]-fs*.8;return [x0,y0,x0+w,y0+fs*1.6];
}
/** The whole room's state at film time t. `u` is the gurney's path position: 0 out of sight, 1 waiting with
 * its head end at the door threshold, 2 parked beside the table's foot. `onTable` slides the patient from the
 * gurney (0) to the table (1). Hands are reported for the episode to draw at their grips. */
export function clockState(W:Record<string,ActionWindow>,t:number,S:Starts){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const end=(id:string)=>W[id]?W[id].end:S.s2;
 // s1: cameras power up with the room light (heads lift and scan, lamps glow on standby), then light in turn
 const e1=P('s1-event-1'),r13=R('s1-event-3'),e11=W['s1-event-1']?.start??0;
 const lamps=[0,1,2,3].map(k=>Math.max(.32*e1,contactQ((r13-k*.21)/.17)));
 const flash=[0,1,2,3].map(k=>bell((r13-k*.21)/.36));
 const watch=smooth(R('s1-event-4')/.45);
 const scan=(k:number)=>t<S.s2?16*Math.sin(2*Math.PI*(t-e11)/3.4+k*1.7)*e1*(1-watch):0;
 const park=38*(1-e1);
 // the room light, which alone lowers at the close
 const light=(.38+.62*e1)*(1-.28*P('s10-event-3'));
 // the case
 let u=0,onTable=0,drape=0,sheet=1,patient=0,guide=0,drapeOnGurney=false;
 let drapeHands:{drop:number;enter:number;withdraw:number}|null=null,sheetHands:{withdraw:number}|null=null,slideHands:{withdraw:number;enter:number}|null=null;
 let phase:'pre'|'draped'|'turnover'|'next'|'close'='pre',s3t={a0:0,a1:0,b0:0,b1:0,d0:0};
 if(t<S.draped){
  u=t<S.s2?P('s1-event-4'):1+P('s2-event-2');patient=u>0?1:0;guide=u>0?1:0;
 }else if(t<S.turnover){
  phase='draped';u=2;onTable=1;patient=1;drape=P('s2-event-3');
  drapeHands={drop:drape,enter:1,withdraw:ease5((t-end('s2-event-3'))/.4)};
 }else if(t<S.s3){
  phase='turnover';u=Math.max(0,2-EXIT_RATE*smoothInt(t,S.turnover,.3));patient=u>0?1:0;drape=1;drapeOnGurney=true;guide=u>0?1:0;
  sheet=P('s2-event-4');sheetHands={withdraw:ease5((t-end('s2-event-4'))/.4)};
 }else if(t<S.s10){
  const [c0,c1]=S.n3a,len=c1-c0,a0=c0+S3_ARRIVE[0]*len,a1=c0+S3_ARRIVE[1]*len,b0=c0+S3_SLIDE[0]*len,b1=c0+S3_SLIDE[1]*len;
  phase='next';s3t={a0,a1,b0,b1,d0:b1+DRAPE_TAKE[0]};
  u=t<a0?0:2*ease5((t-a0)/(a1-a0));patient=u>0?1:0;guide=u>0&&u<2?1:u>=2?1-ease5((t-a1)/.3):0;
  onTable=ease5((t-b0)/(b1-b0));drape=P('s3-event-2');
  if(t>=b0-.3&&t<b1+.5)slideHands={enter:ease5((t-(b0-.3))/.3),withdraw:ease5((t-b1)/.4)};
  const dEnd=end('s3-event-2');
  // the folded drape is carried to the table and its corners taken before it begins to open (s3-event-2)
  if(t>=b1+DRAPE_TAKE[0]&&t<dEnd+.5)drapeHands={drop:drape,enter:ease5((t-(b1+DRAPE_TAKE[0]))/DRAPE_TAKE[1]),withdraw:ease5((t-dEnd)/.4)};
 }else phase='close';
 // the clock: its hand sweeps from s2; each marker stamps where the hand stands at its stamp moment
 const handAt=(time:number)=>HAND.start+360*(time-S.s2)/HAND.period;
 const stampTime=(id:string)=>W[id]?W[id].start+STAMP_AT*(W[id].end-W[id].start):S.s2;
 const markAngles=MARK_EVENTS.map(id=>handAt(stampTime(id)));
 const marks=(lit:number,stamped:boolean):ClockMark[]=>MARK_EVENTS.map((id,k)=>({angle:markAngles[k],
  stamp:stamped?1:contactQ((R(id)-.4)/.35),label:MARK_LABELS[k],lit:k===2?lit:0}));
 const pulses=MARK_EVENTS.map(id=>{const r=R(id);return r>0&&r<.5?ease5(r/.42):-1;});
 const turnoverAngle=markAngles[2];
 const s2={draw:P('s2-event-1'),hand:t<S.s3?handAt(t):turnoverAngle+12};
 return {
  light,plate:P('s1-event-2'),lamps,flash,watch,scan,park,
  u,onTable,drape,sheet,patient,guide,drapeOnGurney,drapeHands,sheetHands,slideHands,phase,s3t,inS2:t>=S.s2,
  s2,marks,pulses,markAngles,turnoverAngle,
  s3:{lit:P('s3-event-1'),link:ease5(R('s3-event-1')),alert:P('s3-event-3')},
  s4:{card:P('s4-event-1'),draw:P('s4-event-2'),climb:P('s4-event-3'),fill:P('s4-event-4'),num:clamp((R('s4-event-4')-.82)/.18)},
  s5:{badge:P('s5-event-1'),glow:bell(R('s5-event-2')),axis:P('s5-event-3'),whisker:P('s5-event-4'),cap:P('s5-event-5')},
  s6:{rise:P('s6-event-1'),suite:P('s6-event-2'),...stampState(W['s6-event-3'],t)},
  s7:{card:P('s7-event-1'),link:P('s7-event-2'),arrow:ease5(R('s7-event-3')/.5),strike:contactQ((R('s7-event-3')-.55)/.35)},
  s8:{tag:P('s8-event-1'),band:P('s8-event-2'),stake:P('s8-event-3'),slice:P('s8-event-4')},
  s9:{card:P('s9-event-1'),ring:P('s9-event-2'),tagged:P('s9-event-3')},
  s10:{box:P('s10-event-1'),pulse:R('s10-event-2')},
  P,R};
}
export type ClockState=ReturnType<typeof clockState>;

// ---- the crew: three anonymous attendants, in table units about the table centre and the pad row ---------------
export type CrewBody={id:'A'|'B'|'C';bx:number;turn:number;look:number;walk:number;arms:ArmDraw[]};
/** Where the folded drape's corners are held from its hold position, carried by C in front of the body at bx. */
export const carryOffset=(bx:number):Pt=>[bx-26,66];
/** The crew at film time t, as a pure function of the room state, the gurney's centre gxu and the patient's
 * centre pxu (table units from the table centre). A pushes the gurney in, waits at its bar, pulls it out and in
 * s3 slides the next patient across and takes the drape's foot corner. B (head end) and C (foot end) stand
 * behind the table from s2: C carries the folded drape, B and C (s2) or B and A (s3) take its corners and lay it,
 * and C lays the fresh sheet walking along the table. `bundle` is the drape's offset from its hold position
 * while it is carried (null when it is laid or gone), so the drape exists before any hand takes it. */
export function crewAt(S:ClockState,t:number,gxu:number,pxu:number){
 const bodies:CrewBody[]=[];
 const dh=S.drapeHands,dhE=dh?dh.enter:0,dhW=dh?dh.withdraw:1,dhOn=dh?dh.enter*(1-dh.withdraw):0;
 const arm=(Sh:Pt,side:number,G:Pt|null,w:number,pose:HandPose,base?:Pt):ArmDraw=>{
  const rest=base??restGrip(Sh,side),tgt=G?[lerp(rest[0],G[0],clamp(w)),lerp(rest[1],G[1],clamp(w))] as Pt:rest;
  return {...armReach(Sh,tgt,side),pose:G&&w>.3?pose:'flat',front:!!G&&w>=.6,side};
 };
 // the drape: where it is held and what shape it has now
 let bundle:Pt|null=null;
 if(S.phase==='pre'&&S.inS2)bundle=carryOffset(225);
 else if(S.phase==='draped')bundle=[0,0];
 else if(S.phase==='next'){const c=carryOffset(-60);bundle=t<S.s3t.d0?c:[lerp(c[0],0,dh?dhE:1),lerp(c[1],0,dh?dhE:1)];}
 const d=drapeShape(S.drape,t),off=bundle??[0,0];
 const cornerL:Pt=[d.left[0]+off[0],d.left[1]+off[1]],cornerR:Pt=[d.right[0]+off[0],d.right[1]+off[1]];
 // A: the gurney's bar, or the patient it slides
 const hx=gxu+GURNEY.handle[0],hy=GURNEY.handle[1],bar:Pt=[hx,hy],bar2:Pt=[hx+5,hy+3];
 if(S.u>0&&S.phase!=='close'){
  if(S.phase==='next'){
   // A steps from the bar to the patient's far side, walks with the slide, then steps to the table's foot
   const {b0,b1}=S.s3t,es=ease5((t-(b0-.45))/.45),wd=ease5((t-b1)/.4);
   const bx=lerp(lerp(hx+58,pxu+60,es),180,wd),turn=lerp(-.75,0,wd),[l,r]=crewShoulders(bx,turn);
   const s0:Pt=[pxu-40,-74],s1:Pt=[pxu+110,-76];
   const T0:Pt=es<1?[lerp(bar[0],s0[0],es),lerp(bar[1],s0[1],es)]:s0,T1:Pt=es<1?[lerp(bar2[0],s1[0],es),lerp(bar2[1],s1[1],es)]:s1;
   const w1=1-wd,base0:Pt=[lerp(restGrip(l,-1)[0],T0[0],w1),lerp(restGrip(l,-1)[1],T0[1],w1)];
   const left=dhOn>0?arm(l,-1,cornerR,dhOn,'pinch',base0):arm(l,-1,T0,w1,es>.5?'flat':'grip');
   if(dhOn>0&&w1>=.6)left.front=true;
   bodies.push({id:'A',bx,turn,look:0,walk:bx/30,arms:[left,arm(r,1,T1,w1,es>.5?'flat':'grip')]});
  }else{
   const bx=hx+58,turn=-.75,[l,r]=crewShoulders(bx,turn);
   bodies.push({id:'A',bx,turn,look:0,walk:bx/30,arms:[arm(l,-1,bar,1,'grip'),arm(r,1,bar2,1,'grip')]});
  }
 }
 if(S.inS2&&S.phase!=='close'){
  // B at the head end
  const bB=S.phase==='turnover'?-250:S.phase==='next'?-190:-200,[bl,br]=crewShoulders(bB,0);
  const bRight=(S.phase==='draped'||S.phase==='next')&&dhOn>0?arm(br,1,cornerL,dhOn,'pinch'):arm(br,1,null,0,'flat');
  bodies.push({id:'B',bx:bB,turn:0,look:1,walk:0,arms:[arm(bl,-1,null,0,'flat'),bRight]});
  // C at the foot end
  if(S.phase==='turnover'){
   const xs=TABLE.L/2-(TABLE.L-110)*S.sheet,bx=xs+70,turn=-.35,[l,r]=crewShoulders(bx,turn);
   const w=S.sheetHands?1-S.sheetHands.withdraw:0;
   bodies.push({id:'C',bx,turn,look:2,walk:bx/30,arms:[arm(l,-1,[xs,-14],w,'pinch'),arm(r,1,null,0,'flat')]});
  }else{
   const bx=S.phase==='next'?-60:225,[l,r]=crewShoulders(bx,0);
   let arms:ArmDraw[];
   if(S.phase==='draped')arms=[arm(l,-1,cornerR,dhOn,'pinch'),arm(r,1,null,0,'flat')];
   else{const hold=S.phase==='next'&&t>=S.s3t.d0?1-(dh?dhE:1):1;arms=[arm(l,-1,cornerL,hold,'pinch'),arm(r,1,cornerR,hold,'pinch')];}
   bodies.push({id:'C',bx,turn:0,look:2,walk:0,arms});
  }
 }
 return {bodies,bundle};
}
/** The placebo stamp's choreography round its window: the block comes in, presses in the first quarter,
 * holds, then lifts away; the amber mark shows once the block is down. */
export function stampState(win:ActionWindow|undefined,t:number){
 if(!win)return {press:0,stamp:0,away:0};
 const d=win.end-win.start,r=(t-win.start)/d;
 if(r<0)return {press:0,stamp:0,away:0};
 const press=contactQ(r/.28),stamp=r>=.28?1:0,away=ease5((r-.55)/.4);
 return {press,stamp,away};
}

// ---- the room's layout, anchored to the stage's window so wall things stay on the wall ------------------
export type Win={x:number;y:number;w:number;h:number};
/** PlaceStage's window rectangles, used when the stage provides none (an isolated probe). */
export const STAGE_WIN:Record<'wide'|'medium'|'split',Win>={wide:{x:96,y:440,w:888,h:540},medium:{x:40,y:410,w:1000,h:640},split:{x:40,y:410,w:1000,h:640}};
export type CamAt={at:Pt;s:number;mirror:boolean};
/** The doorway in the right side wall: its share of the wall's width and height. */
export const DOOR={u0:.18,u1:.86,top:.5};
/** One set of camera mounts for every view of the room at wall height, anchored to the window. */
export function roomLayout(Wn:Win){
 const k=Wn.w/888,ks=.72*k;
 const pier={x:Wn.x-22,y:Wn.y-26,w:Wn.w*.36+22,h:Wn.h+52};
 const pcx=pier.x+pier.w/2;
 const plate={x:pcx-PLATE.w*k*.5,y:Wn.y+16*k,w:PLATE.w*k};
 const clock={c:[pier.x+pier.w*.55,Wn.y+268*k] as Pt,r:104*k};
 const cams:CamAt[]=[{at:[Wn.x+.30*Wn.w,Wn.y-80*k],s:.92*k,mirror:false},{at:[Wn.x+.80*Wn.w,Wn.y-80*k],s:.92*k,mirror:true},
  {at:[30,Wn.y-60*k],s:1.05*k,mirror:false},{at:[1050,Wn.y-70*k],s:1.05*k,mirror:true}];
 const floorY=Wn.y+Wn.h+52*k,TX=Wn.x+.36*Wn.w,TY=Wn.y+Wn.h+10*k;
 const side={x0:1080,x1:930,topFar:Wn.y-150*k,botFar:floorY-14};
 const xThr=sideWallPoint(side.x0,side.x1,side.topFar,side.botFar,DOOR.u1,0)[0];
 return {k,ks,pier,plate,clock,cams,floorY,TX,TY,side,xThr,light:[TX+60*ks,Wn.y-6] as Pt,
  // the closing box and result card sit right of the surgical light's head and cone, clear of both
  box:{x:Wn.x+.545*Wn.w,y:Wn.y+102*k,size:.7*k},result:{x:Wn.x+.545*Wn.w,y:Wn.y+306*k,s:.62*k}};
}
/** The gurney rig on a floor line: table centre TX and pad row TY at scale ks, the door threshold xThr. */
export type Rig={TX:number;TY:number;ks:number;xThr:number;gpark:number;gwait:number;goff:number};
export function rig(TX:number,TY:number,ks:number,xThr:number,goff?:number):Rig{
 const gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gwait=xThr+(GURNEY.L/2+8)*ks;
 return {TX,TY,ks,xThr,gpark,gwait,goff:goff??Math.max(1080+GURNEY.L/2*ks+30,gwait+150)};
}
/** The gurney's centre x for path position u (0 out of sight, 1 waiting at the threshold, 2 parked). Pure. */
export const gurneyX=(g:Rig,u:number)=>u<=1?lerp(g.goff,g.gwait,clamp(u)):lerp(g.gwait,g.gpark,clamp(u-1));
/** The plan's own path parameter for the room's path position u. */
export const planU=(u:number)=>u<=1?clamp(u)*PLAN_WAIT:PLAN_WAIT+clamp(u-1)*(1-PLAN_WAIT);

// ---- record boards: fitted into each framing's safe picture box -----------------------------------------
/** The picture box each framing fits its record into: above the caption band, clear of the disclosure chip. */
export const TARGET:Record<Framing,Rect>={wide:[100,680,980,1232],split:[60,640,1020,1232],medium:[60,640,1020,1232],
 close:[24,300,1056,1232],detail:[8,290,1072,1236],overhead:[40,300,1040,1232]};
/** Vertical foreshortening of a record lying on the desk, by treatment and framing. */
export const FORESHORTEN:Record<V,Record<Framing,number>>={a:{wide:.78,split:.8,medium:.8,close:.92,detail:.95,overhead:1},
 b:{wide:.8,split:.8,medium:.8,close:1,detail:1,overhead:1}};
/** Each record view's focus in board units. A detail framing tightens it by 8 percent about its centre. */
export const FOCUS:Record<string,Rect>={
 'study-card-medium':[0,0,1000,900],'ledger-counter-wide':[0,0,1000,900],'study-lines-close':S4B.focus.lines as Rect,
 'ledger-lines-overhead':S4B.focus.lines as Rect,'counter-rise-view':S4B.focus.counter as Rect,
 'badge-medium':[0,0,1000,420],'ledger-badge-wide':[0,0,1000,900],'axis-close':S5B.focus.axis as Rect,
 'ledger-axis-overhead':S5B.focus.axis as Rect,'whisker-label-view':S5B.focus.whisker as Rect,
 'placebo-bars-wide':S6B.focus.row as Rect,'ledger-bars-overhead':S6B.focus.row as Rect,'stamp-view':S6B.focus.stamp as Rect,
 'card-medium':S7B.focus.card as Rect,'ledger-card-close':S7B.focus.card as Rect,'dashed-link-wide':S7B.focus.link as Rect,
 'ledger-link-overhead':S7B.focus.link as Rect,'strike-close':S7B.focus.strike as Rect,'ledger-strike-detail':S7B.focus.strike as Rect,
 'bundle-medium':S8B.focus.bundle as Rect,'ledger-bundle-wide':S8B.focus.stake as Rect,'bundle-band-close':S8B.focus.band as Rect,
 'ledger-band-overhead':S8B.focus.band as Rect,'stake-wide':S8B.focus.stake as Rect,'ledger-company-close':[500,100,1000,880],
 'stake-detail':S8B.focus.slice as Rect,'ledger-stake-detail':[500,100,1000,880],
 'future-card-medium':S9B.focus.card as Rect,'ledger-future-close':S9B.focus.card as Rect,'future-marker-close':S9B.focus.marker as Rect,
 'ledger-marker-detail':S9B.focus.marker as Rect};
/** Views whose detail framing keeps the close focus, because tightening would cut a label at the frame edge. */
export const NO_TIGHTEN=new Set(['counter-rise-view','ledger-strike-detail','ledger-stake-detail','stamp-view']);
/** Detail framings that need their own focus: the whisker detail widens left so the counter label above stays out. */
export const DETAIL_FOCUS:Record<string,Rect>={'whisker-label-view':[155,515,965,865]};
export function focusFor(view:string,fr:Framing):Rect{
 const f=FOCUS[view];if(!f)throw new Error('No record focus for '+view);
 if(fr==='detail'&&DETAIL_FOCUS[view])return DETAIL_FOCUS[view];
 if(fr!=='detail'||NO_TIGHTEN.has(view))return f;
 const cx=(f[0]+f[2])/2,cy=(f[1]+f[3])/2,k=.92;
 return [cx-(cx-f[0])*k,cy-(cy-f[1])*k,cx+(f[2]-cx)*k,cy+(f[3]-cy)*k];
}
/** Fit a focus into a framing's box: board units to screen as x' = ox + s x, y' = oy + s fy y. Pure. */
/** B's ledger page lies on the desk in the room's wide and medium views, so its ruled area starts lower. */
export const LEDGER_TARGET:Partial<Record<Framing,Rect>>={wide:[100,740,980,1232],medium:[60,700,1020,1232],split:[60,700,1020,1232]};
export function fitRecord(focus:Rect,fr:Framing,fy:number,ledger=false){
 const [fx0,fy0,fx1,fy1]=focus,[tx0,ty0,tx1,ty1]=(ledger&&LEDGER_TARGET[fr])||TARGET[fr];
 const s=Math.min((tx1-tx0)/(fx1-fx0),(ty1-ty0)/((fy1-fy0)*fy));
 return {s,fy,ox:(tx0+tx1)/2-s*(fx0+fx1)/2,oy:(ty0+ty1)/2-s*fy*(fy0+fy1)/2};
}
export const fitPt=(F:{s:number;fy:number;ox:number;oy:number},p:Pt):Pt=>[F.ox+F.s*p[0],F.oy+F.s*F.fy*p[1]];
/** The fixed surface row for close, detail and overhead record views: just under the disclosure chip. */
export const SURFACE_ROW=262;
/** The row where a record's surface (the desk or the ledger patch) begins on screen. */
export function surfaceTop(focus:Rect,fr:Framing,F:{s:number;fy:number;ox:number;oy:number}){
 if(fr==='wide'||fr==='medium'||fr==='split')return TARGET[fr][1]-30;
 // close, detail and overhead: the desk or ledger fills the frame below the disclosure row, so the
 // region shows only above it and nothing in the record is cut at a row that moves with the focus
 return SURFACE_ROW;
}

// ---- small helpers -----------------------------------------------------------------------------------------
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const Items:React.FC<{ids:string[];children:React.ReactNode}>=({ids,children})=><>{ids.reduceRight<React.ReactNode>((acc,id)=><g data-item={id}>{acc}</g>,children)}</>;
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${r.toFixed(3)}) scale(${s.toFixed(4)})`} opacity={o}>{children}</g>;
const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}
/** The disclosure chip's box, shared with the frame-edge check. */
export function disclosureBox(text:string):Rect{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}

export const RoomClockFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Room clock film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Room clock film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 // Scene starts and the two s2 cuts on the native frame grid, where DirectedFilm cuts, so a shot's first frame
 // already reads its own state rather than the previous shot's for the fraction of a frame before the cut.
 const grid=(x:number)=>Math.round(x*fps)/fps;
 const start=(id:string)=>{const s=board.scenes.find(x=>x.id===id);if(!s)throw new Error('Missing scene '+id);return grid(s.start_s);};
 const cutAt=(eventId:string)=>{const s=board.film_direction!.shots.find(x=>x.event_id===eventId);if(!s)throw new Error('No shot performs '+eventId);return grid(s.start_s);};
 const n3a=requireNarration(board,'n3a');
 const S=clockState(W,t,{s1:start('s1'),s2:start('s2'),s3:start('s3'),s10:start('s10'),draped:cutAt('s2-event-3'),turnover:cutAt('s2-event-4'),n3a:[n3a.start,n3a.end]});
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing as Framing;
 const place=usePlace(),flat=ad.flat_shots?.[sid];
 const win=(f:Framing):Win=>place?.window??STAGE_WIN[f==='wide'?'wide':'medium'];
 const need=(s:string)=>{if(sid!==s)throw new Error(view+' draws '+s+' only');};

 // ---- cameras ---------------------------------------------------------------------------------------------------
 /** A camera at its mount: parked low before the room powers up, then scanning, then turned to its target. */
 const camAim=(c:CamAt,k:number,target:Pt)=>aimAt(c.at,c.s,target,c.mirror)+S.park+S.scan(k);
 const camera=(c:CamAt,k:number,target:Pt)=>
  <At key={'cam'+k} p={c.at} s={c.s}><g data-cam={'cam'+k}><RoomCameraHero part="camera" lamp={S.lamps[k]} aim={camAim(c,k,target)} mirror={c.mirror} droop={k===1?1.4:1} flash={S.flash[k]}/></g></At>;
 const lensOf=(c:CamAt,k:number,target:Pt):Pt=>cameraLens(c.at,c.s,camAim(c,k,target),c.mirror);
 /** Dashed sight lines from each lit camera to what it watches; `each` adds a per-camera flash. */
 const sights=(cams:CamAt[],target:Pt,amount:number,each?:number[])=><g data-part="sight-lines">{cams.map((c,k)=>{
  const a=Math.max(amount,each?.[k]??0),l=lensOf(c,k,target);if(a<=0||S.lamps[k]<=0)return null;
  return <path key={k} d={`M${f2(l[0])} ${f2(l[1])}L${f2(target[0])} ${f2(target[1])}`} stroke={P0.lampGlow} strokeWidth={3.4} strokeDasharray="12 10" opacity={f2(.75*a*S.lamps[k])}/>;})}</g>;

 // ---- the crew, the gurney, the patient, the drape, the table ---------------------------------------------------
 /** Where the patient lies, in screen units, for a rig. */
 const patientAt=(g:Rig):Pt=>[lerp(gurneyX(g,S.u),g.TX,S.onTable),g.TY];
 const watchPoint=(g:Rig):Pt=>S.patient>0?[patientAt(g)[0],g.TY-46*g.ks]:[g.TX,g.TY-30*g.ks];
 /** The case on a rig: the crew behind it, the table and its sheet, the gurney, the patient with the drape (on
 * the gurney as it leaves, otherwise the folded or laid drape over the table), then the gloves that hold. */
 const caseGroup=(g:Rig,o:{hands?:boolean}={})=>{
  const {TX,TY,ks}=g,gx=gurneyX(g,S.u),showG=S.u>0;
  const [px]=patientAt(g),hands=o.hands??true;
  const C=crewAt(S,t,(gx-TX)/ks,(px-TX)/ks);
  const drapeOn=!S.drapeOnGurney&&(C.bundle!==null||S.drape>0),off=C.bundle??[0,0];
  return <g data-part="case">
   {hands&&<At p={[TX,TY]} s={ks}><g data-part="crew">{C.bodies.map(b=><RoomCameraHero key={b.id} part="attendant" bx={b.bx} turn={b.turn} look={b.look} walk={b.walk} arms={b.arms}/>)}</g></At>}
   <Item id={sid+'-table'}><At p={[TX,TY]} s={ks}><RoomCameraHero part="table" sheet={S.sheet} light={S.light}/></At></Item>
   {showG&&<At p={[gx,TY]} s={ks}><RoomCameraHero part="gurney" wheel={(gx-g.gpark)/(13*ks)}/></At>}
   {S.patient>0&&<Item id={sid+'-patient'}><At p={[px,TY]} s={ks}>
    <RoomCameraHero part="patient"/>
    {S.drapeOnGurney&&<RoomCameraHero part="drape" drop={1} flutter={t}/>}
   </At></Item>}
   {drapeOn&&<Item id={sid+'-patient'}><At p={[TX+off[0]*ks,TY+off[1]*ks]} s={ks}><RoomCameraHero part="drape" drop={S.drape} flutter={t}/></At></Item>}
   {hands&&<At p={[TX,TY]} s={ks}><RoomCameraHero part="gloves" arms={C.bodies.flatMap(b=>b.arms)}/></At>}
  </g>;
 };
 /** The clock: ring, hand and markers, with pulses from a camera to each marker as it stamps. */
 const clockAt=(c:Pt,r:number,draw:number,tags:'all'|'turnover'|'none',from?:{cam:CamAt;k:number;target:Pt},lit=0,pulse=0)=>{
  const marks=S.marks(lit,false).map((m,k)=>({...m,tag:tags==='all'||(tags==='turnover'&&k===2)}));
  return <g data-part="room-clock">
   <At p={c}><RoomCameraHero part="clock" r={r} draw={draw} hand={S.s2.hand} marks={marks} pulse={pulse} tags={tags!=='none'}/></At>
   {from&&sid==='s2'&&draw>.8&&(()=>{const l=lensOf(from.cam,from.k,from.target),a=(-60-90)*Math.PI/180,e:Pt=[c[0]+r*1.06*Math.cos(a),c[1]+r*1.06*Math.sin(a)];
    return <path data-part="system-link" d={`M${f2(l[0])} ${f2(l[1])}L${f2(e[0])} ${f2(e[1])}`} stroke={P0.teal} strokeWidth={3} strokeDasharray="6 9" opacity={f2(.55*clamp((draw-.8)*5))}/>;})()}
   {from&&pulseTo(lensOf(from.cam,from.k,from.target),k=>{const pin=markAt(r,S.markAngles[k]).pin;return [c[0]+pin[0],c[1]+pin[1]];})}
  </g>;
 };
 /** The camera's pulse from its lens to each marker's pin as that marker stamps. */
 const pulseTo=(l:Pt,pin:(k:number)=>Pt)=>S.pulses.map((u,k)=>{if(u<0)return null;const e=pin(k),p:Pt=[lerp(l[0],e[0],u),lerp(l[1],e[1],u)];
  return <g key={'pulse'+k} data-part="timestamp-pulse"><path d={`M${f2(l[0])} ${f2(l[1])}L${f2(p[0])} ${f2(p[1])}`} stroke={P0.teal} strokeWidth={4} strokeDasharray="8 8" opacity={.75}/>
   <circle cx={f2(p[0])} cy={f2(p[1])} r={11} fill={P0.tealLit} stroke={P0.ink} strokeWidth={2}/></g>;});
 /** The result card beside the blank box: the counter joined to the rollout tag by the associated link. */
 const result=(p:Pt,s:number)=><Item id="s10-result"><At p={p} s={s}><StudyRecordSupport part="result" link={1}/></At></Item>;

 /** The whole room at wall height through the stage's window, with the doorway in its right side wall. */
 const room=(Wn:Win,o:{clock?:'all'|'turnover'|'none';box?:number;turnLit?:number;pulse?:number;flash?:boolean;extra?:React.ReactNode;caseOn?:boolean;caseId?:string}={})=>{
  const L=roomLayout(Wn),g=rig(L.TX,L.TY,L.ks,L.xThr),target=watchPoint(g);
  const draw=t>=start('s2')?(sid==='s2'?S.s2.draw:1):0;
  return <g data-part="room">
   <Item id={sid+'-room'}>
    <RoomCameraHero part="sideWall" x0={0} x1={72} topFar={Wn.y-140*L.k} botFar={L.floorY-10} light={S.light}/>
    <RoomCameraHero part="floor" y0={L.floorY} vx={L.TX} light={S.light}/>
    <RoomCameraHero part="sideWall" x0={L.side.x0} x1={L.side.x1} topFar={L.side.topFar} botFar={L.side.botFar} light={S.light} door={DOOR}/>
    <At p={[L.pier.x,L.pier.y]}><RoomCameraHero part="tile" w={L.pier.w} h={L.pier.h} light={S.light}/></At>
    {S.light<1&&<rect x={L.pier.x} y={L.pier.y} width={L.pier.w} height={L.pier.h} fill={P0.ink} opacity={f2(.35*(1-S.light)/.62)}/>}
   </Item>
   <Item id={sid+'-plate'}><At p={[L.plate.x,L.plate.y-50*(1-contactQ(S.plate))*L.k]} o={sid==='s1'?clamp(S.plate*4):1}><RoomCameraHero part="plate" w={L.plate.w}/></At></Item>
   {o.box!==undefined&&<g data-part="wall-box">
    <path d={`M${f2(L.clock.c[0]+markAt(L.clock.r,S.turnoverAngle).pin[0])} ${f2(L.clock.c[1]+markAt(L.clock.r,S.turnoverAngle).pin[1])}Q${f2(L.box.x-20)} ${f2(L.box.y+200*L.k)} ${f2(L.box.x)} ${f2(L.box.y+BLANK.h*L.box.size*.6)}`}
     stroke={P0.trim} strokeWidth={3.4} strokeDasharray="10 9" fill="none" opacity={f2(clamp(o.box*2))}/>
    <Item id={sid+'-box'}><At p={[L.box.x,L.box.y]}><StudyRecordSupport part="blank" draw={o.box} size={L.box.size} pulse={o.pulse}/></At></Item>
    {result([L.result.x,L.result.y],L.result.s)}
   </g>}
   <At p={L.light} s={L.ks}><RoomCameraHero part="light" on={S.light>.5?S.light:S.light*.5} pool={[(g.TX-L.light[0])/L.ks,(g.TY-30*L.ks-L.light[1])/L.ks]} poolW={420}/></At>
   {/* the clock and its tags read over the light's translucent cone, never under it */}
   {draw>0&&<Item id={sid+'-clock'}><Item id={sid+'-markers'}>{clockAt(L.clock.c,L.clock.r,draw,o.clock??'all',{cam:L.cams[0],k:0,target},o.turnLit??0,o.pulse??0)}</Item></Item>}
   <Item id={sid+'-cameras'}><Item id={sid+'-lamps'}>{L.cams.map((c,k)=>camera(c,k,target))}</Item></Item>
   {sid==='s1'&&sights(L.cams,target,S.watch,o.flash?S.flash:undefined)}
   {(o.caseOn??true)&&(o.caseId?<Item id={o.caseId}>{caseGroup(g)}</Item>:caseGroup(g))}
   {S.light<1&&<rect x={0} y={L.floorY-20} width={1080} height={1920-L.floorY} fill={P0.ink} opacity={f2(.3*(1-S.light)/.62)}/>}
   {o.extra}
  </g>;
 };
 /** A doorway seen square on, for small room vignettes: frame, dim corridor and threshold, `x` its threshold. */
 const frontDoor=(x:number,floor:number,h:number,w=90)=><g data-part="front-door">
  <rect x={x} y={floor-h} width={w} height={h} fill="#4A585E"/>
  <path d={`M${x} ${floor}V${floor-h}H${x+w}V${floor}`} stroke={P0.steelShade} strokeWidth={10} fill="none"/>
  <path d={`M${x-6} ${floor}H${x+w+6}`} stroke={P0.steelLit} strokeWidth={6}/>
 </g>;
 /** A floor patch under a vignette rig. */
 const floorPatch=(g:Rig,x0:number,x1:number)=><path d={`M${f2(x0)} ${f2(g.TY+120*g.ks)}H${f2(x1)}L${f2(x1+40)} ${f2(g.TY+240*g.ks)}H${f2(x0-40)}Z`} fill={P0.floor} stroke={P0.ink} strokeWidth={2} opacity={.94}/>;

 // ---- the phone ---------------------------------------------------------------------------------------------
 const phoneAt=(p:Pt,s:number,rot=0)=><g data-part="phone-in-hand" transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${rot}) scale(${s})`}>
  <RoomCameraHero part="glove" front={false}/>
  <Item id="s3-phone"><Item id="s3-alert"><RoomCameraHero part="phone" lit={S.s3.lit} alert={S.s3.alert}/></Item></Item>
  <RoomCameraHero part="glove" front={true}/>
 </g>;
 /** The dashed text link from a wall camera's lens to the phone's screen, drawn as far as `p`. */
 const textLink=(from:Pt,to:Pt,p:number)=>p<=0?null:<g data-part="text-link">
  <path d={`M${f2(from[0])} ${f2(from[1])}Q${f2((from[0]+to[0])/2)} ${f2(Math.min(from[1],to[1])-90)} ${f2(lerp(from[0],to[0],p))} ${f2(lerp(from[1],to[1],p)-90*Math.sin(Math.PI*p)*.5)}`}
   stroke={P0.lamp} strokeWidth={4.4} strokeDasharray="12 10" fill="none" opacity={.9}/>
  {p>=1&&<circle cx={f2(to[0])} cy={f2(to[1])} r={9+5*S.s3.alert} fill={P0.lamp} stroke={P0.ink} strokeWidth={2}/>}
 </g>;
 /** A small room vignette (s3): a floor patch, a doorway at `door`, a wall camera and the case. */
 const vignette=(g:Rig,cam:CamAt,doorX:number|null)=><g data-part="room-vignette">
  {floorPatch(g,g.TX-TABLE.L*g.ks*.8,(doorX??g.gpark+GURNEY.L*g.ks*.5)+20)}
  {doorX!==null&&frontDoor(doorX,g.TY+150*g.ks,330*g.ks)}
  <Item id={sid+'-room'}>{camera(cam,0,watchPoint(g))}</Item>
  {caseGroup(g)}
 </g>;

 const recordBoard=(s:'s4'|'s5'|'s6'|'s7'|'s8'|'s9')=>{
  switch(s){
  case 's4':return <Items ids={['s4-study','s4-suite-line','s4-compare-line','s4-counter']}><StudyRecordSupport part="s4" {...S.s4}/></Items>;
  case 's5':return <Items ids={['s5-counter','s5-seven','s5-axis','s5-whisker','s5-unit']}><StudyRecordSupport part="s5" {...S.s5}/></Items>;
  case 's6':return <Items ids={['s6-bars','s6-suite-bar','s6-stamp']}><StudyRecordSupport part="s6" rise={S.s6.rise} suite={S.s6.suite} stamp={S.s6.stamp} press={S.s6.press} away={S.s6.away}/></Items>;
  case 's7':return <Items ids={['s7-rollout','s7-card','s7-dashed','s7-solid']}><StudyRecordSupport part="s7" {...S.s7}/></Items>;
  case 's8':return <Items ids={['s8-camera-tag','s8-reviews','s8-bundle','s8-company','s8-stake']}><StudyRecordSupport part="s8" {...S.s8}
   only={['stake-detail','ledger-stake-detail','ledger-company-close'].includes(view)?'stake':undefined}/></Items>;
  case 's9':{const c:Pt=[S9B.clock[0],S9B.clock[1]],r=S9B.clockR,pin=markAt(r,S.turnoverAngle).pin;
   const ring=<Item id="s9-clock"><Item id="s9-marker"><At p={c}><RoomCameraHero part="clock" r={r} draw={S.s9.ring} hand={S.turnoverAngle+12}
    marks={S.marks(S.s9.ring,true).map((m,k)=>({...m,stamp:S.s9.ring>.6?1:0,tag:k===2}))} pulse={S.s9.tagged} tags={S.s9.ring>.6}/></At></Item></Item>;
   return <Item id="s9-paper"><StudyRecordSupport part="s9" card={S.s9.card} tagged={S.s9.tagged} clock={ring} marker={[c[0]+pin[0],c[1]+pin[1]]}/></Item>;}
  }
 };
 /** A record view: the desk in the room (A) or the ledger page (B), the board fitted to the framing. */
 const recordView=(s:'s4'|'s5'|'s6'|'s7'|'s8'|'s9')=>{
  const focus=focusFor(view,fr),fy=FORESHORTEN[v][fr],F=fitRecord(focus,fr,fy,v==='b'),top=surfaceTop(focus,fr,F);
  const id='rc1024-rec-'+view;
  const tl=fitPt(F,[-30,-30]),br=fitPt(F,[1030,930]);
  const ledger=v==='b';
  const room=fr==='wide'||fr==='medium'||fr==='split',deskSurface=room||!ledger;
  // On the desk in the room the ledger lies below the desk edge; close up its binder bar sits just over the
  // surface row so the page's ruled area starts there and the record is clipped at one fixed row.
  const ledgerTop=room?Math.max(top+6,fitPt(F,[0,focus[1]])[1]-64):top-60,clipTop=room?(ledger?ledgerTop+60:top+4):top;
  return <g data-part="record-view" data-record={s}>
   {deskSurface&&<Item id={sid+'-room'}><StudyRecordSupport part="desk" y={top} mug={fr==='wide'||fr==='medium'?[ledger?60:1012,top+24]:undefined}/></Item>}
   {ledger&&<g transform={`translate(${f2(tl[0])} ${f2(ledgerTop)})`}>
    <StudyRecordSupport part="ledger" w={br[0]-tl[0]} h={1960-ledgerTop} rows={16}/></g>}
   <defs><clipPath id={id}><rect x={-40} y={f2(clipTop)} width={1160} height={1960}/></clipPath></defs>
   <g clipPath={`url(#${id})`} data-clip-top={f2(clipTop)}><g transform={`translate(${f2(F.ox)} ${f2(F.oy)}) scale(${F.s.toFixed(5)} ${(F.s*F.fy).toFixed(5)})`}>{recordBoard(s)}</g></g>
  </g>;
 };

 // ---- the plan (B) ---------------------------------------------------------------------------------------------
 /** The plan's props from the room's case state; camera wedges turn toward the gurney while it is watched. */
 const planProps=(o:{clockDraw?:number;marks?:ClockMark[];tags?:boolean}={})=>{
  const gp=planGurney(planU(S.u)),[tx,ty]=PLAN.table;
  const aim=PLAN.cams.map((c,k)=>{
   const toT=Math.atan2(ty-c[1],tx-c[0]),toG=Math.atan2(gp[1]-c[1],gp[0]-c[0]);
   let d=(toG-toT)*180/Math.PI;d=((d+540)%360)-180;
   return (S.u>0&&S.patient>0&&S.onTable<1?d*S.watch:0)+S.park*.4+S.scan(k);
  });
  return {light:S.light,lamps:S.lamps,aim,watch:Math.max(S.watch,t>=start('s2')?1:0),gurney:S.u>0?planU(S.u):0,onTable:S.onTable,
   drape:S.drape,sheet:S.sheet,crew:planCrew(),clockDraw:o.clockDraw??0,hand:S.s2.hand,marks:o.marks??[],clockTags:o.tags??false,
   pulses:o.clockDraw?S.pulses:[]};
 };
 /** The same crew from above: A at the gurney's push bar, B and C on the table's far side, C carrying the folded
 * drape before it is laid and laying the sheet at turnover. Plan units. */
 const planCrew=():PlanCrew[]=>{
  const out:PlanCrew[]=[],[tx,ty]=PLAN.table,xs=(xu:number)=>tx+xu*480/TABLE.L,far=ty-112;
  if(S.u>0&&S.phase!=='close'&&S.phase!=='next'){const gp=planGurney(planU(S.u));
   out.push({pos:[gp[0]+262,gp[1]],face:180,look:0,grips:[[gp[0]+214,gp[1]-30],[gp[0]+214,gp[1]+30]]});}
  if(S.inS2&&(S.phase==='pre'||S.phase==='draped'||S.phase==='turnover')){
   out.push({pos:[xs(S.phase==='turnover'?-250:-200),far],face:90,look:1,grips:[null,null]});
   if(S.phase==='turnover'){const gxp=tx+228-440*clamp(S.sheet),w=S.sheetHands?1-S.sheetHands.withdraw:0;
    out.push({pos:[gxp+52,far],face:90,look:2,grips:[null,w>0?[lerp(gxp+52,gxp,w),lerp(far+40,ty-58,w)]:null]});}
   else out.push({pos:[xs(225),far],face:90,look:2,grips:[[xs(225)+24,far+42],[xs(225)-24,far+42]],bundle:S.phase==='pre'});
  }
  return out;
 };

 let pic:React.ReactNode;
 switch(view){
 // ===== s1: the suite and its four wall cameras =====
 case 'room-wall-wide':{
  // A opens at wall height: as the room lights up the four cameras lift their heads from rest and scan,
  // lamps on standby, and the name plate settles on the pier.
  need('s1');pic=room(win(fr));break;}
 case 'camera-ring-view':{
  // The same mounts, closer: the four lamps go full amber one after another, each flashing a sight line.
  need('s1');pic=room(win(fr),{flash:true});break;}
 case 'table-low-detail':{
  // Low and close: the attendant wheels the gurney with the patient shape up to the suite doorway, one gloved
  // hand on its bar; the two near cameras turn their heads to it and their sight lines reach it.
  need('s1');
  const side={x0:1080,x1:860,topFar:300,botFar:1110};
  const g=rig(230,1010,1.1,sideWallPoint(side.x0,side.x1,side.topFar,side.botFar,DOOR.u1,0)[0]),target=watchPoint(g);
  const cams:CamAt[]=[{at:[200,340],s:1.3,mirror:false},{at:[760,352],s:1.3,mirror:true}];
  pic=<g>
   <Item id="s1-room"><At p={[0,250]}><RoomCameraHero part="tile" w={1080} h={300} tile={92} light={S.light}/></At>
    <RoomCameraHero part="floor" y0={1130} vx={560} light={S.light}/>
    <RoomCameraHero part="sideWall" x0={side.x0} x1={side.x1} topFar={side.topFar} botFar={side.botFar} light={S.light} door={DOOR}/></Item>
   <Item id="s1-cameras">{cams.map((c,k)=>camera(c,k,target))}</Item>
   {sights(cams,target,S.watch)}
   {caseGroup(g)}
  </g>;
  break;}
 case 'plan-overhead':{
  // B opens straight down on the suite's plan: as the room lights up the four cameras on its walls glow on
  // standby and sweep their sight wedges; the name plate settles under the plan.
  need('s1');
  pic=<Items ids={['s1-room','s1-table','s1-plate','s1-cameras']}><At p={[150,310]} s={.84}>
   <RoomCameraHero part="plan" {...planProps()} watch={Math.max(.5*S.lamps[0],S.watch)}/>
   <g transform={`translate(0 ${PLAN.h+40-60*(1-contactQ(S.plate))})`} opacity={f2(clamp(S.plate*4))}><RoomCameraHero part="plate" w={360}/></g>
  </At></Items>;
  break;}
 case 'plan-table-close':{
  // B close from above on the table and the door: the attendant pushes the gurney along the corridor to the
  // door threshold while the lit cameras' sight wedges turn to it.
  need('s1');const id='rc1024-planclip';
  pic=<Items ids={['s1-room','s1-table','s1-cameras']}>
   <rect x={48} y={292} width={1000} height={900} rx={22} fill={P0.shadow} opacity={.2}/>
   <defs><clipPath id={id}><rect x={40} y={280} width={1000} height={900} rx={22}/></clipPath></defs>
   <g clipPath={`url(#${id})`}><rect x={40} y={280} width={1000} height={900} fill={P0.floor}/><At p={[-180,136]} s={1.2}><RoomCameraHero part="plan" {...planProps()}/></At></g>
   <rect x={40} y={280} width={1000} height={900} rx={22} fill="none" stroke={P0.ink} strokeWidth={4}/>
  </Items>;
  break;}

 // ===== s2: the system timestamps entry, draping and turnover =====
 case 'clock-wall-wide':{
  // The ring draws itself on the pier beside the lit cameras, linked to the near camera, its hand sweeping;
  // the gurney waits with its head end in the doorway.
  need('s2');pic=room(win(fr),{clock:'all'});break;}
 case 'clock-marker-close':{
  // Close: the attendant pushes the gurney over the door threshold into the room and on to the table's foot;
  // as the patient crosses, a pulse runs from the wall camera to the ring and Patient entry stamps.
  need('s2');
  const side={x0:1080,x1:900,topFar:320,botFar:1130};
  const g=rig(560,1060,.5,sideWallPoint(side.x0,side.x1,side.topFar,side.botFar,DOOR.u1,0)[0]),target=watchPoint(g);
  const cam:CamAt={at:[170,330],s:1.1,mirror:false};
  pic=<g>
   <Item id="s2-room"><At p={[120,250]}><RoomCameraHero part="tile" w={800} h={900} tile={84} light={S.light}/></At>
    <RoomCameraHero part="floor" y0={1150} vx={600} light={S.light}/>
    <RoomCameraHero part="sideWall" x0={side.x0} x1={side.x1} topFar={side.topFar} botFar={side.botFar} light={S.light} door={DOOR}/></Item>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt([400,520],180,S.s2.draw,'all',{cam,k:0,target})}</Item></Item>
   {camera(cam,0,target)}
   <Item id="s2-patient">{caseGroup(g)}</Item>
  </g>;
  break;}
 case 'drape-stamp-medium':{
  // Medium, after the cut: the patient lies on the table beside the empty gurney; the attendant's gloved hands
  // open the folded drape and lay it with its lopsided fall, and a camera pulse stamps Draped on the ring.
  need('s2');pic=room(win(fr),{clock:'all',caseId:'s2-patient'});break;}
 case 'turnover-marker-view':{
  need('s2');
  if(fr==='overhead'){
   // B from above: the draped patient leaves on the gurney through the door, the drape going with them, while
   // the gloved hands lay a fresh sheet on the bare table and the camera's pulse stamps Turnover on the clock.
   pic=<Items ids={['s2-room','s2-clock','s2-markers','s2-patient']}><At p={[150,310]} s={.84}>
    <RoomCameraHero part="plan" {...planProps({clockDraw:1,marks:S.marks(0,false),tags:true})}/>
   </At></Items>;
   break;}
  // A split: at the left the ring stamps Turnover from a camera pulse; at the right the draped patient leaves on
  // the gurney through the door while the gloved hands lay a fresh sheet on the bare table.
  const cam:CamAt={at:[150,330],s:.95,mirror:false};
  const side={x0:1080,x1:960,topFar:360,botFar:1100};
  const g=rig(720,960,.45,sideWallPoint(side.x0,side.x1,side.topFar,side.botFar,DOOR.u1,0)[0]),target=watchPoint(g);
  const Wn=win(fr);
  pic=<g>
   <Item id="s2-room">
    <RoomCameraHero part="floor" y0={Wn.y+Wn.h+40} vx={800} light={S.light}/>
    <RoomCameraHero part="sideWall" x0={side.x0} x1={side.x1} topFar={side.topFar} botFar={side.botFar} light={S.light} door={DOOR}/>
    <At p={[0,380]}><RoomCameraHero part="tile" w={596} h={760} tile={76} light={S.light}/></At>
   </Item>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt([200,720],125,1,'all',{cam,k:0,target})}</Item></Item>
   {camera(cam,0,target)}
   <defs><clipPath id="rc1024-splitR"><rect x={604} y={0} width={476} height={1920}/></clipPath></defs>
   <g clipPath="url(#rc1024-splitR)"><Item id="s2-patient">{caseGroup(g)}</Item></g>
   <rect x={594} y={360} width={10} height={900} fill={P0.ink} opacity={.85}/>
  </g>;
  break;}
 case 'ledger-clock-desk':{
  // B medium: the clock ring draws on a steel record panel mounted on the suite wall, linked to the near wall
  // camera above the window.
  need('s2');const Wn=win(fr),L=roomLayout(Wn),c:Pt=[540,860],target:Pt=[540,860];
  pic=<g>
   <Item id="s2-room">{[L.cams[0],L.cams[1]].map((cm,k)=>camera(cm,k,target))}
    <At p={[170,480]}><StudyRecordSupport part="panel" w={740} h={660} rows={[]}/></At></Item>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt(c,170,S.s2.draw,'all',{cam:L.cams[0],k:0,target})}</Item></Item>
  </g>;
  break;}
 case 'plan-entry-overhead':{
  // B from above: the attendant pushes the gurney across the door threshold and up beside the table; the
  // near camera's wedge holds it and its pulse stamps Patient entry on the plan clock.
  need('s2');
  pic=<Items ids={['s2-room','s2-clock','s2-markers','s2-patient']}><At p={[150,310]} s={.84}>
   <RoomCameraHero part="plan" {...planProps({clockDraw:1,marks:S.marks(0,false),tags:true})}/>
  </At></Items>;
  break;}
 case 'ledger-marker-row':{
  // B detail: the wall camera's pulse stamps the Draped row of the wall record panel while, below, the gloved
  // hands open and lay the folded drape over the patient on the table beside the empty gurney.
  need('s2');
  const PW=960,ph=12+PANEL.title+12+3*PANEL.row+20,px0=60,py0=280;
  const m=S.marks(0,false),rows=MARK_LABELS.map((l,k)=>({label:l,stamp:m[k].stamp,active:bell(S.R(MARK_EVENTS[k]))}));
  const g=rig(420,1110,.5,1100),cam:CamAt={at:[960,930],s:.9,mirror:true},target=watchPoint(g);
  const pinOf=(k:number):Pt=>[px0+PW-70,py0+12+PANEL.title+12+k*PANEL.row+PANEL.row*.42];
  pic=<g>
   <Item id="s2-clock"><Item id="s2-markers"><At p={[px0,py0]}><StudyRecordSupport part="panel" w={PW} h={ph} rows={rows}/></At>
    <At p={[px0+150,py0+12+PANEL.title+12+PANEL.row*1.5]}><RoomCameraHero part="clock" r={64} draw={1} hand={S.s2.hand} marks={m} tags={false}/></At></Item></Item>
   <Item id="s2-room"><At p={[0,880]}><RoomCameraHero part="tile" w={1080} h={260} tile={80} light={S.light}/></At>
    <RoomCameraHero part="floor" y0={1140} vx={540} light={S.light}/></Item>
   {camera(cam,1,target)}
   {pulseTo(lensOf(cam,1,target),pinOf)}
   <Item id="s2-patient">{caseGroup(g)}</Item>
  </g>;
  break;}

 // ===== s3: the next patient, the text to the surgeon when the patient is draped =====
 case 'phone-hand-close':{
  // Close: the surgeon's phone in a gloved hand lights on its thread to the surgeon and a dashed link draws to it
  // from the wall camera; beside it the next patient is wheeled in through the door and slid onto the fresh sheet.
  need('s3');const cam:CamAt={at:[130,340],s:1.1,mirror:false};
  const g=rig(230,1000,.42,520,520+(GURNEY.L/2+8)*.42+110);
  const ph:Pt=[560,300],sc=1.5,to:Pt=[ph[0]+60*sc,ph[1]+60*sc];
  pic=<g>
   {vignette(g,cam,520)}
   {textLink(lensOf(cam,0,watchPoint(g)),to,S.s3.link)}
   {phoneAt(ph,sc)}
  </g>;
  break;}
 case 'table-drape-medium':{
  // Medium: the gloved hands open the folded drape and lay it with its lopsided fall over the patient on the
  // fresh sheet, the empty gurney beside the table; the gloved hand and phone wait at the frame's lower left.
  need('s3');pic=room(win(fr),{clock:'none',extra:phoneAt([34,960],.42,8)});break;}
 case 'alert-phone-view':{
  // Detail (A) or close (B): the amber text reading Patient draped slides onto the phone; the draped patient
  // and the wall camera that saw it sit at the left, the link between them lit.
  need('s3');const det=fr==='detail',cam:CamAt={at:[110,360],s:1.0,mirror:false};
  const g=rig(230,1010,.44,560,700);
  const ph:Pt=det?[470,290]:[500,320],sc=det?1.55:1.45,to:Pt=[ph[0]+60*sc,ph[1]+60*sc];
  pic=<g>
   {vignette(g,cam,null)}
   {textLink(lensOf(cam,0,watchPoint(g)),to,1)}
   {phoneAt(ph,sc)}
  </g>;
  break;}
 case 'desk-phone-wide':{
  // B wide: at the right the surgeon's phone stands in its dock on the records desk and lights as the gloved hand
  // lifts it, the link drawing from the wall camera; at the left the next patient is wheeled in through the
  // door and slid onto the fresh sheet by the gloved hands.
  need('s3');const Wn=win(fr),L=roomLayout(Wn),cam=L.cams[1],ph:Pt=[640,520-22*S.s3.lit];
  const g=rig(230,1080,.42,520,520+(GURNEY.L/2+8)*.42+110);
  const id='rc1024-deskclip';
  pic=<g>
   <Item id="s3-room">{camera(cam,1,[760,700])}</Item>
   {floorPatch(g,40,600)}
   {frontDoor(520,g.TY+150*g.ks,330*g.ks)}
   {caseGroup(g)}
   <defs><clipPath id={id}><rect x={560} y={0} width={600} height={1960}/></clipPath></defs>
   <g clipPath={`url(#${id})`}><StudyRecordSupport part="desk" y={Wn.y+Wn.h+30}/></g>
   <rect x={650} y={1078} width={270} height={26} rx={8} fill={P0.trim}/>
   {textLink(lensOf(cam,1,[760,700]),[ph[0]+60*.95,ph[1]+60*.95],S.s3.link)}
   {phoneAt(ph,.95)}
  </g>;
  break;}
 case 'desk-drape-split':{
  // B split: at the left the gloved hands lay the folded drape over the patient on the table beside the empty
  // gurney; at the right the phone waits on the desk under the window.
  need('s3');const Wn=win(fr),cam:CamAt={at:[110,430],s:.9,mirror:false};
  const g=rig(220,980,.44,560,700);
  pic=<g>
   <Item id="s3-room"><At p={[0,370]}><RoomCameraHero part="tile" w={540} h={560} tile={70} light={S.light}/></At>
    <rect x={0} y={930} width={540} height={360} fill={P0.floor}/><path d="M0 930H540" stroke={P0.ink} strokeWidth={3}/></Item>
   <Item id="s3-room">{camera(cam,0,watchPoint(g))}</Item>
   {caseGroup(g)}
   <StudyRecordSupport part="desk" y={Wn.y+Wn.h+10}/>
   {phoneAt([660,560],.8)}
   <rect x={536} y={360} width={10} height={920} fill={P0.ink} opacity={.85}/>
  </g>;
  break;}

 // ===== s4 to s9: the study's records =====
 case 'study-card-medium':case 'study-lines-close':case 'counter-rise-view':case 'ledger-counter-wide':case 'ledger-lines-overhead':
  need('s4');pic=recordView('s4');break;
 case 'badge-medium':case 'axis-close':case 'whisker-label-view':case 'ledger-badge-wide':case 'ledger-axis-overhead':
  need('s5');pic=recordView('s5');break;
 case 'placebo-bars-wide':case 'stamp-view':case 'ledger-bars-overhead':
  need('s6');pic=<Item id="s6-room">{recordView('s6')}</Item>;break;
 case 'card-medium':case 'dashed-link-wide':case 'strike-close':case 'ledger-card-close':case 'ledger-link-overhead':case 'ledger-strike-detail':
  need('s7');pic=recordView('s7');break;
 case 'bundle-medium':case 'bundle-band-close':case 'stake-wide':case 'stake-detail':
 case 'ledger-bundle-wide':case 'ledger-band-overhead':case 'ledger-company-close':case 'ledger-stake-detail':
  need('s8');pic=recordView('s8');break;
 case 'future-card-medium':case 'future-marker-close':case 'ledger-future-close':case 'ledger-marker-detail':
  need('s9');pic=recordView('s9');break;

 // ===== s10: what the study does not show, beside what it found =====
 case 'blank-box-view':{
  // Close (A) or detail (B): beside the turnover marker a dashed box draws and asks did the rollout speed up
  // turnover; the marker pulses once and the box stays blank. Under it the result card holds the counter of about
  // 25 more a month, joined to the camera rollout tag by the associated link; the wall camera's lamp stays lit.
  need('s10');const z=fr==='detail'?1.06:1;
  const c:Pt=[300,540],r=170,pin=markAt(r,S.turnoverAngle).pin,box:Pt=[560,420];
  // the result card goes below the lit Turnover tag wherever the measured retime puts the marker
  const tb=turnoverTagBox(c,r,S.turnoverAngle),cardY=Math.max(830,tb[3]+28);
  pic=<g transform={`translate(540 660) scale(${z}) translate(-540 -660)`}>
   <Item id="s10-room"><Item id="s10-window"><At p={[60,280]}><RoomCameraHero part="tile" w={940} h={800} tile={88} light={S.light} hole={[40,600,210,170]}/></At></Item></Item>
   <Item id="s10-lamps">{camera({at:[930,330],s:1.1,mirror:true},1,[600,800])}</Item>
   <Item id="s10-clock">{clockAt(c,r,1,'turnover',undefined,1,S.s10.pulse)}</Item>
   <path d={`M${f2(c[0]+pin[0])} ${f2(c[1]+pin[1])}Q${f2(box[0]-40)} ${f2(box[1]+260)} ${box[0]} ${f2(box[1]+BLANK.h*.4)}`} stroke={P0.trim} strokeWidth={4} strokeDasharray="10 9" fill="none" opacity={f2(clamp(S.s10.box*2))}/>
   <Item id="s10-box"><At p={box}><StudyRecordSupport part="blank" draw={S.s10.box} size={.8} pulse={S.s10.pulse}/></At></Item>
   {result([440,cardY],.92)}
  </g>;
  break;}
 case 'room-window-wide':{
  // A wide: back in the room, the empty table on its fresh sheet, the clock with its lit turnover marker, the
  // blank box and the result card beside it; the room light lowers and the four camera lamps stay lit.
  need('s10');pic=<Items ids={['s10-window']}>{room(win(fr),{clock:'turnover',turnLit:1,box:1,pulse:S.s10.pulse})}</Items>;break;}
 case 'ledger-room-window':{
  // B wide: the room behind the desk, its clock's turnover marker lit, its room light lowering and its four
  // camera lamps lit; on the ledger page in the foreground, unsquashed and readable at phone size, the blank box
  // stays empty beside the result card.
  need('s10');const Wn=win(fr),deskY=900;
  pic=<Items ids={['s10-window']}>{room(Wn,{clock:'turnover',turnLit:1,extra:<g>
   <StudyRecordSupport part="desk" y={deskY}/>
   <g transform={`translate(40 ${deskY+5}) rotate(-1.2)`}><StudyRecordSupport part="ledger" w={1000} h={330} rows={4}/>
    <At p={[30,120]}><Item id="s10-box"><StudyRecordSupport part="blank" draw={1} size={.8} pulse={S.s10.pulse}/></Item></At>
    {result([430,58],.98)}</g>
  </g>})}</Items>;
  break;}
 default:throw new Error('Unimplemented room clock view '+view);
 }

 // ---- the disclosure chip: this scene's production_disclosure in this treatment's board, every frame ----
 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText),box=disclosureBox(disclosureText);
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;

};
