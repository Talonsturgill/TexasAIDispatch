import React from 'react';
import type {Grade as GradeT} from './tokens';

/**
 * THE GRADE. What turns a printed drawing into a lit picture.
 *
 * The shared drawings are flat fills under a hazy region plate, so the film read as faded. A
 * colourist fixes that with four moves and this does the same four, in order, over everything the
 * shot draws:
 *
 *  1. CHROMA AND CONTRAST. A CSS filter on the whole stage: saturation up about a third, contrast up
 *     a tenth. Cheap in the renderer and it lifts every shelf drawing at once.
 *  2. SPLIT TONE. Highlights lean warm toward `high`, shadows lean toward `low` (soft-light blend).
 *     Hue separation between light and shade is most of what reads as "lit".
 *  3. KEY LIGHT. A soft glow from the top of frame (screen blend), the sun or the window.
 *  4. VIGNETTE AND GRAIN. Edges fall off so the eye sits on the subject, and a fine seeded grain
 *     binds the vector edges into one image so nothing reads as raw code.
 *
 * Deterministic: the grain seed is the frame number mod 6, so two renders of a frame match.
 */
export const GradeStage: React.FC<{grade: GradeT; frame: number; children: React.ReactNode}> = ({
  grade, frame, children,
}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0,
      filter: `saturate(${grade.saturate}) contrast(${grade.contrast}) brightness(${grade.brightness})`}}>
      {children}
    </div>
    <GradeOverlays grade={grade} frame={frame} />
  </div>
);

export const GradeOverlays: React.FC<{grade: GradeT; frame: number; strength?: number}> = ({
  grade, frame, strength = 1,
}) => (
  <>
    {/* sky: the region plates carry a pale haze. A deep sky gradient multiplied over the top of
        frame gives it a colour without touching the ground, then fades out above the horizon. */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.85 * strength,
      background: `linear-gradient(180deg, ${grade.sky} 0%, ${grade.sky2} 26%, rgba(255,255,255,0) 50%)`}} />
    {/* ground: a warm lift from the bottom so the earth reads sunlit, not dusty */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.5 * strength,
      background: `linear-gradient(0deg, ${grade.ground} 0%, rgba(128,128,128,0) 45%)`}} />
    {/* split tone: warm highlights, cool shadows */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.55 * strength,
      background: `linear-gradient(180deg, ${grade.high} 0%, rgba(128,128,128,0) 48%, ${grade.low} 100%)`}} />
    {/* key light from the top */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.38 * strength,
      background: `radial-gradient(120% 55% at 50% -6%, ${grade.key} 0%, rgba(0,0,0,0) 62%)`}} />
    {/* vignette */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.6 * strength,
      background: 'radial-gradient(85% 70% at 50% 46%, rgba(255,255,255,0) 58%, rgba(10,8,30,0.62) 100%)'}} />
    <Grain frame={frame} opacity={0.07 * strength} />
  </>
);

export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.07}) => {
  const seed = frame % 6;
  return (
    <svg width={1080} height={1920} viewBox="0 0 540 960"
      style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
      <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={540} height={960} filter={`url(#grain-${seed})`} />
    </svg>
  );
};
