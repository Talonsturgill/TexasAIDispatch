import React,{createContext,useContext} from 'react';
import {Img,staticFile} from 'remotion';
import type {DispatchProps,Scene} from '../Dispatch';
import {useArtDirection} from '../lib/artDirection';
import {CountyLocator,countyName} from './CountyLocator';
import manifest from './placePlates.json';
import registry from '../../../config/modern_episode_registry.json';
import type {FilmShot} from './types';

/** County-true place for the directed film (October 9th, 2026).
 *
 * Place was the show's weakest axis, and every current-route film stood in a flat gradient. A board
 * already names each scene's county and region, ship_gate holds the region to the county's measured
 * Gould areas, and scripts/place_bake.py renders every region once in the Docket's carousel engine as
 * a SKY, one GROUND and CARDS for the things standing on it, each at its measured distance. This stage
 * draws the scene's region behind the episode:
 *
 *  - OUTDOORS the plate fills the frame and the camera moves through it. The ground moves by the exact
 *    perspective transform a camera move gives a flat ground, and each card by the rate its own
 *    distance gives, so the near oak slides past the refinery and nothing tears. The move comes from
 *    the scene's camera_strategy, as one of the manifest's profiles, never further than the share of
 *    the plate's measured limits the bake checked.
 *  - INDOORS the region is outside a window in the back wall, held still and a little out of focus,
 *    because a room in Abilene is lit by Abilene and its plants and dirt stay outside where they live.
 *    The episode's own floor and props stand in front of it as they always did.
 *  - OVERHEAD there is no horizon to show, and a WALL view (a diagram or a document its episode lists in
 *    `wall_views`) is not in a room, so for both the stage lays plain wall or the ground's own tone.
 *
 * Every camera number comes from the manifest: the plate's measured distances, focal length, limits
 * and the move profiles the bake checked. The arithmetic is place_bake.py's, line for line, and
 * tests/place_stage.mjs holds the two to the same answers. The layout constants below (the window,
 * the framings' zoom and focus, the window's grade) are design choices, each with its reason. */

type V3=[number,number,number];
export type PlaceCamera={position:V3;right:V3;up:V3;forward:V3;fov:number;fpx:number;cx:number;cy:number};
type Layer={file:string;sha256:string;bytes:number};
type Card=Layer&{x:number;y:number;w:number;h:number;depth_m:number};
export type Plate={id:string;region:string;counties?:string[];also?:string[];camera:PlaceCamera;horizon_y:number;
 sky:Layer;ground:Layer;cards:Card[];sky_rgb:number[];ground_rgb:number[];limits:{dolly_m:number;truck_m:number;rise_m:number}};
export type PlaceMove={dolly:number;truck:number;rise:number};
type Profile=Partial<Record<'dolly'|'truck'|'rise',[number,number]>>;
type Manifest={policy:{version:string;effective_date:string};moves:{share:number;profiles:Record<string,Profile>};
 plate:{w:number;h:number};film:{w:number;h:number};plates:Record<string,Plate>};
const M=manifest as unknown as Manifest;
/** On for boards dated from the effective date, or opted in by version. Both are the manifest's, which
 * place_check.py reads too. */
export const PLACE_EFFECTIVE_DATE=M.policy.effective_date,PLACE_VERSION=M.policy.version;
const PW=M.plate.w,PH=M.plate.h,FW=M.film.w,FH=M.film.h;
const OX=(PW-FW)/2,OY=(PH-FH)/2;   // where the film frame sits inside a plate

type PlaceBoard=Pick<DispatchProps,'date'>&{place?:{version?:string};__placeProbe?:boolean};
/** On for every board dated from the effective date, and for a board that opts in by version. Older
 * films render exactly as they shipped. */
export function placeActive(board:PlaceBoard):boolean{
 if(board.place?.version===PLACE_VERSION)return true;
 const date=board.date??'';
 return /^\d{4}-\d{2}-\d{2}/.test(date)&&date>=PLACE_EFFECTIVE_DATE;
}
/** WHICH PLATE. A region's own plate carries nothing that belongs to one place, since a Texan is not
 * told they live somewhere they don't: no city skyline, no refinery. A county with its own plate, as
 * Harris has Houston across Buffalo Bayou, stands in that one. A board may name a plate that lists
 * counties as `place_plate` only for a county it lists, which is how a story at a ship channel plant
 * gets the refineries and a story at the Medical Center doesn't. It may also name its region's own
 * plate, which lists none: a Harris County story out on the prairie stands in the Gulf Prairies rather
 * than in front of downtown, and the region's own plate can't put a county anywhere it isn't. A plate
 * of another region is refused. place_check.py resolves the same way. */
export type PlaceScene={region:string;county?:string;place_plate?:string};
export function plateFor(scene:PlaceScene):Plate{
 const inRegion=Object.values(M.plates).filter(p=>p.region===scene.region).sort((a,b)=>a.id.localeCompare(b.id));
 if(!inRegion.length)throw new Error('No place plate for region '+scene.region+'; bake one with scripts/place_bake.py');
 const county=countyName(scene.county);
 if(scene.place_plate){
  const p=M.plates[scene.place_plate];
  if(!p||p.region!==scene.region)throw new Error('Place plate '+scene.place_plate+' is not a '+scene.region+' plate');
  const scope=[...(p.counties??[]),...(p.also??[])].map(countyName);
  if(scope.length&&!scope.includes(county))throw new Error('Place plate '+p.id+' is not for '+scene.county+' County');
  return p;
 }
 const own=inRegion.find(p=>(p.counties??[]).map(countyName).includes(county));
 const base=inRegion.find(p=>!p.counties?.length&&!p.also?.length);
 if(!own&&!base)throw new Error('Region '+scene.region+' has no plate of its own');
 return (own??base)!;
}

// ---- the camera, place_bake.py's arithmetic ------------------------------------------------------
type M3=number[];   // a 3x3 matrix, row major
const mul=(a:M3,b:M3):M3=>[0,1,2].flatMap(r=>[0,1,2].map(c=>a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c]));
const dot=(a:number[],b:number[])=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const translate=(x:number,y:number):M3=>[1,0,x,0,1,y,0,0,1];
const scaleAbout=(s:number,x:number,y:number):M3=>[s,0,(1-s)*x,0,s,(1-s)*y,0,0,1];
export function moveVector(cam:PlaceCamera,m:PlaceMove):V3{
 const f=cam.forward,n=Math.hypot(f[0],f[2])||1,fh=[f[0]/n,0,f[2]/n];
 return [m.truck*cam.right[0]+m.dolly*fh[0],m.truck*cam.right[1]+m.rise,m.truck*cam.right[2]+m.dolly*fh[2]];
}
export function cameraMove(cam:PlaceCamera,m:PlaceMove):V3{
 const v=moveVector(cam,m);
 return [dot(cam.right,v),-dot(cam.up,v),dot(cam.forward,v)];
}
/** K (I + m n^T / h) K^-1: where a pixel of the ground plane goes when the camera moves. */
export function groundHomography(cam:PlaceCamera,mv:PlaceMove):M3{
 const m=cameraMove(cam,mv),n=[cam.right[1],-cam.up[1],cam.forward[1]],h=cam.position[1],f=cam.fpx;
 if(!(h>0))throw new Error('Place camera stands at or under its ground');
 const K=[f,0,cam.cx,0,f,cam.cy,0,0,1],Ki=[1/f,0,-cam.cx/f,0,1/f,-cam.cy/f,0,0,1];
 const A=[0,1,2].flatMap(r=>[0,1,2].map(c=>(r===c?1:0)+m[r]*n[c]/h));
 return mul(mul(K,A),Ki);
}
/** A card at `depth` metres scales about the centre and shifts. */
export function cardMatrix(cam:PlaceCamera,depth:number,mv:PlaceMove):M3{
 const m=cameraMove(cam,mv),d=Math.max(depth-m[2],1e-3),s=depth/d;
 return [s,0,(1-s)*cam.cx-cam.fpx*m[0]/d,0,s,(1-s)*cam.cy-cam.fpx*m[1]/d,0,0,1];
}
export function applyM3(H:M3,p:[number,number]):[number,number]{
 const w=H[6]*p[0]+H[7]*p[1]+H[8];
 return [(H[0]*p[0]+H[1]*p[1]+H[2])/w,(H[3]*p[0]+H[4]*p[1]+H[5])/w];
}
const ease=(u:number)=>{const p=Math.max(0,Math.min(1,u));return p*p*(3-2*p);};
/** The scene's camera, as one of the manifest's profiles at a share of the plate's measured limits. */
export function placeMove(plate:Plate,strategy:string|undefined,u:number):PlaceMove{
 const prof=strategy?M.moves.profiles[strategy]:undefined,move={dolly:0,truck:0,rise:0};
 if(!prof)return move;
 const p=ease(u),limit={dolly:plate.limits.dolly_m,truck:plate.limits.truck_m,rise:plate.limits.rise_m};
 for(const axis of ['dolly','truck','rise'] as const){
  const r=prof[axis];
  if(r)move[axis]=M.moves.share*limit[axis]*(r[0]+(r[1]-r[0])*p);
 }
 return move;
}
/** The depth of the ground under a frame row, for a subject standing there. */
export function groundDepthAt(cam:PlaceCamera,frameY:number):number{
 const v=frameY+OY,n=[cam.right[1],-cam.up[1],cam.forward[1]],dir=[0,(v-cam.cy)/cam.fpx,1];
 const t=-cam.position[1]/dot(n,dir);
 if(!(t>0))throw new Error('That row is on or above the horizon; nothing stands on the ground there');
 return t;
}
const css=(F:M3)=>`matrix3d(${F[0]},${F[3]},0,${F[6]},${F[1]},${F[4]},0,${F[7]},0,0,1,0,${F[2]},${F[5]},0,${F[8]})`;

// ---- how each framing sees it ---------------------------------------------------------------------
type Framing=FilmShot['framing'];
const ZOOM:Record<Framing,number>={wide:1,split:1.04,medium:1.08,close:1.18,detail:1.3,overhead:1};
const DEFOCUS:Record<Framing,number>={wide:0,split:0,medium:0,close:1.5,detail:3,overhead:0};
/* THE WINDOW starts below the title band, which both episodes set from y 250 to 370, so no mullion
 * ever crosses a title. A wide shot's title box sits lower, to y 419 in the October 7th film, and two
 * blind graders found the window's top rail running through it, so a wide window starts at 440.
 * Nearer framings see more of it and less sharply, as a lens focused on the subject would. */
type Window={x:number;y:number;w:number;h:number;blur:number};
const WINDOW:Record<Framing,Window>={
 wide:{x:96,y:440,w:888,h:540,blur:1.5},split:{x:40,y:410,w:1000,h:640,blur:3},
 medium:{x:40,y:410,w:1000,h:640,blur:3},close:{x:-40,y:400,w:1160,h:720,blur:6},
 detail:{x:-80,y:400,w:1240,h:760,blur:9},overhead:{x:0,y:0,w:0,h:0,blur:0}};
const HORIZON_IN_WINDOW=.55;   // eye height in a window from sill to head
/* SEEN FROM A ROOM EXPOSED FOR THE ROOM, the outside is bright and soft. That is how a camera sees a
 * window, and it is what keeps an episode's unboxed type legible over it: on October 8th the fly film
 * set plain red and teal text from y 400 to 1245, and over the marsh at full contrast the red read
 * poorly. The skyline still reads as a skyline. */
const WINDOW_GRADE='brightness(1.16) contrast(.64) saturate(.88)',WINDOW_HAZE=.3;
/* A CLOSE OR DETAIL SHOT HAS NO WINDOW, only its light. A blind grade on October 9th found a fly
 * standing as tall as a window pane and a mullion running through a glass vial: a lens that close is
 * focused on the subject, and the room behind it is out of focus colour. So nearer framings lay the
 * region as a soft wash, with no frame to cross anything. The second grade found the first wash (blur
 * 18 and 26, a third of paper over it) reading as any foggy city while it cost the thinnest marks their
 * contrast: a floor line, heat squiggles, a coral label. Half paper over a lighter blur keeps the
 * skyline nameable and gives those marks their ground back. */
const BOKEH_BLUR:Partial<Record<Framing,number>>={close:12,detail:18},BOKEH_HAZE=.55,BOKEH_ZOOM=1.2;

/** A VIEW ON THE WALL. A diagram or a document is not in a room, and a skyline behind thin lines and
 * small labels only makes them harder to read: the October 8th film's candidate diagrams were. An
 * episode lists such views as `wall_views` in config/modern_episode_registry.json and the stage draws
 * plain wall behind them. place_check.py caps the share of a film's shots that may do so. */
type Registry={episodes:Record<string,{wall_views?:string[];wash_views?:string[]}>};
const listed=(key:'wall_views'|'wash_views')=>(board:{film_direction?:{episode?:string}},view:string):boolean=>{
 const ep=board.film_direction?.episode;
 return !!ep&&((registry as unknown as Registry).episodes[ep]?.[key]??[]).includes(view);
};
export const wallView=listed('wall_views');
/** A VIEW IN THE WASH. A labelled comparison set out across the frame, two flies on their own ground
 * lines with a label over each, puts its type and its thin lines exactly where a window's rails and
 * skyline cross them. The second blind grade found the October 8th film's paired results doing so.
 * An episode lists such views as `wash_views` and the stage lays the region behind them as the soft
 * wash a close shot gets, at any framing: the place is in the light, and nothing crosses a label. */
export const washView=listed('wash_views');
export type PlaceInfo={plate:Plate;mode:'exterior'|'interior'|'overhead'|'wall';framing:Framing;move:PlaceMove;zoom:number;
 window?:Window};
const PlaceContext=createContext<PlaceInfo|undefined>(undefined);
export const usePlace=()=>useContext(PlaceContext);

const rgb=(c:number[],a=1)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const PROBE='#ff00ff';

/** The plate's layers, each placed by its own matrix F (plate pixels to the container's pixels). */
const Layers:React.FC<{plate:Plate;frame:(depth:number|'ground'|'sky')=>M3;probe:boolean}>=({plate,frame,probe})=>{
 const one=(key:string,L:Layer,F:M3,w:number,h:number)=><Img key={key} src={staticFile(L.file)} data-place-layer={key}
  style={{position:'absolute',left:0,top:0,width:w,height:h,transformOrigin:'0 0',transform:css(F)}}/>;
 if(probe)return <div data-place-probe style={{position:'absolute',left:0,top:0,width:PW,height:PH,transformOrigin:'0 0',
  transform:css(frame('sky')),background:PROBE}}/>;
 return <>
  {one('sky',plate.sky,frame('sky'),PW,PH)}
  {one('ground',plate.ground,frame('ground'),PW,PH)}
  {plate.cards.map((c,i)=>one('card'+i,c,mul(frame(c.depth_m),translate(c.x,c.y)),c.w,c.h))}
 </>;
};

export const PlaceStage:React.FC<{board:DispatchProps;scene:Scene;shot:FilmShot;time_s:number;children:React.ReactNode}>=
 ({board,scene,shot,time_s,children})=>{
 const art=useArtDirection();
 const b=board as DispatchProps&PlaceBoard;
 if(!placeActive(b))return <>{children}</>;
 const plate=plateFor(scene as Scene&PlaceScene);
 const framing=shot.framing;
 const mode=framing==='overhead'?'overhead':wallView(b,shot.view)?'wall':scene.interior?'interior':'exterior';
 const probe=b.__placeProbe===true;
 const u=(time_s-scene.start_s)/scene.duration_s;
 const move=mode==='exterior'?placeMove(plate,scene.camera_strategy,u):{dolly:0,truck:0,rise:0};
 const zoom=ZOOM[framing];
 const cam=plate.camera;
 const wall=art?.palette;
 let world:React.ReactNode;
 let info:PlaceInfo={plate,mode,framing,move,zoom};
 if(mode==='exterior'){
  const Z=scaleAbout(zoom,cam.cx,cam.cy),toFrame=translate(-OX,-OY);
  const frame=(d:number|'ground'|'sky')=>mul(toFrame,mul(Z,d==='sky'?translate(0,0):d==='ground'?groundHomography(cam,move):cardMatrix(cam,d,move)));
  world=<div style={{position:'absolute',inset:0,filter:DEFOCUS[framing]?`blur(${DEFOCUS[framing]}px)`:undefined}}>
   <Layers plate={plate} frame={frame} probe={probe}/>
  </div>;
 }else if(mode==='interior'&&(BOKEH_BLUR[framing]||washView(b,shot.view))){
  const blur=BOKEH_BLUR[framing]??BOKEH_BLUR.close;
  const paper=wall?.paper??rgb(plate.sky_rgb),F=mul(translate(-OX,-OY),scaleAbout(BOKEH_ZOOM,cam.cx,cam.cy));
  world=<div data-place-wash style={{position:'absolute',inset:0}}>
   <div style={{position:'absolute',inset:0,filter:probe?undefined:`blur(${blur}px) ${WINDOW_GRADE}`}}>
    <Layers plate={plate} frame={()=>F} probe={probe}/>
   </div>
   {!probe&&<div style={{position:'absolute',inset:0,background:paper,opacity:BOKEH_HAZE}}/>}
  </div>;
 }else if(mode==='interior'){
  const W=WINDOW[framing],pad=2*W.blur+4;
  const k=Math.max((W.w+2*pad)/PW,(HORIZON_IN_WINDOW*W.h+pad)/plate.horizon_y,((1-HORIZON_IN_WINDOW)*W.h+pad)/(PH-plate.horizon_y));
  // plate pixels to the window's own pixels: centred across it, the horizon at eye height
  const P:M3=[k,0,W.w/2-k*PW/2,0,k,HORIZON_IN_WINDOW*W.h-k*plate.horizon_y,0,0,1];
  info={...info,window:W};
  const paper=wall?.paper??rgb(plate.sky_rgb),back=wall?.background??rgb(plate.ground_rgb),ink=wall?.ink??'#2a2622';
  const keyX=art?.lighting.key.position[0]??1;
  const mx=[W.w/3,2*W.w/3];   // mullions only: a transom across the window would run along a line of text
  world=<>
   <div data-place-window style={{position:'absolute',left:W.x,top:W.y,width:W.w,height:W.h,overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,filter:probe?undefined:`blur(${W.blur}px) ${WINDOW_GRADE}`}}>
     <Layers plate={plate} frame={()=>P} probe={probe}/>
    </div>
   </div>
   <svg width={FW} height={FH} viewBox={`0 0 ${FW} ${FH}`} style={{position:'absolute',inset:0}}>
    <defs>
     <linearGradient id="place-wall" x1={keyX<0?'0':'1'} y1="0" x2={keyX<0?'1':'0'} y2="1">
      <stop offset="0" stopColor={paper}/><stop offset="1" stopColor={back}/>
     </linearGradient>
     <radialGradient id="place-spill" gradientUnits="userSpaceOnUse" cx={W.x+W.w/2} cy={W.y+W.h*.45} r={W.w*.85}>
      <stop offset="0" stopColor={rgb(plate.sky_rgb)} stopOpacity={.32}/><stop offset="1" stopColor={rgb(plate.sky_rgb)} stopOpacity={0}/>
     </radialGradient>
     <linearGradient id="place-glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity={0}/><stop offset=".42" stopColor="#fff" stopOpacity={0}/>
      <stop offset=".5" stopColor="#fff" stopOpacity={.09}/><stop offset=".58" stopColor="#fff" stopOpacity={0}/>
     </linearGradient>
    </defs>
    {/* the wall, and the window's light falling on it, never on the glass */}
    {['url(#place-wall)','url(#place-spill)'].map(fill=><path key={fill} fillRule="evenodd" fill={fill}
     d={`M0 0H${FW}V${FH}H0Z M${W.x} ${W.y}V${W.y+W.h}H${W.x+W.w}V${W.y}Z`}/>)}
    {!probe&&<rect x={W.x} y={W.y} width={W.w} height={W.h} fill={paper} opacity={WINDOW_HAZE}/>}
    {!probe&&<rect x={W.x} y={W.y} width={W.w} height={W.h} fill="url(#place-glass)"/>}
    {/* a light frame: a dark one crossed every thin line and glass edge in front of it */}
    <g stroke={ink} fill="none">
     <rect x={W.x} y={W.y} width={W.w} height={W.h} strokeWidth={12} strokeOpacity={.42}/>
     {mx.map((x,i)=><path key={i} d={`M${W.x+x} ${W.y}V${W.y+W.h}`} strokeWidth={6} strokeOpacity={.3}/>)}
    </g>
    <rect x={W.x-26} y={W.y+W.h+6} width={W.w+52} height={20} rx={3} fill={paper} stroke={ink} strokeOpacity={.5} strokeWidth={3}/>
   </svg>
  </>;
 }else{
  const keyX=art?.lighting.key.position[0]??1;
  world=<svg width={FW} height={FH} viewBox={`0 0 ${FW} ${FH}`} style={{position:'absolute',inset:0}}>
   <defs><linearGradient id="place-floor" x1={keyX<0?'0':'1'} y1="0" x2={keyX<0?'1':'0'} y2="1">
    <stop offset="0" stopColor={scene.interior?(wall?.paper??rgb(plate.sky_rgb)):rgb(plate.ground_rgb)}/>
    <stop offset="1" stopColor={scene.interior?(wall?.background??rgb(plate.ground_rgb)):rgb(plate.ground_rgb.map(v=>Math.round(v*.8)))}/>
   </linearGradient></defs>
   <rect width={FW} height={FH} fill="url(#place-floor)"/>
  </svg>;
 }
 const first=board.scenes[0];
 return <PlaceContext.Provider value={info}>
  <div data-place-plate={plate.id} data-place-mode={mode} style={{position:'absolute',inset:0,overflow:'hidden'}}>{world}</div>
  {children}
  {!probe&&first?.county&&<CountyLocator county={first.county} time_s={time_s} ink={wall?.ink??'#2a2622'}
   paper={wall?.paper??rgb(plate.sky_rgb)} accent={wall?.accent??'#c8553d'}/>}
 </PlaceContext.Provider>;
};

/** A subject that stands on the ground outdoors rides the camera with the ground under its base, so a
 * truck past a pump jack moves the pump jack as it moves the dirt it stands in. Indoors and overhead
 * it is drawn where the episode put it. `baseY` is the frame row its base touches. */
export const PlaceSubject:React.FC<{baseY:number;children:React.ReactNode}>=({baseY,children})=>{
 const place=usePlace();
 if(!place||place.mode!=='exterior')return <g>{children}</g>;
 const cam=place.plate.camera,depth=groundDepthAt(cam,baseY);
 const F=mul(translate(-OX,-OY),mul(scaleAbout(place.zoom,cam.cx,cam.cy),mul(cardMatrix(cam,depth,place.move),translate(OX,OY))));
 return <g transform={`matrix(${F[0]} ${F[3]} ${F[1]} ${F[4]} ${F[2]} ${F[5]})`}>{children}</g>;
};
