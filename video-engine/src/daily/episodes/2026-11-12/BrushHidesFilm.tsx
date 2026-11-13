import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, castProps, type CharacterProps} from '../../../lib/Character';
import {actionProgress, actionWindows, type DirectedScene} from '../../../lib/direction';
import {Whitetail} from '../../../lib/fauna';
import {Mesquite} from '../../../lib/kit';
import {PostOak} from '../../../lib/flora';
import {FONT} from '../../../lib/type';
import {PlaceSubject} from '../../../modern/PlaceStage';
import type {FilmRenderProps} from '../../../modern/types';
import {AMBER, Calf, Chip, DBox, Dog, Drone, Fly, Goat, Hog, INK, Pasture, Pickup, RED, TEAL, Tablet, clamp, lerp, rnd, smooth} from './parts';

/**
 * brush-hides-1112 (2026-11-12): federal agencies demonstrated drones, cameras and AI on a Jim Wells
 * County ranch to find screwworm in livestock. The film follows ONE ranch hand and ONE object, the
 * AI detection box, which goes empty and sweeping, locks on a hog, tightens on a wound, sits empty
 * where a deer hid, shrinks to a speck under 400 million sterile flies, and ends as an arrow that
 * sends the hand out to the calf. The hand is a generic character, never a real person. Every state
 * is a function of the film clock or an event window. Disclosed illustration.
 */
const Person: React.FC<{id: string; frame: number} & Partial<CharacterProps>> = ({id, frame, ...rest}) => (
  <Character frame={frame} {...castProps(id)} {...rest} />
);

const SKY_SEPIA = (
  <filter id="sepia-f"><feColorMatrix type="matrix" values="0.39 0.77 0.19 0 0 0.35 0.69 0.17 0 0 0.27 0.53 0.13 0 0 0 0 0 1 0" /></filter>
);

export const BrushHidesFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const W = actionWindows(board.scenes as DirectedScene[]);
  const p = (id: string) => (W[id] ? actionProgress(W[id], time_s) : 0);
  const sec = (id: string) => (W[id] ? time_s - W[id].start : -1);
  void fps;
  const baseY = 1300;
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{children}</svg>
  );
  const sway = Math.sin(time_s * 1.3) * 10;
  const hand = (o: Partial<CharacterProps>) => <Person id="hand" frame={frame} seed={7} {...o} />;
  /** the hand stands left of a tablet, scaled so his face sits clear of the chip band */
  const handLeft = (emotion: CharacterProps['emotion'], pose: CharacterProps['pose'] = 'stand', gesture = 0) =>
    hand({x: 110, y: 1620, scale: 1.5, facing: 1, emotion, pose, gesture});

  switch (shot.view) {
    case 'drone-lift': {
      const e = p('s1-lift');
      const shove = smooth(clamp(e * 3 + 0.35));
      const hx = lerp(560, 470, shove) + (e < 0.7 ? Math.sin(frame * 1.4) * 5 : 0);
      const rise = smooth(clamp((e + 0.1) / 0.9));
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={110} y={baseY} scale={0.230} seed={3} />
          <Mesquite x={300} y={baseY + 8} scale={0.205} seed={8} />
          <Mesquite x={450} y={baseY} scale={0.173} seed={5} />
          <Pickup x={900} y={baseY} s={0.62} />
          {hand({x: hx, y: baseY, scale: 1.5, facing: -1, emotion: 'angry', pose: 'raise', gesture: clamp(0.6 + e)})}
          <Drone x={880 - rise * 120} y={lerp(1010, 560, rise)} scale={0.9} frame={frame} tilt={-6 * (1 - rise) + sway * 0.3} />
          {p('s1-pin') > 0 && (() => { const q = smooth(p('s1-pin')); return (
            <g transform={`translate(640 ${lerp(250, baseY - 10, q)})`}>
              <path d="M0 0 C-30 -48 -34 -88 0 -96 C34 -88 30 -48 0 0Z" fill={RED} stroke={INK} strokeWidth={6} />
              <circle cx={0} cy={-62} r={11} fill="#fff" stroke={INK} strokeWidth={3} />
            </g>); })()}
        </PlaceSubject>,
      );
    }
    case 'thorn-snag': {
      const e = p('s1-lift');
      const rise = smooth(clamp((e + 0.1) / 0.9));
      const tug = Math.sin(frame * 0.9) * 6 * (1 - clamp(e));
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={80} y={baseY} scale={0.3} seed={3} />
          <Mesquite x={980} y={baseY} scale={0.22} seed={9} />
          {hand({x: 400 + tug, y: 1700, scale: 2.0, facing: -1, emotion: shot_s > 1.2 ? 'shock' : 'angry', pose: 'raise', gesture: 0.8})}
          <path d="M-20 900 Q180 940 330 1010" stroke="#4a3a2c" strokeWidth={18} fill="none" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${60 + i * 80} ${920 + i * 22} l${10} ${-34}`} stroke="#4a3a2c" strokeWidth={8} strokeLinecap="round" />)}
          <Drone x={lerp(780, 840, rise)} y={lerp(1150, 520, rise)} scale={lerp(1.5, 1.0, rise)} frame={frame} tilt={-10 * (1 - rise)} />
          <g transform={`translate(240 ${1010 + Math.sin(shot_s * 5) * 4})`}>
            <circle r={150} fill="#d8cfb4" stroke={INK} strokeWidth={10} />
            <clipPath id="thorn-clip"><circle r={140} /></clipPath>
            <g clipPath="url(#thorn-clip)">
              <rect x={-150} y={-150} width={300} height={300} fill="#c9bf9f" />
              <path d="M-150 -40 Q-40 -70 150 20 L150 150 L-150 150Z" fill="#6f8062" stroke={INK} strokeWidth={6} />
              {[-70, -30, 10, 50].map((tx, i) => <path key={i} d={`M${tx} ${-10 + i * 6} l0 14`} stroke="#59684d" strokeWidth={5} />)}
              <path d="M-20 -10 l8 30 l16 -26 l14 24 l10 -18" stroke={INK} strokeWidth={5} fill="none" />
              <path d="M-90 120 Q-30 30 40 -10" stroke="#4a3a2c" strokeWidth={22} fill="none" strokeLinecap="round" />
              <path d="M10 6 L88 -70 L34 24Z" fill="#e8dcc0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            </g>
            <text y={190} textAnchor="middle" fontSize={34} fontWeight={800} fontFamily={FONT.mono} fill={INK} stroke="#f4ecd8" strokeWidth={8} paintOrder="stroke">SNAGGED</text>
          </g>
        </PlaceSubject>,
      );
    }
    case 'fly-swat': {
      const e = p('s1-fly');
      const land = smooth(clamp((e - 0.1) / 0.7));
      const fx = lerp(-80, 760, land) + Math.sin(e * 22) * 20 * (1 - land);
      const fy = lerp(700, 1235, land) + Math.sin(e * 17) * 40 * (1 - land);
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={900} y={baseY} scale={0.2} seed={9} />
          <Calf x={800} y={1450} s={1.0} frame={frame} wound />
          {hand({x: 330, y: 1700, scale: 1.9, facing: 1, emotion: e > 0.5 ? 'shock' : 'angry', pose: e > 0.7 ? 'point' : 'stand', gesture: clamp((e - 0.6) * 3)})}
          <Fly x={fx} y={fy} s={lerp(1.4, 0.9, land)} frame={frame} rot={lerp(10, -20, land)} />
        </PlaceSubject>,
      );
    }
    case 'sky-sweep': {
      const e = p('s2-sweep');
      const bx = lerp(130, 880, smooth(e));
      const dx = 540 + Math.sin(time_s * 0.9) * 40;
      return svg(
        <PlaceSubject baseY={baseY}>
          {[150, 330, 520, 740, 940].map((mx, i) => <Mesquite key={mx} x={mx} y={baseY + (i % 2) * 14} scale={0.16 + (i % 3) * 0.03} seed={i + 2} />)}
          <path d={`M${dx - 20} 700 L${bx - 150} ${baseY} L${bx + 150} ${baseY} L${dx + 20} 700Z`} fill={TEAL} opacity={0.16} />
          <DBox x={bx - 90} y={baseY - 220} w={180} h={200} mode="scan" frame={frame} />
          <Drone x={dx} y={600} scale={0.95} frame={frame} tilt={Math.sin(time_s) * 4} />
          {p('s2-camera') > 0 && p('s2-camera') < 1 && <circle cx={dx} cy={668} r={lerp(24, 150, p('s2-camera'))} fill="none" stroke="#fff" strokeWidth={12} opacity={1 - p('s2-camera')} />}
          {hand({x: 960, y: 1480, scale: 1.2, facing: -1, emotion: 'neutral', pose: 'stand'})}
        </PlaceSubject>,
      );
    }
    case 'hud-calf': {
      const e = p('s2-calf');
      const bw = lerp(520, 400, smooth(e));
      return svg(
        <PlaceSubject baseY={baseY}>
          {handLeft(e > 0.4 ? 'worried' : 'neutral', 'point', Math.max(e, p('s2-show')))}
          <Tablet id="calf" x={330} y={470} w={700} h={780} rot={-2} screen={
            <g>
              <Pasture x={26} y={26} w={688} h={728} seed={5} pan={sec('s2-calf')} />
              <Calf x={360} y={560} s={0.95} frame={frame} />
              {e > 0.05 && <DBox x={lerp(140, 100, smooth(e))} y={lerp(180, 230, smooth(e))} w={bw} h={340} mode={p('s2-show') > 0.2 ? 'amber' : 'lock'} q frame={frame} />}
              {p('s2-show') > 0 && p('s2-show') < 1 && <circle cx={330} cy={400} r={lerp(30, 320, p('s2-show'))} fill="none" stroke={AMBER} strokeWidth={10} opacity={1 - p('s2-show')} />}
            </g>} />
        </PlaceSubject>,
      );
    }
    case 'hud-hog': {
      const e = p('s3-hog');
      return svg(
        <PlaceSubject baseY={baseY}>
          <Tablet id="hog" x={50} y={430} w={980} h={900} rot={0} screen={
            <g>
              <Pasture x={26} y={26} w={928} h={848} seed={11} pan={sec('s3-hog')} />
              <Hog x={420} y={720} s={1.9} frame={frame} rooting />
              <DBox x={lerp(60, 150, smooth(e))} y={lerp(120, 330, smooth(e))} w={lerp(560, 400, smooth(e))} h={lerp(520, 270, smooth(e))}
                mode={e > 0.55 ? 'lock' : 'scan'} label={e > 0.55 ? 'HOG' : undefined} frame={frame} />
              {p('s3-ask') > 0 && (<g opacity={smooth(p('s3-ask') * 3)}>
                <Calf x={560} y={700} s={0.42} frame={frame} />
                <DBox x={420} y={520} w={230} h={190} mode="amber" q frame={frame} />
              </g>)}
            </g>} />
        </PlaceSubject>,
      );
    }
    case 'quote-card': {
      const e = Math.max(p('s3-quote'), 0);
      const drop = (1 - smooth(clamp(e * 2.2))) * -700;
      const bounce = e > 0.4 && e < 0.6 ? Math.sin((e - 0.4) * 30) * 6 : 0;
      const lines = ['"TAKING SOMETHING', 'THAT WORKS AND', 'APPLYING IT TO', 'SCREWWORMS"'];
      return svg(
        <g>
          <g transform={`translate(0 ${drop + bounce + 70}) rotate(-2 540 700)`}>
            <rect x={110} y={440} width={880} height={540} rx={14} fill="rgba(20,16,12,.35)" transform="translate(12 14)" />
            <rect x={110} y={440} width={880} height={540} rx={14} fill="#fbf6e8" stroke={INK} strokeWidth={9} />
            <rect x={110} y={440} width={880} height={96} rx={14} fill="#2d4a3e" stroke={INK} strokeWidth={9} />
            <text x={150} y={505} fontSize={40} fontWeight={800} fontFamily={FONT.mono} fill="#f4ecd8" letterSpacing={3}>USDA APHIS</text>
            {lines.map((l, i) => <text key={i} x={150} y={640 + i * 86} fontSize={78} fontWeight={800} fontFamily={FONT.display} fill={INK}>{l}</text>)}
            <rect x={150} y={736} width={560 * p('s3-card2')} height={12} fill={RED} />
            <text x={150} y={950} fontSize={34} fontWeight={800} fontFamily={FONT.mono} fill="#6a5a3e">MICHAEL SCHMOYER</text>
          </g>
          {hand({x: 840, y: 1790, scale: 1.2, facing: -1, emotion: e > 0.5 ? 'wry' : 'neutral', pose: 'arms-crossed'})}
        </g>,
      );
    }
    case 'tool-posse': {
      const e = p('s4-tools');
      const slots = [120, 290, 460, 630, 800];
      const names = ['CAMERA', 'INFRARED', 'NIGHT', 'HEAT', 'AI'];
      const icon = (i: number) => {
        if (i === 0) return <g><rect x={20} y={40} width={80} height={56} rx={10} fill="#3a4350" stroke={INK} strokeWidth={5} /><circle cx={60} cy={68} r={20} fill="#27323d" stroke={INK} strokeWidth={5} /><circle cx={60} cy={68} r={9} fill={TEAL} /></g>;
        if (i === 1) return <g><circle cx={60} cy={66} r={42} fill="#3d1a5e" stroke={INK} strokeWidth={5} /><circle cx={60} cy={66} r={28} fill="#d96a2e" /><circle cx={60} cy={66} r={13} fill="#ffe08a" /></g>;
        if (i === 2) return <g><rect x={14} y={50} width={38} height={44} rx={10} fill="#2f5d3a" stroke={INK} strokeWidth={5} /><rect x={68} y={50} width={38} height={44} rx={10} fill="#2f5d3a" stroke={INK} strokeWidth={5} /><circle cx={33} cy={72} r={9} fill="#9cff8a" /><circle cx={87} cy={72} r={9} fill="#9cff8a" /></g>;
        if (i === 3) return <g><rect x={50} y={26} width={20} height={74} rx={10} fill="#f4ecd8" stroke={INK} strokeWidth={5} /><circle cx={60} cy={104} r={17} fill={RED} stroke={INK} strokeWidth={5} /><rect x={55} y={52} width={10} height={50} fill={RED} /></g>;
        return <g><rect x={26} y={34} width={68} height={68} rx={10} fill="#2a2f36" stroke={INK} strokeWidth={5} /><text x={60} y={84} textAnchor="middle" fontSize={40} fontWeight={900} fontFamily={FONT.mono} fill={TEAL}>AI</text></g>;
      };
      return svg(
        <PlaceSubject baseY={baseY}>
          <Pickup x={1160} y={baseY} s={0.55} />
          {slots.map((sx, i) => {
            const q = i < 2 ? smooth(clamp(e * 2.4 - i * 0.9)) : i === 2 ? p('s4-night') : i === 3 ? p('s4-heat') : p('s4-ai');
            if (q <= 0) return null;
            const fromX = 1000, fromY = baseY - 200;
            const x = lerp(fromX, sx, q), y = lerp(fromY, baseY - 150, q) - Math.sin(q * Math.PI) * 140;
            return (
              <g key={i} transform={`translate(${x} ${y - 30}) scale(1.3)`}>
                <rect width={120} height={150} rx={12} fill="#f4ecd8" stroke={INK} strokeWidth={6} />
                {icon(i)}
                {i === 4 && <rect x={-8} y={-8} width={136} height={166} rx={16} fill="none" stroke={TEAL} strokeWidth={8} opacity={0.5 + 0.5 * Math.sin(frame / 4)} />}
                <text x={60} y={138} textAnchor="middle" fontSize={20} fontWeight={800} fontFamily={FONT.mono} fill={INK}>{names[i]}</text>
              </g>
            );
          })}
          {p('s4-dog') > 0 && <Dog x={lerp(1000, 900, smooth(p('s4-dog')))} y={baseY} s={1.25} frame={frame} facing={-1} jump={p('s4-dog')} />}
          {hand({x: 60, y: baseY + 150, scale: 1.3, facing: 1, emotion: 'neutral', pose: p('s4-ai') > 0.1 ? 'point' : 'carry', gesture: p('s4-ai')})}
        </PlaceSubject>,
      );
    }
    case 'wound-ir': {
      const e = p('s4-wound');
      const k = smooth(e);
      const look = p('s4-look');
      return svg(
        <PlaceSubject baseY={baseY}>
          <Tablet id="ir" x={50} y={430} w={980} h={900} rot={0} bg="#2a1346" screen={
            <g>
              <Pasture x={26} y={26} w={928} h={848} seed={21} ir />
              <Calf x={500} y={700} s={1.6} frame={frame} coat="#d4602f" wound />
              <circle cx={570} cy={430} r={58 + Math.sin(frame / 6) * 4} fill="#fff1a0" opacity={0.65} />
              <DBox x={lerp(60, 450, k)} y={lerp(120, 350, k)} w={lerp(760, 240, k)} h={lerp(660, 170, k)} mode="wound" label={k > 0.7 ? 'WOUND' : undefined} frame={frame} />
              {look > 0 && <circle cx={570} cy={430} r={lerp(340, 80, smooth(look))} fill="none" stroke="#fff" strokeWidth={8} opacity={0.9} />}
            </g>} />
        </PlaceSubject>,
      );
    }
    case 'tailgate-talk': {
      const e = p('s5-memory');
      const back = p('s5-back');
      const inset = smooth(clamp(e * 2.2));
      return svg(
        <PlaceSubject baseY={baseY}>
          <Pickup x={880} y={baseY} s={0.7} />
          <Person id="rancher" frame={frame} x={290} y={baseY} scale={1.6} facing={1} outfit="work-shirt" headgear="gimme-cap" age={0.85}
            emotion="angry" pose={p('s5-title') > 0.05 && p('s5-title') < 0.9 ? 'point' : 'stand'} gesture={Math.sin(clamp(p('s5-title')) * Math.PI)} talking={0.7} seed={3} />
          {inset > 0 && (
            <g transform={`translate(${510 + (1 - inset) * 260} 440) scale(${0.8 + 0.2 * inset})`} opacity={inset}>
              <defs>{SKY_SEPIA}</defs>
              <rect x={8} y={12} width={500} height={470} rx={14} fill="rgba(20,16,12,.4)" />
              <clipPath id="memclip"><rect width={500} height={470} rx={14} /></clipPath>
              <g clipPath="url(#memclip)">
                <g filter="url(#sepia-f)">
                  <rect width={500} height={470} fill="#cfd6a4" />
                  <rect y={300} width={500} height={170} fill="#8d9a55" />
                  <PostOak x={380} y={330} scale={1.5} seed={2} />
                  {[0, 1, 2].map((i) => <rect key={i} x={0} y={310 + i * 34} width={500} height={9} fill="#8a6a44" stroke={INK} strokeWidth={3} />)}
                  {[40, 190, 340, 470].map((fx) => <rect key={fx} x={fx} y={280} width={12} height={150} fill="#6d5233" stroke={INK} strokeWidth={4} />)}
                  <Calf x={250} y={440} s={0.62} frame={frame} />
                  <Person id="hand" frame={frame} x={90} y={450} scale={0.42} facing={1} age={0} build={0.3} emotion="neutral" pose="point" gesture={0.8} seed={4} />
                </g>
                <rect width={500} height={470} fill={RED} opacity={0.28 * back} />
              </g>
              <rect width={500} height={470} rx={14} fill="none" stroke={INK} strokeWidth={8} />
              {p('s5-wilson') > 0 && (() => { const q = smooth(p('s5-wilson')); return (
                <g transform={`translate(110 ${lerp(-120, 150, q)})`}>
                  <path d="M0 0 C-30 -48 -34 -88 0 -96 C34 -88 30 -48 0 0Z" fill={RED} stroke={INK} strokeWidth={6} />
                  <circle cx={0} cy={-62} r={11} fill="#fff" stroke={INK} strokeWidth={3} />
                </g>); })()}
              {back > 0.05 && <g transform={`translate(250 250) rotate(-12) scale(${1.9 - 0.9 * smooth(clamp(back * 3))})`} opacity={clamp(back * 4)}>
                <rect x={-210} y={-62} width={420} height={110} fill="none" stroke={RED} strokeWidth={14} />
                <text x={0} y={30} textAnchor="middle" fontSize={92} fontWeight={900} fontFamily={FONT.display} fill={RED}>IT'S BACK</text>
              </g>}
            </g>
          )}
        </PlaceSubject>,
      );
    }
    case 'memory-full': {
      const e = p('s5-memory');
      const back = p('s5-back');
      const k = smooth(clamp(e * 2));
      return svg(
        <PlaceSubject baseY={baseY}>
          <g transform={`translate(${540} ${900}) scale(${1.65 * (0.6 + 0.4 * k)}) translate(-250 -235)`} opacity={k}>
            <defs>{SKY_SEPIA}</defs>
            <rect x={8} y={12} width={500} height={470} rx={14} fill="rgba(20,16,12,.4)" />
            <clipPath id="memclip2"><rect width={500} height={470} rx={14} /></clipPath>
            <g clipPath="url(#memclip2)">
              <g filter="url(#sepia-f)">
                <rect width={500} height={470} fill="#cfd6a4" />
                <rect y={300} width={500} height={170} fill="#8d9a55" />
                <PostOak x={380} y={330} scale={1.5} seed={2} />
                {[0, 1, 2].map((i) => <rect key={i} x={0} y={310 + i * 34} width={500} height={9} fill="#8a6a44" stroke={INK} strokeWidth={3} />)}
                {[40, 190, 340, 470].map((fx) => <rect key={fx} x={fx} y={280} width={12} height={150} fill="#6d5233" stroke={INK} strokeWidth={4} />)}
                <Calf x={260} y={440} s={0.66} frame={frame} head={0.4 * Math.sin(sec('s5-memory') * 2)} />
                <Person id="hand" frame={frame} x={110 + Math.sin(sec('s5-memory')) * 8} y={452} scale={0.44} facing={1} age={0} build={0.3} emotion="neutral" pose="point" gesture={0.4 + 0.4 * Math.sin(sec('s5-memory') * 3)} seed={4} />
              </g>
              <rect width={500} height={470} fill={RED} opacity={0.28 * back} />
            </g>
            <rect width={500} height={470} rx={14} fill="none" stroke={INK} strokeWidth={8} />
            {p('s5-wilson') > 0 && (() => { const q = smooth(p('s5-wilson')); return (
              <g transform={`translate(110 ${lerp(-120, 150, q)})`}>
                <path d="M0 0 C-30 -48 -34 -88 0 -96 C34 -88 30 -48 0 0Z" fill={RED} stroke={INK} strokeWidth={6} />
                <circle cx={0} cy={-62} r={11} fill="#fff" stroke={INK} strokeWidth={3} />
              </g>); })()}
          </g>
          {back > 0.05 && <g transform={`translate(540 760) rotate(-12) scale(${1.9 - 0.9 * smooth(clamp(back * 3))})`} opacity={clamp(back * 4)}>
            <rect x={-300} y={-80} width={600} height={130} fill="rgba(250,240,220,.55)" stroke={RED} strokeWidth={14} />
            <text x={0} y={30} textAnchor="middle" fontSize={110} fontWeight={900} fontFamily={FONT.display} fill={RED}>IT'S BACK</text>
          </g>}
        </PlaceSubject>,
      );
    }
    case 'hand-react': {
      const back = p('s5-back');
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={140} y={baseY} scale={0.256} seed={6} />
          <Mesquite x={960} y={baseY} scale={0.218} seed={12} />
          <Person id="rancher" frame={frame} x={540} y={1720} scale={2.1} facing={1} outfit="work-shirt" headgear="gimme-cap" age={0.85} emotion="shock" pose="stand" talking={0.5} seed={3} />
          {back > 0.02 && <g transform={`translate(540 1250) rotate(-9) scale(${1.6 - 0.6 * smooth(clamp(back * 4))})`} opacity={clamp(back * 6)}><rect x={-330} y={-96} width={660} height={140} fill="rgba(250,240,220,.7)" stroke={RED} strokeWidth={14} /><text x={0} y={22} textAnchor="middle" fontSize={112} fontWeight={900} fontFamily={FONT.display} fill={RED}>IT'S BACK</text></g>}
          <rect x={0} y={0} width={1080} height={1920} fill={RED} opacity={0.14 * back} />
        </PlaceSubject>,
      );
    }
    case 'map-cases': {
      const k = 80;
      const pt = (lon: number, lat: number): [number, number] => [90 + (lon + 107) * k * 0.857, 470 + (36.6 - lat) * k];
      const outline: [number, number][] = [[-106.6, 31.8], [-106.5, 32.0], [-103.06, 32.0], [-103.04, 36.5], [-100.0, 36.5], [-100.0, 34.56], [-99.2, 34.2], [-98.4, 34.1],
        [-97.2, 33.85], [-95.3, 33.9], [-94.5, 33.65], [-94.04, 33.55], [-94.04, 31.99], [-93.7, 31.0], [-93.55, 30.3], [-93.85, 29.7], [-94.7, 29.35], [-95.9, 28.6],
        [-97.0, 27.8], [-97.4, 26.9], [-97.15, 25.95], [-98.3, 26.1], [-99.1, 26.4], [-99.5, 27.5], [-100.3, 28.3], [-100.95, 29.35], [-101.4, 29.8], [-102.4, 29.75],
        [-102.7, 29.7], [-103.2, 29.0], [-104.5, 29.65], [-104.9, 30.6]];
      const d = outline.map(([lo, la], i) => `${i ? 'L' : 'M'}${pt(lo, la).join(' ')}`).join(' ') + 'Z';
      const pins: [string, number, number][] = [['ZAVALA', -99.76, 28.87], ['LA SALLE', -99.1, 28.35], ['GILLESPIE', -98.95, 30.32]];
      const [jx, jy] = pt(-98.09, 27.73);
      return svg(
        <g>
          <path d={d} fill="#d9c9a0" stroke={INK} strokeWidth={8} strokeLinejoin="round" transform="translate(8 10)" opacity={0.35} />
          <path d={d} fill="#e6d6ac" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <circle cx={jx} cy={jy} r={16} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="8 6" />
          <text x={jx - 24} y={jy + 44} textAnchor="end" fontSize={26} fontWeight={800} fontFamily={FONT.mono} fill="#6a5a3e">JIM WELLS</text>
          {pins.map(([n, lo, la], i) => {
            const q = smooth(p(['s6-zavala', 's6-lasalle', 's6-gillespie'][i]));
            if (q <= 0) return null;
            const [px, py] = pt(lo, la);
            const pop = q < 1 ? 0.35 + 0.65 * q : 1;
            return (
              <g key={n} transform={`translate(${px} ${py}) scale(${pop})`} opacity={clamp(q * 3)}>
                <path d="M0 0 C-30 -48 -34 -88 0 -96 C34 -88 30 -48 0 0Z" fill={RED} stroke={INK} strokeWidth={6} />
                <circle cx={0} cy={-62} r={11} fill="#fff" stroke={INK} strokeWidth={3} />
                <text x={i === 2 ? -44 : i === 0 ? -44 : 40} y={i === 2 ? -4 : -30} textAnchor={i === 1 ? 'start' : 'end'} fontSize={28} fontWeight={800} fontFamily={FONT.mono} fill={INK} stroke="#e6d6ac" strokeWidth={6} paintOrder="stroke">{n}</text>
              </g>
            );
          })}
          {p('s6-date') > 0 && (() => { const q = smooth(clamp(p('s6-date') * 2.5)); return (
            <g transform={`translate(300 1230) rotate(-8) scale(${2 - q})`} opacity={q}>
              <rect x={-190} y={-50} width={380} height={80} fill="none" stroke={RED} strokeWidth={9} />
              <text x={0} y={8} textAnchor="middle" fontSize={46} fontWeight={900} fontFamily={FONT.mono} fill={RED}>SPECTRUM NEWS</text>
            </g>); })()}
        </g>,
      );
    }
    case 'tagged-row': {
      const e = p('s6-animals');
      const q = (i: number) => smooth(clamp(e * 12 + 1.6 - i * 0.5));
      return svg(
        <PlaceSubject baseY={baseY}>
          {hand({x: 70, y: baseY + 240, scale: 1.25, facing: 1, emotion: e > 0.6 ? 'shock' : 'angry', pose: 'hands-hips'})}
          <g transform={`translate(${(1 - q(0)) * 500} 0)`} opacity={q(0)}><Calf x={330} y={baseY - 40} s={0.7} frame={frame} tag /></g>
          <g transform={`translate(${(1 - q(1)) * 500} 0)`} opacity={q(1)}><Goat x={600} y={baseY - 30} s={1.0} tag /></g>
          <g transform={`translate(${(1 - q(2)) * 500} 0)`} opacity={q(2)}><Dog x={860} y={baseY - 20} s={1.1} frame={frame} facing={-1} tag /></g>
        </PlaceSubject>,
      );
    }
    case 'deer-canopy': {
      const e = p('s7-deer');
      const dx = lerp(800, 330, smooth(e));
      const sweepX = 740 + Math.sin(time_s * 1.4) * 150;
      return svg(
        <PlaceSubject baseY={baseY}>
          <Whitetail x={dx} y={baseY + 80} scale={1.3} frame={frame} facing={-1} flagging={e > 0.7} southTexas />
          <Mesquite x={110} y={baseY + 6} scale={0.250} seed={14} />
          <Mesquite x={300} y={baseY + 14} scale={0.262} seed={2} />
          <Mesquite x={480} y={baseY + 4} scale={0.224} seed={7} />
          <path d={`M700 520 L${sweepX - 110} ${baseY} L${sweepX + 110} ${baseY} L720 520Z`} fill={TEAL} opacity={0.14} />
          {p('s7-hog') > 0 && <Hog x={lerp(1250, 800, smooth(p('s7-hog')))} y={baseY + 10} s={0.85} frame={frame} facing={-1} />}
          <DBox x={sweepX - 80} y={baseY - 190} w={160} h={180} mode="scan" frame={frame} />
          <Drone x={710} y={440} scale={0.85} frame={frame} tilt={Math.sin(time_s) * 3} />
          {hand({x: 930, y: 1500, scale: 1.2, facing: -1, emotion: 'worried', pose: 'stand'})}
        </PlaceSubject>,
      );
    }
    case 'empty-box': {
      const e = p('s7-empty');
      const down = smooth(e) * 330;
      return svg(
        <PlaceSubject baseY={baseY}>
          {hand({x: 170, y: 1620 + down * 0.3, scale: 1.55, facing: 1, emotion: e > 0.5 ? 'worried' : 'neutral', pose: 'stand'})}
          <g transform={`translate(0 ${down})`}>
            <Tablet id="empty" x={330} y={470} w={700} h={780} rot={-3 * smooth(e)} screen={
              <g>
                <Pasture x={26} y={26} w={688} h={728} seed={31} />
                <ellipse cx={260} cy={330} rx={250} ry={160} fill="#2f4421" stroke="#1d2a14" strokeWidth={6} />
                <ellipse cx={230} cy={290} rx={150} ry={80} fill="#4b6a33" opacity={0.8} />
                <g opacity={1 - 0.85 * smooth(e) * (Math.sin(frame * 1.7) > 0 ? 1 : 0.5)}>
                  <DBox x={420} y={300} w={230} h={240} mode="empty" frame={frame} />
                </g>
              </g>} />
          </g>
        </PlaceSubject>,
      );
    }
    case 'drone-settle': {
      const e = p('s8-box');
      const k = smooth(e);
      const bs = lerp(300, 54, k);
      return svg(
        <PlaceSubject baseY={baseY}>
          <Pickup x={760} y={baseY + 40} s={1.0} />
          {[90, 220, 350].map((cx, i) => (
            <g key={cx} transform={`translate(${cx} ${baseY - 150})`}>
              <rect width={120} height={150} rx={12} fill="#f4ecd8" stroke={INK} strokeWidth={6} />
              <circle cx={60} cy={66} r={24 + i * 4} fill={['#3a4350', '#d96a2e', '#2f5d3a'][i]} stroke={INK} strokeWidth={5} />
            </g>
          ))}
          {p('s8-weapon') > 0 && (() => { const q = smooth(p('s8-weapon')); return (
            <g transform={`translate(${lerp(1120, 650, q)} ${baseY - 190}) rotate(${Math.sin(q * 12) * 4 * (1 - q)})`}>
              <rect width={120} height={90} fill="#c89a5e" stroke={INK} strokeWidth={6} />
              <rect y={0} width={120} height={22} fill="#b3844c" stroke={INK} strokeWidth={5} />
              <path d="M30 50 h60 M30 66 h40" stroke={INK} strokeWidth={5} />
            </g>); })()}
          <Drone x={lerp(520, 780, k)} y={lerp(640, 1060, k)} scale={lerp(1, 0.85, k)} frame={frame} landed={e > 0.97} />
          <DBox x={lerp(520, 780, k) - bs / 2} y={lerp(260, 820, k)} w={bs} h={bs} mode="lock" frame={frame} />
          {hand({x: 110, y: baseY + 300, scale: 1.25, facing: 1, emotion: e > 0.6 ? 'wry' : 'neutral', pose: 'stand'})}
        </PlaceSubject>,
      );
    }
    case 'fly-box': {
      const e = p('s8-flies');
      const N = 80;
      return svg(
        <PlaceSubject baseY={baseY}>
          <Person id="engineer" frame={frame} x={170} y={1700} scale={1.85} facing={1} emotion={e > 0.3 ? 'wry' : 'neutral'} pose="stand" seed={5} />
          <g transform="translate(360 1180)">
            <rect x={0} y={80} width={420} height={250} fill="#c89a5e" stroke={INK} strokeWidth={8} />
            <rect x={0} y={80} width={420} height={44} fill="#b3844c" stroke={INK} strokeWidth={6} />
            <rect x={150} y={150} width={120} height={70} fill="#f4ecd8" stroke={INK} strokeWidth={4} />
            <path d="M175 168 h70 M175 186 h50" stroke={INK} strokeWidth={5} />
            <g transform={`rotate(${-12 - smooth(e) * 72} 0 80)`}><rect x={-6} y={50} width={214} height={34} fill="#d3a56a" stroke={INK} strokeWidth={7} /></g>
            <g transform={`rotate(${12 + smooth(e) * 72} 420 80)`}><rect x={212} y={50} width={214} height={34} fill="#d3a56a" stroke={INK} strokeWidth={7} /></g>
          </g>
          {Array.from({length: N}, (_, i) => {
            const t0 = (i / N) * 0.75;
            const q = clamp((e - t0) / 0.55);
            if (q <= 0) return null;
            const x = 570 + (rnd(i + 5, 2) - 0.5) * 520 * q + Math.sin(frame / 5 + i) * 18;
            const y = 1220 - q * (700 + rnd(i + 6, 4) * 420);
            return <Fly key={i} x={x} y={y} s={0.34 + rnd(7, i) * 0.14} frame={frame + i * 3} rot={-70 + (rnd(8, i) - 0.5) * 50} />;
          })}
        </PlaceSubject>,
      );
    }
    case 'swarm-sky': {
      const e = p('s9-swarm');
      const k = smooth(e);
      const N = 300;
      const count = Math.floor(N * k);
      const value = '400 MILLION';
      return svg(
        <PlaceSubject baseY={baseY}>
          <rect x={0} y={0} width={1080} height={1920} fill="#10202a" opacity={0.38 * k} />
          {Array.from({length: count}, (_, i) => {
            const x = rnd(i + 101, 3) * 1120 - 20 + Math.sin(time_s * 2 + i) * 14;
            const y = 260 + rnd(i + 977, 9) * 1000 + Math.cos(time_s * 1.7 + i * 1.3) * 12;
            return <Fly key={i} x={x} y={y} s={0.18 + rnd(i + 31, 5) * 0.12} frame={frame + i} rot={-60 + (rnd(i + 57, 7) - 0.5) * 80} />;
          })}
          <g transform={`translate(700 700)`}>
            <Drone x={0} y={0} scale={lerp(0.9, 0.22, k)} frame={frame} />
            <DBox x={-lerp(220, 24, k)} y={-lerp(160, 20, k)} w={lerp(440, 48, k)} h={lerp(320, 40, k)} mode="lock" frame={frame} size={18} />
          </g>
          {p('s9-2027') > 0 && (() => { const q = smooth(clamp(p('s9-2027') * 2.2)); return (
            <text x={820} y={930} textAnchor="middle" fontSize={150} fontWeight={900} fontFamily={FONT.mono} fill={RED} stroke="#f4ecd8" strokeWidth={12} paintOrder="stroke"
              transform={`rotate(-7 820 900) scale(${1}) translate(0 ${(1 - q) * -120})`} opacity={q}>2027</text>); })()}
          <text x={660} y={1060} textAnchor="middle" fontSize={96} fontWeight={900} fontFamily={FONT.mono} fill="#f4ecd8" stroke={INK} strokeWidth={14} paintOrder="stroke" opacity={smooth(clamp(e * 4))}>{value}</text>
          <text x={660} y={1130} textAnchor="middle" fontSize={36} fontWeight={800} fontFamily={FONT.mono} fill="#f4ecd8" stroke={INK} strokeWidth={9} paintOrder="stroke" opacity={smooth(clamp(e * 4))}>STERILE FLIES IN 2027</text>
          {hand({x: 200, y: 1760, scale: 1.8, facing: 1, emotion: k > 0.4 ? 'shock' : 'neutral', pose: 'stand'})}
        </PlaceSubject>,
      );
    }
    case 'plant-edinburg': {
      const e = p('s9-plant');
      const k = smooth(e);
      return svg(
        <PlaceSubject baseY={baseY}>
          <g>
            <rect x={40} y={baseY - 380} width={1000} height={380} fill="#d9d4c4" stroke={INK} strokeWidth={8} />
            <rect x={30} y={baseY - 410} width={1020} height={36} fill="#7d8a93" stroke={INK} strokeWidth={8} />
            {[0, 1, 2, 3].map((i) => <rect key={i} x={110 + i * 230} y={baseY - 230} width={170} height={230} fill="#4a4540" stroke={INK} strokeWidth={6} />)}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={90 + i * 140} y={baseY - 330} width={90} height={46} fill="#9fc6cf" stroke={INK} strokeWidth={5} />)}
            <rect x={740} y={baseY - 600} width={120} height={200} fill="#c2bdae" stroke={INK} strokeWidth={8} />
            <text x={540} y={baseY - 340 + 0} textAnchor="middle" fontSize={0} fill={INK}>.</text>
          </g>
          <g transform={`translate(190 ${baseY - 420})`}>
            <clipPath id="banner-clip"><rect x={0} y={0} width={700} height={260 * k + 1} /></clipPath>
            <g clipPath="url(#banner-clip)">
              <rect x={0} y={0} width={700} height={260} fill="#f4ecd8" stroke={INK} strokeWidth={8} />
              <text x={350} y={90} textAnchor="middle" fontSize={50} fontWeight={900} fontFamily={FONT.display} fill={INK}>STERILE FLY PLANT</text>
              <text x={350} y={160} textAnchor="middle" fontSize={44} fontWeight={800} fontFamily={FONT.mono} fill={RED}>EXPECTED EARLY 2027</text>
              <text x={350} y={218} textAnchor="middle" fontSize={32} fontWeight={800} fontFamily={FONT.mono} fill="#6a5a3e">AS OF JUNE</text>
            </g>
          </g>
          <Person id="engineer" frame={frame} x={960} y={baseY + 260} scale={1.3} facing={-1} emotion="neutral" pose="stand" seed={5} />
        </PlaceSubject>,
      );
    }
    case 'cbp-deal': {
      const e = p('s10-deal');
      const k = smooth(e);
      const stamp = smooth(clamp((e - 0.35) * 2.4));
      return svg(
        <PlaceSubject baseY={baseY}>
          <Drone x={330} y={540} scale={0.8} frame={frame} tilt={Math.sin(time_s) * 3} />
          <Drone x={lerp(1350, 800, k)} y={460 + Math.sin(time_s * 1.2) * 14} scale={0.8} frame={frame} lens={AMBER} tilt={-8 * (1 - k)} />
          {p('s10-ai') > 0 && <g transform={`translate(${lerp(1350, 800, k)} 620)`} opacity={smooth(p('s10-ai') * 3)}><Chip x={0} y={0} text="AI" fill={AMBER} size={44} /></g>}
          {p('s10-kr') > 0 && <g transform={`translate(${lerp(1200, 0, smooth(p('s10-kr')))} 0)`}><rect x={0} y={1450} width={1080} height={70} fill="#1d1a17" /><text x={30} y={1500} fontSize={40} fontWeight={800} fontFamily={FONT.mono} fill="#f4ecd8">KRGV NEWS  USDA AND CBP DRONES  AI FLAGS ANIMALS</text></g>}
          <Person id="executive" frame={frame} x={260} y={1330} scale={1.45} facing={1} emotion={stamp > 0.8 ? 'smug' : 'neutral'} pose={stamp > 0.2 ? 'raise' : 'stand'} gesture={stamp} seed={2} />
          <rect x={40} y={1210} width={1000} height={44} fill="#8a6a44" stroke={INK} strokeWidth={8} />
          <rect x={80} y={1254} width={34} height={140} fill="#6d5233" stroke={INK} strokeWidth={6} />
          <rect x={970} y={1254} width={34} height={140} fill="#6d5233" stroke={INK} strokeWidth={6} />
          <g transform="translate(500 1100) rotate(-3)">
            <rect width={340} height={110} fill="#fbf6e8" stroke={INK} strokeWidth={6} />
            <rect x={20} y={18} width={120} height={34} fill="#2d4a3e" /><text x={80} y={44} textAnchor="middle" fontSize={22} fontWeight={800} fontFamily={FONT.mono} fill="#f4ecd8">USDA</text>
            <rect x={200} y={18} width={120} height={34} fill="#2f4a63" /><text x={260} y={44} textAnchor="middle" fontSize={22} fontWeight={800} fontFamily={FONT.mono} fill="#f4ecd8">CBP</text>
            <path d="M20 76 h300 M20 94 h220" stroke="#b9b2a2" strokeWidth={6} />
            <path d={`M130 70 l22 24 l50 -62`} stroke="#2f8f4e" strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray={160} strokeDashoffset={160 * (1 - stamp)} />
          </g>
          <g transform={`translate(480 ${lerp(760, 1030, stamp)})`}>
            <rect x={-30} y={-80} width={60} height={110} rx={10} fill="#a8322a" stroke={INK} strokeWidth={6} />
            <rect x={-60} y={30} width={120} height={32} rx={8} fill="#7d251f" stroke={INK} strokeWidth={6} />
          </g>
        </PlaceSubject>,
      );
    }
    case 'hud-herd': {
      const e = p('s10-herd');
      const herd: [number, number, number][] = [[110, 360, 0.5], [270, 330, 0.46], [440, 420, 0.55], [140, 560, 0.62], [330, 590, 0.58], [520, 540, 0.5]];
      return svg(
        <PlaceSubject baseY={baseY}>
          {handLeft('neutral', 'point', e)}
          <Tablet id="herd" x={330} y={470} w={700} h={780} rot={1} screen={
            <g>
              <Pasture x={26} y={26} w={688} h={728} seed={41} />
              {herd.map(([cx, cy, s], i) => <Calf key={i} x={cx + 20} y={cy + 100} s={s * 0.8} frame={frame + i * 5} facing={i % 2 ? -1 : 1} />)}
              {[0, 1, 2].map((i) => {
                const q = smooth(clamp(e * 3.4 - i * 0.7));
                if (q <= 0) return null;
                const [cx, cy, s] = herd[[0, 2, 4][i]];
                return <DBox key={i} x={cx - 60} y={cy - 110} w={230 * s * 1.6} h={190 * s * 1.6} mode={i === 1 ? 'amber' : 'lock'} q={i === 1} frame={frame} />;
              })}
            </g>} />
        </PlaceSubject>,
      );
    }
    case 'pen-walk': {
      const e = p('s11-pen');
      const hx = lerp(160, 470, smooth(e));
      return svg(
        <PlaceSubject baseY={baseY}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i * 180 - 20} y={baseY - 190} width={16} height={196} fill="#6d5233" stroke={INK} strokeWidth={5} />)}
          {[0, 1, 2].map((i) => <rect key={i} x={-20} y={baseY - 170 + i * 56} width={1160} height={11} fill="#8a6a44" stroke={INK} strokeWidth={4} />)}
          <g transform={`rotate(${-20 + smooth(e) * 92} 20 ${baseY - 110})`}><rect x={20} y={baseY - 130} width={170} height={12} fill="#a07a50" stroke={INK} strokeWidth={5} /><rect x={20} y={baseY - 78} width={170} height={12} fill="#a07a50" stroke={INK} strokeWidth={5} /></g>
          {[0, 1, 2].map((i) => <Calf key={i} x={lerp(520, 840, smooth(e)) + i * 150 - 100} y={baseY - 70 + (i % 2) * 24} s={0.62} frame={frame + i * 7} facing={1} />)}
          {hand({x: hx, y: baseY + 90, scale: 1.55, facing: 1, emotion: 'neutral', pose: 'stand', walking: true, walkPhase: time_s * 3.2})}
        </PlaceSubject>,
      );
    }
    case 'hide-check': {
      const e = p('s11-check');
      const k = smooth(e);
      const skin = (castProps('hand').skin as string) ?? '#c98f65';
      return svg(
        <PlaceSubject baseY={baseY}>
          {hand({x: 230, y: 1760, scale: 2.1, facing: 1, emotion: 'worried', pose: 'point', gesture: k})}
          <g transform="translate(0 0)">
            <Calf x={760} y={1560} s={2.7} frame={frame} />
            <ellipse cx={760} cy={1180} rx={110 * k} ry={80 * k} fill="#e2b7a0" stroke={INK} strokeWidth={6} opacity={k > 0.02 ? 1 : 0} />
            <path d={`M${680 - 0 * k} 1180 q${80 * k} ${-60 * k} ${160 * k} 0`} stroke="#c78b78" strokeWidth={6} fill="none" />
            {/* the palm parting the hide */}
            <g transform={`translate(${lerp(560, 760, k)} ${lerp(1380, 1230, k)}) rotate(-24)`}>
              <ellipse cx={0} cy={0} rx={88} ry={64} fill={skin} stroke={INK} strokeWidth={8} />
              {[-60, -22, 18, 56].map((fx, i) => <rect key={i} x={fx - 15} y={-120 + (i === 1 || i === 2 ? -14 : 0)} width={30} height={82} rx={15} fill={skin} stroke={INK} strokeWidth={7} />)}
              <rect x={-132} y={-12} width={64} height={28} rx={14} fill={skin} stroke={INK} strokeWidth={7} transform="rotate(-24 -100 0)" />
            </g>
          </g>
        </PlaceSubject>,
      );
    }
    case 'arrow-point': {
      const e = p('s12-arrow');
      const k = smooth(e);
      const dx = 560;
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={960} y={baseY} scale={0.218} seed={3} />
          <Calf x={800} y={baseY + 20} s={0.78} frame={frame} />
          {hand({x: 210, y: baseY + 150, scale: 1.55, facing: 1, emotion: k > 0.7 ? 'wry' : 'neutral', pose: 'point', gesture: k})}
          <Drone x={dx} y={560} scale={0.9} frame={frame} tilt={4 + sway * 0.2} />
          <g opacity={1 - k}><DBox x={dx - 140} y={760} w={280} h={200} mode="lock" frame={frame} /></g>
          <g opacity={k} transform={`translate(${dx} 700)`}>
            <path d={`M0 0 Q${120 * k} ${160 * k} ${(800 - dx) * k + 0} ${(baseY - 330 - 700) * k + 130 * k}`} stroke={RED} strokeWidth={18} fill="none" strokeLinecap="round" strokeDasharray="1 0" />
            <g transform={`translate(${(800 - dx) * k} ${(baseY - 330 - 700) * k + 130 * k}) rotate(${70 + 20 * (1 - k)})`}>
              <path d="M0 -44 L38 22 L-38 22Z" fill={RED} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            </g>
          </g>
        </PlaceSubject>,
      );
    }
    case 'kneel-calf': {
      const e = p('s12-kneel');
      const k = smooth(e);
      const hx = lerp(-80, 330, smooth(clamp(e * 1.6)));
      const kn = smooth(clamp((e - 0.55) / 0.45));
      return svg(
        <PlaceSubject baseY={baseY}>
          <Calf x={760} y={baseY + 60} s={1.0} frame={frame} head={0.5 * k} />
          <Drone x={720} y={430} scale={0.55} frame={frame} />
          <g transform={`translate(720 560)`}>
            <path d="M0 0 L0 210" stroke={RED} strokeWidth={14} strokeLinecap="round" />
            <path d="M0 250 L34 196 L-34 196Z" fill={RED} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          </g>
          {kn > 0.05 && (() => { const skin = (castProps('hand').skin as string) ?? '#c98f65'; return (
            <g transform={`translate(${lerp(560, 740, kn)} ${lerp(1260, 1170, kn)}) rotate(-24) scale(0.62)`}>
              <ellipse cx={0} cy={0} rx={88} ry={64} fill={skin} stroke={INK} strokeWidth={8} />
              {[-60, -22, 18, 56].map((fx, i) => <rect key={i} x={fx - 15} y={-120 + (i === 1 || i === 2 ? -14 : 0)} width={30} height={82} rx={15} fill={skin} stroke={INK} strokeWidth={7} />)}
            </g>); })()}
          <g transform={`translate(${hx} ${1700 + kn * 130}) scale(1 ${1 - 0.2 * kn}) translate(${-hx} ${-1700})`}>
            {hand({x: hx, y: 1700, scale: 1.9, facing: 1, emotion: 'neutral', pose: kn > 0.3 ? 'point' : 'stand', gesture: kn, walking: e < 0.5, walkPhase: time_s * 3})}
          </g>
        </PlaceSubject>,
      );
    }
    default:
      return svg(
        <PlaceSubject baseY={baseY}>
          <Mesquite x={300} y={baseY} scale={0.192} seed={5} />
          {hand({x: 560, y: baseY, scale: 1.6, facing: 1, emotion: 'neutral'})}
        </PlaceSubject>,
      );
  }
};

export default BrushHidesFilm;
