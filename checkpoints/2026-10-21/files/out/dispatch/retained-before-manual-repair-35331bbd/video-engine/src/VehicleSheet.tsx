import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Pickup, StockTrailer, TransformerHaul, Tanker, Slab, BucketTruck,
  TRUCK_PAINT} from './lib/vehicles';
import {Character, castProps} from './lib/Character';
import {RegionLight, GradeLayer, INK} from './lib/lighting';
import {FONT} from './lib/type';

// The vehicle sheet. Same job as the bestiary: a typecheck cannot tell you whether
// a pickup reads as a full-size American pickup rather than as a car with a bed.
//
// TWO SCALE ROWS, NOT ONE, and the reason is a finding rather than a layout
// preference. At true size these vehicles span 1.45 m to 4.6 m, so one row at one
// scale puts the transformer haul across the whole sheet and the slab at eighty
// pixels. The first version tried it and every row overlapped the next. THE PICKUP
// APPEARS IN BOTH ROWS as the yardstick, which is how the comparison stays honest
// across the break.
//
// staging-check: exempt — a reference sheet, not a scene. Vehicles carry no habitat
// so the placement rule cannot apply to them, but the file passes through the same
// check, so it declares the exemption rather than relying on being overlooked.

const Row: React.FC<{
  ground: number; title: number; head: string; note: string; children: React.ReactNode;
}> = ({ground, title, head, note, children}) => (
  <g>
    <text x={40} y={title} fontSize={21} fontWeight={700} fill={INK}
      fontFamily={FONT.display}>{head}</text>
    <text x={40} y={title + 21} fontSize={13} fill="#6a6a6a" fontFamily={FONT.body}>{note}</text>
    <line x1={40} y1={ground} x2={1040} y2={ground} stroke="#cdbfa8" strokeWidth={2} />
    {children}
  </g>
);

const Cap: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y + 21} fontSize={12.5} fill="#7a7266" textAnchor="middle"
    fontFamily={FONT.body}>{children}</text>
);

export const VehicleSheet: React.FC = () => {
  const f = useCurrentFrame();
  const SMALL = 0.155;      // person, slab, pickup: one scale across the three
  const BIG = 0.082;        // pickup, tanker, transformer haul: one scale across the three
  return (
    <svg width={1080} height={2560} viewBox="0 0 1080 2560" style={{background: '#efe7da'}}>
      <RegionLight region="rolling_plains">
        <text x={40} y={58} fontSize={42} fontWeight={700} fill={INK}
          fontFamily={FONT.display}>The fleet</text>
        <text x={40} y={88} fontSize={17} fill="#5a5a5a" fontFamily={FONT.body}>
          Six vehicles at true size, maintained but worn, with the marks that say whose they are.
        </text>

        <Row ground={320} title={148} head="True scale: a person, a slab, a pickup"
          note="One scale value across all three. A person's head comes up to the mirror on a three-quarter ton because the arithmetic says so, not because it was arranged.">
          <Character {...castProps('rancher')} frame={f} x={70} y={320} scale={SMALL}
            pose="stand" emotion="neutral" />
          <Character {...castProps('engineer')} frame={f} x={106} y={320} scale={SMALL}
            pose="stand" emotion="neutral" facing={-1} />
          <Slab x={330} y={320} frame={f} scale={SMALL} seed={71} trunkOpen={false} />
          <Pickup x={760} y={320} frame={f} scale={SMALL} seed={11} paint={TRUCK_PAINT[0]}
            headache />
          <Cap x={88} y={320}>1.70 m</Cap>
          <Cap x={330} y={320}>slab, 1.45 m</Cap>
          <Cap x={760} y={320}>pickup, 2.0 m</Cap>
        </Row>

        <Row ground={560} title={392} head="And the same pickup against the heavy fleet"
          note="A second scale, because the range runs to 4.6 m and one scale cannot show both ends. The pickup is in both rows as the yardstick.">
          <Pickup x={150} y={560} frame={f} scale={BIG} seed={11} paint={TRUCK_PAINT[0]}
            headache />
          <Tanker x={450} y={560} frame={f} scale={BIG} seed={12} />
          <TransformerHaul x={830} y={560} frame={f} scale={BIG} seed={13} />
          <Cap x={150} y={560}>2.0 m</Cap>
          <Cap x={450} y={560}>tanker, 3.9 m</Cap>
          <Cap x={830} y={560}>transformer haul, 4.6 m</Cap>
        </Row>

        <Row ground={860} title={640} head="The pickup, and whose it is"
          note="Clean above the door handles and caked below them. That one tonal split is the difference between a truck that has been somewhere and a brochure.">
          <Pickup x={260} y={860} frame={f} scale={0.19} seed={21} paint={TRUCK_PAINT[1]}
            dirt={0.85} headache dog decal="RANCH" />
          <Pickup x={790} y={860} frame={f} scale={0.19} seed={22} paint={TRUCK_PAINT[2]}
            dirt={0.9} flagWhip decal="PUMPING" />
          <Cap x={260} y={860}>ranch: headache rack, a dog, caked</Cap>
          <Cap x={790} y={860}>oilfield: the flag whip says lease road</Cap>
        </Row>

        <Row ground={1120} title={930} head="Clean against worked, the same truck"
          note="The only difference between these two is the dirt value. Nothing else about the drawing changes at all.">
          <Pickup x={260} y={1120} frame={f} scale={0.19} seed={31} paint={TRUCK_PAINT[4]}
            dirt={0} toolbox={false} />
          <Pickup x={790} y={1120} frame={f} scale={0.19} seed={31} paint={TRUCK_PAINT[4]}
            dirt={1} toolbox={false} />
          <Cap x={260} y={1120}>off the lot</Cap>
          <Cap x={790} y={1120}>worked</Cap>
        </Row>

        <Row ground={1400} title={1190} head="Stock trailer, gooseneck"
          note="Slatted aluminium, and you can see through the slats. Dropped on its jack with nothing pulling it is what they mostly are.">
          <StockTrailer x={270} y={1400} frame={f} scale={0.155} seed={41} />
          <StockTrailer x={790} y={1400} frame={f} scale={0.155} seed={42} loaded />
          <Cap x={270} y={1400}>empty, on the jack</Cap>
          <Cap x={790} y={1400}>loaded</Cap>
        </Row>

        <Row ground={1710} title={1470} head="The transformer haul"
          note="The best picture this show has of its own subject. Every story here ends at a connection, and a connection is this, on a lowboy, doing forty on a farm-to-market road.">
          <TransformerHaul x={520} y={1710} frame={f} scale={0.14} seed={51} />
          <Cap x={520} y={1710}>oversize load, pilot car out of frame</Cap>
        </Row>

        <Row ground={2080} title={1790} head="Water tanker, and the line truck"
          note="The same barrel that hauled frac water now hauls it for cooling. The bucket truck is the only vehicle that puts a person at the height of the problem.">
          <Tanker x={280} y={2080} frame={f} scale={0.12} seed={61} water />
          <BucketTruck x={790} y={2080} frame={f} scale={0.125} seed={62} boom={0.85} />
          <Cap x={280} y={2080}>non-potable</Cap>
          <Cap x={790} y={2080}>boom up, outriggers down</Cap>
        </Row>

        <Row ground={2380} title={2170} head="Slab, Houston"
          note="The swangas ARE the car. Chrome elbow wheels standing a foot proud of the body, candy paint, trunk open on the drive.">
          <Slab x={280} y={2380} frame={f} scale={0.21} seed={71} />
          <Slab x={790} y={2380} frame={f} scale={0.21} seed={72} candy="#1d6a4f"
            trunkOpen={false} />
          <Cap x={280} y={2380}>trunk open</Cap>
          <Cap x={790} y={2380}>closed, and still unmistakable</Cap>
        </Row>

        <GradeLayer f={f} vignette={0.06} grain={0.03} bloom={0.05} />
      </RegionLight>
    </svg>
  );
};
