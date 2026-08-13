import React from 'react';
import {useCurrentFrame, interpolate, Easing} from 'remotion';
import {Biome} from './lib/biomes';
import {Plane, Card, CameraMoves, composeCams} from './lib/stage3d';
import {Character, castProps} from './lib/Character';
import {Pumpjack, DataCentre, LatticeTower, Conductor, WindTurbine, Mesquite} from './lib/kit';
import {TurkeyVulture, Grackle, Mockingbird, Jackrabbit, Roadrunner} from './lib/fauna';
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
      {/* The vegetation scatter is SEEDED, so where a shrub lands is reproducible and
          therefore composable. Seed 26 put a mesquite directly behind the rancher and it
          grew out of his hat, which is the oldest composition fault there is and one no
          gate will ever catch. Changing the seed moves the scatter; looking at the frame
          is what found it. */}
      <Biome region="rolling_plains" frame={f} camera={camera} seed={31} groundY={1060}>
        {/* TURKEY VULTURES, high and far. knowledge/texas/FAUNA_AND_FLORA.md calls them
            the most honest way to put motion in an empty rural sky, and it is right:
            nothing else moves up there, and a sky that never moves reads as a
            backdrop rather than as weather over a place. They teeter, they rarely
            flap, and at this distance the dihedral V is the only thing you can see. */}
        <Plane z={860}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <TurkeyVulture frame={f} x={760} y={330} scale={0.5} seed={51} />
            <TurkeyVulture frame={f} x={880} y={252} scale={0.34} seed={52} />
            <TurkeyVulture frame={f} x={648} y={224} scale={0.26} seed={53} />
          </svg>
        </Plane>

        {/* the field, well behind the slab */}
        <Plane z={640}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            {[0, 1, 2, 3].map((i) => (
              <Pumpjack key={i} frame={f} seed={40 + i * 9}
                x={40 + i * 330} y={962 - i * 5} scale={0.46 + i * 0.03}
                rpm={7 + i} abandoned={i === 2} wear={0.3 + i * 0.12} />
            ))}
            <WindTurbine frame={f} x={980} y={958} scale={0.005875} seed={3} />
          </svg>
        </Plane>

        {/* transmission crossing the middle distance, conductors SAGGING */}
        <Plane z={520}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <LatticeTower x={150} y={1058} scale={0.01338} />
            <LatticeTower x={640} y={1060} scale={0.01393} />
            <LatticeTower x={1090} y={1062} scale={0.01338} />
            <Conductor x1={150} y1={886} x2={640} y2={882} sag={0.10} />
            <Conductor x1={640} y1={882} x2={1090} y2={888} sag={0.10} />
            <Conductor x1={150} y1={912} x2={640} y2={908} sag={0.11} />
            <Conductor x1={640} y1={908} x2={1090} y2={914} sag={0.11} />
            {/* GRACKLES ON THE WIRE. The doctrine calls the great-tailed grackle our
                raven and the ambient bird of any built frame, and a transmission span
                is the most built thing in this shot. They sit where the conductor
                actually sags, not on the straight line between the towers. */}
            {[300, 352, 404, 470, 512].map((gx, i) => (
              <Grackle key={gx} frame={f} x={gx} y={946 + Math.abs(i - 2) * -3}
                scale={0.34} seed={60 + i} facing={i % 3 === 0 ? -1 : 1}
                female={i === 1 || i === 4} calling={i === 2} />
            ))}
            {/* A MOCKINGBIRD ON THE HIGHEST POINT AVAILABLE, which is what the state
                bird does and why a tower carries one so well. */}
            <Mockingbird frame={f} x={648} y={848} scale={0.34} seed={70} singing />
          </svg>
        </Plane>

        {/* the slab */}
        <Plane z={300}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920">
            <DataCentre x={-40} y={1180} scale={0.0418} seed={5} wear={0.25} />
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
            {/* At the SAME scale as the people, which is the whole point of fauna.tsx
                being built on true size: a jackrabbit next to a person is knee-high
                because the arithmetic says so, not because it was eyeballed. */}
            <Jackrabbit frame={f} x={866} y={1432} scale={0.8} seed={71} facing={-1} />
            <Roadrunner frame={f} x={196} y={1444} scale={0.8} seed={72} running />
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
            <Mesquite x={-90} y={2080} scale={0.2408} seed={9} />
            <Mesquite x={1180} y={2130} scale={0.2051} seed={14} />
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
