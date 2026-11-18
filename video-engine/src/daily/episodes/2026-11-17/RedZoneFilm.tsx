import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {actionWindows, type DirectedScene} from '../../../lib/direction';
import {Figure, castV2, figureHands, type FigureEmotion, type FigurePose, type FigureProps} from '../../../look/Figure';
import {Burst, Bush, ContactShadow, GlassPanel, Glow, clamp01, ease, easeOutBack, lerp} from '../../../look/Kit';
import {RobotArmV2} from '../../../look/machines';
import {MesquiteV2} from '../../../look/shelf/kit';
import {IronRoughneckV2, RedZoneSignV2, DoghouseV2, PipeRackV2, DerrickV2} from '../../../look/shelf/drilling';
import {Pumpjack} from '../../../look/regions';
import {line, light, shade} from '../../../look/color';
import {FONT} from '../../../lib/type';
import texas from '../../../modern/texasCounties.json';
import {Big, Console, Cutaway, FarDerrick, Glove, GlovePeg, HazardTag, PipeArm, PipeJoint, SunTick, Tube} from './parts';

/**
 * red-zone-1117 (November 17th, 2026): "Out of the red zone". On ExxonMobil's automated drilling rigs
 * in Midland, three robot arms supplied by Helmerich and Payne move and connect heavy drill pipe on the
 * rig floor, and the crew runs them from a small office on the rig. Every fact is in claims.json.
 *
 * The hero is the pipe arm with a face (parts.tsx). The person is a floorhand, illustrative, from the v2
 * cast in a hard hat and FR coveralls. The throughline is the floorhand's gloves: greasy on the pipe,
 * hung on the doghouse peg, still there through the test, hanging while a bare hand taps go.
 * Nobody is hurt on screen. Disclosed illustration.
 */
const HAND: Partial<FigureProps> = {...castV2('hand'), hat: 'hardhat', hatColor: '#f4f4ef', top: 'coveralls', shirt: '#c2413a',
  pants: '#c2413a', trim: '#eef3fa'};
const CAHIR: Partial<FigureProps> = {...castV2('executive'), hair: 'short', top: 'suit', shirt: '#3a4a7a', pants: '#2a3358', build: 0.6};
const OPS: Partial<FigureProps> = {...castV2('engineer'), hat: 'none'};
const DRILLER: Partial<FigureProps> = {...castV2('operator'), hat: 'hardhat', hatColor: '#ffc93c'};
const GHOST: Partial<FigureProps> = {...castV2('operator'), hat: 'hardhat', hatColor: '#f4f4ef'};

const move = (t: number, at: number, before: FigurePose, after: FigurePose) => (
  t < at ? {pose: before} : {pose: after, fromPose: before, poseBlend: clamp01((t - at) / 0.35)}
);

/** the drill floor: a lit steel deck, the rotary table turning, a stub of pipe in the slips, the yellow rail */
const Floor: React.FC<{frame: number; y?: number; cx?: number; turning?: boolean; legs?: boolean; rail?: boolean; stub?: number}> = ({
  frame, y = 1380, cx = 540, turning = false, legs = true, rail = true, stub = 120}) => {
  const rot = turning ? frame * 6 : 0;
  return (
    <g>
      {/* the caliche pad the rig stands on, pale and dusty, with low mesquite at its edge */}
      <path d={`M-40 ${y - 600} Q540 ${y - 630} 1120 ${y - 600} L1120 ${y + 400} L-40 ${y + 400} Z`} fill="#e3cfa4" />
      <path d={`M-40 ${y - 600} Q540 ${y - 630} 1120 ${y - 600}`} stroke="#c9b083" strokeWidth={10} fill="none" />
      {[[40, 0.07, 3], [250, 0.05, 7], [880, 0.06, 11], [1040, 0.075, 5]].map(([bx, bs, sd]) => <MesquiteV2 key={bx} x={bx} y={y - 590} scale={bs}
        seed={sd} frame={frame} leaf="#8f9a52" pods={false} />)}
      <Pumpjack x={720} y={y - 600} s={0.28} frame={frame} depth={0.7} />
      {/* the substructure that holds the floor up */}
      {[100, 340, 740, 980].map((px) => <Tube key={px} x1={px} y1={y + 10} x2={px} y2={y + 420} w={30} c="#8a93b8" />)}
      {[0, 1].map((k) => <g key={k}><Tube x1={100 + k * 640} y1={y + 40} x2={340 + k * 640} y2={y + 400} w={14} c="#7d86a8" />
        <Tube x1={340 + k * 640} y1={y + 40} x2={100 + k * 640} y2={y + 400} w={14} c="#7d86a8" /></g>)}
      {legs && <g>
        <Tube x1={120} y1={y} x2={300} y2={-200} w={40} c="#e8a33a" />
        <Tube x1={960} y1={y} x2={780} y2={-200} w={40} c="#e8a33a" />
        {[0, 1, 2, 3].map((k) => {
          const t0 = k / 4, t1 = (k + 1) / 4;
          const lx = (t: number) => lerp(120, 300, t), rx = (t: number) => lerp(960, 780, t), yy = (t: number) => lerp(y, -200, t);
          return <g key={k} opacity={0.85}>
            <Tube x1={lx(t0)} y1={yy(t0)} x2={rx(t1)} y2={yy(t1)} w={14} c="#d9952f" />
            <Tube x1={rx(t0)} y1={yy(t0)} x2={lx(t1)} y2={yy(t1)} w={14} c="#d9952f" />
          </g>;
        })}
      </g>}
      <path d={`M-40 ${y} L1120 ${y} L1120 ${y + 60} L-40 ${y + 60} Z`} fill="#7d86a8" />
      <path d={`M-40 ${y + 60} L1120 ${y + 60}`} stroke={shade('#7d86a8', 0.4)} strokeWidth={8} />
      <path d={`M-40 ${y} L1120 ${y}`} stroke={light('#7d86a8', 0.5)} strokeWidth={10} />
      {Array.from({length: 12}, (_, i) => <path key={i} d={`M${cx + (i - 6) * 40} ${y + 6} L${cx + (i - 6) * 60} ${y + 56}`} stroke={shade('#7d86a8', 0.2)}
        strokeWidth={4} opacity={0.5} />)}
      {[0, 1, 2].map((k) => <ellipse key={k} cx={180 + k * 330} cy={y + 30} rx={22} ry={6} fill="#b8642e" opacity={0.35} />)}
      <ellipse cx={cx} cy={y + 60} rx={200} ry={46} fill="#4a4f6e" stroke={line('#4a4f6e')} strokeWidth={6} />
      <g transform={`translate(${cx} ${y + 60}) scale(1 0.23)`}>
        <g transform={`rotate(${rot})`}>
          <circle r={160} fill="#636a8e" />
          {[0, 90, 180, 270].map((a) => <rect key={a} x={-12} y={-150} width={24} height={60} rx={10} fill="#9aa6c4" transform={`rotate(${a})`} />)}
        </g>
      </g>
      {stub > 0 && <PipeJoint x={cx} y={y + 60 - stub / 2} len={stub} w={34} />}
      {rail && <g>
        <Tube x1={-40} y1={y + 150} x2={1120} y2={y + 150} w={18} c="#f5c02c" />
        <Tube x1={-40} y1={y + 230} x2={1120} y2={y + 230} w={14} c="#f5c02c" />
        {[60, 340, 740, 1020].map((px) => <Tube key={px} x1={px} y1={y + 140} x2={px} y2={y + 300} w={16} c="#f5c02c" />)}
      </g>}
    </g>
  );
};

/** a glove-wearing hand prop drawn at a figure's hand, so the gloves are on the person, never floating */
const GlovedHands: React.FC<{pose: FigurePose; x: number; y: number; scale: number; grease?: number; facing?: number}> = ({
  pose, x, y, scale, grease = 0.6}) => {
  const h = figureHands(pose);
  return <g>
    <Glove x={x + h.l.x * scale} y={y + h.l.y * scale + 6 * scale} s={0.26 * scale} rot={180} grease={grease} />
    <Glove x={x + h.r.x * scale} y={y + h.r.y * scale + 6 * scale} s={0.26 * scale} rot={180} grease={grease} />
  </g>;
};

const Label: React.FC<{x: number; y: number; text: string; size?: number; c?: string; anchor?: 'start' | 'middle' | 'end'}> = ({
  x, y, text, size = 44, c = '#fff4dc', anchor = 'middle'}) => (
  <g>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={line(c)} stroke={line(c)} strokeWidth={10}
      strokeLinejoin="round">{text}</text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.body} fontWeight={900} fontSize={size} fill={c}>{text}</text>
  </g>
);

const Badge: React.FC<{x: number; y: number; n: string; p: number; c?: string}> = ({x, y, n, p, c = '#f07a2a'}) => (
  <g transform={`translate(${x} ${y}) scale(${easeOutBack(clamp01(p), 1.8)})`}>
    <circle r={40} fill={c} stroke={line(c)} strokeWidth={6} />
    <circle cx={-12} cy={-12} r={12} fill="#fff" opacity={0.35} />
    {Array.from({length: Number(n)}, (_, i) => <circle key={i} cx={(i - (Number(n) - 1) / 2) * 20} cy={4} r={7} fill="#fff" />)}
  </g>
);

const MIDLAND = (texas as unknown as {counties: Record<string, {label: [number, number]}>}).counties.Midland.label;
const HARRIS = (texas as unknown as {counties: Record<string, {label: [number, number]}>}).counties.Harris.label;
const OUTLINE = (texas as unknown as {outline: string}).outline;

export const RedZoneFilm: React.FC<FilmRenderProps> = ({board, shot, time_s, shot_s}) => {
  const frame = useCurrentFrame();
  const W = actionWindows(board.scenes as DirectedScene[]);
  const p = (id: string) => {
    const w = W[id];
    if (!w) return 0;
    return ease((time_s - w.start) / Math.max(0.2, w.end - w.start));
  };
  const since = (id: string) => (W[id] ? time_s - W[id].start : -1);
  const pb = (id: string, k = 1.6) => easeOutBack(clamp01(since(id) / 0.6), k);
  const t = shot_s;
  const svg = (children: React.ReactNode) => (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>{children}</svg>
  );
  const hand = (x: number, y: number, scale: number, pose: object, emotion: FigureEmotion, turn = 0.3, extra: Partial<FigureProps> = {}) => (<g>
    <ContactShadow x={x} y={y + 4} w={200 * scale} opacity={0.4} />
    <Figure frame={frame} x={x} y={y} scale={scale} {...HAND} {...pose} emotion={emotion} turn={turn} seed={7} {...extra} /></g>
  );

  switch (shot.view) {
    case 'floor-hands': {
      // the pipe swings in, the floorhand reaches with greasy gloves, then pulls both hands back as the arm takes it
      const sw = p('s1-swing');
      const back = since('s1-gloves');
      const pulled = back >= 0;
      const pose: FigurePose = pulled ? 'raise' : 'reach';
      return svg(<g>
        <Pumpjack x={-30} y={1000} s={0.5} frame={frame} depth={0.7} />
        <Floor frame={frame} y={1420} turning />
        <RedZoneSignV2 x={560} y={1790} scale={1.1} frame={frame} />
        <PipeArm x={150} y={1420} s={1.2} frame={frame} facing={1} swing={lerp(0.35, 0.85, easeOutBack(sw, 1.2))} lift={0.6 * (1 - sw)}
          mood={pulled ? 'happy' : 'focused'} pipeLen={900} grip={1} look={1} />
        <g transform={`translate(${pulled ? easeOutBack(clamp01(back / 0.35), 2) * 30 : 0} 0) rotate(${pulled ? 6 * Math.exp(-back * 2) : 0} 850 1660)`}>
          {hand(850, 1660, 1.7, pulled ? move(back, 0, 'reach', 'raise') : {pose: 'reach'}, pulled ? 'surprised' : 'worried', -0.65)}
          <GlovedHands pose={pose} x={850} y={1660} scale={1.7} grease={0.8} />
        </g>
        {since('s1-tower') >= 0 && (() => { const k = ease(clamp01(since('s1-tower') / 0.8)); return <g opacity={clamp01(since('s1-tower') * 3)}>
          <path d={`M640 1290 L640 ${lerp(1290, 560, k)}`} stroke="#fff4dc" strokeWidth={8} strokeDasharray="18 12" strokeLinecap="round" />
          {[1].map((m) => k >= m && <g key={m}><path d={`M610 ${lerp(1290, 560, m)} L670 ${lerp(1290, 560, m)}`} stroke="#fff4dc" strokeWidth={10}
            strokeLinecap="round" /><Label x={700} y={lerp(1290, 560, m) + 16} text={m === 1 ? '2 stories' : '1 story'} size={42} anchor="start" /></g>)}
        </g>; })()}
        <Burst x={540} y={1100} p={(back - 0.1) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'arm-face': {
      // close on the hero: in s1 it closes its jaws and blinks, in s11 it spins the next joint and winks
      const late = shot.scene_id === 's11';
      const k = late ? p('s11-answer') : p('s1-blink');
      return svg(<g>
        <Glow x={600} y={700} r={520} color="#ffb84a" opacity={0.35} />
        <PipeArm x={430} y={1820} s={2.3} frame={frame} swing={0.62} lift={0} grip={lerp(0.2, 1, k)} mood={k > 0.4 ? 'happy' : 'focused'}
          pipeLen={760} look={late ? 0.5 : -0.5} thumb={late ? clamp01((since('s11-answer') - 0.5) / 0.4) : 0} />
        <Burst x={760} y={560} p={(late ? since('s11-answer') : since('s1-blink')) / 0.6} color="#7dff8a" />
      </g>);
    }
    case 'stab-connect': {
      // detail: the jaws lower the joint's pin into the box of the pipe in the slips, then turn it tight
      const st = p('s2-stab');
      const spin = since('s2-spin');
      const spinOn = spin >= 0;
      const drop = lerp(-420, 0, ease(st));
      const turns = spinOn ? Math.min(spin, 1.4) * 14 : 0;
      return svg(<g>
        <Glow x={540} y={1000} r={600} color="#ffcf6a" opacity={0.3} />
        {/* the pipe in the slips, its box end up */}
        <g><Tube x1={540} y1={1180} x2={540} y2={1900} w={120} c="#c98a52" />
          <Tube x1={540} y1={1080} x2={540} y2={1220} w={190} c="#b97a48" /></g>
        {/* the slips, gripping */}
        {[-1, 1].map((sd) => <path key={sd} d={`M${540 + sd * 100} 1260 L${540 + sd * 170} 1260 L${540 + sd * 150} 1420 L${540 + sd * 96} 1420 Z`}
          fill="#5a5f80" stroke={line('#5a5f80')} strokeWidth={8} strokeLinejoin="round" />)}
        {/* the joint coming down, threads on its pin */}
        <g transform={`translate(0 ${drop})`}>
          <Tube x1={540} y1={300} x2={540} y2={900} w={120} c="#c98a52" />
          <Tube x1={540} y1={860} x2={540} y2={1000} w={190} c="#b97a48" />
          <path d="M490 1000 L590 1000 L570 1080 L510 1080 Z" fill="#9aa6c4" stroke={line('#9aa6c4')} strokeWidth={6} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((k) => <path key={k} d={`M${494 + k * 5} ${1014 + k * 18} L${586 - k * 5} ${1006 + k * 18}`} stroke={shade('#9aa6c4', 0.4)}
            strokeWidth={5} strokeLinecap="round" transform={`translate(0 ${(turns * 8) % 18})`} />)}
          {/* the jaw head, gripping the joint, from the right */}
          <Tube x1={1200} y1={420} x2={720} y2={600} w={110} c="#f07a2a" />
          <g transform="translate(560 640)">
            {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 40} -110 Q${sd * 130} -40 ${sd * 82} 60`} stroke={line('#9aa6c4')} strokeWidth={60}
              strokeLinecap="round" fill="none" />)}
            {[-1, 1].map((sd) => <path key={`j${sd}`} d={`M${sd * 40} -110 Q${sd * 130} -40 ${sd * 82} 60`} stroke={light('#9aa6c4', 0.25)}
              strokeWidth={40} strokeLinecap="round" fill="none" />)}
          </g>
          {spinOn && [0, 1, 2].map((k) => <path key={k} d={`M${400 - k * 10} ${700 + k * 60} q140 -50 280 0`} stroke="#fff" strokeWidth={9} fill="none"
            strokeLinecap="round" opacity={0.85 - k * 0.2} transform={`translate(${((frame * 18 + k * 30) % 60) - 30} 0)`} />)}
        </g>
        {spinOn && <Big x={540} y={1640} text="TIGHT" size={110} color="#9affb8" p={clamp01((spin - 1.0) / 0.4)} />}
        <Burst x={540} y={1060} p={(since('s2-stab') - 0.9) / 0.5} color="#ffcf6a" />
        <Burst x={540} y={1060} p={(spin - 1.2) / 0.6} color="#9affb8" />
        {hand(120, 1980, 1.5, {pose: 'crossed'}, spinOn ? 'surprised' : 'thinking', 0.7)}
      </g>);
    }
    case 'ghost-crew': {
      // memory: a framed snapshot of the old way, two floorhands wrestling the tongs; the floorhand in front, remembering
      const g = p('s2-ghost');
      const wrestle = Math.sin(frame / 30 * 4) * 0.5 + 0.5;
      return svg(<g>
        <g transform={`translate(540 860) rotate(${lerp(-12, -4, easeOutBack(g, 1.3))}) scale(${lerp(0.6, 1, easeOutBack(g, 1.3))})`} opacity={clamp01(g * 2)}>
          <rect x={-430} y={-440} width={860} height={760} rx={40} fill="#f4ead2" stroke={line('#d8c49a')} strokeWidth={10} />
          <g style={{filter: 'sepia(0.75) saturate(0.7)'}}>
            <rect x={-390} y={-400} width={780} height={600} rx={26} fill="#9fc4f0" />
            <rect x={-390} y={60} width={780} height={140} rx={0} fill="#7d86a8" />
            <Tube x1={-300} y1={60} x2={-200} y2={-400} w={26} c="#e8a33a" />
            <Tube x1={300} y1={60} x2={200} y2={-400} w={26} c="#e8a33a" />
            <PipeJoint x={0} y={-150} len={460} w={34} />
            <Figure frame={frame} x={-170} y={190} scale={0.8} {...GHOST} pose="reach" emotion="determined" turn={0.6} seed={21} />
            <Figure frame={frame} x={170} y={190} scale={0.8} {...GHOST} shirt="#3d6a8a" pose="reach" emotion="determined" turn={-0.6} seed={23} />
            <Tube x1={-120} y1={-60 + wrestle * 10} x2={120} y2={-50 - wrestle * 10} w={22} c="#9aa6c4" />
          </g>
          <text x={0} y={280} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={52} fill="#5a4a32">BY HAND</text>
        </g>
        {hand(230, 1960, 1.9, {pose: 'think'}, 'thinking', 0.75)}
        <GlovedHands pose="think" x={230} y={1960} scale={1.9} grease={0.8} />
      </g>);
    }
    case 'gate-redzone': {
      // the gate slides shut around the floor, the sign swings, the floorhand leans in and winces
      const gate = p('s3-gate');
      const sign = since('s3-sign');
      const lean = clamp01(sign / 0.6);
      return svg(<g>
        <Floor frame={frame} y={1180} turning rail={false} />
        <PipeArm x={760} y={1180} s={0.55} frame={frame} facing={-1} swing={0.6 + 0.3 * Math.sin(frame / 40)} mood="focused" pipeLen={460} />
        {/* the sliding gate, closing from the right */}
        <g transform={`translate(${lerp(900, 0, easeOutBack(gate, 1.1))} 0)`}>
          <Tube x1={80} y1={1300} x2={1040} y2={1300} w={24} c="#f5c02c" />
          <Tube x1={80} y1={1520} x2={1040} y2={1520} w={24} c="#f5c02c" />
          {[80, 400, 720, 1040].map((px) => <Tube key={px} x1={px} y1={1290} x2={px} y2={1720} w={20} c="#f5c02c" />)}
          <g transform={`rotate(${sign >= 0 ? Math.sin(sign * 7) * 10 * Math.exp(-sign * 1.4) : 0} 560 1300)`}>
            <RedZoneSignV2 x={600} y={960} scale={2.0} frame={frame} />
          </g>
        </g>
        {hand(lerp(120, 150, lean), 1880, 1.55, sign >= 0 ? move(sign, 0, 'stand', 'think') : {pose: 'stand'}, sign >= 0 ? 'worried' : 'neutral', 0.65)}
      </g>);
    }
    case 'cahir-tags': {
      // the Exxon executive (illustrative) points at a glass map of the rig; three tags drop, one lands on the floor and glows
      const drop = (k: number) => easeOutBack(clamp01((since('s4-tags') - k * 0.25) / 0.5), 1.4);
      const third = p('s4-third');
      const spots: [number, number][] = [[230, 860], [740, 820], [520, 600]];
      return svg(<g>
        <GlassPanel x={80} y={380} w={920} h={780} r={60} tint="#1b2350">
          {/* the rig in side view: pipe rack, catwalk, the floor high on its substructure, the mast, the doghouse */}
          <path d="M60 680 L860 680" stroke="#8fb0ff" strokeWidth={6} />
          <rect x={90} y={620} width={170} height={60} rx={14} fill="none" stroke="#8fb0ff" strokeWidth={6} />
          <path d="M260 660 L420 520" stroke="#8fb0ff" strokeWidth={6} />
          <rect x={400} y={500} width={260} height={30} rx={12} fill={third > 0.3 ? '#ef4b4b' : 'none'} stroke="#8fb0ff" strokeWidth={6}
            opacity={third > 0.3 ? 0.55 + 0.25 * Math.sin(frame / 5) : 1} />
          <path d="M440 530 L440 680 M620 530 L620 680" stroke="#8fb0ff" strokeWidth={6} />
          <path d="M470 500 L520 80 L560 80 L590 500" stroke="#8fb0ff" strokeWidth={6} fill="none" />
          <rect x={680} y={560} width={140} height={90} rx={16} fill="none" stroke="#8fb0ff" strokeWidth={6} />
          {spots.map(([sx, sy], k) => {
            const toFloor = k === 2 ? third : 0;
            return <g key={k} transform={`translate(0 ${(1 - drop(k)) * -500})`}>
              <HazardTag x={lerp(sx, 530, toFloor)} y={lerp(sy - 280, 380, toFloor)} s={0.8} swing={Math.sin(frame / 12 + k)} />
            </g>;
          })}
          {third > 0.3 && <Glow x={530} y={515} r={220} color="#ff5d5d" opacity={0.5} />}
        </GlassPanel>
        <Figure frame={frame} x={760} y={1800} scale={1.6} {...CAHIR} {...move(t, 0.6, 'stand', 'point')} emotion={third > 0.3 ? 'worried' : 'determined'}
          turn={-0.5} seed={11} />
        <Burst x={610} y={900} p={(since('s4-third') - 0.3) / 0.6} color="#ff8a8a" />
      </g>);
    }
    case 'three-arms': {
      // three arms unfold across the floor; one walks a stand to the hole, one lines up the threads, one racks pipe up high
      const un = (k: number) => easeOutBack(clamp01((since('s5-arms') - k * 0.35) / 0.6), 1.3);
      const walk = p('s5-walk');
      const thr = p('s5-thread');
      const rack = p('s5-rack');
      const wk = (k: number) => since('s5-wake') - k * 0.3 >= 0;
      return svg(<g>
        <Floor frame={frame} y={1360} legs />
        {[0, 1, 2].map((k) => <Burst key={k} x={[200, 660, 760][k]} y={[900, 1000, 300][k]} p={(since('s5-wake') - k * 0.3) / 0.6} color="#38f2e0" />)}
        {/* the fingerboard high in the derrick */}
        <rect x={300} y={330} width={480} height={36} rx={16} fill="#d9952f" stroke={line('#d9952f')} strokeWidth={5} />
        {[0, 1, 2, 3, 4].map((k) => <PipeJoint key={k} x={340 + k * 34} y={720} len={760} w={22} />)}
        {rack > 0 && <PipeJoint x={lerp(700, 520, rack)} y={720} len={760} w={22} />}
        <g transform={`translate(0 ${(1 - un(2)) * -300})`} opacity={clamp01(un(2) * 2)}>
          <RobotArmV2 x={760} y={400} scale={0.9} frame={frame} reach={lerp(0.2, 0.9, rack)} grip={rack > 0.5 ? 1 : 0.2} mood={wk(2) ? 'happy' : 'sleepy'} paint="#f07a2a" />
          <Badge x={880} y={240} n="3" p={un(2)} />
        </g>
        <g transform={`translate(0 ${(1 - un(1)) * 200})`} opacity={clamp01(un(1) * 2)}>
          <RobotArmV2 x={660} y={1380} scale={0.75} frame={frame} reach={lerp(0.3, 1, thr)} grip={0.6} mood={wk(1) ? 'happy' : 'sleepy'} paint="#f07a2a" />
          <Badge x={720} y={1060} n="2" p={un(1)} />
        </g>
        <g opacity={clamp01(un(0) * 2)}>
          <PipeArm x={lerp(200, 300, walk)} y={1360} s={0.8 * un(0)} frame={frame} swing={lerp(0.1, 0.9, walk)} lift={0.4 - walk * 0.4} mood={wk(0) ? 'happy' : 'sleepy'}
            pipeLen={560} />
          <Badge x={180} y={900} n="1" p={un(0)} />
        </g>
        <Burst x={540} y={1240} p={(since('s5-walk') - 0.8) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'weight-scale': {
      // a hook scale under the arm: the needle swings up to 2,000 lb and the arm puffs its cheeks
      const k = p('s5-weight');
      const lbs = Math.round(k * 2000 / 10) * 10;
      const ang = lerp(-130, 120, k) + Math.sin(frame / 3) * 2 * (1 - k);
      return svg(<g>
        <PipeArm x={140} y={1840} s={1.5} frame={frame} swing={0.85} lift={0.6} pipe={false} mood={k > 0.3 && k < 0.95 ? 'worried' : 'focused'} />
        {/* the scale hangs from the jaws, the joint hangs from the scale */}
        <g transform={`translate(610 ${560 + Math.sin(frame / 14) * 6})`}>
          <path d="M0 -120 L0 -40" stroke="#5a5f80" strokeWidth={14} strokeLinecap="round" />
          <circle r={190} fill="#f4f6fb" stroke={line('#9aa6c4')} strokeWidth={14} />
          <circle r={160} fill="#ffffff" />
          {Array.from({length: 11}, (_, i) => {
            const a = (-130 + i * 25) * Math.PI / 180;
            return <path key={i} d={`M${Math.sin(a) * 130} ${-Math.cos(a) * 130} L${Math.sin(a) * 150} ${-Math.cos(a) * 150}`} stroke="#4a4f6e"
              strokeWidth={i % 5 === 0 ? 10 : 5} strokeLinecap="round" />;
          })}
          <path d={`M0 0 L${Math.sin(ang * Math.PI / 180) * 128} ${-Math.cos(ang * Math.PI / 180) * 128}`} stroke="#ef4b4b" strokeWidth={14}
            strokeLinecap="round" />
          <circle r={18} fill="#4a4f6e" />
          <text x={0} y={90} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={64} fill="#1b1d3a">{lbs.toLocaleString('en-US')}</text>
          <text x={0} y={130} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={30} fill="#4a4f6e">LB</text>
          <path d="M0 190 L0 260" stroke="#5a5f80" strokeWidth={14} strokeLinecap="round" />
          <g transform={`translate(0 ${560 + (1 - k) * 60}) rotate(${Math.sin(frame / 20) * 2})`}><PipeJoint x={0} y={0} len={600} w={60} glint={frame / 60} /></g>
        </g>
        <Burst x={610} y={560} p={(since('s5-weight') - 1.0) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'derrick-rack': {
      // looking up the derrick: arm three racks a stand in the fingerboard; the floorhand points up, impressed
      const rack = p('s5-rack');
      return svg(<g>
        <DerrickV2 x={600} y={1500} scale={0.1} frame={frame} block={0.7} racked={0.6} />
        <g transform={`translate(${lerp(820, 640, rack)} ${lerp(560, 430, rack)})`}>
          <Glow x={0} y={0} r={140} color="#ffcf6a" opacity={0.4} />
          <RobotArmV2 x={60} y={60} scale={0.45} frame={frame} reach={lerp(0.2, 0.9, rack)} grip={1} mood="happy" paint="#f07a2a" />
        </g>
        <Burst x={640} y={430} p={(since('s5-rack') - 0.8) / 0.6} color="#ffcf6a" />
        {hand(290, 1830, 1.65, move(since('s5-rack'), 0.2, 'stand', 'point'), rack > 0.2 ? 'excited' : 'surprised', 0.4)}
      </g>);
    }
    case 'doghouse-climb': {
      // the floorhand climbs the stair to the doghouse door, mid-step, gloves still on
      const climb = ease(clamp01(t / 3.0));
      const fx = lerp(220, 560, climb), fy = lerp(1880, 1330, climb);
      return svg(<g>
        <path d="M-40 1600 L1120 1600 L1120 1960 L-40 1960 Z" fill="#c9a77a" />
        <Pumpjack x={80} y={1180} s={0.4} frame={frame} depth={0.7} />
        <rect x={420} y={1300} width={700} height={40} rx={14} fill="#7d86a8" stroke={line('#7d86a8')} strokeWidth={6} />
        {[480, 700, 920].map((px) => <Tube key={px} x1={px} y1={1340} x2={px} y2={1620} w={22} c="#7d86a8" />)}
        <DoghouseV2 x={820} y={1300} scale={0.55} frame={frame} occupied lit />
        {Array.from({length: 9}, (_, i) => <rect key={i} x={170 + i * 42} y={1890 - i * 64} width={130} height={20} rx={10} fill="#9aa6c4"
          stroke={line('#9aa6c4')} strokeWidth={4} />)}
        <Tube x1={170} y1={1860} x2={520} y2={1290} w={14} c="#f5c02c" />
        <Tube x1={300} y1={1880} x2={650} y2={1310} w={14} c="#f5c02c" />
        {hand(fx, fy, 1.5, {pose: 'reach'}, 'happy', 0.75, {walk: t})}
        <GlovedHands pose="reach" x={fx} y={fy} scale={1.5} grease={0.8} />
      </g>);
    }
    case 'peg-gloves': {
      // inside the door: the gloves come off onto the peg, then the screens light the floorhand's face
      const off = since('s6-peg');
      const scr = p('s6-screen');
      const hung = off > 0.6;
      return svg(<g>
        <rect x={-40} y={-40} width={1160} height={2000} fill="#4f7f6c" />
        {Array.from({length: 7}, (_, i) => <rect key={i} x={-20 + i * 170} y={-40} width={160} height={1500} rx={18} fill="#5f9a7e"
          stroke={shade('#5f9a7e', 0.3)} strokeWidth={4} />)}
        <rect x={-40} y={1460} width={1160} height={500} fill="#5c5f78" />
        {/* the console and its big screen, throwing light back into the room */}
        <rect x={560} y={1060} width={500} height={330} rx={34} fill="#1b1d3a" stroke="#5b628f" strokeWidth={6} />
        <rect x={580} y={1080} width={460} height={290} rx={24} fill="#2a6f8f" opacity={0.6 + 0.4 * scr} />
        <path d="M610 1320 Q800 1120 1010 1220" stroke="#ffd45c" strokeWidth={10} strokeDasharray="4 22" strokeLinecap="round" fill="none"
          opacity={scr} />
        <rect x={520} y={1380} width={600} height={120} rx={30} fill="#3f4a76" stroke={line('#3f4a76')} strokeWidth={6} />
        <rect x={560} y={360} width={480} height={360} rx={40} fill="#9fd0f0" stroke={line('#5f9a7e')} strokeWidth={10} />
        <g clipPath="url(#rz-pw)"><defs><clipPath id="rz-pw"><rect x={570} y={370} width={460} height={340} rx={32} /></clipPath></defs>
          <rect x={570} y={600} width={460} height={120} fill="#7d86a8" />
          <FarDerrick x={700} y={620} s={0.7} lit={1} frame={frame} />
          <PipeArm x={920} y={640} s={0.32} frame={frame} facing={-1} swing={0.6 + 0.3 * Math.sin(frame / 25)} mood="happy" pipeLen={300} />
        </g>
        <Glow x={700} y={1000} r={700} color="#7fd8f0" opacity={0.85 * scr} />
        {hung && <GlovePeg x={260} y={560} s={1.4} sway={Math.sin(off * 6) * Math.exp(-off)} grease={0.8} />}
        {!hung && <rect x={240} y={540} width={40} height={40} rx={12} fill="#8a93b8" />}
        {hand(lerp(520, 640, scr), 1840, 2.1, off < 0 ? {pose: 'raise'} : scr > 0.2 ? move(time_s - (W['s6-screen']?.start ?? 0), 0, 'raise', 'point') : {pose: 'raise'},
          scr > 0.3 ? 'excited' : 'determined', lerp(-0.8, 0.8, scr))}
        {!hung && <GlovedHands pose="raise" x={520} y={1840} scale={2.1} grease={0.8} />}
        {off > 0 && off < 0.6 && <Glove x={lerp(520, 300, off / 0.6)} y={lerp(1400, 760, off / 0.6)} s={0.5} rot={off * 300} grease={0.8} />}
      </g>);
    }
    case 'console': {
      // the doghouse console: the driller starts a move, the dotted path draws, the arm on screen rides it; later sketches and taps go
      const late = shot.scene_id === 's11';
      const start = since('s7-start');
      const path = p('s7-path');
      const plan = p('s11-plan');
      const go = since('s11-nod');
      const pressed = late ? go >= 0 : start >= 0;
      const pose: FigurePose = late ? (go >= 0 ? 'point' : 'think') : (pressed ? 'point' : 'think');
      const armP = late ? plan : path;
      return svg(<g>
        <Figure frame={frame} x={430} y={1420} scale={1.7} {...DRILLER} pose={pose} emotion={pressed ? 'happy' : 'determined'} turn={0.1} seed={19} />
        {hand(860, 1330, 1.35, {pose: 'crossed'}, pressed ? 'surprised' : 'thinking', -0.6)}
        <GlovePeg x={130} y={480} s={0.9} sway={Math.sin(frame / 40) * 0.3} grease={0.8} />
        <Console frame={frame} y={1260} dial={late ? 0.6 : 0.3 + path * 0.3}
          screenA={<g>
            <path d="M40 220 Q200 40 360 160" stroke="#fff" strokeWidth={8} strokeDasharray="4 22" strokeLinecap="round" fill="none"
              pathLength={1} strokeDashoffset={0} opacity={0.9} />
            <path d="M40 220 Q200 40 360 160" stroke="#ffd45c" strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1}
              strokeDasharray={`${armP} 1`} />
            {(() => { const u = armP; const x = (1 - u) * (1 - u) * 40 + 2 * (1 - u) * u * 200 + u * u * 360;
              const y = (1 - u) * (1 - u) * 220 + 2 * (1 - u) * u * 40 + u * u * 160;
              return <g transform={`translate(${x} ${y})`}><circle r={24} fill="#f07a2a" stroke="#fff" strokeWidth={5} /></g>; })()}
          </g>}
          screenB={<g>
            <rect x={30} y={30} width={340} height={60} rx={20} fill="#1d4a3a" />
            <text x={200} y={74} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill={pressed ? '#9affb8' : '#cfe8d8'}>
              {late ? (go >= 0 ? 'GO' : 'NEXT STEP') : (pressed ? 'RUNNING' : 'READY')}</text>
            {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={40 + i * 54} y={230 - (20 + ((i * 37 + Math.floor(frame / 6)) % 5) * 22)} width={36}
              height={20 + ((i * 37 + Math.floor(frame / 6)) % 5) * 22} rx={10} fill="#9af0b8" opacity={0.85} />)}
          </g>}
        />
                <Burst x={late ? 760 : 310} y={late ? 980 : 980} p={((late ? go : start) - 0.1) / 0.6} color="#9affb8" />
      </g>);
    }
    case 'houston-split': {
      // left: the driller in Midland; right: the ops engineer in Houston; between them a line across Texas
      const ln = p('s7-houston');
      const S = 1.85, ox = 170, oy = 360;
      const mx = ox + MIDLAND[0] * S, my = oy + MIDLAND[1] * S, hx = ox + HARRIS[0] * S, hy = oy + HARRIS[1] * S;
      return svg(<g>
        <rect x={0} y={0} width={1080} height={1920} fill="#2a3060" opacity={0.0} />
        <GlassPanel x={60} y={420} w={960} h={700} r={60} tint="#1b2350">
          <path d={OUTLINE} transform={`translate(${ox - 60} ${oy - 330}) scale(${S})`} fill="#e8b25e" stroke="#fff4dc" strokeWidth={1.6} />
          <g transform="translate(-60 -330)">
            <path d={`M${mx} ${my} Q${(mx + hx) / 2} ${Math.min(my, hy) - 160} ${hx} ${hy}`} stroke="#f07a2a" strokeWidth={10} fill="none"
              strokeLinecap="round" pathLength={1} strokeDasharray={`${ln} 1`} />
            <circle cx={mx} cy={my} r={18} fill="#ef4b4b" stroke="#fff" strokeWidth={5} />
            <circle cx={hx} cy={hy} r={18 * clamp01(ln * 3)} fill="#3f78c9" stroke="#fff" strokeWidth={5} />
            <Label x={mx} y={my - 34} text="Midland" size={40} />
            {ln > 0.6 && <Label x={hx - 10} y={hy + 70} text="Houston" size={40} />}
          </g>
        </GlassPanel>
        <path d="M540 1240 L540 1900" stroke="#fff4dc" strokeWidth={8} opacity={0.8} />
        <g>{hand(270, 1760, 1.1, move(since('s7-houston'), 1.2, 'think', 'wave'), ln > 0.5 ? 'happy' : 'thinking', 0.5)}</g>
        <g>
          <rect x={560} y={1250} width={500} height={720} rx={40} fill="#3f4a86" opacity={0.6} />
          <Figure frame={frame} x={810} y={1760} scale={1.1} {...OPS} {...move(since('s7-houston'), 0.9, 'stand', 'wave')} emotion="happy" turn={-0.5} seed={13} />
        </g>
      </g>);
    }
    case 'cutaway': {
      // the earth opened: the hole goes down and turns sideways for two miles while six suns tick on above
      const s0 = W['s9-dive']?.start ?? 0;
      const runEnd = W['s9-suns']?.end ?? s0 + 6;
      const run = clamp01((time_s - s0) / Math.max(1, runEnd - s0));
      const sunsOn = since('s9-suns');
      return svg(<g>
        <Cutaway frame={frame} p={ease(run)} surfaceY={820} rigX={180}>
          <FarDerrick x={180} y={820} s={1.6} lit={1} frame={frame} />
          <PipeArm x={420} y={820} s={0.42} frame={frame} facing={-1} swing={0.6 + 0.3 * Math.sin(frame / 25)} mood="happy" pipeLen={300} />
          {Array.from({length: 6}, (_, i) => <SunTick key={i} x={280 + i * 130} y={440 + Math.sin(i / 5 * Math.PI) * -110} r={48}
            on={sunsOn < 0 ? 0 : clamp01((sunsOn - i * 0.22) / 0.2)} />)}
        </Cutaway>
      </g>);
    }
    case 'podium': {
      // a podium rises, the little rig lands on the third step, the floorhand claps
      const rise = pb('s9-third', 1.4);
      const blocks: [string, number, number][] = [['1', 540, 420], ['2', 260, 300], ['3', 820, 220]];
      return svg(<g>
        {blocks.map(([n, x, h], i) => <g key={n} transform={`translate(${x} 1500) scale(1 ${clamp01(rise * (1 + i * 0.1))})`}>
          <rect x={-130} y={-h} width={260} height={h} rx={26} fill={i === 2 ? '#f07a2a' : '#8a93b8'} stroke={line(i === 2 ? '#f07a2a' : '#8a93b8')}
            strokeWidth={8} />
          <rect x={-110} y={-h + 14} width={60} height={h - 40} rx={20} fill="#fff" opacity={0.18} />
          {i === 2 && <text x={0} y={-h + 110} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={64} fill="#fff4dc">THIRD</text>}
        </g>)}
        <g transform={`translate(820 ${lerp(600, 1280, ease(clamp01((since('s9-third') - 0.3) / 0.6)))})`}>
          <FarDerrick x={0} y={0} s={0.85} lit={1} frame={frame} />
        </g>
        <ContactShadow x={540} y={1505} w={1000} />
        {hand(220, 1860, 1.5, rise > 0.8 ? {pose: 'cheer'} : {pose: 'stand'}, rise > 0.8 ? 'excited' : 'happy', 0.4)}
        <Burst x={820} y={1270} p={(since('s9-third') - 0.9) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'fleet': {
      // more than 30 derricks pop up across the plain; two light orange; the floorhand looks out with a tablet
      const pop = since('s8-fleet');
      const two = p('s8-two');
      const rows = [[6, 1080, 0.42], [7, 1180, 0.55], [8, 1300, 0.7], [11, 1440, 0.9]] as const;
      let idx = 0;
      return svg(<g>
        {[[120, 1010], [520, 1000], [940, 1012]].map(([x, y], i) => <Pumpjack key={i} x={x} y={y} s={0.32} frame={frame + i * 11} depth={0.8} />)}
        {rows.map(([n, y, s], r) => Array.from({length: n}, (_, i) => {
          const k = idx++;
          const x = 80 + (i + (r % 2) * 0.5) * (940 / (n - 0.5));
          const up = easeOutBack(clamp01((pop - k * 0.04) / 0.4), 1.6);
          const lit = (k === 14 || k === 25) ? two : 0;
          return <g key={k} transform={`translate(0 ${(1 - up) * 60})`} opacity={clamp01(up * 2)}>
            <FarDerrick x={x} y={y} s={s} lit={lit} frame={frame} seed={k} /></g>;
        }))}
        {hand(870, 1900, 1.55, two > 0.3 ? move(since('s8-two'), 0.3, 'hold', 'point') : {pose: 'hold'}, two > 0.5 ? 'surprised' : 'happy', -0.4)}
        <Burst x={540} y={1150} p={(since('s8-two') - 0.2) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'fleet-map': {
      // the tablet in the floorhand's hands: a grid of rigs lights orange row by row past the halfway line
      const half = p('s8-half');
      const n = 32;
      return svg(<g>
        {hand(860, 1900, 1.6, half > 0.5 ? move(since('s8-half') - 0.9, 0, 'stand', 'cheer') : {pose: 'stand'}, half > 0.6 ? 'excited' : 'thinking', -0.5)}
        <g transform="translate(200 420) rotate(-3) scale(0.8)">
          <rect x={-20} y={-20} width={840} height={1000} rx={60} fill="#1b1d3a" stroke="#5b628f" strokeWidth={6} />
          <rect x={0} y={0} width={800} height={960} rx={44} fill="#f4f8ff" />
          <text x={400} y={1000} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#1b1d3a">UNCONVENTIONAL FLEET</text>
          {Array.from({length: n}, (_, i) => {
            const r = Math.floor(i / 4), c = i % 4;
            if (r > 7) return null;
            const lit = i < 2 || (half > 0 && i < Math.ceil(n * 0.53 * clamp01(half * 1.1)));
            return <g key={i} transform={`translate(${120 + c * 190} ${90 + r * 110})`}>
              <path d="M-26 30 L-6 -34 L6 -34 L26 30" stroke={lit ? '#f07a2a' : '#9aa6c4'} strokeWidth={9} fill="none" strokeLinejoin="round"
                strokeLinecap="round" />
              <rect x={-36} y={22} width={72} height={18} rx={9} fill={lit ? '#f07a2a' : '#c8cfe0'} />
            </g>;
          })}
          <path d="M-10 480 L810 480" stroke="#ef4b4b" strokeWidth={8} strokeDasharray="22 14" />
          <rect x={560} y={448} width={220} height={60} rx={30} fill="#ef4b4b" />
          <text x={670} y={490} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={34} fill="#fff">HALF</text>
          <rect x={0} y={0} width={800} height={300} rx={44} fill="#ffffff" opacity={0.15} />
        </g>
      </g>);
    }
    case 'tablet-brow': {
      // the test: the floorhand reads Exxon's line, raises a brow; hard hats line up the same before and after; a stamp lands
      const crew = p('s10-crew');
      const stamp = since('s10-stamp');
      return svg(<g>
        <GlovePeg x={900} y={420} s={0.9} sway={Math.sin(frame / 50) * 0.2} grease={0.8} />
        {/* the doghouse bench, where the crew's hard hats line up in the same row as before */}
        <rect x={-40} y={1330} width={460} height={40} rx={20} fill="#8a6a4a" stroke={line('#8a6a4a')} strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => { const on = clamp01((crew - i * 0.18) / 0.3);
          return <g key={i} transform={`translate(${50 + i * 100} ${1330 - (1 - easeOutBack(on, 1.6)) * 120}) scale(1.3)`} opacity={on}>
            <path d="M-34 0 Q-34 -44 0 -44 Q34 -44 34 0 Z" fill="#f4f4ef" stroke={line('#c8cfe0')} strokeWidth={5} />
            <rect x={-46} y={-6} width={92} height={14} rx={7} fill="#f4f4ef" stroke={line('#c8cfe0')} strokeWidth={4} /></g>; })}
        {hand(240, 1900, 2.3, stamp >= 0 ? move(stamp, 0.3, 'point', 'shrug') : {pose: 'point'}, stamp >= 0.3 ? 'smug' : 'thinking', 0.55)}
        <g transform="translate(470 700) rotate(4)">
          <rect x={-20} y={-20} width={580} height={760} rx={50} fill="#1b1d3a" stroke="#5b628f" strokeWidth={6} />
          <rect x={0} y={0} width={540} height={720} rx={36} fill="#f4f8ff" />
          {since('s10-quote') >= 0 && <rect x={20} y={40} width={500} height={125} rx={30} fill="#ffd45c" opacity={0.55 + 0.25 * Math.sin(frame / 6)}
            transform={`scale(${lerp(0.6, 1, easeOutBack(clamp01(since('s10-quote') / 0.4)))})`} style={{transformOrigin: '270px 100px'}} />}
          <text x={270} y={90} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#1b1d3a">"a force multiplier,</text>
          <text x={270} y={145} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#1b1d3a">not a replacement"</text>
          <text x={270} y={195} textAnchor="middle" fontFamily={FONT.body} fontWeight={700} fontSize={30} fill="#4a4f6e">ExxonMobil</text>
          <text x={270} y={330} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={34} fill="#4a4f6e">STAFFING</text>
          <text x={270} y={390} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={46} fill="#1b1d3a">similar</text>
          {stamp >= 0 && <g transform={`translate(270 600) rotate(-10) scale(${lerp(1.8, 1, clamp01(stamp / 0.25))})`} opacity={clamp01(stamp / 0.15)}>
            <rect x={-200} y={-50} width={400} height={100} rx={24} fill="none" stroke="#ef4b4b" strokeWidth={10} />
            <text x={0} y={22} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={62} fill="#ef4b4b">EXPECTED</text>
          </g>}
        </g>
      </g>);
    }
    case 'tags-ghost': {
      // the safety board: three red tags, one turns into a dashed outline; the floorhand shrugs
      const g = p('s10-report');
      return svg(<g>
        <rect x={140} y={420} width={800} height={720} rx={50} fill="#e8d4a8" stroke={line('#b4895a')} strokeWidth={12} />
        <rect x={170} y={450} width={740} height={660} rx={36} fill="#d9b880" />
        <Tube x1={200} y1={540} x2={880} y2={540} w={14} c="#9aa6c4" />
        {[0, 1, 2].map((k) => <HazardTag key={k} x={330 + k * 210} y={580} s={1.6} ghost={k === 2 ? g : 0}
          swing={Math.sin(frame / 15 + k)} />)}
        {g > 0.5 && <Label x={750} y={1040} text="could" size={56} c="#ffd7d7" />}
        {hand(260, 1900, 1.7, since('s10-stamp') >= 0 ? move(since('s10-stamp'), 0, 'stand', 'shrug') : {pose: 'think'},
          since('s10-stamp') >= 0 ? 'smug' : 'thinking', 0.5)}
        <Burst x={750} y={760} p={(since('s10-report') - 0.4) / 0.6} color="#ffd7d7" />
      </g>);
    }
    case 'button-glass': {
      // through the doghouse glass: the arm spins the next joint below; the bare-handed floorhand nods and taps go; the gloves hang still
      const nod = since('s11-nod');
      return svg(<g>
        <rect x={60} y={300} width={960} height={900} rx={60} fill="#1d2a4a" stroke="#5f9a7e" strokeWidth={30} />
        <g clipPath="url(#rz-win)">
          <defs><clipPath id="rz-win"><rect x={75} y={315} width={930} height={870} rx={46} /></clipPath></defs>
          <rect x={75} y={315} width={930} height={870} fill="#9fc4f0" />
          <Floor frame={frame} y={900} turning legs={false} />
          <PipeArm x={760} y={900} s={0.6} frame={frame} facing={-1} swing={1} mood="happy" pipeLen={420} />
          <rect x={75} y={315} width={930} height={870} fill="#ffffff" opacity={0.08} />
        </g>
        <GlovePeg x={150} y={1260} s={0.85} sway={0} grease={0.8} />
        {hand(720, 1950, 2.3, nod >= 0 ? move(nod, 0, 'think', 'point') : {pose: 'think'}, nod >= 0.3 ? 'proud' : 'thinking', -0.3)}
        <Burst x={520} y={1500} p={(nod - 0.3) / 0.6} color="#9affb8" />
      </g>);
    }
    case 'hole-low': {
      // low at the hole: arm one walks a stand across the floor toward the camera and sets it over well centre
      const walk = p('s5-walk');
      return svg(<g>
        <Floor frame={frame} y={1500} cx={560} legs={false} stub={160} />
        <PipeArm x={lerp(230, 330, walk)} y={1500} s={1.05} frame={frame} swing={lerp(0.2, 0.95, walk)} lift={0.3 - walk * 0.3} mood={walk > 0.9 ? 'happy' : 'focused'}
          pipeLen={900} />
        <Badge x={150} y={760} n="1" p={1} />
        {hand(930, 1900, 1.35, {pose: 'hips'}, walk > 0.8 ? 'happy' : 'thinking', -0.5)}
        <Burst x={560} y={1380} p={(since('s5-walk') - 0.9) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'report-ghost': {
      // the safety board: three incident reports pinned; one fades to a pale dashed outline, the one that could be prevented
      const g = p('s10-report');
      const card = (x: number, y: number, k: number, ghost: number) => (
        <g key={k} transform={`translate(${x} ${y}) rotate(${(k - 1) * 4})`} opacity={1 - ghost * 0.45}>
          <rect x={-120} y={-150} width={240} height={300} rx={26} fill={ghost > 0.5 ? 'none' : '#f4f6fb'} stroke={ghost > 0.5 ? '#ffe2e2' : line('#c8cfe0')}
            strokeWidth={8} strokeDasharray={ghost > 0.5 ? '18 12' : undefined} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={-90} y={-60 + i * 44} width={150 - (i % 2) * 40} height={14} rx={7}
            fill={ghost > 0.5 ? 'none' : '#9aa6c4'} stroke={ghost > 0.5 ? '#ffe2e2' : 'none'} strokeWidth={3} strokeDasharray="6 6" />)}
          <rect x={-90} y={-120} width={180} height={34} rx={17} fill={ghost > 0.5 ? 'none' : '#ef4b4b'} stroke={ghost > 0.5 ? '#ffe2e2' : 'none'} strokeWidth={4} />
          <circle cx={0} cy={-170} r={16} fill="#3f78c9" />
        </g>);
      return svg(<g>
        <rect x={110} y={420} width={860} height={740} rx={50} fill="#5a7a9a" stroke={line('#5a7a9a')} strokeWidth={12} />
        <rect x={140} y={450} width={800} height={680} rx={36} fill="#6f90b0" />
        <text x={540} y={530} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={44} fill="#fff4dc">INCIDENT REPORTS</text>
        {card(300, 820, 0, 0)}{card(540, 840, 1, 0)}{card(780, 820, 2, g)}
        {hand(200, 1780, 1.35, since('s10-stamp') >= 0 ? move(since('s10-stamp'), 0, 'stand', 'shrug') : {pose: 'think'},
          since('s10-stamp') >= 0 ? 'smug' : 'thinking', 0.5)}
        <Burst x={780} y={820} p={(since('s10-report') - 0.4) / 0.6} color="#ffe2e2" />
      </g>);
    }
    case 'over-shoulder': {
      // over the floorhand's shoulder: a bare finger sketches the next operation on the screen, the floor turning through the window
      const plan = p('s11-plan');
      return svg(<g>
        <rect x={80} y={300} width={920} height={560} rx={50} fill="#9fc4f0" stroke="#5f9a7e" strokeWidth={26} />
        <g clipPath="url(#rz-os)"><defs><clipPath id="rz-os"><rect x={94} y={314} width={892} height={532} rx={38} /></clipPath></defs>
          <g transform="translate(0 -560)"><Floor frame={frame} y={1300} turning legs={false} rail={false} /></g>
          <PipeArm x={820} y={740} s={0.4} frame={frame} facing={-1} swing={0.7 + 0.2 * Math.sin(frame / 30)} mood="happy" pipeLen={300} />
        </g>
        <g transform="translate(330 880) scale(0.85)">
          <rect x={-20} y={-20} width={760} height={460} rx={40} fill="#1b1d3a" stroke="#5b628f" strokeWidth={6} />
          <rect x={0} y={0} width={720} height={420} rx={30} fill="#2a6f8f" />
          <text x={40} y={70} fontFamily={FONT.body} fontWeight={900} fontSize={40} fill="#e8fbff">NEXT OPERATION</text>
          {[0, 1, 2].map((i) => <g key={i} transform={`translate(${110 + i * 240} 240)`} opacity={clamp01(plan * 3 - i)}>
            <rect x={-80} y={-60} width={160} height={120} rx={30} fill="#e8fbff" opacity={0.92} />
            {i === 0 && <Tube x1={0} y1={-34} x2={0} y2={34} w={22} c="#c98a52" />}
            {i === 1 && <path d="M-30 20 L-10 -20 L30 -30" stroke="#f07a2a" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
            {i === 2 && <path d="M-26 0 L-6 22 L28 -24" stroke="#2fa36a" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          </g>)}
          <path d="M190 240 L270 240 M430 240 L510 240" stroke="#ffd45c" strokeWidth={10} strokeLinecap="round" opacity={clamp01(plan * 2)} />
        </g>
        {since('s11-ask') >= 0 && <g transform={`translate(760 600) scale(${easeOutBack(clamp01(since('s11-ask') / 0.5), 1.8)}) rotate(${Math.sin(frame / 8) * 6})`}>
          <circle r={110} fill="#f07a2a" stroke={line('#f07a2a')} strokeWidth={8} />
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={160} fill="#fff4dc">?</text>
        </g>}
        {hand(120, 2300, 2.4, {pose: since('s11-ask') >= 0 ? 'think' : 'point'}, since('s11-ask') >= 0 ? 'thinking' : 'determined', 0.85)}
      </g>);
    }
    case 'bench-hats': {
      // the doghouse bench: the crew's hard hats land in the same row as before, the driller and the floorhand behind them
      const crew = p('s10-crew');
      return svg(<g>
        <rect x={-40} y={300} width={1160} height={1700} fill="#5f9a7e" opacity={0.85} />
        <rect x={600} y={420} width={420} height={320} rx={40} fill="#9fd0f0" stroke={line('#5f9a7e')} strokeWidth={10} />
        <g clipPath="url(#rz-bw)"><defs><clipPath id="rz-bw"><rect x={610} y={430} width={400} height={300} rx={32} /></clipPath></defs>
          <rect x={610} y={640} width={400} height={100} fill="#7d86a8" />
          <FarDerrick x={720} y={660} s={0.65} lit={1} frame={frame} />
          <PipeArm x={900} y={680} s={0.3} frame={frame} facing={-1} swing={0.6 + 0.3 * Math.sin(frame / 25)} mood="happy" pipeLen={280} />
        </g>
        <Figure frame={frame} x={330} y={1500} scale={1.35} {...DRILLER} pose="crossed" emotion="happy" turn={0.4} seed={19} />
        {hand(760, 1520, 1.35, crew > 0.6 ? move(since('s10-crew') - 0.9, 0, 'stand', 'point') : {pose: 'stand'}, crew > 0.6 ? 'surprised' : 'thinking', -0.4)}
        <rect x={60} y={1260} width={960} height={50} rx={24} fill="#8a6a4a" stroke={line('#8a6a4a')} strokeWidth={6} />
        {[160, 920].map((x) => <Tube key={x} x1={x} y1={1300} x2={x} y2={1520} w={22} c="#6a4a32" />)}
        {[0, 1, 2, 3].map((i) => { const on = clamp01((crew * 1.3 - i * 0.18) / 0.3);
          return <g key={i} transform={`translate(${230 + i * 200} ${1262 - (1 - easeOutBack(on, 1.6)) * 260}) scale(1.6)`} opacity={on}>
            <ContactShadow x={0} y={2} w={90} />
            <path d="M-34 0 Q-34 -44 0 -44 Q34 -44 34 0 Z" fill="#f4f4ef" stroke={line('#c8cfe0')} strokeWidth={5} />
            <rect x={-46} y={-6} width={92} height={14} rx={7} fill="#f4f4ef" stroke={line('#c8cfe0')} strokeWidth={4} /></g>; })}
        <Burst x={830} y={1200} p={(since('s10-crew') - 0.9) / 0.6} color="#ffcf6a" />
      </g>);
    }
    case 'glove-recoil': {
      // close: the greasy gloves snap back off the pipe as the orange jaws close on it
      const back = since('s1-gloves');
      const k = easeOutBack(clamp01(back / 0.35), 2.2);
      const jaw = clamp01(back / 0.25);
      return svg(<g>
        <Glow x={540} y={900} r={560} color="#ffcf6a" opacity={0.35} />
        <Tube x1={520} y1={-40} x2={520} y2={1960} w={150} c="#c98a52" />
        <Tube x1={520} y1={1180} x2={520} y2={1400} w={220} c="#b97a48" />
        {/* the jaws arriving from the left */}
        <Tube x1={-200} y1={640} x2={300} y2={720} w={120} c="#f07a2a" />
        {[-1, 1].map((sd) => <path key={sd} d={`M330 ${720 + sd * 60} Q${lerp(380, 430, jaw)} ${720 + sd * 150} ${lerp(420, 470, jaw)} ${720 + sd * 90}`}
          stroke={line('#9aa6c4')} strokeWidth={70} strokeLinecap="round" fill="none" />)}
        {[-1, 1].map((sd) => <path key={`j${sd}`} d={`M330 ${720 + sd * 60} Q${lerp(380, 430, jaw)} ${720 + sd * 150} ${lerp(420, 470, jaw)} ${720 + sd * 90}`}
          stroke={light('#9aa6c4', 0.25)} strokeWidth={46} strokeLinecap="round" fill="none" />)}
        {/* the gloved hands, on the pipe and then snapping back to the chest */}
        <g transform={`translate(${lerp(0, 330, k)} ${lerp(0, 240, k)}) rotate(${lerp(0, 25, k)} 640 760)`}>
          <Tube x1={1200} y1={820} x2={700} y2={760} w={110} c="#c2413a" />
          <Glove x={640} y={760} s={1.5} rot={-90} grease={0.9} />
        </g>
        <g transform={`translate(${lerp(0, 300, k)} ${lerp(0, 160, k)}) rotate(${lerp(0, 20, k)} 640 1040)`}>
          <Tube x1={1200} y1={1120} x2={700} y2={1040} w={110} c="#c2413a" />
          <Glove x={640} y={1040} s={1.5} rot={-90} grease={0.9} />
        </g>
        {back >= 0 && [0, 1, 2].map((i) => <path key={i} d={`M${700 + i * 40} ${620 + i * 200} q60 20 110 60`} stroke="#fff" strokeWidth={10}
          strokeLinecap="round" fill="none" opacity={clamp01(1 - back * 2)} />)}
        <Burst x={500} y={760} p={(back - 0.05) / 0.5} color="#ffcf6a" />
      </g>);
    }
    case 'sign-close': {
      // close on the placard as it swings on its wires: the hooded figure and the words, nobody in front of it
      const sign = since('s3-sign');
      return svg(<g>
        <Tube x1={-40} y1={560} x2={1120} y2={560} w={30} c="#f5c02c" />
        <Tube x1={-40} y1={1320} x2={1120} y2={1320} w={30} c="#f5c02c" />
        <g transform={`rotate(${sign >= 0 ? Math.sin(sign * 6) * 8 * Math.exp(-sign * 1.2) : 0} 540 560)`}>
          <RedZoneSignV2 x={540} y={900} scale={2.4} frame={frame} />
        </g>
        <Glow x={540} y={880} r={500} color="#ff5d5d" opacity={0.25 + 0.15 * Math.sin(frame / 8)} />
      </g>);
    }
    case 'path-screen': {
      // detail on the console: the planned path draws itself and the arm icon rides it, step by step
      const path = p('s7-path');
      const u = clamp01(path * 1.1);
      const P = (q: number) => ({x: (1 - q) * (1 - q) * 160 + 2 * (1 - q) * q * 540 + q * q * 920, y: (1 - q) * (1 - q) * 1250 + 2 * (1 - q) * q * 520 + q * q * 1100});
      const at = P(u);
      return svg(<g>
        <rect x={40} y={380} width={1000} height={1080} rx={60} fill="#1b1d3a" stroke="#5b628f" strokeWidth={8} />
        <rect x={70} y={410} width={940} height={1020} rx={44} fill="#16405a" />
        {Array.from({length: 9}, (_, i) => <path key={i} d={`M${110 + i * 110} 440 L${110 + i * 110} 1400`} stroke="#2a6f8f" strokeWidth={3} />)}
        {Array.from({length: 9}, (_, i) => <path key={`h${i}`} d={`M100 ${460 + i * 110} L980 ${460 + i * 110}`} stroke="#2a6f8f" strokeWidth={3} />)}
        <path d="M160 1250 Q540 520 920 1100" stroke="#ffffff" strokeWidth={10} strokeDasharray="6 26" strokeLinecap="round" fill="none" opacity={0.7} />
        <path d="M160 1250 Q540 520 920 1100" stroke="#ffd45c" strokeWidth={16} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={`${u} 1`} />
        {[0.25, 0.5, 0.75, 1].map((q) => { const c = P(q); return <circle key={q} cx={c.x} cy={c.y} r={u >= q ? 26 : 18} fill={u >= q ? '#9affb8' : '#2a6f8f'}
          stroke="#e8fbff" strokeWidth={5} />; })}
        <g transform={`translate(${at.x} ${at.y})`}><circle r={44} fill="#f07a2a" stroke="#fff" strokeWidth={8} />
          <path d="M-14 -4 L14 -4" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></g>
        <rect x={100} y={1000} width={0} height={0} />
        <text x={540} y={500} textAnchor="middle" fontFamily={FONT.body} fontWeight={900} fontSize={46} fill="#e8fbff">PLANNED PATH</text>
        <Burst x={920} y={1100} p={(since('s7-path') - 1.0) / 0.5} color="#9affb8" />
      </g>);
    }
    case 'tag-close': {
      // close: three red injury tags on the floor rail; on "about a third" one drops and lands on the rig floor and glows
      const k = since('s4-third');
      const fall = clamp01(k / 0.6);
      return svg(<g>
        <Floor frame={frame} y={1220} turning legs={false} />
        <Tube x1={-40} y1={520} x2={1120} y2={520} w={26} c="#f5c02c" />
        <HazardTag x={260} y={560} s={2.0} swing={Math.sin(frame / 14)} />
        <HazardTag x={540} y={560} s={2.0} swing={Math.sin(frame / 14 + 1)} />
        <g transform={`translate(0 ${easeOutBack(fall, 0.8) * 560})`}><HazardTag x={820} y={560} s={2.0} swing={k >= 0 ? Math.sin(k * 8) * Math.exp(-k * 2) * 3 : 0} /></g>
        {fall >= 1 && <Glow x={820} y={1280} r={300} color="#ff5d5d" opacity={0.55 + 0.2 * Math.sin(frame / 6)} />}
        <Burst x={820} y={1260} p={(k - 0.5) / 0.6} color="#ff8a8a" />
      </g>);
    }
    case 'sun-sky': {
      // six days pass over the rig: six suns arc across the sky one after another while the little rig keeps drilling
      const k = since('s9-suns');
      return svg(<g>
        <path d="M-40 1300 L1120 1300 L1120 1960 L-40 1960 Z" fill="#e3cfa4" />
        <FarDerrick x={540} y={1320} s={1.5} lit={1} frame={frame} />
        <PipeArm x={760} y={1320} s={0.45} frame={frame} facing={-1} swing={0.6 + 0.3 * Math.sin(frame / 25)} mood="happy" pipeLen={300} />
        <path d="M120 1200 Q540 260 960 1200" stroke="#fff4dc" strokeWidth={6} strokeDasharray="16 16" fill="none" opacity={0.6} />
        {Array.from({length: 6}, (_, i) => { const u = i / 5; const x = (1 - u) * (1 - u) * 120 + 2 * (1 - u) * u * 540 + u * u * 960;
          const y = (1 - u) * (1 - u) * 1200 + 2 * (1 - u) * u * 260 + u * u * 1200;
          return <SunTick key={i} x={x} y={y} r={56} on={k < 0 ? 0 : clamp01((k - i * 0.25) / 0.2)} />; })}
      </g>);
    }
    default:
      return svg(<g><Floor frame={frame} /><PipeArm x={760} y={1380} s={0.9} frame={frame} facing={-1} swing={0.7} /></g>);
  }
};
