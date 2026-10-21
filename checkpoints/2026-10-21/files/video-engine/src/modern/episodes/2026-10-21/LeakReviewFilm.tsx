import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject,usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {InspectionDroneHero,DroneShadow,STATION,lensPoint} from './InspectionDroneHero';
import {LeakReviewSupport,PAD,VALVE_POI,LETTER,letterMarks,LONG,longHighlight,tagSize,flagHook,reviewGeom,outlinePoint,
 VIGNETTE_WHEEL,type PersonTool} from './LeakReviewSupport';

/**
 * leak-review-v1: who calls the leak (2026-10-21, Ector County, the Permian Basin). Round 2.
 *
 * ONE generic inspection drone (InspectionDroneHero) and ONE generic, unnamed certified inspector (drawn in
 * LeakReviewSupport) carry the film. The machine flies and films; the person reviews, outlines, confirms
 * and sends the follow-up. Every performed state is a closed function of the film clock and the board's
 * event windows (leakState), so any frame renders alone and the same twice:
 *
 *  s1  the station's two hood leaves open as the rotors spin up (s1-event-1); the drone lifts out of the bay
 *      and curves out over the separator, the valves and the tank (s1-event-2, one travel stroke), then
 *      cruises on; a Texas card drops its Permian Basin pin, draws the line, drops the Austin pin. B watches
 *      it through the inspection room's window, the inspector turning toward it.
 *  s2  the field tablet's flight screen lights (map, then the status strip); the companies' alert is a COOL
 *      BLUE flag that rises from the pump pressure row of the status strip, apart from any valve, route or
 *      leak; a blue tag reading the companies say swings in and hooks onto it.
 *  s3  an unsealed letter slides onto the desk and writes in; two rubber stamps press the crooked date and
 *      the approved mark (the approval amber). B's inspector looks down at it and taps her pen.
 *  s4  hovering over the pad the drone's pod swings down as the dashed plan and its plain white rings draw;
 *      it flies to the first ring, which swells white; an illustrated infrared view of the valve opens.
 *      B watches the drone's feed on a wall monitor.
 *  s5  survey footage slides onto the review screen; the inspector's stylus traces the outline round the
 *      shimmer (the outline is drawn only as far as her stylus has gone), her left index finger presses a
 *      round GREEN confirmation onto the footage, and her hand flicks the follow-up inspection tag off the
 *      footage to the valve on the pad, where it hangs on the handwheel (the turn).
 *  s6  the long letter scrolls to its protocol title, the amber highlight lands on AI, a counter tag drops.
 *  s7  a separate program: its tag settles, the easel calendar flips to January 22nd, 2027, the amber
 *      delayed bar slides onto the tag. No drone.
 *  s8  the day block turns to October 7th, a release card lands, a proposal tag clips on with an empty stamp
 *      box. Still the separate program. No drone.
 *  s9  the same inspector presses her stylus on the green confirmation, which holds; a blank dashed AI box
 *      draws beside the footage and stays empty; through the window the station's hood closes.
 *
 * Colour carries meaning once: amber is only the approval stamp, the highlighted AI and the delay bar;
 * cool blue only the companies' claim; green only the inspector's confirmation; the point of interest is
 * plain white and gray. Outdoor shots stand in the Ector County region's plate (PlaceStage) and the side
 * world is grounded on the station's row through PlaceSubject; B's room views of the outdoor scenes cut a
 * real window out of the room's wall so the region shows through it. Indoors the region is the stage's
 * window behind the desk. No full-frame background is painted. Disclosed illustration: a generic drone,
 * station and inspector, no brand mark, no real site, leak, plume, EPA seal, letter page or person.
 */

type V='a'|'b';
type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const lerpPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
const DEG=180/Math.PI;
/** A renderer-only setup ease with zero velocity and acceleration at both ends. */
export const ease5=(q:number)=>{const x=clamp(q);return x*x*x*(10+x*(-15+6*x));};
/** The board's contact curve as a plain ease, for renderer-only setup moves. */
export const contactQ=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
/** A bell for tilts that follow a stroke's speed: zero value and zero slope at both ends, 1 at the middle. */
export const bell=(r:number)=>{const x=clamp(r);return 16*x*x*(1-x)*(1-x);};
/** The time integral of smoothstep((t-a)/T) from a to t (seconds): a speed that ramps in smoothly and holds. */
export function smoothInt(t:number,a:number,T:number){const u=(t-a)/T;if(u<=0)return 0;if(u>=1)return T*.5+(t-a-T);return T*(u*u*u-u*u*u*u/2);}
/** A struck or released thing swinging about its pin, tau seconds after the impulse. Zero before it and zero
 * speed at it, so a later impulse adds onto a settled swing without a jump. Pure in tau. */
export function damped(tau:number,amp:number,hz:number,k:number){return tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.12);}
/** Rotor speed at full spin, radians a second. */
const OMEGA=2*Math.PI*11;

// ---- the side world (film pixels at the wide) ------------------------------------------------------------
/** The station's scale in the side world; the docked drone is drawn in station units inside it. */
export const SS=.75;
/** s1's one flight stroke (s1-event-2), station units: a quadratic curve from the bay straight up and out over
 * the equipment, then a cruise on over the pad (station units a second, ramped in after the stroke). */
export const S1={dock:[0,STATION.deckY] as Pt,ctrl:[0,-470] as Pt,end:[300,-490] as Pt,cruise:60};
export const s1Path=(q:number):Pt=>{const u=clamp(q),a=(1-u)*(1-u),b=2*u*(1-u),c=u*u;
 return [a*S1.dock[0]+b*S1.ctrl[0]+c*S1.end[0],a*S1.dock[1]+b*S1.ctrl[1]+c*S1.end[1]];};
/** s4's flight plan in the side world: where the drone hovers, then the three point of interest rings
 * (over the valve, the stock tank and the separator). The drone's body centre rides the route. */
export const S4={start:[560,700] as Pt,rings:[[840,792],[958,690],[612,760]] as Pt[],ringR:104,body:64};
export const DS=SS;
/** The drone origin (feet) for a body centre in the side world. */
export const droneOrigin=(c:Pt):Pt=>[c[0],c[1]+S4.body*DS];

/** A spoken clause's window from board.narration_picture. */
export type ClauseWindow={start:number;end:number};
export function leakState(W:Record<string,ActionWindow>,t:number,N:Record<string,ClauseWindow>={}){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const w=(id:string)=>W[id];
 // s1: the hood opens and the rotors spin up in s1-event-1; the lift and flight are one stroke in s1-event-2
 const w11=w('s1-event-1'),w12=w('s1-event-2');
 const a1=w11?.start??0,d1=w11?w11.end-w11.start:1,e2end=w12?.end??0;
 const q=P('s1-event-2'),pth=s1Path(q),cruise=S1.cruise*smoothInt(t,e2end,.8);
 const bob=6*Math.sin(2*Math.PI*.55*(t-e2end))*smooth((t-e2end)/.7);
 const s1={open:P('s1-event-1'),spin:smooth((t-a1)/d1),phase:OMEGA*smoothInt(t,a1,d1),fly:q,
  x:pth[0]+cruise,y:pth[1]+(t>e2end?bob:0),pitch:9*bell(clamp((R('s1-event-2')-.25)/.75))+4*smooth((t-e2end)/.8),
  // the Texas card is on screen from the first word of the Austin clause; its pins and line wait for s1-event-3
  locator:P('s1-event-3'),card:N['n1b']?smooth((t-N['n1b'].start)/.45):smooth(R('s1-event-3')/.15)};
 // s4: the pod swings down and the plan draws; the drone flies to the first ring; the IR view opens
 const w42=w('s4-event-2');
 const travel=P('s4-event-2'),c4:Pt=[lerp(S4.start[0],S4.rings[0][0],travel),lerp(S4.start[1],S4.rings[0][1],travel)+5*Math.sin(2*Math.PI*.55*t)];
 const s4={swing:P('s4-event-1'),route:P('s4-event-1'),cone:smooth(R('s4-event-1')*1.6),travel,c:c4,pitch:8*bell(R('s4-event-2')),
  arrive:w42?clamp((t-(w42.end-.15))/.7):0,on:w42&&t>=w42.end-.15?1:0,ir:P('s4-event-3'),phase:OMEGA*t};
 // s2: the screen lights, the blue flag rises on the pump pressure row and rings, the claim tag hooks onto it
 const w22=w('s2-event-2'),w23=w('s2-event-3');
 const s2={lit:P('s2-event-1'),flag:P('s2-event-2'),tag:P('s2-event-3'),
  pulse:w22?Math.sin(Math.PI*clamp((t-(w22.start+.55*(w22.end-w22.start)))/.6)):0,
  swing:w23?damped(t-w23.end,7,1.1,2.4):0,recoil:w23?damped(t-(w23.end-.04),4,1.6,3.2):0};
 // s3: the letter slides in and writes; two stamps
 const w31=w('s3-event-1'),w33=w('s3-event-3');
 const s3={slide:P('s3-event-1'),write:w31?clamp((t-(w31.start+.45*(w31.end-w31.start)))/1.5):0,date:stampState(w('s3-event-2'),t),approved:stampState(w33,t),
  // the inspector's pen taps twice on the desk after the approved mark lands
  tap:w33?Math.abs(Math.sin(2*Math.PI*1.6*Math.max(0,t-(w33.start+STAMP.press*(w33.end-w33.start)+.2))))*clamp(1.6-(t-(w33.start+.5))/.8)*smooth((t-(w33.start+.4))/.2):0};
 // s5: the footage arrives; her stylus traces the outline; her finger presses the green mark; she flicks the tag
 const w52=w('s5-event-2'),w53=w('s5-event-3'),r52=R('s5-event-2'),u52=w52?(t-w52.start)/(w52.end-w52.start):0;
 const A52=w52?.start??0,pressAt=w52?w52.start+.78*(w52.end-w52.start):0,d53=w53?w53.end-w53.start:1;
 const s5={arrive:P('s5-event-1'),approach:w52?ease5((t-(A52-.7))/.7):0,trace:w52?ease5(r52/.66):0,retreat:w52?ease5((u52-.68)/.5):0,
  nearGo:w52?ease5((r52-.3)/.42):0,press:w52?contactQ((r52-.7)/.1)*(1-ease5((r52-.82)/.14)):0,confirm:w52?smooth((r52-.77)/.06):0,
  jolt:w52?damped(t-pressAt,4,2.2,5):0,
  toTag:w53?ease5((t-(w53.start-.5))/.5):0,follow:P('s5-event-3'),flick:w53?ease5((t-w53.start)/(.35*d53)):0,release:w53?ease5((t-(w53.start+.35*d53))/.7):0,
  hang:w53?damped(t-w53.end,8,1,2.2):0,hot:w53?smooth((t-w53.end+.1)/.5):0};
 // s6: the page scrolls to the title, the highlight lands, the counter tag drops in
 const w63=w('s6-event-3');
 const s6={scroll:P('s6-event-1'),hl:P('s6-event-2'),count:P('s6-event-3'),swing:w63?damped(t-w63.end,5,1.2,2.6):0};
 // s7: the program tag drops and settles, the calendar flips, the amber delayed bar slides on
 const w71=w('s7-event-1'),w73=w('s7-event-3');
 const s7={drop:P('s7-event-1'),settle:w71?damped(t-w71.end,1.6,1.4,3):0,flip:P('s7-event-2'),bar:P('s7-event-3'),
  jostle:w73?damped(t-w73.end+.02,2.4,1.8,3.4):0};
 // s8: the day block turns, the release card slides in, the proposal tag clips on, its empty box draws
 const w81=w('s8-event-1'),w82=w('s8-event-2'),r81=R('s8-event-1');
 const s8={day:ease5(r81/.6),card:w81?actionProgress({...w81,start:w81.start+.35*(w81.end-w81.start)},t):0,
  prop:P('s8-event-2'),hang:w82?damped(t-w82.end,6,1.1,2.4):0,box:P('s8-event-3')};
 // s9: her stylus comes back to the green mark and presses it (one ring), the AI box draws, the hood closes
 const w91=w('s9-event-1'),r91=R('s9-event-1');
 const s9={come:w91?ease5((t-(w91.start-.8))/.8):0,press:w91?contactQ(r91/.25)*(1-ease5((r91-.45)/.3)):0,pulse:w91?clamp((r91-.18)/.6):0,
  back:w91?ease5((r91-.5)/.35):0,box:P('s9-event-2'),open:1-P('s9-event-3'),ready:smooth((R('s9-event-3')-.7)/.3),
  look:P('s9-event-3')};
 return {s1,s2,s3,s4,s5,s6,s7,s8,s9,P,R};
}
export type LeakState=ReturnType<typeof leakState>;
/** A stamp's choreography around its event window: raised and coming in before it, pressing down in the
 * first quarter (contact curve), holding, then lifting away. `lift` 1 is fully raised, `inked` is when the
 * mark appears, `away` carries it off after the lift. */
export const STAMP={press:.26,hold:.18,approach:.7};
export function stampState(win:ActionWindow|undefined,t:number){
 if(!win)return {lift:1,inked:0,come:0,away:0};
 const dur=win.end-win.start,r=(t-win.start)/dur;
 const come=ease5((t-(win.start-STAMP.approach))/STAMP.approach);
 if(r<0)return {lift:1,inked:0,come,away:0};
 if(r<STAMP.press)return {lift:1-contactQ(r/STAMP.press),inked:0,come:1,away:0};
 const inked=1;
 if(r<STAMP.press+STAMP.hold)return {lift:0,inked,come:1,away:0};
 const u=(r-STAMP.press-STAMP.hold)/(1-STAMP.press-STAMP.hold);
 return {lift:ease5(u*1.4),inked,come:1,away:ease5((u-.35)/.65)};
}

// ---- the inspector's hands on the review screen (screen units of the tablet the view draws) ---------------
/** Where her two hands are on a review screen W by H at this moment, in s5 or s9: the stylus tip of her
 * working hand (`far`), her left index fingertip (`near`), how hard the finger presses, and where the
 * follow-up tag is along its flight (u). Pure: the drawing and the bound check share it. */
export function reviewHands(st:LeakState,sid:'s5'|'s9',W:number,H:number,wheel:Pt|null=null,rest?:{far:Pt;near:Pt}){
 const g=reviewGeom(W,H),[fx,fy,fw,fh]=g.foot;
 const restF:Pt=rest?.far??(sid==='s9'?[g.green[0]-W*.12,g.green[1]+H*.2]:[fx+fw*.3,fy+fh+H*.06]),restN:Pt=rest?.near??[W*.5,H*.98],hover:Pt=[g.green[0]-10,g.green[1]-H*.05];
 if(sid==='s9'){
  const s=st.s9,over:Pt=[g.green[0]-6,g.green[1]-H*.07],press:Pt=[g.green[0]-2,g.green[1]-2],after:Pt=[g.green[0]-W*.08,g.green[1]+H*.16];
  const far=s.back>0?lerpPt(lerpPt(over,press,s.press),after,s.back):lerpPt(lerpPt(restF,over,s.come),press,s.press);
  return {far,near:restN,press:0,farTool:'stylus' as PersonTool};
 }
 const s=st.s5,start=outlinePoint(W,H,0);
 let far=lerpPt(restF,start,s.approach);
 if(s.trace>0)far=outlinePoint(W,H,s.trace);
 // after the trace her stylus settles just below and left of the outline, off the footage's subject
 if(s.retreat>0)far=lerpPt(outlinePoint(W,H,1),[g.shimmer[0]-g.rx*1.3,g.shimmer[1]+g.ry*1.35],s.retreat);
 const pressed:Pt=[g.green[0]-2,g.green[1]-2];
 let near=lerpPt(restN,hover,s.nearGo);
 near=lerpPt(near,pressed,s.press);
 const pick:Pt=[g.green[0]+8,g.green[1]+6];
 if(s.toTag>0)near=lerpPt(near,pick,s.toTag);
 // the flick: her finger carries the tag off the footage on its own rest-to-rest stroke, then lets it fly
 if(s.flick>0)near=lerpPt(pick,followPoint(W,H,wheel,FLICK),s.flick);
 if(s.release>0)near=lerpPt(near,restN,s.release);
 return {far,near,press:s.press,farTool:'stylus' as PersonTool};
}
/** How much of the follow-up tag's flight her finger carries it before letting it go. */
export const FLICK=.14;
/** The follow-up tag's flight from the green mark on the footage to a target (screen units of the tablet,
 * or the view's vignette handwheel in tablet units when given): a quadratic arc over the screen. */
export function followPoint(W:number,H:number,wheel:Pt|null,u:number):Pt{
 const g=reviewGeom(W,H),a:Pt=[g.green[0]+8,g.green[1]+6],b:Pt=wheel??[W*.8,H*1.4];
 const c:Pt=[(a[0]+b[0])/2+90,Math.min(a[1],b[1])-110],v=clamp(u);
 return [(1-v)*(1-v)*a[0]+2*v*(1-v)*c[0]+v*v*b[0],(1-v)*(1-v)*a[1]+2*v*(1-v)*c[1]+v*v*b[1]];
}
// ---- cameras. Every number a frame-edge bound depends on is here and exported, so the bound check
// composes the values this file draws with (Cam, then the plate camera's PlaceSubject). ------------------
export type Cam={f:Pt;s:number;a:Pt};
type Framing='wide'|'split'|'medium'|'close'|'detail'|'overhead';
/** PlaceStage's framing zoom, about the plate centre. A side-world camera keeps the world's horizon on the
 * row where the stage draws the plate's horizon for that framing, so the pad's far edge meets the plate. */
export const STAGE_ZOOM:Record<Framing,number>={wide:1,split:1.04,medium:1.08,close:1.18,detail:1.3,overhead:1};
export const horizonRow=(fr:Framing)=>960+STAGE_ZOOM[fr]*(PAD.horizon-960);
export const horizonCam=(fr:Framing,f:Pt,s:number,ax:number):Cam=>({f,s,a:[ax,horizonRow(fr)-s*(PAD.horizon-f[1])]});
/** How much of the drone's s4 flight the close's camera follows: enough to keep the drone large, little
 * enough that neither the drone nor the pad behind it slides fast across the frame. */
export const POI_FOLLOW=.6;
/** The side world's camera for each view that looks at it through the region (outdoors, or through B's
 * room window). Only poi-close moves: it follows s4-event-2's own travel curve, from rest to rest. */
export function sideCam(view:string,st:LeakState):Cam{
 switch(view){
 case 'station-wide':case 'route-wide':return horizonCam('wide',[540,PAD.horizon],1,540);
 case 'equipment-low':return horizonCam('medium',[520,980],1.2,520);
 case 'room-window':return horizonCam('medium',[540,1000],.8,700);
 case 'poi-close':return horizonCam('close',[S4.start[0]+POI_FOLLOW*st.s4.travel*(S4.rings[0][0]-S4.start[0]),760],1.9,500);
 case 'infrared-view':return horizonCam('detail',[820,900],1.6,640);
 default:throw new Error('No side-world camera for '+view);
 }
}
/** The drone's live feed on B's wall monitor: the same side world, framed for the monitor's screen. */
export const FEED_CAM:Record<string,Cam>={'room-feed':{f:[700,780],s:.5,a:[225,150]},'feed-lens':{f:[800,860],s:1,a:[480,330]}};
export const camPoint=(c:Cam,p:Pt):Pt=>[c.a[0]+c.s*(p[0]-c.f[0]),c.a[1]+c.s*(p[1]-c.f[1])];
/** The place stage's plate centre in film pixels, about which its framing zoom scales a grounded subject. */
export const PLATE_CENTRE:Pt=[540,960];
/** Cam is the composite framing a view wants. A grounded subject is already scaled by the stage's zoom z
 * about the plate centre, so the group applies s/z about the matching focus and the composite is Cam. */
export function camTransform(c:Cam,z:number){
 const fx=PLATE_CENTRE[0]+z*(c.f[0]-PLATE_CENTRE[0]),fy=PLATE_CENTRE[1]+z*(c.f[1]-PLATE_CENTRE[1]);
 return {a:c.a,s:c.s/z,f:[fx,fy] as Pt};
}
const CamG:React.FC<{c:Cam;z:number;children:React.ReactNode}>=({c,z,children})=>{const k=camTransform(c,z);
 return <g transform={`translate(${f2(k.a[0])} ${f2(k.a[1])}) scale(${k.s.toFixed(5)}) translate(${f2(-k.f[0])} ${f2(-k.f[1])})`}>{children}</g>;};
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;
/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${r.toFixed(3)}) scale(${s.toFixed(4)})`} opacity={o}>{children}</g>;

// ---- layouts in screen pixels -----------------------------------------------------------------------------
/** The Texas card in s1: screen top left under the disclosure chip, clear of the stage's county locator. */
export const LOCATOR={at:[44,262] as Pt,w:320};
/** s4's infrared view, opening out of the lens to its rectangle: screen pixels in A's detail, monitor
 * screen units in B's feed-lens. */
export const IR_AT:Record<string,{x:number;y:number;w:number;h:number}>={'infrared-view':{x:56,y:300,w:500,h:380},'feed-lens':{x:30,y:30,w:400,h:300}};
/** B's room in the two outdoor scenes: the window cut into the wall, and the wall monitor. */
export const ROOM_HOLE:Record<string,{x:number;y:number;w:number;h:number}>={'room-window':{x:380,y:300,w:680,h:870},'room-feed':{x:60,y:330,w:430,h:520},'feed-lens':{x:560,y:60,w:520,h:250}};
export const MONITOR:Record<string,{x:number;y:number;W:number;H:number}>={'room-feed':{x:560,y:390,W:450,H:300},'feed-lens':{x:40,y:400,W:960,H:640}};
/** A tablet on the desk: top left of its screen, screen size, and whether it stands. */
export type TabletAt={x:number;y:number;W:number;H:number;stand:boolean;rot?:number};
export const TABLET:Record<string,TabletAt>={
 'alert-panel':{x:190,y:470,W:700,H:460,stand:true},'panel-wide':{x:260,y:520,W:560,H:368,stand:true},'room-monitor':{x:470,y:560,W:500,H:330,stand:true},
 'review-wide':{x:430,y:560,W:500,H:330,stand:true},'room-review':{x:520,y:540,W:440,H:290,stand:true},'review-panel':{x:190,y:470,W:700,H:460,stand:true},
 'followup-tag':{x:40,y:300,W:760,H:500,stand:true},'mark-hands':{x:40,y:260,W:900,H:590,stand:true},
 'confirm-hold':{x:190,y:470,W:700,H:460,stand:true},'confirm-close':{x:50,y:320,W:980,H:640,stand:true},
 'room-hold':{x:500,y:560,W:460,H:304,stand:true},'window-wide':{x:330,y:640,W:420,H:277,stand:true},'blank-box':{x:-170,y:420,W:1000,H:660,stand:true}};
/** The desk's back edge for each view that has a desk. */
export const DESK_Y:Record<string,number>={'alert-panel':860,'panel-wide':930,'room-monitor':890,'letter-desk':700,'letter-wide':800,'room-desk':900,
 'review-panel':860,'review-wide':900,'room-review':880,'letter-scroll':1060,'room-letter':1040,'program-calendar':800,'program-wide':880,'room-calendar':900,
 'proposal-wide':880,'room-proposal':940,'confirm-hold':860,'window-wide':920,'room-hold':900,'room-window':1210,'room-feed':1120};
/** The approval letter on the desk: top left, scale and foreshortening (letter units to screen). */
export type PaperAt={x:number;y:number;s:number;fy:number;r?:number};
export const LETTER_AT:Record<string,PaperAt>={'letter-desk':{x:250,y:720,s:.95,fy:.8,r:-2},'letter-wide':{x:300,y:820,s:.8,fy:.8,r:-2},
 'approval-close':{x:60,y:150,s:1.45,fy:1},'room-desk':{x:420,y:930,s:.6,fy:.72,r:-4},'stamp-reaction':{x:150,y:180,s:1.3,fy:1,r:-1}};
/** Where the letter starts its slide onto the desk (s3-event-1): from the right, partly in frame. */
export const LETTER_FROM=310;
/** s6: the long letter's placement and its scroll (letter units) from the start of s6-event-1. */
export const LONG_AT:Record<string,{x:number;titleY:number;s:number}>={'title-detail':{x:0,titleY:640,s:1.45},'letter-scroll':{x:240,titleY:700,s:1},'room-letter':{x:396,titleY:720,s:.85}};
export const LONG_SCROLL=262;
/** The document holder each s6 desk view stands the long letter in. */
export const HOLDER:Record<string,{x:number;y:number;w:number;h:number}>={'letter-scroll':{x:214,y:330,w:652,h:720},'room-letter':{x:380,y:360,w:540,h:640}};
/** s7 and s8: the program tag's hole, text size, the blank band that takes the delayed bar, and its turn. */
export const PROGRAM_LINES=['Leak reporting by','certified third parties'];
/** How far above the desk the program tag is held before s7-event-1 sets it down (pixels). */
export const PROGRAM_DROP=140;
export const PROGRAM_AT:Record<string,{x:number;y:number;size:number;extra:number;r:number}>={
 'program-calendar':{x:120,y:1010,size:40,extra:90,r:-3},'program-wide':{x:140,y:1050,size:36,extra:80,r:-3},'room-calendar':{x:380,y:1040,size:30,extra:66,r:-3},
 'proposal-close':{x:80,y:900,size:40,extra:90,r:-3},'proposal-wide':{x:120,y:1000,size:34,extra:76,r:-3},'room-proposal':{x:330,y:1100,size:28,extra:60,r:-3}};
export const CAL_AT:Record<string,{x:number;y:number;w:number}>={'program-calendar':{x:680,y:470,w:260},'program-wide':{x:720,y:616,w:220},'room-calendar':{x:690,y:640,w:220}};
export const DAY_AT:Record<string,{x:number;y:number;w:number;card:Pt;cardW:number}>={'proposal-close':{x:690,y:300,w:220,card:[620,560],cardW:280},
 'proposal-wide':{x:740,y:700,w:170,card:[730,905],cardW:180},'room-proposal':{x:720,y:790,w:160,card:[640,960],cardW:240}};
export const PROPOSAL_AT:Record<string,{x:number;y:number;size:number;extra:number}>={'proposal-close':{x:480,y:1060,size:40,extra:80},
 'proposal-wide':{x:430,y:1110,size:34,extra:70},'room-proposal':{x:560,y:1160,size:28,extra:52}};
/** s5: the round field vignette of the valve on the pad that the follow-up tag is flicked to. */
export const VIGNETTE_AT:Record<string,{c:Pt;r:number}>={'followup-tag':{c:[470,1010],r:200},'mark-hands':{c:[560,1080],r:150},
 'review-panel':{c:[760,1130],r:110},'review-wide':{c:[760,1120],r:100},'room-review':{c:[760,1080],r:100}};
/** The stage's window rectangles (PlaceStage WINDOW), used only if the stage gives none. */
export const STAGE_WINDOW:Record<string,{x:number;y:number;w:number;h:number}>={wide:{x:96,y:440,w:888,h:540},medium:{x:40,y:410,w:1000,h:640}};
/** s9: the station outside the window, and the far equipment beside it, in every s9 view. The near views
 * draw their own small window (the stage gives a close or a detail no window, only its light). */
export const WINDOW_STATION:Record<string,{at:Pt;s:number;eqU:number;eqS:number;own?:{x:number;y:number;w:number;h:number}}>={
 'window-wide':{at:[880,872],s:.36,eqU:.97,eqS:.26},'room-hold':{at:[160,872],s:.3,eqU:.42,eqS:.26},
 'blank-box':{at:[712,374],s:.28,eqU:.72,eqS:.24,own:{x:600,y:150,w:400,h:250}},
 'confirm-hold':{at:[978,846],s:.24,eqU:.06,eqS:.24},'confirm-close':{at:[748,252],s:.2,eqU:.8,eqS:.17,own:{x:640,y:96,w:360,h:170}}};
/** Where the inspector sits in each view she is in (hip on the seat, figure scale), her base lean and head
 * turn, and where her hands rest when no event moves them (screen pixels). Close views place her large and
 * low so only her shoulder, forearm and hands enter the frame. */
export type PersonAt={at:Pt;s:number;lean:number;head:number;farRest:Pt;nearRest:Pt;nearTool?:PersonTool};
export const PERSON_AT:Record<string,PersonAt>={
 'room-window':{at:[170,1260],s:1,lean:4,head:6,farRest:[430,1230],nearRest:[300,1250],nearTool:'pen'},
 'room-monitor':{at:[190,1230],s:1,lean:2,head:-2,farRest:[480,960],nearRest:[330,1190],nearTool:'pen'},
 'room-desk':{at:[170,1200],s:.95,lean:4,head:-4,farRest:[430,1150],nearRest:[300,1200],nearTool:'pen'},
 'stamp-reaction':{at:[-160,2150],s:2,lean:16,head:-10,farRest:[60,1560],nearRest:[300,1150],nearTool:'pen'},
 'room-feed':{at:[290,1270],s:1.05,lean:4,head:8,farRest:[560,1200],nearRest:[420,1240],nearTool:'pen'},
 'feed-lens':{at:[-60,1500],s:1.5,lean:12,head:10,farRest:[330,1140],nearRest:[180,1220]},
 'room-review':{at:[230,1190],s:1,lean:2,head:0,farRest:[560,880],nearRest:[380,1150]},
 'review-wide':{at:[180,1190],s:.95,lean:2,head:0,farRest:[470,920],nearRest:[330,1150]},
 'review-panel':{at:[40,1420],s:1.5,lean:10,head:6,farRest:[0,0],nearRest:[0,0]},
 'confirm-hold':{at:[40,1420],s:1.5,lean:10,head:6,farRest:[0,0],nearRest:[0,0]},
 'followup-tag':{at:[-20,1800],s:2.1,lean:14,head:6,farRest:[0,0],nearRest:[0,0]},
 'mark-hands':{at:[-120,1850],s:2.3,lean:14,head:6,farRest:[0,0],nearRest:[0,0]},
 'confirm-close':{at:[-140,1980],s:2.2,lean:14,head:6,farRest:[0,0],nearRest:[0,0]},
 'blank-box':{at:[-300,2100],s:2.3,lean:14,head:6,farRest:[0,0],nearRest:[0,0]},
 'room-hold':{at:[300,1200],s:1,lean:8,head:2,farRest:[560,960],nearRest:[440,1150]},
 'window-wide':{at:[150,1210],s:.95,lean:6,head:2,farRest:[340,960],nearRest:[300,1160]},
 'room-letter':{at:[170,1240],s:.95,lean:4,head:4,farRest:[420,1180],nearRest:[290,1220],nearTool:'pen'},
 'room-calendar':{at:[200,1170],s:.95,lean:4,head:-6,farRest:[440,1120],nearRest:[320,1160],nearTool:'pen'},
 'room-proposal':{at:[180,1200],s:1,lean:4,head:-8,farRest:[440,1150],nearRest:[300,1190],nearTool:'pen'}};
/** Screen pixels to the inspector's figure units for a view. Pure. */
export const toPerson=(A:PersonAt,p:Pt):Pt=>[(p[0]-A.at[0])/A.s,(p[1]-A.at[1])/A.s];
type PropRow={kind:'hardhat'|'mug'|'pen';x:number;y:number;s:number;r?:number;top?:boolean};
/** Desk dressing per view: a hard hat, a mug, a pen, never symmetric, clear of the caption band. */
export const PROPS:Record<string,PropRow[]>={
 'alert-panel':[{kind:'hardhat',x:110,y:1060,s:.8},{kind:'mug',x:975,y:1050,s:.75},{kind:'pen',x:520,y:1150,s:.9,r:-6,top:true}],
 'panel-wide':[{kind:'hardhat',x:150,y:1060,s:.7},{kind:'mug',x:960,y:1040,s:.65},{kind:'pen',x:560,y:1150,s:.8,r:-6,top:true}],
 'room-monitor':[{kind:'mug',x:1000,y:1060,s:.65}],
 'letter-desk':[{kind:'mug',x:975,y:900,s:.75},{kind:'pen',x:80,y:1190,s:.9,r:-14,top:true}],
 'letter-wide':[{kind:'hardhat',x:140,y:960,s:.7},{kind:'mug',x:975,y:990,s:.7},{kind:'pen',x:90,y:1220,s:.8,r:-10,top:true}],
 'room-desk':[{kind:'hardhat',x:940,y:1030,s:.6},{kind:'mug',x:860,y:1110,s:.55}],
 'review-panel':[{kind:'mug',x:975,y:1050,s:.75}],
 'review-wide':[{kind:'hardhat',x:990,y:1020,s:.55}],
 'room-review':[{kind:'mug',x:1010,y:1050,s:.55}],
 'program-calendar':[{kind:'mug',x:990,y:1060,s:.7}],
 'program-wide':[{kind:'hardhat',x:960,y:1060,s:.6},{kind:'mug',x:90,y:960,s:.6}],
 'room-calendar':[{kind:'hardhat',x:990,y:1110,s:.55}],
 'proposal-wide':[{kind:'mug',x:1000,y:1000,s:.6}],
 'room-proposal':[{kind:'mug',x:1000,y:1100,s:.55}],
 'confirm-hold':[{kind:'mug',x:975,y:1050,s:.75}],
 'window-wide':[{kind:'hardhat',x:850,y:1080,s:.6},{kind:'mug',x:1000,y:1060,s:.5}],
 'room-hold':[{kind:'hardhat',x:1010,y:1060,s:.5}]};
/** Paper on the desk: letter units to screen, rotation after scale and foreshortening. Pure. */
export const paperTransform=(L:PaperAt)=>`translate(${f2(L.x)} ${f2(L.y)}) rotate(${f2(L.r??0)}) scale(${L.s} ${f2(L.s*L.fy)})`;
export const paperPt=(L:PaperAt,p:Pt):Pt=>{const a=(L.r??0)/DEG,x=L.s*p[0],y=L.s*L.fy*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
/** A tablet's screen point in film pixels. Pure. */
export const tabletPt=(T:TabletAt,p:Pt):Pt=>{const a=(T.rot??0)/DEG,c=Math.cos(a),s=Math.sin(a);return [T.x+p[0]*c-p[1]*s,T.y+p[0]*s+p[1]*c];};
/** s1's drone lamp: the strip and nose lamp blink softly about once a second while it flies. */
export const blinkLamp=(t:number)=>.55+.45*Math.max(0,Math.sin(2*Math.PI*t/1.1));
/** s4: the lens's world point for a drone body centre, pitch and pod tilt; the pod tilt that aims the lens
 * at the point of interest valve from there. */
export function lensWorld(c:Pt,pitch:number,pod:number):Pt{
 const o=droneOrigin(c),{p}=lensPoint(pod),a=pitch/DEG,x=p[0],y=p[1]+S4.body,ca=Math.cos(a),sa=Math.sin(a);
 return [o[0]+DS*(x*ca-y*sa),o[1]-S4.body*DS+DS*(x*sa+y*ca)];
}
export function aimPod(c:Pt,pitch:number){
 let pod=55;for(let i=0;i<3;i++){const l=lensWorld(c,pitch,pod);pod=Math.atan2(VALVE_POI[1]-l[1],VALVE_POI[0]-l[0])*DEG-pitch;}
 return pod;
}
export const S4_POD0=12;
export function s4Pod(st:LeakState){const c=st.s4.c,aim=aimPod(c,st.s4.pitch);return lerp(S4_POD0,aim,st.s4.swing);}
/** The inspector's head and lean reactions in B's room views, from the scene's own events: she turns to
 * the window as the hood opens, to the screen as it lights, down to the letter as it lands, leans in to the
 * feed and the footage, follows the program tag and the calendar, and turns to the day block. */
export function reaction(view:string,st:LeakState):{lean:number;head:number}{
 const P=st.P;
 switch(view){
 case 'room-window':return {lean:6*P('s1-event-1'),head:8*P('s1-event-1')-4*P('s1-event-2')};
 case 'room-monitor':return {lean:7*P('s2-event-2'),head:6*P('s2-event-1')-3*P('s2-event-3')};
 case 'room-desk':return {lean:6*P('s3-event-1'),head:-16*P('s3-event-1')};
 case 'stamp-reaction':return {lean:0,head:-4*P('s3-event-3')};
 case 'room-feed':return {lean:10*P('s4-event-1'),head:4*P('s4-event-1')};
 case 'feed-lens':return {lean:4*P('s4-event-3'),head:-3*P('s4-event-3')};
 case 'room-review':case 'review-wide':return {lean:10*P('s5-event-1'),head:4*P('s5-event-1')};
 case 'room-letter':return {lean:8*P('s6-event-1'),head:-6*P('s6-event-1')};
 case 'room-calendar':return {lean:4*P('s7-event-1'),head:-12*P('s7-event-1')+20*P('s7-event-2')};
 case 'room-proposal':return {lean:5*P('s8-event-1'),head:14*P('s8-event-1')-8*P('s8-event-2')};
 case 'room-hold':case 'window-wide':case 'confirm-hold':case 'review-panel':return {lean:0,head:4*st.s9.look};
 default:return {lean:0,head:0};
 }
}

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}
/** The chip's box for a disclosure string, shared with the frame-edge check. */
export function disclosureBox(text:string):[number,number,number,number]{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}
export const LeakReviewFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Leak review film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Leak review film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const N=Object.fromEntries(board.narration_picture!.clauses.map(c=>[c.id,{start:c.start_s,end:c.end_s}]));
 const S=leakState(W,t,N);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing;
 const exterior=!scene.interior&&fr!=='overhead';
 const flat=ad.flat_shots?.[sid];
 const place=usePlace(),z=place&&place.mode==='exterior'?place.zoom:1;

 // ---- the side world (s1, s4): the pad, the station, the drone, the plan ----
 const padWorld=(o:{station:React.ReactNode;air?:React.ReactNode;hot?:number;grounded:boolean})=><Grounded baseY={PAD.stationY} on={o.grounded}>
  <Item id={sid+'-setting'}><Item id={sid+'-equipment'}><LeakReviewSupport part="padSide" t={t} hot={o.hot}/></Item></Item>
  {o.station}{o.air}
 </Grounded>;
 const s1Station=()=>{
  const h=STATION.deckY-S.s1.y;
  return <Item id="s1-station"><g transform={`translate(${PAD.stationX} ${PAD.stationY}) scale(${SS})`}>
   <InspectionDroneHero part="station" open={S.s1.open} t={t} lamp={blinkLamp(t)}>
    {h>70&&<g transform={`translate(${f2(S.s1.x+.35*(h+70))} 0)`}><DroneShadow h={h+70}/></g>}
    <Item id="s1-drone"><g transform={`translate(${f2(S.s1.x)} ${f2(S.s1.y)}) rotate(${f2(S.s1.pitch)} 0 -64)`}>
     <InspectionDroneHero part="side" spin={S.s1.spin} phase={S.s1.phase} pod={8} lamp={blinkLamp(t)}/></g></Item>
   </InspectionDroneHero>
  </g></Item>;
 };
 const s4Drone=(cone=true)=>{
  const c=S.s4.c,o=droneOrigin(c),pod=s4Pod(S),l=lensWorld(c,S.s4.pitch,pod);
  const coneLen=Math.hypot(VALVE_POI[0]-l[0],VALVE_POI[1]-l[1])/DS;
  return <Item id="s4-drone"><g transform={`translate(${f2(o[0])} ${f2(o[1])}) scale(${DS}) rotate(${f2(S.s4.pitch)} 0 ${-S4.body})`}>
   <InspectionDroneHero part="side" spin={1} phase={S.s4.phase} pod={pod} lamp={blinkLamp(t)} cone={cone?S.s4.cone:0} coneLen={coneLen}/></g></Item>;
 };
 const s4Air=()=>{
  const pts:Pt[]=[S4.start,...S4.rings];
  return <g>
   <Item id="s4-route"><LeakReviewSupport part="route" pts={pts} p={S.s4.route} w={6}/></Item>
   <Item id="s4-poi">{S4.rings.map((r,k)=><At key={k} p={r}><LeakReviewSupport part="poi" r={S4.ringR*(k?.7:1)} on={k?0:S.s4.on} pulse={k?0:S.s4.arrive}
    drop={k===0?VALVE_POI[1]-r[1]-30:k===1?PAD.tank.top-r[1]-24:PAD.separator.cy-PAD.separator.r-r[1]-8} show={smooth(S.s4.route*3-k*.6)}/></At>)}</Item>
   {s4Drone()}
  </g>;
 };
 const s4Station=<Item id="s4-setting"><g transform={`translate(${PAD.stationX} ${PAD.stationY}) scale(${SS})`}><InspectionDroneHero part="station" open={1} t={t} lamp={.6}/></g></Item>;
 /** The infrared view opening out of the lens to its rectangle, in the given camera's units. */
 const irInset=(cam:Cam,R:{x:number;y:number;w:number;h:number}|undefined,label:number)=>{
  const p=S.s4.ir;if(!R||p<=0)return null;
  const l=camPoint(cam,lensWorld(S.s4.c,S.s4.pitch,s4Pod(S))),k=smooth(p);
  const x=lerp(l[0],R.x,k),y=lerp(l[1],R.y,k),w=lerp(8,R.w,k),h=lerp(6,R.h,k);
  return <Item id="s4-infrared"><g data-part="ir-inset">
   <path d={`M${f2(l[0])} ${f2(l[1])}L${f2(x+w)} ${f2(y)}M${f2(l[0])} ${f2(l[1])}L${f2(x+w)} ${f2(y+h)}`} stroke={pal.paper} strokeWidth={3} strokeDasharray="10 8" opacity={.8*k}/>
   <rect x={x+8} y={y+12} width={w} height={h} rx={14} fill="#1A1410" opacity={.25*k}/>
   <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(w/R.w)} ${f2(h/R.h)})`}>
    <rect x={-8} y={-8} width={R.w+16} height={R.h+16} rx={16} fill={pal.paper}/>
    <LeakReviewSupport part="irView" W={R.w} H={R.h} t={t} label={label}/>
   </g></g></Item>;
 };
 /** B's wall monitor: the drone's live feed of the same pad, its own sky behind the world. */
 const feedMonitor=(key:string)=>{
  const M=MONITOR[key],cam=FEED_CAM[key];
  return <g transform={`translate(${M.x} ${M.y})`}><LeakReviewSupport part="wallMonitor" W={M.W} H={M.H}>
   <defs><linearGradient id={'lr1021-feedsky-'+key} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#AFC3D3"/><stop offset="1" stopColor="#EDE3CC"/></linearGradient></defs>
   <rect x={0} y={0} width={M.W} height={M.H} fill={`url(#lr1021-feedsky-${key})`}/>
   <CamG c={cam} z={1}>{padWorld({station:s4Station,air:s4Air(),hot:S.s4.ir,grounded:false})}</CamG>
   {irInset(cam,IR_AT[key],key==='feed-lens'?26:18)}
   <rect x={12} y={M.H-34} width={70} height={22} rx={4} fill="#0E1114" opacity={.75}/>
   <circle cx={26} cy={M.H-23} r={6} fill="#D9DEE0"/><text x={38} y={M.H-16} fontFamily={FONT.body} fontSize={16} fontWeight={700} fill={pal.paper}>Feed</text>
  </LeakReviewSupport></g>;
 };
 const locatorCard=()=>S.s1.card<=0?null:<Item id="s1-locator"><g transform={`translate(${LOCATOR.at[0]} ${f2(LOCATOR.at[1]-24*(1-S.s1.card))})`} opacity={f2(S.s1.card)}>
  <LeakReviewSupport part="locator" w={LOCATOR.w} p={S.s1.locator}/></g></Item>;

 // ---- the room: desk props, the tablet, paper, stamps, tags, the window, the inspector ----
 const deskProps=(key:string)=>{const rows=PROPS[key];if(!rows)return null;
  return <g data-part="desk-props">{rows.map((q,k)=><At key={k} p={[q.x,q.y]} s={q.s} r={q.r??0}>
   {q.kind==='pen'?<LeakReviewSupport part="pen"/>:q.kind==='mug'?<LeakReviewSupport part="mug" top={q.top}/>:<LeakReviewSupport part="hardhat" top={q.top}/>}</At>)}</g>;};
 const desk=(key:string)=>DESK_Y[key]===undefined?null:<LeakReviewSupport part="desk" y={DESK_Y[key]}/>;
 const tabletDrawn=(T:TabletAt,content:React.ReactNode,pulse=0,ring?:string)=><g transform={`translate(${T.x} ${T.y}) rotate(${T.rot??0})`}>
  <LeakReviewSupport part="tablet" W={T.W} H={T.H} stand={T.stand} pulse={pulse} ring={ring}>{content}</LeakReviewSupport></g>;
 /** The inspector, placed for this view, her hands at the given screen points. */
 const person=(key:string,far:Pt,near:Pt,o:{tool?:PersonTool;nearTool?:PersonTool;press?:number;lean?:number;head?:number}={})=>{
  const A=PERSON_AT[key],r=reaction(key,S);
  return <Item id={sid+'-inspector'}><g transform={`translate(${f2(A.at[0])} ${f2(A.at[1])}) scale(${A.s})`}>
   <LeakReviewSupport part="inspector" lean={A.lean+r.lean+(o.lean??0)} head={A.head+r.head+(o.head??0)} tip={toPerson(A,far)} tool={o.tool??'stylus'}
    near={toPerson(A,near)} nearTool={o.nearTool??A.nearTool??'finger'} press={o.press??0}/></g></Item>;
 };
 /** The inspector resting in a room view (hands where they rest), reacting to the scene's events. */
 const restingPerson=(key:string,o:{nearOffset?:Pt}={})=>{const A=PERSON_AT[key],d=o.nearOffset??[0,0];
  return person(key,A.farRest,[A.nearRest[0]+d[0],A.nearRest[1]+d[1]]);};
 /** s2: the blue claim tag swings in on its string from the right and hooks onto the blue alert flag. */
 const claimTag=(T:TabletAt,size:number)=>{
  const p=S.s2.tag;if(p<=0)return null;
  const corner=tabletPt(T,flagHook(T.W,T.H));
  const hole:Pt=[corner[0]-4,corner[1]+72],from:Pt=[hole[0]+620,hole[1]-240];
  const pos:Pt=[lerp(from[0],hole[0],p),lerp(from[1],hole[1],p)-70*Math.sin(Math.PI*p)];
  const mid:Pt=[(corner[0]+pos[0])/2,(corner[1]+pos[1])/2+50*(1-p)];
  const z0=tagSize(['The companies','say'],size),flip=hole[0]+z0.w+44>905;
  return <Item id="s2-claim"><g data-part="claim-tag">
   <path d={`M${f2(corner[0])} ${f2(corner[1])}Q${f2(mid[0])} ${f2(mid[1])} ${f2(pos[0])} ${f2(pos[1])}`} stroke="#2F5D85" strokeWidth={3.4} fill="none" opacity={f2(clamp(p*3))}/>
   <circle cx={f2(corner[0])} cy={f2(corner[1])} r={5} fill="#2F5D85" opacity={f2(clamp(p*3))}/>
   <At p={pos}><LeakReviewSupport part="tag" lines={['The companies','say']} size={size} tone="blue" flip={flip} swing={(flip?-1:1)*16*(1-p)+S.s2.swing}/></At>
  </g></Item>;
 };
 /** s3: a rubber stamp over its mark on the letter, side on at the desk or from above. */
 const stampAt=(L:PaperAt,mark:Pt,st:{lift:number;come:number;away:number},wL:number,hL:number,top:boolean,rot:number)=>{
  if(st.come<=0||st.away>=1)return null;
  const m=paperPt(L,mark),w=wL*L.s*.92,h=(hL+26)*L.s;
  if(top)return <At p={[m[0]+520*(1-st.come)+520*st.away,m[1]-700*(1-st.come)-700*st.away]} r={rot+(L.r??0)}><LeakReviewSupport part="stamp" top lift={st.lift} w={w} h={h}/></At>;
  return <At p={[m[0],m[1]-1100*(1-st.come)-1100*st.away]}><LeakReviewSupport part="stamp" lift={st.lift} w={w}/></At>;
 };
 /** s5: the vignette of the valve on the pad, and the follow-up tag her hand flicks to its handwheel. */
 const followUp=(T:TabletAt,size:number,always:boolean)=>{
  const V=VIGNETTE_AT[view],p=S.s5.follow;
  if(!V||(!always&&p<=0))return null;
  const wheelScreen:Pt=[V.c[0]+VIGNETTE_WHEEL[0],V.c[1]+VIGNETTE_WHEEL[1]],wheelT:Pt=[wheelScreen[0]-T.x,wheelScreen[1]-T.y];
  const q=tabletPt(T,followPoint(T.W,T.H,wheelT,p)),z0=tagSize(['Follow-up','inspection'],size),flip=wheelScreen[0]+z0.w+44>905;
  return <g>
   <Item id="s5-setting"><At p={V.c}><LeakReviewSupport part="vignette" r={V.r} hot={S.s5.hot}/></At></Item>
   {p>0&&<Item id="s5-followup"><g opacity={f2(clamp(p*6))}><At p={q}><LeakReviewSupport part="tag" lines={['Follow-up','inspection']} size={size} flip={flip}
    swing={(flip?1:-1)*14*Math.sin(Math.PI*p)+S.s5.hang}/></At></g></Item>}
  </g>;
 };
 /** The review tablet in s5 or s9 with the inspector's two hands on it (or near it). */
 const reviewTablet=(T:TabletAt,s:'s5'|'s9')=>{
  const V=VIGNETTE_AT[view],wheelT:Pt|null=V?[V.c[0]+VIGNETTE_WHEEL[0]-T.x,V.c[1]+VIGNETTE_WHEEL[1]-T.y]:null;
  const A=PERSON_AT[view],rest=A&&A.farRest[0]!==0?{far:[A.farRest[0]-T.x,A.farRest[1]-T.y] as Pt,near:[A.nearRest[0]-T.x,A.nearRest[1]-T.y] as Pt}:undefined;
  const H=reviewHands(S,s,T.W,T.H,wheelT,rest);
  const screen=s==='s5'?<LeakReviewSupport part="reviewScreen" W={T.W} H={T.H} t={t} arrive={S.s5.arrive} outline={S.s5.trace} confirm={S.s5.confirm} box={0} jolt={S.s5.jolt}/>:
   <LeakReviewSupport part="reviewScreen" W={T.W} H={T.H} t={t} arrive={1} outline={1} confirm={1} pulse={S.s9.pulse} box={S.s9.box}/>;
  return {screen:<Item id={s+'-footage'}>{s==='s5'?<Item id="s5-emission">{tabletDrawn(T,screen)}</Item>:<Item id="s9-ai-box">{tabletDrawn(T,screen)}</Item>}</Item>,
   far:tabletPt(T,H.far),near:tabletPt(T,H.near),press:H.press};
 };
 /** s6: a document holder standing on the desk, the long letter feeding up through its clamp. */
 const holder=(key:string,page:React.ReactNode)=>{const B=HOLDER[key],X=B.x,Y=B.y,Wd=B.w,Hd=B.h,foot=(DESK_Y[key]??Y+Hd)+24;
  return <g data-part="document-holder">
   <path d={`M${X+40} ${Y+Hd}L${X+10} ${foot}M${X+Wd-40} ${Y+Hd}L${X+Wd-10} ${foot}`} stroke="#2B3339" strokeWidth={14} strokeLinecap="round"/>
   <ellipse cx={X+Wd/2} cy={foot+6} rx={Wd*.55} ry={14} fill="#1A1410" opacity={.25}/>
   <rect x={X+10} y={Y+16} width={Wd} height={Hd} rx={14} fill="#1A1410" opacity={.25}/>
   <rect x={X} y={Y} width={Wd} height={Hd} rx={14} fill="#3D474E" stroke={pal.ink} strokeWidth={3}/>
   <defs><clipPath id={'lr1021-holder-'+key}><rect x={X+16} y={Y+44} width={Wd-32} height={Hd-60}/></clipPath></defs>
   <g clipPath={`url(#lr1021-holder-${key})`}><Item id="s6-letter"><Item id="s6-title">{page}</Item></Item></g>
   <rect x={X-14} y={Y-6} width={Wd+28} height={50} rx={10} fill="#8D969B" stroke={pal.ink} strokeWidth={3}/>
   <rect x={X+20} y={Y+4} width={Wd*.4} height={8} rx={4} fill="#C9CED0" opacity={.8}/>
  </g>;};
 /** s6: the counter tag dropping in on a short string from the highlight. */
 const counterTag=(hp:Pt,hole:Pt,size:number)=>{const p=S.s6.count;if(p<=0)return null;
  const y=hole[1]-90*(1-smooth(p));
  return <Item id="s6-count"><g opacity={f2(clamp(p*3))}>
   <path d={`M${f2(hp[0])} ${f2(hp[1])}L${f2(hole[0])} ${f2(y)}`} stroke={pal.ink} strokeWidth={3} strokeDasharray="8 6"/>
   <At p={[hole[0],y]}><LeakReviewSupport part="tag" lines={['AI appears once,','in a title']} size={size} swing={-8*(1-p)+S.s6.swing}/></At></g></Item>;};
 /** s7 and s8: the program tag, dropping onto the desk and settling, the amber delayed bar sliding onto it. */
 const programTag=(G:{x:number;y:number;size:number;extra:number;r:number},drop:number,bar:number,wob:number,sc:'s7'|'s8')=>{
  const z0=tagSize(PROGRAM_LINES,G.size,G.extra),y=G.y-PROGRAM_DROP*(1-drop),barW=Math.min(z0.w-10,G.size*9),barH=G.extra-22;
  return <Item id={sc+'-program'}>
   <ellipse cx={f2(G.x+z0.w/2)} cy={f2(G.y+z0.h*.42)} rx={f2(z0.w*.55)} ry={f2(z0.h*.18)} fill="#1A1410" opacity={f2(.16*smooth(drop))}/>
   <At p={[G.x,y]}><LeakReviewSupport part="tag" lines={PROGRAM_LINES} size={G.size} extra={G.extra} swing={G.r-7*(1-drop)+wob}>
    {bar>0&&<g transform={`translate(${f2(-(1-bar)*(barW+300))} 4) rotate(${f2(-2-5*(1-bar))})`}><Item id={sc==='s7'?'s7-delay':'s8-program'}>
     <LeakReviewSupport part="delayBar" w={barW} h={barH}/></Item></g>}
   </LeakReviewSupport></At></Item>;
 };
 /** s9: the pad outside the window: the far equipment and the station with the drone docked, its hood
 * closing and its lamp settling, behind the window's haze and mullions. */
 const windowOutside=(key:string)=>{
  const R=WINDOW_STATION[key];if(!R)return null;
  const Wd=R.own??place?.window??STAGE_WINDOW[fr==='medium'?'medium':'wide'],hz=Wd.y+.55*Wd.h,own=!!R.own;
  const mull=own?[Wd.w*.5]:[Wd.w/3,2*Wd.w/3];
  return <Item id="s9-station"><g data-part="window-outside">
   <defs><clipPath id={'lr1021-win-'+key}><rect x={Wd.x} y={Wd.y} width={Wd.w} height={Wd.h}/></clipPath>
    <linearGradient id={'lr1021-sky-'+key} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B4C4D3"/><stop offset="1" stopColor="#ECE2CB"/></linearGradient></defs>
   {own&&<rect x={Wd.x-14} y={Wd.y-14} width={Wd.w+28} height={Wd.h+28} rx={8} fill={pal.paper} stroke={pal.ink} strokeWidth={4}/>}
   <g clipPath={`url(#lr1021-win-${key})`}>
    {own&&<rect x={Wd.x} y={Wd.y} width={Wd.w} height={Wd.h} fill={`url(#lr1021-sky-${key})`}/>}
    <g style={{filter:'blur(1.2px)'}}>
     <g transform={`translate(${Wd.x} 0)`}><LeakReviewSupport part="windowPad" w={Wd.w} horizon={hz} t={t} eqU={R.eqU} eqS={R.eqS} ground={own}/></g>
     <At p={R.at} s={R.s}><InspectionDroneHero part="windowStation" open={S.s9.open} ready={S.s9.ready} lamp={.55+.45*S.s9.ready}/></At>
    </g>
    <rect x={Wd.x} y={Wd.y} width={Wd.w} height={Wd.h} fill={pal.paper} opacity={own?.18:.28}/>
   </g>
   <g stroke={pal.ink} fill="none">
    {!own&&<rect x={Wd.x} y={Wd.y} width={Wd.w} height={Wd.h} strokeWidth={12} strokeOpacity={.42}/>}
    {mull.map((x,i)=><path key={i} d={`M${Wd.x+x} ${Wd.y}V${Wd.y+Wd.h}`} strokeWidth={6} strokeOpacity={own?.6:.3}/>)}
   </g>
  </g></Item>;
 };
 const need=(s:string)=>{if(sid!==s)throw new Error(view+' draws '+s+' only');};
 let pic:React.ReactNode;
 switch(view){
 // ===== s1: the drone leaves its station =====
 case 'equipment-low':
 case 'station-wide':{
  // A opens on the medium: the hood leaves open as the rotors spin up, then the drone lifts out of the bay and
  // curves out over the separator, the valves and the tank. The wide holds the pad while it cruises on and the
  // Texas card draws its two pins. B's wide is the same shot.
  need('s1');
  pic=<g><CamG c={sideCam(view,S)} z={z}>{padWorld({station:s1Station(),grounded:exterior})}</CamG>{locatorCard()}</g>;
  break;}
 case 'room-window':{
  // B: the inspection room, the region through a window cut into its wall, the pad and the station beyond.
  // The inspector at her desk turns toward the window as the hood opens and the drone lifts out.
  need('s1');const H=ROOM_HOLE[view];
  pic=<g>
   <CamG c={sideCam(view,S)} z={z}>{padWorld({station:s1Station(),grounded:exterior})}</CamG>
   <Item id="s1-setting"><LeakReviewSupport part="roomWall" hole={H}/>{desk(view)}</Item>
   {restingPerson(view)}
   {locatorCard()}
  </g>;
  break;}
 // ===== s2: the companies' alert, a claim =====
 case 'alert-panel':
 case 'panel-wide':
 case 'room-monitor':{
  // The tablet's flight screen lights; the blue alert flag rises from the pump pressure row of the status
  // strip (never the valve, the route or a leak) and rings the bezel blue once; the blue tag reading the
  // companies say swings in on its string and hooks onto the flag, which recoils. B's inspector watches it.
  need('s2');const T=TABLET[view];
  const screen=<LeakReviewSupport part="flightScreen" W={T.W} H={T.H} lit={S.s2.lit} flag={S.s2.flag} t={t} sway={S.s2.recoil}/>;
  pic=<g>
   <Item id="s2-setting">{desk(view)}{deskProps(view)}</Item>
   <Item id="s2-software"><Item id="s2-alert">{tabletDrawn(T,screen,S.s2.pulse,'#3F78B0')}</Item></Item>
   {view==='room-monitor'&&restingPerson(view)}
   {claimTag(T,view==='alert-panel'?38:32)}
  </g>;
  break;}
 // ===== s3: the approval letter, its date and its approval =====
 case 'letter-desk':
 case 'letter-wide':
 case 'approval-close':
 case 'room-desk':
 case 'stamp-reaction':{
  // The unsealed letter slides onto the desk and its first lines write in; a stamp comes down and leaves the
  // date crooked on it; a second stamp presses the approved mark beside the clipped tag. B's inspector looks
  // down at it in the room, and in the close her pen taps twice as the approved mark lands.
  need('s3');
  const L=LETTER_AT[view],slide=(1-S.s3.slide)*LETTER_FROM,top=view==='approval-close'||view==='stamp-reaction';
  const Lx={...L,x:L.x+slide,r:(L.r??0)-6*(1-S.s3.slide)};
  const A=PERSON_AT[view];
  pic=<g>
   <Item id="s3-setting">{desk(view)}{deskProps(view)}</Item>
   <Item id="s3-letter"><g transform={paperTransform(Lx)}><LeakReviewSupport part="letter" write={S.s3.write} date={S.s3.date.inked} approved={S.s3.approved.inked}/></g></Item>
   <Item id="s3-date">{stampAt(Lx,letterMarks.date,S.s3.date,LETTER.date.w,LETTER.date.h,top,LETTER.date.rot)}</Item>
   <Item id="s3-approval">{stampAt(Lx,letterMarks.approved,S.s3.approved,LETTER.approved.w,LETTER.approved.h,top,LETTER.approved.rot)}</Item>
   {view==='room-desk'&&restingPerson(view)}
   {view==='stamp-reaction'&&A&&person(view,A.farRest,[A.nearRest[0],A.nearRest[1]-22*S.s3.tap],{tool:'stylus',nearTool:'pen'})}
  </g>;
  break;}
 // ===== s4: the flight plan to the point of interest =====
 case 'route-wide':
 case 'poi-close':
 case 'infrared-view':{
  // The drone hovers over the pad; its pod swings down toward the valve as the dashed plan and its plain
  // white rings draw; it pitches and flies the plan to the first ring, which swells and fills white; the
  // illustrated infrared view of that valve opens out of the lens.
  need('s4');const cam=sideCam(view,S);
  pic=<g><CamG c={cam} z={z}>{padWorld({station:s4Station,air:s4Air(),hot:S.s4.ir,grounded:exterior})}</CamG>{irInset(cam,IR_AT[view],30)}</g>;
  break;}
 case 'room-feed':
 case 'feed-lens':{
  // B: the inspection room, the region through its window, the drone's live feed on the wall monitor. She
  // leans in as the pod swings; closer, the infrared view opens inside the feed past her shoulder.
  need('s4');
  pic=<g>
   <Item id="s4-setting"><LeakReviewSupport part="roomWall" hole={ROOM_HOLE[view]} mullion={view==='feed-lens'?.6:.42}/>{desk(view)}</Item>
   {feedMonitor(view)}
   {restingPerson(view)}
  </g>;
  break;}
 // ===== s5: the certified inspector reviews the footage (the turn) =====
 case 'review-wide':
 case 'room-review':
 case 'review-panel':
 case 'followup-tag':
 case 'mark-hands':{
  // The survey footage slides onto the review screen. Her stylus traces the outline round the shimmer (the
  // outline exists only where her stylus has been); her left index finger presses the round green
  // confirmation onto the footage, which jolts; then her finger flicks the follow-up inspection tag off the
  // footage to the valve on the pad, where it hangs on the handwheel.
  need('s5');const T=TABLET[view],near=view==='followup-tag'||view==='mark-hands';
  const R=reviewTablet(T,'s5'),far=R.far,nearP=R.near;
  pic=<g>
   {!near&&<Item id="s5-setting">{desk(view)}{deskProps(view)}</Item>}
   {R.screen}
   {followUp(T,near?40:30,near)}
   {person(view,far,nearP,{press:R.press})}
  </g>;
  break;}
 // ===== s6: where AI appears in the letter =====
 case 'title-detail':
 case 'letter-scroll':
 case 'room-letter':{
  // The long letter scrolls up to its protocol title; an amber highlight lands on AI at the start of the
  // title's second line, overshooting the word a little; a counter tag drops in under it on a short string.
  need('s6');
  const A=LONG_AT[view],y0=A.titleY-A.s*LONG.titleY+A.s*LONG_SCROLL*(1-S.s6.scroll);
  const page=<g transform={`translate(${A.x} ${f2(y0)}) scale(${A.s})`}><LeakReviewSupport part="longLetter" hl={S.s6.hl}/></g>;
  const H=longHighlight(),hp:Pt=[A.x+A.s*(H.x+H.w*.5),y0+A.s*(H.y+H.h)];
  const hole:Pt=[A.x+A.s*60,A.titleY+A.s*170+(view==='title-detail'?20:40)];
  pic=<g>
   {view==='title-detail'?<Item id="s6-letter"><Item id="s6-title">{page}</Item></Item>:
    <g><Item id="s6-setting">{desk(view)}</Item>{holder(view,page)}</g>}
   {view==='room-letter'&&restingPerson(view)}
   {counterTag(hp,hole,view==='title-detail'?40:view==='room-letter'?30:36)}
  </g>;
  break;}
 // ===== s7: a separate program, delayed =====
 case 'program-calendar':
 case 'program-wide':
 case 'room-calendar':{
  // A program tag drops onto the desk and settles; the easel calendar's kraft cover flips up over its rings
  // to January 22nd, 2027; the amber delayed bar slides onto the tag's blank band and the tag jostles.
  need('s7');const G=PROGRAM_AT[view],C=CAL_AT[view];
  pic=<g>
   <Item id="s7-setting">{desk(view)}{deskProps(view)}</Item>
   <Item id="s7-calendar"><At p={[C.x,C.y]}><LeakReviewSupport part="calendar" w={C.w} flip={S.s7.flip}/></At></Item>
   {view==='room-calendar'&&restingPerson(view)}
   {programTag(G,S.s7.drop,S.s7.bar,S.s7.settle+S.s7.jostle,'s7')}
  </g>;
  break;}
 // ===== s8: the October 7th release and the proposal =====
 case 'proposal-close':
 case 'proposal-wide':
 case 'room-proposal':{
  // The day block's cover turns over to October 7th and the release card slides in beside it; the proposal
  // tag reading will propose to rescind clips onto the delayed program tag; its dashed stamp box draws round
  // and stays empty.
  need('s8');const G=PROGRAM_AT[view],D=DAY_AT[view],Q=PROPOSAL_AT[view];
  const cardX=lerp(1120,D.card[0],S.s8.card);
  const ps=tagSize(['Will propose','to rescind'],Q.size,Q.extra),from:Pt=[Q.x+420,Q.y+360];
  const qp:Pt=[lerp(from[0],Q.x,S.s8.prop),lerp(from[1],Q.y,S.s8.prop)];
  pic=<g>
   <Item id="s8-setting">{view!=='proposal-close'&&desk(view)}{deskProps(view)}</Item>
   <Item id="s8-date"><At p={[D.x,D.y]}><LeakReviewSupport part="dayBlock" w={D.w} flip={S.s8.day}/></At>
    {S.s8.card>0&&<At p={[cardX,D.card[1]]} r={lerp(8,-3,S.s8.card)}><LeakReviewSupport part="releaseCard" w={D.cardW}/></At>}</Item>
   {view==='room-proposal'&&restingPerson(view)}
   {programTag(G,1,1,0,'s8')}
   {S.s8.prop>0&&<Item id="s8-proposal"><At p={qp}><LeakReviewSupport part="tag" lines={['Will propose','to rescind']} size={Q.size} extra={Q.extra}
     swing={lerp(-14,4,S.s8.prop)+S.s8.hang}><LeakReviewSupport part="emptyStamp" w={Math.min(ps.w-30,Q.size*6)} h={Q.extra-24} p={S.s8.box}/></LeakReviewSupport></At>
    {S.s8.prop>=1&&<At p={[Q.x-18,Q.y-ps.h/2-18]} r={-8}><LeakReviewSupport part="clip" s={Q.size/32}/></At>}</Item>}
  </g>;
  break;}
 // ===== s9: who confirms, and what the letter leaves blank =====
 case 'confirm-hold':
 case 'confirm-close':
 case 'window-wide':
 case 'room-hold':
 case 'blank-box':{
  // The same inspector brings her stylus back to her green confirmation and presses it: one ring, and it
  // holds. A blank dashed box labelled AI draws beside the footage and stays empty. Through the window the
  // station's hood closes over the docked drone while she stays with the mark and the empty box.
  need('s9');const T=TABLET[view],near=view==='confirm-close'||view==='blank-box';
  const R=reviewTablet(T,'s9');
  pic=<g>
   {windowOutside(view)}
   {!near&&<Item id="s9-setting">{desk(view)}{deskProps(view)}</Item>}
   {R.screen}
   {person(view,R.far,R.near)}
  </g>;
  break;}
 default:throw new Error('Unimplemented leak review view '+view);
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
