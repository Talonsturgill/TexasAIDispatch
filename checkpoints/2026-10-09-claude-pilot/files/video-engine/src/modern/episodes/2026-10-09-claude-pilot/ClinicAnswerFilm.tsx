import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {ChartHero,HERO_SIZE,ANSWER_SOURCES,ANSWER_ACCURACY,type TagId,type CitationKind} from './ChartHero';
import {ClinicSupport,KEY,keyCenter,WALL_PINS,ARM_REST,TOOL} from './ClinicSupport';

/**
 * clinic-answer-v1: a clinician's question goes into the OpenEvidence tool at the edge of the
 * health record and one answer comes back with its sources.
 *
 * One question card, one answer card and ONE set of three citation cards. The citations come
 * out of the tool behind the answer and tuck into its Sources slot; they come back out of that
 * slot only when a shot reads them, and their chips leave the slot while they are out. The
 * Accuracy slot is drawn empty and never filled; the release's unpublished measures hang from
 * the answer's own clip. Nothing appears from nowhere: cards go into and come out of the tool
 * under its face and below its mouth line, and the literature card rises out of the Sources slot.
 *
 * Anonymous scrub-sleeved arms enter from beyond the bottom of the frame; a key goes down only
 * while a fingertip is on it, idle hands rest flat, and the arms leave the picture once the
 * clinician stops acting. B's push is one stroke: the card moves on a single eased path, the hand
 * rides it, then releases it at speed and slows while the card glides on into the tool.
 *
 * A: a higher camera on a clinic wall. The chart hangs on a rail behind the desk, the tool is
 *    wall-mounted at its right and the usage share board hangs high above it, framed frontally.
 * B: a desk-level camera. The chart stands propped on the desk, the tool stands beside it, the
 *    usage share hangs lower over the tool and is framed from the desk, with its own cameras.
 *
 * The usage share is a framed board of anonymous clinician figures; the shots that read it frame
 * the figures close, then the bar, its tag and the tool, and keep the tool either wholly above the
 * caption band or below it. The release's open tags get their own close at the moment their
 * "Not in release" line appears. The film ends on the answer card close on the desk, its Accuracy
 * slot still empty, with the share board and its evaluating tag on the wall behind it.
 *
 * Every state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. Disclosed illustration: no UTMB screen, vendor interface, answer
 * content, clinician identity, patient or patient detail.
 */

type Pt=[number,number];
type V='a'|'b';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const bez=(a:Pt,c:Pt,b:Pt,u:number):Pt=>{const v=clamp(u);return [(1-v)*(1-v)*a[0]+2*(1-v)*v*c[0]+v*v*b[0],(1-v)*(1-v)*a[1]+2*(1-v)*v*c[1]+v*v*b[1]];};
const mixPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const add=(a:Pt,b:Pt):Pt=>[a[0]+b[0],a[1]+b[1]];
const sub=(a:Pt,b:Pt):Pt=>[a[0]-b[0],a[1]-b[1]];
const scale=(a:Pt,s:number):Pt=>[a[0]*s,a[1]*s];

/** Place a part; `flat` lays it back onto the desk plane (perspective foreshortening). */
const At:React.FC<{p:Pt;s?:number;r?:number;flat?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,flat=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) matrix(1 0 ${-.22*flat} ${1-.38*flat} 0 0) scale(${s})`} opacity={o}>{children}</g>;
/** The same mapping in numbers, for anchoring a thread or a fingertip to a placed part. */
const placed=(p:Pt,s:number,flat:number,local:Pt):Pt=>[p[0]+s*local[0]-.22*flat*s*local[1],p[1]+(1-.38*flat)*s*local[1]];
/** A camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,760],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A tag that drops onto its pin and settles without bounce. */
const Hang:React.FC<{pin:Pt;tag:TagId;in:number;s:number;drop?:number;side?:'left'|'right';second?:number}>=({pin,tag,in:shown,s,drop=0,side='right',second})=>
 shown<=0?null:<At p={[pin[0],pin[1]-50*(1-ease(shown))]} s={s} o={clamp(shown*3)}>
  <ChartHero part="tag" tag={tag} swing={12*(1-ease(shown))*(side==='left'?-1:1)} drop={drop} side={side} second={second??1}/></At>;

// ---- the two worlds: fixed placements of every object (world units) ----
type World={stage:'front'|'desk';chart:Pt;stand?:Pt;boundary:{p:Pt;w:number;h:number;slot:number;lockY:number};tool:Pt;board:Pt;boardS:number;
 boardTags:{decision:{pin:keyof typeof WALL_PINS;side:'left'|'right';drop:number};report:{pin:keyof typeof WALL_PINS;side:'left'|'right';drop:number};evaluating:{pin:keyof typeof WALL_PINS;side:'left'|'right';drop:number}};
 keyboard:Pt;kbS:number;question:Pt;qS:number;qFlat:number;credential:Pt;credS:number;answer:Pt;aS:number;aFlat:number;workstation?:Pt;rail?:{p:Pt;w:number};
 sendCtrl:Pt;sendEnd:Pt;stopAt:Pt;answerPath:Pt[];citeFan:Pt[]};
const WORLDS:Record<V,World>={
 a:{stage:'front',chart:[150,578],boundary:{p:[132,542],w:376,h:540,slot:.44,lockY:.55},tool:[530,700],board:[540,40],boardS:.46,
  boardTags:{decision:{pin:'start',side:'right',drop:0},report:{pin:'end',side:'left',drop:90},evaluating:{pin:'start',side:'right',drop:180}},
  keyboard:[-140,1050],kbS:.8,question:[196,800],qS:.75,qFlat:0,credential:[60,982],credS:.72,answer:[600,1020],aS:.8,aFlat:.25,
  workstation:[-90,740],rail:{p:[110,556],w:420},
  sendCtrl:[420,800],sendEnd:[560,760],stopAt:[300,800],answerPath:[[560,700],[580,868],[600,1020]],citeFan:[[480,930],[550,920],[620,915]]},
 b:{stage:'desk',chart:[150,404],stand:[130,400],boundary:{p:[132,366],w:376,h:548,slot:.82,lockY:.8},tool:[516,724],board:[500,150],boardS:.46,
  boardTags:{decision:{pin:'end',side:'left',drop:0},report:{pin:'half',side:'left',drop:90},evaluating:{pin:'end',side:'left',drop:170}},
  keyboard:[-150,985],kbS:.8,question:[176,905],qS:.72,qFlat:.6,credential:[-60,906],credS:.78,answer:[610,975],aS:.8,aFlat:.25,
  sendCtrl:[440,885],sendEnd:[560,815],stopAt:[400,892],answerPath:[[560,740],[600,880],[610,975]],citeFan:[[420,915],[490,905],[560,898]]},
};
const BOARD_TAG_S=.74, CHART_TAG_S=.9;

// ---- hands: a strike schedule; a finger touches its key only inside its own strike ----
type Strike={t:number;side:'L'|'R';finger:number};
const SEQ:[('L'|'R'),number][]=[['R',0],['L',1],['R',1],['L',0],['R',2],['L',2],['R',0],['L',1]];
const strikes=(t0:number,t1:number,n:number,enter=false):Strike[]=>Array.from({length:n},(_,j)=>{
 const last=enter&&j===n-1;return {t:t0+(t1-t0)*(j+.5)/n,side:last?'R':SEQ[j%SEQ.length][0],finger:last?2:SEQ[j%SEQ.length][1]};});
const HOVER=.3, CONTACT=.09;
/** Hover while typing; rest flat (lift 0, no key down) outside a typing run. */
function fingerLift(list:Strike[],side:'L'|'R',finger:number,t:number){
 if(!list.length)return 0;
 const first=list[0].t-.35,last=list[list.length-1].t+.35;
 if(t<first-.2||t>last+.2)return 0;
 let lift=HOVER*ease(Math.min((t-(first-.2))/.2,(last+.2-t)/.2));
 for(const s of list){if(s.side!==side||s.finger!==finger)continue;
  const d=t-s.t;
  if(d>=-.16&&d<0){const u=(d+.16)/.16;lift=u<.5?lift+(1-lift)*ease(u*2):1-ease((u-.5)*2);}
  else if(d>=0&&d<CONTACT)lift=0;
  else if(d>=CONTACT&&d<CONTACT+.12)lift=HOVER*ease((d-CONTACT)/.12);}
 return lift;
}
/** Index fingers rest three keys apart (columns 2 and 5); each finger strikes the key under it. */
const HOME={L:2,R:5};
const keyOf=(side:'L'|'R',finger:number)=>KEY.cols+HOME[side]+(side==='R'?finger:-finger);

export const ClinicAnswerFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Clinic answer film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Clinic answer film must read the single film frame clock');
 const c=ad.palette, v=variant, Wd=WORLDS[v];
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const win=(id:string)=>requireAction(W,id);
 const p=(id:string)=>actionProgress(win(id),t);
 const raw=(w:{start:number;end:number},at=t)=>clamp((at-w.start)/(w.end-w.start));
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id, after=(s:string)=>sid>s, at=(s:string)=>sid===s;
 const flat=ad.flat_shots?.[sid];

 // ---- performed states, each read from its own event on the film clock ----
 const e1=win('s1-event-1'),send=p('s1-event-1'),ret=p('s1-event-2'),land=p('s1-event-3');
 const glow=p('s2-event-1'),announced=p('s2-event-2'),live=p('s2-event-3');
 const n3a=requireNarration(board,'n3a'),lockWin=win('s3-event-1'),lockOpen=p('s3-event-1');
 const typeWin=win('s3-event-2'),slideWin=win('s3-event-3'),slide3=p('s3-event-3');
 const fan=p('s4-event-1'),liftLit=p('s4-event-2'),liftGuide=p('s4-event-3');
 const tiles=p('s5-event-1'),share=p('s5-event-2'),decision=p('s5-event-3');
 const report=p('s6-event-1'),limits=p('s6-event-2'),notInRelease=p('s6-event-3');
 const trace=p('s7-event-1'),slotLight=p('s7-event-2'),noCheck=p('s7-event-3');
 const evalTag=p('s8-event-1'),sourcesHold=p('s8-event-2'),finalPulse=p('s8-event-3');
 const n7a=requireNarration(board,'n7a');

 // Typing schedules. The opening frame already shows a question being typed. A sends with a final
 // key strike; B's last strike lands before the right hand leaves the keys to push.
 const s1Strikes=strikes(-.62,v==='a'?e1.start-.06:e1.start-.3,9,v==='a');
 const dotStrikes=strikes(n3a.start+.15,lockWin.start-.05,8);
 const qStrikes=strikes(typeWin.start,v==='a'?slideWin.start-.04:typeWin.end,v==='a'?9:8,v==='a');
 const list=sid==='s1'?s1Strikes:sid==='s3'?[...dotStrikes,...qStrikes]:[];
 const done=(ls:Strike[])=>ls.filter(s=>t>=s.t).length/ls.length;
 const typed1=done(s1Strikes), dots=done(dotStrikes), typed3=done(qStrikes);
 const processing=at('s1')&&t>=e1.end&&ret<=0?.5+.5*Math.sin((t-e1.end)*9):0;
 const toolGlow=at('s2')?glow:processing;
 const handsShown=sid<='s3';

 // ---- the question card: one eased path per send, so it never stops and restarts ----
 const qHome=Wd.question;
 const sendPos=(u:number):Pt=>bez(qHome,Wd.sendCtrl,Wd.sendEnd,u);
 const s3Pos=(u:number):Pt=>mixPt(qHome,Wd.stopAt,u);
 const q=(():{p:Pt;s:number;show:boolean;typed:number;plain:number}=>{
  if(at('s1')||at('s2')){
   if(t<e1.start)return {p:qHome,s:Wd.qS,show:true,typed:typed1,plain:0};
   const u=v==='b'?ease(raw(e1)):send;
   return {p:sendPos(u),s:lerp(Wd.qS,Wd.qS*.84,u),show:raw(e1)<1,typed:1,plain:0};
  }
  if(at('s3'))return {p:s3Pos(v==='b'?ease(raw(slideWin)):slide3),s:Wd.qS,show:true,typed:typed3,plain:typed3};
  return {p:Wd.stopAt,s:Wd.qS,show:after('s3'),typed:1,plain:1};
 })();

 // ---- B's push: reach, ride the card, release at speed, slow, return. The arm pivots at the elbow. ----
 const kbTip=(side:'L'|'R')=>add(Wd.keyboard,scale(keyCenter(1,HOME[side]),Wd.kbS));
 const contactOf=(pt:Pt,s:number)=>placed(pt,s,Wd.qFlat,[96,150]);
 let rReach=0,rShift:Pt=[0,0];
 const pushWin=v==='b'?(at('s1')?{w:e1,path:(u:number)=>contactOf(sendPos(u),lerp(Wd.qS,Wd.qS*.84,u)),reachFrom:e1.start-.22}
  :at('s3')?{w:slideWin,path:(u:number)=>contactOf(s3Pos(u),Wd.qS),reachFrom:typeWin.end+.04}:null):null;
 if(pushWin&&t>=pushWin.reachFrom){
  const {w,path}=pushWin, dur=w.end-w.start, REL=.45, T=.28;
  const tipAt=(u:number)=>path(ease(u));
  const rest=kbTip('R');
  let tip:Pt;
  if(t<w.start){const u=ease((t-pushWin.reachFrom)/(w.start-pushWin.reachFrom));tip=mixPt(add(rest,[0,-26*Wd.kbS]),tipAt(0),u);rReach=u;}
  else{
   const r=raw(w);
   rReach=1;
   if(r<=REL)tip=tipAt(r);
   else{
    const tr=w.start+REL*dur, tau=Math.min(t-tr,T);
    const vel=scale(sub(tipAt(REL+.005),tipAt(REL-.005)),1/(.01*dur));
    tip=add(tipAt(REL),scale(vel,tau-tau*tau/(2*T)));
    const back=clamp((t-tr-T)/.5);
    if(back>0){tip=mixPt(tip,add(rest,[0,-26*Wd.kbS]),ease(back));rReach=1-ease(back);}
   }
  }
  rShift=sub(tip,add(rest,[0,-26*Wd.kbS*rReach]));
 }
 // the elbow follows a third of the hand's travel; the shoulder stays put below the frame
 const elbowR=sub(ARM_REST.elbow,scale(rShift,.65/Wd.kbS)), shoulderR=sub(ARM_REST.shoulder,scale(rShift,1/Wd.kbS));
 const handLift=(side:'L'|'R')=>[0,1,2,3].map(f=>fingerLift(list,side,f,t));
 const keysDown=list.filter(s=>t>=s.t&&t<s.t+CONTACT).map(s=>keyOf(s.side,s.finger));

 // ---- the answer: out of the tool mouth, onto the desk ----
 const answerIn=at('s1')?ret:1;
 const answerPt=at('s1')?(ret<.4?mixPt(Wd.answerPath[0],Wd.answerPath[1],ease(ret/.4)):mixPt(Wd.answerPath[1],Wd.answerPath[2],ease((ret-.4)/.6))):Wd.answerPath[2];
 const answerS=at('s1')?lerp(.6,Wd.aS,ease(ret)):Wd.aS, answerFlat=at('s1')?Wd.aFlat*ease(ret):Wd.aFlat;
 const sourcesFill=at('s1')?clamp((land-.55)/.45):1;
 const limitsOn=at('s6')?limits:after('s6')?1:0, limitText=at('s6')?notInRelease:1;
 const slotPt=placed(Wd.answer,Wd.aS,Wd.aFlat,ANSWER_SOURCES);
 const kinds:CitationKind[]=['other','guidelines','literature'];
 const screenGlow=at('s1')?1:at('s3')?.5+.5*typed3:.5;
 const tb=TOOL[Wd.stage], mouthY=Wd.tool[1]+tb.mouthY;

 const world=(extra:React.ReactNode=null)=>{
  const B=Wd.boundary;
  const pinB=(f:number):Pt=>[B.p[0]+B.w*f,B.p[1]];
  const pinBoard=(k:keyof typeof WALL_PINS):Pt=>add(Wd.board,scale(WALL_PINS[k],Wd.boardS));
  const lockState=at('s3')?lockOpen:1;
  const bt=Wd.boardTags;
  const boundary=<At p={B.p}><ClinicSupport part="boundary" w={B.w} h={B.h} glow={at('s2')?glow:.25} lock={lockState} slot={B.slot} lockY={B.lockY}/></At>;
  const questionCard=q.show&&<At p={q.p} s={q.s} flat={Wd.qFlat}><ChartHero part="question" typed={q.typed} plain={q.plain}/></At>;
  // the answer and the citations are clipped below the tool mouth line and drawn before the tool,
  // so they slide out of it instead of appearing
  const emerging=at('s1');
  const answerCard=answerIn>0&&<At p={answerPt} s={answerS} flat={answerFlat}>
   <ChartHero part="answer" sources={sourcesFill} limits={limitsOn} limitText={limitText} lift={at('s1')?1-ease(ret):0}
    sourcesGlow={at('s8')?Math.sin(Math.PI*sourcesHold):0} ring={at('s8')&&finalPulse>0&&finalPulse<1?finalPulse:0}/></At>;
  const citations=emerging&&land>0&&land<1&&kinds.map((k,i)=>{
   const u1=clamp(land/.45),u2=clamp((land-.45)/.55);
   const pos=u2<=0?mixPt(Wd.answerPath[0],Wd.citeFan[i],ease(u1)):mixPt(Wd.citeFan[i],slotPt,ease(u2));
   return <At key={k} p={pos} s={lerp(.42,.1,ease(u2))} flat={.5} r={-8+i*8} o={1-clamp((u2-.8)/.2)}><ChartHero part="citation" kind={k} lift={.4}/></At>;
  });
  const fromMouth=<g clipPath={emerging?`url(#mouth-${v})`:undefined}>{answerCard}{citations}</g>;
  const hands=handsShown&&<>
   <At p={kbTip('L')} s={Wd.kbS}><ClinicSupport part="hands" side="L" lift={handLift('L')}/></At>
   <At p={add(kbTip('R'),rShift)} s={Wd.kbS}><ClinicSupport part="hands" side="R" lift={rReach>0?[0,1,1,1]:handLift('R')} reach={rReach} elbow={elbowR} shoulder={shoulderR}/></At>
  </>;
  return <g data-world={v==='a'?'a-wall-chart':'b-desk-level'}>
   <defs><clipPath id={`mouth-${v}`}><rect x={-400} y={mouthY} width={2400} height={2400}/></clipPath></defs>
   <ClinicSupport part="room" stage={Wd.stage} spill={.6}/>
   <At p={Wd.board} s={Wd.boardS}><ClinicSupport part="wall" lit={after('s4')?clamp(.45*(at('s5')?tiles:1)+.55*(at('s5')?share:1)):0} share={after('s4')?(at('s5')?share:1):0} label={after('s4')?(at('s5')?share:1):0}/></At>
   <Hang pin={pinBoard(bt.decision.pin)} tag="decision" in={at('s5')?decision:after('s5')?1:0} s={BOARD_TAG_S} side={bt.decision.side} drop={bt.decision.drop}/>
   <Hang pin={pinBoard(bt.report.pin)} tag="report" in={at('s6')?report:after('s6')?1:0} s={BOARD_TAG_S} side={bt.report.side} drop={bt.report.drop}/>
   <Hang pin={pinBoard(bt.evaluating.pin)} tag="evaluating" in={at('s8')?evalTag:0} s={BOARD_TAG_S} side={bt.evaluating.side} drop={bt.evaluating.drop}/>
   {Wd.rail&&<At p={Wd.rail.p}><ClinicSupport part="rail" w={Wd.rail.w}/></At>}
   {v==='a'&&<>{boundary}<At p={Wd.chart}><ChartHero part="chart"/></At>{questionCard}</>}
   <ClinicSupport part="desk" stage={Wd.stage}/>
   {Wd.workstation&&<At p={Wd.workstation} s={.9}><ClinicSupport part="workstation" glow={screenGlow}/></At>}
   {v==='b'&&<><At p={Wd.stand!}><ClinicSupport part="stand"/></At>{boundary}<At p={Wd.chart}><ChartHero part="chart" seed={5}/></At></>}
   <At p={Wd.keyboard} s={Wd.kbS}><ClinicSupport part="keyboard" down={keysDown}/></At>
   {v==='b'&&questionCard}
   {fromMouth}
   <At p={Wd.tool}><ClinicSupport part="tool" stage={Wd.stage} glow={toolGlow}/></At>
   <Hang pin={pinB(.18)} tag="announced" in={at('s2')?announced:after('s2')?1:0} s={CHART_TAG_S}/>
   <Hang pin={pinB(.5)} tag="live" in={at('s2')?live:after('s2')?1:0} s={CHART_TAG_S} drop={120}/>
   {at('s3')&&<At p={Wd.credential} s={Wd.credS} flat={v==='b'?Wd.qFlat:.6}><ClinicSupport part="credential" dots={dots}/></At>}
   {hands}
   {extra}
  </g>;
 };

 // ---- a clean close surface for reading the answer and its sources (no duplicate props) ----
 const surface=(children:React.ReactNode)=><g data-world={v==='a'?'a-desk-surface':'b-desk-surface'}>
  <rect x={-400} y={-400} width={1880} height={2720} fill={v==='a'?'#CFC7B4':'#C9C1AE'}/>
  {v==='a'?<g opacity={.5}>{Array.from({length:22},(_,i)=><path key={i} d={`M-400 ${-100+i*96}H1480`} stroke="#B3AB98" strokeWidth={3}/>)}</g>
   :<g opacity={.5}>{Array.from({length:18},(_,i)=><path key={i} d={`M${540+(i-9)*40} 300L${540+(i-9)*260} 2300`} stroke="#B3AB98" strokeWidth={3}/>)}</g>}
  {/* the back wall: the room's own Gulf window, framed, with its sill and contact shadow */}
  <ClinicSupport part="backwall" stage={Wd.stage} h={v==='a'?240:300}/>
  <rect x={-400} y={v==='a'?240:300} width={1880} height={14} fill="#7F7766" opacity={.6}/>
  {children}
 </g>;

 // s4: the citations fan out of the Sources slot; lower cards sit on top so every tab stays clear,
 // and a naming lift raises a card in place without covering another card's tab.
 const citationRead=(naming:boolean)=>{
  const ans:Pt=v==='a'?[60,930]:[60,950], s=1.1;
  const slot=placed(ans,s,0,ANSWER_SOURCES);
  const fanTo:Record<CitationKind,Pt>=v==='a'?{literature:[60,380],guidelines:[270,480],other:[490,580]}:{literature:[330,350],guidelines:[390,510],other:[450,670]};
  const liftBy:Record<CitationKind,Pt>=v==='a'?{literature:[0,-44],guidelines:[40,-14],other:[0,0]}:{literature:[-30,-40],guidelines:[30,-14],other:[0,0]};
  const lifts:Record<CitationKind,number>={literature:at('s4')?liftLit:1,guidelines:at('s4')?liftGuide:1,other:0};
  const f=at('s4')?fan:1;
  const order:CitationKind[]=['literature','guidelines','other'];
  return surface(<>
   <At p={ans} s={s}><ChartHero part="answer" sources={1} chipsOut={[f,f,f]} limits={limitsOn} limitText={limitText} lift={.1}/></At>
   {order.map(k=>{
    const l=naming?ease(lifts[k]):0;
    const pos=add(mixPt(slot,fanTo[k],ease(f)),scale(liftBy[k],l));
    return <At key={k} p={pos} s={lerp(.12,1.3,ease(f))+.08*l}><ChartHero part="citation" kind={k} lift={.3+.5*l} glow={l}/></At>;
   })}
  </>);
 };
 // s6 and s7: the answer read close, with its clip tags, slots and the citation thread. The literature
 // card rises out of the Sources slot before the thread reaches it.
 const answerRead=()=>{
  const ans:Pt=v==='a'?[500,640]:[480,760], s=v==='a'?1.2:1.25;
  const lit:Pt=v==='a'?[440,230]:[450,290], litS=1.45;
  const rise=at('s7')?ease((t-n7a.start)/Math.max(.2,win('s7-event-1').start-n7a.start)):0;
  const slot=placed(ans,s,0,ANSWER_SOURCES);
  const litPos=mixPt(slot,lit,rise);
  const tab:Pt=[litPos[0]+70*litS,litPos[1]+22*litS];
  const from=placed(ans,s,0,[ANSWER_SOURCES[0]-30,ANSWER_SOURCES[1]+30]);
  return surface(<>
   <At p={ans} s={s}><ChartHero part="answer" sources={1} chipsOut={[rise,0,0]} limits={limitsOn} limitText={limitText}
    slotGlow={at('s7')?slotLight:0} ring={at('s7')&&noCheck>0&&noCheck<1?noCheck:0} lift={.1}/></At>
   {at('s7')&&rise>0&&<At p={litPos} s={lerp(.12,litS,rise)}><ChartHero part="citation" kind="literature" glow={trace*(1-slotLight)} lift={.3}/></At>}
   {at('s7')&&rise>=1&&<ChartHero part="thread" from={from} to={tab} reach={trace}/>}
  </>);
 };
 const answerFocus=(local:Pt):Pt=>placed(v==='a'?[500,640]:[480,760],v==='a'?1.2:1.25,0,local);
 // s6: the two open tags close enough to read "Not in release" on a phone (about 800 px wide each),
 // with the answer's clip and header still at the right edge of the frame.
 const LIMIT_S=2.35;
 const limitsClose=()=><Cam f={answerFocus([-115,164])} s={LIMIT_S/(v==='a'?1.2:1.25)}>{answerRead()}</Cam>;
 // s8: the closing image, in screen units. The answer card close on the desk with its Sources
 // filled and its Accuracy slot empty; behind it the usage share board on the wall, its figures
 // lit past half and its three tags hanging from the same pins, the evaluating tag last. The tags
 // keep their size relative to the board, so nothing is resized between shots.
 const ending=()=>{
  const deskY=v==='a'?760:790, kb=.8, tagS=kb*BOARD_TAG_S/Wd.boardS, bt=Wd.boardTags;
  const board:Pt=v==='a'?[70,300-660*kb]:[150,330-660*kb];
  const pin=(k:keyof typeof WALL_PINS):Pt=>add(board,scale(WALL_PINS[k],kb));
  const ans:Pt=v==='a'?[495,800]:[495,815], aS=1.5;
  return <g data-world={v==='a'?'a-answer-ending':'b-answer-ending'}>
   <rect x={-400} y={-400} width={1880} height={2720} fill={v==='a'?'#CFC7B4':'#C9C1AE'}/>
   <g opacity={.5}>{Array.from({length:14},(_,i)=><path key={i} d={`M-400 ${deskY+40+i*96}H1480`} stroke="#B3AB98" strokeWidth={3}/>)}</g>
   <ClinicSupport part="backwall" stage={Wd.stage} h={deskY} glazed={false}/>
   <At p={board} s={kb}><ClinicSupport part="wall" lit={1} share={1} label={1}/></At>
   <Hang pin={pin(bt.decision.pin)} tag="decision" in={1} s={tagS} side={bt.decision.side} drop={bt.decision.drop}/>
   <Hang pin={pin(bt.report.pin)} tag="report" in={1} s={tagS} side={bt.report.side} drop={bt.report.drop}/>
   <Hang pin={pin(bt.evaluating.pin)} tag="evaluating" in={evalTag} s={tagS} side={bt.evaluating.side} drop={bt.evaluating.drop}/>
   <rect x={-400} y={deskY} width={1880} height={14} fill="#7F7766" opacity={.6}/>
   <path d={`M-400 ${deskY+16}H1480`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2}/>
   <At p={ans} s={aS}><ChartHero part="answer" sources={1} limits={1} limitText={1} lift={.1}
    sourcesGlow={Math.sin(Math.PI*sourcesHold)} ring={finalPulse>0&&finalPulse<1?finalPulse:0}/></At>
  </g>;
 };

 // ---- an executed camera for every declared shot ----
 let pic:React.ReactNode;
 const view=shot.view, fr=shot.framing;
 switch(view){
 case 'flow-wide':
  pic=act==='send-question'?<Cam f={[470+30*ease(send),760]} s={1}>{world()}</Cam>
   :<Cam f={[720,900]} s={1.45}>{world()}</Cam>;          // B's return: medium on the tool and the answer
  break;
 case 'desk-close':
  if(act==='return-answer')pic=<Cam f={[650,930]} s={1.62}>{world()}</Cam>;
  else if(act==='send-question')pic=<Cam f={mixPt([250,1000],[520,900],ease(raw(e1)))} s={lerp(1.62,1.15,ease(raw(e1)))}>{world()}</Cam>;
  else pic=<Cam f={v==='a'?mixPt([330,1000],[400,1000],ease(slide3)):mixPt([270,1040],[420,1010],ease(raw(slideWin)))} s={v==='a'?2.6:2.05}>{world()}</Cam>;  // A: tight detail on the card and the typing hand
  break;
 case 'chart-boundary':
  pic=act==='enter-record'
   ?<Cam f={v==='a'?[500,700]:[500,600]} s={(v==='a'?1.2:1.3)*(1+.04*ease(glow))}>{world()}</Cam>
   :<Cam f={v==='a'?[330,660]:[360,480]} s={v==='a'?1.62:2.05}>{world()}</Cam>;
  break;
 case 'credential-gate':
  pic=<Cam f={v==='a'?[250,1040]:[200,960]} s={v==='a'?1.75:1.62}>{world()}</Cam>;break;
 case 'citation-stack':
  pic=v==='a'?<Cam f={[480,760]} s={.8}>{citationRead(false)}</Cam>:<Cam f={[500,730]} s={.92}>{citationRead(false)}</Cam>;break;
 case 'source-types':
  // the answer card stays wholly above the caption band while the two named cards lift
  if(act==='name-source-types')pic=<Cam f={v==='a'?[545,729]:[463,783]} s={v==='a'?1.04:1.12}>{citationRead(true)}</Cam>;
  else pic=<Cam f={[560,640]} s={.9}>{answerRead()}</Cam>;   // A s7: wider than s6, the literature card rises into view
  break;
 case 'share-grid':
  // keep-evaluating: the evaluating tag drops onto the share at a readable size; the tool sits
  // below the caption band (A) or wholly above it (B)
  if(act==='keep-evaluating')pic=v==='a'?<Cam f={[728,398]} s={2.2}>{world()}</Cam>:<Cam f={[690,685]} s={2.2}>{world()}</Cam>;
  // close: the clinician figures light past half; medium: the bar, the decision tag and the tool it
  // names, with the tool wholly above the caption band
  else if(fr==='close')pic=v==='a'?<Cam f={[735,200]} s={2.3}>{world()}</Cam>:<Cam f={[697,300]} s={2.3}>{world()}</Cam>;
  else pic=v==='a'?<Cam f={[715,603]} s={1.75}>{world()}</Cam>:<Cam f={[690,622]} s={1.75}>{world()}</Cam>;
  break;
 case 'unmeasured-card':
  if(act==='attribute-report')pic=v==='a'?<Cam f={[720,320]} s={2}>{world()}</Cam>:<Cam f={[680,664]} s={2.05}>{world()}</Cam>;
  // A: medium while the tags clip on, then a close as their "Not in release" line appears.
  // B: one close on the clip for both events.
  else if(v==='a'&&fr==='medium')pic=<Cam f={[485,810]} s={1.32}>{answerRead()}</Cam>;
  else pic=limitsClose();
  break;
 case 'answer-close':
  if(act==='keep-evaluating')pic=<Cam f={[540,760]} s={1}>{ending()}</Cam>;
  else if(fr==='detail'){const fc=answerFocus(ANSWER_ACCURACY);pic=<Cam f={[fc[0]-40,fc[1]-20]} s={2}>{answerRead()}</Cam>;}
  else pic=<Cam f={[550,700]} s={1.04}>{answerRead()}</Cam>;   // B s7: wider than s6, the literature card rises into view
  break;
 default:throw new Error('Unimplemented clinic answer view '+view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <rect width={1080} height={1920} fill={c.background}/>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  <g data-disclosure="production_disclosure">
   <path d="M44 132H500Q516 132 516 148V172Q516 188 500 188H44Z" fill={c.paper} opacity={.92}/>
   <text x={60} y={170} fontFamily={FONT.body} fontSize={26} fontWeight={700} fill={c.ink}>{scene.production_disclosure??'Illustration'}</text>
  </g>
 </svg>;
};
// Layout constants exported for readers of the geometry above.
export const CLINIC_ANSWER_LAYOUT={WORLDS,HERO_SIZE};
