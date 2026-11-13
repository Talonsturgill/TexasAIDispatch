import React from 'react';
import type {CharacterProps, Emotion, Headgear, Outfit, Pose} from '../lib/Character';
import {CAST} from '../lib/Character';
import {CAST_V2, Figure, type FigureEmotion, type FigureHat, type FigurePose, type FigureProps, type FigureTop} from './Figure';

/**
 * CHARACTER V2 (November 13th, 2026). The old rig's props, drawn by the v2 Figure, so an episode that
 * was written against lib/Character (pose, emotion, outfit, headgear, skin, hair, facing, walking,
 * glasses, build) gets attached limbs, lit volume and an acting face by changing one import. A cast
 * member's v2 clothes come from CAST_V2 by `cast`; anything passed explicitly still wins, because the
 * roster is a starting point. Feet stand at (x, y), as on the old rig, and `scale` keeps the old
 * rig's height, so a figure swapped in stands where the old one stood.
 */
const POSE: Record<Pose, FigurePose> = {
  stand: 'stand', 'arms-crossed': 'crossed', point: 'point', panic: 'panic', raise: 'raise', carry: 'hold',
  'hands-hips': 'hips',
};
const EMOTION: Record<Emotion, FigureEmotion> = {
  neutral: 'neutral', angry: 'angry', worried: 'worried', shock: 'surprised', smug: 'smug', wry: 'smug',
};
const TOP: Record<Outfit, FigureTop> = {
  'fr-coveralls': 'coveralls', 'line-fr': 'linefr', 'pearl-snaps': 'snap', 'work-shirt': 'snap', 'polo-badge': 'polo',
  business: 'blazer', suit: 'suit', scrubs: 'scrubs', 'hi-vis': 'hivis', apron: 'apron',
};
const HAT: Record<Headgear, FigureHat> = {
  bare: 'none', 'felt-hat': 'felt', 'straw-hat': 'straw', 'palm-straw': 'palm', 'gimme-cap': 'mesh', 'ball-cap': 'cap',
  'hard-hat': 'hardhat', 'hard-hat-hood': 'hood', 'scrub-cap': 'scrubcap',
};
const HAT_COLOR: Partial<Record<FigureHat, string>> = {
  felt: '#6b4a32', straw: '#ecc66e', palm: '#f0dba0', mesh: '#2e8b3a', cap: '#1d4ed8', hardhat: '#ffc93c', hood: '#f4f4ef',
  scrubcap: '#2fa3ad',
};
/** the old rig, feet to crown, against the v2 rig's, so `scale` means the same height on both */
const HEIGHT_RATIO = 0.98;

export type CharacterV2Props = CharacterProps & {cast?: string; v2?: Partial<FigureProps>};

export const CharacterV2: React.FC<CharacterV2Props> = (p) => {
  const roster = p.cast ? CAST_V2[p.cast] : undefined;
  if (p.cast && !roster) throw new Error(`CharacterV2: nobody in the cast is called "${p.cast}".`);
  // the roster's own clothes hold unless the scene dressed this person in something else
  const own = CAST.find((c) => c.id === p.cast);
  const fromRoster = !!roster && (!p.outfit || p.outfit === own?.outfit || TOP[p.outfit] === roster.top);
  const hatOwn = !!roster && (!p.headgear || p.headgear === own?.headgear || HAT[p.headgear] === roster.hat);
  const hat = hatOwn ? roster?.hat ?? 'none' : p.headgear ? HAT[p.headgear] : 'none';
  const top = fromRoster ? roster?.top ?? 'tee' : p.outfit ? TOP[p.outfit] : 'tee';
  const pose = POSE[p.pose ?? 'stand'];
  const props: FigureProps = {
    frame: p.frame, x: p.x ?? 0, y: p.y ?? 0, scale: (p.scale ?? 1) * HEIGHT_RATIO,
    pose, emotion: EMOTION[p.emotion ?? 'neutral'],
    skin: p.skin ?? roster?.skin, hairColor: p.hair ?? roster?.hairColor, hair: roster?.hair,
    hat, hatColor: roster?.hat === hat ? roster.hatColor : HAT_COLOR[hat],
    top, shirt: fromRoster ? roster?.shirt : undefined, pants: fromRoster ? roster?.pants : undefined,
    trim: p.trim ?? (fromRoster ? roster?.trim : undefined), glasses: p.glasses ?? roster?.glasses,
    build: p.build ?? roster?.build, turn: (p.facing ?? 1) * 0.35,
    walk: p.walking ? (p.walkPhase ?? p.frame / 30) : undefined,
    poseBlend: pose === 'point' ? Math.max(0, Math.min(1, p.gesture ?? 1)) : 1, fromPose: pose === 'point' ? 'stand' : undefined,
    seed: p.seed ?? 1 + (p.phase ?? 0),
    ...p.v2,
  };
  for (const k of Object.keys(props) as (keyof FigureProps)[]) if (props[k] === undefined) delete props[k];
  return <Figure {...props} />;
};

/** the roster ids that have both an old and a v2 drawing, in roster order */
export const ROSTER_IDS = CAST.map((c) => c.id).filter((id) => id in CAST_V2);
