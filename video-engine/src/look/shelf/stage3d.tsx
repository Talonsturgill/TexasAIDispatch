import React from 'react';
import {light, line, mix, shade, SHADE_TO} from '../color';
import {useUid} from '../Kit';

/**
 * STAGE3D, LOOK V2 (November 13th, 2026). The depth pieces that put colour on screen.
 *
 * Most of lib/stage3d.tsx is camera and layout (Stage3D, Plane, Card's placement, CameraMoves,
 * composeCams, PERSPECTIVE) and draws nothing of its own, so it needs no second version and scenes keep
 * using it as it is. Atmosphere already does what look v2 rule five asks (far planes paler, bluer, lower
 * in contrast) and is kept too.
 *
 * Three pieces do paint, and each painted its dark side toward black. The library cast shadow is the
 * silhouette at brightness zero, Solidify darkens and greys its body slices, and Extrude's ambient
 * occlusion sinks toward near-black navy. Look v2 rule two says a shade is the fill's own hue pushed
 * toward violet, never black, so these V2s keep every prop and every depth behaviour and change only
 * where the dark goes. Each is HTML (CSS 3D), placed exactly where the library piece is placed.
 */
const rgb = (c: string) => {
  const h = c.replace('#', '');
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};
/** a colour matrix that pulls every pixel a fraction `a` of the way to colour `c`, keeping alpha */
const toward = (c: string, a: number) => {
  const [r, g, b] = rgb(c);
  const k = (1 - a).toFixed(3);
  return `${k} 0 0 0 ${(r * a).toFixed(3)} 0 ${k} 0 0 ${(g * a).toFixed(3)} 0 0 ${k} 0 ${(b * a).toFixed(3)} 0 0 0 1 0`;
};
/** the hidden svg that holds the filters a CSS filter url points at */
const FilterDefs: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={0} height={0} style={{position: 'absolute', width: 0, height: 0, overflow: 'hidden'}} aria-hidden>
    <defs>{children}</defs>
  </svg>
);

/**
 * A CAST SHADOW that keeps its colour. The silhouette is flattened and leaned along the key light as in
 * the library, but filled with the deep violet of every v2 contact shadow instead of black, and it fades
 * as it runs away from the feet, the way a real shadow softens with distance.
 */
export const CastShadow3DV2: React.FC<{x: number; y: number; scaleX?: number; lean?: number; squash?: number; blur?: number;
  opacity?: number; color?: string; children: React.ReactNode}> = ({
  x, y, scaleX = 1, lean = 0.6, squash = 0.26, blur = 12, opacity = 0.34, color = '#1a1236', children,
}) => {
  const id = useUid();
  return (
    <>
      <FilterDefs>
        <filter id={`${id}-cs`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feFlood floodColor={color} result="ink" />
          <feComposite in="ink" in2="SourceAlpha" operator="in" result="sil" />
          <feGaussianBlur in="sil" stdDeviation={blur} />
        </filter>
      </FilterDefs>
      <div style={{
        position: 'absolute', left: x, top: y, transformOrigin: 'bottom center',
        transform: `skewX(${lean * 34}deg) scale(${scaleX}, ${squash})`,
        filter: `url(#${id}-cs)`, opacity: Math.min(1, opacity * 1.45), pointerEvents: 'none',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.15) 100%)',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.15) 100%)',
      }}>
        {children}
      </div>
    </>
  );
};

/**
 * SOLIDIFY with a coloured body. The children render once as the lit front face and `slices` copies
 * behind it form the body, as in the library. Each body slice is pulled toward violet (deeper slices
 * further), and the wall that faces the key keeps a warm cream lift, so an orbit reveals a side that is
 * the hero's own colour in shade rather than a grey cut-out. The slice just behind the face is lit
 * toward cream, a rim of light that rounds the edge where the face turns into the body.
 */
export const SolidifyV2: React.FC<{depth?: number; slices?: number; camRotY?: number; children: React.ReactNode}> = ({
  depth = 34, slices = 5, camRotY = 0, children,
}) => {
  const id = useUid();
  const facing = Math.max(-1, Math.min(1, camRotY / 22));     // -1 faces the key (warm) .. +1 faces away (cool)
  const tgt = mix(mix(SHADE_TO, '#ffe2b8', 0.32), SHADE_TO, (facing + 1) / 2);
  const layers: React.ReactNode[] = [];
  for (let i = slices; i >= 1; i--) {
    const t = i / slices;
    layers.push(
      <div key={i} style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-t * depth}px)`,
        filter: `url(#${id}-s${i})`}}>
        {children}
      </div>,
    );
  }
  layers.push(<div key="front" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{children}</div>);
  return (
    <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
      <FilterDefs>
        {Array.from({length: slices}, (_, k) => {
          const i = k + 1, t = i / slices;
          return <filter key={i} id={`${id}-s${i}`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={i === 1 ? toward('#fff4dc', 0.45) : toward(tgt, 0.34 + t * 0.3)} />
          </filter>;
        })}
      </FilterDefs>
      {layers}
    </div>
  );
};

/** CARD with the coloured body, the library's positioned host for a 2D hero, solidified by SolidifyV2. */
export const CardV2: React.FC<{x: number; y: number; w: number; h: number; solid?: boolean; depth?: number; camRotY?: number;
  children: React.ReactNode}> = ({x, y, w, h, solid = false, depth = 34, camRotY = 0, children}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transformStyle: 'preserve-3d'}}>
    {solid ? <SolidifyV2 depth={depth} camRotY={camRotY}>{children}</SolidifyV2> : children}
  </div>
);

export type ExtrudeFace = 'front' | 'side';
export interface SideLight {warm: string; cool: string}

/**
 * EXTRUDE with a coloured wall. Same callback and same slice stack as the library. The wall facing the
 * key takes the base lit toward cream, the wall facing away takes it shaded toward violet, and the
 * occlusion at the back sinks into the base's own deep line colour rather than navy black. The first
 * slices behind the face are lit toward cream, a bevel, so the edge reads round rather than cut.
 */
export const ExtrudeV2: React.FC<{depth?: number; slices?: number; camRotY?: number; base?: string; side?: SideLight;
  render: (face: ExtrudeFace, shade: string, t: number, i: number) => React.ReactNode}> = ({
  depth = 60, slices = 10, camRotY = 0, base = '#8C99A8', side, render,
}) => {
  const sl: SideLight = side ?? {warm: light(base, 0.3), cool: shade(base, 0.45)};
  const facing = Math.max(-1, Math.min(1, camRotY / 22));
  const wall = mix(sl.warm, sl.cool, (facing + 1) / 2);
  const layers: React.ReactNode[] = [];
  for (let i = slices; i >= 1; i--) {
    const t = i / slices;
    const ao = t > 0.6 ? (t - 0.6) / 0.4 : 0;
    const bevel = t < 0.34 ? (0.34 - t) / 0.34 : 0;           // a lit bevel just behind the face rounds the edge
    const c = mix(mix(wall, line(base), ao * 0.5), light(base, 0.6), bevel * 0.85);
    layers.push(<div key={i} style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateZ(${-t * depth}px)`}}>
      {render('side', c, t, i)}
    </div>);
  }
  layers.push(<div key="front" style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{render('front', base, 0, 0)}</div>);
  return <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>{layers}</div>;
};

export const STAGE3D_V2 = ['CastShadow3DV2', 'SolidifyV2', 'CardV2', 'ExtrudeV2'] as const;
