import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {OrderRigHero,HP,PHONE,PHONE_UI,screenPt,PRINTER,PRINTER_TOP,railGrip,TICKET,JAR,pileTop,FINGER_ARM,type PhoneState} from './OrderRigHero';
import {RestaurantSupport,RS,STAND,PANEL,ORDER_CARD,LEDGER,RULE,FOLDER,DOOR_PLAN,TABLES_PLAN,STAND_PLAN,PASS_PLAN,
 GUESTS,GUEST_BACK,TABLE,tagPath,stampSize,rulePenPoint,hash,STAMP_TEXT,type Food} from './RestaurantSupport';
import {ClosedRoomAnsweredPhoneScene,apronSwing,phoneRing,type ClosedRoomView} from './ClosedRoomAnsweredPhoneScene';

/**
 * Who takes the order (2026-10-26, Harris County, Spring, the upper Gulf Coast), the closed-room film.
 * Registered under the edition's route id order-pass-v1; s2 mechanism order-pass-s2-closed-room-answered-phone-v1.
 *
 * This module replaces OrderHandoverFilm.tsx and its StationHandoverScene.tsx, which stay on disk unchanged as
 * retained evidence and are imported by no renderer. The station handover is gone: no arm, hand, drawer or
 * carried prop performs s2. s2 is ClosedRoomAnsweredPhoneScene, where the dark panel already standing on the
 * host stand wakes and writes Haniya beside the server's apron on its hook, then answers the phone that has rung
 * since s1 while the closed room goes dark around it.
 *
 * The other nine scenes keep the pictures that passed independent code review, written again here in another
 * shape: one table of placements per shot, one cue sheet keyed by scene, drawing parts as components with
 * explicit props, and a single switch over every registered view that checks the view belongs to the scene
 * on screen. One change is deliberate. s1's last shot in both treatments (A's blank-pad-tables and B's
 * table-wait) now hangs the server's apron on the stand's hook, at the film-global apronSwing() that s2 draws
 * too, so the apron never leaves its hook across the s1 to s2 cut.
 *
 *  s1  the storefront door shuts on its bell and the apron left on the stand's hook swings; the desk phone
 *      rattles with nobody at the stand; two tables wait, a guest raising a hand, and the pad stays blank.
 *  s2  see ClosedRoomAnsweredPhoneScene.
 *  s3  the guest scans the table code, taps Chow mein and pays; B sees her from behind her shoulder on one
 *      jointed arm, then she talks to order into a listening sheet; B's Pay detail keeps the holding hand.
 *  s4  THE TURN. The printer idles beside a cold wok; the paid mark travels into its slot and only then the
 *      lamp answers, the ticket rises, is gripped and cut; only after it the cook pours and the flame flares.
 *  s5  the ledger card slides on; the $9,650 a month tag lands; OWNER COUNT is stamped; the receipt clip
 *      snaps shut on nothing (B on a board labelled RECEIPTS beside the large stamped card).
 *  s6  coins and notes leave the paid phone for the jar at the pass, which fills; the FOX 26 tag hooks on.
 *  s7  the federal rule card's no tip credit box draws empty; the cooks line lights; a pen circles both.
 *  s8  the restaurant folder opens on its one blank box under a question mark.
 *  s9  a customer's phone hunts the code and never scans (B an older customer whose glasses lie on the
 *      table); the quote card lands beside it.
 *  s10 the lit panel takes the order and its slip drops into the printer, which answers; owner says and no
 *      record shown settle on the jar. Held.
 *
 * Every state is a closed function of the film frame clock and the board's event and clause windows. Indoors
 * the region is the place stage's window; the film paints no full-frame background. Disclosed illustration: no
 * real restaurant, person, software, brand mark, code, payment screen, money or pay record.
 */

type Variant='a'|'b';
type XY=[number,number];

// ===================================================================================================================
// 1. MOTION VOCABULARY. Pure functions of a number; nothing accumulates between frames.
// ===================================================================================================================
const clamp01=(v:number)=>Math.min(1,Math.max(0,v));
const mixN=(a:number,b:number,p:number)=>a+(b-a)*p;
const mixXY=(a:XY,b:XY,p:number):XY=>[mixN(a[0],b[0],p),mixN(a[1],b[1],p)];
const smooth=(p:number)=>{const q=clamp01(p);return q*q*(3-2*q);};
/** Travel: zero velocity and acceleration at both ends. */
const glide=(q:number)=>{const x=clamp01(q);return x*x*x*(10+x*(-15+6*x));};
/** Contact: approaches slowly and seats without overshoot (the board's contact curve). */
const seat=(q:number)=>{const x=clamp01(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
/** Up and back down: zero at both ends with zero slope, one at the middle. */
const bump=(r:number)=>{const x=clamp01(r);return 16*x*x*(1-x)*(1-x);};
/** Something struck or let go ringing down about its pin, tau seconds after the impulse. */
const ringOut=(tau:number,amp:number,hz:number,k:number)=>tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.12);
const bezier2=(a:XY,c:XY,b:XY,u:number):XY=>{const v=clamp01(u),w=1-v;return [w*w*a[0]+2*w*v*c[0]+v*v*b[0],w*w*a[1]+2*w*v*c[1]+v*v*b[1]];};
const num=(v:number)=>v.toFixed(2);
const RAD=Math.PI/180;

// ===================================================================================================================
// 2. THE BOARD'S WINDOWS, read through one timeline object per frame.
// ===================================================================================================================
type Timeline={t:number;W:Record<string,ActionWindow>;p:(id:string)=>number;r:(id:string)=>number;start:(id:string)=>number;end:(id:string)=>number};
function timeline(W:Record<string,ActionWindow>,t:number):Timeline{
 return {t,W,
  p:id=>{const w=W[id];return w?actionProgress(w,t):0;},
  r:id=>{const w=W[id];return w?clamp01((t-w.start)/(w.end-w.start)):0;},
  start:id=>W[id]?.start??0,
  end:id=>W[id]?.end??0};
}

// ===================================================================================================================
// 3. CUE SHEETS. Each scene's moving values, evaluated only for the scene on screen.
// ===================================================================================================================
function cuesS1(T:Timeline){
 return {door:1-T.p('s1-event-1'),
  bell:ringOut(T.t-T.start('s1-event-1'),9,2.4,1.8)+ringOut(T.t-T.end('s1-event-1'),16,2.6,1.6),
  apron:apronSwing(T.W,T.t),walk:clamp01(T.t/1.25),ring:phoneRing(T.W,T.t),
  curl:bump(T.r('s1-event-3')),wait:T.p('s1-event-3'),minute:300+6*T.p('s1-event-3')};
}
function cuesS3(T:Timeline){
 const tap=T.r('s3-event-3'),pay=T.r('s3-event-4');
 return {lift:T.p('s3-event-1'),lock:smooth((T.r('s3-event-1')-.78)/.2),menu:T.p('s3-event-2'),
  tapGo:glide(tap/.4),tapPress:seat((tap-.36)/.14)*(1-glide((tap-.74)/.2)),tapBack:glide((tap-.74)/.26),
  lit:smooth((tap-.48)/.12),ripple:tap>.48&&tap<.86?clamp01((tap-.48)/.38):0,
  payGo:glide(pay/.38),payPress:seat((pay-.34)/.14)*(1-glide((pay-.72)/.2)),payBack:glide((pay-.72)/.28),
  pay:smooth((pay-.48)/.36),payRipple:pay>.48&&pay<.86?clamp01((pay-.48)/.38):0};
}
type CuesS3=ReturnType<typeof cuesS3>;
/** The turn in order: the paid mark lands at 97 percent of its carry; the ticket prints from then (never before
 * s4-event-3 opens), is gripped at 56 percent and cut at 72 percent of what is left; the cook pours and flares
 * through s4-event-4 and shakes the pan after it. */
function cuesS4(T:Timeline){
 const {t,W}=T,carry=W['s4-event-2'],ticket=W['s4-event-3'],cook=W['s4-event-4'];
 const landed=carry?carry.start+.97*(carry.end-carry.start):Infinity;
 const printAt=ticket?Math.max(ticket.start,landed):Infinity,left=ticket?ticket.end-printAt:1;
 const gripAt=printAt+.56*left,cutAt=printAt+.72*left;
 const cookR=T.r('s4-event-4'),cookEnd=cook?cook.end:Infinity,since=t-cookEnd-.08;
 const shake=since>0?Math.sin(2*Math.PI*2.4*since)*smooth(since/.15):0,food=smooth((cookR-.25)/.5);
 return {standby:.5+.5*Math.sin(2*Math.PI*t/1.3),r2:T.r('s4-event-2'),token:T.p('s4-event-2'),
  tokenR:1-smooth((T.r('s4-event-2')-.84)/.13),line:smooth(T.r('s4-event-2')/.2),
  led:carry?smooth((t-landed)/.12):0,
  print:t>printAt?smooth((t-printAt)/(gripAt-printAt)):0,cut:t>gripAt?smooth((t-gripAt)/(cutAt-gripAt)):0,
  hang:ticket?ringOut(t-cutAt,2.6,1.5,2.4):0,
  flame:T.p('s4-event-4'),food,pour:clamp01((cookR-.15)/.6),
  bowlTilt:72*glide(cookR/.4)*(1-glide((t-cookEnd)/.3)),bowlLeft:1-smooth((cookR-.15)/.55),
  bowlAway:cook?glide((t-cookEnd)/.4):0,panTilt:7*shake,
  toss:food*Math.max(0,Math.sin(2*Math.PI*2.4*since-1.1))*(since>0?smooth(since/.15):0)};
}
/** A's stamp seen side on, unclamped in its window so it waits before and is gone after: down in the first 30
 * percent, pressed on the contact curve, inked at half way, lifted and away. */
function sidePress(w:ActionWindow|undefined,t:number){
 if(!w)return {come:0,lift:1,inked:0,away:0};
 const r=(t-w.start)/(w.end-w.start);
 const press=r<.3?0:r<.5?seat((r-.3)/.2):r<.62?1:1-glide((r-.62)/.2);
 return {come:glide(r/.3),lift:1-press,inked:r>=.5?1:0,away:glide((r-.74)/.26)};
}
/** B's stamp from above: down on the contact curve in the first 22 percent, inked at 24, lifted from 38 percent
 * back toward the desk's near edge, braking to rest as the shot ends. */
function topPress(w:ActionWindow|undefined,t:number){
 if(!w)return {come:0,press:0,inked:0,lift:0};
 const r=(t-w.start)/(w.end-w.start);
 return {come:seat(r/.22),press:bump((r-.2)/.16),inked:r>=.24?1:0,lift:glide((r-.38)/.57)};
}
function cuesS5(T:Timeline){
 const clip=T.W['s5-event-4'],len=clip?clip.end-clip.start:1;
 return {slide:T.p('s5-event-1'),tag:T.p('s5-event-2'),side:sidePress(T.W['s5-event-3'],T.t),top:topPress(T.W['s5-event-3'],T.t),
  clip:bump(T.r('s5-event-4')),wob:clip?ringOut(T.t-(clip.start+.5*len),3,1.8,3):0};
}
function cuesS6(T:Timeline){
 return {fill:.1+.62*T.p('s6-event-2'),tag:T.p('s6-event-3'),settle:ringOut(T.t-T.end('s6-event-3'),9,1.1,2.2),
  carry:Math.sin(Math.PI*T.p('s6-event-3'))};
}
function cuesS7(T:Timeline){
 const pen=T.r('s7-event-3');
 return {slide:T.p('s7-event-1'),box:smooth((T.r('s7-event-1')-.55)/.4),lit:T.p('s7-event-2'),
  penGo:glide(pen/.2),circle:smooth((pen-.2)/.68),penLift:glide((pen-.9)/.1)};
}
/** The question mark has its own window when the board splits it out (s8-event-3), else it takes the second half
 * of the opening. */
function cuesS8(T:Timeline){
 const r=T.r('s8-event-2'),own=!!T.W['s8-event-3'];
 return {slide:T.p('s8-event-1'),open:own?T.p('s8-event-2'):smooth(r/.6),q:own?T.p('s8-event-3'):smooth((r-.55)/.35)};
}
function cuesS9(T:Timeline){
 const r=T.r('s9-event-1'),up=glide(r/.32),down=glide((r-.56)/.3),hold=r>.32&&r<.56?Math.sin(Math.PI*(r-.32)/.24):0;
 return {up:up*(1-down),waver:2.5*hold*Math.sin(2*Math.PI*1.6*T.t),quote:T.p('s9-event-2'),dim:.85*T.p('s9-event-3')};
}
/** The panel takes the card in its window's first 40 percent; the slip leaves at 38 percent and reaches the
 * printer's slot at 90 percent, and only then the lamp answers and that order's ticket rises, is gripped, cut. */
function cuesS10(T:Timeline){
 const {t}=T,w=T.W['s10-event-1'],r=T.r('s10-event-1');
 const arrive=w?w.start+.9*(w.end-w.start):Infinity;
 return {order:smooth(r/.4),ping:bump(clamp01((r-.3)/.4)),slip:glide((r-.38)/.52),
  led:w?smooth((t-arrive)/.12):0,print:t>arrive?smooth((t-arrive)/.6):0,cut:t>arrive+.6?smooth((t-arrive-.6)/.18):0,
  hang:w?ringOut(t-(arrive+.78),2.6,1.5,2.4):0,standby:.5+.5*Math.sin(2*Math.PI*t/1.3),
  tag1:T.p('s10-event-2'),settle1:ringOut(t-T.end('s10-event-2'),9,1.1,2.2),carry1:Math.sin(Math.PI*T.p('s10-event-2')),
  tag2:T.p('s10-event-3'),settle2:ringOut(t-T.end('s10-event-3'),6,1,2.4),carry2:Math.sin(Math.PI*T.p('s10-event-3'))};
}
/** Seven coins and notes: each leaves the paid screen across s6-event-1 and reaches the jar's mouth across
 * s6-event-2, then drops onto the pile as it stood when that piece landed. */
const COIN_COUNT=7;
function coinFlight(W:Record<string,ActionWindow>,t:number,i:number){
 const out=W['s6-event-1'],land=W['s6-event-2'];
 if(!out||!land)return {u:0,drop:0,restFill:0,launched:false};
 const k=i/(COIN_COUNT-1),t0=out.start+.7*k*(out.end-out.start),t1=land.start+.75*k*(land.end-land.start);
 return {u:clamp01((t-t0)/(t1-t0)),drop:clamp01((t-t1)/.22),restFill:.1+.62*actionProgress(land,t1+.22),launched:t>=t0};
}

// ===================================================================================================================
// 4. SHOT PLACEMENTS (screen pixels). One record per shot; a 'view:variant' record wins over a bare 'view' one.
// ===================================================================================================================
type Place={x:number;y:number;s:number;r?:number;flip?:boolean};
type HeldPlace=Place&{held:boolean;from?:XY};
type Sheet={x:number;y:number;s:number;fy:number;r?:number};
type Shelf={x:number;y:number;w:number};
type Arc={src?:XY;ctrl:XY};
type Frame={stand?:Place;phone?:HeldPlace;printer?:Place;shelf?:Shelf;wok?:Place;ledger?:Sheet;jar?:Place;arc?:Arc;
 rule?:Sheet;folder?:Sheet;quote?:Sheet;panel?:Place};
const FRAMES:Record<string,Frame>={
 // s1
 'door-apron':{stand:{x:800,y:1330,s:1}},
 'host-phone:a':{stand:{x:560,y:1900,s:2}},
 'host-phone:b':{stand:{x:560,y:1340,s:1.05}},
 'blank-pad-tables':{stand:{x:960,y:1500,s:1.15}},
 'table-wait':{stand:{x:300,y:1880,s:1.9}},
 // s3
 'code-scan:a':{phone:{x:690,y:830,s:.72,r:-3,held:true,from:[620,1720]}},
 'code-scan:b':{phone:{x:600,y:720,s:.78,r:-8,held:true,from:[300,1560]}},
 'menu-tap:a':{phone:{x:520,y:760,s:1.5,r:0,held:true}},
 'menu-tap:b':{phone:{x:650,y:800,s:.72,r:12,held:true}},
 'pay-mark:a':{phone:{x:500,y:720,s:1.05,r:0,held:true}},
 'paid-close:b':{phone:{x:540,y:260,s:2.4,r:0,held:true}},
 // s4
 'printer-idle':{printer:{x:330,y:1000,s:1.1},shelf:{x:60,y:1000,w:600},wok:{x:820,y:1110,s:.85,flip:true}},
 'pass-wide':{printer:{x:230,y:940,s:.72},shelf:{x:40,y:940,w:440},wok:{x:780,y:1100,s:.85,flip:true}},
 'paid-line:a':{phone:{x:250,y:760,s:.62,r:8,held:true},printer:{x:760,y:1150,s:1.3},shelf:{x:380,y:1150,w:760}},
 'ticket-print:a':{printer:{x:520,y:1440,s:2.2}},
 'ticket-print:b':{printer:{x:470,y:1290,s:1.6},shelf:{x:120,y:1290,w:980},wok:{x:1100,y:1250,s:1,flip:true}},
 'wok-flare':{printer:{x:250,y:900,s:.78},shelf:{x:50,y:900,w:480},wok:{x:740,y:1090,s:1,flip:true}},
 'flame-close':{printer:{x:240,y:837,s:1.4},shelf:{x:-20,y:837,w:720},wok:{x:600,y:1180,s:1.7,flip:true}},
 // s5
 'ledger-slide':{ledger:{x:250,y:940,s:1.25,fy:.55,r:-3}},
 'ledger-tag':{ledger:{x:90,y:760,s:1.9,fy:.6,r:-2}},
 'owner-stamp:a':{ledger:{x:150,y:510.8,s:2.2,fy:.62}},
 'empty-clip':{ledger:{x:120,y:1090,s:.95,fy:.5,r:-4}},
 'desk-ledger':{ledger:{x:210,y:560,s:1.5,fy:1,r:-2}},
 'ledger-corner':{ledger:{x:-20,y:398,s:2.2,fy:1}},
 'owner-stamp:b':{ledger:{x:-20,y:398,s:2.2,fy:1}},
 'clip-bench':{ledger:{x:60,y:860,s:1.75,fy:.84,r:-2}},
 // s6
 'coins-drop:a':{phone:{x:250,y:620,s:.62,r:12,held:true},shelf:{x:300,y:1060,w:700},wok:{x:990,y:1150,s:.7,flip:true},
  jar:{x:720,y:1060,s:1},arc:{ctrl:[540,500]}},
 'jar-fills:a':{shelf:{x:-20,y:1205,w:1120},jar:{x:560,y:1200,s:1.8},arc:{src:[-90,250],ctrl:[300,240]}},
 'jar-fills:b':{printer:{x:230,y:1040,s:.8},shelf:{x:40,y:1040,w:1000},wok:{x:960,y:1180,s:.7,flip:true},
  jar:{x:620,y:1040,s:1.25},arc:{src:[90,360],ctrl:[420,360]}},
 'jar-tag':{jar:{x:500,y:1520,s:2.5}},
 'tag-close':{jar:{x:600,y:1500,s:2.4}},
 // s7
 'rule-card:a':{rule:{x:150,y:520,s:1.5,fy:.88,r:-1.5}},
 'rule-card:b':{rule:{x:165,y:520,s:1.45,fy:1}},
 'cooks-line':{rule:{x:20,y:375,s:2,fy:.9}},
 'box-close':{rule:{x:-30,y:332,s:1.9,fy:1}},
 'circle-detail':{rule:{x:-19,y:327,s:2.15,fy:.92}},
 'pen-circle':{rule:{x:-19,y:320,s:2.15,fy:1}},
 // s8
 'blank-folder':{rule:{x:-260,y:560,s:1,fy:.88},folder:{x:330,y:600,s:1.15,fy:.88}},
 'folder-wide':{rule:{x:80,y:420,s:.95,fy:1},folder:{x:520,y:640,s:.95,fy:1}},
 'blank-box':{folder:{x:180,y:484,s:2,fy:.92}},
 'folder-close':{folder:{x:150,y:470,s:1.8,fy:1}},
 // s9
 'viewfinder-hunt:a':{phone:{x:470,y:780,s:.82,r:-8,held:true,from:[600,1330]}},
 'quote-card:a':{quote:{x:430,y:880,s:1,fy:.78,r:-2},phone:{x:150,y:1020,s:.55,r:-4,held:false}},
 'quote-side':{quote:{x:40,y:560,s:.9,fy:1,r:-3}},
 // s10
 'panel-order':{printer:{x:840,y:1060,s:.75},shelf:{x:470,y:1060,w:620},jar:{x:590,y:1060,s:.75},panel:{x:290,y:1640,s:1.22}},
 'stand-wide':{printer:{x:755,y:960,s:.62},shelf:{x:600,y:960,w:480},jar:{x:990,y:960,s:.62},panel:{x:250,y:1720,s:1.42}},
 'jar-owner-tag:a':{shelf:{x:-20,y:1235,w:1120},jar:{x:520,y:1230,s:1.75}},
 'jar-owner-tag:b':{printer:{x:220,y:1040,s:.8},shelf:{x:0,y:1040,w:1080},jar:{x:640,y:1040,s:1.25}},
 'jar-no-record':{printer:{x:1050,y:960,s:.6},shelf:{x:440,y:960,w:640},jar:{x:700,y:960,s:1},panel:{x:230,y:1230,s:.7}},
 'tags-close':{printer:{x:191,y:800,s:1.3},shelf:{x:-20,y:800,w:560},jar:{x:560,y:1380,s:2.3}},
};
function frameOf(view:string,v:Variant):Frame{
 const f=FRAMES[view+':'+v]??FRAMES[view];
 if(!f)throw new Error('No '+v+' placement for the '+view+' shot');
 return f;
}
function part<K extends keyof Frame>(f:Frame,key:K,view:string):NonNullable<Frame[K]>{
 const value=f[key];if(value===undefined)throw new Error('The '+view+' shot places no '+key);
 return value as NonNullable<Frame[K]>;
}
const ROOM_FLOOR={wide:1080,medium:1160};
/** One guest's skin for every guest hand in s3, and the holding hand's sleeve, which her shirt matches. */
const GUEST_SKIN=HP.skin[4],GUEST_SHIRT='#3D5566',WRITER_SKIN=HP.skin[1],COOK_SKIN=HP.skin[3];
/** The footprints on B's floor plan, from the stand out through the door. */
const PLAN_PRINTS:XY[]=[[300,830],[240,860],[190,890],[150,915],[90,940],[40,965]];
/** B's over-the-shoulder tap: the base of her neck, the finger's scale and the ready pose's offset from hover in
 * degrees (shoulder, elbow); the listening sheet in screen units and where her voice leaves her head. */
const OVER_SHOULDER={guest:[270,1060] as XY,finger:.75,ready:[20,10] as XY};
const TALK_SHEET={top:300,mic:84,r:38},VOICE_FROM:XY=[452,812];
/** B's paid-line push-in from above: the zoom it reaches on the printer and where the slot then sits. */
const PLAN_PUSH={zoom:4.4,anchor:[540,700] as XY};
/** B's OWNER COUNT in card units; where the stamp waits and leaves from it; the clip shot's desk and board. */
const OWNER_MARK={x:195,y:232,rot:6,size:28};
const STAMP_PATH={from:[-30,190] as XY,exit:[80,520] as XY};
const BENCH={back:840,depth:490};
const RECEIPTS={x:575,y:520,w:330,h:380,clip:[740,387] as XY,clipS:1.7,label:{x:584,y:735,w:312,h:66,size:44}};
const ownerMarkBox=()=>({w:widthOf(STAMP_TEXT,OWNER_MARK.size,true)*1.08+34,h:OWNER_MARK.size+28});
/** B's s9: the one code stand from above and the older customer's performance poses. */
type Pose9={x:number;y:number;s:number;r:number};
const ELDER={code:[700,700] as XY,from:{x:605,y:1120,s:.72,r:18} as Pose9,aim:{x:585,y:840,s:.82,r:6} as Pose9,
 set:{x:610,y:1040,s:.6,r:12} as Pose9,rest:{x:690,y:990,s:.6,r:22} as Pose9,touch:[-30,288] as XY,back:[-110,110] as XY,
 skin:HP.skin[0],glasses:[300,935] as XY};
const KNIT={base:'#7B5C78',deep:'#5E445B',rib:'#93738F',blouse:'#EFE6D6'};
const TAGS={fox:['FOX 26 reports','all to the kitchen'],owner:['owner says'],none:['no record shown'],money:['$9,650','a month']};
type TagSpec={lines:string[];size:number;len:number;from:XY;tone:'kraft'|'cream'|'slate'};
const WOK_COLD:WokCue={flame:0,food:0,toss:0,tilt:0,hand:0},WOK_COOKING:WokCue={flame:.55,food:1,toss:0,tilt:0,hand:0};
const PAID_SCREEN:PhoneState={scan:0,lock:1,menu:1,lit:1,pay:1};
const TICKET_HUNG={len:TICKET.len,cut:1,hang:0,led:1,standby:.5,roll:1};
/** The bowl's pouring lip and where the noodles land, in wok units (the cook stands on the handle side). */
const BOWL_LIP:XY=[-40,-262],POUR_TO:XY=[6,-124];

const placePt=(L:Place,p:XY):XY=>{const a=(L.r??0)*RAD,x=L.s*(L.flip?-p[0]:p[0]),y=L.s*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
const sheetTransform=(L:Sheet)=>`translate(${num(L.x)} ${num(L.y)}) rotate(${num(L.r??0)}) scale(${L.s} ${num(L.s*L.fy)})`;
const sheetPt=(L:Sheet,p:XY):XY=>{const a=(L.r??0)*RAD,x=L.s*p[0],y=L.s*L.fy*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};

// ===================================================================================================================
// 5. SOLVERS. B's tapping arm, B's talk level and B's older customer.
// ===================================================================================================================
const rotate=(p:XY,a:number):XY=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
const wrapAngle=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
const SLEEVE_DIR=Math.atan2(FINGER_ARM.dir[1],FINGER_ARM.dir[0]);
type ArmJoint={u:number;f:number};
/** Forward: upper arm at angle u (length a) to the elbow, forearm at f (length b) to the wrist, the rigid hand's
 * sleeve axis aimed back at the elbow. */
function armForward(S:XY,a:number,b:number,fs:number,J:ArmJoint){
 const E:XY=[S[0]+a*Math.cos(J.u),S[1]+a*Math.sin(J.u)],Wr:XY=[E[0]+b*Math.cos(J.f),E[1]+b*Math.sin(J.f)];
 const th=J.f+Math.PI-SLEEVE_DIR,w=rotate(FINGER_ARM.wrist,th);
 return {E,W:Wr,th,tip:[Wr[0]-w[0]*fs,Wr[1]-w[1]*fs] as XY};
}
/** Inverse: the elbow-out pose whose fingertip lands on `tip`. The hand angle comes from a fixed scan and a fixed
 * bisection, so one tip always gives one pose. A tip the arm can't reach throws instead of being clamped short. */
function armSolve(S:XY,a:number,b:number,fs:number,tip:XY):ArmJoint{
 const pose=(th:number)=>{const w=rotate(FINGER_ARM.wrist,th),Wr:XY=[tip[0]+w[0]*fs,tip[1]+w[1]*fs];
  const dx=Wr[0]-S[0],dy=Wr[1]-S[1],span=Math.hypot(dx,dy),d=Math.min(a+b-1e-3,Math.max(Math.abs(a-b)+1e-3,span));
  const u=Math.atan2(dy,dx)+Math.acos((a*a+d*d-b*b)/(2*a*d)),E:XY=[S[0]+a*Math.cos(u),S[1]+a*Math.sin(u)];
  return {miss:wrapAngle(Math.atan2(E[1]-Wr[1],E[0]-Wr[0])-SLEEVE_DIR-th),u,f:Math.atan2(Wr[1]-E[1],Wr[0]-E[0]),reached:span===d};};
 let lo0=-Math.PI,m0=pose(lo0).miss;
 for(let step=1;step<=180;step++){
  const hi0=-Math.PI+step*Math.PI/90,m1=pose(hi0).miss;
  if(m0*m1<0&&Math.abs(m0-m1)<1){
   let lo=lo0,hi=hi0;
   for(let k=0;k<48;k++){const mid=(lo+hi)/2;if(pose(lo).miss*pose(mid).miss<=0)hi=mid;else lo=mid;}
   const found=pose((lo+hi)/2);
   if(!found.reached)throw new Error('The tapping arm cannot reach its contact without stretching');
   return {u:found.u,f:found.f};
  }
  lo0=hi0;m0=m1;
 }
 throw new Error('The tapping arm cannot reach its contact');
}
const mixJoint=(A:ArmJoint,B:ArmJoint,p:number):ArmJoint=>({u:mixN(A.u,B.u,p),f:mixN(A.f,B.f,p)});
function overShoulderArm(c:CuesS3){
 const L=FRAMES['menu-tap:b'].phone!,O=OVER_SHOULDER,row=placePt(L,screenPt(PHONE_UI.chow)),hover:XY=[row[0]+60,row[1]-50];
 const Sh:XY=[O.guest[0]+GUEST_BACK.shoulder[0],O.guest[1]+GUEST_BACK.shoulder[1]],a=GUEST_BACK.upper,b=GUEST_BACK.fore,fs=O.finger;
 const onRow=armSolve(Sh,a,b,fs,row),overRow=armSolve(Sh,a,b,fs,hover),ready={u:overRow.u+O.ready[0]*RAD,f:overRow.f+O.ready[1]*RAD};
 let J=mixJoint(mixJoint(ready,overRow,c.tapGo),onRow,c.tapPress);
 if(c.tapBack>0)J=mixJoint(J,ready,c.tapBack);
 return {...armForward(Sh,a,b,fs,J),fs,b};
}
/** B's talk inside the menu-tap shot: up as the tap lets go (60 to 85 percent of s3-event-3), held through the
 * clause and closed in the 0.4 s after it, so the menu and Pay are whole at the cut. */
function talkOpen(W:Record<string,ActionWindow>,t:number,clauseEnd:number){
 const w=W['s3-event-3'];if(!w)return 0;
 return smooth((clamp01((t-w.start)/(w.end-w.start))-.6)/.25)*(1-smooth((t-clauseEnd-.04)/.36));
}
/** B's s9: the phone's pose (one function across both shots so the match cut keeps it where it lies), the hunting
 * brackets that never close, and the flat hand's fingertip and angle. */
function elderTake(W:Record<string,ActionWindow>,t:number){
 const E=ELDER,fr=(id:string)=>{const w=W[id];return w?clamp01((t-w.start)/(w.end-w.start)):0;};
 const r1=fr('s9-event-1'),r3=fr('s9-event-3');
 const raise=glide(r1/.45),lean=bump((r1-.34)/.34),lower=glide((r1-.62)/.38),push=seat(r3/.5),back=glide((r3-.5)/.5);
 const tremor=2.2*bump((r1-.3)/.42)*Math.sin(2*Math.PI*1.6*t);
 const blend=(p:Pose9,q:Pose9,k:number):Pose9=>({x:mixN(p.x,q.x,k),y:mixN(p.y,q.y,k),s:mixN(p.s,q.s,k),r:mixN(p.r,q.r,k)});
 let p=blend(E.from,E.aim,raise);
 p={...p,x:p.x-8*lean,y:p.y-18*lean,r:p.r+tremor};
 p=blend(blend(p,E.set,lower),E.rest,push);
 const tip0=placePt(p,E.touch);
 return {phone:p,hunt:[20*Math.sin(2*Math.PI*1.3*t+.7),13*Math.sin(2*Math.PI*.9*t+1.9)] as XY,huntScale:1+.1*Math.sin(2*Math.PI*.8*t),
  tip:[tip0[0]+E.back[0]*back,tip0[1]+E.back[1]*back] as XY,handR:p.r-12-8*back,lift:clamp01((p.s-.6)/.22)};
}

// ===================================================================================================================
// 6. DRAWING PARTS, each a component with explicit props.
// ===================================================================================================================
const Item:React.FC<{id:string;children?:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const Pose:React.FC<{p:XY;s?:number;r?:number;o?:number;sx?:number;children?:React.ReactNode}>=({p,s=1,r=0,o=1,sx=1,children})=>
 <g transform={`translate(${num(p[0])} ${num(p[1])}) rotate(${r.toFixed(3)}) scale(${(s*sx).toFixed(4)} ${s.toFixed(4)})`} opacity={o}>{children}</g>;
type WokCue={flame:number;food:number;toss:number;tilt:number;hand:number;bowl?:{tilt:number;left:number;away:number;pour:number}};
type TicketState={len:number;cut:number;hang:number;led:number;standby:number;roll:number};

/** The phone at its place, held by the guest's hand, with the finger that touches it. */
const HandheldPhone:React.FC<{at:HeldPlace;screen:PhoneState;skin?:string;finger?:{tip:XY;press:number;s:number}|null}>=({at,screen,skin=GUEST_SKIN,finger})=>{
 const r=at.r??0;
 return <g data-part="phone-rig">
  <Pose p={[at.x+14*at.s,at.y+20*at.s]} s={at.s} r={r} o={.22}><rect x={-150} y={-300} width={300} height={600} rx={46} fill="#1A1410"/></Pose>
  {at.held&&<Pose p={[at.x,at.y]} s={at.s} r={r}><OrderRigHero part="handBack" skin={skin}/></Pose>}
  <Pose p={[at.x,at.y]} s={at.s} r={r}><OrderRigHero part="phone" {...screen}/></Pose>
  {at.held&&<Pose p={[at.x,at.y]} s={at.s} r={r}><OrderRigHero part="handFront" skin={skin}/></Pose>}
  {finger&&<Pose p={finger.tip} s={finger.s}><OrderRigHero part="finger" skin={skin} press={finger.press}/></Pose>}
 </g>;
};
/** B's s9 phone at its pose: the higher it is lifted the further and fainter its shadow; `hold` grips it. */
const ElderPhone:React.FC<{pose:Pose9;screen:PhoneState;hold:boolean;lift:number}>=({pose:p,screen,hold,lift})=><g data-part="elder-phone-rig">
 <Pose p={[p.x+(14+40*lift)*p.s,p.y+(20+56*lift)*p.s]} s={p.s} r={p.r} o={.22-.07*lift}><rect x={-150} y={-300} width={300} height={600} rx={46} fill="#1A1410"/></Pose>
 {hold&&<Pose p={[p.x,p.y]} s={p.s} r={p.r}><ElderGrip layer="back" skin={ELDER.skin}/></Pose>}
 <Pose p={[p.x,p.y]} s={p.s} r={p.r}><OrderRigHero part="phone" {...screen}/></Pose>
 {hold&&<Pose p={[p.x,p.y]} s={p.s} r={p.r}><ElderGrip layer="front" skin={ELDER.skin}/></Pose>}
</g>;
/** A fingertip's path for a tap: rest to hover, pressed onto the contact, then away. */
function tapTrack(contact:XY,go:number,press:number,back:number,rest:XY,away:XY):XY{
 let p=mixXY(mixXY(rest,[contact[0]+60,contact[1]-50],go),contact,press);
 if(back>0)p=mixXY(p,away,back);
 return p;
}
/** The printer with its rail, its ticket in the given state and its lamp. */
const TicketPrinter:React.FC<{at:Place;sid:string;state:TicketState}>=({at,sid,state:o})=>{
 const slot=PRINTER.slot,grip=railGrip(),held=o.len>=TICKET.len-.01,top=held?grip[1]:slot.y-o.len,nudge=held?-4*o.cut:0;
 return <Pose p={[at.x,at.y]} s={at.s} sx={at.flip?-1:1}>
  <Item id={sid+'-printer'}>
   <ellipse cx={12} cy={4} rx={150} ry={12} fill="#1A1410" opacity={.3}/>
   <OrderRigHero part="rail" roll={o.roll}/>
   <OrderRigHero part="printer" led={o.led} standby={o.standby}/>
  </Item>
  {o.len>0&&<Item id={sid+'-ticket'}><g transform={`translate(${slot.x} ${num(top)}) rotate(${num(held?o.hang:0)} 0 0) translate(${-TICKET.w/2} ${num(nudge)})`}>
   <OrderRigHero part="ticket" len={held?TICKET.len:o.len} cut={o.cut}/></g>
   {!held&&<path d={`M${slot.x-TICKET.w/2-6} ${slot.y+1}H${slot.x+TICKET.w/2+6}`} stroke="#0D0F11" strokeWidth={5}/>}</Item>}
 </Pose>;
};
const Wok:React.FC<{at:Place;sid:string;cue:WokCue;t:number}>=({at,sid,cue:w,t})=>{
 const b=w.bowl,head=b?clamp01(b.pour*2.4):0,tail=b?clamp01((b.pour-.62)/.38):0;
 const strands=b&&b.pour>0&&tail<1?[0,1,2,3].map(k=>{const p0=mixXY(BOWL_LIP,POUR_TO,tail),p1=mixXY(BOWL_LIP,POUR_TO,head),dx=(k-1.5)*12;
  return <path key={k} d={`M${num(p0[0]+dx)} ${num(p0[1])}Q${num((p0[0]+p1[0])/2+dx+10*Math.sin(t*20+k))} ${num((p0[1]+p1[1])/2)} ${num(p1[0]+dx*.6)} ${num(p1[1])}`}
   stroke={k%2?HP.noodle:'#E3CF9A'} strokeWidth={6} fill="none" strokeLinecap="round"/>;}):null;
 return <Item id={sid==='s4'?'s4-pan':sid+'-pass'}><Pose p={[at.x,at.y]} s={at.s} sx={at.flip?-1:1}>
  <OrderRigHero part="wok" flame={w.flame} food={w.food} toss={w.toss} tilt={w.tilt} hand={w.hand} t={t} skin={COOK_SKIN}/>
  {strands}
  {b&&b.away<1&&<g transform={`translate(${num(BOWL_LIP[0]-520*b.away)} ${num(BOWL_LIP[1]-420*b.away)})`}><OrderRigHero part="cookBowl" tilt={b.tilt} left={b.left} skin={COOK_SKIN}/></g>}
 </Pose></Item>;
};
const PassShelf:React.FC<{at:Shelf}>=({at})=><Pose p={[at.x,at.y]}><RestaurantSupport part="passShelf" w={at.w}/></Pose>;
/** A cabinet front under a pass shelf, down to the floor. */
const Cabinet:React.FC<{x:number;y:number;w:number}>=({x,y,w})=>{
 const doors=Array.from({length:Math.max(1,Math.floor(w/160))},(_,k)=>x+14+k*160);
 return <g data-part="cabinet">
  <rect x={x} y={y+22} width={w} height={1300-y} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
  {doors.map((dx,k)=><g key={k}><rect x={dx} y={y+46} width={140} height={240} rx={6} fill={RS.steel} stroke={RS.ink} strokeWidth={2}/>
   <rect x={dx+106} y={y+140} width={10} height={40} rx={4} fill={RS.steelDark}/></g>)}
 </g>;
};
/** A heat lamp over a pass shelf, hung 130 above the printer's rail. */
const LampRail:React.FC<{shelf:Shelf;printer:Place;inset:number;rod:number;w:number}>=({shelf,printer,inset,rod,w})=>
 <Pose p={[shelf.x+inset,placePt(printer,[0,PRINTER.rail.y])[1]-130]}><RestaurantSupport part="heatLamp" w={w} rod={rod}/></Pose>;
/** A tag on its string carried in from spec.from until it hooks on the anchor (q 1). */
const StringTag:React.FC<{id:string;anchor:XY;spec:TagSpec;q:number;swing:number;carry:number}>=({id,anchor,spec,q,swing,carry})=>{
 if(q<=0)return null;
 const p=mixXY(spec.from,anchor,q),rise=-70*carry;
 return <Item id={id}><g data-part="hanging-tag" transform={`translate(${num(p[0])} ${num(p[1]+rise*(1-q))})`}>
  <g transform={`rotate(${num(swing)})`}>
   <path d={`M0 0V${spec.len}`} stroke={RS.ink} strokeWidth={3}/>
   <g transform={`translate(0 ${spec.len})`}><RestaurantSupport part="tag" lines={spec.lines} size={spec.size} tone={spec.tone}/></g>
  </g>
  {q>=.999&&<circle r={7} fill="none" stroke={RS.ink} strokeWidth={3}/>}
 </g></Item>;
};
/** The tip jar with its pile, the pieces inside its mouth, and the pieces still flying toward it. */
const TipJar:React.FC<{at:Place;sid:string;id:string;fill:number;coins?:{W:Record<string,ActionWindow>;t:number;arc?:Arc;src?:XY}}>=({at:L,sid,id,fill,coins})=>{
 const mouth=placePt(L,[0,JAR.mouth.y]),inside:React.ReactNode[]=[],outside:React.ReactNode[]=[];
 if(coins){
  const from=coins.src??coins.arc?.src??[0,0],t=coins.t;
  for(let i=0;i<COIN_COUNT;i++){
   const f=coinFlight(coins.W,t,i);if(!f.launched)continue;
   const spread=(i%3-1)*28,note=i%4===3,spin=i*40+200*Math.min(1,f.u);
   const piece=(p:XY,s:number,r:number)=>note?<Pose key={i} p={p} s={s} r={r}><OrderRigHero part="bill" w={64}/></Pose>:
    <Pose key={i} p={p} s={s}><OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={.5+.5*Math.sin(t*9+i)}/></Pose>;
   if(f.u<1){
    const ctrl:XY=coins.arc?.ctrl??[(from[0]+mouth[0])/2,Math.min(from[1],mouth[1])-200];
    outside.push(piece(bezier2(from,ctrl,[mouth[0]+spread*L.s,mouth[1]],smooth(f.u)),mixN(.8,1,f.u)*L.s,spin));
   }else inside.push(piece([spread,mixN(JAR.mouth.y,pileTop(f.restFill)-4,f.drop*f.drop)],1,spin+120*f.drop));
  }
 }
 return <g>
  <Item id={id}><ellipse cx={L.x+10*L.s} cy={L.y+4*L.s} rx={96*L.s} ry={12*L.s} fill="#1A1410" opacity={.28}/>
   <Pose p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="back">{inside}</OrderRigHero></Pose></Item>
  {coins&&<Item id={sid+'-coins'}>{outside}</Item>}
  <Item id={id}><Pose p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="front"/></Pose></Item>
 </g>;
};
const jarTagPoint=(L:Place,i:0|1):XY=>placePt(L,JAR.tagAt[i]);
/** The s10 host panel at its place, on its pole stand. */
const PolePanel:React.FC<{at:Place;id:string;lit:number;name:number;order:number;ping?:number;t:number}>=({at,id,lit,name,order,ping=0,t})=>
 <Item id={id}><Pose p={[at.x,at.y]} s={at.s} r={at.r??0}><RestaurantSupport part="hostPanel" lit={lit} name={name} order={order} ping={ping} t={t}/></Pose></Item>;
/** The s1 host stand with the things on its top and, when given an angle, the server's apron on its hook. */
const StandWithTop:React.FC<{at:Place;apron?:number;children?:React.ReactNode}>=({at,apron,children})=>
 <Item id="s1-setting"><Pose p={[at.x,at.y]} s={at.s}><RestaurantSupport part="hostStand">
  {children}
  {apron!==undefined&&<Item id="s1-apron"><g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]}) rotate(${num(apron)}) scale(.72)`}><RestaurantSupport part="apron"/></g>
   <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><RestaurantSupport part="apronHook"/></g></Item>}
 </RestaurantSupport></Pose></Item>;
const StandPhone:React.FC<{x:number;s:number;ring:number;t:number}>=({x,s,ring,t})=>
 <Item id="s1-phone"><g transform={`translate(${x} ${STAND.top}) scale(${s})`}><RestaurantSupport part="deskPhone" ring={ring} t={t}/></g></Item>;
const StandPad:React.FC<{x:number;s:number;curl:number}>=({x,s,curl})=>
 <Item id="s1-pad"><g transform={`translate(${x} ${STAND.top+6}) scale(${s})`}><RestaurantSupport part="orderPad" curl={curl}/></g></Item>;
/** A dining table with its guest seated behind it, forearms on its top, plates, a glass and a menu tent. */
const DiningTable:React.FC<{p:XY;s:number;guest:number;raise?:number;look?:number;foods?:Food[];flipChair?:boolean;menu?:boolean}>=
 ({p,s,guest,raise=0,look=0,foods=['none','none'],flipChair,menu})=>{
 const G=GUESTS[guest%GUESTS.length],seatY=TABLE.top+130;
 return <Pose p={p} s={s}>
  <g transform="translate(-30 -10)"><RestaurantSupport part="chair" flip={flipChair}/></g>
  <g transform={`translate(0 ${seatY})`}><RestaurantSupport part="guest" layer="body" {...G} look={look}/></g>
  <RestaurantSupport part="table">
   {foods.map((f,i)=><g key={i} transform={`translate(${-90+i*150} ${TABLE.top})`}><RestaurantSupport part="plate" food={f}/></g>)}
   <g transform={`translate(110 ${TABLE.top-2})`}><RestaurantSupport part="waterGlass"/></g>
   <g transform={`translate(-150 ${TABLE.top})`}><RestaurantSupport part="menuTent"/></g>
  </RestaurantSupport>
  <g transform={`translate(0 ${seatY})`}><RestaurantSupport part="guest" layer="arms" {...G} raise={raise} menu={menu}/></g>
 </Pose>;
};
const Pendant:React.FC<{x:number;len:number}>=({x,len})=><Pose p={[x,0]}><RestaurantSupport part="pendant" len={len}/></Pose>;
const Floor:React.FC<{sid:string;y:number}>=({sid,y})=><Item id={sid+'-setting'}><RestaurantSupport part="floor" y={y} vp={540}/></Item>;
/** A laminate table top seen from the front and a little above, from row y down past the frame. */
const TableBand:React.FC<{y:number}>=({y})=><g data-part="table-band">
 <rect x={-40} y={y} width={1160} height={1960-y} fill={RS.laminate}/>
 <path d={`M-40 ${y}H1120`} stroke={RS.laminateEdge} strokeWidth={6}/>
 {[0,1,2,3,4].map(k=><path key={k} d={`M-40 ${y+60+k*90}H1120`} stroke="#FFFFFF" strokeWidth={2} opacity={.25}/>)}
 <path d={`M60 ${y+40}q300 20 700 0`} stroke="#FFFFFF" strokeWidth={8} opacity={.25} fill="none"/>
</g>;
/** The table from straight above, filling the working area. */
const TableOverhead:React.FC=()=><g data-part="table-overhead">
 <rect x={50} y={290} width={980} height={980} rx={40} fill={RS.laminate} stroke={RS.ink} strokeWidth={5}/>
 <rect x={64} y={304} width={952} height={952} rx={32} fill="none" stroke={RS.laminateEdge} strokeWidth={4}/>
 <g transform="translate(250 420)"><circle r={86} fill="#F8F4EA" stroke={RS.ink} strokeWidth={3}/><circle r={56} fill="none" stroke="#E2D9C6" strokeWidth={4}/>
  <path d="M-30 -20L14 -34L40 -12L-6 2Z" fill="#FFFFFF" stroke={RS.ink} strokeWidth={2}/></g>
 <g transform="translate(880 1080)"><circle r={36} fill={RS.glassTint} opacity={.6} stroke={RS.ink} strokeWidth={3}/><circle r={26} fill="none" stroke="#9CC4CF" strokeWidth={2}/></g>
 <path d="M170 1120L420 1000M180 1140L430 1020" stroke={RS.woodDeep} strokeWidth={8} strokeLinecap="round"/>
 <g transform="translate(860 420) rotate(12)"><rect x={-70} y={-100} width={140} height={200} rx={8} fill={RS.tile} stroke={RS.ink} strokeWidth={3}/><rect x={-50} y={-70} width={100} height={12} rx={6} fill={RS.paper} opacity={.8}/></g>
</g>;
const DeskOverhead:React.FC<{sid:string}>=({sid})=><Item id={sid+'-setting'}><RestaurantSupport part="deskTop" x={30} y={290} w={1020} h={970}/></Item>;
const DeskFront:React.FC<{sid:string;y:number;depth?:number}>=({sid,y,depth=220})=><Item id={sid+'-setting'}><RestaurantSupport part="desk" y={y} depth={depth}/></Item>;
/** A paper dropping onto a surface: raised by h pixels (or, from above, nearer the lens) and offset by `from`,
 * landing on the contact curve; its shadow travels under it and shows only in the last stretch of the fall. */
const PaperDrop:React.FC<{at:Sheet;q:number;h:number;from:XY;top:boolean;shadow:React.ReactNode;children?:React.ReactNode}>=({at:L,q,h,from,top,shadow,children})=>{
 const k=1-q,off:XY=[from[0]*k,from[1]*k-(top?0:h*k)],grow=top?1+.5*k:1+.12*k;
 const near=smooth((q-.72)/.28),sh:XY=top?[off[0]+12+24*k,off[1]+16+30*k]:[off[0]+6,from[1]*k+8];
 return <g data-part="paper-drop">
  {near>0&&<g transform={sheetTransform({...L,x:L.x+sh[0],y:L.y+sh[1]})} opacity={num(.24*near)}>{shadow}</g>}
  <g transform={`translate(${num(off[0])} ${num(off[1])})`}><g transform={`translate(${num(L.x)} ${num(L.y)}) scale(${num(grow)}) translate(${num(-L.x)} ${num(-L.y)})`}>
   <g transform={sheetTransform(L)}>{children}</g></g></g>
 </g>;
};
const tagShade=(lines:string[],size:number,p:XY,r:number)=><g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}><path d={tagPath(lines,size)} fill="#1A1410"/></g>;
/** A tag lying flat on paper, in card units, its hole at p and its string curling away. */
const flatTag=(lines:string[],size:number,p:XY,r:number)=><g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}>
 <path d="M0 0C-30 -10 -60 6 -80 -6" stroke={RS.ink} strokeWidth={3} fill="none"/>
 <RestaurantSupport part="tag" lines={lines} size={size} tone="kraft"/></g>;
/** A card's own drop shadow on its surface. */
const cardShade=(L:Sheet,dx:number,dy:number,o:number,w:number,h:number,rx=0,y0=0)=>
 <g transform={sheetTransform({...L,x:L.x+dx,y:L.y+dy})} opacity={o}><rect y={y0} width={w} height={h} rx={rx} fill="#1A1410"/></g>;

// ===================================================================================================================
// 7. B's AUTHORED PROPS, drawn in this module so the two recorded art groups keep their bytes.
// ===================================================================================================================
/** The inked OWNER COUNT on B's card, in card units: the frame worn where the rubber missed, the words whole. */
const OwnerMarkInk:React.FC=()=>{const {w,h}=ownerMarkBox(),M=OWNER_MARK;
 const gaps=Array.from({length:7},(_,i)=>({x:-w/2+18+i*(w-36)/6+10*hash(i+11),y:(i%2?1:-1)*h/2,len:8+9*hash(i+17)}));
 return <g data-part="owner-mark-b" transform={`translate(${M.x} ${M.y}) rotate(${M.rot})`}>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={9} fill="none" stroke={RS.redInk} strokeWidth={4.5}/>
  <text x={0} y={num(M.size*.36)} textAnchor="middle" fontFamily={FONT.body} fontSize={M.size} fontWeight={700} fill={RS.redInk} letterSpacing={2}>{STAMP_TEXT}</text>
  {gaps.map((m,i)=><path key={i} d={`M${num(m.x)} ${num(m.y)}h${num(m.len)}`} stroke={RS.paperLit} strokeWidth={3.2} opacity={.75}/>)}
 </g>;};
/** B's rubber stamp from above, about its face: mount, red rubber edge, knob and the index label that shows what
 * it prints, so the stamp is known before it lifts. */
const StampSeenFromAbove:React.FC=()=>{const {w,h}=ownerMarkBox(),mw=w+20,mh=h+46,ly=mh*.06,lh=mh*.36;
 return <g data-part="stamp-top-b">
  <rect x={-mw/2} y={-mh/2} width={mw} height={mh} rx={10} fill={RS.woodLit} stroke={RS.ink} strokeWidth={2.6}/>
  <path d={`M${num(-mw/2+8)} ${num(-mh/2+6)}H${num(mw/2-30)}`} stroke="#FFFFFF" strokeWidth={2} opacity={.3}/>
  <path d={`M${num(-mw/2+6)} ${num(mh/2-5)}H${num(mw/2-6)}`} stroke={RS.redInk} strokeWidth={3.5}/>
  <rect x={num(-w/2+6)} y={num(ly)} width={num(w-12)} height={num(lh)} rx={4} fill={RS.paperLit} stroke={RS.ink} strokeWidth={1.6}/>
  <text x={0} y={num(ly+lh/2+8)} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={700} fill={RS.redInk} letterSpacing={1.5}>{STAMP_TEXT}</text>
  <circle cx={0} cy={num(-mh*.2)} r={num(mh*.24)} fill={RS.wood} stroke={RS.ink} strokeWidth={2.4}/>
  <circle cx={num(-mh*.07)} cy={num(-mh*.27)} r={num(mh*.08)} fill={RS.woodLit} opacity={.8}/>
 </g>;};
/** The RECEIPTS board standing at the back of B's desk: hardboard, a printed label, worn at a corner. */
const ReceiptsBoard:React.FC=()=>{const B=RECEIPTS,Lb=B.label,tilt=`rotate(-1.2 ${Lb.x+Lb.w/2} ${Lb.y+Lb.h/2})`;
 return <g data-part="receipts-board-b">
  <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={12} fill={RS.kraftDeep} stroke={RS.ink} strokeWidth={4}/>
  <rect x={B.x+10} y={B.y+10} width={B.w-20} height={B.h-20} rx={8} fill="none" stroke={RS.kraft} strokeWidth={3} opacity={.55}/>
  {[0,1,2].map(k=><path key={k} d={`M${B.x+22} ${B.y+150+k*34+6*hash(k+31)}q${B.w*.45} ${num(-6+5*hash(k+37))} ${B.w-44} 0`} stroke={RS.kraft} strokeWidth={2} opacity={.35} fill="none"/>)}
  <path d={`M${B.x+B.w-34} ${B.y+B.h-4}l30 -26`} stroke={RS.kraft} strokeWidth={3} opacity={.6}/>
  <rect x={Lb.x} y={Lb.y} width={Lb.w} height={Lb.h} rx={6} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.4} transform={tilt}/>
  <text x={Lb.x+Lb.w/2} y={num(Lb.y+Lb.h/2+Lb.size*.36)} textAnchor="middle" fontFamily={FONT.body} fontSize={Lb.size} fontWeight={700} fill={RS.ink} transform={tilt}>RECEIPTS</text>
 </g>;};
/** B's desk front below its top edge: two drawer columns of unequal width with brass pulls, one set crooked. */
const DeskDrawerFront:React.FC<{y:number}>=({y})=>{
 const columns:XY[]=[[60,470],[505,1020]];
 const fronts=columns.flatMap(([x0,x1],i)=>[0,1].map(j=>({x0,x1,top:y+30+j*290,cx:(x0+x1)/2,tilt:i===1&&j===0?3.5:0,key:i*2+j})));
 return <g data-part="desk-drawers-b">
  {fronts.map(d=><g key={d.key}>
   <rect x={d.x0} y={d.top} width={d.x1-d.x0} height={260} rx={8} fill={RS.wood} stroke={RS.ink} strokeWidth={3}/>
   <path d={`M${d.x0+12} ${d.top+12}H${d.x1-12}`} stroke={RS.woodLit} strokeWidth={2.4} opacity={.6}/>
   <path d={`M${d.x0+16} ${d.top+250}H${d.x1-16}`} stroke={RS.woodDeep} strokeWidth={3} opacity={.5}/>
   <g transform={`rotate(${d.tilt} ${d.cx} ${d.top+92})`}><rect x={d.cx-62} y={d.top+80} width={124} height={24} rx={12} fill={RS.brass} stroke={RS.ink} strokeWidth={2.4}/>
    <path d={`M${d.cx-48} ${d.top+86}H${d.cx+30}`} stroke={RS.brassLit} strokeWidth={2.4} opacity={.8}/></g>
  </g>)}
  <path d={`M140 ${y+150}q24 6 40 -2`} stroke={RS.woodDeep} strokeWidth={3} opacity={.45} fill="none"/>
 </g>;};
/** B's listening sheet on the phone screen (screen units): a lit Talk microphone with the host's rings breathing
 * out of it and a voice level that moves while the guest speaks. */
const ListeningSheet:React.FC<{on:number;t:number}>=({on,t})=>{
 const q=clamp01(on);if(q<=0)return null;
 const T=TALK_SHEET,Wd=PHONE.screen.w,Ht=PHONE.screen.h,y0=mixN(Ht,T.top,q),cx=Wd/2,cy=y0+T.mic,R=T.r,ph=(t*1.3)%1;
 const rings=[0,1,2].map(k=>(ph+k/3)%1),bars=Array.from({length:13},(_,i)=>6+26*q*Math.abs(Math.sin(2*Math.PI*(1.9*t+.37*i+.2*hash(i+5)))));
 return <g data-part="talk-sheet-b">
  <path d={`M0 ${num(y0+22)}Q0 ${num(y0)} 22 ${num(y0)}H${Wd-22}Q${Wd} ${num(y0)} ${Wd} ${num(y0+22)}V${Ht-30}Q${Wd} ${Ht} ${Wd-30} ${Ht}H30Q0 ${Ht} 0 ${Ht-30}Z`} fill={RS.screenLit} stroke={RS.ink} strokeWidth={2}/>
  <rect x={cx-26} y={num(y0+10)} width={52} height={6} rx={3} fill={RS.screenGlow} opacity={.6}/>
  {rings.map((f,k)=><circle key={k} cx={cx} cy={num(cy)} r={num(R+6+44*f)} fill="none" stroke={RS.screenGlow} strokeWidth={3.5} opacity={num(.85*q*(1-f)*smooth(f/.15))}/>)}
  <circle cx={cx} cy={num(cy)} r={R} fill={RS.screenGlow} stroke={RS.ink} strokeWidth={2.4}/>
  <rect x={cx-10} y={num(cy-24)} width={20} height={32} rx={10} fill={RS.screenLit}/>
  <path d={`M${cx-17} ${num(cy-2)}a17 17 0 0 0 34 0M${cx} ${num(cy+15)}v9M${cx-10} ${num(cy+24)}h20`} stroke={RS.screenLit} strokeWidth={4} fill="none" strokeLinecap="round"/>
  <text x={cx} y={num(y0+156)} textAnchor="middle" fontFamily={FONT.body} fontSize={26} fontWeight={700} fill="#F4FBFC">Talk</text>
  {bars.map((h,i)=><rect key={i} x={num(cx+(i-6)*15-4)} y={num(y0+196-h/2)} width={8} height={num(h)} rx={4} fill={RS.screenGlow} opacity={.9}/>)}
 </g>;
};
/** The older customer's hand holding the phone from below, in phone units: palm and wrist behind it with a
 * wristwatch, a blouse cuff and a ribbed knit cardigan sleeve (`back`), and three curled fingertips over the left
 * edge, a ring on one, with the thumb over the right edge (`front`). */
const ElderGrip:React.FC<{layer:'back'|'front';skin:string}>=({layer,skin})=>{
 const K=KNIT;
 if(layer==='back'){
  const ribs=Array.from({length:15},(_,i)=>-58+i*18);
  const stitches=Array.from({length:12},(_,i)=>[-40+(i%4)*60+14*hash(i+71),760+Math.floor(i/4)*120+10*hash(i+29)]);
  return <g data-part="elder-hand-back">
   <path d="M-158 70C-182 180 -154 290 -104 350C-82 408 -72 480 -68 560L-64 1900H204L190 560C194 452 202 360 196 284C190 206 176 146 154 112Z" fill={skin} stroke={RS.ink} strokeWidth={4}/>
   <path d="M-40 470C-12 446 62 438 128 456M-20 420q30 -10 64 -6" stroke="#000000" strokeWidth={3} opacity={.12} fill="none"/>
   <path d="M-70 526Q62 546 192 526V560Q62 580 -70 560Z" fill={RS.brass} stroke={RS.ink} strokeWidth={2.6}/>
   <circle cx={66} cy={552} r={30} fill={RS.paperLit} stroke={RS.ink} strokeWidth={3}/><circle cx={66} cy={552} r={23} fill="none" stroke={RS.brassDeep} strokeWidth={2}/>
   <path d="M66 552V534M66 552l12 6" stroke={RS.ink} strokeWidth={3} strokeLinecap="round"/>
   <path d="M-72 590H194L196 620H-72Z" fill={K.blouse} stroke={RS.ink} strokeWidth={3}/>
   <path d="M-74 616L-68 1960H216L198 616Z" fill={K.base} stroke={RS.ink} strokeWidth={4}/>
   <path d="M-73 616H198L200 700H-72Z" fill={K.rib} stroke={RS.ink} strokeWidth={3}/>
   {ribs.map((x,i)=><path key={i} d={`M${x} 622V694`} stroke={K.deep} strokeWidth={3} opacity={.55}/>)}
   {stitches.map(([x,y],i)=><path key={i} d={`M${num(x)} ${num(y)}l10 12l10 -12`} stroke={K.deep} strokeWidth={3} opacity={.35} fill="none"/>)}
  </g>;
 }
 const tips:[number,number][]=[[-34,0],[48,1],[124,2]];
 return <g data-part="elder-hand-front">
  {tips.map(([y,i])=><g key={i}>
   <path d={`M-200 ${y+30}C-202 ${y} -178 ${y-10} -146 ${y-6}C-124 ${y-2} -118 ${y+24} -128 ${y+42}C-142 ${y+58} -186 ${y+60} -200 ${y+30}Z`} fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
   <path d={`M-140 ${y+4}q8 10 2 24`} stroke="#FFFFFF" strokeWidth={2.4} opacity={.3} fill="none"/>
   <path d={`M-190 ${y+10}q7 7 5 18M-182 ${y+8}q6 6 5 16`} stroke={RS.ink} strokeWidth={2} opacity={.4} fill="none"/>
   {i===1&&[[10,RS.ink],[6,RS.brass]].map(([wd,col],j)=><path key={j} d={`M-170 ${y-6}C-163 ${y+14} -163 ${y+36} -170 ${y+56}`} stroke={col as string} strokeWidth={wd as number} fill="none"/>)}
  </g>)}
  <path d="M200 240C212 178 192 112 164 70C150 48 128 56 128 80C128 116 140 158 150 200Z" fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
  <path d="M138 86q-2 -12 10 -10M150 150q12 4 20 -2" stroke={RS.ink} strokeWidth={2} opacity={.35} fill="none"/>
 </g>;
};
/** The same customer's right hand flat on the table from above, fingertips at the origin pointing up: a ring on the
 * ring finger, the wristwatch, the blouse cuff and the ribbed sleeve running out of frame. */
const ElderFlatHand:React.FC<{skin:string}>=({skin})=>{const K=KNIT;
 const fingers:[number,number,number,number,number][]=[[-52,14,112,30,-7],[-17,0,110,31,-2],[19,9,110,30,3],[53,40,108,26,9]];
 const stitches=Array.from({length:6},(_,i)=>[-70+(i%3)*70+12*hash(i+83),420+Math.floor(i/3)*130]);
 return <g data-part="elder-hand-flat">
  <path d="M-98 318L-130 900H172L134 318Z" fill={K.base} stroke={RS.ink} strokeWidth={4}/>
  {stitches.map(([x,y],i)=><path key={i} d={`M${num(x)} ${y}l10 12l10 -12`} stroke={K.deep} strokeWidth={3} opacity={.35} fill="none"/>)}
  <path d="M-94 278H130L136 330H-100Z" fill={K.rib} stroke={RS.ink} strokeWidth={3}/>
  {Array.from({length:12},(_,i)=><path key={i} d={`M${-84+i*19} 284V325`} stroke={K.deep} strokeWidth={3} opacity={.55}/>)}
  <path d="M-80 264H118L122 282H-84Z" fill={K.blouse} stroke={RS.ink} strokeWidth={2.4}/>
  <path d="M-70 196C-104 180 -126 146 -130 112C-132 92 -112 86 -102 100C-92 118 -80 148 -58 166Z" fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
  {fingers.map(([x,tip,base,w,lean],i)=><g key={i} transform={`rotate(${lean} ${x} ${base})`}>
   <rect x={x-w/2} y={tip} width={w} height={base-tip} rx={w/2} fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
   <rect x={x-w/2+6} y={tip+5} width={w-12} height={18} rx={7} fill="#F4E3D6" opacity={.5}/>
   <path d={`M${x-w/2+6} ${num(tip+(base-tip)*.42)}q${w/2-6} 6 ${w-12} 0M${x-w/2+7} ${num(tip+(base-tip)*.5)}q${w/2-7} 5 ${w-14} 0`} stroke={RS.ink} strokeWidth={1.8} opacity={.4} fill="none"/>
   {i===2&&<rect x={x-w/2-2} y={70} width={w+4} height={10} rx={3} fill={RS.brass} stroke={RS.ink} strokeWidth={1.8}/>}
  </g>)}
  <path d="M-74 104C-86 150 -82 206 -72 268H114C122 208 118 150 104 98C78 84 -42 84 -74 104Z" fill={skin} stroke={RS.ink} strokeWidth={4}/>
  {[-52,-17,19,53].map((x,i)=><path key={i} d={`M${x-10} ${104+(i===3?4:0)}q10 -8 20 0`} stroke={RS.ink} strokeWidth={2} opacity={.35} fill="none"/>)}
  <path d="M-30 252C-20 206 -24 166 -12 126M30 254C26 212 36 172 30 128" stroke="#000000" strokeWidth={3} opacity={.1} fill="none"/>
  <path d="M-72 232Q22 246 116 232V262Q22 276 -72 262Z" fill={RS.brass} stroke={RS.ink} strokeWidth={2.4}/>
  <circle cx={24} cy={248} r={22} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.6}/>
  <path d="M24 248V234M24 248l9 5" stroke={RS.ink} strokeWidth={2.6} strokeLinecap="round"/>
 </g>;};
/** Folded reading glasses on the table, from above. */
const ReadingGlasses:React.FC=()=><g data-part="reading-glasses">
 <ellipse cx={8} cy={30} rx={84} ry={14} fill="#1A1410" opacity={.16}/>
 <path d="M-72 -16L58 -8M74 -12L-52 -2" stroke={RS.walnut} strokeWidth={5} strokeLinecap="round"/>
 {[-80,8].map((x,i)=><g key={i}><rect x={x} y={-24} width={72} height={48} rx={18} fill={RS.glassTint} opacity={.6}/>
  <rect x={x} y={-24} width={72} height={48} rx={18} fill="none" stroke={RS.walnut} strokeWidth={6}/>
  <path d={`M${x+14} -12l18 -4`} stroke="#FFFFFF" strokeWidth={3} opacity={.55} strokeLinecap="round"/></g>)}
 <path d="M-8 -4q8 -9 16 0" stroke={RS.walnut} strokeWidth={5} fill="none"/>
</g>;

// ===================================================================================================================
// 8. EVERY SHOT. One switch over every registered view; a view drawn under the wrong scene throws.
// ===================================================================================================================
const VIEW_SCENE:Record<string,string>={
 'door-apron':'s1','host-phone':'s1','blank-pad-tables':'s1','floor-plan':'s1','table-wait':'s1',
 'closed-stand':'s2','host-panel':'s2','closed-room':'s2',
 'code-scan':'s3','menu-tap':'s3','pay-mark':'s3','paid-close':'s3',
 'printer-idle':'s4','pass-wide':'s4','paid-line':'s4','ticket-print':'s4','wok-flare':'s4','flame-close':'s4',
 'ledger-slide':'s5','desk-ledger':'s5','ledger-tag':'s5','ledger-corner':'s5','owner-stamp':'s5','empty-clip':'s5','clip-bench':'s5',
 'coins-drop':'s6','jar-fills':'s6','jar-tag':'s6','tag-close':'s6','pass-overhead':'s6',
 'rule-card':'s7','cooks-line':'s7','box-close':'s7','circle-detail':'s7','pen-circle':'s7',
 'blank-folder':'s8','folder-wide':'s8','blank-box':'s8','folder-close':'s8',
 'viewfinder-hunt':'s9','quote-card':'s9','quote-side':'s9',
 'panel-order':'s10','stand-wide':'s10','jar-owner-tag':'s10','jar-no-record':'s10','tags-close':'s10',
};
type ShotEnv={view:string;sid:string;v:Variant;t:number;W:Record<string,ActionWindow>;board:FilmRenderProps['board'];shot:FilmRenderProps['shot']};

function drawShot(e:ShotEnv):React.ReactNode{
 const {view,sid,v,t,W}=e;
 if(VIEW_SCENE[view]!==sid)throw new Error('The closed-room film does not draw '+view+' in '+sid);
 const T=timeline(W,t);
 switch(view){
 // ---- s1: the walkout and the unanswered phone ---------------------------------------------------------------
 case 'door-apron':{
  // A, medium. The door shuts on its hinge with the bell ringing while the apron left on the stand's hook swings;
  // the phone sits silent.
  const c=cuesS1(T),F=frameOf(view,v);
  return <g><Floor sid={sid} y={ROOM_FLOOR.medium}/><Pendant x={600} len={300}/>
   <Item id="s1-door"><Pose p={[90,ROOM_FLOOR.medium]}><RestaurantSupport part="door" open={c.door} bell={c.bell}/></Pose></Item>
   <StandWithTop at={part(F,'stand',view)} apron={c.apron}><g><StandPad x={-85} s={.8} curl={0}/><StandPhone x={70} s={.9} ring={0} t={t}/></g></StandWithTop></g>;}
 case 'host-phone':{
  // A close / B medium. The desk phone on the empty stand rings, rattling in its cradle, its lamp blinking and ring
  // marks pulsing; the blank pad lies beside it and no one answers.
  const c=cuesS1(T),F=frameOf(view,v),close=v==='a';
  return <g>{!close&&<Floor sid={sid} y={ROOM_FLOOR.medium}/>}{!close&&<Pendant x={610} len={320}/>}
   {!close&&<Item id="s1-door"><Pose p={[-150,ROOM_FLOOR.medium]}><RestaurantSupport part="door" open={0} bell={c.bell}/></Pose></Item>}
   <StandWithTop at={part(F,'stand',view)} apron={c.apron}><g><StandPad x={close?-110:-95} s={close?1:.8} curl={0}/><StandPhone x={60} s={1} ring={c.ring} t={t}/></g></StandWithTop></g>;}
 case 'blank-pad-tables':{
  // A, wide, the last s1 shot. Two tables wait under the pendants, a guest raising a hand toward the stand; the pad
  // curls its top sheet and lets it fall back blank while the phone rings; the server's apron hangs on the stand's
  // hook at the same swing s2 continues.
  const c=cuesS1(T),F=frameOf(view,v);
  return <g><Floor sid={sid} y={ROOM_FLOOR.wide}/>
   <Item id="s1-setting"><Pose p={[540,360]}><RestaurantSupport part="clock" r={46} minute={c.minute} hour={124}/></Pose></Item>
   <Pendant x={330} len={330}/><Pendant x={690} len={300}/>
   <Item id="s1-tables"><DiningTable p={[330,1180]} s={.62} guest={0} look={-.4*c.wait}/><DiningTable p={[680,1220]} s={.7} guest={1} raise={c.wait} look={.8*c.wait} flipChair menu/></Item>
   <StandWithTop at={part(F,'stand',view)} apron={c.apron}><g><StandPad x={-60} s={1.15} curl={c.curl}/><StandPhone x={110} s={.9} ring={c.ring} t={t}/></g></StandWithTop></g>;}
 case 'floor-plan':{
  // B, overhead. The room as a plan: the door leaf swings shut along its arc with its bell ringing, footprints lead
  // from the stand out through the door, the apron swings beside the stand, two tables wait and the pass holds an
  // idle printer and an empty jar.
  const c=cuesS1(T),fade=1-.5*smooth((t-1.8)/.6);
  return <g>
   <Item id="s1-setting"><RestaurantSupport part="roomPlan" door={c.door}/></Item>
   <Item id="s1-door"><g transform={`translate(${DOOR_PLAN.hinge[0]} ${DOOR_PLAN.hinge[1]-DOOR_PLAN.len-14})`}>
    <circle r={10} fill={RS.brass} stroke={RS.ink} strokeWidth={2}/>
    {[0,1].map(i=><path key={i} d={`M${16+i*12} -14q10 14 0 28`} stroke={RS.ink} strokeWidth={3} fill="none" opacity={num(Math.min(1,Math.abs(c.bell)/8)*(1-i*.4))}/>)}
   </g></Item>
   <Item id="s1-setting">{PLAN_PRINTS.map((p,i)=><Pose key={i} p={p} r={160} o={smooth((c.walk*1.2-i*.15)/.15)*fade}><RestaurantSupport part="footprint" flip={i%2===1}/></Pose>)}</Item>
   <Item id="s1-setting"><Pose p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></Pose>
    <Pose p={PASS_PLAN.printer} s={.36}><OrderRigHero part="printerTop"/></Pose><Pose p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={0}/></Pose></Item>
   <Item id="s1-tables">{TABLES_PLAN.map((p,i)=><g key={i}>
    <Pose p={[p[0]-120,p[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></Pose><Pose p={[p[0]+120,p[1]-10]} r={90}><RestaurantSupport part="chairTop"/></Pose>
    <Pose p={p} s={.9}><RestaurantSupport part="tableTop"/></Pose>
    <Pose p={[p[0]-120,p[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]} raise={0}/></Pose>
    {i===0&&<Pose p={[p[0]+120,p[1]-10]} r={-90}><RestaurantSupport part="guestTop" {...GUESTS[1]}/></Pose>}
   </g>)}</Item>
   <Item id="s1-apron"><Pose p={[STAND_PLAN[0]-84,STAND_PLAN[1]]} r={c.apron*.8}><rect x={-14} y={-30} width={28} height={60} rx={8} fill={RS.apron} stroke={RS.ink} strokeWidth={2.4}/></Pose></Item>
   <Pose p={STAND_PLAN}><RestaurantSupport part="standTop"/></Pose>
   <Item id="s1-phone"><Pose p={[STAND_PLAN[0]+28,STAND_PLAN[1]-8]}><rect x={-26} y={-16} width={52} height={32} rx={6} fill={RS.charcoal} stroke={RS.ink} strokeWidth={2}/></Pose></Item>
   <Item id="s1-pad"><Pose p={[STAND_PLAN[0]-30,STAND_PLAN[1]+12]}><rect x={-20} y={-26} width={40} height={52} rx={3} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2}/></Pose></Item>
  </g>;}
 case 'table-wait':{
  // B, close, the last s1 shot. The pad fills the foreground, its top sheet curling and falling back blank; behind
  // it the tables wait and a guest raises a hand toward the empty stand; the server's apron hangs on the stand's
  // hook at the same swing s2 continues.
  const c=cuesS1(T),F=frameOf(view,v);
  return <g>
   <Item id="s1-tables"><DiningTable p={[1010,1250]} s={.6} guest={2} look={-.6}/><DiningTable p={[760,1350]} s={.95} guest={1} raise={c.wait} look={-.9*c.wait} flipChair menu/></Item>
   <StandWithTop at={part(F,'stand',view)} apron={c.apron}><g><StandPad x={0} s={1} curl={c.curl}/><StandPhone x={-170} s={.8} ring={c.ring} t={t}/></g></StandWithTop></g>;}

 // ---- s2: the closed room, the panel and the answered phone --------------------------------------------------
 case 'closed-stand':   // n2a: the panel already on the stand wakes and writes Haniya beside the hanging apron
 case 'host-panel':     // n2b: the ringing phone stops and its lamp holds steady in the panel's light
 case 'closed-room':    // n2b: the pendant goes out over the closed room; the panel and the lamp stay lit
  return <ClosedRoomAnsweredPhoneScene view={view as ClosedRoomView} variant={v} W={W} t={t} shot={e.shot}/>;

 // ---- s3: scan, tap, pay ---------------------------------------------------------------------------------------
 case 'code-scan':{
  // A close: the hand lifts the phone over the table code; the brackets close and lock; the menu slides up.
  // B overhead: the same from straight above the table.
  const c=cuesS3(T),L0=part(frameOf(view,v),'phone',view),from=L0.from!;
  const L={...L0,x:mixN(from[0],L0.x,c.lift),y:mixN(from[1],L0.y,c.lift),r:mixN((L0.r??0)+14,L0.r??0,c.lift)};
  const rig=<Item id="s3-phone"><Item id="s3-menu"><HandheldPhone at={L} screen={{scan:1,lock:c.lock,menu:c.menu}}/></Item></Item>;
  return v==='a'?<g>
   <Item id="s3-setting"><TableBand y={930}/><Pose p={[150,1000]} s={1.3}><RestaurantSupport part="plate"/></Pose><Pose p={[960,1010]} s={1.2}><RestaurantSupport part="waterGlass"/></Pose></Item>
   <Item id="s3-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><Pose p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></Pose></Item>
   {rig}</g>:<g>
   <Item id="s3-setting"><TableOverhead/></Item>
   <Item id="s3-code"><Pose p={[640,760]} s={1.1}><OrderRigHero part="codeStandTop"/></Pose></Item>
   {rig}</g>;}
 case 'menu-tap':{
  const c=cuesS3(T),L=part(frameOf(view,v),'phone',view),row=placePt(L,screenPt(PHONE_UI.chow));
  const lit:PhoneState={scan:0,lock:1,menu:1,lit:c.lit,tap:c.ripple,tapAt:PHONE_UI.chow};
  if(v==='a'){
   // A detail: the menu fills the frame; a fingertip presses the Chow mein row, which lights with its price chip,
   // and lifts away; Talk sits beside Pay.
   const fs=1.3,tip=tapTrack(row,c.tapGo,c.tapPress,c.tapBack,[row[0]+520*fs,row[1]+600*fs],[row[0]+300*fs,row[1]+420*fs]);
   return <g><Item id="s3-phone"><Item id="s3-menu"><Item id="s3-dish">
    <HandheldPhone at={L} screen={lit} finger={c.tapGo>0&&c.tapBack<1?{tip,press:c.tapPress,s:fs}:null}/></Item></Item></Item></g>;
  }
  // B medium, over her shoulder: the seated guest holds the phone up in her left hand and taps the row with her
  // right on one jointed arm drawn behind her back from her own shoulder; then she talks. The listening sheet rises
  // on the screen, her ready hand waits right of it, and her voice arcs leave past her ear.
  const arm=overShoulderArm(c),G=OVER_SHOULDER.guest,look={...GUESTS[2],skin:GUEST_SKIN,shirt:GUEST_SHIRT};
  const elbow:XY=[arm.E[0]-G[0],arm.E[1]-G[1]];
  const clause=e.board.narration_picture!.clauses.find(k=>k.id==='n3b');
  const talk=talkOpen(W,t,clause?.end_s??e.shot.start_s+e.shot.duration_s-.5),ph=(t*1.3)%1,V=VOICE_FROM;
  const arcs=[0,1,2].map(n=>{const f=(ph+n/3)%1,r=24+60*f,a=32*RAD;
   return {f,d:`M${num(V[0]+r*Math.cos(a))} ${num(V[1]-r*Math.sin(a))}A${num(r)} ${num(r)} 0 0 1 ${num(V[0]+r*Math.cos(a))} ${num(V[1]+r*Math.sin(a))}`};});
  return <g>
   <Item id="s3-setting"><TableBand y={1010}/><Pose p={[1010,1060]} s={1.1}><RestaurantSupport part="waterGlass"/></Pose></Item>
   <Item id="s3-phone"><Item id="s3-menu"><Item id="s3-dish"><HandheldPhone at={L} screen={lit} skin={GUEST_SKIN}/>
    {talk>0&&<Pose p={[L.x,L.y]} s={L.s} r={L.r??0}><g transform={`translate(${PHONE.screen.x} ${PHONE.screen.y})`}><ListeningSheet on={talk} t={t}/></g></Pose>}
    <Pose p={arm.tip} s={arm.fs} r={arm.th/RAD}><OrderRigHero part="finger" skin={GUEST_SKIN} press={c.tapPress} sleeve={arm.b/arm.fs}/></Pose></Item></Item></Item>
   <Item id="s3-setting"><Pose p={G}><RestaurantSupport part="guestBack" layer="upperArm" {...look} elbow={elbow}/></Pose>
    <Pose p={G}><RestaurantSupport part="guestBack" layer="body" {...look}/></Pose></Item>
   {talk>0&&<Item id="s3-menu"><g data-part="voice-arcs-b">{arcs.map((a,n)=><g key={n} opacity={num(talk*Math.sin(Math.PI*a.f))}>
    <path d={a.d} stroke={RS.ink} strokeWidth={10} fill="none" strokeLinecap="round"/><path d={a.d} stroke={RS.screenGlow} strokeWidth={6} fill="none" strokeLinecap="round"/></g>)}</g></Item>}
  </g>;}
 case 'pay-mark':
 case 'paid-close':{
  // A close / B detail. The finger presses Pay; the button shrinks into the round red paid mark, its check drawing,
  // and Paid appears. B's detail fills the frame with the button and keeps the holding hand.
  const c=cuesS3(T),L=part(frameOf(view,v),'phone',view),pay=placePt(L,screenPt(PHONE_UI.pay)),fs=view==='pay-mark'?1:2;
  const tip=tapTrack(pay,c.payGo,c.payPress,c.payBack,[pay[0]+500*fs,pay[1]+560*fs],[pay[0]+280*fs,pay[1]+380*fs]);
  return <g><Item id="s3-phone"><Item id="s3-pay"><HandheldPhone at={L} screen={{scan:0,lock:1,menu:1,lit:1,pay:c.pay,tap:c.payRipple,tapAt:PHONE_UI.pay}}
   finger={c.payGo>0&&c.payBack<1?{tip,press:c.payPress,s:fs}:null}/></Item></Item></g>;}

 // ---- s4: payment before the flame -----------------------------------------------------------------------------
 case 'printer-idle':
 case 'pass-wide':{
  // A medium / B wide. The printer stands on the pass, its slot blank and its lamp pulsing in standby under an
  // empty rail, beside a cold wok; B's wide adds the hood over the line.
  const c=cuesS4(T),F=frameOf(view,v),sh=part(F,'shelf',view),pr=part(F,'printer',view);
  return <g><Floor sid={sid} y={1200}/>
   {view==='pass-wide'&&<Item id="s4-setting"><Pose p={[560,440]}><RestaurantSupport part="hood" w={440}/></Pose></Item>}
   <Item id="s4-setting"><LampRail shelf={sh} printer={pr} inset={30} rod={200} w={sh.w-60}/><Cabinet x={sh.x} y={sh.y} w={sh.w}/><PassShelf at={sh}/></Item>
   <TicketPrinter at={pr} sid={sid} state={{len:0,cut:0,hang:0,led:0,standby:c.standby,roll:0}}/>
   <Wok at={part(F,'wok',view)} sid={sid} cue={WOK_COLD} t={t}/></g>;}
 case 'paid-line':{
  const c=cuesS4(T);
  if(v==='a'){
   // A close: the paid mark leaves the phone and travels a dashed line into the printer's slot; at its arrival the
   // lamp turns red.
   const F=frameOf(view,v),L=part(F,'phone',view),pr=part(F,'printer',view);
   const from=placePt(L,screenPt(PHONE_UI.paidBig)),to=placePt(pr,[PRINTER.slot.x,PRINTER.slot.y]);
   const ctrl:XY=[(from[0]+to[0])/2-40,Math.min(from[1],to[1])-380],at=bezier2(from,ctrl,to,c.token);
   return <g>
    <Item id="s4-setting"><PassShelf at={part(F,'shelf',view)}/></Item>
    <TicketPrinter at={pr} sid={sid} state={{len:0,cut:0,hang:0,led:c.led,standby:c.standby,roll:0}}/>
    <HandheldPhone at={L} screen={PAID_SCREEN}/>
    <Item id="s4-paid"><path d={`M${num(from[0])} ${num(from[1])}Q${num(ctrl[0])} ${num(ctrl[1])} ${num(to[0])} ${num(to[1])}`} stroke={HP.red} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={num(.75*c.line)}/>
     {c.tokenR>0&&c.token>0&&<Pose p={at}><OrderRigHero part="paidMark" r={34*c.tokenR}/></Pose>}</Item>
   </g>;
  }
  // B overhead: the same journey across the room's plan, from the guest's phone at the table to the printer on the
  // pass; as the mark nears it the camera follows it down, rest to rest, onto the printer seen from above.
  const T2=TABLES_PLAN[1],from:XY=[T2[0]+40,T2[1]-30],PS=.36,pr=PASS_PLAN.printer;
  const to:XY=[pr[0]+PS*PRINTER_TOP.slot[0],pr[1]+PS*PRINTER_TOP.slot[1]],ctrl:XY=[880,860],at=bezier2(from,ctrl,to,c.token);
  const u=glide((c.r2-.1)/.8),z=mixN(1,PLAN_PUSH.zoom,u),aim=mixXY([540,780],to,u),anchor=mixXY([540,780],PLAN_PUSH.anchor,u);
  return <g transform={`translate(${num(anchor[0])} ${num(anchor[1])}) scale(${z.toFixed(4)}) translate(${num(-aim[0])} ${num(-aim[1])})`}>
   <Item id="s4-setting"><RestaurantSupport part="roomPlan" door={0}/>
    <Pose p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></Pose>
    <Pose p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={.1}/></Pose>
    {TABLES_PLAN.map((q,i)=><g key={i}><Pose p={[q[0]-120,q[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></Pose>
     <Pose p={q} s={.9}><RestaurantSupport part="tableTop"/></Pose>
     <Pose p={[q[0]-120,q[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]}/></Pose></g>)}
    <Pose p={STAND_PLAN}><RestaurantSupport part="standTop"/></Pose></Item>
   <Item id="s4-printer"><Pose p={pr} s={PS}><OrderRigHero part="printerTop" led={c.led}/></Pose></Item>
   <Pose p={from} s={.2} r={-20}><OrderRigHero part="phone" {...PAID_SCREEN}/></Pose>
   <Item id="s4-paid"><path d={`M${num(from[0])} ${num(from[1])}Q${num(ctrl[0])} ${num(ctrl[1])} ${num(to[0])} ${num(to[1])}`} stroke={HP.red} strokeWidth={num(5/(.4+.6*z))} strokeDasharray={`${num(14/z)} ${num(12/z)}`} fill="none" opacity={num(.75*c.line)}/>
    {c.tokenR>0&&c.token>0&&<Pose p={at}><OrderRigHero part="paidMark" r={mixN(26,15,u)*c.tokenR}/></Pose>}</Item>
  </g>;}
 case 'ticket-print':{
  // A detail / B close. Only now the ticket rises out of the slot, top first, until the rail's bearing grips it and
  // the cutter frees it. B keeps the shelf and the cold wok beside it.
  const c=cuesS4(T),F=frameOf(view,v);
  const now={len:TICKET.len*c.print,cut:c.cut,hang:c.hang,led:c.led,standby:c.standby,roll:c.print};
  return <g>{v==='b'&&<Item id="s4-setting"><PassShelf at={part(F,'shelf',view)}/></Item>}
   {v==='b'&&<Wok at={part(F,'wok',view)} sid={sid} cue={WOK_COLD} t={t}/>}<TicketPrinter at={part(F,'printer',view)} sid={sid} state={now}/></g>;}
 case 'wok-flare':
 case 'flame-close':{
  // A wide / B detail. With the ticket hanging on the rail the cook pours the noodles from the bowl as the flame
  // flares, then shakes the pan, which tosses them.
  const c=cuesS4(T),F=frameOf(view,v),sh=part(F,'shelf',view),pr=part(F,'printer',view),wide=view==='wok-flare';
  const now={len:TICKET.len*c.print,cut:c.cut,hang:c.hang,led:c.led,standby:c.standby,roll:c.print};
  return <g>{wide&&<Floor sid={sid} y={ROOM_FLOOR.wide+160}/>}
   <Item id="s4-setting">{wide&&<LampRail shelf={sh} printer={pr} inset={20} rod={160} w={sh.w-40}/>}{wide&&<Cabinet x={sh.x} y={sh.y} w={sh.w}/>}<PassShelf at={sh}/></Item>
   <TicketPrinter at={pr} sid={sid} state={now}/>
   <Wok at={part(F,'wok',view)} sid={sid} t={t} cue={{flame:c.flame,food:c.food,toss:c.toss,tilt:c.panTilt,hand:1,bowl:{tilt:-c.bowlTilt,left:c.bowlLeft,away:c.bowlAway,pour:c.pour}}}/></g>;}

 // ---- s5: the owner's own count ----------------------------------------------------------------------------------
 case 'ledger-slide':
 case 'desk-ledger':{
  // A medium / B overhead. The ledger card, headed with the source's words and its rows ruled and empty, slides onto
  // the back office desk and settles; the bare receipt clip waits beside it.
  const c=cuesS5(T),L0=part(frameOf(view,v),'ledger',view),top=view==='desk-ledger';
  const L={...L0,x:L0.x+(1-c.slide)*(top?900:760),r:(L0.r??0)+6*(1-c.slide)};
  const card=<Item id="s5-ledger">{cardShade(L,top?10:8,top?12:10,.2,LEDGER.w,LEDGER.h)}<g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard"/></g></Item>;
  return top?<g><DeskOverhead sid={sid}/>
   <Item id="s5-setting"><Pose p={[180,400]} s={.9}><RestaurantSupport part="mug" top/></Pose></Item>
   <Item id="s5-clip"><Pose p={[900,400]} s={1.2}><RestaurantSupport part="receiptClip" top/></Pose></Item>{card}</g>:<g>
   <DeskFront sid={sid} y={880} depth={300}/>
   <Item id="s5-clip"><Pose p={[720,520]}><RestaurantSupport part="corkBoard" w={260} h={300}/></Pose><Pose p={[850,560]}><RestaurantSupport part="receiptClip"/></Pose></Item>
   <Item id="s5-setting"><Pose p={[140,1010]} s={.8}><RestaurantSupport part="mug"/></Pose></Item>{card}</g>;}
 case 'ledger-tag':
 case 'ledger-corner':{
  // A close / B close from above. The $9,650 a month tag drops onto the card and lands flat beside its header, its
  // shadow closing under it.
  const c=cuesS5(T),L=part(frameOf(view,v),'ledger',view),top=view==='ledger-corner',money=TAGS.money,tagAt=LEDGER.tag as XY;
  return <g>{top?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={700} depth={520}/>}
   <Item id="s5-ledger"><g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard"/></g>
    {c.tag>0&&<PaperDrop at={L} q={c.tag} h={top?0:420} from={top?[120,-200]:[60,0]} top={top} shadow={tagShade(money,30,tagAt,-8)}>{flatTag(money,30,tagAt,-8)}</PaperDrop>}</Item></g>;}
 case 'owner-stamp':{
  const c=cuesS5(T),L=part(frameOf(view,v),'ledger',view),money=TAGS.money,tagAt=LEDGER.tag as XY;
  if(v==='b'){
   // B, from above on the tag shot's card exactly (a true match cut). The stamp, known by its index label, comes in
   // from the desk's near edge, presses and holds, then goes back toward the near edge, braking, so OWNER COUNT
   // lies uncovered and large beside the tag before the cut.
   const p=c.top,mark=sheetPt(L,[OWNER_MARK.x,OWNER_MARK.y]),{w:mw,h:mh}=ownerMarkBox();
   const up=1-p.come,high=Math.max(up,p.lift);
   const off:XY=[STAMP_PATH.from[0]*up+STAMP_PATH.exit[0]*p.lift,STAMP_PATH.from[1]*up+STAMP_PATH.exit[1]*p.lift];
   const scale=L.s*(1+.3*up+.35*p.lift-.025*p.press);
   const shade:XY=[mark[0]+.55*off[0]+6+46*high,mark[1]+.55*off[1]+8+64*high];
   return <g><DeskOverhead sid={sid}/>
    <Item id="s5-ledger">
     <g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard"/></g>
     <g transform={sheetTransform({...L,x:L.x+12,y:L.y+16})} opacity={.24}>{tagShade(money,30,tagAt,-8)}</g>
     <g transform={sheetTransform(L)}>{p.inked>0&&<OwnerMarkInk/>}{flatTag(money,30,tagAt,-8)}</g>
    </Item>
    <Item id="s5-stamp">
     <Pose p={shade} s={L.s} r={OWNER_MARK.rot} o={.3*(1-.55*high)}><rect x={-(mw+20)/2} y={-(mh+46)/2} width={mw+20} height={mh+46} rx={10} fill="#1A1410"/></Pose>
     <Pose p={[mark[0]+off[0],mark[1]+off[1]]} s={scale} r={OWNER_MARK.rot}><StampSeenFromAbove/></Pose>
    </Item></g>;
  }
  // A, side on. The stamp comes down onto the card, presses, holds and lifts away, leaving OWNER COUNT crooked
  // beside the tag.
  const st=c.side,mark=sheetPt(L,[LEDGER.mark.x,LEDGER.mark.y]),sc=stampSize().w*L.s/132;
  const y=mark[1]-st.lift*140-(1-st.come)*900-st.away*900;
  return <g><DeskFront sid={sid} y={500} depth={760}/>
   <Item id="s5-ledger"><g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard" mark={st.inked}/>{flatTag(money,30,tagAt,-8)}</g></Item>
   <Item id="s5-stamp"><g><ellipse cx={mark[0]+10} cy={mark[1]+6} rx={num(70*sc*(1-.4*st.lift))} ry={num(14*sc*.62)} fill="#1A1410" opacity={num(.3*(1-st.lift)*st.come*(1-st.away))}/>
    <Pose p={[mark[0],y]} s={sc}><RestaurantSupport part="stamp"/></Pose></g></Item></g>;}
 case 'empty-clip':
 case 'clip-bench':{
  const c=cuesS5(T),L=part(frameOf(view,v),'ledger',view),money=TAGS.money,tagAt=LEDGER.tag as XY;
  if(view==='clip-bench'){
   // B, medium, the desk from the front and above with the region behind. The stamped card lies large at the
   // front, OWNER COUNT and the tag above the caption band; at the back the RECEIPTS board stands and its clip opens
   // and snaps shut on nothing, the board giving a little. The camera holds.
   const R=RECEIPTS,foot:XY=[R.x+R.w/2,R.y+R.h];
   return <g><DeskFront sid={sid} y={BENCH.back} depth={BENCH.depth}/>
    <Item id="s5-setting"><DeskDrawerFront y={BENCH.back+BENCH.depth}/><Pose p={[165,850]} s={.8}><RestaurantSupport part="mug"/></Pose></Item>
    <Item id="s5-clip"><ellipse cx={foot[0]+14} cy={foot[1]+2} rx={R.w*.56} ry={13} fill="#1A1410" opacity={.3}/>
     <g transform={`rotate(${num(.4*c.wob)} ${foot[0]} ${foot[1]})`}><ReceiptsBoard/>
      <Pose p={R.clip} s={R.clipS}><RestaurantSupport part="receiptClip" open={c.clip}/></Pose></g></Item>
    <Item id="s5-ledger">{cardShade(L,10,12,.22,LEDGER.w,LEDGER.h)}<g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard"/><OwnerMarkInk/>{flatTag(money,30,tagAt,-8)}</g></Item>
   </g>;
  }
  // A, medium. The receipt clip on the cork board opens and snaps shut on nothing beside the stamped card.
  return <g><DeskFront sid={sid} y={1060} depth={200}/>
   <Item id="s5-clip"><Pose p={[660,700]}><RestaurantSupport part="corkBoard" w={300} h={380}/></Pose><Pose p={[810,760]} s={1.15} r={c.wob}><RestaurantSupport part="receiptClip" open={c.clip}/></Pose></Item>
   <Item id="s5-setting"><Pose p={[600,1150]} s={.7}><RestaurantSupport part="mug"/></Pose></Item>
   <Item id="s5-ledger"><g transform={sheetTransform(L)}><RestaurantSupport part="ledgerCard" mark={1}/>{flatTag(money,30,tagAt,-8)}</g></Item></g>;}

 // ---- s6: the tips go to the kitchen ---------------------------------------------------------------------------
 case 'coins-drop':{
  // A medium. Coins and notes leave the paid phone's screen and fall in arcs toward the jar at the pass.
  const c=cuesS6(T),F=frameOf(view,v),L=part(F,'phone',view),src=placePt(L,screenPt(PHONE_UI.paidBig)),sh=part(F,'shelf',view);
  return <g><Floor sid={sid} y={ROOM_FLOOR.medium+90}/>
   <Item id="s6-pass"><Cabinet x={sh.x} y={sh.y} w={sh.w}/><PassShelf at={sh}/><Pose p={[440,sh.y]} s={.85}><RestaurantSupport part="plate" food="noodle"/></Pose></Item>
   <Wok at={part(F,'wok',view)} sid={sid} cue={WOK_COOKING} t={t}/><HandheldPhone at={L} screen={PAID_SCREEN}/>
   <TipJar at={part(F,'jar',view)} sid={sid} id="s6-jar" fill={c.fill} coins={{W,t,arc:F.arc,src}}/></g>;}
 case 'jar-fills':{
  // A close / B medium. The pieces drop through the mouth onto the pile, which rises; B keeps the printer with its
  // hanging ticket and the wok on the same pass.
  const c=cuesS6(T),F=frameOf(view,v),jar=<TipJar at={part(F,'jar',view)} sid={sid} id="s6-jar" fill={c.fill} coins={{W,t,arc:F.arc}}/>;
  return v==='a'?<g><Item id="s6-pass"><PassShelf at={part(F,'shelf',view)}/></Item>{jar}</g>:<g>
   <Floor sid={sid} y={ROOM_FLOOR.medium+90}/><Item id="s6-pass"><Cabinet x={40} y={1040} w={1000}/><PassShelf at={part(F,'shelf',view)}/></Item>
   <TicketPrinter at={part(F,'printer',view)} sid={sid} state={TICKET_HUNG}/><Wok at={part(F,'wok',view)} sid={sid} cue={WOK_COOKING} t={t}/>{jar}</g>;}
 case 'jar-tag':
 case 'tag-close':{
  // A detail / B detail. The FOX 26 tag is carried in and hooks onto the jar's neck, swings and settles.
  const c=cuesS6(T),J=part(frameOf(view,v),'jar',view),right=view==='jar-tag',hook=jarTagPoint(J,right?0:1);
  const spec:TagSpec={lines:TAGS.fox,size:46,len:70,from:right?[1160,480]:[-160,450],tone:'kraft'};
  return <g><TipJar at={J} sid={sid} id="s6-jar" fill={c.fill}/><StringTag id="s6-tag" anchor={hook} spec={spec} q={c.tag} swing={(right?-18:18)*c.carry+c.settle} carry={c.carry}/></g>;}
 case 'pass-overhead':{
  // B overhead. From above the pass the pieces slide off the paid phone at the counter's front edge and arc across
  // the steel toward the jar, their shadows trailing; the wok glows beyond.
  const c=cuesS6(T),jarAt:XY=[720,760],phoneAt:XY=[200,1000];
  const flying=Array.from({length:COIN_COUNT},(_,i)=>{const f=coinFlight(W,t,i);if(!f.launched||f.u>=1)return null;
   const u=smooth(f.u),p=mixXY([phoneAt[0]+30,phoneAt[1]-40],[jarAt[0]+(i%3-1)*20,jarAt[1]],u),hgt=Math.sin(Math.PI*u);
   return <g key={i}><Pose p={[p[0]+40*hgt,p[1]+60*hgt]} s={.9} o={.25}><circle r={20} fill="#1A1410"/></Pose>
    <Pose p={p} s={1+.7*hgt}>{i%4===3?<OrderRigHero part="bill" w={64}/>:<OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={1}/>}</Pose></g>;});
  return <g>
   <Item id="s6-pass"><rect x={-20} y={560} width={1120} height={460} fill={RS.steel}/><Pose p={[-20,560]}><RestaurantSupport part="counterTop" w={1120} h={460}/></Pose>
    <Pose p={[330,420]} s={.9}><OrderRigHero part="wokTop" flame={.7} t={t}/></Pose><Pose p={[860,560]} s={.7}><OrderRigHero part="printerTop" led={1}/></Pose></Item>
   <Item id="s6-jar"><Pose p={jarAt} s={1.3}><OrderRigHero part="jarTop" fill={c.fill}/></Pose></Item>
   <Pose p={phoneAt} s={.5} r={-10}><OrderRigHero part="phone" {...PAID_SCREEN}/></Pose>
   <Item id="s6-coins">{flying}</Item></g>;}

 // ---- s7: the federal rule ---------------------------------------------------------------------------------------
 case 'rule-card':{
  // A medium / B overhead. The federal rule card slides onto the desk and its no tip credit box draws, empty.
  const c=cuesS7(T),L0=part(frameOf(view,v),'rule',view),top=v==='b',L={...L0,x:L0.x+(1-c.slide)*900,r:(L0.r??0)+5*(1-c.slide)};
  return <g>{top?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={420} depth={820}/>}
   {top&&<Item id="s7-setting"><Pose p={[960,420]} s={.9}><RestaurantSupport part="mug" top/></Pose></Item>}
   <Item id="s7-rule">{cardShade(L,10,14,.2,RULE.w,RULE.h,10)}<g transform={sheetTransform(L)}><Item id="s7-box"><RestaurantSupport part="ruleCard" box={c.box} lit={0} circle={0}/></Item></g></Item></g>;}
 case 'cooks-line':
 case 'box-close':
 case 'circle-detail':
 case 'pen-circle':{
  const c=cuesS7(T),L=part(frameOf(view,v),'rule',view);
  const ruleCard=(box:number,lit:number,circle:number)=><Item id="s7-rule"><g transform={sheetTransform(L)}><Item id="s7-cooks"><Item id="s7-box">
   <RestaurantSupport part="ruleCard" box={box} lit={lit} circle={circle}/></Item></Item></g></Item>;
  if(view==='cooks-line'||view==='box-close'){
   // A close / B close from above. The cooks line lights beside the empty box.
   return <g>{v==='b'?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={300} depth={940}/>}{ruleCard(1,c.lit,0)}</g>;
  }
  // A detail / B detail from above. A writing hand brings its pen down and circles the lit cooks line and the box
  // together; the box stays empty and nothing is ticked.
  const start=sheetPt(L,rulePenPoint(0)),now=sheetPt(L,rulePenPoint(c.circle));
  const rest:XY=v==='a'?[1180,1400]:[-200,1400],pen=c.circle>0?now:mixXY(rest,start,c.penGo),tip:XY=[pen[0]+30*c.penLift,pen[1]-40*c.penLift];
  return <g>{v==='b'?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={260} depth={980}/>}{ruleCard(1,1,c.circle)}
   {c.penGo>0&&<Item id="s7-setting"><Pose p={tip} s={1.4} sx={v==='a'?1:-1}><RestaurantSupport part="penHand" skin={WRITER_SKIN}/></Pose></Item>}</g>;}

 // ---- s8: the restaurant's own box stays blank -----------------------------------------------------------------
 case 'blank-folder':
 case 'folder-wide':
 case 'blank-box':
 case 'folder-close':{
  const c=cuesS8(T),F=frameOf(view,v);
  const folderAt=(S:Sheet)=><g transform={sheetTransform(S)}><Item id="s8-blank"><RestaurantSupport part="folder" open={c.open} q={c.q}/></Item></g>;
  if(view==='blank-folder'||view==='folder-wide'){
   // A medium / B overhead wide. The restaurant folder slides in beside the circled rule card and settles.
   const R0=part(F,'rule',view),F0=part(F,'folder',view),S={...F0,x:F0.x+(1-c.slide)*820,r:4*(1-c.slide)};
   return <g>{view==='folder-wide'?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={420} depth={820}/>}
    <Item id="s8-rule"><g transform={sheetTransform(R0)}><RestaurantSupport part="ruleCard" box={1} lit={1} circle={1}/></g></Item>
    <Item id="s8-folder">{cardShade(S,10,14,.2,FOLDER.w,FOLDER.h+6,8,-6)}{folderAt(S)}</Item></g>;
  }
  // A detail / B close from above. The cover turns over; the one box stays blank and a question mark draws.
  return <g>{view==='folder-close'?<DeskOverhead sid={sid}/>:<DeskFront sid={sid} y={300} depth={940}/>}<Item id="s8-folder">{folderAt(part(F,'folder',view))}</Item></g>;}

 // ---- s9: not for every customer -------------------------------------------------------------------------------
 case 'viewfinder-hunt':{
  const c=cuesS9(T);
  if(v==='b'){
   // B overhead: an older customer (knit cardigan cuff, wristwatch, ring) raises her phone right over the code,
   // where its brackets hunt and never close while her hand trembles and tries a little nearer; then she lowers it
   // onto the table. Her reading glasses lie on the table from the first frame.
   const E=elderTake(W,t);
   return <g><Item id="s9-table"><TableOverhead/><Pose p={ELDER.glasses} r={-9}><ReadingGlasses/></Pose></Item>
    <Item id="s9-code"><Pose p={ELDER.code} s={1.1}><OrderRigHero part="codeStandTop"/></Pose></Item>
    <Item id="s9-phone"><ElderPhone pose={E.phone} screen={{scan:1,lock:0,menu:0,hunt:E.hunt,huntScale:E.huntScale}} hold lift={E.lift}/></Item></g>;
  }
  // A close: a hand raises the phone toward the code, pauses short of it with its frame wide and never closing, then
  // lowers it again without scanning.
  const L0=part(frameOf(view,v),'phone',view),low=L0.from!,u=c.up;
  const L={...L0,x:mixN(low[0],L0.x,u),y:mixN(low[1],L0.y,u),r:mixN((L0.r??0)+22,L0.r??0,u)+c.waver};
  return <g>
   <Item id="s9-table"><TableBand y={930}/><Pose p={[170,1010]} s={1.2}><RestaurantSupport part="plate"/></Pose><Pose p={[960,1000]} s={1.1}><RestaurantSupport part="menuTent"/></Pose></Item>
   <Item id="s9-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><Pose p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></Pose></Item>
   <Item id="s9-phone"><HandheldPhone at={L} screen={{scan:1,lock:0,menu:0,dim:.5*(1-u)}} skin={GUEST_SKIN}/></Item></g>;}
 case 'quote-card':
 case 'quote-side':{
  const c=cuesS9(T),F=frameOf(view,v),Q=part(F,'quote',view),quoteShade=<rect width={600} height={290} rx={12} fill="#1A1410"/>;
  if(view==='quote-side'){
   // B, the same overhead table: her phone lies where she set it, still hunting and unscanned, her fingertips on its
   // bottom edge while the quote card lands; in s9-event-3 she pushes it away and takes her hand back.
   const E=elderTake(W,t);
   return <g><Item id="s9-table"><TableOverhead/><Pose p={ELDER.glasses} r={-9}><ReadingGlasses/></Pose></Item>
    <Item id="s9-code"><Pose p={ELDER.code} s={1.1}><OrderRigHero part="codeStandTop"/></Pose></Item>
    <Item id="s9-phone"><ElderPhone pose={E.phone} screen={{scan:1,lock:0,menu:0,hunt:E.hunt,huntScale:E.huntScale}} hold={false} lift={0}/></Item>
    <Item id="s9-quote">{c.quote>0&&<PaperDrop at={Q} q={c.quote} h={0} from={[-160,-220]} top shadow={quoteShade}><RestaurantSupport part="quoteCard"/></PaperDrop>}</Item>
    <Item id="s9-phone"><Pose p={E.tip} r={E.handR}><ElderFlatHand skin={ELDER.skin}/></Pose></Item></g>;
  }
  // A medium: the phone lies lowered on the table, its code unscanned; the quote card lands beside it, then the
  // phone's screen times out.
  const L=part(F,'phone',view),st:PhoneState={scan:1,lock:0,menu:0,dim:.5+.5*c.dim};
  return <g>
   <Item id="s9-table"><TableBand y={860}/></Item>
   <Item id="s9-code"><Pose p={[330,1050]} s={.9}><OrderRigHero part="codeStand"/></Pose></Item>
   <Item id="s9-phone"><g><ellipse cx={L.x+6} cy={L.y+60*L.s} rx={170*L.s} ry={30*L.s} fill="#1A1410" opacity={.22}/>
    <g transform={`translate(${L.x} ${L.y}) rotate(${L.r??0}) scale(${L.s} ${(L.s*.36).toFixed(4)})`}><OrderRigHero part="phone" {...st}/></g></g></Item>
   <Item id="s9-quote">{c.quote>0&&<PaperDrop at={Q} q={c.quote} h={420} from={[140,0]} top={false} shadow={quoteShade}><RestaurantSupport part="quoteCard"/></PaperDrop>}</Item></g>;}

 // ---- s10: the panel takes the order; the tip rests on a word ----------------------------------------------------
 case 'panel-order':
 case 'stand-wide':{
  // A medium / B wide, staged in depth. The lit panel stands large at the front: in the shot's first second the Chow
  // mein order card, already paid, slides up its screen and lands with a glow; a slip leaves the card, arcs to the
  // pass and drops into the printer's slot, and only then the lamp answers and that order's ticket rises, is gripped
  // and cut. The camera eases in toward the printer from the first frame to the last, rest to rest.
  const c=cuesS10(T),F=frameOf(view,v),wide=view==='stand-wide',Pn=part(F,'panel',view),Pr=part(F,'printer',view),sh=part(F,'shelf',view);
  const cardY=PANEL.screen.y+PANEL.screen.h+24-ORDER_CARD.rise+ORDER_CARD.h*.5;
  const from=placePt(Pn,[ORDER_CARD.w/2,cardY]),to=placePt(Pr,[PRINTER.slot.x,PRINTER.slot.y]);
  const ctrl:XY=[(from[0]+to[0])/2+40,Math.min(from[1],to[1])-300],u=c.slip,slipAt=bezier2(from,ctrl,to,u);
  const slipS=mixN(Pn.s*1.15,Pr.s*1.3,smooth(u))*(1-smooth((u-.84)/.16));
  const push=glide((t-e.shot.start_s)/e.shot.duration_s),z=1+(wide?.08:.06)*push,pivot:XY=[to[0],to[1]-60];
  return <g transform={`translate(${num(pivot[0])} ${num(pivot[1])}) scale(${z.toFixed(4)}) translate(${num(-pivot[0])} ${num(-pivot[1])})`}>
   <Floor sid={sid} y={wide?ROOM_FLOOR.wide:ROOM_FLOOR.medium}/><Pendant x={wide?620:640} len={300}/>
   <Item id="s10-setting"><Cabinet x={sh.x} y={sh.y} w={sh.w}/><PassShelf at={sh}/></Item>
   <TicketPrinter at={Pr} sid={sid} state={{len:TICKET.len*c.print,cut:c.cut,hang:c.hang,led:c.led,standby:c.standby,roll:c.print}}/>
   <TipJar at={part(F,'jar',view)} sid={sid} id="s10-jar" fill={.72}/>
   <PolePanel at={Pn} id="s10-panel" lit={1} name={1} order={c.order} ping={c.ping} t={t}/>
   {u>0&&slipS>.02&&<Item id="s10-panel"><path d={`M${num(from[0])} ${num(from[1])}Q${num(ctrl[0])} ${num(ctrl[1])} ${num(to[0])} ${num(to[1])}`} stroke={RS.screenLit} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={num(.65*(1-smooth((u-.9)/.1)))}/>
    <Pose p={slipAt} s={slipS} r={-10+18*u}><rect x={-30} y={-40} width={60} height={80} rx={4} fill={HP.paper} stroke={RS.ink} strokeWidth={2.4}/>
     <circle cx={-12} cy={-22} r={8} fill={HP.red}/><rect x={2} y={-26} width={20} height={6} rx={3} fill="#8F8A80"/><rect x={-20} y={-6} width={40} height={6} rx={3} fill="#A9A397"/><rect x={-20} y={8} width={30} height={6} rx={3} fill="#A9A397"/></Pose></Item>}
  </g>;}
 case 'jar-owner-tag':{
  // A close / B medium. The owner says tag is carried in and hooks onto the full jar's neck, swinging, settling.
  const c=cuesS10(T),F=frameOf(view,v),J=part(F,'jar',view);
  const spec:TagSpec={lines:TAGS.owner,size:v==='a'?50:46,len:v==='a'?80:70,from:[1160,520],tone:'cream'};
  return <g>{v==='b'&&<Floor sid={sid} y={ROOM_FLOOR.medium+90}/>}
   <Item id="s10-setting">{v==='b'&&<Cabinet x={0} y={1040} w={1080}/>}<PassShelf at={part(F,'shelf',view)}/></Item>
   {v==='b'&&<TicketPrinter at={part(F,'printer',view)} sid={sid} state={TICKET_HUNG}/>}
   <TipJar at={J} sid={sid} id="s10-jar" fill={.72}/>
   <StringTag id="s10-tag" anchor={jarTagPoint(J,0)} spec={spec} q={c.tag1} swing={-18*c.carry1+c.settle1} carry={c.carry1}/></g>;}
 case 'jar-no-record':
 case 'tags-close':{
  // A wide / B detail, the held final image. Owner says hangs on the jar and no record shown settles beside it,
  // under it. A's wide keeps the lit panel that now takes the order; B's detail keeps the printed ticket above.
  const c=cuesS10(T),F=frameOf(view,v),J=part(F,'jar',view),wide=view==='jar-no-record',size=wide?44:52;
  const owner:TagSpec={lines:TAGS.owner,size,len:60,from:[1160,520],tone:'cream'};
  const none:TagSpec={lines:TAGS.none,size,len:wide?194:216,from:[-160,560],tone:'cream'};
  return <g>{wide&&<Floor sid={sid} y={ROOM_FLOOR.wide}/>}{wide&&<Pendant x={560} len={300}/>}
   <Item id="s10-setting">{wide&&<Cabinet x={440} y={960} w={640}/>}<PassShelf at={part(F,'shelf',view)}/></Item>
   <TicketPrinter at={part(F,'printer',view)} sid={sid} state={TICKET_HUNG}/>
   {wide&&<PolePanel at={part(F,'panel',view)} id="s10-panel" lit={1} name={1} order={1} t={t}/>}
   <TipJar at={J} sid={sid} id="s10-jar" fill={.72}/>
   <StringTag id="s10-record" anchor={jarTagPoint(J,1)} spec={none} q={c.tag2} swing={18*c.carry2+c.settle2} carry={c.carry2}/>
   <StringTag id="s10-tag" anchor={jarTagPoint(J,0)} spec={owner} q={1} swing={c.settle1} carry={0}/></g>;}
 default:throw new Error('The closed-room film has no view '+view);
 }
}

// ===================================================================================================================
// 9. THE DISCLOSURE CHIP (the scene's production_disclosure from this treatment's board, on every frame) and the
//    exported film.
// ===================================================================================================================
const CHIP={font:26,max:420,x:44,y:132,lead:32};
function wrapChip(text:string){
 const out:string[]=[];let line='';
 for(const word of text.split(' ')){const next=line?line+' '+word:word;
  if(line&&widthOf(next,CHIP.font,true)>CHIP.max){out.push(line);line=word;}else line=next;}
 if(line)out.push(line);
 return out;
}

export const ClosedRoomFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const art=useArtDirection();if(!art)throw new Error('The closed-room film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('The closed-room film must read the single film frame clock');
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const action=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const picture=drawShot({view:shot.view,sid:scene.id,v:variant,t,W,board,shot});
 const flat=art.flat_shots?.[scene.id];
 const text=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const lines=wrapChip(text),chipW=Math.max(...lines.map(l=>widthOf(l,CHIP.font,true)))+34;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={shot.view} data-framing={shot.framing} data-clause={clause?.id} data-action={action} data-variant={variant} data-scene-time={(t-scene.start_s).toFixed(3)}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{picture}</g>
  <g data-disclosure="production_disclosure">
   <rect x={CHIP.x} y={CHIP.y} width={chipW} height={lines.length*CHIP.lead+24} rx={16} fill={art.palette.paper} opacity={.93}/>
   {lines.map((l,i)=><text key={i} x={60} y={164+i*CHIP.lead} fontFamily={FONT.body} fontSize={CHIP.font} fontWeight={700} fill={art.palette.ink}>{l}</text>)}
  </g>
 </svg>;
};
