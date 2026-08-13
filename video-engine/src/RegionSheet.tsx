import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Biome} from './lib/biomes';
import {RegionName} from './lib/lighting';
import {Pumpjack, DataCentre, WindTurbine} from './lib/kit';

// Every region, same subject, so a reviewer can see in one look whether any two
// of them are the same place. The subject is deliberately identical: a data
// centre on caliche with a pumpjack behind it, which is our recurring composition.
export const RegionSheet: React.FC<{region?: RegionName}> = ({region = 'high_plains'}) => {
  const f = useCurrentFrame();
  return (
    <Biome region={region} frame={f} seed={7} groundY={1290}>
      <div style={{position: 'absolute', inset: 0}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <DataCentre x={230} y={1300} scale={0.02007} seed={3} />
          <Pumpjack frame={f} x={840} y={1310} scale={0.03987} seed={11} />
          <WindTurbine frame={f} x={110} y={1300} scale={0.004738} seed={5} />
          <text x={44} y={110} fontSize={44} fontWeight={700} fill="#101423"
            fontFamily="Georgia, serif">{region.replace(/_/g, ' ')}</text>
        </svg>
      </div>
    </Biome>
  );
};
