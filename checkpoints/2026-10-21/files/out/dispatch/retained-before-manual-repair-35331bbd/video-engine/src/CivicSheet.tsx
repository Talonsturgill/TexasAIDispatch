import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Capitol, Courthouse, HearingDais, WitnessTable, Podium, GreatWalk} from './lib/civics';
import {Character, castProps} from './lib/Character';
import {RegionLight, GradeLayer, INK} from './lib/lighting';
import {FONT} from './lib/type';

// The civic sheet. The rooms and buildings where the decisions on this beat are
// actually taken, which the engine could not draw at all until now.
//
// The dais and the table are staged WITH CAST, because both are furniture a person
// has to fit: a bench top has to land at a seated member's chest and a witness
// table at a seated witness's forearm, and true scale is the only thing that makes
// that work without hand-nudging every scene.
//
// staging-check: exempt — a reference sheet, not a scene. Buildings carry no
// habitat, but the file passes through the same check, so it declares the exemption
// rather than relying on being overlooked.

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

export const CivicSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2100} viewBox="0 0 1080 2100" style={{background: '#efe7da'}}>
      <RegionLight region="blackland">
        <text x={40} y={58} fontSize={42} fontWeight={700} fill={INK}
          fontFamily={FONT.display}>Where it is decided</text>
        <text x={40} y={88} fontSize={17} fill="#5a5a5a" fontFamily={FONT.body}>
          The Capitol, a courthouse square, and the two sides of a hearing room.
        </text>

        <Row ground={560} title={148} head="The Capitol, and the pink dome"
          note="Sunset-red granite. Drawing it white is the single most common Texas mistake in national media, and a Texan sees it instantly.">
          <Capitol x={330} y={560} frame={f} scale={0.0068} seed={1} />
          <Capitol x={800} y={560} frame={f} scale={0.0068} seed={2} lit />
          <GreatWalk x={330} y={578} w={300} rows={5} />
          <Cap x={330} y={560}>day</Cap>
          <Cap x={800} y={560}>lit, and the Great Walk below</Cap>
        </Row>

        <Row ground={1000} title={640} head="County courthouse on a square"
          note="The most Texas civic image there is: 254 of them. Tower CENTRED, square ASYMMETRIC. The contested monument is deliberately not drawn.">
          <Courthouse x={420} y={1000} frame={f} scale={0.022} seed={3} />
          <Character {...castProps('rancher')} frame={f} x={730} y={1000} scale={0.34}
            pose="stand" emotion="neutral" />
          <Character {...castProps('resident')} frame={f} x={790} y={1000} scale={0.34}
            pose="point" emotion="worried" facing={-1} />
          <Cap x={420} y={1000}>tower centred, live oaks scattered</Cap>
          <Cap x={760} y={1000}>at true scale beside it</Cap>
        </Row>

        <Row ground={1440} title={1060} head="The dais, and who is behind it"
          note="A three-commissioner bench and a fifteen-member committee are the same furniture at different widths. Drawing three when it was fifteen is a claim about the room.">
          <HearingDais x={280} y={1440} frame={f} scale={0.62} seed={4} seats={3} width={280} />
          {[-88, 0, 88].map((dx, i) => (
            <Character key={dx} {...castProps(['executive', 'engineer', 'owner'][i])}
              frame={f} x={280 + dx * 0.62} y={1452} scale={0.36}
              pose="stand" emotion={['neutral', 'wry', 'smug'][i] as 'neutral'} />
          ))}
          <HearingDais x={790} y={1440} frame={f} scale={0.44} seed={5} seats={9} width={560} />
          <Cap x={280} y={1440}>three commissioners</Cap>
          <Cap x={790} y={1440}>a committee of nine</Cap>
        </Row>

        <Row ground={1800} title={1500} head="The witness table, and the stack"
          note="The height of that stack is the whole visual argument in a story about a comment period, so `pages` is a real parameter and not a decoration.">
          <WitnessTable x={230} y={1800} frame={f} scale={0.5} seed={6} pages={3} />
          <WitnessTable x={560} y={1800} frame={f} scale={0.5} seed={7} pages={120} />
          <WitnessTable x={890} y={1800} frame={f} scale={0.5} seed={8} pages={900} />
          <Character {...castProps('resident')} frame={f} x={890} y={1812} scale={0.34}
            pose="stand" emotion="worried" />
          <Cap x={230} y={1800}>three pages</Cap>
          <Cap x={560} y={1800}>a hundred and twenty</Cap>
          <Cap x={890} y={1800}>nine hundred</Cap>
        </Row>

        <Row ground={2050} title={1870} head="The podium"
          note="A press conference, an announcement, a signing. One lone star on the seal panel, because the six-flags composite is retired.">
          <Podium x={280} y={2050} frame={f} scale={0.42} seed={9} mics={3} />
          <Podium x={620} y={2050} frame={f} scale={0.42} seed={10} mics={5}
            sealColor="#8a1f22" />
          <Character {...castProps('executive')} frame={f} x={880} y={2050} scale={0.34}
            pose="point" emotion="smug" />
          <Podium x={880} y={2050} frame={f} scale={0.42} seed={11} mics={4} />
          <Cap x={280} y={2050}>state blue</Cap>
          <Cap x={620} y={2050}>five mics, which is a bigger day</Cap>
          <Cap x={880} y={2050}>with somebody behind it</Cap>
        </Row>

        <GradeLayer f={f} vignette={0.06} grain={0.03} bloom={0.05} />
      </RegionLight>
    </svg>
  );
};
