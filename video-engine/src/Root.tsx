import React from 'react';
import {Composition} from 'remotion';
import {CastSheet} from './CastSheet';
import {FaunaSheet} from './FaunaSheet';
import {VehicleSheet} from './VehicleSheet';
import {CivicSheet} from './CivicSheet';
import {SensingSheet} from './SensingSheet';
import {RegionSheet} from './RegionSheet';
import {ProofScene} from './ProofScene';
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
    {REGIONS.map((r) => (
      <Composition key={r} id={`Region-${r.replace(/_/g, "-")}`} component={RegionSheet}
        durationInFrames={60} fps={30} width={1080} height={1920}
        defaultProps={{region: r}} />
    ))}
  </>
);
