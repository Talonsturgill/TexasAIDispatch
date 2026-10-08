import React from 'react';
import {FONT} from '../lib/type';
import {useArtDirection} from '../lib/artDirection';
import {requireNarration} from '../lib/direction';
import {ArtSprite} from './StoryArt';
import type {FilmRenderProps} from './types';
const smooth=(v:number)=>{const p=Math.min(1,Math.max(0,v));return p*p*(3-2*p);};
/** Integrate the event-authored speed rather than multiplying current speed by time.
 * A fixed quadrature grid gives continuous, deterministic random-access travel. */
export function travelAt(t:number,speedAt:(t:number)=>number):number{
 const sign=t<0?-1:1,end=Math.abs(t),step=.04,n=Math.floor(end/step);
 let total=0;
 const area=(lo:number,hi:number)=>{const mid=(lo+hi)/2;return (hi-lo)/6*(speedAt(sign*lo)+4*speedAt(sign*mid)+speedAt(sign*hi));};
 for(let j=0;j<n;j++)total+=area(j*step,(j+1)*step);
 if(end>n*step)total+=area(n*step,end);
 return sign*10*total;
}
/** Stance anchors are immutable world positions. Swing interpolates between the
 * retained previous anchor and the next landing, then settles onto that anchor. */
export function footAt(clock:number,offset:number,speedAt:(t:number)=>number,rate=.75){
 const phase=clock*rate+offset,cycle=Math.floor(phase),u=phase-cycle;
 const stanceStart=(cycle-offset)/rate,nextStart=stanceStart+1/rate;
 const anchor=(t:number)=>travelAt(t,speedAt)+Math.min(18,12*speedAt(t));
 const current=anchor(stanceStart),next=anchor(nextStart),swing=u>.62;
 const q=swing?(u-.62)/.38:0;
 return {worldX:swing?current+(next-current)*smooth(q):current,
   lift:swing?Math.sin(Math.PI*q)*28*Math.min(1,Math.max(.08,speedAt(clock))):0};
}
export const Fly:React.FC<{x:number;y:number;scale:number;clock:number;speedAt:(t:number)=>number;ink:string;rate?:number}>=({x,y,scale,clock,speedAt,ink,rate=.75})=>{
 const travel=travelAt(clock,speedAt);
 const legs=(far:boolean)=>[0,1,2].map(i=>{
  const foot=footAt(clock,i*.5+(far?.5:0),speedAt,rate);
  const hipX=[274,255,235][i],hipY=145;
  // Measured clean crop viewport hip and distal tarsus landmarks.
  const dx=[90,-10,-110][i]+foot.worldX-travel,dy=260-foot.lift-hipY;
  const shear=(dx-124)/177,stretch=dy/177;
  return <g key={i} opacity={far?.62:1} transform={`translate(${hipX} ${hipY}) matrix(1 0 ${shear} ${stretch} ${-19-shear*18} ${-stretch*18})`}>
   <ArtSprite role="hero" slice="foreleg" x={0} y={0} width={160} height={205}/>
  </g>;
 });
 return <g transform={`translate(${x+travel*scale} ${y}) scale(${scale})`} data-subject="fly">
  <ellipse cx={235} cy={265} rx={170} ry={11} fill={ink} opacity={.15}/>
  {legs(true)}<ArtSprite role="hero" slice="body" x={0} y={0} width={450} height={188}/>{legs(false)}
 </g>;
};
/** Both condition subjects use the same anatomy and normalized performance window.
 * These speeds are editorial staging, never measured assay distances or rates.
 * Finish on a tripod stance with every foot supported for the result hold. */
export function comparisonClock(fraction:number):number{return Math.min(4,Math.max(0,fraction)*4/.75);}
/** Measured global clause anchors own performances, including their final holds.
 * Later views inspect the same completed state rather than replaying a shot clock. */
export function narrationState(board:Parameters<typeof requireNarration>[0],time:number){
 const clause=(id:string)=>requireNarration(board,id);
 const progress=(id:string)=>{const w=clause(id);return Math.max(0,Math.min(1,(time-w.start)/(w.end-w.start)));};
 const clock=(id:string)=>comparisonClock(progress(id));
 return {opening:clock('c1'),candidate:smooth(progress('c2')),
  analysis:smooth(progress('c3')),selection:smooth(progress('c4')),
  disabled:clock('c5'),normal:clock('c6'),partial:clock('c7'),
  diagnosis:smooth(progress('c8')),recapCandidate:smooth(progress('c9')),
  recapTest:clock('c10'),limit:smooth(progress('c11'))};
}
export function clauseForView(board:Parameters<typeof requireNarration>[0],view:string,time:number):string{
 if(view==='candidate-clue'||view==='gene-detail'){
  return time<requireNarration(board,'c3').start?'c2':time<requireNarration(board,'c5').start?'c4':'c9';
 }
 if(view==='standard-analysis')return 'c3';
 if(view==='gene-removal'||view==='movement-difficulty')return 'c5';
 if(view==='normal-condition'||view==='rescue-movement')return 'c6';
 if(view==='variant-condition'||view==='partial-rescue')return 'c7';
 if(view==='paired-result')return time<requireNarration(board,'c8').start?'c7':'c8';
 if(view==='diagnostic-clue')return 'c8';
 if(view==='honest-answer')return 'c11';
 if(view==='living-test')return time<requireNarration(board,'c2').start?'c1':'c10';
 return 'c1';
}
export function comparisonSpeed(normal:boolean,t:number):number{
 return (normal?6:.65)*smooth(t/.35)*(1-smooth((t-3.4)/.6));
}
const Text:React.FC<{x?:number;y:number;text:string;color:string;size?:number}>=({x=78,y,text,color,size=49})=><text x={x} y={y} fill={color} fontFamily={FONT.body} fontWeight={750} fontSize={size}>{text}</text>;
export const FlyGeneFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const art=useArtDirection();if(!art)throw new Error('Fly gene film requires executed art direction');
 const c=art.palette,state=narrationState(board,time_s);
 const clauseId=clauseForView(board,shot.view,time_s),clause=requireNarration(board,clauseId);
 const a=smooth((time_s-clause.start)/(clause.end-clause.start));
 const speed=(strength:number)=>(t:number)=>strength*smooth(t/.35)*(1-smooth((t-3.4)/.6));
 const fly=(x:number,y:number,scale:number,clock:number,strength:number)=>
  <Fly x={x} y={y} scale={scale} clock={clock} speedAt={speed(strength)} ink={c.ink} rate={2}/>;
 const selecting=clauseId==='c2'?state.candidate:clauseId==='c4'?state.selection:state.recapCandidate;
 const named=time_s>=requireNarration(board,'c4').start;
 const gene=(x:number,y:number,scale=1)=><g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M0 20Q30-15 60 20T120 20T180 20M0-20Q30 15 60-20T120-20T180-20" fill="none" stroke={c.hero} strokeWidth={7}/>
  {[20,60,100,140,180].map(z=><path key={z} d={`M${z}-10V10`} stroke={c.ink} strokeWidth={3}/>)}
  <Text x={0} y={85} text={named?'BRSK1':'candidate'} color={c.hero} size={47}/>
 </g>;
 const candidates=<g data-subject="gene-candidate" data-action={clauseId==='c2'?'discover-candidate':'select-candidate'}>
  <Text y={470} text="Conceptual candidate comparison" color={c.ink} size={35}/>
  {[0,1,2].map(i=>{
   const chosen=i===1,xx=variant==='a'?90+i*300:140,yy=variant==='a'?620:575+i*170;
   const tx=chosen?xx+selecting*(540-xx):xx,ty=chosen?yy+selecting*(1020-yy):yy;
   return <g key={i} opacity={chosen?1:1-.75*selecting}>
    {chosen?gene(tx,ty):<g transform={`translate(${tx} ${ty})`}>
     <path d="M0 20Q30-15 60 20T120 20T180 20M0-20Q30 15 60-20T120-20T180-20" fill="none" stroke={c.midground} strokeWidth={7}/>
     <Text x={0} y={85} text="candidate" color={c.ink} size={34}/>
    </g>}
   </g>;
  })}
  {named&&<><Text y={570} text="AI-MARRVEL" color={c.hero} size={44}/><path d={`M600 600V${600+380*selecting}`} fill="none" stroke={c.hero} strokeWidth={5}/></>}
  <path d="M80 900H975" stroke={c.midground} strokeWidth={3}/>
  <Text y={1200} text="Selected clue. Still needs testing." color={c.ink} size={43}/>
 </g>;
 const analysisProcess=smooth((state.analysis-.1)/.55);
 const analysisSearch=smooth((state.analysis-.35)/.4);
 const unresolved=smooth((state.analysis-.72)/.28);
 // Abstract gene emblems identify genomic inputs without letters, sequence or case data.
 const geneticInput=(x:number,y:number,scale=1)=><g data-genetic-input="abstract" transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M0 20Q30-15 60 20T120 20T180 20M0-20Q30 15 60-20T120-20T180-20" fill="none" stroke={c.midground} strokeWidth={6}/>
  {[20,60,100,140,180].map(z=><path key={z} d={`M${z}-10V10`} stroke={c.ink} strokeWidth={3}/>)}
 </g>;
 const standardAnalysis=<g data-subject="parent-record child-record" data-action="standard-analysis">
  <Text y={470} text="Conceptual genomic comparison" color={c.ink} size={35}/>
  {[false,true].map(child=>{
   const xx=child?620-90*state.analysis:120+90*state.analysis;
   return <g key={String(child)} transform={`translate(${xx} 610)`}>
    <rect width={280} height={310} rx={22} fill={c.paper} stroke={c.midground} strokeWidth={4}/>
    <Text x={30} y={60} text={child?'Child':'Parent'} color={c.ink} size={42}/>
    {[0,1,2].map(i=><g key={i}>{geneticInput(50,125+i*65)}</g>)}
    <path d={`M25 ${95+185*analysisSearch}H255`} stroke={c.hero} strokeWidth={5} opacity={.7}/>
   </g>;
  })}
  <g data-analysis-processing="compare-genomic-inputs" opacity={analysisProcess}>
   <path d="M350 935L460 985M670 935L605 985" fill="none" stroke={c.hero} strokeWidth={4}/>
   {geneticInput(170+250*analysisProcess,800+185*analysisProcess,.55)}
   {geneticInput(670-110*analysisProcess,800+185*analysisProcess,.55)}
   <g transform={`translate(${440+190*analysisSearch} 985)`}>
    <circle r={26} fill={c.paper} fillOpacity={.4} stroke={c.hero} strokeWidth={5}/>
    <path d="M18 18L40 40" stroke={c.hero} strokeWidth={7} strokeLinecap="round"/>
   </g>
  </g>
  <g data-analysis-result="unresolved" opacity={unresolved}>
   <rect x={330} y={1070} width={360} height={95} rx={16} fill={c.paper} stroke={c.accent} strokeWidth={4} strokeDasharray="10 10"/>
   <Text x={350} y={1135} text="No answer" color={c.accent} size={60}/>
  </g>
 </g>;
 const tube=(kind:string,x:number,y:number,width=190,height=410)=><ArtSprite role="support" slice={kind} x={x} y={y} width={width} height={height}/>;
 const rule=(y:number)=><path d={`M70 ${y}H1010`} stroke={c.midground} strokeWidth={4}/>;
 const heading=(t:string)=><Text y={340} text={t} color={c.ink}/>;
 const comparedFly=(normal:boolean,y:number)=><g data-subject={normal?'normal-fly':'variant-fly'} data-action={normal?'restore-normal':'restore-partial'}>
  <Fly x={180} y={y} scale={1.1} clock={normal?state.normal:state.partial}
   speedAt={(t)=>comparisonSpeed(normal,t)} ink={c.ink} rate={2}/>
 </g>;
 const normalPicture=<>
  <Text y={400} text="Normal human gene" color={c.hero} size={43}/>
  <rect x={160} y={704} width={835} height={9} rx={4} fill={c.midground} opacity={.45}/>
  {comparedFly(true,420)}{tube('reference-tube',72,470,90,215)}
 </>;
 const comparisonPicture=<g data-subject="normal-fly variant-fly" data-action="compare-function">
  {normalPicture}
  <Text y={850} text="Patient variants" color={c.accent} size={43}/>
  <rect x={160} y={1164} width={835} height={9} rx={4} fill={c.midground} opacity={.45}/>
  {comparedFly(false,880)}{tube('variant-tube',72,930,90,215)}
 </g>;
 const qualifiedComparison=<>{comparisonPicture}
  <g data-subject="qualified-gene" data-action="support-diagnosis">
   <Text x={570} y={400} text="Likely diagnosis" color={c.hero} size={42}/>
  </g>
 </>;
 let picture:React.ReactNode;
 switch(shot.view){
 case 'foot-contact':picture=<>{heading('A clue needs a living test')}<g data-subject="test-fly" data-action="living-test">{fly(55,620,1.85,state.opening,.7)}</g>{rule(1165)}</>;break;
 case 'fly-question':picture=<>{heading('Can a fly test the clue?')}<g data-subject="test-fly culture-vial" data-action="living-test">{tube('culture-vial',735,645,245,525)}{fly(95,775,1.3,state.opening,.35)}</g>{rule(1125)}</>;break;
 case 'candidate-clue':picture=<>{heading(clauseId==='c2'?'Promising gene change':clauseId==='c4'?'AI-MARRVEL selects a clue':'The AI selected a candidate')}{candidates}</>;break;
 case 'gene-detail':picture=<>{heading('Promising gene change')}<g data-subject="gene-candidate" data-action="discover-candidate">
  <Text y={470} text="Conceptual candidate comparison" color={c.ink} size={35}/>
  {gene(180,650,2.6+.2*selecting)}
  <Text y={1200} text="Selected clue. Still needs testing." color={c.ink} size={43}/>
 </g></>;break;
 case 'standard-analysis':picture=<>{heading('Standard analysis')}{standardAnalysis}</>;break;
 case 'living-test':picture=<>{heading('Then researchers test it')}<g data-subject="test-fly culture-vial" data-action="living-test">
  {tube('culture-vial',675,560,300,605)}{fly(95,850,1.35,clauseId==='c1'?state.opening:state.recapTest,.5)}
  <Text y={635} text="Fly gene" color={c.ink}/><Text y={710} text="sff" color={c.hero} size={88}/>
 </g></>;break;
 case 'gene-removal':picture=<>{heading('Remove the fly gene')}<g data-subject="disabled-fly" data-action="restrict-movement">
  <Text y={550} text="sff" color={c.ink} size={100}/><path d={`M80 570L${80+225*smooth(state.disabled/4)} 460`} stroke={c.accent} strokeWidth={12}/>
  {fly(135,760,1.7,state.disabled,.08)}
 </g>{rule(1210)}</>;break;
 case 'movement-difficulty':picture=<>{heading('Movement becomes difficult')}<g data-subject="disabled-fly" data-action="restrict-movement">{fly(55,650,1.85,state.disabled,.08)}</g>{rule(1195)}<Text y={1235} text="Qualitative illustration" color={c.ink} size={35}/></>;break;
 case 'normal-condition':picture=<>{heading('Add the normal human gene')}{normalPicture}{variant==='b'&&<g data-subject="disabled-fly" data-action="restrict-movement">
  {fly(180,880,1.1,state.disabled,.08)}<Text y={850} text="Without sff" color={c.ink} size={32}/>
  <rect x={160} y={1164} width={835} height={9} rx={4} fill={c.midground} opacity={.45}/>
 </g>}</>;break;
 case 'rescue-movement':picture=<>{heading('Movement largely returns')}{normalPicture}</>;break;
 case 'variant-condition':picture=<>{heading('Patient variants differ')}{comparisonPicture}</>;break;
 case 'partial-rescue':picture=<>{heading('Only partial restoration')}{comparisonPicture}</>;break;
 case 'paired-result':picture=<>{heading('Same test. Different result.')}{clauseId==='c8'?qualifiedComparison:comparisonPicture}</>;break;
 case 'diagnostic-clue':picture=<>{heading('Evidence for a likely diagnosis')}{qualifiedComparison}<Text y={1245} text="Diagnosis stays qualified" color={c.ink} size={34}/></>;break;
 case 'honest-answer':picture=<>{heading('A clue tested in living flies')}{qualifiedComparison}<g data-subject="qualified-gene" data-action="clinical-limit"><Text y={1245} text="Not a clinical treatment" color={c.ink} size={34}/></g></>;break;
 default:throw new Error('Unimplemented fly gene view '+shot.view);
 }
 const f=art.flat_shots?.[scene.id];
 const cameraX=scene.camera_strategy==='truckAcross'?-12*a:0;
 const cameraScale=scene.camera_strategy==='dollyThrough'?1+.014*a:1;
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
 <defs><linearGradient id="fly-world" x2=".8" y2="1"><stop stopColor={c.paper}/><stop offset="1" stopColor={c.background}/></linearGradient></defs>
 <rect width={1080} height={1920} fill="url(#fly-world)"/><path d="M0 1430H1080V1920H0Z" fill={c.foreground} opacity={.06}/>
 <g data-view={shot.view} data-clause={clauseId} data-action={clause.actionId} data-framing={shot.framing} transform={`translate(${(f?.x??0)+cameraX} ${f?.y??0}) scale(${(f?.scale??1)*cameraScale})`}>{picture}</g>
 <Text y={1475} text={scene.production_disclosure??'Illustration. Qualitative comparison'} color={c.ink} size={31}/>
 </svg>;
};
