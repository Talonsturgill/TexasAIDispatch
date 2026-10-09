import React from 'react';
import {FONT,widthOf} from '../lib/type';
import {useArtDirection} from '../lib/artDirection';
import {actionWindows,actionProgress,requireAction} from '../lib/direction';
import {Condenser,InspectionEye,Handheld,Wrench} from './CoolingAssets';
import type {CoolingColors} from './CoolingAssets';
import {usePlace} from './PlaceStage';
import type {FilmRenderProps} from './types';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const Label:React.FC<{x:number;y:number;text:string;c:CoolingColors;size?:number;accent?:boolean}>=
 ({x,y,text,c,size=48,accent=false})=>{size=Math.min(size,900/widthOf(text,1));return <g transform={`translate(${x} ${y})`}>
  <rect x={-20} y={-size-9} width={widthOf(text,size)+40} height={size+28} rx={8}
   fill={accent?c.accent:c.paper} stroke={c.ink} strokeWidth={5}/>
  <text fontFamily={FONT.body} fontWeight={800} fontSize={size} fill={c.ink}>{text}</text>
 </g>;};
const Check:React.FC<{x:number;y:number;p:number;c:CoolingColors;scale?:number}>=({x,y,p,c,scale=1})=>
 <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={clamp(p*3)}>
  <circle r={66} fill={c.hero} stroke={c.ink} strokeWidth={7}/>
  <path d="M-34 0L-7 28L38-30" fill="none" stroke={c.paper} strokeWidth={12}
   strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/>
 </g>;
const Flag:React.FC<{x:number;y:number;p:number;c:CoolingColors}>=({x,y,p,c})=>
 <g transform={`translate(${x} ${y})`}>
  <path d="M0 170L0-115" stroke={c.ink} strokeWidth={12}/>
  <path d={`M3-113L${3+165*p}-113L${3+125*p}-57L${3+165*p}-3L3-3Z`}
   fill={c.accent} stroke={c.ink} strokeWidth={7}/>
  <path d="M21-76L90-76M21-53L65-53" stroke={c.paper} strokeWidth={7} opacity={p}/>
 </g>;
const WorkCard:React.FC<{x:number;y:number;p:number;checked?:boolean;c:CoolingColors;scale?:number}>=
 ({x,y,p,checked=false,c,scale=1})=><g transform={`translate(${x} ${y}) scale(${scale}) rotate(-4)`}>
  <path d="M-154-115L147-115L160 180L-153 183Z" fill={c.ink} opacity={.18} transform="translate(16 20)"/>
  <rect x={-153} y={-115} width={300} height={292} rx={10} fill={c.paper} stroke={c.ink} strokeWidth={7}/>
  <rect x={-43} y={-135} width={87} height={43} rx={9} fill={c.foreground} stroke={c.ink} strokeWidth={5}/>
  {[0,1,2].map(i=><g key={i}><rect x={-115} y={-64+i*72} width={38} height={38} rx={3}
   fill={c.paper} stroke={c.ink} strokeWidth={5}/><path d={`M-48 ${-45+i*72}L107 ${-45+i*72}`}
   stroke={c.midground} strokeWidth={10} strokeLinecap="round"/>
   {checked&&<path d={`M-110 ${-45+i*72}l10 10 22-27`} stroke={c.hero} strokeWidth={7}
    fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1-clamp(p*3-i*.3)}/>}</g>)}
 </g>;

/** Authored shot grammar on one global event clock. Fans never encode a diagnosis.
 * Colour illustrates only the vendor's qualitative warm/cool comparison. */
export const CoolingFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,shot_s,variant})=>{
 const art=useArtDirection(),place=usePlace();
 if(!art)throw new Error('Modern film requires its executed art-direction profile');
 const c=art.palette as CoolingColors;
 const windows=actionWindows(board.scenes);
 const p=(id:string)=>actionProgress(requireAction(windows,id),time_s);
 const a=p(`${scene.id}-event-1`),b=p(`${scene.id}-event-2`),d=p(`${scene.id}-event-3`);
 const fan=time_s*23;
 const left=variant==='a'?350:440,right=variant==='a'?785:900;
 const heat=scene.id==='s4'?Math.max(.06,.72*(1-d)):scene.id==='s6'?.07:.62+.16*a;
 const title=(text:string,accent=false)=><Label x={80} y={340} text={text} c={c} size={text.length>25?42:52} accent={accent}/>;
 const pair=(second=.1)=><>
  <Condenser x={left} y={565} scale={1.2} c={c} identity="a" heat={heat} fan={fan}/>
  <Condenser x={right} y={580} scale={.9} c={c} identity="b" heat={second} fan={fan}/>
 </>;
 let picture:React.ReactNode;
 switch(shot.view){
  case 'thermal-detail':picture=<>
   <Condenser x={variant==='a'?505:370} y={370} scale={1.75} c={c} identity="a" heat={.52+.25*a} fan={fan}/>
   <Condenser x={1040} y={630} scale={.65} c={c} identity="b" heat={.08} fan={fan}/>
   {title('ONE UNIT RAN WARMER',true)}
   <path d={`M${variant==='a'?300:230} 1120C${330+80*a} 1010 ${365+80*a} 880 ${350+110*a} 750`}
    fill="none" stroke={c.accent} strokeWidth={18} opacity={.75}/>
  </>;break;
  case 'paired-room':picture=<>{pair(scene.id==='s5'?.15+.5*b:.08)}
   {title(scene.id==='s1'?'TWO UNITS. DIFFERENT HEAT.':'HOUSTON PILOT')}
   <InspectionEye x={100+240*a} y={1180} scale={1.18} c={c} angle={-6+6*b}/>
  </>;break;
  case 'inspection-lens':picture=<>
   <Condenser x={665} y={460} scale={1.23} c={c} identity="a" heat={.76} fan={fan}/>
   <InspectionEye x={250+70*b} y={1050} scale={2.65} c={c} angle={-7+7*b}/>
   <path d={`M${250+70*b} 875L570 620L570 990Z`} fill={c.hero} opacity={.09+.08*d}/>
   {title('THE ROBOT FLAGS IT')}
   <Flag x={850} y={900} p={d} c={c}/>
  </>;break;
  case 'tool-check':picture=<>
   <Condenser x={865} y={415} scale={1.3} c={c} identity="a" heat={.71} fan={fan}/>
   <Handheld x={330+200*a} y={1050} scale={1.75} rotation={-8+8*b} confirmed={d} c={c}/>
   <Check x={710} y={1220} p={d} c={c}/>
   {title('A HANDHELD CHECK CONFIRMS')}
  </>;break;
  case 'repair-detail':picture=<>
   <Condenser x={570} y={280} scale={1.82} c={c} identity="a" heat={heat} fan={fan}/>
   <Wrench x={440+80*a} y={1130-75*b} rotation={-20+40*b} c={c}/>
   {title('THE VENDOR REPORTS A REPAIR')}
  </>;break;
  case 'cool-result':picture=<>
   <Condenser x={510} y={440} scale={1.45} c={c} identity="a" heat={heat} fan={fan}/>
   <Check x={840} y={1090} p={d} c={c} scale={1.15}/>
   <WorkCard x={230} y={1230} p={d} checked c={c} scale={.72}/>
   {title('BACK TO NORMAL',true)}
  </>;break;
  case 'intermittent-detail':picture=<>
   <Condenser x={535} y={425} scale={1.5} c={c} identity="b"
    heat={.12+.62*(a-b+d*.6)} fan={fan}/>
   <g transform={`translate(810 ${1250-130*b})`}><Flag x={0} y={0} p={Math.max(a,d)} c={c}/></g>
   {title('THE SECOND UNIT SPIKED')}
   <path d={`M140 1320L315 1320L405 ${1320-85*a}L490 1320L655 1320L740 ${1320-85*d}L850 1320`}
    fill="none" stroke={c.accent} strokeWidth={13} strokeLinecap="round"/>
  </>;break;
  case 'pending-work':picture=<>
   <Condenser x={variant==='a'?260:820} y={640} scale={.82} c={c} identity="b" heat={.28} fan={fan}/>
   <Flag x={variant==='a'?460:995} y={960} p={1} c={c}/>
   <WorkCard x={variant==='a'?780:315} y={790} p={d} c={c} scale={1.18}/>
   {title('FLAGGED FOR INSPECTION',true)}
  </>;break;
  case 'source-update':picture=<>
   <Condenser x={225} y={755} scale={.75} c={c} identity="a" heat={.07} fan={fan}/>
   <Condenser x={820} y={755} scale={.65} c={c} identity="b" heat={.25} fan={fan}/>
   <g transform={`translate(530 ${700-85*a}) rotate(-5)`}>
    <rect x={-315} y={-245} width={630} height={485} rx={15} fill={c.ink} opacity={.2} transform="translate(18 24)"/>
    <rect x={-315} y={-245} width={630} height={485} rx={15} fill={c.paper} stroke={c.ink} strokeWidth={8}/>
    <path d="M-272-175L272-175" stroke={c.accent} strokeWidth={15}/>
    <text x={-268} y={-90} fontFamily={FONT.body} fontSize={54} fontWeight={800} fill={c.ink}>September 23rd</text>
    <text x={-268} y={7} fontFamily={FONT.body} fontSize={48} fontWeight={700} fill={c.ink}>Vendor update</text>
    <text x={-268} y={107} fontFamily={FONT.body} fontSize={70} fontWeight={800} fill={c.ink}>Pilot ongoing</text>
   </g>
   {title('THE PILOT IS STILL ONGOING')}
  </>;break;
  case 'limit-bookend':picture=<>
   <Condenser x={left} y={540} scale={1.1} c={c} identity="a" heat={.07} fan={fan}/>
   <Condenser x={right} y={575} scale={.9} c={c} identity="b" heat={.26} fan={fan}/>
   <WorkCard x={left} y={1245} p={1} checked c={c} scale={.8}/>
   <WorkCard x={right} y={1230} p={0} c={c} scale={.75}/>
   <Flag x={right+110} y={1100} p={Math.max(.65,b)} c={c}/>
   <InspectionEye x={115+100*b} y={1120} scale={.86} c={c}/>
   {title(b<.95?'THE FLAG STARTS A CHECK':'A PERSON HAS TO FINISH IT',true)}
  </>;break;
  default:throw new Error('Unimplemented modern cooling view '+shot.view);
 }
 const keyX=art.lighting.key.position[0];
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs>
   <linearGradient id="modern-wall" x1={keyX<0?'0':'1'} y1="0" x2={keyX<0?'1':'0'} y2="1">
    <stop offset="0" stopColor={c.paper}/><stop offset="1" stopColor={c.background}/>
   </linearGradient>
   <radialGradient id="modern-light"><stop stopColor={c.paper} stopOpacity={.7}/><stop offset="1" stopColor={c.paper} stopOpacity={0}/></radialGradient>
   <linearGradient id="modern-floor" x2="0" y2="1"><stop stopColor={c.midground}/><stop offset="1" stopColor={c.foreground}/></linearGradient>
  </defs>
  {!place&&<rect width={1080} height={1920} fill="url(#modern-wall)"/>}
  <path d="M0 1200L1080 1130L1080 1920L0 1920Z" fill="url(#modern-floor)"/>
  <path d="M0 1200L1080 1130" stroke={c.ink} strokeWidth={8} opacity={.22}/>
  {!place&&<path d="M0 0L170 0L45 1100L0 1100Z" fill={c.ink} opacity={.06}/>}
  {[0,1,2,3].map(i=><path key={i} d={`M0 ${1370+i*140}L1080 ${1300+i*140}`} stroke={c.paper} strokeWidth={3} opacity={.15}/>)}
  {!place&&<ellipse cx={keyX<0?270:790} cy={660} rx={720} ry={930} fill="url(#modern-light)"/>}
  <g data-view={shot.view} data-framing={shot.framing}
   transform={shot.framing==='wide'?'translate(94 124) scale(.82)':shot.framing==='detail'?'translate(-43 -54) scale(1.08)':undefined}>{picture}</g>
  <path d="M0 1515L1080 1460L1080 1920L0 1920Z" fill={c.ink} opacity={.06}/>
  <text x={68} y={1453} fontFamily={FONT.body} fontSize={30} fill={c.ink} opacity={.85}>Generic illustration of the vendor's account</text>
 </svg>;
};
