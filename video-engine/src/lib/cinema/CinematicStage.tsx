import React, {useContext} from 'react';
import {CinemaProofContext} from './ProofContext';
import {useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Studio} from './Studio';
import type {V3} from './motion';

/** Native dimensional lane. Callers derive both camera and subjects from the board clock.
 * Text, captions and source extracts remain in the ordinary DOM above this canvas.
 * Render with Chromium's angle backend. A GPU context error must fail the render.
 */
export const CinematicStage:React.FC<{
  position:V3; target:V3; children:React.ReactNode; fov?:number; exposure?:number;
}>=({position,target,children,fov=39,exposure=1.1})=>{
 const {width,height}=useVideoConfig();
 const omitted=useContext(CinemaProofContext);
 if (omitted) return null;
 return <ThreeCanvas width={width} height={height} dpr={1} shadows
   camera={{fov,near:.05,far:100}}
   gl={{antialias:true,alpha:true,powerPreference:'high-performance',
     toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:exposure}}>
   <Studio position={position} target={target}/>
   {children}
 </ThreeCanvas>;
};
