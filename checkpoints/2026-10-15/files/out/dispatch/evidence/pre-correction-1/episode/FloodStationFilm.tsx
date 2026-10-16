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
const LEVEL={start:-26,ankle:-66,second:-150,third:-240};
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
 // s1: the yard floods to ankle height (A by s1-event-1, B at its opening mark s1-event-0);
 // s3: the second mark goes under on s3-event-2; s9: the third goes under on s9-event-2.
 const ankle=v==='b'?Math.min(s1e0,1):s1e1;
 const level=t<board.scenes[0].start_s+board.scenes[0].duration_s
  ?lerp(LEVEL.start,LEVEL.ankle,ease(ankle))-4*clamp(st/scene.duration_s)
  :at('s2')?LEVEL.ankle
  :at('s3')?lerp(LEVEL.ankle,LEVEL.second,s3e2)
  :at('s9')?lerp(LEVEL.second,LEVEL.third,s9e2)
  :LEVEL.second;
 const pods=[0,1,2,3].map(i=>podLit(level,i));
 const battery=at('s1')?.24:at('s2')?lerp(.24,1,s2e2):1;
 const weather=[0,1,2,3].map(k=>at('s1')||at('s2')?0:at('s3')?clamp(s3e3*4.2-k*1.05):1);
 const risk=['s1','s2','s3'].includes(sid)?0:at('s4')?s4e2:1;
 const station=(o:Partial<{pods:number[];battery:number;sun:number;sunStrength:number;risk:number;weather:number[];transmit:number;window:number;wetTo:number;shadow:number}>={})=>
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
  <ellipse cx={x} cy={base-depth} rx={w} ry={w*.22} fill="none" stroke="#EFE4CC" strokeWidth={2.4} opacity={.8}/>
  <rect x={x-w*.7} y={base-depth} width={w*1.4} height={depth} fill="#5E452E" opacity={.35}/></g>;

 let pic:React.ReactNode;
 switch(view){
 case 'street-yard':{
  // s1 wide. Water from the flooded street tops the limestone curb and spreads across the yard; on
  // the chain link post the waterline climbs to its orange ankle mark; the phone on the porch rail
  // stays dark. A holds and pushes in slowly on the post; B pulls back from the post it opened on.
  const spread=s1e1;
  const front=lerp(1150,1330,ease(spread))+lerp(0,80,s1e2);
  const fence:Pt=[600,1360], fs=1.35, post:Pt=[fence[0]+175*fs,fence[1]];
  const markDepth=lerp(0,36,ease(spread))*fs+lerp(0,8,s1e2);
  const porch:Pt=[-30,1440], ps=.95, rail:Pt=[porch[0]+PORCH.railTop[0]*ps,porch[1]+PORCH.railTop[1]*ps];
  const world=<g>
   <Item id="s1-water">{curbside({curbY:1102,streetTop:1046,water:{front},grounded:exterior})}</Item>
   <Grounded baseY={1196} on={exterior}><At p={[1000,1196]}><StreetHubSupport part="oak" h={640} seed={9} flip/></At></Grounded>
   <Grounded baseY={1150} on={exterior}><Item id="s1-station"><At p={[520,1150]} s={.4}>{station({shadow:.6})}</At></Item></Grounded>
   <Grounded baseY={fence[1]} on={exterior}><Item id="s1-post"><At p={fence} s={fs}><StreetHubSupport part="fence" x0={0} x1={350} h={300} posts={3} mark={1}/></At>
    {waterline(post[0],post[1],18,markDepth)}</Item></Grounded>
   <Grounded baseY={porch[1]} on={exterior}><At p={porch} s={ps}><StreetHubSupport part="porch"/></At>
    <Item id="s1-phone"><At p={[rail[0]+40,rail[1]-8]}><g transform="scale(.19 .07) rotate(90)"><StreetHubSupport part="phone" pal={pal} banner={0} t={t}/></g></At></Item></Grounded>
   {rain(.28)}
  </g>;
  if(v==='a'){
   const push=ease(raw({start:shot.start_s,end:shot.start_s+shot.duration_s}));
   pic=<Cam f={mix([540,980],[640,1080],push)} s={lerp(1,1.08,push)} a={mix([540,980],[600,1040],push)}>{world}</Cam>;
  }else{
   const e=ease(raw({start:shot.start_s,end:win('s1-event-1').end}));
   pic=<Cam f={mix([520,1110],[540,1000],e)} s={lerp(2.2,1,e)} a={mix([520,1060],[540,1000],e)}>{world}</Cam>;
  }
  break;}
 case 'phone-late':{
  // s1 close. The worn phone lies on the porch rail, dark, the flood below; the warning banner
  // slides in only now, after the water is in the yard.
  const rot=v==='a'?-10:8, at0:Pt=v==='a'?[540,975]:[560,985];
  pic=<g data-world="porch-rail">
   <Item id="s1-water"><StreetHubSupport part="water" x0={-60} x1={1140} y={1150} depth={700} t={t} edge="straight"/></Item>
   {Array.from({length:6},(_,i)=><rect key={i} x={40+i*180+(v==='a'?0:60)} y={1180} width={34} height={420} fill="#EDE6D6" stroke="#BDB2A0" strokeWidth={2}/>)}
   <path d="M-40 830L1120 806L1120 1120L-40 1150Z" fill="#F3EEE3" stroke="#BDB2A0" strokeWidth={3}/>
   <path d="M-40 1150L1120 1120L1120 1182L-40 1214Z" fill="#D5CBB8"/>
   {[[180,900],[700,1060],[920,880]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx={30+i*8} ry={4} fill="#B8AD98" opacity={.6}/>)}
   <path d="M-40 838L1120 814" stroke="#FFFFFF" strokeWidth={3} opacity={.6}/>
   <Item id="s1-phone"><At p={at0} s={1.45} r={rot}><g transform="scale(1 .6)">
    <Item id="s1-banner"><StreetHubSupport part="phone" pal={pal} banner={s1e3} t={t}/></Item></g></At></Item>
   {rain(.22)}
  </g>;
  break;}
 case 'station-wide':{
  // s2 wide. The whole station at the curb, standing in shallow water with its lowest mark lit. A
  // finds it by tilting up from the foot on s2-event-1; B pulls back from the panel to the whole
  // station on s2-event-1, then a far cell tower stays unconnected on s2-event-3.
  const base:Pt=[500,1380], s=.86;
  const world=<g>
   {curbside({curbY:1240,streetTop:1110,water:{front:1430},grounded:exterior})}
   {v==='b'&&<Grounded baseY={1060} on={exterior}><Item id="s2-tower"><At p={[860,1060]} s={.62}><StreetHubSupport part="tower" h={420} dim={.2}/></At></Item></Grounded>}
   <Grounded baseY={base[1]} on={exterior}><Item id="s2-station"><Item id="s2-post"><Item id="s2-panel"><At p={base} s={s}>{station({})}</At></Item></Item></Item>
    {waterline(base[0]+8,base[1],32,-LEVEL.ankle*s)}
    <At p={[base[0]+120,base[1]-860]}>{tag(['Prototype','flood station'],s2e1,{side:'right',drop:30,scale:.9})}</At></Grounded>
   {v==='b'&&s2e3>0&&<g data-part="unconnected-link" opacity={clamp(s2e3*2)}>
    {(()=>{const from:Pt=[base[0]+110*s,base[1]-1146*s],to:Pt=[860,1060-450*.62],stop=lerp(0,.46,ease(s2e3));
     const end=mix(from,to,stop);
     return <><path d={`M${from[0]} ${from[1]}L${end[0]} ${end[1]}`} stroke={pal.ink} strokeWidth={5} strokeDasharray="16 12" strokeLinecap="round"/>
      <circle cx={end[0]} cy={end[1]} r={13} fill="none" stroke={pal.ink} strokeWidth={5}/>
      <At p={[to[0]-20,to[1]+70]}>{tag(['No cell tower','needed'],s2e3,{side:'left',drop:24,scale:.8})}</At></>;})()}
   </g>}
   {rain(.2)}
  </g>;
  const e=ease(raw({start:v==='a'?shot.start_s:shot.start_s,end:win('s2-event-1').end}));
  pic=v==='a'
   ?<Cam f={mix([base[0],base[1]-140],[540,860],e)} s={lerp(1.7,1,e)} a={mix([540,1100],[540,860],e)}>{world}</Cam>
   :<Cam f={mix([base[0]-20,base[1]-1000*s],[540,860],e)} s={lerp(1.9,1,e)} a={mix([540,700],[540,860],e)}>{world}</Cam>;
  break;}
 case 'panel-charge':{
  // s2 close. Low sun from the upper left reaches the small panel, a glint crosses its cells and the
  // battery bar fills cell by cell on s2-event-2.
  const s=v==='a'?1.6:1.85, base:Pt=v==='a'?[560,2560]:[600,2830];
  const sun=s2e2, beam=clamp(s2e2*3)*(1-.4*clamp((s2e2-.8)*5));
  pic=<g data-world="panel-close">
   <path d={`M-200 -200L${base[0]-28*s-200} ${base[1]-1062*s-120}L${base[0]-28*s+120} ${base[1]-1062*s+60}Z`} fill="#FFE2B6" opacity={.28*beam}/>
   <path d={`M-200 -200L${base[0]-28*s-120} ${base[1]-1062*s-40}`} stroke="#FFF1D8" strokeWidth={6} opacity={.35*beam}/>
   <Item id="s2-station"><At p={base} s={s}><Item id="s2-panel"><Item id="s2-battery">{station({sun,sunStrength:beam,shadow:0})}</Item></Item></At></Item>
   <At p={[120,560]}>{tag(['Charges from light'],s2e2,{side:'right',drop:24,scale:.85})}</At>
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
  // The signature view: the post's sensor column large, brown water rising past its marks, and each
  // mark lighting as the water reaches it. B s1 opens here as the lowest, ankle-high mark goes under;
  // s3 carries the water from the first mark past the second on s3-event-2.
  const base:Pt=[470,1380], s=2.3;
  const col=at('s1')?'s1':'s3';
  const settle=at('s3')&&v==='b'?ease(s3e1):1;
  const glints=at('s3')&&v==='b'?[0,1,2,3].map(i=>Math.sin(Math.PI*clamp(s3e1*4-i))):[0,0,0,0];
  const inner=<g data-world="sensor-column">
   <Item id={col+'-post'}><Item id={col+'-marks'}><Item id={col==='s3'?'s3-stack':'s1-station'}><At p={base} s={s}>{station({shadow:0})}</At></Item></Item></Item>
   {[0,1,2,3].map(i=>{const q=podPoint(i);return glints[i]>0&&<circle key={i} cx={base[0]+(q[0]+6)*s} cy={base[1]+q[1]*s} r={46*glints[i]} fill="#FFF4DA" opacity={.5*glints[i]}/>;})}
   {[0,1,2,3].map(i=>{const q=podPoint(i);return pods[i]>0&&level<STATION.pods[i]+4&&<circle key={'g'+i} cx={base[0]+(q[0]+6)*s} cy={base[1]+q[1]*s} r={70} fill="#FFE3A1" opacity={.22*pods[i]}/>;})}
   <Item id={col+'-water'}><StreetHubSupport part="water" x0={-80} x1={1160} y={base[1]+level*s} depth={760} t={t} edge="straight" opacity={.88}/></Item>
   {rain(.18)}
  </g>;
  pic=v==='b'&&at('s3')?<Cam f={[520,1000]} s={lerp(1.22,1,settle)} a={[520,1000]}>{inner}</Cam>:inner;
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
  // s4. The housing opened: readings run in along thin traces from the four marks and the four
  // weather sensors to one small chip on s4-event-1; the chip and its amber risk lamp light on
  // s4-event-2. No cable leaves the box for a server.
  const c:Pt=v==='a'?[520,820]:[520,830], s=v==='a'?1.25:1.45;
  const f:Pt=v==='a'?c:[c[0]+30*s,c[1]+30*s];
  pic=<Cam f={f} s={1} a={c}><g data-world="housing-cutaway">
   <Item id="s4-traces"><Item id="s4-chip"><Item id="s4-risk"><At p={c} s={s}>
    <FloodStationHero part="cutaway" readings={s4e1} chip={s4e2} risk={s4e2} battery={battery}/></At></Item></Item></Item>
   <At p={v==='a'?[90,290]:[90,236]}>{tag(['Judged on','the station'],s4e2,{side:'right',drop:24,scale:.9})}</At>
  </g></Cam>;
  break;}
 case 'no-server':{
  // s4 wide. The station with its glowing housing on the left; on the right a dashed outline of a
  // central server draws itself and stays dark on s4-event-3, with no line between them.
  const base:Pt=[290,1400], s=.88;
  const draw=ease(s4e3);
  pic=<g data-world="curbside-no-server">
   {curbside({curbY:1210,streetTop:1090,water:{front:1430},grounded:exterior})}
   <Grounded baseY={base[1]} on={exterior}><Item id="s4-station"><Item id="s4-chip"><Item id="s4-traces"><At p={base} s={s}>{station({window:1})}</At></Item></Item></Item></Grounded>
   <Item id="s4-server"><At p={[770,960]} s={.82} o={lerp(.25,1,draw)}><g opacity={1-.35*Math.sin(Math.PI*clamp(s4e3*2-1))}>
    <StreetHubSupport part="server" pal={pal} dark={1}/></g></At></Item>
   <At p={[760,1040]}>{tag(['No line to it'],clamp((s4e3-.4)/.6),{side:'left',drop:20,scale:.9})}</At>
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
  // s5 open country. A wide ring rolls in across open fields from the station's side; on
  // s5-event-3 it reaches the five-mile tag and lands on the hub's rooftop mast, whose lamp lights.
  const hubAt:Pt=view==='radio-open'?[730,1210]:[560,1290], hs=view==='radio-open'?.62:1.0;
  const ring=ease(raw({start:shot.start_s-.4,end:win('s5-event-3').end}));
  const fenceY=view==='radio-open'?1150:1180;
  pic=<g data-world="open-country">
   <Grounded baseY={1120} on={exterior}>
    <StreetHubSupport part="lawn" d="M-60 1060L1140 1050L1140 1980L-60 1980Z" box={[-60,1050,1200,930]} seed={23}/>
    {Array.from({length:6},(_,i)=><path key={i} d={`M${-60+i*240} 1980L${300+i*90} 1060`} stroke="#7E8A4A" strokeWidth={22} opacity={.35}/>)}
    <path d="M-60 1120Q500 1100 1140 1140" stroke="#C9B994" strokeWidth={18} fill="none"/>
   </Grounded>
   <Grounded baseY={fenceY} on={exterior}><At p={[80,fenceY]} s={.8}><StreetHubSupport part="fence" x0={0} x1={420} h={260} posts={4} mark={-1}/></At></Grounded>
   <Item id="s5-hub"><Grounded baseY={hubAt[1]} on={exterior}><At p={hubAt} s={hs}><StreetHubSupport part="hub" lamp={s5e3} pal={pal}/></At></Grounded></Item>
   <Item id="s5-ring"><At p={[-260,view==='radio-open'?900:960]}><StreetHubSupport part="rings" p={ring} rx={1500} ry={700} n={3} pal={pal} width={7}/></At></Item>
   <Item id="s5-tags"><Item id="s5-fivemile"><At p={view==='radio-open'?[120,960]:[60,880]}>{tag(['Up to five miles','in open country'],s5e3,{side:'right',drop:22,scale:.8,tone:'accent'})}</At></Item></Item>
  </g>;
  break;}
 case 'radio-map':{
  // B s5 overhead. The street map from above: a ring leaves the station dot on s5-event-1 and
  // spreads over the city grid toward open country and the hub, past the dashed range circles.
  const m:Pt=[80,300], mw=840, mh=960, stationAt:Pt=[300,330], hubAt:Pt=[700,860];
  pic=<g data-world="radio-map">
   <Item id="s5-station-dot"><Item id="s5-ring"><At p={m}><StreetHubSupport part="radiomap" w={mw} h={mh} ring={s5e1} half={.75} five={.75} hub={0} pal={pal} station={stationAt} hubAt={hubAt}/></At></Item></Item>
   <Item id="s5-tags"><At p={[m[0]+stationAt[0]+130,m[1]+stationAt[1]-40]}><StreetHubSupport part="label" text="More than a half-mile" pal={pal} size={28}/></At>
   <At p={[m[0]+330,m[1]+mh-120]}><StreetHubSupport part="label" text="Up to five miles" pal={pal} size={28}/></At></Item>
  </g>;
  break;}
 case 'hub-desk':{
  // s6 inside the hub. Station dots arrive on the dashboard (s6-event-1) as the larger model starts
  // drawing; in B the higher-risk outlines settle and a responder's sleeved forearm comes to rest
  // beside the screen (s6-event-3).
  const scr:[number,number,number,number]=[170,630,740,470];
  const arm=v==='a'?ease(raw({start:win('s6-event-1').start,end:win('s6-event-1').end+.4})):s6e3;
  pic=<g data-world="hub-desk"><g transform="translate(0 -160)">
   <Item id="s6-dashboard"><Item id="s6-hand"><StreetHubSupport part="desk" arm={arm} screen={scr}>
    <Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones"><StreetHubSupport part="dashboard" w={scr[2]} h={scr[3]} dots={v==='a'?s6e1:1} paths={v==='a'?.15*s6e1:s6e2} zones={v==='a'?0:s6e3} t={t} pal={pal}/></Item></Item></Item>
   </StreetHubSupport></Item></Item>
  </g>
   <At p={[640,330]}>{tag(['A second,','larger model'],v==='a'?s6e1:1,{side:'right',drop:22,scale:.85})}</At>
  </g>;
  break;}
 case 'flood-paths':{
  // s6 overhead on the hub's screen. Shaded flood paths spread from the first dots along the low
  // streets (s6-event-2) and higher-risk zones outline themselves (A s6-event-3; B on the desk).
  const x=50,y=280,w=980,h=1000;
  pic=<g data-world="dashboard-screen">
   <rect x={x-26} y={y-26} width={w+52} height={h+52} rx={18} fill="#26292B" stroke="#121415" strokeWidth={4}/>
   <svg x={x} y={y} width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="hidden">
    <Item id="s6-dashboard"><Item id="s6-dots"><Item id="s6-paths"><Item id="s6-zones">
     <StreetHubSupport part="dashboard" w={w} h={h} dots={v==='a'?1:s6e1} paths={s6e2} zones={v==='a'?s6e3:0} t={t} pal={pal}/></Item></Item></Item></Item>
   </svg>
   <At p={[600,400]}>{tag(['For emergency','responders'],v==='a'?s6e3:s6e2,{side:'right',drop:20,scale:.8})}</At>
  </g>;
  break;}
 case 'validation-card':
 case 'no-field-card':{
  // s7, on the wall. The validation card's bar fills to the university's reported figure
  // (s7-event-1) and the assessment tag pins under it (s7-event-2); beside it the field result card
  // stays blank and takes its none reported stamp (s7-event-3). Each shot holds one card, the other
  // in part, in the treatment's order.
  const valFirst=view==='validation-card';
  const cardAt:Pt=valFirst?[200,400]:(v==='a'?[-430,420]:[860,420]);
  const resAt:Pt=valFirst?(v==='a'?[900,470]:[-330,470]):[260,440];
  pic=<g data-world="two-cards">
   <Item id="s7-card"><Item id="s7-bar"><At p={cardAt} s={valFirst?1:.9}><StreetHubSupport part="card" fill={s7e1} value={VALIDATION.text} share={VALIDATION.share} pal={pal}/></At></Item></Item>
   <Item id="s7-tag"><At p={[cardAt[0]+60,cardAt[1]+380]}>{valFirst&&tag(['Initial assessments','after training'],s7e2,{side:'right',drop:30,scale:.92})}</At></Item>
   <Item id="s7-card2"><Item id="s7-blank"><At p={resAt} s={valFirst?.85:1.05}><StreetHubSupport part="result" stamp={s7e3} pal={pal}/></At></Item></Item>
  </g>;
  break;}
 case 'empty-map':{
  // The paper street map on the wall. s8: it settles (s8-event-1), a search ring sweeps it and finds
  // no installed pin (s8-event-2) and the no installation tag pins (s8-event-3). B s9: a dashed goal
  // pin hovers and does not land (s9-event-1), the small station at its corner lights its third mark
  // (s9-event-2) and the deployment goal tag pins (s9-event-3).
  const close=at('s9');
  const drop=at('s8')?ease(s8e1):1;
  const m:Pt=[120,lerp(220,290,drop)], mw=840, mh=980;
  pic=<g data-world="paper-map">
   <Item id={close?'s9-map':'s8-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-goal-pin':'s8-search'}><At p={m} r={lerp(-3,-1,drop)}>
    <StreetHubSupport part="mapcard" w={mw} h={mh} search={at('s8')?s8e2:0} goal={close?s9e1:0} pal={pal}/></At></Item></Item></Item>
   {close&&<Item id="s9-station"><At p={[m[0]+130,m[1]+mh-40]} s={.32}>{station({shadow:.3})}</At></Item>}
   {at('s8')&&<Item id="s8-tag"><At p={[m[0]+mw-120,m[1]+40]}>{tag(['No installation','named'],s8e3,{side:'left',drop:26,scale:.95,tone:'ink'})}</At></Item>}
   {close&&<Item id="s9-tag"><At p={[m[0]+mw*.55+80,m[1]+mh*.48-170]}>{tag(['Deployment goal'],s9e3,{side:'right',drop:24,scale:.9,tone:'accent'})}</At></Item>}
  </g>;
  break;}
 case 'station-return':{
  // The station by the street again, the paper map pinned to the chain link fence beside it. A s9:
  // a dashed goal pin hovers over the map and does not land, the water crosses the third mark and
  // the goal tag pins. B s8: the map swings onto the fence, a search ring passes over it and finds
  // no pin, and the no installation tag pins.
  const close=at('s9');
  const base:Pt=[360,1400], s=.84;
  const card:Pt=[650,905], cw=300, ch=350;
  const swing=close?1:ease(s8e1);
  pic=<g data-world="curbside-return">
   {curbside({curbY:1210,streetTop:1090,water:{front:1430},grounded:exterior})}
   <Item id={close?'s9-fence':'s8-fence'}><Grounded baseY={1330} on={exterior}><At p={[600,1330]} s={1.1}><StreetHubSupport part="fence" x0={0} x1={420} h={400} posts={3} mark={1}/></At></Grounded></Item>
   <Item id={close?'s9-map':'s8-map'}><Item id={close?'s9-goal':'s8-nopin'}><Item id={close?'s9-goal-pin':'s8-search'}><At p={card} r={lerp(14,-2,swing)} o={clamp(swing*3)}>
    <StreetHubSupport part="mapcard" w={cw} h={ch} search={close?0:s8e2} goal={close?s9e1:0} pal={pal} seed={43}/></At></Item></Item></Item>
   {[[card[0]+20,card[1]+8],[card[0]+cw-24,card[1]+12]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={7} fill="#5A5249"/>)}
   <Grounded baseY={base[1]} on={exterior}><Item id={close?'s9-station':'s8-station'}><At p={base} s={s}>{station({})}</At></Item>
    {waterline(base[0]+8,base[1],30,-level*s)}</Grounded>
   {close&&<Item id="s9-tag"><At p={[900,840]}>{tag(['Deployment goal'],s9e3,{side:'left',drop:24,scale:.85,tone:'accent'})}</At></Item>}
   {!close&&<Item id="s8-tag"><At p={[900,800]}>{tag(['No installation','named'],s8e3,{side:'left',drop:20,scale:.8,tone:'ink'})}</At></Item>}
   {rain(.14)}
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
