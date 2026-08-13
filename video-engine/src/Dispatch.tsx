import React from 'react';
import {useCurrentFrame, useVideoConfig, Sequence, interpolate, Easing} from 'remotion';
import {Biome} from './lib/biomes';
import {Plane, CameraMoves, composeCams, Camera} from './lib/stage3d';
import {GradeLayer} from './lib/lighting';
import {Element, Placed} from './lib/registry';
import type {RegionName} from './lib/lighting';

// =============================================================================
// THE DISPATCH — the composition the routine actually renders.
//
// IT DID NOT EXIST. `prompts/dispatch_routine.md` Phase 5 has always run
//
//     npx remotion render Dispatch out/dispatch/film.mp4 --props=...
//
// and `Root.tsx` registered Proof, the review sheets and ten region sheets and
// nothing named Dispatch. Remotion exits with "No composition with the ID
// 'Dispatch' found", so **every unattended run produced no film**, and the two
// gates that would have caught it were being invoked with no arguments and
// exiting 2 before they read anything. Three faults stacked into one silence.
//
// So this is the deliverable, and its shape follows the routine's own rule:
// SCENES ARE CODE, STORY IS DATA. The board arrives through `--props`, names a
// region, a camera move, a plane stack and what stands on each plane, and this
// turns it into a film. `lib/registry.tsx` is the boundary where a name becomes a
// component, and it THROWS on a name it does not have rather than rendering an
// empty plane, because a scene that draws nothing renders without error.
//
// WHAT THIS IS NOT. It is not a template that makes every Dispatch look alike.
// The composition axes and the cross-run divergence rule in `storyboard_check`
// govern that, and they operate on the board this reads. A run that wants a shot
// this cannot express writes a bespoke scene component and registers it; the
// engine is a floor, not a ceiling.
// =============================================================================

export interface Scene {
  id: string;
  start_s: number;
  duration_s: number;
  region: RegionName;
  county: string;
  camera_strategy: keyof typeof CameraMoves;
  /** ordered far to near. Each plane's z and what stands on it. */
  planes: {z: number; items: Placed[]}[];
  /** screen-space, never in the world: see the note on chrome below */
  super?: string;
  caption?: string;
  weather?: 'norther' | 'dust' | 'overcast' | 'night';
  seed?: number;
  groundY?: number;
}

export type DispatchProps = {
  runtime_s: number;
  scenes: Scene[];
  title?: string;
  /** the composition fingerprint, carried so the render can be traced to a board */
  fingerprint?: Record<string, string>;
  // Remotion types a Composition's props as Record<string, unknown>, so the shape has
  // to stay assignable to it. The index signature is what makes that true; the named
  // fields above are what the component and the gates actually rely on.
  [k: string]: unknown;
};

/**
 * The default props exist so `npx remotion still Dispatch` works with no board at
 * all, which is what makes this composition testable in CI. They are a real
 * two-scene film rather than a placeholder, because a default that cannot render
 * is a default that hides a break.
 */
export const DEFAULT_DISPATCH: DispatchProps = {
  runtime_s: 10,
  title: 'The newest industry sits on the oldest land',
  scenes: [
    {
      id: 's1', start_s: 0, duration_s: 5, region: 'rolling_plains', county: 'Taylor',
      camera_strategy: 'dollyThrough', seed: 31, groundY: 1060,
      super: 'Taylor County',
      planes: [
        {z: 860, items: [{kind: 'turkeyVulture', x: 760, y: 330, scale: 0.5, seed: 51}]},
        {z: 640, items: [
          {kind: 'pumpjack', x: 130, y: 962, scale: 0.5, seed: 40, props: {rpm: 7, wear: 0.4}},
          {kind: 'pumpjack', x: 470, y: 958, scale: 0.52, seed: 49, props: {rpm: 8, wear: 0.5}},
          {kind: 'windTurbine', x: 980, y: 958, scale: 0.62, seed: 3},
        ]},
        {z: 300, items: [{kind: 'dataCentre', x: -40, y: 1180, scale: 1.5, seed: 5,
                          props: {wear: 0.25}}]},
        {z: 150, items: [
          {kind: 'person', x: 330, y: 1420, scale: 0.8, props: {cast: 'engineer', pose: 'point'}},
          {kind: 'person', x: 620, y: 1426, scale: 0.8, facing: -1,
           props: {cast: 'rancher', pose: 'hands-hips', emotion: 'wry'}},
        ]},
        {z: 40, items: [{kind: 'mesquite', x: -90, y: 2080, scale: 5.4, seed: 9}]},
      ],
    },
    {
      id: 's2', start_s: 5, duration_s: 5, region: 'high_plains', county: 'Lubbock',
      camera_strategy: 'craneDown', seed: 12, groundY: 1120,
      super: 'and the water under it',
      planes: [
        {z: 700, items: [{kind: 'waterTower', x: 820, y: 1000, scale: 0.9, seed: 2}]},
        {z: 420, items: [{kind: 'windmill', x: 200, y: 1060, scale: 1.1, seed: 4}]},
        {z: 200, items: [{kind: 'stockTank', x: 620, y: 1180, scale: 1.2, seed: 6}]},
        {z: 90, items: [{kind: 'jackrabbit', x: 300, y: 1300, scale: 0.9, seed: 24}]},
      ],
    },
  ],
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** One scene, staged from data. */
export const DispatchScene: React.FC<{scene: Scene; fps: number}> = ({scene, fps}) => {
  const f = useCurrentFrame();
  const dur = Math.max(1, Math.round(scene.duration_s * fps));
  const p = interpolate(f, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.bezier(0.35, 0, 0.2, 1),
  });

  // The move is named by the board and resolved here. An unknown name would
  // silently give a static camera, which storyboard_check already refuses at
  // Gate 0 and which this refuses again at render time, because the two checks
  // guard different moments and the cheap one is not always the one that runs.
  const move = CameraMoves[scene.camera_strategy];
  if (!move) {
    throw new Error(
      `scene ${scene.id}: camera_strategy "${scene.camera_strategy}" is not a composed move. ` +
      `A static camera wastes the engine, so this stops rather than rendering one. ` +
      `Known: ${Object.keys(CameraMoves).join(', ')}`);
  }
  const camera: Camera = composeCams(move(p));

  return (
    <div style={{position: 'absolute', inset: 0, background: '#0d1220'}}>
      <Biome region={scene.region} frame={f} camera={camera} seed={scene.seed ?? 1}
        groundY={scene.groundY ?? 1060} weather={scene.weather}>
        {scene.planes.map((pl, i) => (
          <Plane key={i} z={pl.z}>
            <svg width={1080} height={1920} viewBox="0 0 1080 1920">
              {/* The ADDRESS is threaded in, not just the item. An element the board
                  did not seed takes its variation from where it stands, which is
                  distinct per instance and the same on every frame. See `seedFor`
                  for why appearance may not come from tree position. */}
              {pl.items.map((item, j) => (
                <Element key={`${item.kind}-${j}`} item={item} frame={f}
                  at={{scene: scene.id, plane: i, item: j}} />
              ))}
            </svg>
          </Plane>
        ))}
      </Biome>

      {/* SCREEN-SPACE CHROME STAYS OUTSIDE Stage3D. A super or a caption is not a
          world object, and putting one in the world is how a title ends up lying
          on the ground during a crane move. */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}>
        <GradeLayer f={f} vignette={0.2} grain={0.045} bloom={0.12} />
        {scene.super && (
          <g opacity={interpolate(f, [4, 18, dur - 12, dur - 2], [0, 1, 1, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <text x={64} y={210} fontSize={74} fontWeight={700} fill="#f2ede2"
              fontFamily="Georgia, serif">{scene.super}</text>
            <rect x={64} y={244} width={132} height={5} fill="#c8703a" />
          </g>
        )}
        {scene.caption && (
          <g opacity={clamp01(interpolate(f, [2, 12], [0, 1],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}>
            <rect x={54} y={1660} width={972} height={92} rx={6} fill="#0d1220" opacity={0.72} />
            <text x={78} y={1716} fontSize={34} fill="#e4ded2"
              fontFamily="Georgia, serif">{scene.caption}</text>
          </g>
        )}
      </svg>
    </div>
  );
};

export const Dispatch: React.FC<DispatchProps> = ({scenes}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {scenes.map((s) => (
        <Sequence key={s.id} from={Math.round(s.start_s * fps)}
          durationInFrames={Math.max(1, Math.round(s.duration_s * fps))}>
          <DispatchScene scene={s} fps={fps} />
        </Sequence>
      ))}
    </>
  );
};

/**
 * The film's length comes from the BOARD, never from a constant here.
 *
 * A hardcoded durationInFrames would silently truncate a longer film or pad a
 * shorter one with black, and both are the kind of fault a run reports as
 * success. Remotion calls this with the real props at render time.
 */
export const dispatchMetadata = ({props}: {props: Record<string, unknown>}) => {
  const board = props as unknown as DispatchProps;
  const last = (board.scenes ?? []).reduce(
    (m, s) => Math.max(m, (s.start_s ?? 0) + (s.duration_s ?? 0)), 0);
  const seconds = Math.max(board.runtime_s ?? 0, last);
  if (seconds <= 0) {
    throw new Error(
      'Dispatch: the board declares no runtime and no scenes, so there is nothing to render. ' +
      'A zero-length composition renders "successfully" as an empty file.');
  }
  return {durationInFrames: Math.round(seconds * 30)};
};
