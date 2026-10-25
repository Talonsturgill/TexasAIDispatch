import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {FoundryArmHero,armPose,GAP,RIG,FURNACE,CRUCIBLE,TUBE,type ArmPose} from './FoundryArmHero';
import {FoundrySupport,CABINET,CANDIDATE,CARD,RELEASE,BAY,PANEL,QUOTE,quoteHeight,MONITOR,FORM,WEEK_W,WEEK_H,tagSize} from './FoundrySupport';

/**
 * alloy-foundry-v1: only the melt can answer (2026-10-25, Brazos County, the Post Oak Savannah).
 *
 * ONE generic robotic arm on a rail behind a short sample line (FoundryArmHero) carries the film, and
 * the records around it (FoundrySupport) set up its question and its limits. Every performed state is a
 * closed function of the film clock and the board's event windows (foundryState), so any frame renders
 * alone and the same twice:
 *
 *  s1  several dozen tiles of a periodic table cabinet light amber one after another; fine lines weave
 *      between the lit tiles into a mesh; a tag reading roughly a trillion ways settles on the mesh
 *      while one candidate point glows. A watches the cabinet face on, then from the room; B looks down
 *      on it as a display table, then face on.
 *  s2  recipe cards stream out of the mesh onto a bench and pile over its edge; the pencil rolls off;
 *      a gloved hand sorts one card into a tray, reaches again, and stops as the cards bury the tray.
 *  s3  the release card slides onto the desk and writes its headline; the dateline stamp lands crooked;
 *      a tag reading $2 million grant swings in and hooks on; a pencil outline of a foundry bay draws
 *      in beside the card, titled Aggie AI Foundry, and takes a PLANNED stamp.
 *  s4  the AI panel writes a recipe card whose swatches are the recipe tubes' colours and sends a copy
 *      along the ticket wire to the rack; the arm takes those three tubes, drops them into the crucible,
 *      sets the crucible deep in the furnace, which glows amber, then lifts the sample out of the port and
 *      carries it to the test rig, whose clamps close. A PLANNED sign hangs over the line.
 *  s5  a quote card slides in and writes its speaker's name; on the computer's monitor the prediction
 *      gauge fills partway and a tag reading some behavior marks the level; pointed at the alloy sample
 *      the same gauge drains, tries and stays empty, and a question mark rises over the sample.
 *  s6  the arm lifts a glowing sample out of the furnace with its tongs, carries it to the rig as it
 *      cools from amber to gray, sets it in the clamps; the ram presses, the bar bends, the needle swings.
 *  s7  calendar month pages flip away one after another; a one-week strip slides in and its seven day
 *      cells fill; a tag reading goal lands on the strip.
 *  s8  a GOAL stamp lands crooked on the strip; a tag reading not a result attaches to the stamp; an
 *      opening date form field appears and stays blank, marked with a dash.
 *  s9  the AI panel's recipe card glows once and holds; the arm tips the glowing crucible and the amber
 *      melt pours into the mold on the rig; the card dims while the melt holds its glow (the answer).
 *
 * Colour carries meaning: amber is only the lit tiles, the melt and its light, and the GOAL stamp; a
 * cool blue is only the AI and the computer (the panel, its card stripe, the gauge); slate fills days.
 * Every scene is indoors in a Brazos County lab, so PlaceStage draws the post oak region through the
 * window behind the wide and medium shots, as a soft wash behind the close ones, and plain wall behind
 * the listed document views. No full-frame background is painted. Disclosed illustration of a planned
 * lab: a generic arm, furnace and rig, no Texas A&M building, mark, person or measured result.
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
/** A struck or released thing swinging about its pin, tau seconds after the impulse; zero before it and
 * zero speed at it. Pure in tau. */
export function damped(tau:number,amp:number,hz:number,k:number){return tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.1);}
/** A cubic Bezier point. */
export const bez=(a:Pt,b:Pt,c:Pt,d:Pt,u:number):Pt=>{const v=1-u;return [v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]];};

// ---- the sample line (line units, the bed's working surface on y 0) --------------------------------
/** The crucible pad's top: the crucible stands this far above the bed surface. */
export const PAD_TOP=4;
export const LINE={x0:-440,x1:440,floor:330,rack:-290,cru:-150,furn:-10,rig:142,panel:330,wireY:-452,reach:110,postX:-352,
 clipX:-326,cardScale:.74,signX:-80};
/** The grip points the arm works to. The carriage always rides LINE.reach to the left of the grip, so the
 * elbow stays up and the carriage visibly travels the rail between stations. */
export const STATION={hover:[-290,-150] as Pt,tubes:[-290,TUBE.grip] as Pt,drop:[-150,-132] as Pt,cru:[-150,CRUCIBLE.hold-PAD_TOP] as Pt,
 furnIn:[-10,-115] as Pt,sampleIn:[-10,-108] as Pt,lifted:[-10,-250] as Pt,rig:[142,RIG.anvilTop-5] as Pt,pourAbove:[120,-262] as Pt,pour:[120,-228] as Pt};
export const poseAt=(P:Pt,tilt=0):ArmPose=>armPose(P[0]-LINE.reach,P,tilt);
/** The held crucible's pour lip in line units: the lip tip in crucible units (CRUCIBLE.top+9, -h-9),
 * moved into the tool frame (its base CRUCIBLE.hold below the grip) and turned with the tilt. Pure. */
export function crucibleLip(pose:ArmPose):Pt{
 const a=pose.tilt*Math.PI/180,x=CRUCIBLE.top+9,y=-CRUCIBLE.h-9-CRUCIBLE.hold;
 return [pose.P[0]+x*Math.cos(a)-y*Math.sin(a),pose.P[1]+x*Math.sin(a)+y*Math.cos(a)];
}
/** Gravity for the dropped tubes, line units a second squared. */
const G=2600;

type Held='none'|'tubes'|'crucible'|'sample';
export type LineState={P:Pt;tilt:number;gap:number;held:Held;rackTaken:boolean;fallY:number|null;
 crucible:{where:'pad'|'held'|'furnace'|'none';fill:number;glow:number;mixed:number};furnace:number;
 heldTemp:number;rig:{ram:number;clampP:number;needle:number;sample:{temp:number;bend:number}|null;mold:{fill:number;glow:number}|null};
 stream:number;card:{x:number}|null;panel:{write:number;glow:number;dim:number;sent:number};warm:number};

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

 // s2: the card stream starts with s2-event-1 and keeps coming; the pile reaches the edge in s2-event-2;
 // the hand sorts in s2-event-3 and stops
 const s2={streamStart:has('s2-event-1')?W['s2-event-1'].start:0,roll:ease5(sub('s2-event-2',.3,.78)),fall:has('s2-event-2')?t-at('s2-event-2',.78):-1,
  handIn:has('s2-event-3')?ease5((t-(W['s2-event-3'].start-1))/.9):0,pinch:ease5(sub('s2-event-3',0,.12)),carry:ease5(sub('s2-event-3',.1,.48)),
  drop:sub('s2-event-3',.48,.56),reach:ease5(sub('s2-event-3',.58,.92)),stop:has('s2-event-3')?ease5((t-W['s2-event-3'].end)/.5):0};

 // s3: the card slides in and writes; the dateline stamp; the grant tag; the bay outline and its PLANNED stamp
 const w31=W['s3-event-1'];
 const s3={slide:P('s3-event-1'),write:w31?clamp((t-at('s3-event-1',.3))/(.95*(w31.end-w31.start)+.45)):0,date:stampState(W['s3-event-2'],t),
  grant:P('s3-event-3'),grantSwing:damped(after('s3-event-3'),9,1.2,2.4),bay:smooth(sub('s3-event-4',0,.7)),title:sub('s3-event-4',.4,.78),
  planned:stampState(has('s3-event-4')?{...W['s3-event-4'],start:at('s3-event-4',.66)}:undefined,t)};

 // s5: the quote slides in and writes the name; the gauge fills partway; then it drains and stays empty
 const s5={slide:P('s5-event-1'),name:has('s5-event-1')?clamp((t-at('s5-event-1',.55))/.8):0,
  fill:.4*P('s5-event-2')*(1-ease5(sub('s5-event-3',.05,.32))),tag:subE('s5-event-2',.5,1),tagSwing:damped(after('s5-event-2'),7,1.2,2.6),
  aim:ease5(sub('s5-event-3',0,.3)),search:has('s5-event-3')&&R('s5-event-3')>.32?Math.max(0,Math.sin(Math.PI*sub('s5-event-3',.32,.82)*3))*.9:0,
  question:sub('s5-event-3',.42,.85),hl:sub('s5-event-2',.1,.6)};

 // s7: pages flip away; the week strip slides in and fills; the goal tag lands
 const s7={flip:P('s7-event-1'),slide:subE('s7-event-2',0,.45),fill:sub('s7-event-2',.35,1),goal:P('s7-event-3'),goalSwing:damped(after('s7-event-3'),7,1.2,2.6)};
 // s8: the GOAL stamp; the not a result tag; the form appears blank and takes its dash
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

// ---- the line's three performances ------------------------------------------------------------------
const PANEL_IDLE={write:1,glow:.18,dim:0,sent:1};
/** s4: the panel writes and sends; the arm takes the tubes, drops them, sets the crucible in the furnace,
 * lifts the sample out and carries it to the rig. */
export function s4Line(S:FoundryState,t:number):LineState{
 const {has,sub,subE,at}=S,e1='s4-event-1',e2='s4-event-2',e3='s4-event-3',e4='s4-event-4';
 const st:LineState={P:STATION.hover,tilt:0,gap:GAP.open,held:'none',rackTaken:false,fallY:null,
  crucible:{where:'pad',fill:0,glow:0,mixed:0},furnace:0,heldTemp:.92,rig:{ram:0,clampP:0,needle:0,sample:null,mold:null},
  stream:0,card:null,panel:{write:S.P(e1),glow:.25+.35*Math.sin(Math.PI*sub(e1,0,1)),dim:0,sent:sub(e1,.62,.95)},warm:0};
 if(!has(e2)||!has(e3)||!has(e4))return st;
 const g2=at(e2,0);
 // the printed copy rides the ticket wire from behind the panel to the rack's clip, one rest to rest stroke
 const c0=at(e1,.62),c1=g2;
 if(t>=c0)st.card={x:lerp(LINE.panel,LINE.clipX,ease5((t-c0)/(c1-c0)))};
 // setup: once the card is on its way the arm lowers onto the recipe tubes and closes on them
 const lower=ease5((t-(g2-1.15))/.7),close=ease5((t-(g2-.42))/.26);
 st.P=lerpPt(STATION.hover,STATION.tubes,lower);st.gap=lerp(GAP.open,GAP.tubes,close);
 if(close>.5){st.held='tubes';st.rackTaken=true;}
 // s4-event-2: lift, ride to the crucible, open: the tubes drop in
 if(t>=g2){
  // lift the tubes clear of the rack's neighbours, ride right to the crucible and open over it; the tubes
  // fall in and the arm comes down to the crucible's waist while they settle
  st.P=bez(STATION.tubes,[-290,-150],[-200,-142],STATION.drop,subE(e2,0,.55));
  const open=ease5(sub(e2,.56,.64)),release=at(e2,.57);
  st.gap=lerp(GAP.tubes,GAP.open,open);
  if(t>=release){st.held='none';st.fallY=.5*G*(t-release)*(t-release);}
  st.crucible.fill=ease5(sub(e2,.76,.95));st.crucible.mixed=sub(e2,.9,1);
  if(st.fallY!==null&&st.fallY>140)st.fallY=null;
  st.P=lerpPt(st.P,STATION.cru,ease5(sub(e2,.7,1)));
 }
 // s4-event-3: down to the crucible, grip, carry it over and deep into the furnace, let go; the glow rises
 if(t>=at(e3,0)){
  st.fallY=null;
  const grip=ease5(sub(e3,0,.1)),carry=subE(e3,.1,.84),rel=ease5(sub(e3,.84,.92));
  st.P=STATION.cru;
  st.gap=lerp(GAP.open,GAP.crucible,grip);
  if(grip>.5){st.held='crucible';st.crucible.where='held';}
  if(carry>0)st.P=bez(STATION.cru,[-150,-178],[-10,-205],STATION.furnIn,carry);
  if(rel>0){st.gap=lerp(GAP.crucible,GAP.open,rel);}
  if(rel>.5){st.held='none';st.crucible.where='furnace';}
  st.furnace=ease5(sub(e3,.7,1));st.crucible.glow=st.furnace;
  if(rel>0)st.P=lerpPt(st.P,STATION.sampleIn,ease5(sub(e3,.9,1)));
 }
 // s4-event-4: back into the port, close on the sample, lift it out and carry it to the rig; the clamps close
 if(t>=at(e4,0)){
  const grip=ease5(sub(e4,0,.08)),carry=subE(e4,.08,.84),clampP=ease5(sub(e4,.84,1));
  st.P=STATION.sampleIn;st.gap=lerp(GAP.open,GAP.sample,grip);
  if(grip>.5)st.held='sample';
  if(carry>0)st.P=bez(STATION.sampleIn,[-10,-178],[142,-178],STATION.rig,carry);
  st.rig.clampP=clampP;
  if(clampP>.5){st.rig.sample={temp:.92,bend:0};}
  const free=has(e4)?ease5((t-(S.at(e4,1)+.25))/.35):0;
  if(free>0){st.gap=lerp(GAP.sample,GAP.open,free);st.held='none';st.rig.sample={temp:.92,bend:0};st.P=lerpPt(STATION.rig,[90,-200],ease5((t-(S.at(e4,1)+.45))/.6));}
 }
 st.warm=.8*st.furnace;
 return st;
}
/** s6: lift the glowing sample out with the tongs, carry it to the clamps as it cools, then the ram. */
export function s6Line(S:FoundryState,t:number):LineState{
 const {has,sub,subE,at,P}=S,e1='s6-event-1',e2='s6-event-2',e3='s6-event-3';
 const st:LineState={P:STATION.sampleIn,tilt:0,gap:GAP.sample,held:'sample',rackTaken:true,fallY:null,
  crucible:{where:'furnace',fill:1,glow:1,mixed:1},furnace:1,heldTemp:1,rig:{ram:0,clampP:0,needle:0,sample:null,mold:null},
  stream:0,card:{x:LINE.clipX},panel:PANEL_IDLE,warm:.8};
 if(!has(e1)||!has(e2)||!has(e3))return st;
 st.P=lerpPt(STATION.sampleIn,STATION.lifted,P(e1));
 if(t>=at(e2,0)){
  st.P=bez(STATION.lifted,[40,-290],[142,-230],STATION.rig,P(e2));
  st.heldTemp=1-.86*S.R(e2);
  st.rig.clampP=ease5(sub(e2,.8,1));
  if(st.rig.clampP>.5){st.held='none';st.rig.sample={temp:st.heldTemp,bend:0};}
 }
 if(t>=at(e3,0)){
  st.held='none';st.heldTemp=.14;
  st.gap=lerp(GAP.sample,GAP.open,ease5(sub(e3,0,.12)));
  // let go and ease up and left out of the ram's way, slowly, so the ram and the bar keep the frame
  st.P=lerpPt(STATION.rig,[66,-214],ease5(sub(e3,.05,.95)));
  const rp=subE(e3,0,1),ram=rp<.42?rp/.42:1+(rp-.42)/.58*.85,bend=clamp((ram-1)/.85);
  st.rig={ram,clampP:1,needle:138*bend+damped(t-at(e3,.42),10,2.2,3.4)+damped(S.after(e3),9,1.5,2.8),sample:{temp:.14,bend},mold:null};
 }
 st.warm=st.held==='sample'?.85*st.heldTemp:.5;
 return st;
}
/** s9: the card glows once and holds; the arm tips the crucible into the mold on the rig; the card dims
 * while the melt keeps its glow. */
export function s9Line(S:FoundryState,t:number):LineState{
 const {has,sub,subE,at,P}=S,e1='s9-event-1',e2='s9-event-2',e3='s9-event-3';
 const st:LineState={P:STATION.pourAbove,tilt:0,gap:GAP.crucible,held:'crucible',rackTaken:true,fallY:null,
  crucible:{where:'held',fill:1,glow:1,mixed:1},furnace:.75,heldTemp:1,rig:{ram:0,clampP:0,needle:0,sample:null,mold:{fill:0,glow:0}},
  stream:0,card:{x:LINE.clipX},panel:{write:1,glow:.18,dim:0,sent:1},warm:.9};
 if(!has(e1)||!has(e2)||!has(e3))return st;
 st.panel.glow=.32*smooth(sub(e1,.2,.6))+.68*Math.sin(Math.PI*sub(e1,0,.6));
 st.P=lerpPt(STATION.pourAbove,STATION.pour,ease5((t-(at(e2,0)-.9))/.7));
 const tip=100*subE(e2,0,.62),back=85*ease5(sub(e3,.32,.95));
 st.tilt=Math.max(0,tip-back);
 st.stream=t>=at(e2,0)?clamp((st.tilt-64)/16):0;
 const fill=ease5(sub(e2,.48,1));
 st.rig.mold={fill,glow:fill>0?Math.max(fill,.85):0};
 st.crucible.fill=1-.85*fill;
 st.panel.dim=P(e3);
 st.panel.glow*=1-.85*st.panel.dim;
 return st;
}

// ---- cameras ---------------------------------------------------------------------------------------
/** Cam is the composite framing a view wants: world point f lands on screen point a at scale s. Every
 * number a frame-edge bound depends on is here and exported, so the bound check composes the values
 * this file draws with. The interior stage applies no transform to the episode. */
export type Cam={f:Pt;s:number;a:Pt};
type Framing='wide'|'split'|'medium'|'close'|'detail'|'overhead';
export const camPoint=(c:Cam,p:Pt):Pt=>[c.a[0]+c.s*(p[0]-c.f[0]),c.a[1]+c.s*(p[1]-c.f[1])];
const camT=(c:Cam)=>`translate(${f2(c.a[0])} ${f2(c.a[1])}) scale(${c.s.toFixed(4)}) translate(${f2(-c.f[0])} ${f2(-c.f[1])})`;
/** Line world cameras, by view and then framing (a shared view keeps one composition per framing). */
export const LINE_CAM:Record<string,Partial<Record<Framing,Cam>>>={
 'ai-panel':{medium:{f:[250,-260],s:1.6,a:[540,720]}},
 'line-wide':{wide:{f:[-20,-200],s:.97,a:[470,800]}},
 'arm-vials':{close:{f:[-230,-150],s:1.55,a:[450,860]},medium:{f:[-200,-160],s:1.3,a:[460,870]}},
 'furnace-glow':{medium:{f:[-80,-170],s:1.3,a:[460,860]},close:{f:[-60,-170],s:1.6,a:[450,860]}},
 'rig-clamp':{detail:{f:[110,-140],s:1.7,a:[500,940]}},
 'clamp-detail':{detail:{f:[130,-120],s:1.85,a:[480,930]}},
 'arm-lift':{wide:{f:[10,-200],s:1.02,a:[460,830]}},
 'sample-glow':{close:{f:[-10,-200],s:1.9,a:[470,880]}},
 'rig-load':{close:{f:[60,-180],s:1.6,a:[470,880]},wide:{f:[10,-200],s:1.05,a:[470,850]}},
 'needle-detail':{detail:{f:[142,-220],s:2.8,a:[470,800]}},
 'gauge-needle':{detail:{f:[160,-215],s:3.2,a:[500,820]}},
 'melt-pour':{wide:{f:[80,-230],s:1.05,a:[450,840]}},
 'ai-card':{close:{f:[330,-336],s:2.4,a:[470,720]}},
 'melt-close':{close:{f:[230,-250],s:1.8,a:[480,800]}},
 'melt-hold':{detail:{f:[220,-200],s:2.2,a:[430,890]}},
 'card-dim':{medium:{f:[240,-240],s:1.55,a:[450,840]}}};
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

// ---- s1 and s2: the cabinet, the stream and the pile ------------------------------------------------
/** Where the cabinet stands in each s1 composition (screen pixels): centre and scale. */
export const CAB_AT:Record<string,{c:Pt;s:number}>={'wall-display:medium':{c:[468,760],s:1.08},'wall-display:wide':{c:[470,770],s:.98},
 'mesh-wide:wide':{c:[440,700],s:.72},'bench-overhead:overhead':{c:[470,770],s:1.02}};
/** The trillion tag: its hole sits a little right of and below the candidate point (cabinet units). */
export const COUNT_TAG={lines:['roughly a','trillion ways'],size:36,off:[44,64] as Pt,drop:240};
/** s2's bench world (line-like units, the bench top on y 0): the bench, the tray, the edge, the floor,
 * and the cabinet up and to the left whose mesh the cards stream out of. */
export const BENCH2={x0:-330,edge:260,floor:330,tray:-230,trayW:150,cab:[-250,-560] as Pt,cabS:.62,pencil:196,card:.72,N:48,flight:.55,span:2.6,base:-20};
export const emit2:Pt=[BENCH2.cab[0]+BENCH2.cabS*CANDIDATE[0],BENCH2.cab[1]+BENCH2.cabS*CANDIDATE[1]];
const hash=(i:number,k:number)=>(((i*73+k*151)%1000)+1000)%1000/1000;
/** One recipe card of the stream: where it is at time t (or null before it leaves the mesh). Pure. */
export function streamCard(i:number,t:number,start:number){
 const N=BENCH2.N,T=start+(i/N)*BENCH2.span,u=(t-T)/BENCH2.flight;
 if(u<0)return null;
 // the pile spreads right fast (it reaches the edge in s2-event-2) and left slowly (it buries the tray
 // on the left in s2-event-3)
 const k=i/N,h=hash(i,1),right=60+330*Math.pow(k,.9),left=40+260*Math.pow(k,2.5);
 const x=BENCH2.base+(h<.5?-left*(1-2*h):right*(2*h-1));
 let y=-6-58*k*Math.exp(-Math.pow((x-BENCH2.base)/170,2));
 let rot=(hash(i,2)-.5)*50;
 if(x>BENCH2.tray-BENCH2.trayW/2&&x<BENCH2.tray+BENCH2.trayW/2)y-=24+6*(i/N);
 let land:Pt=[x,y];
 if(x>BENCH2.edge-14){land=[BENCH2.edge+10+(x-BENCH2.edge)*.3,30+(x-BENCH2.edge)*.8];rot=58+hash(i,3)*30;}
 if(x>BENCH2.edge+60){land=[x-10,BENCH2.floor-6];rot=hash(i,4)*30-15;}
 if(u>=1)return {p:land,rot,flying:false};
 const q=u,arc=150+hash(i,5)*80;
 const p:Pt=[lerp(emit2[0],land[0],q),lerp(emit2[1],land[1],q)-arc*4*q*(1-q)];
 return {p,rot:lerp((hash(i,6)-.5)*120,rot,q)+200*q*(1-q)*(hash(i,7)-.5),flying:true};
}
export const S2_CAM:Record<string,Cam>={'recipe-stream:close':{f:[-40,-240],s:1.25,a:[470,840]},'desk-pile:medium':{f:[-60,-120],s:1.35,a:[450,920]},
 'bench-edge:medium':{f:[0,-200],s:1.15,a:[470,880]},'pencil-drop:detail':{f:[-20,-60],s:1.5,a:[470,960]}};
/** The hand's pinch point through s2-event-3 (bench units): in from the left to the pile, the card
 * carried to the tray, a second reach, then it stops and draws back. */
export function handAt(st:FoundryState['s2']):Pt{
 const off:Pt=[-420,-120],pick:Pt=[-130,-44],tray:Pt=[BENCH2.tray,-62],again:Pt=[-170,-70],stopAt:Pt=[-205,-170];
 let p=lerpPt(off,pick,st.handIn);
 p=lerpPt(p,tray,st.carry);
 p=lerpPt(p,again,st.reach);
 return lerpPt(p,stopAt,st.stop);
}

// ---- s3: the desk ------------------------------------------------------------------------------------
/** The desk plane in s3 (desk units, front edge v 0, back edge v -DESK.depth): the release card's and the
 * bay sheet's top left corners, the dateline mark, the grant tag's hole, the PLANNED mark. */
export const DESK={depth:340,x0:-470,x1:550,fy:.74,card:[-400,-330] as Pt,bay:[72,-335] as Pt,bayS:.9,dateMark:[330,62] as Pt,grantClip:[442,214] as Pt,grantHole:[178,250] as Pt,planned:[118,74] as Pt};
export const S3_CAM:Record<string,Cam>={'release-desk:medium':{f:[-180,-140],s:1.4,a:[470,780]},'release-desk:close':{f:[-180,-110],s:1.8,a:[470,800]},
 'stamp-close:close':{f:[-180,-160],s:1.75,a:[470,800]},'bay-blueprint:wide':{f:[40,-130],s:.86,a:[470,860]},'outline-wide:wide':{f:[120,-140],s:.9,a:[470,880]},
 'desk-overhead:overhead':{f:[-180,-175],s:1.3,a:[470,780]}};

// ---- s5: the bench with the monitor, the sample and the quote ----------------------------------------
export const BENCH5={x0:-430,x1:430,floor:330,monitor:-150,sample:[-20,-14] as Pt,quote:170,quoteS:.62};
export const S5_CAM:Record<string,Cam>={'gauge-fill:close':{f:[-150,-232],s:2,a:[450,700]},'unknown-sample:detail':{f:[-110,-125],s:2.3,a:[470,820]},
 'gauge-bench:medium':{f:[0,-200],s:1.25,a:[470,860]}};

// ---- s7 and s8: the planning sheet (calendar, week strip, tags, stamp, form) ---------------------------
/** Layout units about the sheet's centre. A pins the sheet to an easel board; B lays it on a desk. */
export const SHEET={w:860,h:560,cal:[-195,-238] as Pt,calS:.9,week:[-290,120] as Pt,goalHole:[120,236] as Pt,stamp:[0,170] as Pt,
 resultHole:[-158,268] as Pt,form:[14,-170] as Pt,formS:.82,release:[170,-276] as Pt,releaseS:.6,deskShift:330,fy:.74,easelFloor:600};
export const S78_CAM:Record<string,Cam>={
 'a:calendar-months:medium':{f:[0,-10],s:1,a:[470,770]},'a:week-strip:detail':{f:[0,170],s:1.42,a:[470,760]},'a:goal-tag:close':{f:[10,190],s:1.25,a:[470,760]},
 'a:goal-stamp:medium':{f:[0,30],s:.95,a:[470,740]},'a:unmeasured-tag:close':{f:[0,210],s:1.35,a:[470,760]},'a:date-field:detail':{f:[209,-142],s:1.9,a:[470,760]},
 'b:week-overhead:overhead':{f:[0,-330],s:1,a:[470,780]},'b:strip-close:close':{f:[0,-118],s:1.45,a:[470,800]},'b:goal-tag:detail':{f:[150,-96],s:1.8,a:[470,800]},
 'b:stamp-close:close':{f:[10,-118],s:1.45,a:[470,800]},'b:tag-bench:medium':{f:[0,-200],s:.92,a:[470,820]},'b:form-wide:wide':{f:[0,-324],s:.95,a:[470,770]}};

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

 // ---- the sample line, drawn from one LineState in line units ----
 const lineWorld=(L:LineState,tag:'s4'|'s6'|'s9',c:Cam)=>{
  const pose=poseAt(L.P,L.tilt);
  const crucibleNode=(fill:number,glow:number,mixed:number)=><FoundryArmHero part="crucible" fill={fill} glow={glow} mixed={mixed}/>;
  const held=L.held==='tubes'?<FoundryArmHero part="tubes"/>:
   L.held==='crucible'?<g transform={`translate(0 ${-CRUCIBLE.hold})`}>{crucibleNode(L.crucible.fill,L.crucible.glow,L.crucible.mixed)}</g>:
   L.held==='sample'?<Item id={tag+'-sample'}><FoundryArmHero part="sample" temp={L.heldTemp}/></Item>:undefined;
  // the crucible's lip in line units, for the melt stream, from the arm's own tool frame
  const lip=crucibleLip(pose);
  return <g transform={camT(c)}>
   <Item id={tag+'-setting'}>
    <FoundrySupport part="floor" x0={-2400} x1={2400} y={LINE.floor} to={LINE.floor+2400}/>
    {/* the ticket wire from the panel to the rack's post, and the rack post with its clip */}
    <path d={`M${LINE.postX} ${LINE.wireY}L${LINE.panel} ${LINE.wireY+4}`} stroke="#3A4147" strokeWidth={2.4}/>
    <rect x={LINE.postX-5} y={LINE.wireY-6} width={10} height={-LINE.wireY-28} rx={3} fill="#5C646A" stroke="#262C31" strokeWidth={1.6}/>
    <FoundryArmHero part="bed" x0={LINE.x0} x1={LINE.x1} floor={LINE.floor} glowX={LINE.furn} glow={L.furnace*.8}/>
   </Item>
   <Item id={tag+'-'+(tag==='s4'?'vials':'rack')}><At p={[LINE.rack,0]}><FoundryArmHero part="rack" taken={L.rackTaken}/></At>
    <rect x={LINE.cru-44} y={-6} width={88} height={8} rx={2} fill="#7B6E62" stroke="#262C31" strokeWidth={1.4}/>
    {L.crucible.where==='pad'&&<At p={[LINE.cru,-PAD_TOP]}>{crucibleNode(L.crucible.fill,L.crucible.glow,L.crucible.mixed)}</At>}</Item>
   <Item id={tag==='s4'?'s4-furnace':tag+'-furnace'}><At p={[LINE.furn,0]}><FoundryArmHero part="furnaceBack" glow={L.furnace} t={t}/></At>
    {L.crucible.where==='furnace'&&<At p={[LINE.furn,STATION.furnIn[1]-CRUCIBLE.hold]}>{crucibleNode(1,L.crucible.glow,1)}</At>}</Item>
   <Item id={tag==='s4'?'s4-test':tag==='s6'?'s6-rig':'s9-test'}><At p={[LINE.rig,0]}>
    {tag==='s9'?<Item id="s9-melt"><FoundryArmHero part="rig" ram={L.rig.ram} clampP={L.rig.clampP} needle={L.rig.needle} sample={L.rig.sample} mold={L.rig.mold} warm={L.rig.mold?.glow??0}/></Item>:
     tag==='s6'?<Item id="s6-sample"><FoundryArmHero part="rig" ram={L.rig.ram} clampP={L.rig.clampP} needle={L.rig.needle} sample={L.rig.sample} mold={L.rig.mold}/></Item>:
     <FoundryArmHero part="rig" ram={L.rig.ram} clampP={L.rig.clampP} needle={L.rig.needle} sample={L.rig.sample} mold={L.rig.mold}/>}</At></Item>
   {/* the hanging card on its wire: drawn before the panel, so it slides out from behind it */}
   {L.card&&<Item id={tag==='s9'?'s9-card-copy':tag+'-card'}><At p={[L.card.x,LINE.wireY]}>
    <path d="M0 0V12" stroke="#262C31" strokeWidth={2}/><rect x={-7} y={-5} width={14} height={14} rx={3} fill="#5C646A"/>
    <At p={[0,12+CARD.h*LINE.cardScale/2]} r={L.card.x<LINE.clipX+4?-3:-1}><FoundrySupport part="card" w={CARD.w*LINE.cardScale} ai/></At></At></Item>}
   <Item id={tag==='s4'?'s4-ai':tag==='s9'?'s9-ai':'s6-panel'}><At p={[LINE.panel,0]}><FoundrySupport part="aiPanel" write={L.panel.write} glow={L.panel.glow} dim={L.panel.dim} sent={L.panel.sent}/></At></Item>
   {/* PLANNED, hung from the wire over the line */}
   {tag==='s4'&&<Item id="s4-planned"><At p={[LINE.signX,LINE.wireY]} r={-2}>
    <path d="M-50 0L-46 22M50 2L46 22" stroke="#3A4147" strokeWidth={2}/>
    <rect x={-80} y={22} width={160} height={48} rx={6} fill="#F7F1E3" stroke="#262C31" strokeWidth={2.6}/>
    <text x={0} y={57} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#A13F2F" letterSpacing={2}>PLANNED</text></At></Item>}
   <Item id={tag==='s4'?'s4-arm':tag==='s6'?'s6-arm':'s9-arm'}>
    <FoundryArmHero part="arm" pose={pose} gap={L.gap} held={held} warm={L.warm} chainX={LINE.x1-40}/>
   </Item>
   {/* the dropped tubes fall straight into the crucible, clipped at its rim */}
   {L.fallY!==null&&<g>
    <defs><clipPath id={'af1025-fall-'+tag}><rect x={LINE.cru-60} y={-700} width={120} height={700-CRUCIBLE.h-PAD_TOP+2}/></clipPath></defs>
    <g clipPath={`url(#af1025-fall-${tag})`}><At p={[STATION.drop[0],STATION.drop[1]+L.fallY]}><FoundryArmHero part="tubes"/></At></g></g>}
   <At p={[LINE.furn,0]}><FoundryArmHero part="furnaceFront" glow={L.furnace}/></At>
   {L.stream>0&&<Item id="s9-melt-stream"><FoundryArmHero part="stream" from={lip} to={[LINE.rig,RIG.anvilTop-24]} p={L.stream} t={t}/></Item>}
  </g>;
 };

 // ---- s1: the cabinet ----
 const cabinet=(k:string)=>{const C=CAB_AT[k];if(!C)throw new Error('No cabinet placement for '+k);
  const s1=S.s1,tagP=s1.tag,hole:Pt=[CANDIDATE[0]+COUNT_TAG.off[0],CANDIDATE[1]+COUNT_TAG.off[1]-COUNT_TAG.drop*(1-tagP)];
  return <At p={C.c} s={C.s}>
   <Item id="s1-table"><Item id="s1-mesh"><FoundrySupport part="periodic" lit={s1.lit} mesh={s1.mesh} candidate={s1.candidate} t={t}/></Item></Item>
   {tagP>0&&<Item id="s1-count"><g opacity={f2(clamp(tagP*4))}>
    <Str a={CANDIDATE} b={hole} w={2.6} color="#F5E7C8"/>
    <At p={hole}><FoundrySupport part="tag" lines={COUNT_TAG.lines} size={COUNT_TAG.size} swing={-10*(1-tagP)+s1.swing}/></At></g></Item>}
  </At>;};
 // ---- s2: the stream, the pile, the tray, the pencil, the hand ----
 const benchWorld=(c:Cam,o:{cabinet:boolean;hand:boolean})=>{
  const s2=S.s2,cards:React.ReactNode[]=[],flying:React.ReactNode[]=[];
  for(let i=0;i<BENCH2.N;i++){const cd=streamCard(i,t,s2.streamStart);if(!cd)continue;
   const node=<At key={i} p={cd.p} r={cd.rot}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={i}/></At>;
   (cd.flying?flying:cards).push(node);}
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
    {sorted&&!inHand&&<At p={sortedAt} r={6}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={99}/></At>}</Item>
   <Item id="s2-pile">{cards}
    <At p={pencil} r={-24+(s2.fall>0?Math.min(260,s2.fall*720):0)} s={1}><g transform="scale(.7 1)"><FoundrySupport part="pencil" spin={(rollX-BENCH2.pencil)/6}/></g></At></Item>
   <Item id="s2-stream">{flying}</Item>
   {o.hand&&s2.handIn>0&&<Item id="s2-tag">{inHand&&<At p={sortedAt} r={inHand?-14:6}><FoundrySupport part="card" w={CARD.w*BENCH2.card} seed={99}/></At>}
    <At p={hand} r={12-10*s2.stop}><g transform="scale(-1 1)"><FoundrySupport part="hand" pinch={s2.pinch*(1-s2.drop)*(1-s2.stop)}/></g></At></Item>}
  </g>;
 };
 // ---- s3: the desk and its papers ----
 const deskWorld=(c:Cam,top:boolean)=>{
  const s3=S.s3,fy=top?1:DESK.fy,cardAt:Pt=[DESK.card[0]+520*(1-s3.slide),DESK.card[1]];
  const mark:Pt=[cardAt[0]+DESK.dateMark[0],cardAt[1]+DESK.dateMark[1]];
  // the grant tag swings in on its string from the card's clip and settles on the card beside the headline
  const gp=s3.grant,clip=DESK.grantClip,hole=DESK.grantHole,grantFrom:Pt=[hole[0]+330,hole[1]-430];
  const gpos:Pt=[lerp(grantFrom[0],hole[0],gp),lerp(grantFrom[1],hole[1],gp)-70*Math.sin(Math.PI*gp)];
  const plannedAt:Pt=[DESK.bay[0]+DESK.bayS*DESK.planned[0],DESK.bay[1]+DESK.bayS*DESK.planned[1]];
  const stampOver=(m:Pt,st:{lift:number;come:number;away:number},w:number)=>st.come<=0||st.away>=1?null:
   <At p={[m[0]+360*(1-st.come)+360*st.away,m[1]-520*(1-st.come)-520*st.away]} s={1+.4*st.lift} r={-8}><g transform={`scale(1 ${f2(1/fy)})`}><FoundrySupport part="stamp" w={w} top lift={st.lift}/></g></At>;
  return <g transform={camT(c)}>
   <Item id="s3-setting">
    {!top&&<FoundrySupport part="floor" x0={-2400} x1={2400} y={DESK.depth*.1+300} to={2400}/>}
    {top?<At p={[40,-175]}><FoundrySupport part="benchTop" w={1180} h={1100} wood/></At>:<g>
     <path d={`M${DESK.x0} 0L${DESK.x0+20} ${-DESK.depth*fy}L${DESK.x1-16} ${-DESK.depth*fy}L${DESK.x1} 0Z`} fill="#A57C55" stroke="#262C31" strokeWidth={2.6} strokeLinejoin="round"/>
     {[0,1,2,3,4].map(k=><path key={k} d={`M${DESK.x0+40} ${f2(-DESK.depth*fy*(.15+k*.18))}q300 ${(k%3-1)*5} ${DESK.x1-DESK.x0-90} ${(k%2)*4-2}`} stroke="#C29B72" strokeWidth={1.6} opacity={.45} fill="none"/>)}
     <rect x={DESK.x0} y={0} width={DESK.x1-DESK.x0} height={40} fill="#7C5A3B" stroke="#262C31" strokeWidth={2.6}/>
     <path d={`M${DESK.x0+4} 4H${DESK.x1-4}`} stroke="#C29B72" strokeWidth={3} opacity={.6}/>
     {[DESK.x0+30,DESK.x1-40].map(x=><rect key={x} x={x-12} y={40} width={24} height={260} fill="#7C5A3B" stroke="#262C31" strokeWidth={2}/>)}
    </g>}
   </Item>
   <g transform={`scale(1 ${fy})`}>
    <Item id="s3-bay"><At p={DESK.bay} s={DESK.bayS}><FoundrySupport part="bay" p={s3.bay} title={s3.title}/>
     <At p={DESK.planned} r={-8}><FoundrySupport part="impression" text="PLANNED" size={34} color="#A13F2F" p={s3.planned.inked}/></At></At></Item>
    <Item id="s3-release"><At p={cardAt} r={-5*(1-s3.slide)-1}><FoundrySupport part="release" write={s3.write}/>
     <Item id="s3-date"><At p={DESK.dateMark} r={-8}><FoundrySupport part="impression" text="Oct. 22, 2026" size={22} color="#A13F2F" p={s3.date.inked}/></At></Item>
     {gp>0&&<Item id="s3-grant"><rect x={clip[0]-6} y={clip[1]-16} width={14} height={34} rx={4} fill="#8D959B" stroke="#262C31" strokeWidth={1.8}/>
      <Str a={clip} b={gpos} w={2.6}/>
      <At p={gpos}><FoundrySupport part="tag" lines={['$2 million','grant']} size={30} swing={10*(1-gp)+s3.grantSwing}/></At></Item>}
    </At></Item>
    {stampOver(mark,s3.date,150)}
    {stampOver(plannedAt,s3.planned,170)}
   </g>
  </g>;
 };
 // ---- s5: the bench, the monitor, the sample, the quote ----
 const quoteCard=(p:Pt,s:number)=>{const s5=S.s5;return <Item id="s5-quote"><At p={[p[0]+560*(1-s5.slide),p[1]]} s={s} r={2*(1-s5.slide)}><FoundrySupport part="quote" name={s5.name} hl={s5.hl}/></At></Item>;};
 const gaugeTag=(base:Pt,s:number)=>{const s5=S.s5,G=MONITOR.gauge,x=base[0]+s*(G.x+G.w*.4),y=base[1]+s*(G.y+G.h+20);
  if(s5.tag<=0)return null;const hole:Pt=[x,y+60*(1-s5.tag)*s];
  return <Item id="s5-gauge-tag"><g opacity={f2(clamp(s5.tag*4))}><Str a={[x,base[1]+s*(G.y+G.h)]} b={hole} w={2.2*s}/>
   <At p={hole} s={s}><FoundrySupport part="tag" lines={['some behavior']} size={19} tone="ai" swing={12*(1-s5.tag)+s5.tagSwing}/></At></g></Item>;};
 const benchMonitor=(c:Cam,o:{quote:boolean})=>{const s5=S.s5,mx=BENCH5.monitor,sp=BENCH5.sample;
  const aim:Pt=[sp[0]-mx,sp[1]-28];
  return <g transform={camT(c)}>
   <Item id="s5-setting"><FoundrySupport part="floor" x0={-2400} x1={2400} y={BENCH5.floor} to={BENCH5.floor+2400}/>
    <FoundrySupport part="bench" x0={BENCH5.x0} x1={BENCH5.x1} floor={BENCH5.floor}/><At p={[-360,0]}><FoundrySupport part="mug"/></At></Item>
   <Item id="s5-gauge"><At p={[mx,0]}><FoundrySupport part="monitor" fill={s5.fill} aim={aim} aimP={s5.aim} search={s5.search}/></At></Item>
   {gaugeTag([mx,0],1)}
   <Item id="s5-sample"><At p={sp}><rect x={-30} y={4} width={60} height={10} rx={3} fill="#5C646A" stroke="#262C31" strokeWidth={1.6}/>
    <FoundryArmHero part="sample" temp={0}/></At>
    <At p={[sp[0],sp[1]-100]}><FoundrySupport part="question" p={s5.question}/></At></Item>
   {o.quote&&quoteCard([BENCH5.quote-QUOTE.w*BENCH5.quoteS/2,-quoteHeight()*BENCH5.quoteS-6],BENCH5.quoteS)}
   {o.quote&&<rect x={BENCH5.quote-QUOTE.w*BENCH5.quoteS/2-6} y={-14} width={QUOTE.w*BENCH5.quoteS+12} height={14} rx={3} fill="#C9D4D8" stroke="#262C31" strokeWidth={1.6} opacity={.85}/>}
  </g>;};
 // ---- s7 and s8: the planning sheet ----
 const sheet=(sc:'s7'|'s8',fy:number,shift:number)=>{
  const s7=S.s7,s8=S.s8,in7=sc==='s7';
  const flip=in7?s7.flip:1,fill=in7?s7.fill:1,slide=in7?s7.slide:1,goal=in7?s7.goal:1;
  const weekAt:Pt=[SHEET.week[0]+(1-slide)*720,SHEET.week[1]];
  const goalHole:Pt=[SHEET.goalHole[0]+(1-goal)*80,SHEET.goalHole[1]-(1-goal)*220];
  const st=s8.goal,resultFrom:Pt=[SHEET.resultHole[0]-260,SHEET.resultHole[1]+260],rp=in7?0:s8.tag;
  const resultHole=lerpPt(resultFrom,SHEET.resultHole,rp);
  return <g transform={`translate(0 ${f2(shift*fy)}) scale(1 ${f2(fy)})`}>
   <Item id={sc==='s7'?'s7-months':'s8-calendar'}><At p={SHEET.cal} s={SHEET.calS}><FoundrySupport part="calendar" flip={flip}/></At></Item>
   <Item id={sc==='s7'?'s7-week':'s8-week'}>{slide>0&&<At p={weekAt}><FoundrySupport part="week" fill={fill}/></At>}</Item>
   {goal>0&&<Item id={sc==='s7'?'s7-goal':'s8-goal-tag'}><g opacity={f2(clamp(goal*4))}><Str a={[SHEET.goalHole[0]-30,SHEET.week[1]+WEEK_H]} b={goalHole} w={2.6}/>
    <At p={goalHole}><FoundrySupport part="tag" lines={['goal']} size={34} swing={-12*(1-goal)+(in7?s7.goalSwing:0)}/></At></g></Item>}
   {!in7&&<Item id="s8-goal"><At p={SHEET.stamp}><FoundrySupport part="impression" text="GOAL" size={54} color="#E48A1C" p={st.inked} rot={-9}/></At>
    {st.come>0&&st.away<1&&<At p={[SHEET.stamp[0]+300*(1-st.come)+300*st.away,SHEET.stamp[1]-420*(1-st.come)-420*st.away]} s={1+.45*st.lift} r={-9}>
     <g transform={`scale(1 ${f2(1/fy)})`}><FoundrySupport part="stamp" w={210} top lift={st.lift}/></g></At>}</Item>}
   {!in7&&rp>0&&<Item id="s8-unmeasured"><Str a={[SHEET.stamp[0]-80,SHEET.stamp[1]+30]} b={resultHole} w={2.6}/>
    <At p={resultHole}><FoundrySupport part="tag" lines={['not a result']} size={30} swing={-16*(1-rp)+s8.tagSwing}/></At></Item>}
   {/* the release returns with its opening date field clipped to it; the field stays blank, one dash */}
   {!in7&&s8.form>0&&<Item id="s8-date"><g opacity={f2(clamp(s8.form*1.6))} transform={`translate(0 ${f2(60*(1-s8.form))})`}>
    <At p={SHEET.release} s={SHEET.releaseS} r={2}><FoundrySupport part="release" write={1}/></At>
    <At p={SHEET.form} s={SHEET.formS} r={-1.5}><FoundrySupport part="form" dash={s8.dash}/></At>
    <rect x={SHEET.form[0]+FORM.w*SHEET.formS-34} y={SHEET.release[1]+RELEASE.h*SHEET.releaseS-40} width={16} height={58} rx={5} fill="#8D959B" stroke="#262C31" strokeWidth={2}/></g></Item>}
  </g>;};
 const easelWorld=(sc:'s7'|'s8',c:Cam,room:boolean)=><g transform={camT(c)}>
  <Item id={sc+'-setting'}>{room&&<FoundrySupport part="floor" x0={-2400} x1={2400} y={SHEET.easelFloor} to={SHEET.easelFloor+2400}/>}
   <FoundrySupport part="easel" w={SHEET.w} h={SHEET.h} floor={SHEET.easelFloor} legs={room||fr==='close'}/></Item>
  {sheet(sc,1,0)}
 </g>;
 const deskSheetWorld=(sc:'s7'|'s8',c:Cam,top:boolean,bench:boolean)=>{const fy=top?1:SHEET.fy;
  return <g transform={camT(c)}>
   <Item id={sc+'-setting'}>{top?<At p={[0,-330]}><FoundrySupport part="benchTop" w={1200} h={1240} wood/></At>:<g>
    <FoundrySupport part="floor" x0={-2400} x1={2400} y={300} to={2700}/>
    <path d={`M-560 0L-540 ${f2(-700*fy)}L540 ${f2(-700*fy)}L560 0Z`} fill="#A57C55" stroke="#262C31" strokeWidth={2.6}/>
    <rect x={-560} y={0} width={1120} height={40} fill="#7C5A3B" stroke="#262C31" strokeWidth={2.6}/>
    {bench&&[-520,500].map(x=><rect key={x} x={x-12} y={40} width={24} height={260} fill="#7C5A3B" stroke="#262C31" strokeWidth={2}/>)}
    {bench&&<At p={[420,-470*fy]}><FoundrySupport part="mug"/></At>}</g>}</Item>
   {sheet(sc,fy,-SHEET.deskShift)}
  </g>;};

 let pic:React.ReactNode;
 switch(view){
 // ===== s1: several dozen elements, a trillion mixes =====
 case 'wall-display':{
  // the cabinet face on: tiles light, the mesh weaves, the tag settles on it as the candidate glows
  need('s1');pic=<g>{cabinet(key)}</g>;break;}
 case 'mesh-wide':{
  // A's room view: the cabinet on its stand in front of the window, a bench in the near right corner
  need('s1');const C=CAB_AT[key];
  pic=<g><Item id="s1-setting"><FoundrySupport part="floor" x0={-40} x1={1120} y={1180} to={1960}/>
   <At p={[C.c[0],1180]}><FoundrySupport part="cabinetStand" h={1180-C.c[1]-CABINET.h*C.s/2+6}/></At>
   <At p={[0,1090]}><FoundrySupport part="bench" x0={720} x1={1130} floor={90}/></At>
   <At p={[860,1074]} s={.9}><FoundrySupport part="beaker"/></At></Item>{cabinet(key)}</g>;break;}
 case 'bench-overhead':{
  // B looks straight down on the bench, where the same table lights as a display table
  need('s1');pic=<g><Item id="s1-setting"><At p={[470,860]}><FoundrySupport part="benchTop" w={1040} h={1320}/></At>
   <At p={[836,1196]} r={-30}><FoundrySupport part="pencil" spin={0}/></At>
   <circle cx={150} cy={1210} r={40} fill="#5E7F99" stroke="#262C31" strokeWidth={3}/><circle cx={150} cy={1210} r={30} fill="#3B4F60"/></Item>{cabinet(key)}</g>;break;}
 // ===== s2: no person can sort through that many =====
 case 'recipe-stream':need('s2');pic=benchWorld(cam(S2_CAM,key),{cabinet:true,hand:true});break;
 case 'desk-pile':need('s2');pic=benchWorld(cam(S2_CAM,key),{cabinet:false,hand:true});break;
 case 'bench-edge':need('s2');pic=benchWorld(cam(S2_CAM,key),{cabinet:true,hand:true});break;
 case 'pencil-drop':need('s2');pic=benchWorld(cam(S2_CAM,key),{cabinet:false,hand:true});break;
 // ===== s3: the release, its date, the grant, the planned foundry =====
 case 'release-desk':case 'stamp-close':case 'bay-blueprint':case 'outline-wide':
  // stamp-close is shared: in s3 the close on the release card, in s8 B's close on the GOAL stamp
  if(view==='stamp-close'&&sid==='s8'){pic=deskSheetWorld('s8',cam(S78_CAM,v+':'+key),false,false);break;}
  need('s3');pic=deskWorld(cam(S3_CAM,key),false);break;
 case 'desk-overhead':need('s3');pic=deskWorld(cam(S3_CAM,key),true);break;
 // ===== s4: AI proposes; the arm mixes, melts and tests =====
 case 'ai-panel':case 'line-wide':case 'arm-vials':case 'furnace-glow':case 'rig-clamp':case 'clamp-detail':
  need('s4');pic=lineWorld(s4Line(S,t),'s4',lineCamAt(view,fr,S));break;
 // ===== s5: some behavior, but not an alloy's =====
 case 'quote-card':{
  // A: the quote card on the wall, writing its speaker's name
  need('s5');pic=<g>{quoteCard([470-QUOTE.w*1.5/2,760-quoteHeight()*1.5/2],1.5)}</g>;break;}
 case 'gauge-fill':case 'unknown-sample':need('s5');pic=benchMonitor(cam(S5_CAM,key),{quote:false});break;
 case 'gauge-bench':need('s5');pic=benchMonitor(cam(S5_CAM,key),{quote:true});break;
 case 'quote-over':{
  // B close: the quote card and, on its shelf beside it, the monitor whose gauge fills partway
  need('s5');const base:Pt=[700,1230],ms=1.35;
  pic=<g>{quoteCard([40,400],1.05)}
   <Item id="s5-setting"><rect x={460} y={1230} width={480} height={18} rx={4} fill="#8D959B" stroke="#262C31" strokeWidth={2.4}/></Item>
   <Item id="s5-gauge"><At p={base} s={ms}><FoundrySupport part="monitor" fill={S.s5.fill}/></At></Item>
   {gaugeTag(base,ms)}</g>;break;}
 // ===== s6: the work is done on the actual metal =====
 case 'arm-lift':case 'sample-glow':case 'rig-load':case 'needle-detail':case 'gauge-needle':
  need('s6');pic=lineWorld(s6Line(S,t),'s6',lineCam(view,fr));break;
 // ===== s7: a week or less, not months =====
 case 'calendar-months':case 'week-strip':case 'week-overhead':case 'strip-close':need('s7');
  pic=v==='a'?easelWorld('s7',cam(S78_CAM,v+':'+key),false):deskSheetWorld('s7',cam(S78_CAM,v+':'+key),fr==='overhead',false);break;
 case 'goal-tag':need('s7');
  pic=v==='a'?easelWorld('s7',cam(S78_CAM,v+':'+key),false):deskSheetWorld('s7',cam(S78_CAM,v+':'+key),false,false);break;
 // ===== s8: a goal, not a result; no opening date =====
 case 'goal-stamp':case 'unmeasured-tag':case 'date-field':need('s8');pic=easelWorld('s8',cam(S78_CAM,v+':'+key),view==='goal-stamp');break;
 case 'tag-bench':need('s8');pic=deskSheetWorld('s8',cam(S78_CAM,v+':'+key),false,true);break;
 case 'form-wide':need('s8');pic=deskSheetWorld('s8',cam(S78_CAM,v+':'+key),true,false);break;
 // ===== s9: the AI can suggest; only the melt can answer =====
 case 'ai-card':case 'melt-close':case 'melt-pour':case 'melt-hold':case 'card-dim':
  need('s9');pic=lineWorld(s9Line(S,t),'s9',lineCam(view,fr));break;
 default:throw new Error('Unimplemented alloy foundry view '+view);
 }

 // ---- the disclosure chip: this scene's production_disclosure in this treatment's board, every frame ----
 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText),box=disclosureBox(disclosureText);
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]} rx={16} fill={ad.palette.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={ad.palette.ink}>{l}</text>)}
 </g>;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
