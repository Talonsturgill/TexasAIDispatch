import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject,usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {InspectionDroneHero,DroneShadow,STATION,lensPoint} from './InspectionDroneHero';
import {LeakReviewSupport,PAD,PAD_TOP,VALVE_POI,LETTER,letterMarks,LONG,longHighlight,tagSize,flagTop,reviewShimmer,
 VIGNETTE_WHEEL,FLIGHT_FLAG} from './LeakReviewSupport';

/**
 * leak-review-v1: who calls the leak (2026-10-21, Ector County, the Permian Basin).
 *
 * ONE generic inspection drone (InspectionDroneHero) and its weatherproof station carry the film;
 * LeakReviewSupport draws the well pad, the flight plan and the records around it. Every performed state
 * below is a closed function of the film clock and the board's event windows (leakState), so any frame
 * renders alone and the same twice:
 *
 *  s1  the station's two hood leaves finish opening as the rotors spin up, and the drone lifts out of the
 *      bay on s1-event-1's travel curve; on s1-event-2 it pitches forward, climbs and flies out over the
 *      separator, the valves and the stock tank, then keeps drifting on over the pad; on s1-event-3 a Texas
 *      card drops its Permian Basin pin, draws the line and drops the Austin pin. B opens straight down on
 *      the pad: the drone rises off the station's ring toward the lens, its shadow sliding away.
 *  s2  the field tablet's flight screen lights (the status row, then the pad map with the moving drone
 *      dot); on s2-event-2 an amber alert flag rises from the anomaly marker on the valve and rings the
 *      bezel once; on s2-event-3 a paper tag reading the companies say swings in on its string and hooks
 *      onto the flag, which recoils and settles. The tag separates the claim from the record.
 *  s3  an unsealed approval letter slides onto the desk and its first lines write in; a rubber stamp comes
 *      down and leaves September 30th, 2025 crooked on it; a second stamp presses an approved mark beside
 *      the clipped periodic methane screening tag.
 *  s4  hovering over the pad, the drone's camera pod swings down toward the equipment as the dashed flight
 *      plan and its point of interest rings draw; on s4-event-2 the drone pitches and flies the plan to the
 *      first ring over the valve, which swells and lights; on s4-event-3 an illustrated infrared view of
 *      the valve opens out of the lens, labelled illustrative.
 *  s5  survey footage slides onto the review screen and fills the filmstrip; the certified inspector mark
 *      drops onto the footage, jolting it, and a dashed outline rings the shimmer (the turn); a follow-up
 *      inspection tag travels from the footage to the valve on the pad and hangs on its handwheel.
 *  s6  the long approval letter scrolls up to its protocol title; an amber highlight lands on AI; a counter
 *      tag drops in under it reading AI appears once, in a title.
 *  s7  a program tag reading leak reporting by certified third parties drops and settles on the desk; the
 *      easel calendar's cover flips over to January 22nd, 2027; a delayed bar slides onto the tag, which
 *      jostles. A separate program: no drone appears.
 *  s8  a day block's cover turns over to October 7th and an EPA release card slides in beside it; a
 *      proposal tag reading will propose to rescind clips onto the delayed program tag; its dashed stamp
 *      box draws and stays empty.
 *  s9  the inspector mark presses again and its check draws: confirmed; a blank dashed box labelled AI
 *      draws beside the footage and stays empty; through the window the station's hood closes over the
 *      docked drone and its lamp turns green while the frame holds on the mark and the empty box.
 *
 * Outdoor shots stand in the Ector County region's plate (PlaceStage); the side world is grounded on the
 * station's row through PlaceSubject and every exterior camera keeps the world's horizon on the plate's.
 * Indoors the region is the window behind the desk. No full-frame background is ever painted here.
 * Disclosed illustration: a generic drone and station with no brand mark, no real site, leak, plume,
 * EPA seal, letter page or person. The inspector appears only as a mark and a signature line.
 */

type V='a'|'b';
type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
const DEG=180/Math.PI;
/** A renderer-only setup ease with zero velocity and acceleration at both ends. */
export const ease5=(q:number)=>{const x=clamp(q);return x*x*x*(10+x*(-15+6*x));};
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
/** The drone's flight out of the station in s1, station units: the lift out of the bay, the flight out over
 * the equipment and the climb, then a slow drift on over the pad (world pixels a second). */
export const S1={lift:420,flyX:600,climb:90,drift:22};
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
 // s1: rotors spin up just before the lift, the hood finishes opening, the drone lifts, flies, drifts
 const w11=w('s1-event-1'),w12=w('s1-event-2');
 const spinAt=(w11?.start??0)-.3,e1end=w11?.end??0,e2end=w12?.end??0;
 const lift=P('s1-event-1'),fly=P('s1-event-2');
 const bob=6*Math.sin(2*Math.PI*.55*(t-e1end))*smooth((t-e1end)/.7);
 const drift=S1.drift*smoothInt(t,e2end,.8);
 const s1={spin:smooth((t-spinAt)/.55),phase:OMEGA*smoothInt(t,spinAt,.55),open:.55+.45*ease5(t/.45),lift,fly,
  x:S1.flyX*fly+drift/SS,y:STATION.deckY-S1.lift*lift-S1.climb*fly+(t>e1end?bob:0),pitch:9*bell(R('s1-event-2')),
  // the Texas card is on screen from the first word of the Austin clause; its pins and line wait for s1-event-3
  locator:P('s1-event-3'),card:N['n1b']?smooth((t-N['n1b'].start)/.45):smooth(R('s1-event-3')/.15)};
 // s4: the pod swings down and the plan draws; the drone flies to the first ring; the IR view opens
 const w42=w('s4-event-2');
 const travel=P('s4-event-2'),c4:Pt=[lerp(S4.start[0],S4.rings[0][0],travel),lerp(S4.start[1],S4.rings[0][1],travel)+5*Math.sin(2*Math.PI*.55*t)];
 const s4={swing:P('s4-event-1'),route:P('s4-event-1'),cone:smooth(R('s4-event-1')*1.6),travel,c:c4,pitch:8*bell(R('s4-event-2')),
  arrive:w42?clamp((t-(w42.end-.15))/.7):0,on:w42&&t>=w42.end-.15?1:0,ir:P('s4-event-3'),phase:OMEGA*t};
 // s2: the screen lights, the flag rises and rings, the claim tag hooks onto it
 const w22=w('s2-event-2'),w23=w('s2-event-3');
 const s2={lit:P('s2-event-1'),flag:P('s2-event-2'),tag:P('s2-event-3'),
  pulse:w22?Math.sin(Math.PI*clamp((t-(w22.start+.55*(w22.end-w22.start)))/.6)):0,
  swing:w23?damped(t-w23.end,7,1.1,2.4):0,recoil:w23?damped(t-(w23.end-.04),4,1.6,3.2):0};
 // s3: the letter slides in and writes; two stamps
 const w31=w('s3-event-1');
 const s3={slide:P('s3-event-1'),write:w31?clamp((t-(w31.start+.45*(w31.end-w31.start)))/1.5):0,date:stampState(w('s3-event-2'),t),approved:stampState(w('s3-event-3'),t)};
 // s5: footage arrives; the mark drops and the outline rings the shimmer; the follow-up tag travels
 const w52=w('s5-event-2'),w53=w('s5-event-3'),r52=R('s5-event-2');
 const markLand=w52?w52.start+.55*(w52.end-w52.start):0;
 const s5={arrive:P('s5-event-1'),mark:w52?contactQ(r52/.55):0,outline:smooth((r52-.5)/.45),jolt:w52?damped(t-markLand,7,2.2,5):0,
  follow:P('s5-event-3'),hang:w53?damped(t-w53.end,8,1,2.2):0,hot:w53?smooth((t-w53.end+.1)/.5):0};
 // s6: the page scrolls to the title, the highlight lands, the counter tag drops in
 const w63=w('s6-event-3');
 const s6={scroll:P('s6-event-1'),hl:P('s6-event-2'),count:P('s6-event-3'),swing:w63?damped(t-w63.end,5,1.2,2.6):0};
 // s7: the program tag drops and settles, the calendar flips, the delayed bar slides on
 const w71=w('s7-event-1'),w73=w('s7-event-3');
 const s7={drop:P('s7-event-1'),settle:w71?damped(t-w71.end,1.6,1.4,3):0,flip:P('s7-event-2'),bar:P('s7-event-3'),
  jostle:w73?damped(t-w73.end+.02,2.4,1.8,3.4):0};
 // s8: the day block turns, the release card slides in, the proposal tag clips on, its empty box draws
 const w81=w('s8-event-1'),w82=w('s8-event-2'),r81=R('s8-event-1');
 const s8={day:ease5(r81/.6),card:w81?actionProgress({...w81,start:w81.start+.35*(w81.end-w81.start)},t):0,
  prop:P('s8-event-2'),hang:w82?damped(t-w82.end,6,1.1,2.4):0,box:P('s8-event-3')};
 // s9: the mark confirms, the AI box draws, the hood closes over the docked drone
 const w91=w('s9-event-1'),r91=R('s9-event-1');
 const s9={check:smooth((r91-.3)/.55),press:w91?Math.sin(Math.PI*clamp(r91/.3))*.06:0,box:P('s9-event-2'),
  open:1-P('s9-event-3'),ready:smooth((R('s9-event-3')-.7)/.3)};
 return {s1,s2,s3,s4,s5,s6,s7,s8,s9};
}
export type LeakState=ReturnType<typeof leakState>;
/** The board's contact curve as a plain ease, for renderer-only setup moves. */
export const contactQ=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
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
/** The side world's camera for each exterior view at time t. Only poi-close moves: it follows the drone's
 * flight along s4-event-2's own travel curve, POI_FOLLOW of the way, so it starts and stops at rest. */
export function sideCam(view:string,st:LeakState):Cam{
 switch(view){
 case 'station-wide':case 'route-wide':return horizonCam('wide',[540,PAD.horizon],1,540);
 case 'equipment-low':return horizonCam('medium',[700,860],1.5,600);
 case 'poi-close':return horizonCam('close',[S4.start[0]+POI_FOLLOW*st.s4.travel*(S4.rings[0][0]-S4.start[0]),760],1.9,500);
 case 'infrared-view':return horizonCam('detail',[820,900],1.6,640);
 case 'camera-pod':return horizonCam('medium',[850,860],2.2,640);
 default:throw new Error('No side-world camera for '+view);
 }
}
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
/** s4's infrared view, opening out of the lens to its screen rectangle in the two views that show it. */
export const IR_AT:Record<string,{x:number;y:number;w:number;h:number}>={'infrared-view':{x:56,y:300,w:500,h:380},'camera-pod':{x:56,y:780,w:520,h:396}};
/** A tablet on the desk: top left of its screen, screen size, and whether it stands. */
export type TabletAt={x:number;y:number;W:number;H:number;stand:boolean;rot?:number};
export const TABLET:Record<string,TabletAt>={
 'alert-panel':{x:190,y:470,W:700,H:460,stand:true},'panel-wide':{x:260,y:520,W:560,H:368,stand:true},'desk-overhead':{x:130,y:420,W:820,H:540,stand:false,rot:-2},
 'review-panel':{x:190,y:470,W:700,H:460,stand:true},'review-wide':{x:220,y:500,W:640,H:420,stand:true},'panel-overhead':{x:130,y:420,W:820,H:540,stand:false,rot:-2},
 'followup-tag':{x:40,y:300,W:760,H:500,stand:true},'inspector-mark':{x:40,y:250,W:1000,H:660,stand:true},
 'confirm-hold':{x:190,y:470,W:700,H:460,stand:true},'confirm-close':{x:50,y:320,W:980,H:640,stand:true},
 'panel-wide-hold':{x:240,y:520,W:600,H:396,stand:true},'window-wide':{x:60,y:690,W:600,H:396,stand:true},'blank-box':{x:-170,y:420,W:1000,H:660,stand:true}};
/** The desk's back edge for each interior view that has a desk (medium and wide). */
export const DESK_Y:Record<string,number>={'alert-panel':860,'panel-wide':930,'letter-desk':700,'letter-wide':800,'review-panel':860,'review-wide':930,
 'letter-scroll':1060,'program-calendar':800,'program-wide':880,'proposal-wide':880,'confirm-hold':860,'panel-wide-hold':940,'window-wide':1020};
/** The approval letter on the desk: top left, scale and foreshortening (letter units to screen). */
export type PaperAt={x:number;y:number;s:number;fy:number;r?:number};
export const LETTER_AT:Record<string,PaperAt>={'letter-desk':{x:250,y:720,s:.95,fy:.8,r:-2},'letter-wide':{x:300,y:820,s:.8,fy:.8,r:-2},
 'approval-close':{x:60,y:150,s:1.45,fy:1},'letter-overhead':{x:236,y:360,s:.95,fy:1,r:-1.5},'date-detail':{x:-28,y:-60,s:1.7,fy:1}};
/** Where the letter starts its slide onto the desk (s3-event-1): from the right, partly in frame. */
export const LETTER_FROM=310;
/** s6: the long letter's placement and its scroll (letter units) from the start of s6-event-1. */
export const LONG_AT:Record<string,{x:number;titleY:number;s:number}>={'title-detail':{x:0,titleY:640,s:1.45},'letter-scroll':{x:240,titleY:700,s:1},'letter-overhead-scan':{x:240,titleY:690,s:1}};
export const LONG_SCROLL=262;
/** s7 and s8: the program tag's hole, text size, the blank band that takes the delayed bar, and its turn. */
export const PROGRAM_LINES=['Leak reporting by','certified third parties'];
/** How far above the desk the program tag is held before s7-event-1 sets it down (pixels). */
export const PROGRAM_DROP=140;
export const PROGRAM_AT:Record<string,{x:number;y:number;size:number;extra:number;r:number}>={
 'program-calendar':{x:120,y:1010,size:40,extra:90,r:-3},'program-wide':{x:140,y:1050,size:36,extra:80,r:-3},'program-overhead':{x:150,y:820,size:44,extra:96,r:-4},
 'proposal-close':{x:80,y:900,size:40,extra:90,r:-3},'proposal-wide':{x:120,y:1000,size:34,extra:76,r:-3},'proposal-overhead':{x:110,y:900,size:44,extra:96,r:-4}};
export const CAL_AT:Record<string,{x:number;y:number;w:number}>={'program-calendar':{x:680,y:470,w:260},'program-wide':{x:720,y:616,w:220},'program-overhead':{x:600,y:330,w:300}};
export const DAY_AT:Record<string,{x:number;y:number;w:number;card:Pt;cardW:number}>={'proposal-close':{x:690,y:300,w:220,card:[620,560],cardW:280},
 'proposal-wide':{x:740,y:700,w:170,card:[730,905],cardW:180},'proposal-overhead':{x:660,y:300,w:230,card:[650,590],cardW:260}};
export const PROPOSAL_AT:Record<string,{x:number;y:number;size:number;extra:number}>={'proposal-close':{x:480,y:1060,size:40,extra:80},
 'proposal-wide':{x:430,y:1110,size:34,extra:70},'proposal-overhead':{x:470,y:1080,size:44,extra:88}};
/** s5: the round field vignette of the valve on the pad that the follow-up tag travels to. */
export const VIGNETTE_AT:Record<string,{c:Pt;r:number}>={'followup-tag':{c:[470,1010],r:200},'inspector-mark':{c:[360,1090],r:150},
 'review-panel':{c:[200,1130],r:110},'review-wide':{c:[180,1120],r:100},'panel-overhead':{c:[200,1170],r:130}};
/** The stage's window rectangles (PlaceStage WINDOW), used only if the stage gives none. */
export const STAGE_WINDOW:Record<string,{x:number;y:number;w:number;h:number}>={wide:{x:96,y:440,w:888,h:540},medium:{x:40,y:410,w:1000,h:640}};
/** s9: the station outside the window, and the far equipment beside it, in every s9 view. The two near
 * views draw their own small window (the stage gives a close or a detail no window, only its light). */
export const WINDOW_STATION:Record<string,{at:Pt;s:number;eqU:number;eqS:number;own?:{x:number;y:number;w:number;h:number}}>={
 'window-wide':{at:[752,872],s:.42,eqU:.93,eqS:.34},'panel-wide-hold':{at:[155,862],s:.3,eqU:.93,eqS:.3},
 'blank-box':{at:[712,374],s:.28,eqU:.72,eqS:.24,own:{x:600,y:150,w:400,h:250}},
 'confirm-hold':{at:[978,846],s:.24,eqU:.06,eqS:.24},'confirm-close':{at:[748,252],s:.2,eqU:.8,eqS:.17,own:{x:640,y:96,w:360,h:170}}};
type PropRow={kind:'hardhat'|'mug'|'pen';x:number;y:number;s:number;r?:number;top?:boolean};
/** Desk dressing per view: a hard hat, a mug, a pen, never symmetric, clear of the caption band. */
export const PROPS:Record<string,PropRow[]>={
 'alert-panel':[{kind:'hardhat',x:110,y:1060,s:.8},{kind:'mug',x:975,y:1050,s:.75},{kind:'pen',x:520,y:1150,s:.9,r:-6,top:true}],
 'panel-wide':[{kind:'hardhat',x:150,y:1060,s:.7},{kind:'mug',x:960,y:1040,s:.65},{kind:'pen',x:560,y:1150,s:.8,r:-6,top:true}],
 'desk-overhead':[{kind:'hardhat',x:200,y:1200,s:.8,top:true},{kind:'mug',x:940,y:1170,s:.8,top:true},{kind:'pen',x:430,y:1130,s:.9,r:-12,top:true}],
 'letter-desk':[{kind:'mug',x:975,y:900,s:.75},{kind:'pen',x:80,y:1190,s:.9,r:-14,top:true}],
 'letter-wide':[{kind:'hardhat',x:140,y:960,s:.7},{kind:'mug',x:975,y:990,s:.7},{kind:'pen',x:90,y:1220,s:.8,r:-10,top:true}],
 'letter-overhead':[{kind:'mug',x:130,y:330,s:.8,top:true},{kind:'hardhat',x:920,y:1200,s:.75,top:true},{kind:'pen',x:880,y:560,s:.8,r:80,top:true}],
 'review-panel':[{kind:'hardhat',x:110,y:1060,s:.8},{kind:'mug',x:975,y:1050,s:.75}],
 'review-wide':[{kind:'hardhat',x:150,y:1060,s:.7},{kind:'mug',x:960,y:1040,s:.65}],
 'panel-overhead':[{kind:'hardhat',x:920,y:1170,s:.8,top:true},{kind:'mug',x:980,y:320,s:.7,top:true}],
 'letter-overhead-scan':[{kind:'mug',x:140,y:330,s:.8,top:true},{kind:'pen',x:900,y:1150,s:.8,r:-70,top:true}],
 'program-calendar':[{kind:'mug',x:990,y:1060,s:.7}],
 'program-wide':[{kind:'hardhat',x:960,y:1060,s:.6},{kind:'mug',x:90,y:960,s:.6}],
 'program-overhead':[{kind:'hardhat',x:880,y:1170,s:.8,top:true},{kind:'pen',x:420,y:1150,s:.8,r:-8,top:true}],
 'proposal-wide':[{kind:'mug',x:1000,y:1000,s:.6}],
 'proposal-overhead':[{kind:'mug',x:140,y:330,s:.7,top:true}],
 'confirm-hold':[{kind:'hardhat',x:110,y:1060,s:.8},{kind:'mug',x:975,y:1050,s:.75}],
 'window-wide':[{kind:'hardhat',x:830,y:1110,s:.7},{kind:'mug',x:990,y:1085,s:.55}],
 'panel-wide-hold':[{kind:'hardhat',x:150,y:1060,s:.7},{kind:'mug',x:960,y:1040,s:.65}]};
/** Paper on the desk: letter units to screen, rotation after scale and foreshortening. Pure. */
export const paperTransform=(L:PaperAt)=>`translate(${f2(L.x)} ${f2(L.y)}) rotate(${f2(L.r??0)}) scale(${L.s} ${f2(L.s*L.fy)})`;
export const paperPt=(L:PaperAt,p:Pt):Pt=>{const a=(L.r??0)/DEG,x=L.s*p[0],y=L.s*L.fy*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
/** A tablet's screen point in film pixels. Pure. */
export const tabletPt=(T:TabletAt,p:Pt):Pt=>{const a=(T.rot??0)/DEG,c=Math.cos(a),s=Math.sin(a);return [T.x+p[0]*c-p[1]*s,T.y+p[0]*s+p[1]*c];};
/** s1 straight down: where the drone heads over the pad on s1-event-2 (top-world pixels). */
export const S1_TOP_TO:Pt=[720,860];
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

 // ---- the side world (s1, s4): the pad, the station, the drone ----
 const sideWorld=(o:{station:React.ReactNode;air?:React.ReactNode;hot?:number})=><Grounded baseY={PAD.stationY} on={exterior}>
  <Item id={sid+'-setting'}><Item id={sid+'-equipment'}><LeakReviewSupport part="padSide" t={t} hot={o.hot}/></Item></Item>
  {o.station}
  {o.air}
 </Grounded>;
 const s1Station=()=>{
  const h=-S.s1.y;
  return <Item id="s1-station"><g transform={`translate(${PAD.stationX} ${PAD.stationY}) scale(${SS})`}>
   <InspectionDroneHero part="station" open={S.s1.open} t={t} lamp={blinkLamp(t)}>
    {h>140&&<g transform={`translate(${f2(S.s1.x+.35*h)} 0)`}><DroneShadow h={h}/></g>}
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
 const s4Air=(cone=true)=>{
  const pts:Pt[]=[S4.start,...S4.rings];
  return <g>
   <Item id="s4-route"><LeakReviewSupport part="route" pts={pts} p={S.s4.route} w={6}/></Item>
   <Item id="s4-poi">{S4.rings.map((r,k)=><At key={k} p={r}><LeakReviewSupport part="poi" r={S4.ringR*(k?.7:1)} on={k?0:S.s4.on} pulse={k?0:S.s4.arrive}
    drop={k===0?VALVE_POI[1]-r[1]-30:k===1?PAD.tank.top-r[1]-24:PAD.separator.cy-PAD.separator.r-r[1]-8} show={smooth(S.s4.route*3-k*.6)}/></At>)}</Item>
   {s4Drone(cone)}
  </g>;
 };
 const s4Station=<Item id="s4-setting"><g transform={`translate(${PAD.stationX} ${PAD.stationY}) scale(${SS})`}><InspectionDroneHero part="station" open={1} t={t} lamp={.6}/></g></Item>;
 /** The infrared view opening out of the lens to its screen rectangle. */
 const irInset=(cam:Cam)=>{
  const R=IR_AT[view],p=S.s4.ir;if(!R||p<=0)return null;
  const l=camPoint(cam,lensWorld(S.s4.c,S.s4.pitch,s4Pod(S))),k=smooth(p);
  const x=lerp(l[0],R.x,k),y=lerp(l[1],R.y,k),w=lerp(8,R.w,k),h=lerp(6,R.h,k);
  return <Item id="s4-infrared"><g data-part="ir-inset">
   <path d={`M${f2(l[0])} ${f2(l[1])}L${f2(x+w)} ${f2(y)}M${f2(l[0])} ${f2(l[1])}L${f2(x+w)} ${f2(y+h)}`} stroke={pal.paper} strokeWidth={3} strokeDasharray="10 8" opacity={.8*k}/>
   <rect x={x+8} y={y+12} width={w} height={h} rx={14} fill="#1A1410" opacity={.25*k}/>
   <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(w/R.w)} ${f2(h/R.h)})`}>
    <rect x={-8} y={-8} width={R.w+16} height={R.h+16} rx={16} fill={pal.paper}/>
    <LeakReviewSupport part="irView" W={R.w} H={R.h} t={t} label={30}/>
   </g></g></Item>;
 };
 const locatorCard=()=>S.s1.card<=0?null:<Item id="s1-locator"><g transform={`translate(${LOCATOR.at[0]} ${f2(LOCATOR.at[1]-24*(1-S.s1.card))})`} opacity={f2(S.s1.card)}>
  <LeakReviewSupport part="locator" w={LOCATOR.w} p={S.s1.locator}/></g></Item>;

 // ---- the room: desk props, the tablet, paper, stamps, tags, the window ----
 const deskProps=(key:string)=>{const rows=PROPS[key];if(!rows)return null;
  return <g data-part="desk-props">{rows.map((q,k)=><At key={k} p={[q.x,q.y]} s={q.s} r={q.r??0}>
   {q.kind==='pen'?<LeakReviewSupport part="pen"/>:q.kind==='mug'?<LeakReviewSupport part="mug" top={q.top}/>:<LeakReviewSupport part="hardhat" top={q.top}/>}</At>)}</g>;};
 const tabletDrawn=(T:TabletAt,content:React.ReactNode,pulse=0)=><g transform={`translate(${T.x} ${T.y}) rotate(${T.rot??0})`}>
  <LeakReviewSupport part="tablet" W={T.W} H={T.H} stand={T.stand} pulse={pulse}>{content}</LeakReviewSupport></g>;
 /** s2: the claim tag swings in on its string from the right and hooks onto the alert flag. */
 const claimTag=(T:TabletAt,size:number)=>{
  const p=S.s2.tag;if(p<=0)return null;
  const ft=flagTop(T.W,T.H),corner=tabletPt(T,[ft[0]+4,ft[1]+FLIGHT_FLAG.cloth[1]]);
  const hole:Pt=[corner[0]-4,corner[1]+72],from:Pt=[hole[0]+640,hole[1]-240];
  const pos:Pt=[lerp(from[0],hole[0],p),lerp(from[1],hole[1],p)-70*Math.sin(Math.PI*p)];
  const mid:Pt=[(corner[0]+pos[0])/2,(corner[1]+pos[1])/2+50*(1-p)];
  return <Item id="s2-claim"><g data-part="claim-tag">
   <path d={`M${f2(corner[0])} ${f2(corner[1])}Q${f2(mid[0])} ${f2(mid[1])} ${f2(pos[0])} ${f2(pos[1])}`} stroke={pal.ink} strokeWidth={3.4} fill="none" opacity={f2(clamp(p*3))}/>
   <circle cx={f2(corner[0])} cy={f2(corner[1])} r={5} fill={pal.ink} opacity={f2(clamp(p*3))}/>
   <At p={pos}><LeakReviewSupport part="tag" lines={['The companies','say']} size={size} swing={16*(1-p)+S.s2.swing}/></At>
  </g></Item>;
 };
 /** s3: a rubber stamp over its mark on the letter, side on at the desk or from above. */
 const stampAt=(L:PaperAt,mark:Pt,st:{lift:number;come:number;away:number},wL:number,hL:number,top:boolean,rot:number)=>{
  if(st.come<=0||st.away>=1)return null;
  const m=paperPt(L,mark),w=wL*L.s*.92,h=(hL+26)*L.s;
  if(top)return <At p={[m[0]+520*(1-st.come)+520*st.away,m[1]-700*(1-st.come)-700*st.away]} r={rot+(L.r??0)}><LeakReviewSupport part="stamp" top lift={st.lift} w={w} h={h}/></At>;
  return <At p={[m[0],m[1]-1100*(1-st.come)-1100*st.away]}><LeakReviewSupport part="stamp" lift={st.lift} w={w}/></At>;
 };
 /** s5: the round vignette of the valve on the pad, and the follow-up tag travelling to its handwheel. */
 const followUp=(T:TabletAt,size:number)=>{
  const V=VIGNETTE_AT[view],near=view==='followup-tag'||view==='inspector-mark',p=S.s5.follow;
  if(!V||(!near&&p<=0))return null;
  const wheel:Pt=[V.c[0]+VIGNETTE_WHEEL[0],V.c[1]+VIGNETTE_WHEEL[1]],start=tabletPt(T,reviewShimmer(T.W,T.H));
  const ctrl:Pt=[(start[0]+wheel[0])/2+80,Math.min(start[1],wheel[1])-160];
  const u=p,q:Pt=[(1-u)*(1-u)*start[0]+2*u*(1-u)*ctrl[0]+u*u*wheel[0],(1-u)*(1-u)*start[1]+2*u*(1-u)*ctrl[1]+u*u*wheel[1]];
  return <g>
   <Item id="s5-setting"><At p={V.c}><LeakReviewSupport part="vignette" r={V.r} hot={S.s5.hot}/></At></Item>
   {p>0&&<Item id="s5-followup"><g opacity={f2(clamp(u*6))}><At p={q}><LeakReviewSupport part="tag" lines={['Follow-up','inspection']} size={size}
    swing={-14*Math.sin(Math.PI*u)+S.s5.hang}/></At></g></Item>}
  </g>;
 };
 /** s6 medium: a document holder standing on the desk, the long letter feeding up through its clamp. */
 const holder=(page:React.ReactNode)=>{const X=214,Y=330,Wd=652,Hd=720,foot=DESK_Y['letter-scroll']+24;
  return <g data-part="document-holder">
   <path d={`M${X+40} ${Y+Hd}L${X+10} ${foot}M${X+Wd-40} ${Y+Hd}L${X+Wd-10} ${foot}`} stroke="#2B3339" strokeWidth={14} strokeLinecap="round"/>
   <ellipse cx={X+Wd/2} cy={foot+6} rx={Wd*.55} ry={14} fill="#1A1410" opacity={.25}/>
   <rect x={X+10} y={Y+16} width={Wd} height={Hd} rx={14} fill="#1A1410" opacity={.25}/>
   <rect x={X} y={Y} width={Wd} height={Hd} rx={14} fill="#3D474E" stroke={pal.ink} strokeWidth={3}/>
   <defs><clipPath id="lr1021-holder"><rect x={X+16} y={Y+44} width={Wd-32} height={Hd-60}/></clipPath></defs>
   <g clipPath="url(#lr1021-holder)"><Item id="s6-letter"><Item id="s6-title">{page}</Item></Item></g>
   <rect x={X-14} y={Y-6} width={Wd+28} height={50} rx={10} fill="#8D969B" stroke={pal.ink} strokeWidth={3}/>
   <rect x={X+20} y={Y+4} width={Wd*.4} height={8} rx={4} fill="#C9CED0" opacity={.8}/>
  </g>;};
 /** s6: the counter tag dropping in on a short string from the highlight. */
 const counterTag=(hp:Pt,hole:Pt,size:number)=>{const p=S.s6.count;if(p<=0)return null;
  const y=hole[1]-90*(1-smooth(p));
  return <Item id="s6-count"><g opacity={f2(clamp(p*3))}>
   <path d={`M${f2(hp[0])} ${f2(hp[1])}L${f2(hole[0])} ${f2(y)}`} stroke={pal.ink} strokeWidth={3} strokeDasharray="8 6"/>
   <At p={[hole[0],y]}><LeakReviewSupport part="tag" lines={['AI appears once,','in a title']} size={size} swing={-8*(1-p)+S.s6.swing}/></At></g></Item>;};
 /** s7 and s8: the program tag, dropping onto the desk and settling, the delayed bar sliding onto its band. */
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
 * closing and its lamp turning green, behind the window's haze and mullions. */
 const windowOutside=(key:string)=>{
  const R=WINDOW_STATION[key],Wd=R.own??place?.window??STAGE_WINDOW[fr==='medium'?'medium':'wide'],hz=Wd.y+.55*Wd.h,own=!!R.own;
  const mull=own?[Wd.w*.5]:[Wd.w/3,2*Wd.w/3];
  return <g data-part="window-outside">
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
  </g>;
 };

 let pic:React.ReactNode;
 switch(view){
 // ===== s1: the drone leaves its station =====
 case 'station-wide':
 case 'equipment-low':{
  // A wide eye level across the pad: the hood finishes opening, the rotors spin up and the drone lifts out
  // of the bay, pitches and flies out over the separator, the valves and the tank. The medium holds the
  // equipment large while the drone crosses above it and the Texas card draws its two pins.
  if(sid!=='s1')throw new Error(view+' draws the s1 departure only');
  pic=<g><CamG c={sideCam(view,S)} z={z}>{sideWorld({station:s1Station()})}</CamG>{locatorCard()}</g>;
  break;}
 case 'pad-overhead':{
  // B straight down on the pad: the station's leaves fold out, the drone rises off the ring toward the lens
  // (it grows a third), its shadow sliding away down and right, then starts out toward the valves.
  if(sid!=='s1')throw new Error('pad-overhead draws the s1 departure only');
  const k=PAD_TOP.stationS,lift=S.s1.lift,sc=1+.4*lift,docked=lift<.05;
  const dx=S.s1.fly*(S1_TOP_TO[0]-PAD_TOP.station[0])/k,dy=S.s1.fly*(S1_TOP_TO[1]-PAD_TOP.station[1])/k;
  const drift=(S.s1.x-S1.flyX*S.s1.fly)*.8;
  const droneTop=<Item id="s1-drone"><g transform={`translate(${f2(dx+drift)} ${f2(dy)}) scale(${f2(sc)})`}>
   <InspectionDroneHero part="top" spin={S.s1.spin} phase={S.s1.phase} lamp={blinkLamp(t)} yaw={-20*S.s1.fly}/></g></Item>;
  const shadow=<g transform={`translate(${f2(dx+drift+10+90*lift)} ${f2(dy+10+90*lift)})`} opacity={f2(.38-.2*lift)}>
   <ellipse rx={f2(150*(1+.2*lift))} ry={f2(150*(1+.2*lift))} fill="#1A1410"/></g>;
  pic=<g>
   <Item id="s1-setting"><Item id="s1-equipment"><LeakReviewSupport part="padTop" t={t}/></Item></Item>
   <Item id="s1-station"><g transform={`translate(${PAD_TOP.station[0]} ${PAD_TOP.station[1]}) scale(${k})`}>
    <InspectionDroneHero part="stationTop" open={S.s1.open} lamp={blinkLamp(t)}>{docked&&droneTop}</InspectionDroneHero>
    {!docked&&shadow}{!docked&&droneTop}
   </g></Item>
   {locatorCard()}
  </g>;
  break;}
 // ===== s4: the flight plan to the point of interest =====
 case 'route-wide':
 case 'poi-close':
 case 'infrared-view':
 case 'camera-pod':{
  // The drone hovers over the pad; its pod swings down toward the valve as the dashed plan and its rings
  // draw; it pitches and flies the plan to the first ring over the valve, which swells and lights amber;
  // the illustrated infrared view of that valve opens out of the lens. route-wide holds the whole plan, the
  // close follows the drone three quarters of the way, the two nearer views open the infrared view.
  if(sid!=='s4')throw new Error(view+' draws the s4 flight only');
  const cam=sideCam(view,S);
  pic=<g><CamG c={cam} z={z}>{sideWorld({station:s4Station,air:s4Air(),hot:S.s4.ir})}</CamG>{irInset(cam)}</g>;
  break;}
 case 'route-overhead':{
  // B straight down: the plan draws over the pad, rings over the valve, the tank and the separator; the
  // hovering drone's camera cone swings round toward the valve.
  if(sid!=='s4')throw new Error('route-overhead draws the s4 flight only');
  const start:Pt=[560,1010],pts:Pt[]=[start,PAD_TOP.valve,PAD_TOP.tank.c,PAD_TOP.separator.c];
  const c:Pt=[lerp(start[0],PAD_TOP.valve[0],S.s4.travel),lerp(start[1],PAD_TOP.valve[1],S.s4.travel)];
  const aim=Math.atan2(PAD_TOP.valve[1]-c[1],PAD_TOP.valve[0]-c[0])*DEG,coneDir=lerp(-150,aim,S.s4.swing);
  const dist=Math.max(140,Math.hypot(PAD_TOP.valve[0]-c[0],PAD_TOP.valve[1]-c[1])/.78);
  pic=<g>
   <Item id="s4-setting"><LeakReviewSupport part="padTop" t={t} hot={S.s4.ir}/>
    <g transform={`translate(${PAD_TOP.station[0]} ${PAD_TOP.station[1]}) scale(${PAD_TOP.stationS})`}><InspectionDroneHero part="stationTop" open={1} lamp={.6}/></g></Item>
   <Item id="s4-route"><LeakReviewSupport part="route" pts={pts} p={S.s4.route} w={7}/></Item>
   <Item id="s4-poi">{pts.slice(1).map((p,k)=><At key={k} p={p}><LeakReviewSupport part="poi" r={k?66:84} on={k?0:S.s4.on} pulse={k?0:S.s4.arrive} show={smooth(S.s4.route*3-k*.6)}/></At>)}</Item>
   <g transform={`translate(${f2(c[0]+70)} ${f2(c[1]+80)})`} opacity={.24}><ellipse rx={120} ry={120} fill="#1A1410"/></g>
   <Item id="s4-drone"><At p={c} s={.78}><InspectionDroneHero part="top" spin={1} phase={S.s4.phase} lamp={blinkLamp(t)} cone={S.s4.cone} coneLen={dist} coneDir={coneDir}/></At></Item>
  </g>;
  break;}
 // ===== s2: the flight screen's alert, and whose claim it is =====
 case 'alert-panel':
 case 'panel-wide':
 case 'desk-overhead':{
  // The tablet's flight screen lights, row then map; the alert flag rises from the anomaly marker on the
  // valve, lights amber and rings the bezel once; the paper tag reading the companies say swings in on its
  // string and hooks onto the flag, which recoils and settles.
  if(sid!=='s2')throw new Error(view+' draws the s2 alert only');
  const T=TABLET[view],flatView=view==='desk-overhead';
  const screen=<LeakReviewSupport part="flightScreen" W={T.W} H={T.H} lit={S.s2.lit} flag={S.s2.flag} t={t} sway={S.s2.recoil}/>;
  pic=<g>
   <Item id="s2-setting">{!flatView&&<LeakReviewSupport part="desk" y={DESK_Y[view]}/>}{deskProps(view)}</Item>
   <Item id="s2-software"><Item id="s2-alert">{tabletDrawn(T,screen,S.s2.pulse)}</Item></Item>
   {claimTag(T,view==='panel-wide'?34:38)}
  </g>;
  break;}
 // ===== s3: the approval letter, its date and its approval =====
 case 'letter-desk':
 case 'letter-wide':
 case 'approval-close':
 case 'letter-overhead':
 case 'date-detail':{
  // The unsealed letter slides onto the desk and its first lines write in; a stamp comes down and leaves
  // the date crooked on it; a second stamp presses the approved mark beside the clipped tag. Side on in
  // the desk views, straight down in the close, the overhead and the detail.
  if(sid!=='s3')throw new Error(view+' draws the s3 letter only');
  const L=LETTER_AT[view],slide=(1-S.s3.slide)*LETTER_FROM,top=view==='approval-close'||view==='letter-overhead'||view==='date-detail';
  const Lx={...L,x:L.x+slide,r:(L.r??0)-6*(1-S.s3.slide)};
  const desk=view==='letter-desk'||view==='letter-wide';
  pic=<g>
   <Item id="s3-setting">{desk&&<LeakReviewSupport part="desk" y={DESK_Y[view]}/>}{deskProps(view)}</Item>
   <Item id="s3-letter"><g transform={paperTransform(Lx)}><LeakReviewSupport part="letter" write={S.s3.write} date={S.s3.date.inked} approved={S.s3.approved.inked}/></g></Item>
   <Item id="s3-date">{stampAt(Lx,letterMarks.date,S.s3.date,LETTER.date.w,LETTER.date.h,top,LETTER.date.rot)}</Item>
   <Item id="s3-approval">{stampAt(Lx,letterMarks.approved,S.s3.approved,LETTER.approved.w,LETTER.approved.h,top,LETTER.approved.rot)}</Item>
  </g>;
  break;}
 // ===== s5: the certified inspector reviews the footage (the turn) =====
 case 'review-panel':
 case 'review-wide':
 case 'panel-overhead':
 case 'followup-tag':
 case 'inspector-mark':{
  // The survey footage slides onto the review screen and fills the filmstrip; the certified inspector mark
  // drops onto the footage, jolting it, and a dashed outline rings the shimmer; the follow-up inspection tag
  // lifts off the footage and travels to the valve on the pad, where it hangs on the handwheel and settles.
  if(sid!=='s5')throw new Error(view+' draws the s5 review only');
  const T=TABLET[view],flatView=view==='panel-overhead',near=view==='followup-tag'||view==='inspector-mark';
  const screen=<LeakReviewSupport part="reviewScreen" W={T.W} H={T.H} t={t} arrive={S.s5.arrive} mark={S.s5.mark} outline={S.s5.outline} check={0} box={0} jolt={S.s5.jolt}/>;
  pic=<g>
   {!flatView&&!near&&<Item id="s5-setting"><LeakReviewSupport part="desk" y={DESK_Y[view]}/></Item>}
   {deskProps(view)}
   <Item id="s5-footage"><Item id="s5-inspector"><Item id="s5-emission">{tabletDrawn(T,screen)}</Item></Item></Item>
   {followUp(T,near?40:32)}
  </g>;
  break;}
 // ===== s6: where AI appears in the letter =====
 case 'title-detail':
 case 'letter-scroll':
 case 'letter-overhead-scan':{
  // The long letter scrolls up to its protocol title; an amber highlight lands on AI at the start of the
  // title's second line, overshooting the word a little; a counter tag drops in under it on a short string.
  if(sid!=='s6')throw new Error(view+' draws the s6 letter only');
  const A=LONG_AT[view],y0=A.titleY-A.s*LONG.titleY+A.s*LONG_SCROLL*(1-S.s6.scroll);
  const page=<g transform={`translate(${A.x} ${f2(y0)}) scale(${A.s})`}><LeakReviewSupport part="longLetter" hl={S.s6.hl}/></g>;
  const H=longHighlight(),hp:Pt=[A.x+A.s*(H.x+H.w*.5),y0+A.s*(H.y+H.h)];
  const hole:Pt=[A.x+A.s*60,A.titleY+A.s*170+(view==='title-detail'?20:40)];
  pic=<g>
   {view==='letter-scroll'&&<g><Item id="s6-setting"><LeakReviewSupport part="desk" y={DESK_Y[view]}/></Item>{holder(page)}</g>}
   {view!=='letter-scroll'&&<Item id="s6-letter"><Item id="s6-title">{page}</Item></Item>}
   {view==='letter-overhead-scan'&&<g data-part="reading-ruler"><rect x={196} y={A.titleY-70} width={700} height={190} rx={10} fill="#E9F1F3" opacity={.35} stroke="#7E8A90" strokeWidth={3}/>
    {Array.from({length:22},(_,k)=><path key={k} d={`M${210+k*31} ${A.titleY-70}v${k%5?14:26}`} stroke="#5E6A70" strokeWidth={2}/>)}</g>}
   {view==='letter-overhead-scan'&&deskProps(view)}
   {counterTag(hp,hole,view==='title-detail'?40:36)}
  </g>;
  break;}
 // ===== s7: a separate program, delayed =====
 case 'program-calendar':
 case 'program-wide':
 case 'program-overhead':{
  // A program tag drops onto the desk and settles; the easel calendar's kraft cover flips up over its
  // rings to January 22nd, 2027; a delayed bar slides onto the tag's blank band and the tag jostles.
  if(sid!=='s7')throw new Error(view+' draws the s7 program only');
  const G=PROGRAM_AT[view],C=CAL_AT[view];
  pic=<g>
   {view!=='program-overhead'&&<Item id="s7-setting"><LeakReviewSupport part="desk" y={DESK_Y[view]}/></Item>}
   {deskProps(view)}
   <Item id="s7-calendar"><At p={[C.x,C.y]}><LeakReviewSupport part="calendar" w={C.w} flip={S.s7.flip}/></At></Item>
   {programTag(G,S.s7.drop,S.s7.bar,S.s7.settle+S.s7.jostle,'s7')}
  </g>;
  break;}
 // ===== s8: the October 7th release and the proposal =====
 case 'proposal-close':
 case 'proposal-wide':
 case 'proposal-overhead':{
  // The day block's cover turns over to October 7th and the EPA release card slides in beside it; the
  // proposal tag reading will propose to rescind clips onto the delayed program tag; its dashed stamp box
  // draws round and stays empty.
  if(sid!=='s8')throw new Error(view+' draws the s8 proposal only');
  const G=PROGRAM_AT[view],D=DAY_AT[view],Q=PROPOSAL_AT[view];
  const cardX=lerp(1120,D.card[0],S.s8.card);
  const ps=tagSize(['Will propose','to rescind'],Q.size,Q.extra),from:Pt=[Q.x+420,Q.y+360];
  const qp:Pt=[lerp(from[0],Q.x,S.s8.prop),lerp(from[1],Q.y,S.s8.prop)];
  pic=<g>
   {view==='proposal-wide'&&<Item id="s8-setting"><LeakReviewSupport part="desk" y={DESK_Y[view]}/></Item>}
   {deskProps(view)}
   <Item id="s8-date"><At p={[D.x,D.y]}><LeakReviewSupport part="dayBlock" w={D.w} flip={S.s8.day}/></At>
    {S.s8.card>0&&<At p={[cardX,D.card[1]]} r={lerp(8,-3,S.s8.card)}><LeakReviewSupport part="releaseCard" w={D.cardW}/></At>}</Item>
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
 case 'panel-wide-hold':
 case 'blank-box':{
  // The inspector mark presses again and its check draws: confirmed. A blank dashed box labelled AI draws
  // beside the footage and stays empty. Through the window the station's hood closes over the docked drone
  // and its lamp turns green, while the frame holds on the mark and the empty box.
  if(sid!=='s9')throw new Error(view+' draws the s9 close only');
  const T=TABLET[view],near=view==='confirm-close'||view==='blank-box';
  const screen=<LeakReviewSupport part="reviewScreen" W={T.W} H={T.H} t={t} arrive={1} mark={1} press={S.s9.press} outline={1} check={S.s9.check} box={S.s9.box}/>;
  pic=<g>
   <Item id="s9-station">{windowOutside(view)}</Item>
   {!near&&<Item id="s9-setting"><LeakReviewSupport part="desk" y={DESK_Y[view]}/></Item>}
   {deskProps(view)}
   <Item id="s9-footage"><Item id="s9-inspector"><Item id="s9-ai-box">{tabletDrawn(T,screen)}</Item></Item></Item>
  </g>;
  break;}
 default:throw new Error('Unimplemented leak review view '+view);
 }

 // ---- the disclosure chip: the board's production_disclosure, on every scene ----
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
