import React from 'react';
import {spring} from 'remotion';
import {FONT, wrapToWidth} from '../lib/type';
import type {Grade} from './tokens';
import {overshoot, snapBeat, squash} from './studio';

/**
 * THE V2 LABEL CHIP. Same job and same band as the old one (top left, y 250 to 400, so episodes
 * keep their layout), drawn as a soft rounded card: a light glass face, a coloured tab, a soft
 * drop shadow instead of a hard offset block. It springs in, tilts a degree and settles.
 */
type LabelledEvent = {at_s: number; label?: string};
type SceneLike = {start_s: number; visual_events?: unknown[]};

const Y = 262, MAX_W = 760, SIZE = 42;

export const ChipV2: React.FC<{scene: SceneLike; time: number; fps: number; grade: Grade; beats?: number[]}> = ({
  scene, time, fps, grade, beats,
}) => {
  if (beats) return <ChipStudio scene={scene} time={time} grade={grade} beats={beats} />;
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

/**
 * THE STUDIO CHIP (look/studio.tsx). The same card, but it lands on the music: its entrance snaps to
 * the nearest beat, it slams down from over size with a blur, squashes on contact and rebounds, and
 * its tab flashes once.
 */
const ChipStudio: React.FC<{scene: SceneLike; time: number; grade: Grade; beats: number[]}> = ({
  scene, time, grade, beats,
}) => {
  const events = ((scene.visual_events ?? []) as LabelledEvent[]).filter((e) => (e.label ?? '').trim())
    .map((e) => ({e, land: snapBeat(scene.start_s + e.at_s, beats)}));
  const live = events.filter((x) => x.land <= time);
  if (!live.length) return null;
  const {e: event, land} = live[live.length - 1];
  const text = String(event.label).trim().toUpperCase();
  const lines = wrapToWidth(text, MAX_W - 120, SIZE, true).slice(0, 2);
  const s = time - land;
  const p = overshoot(s, 3.4, 7.5);           // 0 -> past 1 -> 1
  const drop = Math.min(1, s / 0.1);           // the slam itself, three frames
  const sq = squash(s - 0.1, 0.18);
  const big = 1.45 - 0.45 * drop;
  const blur = Math.max(0, 1 - drop) * 10;
  const flash = Math.exp(-s / 0.12);
  return (
    <div style={{position: 'absolute', left: 56, top: Y, transformOrigin: '0 100%', maxWidth: MAX_W,
      transform: `translateY(${(1 - p) * -26}px) scale(${big * sq.sx}, ${big * sq.sy}) rotate(${(1 - p) * -6 - 1.2}deg)`,
      filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
      opacity: Math.min(1, s / 0.06), display: 'flex', alignItems: 'stretch', borderRadius: 26, overflow: 'hidden',
      boxShadow: `0 ${16 + 10 * (1 - drop)}px ${34 + 20 * (1 - drop)}px rgba(10,12,40,.38), 0 3px 8px rgba(10,12,40,.3)`}}>
      <div style={{width: 22, background: `linear-gradient(180deg, ${grade.accent} 0%, ${grade.accent2} 100%)`,
        boxShadow: flash > 0.05 ? `0 0 ${30 * flash}px ${grade.accent}` : undefined}} />
      <div style={{padding: '14px 30px 16px 24px', position: 'relative',
        background: 'linear-gradient(170deg, rgba(255,255,255,.97) 0%, rgba(240,242,255,.94) 100%)'}}>
        {lines.map((line, i) => (
          <div key={i} style={{fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE, letterSpacing: 1.2,
            lineHeight: `${SIZE + 8}px`, color: '#141634', whiteSpace: 'pre'}}>{line}</div>
        ))}
        {flash > 0.05 && <div style={{position: 'absolute', inset: 0, background: '#ffffff', opacity: 0.7 * flash}} />}
      </div>
    </div>
  );
};
