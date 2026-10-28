import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {OrderRigHero,HP,PHONE,PHONE_UI,screenPt,PRINTER,PRINTER_TOP,railGrip,TICKET,JAR,pileTop,FINGER_ARM,type PhoneState} from './OrderRigHero';
import {RestaurantSupport,RS,STAND,PANEL,ORDER_CARD,LEDGER,RULE,FOLDER,DOOR_PLAN,TABLES_PLAN,STAND_PLAN,PASS_PLAN,
 GUESTS,GUEST_BACK,TABLE,tagSize,tagPath,stampSize,rulePenPoint,type Food} from './RestaurantSupport';

/**
 * order-pass-v1: who takes the order (2026-10-26, Harris County, Spring, the upper Gulf Coast).
 *
 * ONE order rig (OrderRigHero) carries the film and ONE family restaurant's world and records
 * (RestaurantSupport) surround it. Every performed state below is a closed function of the film clock and
 * the board's event windows (orderState), so any frame renders alone and the same twice.
 *
 *  s1  the storefront door swings shut, its bell rings and the server's left-behind apron swings on the host
 *      stand's hook; the desk phone rattles in its cradle with no one at the stand; two tables wait with
 *      empty plates, a guest raising a hand with a menu open, while the guest check pad's top sheet curls
 *      and falls back blank. No food is on any table before the kitchen cooks.
 *  s2  an empty sign frame swings on the glass and settles with nothing in it; the dark host panel beside
 *      the stand lights from the left and writes Haniya; a tag reading AI host is carried in on its string
 *      and hooks onto the panel's eyelet, where it swings and settles.
 *  s3  a hand lifts the phone over the table code and the viewfinder's brackets close on it; the menu sheet
 *      slides up; a fingertip presses the Chow mein row, which lights with its plain price chip; the finger
 *      presses Pay, which turns into the round red paid mark. B's medium sees the one seated guest from behind
 *      her right shoulder: her left hand holds the phone up out of her own shoulder line, and her right arm,
 *      shoulder, upper arm, elbow and forearm drawn as one jointed limb at the same scale, rises from her side
 *      and taps the row. B's Pay detail keeps the same holding hand.
 *  s4  THE TURN. The ticket printer stands idle, its slot blank and its lamp in standby, beside an empty wok
 *      on an unlit burner. The paid mark leaves the phone and travels a line into the printer's slot (B's
 *      camera follows it down from the plan onto the printer seen from above); only at its arrival does the
 *      lamp turn red, inside the same shot. Then the ticket rises out of the slot, top first, until a rail
 *      bearing grips it and the cutter frees it, and it hangs, held, inside the ticket shot. Only after it a
 *      cook pours the noodles in from a bowl as the flame flares, and the cook's hand on the handle shakes the
 *      pan, which is what tosses the noodles.
 *  s5  a ledger card headed with the source's words slides onto the desk; a $9,650 a month tag lands on it;
 *      a rubber stamp presses OWNER COUNT crooked beside it; the receipt clip opens and snaps shut on
 *      nothing.
 *  s6  plain coins and notes leave the paid phone and fall in arcs into the glass tip jar at the kitchen
 *      pass, which fills; a tag reading FOX 26 reports, all to the kitchen, hooks onto its neck.
 *  s7  a federal rule card slides onto the desk and its no tip credit box draws, empty; the cooks line
 *      lights; a writing hand circles the two lines together. The box is never ticked.
 *  s8  the restaurant folder slides in beside the rule card and opens; its one box stays blank and a
 *      question mark draws beside it.
 *  s9  a hand raises the phone toward the table code, pauses short of it and lowers it without scanning; a
 *      quote card from one customer lands beside the lowered phone, whose screen then times out. In B the hand
 *      sets the phone down and stays resting on it through the quote, so it never leaves at a smear.
 *  s10 a large order card lands on the host panel's screen within the shot's first second and a ticket slip
 *      leaves it and drops into the kitchen printer's slot, whose lamp answers red as the ticket for it rises,
 *      is gripped and cut; the camera keeps easing in through the shot. At the pass the tip jar takes a tag
 *      reading owner says, and a second reading no record shown settles beside it. Held.
 *
 * A follows the order at counter and table level. B reads the same events from above (the room's plan, the
 * table top, the desk) and through the front window and the back desk. Colour carries meaning once: the
 * chili red is the paid mark, the printer lamp that answers it, the wok's flare and the owner count stamp.
 * Indoors the region is the place stage's window behind the room; the episode paints no full-frame
 * background. Disclosed illustration: no real restaurant, person, software, brand mark, code, payment
 * screen, money or pay record, and every figure and the tip claim stay attributed on screen.
 */

type V='a'|'b';
export type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const lerpPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);
const DEG=Math.PI/180;
/** A renderer-only ease with zero velocity and acceleration at both ends. */
export const ease5=(q:number)=>{const x=clamp(q);return x*x*x*(10+x*(-15+6*x));};
/** The board's contact curve as a plain ease. */
export const contactQ=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
/** Zero at both ends with zero slope, one at the middle: a lift that returns. */
export const bell=(r:number)=>{const x=clamp(r);return 16*x*x*(1-x)*(1-x);};
/** A struck or released thing swinging about its pin, tau seconds after the impulse. Pure in tau. */
export function damped(tau:number,amp:number,hz:number,k:number){return tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.12);}
const bez=(a:Pt,c:Pt,b:Pt,u:number):Pt=>{const v=clamp(u),p=1-v;return [p*p*a[0]+2*p*v*c[0]+v*v*b[0],p*p*a[1]+2*p*v*c[1]+v*v*b[1]];};

// ---- the performed state ---------------------------------------------------------------------------------
/** A stamp's press within its own event window: it comes down in the first third, presses on the contact
 * curve, holds while the ink takes, lifts and leaves. `lift` 1 is raised; `inked` once it has pressed. */
export function stampState(win:ActionWindow|undefined,t:number){
 if(!win)return {come:0,lift:1,inked:0,away:0};
 const r=(t-win.start)/(win.end-win.start);
 const press=r<.3?0:r<.5?contactQ((r-.3)/.2):r<.62?1:1-ease5((r-.62)/.2);
 return {come:ease5(r/.3),lift:1-press,inked:r>=.5?1:0,away:ease5((r-.74)/.26)};
}
export const COINS=7;
export function orderState(W:Record<string,ActionWindow>,t:number){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const st=(id:string)=>W[id]?.start??0,en=(id:string)=>W[id]?.end??0;
 // s1: the door shuts (contact), the bell and the apron swing from it, the phone rings, the pad stays blank
 const s1={door:1-P('s1-event-1'),bell:damped(t-st('s1-event-1'),9,2.4,1.8)+damped(t-en('s1-event-1'),16,2.6,1.6),
  apron:damped(t+.9,16,.7,.55)+damped(t-en('s1-event-1'),9,.75,.9),walk:clamp(t/1.25),
  ring:P('s1-event-2'),curl:bell(R('s1-event-3')),wait:P('s1-event-3'),minute:300+6*P('s1-event-3')};
 // s2: the empty frame swings and settles, the panel lights and writes its name, the tag hooks on
 const s2={swing:damped(t-st('s2-event-1'),7,.7,1.3),shine:P('s2-event-1'),lit:P('s2-event-2'),name:ease5((R('s2-event-2')-.35)/.6),
  tag:P('s2-event-3'),settle:damped(t-en('s2-event-3'),9,1.1,2.2),carry:Math.sin(Math.PI*P('s2-event-3'))};
 // s3: scan and lock, the menu, the tap on Chow mein, the press on Pay
 const r3=R('s3-event-3'),r4=R('s3-event-4');
 const s3={lift:P('s3-event-1'),lock:smooth((R('s3-event-1')-.78)/.2),menu:P('s3-event-2'),
  tapGo:ease5(r3/.4),tapPress:contactQ((r3-.36)/.14)*(1-ease5((r3-.74)/.2)),tapBack:ease5((r3-.74)/.26),
  lit:smooth((r3-.48)/.12),ripple:r3>.48&&r3<.86?clamp((r3-.48)/.38):0,
  payGo:ease5(r4/.38),payPress:contactQ((r4-.34)/.14)*(1-ease5((r4-.72)/.2)),payBack:ease5((r4-.72)/.28),
  pay:smooth((r4-.48)/.36),payRipple:r4>.48&&r4<.86?clamp((r4-.48)/.38):0};
 // s4: the printer idle beside an empty wok on an unlit burner; the paid mark's journey into the slot; only
 // on its arrival the lamp, then the ticket (printed, risen, gripped and cut, then held); only after the
 // ticket a cook pours the noodles in from a bowl as the flame flares, and the cook's hand on the handle
 // shakes the pan, which is what tosses the noodles.
 const w2=W['s4-event-2'],w3=W['s4-event-3'],w4=W['s4-event-4'];
 const arrive=w2?w2.start+.97*(w2.end-w2.start):Infinity;
 const pStart=w3?Math.max(w3.start,arrive):Infinity,d3=w3?w3.end-pStart:1;
 const pEnd=pStart+.56*d3,cutEnd=pStart+.72*d3;
 const print=t>pStart?smooth((t-pStart)/(pEnd-pStart)):0;
 const cut=t>pEnd?smooth((t-pEnd)/(cutEnd-pEnd)):0;
 const r44=R('s4-event-4'),e4end=w4?w4.end:Infinity,tau=t-e4end-.08;
 const shake=tau>0?Math.sin(2*Math.PI*2.4*tau)*smooth(tau/.15):0;
 const food=smooth((r44-.25)/.5);
 const s4={standby:.5+.5*Math.sin(2*Math.PI*t/1.3),r2:R('s4-event-2'),token:P('s4-event-2'),tokenR:1-smooth((R('s4-event-2')-.84)/.13),line:smooth(R('s4-event-2')/.2),
  led:w2?smooth((t-arrive)/.12):0,print,cut,hang:w3?damped(t-cutEnd,2.6,1.5,2.4):0,
  flame:P('s4-event-4'),food,pour:clamp((r44-.15)/.6),bowlTilt:72*ease5(r44/.4)*(1-ease5((t-e4end)/.3)),bowlLeft:1-smooth((r44-.15)/.55),
  bowlAway:w4?ease5((t-e4end)/.4):0,panTilt:7*shake,toss:food*Math.max(0,Math.sin(2*Math.PI*2.4*tau-1.1))*(tau>0?smooth(tau/.15):0),
  arrive,pStart,pEnd,cutEnd};
 // s5: the card slides on, the tag lands, the stamp presses, the clip opens and shuts on nothing
 const w54=W['s5-event-4'],d54=w54?w54.end-w54.start:1;
 const s5={slide:P('s5-event-1'),tag:P('s5-event-2'),stamp:stampState(W['s5-event-3'],t),
  clip:bell(R('s5-event-4')),wob:w54?damped(t-(w54.start+.5*d54),3,1.8,3):0};
 // s6: the coins fly (see coinFlight), the jar fills, the tag hooks on
 const s6={fill:.1+.62*P('s6-event-2'),tag:P('s6-event-3'),settle:damped(t-en('s6-event-3'),9,1.1,2.2),carry:Math.sin(Math.PI*P('s6-event-3'))};
 // s7: the card slides on and its box draws; the cooks line lights; the pen circles both
 const r73=R('s7-event-3');
 const s7={slide:P('s7-event-1'),box:smooth((R('s7-event-1')-.55)/.4),lit:P('s7-event-2'),
  penGo:ease5(r73/.2),circle:smooth((r73-.2)/.68),penLift:ease5((r73-.9)/.1)};
 // s8: the folder slides on, opens, and its one box stays blank under a question mark
 const r82=R('s8-event-2');
 // When the board splits the question mark into its own event (s8-event-3) the mark follows that window;
 // until then it draws in the second half of s8-event-2.
 const s8={slide:P('s8-event-1'),open:W['s8-event-3']?P('s8-event-2'):smooth(r82/.6),q:W['s8-event-3']?P('s8-event-3'):smooth((r82-.55)/.35)};
 // s9: the phone aims; its brackets hunt and never close; the quote card lands
 // s9: a hand raises the phone toward the code, pauses short of it, and lowers it without scanning; the
 // quote card lands; the lowered phone's screen times out while the code stays unscanned.
 const r91=R('s9-event-1'),raise=ease5(r91/.32),lower=ease5((r91-.56)/.3),pause=r91>.32&&r91<.56?Math.sin(Math.PI*(r91-.32)/.24):0;
 // B's hand never lets go: it lowers the phone onto the table and rests on it (see viewfinder-hunt, quote-side).
 const s9={raise,lower,up:raise*(1-lower),release:ease5((r91-.8)/.2),waver:2.5*pause*Math.sin(2*Math.PI*1.6*t),quote:P('s9-event-2'),dim:.85*P('s9-event-3')};
 // s10: the panel takes the order and a slip leaves for the kitchen; the two tags settle on the jar
 // The card lands on the panel in the window's first 40 percent; the slip leaves at 38 percent and drops into the
 // printer's slot at 90 percent, and only then the lamp answers and the order's ticket rises, is gripped and cut.
 const r101=R('s10-event-1'),w101=W['s10-event-1'];
 const arrive10=w101?w101.start+.9*(w101.end-w101.start):Infinity,print10=t>arrive10?smooth((t-arrive10)/.6):0;
 const s10={order:smooth(r101/.4),ping:bell(clamp((r101-.3)/.4)),slip:ease5((r101-.38)/.52),
  led:w101?smooth((t-arrive10)/.12):0,print:print10,cut:t>arrive10+.6?smooth((t-arrive10-.6)/.18):0,hang:w101?damped(t-(arrive10+.78),2.6,1.5,2.4):0,
  tag1:P('s10-event-2'),settle1:damped(t-en('s10-event-2'),9,1.1,2.2),carry1:Math.sin(Math.PI*P('s10-event-2')),
  tag2:P('s10-event-3'),settle2:damped(t-en('s10-event-3'),6,1,2.4),carry2:Math.sin(Math.PI*P('s10-event-3'))};
 return {s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,P,R};
}
export type OrderState=ReturnType<typeof orderState>;
/** One coin or note's journey: launched from the paid screen across s6-event-1, arriving at the jar's mouth
 * across s6-event-2, then dropping onto the pile as it stood at that moment. Pure in t. */
export function coinFlight(W:Record<string,ActionWindow>,t:number,i:number){
 const a=W['s6-event-1'],b=W['s6-event-2'];
 if(!a||!b)return {u:0,drop:0,restFill:0,launched:false};
 const k=i/(COINS-1),launch=a.start+.7*k*(a.end-a.start),land=b.start+.75*k*(b.end-b.start);
 const u=clamp((t-launch)/(land-launch)),drop=clamp((t-land)/.22);
 const restFill=.1+.62*actionProgress(b,land+.22);
 return {u,drop,restFill,launched:t>=launch};
}

// ---- B's over-the-shoulder tap: one jointed arm ---------------------------------------------------------------
/** s3 menu-tap B sees the one seated guest from behind her right shoulder: where the base of her neck stands, the
 * tapping hand's scale and, in degrees, how far its ready pose sits from the hover pose (shoulder, elbow). */
export const OTS={guest:[270,1060] as Pt,finger:.75,ready:[20,10] as Pt};
const rotPt=(p:Pt,th:number):Pt=>[p[0]*Math.cos(th)-p[1]*Math.sin(th),p[0]*Math.sin(th)+p[1]*Math.cos(th)];
const wrapAngle=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
const ARM_AXIS=Math.atan2(FINGER_ARM.dir[1],FINGER_ARM.dir[0]);
export type ArmPose={u:number;f:number};
/** The arm from its shoulder S: upper arm at angle u (length a) to the elbow, forearm at angle f (length b) to
 * the wrist, and the hand rigid on the forearm, its sleeve axis aimed back at the elbow. Pure. */
export function armFK(S:Pt,a:number,b:number,fs:number,P:ArmPose){
 const E:Pt=[S[0]+a*Math.cos(P.u),S[1]+a*Math.sin(P.u)],Wr:Pt=[E[0]+b*Math.cos(P.f),E[1]+b*Math.sin(P.f)];
 const th=P.f+Math.PI-ARM_AXIS,w=rotPt(FINGER_ARM.wrist,th);
 return {E,W:Wr,th,tip:[Wr[0]-w[0]*fs,Wr[1]-w[1]*fs] as Pt};
}
/** The arm pose whose fingertip lands exactly on `tip`, elbow bent outward: the hand angle is found by a fixed
 * scan and bisection, so the same tip gives the same pose on every frame. */
export function armIK(S:Pt,a:number,b:number,fs:number,tip:Pt):ArmPose{
 const g=(th:number)=>{const w=rotPt(FINGER_ARM.wrist,th),Wr:Pt=[tip[0]+w[0]*fs,tip[1]+w[1]*fs];
  const dx=Wr[0]-S[0],dy=Wr[1]-S[1],d=Math.min(a+b-1e-3,Math.max(Math.abs(a-b)+1e-3,Math.hypot(dx,dy)));
  const u=Math.atan2(dy,dx)+Math.acos((a*a+d*d-b*b)/(2*a*d)),E:Pt=[S[0]+a*Math.cos(u),S[1]+a*Math.sin(u)];
  return {v:wrapAngle(Math.atan2(E[1]-Wr[1],E[0]-Wr[0])-ARM_AXIS-th),u,f:Math.atan2(Wr[1]-E[1],Wr[0]-E[0])};};
 let lo=-Math.PI,vlo=g(lo).v;
 for(let k=1;k<=180;k++){
  const hi=-Math.PI+k*Math.PI/90,vhi=g(hi).v;
  if(vlo*vhi<0&&Math.abs(vlo-vhi)<1){let x0=lo,x1=hi;for(let i=0;i<48;i++){const m=(x0+x1)/2;if(g(x0).v*g(m).v<=0)x1=m;else x0=m;}const r=g((x0+x1)/2);return {u:r.u,f:r.f};}
  lo=hi;vlo=vhi;
 }
 throw new Error('The tapping arm cannot reach its contact');
}
const lerpPose=(A:ArmPose,B:ArmPose,p:number):ArmPose=>({u:lerp(A.u,B.u,p),f:lerp(A.f,B.f,p)});
/** The guest's tapping arm in B's menu-tap at the board's state: the jointed pose, its elbow, wrist and tip. */
export function otsArm(S3:OrderState['s3']){
 const L=PHONE_AT['menu-tap:b'],contact=toScreen(L,screenPt(PHONE_UI.chow)),hover:Pt=[contact[0]+60,contact[1]-50];
 const G=OTS.guest,Sh:Pt=[G[0]+GUEST_BACK.shoulder[0],G[1]+GUEST_BACK.shoulder[1]],a=GUEST_BACK.upper,b=GUEST_BACK.fore,fs=OTS.finger;
 const Pc=armIK(Sh,a,b,fs,contact),Ph=armIK(Sh,a,b,fs,hover),Pr={u:Ph.u+OTS.ready[0]*DEG,f:Ph.f+OTS.ready[1]*DEG};
 let P=lerpPose(lerpPose(Pr,Ph,S3.tapGo),Pc,S3.tapPress);
 if(S3.tapBack>0)P=lerpPose(P,Pr,S3.tapBack);
 return {...armFK(Sh,a,b,fs,P),S:Sh,contact,b,fs};
}

// ---- small drawing helpers ----------------------------------------------------------------------------------

const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;sx?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,sx=1,children})=>
 <g transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${r.toFixed(3)}) scale(${(s*sx).toFixed(4)} ${s.toFixed(4)})`} opacity={o}>{children}</g>;
/** A placement: position, scale, rotation (deg), and a horizontal flip. Shared by drawing and bound checks. */
export type Place={x:number;y:number;s:number;r?:number;flip?:boolean};
export const toScreen=(L:Place,p:Pt):Pt=>{const a=(L.r??0)*DEG,x=L.s*(L.flip?-p[0]:p[0]),y=L.s*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
/** Paper lying on a surface: card units to screen, foreshortened by fy, rotated after. */
export type PaperAt={x:number;y:number;s:number;fy:number;r?:number};
export const paperTransform=(L:PaperAt)=>`translate(${f2(L.x)} ${f2(L.y)}) rotate(${f2(L.r??0)}) scale(${L.s} ${f2(L.s*L.fy)})`;
export const paperPt=(L:PaperAt,p:Pt):Pt=>{const a=(L.r??0)*DEG,x=L.s*p[0],y=L.s*L.fy*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};

// ---- layouts (screen pixels). Every number a bound depends on is exported here. ---------------------------
export const FLOOR_Y={wide:1080,medium:1160};
/** B's paid-line push-in: the zoom the camera reaches on the printer from above, and where the slot then sits. */
export const PAID_ZOOM=4.4,PAID_ANCHOR:Pt=[540,700];
/** One guest's skin for every guest hand in s3 and s9, in every framing (hand, finger and face alike). */
export const SKIN={a3:HP.skin[4],a9:HP.skin[4],writer:HP.skin[1]};
/** The holding hand's sleeve colour (OrderRigHero's hand and finger), which the seated guest's shirt matches. */
export const GUEST_SLEEVE='#3D5566';
/** Phone placements per view: centre, scale, rotation, and whether a hand holds it. */
export const PHONE_AT:Record<string,Place&{hand:boolean;from?:Pt}>={
 'code-scan:a':{x:690,y:830,s:.72,r:-3,hand:true,from:[620,1720]},'menu-tap:a':{x:520,y:760,s:1.5,r:0,hand:true},'pay-mark:a':{x:500,y:720,s:1.05,r:0,hand:true},
 'code-scan:b':{x:600,y:720,s:.78,r:-8,hand:true,from:[300,1560]},'menu-tap:b':{x:650,y:800,s:.72,r:12,hand:true},'paid-close:b':{x:540,y:260,s:2.4,r:0,hand:true},
 'paid-line:a':{x:250,y:760,s:.62,r:8,hand:true},'coins-drop:a':{x:250,y:620,s:.62,r:12,hand:true},
 'viewfinder-hunt:a':{x:470,y:780,s:.82,r:-8,hand:true,from:[600,1330]},'quote-card:a':{x:150,y:1020,s:.55,r:-4,hand:false},
 'viewfinder-hunt:b':{x:560,y:1000,s:.78,r:10,hand:true,from:[700,1520]},'quote-side:b':{x:650,y:1030,s:.6,r:14,hand:false}};
/** s9 from above: the one place the code stand stands in both B shots. */
export const CODE9_TOP:Pt=[700,700];
/** Printer placements (base centre): the rail, the ticket and the lamp ride the same transform. */
export const PRINTER_AT:Record<string,Place>={
 'printer-idle':{x:330,y:1000,s:1.1},'paid-line:a':{x:760,y:1150,s:1.3},'ticket-print:a':{x:520,y:1440,s:2.2},'wok-flare':{x:250,y:900,s:.78},
 'pass-wide':{x:230,y:940,s:.72},'ticket-print:b':{x:470,y:1290,s:1.6},'flame-close':{x:240,y:837,s:1.4},
 'jar-fills:b':{x:230,y:1040,s:.8},'panel-order':{x:840,y:1060,s:.75},'stand-wide':{x:755,y:960,s:.62},'jar-no-record':{x:1050,y:960,s:.6},
 'jar-owner-tag:b':{x:220,y:1040,s:.8},'tags-close':{x:191,y:800,s:1.3}};
export const SHELF:Record<string,{x:number;y:number;w:number}>={
 'printer-idle':{x:60,y:1000,w:600},'paid-line:a':{x:380,y:1150,w:760},'wok-flare':{x:50,y:900,w:480},'pass-wide':{x:40,y:940,w:440},
 'flame-close':{x:-20,y:837,w:720},'coins-drop':{x:300,y:1060,w:700},'jar-fills:a':{x:-20,y:1205,w:1120},'jar-fills:b':{x:40,y:1040,w:1000},
 'panel-order':{x:470,y:1060,w:620},'stand-wide':{x:600,y:960,w:480},'jar-no-record':{x:440,y:960,w:640},'jar-owner-tag:b':{x:0,y:1040,w:1080},
 'jar-owner-tag:a':{x:-20,y:1235,w:1120},'tags-close':{x:-20,y:800,w:560},'ticket-print:b':{x:120,y:1290,w:980}};
export const WOK_AT:Record<string,Place>={'printer-idle':{x:820,y:1110,s:.85,flip:true},'wok-flare':{x:740,y:1090,s:1,flip:true},'pass-wide':{x:780,y:1100,s:.85,flip:true},
 'ticket-print:b':{x:1100,y:1250,s:1,flip:true},'flame-close':{x:600,y:1180,s:1.7,flip:true},'coins-drop':{x:990,y:1150,s:.7,flip:true},'jar-fills:b':{x:960,y:1180,s:.7,flip:true}};
export const JAR_AT:Record<string,Place>={'coins-drop':{x:720,y:1060,s:1},'jar-fills:a':{x:560,y:1200,s:1.8},'jar-tag':{x:500,y:1520,s:2.5},
 'jar-fills:b':{x:620,y:1040,s:1.25},'tag-close':{x:600,y:1500,s:2.4},'panel-order':{x:590,y:1060,s:.75},'jar-owner-tag:a':{x:520,y:1230,s:1.75},
 'jar-no-record':{x:700,y:960,s:1},'stand-wide':{x:990,y:960,s:.62},'jar-owner-tag:b':{x:640,y:1040,s:1.25},'tags-close':{x:560,y:1380,s:2.3}};
/** Where each view's coins come from and the arc they take to the mouth (screen pixels). */
export const COIN_PATH:Record<string,{src?:Pt;ctrl:Pt}>={'coins-drop':{ctrl:[540,500]},'jar-fills:a':{src:[-90,250],ctrl:[300,240]},'jar-fills:b':{src:[90,360],ctrl:[420,360]}};
/** Hanging tags: anchor jar neck index or the panel eyelet, string length, where the carry starts, text size. */
export type TagRig={lines:string[];size:number;len:number;from:Pt;tone:'kraft'|'cream'|'slate'};
export const TAGS={ai:['AI host'],fox:['FOX 26 reports','all to the kitchen'],owner:['owner says'],none:['no record shown'],money:['$9,650','a month']};
/** Paper placements (card units to screen) per view. */
export const LEDGER_AT:Record<string,PaperAt>={'ledger-slide':{x:250,y:940,s:1.25,fy:.55,r:-3},'ledger-tag':{x:90,y:760,s:1.9,fy:.6,r:-2},
 'owner-stamp:a':{x:150,y:510.8,s:2.2,fy:.62},'empty-clip':{x:120,y:1090,s:.95,fy:.5,r:-4},
 'desk-ledger':{x:210,y:560,s:1.5,fy:1,r:-2},'ledger-corner':{x:-20,y:398,s:2.2,fy:1},'owner-stamp:b':{x:170,y:316.8,s:2.2,fy:1},'clip-bench':{x:560,y:1100,s:.9,fy:.5,r:3}};
export const RULE_AT:Record<string,PaperAt>={'rule-card:a':{x:150,y:520,s:1.5,fy:.88,r:-1.5},'cooks-line':{x:20,y:375,s:2,fy:.9},'circle-detail':{x:-19,y:327,s:2.15,fy:.92},
 'rule-card:b':{x:165,y:520,s:1.45,fy:1},'box-close':{x:-30,y:332,s:1.9,fy:1},'pen-circle':{x:-19,y:320,s:2.15,fy:1},
 'blank-folder':{x:-260,y:560,s:1,fy:.88},'folder-wide':{x:80,y:420,s:.95,fy:1}};
export const FOLDER_AT:Record<string,PaperAt>={'blank-folder':{x:330,y:600,s:1.15,fy:.88},'blank-box':{x:180,y:484,s:2,fy:.92},
 'folder-wide':{x:520,y:640,s:.95,fy:1},'folder-close':{x:150,y:470,s:1.8,fy:1}};
export const QUOTE_AT:Record<string,PaperAt>={'quote-card':{x:430,y:880,s:1,fy:.78,r:-2},'quote-side':{x:40,y:560,s:.9,fy:1,r:-3}};
export const PANEL_AT:Record<string,Place>={'window-frame':{x:650,y:1290,s:.82},'host-panel:a':{x:520,y:1913.5,s:1.55},'ai-tag':{x:378.4,y:2828.8,s:2.4},
 'sign-window':{x:790,y:1200,s:.62},'host-panel:b':{x:430,y:1330,s:.98},'tag-detail':{x:592,y:2544,s:2},
 'panel-order':{x:290,y:1640,s:1.22},'jar-no-record':{x:230,y:1230,s:.7},'stand-wide':{x:250,y:1720,s:1.42}};
export const STAND_AT:Record<string,Place>={'door-apron':{x:800,y:1330,s:1},'host-phone:a':{x:560,y:1900,s:2},'blank-pad-tables':{x:960,y:1500,s:1.15},
 'host-phone:b':{x:560,y:1340,s:1.05},'table-wait':{x:300,y:1880,s:1.9},'window-frame':{x:900,y:1330,s:1},'sign-window':{x:930,y:1240,s:.72},'host-panel:b':{x:790,y:1340,s:1}};

// ---- the frame-edge check's inputs ----------------------------------------------------------------------------
/** Every contact point a viewer must read, per view, at the state given. A pure function of the same
 * layouts the drawing uses: the scratch bound check holds each above the caption band and inside the frame. */
export function contactPoints(view:string,v:V,S:OrderState):Record<string,Pt>{
 const k=view+':'+v,out:Record<string,Pt>={};
 const ph=PHONE_AT[k];
 if(ph){out.phoneTop=toScreen(ph,[0,-PHONE.h/2]);out.chow=toScreen(ph,screenPt(PHONE_UI.chow));out.pay=toScreen(ph,screenPt(PHONE_UI.pay));}
 const pr=PRINTER_AT[k]??PRINTER_AT[view];
 if(pr){out.slot=toScreen(pr,[PRINTER.slot.x,PRINTER.slot.y]);out.grip=toScreen(pr,railGrip());out.led=toScreen(pr,PRINTER.led);}
 const j=JAR_AT[k]??JAR_AT[view];
 if(j){out.mouth=toScreen(j,[0,JAR.mouth.y]);out.neckR=toScreen(j,JAR.tagAt[0]);out.neckL=toScreen(j,JAR.tagAt[1]);}
 const pa=PANEL_AT[k]??PANEL_AT[view];
 if(pa)out.eyelet=toScreen(pa,PANEL.eyelet);
 const L=LEDGER_AT[k]??LEDGER_AT[view];
 if(L){out.tag=paperPt(L,LEDGER.tag);out.mark=paperPt(L,[LEDGER.mark.x,LEDGER.mark.y]);}
 const Rc=RULE_AT[k]??RULE_AT[view];
 if(Rc){out.box=paperPt(Rc,[RULE.box.x,RULE.box.y]);for(const u of [0,.25,.5,.75,1])out['lasso'+u]=paperPt(Rc,rulePenPoint(u));}
 const F=FOLDER_AT[view];
 if(F){out.folderBox=paperPt(F,[FOLDER.box.x+FOLDER.box.s,FOLDER.box.y+FOLDER.box.s]);out.q=paperPt(F,FOLDER.q);}
 void S;
 return out;
}

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}
export function disclosureBox(text:string):[number,number,number,number]{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}

export const OrderPassFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Order pass film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Order pass film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const S=orderState(W,t);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing,key=view+':'+v;
 const flat=ad.flat_shots?.[sid];
 const need=(s:string)=>{if(sid!==s)throw new Error(view+' draws '+s+' only');};
 const pick=<T,>(tab:Record<string,T>,name=view):T=>{const r=tab[name+':'+v]??tab[name];if(r===undefined)throw new Error('No '+view+' layout for '+name);return r;};

 // ---- shared rigs ----
 /** The phone at its placement, held by a hand, with the finger that touches it. */
 const phoneRig=(L:Place&{hand:boolean},st:PhoneState,o:{skin?:string;finger?:{tip:Pt;press:number;s:number}|null;handOff?:Pt}={})=>{
  const skin=o.skin??SKIN.a3,ho=o.handOff??[0,0],H={...L,x:L.x+ho[0],y:L.y+ho[1]};
  return <g data-part="phone-rig">
   <At p={[L.x+14*L.s,L.y+20*L.s]} s={L.s} r={L.r??0} o={.22}><rect x={-150} y={-300} width={300} height={600} rx={46} fill="#1A1410"/></At>
   {L.hand&&<At p={[H.x,H.y]} s={L.s} r={L.r??0}><OrderRigHero part="handBack" skin={skin}/></At>}
   <At p={[L.x,L.y]} s={L.s} r={L.r??0}><OrderRigHero part="phone" {...st}/></At>
   {L.hand&&<At p={[H.x,H.y]} s={L.s} r={L.r??0}><OrderRigHero part="handFront" skin={skin}/></At>}
   {o.finger&&<At p={o.finger.tip} s={o.finger.s}><OrderRigHero part="finger" skin={skin} press={o.finger.press}/></At>}
  </g>;
 };
 /** The phone's screen state for scenes after the order: menu open, Chow mein lit, paid. */
 const paidPhone:PhoneState={scan:0,lock:1,menu:1,lit:1,pay:1};
 /** The finger's tip for a tap: from rest to a hover point, pressed onto the contact, then away. */
 const fingerTip=(contact:Pt,go:number,press:number,back:number,rest:Pt,away:Pt):Pt=>{
  const hover:Pt=[contact[0]+60,contact[1]-50];
  let p=lerpPt(lerpPt(rest,hover,go),contact,press);
  if(back>0)p=lerpPt(p,away,back);
  return p;
 };
 /** The printer with its rail, its ticket (in the state the board gives) and its lamp. */
 const printerRig=(L:Place,o:{len:number;cut:number;hang:number;led:number;standby:number;roll:number})=>{
  const T=TICKET,g=railGrip(),slot=PRINTER.slot,gripped=o.len>=T.len-.01;
  const top=gripped?g[1]:slot.y-o.len;
  const lift=gripped?-4*o.cut:0;
  return <At p={[L.x,L.y]} s={L.s} sx={L.flip?-1:1}>
   <Item id={sid+'-printer'}>
    <ellipse cx={12} cy={4} rx={150} ry={12} fill="#1A1410" opacity={.3}/>
    <OrderRigHero part="rail" roll={o.roll}/>
    <OrderRigHero part="printer" led={o.led} standby={o.standby}/>
   </Item>
   {o.len>0&&<Item id={sid+'-ticket'}><g transform={`translate(${slot.x} ${f2(top)}) rotate(${f2(gripped?o.hang:0)} 0 0) translate(${-T.w/2} ${f2(lift)})`}>
    <OrderRigHero part="ticket" len={gripped?T.len:o.len} cut={o.cut}/></g>
    {!gripped&&<path d={`M${slot.x-T.w/2-6} ${slot.y+1}H${slot.x+T.w/2+6}`} stroke="#0D0F11" strokeWidth={5}/>}</Item>}
  </At>;
 };
 const ticketDone={len:TICKET.len,cut:1,hang:0,led:1,standby:.5,roll:1};
 const ticketNow=()=>({len:TICKET.len*S.s4.print,cut:S.s4.cut,hang:S.s4.hang,led:S.s4.led,standby:S.s4.standby,roll:S.s4.print});
 type WokState={flame:number;food:number;toss:number;tilt:number;hand:number;bowl?:{tilt:number;left:number;away:number;pour:number}};
 /** The bowl's pouring lip and where the noodles land, in wok units (the cook stands on the handle side). */
 const BOWL_LIP:Pt=[-40,-262],POUR_TO:Pt=[6,-124];
 const wokRig=(L:Place,w:WokState)=>{
  const b=w.bowl,head=b?clamp(b.pour*2.4):0,tail=b?clamp((b.pour-.62)/.38):0;
  const stream=b&&b.pour>0&&tail<1?[0,1,2,3].map(k=>{const p0=lerpPt(BOWL_LIP,POUR_TO,tail),p1=lerpPt(BOWL_LIP,POUR_TO,head),dx=(k-1.5)*12;
   return <path key={k} d={`M${f2(p0[0]+dx)} ${f2(p0[1])}Q${f2((p0[0]+p1[0])/2+dx+10*Math.sin(t*20+k))} ${f2((p0[1]+p1[1])/2)} ${f2(p1[0]+dx*.6)} ${f2(p1[1])}`}
    stroke={k%2?HP.noodle:'#E3CF9A'} strokeWidth={6} fill="none" strokeLinecap="round"/>;}):null;
  return <Item id={sid==='s4'?'s4-pan':sid+'-pass'}><At p={[L.x,L.y]} s={L.s} sx={L.flip?-1:1}>
   <OrderRigHero part="wok" flame={w.flame} food={w.food} toss={w.toss} tilt={w.tilt} hand={w.hand} t={t} skin={HP.skin[3]}/>
   {stream}
   {b&&b.away<1&&<g transform={`translate(${f2(BOWL_LIP[0]-520*b.away)} ${f2(BOWL_LIP[1]-420*b.away)})`}><OrderRigHero part="cookBowl" tilt={b.tilt} left={b.left} skin={HP.skin[3]}/></g>}
  </At></Item>;
 };
 const wokCold:WokState={flame:0,food:0,toss:0,tilt:0,hand:0};
 const wokOn:WokState={flame:.55,food:1,toss:0,tilt:0,hand:0};
 const wokNow=():WokState=>({flame:S.s4.flame,food:S.s4.food,toss:S.s4.toss,tilt:S.s4.panTilt,hand:1,
  bowl:{tilt:-S.s4.bowlTilt,left:S.s4.bowlLeft,away:S.s4.bowlAway,pour:S.s4.pour}});
 const shelf=(name:string)=>{const Sh=pick(SHELF,name);return <At p={[Sh.x,Sh.y]}><RestaurantSupport part="passShelf" w={Sh.w}/></At>;};
 /** A cabinet front under a pass shelf, down to the floor. */
 const cabinet=(x:number,y:number,w:number)=><g data-part="cabinet">
  <rect x={x} y={y+22} width={w} height={1300-y} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
  {Array.from({length:Math.max(1,Math.floor(w/160))},(_,k)=><g key={k}><rect x={x+14+k*160} y={y+46} width={140} height={240} rx={6} fill={RS.steel} stroke={RS.ink} strokeWidth={2}/>
   <rect x={x+120+k*160} y={y+140} width={10} height={40} rx={4} fill={RS.steelDark}/></g>)}
 </g>;
 /** A tag hanging from an anchor, carried in from `from` on its string until it hooks on (q 1). */
 const hangTag=(id:string,anchor:Pt,rig:TagRig,q:number,swing:number,carry:number)=>{
  if(q<=0)return null;
  const a=lerpPt(rig.from,anchor,q),lift=-70*carry;
  return <Item id={id}><g data-part="hanging-tag" transform={`translate(${f2(a[0])} ${f2(a[1]+lift*(1-q))})`}>
   <g transform={`rotate(${f2(swing)})`}>
    <path d={`M0 0V${rig.len}`} stroke={RS.ink} strokeWidth={3}/>
    <g transform={`translate(0 ${rig.len})`}><RestaurantSupport part="tag" lines={rig.lines} size={rig.size} tone={rig.tone}/></g>
   </g>
   {q>=.999&&<circle r={7} fill="none" stroke={RS.ink} strokeWidth={3}/>}
  </g></Item>;
 };
 /** The tip jar with its pile, the coins in flight inside its mouth, and the coins still outside it. */
 const jarRig=(name:string,fill:number,coins:boolean,src?:Pt)=>{
  const L=pick(JAR_AT,name),mouth=toScreen(L,[0,JAR.mouth.y]);
  const inside:React.ReactNode[]=[],outside:React.ReactNode[]=[];
  if(coins){
   const path=COIN_PATH[name+':'+v]??COIN_PATH[name];
   const from=src??path?.src??[0,0];
   for(let i=0;i<COINS;i++){
    const c=coinFlight(W,t,i);if(!c.launched)continue;
    const spread=(i%3-1)*28,ink=i%4===3;
    const node=(p:Pt,s:number,r:number)=>ink?<At key={i} p={p} s={s} r={r}><OrderRigHero part="bill" w={64}/></At>:<At key={i} p={p} s={s}><OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={.5+.5*Math.sin(t*9+i)}/></At>;
    const spin=i*40+200*Math.min(1,c.u);
    if(c.u<1){
     const ctrl:Pt=path?.ctrl??[(from[0]+mouth[0])/2,Math.min(from[1],mouth[1])-200];
     const p=bez(from,ctrl,[mouth[0]+spread*L.s,mouth[1]],smooth(c.u));
     outside.push(node(p,lerp(.8,1,c.u)*L.s,spin));
    }else{
     const y=lerp(JAR.mouth.y,pileTop(c.restFill)-4,c.drop*c.drop);
     inside.push(node([spread,y],1,spin+120*c.drop));
    }
   }
  }
  return {back:<At p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="back">{inside}</OrderRigHero></At>,
   front:<At p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="front"/></At>,outside,
   shadow:<ellipse cx={L.x+10*L.s} cy={L.y+4*L.s} rx={96*L.s} ry={12*L.s} fill="#1A1410" opacity={.28}/>};
 };
 const jarDraw=(name:string,fill:number,coins:boolean,id:string,src?:Pt)=>{const J=jarRig(name,fill,coins,src);
  return <g><Item id={id}>{J.shadow}{J.back}</Item>{coins&&<Item id={sid+'-coins'}>{J.outside}</Item>}<Item id={id}>{J.front}</Item></g>;};
 const jarAnchor=(name:string,i:0|1):Pt=>toScreen(pick(JAR_AT,name),JAR.tagAt[i]);
 /** The panel at its placement: its name, light and order state for the scene. */
 const panel=(name:string,lit:number,nm:number,order:number,id:string,ping=0)=>{const L=pick(PANEL_AT,name);
  return <Item id={id}><At p={[L.x,L.y]} s={L.s} r={L.r??0}><RestaurantSupport part="hostPanel" lit={lit} name={nm} order={order} ping={ping} t={t}/></At></Item>;};
 const stand=(name:string,top:React.ReactNode,o:{apron?:boolean;id?:string}={})=>{const L=pick(STAND_AT,name);
  return <Item id={o.id??sid+'-setting'}><At p={[L.x,L.y]} s={L.s}><RestaurantSupport part="hostStand">
   {top}
   {o.apron&&<Item id={sid==='s1'?'s1-apron':sid+'-setting'}><g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]}) rotate(${f2(S.s1.apron)}) scale(.72)`}><RestaurantSupport part="apron"/></g>
    <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><RestaurantSupport part="apronHook"/></g></Item>}
  </RestaurantSupport></At></Item>;};
 const deskPhoneOn=(x:number,s:number,ring:number)=><Item id={sid==='s1'?'s1-phone':sid+'-setting'}><g transform={`translate(${x} ${STAND.top}) scale(${s})`}><RestaurantSupport part="deskPhone" ring={ring} t={t}/></g></Item>;
 const padOn=(x:number,s:number,curl:number)=><Item id={sid==='s1'?'s1-pad':sid+'-setting'}><g transform={`translate(${x} ${STAND.top+6}) scale(${s})`}><RestaurantSupport part="orderPad" curl={curl}/></g></Item>;
 /** A dining table with its guest behind it, the guest's forearms on its top, plates and glasses. */
 const tableGroup=(p:Pt,s:number,g:number,o:{raise?:number;look?:number;foods?:Food[];flipChair?:boolean;menu?:boolean}={})=>{
  const G=GUESTS[g%GUESTS.length],seat:Pt=[0,TABLE.top+130];
  return <At p={p} s={s}>
   <g transform={`translate(-30 ${-10})`}><RestaurantSupport part="chair" flip={o.flipChair}/></g>
   <g transform={`translate(${seat[0]} ${seat[1]})`}><RestaurantSupport part="guest" layer="body" {...G} look={o.look??0}/></g>
   <RestaurantSupport part="table">
    {(o.foods??['none','none']).map((f,i)=><g key={i} transform={`translate(${-90+i*150} ${TABLE.top})`}><RestaurantSupport part="plate" food={f}/></g>)}
    <g transform={`translate(110 ${TABLE.top-2})`}><RestaurantSupport part="waterGlass"/></g>
    <g transform={`translate(-150 ${TABLE.top})`}><RestaurantSupport part="menuTent"/></g>
   </RestaurantSupport>
   <g transform={`translate(${seat[0]} ${seat[1]})`}><RestaurantSupport part="guest" layer="arms" {...G} raise={o.raise??0} menu={o.menu}/></g>
  </At>;
 };
 const pendant=(x:number,len:number)=><At p={[x,0]}><RestaurantSupport part="pendant" len={len}/></At>;
 const floor=(y:number,vp=540)=><Item id={sid+'-setting'}><RestaurantSupport part="floor" y={y} vp={vp}/></Item>;
 /** A laminate table top seen from the front and a little above, from row y down past the frame. */
 const tableBand=(y:number)=><g data-part="table-band">
  <rect x={-40} y={y} width={1160} height={1960-y} fill={RS.laminate}/>
  <path d={`M-40 ${y}H1120`} stroke={RS.laminateEdge} strokeWidth={6}/>
  {Array.from({length:5},(_,k)=><path key={k} d={`M-40 ${y+60+k*90}H1120`} stroke="#FFFFFF" strokeWidth={2} opacity={.25}/>)}
  <path d={`M60 ${y+40}q300 20 700 0`} stroke="#FFFFFF" strokeWidth={8} opacity={.25} fill="none"/>
 </g>;
 /** The table from straight above, filling the frame's working area. */
 const tableTopBig=()=><g data-part="table-overhead">
  <rect x={50} y={290} width={980} height={980} rx={40} fill={RS.laminate} stroke={RS.ink} strokeWidth={5}/>
  <rect x={64} y={304} width={952} height={952} rx={32} fill="none" stroke={RS.laminateEdge} strokeWidth={4}/>
  <g transform="translate(250 420)"><circle r={86} fill="#F8F4EA" stroke={RS.ink} strokeWidth={3}/><circle r={56} fill="none" stroke="#E2D9C6" strokeWidth={4}/>
   <path d="M-30 -20L14 -34L40 -12L-6 2Z" fill="#FFFFFF" stroke={RS.ink} strokeWidth={2}/></g>
  <g transform="translate(880 1080)"><circle r={36} fill={RS.glassTint} opacity={.6} stroke={RS.ink} strokeWidth={3}/><circle r={26} fill="none" stroke="#9CC4CF" strokeWidth={2}/></g>
  <path d="M170 1120L420 1000M180 1140L430 1020" stroke={RS.woodDeep} strokeWidth={8} strokeLinecap="round"/>
  <g transform="translate(860 420) rotate(12)"><rect x={-70} y={-100} width={140} height={200} rx={8} fill={RS.tile} stroke={RS.ink} strokeWidth={3}/><rect x={-50} y={-70} width={100} height={12} rx={6} fill={RS.paper} opacity={.8}/></g>
 </g>;
 const deskTopFull=()=><Item id={sid+'-setting'}><RestaurantSupport part="deskTop" x={30} y={290} w={1020} h={970}/></Item>;
 const deskFront=(y:number,depth=220)=><Item id={sid+'-setting'}><RestaurantSupport part="desk" y={y} depth={depth}/></Item>;
 /** A paper's drop onto a surface: raised by h screen pixels (or nearer the lens, from above) and offset
  * by `from`, landing on the contact curve; its shadow waits on the surface and darkens as it closes. */
 const paperDrop=(L:PaperAt,q:number,h:number,from:Pt,node:React.ReactNode,top:boolean,shadow:React.ReactNode)=>{
  const k=1-q,off:Pt=[from[0]*k,from[1]*k-(top?0:h*k)],grow=top?1+.5*k:1+.12*k;
  // The shadow travels under the object (its horizontal offset, never its lift) and only appears in the last
  // stretch of the fall, so no detached shadow shape ever waits on the surface while the object is far away.
  const near=smooth((q-.72)/.28),sh:Pt=top?[off[0]+12+24*k,off[1]+16+30*k]:[off[0]+6,from[1]*k+8];
  return <g data-part="paper-drop">
   {near>0&&<g transform={paperTransform({...L,x:L.x+sh[0],y:L.y+sh[1]})} opacity={f2(.24*near)}>{shadow}</g>}
   <g transform={`translate(${f2(off[0])} ${f2(off[1])})`}><g transform={`translate(${f2(L.x)} ${f2(L.y)}) scale(${f2(grow)}) translate(${f2(-L.x)} ${f2(-L.y)})`}>
    <g transform={paperTransform(L)}>{node}</g></g></g>
  </g>;
 };
 /** The shadow of a flat tag lying at p on paper (card units). */
 const tagShadow=(lines:string[],size:number,p:Pt,r:number)=>
  <g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}><path d={tagPath(lines,size)} fill="#1A1410"/></g>;
 /** A flat tag lying on paper, in card units, its hole at p. */
 const flatTag=(lines:string[],size:number,p:Pt,r:number)=><g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}>
  <path d="M0 0C-30 -10 -60 6 -80 -6" stroke={RS.ink} strokeWidth={3} fill="none"/>
  <RestaurantSupport part="tag" lines={lines} size={size} tone="kraft"/></g>;

 let pic:React.ReactNode;
 switch(view){
 // ===================== s1: the only server walks out =====================
 case 'door-apron':{
  // A, medium. The storefront door swings shut on its hinge with the bell ringing, while beyond the glass a
  // figure walks away; at the host stand the server's apron swings on its hook. The phone sits silent.
  // The departing figure is gone: the door shutting, the bell and the left-behind apron carry the walkout.
  need('s1');const fy=FLOOR_Y.medium;
  pic=<g>
   {floor(fy)}{pendant(600,300)}
   <Item id="s1-door"><At p={[90,fy]}><RestaurantSupport part="door" open={S.s1.door} bell={S.s1.bell}/></At></Item>
   {stand('door-apron',<g>{padOn(-85,.8,0)}{deskPhoneOn(70,.9,0)}</g>,{apron:true})}
  </g>;
  break;}
 case 'host-phone':{
  // A close / B medium. The desk phone on the empty host stand rings: its handset rattles in the cradle,
  // the line lamp blinks and ring marks pulse; the pad lies beside it, blank, and no one answers.
  need('s1');const close=v==='a';
  pic=<g>
   {!close&&floor(FLOOR_Y.medium)}{!close&&pendant(610,320)}
   {!close&&<Item id="s1-door"><At p={[-150,FLOOR_Y.medium]}><RestaurantSupport part="door" open={0} bell={S.s1.bell}/></At></Item>}
   {stand(key,<g>{padOn(close?-110:-95,close?1:.8,0)}{deskPhoneOn(60,1,S.s1.ring)}</g>,{apron:true})}
  </g>;
  break;}
 case 'blank-pad-tables':{
  // A, wide. Two tables wait under the pendants, a guest raising a hand and turning toward the stand; in
  // the foreground the host stand's guest check pad curls its top sheet and lets it fall back, blank. The
  // wall clock above the window ticks a minute.
  need('s1');const fy=FLOOR_Y.wide;
  pic=<g>
   {floor(fy)}
   <Item id="s1-setting"><At p={[540,360]}><RestaurantSupport part="clock" r={46} minute={S.s1.minute} hour={124}/></At></Item>
   {pendant(330,330)}{pendant(690,300)}
   <Item id="s1-tables">{tableGroup([330,1180],.62,0,{look:-.4*S.s1.wait})}{tableGroup([680,1220],.7,1,{raise:S.s1.wait,look:.8*S.s1.wait,flipChair:true,menu:true})}</Item>
   {stand('blank-pad-tables',<g>{padOn(-60,1.15,S.s1.curl)}{deskPhoneOn(110,.9,S.s1.ring)}</g>)}
  </g>;
  break;}
 case 'floor-plan':{
  // B, overhead. The room as a plan: the door leaf swings shut along its dashed arc and its bell rings;
  // footprints lead from the host stand out through the door; the apron swings beside the stand; two
  // tables wait; the kitchen pass along the right wall holds an idle printer and an empty jar.
  need('s1');const prints=[[300,830],[240,860],[190,890],[150,915],[90,940],[40,965]] as Pt[];
  pic=<g>
   <Item id="s1-setting"><RestaurantSupport part="roomPlan" door={S.s1.door}/></Item>
   <Item id="s1-door"><g transform={`translate(${DOOR_PLAN.hinge[0]} ${DOOR_PLAN.hinge[1]-DOOR_PLAN.len-14})`}>
    <circle r={10} fill={RS.brass} stroke={RS.ink} strokeWidth={2}/>
    {[0,1].map(i=><path key={i} d={`M${16+i*12} -14q10 14 0 28`} stroke={RS.ink} strokeWidth={3} fill="none" opacity={f2(Math.min(1,Math.abs(S.s1.bell)/8)*(1-i*.4))}/>)}
   </g></Item>
   <Item id="s1-setting">{prints.map((p,i)=>{const o=smooth((S.s1.walk*1.2-i*.15)/.15)*(1-.5*smooth((t-1.8)/.6));
    return <At key={i} p={p} r={160} o={o}><RestaurantSupport part="footprint" flip={i%2===1}/></At>;})}</Item>
   <Item id="s1-setting"><At p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></At>
    <At p={PASS_PLAN.printer} s={.36}><OrderRigHero part="printerTop"/></At><At p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={0}/></At></Item>
   <Item id="s1-tables">
    {TABLES_PLAN.map((p,i)=><g key={i}>
     <At p={[p[0]-120,p[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></At><At p={[p[0]+120,p[1]-10]} r={90}><RestaurantSupport part="chairTop"/></At>
     <At p={p} s={.9}><RestaurantSupport part="tableTop"/></At>
     <At p={[p[0]-120,p[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]} raise={0}/></At>
     {i===0&&<At p={[p[0]+120,p[1]-10]} r={-90}><RestaurantSupport part="guestTop" {...GUESTS[1]}/></At>}
    </g>)}
   </Item>
   <Item id="s1-apron"><At p={[STAND_PLAN[0]-84,STAND_PLAN[1]]} r={S.s1.apron*.8}><rect x={-14} y={-30} width={28} height={60} rx={8} fill={RS.apron} stroke={RS.ink} strokeWidth={2.4}/></At></Item>
   <At p={STAND_PLAN}><RestaurantSupport part="standTop"/></At>
   <Item id="s1-phone"><At p={[STAND_PLAN[0]+28,STAND_PLAN[1]-8]}><rect x={-26} y={-16} width={52} height={32} rx={6} fill={RS.charcoal} stroke={RS.ink} strokeWidth={2}/></At></Item>
   <Item id="s1-pad"><At p={[STAND_PLAN[0]-30,STAND_PLAN[1]+12]}><rect x={-20} y={-26} width={40} height={52} rx={3} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2}/></At></Item>
  </g>;
  break;}
 case 'table-wait':{
  // B, close. The host stand's pad fills the foreground, its top sheet curling and falling back blank;
  // behind it the two tables wait and a guest raises a hand toward the empty stand.
  need('s1');
  pic=<g>
   <Item id="s1-tables">{tableGroup([1010,1250],.6,2,{look:-.6})}{tableGroup([760,1350],.95,1,{raise:S.s1.wait,look:-.9*S.s1.wait,flipChair:true,menu:true})}</Item>
   {stand('table-wait',<g>{padOn(0,1,S.s1.curl)}{deskPhoneOn(-170,.8,S.s1.ring)}</g>)}
  </g>;
  break;}
 // ===================== s2: no job ad, an AI host named Haniya =====================
 case 'window-frame':
 case 'sign-window':{
  // A medium / B wide. The empty sign frame on the glass swings and settles with nothing in it, its lone
  // push pin unused, as light crosses its blank acrylic. The host panel stands dark beside the stand.
  need('s2');const wide=view==='sign-window',fy=wide?FLOOR_Y.wide:FLOOR_Y.medium;
  const cup:Pt=wide?[560,470]:[380,450],cs=wide?.95:1.3;
  pic=<g>
   {floor(fy)}
   <Item id="s2-setting">{wide?<At p={[100,fy]} s={.85}><RestaurantSupport part="door" open={0}/></At>:<At p={[-170,fy]}><RestaurantSupport part="door" open={0}/></At>}</Item>
   {wide&&<Item id="s2-setting">{tableGroup([420,1180],.55,3,{look:-.3})}</Item>}
   <Item id="s2-frame"><At p={cup} s={cs} r={S.s2.swing}><RestaurantSupport part="signFrame" shine={S.s2.shine}/></At></Item>
   {panel(view,0,0,0,'s2-panel')}
   {stand(view,<g>{padOn(-85,.8,0)}{deskPhoneOn(70,.9,0)}</g>,{apron:true})}
  </g>;
  break;}
 case 'host-panel':{
  // A close / B medium. The flat host panel at the front lights from the left, its voice rings glowing, and
  // the name Haniya writes across it. B's medium keeps the host stand where the server stood beside it.
  need('s2');const medium=v==='b';
  pic=<g>
   {medium&&floor(FLOOR_Y.medium)}{medium&&pendant(640,320)}
   {medium&&stand(key,<g>{padOn(-85,.8,0)}{deskPhoneOn(70,.9,0)}</g>,{id:'s2-setting',apron:true})}
   {panel(key,S.s2.lit,S.s2.name,0,'s2-panel')}
  </g>;
  break;}
 case 'ai-tag':
 case 'tag-detail':{
  // A detail / B detail. A tag reading AI host is carried in on its string and hooks onto the panel's
  // eyelet, where it swings and settles beside the lit name. A comes from the right over the name's side,
  // B from the left with the panel framed to the right.
  need('s2');const L=pick(PANEL_AT),eye=toScreen(L,PANEL.eyelet),fromRight=view==='ai-tag';
  const rig:TagRig={lines:TAGS.ai,size:46,len:fromRight?120:110,from:fromRight?[1180,300]:[-140,320],tone:'slate'};
  pic=<g>
   {panel(view,1,1,0,'s2-panel')}
   {hangTag('s2-tag',eye,rig,S.s2.tag,(fromRight?-18:18)*S.s2.carry+S.s2.settle,S.s2.carry)}
  </g>;
  break;}
 // ===================== s3: scan, tap or talk, pay =====================
 case 'code-scan':{
  // A close: the hand lifts the phone over the table code; the viewfinder's brackets close on the code and
  // lock; the menu sheet slides up. B overhead: the same from straight above the table top.
  need('s3');const L0=pick(PHONE_AT),from=L0.from!;
  const L={...L0,x:lerp(from[0],L0.x,S.s3.lift),y:lerp(from[1],L0.y,S.s3.lift),r:lerp((L0.r??0)+14,L0.r??0,S.s3.lift)};
  const st:PhoneState={scan:1,lock:S.s3.lock,menu:S.s3.menu};
  pic=v==='a'?<g>
   <Item id="s3-setting">{tableBand(930)}<At p={[150,1000]} s={1.3}><RestaurantSupport part="plate"/></At><At p={[960,1010]} s={1.2}><RestaurantSupport part="waterGlass"/></At></Item>
   <Item id="s3-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><At p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></At></Item>
   <Item id="s3-phone"><Item id="s3-menu">{phoneRig(L,st)}</Item></Item>
  </g>:<g>
   <Item id="s3-setting">{tableTopBig()}</Item>
   <Item id="s3-code"><At p={[640,760]} s={1.1}><OrderRigHero part="codeStandTop"/></At></Item>
   <Item id="s3-phone"><Item id="s3-menu">{phoneRig(L,st)}</Item></Item>
  </g>;
  break;}
 case 'menu-tap':{
  // A detail: the menu fills the frame; a fingertip comes in, presses the Chow mein row, which lights with
  // its plain price chip, and lifts away; Talk sits beside Pay. B medium, over her shoulder: the one seated
  // guest, seen from behind her right shoulder, holds the phone up with her left hand, which rises out of her
  // own shoulder line, and taps the row with her right hand on one jointed arm at the same scale: shoulder,
  // upper arm, elbow, forearm and hand. The arm is drawn behind her back, so it leaves her own shoulder.
  need('s3');const L=pick(PHONE_AT),contact=toScreen(L,screenPt(PHONE_UI.chow));
  const fs=v==='a'?1.3:.8,rest:Pt=[contact[0]+520*fs,contact[1]+600*fs],away:Pt=[contact[0]+300*fs,contact[1]+420*fs];
  const tip=fingerTip(contact,S.s3.tapGo,S.s3.tapPress,S.s3.tapBack,rest,away);
  const st:PhoneState={scan:0,lock:1,menu:1,lit:S.s3.lit,tap:S.s3.ripple,tapAt:PHONE_UI.chow};
  pic=v==='a'?<g>
   <Item id="s3-phone"><Item id="s3-menu"><Item id="s3-dish">{phoneRig(L,st,{finger:S.s3.tapGo>0&&S.s3.tapBack<1?{tip,press:S.s3.tapPress,s:fs}:null})}</Item></Item></Item>
  </g>:(()=>{
   const arm=otsArm(S.s3),G=OTS.guest,look={...GUESTS[2],skin:SKIN.a3,shirt:GUEST_SLEEVE};
   const elbow:Pt=[arm.E[0]-G[0],arm.E[1]-G[1]];
   return <g>
    <Item id="s3-setting">{tableBand(1010)}<At p={[1010,1060]} s={1.1}><RestaurantSupport part="waterGlass"/></At></Item>
    <Item id="s3-phone"><Item id="s3-menu"><Item id="s3-dish">{phoneRig(L,st,{skin:SKIN.a3})}
     <At p={arm.tip} s={arm.fs} r={arm.th/DEG}><OrderRigHero part="finger" skin={SKIN.a3} press={S.s3.tapPress} sleeve={arm.b/arm.fs}/></At></Item></Item></Item>
    <Item id="s3-setting"><At p={G}><RestaurantSupport part="guestBack" layer="upperArm" {...look} elbow={elbow}/></At>
     <At p={G}><RestaurantSupport part="guestBack" layer="body" {...look}/></At></Item>
   </g>;})();
  break;}
 case 'pay-mark':
 case 'paid-close':{
  // A close / B detail. The finger presses Pay; the button shrinks into the round red paid mark, its white
  // check drawing, and the word Paid appears. B's detail fills the frame with the button.
  need('s3');const L=pick(PHONE_AT),contact=toScreen(L,screenPt(PHONE_UI.pay)),fs=view==='pay-mark'?1:2;
  const rest:Pt=[contact[0]+500*fs,contact[1]+560*fs],away:Pt=[contact[0]+280*fs,contact[1]+380*fs];
  const tip=fingerTip(contact,S.s3.payGo,S.s3.payPress,S.s3.payBack,rest,away);
  const st:PhoneState={scan:0,lock:1,menu:1,lit:1,pay:S.s3.pay,tap:S.s3.payRipple,tapAt:PHONE_UI.pay};
  pic=<g><Item id="s3-phone"><Item id="s3-pay">{phoneRig(L,st,{finger:S.s3.payGo>0&&S.s3.payBack<1?{tip,press:S.s3.payPress,s:fs}:null})}</Item></Item></g>;
  break;}
 // ===================== s4: nothing is cooked until it is paid for =====================
 case 'printer-idle':
 case 'pass-wide':{
  // A medium / B wide. The printer stands on the pass, its slot blank and its lamp pulsing in standby under
  // an empty rail; the wok's flame is turned down to low blue. B's wide adds the hood over the line.
  need('s4');const wide=view==='pass-wide',Sh=SHELF[view];
  pic=<g>
   {floor(1200)}
   {wide&&<Item id="s4-setting"><At p={[560,440]}><RestaurantSupport part="hood" w={440}/></At></Item>}
   <Item id="s4-setting"><At p={[Sh.x+30,toScreen(PRINTER_AT[view],[0,PRINTER.rail.y])[1]-130]}><RestaurantSupport part="heatLamp" w={Sh.w-60} rod={200}/></At>{cabinet(Sh.x,Sh.y,Sh.w)}{shelf(view)}</Item>
   {printerRig(PRINTER_AT[view],{len:0,cut:0,hang:0,led:0,standby:S.s4.standby,roll:0})}
   {wokRig(WOK_AT[view],wokCold)}
  </g>;
  break;}
 case 'paid-line':{
  // A close: the paid mark leaves the phone's screen and travels a dashed line into the printer's slot,
  // and at its arrival the lamp turns red. B overhead: the same journey across the room's plan, from the
  // guest's phone at the table to the printer on the pass.
  need('s4');
  if(v==='a'){
   const L=pick(PHONE_AT),pr=PRINTER_AT[key],from=toScreen(L,screenPt(PHONE_UI.paidBig)),to=toScreen(pr,[PRINTER.slot.x,PRINTER.slot.y]);
   const ctrl:Pt=[(from[0]+to[0])/2-40,Math.min(from[1],to[1])-380],p=bez(from,ctrl,to,S.s4.token);
   pic=<g>
    <Item id="s4-setting">{shelf('paid-line')}</Item>
    {printerRig(pr,{len:0,cut:0,hang:0,led:S.s4.led,standby:S.s4.standby,roll:0})}
    {phoneRig(L,paidPhone)}
    <Item id="s4-paid"><path d={`M${f2(from[0])} ${f2(from[1])}Q${f2(ctrl[0])} ${f2(ctrl[1])} ${f2(to[0])} ${f2(to[1])}`} stroke={HP.red} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={f2(.75*S.s4.line)}/>
     {S.s4.tokenR>0&&S.s4.token>0&&<At p={p}><OrderRigHero part="paidMark" r={34*S.s4.tokenR}/></At>}</Item>
   </g>;
  }else{
   // The plan carries the journey; as the mark nears the pass the camera follows it down (rest to rest) onto
   // the printer seen from above, so the mark entering the slot and the lamp answering it are held large.
   const T2=TABLES_PLAN[1],from:Pt=[T2[0]+40,T2[1]-30],PS=.36,pr=PASS_PLAN.printer;
   const to:Pt=[pr[0]+PS*PRINTER_TOP.slot[0],pr[1]+PS*PRINTER_TOP.slot[1]],ctrl:Pt=[880,860],p=bez(from,ctrl,to,S.s4.token);
   const u=ease5((S.s4.r2-.1)/.8),k=lerp(1,PAID_ZOOM,u),f=lerpPt([540,780],to,u),an=lerpPt([540,780],PAID_ANCHOR,u);
   pic=<g transform={`translate(${f2(an[0])} ${f2(an[1])}) scale(${k.toFixed(4)}) translate(${f2(-f[0])} ${f2(-f[1])})`}>
    <Item id="s4-setting"><RestaurantSupport part="roomPlan" door={0}/>
     <At p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></At>
     <At p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={.1}/></At>
     {TABLES_PLAN.map((q,i)=><g key={i}><At p={[q[0]-120,q[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></At>
      <At p={q} s={.9}><RestaurantSupport part="tableTop"/></At>
      <At p={[q[0]-120,q[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]}/></At></g>)}
     <At p={STAND_PLAN}><RestaurantSupport part="standTop"/></At></Item>
    <Item id="s4-printer"><At p={pr} s={PS}><OrderRigHero part="printerTop" led={S.s4.led}/></At></Item>
    <At p={from} s={.2} r={-20}><OrderRigHero part="phone" {...paidPhone}/></At>
    <Item id="s4-paid"><path d={`M${f2(from[0])} ${f2(from[1])}Q${f2(ctrl[0])} ${f2(ctrl[1])} ${f2(to[0])} ${f2(to[1])}`} stroke={HP.red} strokeWidth={f2(5/(.4+.6*k))} strokeDasharray={`${f2(14/k)} ${f2(12/k)}`} fill="none" opacity={f2(.75*S.s4.line)}/>
     {S.s4.tokenR>0&&S.s4.token>0&&<At p={p}><OrderRigHero part="paidMark" r={lerp(26,15,u)*S.s4.tokenR}/></At>}</Item>
   </g>;
  }
  break;}
 case 'ticket-print':{
  // A detail / B close. Only now the ticket rises out of the slot, top first, the paid mark and Chow mein
  // leading; its top edge reaches the rail, the bearing turns and grips it, and the cutter frees it.
  need('s4');const pr=PRINTER_AT[key];
  pic=<g>
   {v==='b'&&<Item id="s4-setting">{shelf('ticket-print')}</Item>}
   {v==='b'&&wokRig(WOK_AT[key],wokCold)}
   {printerRig(pr,ticketNow())}
  </g>;
  break;}
 case 'wok-flare':
 case 'flame-close':{
  // A wide / B detail. With the ticket hanging on the rail, the wok's flame flares orange around the bowl
  // and the noodles toss as the pan starts to cook.
  need('s4');const Sh=SHELF[view],wide=view==='wok-flare';
  pic=<g>
   {wide&&floor(FLOOR_Y.wide+160)}
   <Item id="s4-setting">{wide&&<At p={[Sh.x+20,toScreen(PRINTER_AT[view],[0,PRINTER.rail.y])[1]-130]}><RestaurantSupport part="heatLamp" w={Sh.w-40} rod={160}/></At>}{wide&&cabinet(Sh.x,Sh.y,Sh.w)}{shelf(view)}</Item>
   {printerRig(PRINTER_AT[view],ticketNow())}
   {wokRig(WOK_AT[view],wokNow())}
  </g>;
  break;}
 // ===================== s5: the owner's count =====================
 case 'ledger-slide':
 case 'desk-ledger':{
  // A medium / B overhead. A ledger card headed with the source's words, its rows ruled and empty, slides
  // onto the back office desk and settles; the bare receipt clip waits beside it.
  need('s5');const L0=pick(LEDGER_AT),top=view==='desk-ledger';
  const L={...L0,x:L0.x+(1-S.s5.slide)*(top?900:760),r:(L0.r??0)+6*(1-S.s5.slide)};
  pic=top?<g>
   {deskTopFull()}
   <Item id="s5-setting"><At p={[180,400]} s={.9}><RestaurantSupport part="mug" top/></At></Item>
   <Item id="s5-clip"><At p={[900,400]} s={1.2}><RestaurantSupport part="receiptClip" top/></At></Item>
   <Item id="s5-ledger"><g transform={paperTransform({...L,x:L.x+10,y:L.y+12})} opacity={.2}><rect width={LEDGER.w} height={LEDGER.h} fill="#1A1410"/></g>
    <g transform={paperTransform(L)}><RestaurantSupport part="ledgerCard"/></g></Item>
  </g>:<g>
   {deskFront(880,300)}
   <Item id="s5-clip"><At p={[720,520]}><RestaurantSupport part="corkBoard" w={260} h={300}/></At><At p={[850,560]}><RestaurantSupport part="receiptClip"/></At></Item>
   <Item id="s5-setting"><At p={[140,1010]} s={.8}><RestaurantSupport part="mug"/></At></Item>
   <Item id="s5-ledger"><g transform={paperTransform({...L,x:L.x+8,y:L.y+10})} opacity={.2}><rect width={LEDGER.w} height={LEDGER.h} fill="#1A1410"/></g>
    <g transform={paperTransform(L)}><RestaurantSupport part="ledgerCard"/></g></Item>
  </g>;
  break;}
 case 'ledger-tag':
 case 'ledger-corner':{
  // A close / B close from above. A tag reading $9,650 a month drops onto the card and lands flat beside
  // its header, its shadow closing under it.
  need('s5');const L=pick(LEDGER_AT),top=view==='ledger-corner';
  const tag=flatTag(TAGS.money,30,LEDGER.tag,-8);
  pic=<g>
   {top?deskTopFull():deskFront(700,520)}
   <Item id="s5-ledger"><g transform={paperTransform(L)}><RestaurantSupport part="ledgerCard"/></g>
    {S.s5.tag>0&&paperDrop(L,S.s5.tag,top?0:420,top?[120,-200]:[60,0],tag,top,tagShadow(TAGS.money,30,LEDGER.tag,-8))}</Item>
  </g>;
  break;}
 case 'owner-stamp':{
  // A detail, side on / B detail, from above. A rubber stamp comes down onto the card, presses, holds and
  // lifts away, leaving OWNER COUNT crooked beside the tag.
  need('s5');const L=pick(LEDGER_AT),top=v==='b',st=S.s5.stamp,m=paperPt(L,[LEDGER.mark.x,LEDGER.mark.y]);
  const mw=stampSize().w*L.s,k=mw/132;
  const tag=flatTag(TAGS.money,30,LEDGER.tag,-8);
  const stampNode=top?(()=>{const far=1-st.come+st.away,h=st.lift;
   const sc=mw/132*(1+.55*h+.6*far),off:Pt=[520*far,-640*far],sh:Pt=[18+70*h,26+80*h];
   return <g><At p={[m[0]+sh[0]+off[0]*.6,m[1]+sh[1]+off[1]*.6]} s={mw/132} r={LEDGER.mark.rot} o={.25*(1-far)}><rect x={-66} y={-23} width={132} height={46} rx={8} fill="#1A1410"/></At>
    <At p={[m[0]+off[0],m[1]+off[1]]} s={sc} r={LEDGER.mark.rot}><RestaurantSupport part="stamp" top/></At></g>;})():
   (()=>{const y=m[1]-st.lift*140-(1-st.come)*900-st.away*900;
    return <g><ellipse cx={m[0]+10} cy={m[1]+6} rx={f2(70*k*(1-.4*st.lift))} ry={f2(14*k*.62)} fill="#1A1410" opacity={f2(.3*(1-st.lift)*st.come*(1-st.away))}/>
     <At p={[m[0],y]} s={k}><RestaurantSupport part="stamp"/></At></g>;})();
  pic=<g>
   {top?deskTopFull():deskFront(500,760)}
   <Item id="s5-ledger"><g transform={paperTransform(L)}><RestaurantSupport part="ledgerCard" mark={st.inked}/>{tag}</g></Item>
   <Item id="s5-stamp">{stampNode}</Item>
  </g>;
  break;}
 case 'empty-clip':
 case 'clip-bench':{
  // A medium / B medium. In the back office the receipt clip on its nail opens its jaws and snaps shut on
  // nothing, wobbling, while the card lies on the desk with its tag and its owner count mark.
  need('s5');const L=pick(LEDGER_AT),a=view==='empty-clip';
  const board:Pt=a?[660,700]:[80,640],bw=a?300:260,bh=a?380:440,nail:Pt=a?[810,760]:[210,700],cs=a?1.15:1.3;
  pic=<g>
   {deskFront(1060,200)}
   <Item id="s5-clip"><At p={board}><RestaurantSupport part="corkBoard" w={bw} h={bh}/></At><At p={nail} s={cs} r={S.s5.wob}><RestaurantSupport part="receiptClip" open={S.s5.clip}/></At></Item>
   <Item id="s5-setting"><At p={a?[600,1150]:[420,1150]} s={.7}><RestaurantSupport part="mug"/></At></Item>
   <Item id="s5-ledger"><g transform={paperTransform(L)}><RestaurantSupport part="ledgerCard" mark={1}/>{flatTag(TAGS.money,30,LEDGER.tag,-8)}</g></Item>
  </g>;
  break;}
 // ===================== s6: FOX 26 reports all tips to the kitchen =====================
 case 'coins-drop':{
  // A medium. Plain coins and notes leave the paid phone's screen and fall in arcs toward the glass jar at
  // the kitchen pass, the wok behind it.
  need('s6');const L=pick(PHONE_AT),src=toScreen(L,screenPt(PHONE_UI.paidBig));const Sh=SHELF['coins-drop'];
  pic=<g>
   {floor(FLOOR_Y.medium+90)}
   <Item id="s6-pass">{cabinet(Sh.x,Sh.y,Sh.w)}{shelf('coins-drop')}<At p={[440,Sh.y]} s={.85}><RestaurantSupport part="plate" food="noodle"/></At></Item>
   {wokRig(WOK_AT['coins-drop'],wokOn)}
   {phoneRig(L,paidPhone)}
   {jarDraw('coins-drop',S.s6.fill,true,'s6-jar',src)}
  </g>;
  break;}
 case 'jar-fills':{
  // A close / B medium. The coins drop through the jar's mouth onto the pile, which rises. B keeps the
  // printer and its hanging ticket on the same pass and the wok beside it.
  need('s6');
  pic=v==='a'?<g>
   <Item id="s6-pass">{shelf('jar-fills')}</Item>
   {jarDraw('jar-fills',S.s6.fill,true,'s6-jar')}
  </g>:<g>
   {floor(FLOOR_Y.medium+90)}
   <Item id="s6-pass">{cabinet(40,1040,1000)}{shelf('jar-fills')}</Item>
   {printerRig(PRINTER_AT[key],ticketDone)}
   {wokRig(WOK_AT[key],wokOn)}
   {jarDraw('jar-fills',S.s6.fill,true,'s6-jar')}
  </g>;
  break;}
 case 'jar-tag':
 case 'tag-close':{
  // A detail / B detail. A tag reading FOX 26 reports, all to the kitchen, is carried in and hooks onto
  // the jar's neck, then swings and settles over the coins.
  need('s6');const right=view==='jar-tag',anchor=jarAnchor(view,right?0:1);
  const rig:TagRig={lines:TAGS.fox,size:46,len:70,from:right?[1160,480]:[-160,450],tone:'kraft'};
  pic=<g>
   {jarDraw(view,S.s6.fill,false,'s6-jar')}
   {hangTag('s6-tag',anchor,rig,S.s6.tag,(right?-18:18)*S.s6.carry+S.s6.settle,S.s6.carry)}
  </g>;
  break;}
 case 'pass-overhead':{
  // B overhead. From above the pass: coins and notes slide off the paid phone at the counter's front edge,
  // rise and fall across the steel toward the jar, their shadows trailing; the wok glows beyond.
  need('s6');const jar:Pt=[720,760],ph:Pt=[200,1000];
  const pieces=Array.from({length:COINS},(_,i)=>{const c=coinFlight(W,t,i);if(!c.launched||c.u>=1)return null;
   const u=smooth(c.u),p=lerpPt([ph[0]+30,ph[1]-40],[jar[0]+(i%3-1)*20,jar[1]],u),hgt=Math.sin(Math.PI*u),sc=1+.7*hgt;
   return <g key={i}><At p={[p[0]+40*hgt,p[1]+60*hgt]} s={.9} o={.25}><circle r={20} fill="#1A1410"/></At>
    <At p={p} s={sc}>{i%4===3?<OrderRigHero part="bill" w={64}/>:<OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={1}/>}</At></g>;});
  pic=<g>
   <Item id="s6-pass"><rect x={-20} y={560} width={1120} height={460} fill={RS.steel}/><At p={[-20,560]}><RestaurantSupport part="counterTop" w={1120} h={460}/></At>
    <At p={[330,420]} s={.9}><OrderRigHero part="wokTop" flame={.7} t={t}/></At><At p={[860,560]} s={.7}><OrderRigHero part="printerTop" led={1}/></At></Item>
   <Item id="s6-jar"><At p={jar} s={1.3}><OrderRigHero part="jarTop" fill={S.s6.fill}/></At></Item>
   <At p={ph} s={.5} r={-10}><OrderRigHero part="phone" {...paidPhone}/></At>
   <Item id="s6-coins">{pieces}</Item>
  </g>;
  break;}
 // ===================== s7: the federal rule =====================
 case 'rule-card':{
  // A medium / B overhead. A federal rule card slides onto the desk and its no tip credit box draws, empty.
  need('s7');const L0=pick(RULE_AT),top=v==='b';
  const L={...L0,x:L0.x+(1-S.s7.slide)*900,r:(L0.r??0)+5*(1-S.s7.slide)};
  pic=<g>
   {top?deskTopFull():deskFront(420,820)}
   {top&&<Item id="s7-setting"><At p={[960,420]} s={.9}><RestaurantSupport part="mug" top/></At></Item>}
   <Item id="s7-rule"><g transform={paperTransform({...L,x:L.x+10,y:L.y+14})} opacity={.2}><rect width={RULE.w} height={RULE.h} rx={10} fill="#1A1410"/></g>
    <g transform={paperTransform(L)}><Item id="s7-box"><RestaurantSupport part="ruleCard" box={S.s7.box} lit={0} circle={0}/></Item></g></Item>
  </g>;
  break;}
 case 'cooks-line':
 case 'box-close':{
  // A close / B close from above. The cooks line lights in a band beside the empty no tip credit box.
  need('s7');const L=pick(RULE_AT);
  pic=<g>
   {v==='b'?deskTopFull():deskFront(300,940)}
   <Item id="s7-rule"><g transform={paperTransform(L)}><Item id="s7-cooks"><Item id="s7-box"><RestaurantSupport part="ruleCard" box={1} lit={S.s7.lit} circle={0}/></Item></Item></g></Item>
  </g>;
  break;}
 case 'circle-detail':
 case 'pen-circle':{
  // A detail / B detail from above. A writing hand brings its pen down and circles the lit cooks line and
  // the box together; the box stays empty and nothing is ticked.
  need('s7');const L=pick(RULE_AT),c=S.s7.circle;
  const start=paperPt(L,rulePenPoint(0)),cur=paperPt(L,rulePenPoint(c));
  const rest:Pt=v==='a'?[1180,1400]:[-200,1400];
  let tip=c>0?cur:lerpPt(rest,start,S.s7.penGo);
  tip=[tip[0]+30*S.s7.penLift,tip[1]-40*S.s7.penLift];
  pic=<g>
   {v==='b'?deskTopFull():deskFront(260,980)}
   <Item id="s7-rule"><g transform={paperTransform(L)}><Item id="s7-cooks"><Item id="s7-box"><RestaurantSupport part="ruleCard" box={1} lit={1} circle={c}/></Item></Item></g></Item>
   {S.s7.penGo>0&&<Item id="s7-setting"><At p={tip} s={1.4} sx={v==='a'?1:-1}><RestaurantSupport part="penHand" skin={SKIN.writer}/></At></Item>}
  </g>;
  break;}
 // ===================== s8: no report says which =====================
 case 'blank-folder':
 case 'folder-wide':{
  // A medium / B overhead wide. The restaurant folder slides in beside the rule card and settles, closed.
  need('s8');const R0=pick(RULE_AT),F0=pick(FOLDER_AT),top=view==='folder-wide';
  const F={...F0,x:F0.x+(1-S.s8.slide)*820,r:4*(1-S.s8.slide)};
  pic=<g>
   {top?deskTopFull():deskFront(420,820)}
   <Item id="s8-rule"><g transform={paperTransform(R0)}><RestaurantSupport part="ruleCard" box={1} lit={1} circle={1}/></g></Item>
   <Item id="s8-folder"><g transform={paperTransform({...F,x:F.x+10,y:F.y+14})} opacity={.2}><rect y={-6} width={FOLDER.w} height={FOLDER.h+6} rx={8} fill="#1A1410"/></g>
    <g transform={paperTransform(F)}><Item id="s8-blank"><RestaurantSupport part="folder" open={S.s8.open} q={S.s8.q}/></Item></g></Item>
  </g>;
  break;}
 case 'blank-box':
 case 'folder-close':{
  // A detail / B close from above. The folder's cover turns over; inside, the one box reading takes no tip
  // credit stays blank and a question mark draws beside it.
  need('s8');const F=pick(FOLDER_AT);
  pic=<g>
   {view==='folder-close'?deskTopFull():deskFront(300,940)}
   <Item id="s8-folder"><g transform={paperTransform(F)}><Item id="s8-blank"><RestaurantSupport part="folder" open={S.s8.open} q={S.s8.q}/></Item></g></Item>
  </g>;
  break;}
 // ===================== s9: one customer's remark =====================
 case 'viewfinder-hunt':{
  // A close / B overhead. A hand raises the phone toward the table code, pauses short of it with the
  // camera open and its frame wide, never closing, then lowers it again without scanning.
  // B: from below the frame the hand raises the phone, pauses short of the code and brings it down onto the
  // table at its later place for the quote (scale falls as it nears the table), where the hand stays resting on
  // it; the next shot keeps the same hand on the same phone, so nothing leaves the frame at speed.
  need('s9');const L0=pick(PHONE_AT),rest=L0.from!,u=S.s9.up,TB=PHONE_AT['quote-side:b'];
  const raised={...L0,x:lerp(rest[0],L0.x,S.s9.raise),y:lerp(rest[1],L0.y,S.s9.raise),r:lerp((L0.r??0)+22,L0.r??0,S.s9.raise)+S.s9.waver};
  const L=v==='a'?{...L0,x:lerp(rest[0],L0.x,u),y:lerp(rest[1],L0.y,u),r:lerp((L0.r??0)+22,L0.r??0,u)+S.s9.waver}:
   {...raised,x:lerp(raised.x,TB.x,S.s9.lower),y:lerp(raised.y,TB.y,S.s9.lower),s:lerp(L0.s,TB.s,S.s9.lower),r:lerp(raised.r??0,TB.r??0,S.s9.lower)};
  const st:PhoneState={scan:1,lock:0,menu:0,dim:v==='a'?.5*(1-u):.5*S.s9.lower};
  pic=v==='a'?<g>
   <Item id="s9-table">{tableBand(930)}<At p={[170,1010]} s={1.2}><RestaurantSupport part="plate"/></At><At p={[960,1000]} s={1.1}><RestaurantSupport part="menuTent"/></At></Item>
   <Item id="s9-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><At p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></At></Item>
   <Item id="s9-phone">{phoneRig(L,st,{skin:SKIN.a9})}</Item>
  </g>:<g>
   <Item id="s9-table">{tableTopBig()}</Item>
   <Item id="s9-code"><At p={CODE9_TOP} s={1.1}><OrderRigHero part="codeStandTop"/></At></Item>
   <Item id="s9-phone">{phoneRig(L,st,{skin:SKIN.a9})}</Item>
  </g>;
  break;}
 case 'quote-card':
 case 'quote-side':{
  // A medium / B medium from above. The phone lies lowered on the table, its code unscanned; a quote card
  // from one customer lands beside it; then the phone's screen times out. B's hand still rests on the phone.
  need('s9');const Q=pick(QUOTE_AT),top=view==='quote-side',L=pick(PHONE_AT);
  const st:PhoneState={scan:1,lock:0,menu:0,dim:.5+.5*S.s9.dim};
  const flatPhone=top?phoneRig({...L,hand:true},st,{skin:SKIN.a9}):
   <g><ellipse cx={L.x+6} cy={L.y+60*L.s} rx={170*L.s} ry={30*L.s} fill="#1A1410" opacity={.22}/>
    <g transform={`translate(${L.x} ${L.y}) rotate(${L.r??0}) scale(${L.s} ${(L.s*.36).toFixed(4)})`}><OrderRigHero part="phone" {...st}/></g></g>;
  pic=<g>
   <Item id="s9-table">{top?tableTopBig():tableBand(860)}</Item>
   {!top&&<Item id="s9-code"><At p={[330,1050]} s={.9}><OrderRigHero part="codeStand"/></At></Item>}
   {top&&<Item id="s9-code"><At p={CODE9_TOP} s={1.1}><OrderRigHero part="codeStandTop"/></At></Item>}
   <Item id="s9-phone">{flatPhone}</Item>
   <Item id="s9-quote">{S.s9.quote>0&&paperDrop(Q,S.s9.quote,top?0:420,top?[-160,-220]:[140,0],<RestaurantSupport part="quoteCard"/>,top,<rect width={600} height={290} rx={12} fill="#1A1410"/>)}</Item>
  </g>;
  break;}
 // ===================== s10: software takes the order; the tip rests on a word =====================
 case 'panel-order':
 case 'stand-wide':{
  // A medium / B wide, staged in depth. The lit host panel stands large at the front: within the shot's first
  // second a large order card for Chow mein, already marked paid, slides up its screen and lands with a glow;
  // a ticket slip leaves the card's edge, arcs back to the kitchen pass and drops into the printer's slot,
  // and only on its arrival the printer's lamp answers red and the ticket for it rises out of the slot, is
  // gripped by the rail and cut, and swings. The printer stood empty before the slip (the s4 ticket went to
  // the line long ago), so the hanging ticket in the shots after it is this one. The camera eases in toward the
  // printer from the shot's first frame to its last, rest to rest, so the frame never holds still.
  need('s10');const wide=view==='stand-wide',Pn=PANEL_AT[view],Pr=PRINTER_AT[view],Sh=SHELF[view];
  const cardY=PANEL.screen.y+PANEL.screen.h+24-ORDER_CARD.rise+ORDER_CARD.h*.5;
  const from=toScreen(Pn,[ORDER_CARD.w/2,cardY]),to=toScreen(Pr,[PRINTER.slot.x,PRINTER.slot.y]);
  const ctrl:Pt=[(from[0]+to[0])/2+40,Math.min(from[1],to[1])-300],u=S.s10.slip,sp=bez(from,ctrl,to,u);
  const slipS=lerp(Pn.s*1.15,Pr.s*1.3,smooth(u))*(1-smooth((u-.84)/.16));
  const cu=ease5((t-shot.start_s)/shot.duration_s),zoom=1+(wide?.08:.06)*cu,pivot:Pt=[to[0],to[1]-60];
  pic=<g transform={`translate(${f2(pivot[0])} ${f2(pivot[1])}) scale(${zoom.toFixed(4)}) translate(${f2(-pivot[0])} ${f2(-pivot[1])})`}>
   {floor(wide?FLOOR_Y.wide:FLOOR_Y.medium)}{pendant(wide?620:640,300)}
   <Item id="s10-setting">{cabinet(Sh.x,Sh.y,Sh.w)}{shelf(view)}</Item>
   {printerRig(Pr,{len:TICKET.len*S.s10.print,cut:S.s10.cut,hang:S.s10.hang,led:S.s10.led,standby:S.s4.standby,roll:S.s10.print})}
   {jarDraw(view,.72,false,'s10-jar')}
   {panel(view,1,1,S.s10.order,'s10-panel',S.s10.ping)}
   {u>0&&slipS>.02&&<Item id="s10-panel"><path d={`M${f2(from[0])} ${f2(from[1])}Q${f2(ctrl[0])} ${f2(ctrl[1])} ${f2(to[0])} ${f2(to[1])}`} stroke={RS.screenLit} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={f2(.65*(1-smooth((u-.9)/.1)))}/>
    <At p={sp} s={slipS} r={-10+18*u}><rect x={-30} y={-40} width={60} height={80} rx={4} fill={HP.paper} stroke={RS.ink} strokeWidth={2.4}/>
     <circle cx={-12} cy={-22} r={8} fill={HP.red}/><rect x={2} y={-26} width={20} height={6} rx={3} fill="#8F8A80"/><rect x={-20} y={-6} width={40} height={6} rx={3} fill="#A9A397"/><rect x={-20} y={8} width={30} height={6} rx={3} fill="#A9A397"/></At></Item>}
  </g>;
  break;}
 case 'jar-owner-tag':{
  // A close / B medium. At the pass a tag reading owner says is carried in and hooks onto the full jar's
  // neck, swinging and settling.
  need('s10');const anchor=jarAnchor(view,0);
  const rig:TagRig={lines:TAGS.owner,size:v==='a'?50:46,len:v==='a'?80:70,from:[1160,520],tone:'cream'};
  pic=<g>
   {v==='b'&&floor(FLOOR_Y.medium+90)}
   <Item id="s10-setting">{v==='b'&&cabinet(0,1040,1080)}{shelf('jar-owner-tag')}</Item>
   {v==='b'&&printerRig(PRINTER_AT[key],ticketDone)}
   {jarDraw(view,.72,false,'s10-jar')}
   {hangTag('s10-tag',anchor,rig,S.s10.tag1,-18*S.s10.carry1+S.s10.settle1,S.s10.carry1)}
  </g>;
  break;}
 case 'jar-no-record':
 case 'tags-close':{
  // A wide / B detail: the held final image. The owner says tag hangs on the jar and a second tag reading
  // no record shown settles beside it, under it. A's wide keeps the lit host panel that now takes the order
  // at the front; B's detail keeps the printed ticket on its rail above the jar.
  need('s10');const wide=view==='jar-no-record';
  const owner:TagRig={lines:TAGS.owner,size:wide?44:52,len:60,from:[1160,520],tone:'cream'};
  const none:TagRig={lines:TAGS.none,size:wide?44:52,len:wide?194:216,from:[-160,560],tone:'cream'};
  pic=<g>
   {wide&&floor(FLOOR_Y.wide)}{wide&&pendant(560,300)}
   <Item id="s10-setting">{wide&&cabinet(440,960,640)}{shelf(view)}</Item>
   {printerRig(PRINTER_AT[view],ticketDone)}
   {wide&&panel(view,1,1,1,'s10-panel')}
   {jarDraw(view,.72,false,'s10-jar')}
   {hangTag('s10-record',jarAnchor(view,1),none,S.s10.tag2,18*S.s10.carry2+S.s10.settle2,S.s10.carry2)}
   {hangTag('s10-tag',jarAnchor(view,0),owner,1,S.s10.settle1,0)}
  </g>;
  break;}
 default:throw new Error('Unimplemented order pass view '+view);
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
