import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {OrderRigHero,HP,PHONE,PHONE_UI,screenPt,PRINTER,PRINTER_TOP,railGrip,TICKET,JAR,pileTop,FINGER_ARM,type PhoneState} from './OrderRigHero';
import {RestaurantSupport,RS,STAND,PANEL,ORDER_CARD,LEDGER,RULE,FOLDER,DOOR_PLAN,TABLES_PLAN,STAND_PLAN,PASS_PLAN,
 GUESTS,GUEST_BACK,TABLE,tagPath,stampSize,rulePenPoint,hash,STAMP_TEXT,type Food} from './RestaurantSupport';
import {StationHandoverScene,type StationView} from './StationHandoverScene';

/**
 * Who takes the order (2026-10-26, Harris County, Spring, the upper Gulf Coast). Registered under the edition's
 * route id order-pass-v1; mechanism order-pass-s2-station-handover-v1.
 *
 * The whole-scene replacement of the retired OrderPassFilm.tsx, which stays on disk unchanged as evidence and
 * is no longer imported by any renderer. Its s2 window-sign construction (a blank sign
 * frame, then a help-wanted board with an empty slot) is gone from the renderer: s2 is the station handover in
 * StationHandoverScene, where a family member's arm shuts the server's apron in the stand's drawer and sets
 * the Haniya panel on the stand, which answers the phone left ringing in s1. No window in s2 carries any sign.
 *
 * The other nine scenes keep the picture that passed independent code review, rebuilt here in a different
 * shape: one clock per scene computed only when its scene plays, one layout book per scene, a drawing kit
 * built per frame and one painter per scene.
 *
 *  s1  the storefront door shuts on its bell and the apron left on the stand's hook swings; the desk phone
 *      rattles with nobody at the stand; two tables wait, a guest raising a hand, and the pad stays blank.
 *  s2  see StationHandoverScene.
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
 * Every state is a closed function of the film clock and the board's event and clause windows. Indoors the
 * region is the place stage's window; the film paints no full-frame background. Disclosed illustration: no
 * real restaurant, person, software, brand mark, code, payment screen, money or pay record.
 */

type Variant='a'|'b';
type XY=[number,number];
const cl=(v:number)=>Math.min(1,Math.max(0,v));
const lin=(a:number,b:number,p:number)=>a+(b-a)*p;
const linXY=(a:XY,b:XY,p:number):XY=>[lin(a[0],b[0],p),lin(a[1],b[1],p)];
const hermite=(p:number)=>{const q=cl(p);return q*q*(3-2*q);};
/** Zero velocity and acceleration at both ends. */
const quintic=(q:number)=>{const x=cl(q);return x*x*x*(10+x*(-15+6*x));};
/** The board's contact curve. */
const seatEase=(q:number)=>{const x=cl(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};
/** Zero at both ends with zero slope and one in the middle: a lift that comes back down. */
const hump=(r:number)=>{const x=cl(r);return 16*x*x*(1-x)*(1-x);};
/** A struck or released thing ringing down about its pin, tau seconds after the impulse. */
const ringDown=(tau:number,amp:number,hz:number,k:number)=>tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*hermite(tau/.12);
const quadAt=(a:XY,c:XY,b:XY,u:number):XY=>{const v=cl(u),w=1-v;return [w*w*a[0]+2*w*v*c[0]+v*v*b[0],w*w*a[1]+2*w*v*c[1]+v*v*b[1]];};
const fx=(v:number)=>v.toFixed(2);
const DEG=Math.PI/180;

// ===================================================================================================================
// THE CLOCK. One reader of the board's windows, and one beat per scene, computed only when its scene is on screen.
// ===================================================================================================================
function clockOf(W:Record<string,ActionWindow>,t:number){
 return {t,W,
  P:(id:string)=>W[id]?actionProgress(W[id],t):0,
  R:(id:string)=>{const w=W[id];return w?cl((t-w.start)/(w.end-w.start)):0;},
  from:(id:string)=>W[id]?.start??0,
  to:(id:string)=>W[id]?.end??0};
}
type Clock=ReturnType<typeof clockOf>;

const beatS1=(c:Clock)=>({door:1-c.P('s1-event-1'),
 bell:ringDown(c.t-c.from('s1-event-1'),9,2.4,1.8)+ringDown(c.t-c.to('s1-event-1'),16,2.6,1.6),
 apron:ringDown(c.t+.9,16,.7,.55)+ringDown(c.t-c.to('s1-event-1'),9,.75,.9),walk:cl(c.t/1.25),
 ring:c.P('s1-event-2'),curl:hump(c.R('s1-event-3')),wait:c.P('s1-event-3'),minute:300+6*c.P('s1-event-3')});

function beatS3(c:Clock){
 const tap=c.R('s3-event-3'),pay=c.R('s3-event-4');
 return {lift:c.P('s3-event-1'),lock:hermite((c.R('s3-event-1')-.78)/.2),menu:c.P('s3-event-2'),
  tapGo:quintic(tap/.4),tapPress:seatEase((tap-.36)/.14)*(1-quintic((tap-.74)/.2)),tapBack:quintic((tap-.74)/.26),
  lit:hermite((tap-.48)/.12),ripple:tap>.48&&tap<.86?cl((tap-.48)/.38):0,
  payGo:quintic(pay/.38),payPress:seatEase((pay-.34)/.14)*(1-quintic((pay-.72)/.2)),payBack:quintic((pay-.72)/.28),
  pay:hermite((pay-.48)/.36),payRipple:pay>.48&&pay<.86?cl((pay-.48)/.38):0};
}
type BeatS3=ReturnType<typeof beatS3>;

/** The turn's order of events: the paid mark arrives at 97 percent of its travel; the ticket prints from then
 * (never before the s4-event-3 window), is gripped at 56 percent and cut at 72 percent of what remains; the cook
 * pours and flares through s4-event-4 and, after it, shakes the pan. */
function beatS4(c:Clock){
 const {t,W}=c,carry=W['s4-event-2'],ticket=W['s4-event-3'],cook=W['s4-event-4'];
 const arrive=carry?carry.start+.97*(carry.end-carry.start):Infinity;
 const printFrom=ticket?Math.max(ticket.start,arrive):Infinity,rest=ticket?ticket.end-printFrom:1;
 const gripAt=printFrom+.56*rest,cutAt=printFrom+.72*rest;
 const cookR=c.R('s4-event-4'),cookEnd=cook?cook.end:Infinity,after=t-cookEnd-.08;
 const shake=after>0?Math.sin(2*Math.PI*2.4*after)*hermite(after/.15):0,food=hermite((cookR-.25)/.5);
 return {standby:.5+.5*Math.sin(2*Math.PI*t/1.3),r2:c.R('s4-event-2'),token:c.P('s4-event-2'),
  tokenR:1-hermite((c.R('s4-event-2')-.84)/.13),line:hermite(c.R('s4-event-2')/.2),
  led:carry?hermite((t-arrive)/.12):0,
  print:t>printFrom?hermite((t-printFrom)/(gripAt-printFrom)):0,cut:t>gripAt?hermite((t-gripAt)/(cutAt-gripAt)):0,
  hang:ticket?ringDown(t-cutAt,2.6,1.5,2.4):0,
  flame:c.P('s4-event-4'),food,pour:cl((cookR-.15)/.6),
  bowlTilt:72*quintic(cookR/.4)*(1-quintic((t-cookEnd)/.3)),bowlLeft:1-hermite((cookR-.15)/.55),
  bowlAway:cook?quintic((t-cookEnd)/.4):0,panTilt:7*shake,
  toss:food*Math.max(0,Math.sin(2*Math.PI*2.4*after-1.1))*(after>0?hermite(after/.15):0)};
}
type BeatS4=ReturnType<typeof beatS4>;

/** A's stamp press, side on, within its window (unclamped, so it rests before and leaves after): down in the
 * first 30 percent, pressed on the contact curve, inked at half way, lifted and gone. */
function stampSide(w:ActionWindow|undefined,t:number){
 if(!w)return {come:0,lift:1,inked:0,away:0};
 const r=(t-w.start)/(w.end-w.start);
 const press=r<.3?0:r<.5?seatEase((r-.3)/.2):r<.62?1:1-quintic((r-.62)/.2);
 return {come:quintic(r/.3),lift:1-press,inked:r>=.5?1:0,away:quintic((r-.74)/.26)};
}
/** B's overhead press: down on the contact curve in the first 22 percent, inked at 24, lifted back from 38
 * percent toward the near edge, braking to rest as the shot ends. */
function stampOverhead(w:ActionWindow|undefined,t:number){
 if(!w)return {come:0,press:0,inked:0,lift:0};
 const r=(t-w.start)/(w.end-w.start);
 return {come:seatEase(r/.22),press:hump((r-.2)/.16),inked:r>=.24?1:0,lift:quintic((r-.38)/.57)};
}
function beatS5(c:Clock){
 const clip=c.W['s5-event-4'],span=clip?clip.end-clip.start:1;
 return {slide:c.P('s5-event-1'),tag:c.P('s5-event-2'),side:stampSide(c.W['s5-event-3'],c.t),top:stampOverhead(c.W['s5-event-3'],c.t),
  clip:hump(c.R('s5-event-4')),wob:clip?ringDown(c.t-(clip.start+.5*span),3,1.8,3):0};
}
const beatS6=(c:Clock)=>({fill:.1+.62*c.P('s6-event-2'),tag:c.P('s6-event-3'),settle:ringDown(c.t-c.to('s6-event-3'),9,1.1,2.2),
 carry:Math.sin(Math.PI*c.P('s6-event-3'))});
function beatS7(c:Clock){const pen=c.R('s7-event-3');
 return {slide:c.P('s7-event-1'),box:hermite((c.R('s7-event-1')-.55)/.4),lit:c.P('s7-event-2'),
  penGo:quintic(pen/.2),circle:hermite((pen-.2)/.68),penLift:quintic((pen-.9)/.1)};}
/** The question mark follows its own window when the board splits it out (s8-event-3), else the second half
 * of the opening. */
function beatS8(c:Clock){const r=c.R('s8-event-2'),split=!!c.W['s8-event-3'];
 return {slide:c.P('s8-event-1'),open:split?c.P('s8-event-2'):hermite(r/.6),q:split?c.P('s8-event-3'):hermite((r-.55)/.35)};}
function beatS9(c:Clock){
 const r=c.R('s9-event-1'),raise=quintic(r/.32),lower=quintic((r-.56)/.3),pause=r>.32&&r<.56?Math.sin(Math.PI*(r-.32)/.24):0;
 return {up:raise*(1-lower),waver:2.5*pause*Math.sin(2*Math.PI*1.6*c.t),quote:c.P('s9-event-2'),dim:.85*c.P('s9-event-3')};
}
/** The panel takes the card in the window's first 40 percent; the slip leaves at 38 percent and reaches the
 * printer's slot at 90 percent, and only then the lamp answers and that order's ticket rises, is gripped, cut. */
function beatS10(c:Clock){
 const {t}=c,w=c.W['s10-event-1'],r=c.R('s10-event-1');
 const arrive=w?w.start+.9*(w.end-w.start):Infinity;
 return {order:hermite(r/.4),ping:hump(cl((r-.3)/.4)),slip:quintic((r-.38)/.52),
  led:w?hermite((t-arrive)/.12):0,print:t>arrive?hermite((t-arrive)/.6):0,cut:t>arrive+.6?hermite((t-arrive-.6)/.18):0,
  hang:w?ringDown(t-(arrive+.78),2.6,1.5,2.4):0,standby:.5+.5*Math.sin(2*Math.PI*t/1.3),
  tag1:c.P('s10-event-2'),settle1:ringDown(t-c.to('s10-event-2'),9,1.1,2.2),carry1:Math.sin(Math.PI*c.P('s10-event-2')),
  tag2:c.P('s10-event-3'),settle2:ringDown(t-c.to('s10-event-3'),6,1,2.4),carry2:Math.sin(Math.PI*c.P('s10-event-3'))};
}

/** Seven coins and notes: each launches from the paid screen across s6-event-1 and reaches the jar's mouth across
 * s6-event-2, then drops onto the pile as it stood at its landing. */
const PIECES=7;
function pieceFlight(W:Record<string,ActionWindow>,t:number,i:number){
 const go=W['s6-event-1'],land=W['s6-event-2'];
 if(!go||!land)return {u:0,drop:0,restFill:0,launched:false};
 const k=i/(PIECES-1),t0=go.start+.7*k*(go.end-go.start),t1=land.start+.75*k*(land.end-land.start);
 return {u:cl((t-t0)/(t1-t0)),drop:cl((t-t1)/.22),restFill:.1+.62*actionProgress(land,t1+.22),launched:t>=t0};
}

// ===================================================================================================================
// THE LAYOUT BOOKS (screen pixels), one per scene. A row keyed 'view:variant' wins over 'view'.
// ===================================================================================================================
type Spot={x:number;y:number;s:number;r?:number;flip?:boolean};
type Sheet={x:number;y:number;s:number;fy:number;r?:number};
const spotPt=(L:Spot,p:XY):XY=>{const a=(L.r??0)*DEG,x=L.s*(L.flip?-p[0]:p[0]),y=L.s*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
const sheetMatrix=(L:Sheet)=>`translate(${fx(L.x)} ${fx(L.y)}) rotate(${fx(L.r??0)}) scale(${L.s} ${fx(L.s*L.fy)})`;
const sheetPt=(L:Sheet,p:XY):XY=>{const a=(L.r??0)*DEG,x=L.s*p[0],y=L.s*L.fy*p[1];return [L.x+x*Math.cos(a)-y*Math.sin(a),L.y+x*Math.sin(a)+y*Math.cos(a)];};
const FLOOR={wide:1080,medium:1160};

const S1_BOOK={
 stand:{'door-apron':{x:800,y:1330,s:1},'host-phone:a':{x:560,y:1900,s:2},'blank-pad-tables':{x:960,y:1500,s:1.15},
  'host-phone:b':{x:560,y:1340,s:1.05},'table-wait':{x:300,y:1880,s:1.9}} as Record<string,Spot>,
 prints:[[300,830],[240,860],[190,890],[150,915],[90,940],[40,965]] as XY[],
};
/** One guest's skin for every guest hand in s3, and the holding hand's sleeve, which her shirt matches. */
const GUEST_SKIN=HP.skin[4],GUEST_SHIRT='#3D5566',WRITER_SKIN=HP.skin[1],COOK_SKIN=HP.skin[3];
type HeldSpot=Spot&{held:boolean;from?:XY};
const S3_BOOK={
 phone:{'code-scan:a':{x:690,y:830,s:.72,r:-3,held:true,from:[620,1720]},'menu-tap:a':{x:520,y:760,s:1.5,r:0,held:true},
  'pay-mark:a':{x:500,y:720,s:1.05,r:0,held:true},'code-scan:b':{x:600,y:720,s:.78,r:-8,held:true,from:[300,1560]},
  'menu-tap:b':{x:650,y:800,s:.72,r:12,held:true},'paid-close:b':{x:540,y:260,s:2.4,r:0,held:true}} as Record<string,HeldSpot>,
 /** B's over-the-shoulder tap: where the base of her neck stands, the finger's scale and the ready pose's
  * offset from the hover pose in degrees (shoulder, elbow). */
 ots:{guest:[270,1060] as XY,finger:.75,ready:[20,10] as XY},
 /** B's listening sheet in phone-screen units (its raised top, the microphone below it and its radius), and
  * where her voice leaves her head, past her right ear. */
 talk:{top:300,mic:84,r:38},voice:[452,812] as XY,
};
const S4_BOOK={
 phone:{'paid-line:a':{x:250,y:760,s:.62,r:8,held:true}} as Record<string,HeldSpot>,
 printer:{'printer-idle':{x:330,y:1000,s:1.1},'paid-line:a':{x:760,y:1150,s:1.3},'ticket-print:a':{x:520,y:1440,s:2.2},'wok-flare':{x:250,y:900,s:.78},
  'pass-wide':{x:230,y:940,s:.72},'ticket-print:b':{x:470,y:1290,s:1.6},'flame-close':{x:240,y:837,s:1.4}} as Record<string,Spot>,
 shelf:{'printer-idle':{x:60,y:1000,w:600},'paid-line:a':{x:380,y:1150,w:760},'wok-flare':{x:50,y:900,w:480},'pass-wide':{x:40,y:940,w:440},
  'flame-close':{x:-20,y:837,w:720},'ticket-print:b':{x:120,y:1290,w:980}} as Record<string,{x:number;y:number;w:number}>,
 wok:{'printer-idle':{x:820,y:1110,s:.85,flip:true},'wok-flare':{x:740,y:1090,s:1,flip:true},'pass-wide':{x:780,y:1100,s:.85,flip:true},
  'ticket-print:b':{x:1100,y:1250,s:1,flip:true},'flame-close':{x:600,y:1180,s:1.7,flip:true}} as Record<string,Spot>,
 /** B's paid-line push-in from above: the zoom it reaches on the printer and where the slot then sits. */
 push:{zoom:4.4,anchor:[540,700] as XY},
};
const S5_BOOK={
 ledger:{'ledger-slide':{x:250,y:940,s:1.25,fy:.55,r:-3},'ledger-tag':{x:90,y:760,s:1.9,fy:.6,r:-2},'owner-stamp:a':{x:150,y:510.8,s:2.2,fy:.62},
  'empty-clip':{x:120,y:1090,s:.95,fy:.5,r:-4},'desk-ledger':{x:210,y:560,s:1.5,fy:1,r:-2},'ledger-corner':{x:-20,y:398,s:2.2,fy:1},
  'owner-stamp:b':{x:-20,y:398,s:2.2,fy:1},'clip-bench':{x:60,y:860,s:1.75,fy:.84,r:-2}} as Record<string,Sheet>,
 /** B's OWNER COUNT in card units, crooked across the card's empty rows clear of the tag and header. */
 mark:{x:195,y:232,rot:6,size:28},
 /** Where B's stamp waits and where it leaves, as offsets from the mark, both toward the desk's near edge. */
 stampFrom:[-30,190] as XY,stampExit:[80,520] as XY,
 /** B's clip shot: the desk's back edge and depth, and the RECEIPTS board standing at the back right. */
 desk:{back:840,depth:490},
 receipts:{x:575,y:520,w:330,h:380,clip:[740,387] as XY,clipS:1.7,label:{x:584,y:735,w:312,h:66,size:44}},
};
const markBoxB=()=>({w:widthOf(STAMP_TEXT,S5_BOOK.mark.size,true)*1.08+34,h:S5_BOOK.mark.size+28});
const S6_BOOK={
 phone:{'coins-drop:a':{x:250,y:620,s:.62,r:12,held:true}} as Record<string,HeldSpot>,
 printer:{'jar-fills:b':{x:230,y:1040,s:.8}} as Record<string,Spot>,
 shelf:{'coins-drop':{x:300,y:1060,w:700},'jar-fills:a':{x:-20,y:1205,w:1120},'jar-fills:b':{x:40,y:1040,w:1000}} as Record<string,{x:number;y:number;w:number}>,
 wok:{'coins-drop':{x:990,y:1150,s:.7,flip:true},'jar-fills:b':{x:960,y:1180,s:.7,flip:true}} as Record<string,Spot>,
 jar:{'coins-drop':{x:720,y:1060,s:1},'jar-fills:a':{x:560,y:1200,s:1.8},'jar-tag':{x:500,y:1520,s:2.5},'jar-fills:b':{x:620,y:1040,s:1.25},
  'tag-close':{x:600,y:1500,s:2.4}} as Record<string,Spot>,
 arc:{'coins-drop':{ctrl:[540,500]},'jar-fills:a':{src:[-90,250],ctrl:[300,240]},'jar-fills:b':{src:[90,360],ctrl:[420,360]}} as Record<string,{src?:XY;ctrl:XY}>,
};
const S7_BOOK={rule:{'rule-card:a':{x:150,y:520,s:1.5,fy:.88,r:-1.5},'cooks-line':{x:20,y:375,s:2,fy:.9},'circle-detail':{x:-19,y:327,s:2.15,fy:.92},
 'rule-card:b':{x:165,y:520,s:1.45,fy:1},'box-close':{x:-30,y:332,s:1.9,fy:1},'pen-circle':{x:-19,y:320,s:2.15,fy:1}} as Record<string,Sheet>};
const S8_BOOK={rule:{'blank-folder':{x:-260,y:560,s:1,fy:.88},'folder-wide':{x:80,y:420,s:.95,fy:1}} as Record<string,Sheet>,
 folder:{'blank-folder':{x:330,y:600,s:1.15,fy:.88},'blank-box':{x:180,y:484,s:2,fy:.92},'folder-wide':{x:520,y:640,s:.95,fy:1},'folder-close':{x:150,y:470,s:1.8,fy:1}} as Record<string,Sheet>};
type Pose9={x:number;y:number;s:number;r:number};
const S9_BOOK={
 phone:{'viewfinder-hunt:a':{x:470,y:780,s:.82,r:-8,held:true,from:[600,1330]},'quote-card:a':{x:150,y:1020,s:.55,r:-4,held:false}} as Record<string,HeldSpot>,
 quote:{'quote-card':{x:430,y:880,s:1,fy:.78,r:-2},'quote-side':{x:40,y:560,s:.9,fy:1,r:-3}} as Record<string,Sheet>,
 /** B's one code stand from above, in both B shots. */
 code:[700,700] as XY,
 /** B's older customer: the phone low at the start, raised right over the code, set on the table by the end of
  * s9-event-1, pushed aside in s9-event-3 with her fingertips at `touch` (phone units) and her hand drawn back
  * by `back`. Her skin is a fill only and differs from the s3 guest's. */
 elder:{from:{x:605,y:1120,s:.72,r:18} as Pose9,aim:{x:585,y:840,s:.82,r:6} as Pose9,set:{x:610,y:1040,s:.6,r:12} as Pose9,
  rest:{x:690,y:990,s:.6,r:22} as Pose9,touch:[-30,288] as XY,back:[-110,110] as XY,skin:HP.skin[0],glasses:[300,935] as XY},
 knit:{base:'#7B5C78',deep:'#5E445B',rib:'#93738F',blouse:'#EFE6D6'},
};
const S10_BOOK={
 printer:{'panel-order':{x:840,y:1060,s:.75},'stand-wide':{x:755,y:960,s:.62},'jar-no-record':{x:1050,y:960,s:.6},'jar-owner-tag:b':{x:220,y:1040,s:.8},
  'tags-close':{x:191,y:800,s:1.3}} as Record<string,Spot>,
 shelf:{'panel-order':{x:470,y:1060,w:620},'stand-wide':{x:600,y:960,w:480},'jar-no-record':{x:440,y:960,w:640},'jar-owner-tag:b':{x:0,y:1040,w:1080},
  'jar-owner-tag:a':{x:-20,y:1235,w:1120},'tags-close':{x:-20,y:800,w:560}} as Record<string,{x:number;y:number;w:number}>,
 jar:{'panel-order':{x:590,y:1060,s:.75},'jar-owner-tag:a':{x:520,y:1230,s:1.75},'jar-no-record':{x:700,y:960,s:1},'stand-wide':{x:990,y:960,s:.62},
  'jar-owner-tag:b':{x:640,y:1040,s:1.25},'tags-close':{x:560,y:1380,s:2.3}} as Record<string,Spot>,
 panel:{'panel-order':{x:290,y:1640,s:1.22},'jar-no-record':{x:230,y:1230,s:.7},'stand-wide':{x:250,y:1720,s:1.42}} as Record<string,Spot>,
};
const TAG_TEXT={fox:['FOX 26 reports','all to the kitchen'],owner:['owner says'],none:['no record shown'],money:['$9,650','a month']};
type TagRig={lines:string[];size:number;len:number;from:XY;tone:'kraft'|'cream'|'slate'};

// ===================================================================================================================
// B's guest arm (s3 menu-tap): one jointed limb from her shoulder, solved so the fingertip lands on the row.
// ===================================================================================================================
const turn=(p:XY,a:number):XY=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
const wrapPi=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
const SLEEVE_AXIS=Math.atan2(FINGER_ARM.dir[1],FINGER_ARM.dir[0]);
type Joint={u:number;f:number};
/** Forward: upper arm at angle u (length a) to the elbow, forearm at f (length b) to the wrist, the hand rigid on
 * the forearm with its sleeve axis aimed back at the elbow. */
function limbForward(S:XY,a:number,b:number,fs:number,J:Joint){
 const E:XY=[S[0]+a*Math.cos(J.u),S[1]+a*Math.sin(J.u)],Wr:XY=[E[0]+b*Math.cos(J.f),E[1]+b*Math.sin(J.f)];
 const th=J.f+Math.PI-SLEEVE_AXIS,w=turn(FINGER_ARM.wrist,th);
 return {E,W:Wr,th,tip:[Wr[0]-w[0]*fs,Wr[1]-w[1]*fs] as XY};
}
/** Inverse: the pose whose fingertip lands on `tip` with the elbow out. The hand angle comes from a fixed scan and
 * a fixed bisection, so a tip always gives the same pose. */
function limbReach(S:XY,a:number,b:number,fs:number,tip:XY):Joint{
 const trial=(th:number)=>{const w=turn(FINGER_ARM.wrist,th),Wr:XY=[tip[0]+w[0]*fs,tip[1]+w[1]*fs];
  const dx=Wr[0]-S[0],dy=Wr[1]-S[1],d=Math.min(a+b-1e-3,Math.max(Math.abs(a-b)+1e-3,Math.hypot(dx,dy)));
  const u=Math.atan2(dy,dx)+Math.acos((a*a+d*d-b*b)/(2*a*d)),E:XY=[S[0]+a*Math.cos(u),S[1]+a*Math.sin(u)];
  return {miss:wrapPi(Math.atan2(E[1]-Wr[1],E[0]-Wr[0])-SLEEVE_AXIS-th),u,f:Math.atan2(Wr[1]-E[1],Wr[0]-E[0])};};
 let x0=-Math.PI,m0=trial(x0).miss;
 for(let step=1;step<=180;step++){
  const x1=-Math.PI+step*Math.PI/90,m1=trial(x1).miss;
  if(m0*m1<0&&Math.abs(m0-m1)<1){
   let lo=x0,hi=x1;
   for(let k=0;k<48;k++){const mid=(lo+hi)/2;if(trial(lo).miss*trial(mid).miss<=0)hi=mid;else lo=mid;}
   const best=trial((lo+hi)/2);return {u:best.u,f:best.f};
  }
  x0=x1;m0=m1;
 }
 throw new Error('The tapping arm cannot reach its contact');
}
const blendJoint=(A:Joint,B:Joint,p:number):Joint=>({u:lin(A.u,B.u,p),f:lin(A.f,B.f,p)});
function guestTapArm(b3:BeatS3){
 const L=S3_BOOK.phone['menu-tap:b'],O=S3_BOOK.ots,row=spotPt(L,screenPt(PHONE_UI.chow)),hover:XY=[row[0]+60,row[1]-50];
 const Sh:XY=[O.guest[0]+GUEST_BACK.shoulder[0],O.guest[1]+GUEST_BACK.shoulder[1]],a=GUEST_BACK.upper,b=GUEST_BACK.fore,fs=O.finger;
 const onRow=limbReach(Sh,a,b,fs,row),overRow=limbReach(Sh,a,b,fs,hover),ready={u:overRow.u+O.ready[0]*DEG,f:overRow.f+O.ready[1]*DEG};
 let J=blendJoint(blendJoint(ready,overRow,b3.tapGo),onRow,b3.tapPress);
 if(b3.tapBack>0)J=blendJoint(J,ready,b3.tapBack);
 return {...limbForward(Sh,a,b,fs,J),fs,b};
}
/** B's talk inside the menu-tap shot: up as the tap lets go (60 to 85 percent of s3-event-3), held through the
 * clause, closed in the 0.4 s after it, so the menu and Pay are whole at the cut. */
function talkLevel(W:Record<string,ActionWindow>,t:number,clauseEnd:number){
 const w=W['s3-event-3'];if(!w)return 0;
 return hermite((cl((t-w.start)/(w.end-w.start))-.6)/.25)*(1-hermite((t-clauseEnd-.04)/.36));
}
/** B's s9 performance: the phone's pose (one function across both shots, so the match cut keeps it where it
 * lies), the hunting brackets that never close, and the flat hand's fingertip and angle. */
function elderPerformance(W:Record<string,ActionWindow>,t:number){
 const E=S9_BOOK.elder,frac=(id:string)=>{const w=W[id];return w?cl((t-w.start)/(w.end-w.start)):0;};
 const r1=frac('s9-event-1'),r3=frac('s9-event-3');
 const raise=quintic(r1/.45),reachIn=hump((r1-.34)/.34),lower=quintic((r1-.62)/.38),push=seatEase(r3/.5),back=quintic((r3-.5)/.5);
 const tremor=2.2*hump((r1-.3)/.42)*Math.sin(2*Math.PI*1.6*t);
 const mixPose=(p:Pose9,q:Pose9,k:number):Pose9=>({x:lin(p.x,q.x,k),y:lin(p.y,q.y,k),s:lin(p.s,q.s,k),r:lin(p.r,q.r,k)});
 let p=mixPose(E.from,E.aim,raise);
 p={...p,x:p.x-8*reachIn,y:p.y-18*reachIn,r:p.r+tremor};
 p=mixPose(mixPose(p,E.set,lower),E.rest,push);
 const tip0=spotPt(p,E.touch);
 return {phone:p,hunt:[20*Math.sin(2*Math.PI*1.3*t+.7),13*Math.sin(2*Math.PI*.9*t+1.9)] as XY,huntScale:1+.1*Math.sin(2*Math.PI*.8*t),
  tip:[tip0[0]+E.back[0]*back,tip0[1]+E.back[1]*back] as XY,handR:p.r-12-8*back,lift:cl((p.s-.6)/.22)};
}

// ===================================================================================================================
// B's authored props, drawn in this module so the two recorded art groups keep their bytes.
// ===================================================================================================================
/** The inked OWNER COUNT on B's card, in card units: the frame worn where the rubber missed, the words whole. */
const OwnerMarkB:React.FC=()=>{const {w,h}=markBoxB(),M=S5_BOOK.mark;
 const misses=Array.from({length:7},(_,i)=>({x:-w/2+18+i*(w-36)/6+10*hash(i+11),y:(i%2?1:-1)*h/2,len:8+9*hash(i+17)}));
 return <g data-part="owner-mark-b" transform={`translate(${M.x} ${M.y}) rotate(${M.rot})`}>
  <rect x={-w/2} y={-h/2} width={w} height={h} rx={9} fill="none" stroke={RS.redInk} strokeWidth={4.5}/>
  <text x={0} y={fx(M.size*.36)} textAnchor="middle" fontFamily={FONT.body} fontSize={M.size} fontWeight={700} fill={RS.redInk} letterSpacing={2}>{STAMP_TEXT}</text>
  {misses.map((m,i)=><path key={i} d={`M${fx(m.x)} ${fx(m.y)}h${fx(m.len)}`} stroke={RS.paperLit} strokeWidth={3.2} opacity={.75}/>)}
 </g>;};
/** B's rubber stamp from above, about its face: the mount, the rubber's red edge, the knob, and the index label
 * that shows what it prints, so the stamp is known before it lifts. */
const StampFromAbove:React.FC=()=>{const {w,h}=markBoxB(),mw=w+20,mh=h+46,ly=mh*.06,lh=mh*.36;
 return <g data-part="stamp-top-b">
  <rect x={-mw/2} y={-mh/2} width={mw} height={mh} rx={10} fill={RS.woodLit} stroke={RS.ink} strokeWidth={2.6}/>
  <path d={`M${fx(-mw/2+8)} ${fx(-mh/2+6)}H${fx(mw/2-30)}`} stroke="#FFFFFF" strokeWidth={2} opacity={.3}/>
  <path d={`M${fx(-mw/2+6)} ${fx(mh/2-5)}H${fx(mw/2-6)}`} stroke={RS.redInk} strokeWidth={3.5}/>
  <rect x={fx(-w/2+6)} y={fx(ly)} width={fx(w-12)} height={fx(lh)} rx={4} fill={RS.paperLit} stroke={RS.ink} strokeWidth={1.6}/>
  <text x={0} y={fx(ly+lh/2+8)} textAnchor="middle" fontFamily={FONT.body} fontSize={22} fontWeight={700} fill={RS.redInk} letterSpacing={1.5}>{STAMP_TEXT}</text>
  <circle cx={0} cy={fx(-mh*.2)} r={fx(mh*.24)} fill={RS.wood} stroke={RS.ink} strokeWidth={2.4}/>
  <circle cx={fx(-mh*.07)} cy={fx(-mh*.27)} r={fx(mh*.08)} fill={RS.woodLit} opacity={.8}/>
 </g>;};
/** The RECEIPTS board standing at the back of B's desk: hardboard, a printed label, worn at a corner. */
const ReceiptsBoard:React.FC=()=>{const B=S5_BOOK.receipts,Lb=B.label,tilt=`rotate(-1.2 ${Lb.x+Lb.w/2} ${Lb.y+Lb.h/2})`;
 return <g data-part="receipts-board-b">
  <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={12} fill={RS.kraftDeep} stroke={RS.ink} strokeWidth={4}/>
  <rect x={B.x+10} y={B.y+10} width={B.w-20} height={B.h-20} rx={8} fill="none" stroke={RS.kraft} strokeWidth={3} opacity={.55}/>
  {[0,1,2].map(k=><path key={k} d={`M${B.x+22} ${B.y+150+k*34+6*hash(k+31)}q${B.w*.45} ${fx(-6+5*hash(k+37))} ${B.w-44} 0`} stroke={RS.kraft} strokeWidth={2} opacity={.35} fill="none"/>)}
  <path d={`M${B.x+B.w-34} ${B.y+B.h-4}l30 -26`} stroke={RS.kraft} strokeWidth={3} opacity={.6}/>
  <rect x={Lb.x} y={Lb.y} width={Lb.w} height={Lb.h} rx={6} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2.4} transform={tilt}/>
  <text x={Lb.x+Lb.w/2} y={fx(Lb.y+Lb.h/2+Lb.size*.36)} textAnchor="middle" fontFamily={FONT.body} fontSize={Lb.size} fontWeight={700} fill={RS.ink} transform={tilt}>RECEIPTS</text>
 </g>;};
/** B's desk front below its top edge: two drawer columns of unequal width with brass pulls, one set crooked. */
const DeskFrontDrawers:React.FC<{y:number}>=({y})=>{
 const columns:XY[]=[[60,470],[505,1020]];
 const drawers=columns.flatMap(([x0,x1],i)=>[0,1].map(j=>({x0,x1,top:y+30+j*290,cx:(x0+x1)/2,tilt:i===1&&j===0?3.5:0,key:i*2+j})));
 return <g data-part="desk-drawers-b">
  {drawers.map(d=><g key={d.key}>
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
 const q=cl(on);if(q<=0)return null;
 const T=S3_BOOK.talk,Wd=PHONE.screen.w,Ht=PHONE.screen.h,y0=lin(Ht,T.top,q),cx=Wd/2,cy=y0+T.mic,R=T.r,ph=(t*1.3)%1;
 const rings=[0,1,2].map(k=>(ph+k/3)%1),bars=Array.from({length:13},(_,i)=>6+26*q*Math.abs(Math.sin(2*Math.PI*(1.9*t+.37*i+.2*hash(i+5)))));
 return <g data-part="talk-sheet-b">
  <path d={`M0 ${fx(y0+22)}Q0 ${fx(y0)} 22 ${fx(y0)}H${Wd-22}Q${Wd} ${fx(y0)} ${Wd} ${fx(y0+22)}V${Ht-30}Q${Wd} ${Ht} ${Wd-30} ${Ht}H30Q0 ${Ht} 0 ${Ht-30}Z`} fill={RS.screenLit} stroke={RS.ink} strokeWidth={2}/>
  <rect x={cx-26} y={fx(y0+10)} width={52} height={6} rx={3} fill={RS.screenGlow} opacity={.6}/>
  {rings.map((f,k)=><circle key={k} cx={cx} cy={fx(cy)} r={fx(R+6+44*f)} fill="none" stroke={RS.screenGlow} strokeWidth={3.5} opacity={fx(.85*q*(1-f)*hermite(f/.15))}/>)}
  <circle cx={cx} cy={fx(cy)} r={R} fill={RS.screenGlow} stroke={RS.ink} strokeWidth={2.4}/>
  <rect x={cx-10} y={fx(cy-24)} width={20} height={32} rx={10} fill={RS.screenLit}/>
  <path d={`M${cx-17} ${fx(cy-2)}a17 17 0 0 0 34 0M${cx} ${fx(cy+15)}v9M${cx-10} ${fx(cy+24)}h20`} stroke={RS.screenLit} strokeWidth={4} fill="none" strokeLinecap="round"/>
  <text x={cx} y={fx(y0+156)} textAnchor="middle" fontFamily={FONT.body} fontSize={26} fontWeight={700} fill="#F4FBFC">Talk</text>
  {bars.map((h,i)=><rect key={i} x={fx(cx+(i-6)*15-4)} y={fx(y0+196-h/2)} width={8} height={fx(h)} rx={4} fill={RS.screenGlow} opacity={.9}/>)}
 </g>;
};
/** The older customer's hand holding the phone from below, in phone units: the palm and wrist behind it with a
 * wristwatch, a blouse cuff and a ribbed knit cardigan sleeve (`back`), and three curled fingertips over the left
 * edge, a ring on one, with the thumb over the right edge (`front`). */
const ElderGrip:React.FC<{layer:'back'|'front';skin:string}>=({layer,skin})=>{
 const K=S9_BOOK.knit;
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
   {stitches.map(([x,y],i)=><path key={i} d={`M${fx(x)} ${fx(y)}l10 12l10 -12`} stroke={K.deep} strokeWidth={3} opacity={.35} fill="none"/>)}
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
const ElderPalmDown:React.FC<{skin:string}>=({skin})=>{const K=S9_BOOK.knit;
 const fingers:[number,number,number,number,number][]=[[-52,14,112,30,-7],[-17,0,110,31,-2],[19,9,110,30,3],[53,40,108,26,9]];
 const stitches=Array.from({length:6},(_,i)=>[-70+(i%3)*70+12*hash(i+83),420+Math.floor(i/3)*130]);
 return <g data-part="elder-hand-flat">
  <path d="M-98 318L-130 900H172L134 318Z" fill={K.base} stroke={RS.ink} strokeWidth={4}/>
  {stitches.map(([x,y],i)=><path key={i} d={`M${fx(x)} ${y}l10 12l10 -12`} stroke={K.deep} strokeWidth={3} opacity={.35} fill="none"/>)}
  <path d="M-94 278H130L136 330H-100Z" fill={K.rib} stroke={RS.ink} strokeWidth={3}/>
  {Array.from({length:12},(_,i)=><path key={i} d={`M${-84+i*19} 284V325`} stroke={K.deep} strokeWidth={3} opacity={.55}/>)}
  <path d="M-80 264H118L122 282H-84Z" fill={K.blouse} stroke={RS.ink} strokeWidth={2.4}/>
  <path d="M-70 196C-104 180 -126 146 -130 112C-132 92 -112 86 -102 100C-92 118 -80 148 -58 166Z" fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
  {fingers.map(([x,tip,base,w,lean],i)=><g key={i} transform={`rotate(${lean} ${x} ${base})`}>
   <rect x={x-w/2} y={tip} width={w} height={base-tip} rx={w/2} fill={skin} stroke={RS.ink} strokeWidth={3.4}/>
   <rect x={x-w/2+6} y={tip+5} width={w-12} height={18} rx={7} fill="#F4E3D6" opacity={.5}/>
   <path d={`M${x-w/2+6} ${fx(tip+(base-tip)*.42)}q${w/2-6} 6 ${w-12} 0M${x-w/2+7} ${fx(tip+(base-tip)*.5)}q${w/2-7} 5 ${w-14} 0`} stroke={RS.ink} strokeWidth={1.8} opacity={.4} fill="none"/>
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
const FoldedGlasses:React.FC=()=><g data-part="reading-glasses">
 <ellipse cx={8} cy={30} rx={84} ry={14} fill="#1A1410" opacity={.16}/>
 <path d="M-72 -16L58 -8M74 -12L-52 -2" stroke={RS.walnut} strokeWidth={5} strokeLinecap="round"/>
 {[-80,8].map((x,i)=><g key={i}><rect x={x} y={-24} width={72} height={48} rx={18} fill={RS.glassTint} opacity={.6}/>
  <rect x={x} y={-24} width={72} height={48} rx={18} fill="none" stroke={RS.walnut} strokeWidth={6}/>
  <path d={`M${x+14} -12l18 -4`} stroke="#FFFFFF" strokeWidth={3} opacity={.55} strokeLinecap="round"/></g>)}
 <path d="M-8 -4q8 -9 16 0" stroke={RS.walnut} strokeWidth={5} fill="none"/>
</g>;

// ===================================================================================================================
// THE DRAWING KIT, built per frame for the scene on screen.
// ===================================================================================================================
type Env={t:number;W:Record<string,ActionWindow>;sid:string;v:Variant;view:string};
const Tagged:React.FC<{id:string;children?:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const Put:React.FC<{p:XY;s?:number;r?:number;o?:number;sx?:number;children?:React.ReactNode}>=({p,s=1,r=0,o=1,sx=1,children})=>
 <g transform={`translate(${fx(p[0])} ${fx(p[1])}) rotate(${r.toFixed(3)}) scale(${(s*sx).toFixed(4)} ${s.toFixed(4)})`} opacity={o}>{children}</g>;
type WokCue={flame:number;food:number;toss:number;tilt:number;hand:number;bowl?:{tilt:number;left:number;away:number;pour:number}};
const WOK_COLD:WokCue={flame:0,food:0,toss:0,tilt:0,hand:0},WOK_COOKING:WokCue={flame:.55,food:1,toss:0,tilt:0,hand:0};
const PAID_SCREEN:PhoneState={scan:0,lock:1,menu:1,lit:1,pay:1};
const TICKET_HANGING={len:TICKET.len,cut:1,hang:0,led:1,standby:.5,roll:1};
/** The bowl's pouring lip and where the noodles land, in wok units (the cook stands on the handle side). */
const BOWL_LIP:XY=[-40,-262],POUR_TO:XY=[6,-124];

function kitFor(env:Env){
 const {t,W,sid,v,view}=env;
 const pick=<T,>(book:Record<string,T>,name=view):T=>{const row=book[name+':'+v]??book[name];if(row===undefined)throw new Error('No '+view+' layout for '+name);return row;};
 const kit={
  pick,
  /** The phone at its spot, held by the guest's hand, with the finger that touches it. */
  phoneHeld(L:HeldSpot,st:PhoneState,o:{skin?:string;finger?:{tip:XY;press:number;s:number}|null}={}){
   const skin=o.skin??GUEST_SKIN,r=L.r??0;
   return <g data-part="phone-rig">
    <Put p={[L.x+14*L.s,L.y+20*L.s]} s={L.s} r={r} o={.22}><rect x={-150} y={-300} width={300} height={600} rx={46} fill="#1A1410"/></Put>
    {L.held&&<Put p={[L.x,L.y]} s={L.s} r={r}><OrderRigHero part="handBack" skin={skin}/></Put>}
    <Put p={[L.x,L.y]} s={L.s} r={r}><OrderRigHero part="phone" {...st}/></Put>
    {L.held&&<Put p={[L.x,L.y]} s={L.s} r={r}><OrderRigHero part="handFront" skin={skin}/></Put>}
    {o.finger&&<Put p={o.finger.tip} s={o.finger.s}><OrderRigHero part="finger" skin={skin} press={o.finger.press}/></Put>}
   </g>;
  },
  /** B's s9 phone at its pose: the higher it is lifted, the further and fainter its shadow; `hold` grips it. */
  elderPhone(p:Pose9,st:PhoneState,hold:boolean,lift:number){const sk=S9_BOOK.elder.skin;
   return <g data-part="elder-phone-rig">
    <Put p={[p.x+(14+40*lift)*p.s,p.y+(20+56*lift)*p.s]} s={p.s} r={p.r} o={.22-.07*lift}><rect x={-150} y={-300} width={300} height={600} rx={46} fill="#1A1410"/></Put>
    {hold&&<Put p={[p.x,p.y]} s={p.s} r={p.r}><ElderGrip layer="back" skin={sk}/></Put>}
    <Put p={[p.x,p.y]} s={p.s} r={p.r}><OrderRigHero part="phone" {...st}/></Put>
    {hold&&<Put p={[p.x,p.y]} s={p.s} r={p.r}><ElderGrip layer="front" skin={sk}/></Put>}
   </g>;},
  /** A fingertip's path for a tap: rest to hover, pressed onto the contact, then away. */
  tapPath(contact:XY,go:number,press:number,back:number,rest:XY,away:XY):XY{
   let p=linXY(linXY(rest,[contact[0]+60,contact[1]-50],go),contact,press);
   if(back>0)p=linXY(p,away,back);
   return p;
  },
  /** The printer with its rail, its ticket in the given state and its lamp. */
  printer(L:Spot,o:{len:number;cut:number;hang:number;led:number;standby:number;roll:number}){
   const slot=PRINTER.slot,grip=railGrip(),held=o.len>=TICKET.len-.01,top=held?grip[1]:slot.y-o.len,nudge=held?-4*o.cut:0;
   return <Put p={[L.x,L.y]} s={L.s} sx={L.flip?-1:1}>
    <Tagged id={sid+'-printer'}>
     <ellipse cx={12} cy={4} rx={150} ry={12} fill="#1A1410" opacity={.3}/>
     <OrderRigHero part="rail" roll={o.roll}/>
     <OrderRigHero part="printer" led={o.led} standby={o.standby}/>
    </Tagged>
    {o.len>0&&<Tagged id={sid+'-ticket'}><g transform={`translate(${slot.x} ${fx(top)}) rotate(${fx(held?o.hang:0)} 0 0) translate(${-TICKET.w/2} ${fx(nudge)})`}>
     <OrderRigHero part="ticket" len={held?TICKET.len:o.len} cut={o.cut}/></g>
     {!held&&<path d={`M${slot.x-TICKET.w/2-6} ${slot.y+1}H${slot.x+TICKET.w/2+6}`} stroke="#0D0F11" strokeWidth={5}/>}</Tagged>}
   </Put>;
  },
  wok(L:Spot,w:WokCue){
   const b=w.bowl,head=b?cl(b.pour*2.4):0,tail=b?cl((b.pour-.62)/.38):0;
   const strands=b&&b.pour>0&&tail<1?[0,1,2,3].map(k=>{const p0=linXY(BOWL_LIP,POUR_TO,tail),p1=linXY(BOWL_LIP,POUR_TO,head),dx=(k-1.5)*12;
    return <path key={k} d={`M${fx(p0[0]+dx)} ${fx(p0[1])}Q${fx((p0[0]+p1[0])/2+dx+10*Math.sin(t*20+k))} ${fx((p0[1]+p1[1])/2)} ${fx(p1[0]+dx*.6)} ${fx(p1[1])}`}
     stroke={k%2?HP.noodle:'#E3CF9A'} strokeWidth={6} fill="none" strokeLinecap="round"/>;}):null;
   return <Tagged id={sid==='s4'?'s4-pan':sid+'-pass'}><Put p={[L.x,L.y]} s={L.s} sx={L.flip?-1:1}>
    <OrderRigHero part="wok" flame={w.flame} food={w.food} toss={w.toss} tilt={w.tilt} hand={w.hand} t={t} skin={COOK_SKIN}/>
    {strands}
    {b&&b.away<1&&<g transform={`translate(${fx(BOWL_LIP[0]-520*b.away)} ${fx(BOWL_LIP[1]-420*b.away)})`}><OrderRigHero part="cookBowl" tilt={b.tilt} left={b.left} skin={COOK_SKIN}/></g>}
   </Put></Tagged>;
  },
  shelf(book:Record<string,{x:number;y:number;w:number}>,name:string){const s=pick(book,name);return <Put p={[s.x,s.y]}><RestaurantSupport part="passShelf" w={s.w}/></Put>;},
  /** A cabinet front under a pass shelf, down to the floor. */
  cabinet(x:number,y:number,w:number){
   const doors=Array.from({length:Math.max(1,Math.floor(w/160))},(_,k)=>x+14+k*160);
   return <g data-part="cabinet">
    <rect x={x} y={y+22} width={w} height={1300-y} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={3}/>
    {doors.map((dx,k)=><g key={k}><rect x={dx} y={y+46} width={140} height={240} rx={6} fill={RS.steel} stroke={RS.ink} strokeWidth={2}/>
     <rect x={dx+106} y={y+140} width={10} height={40} rx={4} fill={RS.steelDark}/></g>)}
   </g>;
  },
  /** A tag on its string carried in from rig.from until it hooks on the anchor (q 1). */
  hangingTag(id:string,anchor:XY,rig:TagRig,q:number,swing:number,carry:number){
   if(q<=0)return null;
   const p=linXY(rig.from,anchor,q),rise=-70*carry;
   return <Tagged id={id}><g data-part="hanging-tag" transform={`translate(${fx(p[0])} ${fx(p[1]+rise*(1-q))})`}>
    <g transform={`rotate(${fx(swing)})`}>
     <path d={`M0 0V${rig.len}`} stroke={RS.ink} strokeWidth={3}/>
     <g transform={`translate(0 ${rig.len})`}><RestaurantSupport part="tag" lines={rig.lines} size={rig.size} tone={rig.tone}/></g>
    </g>
    {q>=.999&&<circle r={7} fill="none" stroke={RS.ink} strokeWidth={3}/>}
   </g></Tagged>;
  },
  /** The tip jar with its pile, the pieces inside its mouth, and the pieces still in flight outside it. */
  jar(book:Record<string,Spot>,arcs:Record<string,{src?:XY;ctrl:XY}>|null,name:string,fill:number,coins:boolean,id:string,src?:XY){
   const L=pick(book,name),mouth=spotPt(L,[0,JAR.mouth.y]),inside:React.ReactNode[]=[],outside:React.ReactNode[]=[];
   if(coins){
    const arc=arcs?(arcs[name+':'+v]??arcs[name]):undefined,from=src??arc?.src??[0,0];
    for(let i=0;i<PIECES;i++){
     const f=pieceFlight(W,t,i);if(!f.launched)continue;
     const spread=(i%3-1)*28,note=i%4===3,spin=i*40+200*Math.min(1,f.u);
     const piece=(p:XY,s:number,r:number)=>note?<Put key={i} p={p} s={s} r={r}><OrderRigHero part="bill" w={64}/></Put>:
      <Put key={i} p={p} s={s}><OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={.5+.5*Math.sin(t*9+i)}/></Put>;
     if(f.u<1){
      const ctrl:XY=arc?.ctrl??[(from[0]+mouth[0])/2,Math.min(from[1],mouth[1])-200];
      outside.push(piece(quadAt(from,ctrl,[mouth[0]+spread*L.s,mouth[1]],hermite(f.u)),lin(.8,1,f.u)*L.s,spin));
     }else inside.push(piece([spread,lin(JAR.mouth.y,pileTop(f.restFill)-4,f.drop*f.drop)],1,spin+120*f.drop));
    }
   }
   return <g>
    <Tagged id={id}><ellipse cx={L.x+10*L.s} cy={L.y+4*L.s} rx={96*L.s} ry={12*L.s} fill="#1A1410" opacity={.28}/>
     <Put p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="back">{inside}</OrderRigHero></Put></Tagged>
    {coins&&<Tagged id={sid+'-coins'}>{outside}</Tagged>}
    <Tagged id={id}><Put p={[L.x,L.y]} s={L.s}><OrderRigHero part="jar" fill={fill} layer="front"/></Put></Tagged>
   </g>;
  },
  jarHook:(book:Record<string,Spot>,name:string,i:0|1):XY=>spotPt(pick(book,name),JAR.tagAt[i]),
  /** The s10 host panel at its spot, on its pole stand. */
  hostPanel(name:string,lit:number,nm:number,order:number,id:string,ping=0){const L=pick(S10_BOOK.panel,name);
   return <Tagged id={id}><Put p={[L.x,L.y]} s={L.s} r={L.r??0}><RestaurantSupport part="hostPanel" lit={lit} name={nm} order={order} ping={ping} t={t}/></Put></Tagged>;},
  /** The s1 host stand with the things on its top and, with an apron angle, the server's apron on its hook. */
  hostStand(name:string,top:React.ReactNode,apron?:number){const L=pick(S1_BOOK.stand,name);
   return <Tagged id="s1-setting"><Put p={[L.x,L.y]} s={L.s}><RestaurantSupport part="hostStand">
    {top}
    {apron!==undefined&&<Tagged id="s1-apron"><g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]}) rotate(${fx(apron)}) scale(.72)`}><RestaurantSupport part="apron"/></g>
     <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><RestaurantSupport part="apronHook"/></g></Tagged>}
   </RestaurantSupport></Put></Tagged>;},
  deskPhone:(x:number,s:number,ring:number)=><Tagged id="s1-phone"><g transform={`translate(${x} ${STAND.top}) scale(${s})`}><RestaurantSupport part="deskPhone" ring={ring} t={t}/></g></Tagged>,
  pad:(x:number,s:number,curl:number)=><Tagged id="s1-pad"><g transform={`translate(${x} ${STAND.top+6}) scale(${s})`}><RestaurantSupport part="orderPad" curl={curl}/></g></Tagged>,
  /** A dining table with its guest seated behind it, forearms on its top, plates, a glass and a menu tent. */
  diningTable(p:XY,s:number,g:number,o:{raise?:number;look?:number;foods?:Food[];flipChair?:boolean;menu?:boolean}={}){
   const G=GUESTS[g%GUESTS.length],seat=TABLE.top+130;
   return <Put p={p} s={s}>
    <g transform="translate(-30 -10)"><RestaurantSupport part="chair" flip={o.flipChair}/></g>
    <g transform={`translate(0 ${seat})`}><RestaurantSupport part="guest" layer="body" {...G} look={o.look??0}/></g>
    <RestaurantSupport part="table">
     {(o.foods??['none','none']).map((f,i)=><g key={i} transform={`translate(${-90+i*150} ${TABLE.top})`}><RestaurantSupport part="plate" food={f}/></g>)}
     <g transform={`translate(110 ${TABLE.top-2})`}><RestaurantSupport part="waterGlass"/></g>
     <g transform={`translate(-150 ${TABLE.top})`}><RestaurantSupport part="menuTent"/></g>
    </RestaurantSupport>
    <g transform={`translate(0 ${seat})`}><RestaurantSupport part="guest" layer="arms" {...G} raise={o.raise??0} menu={o.menu}/></g>
   </Put>;
  },
  pendant:(x:number,len:number)=><Put p={[x,0]}><RestaurantSupport part="pendant" len={len}/></Put>,
  floor:(y:number,vp=540)=><Tagged id={sid+'-setting'}><RestaurantSupport part="floor" y={y} vp={vp}/></Tagged>,
  /** A laminate table top seen from the front and a little above, from row y down past the frame. */
  tableFront(y:number){
   return <g data-part="table-band">
    <rect x={-40} y={y} width={1160} height={1960-y} fill={RS.laminate}/>
    <path d={`M-40 ${y}H1120`} stroke={RS.laminateEdge} strokeWidth={6}/>
    {[0,1,2,3,4].map(k=><path key={k} d={`M-40 ${y+60+k*90}H1120`} stroke="#FFFFFF" strokeWidth={2} opacity={.25}/>)}
    <path d={`M60 ${y+40}q300 20 700 0`} stroke="#FFFFFF" strokeWidth={8} opacity={.25} fill="none"/>
   </g>;
  },
  /** The table from straight above, filling the working area. */
  tableFromAbove(){
   return <g data-part="table-overhead">
    <rect x={50} y={290} width={980} height={980} rx={40} fill={RS.laminate} stroke={RS.ink} strokeWidth={5}/>
    <rect x={64} y={304} width={952} height={952} rx={32} fill="none" stroke={RS.laminateEdge} strokeWidth={4}/>
    <g transform="translate(250 420)"><circle r={86} fill="#F8F4EA" stroke={RS.ink} strokeWidth={3}/><circle r={56} fill="none" stroke="#E2D9C6" strokeWidth={4}/>
     <path d="M-30 -20L14 -34L40 -12L-6 2Z" fill="#FFFFFF" stroke={RS.ink} strokeWidth={2}/></g>
    <g transform="translate(880 1080)"><circle r={36} fill={RS.glassTint} opacity={.6} stroke={RS.ink} strokeWidth={3}/><circle r={26} fill="none" stroke="#9CC4CF" strokeWidth={2}/></g>
    <path d="M170 1120L420 1000M180 1140L430 1020" stroke={RS.woodDeep} strokeWidth={8} strokeLinecap="round"/>
    <g transform="translate(860 420) rotate(12)"><rect x={-70} y={-100} width={140} height={200} rx={8} fill={RS.tile} stroke={RS.ink} strokeWidth={3}/><rect x={-50} y={-70} width={100} height={12} rx={6} fill={RS.paper} opacity={.8}/></g>
   </g>;
  },
  deskFromAbove:()=><Tagged id={sid+'-setting'}><RestaurantSupport part="deskTop" x={30} y={290} w={1020} h={970}/></Tagged>,
  deskFace:(y:number,depth=220)=><Tagged id={sid+'-setting'}><RestaurantSupport part="desk" y={y} depth={depth}/></Tagged>,
  /** A paper dropping onto a surface: raised by h pixels (or, from above, nearer the lens) and offset by `from`,
   * landing on the contact curve. Its shadow travels under it and appears only in the last stretch of the fall. */
  paperDrop(L:Sheet,q:number,h:number,from:XY,node:React.ReactNode,top:boolean,shadow:React.ReactNode){
   const k=1-q,off:XY=[from[0]*k,from[1]*k-(top?0:h*k)],grow=top?1+.5*k:1+.12*k;
   const near=hermite((q-.72)/.28),sh:XY=top?[off[0]+12+24*k,off[1]+16+30*k]:[off[0]+6,from[1]*k+8];
   return <g data-part="paper-drop">
    {near>0&&<g transform={sheetMatrix({...L,x:L.x+sh[0],y:L.y+sh[1]})} opacity={fx(.24*near)}>{shadow}</g>}
    <g transform={`translate(${fx(off[0])} ${fx(off[1])})`}><g transform={`translate(${fx(L.x)} ${fx(L.y)}) scale(${fx(grow)}) translate(${fx(-L.x)} ${fx(-L.y)})`}>
     <g transform={sheetMatrix(L)}>{node}</g></g></g>
   </g>;
  },
  tagShadow:(lines:string[],size:number,p:XY,r:number)=><g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}><path d={tagPath(lines,size)} fill="#1A1410"/></g>,
  /** A tag lying flat on paper, in card units, its hole at p and its string curling away. */
  flatTag:(lines:string[],size:number,p:XY,r:number)=><g transform={`translate(${p[0]} ${p[1]}) rotate(${r})`}>
   <path d="M0 0C-30 -10 -60 6 -80 -6" stroke={RS.ink} strokeWidth={3} fill="none"/>
   <RestaurantSupport part="tag" lines={lines} size={size} tone="kraft"/></g>,
  /** A card's own drop shadow on its surface. */
  cardShadow:(L:Sheet,dx:number,dy:number,o:number,w:number,h:number,rx=0,y0=0)=>
   <g transform={sheetMatrix({...L,x:L.x+dx,y:L.y+dy})} opacity={o}><rect y={y0} width={w} height={h} rx={rx} fill="#1A1410"/></g>,
 };
 return kit;
}
type Kit=ReturnType<typeof kitFor>;

// ===================================================================================================================
// THE PAINTERS, one per scene. Each names its views; a view outside its scene throws.
// ===================================================================================================================
function paintS1(view:string,e:Env,k:Kit){
 const b=beatS1(clockOf(e.W,e.t)),{t,v}=e;
 switch(view){
 case 'door-apron':{
  // A, medium. The door shuts on its hinge with the bell ringing while the apron left on the stand's hook
  // swings; the phone sits silent. The walkout is carried by the door, the bell and the left-behind apron.
  return <g>{k.floor(FLOOR.medium)}{k.pendant(600,300)}
   <Tagged id="s1-door"><Put p={[90,FLOOR.medium]}><RestaurantSupport part="door" open={b.door} bell={b.bell}/></Put></Tagged>
   {k.hostStand('door-apron',<g>{k.pad(-85,.8,0)}{k.deskPhone(70,.9,0)}</g>,b.apron)}</g>;}
 case 'host-phone':{
  // A close / B medium. The desk phone on the empty stand rings, rattling in its cradle, its lamp blinking and
  // ring marks pulsing; the blank pad lies beside it and no one answers.
  const close=v==='a';
  return <g>{!close&&k.floor(FLOOR.medium)}{!close&&k.pendant(610,320)}
   {!close&&<Tagged id="s1-door"><Put p={[-150,FLOOR.medium]}><RestaurantSupport part="door" open={0} bell={b.bell}/></Put></Tagged>}
   {k.hostStand(view,<g>{k.pad(close?-110:-95,close?1:.8,0)}{k.deskPhone(60,1,b.ring)}</g>,b.apron)}</g>;}
 case 'blank-pad-tables':{
  // A, wide. Two tables wait under the pendants, a guest raising a hand toward the stand; the stand's pad curls
  // its top sheet and lets it fall back blank; the wall clock ticks a minute.
  return <g>{k.floor(FLOOR.wide)}
   <Tagged id="s1-setting"><Put p={[540,360]}><RestaurantSupport part="clock" r={46} minute={b.minute} hour={124}/></Put></Tagged>
   {k.pendant(330,330)}{k.pendant(690,300)}
   <Tagged id="s1-tables">{k.diningTable([330,1180],.62,0,{look:-.4*b.wait})}{k.diningTable([680,1220],.7,1,{raise:b.wait,look:.8*b.wait,flipChair:true,menu:true})}</Tagged>
   {k.hostStand('blank-pad-tables',<g>{k.pad(-60,1.15,b.curl)}{k.deskPhone(110,.9,b.ring)}</g>)}</g>;}
 case 'floor-plan':{
  // B, overhead. The room as a plan: the door leaf swings shut along its arc with its bell ringing, footprints
  // lead from the stand out through the door, the apron swings beside the stand, two tables wait and the pass
  // holds an idle printer and an empty jar.
  const fade=1-.5*hermite((t-1.8)/.6);
  return <g>
   <Tagged id="s1-setting"><RestaurantSupport part="roomPlan" door={b.door}/></Tagged>
   <Tagged id="s1-door"><g transform={`translate(${DOOR_PLAN.hinge[0]} ${DOOR_PLAN.hinge[1]-DOOR_PLAN.len-14})`}>
    <circle r={10} fill={RS.brass} stroke={RS.ink} strokeWidth={2}/>
    {[0,1].map(i=><path key={i} d={`M${16+i*12} -14q10 14 0 28`} stroke={RS.ink} strokeWidth={3} fill="none" opacity={fx(Math.min(1,Math.abs(b.bell)/8)*(1-i*.4))}/>)}
   </g></Tagged>
   <Tagged id="s1-setting">{S1_BOOK.prints.map((p,i)=><Put key={i} p={p} r={160} o={hermite((b.walk*1.2-i*.15)/.15)*fade}><RestaurantSupport part="footprint" flip={i%2===1}/></Put>)}</Tagged>
   <Tagged id="s1-setting"><Put p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></Put>
    <Put p={PASS_PLAN.printer} s={.36}><OrderRigHero part="printerTop"/></Put><Put p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={0}/></Put></Tagged>
   <Tagged id="s1-tables">{TABLES_PLAN.map((p,i)=><g key={i}>
    <Put p={[p[0]-120,p[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></Put><Put p={[p[0]+120,p[1]-10]} r={90}><RestaurantSupport part="chairTop"/></Put>
    <Put p={p} s={.9}><RestaurantSupport part="tableTop"/></Put>
    <Put p={[p[0]-120,p[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]} raise={0}/></Put>
    {i===0&&<Put p={[p[0]+120,p[1]-10]} r={-90}><RestaurantSupport part="guestTop" {...GUESTS[1]}/></Put>}
   </g>)}</Tagged>
   <Tagged id="s1-apron"><Put p={[STAND_PLAN[0]-84,STAND_PLAN[1]]} r={b.apron*.8}><rect x={-14} y={-30} width={28} height={60} rx={8} fill={RS.apron} stroke={RS.ink} strokeWidth={2.4}/></Put></Tagged>
   <Put p={STAND_PLAN}><RestaurantSupport part="standTop"/></Put>
   <Tagged id="s1-phone"><Put p={[STAND_PLAN[0]+28,STAND_PLAN[1]-8]}><rect x={-26} y={-16} width={52} height={32} rx={6} fill={RS.charcoal} stroke={RS.ink} strokeWidth={2}/></Put></Tagged>
   <Tagged id="s1-pad"><Put p={[STAND_PLAN[0]-30,STAND_PLAN[1]+12]}><rect x={-20} y={-26} width={40} height={52} rx={3} fill={RS.paperLit} stroke={RS.ink} strokeWidth={2}/></Put></Tagged>
  </g>;}
 case 'table-wait':{
  // B, close. The pad fills the foreground, its top sheet curling and falling back blank; behind it the tables
  // wait and a guest raises a hand toward the empty stand.
  return <g>
   <Tagged id="s1-tables">{k.diningTable([1010,1250],.6,2,{look:-.6})}{k.diningTable([760,1350],.95,1,{raise:b.wait,look:-.9*b.wait,flipChair:true,menu:true})}</Tagged>
   {k.hostStand('table-wait',<g>{k.pad(0,1,b.curl)}{k.deskPhone(-170,.8,b.ring)}</g>)}</g>;}
 default:throw new Error(view+' does not draw s1');
 }
}

/** s2 is the whole-scene replacement: every view is the station handover. */
function paintS2(view:string,e:Env){
 switch(view){
 case 'apron-drawer':   // A shot 1, medium at counter level: the apron goes into the drawer (n2a)
 case 'front-stand':    // B shot 1, the high wide: the same handover at the front of the room (n2a)
 case 'host-panel':     // A close / B medium: the same hand sets the panel; it lights and answers (n2b)
 case 'ai-tag':         // A detail: the AI host tag hooks onto the panel from the right (n2b)
 case 'tag-detail':     // B detail: the same tag from the left, the panel framed right (n2b)
  return <StationHandoverScene view={view as StationView} variant={e.v} W={e.W} t={e.t}/>;
 default:throw new Error(view+' does not draw s2');
 }
}

function paintS3(view:string,e:Env,k:Kit,board:FilmRenderProps['board'],shot:FilmRenderProps['shot']){
 const b=beatS3(clockOf(e.W,e.t)),{t,v,W}=e;
 switch(view){
 case 'code-scan':{
  // A close: the hand lifts the phone over the table code; the brackets close and lock; the menu slides up.
  // B overhead: the same from straight above the table.
  const L0=k.pick(S3_BOOK.phone),from=L0.from!;
  const L={...L0,x:lin(from[0],L0.x,b.lift),y:lin(from[1],L0.y,b.lift),r:lin((L0.r??0)+14,L0.r??0,b.lift)};
  const rig=<Tagged id="s3-phone"><Tagged id="s3-menu">{k.phoneHeld(L,{scan:1,lock:b.lock,menu:b.menu})}</Tagged></Tagged>;
  return v==='a'?<g>
   <Tagged id="s3-setting">{k.tableFront(930)}<Put p={[150,1000]} s={1.3}><RestaurantSupport part="plate"/></Put><Put p={[960,1010]} s={1.2}><RestaurantSupport part="waterGlass"/></Put></Tagged>
   <Tagged id="s3-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><Put p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></Put></Tagged>
   {rig}</g>:<g>
   <Tagged id="s3-setting">{k.tableFromAbove()}</Tagged>
   <Tagged id="s3-code"><Put p={[640,760]} s={1.1}><OrderRigHero part="codeStandTop"/></Put></Tagged>
   {rig}</g>;}
 case 'menu-tap':{
  const L=k.pick(S3_BOOK.phone),row=spotPt(L,screenPt(PHONE_UI.chow)),lit:PhoneState={scan:0,lock:1,menu:1,lit:b.lit,tap:b.ripple,tapAt:PHONE_UI.chow};
  if(v==='a'){
   // A detail: the menu fills the frame; a fingertip presses the Chow mein row, which lights with its price
   // chip, and lifts away; Talk sits beside Pay.
   const fs=1.3,tip=k.tapPath(row,b.tapGo,b.tapPress,b.tapBack,[row[0]+520*fs,row[1]+600*fs],[row[0]+300*fs,row[1]+420*fs]);
   return <g><Tagged id="s3-phone"><Tagged id="s3-menu"><Tagged id="s3-dish">
    {k.phoneHeld(L,lit,{finger:b.tapGo>0&&b.tapBack<1?{tip,press:b.tapPress,s:fs}:null})}</Tagged></Tagged></Tagged></g>;
  }
  // B medium, over her shoulder: the seated guest holds the phone up in her left hand and taps the row with her
  // right on one jointed arm drawn behind her back from her own shoulder; then she talks. The listening sheet
  // rises on the screen, her ready hand waits right of it, and her voice arcs leave past her ear.
  const arm=guestTapArm(b),G=S3_BOOK.ots.guest,look={...GUESTS[2],skin:GUEST_SKIN,shirt:GUEST_SHIRT};
  const elbow:XY=[arm.E[0]-G[0],arm.E[1]-G[1]];
  const clause=board.narration_picture!.clauses.find(c=>c.id==='n3b');
  const talk=talkLevel(W,t,clause?.end_s??shot.start_s+shot.duration_s-.5),ph=(t*1.3)%1,V=S3_BOOK.voice;
  const arcs=[0,1,2].map(n=>{const f=(ph+n/3)%1,r=24+60*f,a=32*DEG;
   return {f,d:`M${fx(V[0]+r*Math.cos(a))} ${fx(V[1]-r*Math.sin(a))}A${fx(r)} ${fx(r)} 0 0 1 ${fx(V[0]+r*Math.cos(a))} ${fx(V[1]+r*Math.sin(a))}`};});
  return <g>
   <Tagged id="s3-setting">{k.tableFront(1010)}<Put p={[1010,1060]} s={1.1}><RestaurantSupport part="waterGlass"/></Put></Tagged>
   <Tagged id="s3-phone"><Tagged id="s3-menu"><Tagged id="s3-dish">{k.phoneHeld(L,lit,{skin:GUEST_SKIN})}
    {talk>0&&<Put p={[L.x,L.y]} s={L.s} r={L.r??0}><g transform={`translate(${PHONE.screen.x} ${PHONE.screen.y})`}><ListeningSheet on={talk} t={t}/></g></Put>}
    <Put p={arm.tip} s={arm.fs} r={arm.th/DEG}><OrderRigHero part="finger" skin={GUEST_SKIN} press={b.tapPress} sleeve={arm.b/arm.fs}/></Put></Tagged></Tagged></Tagged>
   <Tagged id="s3-setting"><Put p={G}><RestaurantSupport part="guestBack" layer="upperArm" {...look} elbow={elbow}/></Put>
    <Put p={G}><RestaurantSupport part="guestBack" layer="body" {...look}/></Put></Tagged>
   {talk>0&&<Tagged id="s3-menu"><g data-part="voice-arcs-b">{arcs.map((a,n)=><g key={n} opacity={fx(talk*Math.sin(Math.PI*a.f))}>
    <path d={a.d} stroke={RS.ink} strokeWidth={10} fill="none" strokeLinecap="round"/><path d={a.d} stroke={RS.screenGlow} strokeWidth={6} fill="none" strokeLinecap="round"/></g>)}</g></Tagged>}
  </g>;}
 case 'pay-mark':
 case 'paid-close':{
  // A close / B detail. The finger presses Pay; the button shrinks into the round red paid mark, its check
  // drawing, and Paid appears. B's detail fills the frame with the button and keeps the holding hand.
  const L=k.pick(S3_BOOK.phone),pay=spotPt(L,screenPt(PHONE_UI.pay)),fs=view==='pay-mark'?1:2;
  const tip=k.tapPath(pay,b.payGo,b.payPress,b.payBack,[pay[0]+500*fs,pay[1]+560*fs],[pay[0]+280*fs,pay[1]+380*fs]);
  return <g><Tagged id="s3-phone"><Tagged id="s3-pay">{k.phoneHeld(L,{scan:0,lock:1,menu:1,lit:1,pay:b.pay,tap:b.payRipple,tapAt:PHONE_UI.pay},
   {finger:b.payGo>0&&b.payBack<1?{tip,press:b.payPress,s:fs}:null})}</Tagged></Tagged></g>;}
 default:throw new Error(view+' does not draw s3');
 }
}

function paintS4(view:string,e:Env,k:Kit){
 const b=beatS4(clockOf(e.W,e.t)),{v}=e,B=S4_BOOK;
 const ticketNow={len:TICKET.len*b.print,cut:b.cut,hang:b.hang,led:b.led,standby:b.standby,roll:b.print};
 const lampRail=(name:string,inset:number,rod:number,w:number)=>
  <Put p={[B.shelf[name].x+inset,spotPt(B.printer[name],[0,PRINTER.rail.y])[1]-130]}><RestaurantSupport part="heatLamp" w={w} rod={rod}/></Put>;
 switch(view){
 case 'printer-idle':
 case 'pass-wide':{
  // A medium / B wide. The printer stands on the pass, its slot blank and its lamp pulsing in standby under an
  // empty rail, beside a cold wok; B's wide adds the hood over the line.
  const sh=B.shelf[view];
  return <g>{k.floor(1200)}
   {view==='pass-wide'&&<Tagged id="s4-setting"><Put p={[560,440]}><RestaurantSupport part="hood" w={440}/></Put></Tagged>}
   <Tagged id="s4-setting">{lampRail(view,30,200,sh.w-60)}{k.cabinet(sh.x,sh.y,sh.w)}{k.shelf(B.shelf,view)}</Tagged>
   {k.printer(B.printer[view],{len:0,cut:0,hang:0,led:0,standby:b.standby,roll:0})}
   {k.wok(B.wok[view],WOK_COLD)}</g>;}
 case 'paid-line':{
  if(v==='a'){
   // A close: the paid mark leaves the phone and travels a dashed line into the printer's slot; at its arrival
   // the lamp turns red.
   const L=k.pick(B.phone),pr=B.printer['paid-line:a'],from=spotPt(L,screenPt(PHONE_UI.paidBig)),to=spotPt(pr,[PRINTER.slot.x,PRINTER.slot.y]);
   const ctrl:XY=[(from[0]+to[0])/2-40,Math.min(from[1],to[1])-380],at=quadAt(from,ctrl,to,b.token);
   return <g>
    <Tagged id="s4-setting">{k.shelf(B.shelf,'paid-line')}</Tagged>
    {k.printer(pr,{len:0,cut:0,hang:0,led:b.led,standby:b.standby,roll:0})}
    {k.phoneHeld(L,PAID_SCREEN)}
    <Tagged id="s4-paid"><path d={`M${fx(from[0])} ${fx(from[1])}Q${fx(ctrl[0])} ${fx(ctrl[1])} ${fx(to[0])} ${fx(to[1])}`} stroke={HP.red} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={fx(.75*b.line)}/>
     {b.tokenR>0&&b.token>0&&<Put p={at}><OrderRigHero part="paidMark" r={34*b.tokenR}/></Put>}</Tagged>
   </g>;
  }
  // B overhead: the same journey across the room's plan, from the guest's phone at the table to the printer on
  // the pass; as the mark nears it the camera follows it down, rest to rest, onto the printer seen from above.
  const T2=TABLES_PLAN[1],from:XY=[T2[0]+40,T2[1]-30],PS=.36,pr=PASS_PLAN.printer;
  const to:XY=[pr[0]+PS*PRINTER_TOP.slot[0],pr[1]+PS*PRINTER_TOP.slot[1]],ctrl:XY=[880,860],at=quadAt(from,ctrl,to,b.token);
  const u=quintic((b.r2-.1)/.8),z=lin(1,B.push.zoom,u),aim=linXY([540,780],to,u),anchor=linXY([540,780],B.push.anchor,u);
  return <g transform={`translate(${fx(anchor[0])} ${fx(anchor[1])}) scale(${z.toFixed(4)}) translate(${fx(-aim[0])} ${fx(-aim[1])})`}>
   <Tagged id="s4-setting"><RestaurantSupport part="roomPlan" door={0}/>
    <Put p={[PASS_PLAN.x,PASS_PLAN.y]}><RestaurantSupport part="counterTop" w={PASS_PLAN.w} h={PASS_PLAN.h}/></Put>
    <Put p={PASS_PLAN.jar} s={.42}><OrderRigHero part="jarTop" fill={.1}/></Put>
    {TABLES_PLAN.map((q,i)=><g key={i}><Put p={[q[0]-120,q[1]+10]} r={-90}><RestaurantSupport part="chairTop"/></Put>
     <Put p={q} s={.9}><RestaurantSupport part="tableTop"/></Put>
     <Put p={[q[0]-120,q[1]+10]} r={90}><RestaurantSupport part="guestTop" {...GUESTS[i*2]}/></Put></g>)}
    <Put p={STAND_PLAN}><RestaurantSupport part="standTop"/></Put></Tagged>
   <Tagged id="s4-printer"><Put p={pr} s={PS}><OrderRigHero part="printerTop" led={b.led}/></Put></Tagged>
   <Put p={from} s={.2} r={-20}><OrderRigHero part="phone" {...PAID_SCREEN}/></Put>
   <Tagged id="s4-paid"><path d={`M${fx(from[0])} ${fx(from[1])}Q${fx(ctrl[0])} ${fx(ctrl[1])} ${fx(to[0])} ${fx(to[1])}`} stroke={HP.red} strokeWidth={fx(5/(.4+.6*z))} strokeDasharray={`${fx(14/z)} ${fx(12/z)}`} fill="none" opacity={fx(.75*b.line)}/>
    {b.tokenR>0&&b.token>0&&<Put p={at}><OrderRigHero part="paidMark" r={lin(26,15,u)*b.tokenR}/></Put>}</Tagged>
  </g>;}
 case 'ticket-print':{
  // A detail / B close. Only now the ticket rises out of the slot, top first, until the rail's bearing grips it
  // and the cutter frees it. B keeps the shelf and the cold wok beside it.
  const pr=B.printer[view+':'+v];
  return <g>{v==='b'&&<Tagged id="s4-setting">{k.shelf(B.shelf,'ticket-print')}</Tagged>}
   {v==='b'&&k.wok(B.wok['ticket-print:b'],WOK_COLD)}{k.printer(pr,ticketNow)}</g>;}
 case 'wok-flare':
 case 'flame-close':{
  // A wide / B detail. With the ticket hanging on the rail the cook pours the noodles from the bowl as the flame
  // flares, then shakes the pan, which tosses them.
  const sh=B.shelf[view],wide=view==='wok-flare';
  return <g>{wide&&k.floor(FLOOR.wide+160)}
   <Tagged id="s4-setting">{wide&&lampRail(view,20,160,sh.w-40)}{wide&&k.cabinet(sh.x,sh.y,sh.w)}{k.shelf(B.shelf,view)}</Tagged>
   {k.printer(B.printer[view],ticketNow)}
   {k.wok(B.wok[view],{flame:b.flame,food:b.food,toss:b.toss,tilt:b.panTilt,hand:1,bowl:{tilt:-b.bowlTilt,left:b.bowlLeft,away:b.bowlAway,pour:b.pour}})}</g>;}
 default:throw new Error(view+' does not draw s4');
 }
}

function paintS5(view:string,e:Env,k:Kit){
 const b=beatS5(clockOf(e.W,e.t)),{v}=e,B=S5_BOOK,money=TAG_TEXT.money,tagAt=LEDGER.tag as XY;
 const ledgerShadow=(L:Sheet,dx:number,dy:number,o:number)=>k.cardShadow(L,dx,dy,o,LEDGER.w,LEDGER.h);
 switch(view){
 case 'ledger-slide':
 case 'desk-ledger':{
  // A medium / B overhead. The ledger card, headed with the source's words and its rows ruled and empty, slides
  // onto the back office desk and settles; the bare receipt clip waits beside it.
  const L0=k.pick(B.ledger),top=view==='desk-ledger';
  const L={...L0,x:L0.x+(1-b.slide)*(top?900:760),r:(L0.r??0)+6*(1-b.slide)};
  const card=<Tagged id="s5-ledger">{ledgerShadow(L,top?10:8,top?12:10,.2)}<g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard"/></g></Tagged>;
  return top?<g>{k.deskFromAbove()}
   <Tagged id="s5-setting"><Put p={[180,400]} s={.9}><RestaurantSupport part="mug" top/></Put></Tagged>
   <Tagged id="s5-clip"><Put p={[900,400]} s={1.2}><RestaurantSupport part="receiptClip" top/></Put></Tagged>{card}</g>:<g>
   {k.deskFace(880,300)}
   <Tagged id="s5-clip"><Put p={[720,520]}><RestaurantSupport part="corkBoard" w={260} h={300}/></Put><Put p={[850,560]}><RestaurantSupport part="receiptClip"/></Put></Tagged>
   <Tagged id="s5-setting"><Put p={[140,1010]} s={.8}><RestaurantSupport part="mug"/></Put></Tagged>{card}</g>;}
 case 'ledger-tag':
 case 'ledger-corner':{
  // A close / B close from above. The $9,650 a month tag drops onto the card and lands flat beside its header,
  // its shadow closing under it.
  const L=k.pick(B.ledger),top=view==='ledger-corner';
  return <g>{top?k.deskFromAbove():k.deskFace(700,520)}
   <Tagged id="s5-ledger"><g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard"/></g>
    {b.tag>0&&k.paperDrop(L,b.tag,top?0:420,top?[120,-200]:[60,0],k.flatTag(money,30,tagAt,-8),top,k.tagShadow(money,30,tagAt,-8))}</Tagged></g>;}
 case 'owner-stamp':{
  if(v==='b'){
   // B, from above on the tag shot's card exactly (a true match cut). The stamp, known by its index label, comes
   // in from the desk's near edge, presses and holds, then goes back toward the near edge, braking, so OWNER
   // COUNT lies uncovered and large beside the tag before the cut.
   const L=k.pick(B.ledger),p=b.top,mark=sheetPt(L,[B.mark.x,B.mark.y]),{w:mw,h:mh}=markBoxB();
   const up=1-p.come,high=Math.max(up,p.lift);
   const off:XY=[B.stampFrom[0]*up+B.stampExit[0]*p.lift,B.stampFrom[1]*up+B.stampExit[1]*p.lift];
   const scale=L.s*(1+.3*up+.35*p.lift-.025*p.press);
   const shade:XY=[mark[0]+.55*off[0]+6+46*high,mark[1]+.55*off[1]+8+64*high];
   return <g>{k.deskFromAbove()}
    <Tagged id="s5-ledger">
     <g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard"/></g>
     <g transform={sheetMatrix({...L,x:L.x+12,y:L.y+16})} opacity={.24}>{k.tagShadow(money,30,tagAt,-8)}</g>
     <g transform={sheetMatrix(L)}>{p.inked>0&&<OwnerMarkB/>}{k.flatTag(money,30,tagAt,-8)}</g>
    </Tagged>
    <Tagged id="s5-stamp">
     <Put p={shade} s={L.s} r={B.mark.rot} o={.3*(1-.55*high)}><rect x={-(mw+20)/2} y={-(mh+46)/2} width={mw+20} height={mh+46} rx={10} fill="#1A1410"/></Put>
     <Put p={[mark[0]+off[0],mark[1]+off[1]]} s={scale} r={B.mark.rot}><StampFromAbove/></Put>
    </Tagged></g>;
  }
  // A, side on. The stamp comes down onto the card, presses, holds and lifts away, leaving OWNER COUNT crooked
  // beside the tag.
  const L=k.pick(B.ledger),st=b.side,mark=sheetPt(L,[LEDGER.mark.x,LEDGER.mark.y]),sc=stampSize().w*L.s/132;
  const y=mark[1]-st.lift*140-(1-st.come)*900-st.away*900;
  return <g>{k.deskFace(500,760)}
   <Tagged id="s5-ledger"><g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard" mark={st.inked}/>{k.flatTag(money,30,tagAt,-8)}</g></Tagged>
   <Tagged id="s5-stamp"><g><ellipse cx={mark[0]+10} cy={mark[1]+6} rx={fx(70*sc*(1-.4*st.lift))} ry={fx(14*sc*.62)} fill="#1A1410" opacity={fx(.3*(1-st.lift)*st.come*(1-st.away))}/>
    <Put p={[mark[0],y]} s={sc}><RestaurantSupport part="stamp"/></Put></g></Tagged></g>;}
 case 'empty-clip':
 case 'clip-bench':{
  const L=k.pick(B.ledger);
  if(view==='clip-bench'){
   // B, medium, the desk from the front and above with the region behind. The stamped card lies large at the
   // front, OWNER COUNT and the tag above the caption band; at the back the RECEIPTS board stands and its clip
   // opens and snaps shut on nothing, the board giving a little. The camera holds.
   const R=B.receipts,foot:XY=[R.x+R.w/2,R.y+R.h];
   return <g>{k.deskFace(B.desk.back,B.desk.depth)}
    <Tagged id="s5-setting"><DeskFrontDrawers y={B.desk.back+B.desk.depth}/><Put p={[165,850]} s={.8}><RestaurantSupport part="mug"/></Put></Tagged>
    <Tagged id="s5-clip"><ellipse cx={foot[0]+14} cy={foot[1]+2} rx={R.w*.56} ry={13} fill="#1A1410" opacity={.3}/>
     <g transform={`rotate(${fx(.4*b.wob)} ${foot[0]} ${foot[1]})`}><ReceiptsBoard/>
      <Put p={R.clip} s={R.clipS}><RestaurantSupport part="receiptClip" open={b.clip}/></Put></g></Tagged>
    <Tagged id="s5-ledger">{ledgerShadow(L,10,12,.22)}<g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard"/><OwnerMarkB/>{k.flatTag(money,30,tagAt,-8)}</g></Tagged>
   </g>;
  }
  // A, medium. The receipt clip on the cork board opens and snaps shut on nothing beside the stamped card.
  return <g>{k.deskFace(1060,200)}
   <Tagged id="s5-clip"><Put p={[660,700]}><RestaurantSupport part="corkBoard" w={300} h={380}/></Put><Put p={[810,760]} s={1.15} r={b.wob}><RestaurantSupport part="receiptClip" open={b.clip}/></Put></Tagged>
   <Tagged id="s5-setting"><Put p={[600,1150]} s={.7}><RestaurantSupport part="mug"/></Put></Tagged>
   <Tagged id="s5-ledger"><g transform={sheetMatrix(L)}><RestaurantSupport part="ledgerCard" mark={1}/>{k.flatTag(money,30,tagAt,-8)}</g></Tagged></g>;}
 default:throw new Error(view+' does not draw s5');
 }
}

function paintS6(view:string,e:Env,k:Kit){
 const b=beatS6(clockOf(e.W,e.t)),{t,v,W}=e,B=S6_BOOK;
 switch(view){
 case 'coins-drop':{
  // A medium. Coins and notes leave the paid phone's screen and fall in arcs toward the jar at the pass.
  const L=k.pick(B.phone),src=spotPt(L,screenPt(PHONE_UI.paidBig)),sh=B.shelf['coins-drop'];
  return <g>{k.floor(FLOOR.medium+90)}
   <Tagged id="s6-pass">{k.cabinet(sh.x,sh.y,sh.w)}{k.shelf(B.shelf,'coins-drop')}<Put p={[440,sh.y]} s={.85}><RestaurantSupport part="plate" food="noodle"/></Put></Tagged>
   {k.wok(B.wok['coins-drop'],WOK_COOKING)}{k.phoneHeld(L,PAID_SCREEN)}{k.jar(B.jar,B.arc,'coins-drop',b.fill,true,'s6-jar',src)}</g>;}
 case 'jar-fills':{
  // A close / B medium. The pieces drop through the mouth onto the pile, which rises; B keeps the printer with
  // its hanging ticket and the wok on the same pass.
  return v==='a'?<g><Tagged id="s6-pass">{k.shelf(B.shelf,'jar-fills')}</Tagged>{k.jar(B.jar,B.arc,'jar-fills',b.fill,true,'s6-jar')}</g>:<g>
   {k.floor(FLOOR.medium+90)}<Tagged id="s6-pass">{k.cabinet(40,1040,1000)}{k.shelf(B.shelf,'jar-fills')}</Tagged>
   {k.printer(B.printer['jar-fills:b'],TICKET_HANGING)}{k.wok(B.wok['jar-fills:b'],WOK_COOKING)}{k.jar(B.jar,B.arc,'jar-fills',b.fill,true,'s6-jar')}</g>;}
 case 'jar-tag':
 case 'tag-close':{
  // A detail / B detail. The FOX 26 tag is carried in and hooks onto the jar's neck, swings and settles.
  const right=view==='jar-tag',hook=k.jarHook(B.jar,view,right?0:1);
  const rig:TagRig={lines:TAG_TEXT.fox,size:46,len:70,from:right?[1160,480]:[-160,450],tone:'kraft'};
  return <g>{k.jar(B.jar,null,view,b.fill,false,'s6-jar')}{k.hangingTag('s6-tag',hook,rig,b.tag,(right?-18:18)*b.carry+b.settle,b.carry)}</g>;}
 case 'pass-overhead':{
  // B overhead. From above the pass, the pieces slide off the paid phone at the counter's front edge and arc
  // across the steel toward the jar, their shadows trailing; the wok glows beyond.
  const jarAt:XY=[720,760],phoneAt:XY=[200,1000];
  const flying=Array.from({length:PIECES},(_,i)=>{const f=pieceFlight(W,t,i);if(!f.launched||f.u>=1)return null;
   const u=hermite(f.u),p=linXY([phoneAt[0]+30,phoneAt[1]-40],[jarAt[0]+(i%3-1)*20,jarAt[1]],u),hgt=Math.sin(Math.PI*u);
   return <g key={i}><Put p={[p[0]+40*hgt,p[1]+60*hgt]} s={.9} o={.25}><circle r={20} fill="#1A1410"/></Put>
    <Put p={p} s={1+.7*hgt}>{i%4===3?<OrderRigHero part="bill" w={64}/>:<OrderRigHero part="coin" r={20} tone={i%2?'silver':'gold'} tilt={1}/>}</Put></g>;});
  return <g>
   <Tagged id="s6-pass"><rect x={-20} y={560} width={1120} height={460} fill={RS.steel}/><Put p={[-20,560]}><RestaurantSupport part="counterTop" w={1120} h={460}/></Put>
    <Put p={[330,420]} s={.9}><OrderRigHero part="wokTop" flame={.7} t={t}/></Put><Put p={[860,560]} s={.7}><OrderRigHero part="printerTop" led={1}/></Put></Tagged>
   <Tagged id="s6-jar"><Put p={jarAt} s={1.3}><OrderRigHero part="jarTop" fill={b.fill}/></Put></Tagged>
   <Put p={phoneAt} s={.5} r={-10}><OrderRigHero part="phone" {...PAID_SCREEN}/></Put>
   <Tagged id="s6-coins">{flying}</Tagged></g>;}
 default:throw new Error(view+' does not draw s6');
 }
}

function paintS7(view:string,e:Env,k:Kit){
 const b=beatS7(clockOf(e.W,e.t)),{v}=e,B=S7_BOOK;
 const card=(L:Sheet,box:number,lit:number,circle:number)=><Tagged id="s7-rule"><g transform={sheetMatrix(L)}><Tagged id="s7-cooks"><Tagged id="s7-box">
  <RestaurantSupport part="ruleCard" box={box} lit={lit} circle={circle}/></Tagged></Tagged></g></Tagged>;
 switch(view){
 case 'rule-card':{
  // A medium / B overhead. The federal rule card slides onto the desk and its no tip credit box draws, empty.
  const L0=k.pick(B.rule),top=v==='b',L={...L0,x:L0.x+(1-b.slide)*900,r:(L0.r??0)+5*(1-b.slide)};
  return <g>{top?k.deskFromAbove():k.deskFace(420,820)}
   {top&&<Tagged id="s7-setting"><Put p={[960,420]} s={.9}><RestaurantSupport part="mug" top/></Put></Tagged>}
   <Tagged id="s7-rule">{k.cardShadow(L,10,14,.2,RULE.w,RULE.h,10)}<g transform={sheetMatrix(L)}><Tagged id="s7-box"><RestaurantSupport part="ruleCard" box={b.box} lit={0} circle={0}/></Tagged></g></Tagged></g>;}
 case 'cooks-line':
 case 'box-close':{
  // A close / B close from above. The cooks line lights beside the empty box.
  return <g>{v==='b'?k.deskFromAbove():k.deskFace(300,940)}{card(k.pick(B.rule),1,b.lit,0)}</g>;}
 case 'circle-detail':
 case 'pen-circle':{
  // A detail / B detail from above. A writing hand brings its pen down and circles the lit cooks line and the box
  // together; the box stays empty and nothing is ticked.
  const L=k.pick(B.rule),start=sheetPt(L,rulePenPoint(0)),now=sheetPt(L,rulePenPoint(b.circle));
  const rest:XY=v==='a'?[1180,1400]:[-200,1400],pen=b.circle>0?now:linXY(rest,start,b.penGo),tip:XY=[pen[0]+30*b.penLift,pen[1]-40*b.penLift];
  return <g>{v==='b'?k.deskFromAbove():k.deskFace(260,980)}{card(L,1,1,b.circle)}
   {b.penGo>0&&<Tagged id="s7-setting"><Put p={tip} s={1.4} sx={v==='a'?1:-1}><RestaurantSupport part="penHand" skin={WRITER_SKIN}/></Put></Tagged>}</g>;}
 default:throw new Error(view+' does not draw s7');
 }
}

function paintS8(view:string,e:Env,k:Kit){
 const b=beatS8(clockOf(e.W,e.t)),B=S8_BOOK;
 const folder=(F:Sheet)=><g transform={sheetMatrix(F)}><Tagged id="s8-blank"><RestaurantSupport part="folder" open={b.open} q={b.q}/></Tagged></g>;
 switch(view){
 case 'blank-folder':
 case 'folder-wide':{
  // A medium / B overhead wide. The restaurant folder slides in beside the circled rule card and settles.
  const R0=k.pick(B.rule),F0=k.pick(B.folder),F={...F0,x:F0.x+(1-b.slide)*820,r:4*(1-b.slide)};
  return <g>{view==='folder-wide'?k.deskFromAbove():k.deskFace(420,820)}
   <Tagged id="s8-rule"><g transform={sheetMatrix(R0)}><RestaurantSupport part="ruleCard" box={1} lit={1} circle={1}/></g></Tagged>
   <Tagged id="s8-folder">{k.cardShadow(F,10,14,.2,FOLDER.w,FOLDER.h+6,8,-6)}{folder(F)}</Tagged></g>;}
 case 'blank-box':
 case 'folder-close':{
  // A detail / B close from above. The cover turns over; the one box stays blank and a question mark draws.
  return <g>{view==='folder-close'?k.deskFromAbove():k.deskFace(300,940)}<Tagged id="s8-folder">{folder(k.pick(B.folder))}</Tagged></g>;}
 default:throw new Error(view+' does not draw s8');
 }
}

function paintS9(view:string,e:Env,k:Kit){
 const b=beatS9(clockOf(e.W,e.t)),{v,W,t}=e,B=S9_BOOK;
 const quoteShadow=<rect width={600} height={290} rx={12} fill="#1A1410"/>;
 const overheadTable=<Tagged id="s9-table">{k.tableFromAbove()}<Put p={B.elder.glasses} r={-9}><FoldedGlasses/></Put></Tagged>;
 const overheadCode=<Tagged id="s9-code"><Put p={B.code} s={1.1}><OrderRigHero part="codeStandTop"/></Put></Tagged>;
 switch(view){
 case 'viewfinder-hunt':{
  if(v==='b'){
   // B overhead: an older customer (knit cardigan cuff, wristwatch, ring) raises her phone right over the code,
   // where its brackets hunt and never close while her hand trembles and tries a little nearer; then she lowers
   // it onto the table. Her reading glasses lie on the table from the first frame.
   const E=elderPerformance(W,t);
   return <g>{overheadTable}{overheadCode}
    <Tagged id="s9-phone">{k.elderPhone(E.phone,{scan:1,lock:0,menu:0,hunt:E.hunt,huntScale:E.huntScale},true,E.lift)}</Tagged></g>;
  }
  // A close: a hand raises the phone toward the code, pauses short of it with its frame wide and never closing,
  // then lowers it again without scanning.
  const L0=k.pick(B.phone),low=L0.from!,u=b.up;
  const L={...L0,x:lin(low[0],L0.x,u),y:lin(low[1],L0.y,u),r:lin((L0.r??0)+22,L0.r??0,u)+b.waver};
  return <g>
   <Tagged id="s9-table">{k.tableFront(930)}<Put p={[170,1010]} s={1.2}><RestaurantSupport part="plate"/></Put><Put p={[960,1000]} s={1.1}><RestaurantSupport part="menuTent"/></Put></Tagged>
   <Tagged id="s9-code"><ellipse cx={734} cy={1112} rx={130} ry={14} fill="#1A1410" opacity={.25}/><Put p={[720,1110]} s={1.25}><OrderRigHero part="codeStand"/></Put></Tagged>
   <Tagged id="s9-phone">{k.phoneHeld(L,{scan:1,lock:0,menu:0,dim:.5*(1-u)},{skin:GUEST_SKIN})}</Tagged></g>;}
 case 'quote-card':
 case 'quote-side':{
  const Q=k.pick(B.quote);
  if(view==='quote-side'){
   // B, the same overhead table: her phone lies where she set it, still hunting and unscanned, her fingertips on
   // its bottom edge while the quote card lands; in s9-event-3 she pushes it away and takes her hand back.
   const E=elderPerformance(W,t);
   return <g>{overheadTable}{overheadCode}
    <Tagged id="s9-phone">{k.elderPhone(E.phone,{scan:1,lock:0,menu:0,hunt:E.hunt,huntScale:E.huntScale},false,0)}</Tagged>
    <Tagged id="s9-quote">{b.quote>0&&k.paperDrop(Q,b.quote,0,[-160,-220],<RestaurantSupport part="quoteCard"/>,true,quoteShadow)}</Tagged>
    <Tagged id="s9-phone"><Put p={E.tip} r={E.handR}><ElderPalmDown skin={B.elder.skin}/></Put></Tagged></g>;
  }
  // A medium: the phone lies lowered on the table, its code unscanned; the quote card lands beside it, then the
  // phone's screen times out.
  const L=k.pick(B.phone),st:PhoneState={scan:1,lock:0,menu:0,dim:.5+.5*b.dim};
  return <g>
   <Tagged id="s9-table">{k.tableFront(860)}</Tagged>
   <Tagged id="s9-code"><Put p={[330,1050]} s={.9}><OrderRigHero part="codeStand"/></Put></Tagged>
   <Tagged id="s9-phone"><g><ellipse cx={L.x+6} cy={L.y+60*L.s} rx={170*L.s} ry={30*L.s} fill="#1A1410" opacity={.22}/>
    <g transform={`translate(${L.x} ${L.y}) rotate(${L.r??0}) scale(${L.s} ${(L.s*.36).toFixed(4)})`}><OrderRigHero part="phone" {...st}/></g></g></Tagged>
   <Tagged id="s9-quote">{b.quote>0&&k.paperDrop(Q,b.quote,420,[140,0],<RestaurantSupport part="quoteCard"/>,false,quoteShadow)}</Tagged></g>;}
 default:throw new Error(view+' does not draw s9');
 }
}

function paintS10(view:string,e:Env,k:Kit,shot:FilmRenderProps['shot']){
 const b=beatS10(clockOf(e.W,e.t)),{v,t}=e,B=S10_BOOK;
 switch(view){
 case 'panel-order':
 case 'stand-wide':{
  // A medium / B wide, staged in depth. The lit panel stands large at the front: in the shot's first second the
  // Chow mein order card, already paid, slides up its screen and lands with a glow; a slip leaves the card, arcs
  // to the pass and drops into the printer's slot, and only then the lamp answers and that order's ticket rises,
  // is gripped and cut. The camera eases in toward the printer from the first frame to the last, rest to rest.
  const wide=view==='stand-wide',Pn=B.panel[view],Pr=B.printer[view],sh=B.shelf[view];
  const cardY=PANEL.screen.y+PANEL.screen.h+24-ORDER_CARD.rise+ORDER_CARD.h*.5;
  const from=spotPt(Pn,[ORDER_CARD.w/2,cardY]),to=spotPt(Pr,[PRINTER.slot.x,PRINTER.slot.y]);
  const ctrl:XY=[(from[0]+to[0])/2+40,Math.min(from[1],to[1])-300],u=b.slip,slipAt=quadAt(from,ctrl,to,u);
  const slipS=lin(Pn.s*1.15,Pr.s*1.3,hermite(u))*(1-hermite((u-.84)/.16));
  const push=quintic((t-shot.start_s)/shot.duration_s),z=1+(wide?.08:.06)*push,pivot:XY=[to[0],to[1]-60];
  return <g transform={`translate(${fx(pivot[0])} ${fx(pivot[1])}) scale(${z.toFixed(4)}) translate(${fx(-pivot[0])} ${fx(-pivot[1])})`}>
   {k.floor(wide?FLOOR.wide:FLOOR.medium)}{k.pendant(wide?620:640,300)}
   <Tagged id="s10-setting">{k.cabinet(sh.x,sh.y,sh.w)}{k.shelf(B.shelf,view)}</Tagged>
   {k.printer(Pr,{len:TICKET.len*b.print,cut:b.cut,hang:b.hang,led:b.led,standby:b.standby,roll:b.print})}
   {k.jar(B.jar,null,view,.72,false,'s10-jar')}
   {k.hostPanel(view,1,1,b.order,'s10-panel',b.ping)}
   {u>0&&slipS>.02&&<Tagged id="s10-panel"><path d={`M${fx(from[0])} ${fx(from[1])}Q${fx(ctrl[0])} ${fx(ctrl[1])} ${fx(to[0])} ${fx(to[1])}`} stroke={RS.screenLit} strokeWidth={5} strokeDasharray="14 12" fill="none" opacity={fx(.65*(1-hermite((u-.9)/.1)))}/>
    <Put p={slipAt} s={slipS} r={-10+18*u}><rect x={-30} y={-40} width={60} height={80} rx={4} fill={HP.paper} stroke={RS.ink} strokeWidth={2.4}/>
     <circle cx={-12} cy={-22} r={8} fill={HP.red}/><rect x={2} y={-26} width={20} height={6} rx={3} fill="#8F8A80"/><rect x={-20} y={-6} width={40} height={6} rx={3} fill="#A9A397"/><rect x={-20} y={8} width={30} height={6} rx={3} fill="#A9A397"/></Put></Tagged>}
  </g>;}
 case 'jar-owner-tag':{
  // A close / B medium. The owner says tag is carried in and hooks onto the full jar's neck, swinging, settling.
  const rig:TagRig={lines:TAG_TEXT.owner,size:v==='a'?50:46,len:v==='a'?80:70,from:[1160,520],tone:'cream'};
  return <g>{v==='b'&&k.floor(FLOOR.medium+90)}
   <Tagged id="s10-setting">{v==='b'&&k.cabinet(0,1040,1080)}{k.shelf(B.shelf,'jar-owner-tag')}</Tagged>
   {v==='b'&&k.printer(B.printer['jar-owner-tag:b'],TICKET_HANGING)}
   {k.jar(B.jar,null,view,.72,false,'s10-jar')}
   {k.hangingTag('s10-tag',k.jarHook(B.jar,view,0),rig,b.tag1,-18*b.carry1+b.settle1,b.carry1)}</g>;}
 case 'jar-no-record':
 case 'tags-close':{
  // A wide / B detail, the held final image. Owner says hangs on the jar and no record shown settles beside it,
  // under it. A's wide keeps the lit panel that now takes the order; B's detail keeps the printed ticket above.
  const wide=view==='jar-no-record',size=wide?44:52;
  const owner:TagRig={lines:TAG_TEXT.owner,size,len:60,from:[1160,520],tone:'cream'};
  const none:TagRig={lines:TAG_TEXT.none,size,len:wide?194:216,from:[-160,560],tone:'cream'};
  return <g>{wide&&k.floor(FLOOR.wide)}{wide&&k.pendant(560,300)}
   <Tagged id="s10-setting">{wide&&k.cabinet(440,960,640)}{k.shelf(B.shelf,view)}</Tagged>
   {k.printer(B.printer[view],TICKET_HANGING)}
   {wide&&k.hostPanel(view,1,1,1,'s10-panel')}
   {k.jar(B.jar,null,view,.72,false,'s10-jar')}
   {k.hangingTag('s10-record',k.jarHook(B.jar,view,1),none,b.tag2,18*b.carry2+b.settle2,b.carry2)}
   {k.hangingTag('s10-tag',k.jarHook(B.jar,view,0),owner,1,b.settle1,0)}</g>;}
 default:throw new Error(view+' does not draw s10');
 }
}

// ===================================================================================================================
// THE DISCLOSURE CHIP: the scene's production_disclosure from this treatment's board, on every frame.
// ===================================================================================================================
const CHIP={font:26,max:420,x:44,y:132,lead:32};
function chipLines(text:string){
 const lines:string[]=[];let line='';
 for(const word of text.split(' ')){const next=line?line+' '+word:word;
  if(line&&widthOf(next,CHIP.font,true)>CHIP.max){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);
 return lines;
}

export const OrderHandoverFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const art=useArtDirection();if(!art)throw new Error('The order handover film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('The order handover film must read the single film frame clock');
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const action=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const env:Env={t,W,sid:scene.id,v:variant,view:shot.view};
 const kit=kitFor(env);
 let picture:React.ReactNode;
 switch(scene.id){
 case 's1':picture=paintS1(shot.view,env,kit);break;
 case 's2':picture=paintS2(shot.view,env);break;
 case 's3':picture=paintS3(shot.view,env,kit,board,shot);break;
 case 's4':picture=paintS4(shot.view,env,kit);break;
 case 's5':picture=paintS5(shot.view,env,kit);break;
 case 's6':picture=paintS6(shot.view,env,kit);break;
 case 's7':picture=paintS7(shot.view,env,kit);break;
 case 's8':picture=paintS8(shot.view,env,kit);break;
 case 's9':picture=paintS9(shot.view,env,kit);break;
 case 's10':picture=paintS10(shot.view,env,kit,shot);break;
 default:throw new Error('The order handover film has no scene '+scene.id);
 }
 const flat=art.flat_shots?.[scene.id];
 const text=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const lines=chipLines(text),chipW=Math.max(...lines.map(l=>widthOf(l,CHIP.font,true)))+34;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={shot.view} data-framing={shot.framing} data-clause={clause?.id} data-action={action} data-variant={variant} data-scene-time={(t-scene.start_s).toFixed(3)}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{picture}</g>
  <g data-disclosure="production_disclosure">
   <rect x={CHIP.x} y={CHIP.y} width={chipW} height={lines.length*CHIP.lead+24} rx={16} fill={art.palette.paper} opacity={.93}/>
   {lines.map((l,i)=><text key={i} x={60} y={164+i*CHIP.lead} fontFamily={FONT.body} fontSize={CHIP.font} fontWeight={700} fill={art.palette.ink}>{l}</text>)}
  </g>
 </svg>;
};
