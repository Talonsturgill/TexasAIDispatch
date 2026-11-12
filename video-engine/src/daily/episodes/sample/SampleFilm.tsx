import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, castProps} from '../../../lib/Character';
import {actionProgress, actionWindows, type ActionWindow, type DirectedScene} from '../../../lib/direction';
import {entrance, POP, SNAP} from '../../../lib/motion';
import {FONT} from '../../../lib/type';
import {PlaceSubject} from '../../../modern/PlaceStage';
import type {FilmRenderProps} from '../../../modern/types';

/**
 * daily-sample: the contract, as a worked example. Copy its SHAPE, never its drawings.
 *
 * What an episode gets: `board` (the timed board), `scene` and `shot` (what is on screen now),
 * `time_s` (the film clock) and `shot_s` (seconds into this shot).
 *
 * What this one shows, because the first daily film had none of it:
 *
 *  A PERSON WHO REACTS. A lineworker from the shelf's cast is in every shot. Her pose and her face
 *    change ON the beat: she stands, then points when the box finds the fault, and worry turns wry.
 *  A FRESH HERO. The pole camera is drawn here, with thick ink outlines and a shade and a
 *    highlight on every part, so it sits beside a shelf drawing as one film.
 *  A THROUGHLINE OBJECT. The clipboard is in both shots and changes state: blank, then ticked.
 *  BEATS THAT LAND. Each board event opens a window. `entrance` springs a thing in with
 *    anticipation, overshoot and squash. Nothing pops and nothing moves linearly.
 *  A FULL FRAME. The subjects are a third to two thirds of the frame high. They stand on the
 *    county's ground through `PlaceSubject`, and no background is painted.
 *
 * The label chips, the slow camera push, the region behind the shot, the captions and the credits
 * are DailyFilm's. An episode does not draw them.
 */
const INK = '#1d1a17';
const beatFrame = (w: ActionWindow | undefined, fps: number) => (w ? Math.round(w.start * fps) : 1e9);

/** The hero, drawn fresh: a pole-mounted inspection camera. Base, shade and highlight on each part. */
const PoleCamera: React.FC<{x: number; baseY: number; scan: number; alert: number}> = ({x, baseY, scan, alert}) => (
  <g transform={`translate(${x} ${baseY})`}>
    <ellipse cx={0} cy={6} rx={70} ry={14} fill="rgba(20,16,12,.32)" />
    <rect x={-17} y={-760} width={34} height={760} fill="#6b4a2f" stroke={INK} strokeWidth={6} />
    <rect x={-17} y={-760} width={12} height={760} fill="#4f3521" opacity={0.75} />
    <rect x={7} y={-742} width={5} height={690} fill="#8a6644" opacity={0.6} />
    <rect x={-150} y={-700} width={300} height={22} rx={5} fill="#5b3f28" stroke={INK} strokeWidth={6}
      transform="rotate(-2.4)" />
    {[-128, 126].map((ix) => (
      <g key={ix} transform={`translate(${ix} -722)`}>
        <rect x={-13} y={-34} width={26} height={36} rx={7} fill="#8fb7b0" stroke={INK} strokeWidth={5} />
        <rect x={-13} y={-34} width={9} height={36} rx={4} fill="#6b938c" />
      </g>
    ))}
    {/* the cracked insulator the camera is here to find */}
    <path d="M122 -752 l8 12 -7 8 9 12" stroke={INK} strokeWidth={4} fill="none" />
    <g transform={`translate(0 -560) rotate(${-14 + scan * 28})`}>
      <rect x={-18} y={-22} width={150} height={74} rx={14} fill="#e9e3d6" stroke={INK} strokeWidth={6} />
      <rect x={-18} y={22} width={150} height={30} rx={12} fill="#c9c0ae" />
      <rect x={-6} y={-14} width={86} height={9} rx={4} fill="#fbf8f0" opacity={0.9} />
      <circle cx={132} cy={15} r={31} fill="#27323d" stroke={INK} strokeWidth={6} />
      <circle cx={132} cy={15} r={16} fill={alert > 0.5 ? '#e0563f' : '#5fb7c4'} stroke={INK} strokeWidth={4} />
      <circle cx={124} cy={7} r={6} fill="#fff" opacity={0.85} />
    </g>
    <rect x={-25} y={-548} width={50} height={30} rx={6} fill="#3d4650" stroke={INK} strokeWidth={5} />
  </g>
);

/** The throughline object. Its state is a prop, so the same drawing serves every scene. */
const Clipboard: React.FC<{x: number; y: number; ticked: number; scale?: number}> = ({x, y, ticked, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(-5)`}>
    <rect x={-74} y={-104} width={148} height={198} rx={10} fill="#b98a55" stroke={INK} strokeWidth={6} />
    <rect x={-60} y={-84} width={120} height={164} fill="#f6f0e2" stroke={INK} strokeWidth={4} />
    <rect x={-30} y={-116} width={60} height={26} rx={7} fill="#8d939a" stroke={INK} strokeWidth={5} />
    {[0, 1, 2].map((row) => (
      <g key={row} transform={`translate(-44 ${-56 + row * 46})`}>
        <rect width={26} height={26} rx={4} fill="#fff" stroke={INK} strokeWidth={4} />
        <rect x={38} y={8} width={56} height={9} rx={4} fill="#b9b2a2" />
        {row === 0 && ticked > 0 && (
          <path d="M5 13 l7 9 l13 -19" stroke="#2f8f4e" strokeWidth={7} fill="none" strokeLinecap="round"
            strokeDasharray={40} strokeDashoffset={40 * (1 - ticked)} />
        )}
      </g>
    ))}
  </g>
);

export const SampleFilm: React.FC<FilmRenderProps> = ({board, shot, time_s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const windows = actionWindows(board.scenes as DirectedScene[]);
  const progress = (id: string) => (windows[id] ? actionProgress(windows[id], time_s) : 0);
  const found = progress('s1-e1');          // the box finds the crack
  const ticked = progress('s2-e1');         // the clipboard gets its tick
  const box = entrance(frame, fps, beatFrame(windows['s1-e1'], fps), {preset: SNAP});
  const board2 = entrance(frame, fps, beatFrame(windows['s2-e1'], fps) - 6, {drop: 120, preset: POP});
  const close = shot.framing === 'close' || shot.framing === 'detail' || shot.framing === 'medium';
  const baseY = 1300;

  if (close) {
    // The second view: the same person, nearer, with the throughline object in her hand's reach.
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <PlaceSubject baseY={baseY}>
          {/* A nearer shot stands her lower, feet behind the caption band, so her face clears the
              label chip's band at the top left (y 250 to 400). A face under a chip is a lost face. */}
          <Character frame={frame} {...castProps('lineworker')} x={390} y={1700} scale={2.1} facing={1}
            pose={ticked > 0.2 ? 'hands-hips' : 'stand'} emotion={ticked > 0.5 ? 'wry' : 'worried'} seed={7} />
          {board2.on && (
            <g transform={`translate(0 ${-board2.dy})`}>
              <Clipboard x={780} y={1060} ticked={ticked} scale={1.8 * board2.scale} />
            </g>
          )}
        </PlaceSubject>
      </svg>
    );
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <PlaceSubject baseY={baseY}>
        <PoleCamera x={700} baseY={baseY} scan={found} alert={found} />
        {/* the box snaps onto the fault: anticipation, overshoot, settle */}
        {box.on && (
          <g transform={`translate(822 548) scale(${box.scale}) scale(${box.sx} ${box.sy})`}>
            <rect x={-62} y={-62} width={124} height={124} rx={10} fill="none" stroke="#e0563f" strokeWidth={10} />
            <text x={0} y={-80} textAnchor="middle" fontFamily={FONT.mono} fontWeight={700} fontSize={30}
              fill="#e0563f" stroke="#fff" strokeWidth={6} paintOrder="stroke">CRACK</text>
          </g>
        )}
        <Character frame={frame} {...castProps('lineworker')} x={330} y={baseY} scale={1.62} facing={1}
          pose={found > 0.15 ? 'point' : 'stand'} emotion={found > 0.4 ? 'shock' : 'neutral'}
          gesture={found} seed={7} />
        <Clipboard x={150} y={baseY - 120} ticked={0} scale={0.8} />
      </PlaceSubject>
    </svg>
  );
};
