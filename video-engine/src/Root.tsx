import React from 'react';
import {Composition} from 'remotion';
import {CastSheet} from './CastSheet';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CastSheet" component={CastSheet} durationInFrames={30}
      fps={30} width={1080} height={1920} />
  </>
);
