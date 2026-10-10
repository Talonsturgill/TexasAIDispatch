import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {ChartHero,HERO_SIZE,type TagId} from './ChartHero';
import {ClinicSupport} from './ClinicSupport';

/**
 * clinic-answer-v1: one question enters a patient chart and comes back with its sources.
 *
 * Both treatments perform the same narrated actions with the same two authored groups.
 * A stands back from a chart on the clinic wall and lets the question and its sources
 * travel left to right across it. B puts the camera at desk height, close to the keyboard,
 * the badge reader and the propped chart, so the asking hand's tools and what is missing
 * from the answer stay large. Every state is a function of the film frame clock and the
 * board's event windows; nothing accumulates between frames. Completed results persist
 * across cuts because each is read from its own finished event.
 *
 * Disclosed illustration: no UTMB screen, vendor interface, answer content, clinician,
 * patient or patient detail. The scene's production_disclosure is drawn on every frame.
 */

type Pt=[number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const bez=(a:Pt,c:Pt,b:Pt,u:number):Pt=>{const v=clamp(u);return [(1-v)*(1-v)*a[0]+2*(1-v)*v*c[0]+v*v*b[0],(1-v)*(1-v)*a[1]+2*(1-v)*v*c[1]+v*v*b[1]];};
const mixPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];

const At:React.FC<{p:Pt;s?:number;r?:number;flat?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,flat=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) matrix(1 0 ${-.22*flat} ${1-.38*flat} 0 0) scale(${s})`} opacity={o}>{children}</g>;
/** A held camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,760],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
const Hang:React.FC<{p:Pt;tag:TagId;in:number;second?:number;open?:number;s?:number}>=({p,tag,in:shown,second,open,s=1})=>
 shown<=0?null:<At p={[p[0],p[1]-70*(1-ease(shown))]} s={s} r={14*(1-ease(shown))} o={clamp(shown*3)}>
  <ChartHero part="tag" tag={tag} second={second??1} open={open??1}/></At>;

export const ClinicAnswerFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Clinic answer film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Clinic answer film must read the single film frame clock');
 const c=ad.palette;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const p=(id:string)=>actionProgress(requireAction(W,id),t);
 const done=(id:string)=>t>=requireAction(W,id).end;
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const v=variant;
 const flat=ad.flat_shots?.[scene.id];

 // ---- the performed states, each read from its own board event on the film clock ----
 // The opening frame already shows a question half typed; typing completes as the card leaves.
 const hookTyped=clamp(.42+.58*t/Math.max(.2,requireAction(W,'s1-event-1').start));
 const send=p('s1-event-1'),ret=p('s1-event-2'),land=p('s1-event-3');
 const glow=p('s2-event-1'),announced=p('s2-event-2'),live=p('s2-event-3');
 const badge=p('s3-event-1'),typed3=p('s3-event-2'),slide3=p('s3-event-3');
 const fan=p('s4-event-1'),liftLit=p('s4-event-2'),liftGuide=p('s4-event-3');
 const tiles=p('s5-event-1'),share=p('s5-event-2'),decision=p('s5-event-3');
 const report=p('s6-event-1'),limitTags=p('s6-event-2'),notPublished=p('s6-event-3');
 const trace=p('s7-event-1'),unmarked=p('s7-event-2'),noCheck=p('s7-event-3');
 const back=p('s8-event-1'),evalTag=p('s8-event-2'),holdEnd=p('s8-event-3');
 const contact=done('s3-event-1');
 const blink=contact?clamp(1-(t-requireAction(W,'s3-event-1').end)/.9)*.8+.2:0;
 const unlock=contact?1:clamp((badge-.8)/.2);
 const attached=land;
 const inS3=scene.id==='s3',afterS3=t>=requireAction(W,'s3-event-1').start-.4;
 const screen=.35+.65*(scene.id==='s1'?clamp(1-send):inS3?typed3*(1-slide3):.4);
 const pulse=noCheck>0&&noCheck<1?Math.sin(Math.PI*noCheck):0;
 const lit=scene.id<'s5'?0:clamp(.45*tiles+.55*share);
 const shareShown=scene.id<'s5'?0:share;

 // ---- treatment A: the chart on the clinic wall, the flow travels left to right ----
 const QA:Pt=[396,690],SLOT_A:Pt=[700,786],OUT_A:Pt=[1110,650],SHELF_A:Pt=[730,842];
 const worldA=(extra:React.ReactNode=null)=>{
  // where the question card is at this instant, from the global events
  let q:Pt=QA,qs=.62,qTyped=hookTyped,qPlain=0,qShow=1;
  if(scene.id==='s1'||scene.id==='s2'){
   if(send<1){q=bez(QA,[820,820],OUT_A,send);}
   else{q=bez(OUT_A,[880,700],[SHELF_A[0]-12,SHELF_A[1]-16],ret);qShow=ret>0?1:0;}
  }else if(afterS3&&!(scene.id==='s8'&&back>0)){
   qTyped=inS3?typed3:1;qPlain=inS3?typed3:1;q=mixPt(QA,[SLOT_A[0]-150,SLOT_A[1]-50],ease(slide3));
   if(scene.id>'s3')q=[SLOT_A[0]-150,SLOT_A[1]-50];
  }
  if(scene.id==='s8')q=mixPt([SHELF_A[0]-12,SHELF_A[1]-16],[SLOT_A[0]-150,SLOT_A[1]-50],ease(back));
  const answerIn=scene.id==='s1'?ret:1;
  const answerAt:Pt=scene.id==='s1'?bez(OUT_A,[900,690],SHELF_A,ret):SHELF_A;
  const kinds=['other','guidelines','literature'] as const;
  return <g data-world="a-wall-chart">
   <ClinicSupport part="room" stage="front" spill={scene.id==='s1'?send:.6}/>
   <At p={[250,418]}><ClinicSupport part="rail" w={600}/></At>
   <ClinicSupport part="desk" stage="front"/>
   <ClinicSupport part="workstation" stage="front" glow={screen}/>
   <At p={[716,952]}><ClinicSupport part="shelf" w={192}/></At>
   <At p={[342,400]}><ClinicSupport part="boundary" w={376} h={560} glow={scene.id==='s2'?glow:scene.id>'s2'?.55:0} dock={scene.id<'s2'?0:scene.id==='s2'?glow:1} slot={.69}/></At>
   <At p={[360,436]}><ChartHero part="chart" unlock={scene.id<'s3'?1:unlock} attached={scene.id==='s1'?attached:1} slot={scene.id==='s1'?send*(1-land*.5):.5}/></At>
   <At p={[400,1022]}><ClinicSupport part="reader" blink={inS3?blink:contact?.2:0} badge={inS3?badge:scene.id>'s3'?1:0} showBadge={scene.id>='s3'}/></At>
   {/* facts already established hang from the rail at the left of the chart */}
   <Hang p={[132,450]} tag="announced" in={scene.id==='s2'?announced:scene.id>'s2'?1:0}/>
   <Hang p={[132,572]} tag="live" in={scene.id==='s2'?live:scene.id>'s2'?1:0}/>
   <Hang p={[392,600]} tag="accuracy" in={scene.id==='s6'?limitTags:scene.id>'s6'?1:0} second={scene.id==='s6'?notPublished:1}/>
   <Hang p={[420,722]} tag="care" in={scene.id==='s6'?limitTags*1.2-.2:scene.id>'s6'?1:0} second={scene.id==='s6'?notPublished:1}/>
   <Hang p={[700,700]} tag="evaluating" in={scene.id==='s8'?evalTag:0}/>
   {/* returned sources: three citation cards fan behind the answer on the shelf */}
   {(scene.id!=='s1'||land>0)&&kinds.map((k,i)=>{
    const f=scene.id==='s1'?land:scene.id==='s4'?fan:1;
    const from:Pt=scene.id==='s1'?[OUT_A[0],OUT_A[1]+40]:[SHELF_A[0]+30,SHELF_A[1]+10];
    const to:Pt=[SHELF_A[0]-10+i*34,SHELF_A[1]-58+i*8];
    return <At key={k} p={scene.id==='s1'?bez(from,[900,760],to,f):mixPt(from,to,ease(f))} s={.5} r={lerp(0,-10+i*9,ease(f))}>
     <ChartHero part="citation" kind={k}/></At>;
   })}
   {answerIn>0&&<At p={answerAt} s={.62} r={lerp(-8,0,ease(answerIn))}><ChartHero part="answer" lines={1} ring={scene.id>='s7'?1:0}/></At>}
   {qShow>0&&<At p={q} s={qs} r={scene.id==='s1'?-6*Math.sin(Math.PI*send):0}><ChartHero part="question" typed={qTyped} plain={qPlain} lift={scene.id==='s1'?Math.sin(Math.PI*send)*.6:0}/></At>}
   {scene.id==='s1'&&send>0&&send<1&&<path d={`M${SLOT_A[0]} ${SLOT_A[1]}Q820 820 ${OUT_A[0]} ${OUT_A[1]}`} stroke={c.hero} strokeWidth={5} strokeDasharray="12 12" fill="none" opacity={.5*Math.sin(Math.PI*send)}/>}
   {extra}
  </g>;
 };

 // ---- treatment B: desk height, close to the keyboard, the reader and the propped chart ----
 const QB:Pt=[96,968],SLOT_B:Pt=[700,756],FRONT_B:Pt=[560,1000];
 const worldB=(extra:React.ReactNode=null)=>{
  let q:Pt=QB,qFlat=1,qs=.92,qTyped=hookTyped,qPlain=0,qShow=1;
  if(scene.id==='s1'||scene.id==='s2'){
   if(send<1){const u=send;q=u<.6?bez(QB,[330,930],[520,906],u/.6):bez([520,906],[640,880],[SLOT_B[0]-40,SLOT_B[1]-40],(u-.6)/.4);
    qFlat=u<.6?1:1-ease((u-.6)/.4);qs=lerp(.92,.5,ease(u));qShow=u<.98?1:0;}
   else{qShow=0;}
  }else if(afterS3&&scene.id!=='s8'){
   qTyped=inS3?typed3:1;qPlain=inS3?typed3:1;
   const u=inS3?slide3:1;q=bez(QB,[330,930],[520,906],u);qs=lerp(.92,.6,ease(u));
   if(scene.id>'s3'){qShow=0;}
  }else if(scene.id==='s8'){q=bez([FRONT_B[0]-160,FRONT_B[1]+10],[600,880],[SLOT_B[0]-60,SLOT_B[1]-30],back);qFlat=1-ease(back);qs=lerp(.7,.5,ease(back));}
  else qShow=0;
  const answerIn=scene.id==='s1'?ret:1;
  const answerAt:Pt=scene.id==='s1'?bez([SLOT_B[0]-30,SLOT_B[1]-40],[760,860],FRONT_B,ret):FRONT_B;
  const kinds=['other','guidelines','literature'] as const;
  return <g data-world="b-desk-level">
   <ClinicSupport part="room" stage="desk" spill={.6}/>
   <ClinicSupport part="desk" stage="desk"/>
   <ClinicSupport part="workstation" stage="desk" glow={screen}/>
   <At p={[340,400]}><ClinicSupport part="stand"/></At>
   <At p={[342,368]}><ClinicSupport part="boundary" w={376} h={540} glow={scene.id==='s2'?glow:scene.id>'s2'?.55:0} dock={scene.id<'s2'?0:scene.id==='s2'?glow:1} slot={.717}/></At>
   <At p={[360,404]}><ChartHero part="chart" unlock={scene.id<'s3'?1:unlock} attached={scene.id==='s1'?attached:1} slot={scene.id==='s1'?send:.5} seed={5}/></At>
   <Hang p={[384,470]} tag="announced" in={scene.id==='s2'?announced:scene.id>'s2'?1:0} s={.9}/>
   <Hang p={[408,572]} tag="live" in={scene.id==='s2'?live:scene.id>'s2'?1:0} s={.9}/>
   <Hang p={[372,676]} tag="accuracy" in={scene.id==='s6'?limitTags:scene.id>'s6'?1:0} second={scene.id==='s6'?notPublished:1} s={.9}/>
   <Hang p={[452,770]} tag="care" in={scene.id==='s6'?limitTags*1.2-.2:scene.id>'s6'?1:0} second={scene.id==='s6'?notPublished:1} s={.9}/>
   <Hang p={[700,560]} tag="evaluating" in={scene.id==='s8'?evalTag:0} s={.9}/>
   <At p={[-60,0]}><ClinicSupport part="keyboard" press={inS3?typed3:scene.id==='s1'?clamp(1-send)*hookTyped:0}/></At>
   <At p={[650,1050]} s={1.45}><ClinicSupport part="reader" blink={inS3?blink:contact?.2:0} badge={inS3?badge:scene.id>'s3'?1:0} showBadge={scene.id>='s3'}/></At>
   {(scene.id!=='s1'||land>0)&&kinds.map((k,i)=>{
    const f=scene.id==='s1'?land:scene.id==='s4'?fan:1;
    const from:Pt=scene.id==='s1'?[SLOT_B[0]-20,SLOT_B[1]-20]:[FRONT_B[0]+40,FRONT_B[1]+20];
    const to:Pt=[FRONT_B[0]+70+i*44,FRONT_B[1]-40+i*26];
    return <At key={k} p={mixPt(from,to,ease(f))} s={.62} r={lerp(0,-12+i*10,ease(f))} flat={.7*ease(f)}>
     <ChartHero part="citation" kind={k} lift={1-ease(f)}/></At>;
   })}
   {answerIn>0&&<At p={answerAt} s={.72} flat={.7*ease(answerIn)} r={lerp(10,-4,ease(answerIn))}><ChartHero part="answer" lines={1} ring={scene.id>='s7'?1:0} lift={1-ease(answerIn)}/></At>}
   {qShow>0&&<At p={q} s={qs} flat={qFlat}><ChartHero part="question" typed={qTyped} plain={qPlain}/></At>}
   {extra}
  </g>;
 };

 // ---- the clinic workstation wall, staged per treatment, with the same chart in view ----
 const shareWorld=(extra:React.ReactNode=null)=>{
  const front=v==='a';
  const grid:Pt=front?[110,320]:[330,300],gs=front?.86:.72;
  const chartAt:Pt=front?[770,887]:[40,612],cs=front?.42:.75;
  return <g data-world={front?'a-share-wall':'b-share-desk'}>
   <ClinicSupport part="room" stage={front?'front':'desk'} spill={.5}/>
   {front?<ClinicSupport part="desk" stage="front"/>:<ClinicSupport part="desk" stage="desk"/>}
   <At p={grid} s={gs}><ClinicSupport part="wall" lit={lit} share={shareShown} label={share}/></At>
   <At p={chartAt} s={cs}><ChartHero part="chart" unlock={1} attached={1} slot={.5}/></At>
   <Hang p={front?[700,770]:[60,520]} tag="decision" in={scene.id==='s5'?decision:1} s={front?.95:.9}/>
   <Hang p={front?[grid[0]+330*gs,grid[1]+760*gs]:[grid[0]+330*gs,grid[1]+760*gs]} tag="report" in={scene.id==='s6'?report:scene.id>'s6'?1:0} s={front?1:.9}/>
   {extra}
  </g>;
 };

 // ---- the answer and its citation, close, for the limit of what a citation shows ----
 const answerWorld=(extra:React.ReactNode=null)=>{
  const front=v==='a';
  const ans:Pt=front?[150,520]:[120,620],cit:Pt=front?[520,700]:[520,860];
  const tracing=scene.id==='s7'?trace:1;
  const ringOn=scene.id==='s7'?unmarked:1;
  const tabPt:Pt=[cit[0]+40,cit[1]+12];
  return <g data-world={front?'a-answer-wall':'b-answer-desk'}>
   {front?worldA():worldB()}
   <rect width={1080} height={1920} fill={c.paper} opacity={.42}/>
   <At p={ans} s={1.25} r={front?-2:3}><ChartHero part="answer" lines={1} ring={Math.max(ringOn,pulse)} lift={.15}/></At>
   <At p={cit} s={1.02} r={front?4:-5}><ChartHero part="citation" kind="literature" glow={scene.id==='s7'?trace*(1-unmarked):0} lift={.2}/></At>
   <ChartHero part="thread" from={[ans[0]+250*1.25*.5,ans[1]+92*1.25]} to={tabPt} reach={tracing}/>
   {pulse>0&&<circle cx={ans[0]+(HERO_SIZE.answer[0]-42)*1.25} cy={ans[1]+(HERO_SIZE.answer[1]-44)*1.25} r={46+22*pulse} fill="none" stroke={c.accent} strokeWidth={4} opacity={.6*pulse}/>}
   {extra}
  </g>;
 };

 // ---- the citation cards lifted toward the camera so their source types read ----
 const citationWorld=(extra:React.ReactNode=null)=>{
  const front=v==='a';
  const lifts=[liftLit,liftGuide,0];
  const kinds=['literature','guidelines','other'] as const;
  const fanned=scene.id==='s4'?fan:1;
  const base:Pt=front?[600,900]:[560,1010];
  return <g data-world={front?'a-citation-shelf':'b-citation-desk'}>
   {front?worldA():worldB()}
   <rect width={1080} height={1920} fill={c.paper} opacity={.36*fanned}/>
   {kinds.map((k,i)=>{
    const named=scene.id==='s4'&&shot.view==='source-types'?lifts[i]:scene.id==='s4'?0:i<2?1:0;
    const fanTo:Pt=front?[150+i*230,560+i*70]:[110+i*240,700+i*60];
    const liftTo:Pt=front?[90+i*40,330+i*250]:[80+i*60,380+i*250];
    const pos=mixPt(mixPt(base,fanTo,ease(fanned)),liftTo,ease(named));
    return <At key={k} p={pos} s={lerp(.62,.95,ease(fanned))+.25*ease(named)} r={lerp(-12+i*10,0,ease(named))}>
     <ChartHero part="citation" kind={k} lift={.3+.7*ease(named)} glow={named}/></At>;
   })}
   <At p={front?[640,960]:[700,1080]} s={.66} r={-4}><ChartHero part="answer" lines={1} ring={0}/></At>
   {extra}
  </g>;
 };

 // ---- camera per view, framing and treatment ----
 const zoom={wide:1,medium:1.3,close:1.62,detail:2.05,overhead:1,split:1}[shot.framing];
 let pic:React.ReactNode;
 switch(shot.view){
 case 'flow-wide':{
  if(v==='a'){const f:Pt=act==='send-question'?[540+40*ease(send),760]:[560-30*holdEnd,780];pic=<Cam f={f} s={zoom}>{worldA()}</Cam>;}
  else{const f:Pt=act==='return-answer'?[560,820-30*ease(ret)]:[540,800-20*holdEnd];pic=<Cam f={f} s={zoom}>{worldB()}</Cam>;}
  break;}
 case 'desk-close':{
  if(v==='a'){const f:Pt=act==='return-answer'?[760,800]:[430+120*ease(slide3),800];pic=<Cam f={f} s={zoom}>{worldA()}</Cam>;}
  else{const f:Pt=act==='send-question'?[300+240*ease(send),960-90*ease(send)]:[200+200*ease(slide3),1010];pic=<Cam f={f} s={zoom}>{worldB()}</Cam>;}
  break;}
 case 'chart-boundary':{
  const f:Pt=act==='enter-record'?(v==='a'?[600,700]:[640,700]):(v==='a'?[300,560]:[460,580]);
  pic=<Cam f={[f[0],f[1]+(act==='enter-record'?-20*ease(glow):0)]} s={zoom*(act==='enter-record'?1+.04*ease(glow):1)}>{v==='a'?worldA():worldB()}</Cam>;
  break;}
 case 'credential-gate':{
  const f:Pt=v==='a'?[460,930-60*ease(badge)]:[700,1000-40*ease(badge)];
  const chip=<g opacity={contact?1:0}>
   <At p={v==='a'?[540,1010]:[560,940]} s={v==='a'?1:.8}><path d="M0 0H232Q246 0 246 14V40Q246 54 232 54H0Z" fill={c.paper} stroke={c.hero} strokeWidth={3}/>
   <text x={16} y={37} fontFamily={FONT.body} fontSize={26} fontWeight={700} fill={c.ink}>Usual credentials</text></At></g>;
  pic=<Cam f={f} s={zoom}>{v==='a'?worldA(chip):worldB(chip)}</Cam>;
  break;}
 case 'citation-stack':{
  pic=<Cam f={v==='a'?[520,760]:[480,860]} s={zoom*.78}>{citationWorld()}</Cam>;break;}
 case 'source-types':{
  if(act==='name-source-types')pic=<Cam f={v==='a'?[540,740]:[480,800]} s={zoom*.82}>{citationWorld()}</Cam>;
  else pic=<Cam f={v==='a'?[540,780]:[500,860]} s={zoom*.84}>{answerWorld()}</Cam>;
  break;}
 case 'share-grid':{
  const f:Pt=v==='a'?(shot.framing==='wide'?[540,760]:[460,720+40*ease(share)]):(shot.framing==='wide'?[540,700]:[600,620+30*ease(share)]);
  pic=<Cam f={f} s={zoom}>{shareWorld()}</Cam>;break;}
 case 'unmeasured-card':{
  if(act==='attribute-report'){const f:Pt=v==='a'?[440,840]:[560,760];pic=<Cam f={f} s={zoom}>{shareWorld()}</Cam>;}
  else{const f:Pt=v==='a'?[470,700]:[480,700];pic=<Cam f={f} s={zoom}>{v==='a'?worldA():worldB()}</Cam>;}
  break;}
 case 'answer-close':{
  if(act==='keep-evaluating'){const f:Pt=v==='a'?[600,720]:[560,760];pic=<Cam f={f} s={zoom*.8}>{v==='a'?worldA():worldB()}</Cam>;}
  else pic=<Cam f={v==='a'?[460,720]:[440,820]} s={zoom*.72}>{answerWorld()}</Cam>;
  break;}
 default:throw new Error('Unimplemented clinic answer view '+shot.view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <rect width={1080} height={1920} fill={c.background}/>
  <g data-view={shot.view} data-framing={shot.framing} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  <g data-disclosure="production_disclosure">
   <path d="M44 214H520Q536 214 536 230V258Q536 274 520 274H44Z" fill={c.paper} opacity={.92}/>
   <text x={60} y={254} fontFamily={FONT.body} fontSize={27} fontWeight={700} fill={c.ink}>{scene.production_disclosure??'Illustration'}</text>
  </g>
 </svg>;
};
