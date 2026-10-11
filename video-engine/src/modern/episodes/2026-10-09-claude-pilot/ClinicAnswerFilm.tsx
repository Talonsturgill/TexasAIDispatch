import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {FONT} from '../../../lib/type';
import {useArtDirection} from '../../../lib/artDirection';
import {actionProgress,actionWindows,requireAction,requireNarration,type DirectedScene} from '../../../lib/direction';
import type {FilmRenderProps} from '../../types';
import {ChartHero,HERO_SIZE,ANSWER_SOURCES,ANSWER_ACCURACY,type TagId,type CitationKind} from './ChartHero';
import {ClinicSupport,KEY,ENTER_KEY,keyTarget,WALL_PINS,ARM_REST,TOOL} from './ClinicSupport';

/**
 * clinic-answer-v1: a clinician's question goes into the OpenEvidence tool at the edge of the
 * health record and one answer comes back with its sources.
 *
 * One question card, one answer card and ONE set of three citation cards. The citations come
 * out of the tool behind the answer and tuck into its Sources slot; they come back out of that
 * slot only when a shot reads them, and their chips leave the slot while they are out. The
 * Accuracy slot is drawn empty and never filled; the release's unpublished measures hang from
 * the answer's own clip. Nothing appears from nowhere: cards go into and come out of the tool
 * under its face and below its mouth line, and the literature card rises out of the Sources slot.
 *
 * The hands PERFORM. Every typed word dash and every masked dot is caused by one finger strike on
 * a strike schedule read from the board clock: the finger lifts, its shadow separates, it comes
 * down, the key drops into its well, and on that frame the dash or dot appears. A send is a
 * visible strike too: the right hand travels across to the wide teal send key, rises and strikes
 * it, and the card leaves on that frame. In A the card then slides through the record boundary's
 * opening into the intake slit on the tool's side, clipped at the slit, the slit's flap folds in,
 * the tool's lamps chase while it reads and the answer starts to show at its mouth at once. B's
 * push is one stroke: the card moves on a single eased path, the hand rides it, then releases it
 * at speed and slows while the card glides on into the tool's mouth.
 *
 * A: a higher camera on a clinic wall. The chart hangs on a rail behind the desk, the tool is
 *    wall-mounted at its right and the usage share board hangs high above it, framed frontally.
 * B: a desk-level camera. The chart stands propped on the desk, the tool stands beside it, the
 *    usage share hangs lower over the tool and is framed from the desk, with its own cameras.
 *
 * Every state is a function of the film frame clock and the board's event windows; nothing
 * accumulates between frames. Disclosed illustration: no UTMB screen, vendor interface, answer
 * content, clinician identity, patient or patient detail.
 */

type Pt=[number,number];
type V='a'|'b';
type Win={start:number;end:number};
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(p:number)=>{const q=clamp(p);return q*q*q*(10+q*(-15+6*q));};
const bez=(a:Pt,c:Pt,b:Pt,u:number):Pt=>{const v=clamp(u);return [(1-v)*(1-v)*a[0]+2*(1-v)*v*c[0]+v*v*b[0],(1-v)*(1-v)*a[1]+2*(1-v)*v*c[1]+v*v*b[1]];};
const mixPt=(a:Pt,b:Pt,p:number):Pt=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const add=(a:Pt,b:Pt):Pt=>[a[0]+b[0],a[1]+b[1]];
const sub=(a:Pt,b:Pt):Pt=>[a[0]-b[0],a[1]-b[1]];
const scale=(a:Pt,s:number):Pt=>[a[0]*s,a[1]*s];

/** Place a part; `flat` lays it back onto the desk plane (perspective foreshortening). */
const At:React.FC<{p:Pt;s?:number;r?:number;flat?:number;o?:number;children:React.ReactNode}>=({p,s=1,r=0,flat=0,o=1,children})=>
 <g transform={`translate(${p[0]} ${p[1]}) rotate(${r}) matrix(1 0 ${-.22*flat} ${1-.38*flat} 0 0) scale(${s})`} opacity={o}>{children}</g>;
/** The same mapping in numbers, for anchoring a thread or a fingertip to a placed part. */
const placed=(p:Pt,s:number,flat:number,local:Pt):Pt=>[p[0]+s*local[0]-.22*flat*s*local[1],p[1]+(1-.38*flat)*s*local[1]];
/** A camera: world point f lands on screen point a at scale s. */
const Cam:React.FC<{f:Pt;s:number;a?:Pt;children:React.ReactNode}>=({f,s,a=[540,760],children})=>
 <g transform={`translate(${a[0]} ${a[1]}) scale(${s}) translate(${-f[0]} ${-f[1]})`}>{children}</g>;
/** A tag that drops onto its pin and settles; `sway` is an extra decaying swing after landing. */
const Hang:React.FC<{pin:Pt;tag:TagId;in:number;s:number;drop?:number;side?:'left'|'right';second?:number;sway?:number;underline?:number}>=
 ({pin,tag,in:shown,s,drop=0,side='right',second,sway=0,underline=0})=>
 shown<=0?null:<At p={[pin[0],pin[1]-50*(1-ease(shown))]} s={s} o={clamp(shown*3)}>
  <ChartHero part="tag" tag={tag} swing={(12*(1-ease(shown))+sway)*(side==='left'?-1:1)} drop={drop} side={side} second={second??1} underline={underline}/></At>;

// ---- the two worlds: fixed placements of every object (world units) ----
type TagPlace={pin:keyof typeof WALL_PINS;side:'left'|'right';drop:number};
type World={stage:'front'|'desk';chart:Pt;stand?:Pt;boundary:{p:Pt;w:number;h:number;slot:number;gap:number};tool:Pt;board:Pt;boardS:number;
 boardTags:{decision:TagPlace;report:TagPlace;evaluating:TagPlace};chartTags:{announced:{f:number;side:'left'|'right';drop:number};live:{f:number;side:'left'|'right';drop:number}};
 keyboard:Pt;kbS:number;question:Pt;qS:number;qFlat:number;credential:Pt;credS:number;lock:{p:Pt;s:number};answer:Pt;aS:number;aFlat:number;workstation?:Pt;rail?:{p:Pt;w:number};
 sendCtrl:Pt;sendEnd:Pt;stopAt:Pt;answerPath:Pt[];citeFan:Pt[]};
const WORLDS:Record<V,World>={
 a:{stage:'front',chart:[150,578],boundary:{p:[132,542],w:376,h:540,slot:.459,gap:58},tool:[530,700],board:[540,40],boardS:.46,
  boardTags:{decision:{pin:'start',side:'right',drop:0},report:{pin:'end',side:'left',drop:90},evaluating:{pin:'start',side:'right',drop:180}},
  chartTags:{announced:{f:.766,side:'right',drop:0},live:{f:.447,side:'right',drop:110}},
  keyboard:[-40,1050],kbS:.8,question:[190,790],qS:.85,qFlat:0,credential:[60,982],credS:.72,lock:{p:[81,786],s:1.7},answer:[600,1020],aS:.8,aFlat:.25,
  workstation:[-90,740],rail:{p:[110,556],w:420},
  sendCtrl:[380,772],sendEnd:[521,737],stopAt:[296,790],answerPath:[[560,700],[580,868],[600,1020]],citeFan:[[480,930],[550,920],[620,915]]},
 b:{stage:'desk',chart:[150,404],stand:[130,400],boundary:{p:[132,366],w:376,h:548,slot:.82,gap:50},tool:[516,724],board:[500,150],boardS:.46,
  boardTags:{decision:{pin:'end',side:'left',drop:0},report:{pin:'half',side:'left',drop:90},evaluating:{pin:'end',side:'left',drop:170}},
  chartTags:{announced:{f:.766,side:'right',drop:0},live:{f:.447,side:'right',drop:110}},
  keyboard:[-50,985],kbS:.8,question:[176,905],qS:.8,qFlat:.6,credential:[-60,906],credS:.78,lock:{p:[86,742],s:1.6},answer:[610,975],aS:.8,aFlat:.25,
  sendCtrl:[440,885],sendEnd:[560,815],stopAt:[400,892],answerPath:[[560,740],[600,880],[610,975]],citeFan:[[420,915],[490,905],[560,898]]},
};
const BOARD_TAG_S=.74, CHART_TAG_S=.8;
/** s8 only: each tag on its own pin so no tag body or string crosses another. */
const S8_TAGS:Record<V,World['boardTags']>={
 a:{decision:{pin:'start',side:'left',drop:0},report:{pin:'start',side:'left',drop:150},evaluating:{pin:'end',side:'left',drop:60}},
 b:{decision:{pin:'start',side:'left',drop:0},report:{pin:'start',side:'left',drop:150},evaluating:{pin:'end',side:'left',drop:60}},
};

// ---- the strike rig: a finger touches its key only inside its own strike ----
type Side='L'|'R';
type Strike={t:number;side:Side;finger:number;key:number;send?:boolean};
const SEQ:[Side,number][]=[['L',0],['R',0],['L',1],['R',1],['L',2],['R',0],['L',0],['R',1]];
/** Index fingers rest three keys apart on the home row (columns 2 and 5). */
const HOME={L:2,R:5};
const keyOf=(side:Side,finger:number)=>KEY.cols+HOME[side]+(side==='R'?finger:-finger);
/** n word or dot strikes evenly through [t0,t1], alternating hands. */
const run=(t0:number,t1:number,n:number,at:number[]|null=null):Strike[]=>Array.from({length:n},(_,j)=>{
 const [side,finger]=SEQ[j%SEQ.length];return {t:at?at[j]:t0+(t1-t0)*(j+.5)/n,side,finger,key:keyOf(side,finger)};});
/** The send strike: the right index travels to the wide send key. */
const sendAt=(t:number):Strike=>({t,side:'R',finger:0,key:ENTER_KEY,send:true});
const HOVER=.3, CONTACT=.07, RELEASE=.1;
const preOf=(s:Strike)=>s.send?.18:.1;
/** One strike's lift for its finger: up and down onto the key, contact, release to hover. */
function strikeLift(s:Strike,t:number,base:number):number|null{
 const d=t-s.t, pre=preOf(s);
 if(d>=-pre&&d<0){const u=(d+pre)/pre;return u<.55?lerp(base,1,ease(u/.55)):1-ease((u-.55)/.45);}
 if(d>=0&&d<CONTACT)return 0;
 if(d>=CONTACT&&d<CONTACT+RELEASE)return base*ease((d-CONTACT)/RELEASE);
 return null;
}
/** Hover while a typing run is under way; rest flat on the keys outside it. */
function hoverOf(list:Strike[],t:number){
 if(!list.length)return 0;
 const first=list[0].t-.22,last=list[list.length-1].t+.25;
 if(t<first||t>last)return 0;
 return HOVER*ease(Math.min((t-first)/.15,(last-t)/.15));
}
function fingerLift(list:Strike[],side:Side,finger:number,t:number){
 const base=hoverOf(list,t);
 for(const s of list){if(s.side!==side||s.finger!==finger)continue;const v=strikeLift(s,t,base);if(v!==null)return v;}
 return base;
}
/** The whole hand rises a little before each strike and a lot before the send strike. */
function bobOf(list:Strike[],side:Side,t:number){
 let b=0;
 for(const s of list){if(s.side!==side)continue;const d=t-s.t,pre=preOf(s)+.04;
  if(d>=-pre&&d<0){const u=(d+pre)/pre;b=Math.max(b,(s.send?1:.22)*(u<.6?ease(u/.6):1-ease((u-.6)/.4)));}}
 return b;
}
/** The right hand's travel to the send key and back, in keyboard units. */
function travelOf(list:Strike[],t:number):Pt{
 const reach=sub(keyTarget(ENTER_KEY),keyTarget(keyOf('R',0)));
 let k=0;
 for(const s of list){if(!s.send)continue;const d=t-s.t;
  if(d>=-.24&&d<-.06)k=Math.max(k,ease((d+.24)/.18));else if(d>=-.06&&d<.12)k=1;else if(d>=.12&&d<.45)k=Math.max(k,1-ease((d-.12)/.33));}
 return scale(reach,k);
}
/** Typed share of a card: each word strike grows one dash over two frames from its strike. */
const typedOf=(list:Strike[],t:number)=>{const w=list.filter(s=>!s.send);return w.length?w.reduce((a,s)=>a+clamp((t-s.t)/.07),0)/w.length:0;};
const struckOf=(list:Strike[],t:number)=>{const w=list.filter(s=>!s.send);return w.length?w.filter(s=>t>=s.t).length/w.length:0;};

/** ClinicSupport's Hand wrist centre in hand-local units (the forearm sleeve starts here). */
const HAND_WRIST:Pt=[98,232];
const RET_S=.9, FLEX_DEG=16, WRIST_FOLLOW=.65;
const rotPt=(v:Pt,deg:number):Pt=>{const a=deg*Math.PI/180,c=Math.cos(a),n=Math.sin(a);return [v[0]*c-v[1]*n,v[0]*n+v[1]*c];};
const len=(v:Pt)=>Math.hypot(v[0],v[1]);
const angDeg=(v:Pt)=>Math.atan2(v[1],v[0])*180/Math.PI;
/**
 * Treatment b's continuous-contact push, a pure function of the frame clock. The right hand
 * reaches from the keys (eased), touches the card's contact point at the push window's start,
 * keeps the index fingertip exactly on that point at every frame while the card travels on its
 * own eased path, and after the window returns to the keys on one eased stroke. Forearm and upper
 * arm keep their ARM_REST lengths: the shoulder (the torso, off frame) leans along a fixed
 * direction by exactly the amount that puts it at the target wrist distance, which bends the elbow
 * by up to FLEX_DEG, and the elbow is solved by two-bone IK on the same side as at rest. The hand
 * turns at the wrist to follow the forearm. Finger lift and bob blend into the reach pose with an
 * eased weight. At the window edges the pose equals the resting rig exactly.
 */
export function bPushArm(o:{t:number;reachFrom:number;w:Win;path:(u:number)=>Pt;rest:Pt;kbS:number;lift:number[];bob:number}){
 const {t,reachFrom,w,path,rest,kbS:s}=o;
 if(t<reachFrom||t>=w.end+RET_S)return null;
 const k=t<w.start?ease((t-reachFrom)/(w.start-reachFrom)):t<w.end?1:1-ease((t-w.end)/RET_S);
 const e=ease(k);
 const lift=o.lift.map((l,i)=>lerp(l,[0,1,1,1][i],e)), bob=lerp(o.bob,0,e);
 const lifted=14*clamp(bob);
 const tL:Pt=[0,-30*clamp(lift[0])-26*k-lifted], wL:Pt=[HAND_WRIST[0],HAND_WRIST[1]-lifted];
 const Lf=s*len(sub(ARM_REST.elbow,HAND_WRIST)), La=s*len(sub(ARM_REST.shoulder,ARM_REST.elbow));
 const dRest=s*len(sub(ARM_REST.shoulder,HAND_WRIST)), dFlex=Math.sqrt(Lf*Lf+La*La+2*Lf*La*Math.cos(FLEX_DEG*Math.PI/180));
 const d=lerp(dRest,dFlex,k);
 const sBase=add(rest,scale(sub(ARM_REST.shoulder,[0,lifted]),s));
 const dir=(()=>{const v=sub(path(1),add(rest,scale(ARM_REST.shoulder,s)));const L=len(v)||1;return scale(v,1/L);})();
 const restAng=angDeg(sub(ARM_REST.elbow,HAND_WRIST));
 const C=t>=w.start&&t<w.end?path(ease((t-w.start)/(w.end-w.start))):null;
 const solve=(th:number)=>{
  const off=scale(rotPt(tL,th),s);
  const pos:Pt=C?sub(C,off):t<w.start?mixPt(rest,sub(path(0),off),k):mixPt(rest,sub(path(1),off),k);
  const wrist=add(pos,scale(rotPt(wL,th),s));
  const D=sub(sBase,wrist), b=D[0]*dir[0]+D[1]*dir[1], disc=b*b-(len(D)**2-d*d);
  const lam=-b-Math.sqrt(Math.max(0,disc));
  const sh=add(sBase,scale(dir,lam));
  const u=scale(sub(sh,wrist),1/len(sub(sh,wrist))), dd=len(sub(sh,wrist));
  const a=(Lf*Lf-La*La+dd*dd)/(2*dd), h=Math.sqrt(Math.max(0,Lf*Lf-a*a));
  const elbow=add(add(wrist,scale(u,a)),scale([-u[1],u[0]],h));
  return {pos,wrist,sh,elbow,disc,tip:add(pos,off),theta:WRIST_FOLLOW*(angDeg(sub(elbow,wrist))-restAng)};
 };
 let th=0;for(let i=0;i<6;i++)th=solve(th).theta;
 const r=solve(th);
 const toLocal=(q:Pt):Pt=>add(rotPt(scale(sub(q,r.pos),1/s),-th),[0,lifted]);
 return {pos:r.pos,rot:th,reach:k,lift,bob,elbow:toLocal(r.elbow),shoulder:toLocal(r.sh),
  tip:r.tip,contact:C,wristW:r.wrist,elbowW:r.elbow,shoulderW:r.sh,disc:r.disc,lean:sub(r.sh,sBase)};
}

export const ClinicAnswerFilm:React.FC<FilmRenderProps>=({board,scene,shot,time_s,variant})=>{
 const ad=useArtDirection();if(!ad)throw new Error('Clinic answer film requires the executed art direction profile');
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 if(Math.abs(t-time_s)>1e-6)throw new Error('Clinic answer film must read the single film frame clock');
 const c=ad.palette, v=variant, Wd=WORLDS[v];
 const W=actionWindows(board.scenes as unknown as DirectedScene[]);
 const win=(id:string)=>requireAction(W,id);
 const p=(id:string)=>actionProgress(win(id),t);
 const raw=(w:Win,at=t)=>clamp((at-w.start)/(w.end-w.start));
 const clause=board.narration_picture!.clauses.find(r=>t>=r.start_s&&t<r.end_s);
 const act=clause?.action_id??(shot as typeof shot&{narration_ids?:string[]}).narration_ids?.map(id=>requireNarration(board,id).actionId)[0]??'hold';
 const sid=scene.id, after=(s:string)=>sid>s, at=(s:string)=>sid===s;
 const flat=ad.flat_shots?.[sid];

 // ---- performed states, each read from its own event on the film clock ----
 const e1=win('s1-event-1'),e2=win('s1-event-2'),send=p('s1-event-1'),ret=p('s1-event-2'),land=p('s1-event-3');
 const e3=win('s1-event-3');
 const glowWin=win('s2-event-1'),glow=p('s2-event-1'),announced=p('s2-event-2'),live=p('s2-event-3');
 const n3a=requireNarration(board,'n3a'),lockWin=win('s3-event-1'),lockOpen=p('s3-event-1');
 const typeWin=win('s3-event-2'),slideWin=win('s3-event-3'),slide3=p('s3-event-3');
 const fanWin=win('s4-event-1'),fan=p('s4-event-1'),liftLit=p('s4-event-2'),liftGuide=p('s4-event-3');
 const tiles=p('s5-event-1'),share=p('s5-event-2'),decision=p('s5-event-3');
 const report=p('s6-event-1'),limits=p('s6-event-2'),notInRelease=p('s6-event-3');
 const trace=p('s7-event-1'),slotLight=p('s7-event-2'),noCheck=p('s7-event-3');
 const evalTag=p('s8-event-1'),sourcesHold=p('s8-event-2'),finalPulse=p('s8-event-3');
 const n7a=requireNarration(board,'n7a');

 // ---- strike schedules. A: four words typed before the first frame, two visible strikes, then
 // the send strike just before the card leaves. B: the last word lands before the right hand
 // leaves the keys to push. s3: eight credential strikes, one dot each, then a send strike that
 // opens the lock; six word strikes, one dash each, then (A) a send strike before the slide.
 const s1List:Strike[]=v==='a'
  ?[...run(0,0,6,[.92,.8,.68,.56,.38,.25].map(d=>e1.start-d)),sendAt(e1.start-.05)]
  :run(e1.start-1,e1.start-.32,6);
 const dotList:Strike[]=[...run(n3a.start-.04,lockWin.start-.3,8),sendAt(lockWin.start-.04)];
 const qList:Strike[]=v==='a'?[...run(typeWin.start-.15,typeWin.end-.15,6),sendAt(slideWin.start-.04)]:run(typeWin.start-.12,typeWin.end,6);
 const list=sid==='s1'?s1List:sid==='s3'?[...dotList,...qList]:[];
 const typed1=typedOf(s1List,t), dots=struckOf(dotList,t), typed3=typedOf(qList,t);
 const handsShown=sid<='s3';

 // ---- the question card: one eased path per send, so it never stops and restarts ----
 const qHome=Wd.question;
 const sendPos=(u:number):Pt=>bez(qHome,Wd.sendCtrl,Wd.sendEnd,u);
 const s3Pos=(u:number):Pt=>mixPt(qHome,Wd.stopAt,u);
 const sending=(at('s1')||at('s2'))&&t>=e1.start;
 const q=(():{p:Pt;s:number;show:boolean;typed:number;plain:number}=>{
  if(at('s1')||at('s2')){
   if(t<e1.start)return {p:qHome,s:Wd.qS,show:true,typed:typed1,plain:0};
   const u=v==='b'?ease(raw(e1)):send;
   return {p:sendPos(u),s:lerp(Wd.qS,Wd.qS*.84,u),show:raw(e1)<1,typed:1,plain:0};
  }
  if(at('s3'))return {p:s3Pos(v==='b'?ease(raw(slideWin)):slide3),s:Wd.qS,show:true,typed:typed3,plain:typed3};
  return {p:Wd.stopAt,s:Wd.qS,show:after('s3'),typed:1,plain:1};
 })();

 // ---- the tool's reaction: intake flap and collar (A), reading lamps, output mouth ----
 const tb=TOOL[Wd.stage], mouthY=Wd.tool[1]+tb.mouthY, slitX=Wd.tool[0]+tb.intakeX;
 const cardW=HERO_SIZE.question[0]*q.s;
 const intake=v==='a'&&at('s1')?(t<e1.end?(sending?clamp((q.p[0]+cardW-slitX)/cardW):0):1-clamp((t-e1.end)/.35)):0;
 const preWin:Win={start:e1.end+.45,end:e2.start};
 const leds=at('s1')&&t>=e1.end?clamp((t-e1.end)/Math.max(.2,e2.start-e1.end)):0;
 const emit=at('s1')?clamp((t-preWin.start)/.3)*(1-clamp((t-e3.end)/.4)):0;
 const toolGlow=at('s2')?glow:at('s1')&&t>=e1.end&&ret<=0?.25+.25*Math.sin((t-e1.end)*9):0;

 // ---- B's push: reach, touch, carry the card in continuous contact to the tool lip (s1) or the
 // chart edge (s3), then return to the keys. bPushArm keeps both arm segments at their rest
 // lengths by leaning the shoulder and solving the elbow; treatment a never enters it. ----
 const kbTip=(side:Side)=>add(Wd.keyboard,scale(keyTarget(keyOf(side,0)),Wd.kbS));
 const contactOf=(pt:Pt,s:number)=>placed(pt,s,Wd.qFlat,[96,150]);
 const rReach=0,rShift:Pt=[0,0];
 const pushWin=v==='b'?(at('s1')?{w:e1,path:(u:number)=>contactOf(sendPos(u),lerp(Wd.qS,Wd.qS*.84,u)),reachFrom:e1.start-.22}
  :at('s3')?{w:slideWin,path:(u:number)=>contactOf(s3Pos(u),Wd.qS),reachFrom:typeWin.end+.04}:null):null;
 // the send key travel moves the whole right hand across the keyboard
 const travel=scale(travelOf(list,t),Wd.kbS);
 const rMove=add(rShift,travel);
 // the elbow follows part of the hand's travel; the shoulder stays put below the frame
 const elbowR=sub(ARM_REST.elbow,scale(rMove,.65/Wd.kbS)), shoulderR=sub(ARM_REST.shoulder,scale(rMove,1/Wd.kbS));
 const handLift=(side:Side)=>[0,1,2,3].map(f=>fingerLift(list,side,f,t));
 const bArm=pushWin?bPushArm({t,reachFrom:pushWin.reachFrom,w:pushWin.w,path:pushWin.path,rest:kbTip('R'),kbS:Wd.kbS,
  lift:handLift('R'),bob:bobOf(list,'R',t)}):null;
 const keysDown=list.filter(s=>t>=s.t&&t<s.t+CONTACT).map(s=>s.key);

 // ---- the answer: it starts to show at the tool mouth while the tool reads, then slides out ----
 const PRE=.16;
 const aU=at('s1')?(ret>0?PRE+(1-PRE)*ret:t>=preWin.start?PRE*ease(raw(preWin)):0):1;
 const answerIn=aU;
 const answerPt=at('s1')?(aU<.4?mixPt(Wd.answerPath[0],Wd.answerPath[1],ease(aU/.4)):mixPt(Wd.answerPath[1],Wd.answerPath[2],ease((aU-.4)/.6))):Wd.answerPath[2];
 const answerS=at('s1')?lerp(.6,Wd.aS,ease(aU)):Wd.aS, answerFlat=at('s1')?Wd.aFlat*ease(aU):Wd.aFlat;
 const sourcesFill=at('s1')?clamp((land-.55)/.45):1;
 const limitsOn=at('s6')?limits:after('s6')?1:0, limitText=at('s6')?notInRelease:1;
 const slotPt=placed(Wd.answer,Wd.aS,Wd.aFlat,ANSWER_SOURCES);
 const kinds:CitationKind[]=['other','guidelines','literature'];
 const screenGlow=at('s1')?1:at('s3')?.5+.5*typed3:.5;

 // ---- s2: light runs out of the tool's opening round the record edge; the announcement tag drops
 // onto its pin as the light passes it, swings and is pressed home while its date is spoken ----
 const tagLand:Win={start:glowWin.start+.45*(glowWin.end-glowWin.start),end:glowWin.end};
 const annIn=at('s2')?ease(raw(tagLand)):after('s2')?1:0;
 const annSway=at('s2')&&t>tagLand.end?10*Math.exp(-(t-tagLand.end)*2.6)*Math.cos((t-tagLand.end)*8)*(1-announced):0;

 const world=(extra:React.ReactNode=null)=>{
  const B=Wd.boundary;
  const pinB=(f:number):Pt=>[B.p[0]+B.w*f,B.p[1]];
  const pinBoard=(k:keyof typeof WALL_PINS):Pt=>add(Wd.board,scale(WALL_PINS[k],Wd.boardS));
  const lockState=at('s3')?lockOpen:1;
  const bt=at('s8')?S8_TAGS[v]:Wd.boardTags, ct=Wd.chartTags;
  const boundary=<At p={B.p}><ClinicSupport part="boundary" w={B.w} h={B.h} glow={at('s2')?glow:at('s3')?.25+.5*lockOpen:.25} slot={B.slot} gap={B.gap}
   pulse={at('s2')?glow:0} label="right"/></At>;
  const lock=<At p={Wd.lock.p} s={Wd.lock.s}><ClinicSupport part="lock" open={lockState} halo={at('s3')?lockOpen:0}/></At>;
  const card=q.show&&<At p={q.p} s={q.s} flat={Wd.qFlat}><ChartHero part="question" typed={q.typed} plain={q.plain}/></At>;
  // A: the card goes into the intake slit on the tool's side; everything past the slit is inside
  const questionCard=v==='a'&&sending?<g clipPath="url(#intake-a)">{card}</g>:card;
  // the answer and the citations are clipped below the tool mouth line and drawn before the tool,
  // so they slide out of it instead of appearing
  const emerging=at('s1');
  const answerCard=answerIn>0&&<At p={answerPt} s={answerS} flat={answerFlat}>
   <ChartHero part="answer" sources={sourcesFill} limits={limitsOn} limitText={limitText} lift={at('s1')?1-ease(aU):0}
    sourcesGlow={at('s8')?Math.sin(Math.PI*sourcesHold):0} ring={at('s8')&&finalPulse>0&&finalPulse<1?finalPulse:0}/></At>;
  const citations=emerging&&land>0&&land<1&&kinds.map((k,i)=>{
   const u1=clamp(land/.45),u2=clamp((land-.45)/.55);
   const pos=u2<=0?mixPt(Wd.answerPath[0],Wd.citeFan[i],ease(u1)):mixPt(Wd.citeFan[i],slotPt,ease(u2));
   return <At key={k} p={pos} s={lerp(.42,.1,ease(u2))} flat={.5} r={-8+i*8} o={1-clamp((u2-.8)/.2)}><ChartHero part="citation" kind={k} lift={.4}/></At>;
  });
  const fromMouth=<g clipPath={emerging?`url(#mouth-${v})`:undefined}>{answerCard}{citations}</g>;
  const hands=handsShown&&<>
   <At p={kbTip('L')} s={Wd.kbS}><ClinicSupport part="hands" side="L" lift={handLift('L')} bob={bobOf(list,'L',t)}/></At>
   {bArm
    ?<At p={bArm.pos} s={Wd.kbS} r={bArm.rot}><ClinicSupport part="hands" side="R" lift={bArm.lift} bob={bArm.bob} reach={bArm.reach} elbow={bArm.elbow} shoulder={bArm.shoulder}/></At>
    :<At p={add(kbTip('R'),rMove)} s={Wd.kbS}><ClinicSupport part="hands" side="R" lift={rReach>0?[0,1,1,1]:handLift('R')} bob={rReach>0?0:bobOf(list,'R',t)}
    reach={rReach} elbow={elbowR} shoulder={shoulderR}/></At>}
  </>;
  return <g data-world={v==='a'?'a-wall-chart':'b-desk-level'}>
   <defs>
    <clipPath id={`mouth-${v}`}><rect x={-400} y={mouthY} width={2400} height={2400}/></clipPath>
    <clipPath id="intake-a"><rect x={-400} y={-400} width={slitX+400} height={2800}/></clipPath>
   </defs>
   <ClinicSupport part="room" stage={Wd.stage} spill={.6}/>
   <At p={Wd.board} s={Wd.boardS}><ClinicSupport part="wall" lit={after('s4')?clamp(.45*(at('s5')?tiles:1)+.55*(at('s5')?share:1)):0} share={after('s4')?(at('s5')?share:1):0} label={after('s4')?(at('s5')?share:1):0}/></At>
   <Hang pin={pinBoard(bt.decision.pin)} tag="decision" in={at('s5')?decision:after('s5')?1:0} s={BOARD_TAG_S} side={bt.decision.side} drop={bt.decision.drop}/>
   <Hang pin={pinBoard(bt.report.pin)} tag="report" in={at('s6')?report:after('s6')?1:0} s={BOARD_TAG_S} side={bt.report.side} drop={bt.report.drop}/>
   <Hang pin={pinBoard(bt.evaluating.pin)} tag="evaluating" in={at('s8')?evalTag:0} s={BOARD_TAG_S} side={bt.evaluating.side} drop={bt.evaluating.drop}/>
   {Wd.rail&&<At p={Wd.rail.p}><ClinicSupport part="rail" w={Wd.rail.w}/></At>}
   {v==='a'&&<>{boundary}<At p={Wd.chart}><ChartHero part="chart"/></At>{lock}</>}
   <ClinicSupport part="desk" stage={Wd.stage}/>
   {Wd.workstation&&<At p={Wd.workstation} s={.9}><ClinicSupport part="workstation" glow={screenGlow}/></At>}
   {v==='b'&&<><At p={Wd.stand!}><ClinicSupport part="stand"/></At>{boundary}<At p={Wd.chart}><ChartHero part="chart" seed={5}/></At>{lock}</>}
   <At p={Wd.keyboard} s={Wd.kbS}><ClinicSupport part="keyboard" down={keysDown}/></At>
   {v==='b'&&questionCard}
   {fromMouth}
   <At p={Wd.tool}><ClinicSupport part="tool" stage={Wd.stage} glow={toolGlow} intake={intake} leds={leds} emit={emit}/></At>
   {v==='a'&&questionCard}
   <Hang pin={pinB(ct.announced.f)} tag="announced" in={annIn} s={CHART_TAG_S} side={ct.announced.side} drop={ct.announced.drop}
    sway={annSway} underline={at('s2')?announced:after('s2')?1:0}/>
   <Hang pin={pinB(ct.live.f)} tag="live" in={at('s2')?live:after('s2')?1:0} s={CHART_TAG_S} side={ct.live.side} drop={ct.live.drop}/>
   {at('s3')&&<At p={Wd.credential} s={Wd.credS} flat={v==='b'?Wd.qFlat:.6}><ClinicSupport part="credential" dots={dots}/></At>}
   {hands}
   {extra}
  </g>;
 };

 // ---- a clean close surface for reading the answer and its sources (no duplicate props) ----
 const surface=(children:React.ReactNode)=><g data-world={v==='a'?'a-desk-surface':'b-desk-surface'}>
  <rect x={-400} y={-400} width={1880} height={2720} fill={v==='a'?'#CFC7B4':'#C9C1AE'}/>
  {v==='a'?<g opacity={.5}>{Array.from({length:22},(_,i)=><path key={i} d={`M-400 ${-100+i*96}H1480`} stroke="#B3AB98" strokeWidth={3}/>)}</g>
   :<g opacity={.5}>{Array.from({length:18},(_,i)=><path key={i} d={`M${540+(i-9)*40} 300L${540+(i-9)*260} 2300`} stroke="#B3AB98" strokeWidth={3}/>)}</g>}
  {/* the back wall: the room's own Gulf window, framed, with its sill and contact shadow */}
  <ClinicSupport part="backwall" stage={Wd.stage} h={v==='a'?240:300}/>
  <rect x={-400} y={v==='a'?240:300} width={1880} height={14} fill="#7F7766" opacity={.6}/>
  {children}
 </g>;

 // s4: the answer card held large; each chip lifts out of its Sources slot and opens into its
 // citation card, rising first and then swinging out into the fan (A) or a stepped cascade (B).
 // Lower cards sit on top so every tab stays clear, and a naming lift raises a card in place.
 const S4_ANS:Pt=[20,830], S4_AS=1.72, CS=1.1, CARD_HALF:Pt=[HERO_SIZE.citation[0]/2,HERO_SIZE.citation[1]/2];
 const citationRead=(naming:boolean)=>{
  const fanTo:Record<CitationKind,{p:Pt;r:number}>=v==='a'
   ?{literature:{p:[60,380],r:-5},guidelines:{p:[200,470],r:-1},other:{p:[340,560],r:4}}
   :{literature:{p:[80,380],r:0},guidelines:{p:[170,475],r:0},other:{p:[260,570],r:0}};
  const liftBy:Record<CitationKind,Pt>=v==='a'?{literature:[0,-46],guidelines:[30,-16],other:[0,0]}:{literature:[-30,-42],guidelines:[30,-16],other:[0,0]};
  const lifts:Record<CitationKind,number>={literature:at('s4')?liftLit:1,guidelines:at('s4')?liftGuide:1,other:0};
  const r4=at('s4')?raw(fanWin):1;
  const order:CitationKind[]=['literature','guidelines','other'];
  const us=order.map((_,i)=>clamp((r4-i*.2)/.6));
  const chipC=(i:number)=>placed(S4_ANS,S4_AS,0,[30+i*44+18,186+15]);
  return surface(<>
   <At p={S4_ANS} s={S4_AS}><ChartHero part="answer" sources={1} chipsOut={[clamp(us[0]*3),clamp(us[1]*3),clamp(us[2]*3)]} limits={limitsOn} limitText={limitText} lift={.1}
    sourcesGlow={at('s4')&&!naming?.8*Math.sin(Math.PI*r4):0}/></At>
   {order.map((k,i)=>{
    const u=us[i];
    if(u<=0)return null;
    const a=ease(clamp(u/.35)), b=ease(clamp((u-.35)/.65));
    const chip=chipC(i), rise:Pt=[chip[0]+10*i,chip[1]-170-14*i], fin=add(fanTo[k].p,scale(CARD_HALF,CS));
    const centre=b>0?mixPt(rise,fin,b):mixPt(chip,rise,a);
    const sc=b>0?lerp(.5,CS,b):lerp(36/HERO_SIZE.citation[0]*S4_AS,.5,a);
    const l=naming?ease(lifts[k]):0;
    const pos=add(sub(centre,scale(CARD_HALF,sc)),scale(liftBy[k],l));
    return <At key={k} p={pos} s={sc+.06*l} r={fanTo[k].r*b}><ChartHero part="citation" kind={k} lift={.3+.5*l} glow={l}/></At>;
   })}
  </>);
 };
 // s6 and s7: the answer read close, with its clip tags, slots and the citation thread. The literature
 // card rises out of the Sources slot before the thread reaches it.
 const answerRead=()=>{
  const ans:Pt=v==='a'?[500,640]:[480,760], s=v==='a'?1.2:1.25;
  const lit:Pt=v==='a'?[440,230]:[450,290], litS=1.45;
  const rise=at('s7')?ease((t-n7a.start)/Math.max(.2,win('s7-event-1').start-n7a.start)):0;
  const slot=placed(ans,s,0,ANSWER_SOURCES);
  const litPos=mixPt(slot,lit,rise);
  const tab:Pt=[litPos[0]+70*litS,litPos[1]+22*litS];
  const from=placed(ans,s,0,[ANSWER_SOURCES[0]-30,ANSWER_SOURCES[1]+30]);
  return surface(<>
   <At p={ans} s={s}><ChartHero part="answer" sources={1} chipsOut={[rise,0,0]} limits={limitsOn} limitText={limitText}
    slotGlow={at('s7')?slotLight:0} ring={at('s7')&&noCheck>0&&noCheck<1?noCheck:0} lift={.1}/></At>
   {at('s7')&&rise>0&&<At p={litPos} s={lerp(.12,litS,rise)}><ChartHero part="citation" kind="literature" glow={trace*(1-slotLight)} lift={.3}/></At>}
   {at('s7')&&rise>=1&&<ChartHero part="thread" from={from} to={tab} reach={trace}/>}
  </>);
 };
 const answerFocus=(local:Pt):Pt=>placed(v==='a'?[500,640]:[480,760],v==='a'?1.2:1.25,0,local);
 // s6: the two open tags close enough to read "Not in release" on a phone (about 800 px wide each),
 // with the answer's clip and header still at the right edge of the frame.
 const LIMIT_S=2.35;
 const limitsClose=()=><Cam f={answerFocus([-115,164])} s={LIMIT_S/(v==='a'?1.2:1.25)}>{answerRead()}</Cam>;
 // s8: the closing image, in screen units. The usage share's bar runs along the top of the frame
 // above the disclosure pill, cut at the board's bottom rail so no figure row is in frame; its
 // evaluating tag hangs from the end pin on a string that clears the pill. Below, the answer card
 // holds on the desk with Sources filled, the Accuracy slot empty and its two open tags, and the
 // patient chart sits beside it at the left: A lies it flat on the desk, B props it on its stand.
 const ending=()=>{
  const deskY=v==='a'?480:560, kb=1.2, tagS=kb*BOARD_TAG_S/Wd.boardS, bt=S8_TAGS[v];
  const boardP:Pt=[-140,-604*kb];
  const pin=(k:keyof typeof WALL_PINS):Pt=>add(boardP,scale(WALL_PINS[k],kb));
  const ans:Pt=[530,815], aS=1.5;
  return <g data-world={v==='a'?'a-answer-ending':'b-answer-ending'}>
   <rect x={-400} y={-400} width={1880} height={2720} fill={v==='a'?'#CFC7B4':'#C9C1AE'}/>
   <g opacity={.5}>{Array.from({length:14},(_,i)=><path key={i} d={`M-400 ${deskY+40+i*96}H1480`} stroke="#B3AB98" strokeWidth={3}/>)}</g>
   <ClinicSupport part="backwall" stage={Wd.stage} h={deskY} glazed={false}/>
   <At p={boardP} s={kb}><ClinicSupport part="wall" lit={1} share={1} label={1}/></At>
   <Hang pin={pin(bt.decision.pin)} tag="decision" in={1} s={tagS} side={bt.decision.side} drop={bt.decision.drop}/>
   <Hang pin={pin(bt.report.pin)} tag="report" in={1} s={tagS} side={bt.report.side} drop={bt.report.drop}/>
   <Hang pin={pin(bt.evaluating.pin)} tag="evaluating" in={evalTag} s={tagS} side={bt.evaluating.side} drop={bt.evaluating.drop}/>
   <rect x={-400} y={deskY} width={1880} height={14} fill="#7F7766" opacity={.6}/>
   <path d={`M-400 ${deskY+16}H1480`} stroke="#ffffff" strokeOpacity={.35} strokeWidth={2}/>
   {v==='a'
    ?<At p={[-70,520]} s={.95} flat={.6}><ChartHero part="chart"/></At>
    :<><At p={[-66,496.8]} s={.8}><ClinicSupport part="stand"/></At><At p={[-50,500]} s={.8}><ChartHero part="chart" seed={5}/></At></>}
   <At p={ans} s={aS}><ChartHero part="answer" sources={1} limits={1} limitText={1} lift={.1}
    sourcesGlow={Math.sin(Math.PI*sourcesHold)} ring={finalPulse>0&&finalPulse<1?finalPulse:0}/></At>
  </g>;
 };

 // ---- an executed camera for every declared shot ----
 let pic:React.ReactNode;
 let chip:Pt=[0,0];
 const view=shot.view, fr=shot.framing;
 switch(view){
 case 'flow-wide':
  if(act==='send-question'){
   // A's hook: open close on the question card and the striking hands (the card about 48 percent
   // of the frame width), follow the card to the tool on one braked move that eases out a little
   // mid-flight to show chart and tool together, then hold on the tool and push gently toward its
   // mouth while it reads and the answer starts to show.
   const M:Win={start:e1.start-.04,end:e1.end+.3}, e=ease(raw(M)), h=ease(raw({start:M.end,end:M.end+1.4}));
   const f0:Pt=[290,958], f1:Pt=[655,815], f2:Pt=[662,828];
   pic=<Cam f={mixPt(mixPt(f0,f1,e),f2,h)} s={lerp(2.45,2.3,e)-.5*Math.sin(Math.PI*e)+.1*h}>{world()}</Cam>;
  }
  else pic=<Cam f={[720,900]} s={1.45}>{world()}</Cam>;          // B's return: medium on the tool and the answer
  break;
 case 'desk-close':
  if(act==='return-answer')pic=<Cam f={[650,930]} s={1.62}>{world()}</Cam>;
  else if(act==='send-question')pic=<Cam f={mixPt([300,985],[560,860],ease(raw(e1)))} s={lerp(2.3,1.5,ease(raw(e1)))}>{world()}</Cam>;
  // type-question: a held frame, so the card's slide to the chart edge reads against the chart
  else pic=v==='a'?<Cam f={[350,965]} s={2.2}>{world()}</Cam>:<Cam f={[410,1000]} s={1.9}>{world()}</Cam>;
  break;
 case 'chart-boundary':
  // enter-record: a medium on the record's right edge and the docked tool, not the opening frame;
  // mark-live: a close on the two dated tags
  pic=act==='enter-record'
   ?<Cam f={v==='a'?[600,720]:[560,640]} s={1.75*(1+.04*ease(glow))}>{world()}</Cam>
   :<Cam f={v==='a'?[503,650]:[503,475]} s={2.24}>{world()}</Cam>;
  break;
 case 'credential-gate':
  // the struck keys, the masked field and the record's padlock all in one readable frame
  pic=<Cam f={v==='a'?[215,985]:[190,940]} s={v==='a'?2:1.9}>{world()}</Cam>;break;
 case 'citation-stack':{
  const e=ease(raw(fanWin));
  pic=<Cam f={mixPt([330,1030],[420,780],e)} s={lerp(1.25,.85,e)}>{citationRead(false)}</Cam>;break;}
 case 'source-types':
  // the answer card stays wholly above the caption band while the two named cards lift
  if(act==='name-source-types')pic=<Cam f={[400,800]} s={1.1}>{citationRead(true)}</Cam>;
  else pic=<Cam f={[560,640]} s={.9}>{answerRead()}</Cam>;   // A s7: wider than s6, the literature card rises into view
  break;
 case 'share-grid':
  // s8: framed right of the start pin, so the end pin and its evaluating tag sit in frame, with the
  // tool wholly in frame below the caption band; A's disclosure pill moves off the figure rows
  if(act==='keep-evaluating'){pic=v==='a'?<Cam f={[775,398]} s={2.2}>{world()}</Cam>:<Cam f={[760,685]} s={2.2}>{world()}</Cam>;if(v==='a')chip=[400,1048];}
  // close: the clinician figures light past half; medium: the bar, the decision tag and the tool it
  // names, with the tool wholly above the caption band
  else if(fr==='close')pic=v==='a'?<Cam f={[735,200]} s={2.3}>{world()}</Cam>:<Cam f={[697,300]} s={2.3}>{world()}</Cam>;
  else pic=v==='a'?<Cam f={[740,603]} s={1.75}>{world()}</Cam>:<Cam f={[690,622]} s={1.75}>{world()}</Cam>;
  break;
 case 'unmeasured-card':
  if(act==='attribute-report')pic=v==='a'?<Cam f={[720,320]} s={2}>{world()}</Cam>:<Cam f={[680,664]} s={2.05}>{world()}</Cam>;
  // A: medium while the tags clip on, then a close as their "Not in release" line appears.
  // B: one close on the clip for both events.
  else if(v==='a'&&fr==='medium')pic=<Cam f={[485,810]} s={1.32}>{answerRead()}</Cam>;
  else pic=limitsClose();
  break;
 case 'answer-close':
  if(act==='keep-evaluating')pic=<Cam f={[540,760]} s={1}>{ending()}</Cam>;
  else if(fr==='detail'){const fc=answerFocus(ANSWER_ACCURACY);pic=<Cam f={[fc[0]-40,fc[1]-20]} s={2}>{answerRead()}</Cam>;}
  else pic=<Cam f={[550,700]} s={1.04}>{answerRead()}</Cam>;   // B s7: wider than s6, the literature card rises into view
  break;
 default:throw new Error('Unimplemented clinic answer view '+view);
 }
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <rect width={1080} height={1920} fill={c.background}/>
  <g data-view={view} data-framing={fr} data-clause={clause?.id} data-action={act} data-variant={v}
   transform={`translate(${flat?.x??0} ${flat?.y??0}) scale(${flat?.scale??1})`}>{pic}</g>
  <g data-disclosure="production_disclosure" transform={`translate(${chip[0]} ${chip[1]})`}>
   <path d="M44 132H500Q516 132 516 148V172Q516 188 500 188H44Z" fill={c.paper} opacity={.92}/>
   <text x={60} y={170} fontFamily={FONT.body} fontSize={26} fontWeight={700} fill={c.ink}>{scene.production_disclosure??'Illustration'}</text>
  </g>
 </svg>;
};
// Layout constants exported for readers of the geometry above.
export const CLINIC_ANSWER_LAYOUT={WORLDS,HERO_SIZE};
/** The strike rig and geometry helpers, exported for the numeric motion check (no rendering). */
export const CLINIC_RIG={run,sendAt,fingerLift,bobOf,bez,placed,ease,lerp};
