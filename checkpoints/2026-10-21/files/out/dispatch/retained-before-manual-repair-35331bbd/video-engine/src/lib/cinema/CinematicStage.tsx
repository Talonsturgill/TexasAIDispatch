import React, {useCallback,useContext,useLayoutEffect,useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {CinemaProofContext} from './StageContext';
import {useCurrentFrame,useDelayRender,useRemotionEnvironment,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import {Studio} from './Studio';
import type {V3} from './motion';
import {useArtDirection,useDirectedCamera} from '../artDirection';

/** Flush committed scene and camera changes before the frame is captured.
 * The demand loop can otherwise expose a cleared buffer at a scene transition.
 * This draws only the deterministic Remotion frame; it advances no simulation.
 */
const CaptureFrame:React.FC<{onCaptured:(frame:number)=>void}>=({onCaptured})=>{
 const frame=useCurrentFrame();
 const {gl,scene,camera}=useThree();
 useLayoutEffect(()=>{
  gl.render(scene,camera);
  gl.getContext().finish();
  onCaptured(frame);
 },[frame,gl,scene,camera,onCaptured]);
 return null;
};

/** Native dimensional lane. Callers derive both camera and subjects from the board clock.
 * Text, captions and source extracts remain in the ordinary DOM above this canvas.
 * Render with Chromium's angle backend. A GPU context error must fail the render.
 */
export const CinematicStage:React.FC<{
  position:V3; target:V3; children:React.ReactNode; fov?:number; exposure?:number;
}>=({position,target,children,fov=39,exposure=1.1})=>{
 const {width,height}=useVideoConfig();
 const art=useArtDirection();
 const directed=useDirectedCamera();
 position=directed?.position??position;target=directed?.target??target;fov=directed?.fov??fov;
 const frame=useCurrentFrame();
 const {isRendering}=useRemotionEnvironment();
 const {delayRender,continueRender}=useDelayRender();
 const omitted=useContext(CinemaProofContext);
 const pending=useRef<{frame:number;handle:number}|null>(null);
 const completed=useRef<number|null>(null);
 const onCaptured=useCallback((capturedFrame:number)=>{
  completed.current=capturedFrame;
  const gate=pending.current;
  if(gate?.frame===capturedFrame){
   pending.current=null;
   continueRender(gate.handle);
  }
 },[continueRender]);
 useLayoutEffect(()=>{
  if(!isRendering||omitted)return;
  // The outer Remotion tree must wait for the Fiber portal, not just its DOM commit.
  const handle=delayRender(`Waiting for cinematic frame ${frame} to flush`);
  pending.current={frame,handle};
  if(completed.current===frame){
   pending.current=null;
   continueRender(handle);
  }
  return ()=>{
   const gate=pending.current;
   if(gate?.frame===frame){pending.current=null;continueRender(gate.handle);}
  };
 },[frame,isRendering,omitted,delayRender,continueRender]);
 if (omitted) return null;
 return <ThreeCanvas width={width} height={height} dpr={1} shadows
   camera={{fov,near:.05,far:100}}
   gl={{antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance',
     toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:art?.lighting.exposure??exposure}}>
   <Studio position={position} target={target} fov={fov} lighting={art?.lighting}/>
   {children}
   <CaptureFrame onCaptured={onCaptured}/>
 </ThreeCanvas>;
};
