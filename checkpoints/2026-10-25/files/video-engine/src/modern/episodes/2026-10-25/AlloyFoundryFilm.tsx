import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {FoundryArmHero,armPose,planPose,GAP,RIG,CRUCIBLE,TUBE,PLAN,ARM,type ArmPose,type PlanState} from './FoundryArmHero';
import {FoundrySupport,CABINET,CANDIDATE,CARD,PANEL,QUOTE,quoteHeight,FORM,RELEASE,WEEK_W,WEEK_H,LEDGER,SHEET_PLAN} from './FoundrySupport';

/**
 * alloy-foundry-v1: only the melt can answer (2026-10-25, Brazos County, the Post Oak Savannah). Round 2.
 *
 * ONE generic robotic arm on a rail behind a short planned sample line (FoundryArmHero), and ONE alloy
 * sample that the film follows from the recipe tubes to the melt, the clamps, the gauge and the ram. The
 * records around it (FoundrySupport) set up its question and its limits. Every state is a closed function
 * of the film clock and the board's event windows (foundryState and the line performances), so any frame
 * renders alone and the same twice.
 *
 * The one sample: s4 makes it (tubes into the crucible, the crucible deep in the furnace, the sample out of
 * the port) and the arm holds it in the rig as the clamps close. In s5 the arm lets go and parks clear of
 * the rig while the AI panel's screen becomes the computer's prediction gauge over that same clamped,
 * cooling sample: it fills partway, then pointed at the sample it drains, tries and stays empty. s6
 * continues on it: the clamps ratchet down and seat on it as it cools, the ram comes down and loads it, it
 * bends and the needle swings. s9 starts the next candidate in cause order: a new recipe card with different
 * swatches replaces the old one on the panel while the rig draws its clamps up, retracts its ram and sends the
 * bent bar out its rear feed for a mold; only after the card has written does the arm grip the next crucible
 * in the furnace, lift it out and carry it in through the rig's open front, where it tips about its wrist
 * inside the frame's free space and fills the mold. A PLANNED sign hangs over the line in every line scene.
 *
 * Depth, stated because an elevation can't show it: the rig is open front and back. The arm's links reach in
 * through the open front and pass in front of the left column and the left clamp (they cast a soft shadow on
 * the frame), and a tool travelling in or out (LineState.front) is drawn in front of the frame; once at the
 * workpiece the tool, the held crucible or bar, the mold and the ram keep clear of every part of the rig.
 *
 * Treatment A watches the line side on at bench level, the records face on (easel, desk, wall). Treatment
 * B is a different argument: the line is a floor plan on a dark drafting sheet titled Aggie AI Foundry and
 * stamped PLANNED, the arm drawn from above as articulated segments and the sample as a dot then a bar
 * whose route is traced through the stations, with an elevation section inset for what a plan can't show
 * (the ram's stroke, the bend, the pour); B's records are rows entered down one long ruled ledger that the
 * camera scrolls, and in s8 it scrolls back up to the release row to clip on the blank opening date field.
 *
 * Each scene's camera_strategy is executed here as one slow eased move across the scene (a push, a lateral
 * truck, a rise or descent, or on B's plan a slight overhead orbit); shot cameras otherwise hold, except
 * A's card follow in s4 and B's ledger scroll in s8. Colour carries meaning: amber is only the lit tiles,
 * the melt and its light, and the GOAL stamp; a cool blue is only the AI and the computer. Every scene is
 * indoors in a Brazos County lab, so PlaceStage draws the post oak region through the window behind A's
 * wide and medium shots, as a soft wash behind close ones, and plain wall or floor behind the listed wall
 * views and overhead shots. No full-frame background is painted. Disclosed illustration of a planned lab.
 */

type V='a'|'b';
type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const lerpPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
/** A renderer-only setup ease with zero velocity and acceleration at both ends. */
export const ease5=(q:number)=>{const x=clamp(q);return x*x*x*(10+x*(-15+6*x));};
/** A struck or released thing swinging about its pin, tau seconds after the impulse. Pure in tau. */
export function damped(tau:number,amp:number,hz:number,k:number){return tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.1);}
/** A cubic Bezier point. */
export const bez=(a:Pt,b:Pt,c:Pt,d:Pt,u:number):Pt=>{const v=1-u;return [v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]];};
const hash=(i:number,k:number)=>(((i*73+k*151)%1000)+1000)%1000/1000;

// ---- the sample line (line units, the bed's working surface on y 0) --------------------------------
/** The crucible pad's top: the crucible stands this far above the bed surface. */
export const PAD_TOP=4;
export const LINE={x0:-440,x1:440,floor:330,rack:-290,cru:-170,furn:-40,rig:142,panel:330,wireY:-452,reach:110,rigReach:320,postX:-352,
 clipX:-326,cardScale:.74,signX:-80,plates:[-220,236]};
/** The grip points the arm works to. At the rig the arm reaches with its carriage LINE.rigReach to the left,
 * so its elbow sits left of the crosshead and the forearm passes under the resting ram. `park` holds the
 * arm clear of the rig over the furnace; `lift` is over the furnace with the crucible's foot above the port. */
export const STATION={hover:[-290,-150] as Pt,tubes:[-290,TUBE.grip] as Pt,drop:[LINE.cru,-132] as Pt,cru:[LINE.cru,CRUCIBLE.hold-PAD_TOP] as Pt,
 furnIn:[LINE.furn,-122] as Pt,sampleIn:[LINE.furn,-108] as Pt,rig:[LINE.rig,RIG.anvilTop-5] as Pt,park:[-40,-240] as Pt,lift:[LINE.furn,-200] as Pt};
/** s9's pour, defined at the wrist so the crucible turns about the arm's own wrist joint: upright at W0, the
 * wrist easing right to W1 as it tips to POUR.tilt. With the rig's clamps drawn up (RIG.lift) and its ram
 * retracted, the crucible and its whole tilt path stay inside the frame's free space: right of the left
 * column, left of the right column, under the lifted pads and above the mold. The carriage holds still. */
export const POUR={W0:[LINE.rig,-234] as Pt,W1:[LINE.rig+10,-226] as Pt,tilt:45,reach:307,carriage:LINE.rig-307,streamFrom:34};
/** The crucible's foot swings lowest part way through the tip, so the wrist rises a little mid-tip to keep it
 * clear of the mold's rim. */
export const pourGrip=(tilt:number):Pt=>{const u=clamp(tilt/POUR.tilt),a=tilt*Math.PI/180,W0=lerpPt(POUR.W0,POUR.W1,u),W:Pt=[W0[0],W0[1]-8*Math.sin(Math.PI*u)];
 return [W[0]-ARM.grip*Math.sin(a),W[1]+ARM.grip*Math.cos(a)];};
export const poseAt=(P:Pt,tilt=0,reach:number=LINE.reach):ArmPose=>armPose(P[0]-reach,P,tilt);
/** The held crucible's pour lip in line units: the lip tip in crucible units moved into the tool frame
 * (its base CRUCIBLE.hold below the grip) and turned with the tilt. Pure. */
export function crucibleLip(pose:ArmPose):Pt{
 const a=pose.tilt*Math.PI/180,x=CRUCIBLE.top+9,y=-CRUCIBLE.h-9-CRUCIBLE.hold;
 return [pose.P[0]+x*Math.cos(a)-y*Math.sin(a),pose.P[1]+x*Math.sin(a)+y*Math.cos(a)];
}
/** Gravity for the dropped tubes, line units a second squared. */
const G=2600;

type Held='none'|'tubes'|'crucible'|'sample';
type RigState={ram:number;clampP:number;needle:number;sample:{temp:number;bend:number;back?:number}|null;
 mold:{fill:number;glow:number;back?:number}|null;feed:number;ratchet:number};
type PanelState={write:number;glow:number;dim:number;sent:number;next:number;gauge:{show:number;fill:number;search:number}|null};
export type LineState={P:Pt;tilt:number;reach:number;carriage:number|null;gap:number;held:Held;rackTaken:boolean;fallY:number|null;
 /** the tool is travelling through the rig's open front (drawn in front of the frame), not yet at the workpiece */
 front:boolean;
 crucible:{where:'pad'|'held'|'furnace'|'none';fill:number;glow:number;mixed:number};furnace:number;heldTemp:number;rig:RigState;
 stream:number;card:{x:number}|null;panel:PanelState;warm:number;
 /** how far the one sample has travelled: 0 tubes in the rack, 1 in the crucible, 2 in the furnace, 3 on the rig */
 stage:number;
 /** s5: the gauge's aim line to the sample, the some behavior tag, the question mark */
 aim:number;tag:number;tagSwing:number;question:number};
export function linePose(L:LineState):ArmPose{return L.carriage===null?poseAt(L.P,L.tilt,L.reach):armPose(L.carriage,L.P,L.tilt);}

/** A spoken clause's window from board.narration_picture. */
export type ClauseWindow={start:number;end:number};
export function foundryState(W:Record<string,ActionWindow>,t:number){
 const has=(id:string)=>!!W[id];
 const P=(id:string)=>has(id)?actionProgress(W[id],t):0;
 const R=(id:string)=>has(id)?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const sub=(id:string,a:number,b:number)=>has(id)?clamp((R(id)-a)/(b-a)):0;
 /** The event's own declared curve over a fraction of its window. */
 const subE=(id:string,a:number,b:number)=>{if(!has(id))return 0;const w=W[id],d=w.end-w.start;return actionProgress({...w,start:w.start+a*d,end:w.start+b*d},t);};
 const at=(id:string,f:number)=>has(id)?W[id].start+f*(W[id].end-W[id].start):0;
 const after=(id:string)=>has(id)?t-W[id].end:-1;

 // s1: tiles light in order; the mesh weaves; the tag settles while the candidate glows
 const s1={lit:36*P('s1-event-1'),mesh:P('s1-event-2'),tag:P('s1-event-3'),candidate:smooth(sub('s1-event-3',0,.5)),swing:damped(after('s1-event-3'),6,1.1,2.6)};

 // s2: the card stream starts with s2-event-1; the pile reaches the edge and the pencil rolls off in
 // s2-event-2; inside s2-event-3 the hand sorts one card, reaches again and stops, all before n2 ends
 const e23=W['s2-event-3'];
 const s2={streamStart:has('s2-event-1')?W['s2-event-1'].start:0,roll:ease5(sub('s2-event-2',.3,.75)),fall:has('s2-event-2')?t-at('s2-event-2',.75):-1,
  handIn:e23?ease5((t-(e23.start-.85))/.8):0,pinch:ease5(sub('s2-event-3',0,.08)),carry:ease5(sub('s2-event-3',.06,.32)),
  drop:sub('s2-event-3',.32,.38),reach:ease5(sub('s2-event-3',.42,.66)),stop:ease5(sub('s2-event-3',.68,.95))};

 // s3: the card slides in and writes; the dateline stamp; the grant tag; the bay outline and its PLANNED stamp
 const w31=W['s3-event-1'];
 const s3={slide:P('s3-event-1'),write:w31?clamp((t-at('s3-event-1',.3))/(.95*(w31.end-w31.start)+.45)):0,date:stampState(W['s3-event-2'],t),
  grant:P('s3-event-3'),grantSwing:damped(after('s3-event-3'),9,1.2,2.4),bay:smooth(sub('s3-event-4',0,.7)),title:sub('s3-event-4',.4,.78),
  sheet:ease5(sub('s3-event-4',0,.2)),planned:stampState(has('s3-event-4')?{...W['s3-event-4'],start:at('s3-event-4',.66)}:undefined,t)};

 // s5: the quote slides in and writes the name; the gauge fills partway; then it drains and stays empty
 const s5={slide:P('s5-event-1'),name:has('s5-event-1')?clamp((t-at('s5-event-1',.55))/.8):0,
  fill:.4*P('s5-event-2')*(1-ease5(sub('s5-event-3',.05,.32))),tag:subE('s5-event-2',.5,1),tagSwing:damped(after('s5-event-2'),7,1.2,2.6),
  aim:ease5(sub('s5-event-3',0,.3)),search:has('s5-event-3')&&R('s5-event-3')>.32?Math.max(0,Math.sin(Math.PI*sub('s5-event-3',.32,.82)*3))*.9:0,
  question:sub('s5-event-3',.42,.85),hl:sub('s5-event-2',.1,.6),gauge:has('s5-event-2')?ease5((t-(W['s5-event-2'].start-.5))/.45):0};

 // s7: pages flip away; the week strip slides in and fills; the goal tag lands
 const s7={flip:P('s7-event-1'),slide:subE('s7-event-2',0,.45),fill:sub('s7-event-2',.35,1),goal:P('s7-event-3'),goalSwing:damped(after('s7-event-3'),7,1.2,2.6)};
 // s8: the GOAL stamp; the not a result tag; the form appears blank on the release and takes its dash
 const s8={goal:stampState(W['s8-event-1'],t),tag:P('s8-event-2'),tagSwing:damped(after('s8-event-2'),7,1.1,2.4),
  form:ease5(sub('s8-event-3',0,.4)),dash:sub('s8-event-3',.5,.85)};

 return {s1,s2,s3,s5,s7,s8,P,R,sub,subE,at,after,has,t};
}
export type FoundryState=ReturnType<typeof foundryState>;

/** A stamp's choreography around its window: raised and coming in before it, pressing down in the first
 * quarter (contact ease), holding, then lifting away. `lift` 1 is raised, `inked` when the mark is down. */
export const STAMP={press:.26,hold:.2,approach:.6};
export function stampState(win:ActionWindow|undefined,t:number){
 if(!win)return {lift:1,inked:0,come:0,away:0};
 const dur=win.end-win.start,r=(t-win.start)/dur,contact=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
 const come=ease5((t-(win.start-STAMP.approach))/STAMP.approach);
 if(r<0)return {lift:1,inked:0,come,away:0};
 if(r<STAMP.press)return {lift:1-contact(r/STAMP.press),inked:0,come:1,away:0};
 if(r<STAMP.press+STAMP.hold)return {lift:0,inked:1,come:1,away:0};
 const u=(r-STAMP.press-STAMP.hold)/(1-STAMP.press-STAMP.hold);
 return {lift:ease5(u*1.5),inked:1,come:1,away:ease5((u-.3)/.7)};
}

// ---- the line's four performances, one sample through all of them -----------------------------------
const PANEL_IDLE=():PanelState=>({write:1,glow:.18,dim:0,sent:1,next:0,gauge:null});
const baseLine=():LineState=>({P:STATION.hover,tilt:0,reach:LINE.reach,carriage:null,gap:GAP.open,held:'none',rackTaken:true,fallY:null,front:false,
 crucible:{where:'furnace',fill:1,glow:1,mixed:1},furnace:1,heldTemp:.92,rig:{ram:0,clampP:0,needle:0,sample:null,mold:null,feed:0,ratchet:0},
 stream:0,card:{x:LINE.clipX},panel:PANEL_IDLE(),warm:.6,stage:3,aim:0,tag:0,tagSwing:0,question:0});
/** s4: the panel writes and sends; the arm takes the tubes, drops them, sets the crucible deep in the
 * furnace, lifts the sample out and carries it to the rig, where the clamps close on it while it holds. */
export function s4Line(S:FoundryState,t:number):LineState{
 const {has,sub,subE,at}=S,e1='s4-event-1',e2='s4-event-2',e3='s4-event-3',e4='s4-event-4';
 const st:LineState={...baseLine(),rackTaken:false,crucible:{where:'pad',fill:0,glow:0,mixed:0},furnace:0,card:null,stage:0,warm:0,
  panel:{write:S.P(e1),glow:.25+.35*Math.sin(Math.PI*sub(e1,0,1)),dim:0,sent:sub(e1,.62,.95),next:0,gauge:null}};
 if(!has(e2)||!has(e3)||!has(e4))return st;
 const g2=at(e2,0);
 // the printed copy rides the ticket wire from behind the panel to the rack's clip, one rest to rest stroke
 const c0=at(e1,.62),c1=g2;
 if(t>=c0)st.card={x:lerp(LINE.panel,LINE.clipX,ease5((t-c0)/(c1-c0)))};
 // setup: once the card is on its way the arm lowers onto the recipe tubes and closes on them
 const lower=ease5((t-(g2-1.15))/.7),close=ease5((t-(g2-.42))/.26);
 st.P=lerpPt(STATION.hover,STATION.tubes,lower);st.gap=lerp(GAP.open,GAP.tubes,close);
 if(close>.5){st.held='tubes';st.rackTaken=true;}
 // s4-event-2: lift the tubes clear, ride to the crucible and open over it; they fall in and the arm comes down
 if(t>=g2){
  st.P=bez(STATION.tubes,[-290,-150],[-210,-142],STATION.drop,subE(e2,0,.55));
  const open=ease5(sub(e2,.56,.64)),release=at(e2,.57);
  st.gap=lerp(GAP.tubes,GAP.open,open);
  if(t>=release){st.held='none';st.fallY=.5*G*(t-release)*(t-release);}
  st.crucible.fill=ease5(sub(e2,.76,.95));st.crucible.mixed=sub(e2,.9,1);
  if(st.fallY!==null&&st.fallY>140)st.fallY=null;
  st.P=lerpPt(st.P,STATION.cru,ease5(sub(e2,.7,1)));
  st.stage=ease5(sub(e2,.55,.9));
 }
 // s4-event-3: grip the crucible, carry it over and deep into the furnace, let go; the glow rises
 if(t>=at(e3,0)){
  st.fallY=null;
  const grip=ease5(sub(e3,0,.1)),carry=subE(e3,.1,.84),rel=ease5(sub(e3,.84,.92));
  st.P=STATION.cru;st.gap=lerp(GAP.open,GAP.crucible,grip);
  if(grip>.5){st.held='crucible';st.crucible.where='held';}
  // up off the pad, over, and straight down through the furnace's port
  if(carry>0)st.P=bez(STATION.cru,[LINE.cru,-250],[LINE.furn,-250],STATION.furnIn,carry);
  // the carriage eases left under the high arc and back, so the arm stays open rather than folding up
  st.reach=LINE.reach+80*Math.sin(Math.PI*carry);
  if(rel>0)st.gap=lerp(GAP.crucible,GAP.port,rel);
  if(rel>.5){st.held='none';st.crucible.where='furnace';}
  st.furnace=ease5(sub(e3,.7,1));st.crucible.glow=st.furnace;
  if(rel>0)st.P=lerpPt(st.P,STATION.sampleIn,ease5(sub(e3,.9,1)));
  st.stage=1+carry;
 }
 // s4-event-4: close on the sample in the port, lift it out and carry it to the rig, the arm extending as the
 // carriage holds so its elbow ends left of the crosshead; the clamps close while the arm still holds it
 if(t>=at(e4,0)){
  const grip=ease5(sub(e4,0,.08)),carry=subE(e4,.08,.84),clampP=ease5(sub(e4,.84,1));
  st.P=STATION.sampleIn;st.gap=lerp(GAP.port,GAP.sample,grip);st.heldTemp=.92;
  if(grip>.5)st.held='sample';
  // straight up out of the port, then across and in through the rig's open front
  if(carry>0)st.P=bez(STATION.sampleIn,[LINE.furn,-230],[LINE.rig-60,-125],STATION.rig,carry);
  st.reach=lerp(LINE.reach,LINE.rigReach,carry);
  // carried in through the rig's open front, it reaches the workpiece plane as the carry ends
  st.front=carry>0&&carry<1;
  st.rig.clampP=clampP;
  // once the clamps have it the rig holds the bar; the gripper stays closed on it until s5 lets go
  if(clampP>.5){st.rig.sample={temp:.92,bend:0};st.held='none';}
  st.stage=2+carry;
 }
 st.warm=.8*st.furnace;
 return st;
}
/** s5: the arm lets go of the clamped sample and parks clear of the rig; the AI panel's screen becomes the
 * computer's prediction gauge over that same sample, which cools from bright amber to a dull glow. */
export function s5Line(S:FoundryState,t:number,start:number,dur:number):LineState{
 const st=baseLine(),u=clamp((t-start)/dur),s5=S.s5;
 const free=ease5((t-start-.05)/.18),away=ease5((t-start-.18)/1.25);
 // the gripper eases just wide of the bar, inside the clamp pads, then backs out through the open front and
 // opens fully once clear
 st.gap=lerp(lerp(GAP.sample,GAP.release,free),GAP.open,ease5((away-.45)/.4));st.held='none';st.front=away>0;
 st.P=bez(STATION.rig,[60,-108],[-40,-150],STATION.park,away);st.reach=lerp(LINE.rigReach,LINE.reach,away);
 st.rig={...st.rig,clampP:1,sample:{temp:lerp(.92,.45,u),bend:0}};
 st.panel={...PANEL_IDLE(),gauge:{show:s5.gauge,fill:s5.fill,search:s5.search}};
 st.aim=s5.aim;st.tag=s5.tag;st.tagSwing=s5.tagSwing;st.question=s5.question;st.warm=.4;
 return st;
}
/** s6: the same clamped sample cools to gray with the arm parked clear; the ram comes down and loads it; it
 * bends and the needle swings. Nothing is lifted from the furnace again. */
export function s6Line(S:FoundryState,t:number,start:number):LineState{
 const {has,sub,subE,at,P}=S,e1='s6-event-1',e2='s6-event-2',e3='s6-event-3';
 const st:LineState={...baseLine(),P:STATION.park,rig:{ram:0,clampP:1,needle:0,sample:{temp:.45,bend:0},mold:null,feed:0,ratchet:0},warm:.3};
 // s5's question mark dissolves as the scene opens
 st.question=1-ease5((t-start)/.6);
 if(!has(e1)||!has(e2)||!has(e3))return st;
 // s6-event-1: the clamps ratchet down three clicks and seat on the cooling bar, a tooth of the wheel a click
 const clicks=[sub(e1,0,.22),sub(e1,.34,.56),sub(e1,.68,.9)].map(ease5),seat=(clicks[0]+clicks[1]+clicks[2])/3;
 const cool=lerp(.45,.1,P(e1));
 const load=P(e2),press=subE(e3,0,1),ram=load+.85*press,bend=clamp((ram-1)/.85);
 st.rig={...st.rig,clampP:lerp(1,RIG.seat,seat),ratchet:clicks[0]+clicks[1]+clicks[2],ram,sample:{temp:cool,bend},
  needle:138*bend+damped(t-at(e3,0),10,2.2,3.4)+damped(S.after(e3),9,1.5,2.8)};
 return st;
}
/** s9: a new recipe card replaces the old one. Only then does the arm lift the next candidate's crucible out
 * of the furnace and carry it into the rig through its open front, where the clamps have drawn up, the ram
 * has retracted and the rear feed has taken the bent bar out the back and brought a mold in. The arm tips the
 * crucible about its wrist and fills the mold, then sets it upright while the card dims and the full mold
 * holds its glow. */
export function s9Line(S:FoundryState,t:number):LineState{
 const {has,sub,subE,at}=S,e1='s9-event-1',e2='s9-event-2',e3='s9-event-3';
 const st:LineState={...baseLine(),P:STATION.park,gap:GAP.port,held:'none',
  crucible:{where:'furnace',fill:1,glow:1,mixed:1},furnace:1,heldTemp:1,warm:.5,
  rig:{ram:0,clampP:RIG.seat,needle:0,sample:{temp:.1,bend:1},mold:null,feed:0,ratchet:3},stage:0,
  panel:{write:1,glow:.18,dim:0,sent:1,next:0,gauge:null}};
 if(!has(e1)||!has(e2)||!has(e3))return st;
 // the next candidate's card writes in as the old one slides off, and glows once
 st.panel.next=sub(e1,0,.7);
 st.panel.glow=.3*smooth(sub(e1,.5,.8))+.7*Math.sin(Math.PI*sub(e1,.4,1));
 // the rig makes room: the clamps draw up toward the crosshead and the ram retracts, the rear feed opens,
 // the bent bar slides out the back and drops away, and a mold rises from the feed and slides onto the anvils
 const up=ease5(sub(e1,.04,.3));
 st.rig.clampP=lerp(RIG.seat,RIG.lift,up);st.rig.ram=-.35*up;st.rig.feed=ease5(sub(e1,0,.15));
 const out=ease5(sub(e1,.3,.5))+ease5(sub(e1,.5,.62));
 st.rig.sample=out<2?{temp:.1,bend:1,back:out}:null;
 const inn=ease5(sub(e1,.62,.74))+ease5(sub(e1,.74,.96));
 if(t>=at(e1,.62))st.rig.mold={fill:0,glow:0,back:2-inn};
 // the arm goes down to the furnace while the card writes, and grips the crucible only once it has written
 const down=ease5((t-at(e1,.2))/.55),grip=ease5((t-at(e1,.7))/.12),g1=at(e1,.7)+.12;
 st.P=lerpPt(STATION.park,STATION.furnIn,down);
 st.gap=lerp(GAP.port,GAP.crucible,grip);
 if(grip>.5){st.held='crucible';st.crucible.where='held';st.furnace=.75;}
 // lift it clear of the port, then carry it over the furnace's near wall and in through the rig's open front
 const lift=ease5((t-g1)/.28),carry=ease5((t-g1-.28)/.61);
 if(lift>0)st.P=lerpPt(STATION.furnIn,STATION.lift,lift);
 if(carry>0)st.P=bez(STATION.lift,[LINE.furn+90,-200],[LINE.rig-60,-180],pourGrip(0),carry);
 // the carriage runs left as the arm reaches out, so the arm extends and its elbow stays low, under the
 // crosshead's level; from the pour on it holds still
 st.reach=lerp(LINE.reach,POUR.reach,ease5((t-g1)/(.28+.61*.85)));
 if(carry>=1)st.carriage=POUR.carriage;
 st.front=carry>0&&carry<1;
 // s9-event-2: tip about the wrist into the mold; s9-event-3: back upright
 const tip=POUR.tilt*subE(e2,0,.5),back=POUR.tilt*subE(e3,.1,.9);
 st.tilt=Math.max(0,tip-back);
 if(carry>=1)st.P=pourGrip(st.tilt);
 // the stream runs once the lip is over the cavity and thins out as the fill completes
 st.stream=t>=at(e2,0)?clamp((st.tilt-POUR.streamFrom)/10)*(1-smooth(sub(e2,.9,1))):0;
 const fill=ease5(sub(e2,.35,1));
 if(st.rig.mold)st.rig.mold={...st.rig.mold,fill,glow:fill>0?Math.max(fill,.85):0};
 st.crucible.fill=1-.85*fill;
 st.warm=st.held==='crucible'?.9:.5;
 st.panel.dim=S.P(e3);
 st.panel.glow*=1-.85*st.panel.dim;
 st.stage=fill;
 return st;
}

// ---- cameras ---------------------------------------------------------------------------------------
/** Cam is the composite framing a view wants: world point f lands on screen point a at scale s. */
export type Cam={f:Pt;s:number;a:Pt};
type Framing='wide'|'split'|'medium'|'close'|'detail'|'overhead';
export const camPoint=(c:Cam,p:Pt):Pt=>[c.a[0]+c.s*(p[0]-c.f[0]),c.a[1]+c.s*(p[1]-c.f[1])];
const camT=(c:Cam)=>`translate(${f2(c.a[0])} ${f2(c.a[1])}) scale(${c.s.toFixed(4)}) translate(${f2(-c.f[0])} ${f2(-c.f[1])})`;
/** A's side-on line cameras, by view then framing. */
export const LINE_CAM:Record<string,Partial<Record<Framing,Cam>>>={
 'ai-panel':{medium:{f:[250,-260],s:1.6,a:[540,720]}},
 'arm-vials':{close:{f:[-230,-150],s:1.55,a:[450,860]}},
 'furnace-glow':{medium:{f:[-80,-170],s:1.3,a:[460,860]}},
 'rig-clamp':{detail:{f:[90,-150],s:1.7,a:[520,950]}},
 'gauge-fill':{close:{f:[250,-200],s:1.75,a:[500,780]}},
 'unknown-sample':{detail:{f:[263,-266],s:2.3,a:[467,801]}},
 'arm-lift':{wide:{f:[10,-200],s:1.02,a:[460,830]}},
 'rig-load':{close:{f:[60,-180],s:1.6,a:[470,880]}},
 'needle-detail':{detail:{f:[142,-220],s:2.8,a:[470,800]}},
 'ai-card':{close:{f:[165,-266],s:1.6,a:[467,801]}},
 'melt-pour':{wide:{f:[90,-220],s:1.12,a:[450,840]}},
 'melt-hold':{detail:{f:[220,-200],s:2.2,a:[430,890]}}};
export function lineCam(view:string,fr:Framing):Cam{const c=LINE_CAM[view]?.[fr];if(!c)throw new Error('No line camera for '+view+' at '+fr);return c;}
/** A's opening s4 shot follows the sent card: as the printed copy rides the wire from the panel to the
 * rack, the camera eases back and left on the card's own rest to rest window, so the arm waiting at the
 * rack is in frame before its clause is heard. Every other view holds. */
export const AI_PANEL_FOLLOW:Cam={f:[40,-230],s:1.25,a:[540,760]};
export function lineCamAt(view:string,fr:Framing,S:FoundryState):Cam{
 const c=lineCam(view,fr);
 if(view!=='ai-panel'||!S.has('s4-event-1')||!S.has('s4-event-2'))return c;
 const c0=S.at('s4-event-1',.62),c1=S.at('s4-event-2',0),p=ease5((S.t-c0)/(c1-c0)),e=AI_PANEL_FOLLOW;
 return {f:lerpPt(c.f,e.f,p),s:lerp(c.s,e.s,p),a:lerpPt(c.a,e.a,p)};
}
/** B's plan cameras (plan units), by view. */
export const PLAN_CAM:Record<string,Cam>={'plan-outline':{f:[-10,0],s:.85,a:[470,800]},'plan-line':{f:[-10,0],s:.85,a:[470,800]},
 'arm-vials':{f:[-230,-20],s:1.55,a:[470,820]},'furnace-glow':{f:[-70,-20],s:1.6,a:[470,820]},'clamp-plan':{f:[130,60],s:1.25,a:[470,800]},
 'gauge-plan':{f:[230,-10],s:1.55,a:[470,780]},'unknown-sample':{f:[200,0],s:1.75,a:[470,800]},
 'sample-glow':{f:[60,40],s:1.4,a:[470,800]},'rig-load':{f:[120,110],s:1.3,a:[470,800]},'section-detail':{f:[130,210],s:2.4,a:[467,820]},
 'plan-card':{f:[210,-10],s:1.45,a:[470,780]},'melt-pour':{f:[40,70],s:1.05,a:[470,780]},'plan-hold':{f:[-10,0],s:.85,a:[470,800]}};
/** The scene's camera_strategy, executed as one slow eased move across the scene about the frame's centre:
 * a push in, a lateral truck, a rise, a descent, or on B's plan a slight overhead orbit. */
export function strategyMove(strategy:string|undefined,u:number):string{
 const e=smooth(u);
 switch(strategy){
 case 'dollyThrough':{const s=1+.045*e;return `translate(540 900) scale(${s.toFixed(4)}) translate(-540 -900)`;}
 case 'truckAcross':return `translate(${f2(24-48*e)} 0)`;
 case 'riseWith':return `translate(0 ${f2(-16+32*e)})`;
 case 'craneDown':return `translate(0 ${f2(18-36*e)})`;
 case 'orbitReveal':return `rotate(${f2(-1.2+2.4*e)} 540 900)`;
 default:return '';
 }
}
export const STRATEGY_REACH={dollyThrough:.045,truckAcross:24,riseWith:16,craneDown:18,orbitReveal:1.2};

// ---- A's s1 and s2: the cabinet, the stream and the pile ---------------------------------------------
/** Where the cabinet stands in each A s1 composition (screen pixels): centre and scale. */
export const CAB_AT:Record<string,{c:Pt;s:number}>={'wall-display:medium':{c:[468,760],s:1.08},'mesh-wide:wide':{c:[440,700],s:.72}};
/** The trillion tag: its hole sits a little right of and below the candidate point (cabinet units). */
export const COUNT_TAG={lines:['roughly a','trillion ways'],size:36,off:[44,64] as Pt,drop:240};
/** s2's bench world (A): the bench, the tray, the edge, the floor, and the cabinet whose mesh the cards
 * stream out of. The stream's schedule and classes are shared with B's ledger. */
export const BENCH2={x0:-330,edge:260,floor:330,tray:-230,trayW:150,cab:[-250,-560] as Pt,cabS:.62,pencil:196,card:.72,N:48,flight:.55,span:1.89,base:-20};
export const emit2:Pt=[BENCH2.cab[0]+BENCH2.cabS*CANDIDATE[0],BENCH2.cab[1]+BENCH2.cabS*CANDIDATE[1]];
/** Which way each card of the stream goes: the first few to the pile's centre, the next ones spreading right
 * over the edge during s2-event-2, and from card 27 every odd card onto the tray, so the tray is buried
 * inside clause n2. Fixed integer rules, never random. */
export type CardClass='pile'|'right'|'tray'|'late';
export const CARD_CLASS:CardClass[]=Array.from({length:BENCH2.N},(_,i)=>i<6?'pile':i<27?(hash(i,1)<.3?'pile':'right'):(i%2?'tray':'late'));
export const TRAY_INDEX:number[]=CARD_CLASS.map((c,i)=>c==='tray'?CARD_CLASS.slice(0,i).filter(x=>x==='tray').length:-1);
export const cardSpawn=(i:number,start:number)=>start+(i/BENCH2.N)*BENCH2.span;
/** One recipe card of A's stream: where it is at time t (or null before it leaves the mesh). Pure. */
export function streamCard(i:number,t:number,start:number){
 const T=cardSpawn(i,start),u=(t-T)/BENCH2.flight;
 if(u<0)return null;
 const cls=CARD_CLASS[i],h=hash(i,1),h2=hash(i,2);
 let x:number,y:number,rot=(h2-.5)*50;
 if(cls==='tray'){x=BENCH2.tray+(h*2-1)*42;y=-30-3.4*TRAY_INDEX[i];rot=(h2-.5)*40;}
 else{
  x=cls==='pile'?BENCH2.base+(h*2-1)*60:cls==='right'?BENCH2.base+60+Math.pow((i-6)/20,.7)*360*(.55+.45*h2):BENCH2.base+60+h*300;
  y=-6-40*Math.min(1,i/30)*Math.exp(-Math.pow((x-BENCH2.base)/170,2));
 }
 let land:Pt=[x,y];
 if(cls!=='tray'&&x>BENCH2.edge-14){land=[BENCH2.edge+10+(x-BENCH2.edge)*.3,30+(x-BENCH2.edge)*.8];rot=58+hash(i,3)*30;}
 if(cls!=='tray'&&x>BENCH2.edge+60){land=[x-10,BENCH2.floor-6];rot=hash(i,4)*30-15;}
 if(u>=1)return {p:land,rot,flying:false};
 const q=u,arc=150+hash(i,5)*80;
 const p:Pt=[lerp(emit2[0],land[0],q),lerp(emit2[1],land[1],q)-arc*4*q*(1-q)];
 return {p,rot:lerp((hash(i,6)-.5)*120,rot,q)+200*q*(1-q)*(hash(i,7)-.5),flying:true};
}
export const S2_CAM:Record<string,Cam>={'recipe-stream:close':{f:[-40,-240],s:1.25,a:[470,840]},'desk-pile:medium':{f:[-60,-120],s:1.35,a:[450,920]}};
/** The hand's pinch point through s2-event-3 (bench units): in from the left to the pile over .8 s, the card carried
 * to the tray, a second reach, then it stops short and stays stopped. */
export function handAt(st:FoundryState['s2'],o?:{off:Pt;pick:Pt;tray:Pt;again:Pt;stopAt:Pt}):Pt{
 const w=o??{off:[-420,-120],pick:[-130,-44],tray:[BENCH2.tray,-62],again:[-170,-70],stopAt:[-205,-150]};
 let p=lerpPt(w.off,w.pick,st.handIn);
 p=lerpPt(p,w.tray,st.carry);
 p=lerpPt(p,w.again,st.reach);
 return lerpPt(p,w.stopAt,st.stop);
}

// ---- A's s3: the desk ----------------------------------------------------------------------------------
export const DESK={depth:340,x0:-470,x1:550,fy:.74,card:[-400,-330] as Pt,bay:[72,-335] as Pt,bayS:.9,dateMark:[330,62] as Pt,grantClip:[442,214] as Pt,grantHole:[178,250] as Pt,planned:[118,74] as Pt};
export const S3_CAM:Record<string,Cam>={'release-desk:medium':{f:[-180,-140],s:1.4,a:[470,780]},
 'stamp-close:close':{f:[-180,-160],s:1.75,a:[470,800]},'bay-blueprint:wide':{f:[40,-130],s:.86,a:[470,860]}};

// ---- A's s7 and s8: the planning sheet on the easel ------------------------------------------------------
export const SHEET={w:860,h:560,cal:[-195,-238] as Pt,calS:.9,week:[-290,120] as Pt,goalHole:[120,236] as Pt,stamp:[0,170] as Pt,
 resultHole:[-158,268] as Pt,form:[14,-170] as Pt,formS:.82,release:[170,-276] as Pt,releaseS:.6,easelFloor:600};
export const S78_CAM:Record<string,Cam>={
 'calendar-months:medium':{f:[0,-10],s:1,a:[470,770]},'week-strip:detail':{f:[0,170],s:1.42,a:[470,760]},'goal-tag:close':{f:[10,190],s:1.25,a:[470,760]},
 'goal-stamp:medium':{f:[0,30],s:.95,a:[470,740]},'unmeasured-tag:close':{f:[0,210],s:1.35,a:[470,760]},'date-field:detail':{f:[209,-142],s:1.9,a:[470,760]}};

// ---- B's ledger spine (ledger units: the page's top left at the origin) ------------------------------------
/** Where each scene's records are entered down B's ledger: the chart at its head (s1), the card rows and the
 * filing pocket (s2), the release row (s3), the quote row (s5), the calendar and the week row (s7, s8). */
export const LEDGER_AT={head:[430,280] as Pt,headS:.94,rowsY:640,rowH:84,rowX:190,colW:212,rows:7,pocket:[14,878] as Pt,pocketW:92,pocketH:98,
 pencil:[690,700] as Pt,release:[150,1312] as Pt,releaseS:.78,quote:[130,1716] as Pt,quoteS:.8,cal:[300,2120] as Pt,calS:.62,week:[140,2470] as Pt,weekS:.96,
 goalHole:[560,2598] as Pt,resultHole:[250,2640] as Pt,form:[372,1420] as Pt,formS:.64};
export const ledgerEmit:Pt=[LEDGER_AT.head[0]+LEDGER_AT.headS*CANDIDATE[0],LEDGER_AT.head[1]+LEDGER_AT.headS*CANDIDATE[1]];
/** B's row slot for each card that is entered (the ones that don't spill over the page edge or into the
 * pocket): three to a row down the ruled lines. Fixed integer bookkeeping from the same stream classes. */
export const LEDGER_SLOT:number[]=(()=>{let j=0;return CARD_CLASS.map((c,i)=>{
 if(c==='tray')return -1;
 const x=c==='pile'?BENCH2.base+(hash(i,1)*2-1)*60:c==='right'?BENCH2.base+60+Math.pow((i-6)/20,.7)*360*(.55+.45*hash(i,2)):BENCH2.base+60+hash(i,1)*300;
 if(x>BENCH2.edge-14||j>=LEDGER_AT.rows*3)return -2;
 return j++;});})();
export function ledgerCard(i:number,t:number,start:number){
 const T=cardSpawn(i,start),u=(t-T)/BENCH2.flight;
 if(u<0)return null;
 const L=LEDGER_AT,slot=LEDGER_SLOT[i],h=hash(i,3);
 let land:Pt,rot:number;
 if(slot>=0){land=[L.rowX+(slot%3)*L.colW+(h-.5)*16,L.rowsY+Math.floor(slot/3)*L.rowH+(hash(i,4)-.5)*10];rot=(hash(i,5)-.5)*8;}
 else if(slot===-1){land=[L.pocket[0]+L.pocketW/2+(h-.5)*20,L.pocket[1]+48-3.2*TRAY_INDEX[i]];rot=(h-.5)*24;}
 else{land=[LEDGER.w+30+h*40,L.rowsY+60+hash(i,6)*480];rot=68+hash(i,7)*24;}
 if(u>=1)return {p:land,rot,flying:false};
 const q=u;
 return {p:[lerp(ledgerEmit[0],land[0],q),lerp(ledgerEmit[1],land[1],q)-120*4*q*(1-q)] as Pt,rot:lerp((hash(i,8)-.5)*90,rot,q),flying:true};
}
/** B's ledger cameras (ledger units). Close and detail ones keep a margin of wash beside the page. */
export const LEDGER_CAM:Record<string,Cam>={'ledger-head':{f:[420,300],s:1,a:[470,780]},'wall-display':{f:[430,300],s:1.12,a:[470,760]},
 'ledger-stream':{f:[420,780],s:.9,a:[470,800]},'ledger-sort':{f:[250,930],s:1.05,a:[460,820]},
 'release-desk':{f:[330,1430],s:1.12,a:[470,800]},'grant-row':{f:[360,1470],s:1.18,a:[520,820]},
 'quote-row':{f:[346,1850],s:1.1,a:[470,800]},'month-rows':{f:[420,2280],s:.95,a:[470,780]},'week-row':{f:[350,2520],s:1.1,a:[470,800]},
 'goal-tag':{f:[560,2560],s:1.25,a:[560,800]},'goal-row':{f:[390,2520],s:1.1,a:[520,800]},'result-row':{f:[300,2600],s:1.25,a:[480,820]},
 'date-row':{f:[420,1460],s:.95,a:[470,800]}};
/** s8's date row scrolls back up the ledger from the calendar row to the release row as the field clips on. */
export const DATE_ROW_FROM:Pt=[420,2100];
export const DATE_ROW_SCROLL=.9;

/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${r.toFixed(3)}) scale(${s.toFixed(4)})`} opacity={o}>{children}</g>;
const Str:React.FC<{a:Pt;b:Pt;w?:number;color?:string;o?:number}>=({a,b,w=2.4,color='#3A4147',o=1})=>
 <path d={`M${f2(a[0])} ${f2(a[1])}Q${f2((a[0]+b[0])/2)} ${f2((a[1]+b[1])/2+12)} ${f2(b[0])} ${f2(b[1])}`} stroke={color} strokeWidth={w} fill="none" opacity={o}/>;

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}
/** The chip's box for a disclosure string, shared with the frame-edge check. */
export function disclosureBox(text:string):[number,number,number,number]{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}

const SCENE_ORDER=['s1','s2','s3','s4','s5','s6','s7','s8','s9'];
export const AlloyFoundryFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Alloy foundry film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Alloy foundry film must read the single film frame clock');
 const v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const S=foundryState(W,t);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing as Framing,key=view+':'+fr;
 const flat=ad.flat_shots?.[sid];
 const need=(s:string)=>{if(sid!==s)throw new Error(view+' draws '+s+' only');};
 const cam=(table:Record<string,Cam>,k:string)=>{const c=table[k];if(!c)throw new Error('No camera for '+k);return c;};
 const sceneOf=(id:string)=>board.scenes.find(s=>s.id===id);
 const s5scene=sceneOf('s5');
 const lineFor=(sc:'s4'|'s5'|'s6'|'s9')=>sc==='s4'?s4Line(S,t):sc==='s5'?s5Line(S,t,s5scene?.start_s??0,s5scene?.duration_s??1):sc==='s6'?s6Line(S,t,sceneOf('s6')?.start_s??0):s9Line(S,t);

 /** PLANNED plates at LINE.plates: on A's bed front face (y 34) and in B's section inset, and laid on B's
  * floor plan in front of the bed (y 86). */
 const planPlates=(y:number)=><g data-part="planned-plates">{LINE.plates.map((x,k)=><g key={x} transform={`translate(${x} ${y}) rotate(${k?-1.2:.8})`}>
  <rect x={-62} y={-17} width={124} height={34} rx={4} fill="#F7F1E3" stroke="#262C31" strokeWidth={2.2}/>
  <circle cx={-54} cy={0} r={2.6} fill="#5C646A"/><circle cx={54} cy={0} r={2.6} fill="#5C646A"/>
  <text x={0} y={8} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={22} fill="#A13F2F" letterSpacing={2}>PLANNED</text></g>)}</g>;
 /** The arm's soft shadow on the rig frame only (key light upper left): the depth cue that the arm's links,
  * which reach in through the rig's open front, pass in front of the left column and clamp, not through them. */
 const armShadow=(L:LineState,key:string)=>{const p=linePose(L);
  return <g data-part="arm-shadow-on-rig">
   <defs><clipPath id={'af1025-shadow-'+key}><rect x={LINE.rig+RIG.crossL} y={RIG.crossY-4} width={RIG.half+6-RIG.crossL} height={-RIG.crossY+4-16}/></clipPath></defs>
   <path clipPath={`url(#af1025-shadow-${key})`} d={`M${f2(p.S[0]+12)} ${f2(p.S[1]+16)}L${f2(p.E[0]+12)} ${f2(p.E[1]+16)}L${f2(p.W[0]+12)} ${f2(p.W[1]+16)}`}
    stroke="#0B0F12" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={.2}/></g>;};
 // ---- A: the sample line side on, drawn from one LineState in line units ----
 const heldNode=(L:LineState,tag:string)=>L.held==='tubes'?<FoundryArmHero part="tubes"/>:
  L.held==='crucible'?<g transform={`translate(0 ${-CRUCIBLE.hold})`}><FoundryArmHero part="crucible" fill={L.crucible.fill} glow={L.crucible.glow} mixed={L.crucible.mixed}/></g>:
  L.held==='sample'?<Item id={tag+'-sample'}><FoundryArmHero part="sample" temp={L.heldTemp}/></Item>:undefined;
 const rigNode=(L:LineState)=><FoundryArmHero part="rig" ram={L.rig.ram} clampP={L.rig.clampP} needle={L.rig.needle} sample={L.rig.sample} mold={L.rig.mold}
  warm={L.rig.mold?.glow??(L.rig.sample?L.rig.sample.temp*.6:0)} feed={L.rig.feed} ratchet={L.rig.ratchet}/>;
 const lineWorld=(L:LineState,tag:'s4'|'s5'|'s6'|'s9',c:Cam)=>{
  const pose=linePose(L),lip=crucibleLip(pose);
  const rigId=tag==='s4'?'s4-test':tag==='s5'?'s5-sample':tag==='s6'?'s6-rig':'s9-test';
  const panelId=tag==='s4'?'s4-ai':tag==='s5'?'s5-gauge':tag==='s9'?'s9-ai':'s6-panel';
  const gx=LINE.panel-PANEL.w/2+16+.4*(PANEL.w-32);
  return <g transform={camT(c)}>
   <Item id={tag+'-setting'}>
    <FoundrySupport part="floor" x0={-2400} x1={2400} y={LINE.floor} to={LINE.floor+2400}/>
    {/* the ticket wire from the panel to the rack's post, and the rack post with its clip */}
    <path d={`M${LINE.postX} ${LINE.wireY}L${LINE.panel} ${LINE.wireY+4}`} stroke="#3A4147" strokeWidth={2.4}/>
    <rect x={LINE.postX-5} y={LINE.wireY-6} width={10} height={-LINE.wireY-28} rx={3} fill="#5C646A" stroke="#262C31" strokeWidth={1.6}/>
    <FoundryArmHero part="bed" x0={LINE.x0} x1={LINE.x1} floor={LINE.floor} glowX={LINE.furn} glow={L.furnace*.8}/>
   </Item>
   <Item id={tag==='s4'?'s4-vials':tag+'-rack'}><At p={[LINE.rack,0]}><FoundryArmHero part="rack" taken={L.rackTaken}/></At>
    <rect x={LINE.cru-44} y={-6} width={88} height={8} rx={2} fill="#7B6E62" stroke="#262C31" strokeWidth={1.4}/>
    {L.crucible.where==='pad'&&<At p={[LINE.cru,-PAD_TOP]}><FoundryArmHero part="crucible" fill={L.crucible.fill} glow={L.crucible.glow} mixed={L.crucible.mixed}/></At>}</Item>
   <Item id={tag==='s4'?'s4-furnace':tag+'-furnace'}><At p={[LINE.furn,0]}><FoundryArmHero part="furnaceBack" glow={L.furnace} t={t}/></At>
    {L.crucible.where==='furnace'&&<At p={[LINE.furn,STATION.furnIn[1]-CRUCIBLE.hold]}><FoundryArmHero part="crucible" fill={1} glow={L.crucible.glow} mixed={1}/></At>}</Item>
   <Item id={rigId}><At p={[LINE.rig,0]}>{tag==='s9'?<Item id="s9-melt">{rigNode(L)}</Item>:tag==='s6'?<Item id="s6-sample">{rigNode(L)}</Item>:rigNode(L)}</At></Item>
   {L.card&&<Item id={tag+'-card'}><At p={[L.card.x,LINE.wireY]}>
    <path d="M0 0V12" stroke="#262C31" strokeWidth={2}/><rect x={-7} y={-5} width={14} height={14} rx={3} fill="#5C646A"/>
    <At p={[0,12+CARD.h*LINE.cardScale/2]} r={L.card.x<LINE.clipX+4?-3:-1}><FoundrySupport part="card" w={CARD.w*LINE.cardScale} ai/></At></At></Item>}
   <Item id={panelId}><At p={[LINE.panel,0]}><FoundrySupport part="aiPanel" write={L.panel.write} glow={L.panel.glow} dim={L.panel.dim} sent={L.panel.sent}
    next={L.panel.next} gauge={L.panel.gauge}/></At></Item>
   {/* s5: the gauge's aim at the clamped sample, the some behavior tag, and the question mark */}
   {tag==='s5'&&L.aim>0&&<path d={`M${f2(LINE.panel-40)} ${PANEL.cy+60}L${f2(lerp(LINE.panel-40,LINE.rig+30,L.aim))} ${f2(lerp(PANEL.cy+60,-112,L.aim))}`} stroke="#9BD0DF" strokeWidth={3} strokeDasharray="8 7"/>}
   {tag==='s5'&&L.tag>0&&<Item id="s5-gauge-tag"><g opacity={f2(clamp(L.tag*4))}><Str a={[gx,PANEL.cy+PANEL.h/2+20]} b={[gx-70,PANEL.cy+PANEL.h/2+70-50*(1-L.tag)]} w={2.2}/>
    <At p={[gx-70,PANEL.cy+PANEL.h/2+70-50*(1-L.tag)]}><FoundrySupport part="tag" lines={['some behavior']} size={16} tone="ai" swing={10*(1-L.tag)+L.tagSwing}/></At></g></Item>}
   {(tag==='s5'||tag==='s6')&&L.question>0&&<At p={[LINE.rig+70,-160]}><FoundrySupport part="question" p={L.question}/></At>}
   {/* PLANNED, hung from the wire over the line, and plated on the bed's front face beside the rack and
      between the rig and the panel, so every line shot, wide or close, carries it */}
   <Item id={tag+'-planned'}><At p={[LINE.signX,LINE.wireY]} r={-2}>
    <path d="M-50 0L-46 22M50 2L46 22" stroke="#3A4147" strokeWidth={2}/>
    <rect x={-80} y={22} width={160} height={48} rx={6} fill="#F7F1E3" stroke="#262C31" strokeWidth={2.6}/>
    <text x={0} y={57} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#A13F2F" letterSpacing={2}>PLANNED</text></At>
    {planPlates(34)}</Item>
   {armShadow(L,'line-'+tag)}
   <Item id={tag==='s4'?'s4-arm':tag==='s6'?'s6-arm':tag==='s9'?'s9-arm':'s5-arm'}>
    <FoundryArmHero part="arm" pose={pose} gap={L.gap} held={heldNode(L,tag)} warm={L.warm} chainX={LINE.x1-40}/>
   </Item>
   {L.fallY!==null&&<g>
    <defs><clipPath id={'af1025-fall-'+tag}><rect x={LINE.cru-60} y={-700} width={120} height={700-CRUCIBLE.h-PAD_TOP+2}/></clipPath></defs>
    <g clipPath={`url(#af1025-fall-${tag})`}><At p={[STATION.drop[0],STATION.drop[1]+L.fallY]}><FoundryArmHero part="tubes"/></At></g></g>}
   <At p={[LINE.furn,0]}><FoundryArmHero part="furnaceFront" glow={L.furnace}/></At>
   {L.stream>0&&<Item id="s9-melt-stream"><FoundryArmHero part="stream" from={lip} to={[lip[0]+2,RIG.anvilTop-24]} p={L.stream} t={t}/></Item>}
  </g>;
 };

 // ---- B: the same line as a floor plan on the drafting sheet, plus an elevation section inset ----
 const INSET={x:-40,y:104,w:340,h:212,cx:130,base:306,s:.5};
 const sectionInset=(L:LineState,tag:string,solo=false)=>{const pose=linePose(L);
  const showCrucible=L.held==='crucible'&&tag==='s9';
  return <Item id={tag+'-section'}><g data-part="section-inset">
   {!solo&&<path d={`M${INSET.cx} ${INSET.y}L${LINE.rig} 52`} stroke="#BFD6E3" strokeWidth={2} strokeDasharray="6 6" opacity={.8}/>}
   <rect x={INSET.x+8} y={INSET.y+10} width={INSET.w} height={INSET.h} rx={8} fill="#05080A" opacity={.35}/>
   <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={8} fill="#E9EEF0" stroke="#0E161C" strokeWidth={3}/>
   <defs><clipPath id={'af1025-inset-'+tag}><rect x={INSET.x+4} y={INSET.y+4} width={INSET.w-8} height={INSET.h-8} rx={6}/></clipPath></defs>
   <g clipPath={`url(#af1025-inset-${tag})`}>
    <rect x={INSET.x} y={INSET.base} width={INSET.w} height={INSET.h} fill="#9AA2A7"/>
    <g transform={`translate(${INSET.cx} ${INSET.base}) scale(${INSET.s}) translate(${-LINE.rig} 0)`}>
     {/* the section is the line's elevation at the rig: the bed, the rig and, where it works there, the arm */}
     <FoundryArmHero part="bed" x0={LINE.x0} x1={LINE.x1} floor={LINE.floor} glowX={LINE.furn} glow={L.furnace*.8}/>
     <Item id={tag+'-planned'}>{planPlates(34)}</Item>
     <Item id={tag==='s4'?'s4-test':tag==='s5'?'s5-sample':tag==='s6'?'s6-rig':'s9-test'}><At p={[LINE.rig,0]}>
      {tag==='s6'?<Item id="s6-sample">{rigNode(L)}</Item>:tag==='s9'?<Item id="s9-melt">{rigNode(L)}</Item>:rigNode(L)}</At></Item>
     {(tag==='s4'||tag==='s9')&&armShadow(L,'inset-'+tag)}
     {(tag==='s4'||tag==='s9')&&<Item id={tag+'-arm'}><FoundryArmHero part="arm" pose={pose} gap={L.gap} held={heldNode(L,tag)} warm={L.warm} chainX={LINE.x1-40}/></Item>}
     {showCrucible&&L.stream>0&&<FoundryArmHero part="stream" from={crucibleLip(pose)} to={[crucibleLip(pose)[0]+2,RIG.anvilTop-24]} p={L.stream} t={t}/>}
    </g>
   </g>
   <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} rx={8} fill="none" stroke="#0E161C" strokeWidth={3}/>
   <path d={`M${INSET.x+12} ${INSET.y+14}h28M${INSET.x+12} ${INSET.y+14}v28`} stroke="#1C2E3A" strokeWidth={3}/>
  </g></Item>;};
 const planWorld=(L:LineState,tag:'s4'|'s5'|'s6'|'s9',c:Cam,o:{inset:boolean})=>{
  const pose=linePose(L),pp=planPose(pose.c,[pose.P[0],0]),lift=-pose.P[1];
  const ps:PlanState={rackTaken:L.rackTaken,crucible:L.crucible,furnace:L.furnace,
   rig:{ram:L.rig.ram,clampP:L.rig.clampP,needle:L.rig.needle,sample:L.rig.sample?{temp:L.rig.sample.temp,bend:L.rig.sample.bend,back:L.rig.sample.back}:null,
    mold:L.rig.mold,feed:L.rig.feed}};
  const held=L.held==='tubes'?<FoundryArmHero part="planTubes"/>:L.held==='crucible'?<FoundryArmHero part="planCrucible" fill={L.crucible.fill} glow={L.crucible.glow} tilt={L.tilt}/>:
   L.held==='sample'?<FoundryArmHero part="planBar" temp={L.heldTemp}/>:undefined;
  // the one sample's route through the stations, traced as far as it has gone
  const stops:Pt[]=tag==='s9'?[[LINE.panel-90,40],[LINE.rig,0]]:[[LINE.rack,0],[LINE.cru,0],[LINE.furn,0],[LINE.rig,0]];
  const k=Math.floor(Math.min(L.stage,stops.length-1-1e-6)),route:Pt[]=stops.slice(0,k+1);
  if(L.stage>0)route.push(lerpPt(stops[k],stops[Math.min(k+1,stops.length-1)],L.stage-k));
  const panelId=tag==='s4'?'s4-ai':tag==='s5'?'s5-gauge':tag==='s9'?'s9-ai':'s6-panel';
  const rigId=tag==='s4'?'s4-test':tag==='s5'?'s5-sample':tag==='s6'?'s6-rig':'s9-test';
  const face=.82,faceAt:Pt=[PLAN.panel[0],PLAN.panel[1]];
  const gx=faceAt[0]+face*(-PANEL.w/2+16+.4*(PANEL.w-32)),gy=faceAt[1]+face*(PANEL.h/2+40);
  return <g transform={camT(c)}>
   <Item id={tag+'-setting'}><FoundrySupport part="planSheet" outline={1} planned={1}/></Item>
   <Item id={tag==='s4'?'s4-vials':tag+'-rack'}><Item id={tag==='s4'?'s4-furnace':tag+'-furnace'}><Item id={rigId}>
    {tag==='s9'?<Item id="s9-melt"><FoundryArmHero part="planStations" st={ps} t={t}/></Item>:tag==='s6'?<Item id="s6-sample"><FoundryArmHero part="planStations" st={ps} t={t}/></Item>:
     <FoundryArmHero part="planStations" st={ps} t={t}/>}</Item></Item></Item>
   {route.length>1&&<path d={'M'+route.map(p=>f2(p[0])+' '+f2(p[1])).join('L')} stroke="#FFB648" strokeWidth={4} strokeDasharray="10 9" fill="none" opacity={.85}/>}
   {/* the ticket wire and the card riding it */}
   <path d={`M${LINE.postX} ${PLAN.wireY}H${LINE.panel-60}`} stroke="#BFD6E3" strokeWidth={2} strokeDasharray="10 8" opacity={.8}/>
   {L.card&&<Item id={tag+'-card'}><At p={[L.card.x,PLAN.wireY]}><FoundrySupport part="card" w={84} ai/></At></Item>}
   <Item id={panelId}><At p={faceAt} s={face}><g transform={`translate(0 ${-PANEL.cy})`}><FoundrySupport part="aiPanel" face write={L.panel.write} glow={L.panel.glow}
    dim={L.panel.dim} sent={L.panel.sent} next={L.panel.next} gauge={L.panel.gauge}/></g></At></Item>
   {tag==='s5'&&L.aim>0&&<path d={`M${f2(faceAt[0]-50)} ${f2(faceAt[1]+30)}L${f2(lerp(faceAt[0]-50,LINE.rig+40,L.aim))} ${f2(lerp(faceAt[1]+30,0,L.aim))}`} stroke="#9BD0DF" strokeWidth={3} strokeDasharray="8 7"/>}
   {tag==='s5'&&L.aim>0&&<circle cx={LINE.rig} cy={0} r={f2(30+40*L.aim)} fill="none" stroke="#9BD0DF" strokeWidth={3} strokeDasharray="6 6" opacity={f2(L.aim)}/>}
   {tag==='s5'&&L.tag>0&&<Item id="s5-gauge-tag"><g opacity={f2(clamp(L.tag*4))}><Str a={[gx,gy-20]} b={[gx,gy+40-40*(1-L.tag)]} w={2.2} color="#BFD6E3"/>
    <At p={[gx,gy+40-40*(1-L.tag)]}><FoundrySupport part="tag" lines={['some behavior']} size={16} tone="ai" swing={8*(1-L.tag)+L.tagSwing}/></At></g></Item>}
   {(tag==='s5'||tag==='s6')&&L.question>0&&<At p={[LINE.rig+10,-100]}><FoundrySupport part="question" p={L.question}/></At>}
   <Item id={tag==='s4'?'s4-arm':tag==='s6'?'s6-arm':tag==='s9'?'s9-arm':'s5-arm'}>
    <FoundryArmHero part="planArm" pose={pp} gap={L.gap} lift={lift} held={held} warm={L.warm}/></Item>
   {L.fallY!==null&&<g opacity={f2(1-clamp(L.fallY/140))}><At p={[LINE.cru,0]} s={1-.4*clamp(L.fallY/140)}><FoundryArmHero part="planTubes"/></At></g>}
   {L.stream>0&&<Item id="s9-melt-stream"><path d={`M${f2(crucibleLip(pose)[0])} 0L${LINE.rig} 0`} stroke="#FFB648" strokeWidth={f2(8*L.stream)} strokeLinecap="round"/>
    <circle cx={LINE.rig} cy={0} r={f2(14*L.stream)} fill="#FFE7B0"/></Item>}
   {o.inset&&sectionInset(L,tag)}
   <Item id={tag+'-planned'}>{planPlates(86)}</Item>
  </g>;
 };

 // ---- A s1: the cabinet ----
 const countTag=(hole:Pt,tagP:number,swing:number)=>tagP>0&&<Item id="s1-count"><g opacity={f2(clamp(tagP*4))}>
  <Str a={CANDIDATE} b={hole} w={2.6} color="#F5E7C8"/>
  <At p={hole}><FoundrySupport part="tag" lines={COUNT_TAG.lines} size={COUNT_TAG.size} swing={-10*(1-tagP)+swing}/></At></g></Item>;
 const cabinet=(k:string)=>{const C=CAB_AT[k];if(!C)throw new Error('No cabinet placement for '+k);
  const s1=S.s1,hole:Pt=[CANDIDATE[0]+COUNT_TAG.off[0],CANDIDATE[1]+COUNT_TAG.off[1]-COUNT_TAG.drop*(1-s1.tag)];
  return <At p={C.c} s={C.s}>
   <Item id="s1-table"><Item id="s1-mesh"><FoundrySupport part="periodic" lit={s1.lit} mesh={s1.mesh} candidate={s1.candidate} t={t}/></Item></Item>
   {countTag(hole,s1.tag,s1.swing)}
  </At>;};
 // ---- A s2: the stream, the pile, the tray, the pencil, the hand ----
 const benchWorld=(c:Cam,o:{cabinet:boolean;hand:boolean})=>{
  const s2=S.s2,cards:React.ReactNode[]=[],flying:React.ReactNode[]=[],tray:React.ReactNode[]=[];
  for(let i=0;i<BENCH2.N;i++){const cd=streamCard(i,t,s2.streamStart);if(!cd)continue;
   const node=<At key={i} p={cd.p} r={cd.rot}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={i}/></At>;
   (cd.flying?flying:CARD_CLASS[i]==='tray'?tray:cards).push(node);}
  const rollX=lerp(BENCH2.pencil,BENCH2.edge+8,s2.roll),fall=s2.fall>0?.5*G*s2.fall*s2.fall:0;
  const pencil:Pt=[rollX+(s2.fall>0?36*s2.fall:0),-8+Math.min(fall,BENCH2.floor+4)];
  const hand=handAt(s2),sorted=s2.pinch>.5,inHand=sorted&&s2.drop<.5;
  const sortedAt:Pt=inHand?[hand[0]+8,hand[1]+10]:[BENCH2.tray+6,-32];
  return <g transform={camT(c)}>
   <Item id="s2-setting">
    <FoundrySupport part="floor" x0={-2400} x1={2400} y={BENCH2.floor} to={BENCH2.floor+2400}/>
    <FoundrySupport part="bench" x0={BENCH2.x0} x1={BENCH2.edge} floor={BENCH2.floor}/>
    <At p={[-250,0]}><FoundrySupport part="beaker"/></At>
   </Item>
   {o.cabinet&&<At p={BENCH2.cab} s={BENCH2.cabS}><FoundrySupport part="periodic" lit={36} mesh={1} candidate={.6+.4*smooth(1-(t-s2.streamStart))} t={t}/></At>}
   <Item id="s2-tag"><At p={[BENCH2.tray,0]}><FoundrySupport part="tray" w={BENCH2.trayW}/></At>
    {sorted&&!inHand&&<At p={sortedAt} r={6}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={99}/></At>}{tray}</Item>
   <Item id="s2-pile">{cards}
    <At p={pencil} r={-24+(s2.fall>0?Math.min(260,s2.fall*720):0)} s={1}><g transform="scale(.7 1)"><FoundrySupport part="pencil" spin={(rollX-BENCH2.pencil)/6}/></g></At></Item>
   <Item id="s2-stream">{flying}</Item>
   {o.hand&&s2.handIn>0&&<Item id="s2-tag">{inHand&&<At p={sortedAt} r={-14}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={99}/></At>}
    <At p={hand} r={12-14*s2.stop}><g transform="scale(-1 1)"><FoundrySupport part="hand" pinch={s2.pinch*(1-s2.drop)*(1-s2.stop)}/></g></At></Item>}
  </g>;
 };
 // ---- A s3: the desk and its papers ----
 const stampTop=(m:Pt,st:{lift:number;come:number;away:number},w:number,fy=1,r=-8)=>st.come<=0||st.away>=1?null:
  <At p={[m[0]+360*(1-st.come)+360*st.away,m[1]-520*(1-st.come)-520*st.away]} s={1+.4*st.lift} r={r}><g transform={`scale(1 ${f2(1/fy)})`}><FoundrySupport part="stamp" w={w} top lift={st.lift}/></g></At>;
 const releaseEntry=(cardAt:Pt,rot:number)=>{const s3=S.s3,gp=s3.grant,clip=DESK.grantClip,hole=DESK.grantHole,grantFrom:Pt=[hole[0]+330,hole[1]-430];
  const gpos:Pt=[lerp(grantFrom[0],hole[0],gp),lerp(grantFrom[1],hole[1],gp)-70*Math.sin(Math.PI*gp)];
  return <Item id="s3-release"><At p={cardAt} r={rot}><FoundrySupport part="release" write={s3.write}/>
   <Item id="s3-date"><At p={DESK.dateMark} r={-8}><FoundrySupport part="impression" text="Oct. 22, 2026" size={22} color="#A13F2F" p={s3.date.inked}/></At></Item>
   {gp>0&&<Item id="s3-grant"><rect x={clip[0]-6} y={clip[1]-16} width={14} height={34} rx={4} fill="#8D959B" stroke="#262C31" strokeWidth={1.8}/>
    <Str a={clip} b={gpos} w={2.6}/>
    <At p={gpos}><FoundrySupport part="tag" lines={['$2 million','grant']} size={30} swing={10*(1-gp)+s3.grantSwing}/></At></Item>}
  </At></Item>;};
 const deskWorld=(c:Cam)=>{
  const s3=S.s3,fy=DESK.fy,cardAt:Pt=[DESK.card[0]+520*(1-s3.slide),DESK.card[1]];
  const mark:Pt=[cardAt[0]+DESK.dateMark[0],cardAt[1]+DESK.dateMark[1]];
  const plannedAt:Pt=[DESK.bay[0]+DESK.bayS*DESK.planned[0],DESK.bay[1]+DESK.bayS*DESK.planned[1]];
  return <g transform={camT(c)}>
   <Item id="s3-setting">
    <FoundrySupport part="floor" x0={-2400} x1={2400} y={334} to={2400}/>
    <path d={`M${DESK.x0} 0L${DESK.x0+20} ${-DESK.depth*fy}L${DESK.x1-16} ${-DESK.depth*fy}L${DESK.x1} 0Z`} fill="#A57C55" stroke="#262C31" strokeWidth={2.6} strokeLinejoin="round"/>
    {[0,1,2,3,4].map(k=><path key={k} d={`M${DESK.x0+40} ${f2(-DESK.depth*fy*(.15+k*.18))}q300 ${(k%3-1)*5} ${DESK.x1-DESK.x0-90} ${(k%2)*4-2}`} stroke="#C29B72" strokeWidth={1.6} opacity={.45} fill="none"/>)}
    <rect x={DESK.x0} y={0} width={DESK.x1-DESK.x0} height={40} fill="#7C5A3B" stroke="#262C31" strokeWidth={2.6}/>
    <path d={`M${DESK.x0+4} 4H${DESK.x1-4}`} stroke="#C29B72" strokeWidth={3} opacity={.6}/>
    {[DESK.x0+30,DESK.x1-40].map(x=><rect key={x} x={x-12} y={40} width={24} height={260} fill="#7C5A3B" stroke="#262C31" strokeWidth={2}/>)}
   </Item>
   <g transform={`scale(1 ${fy})`}>
    <Item id="s3-bay"><At p={DESK.bay} s={DESK.bayS}><FoundrySupport part="bay" p={s3.bay} title={s3.title}/>
     <At p={DESK.planned} r={-8}><FoundrySupport part="impression" text="PLANNED" size={34} color="#A13F2F" p={s3.planned.inked}/></At></At></Item>
    {releaseEntry(cardAt,-5*(1-s3.slide)-1)}
    {stampTop(mark,s3.date,150,fy)}
    {stampTop(plannedAt,s3.planned,170,fy)}
   </g>
  </g>;
 };
 // ---- A s5: the quote card face on ----
 const quoteCard=(p:Pt,s:number)=>{const s5=S.s5;return <Item id="s5-quote"><At p={[p[0]+560*(1-s5.slide),p[1]]} s={s} r={2*(1-s5.slide)}><FoundrySupport part="quote" name={s5.name} hl={s5.hl}/></At></Item>;};
 // ---- A s7 and s8: the planning sheet on the easel ----
 const sheet=(sc:'s7'|'s8')=>{
  const s7=S.s7,s8=S.s8,in7=sc==='s7';
  const flip=in7?s7.flip:1,fill=in7?s7.fill:1,slide=in7?s7.slide:1,goal=in7?s7.goal:1;
  const weekAt:Pt=[SHEET.week[0]+(1-slide)*720,SHEET.week[1]];
  const goalHole:Pt=[SHEET.goalHole[0]+(1-goal)*80,SHEET.goalHole[1]-(1-goal)*220];
  const st=s8.goal,resultFrom:Pt=[SHEET.resultHole[0]-260,SHEET.resultHole[1]+260],rp=in7?0:s8.tag;
  const resultHole=lerpPt(resultFrom,SHEET.resultHole,rp);
  return <g>
   <Item id={sc==='s7'?'s7-months':'s8-calendar'}><At p={SHEET.cal} s={SHEET.calS}><FoundrySupport part="calendar" flip={flip}/></At></Item>
   <Item id={sc==='s7'?'s7-week':'s8-week'}>{slide>0&&<At p={weekAt}><FoundrySupport part="week" fill={fill}/></At>}</Item>
   {goal>0&&<Item id={sc==='s7'?'s7-goal':'s8-goal-tag'}><g opacity={f2(clamp(goal*4))}><Str a={[SHEET.goalHole[0]-30,SHEET.week[1]+WEEK_H]} b={goalHole} w={2.6}/>
    <At p={goalHole}><FoundrySupport part="tag" lines={['goal']} size={34} swing={-12*(1-goal)+(in7?s7.goalSwing:0)}/></At></g></Item>}
   {!in7&&<Item id="s8-goal"><At p={SHEET.stamp}><FoundrySupport part="impression" text="GOAL" size={54} color="#E48A1C" p={st.inked} rot={-9}/></At>
    {st.come>0&&st.away<1&&<At p={[SHEET.stamp[0]+300*(1-st.come)+300*st.away,SHEET.stamp[1]-420*(1-st.come)-420*st.away]} s={1+.45*st.lift} r={-9}>
     <FoundrySupport part="stamp" w={210} top lift={st.lift}/></At>}</Item>}
   {!in7&&rp>0&&<Item id="s8-unmeasured"><Str a={[SHEET.stamp[0]-80,SHEET.stamp[1]+30]} b={resultHole} w={2.6}/>
    <At p={resultHole}><FoundrySupport part="tag" lines={['not a result']} size={30} swing={-16*(1-rp)+s8.tagSwing}/></At></Item>}
   {!in7&&s8.form>0&&<Item id="s8-date"><g opacity={f2(clamp(s8.form*1.6))} transform={`translate(0 ${f2(60*(1-s8.form))})`}>
    <At p={SHEET.release} s={SHEET.releaseS} r={2}><FoundrySupport part="release" write={1}/></At>
    <At p={SHEET.form} s={SHEET.formS} r={-1.5}><FoundrySupport part="form" dash={s8.dash}/></At>
    <rect x={SHEET.form[0]+FORM.w*SHEET.formS-34} y={SHEET.release[1]+RELEASE.h*SHEET.releaseS-40} width={16} height={58} rx={5} fill="#8D959B" stroke="#262C31" strokeWidth={2}/></g></Item>}
  </g>;};
 const easelWorld=(sc:'s7'|'s8',c:Cam,room:boolean)=><g transform={camT(c)}>
  <Item id={sc+'-setting'}>{room&&<FoundrySupport part="floor" x0={-2400} x1={2400} y={SHEET.easelFloor} to={SHEET.easelFloor+2400}/>}
   <FoundrySupport part="easel" w={SHEET.w} h={SHEET.h} floor={SHEET.easelFloor} legs={room||fr==='close'}/></Item>
  {sheet(sc)}
 </g>;

 // ---- B: the ledger spine. Every scene's records stay entered for the scenes after it ----
 const order=SCENE_ORDER.indexOf(sid),past=(s:string)=>SCENE_ORDER.indexOf(s)<order,here=(s:string)=>s===sid,from=(s:string)=>past(s)||here(s);
 const ledgerWorld=(c:Cam,o:{desk:boolean})=>{
  const L=LEDGER_AT,s1=here('s1')?S.s1:{lit:36,mesh:1,candidate:.6,tag:1,swing:0};
  const s2=S.s2,s2live=here('s2'),s3=S.s3,s3live=here('s3'),s5=S.s5,s7=S.s7,s8=S.s8,s7live=here('s7'),s8live=here('s8');
  const cards:React.ReactNode[]=[],flying:React.ReactNode[]=[],pocket:React.ReactNode[]=[];
  if(from('s2'))for(let i=0;i<BENCH2.N;i++){const cd=ledgerCard(i,s2live?t:1e6,s2.streamStart);if(!cd)continue;
   const node=<At key={i} p={cd.p} r={cd.rot}><FoundrySupport part="card" w={118} seed={i}/></At>;
   (cd.flying?flying:LEDGER_SLOT[i]===-1?pocket:cards).push(node);}
  const handPath={off:[-260,1160] as Pt,pick:[190,808] as Pt,tray:[60,926] as Pt,again:[160,830] as Pt,stopAt:[110,880] as Pt};
  const hand=handAt(s2,handPath),sorted=s2live&&s2.pinch>.5,inHand=sorted&&s2.drop<.5;
  const pencilX=lerp(L.pencil[0],LEDGER.w+30,s2live?s2.roll:1),pencilGone=s2live?clamp(s2.fall/.35):1;
  const headHole:Pt=[CANDIDATE[0]+COUNT_TAG.off[0],CANDIDATE[1]+COUNT_TAG.off[1]-COUNT_TAG.drop*(1-s1.tag)];
  const relAt:Pt=[L.release[0]+(s3live?700*(1-s3.slide):0),L.release[1]];
  const relMark:Pt=[relAt[0]+L.releaseS*DESK.dateMark[0],relAt[1]+L.releaseS*DESK.dateMark[1]];
  const weekSlide=s7live?s7.slide:1,weekFill=s7live?s7.fill:1,goal=s7live?s7.goal:1,flip=s7live?s7.flip:1;
  const weekAt:Pt=[L.week[0]+(1-weekSlide)*700,L.week[1]],stampAt:Pt=[L.week[0]+L.weekS*WEEK_W/2,L.week[1]+L.weekS*WEEK_H/2];
  const goalHole:Pt=[L.goalHole[0]+(1-goal)*80,L.goalHole[1]-(1-goal)*200];
  const rp=s8live?s8.tag:from('s8')?1:0,resultHole=lerpPt([L.resultHole[0]-260,L.resultHole[1]+200],L.resultHole,rp);
  return <g transform={camT(c)}>
   {o.desk&&<Item id={sid+'-setting'}><rect x={-700} y={-900} width={2240} height={4600} fill="#5A4130"/>
    {Array.from({length:30},(_,k)=><path key={k} d={`M-700 ${-900+k*150}q1100 ${(k%3-1)*30} 2240 ${(k%2)*20-10}`} stroke="#6E513C" strokeWidth={6} fill="none" opacity={.6}/>)}</Item>}
   <Item id={sid+'-setting'}><FoundrySupport part="ledger"/></Item>
   {/* s1: the chart at the ledger's head, its mesh and the trillion tag */}
   <At p={L.head} s={L.headS}><Item id="s1-table"><Item id="s1-mesh"><FoundrySupport part="periodic" lit={s1.lit} mesh={s1.mesh} candidate={s1.candidate} t={t}/></Item></Item>
    {countTag(headHole,s1.tag,s1.swing)}</At>
   {/* s2: card rows, the pocket in the margin, cards over the page edge, the pencil, the hand */}
   {from('s2')&&<g>
    <Item id="s2-tag"><At p={L.pocket}><FoundrySupport part="pocket" w={L.pocketW} h={L.pocketH}/></At>
     {(s2live?sorted&&!inHand:true)&&<At p={[L.pocket[0]+L.pocketW/2,L.pocket[1]+40]} r={4}><FoundrySupport part="card" w={118} seed={99}/></At>}{pocket}</Item>
    <Item id="s2-pile">{cards}{pencilGone<1&&<At p={[pencilX,L.pencil[1]+30*pencilGone]} r={-30+90*pencilGone} s={1-.3*pencilGone} o={1-pencilGone}><FoundrySupport part="pencil" spin={(pencilX-L.pencil[0])/6}/></At>}</Item>
    <Item id="s2-stream">{flying}</Item>
    {s2live&&s2.handIn>0&&<Item id="s2-tag">{inHand&&<At p={[hand[0]+8,hand[1]+12]} r={-10}><FoundrySupport part="card" w={118} seed={99}/></At>}
     <At p={hand} r={-30-12*s2.stop} s={.9}><g transform="scale(-1 1)"><FoundrySupport part="hand" pinch={s2.pinch*(1-s2.drop)*(1-s2.stop)}/></g></At></Item>}
   </g>}
   {/* s3: the release row with its date stamp and grant tag */}
   {from('s3')&&<g transform={`translate(${f2(relAt[0])} ${f2(relAt[1])}) scale(${L.releaseS})`}>{releaseEntry([0,0],s3live?-4*(1-s3.slide):0)}</g>}
   {from('s3')&&s3live&&stampTop(relMark,s3.date,120)}
   {/* s5: the quote row */}
   {from('s5')&&<Item id="s5-quote"><At p={[L.quote[0]+(here('s5')?600*(1-s5.slide):0),L.quote[1]]} s={L.quoteS}><FoundrySupport part="quote" name={here('s5')?s5.name:1} hl={here('s5')?s5.hl:1}/></At></Item>}
   {/* s7 and s8: the calendar pad, the week row, the goal tag, the GOAL stamp, the result tag */}
   {from('s7')&&<g>
    <Item id={here('s7')?'s7-months':'s8-calendar'}><At p={L.cal} s={L.calS}><FoundrySupport part="calendar" flip={flip}/></At></Item>
    <Item id={here('s7')?'s7-week':'s8-week'}>{weekSlide>0&&<At p={weekAt} s={L.weekS}><FoundrySupport part="week" fill={weekFill}/></At>}</Item>
    {goal>0&&<Item id={here('s7')?'s7-goal':'s8-goal-tag'}><g opacity={f2(clamp(goal*4))}><Str a={[L.goalHole[0]-24,L.week[1]+L.weekS*WEEK_H]} b={goalHole} w={2.6}/>
     <At p={goalHole}><FoundrySupport part="tag" lines={['goal']} size={34} swing={-12*(1-goal)+(s7live?s7.goalSwing:0)}/></At></g></Item>}
   </g>}
   {from('s8')&&<g>
    <Item id="s8-goal"><At p={stampAt}><FoundrySupport part="impression" text="GOAL" size={54} color="#E48A1C" p={s8live?s8.goal.inked:1} rot={-9}/></At>
     {s8live&&stampTop(stampAt,s8.goal,210,1,-9)}</Item>
    {rp>0&&<Item id="s8-unmeasured"><Str a={[stampAt[0]-90,stampAt[1]+34]} b={resultHole} w={2.6}/>
     <At p={resultHole}><FoundrySupport part="tag" lines={['not a result']} size={30} swing={-14*(1-rp)+(s8live?s8.tagSwing:0)}/></At></Item>}
    {(s8live?s8.form>0:true)&&<Item id="s8-date"><g opacity={f2(s8live?clamp(s8.form*1.6):1)} transform={`translate(${f2(s8live?220*(1-s8.form):0)} 0)`}>
     <At p={L.form} s={L.formS} r={-2}><FoundrySupport part="form" dash={s8live?s8.dash:1}/></At>
     <rect x={L.form[0]-8} y={L.form[1]-18} width={16} height={56} rx={5} fill="#8D959B" stroke="#262C31" strokeWidth={2}/></g></Item>}
   </g>}
  </g>;
 };

 let pic:React.ReactNode;
 if(v==='a')switch(view){
 // ===== s1 =====
 case 'wall-display':need('s1');pic=<g>{cabinet(key)}</g>;break;
 case 'mesh-wide':{
  need('s1');const C=CAB_AT[key];
  pic=<g><Item id="s1-setting"><FoundrySupport part="floor" x0={-40} x1={1120} y={1180} to={1960}/>
   <At p={[C.c[0],1180]}><FoundrySupport part="cabinetStand" h={1180-C.c[1]-CABINET.h*C.s/2+6}/></At>
   <At p={[0,1090]}><FoundrySupport part="bench" x0={720} x1={1130} floor={90}/></At>
   <At p={[860,1074]} s={.9}><FoundrySupport part="beaker"/></At></Item>{cabinet(key)}</g>;break;}
 // ===== s2 =====
 case 'recipe-stream':case 'desk-pile':need('s2');pic=benchWorld(cam(S2_CAM,key),{cabinet:view==='recipe-stream',hand:true});break;
 // ===== s3 =====
 case 'release-desk':case 'stamp-close':case 'bay-blueprint':need('s3');pic=deskWorld(cam(S3_CAM,key));break;
 // ===== s4, s5, s6, s9 on the line =====
 case 'ai-panel':case 'arm-vials':case 'furnace-glow':case 'rig-clamp':need('s4');pic=lineWorld(s4Line(S,t),'s4',lineCamAt(view,fr,S));break;
 case 'quote-card':need('s5');pic=<g>{quoteCard([470-QUOTE.w*1.5/2,760-quoteHeight()*1.5/2],1.5)}</g>;break;
 case 'gauge-fill':case 'unknown-sample':need('s5');pic=lineWorld(lineFor('s5'),'s5',lineCam(view,fr));break;
 case 'arm-lift':case 'rig-load':case 'needle-detail':need('s6');pic=lineWorld(lineFor('s6'),'s6',lineCam(view,fr));break;
 case 'ai-card':case 'melt-pour':case 'melt-hold':need('s9');pic=lineWorld(s9Line(S,t),'s9',lineCam(view,fr));break;
 // ===== s7, s8 on the easel =====
 case 'calendar-months':case 'week-strip':case 'goal-tag':need('s7');pic=easelWorld('s7',cam(S78_CAM,key),false);break;
 case 'goal-stamp':case 'unmeasured-tag':case 'date-field':need('s8');pic=easelWorld('s8',cam(S78_CAM,key),view==='goal-stamp');break;
 default:throw new Error('Unimplemented alloy foundry view '+view+' in treatment a');
 }else switch(view){
 // ===== B: the ledger spine =====
 case 'ledger-head':need('s1');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:true});break;
 case 'wall-display':need('s1');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'ledger-stream':need('s2');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:true});break;
 case 'ledger-sort':need('s2');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'release-desk':case 'grant-row':need('s3');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'plan-outline':{
  // the drafting sheet slides onto the ledger over the release row and the line's outline draws on it,
  // titled and stamped PLANNED: the same sheet the next scene's floor plan stands on
  need('s3');const s3=S.s3,c=cam(PLAN_CAM,view);
  pic=<g>{ledgerWorld({f:[420,1440],s:.95,a:[470,800]},{desk:true})}
   <g transform={`translate(${f2(900*(1-s3.sheet))} 0)`}><g transform={camT(c)}><Item id="s3-bay"><FoundrySupport part="planSheet" outline={s3.bay} planned={s3.planned.inked} title={s3.title}/></Item>
    {stampTop([SHEET_PLAN.title[0]+118,SHEET_PLAN.title[1]+50],s3.planned,150,1,-6)}</g></g></g>;break;}
 case 'quote-row':need('s5');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'month-rows':need('s7');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:true});break;
 case 'week-row':case 'goal-tag':need('s7');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'goal-row':case 'result-row':need('s8');pic=ledgerWorld(cam(LEDGER_CAM,view),{desk:false});break;
 case 'date-row':{
  // the ledger scrolls back up from the week row to the release row, where the blank field clips on
  need('s8');const c=cam(LEDGER_CAM,view),u=ease5((t-shot.start_s)/DATE_ROW_SCROLL);
  pic=ledgerWorld({...c,f:lerpPt(DATE_ROW_FROM,c.f,u)},{desk:true});break;}
 // ===== B: the floor plan =====
 case 'plan-line':case 'arm-vials':case 'furnace-glow':case 'clamp-plan':need('s4');pic=planWorld(s4Line(S,t),'s4',cam(PLAN_CAM,view),{inset:view==='clamp-plan'});break;
 case 'gauge-plan':case 'unknown-sample':need('s5');pic=planWorld(lineFor('s5'),'s5',cam(PLAN_CAM,view),{inset:false});break;
 case 'sample-glow':case 'rig-load':need('s6');pic=planWorld(lineFor('s6'),'s6',cam(PLAN_CAM,view),{inset:true});break;
 case 'section-detail':{
  // the section inset alone and close: the ram presses, the bar bends, the needle swings
  need('s6');pic=<g transform={camT(cam(PLAN_CAM,view))}><Item id="s6-setting">{sectionInset(lineFor('s6'),'s6',true)}</Item></g>;break;}
 case 'plan-card':case 'melt-pour':case 'plan-hold':need('s9');pic=planWorld(s9Line(S,t),'s9',cam(PLAN_CAM,view),{inset:true});break;
 default:throw new Error('Unimplemented alloy foundry view '+view+' in treatment b');
 }

 // ---- the disclosure chip: this scene's production_disclosure in this treatment's board, every frame ----
 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText),box=disclosureBox(disclosureText);
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]} rx={16} fill={ad.palette.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={ad.palette.ink}>{l}</text>)}
 </g>;
 const move=strategyMove(scene.camera_strategy as string,(t-scene.start_s)/scene.duration_s);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}
   data-camera-strategy={scene.camera_strategy} transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}><g transform={move}>{pic}</g></g>
  {disclosure}
 </svg>;
};
