import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {Scene, Cue, SubtitleTrack, CreditsCard} from './Dispatch';
import {Stage3D, Plane, CameraMoves} from './lib/stage3d';
import {Character, castProps} from './lib/Character';
import {FONT} from './lib/type';
import {SAFE_RIGHT} from './lib/safearea';

// An editorial paper construction, not a reconstruction of a Kodiak facility.
// The board owns every sentence, evidence label, timing, and item address.
const C = {ink:'#201c29', night:'#211d2e', paper:'#ebd8b3', edge:'#95795a', amber:'#df9d45',
  cream:'#fff0cf', blue:'#93afb7', steel:'#4a5361', dark:'#14151d'};
const clamp=(x:number)=>Math.min(1,Math.max(0,x));
const ease=(x:number)=>{const u=clamp(x); return u*u*(3-2*u);};
const Svg:React.FC<{children:React.ReactNode}>=({children})=><svg width={1080} height={1920}
  viewBox="0 0 1080 1920" style={{overflow:'visible'}}>{children}</svg>;
const Label:React.FC<{x:number;y:number;text:string;size?:number;fill?:string}>=
 ({x,y,text,size=32,fill=C.cream})=><text x={x} y={y} fontSize={size} fill={fill}
  fontFamily={FONT.mono} letterSpacing={1}>{text}</text>;
function item(scene:Scene,id:string){const found=scene.planes.flatMap(p=>p.items).find(p=>p.id===id);
 if(!found)throw new Error(`Missing performed board item ${id}`); return found;}

const Truck:React.FC<{f:number;existing:boolean;ghost?:boolean}>=({f,existing,ghost=false})=>{
 const wheel=f*(existing?3:0);return <g opacity={ghost?0.38:1}>
 <path d="M90 865 L578 865 L578 1080 L90 1080Z" fill={C.paper} stroke={C.edge} strokeWidth={5}/>
 <path d="M95 870 L125 842 L608 842 L578 868" fill="#b49c79"/>
 {Array.from({length:10},(_,i)=><path key={i} d={`M${115+i*44} 880v172`} stroke="#cab28e" strokeWidth={3}/>)}
 <path d="M650 938L754 938L827 1009L851 1079L643 1079Z" fill={C.blue} stroke={C.dark} strokeWidth={8}/>
 <path d="M703 952L750 952L791 997L703 997Z" fill={C.night}/>
 {existing&&<g><circle cx={733} cy={974} r={11} fill={C.paper}/><path d="M721 995v-10q12-10 24 0v10" fill={C.steel}/></g>}
 <rect x={680} y={925} width={112} height={14} rx={5} fill={C.steel}/>
 <rect x={680} y={913} width={29} height={14} fill={C.amber}/><rect x={767} y={916} width={18} height={12} fill={C.amber}/>
 <path d="M90 1090H578M600 1090H849" stroke={C.dark} strokeWidth={19}/>
 <path d="M566 1069H659" stroke={C.steel} strokeWidth={13}/><path d="M603 1056v22" stroke={C.dark} strokeWidth={12}/>
 {[177,260,609,666,795].map(x=><g key={x} transform={`translate(${x} 1097) rotate(${wheel})`}>
 <circle r={43} fill={C.dark}/><circle r={23} fill={C.steel}/><path d="M-19 0H19M0-19V19" stroke={C.edge} strokeWidth={5}/></g>)}
 <path d="M807 1035h31m-31 15h35" stroke={C.cream} strokeWidth={7}/>
 </g>};

const Dossier:React.FC<{scene:Scene;f:number;p:number}>=({scene,f,p})=>{
 const d=item(scene,'safety-case'), v=d.props||{}; const n=Number(scene.id.slice(1));
 const a=ease(p/.25), reveal=ease((p-.48)/.2);
 const small=n===5||n===6; const cx=n===1?80:small?160:n===7?180:220, cy=n===1?480:small?1100:n===4?985:565;
 const sz=n===1?.48:small?.58:n===4?.66:n===7?.81:1;
 const opening=n===1||n===8;
 const fold=n===8?1-ease((p-.36)/.5):a;
 return <Svg><g data-item-id={d.id}>
 {opening&&<g opacity={n===8?1-ease((p-.60)/.35):1}>
   <path d="M95 955L380 665L1040 1140L755 1430Z" fill={C.edge} stroke={C.dark} strokeWidth={8}/>
   <path d="M110 928L380 665L1020 1115L750 1390Z" fill={C.paper}/>
   <path d="M200 883L390 755L892 1170" fill="none" stroke={C.cream} strokeWidth={18}
    strokeDasharray="52 32" strokeDashoffset={-f*1.6}/>
   
   <g transform={`translate(${(1-fold)*-800} ${(1-fold)*-580})`}>
    <path d="M610 850l125 90-95 125-125-90Z" fill={C.night}/>
    <path d="M610 850l125 90M515 975l125 90" stroke={C.amber} strokeWidth={14} strokeDasharray="16 11"/>
   </g>
 </g>}
 <g transform={`translate(${cx+(1-a)*-80} ${cy}) scale(${sz}) rotate(${n===1?-9:n===8?5:-3})`}>
  <path d="M-22 25L574 7L596 607L-12 630Z" fill={C.edge} stroke={C.dark} strokeWidth={9}/>
  {Array.from({length:5},(_,j)=><path key={j} d={`M${j*3} ${j*5}h550v570h-550Z`} fill={j===4?C.paper:'#c5b08e'} stroke={C.edge} strokeWidth={2}/>)}
  <path d="M48 22v553" stroke={C.edge} strokeWidth={5}/>
  {[95,280,465].map(y=><g key={y}><ellipse cx={40} cy={y} rx={20} ry={11} fill="none" stroke={C.steel} strokeWidth={8}/></g>)}
  <Label x={75} y={84} text={String(v.title)} size={String(v.title).length>17?28:35} fill={C.ink}/>
  <path d="M76 112H520" stroke={C.ink} strokeWidth={3}/>
  {n===4?<g opacity={ease((p-.58)/.18)}>
    <Label x={80} y={270} text={String(v.count)} size={116} fill={C.ink}/>
    <Label x={80} y={340} text="SAFETY CASE" size={36} fill={C.ink}/>
    <Label x={80} y={470} text={String(v.sample)} size={28} fill={C.ink}/>
    <Label x={80} y={532} text={String(v.status)} size={28} fill={C.ink}/>
  </g>:n===2?<g><Label x={78} y={264} text={String(v.count)} size={125} fill={C.ink}/>
    <path d="M81 314h405" stroke={C.edge} strokeWidth={18}/>
    <path d={`M81 314h${405*(parseFloat(String(v.count))/100)*reveal}`} stroke={C.amber} strokeWidth={18}/>
    <Label x={80} y={375} text={String(v.status)} fill={C.ink}/>
    <Label x={80} y={422} text={String(v.sample)} fill={C.ink}/>
  </g>:<g>
    {Array.from({length:5},(_,j)=><g key={j} transform={`translate(${(1-ease((p-j*.05)/.3))*190} 0)`}>
      <rect x={79} y={152+j*56} width={28} height={28} fill="none" stroke={j>2?C.amber:C.edge} strokeWidth={4}/>
      <path d={`M126 ${168+j*56}h${j%2?300:265}`} stroke={C.edge} strokeWidth={6}/>
    </g>)}
    <Label x={78} y={474} text={String(v.sample)} size={String(v.sample).length>25?20:27} fill={C.ink}/>
    <Label x={78} y={532} text={String(v.status)} size={String(v.status).length>23?20:28} fill={C.ink}/>
  </g>}
  {n===8&&<g transform={`translate(35 0) scale(${ease((p-.60)/.34)} 1)`}>
    <path d="M0 0H535V592H0Z" fill="#846949" stroke={C.ink} strokeWidth={7}/>
    <Label x={38} y={125} text={String(v.title)} size={47}/>
    <path d="M40 156H490" stroke={C.amber} strokeWidth={4}/>
    <Label x={38} y={440} text={String(v.sample)} size={30}/>
    <Label x={38} y={495} text={String(v.status)} size={28}/>
  </g>}
  <path d={`M475 -12h53v${55+reveal*68}l-27-16-26 16Z`} fill={C.amber} stroke={C.ink} strokeWidth={3}/>
 </g>
 </g></Svg>;
};

const Shot:React.FC<{scene:Scene}>=({scene})=>{
 const f=useCurrentFrame(), {fps}=useVideoConfig(), p=clamp(f/(scene.duration_s*fps));
 const n=Number(scene.id.slice(1)); const cam=CameraMoves[scene.camera_strategy](p);
 const d=item(scene,'safety-case').props||{}; const person=item(scene,'engineer');
 const move=ease((p-.08)/.48), late=ease((p-.56)/.22);
 return <div style={{position:'absolute',inset:0,background:C.night}}>
 <Stage3D camera={{...cam,x:(cam.x||0)*.24,y:(cam.y||0)*.20,z:(cam.z||0)*.24,rotY:(cam.rotY||0)*.3}}>
 <Plane z={800}><Svg><g data-item-id="light">
  <rect x={-1000} y={-1000} width={3200} height={4300} fill={C.night}/>
  <path d="M-600 1450L1800 1380L2100 2600H-800Z" fill="#393035"/>
  <rect x={80} y={360} width={860} height={720} fill="#34313e" stroke="#6d6261" strokeWidth={14}/>
  <rect x={100} y={382} width={820} height={310} fill="#384651"/>
  <path d="M100 620q300-14 820 5v60H100Z" fill="#595754"/>
  <path d="M100 495h820M375 380v320M655 380v320" stroke="#6d6261" strokeWidth={14}/>
  <path d="M-300 1450L1900 1390M-100 1850L1900 1810" stroke="#514342" strokeWidth={8}/>
  <path d="M180 1470l-220 1250M700 1450l310 1250" stroke="#514342" strokeWidth={8}/>
 </g></Svg></Plane>
 <Plane z={360}><Svg>
 {n===3?<g data-item-id="evidence-join" transform={`translate(0 ${-100+move*130})`}>
   <path d={`M${-260+move*380} 735h340v400h-340Z`} fill={C.paper} stroke={C.edge} strokeWidth={10}/>
   <path d={`M${910-move*390} 735h340v400h-340Z`} fill={C.blue} stroke={C.steel} strokeWidth={10}/>
   <Label x={150} y={805} text={String(item(scene,'evidence-join').props?.leftTitle)} fill={C.ink}/>
   <Label x={550} y={805} text={String(item(scene,'evidence-join').props?.rightTitle)} fill={C.ink}/>
   {[0,1,2].map(j=><g key={j}><path d={`M165 ${880+j*70}h210M555 ${880+j*70}h210`} stroke={C.edge} strokeWidth={12}/>
    <path d={`M420 ${880+j*70}h${120*late}`} stroke={C.amber} strokeWidth={17}/></g>)}
   <Label x={170} y={1230} text={String(item(scene,'evidence-join').props?.result)} size={37}/>
 </g>:n===4?<g data-item-id="truck">
   <path d="M85 530L858 530L978 1050L-38 1050Z" fill={C.steel} stroke={C.dark} strokeWidth={24}/>
   <path d="M135 580L815 580L890 926L54 926Z" fill="#354651" stroke={C.blue} strokeWidth={9}/>
   <path d="M270 927L400 692L630 927" fill="none" stroke="#89938e" strokeWidth={18}/>
   <circle cx={337} cy={980} r={105} fill="none" stroke={C.dark} strokeWidth={27}/>
   <path d="M337 884v97l-89 47m89-47 89 47" stroke={C.dark} strokeWidth={15}/>
   <g opacity={1-ease((p-.53)/.15)} transform={`translate(${late*130} ${late*620}) scale(${1-late*.3})`}>
     <Label x={282} y={774} text={String(d.count)} size={112} fill={C.amber}/>
   </g><Label x={143} y={1140} text="NOT SAFE TRIP ODDS" size={43}/>
 </g>:n===5?<g data-item-id="texas-plan" transform={`translate(${(1-move)*300} 0)`}>
   <path d="M180 440H495V628L610 624L695 685L802 699L876 799L805 972L711 1000L646 1180L533 1087L479 968L375 962L292 849L184 807L90 645H180Z"
     fill={C.paper} stroke={C.edge} strokeWidth={12}/>
   <Label x={315} y={820} text={String(item(scene,'texas-plan').props?.title)} size={97} fill={C.ink}/>
   <path d="M295 864H740" stroke={C.amber} strokeWidth={12}/>
   <rect x={265} y={886} width={475} height={130} rx={8} fill={C.night}/><Label x={292} y={937} text="INITIAL LAUNCH" size={39}/><Label x={370} y={988} text="MARKET" size={39}/>
   <Label x={215} y={1265} text={String(item(scene,'texas-plan').props?.status)} size={39}/>
 </g>:<g data-item-id="truck" transform={`translate(${n===6?-450+move*650:-100} ${n===6?-200:-350}) scale(${n===6?1.16:.92})`}>
   <path d="M-900 1160H2200" stroke="#6c6b6e" strokeWidth={80}/>
   <path d="M-900 1160H2200" stroke={C.paper} strokeWidth={5} strokeDasharray="80 100" strokeDashoffset={n===6?-f*7:0}/>
   <Truck f={f} existing={n===6} ghost={n===1||n===8}/>
   {n===6&&<><Label x={95} y={810} text="DALLAS TO HOUSTON" size={40}/><Label x={95} y={1240} text="EXISTING FREIGHT" size={38}/></>}
 </g>}
 </Svg></Plane>
 <Plane z={100}>
 {n===3?<div style={{opacity:.95,transform:'translate(-165px,580px) scale(.56)',transformOrigin:'center center'}}><Dossier scene={scene} f={f} p={p}/></div>:<Dossier scene={scene} f={f} p={p}/>}
 </Plane>
 <Plane z={20}><Svg><g data-item-id="engineer" opacity={1}>
  <Character {...castProps(String(person.props?.cast))} frame={f} x={n===7?680:n===3?855:n===4?80:840} y={n===7?1265:n===3?1470:1410}
    scale={n===7?1.04:n===4?.84:.82} headgear="bare" pose={p>.5?'point':'arms-crossed'} emotion="worried"/>
  {n===7&&<path d="M60 1245H950L1010 1290H-30Z" fill={C.edge} stroke={C.ink} strokeWidth={9}/>}
 </g></Svg></Plane>
 </Stage3D>
 <div style={{position:'absolute',left:64,top:84,width:SAFE_RIGHT-92,fontFamily:FONT.mono,color:C.amber,fontSize:24,letterSpacing:4}}>TEXAS AI DOCKET / THE ROAD</div>
 <div style={{position:'absolute',left:64,top:158,width:SAFE_RIGHT-100,fontFamily:FONT.display,color:C.cream,fontSize:58,lineHeight:1.1,whiteSpace:'pre-line'}}>{n===8?(scene.super||'').replace(', ',',\n'):scene.super}</div>
 {scene.caption&&<div style={{position:'absolute',left:66,top:312,width:SAFE_RIGHT-110,fontFamily:FONT.mono,color:C.amber,fontSize:32,lineHeight:1.3}}>{scene.caption}</div>}
 </div>;
};

export const HighwaySafetyCaseEpisode:React.FC<{runtime_s:number;scenes:Scene[];captions?:Cue[];credits?:string;credits_s?:number}>=
 ({runtime_s,scenes,captions=[],credits='',credits_s=5})=>{const {fps}=useVideoConfig();return <>
 {/* Adjacent sequences share the same rounded boundary, so fractional scene lengths leave no black frame. */}
 {scenes.map((s,i)=><Sequence key={s.id} from={Math.round(s.start_s*fps)} durationInFrames={Math.round((scenes[i+1]?.start_s??runtime_s)*fps)-Math.round(s.start_s*fps)}><Shot scene={s}/></Sequence>)}
 <SubtitleTrack cues={captions} fps={fps}/>
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </>};
