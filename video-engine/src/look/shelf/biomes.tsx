import React from 'react';
import {light, line, mix, shade} from '../color';
import {Landscape, useUid} from '../Kit';
import {LANDS, RegionBackdrop, type RegionId} from '../regions';

/**
 * BIOMES, LOOK V2 (November 14th, 2026).
 *
 * lib/biomes.tsx has one drawing, `Biome`, the full-frame backdrop of a region that a scene stands its
 * subjects in front of. Its palettes (`BIOMES`) and `ridgePath` are helpers and need no second version.
 *
 * `BiomeV2` takes the library's props and draws the region from the v2 region set in look/regions.tsx
 * (`RegionBackdrop`, lit sky and sun, soft clouds, three ridges paler with distance, the region's own
 * trees, roads and fences, a foreground sweep), so a scene that asked for a biome gets the same region
 * every v2 exterior uses. The far ridge sits where the library put it, 210 px above `groundY`, and a
 * camera truck (`camera.x`) pans the ridges at three speeds for parallax.
 *
 * `interior` keeps the region's light and sky and grows nothing, as in the library. `scraped` keeps the
 * light and the dirt and grows nothing, and marks the pad with blade arcs, ruts and a berm. `weather`
 * washes the frame toward a late sun, night, overcast, dust or a blue norther, never toward black.
 * It is HTML at the full 1080 by 1920 frame like the library's, with `children` on top.
 */
const W = 1080, H = 1920;
const REGIONS = Object.keys(LANDS) as RegionId[];
const WASH: Record<string, {c: string; o: number; blend: 'multiply' | 'soft-light' | 'normal'}> = {
  late: {c: '#ff9a4a', o: 0.42, blend: 'soft-light'},
  night: {c: '#1c2152', o: 0.62, blend: 'multiply'},
  overcast: {c: '#b6b2cc', o: 0.4, blend: 'normal'},
  dust: {c: '#d9a868', o: 0.45, blend: 'normal'},
  norther: {c: '#7f9fe0', o: 0.32, blend: 'multiply'},
};

export const BiomeV2: React.FC<{
  region: string; frame: number; camera?: {x?: number; y?: number; z?: number; rotY?: number; rotX?: number; rotZ?: number}; seed?: number;
  groundY?: number; weather?: 'norther' | 'dust' | 'overcast' | 'night' | 'late'; interior?: boolean; scraped?: boolean; children?: React.ReactNode;
}> = ({region, frame, camera = {}, seed = 1, groundY = 1290, weather, interior, scraped, children}) => {
  const id = useUid();
  const r = (REGIONS.includes(region as RegionId) ? region : 'south_texas') as RegionId;
  const land = LANDS[r];
  const horizon = groundY - 210;
  const pan = (camera.x ?? 0) + (camera.rotY ?? 0) * 12;
  const ground = scraped ? mix(land.near, '#efe2c4', 0.45) : land.near;
  const wash = weather ? WASH[weather] : undefined;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={light(ground, 0.12)} />
            <stop offset="100%" stopColor={shade(ground, 0.24)} /></linearGradient>
          <radialGradient id={`${id}-n`} cx="50%" cy="10%" r="90%"><stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="100%" stopColor="#1a1236" stopOpacity={0.25} /></radialGradient>
        </defs>
        {interior || scraped
          ? <g>
            <Landscape land={land} horizon={horizon} pan={pan} frame={frame} relief={r === 'trans_pecos' ? 1.4 : r === 'hill_country' ? 1.2 : 0.4} />
            {scraped && <g>
              <rect x={-20} y={groundY - 40} width={W + 40} height={H - groundY + 60} rx={40} fill={`url(#${id}-g)`} />
              {/* the berm of spoil at the pad's edge, the blade arcs and the truck ruts */}
              <path d={`M-40 ${groundY - 20} Q${W * 0.3} ${groundY - 70} ${W * 0.55} ${groundY - 34} Q${W * 0.8} ${groundY - 76} ${W + 40} ${groundY - 24} L${W + 40} ${groundY + 10} L-40 ${groundY + 10} Z`}
                fill={shade(ground, 0.12)} stroke={line(ground)} strokeWidth={6} strokeLinejoin="round" />
              {Array.from({length: 7}, (_, i) => {
                const gy = groundY + 60 + i * ((H - groundY) / 8);
                const bow = 26 + ((seed * 37 + i * 53) % 34);
                return <path key={i} d={`M-60 ${gy} Q${W / 2} ${gy - bow} ${W + 60} ${gy + bow * 0.3}`} stroke={light(ground, 0.35)} strokeWidth={6}
                  strokeLinecap="round" fill="none" opacity={0.6} />;
              })}
              {[0.24, 0.66].map((u, i) => <path key={u} d={`M${W * u} ${H} Q${W * u + (i ? -70 : 60)} ${groundY + 190} ${W * u + (i ? -150 : 130)} ${groundY + 46}`}
                stroke={shade(ground, 0.3)} strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.45} />)}
            </g>}
          </g>
          : <RegionBackdrop region={r} frame={frame} pan={pan} horizon={horizon} />}
        {wash && <rect x={0} y={0} width={W} height={H} fill={wash.c} opacity={wash.o} style={{mixBlendMode: wash.blend}} />}
        {weather === 'night' && Array.from({length: 40}, (_, i) => {
          const sx = (i * 241 + seed * 97) % W, sy = (i * 157 + seed * 31) % Math.max(200, horizon - 120);
          return <circle key={i} cx={sx} cy={sy} r={1.6 + (i % 3)} fill="#fff6d8" opacity={0.5 + 0.4 * Math.sin(frame / 9 + i)} />;
        })}
        {weather === 'dust' && [0, 1, 2].map((i) => <path key={i} d={`M${-200 + ((frame * (3 + i) + i * 400) % 1500)} ${horizon + 40 + i * 120} q160 -40 320 0 t320 0`}
          stroke="#f0d2a0" strokeWidth={40 + i * 10} strokeLinecap="round" fill="none" opacity={0.25} />)}
        {weather === 'norther' && [0, 1, 2, 3].map((i) => <path key={i} d={`M${W - ((frame * 9 + i * 290) % (W + 400))} ${300 + i * 210} l-180 30`}
          stroke="#ffffff" strokeWidth={6} strokeLinecap="round" opacity={0.4} />)}
        <rect x={0} y={0} width={W} height={H} fill={`url(#${id}-n)`} />
      </svg>
      {children}
    </div>
  );
};

export const BIOMES_V2 = ['BiomeV2'] as const;
