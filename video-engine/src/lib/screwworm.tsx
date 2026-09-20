import React from 'react';
import {FONT} from './type';
const C={ink:'#142e34',paper:'#efe8d4',teal:'#35b8b0',coral:'#d97559',soil:'#b39a69',leaf:'#637977'};
type P={label?:string;mode?:string;a?:number;b?:number;c?:number;frame?:number;date?:string};
// Magnified biological diagram. Color distinguishes roles, not natural sex coloration.
const Fly=({x,y,s=1,sterile=true,wing=0}:{x:number;y:number;s?:number;sterile?:boolean;wing?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
 <path d="M-18 15L-62 42M-16 35L-61 75M-12 52L-45 99M18 15L62 40M16 35L63 77M12 52L46 101" fill="none"/>
 <ellipse cx={-42} cy={14} rx={29} ry={70} fill="#e5eddb" fillOpacity={.8} transform={`rotate(${-39-wing} -42 14)`}/><ellipse cx={42} cy={14} rx={29} ry={70} fill="#e5eddb" fillOpacity={.8} transform={`rotate(${39+wing} 42 14)`}/>
 <path d="M-57 -27L-26 42M57 -27L26 42" strokeWidth={2}/>
 <ellipse cy={48} rx={25} ry={53} fill={sterile?C.teal:C.coral}/><path d="M-20 35Q0 47 20 35M-22 56Q0 66 22 56M-16 77Q0 85 16 77" fill="none" strokeWidth={3}/>
 <ellipse cy={-4} rx={30} ry={36} fill={sterile?C.teal:C.coral}/><path d="M-11 -27L-9 20M4 -30L6 22M17 -20L18 15" strokeWidth={3}/><ellipse cy={-39} rx={30} ry={21} fill={C.ink}/><ellipse cx={-21} cy={-40} rx={13} ry={19} fill="#ca6754"/><ellipse cx={21} cy={-40} rx={13} ry={19} fill="#ca6754"/><path d="M-7 -55L-12 -70M7 -55L15 -68"/>
 </g>;
const Egg=({x,y,opacity=1}:{x:number;y:number;opacity?:number})=><g transform={`translate(${x} ${y})`} opacity={opacity}><ellipse rx={15} ry={37} fill={C.paper} stroke={C.ink} strokeWidth={4}/><path d="M-4 -25Q-10 0 -4 25" fill="none" stroke="#b4ae98" strokeWidth={3}/></g>;
const Caption=({label='',y=1120}:{label?:string;y?:number})=><text x={465} y={y} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={42} fontWeight={800}>{label}</text>;
const Land=({weather=0,history=0,target=0,habitat=1,targetX=594}:{weather?:number;history?:number;target?:number;habitat?:number;targetX?:number})=><g>
 <path d="M92 535L570 345L889 575L410 834Z" fill="#d3c4a2" stroke={C.ink} strokeWidth={6}/><path d="M92 535L410 834L410 926L92 632Z" fill="#9f895c" stroke={C.ink} strokeWidth={5}/><path d="M410 834L889 575L889 671L410 926Z" fill="#b19d72" stroke={C.ink} strokeWidth={5}/>
 <path d="M160 544Q310 596 425 730M316 454Q411 549 577 652M579 405Q655 460 760 579" fill="none" stroke="#eae4cf" strokeWidth={12}/>
 {[0,1,2,3,4].map(i=><g key={i} transform={`translate(${220+i*120} ${530+(i%2)*115}) scale(${.05+.95*habitat})`}><path d="M0 0L-6 -65M-5 -32L-29 -47M-5 -42L21 -63" stroke={C.ink} strokeWidth={7}/><path d="M-46 -57Q-54 -88 -19 -85Q-3 -119 16 -89Q49 -90 43 -58Q3 -39 -46 -57" fill={C.leaf} stroke={C.ink} strokeWidth={4}/></g>)}
 <g opacity={weather}><circle cx={710-weather*42} cy={285+weather*18} r={54} fill="#d7a653"/>{[0,1,2,3,4].map(i=><path key={i} d={`M${180+i*54} ${175+i%2*35+weather*115}l-18 54`} stroke="#559497" strokeWidth={10} strokeLinecap="round"/>)}</g>
 <g opacity={history}>{[0,1,2].map(i=><circle key={i} cx={353+i*123} cy={420+i%2*80+140*history} r={15} fill={C.coral} stroke={C.ink} strokeWidth={4}/>)}</g>
 <ellipse cx={targetX} cy={622} rx={125*target} ry={62*target} fill={C.teal} fillOpacity={.27} stroke={C.teal} strokeWidth={9}/>
 </g>;
const Gate=({closed=0,x=165,y=908}:{closed?:number;x?:number;y?:number})=><g transform={`translate(${x} ${y})`} stroke={C.ink} strokeWidth={8} fill="none"><path d="M0 -95V90M500 -95V90"/><g transform={`scale(${.06+.94*closed} 1)`}><rect x={0} y={-65} width={495} height={125} rx={6} fill="#cabf9e"/><path d="M0 -20H495M0 26H495M95 -65V60M215 -65V60M345 -65V60"/></g></g>;
const Trailer=({x=120,y=560,s=1}:{x?:number;y?:number;s?:number})=><g transform={`translate(${x} ${y}) scale(${s})`} stroke={C.ink} strokeWidth={6}><path d="M0 0H190L210 28V124H0Z" fill="#c1c3b3"/><path d="M10 19H180M10 42H190M10 65H190M10 88H190"/><path d="M210 107H250L270 57H344L376 101V140H210Z" fill={C.coral}/><path d="M277 67H330L356 99H262Z" fill="#7eaaac"/><circle cx={48} cy={139} r={25} fill={C.ink}/><circle cx={154} cy={139} r={25} fill={C.ink}/><circle cx={306} cy={146} r={27} fill={C.ink}/><path d="M15 113H196" stroke="#e4dfc9"/></g>;
export const ScrewwormCycle: React.FC<P>=({label='Illustrated cycle',mode='release',a=0,b=0,frame=0})=>{
 const second=mode==='cycle';const wings=Math.sin(frame*.65)*3;
 return <g><g opacity={second?0:1}><path d="M126 675H381L364 1002H140Z" fill="#b7baaa" stroke={C.ink} strokeWidth={7}/><path d={`M126 ${675-a*128}H381L365 ${700-a*128}H138Z`} fill="#e2ddc6" stroke={C.ink} strokeWidth={7}/><path d="M180 900H330M181 924H305" stroke={C.ink} strokeWidth={5}/><Fly x={255+a*130-b*35} y={835-a*340-b*35} s={.8+b*.4} wing={wings}/><Fly x={286+a*170} y={865-a*400} s={.42} wing={wings}/></g>
 {second&&<Fly x={350+a*70} y={460} s={1.2} wing={wings}/>}<Fly x={second?670-a*90:770-b*100} y={second?460:550-b*90} s={second?1.2:.92+b*.28} sterile={false} wing={wings}/>
 <text x={250} y={second?310:1088} fontFamily={FONT.body} fontSize={31} fontWeight={750} textAnchor="middle" fill={C.ink}>{second?"STERILE MALE":label.toUpperCase()}</text><text x={690} y={310} opacity={second?1:0} fontFamily={FONT.body} fontSize={31} fontWeight={750} textAnchor="middle" fill={C.ink}>WILD FEMALE</text>
 {second&&<g><path d="M425 619Q485 655 555 620L555 721" fill="none" stroke={C.ink} strokeWidth={7} strokeDasharray="450" strokeDashoffset={450*(1-a)}/><g opacity={a}>{[0,1,2,3,4].map(i=><Egg key={i} x={430+i*43} y={780+i%2*15}/>)}</g><path d="M540 850V945" stroke={C.coral} strokeWidth={8} strokeDasharray="95" strokeDashoffset={95*(1-b)}/><path d={`M${465+75*(1-b)} 947H${615-75*(1-b)}`} stroke={C.coral} strokeWidth={13}/><text x={540} y={1010} opacity={b} fill={C.ink} textAnchor="middle" fontFamily={FONT.body} fontSize={38} fontWeight={800}>NO NEXT GENERATION</text></g>}
 {!second&&<text x={695} y={710} fontFamily={FONT.body} fontSize={29} fill={C.ink} textAnchor="middle">WILD FEMALE</text>}
 {second&&<Caption label={label}/>}
 </g>;
};
export const ScrewwormForecast: React.FC<P>=({label='Forecast clues',mode='question',a=0,b=0,c=0,frame=0})=><g>
 <g transform={`translate(0 ${mode==='question'?(1-a)*180:0}) translate(0 620) scale(1 ${mode==="question"?.12+.88*a:1}) translate(0 -620)`}><Land targetX={mode==="question"?330+b*264:594} habitat={mode==="inputs"?a:1} weather={mode==='inputs'?b:0} history={mode==='inputs'?c:0} target={mode==='inputs'?c:b}/></g>
 <Fly x={mode==='question'?420+a*310:730} y={mode==='question'?460-a*60:360} s={mode==='question'?1.2-a*.7:.5} wing={Math.sin(frame*.6)*3}/>{mode==='question'&&<g opacity={1-a}><Fly x={580+a*165} y={460-a*85} s={1.2-a*.8} sterile={false}/></g>}
 {mode==='inputs'&&<g fill={C.ink} fontFamily={FONT.body} fontSize={29} fontWeight={750}><text x={115} y={1015} opacity={a}>HABITAT</text><text x={369} y={1015} opacity={b}>WEATHER</text><text x={610} y={1015} opacity={c}>PAST OUTBREAKS</text></g>}
 <Caption label={label}/><text x={465} y={1180} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={32}>Model illustration. No live forecast.</text></g>;
export const ScrewwormResearch: React.FC<P>=({label='Kerrville',date='',a=0,b=0})=><g>
 <path d="M40 1080L861 970L907 1094L84 1205Z" fill="#aa9067" stroke={C.ink} strokeWidth={7}/>
 <g transform={`translate(${(1-a)*470} 0) rotate(-5 575 605)`}><path d="M324 283H745L810 347V931H324Z" fill="#f8f1de" stroke={C.ink} strokeWidth={7}/><path d="M745 283V347H810" fill="none" stroke={C.ink} strokeWidth={5}/><g fill={C.ink} fontFamily={FONT.body}><text x={369} y={405} fontSize={36} fontWeight={800}>USDA ARS</text><text x={369} y={457} fontSize={30}>{date}</text><text x={369} y={535} fontSize={34} fontWeight={800}>Reported use</text><path d="M369 577H744M369 602H699" stroke="#a8aa98" strokeWidth={10}/></g><g transform="translate(383 657) scale(.36)"><Land target={b} history={1}/></g><Fly x={701} y={736-b*48} s={.52}/></g>
 <Caption label={label}/></g>;
export const ScrewwormDispatch: React.FC<P>=({label='Targeted intervention',mode='intervention',a=0,b=0,frame=0})=>mode==='close'?<g>
 <g transform="translate(83 20) scale(.8)"><Land target={1} history={1}/></g>
 <Fly x={190+a*365} y={330+a*210} s={1.3} wing={Math.sin(frame*.65)*3}/>
 <path d="M65 1040H858" stroke="#d2c5a3" strokeWidth={150}/><path d="M65 1040H858" stroke={C.ink} strokeWidth={4} strokeDasharray="30 24"/>
 <Trailer x={110+Math.min(b/.65,1)*175} y={900} s={.86}/>
 <g transform="translate(680 895) rotate(90) scale(.55)"><Gate x={0} y={0} closed={b}/></g>
 <Caption label={label} y={1200}/><text x={465} y={1148} textAnchor="middle" fill={C.ink} fontFamily={FONT.body} fontSize={36} fontWeight={800}>SUSPECT ANIMAL STAYS</text>
 </g>:<g>
 <Land target={1} history={1}/>
 <g transform={`translate(288 ${290+a*230})`} stroke={C.ink} strokeWidth={5}><path d="M0 -75V0"/><path d="M-31 0H31L19 101H-19Z" fill="#e4d6a8"/><path d="M-20 8H20L11 64H-11Z" fill="#476f6b"/></g>
 <g transform={`translate(${85+b*740} ${380-b*110}) rotate(15)`} stroke={C.ink} strokeWidth={5} fill="#eee7ce"><path d="M-91 0L-12 -16L-7 -93H13L24 -16L95 0L24 17L8 80H-8L-11 18Z"/><path d="M-29 -20V20"/></g>
 {[0,1,2,3,4].map(i=><Fly key={i} x={470+i*49} y={340+b*(290+i%2*49)} s={.2} wing={Math.sin(frame*.65)*3}/>)}
 <Caption label={label}/></g>;
export const ScrewwormRoute: React.FC<P>=({label='Inspect before transport',mode='transport',a=0,b=0,c=0})=><g>
 {mode==='transport'?<><path d="M60 610L858 374V793L60 1029Z" fill="#b9a574" stroke={C.ink} strokeWidth={6}/><path d="M80 837L865 606" stroke="#e2dcc5" strokeWidth={102}/><path d="M80 837L865 606" stroke={C.ink} strokeWidth={4} strokeDasharray="29 22"/><g fill={C.teal}>{[0,1,2,3].map(i=><ellipse key={i} cx={208+i*72} cy={710-i*15} rx={160-i*12} ry={191-i*20} opacity={.035+(3-i)*.014}/>)}</g><Trailer x={130+a*375+b*73} y={571-a*119-b*23} s={.78}/><text x={260} y={1060} fill={C.ink} fontFamily={FONT.body} fontSize={29}>ILLUSTRATIVE ESTIMATE</text></>:<><path d="M0 1090Q310 1020 600 1050Q830 1000 1080 1025V1460H0Z" fill="#cbc2a3"/><path d="M30 965L170 886L354 932M30 945L170 866L354 912" fill="none" stroke="#778984" strokeWidth={13}/><Gate closed={c} x={180} y={1120}/></>}
 <Caption label={label} y={mode==='inspect'?330:1150}/>{mode==='inspect'&&<text x={465} y={410} textAnchor="middle" fontSize={34} fontWeight={750} fontFamily={FONT.body} fill={C.ink}>SUSPECTED INFESTATION</text>}</g>;

export const ScrewwormSurface: React.FC<P>=({mode="paper"})=>mode==="paper"?<g><rect width={1080} height={1920} fill="#efe8d4"/>{Array.from({length:45},(_,i)=><path key={i} d={"M0 "+(i*43)+"h1080"} stroke="#dbd3bc" strokeWidth={1}/>)}</g>:mode==="setting"?<g opacity={.32}><path d="M0 1610L176 1550L327 1594L509 1530L731 1573L912 1495L1080 1537V1920H0Z" fill="#637977"/><path d="M0 1690L290 1599L421 1663L632 1607L826 1708L1080 1605V1920H0Z" fill="#a5956d"/></g>:<g fill="#405b5c" fontFamily={FONT.body}><text x={62} y={105} fontSize={25} letterSpacing={2} fontWeight={800}>TEXAS AI DISPATCH</text><text x={62} y={157} fontSize={26}>Kerr County research</text><text x={895} y={157} textAnchor="end" fontSize={34} fontWeight={750}>Illustration</text></g>;
