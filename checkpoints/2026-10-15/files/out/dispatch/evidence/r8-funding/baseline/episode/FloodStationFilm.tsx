import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT,widthOf} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import {PlaceSubject} from '../../PlaceStage';
import {LOCATOR_START_S,LOCATOR_END_S} from '../../CountyLocator';
import type {FilmRenderProps} from '../../types';
import {FloodStationHero,STATION,podPoint,type Pal,type Pt} from './FloodStationHero';
import {StreetHubSupport,PORCH} from './StreetHubSupport';

/**
 * flood-station-v1: UT San Antonio's solar flood station, as the university describes the design.
 *
 * ONE station and ONE rising waterline carry the film. The water reaches the station's lowest
 * optical mark at ankle height in the opening, crosses the second mark in the sensing scene and the
 * third in the close, and every mark it has crossed stays lit. The battery bar the sun fills, the
 * weather lamps and the amber risk lamp the chip lights all stay in their new state for the rest of
 * the film, so each later shot of the station carries what earlier shots performed.
 *
 * A: the yard-first treatment. Water creeps across a San Antonio yard past the orange ankle mark on a
 *    chain link post while the phone on the porch rail stays dark, and the warning lights it late.
 *    Then the station at the curb is found, charged, climbed, wetted, opened to its chip, followed by
 *    its radio pulse down the street to the hub, read on the hub's map, measured on its two cards,
 *    and left by the street with a dashed goal pin over the empty map on the fence.
 * B: the instrument-first treatment. It opens in the water at the post, where the lowest optical mark
 *    goes under and lights, and only then pulls back to the yard and the late phone. It reads the
 *    battery before the station, the weather lamps before the water marks, the empty server before
 *    the chip, the radio from above before the street, the hub map before the desk and the blank
 *    field card before the validation card, and it ends on the paper map with the station small at
 *    its corner and the dashed goal pin that has not landed.
 *
 * Every visible state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. The Bexar County plate stands behind every exterior shot and the hub's
 * window; this episode never paints a full-frame background. Card, map and dashboard views are wall
 * views in the registry. Disclosed illustration: no installed station, real street, hub, dashboard,
 * responder, deployment or field result.
 */

type V='a'|'b';
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const mix=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];

/** The university's reported figure, verbatim from claim c4's quote, and the bar share it sets. */
const VALIDATION={text:'98.82%',share:.9882};
/** The water level, in station units, that each part of the story leaves behind. The lowest mark
 * sits at ankle height; the level only rises. */
const LEVEL={start:-26,ankle:-66,second:-150};
/** Pod lamp from the water level: a mark lights as the water reaches it and stays lit. */
const podLit=(level:number,i:number)=>clamp((STATION.pods[i]-level)/16+.35);
const DISCLOSURE_FONT=26, DISCLOSURE_MAX=330;
function disclosureLines(text:string):string[]{
 const words=text.split(' '), lines:string[]=[];let cur='';
 for(const w of words){const next=cur?cur+' '+w:w;if(cur&&widthOf(next,DISCLOSURE_FONT,true)>DISCLOSURE_MAX){lines.push(cur);cur=w;}else cur=next;}
 if(cur)lines.push(cur);return lines;
}

const At:React.FC<{p:Pt;s?:number;r?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) scale(${s})`} opacity={o}>{children}</g>;
/** A camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,820],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A subject standing on the region's ground outdoors rides the plate's camera with its base row. */
const Grounded:React.FC<{baseY:number;on:boolean;children:React.ReactNode}>=({baseY,on,children})=>
 on?<PlaceSubject baseY={baseY}>{children}</PlaceSubject>:<g>{children}</g>;
/** Name the drawn group with its board item id, so the board binds what is actually rendered. */
const Item:React.FC<{id:string;children:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;

export const FloodStationFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Flood station film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Flood station film must read the single film frame clock');
 const pal:Pal=ad.palette, v:V=variant;
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const win=(id:string)=>requireAction(W,id);
 const p=(id:string)=>actionProgress(win(id),t);
 /** A treatment-only event: absent in the other treatment, where its view never draws it. */
 const pOpt=(id:string,fallback=1)=>W[id]?actionProgress(W[id],t):fallback;
 const raw=(w:{start:number;end:number})=>clamp((t-w.start)/(w.end-w.start));
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id, at=(s:string)=>sid===s;
 const flat=ad.flat_shots?.[sid];
 const fr=shot.framing, view=shot.view;
 const st=t-scene.start_s;
 const exterior=!scene.interior&&fr!=='overhead';

 // ---- the performed states, each read from its own event on the film clock ----
 const s1e1=p('s1-event-1'), s1e2=p('s1-event-2'), s1e3=p('s1-event-3'), s1e0=pOpt('s1-event-0');
 const s2e1=p('s2-event-1'), s2e2=p('s2-event-2'), s2e3=p('s2-event-3');
 const s3e1=p('s3-event-1'), s3e2=p('s3-event-2'), s3e3=p('s3-event-3');
 const s4e1=p('s4-event-1'), s4e2=p('s4-event-2'), s4e3=p('s4-event-3');
 const s5e1=p('s5-event-1'), s5e2=p('s5-event-2'), s5e3=p('s5-event-3');
 const s6e1=p('s6-event-1'), s6e2=p('s6-event-2'), s6e3=p('s6-event-3');
 const s7e1=p('s7-event-1'), s7e2=p('s7-event-2'), s7e3=p('s7-event-3');
 const s8e1=p('s8-event-1'), s8e2=p('s8-event-2'), s8e3=p('s8-event-3');
 const s9e1=p('s9-event-1'), s9e2=p('s9-event-2'), s9e3=p('s9-event-3');

 // ---- the station's carried state. The water only rises and nothing it has done is undone. ----
 // B's s1 design detail: the lowest, ankle-height lens goes under on s1-event-0 (no station stands in
 // the s1 yard in either treatment). s2: the prototype stands in ankle-deep water. s3: the second mark
 // goes under on s3-event-2. The close draws no station measuring anything: it is an outline.
 const level=at('s1')?lerp(LEVEL.start,LEVEL.ankle,ease(s1e0))-4*clamp(st/scene.duration_s)
  :at('s2')?LEVEL.ankle
  :at('s3')?lerp(LEVEL.ankle,LEVEL.second,s3e2)
  :LEVEL.second;
 const pods=[0,1,2,3].map(i=>podLit(level,i));
 const battery=at('s1')?.24:at('s2')?lerp(.24,1,s2e2):1;
 const weather=[0,1,2,3].map(k=>at('s1')||at('s2')?0:at('s3')?clamp(s3e3*4.2-k*1.05):1);
 const risk=['s1','s2','s3'].includes(sid)?0:at('s4')?s4e2:1;
 const station=(o:Partial<{pods:number[];battery:number;sun:number;sunStrength:number;risk:number;weather:number[];transmit:number;window:number;readings:number;wetTo:number;shadow:number}>={})=>
  <FloodStationHero part="station" pods={pods} battery={battery} risk={risk} weather={weather} wetTo={level} time={t} {...o}/>;
 const tag=(lines:string[],shown:number,o:{tone?:'ink'|'accent'|'paper'|'outline';side?:'left'|'right';scale?:number;drop?:number;size?:number}={})=>
  shown<=0?null:<g transform={`translate(0 ${-40*(o.scale??1)*(1-ease(shown))})`} opacity={clamp(shown*3)}>
   <FloodStationHero part="tag" lines={lines} pal={pal} tone={o.tone} side={o.side} scale={o.scale} drop={o.drop} size={o.size}
    swing={10*(1-ease(shown))*(o.side==='left'?1:-1)}/></g>;

 // ---- the disclosure chip; it names the county map only while the locator card is on screen ----
 const sceneList=board.scenes as unknown as {id:string;production_disclosure?:string}[];
 const namesMap=(d?:string)=>/\bMap\b/.test(d??'');
 const mapShown=t>LOCATOR_START_S&&t<LOCATOR_END_S;
 const plain=sceneList.find(s=>s.production_disclosure&&!namesMap(s.production_disclosure))?.production_disclosure??'Illustration';
 const mapped=sceneList.find(s=>namesMap(s.production_disclosure))?.production_disclosure;
 const own=scene.production_disclosure??'Illustration';
 const disclosureText=mapShown&&mapped?mapped:namesMap(own)?plain:own;
 const dLines=disclosureLines(disclosureText);
 const dW=Math.max(...dLines.map(l=>widthOf(l,DISCLOSURE_FONT,true)))+34, dH=dLines.length*32+24;
 const disclosure=<g data-disclosure="production_disclosure">
  <rect x={44} y={132} width={dW} height={dH} rx={16} fill={pal.paper} opacity={.93}/>
  {dLines.map((l,i)=><text key={i} x={60} y={164+i*32} fontFamily={FONT.body} fontSize={DISCLOSURE_FONT} fontWeight={700} fill={pal.ink}>{l}</text>)}
 </g>;

 // ---- the curbside world: far verge, a flooded street, the limestone curb and the yard ----
 type Curbside={curbY:number;streetTop:number;water?:{front:number;street?:boolean};rain?:number;grounded:boolean};
 const curbside=(o:Curbside)=>{
  const g=o.grounded;
  return <g data-world="curbside">
   <Grounded baseY={o.curbY+40} on={g}>
    <rect x={-60} y={o.streetTop-18} width={1200} height={22} fill="#8D9358"/>
    <StreetHubSupport part="street" x0={-60} x1={1140} yFar={o.streetTop} yNear={o.curbY} t={t}/>
    {o.water?.street!==false&&o.water&&<StreetHubSupport part="water" x0={-60} x1={1140} y={o.streetTop+4} depth={o.curbY-o.streetTop-2} t={t} edge="straight" opacity={.8}/>}
    <StreetHubSupport part="curb" x0={-60} y0={o.curbY} x1={1140} y1={o.curbY-6} h={20}/>
    <StreetHubSupport part="lawn" d={`M-60 ${o.curbY+20}L1140 ${o.curbY+14}L1140 1980L-60 1980Z`} box={[-60,o.curbY+14,1200,1980-o.curbY]}/>
    {o.water&&<StreetHubSupport part="water" x0={-60} x1={1140} y={o.curbY+6} depth={Math.max(8,o.water.front-o.curbY)} t={t} seed={13}/>}
   </Grounded>
  </g>;
 };
 const rain=(op=.3)=><StreetHubSupport part="rain" t={t} w={1240} h={1920} opacity={op}/>;
 /** A ring of light ripple where a grounded thing stands in water, depth px above its base. */
 const waterline=(x:number,base:number,w:number,depth:number)=>depth>0&&<g data-part="waterline">
  {[0,1].map(k=>{const ph=((t*.8+k*.5)%1);return <ellipse key={k} cx={x} cy={base-depth} rx={w*(1+ph*.9)} ry={w*(1+ph*.9)*.2} fill="none" stroke="#EFE4CC" strokeWidth={2.6} opacity={.85*(1-ph)}/>;})}
  <ellipse cx={x} cy={base-depth} rx={w} ry={w*.2} fill="none" stroke="#F6EEDC" strokeWidth={3} opacity={.9}/></g>;

 let pic:React.ReactNode;
 switch(view){
 case 'street-yard':{
  // s1 wide: the university's general example, a San Antonio yard with NO station in it. Water from
  // the flooded street tops the limestone curb and spreads across the yard; on the chain link post the
  // waterline climbs to its orange ankle mark and reaches the rain boots on the porch step while the
  // phone on the porch rail stays dark. A holds and pushes in slowly on the post. B arrives on a match
  // cut from the design detail's ankle-height lens to the post's ankle mark at the same screen spot,
  // then pulls back to the whole yard.
  const spread=s1e1;
  const front=lerp(1150,1300,ease(spread))+lerp(0,74,s1e2);
  const fence:Pt=[600,1300], fs=1.5, post:Pt=[fence[0]+175*fs,fence[1]];
  const markDepth=lerp(0,30,ease(spread))*fs+lerp(0,6,s1e2);
  const porch:Pt=[-30,1400], rail:Pt=[porch[0]+PORCH.railTop[0],porch[1]+PORCH.railTop[1]];
  const boots:Pt=[porch[0]+PORCH.w*.56,porch[1]-34];
  const bootDepth=clamp((front-1330)/40)*22;
  const world=<g>
   <Item id="s1-water">{curbside({curbY:1102,streetTop:1046,water:{front},grounded:exterior})}</Item>
   <Grounded baseY={1196} on={exterior}><At p={[1000,1196]}><StreetHubSupport part="oak" h={640} seed={9} flip/></At></Grounded>
   <Grounded baseY={fence[1]} on={exterior}><Item id="s1-post"><At p={fence} s={fs}><StreetHubSupport part="fence" x0={0} x1={350} h={300} posts={3} mark={1}/></At>
    {waterline(post[0],post[1],22,markDepth)}</Item></Grounded>
   <Grounded baseY={porch[1]} on={exterior}><At p={porch}><StreetHubSupport part="porch"/></At>
    <Item id="s1-boots"><At p={boots}><StreetHubSupport part="boots"/></At>{waterline(boots[0]+60,boots[1],70,bootDepth)}</Item>
    <Item id="s1-phone"><At p={[rail[0]+60,rail[1]-10]}><g transform="scale(.3 .11) rotate(90)"><StreetHubSupport part="phone" pal={pal} banner={0} t={t}/></g></At></Item></Grounded>
   {rain(.28)}
  </g>;
  if(v==='a'){
   const push=ease(raw({start:shot.start_s,end:shot.start_s+shot.duration_s}));
   pic=<Cam f={mix([540,980],[660,1060],push)} s={lerp(1,1.08,push)} a={mix([540,980],[600,1020],push)}>{world}</Cam>;
  }else{
   const e=ease(raw({start:shot.start_s,end:win('s1-event-1').end}));
   pic=<Cam f={mix([post[0],post[1]-39],[540,1000],e)} s={lerp(2.2,1,e)} a={mix([540,1154],[540,1000],e)}>{world}</Cam>;
  }
  break;}
 case 'phone-late':{
  // s1 close, looking down at the porch rail's wide cap board. The worn phone lies on it, dark, the
  // flood below the balusters; the warning banner slides in only now, after the water is in the yard.
  const rot=v==='a'?-10:8, at0:Pt=v==='a'?[540,950]:[560,960];
  pic=<g data-world="porch-rail">
   <Item id="s1-water"><StreetHubSupport part="water" x0={-60} x1={1140} y={1300} depth={660} t={t} edge="straight"/></Item>
   {Array.from({length:6},(_,i)=><rect key={i} x={40+i*180+(v==='a'?0:60)} y={1280} width={34} height={420} fill="#EDE6D6" stroke="#BDB2A0" strokeWidth={2}/>)}
   <path d="M-40 700L1120 676L1120 1222L-40 1252Z" fill="#F3EEE3" stroke="#BDB2A0" strokeWidth={3}/>
   <path d="M-40 1252L1120 1222L1120 1282L-40 1314Z" fill="#D5CBB8"/>
   {[[150,780],[760,1170],[930,760],[300,1200]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={30+i*8} ry={4} fill="#B8AD98" opacity={.6}/>)}
   <path d="M-40 708L1120 684" stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
   <Item id="s1-phone"><At p={at0} s={1.5} r={rot}><g transform="scale(1 .85)">
    <Item id="s1-banner"><StreetHubSupport part="phone" pal={pal} banner={s1e3} t={t}/></Item></g></At></Item>
   {rain(.22)}
  </g>;
  break;}
 case 'station-wide':{
  // s2 wide: the whole prototype station at the curb, standing in shallow water with its lowest mark
  // lit, revealed on s2-event-1 while "its researchers built a flood station" is heard. A tilts up from
  // the wet foot; B cranes down from the antenna tip to the whole station.
  const base:Pt=[500,1380], s=.86;
  const world=<g>
   {curbside({curbY:1240,streetTop:1110,water:{front:1430},grounded:exterior})}
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><Item id="s2-post"><Item id="s2-panel"><At p={base} s={s}>{station({})}</At></Item></Item></Item>
    {waterline(base[0]+8,base[1],34,-LEVEL.ankle*s)}
    <At p={[base[0]+130,base[1]-860]}>{tag(['Prototype','flood station'],s2e1,{side:'right',drop:30,scale:.9})}</At></Grounded>
   {rain(.2)}
  </g>;
  const e=ease(raw({start:shot.start_s,end:win('s2-event-1').end}));
  pic=v==='a'
   ?<Cam f={mix([base[0],base[1]-140],[540,860],e)} s={lerp(1.7,1,e)} a={mix([540,1100],[540,860],e)}>{world}</Cam>
   :<Cam f={mix([base[0]+80*s,base[1]-1080*s],[540,860],e)} s={lerp(2.0,1,e)} a={mix([560,560],[540,860],e)}>{world}</Cam>;
  break;}
 case 'panel-charge':{
  // s2 close. Low sun from the upper left reaches the small panel, a glint crosses its cells and the
  // battery bar fills cell by cell on s2-event-2 ("that charges itself from light"). B holds this close
  // through "and needs no cell tower": a far cell tower stands on the horizon behind the antenna and a
  // dashed line toward it stops halfway on s2-event-3.
  const s=v==='a'?1.6:1.85, base:Pt=v==='a'?[560,2560]:[600,2830];
  const sun=s2e2, beam=clamp(s2e2*3)*(1-.4*clamp((s2e2-.8)*5));
  const tip:Pt=[base[0]+110*s,base[1]-1146*s], towerAt:Pt=[985,1036], towerTop:Pt=[985,1036-460*.5];
  const end=mix(tip,towerTop,lerp(0,.5,ease(s2e3)));
  pic=<g data-world="panel-close">
   {v==='b'&&<Item id="s2-tower"><At p={towerAt} s={.5}><StreetHubSupport part="tower" h={420} dim={.25}/></At></Item>}
   <path d={`M-200 -200L${base[0]-28*s-200} ${base[1]-1062*s-120}L${base[0]-28*s+120} ${base[1]-1062*s+60}Z`} fill="#FFE2B6" opacity={.28*beam}/>
   <path d={`M-200 -200L${base[0]-28*s-120} ${base[1]-1062*s-40}`} stroke="#FFF1D8" strokeWidth={6} opacity={.35*beam}/>
   <Item id="s2-station"><At p={base} s={s}><Item id="s2-panel"><Item id="s2-battery">{station({sun,sunStrength:beam,shadow:0})}</Item></Item></At></Item>
   <At p={[120,560]}>{tag(['Charges from light'],s2e2,{side:'right',drop:24,scale:.85})}</At>
   {v==='b'&&s2e3>0&&<g data-part="unconnected-link"><path d={`M${tip[0]} ${tip[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="16 12" strokeLinecap="round"/>
    <circle cx={end[0]} cy={end[1]} r={13} fill="none" stroke={pal.ink} strokeWidth={5}/></g>}
   {v==='b'&&<At p={[1040,520]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:24,scale:.8})}</At>}
   {rain(.12)}
  </g>;
  break;}
 case 'no-tower':{
  // A s2 third shot. The station in the left foreground, a far cell tower on the horizon; a dashed
  // line leaves the antenna toward the tower and stops halfway with an open ring.
  const base:Pt=[300,1400], s=.9;
  const from:Pt=[base[0]+110*s,base[1]-1146*s], to:Pt=[820,1050-450*.8];
  const stop=lerp(0,.5,ease(s2e3)), end=mix(from,to,stop);
  pic=<g data-world="curbside-tower">
   {curbside({curbY:1210,streetTop:1090,water:{front:1430},grounded:exterior})}
   <Grounded baseY={1050} on={exterior}><Item id="s2-tower"><At p={[820,1050]} s={.8}><StreetHubSupport part="tower" h={420} dim={.25}/></At></Item></Grounded>
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><At p={base} s={s}><Item id="s2-panel">{station({})}</Item></At></Item></Grounded>
   {s2e3>0&&<g data-part="unconnected-link"><path d={`M${from[0]} ${from[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={6} strokeDasharray="18 13" strokeLinecap="round"/>
    <circle cx={end[0]} cy={end[1]} r={15} fill="none" stroke={pal.ink} strokeWidth={6}/></g>}
   <At p={[780,760]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:28,scale:.95})}</At>
   {rain(.2)}
  </g>;
  break;}
 case 'sensor-stack':{
  // A s3 medium. The view climbs the post from the wet foot past four optical marks at four
  // different heights; each lens catches the low light as the view passes it on s3-event-1.
  const base:Pt=[520,1400], s=1.9;
  const climb=ease(s3e1);
  const glints=[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i)));
  pic=<Cam f={[540,lerp(1250,1000,climb)]} s={lerp(1.35,1,climb)} a={[540,lerp(1100,1000,climb)]}><g data-world="post-climb">
   <Item id="s3-stack"><Item id="s3-marks"><At p={base} s={s}>{station({shadow:0})}</At></Item></Item>
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+6)*s} cy={base[1]+q[1]*s} r={40*glints[i]} fill="#FFF4DA" opacity={.55*glints[i]}/>;})}
   <Item id="s3-water"><StreetHubSupport part="water" x0={-60} x1={1140} y={base[1]+level*s} depth={600} t={t} edge="straight"/></Item>
   <At p={[base[0]+120,base[1]-420*s]}>{tag(['Four optical','sensors'],s3e1,{side:'right',drop:26,scale:.9})}</At>
  </g></Cam>;
  break;}
 case 'water-marks':{
  // The signature view: the post's sensor column large, brown water rising past its marks, each mark
  // lighting as the water reaches it. B s1 opens on it as a disclosed DESIGN DETAIL with no yard,
  // fence or household around it: the lowest, ankle-height lens goes under and lights. In s3 the water
  // rises from the first mark past the second on s3-event-2 ("watch the water"), after the four lenses
  // have caught the light in turn on s3-event-1. A frames the column left of centre and holds; B frames
  // it right of centre, lower, and settles back as the lenses catch the light.
  const detail=at('s1');
  const base:Pt=detail?[520,1340]:v==='a'?[470,1380]:[650,1330];
  const s=detail?3.2:v==='a'?2.3:2.0;
  const glints=at('s3')?[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i))):[0,0,0,0];
  const ids=detail?['s1-post','s1-marks','s1-water']:['s3-stack','s3-marks','s3-water'];
  const inner=<g data-world={detail?'design-detail':'sensor-column'}>
   <Item id={ids[0]}><Item id={ids[1]}><At p={base} s={s}>{station({shadow:0})}</At></Item></Item>
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+10)*s} cy={base[1]+q[1]*s} r={52*glints[i]} fill="#FFF4DA" opacity={.5*glints[i]}/>;})}
   <Item id={ids[2]}><StreetHubSupport part="water" x0={-80} x1={1160} y={base[1]+level*s} depth={800} t={t} edge="straight" opacity={.88}/></Item>
   {!detail&&rain(.18)}
  </g>;
  pic=v==='b'&&at('s3')?<Cam f={[600,1000]} s={lerp(1.25,1,ease(s3e1))} a={[560,980]}>{inner}</Cam>:inner;
  break;}
 case 'weather-row':{
  // s3 close on the housing. Rain, temperature, humidity and light lamps come on one by one on
  // s3-event-3, each with its label, and drops fall into the rain funnel.
  const s=v==='a'?2.6:2.9, c:Pt=v==='a'?[520,860]:[500,900];
  const base:Pt=[c[0]-14*s,c[1]+865*s];
  const labels=['Rain','Temperature','Humidity','Light'];
  const lamp=(k:number):Pt=>{const H=STATION.housing;return [base[0]+(H.x+30+k*26)*s,base[1]+(H.y+92)*s];};
  pic=<g data-world="housing-close">
   <Item id="s3-stack"><Item id="s3-weather"><At p={base} s={s}>{station({shadow:0})}</At></Item></Item>
   {[0,1,2].map(k=>{const ph=(t*1.4+k*.33)%1, fx=base[0]+(STATION.housing.x+26)*s, fy=base[1]+(STATION.housing.y-44)*s;return <circle key={k} cx={fx+(k-1)*14} cy={fy-220+220*ph} r={4} fill="#D6E4EC" opacity={.7*(1-ph*.6)}/>;})}
   {labels.map((l,k)=>{const on=weather[k], y=1090+k*58, q=lamp(k);return on>0&&<g key={l} opacity={clamp(on*2)}>
    <path d={`M${80+widthOf(l,30,true)+30} ${y-10}L${q[0]} ${q[1]+26}`} stroke={pal.ink} strokeWidth={2.4} opacity={.7}/>
    <At p={[70,y-36]}><StreetHubSupport part="label" text={l} pal={pal} size={30}/></At></g>;})}
   {rain(.15)}
  </g>;
  break;}
 case 'chip-glow':{
  // s4. The housing opened: readings run in along thin traces from the four marks and the four weather
  // sensors to one small chip on s4-event-1 ("A small chip on the station runs the AI itself"). In the
  // detail framing the view pushes in on the chip and the amber risk lamp on the board, which light on
  // s4-event-2 ("so it judges flood risk"). No cable leaves the box for a server.
  const c:Pt=[520,820], s=1.25, lamp:Pt=[c[0]+70*s,c[1]+128*s];
  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s4-event-2').start})):0;
  const chipGlow=Math.max(.35*s4e1,s4e2);
  pic=<g data-world="housing-cutaway"><Cam f={mix(c,mix(lamp,[c[0]+36*s,c[1]+20*s],.5),push)} s={lerp(1,1.45,push)} a={mix(c,[540,820],push)}>
   <Item id="s4-traces"><Item id="s4-chip"><Item id="s4-risk"><At p={c} s={s}>
    <FloodStationHero part="cutaway" readings={s4e1} chip={chipGlow} risk={s4e2} battery={battery}/></At></Item></Item></Item>
  </Cam>
   <At p={[90,300]}>{tag(['Judged on','the station'],s4e2,{side:'right',drop:24,scale:.9})}</At>
  </g>;
  break;}
 case 'no-server':{
  // s4. Close (B's opening shot of the scene): the station's housing large, its window glowing as
  // readings run along its traces to the chip on s4-event-1, seen from the street. Wide (both
  // treatments' last shot, "without a central server"): the station large in the right foreground and,
  // far off on the left, a dashed outline of a central server that draws itself and stays dark on
  // s4-event-3, with nothing running between them. A low angle unlike the cell tower shot.
  if(fr==='close'){
   const base:Pt=[560,2300], s=1.5;
   pic=<g data-world="housing-window">
    <Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1,readings:s4e1,shadow:0})}</At></Item></Item></Item>
    {rain(.14)}
   </g>;
   break;
  }
  const base:Pt=[800,1430], s=1.05;
  const draw=ease(s4e3);
  pic=<g data-world="curbside-no-server">
   {curbside({curbY:1180,streetTop:1070,water:{front:1430},grounded:exterior})}
   <Item id="s4-server"><At p={[250,900]} s={.7} o={lerp(.2,1,draw)}><g opacity={1-.35*Math.sin(Math.PI*clamp(s4e3*2-1))}>
    <StreetHubSupport part="server" pal={pal} dark={1}/></g></At></Item>
   <Grounded baseY={base[1]} on={exterior}><Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1})}</At></Item></Item></Item></Grounded>
   <At p={[400,990]}>{tag(['No line to it'],clamp((s4e3-.4)/.6),{side:'right',drop:20,scale:.9})}</At>
   {rain(.18)}
  </g>;
  break;}
 case 'radio-rings':{
  // s5 at street level. Rings leave the station's antenna on s5-event-1 and travel down a street of
  // bungalows, passing a half-mile tag on a sign post at the far corner on s5-event-2.
  const base:Pt=[220,1410], s=.8, tip:Pt=[base[0]+110*s,base[1]-1146*s];
  const ringStart=v==='a'?win('s5-event-1').start:shot.start_s;
  const ring=ease(raw({start:ringStart,end:win('s5-event-2').end}));
  const corner:Pt=[700,1068];
  pic=<g data-world="street-perspective">
   <Grounded baseY={1200} on={exterior}>
    <path d="M-60 1420L500 1046L760 1046L1140 1420Z" fill="#46433F"/>
    <path d="M500 1046L760 1046" stroke="#6E6A64" strokeWidth={2}/>
    <StreetHubSupport part="water" x0={420} x1={860} y={1120} depth={220} t={t} edge="lobed" opacity={.55}/>
    <path d="M-60 1420L500 1046" stroke="#E4D6B8" strokeWidth={14}/>
    <path d="M1140 1420L760 1046" stroke="#E4D6B8" strokeWidth={14}/>
   </Grounded>
   {[[930,1150,300,4,'#D8CDB8'],[800,1092,190,7,'#CFC6B6'],[740,1066,130,12,'#E2D8C4']].map(([x,y,w,seed,c],i)=>
    <Grounded key={i} baseY={y as number} on={exterior}><At p={[x as number,y as number]}><StreetHubSupport part="house" w={w as number} seed={seed as number} color={c as string}/></At></Grounded>)}
   <Grounded baseY={1120} on={exterior}><At p={[880,1120]}><StreetHubSupport part="oak" h={420} seed={14} flip/></At></Grounded>
   <Grounded baseY={corner[1]} on={exterior}><Item id="s5-tags"><Item id="s5-halfmile"><path d={`M${corner[0]} ${corner[1]}V${corner[1]-120}`} stroke="#5E6468" strokeWidth={6}/>
    <At p={[corner[0],corner[1]-120]}>{tag(['More than','a half-mile'],s5e2,{side:'right',drop:18,scale:.78,tone:'accent'})}</At></Item></Item></Grounded>
   <Item id="s5-ring"><At p={tip}><StreetHubSupport part="rings" p={ring} rx={900} ry={420} n={3} pal={pal}/></At></Item>
   <Grounded baseY={base[1]} on={exterior}><Item id="s5-antenna"><At p={base} s={s}>{station({transmit:s5e1>0&&s5e1<1?s5e1:0})}</At></Item></Grounded>
   {rain(.15)}
  </g>;
  break;}
 case 'radio-open':
 case 'hub-wide':{
  // s5 open country. A wide ring rolls in across open fields from the station's side; the leading ring
  // arrives at the hub's rooftop mast at the middle of s5-event-3 and the mast lamp lights as it does,
  // as the five-mile tag pins ("up to five miles in open country, to a hub").
  const hubAt:Pt=view==='radio-open'?[730,1210]:[560,1290], hs=view==='radio-open'?.62:1.0;
  const origin:Pt=[-260,view==='radio-open'?900:960], rx=1500, ry=700;
  const mast:Pt=[hubAt[0]+(-126)*hs,hubAt[1]+(-622)*hs];
  const arrive=Math.hypot((mast[0]-origin[0])/rx,(mast[1]-origin[1])/ry);   // the leading ring's u at the mast
  const e3=win('s5-event-3'), tm=(e3.start+e3.end)/2;
  const ringP=clamp((t-shot.start_s)/(tm-shot.start_s)*arrive/1.44);
  const lead=ringP*1.44, lamp=clamp((lead-arrive)/.06);
  const fenceY=view==='radio-open'?1150:1180;
  pic=<g data-world="open-country">
   <Grounded baseY={1120} on={exterior}>
    <StreetHubSupport part="lawn" d="M-60 1060L1140 1050L1140 1980L-60 1980Z" box={[-60,1050,1200,930]} seed={23}/>
    {Array.from({length:6},(_,i)=><path key={i} d={`M${-60+i*240} 1980L${300+i*90} 1060`} stroke="#7E8A4A" strokeWidth={22} opacity={.35}/>)}
    <path d="M-60 1120Q500 1100 1140 1140" stroke="#C9B994" strokeWidth={18} fill="none"/>
   </Grounded>
   <Grounded baseY={fenceY} on={exterior}><At p={[80,fenceY]} s={.8}><StreetHubSupport part="fence" x0={0} x1={420} h={260} posts={4} mark={-1}/></At></Grounded>
   <Item id="s5-hub"><Grounded baseY={hubAt[1]} on={exterior}><At p={hubAt} s={hs}><StreetHubSupport part="hub" lamp={lamp} pal={pal}/></At></Grounded></Item>
   <Item id="s5-ring"><At p={origin}><StreetHubSupport part="rings" p={ringP} rx={rx} ry={ry} n={3} pal={pal} width={7}/></At></Item>
   <Item id="s5-tags"><Item id="s5-fivemile"><At p={view==='radio-open'?[120,960]:[60,880]}>{tag(['Up to five miles','in open country'],s5e3,{side:'right',drop:22,scale:.8,tone:'accent'})}</At></Item></Item>
  </g>;
  break;}
 case 'radio-map':{
  // B s5 overhead. The street map from above: a ring leaves the station dot on s5-event-1 and spreads
  // over the city grid toward open country and the hub. The half-mile circle is a tenth of the
  // five-mile circle, and each label appears only as the ring reaches its circle.
  const m:Pt=[80,300], mw=840, mh=960, stationAt:Pt=[300,330], hubAt:Pt=[700,860];
  const lead=clamp(s5e1*1.3);
  pic=<g data-world="radio-map">
   <Item id="s5-station-dot"><Item id="s5-ring"><At p={m}><StreetHubSupport part="radiomap" w={mw} h={mh} ring={s5e1} half={.6} five={.6} hub={0} pal={pal} station={stationAt} hubAt={hubAt}/></At></Item></Item>
   <Item id="s5-tags"><g opacity={clamp((lead-.1)*8)}><At p={[m[0]+stationAt[0]+90,m[1]+stationAt[1]-110]}><StreetHubSupport part="label" text="More than a half-mile" pal={pal} size={30}/></At></g>
   <g opacity={clamp((lead-.92)*12)}><At p={[m[0]+330,m[1]+mh-120]}><StreetHubSupport part="label" text="Up to five miles" pal={pal} size={30}/></At></g></Item>
  </g>;
  break;}
 case 'hub-desk':{
  // s6 inside the hub, close on the desk, so the window behind is only soft light. A: station dots
  // arrive on the dashboard and a tag names the second, larger model (s6-event-1) as a responder's
  // sleeved forearm swings down to rest. B: the dashed higher-risk outlines settle on the screen and
  // the forearm comes to rest beside it as the responders tag pins (s6-event-3).
  const scr:[number,number,number,number]=[170,630,740,470];
  const arm=v==='a'?ease(raw({start:win('s6-event-1').start,end:win('s6-event-1').end+.4})):s6e3;
  pic=<g data-world="hub-desk"><g transform="translate(0 -160)">
   <Item id="s6-dashboard"><Item id="s6-hand"><StreetHubSupport part="desk" arm={arm} screen={scr}>
    <Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones"><StreetHubSupport part="dashboard" w={scr[2]} h={scr[3]} dots={v==='a'?s6e1:1} paths={v==='a'?.15*s6e1:1} zones={v==='a'?0:s6e3} t={t} pal={pal}/></Item></Item></Item>
   </StreetHubSupport></Item></Item>
  </g>
   {v==='a'&&<At p={[640,320]}>{tag(['A second,','larger model'],s6e1,{side:'right',drop:22,scale:.85})}</At>}
   {v==='b'&&<At p={[640,320]}>{tag(['For emergency','responders'],s6e3,{side:'right',drop:22,scale:.85})}</At>}
  </g>;
  break;}
 case 'flood-paths':{
  // s6 overhead on the hub's screen. Shaded flood paths spread from the first dots along the low
  // streets (s6-event-2, "draws a map of how flooding could spread"). A: higher-risk zones outline
  // themselves and the responders tag pins (s6-event-3). B opens here: the dots arrive and the second,
  // larger model tag pins (s6-event-1) before the paths spread.
  const x=50,y=280,w=980,h=1000;
  pic=<g data-world="dashboard-screen">
   <rect x={x-26} y={y-26} width={w+52} height={h+52} rx={18} fill="#26292B" stroke="#121415" strokeWidth={4}/>
   <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
    <Item id="s6-dashboard"><Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones">
     <StreetHubSupport part="dashboard" w={w} h={h} dots={v==='a'?1:s6e1} paths={s6e2} zones={v==='a'?s6e3:0} t={t} pal={pal}/></Item></Item></Item></Item>
   </svg>
   <At p={[600,400]}>{v==='a'?tag(['For emergency','responders'],s6e3,{side:'right',drop:20,scale:.8}):tag(['A second,','larger model'],s6e1,{side:'right',drop:20,scale:.8})}</At>
  </g>;
  break;}
 case 'validation-card':
 case 'no-field-card':{
  // s7, on the wall, in clause order in both treatments. The validation card's bar fills and the
  // university's reported figure appears and holds (s7-event-1, "The university reports ninety eight
  // point eight two percent"); the initial assessments tag pins under it (s7-event-2); the field result
  // card stays blank and takes its none reported stamp only on "and no field result" (s7-event-3).
  // validation-card: the card alone, the blank card's edge beside it; its detail framing pushes in on
  // the bar end and the tag. no-field-card: both cards side by side, the blank card emphasised.
  if(view==='validation-card'){
   const push=fr==='detail'?ease(raw({start:shot.start_s,end:shot.start_s+1})):0;
   const resAt:Pt=v==='a'?[900,470]:[-330,470];
   pic=<Cam f={[560,700]} s={lerp(1,1.3,push)} a={[560,700]}><g data-world="validation-card">
    <Item id="s7-card"><Item id="s7-bar"><At p={[200,400]}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At></Item></Item>
    <Item id="s7-tag"><At p={[260,780]}>{tag(['Initial assessments','after training'],s7e2,{side:'right',drop:30,scale:.92})}</At></Item>
    <Item id="s7-card2"><Item id="s7-blank"><At p={resAt} s={.85}><StreetHubSupport part="result" stamp={0} pal={pal}/></At></Item></Item>
   </g></Cam>;
   break;
  }
  const push=fr==='detail'?ease(raw({start:shot.start_s,end:win('s7-event-3').start})):0;
  pic=<Cam f={mix([540,700],[726,700],push)} s={lerp(1,1.12,push)} a={mix([540,700],[600,700],push)}><g data-world="two-cards">
   <Item id="s7-card"><Item id="s7-bar"><At p={[40,560]} s={.62}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At></Item></Item>
   <Item id="s7-tag"><At p={[60,810]}>{tag(['Initial assessments','after training'],s7e2,{side:'right',drop:24,scale:.62})}</At></Item>
   <Item id="s7-card2"><Item id="s7-blank"><At p={[460,500]} s={.95}><StreetHubSupport part="result" stamp={s7e3} pal={pal}/></At></Item></Item>
  </g></Cam>;
  break;}
 case 'empty-map':{
  // The ONE paper street map, close: it is pinned to the chain link fence at the curb, the same map the
  // station-return wide shows. s8: it settles on the mesh (s8-event-1), a search ring sweeps it and finds
  // no installed station (s8-event-2) and the no installation tag pins (s8-event-3). B s9: the tag stays,
  // a dashed goal pin hovers and does not land (s9-event-1), a dashed ring draws itself on the empty spot
  // beneath it (s9-event-2) and the deployment goal tag pins (s9-event-3).
  const close=at('s9');
  const settle=at('s8')?ease(s8e1):1, noTown=at('s8')?s8e3:1;
  const m:Pt=[120,lerp(300,330,settle)], mw=840, mh=940;
  const sx=close?'s9':'s8';
  pic=<g data-world="paper-map-on-fence">
   <Item id={sx+'-fence'}><At p={[-40,1400]} s={2.6}><StreetHubSupport part="fence" x0={0} x1={460} h={420} posts={3} lean={1.5} mark={-1}/></At></Item>
   <Item id={sx+'-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-spot':'s8-search'}><At p={m} r={lerp(4,-1,settle)} o={clamp(settle*3+.2)}>
    <StreetHubSupport part="mapcard" w={mw} h={mh} search={at('s8')?s8e2:0} goal={close?s9e1:0} spot={close?s9e2:0} pal={pal}/></At></Item></Item></Item>
   {[[m[0]+30,m[1]+14],[m[0]+mw-34,m[1]+18]].map(([x,y2],i)=><circle key={i} cx={x} cy={y2} r={11} fill="#5A5249" stroke="#2E2A26" strokeWidth={2}/>)}
   <Item id={sx==='s8'?'s8-tag':'s9-notown'}><At p={[m[0]+mw-60,m[1]+40]}>{tag(['No installation','named'],noTown,{side:'left',drop:26,scale:.95,tone:'ink'})}</At></Item>
   {close&&<Item id="s9-tag"><At p={[m[0]+mw*.55+80,m[1]+mh*.48-190]}>{tag(['Deployment goal'],s9e3,{side:'right',drop:24,scale:.9,tone:'accent'})}</At></Item>}
  </g>;
  break;}
 case 'station-return':{
  // The curb again, with NO station standing there and no flood: a wet street after the rain, the
  // chain link fence and the same paper map pinned to it. B s8: the map on the fence beside the empty
  // curb (s8-event-1), a search ring sweeps it and finds nothing installed (s8-event-2), the no
  // installation tag pins (s8-event-3). A s9: the tag stays, a dashed goal pin hovers over the map and
  // does not land (s9-event-1), a dashed outline of the station draws itself at the curb where one could
  // stand, uninstalled (s9-event-2), and the deployment goal tag pins (s9-event-3).
  const close=at('s9');
  const card:Pt=[650,905], cw=300, ch=336;
  const swing=close?1:ease(s8e1), noTown=close?1:s8e3;
  const sx=close?'s9':'s8';
  pic=<g data-world="curbside-after">
   {curbside({curbY:1210,streetTop:1090,grounded:exterior})}
   <Item id={sx+'-fence'}><Grounded baseY={1330} on={exterior}><At p={[600,1330]} s={1.1}><StreetHubSupport part="fence" x0={0} x1={420} h={400} posts={3} mark={-1}/></At></Grounded></Item>
   <Item id={sx+'-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-goal':'s8-search'}><At p={card} r={lerp(10,-1,swing)} o={clamp(swing*3+.2)}>
    <StreetHubSupport part="mapcard" w={cw} h={ch} search={close?0:s8e2} goal={close?s9e1:0} pal={pal}/></At></Item></Item></Item>
   {[[card[0]+12,card[1]+6],[card[0]+cw-14,card[1]+8]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={7} fill="#5A5249"/>)}
   {close&&<Item id="s9-station"><Grounded baseY={1400} on={exterior}><At p={[360,1400]} s={.84}><FloodStationHero part="outline" p={s9e2} pal={pal}/></At></Grounded></Item>}
   <Item id={sx==='s8'?'s8-tag':'s9-notown'}><At p={[950,640]}>{tag(['No installation','named'],noTown,{side:'left',drop:20,scale:.8,tone:'ink'})}</At></Item>
   {close&&<Item id="s9-tag"><At p={[560,500]}>{tag(['Deployment goal'],s9e3,{side:'right',drop:24,scale:.85,tone:'accent'})}</At></Item>}
  </g>;
  break;}
 default:throw new Error('Unimplemented flood station view '+view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  {disclosure}
 </svg>;
};
/** Layout constants, exported for readers of the geometry above. */
export const FLOOD_STATION_LAYOUT={LEVEL,VALIDATION,STATION};
