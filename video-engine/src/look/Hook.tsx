import React from 'react';
import {interpolate, spring} from 'remotion';
import {FONT, wrapToWidth} from '../lib/type';
import type {Grade} from './tokens';

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

export const HookTitle: React.FC<{text: string; time: number; fps: number; grade: Grade}> = ({
  text, time, fps, grade,
}) => {
  if (!text.trim() || time >= HOOK_S) return null;
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
