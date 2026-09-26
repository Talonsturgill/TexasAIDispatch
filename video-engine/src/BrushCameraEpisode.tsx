import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicStage} from './lib/cinema/CinematicStage';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {cue, mix, type V3} from './lib/cinema/motion';
import {GradeLayer} from './lib/lighting';
import {FONT} from './lib/type';
import {CreditsCard, SubtitleTrack, type DispatchProps, type Scene} from './Dispatch';

const navy = '#102631';
const cream = '#efe5cf';
const copper = '#d9845a';
const mint = '#80cbbd';

const Block: React.FC<{position: V3; size: V3; color: string; rotation?: V3; metal?: number}> =
  ({position, size, color, rotation = [0, 0, 0], metal = 0}) =>
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size}/>
      <meshStandardMaterial color={color} metalness={metal} roughness={metal ? .42 : .83}/>
    </mesh>;

const Wheel: React.FC<{x: number; z: number}> = ({x, z}) =>
  <group position={[x, -.65, z]} rotation={[Math.PI / 2, 0, 0]}>
    <mesh castShadow><cylinderGeometry args={[.38, .38, .17, 20]}/><meshStandardMaterial color="#1b292d" roughness={.92}/></mesh>
    <mesh position={[0, .10, 0]}><cylinderGeometry args={[.18, .18, .02, 18]}/><meshStandardMaterial color="#a6a39a" metalness={.68} roughness={.43}/></mesh>
  </group>;

const BrickHouse: React.FC<{roofOpen?: number; z?: number}> = ({roofOpen = 0, z = -2.15}) =>
  <group position={[1.73, -.35, z]}>
    <Block position={[0, .43, 0]} size={[3.2, 1.85, 1.4]} color="#9b6e59"/>
    <Block position={[-.85, .28, .72]} size={[.68, .75, .04]} color="#405865"/>
    <Block position={[.84, .28, .72]} size={[.68, .75, .04]} color="#405865"/>
    <Block position={[.05, -.06, .73]} size={[.62, 1.02, .08]} color="#4a5350"/>
    <group position={[0, 1.46, 0]} rotation={[0, 0, -.12 * roofOpen]}>
      <Block position={[-.78, 0, 0]} size={[2.02, .19, 1.8]} rotation={[0, 0, .36]} color="#534941"/>
      <Block position={[.78, 0, 0]} size={[2.02, .19, 1.8]} rotation={[0, 0, -.36]} color="#534941"/>
      <Block position={[.06, -.04, .91]} size={[.66, .08, .10]} color="#b5bbb7" metal={.62}/>
    </group>
    <Block position={[0, -1.12, 1.2]} size={[3.95, .09, 1.4]} color="#596243"/>
  </group>;

const BrushTruck: React.FC<{x: number; shutter?: number; wheelTurn?: number}> =
  ({x, shutter = 0, wheelTurn = 0}) =>
  <group position={[x, -.23, 1.26]} rotation={[0, -.06 * wheelTurn, 0]}>
    <Block position={[.25, .05, 0]} size={[3.35, 1.47, 1.35]} color="#3e7767" metal={.22}/>
    <Block position={[-1.7, -.06, 0]} size={[1.18, 1.28, 1.29]} color="#e1d7bf" metal={.13}/>
    <Block position={[-1.7, .31, .66]} size={[.77, .55, .035]} color="#527581"/>
    <Block position={[.33, .73, 0]} size={[3.19, .13, 1.42]} color="#264f4a"/>
    <Block position={[.32, -.74, 0]} size={[3.55, .18, 1.48]} color="#27393b"/>
    <Block position={[1.32, .36, .73]} size={[.49, .45, .20]} color="#20383d" metal={.46}/>
    <mesh position={[1.33, .36, .86]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[.22, .22, .12, 24]}/>
      <meshPhysicalMaterial color={shutter > .2 ? mint : '#203237'} metalness={.55}
        roughness={.24} clearcoat={1} emissive={shutter > .2 ? '#3c9d94' : '#000000'} emissiveIntensity={.62}/>
    </mesh>
    <Wheel x={-1.6} z={.72}/><Wheel x={1.25} z={.72}/>
    <Wheel x={-1.6} z={-.72}/><Wheel x={1.25} z={-.72}/>
    {Array.from({length: 6}, (_, i) =>
      <Block key={i} position={[.04 + i * .40, -.90, -.48]} size={[.09, .34, .12]} color="#867d65"/>)}
  </group>;

const Photo: React.FC<{position: V3; rotation?: V3; scale?: number; flagged?: boolean; mode?: 'house' | 'roof'}> =
  ({position, rotation = [0, 0, 0], scale = 1, flagged = false, mode = 'house'}) =>
  <group position={position} rotation={rotation} scale={scale}>
    <Block position={[0, 0, 0]} size={[2.12, 2.62, .08]} color="#e9e1ca"/>
    <Block position={[0, .22, .052]} size={[1.76, 1.85, .022]} color={mode === 'roof' ? '#665f56' : '#536b70'}/>
    {mode === 'house' ? <>
      <Block position={[0, -.02, .068]} size={[1.40, .66, .012]} color="#a6765b"/>
      <Block position={[0, .43, .069]} size={[1.55, .13, .012]} rotation={[0, 0, -.17]} color="#4c4540"/>
      <Block position={[.34, .35, .084]} size={[.50, .06, .012]} color="#ccd4cc" metal={.45}/>
    </> : <>
      <Block position={[0, .15, .07]} size={[1.55, .12, .02]} rotation={[0, 0, -.24]} color="#383d3a"/>
      <Block position={[.28, .32, .09]} size={[.68, .09, .02]} color="#d4d8cf" metal={.66}/>
    </>}
    {flagged && <Block position={[.35, .32, .10]} size={[.68, .68, .014]} color={copper}/>}
  </group>;

const Letter: React.FC<{position: V3; rotation?: V3; shade?: string; scale?: number}> =
  ({position, rotation = [0, 0, 0], shade = cream, scale = 1}) =>
  <group position={position} rotation={rotation} scale={scale}>
    <Block position={[0, 0, 0]} size={[2.1, 2.76, .07]} color={shade}/>
    <Block position={[-.51, .98, .045]} size={[.75, .065, .01]} color="#254d59"/>
    {[.57, .38, .19, -.05].map((y, i) =>
      <Block key={i} position={[-.14 + (i === 3 ? -.20 : 0), y, .045]}
        size={[i === 3 ? 1.14 : 1.62, .033, .01]} color="#aab6ad"/>)}
    <Block position={[-.31, -.57, .046]} size={[1.06, .12, .01]} color={copper}/>
  </group>;

const Person: React.FC<{reach: number; z?: number}> = ({reach, z = -.72}) =>
  <group position={[1.85, -.76, z]}>
    <mesh position={[0, 1.78, 0]} castShadow><sphereGeometry args={[.42, 18, 18]}/><meshStandardMaterial color="#9d6d51" roughness={.9}/></mesh>
    <Block position={[0, .60, 0]} size={[1.03, 1.83, .50]} color="#3e6071"/>
    <Block position={[-.52 - 1.15 * reach, .75 - .34 * reach, .05]}
      rotation={[0, 0, -.20 - .35 * reach]} size={[.28, 1.15, .28]} color="#9d6d51"/>
    <Block position={[-.57 - 1.68 * reach, .28 - .45 * reach, .05]}
      size={[.36, .17, .25]} color="#a87959"/>
  </group>;

const ReviewingHand: React.FC<{reach: number; lift?: number}> = ({reach, lift = 0}) => {
  const x = mix(2.9, -.05, reach);
  const y = mix(.23, -.69, reach);
  return <group position={[0, .35 * lift, 0]}>
    <Block position={[mix(3.22, 1.28, reach), mix(.17, -.40, reach), .65]}
      size={[2.1, .45, .48]} rotation={[0, 0, -.20 * reach]} color="#3e6071"/>
    <Block position={[x, y, .74]} size={[.86, .32, .48]}
      rotation={[0, 0, -.13 * reach]} color="#a87959"/>
    {[0, 1, 2, 3].map(i => <Block key={i}
      position={[x - .43 - .11 * reach, y + .12 - i * .085, .82]}
      size={[.38, .066, .11]} color="#a87959"/>)}
  </group>;
};

const stageCamera = (id: string): {position: V3; target: V3} => {
  if (id === 's1') return {position: [-.40, 5.2, 11.5], target: [0, -1.05, 1.1]};
  if (id === 's2') return {position: [0, 1.7, 8.0], target: [0, -.40, -1.0]};
  if (id === 's3') return {position: [-.40, 5.2, 11.5], target: [0, -1.05, 1.1]};
  if (['s4', 's8'].includes(id)) return {position: [.1, 4.0, 6.7], target: [0, -.86, .35]};
  if (id === 's9') return {position: [.2, 3.15, 7.8], target: [.2, -1.0, -.4]};
  if (id === 's7') return {position: [-.4, 3.4, 9.2], target: [0, -.55, 1.2]};
  if (id === 's6') return {position: [0, 3.0, 8.0], target: [0, -.3, .6]};
  return {position: [.35, 2.0, 7.2], target: [.35, -1.0, 0]};
};

const Street: React.FC<{id: string; a: number; b: number}> = ({id, a, b}) => {
  const truckX = id === 's1' ? mix(-4.5, -.9, a) : id === 's2' ? mix(-1.15, .30, a) : .25;
  return <>
    <Block position={[0, -1.30, 0]} size={[20, .10, 10]} color="#455357"/>
    <Block position={[0, -1.18, -1.28]} size={[20, .10, .19]} color="#c8bfa8"/>
    <BrickHouse z={4.55}/>
    <BrushTruck x={truckX} shutter={id === 's2' ? b : id === 's3' ? 1 : a} wheelTurn={a}/>
    {id === 's1' && <Photo position={[truckX + 1.32, mix(.28, 1.20, b), mix(2.10, 3.12, b)]}
      rotation={[0, -.08, .10 * (1-a)]} scale={mix(.04, .49, a)} />}
    {id === 's2' && b > .02 && <Photo position={[truckX + 1.32, mix(.3, .52, b), mix(2.12, 3.3, b)]}
      rotation={[0, -.08, .08 * (1-b)]} scale={mix(.03, .57, b)} />}
    {id === 's3' && <Photo position={[mix(.78, -.25, a), mix(.34, .15, a), mix(2.2, 3.45, a)]}
      rotation={[0, -.12, .08 * (1-a)]} scale={mix(.2, .86, a)} flagged={b > .5}/>}
  </>;
};

const CaptureView: React.FC<{a: number; b: number}> = ({a, b}) => <>
  <Block position={[0, -1.27, -2]} size={[20, .11, 10]} color="#485657"/>
  <Block position={[0, -1.15, 1.58]} size={[20, .13, .38]} color="#d7c9ac"/>
  <group position={[mix(3.9, -1.85, a), 0, -.45]}>
    <BrickHouse z={0}/>
  </group>
  <Block position={[-2.85, .10, 3.52]} size={[.22, 4.1, .12]} color="#213c3c"/>
  <Block position={[2.85, .10, 3.52]} size={[.22, 4.1, .12]} color="#213c3c"/>
  <Block position={[0, 2.12, 3.52]} size={[5.9, .16, .12]} color="#213c3c"/>
  <Block position={[0, -1.81, 3.52]} size={[5.9, .16, .12]} color="#213c3c"/>
  {b > .01 && <Photo position={[.18, mix(-1.4, -.1, b), 3.70]}
    scale={mix(.02, .58, b)} rotation={[0, 0, -.04 * (1-b)]}/>}
</>;

const Desk: React.FC<{id: string; a: number; b: number; c: number}> = ({id, a, b, c}) =>
  <>
    <Block position={[0, -1.24, 0]} size={[8.8, .32, 5.8]} color="#654b39"/>
    <Block position={[0, -1.47, 0]} size={[8.8, .15, 5.8]} color="#2d3434"/>
    <Block position={[-2.95, -.95, -1.23]} size={[1.45, .16, .84]} color="#526566"/>
    {id === 's4' && <>
      <Photo position={[mix(-3.4, -.62, a), -.91 + .35 * c, .36]}
        rotation={[-Math.PI/2 + .30 * c, 0, -.06]} scale={.72} flagged={b > .2}/>
      <ReviewingHand reach={b} lift={c}/>
    </>}
    {id === 's8' && <>
      <Block position={[0, .83, -2.75]} size={[8.7, 4.4, .2]} color="#a9775d"/>
      <Block position={[2.9, 1.02, -2.59]} size={[1.7, 1.9, .14]} color="#79959b"/>
      <Letter position={[mix(-3, -.80, a), -.91, .28]} rotation={[-Math.PI / 2, 0, -.08]} />
      <Photo position={[mix(3, 1.03, b), -.87, .38]} rotation={[-Math.PI / 2, 0, .08]}
        scale={.82} mode="roof"/>
    </>}
  </>;

const HomeLimit: React.FC<{a: number; b: number}> = ({a, b}) =>
  <>
    <Block position={[0, -1.28, 0]} size={[9, .11, 6.8]} color="#63694c"/>
    <group position={[-.8, 0, 0]}>
      <BrickHouse/>
      <group position={[.85, 0, 0]}><Person reach={a} z={.30}/></group>
      {b > .01 && <>
        <Block position={[1.75, 1.12, -1.02]} size={[2.02 * b, .14, .12]} color="#f2a475"/>
        <Block position={[1.75, .70, -1.02]} size={[2.02 * b, .14, .12]} color="#f2a475"/>
        <Block position={[.74, .91, -1.02]} size={[.14, .52 * b, .12]} color="#f2a475"/>
        <Block position={[2.76, .91, -1.02]} size={[.14, .52 * b, .12]} color="#f2a475"/>
      </>}
    </group>
    <Letter position={[mix(-2.8, -.58, a), mix(-1.12, -.85, a), .35]}
      rotation={[0, 0, -.11 * (1-a)]} scale={.52}/>
  </>;

const Yard: React.FC<{a: number; b: number}> = ({a, b}) =>
  <>
    <Block position={[0, -1.29, 0]} size={[9, .12, 6]} color="#77765a"/>
    <BrickHouse/>
    <group position={[.28, -.50, 1.25]} rotation={[0, 0, .28 * a]}>
      <mesh position={[0, 1.34, 0]} castShadow><sphereGeometry args={[.34, 20, 20]}/><meshStandardMaterial color="#9d6d51"/></mesh>
      <Block position={[0, .49, 0]} size={[.86, 1.24, .52]} color="#356375"/>
      <Block position={[-.28, -.49, 0]} size={[.24, .84, .34]} color="#283f4b"/>
      <Block position={[.28, -.49, 0]} size={[.24, .84, .34]} color="#283f4b"/>
      <Block position={[mix(-.04, -.44, b), .33, .34]} rotation={[0, 0, mix(-.22, -.58, b)]}
        size={[.23, 1.18, .25]} color="#9d6d51"/>
      <Block position={[.53, .35, .13]} rotation={[0, 0, .31]} size={[.23, .85, .25]} color="#9d6d51"/>
      <Block position={[mix(-.16, -.96, b), -.16, .50]}
        size={[.34, .20, .30]} color="#a87959"/>
    </group>
    <Block position={[mix(.25, -.55, b), -.25, 1.76]}
      rotation={[0, 0, -.16 - .14 * b]} size={[.11, 1.63, .12]} color="#d2a476"/>
    <Block position={[mix(.25, -.55, b), -1.05, 1.76]}
      size={[1.16, .13, .43]} color="#be9961"/>
    {Array.from({length: 6}, (_, i) => <Block key={i}
      position={[mix(-.25 + i * .19, -1.05 + i * .19, b), -1.16, 1.94]}
      size={[.07, .19, .22]} color="#d8bc83"/>)}
  </>;

const Door: React.FC<{a: number; b: number}> = ({a, b}) =>
  <>
    <Block position={[0, -1.25, -.12]} size={[9, .11, 5]} color="#5c624f"/>
    <Block position={[0, .87, -1.91]} size={[8.5, 4.6, .27]} color="#936d59"/>
    <Block position={[1.81, .53, -1.73]} size={[1.65, 3.55, .14]} color="#4c574e"/>
    <Block position={[-1.90, .12, -1.72]} size={[2.08, 1.05, .34]} color="#273d40" metal={.18}/>
    <Block position={[-1.90, .26, -1.49]} size={[1.50, .12, .09]} color="#171f21"/>
    <Letter position={[mix(-1.9, .56, a), mix(.20, -.44, a), mix(-1.2, -.62, a)]}
      rotation={[0, 0, -.10 * a]}/>
    <Person reach={b}/>
  </>;

const Roof: React.FC<{a: number; b: number}> = ({a, b}) =>
  <>
    <Block position={[0, -1.26, 0]} size={[8.2, .18, 5.5]} color="#4a5252"/>
    <Block position={[0, -.35, -.42]} size={[7.2, .24, 3.8]} rotation={[0, 0, -.24]} color="#574d43"/>
    <Block position={[.20, -.10, 1.22]} size={[2.35, .08, .20]} color="#b8c1bd" metal={.62}/>
    <mesh position={[.20, .03, 1.35]}>
      <boxGeometry args={[1.64, .08, .06]}/>
      <meshStandardMaterial color="#d2d8d1" metalness={.7} roughness={.28}
        emissive="#e5ede7" emissiveIntensity={.08 + .34 * a}/>
    </mesh>
    <Block position={[mix(-.92, 1.34, a), .09, 1.43]} size={[.22, .13, .10]}
      color="#f2f4e7" metal={.72}/>
    <Photo position={[mix(-.55, -.39, b), mix(.65, .86, b), 1.54]}
      rotation={[0, mix(-.45, -.10, b), -.11]} scale={mix(.32, .36, b)} mode="roof"/>
  </>;

const PhysicalStory: React.FC<{scene: Scene; time: number; windows: ReturnType<typeof actionWindows>}> =
  ({scene, time, windows}) => {
    const events = scene.visual_events ?? [];
    const progress = (i: number) => events[i]?.id ? actionProgress(requireAction(windows, events[i].id), time) : 0;
    const a = progress(0), b = progress(1), c = progress(2);
    const cam = stageCamera(scene.id);
    return <CinematicStage position={cam.position} target={cam.target}
      fov={scene.id === 's7' ? 47 : scene.id === 's6' ? 43 : 39}>
      {['s1', 's3'].includes(scene.id) && <Street id={scene.id} a={a} b={b}/>} 
      {scene.id === 's2' && <CaptureView a={a} b={b}/>}
      {['s4', 's8'].includes(scene.id) && <Desk id={scene.id} a={a} b={b} c={c}/>}
      {scene.id === 's5' && <Door a={a} b={b}/>}
      {scene.id === 's6' && <Roof a={a} b={b}/>}
      {scene.id === 's7' && <Yard a={a} b={b}/>}
      {scene.id === 's9' && <HomeLimit a={a} b={b}/>}
    </CinematicStage>;
  };

export const BrushCameraEpisode: React.FC<DispatchProps> = ({
  runtime_s, scenes, captions = [], credits = '', credits_s = 5,
  __cinemaProofWithoutStage = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const windows = actionWindows(scenes);
  const scene = scenes.find(s => time >= s.start_s && time < s.start_s + s.duration_s) ?? scenes[scenes.length - 1];
  const story = time < runtime_s;
  const enter = cue(time, scene.start_s + .08, scene.start_s + .50);
  return <div style={{position: 'absolute', inset: 0, background: navy, color: cream}}>
    {story && <>
      {!__cinemaProofWithoutStage && <PhysicalStory scene={scene} time={time} windows={windows}/>}
      <div style={{position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg,#102631ce 0%,transparent 21%,transparent 69%,#1026318c 100%)',
        pointerEvents: 'none'}}/>
      <div style={{position: 'absolute', left: 70, top: 93, fontFamily: FONT.mono,
        fontSize: 26, letterSpacing: 3.3, color: cream}}>TEXAS AI DISPATCH</div>
      <div style={{position: 'absolute', left: 70, top: 139, fontFamily: FONT.mono,
        fontSize: 18, letterSpacing: 2.1, color: mint}}>DALLAS / ILLUSTRATED RECONSTRUCTION</div>
      {scene.id === 's6' && <div style={{position: 'absolute', left: 70, top: 175,
        fontFamily: FONT.mono, fontSize: 18, letterSpacing: 2, color: copper}}>
        SEPARATE REPORTED CASE / NBC 5
      </div>}
      <div style={{position: 'absolute', left: 70, right: 118, top: 246,
        opacity: enter, transform: `translateY(${mix(19, 0, enter)}px)`,
        fontFamily: FONT.display, fontSize: 70, lineHeight: 1.02,
        textShadow: '0 4px 16px #102631bb'}}>{scene.super}</div>
      <GradeLayer f={frame} vignette={.13} grain={.012} bloom={.01}/>
      <SubtitleTrack cues={captions} fps={fps}/>
    </>}
    <Sequence from={Math.round(runtime_s * fps)} durationInFrames={Math.round(credits_s * fps)}>
      <CreditsCard text={credits}/>
    </Sequence>
  </div>;
};
