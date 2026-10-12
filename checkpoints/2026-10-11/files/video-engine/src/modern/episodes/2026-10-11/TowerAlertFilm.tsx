import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject} from '../../PlaceStage';
import type {FilmRenderProps} from '../../types';
import {TowerCameraHero,TOWER,ALERT_SIZE,coaxPoint,type Pal,type Pt} from './TowerCameraHero';
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
 *    finds smoke, follows the card down the coax toward the crew truck, then reads the phone in a
 *    leather glove and the watch on that wrist. The beam then holds on the burning plume, and the
 *    open line runs from the truck, where the alert landed, toward a fire station badge.
 * B: the through-the-lens treatment. The film opens on the camera head and its round display, which
 *    clips the camera's own panoramic picture so the land pans as the head turns. It pulls back from
 *    the head to the whole tower, finds the smoke as it pans into the display, sends the card out of
 *    the display's edge toward the truck below and takes the alert inside the truck cab, where the
 *    dash clock and the calendar clipped under the visors carry the middle of the film.
 * Both end on one composite: the plan folder on the commission desk with its open state approval
 *    slot in a readable band across the top, and below it the whole tower (A) or the display on its
 *    head (B) still sweeping, the alert landed at the truck and the dashed line toward the
 *    responder badge stopping short.
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
type World={road:{near:[number,number,number];far:[number,number,number];bend:number;base:number};tower:Pt;ts:number;windmill:Pt;ws:number;
 truck:Pt;ks:number;shelter:Pt;ss:number;station:Pt;sts:number;
 mesquite:[Pt,number,number][];grass:[Pt,number,number,number][];plume:Pt;ring:[number,number];
 /** optional plume scale, lean and flag box offset; unset keeps the original .62, .55 and 72 */
 pls?:number;plean?:number;pflag?:number;pflagY?:number};
const WORLD:Record<V,World>={
 // THE PLATE'S PROPS ARE RESERVED GROUND. The rolling-plains plate carries a near pumpjack at frame x 683
 // to 1004, y 838 to 1040 (card05) and a far one at the left edge (card03), and the plate does not scale
 // with the episode's s5 cut-in, so that screen region is the pumpjack in every exterior shot. Nothing that
 // carries the story stands on it: plumes, beam ends, flag boxes, cards and open lines keep clear of both
 // pumpjacks, and trucks, stations and lines that would cross the near one stand in the foreground below it.
 // A: the plume stands deep on the open land left of centre, the windmill in the left foreground clear of
 // the far pumpjack, and the truck and the station, which stand only in s5, in the foreground right of the
 // smoke with open ground between, so the open line runs low across the land, under the plate's fence and
 // the pumpjack on screen. The flag box sits up the smoke column, clear of the plate's fence on screen.
 // The truck and its landed alert stay above the two-line caption band (frame y 1293 to 1421) and left of
 // the feed's button column (x 918 and right, below y 1194) in both s5 shots.
 a:{road:{near:[300,1250,150],far:[566,1022,18],bend:-40,base:1022},tower:[600,1012],ts:.76,windmill:[110,1070],ws:.95,
  truck:[380,1176],ks:.3,shelter:[668,1018],ss:.24,station:[556,1178],sts:.38,
  mesquite:[[[960,1196],240,4],[[968,1072],150,9],[[760,1110],86,21]],
  grass:[[[150,1402],260,170,2],[[880,1336],200,130,5],[[540,1490],230,150,8],[[330,1150],110,70,13]],
  plume:[205,978],ring:[420,52],pls:.45,plean:.25,pflag:34,pflagY:195},
 // B: the plume and the windmill stand deep on the open land left of the tower, and the truck and the
 // station in the foreground under the near pumpjack's screen region, so the open line runs low and level
 // below it and clear of the tower fence. The display's panorama finds the plume at heading 118, clear of
 // its own station (150), windmill (58) and tower (196).
 b:{road:{near:[220,1250,170],far:[470,1026,20],bend:30,base:1060},tower:[500,1016],ts:.78,windmill:[305,982],ws:.5,
  truck:[560,1170],ks:.3,shelter:[580,1022],ss:.2,station:[820,1245],sts:.4,
  mesquite:[[[1000,1110],210,12],[[20,1210],240,6],[[720,1052],90,17]],
  grass:[[[120,1430],240,160,3],[[700,1450],230,150,7],[[480,1520],200,130,11]],
  plume:[180,995],ring:[420,52],pls:.5,plean:0},
};
/** The plume's compass heading from its tower, computed from the world so the beam, the flag box and
 * the camera's panorama all find the same fire. */
const plumeHeading=(w:World)=>{const dx=(w.plume[0]-w.tower[0])/w.ts, dy=(w.plume[1]-w.tower[1])/w.ts;
 return ((Math.atan2(-dx/w.ring[0],dy/w.ring[1])*180/Math.PI)%360+360)%360;};
const PLUME_HEADING:Record<V,number>={a:plumeHeading(WORLD.a),b:plumeHeading(WORLD.b)};
/** The panorama's pixels per degree of heading and its horizon below the display centre. */
const PPD=2.5, PANO_H=50;
const panoX=(h:number,heading:number)=>(((h-heading)%360+540)%360-180)*PPD;
/** The truck's driver window, in the truck's own units, where the alert lands. */
const WINDOW:Pt=[-47,-177];
const DISCLOSURE_FONT=26, DISCLOSURE_MAX=300;
/** A s5, one place across the 25.025 s cut. Both shots draw the same world with the same landmarks:
 * the windmill, the tower, the shelter, the burning plume, the truck parked with the alert that landed
 * on its window in s3 and the station with its badge. The open-line shot is a cut-in on that world:
 * scale k about a point on the plate's horizon (frame row 972 at the medium zoom), centred toward the
 * truck and the station, so every landmark keeps its place and nothing arrives unseen. The badge and
 * line are drawn at bs in world units, and the line runs low (lift) so its OPEN_LINE_STOP end stays
 * about 48 px short of the badge. The plate keeps its own medium zoom under the cut-in, so the cut-in
 * centre and factor keep the plume clear of the plate's fence, the station and the line under the near
 * pumpjack, the truck left of the feed's button column and the tower and windmill in frame. */
/** The share of the open line's curve drawn at full reach, so its end stops short of the badge. */
const OPEN_LINE_STOP=.64;
/** PlaceStage's medium framing zoom, about frame (540,960), which grounded subjects ride. */
const ZOOM_MEDIUM=1.08;
/** A's s5: the line stops at .45 of its curve so about 87 screen px (31 phone px) of open land separate
 * its ring from the badge in the 1.3 cut-in, and lw draws it heavier than the small badge. */
const A_S5={bs:.42, lw:.9, stop:.45, lift:40, horizon:972.4, cutIn:{x:430,k:1.3}};
/** The can share tag pinned under the badge, at a readable size on screen in each treatment's s5 shot:
 * above the caption band and left of the feed's button column in both. In B it hangs from the badge
 * post across the upper left of the station's face, since the truck and the button column leave no
 * open ground beside the station that fits it at this size. */
const SHARE_TAG={a:{scale:.6,side:'left' as const,drop:40},b:{scale:.75,side:'left' as const,drop:52}};
/** s1's smoke: the world plume's height range (grow held at 1 so its lower tones keep their full
 * opacity) and the display plume's grow range; both rise on s1-event-3. s3 opens on the same risen
 * fire: A's s3 plume keeps s1's h 300 at full grow, and B's display plume resumes at s1's last grow. */
const S1_WISP={h:{a:[130,300],b:[130,270]} as Record<'a'|'b',[number,number]>, display:[.45,.75] as [number,number]};
const S3_FROM:Record<'a'|'b',number>={a:1,b:S1_WISP.display[1]};
/** B's s5 open line and both closing lines run low and level under the near pumpjack's screen region.
 * Each stops at half its curve or less, so an empty run of land plainly separates the open ring from the
 * badge: about 85 native px in B's s5 wide and about 65 in the closing composites. B's s5 line is drawn
 * heavier (lw) than its badge (bs), which stays small enough to sit below the near pumpjack's region. */
const B_S5_LINE={bs:.85,lw:1.4,lift:20,stop:.42}, CLOSE_LINE={bs:.5,lift:20,stop:.5};
/** PlaceStage's close framing zoom, about frame (540,960), which grounded subjects ride. */
const ZOOM_CLOSE=1.18;
/** The crew pickup's white paint, as the support module paints the truck. */
const WT_WHITE='#ECE8DF';
/** The record card's arrival field, in the card's own units, as the support module's RecordCard draws it. */
const ARRIVAL_FIELD=RECORD.arrival;
/** Wrap the disclosure to measured lines so its box is sized from its text. */
function disclosureLines(text:string):string[]{
 const words=text.split(' '), lines:string[]=[];let cur='';
 for(const w of words){const next=cur?cur+' '+w:w;if(cur&&widthOf(next,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=next;}
 if(cur)lines.push(cur);return lines;
}

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
 const prevent=p('s5-event-1'), line=p('s5-event-2');
 const e61=win('s6-event-1'), scroll=p('s6-event-1'), attrib=p('s6-event-2');
 const slide=p('s7-event-1'), pulse=raw(win('s7-event-2'));
 const file=p('s8-event-1'), waits=p('s8-event-2');
 // ---- each scene's third performed event, read from its own window on the film clock ----
 const rise=p('s1-event-3'), stamp=p('s2-event-3'), markLand=p('s4-event-3'), share=p('s5-event-3');
 const check=p('s6-event-3'), arrival=raw(win('s7-event-3')), expectPin=p('s8-event-3');

 // ---- the head's heading. s1: the scanning head is already turning at the frame's start and one
 // full revolution is exactly s1-event-1 (a constant-speed, linear event), then it slows to a slow
 // scan. s3 swings onto the smoke and holds; s5 holds on the burning plume; s8 sweeps on.
 const ph=PLUME_HEADING[v];
 const dur11=e11.end-e11.start, w0=360/dur11, w1=40;
 // B's head then eases to a slow 10 degree a second drift (same speed at the join), so the camera's
 // display keeps the rising wisp near its centre through the cut.
 const bSettle=55, bDrift=10, bT=bSettle/Math.max(1,w0-bDrift);
 const scan1=t<=e11.end?90+360*(t-e11.start)/dur11
  :v==='b'?450+bSettle*(1-Math.exp(-(t-e11.end)/bT))+bDrift*(t-e11.end)
  :450+w1*(t-e11.end)+(w0-w1)*.5*(1-Math.exp(-(t-e11.end)/.5));
 const heading=at('s1')?scan1
  :at('s3')?(t<e31.start?ph-70:lerp(ph-70,ph,ease(raw({start:e31.start,end:lerp(e31.start,e31.end,.6)}))))
  :at('s8')?ph+40*(t-scene.start_s-2.5)
  :ph;
 const fan=t*110, vane=10*Math.sin(t*.7)+4*Math.sin(t*1.9), sway=.35*Math.sin(t*1.1);
 // s1: a small dark wisp stands on the horizon from the start and visibly rises on its own event; s3
 // opens on that risen fire and grows it on.
 const s1H=lerp(S1_WISP.h[v][0],S1_WISP.h[v][1],ease(rise)), s1Display=lerp(S1_WISP.display[0],S1_WISP.display[1],ease(rise));
 const plumeGrow=at('s3')?lerp(S3_FROM[v],1,clamp((t-scene.start_s+.1)/1.6)):1;

 // ---- shared drawings ----
 const tag=(lines:string[],tone:'ink'|'accent'|'paper'|'outline',shown:number,o:{swing?:number;drop?:number;side?:'left'|'right';scale?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${-60*(o.scale??1)*(1-ease(shown))})`} opacity={clamp(shown*3)}>
   <TowerCameraHero part="tag" lines={lines} tone={tone} pal={pal} drop={o.drop??34} side={o.side} scale={o.scale}
    swing={(o.swing??0)+14*(1-ease(shown))*(o.side==='left'?1:-1)}/></g>;
 const dLines=disclosureLines(scene.production_disclosure??'Illustration');
 const dW=Math.max(...dLines.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34, dH=dLines.length*32+24;
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={44} y={132} width={dW} height={dH} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;
 const towerPt=(local:Pt):Pt=>[Wd.tower[0]+local[0]*Wd.ts,Wd.tower[1]+local[1]*Wd.ts];
 const windowPt=(truck:Pt,ks:number):Pt=>[truck[0]+WINDOW[0]*ks,truck[1]+WINDOW[1]*ks];
 const flagOnPlume=(base:Pt,s:number,lock:number,dx=72,dy=150)=><At p={[base[0]+dx*s,base[1]-dy*s]}><TowerCameraHero part="flag" w={190*s} h={290*s} lock={lock} pal={pal}/></At>;

 /** The open line: from the landed alert at the truck window toward the responder badge on its
  * station, stopping short and open, with the can share tag pinned to the badge's own post. bs sizes
  * the badge, post, line and tag in the caller's units and stop is the share of the curve the line
  * covers at full reach, and lift sets how far the curve rises above the higher end; lw sizes the line's
  * strokes, dash and open ring when they need to read heavier than the badge. The stop leaves a clear
  * gap before the badge at every caller: about 48 native px in A's s5 cut-in, about 85 in B's s5 wide
  * and about 65 in both closing composites, since the alert reaches the crew and no source says it
  * reaches responders. */
 const openLine=(from:Pt,station:Pt,sts:number,reachP:number,shareShown:number,o:{bs?:number;lw?:number;stop?:number;lift?:number;share?:{scale:number;side:'left'|'right';drop:number}}={})=>{
  const bs=o.bs??1, lw=o.lw??bs, stop=o.stop??OPEN_LINE_STOP;
  const roof=station[1]-206*sts, badge:Pt=[station[0],roof-74*bs];
  const ctrl:Pt=[(from[0]+badge[0])/2,Math.min(from[1],badge[1])-(o.lift??140)*bs];
  const pts=Array.from({length:41},(_,i)=>bez(from,ctrl,badge,stop*reachP*i/40)), end=pts[pts.length-1];
  const dash=`${22*lw} ${16*lw}`;
  return <g data-part="open-line-and-badge">
   <line x1={badge[0]} y1={badge[1]+44*bs} x2={badge[0]} y2={roof+4} stroke={pal.ink} strokeWidth={4*bs}/>
   <circle cx={badge[0]} cy={badge[1]} r={46*bs} fill="#B33A2B" stroke={pal.paper} strokeWidth={6*bs}/>
   <path transform={`translate(${badge[0]} ${badge[1]+6*bs})`+(bs!==1?` scale(${bs})`:'')} d="M-24 10Q-24 -22 0 -22Q24 -22 24 10H32V16H-32V10Z" fill={pal.paper}/>
   {reachP>0&&<g data-part="open-line">
    <path d={'M'+pts.map(q=>q.join(' ')).join('L')} stroke={pal.paper} strokeWidth={10*lw} strokeDasharray={dash} fill="none" strokeLinecap="round"/>
    <path d={'M'+pts.map(q=>q.join(' ')).join('L')} stroke={pal.accent} strokeWidth={5*lw} strokeDasharray={dash} fill="none" strokeLinecap="round"/>
    <circle cx={end[0]} cy={end[1]} r={13*lw} fill="none" stroke={pal.accent} strokeWidth={5*lw}/>
   </g>}
   <At p={[badge[0]+3*bs,badge[1]+50*bs]}>{tag(['Can share'],'paper',shareShown,o.share??{side:badge[0]>600?'left':'right',drop:12,scale:.8*bs})}</At>
  </g>;
 };
 /** The landed alert, pinned to the truck's driver window. */
 const landedAlert=(truck:Pt,ks:number,s=.42)=>{const w=windowPt(truck,ks);
  return <At p={[w[0],w[1]-10]} s={s} r={-4}><TowerCameraHero part="alert" glow={.6} pal={pal}/></At>;};

 /** The dry country, the windmill, the shelter, the fence and the tower with its sweep. */
 /** truckLast draws the truck after the plants: it stands nearer than the mesquite and grass tuft
  * behind it, so they never cross it. */
 const plains=(o:{heading:number;ring?:[number,number];beam?:number;lamp?:number;shimmer?:number;plume?:number;flag?:number;truck?:boolean;truckGlow?:number;truckLast?:boolean;station?:boolean;grounded:boolean;front?:React.ReactNode;alert?:boolean;toPlume?:boolean;plumeH?:number})=>{
  const T=Wd.tower, g=o.grounded;
  const [rx,ry]=Wd.ring;
  // toPlume: the watch ring keeps its own radius and the held beam's wedge is scaled so its tip lands on
  // the plume's base, which stands beyond the ring. The ring-only sweep is given a heading on the other
  // side of the tower from its layer so it draws no wedge of its own.
  const reach=Math.hypot((Wd.plume[0]-T[0])/Wd.ts/rx,(Wd.plume[1]-T[1])/Wd.ts/ry);
  const sweep=(layer:'back'|'front')=>!o.toPlume
   ?<TowerCameraHero part="sweep" heading={o.heading} rx={rx} ry={ry} layer={layer} ring={o.ring} strength={o.beam??1}/>
   :<g><TowerCameraHero part="sweep" heading={layer==='front'?180:0} rx={rx} ry={ry} layer={layer} ring={o.ring} strength={o.beam??1}/>
    <TowerCameraHero part="sweep" heading={o.heading} rx={rx*reach} ry={ry*reach} layer={layer} strength={o.beam??1}/></g>;
  const truckEl=o.truck&&<Grounded baseY={Wd.truck[1]} on={g}><At p={Wd.truck} s={Wd.ks}><WestTexasSupport part="truck" glow={o.truckGlow}/></At>
    {o.alert&&landedAlert(Wd.truck,Wd.ks)}</Grounded>;
  return <g data-world={v==='a'?'a-plains-ground-up':'b-plains-cab-side'}>
   <Grounded baseY={Wd.road.base} on={g}><WestTexasSupport part="road" near={Wd.road.near} far={Wd.road.far} bend={Wd.road.bend}/></Grounded>
   {Wd.mesquite.filter(([pt])=>pt[1]<1080).map(([pt,h,seed],i)=><Grounded key={'mf'+i} baseY={pt[1]} on={g}><At p={pt}><WestTexasSupport part="mesquite" seed={seed} h={h}/></At></Grounded>)}
   {o.station&&<Grounded baseY={Wd.station[1]} on={g}><At p={Wd.station} s={Wd.sts}><WestTexasSupport part="station"/></At></Grounded>}
   <Grounded baseY={Wd.windmill[1]} on={g}><At p={Wd.windmill} s={Wd.ws}><WestTexasSupport part="windmill" fan={fan} vane={vane}/></At></Grounded>
   {o.plume!==undefined&&o.plume>0&&<Grounded baseY={Wd.plume[1]} on={g}><At p={Wd.plume} s={Wd.pls??.62}><WestTexasSupport part="plume" t={t} grow={o.plume} lean={Wd.plean} h={o.plumeH??330}/></At>
    {o.flag!==undefined&&flagOnPlume(Wd.plume,Wd.pls??.62,o.flag,Wd.pflag,Wd.pflagY)}</Grounded>}
   <Grounded baseY={T[1]} on={g}>
    <At p={T} s={Wd.ts}>
     {sweep('back')}
     <At p={[-150,26]} s={.5}><WestTexasSupport part="fence" w={300} seed={5}/></At>
     <TowerCameraHero part="tower" heading={o.heading} lamp={o.lamp} shimmer={o.shimmer} time={t} dusk={.4}/>
     {sweep('front')}
    </At>
   </Grounded>
   <Grounded baseY={Wd.shelter[1]} on={g}><At p={Wd.shelter} s={Wd.ss}><WestTexasSupport part="shelter"/></At></Grounded>
   {!o.truckLast&&truckEl}
   {Wd.mesquite.filter(([pt])=>pt[1]>=1080).map(([pt,h,seed],i)=><Grounded key={'mn'+i} baseY={pt[1]} on={g}><At p={pt}><WestTexasSupport part="mesquite" seed={seed} h={h}/></At></Grounded>)}
   {Wd.grass.map(([pt,w,h,seed],i)=>(!o.truckLast||pt[1]<Wd.truck[1])&&<At key={'g'+i} p={pt}><WestTexasSupport part="grass" seed={seed} w={w} h={h} sway={sway}/></At>)}
   {o.truckLast&&truckEl}
   {o.truckLast&&Wd.grass.map(([pt,w,h,seed],i)=>pt[1]>=Wd.truck[1]&&<At key={'gn'+i} p={pt}><WestTexasSupport part="grass" seed={seed} w={w} h={h} sway={sway}/></At>)}
   {o.front&&<Grounded baseY={Wd.station[1]} on={g}>{o.front}</Grounded>}
  </g>;
 };
 /** A s5's one world for both of its shots: the plume burning with its flag locked, the limit tag on
  * the tower leg, the windmill, the truck with its landed alert and the station with its badge. reach
  * is the open line's progress, shareOn the can share tag's own pin; tagScale keeps the limit tag at
  * its first size inside the cut-in. */
 const aS5=(reach:number,shareOn:number,tagScale=1)=>{
  const leg=towerPt([-46,-520]), w=windowPt(Wd.truck,Wd.ks);
  return plains({heading,ring:[0,360],plume:1,flag:1,truck:true,truckGlow:1,alert:true,truckLast:true,station:true,grounded:true,toPlume:true,
   front:<>
    <At p={leg}>{tag(["Doesn't","prevent fires"],'accent',prevent,{side:'left',drop:34,scale:tagScale})}</At>
    {openLine([w[0]+20,w[1]-18],Wd.station,Wd.sts,reach,shareOn,{bs:A_S5.bs,lw:A_S5.lw,stop:A_S5.stop,lift:A_S5.lift,share:SHARE_TAG.a})}
   </>});
 };

 /** The commission desk with the plan folder, its open slot and the outlined expected tag. */
 const deskScene=(o:{folderAt:Pt;fs:number;expected:number;slotGlow?:number;top:number})=>{
  const clip:Pt=[o.folderAt[0]+FOLDER.clip[0]*o.fs,o.folderAt[1]+(FOLDER.clip[1]-60)*o.fs];
  return <g data-world="commission-desk">
   <WestTexasSupport part="desk" top={o.top}/>
   <At p={o.folderAt} s={o.fs}><WestTexasSupport part="folder" pal={pal} slotGlow={o.slotGlow}/></At>
   <At p={clip}>{tag(['Expected','January 2027'],'outline',o.expected,{side:'right',drop:30,scale:o.fs*1.1})}</At>
  </g>;
 };
 /** The response record lying on the crew truck's lowered tailgate: the utility's side, no desk.
  * arrivalOn pulses an outline around the empty arrival field, which keeps nothing in it. */
 const recordScene=(cardAt:Pt,cs:number,pulseOn:number,arrivalOn=0)=><g data-world="record-tailgate">
  <WestTexasSupport part="tailgate" top={700}/>
  {/* the white service body's rear compartments and tail lamps either side of the tailgate */}
  {[[-40,110],[970,1120]].map(([x0,x1],i)=><g key={i} data-part="service-body-rear">
   <rect x={x0} y={560} width={x1-x0} height={780} fill={WT_WHITE} stroke="#8D877C" strokeWidth={3}/>
   {[600,820].map(y=><rect key={y} x={x0+18} y={y} width={x1-x0-36} height={190} rx={6} fill="none" stroke="#B3AEA4" strokeWidth={2.4}/>)}
   {[690,910].map(y=><rect key={y} x={(x0+x1)/2-16} y={y} width={32} height={8} rx={3} fill="#8D877C"/>)}
   <rect x={x0+22} y={1060} width={x1-x0-44} height={120} rx={8} fill="#A3241B" stroke="#5E1610" strokeWidth={2}/>
   <rect x={x0+30} y={1068} width={x1-x0-60} height={22} rx={5} fill="#E8A090" opacity={.6}/>
   <rect x={x0+22} y={1186} width={x1-x0-44} height={36} rx={6} fill="#E59A2A"/>
  </g>)}
  <At p={cardAt} s={cs}><WestTexasSupport part="record" pal={pal} pulse={pulseOn}/>
   {arrivalOn>0&&arrivalOn<1&&<rect x={ARRIVAL_FIELD[0]-8} y={ARRIVAL_FIELD[1]-8} width={ARRIVAL_FIELD[2]+16} height={ARRIVAL_FIELD[3]+16} rx={10}
    fill="none" stroke={pal.accent} strokeWidth={6} opacity={Math.sin(Math.PI*arrivalOn)}/>}
  </At>
 </g>;
 /** The slot card; stampOn presses an outline down onto the 16 installed header as it appears. */
 const slotsCard=(style:'tower'|'lens',lit:number,planned:number,labels:number,stampOn=-1)=>{
  const hw=widthOf('16',58,true)+14+widthOf('installed',30,true)+28, k=lerp(1.35,1,ease(clamp(stampOn*1.6)));
  return <At p={[126,300]}><WestTexasSupport part="slots" style={style} lit={lit} planned={planned} labels={labels} pal={pal}/>
   {stampOn>0&&stampOn<1&&<g transform={`translate(${16+hw/2} 54) scale(${k}) translate(${-hw/2} -38)`} opacity={Math.sin(Math.PI*stampOn)}>
    <rect x={0} y={0} width={hw} height={76} rx={10} fill="none" stroke={pal.accent} strokeWidth={6}/></g>}
  </At>;
 };
 /** The camera's round display: its own panorama of the land, clipped, panning with the heading,
  * with the plume where it stands on the compass and the flag box locked on it. */
 const lensView=(o:{c:Pt;r:number;heading:number;scan:number;glow?:number;plume?:number;lock?:number})=>{
  const px=panoX(ph,o.heading);
  return <At p={o.c}><TowerCameraHero part="lens" r={o.r} heading={o.heading} scan={o.scan} glow={o.glow??0} pal={pal}>
   <WestTexasSupport part="panorama" heading={o.heading} r={o.r} horizon={PANO_H} ppd={PPD} t={t}
    plume={o.plume!==undefined?{heading:ph,grow:o.plume}:undefined}/>
   {o.lock!==undefined&&o.lock>0&&<At p={[px+26,PANO_H-74]}><TowerCameraHero part="flag" w={120} h={170} lock={o.lock} pal={pal}/></At>}
  </TowerCameraHero></At>;
 };
 /** The tower top and camera head at a screen point, at a head scale, its base far below the frame. */
 const headAt=(at:Pt,s:number,hd:number,extra:{lamp?:number;slot?:number}={})=>
  <At p={[at[0]-TOWER.head[0]*s,at[1]-TOWER.head[1]*s]} s={s}><TowerCameraHero part="tower" heading={hd} time={t} dusk={.4} lamp={extra.lamp} slot={extra.slot}/></At>;
 /** The cab of the crew's white pickup: its white hood with the centre crease shows through the windshield
  * above the dash, the same white body the alert landed on. */
 const hood=<g data-part="white-hood">
  <path d="M30 1110L40 1050Q540 968 1040 1050L1050 1110Z" fill={WT_WHITE} stroke="#8D877C" strokeWidth={3}/>
  <path d="M60 1052Q540 978 1020 1052" stroke="#FFFFFF" strokeWidth={5} opacity={.8} fill="none"/>
  <path d="M540 990L536 1110" stroke="#B3AEA4" strokeWidth={4}/>
  <path d="M320 1012Q330 1060 326 1110M760 1012Q750 1060 754 1110" stroke="#C9C4B8" strokeWidth={3} fill="none"/>
 </g>;
 const cab=(extra:React.ReactNode,visorDown=0)=><g data-world="b-truck-cab">{hood}<WestTexasSupport part="cab" visorDown={visorDown}/>{extra}</g>;
 const gloved=(pt:Pt,s:number,bubble:number,buzz:number)=><At p={pt} s={s}>
  <WestTexasSupport part="glove" layer="back"/>
  <WestTexasSupport part="phone" bubble={bubble} buzz={buzz} pal={pal} time={t}/>
  <WestTexasSupport part="glove" layer="front"/>
 </At>;
 const buzzAfter=(w:Win)=>t>w.end?Math.exp(-(t-w.end)*5):0;
 const LENS_HEAD:Pt=[300,1060], LENS_HEAD_S=2.4;

 let pic:React.ReactNode;
 switch(view){
 case 'tower-sweep':{
  // A s1: the whole tower from the ground; one revolution leaves the dashed watch ring, a faint wisp
  // sits on the horizon. B s1: the pull back from the head to the whole tower that holds it.
  if(v==='a'){
   pic=plains({heading,ring:[90,Math.min(450,heading)],plume:1,plumeH:s1H,grounded:true});
  }else{
   const e=ease(raw({start:shot.start_s+.05,end:Math.max(e12.end,shot.start_s+2.1)}));
   const head=towerPt(TOWER.head);
   const c=pullCam(head,LENS_HEAD,head,LENS_HEAD_S/Wd.ts,1,e);
   pic=<Cam f={c.f} s={c.s} a={c.a}>{plains({heading,ring:[90,450],beam:e,truck:true,plume:1,plumeH:s1H,grounded:false})}</Cam>;
  }
  break;}
 case 'head-close':{
  // A s1 end: the head comes round to face the viewer; a West Texas tag settles on the rail.
  const head=towerPt(TOWER.head);
  const rail=towerPt([-58,TOWER.platformY-30]);
  pic=<Cam f={head} s={3.1} a={[540,520]}>
   <At p={Wd.tower} s={Wd.ts}><TowerCameraHero part="tower" heading={360+90*(1-face)} time={t} dusk={.4}/></At>
   <At p={rail}>{tag(['West Texas'],'ink',face,{side:'left',drop:22,scale:.3,swing:4*Math.sin(t*2.2)*(1-face)})}</At>
  </Cam>;
  break;}
 case 'lens-ring':{
  // B s1 open: the camera head on its tower top at the lower left and, above it, its round display:
  // the camera's own panorama pans a full revolution with the head, a faint wisp on the horizon.
  pic=<g data-world="b-lens">
   {headAt(LENS_HEAD,LENS_HEAD_S,heading)}
   {lensView({c:[600,640],r:330,heading,scan:(t*.62)%1,plume:s1Display})}
  </g>;
  break;}
 case 'camera-count':
 case 'lens-row':
 case 'plan-card':{
  const style=v==='a'?'tower':'lens';
  const counting=act==='count-cameras';
  const lit=counting?16*count:16, planned=counting?0:plan, labels=counting?ease(stamp):1;
  const card=slotsCard(style,lit,planned,labels,counting?stamp:-1);
  const tagAt:Pt=[126+SLOTS.w-420,300+SLOTS.footer+4];
  const planTag=!counting&&<At p={tagAt}>{tag(['56 planned','by February 2027'],'outline',plan,{side:'right',drop:8,scale:.82})}</At>;
  if(counting)pic=<Cam f={[540,700]} s={lerp(1,1.03,raw({start:scene.start_s,end:scene.start_s+scene.duration_s}))} a={[540,710]}>{card}</Cam>;
  // the plan close keeps the whole card, its top row of slots and its header below the disclosure label
  else pic=<Cam f={[540,772.7]} s={1.1} a={[540,760]}>{card}{planTag}</Cam>;
  break;}
 case 'plume-flag':{
  // A s3: at the tower's feet looking out; the beam crosses the land onto the plume it draws here,
  // finds the smoke and the flag box closes on it. The plume stands on open ground between the far end
  // of the plate's wire fence and its near pumpjack (plate card05, frame x 694 to 1004 at this medium
  // zoom): plume about 175 px, settled box about 112 px and the closing box at half opacity or more
  // about 26 px clear of the pumpjack, so nothing reads as a well on fire.
  const pl:Pt=[460,980], plX=540+(pl[0]-540)*ZOOM_MEDIUM;
  const aim=lerp(150,plX-5,ease(clamp(find/.62))), lock=clamp((find-.5)/.5);
  pic=<g data-world="a-tower-foot">
   <Grounded baseY={pl[1]} on><At p={pl} s={.78}><WestTexasSupport part="plume" t={t} grow={plumeGrow} h={300}/></At></Grounded>
   <Grounded baseY={1020} on><At p={[880,1020]}><WestTexasSupport part="mesquite" seed={31} h={120}/></At></Grounded>
   <path d={`M-260 -500L${aim-60} 986L${aim+70} 990Z`} fill="#FFF0CF" opacity={.22}/>
   <path d={`M-260 -500L${aim-60} 986M-260 -500L${aim+70} 990`} stroke="#FFF4DA" strokeWidth={2} opacity={.4}/>
   <At p={[pl[0]+34,pl[1]-118]}><TowerCameraHero part="flag" w={180} h={232} lock={lock} pal={pal}/></At>
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
  // B s3 and s5: the display pans onto the smoke, the flag box closes and then holds on it.
  const flagIn=view==='scope-flag';
  pic=<g data-world="b-lens">
   {lensView({c:[500,700],r:380,heading,scan:flagIn?((t*.62)%1):-1,glow:flagIn&&find>=1?.4:0,
    plume:flagIn?plumeGrow:1,lock:flagIn?clamp((find-.5)/.5):1})}
   {!flagIn&&<At p={[805,395]}>{tag(["Doesn't","prevent fires"],'accent',prevent,{side:'left',drop:40})}</At>}
  </g>;
  break;}
 case 'flag-message':{
  if(v==='a'){
   // A s3: the card lifts out of the head and runs down the coax itself toward the crew truck parked
   // well away from the tower; the truck's window lights only once the card is all but there.
   const T:Pt=[600,1250], s=1;
   const toScreen=(q:Pt):Pt=>[T[0]+q[0]*s,T[1]+q[1]*s];
   const lift=ease((t-e32.start+.3)/.3);
   const top:Pt=toScreen([TOWER.head[0],TOWER.head[1]-60]);
   const entry=toScreen(coaxPoint(.12));
   const path:Pt[]=[...Array.from({length:16},(_,i)=>bez(top,[entry[0],top[1]],entry,i/15)),
    ...Array.from({length:24},(_,i)=>toScreen(coaxPoint(lerp(.12,.36,(i+1)/24))))];
   const cardAt:Pt=send<=0?toScreen([TOWER.head[0],TOWER.head[1]-60*lift]):along(path,send);
   pic=<g data-world="a-tower-medium">
    <Grounded baseY={1240} on><At p={[800,1240]} s={.2}><WestTexasSupport part="truck" glow={clamp((send-.95)/.05)}/></At></Grounded>
    <Grounded baseY={T[1]} on><At p={T} s={s}>
     <TowerCameraHero part="tower" heading={heading} lamp={1} shimmer={1-send} time={t} slot={clamp(lift*2)} dusk={.4}/>
    </At></Grounded>
    <At p={cardAt} s={.8} r={send*-8}><TowerCameraHero part="alert" lift={1} glow={1-send} pal={pal}/></At>
    <At p={[760,1380]}><WestTexasSupport part="grass" seed={23} w={220} h={150} sway={sway}/></At>
   </g>;
  }else{
   // B s3: the card slides out of the display's lower edge and runs low, below and left of the plate's
   // near pumpjack, to the window of the truck parked below the tower; the small tower stands between
   // the display and the pumpjack. The truck rides the close framing's zoom, so the card lands on it.
   const truckB:Pt=[720,1180], kB=.26, wB=windowPt(truckB,kB);
   const from:Pt=[437,937], to:Pt=[540+(wB[0]-540)*ZOOM_CLOSE,960+(wB[1]-960)*ZOOM_CLOSE];
   const cardAt=bez(from,[560,1180],to,send);
   pic=<g data-world="b-lens-edge">
    <Grounded baseY={truckB[1]} on><At p={truckB} s={kB}><WestTexasSupport part="truck" glow={clamp((send-.95)/.05)}/></At></Grounded>
    <At p={[640,990]} s={.2}><TowerCameraHero part="tower" heading={heading} time={t}/></At>
    {lensView({c:[140,640],r:420,heading:ph,scan:-1,glow:1-send,plume:1,lock:1})}
    <At p={cardAt} s={lerp(1,.32,send)} r={lerp(-4,6,send)} o={send<.98?1:1-(send-.98)/.02}><TowerCameraHero part="alert" lift={1} glow={1-send} pal={pal}/></At>
   </g>;
  }
  break;}
 case 'crew-phone':{
  if(v==='a'){
   // A s3: the card comes in small from the distance, grows as it nears and lands as the bubble.
   const k=ease(raw({start:shot.start_s,end:e33.start}));
   pic=<g data-world="a-glove-phone">{gloved([520,700],1,land,buzzAfter(e33))}
    {land<=0&&t>=shot.start_s&&<At p={mix([640,230],[520,280],k)} s={lerp(.3,1.2,k)}><TowerCameraHero part="alert" lift={1} pal={pal}/></At>}
   </g>;
  }else{
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
  // s4: a hatched ten minute window opens on the clock from the flag mark to the message mark, up to a
  // dashed bound for "within"; the estimate tag pins only on its own event, in the closer shot.
  const r=v==='a'?150:210, C:Pt=v==='a'?[420,760]:[470,860], arm=130;
  const bound=at('s4')?clamp(windowFill*1.6):1, fillV=at('s4')?clamp((windowFill-.3)/.7):1;
  const endA=(-90+60)*Math.PI/180, endPt:Pt=[C[0]+r*.86*Math.cos(endA),C[1]+r*.86*Math.sin(endA)];
  const markPt:Pt=[C[0]+r*1.12*Math.cos(endA),C[1]+r*1.12*Math.sin(endA)];
  const tagOn=view==='estimate-pin'?estimate:0;
  const face=<>
   {v==='a'&&<g data-part="wrist">
    <path d={`M-60 ${C[1]-arm+4}Q240 ${C[1]-arm-30} ${C[0]} ${C[1]-arm}V${C[1]+arm}Q240 ${C[1]+arm+20} -60 ${C[1]+arm+8}Z`} fill="#8C8A70"/>
    <path d={`M-60 ${C[1]-arm+30}Q200 ${C[1]-arm} ${C[0]-60} ${C[1]-arm+6}`} stroke="#A9A788" strokeWidth={6} fill="none" opacity={.6}/>
    <path d={`M${C[0]} ${C[1]-arm}Q900 ${C[1]-arm-20} 1140 ${C[1]-arm+10}V${C[1]+arm+20}Q900 ${C[1]+arm+12} ${C[0]} ${C[1]+arm}Z`} fill="#B48A55"/>
    <path d={`M${C[0]+150} ${C[1]-arm-6}Q${C[0]+180} ${C[1]} ${C[0]+152} ${C[1]+arm+6}`} stroke="#7A5733" strokeWidth={5} strokeDasharray="10 8" fill="none"/>
   </g>}
   {v==='b'&&<g data-part="dash-pod"><path d={`M${C[0]-300} ${C[1]+250}Q${C[0]} ${C[1]+160} ${C[0]+300} ${C[1]+250}V1980H${C[0]-300}Z`} fill="#202122"/>
    <rect x={C[0]-90} y={C[1]+r*1.1} width={180} height={150} fill="#1A1B1B"/></g>}
   <At p={C}><WestTexasSupport part="clock" r={r} style={v==='a'?'wrist':'dash'} fill={fillV} bound={bound} pal={pal}/></At>
   {(at('s4')?markLand:1)>0&&(()=>{const m=ease(at('s4')?markLand:1);
    return <At p={[markPt[0]+r*.34,markPt[1]-r*.36-r*1.15*(1-m)]} s={r/340*(1+.3*(1-m))} r={-6-12*(1-m)} o={clamp((at('s4')?markLand:1)*2.5)}><TowerCameraHero part="alert" pal={pal}/></At>;})()}
   <At p={[endPt[0]+4,endPt[1]+4]}>{tag(['Estimated','within ten minutes'],'accent',tagOn,{side:'right',drop:40,scale:v==='a'?.62:.9})}</At>
  </>;
  const body=v==='b'?cab(face):face;
  pic=view==='clock-arc'?<Cam f={C} s={v==='a'?1.45:1} a={[C[0]+(v==='a'?60:0),v==='a'?C[1]-40:780]}>{body}</Cam>
   :<Cam f={[endPt[0]+(v==='a'?60:90),endPt[1]+40]} s={v==='a'?2.1:1.6} a={[520,700]}>{body}</Cam>;
  break;}
 case 'plume-hold':{
  // A s5: the beam holds on the plume with its flag locked while it keeps burning; the limit tag pins
  // to the tower leg. The wide already holds everything the next shot uses: the windmill, the truck
  // parked on the road with the alert that landed on its window in s3, and the station with its badge.
  pic=aS5(0,0);
  break;}
 case 'open-line':{
  // s5: the alert has landed at the crew truck's window; a dashed line runs from it toward the badge on
  // a small fire station and stops short, open. A cuts in on the same world as the plume hold, toward
  // the truck and the station, with the windmill, the tower and its limit tag still in frame; B is wide.
  if(v==='a'){
   const {x,k}=A_S5.cutIn, hz=A_S5.horizon;
   pic=<Cam f={[x,hz]} s={k} a={[540,hz]}>{aS5(line,share,1/k)}</Cam>;
   break;
  }
  pic=plains({heading,ring:[0,360],truck:true,truckGlow:1,alert:true,station:true,plume:1,grounded:true,toPlume:true,
   front:openLine([windowPt(Wd.truck,Wd.ks)[0]+20,windowPt(Wd.truck,Wd.ks)[1]-18],Wd.station,Wd.sts,line,share,{...B_S5_LINE,share:SHARE_TAG.b})});
  break;}
 case 'launch-calendar':
 case 'attribution-pin':{
  // s6: the calendar strip since launch has no red mark; the attribution tag pins at its end on its
  // own event. A: the strip on the shelter wall, wall and strip trucking together with the base out of
  // frame. B: the strip clipped under both visors, the camera held while low sun crosses it.
  // A larger six-block strip in both: A's wall trucks across on s6-event-1 and has settled before the
  // check pass on s6-event-3 starts; B's camera holds under the visors.
  // Both strips at .96 so the day cells are about 22 native px (8 phone px) in the wide. A keeps six
  // blocks on the wall it trucks across; B has four under the visors, its labels lifted clear of the
  // binder clips that grip the top edge.
  const cs=.96, blocks=v==='a'?6:4, labelLift=v==='a'?0:44;
  const len=CAL.block*blocks*cs;
  const stripAt:Pt=v==='a'?[120,930]:[130,398];
  const endPt:Pt=[stripAt[0]+len,stripAt[1]];
  const pan=v==='a'&&view==='launch-calendar'?ease(scroll):v==='a'?1:0;
  const offX=-pan*(len-760);
  const tagOn=view==='attribution-pin'?attrib:0;
  // the check pass: an outline rests on each month block in turn, from the launch end to now, and
  // none of them takes a red mark.
  const cu=check*blocks, cb=Math.min(blocks-1,Math.floor(cu)), cpos=cb+ease(clamp((cu-cb-.6)/.4))*(cb<blocks-1?1:0);
  const strip=<>
   <At p={stripAt} s={cs}><WestTexasSupport part="calendar" pal={pal} blocks={blocks} labelLift={labelLift} scan={v==='b'&&view==='launch-calendar'?scroll:-1}/></At>
   {check>0&&check<1&&<rect x={stripAt[0]+cpos*CAL.block*cs-4} y={stripAt[1]-6} width={CAL.block*cs+8} height={CAL.h*cs+12} rx={8}
    fill={pal.accent} fillOpacity={.12} stroke={pal.accent} strokeWidth={7} opacity={clamp(check*12)*clamp((1-check)*12)}/>}
   {/* clips at native x 230 and 420 under the driver visor, 660 and 820 under the passenger visor */}
   {v==='b'&&[.114,.331,.605,.788].map(f=><At key={f} p={[stripAt[0]+f*len,stripAt[1]+2]}><WestTexasSupport part="clip"/></At>)}
   {/* the attribution tag hangs wholly below the strip, pinned under its bottom edge */}
   <At p={[endPt[0]-150,stripAt[1]+CAL.h*cs+12]}>{tag(["Per AEP's",'wildfire lead'],'ink',tagOn,{side:'right',drop:v==='a'?30:40,scale:v==='a'?1:.95})}</At>
  </>;
  const body=v==='a'
   ?<g data-world="a-shelter-wall" transform={`translate(${offX} 0)`}><At p={[600,1990]} s={5}><WestTexasSupport part="shelter" w={1100}/></At>{strip}</g>
   :cab(strip,1);
  pic=view==='launch-calendar'?body
   :<Cam f={[endPt[0]-40+(v==='a'?offX:0),endPt[1]+120]} s={v==='a'?1.45:1.6} a={[560,700]}>{body}</Cam>;
  break;}
 case 'record-card':
 case 'empty-field':{
  // s7: the blank response record lies on the crew truck's tailgate; its how much sooner field pulses
  // and stays empty. No commission desk props: this is the utility's side.
  const rest:Pt=[230,780];
  const cardAt:Pt=v==='a'?mix([610,780],rest,slide):mix([-150,780],rest,slide);
  const pulseOn=view==='empty-field'?pulse:0;
  const scene7=recordScene(view==='record-card'?cardAt:rest,1,pulseOn,view==='record-card'?arrival:0);
  const f=RECORD.field;
  // the close-up holds the whole how much sooner label and its field
  const labelX=rest[0]+30;
  pic=view==='record-card'?<Cam f={[540,800]} s={v==='a'?1:1.12} a={[540,780]}>{scene7}</Cam>
   :<Cam f={[(labelX+rest[0]+f[0]+f[2])/2,rest[1]+f[1]+f[3]/2]} s={1.3} a={[540,760]}>{scene7}</Cam>;
  break;}
 case 'approval-stamp':{
  // s8: the filed plan folder reaches the commission desk with its approval slot open.
  const rest:Pt=[220,760];
  const fAt:Pt=v==='a'?mix([600,760],rest,file):mix([-160,760],rest,file);
  const expected=expectPin;
  pic=<Cam f={[540,800]} s={v==='a'?1:1.12} a={[540,780]}>{deskScene({folderAt:fAt,fs:1,expected,top:700})}</Cam>;
  break;}
 case 'tower-return':
 case 'lens-return':{
  // The closing composite. A readable band across the top holds the desk, the folder and its open
  // state approval slot under the outlined expected tag. Below it, on the land, the whole tower (A)
  // or the display on its head (B) still sweeps, the plume still burns, the alert has landed at the
  // truck's window and the dashed line toward the responder badge stops short, open.
  // the band sits low enough that its top border clears the disclosure chip (bottom y 220)
  const BAND_DY=28;
  const band=<g data-part="desk-band" transform={`translate(0 ${BAND_DY})`}>
   <rect x={34} y={212} width={1012} height={466} rx={10} fill="#1C120B" opacity={.35}/>
   <svg x={40} y={206} width={1000} height={460} viewBox="40 206 1000 460" overflow="hidden">
    <rect x={40} y={206} width={1000} height={460} fill="#B9A487"/>
    {deskScene({folderAt:[70,236],fs:.9,expected:1,slotGlow:Math.sin(Math.PI*clamp(waits)),top:560})}
   </svg>
   <rect x={40} y={206} width={1000} height={460} rx={6} fill="none" stroke={pal.ink} strokeWidth={8}/>
  </g>;
  // The truck and the station stand in the foreground below the plate's near pumpjack, clear of B's
  // display bezel and left of the feed's button column, and the open line runs low and level between them.
  const truck:Pt=[640,1190], ks=.4, station:Pt=[835,1240], sts=.34;
  // Each closing plume stands on open ground away from the plate's pumpjacks: A's left of its tower, B's
  // between its display and the near pumpjack, clear of the bezel, the truck and the feed's button column.
  const plumeAt:Pt=v==='a'?[192,990]:[610,990];
  // A's tower stands lower than it did before the band moved down, so its whip antenna (screen y about
  // 718 at the split zoom) stays about 20 px below the band's bottom border (698).
  const A_CLOSE_TOWER:Pt=[300,1056];
  const w=windowPt(truck,ks);
  const lower=<g data-part="closing-land">
   <Grounded baseY={station[1]} on><At p={station} s={sts}><WestTexasSupport part="station"/></At></Grounded>
   <Grounded baseY={plumeAt[1]} on><At p={plumeAt} s={v==='a'?.4:.45}><WestTexasSupport part="plume" t={t} grow={1} lean={v==='a'?.1:undefined} h={300}/></At></Grounded>
   {v==='a'&&<Grounded baseY={A_CLOSE_TOWER[1]} on><At p={A_CLOSE_TOWER} s={.28}>
    <TowerCameraHero part="sweep" heading={heading} rx={Wd.ring[0]} ry={Wd.ring[1]} layer="back" ring={[0,360]}/>
    <TowerCameraHero part="tower" heading={heading} time={t} dusk={.4}/>
    <TowerCameraHero part="sweep" heading={heading} rx={Wd.ring[0]} ry={Wd.ring[1]} layer="front" ring={[0,360]}/>
   </At></Grounded>}
   <Grounded baseY={truck[1]} on><At p={truck} s={ks}><WestTexasSupport part="truck" glow={1}/></At>{landedAlert(truck,ks,.46)}</Grounded>
   <Grounded baseY={station[1]} on>{openLine([w[0]+24,w[1]-20],station,sts,1,0,CLOSE_LINE)}</Grounded>
  </g>;
  pic=v==='a'?<g data-world="a-closing">{lower}{band}</g>
   :<g data-world="b-closing">{lower}{headAt([130,1130+BAND_DY],.9,heading)}{lensView({c:[310,925+BAND_DY],r:190,heading,scan:(t*.5)%1,plume:1})}{band}</g>;
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
export const TOWER_ALERT_LAYOUT={WORLD,PLUME_HEADING,ALERT_SIZE,PHONE,PPD};
