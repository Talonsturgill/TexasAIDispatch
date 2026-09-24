import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {CinemaStudy} from '../src/cinema/CinemaStudy';
import {CinemaProofContext} from '../src/lib/cinema/ProofContext';
import {withFonts} from '../src/lib/fonts';
const Probe: React.FC<{omitStage: boolean}> = ({omitStage}) =>
  <CinemaProofContext.Provider value={omitStage}><CinemaStudy treatment="hybrid"/></CinemaProofContext.Provider>;
registerRoot(() => <Composition id="CinemaContractTest" component={withFonts(Probe)}
  width={1080} height={1920} fps={30} durationInFrames={600} defaultProps={{omitStage:false}}/>);
