import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject,usePlace} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {RobotaxiHero,CAR,SIDE_BOX,TOP_BOX,DOOR_STOP,type SideProps,type TopProps} from './RobotaxiHero';
import {SanAntonioSupport,CURB,CURB_PLAN,CREEK,CREEK_MARKS,STREET,LANE,LOT,LOT_PLAN,LOT_PLAN_CLOSE,LANE_PLAN,STREET_PLAN,CREEK_PLAN,
 QUOTE_TEXT,REMEDY_ROW,floodFoot,puddleFoot,creekToePts,smoothPath,imprintSize,stampSlots,remedyPenTip,stampKnob,cordAt,cordAtClose,STAMP_SIZE,type Imprint} from './SanAntonioSupport';

/**
 * robotaxi-recall-v1: the ride and the recall (2026-10-19, Bexar County).
 *
 * ONE generic white driverless car (RobotaxiHero) carries the film; SanAntonioSupport draws its world
 * and the federal record. Every performed state below is a closed function of the film clock and the
 * board's event windows, so any frame renders alone and the same twice:
 *
 *  s1  the car brakes into the airport pickup curb (s1-event-1, travel), its steering wheel turns a
 *      quarter turn by itself and holds with the driver seat empty as it rolls to the bay (s1-event-2),
 *      and unwinds as it settles at the bay mark while the phone's request pin reaches the curb and
 *      turns to arriving (s1-event-3).
 *  s2  a San Antonio street map draws in (linear); as the limited area is named a February calendar slides
 *      onto the map's corner from the side it stood on, the outline starts to trace and its sixty square
 *      miles tag drops in at once; the outline, the only ring on the map, closes around the moving pins.
 *  s3  rain streaks in and a fast brown current runs left along the limestone bank under live oaks. The
 *      camera is LOCKED on fixed bank landmarks: the near bank's shallow limestone shelf and its broken lip,
 *      the far bank's tall live oak and a pale ledge jutting into the water. An EMPTY car (clear glass, bare
 *      seats) stands on the shelf at the shallow edge from the first frame, the water rushing round its
 *      wheels; nothing shows how it came to be there. The water presses its upstream side, a bow wave builds
 *      and it starts to slide along the shelf (s3-event-2); the current shoves it off the lip, tail first, so
 *      the tail drops, the waterline climbs its doors, and carries it on downstream, faster, past the oak and
 *      toward the ledge, across most of the frame (s3-event-3). One continuous water sheet closes over its
 *      lower body. Illustrated, no occupant, no damage.
 *  s4  the residential street is already under brown water at the clause's first word; it spreads on and
 *      climbs to a second empty car's wheel arches, the car creeps, stops (its speed follows the board's
 *      contact curve) and its amber hazards start to blink; the camera finds the empty cabin as the water
 *      stills. The mud line stays.
 *  s5  the recall record card, already at the desk's edge, slides into place and its two rows write in
 *      (the recall type, the potential units affected, each label over its value); a grid of car icons
 *      fills row by row, the counter tag settles and a software recall stamp, brought in along its own
 *      forearm from the lower right, as in s7, lands in the card's header slot, off every data row; its
 *      blow jostles the counter tag and the camera settles in on the count.
 *  s6  THE TURN. The car runs the higher speed lane, slows with its brake lamps lit (its speed eases
 *      down along the board's contact curve), releases and rolls on into standing water with a wake at
 *      its wheels. Its speed never reaches zero: there is no stop state and no crash. The recall
 *      sentence's word may lights as the front wheel meets the water.
 *  s7  the card (recall type, units affected, remedy) fills the frame; the remedy row writes in and
 *      lights on the clause's first word, a hand brings a pen in from the right to rest just past the
 *      sentence's last word, and the tip stays there through currently under development, across the cut
 *      to the detail, leaving after the clause ends; in the detail the stamp, raised over the row's slot
 *      under its words, presses into it and is carried out of the way, its forearm running out below the
 *      pen and the sentence. The summary sentence has its own card in s6, and the interim rows (the
 *      weather limits and the April 20th date) are never on the card.
 *  s8  in the wet fleet lot the four cars stand in a row of stalls running away from the camera, filling
 *      the frame; a weather limits tag enters on the clause's first word, slides along the cord and clips
 *      above them; the cord takes up its slack and the tag swings and settles. Then a SEPARATELY STAGED low
 *      close at the near end of the row, the eye at door height: the tag hangs clipped on the cord near the
 *      lens, the nearest car fills the frame and its roof pod takes its check large, the three behind it
 *      take theirs left to right as every affected car is named, the vehicle map card clipped further along
 *      the cord is marked updated, and the calendar on the far pole flips to 20 on April twentieth. B reads
 *      the lot straight down, refilled, then a separately staged top-down close over the nearest roof.
 *  s9  back at the same curb bay the same car waits, its curbside rear door swings open, the record card,
 *      already standing back by the curb, slides into the foreground through the remedy's naming and its
 *      remedy row is underlined, still under development; the split sets the card and phone on the
 *      record's desk while the top panel closes slowly on the open door, which, held open, eases on to
 *      its check stop after the underline.
 *
 * The region stands behind every exterior shot (PlaceStage); this episode never paints a full-frame
 * background. Ground-standing worlds ride the plate camera through PlaceSubject. Documents and the map
 * plan are wall views in the registry. Disclosed illustration: a generic car with no brand mark, no
 * real airport, creek, street, road, rider, record page or app screen.
 */

type V='a'|'b';
type Pt=[number,number];
type Box=[number,number,number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const DEG=180/Math.PI;
/** The board's contact curve as a plain ease, for renderer-only setup moves outside an event window
 * (a pen withdrawing, a stamp poised): zero velocity and acceleration at both ends. */
const contactQ=(q:number)=>{const x=clamp(q);return x*x*x*(20+x*(-45+x*(36-10*x)));};

// ---- the performed motion, read from the board's windows -----------------------------------------
/** Time integral (seconds) of a window's curve value from its start to t, using the same curve,
 * anticipation and settle that actionProgress uses. Lets a speed follow the board's curve exactly. */
export function curveIntegral(w:ActionWindow,t:number):number{
 const dur=w.end-w.start,a=w.motion?.anticipation??0,s=w.motion?.settle??0,curve=w.motion?.curve??'smoothstep';
 const p=clamp((t-w.start)/dur),span=1-a-s;
 if(p<=a)return 0;
 const q=clamp((p-a)/span);
 const C=curve==='contact'?q**4*(5-9*q+6*q*q-10/7*q**3):curve==='travel'?q**4*(2.5-3*q+q*q):curve==='linear'?q*q/2:q**3*(1-q/2);
 return dur*(span*C+Math.max(0,p-(1-s)))+Math.max(0,t-w.end);
}
/** Brake lamps for a car that stops between events: held lit while stopped, released as each stroke
 * starts, lit again through its braking half. */
function strokeBrake(r:number){return r<.5?1-smooth(r/.12):smooth((r-.5)/.25);}
/** Amber hazard flasher from t0: a soft-edged square wave at about 1.3 per second. */
export function blink(t:number,t0:number){return t<t0?0:clamp(.5+3*Math.sin(2*Math.PI*(t-t0)/.76-.6));}
/** A struck or released thing swinging about its pin, `tau` seconds after the impulse: amplitude `amp`
 * degrees, `hz` cycles a second, decaying at `k` per second. Zero before the impulse and zero speed
 * at it, so a later impulse adds onto a settled swing without a jump. Pure in tau. */
export function damped(tau:number,amp:number,hz:number,k:number){return tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*smooth(tau/.12);}

/** Lane speeds in car units per second: running, and rolling on into the water. vHi at the wide scale
 * keeps the entering car under about 20 px a frame; vLo keeps it rolling, never stopped. */
export const S6={vHi:850,vLo:150,kWide:.7,kPlan:.5};
/** A spoken clause's measured window, from board.narration_picture. */
export type ClauseWindow={start:number;end:number};
/** Every performed state of the film at time t. Pure: the drawing and the bound check share it. `N` holds
 * the clauses' measured windows, for the one approach that starts on a clause's first word. */
export function robotaxiState(W:Record<string,ActionWindow>,t:number,N:Record<string,ClauseWindow>={}){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const R=(id:string)=>W[id]?clamp((t-W[id].start)/(W[id].end-W[id].start)):0;
 const w=(id:string)=>W[id];
 // s1: braking in, rolling to the bay with the wheel turning, settling at the mark
 const p11=P('s1-event-1'),p12=P('s1-event-2'),p13=P('s1-event-3');
 const D1=534*p11+114*p12+23*p13;
 const phases:[string,number][]=[['s1-event-1',R('s1-event-1')],['s1-event-2',R('s1-event-2')],['s1-event-3',R('s1-event-3')]];
 let brake1=1;for(const [id,r] of phases){const x=w(id);if(x&&t>=x.start&&t<=x.end)brake1=strokeBrake(r);}
 const s1={D:D1,wheel:D1/CAR.tireR*DEG,brake:brake1,dip:1.1*Math.sin(Math.PI*smooth((R('s1-event-1')-.55)/.45))+.5*Math.sin(Math.PI*smooth(R('s1-event-3'))),
  steer:S1_STEER*(p12-p13),route:.55*p12+.45*p13,pin:.5+.5*p13,status:clamp((p13-.3)/.4)};
 // s2: the map draws in; as the limited area is named the calendar lands, the outline starts to trace
 // and the sixty square miles tag drops in at once; the outline then closes round the pins
 const w22=w('s2-event-2'),p23=P('s2-event-3');
 const s2={draw:P('s2-event-1'),cal:P('s2-event-2'),zone:.3*P('s2-event-2')+.7*p23,fill:clamp((p23-.8)/.2),
  tag:w22?smooth((t-w22.start)/S2_TAG_IN):0};
 // s3: rain and a fast brown current running LEFT (downstream). The empty car stands on the shallow shelf
 // at the bank's edge, rocked by the water, until s3-event-2: the water presses its upstream side and it
 // starts to slide along the shelf, its speed following that event's contact curve up to S3.v2; on
 // s3-event-3 the current shoves it on, its speed following the travel curve up to S3.v, so it goes off
 // the lip (`off`, by distance: its rear wheel reaches the lip, then its front wheel leaves it) and is
 // carried downstream past the fixed landmarks. Its speed only rises, so it never stops in the water.
 const w32=w('s3-event-2'),w33=w('s3-event-3');
 const D3=(w32?S3.v2*curveIntegral(w32,t):0)+(w33?(S3.v-S3.v2)*curveIntegral(w33,t):0);
 const s3={rain:.25+.75*P('s3-event-1'),flow:1.2+1.2*P('s3-event-1'),press:P('s3-event-2'),drift:D3,off:s3Off(D3)};
 // s4: the street is already under water at the clause's first word; the water spreads on and rises
 // to the wheel arches; the car creeps at a steady 60 world units a second, then its speed follows
 // s4-event-2's contact curve down to a stop; the hazards start blinking in that event
 const w42=w('s4-event-2'),t40=w('s4-event-1')?w('s4-event-1')!.start-.2:0,v4=60;
 const X4=423+v4*(Math.max(0,t-t40)-(w42?curveIntegral(w42,t):0));
 const p41=P('s4-event-1');
 const s4={front:lerp(S4.front0,S4.front1,p41),lvl:lerp(S4.lvl0,S4.lvl1,p41),X:X4,wheel:(X4-423)/.8/CAR.tireR*DEG,
  hazard:w42?blink(t,w42.start)*clamp(R('s4-event-2')*4):0,calm:P('s4-event-3')};
 // s5: card, rows, grid, counter and stamp; the stamp's blow jostles the counter tag on its pin and the
 // camera settles in on the count
 const w51=w('s5-event-1'),w53=w('s5-event-3'),r53=R('s5-event-3');
 const s5={slide:P('s5-event-1'),rows:w51?clamp((t-(w51.start+.15*(w51.end-w51.start)))/1.2):0,grid:P('s5-event-2'),
  tag:smooth(r53/.5),stamp:r53,imprint:clamp((r53-STAMP.press-.01)/.05),
  jolt:w53?damped(t-(w53.start+STAMP.press*(w53.end-w53.start)),5,1.2,2.4):0,settle:w53?smooth((t-w53.end)/1.3):0};
 // s6: running, slowing along s6-event-2's contact curve, rolling on into the water. Never zero speed.
 const w62=w('s6-event-2'),w63=w('s6-event-3'),t60=w('s6-event-1')?w('s6-event-1')!.start-.2:0;
 const X6at=(tt:number)=>S6.vHi*Math.max(0,tt-t60)+(w62?(S6.vLo-S6.vHi)*curveIntegral(w62,tt):0);
 const X6=X6at(t),Xw=w63?X6at(w63.start)+CAR.front+16:1e9;
 const r62=R('s6-event-2');
 // The camera's target C runs in car units on the same clock. It holds until s6-event-1, gains the car's
 // speed along that event's travel curve (so it never moves backward), keeps it, and on s6-event-2 sheds
 // it along the contact curve while the car only slows to vLo: the car eases forward on screen toward
 // the water and the camera settles. C0 makes the car exactly locked at the end of s6-event-1.
 const w61=w('s6-event-1'),I1=(tt:number)=>w61?curveIntegral(w61,tt):0,I2=(tt:number)=>w62?curveIntegral(w62,tt):0;
 const C0=w61?X6at(w61.end)-S6.vHi*I1(w61.end):0,C=C0+S6.vHi*(I1(t)-I2(t));
 const s6={X:X6,Xw,C,wheel:X6/CAR.tireR*DEG,brake:w62&&t>=w62.start&&t<=w62.end?clamp(r62*5)*(1-clamp((r62-.9)/.1)):0,
  dip:1.2*Math.sin(Math.PI*P('s6-event-2')),frontIn:clamp((X6+CAR.wheels[1]-Xw)/110),rearIn:clamp((X6+CAR.wheels[0]-Xw)/110),
  may:P('s6-event-3'),e1:P('s6-event-1'),e2:P('s6-event-2'),X2end:w62?X6at(w62.end):0};
 // s7: the remedy row lights, the pen rests, the stamp lands
 // the pen comes in from the right and rests at the row's right end as s7-event-2 opens, then leaves to the
 // right before the cut to the detail, so only the stamp's hand is ever at the row there; the stamp lands
 // early in its window and is carried away
 const r73=R('s7-event-3'),w72=w('s7-event-2');
 // the pen comes in for s7-event-2 and rests on the remedy row through the rest of the clause, past its
 // last word, so the tip is there while currently under development is spoken; it leaves after n7 ends
 const n7=N['n7'],penOutAt=w72?Math.max(w72.start+PEN.outAt,n7?n7.end:0):0;
 const s7={lit:P('s7-event-1'),pen:w72?smooth((t-w72.start-PEN.inAt)/PEN.inDur):0,penOut:w72?smooth((t-penOutAt)/PEN.outDur):0,
  stamp:r73,imprint:clamp((r73-STAMP.press-.01)/.05)};
 // s8: the tag enters on n8a's first word and slides along the cord, one stroke from rest to rest, braking
 // into its clip on s8-event-1 (the pinning); the cord then takes up its slack and the tag swings and
 // settles; each car takes its check left to right as every affected car is named, the vehicle map card
 // is marked updated, and the calendar flips to 20 on April twentieth
 const w81=w('s8-event-1'),w83=w('s8-event-3'),n8a=N['n8a'],in8=n8a&&w81?Math.min(n8a.start,w81.start):w81?.start??0;
 // once it has settled, the clipped tag sways a little in the wet breeze, a slow swing that fades in from rest
 const s8={tag:w81?contactQ((t-in8)/(w81.end-in8)):0,tagIn:w81?clamp((t-in8)/.12):0,tight:w81?smooth((t-w81.end-S8.tightAt)/S8.tightDur):0,
  swing:w81?damped(t-w81.end,6,1.1,2.2)+damped(t-w81.end-S8.tightAt,3.5,1.3,2.6):0,
  sway:w81?1.6*Math.sin(2*Math.PI*.42*(t-w81.end))*smooth((t-w81.end-.8)/1.4):0,
  flip:P('s8-event-2'),checks:P('s8-event-3'),updated:w83?smooth((t-w83.end)/.6):0};
 // s9: door opens, card slides in, remedy underlined
 // the held-open door eases on to its check stop after the underline: the last small movement of the ride
 const w93=w('s9-event-3');
 const s9={door:P('s9-event-1')+(w93?(DOOR_STOP-1)*smooth((t-w93.end-.15)/1.1):0),slide:P('s9-event-2'),underline:P('s9-event-3')};
 return {s1,s2,s3,s4,s5,s6,s7,s8,s9};
}
export type RobotaxiState=ReturnType<typeof robotaxiState>;

// ---- layout. Every number a frame-edge bound depends on is here and exported, so the bound check
// composes the values this file draws with (Cam, then the plate camera's PlaceSubject). ------------
export const CURB_CAR={y:1240,s:.88,x0:80};
export const curbCarX=(D:number)=>CURB_CAR.x0+D*CURB_CAR.s;
/** s3's car: its start on the shelf (world x of its centre, 191 units upstream of the lip, so its tail
 * stands at the lip's edge) and its scale. `y` is the row the creek world is grounded on. */
export const CREEK_CAR={x:CREEK_MARKS.lip+191,s:.72,y:1236};
/** s3's two cameras, both LOCKED: world point f lands on screen point a at scale s for the whole shot, so
 * the bank, the shelf's lip, the landmark oak and the ledge never move and the car's travel past them is
 * the current's. The wide holds the whole reach, the ledge to the near bank; the medium holds the reach
 * the car is carried down, from the lip past the oak to the ledge. */
export const CREEK_CAM={wide:{f:[540,1012] as Pt,s:1,a:[540,960] as Pt},swept:{f:[458,1070] as Pt,s:1.18,a:[540,960] as Pt}};
/** s4's floodwater: its front and depth at the clause's first word and at the end of s4-event-1. */
export const S4={front0:960,front1:1260,lvl0:24,lvl1:66};
/** s2: how long the sixty square miles tag takes to drop in from the start of s2-event-2 (seconds). */
export const S2_TAG_IN=.35;
export const STREET_CAR={y:1222,s:.8};
export const LANE_CAR={s:.7};
/** s8's fleet in the wide: the same four cars side by side in a row of stalls that runs away from the
 * camera toward the upper right, the nearest at the lower left, so each stands a stall deeper, smaller and
 * higher than the one before it, every roof pod clears the car in front, and the row fills the frame. Base
 * points and scales, listed left to right, the order the checks land in. */
export const LOT_CARS={xs:[290,500,705,905],ys:[1265,1170,1088,1012],ss:[1,.84,.71,.6]};
/** The tear-off calendar on the far (right) pole and the vehicle map card clipped on the cord, in the wide. */
export const LOT_AT={calendar:[934,612] as Pt,calendarW:140,map:[863,0] as Pt,mapW:180};
/** s8's close, a separately staged low view at the near end of the same row (screen pixels): the eye at
 * door height on LOT_CLOSE.horizon, so each car's window line sits on it; the nearest car large at the
 * left with its roof pod under the lens, the other three receding toward the right edge. The tag hangs
 * clipped on the cord at `tagX` near the lens, the map card at `mapX`, the calendar on the far pole. */
export const CLOSE_CARS={xs:[430,686,826,920],ys:[1248,1166,1121,1091],ss:[1.55,1,.7,.5]};
export const CLOSE_AT={tagX:345,tagSize:50,mapX:780,mapW:210,calendar:[988,640] as Pt,calendarW:150};
/** s8's cord: when it takes up its slack after the tag clips (seconds after s8-event-1 ends), how long
 * that takes, and how much of the sag it removes. */
export const S8={tightAt:.1,tightDur:.8,tightBy:.7};
/** Where the tag pins and the calendar lies in B's lot plan. */
export const LOT_PLAN_AT={calendar:[960,404] as Pt,calendarW:150};
/** A check badge's centre over a side-view car's roof pod (the dome spans car x -78 to -2, its top at -249),
 * and its radius, for a car at base point (x, y) and scale s. */
/** The painted stall lines under a side-on row of cars (base points xs, ys, scales ss, nearest first): a
 * level divider midway in depth between each pair of stalls, one in front of the nearest and one behind the
 * farthest, and the stall-end line running away through the cars' rear ends. */
export function stallsFor(xs:number[],ys:number[],ss:number[]){
 const n=xs.length,rear=(i:number)=>xs[i]-264*ss[i],front=(i:number)=>xs[i]+264*ss[i];
 const dividers:[number,number,number][]=[[rear(0)-40,front(0)+40,ys[0]+(ys[0]-ys[1])*.55]];
 for(let i=0;i+1<n;i++)dividers.push([(rear(i)+rear(i+1))/2-20,(front(i)+front(i+1))/2+30,(ys[i]+ys[i+1])/2]);
 dividers.push([rear(n-1)-20,front(n-1)+40,ys[n-1]-(ys[n-2]-ys[n-1])*.5]);
 return {dividers,ends:xs.map((_,i)=>[rear(i)-18,ys[i]+(i?(ys[i-1]-ys[i])*.12:30)] as Pt)};
}
export const podCheck=(x:number,y:number,s:number)=>{const r=Math.max(24,46*s);return {c:[x-40*s,y-249*s-r-10] as Pt,r};};
/** A check badge on a roof pod seen from above, for a car facing up at (x, y) and scale s: on the dome. */
export const podCheckTop=(x:number,y:number,s:number)=>({c:[x+26*s,y+40*s-26*s] as Pt,r:Math.max(26,30*s)});
export const CARD_W=760;
/** Which of the record's rows each scene shows: the recall type and count in s5; the recall type, count
 * and remedy in s7 (the summary sentence has its own card in s6). The interim rows (the weather limits and
 * the April 20th date) are never on the card. */
export const CARD_ROWS:{s5:number;s7:number[]}={s5:2,s7:[0,1,3]};
export const COUNT_TAG={at:[300,772] as Pt,size:40,lines:['Nearly 3,800','vehicles','3,791 potentially','affected in the record']};
/** s5's grid of car icons, under the counter tag and above the caption band. */
export const COUNT_GRID={at:[56,1000] as Pt,cols:10,rows:5,dx:82,dy:50};
/** s5's slow push in on the count after the stamp lands: the point it closes on and how far. */
export const COUNT_PUSH={at:[540,700] as Pt,by:.05};
export const LOT_TAG={x:495,size:38};
/** Where the weather limits tag starts its slide: its right half already in frame at the left edge, so
 * it is on screen from the clause's first word. */
export const S8_TAG_FROM=40;
/** s1 overhead: the car comes up the curb lane, k plan pixels per car unit, to the bay at y 810. */
export const CURB_PLAN_CAR={y0:1347,k:.8};
export const MAP_CAL={stand:[760,600] as Pt,from:[1190,1150] as Pt,flat:[230,1010] as Pt,plan:[230,990] as Pt};
export const PHONE_HAIL={at:[96,646] as Pt,rot:-5,w:300};
/** The rider's phone screen as an inset while the hail and the arrival are spoken: top left of the
 * frame below the disclosure chip, clear of the county locator. */
export const PHONE_INSET={at:[60,300] as Pt,w:250};
/** s9's record: the remedy row on its own card, sliding into the foreground (record-slide) and in the
 * split's lower panel beside the phone (curb-record-split). */
export const REMEDY_AT={'record-slide':{x:40,y:890,s:.84,back:[300,1030] as Pt,backS:.5},'curb-record-split':{x:36,y:890,s:.84,phone:[772,890] as Pt,phoneW:140,panelY:880}};
/** s9's split: how far the top panel's camera closes on the open door over the shot; and how far the
 * curb closes behind the sliding record card, which then settles toward the viewer by `SLIDE_SETTLE` px. */
export const SPLIT_PUSH=.06,SLIDE_PUSH=.05,SLIDE_SETTLE=14;
/** Where the s5 card starts its slide: still mostly in frame at the desk's right edge, so the record is
 * on screen from the clause's first word. */
export const S5_SLIDE={dx:300,dy:40};
/** Where the record card sits in each document view: top left and scale. */
export const CARD_AT:Record<string,{x:number;y:number;s:number}>={
 'record-desk':{x:120,y:740,s:1.0},'count-grid':{x:70,y:236,s:1.0},'record-wall':{x:140,y:280,s:1.0},'record-wall-s5':{x:122,y:560,s:1.04},
 'record-close':{x:80,y:280,s:1.0},'stamp-detail':{x:22,y:236,s:1.1}};
/** The s5 and s7 stamp marks, in card units: software recall in the header's slot, off every data row;
 * under development in the remedy row's slot under its words. They stay on the card for the rest of
 * the film. */
export function cardImprints(st:RobotaxiState):Imprint[]{
 const S=stampSlots(CARD_W,CARD_ROWS.s7);
 return [{text:'Software recall',p:st.s5.imprint,x:S.header.x,y:S.header.y,rot:-4,size:STAMP_SIZE.header},
  {text:'Under development',p:st.s7.imprint,x:S.remedy.x,y:S.remedy.y,rot:-4,size:STAMP_SIZE.remedy,solid:true}];
}
/** s3: the car's waterline in car units standing on the shelf and once it is off the lip (the water climbs
 * its doors), its speeds downstream in world units a second (v2 sliding along the shelf, v carried in the
 * channel), how far its tail drops going off the lip (degrees), its bob once it floats, and the current's
 * own speed (the ripples and riffles, negative runs left), faster than the car so the water streams past it.
 * The water surface row never moves. */
export const S3={wlShelf:44,wlDeep:118,v2:170,v:240,tip:7,bob:3,drift:-520};
/** How far the car is off the shelf, 0 to 1, by distance carried: from its rear wheel reaching the lip to
 * its front wheel leaving it. */
export function s3Off(D:number){
 const x=CREEK_CAR.x-D,ks=CREEK_CAR.s,lip=CREEK_MARKS.lip;
 return smooth((lip-(x+CAR.wheels[0]*ks))/((CAR.wheels[1]-CAR.wheels[0])*ks));
}
/** The car pose in s3 at time t: base point, scale and rotation. Pure, shared with the bound check. On the
 * shelf the current only rocks it as it presses; going off the lip its tail drops first, then it floats,
 * still a little tail down, bobbing and rolling in the current. */
export function s3Car(st:RobotaxiState,t:number){
 const {press,drift,off}=st.s3,ks=CREEK_CAR.s,wl=lerp(S3.wlShelf,S3.wlDeep,off);
 const tip=off<.6?Math.sin(Math.PI/2*off/.6):1-.65*smooth((off-.6)/.4);
 const rock=(1-off)*(.3+.7*press)*.8*Math.sin(2*Math.PI*1.1*t);
 const bob=off*S3.bob*Math.sin(2*Math.PI*.8*t),roll=off*.9*Math.sin(2*Math.PI*.6*t+1);
 return {p:[CREEK_CAR.x-drift,CREEK.waterY+wl*ks+bob] as Pt,ks,rot:-S3.tip*tip+rock+roll,wl};
}
/** s1: how far the steering wheel turns by itself as the car swings into the bay (degrees). */
export const S1_STEER=85;
/** The stamp choreography's share of its event window: pressing down onto the mark, then the hold. */
export const STAMP={press:.13,hold:.08};
/** `dir` is the arm's direction; `from` and `away`, when given, are the ways the stamp comes in and is
 * carried off (both default to the arm's direction), so a stamp can arrive and leave level from the side
 * while the arm runs up to its shoulder. */
export type StampPlan={approach:number;reach:number;dir:Pt;from?:Pt;away?:Pt;v:number;arm:number};
export type StampPose={base:Pt;lift:number;squash:number};
/** The stamp's footprint centre and lift at time t (screen pixels). Before its event it comes in raised,
 * along its arm, to hang over the mark; it presses down in the first STAMP.press of the window (contact
 * curve), holds, then lifts and is carried away along the arm, its speed ramping to v. The footprint
 * stays over the mark and the slot it lands in, so neither stamp nor hand crosses the row's words. */
export function stampPose(win:ActionWindow|undefined,t:number,mark:Pt,o:StampPlan):StampPose{
 const fr=o.from??o.dir,A:Pt=[mark[0]+fr[0]*o.reach,mark[1]+fr[1]*o.reach];
 if(!win)return {base:A,lift:1,squash:0};
 const dur=win.end-win.start,r=(t-win.start)/dur,a1=win.start-.1,a0=a1-o.approach;
 if(t<a1){const q=contactQ((t-a0)/o.approach);return {base:[lerp(A[0],mark[0],q),lerp(A[1],mark[1],q)],lift:1,squash:0};}
 if(r<0)return {base:mark,lift:1,squash:0};
 if(r<STAMP.press)return {base:mark,lift:1-contactQ(r/STAMP.press),squash:0};
 if(r<STAMP.press+STAMP.hold)return {base:mark,lift:0,squash:.05*Math.sin(Math.PI*(r-STAMP.press)/STAMP.hold)};
 const tau=(r-STAMP.press-STAMP.hold)*dur,Tr=.12,q=tau/Tr;
 const d=tau<Tr?o.v*Tr*(q*q*q-q*q*q*q/2):o.v*(Tr/2+tau-Tr),aw=o.away??o.dir;
 return {base:[mark[0]+aw[0]*d,mark[1]+aw[1]*d],lift:contactQ(tau/.16),squash:0};
}
/** The pen in s7: angle of its body (down and to the right of its tip), the arm's direction (off the right
 * edge, the side the stamp's arm comes from), how far it comes in and goes out along its own axis, where
 * the fingers hold it, and its timing against s7-event-2's start: in from 0.55 s before to 0.05 s after,
 * resting with its tip just past the remedy sentence's last word, out from 0.2 s to 0.56 s after, gone
 * at the cut. */
export const PEN={rot:8,armDir:[.99,.14] as Pt,reach:330,out:250,grip:110,inAt:-.55,inDur:.6,outAt:.2,outDur:.36};
/** s5: as in s7, the stamp comes in raised along its own forearm from the lower right, below the title and
 * right of the short row values, hangs over the header slot, presses, and is carried back off along the
 * forearm. */
export const S5_STAMP:StampPlan={approach:1.15,reach:520,dir:[.92,.39],v:700,arm:.85};
/** s7: the detail opens with the stamp already coming in raised from the lower right; its arm runs out
 * to the right and down, below the remedy sentence, so neither the hand nor the forearm covers a word. */
export const S7_STAMP:StampPlan={approach:.7,reach:330,dir:[.92,.39],v:700,arm:.95};
export type Cam={f:Pt;s:number;a:Pt};
const ID:Cam={f:[540,960],s:1,a:[540,960]};
/** The camera for each view at time t: world point f lands on screen point a at scale s. */
export function viewCam(view:string,sid:string,v:V,t:number,st:RobotaxiState,shot:{start_s:number;duration_s:number}):Cam{
 switch(view){
 case 'phone-hail':return {f:[680,1150],s:.9,a:[640,1100]};
 // s9 split: the top panel closes slowly on the open door through the shot, starting and ending at rest
 case 'curb-record-split':{const u=smooth((t-shot.start_s)/shot.duration_s);return {f:[600,1100],s:1.3*(1+SPLIT_PUSH*u),a:[540,540]};}
 // s9 slide: the curb closes slowly behind the record card through the shot, starting and ending at rest
 case 'record-slide':{const u=smooth((t-shot.start_s)/shot.duration_s);return {f:[640,1120],s:1+SLIDE_PUSH*u,a:[600,760]};}
 // s3: both cameras are locked on the bank; only the car and the water move
 case 'creek-wide':return CREEK_CAM.wide;
 case 'car-swept':return CREEK_CAM.swept;
 // s4 detail: the whole car, hazard lamps to tail, centred on it as it creeps and stops
 case 'hazard-close':{const e=st.s4.calm,x=st.s4.X;return {f:[x+lerp(40,20,e),1100],s:1.6,a:[540,940]};}
 case 'wheel-water':{const e=st.s4.calm,x=st.s4.X;return {f:[x,lerp(1150,1110,e)],s:lerp(1.35,1.5,e),a:[540,930]};}
 case 'lane-wide':return {f:[st.s6.C*S6.kWide+180,960],s:1,a:[540,960]};
 case 'wheels-water':{const k=S6.kWide;return {f:[(st.s6.X+CAR.wheels[1])*k-75,1180],s:1.5/k,a:[540,1000]};}
 case 'lane-plan':return {f:[540,1400-st.s6.C*S6.kPlan-140],s:1,a:[540,960]};
 // s8: the wide and the close are each drawn in their own frame pixels and held; the place stage's own
 // move is the only camera movement
 case 'calendar-fleet':case 'limits-tag':return ID;
 case 'map-zone':case 'map-table':case 'map-plan':return ID;
 default:return ID;
 }
}

// ---- small drawing helpers -------------------------------------------------------------------------
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${r.toFixed(3)}) scale(${s.toFixed(4)})`} opacity={o}>{children}</g>;
/** The place stage's plate centre in film pixels, about which its framing zoom scales a grounded subject. */
export const PLATE_CENTRE:Pt=[540,960];
/** Cam is the composite framing a view wants. A grounded subject is already scaled by the place stage's
 * framing zoom z about the plate centre, so the group applies scale s/z about the matching focus, and
 * the composite is the authored one. Overlays never sit inside a CamG. */
export function camTransform(c:Cam,z:number,outer=false){
 if(outer)return {a:[PLATE_CENTRE[0]+(c.a[0]-PLATE_CENTRE[0])/z,PLATE_CENTRE[1]+(c.a[1]-PLATE_CENTRE[1])/z] as Pt,s:c.s/z,f:c.f};
 const fx=PLATE_CENTRE[0]+z*(c.f[0]-PLATE_CENTRE[0]),fy=PLATE_CENTRE[1]+z*(c.f[1]-PLATE_CENTRE[1]);
 return {a:c.a,s:c.s/z,f:[fx,fy] as Pt};
}
/** Views whose world runs thousands of units along a road ground AFTER the camera: the stage's move
 * then acts on the framed picture at the car's screen base row, not on far world coordinates. */
export const OUTER_GROUND=new Set(['lane-wide','wheels-water']);
/** The screen row a camera puts a world row on, before the stage's own zoom. */
export const screenRow=(c:Cam,y:number)=>c.a[1]+c.s*(y-c.f[1]);
const CamG:React.FC<{c:Cam;z:number;outer?:boolean;children:React.ReactNode}>=({c,z,outer=false,children})=>{const k=camTransform(c,z,outer);
 return <g transform={`translate(${k.a[0].toFixed(2)} ${k.a[1].toFixed(2)}) scale(${k.s.toFixed(5)}) translate(${(-k.f[0]).toFixed(2)} ${(-k.f[1]).toFixed(2)})`}>{children}</g>;};
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;
/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
const Clip:React.FC<{k:string;box:Box;children:React.ReactNode}>=({k,box,children})=>
 <g><defs><clipPath id={'rtxclip-'+k}><rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]}/></clipPath></defs>
  <g clipPath={`url(#rtxclip-${k})`}>{children}</g></g>;
const mirrorAbout=(y:number,node:React.ReactNode)=><g transform={`matrix(1 0 0 -1 0 ${2*y})`}>{node}</g>;
const side=(p:Pt,s:number,o:SideProps,r=0,flip=false)=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${r.toFixed(3)}) scale(${(flip?-s:s).toFixed(4)} ${s.toFixed(4)})`}><RobotaxiHero part="side" {...o}/></g>;
const top=(p:Pt,s:number,rot:number,o:TopProps)=>
 <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) rotate(${rot}) scale(${s})`}><RobotaxiHero part="top" {...o}/></g>;
/** The car's box in world units for a side drawing at p, scale s. */
export const sideBox=(p:Pt,s:number):Box=>[p[0]+SIDE_BOX[0]*s,p[1]+SIDE_BOX[1]*s,p[0]+SIDE_BOX[2]*s,p[1]+SIDE_BOX[3]*s];
export const topBoxUp=(p:Pt,s:number):Box=>[p[0]-TOP_BOX[3]*s,p[1]-TOP_BOX[2]*s,p[0]-TOP_BOX[1]*s,p[1]-TOP_BOX[0]*s];

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
/** The chip's box for a disclosure string, shared with the frame-edge check. */
export function disclosureBox(text:string):Box{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}

export const RobotaxiFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Robotaxi film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Robotaxi film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const N=Object.fromEntries(board.narration_picture!.clauses.map(c=>[c.id,{start:c.start_s,end:c.end_s}]));
 const S=robotaxiState(W,t,N);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id,view=shot.view,fr=shot.framing;
 const exterior=!scene.interior&&fr!=='overhead';
 const flat=ad.flat_shots?.[sid];
 const cam=viewCam(view,sid,v,t,S,shot);
 const place=usePlace(),z=place&&place.mode==='exterior'?place.zoom:1;
 const imprints=cardImprints(S);
 const rain=(amount:number)=><SanAntonioSupport part="rain" t={t} amount={amount}/>;
 const tag=(lines:string[],shown:number,o:{size?:number;tone?:'paper'|'accent'|'ink';icon?:'rain';sub?:number;dir?:number;swing?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${(-36*(1-smooth(shown))).toFixed(2)})`} opacity={clamp(shown*3)}>
   <SanAntonioSupport part="tag" lines={lines} size={o.size} tone={o.tone} icon={o.icon} sub={o.sub} swing={9*(1-smooth(shown))*(o.dir??1)+(o.swing??0)}/></g>;
 /** A steel spring clip closed on the cord at p, `h` pixels tall, holding what hangs below it. */
 const clipOn=(p:Pt,h:number)=><g data-part="cord-clip" transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`}>
  <rect x={-h*.32} y={-h*.55} width={h*.64} height={h*1.25} rx={h*.16} fill="#5E666B" stroke="#2E3238" strokeWidth={Math.max(1,h*.1)}/>
  <rect x={-h*.2} y={-h*.45} width={h*.14} height={h*1.05} rx={h*.06} fill="#B9C0C4" opacity={.8}/></g>;
 const card=(k:string,o:{rows:number;pick:number|number[];lit?:number;underline?:number})=>{const c=CARD_AT[k];
  return <At p={[c.x,c.y]} s={c.s}><SanAntonioSupport part="record" w={CARD_W} rows={o.rows} pick={o.pick} remedyLit={o.lit} underline={o.underline} imprints={imprints}/></At>;};
 /** The rubber stamp at a pose from stampPose, seen from above as the card is: its footprint `w` by `h`
  * screen pixels, the size of the mark it leaves, turned to the mark's angle; the hand closes over its
  * knob and the forearm runs off the frame along the plan's direction, with its shadow on the paper. */
 const stampAt=(pose:StampPose,w:number,h:number,rot:number,plan:StampPlan)=>{
  const {base,lift,squash}=pose,a=rot*Math.PI/180,ky=stampKnob(h,lift),knob:Pt=[base[0]-ky*Math.sin(a),base[1]+ky*Math.cos(a)];
  return <g data-part="stamping">
   <At p={base}><g transform={`rotate(${rot}) scale(${(1+squash).toFixed(4)} ${(1-squash).toFixed(4)})`}><SanAntonioSupport part="stamp" w={w} h={h} lift={lift}/></g></At>
   <At p={knob}><SanAntonioSupport part="arm" dir={plan.dir} grip="knob" scale={plan.arm} shadow={.6+.4*lift}/></At></g>;
 };
 const cardPoint=(k:string,lx:number,ly:number):Pt=>{const c=CARD_AT[k];return [c.x+c.s*lx,c.y+c.s*ly];};
 /** The rider's phone screen as an inset: the request while the hail is spoken, arriving at the close. */
 const phoneInset=(id:string,status:number,pin:number)=><Item id={id}><g data-part="phone-inset">
  <At p={PHONE_INSET.at}><SanAntonioSupport part="phone" w={PHONE_INSET.w} pin={pin} status={status} t={t}/></At></g></Item>;

 // ---- the curb, shared by s1 and s9 eye-level views ----
 const s1Car=side([curbCarX(S.s1.D),CURB_CAR.y],CURB_CAR.s,{wheel:S.s1.wheel,brake:S.s1.brake,dip:S.s1.dip,cabin:.6});
 const s9Car=side([curbCarX(671),CURB_CAR.y],CURB_CAR.s,{wheel:671/CAR.tireR*DEG,brake:0,door:S.s9.door,cabin:.7});
 const benchPhone=(status:number,pin:number)=><g transform="translate(330 1040) rotate(-12) scale(.12)"><SanAntonioSupport part="phone" w={300} pin={pin} status={status} t={t}/></g>;
 const curbWorld=(car:React.ReactNode,ids:{curb:string;car:string;phone?:string},phone?:React.ReactNode)=>
  <Grounded baseY={CURB_CAR.y} on={exterior}>
   <Item id={ids.curb}><SanAntonioSupport part="curb" phone={ids.phone&&phone?<Item id={ids.phone}>{phone}</Item>:undefined}/></Item>
   <Item id={ids.car}>{car}</Item>
  </Grounded>;

 let pic:React.ReactNode;
 switch(view){
 case 'curb-wide':{
  // s1 wide, eye level across the pickup lane. The car starts half in frame at the left, pulls away,
  // and brakes into the bay on s1-event-1's travel curve; its brake lamps flare as it slows and stay
  // lit while it waits. The canopy, the leaning bay sign and the suitcase say airport without words.
  pic=<g><CamG c={cam} z={z}>{curbWorld(s1Car,{curb:'s1-curb',car:'s1-car'})}</CamG>{phoneInset('s1-phone',S.s1.status,S.s1.pin)}</g>;
  break;}
 case 'cab-wheel':{
  // s1 detail from the rear seat: the steering wheel turns right and back on s1-event-2's contact
  // curve with no hands on it and nobody in the driver seat, while the curb and the bay sign slide past
  // the windshield as the car rolls to its bay. The region's own sky and oaks stand through the glass.
  const roll=114*clamp(S.s1.D>=534?(S.s1.D-534)/114:0);
  const k=1+.0021*roll,sx=lerp(720,930,roll/114);
  const outside=<g data-part="through-windshield" data-item="s1-curb">
   <path d={`M70 900L1010 860L1010 1000L70 1000Z`} fill="#4E5156"/>
   <path d={`M${lerp(560,420,roll/114)} 930L1010 ${lerp(842,836,roll/114)}L1010 820L${lerp(600,470,roll/114)} 912Z`} fill="#D3CBBB"/>
   <path d={`M${lerp(560,420,roll/114)} 930L1010 ${lerp(842,836,roll/114)}`} stroke="#EFEAE0" strokeWidth={4}/>
   <g transform={`translate(${sx} 905) scale(${k}) rotate(3)`}>
    <rect x={-7} y={-380} width={14} height={380} fill="#6D7479"/>
    <rect x={-80} y={-470} width={160} height={150} rx={12} fill="#2E4A62" stroke="#1E3346" strokeWidth={3}/>
    <path d="M-44 -420l34 -4l20 -24l9 2l-10 22l26 -2l8 -10l7 1l-5 13l5 13l-7 1l-8 -10l-26 -2l10 22l-9 2l-20 -24l-34 -4Z" fill="#E9EEF2"/>
    <path d="M-48 -352l8 -18c4 -8 12 -12 22 -12h36c10 0 18 4 22 12l8 18v12h-96Z" fill="#E9EEF2"/>
   </g>
  </g>;
  pic=<g><Item id="s1-car"><Item id="s1-wheel"><RobotaxiHero part="cab" steer={S.s1.steer} outside={outside} route={S.s1.route}/></Item></Item>
   {phoneInset('s1-phone',S.s1.status,S.s1.pin)}</g>;
  break;}
 case 'phone-hail':{
  // s1 close: the phone stands against the suitcase handle on the bench, its request pin reaches the
  // curb and the card turns to arriving on s1-event-3, while behind it the car settles at the bay mark.
  pic=<g>
   <CamG c={cam} z={z}>{curbWorld(s1Car,{curb:'s1-curb',car:'s1-car'})}</CamG>
   <g data-part="bench-foreground">
    <path d="M-40 1244L1120 1222L1120 1520L-40 1520Z" fill="#7E878C"/>
    {[0,1,2,3,4,5].map(k=><path key={k} d={`M-40 ${1244+k*48}L1120 ${1222+k*50}`} stroke="#5C6468" strokeWidth={6}/>)}
    <path d="M-40 1244L1120 1222" stroke="#C3CACE" strokeWidth={5}/>
    <ellipse cx={300} cy={1242} rx={150} ry={9} fill="#141618" opacity={.38}/>
   </g>
   <Item id="s1-phone"><At p={PHONE_HAIL.at} r={PHONE_HAIL.rot}><SanAntonioSupport part="phone" w={300} pin={S.s1.pin} status={S.s1.status} t={t}/></At></Item>
  </g>;
  break;}
 case 'map-table':
 case 'map-plan':
 case 'map-zone':{
  // s2. A: the map lies on a weathered picnic table, seen at an angle, and draws in; then the close
  // looks down on it as the February calendar lands and the outline closes. B: straight down on the
  // map (a wall view) as it draws in, then the same close.
  const plan=view==='map-plan',close=view==='map-zone';
  const mw=close?860:plan?860:780,mh=close?980:plan?900:760,mx=close?110:plan?110:90,my=close?330:plan?290:800,sy=close?.92:plan?1:.58;
  const mapAt=(layer:'base'|'zone'|'pins')=><g transform={`translate(${mx} ${my}) scale(1 ${sy})`}><SanAntonioSupport part="map" w={mw} h={mh} draw={S.s2.draw} zone={S.s2.zone} fill={S.s2.fill} t={t} layer={layer}/></g>;
  // in the close the calendar comes in from the lower right, the side it stood on in the wide, and slides
  // along the map's bottom edge to its corner, below the pins and the outline, so it never crosses them
  const cal=close?<At p={[lerp(MAP_CAL.from[0],MAP_CAL.flat[0],S.s2.cal),lerp(MAP_CAL.from[1],MAP_CAL.flat[1],S.s2.cal)]} r={lerp(16,-4,S.s2.cal)} s={lerp(1.12,1,S.s2.cal)}>
   <SanAntonioSupport part="calendar" month="February" w={200}/></At>
   :plan?<At p={MAP_CAL.plan} r={-4}><SanAntonioSupport part="calendar" month="February" w={200}/></At>
   :<At p={MAP_CAL.stand}><SanAntonioSupport part="calendar" month="February" w={180}/></At>;
  const zx=mx+.7*mw,zy=my+.3*mh*sy;
  pic=<g>
   {!plan&&<SanAntonioSupport part="table" y0={close?300:780}/>}
   {plan&&<rect x={mx-30} y={my-30} width={mw+60} height={mh+60} rx={10} fill="#3B3F46" opacity={.18}/>}
   <Item id="s2-map">{mapAt('base')}</Item>
   {close&&<Item id="s2-zone">{mapAt('zone')}</Item>}
   <Item id="s2-pin">{mapAt('pins')}</Item>
   <Item id="s2-calendar">{cal}</Item>
   {close&&<At p={[zx-10,zy-210]}>{tag(['60 square miles','Limited area'],S.s2.tag,{size:40})}</At>}
  </g>;
  break;}
 case 'creek-wide':
 case 'car-swept':{
  // s3, an illustration of the April 20th account: a DIFFERENT car from the airport ride. The camera is
  // locked on the bank. Rain streaks in and fast brown water runs left along the limestone bank; an empty
  // car stands on the shallow shelf at the near bank's edge from the first frame (nothing shows how it got
  // there). On s3-event-2 the water piles against its upstream nose, a bow wave builds and it slides along
  // the shelf; on s3-event-3 the current shoves it off the lip, tail first, and carries it downstream past
  // the landmark oak toward the ledge, the water climbing its doors, cabin still empty. No crossing, no
  // gauge, no damage. ONE brown sheet runs the whole creek: behind the car, and the same sheet closing over
  // its lower body in front of it, with the foam line where the current meets it and its reflection.
  const {p,ks,rot,wl}=s3Car(S,t),pr=S.s3.press,wy=CREEK.waterY,half=258*ks;
  const car=side(p,ks,{wheel:0,brake:0,wetTo:wl+10,shadow:0,cabin:1},rot);
  // the sheet's far edge follows the far bank's wandering toe (creekToe), the same row its lowest stone course
  // and slumped blocks stand in, so the water never meets the bank along a ruled line
  const ext={x0:-300,x1:1500,y0:CREEK.bankY-20,y1:1960},toe=creekToePts(ext.x0,ext.x1,24);
  const foot=`M${ext.x0} ${ext.y1}L${toe[0][0].toFixed(1)} ${toe[0][1].toFixed(1)}`+smoothPath(toe,false).replace(/^M[^C]*/,'')+`L${ext.x1} ${ext.y1}Z`;
  const sheet=(layer:'back'|'front')=><SanAntonioSupport part="flood" layer={layer} foot={foot} {...ext} t={t} drift={S3.drift} seed={17} marks={170} lit={.002}
   line={{y:wy,x0:p[0]-half,x1:p[0]+half}} reflect={mirrorAbout(wy,car)} press={pr}/>;
  // the bow wave on the upstream end grows as the water presses and stays while the current carries it
  const bow=.3+.7*pr+.25*S.s3.off;
  const world=<Grounded baseY={CREEK_CAR.y} on={exterior}>
   <Item id="s3-creek"><SanAntonioSupport part="creekback" t={t} flow={S.s3.flow} width={[ext.x0,ext.x1]}/>{sheet('back')}
    <SanAntonioSupport part="creektoe" t={t} width={[ext.x0,ext.x1]}/><SanAntonioSupport part="creekledge" t={t}/></Item>
   <Item id="s3-crossing"><SanAntonioSupport part="creekshelf" t={t} layer="back" drift={S3.drift}/></Item>
   <Item id="s3-car">{car}</Item>
   {sheet('front')}
   <g data-part="current-on-car"><At p={[p[0]+half,wy]} s={ks*1.15}><SanAntonioSupport part="pile" p={bow} t={t} len={258} h={150} dir={1}/></At></g>
   <Item id="s3-crossing"><SanAntonioSupport part="creekshelf" t={t} layer="front" drift={S3.drift}/><SanAntonioSupport part="creekbank" t={t}/></Item>
  </Grounded>;
  pic=<g><CamG c={cam} z={z}>{world}</CamG><Item id="s3-rain">{rain(S.s3.rain)}</Item></g>;
  break;}
 case 'creek-plan':{
  // s3 from above, locked: the brown channel runs across the frame and its current runs LEFT, as in the
  // elevation shots; the white roof and dome stand nose upstream (right) on the pale shallow shelf at the
  // near bank's edge, a bow wave builds on the nose and wakes trail downstream; the same distance the
  // elevation carries it moves it left, and going off the shelf takes it out into the channel, yawing.
  const {carX,edgeY,carY,k}=CREEK_PLAN,pr=S.s3.press,off=S.s3.off,cx=carX-k*S.s3.drift,cy=lerp(edgeY,carY,off);
  pic=<g>
   <Item id="s3-creek"><Item id="s3-crossing"><Item id="s3-rain"><SanAntonioSupport part="creekplan" t={t} rain={S.s3.rain} flow={S.s3.flow}/></Item></Item></Item>
   <Item id="s3-car">{top([cx,cy],.5,-12*off+2*(1-off)*pr*Math.sin(2*Math.PI*1.1*t),{shadow:.2,wetTo:lerp(30,90,off)})}
    {pr>0&&<path d={`M${cx+118} ${cy-64}Q${cx+136+56*pr} ${cy} ${cx+118} ${cy+64}`} stroke="#E9E1CF" strokeWidth={8} fill="none" opacity={clamp(pr*1.5)}/>}
    {[-1,1].map(sgn=><path key={sgn} d={`M${cx-128} ${cy+sgn*52}q-40 ${sgn*12} -120 ${sgn*30}`} stroke="#E9E1CF" strokeWidth={4} fill="none" opacity={.4+.4*pr}/>)}</Item>
  </g>;
  break;}
 case 'street-flood':
 case 'hazard-close':
 case 'wheel-water':{
  // s4. Floodwater spreads from the left along a residential street and climbs to the wheel arches of
  // an empty car as it creeps; the car stops along s4-event-2's contact curve and its amber hazards
  // start to blink; closer, the camera finds the empty cabin while the water stills. The mud line stays.
  const {y,s}=STREET_CAR,lvl=S.s4.lvl,xc=S.s4.X,wl=y-lvl;
  const carProps:SideProps={wheel:S.s4.wheel,hazard:S.s4.hazard,wetTo:Math.max(0,lvl-6)/s,cabin:view==='street-flood'?.6:1,brake:S.s4.calm>0?.4:0};
  const car=side([xc,y],s,carProps);
  const front=S.s4.front;
  // ONE sheet of floodwater spreads along the street with a lobed leading edge; the same sheet closes over
  // the wheels in front of the car up to its waterline, which rises to the arches.
  const ext={x0:-160,x1:1240,y0:STREET.farCurb+12,y1:STREET.nearCurb+2},foot=floodFoot(front,ext.y0,ext.y1,t);
  const sheet=(layer:'back'|'front')=><SanAntonioSupport part="flood" layer={layer} foot={foot} {...ext} t={t} drift={70} calm={S.s4.calm} seed={11}
   line={{y:wl,x0:xc-250*s,x1:xc+250*s}} reflect={mirrorAbout(wl,car)}/>;
  const world=<Grounded baseY={y} on={exterior}>
   <Item id="s4-street"><SanAntonioSupport part="street" soft={view==='hazard-close'?3.2:view==='wheel-water'?2:0}/></Item>
   <Item id="s4-water">{sheet('back')}</Item>
   <Item id="s4-car"><Item id="s4-hazard">{car}</Item></Item>
   {sheet('front')}
  </Grounded>;
  pic=<CamG c={cam} z={z}>{world}</CamG>;
  break;}
 case 'street-plan':{
  // s4 from above: the water front runs along the street around the roof and dome of the car, which
  // creeps and stops; its four amber corners start blinking.
  const {y0,y1}=STREET_PLAN;
  pic=<g>
   <Item id="s4-street"><Item id="s4-water"><SanAntonioSupport part="streetplan" t={t} front={S.s4.front} calm={S.s4.calm}/></Item></Item>
   <Item id="s4-car"><Item id="s4-hazard">{top([S.s4.X,(y0+y1)/2],.5,0,{hazard:S.s4.hazard,shadow:.5,wetTo:S.s4.lvl})}</Item></Item>
  </g>;
  break;}
 case 'record-desk':
 case 'record-wall':
 case 'count-grid':
 case 'record-close':
 case 'stamp-detail':{
  if(view==='record-wall'&&sid!=='s5'&&sid!=='s7')throw new Error('record-wall draws the s5 and s7 record only');
  const ids=sid==='s7'?{card:'s7-record',row:'s7-remedy'}:{card:'s5-record',row:'s5-record'};
  if(view==='record-desk'||(view==='record-wall'&&sid==='s5')){
   // s5: the record card is already at the desk's edge as the recall is named, slides into place on
   // s5-event-1's contact curve and its two rows write in: the recall type and the units affected.
   const wall=view==='record-wall',c=CARD_AT[wall?'record-wall-s5':view],off=(1-S.s5.slide);
   pic=<g>
    <SanAntonioSupport part="desk" x0={wall?60:-40} x1={wall?1020:1120} y0={wall?250:700} h={wall?1060:820} top={wall}/>
    <Item id="s5-record"><At p={[c.x+off*S5_SLIDE.dx,c.y+off*(wall?0:S5_SLIDE.dy)]} r={lerp(wall?-6:7,wall?-1:-1.5,S.s5.slide)} s={c.s}>
     <SanAntonioSupport part="record" w={CARD_W} rows={S.s5.rows} pick={CARD_ROWS.s5} imprints={imprints}/></At></Item>
    <At p={wall?[880,1230]:[900,1262]}><SanAntonioSupport part="pen"/></At>
   </g>;
   break;
  }
  if(view==='count-grid'){
   // s5 close: the card across the top, the counter tag under it on the left, the grid of car icons
   // filling row by row (linear) below both; the software recall stamp comes in raised from above the
   // frame's top right, its arm running up and right clear of the title and the chip, and lands in the
   // header's slot, off every data row. Its blow jostles the counter tag, and the camera settles in.
   const c=CARD_AT[view],slot=stampSlots(CARD_W,CARD_ROWS.s7).header,mark=cardPoint(view,slot.x,slot.y),im=imprintSize('Software recall',STAMP_SIZE.header);
   const zk=1+COUNT_PUSH.by*S.s5.settle,[zx,zy]=COUNT_PUSH.at;
   pic=<g transform={`translate(${zx} ${zy}) scale(${zk.toFixed(5)}) translate(${-zx} ${-zy})`}>
    <SanAntonioSupport part="desk" x0={-40} x1={1120} y0={200} h={1180}/>
    <Item id="s5-record">{card(view,{rows:1,pick:CARD_ROWS.s5})}</Item>
    <Item id="s5-count"><At p={COUNT_GRID.at}><SanAntonioSupport part="grid" cols={COUNT_GRID.cols} rows={COUNT_GRID.rows} fill={S.s5.grid} dx={COUNT_GRID.dx} dy={COUNT_GRID.dy}/></At></Item>
    <Item id="s5-total"><At p={COUNT_TAG.at}>{tag(COUNT_TAG.lines,S.s5.tag,{size:COUNT_TAG.size,sub:2,swing:S.s5.jolt})}</At></Item>
    <Item id="s5-stamp">{stampAt(stampPose(W['s5-event-3'],t,mark,S5_STAMP),im.w*c.s,im.h*c.s,-4,S5_STAMP)}</Item>
   </g>;
   break;
  }
  // s7: the card, through its remedy row, fills the frame and the remedy row lights; a pen tip comes to
  // rest just past the sentence's last word; the under development stamp lands in the row's slot under
  // the words (detail). B's overhead record-wall shows the first two.
  const k=view==='record-wall'?'record-wall':view,c=CARD_AT[k];
  // the pen and the hand run off to the right; it slides in and out along its own axis
  const tipC=remedyPenTip(CARD_W,CARD_ROWS.s7),tip=cardPoint(k,tipC.x,tipC.y),pa=PEN.rot*Math.PI/180,u:Pt=[Math.cos(pa),Math.sin(pa)];
  const along=PEN.reach*(1-S.s7.pen)+PEN.out*S.s7.penOut;
  const penAt:Pt=[tip[0]+u[0]*along,tip[1]+u[1]*along],grip:Pt=[penAt[0]+u[0]*PEN.grip,penAt[1]+u[1]*PEN.grip];
  const slot=stampSlots(CARD_W,CARD_ROWS.s7).remedy,mark=cardPoint(k,slot.x,slot.y),im=imprintSize('Under development',STAMP_SIZE.remedy);
  pic=<g>
   <SanAntonioSupport part="desk" x0={-40} x1={1120} y0={view==='record-wall'?250:220} h={1150} top={view==='record-wall'}/>
   {/* the rows the film has already named stand on the card; the remedy row writes in as it lights, on
     * the clause's first word, so its sentence is never readable before it is spoken */}
   <Item id={ids.card}><Item id={ids.row}>{card(k,{rows:(CARD_ROWS.s7.indexOf(REMEDY_ROW)+S.s7.lit)/CARD_ROWS.s7.length,pick:CARD_ROWS.s7,lit:S.s7.lit})}</Item></Item>
   <Item id="s7-cursor">{S.s7.pen>0&&S.s7.penOut<1&&<g><At p={penAt}><SanAntonioSupport part="pen" rot={PEN.rot}/></At>
    <At p={grip}><SanAntonioSupport part="arm" dir={PEN.armDir} grip="pen" scale={.9}/></At></g>}</Item>
   <Item id="s7-stamp">{view==='stamp-detail'&&stampAt(stampPose(W['s7-event-3'],t,mark,S7_STAMP),im.w*c.s,im.h*c.s,-4,S7_STAMP)}</Item>
  </g>;
  break;}
 case 'lane-wide':
 case 'wheels-water':{
  // s6, THE TURN. The car runs the higher speed lane; the camera picks it up on s6-event-1 and runs
  // with it; on s6-event-2 it slows with its brake lamps lit, its speed easing down the board's contact
  // curve, and the camera settles; it releases the brake and rolls on, never stopping, into the sheet
  // of standing water across the lane, a wake and spray at each wheel as it enters (s6-event-3). The
  // recall sentence card holds above, its word may lighting as the front wheel meets the water.
  const k=S6.kWide,X=S.s6.X,base=LANE.laneY,p:Pt=[X*k,base];
  const car=side(p,k,{wheel:S.s6.wheel,brake:S.s6.brake,dip:S.s6.dip,cabin:.6});
  const span=540/cam.s+260,xa=cam.f[0]-span,xb=cam.f[0]+span;
  const w0=S.s6.Xw*k,w1=(S.s6.Xw+1700)*k;
  const close=view==='wheels-water';
  const wheelAt=(i:0|1):Pt=>[(X+CAR.wheels[i])*k,base];
  // the standing water is one sheet with rounded, ragged ends and a wet halo on the asphalt; where the
  // tyres stand in it the same sheet laps over their contact patches
  const y0=LANE.dashY+18,y1=LANE.shoulderY-4,foot=puddleFoot(w0,w1,y0,y1,5),halo=puddleFoot(w0,w1,y0,y1,5,10);
  const pud=(layer:'back'|'front')=><SanAntonioSupport part="flood" layer={layer} foot={foot} x0={w0} x1={w1} y0={y0} y1={y1} t={t} tone="sky" drift={8}
   seed={23} marks={18} edge={layer==='back'?foot:undefined} line={{y:base-6,x0:(X-264)*k,x1:(X+264)*k}} reflect={mirrorAbout(base,car)}/>;
  const world=<g>
   <Item id="s6-lane"><SanAntonioSupport part="lane" xa={xa} xb={xb}/></Item>
   <Item id="s6-water"><path d={halo} fill="#33363A" opacity={.45}/>{pud('back')}</Item>
   <Item id="s6-car">{car}</Item>
   {pud('front')}
   {([1,0] as const).map(i=>{const amt=i?S.s6.frontIn:S.s6.rearIn;return amt>0&&<At key={i} p={[wheelAt(i)[0]+CAR.tireR*k*.6,base-2]}>
    <SanAntonioSupport part="wake" amount={amt} t={t} scale={k*1.1}/></At>;})}
  </g>;
  const qw=close?780:720;
  pic=<g><Grounded baseY={screenRow(cam,base)} on={exterior}><CamG c={cam} z={z} outer>{world}</CamG></Grounded>
   <Item id="s6-quote"><At p={[close?70:60,close?290:300]} o={close?1:clamp(S.s6.e1*2)}><SanAntonioSupport part="quote" w={qw} lit={S.s6.may} size={close?36:32}/></At></Item>
  </g>;
  break;}
 case 'lane-plan':{
  // s6 from above: the roof and dome run up the lane, the brake lamps light as it slows, the camera
  // settles and the car rolls on toward the standing water lying across the lanes.
  const k=S6.kPlan,Y=1400-S.s6.X*k,yw=1400-S.s6.Xw*k;
  const ya=cam.f[1]-1100,yb=cam.f[1]+1100;
  pic=<g><CamG c={cam} z={z}>
   <Item id="s6-lane"><SanAntonioSupport part="laneplan" ya={ya} yb={yb}/></Item>
   <Item id="s6-water"><SanAntonioSupport part="puddleplan" x0={430} x1={820} y0={yw-760} y1={yw} t={t}/></Item>
   <Item id="s6-car">{top([615,Y],k,-90,{brake:S.s6.brake,shadow:.5})}</Item>
  </CamG>
   <Item id="s6-quote"><At p={[60,300]} o={clamp(S.s6.e1*2)}><SanAntonioSupport part="quote" w={720} lit={S.s6.may} size={32}/></At></Item>
  </g>;
  break;}
 case 'calendar-fleet':{
  // s8 wide, the wet fleet lot: the four cars stand side by side in a row of stalls running away toward the
  // upper right and fill the frame, their reflections lying in the wet asphalt. The weather limits tag
  // enters from the left on the clause's first word, slides along the cord and clips above them (contact);
  // the cord takes up its slack and the tag swings and settles. The tear-off calendar hangs by the far pole
  // and the vehicle map card hangs on the cord; both change in the close.
  const {xs,ys,ss}=LOT_CARS,n=xs.length,sag=LOT.sag*(1-S8.tightBy*S.s8.tight);
  const tagX=lerp(S8_TAG_FROM,LOT_TAG.x,S.s8.tag),cordY=cordAt(tagX,sag),mx=LOT_AT.map[0];
  const far=xs.map((_,i)=>n-1-i);
  const world=<Grounded baseY={ys[0]} on={exterior}>
   <SanAntonioSupport part="lot" sag={sag} stalls={stallsFor(xs,ys,ss)}/>
   <Item id="s8-calendar"><path d={`M1014 ${LOT_AT.calendar[1]+8}H${LOT_AT.calendar[0]+LOT_AT.calendarW/2-6}`} stroke="#6D7479" strokeWidth={6}/>
    <At p={LOT_AT.calendar}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={LOT_AT.calendarW}/></At></Item>
   <Item id="s8-map">{clipOn([mx,cordAt(mx,sag)],10)}<At p={[mx-LOT_AT.mapW/2,cordAt(mx,sag)+7]} r={1.5}><SanAntonioSupport part="mapcard" updated={S.s8.updated} w={LOT_AT.mapW}/></At></Item>
   <Item id="s8-fleet">
    <g data-part="wet-reflections" opacity={.2}>{far.map(i=><g key={i}>{mirrorAbout(ys[i],side([xs[i],ys[i]],ss[i],{wheel:0,shadow:0,cabin:.5,seed:i}))}</g>)}</g>
    {far.map(i=><g key={i}>{side([xs[i],ys[i]],ss[i],{wheel:0,shadow:1,cabin:.5,seed:i})}</g>)}
    {xs.map((x,i)=>{const k=podCheck(x,ys[i],ss[i]);return <At key={i} p={k.c}><SanAntonioSupport part="check" p={clamp(S.s8.checks*n-i)} r={k.r}/></At>;})}</Item>
   <Item id="s8-limits"><At p={[tagX,cordY]}>{tag(['Weather limits','tightened'],S.s8.tagIn,{size:LOT_TAG.size,icon:'rain',dir:-1,swing:S.s8.swing+S.s8.sway})}</At></Item>
  </Grounded>;
  pic=<CamG c={cam} z={z}>{world}</CamG>;
  break;}
 case 'limits-tag':{
  // s8 close, a SEPARATELY STAGED low view at the near end of the same row, the eye at door height. The
  // tag hangs clipped on the taut cord near the lens; the nearest car fills the frame below it and its roof
  // pod takes its check large as every affected car is named, then the three cars receding toward the right
  // take theirs, left to right; the vehicle map card clipped further along the cord is marked updated, and
  // the tear-off calendar on the far pole flips from April to 20 on April twentieth.
  const {xs,ys,ss}=CLOSE_CARS,n=xs.length,sag=18*(1-S8.tightBy*S.s8.tight),A=CLOSE_AT;
  const far=xs.map((_,i)=>n-1-i),mapY=cordAtClose(A.mapX,sag);
  const world=<Grounded baseY={ys[0]} on={exterior}>
   <SanAntonioSupport part="lotclose" sag={sag} stalls={stallsFor(xs,ys,ss)}/>
   <Item id="s8-calendar"><At p={A.calendar}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={A.calendarW}/></At></Item>
   <Item id="s8-fleet">
    <g data-part="wet-reflections" opacity={.22}>{far.map(i=><g key={i}>{mirrorAbout(ys[i],side([xs[i],ys[i]],ss[i],{wheel:0,shadow:0,cabin:.6,seed:i}))}</g>)}</g>
    {far.map(i=><g key={i}>{side([xs[i],ys[i]],ss[i],{wheel:0,shadow:1,cabin:.6,seed:i})}</g>)}
    {xs.map((x,i)=>{const k=podCheck(x,ys[i],ss[i]);return <At key={i} p={k.c}><SanAntonioSupport part="check" p={clamp(S.s8.checks*n-i)} r={k.r}/></At>;})}</Item>
   <Item id="s8-map">{clipOn([A.mapX,mapY],14)}<At p={[A.mapX-A.mapW/2,mapY+9]} r={2}><SanAntonioSupport part="mapcard" updated={S.s8.updated} w={A.mapW}/></At></Item>
   <Item id="s8-limits">{clipOn([A.tagX,cordAtClose(A.tagX,sag)],16)}
    <At p={[A.tagX,cordAtClose(A.tagX,sag)]}>{tag(['Weather limits','tightened'],S.s8.tagIn,{size:A.tagSize,icon:'rain',dir:-1,swing:S.s8.swing+S.s8.sway})}</At></Item>
  </Grounded>;
  pic=<CamG c={cam} z={z}>{world}</CamG>;
  break;}
 case 'fleet-plan':{
  // s8 in B from above: the lot refilled by the same four roofs and domes in their stalls, filling its
  // width. The weather limits tag slides in along the cord from the left on n8a's first word and pins
  // above the row, then swings and settles; the April calendar lies by the lot's far corner.
  const L=LOT_PLAN,cx=(i:number)=>L.x0+L.stall/2+i*L.stall;
  pic=<g>
   <SanAntonioSupport part="lotplan" lay={L}/>
   <Item id="s8-calendar"><At p={LOT_PLAN_AT.calendar} r={-6}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={LOT_PLAN_AT.calendarW}/></At></Item>
   <Item id="s8-fleet">{Array.from({length:L.cars},(_,i)=><g key={i}>{top([cx(i),L.row],L.scale,-90,{shadow:.5})}</g>)}
    {Array.from({length:L.cars},(_,i)=>{const k=podCheckTop(cx(i),L.row,L.scale);return <At key={i} p={k.c}><SanAntonioSupport part="check" p={clamp(S.s8.checks*L.cars-i)} r={k.r}/></At>;})}</Item>
   <Item id="s8-limits"><At p={[lerp(S8_TAG_FROM,540,S.s8.tag),L.cordY]}>{tag(['Weather limits','tightened'],S.s8.tagIn,{size:40,icon:'rain',dir:-1,swing:S.s8.swing+S.s8.sway})}</At></Item>
  </g>;
  break;}
 case 'limits-detail':{
  // s8 in B, a SEPARATELY STAGED close straight down from just over the nearest roof: the cord crosses near
  // the lens with the tag clipped on it, large; below it the nearest roof's pod takes its check as every
  // affected car is named, then the next roofs take theirs left to right; the vehicle map card clipped on
  // the cord is marked updated and the calendar lying at the lot's edge flips to 20.
  const L=LOT_PLAN_CLOSE,cx=(i:number)=>L.x0+L.stall/2+i*L.stall;
  pic=<g>
   <SanAntonioSupport part="lotplan" lay={L} close/>
   <Item id="s8-calendar"><At p={L.calendar} r={-6}><SanAntonioSupport part="calendar" month="April" day="20" flip={S.s8.flip} w={L.calendarW}/></At></Item>
   <Item id="s8-fleet">{Array.from({length:L.cars},(_,i)=><g key={i}>{top([cx(i),L.row],L.scale,-90,{shadow:.5})}</g>)}
    {Array.from({length:L.cars},(_,i)=>{const k=podCheckTop(cx(i),L.row,L.scale);return <At key={i} p={k.c}><SanAntonioSupport part="check" p={clamp(S.s8.checks*L.cars-i)} r={k.r*1.4}/></At>;})}</Item>
   <Item id="s8-map">{clipOn([L.mapX,L.cordY],12)}<At p={[L.mapX-L.mapW/2,L.cordY+8]} r={2}><SanAntonioSupport part="mapcard" updated={S.s8.updated} w={L.mapW}/></At></Item>
   <Item id="s8-limits">{clipOn([L.tagX,L.cordY],14)}<At p={[L.tagX,L.cordY]}>{tag(['Weather limits','tightened'],S.s8.tagIn,{size:50,icon:'rain',dir:-1,swing:S.s8.swing+S.s8.sway})}</At></Item>
  </g>;
  break;}
 case 'curb-plan':{
  if(sid!=='s1')throw new Error('curb-plan draws the s1 arrival only');
  // s1 from above: the roof and dome come up the curb lane and brake into the painted bay box.
  const y=CURB_PLAN_CAR.y0-CURB_PLAN_CAR.k*S.s1.D;
  pic=<g>
   <Item id="s1-curb"><SanAntonioSupport part="curbplan" phone={<At p={[795,700]} r={8} s={.16}><SanAntonioSupport part="phone" w={300} pin={S.s1.pin} status={S.s1.status} t={t}/></At>}/></Item>
   <Item id="s1-car">{top([550,y],.62,-90,{brake:S.s1.brake,shadow:.6})}</Item>
   {phoneInset('s1-phone',S.s1.status,S.s1.pin)}
  </g>;
  break;}
 case 'curb-return':
 case 'record-slide':
 case 'curb-record-split':{
  // s9, a generic airport ride, not the flood cars. At the curb bay the waiting car's curbside rear door
  // swings open on its hinge on s9-event-1, the empty rear seat inside, and the phone inset says arriving.
  // On s9-event-2 the record's remedy row slides into the foreground on its own card, lit and large enough
  // to read. In the split, the open door and the bench phone hold above, the remedy card and the phone
  // below, and on s9-event-3 the remedy sentence is underlined: still under development.
  const world=curbWorld(s9Car,{curb:'s9-curb',car:'s9-car',phone:'s9-phone'},benchPhone(1,1));
  const curbOnly=curbWorld(s9Car,{curb:'s9-curb',car:'s9-car'});
  // exactly one s9-phone per shot: the inset at the return, the bench phone in the slide, the desk phone
  // in the split
  if(view==='curb-return'){pic=<g><CamG c={cam} z={z}>{curbOnly}</CamG>{phoneInset('s9-phone',1,1)}</g>;break;}
  if(view==='record-slide'){
   // the record card is already standing back on the curb side as the remedy is named, then slides into
   // the foreground on s9-event-2's travel curve
   const R=REMEDY_AT['record-slide'],sl=S.s9.slide,w92=W['s9-event-2'],settle=w92?smooth((t-w92.end)/1.2):0;
   pic=<g><CamG c={cam} z={z}>{world}</CamG>
    <Item id="s9-record"><At p={[lerp(R.back[0],R.x,sl),lerp(R.back[1],R.y,sl)-SLIDE_SETTLE*settle]} r={lerp(-3,-1,sl)} s={lerp(R.backS,R.s,sl)}>
     <SanAntonioSupport part="remedycard" lit={.4+.6*smooth(sl)} imprint={S.s7.imprint}/></At></Item>
   </g>;
   break;
  }
  // The split: the curb, closer, owns the top panel (the open door and the empty rear seat); the lower panel
  // is the record's own desk from s5 and s7, so the card and the arriving phone lie on a surface and no
  // plate of river or grass shows under the airport curb.
  const R=REMEDY_AT['curb-record-split'],panelY=R.panelY,ph=R.phoneW*2.05;
  pic=<g>
   <Clip k="split-top" box={[0,0,1080,panelY-12]}><CamG c={cam} z={z}>{curbOnly}</CamG></Clip>
   <g data-part="split-desk"><SanAntonioSupport part="desk" x0={-40} x1={1120} y0={panelY} h={1990-panelY}/></g>
   <rect x={0} y={panelY-12} width={1080} height={12} fill={pal.paper}/>
   <Item id="s9-record"><At p={[R.x,R.y]} s={R.s}><SanAntonioSupport part="remedycard" lit={1} underline={S.s9.underline} imprint={S.s7.imprint}/></At></Item>
   <rect x={R.phone[0]+8} y={R.phone[1]+10} width={R.phoneW} height={ph} rx={R.phoneW*.12} fill="#1A1814" opacity={.3}/>
   <Item id="s9-phone"><At p={R.phone}><SanAntonioSupport part="phone" w={R.phoneW} pin={1} status={1} t={t}/></At></Item>
  </g>;
  break;}
 default:throw new Error('Unimplemented robotaxi view '+view);
 }

 // ---- the disclosure chip: the board's production_disclosure, on every scene ----
 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText);
 const dW=Math.max(...dLines.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,dH=dLines.length*32+24;
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={44} y={132} width={dW} height={dH} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}
   data-quote={view==='wheels-water'||view==='lane-wide'?QUOTE_TEXT.length:undefined}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
