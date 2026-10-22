import React, {createContext, useContext, useMemo} from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import type {V3} from './cinema/motion';
import {actionProgress, actionWindows, requireAction, type ActionWindow, type DirectedScene} from './direction';

export type MotionCurve = 'smoothstep' | 'linear' | 'travel' | 'contact' | 'landing';
export type EventMotion = {curve: MotionCurve; anticipation?: number; settle?: number; free_prop_reason?:string};
export type DirectedLight = {position: V3; color: string; intensity: number};
export type ShotPose = {position: V3; target: V3; fov: number};
export type DirectedShot = ShotPose & {reason: string; event_id?: string; to?: ShotPose};
export type ArtDirection = {
  flat_shots?: Record<string,{scale:number;x:number;y:number;reason:string;follow_load?:boolean}>;
  version: 'directed-world-v1';
  palette: Record<'background'|'midground'|'foreground'|'ink'|'paper'|'hero'|'accent', string>;
  palette_reason: string;
  lighting: {motivation: string; ambient: number; exposure: number;
    key: DirectedLight; fill: DirectedLight; rim: DirectedLight};
  shape_language: string;
  hero: {asset: string; silhouette: string; finish: string; subject_ids: string[]};
  focal_hierarchy: string;
  motion_language: string;
  signature_shot: {scene_id: string; event_id: string; reason: string};
  shots: Record<string, DirectedShot>;
};

const ArtContext = createContext<ArtDirection | undefined>(undefined);
const CameraContext = createContext<ShotPose | undefined>(undefined);
export const useArtDirection = () => useContext(ArtContext);
export const useDirectedCamera = () => useContext(CameraContext);
export const ArtDirectionProvider: React.FC<{profile?: ArtDirection; scenes?:DirectedScene[]; children: React.ReactNode}> =
  ({profile, scenes=[], children}) => {
    // Read the film clock above Sequences and the Three.js portal. Child-local
    // clocks must never restart an authored camera event.
    const time=useCurrentFrame()/useVideoConfig().fps;
    const windows=useMemo(()=>profile?actionWindows(scenes):{},[profile,scenes]);
    if (profile && (profile.version !== 'directed-world-v1' || !profile.palette || !profile.lighting)) {
      throw new Error('Invalid art direction profile; validate the board before rendering');
    }
    const camera=artShotAt(profile,scenes,windows,time);
    return <ArtContext.Provider value={profile}><CameraContext.Provider value={camera}>{children}</CameraContext.Provider></ArtContext.Provider>;
  };

export function artShotAt(profile:ArtDirection|undefined,scenes:DirectedScene[],windows:Record<string,ActionWindow>,time:number):ShotPose|undefined{
  const scene=scenes.find(s=>time>=s.start_s&&time<s.start_s+s.duration_s);
  return scene?directedShot(profile,scene.id,windows,time):undefined;
}

/** Follow an authored event; a held shot has no synthetic camera movement. */
export function directedShot(profile: ArtDirection | undefined, sceneId: string,
  windows: Record<string, ActionWindow>, time: number): ShotPose | undefined {
  const shot = profile?.shots[sceneId];
  if (!shot) return undefined;
  if (!shot.event_id || !shot.to) return shot;
  const p = actionProgress(requireAction(windows, shot.event_id), time);
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {position: shot.position.map((v,i)=>lerp(v,shot.to!.position[i])) as V3,
    target: shot.target.map((v,i)=>lerp(v,shot.to!.target[i])) as V3,
    fov: lerp(shot.fov,shot.to.fov)};
}
