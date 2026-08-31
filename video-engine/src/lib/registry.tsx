import React from 'react';
import * as Kit from './kit';
import * as Fauna from './fauna';
import * as Vehicles from './vehicles';
import * as Civics from './civics';
import * as Sensing from './sensing';
import * as Ag from './agriculture';
import * as Freight from './freight';
import * as Compute from './compute';
import * as Clinic from './clinic';
import * as Water from './water';
import * as Plant from './plantfloor';
import * as Drill from './drilling';
import * as Flora from './flora';
import * as Skies from './skies';
import * as Road from './roadside';
import * as Town from './hometown';
import * as Home from './homeplace';
import * as Tejano from './tejano';
import * as BlackTx from './blacktexas';
import * as Football from './football';
import * as Evidence from './evidence';
import {Character, castProps} from './Character';

// =============================================================================
// THE REGISTRY — the boundary where STORY DATA becomes A PICTURE.
//
// The routine's rule is "scenes are code, story is data", and per-run data
// arrives through `--props`. Something has to turn the string "pumpjack" in a
// storyboard into a component, and this is it.
//
// TWO PROPERTIES THIS FILE EXISTS TO GUARANTEE.
//
//   AN UNKNOWN NAME FAILS LOUD. `prompts/dispatch_routine.md` already warns that
//   "a scene that draws nothing renders without error", which is the single
//   nastiest failure available to a data-driven engine: the film completes, the
//   exit code is 0, and a plane is simply empty. So `resolve()` THROWS on a name
//   it does not have, and `ELEMENT_NAMES` is exported so `storyboard_check` can
//   refuse the board before a frame is rendered rather than after.
//
//   EVERY PLACEABLE THING IS REACHABLE FROM DATA. A component that exists in the
//   library and is not in this map cannot appear in a Dispatch at all, however
//   well it is drawn. `registry_check.py` walks the library and fails on any
//   export that is missing here, because a drawing nothing can stage is the same
//   dead weight as a script nothing invokes.
//
// The props are deliberately loose. A board is runtime JSON, so this boundary is
// dynamic by nature; the type system cannot police it and pretending otherwise
// with a giant union would only move the failure somewhere less obvious. The
// gates police it instead, which is the honest division of labour.
// =============================================================================

export interface Placed {
  /** Stable storyboard address used by visual-proof and event bindings. The renderer does not
   *  infer meaning from it; gates use it to prove a sentence points at this exact item. */
  id?: string;
  /** a key in ELEMENTS */
  kind: string;
  x?: number;
  y?: number;
  scale?: number;
  facing?: 1 | -1;
  seed?: number;
  /** anything else the specific component takes */
  props?: Record<string, unknown>;
}

// A cast member is placed by CAST ID rather than by component, because the rig
// carries the outfit, headgear and skin tone and a scene must not restate them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CastElement: React.FC<any> = (p) => {
  const id = String(p.cast ?? p.id ?? 'engineer');
  const rest = {...p};
  delete rest.cast;
  delete rest.id;
  return <Character {...castProps(id)} frame={p.frame ?? 0} {...rest} />;
};

/**
 * Everything a storyboard may place, by name.
 *
 * Keys are lowerCamel of the component so a board reads as prose. The value type
 * is intentionally permissive: see the note at the top of the file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ELEMENTS: Record<string, React.FC<any>> = {
  // people
  person: CastElement,

  // the industrial and rural kit
  pumpjack: Kit.Pumpjack,
  pumpjackField: Kit.PumpjackField,
  dataCentre: Kit.DataCentre,
  transformer: Kit.Transformer,
  latticeTower: Kit.LatticeTower,
  conductor: Kit.Conductor,
  windTurbine: Kit.WindTurbine,
  windmill: Kit.Windmill,
  stockTank: Kit.StockTank,
  cattleGuard: Kit.CattleGuard,
  waterTower: Kit.WaterTower,
  mesquite: Kit.Mesquite,
  pricklyPear: Kit.PricklyPear,

  // the bestiary
  grackle: Fauna.Grackle,
  mockingbird: Fauna.Mockingbird,
  armadillo: Fauna.Armadillo,
  pronghorn: Fauna.Pronghorn,
  turkeyVulture: Fauna.TurkeyVulture,
  longhorn: Fauna.Longhorn,
  whitetail: Fauna.Whitetail,
  jackrabbit: Fauna.Jackrabbit,
  roadrunner: Fauna.Roadrunner,
  cattleEgret: Fauna.CattleEgret,
  hornedLizard: Fauna.HornedLizard,
  feralHog: Fauna.FeralHog,
  javelina: Fauna.Javelina,
  coyote: Fauna.Coyote,
  batColumn: Fauna.BatColumn,

  // the fleet
  pickup: Vehicles.Pickup,
  stockTrailer: Vehicles.StockTrailer,
  transformerHaul: Vehicles.TransformerHaul,
  tanker: Vehicles.Tanker,
  slab: Vehicles.Slab,
  bucketTruck: Vehicles.BucketTruck,

  // where it is decided
  capitol: Civics.Capitol,
  greatWalk: Civics.GreatWalk,
  courthouse: Civics.Courthouse,
  hearingDais: Civics.HearingDais,
  witnessTable: Civics.WitnessTable,
  podium: Civics.Podium,

  // what the machine sees
  detections: Sensing.Detections,
  mask: Sensing.Mask,
  sweep: Sensing.Sweep,
  plume: Sensing.Plume,
  readout: Sensing.Readout,
  confidenceSpread: Sensing.ConfidenceSpread,

  // editorial evidence — source records, joins, limits and human handoffs
  documentStream: Evidence.DocumentStream,
  dataJoin: Evidence.DataJoin,
  associationDiagram: Evidence.AssociationDiagram,
  inspectionMap: Evidence.InspectionMap,

  // -------------------------------------------------------------------------
  // THE APPLICATION LAYER. Everything above this line draws the LAND and the
  // furniture on it, and for a while that was the whole engine, which made a show
  // about what AI is doing in Texas into a show about Texas with captions over it.
  // `knowledge/texas/APPLICATIONS.md` ranks eight beats by how Texas they are and
  // the engine could stage two of them. These are the other six.
  // -------------------------------------------------------------------------

  // the farm and the ranch, over a shrinking aquifer
  centrePivot: Ag.CentrePivot,
  cropRows: Ag.CropRows,
  grainElevator: Ag.GrainElevator,
  feedlotPen: Ag.FeedlotPen,
  soilProbe: Ag.SoilProbe,
  herdSensor: Ag.HerdSensor,
  groundSection: Ag.GroundSection,

  // the road that already has no driver on it
  autonomousRig: Freight.AutonomousRig,
  sensorMast: Freight.SensorMast,
  cabView: Freight.CabView,
  lane: Freight.Lane,
  weighStation: Freight.WeighStation,
  dockDoors: Freight.DockDoors,

  // inside the building the docket is about
  cabinet: Compute.Cabinet,
  rackRow: Compute.RackRow,
  coolingTower: Compute.CoolingTower,
  generatorBank: Compute.GeneratorBank,
  switchgear: Compute.Switchgear,
  coolingUnit: Compute.CoolingDistributionUnit,
  hallShell: Compute.HallShell,

  // the largest medical centre in the world
  gantry: Clinic.Gantry,
  contourPlan: Clinic.ContourPlan,
  readingStation: Clinic.ReadingStation,
  towerBlock: Clinic.TowerBlock,

  // measurement and warning, handled carefully
  streamGauge: Water.StreamGauge,
  lowWaterCrossing: Water.LowWaterCrossing,
  sirenMast: Water.SirenMast,
  rainCell: Water.RainCell,
  handsetAlert: Water.HandsetAlert,

  // what Texas now makes
  robotArm: Plant.RobotArm,
  conveyor: Plant.Conveyor,
  inspectionHead: Plant.InspectionHead,
  toolBay: Plant.ToolBay,

  // the rig floor. APPLICATIONS.md ranks the oilfield first of the eight beats and
  // the engine could draw a pumpjack, which is production, and nothing of drilling.
  derrick: Drill.Derrick,
  rigFloor: Drill.RigFloor,
  redZoneSign: Drill.RedZoneSign,
  ironRoughneck: Drill.IronRoughneck,
  doghouse: Drill.Doghouse,
  pipeRack: Drill.PipeRack,

  // -------------------------------------------------------------------------
  // THE NOSTALGIA LAYER. Everything above this line is a SUBJECT: a pumpjack
  // because the story is about oil, a data hall because the story is about
  // compute. Nostalgia is not a subject. It is what the story is set IN, at the
  // edge of frame, unremarked, and a viewer recognises it without being asked to.
  //
  // `knowledge/texas/NOSTALGIA.md` is the doctrine. The rule these modules run on
  // is RECOGNITION OVER DECORATION: an artifact earns its place by being
  // recognised, not by being pretty, so the right rusted gin sign badly drawn
  // lands and a beautiful generic barn does not.
  // -------------------------------------------------------------------------

  // the plants a Texan places a frame by, before reading a word
  liveOak: Flora.LiveOak,
  pecan: Flora.Pecan,
  loblolly: Flora.Loblolly,
  postOak: Flora.PostOak,
  boisDArc: Flora.BoisDArc,
  cottonwood: Flora.Cottonwood,
  baldCypress: Flora.BaldCypress,
  asheJuniper: Flora.AsheJuniper,
  crepeMyrtle: Flora.CrepeMyrtle,
  huisache: Flora.Huisache,
  sabalPalm: Flora.SabalPalm,
  ocotillo: Flora.Ocotillo,
  yucca: Flora.Yucca,
  sotol: Flora.Sotol,
  lechuguilla: Flora.Lechuguilla,
  wildflowerVerge: Flora.WildflowerVerge,
  bluebonnet: Flora.Bluebonnet,
  bluestem: Flora.Bluestem,
  cordgrass: Flora.Cordgrass,
  grassTuft: Flora.GrassTuft,
  sorghum: Flora.Sorghum,
  cottonField: Flora.CottonField,
  orchardRow: Flora.OrchardRow,
  sunflower: Flora.Sunflower,
  tumbleweed: Flora.Tumbleweed,

  // the sky states. In most of Texas the sky IS the landscape.
  thunderhead: Skies.Thunderhead,
  supercell: Skies.Supercell,
  shelfCloud: Skies.ShelfCloud,
  blueNorther: Skies.BlueNorther,
  sunsetBands: Skies.SunsetBands,
  dustHaze: Skies.DustHaze,
  gulfOvercast: Skies.GulfOvercast,
  seaFog: Skies.SeaFog,
  greenHailSky: Skies.GreenHailSky,
  smokeSky: Skies.SmokeSky,
  starfield: Skies.Starfield,
  monsoonCells: Skies.MonsoonCells,
  clearSky: Skies.ClearSky,
  sky: Skies.Sky,

  // the drive-by Texas, for the far and mid planes
  stripedAFrame: Road.StripedAFrame,
  mansardBox: Road.MansardBox,
  driveInStalls: Road.DriveInStalls,
  danceHall: Road.DanceHall,
  icehouse: Road.Icehouse,
  cottonGin: Road.CottonGin,
  moduleYard: Road.ModuleYard,
  feedStore: Road.FeedStore,
  historicalMarker: Road.HistoricalMarker,
  ranchGate: Road.RanchGate,
  bootFence: Road.BootFence,
  ghostSign: Road.GhostSign,
  roadsideMemorial: Road.RoadsideMemorial,
  motorCourt: Road.MotorCourt,
  poleSign: Road.PoleSign,
  billboard: Road.Billboard,
  storefrontBlock: Road.StorefrontBlock,
  deerBlind: Road.DeerBlind,
  twoLane: Road.TwoLane,
  cityLimitSign: Road.CityLimitSign,
  countryChurch: Road.CountryChurch,
  bandstand: Road.Bandstand,

  // school, Friday night, and the year's rituals
  lightMast: Town.LightMast,
  bleachers: Town.Bleachers,
  footballField: Town.Field,
  marchingBlock: Town.MarchingBlock,
  drumMajorStand: Town.DrumMajorStand,
  homecomingMum: Town.HomecomingMum,
  portableClassroom: Town.PortableClassroom,
  schoolMarquee: Town.SchoolMarquee,
  runThrough: Town.RunThrough,
  showBarn: Town.ShowBarn,
  showSteer: Town.ShowSteer,
  schoolBus: Town.SchoolBus,
  goalPost: Town.GoalPost,

  // the house, the yard, and what is kept in view of the street
  brickRanch: Home.BrickRanch,
  carport: Home.Carport,
  chestFreezer: Home.ChestFreezer,
  windowUnit: Home.WindowUnit,
  pierBeamHouse: Home.PierBeamHouse,
  trailerHouse: Home.TrailerHouse,
  homeYard: Home.Yard,
  propaneTank: Home.PropaneTank,
  clothesline: Home.Clothesline,
  aboveGroundPool: Home.AboveGroundPool,
  porchGlider: Home.PorchGlider,
  satelliteDish: Home.SatelliteDish,
  washateria: Home.Washateria,
  burnBarrel: Home.BurnBarrel,

  // Mexican-American and border Texas
  paleteroCart: Tejano.PaleteroCart,
  panaderiaRack: Tejano.PanaderiaRack,
  raspaStand: Tejano.RaspaStand,
  raspaCup: Tejano.RaspaCup,
  conjuntoPair: Tejano.ConjuntoPair,
  lowrider: Tejano.Lowrider,
  yardShrine: Tejano.YardShrine,
  tiendita: Tejano.Tiendita,
  coloniaBlock: Tejano.ColoniaBlock,
  pedestrianBridge: Tejano.PedestrianBridge,
  escaramuzaRider: Tejano.EscaramuzaRider,
  starPinata: Tejano.StarPinata,
  comal: Tejano.Comal,
  photoWall: Tejano.PhotoWall,

  // Black Texas, which is coastal and rural and OLD before it is urban
  barbecuePit: BlackTx.BarbecuePit,
  churchFan: BlackTx.ChurchFan,
  fanField: BlackTx.FanField,
  sanctuary: BlackTx.Sanctuary,
  trailRideColumn: BlackTx.TrailRideColumn,
  buckingChute: BlackTx.BuckingChute,
  frottoir: BlackTx.Frottoir,
  shotgunHouse: BlackTx.ShotgunHouse,
  hBCUBand: BlackTx.HBCUBand,
  emancipationPark: BlackTx.EmancipationPark,
  redDrink: BlackTx.RedDrink,

  // FOOTBALL, the game as equipment. hometown draws the stadium and the ritual;
  // this draws the objects, every stamped surface left blank because the mark is
  // live and the form carries the recognition anyway. knowledge/texas/FOOTBALL.md.
  helmet: Football.Helmet,
  football: Football.Football,
  shoulderPads: Football.ShoulderPads,
  scoreboard: Football.Scoreboard,
  chainGang: Football.ChainGang,
  blockingSled: Football.BlockingSled,
  waterCooler: Football.WaterCooler,
  drillTeam: Football.DrillTeam,
  lettermanJacket: Football.LettermanJacket,
  footballAnnual: Football.FootballAnnual,
  trophy: Football.Trophy,
  endZonePylon: Football.EndZonePylon,
  grandstandBowl: Football.GrandstandBowl,
  official: Football.Official,
};

export const ELEMENT_NAMES = Object.keys(ELEMENTS).sort();

/**
 * A component for a name, or a THROWN error naming what was asked for.
 *
 * Returning null here would be the worse choice by a wide margin: the plane
 * renders empty, the film completes, the exit code is 0, and nobody finds out
 * until a person watches it. A board that names something this engine cannot
 * draw is a board that has to be fixed, and it should stop the render.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolve(kind: string): React.FC<any> {
  const c = ELEMENTS[kind];
  if (!c) {
    const near = ELEMENT_NAMES.filter((n) => n.toLowerCase().includes(kind.toLowerCase().slice(0, 4)));
    throw new Error(
      `registry: nothing named "${kind}". A scene that draws nothing renders without error, so ` +
      `this throws instead of returning an empty plane.` +
      (near.length ? ` Did you mean: ${near.join(', ')}?` : ` Known: ${ELEMENT_NAMES.join(', ')}`));
  }
  return c;
}

/**
 * A stable, well-spread seed for an element the board did not seed.
 *
 * EVERY DRAWN THING VARIES BY `seed` AND EVERY ONE OF THEM DEFAULTS IT. A longhorn
 * with no seed takes 5, so its coat, its breath phase and its tail swing are the
 * same as every other unseeded longhorn: stage two and they move in lockstep, which
 * is the herd-of-clones defect FIELD_NOTES records under "variety is not an
 * average". A hand-authored review sheet hides this because a person typing a herd
 * can see it and passes seeds; a board is written by a routine from story data and
 * `seed` is optional there, so unseeded duplicates are the ORDINARY case, not the
 * unlucky one.
 *
 * The address is the seed. It is derived from where the element sits in the board,
 * so it is different for every instance and identical on every frame, which is the
 * pair of properties appearance needs. (An id may come from tree position because
 * nobody sees an id; a coat may not, because tree position shifts when a sibling
 * appears on a frame condition. See lib/uid.ts.)
 *
 * An explicit `seed` on the board always wins. This only fills a hole.
 *
 * WHY IT IS NOT A HASH OF THE WHOLE ADDRESS. It was, and the test caught it: FNV
 * over "scene/plane/item/kind" modulo ten thousand collided four times in two
 * hundred draws, which is exactly what the birthday bound predicts and is not a
 * bug in the hash. A collision only MATTERS between two elements standing in the
 * same shot, so this is built to be provably free of those rather than merely
 * unlikely to have them: the scene id is hashed, the position within the scene is
 * ADDED, and addition inside the modulus cannot map two positions to one value.
 * A probabilistic guarantee would have meant a test that fails one run in fifty,
 * and a gate that goes red at random is a gate people learn to re-run.
 */
export function seedFor(scene: string, plane: number, item: number): number {
  if (!(plane >= 0 && plane < PLANES_MAX) || !(item >= 0 && item < ITEMS_MAX)) {
    throw new Error(
      `seedFor: plane ${plane} item ${item} is outside the addressable range ` +
      `(${PLANES_MAX} planes of ${ITEMS_MAX}). Past it two elements in one scene ` +
      `could take the same seed and render as twins, so this stops instead.`);
  }
  let h = 2166136261;
  for (let i = 0; i < scene.length; i++) {
    h ^= scene.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const ordinal = plane * ITEMS_MAX + item;
  return (((h >>> 0) + ordinal) % SEED_SPACE) + 1;
}

const PLANES_MAX = 64;
const ITEMS_MAX = 512;
// Comfortably larger than PLANES_MAX * ITEMS_MAX, so every position in a scene maps
// to its own value, and small enough that a seed in a logged board reads as a number
// rather than as noise. The drawing code multiplies it into a 32-bit hash, so a
// wider space would buy no more variety.
const SEED_SPACE = 100003;

/**
 * Board-placeable elements that need more than a position to mean anything.
 *
 * THE SAME FAULT AS AN UNKNOWN NAME, ONE LAYER DOWN. `resolve()` throws on a name
 * it does not have because a scene that draws nothing renders without error. An
 * element it DOES have, placed without the geometry or the data it is made of,
 * ends in exactly the same place: `<Sweep>` with no `w` computes `width={NaN}`,
 * and an SVG rect with a NaN width is not an error, it is invisible. React logs a
 * warning to a console nobody reads during an unattended render, and the film
 * completes with a plane missing.
 *
 * TypeScript cannot help here. A board is runtime JSON crossing a `React.FC<any>`
 * boundary, which is the honest shape for data-driven staging and is also the
 * exact seam static types do not cross. So the boundary checks it.
 *
 * Only props with no default belong in this map. Everything else has one.
 */
export const REQUIRED: Record<string, string[]> = {
  conductor: ['x1', 'y1', 'x2', 'y2'],
  detections: ['items'],
  mask: ['cx', 'cy', 'rx', 'ry'],
  sweep: ['x', 'y', 'w', 'h', 'p'],
  plume: ['x', 'y'],
  readout: ['x', 'y', 'rows'],
  confidenceSpread: ['x', 'y', 'values'],
  documentStream: ['title', 'count', 'sample', 'status'],
  dataJoin: ['leftTitle', 'leftCount', 'rightTitle', 'rightCount', 'result'],
  associationDiagram: ['leftLabel', 'rightLabel', 'relation', 'limit'],
  inspectionMap: ['title', 'county', 'segments', 'status'],
  // a sky with no state has no band table and renders the default,
  // which is the silent-empty-plane failure one level down
  sky: ['state'],
};

/** Where an element stands on the board. Its address is what varies it. */
export interface Addr {
  scene: string;
  plane: number;
  item: number;
}

/** Place one element from board data. `frame` is threaded in by the scene. */
export const Element: React.FC<{item: Placed; frame: number; at?: Addr}> = ({
  item, frame, at,
}) => {
  const C = resolve(item.kind);
  // `id` belongs to the board contract, not to the drawing component. Do not leak it into
  // arbitrary SVG props; the address below already carries the renderer's structural identity.
  const {id: _id, kind, props, ...rest} = item;
  const where = at ? `${at.scene}/${at.plane}/${at.item}` : '(unaddressed)';

  const need = REQUIRED[kind];
  if (need) {
    const bag: Record<string, unknown> = {...rest, ...(props ?? {})};
    const missing = need.filter((k) => bag[k] === undefined);
    if (missing.length) {
      throw new Error(
        `${kind} at ${where} is missing ${missing.join(', ')}. ` +
        `Without ${missing.length > 1 ? 'them' : 'it'} the element computes NaN geometry ` +
        `and draws NOTHING, which renders without error and loses the plane silently. ` +
        `Put ${missing.length > 1 ? 'them' : 'it'} in the item's "props".`);
    }
  }

  const auto = at ? seedFor(at.scene, at.plane, at.item) : 1;

  // A cast member is the one thing whose seed is IDENTITY rather than variation, so
  // it keeps the roster's and desyncs on `phase` instead. Everything else varies on
  // seed alone, and an explicit board seed always wins over the derived one.
  const fill = kind === 'person' ? {phase: auto % 97} : {seed: rest.seed ?? auto};

  return <C frame={frame} {...rest} {...fill} {...(props ?? {})} />;
};
