import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireNarration,type ActionWindow,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {NoteHero,SLOT,type HeroIds,type HeroState,type Pt} from './NoteHero';
import {ClinicRecordSupport,BILL,type SupportPart} from './ClinicRecordSupport';

/**
 * note-check-v1: who checks the draft (2026-11-10, Harris County, an illustrated Houston exam room).
 *
 * ONE generic wall note screen (NoteHero) on a swing arm over a worn desk carries the film, and the
 * records arrive on the desk in front of it (ClinicRecordSupport). Every performed state is a closed
 * function of the film clock and the board's event windows (noteState), so any frame renders alone and
 * the same twice. Completed results are kept: the draft line, the empty check slot, the open empty
 * tray, the thread to the source words and the hovering outlined check stay on the screen to the end.
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
 *  s6  Linked Evidence and Abridge says tabs clip onto the bezel and a strip of source words unrolls
 *      beside the screen; a thread draws from the draft line back to the matching row; an OUTLINED
 *      check mark comes down over the slot and hovers, its shadow apart from it: ready, not placed.
 *  s7  an enrolled bill card drops and an Effective September 1st, 2025 stamp lands crooked; its
 *      diagnosis tag lights; an AI tag slides in beside it and a frame draws round both.
 *  s8  the same card's second condition line highlights and reads review all AI-created records; an
 *      accent bracket reaches a stack of record cards each marked AI; a Texas Medical Board standards
 *      tag clips under the line. No person is drawn and nothing is checked off.
 *  s9  the card's own word diagnosis takes an accent frame; a visit note card slides up to the frame's
 *      edge and stops; a question mark tag rises and a dashed line marks where they meet.
 *  s10 a vendor thread from an Abridge says card and a statute thread from a Texas law card bend to
 *      the same EMPTY slot, which takes a Texas law requires review for diagnostic use tag; a how well the check works
 *      card hangs from the chin with an empty field and lands a not stated stamp; three source cards
 *      settle at the screen edge. The outlined check still hovers. It never lands.
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
type Boxes={medium:Box;close:Box;detail:Box;check:Box;split:[Box,Box]};
export const BOXES:Record<string,Boxes>={
 s1:{medium:[300,440,910,900],close:[470,456,900,800],detail:[430,560,700,700],check:[680,500,905,700],split:[[80,740,520,906],[470,456,900,800]]},
 s2:{medium:[300,880,900,1220],close:[60,880,560,1010],detail:[480,1080,900,1170],check:[480,540,905,1170],split:[[60,890,460,1220],[480,880,905,1170]]},
 s3:{medium:[300,880,900,1220],close:[300,1030,640,1220],detail:[80,890,300,1120],check:[320,540,905,1160],split:[[80,890,330,1120],[320,900,900,1220]]},
 s4:{medium:[220,900,900,1220],close:[50,930,640,1222],detail:[50,1050,410,1222],check:[460,540,905,1190],split:[[460,920,900,1190],[50,930,490,1222]]},
 s5:{medium:[60,1000,690,1215],close:[70,1056,480,1215],detail:[80,1140,300,1215],check:[300,540,905,1215],split:[[60,890,900,1000],[60,1050,900,1215]]},
 s6:{medium:[300,390,910,850],close:[300,500,720,820],detail:[740,480,890,640],check:[300,390,905,820],split:[[300,460,450,800],[488,474,882,736]]},
 s7:{medium:[320,890,900,1220],close:[330,1080,640,1160],detail:[620,1110,890,1205],check:[330,540,905,1215],split:[[330,980,890,1090],[330,1090,890,1215]]},
 s8:{medium:[60,970,780,1220],close:[330,1000,890,1080],detail:[640,1010,900,1095],check:[330,540,905,1100],split:[[60,975,330,1215],[330,1000,900,1100]]},
 s9:{medium:[330,900,900,1220],close:[100,980,560,1210],detail:[340,1086,560,1160],check:[330,540,905,1215],split:[[100,990,560,1210],[330,900,900,1220]]},
 s10:{medium:[380,440,910,1120],close:[360,520,910,940],detail:[700,520,905,940],check:[380,520,910,1110],split:[[60,1020,380,1210],[380,500,910,1110]]},
};
export const ZMAX=3.2;
/** Fit a world box into a frame box: one uniform scale, centred. */
export function fit(box:Box,band:{x0:number;y0:number;x1:number;y1:number},zmax=ZMAX,bottom=false):Cam{
 const z=Math.min((band.x1-band.x0)/(box[2]-box[0]),(band.y1-band.y0)/(box[3]-box[1]),zmax);
 const cx=(box[0]+box[2])/2,cy=(box[1]+box[3])/2,fx=(band.x0+band.x1)/2,fy=(band.y0+band.y1)/2;
 return bottom?{z,tx:fx-cx*z,ty:band.y1-box[3]*z}:{z,tx:fx-cx*z,ty:fy-cy*z};
}
/** A medium shot of the desk sits low in the band, so the room's window keeps its share of the frame
 * above the desk: centred, the zoomed desk rose over most of the glass. */
export const DESK_MEDIUM_BOTTOM=1000,DESK_MEDIUM_ZMAX=1.35;
const paneBand=(p:Box)=>({x0:p[0]+10,y0:p[1]+10,x1:p[2]-10,y1:p[3]-10});
/** The camera(s) a view uses: one, or two for a split. */
export function viewCameras(view:string):Cam[]{
 const {sid,kind}=viewSpec(view),B=BOXES[sid];
 if(kind==='wide')return [{z:1,tx:0,ty:0}];
 if(kind==='split')return [fit(B.split[0],paneBand(PANES[0])),fit(B.split[1],paneBand(PANES[1]))];
 const desk=kind==='medium'&&B.medium[3]>DESK_MEDIUM_BOTTOM;
 return [fit(B[kind],kind==='check'?CHECK_BAND:BAND,desk?DESK_MEDIUM_ZMAX:ZMAX,desk)];
}
export const camPoint=(c:Cam,p:Pt):Pt=>[c.tx+c.z*p[0],c.ty+c.z*p[1]];

// ---- the desk's records, in world pixels ---------------------------------------------------------------
export const LAYOUT={
 lane:{x:70,y:902,w:380},pilots:[{hole:[184,930] as Pt,lines:['DAX']},{hole:[292,930] as Pt,lines:['Abridge']}],
 post:{x:70,y:984,w:380,h:230,r:-2.5},platform:{x:488,y:930,w:404,h:236},epic:{hole:[552,930] as Pt},
 calendar:{x:92,y:902},nodate:{hole:[112,1084] as Pt},figures:{x0:384,dx:92,base:1146,n:6,fill:4},arrow:{x:700,y:944,w:180},
 physicians:{x:340,y:926},refresher:{hole:[330,1178] as Pt},
 release:{x:470,y:934,w:416,h:250,r:1.8},date:{x:600,y:1128},agreement:{hole:[236,978] as Pt},clip:{x:478,y:962},
 initiative:{x:64,y:1066,w:336,h:148,r:-1.5},tie:{a:[236,978] as Pt,c:[330,1012] as Pt,b:[376,1074] as Pt},
 frame:{x:80,y:904,w:810,h:86},inst:{x0:84,dx:204,y:1064,w:186,h:146,n:4},
 bill:{x:330,y:904,r:-1.2},records:{x:64,y:1060,n:5},bracket:{x:312,y0:978,y1:1206},
 vnote:{x:112,y:1080,from:-320},question:{x:300,y0:1080,y1:1022},meet:{x:344,y0:1086,y1:1200},
 design:{x:400,y:956,w:280,h:150,r:-2},statute:{x:66,y:1030,w:306,h:176,r:1.5},designFrom:[540,958] as Pt,statuteFrom:[220,1032] as Pt,
};

/** Every performed state, a closed function of the film clock and the board's event windows. */
export function noteState(W:Record<string,ActionWindow>,t:number){
 const P=(id:string)=>W[id]?actionProgress(W[id],t):0;
 const e11=P('s1-event-1'),e12=P('s1-event-2'),e13=P('s1-event-3');
 const head=.8*e11+.2*e12,tail=e12>0?lerp(.3,1,e12):Math.max(0,head-.5);
 const hero:HeroState={
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

const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
/** One drawn object that carries several of the board's subjects at once. */
const Items:React.FC<{ids:string[];children:React.ReactNode}>=({ids,children})=><g data-item={ids[0]} data-items={ids.join(' ')}>{children}</g>;
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
 const heroSt:HeroState=sid==='s10'?{...S.hero,...S.close,designFrom:L.designFrom,statuteFrom:L.statuteFrom}:{...S.hero,ribbon:sid==='s1'?S.hero.ribbon:null};
 const ids:HeroIds=sid==='s1'?{note:'s1-note',draftline:'s1-draftline',checkbox:'s1-checkbox',record:'s1-record',speech:'s1-speech'}
  :sid==='s6'?{note:'s6-note',draftline:'s6-draftline',source:'s6-source',links:'s6-links',verify:'s6-verify'}
  :sid==='s10'?{check:'s10-check',statute:'s10-statute',design:'s10-design',howwell:'s10-howwell',sources:'s10-sources'}:{};

 // ---- each scene's records on the desk ----
 const records=():React.ReactNode=>{
  switch(sid){
  case 's2':{const s=S.s2,k=smooth(s.post);
   return <g>
    <Item id="s2-pilots"><At p={[L.lane.x,L.lane.y]}>{sup({part:'pilotLane',w:L.lane.w})}</At>
     {L.pilots.map((g,i)=>{const p=clamp((s.pilots-i*.3)/.7);if(p<=0)return null;const q=smooth(p);
      return <At key={i} p={[g.hole[0],g.hole[1]-56*(1-q)]} o={clamp(p*3)}>{sup({part:'tag',lines:g.lines,size:22,swing:-8*(1-q)})}</At>;})}</Item>
    <Item id="s2-post"><At p={[L.post.x-520*(1-k),L.post.y]} r={L.post.r-6*(1-k)} o={clamp(s.post*4)}>
     {sup({part:'card',w:L.post.w,h:L.post.h,header:'UTHealth Houston post',title:['UT Physicians'],titleSize:40,marks:2,seed:3})}</At></Item>
    <Item id="s2-platform"><Item id="s2-progress"><At p={[L.platform.x,L.platform.y]}>
     {sup({part:'platform',w:L.platform.w,h:L.platform.h,draw:s.draw,fill:s.fill,stopAt:.36,working:s.working})}</At></Item>
     {s.epic>0&&<At p={[L.epic.hole[0],L.epic.hole[1]-70*(1-smooth(s.epic))]} o={clamp(s.epic*3)}>{sup({part:'clip',w:22})}
      {sup({part:'tag',lines:['Epic ambient','listening'],size:23,tone:'teal',swing:-14*(1-smooth(s.epic))})}</At>}</Item>
   </g>;}
  case 's3':{const s=S.s3,F=L.figures;
   return <g>
    <Item id="s3-nodate"><At p={[L.calendar.x,L.calendar.y]}>{sup({part:'calendar'})}</At>
     {s.cal>0&&<g opacity={f2(clamp(s.cal*3))}>
      <path d={`M190 1052Q160 ${f2(1070)} ${f2(L.nodate.hole[0]+4)} ${f2(L.nodate.hole[1]-40*(1-smooth(s.cal)))}`} stroke={pal.ink} strokeWidth={2} fill="none"/>
      <At p={[L.nodate.hole[0],L.nodate.hole[1]-40*(1-smooth(s.cal))]}>{sup({part:'tag',lines:['no date','stated'],size:21,swing:-10*(1-smooth(s.cal))})}</At></g>}</Item>
    <Item id="s3-rollout">
     <text x={L.physicians.x} y={L.physicians.y} fontFamily={FONT.body} fontSize={24} fontWeight={800} fill={pal.foreground}>physicians</text>
     {Array.from({length:F.n}).map((_,i)=>{const p=i<F.fill?clamp((s.fill-.05-i*.22)/.2):0;
      return <At key={i} p={[F.x0+i*F.dx,F.base]}>{sup({part:'figure',filled:p})}</At>;})}
     <At p={[L.arrow.x,L.arrow.y]}>{sup({part:'arrow',w:L.arrow.w,p:clamp((s.fill-.7)/.3),label:'eventually'})}</At></Item>
    {s.refresher>0&&<Item id="s3-refresher"><g opacity={f2(clamp(s.refresher*3))}>
     <path d={`M${F.x0} 1100Q${F.x0-30} 1150 ${f2(L.refresher.hole[0]+4)} ${f2(L.refresher.hole[1]+40*(1-smooth(s.refresher)))}`} stroke={pal.ink} strokeWidth={2} fill="none"/>
     <At p={[L.refresher.hole[0],L.refresher.hole[1]+40*(1-smooth(s.refresher))]}>{sup({part:'tag',lines:['Epic refresher'],size:22,tone:'teal',swing:8*(1-smooth(s.refresher))})}</At></g></Item>}
   </g>;}
  case 's4':{const s=S.s4,k=smooth(s.drop),ki=smooth(s.init),ka=smooth(s.agree);
   return <g>
    <Item id="s4-release"><At p={[L.release.x,L.release.y-110*(1-k)]} r={L.release.r} s={1+.04*(1-k)} o={clamp(s.drop*4)}>
     {sup({part:'card',w:L.release.w,h:L.release.h,header:'Abridge release',title:['Press release'],titleSize:34,marks:3,seed:5})}</At>
     <Item id="s4-date"><At p={[L.date.x,L.date.y]}>{sup({part:'stamp',lines:['October 8th, 2026'],size:24,p:clamp((s.drop-.5)/.5),rot:-6})}</At></Item></Item>
    {s.init>0&&<Item id="s4-initiative"><At p={[L.initiative.x-460*(1-ki),L.initiative.y]} r={L.initiative.r} o={clamp(s.init*4)}>
     {sup({part:'card',w:L.initiative.w,h:L.initiative.h,header:'initiative',title:['University of Texas','REAL Health AI'],titleSize:26,marks:0,seed:6})}</At></Item>}
    {s.agree>0&&<Item id="s4-agreement"><g opacity={f2(clamp(s.agree*3))}>
     {s.tie<1&&<path d={`M${L.tie.a[0]} ${L.tie.a[1]}Q200 1010 ${f2(214+6*(1-ka))} 1052`} stroke={pal.foreground} strokeWidth={4} fill="none" strokeLinecap="round" opacity={f2(1-smooth(s.tie))}/>}
     {sup({part:'thread',a:L.tie.a,c:L.tie.c,b:L.tie.b,p:s.tie,w:4})}
     <At p={[L.agreement.hole[0]-40*(1-ka),L.agreement.hole[1]-50*(1-ka)]} r={-20*(1-ka)}>{sup({part:'tag',lines:['enterprise-wide','agreement'],size:21,tone:'accent'})}</At>
     <At p={[L.clip.x,L.clip.y]} r={4} o={ka}>{sup({part:'clip',w:24})}</At></g></Item>}
   </g>;}
  case 's5':{const s=S.s5,F=L.frame,C=L.inst;
   return <g>
    <Item id="s5-framework"><At p={[F.x,F.y]}>{sup({part:'framework',w:F.w,h:F.h,draw:s.frame})}</At></Item>
    <Item id="s5-access">{Array.from({length:C.n}).map((_,i)=>{const p=clamp((s.access-i*.15)/.55),bx=C.x0+i*C.dx+C.w/2;
     return <g key={i}>{sup({part:'thread',a:[F.x+F.w/2,F.y+F.h],c:[lerp(F.x+F.w/2,bx,.5),1046],b:[bx,C.y+2],p,w:3.5})}</g>;})}</Item>
    <Item id="s5-institutions"><Item id="s5-decisions">{Array.from({length:C.n}).map((_,i)=>
     <At key={i} p={[C.x0+i*C.dx,C.y]} r={(i%2?1:-1)*1.2}>{sup({part:'institution',w:C.w,h:C.h,sw:clamp((s.sw-i*.2)/.4)})}</At>)}</Item></Item>
   </g>;}
  case 's7':case 's8':case 's9':{
   const s7=S.s7,s8=S.s8,s9=S.s9,k=smooth(s7.drop);
   const bill=sup({part:'bill',w:BILL.w,h:BILL.h,diag:s7.diag,ai:s7.ai,aiFrame:clamp((s7.ai-.5)/.5),stamp:clamp((s7.drop-.55)/.45),
    hl:sid==='s7'?0:s8.hl,std:sid==='s7'?0:s8.std,dframe:sid==='s9'?s9.frame:0});
   return <g>
    {s7.drop>0&&<Items ids={BILL_IDS[sid]}>
     <At p={[L.bill.x,L.bill.y-120*(1-k)]} r={L.bill.r} s={1+.04*(1-k)} o={clamp(s7.drop*4)}>{bill}</At></Items>}
    {sid==='s8'&&<g>
     <Item id="s8-records"><At p={[L.records.x,L.records.y]}>{sup({part:'records',n:L.records.n})}</At></Item>
     {sup({part:'bracket',x:L.bracket.x,y0:L.bracket.y0,y1:L.bracket.y1,from:[L.bill.x+18,L.bill.y+BILL.lines[1]],p:s8.bracket})}</g>}
    {sid==='s9'&&<g>
     {s9.note>0&&<Item id="s9-visitnote"><At p={[lerp(L.vnote.from,L.vnote.x,smooth(s9.note)),L.vnote.y]} r={-2*(1-smooth(s9.note))} o={clamp(s9.note*4)}>
      {sup({part:'visitNote'})}</At></Item>}
     {s9.q>0&&<Item id="s9-question">
      <path d={`M${L.meet.x} ${L.meet.y0}V${f2(lerp(L.meet.y0,L.meet.y1,smooth((s9.q-.3)/.7)))}`} stroke={pal.accent} strokeWidth={4} strokeDasharray="9 7"/>
      <At p={[L.question.x,lerp(L.question.y0,L.question.y1,smooth(s9.q/.7))]}>{sup({part:'question',p:clamp(s9.q/.5)})}</At></Item>}</g>}
   </g>;}
  case 's10':return <g>
    <Item id="s10-design"><At p={[L.design.x,L.design.y]} r={L.design.r}>{sup({part:'card',w:L.design.w,h:L.design.h,header:'Abridge says',title:['clinicians','can verify'],titleSize:30,marks:0,seed:8})}</At></Item>
    <Item id="s10-statute"><At p={[L.statute.x,L.statute.y]} r={L.statute.r}>{sup({part:'card',w:L.statute.w,h:L.statute.h,header:'Texas law',title:['review for','diagnostic use'],titleSize:28,marks:0,seed:9,tint:'#F6EEE0'})}</At></Item>
   </g>;
  default:return null;
  }
 };

 const world=(key:string)=><g data-world={key}>
  <Item id={sid+'-room'}>{sup({part:'room'})}</Item>
  <Item id={sid+'-desk'}>{sup({part:'desk'})}{sup({part:'deskProps'})}</Item>
  <NoteHero pal={pal} st={heroSt} layer="back" ids={ids}/>
  {records()}
  <NoteHero pal={pal} st={heroSt} layer="front" ids={ids}/>
 </g>;

 const cams=viewCameras(view);
 const camG=(c:Cam,child:React.ReactNode)=><g transform={`translate(${f2(c.tx)} ${f2(c.ty)}) scale(${f2(c.z)})`}>{child}</g>;
 let pic:React.ReactNode;
 if(spec.kind==='split'){
  pic=<g data-part="split">{PANES.map((p,i)=><g key={i}>
   <rect x={p[0]+8} y={p[1]+10} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill={pal.ink} opacity={.2} filter="url(#nc1110-soft)"/>
   <defs><clipPath id={`nc1110-pane-${i}`}><rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22}/></clipPath></defs>
   <g clipPath={`url(#nc1110-pane-${i})`}>{camG(cams[i],world('pane'+i))}</g>
   <rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill="none" stroke={pal.paper} strokeWidth={8}/>
   <rect x={p[0]} y={p[1]} width={p[2]-p[0]} height={p[3]-p[1]} rx={22} fill="none" stroke={pal.ink} strokeWidth={2.5} strokeOpacity={.5}/>
  </g>)}</g>;
 }else{
  pic=camG(cams[0],world('main'));
 }
 // B keeps the empty slot as its fixed point: on its check views four short accent ticks mark it
 let reticle:React.ReactNode=null;
 if(v==='b'&&spec.kind==='check'){
  const c=cams[0],p=[c.tx+c.z*SLOT.x,c.ty+c.z*SLOT.y],r=SLOT.s*c.z*.5+16,k=12+6*c.z;
  reticle=<g data-part="slot-reticle" stroke={pal.accent} strokeWidth={4} fill="none" strokeLinecap="round" opacity={.85}>
   {[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy],i)=><path key={i} d={`M${f2(p[0]+sx*r)} ${f2(p[1]+sy*(r-k))}V${f2(p[1]+sy*r)}H${f2(p[0]+sx*(r-k))}`}/>)}
  </g>;
 }

 const disclosureText=(scene as typeof scene&{production_disclosure?:string}).production_disclosure??'Illustration';
 const dLines=disclosureLines(disclosureText),box=disclosureBox(disclosureText);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs><filter id="nc1110-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g data-view={view} data-framing={shot.framing} data-clause={clause?.id} data-action={act} data-variant={v} data-scene-time={(t-scene.start_s).toFixed(3)}>{pic}{reticle}</g>
  <g data-disclosure="production_disclosure">
   <rect x={box[0]} y={box[1]} width={box[2]-box[0]} height={box[3]-box[1]} rx={16} fill={pal.paper} opacity={.93}/>
   {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
  </g>
 </svg>;
};
