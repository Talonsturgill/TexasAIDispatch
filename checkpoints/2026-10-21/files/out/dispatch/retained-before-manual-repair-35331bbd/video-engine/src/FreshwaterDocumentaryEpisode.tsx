import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT,widthOf} from './lib/type';
import {TexasLocator} from './documentary/TexasLocator';
import {Pump, Network, clamp, ramp, mix, ink, teal, copper, paper} from './documentary/WaterMechanism';
import {actionWindows, actionProgress, requireAction, ActionWindow} from './lib/direction';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import type {DispatchProps} from './Dispatch';

export type DocumentaryCopy = {
 date: string; place: string; institution: string; source: string; award: string;
 project_start: string; quote_lines: string[]; results: string; source_limit: string;
};
const Direction = React.createContext<{windows:Record<string,ActionWindow>;copy:DocumentaryCopy}|null>(null);
const useDirection=()=>{
 const context=React.useContext(Direction);
 if(!context) throw new Error('Documentary direction is missing');
 return {copy:context.copy, at:(id:string)=>requireAction(context.windows,id).start,
  window:(id:string)=>requireAction(context.windows,id),
  p:(id:string,t:number)=>actionProgress(requireAction(context.windows,id),t)};
};
const DirectedPump:React.FC<{t:number;wire?:boolean}>=({t,wire})=>{
 const {window}=useDirection();return <Pump t={t} wire={wire} stopWindow={window('rotor-stop')}/>;
};

const Label:React.FC<{x?:number;y:number;children:React.ReactNode;color?:string;size?:number}>=({x=140,y,children,color=teal,size=27})=>
 <text x={x} y={y} fill={color} fontFamily={FONT.mono} fontSize={size} letterSpacing={1.5}>{children}</text>;
const fitPx=(text:string,base:number,maxWidth:number)=>Math.min(base,base*maxWidth/Math.max(1,widthOf(text,base,true)));
const Title:React.FC<{y?:number;children:React.ReactNode;size?:number;color?:string}>=({y=300,children,size=67,color=paper})=>
 <text x={140} y={y} fill={color} fontFamily={FONT.display} fontSize={typeof children==='string'?fitPx(children,size,810):size}>{children}</text>;
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
 const {p:progress}=useDirection();
 const p=progress(['sensor-input','weather-input','maintenance-input'][i],t), x=220+i*270;
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
 const {p,at,copy}=useDirection();
 const pull=p('network-pull',t), twin=p('twin-separate',t);
 const z=mix(2.9,1.04,pull),cx=mix(-180,48,pull),cy=mix(0,125,twin);
 const forecast=p('forecast-trace',t)*.55+p('forecast-consequence',t)*.45;
 return <>
 <g transform={'translate(520 840) scale('+z+') translate('+(-cx)+' '+(-cy)+')'}>
 <g opacity={1-twin*.3}><Network t={t} gap={140} pulse={28} reveal={pull} warning={p('warning-spread',t)}/><DirectedPump t={t}/></g>
 <g opacity={twin} transform={'translate(0 '+mix(0,370,twin)+')'}><Network t={t} wire gap={140} pulse={28} reveal={twin} warning={forecast}/><DirectedPump t={t} wire/></g>
 <path d="M-180 164 V205 M-180 265 V332" stroke={teal} opacity={p('twin-link',t)*.6} strokeWidth={2} strokeDasharray="4 8"/>
 </g>
 {[0,1,2].map((_,i)=><InputIcon key={i} i={i} t={t}/>)}
 <g opacity={1-p('location-reveal',t)}><Title y={390} size={61}>A wider problem.</Title></g>
 <g opacity={p('location-reveal',t)*(1-p('twin-separate',t))}>

 <Label y={374} size={25}>{copy.place}</Label>
 <text x={140} y={425} fill={paper} fontFamily={FONT.body} fontSize={29}>{copy.institution}</text>
 </g>
 <g opacity={p('twin-separate',t)*(1-p('sensor-input',t))}><Label y={377}>PROPOSED RESEARCH</Label></g>
 <g opacity={p('sensor-input',t)}></g>
 <Label y={1320} size={25} color="#bdd1ca">{t<at('twin-separate')?'ILLUSTRATIVE SCENARIO':'PROPOSED DIGITAL TWIN'}</Label>
 {t>=at('twin-separate')&&<text x={140} y={1370} fill="#bdd1ca" fontFamily={FONT.body} fontSize={28}>{copy.source_limit}</text>}
 <TexasLocator progress={p('location-reveal',t)*(1-p('award-date',t))}/>
 <g opacity={p('award-date',t)*(1-p('twin-separate',t))} transform="translate(480 1060)">
 <rect x={-290} y={-75} width={670} height={168} fill={paper} rx={5}/>
 <text x={-256} y={-22} fill={ink} fontFamily={FONT.mono} fontSize={23}>{copy.source}</text>
 <text x={-256} y={32} fill={ink} fontFamily={FONT.body} fontSize={28}>{copy.project_start}</text>
 <path d="M-256 52 H328" stroke={copper} strokeWidth={3}/>
 </g>
 </>;
};

const Evidence:React.FC<{t:number}>=({t})=>{
 const {p,copy}=useDirection();
 const enter=p('source-page',t), absence=p('missing-results',t), finding=p('evidence-finding',t);
 const underline=p('source-underline',t);
 return <>

 <g transform={'translate('+mix(140,110,absence)+' '+mix(510,475,enter)+') rotate('+mix(-4,0,enter)+')'} filter="url(#shadow)">
 <rect x="0" y="0" width="770" height="830" rx="5" fill="url(#page)"/>
 <path d="M0 13 H770 M24 0 V830" stroke="#9d927c" opacity={.2}/>
 <text x={54} y={78} fill="#344747" fontFamily={FONT.mono} fontSize={27}>{copy.source}</text>
 <path d="M54 107 H704" stroke="#a4957c"/>
 <text x={54} y={167} fill={ink} fontFamily={FONT.body} fontSize={30}>{copy.award}</text>
 <text x={54} y={220} fill={ink} fontFamily={FONT.body} fontSize={28}>{copy.project_start}</text>
 <g opacity={1-absence*.85}>
 <text x={54} y={340} fill={ink} fontFamily={FONT.display} fontSize={48}>{copy.quote_lines[0]}</text>
 <text x={54} y={403} fill={ink} fontFamily={FONT.display} fontSize={48}>{copy.quote_lines[1]}</text>
 <path d="M148 425 H470" stroke="#be6f42" strokeWidth={6} pathLength={1} strokeDasharray="1" strokeDashoffset={1-underline}/>
 </g>
 <g opacity={absence}>
 <rect x={37} y={280} width={685} height={210} fill="#e9ddc6"/>
 <text x={54} y={330} fill="#344747" fontFamily={FONT.mono} fontSize={24}>MEASURED SERVICE IMPROVEMENTS</text>
 <path d="M55 358 V430 H96 M683 358 V430 H642" stroke="#98896d" strokeWidth={3} fill="none"/>
 <text opacity={finding} x={103} y={414} fill={ink} fontFamily={FONT.display} fontSize={49}>{copy.results}</text>
 </g>
 <path d="M54 545 H703 M54 574 H641 M54 603 H680 M54 632 H590" stroke="#a4967e" opacity={.28} strokeWidth={8}/>
 <text x={54} y={729} fill="#394b49" fontFamily={FONT.mono} fontSize={22}>SOURCE EXTRACT · EDITORIAL LAYOUT</text>
 <text x={54} y={777} fill="#394b49" fontFamily={FONT.body} fontSize={26}>A proposal is not a field result.</text>
 </g>
 </>;
};

const Workshop:React.FC<{t:number}>=({t})=>{
 const {p}=useDirection();
 const enter=p('operator-tools',t), hand=p('operator-hand',t);
 return <>

 <Label y={376} size={25}>PLANNED TOOLS AND WORKSHOPS</Label>
 <g transform={'translate(130 '+mix(650,555,enter)+')'} filter="url(#shadow)">
 <rect width={750} height={480} rx={20} fill="#40585a" stroke="#91aaa5" strokeWidth={3}/>
 <rect x={20} y={20} width={710} height={437} rx={8} fill={ink}/>
 <g transform="translate(334 236) scale(.72)"><Network t={t} wire reveal={1} warning={.55}/><DirectedPump t={t} wire/></g>
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
 <text x={140} y={1370} fill="#bdd1ca" fontFamily={FONT.body} fontSize={27}>Illustrative planned use. No event or product shown.</text>
 </>;
};

const Closing:React.FC<{t:number}>=({t})=>{
 const {p}=useDirection();
 const reveal=p('return-pump',t), answer=p('closing-answer',t);
 return <>

 <g transform={'translate(540 865) scale('+mix(1.45,2.35,reveal)+') translate(180 0)'}>
 <DirectedPump t={t}/>
 <path d="M-385 0 H-340" stroke={copper} strokeWidth={3} opacity={.4}/>
 </g>
 <g opacity={answer} transform="translate(540 865)">
 <path d="M-292-215 V-240 H-267 M267-240 H292 V-215 M-292 250 V275 H-267 M267 275 H292 V250" stroke={copper} strokeWidth={4} fill="none"/>
 <text y={340} textAnchor="middle" fill={copper} fontFamily={FONT.mono} fontSize={25}>FIELD EVIDENCE STILL NEEDED</text>
 </g>
 <g opacity={answer}>
 <text x={140} y={1307} fill={paper} fontFamily={FONT.display} fontSize={57}>Before trouble travels.</text>
 <Label y={1364} size={24}>A TEXAS AI DISPATCH</Label>
 </g>
 </>;
};

/** Reference episode only. New daily subjects need their own filmed argument, not a water re-skin. */
export const FreshwaterDocumentaryEpisode:React.FC<DispatchProps>=({scenes,captions=[],credits='',credits_s=5,runtime_s,documentary_copy})=>{
 const {fps}=useVideoConfig(), t=useCurrentFrame()/fps;
 const windows=actionWindows(scenes), at=(id:string)=>requireAction(windows,id).start;
 const copy=documentary_copy as DocumentaryCopy|undefined;
 if(!copy || !Array.isArray(copy.quote_lines) || copy.quote_lines.length!==2) throw new Error('Documentary source copy is missing');
 // Each directed action must name the actual pump object this episode performs.
 for(const [id,window] of Object.entries(windows)) {
  const scene=scenes.find(s=>s.id===window.scene);
  const items=scene?.planes.flatMap(p=>p.items)??[];
  if(!window.itemIds.includes('water-system') || !items.some(i=>i.id==='water-system' && i.kind==='freshwaterSystem'))
   throw new Error("Action "+id+" is not bound to this episode's rendered water-system");
 }
 const activeScene=scenes.find(s=>t>=s.start_s && t<s.start_s+s.duration_s)??scenes[scenes.length-1];
 const subject=activeScene.planes.flatMap(p=>p.items).find(i=>i.id==='water-system');
 const heading=subject?.props?.label;
 if(typeof heading!=='string') throw new Error('The rendered subject needs its board label');
 const section=t<at('source-page')?'mechanism':t<at('operator-tools')?'evidence':t<at('return-pump')?'workshop':'close';
 return <Direction.Provider value={{windows,copy}}><div style={{position:'absolute',inset:0,background:ink,color:paper,overflow:'hidden'}}>
 <svg width={1080} height={1920} viewBox="0 0 1080 1920">
 <Definitions/><rect width={1080} height={1920} fill="url(#light)"/>
 <g opacity={.055}>{Array.from({length:25},(_,i)=><path key={i} d={'M'+(i*65-200)+' 300 V1490 M-200 '+(i*65+300)+' H1280'} stroke={teal}/>)}</g>
 <rect width={1080} height={1920} fill="url(#vignette)"/>
 <Label y={170} color={copper} size={25}>TEXAS AI DOCKET</Label>
 {t>=at('location-reveal')&&<text x={140} y={217} fill="#adc4bf" fontFamily={FONT.mono} fontSize={21}>{copy.date}</text>}
 <g transform="translate(30 25) scale(.86)"><Title size={64}>{heading}</Title>{section==='mechanism'?<PhysicalModel t={t}/>:section==='evidence'?<Evidence t={t}/>:section==='workshop'?<Workshop t={t}/>:<Closing t={t}/>}</g>
 </svg>
 <Sequence from={0} durationInFrames={Math.round(runtime_s*fps)}><SubtitleTrack cues={captions} fps={fps}/></Sequence>
 <Sequence from={Math.round(runtime_s*fps)} durationInFrames={Math.round(credits_s*fps)}><CreditsCard text={credits}/></Sequence>
 </div></Direction.Provider>;
};
