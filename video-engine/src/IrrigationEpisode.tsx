import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DispatchProps, Scene} from './Dispatch';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import {CameraMoves, composeCams, Plane, Stage3D} from './lib/stage3d';
import {Element} from './lib/registry';
import {GradeLayer, RegionLight} from './lib/lighting';
import {FONT} from './lib/type';
import {SAFE_RIGHT} from './lib/safearea';

const clamp = (v: number) => Math.max(0, Math.min(1, v));

const Shot: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = clamp(frame / Math.max(1, scene.duration_s * fps - 1));
  const move = CameraMoves[scene.camera_strategy](p);
  const second = scene.camera_secondary ? CameraMoves[scene.camera_secondary](p) : {};
  const entry = scene.camera_entry;
  const entryWeight = entry ? 1 - Math.pow(Math.sin(clamp(p / entry.until_progress) * Math.PI / 2), 2) : 0;
  const camera = composeCams({x: (move.x ?? 0) * 0.45, y: (move.y ?? 0) * 0.35,
    z: (move.z ?? 0) * 0.45, rotY: (move.rotY ?? 0) * 0.35,
    rotX: (move.rotX ?? 0) * 0.25},
    {x: (second.x ?? 0) * 0.16 + (entry?.x ?? 0) * entryWeight,
      y: (second.y ?? 0) * 0.16 + (entry?.y ?? 0) * entryWeight,
      z: (second.z ?? 0) * 0.16 + (entry?.z ?? 0) * entryWeight,
      rotY: (second.rotY ?? 0) * 0.16}, scene.camera_base ?? {});
  return <div style={{position: 'absolute', inset: 0, background: '#1b2830'}}>
    <RegionLight region="high_plains" weather="late">
      <Stage3D camera={camera} background="#1b2830">
        {scene.planes.map((plane, pi) => <Plane key={pi} z={plane.z}
          fill={plane.items.every(i => i.kind === 'farmlandLayer' && i.props?.layer !== 'edge')}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow: 'visible'}}>
            {plane.items.map((item, ii) => <g key={item.id ?? ii} data-story-item={item.id}>
              <Element item={{...item, props: {...item.props, progress: p,
                ...(item.kind === 'person' && item.props?.gesture_start !== undefined ? {
                  gesture: clamp((p - Number(item.props.gesture_start)) / 0.25),
                } : {})}}} frame={frame}
                at={{scene: scene.id, plane: pi, item: ii}}/>
            </g>)}
          </svg>
        </Plane>)}
      </Stage3D>
    </RegionLight>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <GradeLayer f={frame} vignette={0.14} grain={0.026} bloom={0.06}/>
      <path d={`M54,115 H${SAFE_RIGHT - 28}`} stroke="#f3ebcf" strokeWidth={2} opacity={0.55}/>
      <text x={55} y={94} fontFamily={FONT.body} fontSize={23} letterSpacing={3}
        fill="#f3ebcf">TEXAS AI DOCKET</text>
      <text x={SAFE_RIGHT - 28} y={94} fontFamily={FONT.body} fontSize={20} textAnchor="end"
        fill="#f3ebcf">CROSBY COUNTY</text>
      <text x={55} y={151} fontFamily={FONT.body} fontSize={21} letterSpacing={1.5}
        fill="#f3ebcf" opacity={0.8}>SYSTEM ILLUSTRATION · NOT FIELD FOOTAGE</text>
      {scene.super && <g opacity={clamp(frame / 12)}>
        <text x={55} y={198} fontFamily={FONT.display} fontSize={47} fontWeight={700}
          fill="#f3ebcf">{scene.super}</text>
      </g>}
    </svg>
  </div>;
};

/** One physical machine, then its observations, then the human who has to use them.
 * All evidence geometry is drawn from the bound board items; no episode-only facts. */
export const IrrigationEpisode: React.FC<DispatchProps> = ({scenes, captions, credits, credits_s = 5.5}) => {
  const {fps} = useVideoConfig();
  const end = Math.max(...scenes.map(s => s.start_s + s.duration_s));
  return <>
    {scenes.map(scene => <Sequence key={scene.id} from={Math.round(scene.start_s * fps)}
      durationInFrames={Math.max(1, Math.round(scene.duration_s * fps))}><Shot scene={scene}/></Sequence>)}
    {captions && <Sequence durationInFrames={Math.round(end * fps)}><SubtitleTrack cues={captions} fps={fps}/></Sequence>}
    {credits && <Sequence from={Math.round(end * fps)} durationInFrames={Math.round(credits_s * fps)}>
      <CreditsCard text={credits}/>
    </Sequence>}
  </>;
};
