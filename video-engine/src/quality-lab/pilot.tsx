import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {withFonts} from '../lib/fonts';
import {FONT} from '../lib/type';
import {Pump, Network, clamp, ramp, mix, ink, teal, copper, paper} from './mechanism';
import cues from './full-cues';
import {PILOT as P} from './pilot-plan';

const Label:React.FC<{x?:number;y:number;children:React.ReactNode;color?:string;size?:number}>=({x=140,y,children,color=teal,size=27})=>
 <text x={x} y={y} fill={color} fontFamily={FONT.mono} fontSize={size} letterSpacing={1.5}>{children}</text>;
const Title:React.FC<{y?:number;children:React.ReactNode;size?:number;color?:string}>=({y=300,children,size=67,color=paper})=>
 <text x={140} y={y} fill={color} fontFamily={FONT.display} fontSize={size}>{children}</text>;
const Definitions=()=> <defs>
 <radialGradient id="light"><stop stopColor="#234951"/><stop offset="1" stopColor={ink}/></radialGradient>
 <linearGradient id="metal" x2=".8" y2="1"><stop stopColor="#aec3b5"/><stop offset=".22" stopColor="#395c60"/><stop offset=".5" stopColor="#152b31"/><stop offset=".8" stopColor="#577d7a"/><stop offset="1" stopColor="#233b41"/></linearGradient>
 <linearGradient id="blade" x2="1" y2="1"><stop stopColor="#d4e8ce"/><stop offset=".45" stopColor="#629f9b"/><stop offset="1" stopColor="#173b43"/></linearGradient>
 <radialGradient id="water"><stop stopColor="#325a5d"/><stop offset="1" stopColor="#0c282f"/></radialGradient>
 <linearGradient id="vignette" x2="0" y2="1"><stop stopColor={ink}/><stop offset=".28" stopColor={ink} stopOpacity="0"/><stop offset=".7" stopColor={ink} stopOpacity="0"/><stop offset="1" stopColor={ink}/></linearGradient>
 <linearGradient id="page" x2=".9" y2="1"><stop stopColor="#fff7e9"/><stop offset="1" stopColor="#d5c7ae"/></linearGradient>
 <linearGradient id="hand" x2="1" y2=".4"><stop stopColor="#996750"/><stop offset=".6" stopColor="#bf8b67"/><stop offset="1" stopColor="#84523c"/></linearGradient>
 <filter id="shadow"><feDropShadow dx="0" dy="22" stdDeviation="25" floodOpacity=".4"/></filter>
 </defs>;

const InputIcon:React.FC<{i:number;t:number}>=({i,t})=>{
 const p=ramp(t,P.inputs[i],P.inputs[i]+.55), x=220+i*270;
 return <g opacity={p} transform={'translate('+x+' '+mix(495,430,p)+')'}>
 <circle r={54} fill={ink} stroke={teal} strokeOpacity={.5} strokeWidth={2}/>
 {i===0?<><path d="M-31 15 H-23 L-15-14 L-3 25 L10-26 L22 15 H34" fill="none" stroke={teal} strokeWidth={3}/><circle r={45} fill="none" stroke={teal} strokeDasharray="3 15" transform={'rotate('+t*10+')'}/></>:
 i===1?<><path d="M-30 0 C-45-22-12-37-2-23 C21-49 48-13 28 1Z" fill="none" stroke={paper} strokeWidth={3}/>{[-18,0,18].map((v)=><path key={v} d={'M'+v+' '+(10+(t*25+v)%14)+' l-5 10'} stroke={teal} strokeWidth={3}/>)}</>:
 <><path d="M-25-32 H15 L30-15 V34 H-25Z M15-32 V-15 H30 M-12-7 H15 M-12 7 H15 M-12 21 H6" fill="none" stroke={paper} strokeWidth={3}/></>}
 <text y={98} fill={paper} textAnchor="middle" fontFamily={FONT.mono} fontSize={23}>{['SENSORS','WEATHER','MAINTENANCE'][i]}</text>
 <path d={'M0 114 V'+(144+i*18)+' Q0 '+(164+i*18)+' '+(440-x)+' 190 V665'} stroke={teal} strokeWidth={2} fill="none" strokeDasharray="3 12" strokeDashoffset={-t*60}/>
 </g>;
};

const PhysicalModel:React.FC<{t:number}>=({t})=>{
 const pull=ramp(t,P.pull[0],P.pull[1]), twin=ramp(t,P.twin[0],P.twin[1]);
 const z=mix(2.9,1.04,pull),cx=mix(-180,48,pull),cy=mix(0,125,twin);
 const forecast=ramp(t,P.forecast[0],P.forecast[1]);
 return <>
 <g transform={'translate(520 840) scale('+z+') translate('+(-cx)+' '+(-cy)+')'}>
 <g opacity={1-twin*.3}><Network t={t} gap={140} pulse={28} reveal={pull} warning={ramp(t,2.65,4.55)}/><Pump t={t}/></g>
 <g opacity={twin} transform={'translate(0 '+mix(0,370,twin)+')'}><Network t={t} wire gap={140} pulse={28} reveal={twin} warning={forecast}/><Pump t={t} wire/></g>
 <path d="M-180 164 V205 M-180 265 V332" stroke={teal} opacity={twin*.6} strokeWidth={2} strokeDasharray="4 8"/>
 </g>
 {P.inputs.map((_,i)=><InputIcon key={i} i={i} t={t}/>)}
 <g opacity={1-ramp(t,4.55,4.85)}><Title>One pump.</Title><Title y={390}>A wider problem.</Title></g>
 <g opacity={ramp(t,4.85,5.1)*(1-ramp(t,7.9,8.15))}>
 <Title size={63}>Before trouble travels.</Title>
 <Label y={374} size={25}>COLLEGE STATION · BRAZOS COUNTY</Label>
 <text x={140} y={425} fill={paper} fontFamily={FONT.body} fontSize={29}>Texas A&amp;M Engineering Experiment Station</text>
 </g>
 <g opacity={ramp(t,8.15,8.45)*(1-ramp(t,12,12.3))}><Title>A twin takes shape.</Title><Label y={377}>PROPOSED RESEARCH</Label></g>
 <g opacity={ramp(t,12.3,12.55)}><Title size={59}>{t<16.7?'Give the model context.':'Trace the possible cascade.'}</Title></g>
 <Label y={1320} size={25} color="#bdd1ca">{t<8.05?'ILLUSTRATIVE SCENARIO':'PROPOSED DIGITAL TWIN'}</Label>
 {t>=8.05&&<text x={140} y={1370} fill="#bdd1ca" fontFamily={FONT.body} fontSize={28}>Research concept. No deployed result shown.</text>}
 </>;
};

const Evidence:React.FC<{t:number}>=({t})=>{
 const enter=ramp(t,P.evidence,P.evidence+.6), absence=ramp(t,P.absence,P.absence+.65);
 const underline=ramp(t,22.5,23.1);
 return <>
 <Title size={65}>{absence>.5?'Where is the proof?':'Read the actual claim.'}</Title>
 <g transform={'translate('+mix(140,110,absence)+' '+mix(510,475,enter)+') rotate('+mix(-4,0,enter)+')'} filter="url(#shadow)">
 <rect x="0" y="0" width="770" height="830" rx="5" fill="url(#page)"/>
 <path d="M0 13 H770 M24 0 V830" stroke="#9d927c" opacity={.2}/>
 <text x={54} y={78} fill="#344747" fontFamily={FONT.mono} fontSize={27}>NATIONAL SCIENCE FOUNDATION</text>
 <path d="M54 107 H704" stroke="#a4957c"/>
 <text x={54} y={167} fill={ink} fontFamily={FONT.body} fontSize={30}>Award 2640086</text>
 <text x={54} y={220} fill={ink} fontFamily={FONT.body} fontSize={28}>Project start · September 15th, 2026</text>
 <g opacity={1-absence*.85}>
 <text x={54} y={340} fill={ink} fontFamily={FONT.display} fontSize={48}>The objective of this project</text>
 <text x={54} y={403} fill={ink} fontFamily={FONT.display} fontSize={48}>is to support research</text>
 <path d="M148 425 H470" stroke="#be6f42" strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1-underline}/>
 </g>
 <g opacity={absence}>
 <rect x={37} y={280} width={685} height={210} fill="#e9ddc6"/>
 <text x={54} y={330} fill="#344747" fontFamily={FONT.mono} fontSize={24}>MEASURED SERVICE IMPROVEMENTS</text>
 <path d="M55 358 V430 H96 M683 358 V430 H642" stroke="#98896d" strokeWidth={3} fill="none"/>
 <text x={103} y={414} fill={ink} fontFamily={FONT.display} fontSize={49}>Not reported in this award.</text>
 </g>
 <path d="M54 545 H703 M54 574 H641 M54 603 H680 M54 632 H590" stroke="#a4967e" opacity={.28} strokeWidth={8}/>
 <text x={54} y={729} fill="#394b49" fontFamily={FONT.mono} fontSize={22}>SOURCE EXTRACT · EDITORIAL LAYOUT</text>
 <text x={54} y={777} fill="#394b49" fontFamily={FONT.body} fontSize={26}>A proposal is not a field result.</text>
 </g>
 </>;
};

const Workshop:React.FC<{t:number}>=({t})=>{
 const enter=ramp(t,P.workshop,P.workshop+.7), hand=ramp(t,30.1,30.8);
 return <>
 <Title size={66}>From model to operator.</Title>
 <Label y={376} size={25}>PLANNED TOOLS AND WORKSHOPS</Label>
 <g transform={'translate(130 '+mix(650,555,enter)+')'} filter="url(#shadow)">
 <rect width={750} height={480} rx={20} fill="#40585a" stroke="#91aaa5" strokeWidth={3}/>
 <rect x={20} y={20} width={710} height={437} rx={8} fill={ink}/>
 <g transform="translate(334 236) scale(.72)"><Network t={t} wire reveal={1} warning={.55}/><Pump t={t} wire/></g>
 <path d="M0 480 H750 L834 697 H-75Z" fill="url(#metal)" stroke="#89a29b" strokeWidth={3}/>
 {Array.from({length:5},(_,r)=><g key={r}>{Array.from({length:12},(_,c)=><rect key={c} x={10+c*58-r*8} y={505+r*25} width={48+r*2} height={17} rx={3} fill="#10282d"/>)}</g>)}
 <path d="M257 633 H495 L511 677 H244Z" fill="#63827e" stroke="#a5b9b1" strokeWidth={2}/>
 </g>
 <g transform={'translate(610 '+mix(1260,1210,enter)+') rotate(-13)'}>
 <path d="M-100-65 H170 V98 H-100Z" fill="#142e34" stroke={teal} strokeWidth={2}/>
 <path d="M-91-55 H161 V88 H-91Z M-50-50 V86" fill="none" stroke="#557574"/>
 <text x={-35} y={-14} fill={paper} fontFamily={FONT.mono} fontSize={22}>GUIDANCE</text>
 <path d="M-34 15 H127 M-34 37 H102 M-34 59 H117" stroke={teal} opacity={.6} strokeWidth={3}/>
 </g>
 <g opacity={hand} transform={'translate('+mix(1020,865,hand)+' '+mix(1400,1065,hand)+') rotate(-23)'}>
 <path d="M40 240 L-35 138 Q-58 105-50 70 L-80-47 Q-86-78-66-81 Q-44-83-35-56 L-5 22 L6-1 Q19-21 39-8 L63 9 Q82 2 96 17 L120 47 Q148 45 158 75 L165 127 L224 222Z" fill="url(#hand)" stroke="#d5a47d" strokeWidth={3}/>
 <path d="M12 264 L-16 204 L170 140 L235 243" fill="#426366" stroke="#70908b" strokeWidth={4}/>
 <path d="M-65-68 L-56-42" stroke="#eed0ad" strokeWidth={6} strokeLinecap="round"/>
 </g>
 <text x={140} y={1400} fill="#bdd1ca" fontFamily={FONT.body} fontSize={27}>Illustrative planned use. No event or product shown.</text>
 </>;
};

const Closing:React.FC<{t:number}>=({t})=>{
 const reveal=ramp(t,P.returnPump,P.returnPump+.8);
 return <>
 <Title size={70}>The test is still ahead.</Title>
 <g transform={'translate(540 865) scale('+mix(1.45,2.35,reveal)+') translate(180 0)'}>
 <Pump t={35}/>
 <path d="M-385 0 H-340" stroke={copper} strokeWidth={3} opacity={.4}/>
 </g>
 <g opacity={ramp(t,P.closing,P.closing+.65)}>
 <text x={140} y={1307} fill={paper} fontFamily={FONT.display} fontSize={57}>Before trouble travels.</text>
 <Label y={1364} size={24}>A TEXAS AI DISPATCH</Label>
 </g>
 </>;
};

export const DocumentaryPilot:React.FC=()=>{
 const t=useCurrentFrame()/P.fps, cue=cues.find(c=>t>=c.start&&t<c.end);
 const section=t<P.evidence?'mechanism':t<P.workshop?'evidence':t<P.returnPump?'workshop':'close';
 return <div style={{position:'absolute',inset:0,background:ink,color:paper,overflow:'hidden'}}>
 <svg width={1080} height={1920} viewBox="0 0 1080 1920">
 <Definitions/><rect width={1080} height={1920} fill="url(#light)"/>
 <g opacity={.055}>{Array.from({length:25},(_,i)=><path key={i} d={'M'+(i*65-200)+' 300 V1490 M-200 '+(i*65+300)+' H1280'} stroke={teal}/>)}</g>
 <rect width={1080} height={1920} fill="url(#vignette)"/>
 <Label y={170} color={copper} size={25}>TEXAS AI DOCKET</Label>
 {t>=5.1&&<text x={140} y={217} fill="#adc4bf" fontFamily={FONT.mono} fontSize={21}>SEPTEMBER 15TH, 2026 · PILOT EDIT</text>}
 {section==='mechanism'?<PhysicalModel t={t}/>:section==='evidence'?<Evidence t={t}/>:section==='workshop'?<Workshop t={t}/>:<Closing t={t}/>}
 </svg>
 {cue&&<div style={{position:'absolute',left:140,right:170,top:1470,fontFamily:FONT.body,fontSize:38,lineHeight:1.36,color:paper}}>{cue.text}</div>}
 {t>=P.creditsStart&&<div style={{position:'absolute',inset:0,background:ink,padding:'140px',display:'flex',flexDirection:'column',justifyContent:'center',fontFamily:FONT.body}}>
 <div style={{fontFamily:FONT.mono,fontSize:28,color:copper,letterSpacing:4}}>TEXAS AI DOCKET</div>
 <div style={{fontFamily:FONT.display,fontSize:64,margin:'40px 0'}}>Before trouble travels.</div>
 <div style={{fontSize:30,lineHeight:1.7}}>Source<br/>National Science Foundation<br/>Award 2640086</div>
 <div style={{fontSize:26,lineHeight:1.6,marginTop:45,color:'#bdd1ca'}}>Music<br/>&quot;Immersed&quot; by Kevin MacLeod<br/>incompetech.com · CC BY 4.0<br/>creativecommons.org/licenses/by/4.0/<br/>Trimmed and synced to picture</div>
 <div style={{fontSize:26,lineHeight:1.6,marginTop:35,color:'#bdd1ca'}}>Illustrative mechanisms and planned use<br/>Original synthesized sound design</div>
 </div>}
 </div>;
};
registerRoot(()=> <Composition id="DocumentaryPilot" component={withFonts(DocumentaryPilot)} width={1080} height={1920} fps={P.fps} durationInFrames={P.runtime*P.fps}/>);
