import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {FONT} from './type';
import {captionLayout, creditLayout, CAPTION_BAND} from './editorial';
import {DocketMark} from '../branding/DocketMark';
import {SAFE_BOTTOM, SAFE_RIGHT} from './safearea';
import type {Cue} from '../Dispatch';

const CAP_X = CAPTION_BAND.left;

const CAP_PAD_L = CAPTION_BAND.padding;

const CAP_PAD_R = CAPTION_BAND.padding;

const CAP_W = SAFE_RIGHT - CAP_X - CAP_PAD_L - CAP_PAD_R;

const capFit = (text?: string): {lines: string[]; size: number} =>
  captionLayout(text ?? '', CAP_W);

export const SubtitleTrack: React.FC<{cues: Cue[]; fps: number}> = ({cues, fps}) => {
  const f = useCurrentFrame();
  const t = f / fps;
  const layouts = React.useMemo(() => cues.map((cue) => capFit(cue.text)), [cues]);
  const index = cues.findIndex((cue) => t >= cue.start && t < cue.end);
  if (index < 0) return null;
  const cue = cues[index];
  const {lines, size} = layouts[index];
  const lead = size * 1.23;
  const h = lines.length * lead + 20;
  const settle = interpolate((t - cue.start) * fps, [0, 6], [-6, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // The whole measured cue is visible from its first frame. No simulated word clock,
  // typewriter reveal, or fade that steals reading time from its measured boundaries.
  return (
    <div aria-label="Narration captions" style={{position: 'absolute', left: CAP_X,
      top: SAFE_BOTTOM - h + settle, width: SAFE_RIGHT - CAP_X, height: h,
      background:'rgba(8,11,18,.91)',borderLeft:'4px solid #e0956a',borderRadius:5}}>
      {lines.map((line, i) => (
        <div key={i} style={{position: 'absolute', left: CAP_PAD_L, top: 9 + i * lead,
          width: 'max-content', maxWidth: CAP_W,
          fontFamily: FONT.body, fontSize: size, fontWeight: 700,
          lineHeight: `${lead - 3}px`, whiteSpace: 'pre',
          color: '#f2ede2'}}>{line}</div>
      ))}
    </div>
  );
};

export const CreditsCard: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const CREDIT_W = SAFE_RIGHT - 78;
  const rows = React.useMemo(() => creditLayout(text, CREDIT_W, 850, SAFE_BOTTOM - 28), [text]);
  const enter = interpolate(f, [0, Math.round(fps * 0.4)], [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', inset: 0, background: '#08060f'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" aria-label="Texas AI Docket credits">
        {/* Registration rules and the flag's colour band tie the card to the publication. */}
        <path d={`M78 148H${SAFE_RIGHT}M78 817H${SAFE_RIGHT}`} stroke="#3a3040" strokeWidth={2}/>
        <path d="M78 148H205" stroke="#e0956a" strokeWidth={5}/>
        <text x={78} y={116} fontSize={22} fontFamily={FONT.mono} letterSpacing={3}
          fill="#e0956a">THE DAILY DISPATCH</text>
        <g transform={`translate(78 ${205 + (1 - enter) * 18})`} opacity={0.4 + 0.6 * enter}>
          <DocketMark/>
          <text x={0} y={220} fontFamily={FONT.display} fontWeight={700} fontSize={66}
            fill="#ede6d6">Texas AI</text>
          <text x={-5} y={364} fontFamily={FONT.display} fontWeight={700} fontSize={142}
            fill="#ede6d6">Docket</text>
        </g>
        <path d={`M78 627H${78 + CREDIT_W * enter}`} stroke="#e0956a" strokeWidth={3}/>
        <text x={78} y={704} fontSize={28} fontFamily={FONT.body} fill="#c9bece">Visit the Docket</text>
        <text x={78} y={766} fontSize={46} fontWeight={700} fontFamily={FONT.body}
          fill="#ede6d6">texasaidocket.com</text>
        <path d={`M${SAFE_RIGHT - 57} 747h44m-15 -15 15 15-15 15`}
          fill="none" stroke="#e0956a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"/>
        {rows.map((row, i) => <text key={i} x={78} y={row.y} fontSize={row.size}
          fontFamily={row.heading ? FONT.mono : FONT.body} letterSpacing={row.heading ? 3 : 0}
          fill={row.heading ? '#e0956a' : '#ede6d6'}>{row.text}</text>)}
      </svg>
    </div>
  );
};
