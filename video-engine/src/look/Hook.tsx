import React from 'react';
import {interpolate, spring} from 'remotion';
import {FONT, wrapToWidth} from '../lib/type';
import type {Grade} from './tokens';
import {overshoot, squash} from './studio';

/**
 * THE ON-SCREEN HOOK. The first frame carries the film's question in big type over the action.
 *
 * Measured November 13th, 2026: the Texas films lost half their TikTok viewers by second three. The
 * hook is the picture AND a line of type a muted thumb reads before it decides: at most eight words,
 * in the board as `hook`, sourced like every other on-screen word. It lands word by word in the
 * first half second, holds, and lifts away by HOOK_S so the film owns the frame.
 */
export const HOOK_S = 3.2;
const SIZE = 92, LEAD = 100;

export const HookTitle: React.FC<{text: string; time: number; fps: number; grade: Grade; beats?: number[]}> = ({
  text, time, fps, grade, beats,
}) => {
  if (!text.trim() || time >= HOOK_S) return null;
  if (beats) return <HookStudio text={text} time={time} fps={fps} grade={grade} beats={beats} />;
  const lines = wrapToWidth(text.trim(), 900, SIZE, true).slice(0, 3);
  const out = interpolate(time, [HOOK_S - 0.45, HOOK_S], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let n = 0;
  return (
    <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1000, opacity: 0.75 * (1 - out),
      background: 'linear-gradient(180deg, rgba(8,8,28,.55) 0%, rgba(8,8,28,.35) 55%, rgba(8,8,28,0) 100%)'}} />
    <div style={{position: 'absolute', left: 60, right: 60, top: 360, display: 'flex', flexDirection: 'column',
      alignItems: 'center', transform: `translateY(${-out * 80}px)`, opacity: 1 - out}}>
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', gap: 30, justifyContent: 'center', height: LEAD}}>
          {line.split(/\s+/).map((tok) => {
            const i = n++;
            const p = spring({frame: Math.round(time * fps) - i * 2, fps, config: {damping: 15, stiffness: 240}});
            const last = li === lines.length - 1;
            return (
              <span key={i} style={{fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE, lineHeight: `${LEAD}px`,
                letterSpacing: -2, whiteSpace: 'pre', color: last ? grade.accent : '#ffffff',
                transform: `translateY(${(1 - p) * 70}px) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2),
                WebkitTextStroke: '14px rgba(14,14,36,.92)', paintOrder: 'stroke fill',
                textShadow: '0 10px 24px rgba(10,10,35,.5)'}}>{tok}</span>
            );
          })}
        </div>
      ))}
    </div>
    </>
  );
};

/**
 * When each hook word lands. The first word is already down on frame zero, because the first frame
 * is the thumbnail and must state the stakes. The rest land on the music's grid, subdivided to the
 * step nearest 0.18 s (half beats at most tempos, quarter beats on a slow bed), so six words are
 * down inside about a second.
 */
export const hookLandings = (beats: number[], words: number): number[] => {
  // the bed's first beat can fall after the film starts, so the grid runs back to zero
  const lead = [...beats];
  while (lead.length > 1 && lead[0] > 0.05) lead.unshift(lead[0] - (lead[1] - lead[0]));
  const period = lead.length > 1 ? lead[1] - lead[0] : 0.5;
  const div = [1, 2, 3, 4].reduce((best, d) => (Math.abs(period / d - 0.18) < Math.abs(period / best - 0.18) ? d : best), 2);
  const grid: number[] = [];
  for (let i = 0; i + 1 < lead.length && grid.length < words + 2; i++) {
    for (let k = 0; k < div; k++) grid.push(lead[i] + (lead[i + 1] - lead[i]) * k / div);
  }
  const rest = grid.filter((t) => t >= 0.12);
  const out = [-0.2, ...rest].slice(0, words);
  while (out.length < words) out.push(out.length * 0.18);
  return out;
};

/**
 * THE STUDIO HOOK (look/studio.tsx). Each word SLAMS in on the beat grid: it drops from over size
 * with a blur, squashes on contact and rebounds, and the whole line kicks with a three-frame shake
 * as each word hits. The last line is in the accent colour. It lifts away by HOOK_S like before.
 */
const HookStudio: React.FC<{text: string; time: number; fps: number; grade: Grade; beats: number[]}> = ({
  text, time, fps, grade, beats,
}) => {
  const lines = wrapToWidth(text.trim(), 900, SIZE, true).slice(0, 3);
  const count = lines.reduce((m, l) => m + l.split(/\s+/).length, 0);
  const lands = hookLandings(beats, count);
  const out = interpolate(time, [HOOK_S - 0.45, HOOK_S], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let shakeX = 0, shakeY = 0;
  for (const l of lands) {
    const f = Math.floor((time - l) * fps + 1e-6);
    if (f >= 0 && f <= 2) {
      const amp = [12, 6, 3][f];
      shakeX += amp * Math.sin(l * 97 + f * 2.3);
      shakeY += amp * 0.7 * Math.cos(l * 61 + f * 1.7);
    }
  }
  let n = 0;
  return (
    <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1000, opacity: 0.75 * (1 - out),
      background: 'linear-gradient(180deg, rgba(8,8,28,.55) 0%, rgba(8,8,28,.35) 55%, rgba(8,8,28,0) 100%)'}} />
    <div style={{position: 'absolute', left: 60, right: 60, top: 360, display: 'flex', flexDirection: 'column',
      alignItems: 'center', transform: `translate(${shakeX}px, ${-out * 80 + shakeY}px)`, opacity: 1 - out}}>
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', gap: 30, justifyContent: 'center', height: LEAD}}>
          {line.split(/\s+/).map((tok) => {
            const i = n++;
            const s = time - (lands[i] ?? 0);
            if (s < 0) return <span key={i} style={{fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE,
              lineHeight: `${LEAD}px`, letterSpacing: -2, whiteSpace: 'pre', opacity: 0}}>{tok}</span>;
            const drop = Math.min(1, s / 0.08);
            const p = overshoot(s, 3.2, 8);
            const sq = squash(s - 0.08, 0.2);
            const big = 1.8 - 0.8 * drop;
            const last = li === lines.length - 1;
            return (
              <span key={i} style={{display: 'inline-block', fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE,
                lineHeight: `${LEAD}px`, letterSpacing: -2, whiteSpace: 'pre', color: last ? grade.accent : '#ffffff',
                transformOrigin: '50% 85%',
                transform: `translateY(${(1 - p) * -40}px) scale(${big * sq.sx}, ${big * sq.sy})`,
                filter: drop < 1 ? `blur(${((1 - drop) * 8).toFixed(1)}px)` : undefined,
                opacity: Math.min(1, s / 0.05),
                WebkitTextStroke: '14px rgba(14,14,36,.92)', paintOrder: 'stroke fill',
                textShadow: '0 10px 24px rgba(10,10,35,.5)'}}>{tok}</span>
            );
          })}
        </div>
      ))}
    </div>
    </>
  );
};
