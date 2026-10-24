import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {RoomCameraHero,ROOM_PAINT,TABLE,GURNEY,PLATE,PLAN,cameraLens,aimAt,markAt,type ClockMark} from './RoomCameraHero';
import {StudyRecordSupport,S4B,S5B,S6B,S7B,S8B,S9B,BLANK} from './StudyRecordSupport';

/**
 * room-clock-v1: the room that watches itself (2026-10-24, Harris County, the Gulf coast plate of Houston).
 *
 * ONE generic cardiothoracic operating room (RoomCameraHero) and its records (StudyRecordSupport) carry the
 * film. Every performed state is a closed function of the film frame clock and the board's event windows
 * (clockState), so any frame renders alone and the same twice, and a measured retime moves every action
 * with its event:
 *
 *  s1  the dim room lights up around its table (s1-event-1); the suite name plate, reading Cardiothoracic
 *      suite and Houston Methodist Hospital, settles on the tiled pier (s1-event-2); the four wall
 *      cameras' amber lamps light one after another (s1-event-3); a gurney with the patient shape is
 *      wheeled up to the table while all four camera heads turn to follow it and their sight lines
 *      reach it (s1-event-4, one travel stroke). B reads the same room as a plan from above.
 *  s2  the room clock ring draws itself on the pier (s2-event-1) with its hand sweeping; then the system
 *      timestamps three seen events, each a pulse from a wall camera to the ring and a teal marker stamped
 *      where the hand stands: the patient slides off the gurney onto the table (Patient entry,
 *      s2-event-2), the drape lowers over the patient (Draped, s2-event-3), the gurney rolls the patient out
 *      and the table takes a fresh sheet (Turnover, s2-event-4). B reads them as ledger rows and a plan.
 *  s3  the surgeon's phone in a gloved hand lights, its thread from the suite cameras to the surgeon, a
 *      link drawn from a wall camera to it (s3-event-1); the drape lowers over the next patient
 *      (s3-event-2); then the amber text reading Patient draped slides onto the phone (s3-event-3).
 *  s4  the hospital study card lands (s4-event-1); its teal suite line and dashed line for other Houston
 *      Methodist sites draw (s4-event-2); the suite line climbs away after the cameras go on (s4-event-3);
 *      the gap pours 25 case tiles into the tray and the counter lands on about 25 more surgeries a month
 *      (s4-event-4). The number appears only when the tray holds 25.
 *  s5  the 7% rise badge stamps beside the counter (s5-event-1), the counter glows (s5-event-2), the 95%
 *      confidence interval axis draws (s5-event-3), the whisker draws from 8.3 (s5-event-4), and its 41.0
 *      cap lands with the cases a month tag (s5-event-5).
 *  s6  gray placebo bars rise (s6-event-1), the teal suite bar joins below the tallest gray bar
 *      (s6-event-2), and the amber stamp short of conventional significance presses down across the row.
 *  s7  the authors' card reading associated with the rollout slides in beside the camera rollout tag
 *      (s7-event-1), a dashed link draws to the counter (s7-event-2), and a solid arrow marked caused draws
 *      and is struck through (s7-event-3, the turn).
 *  s8  the rollout tag slides beside four workflow review notes (s8-event-1), the kraft band reading
 *      Bundled wraps them (s8-event-2), the camera company tag, its empty ownership ring and the Houston
 *      Methodist tag appear (s8-event-3), and a minority slice lights with no number (s8-event-4).
 *  s9  the future work card lands (s9-event-1), the clock ring draws with its turnover marker lit
 *      (s9-event-2), and the card's turnover time line tags the marker (s9-event-3).
 *  s10 a dashed blank box draws beside the turnover marker (s10-event-1) and asks did turnover speed up;
 *      the marker pulses once and the box stays blank (s10-event-2); the four camera lamps dim in the
 *      room (s10-event-3).
 *
 * Colour carries meaning once: amber is only the camera lamps, the placebo stamp and the text alert; teal
 * is the suite and its record. The region stands behind the room through the stage's window (PlaceStage);
 * no full-frame background is painted. Disclosed illustration: a generic room, no real staff, patient,
 * vendor interface, logo or second level timing.
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
const P0=ROOM_PAINT;

/** The clock hand's sweep, seconds per turn, and its angle at the start of s2. */
export const HAND={period:6,start:-40};
/** Where in its window each s2 marker is stamped (the pulse reaches the ring first). */
export const STAMP_AT=.45;
export const MARK_EVENTS=['s2-event-2','s2-event-3','s2-event-4'] as const;
export const MARK_LABELS=['Patient entry','Draped','Turnover'];

export type Starts={s2:number;s3:number;s10:number};
/** The time integral of smoothstep((t-a)/T) from a to t: a speed that ramps in smoothly and then holds. */
export function smoothInt(t:number,a:number,T:number){const u=(t-a)/T;if(u<=0)return 0;if(u>=1)return T*.5+(t-a-T);return T*(u*u*u-u*u*u*u/2);}
/** How far the gurney rolls in, in screen pixels at most, so its travel never outruns the 30 fps frame. */
export const GURNEY_RUN=400;
/** After turnover the gurney drifts on toward the door at this many table units a second. */
export const DRIFT=240;
export function clockState(W:Record<string,ActionWindow>,t:number,S:Starts){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 // s1: the room lights up, the plate settles, the lamps light in turn, the gurney comes in and is watched
 const r13=R('s1-event-3'),dim=P('s10-event-3');
 const lamps=[0,1,2,3].map(k=>contactQ((r13-k*.21)/.17)*(1-.85*dim));
 const flash=[0,1,2,3].map(k=>bell((r13-k*.21)/.36));
 const arrive=P('s1-event-4'),watch=smooth(R('s1-event-4')/.45);
 // the room's case state: one case through s2, the next case in s3, an empty reset table at the close
 let gurney=0,onTable=0,drape=0,rollOut=0,sheet=0,patient=0,drift=0;
 if(t<S.s3){gurney=arrive;onTable=P('s2-event-2');drape=P('s2-event-3');rollOut=P('s2-event-4');sheet=smooth((rollOut-.45)/.55);patient=arrive>0?1:0;
  drift=W['s2-event-4']?DRIFT*smoothInt(t,W['s2-event-4'].end,.4):0;}
 else if(t<S.s10){onTable=1;drape=P('s3-event-2');patient=1;}
 else{sheet=1;}
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
  light:.38+.62*P('s1-event-1'),plate:P('s1-event-2'),lamps,flash,arrive,watch,dim,
  gurney,onTable,drape,rollOut,sheet,patient,drift,
  s2,marks,pulses,markAngles,turnoverAngle,
  s3:{lit:P('s3-event-1'),link:ease5(R('s3-event-1')),alert:P('s3-event-3')},
  s4:{card:P('s4-event-1'),draw:P('s4-event-2'),climb:P('s4-event-3'),fill:P('s4-event-4'),num:clamp((R('s4-event-4')-.82)/.18)},
  s5:{badge:P('s5-event-1'),glow:bell(R('s5-event-2')),axis:P('s5-event-3'),whisker:P('s5-event-4'),cap:P('s5-event-5')},
  s6:{rise:P('s6-event-1'),suite:P('s6-event-2'),...stampState(W['s6-event-3'],t)},
  s7:{card:P('s7-event-1'),link:P('s7-event-2'),arrow:ease5(R('s7-event-3')/.5),strike:contactQ((R('s7-event-3')-.55)/.35)},
  s8:{tag:P('s8-event-1'),band:P('s8-event-2'),stake:P('s8-event-3'),slice:P('s8-event-4')},
  s9:{card:P('s9-event-1'),ring:P('s9-event-2'),tagged:P('s9-event-3')},
  s10:{box:P('s10-event-1'),pulse:R('s10-event-2'),dim},
  P,R};
}
export type ClockState=ReturnType<typeof clockState>;
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
export function roomLayout(Wn:Win){
 const k=Wn.w/888,ks=.82*k;
 const pier={x:Wn.x-22,y:Wn.y-26,w:Wn.w*.36+22,h:Wn.h+52};
 const pcx=pier.x+pier.w/2;
 const plate={x:pcx-PLATE.w*k*.5,y:Wn.y+16*k,w:PLATE.w*k};
 const clock={c:[pier.x+pier.w*.55,Wn.y+268*k] as Pt,r:104*k};
 const cams:CamAt[]=[{at:[Wn.x+.30*Wn.w,Wn.y-80*k],s:.92*k,mirror:false},{at:[Wn.x+.80*Wn.w,Wn.y-80*k],s:.92*k,mirror:true},
  {at:[30,Wn.y-60*k],s:1.05*k,mirror:false},{at:[1050,Wn.y-70*k],s:1.05*k,mirror:true}];
 const TX=Wn.x+.42*Wn.w,TY=Wn.y+Wn.h+10*k;
 return {k,ks,pier,plate,clock,cams,floorY:Wn.y+Wn.h+52*k,TX,TY,
  gpark:TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,light:[TX+60*ks,Wn.y-6] as Pt,
  box:{x:pier.x+pier.w+20*k,y:Wn.y+150*k,size:.62*k}};
}
/** The four cameras for the camera-ring view: larger, and the side pair lower on their walls. */
export const RING_CAMS=(Wn:Win):CamAt[]=>{const k=Wn.w/888;return [{at:[310,Wn.y-70*k],s:1.35*k,mirror:false},{at:[790,Wn.y-66*k],s:1.35*k,mirror:true},
 {at:[24,Wn.y+190*k],s:1.35*k,mirror:false},{at:[1056,Wn.y+180*k],s:1.35*k,mirror:true}];};

/** Where the gurney and the patient stand on the room's floor line, in screen x. The gurney rolls in from
 * `gout` to its park beside the table's foot; at turnover the patient slides back onto it and it drifts on
 * toward the door. Pure. */
export function caseX(st:ClockState,TX:number,gpark:number,gout:number,ks:number){
 const roll=st.rollOut,gx=roll>0?gpark+st.drift*ks:lerp(gout,gpark,st.gurney);
 const px=roll>0?lerp(TX,gx,roll):lerp(gx,TX,st.onTable);
 return {gx,px,gurneyOn:st.gurney>0,patientOn:st.patient>0};
}
/** The gurney's entry start for a park position: GURNEY_RUN pixels, or less for a small room. */
export const goutFor=(gpark:number,ks:number)=>gpark+Math.min(GURNEY_RUN,480*ks);

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
 'ledger-band-overhead':S8B.focus.band as Rect,'stake-wide':S8B.focus.stake as Rect,'ledger-company-close':S8B.focus.slice as Rect,
 'stake-detail':S8B.focus.slice as Rect,'ledger-stake-detail':S8B.focus.slice as Rect,
 'future-card-medium':S9B.focus.card as Rect,'ledger-future-close':S9B.focus.card as Rect,'future-marker-close':S9B.focus.marker as Rect,
 'ledger-marker-detail':S9B.focus.marker as Rect};
/** Views whose detail framing keeps the close focus, because tightening would cut a label at the frame edge. */
export const NO_TIGHTEN=new Set(['counter-rise-view','ledger-strike-detail']);
export function focusFor(view:string,fr:Framing):Rect{
 const f=FOCUS[view];if(!f)throw new Error('No record focus for '+view);
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
 // Scene starts on the native frame grid, where DirectedFilm cuts, so a shot's first frame already reads its own
 // scene's state rather than the previous scene's for the fraction of a frame before the unrounded start.
 const start=(id:string)=>{const s=board.scenes.find(x=>x.id===id);if(!s)throw new Error('Missing scene '+id);return Math.round(s.start_s*fps)/fps;};
 const S=clockState(W,t,{s2:start('s2'),s3:start('s3'),s10:start('s10')});
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing as Framing;
 const place=usePlace(),flat=ad.flat_shots?.[sid];
 const win=(f:Framing):Win=>place?.window??STAGE_WIN[f==='wide'?'wide':'medium'];
 const need=(s:string)=>{if(sid!==s)throw new Error(view+' draws '+s+' only');};

 // ---- the room ----------------------------------------------------------------------------------------------
 const camLamp=(k:number)=>S.lamps[k];
 /** A camera at its mount, its head turned to the target, its lamp from the clock state. */
 const camera=(c:CamAt,k:number,target:Pt,extraAim=0)=>{
  const aim=aimAt(c.at,c.s,target,c.mirror)+extraAim;
  return <At key={'cam'+k} p={c.at} s={c.s}><g data-cam={'cam'+k}><RoomCameraHero part="camera" lamp={camLamp(k)} aim={aim} mirror={c.mirror} droop={k===1?1.4:1} flash={S.flash[k]}/></g></At>;
 };
 const lensOf=(c:CamAt,target:Pt,extraAim=0):Pt=>cameraLens(c.at,c.s,aimAt(c.at,c.s,target,c.mirror)+extraAim,c.mirror);
 /** Dashed sight lines from each lit camera to what it watches. */
 const sights=(cams:CamAt[],target:Pt,amount:number)=>amount<=0?null:<g data-part="sight-lines">{cams.map((c,k)=>{
  const l=lensOf(c,target),on=camLamp(k);if(on<=0)return null;
  return <path key={k} d={`M${f2(l[0])} ${f2(l[1])}L${f2(target[0])} ${f2(target[1])}`} stroke={P0.lampGlow} strokeWidth={3.4} strokeDasharray="12 10" opacity={f2(.75*amount*on)}/>;})}</g>;
 /** The table, the gurney and the patient shape with the drape, on a floor line at TY with scale ks. */
 const caseGroup=(TX:number,TY:number,ks:number,gpark:number,gout:number,o:{gurneyAllowed?:boolean}={})=>{
  const c=caseX(S,TX,gpark,gout,ks),wheel=(c.gx-gpark)/(13*ks);
  return <g data-part="case">
   <Item id={sid+'-table'}><At p={[TX,TY]} s={ks}><RoomCameraHero part="table" sheet={S.sheet} light={S.light}/></At></Item>
   {(o.gurneyAllowed??true)&&c.gurneyOn&&<At p={[c.gx,TY]} s={ks}><RoomCameraHero part="gurney" wheel={wheel}/></At>}
   {c.patientOn&&<Item id={sid+'-patient'}><At p={[c.px,TY]} s={ks}>
    <RoomCameraHero part="patient"/>
    {S.drape>0&&<RoomCameraHero part="drape" drop={S.drape} flutter={t}/>}
   </At></Item>}
  </g>;
 };
 const patientPoint=(TX:number,TY:number,ks:number,gpark:number,gout:number):Pt=>{const c=caseX(S,TX,gpark,gout,ks);return [c.patientOn?c.px:TX,TY-46*ks];};
 /** The clock on the pier: ring, hand and markers, with pulses from a camera to each marker as it stamps. */
 const clockAt=(c:Pt,r:number,draw:number,tags:'all'|'turnover'|'none',fromCam?:{cam:CamAt;target:Pt},lit=0,pulse=0)=>{
  const marks=S.marks(lit,false).map((m,k)=>({...m,tag:tags==='all'||(tags==='turnover'&&k===2)}));
  return <g data-part="room-clock">
   <At p={c}><RoomCameraHero part="clock" r={r} draw={draw} hand={S.s2.hand} marks={marks} pulse={pulse} tags={tags!=='none'}/></At>
   {fromCam&&sid==='s2'&&draw>.8&&(()=>{const l=lensOf(fromCam.cam,fromCam.target),a=(-60-90)*Math.PI/180,e:Pt=[c[0]+r*1.06*Math.cos(a),c[1]+r*1.06*Math.sin(a)];
    return <path data-part="system-link" d={`M${f2(l[0])} ${f2(l[1])}L${f2(e[0])} ${f2(e[1])}`} stroke={P0.teal} strokeWidth={3} strokeDasharray="6 9" opacity={f2(.55*clamp((draw-.8)*5))}/>;})()}
   {fromCam&&S.pulses.map((u,k)=>{if(u<0)return null;const l=lensOf(fromCam.cam,fromCam.target),pin=markAt(r,S.markAngles[k]).pin,e:Pt=[c[0]+pin[0],c[1]+pin[1]];
    const p:Pt=[lerp(l[0],e[0],u),lerp(l[1],e[1],u)];
    return <g key={k} data-part="timestamp-pulse"><path d={`M${f2(l[0])} ${f2(l[1])}L${f2(p[0])} ${f2(p[1])}`} stroke={P0.teal} strokeWidth={4} strokeDasharray="8 8" opacity={.7}/>
     <circle cx={f2(p[0])} cy={f2(p[1])} r={11} fill={P0.tealLit} stroke={P0.ink} strokeWidth={2}/></g>;})}
  </g>;
 };
 /** The whole room seen at wall height through the stage's window. */
 const room=(Wn:Win,o:{cams?:CamAt[];clock?:'all'|'turnover'|'none';clockDraw?:number;box?:number;turnLit?:number;pulse?:number;caseOn?:boolean;
  TX?:number;TY?:number;ks?:number;extra?:React.ReactNode})=>{
  const L=roomLayout(Wn),cams=o.cams??L.cams,TX=o.TX??L.TX,TY=o.TY??L.TY,ks=o.ks??L.ks;
  const gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gout=goutFor(gpark,ks),target=patientPoint(TX,TY,ks,gpark,gout);
  const draw=o.clockDraw??(t>=start('s2')?(sid==='s2'?S.s2.draw:1):0);
  return <g data-part="room">
   <Item id={sid+'-room'}>
    <RoomCameraHero part="sideWall" x0={0} x1={72} topFar={Wn.y-140*L.k} botFar={L.floorY-10} light={S.light}/>
    <RoomCameraHero part="sideWall" x0={1080} x1={1004} topFar={Wn.y-150*L.k} botFar={L.floorY-14} light={S.light}/>
    <RoomCameraHero part="floor" y0={L.floorY} vx={TX} light={S.light}/>
    <At p={[L.pier.x,L.pier.y]}><RoomCameraHero part="tile" w={L.pier.w} h={L.pier.h} light={S.light}/></At>
    {S.light<1&&<rect x={L.pier.x} y={L.pier.y} width={L.pier.w} height={L.pier.h} fill={P0.ink} opacity={f2(.35*(1-S.light)/.62)}/>}
   </Item>
   <Item id={sid+'-plate'}><At p={[L.plate.x,L.plate.y-50*(1-contactQ(S.plate))*L.k]} o={sid==='s1'?clamp(S.plate*4):1}><RoomCameraHero part="plate" w={L.plate.w}/></At></Item>
   {draw>0&&<Item id={sid+'-clock'}><Item id={sid+'-markers'}>{clockAt(L.clock.c,L.clock.r,draw,o.clock??'all',{cam:cams[0],target},o.turnLit??0,o.pulse??0)}</Item></Item>}
   {o.box!==undefined&&<g data-part="wall-box">
    <path d={`M${f2(L.clock.c[0]+markAt(L.clock.r,S.turnoverAngle).pin[0])} ${f2(L.clock.c[1]+markAt(L.clock.r,S.turnoverAngle).pin[1])}Q${f2(L.box.x-20)} ${f2(L.box.y+200*L.k)} ${f2(L.box.x)} ${f2(L.box.y+BLANK.h*L.box.size*.6)}`}
     stroke={P0.trim} strokeWidth={3.4} strokeDasharray="10 9" fill="none" opacity={f2(clamp(o.box*2))}/>
    <Item id={sid+'-box'}><At p={[L.box.x,L.box.y]}><StudyRecordSupport part="blank" draw={o.box} size={L.box.size} pulse={o.pulse}/></At></Item>
   </g>}
   <At p={L.light} s={ks}><RoomCameraHero part="light" on={S.light>.5?S.light:S.light*.5} pool={[(TX-L.light[0])/ks,(TY-30*ks-L.light[1])/ks]} poolW={420}/></At>
   <Item id={sid+'-cameras'}><Item id={sid+'-lamps'}>{cams.map((c,k)=>camera(c,k,target))}</Item></Item>
   {sid==='s1'&&sights(cams,target,S.watch)}
   {(o.caseOn??true)&&caseGroup(TX,TY,ks,gpark,gout)}
   {S.light<1&&<rect x={0} y={L.floorY-20} width={1080} height={1920-L.floorY} fill={P0.ink} opacity={f2(.3*(1-S.light)/.62)}/>}
   {o.extra}
  </g>;
 };

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
 /** A small room vignette in a close or detail: a floor patch, the table with its case, a wall camera. */
 const vignette=(TX:number,TY:number,ks:number,cam:CamAt,camK:number,o:{floor?:boolean}={})=>{
  const gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gout=goutFor(gpark,ks),target=patientPoint(TX,TY,ks,gpark,gout);
  return <g data-part="room-vignette">
   {(o.floor??true)&&<path d={`M${f2(TX-TABLE.L*ks*.75)} ${f2(TY+120*ks)}H${f2(TX+TABLE.L*ks*.8)}L${f2(TX+TABLE.L*ks*.95)} ${f2(TY+230*ks)}H${f2(TX-TABLE.L*ks*.9)}Z`} fill={P0.floor} stroke={P0.ink} strokeWidth={2} opacity={.92}/>}
   <Item id={sid+'-room'}>{camera(cam,camK,target)}</Item>
   {caseGroup(TX,TY,ks,gpark,gout,{gurneyAllowed:false})}
  </g>;
 };

 // ---- records -----------------------------------------------------------------------------------------------
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
 const planProps=(o:{gurney?:number;onTable?:number;drape?:number}={})=>({light:S.light,lamps:S.lamps,aim:[0,0,0,0],watch:S.watch,
  gurney:o.gurney??(t<start('s3')?S.gurney:0),onTable:o.onTable??(S.rollOut>0?1-S.rollOut:S.onTable),drape:o.drape??S.drape});

 let pic:React.ReactNode;
 switch(view){
 // ===== s1: the suite and its four wall cameras =====
 case 'room-wall-wide':{
  // A opens at wall height: the dim room lights up round its table, the name plate settles on the pier,
  // and (if the shot runs on) the four lamps light and the gurney arrives.
  need('s1');pic=room(win(fr),{});break;}
 case 'camera-ring-view':{
  // The four wall cameras, larger, light one after another; each flashes as its lamp comes on.
  need('s1');const Wn=win(fr);pic=room(Wn,{cams:RING_CAMS(Wn)});break;}
 case 'table-low-detail':{
  // Low and close: the gurney with the patient shape is wheeled up to the table's foot while two wall
  // cameras above turn their heads to follow it and their sight lines reach it.
  need('s1');
  const TX=240,TY=1010,ks=1.25,gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gout=goutFor(gpark,ks),target=patientPoint(TX,TY,ks,gpark,gout);
  const cams:CamAt[]=[{at:[200,340],s:1.3,mirror:false},{at:[930,352],s:1.4,mirror:true}];
  pic=<g>
   <Item id="s1-room"><At p={[0,250]}><RoomCameraHero part="tile" w={1080} h={300} tile={92} light={S.light}/></At>
    <RoomCameraHero part="floor" y0={1130} vx={560} light={S.light}/></Item>
   <Item id="s1-cameras">{cams.map((c,k)=>camera(c,k===0?0:1,target))}</Item>
   {sights(cams,target,S.watch)}
   {caseGroup(TX,TY,ks,gpark,gout)}
  </g>;
  break;}
 case 'plan-overhead':{
  // B opens straight down on the suite's plan: the room lights up round the table, the name plate settles
  // under the plan, the four cameras sit on the walls with their lamps still dark.
  need('s1');
  pic=<Items ids={['s1-room','s1-table','s1-plate','s1-cameras']}><At p={[150,310]} s={.84}>
   <RoomCameraHero part="plan" {...planProps()}/>
   <g transform={`translate(0 ${PLAN.h+40-60*(1-contactQ(S.plate))})`} opacity={f2(clamp(S.plate*4))}><RoomCameraHero part="plate" w={360}/></g>
  </At></Items>;
  break;}
 case 'plan-table-close':{
  // B close from above: the gurney comes in through the door gap and parks beside the table while the
  // lit cameras' sight wedges reach it.
  need('s1');const id='rc1024-planclip';
  pic=<Items ids={['s1-room','s1-table','s1-cameras']}>
   <rect x={48} y={292} width={1000} height={900} rx={22} fill={P0.shadow} opacity={.2}/>
   <defs><clipPath id={id}><rect x={40} y={280} width={1000} height={900} rx={22}/></clipPath></defs>
   <g clipPath={`url(#${id})`}><rect x={40} y={280} width={1000} height={900} fill={P0.floor}/><At p={[24,136]} s={1.2}><RoomCameraHero part="plan" {...planProps()}/></At></g>
   <rect x={40} y={280} width={1000} height={900} rx={22} fill="none" stroke={P0.ink} strokeWidth={4}/>
  </Items>;
  break;}

 // ===== s2: the clock timestamps entry, draping and turnover =====
 case 'clock-wall-wide':{
  // The ring draws itself on the pier beside the lit cameras, its hand sweeping; then each seen event
  // sends a pulse from the near camera to the ring and stamps its marker.
  need('s2');pic=room(win(fr),{clock:'all'});break;}
 case 'clock-marker-close':{
  // Close on the ring: Patient entry stamps as the patient slides off the gurney onto the table below,
  // then Draped as the drape comes down.
  need('s2');
  const cam:CamAt={at:[130,300],s:1.1,mirror:false},TX=360,TY=1110,ks=.62;
  const gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gout=goutFor(gpark,ks),target=patientPoint(TX,TY,ks,gpark,gout);
  pic=<g>
   <Item id="s2-room"><At p={[160,250]}><RoomCameraHero part="tile" w={760} h={680} tile={84} light={S.light}/></At>
    <RoomCameraHero part="floor" y0={1180} vx={520} light={S.light}/></Item>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt([420,600],200,S.s2.draw,'all',{cam,target})}</Item></Item>
   {camera(cam,0,target)}
   <Item id="s2-patient">{caseGroup(TX,TY,ks,gpark,gout)}</Item>
  </g>;
  break;}
 case 'turnover-marker-view':{
  need('s2');
  if(fr==='overhead'){
   // B from above: the gurney takes the draped patient off the table and out through the door while the
   // plan's clock stamps Turnover.
   pic=<Items ids={['s2-room','s2-clock','s2-markers','s2-patient']}><At p={[150,310]} s={.84}>
    <RoomCameraHero part="plan" {...planProps()} clockDraw={1} hand={S.s2.hand} marks={S.marks(0,false)} clockTags={true}/>
   </At></Items>;
   break;}
  // A split: the ring on the pier at the left stamps Turnover as, at the right, the gurney rolls the
  // patient out of the room and the table takes a fresh sheet.
  const cam:CamAt={at:[150,330],s:.95,mirror:false},TX=790,TY=960,ks=.55;
  const gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks,gout=goutFor(gpark,ks),target=patientPoint(TX,TY,ks,gpark,gout);
  const Wn=win(fr);
  pic=<g>
   <Item id="s2-room">
    <RoomCameraHero part="floor" y0={Wn.y+Wn.h+40} vx={800} light={S.light}/>
    <At p={[0,380]}><RoomCameraHero part="tile" w={596} h={760} tile={76} light={S.light}/></At>
   </Item>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt([200,720],125,1,'all',{cam,target})}</Item></Item>
   {camera(cam,0,target)}
   <Item id="s2-patient">{caseGroup(TX,TY,ks,gpark,gout)}</Item>
   <rect x={594} y={360} width={10} height={900} fill={P0.ink} opacity={.85}/>
  </g>;
  break;}
 case 'ledger-clock-desk':{
  // B: the same ring drawn as a desk record on a ledger page standing in a holder on the desk, the room's
  // two near cameras lit on the wall above the window.
  need('s2');const Wn=win(fr),L=roomLayout(Wn);
  pic=<g>
   <Item id="s2-room">
    {[L.cams[0],L.cams[1]].map((c,k)=>camera(c,k,[540,900]))}
    <StudyRecordSupport part="desk" y={Wn.y+Wn.h-70} mug={[930,Wn.y+Wn.h-20]}/>
    <path d="M190 1180L160 1230M890 1180L920 1230" stroke={P0.steelDeep} strokeWidth={14} strokeLinecap="round"/>
    <At p={[170,500]}><StudyRecordSupport part="ledger" w={740} h={690} rows={12}/></At>
   </Item>
   <Txt x={260} y={600} s={34} fill={P0.ink}>Room clock record</Txt>
   <Item id="s2-clock"><Item id="s2-markers">{clockAt([540,870],170,S.s2.draw,'all')}</Item></Item>
  </g>;
  break;}
 case 'ledger-marker-row':{
  // B detail: the markers as ledger rows. Each row's small room picture performs its event as the row's
  // teal marker stamps: the patient slides onto the table, the drape lowers, the gurney rolls out.
  need('s2');
  const rows=[0,1,2];
  pic=<g>
   <Item id="s2-room"><At p={[30,300]}><StudyRecordSupport part="ledger" w={1020} h={1500} rows={10}/></At></Item>
   <Txt x={120} y={410} s={36} fill={P0.trim}>Room clock record</Txt>
   <Item id="s2-clock"><At p={[880,410]}><RoomCameraHero part="clock" r={74} draw={1} hand={S.s2.hand} marks={S.marks(0,false)} tags={false}/></At></Item>
   <Item id="s2-markers">{rows.map(k=>{
    const y=520+k*240,m=S.marks(0,false)[k],r=S.R(MARK_EVENTS[k]),done=m.stamp;
    return <g key={k}>
     {r>0&&r<1&&<rect x={70} y={y-20} width={940} height={210} rx={18} fill="#E6F1EF" opacity={f2(bell(r)*.9+.1)}/>}
     <Item id="s2-patient">{rowPicture(k,y+120)}</Item>
     <Txt x={470} y={y+110} s={50} fill={done>0?P0.ink:'#9AA3A6'}>{MARK_LABELS[k]}</Txt>
     <g transform={`translate(910 ${y+90})`} opacity={f2(clamp(done*3))}>
      <g transform={`translate(0 ${f2(-(1-done)*80)})`}><path d="M-16 -40L16 -40L8 20L-8 20Z" fill={P0.teal} stroke={P0.ink} strokeWidth={3}/></g>
     </g>
     {r>0&&r<1&&<circle cx={910} cy={y+70} r={f2(30+40*r)} fill="none" stroke={P0.tealLit} strokeWidth={4} opacity={f2(1-r)}/>}
    </g>;})}</Item>
  </g>;
  break;}

 // ===== s3: the text to the surgeon when the patient is draped =====
 case 'phone-hand-close':{
  // Close: the surgeon's phone in a gloved hand lights on its thread from the suite cameras to the
  // surgeon, and a dashed link draws to it from the wall camera over the next patient on the table.
  need('s3');const cam:CamAt={at:[140,340],s:1.15,mirror:false};
  const ph:Pt=[560,300],sc=1.5,to:Pt=[ph[0]+60*sc,ph[1]+60*sc];
  pic=<g>
   {vignette(270,1000,.5,cam,0)}
   {textLink(lensOf(cam,[270,977]),to,S.s3.link)}
   {phoneAt(ph,sc)}
  </g>;
  break;}
 case 'table-drape-medium':{
  // Medium: the drape lowers with its lopsided fall over the patient on the table; the gloved hand and
  // phone wait at the frame's right edge.
  need('s3');const Wn=win(fr);
  pic=room(Wn,{clock:'none',TX:500,TY:Wn.y+Wn.h-40,ks:1.0,extra:phoneAt([900,880],.5,-8)});break;}
 case 'alert-phone-view':{
  // Detail (A) or close (B): the amber text reading Patient draped slides onto the phone; the draped
  // patient and the wall camera that saw it sit at the left, the link between them lit.
  need('s3');const det=fr==='detail',cam:CamAt={at:[110,360],s:1.0,mirror:false};
  const ph:Pt=det?[470,290]:[500,320],sc=det?1.55:1.45,to:Pt=[ph[0]+60*sc,ph[1]+60*sc];
  pic=<g>
   {vignette(230,1010,.44,cam,0)}
   {textLink(lensOf(cam,[230,990]),to,1)}
   {phoneAt(ph,sc)}
  </g>;
  break;}
 case 'desk-phone-wide':{
  // B wide: the surgeon's phone stands in its dock on the desk under the window beside the room clock
  // record; the gloved hand lifts it a little as it lights and the link draws from the wall camera.
  need('s3');const Wn=win(fr),L=roomLayout(Wn),cam=L.cams[1],ph:Pt=[590,520-22*S.s3.lit];
  pic=<g>
   <Item id="s3-room">{camera(cam,1,[700,700])}</Item>
   <StudyRecordSupport part="desk" y={Wn.y+Wn.h+30} pen={[160,1180]}/>
   <g transform={`translate(90 ${Wn.y+Wn.h+50}) scale(1 .45)`}><StudyRecordSupport part="ledger" w={430} h={360} rows={6}/>
    <At p={[215,210]}><RoomCameraHero part="clock" r={110} draw={1} hand={S.turnoverAngle+12} marks={S.marks(0,true)} tags={false}/></At></g>
   <rect x={600} y={1078} width={270} height={26} rx={8} fill={P0.trim}/>
   {textLink(lensOf(cam,[700,700]),[ph[0]+60*.95,ph[1]+60*.95],S.s3.link)}
   {phoneAt(ph,.95)}
  </g>;
  break;}
 case 'desk-drape-split':{
  // B split: at the left the drape lowers over the patient on the table; at the right the phone waits on
  // the desk under the window.
  need('s3');const Wn=win(fr),cam:CamAt={at:[110,430],s:.9,mirror:false};
  pic=<g>
   <Item id="s3-room"><At p={[0,370]}><RoomCameraHero part="tile" w={540} h={560} tile={70} light={S.light}/></At>
    <rect x={0} y={930} width={540} height={360} fill={P0.floor}/><path d="M0 930H540" stroke={P0.ink} strokeWidth={3}/></Item>
   {vignette(270,980,.62,cam,0,{floor:false})}
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

 // ===== s10: what the study does not show =====
 case 'blank-box-view':{
  // Close (A) or detail (B): beside the turnover marker on the room clock a dashed box draws, asking did
  // turnover speed up; the marker pulses once and the box stays blank. A wall camera's lamp still glows.
  need('s10');const z=fr==='detail'?1.08:1;
  const c:Pt=[330,600],r=190,pin=markAt(r,S.turnoverAngle).pin,box:Pt=[570,480];
  pic=<g transform={`translate(540 660) scale(${z}) translate(-540 -660)`}>
   <Item id="s10-room"><Item id="s10-window"><At p={[60,280]}><RoomCameraHero part="tile" w={940} h={800} tile={88} light={S.light} hole={[560,470,330,250]}/></At></Item></Item>
   <Item id="s10-lamps">{camera({at:[930,330],s:1.1,mirror:true},1,[560,900])}</Item>
   <Item id="s10-clock">{clockAt(c,r,1,'turnover',undefined,1,S.s10.pulse)}</Item>
   <path d={`M${f2(c[0]+pin[0])} ${f2(c[1]+pin[1])}Q${f2(box[0]-40)} ${f2(box[1]+300)} ${box[0]} ${f2(box[1]+BLANK.h*.5)}`} stroke={P0.trim} strokeWidth={4} strokeDasharray="10 9" fill="none" opacity={f2(clamp(S.s10.box*2))}/>
   <Item id="s10-box"><At p={box}><StudyRecordSupport part="blank" draw={S.s10.box} size={.9} pulse={S.s10.pulse}/></At></Item>
  </g>;
  break;}
 case 'room-window-wide':{
  // A wide: back in the room, the empty table on its fresh sheet, the clock with its lit turnover marker
  // and the blank box beside it; the four camera lamps dim.
  need('s10');pic=<Items ids={['s10-window']}>{room(win(fr),{clock:'turnover',turnLit:1,box:1,pulse:S.s10.pulse})}</Items>;break;}
 case 'ledger-room-window':{
  // B wide: the room behind the desk, its clock's turnover marker lit and its lamps dimming; on the
  // ledger page in the foreground the blank box row stays empty.
  need('s10');const Wn=win(fr);
  pic=<Items ids={['s10-window']}>{room(Wn,{clock:'turnover',turnLit:1,extra:<g>
   <StudyRecordSupport part="desk" y={Wn.y+Wn.h+80}/>
   <g transform={`translate(120 ${Wn.y+Wn.h+96}) rotate(-2) scale(1 .62)`}><StudyRecordSupport part="ledger" w={760} h={330} rows={4}/>
    <At p={[300,96]}><Item id="s10-box"><StudyRecordSupport part="blank" draw={1} size={.6} pulse={S.s10.pulse}/></Item></At></g>
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

 /** A ledger row's small picture of its event, using the hero's own table, gurney, patient and drape. */
 function rowPicture(k:number,baseY:number){
  const ks=.34,TX=170,gpark=TX+(TABLE.L+GURNEY.L)/2*ks+16*ks;
  const r=k===0?S.onTable:k===1?S.drape:S.rollOut;
  const q=t<start('s3')?r:1;
  const px=k===0?lerp(gpark,TX,q):k===1?TX:lerp(TX,gpark+60,q);
  const gx=k===2?lerp(gpark,gpark+60,q):gpark;
  return <g data-part="row-picture">
   <At p={[TX,baseY]} s={ks}><RoomCameraHero part="table" sheet={k===2?smooth((q-.45)/.55):0}/></At>
   {(k!==1)&&<At p={[gx,baseY]} s={ks}><RoomCameraHero part="gurney"/></At>}
   {!(k===2&&q>=1)&&<At p={[px,baseY]} s={ks} o={k===2?1-smooth((q-.7)/.3):1}><RoomCameraHero part="patient"/>
    {(k===1||k===2)&&<RoomCameraHero part="drape" drop={k===1?q:1}/>}</At>}
  </g>;
 }
};

const Txt:React.FC<{x:number;y:number;s:number;fill?:string;children:React.ReactNode}>=({x,y,s,fill='#16242A',children})=>
 <text x={x} y={y} fontFamily={FONT.body} fontSize={s} fontWeight={800} fill={fill}>{children}</text>;
