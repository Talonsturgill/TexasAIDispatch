import React, {createContext} from 'react';
import type {DispatchProps} from '../../Dispatch';
import {Dispatch} from '../../Dispatch';

// The proof renderer removes only the shared stage. Native captions and diagrams stay fixed.
export const CinemaProofContext = createContext(false);
export const ProvenDispatch: React.FC<DispatchProps & {__cinemaProofWithoutStage?: boolean}> =
  (props) => <CinemaProofContext.Provider value={props.__cinemaProofWithoutStage === true}>
    <Dispatch {...props}/>
  </CinemaProofContext.Provider>;
