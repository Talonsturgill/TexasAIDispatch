import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SAFE_BOTTOM, SAFE_RIGHT} from '../lib/safearea';
import {FONT, wrapToWidth} from '../lib/type';
import type {Grade} from './tokens';

/**
 * WORD CAPTIONS. Big, centred, one phrase at a time, and the word being said lights up.
 *
 * The old track set the whole cue at body size on a dark bar at the bottom left, which reads as a
 * transcript. Most short-form viewers watch muted at first, and the word that lights up as it is
 * spoken is what holds a muted eye on the line. Every time here is the forced alignment's: the cue
 * from `captions`, the word from `words` (written by `lean.py time` from out/dispatch/words.json).
 * No simulated word clock. With no word times the phrase still shows, unlit.
 */
export type Cue = {start: number; end: number; text: string};
export type Word = {word: string; start: number; end: number};

const SIZE = 68, LEAD = 84, LEFT = 70;
const WIDTH = SAFE_RIGHT - LEFT;   // keep clear of the feed's button rail

const tokenize = (s: string) => s.split(/\s+/).filter(Boolean);
const bare = (s: string) => s.toLowerCase().replace(/[^a-z0-9%$]/g, '');

export const WordCaptions: React.FC<{cues: Cue[]; words?: Word[]; grade: Grade}> = ({cues, words = [], grade}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const index = cues.findIndex((c) => t >= c.start && t < c.end);
  if (index < 0) return null;
  const cue = cues[index];
  const lines = wrapToWidth(cue.text, WIDTH * 0.95, SIZE, true).slice(0, 3);
  // match this cue's words to aligned word times, in order
  const inCue = words.filter((w) => w.start >= cue.start - 0.08 && w.start < cue.end + 0.02);
  let cursor = 0;
  const timed = lines.map((line) => tokenize(line).map((tok) => {
    let hit: Word | undefined;
    for (let k = cursor; k < inCue.length; k++) {
      if (bare(inCue[k].word) === bare(tok)) { hit = inCue[k]; cursor = k + 1; break; }
    }
    return {tok, hit};
  }));
  const flat = timed.flat();
  let active = -1;
  flat.forEach((w, i) => { if (w.hit && w.hit.start <= t) active = i; });
  const pop = spring({frame: Math.round((t - cue.start) * fps), fps, config: {damping: 14, stiffness: 240}});
  const h = lines.length * LEAD;
  const top = SAFE_BOTTOM - 24 - h;
  let n = -1;
  return (
    <div aria-label="Narration captions" style={{position: 'absolute', left: LEFT, width: WIDTH, top, height: h,
      transform: `translateY(${(1 - pop) * 22}px) scale(${0.94 + 0.06 * pop})`, transformOrigin: '50% 100%',
      opacity: interpolate(pop, [0, 0.4], [0, 1], {extrapolateRight: 'clamp'})}}>
      {timed.map((line, li) => (
        <div key={li} style={{display: 'flex', justifyContent: 'center', gap: 24, height: LEAD,
          alignItems: 'center'}}>
          {line.map((w) => {
            n++;
            const on = n === active;
            const since = on && w.hit ? Math.max(0, t - w.hit.start) : 1;
            const bump = on ? spring({frame: Math.round(since * fps), fps, config: {damping: 9, stiffness: 300}}) : 1;
            return (
              <span key={n} style={{position: 'relative', fontFamily: FONT.body, fontWeight: 800, fontSize: SIZE,
                lineHeight: `${LEAD}px`, letterSpacing: -0.5, whiteSpace: 'pre',
                color: on ? grade.accentInk : '#ffffff',
                transform: `scale(${on ? 1 + 0.1 * bump - 0.04 : 1}) rotate(${on ? -1.5 : 0}deg)`,
                WebkitTextStroke: on ? undefined : '11px rgba(14,14,36,.92)', paintOrder: 'stroke fill',
                textShadow: on ? 'none' : '0 7px 14px rgba(10,10,30,.45)'}}>
                {on && (
                  <span style={{position: 'absolute', left: -10, right: -10, top: 8, bottom: 6, borderRadius: 18,
                    background: `linear-gradient(160deg, ${grade.accent} 0%, ${grade.accent2} 100%)`,
                    boxShadow: '0 10px 22px rgba(0,0,0,.35)', zIndex: -1}} />
                )}
                {w.tok}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
