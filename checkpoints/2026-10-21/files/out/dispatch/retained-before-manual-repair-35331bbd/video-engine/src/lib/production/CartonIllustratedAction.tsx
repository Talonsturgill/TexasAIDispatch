import React from 'react';
import {useArtDirection} from '../artDirection';

export function illustratedCartonPose(phase:number,a:number,b:number,c:number,withdrawalProgress?:number){
 const withdrawal=phase===2?.08*(b+c):phase===3?.16+(withdrawalProgress===undefined?.65*a+.19*b:.84*withdrawalProgress):phase>3?1:0;
 const lift=phase===3?c:phase>3?1:0;
 const side=phase===0?.2*b+.2*c:phase===1?.4+.25*a+.2*b:phase===2?.85+.15*a:1;
 return {dx:withdrawal*300,dy:withdrawal*140-lift*65,side,front:phase===0?a:1,
  sensorTurn:phase===1?c:phase>1?1:0};
}

/** Authored 2.5D explanation, not footage or a measured Contoro trajectory. */
export const CartonIllustratedAction:React.FC<{phase:number;a:number;b:number;c:number;sceneId:string;withdrawalProgress?:number}>=({phase,a,b,c,sceneId,withdrawalProgress})=>{
 const art=useArtDirection();
 if(!art)throw new Error('Illustrated carton action requires its current art profile');
 if(phase<0||phase>3)throw new Error('Illustrated carton component supports covered-top, approach, two-face grip and withdrawal only');
 const p=art.palette,shot=art.flat_shots?.[sceneId]??{scale:1,x:0,y:0,follow_load:false};
 const {dx,dy,side,front,sensorTurn}=illustratedCartonPose(phase,a,b,c,withdrawalProgress);
 const carton=(x:number,y:number,w:number,h:number,d:number,hero=false)=> <g transform={`translate(${x} ${y})`}>
  <path d={`M0 0L${d} ${-d*.55}H${w+d}L${w} 0Z`} fill={hero?'url(#carton-top)':p.paper} stroke='#8e7454' strokeWidth='2'/>
  <path d={`M${w} 0L${w+d} ${-d*.55}V${h-d*.55}L${w} ${h}Z`} fill={hero?'url(#carton-side)':'#ae9b7b'} stroke='#8e7454' strokeWidth='2'/>
  <rect width={w} height={h} fill={hero?'url(#carton-front)':p.paper} stroke='#8e7454' strokeWidth='2'/>
  <path d={`M${w*.47} 0L${w*.47+d} ${-d*.55}h24L${w*.47+24} 0V${h}h-24Z`} fill='#e6cca0' opacity='.8'/>
  <path d={`M8 6H${w-8}M8 ${h-7}H${w-8}M8 6V${h-7}M${w-8} 6V${h-7}`} fill='none' stroke='#6e5c46' strokeWidth='2' opacity='.4'/>
  <rect width={w} height={h} filter='url(#fiber)' opacity='.11'/>
  {hero&&<g transform={`translate(${w*.11} ${h*.64})`}><rect width='72' height='49' rx='2' fill='#f5eddb'/>
   {[0,5,13,18,22,31,36,44,51].map((x,i)=><rect key={x} x={8+x} y='9' width={i%3===0?3:1.5} height='25' fill='#35444a'/>)}
   <path d='M8 39h48' stroke='#35444a' strokeWidth='2'/></g>}
  <path d={`M18 29h24m-24 8h18m${w-53} ${h-29}h25`} stroke='#6e5c46' strokeWidth='3' opacity='.35'/>
 </g>;
 const cup=(x:number,y:number,sideFace=false)=> <g transform={`translate(${x} ${y})`}>
  <ellipse cx='3' cy='4' rx={sideFace?16:25} ry='27' fill='#a47746' opacity='.4'/>
  <ellipse rx={sideFace?13:22} ry='24' fill='#182c32'/>
  <ellipse rx={sideFace?10:17} ry='19' fill='#51656a' stroke='#dbc895' strokeWidth='3'/>
  <ellipse rx={sideFace?5:8} ry='9' fill='#24383e'/>
 </g>;
 return <svg viewBox='0 0 1080 1920' width='100%' height='100%' style={{position:'absolute',inset:0}} aria-label='Illustrated two-face carton grip and supported withdrawal'>
  <defs>
   <linearGradient id='bay' x2='0' y2='1'><stop stopColor={p.background}/><stop offset='1' stopColor={p.midground}/></linearGradient>
   <linearGradient id='carton-front'><stop stopColor='#dab781'/><stop offset='1' stopColor={p.hero}/></linearGradient>
   <linearGradient id='carton-side'><stop stopColor='#a46e3e'/><stop offset='1' stopColor='#be8d52'/></linearGradient>
   <linearGradient id='carton-top' x2='0' y2='1'><stop stopColor='#e7c99b'/><stop offset='1' stopColor='#d5af73'/></linearGradient>
   <linearGradient id='steel' x2='0' y2='1'><stop stopColor='#a8bbc0'/><stop offset='.3' stopColor='#536b73'/><stop offset='1' stopColor={p.foreground}/></linearGradient>
   <filter id='fiber'><feTurbulence type='fractalNoise' baseFrequency='.48' numOctaves='2' seed='19'/><feColorMatrix type='saturate' values='0'/></filter>
  </defs>
  <rect width='1080' height='1920' fill='url(#bay)'/>
  <path d='M0 1170L1080 995V1920H0Z' fill={p.midground}/>
  {[0,180,360,540,720,900,1080].map(x=><path key={x} d={`M${x} 1920L540 1040`} stroke='#8f8979' strokeWidth='2' opacity='.24'/>)}
  {[1280,1460,1660,1890].map(y=><path key={y} d={`M0 ${y}L1080 ${y-140}`} stroke='#f3e9d3' strokeWidth='2' opacity='.25'/>)}
  {[60,230,400,570,740,910].map(x=><g key={x} opacity='.3'><path d={`M${x} 365V1060`} stroke='#827c6e' strokeWidth='5'/><path d={`M${x+7} 365V1060`} stroke='#faf1d9' strokeWidth='2'/></g>)}
  <g transform={`translate(540 880) scale(${shot.scale}) translate(${-540+shot.x-(shot.follow_load?dx:0)} ${-880+shot.y-(shot.follow_load?dy:0)})`}>
   <path d='M112 1170L802 1260L958 1120L286 1040Z' fill='#34464d' opacity='.2'/>
   <g opacity='.9'>{carton(100,820,165,270,155)}</g>
   <g transform='translate(185 1180)'>
    <path d='M0 30L502 108L690 -70L210 -144Z' fill={p.foreground}/>
    {Array.from({length:11},(_,i)=><g key={i} transform={`translate(${i*43} ${i*6.7})`}><path d='M22 17L206 -135' stroke='#192d35' strokeWidth='29'/><path d='M18 10L202 -142' stroke='#b4c6c8' strokeWidth='18'/><path d='M15 6L199 -146' stroke='#e4e9df' strokeWidth='4'/></g>)}
    <path d='M0 36L490 110M215 -153L704 -72' stroke='#657d84' strokeWidth='14'/>
    <path d='M30 48V138m425 -25v88' stroke={p.foreground} strokeWidth='24'/>
   </g>
   <path d='M960 1320V795H874V1265' fill='url(#steel)' stroke='#31474f' strokeWidth='4'/>
   <g>
    <path d='M900 820L845 755V710' fill='none' stroke='#253f48' strokeWidth='18' strokeLinejoin='round'/>
    <circle cx='845' cy='710' r='21' fill='url(#steel)' stroke='#253f48' strokeWidth='5'/>
    <g transform={`translate(825 710) rotate(${-28*sensorTurn})`}>
     <path d='M-60 -28H32L49 -15V27H-60Z' fill='#29454f' stroke='#17303b' strokeWidth='3'/>
     <path d='M-60 -28H32L49 -15H-43Z' fill='#7f999f'/>
     <path d='M32 -28L49 -15V27L32 15Z' fill='#1c343d'/>
     <rect x='-77' y='-22' width='23' height='44' rx='4' fill='#8aa5ad'/>
     <ellipse cx='-76' rx='10' ry='24' fill='#192e38' stroke='#b0c9cd' strokeWidth='3'/>
     <ellipse cx='-78' rx='6' ry='15' fill='#254e61'/>
     <path d='M-80 -10L-77 -5' stroke='#d6e9e6' strokeWidth='3'/>
     <path d='M-25 -8H20m-45 10h45m-45 10h45' stroke='#718b94' strokeWidth='3'/>
    </g>
   </g>
   <g transform={`translate(${dx} ${dy})`}>
    <path d='M245 1110L526 1160L695 1043L416 1000Z' fill='#4b4d43' opacity='.2'/>
    {carton(265,820,260,270,155,true)}
    {/* Contact assemblies stay with the conserved load after engagement. */}
    <g transform={`translate(${-54*(1-front)} ${18*(1-front)})`}>
     <path d={`M340 982H${920-dx}V${1180-dy}`} fill='none' stroke='#172f38' strokeWidth='29' strokeLinejoin='round'/>
     <path d={`M340 972H${920-dx}`} fill='none' stroke='#7c979d' strokeWidth='5'/>
     <rect x='323' y='884' width='130' height='160' rx='18' fill='none' stroke='#152d36' strokeWidth='20'/>
     <rect x='320' y='880' width='130' height='160' rx='18' fill='none' stroke='url(#steel)' strokeWidth='16'/>
     {cup(330,890)}{cup(440,890)}{cup(330,1030)}{cup(440,1030)}
     <path d='M354 900v118m62 -118v118' stroke='#627c84' strokeWidth='9'/>
    </g>
    <g transform={`translate(${72*(1-side)} ${-22*(1-side)})`}>
     <path d={`M614 898L${875-dx} ${818-dy}V${1190-dy}`} fill='none' stroke='#243c45' strokeWidth='26' strokeLinejoin='round'/>
     <path d='M552 875L654 815V966L552 1024Z' fill='none' stroke='url(#steel)' strokeWidth='12'/>
     {cup(555,873,true)}{cup(652,817,true)}{cup(555,1020,true)}{cup(652,964,true)}
    </g>
   </g>
   {/* The packed stack occludes the top until the same load clears it. */}
   <g opacity='.96'>{carton(100,550,425,270,155)}{carton(100,300,425,250,155)}</g>
  </g>
 </svg>;
};
