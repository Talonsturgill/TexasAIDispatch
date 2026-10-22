import React from 'react';
import {FONT, wrapToWidth} from './type';
import {useUid} from './uid';

/** Editorial cutaways of an electronic document workflow, not patient data or a
 * reconstruction of a clinical interface. Units belong to the diagram frame, not
 * to the true-scale world library. Every moving value arrives from board actions. */
export const FAX_PALETTE = {
  ink: '#143039', mint: '#80bdab', mist: '#dce9e3', paper: '#fff7e5',
  shade: '#c4cfbe', amber: '#e8ae4f', muted: '#68847e', white: '#f4f8ef',
};
export const FAX_CHART_PAGE = {x: 80, y: 52, scale: .78};
const C = FAX_PALETTE;
const bound = (p: number) => Math.max(0, Math.min(1, p));
interface FaxProps {
  x?: number; y?: number; scale?: number; label?: string; mode?: string; date?: string;
  progress?: number; extract?: number; split?: number; dock?: number; focus?: number;
  fan?: number; copy?: number; cleared?: number; patient?: number; question?: number;
  enter?: number; reading?: number; sort?: number; unfold?: number; handoff?: number; close?: number;
  targetX?: number; targetY?: number; targetScale?: number;
  patientX?: number; patientY?: number; patientScale?: number;
}
const Caption: React.FC<{label: string; x?: number; y: number; width: number; size?: number}> =
  ({label, x = 0, y, width, size = 25}) => <g fill={C.ink}>
    {wrapToWidth(label, width, size).map((line, i) => <text key={i} x={x} y={y+i*size*1.24}
      fontFamily={FONT.body} fontWeight={700} fontSize={size}>{line}</text>)}
  </g>;
const Identity: React.FC<{x?: number; y?: number; scale?: number}> = ({x=0,y=0,scale=1}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-31} y={-31} width={62} height={62} rx={16} fill={C.mint}/>
    <circle cx={0} cy={-7} r={10} fill={C.paper}/>
    <path d="M-18 22C-19 1 18 1 18 22Z" fill={C.paper}/>
  </g>;
const Sheet: React.FC<{extract?: number; structured?: number; opacity?: number; marked?: boolean}> =
  ({extract=0,structured=0,opacity=1,marked=true}) => <g opacity={opacity}>
    <path d="M0 0H262L320 57V425H0Z" fill={C.paper} stroke={C.ink} strokeWidth={4}/>
    <path d="M262 0V58H320" fill={marked?C.amber:C.shade} stroke={C.ink} strokeWidth={4}/>
    <path d="M14 418H315V64" fill="none" stroke={C.shade} strokeWidth={6}/>
    <Identity x={57+extract*327} y={91-extract*74} scale={.9+extract*.18}/>
    {[0,1,2,3,4,5,6].map(i => <g key={i} transform={`translate(${31+structured*310} ${158+i*31-structured*28})`}>
      <rect width={(i%3===0?221:i%3===1?180:238)*(1-structured*.18)} height={i===0?9:5}
        rx={structured*2} fill={structured>.7?C.muted:C.ink} opacity={.84-i*.055}/>
      {structured>0 && <rect x={-12} y={-5} width={240} height={19} rx={4} fill="none"
        stroke={C.mint} strokeWidth={2} opacity={structured}/>} 
    </g>)}
    <path d="M30 388h84m20 0h103" stroke={C.ink} strokeWidth={2} opacity={.25}/>
  </g>;

export const FaxDocument: React.FC<FaxProps> = ({x=0,y=0,scale=1,label='',mode='page',
  progress=0,extract=0,split=0,dock=0,enter=1,sort=0,close=0,
  targetX=0,targetY=0,targetScale=1}) => {
  const p=bound(progress), e=bound(extract), splitP=bound(split), sortP=bound(sort);
  const seated=mode==='seated'||mode==='bundle';
  const d=seated?1:bound(dock);
  const uid=useUid('fax-document');
  const pageScale=1+(targetScale-1)*d;
  const pageX=targetX*d, pageY=targetY*d;
  return <g transform={`translate(${x-(1-bound(enter))*620} ${y}) scale(${scale})`}>
    {mode==='bundle' && [0,1].map(i=><g key={i}
      transform={`translate(${12-i*18+splitP*(i?112:-62)+sortP*(i?48:13)} ${12+i*15+splitP*(i?24:-28)+sortP*205}) rotate(${splitP*(i?8:-7)*(1-sortP)}) scale(${.72-sortP*.22})`}>
      <Sheet marked={false}/>
    </g>)}
    <defs><clipPath id={uid}><rect x={-20} y={-80} width={720} height={585-d*(325+bound(close)*96)}/></clipPath></defs>
    <g transform={`translate(${pageX} ${pageY}) scale(${pageScale})`}>
      <g clipPath={`url(#${uid})`}>
        <Sheet extract={e*(1-d)} structured={mode==='structured'?p*(1-d):0}/>
      </g>
      <Caption label={label} y={d>.5?-20:460} width={345}/>
    </g>
    {mode==='structured' && <g opacity={e*(1-d)}>
      <rect x={326} y={107} width={266} height={257} rx={13} fill="none"
        stroke={C.mint} strokeWidth={3}/>
      <path d="M310 230H332" stroke={C.amber} strokeWidth={7}/>
    </g>}
  </g>;
};

export const FaxChart: React.FC<FaxProps> = ({x=0,y=0,scale=1,label='',mode='open',
  progress=0,dock=0,focus=0,fan=0,handoff=0,close=0}) => {
  const p=bound(progress), d=bound(dock), f=bound(focus), n=bound(fan), h=bound(handoff), c=bound(close);
  return <g transform={`translate(${x+h*155} ${y-h*45}) scale(${scale})`}>
    {[0,1].map(i=><g key={i} transform={`translate(${-(i+1)*n*46} ${(i+1)*n*12}) rotate(${-(i+1)*n*7} 230 460)`} opacity={n*(1-f*.62)}>
      <path d="M0 52V12Q0 0 14 0H164L189 32H446Q460 32 460 46V508H0Z"
        fill={i?C.shade:C.muted} stroke={C.ink} strokeWidth={4}/>
      {i ? <path d="M22 79 43 115 1 115Z" fill={C.paper}/> :
        <rect x={7} y={83} width={31} height={31} rx={4} fill={C.paper}/>}
    </g>)}
    <path d="M0 52V12Q0 0 14 0H164L189 32H446Q460 32 460 46V508H0Z"
      fill={C.muted} stroke={C.ink} strokeWidth={5}/>
    <rect x={18} y={67} width={423} height={419} rx={12} fill={C.white}/>
    <Identity x={65} y={121}/>
    <path d="M120 99H285M120 123H388M120 147H339" stroke={C.muted} strokeWidth={7}/>
    {mode==='fields' ? [0,1,2,3].map(i=><g key={i} transform={`translate(41 ${192+i*63})`}>
      <rect width={370} height={44} rx={7} fill={C.mist} stroke={C.mint} strokeWidth={2}/>
      <rect width={370*p} height={44} rx={7} fill={C.mint} opacity={.56}/>
      <rect x={13} y={15} width={(i%2?272:212)*p} height={9} rx={3} fill={C.ink}/>
    </g>) : <>
      <g transform={`translate(${FAX_CHART_PAGE.x} ${FAX_CHART_PAGE.y}) scale(${FAX_CHART_PAGE.scale})`} opacity={d}>
        <Sheet structured={1}/>
      </g>
      <path d={`M0 ${210-p*26-c*132}H460V507H0Z`} fill={C.mint} stroke={C.ink} strokeWidth={5}/>
      <path d={`M19 ${231-p*26-c*132}H440`} stroke={C.white} strokeWidth={3}/>
      <Identity x={64} y={291-p*26} scale={1+f*.12}/>
    </>}
    <Caption label={label} y={550} width={460} size={27}/>
  </g>;
};

export const FaxDesk: React.FC<FaxProps> = ({x=0,y=0,scale=1,label='',mode='work',progress=0,copy=0,cleared=0,reading=0,handoff=0}) => {
  const p=bound(progress), h=bound(handoff), read=bound(reading), copied=bound(copy);
  const reach=mode==='rest'?1-p:mode==='read'?read*.7+copied*.3:p;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 63 734 0 900 90 126 169Z" fill={C.paper} stroke={C.ink} strokeWidth={5}/>
    <path d="M126 169 900 90V114L127 198 0 91V63Z" fill={C.shade} stroke={C.ink} strokeWidth={5}/>
    <path d="M154 199V368M838 122V326" stroke={C.muted} strokeWidth={24}/>
    <g transform="translate(367 56) skewX(-16)">
      <rect width={278} height={64} rx={9} fill={C.mist} stroke={C.ink} strokeWidth={3}/>
      {[0,1,2].map(row=>[0,1,2,3,4,5,6,7,8].map(col=>
        <rect key={`${row}-${col}`} x={12+col*29} y={10+row*15} width={22} height={9} rx={2}
          fill={C.white} stroke={C.muted} strokeWidth={1}/>))}
    </g>
    <g transform={`translate(${reach*68+h*155} ${-reach*24-h*45}) rotate(${-reach*4} 170 155)`}>
      <path d="M12 285 127 198 231 157 284 99Q297 86 306 94Q314 102 301 118L282 143
        332 116Q347 110 352 122Q357 134 340 141L298 158 345 140Q361 135 365 148
        Q369 160 351 165L313 180Q280 207 240 219L122 325Z"
        fill="#bb866b" stroke={C.ink} strokeWidth={4} strokeLinejoin="round"/>
      <path d="M8 256 109 206 158 289 103 334H0Z" fill={C.mint} stroke={C.ink} strokeWidth={4}/>
      <path d="M96 217 146 288" stroke={C.white} strokeWidth={3}/>
    </g>
    {mode==='read' && <g opacity={1-copied}>
      <path d={`M${284+read*36} ${99-read*24}L${130+read*90} ${-140+read*62}`}
        stroke={C.ink} strokeWidth={10} strokeLinecap="round"/>
      <circle cx={130+read*90} cy={-140+read*62} r={8} fill={C.amber}/>
    </g>}
    {mode==='sorting' && [0,1].map(i=><g key={i} transform={`translate(${155+i*279} ${155-p*298})`}>
      <path d="M0 0H220L242 42V105H18L0 62Z" fill={i?C.shade:C.mint} stroke={C.ink} strokeWidth={4}/>
      <path d="M10 62H229" stroke={C.paper} strokeWidth={3}/>
      {i?<path d="M177 77 189 96 166 96Z" fill={C.ink}/>:<circle cx={184} cy={86} r={10} fill={C.ink}/>}
    </g>)}
    {copy>0 && <g transform={`translate(${170+bound(copy)*450} ${-80-bound(copy)*160})`} opacity={Math.sin(bound(copy)*Math.PI)}>
      <Identity scale={1.5+bound(copy)*.3}/>
    </g>}
    {mode==='workload' && <g transform="translate(613 -25)">
      <circle r={77} fill={C.paper} stroke={C.ink} strokeWidth={6}/>
      <path d="M0-87V-99M-22-99H22" stroke={C.ink} strokeWidth={6}/>
      <path d="M0 0V-49M0 0 37 16" stroke={C.muted} strokeWidth={6} fill="none"/>
      {[0,1,2].map(i=><g key={i} transform={`translate(${-201+bound(cleared)*i*91} ${-70-i*14-bound(cleared)*180}) scale(.23)`} opacity={1-bound(cleared)}><Sheet/></g>)}
    </g>}
    <Caption label={label} x={mode==='workload'?510:174} y={mode==='workload'?-125:390}
      width={mode==='workload'?285:680} size={27}/>
  </g>;
};

export const FaxReport: React.FC<FaxProps> = ({x=0,y=0,scale=1,label='',mode='report',date='',progress=0,unfold=1}) => {
  const p=bound(progress), u=bound(unfold);
  if(mode==='limit') return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <Caption label={label} x={0} y={35} width={630} size={39}/>
    <path d="M0 74H620" stroke={C.amber} strokeWidth={5}/>
    <g transform="translate(38 146)">
      <g transform="translate(0 10) scale(.49)"><Sheet/></g>
      <path d="M230 0V260" stroke={C.amber} strokeWidth={6}/>
      <rect x={278} y={0} width={242} height={238} rx={18} fill={C.white} stroke={C.muted}
        strokeWidth={3} strokeDasharray="9 8"/>
      <circle cx={399} cy={110} r={61} fill="none" stroke={C.muted} strokeWidth={5}/>
      <path d="M399 49V35M381 35H417" stroke={C.muted} strokeWidth={5}/>
      <rect x={277-p*244} y={-2} width={245*(1-p)} height={242} rx={17} fill={C.mist}/>
    </g>
  </g>;
  return <g transform={`translate(${x} ${y+70*(1-u)}) scale(${scale})`} opacity={u}>
    <g transform={`translate(325 0) scale(${.15+.85*u} 1) translate(-325 0)`}>
      <rect x={12} y={20} width={652} height={532} rx={8} fill={C.shade}/>
      <path d="M0 0H650V535H0Z" fill={C.paper} stroke={C.ink} strokeWidth={4}/>
      <path d="M0 0H650V20H0Z" fill={C.amber}/>
      <Caption label={label} x={35} y={72} width={580} size={31}/>
      <text x={35} y={142} fontFamily={FONT.mono} fontSize={27} fill={C.muted}>{date}</text>
      <g transform="translate(43 193)">
        {[0,1,2,3].map(i=><path key={i} d={`M0 ${i*29}H${[485,544,417,505][i]}`}
          stroke={C.muted} strokeWidth={6}/>) }
        <rect x={-8} y={-15} width={u*564} height={29} fill={C.amber} opacity={.32}/>
      </g>
      <g transform="translate(70 337)">
        <g transform="scale(.31)"><Sheet/></g>
        <path d={`M132 73H${132+u*185}`} stroke={C.mint} strokeWidth={10}/>
        <Identity x={428} y={74} scale={1.45}/>
      </g>
    </g>
  </g>;
};

export const FaxClinic: React.FC<FaxProps> = ({x=0,y=0,scale=1,label='',mode='room',progress=0,patient=0,question=0,patientX=530,patientY=980,patientScale=1}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g transform="translate(540 960) scale(1.8) translate(-540 -960)">
    <rect x={-450} y={-400} width={1980} height={2720} fill={C.mist}/>
    <path d="M0 1360 1080 1140V1920H0Z" fill="#cbd8cf"/>
    <path d="M65 190H936V1140H65Z" fill={C.white} stroke={C.shade} strokeWidth={14}/>
    <path d="M83 864 327 829 327 502 524 502 524 733 697 733 697 623 917 623V1118H83Z"
      fill="#bed1c9" opacity={.52}/>
    {mode==='reveal' && <g>
      <path d={`M65 204H${490-bound(progress)*425}V1127H65Z`} fill={C.shade}/>
      <path d={`M${490+bound(progress)*446} 204H936V1127H${490+bound(progress)*446}Z`} fill={C.shade}/>
    </g>}
    <path d="M490 204V1127M77 686H925" stroke={C.paper} strokeWidth={18}/>
    <path d="M20 1196H981" stroke={C.muted} strokeWidth={8}/>
    </g>
    {mode==='waiting' && <g transform={`translate(${patientX} ${patientY}) scale(${patientScale})`}>
      <path d="M0 67V0Q0-24 22-24H148Q170-24 170 0V67M-18 67H187M10 67V158M155 67V158"
        fill="none" stroke={C.muted} strokeWidth={16} strokeLinecap="round"/>
      <g>
        <circle cx={64} cy={-142} r={39} fill="#bc866b" stroke={C.ink} strokeWidth={4}/>
        <path d="M22-91Q66-112 106-70L116 43 161 82 164 163H128L111 107 47 64 12-48Z"
          fill={C.mint} stroke={C.ink} strokeWidth={5}/>
        <path d="M45 64 5 102-5 163H-38L-32 76 3 28" fill={C.ink}/>
        <path d="M108-57 145-2 175 12" fill="none" stroke="#bc866b" strokeWidth={19} strokeLinecap="round"/>
      </g>
      <g transform="translate(100 -278)">
        <circle r={69} fill={C.white} stroke={C.muted} strokeWidth={5} strokeDasharray="10 9"/>
        <text x={0} y={24} textAnchor="middle" fontFamily={FONT.display} fontSize={77}
          fill={C.ink} opacity={bound(question)}>?</text>
      </g>
      <path d={`M${-80+bound(patient)*390} -367H345V194H${-80+bound(patient)*390}Z`}
        fill={C.mist} opacity={1-bound(patient)}/>
    </g>}
    <Caption label={label} x={89} y={390} width={792} size={44}/>
  </g>;
