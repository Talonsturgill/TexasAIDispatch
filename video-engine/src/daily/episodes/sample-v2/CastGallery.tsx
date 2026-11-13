import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {CAST, Character, castProps, type Emotion, type Pose} from '../../../lib/Character';
import {CharacterV2, ROSTER_IDS} from '../../../look/CharacterV2';
import {lookActive} from '../../../look/tokens';

/**
 * look-v2-cast (written November 13th, 2026): the reference sheet for the cast on the v2 rig. Before
 * 5 seconds it stands the whole roster in a grid, after that one person through every old pose and
 * emotion. Under the old look the same calls draw the old rig, so one board gives the before and the
 * after. Not an edition.
 */
const POSES: Pose[] = ['stand', 'arms-crossed', 'point', 'panic', 'raise', 'carry', 'hands-hips'];
const EMOTIONS: Emotion[] = ['neutral', 'angry', 'worried', 'shock', 'smug', 'wry'];

export const CastGallery: React.FC<FilmRenderProps> = ({board, time_s}) => {
  const frame = useCurrentFrame();
  const v2 = lookActive(board as never);
  const draw = (id: string, x: number, y: number, s: number, extra: Record<string, unknown> = {}) => v2
    ? <CharacterV2 key={`${id}${x}${y}`} frame={frame} {...castProps(id)} cast={id} x={x} y={y} scale={s} {...extra} />
    : <Character key={`${id}${x}${y}`} frame={frame} {...castProps(id)} x={x} y={y} scale={s} {...extra} />;
  const label = (t: string, x: number, y: number) => <text key={`t${t}${x}${y}`} x={x} y={y} textAnchor="middle"
    fontFamily="Inter, Helvetica, Arial, sans-serif" fontWeight={700} fontSize={26} fill="#2b2440">{t}</text>;
  if (time_s < 5) {
    const ids = ROSTER_IDS.length ? ROSTER_IDS : CAST.map((c) => c.id);
    return (
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {ids.map((id, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          const x = 140 + col * 266, y = 560 + row * 400;
          return <g key={id}>{draw(id, x, y, 0.58)}{label(id, x, y + 38)}</g>;
        })}
      </svg>
    );
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      {POSES.map((pose, i) => {
        const x = 140 + (i % 4) * 266, y = 560 + Math.floor(i / 4) * 400;
        return <g key={pose}>{draw('lineworker', x, y, 0.58, {pose, gesture: 1})}{label(pose, x, y + 38)}</g>;
      })}
      {EMOTIONS.map((emotion, i) => {
        const x = 140 + ((i + 7) % 4) * 266, y = 560 + Math.floor((i + 7) / 4) * 400;
        return <g key={emotion}>{draw('executive', x, y, 0.58, {emotion})}{label(emotion, x, y + 38)}</g>;
      })}
    </svg>
  );
};
