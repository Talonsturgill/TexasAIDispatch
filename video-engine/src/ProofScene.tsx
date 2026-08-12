import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {Biome} from './lib/biomes';
import {Plane, Card, CameraMoves, composeCams} from './lib/stage3d';
import {Character, castProps} from './lib/Character';
import {Pumpjack, DataCentre, LatticeTower, Conductor, WindTurbine, Mesquite} from './lib/kit';
import {GradeLayer, INK} from './lib/lighting';

// =============================================================================
// THE PROOF SCENE — the whole stack in one shot, and the composition this show is
// built on: THE NEWEST INDUSTRY SITTING ON THE OLDEST LANDSCAPE.
//
// A data centre on caliche in the Rolling Plains, a pumpjack field behind it every
// unit at a different point in its stroke, transmission marching out of frame, and
// two people at human scale so the slab reads as enormous.
//
// The camera composes THREE moves, per the authoring doctrine: a scene with a
// static camera wastes the engine.
// =============================================================================
export const ProofScene: React.FC = () => {
  const f = useCurrentFrame();
  const dur = 150;
  const p = interpolate(f, [0, dur], [0, 1], {
    extrapolateRight: 'clamp', easing: Easing.bezier(0.35, 0, 0.2, 1),
  });

  const camera = composeCams(
    CameraMoves.dollyThrough(p, 420),
    CameraMoves.truckAcross(p, 130),
    CameraMoves.craneDown(interpolate(p, [0, 0.7], [0, 1], {extrapolateRight: 'clamp'}), 120),
  );
  const camRotY = camera.rotY ?? 0;

  return (
    <div style={{position: 'absolute', inset: 0, background: '#0d1220'}}>
      <Biome region="rolling_plains" frame={f} camera={camera} seed={26} groundY={1060}>
        {/* the field, well behind the slab */}
        <Plane z={640}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            {[0, 1, 2, 3].map((i) => (
              <Pumpjack key={i} frame={f} seed={40 + i * 9}
                x={40 + i * 330} y={962 - i * 5} scale={0.46 + i * 0.03}
                rpm={7 + i} abandoned={i === 2} wear={0.3 + i * 0.12} />
            ))}
            <WindTurbine frame={f} x={980} y={958} scale={0.62} seed={3} />
          </svg>
        </Plane>

        {/* transmission crossing the middle distance, conductors SAGGING */}
        <Plane z={520}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <LatticeTower x={150} y={1058} scale={0.72} />
            <LatticeTower x={640} y={1060} scale={0.75} />
            <LatticeTower x={1090} y={1062} scale={0.72} />
            <Conductor x1={150} y1={886} x2={640} y2={882} sag={0.10} />
            <Conductor x1={640} y1={882} x2={1090} y2={888} sag={0.10} />
            <Conductor x1={150} y1={912} x2={640} y2={908} sag={0.11} />
            <Conductor x1={640} y1={908} x2={1090} y2={914} sag={0.11} />
          </svg>
        </Plane>

        {/* the slab */}
        <Plane z={300}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <DataCentre x={-40} y={1180} scale={1.5} seed={5} wear={0.25} />
          </svg>
        </Plane>

        {/* the people, at human scale, so the slab reads enormous */}
        <Plane z={150}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <Character {...castProps('engineer')} frame={f} x={330} y={1420} scale={0.8}
              facing={1} pose="point" gesture={interpolate(p, [0.25, 0.6], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} emotion="neutral" />
            <Character {...castProps('rancher')} frame={f} x={620} y={1426} scale={0.8}
              facing={-1} pose="hands-hips" emotion="wry" />
          </svg>
        </Plane>

        {/* foreground sweep: a mesquite the camera passes, which is what sells the dolly */}
        <Plane z={40}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            {/* A FOREGROUND ELEMENT MUST BREAK AN EDGE. Sitting a tree tidily inside the
                frame at z=40 makes it one more mid-ground object; running it off the bottom
                is what gives the dolly something to sweep past and what tells the eye how
                close the camera is. */}
            {/* AT THE EDGES, not across the middle. A near plane inside a dollyThrough
                scales up hard as the camera closes on it, so a foreground element placed
                near frame centre grows across the subject and reads as a bug rather than as
                depth. Put it where the truck sweeps it past the edge. */}
            <Mesquite x={-90} y={2080} scale={5.4} seed={9} />
            <Mesquite x={1180} y={2130} scale={4.6} seed={14} />
          </svg>
        </Plane>
      </Biome>

      {/* screen-space chrome stays OUTSIDE Stage3D: captions and lower thirds are not
          world objects, and putting them in the world is how a title ends up lying on
          the ground in a crane move. */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}>
        <GradeLayer f={f} vignette={0.2} grain={0.045} bloom={0.12} />
        <g opacity={interpolate(f, [6, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
          <text x={64} y={220} fontSize={78} fontWeight={700} fill="#f2ede2"
            fontFamily="Georgia, serif">The newest industry</text>
          <text x={64} y={310} fontSize={78} fontWeight={700} fill="#f2ede2"
            fontFamily="Georgia, serif">sits on the oldest land</text>
          <rect x={64} y={344} width={132} height={5} fill="#c8703a" />
        </g>
      </svg>
    </div>
  );
};
