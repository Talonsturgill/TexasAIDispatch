import React from 'react';
import {FONT, widthOf} from '../../../lib/type';
import {useUid} from '../../../lib/uid';

/**
 * TowerCameraHero, the fresh authored hero group for the 2026-10-11 edition.
 *
 * One tall riveted steel lattice communications tower carries the film. It is a three-legged
 * self-supporting tower seen from the ground, with two front legs and a back leg showing through,
 * panel girts that shorten as the tower climbs, X bracing, a climbing ladder on the left leg, a
 * coax bundle down the right leg with one loose loop that leans away in the wind, a small lopsided
 * work platform near the top and three concrete piers at its feet. Rust drips run from a few
 * joints and one girt is slightly bent. At its top a mast holds ONE weathered camera head: a pan
 * base, a rounded housing with a deep lens barrel under a sun hood, a whip antenna and a status
 * lamp. The head turns on the film clock and its lens shows its glass only while it faces the
 * viewer, so a turn reads as a turn at phone size.
 *
 * The same group draws what the camera does: its sweep wedge and the watch ring it leaves on the
 * ground, split into the half behind the tower and the half in front so the lattice occludes the
 * beam correctly; the four corner brackets of the flag box that close on smoke; the one alert
 * card that leaves the head; the pinned tags that carry the few words the film puts on screen;
 * and, for treatment b, the round lens display seen from inside the camera.
 *
 * Light: late afternoon west Texas sun low in the upper left. Upper-left edges carry warm light,
 * right edges fall into cool shade, and every grounded thing casts a long soft shadow to the right.
 * Nothing is symmetric: the legs differ by a few units, the platform hangs further left, the
 * antenna is bent, the tags hang on their own string lengths.
 *
 * Disclosed illustration of the relationship AEP Texas describes. It is not an AEP Texas tower,
 * not a Pano AI product, not a real camera feed or smoke event, and it measures nothing. No logo,
 * mark or real site. Pure function of its props; the episode drives every prop from the film clock.
 */

export type Pal = Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
export type Pt = [number,number];
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const rad=(deg:number)=>deg*Math.PI/180;

/** Galvanised steel under a low warm sun, and the paint and paper the hero carries. */
export const STEEL={lit:'#E3D9C4',mid:'#9AA0A2',shade:'#5D6468',deep:'#3B4044',rust:'#A35E2E',rustDark:'#6B3A1C',zinc:'#B7BCBB'};

/** Tower geometry in its own units: base centre at (0,0), top of the lattice at y=-1000. */
const LEG={fl:[[-64,0],[-13,-1000]] as [Pt,Pt],fr:[[67,0],[15,-1000]] as [Pt,Pt],bk:[[9,0],[2,-1000]] as [Pt,Pt]};
const GIRTS=[0,150,290,418,534,638,732,816,892,960,1000];
export const TOWER={height:1000,mastTop:-1062,head:[1,-1094] as Pt,platformY:-884,
 /** where the coax bundle meets the ground, for a card that travels down it */
 coaxFoot:[52,-26] as Pt, coaxTop:[12,-1040] as Pt};
const legX=(leg:[Pt,Pt],y:number)=>lerp(leg[0][0],leg[1][0],clamp(-y/1000));
/** A point on the coax bundle at share u from the head (0) to the foot (1), in tower units. */
export function coaxPoint(u:number):Pt{
 const y=lerp(-1040,-26,u), x=legX(LEG.fr,y)-7;
 // the loose loop leans out between y -620 and -470
 const loop=y<-470&&y>-620?Math.sin(Math.PI*(-470-y)/150)*26:0;
 return [x+loop,y];
}

// ---- the camera head ---------------------------------------------------------------------------
/** heading: degrees, 0 faces the viewer, 90 points screen-left, 180 away, 270 screen-right. */
const Head:React.FC<{heading:number;lamp?:number;shimmer?:number;time?:number;slot?:number;detail?:boolean}>=
 ({heading,lamp=0,shimmer=0,time=0,slot=0,detail=false})=>{
 const id=useUid('tch');
 const a=rad(heading), c=Math.cos(a), s=Math.sin(a);
 const W=88,D=62,H=54,R=21,L=40;
 const bodyW=W*Math.abs(c)+D*Math.abs(s);
 const lensX=-s*(D/2+ (Math.abs(s)>.01?0:0)), faceX=-s*(bodyW/2-4);
 const barrelLen=L*Math.abs(s);
 const glass=c>0;
 const tipX=faceX-s*L;
 const barrel=<g>
  {/* barrel: a short cylinder seen at an angle, its far end an ellipse */}
  <path d={`M${faceX} ${-R}L${tipX} ${-R}A${R*Math.max(.12,Math.abs(c))} ${R} 0 0 ${s>0?0:1} ${tipX} ${R}L${faceX} ${R}Z`}
   fill={`url(#${id}b)`} stroke={STEEL.deep} strokeWidth={1.4}/>
  {/* sun hood over the barrel, longer than the barrel and lopsided */}
  <path d={`M${faceX+s*6} ${-R-9}L${tipX-s*12} ${-R-7}L${tipX-s*12} ${-R+3}L${faceX} ${-R+1}Z`} fill={STEEL.shade} stroke={STEEL.deep} strokeWidth={1.2}/>
  <path d={`M${faceX+s*6} ${-R-9}L${tipX-s*12} ${-R-7}`} stroke={STEEL.lit} strokeWidth={1.6} opacity={.8}/>
  {glass&&<g>
   <ellipse cx={tipX} cy={0} rx={R*c} ry={R} fill="#14181C" stroke={STEEL.deep} strokeWidth={1.6}/>
   <ellipse cx={tipX} cy={0} rx={R*c*.72} ry={R*.72} fill={`url(#${id}g)`}/>
   <ellipse cx={tipX-R*c*.28} cy={-R*.3} rx={R*c*.22} ry={R*.16} fill="#FFF6E2" opacity={.75}/>
   <path d={`M${tipX+R*c*.2} ${R*.35}q${R*c*.2} ${-R*.1} ${R*c*.3} ${-R*.4}`} stroke="#9FC4D6" strokeWidth={1.4} fill="none" opacity={.6}/>
  </g>}
 </g>;
 const body=<g>
  <rect x={-bodyW/2} y={-H/2} width={bodyW} height={H} rx={17} fill={`url(#${id}h)`} stroke={STEEL.deep} strokeWidth={1.6}/>
  {/* a seam line and a weather streak below it */}
  <path d={`M${-bodyW/2+6} ${-4}Q0 ${-1} ${bodyW/2-7} ${-5}`} stroke={STEEL.deep} strokeWidth={1.1} opacity={.45} fill="none"/>
  <path d={`M${-bodyW*.18} ${-2}l2 ${H*.42}`} stroke={STEEL.rustDark} strokeWidth={2} opacity={.28}/>
  {/* lit upper-left edge */}
  <path d={`M${-bodyW/2+5} ${H/2-14}Q${-bodyW/2+2} ${-H/2+3} ${-bodyW/2+18} ${-H/2+2}`} stroke={STEEL.lit} strokeWidth={2.4} fill="none" opacity={.85}/>
  {/* status lamp: dark until a flag, then the signal colour */}
  <circle cx={-bodyW/2+13} cy={-H/2+11} r={4.2} fill={lamp>0?'#F28A3B':'#4B4F52'} stroke={STEEL.deep} strokeWidth={1}/>
  {lamp>0&&<circle cx={-bodyW/2+13} cy={-H/2+11} r={10} fill="#F6A055" opacity={.35*lamp}/>}
  {/* the card slot on the back of the housing opens when a message leaves */}
  {slot>0&&<rect x={-bodyW*.22} y={-H/2-2} width={bodyW*.44} height={4+4*slot} rx={2} fill="#1C1F22" opacity={.85}/>}
 </g>;
 return <g data-part="camera-head">
  <defs>
   <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#EFE7D6"/><stop offset=".45" stopColor="#C3C4BE"/><stop offset="1" stopColor="#6E7477"/>
   </linearGradient>
   <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#8E9497"/><stop offset=".5" stopColor="#5F6569"/><stop offset="1" stopColor="#363B3F"/>
   </linearGradient>
   <radialGradient id={`${id}g`} cx=".4" cy=".35" r=".8">
    <stop offset="0" stopColor="#3E6C86"/><stop offset=".55" stopColor="#1B3446"/><stop offset="1" stopColor="#0A1219"/>
   </radialGradient>
  </defs>
  {/* pan base and its bearing ring */}
  <rect x={-22} y={H/2-2} width={44} height={18} rx={4} fill={STEEL.shade} stroke={STEEL.deep} strokeWidth={1.4}/>
  <ellipse cx={0} cy={H/2-1} rx={25} ry={6} fill={STEEL.mid} stroke={STEEL.deep} strokeWidth={1.2}/>
  {detail&&[-15,-5,6,16].map((x,i)=><circle key={i} cx={x} cy={H/2+9} r={1.8} fill={STEEL.deep}/>)}
  {/* whip antenna, bent a little from years of wind */}
  <path d={`M${bodyW*.28} ${-H/2}q2 -30 9 -52`} stroke={STEEL.deep} strokeWidth={2.2} fill="none"/>
  <circle cx={bodyW*.28+9} cy={-H/2-52} r={2.6} fill={STEEL.deep}/>
  {glass?<>{body}{barrel}</>:<>{barrel}{body}</>}
  {/* heat shimmer: thin wavering rings around the head while it reads heat */}
  {shimmer>0&&[0,1,2].map(i=>{
   const r=bodyW*.62+i*14, w=Math.sin(time*5.2+i*1.7)*3;
   return <ellipse key={i} cx={lensX*.2} cy={2} rx={r+w} ry={H*.62+i*9-w} fill="none" stroke="#FFE2B8" strokeWidth={2.2-i*.5}
    strokeDasharray="9 7" strokeDashoffset={time*40*(i%2?1:-1)} opacity={.55*shimmer*(1-i*.25)}/>;
  })}
 </g>;
};

// ---- the tower ---------------------------------------------------------------------------------
type TowerProps={heading:number;lamp?:number;shimmer?:number;time?:number;slot?:number;headScale?:number;dusk?:number};
const Tower:React.FC<TowerProps>=({heading,lamp=0,shimmer=0,time=0,slot=0,headScale=1,dusk=0})=>{
 const id=useUid('tct');
 const panels=GIRTS.slice(0,-1).map((g,i)=>({y0:-g,y1:-GIRTS[i+1]}));
 const xl=(y:number)=>legX(LEG.fl,y), xr=(y:number)=>legX(LEG.fr,y), xb=(y:number)=>legX(LEG.bk,y);
 const member=(x1:number,y1:number,x2:number,y2:number,w:number,k:string,col=STEEL.mid)=>
  <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={w} strokeLinecap="round"/>;
 const back=panels.flatMap((p,i)=>[
  member(xl(p.y0)+6,p.y0,xb(p.y1),p.y1,2.4,'bl'+i,STEEL.shade),
  member(xr(p.y0)-6,p.y0,xb(p.y1),p.y1,2.4,'br'+i,STEEL.shade)]);
 const braces=panels.flatMap((p,i)=>{
  // one girt bent a few units, the rest straight
  const bend=i===3?4:0;
  return [member(xl(p.y0),p.y0,xr(p.y1),p.y1,3.4,'x1'+i),member(xr(p.y0),p.y0,xl(p.y1),p.y1,3.4,'x2'+i),
   <path key={'g'+i} d={`M${xl(p.y1)} ${p.y1}Q${(xl(p.y1)+xr(p.y1))/2} ${p.y1+bend} ${xr(p.y1)} ${p.y1}`} stroke={STEEL.mid} strokeWidth={4.2} fill="none"/>,
   <path key={'gl'+i} d={`M${xl(p.y1)} ${p.y1-1.6}L${(xl(p.y1)+xr(p.y1))/2} ${p.y1-1.6+bend}`} stroke={STEEL.lit} strokeWidth={1.4} opacity={.7}/>];
 });
 const leg=(l:[Pt,Pt],w0:number,w1:number,lit:boolean,k:string)=>{
  const [b,t]=l;
  return <g key={k}>
   <path d={`M${b[0]-w0/2} ${b[1]}L${t[0]-w1/2} ${t[1]}L${t[0]+w1/2} ${t[1]}L${b[0]+w0/2} ${b[1]}Z`} fill={lit?`url(#${id}l)`:STEEL.shade} stroke={STEEL.deep} strokeWidth={1.2}/>
   {lit&&<path d={`M${b[0]-w0/2+1.5} ${b[1]}L${t[0]-w1/2+.8} ${t[1]}`} stroke={STEEL.lit} strokeWidth={2.4} opacity={.9}/>}
  </g>;
 };
 // flange joints with a few rust drips
 const joints=GIRTS.slice(1,-1).flatMap((g,i)=>[[xl(-g),-g],[xr(-g),-g]].map(([x,y],j)=>
  <rect key={`j${i}${j}`} x={x-5} y={y-4} width={10} height={8} rx={1.5} fill={STEEL.shade} stroke={STEEL.deep} strokeWidth={.8}/>));
 const drips=[[1,0,38],[3,1,52],[5,0,30],[6,1,44],[2,1,26]].map(([gi,side,len],i)=>{
  const y=-GIRTS[gi], x=side?xr(y)-1:xl(y)+1;
  return <path key={'d'+i} d={`M${x} ${y+3}q${side?-2:2} ${len*.5} ${side?1:-1} ${len}`} stroke={STEEL.rust} strokeWidth={2.6} strokeLinecap="round" opacity={.62} fill="none"/>;
 });
 // the climbing ladder inside the left leg
 const ladder=(()=>{
  const rows:React.ReactNode[]=[];
  const rail=(off:number)=>{const pts=[0,-870].map(y=>[xl(y)+off+(y===0?10:3),y]);return pts;};
  const a=rail(8),b=rail(20);
  rows.push(<path key="ra" d={`M${a[0][0]} ${a[0][1]-18}L${a[1][0]} ${a[1][1]}`} stroke={STEEL.shade} strokeWidth={2}/>);
  rows.push(<path key="rb" d={`M${b[0][0]} ${b[0][1]-18}L${b[1][0]} ${b[1][1]}`} stroke={STEEL.shade} strokeWidth={2}/>);
  for(let y=-30;y>-870;y-=19){const u=-y/870;const x1=lerp(a[0][0],a[1][0],u),x2=lerp(b[0][0],b[1][0],u);
   rows.push(<line key={'r'+y} x1={x1} y1={y} x2={x2} y2={y} stroke={STEEL.mid} strokeWidth={1.4}/>);}
  return rows;
 })();
 const coax=Array.from({length:61},(_,i)=>coaxPoint(i/60));
 const coaxD='M'+coax.map(p=>p.join(' ')).join('L');
 const P=TOWER.platformY;
 return <g data-part="lattice-tower">
  <defs>
   <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor={STEEL.lit}/><stop offset=".35" stopColor={STEEL.zinc}/><stop offset="1" stopColor={STEEL.shade}/>
   </linearGradient>
   <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stopColor="#2B1A12" stopOpacity={.42}/><stop offset="1" stopColor="#2B1A12" stopOpacity={0}/>
   </linearGradient>
  </defs>
  {/* long soft late-afternoon shadow falling right and back across the ground */}
  <path d="M-70 4L60 6L470 -22L350 -27Z" fill={`url(#${id}s)`}/>
  <ellipse cx={4} cy={6} rx={96} ry={10} fill="#2B1A12" opacity={.32}/>
  {back}
  {leg(LEG.bk,8,4,false,'lb')}
  {braces}
  {ladder}
  {/* the coax bundle down the right leg with its loose loop and stand-off clamps */}
  <path d={coaxD} stroke="#1F2326" strokeWidth={5} fill="none" strokeLinejoin="round"/>
  <path d={coaxD} stroke="#4A5156" strokeWidth={1.6} fill="none" transform="translate(-1.4 -.5)"/>
  {[.12,.3,.68,.84].map(u=>{const p=coaxPoint(u);return <rect key={u} x={p[0]-3} y={p[1]-3} width={10} height={6} rx={1} fill={STEEL.mid}/>;})}
  {leg(LEG.fl,15,7,true,'ll')}
  {leg(LEG.fr,14,7,true,'lr')}
  {joints}
  {drips}
  {/* lopsided work platform, deeper on the left, its far end a little low */}
  <path d={`M${xl(P)-48} ${P+3}L${xr(P)+22} ${P-1}L${xr(P)+22} ${P+8}L${xl(P)-48} ${P+12}Z`} fill={STEEL.shade} stroke={STEEL.deep} strokeWidth={1.2}/>
  {Array.from({length:11},(_,i)=>{const x=xl(P)-44+i*((xr(P)+18-(xl(P)-44))/10);return <line key={i} x1={x} y1={P+2} x2={x} y2={P+10} stroke={STEEL.deep} strokeWidth={.9} opacity={.6}/>;})}
  <path d={`M${xl(P)-48} ${P+3}L${xl(P)-48} ${P-30}L${xr(P)+22} ${P-33}L${xr(P)+22} ${P-1}`} stroke={STEEL.mid} strokeWidth={2.4} fill="none"/>
  <path d={`M${xl(P)-48} ${P-14}L${xr(P)+22} ${P-17}`} stroke={STEEL.mid} strokeWidth={1.6} fill="none"/>
  <path d={`M${xl(P)-48} ${P-30}L${xr(P)+22} ${P-33}`} stroke={STEEL.lit} strokeWidth={1.1} opacity={.7}/>
  {/* three concrete piers */}
  {[[LEG.fl[0][0],0],[LEG.fr[0][0],0],[LEG.bk[0][0],-6]].map(([x,y],i)=><g key={'p'+i}>
   <path d={`M${x-13} ${y}L${x-11} ${y-12}L${x+12} ${y-13}L${x+14} ${y}Z`} fill="#B9AE9C" stroke="#6F655A" strokeWidth={1}/>
   <path d={`M${x-11} ${y-12}L${x+12} ${y-13}L${x+9} ${y-17}L${x-8} ${y-16}Z`} fill="#D9CFBC"/>
  </g>)}
  {/* mast and the aviation lamp, then the head */}
  <rect x={-4.5} y={TOWER.mastTop} width={9} height={-TOWER.mastTop-996} fill={`url(#${id}l)`} stroke={STEEL.deep} strokeWidth={1}/>
  <circle cx={-15} cy={-1006} r={4.5} fill="#B4231B" stroke={STEEL.deep} strokeWidth={.8}/>
  <circle cx={-15} cy={-1006} r={9} fill="#E0473A" opacity={.18+.12*dusk}/>
  <g transform={`translate(${TOWER.head[0]} ${TOWER.head[1]}) scale(${headScale})`}>
   <Head heading={heading} lamp={lamp} shimmer={shimmer} time={time} slot={slot}/>
  </g>
 </g>;
};

// ---- what the camera does ----------------------------------------------------------------------
/** A ground point on the watch ring for a heading, in tower units (ring centred on the base). */
export function ringPoint(rx:number,ry:number,heading:number):Pt{
 const a=rad(heading);return [-rx*Math.sin(a),ry*Math.cos(a)];
}
type SweepProps={heading:number;rx:number;ry:number;spread?:number;layer:'back'|'front';ring?:[number,number];strength?:number;from?:Pt};
/** The sweep wedge from the head to the ground and the dashed watch ring swept so far, either the
 * half behind the tower (drawn before it) or the half in front (drawn after it). */
const Sweep:React.FC<SweepProps>=({heading,rx,ry,spread=11,layer,ring,strength=1,from=TOWER.head})=>{
 const id=useUid('tcs');
 const front=(h:number)=>Math.cos(rad(h))>=0;
 const wedgeOn=strength>0&&(layer==='front')===front(heading);
 const arc=Array.from({length:13},(_,i)=>ringPoint(rx,ry,heading-spread+2*spread*i/12));
 const tip=ringPoint(rx,ry,heading);
 const segs:React.ReactNode[]=[];
 if(ring&&ring[1]>ring[0]){
  const n=Math.max(2,Math.ceil((ring[1]-ring[0])/3));
  let cur:Pt[]=[];let curFront=front(ring[0]);
  const flush=(k:number)=>{if(cur.length>1&&(layer==='front')===curFront)segs.push(<path key={k} d={'M'+cur.map(p=>p.join(' ')).join('L')}
   stroke="#FFF1D2" strokeWidth={3.2} strokeDasharray="14 10" fill="none" opacity={.8*strength}/>);};
  for(let i=0;i<=n;i++){
   const h=ring[0]+(ring[1]-ring[0])*i/n, f=front(h), p=ringPoint(rx,ry,h);
   if(f!==curFront){cur.push(p);flush(i);cur=[p];curFront=f;}else cur.push(p);
  }
  flush(n+1);
 }
 return <g data-part="sweep" data-layer={layer}>
  <defs>
   <linearGradient id={`${id}w`} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={tip[0]} y2={tip[1]}>
    <stop offset="0" stopColor="#FFF6DF" stopOpacity={.7}/><stop offset=".6" stopColor="#FFE9BE" stopOpacity={.28}/><stop offset="1" stopColor="#FFE2AE" stopOpacity={.08}/>
   </linearGradient>
  </defs>
  {segs}
  {wedgeOn&&<g opacity={strength}>
   <path d={`M${from[0]} ${from[1]}L`+arc.map(p=>p.join(' ')).join('L')+'Z'} fill={`url(#${id}w)`}/>
   <path d={`M${from[0]} ${from[1]}L${arc[0][0]} ${arc[0][1]}M${from[0]} ${from[1]}L${arc[12][0]} ${arc[12][1]}`} stroke="#FFF4DA" strokeWidth={1.6} opacity={.55}/>
   <ellipse cx={tip[0]} cy={tip[1]} rx={rx*.07} ry={ry*.16} fill="#FFF0CF" opacity={.55}/>
  </g>}
 </g>;
};

/** Four corner brackets that close on a target and lock; a small pennant marks the flag. */
const FlagBox:React.FC<{w:number;h:number;lock:number;pal:Pal}>=({w,h,lock,pal})=>{
 if(lock<=0)return null;
 const k=lerp(1.9,1,ease(lock)), W=w*k, H=h*k, arm=Math.min(w,h)*.3, o=clamp(lock*2.2);
 const corners:[number,number][]=[[-1,-1],[1,-1],[1,1],[-1,1]];
 return <g data-part="flag-box" opacity={o}>
  {lock>=1&&<rect x={-w/2} y={-h/2} width={w} height={h} fill={pal.accent} opacity={.1}/>}
  {corners.map(([sx,sy],i)=><path key={i} d={`M${sx*W/2} ${sy*H/2-sy*arm}L${sx*W/2} ${sy*H/2}L${sx*W/2-sx*arm} ${sy*H/2}`}
   stroke={pal.accent} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round"/>)}
  {corners.map(([sx,sy],i)=><path key={'s'+i} d={`M${sx*W/2} ${sy*H/2-sy*arm}L${sx*W/2} ${sy*H/2}L${sx*W/2-sx*arm} ${sy*H/2}`}
   stroke="#FFE3C4" strokeWidth={2} fill="none" strokeLinecap="round" opacity={.6} transform="translate(-1.5 -1.5)"/>)}
  {lock>.8&&<g transform={`translate(${-W/2+4} ${-H/2-8}) scale(${ease((lock-.8)/.2)})`}>
   <line x1={0} y1={0} x2={0} y2={-52} stroke={pal.ink} strokeWidth={3.5} strokeLinecap="round"/>
   <path d="M1 -52L36 -44L2 -34Z" fill={pal.accent} stroke={pal.ink} strokeWidth={1.6} strokeLinejoin="round"/>
  </g>}
 </g>;
};

/** The one alert card. Paper white, a worn corner, a drawn pin, the flag glyph, a smoke glyph and
 * two masked lines: it carries no message text, only that it is an alert. Origin at its centre. */
export const ALERT_SIZE:Pt=[214,138];
const AlertCard:React.FC<{lift?:number;glow?:number;pal:Pal}>=({lift=0,glow=0,pal})=>{
 const id=useUid('tca');
 const [w,h]=ALERT_SIZE, x=-w/2, y=-h/2;
 return <g data-part="alert-card">
  <defs><linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
   <stop offset="0" stopColor="#FFFBF1"/><stop offset=".7" stopColor={pal.paper}/><stop offset="1" stopColor="#DCCFB6"/>
  </linearGradient></defs>
  <path d={`M${x+6+10*lift} ${y+10+14*lift}h${w}v${h-18}l-22 22h${-w+22}Z`} fill="#21160F" opacity={.22+.08*(1-lift)}/>
  {glow>0&&<rect x={x-10} y={y-10} width={w+20} height={h+20} rx={18} fill={pal.accent} opacity={.18*glow}/>}
  <path d={`M${x} ${y+3}Q${x} ${y} ${x+4} ${y}H${x+w-3}Q${x+w} ${y} ${x+w} ${y+4}V${y+h-22}L${x+w-22} ${y+h}H${x+3}Q${x} ${y+h} ${x} ${y+h-4}Z`}
   fill={`url(#${id}p)`} stroke="#8E8170" strokeWidth={1.5}/>
  {/* the dog-ear at the worn corner */}
  <path d={`M${x+w} ${y+h-22}L${x+w-22} ${y+h}L${x+w-19} ${y+h-19}Z`} fill="#CDBFA4" stroke="#8E8170" strokeWidth={1.2}/>
  <rect x={x} y={y} width={w} height={30} rx={3} fill={pal.accent}/>
  <rect x={x} y={y+26} width={w} height={4} fill="#000" opacity={.12}/>
  <g transform={`translate(${x+16} ${y+24})`}>
   <line x1={0} y1={0} x2={0} y2={-18} stroke={pal.paper} strokeWidth={2.4}/>
   <path d="M1 -18L15 -14L1 -9Z" fill={pal.paper}/>
  </g>
  <text x={x+40} y={y+23} fontFamily={FONT.body} fontWeight={800} fontSize={21} fill={pal.paper} letterSpacing={1.5}>ALERT</text>
  {/* smoke glyph: three rising puffs from a small ground line */}
  <g transform={`translate(${x+36} ${y+96})`}>
   <path d="M-18 14H20" stroke={pal.ink} strokeWidth={2.6} strokeLinecap="round"/>
   <circle cx={0} cy={2} r={9} fill="#8B857C"/><circle cx={6} cy={-12} r={11} fill="#9E978C"/><circle cx={14} cy={-30} r={13} fill="#B5AEA2"/>
  </g>
  {[0,1].map(i=><rect key={i} x={x+72} y={y+56+i*28} width={i?92:118} height={12} rx={6} fill="#B9AD98"/>)}
  <circle cx={x+w*.52} cy={y+6} r={7.5} fill="#C9472B" stroke="#6E2414" strokeWidth={1.4}/>
  <circle cx={x+w*.52-2.4} cy={y+3.6} r={2.4} fill="#FFD2C2"/>
 </g>;
};

/** A hanging tag on a drawn pin at (0,0). Its body is sized from the measured type. */
export type TagTone='ink'|'accent'|'paper'|'outline';
const TAG_FONT=30, TAG_PAD=22;
export function tagSize(lines:string[]):Pt{
 const w=Math.max(...lines.map(l=>widthOf(l,TAG_FONT,true)))+2*TAG_PAD+22;
 return [Math.round(w),Math.round(lines.length*TAG_FONT*1.22+2*TAG_PAD-8)];
}
const Tag:React.FC<{lines:string[];tone?:TagTone;swing?:number;drop?:number;pal:Pal;scale?:number;side?:'left'|'right'}>=
 ({lines,tone='ink',swing=0,drop=40,pal,scale=1,side='right'})=>{
 const [w,h]=tagSize(lines);
 const bg=tone==='ink'?pal.ink:tone==='accent'?pal.accent:tone==='paper'?pal.paper:'#F7F0E2';
 const fg=tone==='ink'||tone==='accent'?pal.paper:pal.ink;
 const x=side==='left'?-w*.84:-w*.16, y=drop;
 return <g data-part="tag" transform={`rotate(${swing}) scale(${scale})`}>
  <line x1={0} y1={0} x2={x+(side==='left'?w-22:20)} y2={y+18} stroke="#3A2E24" strokeWidth={2.2}/>
  <path d={`M${x+6} ${y+8}h${w}v${h}H${x+8}Z`} fill="#1C120B" opacity={.24}/>
  <path d={`M${x} ${y+12}L${x+12} ${y}H${x+w-4}Q${x+w} ${y} ${x+w} ${y+4}V${y+h-3}Q${x+w} ${y+h} ${x+w-4} ${y+h}H${x+3}Q${x} ${y+h} ${x} ${y+h-3}Z`}
   fill={bg} stroke={tone==='outline'?pal.ink:'#000'} strokeOpacity={tone==='outline'?.85:.25} strokeWidth={tone==='outline'?2.6:1.2}
   strokeDasharray={tone==='outline'?'10 7':undefined}/>
  <circle cx={x+(side==='left'?w-22:20)} cy={y+18} r={6} fill="none" stroke={fg} strokeWidth={2.4} opacity={.8}/>
  {lines.map((l,i)=><text key={i} x={x+TAG_PAD+(side==='left'?0:18)} y={y+TAG_PAD+TAG_FONT*.82+i*TAG_FONT*1.22} fontFamily={FONT.body}
   fontWeight={800} fontSize={TAG_FONT} fill={fg}>{l}</text>)}
  <circle cx={0} cy={0} r={7} fill="#C59A4A" stroke="#5E4520" strokeWidth={1.6}/>
  <circle cx={-2} cy={-2.4} r={2.2} fill="#F6E2B0"/>
 </g>;
};

/** Treatment b: the round lens display from inside the camera. A machined bezel ring, a heading
 * tape that turns with the head, a scan line and a centre reticle. The land behind is the region
 * itself, seen through the glass; this draws only the ring and its marks. */
const LensDisplay:React.FC<{r:number;heading:number;scan?:number;glow?:number;pal:Pal}>=({r,heading,scan=-1,glow=0,pal})=>{
 const id=useUid('tcl');
 const ticks:React.ReactNode[]=[];
 // The tape carries the whole compass across the top 100 degrees of the inside arc, so a full turn
 // moves each mark a small step per frame instead of aliasing a dense scale.
 const span=100;
 for(let d=Math.floor((heading-180)/15)*15;d<=heading+180;d+=15){
  const off=(d-heading)/180, ang=-90+off*span/2, a=rad(ang);
  if(Math.abs(off)>1)continue;
  const major=((d%90)+90)%90===0;
  const r0=r-14, r1=r-(major?46:28);
  const op=1-Math.abs(off)**3;
  ticks.push(<line key={'t'+d} x1={r0*Math.cos(a)} y1={r0*Math.sin(a)} x2={r1*Math.cos(a)} y2={r1*Math.sin(a)} stroke="#FFF3DA" strokeWidth={major?4.5:2.4} opacity={.85*op}/>);
  const m=((d%360)+360)%360;
  const name=m===0?'N':m===90?'E':m===180?'S':m===270?'W':'';
  if(name){const rt=r-78;ticks.push(<text key={'n'+d} x={rt*Math.cos(a)} y={rt*Math.sin(a)+12} textAnchor="middle" fontFamily={FONT.body}
   fontWeight={800} fontSize={34} fill="#FFF3DA" opacity={op}>{name}</text>);}
 }
 return <g data-part="lens-display">
  <defs>
   <radialGradient id={`${id}v`} cx=".5" cy=".5" r=".5">
    <stop offset=".72" stopColor="#0B0F12" stopOpacity={0}/><stop offset=".97" stopColor="#0B0F12" stopOpacity={.55}/><stop offset="1" stopColor="#0B0F12" stopOpacity={.7}/>
   </radialGradient>
   <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor="#E9E1CF"/><stop offset=".3" stopColor="#8D9396"/><stop offset=".7" stopColor="#3B4044"/><stop offset="1" stopColor="#202427"/>
   </linearGradient>
   <clipPath id={`${id}c`}><circle cx={0} cy={0} r={r}/></clipPath>
  </defs>
  <circle cx={0} cy={0} r={r} fill={`url(#${id}v)`}/>
  <g clipPath={`url(#${id}c)`}>
   {scan>=0&&scan<=1&&<g transform={`translate(0 ${lerp(-r,r,scan)})`}>
    <rect x={-r} y={-46} width={2*r} height={46} fill="#FFE9BF" opacity={.12}/>
    <line x1={-r} y1={0} x2={r} y2={0} stroke="#FFF2D6" strokeWidth={3} opacity={.75}/>
   </g>}
   {ticks}
   <path d={`M-28 0H-10M10 0H28M0 -28V-10M0 10V28`} stroke="#FFF3DA" strokeWidth={3} opacity={.8}/>
   <path d={`M${-r*.62} ${-r*.5}v-22h22M${r*.62} ${-r*.5}v-22h-22M${-r*.62} ${r*.5}v22h22M${r*.62} ${r*.5}v22h-22`} stroke="#FFF3DA" strokeWidth={2.4} fill="none" opacity={.55}/>
   <path d={`M0 ${-r+8}l-11 -0l11 22l11 -22z`} fill={pal.accent}/>
  </g>
  {glow>0&&<circle cx={0} cy={0} r={r+4} fill="none" stroke={pal.accent} strokeWidth={10} opacity={.5*glow}/>}
  {/* the machined bezel, thicker at the lower right where the housing sits */}
  <path fillRule="evenodd" d={`M${-r-52} 0a${r+52} ${r+50} 0 1 0 ${2*r+104} 0a${r+52} ${r+50} 0 1 0 ${-2*r-104} 0Z M${-r} 0a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`}
   fill={`url(#${id}m)`} stroke="#15191C" strokeWidth={2}/>
  <circle cx={0} cy={0} r={r+26} fill="none" stroke="#000" strokeWidth={1.4} opacity={.35}/>
  <path d={`M${-(r+40)*Math.cos(rad(30))} ${-(r+40)*Math.sin(rad(30))}A${r+40} ${r+40} 0 0 1 ${-(r+40)*Math.cos(rad(80))} ${-(r+40)*Math.sin(rad(80))}`} stroke="#FFF6E2" strokeWidth={4} fill="none" opacity={.55}/>
  {Array.from({length:8},(_,i)=>{const a=rad(i*45+12);return <circle key={i} cx={(r+38)*Math.cos(a)} cy={(r+38)*Math.sin(a)} r={4} fill="#1D2124" stroke="#9AA0A2" strokeWidth={1}/>;})}
 </g>;
};

export type TowerCameraHeroProps=
 | ({part:'tower'}&TowerProps)
 | {part:'head';heading:number;lamp?:number;shimmer?:number;time?:number;slot?:number}
 | ({part:'sweep'}&SweepProps)
 | {part:'flag';w:number;h:number;lock:number;pal:Pal}
 | {part:'alert';lift?:number;glow?:number;pal:Pal}
 | {part:'tag';lines:string[];tone?:TagTone;swing?:number;drop?:number;pal:Pal;scale?:number;side?:'left'|'right'}
 | {part:'lens';r:number;heading:number;scan?:number;glow?:number;pal:Pal};

/** The hero group's one executable export. */
export const TowerCameraHero:React.FC<TowerCameraHeroProps>=(props)=>{
 switch(props.part){
 case 'tower':return <Tower {...props}/>;
 case 'head':return <Head {...props} detail/>;
 case 'sweep':return <Sweep {...props}/>;
 case 'flag':return <FlagBox {...props}/>;
 case 'alert':return <AlertCard {...props}/>;
 case 'tag':return <Tag {...props}/>;
 case 'lens':return <LensDisplay {...props}/>;
 default:throw new Error('Unknown tower camera hero part');
 }
};
