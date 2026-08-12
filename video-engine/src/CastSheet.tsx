import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Character, CAST, castProps, SKIN} from './lib/Character';
import {RegionLight, GradeLayer, INK} from './lib/lighting';

// A contact sheet of the whole cast, for looking at. Not a scene: this is the
// review surface for Wave V3, because a typecheck says nothing about whether a
// face reads. Ten people, one frame, same light.
export const CastSheet: React.FC = () => {
  const f = useCurrentFrame();
  const cols = 5, cellW = 208, cellH = 640;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{background: '#efe7da'}}>
      <RegionLight region="cross_timbers">
        <text x={54} y={90} fontSize={46} fontWeight={700} fill={INK}
          fontFamily="Georgia, serif">The cast</text>
        <text x={54} y={130} fontSize={22} fill="#5a5a5a" fontFamily="Georgia, serif">
          Ten people, authored together, before any episode needed one.
        </text>

        {CAST.map((m, i) => {
          const cx = 22 + (i % cols) * cellW + cellW / 2;
          const cy = 210 + Math.floor(i / cols) * cellH;
          return (
            <g key={m.id}>
              <Character
                {...castProps(m.id)}
                frame={f}
                x={cx} y={cy + 430} scale={0.62}
                facing={i % 2 === 0 ? 1 : -1}
                pose={i % 3 === 0 ? 'point' : i % 3 === 1 ? 'stand' : 'hands-hips'}
                emotion={i % 4 === 0 ? 'neutral' : i % 4 === 1 ? 'wry' : i % 4 === 2 ? 'worried' : 'smug'}
              />
              <text x={cx} y={cy + 470} fontSize={18} fill={INK} textAnchor="middle"
                fontFamily="Georgia, serif" fontWeight={700}>{m.id}</text>
              <text x={cx} y={cy + 492} fontSize={13} fill="#6a6a6a" textAnchor="middle"
                fontFamily="Georgia, serif">{m.outfit} / {m.headgear}</text>
            </g>
          );
        })}

        {/* the ramp itself, so a reviewer can see it is evenly spaced */}
        <text x={54} y={1760} fontSize={20} fill={INK} fontFamily="Georgia, serif">
          The skin ramp, evenly spaced. A fill value only.
        </text>
        {SKIN.map((s, i) => (
          <rect key={s} x={54 + i * 82} y={1780} width={74} height={54} fill={s}
            stroke={INK} strokeWidth={3} />
        ))}
        <GradeLayer f={f} vignette={0.1} grain={0.03} bloom={0.06} />
      </RegionLight>
    </svg>
  );
};
