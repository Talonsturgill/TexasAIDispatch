import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {TowerCameraHero,TOWER,ALERT_SIZE,coaxPoint,ringPoint,type Pal,type Pt} from './TowerCameraHero';
import {WestTexasSupport,CAB,PHONE,SLOTS,CAL,RECORD,FOLDER} from './WestTexasSupport';

/**
 * tower-alert-v1: a camera on a tall west Texas tower watches all the way around, flags smoke,
 * and its alert goes to the utility's own crew. The line toward first responders stays open, the
 * response record stays blank and the wildfire plan still waits on state approval.
 *
 * ONE tower, ONE camera head, ONE plume and ONE alert card carry the film. The card leaves the
 * head, travels down the tower toward the crew, lands on a crew phone as a bubble that keeps its
 * look, marks the start of a ten minute window on a clock and is where the open line starts.
 *
 * A: the ground-up treatment. The viewer stands in the dry country under the whole tower, watches
 *    its beam sweep the land and leave a dashed watch ring, stands at the tower's feet as the beam
 *    finds smoke, follows the card down the coax to the crew truck, then reads the phone in a
 *    leather glove and the watch on that wrist. The ending splits the sky over the still sweeping
 *    tower from the commission desk where the plan waits.
 * B: the through-the-lens treatment. The film opens inside the camera's round display, pulls back
 *    out of the lens to the whole tower, finds the smoke inside the display, sends the card out of
 *    the display's edge toward the truck below and takes the alert inside the truck cab, where the
 *    dash clock, the visor calendar and the windshield carry the middle of the film. It ends with
 *    the display still sweeping over the land above the desk where the plan waits.
 *
 * Every visible state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. The region plate stands behind every shot: this episode never paints
 * a full-frame background. Document views (the slot card, the record, the desk) are listed as wall
 * views in the registry. Disclosed illustration; no AEP Texas site, Pano AI product, real feed,
 * real smoke event, crew, county or response time.
 */

type V='a'|'b';
type Win={start:number;end:number};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const mix=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const bez=(a:Pt,c:Pt,b:Pt,u:number):Pt=>{const v=clamp(u);return [(1-v)*(1-v)*a[0]+2*(1-v)*v*c[0]+v*v*b[0],(1-v)*(1-v)*a[1]+2*(1-v)*v*c[1]+v*v*b[1]];};

/** Place a part at p with scale s and rotation r. */
const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) scale(${s})`} opacity={o}>{children}</g>;
/** A camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,760],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A camera that keeps one world point on a path across the screen while the scale changes in log space. */
function pullCam(target:Pt,from:Pt,to:Pt,s0:number,s1:number,e:number,a:Pt=[540,760]):{f:Pt;s:number;a:Pt}{
 const s=Math.exp(lerp(Math.log(s0),Math.log(s1),e)), pos=mix(from,to,e);
 return {f:[target[0]-(pos[0]-a[0])/s,target[1]-(pos[1]-a[1])/s],s,a};
}
/** A point at share u of a polyline's length, so one eased progress gives one continuous speed. */
function along(pts:Pt[],u:number):Pt{
 const seg=pts.slice(1).map((q,i)=>Math.hypot(q[0]-pts[i][0],q[1]-pts[i][1]));
 const total=seg.reduce((a,b)=>a+b,0);let d=clamp(u)*total;
 for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1)return mix(pts[i],pts[i+1],seg[i]?clamp(d/seg[i]):0);d-=seg[i];}
 return pts[pts.length-1];
}
/** A subject standing on the region's ground outdoors rides the plate's camera with its base row. */
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;

// ---- the two worlds: fixed placements of every grounded thing (screen units at framing wide) ----
type World={road:{near:[number,number,number];far:[number,number,number];bend:number;base:number};tower:Pt;ts:number;windmill:Pt;ws:number;truck:Pt;ks:number;shelter:Pt;ss:number;station?:Pt;sts:number;
 mesquite:[Pt,number,number][];grass:[Pt,number,number,number][];plume:Pt;ring:[number,number]};
const WORLD:Record<V,World>={
 a:{road:{near:[300,1250,150],far:[566,1022,18],bend:-40,base:1022},tower:[600,1012],ts:.76,windmill:[236,1044],ws:.95,truck:[748,1036],ks:.24,shelter:[668,1018],ss:.24,station:undefined,sts:.4,
  mesquite:[[[70,1112],270,4],[[968,1072],150,9],[[372,1052],86,21]],
  grass:[[[150,1402],260,170,2],[[880,1336],200,130,5],[[540,1490],230,150,8],[[330,1150],110,70,13]],
  plume:[862,1040],ring:[480,60]},
 b:{road:{near:[180,1230,170],far:[372,1050,22],bend:30,base:1058},tower:[500,1016],ts:.78,windmill:[150,1046],ws:.85,truck:[332,1060],ks:.34,shelter:[604,1022],ss:.24,station:[836,1002],sts:.45,
  mesquite:[[[952,1104],210,12],[[52,1186],300,6],[[690,1046],90,17]],
  grass:[[[120,1430],240,160,3],[[760,1380],230,150,7],[[480,1520],200,130,11]],
  plume:[760,1034],ring:[470,58]},
};
/** The plume's heading on the watch ring of each world, so the beam finds it. */
const PLUME_HEADING:Record<V,number>={a:311,b:300};

export const TowerAlertFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Tower alert film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Tower alert film must read the single film frame clock');
 const pal:Pal=ad.palette, v:V=variant, Wd=WORLD[v];
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const win=(id:string)=>requireAction(W,id);
 const p=(id:string)=>actionProgress(win(id),t);
 const raw=(w:Win)=>clamp((t-w.start)/(w.end-w.start));
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id, at=(s:string)=>sid===s;
 const flat=ad.flat_shots?.[sid];
 const fr=shot.framing, view=shot.view;

 // ---- performed states, each read from its own event on the film clock ----
 const e11=win('s1-event-1'),e12=win('s1-event-2');
 const face=p('s1-event-2');
 const count=p('s2-event-1'), plan=p('s2-event-2');
 const e31=win('s3-event-1'), find=p('s3-event-1'), e32=win('s3-event-2'), send=p('s3-event-2'), e33=win('s3-event-3'), land=p('s3-event-3');
 const windowFill=p('s4-event-1'), estimate=p('s4-event-2');
 const prevent=p('s5-event-1'), e52=win('s5-event-2'), line=p('s5-event-2');
 const e61=win('s6-event-1'), scroll=p('s6-event-1'), attrib=p('s6-event-2');
 const slide=p('s7-event-1'), pulse=raw(win('s7-event-2'));
 const e81=win('s8-event-1'), file=p('s8-event-1'), waits=p('s8-event-2');

 // ---- the head's heading through the film. A full turn in s1, then it faces the viewer; in s3 it
 // holds on the smoke; later it sweeps on at an even rate.
 const ph=PLUME_HEADING[v];
 const turn=ease(raw({start:e11.start,end:e11.start+2.0}));
 const heading=at('s1')?(t<e12.start?90+360*turn:450-90*face)
  :at('s3')?(t<e31.start?ph-70:lerp(ph-70,ph,ease(raw({start:e31.start,end:lerp(e31.start,e31.end,.6)}))))
  :at('s5')?ph-80+64*(t-scene.start_s)
  :ph-60+52*(t-scene.start_s);
 const fan=t*110, vane=10*Math.sin(t*.7)+4*Math.sin(t*1.9), sway=.35*Math.sin(t*1.1);
 const plumeGrow=at('s3')?clamp((t-scene.start_s+.1)/1.6):1;

 // ---- shared drawings ----
 const tag=(lines:string[],tone:'ink'|'accent'|'paper'|'outline',shown:number,o:{swing?:number;drop?:number;side?:'left'|'right';scale?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${-60*(o.scale??1)*(1-ease(shown))})`} opacity={clamp(shown*3)}>
   <TowerCameraHero part="tag" lines={lines} tone={tone} pal={pal} drop={o.drop??34} side={o.side} scale={o.scale}
    swing={(o.swing??0)+14*(1-ease(shown))*(o.side==='left'?1:-1)}/></g>;
 const disclosure=<g data-disclosure="production_disclosure">
  <path d="M44 132H520Q536 132 536 148V172Q536 188 520 188H44Z" fill={pal.paper} opacity={.93}/>
  <text x={60} y={170} fontFamily={FONT.body} fontSize={26} fontWeight={700} fill={pal.ink}>{scene.production_disclosure??'Illustration'}</text>
 </g>;

 /** The dry country, the windmill, the shelter, the fence and the tower with its sweep. */
 const plains=(o:{heading:number;ring?:[number,number];beam?:number;lamp?:number;shimmer?:number;plume?:number;onTower?:React.ReactNode;truck?:boolean;truckGlow?:number;station?:boolean;grounded:boolean;front?:React.ReactNode})=>{
  const T=Wd.tower, g=o.grounded;
  const [rx,ry]=Wd.ring;
  const sweep=(layer:'back'|'front')=><TowerCameraHero part="sweep" heading={o.heading} rx={rx} ry={ry} layer={layer} ring={o.ring} strength={o.beam??1}/>;
  return <g data-world={v==='a'?'a-plains-ground-up':'b-plains-cab-side'}>
   <Grounded baseY={Wd.road.base} on={g}><WestTexasSupport part="road" near={Wd.road.near} far={Wd.road.far} bend={Wd.road.bend}/></Grounded>
   {Wd.mesquite.filter(([pt])=>pt[1]<1080).map(([pt,h,seed],i)=><Grounded key={'mf'+i} baseY={pt[1]} on={g}><At p={pt}><WestTexasSupport part="mesquite" seed={seed} h={h}/></At></Grounded>)}
   {o.station&&Wd.station&&<Grounded baseY={Wd.station[1]} on={g}><At p={Wd.station} s={Wd.sts}><WestTexasSupport part="station"/></At></Grounded>}
   <Grounded baseY={Wd.windmill[1]} on={g}><At p={Wd.windmill} s={Wd.ws}><WestTexasSupport part="windmill" fan={fan} vane={vane}/></At></Grounded>
   {o.plume!==undefined&&o.plume>0&&<Grounded baseY={Wd.plume[1]} on={g}><At p={Wd.plume} s={.62}><WestTexasSupport part="plume" t={t} grow={o.plume} h={330}/></At></Grounded>}
   <Grounded baseY={T[1]} on={g}>
    <At p={T} s={Wd.ts}>
     {sweep('back')}
     <At p={[-150,26]} s={.5}><WestTexasSupport part="fence" w={300} seed={5}/></At>
     <TowerCameraHero part="tower" heading={o.heading} lamp={o.lamp} shimmer={o.shimmer} time={t} dusk={.4}/>
     {sweep('front')}
     {o.onTower}
    </At>
   </Grounded>
   <Grounded baseY={Wd.shelter[1]} on={g}><At p={Wd.shelter} s={Wd.ss}><WestTexasSupport part="shelter"/></At></Grounded>
   {o.truck&&<Grounded baseY={Wd.truck[1]} on={g}><At p={Wd.truck} s={Wd.ks}><WestTexasSupport part="truck" glow={o.truckGlow}/></At></Grounded>}
   {Wd.mesquite.filter(([pt])=>pt[1]>=1080).map(([pt,h,seed],i)=><Grounded key={'mn'+i} baseY={pt[1]} on={g}><At p={pt}><WestTexasSupport part="mesquite" seed={seed} h={h}/></At></Grounded>)}
   {Wd.grass.map(([pt,w,h,seed],i)=><At key={'g'+i} p={pt}><WestTexasSupport part="grass" seed={seed} w={w} h={h} sway={sway}/></At>)}
   {o.front}
  </g>;
 };
 /** A tower-local point in screen units for world v. */
 const towerPt=(local:Pt):Pt=>[Wd.tower[0]+local[0]*Wd.ts,Wd.tower[1]+local[1]*Wd.ts];

 /** The commission desk with the plan folder, its open slot and the outlined expected tag. */
 const deskScene=(o:{folderAt:Pt;fs:number;expected:number;slotGlow?:number;top:number})=>{
  const clip:Pt=[o.folderAt[0]+FOLDER.clip[0]*o.fs,o.folderAt[1]+(FOLDER.clip[1]-60)*o.fs];
  return <g data-world="commission-desk">
   <WestTexasSupport part="desk" top={o.top}/>
   <At p={o.folderAt} s={o.fs}><WestTexasSupport part="folder" pal={pal} slotGlow={o.slotGlow}/></At>
   <At p={clip}>{tag(['Expected','January 2027'],'outline',o.expected,{side:'right',drop:30,scale:o.fs*1.1})}</At>
  </g>;
 };
 /** The response record on the desk. */
 const recordScene=(cardAt:Pt,cs:number,pulseOn:number)=><g data-world="record-desk">
  <WestTexasSupport part="desk" top={760}/>
  <At p={cardAt} s={cs}><WestTexasSupport part="record" pal={pal} pulse={pulseOn}/></At>
 </g>;
 /** The slot card for the reported count and the plan. */
 const slotsCard=(style:'tower'|'lens',lit:number,planned:number,labels:number)=>
  <At p={[126,300]}><WestTexasSupport part="slots" style={style} lit={lit} planned={planned} labels={labels} pal={pal}/></At>;
 /** The lens display over the land (treatment b). */
 const lens=(c:Pt,r:number,hd:number,scan:number,glow=0)=><At p={c}><TowerCameraHero part="lens" r={r} heading={hd} scan={scan} glow={glow} pal={pal}/></At>;
 /** The cab from inside (treatment b). */
 const cab=(extra:React.ReactNode,visorDown=0)=><g data-world="b-truck-cab"><WestTexasSupport part="cab" visorDown={visorDown}/>{extra}</g>;
 /** The phone in the glove (treatment a). */
 const gloved=(pt:Pt,s:number,bubble:number,buzz:number)=><At p={pt} s={s}>
  <WestTexasSupport part="glove" layer="back"/>
  <WestTexasSupport part="phone" bubble={bubble} buzz={buzz} pal={pal} time={t}/>
  <WestTexasSupport part="glove" layer="front"/>
 </At>;
 const buzzAfter=(w:Win)=>t>w.end?Math.exp(-(t-w.end)*5):0;

 let pic:React.ReactNode;
 switch(view){
 case 'tower-sweep':{
  // A s1: the whole tower from the ground; one full turn leaves the dashed watch ring.
  // B s1: the pull back out of the lens to the whole tower that holds it.
  if(v==='a'){
   pic=plains({heading,ring:[90,Math.max(90,heading)],grounded:true});
  }else{
   // the pull back starts on the cut and spans the reveal event, braking into the whole tower
   const e=ease(raw({start:shot.start_s+.05,end:Math.max(e12.end,shot.start_s+2.1)}));
   const head=towerPt(TOWER.head);
   const c=pullCam(head,[540,700],head,3.2,1,e);
   pic=<Cam f={c.f} s={c.s} a={c.a}>{plains({heading:450+24*(t-2.5),ring:[90,450],beam:e,truck:true,grounded:false})}</Cam>;
  }
  break;}
 case 'head-close':{
  // A s1 end: the head comes round to face the viewer; a West Texas tag settles on the rail.
  const head=towerPt(TOWER.head);
  const rail=towerPt([-58,TOWER.platformY-30]);
  pic=<Cam f={head} s={3.1} a={[540,520]}>
   <At p={Wd.tower} s={Wd.ts}><TowerCameraHero part="tower" heading={heading} time={t} dusk={.4}/></At>
   <At p={rail}>{tag(['West Texas'],'ink',face,{side:'left',drop:22,scale:.3,swing:4*Math.sin(t*2.2)*(1-face)})}</At>
  </Cam>;
  break;}
 case 'lens-ring':{
  // B s1 open: inside the camera's round display; its heading tape turns a full circle.
  const hd=90+360*turn;
  pic=<g data-world="b-lens">{lens([520,760],400,hd,((t*.62)%1))}</g>;
  break;}
 case 'camera-count':
 case 'lens-row':
 case 'plan-card':{
  const style=v==='a'?'tower':'lens';
  const counting=act==='count-cameras';
  const lit=counting?16*count:16, planned=counting?0:plan, labels=counting?clamp((count-.9)*10):1;
  const card=slotsCard(style,lit,planned,labels);
  const tagAt:Pt=[126+SLOTS.w-420,300+SLOTS.footer+4];
  const planTag=!counting&&<At p={tagAt}>{tag(['56 planned','by February 2027'],'outline',plan,{side:'right',drop:8,scale:.82})}</At>;
  if(counting)pic=<Cam f={[540,700]} s={lerp(1,1.03,raw({start:scene.start_s,end:scene.start_s+scene.duration_s}))} a={[540,710]}>{card}</Cam>;
  else pic=<Cam f={[560,1000]} s={1.3} a={[540,760]}>{card}{planTag}</Cam>;
  break;}
 case 'plume-flag':{
  // A s3: at the tower's feet looking out; the beam crosses the land, finds the smoke, the flag box closes.
  const aim=lerp(150,Wd.plume[0]+50,ease(clamp(find/.62))), lock=clamp((find-.5)/.5);
  const pl:Pt=[700,980];
  pic=<g data-world="a-tower-foot">
   <Grounded baseY={pl[1]} on><At p={pl} s={.78}><WestTexasSupport part="plume" t={t} grow={plumeGrow} h={300}/></At></Grounded>
   <Grounded baseY={1020} on><At p={[880,1020]}><WestTexasSupport part="mesquite" seed={31} h={120}/></At></Grounded>
   <path d={`M-260 -500L${aim-60} 986L${aim+70} 990Z`} fill="#FFF0CF" opacity={.22}/>
   <path d={`M-260 -500L${aim-60} 986M-260 -500L${aim+70} 990`} stroke="#FFF4DA" strokeWidth={2} opacity={.4}/>
   <At p={[pl[0]+60,pl[1]-120]}><TowerCameraHero part="flag" w={200} h={250} lock={lock} pal={pal}/></At>
   <Grounded baseY={1290} on><At p={[-40,1290]} s={2.5}>
    <TowerCameraHero part="tower" heading={heading} time={t}/>
   </At></Grounded>
   <Grounded baseY={1330} on><At p={[150,1330]}><WestTexasSupport part="fence" w={560} seed={11}/></At></Grounded>
   <At p={[880,1380]}><WestTexasSupport part="grass" seed={17} w={230} h={160} sway={sway}/></At>
   <At p={[560,1460]}><WestTexasSupport part="grass" seed={19} w={200} h={140} sway={sway}/></At>
  </g>;
  break;}
 case 'scope-flag':
 case 'scope-hold':{
  // B s3 and s5: inside the display; the smoke rises in the circle, the flag box closes and holds.
  const hd=view==='scope-flag'?heading:ph;
  const lock=view==='scope-flag'?clamp((find-.5)/.5):1;
  const pl:Pt=[610,975];
  pic=<g data-world="b-lens">
   <Grounded baseY={pl[1]} on><At p={pl} s={.7}><WestTexasSupport part="plume" t={t} grow={view==='scope-flag'?plumeGrow:1} h={view==='scope-flag'?300:360}/></At></Grounded>
   <At p={[pl[0]+52,pl[1]-112]}><TowerCameraHero part="flag" w={190} h={240} lock={lock} pal={pal}/></At>
   {lens([500,700],380,hd,view==='scope-flag'?((t*.62)%1):-1,lock>=1?.4:0)}
   {view==='scope-hold'&&<At p={[805,395]}>{tag(["Doesn't","prevent fires"],'accent',prevent,{side:'left',drop:40})}</At>}
  </g>;
  break;}
 case 'flag-message':{
  if(v==='a'){
   // A s3: the card lifts out of the head and travels down the coax toward the crew truck below.
   const T:Pt=[600,1250], s=1;
   const toScreen=(q:Pt):Pt=>[T[0]+q[0]*s,T[1]+q[1]*s];
   // the card rises out of the head's slot, then one eased stroke carries it out over the right leg
   // and down the coax: a bezier into the coax and the coax itself, sampled by arc length
   const lift=ease((t-e32.start+.3)/.3);
   const top:Pt=toScreen([TOWER.head[0],TOWER.head[1]-60]);
   const c0=toScreen(coaxPoint(.12)), entry:Pt=[c0[0]+70,c0[1]];
   const path:Pt[]=[...Array.from({length:16},(_,i)=>bez(top,[entry[0],top[1]],entry,i/15)),
    ...Array.from({length:24},(_,i)=>{const q=toScreen(coaxPoint(lerp(.12,.36,(i+1)/24)));return [q[0]+70,q[1]] as Pt;})];
   const cardAt:Pt=send<=0?toScreen([TOWER.head[0],TOWER.head[1]-60*lift]):along(path,send);
   pic=<g data-world="a-tower-medium">
    <Grounded baseY={1262} on><At p={[800,1262]} s={.46}><WestTexasSupport part="truck" glow={send}/></At></Grounded>
    <Grounded baseY={T[1]} on><At p={T} s={s}>
     <TowerCameraHero part="tower" heading={heading} lamp={1} shimmer={1-send} time={t} slot={clamp(lift*2)} dusk={.4}/>
    </At></Grounded>
    <At p={cardAt} s={.8} r={send*-8}><TowerCameraHero part="alert" lift={1} glow={1-send} pal={pal}/></At>
    <At p={[860,1380]}><WestTexasSupport part="grass" seed={23} w={220} h={150} sway={sway}/></At>
   </g>;
  }else{
   // B s3: the card slides out of the display's edge toward the truck parked below the tower.
   const from:Pt=[560,720], to:Pt=[838,1040];
   const cardAt=bez(from,[820,700],to,send);
   pic=<g data-world="b-lens-edge">
    <Grounded baseY={1080} on><At p={[840,1080]} s={.26}><WestTexasSupport part="truck" glow={send}/></At></Grounded>
    <At p={[740,1076]} s={.2}><TowerCameraHero part="tower" heading={heading} time={t}/></At>
    {lens([140,640],420,ph,-1,1-send)}
    <At p={cardAt} s={lerp(1,.32,send)} r={lerp(-4,6,send)} o={send<.98?1:1-(send-.98)/.02}><TowerCameraHero part="alert" lift={1} glow={1-send} pal={pal}/></At>
   </g>;
  }
  break;}
 case 'crew-phone':{
  if(v==='a'){
   // A s3: the card drops into the phone in the glove and lands as the alert bubble; the phone buzzes.
   pic=<g data-world="a-glove-phone">{gloved([520,700],1,land,buzzAfter(e33))}
    {land<=0&&t>=shot.start_s&&<At p={[520,lerp(196,280,ease(raw({start:shot.start_s,end:e33.start})))]} s={lerp(1.05,1.2,ease(raw({start:shot.start_s,end:e33.start})))}>
     <TowerCameraHero part="alert" lift={1} pal={pal}/></At>}
   </g>;
  }else{
   // B s3: inside the truck cab; the card comes in at the driver's window and lands on the dash phone.
   const ph0:Pt=CAB.mount;
   const fly=ease(raw({start:shot.start_s,end:e33.start}));
   const bubbleTop:Pt=[ph0[0]+PHONE.bubble[0]*.58,ph0[1]-PHONE.h*.7*.58];
   pic=cab(<>
    <At p={ph0} s={.58}><WestTexasSupport part="phone" bubble={land} buzz={buzzAfter(e33)} pal={pal} time={t}/></At>
    {land<=0&&<At p={bez([470,700],[590,660],bubbleTop,fly)} s={lerp(.78,.72,fly)} r={lerp(-8,0,fly)}><TowerCameraHero part="alert" lift={1} pal={pal}/></At>}
   </>);
  }
  break;}
 case 'clock-arc':
 case 'estimate-pin':{
  // s4: a ten minute window opens on the clock from the flag mark to the message mark, outlined as
  // "within"; the estimate tag pins where it ends. A on the watch at the wrist, B on the dash clock.
  const r=v==='a'?260:210, C:Pt=v==='a'?[420,760]:[470,860];
  const bound=at('s4')?clamp(windowFill*1.6):1, fillV=at('s4')?clamp((windowFill-.3)/.7):1;
  const endA=(-90+60)*Math.PI/180, endPt:Pt=[C[0]+r*.86*Math.cos(endA),C[1]+r*.86*Math.sin(endA)];
  const preTag=view==='clock-arc'?clamp((t-(shot.start_s+shot.duration_s-.55))/.55)*.35:estimate;
  const face=<>
   {v==='a'&&<g data-part="wrist">
    <path d={`M-60 ${C[1]-170}Q300 ${C[1]-210} ${C[0]} ${C[1]-180}V${C[1]+180}Q300 ${C[1]+200} -60 ${C[1]+190}Z`} fill="#8C8A70"/>
    <path d={`M${C[0]} ${C[1]-180}Q900 ${C[1]-200} 1140 ${C[1]-160}V${C[1]+200}Q900 ${C[1]+190} ${C[0]} ${C[1]+180}Z`} fill="#B48A55"/>
    <path d={`M${C[0]+260} ${C[1]-190}Q${C[0]+300} ${C[1]} ${C[0]+262} ${C[1]+190}`} stroke="#7A5733" strokeWidth={5} strokeDasharray="10 8" fill="none"/>
   </g>}
   {v==='b'&&<g data-part="dash-pod"><path d={`M${C[0]-300} ${C[1]+250}Q${C[0]} ${C[1]+160} ${C[0]+300} ${C[1]+250}V1980H${C[0]-300}Z`} fill="#202122"/>
    <rect x={C[0]-90} y={C[1]+r*1.1} width={180} height={150} fill="#1A1B1B"/></g>}
   <At p={C}><WestTexasSupport part="clock" r={r} style={v==='a'?'wrist':'dash'} fill={fillV} bound={bound} pal={pal}/></At>
   {bound>.6&&<At p={[endPt[0]+50,endPt[1]-150]} s={.32} r={-6} o={clamp((bound-.6)/.3)}><TowerCameraHero part="alert" pal={pal}/></At>}
   <At p={[endPt[0]+4,endPt[1]+4]}>{tag(['Estimated','within ten minutes'],'accent',preTag,{side:'right',drop:40,scale:.9})}</At>
  </>;
  const body=v==='b'?cab(face):face;
  pic=view==='clock-arc'?<Cam f={C} s={1} a={[C[0],v==='a'?C[1]:780]}>{body}</Cam>
   :<Cam f={[endPt[0]+90,endPt[1]+40]} s={v==='a'?1.45:1.6} a={[520,700]}>{body}</Cam>;
  break;}
 case 'plume-hold':{
  // A s5: the plume keeps burning while the beam sweeps past it and on; the limit tag pins to the tower.
  const leg=towerPt([-46,-520]);
  pic=plains({heading,ring:[0,360],plume:1,grounded:true,
   front:<At p={leg}>{tag(["Doesn't","prevent fires"],'accent',prevent,{side:'left',drop:34})}</At>});
  break;}
 case 'open-line':{
  // s5: a dashed line runs from the alert toward a first-responder badge and stops short, open.
  const badge:Pt=v==='a'?[808,812]:[836,822];
  const start:Pt=v==='a'?[262,740]:[Wd.truck[0]-14*Wd.ks/.34,Wd.truck[1]-176*Wd.ks];
  const ctrl:Pt=[(start[0]+badge[0])/2,Math.min(start[1],badge[1])-180];
  const reach=.8*line;
  const pts=Array.from({length:41},(_,i)=>bez(start,ctrl,badge,reach*i/40));
  const end=pts[pts.length-1];
  const mid=bez(start,ctrl,badge,.42);
  const lineEl=line>0&&<g data-part="open-line">
   <path d={'M'+pts.map(q=>q.join(' ')).join('L')} stroke={pal.paper} strokeWidth={9} strokeDasharray="22 16" fill="none" strokeLinecap="round"/>
   <path d={'M'+pts.map(q=>q.join(' ')).join('L')} stroke={pal.accent} strokeWidth={4} strokeDasharray="22 16" fill="none" strokeLinecap="round"/>
   <circle cx={end[0]} cy={end[1]} r={13} fill="none" stroke={pal.accent} strokeWidth={5}/>
  </g>;
  const badgeEl=<g data-part="responder-badge">
   <line x1={badge[0]} y1={badge[1]+46} x2={badge[0]} y2={badge[1]+130} stroke={pal.ink} strokeWidth={3}/>
   <circle cx={badge[0]} cy={badge[1]} r={48} fill="#B33A2B" stroke={pal.paper} strokeWidth={6}/>
   <path transform={`translate(${badge[0]} ${badge[1]+6})`} d="M-24 10Q-24 -22 0 -22Q24 -22 24 10H32V16H-32V10Z" fill={pal.paper}/>
  </g>;
  const shareTag=<At p={mid}>{tag(['Can share'],'paper',clamp((line-.55)/.45),{side:'right',drop:30})}</At>;
  if(v==='a'){
   pic=<g data-world="a-open-line">
    <Grounded baseY={1004} on><At p={[808,1004]} s={.62}><WestTexasSupport part="station"/></At></Grounded>
    <Grounded baseY={998} on><At p={[470,998]} s={.3}><TowerCameraHero part="tower" heading={heading} time={t}/></At></Grounded>
    <Grounded baseY={1000} on><At p={[600,1000]} s={.55}><WestTexasSupport part="plume" t={t} grow={1} h={300}/></At></Grounded>
    {badgeEl}{lineEl}{shareTag}
    {gloved([262,700],.62,1,0)}
   </g>;
  }else{
   pic=plains({heading,ring:[0,360],truck:true,truckGlow:1,station:true,plume:1,grounded:true,front:<>{badgeEl}{lineEl}{shareTag}</>});
  }
  break;}
 case 'launch-calendar':
 case 'attribution-pin':{
  // s6: the calendar strip since launch passes with no red mark; the attribution tag pins at its end.
  const cs=.5;
  const len=CAL.block*CAL.blocks*cs;
  const stripAt:Pt=v==='a'?[60,770]:[70,440];
  const endPt:Pt=[stripAt[0]+len,stripAt[1]];
  // the pan starts on the event and brakes before the cut, slow enough that day cells never strobe
  const pan=view==='launch-calendar'?ease(raw({start:e61.start,end:Math.min(e61.start+2.2,shot.start_s+shot.duration_s-.25)})):1;
  const offX=-pan*(len-760);
  const hang=view==='launch-calendar'?clamp((t-(shot.start_s+shot.duration_s-.6))/.6)*.3:attrib;
  const strip=<>
   <At p={stripAt} s={cs}><WestTexasSupport part="calendar" pal={pal}/></At>
   <At p={[endPt[0]-150,endPt[1]+112]}>{tag(["Per AEP's",'wildfire lead'],'ink',hang,{side:'right',drop:30,scale:v==='a'?1:.95})}</At>
  </>;
  const body=v==='a'
   ?<g data-world="a-shelter-wall"><Grounded baseY={1180} on={fr!=='close'}><At p={[600,1180]} s={2.2}><WestTexasSupport part="shelter" w={1100}/></At></Grounded>{strip}</g>
   :<g data-world="b-truck-cab"><WestTexasSupport part="cab" visorDown={1} wide={300}/>{strip}</g>;
  pic=view==='launch-calendar'?<g transform={`translate(${offX} 0)`}>{body}</g>
   :<Cam f={[endPt[0]-40,endPt[1]+120]} s={v==='a'?1.45:1.6} a={[560,700]}>{body}</Cam>;
  break;}
 case 'record-card':
 case 'empty-field':{
  // s7: the blank response record lands on a desk; its how-much-sooner field pulses and stays empty.
  const rest:Pt=[230,800];
  const e=slide;
  const cardAt:Pt=v==='a'?mix([610,800],rest,e):mix([-150,800],rest,e);
  const pulseOn=view==='empty-field'?pulse:0;
  const scene7=recordScene(view==='record-card'?cardAt:rest,1,pulseOn);
  const f=RECORD.field;
  pic=view==='record-card'?<Cam f={[540,800]} s={v==='a'?1:1.12} a={[540,780]}>{scene7}</Cam>
   :<Cam f={[rest[0]+f[0]+f[2]/2,rest[1]+f[1]+f[3]/2]} s={2.1} a={[520,760]}>{scene7}</Cam>;
  break;}
 case 'approval-stamp':{
  // s8: the filed plan folder reaches the commission desk with its approval slot open.
  const rest:Pt=[220,760];
  const fAt:Pt=v==='a'?mix([600,760],rest,file):mix([-160,760],rest,file);
  const expected=clamp((file-.7)/.3);
  pic=<Cam f={[540,800]} s={v==='a'?1:1.12} a={[540,780]}>{deskScene({folderAt:fAt,fs:1,expected,top:700})}</Cam>;
  break;}
 case 'tower-return':
 case 'lens-return':{
  // The closing image: the region with the tower (A) or the display (B) still sweeping on above the
  // desk where the plan waits, its slot open under the outlined expected tag.
  const band=<g data-part="desk-band">
   <rect x={34} y={872} width={1012} height={424} rx={10} fill="#1C120B" opacity={.35}/>
   <svg x={40} y={866} width={1000} height={418} viewBox="40 866 1000 418" overflow="hidden">
    <rect x={40} y={866} width={1000} height={418} fill="#B9A487"/>
    {deskScene({folderAt:[250,900],fs:.8,expected:1,slotGlow:Math.sin(Math.PI*clamp(waits)),top:1180})}
   </svg>
   <rect x={40} y={866} width={1000} height={418} rx={6} fill="none" stroke={pal.ink} strokeWidth={8}/>
  </g>;
  pic=view==='tower-return'
   ?<g data-world="a-split-ending">{plains({heading,ring:[0,360],grounded:true})}{band}</g>
   :<g data-world="b-split-ending">{lens([540,560],320,ph+40*(t-41.5),((t*.5)%1))}{band}</g>;
  break;}
 default:throw new Error('Unimplemented tower alert view '+view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
/** Layout constants, exported for readers of the geometry above. */
export const TOWER_ALERT_LAYOUT={WORLD,PLUME_HEADING,ALERT_SIZE,PHONE,ringPoint};
