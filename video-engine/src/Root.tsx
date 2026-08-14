import React from 'react';
import {Composition} from 'remotion';
import {CastSheet} from './CastSheet';
import {FaunaSheet} from './FaunaSheet';
import {VehicleSheet} from './VehicleSheet';
import {CivicSheet} from './CivicSheet';
import {SensingSheet} from './SensingSheet';
import {RegionSheet} from './RegionSheet';
import {ProofScene} from './ProofScene';
import {FarmSheet, RoadSheet, MachineRoomSheet, ClinicSheet, WaterSheet,
        PlantSheet} from './ApplicationSheets';
import {FloraSheet, FloraFieldSheet, SkySheet, RoadsideSheet, HometownSheet,
        HomeplaceSheet, TejanoSheet, BlackTexasSheet, FootballSheet, SHEET_H} from './NostalgiaSheets';
import {Dispatch, DEFAULT_DISPATCH, dispatchMetadata} from './Dispatch';
import {RegionName} from './lib/lighting';

const REGIONS: RegionName[] = ['high_plains', 'rolling_plains', 'cross_timbers', 'blackland',
  'post_oak', 'piney_woods', 'gulf', 'south_texas', 'hill_country', 'trans_pecos'];

export const RemotionRoot: React.FC = () => (
  <>
    {/* THE DELIVERABLE, and it did not exist until 2026-08-12.
        Phase 5 of the routine has always run `npx remotion render Dispatch`, and
        nothing here was called Dispatch, so every unattended run died on "No
        composition with the ID 'Dispatch' found" and produced no film.
        `composition_check.py` now refuses any prompt that renders an id this file
        does not register, in either direction.
        Length comes from the board via calculateMetadata; a constant here would
        truncate a long film or pad a short one with black, and a run reports both
        as success. */}
    <Composition id="Dispatch" component={Dispatch} fps={30} width={1080} height={1920}
      defaultProps={DEFAULT_DISPATCH} calculateMetadata={dispatchMetadata}
      durationInFrames={Math.round(DEFAULT_DISPATCH.runtime_s * 30)} />
    <Composition id="Proof" component={ProofScene} durationInFrames={150}
      fps={30} width={1080} height={1920} />
    <Composition id="CastSheet" component={CastSheet} durationInFrames={30}
      fps={30} width={1080} height={1920} />
    {/* taller than a delivery frame on purpose: it is a review surface, and the
        1920 version collided four rows into an unreadable stack */}
    <Composition id="FaunaSheet" component={FaunaSheet} durationInFrames={30}
      fps={30} width={1080} height={3200} />
    <Composition id="VehicleSheet" component={VehicleSheet} durationInFrames={30}
      fps={30} width={1080} height={2560} />
    <Composition id="CivicSheet" component={CivicSheet} durationInFrames={30}
      fps={30} width={1080} height={2100} />
    <Composition id="SensingSheet" component={SensingSheet} durationInFrames={120}
      fps={30} width={1080} height={1720} />
    {/* THE APPLICATION SHEETS. Six modules shipped with nothing that renders them, so
        the only way to see a drawing was to write a board and render a film. Every row
        carries a person, which is the assertion true scale makes: if a cabinet is not
        chest-high and a cooling tower is not five of them, the size table is wrong and
        this is where it shows. */}
    <Composition id="FarmSheet" component={FarmSheet} durationInFrames={120}
      fps={30} width={1080} height={2400} />
    <Composition id="RoadSheet" component={RoadSheet} durationInFrames={120}
      fps={30} width={1080} height={2200} />
    <Composition id="MachineRoomSheet" component={MachineRoomSheet} durationInFrames={120}
      fps={30} width={1080} height={2200} />
    <Composition id="ClinicSheet" component={ClinicSheet} durationInFrames={120}
      fps={30} width={1080} height={2000} />
    <Composition id="WaterSheet" component={WaterSheet} durationInFrames={120}
      fps={30} width={1080} height={2100} />
    <Composition id="PlantSheet" component={PlantSheet} durationInFrames={120}
      fps={30} width={1080} height={1700} />

    {/* THE NOSTALGIA SHEETS. 113 artifacts across seven modules, and this repo has
        learned twice at cost that a drawing nobody has LOOKED AT is not finished:
        Wave V3 rendered the cast and found three bugs in one pass that no typecheck
        could see. Each is 120 frames so the animated components have somewhere to
        move, and each takes its height from SHEET_H so a new artifact grows the
        frame instead of clipping off the bottom. */}
    <Composition id="FloraSheet" component={FloraSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.FloraSheet} />
    <Composition id="FloraFieldSheet" component={FloraFieldSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.FloraFieldSheet} />
    <Composition id="SkySheet" component={SkySheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.SkySheet} />
    <Composition id="RoadsideSheet" component={RoadsideSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.RoadsideSheet} />
    <Composition id="HometownSheet" component={HometownSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.HometownSheet} />
    <Composition id="HomeplaceSheet" component={HomeplaceSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.HomeplaceSheet} />
    <Composition id="TejanoSheet" component={TejanoSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.TejanoSheet} />
    <Composition id="BlackTexasSheet" component={BlackTexasSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.BlackTexasSheet} />
    <Composition id="FootballSheet" component={FootballSheet} durationInFrames={120}
      fps={30} width={1080} height={SHEET_H.FootballSheet} />

    {REGIONS.map((r) => (
      <Composition key={r} id={`Region-${r.replace(/_/g, "-")}`} component={RegionSheet}
        durationInFrames={60} fps={30} width={1080} height={1920}
        defaultProps={{region: r}} />
    ))}
  </>
);
