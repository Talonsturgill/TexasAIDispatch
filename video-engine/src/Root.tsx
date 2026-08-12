import React from 'react';
import {Composition} from 'remotion';
import {CastSheet} from './CastSheet';
import {RegionSheet} from './RegionSheet';
import {ProofScene} from './ProofScene';
import {RegionName} from './lib/lighting';

const REGIONS: RegionName[] = ['high_plains', 'rolling_plains', 'cross_timbers', 'blackland',
  'post_oak', 'piney_woods', 'gulf', 'south_texas', 'hill_country', 'trans_pecos'];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Proof" component={ProofScene} durationInFrames={150}
      fps={30} width={1080} height={1920} />
    <Composition id="CastSheet" component={CastSheet} durationInFrames={30}
      fps={30} width={1080} height={1920} />
    {REGIONS.map((r) => (
      <Composition key={r} id={`Region-${r.replace(/_/g, "-")}`} component={RegionSheet}
        durationInFrames={60} fps={30} width={1080} height={1920}
        defaultProps={{region: r}} />
    ))}
  </>
);
