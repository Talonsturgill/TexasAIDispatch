import {ScrewwormForecastEpisode} from "./ScrewwormForecastEpisode";
import {ContactSensingEpisode} from './ContactSensingEpisode';
import {CoadaptHandoffEpisode} from './CoadaptHandoffEpisode';
import {FaxChartEpisode} from './FaxChartEpisode';
import {MineralProvingGroundEpisode} from './MineralProvingGroundEpisode';
import {FreshwaterTwinEpisode} from "./FreshwaterTwinEpisode";
import React from 'react';
import {useCurrentFrame, useVideoConfig, Sequence, interpolate, Easing, Img, OffthreadVideo,
  staticFile} from 'remotion';
import {Biome} from './lib/biomes';
import {Plane, Stage3D, CameraMoves, composeCams, Camera} from './lib/stage3d';
import {GradeLayer} from './lib/lighting';
import {Element, Placed} from './lib/registry';
import {MaterialDefs} from './lib/materials';
import type {RegionName} from './lib/lighting';
import {FONT, wrapToWidth, widthOf} from './lib/type';
import {captionLayout, creditLayout, CAPTION_BAND} from './lib/editorial';
import {DocketMark} from './branding/DocketMark';
import {SAFE_BOTTOM, SAFE_RIGHT} from './lib/safearea';
import {HighwaySafetyCaseEpisode} from './HighwaySafetyCaseEpisode';
import {RoadEvidenceEpisode} from './RoadEvidenceEpisode';
import {AlloyLoopEpisode} from './AlloyLoopEpisode';
import {IrrigationEpisode} from './IrrigationEpisode';
import {BorderCaptureEpisode} from './BorderCaptureEpisode';
import {BrownsvilleMoratoriumEpisode} from './BrownsvilleMoratoriumEpisode';
import {HospitalExitEpisode} from './HospitalExitEpisode';
import {EmptySeatFlightEpisode} from './EmptySeatFlightEpisode';
import {LocalFloodNodeEpisode} from './LocalFloodNodeEpisode';
import {ProofGateEpisode} from './ProofGateEpisode';
import {FreshwaterDocumentaryEpisode} from './FreshwaterDocumentaryEpisode';
import {MagnetCandidateEpisode} from './MagnetCandidateEpisode';
import {FreightInvitationEpisode} from './FreightInvitationEpisode';
import {BrushCameraEpisode} from './BrushCameraEpisode';

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
  camera_secondary?: keyof typeof CameraMoves;
  camera_entry?: {x?: number; y?: number; z?: number; until_progress: number};
  /**
   * A STATIC FRAMING OFFSET, composed with the move rather than replacing it.
   *
   * Every scene got its move's amplitude and nothing else, so a shot composed too far
   * back had no lever at all except moving each item in it by hand. Three scorers in a
   * row reported the same consequence from three different lenses: forty to fifty percent
   * of the frame carrying empty ceiling or empty sky in eight of twelve shots, with the
   * subject pinned in a band across the middle third of a 1080 by 1920 frame.
   *
   * Moving items is the wrong repair. It desynchronises a scene from its own true scale,
   * which is the fault `lib/scale.ts` exists to prevent, and it has to be redone for every
   * item every time the framing changes. The camera is the thing that decides what is in
   * frame, so the camera is what gets the offset: `z` dollies in until the subject fills
   * the height, `y` booms so what is left over is shared between top and bottom rather
   * than all piled above.
   */
  camera_base?: {x?: number; y?: number; z?: number};
  /** Motivated follow tied to an existing board event, composed over static framing. */
  camera_motion?: {
    event_id: string;
    from: {x?: number; y?: number; z?: number};
    to: {x?: number; y?: number; z?: number};
  };
  /** Ordered far to near. Each plane's z, the director's name for it, and what
   *  stands on it.
   *
   *  `label` is not decoration and it is not read here. THE BOARD IS THE PROPS: this
   *  same file is what `storyboard_check` gates at Gate 0, and the label is what a
   *  director boards and what the divergence signature reads. Two shots whose plane
   *  stacks are named and populated the same way are the same shot, however
   *  differently the captions read. */
  planes: {z: number; label?: string; items: Placed[]}[];
  /** screen-space, never in the world: see the note on chrome below */
  visual_events?: {id?: string; at_s: number; duration_s?: number; item_ids?: string[]}[];
  super?: string;
  /** THE EDITORIAL LINE, and it is NOT a subtitle. It carries the fact the super is too
   *  short to hold. It used to render in a dark band across the bottom of the frame in
   *  the same face and weight a subtitle uses, while the actual narration ran underneath
   *  it saying something else, so a viewer reading along was reading a caption of a
   *  sentence nobody spoke. It renders under the super now, as a kicker on the title,
   *  and the bottom of the frame belongs to `captions` alone. */
  caption?: string;
  weather?: 'norther' | 'dust' | 'overcast' | 'night' | 'late';
  /** The scene is INDOORS. The region still names the light, because a room in Abilene is
   *  lit by Abilene, and the region's plants and dirt stay outside where they live. */
  interior?: boolean;
  scraped?: boolean;
  seed?: number;
  groundY?: number;
  /** Optional exceptional plate, generated and hash-bound by scripts/generated_media.py.
   *  It replaces the biome but NOT the renderer-native evidence planes or chrome. */
  generated_media?: {
    id: string;
    kind: 'image' | 'video';
    file: string;
    prompt: string;
    why: string;
    must_depict: string[];
    replaces_item_ids: string[];
    model?: string;
    pan_x?: number;
    pan_y?: number;
    zoom?: number;
  };
}

/** One burned-in subtitle cue, in FILM-GLOBAL seconds.
 *
 *  These are not authored. `scripts/board_captions.py` folds them into the board from
 *  `out/dispatch/captions.json`, which is produced by alignment against the FINAL mixed
 *  audio, so the text on screen is the text in the room and the timing is measured
 *  rather than guessed. */
export interface Cue {
  id: string;
  start: number;
  end: number;
  text: string;
  source?: string;
}

export type DispatchProps = {
  cinema?: {
    version: string;
    hero_scene_id: string;
    dimensional_scene_ids: string[];
    visible_action: string;
    human_consequence: string;
    source_limit: string;
  };
  runtime_s: number;
  scenes: Scene[];
  title?: string;
  /** THE SUBTITLES, and they are film-global on purpose.
   *
   *  A cue is bounded by where the speaker actually stopped, which has nothing to do with
   *  where the cut is, so cues straddle scene boundaries routinely. Rendering them inside
   *  each scene's Sequence would silently truncate every straddling cue at the cut, and a
   *  half-sentence subtitle is the fault that is hardest to see in a still. */
  captions?: Cue[];
  /** THE CREDITS, and for the music they are not a courtesy.
   *
   *  A bed under a permissive licence is granted in exchange for the attribution, so
   *  this text IS the licence being paid. It is generated by `scripts/music.py` from
   *  the vetted registry, never typed, and `music.py --verify-package` refuses to ship
   *  unless the rendered board, mixed asset, registry id, level and credit all agree.
   *  Passing nothing is legitimate and means the film used no music. */
  credits?: string;
  /** How long the end card holds. Long enough to read is the only requirement. */
  credits_s?: number;
  /** A lead story may opt into a compiled episode instead of asking the generic plane renderer
   *  to impersonate one. Alaska's strongest run is built this way: the board remains the timed,
   *  evidenced contract, while a named episode performs its visual argument. Unknown templates
   *  are refused below instead of silently falling back to a slideshow. */
  cinematic_template?: "screwworm-forecast-v1" | 'road-evidence-v2' | 'pavement-inspection-v1' | 'alloy-loop-v1' |
    'irrigation-judgment-v1' | 'border-capture-v1' | 'brownsville-moratorium-v1' |
    'hospital-exit-v1' | 'empty-seat-flight-v1' | 'local-flood-node-v1' |
    'proof-gate-v1' | 'magnet-candidate-v1' | 'highway-safety-case-v1' | 'freshwater-twin-v1' | 'freshwater-documentary-v2' | 'mineral-proving-ground-v1' | 'fax-chart-v1' | 'coadapt-handoff-v1' | 'contact-sensing-v1' | 'freight-invitation-v1' | 'brush-camera-v1';
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
        {z: 860, label: 'sky', items: [{kind: 'turkeyVulture', x: 760, y: 330, scale: 0.5, seed: 51}]},
        {z: 640, label: 'ridge', items: [
          {kind: 'pumpjack', x: 120, y: 962, scale: 0.12, seed: 40, props: {rpm: 7, wear: 0.4}},
          {kind: 'pumpjack', x: 620, y: 958, scale: 0.13, seed: 49, props: {rpm: 8, wear: 0.5}},
          {kind: 'windTurbine', x: 980, y: 958, scale: 0.026, seed: 3},
        ]},
        {z: 300, label: 'mid', items: [{kind: 'dataCentre', x: -40, y: 1180, scale: 0.12, seed: 5,
                          props: {wear: 0.25}}]},
        {z: 150, label: 'near', items: [
          {kind: 'person', x: 330, y: 1420, scale: 0.8, props: {cast: 'engineer', pose: 'point'}},
          {kind: 'person', x: 620, y: 1426, scale: 0.8, facing: -1,
           props: {cast: 'rancher', pose: 'hands-hips', emotion: 'wry'}},
        ]},
        {z: 40, label: 'hero', items: [{kind: 'mesquite', x: -60, y: 2020, scale: 0.28, seed: 9}]},
      ],
    },
    {
      id: 's2', start_s: 5, duration_s: 5, region: 'high_plains', county: 'Lubbock',
      camera_strategy: 'craneDown', seed: 12, groundY: 1120,
      super: 'and the water under it',
      planes: [
        {z: 700, label: 'sky', items: [{kind: 'waterTower', x: 820, y: 1000, scale: 0.084, seed: 2}]},
        {z: 420, label: 'ridge', items: [{kind: 'windmill', x: 200, y: 1060, scale: 0.22, seed: 4}]},
        {z: 200, label: 'mid', items: [{kind: 'stockTank', x: 620, y: 1180, scale: 0.17, seed: 6}]},
        {z: 90, label: 'near', items: [{kind: 'jackrabbit', x: 300, y: 1300, scale: 0.9, seed: 24}]},
      ],
    },
  ],
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * A font size that keeps `text` inside `maxW`, never larger than `base`.
 *
 * The display face is measured in `lib/type.ts`; using that one shared measurement keeps
 * this fitter in sync when the shipped font changes. The old private `0.52em` character
 * guess under-counted all-caps Fraunces and let long supers run beyond the right edge.
 */
const fitPx = (text: string, base: number, maxW: number) => {
  const needAtOnePx = Math.max(1, widthOf(text, 1, true));
  return Math.min(base, Math.max(28, maxW / needAtOnePx));
};

/** Editorial captions keep every spoken word, in balanced bold lines. Geometry is
 * solved inside the feed reserve and font widths come from the shared measured table.
 * Dense cues fail with a readable correction instead of shrinking into tiny paragraphs. */
const CAP_X = CAPTION_BAND.left;
const CAP_PAD_L = CAPTION_BAND.padding;
const CAP_PAD_R = CAPTION_BAND.padding;
const CAP_W = SAFE_RIGHT - CAP_X - CAP_PAD_L - CAP_PAD_R;

const capFit = (text?: string): {lines: string[]; size: number} =>
  captionLayout(text ?? '', CAP_W);

/** The kicker under the super. It lives in the left two thirds so it never reaches
 *  across the frame the way a subtitle does, which is half of what keeps the two
 *  readable as different things, and it gets three lines because it is narrower. */
const KICK_W = 640;
/** Measured, for the same reason `capFit` is. A character count was wrong here too. */
/** How many lines the kicker may hold before it is shrunk rather than cut. */
const KICK_MAX_LINES = 5;

/**
 * THE KICKER WRAPPED AND THEN SILENTLY THREW THE REST AWAY.
 *
 * This was `.slice(0, 3)`. A caption longer than three lines lost everything after the
 * third, with no error, no overflow and nothing on screen to show that text was missing.
 * On 2026-08-28 s8's caption read "45 producers answered the Dallas Fed's question on how
 * much artificial intelligence would lower their" and stopped, so the clause carrying the
 * meaning AND the entire collection-date provenance were cut. A judge caught it in the
 * finished film.
 *
 * This file already warns about this defect TWICE, in `fitPx` and in the `CreditsCard`,
 * and both warnings are about text running PAST the frame, which is at least visible. A
 * silent truncation is the worse version: the frame looks composed and the sentence is
 * simply gone, and a provenance line that renders as nothing is the same as a provenance
 * line that was never written.
 *
 * So the kicker now shrinks to fit and only refuses to draw what is genuinely absurd. The
 * band grows to `KICK_MAX_LINES` and the type steps down to keep the plate the same
 * height, which is the same trade `fitPx` and `capFit` already make for the super and the
 * subtitle. Nothing is dropped.
 */
const kickFit = (text?: string): {lines: string[]; size: number} => {
  if (!text) return {lines: [], size: 29};
  for (const size of [29, 27, 25, 23, 21]) {
    const lines = wrapToWidth(text, KICK_W, size);
    if (lines.length <= KICK_MAX_LINES) return {lines, size};
  }
  return {lines: wrapToWidth(text, KICK_W, 21).slice(0, KICK_MAX_LINES), size: 21};
};

const kickLines = (text?: string): string[] => kickFit(text).lines;

/**
 * THE SUBTITLE TRACK. Film-global, driven by measured cues, and the only thing that
 * ever occupies the bottom band.
 *
 * It reads the frame in the composition's own timebase rather than a Sequence's, which
 * is why it is mounted beside the scenes and not inside one.
 */
export const SubtitleTrack: React.FC<{cues: Cue[]; fps: number}> = ({cues, fps}) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const layouts = React.useMemo(() => cues.map((cue) => capFit(cue.text)), [cues]);
  const index = cues.findIndex((cue) => t >= cue.start && t < cue.end);
  if (index < 0) return null;
  const cue = cues[index];
  const {lines, size} = layouts[index];
  const lead = size * 1.23;
  const h = lines.length * lead + 20;
  const settle = interpolate((t - cue.start) * fps, [0, 6], [-6, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // The whole measured cue is visible from its first frame. No simulated word clock,
  // typewriter reveal, or fade that steals reading time from its measured boundaries.
  return (
    <div aria-label="Narration captions" style={{position: 'absolute', left: CAP_X,
      top: SAFE_BOTTOM - h + settle, width: SAFE_RIGHT - CAP_X, height: h,
      background:'rgba(8,11,18,.91)',borderLeft:'4px solid #e0956a',borderRadius:5}}>
      {lines.map((line, i) => (
        <div key={i} style={{position: 'absolute', left: CAP_PAD_L, top: 9 + i * lead,
          width: 'max-content', maxWidth: CAP_W,
          fontFamily: FONT.body, fontSize: size, fontWeight: 700,
          lineHeight: `${lead - 3}px`, whiteSpace: 'pre',
          color: '#f2ede2'}}>{line}</div>
      ))}
    </div>
  );
};

/** A generated documentary plate remains only a plate. Precise labels, figures and claims are
 *  still drawn by the evidence components above it, which keeps the truth surface deterministic. */
const MediaPlate: React.FC<{media: NonNullable<Scene['generated_media']>; frame: number;
  duration: number}> = ({media, frame, duration}) => {
  if (!media.file.startsWith('generated/') || media.file.includes('..')) {
    throw new Error(`generated media must live under public/generated, got ${media.file}`);
  }
  const progress = clamp01(frame / Math.max(1, duration));
  const zoom = media.zoom ?? 1.08;
  const transform = `translate(${(media.pan_x ?? 0) * progress}px, ` +
    `${(media.pan_y ?? 0) * progress}px) scale(${1 + (zoom - 1) * progress})`;
  const style: React.CSSProperties = {
    position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform, transformOrigin: '50% 50%',
  };
  if (media.kind === 'image') return <Img src={staticFile(media.file)} style={style} />;
  if (media.kind === 'video') {
    return <OffthreadVideo src={staticFile(media.file)} style={style} muted />;
  }
  throw new Error(`generated media kind must be image or video, got ${String(media.kind)}`);
};

/** The exact plane objects from the board. Shared by deterministic biomes and generated plates
 *  so optional media cannot fork the staging contract into a second renderer. */
const ScenePlanes: React.FC<{scene: Scene; frame: number; skipIds?: string[]}> =
({scene, frame, skipIds = []}) => (
  <>
    {scene.planes.map((pl, i) => (
      <Plane key={i} z={pl.z}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow: 'visible'}}>
          <MaterialDefs />
          {pl.items.filter((item) => !item.id || !skipIds.includes(item.id)).map((item, j) => (
            <Element key={item.id ?? `${item.kind}-${j}`} item={item} frame={frame}
              at={{scene: scene.id, plane: i, item: j}} />
          ))}
        </svg>
      </Plane>
    ))}
  </>
);

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
  const camera: Camera = composeCams(move(p), scene.camera_base ?? {});

  return (
    <div style={{position: 'absolute', inset: 0, background: '#0d1220'}}>
      {scene.generated_media ? (
        <>
          <MediaPlate media={scene.generated_media} frame={f} duration={dur} />
          <Stage3D camera={camera} background="transparent">
            <ScenePlanes scene={scene} frame={f}
              skipIds={scene.generated_media.replaces_item_ids} />
          </Stage3D>
        </>
      ) : (
        <Biome region={scene.region} frame={f} camera={camera} seed={scene.seed ?? 1}
          groundY={scene.groundY ?? 1060} weather={scene.weather} interior={scene.interior}
          scraped={scene.scraped}>
          {/* OVERFLOW VISIBLE and MaterialDefs live inside ScenePlanes. Keeping the one stack
              shared with generated plates prevents optional media from becoming a second,
              less-gated scene format. */}
          <ScenePlanes scene={scene} frame={f} />
        </Biome>
      )}

      {/* SCREEN-SPACE CHROME STAYS OUTSIDE Stage3D. A super or a caption is not a
          world object, and putting one in the world is how a title ends up lying
          on the ground during a crane move. */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}>
        <GradeLayer f={f} vignette={0.2} grain={0.045} bloom={0.12} />
        {scene.super && (
          <g opacity={interpolate(f, [4, 18, dur - 12, dur - 2], [0, 1, 1, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            {/* SHRINK TO FIT, because SVG TEXT DOES NOT WRAP AND DOES NOT CLIP EITHER.
                It just keeps drawing past the frame edge. The first Dispatch rendered a
                super reading "4,000 of them, already runnin" with every gate green: the
                string was checked for numerals and for retired motifs and never for
                whether it FITS. The CreditsCard below already wraps for this exact reason
                and the super never got the same treatment. */}
            <text x={64} y={210} fontSize={fitPx(scene.super, 74, 1080 - 64 - 40)}
              fontWeight={700} fill="#f2ede2"
              fontFamily={FONT.display}>{scene.super}</text>
            <rect x={64} y={244} width={132} height={5} fill="#c8703a" />
          </g>
        )}
        {scene.caption && (
          <g opacity={clamp01(interpolate(f, [6, 20, dur - 12, dur - 2], [0, 1, 1, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}>
            {/* THE KICKER, sitting on the super's rule rather than in the subtitle's seat.
                It still WRAPS, same fault and same evidence: the first Dispatch shipped
                "Per site large load metering is confidential, so the number stays i" off
                the right edge, and a line that carries the fact loses the fact when it runs
                off the frame. */}
            {(() => {
              // ONE fit, used by the plate AND the text. Calling the wrapper separately for
              // the height and for the lines is how a plate ends up sized for a different
              // string than the one drawn on it.
              const {lines, size} = kickFit(scene.caption);
              const lead = size * 1.31;
              const h = 16 + lines.length * lead;
              return (
                <>
                  <rect x={64} y={266} width={KICK_W + 28} height={h} rx={4} fill="#0d1220"
                    opacity={0.80} />
                  <rect x={64} y={266} width={4} height={h} fill="#c8703a" />
                  {lines.map((ln, i) => (
                    <text key={i} x={84} y={266 + size + 1 + i * lead}
                      fontSize={size} fill="#d9d2c4" fontFamily={FONT.body}>{ln}</text>
                  ))}
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
};

/** A publication sign-off with a recognisable masthead and a held, complete colophon.
 * Only the mark/masthead settles into place. Attribution is visible for the whole card. */
export const CreditsCard: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const CREDIT_W = SAFE_RIGHT - 78;
  const rows = React.useMemo(() => creditLayout(text, CREDIT_W, 850, SAFE_BOTTOM - 28), [text]);
  const enter = interpolate(f, [0, Math.round(fps * 0.4)], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', inset: 0, background: '#08060f'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" aria-label="Texas AI Docket credits">
        {/* Registration rules and the flag's colour band tie the card to the publication. */}
        <path d={`M78 148H${SAFE_RIGHT}M78 817H${SAFE_RIGHT}`} stroke="#3a3040" strokeWidth={2}/>
        <path d="M78 148H205" stroke="#e0956a" strokeWidth={5}/>
        <text x={78} y={116} fontSize={22} fontFamily={FONT.mono} letterSpacing={3}
          fill="#e0956a">THE DAILY DISPATCH</text>
        <g transform={`translate(78 ${205 + (1 - enter) * 18})`} opacity={0.4 + 0.6 * enter}>
          <DocketMark/>
          <text x={0} y={220} fontFamily={FONT.display} fontWeight={700} fontSize={66}
            fill="#ede6d6">Texas AI</text>
          <text x={-5} y={364} fontFamily={FONT.display} fontWeight={700} fontSize={142}
            fill="#ede6d6">Docket</text>
        </g>
        <path d={`M78 627H${78 + CREDIT_W * enter}`} stroke="#e0956a" strokeWidth={3}/>
        <text x={78} y={704} fontSize={28} fontFamily={FONT.body} fill="#c9bece">Visit the Docket</text>
        <text x={78} y={766} fontSize={46} fontWeight={700} fontFamily={FONT.body}
          fill="#ede6d6">texasaidocket.com</text>
        <path d={`M${SAFE_RIGHT - 57} 747h44m-15 -15 15 15-15 15`}
          fill="none" stroke="#e0956a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"/>
        {rows.map((row, i) => <text key={i} x={78} y={row.y} fontSize={row.size}
          fontFamily={row.heading ? FONT.mono : FONT.body} letterSpacing={row.heading ? 3 : 0}
          fill={row.heading ? '#e0956a' : '#ede6d6'}>{row.text}</text>)}
      </svg>
    </div>
  );
};

export const Dispatch: React.FC<DispatchProps> = ({scenes, captions, credits, credits_s = 4,
  cinematic_template, documentary_copy, __cinemaProofWithoutStage}) => {
  const {fps} = useVideoConfig();
  const end = scenes.reduce((m, s) => Math.max(m, s.start_s + s.duration_s), 0);
  if (cinematic_template === 'brush-camera-v1') {
    return <BrushCameraEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}
      __cinemaProofWithoutStage={__cinemaProofWithoutStage}/>;
  }
  if (cinematic_template === "screwworm-forecast-v1") return <ScrewwormForecastEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s} />;
  if (cinematic_template === 'contact-sensing-v1') {
    return <ContactSensingEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'freight-invitation-v1') {
    return <FreightInvitationEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'coadapt-handoff-v1') {
    return <CoadaptHandoffEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'fax-chart-v1') {
    return <FaxChartEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'mineral-proving-ground-v1') {
    return <MineralProvingGroundEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'highway-safety-case-v1') {
    return <HighwaySafetyCaseEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s}/>;
  }
  if (cinematic_template === 'road-evidence-v2') {
    return <RoadEvidenceEpisode scenes={scenes} captions={captions} credits={credits}
      credits_s={credits_s} />;
  }
  if (cinematic_template === 'pavement-inspection-v1') {
    return <RoadEvidenceEpisode scenes={scenes} captions={captions} credits={credits}
      credits_s={credits_s} mode="pavement-inspection" />;
  }
  if (cinematic_template === 'alloy-loop-v1') {
    return <AlloyLoopEpisode scenes={scenes} captions={captions} credits={credits}
      credits_s={credits_s} />;
  }
  if (cinematic_template === 'irrigation-judgment-v1') {
    return <IrrigationEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits}
      credits_s={credits_s} />;
  }
  if (cinematic_template === 'border-capture-v1') {
    return <BorderCaptureEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'brownsville-moratorium-v1') {
    return <BrownsvilleMoratoriumEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'hospital-exit-v1') {
    return <HospitalExitEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'empty-seat-flight-v1') {
    return <EmptySeatFlightEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'local-flood-node-v1') {
    return <LocalFloodNodeEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'magnet-candidate-v1') {
    return <MagnetCandidateEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'freshwater-documentary-v2') {
    return <FreshwaterDocumentaryEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s} documentary_copy={documentary_copy}/>;
  }
  if (cinematic_template === 'freshwater-twin-v1') {
    return <FreshwaterTwinEpisode runtime_s={end} scenes={scenes} captions={captions} credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template === 'proof-gate-v1') {
    return <ProofGateEpisode runtime_s={end} scenes={scenes} captions={captions}
      credits={credits} credits_s={credits_s} />;
  }
  if (cinematic_template) throw new Error('Unknown cinematic_template '+cinematic_template);
  return (
    <>
      {scenes.map((s) => (
        <Sequence key={s.id} from={Math.round(s.start_s * fps)}
          durationInFrames={Math.max(1, Math.round(s.duration_s * fps))}>
          <DispatchScene scene={s} fps={fps} />
        </Sequence>
      ))}
      {/* Mounted OUTSIDE the scene sequences and BEFORE the credits card, so a cue that
          straddles a cut survives it and no cue paints over the attribution. */}
      {captions && captions.length > 0 && (
        <Sequence from={0} durationInFrames={Math.max(1, Math.round(end * fps))}>
          <SubtitleTrack cues={captions} fps={fps} />
        </Sequence>
      )}
      {credits && credits.trim() && (
        <Sequence from={Math.round(end * fps)}
          durationInFrames={Math.max(1, Math.round(credits_s * fps))}>
          <CreditsCard text={credits} />
        </Sequence>
      )}
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
  // The credits card is APPENDED, so the composition has to grow by its length. Without
  // this the card renders past the end of the film and is simply never seen, which for
  // a permissively licensed bed means the attribution silently went unpaid.
  const tail = (board.credits ?? '').trim() ? (board.credits_s ?? 4) : 0;
  const seconds = Math.max(board.runtime_s ?? 0, last) + tail;
  if (seconds <= 0) {
    throw new Error(
      'Dispatch: the board declares no runtime and no scenes, so there is nothing to render. ' +
      'A zero-length composition renders "successfully" as an empty file.');
  }
  return {durationInFrames: Math.round(seconds * 30)};
};
