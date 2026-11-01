import React from 'react';
import {useUid} from '../../../lib/uid';
import {actionProgress,joinedActionWindow,type ActionWindow} from '../../../lib/direction';
import {RestaurantSupport,RS,STAND,PANEL,TABLE,GUESTS,APRON_LEN} from './RestaurantSupport';

/**
 * s2 of the order handover film (route order-pass-v1), the station handover (2026-10-26, Wok and Karahi, Spring, Harris County).
 *
 * Claims c2 (the family did not post a job ad), c1 (the position went to an AI platform named Haniya) and
 * c5 (the digital server answers the phone). The film shows no sign, card or notice in any window: the
 * absence of an ad is performed as the job being closed at the station the server left.
 *
 *  shot 1, n2a  The host stand from s1, same place, same props: the apron on its side hook, the blank pad and
 *               the desk phone still rattling with its ring marks; the door behind stays shut, its bell still.
 *               A family member's arm enters at stand height, one jointed limb from a frame-edge shoulder. The
 *               hand pulls the stand's drawer open, lifts the server's apron off its hook by the neck strap
 *               (the hook is left bare), folds it once over the drawer and lays it in, then pushes the drawer
 *               shut. A strap end stays caught in the seam. The arm withdraws; the shut drawer is held.
 *  shot 2, n2b  The same arm carries the dark host panel in and sets it on the stand top. Its foot lands on
 *               the contact curve with a contact shadow, the hand lets go and withdraws, and the panel lights
 *               from the left and writes Haniya. The desk phone's ringing stops: its rattle and ring marks
 *               die away, its line lamp holds steady in the panel's light and voice arcs pass between the
 *               phone and the panel. The person performs "put"; the panel answers the s1 phone.
 *  shot 3, n2b  The AI host tag is carried in on its string and hooks onto the panel's eyelet, swings and
 *               settles beside the lit name, with the answered phone at the frame edge.
 *
 * Every state is a closed function of the film clock and the board's s2 event windows, so any frame renders
 * alone and the same twice. All new drawing (the arm and hand, the drawer, the panel's desk foot, the
 * answered phone's lamp and arcs) is authored here, so the two recorded art groups keep their bytes.
 * Disclosed illustration: a generic stand and panel, no real person, software or brand mark.
 */

export type StationView='apron-drawer'|'front-stand'|'host-panel'|'ai-tag'|'tag-detail';
export const STATION_VIEWS:readonly StationView[]=['apron-drawer','front-stand','host-panel','ai-tag','tag-detail'];
type XY=[number,number];
type Mount={x:number;y:number;s:number};

const unit=(v:number)=>v<0?0:v>1?1:v;
const span=(r:number,a:number,b:number)=>unit((r-a)/(b-a));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const mixXY=(a:XY,b:XY,p:number):XY=>[mix(a[0],b[0],p),mix(a[1],b[1],p)];
/** Travel: zero velocity and acceleration at both ends. */
const glide=(q:number)=>{const x=unit(q);return x*x*x*(10+x*(-15+6*x));};
/** Contact: approaches slowly and seats without overshoot. */
const seat=(q:number)=>{const x=unit(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
const soft=(q:number)=>{const x=unit(q);return x*x*(3-2*x);};
const n2=(v:number)=>v.toFixed(2);
const RAD=Math.PI/180;
/** A released thing settling about its pin `tau` seconds after release; zero before release. */
const settleSwing=(tau:number,amp:number,hz:number,decay:number)=>tau<=0?0:amp*Math.exp(-decay*tau)*Math.sin(2*Math.PI*hz*tau)*soft(tau/.1);
const onStand=(m:Mount,p:XY):XY=>[m.x+m.s*p[0],m.y+m.s*p[1]];
const offStand=(m:Mount,p:XY):XY=>[(p[0]-m.x)/m.s,(p[1]-m.y)/m.s];

// ---- the station's furniture, in stand units (HostStand's top surface is STAND.top, its hook STAND.hook) ----
/** The drawer under the stand's top: its face spans `slot` to `slot+face` when shut, `out` is how far the face
 * drops on screen when pulled fully open (the view looks down a little), and the pull sits `pull` below the
 * face's top edge. The pad, the desk phone and the panel's foot share the top surface. */
export const STATION={
 drawer:{half:104,slot:-396,face:70,out:40,pull:35},
 pad:{x:-100,s:.7},
 phone:{x:84,s:.8},
 panelFoot:[-18,STAND.top] as XY,
 panelK:.55,
 apronK:.72,
 lift:[14,-64] as XY,
 tailX:34,
};
/** The panel's head is RestaurantSupport's host panel without its floor pole: its bezel's lower edge stands
 * NECK panel units above the desk foot, so the head's own coordinates drop by HEAD_DROP. */
const NECK=40,HEAD_DROP=-(PANEL.cy+PANEL.h/2)-NECK;
/** A point in the panel's own units to stand units, for the foot at `foot` tipped by `rot` degrees. */
export function panelToStand(foot:XY,rot:number,p:XY):XY{
 const k=STATION.panelK,x=k*p[0],y=k*(p[1]+HEAD_DROP),c=Math.cos(rot*RAD),s=Math.sin(rot*RAD);
 return [foot[0]+x*c-y*s,foot[1]+x*s+y*c];
}
/** Where the hand closes on the panel's neck while it carries it (foot-frame panel units). */
const NECK_GRIP:XY=[-16,-HEAD_DROP-24];
export const lampAt=():XY=>[STATION.phone.x+STATION.phone.s*58,STAND.top-STATION.phone.s*28];
export const eyeletAt=():XY=>panelToStand(STATION.panelFoot,0,PANEL.eyelet);
export const speakerAt=():XY=>panelToStand(STATION.panelFoot,0,[0,PANEL.screen.y+100]);
const faceTop=(open:number)=>STATION.drawer.slot+STATION.drawer.out*open;
const pullAt=(open:number):XY=>[0,faceTop(open)+STATION.drawer.pull];

// ---- the performed state ------------------------------------------------------------------------------------
/** Shot 1's stages as fractions of its joined window (s2-event-1 into s2-event-4, which meet near the end of the
 * lift): the reach arrives at the pull, the drawer opens, the hand moves to the hook and closes on the strap, the
 * apron lifts clear, is carried over the drawer while it folds, is lowered in and let go, the hand moves to the
 * drawer's face and pushes it shut. Every stage starts where the last one ended. */
const SHOT1_PHASES={reach:.24,pulled:.32,hooked:.43,grip:[.41,.46],lift:[.46,.53],carried:.67,release:[.78,.81],front:[.8,.86],shut:[.86,.97]};
function windowOf(W:Record<string,ActionWindow>,id:string){const w=W[id];if(!w)throw new Error('The station handover needs board event '+id);return w;}
/** Everything that moves in s2, from the film clock and the board's five s2 event windows. Pure in t. */
export function handoverClock(W:Record<string,ActionWindow>,t:number){
 // Each clause's performance is one uninterrupted stroke across two adjacent board events, joined without a rest:
 // s2-event-1 (drawer open, apron off the hook) runs into s2-event-4 (folded in, drawer shut), and s2-event-2 (the
 // panel set down and let go) runs into s2-event-5 (it lights, writes its name and answers the phone).
 windowOf(W,'s2-event-4');windowOf(W,'s2-event-5');
 const w1=joinedActionWindow(W,['s2-event-1','s2-event-4']),w2=joinedActionWindow(W,['s2-event-2','s2-event-5']),w3=windowOf(W,'s2-event-3');
 // shot 1: the arm starts in from the frame edge a third of a second before the clause, so its long reach is
 // never squeezed; it opens the drawer, takes the apron off the hook, folds it in and shuts the drawer, then eases
 // back from the stand so the bare hook and the shut drawer are held to the cut.
 const P1=SHOT1_PHASES,d1=w1.end-w1.start,r1=unit((t-w1.start)/d1),lead=.34;
 const reach=glide((t-(w1.start-lead))/(lead+P1.reach*d1));
 const opened=glide(span(r1,P1.reach,P1.pulled)),shut=seat(span(r1,P1.shut[0],P1.shut[1]));
 const hand1=r1<P1.pulled?.55*soft(span(r1,P1.reach-.07,P1.reach)):r1<P1.grip[0]?.55*(1-soft(span(r1,P1.pulled,P1.pulled+.05))):
  r1<P1.release[0]?seat(span(r1,P1.grip[0],P1.grip[1])):r1<P1.release[1]?1-soft(span(r1,P1.release[0],P1.release[1])):.35*soft(span(r1,.82,.86));
 // shot 2: the panel is carried in, seated, let go; it lights, writes its name and the phone is answered while the
 // arm leaves the frame.
 const d2=w2.end-w2.start,r2=unit((t-w2.start)/d2);
 // shot 3: the tag on its string, on the board's own contact curve.
 const tag=actionProgress(w3,t);
 return {r1,r2,started2:t>w2.start,
  reach,drawer:opened*(1-shut),toHook:glide(span(r1,P1.pulled,P1.hooked)),lift:glide(span(r1,P1.lift[0],P1.lift[1])),
  carry:glide(span(r1,P1.lift[1],P1.carried)),fold:soft(span(r1,P1.lift[1]+.02,P1.carried-.02)),lower:glide(span(r1,P1.carried,P1.release[0])),
  toFront:glide(span(r1,P1.front[0],P1.front[1])),hand1,leave1:glide((t-(w1.end+.03))/.45),
  bring:glide(span(r2,0,.42)),seat:seat(span(r2,.42,.5)),hand2:1-soft(span(r2,.5,.54)),leave2:glide(span(r2,.54,1)),
  lit:glide(span(r2,.54,.76)),name:glide(span(r2,.66,.94)),answer:soft(span(r2,.68,.78)),
  tag,tagCarry:Math.sin(Math.PI*tag),tagSettle:settleSwing(t-w3.end,9,1.1,2.2)};
}
export type Handover=ReturnType<typeof handoverClock>;

/** The apron's pose in stand units: the neck strap's apex (on the hook while it hangs), its tilt, how far it is
 * folded, and whether it is inside the open drawer (drawn only through the drawer's mouth from then on). */
export function apronPose(H:Handover){
 const D=STATION.drawer,hook=STAND.hook as XY,raised:XY=[hook[0]+STATION.lift[0],hook[1]+STATION.lift[1]];
 const folded=APRON_LEN*STATION.apronK*.5,above:XY=[0,D.slot+D.out-folded-12];
 let apex=mixXY(mixXY(hook,raised,H.lift),above,H.carry);
 const inside=H.carry>=1;
 // Inside the drawer it rides with the drawer, so as the drawer shuts it slides back under the face.
 if(inside)apex=[0,mix(above[1],faceTop(H.drawer)-34,H.lower)];
 return {apex,rot:-9*H.lift*(1-H.carry),fold:H.fold,inside,hanging:H.lift<=0,tail:H.lower>=.9?1:0};
}
const strapOf=(apex:XY):XY=>[apex[0],apex[1]+10];

// ---- the arm --------------------------------------------------------------------------------------------------
export type ArmPose={S:XY;E:XY;W:XY;ang:number;grip:number;hs:number};
/** The grip point in the hand's own frame (x along the hand from the wrist): fingertips when open, the curled
 * fingers' front when closed. */
const gripPoint=(g:number,hs:number):XY=>[mix(124,96,g)*hs,mix(0,6,g)*hs];
/** One jointed arm from shoulder S whose grip point lands on `target`: upper arm a, forearm b, the hand bent
 * `bend` degrees from the forearm, the elbow on the lower side. A fixed number of passes, so the same target
 * gives the same pose on every frame. */
export function reachArm(S:XY,target:XY,a:number,b:number,hs:number,bend:number,grip:number):ArmPose{
 const gp=gripPoint(grip,hs);
 let phi=Math.atan2(target[1]-S[1],target[0]-S[0])+bend*RAD,E:XY=S,Wr:XY=S;
 for(let pass=0;pass<6;pass++){
  const c=Math.cos(phi),s=Math.sin(phi);
  const want:XY=[target[0]-(gp[0]*c-gp[1]*s),target[1]-(gp[0]*s+gp[1]*c)];
  const dx=want[0]-S[0],dy=want[1]-S[1],d=Math.min(a+b-.5,Math.max(Math.abs(a-b)+.5,Math.hypot(dx,dy)));
  const base=Math.atan2(dy,dx),open=Math.acos(Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))));
  E=[S[0]+a*Math.cos(base+open),S[1]+a*Math.sin(base+open)];
  const fa=Math.atan2(want[1]-E[1],want[0]-E[0]);
  Wr=[E[0]+b*Math.cos(fa),E[1]+b*Math.sin(fa)];
  phi=fa+bend*RAD;
 }
 return {S,E,W:Wr,ang:phi/RAD,grip,hs};
}
/** The family member: a skin fill and a rolled olive work sleeve, distinct from every other hand in the film. */
export const FAMILY={skin:'#D9A97E',skinShade:'#B98760',sleeve:'#5C6B3C',sleeveLit:'#76854F',sleeveDeep:'#434F2A'};
/** A tapered limb with round ends from p (radius r0) to q (radius r1). */
function limbPath(p:XY,q:XY,r0:number,r1:number){
 const L=Math.hypot(q[0]-p[0],q[1]-p[1])||1,nx=-(q[1]-p[1])/L,ny=(q[0]-p[0])/L;
 return `M${n2(p[0]+nx*r0)} ${n2(p[1]+ny*r0)}L${n2(q[0]+nx*r1)} ${n2(q[1]+ny*r1)}A${n2(r1)} ${n2(r1)} 0 0 1 ${n2(q[0]-nx*r1)} ${n2(q[1]-ny*r1)}`+
  `L${n2(p[0]-nx*r0)} ${n2(p[1]-ny*r0)}A${n2(r0)} ${n2(r0)} 0 0 1 ${n2(p[0]+nx*r0)} ${n2(p[1]+ny*r0)}Z`;
}
/** The hand in its own frame, wrist at the origin, pointing along +x: palm, four fingers that curl as `grip`
 * closes, and the thumb wrapping over the held thing. Line weights match the film's other hands. */
const FamilyHand:React.FC<{grip:number}>=({grip})=>{
 const g=unit(grip),C=FAMILY;
 const fingers:[number,number][]=[[-21,46],[-7,56],[7,54],[21,44]];
 const thumbTip:XY=[mix(60,70,g),mix(-52,-26,g)];
 return <g data-part="family-hand">
  {fingers.map(([y,len],i)=>{const tip:XY=[70+len*(1-.6*g),y*1.05+5*g],mid:XY=[70+len*.55*(1-.35*g),y+2*g];
   const d=`M70 ${y}Q${n2(mid[0])} ${n2(mid[1]-3*g)} ${n2(tip[0])} ${n2(tip[1])}`;
   return <g key={i}><path d={d} stroke={RS.ink} strokeWidth={19} strokeLinecap="round" fill="none"/>
    <path d={d} stroke={C.skin} strokeWidth={12.5} strokeLinecap="round" fill="none"/>
    {g<.5&&<ellipse cx={n2(tip[0]-2)} cy={n2(tip[1])} rx={4.5} ry={3.6} fill="#F6E2CF" opacity={n2(.7*(1-2*g))}/>}</g>;})}
  <path d="M0 -21C22 -27 50 -31 74 -28L76 28C52 32 24 28 0 21Z" fill={C.skin} stroke={RS.ink} strokeWidth={3.4}/>
  <path d="M66 -24q6 6 0 12M68 -8q6 6 0 12M67 8q6 6 0 12" stroke={RS.ink} strokeWidth={1.8} opacity={.35} fill="none"/>
  <path d="M10 14C30 18 48 20 66 18" stroke={C.skinShade} strokeWidth={4} opacity={.5} fill="none"/>
  <path d={`M16 -20Q${n2(mix(40,52,g))} ${n2(mix(-44,-34,g))} ${n2(thumbTip[0])} ${n2(thumbTip[1])}`} stroke={RS.ink} strokeWidth={21} strokeLinecap="round" fill="none"/>
  <path d={`M16 -20Q${n2(mix(40,52,g))} ${n2(mix(-44,-34,g))} ${n2(thumbTip[0])} ${n2(thumbTip[1])}`} stroke={C.skin} strokeWidth={14.5} strokeLinecap="round" fill="none"/>
  <path d="M8 -16C20 -22 34 -26 50 -26" stroke="#FFFFFF" strokeWidth={2.4} opacity={.25} fill="none"/>
 </g>;
};
/** The whole arm: the shoulder at the frame edge, the sleeved upper arm, the rolled cuff two fifths down the
 * forearm, the bare forearm and the hand. Every joint is drawn, so the limb never floats. */
const FamilyArm:React.FC<{pose:ArmPose}>=({pose})=>{
 const {S,E,W,hs}=pose,C=FAMILY,ru=33*hs,rf=28*hs;
 const cuff:XY=mixXY(E,W,.42),cuffEnd:XY=mixXY(E,W,.5);
 return <g data-part="family-arm">
  <ellipse cx={n2(S[0]-10*hs)} cy={n2(S[1]+6*hs)} rx={n2(ru*1.25)} ry={n2(ru*1.45)} fill={C.sleeveDeep} stroke={RS.ink} strokeWidth={3.6}/>
  <path d={limbPath(S,E,ru,ru*.86)} fill={C.sleeve} stroke={RS.ink} strokeWidth={3.6}/>
  <path d={limbPath(mixXY(S,E,.12),mixXY(S,E,.8),ru*.32,ru*.26)} fill={C.sleeveLit} opacity={.45}/>
  <path d={limbPath(cuffEnd,W,rf*.86,rf*.72)} fill={C.skin} stroke={RS.ink} strokeWidth={3.6}/>
  <path d={limbPath(mixXY(cuffEnd,W,.15),mixXY(cuffEnd,W,.85),rf*.2,rf*.16)} fill={C.skinShade} opacity={.35}/>
  <path d={limbPath(E,cuff,rf,rf*.92)} fill={C.sleeve} stroke={RS.ink} strokeWidth={3.6}/>
  <circle cx={n2(E[0])} cy={n2(E[1])} r={n2(ru*.86)} fill={C.sleeve} stroke={RS.ink} strokeWidth={3.6}/>
  <path d={limbPath(mixXY(E,cuff,.15),mixXY(E,cuff,.85),rf*.3,rf*.28)} fill={C.sleeveLit} opacity={.4}/>
  <path d={limbPath(cuff,cuffEnd,rf*1.08,rf*1.02)} fill={C.sleeveLit} stroke={RS.ink} strokeWidth={3.4}/>
  <g transform={`translate(${n2(W[0])} ${n2(W[1])}) rotate(${n2(pose.ang)}) scale(${n2(hs)})`}><FamilyHand grip={pose.grip}/></g>
 </g>;
};

// ---- the staging per view (screen pixels) ------------------------------------------------------------------
type ArmSpec={rest:XY;out:XY;upper:number;fore:number;hand:number;bend:number;bring?:XY};
type Stage={stand:Mount;room:'medium'|'wide'|'none';door?:{x:number;y:number;s:number};pendants?:[number,number][];
 arm?:ArmSpec;tag?:{from:XY;len:number;sign:1|-1}};
/** A: counter level (medium, close, detail). B: the high wide from the dining room's front, then medium and
 * detail. The stand keeps one place and the hook its side in every shot; the region stands in the back window. */
export const STAGES:Record<string,Stage>={
 'apron-drawer:a':{stand:{x:560,y:1330,s:1.15},room:'medium',door:{x:-170,y:1160,s:1},pendants:[[600,300]],
  arm:{rest:[64,814],out:[-170,850],upper:250,fore:236,hand:1,bend:12}},
 'front-stand:b':{stand:{x:500,y:1250,s:.95},room:'wide',door:{x:90,y:1080,s:.85},pendants:[[700,300]],
  arm:{rest:[60,790],out:[-160,820],upper:228,fore:215,hand:.9,bend:12}},
 'host-panel:a':{stand:{x:420,y:1880,s:2.1},room:'none',arm:{rest:[-300,800],out:[-520,830],upper:430,fore:405,hand:1.75,bend:0,bring:[-562,-60]}},
 'host-panel:b':{stand:{x:520,y:1340,s:1.3},room:'medium',door:{x:-150,y:1160,s:1},pendants:[[640,320]],
  arm:{rest:[-140,690],out:[-380,720],upper:282,fore:266,hand:1.13,bend:0,bring:[-607,-60]}},
 'ai-tag:a':{stand:{x:433,y:2563,s:3},room:'none',tag:{from:[1180,300],len:120,sign:-1}},
 'tag-detail:b':{stand:{x:640,y:2583,s:3},room:'none',tag:{from:[-140,320],len:110,sign:1}},
};
const FLOOR_OF={medium:1160,wide:1080};
export function stageOf(view:StationView,variant:'a'|'b'):Stage{
 const st=STAGES[view+':'+variant];
 if(!st)throw new Error('The station handover has no '+variant+' staging for '+view);
 return st;
}
/** Where the panel's carry starts by default, relative to its seat on the stand, in screen pixels: just beyond the
 * left edge. A view's arm can set its own start so the head begins just out of frame and travels no further. */
const BRING_FROM:XY=[-600,-60];

/** The complete s2 rig at t for one view: arm pose, apron, panel and the points a viewer must read, in screen
 * pixels where named so. Shared by the drawing and by bound checks. */
export function stationRig(view:StationView,variant:'a'|'b',W:Record<string,ActionWindow>,t:number){
 const H=handoverClock(W,t),st=stageOf(view,variant),M=st.stand,ap=apronPose(H);
 const shot1=view==='apron-drawer'||view==='front-stand',shot2=view==='host-panel';
 // the panel: carried in from the left edge, seated on the contact curve, then left standing
 let panel:{foot:XY;rot:number;shadow:number}|null=null;
 if(!shot1&&H.started2){
  const seatXY=onStand(M,STATION.panelFoot),k=1-H.bring,from=st.arm?.bring??BRING_FROM;
  const foot:XY=[seatXY[0]+from[0]*k,seatXY[1]+from[1]*k-18*M.s*(1-H.seat)];
  panel={foot:offStand(M,foot),rot:-7*(1-H.seat),shadow:H.seat};
 }
 let arm:ArmPose|null=null;
 if(st.arm&&(shot1||shot2)){
  const A=st.arm,ready=(S:XY):XY=>[S[0]+150*A.hand,S[1]+120*A.hand];
  if(shot1){
   const S=mixXY(A.out,A.rest,H.reach);
   const r=H.r1,P1=SHOT1_PHASES,on=(p:XY)=>onStand(M,p);
   let target:XY;
   if(r<P1.reach)target=mixXY(ready(S),on(pullAt(0)),H.reach);
   else if(r<P1.pulled)target=on(pullAt(H.drawer));
   else if(r<P1.grip[1])target=mixXY(on(pullAt(1)),on(strapOf(STAND.hook as XY)),H.toHook);
   else if(r<P1.front[0])target=on(strapOf(ap.apex));
   else if(r<P1.front[1])target=mixXY(on(strapOf(ap.apex)),on(pullAt(1)),H.toFront);
   else target=on(pullAt(H.drawer));
   // After the drawer shuts the hand eases back and down off the stand and rests there through the cut.
   const easeBack=on(pullAt(0)),rest:XY=[easeBack[0]-170*M.s,easeBack[1]+80*M.s];
   if(H.leave1>0)target=mixXY(target,rest,H.leave1);
   if(H.reach>0)arm=reachArm(S,target,A.upper,A.fore,A.hand,A.bend,H.hand1);
  }else if(panel){
   const S=mixXY(A.out,A.rest,H.bring*(1-H.leave2));
   const grip=onStand(M,panelToStand(panel.foot,panel.rot,NECK_GRIP));
   const target=H.leave2>0?mixXY(grip,ready(S),H.leave2):grip;
   if(H.leave2<1)arm=reachArm(S,target,A.upper,A.fore,A.hand,A.bend,H.hand2);
  }
 }
 return {H,st,M,apron:ap,panel,arm,
  hook:onStand(M,STAND.hook as XY),pull:onStand(M,pullAt(H.drawer)),lamp:onStand(M,lampAt()),eyelet:onStand(M,eyeletAt()),
  speaker:onStand(M,speakerAt()),seat:onStand(M,STATION.panelFoot)};
}

// ---- the drawn parts ---------------------------------------------------------------------------------------
const Item:React.FC<{id:string;children?:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
/** The drawer's mouth (the dark inside seen from a little above), drawn under the face. */
const DrawerMouth:React.FC<{open:number}>=({open})=>{const D=STATION.drawer,o=unit(open);if(o<=0)return null;
 const ft=faceTop(o),w=D.half*(1+.05*o);
 return <g data-part="drawer-mouth">
  <path d={`M${-D.half} ${D.slot}H${D.half}L${n2(w)} ${n2(ft)}H${n2(-w)}Z`} fill={RS.woodDeep} stroke={RS.ink} strokeWidth={2.4}/>
  <path d={`M${-D.half+6} ${D.slot+3}L${n2(-w+8)} ${n2(ft-2)}M${D.half-6} ${D.slot+3}L${n2(w-8)} ${n2(ft-2)}`} stroke={RS.wood} strokeWidth={3} opacity={.7}/>
  <path d={`M${-D.half+10} ${D.slot+2}H${D.half-10}`} stroke="#140E0A" strokeWidth={4} opacity={.6}/>
 </g>;};
/** The drawer's face with its brass pull, pulled out by `open`; worn at one corner, the pull a touch crooked. */
const DrawerFace:React.FC<{open:number}>=({open})=>{const D=STATION.drawer,o=unit(open),ft=faceTop(o),w=D.half*(1+.05*o),h=D.face*(1+.05*o);
 return <g data-part="drawer-face">
  {o>0&&<path d={`M${n2(-w)} ${n2(ft+h)}H${n2(w)}`} stroke="#1A1410" strokeWidth={8} opacity={n2(.25*o)}/>}
  <rect x={n2(-w)} y={n2(ft)} width={n2(2*w)} height={n2(h)} rx={6} fill={RS.wood} stroke={RS.ink} strokeWidth={3}/>
  <path d={`M${n2(-w+10)} ${n2(ft+8)}H${n2(w-12)}`} stroke={RS.woodLit} strokeWidth={2.6} opacity={.65}/>
  <path d={`M${n2(w-22)} ${n2(ft+h-3)}l18 -14`} stroke={RS.woodDeep} strokeWidth={3} opacity={.6}/>
  <g transform={`rotate(2.5 0 ${n2(ft+D.pull)})`}>
   <rect x={-34} y={n2(ft+D.pull-8)} width={68} height={16} rx={8} fill={RS.brass} stroke={RS.ink} strokeWidth={2.4}/>
   <path d={`M-24 ${n2(ft+D.pull-3)}H18`} stroke={RS.brassLit} strokeWidth={2.4} opacity={.85}/>
  </g>
 </g>;};
/** The apron at its pose; `clip` keeps it inside the drawer's mouth once it is laid in. */
const ApronAt:React.FC<{apex:XY;rot:number;fold:number}>=({apex,rot,fold})=>{const k=STATION.apronK,f=unit(fold);
 return <g transform={`translate(${n2(apex[0])} ${n2(apex[1])}) rotate(${n2(rot)}) scale(${k} ${n2(k*(1-.5*f))})`}>
  <RestaurantSupport part="apron"/>
  {f>0&&<path d="M-92 458Q0 476 94 458" stroke={RS.apronLit} strokeWidth={n2(10/(1-.5*f))} opacity={n2(.8*f)} fill="none"/>}
 </g>;};
/** The strap end caught in the shut drawer's seam: proof the apron is inside. */
const StrapTail:React.FC<{open:number}>=({open})=>{const ft=faceTop(open),x=STATION.tailX;
 return <g data-part="strap-tail"><path d={`M${x} ${n2(ft-2)}C${x+6} ${n2(ft+12)} ${x-4} ${n2(ft+24)} ${x+5} ${n2(ft+38)}`} stroke={RS.ink} strokeWidth={11} strokeLinecap="round" fill="none"/>
  <path d={`M${x} ${n2(ft-2)}C${x+6} ${n2(ft+12)} ${x-4} ${n2(ft+24)} ${x+5} ${n2(ft+38)}`} stroke={RS.apron} strokeWidth={6.5} strokeLinecap="round" fill="none"/></g>;};
/** The host panel standing on its weighted desk foot, in stand units at `foot`: RestaurantSupport's panel head,
 * its floor pole cut away below the bezel, on a short steel neck and an oval base plate. */
const PanelOnFoot:React.FC<{foot:XY;rot:number;shadow:number;lit:number;name:number;t:number}>=({foot,rot,shadow,lit,name,t})=>{
 const id=useUid('shpf'),k=STATION.panelK;
 return <g data-part="panel-on-foot">
  {shadow>0&&<ellipse cx={n2(foot[0]+8)} cy={n2(foot[1]+2)} rx={n2(48)} ry={7} fill="#1A1410" opacity={n2(.32*shadow)}/>}
  <g transform={`translate(${n2(foot[0])} ${n2(foot[1])}) rotate(${n2(rot)}) scale(${k})`}>
   <defs><clipPath id={id}><path d="M-420 -1160H420V100H14V-38H-14V100H-420Z"/></clipPath></defs>
   <rect x={-13} y={-NECK-2} width={26} height={NECK-6} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={2.6}/>
   <path d={`M-6 ${-NECK+2}V-10`} stroke={RS.steelLit} strokeWidth={3} opacity={.7}/>
   <path d="M-72 -2C-72 -16 -44 -22 0 -22C44 -22 72 -16 72 -2C72 6 44 10 0 10C-44 10 -72 6 -72 -2Z" fill={RS.charcoal} stroke={RS.ink} strokeWidth={3}/>
   <path d="M-54 -12C-30 -18 20 -18 46 -14" stroke="#5A6268" strokeWidth={3} fill="none"/>
   <g clipPath={`url(#${id})`}><g transform={`translate(0 ${HEAD_DROP})`}><RestaurantSupport part="hostPanel" lit={lit} name={name} t={t}/></g></g>
  </g>
 </g>;};
/** The answered line: the phone's lamp held steady in the panel's light, and voice arcs passing from the phone
 * toward the panel's speaker. Screen pixels. */
const AnsweredLine:React.FC<{lamp:XY;speaker:XY;answer:number;s:number;t:number}>=({lamp,speaker,answer,s,t})=>{
 const a=unit(answer);if(a<=0)return null;
 const dir=Math.atan2(speaker[1]-lamp[1],speaker[0]-lamp[0]),ph=(t*1.1)%1,w=Math.min(s,2.2);
 return <g data-part="answered-line">
  <circle cx={n2(lamp[0])} cy={n2(lamp[1])} r={n2(15*s)} fill={RS.screenGlow} opacity={n2(.3*a)}/>
  <circle cx={n2(lamp[0])} cy={n2(lamp[1])} r={n2(6.2*s)} fill={RS.screenGlow} stroke={RS.ink} strokeWidth={1.6} opacity={n2(a)}/>
  {[0,1,2].map(k=>{const f=(ph+k/3)%1,r=(30+64*f)*s,h=34*RAD,c=lamp;
   const p0:XY=[c[0]+r*Math.cos(dir-h),c[1]+r*Math.sin(dir-h)],p1:XY=[c[0]+r*Math.cos(dir+h),c[1]+r*Math.sin(dir+h)];
   const d=`M${n2(p0[0])} ${n2(p0[1])}A${n2(r)} ${n2(r)} 0 0 1 ${n2(p1[0])} ${n2(p1[1])}`;
   return <g key={k} opacity={n2(a*(1-f)*soft(f/.15))}><path d={d} stroke={RS.ink} strokeWidth={n2(4.4*w)} fill="none" strokeLinecap="round"/>
    <path d={d} stroke={RS.screenGlow} strokeWidth={n2(2.6*w)} fill="none" strokeLinecap="round"/></g>;})}
 </g>;};
/** A tag on its string carried in from `from` until it hooks on its anchor (q 1), then swinging. Screen pixels. */
const StringTag:React.FC<{anchor:XY;from:XY;q:number;swing:number;carry:number;len:number}>=({anchor,from,q,swing,carry,len})=>{
 if(q<=0)return null;
 const p=mixXY(from,anchor,q),rise=-70*carry*(1-q);
 return <g data-part="string-tag" transform={`translate(${n2(p[0])} ${n2(p[1]+rise)})`}>
  <g transform={`rotate(${n2(swing)})`}><path d={`M0 0V${len}`} stroke={RS.ink} strokeWidth={3}/>
   <g transform={`translate(0 ${len})`}><RestaurantSupport part="tag" lines={['AI host']} size={46} tone="slate"/></g></g>
  {q>=.999&&<circle r={7} fill="none" stroke={RS.ink} strokeWidth={3}/>}
 </g>;};
/** The waiting table at the right of B's wide: the guest from s1 still seated, looking toward the stand. */
const WaitingTable:React.FC<{at:XY;s:number}>=({at,s})=>{const G=GUESTS[1];
 return <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`} data-part="waiting-table">
  <g transform="translate(-30 -10)"><RestaurantSupport part="chair" flip/></g>
  <g transform={`translate(0 ${TABLE.top+130})`}><RestaurantSupport part="guest" layer="body" {...G} look={-.8}/></g>
  <RestaurantSupport part="table">
   <g transform={`translate(-90 ${TABLE.top})`}><RestaurantSupport part="plate" food="none"/></g>
   <g transform={`translate(60 ${TABLE.top})`}><RestaurantSupport part="plate" food="none"/></g>
   <g transform={`translate(110 ${TABLE.top-2})`}><RestaurantSupport part="waterGlass"/></g>
   <g transform={`translate(-150 ${TABLE.top})`}><RestaurantSupport part="menuTent"/></g>
  </RestaurantSupport>
  <g transform={`translate(0 ${TABLE.top+130})`}><RestaurantSupport part="guest" layer="arms" {...G} raise={.4} menu/></g>
 </g>;};

/** The s2 picture for one view. */
export const StationHandoverScene:React.FC<{view:StationView;variant:'a'|'b';W:Record<string,ActionWindow>;t:number}>=({view,variant,W,t})=>{
 const clipId=useUid('shdr');
 const R=stationRig(view,variant,W,t),{H,st,M,apron,panel,arm}=R,D=STATION.drawer;
 const ring=1-H.answer,mouthTop=faceTop(H.drawer),mouthW=D.half*(1+.05*H.drawer);
 const tagRig=st.tag;
 return <g data-part="station-handover" data-view={view}>
  <Item id="s2-setting">
   {st.room!=='none'&&<RestaurantSupport part="floor" y={FLOOR_OF[st.room]}/>}
   {st.pendants?.map(([x,len],i)=><g key={i} transform={`translate(${x} 0)`}><RestaurantSupport part="pendant" len={len}/></g>)}
   {st.door&&<g transform={`translate(${st.door.x} ${st.door.y}) scale(${st.door.s})`}><RestaurantSupport part="door" open={0} bell={0}/></g>}
   {view==='front-stand'&&<WaitingTable at={[840,1190]} s={.55}/>}
  </Item>
  <g transform={`translate(${M.x} ${M.y}) scale(${M.s})`}>
   <Item id="s2-setting"><RestaurantSupport part="hostStand"/></Item>
   <Item id="s2-apron-drawer">
    <DrawerMouth open={H.drawer}/>
    {apron.inside&&<g>
     {/* While it is lowered it passes in front of the top, so everything above the slot shows too; once it lies
      in the drawer only the drawer's mouth shows it, and the shutting face covers it. */}
     <defs><clipPath id={clipId}><path d={H.lower<1
      ?`M-600 -1400H600V${D.slot}H${D.half}L${n2(mouthW)} ${n2(mouthTop)}H${n2(-mouthW)}L${-D.half} ${D.slot}H-600Z`
      :`M${-D.half} ${D.slot}H${D.half}L${n2(mouthW)} ${n2(mouthTop)}H${n2(-mouthW)}Z`}/></clipPath></defs>
     <g clipPath={`url(#${clipId})`}><ApronAt apex={apron.apex} rot={apron.rot} fold={apron.fold}/></g>
    </g>}
    <DrawerFace open={H.drawer}/>
    {apron.tail>0&&<StrapTail open={H.drawer}/>}
   </Item>
   {panel&&<Item id="s2-panel"><PanelOnFoot foot={panel.foot} rot={panel.rot} shadow={panel.shadow} lit={H.lit} name={H.name} t={t}/></Item>}
   <Item id="s2-setting"><g transform={`translate(${STATION.pad.x} ${STAND.top+6}) scale(${STATION.pad.s})`}><RestaurantSupport part="orderPad" curl={0}/></g></Item>
   <Item id="s2-phone"><g transform={`translate(${STATION.phone.x} ${STAND.top}) scale(${STATION.phone.s})`}><RestaurantSupport part="deskPhone" ring={ring} t={t}/></g></Item>
   {!apron.inside&&<Item id="s2-apron-drawer">
    <ApronAt apex={apron.apex} rot={apron.rot} fold={apron.fold}/>
    {apron.hanging&&<g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><RestaurantSupport part="apronHook"/></g>}
   </Item>}
  </g>
  <Item id="s2-phone"><AnsweredLine lamp={R.lamp} speaker={R.speaker} answer={H.answer} s={M.s} t={t}/></Item>
  {tagRig&&<Item id="s2-tag"><StringTag anchor={R.eyelet} from={tagRig.from} q={H.tag} len={tagRig.len}
   swing={tagRig.sign*18*H.tagCarry+H.tagSettle} carry={H.tagCarry}/></Item>}
  {arm&&<Item id="s2-hand"><FamilyArm pose={arm}/></Item>}
 </g>;
};
