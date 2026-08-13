import React from 'react';
import {useCurrentFrame} from 'remotion';
import * as Ag from './lib/agriculture';
import * as Freight from './lib/freight';
import * as Compute from './lib/compute';
import * as Clinic from './lib/clinic';
import * as Water from './lib/water';
import * as Plant from './lib/plantfloor';
import {Character, castProps} from './lib/Character';
import {RegionLight, INK} from './lib/lighting';

// =============================================================================
// THE APPLICATION SHEETS — a review surface for the six beats the engine could
// not draw, and it exists because the library had none.
//
// WHY A SHEET IS NOT OPTIONAL. `knowledge/craft/GATE_LESSONS.md` #20 is about a
// defect that survived because the one review surface built to show a herd passed
// explicit seeds and so was structurally incapable of reproducing it. The lesson
// people take from that is "review surfaces can lie". The lesson that matters more
// is the other half: WITHOUT ONE, NOBODY LOOKS AT ALL. Six modules shipped with
// nothing that renders them, and the only way to see a drawing was to write a
// board and render a film.
//
// EVERY ROW CARRIES A PERSON, and that is the point of the sheet as much as the
// drawings are. These are all true-scale now, so the human figure is the assertion:
// if a cabinet is not chest-high on a person and a cooling tower is not five of
// them, the size table is wrong and this is where it shows.
//
// The scales below are SOLVED, not chosen: on-sheet height is metres x 358.8 x
// scale, with no perspective because a sheet is flat. They are in the source next
// to the drawing so a reviewer can check the arithmetic against the picture.
//
// staging-check: exempt — a reference sheet, not a scene.
// =============================================================================

const BG = '#efe7da';

/**
 * The craft note, WRAPPED.
 *
 * SVG text does not wrap, so the first version of this sheet ran every note off the
 * right edge mid-sentence. It reads as a styling slip and it is not: these notes are
 * where the reason for each drawing lives, and half a sentence is the half nobody
 * acts on. Shortening them to fit would have deleted the content to preserve the
 * layout, which is the wrong way round.
 */
const Note: React.FC<{x: number; y: number; text: string; cols?: number}> = ({
  x, y, text, cols = 118,
}) => {
  const lines: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    if ((line + ' ' + w).trim().length > cols) {
      lines.push(line.trim());
      line = w;
    } else {
      line = `${line} ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return (
    <g>
      {lines.map((l, i) => (
        <text key={i} x={x} y={y + i * 17} fontSize={13} fill="#6a6a6a"
          fontFamily="Georgia, serif">{l}</text>
      ))}
    </g>
  );
};

const Row: React.FC<{
  ground: number; title: number; head: string; note: string; children: React.ReactNode;
}> = ({ground, title, head, note, children}) => (
  <g>
    <text x={40} y={title} fontSize={21} fontWeight={700} fill={INK}
      fontFamily="Georgia, serif">{head}</text>
    <Note x={40} y={title + 21} text={note} />
    <line x1={40} y1={ground} x2={1040} y2={ground} stroke="#cdbfa8" strokeWidth={2} />
    {children}
  </g>
);

const Cap: React.FC<{x: number; y: number; children: string}> = ({x, y, children}) => (
  <text x={x} y={y + 21} fontSize={12.5} fill="#7a7266" textAnchor="middle"
    fontFamily="Georgia, serif">{children}</text>
);

/** The scale reference. 1.70 m, 610 draw units, in every row. */
const Ref: React.FC<{x: number; y: number; f: number; cast?: string; scale?: number}> = ({
  x, y, f, cast = 'farmer', scale = 0.32,
}) => (
  <g opacity={0.85}>
    <Character {...castProps(cast)} frame={f} x={x} y={y} scale={scale} />
  </g>
);

const Head: React.FC<{title: string; sub: string}> = ({title, sub}) => (
  <g>
    <text x={40} y={58} fontSize={42} fontWeight={700} fill={INK}
      fontFamily="Georgia, serif">{title}</text>
    <text x={40} y={88} fontSize={17} fill="#5a5a5a" fontFamily="Georgia, serif">{sub}</text>
  </g>
);

// ---------------------------------------------------------------- agriculture
export const FarmSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2400} viewBox="0 0 1080 2400" style={{background: BG}}>
      <RegionLight region="high_plains">
        <Head title="Farm and ranch, over a shrinking aquifer"
          sub="The second beat by how Texas it is, and the one the engine could not draw." />

        <Row ground={560} title={148} head="The centre pivot, and its prescription"
          note="Drop hoses hanging to just above the crop, never an arc off the top. Over the Ogallala the arc evaporates before it lands, and drawing one says the opposite of what the beat is about. Spray density IS the per-span rate.">
          <Ag.CentrePivot x={70} y={560} frame={f} scale={0.1} seed={3}
            prescription={[0.95, 0.2, 0.8, 0.35, 0.9]} spans={5} />
          <Ref x={980} y={560} f={f} />
          <Cap x={520} y={566}>five spans, five rates, one pass</Cap>
        </Row>

        <Row ground={1000} title={640} head="The field it stands in"
          note="Rows converging, with bare soil showing between them until the canopy closes. That gap is most of what makes the colour read as agriculture rather than as grass.">
          <Ag.CropRows x={40} y={700} w={1000} h={300} frame={f} crop="cotton" growth={0.8} />
        </Row>

        <Row ground={1480} title={1060} head="The town, the yard and the sensor"
          note="A grain elevator is visible twenty miles before the town is. A feedyard is a rank of pens, not a corral. A soil probe is deliberately small: it is the thing a viewer should have to notice.">
          <Ag.GrainElevator x={70} y={1480} scale={0.025} seed={5} label="CO-OP" />
          <Ag.FeedlotPen x={330} y={1480} frame={f} scale={0.3} seed={6} pens={3} head={6} />
          <Ag.SoilProbe x={880} y={1480} frame={f} scale={0.36} seed={7} />
          <Ref x={980} y={1480} f={f} />
          <Cap x={150} y={1486}>grain elevator</Cap>
          <Cap x={520} y={1486}>feedyard pens</Cap>
          <Cap x={880} y={1486}>soil probe</Cap>
        </Row>

        <Row ground={1700} title={1540} head="The tag, at true scale"
          note="75 mm across. At scale 1 beside an animal it is correctly almost too small to see, which is the honest picture: the intervention is invisible and the model does the work. Shown here enlarged.">
          <Ag.HerdSensor x={200} y={1640} frame={f} scale={3.3} />
          <Ag.HerdSensor x={420} y={1640} frame={f} scale={3.3} alert tint="#c8703a" />
          <Cap x={200} y={1660}>reporting</Cap>
          <Cap x={420} y={1660}>flagged</Cap>
        </Row>

        <Row ground={2340} title={1760} head="The ground, in section"
          note="The Ogallala is invisible and the beat is about it. Visibly a diagram rather than a photograph, because it is a model of the ground and not a picture of one. Every label comes from the caller."
        >
          <Ag.GroundSection x={70} y={1820} w={940} h={480} frame={f} seed={9}
            waterTable={0.44} historicTable={0.18}
            labels={{top: 'sand and caliche', table: 'water now',
                     historic: 'water then', base: 'bedrock'}} />
        </Row>
      </RegionLight>
    </svg>
  );
};

// ---------------------------------------------------------------- freight
export const RoadSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2200} viewBox="0 0 1080 2200" style={{background: BG}}>
      <RegionLight region="blackland">
        <Head title="The road that already has no driver on it"
          sub="Dallas to Houston, then Fort Worth to El Paso. The engine could draw a pickup." />

        <Row ground={600} title={148} head="The rig, and the silhouette that changed"
          note="A day cab, because that is what a lane-haul autonomous truck runs and the shorter shape is a real tell. The roof pod is what a viewer reads at highway distance: the empty seat is invisible at this size, which is the whole composition problem this beat has.">
          <Freight.Lane x={-40} y={438} w={1160} h={165} frame={f} speed={1} divided={false} />
          <Freight.AutonomousRig x={760} y={560} frame={f} scale={0.16} seed={2} speed={1} />
          <Ref x={1010} y={560} f={f} cast="engineer" scale={0.28} />
          <Cap x={560} y={566}>tractor, van trailer, mast</Cap>
        </Row>

        <Row ground={860} title={660} head="The pod, close"
          note="A lidar drum that sweeps SLOWLY. One that spins fast enough to see at 30fps is a lighthouse, and a lighthouse is a different machine. The return is one soft wedge, not a fan of beams.">
          <Freight.SensorMast x={300} y={840} frame={f} scale={0.9} seed={1} />
          <Freight.SensorMast x={700} y={840} frame={f} scale={0.9} seed={4} sweeping={false} />
          <Cap x={300} y={846}>running</Cap>
          <Cap x={700} y={846}>parked</Cap>
        </Row>

        <Row ground={1560} title={920} head="The seat, at a size where empty is legible"
          note="The shot the wide cannot give. Empty is read from the BELT HANGING SLACK against the pillar before it is read from the cushion. The occupied case is a different fact, not a different drawing.">
          <Freight.CabView x={40} y={960} w={480} h={560} frame={f} seed={3} />
          <Freight.CabView x={560} y={960} w={480} h={560} frame={f} seed={8} occupied />
          <Cap x={280} y={1530}>driverless</Cap>
          <Cap x={800} y={1530}>with a safety driver</Cap>
        </Row>

        <Row ground={2100} title={1640} head="Both ends of the lane"
          note="A driverless lane still ends at a dock, and the dock is where the people are. The weigh station is where the regulatory half of this beat is physically located.">
          <Freight.WeighStation x={100} y={2100} scale={0.11} seed={5} />
          <Freight.DockDoors x={520} y={2100} scale={0.11} seed={6} doors={5} occupied={[1, 3]} />
          <Ref x={1020} y={2100} f={f} cast="engineer" scale={0.3} />
          <Cap x={190} y={2106}>weigh station</Cap>
          <Cap x={700} y={2106}>terminal dock</Cap>
        </Row>
      </RegionLight>
    </svg>
  );
};

// ---------------------------------------------------------------- compute
export const MachineRoomSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2200} viewBox="0 0 1080 2200" style={{background: BG}}>
      <RegionLight region="rolling_plains">
        <Head title="Inside the building the docket is about"
          sub="The outside is a shed. Every story on this beat happens in here." />

        <Row ground={760} title={148} head="The aisle"
          note="Two ranks facing each other down a corridor, the containment roof over the top and the cable tray above that. A flat wall of cabinets is a server rack in a cupboard, and a room without cable is a diagram of a room.">
          <Compute.RackRow x={520} y={720} frame={f} scale={0.17} seed={2} depth={7}
            load={0.74} unknown={[2]} openDoor={4} />
          <Ref x={1000} y={760} f={f} cast="engineer" scale={0.3} />
          <Cap x={540} y={706}>one rack drawn as an outline: the size of what is not public</Cap>
        </Row>

        <Row ground={1120} title={760} head="One cabinet"
          note="A modern accelerator rack at load is mostly STEADY. A wall of randomly blinking lights is a 1960s computer. There is always one amber somewhere and it is placed, never random.">
          <Compute.Cabinet x={220} y={1120} frame={f} scale={0.34} seed={1} load={0.8} />
          <Compute.Cabinet x={380} y={1120} frame={f} scale={0.34} seed={4} load={0.8} open />
          <Compute.Cabinet x={560} y={1120} frame={f} scale={0.34} seed={9} load={0.2} fault={9} />
          <Compute.Cabinet x={740} y={1120} frame={f} scale={0.34} unknown />
          <Ref x={950} y={1120} f={f} cast="engineer" scale={0.3} />
          <Cap x={200} y={1126}>door shut</Cap>
          <Cap x={380} y={1126}>door open</Cap>
          <Cap x={560} y={1126}>a fault</Cap>
          <Cap x={740} y={1126}>unmetered</Cap>
        </Row>

        <Row ground={1660} title={1200} head="The water and the fuel, outdoors"
          note="What leaves a cooling tower is water vapour. Drawing a dark plume over one would be a straight lie about what the building emits, so the drift is white, thin and short, and humidity is what makes it visible at all. The gensets are OFF by default.">
          <Compute.CoolingTower x={70} y={1660} frame={f} scale={0.07} seed={3}
            cells={3} humidity={0.4} />
          <Compute.GeneratorBank x={520} y={1660} frame={f} scale={0.07} seed={4} units={3} />
          <Ref x={1000} y={1660} f={f} cast="engineer" scale={0.3} />
          <Cap x={200} y={1666}>cooling cells</Cap>
          <Cap x={680} y={1666}>standby generation</Cap>
        </Row>

        <Row ground={2080} title={1690} head="Where the power lands, and where the heat leaves"
          note="A switchgear line-up is cubicle after cubicle of the same door, which is what it looks like and why it reads as infrastructure. Direct-to-chip liquid is the current story and the reason these rooms changed shape.">
          <Compute.Switchgear x={90} y={2080} frame={f} scale={0.22} seed={5} bays={6} />
          <Compute.CoolingDistributionUnit x={800} y={2080} frame={f} scale={0.28} seed={6} />
          <Ref x={1010} y={2080} f={f} cast="engineer" scale={0.3} />
          <Cap x={430} y={2086}>medium-voltage line-up</Cap>
          <Cap x={800} y={2086}>CDU</Cap>
        </Row>
      </RegionLight>
    </svg>
  );
};

// ---------------------------------------------------------------- clinic
export const ClinicSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2000} viewBox="0 0 1080 2000" style={{background: BG}}>
      <RegionLight region="gulf">
        <Head title="The largest medical centre in the world"
          sub="No patient is ever identifiable here, and no scan on any screen is a real anatomy." />

        <Row ground={640} title={148} head="The machine a person goes inside"
          note="Get the bore wrong against the couch and it stops reading as something a body fits in. The ring housing is a rounded box in elevation and only the bore is round, which is what stops it looking like a washing machine.">
          <Clinic.Gantry x={280} y={640} frame={f} scale={0.3} seed={1} kind="ct" scanning={0.8} />
          <Clinic.Gantry x={700} y={640} frame={f} scale={0.3} seed={2} kind="linac" scanning={0} />
          <Ref x={980} y={640} f={f} cast="clinician" scale={0.3} />
          <Cap x={280} y={646}>CT, mid-acquisition</Cap>
          <Cap x={700} y={646}>linac, parked</Cap>
        </Row>

        <Row ground={1200} title={700} head="The AI, drawn without a patient in it"
          note="A plan is a set of outlines: the target, and what the beam must not cook. Drawing them over an abstract field says exactly what the work is and says nothing about anyone's anatomy. Where the two outlines DISAGREE is the interesting part, so it is drawn rather than smoothed away.">
          <Clinic.ContourPlan x={80} y={760} w={420} h={420} frame={f} seed={2}
            progress={0.62} manual />
          <Clinic.ContourPlan x={580} y={760} w={420} h={420} frame={f} seed={5}
            progress={1} manual />
          <Cap x={290} y={1190}>being laid down</Cap>
          <Cap x={790} y={1190}>complete, and not identical to the hand outline</Cap>
        </Row>

        <Row ground={1520} title={1260} head="Where the decision is actually made"
          note="Two displays angled toward one seat, because a reading room is set up for one person and it shows. The queue badge is a number the caller supplies and never one invented here.">
          <Clinic.ReadingStation x={330} y={1520} frame={f} scale={0.36} seed={3} lit alerts={7} />
          <Ref x={800} y={1520} f={f} cast="clinician" scale={0.3} />
        </Row>

        <Row ground={1940} title={1580} head="From outside, it is a skyline"
          note="Deep floor plates, small windows, and the mechanical floor a third of the way up that no office tower has. That band is what says HOSPITAL rather than OFFICE.">
          <Clinic.TowerBlock x={110} y={1940} frame={f} scale={0.022} seed={4} towers={3} />
          <Clinic.TowerBlock x={660} y={1940} frame={f} scale={0.022} seed={7} towers={2} night />
          <Cap x={300} y={1946}>day</Cap>
          <Cap x={790} y={1946}>night</Cap>
        </Row>
      </RegionLight>
    </svg>
  );
};

// ---------------------------------------------------------------- water
export const WaterSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={2100} viewBox="0 0 1080 2100" style={{background: BG}}>
      <RegionLight region="hill_country">
        <Head title="Measurement and warning"
          sub="Nothing here draws a person in water. The gauge is the subject and there is no all-clear." />

        <Row ground={700} title={148} head="The instrument the whole system rests on"
          note="A staff plate on a pile, the shelter above it, and the antenna that gets the reading out. The stage and its label are the CALLER'S measurement: passing neither draws a real gauge reading nothing, which is what a gauge that stopped reporting looks like.">
          <Water.StreamGauge x={220} y={700} frame={f} scale={0.22} seed={1}
            stage={0.42} threshold={0.72} />
          <Water.StreamGauge x={560} y={700} frame={f} scale={0.22} seed={4} reporting={false} />
          <Ref x={900} y={700} f={f} cast="hydrologist" scale={0.3} />
          <Cap x={220} y={706}>a stage, and the flood line above it</Cap>
          <Cap x={560} y={706}>not reporting</Cap>
        </Row>

        <Row ground={1060} title={760} head="The most Texas piece of hydrology there is"
          note="Drawn DRY, with the gate closed. A dry crossing behind a closed gate is the story of a warning that worked, told without asking anyone to picture themselves in the water. The depth marker carries ticks and no digits.">
          <Water.LowWaterCrossing x={520} y={980} frame={f} scale={0.24} seed={2} closed />
        </Row>

        <Row ground={1520} title={1120} head="The siren, and the phone"
          note="Sound is two thin arcs that fade. A cartoon blast of concentric rings turns an emergency into a graphic, and this is the one beat where that would be unforgivable. The banner text comes from the caller and nothing else does.">
          <Water.SirenMast x={220} y={1520} frame={f} scale={0.1} seed={3} sounding />
          <Water.HandsetAlert x={620} y={1380} frame={f} scale={3.4} seed={5}
            headline="FLASH FLOOD WARNING" body="Move to higher ground now." />
          <Ref x={900} y={1520} f={f} cast="hydrologist" scale={0.3} />
          <Cap x={220} y={1526}>outdoor warning siren</Cap>
          <Cap x={620} y={1526}>the last hundred milliseconds</Cap>
        </Row>

        <Row ground={2060} title={1580} head="The weather itself, from a long way off"
          note="The one honest picture of a flash flood that harms nobody to look at. The shaft under the base is the image, and the anvil sheared downwind is what makes it a real cell rather than a cloud.">
          <Water.RainCell x={300} y={1600} w={480} h={460} frame={f} seed={6}
            intensity={0.85} shear={1} lightning />
        </Row>
      </RegionLight>
    </svg>
  );
};

// ---------------------------------------------------------------- plant floor
export const PlantSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1700} viewBox="0 0 1080 1700" style={{background: BG}}>
      <RegionLight region="blackland">
        <Head title="What Texas now makes"
          sub="The application is inspection, and the interesting frame is the one that says FAIL." />

        <Row ground={640} title={148} head="The arm, and why it is not friendly"
          note="A real arm moves in FAST STRAIGHT SEGMENTS with hard stops between them, it is fenced, and there is a light curtain across the opening. An arm that waves in a smooth arc is a stock illustration and anyone who works in one of these buildings reads it as one instantly.">
          <RobotPair f={f} />
          <Ref x={980} y={640} f={f} cast="technician" scale={0.3} />
          <Cap x={280} y={646}>cycling</Cap>
          <Cap x={640} y={646}>halted</Cap>
        </Row>

        <Row ground={1000} title={700} head="The line, and the eye over it"
          note="The belt texture MOVES with the parts. A static texture under sliding parts reads as parts skidding. The ring light is what says machine vision rather than security camera: a bright even annulus so the part has no shadows in it.">
          <Plant.Conveyor x={60} y={1000} frame={f} scale={0.34} seed={2} w={420}
            parts={6} flagged={[2]} />
          <Plant.InspectionHead x={780} y={940} frame={f} scale={0.7} seed={3} verdict="fail" />
          <Cap x={340} y={1006}>one part flagged, still moving</Cap>
          <Cap x={780} y={1006}>the frame that matters</Cap>
        </Row>

        <Row ground={1620} title={1060} head="The aisle, from a person's height"
          note="A fab floor is a wall of enclosures. The stack light is the one part legible from across the room, so it is the part that carries the state, and the painted traffic lane is scuffed because it always is.">
          <Plant.ToolBay x={110} y={1620} frame={f} scale={0.19} seed={4} bays={4}
            state={['run', 'idle', 'down', 'run']} />
          <Ref x={960} y={1620} f={f} cast="technician" scale={0.3} />
          <Cap x={480} y={1626}>run, idle, down, run</Cap>
        </Row>
      </RegionLight>
    </svg>
  );
};

/** Two arms on the same cycle at different phases, which is the point of the row. */
const RobotPair: React.FC<{f: number}> = ({f}) => (
  <g>
    <Plant.RobotArm x={280} y={640} frame={f} scale={0.4} seed={1} cycle={74} />
    <Plant.RobotArm x={640} y={640} frame={f} scale={0.4} seed={5} halted />
  </g>
);
