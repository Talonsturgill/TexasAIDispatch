import React from 'react';
import {useUid} from '../../../lib/uid';
import {FONT,widthOf} from '../../../lib/type';
import {actionProgress,type ActionWindow} from '../../../lib/direction';
import {usePlace} from '../../PlaceStage';
import {RestaurantSupport,RS,STAND,PANEL,TABLE} from './RestaurantSupport';

/**
 * s2 of the closed-room film (route order-pass-v1), mechanism order-pass-s2-closed-room-answered-phone-v1
 * (2026-10-26, Wok and Karahi, Spring, Harris County).
 *
 * Claims c1 and c2 (instead of a new hire the position went to an AI platform named Haniya, and no job ad was
 * posted) carry n2a. Claim c5 (the digital server answers the phone even when the restaurant is closed) carries
 * n2b. Nobody performs anything in this scene: there is no arm, hand, drawer, carried apron or carried panel.
 * Every change happens on objects already standing in the room.
 *
 *  closed-stand  n2a  The host stand from s1 in the closed room: door shut, bell still, chairs up on the tables,
 *                     the region outside the window. The server's apron hangs on the stand's side hook exactly as
 *                     s1 left it, and the desk phone is still rattling with its ring marks. The dark host panel
 *                     standing on the stand top wakes (s2-event-1): its status lamp comes on, light wipes across
 *                     its screen and its glow falls over the hanging apron. Then it writes Haniya, with AI host
 *                     under it (s2-event-4), and the lit, named panel is held beside the apron.
 *  host-panel    n2b  Closer on the stand top. The phone stops ringing (s2-event-2): its rattle and ring marks die,
 *                     its line lamp turns steady in the panel's light, and voice rings travel from the panel's
 *                     orb to that lamp (s2-event-5). The answered state is held to the cut.
 *  closed-room   n2b  The whole closed room. The pendant over the stand goes out and the room dims (s2-event-3)
 *                     while the panel, its voice rings and the phone's steady lamp stay lit, door shut, bell
 *                     still. "After closing" is only the room's state: no clock, numeral, sign or listing.
 *
 * The apron's swing is the film-global apronSwing() that s1 also draws, so the same strap hangs from the same
 * hook at the same angle on both sides of the s1 to s2 cut. The phone's ring is the film-global phoneRing(),
 * rising in s1-event-2 and stopping only in s2-event-2. Every state here is a closed function of the film clock
 * and the board's event windows. Placements on the stand are checked when the rig is built and an impossible one
 * throws instead of being clamped. Disclosed illustration: a generic stand and panel, no real person, software
 * or brand mark.
 */

export type ClosedRoomView='closed-stand'|'host-panel'|'closed-room';
export const CLOSED_ROOM_VIEWS:readonly ClosedRoomView[]=['closed-stand','host-panel','closed-room'];
type Variant='a'|'b';
type XY=[number,number];

const unit=(v:number)=>v<=0?0:v>=1?1:v;
const ease3=(q:number)=>{const x=unit(q);return x*x*(3-2*x);};
/** Zero velocity and acceleration at both ends. */
const ease5=(q:number)=>{const x=unit(q);return x*x*x*(10+x*(-15+6*x));};
const n2=(v:number)=>v.toFixed(2);
/** A released thing ringing down about its pin, `tau` seconds after the impulse (zero before it). */
const decaySwing=(tau:number,amp:number,hz:number,k:number)=>tau<=0?0:amp*Math.exp(-k*tau)*Math.sin(2*Math.PI*hz*tau)*ease3(tau/.12);
const along=(w:ActionWindow,t:number)=>unit((t-w.start)/(w.end-w.start));

// ---- the two film-global states that cross the s1 to s2 cut ------------------------------------------------
/** The server's apron on the stand's hook, in degrees about the hook: the swing it was left with, plus the
 * knock the door gave it as it shut (s1-event-1). One function for every s1 and s2 picture of the apron. */
export function apronSwing(W:Record<string,ActionWindow>,t:number){
 const shut=W['s1-event-1'];
 return decaySwing(t+.9,16,.7,.55)+decaySwing(t-(shut?shut.end:0),9,.75,.9);
}
/** How hard the desk phone rings: rising across s1-event-2, steady after it, and cut off only when the panel
 * answers in s2-event-2. One function for every s1 and s2 picture of the phone. */
export function phoneRing(W:Record<string,ActionWindow>,t:number){
 const start=W['s1-event-2'],answer=W['s2-event-2'];
 const on=start?actionProgress(start,t):0;
 return answer?on*(1-ease5(along(answer,t)/.34)):on;
}

// ---- the scene clock ----------------------------------------------------------------------------------------
const EVENT={wake:'s2-event-1',name:'s2-event-4',answer:'s2-event-2',line:'s2-event-5',dark:'s2-event-3'} as const;
function eventWindow(W:Record<string,ActionWindow>,id:string){
 const w=W[id];if(!w)throw new Error('The closed-room scene needs board event '+id);return w;
}
/** Every state that changes in s2, from the film clock and the board's five s2 windows. Pure in t. */
export function closedRoomClock(W:Record<string,ActionWindow>,t:number){
 const rw=along(eventWindow(W,EVENT.wake),t),rn=along(eventWindow(W,EVENT.name),t),ra=along(eventWindow(W,EVENT.answer),t);
 const rl=along(eventWindow(W,EVENT.line),t),rd=along(eventWindow(W,EVENT.dark),t);
 return {
  /** the panel's status lamp, then light wiping across its screen, then its glow reaching the stand and apron */
  led:ease3(rw/.1),lit:ease5(rw/.8),glow:ease3((rw-.2)/.8),
  /** Haniya writes, then AI host under it */
  name:ease5(rn/.6),label:ease5((rn-.62)/.34),
  /** the phone: ringing until the answer, then its line lamp steady and the panel's voice rings reaching it */
  ring:phoneRing(W,t),lamp:ease3((ra-.34)/.3),voice:ease3((ra-.6)/.4)*(.55+.45*ease3(rl/.5)),
  /** after closing: the pendant goes out and the room dims around the lit panel */
  dim:ease5(rd/.75),pendant:1-ease5(rd/.5),
 };
}
export type ClosedRoomClock=ReturnType<typeof closedRoomClock>;

// ---- what stands on the stand, in stand units (STAND.top is the top surface, STAND.hook the side hook) -------
/** The panel head is RestaurantSupport's host panel at PANEL_K, seated in a cradle LIP above the stand top on a
 * weighted desk base at MOUNT_X. The phone and the blank pad share the top surface. */
const PANEL_K=.68,LIP=48,MOUNT_X=-38,BASE_RX=64;
const PHONE_AT={x:70,s:.8},PAD_AT={x:-100,s:.62};
const PHONE_HALF=94,PAD_HALF=75;
const BEZEL_BOTTOM=PANEL.cy+PANEL.h/2;
/** A point in the panel's own units to stand units. */
export const panelToStand=(p:XY):XY=>[MOUNT_X+PANEL_K*p[0],STAND.top-LIP+PANEL_K*(p[1]-BEZEL_BOTTOM)];
/** The desk phone's line lamp and the panel's voice orb, in stand units. */
export const lampOnStand=():XY=>[PHONE_AT.x+58*PHONE_AT.s,STAND.top-28*PHONE_AT.s];
export const orbOnStand=():XY=>panelToStand([0,PANEL.screen.y+100]);
const NAME_LINE=PANEL.screen.y+232,LABEL_LINE=PANEL.screen.y+322,LABEL_SIZE=34;
/** Every contact on the stand is checked, and one that can't hold throws: no placement is ever clamped. */
function assertStandContacts(){
 const top=STAND.half;
 if(Math.abs(MOUNT_X)+BASE_RX>top)throw new Error('The panel base does not stand on the stand top');
 if(MOUNT_X-PANEL.w/2*PANEL_K<-top||MOUNT_X+PANEL.w/2*PANEL_K>top)throw new Error('The panel overhangs the stand');
 if(Math.abs(PHONE_AT.x)+PHONE_HALF*PHONE_AT.s>top)throw new Error('The desk phone does not stand on the stand top');
 if(Math.abs(PAD_AT.x)+PAD_HALF*PAD_AT.s>top)throw new Error('The pad does not lie on the stand top');
 if(STAND.hook[0]<-top||STAND.hook[1]<=STAND.top)throw new Error('The apron hook is not on the stand');
 const label=panelToStand([0,LABEL_LINE+8]),phoneTop=STAND.top-PHONE_HALF*PHONE_AT.s;
 if(label[1]>=phoneTop)throw new Error('The desk phone would cover the panel label');
}

// ---- the staging (screen pixels) ----------------------------------------------------------------------------
type Mount={x:number;y:number;s:number};
type Stage={stand:Mount;floor?:number;door?:Mount;pendants:{x:number;len:number}[];tables:Mount[];push:number};
/** A: counter level, the stand right of centre with the door at its left, as in s1's door-apron. B: the stand at
 * the left with the tables at its right, as in s1's table-wait, the room seen from a little higher. The apron's
 * hook keeps its side of the stand in every shot. */
const STAGES:Record<string,Stage>={
 'closed-stand:a':{stand:{x:600,y:1558,s:1.5},floor:1160,door:{x:-130,y:1160,s:1},pendants:[{x:560,len:240}],tables:[],push:.05},
 'closed-stand:b':{stand:{x:380,y:1494,s:1.3},floor:1080,door:{x:-250,y:1080,s:.9},pendants:[{x:380,len:330},{x:820,len:300}],
  tables:[{x:790,y:1170,s:.58}],push:.05},
 'host-panel:a':{stand:{x:470,y:1790,s:1.9},pendants:[],tables:[],push:0},
 'host-panel:b':{stand:{x:470,y:1709,s:1.8},floor:1160,pendants:[{x:600,len:230}],tables:[{x:1010,y:1250,s:.6}],push:0},
 'closed-room:a':{stand:{x:640,y:1330,s:.95},floor:1080,door:{x:100,y:1080,s:.85},pendants:[{x:640,len:250},{x:300,len:330}],
  tables:[{x:880,y:1160,s:.5}],push:0},
 'closed-room:b':{stand:{x:340,y:1290,s:.9},floor:1000,door:{x:-160,y:1000,s:.8},pendants:[{x:340,len:330},{x:740,len:260}],
  tables:[{x:620,y:1110,s:.42},{x:800,y:1190,s:.55}],push:0},
};
function stageFor(view:ClosedRoomView,variant:Variant):Stage{
 const st=STAGES[view+':'+variant];
 if(!st)throw new Error('The closed-room scene has no '+variant+' staging for '+view);
 return st;
}

/** The complete s2 rig for one view at t: the clock, the staging and every point a viewer must read, in screen
 * pixels after the shot's own slow push. Shared by the drawing and by bound checks. */
export function closedRoomRig(view:ClosedRoomView,variant:Variant,W:Record<string,ActionWindow>,t:number,shot:{start_s:number;duration_s:number}){
 assertStandContacts();
 const st=stageFor(view,variant),M=st.stand,C=closedRoomClock(W,t);
 const flat=(p:XY):XY=>[M.x+M.s*p[0],M.y+M.s*p[1]];
 const pivot=flat(panelToStand([0,NAME_LINE-20]));
 const z=1+st.push*ease5((t-shot.start_s)/shot.duration_s);
 const screen=(p:XY):XY=>{const q=flat(p);return [pivot[0]+(q[0]-pivot[0])*z,pivot[1]+(q[1]-pivot[1])*z];};
 const S=PANEL.screen,lamp=screen(lampOnStand()),orb=screen(orbOnStand());
 const reach=Math.hypot(lamp[0]-orb[0],lamp[1]-orb[1]);
 if(!Number.isFinite(reach)||reach<40*M.s)throw new Error('The voice rings have no visible path from the panel to the phone lamp');
 return {st,M,C,z,pivot,screen,lamp,orb,reach,scale:M.s*z,
  hook:screen(STAND.hook as XY),
  name:screen(panelToStand([0,NAME_LINE])),
  screenRect:{a:screen(panelToStand([S.x,S.y])),b:screen(panelToStand([S.x+S.w,S.y+S.h]))}};
}
export type ClosedRoomRig=ReturnType<typeof closedRoomRig>;

// ---- the drawn parts ----------------------------------------------------------------------------------------
const Item:React.FC<{id:string;children?:React.ReactNode}>=({id,children})=><g data-item={id}>{children}</g>;
/** A pedestal table after closing, both bentwood chairs turned up onto its top: seat down on the laminate, legs
 * in the air, backs hanging over the edge. Drawn at a table's floor point. */
const ClosedTable:React.FC<{at:Mount}>=({at})=><g transform={`translate(${at.x} ${at.y}) scale(${at.s})`} data-part="closed-table">
 <RestaurantSupport part="table"/>
 {[-1,1].map(side=><g key={side} transform={`translate(${side*72} ${TABLE.top-22}) scale(${-side} -1) translate(0 168)`}><RestaurantSupport part="chair"/></g>)}
</g>;
/** The panel's weighted desk base, its post and the cradle its bezel sits in, in stand units. The strut leans
 * back behind the panel; the base casts its shadow on the stand top. */
const PanelCradle:React.FC<{layer:'back'|'front'}>=({layer})=>{
 const top=STAND.top,lip=top-LIP,half=PANEL.w/2*PANEL_K;
 if(layer==='back')return <g data-part="panel-strut">
  <path d={`M${MOUNT_X+30} ${top-4}L${MOUNT_X+12} ${lip-150}`} stroke={RS.ink} strokeWidth={9} strokeLinecap="round"/>
  <path d={`M${MOUNT_X+30} ${top-4}L${MOUNT_X+12} ${lip-150}`} stroke={RS.steelDeep} strokeWidth={5} strokeLinecap="round"/>
 </g>;
 return <g data-part="panel-cradle">
  <ellipse cx={MOUNT_X+8} cy={top+3} rx={BASE_RX+10} ry={8} fill="#1A1410" opacity={.3}/>
  <path d={`M${MOUNT_X-BASE_RX} ${top}C${MOUNT_X-BASE_RX} ${top-12} ${MOUNT_X-40} ${top-16} ${MOUNT_X} ${top-16}C${MOUNT_X+40} ${top-16} ${MOUNT_X+BASE_RX} ${top-12} ${MOUNT_X+BASE_RX} ${top}Z`}
   fill={RS.charcoal} stroke={RS.ink} strokeWidth={2.6}/>
  <rect x={MOUNT_X-9} y={lip+4} width={18} height={LIP-18} fill={RS.steelDeep} stroke={RS.ink} strokeWidth={2.2}/>
  <path d={`M${MOUNT_X-4} ${lip+8}V${top-18}`} stroke={RS.steelLit} strokeWidth={2.4} opacity={.7}/>
  <rect x={n2(MOUNT_X-half-4)} y={lip-6} width={n2(2*half+8)} height={12} rx={4} fill={RS.steelDark} stroke={RS.ink} strokeWidth={2.4}/>
  <path d={`M${n2(MOUNT_X-half+4)} ${lip-3}H${n2(MOUNT_X+half-10)}`} stroke={RS.steelLit} strokeWidth={2} opacity={.6}/>
 </g>;
};
/** The panel head in its cradle: RestaurantSupport's host panel with its floor pole cut away below the bezel, and
 * the AI host line written under the name on the lit screen. Stand units. */
const PanelHead:React.FC<{C:ClosedRoomClock;t:number}>=({C,t})=>{
 const id=useUid('crph'),S=PANEL.screen,w=widthOf('AI host',LABEL_SIZE,true);
 return <g data-part="panel-head" transform={`translate(${MOUNT_X} ${STAND.top-LIP}) scale(${PANEL_K}) translate(0 ${-BEZEL_BOTTOM})`}>
  <defs>
   <clipPath id={id+'c'}><rect x={-600} y={-1400} width={1200} height={1400+BEZEL_BOTTOM+3}/></clipPath>
   <clipPath id={id+'l'}><rect x={n2(-w/2-6)} y={LABEL_LINE-LABEL_SIZE} width={n2((w+12)*C.label)} height={LABEL_SIZE+14}/></clipPath>
  </defs>
  <g clipPath={`url(#${id}c)`}><RestaurantSupport part="hostPanel" lit={C.lit} name={C.name} t={t}/></g>
  {C.led>0&&<circle cx={0} cy={BEZEL_BOTTOM-12} r={6} fill={RS.screenGlow} opacity={n2(C.led)}/>}
  {C.label>0&&<g clipPath={`url(#${id}l)`}>
   <text x={0} y={LABEL_LINE} textAnchor="middle" fontFamily={FONT.body} fontSize={LABEL_SIZE} fontWeight={700} fill="#E4F6F8" letterSpacing={1}>AI host</text>
  </g>}
  <rect x={S.x} y={S.y} width={S.w} height={S.h} rx={14} fill="none" stroke="#000" strokeOpacity={.25} strokeWidth={3}/>
 </g>;
};
/** The panel's light on what is near it: the stand top and the hanging apron. Stand units. */
const PanelSpill:React.FC<{glow:number}>=({glow})=>{
 const id=useUid('crsp');if(glow<=0)return null;
 const at=panelToStand([0,BEZEL_BOTTOM]);
 return <g data-part="panel-spill">
  <defs><radialGradient id={id} gradientUnits="userSpaceOnUse" cx={n2(at[0]-30)} cy={n2(at[1]+40)} r={260}>
   <stop offset="0" stopColor={RS.screenGlow} stopOpacity={.42}/><stop offset="1" stopColor={RS.screenGlow} stopOpacity={0}/></radialGradient></defs>
  <ellipse cx={n2(at[0]-40)} cy={n2(at[1]+60)} rx={250} ry={230} fill={`url(#${id})`} opacity={n2(glow)}/>
 </g>;
};
/** The server's apron hanging from its strap on the hook, at the film-global swing, with the hook drawn over the
 * strap. The same transform s1 uses. Stand units. */
const HangingApron:React.FC<{swing:number}>=({swing})=><g data-part="apron-on-hook">
 <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]}) rotate(${swing.toFixed(2)}) scale(.72)`}><RestaurantSupport part="apron"/></g>
 <g transform={`translate(${STAND.hook[0]} ${STAND.hook[1]})`}><RestaurantSupport part="apronHook"/></g>
</g>;
/** The answered line, screen pixels: the phone's lamp held steady and voice rings travelling from the panel's orb
 * to it, the orb and the lamp pulsing on the same beat. */
const AnsweredLine:React.FC<{R:ClosedRoomRig;t:number}>=({R,t})=>{
 const {C,lamp,orb,scale}=R;if(C.lamp<=0&&C.voice<=0)return null;
 const dx=lamp[0]-orb[0],dy=lamp[1]-orb[1],L=R.reach,ux=dx/L,uy=dy/L,face=Math.atan2(dy,dx);
 const beat=(t*.9)%1,throb=.85+.15*Math.cos(2*Math.PI*beat),w=Math.min(scale,2.4);
 const rings=[0,1,2].map(k=>{
  const f=(beat+k/3)%1,c:XY=[orb[0]+ux*L*f,orb[1]+uy*L*f],r=(14+16*f)*scale,h=40*Math.PI/180;
  const a:XY=[c[0]+r*Math.cos(face-h),c[1]+r*Math.sin(face-h)],b:XY=[c[0]+r*Math.cos(face+h),c[1]+r*Math.sin(face+h)];
  return {k,o:C.voice*Math.sin(Math.PI*f),d:`M${n2(a[0])} ${n2(a[1])}A${n2(r)} ${n2(r)} 0 0 1 ${n2(b[0])} ${n2(b[1])}`};
 });
 return <g data-part="answered-line">
  {rings.map(g=>g.o>0.01&&<g key={g.k} opacity={n2(g.o)}>
   <path d={g.d} stroke={RS.ink} strokeWidth={n2(5*w)} fill="none" strokeLinecap="round"/>
   <path d={g.d} stroke={RS.screenGlow} strokeWidth={n2(3*w)} fill="none" strokeLinecap="round"/></g>)}
  {C.lamp>0&&<g opacity={n2(C.lamp)}>
   <circle cx={n2(lamp[0])} cy={n2(lamp[1])} r={n2(16*scale*throb)} fill={RS.screenGlow} opacity={.32}/>
   <circle cx={n2(lamp[0])} cy={n2(lamp[1])} r={n2(5.6*scale)} fill={RS.screenGlow} stroke={RS.ink} strokeWidth={n2(1.2*w)}/>
  </g>}
 </g>;
};
/** After closing, the room's light falls away: a dusk over everything except the panel's screen and the phone's
 * lamp, lighter over the window so the region outside stays in view. Screen pixels. */
const ClosingDusk:React.FC<{R:ClosedRoomRig}>=({R})=>{
 const id=useUid('crdk'),place=usePlace(),{C}=R;if(C.dim<=0)return null;
 const win=place?.window,{a,b}=R.screenRect,pad=6*R.scale;
 return <g data-part="closing-dusk">
  <defs><mask id={id} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
   <rect x={-200} y={-200} width={1480} height={2320} fill="#FFFFFF"/>
   {win&&win.w>0&&<rect x={win.x} y={win.y} width={win.w} height={win.h} fill="#7A7A7A"/>}
   <rect x={n2(a[0]-pad)} y={n2(a[1]-pad)} width={n2(b[0]-a[0]+2*pad)} height={n2(b[1]-a[1]+2*pad)} rx={n2(10*R.scale)} fill="#000000"/>
   <circle cx={n2(R.lamp[0])} cy={n2(R.lamp[1])} r={n2(14*R.scale)} fill="#000000"/>
  </mask></defs>
  <rect x={-200} y={-200} width={1480} height={2320} fill="#121821" opacity={n2(.5*C.dim)} mask={`url(#${id})`}/>
 </g>;
};
/** The panel's glow, which reads as a light source once the room is dark. Screen pixels. */
const PanelHalo:React.FC<{R:ClosedRoomRig}>=({R})=>{
 const id=useUid('crhl'),{C}=R;if(C.dim<=0||C.lit<=0)return null;
 const {a,b}=R.screenRect,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2,r=Math.max(b[0]-a[0],b[1]-a[1]);
 return <g data-part="panel-halo">
  <defs><radialGradient id={id} gradientUnits="userSpaceOnUse" cx={n2(cx)} cy={n2(cy)} r={n2(r)}>
   <stop offset=".45" stopColor={RS.screenGlow} stopOpacity={.3}/><stop offset="1" stopColor={RS.screenGlow} stopOpacity={0}/></radialGradient></defs>
  <circle cx={n2(cx)} cy={n2(cy)} r={n2(r)} fill={`url(#${id})`} opacity={n2(C.dim*C.lit)}/>
 </g>;
};

/** The s2 picture for one view. */
export const ClosedRoomAnsweredPhoneScene:React.FC<{view:ClosedRoomView;variant:Variant;W:Record<string,ActionWindow>;t:number;
 shot:{start_s:number;duration_s:number}}>=({view,variant,W,t,shot})=>{
 const R=closedRoomRig(view,variant,W,t,shot),{st,M,C}=R,swing=apronSwing(W,t);
 const push=R.z!==1?`translate(${n2(R.pivot[0])} ${n2(R.pivot[1])}) scale(${R.z.toFixed(4)}) translate(${n2(-R.pivot[0])} ${n2(-R.pivot[1])})`:undefined;
 return <g data-part="closed-room-answered-phone" data-view={view}>
  <g transform={push}>
   <Item id="s2-setting">
    {st.floor!==undefined&&<RestaurantSupport part="floor" y={st.floor}/>}
    {st.door&&<g transform={`translate(${st.door.x} ${st.door.y}) scale(${st.door.s})`}><RestaurantSupport part="door" open={0} bell={0}/></g>}
    {st.tables.map((at,i)=><ClosedTable key={i} at={at}/>)}
    {st.pendants.map((p,i)=><g key={i} transform={`translate(${p.x} 0)`}>
     <RestaurantSupport part="pendant" len={p.len} glow={C.pendant}/>
     {C.pendant<1&&<ellipse cx={0} cy={p.len+44} rx={46} ry={8} fill={RS.inkSoft} opacity={n2(.75*(1-C.pendant))}/>}
    </g>)}
   </Item>
   <g transform={`translate(${M.x} ${M.y}) scale(${M.s})`}>
    <Item id="s2-setting"><RestaurantSupport part="hostStand"/></Item>
    <Item id="s2-panel"><PanelCradle layer="back"/><PanelHead C={C} t={t}/><PanelCradle layer="front"/></Item>
    <Item id="s2-setting"><g transform={`translate(${PAD_AT.x} ${STAND.top+6}) scale(${PAD_AT.s})`}><RestaurantSupport part="orderPad" curl={0}/></g></Item>
    <Item id="s2-phone"><g transform={`translate(${PHONE_AT.x} ${STAND.top}) scale(${PHONE_AT.s})`}><RestaurantSupport part="deskPhone" ring={C.ring} t={t}/></g></Item>
    <Item id="s2-apron-hook"><HangingApron swing={swing}/></Item>
    <Item id="s2-panel"><PanelSpill glow={C.glow*(1-.4*C.dim)}/></Item>
   </g>
  </g>
  <Item id="s2-setting"><ClosingDusk R={R}/></Item>
  <Item id="s2-panel"><PanelHalo R={R}/></Item>
  <Item id="s2-answered-lamp"><AnsweredLine R={R} t={t}/></Item>
 </g>;
};
