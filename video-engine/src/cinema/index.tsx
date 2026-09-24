import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {CinemaStudy,Treatment} from './CinemaStudy';
import {withFonts} from '../lib/fonts';
import {STUDY} from './plan';
const CinemaRoot:React.FC=()=> <>
 {(['vector','dimensional','hybrid'] as Treatment[]).map(treatment=>
  <Composition key={treatment} id={'Cinema-'+treatment} component={withFonts(CinemaStudy)}
    width={1080} height={1920} fps={STUDY.fps} durationInFrames={STUDY.seconds*STUDY.fps}
    defaultProps={{treatment}}/> )}
</>;
registerRoot(CinemaRoot);
