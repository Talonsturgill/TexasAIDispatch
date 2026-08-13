import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Detections, Mask, Sweep, Plume, Readout, ConfidenceSpread} from './lib/sensing';
import {Longhorn, Grackle} from './lib/fauna';
import {Pumpjack, DataCentre} from './lib/kit';
import {Pickup} from './lib/vehicles';
import {RegionLight, GradeLayer, INK} from './lib/lighting';

// The sensing sheet. The overlays that make AI drawable at all, staged OVER real
// subjects from the rest of the library, because an overlay on an empty background
// proves nothing: the whole question is whether it reads as a machine looking at
// the world rather than as a graphic sitting on top of a picture.
//
// staging-check: exempt — a reference sheet, not a scene. It stages a longhorn and
// a grackle under one light purely as things for the overlay to look at.

const Row: React.FC<{
  ground: number; title: number; head: string; note: string; children: React.ReactNode;
}> = ({ground, title, head, note, children}) => (
  <g>
    <text x={40} y={title} fontSize={21} fontWeight={700} fill={INK}
      fontFamily="Georgia, serif">{head}</text>
    <text x={40} y={title + 21} fontSize={13} fill="#6a6a6a" fontFamily="Georgia, serif">{note}</text>
    <line x1={40} y1={ground} x2={1040} y2={ground} stroke="#cdbfa8" strokeWidth={2} />
    {children}
  </g>
);

export const SensingSheet: React.FC = () => {
  const f = useCurrentFrame();
  const settle = Math.min(1, (f % 90) / 45);
  return (
    <svg width={1080} height={1720} viewBox="0 0 1080 1720" style={{background: '#efe7da'}}>
      <RegionLight region="rolling_plains">
        <text x={40} y={58} fontSize={42} fontWeight={700} fill={INK}
          fontFamily="Georgia, serif">What the machine sees</text>
        <text x={40} y={88} fontSize={17} fill="#5a5a5a" fontFamily="Georgia, serif">
          AI is invisible. The overlay is the only part of it you can draw.
        </text>

        <Row ground={470} title={150} head="Detections, over something real"
          note="Corner ticks rather than a closed box. They jitter, because trackers jitter. And ONE OF THEM IS WRONG, drawn crossed, because a frame of perfect hits is a product demo.">
          <Longhorn x={230} y={470} frame={f} scale={0.26} seed={5} hide="#8a4a2c" horn={0.9} />
          <Longhorn x={470} y={470} frame={f} scale={0.24} seed={12} hide="#2b2724" horn={0.7} />
          <Grackle x={660} y={470} frame={f} scale={1.1} seed={3} />
          <Detections frame={f} seed={7} settle={settle}
            items={[
              {x: 120, y: 330, w: 210, h: 130, label: 'cow', conf: 0.94, track: 1},
              {x: 380, y: 352, w: 180, h: 112, label: 'cow', conf: 0.71, track: 2},
              {x: 628, y: 408, w: 66, h: 58, label: 'bird', conf: 0.83, track: 5},
              {x: 800, y: 392, w: 96, h: 74, label: 'cow', conf: 0.61, wrong: true, track: 9},
            ]} />
          <text x={848} y={352} fontSize={12.5} fill="#a24a26" textAnchor="middle"
            fontFamily="Georgia, serif">nothing is there</text>
          <ConfidenceSpread x={760} y={130} w={200} h={44} threshold={0.7}
            values={[0.94, 0.83, 0.71, 0.61, 0.55, 0.42, 0.38, 0.29, 0.22, 0.14]} />
          <text x={760} y={196} fontSize={12} fill="#6a6a6a" fontFamily="Georgia, serif">
            a real distribution has a tail
          </text>
        </Row>

        <Row ground={900} title={520} head="A mask, a sweep, and a readout"
          note="A mask's edge is RAGGED, because it follows a grid of predictions. A sweep classifies behind the line and not ahead of it, so the picture shows work happening.">
          <DataCentre x={90} y={880} scale={0.0117} seed={5} wear={0.3} />
          <Mask cx={218} cy={848} rx={128} ry={38} frame={f} seed={4} noise={0.3}
            label="thermal load 0.88" />
          <Sweep x={560} y={640} w={440} h={230} p={(f % 120) / 120} />
          <Readout x={572} y={654} w={210} frame={f} title="pass 3"
            rows={[['tiles', '1,024'], ['flagged', '17'], ['above thr', '9'], ['dwell', '2.4 s']]} />
        </Row>

        <Row ground={1380} title={950} head="The plume the eye cannot see"
          note="Methane is invisible, and that is the entire reason there is a computer-vision story in the Permian. The frame shows the world as a person sees it and as the sensor does.">
          <Pumpjack frame={f} x={230} y={1370} scale={0.05145} seed={4} rpm={8} wear={0.5} />
          <Pickup x={470} y={1372} frame={f} scale={0.16} seed={21} dirt={0.9} flagWhip />
          <Pumpjack frame={f} x={790} y={1370} scale={0.05145} seed={4} rpm={8} wear={0.5} />
          <Plume x={790} y={1300} frame={f} seed={6} strength={1} rate="4.1 kg/h" />
          <text x={230} y={1404} fontSize={12.5} fill="#7a7266" textAnchor="middle"
            fontFamily="Georgia, serif">what a person sees</text>
          <text x={790} y={1404} fontSize={12.5} fill="#7a7266" textAnchor="middle"
            fontFamily="Georgia, serif">the same wellhead, on the camera</text>
        </Row>

        <Row ground={1660} title={1440} head="The honest counter-image"
          note="APPLICATIONS.md requires one from every story. Here it is as a component: `wrong` marks a detection as a miss and it is DRAWN as a miss, so a scene cannot show one by accident and cannot hide one either.">
          <Detections frame={f} seed={11} settle={1} showConf
            items={[
              {x: 90, y: 1520, w: 150, h: 110, label: 'leak', conf: 0.91, track: 1},
              {x: 320, y: 1540, w: 130, h: 90, label: 'leak', conf: 0.66, wrong: true, track: 4},
              {x: 540, y: 1530, w: 140, h: 100, label: 'leak', conf: 0.58, wrong: true, track: 7},
              {x: 780, y: 1516, w: 160, h: 118, label: 'leak', conf: 0.88, track: 2},
            ]} />
          <text x={520} y={1672} fontSize={13} fill="#a24a26" textAnchor="middle"
            fontFamily="Georgia, serif">two of four are false. That is the story, not a caveat.</text>
        </Row>

        <GradeLayer f={f} vignette={0.06} grain={0.03} bloom={0.05} />
      </RegionLight>
    </svg>
  );
};
