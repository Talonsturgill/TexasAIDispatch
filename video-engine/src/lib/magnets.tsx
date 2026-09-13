import React from 'react';
import {FONT} from './type';

// Editorial close-ups, not dimensioned equipment replicas. Labels and state belong to the board.
const C = {ink:'#182628',paper:'#eee7d3',sage:'#8daf9c',copper:'#c4814c',red:'#cf664c',white:'#fff9e9',muted:'#91a399'};
const ease=(v:number)=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);};
type P={x?:number;y?:number;scale?:number;frame?:number;label?:string;status?:string;detail?:string;mode?:string};
const T:React.FC<{x:number;y:number;text:string;size?:number;color?:string}>=({x,y,text,size=30,color=C.ink})=><text x={x} y={y} fill={color} fontFamily={FONT.body} fontSize={size} fontWeight={700}>{text}</text>;
const Body:React.FC<P&{children:React.ReactNode}>=({x=0,y=0,scale=1,children})=><g transform={`translate(${x} ${y}) scale(${scale})`}>{children}</g>;
const Crystal:React.FC<{x:number;y:number;r?:number;opacity?:number}>=({x,y,r=85,opacity=1})=><g transform={`translate(${x} ${y})`} opacity={opacity}><path d={`M0,${-r} L${r*.88},${-r*.4} L${r*.7},${r*.7} L${-r*.22},${r} L${-r},0 Z`} fill={C.copper} stroke={C.ink} strokeWidth={5}/><path d={`M0,${-r} L${r*.08},${r*.08} L${r*.7},${r*.7} M${r*.08},${r*.08} L${-r},0 M${r*.08},${r*.08} L${r*.88},${-r*.4}`} fill="none" stroke={C.white} strokeWidth={3}/></g>;

export const PermanentMotor: React.FC<P>=({frame=0,label='',status='',mode='',...p})=>{
 const reveal=ease((frame-14)/28), angle=frame*3.4;
 return <Body {...p}><g transform="translate(380 360)"><circle r={275} fill={C.ink}/><circle r={240} fill={C.sage} stroke={C.white} strokeWidth={8}/>{Array.from({length:12},(_,i)=><g key={i} transform={`rotate(${i*30})`}><rect x={-22} y={-230} width={44} height={64} rx={12} fill={i%2?C.copper:C.paper} stroke={C.ink} strokeWidth={4}/></g>)}<g transform={`rotate(${angle})`}>{[0,120,240].map(a=><path key={a} transform={`rotate(${a})`} d="M0,-30 C-20,-95 48,-206 112,-161 C178,-111 126,-33 25,10 Z" fill={C.paper} stroke={C.ink} strokeWidth={7}/>)}</g><circle r={42} fill={C.copper} stroke={C.white} strokeWidth={6}/><path d="M-90,-225 L-170,-305 H-295" fill="none" stroke={C.copper} strokeWidth={6} opacity={reveal}/></g><T x={10} y={32} text={label} size={34}/><T x={8} y={735} text={status} size={28}/>{mode==='future'&&<g opacity={ease((frame-80)/35)}><path d="M75,640 H625" stroke={C.red} strokeWidth={6} strokeDasharray="14 10"/><T x={90} y={680} text="MATERIALS MUST BE TESTED" size={28} color={C.red}/></g>}</Body>;
};

export const CandidateLattice: React.FC<P>=({frame=0,label='',status='',mode='',...p})=>{
 const a=ease((frame-8)/42),b=ease((frame-82)/45);
 return <Body {...p}><T x={0} y={24} text={label} size={34}/><g transform="translate(55 120)">{Array.from({length:15},(_,i)=>{const x=(i%5)*124,y=Math.floor(i/5)*134;return <g key={i} transform={`translate(${x+(1-a)*(i%2?160:-180)} ${y+(1-a)*100})`} opacity={.4+a*.6}><path d="M0,0 l110,0 l0,116" fill="none" stroke={C.muted} strokeWidth={4}/><circle r={19+(i%3)*3} fill={i%3===0?C.copper:C.sage} stroke={C.ink} strokeWidth={4}/></g>;})}</g><g transform={`translate(${250+b*130} ${580-b*40})`}><Crystal x={0} y={0} r={90}/></g><path d={`M680,150 V${200+b*355} H530`} fill="none" stroke={C.copper} strokeWidth={7} strokeDasharray="12 8"/><T x={0} y={765} text={status} size={28}/>{mode==='recipe'&&<g transform={`translate(${590-b*290} 630)`} opacity={b}><rect x={0} y={0} width={190} height={90} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4}/><path d="M25,25 H150 M25,45 H120 M25,65 H140" stroke={C.copper} strokeWidth={5}/></g>}</Body>;
};

export const SynthesisBench: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const a=ease((frame-18)/36),b=ease((frame-88)/36);
 return <Body {...p}><T x={0} y={24} text={label} size={34}/><rect x={-45} y={610} width={855} height={40} rx={7} fill={C.ink}/><path d="M-10,655 V820 M730,655 V820" stroke={C.sage} strokeWidth={18}/><g transform="translate(490 120)"><rect x={0} y={0} width={215} height={400} rx={24} fill={C.sage} stroke={C.ink} strokeWidth={7}/><rect x={26} y={74} width={163} height={225} rx={11} fill={C.ink}/><rect x={40} y={91} width={133} height={193} fill={C.copper} opacity={.25+.35*a}/><path d="M26,330 H187" stroke={C.white} strokeWidth={7}/></g><g transform={`translate(${190+a*60} ${195+a*190}) rotate(${-25+a*25})`}><path d="M-70,-90 H70 L55,75 Q0,115 -55,75 Z" fill={C.paper} stroke={C.ink} strokeWidth={6}/><path d="M-45,45 Q0,64 45,45" stroke={C.copper} strokeWidth={18}/></g><g transform={`translate(${325+b*70} ${560-b*10})`}><Crystal x={0} y={0} r={52}/></g><T x={0} y={735} text={status} size={28}/></Body>;
};

export const MagnetMeasure: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const lower=ease((frame-12)/38),trace=ease((frame-85)/45);
 return <Body {...p}><T x={0} y={24} text={label} size={34}/><g transform="translate(245 395)"><ellipse rx={165} ry={57} fill={C.ink}/><path d="M-165,0 V225 Q0,298 165,225 V0" fill={C.sage} stroke={C.ink} strokeWidth={7}/><ellipse cy={225} rx={165} ry={57} fill={C.sage} stroke={C.ink} strokeWidth={7}/><ellipse rx={105} ry={29} fill={C.paper}/><ellipse rx={43} ry={15} fill={C.ink}/><path d={`M0,${-290+lower*185} V${-80+lower*185}`} stroke={C.copper} strokeWidth={10}/><Crystal x={0} y={-58+lower*185} r={32}/></g><g transform="translate(475 295)"><path d="M0,0 V260 H240" fill="none" stroke={C.ink} strokeWidth={5}/><rect x={22} y={25} width={200} height={185} rx={8} fill="none" stroke={C.copper} strokeWidth={5} strokeDasharray="12 10" opacity={.4+trace*.6}/><T x={68} y={147} text="?" size={95} color={C.copper}/><T x={12} y={320} text="MEASURE" size={26}/><T x={12} y={357} text="THEN JUDGE" size={26}/></g><T x={0} y={795} text={status} size={28}/></Body>;
};

export const ResearchGrant: React.FC<P>=({frame=0,label='',status='',detail='',...p})=>{
 const a=ease((frame-9)/35),b=ease((frame-90)/35);
 return <Body {...p}><g transform={`translate(${40+(1-a)*350} 60) rotate(${-7+a*4})`}><path d="M0,0 H550 L650,100 V650 H0 Z" fill={C.paper} stroke={C.ink} strokeWidth={7}/><path d="M550,0 V100 H650" fill={C.sage} stroke={C.ink} strokeWidth={6}/><T x={50} y={105} text="UNIVERSITY" size={37}/><T x={50} y={155} text="OF HOUSTON" size={37}/><path d="M50,195 H575" stroke={C.copper} strokeWidth={8}/><T x={50} y={270} text={label} size={32}/><T x={50} y={328} text={detail} size={30}/><path d="M50,380 H560 M50,410 H480 M50,440 H540" stroke={C.muted} strokeWidth={8}/><g opacity={b} transform="translate(35 508) rotate(-5)"><rect width={560} height={95} rx={4} fill="none" stroke={C.copper} strokeWidth={6}/><T x={35} y={61} text={status} size={31} color={C.copper}/></g></g></Body>;
};

export const CommercialPath: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const a=ease((frame-12)/35),b=ease((frame-90)/40);
 return <Body {...p}><T x={0} y={20} text={label} size={33}/><Crystal x={125+a*150} y={300} r={83}/><path d="M0,405 H660" stroke={C.ink} strokeWidth={8}/><path d="M410,185 V495" stroke={C.red} strokeWidth={12}/><g opacity={.45+b*.55}><path d="M510,235 L740,175 V410 H510 Z" fill={C.sage} stroke={C.ink} strokeWidth={6}/><path d="M545,280 H690 M545,320 H690 M545,360 H690" stroke={C.paper} strokeWidth={8}/></g><T x={8} y={555} text="CANDIDATE" size={25}/><T x={440} y={555} text="POSSIBLE MARKET" size={25}/><T x={0} y={700} text={status} size={28} color={C.red}/></Body>;
};

export const LabWindow: React.FC<P>=({frame=0,...p})=><Body {...p}><rect x={-50} y={0} width={820} height={710} fill="#f1efda" stroke="#799184" strokeWidth={16}/><path d="M-50,475 H770 M345,0 V710" stroke="#799184" strokeWidth={14}/><path d="M-50,545 H770 V710 H-50 Z" fill="#b4c7b2"/><path d={`M650,600 Q${615+Math.sin(frame/45)*3},490 750,470 M680,540 L760,540`} fill="none" stroke="#668674" strokeWidth={22}/><path d="M-50,710 H770" stroke="#526b5d" strokeWidth={24}/></Body>;
export const LabBench: React.FC<P>=({...p})=><Body {...p}><path d="M-140,0 H1000 L1120,70 H-240 Z" fill="#b8aa8b" stroke="#263a33" strokeWidth={5}/><path d="M-230,70 H1110 V100 H-230 Z" fill="#526b5d"/><path d="M70,104 V450 M850,104 V450" stroke="#829d89" strokeWidth={24}/><path d="M200,22 H310 M325,22 H375" stroke="#8e8166" strokeWidth={3}/></Body>;

export const MaterialSupply: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const a=ease((frame-12)/40),b=ease((frame-85)/42);
 return <Body {...p}><T x={0} y={30} text={label} size={32}/><g transform="translate(15 170)"><path d="M0,100 L310,0 L620,100 V470 H0 Z" fill="#d0dccc" stroke={C.ink} strokeWidth={7}/><T x={166} y={120} text="DOMESTIC" size={34}/><path d="M35,160 H585" stroke={C.sage} strokeWidth={4}/><g transform={`translate(${100+a*65} 310)`}><Crystal x={0} y={0} r={67}/></g><path d="M260,310 H460" stroke={C.copper} strokeWidth={7} strokeDasharray={`${b*200} 200`}/><path d="M480,286 L512,310 L480,334" fill="none" stroke={C.copper} strokeWidth={6} opacity={b}/><g transform="translate(485 190)" opacity={.35+b*.65}><path d="M0,0 H88 V220 H0 Z" fill={C.sage} stroke={C.ink} strokeWidth={5}/><path d="M16,26 H70 M16,58 H70 M16,90 H70 M16,122 H70 M16,154 H70" stroke={C.paper} strokeWidth={6}/></g></g><T x={0} y={740} text={status} size={28}/></Body>;
};

export const CompoundRecipe: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const a=ease((frame-12)/40),b=ease((frame-85)/40);
 return <Body {...p}><T x={0} y={28} text={label} size={31}/><g transform="translate(15 120)"><path d="M0,0 H330 V470 H0 Z" fill="#cbd8c8" stroke={C.ink} strokeWidth={6}/><T x={24} y={55} text="COMPOUND AI" size={27}/>{[[70,140],[230,150],[130,290],[270,335]].map(([x,y],i)=><g key={i} opacity={.2+a*.8}><path d={`M160,230 L${x},${y}`} stroke={C.muted} strokeWidth={6}/><circle cx={x} cy={y} r={25} fill={i%2?C.copper:C.paper} stroke={C.ink} strokeWidth={4}/></g>)}<Crystal x={165} y={236} r={67}/></g><path d={`M360,375 H${360+a*70}`} stroke={C.copper} strokeWidth={8}/><g transform={`translate(${415+(1-a)*140} 225)`} opacity={a}><path d="M0,0 H310 V490 H0 Z" fill={C.paper} stroke={C.ink} strokeWidth={6}/><T x={22} y={60} text="SYNTHESIS AI" size={25}/><path d="M25,96 H276" stroke={C.copper} strokeWidth={6}/><g opacity={b}><path d="M75,155 H175 M100,155 V270 L75,330 Q130,352 198,330 L175,270 V155" fill="#d0ddce" stroke={C.ink} strokeWidth={5}/><path d="M40,395 H265 M40,430 H210" stroke={C.copper} strokeWidth={7}/></g><T x={24} y={370} text="POSSIBLE ROUTE" size={22}/></g><T x={0} y={790} text={status} size={26}/></Body>;
};
export const CandidateSpecimen: React.FC<P>=({frame=0,label='',status='',...p})=>{
 const a=ease((frame-14)/34),b=ease((frame-85)/40);
 return <Body {...p}><T x={0} y={30} text={label} size={33}/><g transform={`translate(${165+a*30} 245)`}><Crystal x={0} y={0} r={122}/></g><path d="M400,60 V480" stroke={C.red} strokeWidth={7} strokeDasharray="12 9"/><path d={`M40,420 H${40+b*295}`} stroke={C.copper} strokeWidth={6}/><T x={0} y={515} text={status} size={28}/></Body>;
};
