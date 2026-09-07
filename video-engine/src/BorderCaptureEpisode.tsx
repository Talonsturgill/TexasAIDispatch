import React from 'react';
import {Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {DispatchProps, Scene} from './Dispatch';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import {CameraMoves, composeCams, Plane, Stage3D} from './lib/stage3d';
import {Element} from './lib/registry';
import {GradeLayer, RegionLight} from './lib/lighting';
import {FONT, wrapToWidth} from './lib/type';
import {SAFE_RIGHT} from './lib/safearea';

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/**
 * One continuous border walk, staged from the board rather than restated here.
 *
 * The board owns every object and fact. This wrapper supplies the film grammar the
 * generic renderer cannot: a restrained shared camera, a persistent instrument rail,
 * and a scan-line cut that makes each shot feel like the next state of one capture
 * process instead of another slide arriving.
 */
const BorderShot: React.FC<{scene: Scene; index: number; total: number}> = ({scene, index, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dur = Math.max(1, Math.round(scene.duration_s * fps));
  const p = clamp(frame / Math.max(1, dur - 1));
  const primary = CameraMoves[scene.camera_strategy](p);
  const secondary = scene.camera_secondary ? CameraMoves[scene.camera_secondary](p) : {};
  const camera = composeCams(
    {
      x: (primary.x ?? 0) * 0.27,
      y: (primary.y ?? 0) * 0.22,
      z: (primary.z ?? 0) * 0.24,
      rotX: (primary.rotX ?? 0) * 0.22,
      rotY: (primary.rotY ?? 0) * 0.24,
      rotZ: (primary.rotZ ?? 0) * 0.18,
    },
    {
      x: (secondary.x ?? 0) * 0.10,
      y: (secondary.y ?? 0) * 0.09,
      z: (secondary.z ?? 0) * 0.08,
      rotX: (secondary.rotX ?? 0) * 0.08,
      rotY: (secondary.rotY ?? 0) * 0.09,
      rotZ: (secondary.rotZ ?? 0) * 0.06,
    },
    {
      x: (scene.camera_base?.x ?? 0) * 0.28,
      y: (scene.camera_base?.y ?? 0) * 0.28,
      z: (scene.camera_base?.z ?? 0) * 0.28,
    },
  );

  const cut = 1 - clamp(frame / 10);
  const out = clamp((dur - frame) / 8);
  const superLines = scene.super ? wrapToWidth(scene.super, SAFE_RIGHT - 118, 45) : [];
  const superOpacity = Math.min(clamp((frame - 5) / 12), clamp((dur - frame) / 12));
  const scanX = interpolate(frame, [0, 11], [-80, 1160], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return <div style={{position: 'absolute', inset: 0, background: '#06111c'}}>
    <RegionLight region="south_texas" weather={scene.weather}>
      <Stage3D camera={camera} background="#06111c">
        {scene.planes.map((plane, pi) => <Plane key={pi} z={plane.z}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920"
            style={{overflow: 'visible'}}>
            {plane.items.map((item, ii) => <g key={item.id ?? `${item.kind}-${ii}`}
              data-story-item={item.id}>
              <Element item={{...item, props: {...item.props, progress: p}}} frame={frame}
                at={{scene: scene.id, plane: pi, item: ii}} />
            </g>)}
          </svg>
        </Plane>)}
      </Stage3D>
    </RegionLight>

    <svg width={1080} height={1920} viewBox="0 0 1080 1920"
      style={{position: 'absolute', inset: 0}}>
      <GradeLayer f={frame} vignette={0.22} grain={0.034} bloom={0.09} />

      {/* The instrument rail persists through every cut, turning eight scenes into
          one measured passage. It never carries a claim that is absent from the board. */}
      <g opacity={0.96}>
        <rect x={0} y={0} width={1080} height={146} fill="#06111c" opacity={0.84} />
        <rect x={54} y={54} width={8} height={43} rx={4} fill="#f1a33a" />
        <text x={84} y={86} fontFamily={FONT.body} fontSize={22} fontWeight={750}
          fill="#f4eddf" letterSpacing={2.8}>TEXAS AI DOCKET</text>
        <text x={SAFE_RIGHT} y={86} textAnchor="end" fontFamily={FONT.body} fontSize={19}
          fill="#52ced0" letterSpacing={2}>HIDALGO COUNTY</text>
        <path d={`M54,116 H${SAFE_RIGHT}`} stroke="#839ba0" strokeWidth={2} opacity={0.5} />
        {Array.from({length: total}, (_, i) => {
          const x = 54 + i * ((SAFE_RIGHT - 54) / Math.max(1, total - 1));
          const passed = i <= index;
          return <g key={i}>
            {i < total - 1 && <line x1={x} y1={127} x2={x + (SAFE_RIGHT - 54) / (total - 1)}
              y2={127} stroke={i < index ? '#f1a33a' : '#42616a'} strokeWidth={4} />}
            <circle cx={x} cy={127} r={passed ? 7 : 5}
              fill={passed ? '#f1a33a' : '#42616a'} />
          </g>;
        })}
      </g>

      {superLines.length > 0 && <g opacity={superOpacity}>
        <rect x={54} y={174} width={Math.min(SAFE_RIGHT - 54, 820)}
          height={36 + superLines.length * 55} rx={7} fill="#06111c" opacity={0.77} />
        <rect x={54} y={174} width={5} height={36 + superLines.length * 55}
          fill="#c86f3d" />
        {superLines.map((line, i) => <text key={`${line}-${i}`} x={78} y={225 + i * 55}
          fontFamily={FONT.display} fontSize={45} fontWeight={720} fill="#f4eddf">
          {line}
        </text>)}
      </g>}

      {/* A very short optical scan bridges hard cuts. The underlying subject is
          already present; this is punctuation, never a transition card. */}
      {frame < 12 && <g opacity={cut * 0.78}>
        <rect x={scanX - 150} y={0} width={300} height={1920} fill="#52ced0"
          opacity={0.08} />
        <line x1={scanX} y1={0} x2={scanX} y2={1920} stroke="#f1a33a"
          strokeWidth={7} />
      </g>}
      <rect x={0} y={0} width={1080} height={1920} fill="none" stroke="#c86f3d"
        strokeWidth={5} opacity={0.30 * out} />
    </svg>
  </div>;
};

export const BorderCaptureEpisode: React.FC<DispatchProps> = ({scenes, captions, credits,
  credits_s = 5}) => {
  const {fps} = useVideoConfig();
  const end = scenes.reduce((m, scene) => Math.max(m, scene.start_s + scene.duration_s), 0);
  return <>
    {scenes.map((scene, index) => <Sequence key={scene.id}
      from={Math.round(scene.start_s * fps)}
      durationInFrames={Math.max(1, Math.round(scene.duration_s * fps))}>
      <BorderShot scene={scene} index={index} total={scenes.length} />
    </Sequence>)}
    {captions && captions.length > 0 && <Sequence from={0}
      durationInFrames={Math.max(1, Math.round(end * fps))}>
      <SubtitleTrack cues={captions} fps={fps} />
    </Sequence>}
    {credits && credits.trim() && <Sequence from={Math.round(end * fps)}
      durationInFrames={Math.max(1, Math.round(credits_s * fps))}>
      <CreditsCard text={credits} />
    </Sequence>}
  </>;
};
