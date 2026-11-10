import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {NoteHero,type HeroIds,type HeroState,type Pt} from './NoteHero';
import {ClinicRecordSupport,BILL,VNOTE,tagSize,type SupportPart} from './ClinicRecordSupport';

/**
 * note-check-v1: who checks the draft (2026-11-10, Harris County, an illustrated Houston exam room).
 *
 * ONE generic wall note screen (NoteHero) on a swing arm over a worn desk carries the film, and the
 * records arrive on the desk in front of it (ClinicRecordSupport). Every performed state is a closed
 * function of the film clock and the board's event windows (noteState), so any frame renders alone and
 * the same twice. Completed results are kept: the draft line, the check slot, the open empty tray, the
 * thread to the source words and the hovering outlined check stay on the screen to the end.
 *
 * Proof-page corrections (builder proof 1): the film opens on the screen being drawn out from the wall on
 * its arm; nothing fades in. Every card and tag slides in at full strength from the frame edge of the
 * camera that shows it, every mark (stamps, highlights, frames, threads, check) is drawn as a stroke,
 * the loose agreement thread is pulled across and tied rather than faded out, the question tag rises
 * from behind the visit note, the hovering check comes down from above the screen rather than fading in
 * (it hovers by design and never lands), the disclosure chip is opaque and
 * every shot's subjects are framed inside the picture band, clear of the chip and the captions.
 *
 *  s1  spoken word marks rise off the exam table and run into the page as one draft line beside an
 *      AI draft chip (s1-event-1, s1-event-2); a crooked check slot outlines beside it and the record
 *      tray below slides open, empty (s1-event-3).
 *  s2  a school post card naming UT Physicians slides onto the desk; a dashed outline of one unified
 *      system draws and its bar fills a short way to a working toward tag; an Epic ambient listening tag
 *      lands on the outline, whose inside stays empty; DAX and Abridge pilot tags drop onto a past lane.
 *  s3  a row of faceless physician outlines fills from the left and its right end stays dashed under
 *      an eventually arrow; a blank easel calendar takes a no date stated tag; an Epic refresher tag
 *      clips onto the front of the row.
 *  s4  an Abridge release card drops and an October 8th, 2026 stamp lands on it; an enterprise-wide
 *      agreement tag clips on with a loose thread; a University of Texas REAL Health AI card slides
 *      in and the thread ties to it.
 *  s5  a framework frame draws with Abridge beneath it and an Abridge says tag; access threads run to
 *      four UT health institution cards; each card's own switch lights and rests in the middle.
 *  s6  Linked Evidence and Abridge says tabs rise from behind the screen and clip onto its top edge and a
 *      strip of source words unrolls beside it; a thread draws from the draft line back to the matching
 *      row, which lights when the thread arrives; an OUTLINED check comes down from above the screen and
 *      hovers over the slot, its shadow apart from it: ready, not placed.
 *  s7  an enrolled bill card drops and an Effective September 1st, 2025 stamp lands crooked; its
 *      diagnosis tag lights; an AI tag slides in beside it and a frame draws round both.
 *  s8  the same card's second condition line highlights and reads review all AI-created records; an
 *      accent bracket reaches a stack of record cards each marked AI; a Texas Medical Board standards
 *      tag clips under the line. No person is drawn and nothing is checked off.
 *  s9  the card's own word diagnosis takes an accent frame; a visit note card slides up to the frame's
 *      edge and stops; a question mark tag rises and a dashed line marks where they meet.
 *  s10 a vendor thread from an Abridge says card and a statute thread from a Texas law card bend to
 *      the same EMPTY slot, which takes a Texas law requires review for diagnostic use tag; a how well the check works
 *      card is lowered from behind the chin and its empty field takes a drawn not stated mark; three
 *      source cards slide in beside the screen. The outlined check still hovers. It never lands.
 *
 * A follows the screen through the room (wide, medium and close); B opens each scene on the slot and
 * uses split views for its comparisons. Indoors the region is the stage's window behind the room, or
 * its wash at close, detail and split framings; no full-frame background is painted. Disclosed
 * illustration: a generic room, screen and records, no real clinic, clinician, patient, interface,
 * seal or brand mark.
 */

type V='a'|'b';
type Kind='wide'|'medium'|'close'|'detail'|'check'|'split';
export type Box=[number,number,number,number];
export type Cam={z:number;tx:number;ty:number};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const q=clamp(p);return q*q*(3-2*q);};
const f2=(v:number)=>v.toFixed(2);

/** Every registered view: its scene and how close the camera stands. */
export function viewSpec(view:string):{sid:string;kind:Kind}{
 switch(view){
 case 'room-wide':return {sid:'s1',kind:'wide'};
 case 'room-medium':return {sid:'s1',kind:'medium'};
 case 'room-close':return {sid:'s1',kind:'close'};
 case 'room-detail':return {sid:'s1',kind:'detail'};
 case 'room-check':return {sid:'s1',kind:'check'};
 case 'room-split':return {sid:'s1',kind:'split'};
 case 'post-wide':return {sid:'s2',kind:'wide'};
 case 'post-medium':return {sid:'s2',kind:'medium'};
 case 'post-close':return {sid:'s2',kind:'close'};
 case 'post-detail':return {sid:'s2',kind:'detail'};
 case 'post-check':return {sid:'s2',kind:'check'};
 case 'post-split':return {sid:'s2',kind:'split'};
 case 'rollout-wide':return {sid:'s3',kind:'wide'};
 case 'rollout-medium':return {sid:'s3',kind:'medium'};
 case 'rollout-close':return {sid:'s3',kind:'close'};
 case 'rollout-detail':return {sid:'s3',kind:'detail'};
 case 'rollout-check':return {sid:'s3',kind:'check'};
 case 'rollout-split':return {sid:'s3',kind:'split'};
 case 'release-wide':return {sid:'s4',kind:'wide'};
 case 'release-medium':return {sid:'s4',kind:'medium'};
 case 'release-close':return {sid:'s4',kind:'close'};
 case 'release-detail':return {sid:'s4',kind:'detail'};
 case 'release-check':return {sid:'s4',kind:'check'};
 case 'release-split':return {sid:'s4',kind:'split'};
 case 'framework-wide':return {sid:'s5',kind:'wide'};
 case 'framework-medium':return {sid:'s5',kind:'medium'};
 case 'framework-close':return {sid:'s5',kind:'close'};
 case 'framework-detail':return {sid:'s5',kind:'detail'};
 case 'framework-check':return {sid:'s5',kind:'check'};
 case 'framework-split':return {sid:'s5',kind:'split'};
 case 'link-wide':return {sid:'s6',kind:'wide'};
 case 'link-medium':return {sid:'s6',kind:'medium'};
 case 'link-close':return {sid:'s6',kind:'close'};
 case 'link-detail':return {sid:'s6',kind:'detail'};
 case 'link-check':return {sid:'s6',kind:'check'};
 case 'link-split':return {sid:'s6',kind:'split'};
 case 'bill-wide':return {sid:'s7',kind:'wide'};
 case 'bill-medium':return {sid:'s7',kind:'medium'};
 case 'bill-close':return {sid:'s7',kind:'close'};
 case 'bill-detail':return {sid:'s7',kind:'detail'};
 case 'bill-check':return {sid:'s7',kind:'check'};
 case 'bill-split':return {sid:'s7',kind:'split'};
 case 'review-wide':return {sid:'s8',kind:'wide'};
 case 'review-medium':return {sid:'s8',kind:'medium'};
 case 'review-close':return {sid:'s8',kind:'close'};
 case 'review-detail':return {sid:'s8',kind:'detail'};
 case 'review-check':return {sid:'s8',kind:'check'};
 case 'review-split':return {sid:'s8',kind:'split'};
 case 'scope-wide':return {sid:'s9',kind:'wide'};
 case 'scope-medium':return {sid:'s9',kind:'medium'};
 case 'scope-close':return {sid:'s9',kind:'close'};
 case 'scope-detail':return {sid:'s9',kind:'detail'};
 case 'scope-check':return {sid:'s9',kind:'check'};
 case 'scope-split':return {sid:'s9',kind:'split'};
 case 'answer-wide':return {sid:'s10',kind:'wide'};
 case 'answer-medium':return {sid:'s10',kind:'medium'};
 case 'answer-close':return {sid:'s10',kind:'close'};
 case 'answer-detail':return {sid:'s10',kind:'detail'};
 case 'answer-check':return {sid:'s10',kind:'check'};
 case 'answer-split':return {sid:'s10',kind:'split'};
 default:throw new Error('Unimplemented note check view '+view);
 }
}

// ---- cameras: each view fits a box of the room's world into the picture band above the captions ----------
/** The picture band: below the disclosure chip and county card, above the caption band, left of the feed
 * buttons. A check view uses a little more height so the slot and the desk both fit. */
export const BAND={x0:40,y0:420,x1:900,y1:1200},CHECK_BAND={x0:40,y0:380,x1:900,y1:1220};
export const PANES:[Box,Box]=[[40,392,900,796],[40,812,900,1216]];
/**
 * Each view's world box. The boxes the two boards use were solved (builder proof 1 correction) against the
 * composed screen bounds of every settled object in every shot that uses the view, in both treatments:
 * each clause subject shows at least one whole word (or most of its shape) inside the picture band, every
 * word on screen is wholly inside x 36 to 912 and below the disclosure chip and county card and above the
 * caption band, or wholly out of sight, and every visible word reaches 26 pixels in the 1080 frame (about
 * 9.4 pixels at 390). Nothing is cut through a word by the frame edge, the chip or the captions.
 */
type Boxes={wide?:Box;medium:Box;close:Box;detail:Box;check:Box;split:[Box,Box]};
export const BOXES:Record<string,Boxes>={
 s1:{medium:[335.4,414.7,832.6,865.5],close:[470,456,900,800],detail:[430,560,700,700],check:[680,500,905,700],split:[[80,740,520,906],[470,456,900,800]]},
 s2:{medium:[84.1,602.4,887.9,1331.4],close:[500.4,772.4,887.8,1123.8],detail:[480,1080,900,1170],check:[480,540,905,1170],split:[[490.7,818.7,881.3,997.3],[502.0,902.8,852.0,1062.8]]},
 s3:{medium:[335.9,831.5,880.3,1325.1],close:[338.6,921.7,613.4,1170.9],detail:[80,890,300,1120],check:[137.3,478.9,878.7,1203.1],split:[[80,890,330,1120],[320,900,900,1220]]},
 s4:{medium:[220,900,900,1220],close:[214.9,825.9,749.1,1310.3],detail:[50,1050,410,1222],check:[371.8,570.8,871.8,1059.2],split:[[460,920,900,1190],[50,930,490,1222]]},
 s5:{medium:[367.7,905.5,840.3,1334.1],close:[70,1056,480,1215],detail:[80,1140,300,1215],check:[300,540,905,1215],split:[[60,890,900,1000],[60,1050,900,1215]]},
 s6:{wide:[253.5,336.4,958.5,975.8],medium:[445.5,382.0,886.5,782.0],close:[300,500,720,820],detail:[471.3,380.4,880.9,751.8],check:[319.0,365.5,881.0,914.5],split:[[300,460,450,800],[488,474,882,736]]},
 s7:{wide:[239.5,909.6,944.5,1549.0],medium:[326.1,815.3,838.1,1279.5],close:[330,1080,640,1160],detail:[620,1110,890,1205],check:[324.7,490.1,879.5,1032.1],split:[[330,980,890,1090],[330,1090,890,1215]]},
 s8:{medium:[188.7,880.8,835.3,1467.2],close:[342.9,821.2,837.1,1269.4],detail:[640,1010,900,1095],check:[192.0,520.9,880.0,1192.9],split:[[60,975,330,1215],[330,1000,900,1100]]},
 s9:{wide:[161.5,909.6,866.5,1549.0],medium:[326.5,827.7,841.5,1294.7],close:[100,980,560,1210],detail:[340,1086,560,1160],check:[330,540,905,1215],split:[[-17.5,979.3,485.5,1209.3],[321.9,1056.7,850.3,1298.3]]},
 s10:{wide:[175.5,462.4,880.5,1101.8],medium:[454.4,507.4,1077.6,1072.6],close:[360,520,910,940],detail:[700,520,905,940],check:[192.0,430.0,880.0,1102.0],split:[[60,1020,380,1210],[380,500,910,1110]]},
};
export const ZMAX=3.2;
/** Fit a world box into a frame box: one uniform scale, centred. */
export function fit(box:Box,band:{x0:number;y0:number;x1:number;y1:number},zmax=ZMAX,bottom=false):Cam{
 const z=Math.min((band.x1-band.x0)/(box[2]-box[0]),(band.y1-band.y0)/(box[3]-box[1]),zmax);
 const cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2,fx=(band.x0+band.x1)/2,fy=(band.y0+band.y1)/2;
 return bottom?{z,tx:fx-cx*z,ty:band.y1-box[3]*z}:{z,tx:fx-cx*z,ty:fy-cy*z};
}
const paneBand=(p:Box)=>({x0:p[0]+10,y0:p[1]+10,x1:p[2]-10,y1:p[3]-10});
/** The camera(s) a view uses: one, or two for a split. A scene may give its wide view a fitted box, so the
 * widest shot of a scene full of small paper still reads at 390 pixels; otherwise wide is the whole room.
 * Every box was solved against the composed screen bounds of that view's settled subjects (see BOXES). */
export function viewCameras(view:string):Cam[]{
 const {sid,kind}=viewSpec(view),B=BOXES[sid];
 if(kind==='wide')return B.wide?[fit(B.wide,BAND)]:[{z:1,tx:0,ty:0}];
 if(kind==='split')return [fit(B.split[0],paneBand(PANES[0])),fit(B.split[1],paneBand(PANES[1]))];
 return [fit(B[kind],kind==='check'?CHECK_BAND:BAND)];
}
export const camPoint=(c:Cam,p:Pt):Pt=>[c.tx+c.z*p[0],c.ty+c.z*p[1]];

// ---- the desk's records, in world pixels ---------------------------------------------------------------
/** A camera with the screen x range it draws into: the whole frame, or one split pane. */
export type Vis={cam:Cam;x0:number;x1:number};
/** The world x a thing of width w starts from when it slides in from the nearer edge of this camera's frame. */
export function enterFrom(V:Vis,restX:number,w:number,side?:'l'|'r'){
 const l=(V.x0-V.cam.tx)/V.cam.z-w-40,r=(V.x1-V.cam.tx)/V.cam.z+40;
 if(side)return side==='l'?l:r;
 return V.cam.tx+V.cam.z*(restX+w/2)<(V.x0+V.x1)/2?l:r;
}
/** Slide a rest point in from the frame edge as p goes 0 to 1, with a small lift on the way. */
export function slideIn(V:Vis,rest:Pt,w:number,p:number,lift=10,side?:'l'|'r'):Pt{
 return [lerp(enterFrom(V,rest[0],w,side),rest[0],p),rest[1]-lift*Math.sin(Math.PI*clamp(p))];
}
export const LAYOUT={
 lane:{x:488,y:900,w:380},pilots:[{hole:[606,928] as Pt,lines:['DAX']},{hole:[714,928] as Pt,lines:['Abridge']}],
 post:{x:70,y:984,w:380,h:230,r:-2.5},platform:{x:488,y:984,w:404,h:220},epic:{hole:[560,984] as Pt},
 calendar:{x:92,y:902},nodate:{hole:[112,1084] as Pt},figures:{x0:384,dx:92,base:1146,n:6,fill:4},arrow:{x:700,y:944,w:180},
 physicians:{x:340,y:926},refresher:{hole:[330,1178] as Pt},
 release:{x:420,y:896,w:380,h:196,r:1.8},date:{x:600,y:1058},agreement:{hole:[250,948] as Pt},clip:{x:424,y:936},
 initiative:{x:200,y:1098,w:320,h:136,r:-1.5},tie:{a:[250,948] as Pt,loose:[232,1018] as Pt,c:[330,1052] as Pt,b:[430,1100] as Pt},
 frame:{x:120,y:904,w:730,h:86},inst:{x0:124,dx:236,y:1060,w:220,h:150,n:3},
 bill:{x:320,y:888,r:-1.2},records:{x:180,y:1060,n:5},bracket:{x:166,y0:978,y1:1206},
 vnote:{x:154,y:1074},question:{x:296,y0:1150,y1:1016},meet:{x:344,y0:1080,y1:1206},
 design:{x:176,y:902,w:276,h:146,r:-2},statute:{x:472,y:958,w:270,h:140,r:1.5},designFrom:[440,936] as Pt,statuteFrom:[606,960] as Pt,
};

/** Every performed state, a closed function of the film clock and the board's event windows. */
/** The opening move: the screen is drawn out from the wall on its arm over the first SWING_S seconds. */
export const SWING_S=.55;
export function swingAt(t:number,sceneStart:number){const q=clamp((t-sceneStart)/SWING_S);return 1-q*q*q*(q*(6*q-15)+10);}
export function noteState(W:Record<string,ActionWindow>,t:number){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const e11=P('s1-event-1'),e12=P('s1-event-2'),e13=P('s1-event-3');
 const head=.8*e11+.2*e12,tail=e12>0?lerp(.3,1,e12):Math.max(0,head-.5);
 const hero:HeroState={
  swing:0,edgeL:0,reticle:false,
  ribbon:e11>0&&e12<1?{head,tail}:null,
  write:e12,chip:clamp((e12-.5)/.5),slot:clamp(e13/.65),tray:clamp((e13-.35)/.65),
  tags:P('s6-event-1'),strip:P('s6-event-1'),link:P('s6-event-2'),hover:P('s6-event-3'),
  design:0,statute:0,designFrom:null,statuteFrom:null,label:0,howWell:0,stamp:0,cards:0};
 const s10e2=P('s10-event-2'),s10e3=P('s10-event-3');
 const close={design:P('s10-event-1'),statute:s10e2,label:clamp((s10e2-.7)/.3),howWell:clamp(s10e3/.6),stamp:clamp((s10e3-.62)/.38),cards:P('s10-event-4')};
 const plat=P('s2-event-2');
 return {hero,close,
  s2:{post:P('s2-event-1'),draw:clamp(plat/.55),fill:clamp((plat-.35)/.65),working:clamp((plat-.85)/.15),epic:P('s2-event-3'),pilots:P('s2-event-4')},
  s3:{fill:P('s3-event-1'),cal:P('s3-event-2'),refresher:P('s3-event-3')},
  s4:{drop:P('s4-event-1'),agree:P('s4-event-2'),init:P('s4-event-3'),tie:P('s4-event-4')},
  s5:{frame:P('s5-event-1'),access:P('s5-event-2'),sw:P('s5-event-3')},
  s7:{drop:P('s7-event-1'),diag:P('s7-event-2'),ai:P('s7-event-3')},
  s8:{hl:P('s8-event-1'),bracket:P('s8-event-2'),std:P('s8-event-3')},
  s9:{frame:P('s9-event-1'),note:P('s9-event-2'),q:P('s9-event-3')}};
}
export type NoteState=ReturnType<typeof noteState>;

const DISCLOSURE_FONT=26,DISCLOSURE_MAX=420;
function disclosureLines(text:string):string[]{
 const words=text.split(' '),lines:string[]=[];let cur='';
 for(const w of words){const n=cur?cur+' '+w:w;if(cur&&widthOf(n,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=n;}
 if(cur)lines.push(cur);return lines;
}
export function disclosureBox(text:string):[number,number,number,number]{const ls=disclosureLines(text);return [44,132,44+Math.max(...ls.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34,132+ls.length*32+24];}

/** In a split, each pane isolates its own records: a record drawn in one pane is never drawn in the other. */
const PaneOnly=React.createContext<Set<string>|null>(null);
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=>{
 const only=React.useContext(PaneOnly);
 if(only&&!only.has(id)&&!/-(room|desk)$/.test(id))return null;
 return <g data-item={id}>{children}</g>;
};
/** One drawn object that carries several of the board's subjects at once. */
const Items:React.FC<{ids:string[];children:React.ReactNode}>=({ids,children})=>{
 const only=React.useContext(PaneOnly);
 if(only&&!ids.some(i=>only.has(i)))return null;
 return <g data-item={ids[0]} data-items={ids.join(' ')}>{children}</g>;
};
/** Which records each pane of a split isolates. The note screen is drawn only where a pane lists 'hero'. */
export const SPLIT_ITEMS:Record<string,[string[],string[]]>={
 'post-split':[['s2-pilots'],['s2-platform','s2-progress']],
 'scope-split':[['s9-visitnote','s9-question'],['s9-bill','s9-diagnosis']],
};
const BILL_IDS:Record<string,string[]>={s7:['s7-bill','s7-effective','s7-diagnosis','s7-aitag'],s8:['s8-bill','s8-condition','s8-standards'],s9:['s9-bill','s9-diagnosis']};
const At:React.FC<{p:Pt;r?:number;s?:number;o?:number;children:React.ReactNode}>=({p,r=0,s=1,o=1,children})=>
 <g transform={`translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(r)}) scale(${f2(s)})`} opacity={f2(o)}>{children}</g>;

export const NoteCheckFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Note check film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Note check film must read the single film frame clock');
 const pal=ad.palette,v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const S=noteState(W,t);
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const view=shot.view,spec=viewSpec(view),sid=scene.id;
 if(spec.sid!==sid)throw new Error(view+' draws '+spec.sid+' only, not '+sid);
 const L=LAYOUT;
 const sup=(p:SupportPart)=><ClinicRecordSupport pal={pal} {...p}/>;

 // ---- the hero for this scene: what it carries, under this scene's subject ids ----
 const base:HeroState=sid==='s10'?{...S.hero,...S.close,designFrom:L.designFrom,statuteFrom:L.statuteFrom}:{...S.hero,ribbon:sid==='s1'?S.hero.ribbon:null};
 const heroSt:HeroState={...base,swing:sid==='s1'?swingAt(t,scene.start_s):0,reticle:v==='b'};
 const ids:HeroIds=sid==='s1'?{note:'s1-note',draftline:'s1-draftline',checkbox:'s1-checkbox',record:'s1-record',speech:'s1-speech'}
  :sid==='s6'?{note:'s6-note',draftline:'s6-draftline',source:'s6-source',links:'s6-links',verify:'s6-verify'}
  :sid==='s10'?{check:'s10-check',statute:'s10-statute',design:'s10-design',howwell:'s10-howwell',sources:'s10-sources'}:{};

 // ---- each scene's records on the desk. V is the camera this copy of the world is drawn through:
 // whatever arrives slides in at full strength from that camera's nearer frame edge. ----
 const records=(V:Vis):React.ReactNode=>{
  switch(sid){
  case 's2':{const s=S.s2,k=smooth(s.post);
   const epicW=tagSize(['Epic ambient','listening'],26).w;
   return <g>
    <Item id="s2-pilots"><At p={[L.lane.x,L.lane.y]}>{sup({part:'pilotLane',w:L.lane.w})}</At>
     {L.pilots.map((g,i)=>{const p=clamp((s.pilots-i*.3)/.7);if(p<=0)return null;const q=smooth(p),w=tagSize(g.lines,26).w;
      return <At key={i} p={slideIn(V,g.hole,w,q,26,'l')} r={-10*(1-q)}>{sup({part:'tag',lines:g.lines,size:26,swing:-6*(1-q)})}</At>;})}</Item>
    {s.post>0&&<Item id="s2-post"><At p={slideIn(V,[L.post.x,L.post.y],L.post.w,k,8,'l')} r={L.post.r-5*(1-k)}>
     {sup({part:'card',w:L.post.w,h:L.post.h,header:'UTHealth Houston post',title:['UT Physicians'],titleSize:42,marks:2,seed:3})}</At></Item>}
    <Item id="s2-platform"><Item id="s2-progress"><At p={[L.platform.x,L.platform.y]}>
     {sup({part:'platform',w:L.platform.w,h:L.platform.h,draw:s.draw,fill:s.fill,stopAt:.36,working:s.working})}</At></Item>
     {s.epic>0&&<At p={slideIn(V,L.epic.hole,epicW,smooth(s.epic),26,'r')}>{sup({part:'clip',w:22})}
      {sup({part:'tag',lines:['Epic ambient','listening'],size:26,tone:'teal',swing:-10*(1-smooth(s.epic))})}</At>}</Item>
   </g>;}
  case 's3':{const s=S.s3,F=L.figures;
   const nq=smooth(clamp(s.cal/.75)),ns=smooth((s.cal-.75)/.25),nd=tagSize(['no date','stated'],26).w;
   const rq=smooth(clamp(s.refresher/.75)),rs=smooth((s.refresher-.75)/.25),rw=tagSize(['Epic refresher'],26).w;
   return <g>
    <Item id="s3-nodate"><At p={[L.calendar.x,L.calendar.y]}>{sup({part:'calendar'})}</At>
     {s.cal>0&&<g>
      {ns>0&&<path d={`M190 1052Q160 1070 ${L.nodate.hole[0]+4} ${L.nodate.hole[1]}`} stroke={pal.ink} strokeWidth={2.6} fill="none"
       pathLength={1000} strokeDasharray={`${f2(1000*ns)} 1000`}/>}
      <At p={slideIn(V,L.nodate.hole,nd,nq,26,'l')} r={-8*(1-nq)}>{sup({part:'tag',lines:['no date','stated'],size:26})}</At></g>}</Item>
    <Item id="s3-rollout">
     <text x={L.physicians.x} y={L.physicians.y} fontFamily={FONT.body} fontSize={28} fontWeight={800} fill={pal.foreground}>physicians</text>
     {Array.from({length:F.n}).map((_,i)=>{const p=i<F.fill?clamp((s.fill-.05-i*.22)/.2):0;
      return <At key={i} p={[F.x0+i*F.dx,F.base]}>{sup({part:'figure',filled:p})}</At>;})}
     <At p={[L.arrow.x,L.arrow.y]}>{sup({part:'arrow',w:L.arrow.w,p:clamp((s.fill-.7)/.3),label:'eventually'})}</At></Item>
    {s.refresher>0&&<Item id="s3-refresher">
     {rs>0&&<path d={`M${F.x0-30} 1110Q${F.x0-60} 1150 ${L.refresher.hole[0]+4} ${L.refresher.hole[1]}`} stroke={pal.ink} strokeWidth={2.6} fill="none"
      pathLength={1000} strokeDasharray={`${f2(1000*rs)} 1000`}/>}
     <At p={slideIn(V,L.refresher.hole,rw,rq,26)} r={6*(1-rq)}>{sup({part:'tag',lines:['Epic refresher'],size:26,tone:'teal'})}</At></Item>}
   </g>;}
  case 's4':{const s=S.s4,k=smooth(s.drop),ki=smooth(s.init),ka=smooth(s.agree),kt=smooth(s.tie);
   const aw=tagSize(['enterprise-wide','agreement'],26).w;
   const tagAt=slideIn(V,L.agreement.hole,aw+260,ka,24,'l');
   const T=L.tie,end:Pt=[lerp(T.loose[0],T.b[0],kt),lerp(T.loose[1],T.b[1],kt)-30*Math.sin(Math.PI*kt)],ctl:Pt=[lerp(200,T.c[0],kt),lerp(1010,T.c[1],kt)];
   return <g>
    {s.drop>0&&<Item id="s4-release"><At p={slideIn(V,[L.release.x,L.release.y],L.release.w,k,8,'r')} r={L.release.r+4*(1-k)}>
     {sup({part:'card',w:L.release.w,h:L.release.h,header:'Abridge release',title:['Press release'],titleSize:34,marks:2,seed:5})}</At>
     <Item id="s4-date"><At p={[L.date.x,L.date.y]}>{sup({part:'stamp',lines:['October 8th, 2026'],size:28,p:clamp((s.drop-.6)/.4),rot:-6,id:'date'})}</At></Item></Item>}
    {s.init>0&&<Item id="s4-initiative"><At p={slideIn(V,[L.initiative.x,L.initiative.y],L.initiative.w,ki,8,'l')} r={L.initiative.r-4*(1-ki)}>
     {sup({part:'card',w:L.initiative.w,h:L.initiative.h,header:'initiative',title:['University of Texas','REAL Health AI'],titleSize:28,marks:0,seed:6})}</At></Item>}
    {s.agree>0&&<Item id="s4-agreement"><g>
     {/* the tag's loose thread hangs from it, and is then pulled across the desk and tied to the initiative card */}
     {ka>=1&&<path d={`M${T.a[0]} ${T.a[1]}Q${f2(ctl[0])} ${f2(ctl[1])} ${f2(end[0])} ${f2(end[1])}`} stroke={pal.foreground} strokeWidth={4.5} fill="none" strokeLinecap="round"/>}
     {ka>=1&&kt>=.999&&<circle cx={T.b[0]} cy={T.b[1]} r={7} fill={pal.foreground} stroke="#ffffff" strokeOpacity={.6} strokeWidth={1.5}/>}
     <At p={tagAt} r={-14*(1-ka)}>{sup({part:'tag',lines:['enterprise-wide','agreement'],size:26,tone:'accent'})}
      <At p={[L.clip.x-L.agreement.hole[0],L.clip.y-L.agreement.hole[1]]} r={4}>{sup({part:'clip',w:24})}</At></At></g></Item>}
   </g>;}
  case 's5':{const s=S.s5,F=L.frame,C=L.inst;
   return <g>
    <Item id="s5-framework"><At p={[F.x,F.y]}>{sup({part:'framework',w:F.w,h:F.h,draw:s.frame})}</At></Item>
    <Item id="s5-access">{Array.from({length:C.n}).map((_,i)=>{const p=clamp((s.access-i*.18)/.64),bx=C.x0+i*C.dx+C.w/2;
     return <g key={i}>{sup({part:'thread',a:[F.x+F.w/2,F.y+F.h],c:[lerp(F.x+F.w/2,bx,.5),1030],b:[bx,C.y+2],p,w:5})}</g>;})}</Item>
    <Item id="s5-institutions"><Item id="s5-decisions">{Array.from({length:C.n}).map((_,i)=>
     <At key={i} p={[C.x0+i*C.dx,C.y]} r={(i%2?1:-1)*1.2}>{sup({part:'institution',w:C.w,h:C.h,sw:clamp((s.sw-i*.25)/.5)})}</At>)}</Item></Item>
   </g>;}
  case 's7':case 's8':case 's9':{
   const s7=S.s7,s8=S.s8,s9=S.s9,k=smooth(s7.drop);
   const billAt=slideIn(V,[L.bill.x,L.bill.y],BILL.w,k,8,'r');
   const rightEdge=enterFrom(V,0,0,'r');
   const bill=sup({part:'bill',w:BILL.w,h:BILL.h,diag:s7.diag,ai:s7.ai,aiFrame:clamp((s7.ai-.55)/.45),stamp:clamp((s7.drop-.6)/.4),
    hl:sid==='s7'?0:s8.hl,std:sid==='s7'?0:s8.std,dframe:sid==='s9'?s9.frame:0,
    aiFrom:Math.max(0,rightEdge-(L.bill.x+BILL.ai.x)),stdFrom:Math.max(0,rightEdge-(L.bill.x+BILL.std.x))});
   const nq=smooth(s9.note),qq=smooth(clamp(s9.q/.7));
   return <g>
    {sid==='s8'&&<Item id="s8-records"><At p={[L.records.x,L.records.y]}>{sup({part:'records',n:L.records.n})}</At></Item>}
    {s7.drop>0&&<Items ids={BILL_IDS[sid]}>
     <At p={billAt} r={L.bill.r+3*(1-k)}>{bill}</At></Items>}
    {sid==='s8'&&<Item id="s8-records">{sup({part:'bracket',x:L.bracket.x,y0:L.bracket.y0,y1:L.bracket.y1,from:[L.bill.x+12,L.bill.y+BILL.lines[1]-24],p:s8.bracket,holdRight:true})}</Item>}
    {sid==='s9'&&<g>
     {/* the question tag is drawn behind the visit note and rises from behind it */}
     {s9.q>0&&<Item id="s9-question">
      <path d={`M${L.meet.x} ${L.meet.y0}V${f2(lerp(L.meet.y0,L.meet.y1,smooth((s9.q-.3)/.7)))}`} stroke={pal.accent} strokeWidth={5} strokeDasharray="10 7"/>
      <At p={[L.question.x,lerp(L.question.y0,L.question.y1,qq)]}>{sup({part:'question',p:s9.q})}</At></Item>}
     {s9.note>0&&<Item id="s9-visitnote"><At p={slideIn(V,[L.vnote.x,L.vnote.y],VNOTE.w,nq,6,'l')} r={-3*(1-nq)}>
      {sup({part:'visitNote'})}</At></Item>}</g>}
   </g>;}
  case 's10':return <g>
    <Item id="s10-design"><At p={[L.design.x,L.design.y]} r={L.design.r}>{sup({part:'card',w:L.design.w,h:L.design.h,header:'Abridge says',title:['clinicians','can verify'],titleSize:32,marks:0,seed:8})}</At></Item>
    <Item id="s10-statute"><At p={[L.statute.x,L.statute.y]} r={L.statute.r}>{sup({part:'card',w:L.statute.w,h:L.statute.h,header:'Texas law',title:['review for','diagnostic use'],titleSize:30,marks:0,seed:9,tint:'#F6EEE0'})}</At></Item>
   </g>;
  default:return null;
  }
 };

 const world=(key:string,V:Vis,pane?:number)=>{
  const st:HeroState={...heroSt,edgeL:(V.x0-V.cam.tx)/V.cam.z};
  const only=pane===undefined?null:SPLIT_ITEMS[view]?new Set(SPLIT_ITEMS[view][pane]):null;
  const hero=!only||only.has('hero');
  return <PaneOnly.Provider value={only}><g data-world={key}>
   <Item id={sid+'-room'}>{sup({part:'room'})}</Item>
   <Item id={sid+'-desk'}>{sup({part:'desk'})}{sup({part:'deskProps'})}</Item>
   {hero&&<NoteHero pal={pal} st={st} layer="back" ids={ids}/>}
   {records(V)}
   {hero&&<NoteHero pal={pal} st={st} layer="front" ids={ids}/>}
  </g></PaneOnly.Provider>;
 };

 const cams=viewCameras(view);
 const camG=(c:Cam,child:React.ReactNode)=><g transform={`translate(${f2(c.tx)} ${f2(c.ty)}) scale(${f2(c.z)})`}>{child}</g>;
 let pic:React.ReactNode;
 if(spec.kind==='split'){
  pic=<g data-part="split">{PANES.map((p,i)=><g key={i}>
   <rect x={p[0]+8} y={p[1]+10} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
   <defs><clipPath id={`nc1110-pane-${i}`}><rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22}/></clipPath></defs>
   <g clipPath={`url(#nc1110-pane-${i})`} data-pane={i}>{camG(cams[i],world('pane'+i,{cam:cams[i],x0:p[0],x1:p[2]},i))}</g>
   <rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill="none" stroke={pal.paper} strokeWidth={8}/>
   <rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill="none" stroke={pal.ink} strokeWidth={2.5}/>
  </g>)}</g>;
 }else{
  pic=camG(cams[0],world('main',{cam:cams[0],x0:0,x1:1080}));
 }

 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText),box=disclosureBox(disclosureText);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs><filter id="nc1110-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g data-view={view} data-framing={shot.framing} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}>{pic}</g>
  <g data-disclosure="production_disclosure">
   <rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]} rx={16} fill={pal.paper}/>
   {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
  </g>
 </svg>;
};
