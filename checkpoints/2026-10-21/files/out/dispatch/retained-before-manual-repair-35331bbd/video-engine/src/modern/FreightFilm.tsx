import React from 'react';
import {FONT} from '../lib/type';
import {useArtDirection} from '../lib/artDirection';
import {requireNarration} from '../lib/direction';
import {ArtSprite} from './StoryArt';
import type {FilmRenderProps} from './types';

const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const travel=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const clauseProgress=(board:FilmRenderProps['board'],id:string,time:number)=>{
 const w=requireNarration(board,id);return travel((time-w.start)/(w.end-w.start));
};
/** One uninterrupted stroke spans the first task clause through the reported
 * facility clause. Shots inspect this global displacement without restarting it.
 * Pixel units describe editorial staging, never measured mileage or speed. */
export function freightDisplacement(board:FilmRenderProps['board'],time:number){
 const start=requireNarration(board,'n1').start,end=requireNarration(board,'n4').end;
 const length=end-start,elapsed=Math.max(0,Math.min(length,time-start));
 const accelerate=Math.min(1.1,length*.2),brake=Math.min(1.8,length*.2);
 const integral=(q:number)=>q*q*q*q*(2.5-3*q+q*q);
 const peak=570/(length-(accelerate+brake)/2);
 if(elapsed<accelerate)return peak*accelerate*integral(elapsed/accelerate);
 if(elapsed<length-brake)return peak*(elapsed-accelerate/2);
 const q=(elapsed-(length-brake))/brake;
 return peak*(length-brake-accelerate/2+brake*(q-integral(q)));
}
const T:React.FC<{x?:number;y:number;children:React.ReactNode;fill:string;size?:number}>=({x=70,y,children,fill,size=44})=>
 <text x={x} y={y} fontFamily={FONT.body} fontSize={size} fontWeight={700} fill={fill}>{children}</text>;
const Truck:React.FC<{x:number;y:number;scale:number;distance:number;ink:string}>=({x,y,scale,distance,ink})=>{
 const angle=distance/56*180/Math.PI;
 return <g transform={`translate(${x} ${y}) scale(${scale})`} data-subject="freight-truck observer" data-distance={distance}>
  <ellipse cx={750} cy={435} rx={718} ry={14} fill={ink} opacity={.18}/>
  <ArtSprite role="hero" slice="truck" x={0} y={0} width={1500} height={444}/>
  {[138,265,391,917,1045,1299].map((cx,i)=><g key={cx}>
   <defs><clipPath id={`wheel-${i}`}><circle cx={cx} cy={375} r={56}/></clipPath></defs>
   <g clipPath={`url(#wheel-${i})`}><g transform={`rotate(${angle} ${cx} 375)`}>
    <ArtSprite role="hero" slice="wheel" x={cx-56} y={319} width={112} height={112}/>
   </g></g>
  </g>)}
 </g>;
};

export const FreightFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Freight film requires executed current art profile');
 const c=ad.palette,d=freightDisplacement(board,time_s),current=board.narration_picture!.clauses.find(r=>time_s>=r.start_s&&time_s<r.end_s);
 const truck=(x:number,y:number,scale:number)=><Truck x={x} y={y} scale={scale} distance={d} ink={c.ink}/>;
 const originAnchor:[number,number]=[-210+d*.57+1323*.57,960+140*.57];
 const yardAnchor:[number,number]=[-265+d*.49+1323*.49,1230-291*.49];
 const cabAnchor:[number,number]=shot.view==='travel-wide'?[-210+d*.61+1323*.61,910+140*.61]:shot.view==='travel-detail'?[-655+d+1323,940]:shot.view==='cab-travel'?[-210+d*.57+1323*.57,1120+140*.57]:shot.view==='departure'?originAnchor:shot.view==='departure-detail'?[originAnchor[0]*1.4-365,originAnchor[1]*1.4-482.4]:['grounded-approach','grounded-contact'].includes(shot.view)?[yardAnchor[0]*1.42-336,yardAnchor[1]*1.42-516.6]:yardAnchor;
 const cab=(x:number,y:number,w:number,h:number)=><g data-subject="observer" data-action="retain-observer" data-detail="same-occupied-cab">
  <path d={`M${x+w} ${y+h*.8}L${x+w+45} ${y+h*.8}L${cabAnchor[0]} ${cabAnchor[1]}`} fill="none" stroke={c.hero} strokeWidth={3} strokeDasharray="10 7"/>
  <rect x={x-12} y={y-42} width={w+24} height={h+78} rx={15} fill={c.ink} opacity={.12} transform="translate(7 9)"/>
  <rect x={x-12} y={y-42} width={w+24} height={h+78} rx={15} fill={c.paper} stroke={c.hero} strokeWidth={4}/>
  <T x={x+6} y={y-14} fill={c.ink} size={22}>Same occupied cab · detail</T>
  <defs><clipPath id="observer-detail-frame"><rect x={x} y={y} width={w} height={h} rx={8}/></clipPath></defs>
  <g clipPath="url(#observer-detail-frame)"><rect x={x} y={y} width={w} height={h} fill={c.background}/><g transform={`translate(${2*x+w} 0) scale(-1 1)`}><ArtSprite role="support" slice="occupiedcab" x={x} y={y} width={w} height={h}/></g></g>
  <T x={x+6} y={y+h+24} fill={c.ink} size={20}>Illustration · observer aboard</T>
 </g>;
 const facility=(x:number,y:number,w=450,h=424)=><g data-subject="customer-facility" data-projection="matched-front-elevation" transform={`translate(${x} ${y}) scale(${w/515} ${h/440})`}>
  <rect width={515} height={440} fill={c.midground}/><defs><clipPath id="front-facade"><rect width={515} height={440}/></clipPath></defs>
  <g clipPath="url(#front-facade)"><g transform="matrix(1 -0.049 0 1 0 26)"><ArtSprite role="support" slice="frontfacade" x={0} y={0} width={515} height={440}/></g></g>
  <rect width={515} height={440} fill="none" stroke={c.foreground} strokeWidth={8}/><path d="M0 440H515" stroke={c.ink} strokeWidth={12}/>
 </g>;
 const road=(y:number)=><g><path d={`M0 ${y}H1080`} stroke={c.foreground} strokeWidth={14}/><path d={`M0 ${y+52}H1080`} stroke={c.paper} strokeWidth={7} strokeDasharray="95 80"/><path d={`M0 ${y+105}H1080`} stroke={c.foreground} strokeWidth={3}/></g>;
 const forward=(scale=.53,y=830)=>truck(-210+d*scale,y,scale);
 const occupiedTask=<>{cab(70,505,300,330)}<T x={615} y={905} fill={c.ink} size={35}>Observer aboard</T></>;
 // A single concrete yard is the destination space, rather than a building
 // pictogram suspended over a separate roadway. Its entrance base and every
 // truck tyre share this immutable ground datum. The cab stops beside the
 // entrance with a visible gap; no docking, cargo or unloading is invented.
 const yardGround=1230,yardScale=.49;
 const yardTruckX=-265+d*yardScale;
 const yard=<g data-mechanism="freight-integrated-facade-observer-v3" data-ground-y={yardGround}>
  <path d={`M0 ${yardGround}H1080V1420H0Z`} fill={c.paper}/>
  <path d={`M0 ${yardGround}H1080M0 ${yardGround+118}H1080M785 ${yardGround}L750 1420M245 ${yardGround}L205 1420`} stroke={c.midground} strokeWidth={3} opacity={.6}/>
  <ellipse cx={913} cy={yardGround+6} rx={134} ry={10} fill={c.ink} opacity={.16}/>
  {facility(780,yardGround-255,270,255)}
  {truck(yardTruckX,yardGround-431*yardScale,yardScale)}
 </g>;
 const approach=(close:boolean)=><g data-action="reach-facility" transform={close?'translate(-336 -516.6) scale(1.42)':''}>{yard}</g>;
 const completed=<>{yard}{cab(70,505,300,330)}</>;
 const assign=clauseProgress(board,'n5a',time_s);
 const coordination=clauseProgress(board,'n5b',time_s);
 const orders=(overhead:boolean)=>{
  const p=assign;
  return <g data-subject="shipment-orders freight-truck" data-action="coordinate-shipments">
   <T y={430} fill={c.ink}>Conceptual shipment assignment</T>
   {[0,1].map(i=>{
    const startX=overhead?170+i*440:115,startY=overhead?585:545+i*255;
    const x=startX+(430-startX)*p,y=startY+(650+i*185-startY)*p;
    return <g key={i} transform={`translate(${x} ${y})`}>
     <path d="M0 0H190L220 30V155H0Z" fill={c.paper} stroke={i?c.accent:c.hero} strokeWidth={5}/>
     <path d="M190 0V30H220M25 78H178M25 112H125" fill="none" stroke={c.midground} strokeWidth={4}/>
     <T x={20} y={49} fill={c.ink} size={26}>{i?'Customer B':'Customer A'}</T>
    </g>;
   })}
   <g data-capacity="conceptual-assignment">
    <rect x={405} y={625} width={275} height={380} rx={12} fill="none" stroke={c.midground} strokeWidth={4}/>
    <path d="M405 810H680" stroke={c.midground} strokeWidth={3}/>
    <T x={415} y={1060} fill={c.ink} size={30}>Capacity assigned</T>
   </g>
   <g data-route="conceptual-connection">
    <path d={`M95 970H${95+285*coordination}V1120H${95+445*coordination}`} fill="none" stroke={c.hero} strokeWidth={6}/>
    <circle cx={95} cy={970} r={13} fill={c.hero}/><T x={70} y={930} fill={c.ink} size={30}>Route</T>
   </g>
   <g transform={`translate(865 815)`} data-time="conceptual-coordination"><circle r={64} fill={c.paper} stroke={c.midground} strokeWidth={5}/><path d={`M0 0L${38*Math.sin(coordination*1.6)} ${-38*Math.cos(coordination*1.6)}M0 0L-24 12`} stroke={c.hero} strokeWidth={5}/></g>
   {yard}
   <T x={770} y={935} fill={c.ink} size={29}>Timing</T>
  </g>;
 };
 const future=()=>{
  const p=clauseProgress(board,'n8',time_s);
  return <g data-subject="future-routes freight-truck" data-action="plan-routes">
   {completed}<T y={385} fill={c.ink}>Additional routes are planned</T>
   <path d={`M380 680Q600 560 ${600+330*p} 545`} fill="none" stroke={c.accent} strokeWidth={7} strokeDasharray="14 14"/>
   <g transform="translate(918 520)"><rect x={-44} y={-35} width={85} height={90} rx={8} fill={c.paper} stroke={c.accent} strokeWidth={5}/><path d="M-25-35V-55A25 25 0 0 1 25-55V-35" fill="none" stroke={c.accent} strokeWidth={6}/></g>
   <T x={825} y={630} fill={c.ink} size={28}>Pending</T>
  </g>;
 };
 const origin=(close:boolean)=><g transform={close?'translate(-365 -482.4) scale(1.4)':''} data-view-world="same-origin-road">
  <ArtSprite role="support" slice="terminalfront" x={70} y={876} width={455} height={330}/>{forward(.57,960)}{road(1206)}
 </g>;
 let pic:React.ReactNode;
 switch(shot.view){
 case 'travel-wide':pic=<><T y={360} fill={c.ink}>Customer freight moves</T>{forward(.61,910)}{road(1175)}{occupiedTask}</>;break;
 case 'travel-detail':pic=<><T y={360} fill={c.ink}>Freight rolls. Someone stays aboard.</T>{truck(-655+d,800,1.0)}{road(1230)}{cab(70,505,300,330)}</>;break;
 case 'cab-travel':pic=<><T y={360} fill={c.ink}>The observer stays aboard</T>{cab(70,505,410,452)}{forward(.57,1120)}{road(1366)}</>;break;
 case 'departure':pic=<><T y={365} fill={c.ink}>Volvo + Waabi + Warp</T><T y={435} fill={c.ink} size={37}>October 5th. Texas customer operations</T>{origin(false)}{cab(70,505,300,330)}</>;break;
 case 'departure-detail':pic=<><T y={365} fill={c.ink}>Customer operations begin</T><T y={435} fill={c.ink} size={36}>October 5th. Volvo, Waabi and Warp</T>{origin(true)}{cab(70,505,300,330)}</>;break;
 case 'grounded-corridor':pic=<><T y={350} fill={c.ink}>Dallas to Houston</T><T y={420} fill={c.ink} size={34}>Conceptual yard. Generic facility.</T>{approach(false)}{cab(70,505,300,330)}</>;break;
 case 'grounded-approach':pic=<><T y={350} fill={c.ink}>Direct to third-party facilities</T>{approach(true)}{cab(70,505,300,330)}</>;break;
 case 'grounded-contact':pic=<><T y={350} fill={c.ink}>The freight arrives beside its destination</T>{approach(true)}{cab(70,505,300,330)}</>;break;
 case 'orders-horizontal':pic=orders(false);break;
 case 'orders-overhead':pic=orders(true);break;
 case 'orders-assigned':pic=orders(variant==='b');break;
 case 'occupied-cab':pic=<><T y={355} fill={c.ink}>The driver seat stays occupied</T>{yard}{cab(70,505,410,452)}</>;break;
 case 'cab-and-trailer':pic=<><T y={355} fill={c.ink}>This service has someone aboard</T>{yard}{cab(70,505,410,452)}</>;break;
 case 'future-routes':pic=future();break;
 case 'future-detail':pic=future();break;
 case 'retained-yard-wide':pic=<><T y={355} fill={c.ink}>Customer freight. Occupied cab.</T>{completed}</>;break;
 case 'retained-yard-cab':pic=<><T y={355} fill={c.ink}>The freight task changes</T><T y={425} fill={c.ink} size={37}>The observer remains aboard</T>{yard}{cab(70,505,300,330)}</>;break;
 default:throw new Error('Unimplemented freight view '+shot.view);
 }
 const f=ad.flat_shots?.[scene.id];
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs><linearGradient id="freight-sky" x2=".3" y2="1"><stop stopColor={c.paper}/><stop offset="1" stopColor={c.background}/></linearGradient></defs>
  <rect width={1080} height={1920} fill="url(#freight-sky)"/><path d="M0 1430H1080V1920H0Z" fill={c.foreground} opacity={.08}/>
  <g data-view={shot.view} data-framing={shot.framing} data-clause={current?.id} data-action={current?.action_id} transform={`translate(${f?.x??0} ${f?.y??0}) scale(${f?.scale??1})`}>{pic}</g>
  <T y={1465} fill={c.ink} size={30}>Illustration. Generic freight task.</T>
 </svg>;
};
