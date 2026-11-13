import React from 'react';
import {spring} from 'remotion';
import {FONT, wrapToWidth} from '../lib/type';
import type {Grade} from './tokens';

/**
 * THE V2 LABEL CHIP. Same job and same band as the old one (top left, y 250 to 400, so episodes
 * keep their layout), drawn as a soft rounded card: a light glass face, a coloured tab, a soft
 * drop shadow instead of a hard offset block. It springs in, tilts a degree and settles.
 */
type LabelledEvent = {at_s: number; label?: string};
type SceneLike = {start_s: number; visual_events?: unknown[]};

const Y = 262, MAX_W = 760, SIZE = 42;

export const ChipV2: React.FC<{scene: SceneLike; time: number; fps: number; grade: Grade}> = ({
  scene, time, fps, grade,
}) => {
  const events = ((scene.visual_events ?? []) as LabelledEvent[]).filter((e) => (e.label ?? '').trim());
  const local = time - scene.start_s;
  const live = events.filter((e) => e.at_s <= local);
  if (!live.length) return null;
  const event = live[live.length - 1];
  const text = String(event.label).trim().toUpperCase();
  const lines = wrapToWidth(text, MAX_W - 120, SIZE, true).slice(0, 2);
  const pop = spring({frame: Math.round((local - event.at_s) * fps), fps, config: {damping: 12, stiffness: 190}});
  return (
    <div style={{position: 'absolute', left: 56, top: Y, transformOrigin: '0 50%', maxWidth: MAX_W,
      transform: `translateX(${(1 - pop) * -60}px) scale(${0.7 + 0.3 * pop}) rotate(${(1 - pop) * -5 - 1.2}deg)`,
      opacity: Math.min(1, pop * 1.8), display: 'flex', alignItems: 'stretch', borderRadius: 26, overflow: 'hidden',
      boxShadow: '0 16px 34px rgba(10,12,40,.38), 0 3px 8px rgba(10,12,40,.3)'}}>
      <div style={{width: 22, background: `linear-gradient(180deg, ${grade.accent} 0%, ${grade.accent2} 100%)`}} />
      <div style={{padding: '14px 30px 16px 24px',
        background: 'linear-gradient(170deg, rgba(255,255,255,.97) 0%, rgba(240,242,255,.94) 100%)'}}>
        {lines.map((line, i) => (
          <div key={i} style={{fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE, letterSpacing: 1.2,
            lineHeight: `${SIZE + 8}px`, color: '#141634', whiteSpace: 'pre'}}>{line}</div>
        ))}
      </div>
    </div>
  );
};
