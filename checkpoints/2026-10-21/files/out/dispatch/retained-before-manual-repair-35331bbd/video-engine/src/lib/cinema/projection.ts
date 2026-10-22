import type {PerspectiveCamera} from 'three';

// Remotion can seek from any preceding scene. Projection is current-frame state.
export function setFrameProjection(camera: PerspectiveCamera, fov: number) {
  camera.fov = fov;
  camera.updateProjectionMatrix();
}
