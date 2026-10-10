import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {ChartHero,HERO_SIZE,ANSWER_SOURCES,ANSWER_ACCURACY,type TagId,type CitationKind} from './ChartHero';
import {ClinicSupport,KEY,keyCenter,WALL_PINS} from './ClinicSupport';

/**
 * clinic-answer-v1: a clinician's question goes into the OpenEvidence tool at the edge of the
 * health record and one answer comes back with its sources.
 *
 * One question card, one answer card and ONE set of three citation cards. The citations come
 * out of the tool behind the answer and tuck into its Sources slot; they only come back out of
 * that slot when a shot needs to read them. The answer's Accuracy slot is drawn empty and never
 * filled, and the release's unpublished measures hang from the answer's own clip. Cards enter
 * and leave the tool under its front face, so nothing pops. Anonymous scrub-sleeved hands type
 * and push: a key goes down only while a fingertip is on it.
 *
 * A: a higher camera on a clinic wall. The chart hangs on a rail behind the desk, the tool is
 *    wall-mounted at its right, and the question travels left to right across the wall.
 * B: a desk-level camera. The chart stands propped on the desk, the tool stands beside it, the
 *    hands push the card across the laminate and the answer slides back toward the lens.
 *
 * Every state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. Completed results persist across cuts because each one is read
 * from its own finished event. Disclosed illustration: no UTMB screen, vendor interface, answer
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
/** A held camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,760],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A tag that drops onto its pin and settles without bounce. */
const Hang:React.FC<{pin:Pt;tag:TagId;in:number;s:number;drop?:number;second?:number}>=({pin,tag,in:shown,s,drop=0,second})=>
 shown<=0?null:<At p={[pin[0],pin[1]-50*(1-ease(shown))]} s={s} o={clamp(shown*3)}>
  <ChartHero part="tag" tag={tag} swing={12*(1-ease(shown))} drop={drop} second={second??1}/></At>;

// ---- the two worlds: fixed placements of every object (world units) ----
type World={stage:'front'|'desk';chart:Pt;stand?:Pt;boundary:{p:Pt;w:number;h:number;slot:number;lockY:number};tool:Pt;board:Pt;boardS:number;
 keyboard:Pt;kbS:number;question:Pt;qS:number;qFlat:number;credential:Pt;answer:Pt;aS:number;aFlat:number;workstation:Pt;rail?:{p:Pt;w:number};
 sendPath:Pt[];stopAt:Pt;answerPath:Pt[];citeFan:Pt[]};
const WORLDS:Record<V,World>={
 a:{stage:'front',chart:[150,578],boundary:{p:[132,542],w:376,h:540,slot:.44,lockY:.55},tool:[530,700],board:[540,100],boardS:.46,
  keyboard:[-50,1050],kbS:.8,question:[196,800],qS:.75,qFlat:0,credential:[60,982],answer:[600,1020],aS:.8,aFlat:.25,
  workstation:[-90,740],rail:{p:[110,556],w:420},
  sendPath:[[196,800],[420,800],[560,760]],stopAt:[300,800],answerPath:[[560,712],[580,868],[600,1020]],citeFan:[[480,930],[550,920],[620,915]]},
 b:{stage:'desk',chart:[250,404],stand:[230,400],boundary:{p:[232,366],w:376,h:548,slot:.82,lockY:.8},tool:[616,724],board:[540,100],boardS:.46,
  keyboard:[-60,985],kbS:.8,question:[176,905],qS:.72,qFlat:.6,credential:[-60,906],answer:[610,975],aS:.8,aFlat:.25,
  workstation:[-60,640],
  sendPath:[[176,905],[320,885],[650,815]],stopAt:[400,892],answerPath:[[660,800],[670,900],[610,975]],citeFan:[[440,915],[510,905],[580,898]]},
};
const BOARD_TAG_S=.74, CHART_TAG_S=.9;

// ---- hands: a strike schedule; a finger touches its key only inside its own strike ----
type Strike={t:number;side:'L'|'R';finger:number};
const SEQ:[('L'|'R'),number][]=[['R',0],['L',1],['R',1],['L',0],['R',2],['L',2],['R',0],['L',1]];
const strikes=(t0:number,t1:number,n:number,enter=false):Strike[]=>Array.from({length:n},(_,j)=>{
 const last=enter&&j===n-1;return {t:t0+(t1-t0)*(j+.5)/n,side:last?'R':SEQ[j%SEQ.length][0],finger:last?2:SEQ[j%SEQ.length][1]};});
const HOVER=.3, CONTACT=.09;
function fingerLift(list:Strike[],side:'L'|'R',finger:number,t:number){
 let lift=HOVER;
 for(const s of list){if(s.side!==side||s.finger!==finger)continue;
  const d=t-s.t;
  if(d>=-.16&&d<0){const u=(d+.16)/.16;lift=u<.5?HOVER+(1-HOVER)*ease(u*2):1-ease((u-.5)*2);}
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
 const trace=p('s7-event-1'),unmarked=p('s7-event-2'),noCheck=p('s7-event-3');
 const evalTag=p('s8-event-1');

 // Typing schedules. The opening frame already shows a question being typed; A sends it with
 // a final key strike, B with one push of the right hand.
 // B's last strike lands before the right hand leaves the keys to push; A ends on the send key.
 const s1Strikes=strikes(-.62,v==='a'?e1.start-.06:e1.start-.3,9,v==='a');
 const dotStrikes=strikes(n3a.start+.15,lockWin.start-.05,8);
 const qStrikes=strikes(typeWin.start,typeWin.end,8);
 const list=sid==='s1'?s1Strikes:sid==='s3'?[...dotStrikes,...qStrikes]:[];
 const done=(ls:Strike[])=>ls.filter(s=>t>=s.t).length/ls.length;
 const typed1=done(s1Strikes), dots=done(dotStrikes), typed3=done(qStrikes);
 const processing=at('s1')&&t>=e1.end&&ret<=0?.5+.5*Math.sin((t-e1.end)*9):0;
 const toolGlow=at('s2')?glow:processing;

 // ---- B right-hand push: reach to the card, push with it, release, return ----
 const raw=(w:{start:number;end:number})=>clamp((t-w.start)/(w.end-w.start));
 const pushWin=at('s1')?{w:e1,reachFrom:e1.start-.22,to:Wd.sendPath[1]}
  :at('s3')?{w:slideWin,reachFrom:typeWin.end+.04,to:mixPt(Wd.question,Wd.stopAt,.5)}:null;
 const kbTip=(side:'L'|'R')=>add(Wd.keyboard,scale(keyCenter(1,HOME[side]),Wd.kbS));
 const qHome=Wd.question;
 const cardContact:Pt=placed(qHome,Wd.qS,Wd.qFlat,[96,150]);
 let rReach=0,rShift:Pt=[0,0];
 if(v==='b'&&pushWin&&t>=pushWin.reachFrom){
  const reachTarget=add(sub(cardContact,kbTip('R')),[0,26*Wd.kbS]);
  const u=clamp((t-pushWin.reachFrom)/Math.max(.05,pushWin.w.start-pushWin.reachFrom));
  const pushU=clamp(raw(pushWin.w)/.4);
  const back=clamp((t-(pushWin.w.start+(pushWin.w.end-pushWin.w.start)*.4))/.45);
  rReach=t<pushWin.w.start?ease(u):1-ease(back);
  rShift=mixPt(add(scale(reachTarget,ease(u)),scale(sub(pushWin.to,qHome),ease(pushU))),[0,0],ease(back));
 }
 const handLift=(side:'L'|'R')=>[0,1,2,3].map(f=>fingerLift(list,side,f,t));
 const keysDown=list.filter(s=>t>=s.t&&t<s.t+CONTACT).map(s=>keyOf(s.side,s.finger));

 // ---- where the cards are at this instant ----
 const q=(():{p:Pt;s:number;show:boolean;typed:number;plain:number}=>{
  if(at('s1')||at('s2')){
   if(t<e1.start)return {p:qHome,s:Wd.qS,show:true,typed:typed1,plain:0};
   if(v==='a')return {p:bez(Wd.sendPath[0],Wd.sendPath[1],Wd.sendPath[2],send),s:Wd.qS,show:send<1,typed:1,plain:0};
   const u=raw(e1);
   const pt=u<.4?mixPt(qHome,Wd.sendPath[1],ease(u/.4)):bez(Wd.sendPath[1],[520,880],Wd.sendPath[2],ease((u-.4)/.6));
   return {p:pt,s:lerp(Wd.qS,Wd.qS*.84,ease(u)),show:u<1,typed:1,plain:0};
  }
  if(at('s3')){
   const u=raw(slideWin);
   const f=v==='b'?(u<.4?.5*ease(u/.4):.5+.5*ease((u-.4)/.6)):ease(slide3);
   return {p:mixPt(qHome,Wd.stopAt,f),s:Wd.qS,show:true,typed:typed3,plain:typed3};
  }
  return {p:Wd.stopAt,s:Wd.qS,show:after('s3'),typed:1,plain:1};
 })();
 const answerIn=at('s1')?ret:1;
 const answerPt=at('s1')?(ret<.4?mixPt(Wd.answerPath[0],Wd.answerPath[1],ease(ret/.4)):mixPt(Wd.answerPath[1],Wd.answerPath[2],ease((ret-.4)/.6))):Wd.answerPath[2];
 const answerS=at('s1')?lerp(.6,Wd.aS,ease(ret)):Wd.aS, answerFlat=at('s1')?Wd.aFlat*ease(ret):Wd.aFlat;
 const sourcesFill=at('s1')?clamp((land-.55)/.45):1;
 const limitsOn=at('s6')?limits:after('s6')?1:0, limitText=at('s6')?notInRelease:1;
 const slotPt=placed(Wd.answer,Wd.aS,Wd.aFlat,ANSWER_SOURCES);
 const kinds:CitationKind[]=['other','guidelines','literature'];
 const screenGlow=at('s1')?1:at('s3')?.5+.5*typed3:.5;

 const world=(extra:React.ReactNode=null)=>{
  const B=Wd.boundary;
  const pinB=(f:number):Pt=>[B.p[0]+B.w*f,B.p[1]];
  const pinBoard=(k:keyof typeof WALL_PINS):Pt=>add(Wd.board,scale(WALL_PINS[k],Wd.boardS));
  const lockState=at('s3')?lockOpen:1;
  const boundary=<At p={B.p}><ClinicSupport part="boundary" w={B.w} h={B.h} glow={at('s2')?glow:.25} lock={lockState} slot={B.slot} lockY={B.lockY}/></At>;
  const questionCard=q.show&&<At p={q.p} s={q.s} flat={v==='b'?Wd.qFlat:0}><ChartHero part="question" typed={q.typed} plain={q.plain}/></At>;
  const answerCard=answerIn>0&&<At p={answerPt} s={answerS} flat={answerFlat}>
   <ChartHero part="answer" sources={sourcesFill} limits={limitsOn} limitText={limitText} lift={at('s1')?1-ease(ret):0}/></At>;
  // the one citation set: out of the tool, a brief fan, then tucked into the answer's Sources slot
  const citations=at('s1')&&land>0&&land<1&&kinds.map((k,i)=>{
   const u1=clamp(land/.45),u2=clamp((land-.45)/.55);
   const from=v==='a'?Wd.answerPath[1]:Wd.answerPath[0];
   const pos=u2<=0?mixPt(from,Wd.citeFan[i],ease(u1)):mixPt(Wd.citeFan[i],slotPt,ease(u2));
   return <At key={k} p={pos} s={lerp(.42,.1,ease(u2))} flat={.5} r={-8+i*8} o={1-clamp((u2-.8)/.2)}><ChartHero part="citation" kind={k} lift={.4}/></At>;
  });
  const aInside=v==='a'&&at('s1')&&ret<.4;
  return <g data-world={v==='a'?'a-wall-chart':'b-desk-level'}>
   <ClinicSupport part="room" stage={Wd.stage} spill={.6}/>
   <At p={Wd.board} s={Wd.boardS}><ClinicSupport part="wall" lit={after('s4')?clamp(.45*(at('s5')?tiles:1)+.55*(at('s5')?share:1)):0} share={after('s4')?(at('s5')?share:1):0} label={after('s4')?(at('s5')?share:1):0}/></At>
   <Hang pin={pinBoard('start')} tag="decision" in={at('s5')?decision:after('s5')?1:0} s={BOARD_TAG_S}/>
   <Hang pin={pinBoard('half')} tag="report" in={at('s6')?report:after('s6')?1:0} s={BOARD_TAG_S} drop={90}/>
   <Hang pin={pinBoard('start')} tag="evaluating" in={at('s8')?evalTag:0} s={BOARD_TAG_S} drop={180}/>
   {Wd.rail&&<At p={Wd.rail.p}><ClinicSupport part="rail" w={Wd.rail.w}/></At>}
   {v==='a'&&<>{boundary}<At p={Wd.chart}><ChartHero part="chart"/></At>{questionCard}{aInside&&answerCard}</>}
   <ClinicSupport part="desk" stage={Wd.stage}/>
   <At p={Wd.workstation} s={.9}><ClinicSupport part="workstation" glow={screenGlow}/></At>
   {v==='b'&&<><At p={Wd.stand!}><ClinicSupport part="stand"/></At>{boundary}<At p={Wd.chart}><ChartHero part="chart" seed={5}/></At>
    {questionCard}{answerCard}{citations}</>}
   <At p={Wd.tool}><ClinicSupport part="tool" stage={Wd.stage} glow={toolGlow}/></At>
   <Hang pin={pinB(.18)} tag="announced" in={at('s2')?announced:after('s2')?1:0} s={CHART_TAG_S}/>
   <Hang pin={pinB(.5)} tag="live" in={at('s2')?live:after('s2')?1:0} s={CHART_TAG_S} drop={120}/>
   {v==='a'&&!aInside&&answerCard}
   {v==='a'&&citations}
   {at('s3')&&<At p={Wd.credential} s={v==='a'?.72:.78} flat={v==='b'?Wd.qFlat:.6}><ClinicSupport part="credential" dots={dots}/></At>}
   <At p={Wd.keyboard} s={Wd.kbS}><ClinicSupport part="keyboard" down={keysDown}/></At>
   <At p={kbTip('L')} s={Wd.kbS}><ClinicSupport part="hands" side="L" lift={handLift('L')}/></At>
   <At p={add(kbTip('R'),rShift)} s={Wd.kbS}><ClinicSupport part="hands" side="R" lift={rReach>0?[0,1,1,1]:handLift('R')} reach={rReach}/></At>
   {extra}
  </g>;
 };

 // ---- a clean close surface for reading the answer and its sources (no duplicate props) ----
 const surface=(children:React.ReactNode)=><g data-world={v==='a'?'a-desk-surface':'b-desk-surface'}>
  <rect x={-200} y={-200} width={1480} height={2320} fill={v==='a'?'#CFC7B4':'#C9C1AE'}/>
  {v==='a'?<g opacity={.5}>{Array.from({length:16},(_,i)=><path key={i} d={`M-100 ${200+i*96}H1180`} stroke="#B3AB98" strokeWidth={3}/>)}</g>
   :<g opacity={.5}>{Array.from({length:14},(_,i)=><path key={i} d={`M${540+(i-7)*40} 300L${540+(i-7)*260} 1920`} stroke="#B3AB98" strokeWidth={3}/>)}</g>}
  {/* the far edge, the chart and the tool, out of focus behind the reading surface */}
  <g filter="url(#cs-deep)" opacity={.85}>
   <rect x={-200} y={-200} width={1480} height={v==='a'?440:500} fill={c.background}/>
   <rect x={v==='a'?60:120} y={v==='a'?40:60} width={260} height={v==='a'?200:240} rx={16} fill="#6E5D49"/>
   <rect x={v==='a'?360:620} y={v==='a'?120:150} width={210} height={170} rx={16} fill={c.hero}/>
  </g>
  <rect x={-200} y={v==='a'?240:300} width={1480} height={14} fill="#7F7766" opacity={.6}/>
  {children}
 </g>;
 const readAnswer=(pt:Pt,s:number,opts:{ring?:number}={})=>
  <At p={pt} s={s}><ChartHero part="answer" sources={1} limits={limitsOn} limitText={limitText} ring={opts.ring??0} lift={.1}/></At>;

 // s4: the three citations fan out of the Sources slot, then two lift to be read.
 const citationRead=()=>{
  const ans:Pt=v==='a'?[60,920]:[60,940], s=1.1;
  const slot=placed(ans,s,0,ANSWER_SOURCES);
  const fanTo:Record<CitationKind,Pt>=v==='a'?{literature:[60,400],guidelines:[270,470],other:[490,540]}:{literature:[330,360],guidelines:[390,520],other:[450,680]};
  const lifts:Record<CitationKind,number>={literature:at('s4')?liftLit:1,guidelines:at('s4')?liftGuide:1,other:0};
  const naming=act==='name-source-types';
  const f=at('s4')?fan:1;
  return surface(<>
   {readAnswer(ans,s)}
   {(['other','guidelines','literature'] as CitationKind[]).map(k=>{
    const l=naming?ease(lifts[k]):0;
    const pos=add(mixPt(slot,fanTo[k],ease(f)),[-24*l,-50*l]);
    return <At key={k} p={pos} s={lerp(.12,1.3,ease(f))+.16*l} r={lerp(-6,0,ease(f))}><ChartHero part="citation" kind={k} lift={.3+.5*l} glow={l}/></At>;
   })}
  </>);
 };
 // s6 and s7: the answer alone, read close, with its clip tags, slots and the citation thread.
 const answerRead=(detail:boolean)=>{
  const ans:Pt=v==='a'?[500,640]:[500,700], s=1.2;
  const lit:Pt=v==='a'?[500,270]:[520,320];
  const showLit=at('s7');
  const tab:Pt=[lit[0]+70,lit[1]+20];
  const from=placed(ans,s,0,[ANSWER_SOURCES[0]-30,ANSWER_SOURCES[1]+30]);
  const ringU=at('s7')?noCheck:0;
  const body=surface(<>
   {readAnswer(ans,s,{ring:ringU>0&&ringU<1?ringU:0})}
   {showLit&&<At p={lit} s={1.05}><ChartHero part="citation" kind="literature" glow={trace*(1-unmarked)} lift={.3}/></At>}
   {showLit&&<ChartHero part="thread" from={from} to={tab} reach={trace}/>}
  </>);
  if(!detail)return body;
  const focus=placed(ans,s,0,ANSWER_ACCURACY);
  return <Cam f={[focus[0]-40,focus[1]-20]} s={2} a={[540,760]}>{body}</Cam>;
 };

 // ---- cameras per view, action and treatment ----
 const Z={wide:1,medium:1.3,close:1.62,detail:2.05,overhead:1,split:1}[shot.framing];
 let pic:React.ReactNode;
 switch(shot.view){
 case 'flow-wide':
  pic=v==='a'?<Cam f={[470+30*ease(send),760]} s={Z}>{world()}</Cam>:<Cam f={[540,780]} s={Z}>{world()}</Cam>;break;
 case 'desk-close':
  if(act==='return-answer')pic=<Cam f={v==='a'?[650,930]:[560,900]} s={Z}>{world()}</Cam>;
  else if(act==='send-question')pic=<Cam f={mixPt([250,1000],[560,900],ease(send))} s={lerp(Z,1.15,ease(send))}>{world()}</Cam>;
  else pic=<Cam f={v==='a'?mixPt([260,1030],[300,1030],ease(slide3)):mixPt([270,1040],[420,1010],ease(slide3))} s={v==='a'?1.9:Z}>{world()}</Cam>;
  break;
 case 'chart-boundary':
  pic=act==='enter-record'
   ?<Cam f={v==='a'?[500,700]:[600,600]} s={(v==='a'?1.2:Z)*(1+.04*ease(glow))}>{world()}</Cam>
   :<Cam f={v==='a'?[330,660]:[470,480]} s={Z}>{world()}</Cam>;
  break;
 case 'credential-gate':
  pic=<Cam f={v==='a'?[250,1040]:[200,960]} s={v==='a'?1.75:Z}>{world()}</Cam>;break;
 case 'citation-stack':pic=citationRead();break;
 case 'source-types':pic=act==='name-source-types'?citationRead():answerRead(false);break;
 case 'share-grid':
  pic=shot.framing==='wide'?<Cam f={v==='a'?[470,760]:[540,780]} s={1}>{world()}</Cam>
   :<Cam f={[720,act==='keep-evaluating'?400:340]} s={1.62}>{world()}</Cam>;
  break;
 case 'unmeasured-card':
  pic=act==='attribute-report'?<Cam f={[720,330]} s={1.62}>{world()}</Cam>:answerRead(false);break;
 case 'answer-close':
  if(act==='keep-evaluating')pic=<Cam f={v==='a'?[640,960]:[640,960]} s={1.45}>{world()}</Cam>;
  else pic=answerRead(shot.framing==='detail');
  break;
 default:throw new Error('Unimplemented clinic answer view '+shot.view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <rect width={1080} height={1920} fill={c.background}/>
  <g data-view={shot.view} data-framing={shot.framing} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  <g data-disclosure="production_disclosure">
   <path d="M44 132H500Q516 132 516 148V172Q516 188 500 188H44Z" fill={c.paper} opacity={.92}/>
   <text x={60} y={170} fontFamily={FONT.body} fontSize={26} fontWeight={700} fill={c.ink}>{scene.production_disclosure??'Illustration'}</text>
  </g>
 </svg>;
};
// Keep the hero sizes referenced for readers of the layout constants above.
export const CLINIC_ANSWER_LAYOUT={WORLDS,HERO_SIZE};
