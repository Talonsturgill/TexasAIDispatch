import React from 'react';
import {FONT, wrapToWidth} from './type';

// Original explanatory drawings. Spectral curves and light colours are conceptual, not measured data.
const C={ink:'#211b31',paper:'#eee5cf',white:'#fff9e9',muted:'#aa9dba',plum:'#675172',mint:'#78cab6',gold:'#dfaf62',rust:'#c77b63',line:'#3e334b'};
type P={date?:string;x?:number;y?:number;scale?:number;label?:string;mode?:string;progress?:number;secondary?:number;tertiary?:number;frame?:number;entry_dx?:number;travel_x?:number};
const Label=({text,y=0,color=C.paper,size=32}:{text:string;y?:number;color?:string;size?:number})=><g fontFamily={FONT.body} fontWeight={700}>{wrapToWidth(text,700,size).map((t,i)=><text key={i} x={0} y={y+i*(size+9)} fill={color} fontSize={size}>{t}</text>)}</g>;
const Dish=({x=0,y=0,mark=C.gold,liquid=false}:{x?:number;y?:number;mark?:string;liquid?:boolean})=><g transform={`translate(${x} ${y})`}>
 <ellipse cy={55} rx={166} ry={53} fill={C.ink} opacity={.3}/><path d="M-166 0 Q-166 110 0 118 Q166 110 166 0" fill={C.muted} stroke={C.ink} strokeWidth={7}/><ellipse rx={166} ry={81} fill={C.white} stroke={C.ink} strokeWidth={7}/><ellipse cy={-3} rx={144} ry={64} fill={C.paper}/>
 {liquid?<path d="M-110 -12 Q-55 -37 0 -15 T115 -9 M-82 22 Q-10 2 84 26" fill="none" stroke={C.white} strokeWidth={8}/>:Array.from({length:52},(_,i)=><ellipse key={i} cx={Math.cos(i*2.399)*Math.sqrt(i/52)*129} cy={Math.sin(i*2.399)*Math.sqrt(i/52)*54-5} rx={4+(i%4)} ry={2+(i%2)} fill={i%4===0?C.white:C.muted} opacity={i%4===0?.9:.35}/>)}
 <path d="M-53 84 Q0 100 54 83 L50 112 Q0 129 -50 112Z" fill={mark}/><path d="M-127 36 l12 7 M115 47 l-9 6" stroke={C.white} strokeWidth={4}/></g>;
const Head=({x=0,y=0}:{x?:number;y?:number})=><g transform={`translate(${x} ${y})`}>
 <path d="M-72 -230 H72 L82 -61 Q82 -19 44 0 H-44 Q-82 -19 -82 -61Z" fill={C.plum} stroke={C.ink} strokeWidth={8}/><path d="M-52 -213 H50 V-70 L32 -35 H-32 L-52 -70Z" fill={C.muted}/><rect x={-42} y={-84} width={84} height={61} rx={17} fill={C.ink}/><ellipse cy={2} rx={32} ry={12} fill={C.mint} stroke={C.ink} strokeWidth={4}/><path d="M-110 -230 H110 V-196 H-110Z" fill={C.line}/><path d="M-43 -157 h40 M37 -185 l-6 16" stroke={C.paper} strokeWidth={5}/></g>;
export const PowderSample: React.FC<P>=({x=0,y=0,scale=1,label='Sample',mode='powder',progress=0,secondary=0,entry_dx=0})=><g transform={`translate(${x+entry_dx*(1-progress)} ${y}) scale(${scale})`}>
 <Dish liquid={mode==='unknown'} mark={mode==='unknown'||mode==='sort'?C.plum:C.gold}/>{mode==='pair'&&<g transform={`translate(${370} 0)`}><Dish mark={C.mint}/></g>}
 {label&&<g transform="translate(-165 180)"><Label text={label} size={31}/></g>}
 {mode==='unknown'&&<g opacity={secondary}><path d="M-60 -8 Q-37 -58 12 -50 Q65 -45 49 -4 Q44 13 11 26 V42" fill="none" stroke={C.plum} strokeWidth={12}/><circle cx={11} cy={64} r={7} fill={C.plum}/></g>}</g>;
export const ContactSensor: React.FC<P>=({x=0,y=0,scale=1,label='Contact sensor',progress=0,secondary=0,tertiary=0,travel_x=0})=><g transform={`translate(${x+travel_x*tertiary} ${y-90*Math.sin(Math.PI*tertiary)}) scale(${scale})`}>
 <path d="M0 -220 C-210 -390 240 -350 300 -470" fill="none" stroke={C.line} strokeWidth={31}/><path d="M0 -220 C-210 -390 240 -350 300 -470" fill="none" stroke={C.muted} strokeWidth={10}/>
 <g transform={`translate(0 ${-125*(1-progress)})`}><Head/><ellipse cy={8} rx={70*secondary} ry={24*secondary} fill={C.mint} opacity={.25}/></g>
 <g opacity={secondary} transform="translate(105 -164)">{[.85,.38,.65,.24,.76].map((h,i)=><rect key={i} x={i*22} y={-65*h} width={12} height={65*h} rx={4} fill={C.mint}/>)}</g>
 {label&&<g transform="translate(-155 -385)"><Label text={label} size={29}/></g>}</g>;
export const AbsorptionBands: React.FC<P>=({x=0,y=0,scale=1,label='Light response illustrated',progress=0,secondary=0,tertiary=0})=>{
 const colors=[C.gold,C.rust,C.mint,C.muted,C.paper]; const levels=[.9,.28,.66,.15,.78];
 return <g transform={`translate(${x} ${y}) scale(${scale})`}>
 <path d="M-325 -95 Q-90 -170 330 -80 L330 185 Q60 258 -325 170Z" fill={C.paper} stroke={C.ink} strokeWidth={8}/>
 <path d="M-325 170 Q60 258 330 185 V220 Q0 290 -325 205Z" fill={C.line}/><path d="M-72 224 Q0 244 73 226 V260 Q0 279 -72 260Z" fill={C.gold}/>
 {colors.map((c,i)=>{const xx=-245+i*120;return <g key={c}><path d={`M${xx-80} -375 L${xx} -110`} fill="none" stroke={c} strokeWidth={21} strokeDasharray={`${progress*300} 500`}/><circle cx={xx} cy={-90} r={10+secondary*15} fill={c} opacity={progress}/><path d={`M${xx} -60 V${-60+170*secondary}`} stroke={c} strokeWidth={21} opacity={(1-levels[i])*secondary}/><path d={`M${xx} -107 L${xx+60} ${-107-260*tertiary}`} stroke={c} strokeWidth={17} opacity={levels[i]*tertiary}/></g>})}
 <g transform="translate(-330 350)"><Label text={label}/></g>
 </g>;
};
export const SpectralComparison: React.FC<P>=({x=0,y=0,scale=1,label='Conceptual signatures',mode='compare',progress=0,secondary=0,tertiary=0})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <g transform={`translate(-195 ${-22*tertiary}) scale(.69)`}><Dish/></g><g transform={`translate(195 ${22*tertiary}) scale(.69)`}><Dish mark={mode==='unknown'?C.plum:C.mint} liquid={mode==='unknown'}/></g>
 {[-1,1].map((side,i)=><g key={side} transform={`translate(${side*195-148} 170)`}><path d="M0 120 H292 M0 0 V120" fill="none" stroke={C.muted} strokeWidth={3}/><path d={i===0?'M0 93 Q25 105 40 55 T88 75 T142 35 T206 83 T292 23':'M0 61 Q22 38 44 76 T100 21 T157 81 T222 42 T292 66'} fill="none" stroke={i===0?C.gold:C.mint} strokeWidth={8} pathLength={1} strokeDasharray={`${i===0?progress:secondary} 1`}/></g>)}
 {mode==='unknown'?<g opacity={tertiary}><path d="M85 360 H290 V445 H85Z" fill="none" stroke={C.muted} strokeWidth={5} strokeDasharray="13 10"/><text x={185} y={415} fill={C.paper} fontFamily={FONT.body} fontSize={32} textAnchor="middle">Unknown</text><g transform={`translate(${(1-tertiary)*250} 0)`}><path d="M-342 346 H-42 V457 H-342Z" fill={C.white} stroke={C.ink} strokeWidth={5}/><text x={-320} y={389} fill={C.plum} fontFamily={FONT.body} fontSize={27}>Labeled example</text><text x={-320} y={430} fill={C.ink} fontFamily={FONT.body} fontSize={31}>Whipping cream</text></g></g>:<g opacity={tertiary} fontFamily={FONT.body} fontSize={35} fontWeight={700}><text x={-195} y={391} fill={C.gold} textAnchor="middle">Sugar</text><text x={195} y={391} fill={C.mint} textAnchor="middle">Flour</text></g>}
 <g transform="translate(-340 -150)"><Label text={label}/></g>
 </g>;
export const FeasibilityBench: React.FC<P>=({x=0,y=0,scale=1,label='Application testing',mode='test',progress=0,secondary=0,tertiary=0})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <path d="M-360 125 H370 V166 H-360Z" fill={C.paper} stroke={C.ink} strokeWidth={7}/><path d="M-315 166 V460 M324 166 V460" stroke={C.line} strokeWidth={22}/><path d="M-296 144 l54 -4 M180 149 l45 -3" stroke={C.rust} strokeWidth={4}/>
 <g transform={`translate(${-120+65*progress} 68) scale(.64)`}><Dish mark={mode==='unknown'||mode==='sort'?C.plum:C.gold} liquid={mode==='unknown'||mode==='sort'}/></g>
 <g transform={`translate(${-120+65*progress} ${70-130*(1-secondary)}) scale(.63)`}><Head/></g>
 {mode==='sort'&&<g>
  {/* Editorial testing barrier rises into the proposed reach; the hand approaches and halts against it. */}
  <rect x={55} y={125-270*Math.min(1,tertiary*2)} width={24} height={270*Math.min(1,tertiary*2)} fill={C.rust} stroke={C.ink} strokeWidth={4}/>
  <g transform={`translate(${250-101*Math.max(0,(tertiary-.5)*2)} ${100-55*progress})`}><path d="M-60 -110 H65 V-38 M-60 -38 V-110" fill="none" stroke={C.muted} strokeWidth={21}/><path d="M-62 -40 l32 20 M65 -40 l-32 20" stroke={C.mint} strokeWidth={16}/></g>
  <path d="M85 200 H286 V302 H85Z" fill="none" stroke={C.muted} strokeWidth={5} strokeDasharray="13 9"/><text x={186} y={262} textAnchor="middle" fontFamily={FONT.body} fontSize={27} fill={C.muted}>Test first</text>
 </g>}
 {mode!=='sort'&&<g transform={`translate(${180+(1-tertiary)*160} -95)`} opacity={tertiary}><path d="M-70 -90 H75 L110 -55 V160 H-70Z" fill={C.white} stroke={C.ink} strokeWidth={5}/><path d="M-36 -42 H61 M-36 -15 H74" stroke={C.muted} strokeWidth={7}/><rect x={-38} y={32} width={43} height={43} fill="none" stroke={C.plum} strokeWidth={5}/><text x={-43} y={120} fill={C.plum} fontSize={25} fontFamily={FONT.body}>Test</text></g>}
 <g transform="translate(-350 -340)"><Label text={label}/></g></g>;
export const AustinLabEvidence: React.FC<P>=({x=0,y=0,scale=1,label='Austin',date='September 17th',progress=0,secondary=0,tertiary=0})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <rect x={-360} y={-220} width={720} height={410} rx={8} fill={C.paper}/>
 <path d="M-360 110 Q-220 42 -120 111 T80 110 T360 95 V190 H-360Z" fill={C.muted}/>
 <path d="M-250 150 L-236 -10 M-236 47 l-67 -42 M-237 28 l58 -45" stroke={C.plum} strokeWidth={12}/><path d="M-346 0 Q-332 -64 -270 -39 Q-278 -88 -208 -65 Q-144 -86 -116 -30 Q-126 31 -201 9 Q-260 47 -299 5Z" fill={C.plum}/>
 <path d="M-360 -220 H360 V190 H-360Z M-14 -220 V190" stroke={C.line} strokeWidth={23} fill="none"/>
 <g transform={`translate(${45+(1-progress)*400} 70)`}><path d="M-15 0 H298 V233 H-15Z" fill={C.white} stroke={C.ink} strokeWidth={5}/><text x={14} y={55} fill={C.ink} fontFamily={FONT.body} fontWeight={800} fontSize={38}>Si-Ware</text><text x={14} y={101} fill={C.plum} fontFamily={FONT.body} fontSize={31}>Austin office</text><path d="M14 128 H266" stroke={C.rust} strokeWidth={7}/><text x={14} y={177} fill={C.ink} fontFamily={FONT.body} fontSize={28}>{date}</text></g>
 <g opacity={secondary} transform="translate(-318 355)"><Label text={label} size={36}/></g>
 </g>;

export const SpectralSurface: React.FC<P>=({x=0,y=0,mode='wall'})=><g transform={`translate(${x} ${y})`}>{mode==='wall'?<g><rect x={-100} y={-100} width={1280} height={2150} fill={C.ink}/><path d="M95 395 H990" stroke={C.plum} strokeWidth={2}/></g>:mode==='worktop'?<g><path d="M-140 1500 L80 1280 H1080 L1240 1500Z" fill={C.line}/><path d="M80 1280 H1080" stroke={C.plum} strokeWidth={9}/></g>:<g><path d="M-140 1500 H1260 V1532 H-140Z" fill={C.plum}/><path d="M120 1510 l90 -3 M590 1513 l150 5 M1025 1508 l43 6" stroke={C.muted} strokeWidth={3}/></g>}</g>;

export const TrainingExample: React.FC<P>=({x=0,y=0,scale=1,label='Unknown sample needs teaching',progress=0,secondary=0,tertiary=0})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <g transform={`translate(${-185+60*progress} ${80-30*progress}) scale(.8)`}><Dish liquid mark={C.plum}/></g>
 <path d="M-127 -56 V-180 H227 V-56" fill="none" stroke={C.muted} strokeWidth={7}/>
 <path d="M-127 -56 V-180 H227 V-56" fill="none" stroke={C.mint} strokeWidth={12} pathLength={1} strokeDasharray={`${secondary} 1`}/>
 <path d="M80 -56 H376 V226 H80Z" fill={C.line} stroke={C.muted} strokeWidth={4}/><text x={229} y={28} fill={C.paper} fontFamily={FONT.body} fontSize={36} textAnchor="middle">Unknown</text>
 <path d="M118 78 H338 V177 H118Z" fill="none" stroke={C.muted} strokeWidth={4} strokeDasharray="12 9"/>
 <g transform={`translate(${(1-tertiary)*-315} ${(1-tertiary)*295})`} opacity={Math.min(1,tertiary*4)}><path d="M112 71 H344 V187 H112Z" fill={C.white} stroke={C.ink} strokeWidth={5}/><text x={230} y={110} textAnchor="middle" fill={C.plum} fontFamily={FONT.body} fontSize={25}>Labeled example</text><text x={230} y={152} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={29}>Whipping cream</text></g>
 <path d="M-250 260 H325" stroke={C.plum} strokeWidth={4}/><g transform="translate(-330 -310)"><Label text={label}/></g><text x={-236} y={322} fill={C.muted} fontFamily={FONT.body} fontSize={30}>Teaching the reference</text>
 </g>;
export const ApplicationRecord: React.FC<P>=({x=0,y=0,scale=1,label='Application test',progress=0})=><g transform={`translate(${x+250*(1-progress)} ${y}) scale(${scale})`} opacity={Math.min(1,progress*4)}>
 <path d="M-170 -190 H135 L182 -142 V214 H-170Z" fill={C.white} stroke={C.ink} strokeWidth={7}/><path d="M135 -190 V-142 H182" fill={C.paper} stroke={C.ink} strokeWidth={4}/><path d="M-128 -78 H130 M-128 -40 H98" stroke={C.muted} strokeWidth={6}/><rect x={-126} y={27} width={60} height={60} fill="none" stroke={C.plum} strokeWidth={6}/><g transform="translate(-130 -115)"><Label text={label} size={29} color={C.ink}/></g><text x={-126} y={152} fill={C.plum} fontFamily={FONT.body} fontSize={30}>Result pending</text>
 </g>;
