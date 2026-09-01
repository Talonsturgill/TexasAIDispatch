import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT, wrapToWidth} from './lib/type';

type Cue = {id: string; start: number; end: number; text: string};

type AlloyScene = {
  id: string;
  start_s: number;
  duration_s: number;
  super?: string;
  caption?: string;
  story_role?: string;
};

export type AlloyLoopProps = {
  scenes: AlloyScene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
};

const C = {
  ink: '#071019', paper: '#efe8d8', quiet: '#a9b9b5', line: '#607b78',
  maroon: '#7b2636', rust: '#d36d3f', hot: '#ffb755', teal: '#6fc3b3',
  blue: '#19344b', blue2: '#102336', red: '#ef6b55',
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const phase = (p: number, a: number, b: number) => ease(clamp((p - a) / (b - a)));

const Blueprint: React.FC<{f: number}> = ({f}) => (
  <>
    <defs>
      <radialGradient id="alloyGlow" cx="50%" cy="42%" r="62%">
        <stop offset="0" stopColor="#224c61" stopOpacity="0.68" />
        <stop offset="0.55" stopColor="#112b3e" stopOpacity="0.36" />
        <stop offset="1" stopColor="#071019" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="couponMetal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff4d8" />
        <stop offset="0.24" stopColor="#c7d3cc" />
        <stop offset="0.55" stopColor="#748985" />
        <stop offset="0.78" stopColor="#edf0e8" />
        <stop offset="1" stopColor="#596c6b" />
      </linearGradient>
      <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
        <path d="M54 0H0V54" fill="none" stroke="#76908c" strokeWidth="1" opacity="0.15" />
        <circle cx="0" cy="0" r="2" fill="#9ab0aa" opacity="0.18" />
      </pattern>
    </defs>
    <rect width="1080" height="1920" fill={C.ink} />
    <rect width="1080" height="1920" fill="url(#alloyGlow)" />
    <rect width="1080" height="1920" fill="url(#grid)"
      transform={`translate(${(f * 0.12) % 54} ${(f * 0.05) % 54})`} />
    <path d="M0 1510 C240 1430 380 1500 545 1450 C750 1390 884 1460 1080 1375"
      fill="none" stroke="#7b2636" strokeWidth="4" opacity="0.42" />
    <path d="M0 1532 C240 1452 380 1522 545 1472 C750 1412 884 1482 1080 1397"
      fill="none" stroke="#d36d3f" strokeWidth="2" opacity="0.28" />
    <g opacity="0.24" transform="translate(790 1310)">
      <path d="M0 150 V28 M0 48 C-44 8 -85 20 -104 62 C-55 78 -18 70 0 48 M0 84 C42 44 84 52 104 92 C58 110 22 104 0 84"
        fill="none" stroke="#a9b9b5" strokeWidth="5" />
      <path d="M-134 151 H142" stroke="#a9b9b5" strokeWidth="6" />
    </g>
  </>
);

const Coupon: React.FC<{x: number; y: number; p: number; hot?: number; label?: string;
  scale?: number; rotate?: number}> = ({x, y, p, hot = 0, label, scale = 1, rotate = 0}) => {
  const squash = 1 - 0.08 * Math.sin(p * Math.PI * 2);
  return (
    <g data-item-id="alloy-coupon"
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale * squash} ${scale})`}>
      <ellipse rx="92" ry="92" fill={C.hot} opacity={hot * 0.25} filter="url(#softGlow)" />
      <path d="M-76 -46 L58 -46 L82 -22 L82 48 L-62 48 L-82 28 L-82 -28 Z"
        fill={hot > 0.5 ? C.hot : 'url(#couponMetal)'} stroke={hot > 0.5 ? '#ffe0a0' : '#17282c'}
        strokeWidth="7" />
      <path d="M-62 -26 H54 M-62 -8 H34" stroke="#fff" strokeWidth="3" opacity="0.28" />
      {label && <text x="0" y="13" textAnchor="middle" fontFamily={FONT.body}
        fontSize={label.length > 10 ? 12 : 19}
        fontWeight="800" letterSpacing="2" fill={C.ink}>{label}</text>}
    </g>
  );
};

const FlowPath: React.FC<{progress: number; broken?: boolean}> = ({progress, broken = false}) => {
  const length = broken ? 760 : 980;
  return (
    <g>
      <path d="M110 935 C170 610 410 420 632 520 C868 626 932 892 820 1125 C698 1376 348 1400 184 1168"
        fill="none" stroke="#354d52" strokeWidth="19" strokeLinecap="round" />
      <path d="M110 935 C170 610 410 420 632 520 C868 626 932 892 820 1125 C698 1376 348 1400 184 1168"
        fill="none" stroke={C.teal} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${length * progress} 1600`}
        opacity="0.9" />
      {broken && <path d="M150 1098 l34 70 l-76 8" fill={C.ink} stroke={C.red} strokeWidth="5" />}
    </g>
  );
};

const Node: React.FC<{x: number; y: number; title: string; icon: 'fire'|'arm'|'bath'|'test'|'eye'|'data';
  active: number}> = ({x, y, title, icon, active}) => (
  <g transform={`translate(${x} ${y})`} opacity={0.35 + active * 0.65}>
    <circle r="68" fill="#102635" stroke={active > 0.5 ? C.hot : C.line} strokeWidth="5" />
    {icon === 'fire' && <path d="M0 38 C-44 10 -21 -15 -4 -48 C3 -17 34 -9 26 22 C20 42 0 48 0 48 C10 24 -6 16 -4 -5 C-25 19 -16 37 0 38Z" fill={C.hot} />}
    {icon === 'arm' && <path d="M-35 35 H-5 L9 4 L-9 -17 L15 -38 L32 -21 L19 -5 L39 24" fill="none" stroke={C.hot} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />}
    {icon === 'bath' && <><path d="M-40 -18 H40 V27 Q0 48 -40 27Z" fill="none" stroke={C.teal} strokeWidth="8" /><path d="M-28 2 Q-14 -7 0 2 T28 2" fill="none" stroke={C.teal} strokeWidth="5" /></>}
    {icon === 'test' && <><path d="M-38 -36 V35 M38 -36 V35 M-38 -7 H38" stroke={C.hot} strokeWidth="8" /><path d="M0 -34 V12" stroke={C.paper} strokeWidth="8" /><path d="M-20 28 H20" stroke={C.paper} strokeWidth="7" /></>}
    {icon === 'eye' && <><path d="M-46 0 Q0 -38 46 0 Q0 38 -46 0Z" fill="none" stroke={C.teal} strokeWidth="7" /><circle r="15" fill={C.hot} /></>}
    {icon === 'data' && <><path d="M-35 28 L-14 -6 L6 8 L35 -34" fill="none" stroke={C.hot} strokeWidth="8" /><circle cx="-35" cy="28" r="7" fill={C.paper} /><circle cx="35" cy="-34" r="7" fill={C.paper} /></>}
    <text y="103" textAnchor="middle" fontFamily={FONT.body} fontSize="21" fontWeight="800"
      letterSpacing="2" fill={C.paper}>{title}</text>
  </g>
);

const Hand: React.FC<{p: number}> = ({p}) => {
  const x = interpolate(phase(p, 0.05, 0.7), [0, 1], [1220, 650]);
  const y = interpolate(phase(p, 0.05, 0.7), [0, 1], [1220, 1028]);
  return (
    <g data-item-id="researcher" transform={`translate(${x} ${y}) rotate(-19)`}>
      <path d="M0 0 C90 -18 160 22 230 88 L188 174 C120 120 72 104 0 100Z"
        fill="#8f5d45" stroke="#201b1b" strokeWidth="7" />
      <rect x="-144" y="37" width="170" height="23" rx="11" fill="#e5b75d" stroke="#352717" strokeWidth="5" />
      <path d="M-150 38 l-31 11 l31 11Z" fill="#ddd1ba" stroke="#352717" strokeWidth="4" />
    </g>
  );
};

const TitleBlock: React.FC<{scene: AlloyScene; p: number}> = ({scene, p}) => {
  const op = Math.min(phase(p, 0.02, 0.13), 1 - phase(p, 0.88, 1));
  const lines = scene.caption ? wrapToWidth(scene.caption, 760, 27) : [];
  const titleSize = (scene.super?.length ?? 0) > 28 ? 39 :
    (scene.super?.length ?? 0) > 22 ? 46 : 58;
  return (
    <g opacity={op}>
      <text x="64" y="158" fontFamily={FONT.display} fontSize={titleSize} fontWeight="760"
        fill={C.paper}>{scene.super}</text>
      <rect x="64" y="188" width="126" height="6" fill={C.rust} />
      {lines.slice(0, 3).map((line, i) => <text key={line + i} x="64" y={232 + i * 34}
        fontFamily={FONT.body} fontSize="27" fill={C.quiet}>{line}</text>)}
      <text x="960" y="342" textAnchor="end" fontFamily={FONT.body} fontSize="17"
        letterSpacing="3" fill={C.teal}>BRAZOS COUNTY</text>
    </g>
  );
};

const Captions: React.FC<{cues: Cue[]; t: number}> = ({cues, t}) => {
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const lines = wrapToWidth(cue.text, 850, 34).slice(0, 3);
  return (
    <g>
      <rect x="54" y={1670 - (lines.length - 1) * 40} width="900"
        height={92 + (lines.length - 1) * 40} rx="18" fill="#061019" opacity="0.92" />
      {lines.map((line, i) => <text key={line + i} x="88" y={1728 - (lines.length - 1) * 20 + i * 42}
        fontFamily={FONT.body} fontSize="34" fontWeight="650" fill="#fff7e7">{line}</text>)}
    </g>
  );
};

const SceneArt: React.FC<{index: number; p: number; frame: number}> = ({index, p, frame}) => {
  const q = phase(p, 0.05, 0.86);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 10);
  if (index === 0) {
    const fall = phase(p, 0.02, 0.45);
    const cool = phase(p, 0.48, 0.9);
    return <g>
      <path d="M540 300 C488 390 474 468 540 535 C606 468 592 390 540 300Z"
        fill={C.hot} opacity={1 - cool} transform={`translate(0 ${fall * 460}) scale(${1 - fall * 0.34})`} />
      <circle cx="540" cy="1050" r={120 + pulse * 22} fill={C.hot} opacity={(1 - cool) * 0.18} filter="url(#softGlow)" />
      <Coupon x={540} y={1050} p={p} hot={1 - cool} scale={1.55} rotate={-3 + p * 6} />
      <path d="M220 1238 H860" stroke={C.line} strokeWidth="3" strokeDasharray="9 12" />
      <text x="540" y="1330" textAnchor="middle" fontFamily={FONT.body} fontSize="22"
        letterSpacing="5" fill={C.quiet}>THE SAMPLE CARRIES THE STORY</text>
    </g>;
  }
  if (index === 1) {
    const draw = phase(p, 0.05, 0.7);
    return <g>
      <path d="M160 475 H920 V1345 H160Z" fill="#0b1a28" stroke={C.line} strokeWidth="5"
        strokeDasharray={`${draw * 2800} 3000`} />
      <path d="M270 680 H810 M270 930 H810 M430 475 V1345 M690 475 V1345"
        stroke={C.line} strokeWidth="3" opacity={draw * 0.7} />
      <FlowPath progress={draw} />
      <Coupon x={210 + draw * 185} y={1040 - draw * 260} p={p} scale={0.92} />
      <g data-item-id="award-record" transform={`translate(548 820) scale(${0.8 + draw * 0.2})`}>
        <rect x="-188" y="-82" width="376" height="164" rx="8" fill="#eee7d8" stroke={C.maroon} strokeWidth="8" />
        <text y="-15" textAnchor="middle" fontFamily={FONT.body} fontSize="25" fontWeight="900" fill={C.maroon}>AGREEMENT STARTS</text>
        <text y="35" textAnchor="middle" fontFamily={FONT.body} fontSize="19" letterSpacing="3" fill={C.ink}>BUILD THE LOOP</text>
      </g>
    </g>;
  }
  if (index === 2) {
    return <g>
      <FlowPath progress={q * 0.45} />
      <Node x={235} y={690} title="MELT" icon="fire" active={phase(p, 0.05, 0.35)} />
      <Node x={525} y={505} title="SHAPE" icon="arm" active={phase(p, 0.22, 0.5)} />
      <Node x={815} y={700} title="HEAT-TREAT" icon="bath" active={phase(p, 0.42, 0.7)} />
      <Node x={790} y={1090} title="TEST" icon="test" active={phase(p, 0.62, 0.9)} />
      <Coupon x={210 + 575 * q} y={770 + Math.sin(q * Math.PI) * -130 + q * 280}
        p={p} hot={Math.max(0, 1 - q * 1.8)} scale={0.78} rotate={q * 95} />
    </g>;
  }
  if (index === 3) {
    const pick = phase(p, 0.48, 0.82);
    return <g>
      <FlowPath progress={q * 0.7} />
      <Coupon x={286} y={930} p={p} scale={0.9} />
      <Node x={525} y={760} title="READ RESULT" icon="eye" active={phase(p, 0.05, 0.34)} />
      <Node x={790} y={1035} title="CHOOSE NEXT" icon="data" active={pick} />
      <path d={`M350 905 C440 870 466 792 500 788 M590 810 C690 820 708 930 748 985`}
        fill="none" stroke={C.teal} strokeWidth="7" strokeDasharray={`${q * 700} 800`} />
      {[0,1,2].map((n) => <g key={n} opacity={phase(p, 0.25 + n * 0.09, 0.5 + n * 0.09)}
        transform={`translate(${690 + n * 74} ${820 + (n - 1) * 64})`}>
        <rect x="-28" y="-18" width="56" height="36" rx="6" fill={n === 1 && pick > 0.5 ? C.hot : C.blue}
          stroke={n === 1 && pick > 0.5 ? C.hot : C.line} strokeWidth="4" />
      </g>)}
    </g>;
  }
  if (index === 4) {
    const inside = phase(p, 0.1, 0.75);
    return <g>
      <FlowPath progress={inside} />
      <g transform="translate(540 910)">
        <circle r="320" fill="none" stroke={C.line} strokeWidth="3" strokeDasharray="12 15" />
        {['FABRICATE','CHARACTERIZE','COMPUTE'].map((x, i) => {
          const a = -Math.PI / 2 + i * Math.PI * 2 / 3 + inside * 0.45;
          return <g key={x} transform={`translate(${Math.cos(a) * 250} ${Math.sin(a) * 250})`}>
            <rect x="-100" y="-42" width="200" height="84" rx="42" fill="#102635" stroke={C.teal} strokeWidth="4" />
            <text y="8" textAnchor="middle" fontFamily={FONT.body} fontSize="18" fontWeight="800" fill={C.paper}>{x}</text>
          </g>;
        })}
        <Coupon x={0} y={0} p={p} scale={1.08} rotate={inside * 140} label="ROUTINE" />
      </g>
    </g>;
  }
  if (index === 5) {
    const stop = phase(p, 0.05, 0.35);
    const write = phase(p, 0.28, 0.82);
    return <g>
      <FlowPath progress={0.82} broken />
      <Coupon x={190 + stop * 650} y={1155 - stop * 50} p={p} scale={0.84} />
      <g data-item-id="judgment-card" transform="translate(520 745)">
        <rect x="-238" y="-142" width="476" height="284" rx="16" fill="#efe8d8" stroke={C.maroon} strokeWidth="7" />
        <text x="-190" y="-76" fontFamily={FONT.body} fontSize="21" letterSpacing="3" fill={C.maroon}>HUMAN JUDGMENT</text>
        <path d="M-188 -32 H188 M-188 20 H188 M-188 72 H96" stroke="#63716f" strokeWidth="3" />
        <path d="M-185 -42 C-80 -80 20 -48 178 -90" fill="none" stroke={C.rust} strokeWidth="7"
          strokeDasharray={`${write * 430} 500`} />
        <text x="-184" y="120" fontFamily={FONT.body} fontSize="18" fill={C.ink}>HYPOTHESIS · INTERPRETATION · DECISION</text>
      </g>
      <Hand p={p} />
    </g>;
  }
  if (index === 6) {
    const fade = phase(p, 0.18, 0.72);
    return <g>
      <g opacity={1 - fade * 0.72}>
        <FlowPath progress={0.88} broken />
        <Node x={260} y={720} title="MELT" icon="fire" active={0.6} />
        <Node x={535} y={540} title="SHAPE" icon="arm" active={0.6} />
        <Node x={810} y={720} title="TEST" icon="test" active={0.6} />
        <Coupon x={540} y={1070} p={p} scale={0.9} />
      </g>
      <g data-item-id="status-card" opacity={phase(p, 0.32, 0.62)} transform="translate(540 930)">
        <rect x="-360" y="-180" width="720" height="360" rx="18" fill="#071019" stroke={C.red} strokeWidth="8" />
        <text y="-45" textAnchor="middle" fontFamily={FONT.display} fontSize="56" fontWeight="760" fill={C.paper}>PLANNED</text>
        <text y="38" textAnchor="middle" fontFamily={FONT.body} fontSize="30" fontWeight="850" letterSpacing="5" fill={C.red}>NOT OPERATING</text>
        <text y="112" textAnchor="middle" fontFamily={FONT.body} fontSize="21" fill={C.quiet}>THE AGREEMENT BEGINS THE BUILD</text>
      </g>
    </g>;
  }
  if (index === 7) {
    const converge = phase(p, 0.08, 0.62);
    const cards = [
      {x: 148, y: 580, label: 'UNIVERSITY'},
      {x: 540, y: 470, label: 'NATIONAL LAB'},
      {x: 932, y: 580, label: 'INDUSTRY'},
    ];
    return <g>
      {cards.map((c, i) => {
        const tx = c.x + (540 - c.x) * converge * 0.55;
        const ty = c.y + (920 - c.y) * converge * 0.45;
        return <g key={c.label} transform={`translate(${tx} ${ty})`}>
          <rect x="-112" y="-48" width="224" height="96" rx="12" fill="#102635" stroke={C.teal} strokeWidth="4" />
          <text y="8" textAnchor="middle" fontFamily={FONT.body} fontSize="18" fontWeight="800" fill={C.paper}>{c.label}</text>
          <path d="M0 50 C0 145 0 186 0 242" fill="none" stroke={C.teal} strokeWidth="3"
            strokeDasharray={`${converge * 280} 300`} opacity="0.7" />
          {i === 1 && <path d="M-26 -73 q26 -26 52 0 M-15 -61 q15 -14 30 0" fill="none" stroke={C.hot} strokeWidth="4" />}
        </g>;
      })}
      <g data-item-id="review-gate" transform={`translate(540 1160) scale(${0.82 + converge * 0.18})`}>
        <rect x="-300" y="-118" width="600" height="236" rx="18" fill="#efe8d8" stroke={C.maroon} strokeWidth="8" />
        <text y="-28" textAnchor="middle" fontFamily={FONT.display} fontSize="43" fontWeight="760" fill={C.maroon}>COMPETITIVE REVIEW</text>
        <text y="48" textAnchor="middle" fontFamily={FONT.body} fontSize="22" letterSpacing="3" fill={C.ink}>USER CALL · WATCH NEXT</text>
      </g>
    </g>;
  }
  if (index === 8) {
    const open = phase(p, 0.06, 0.42);
    const lock = phase(p, 0.48, 0.82);
    return <g>
      <g data-item-id="public-record" transform={`translate(540 ${520 + open * 120}) scale(${0.82 + open * 0.18})`}>
        <rect x="-350" y="-180" width="700" height="360" rx="14" fill="#efe8d8" stroke={C.maroon} strokeWidth="8" />
        <text x="-290" y="-105" fontFamily={FONT.body} fontSize="21" fontWeight="900" letterSpacing="4" fill={C.maroon}>PUBLIC RECORD</text>
        <path d="M-290 -55 H290 M-290 5 H290 M-290 65 H290" stroke="#79827c" strokeWidth="4" opacity="0.55" />
        <rect x="-305" y="82" width={610 * open} height="68" rx="7" fill={C.hot} opacity="0.18" />
        <text x="0" y="129" textAnchor="middle" fontFamily={FONT.display} fontSize="41" fontWeight="760" fill={C.ink}>COMPETITIVE REVIEW</text>
      </g>
      <path d="M540 1012 V1110" stroke={C.teal} strokeWidth="8" strokeDasharray={`${lock * 98} 110`} />
      <g data-item-id="review-record" transform={`translate(540 1240) scale(${0.84 + lock * 0.16})`}>
        <rect x="-300" y="-104" width="600" height="208" rx="18" fill="#071019" stroke={lock > 0.75 ? C.hot : C.line} strokeWidth="8" />
        <text y="-20" textAnchor="middle" fontFamily={FONT.body} fontSize="22" letterSpacing="4" fill={C.quiet}>ACCESS METHOD</text>
        <text y="48" textAnchor="middle" fontFamily={FONT.display} fontSize="43" fontWeight="760" fill={C.paper}>STATED IN THE RECORD</text>
      </g>
    </g>;
  }
  const stamp = phase(p, 0.34, 0.6);
  return <g>
    <FlowPath progress={phase(p, 0.03, 0.65)} />
    <Coupon x={540} y={900} p={p} scale={1.58} label={stamp > 0.55 ? 'NEXT QUESTION' : undefined}
      rotate={-4 + p * 8} />
    <g opacity={phase(p, 0.55, 0.8)}>
      <text x="540" y="1218" textAnchor="middle" fontFamily={FONT.display} fontSize="48"
        fontWeight="760" fill={C.paper}>WHO ASKS FIRST?</text>
      <text x="540" y="1282" textAnchor="middle" fontFamily={FONT.body} fontSize="22"
        letterSpacing="5" fill={C.teal}>FOLLOW THE RECORD</text>
    </g>
  </g>;
};

const Credits: React.FC<{text: string; p: number}> = ({text, p}) => {
  const rows = text.split('\n').map((s) => s.trim()).filter(Boolean);
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920">
    <Blueprint f={0} />
    <g opacity={phase(p, 0.04, 0.18)}>
      <Coupon x={540} y={360} p={p} scale={0.86} label="NEXT QUESTION" />
      {rows.map((row, i) => <text key={row + i} x="540" y={650 + i * 46} textAnchor="middle"
        fontFamily={FONT.body} fontSize={row === row.toUpperCase() ? 25 : Math.max(12, Math.min(20, 860 / Math.max(1, row.length * 0.56)))}
        fontWeight={row === row.toUpperCase() ? 850 : 520}
        letterSpacing={row === row.toUpperCase() ? 3 : 0}
        fill={row === row.toUpperCase() ? C.rust : C.paper}>{row}</text>)}
    </g>
  </svg>;
};

export const AlloyLoopEpisode: React.FC<AlloyLoopProps> = ({scenes, captions = [], credits = '', credits_s = 5}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const end = scenes.reduce((m, s) => Math.max(m, s.start_s + s.duration_s), 0);
  if (t >= end && credits.trim()) {
    return <Credits text={credits} p={clamp((t - end) / Math.max(credits_s, 0.01))} />;
  }
  const index = Math.max(0, scenes.findIndex((s) => t >= s.start_s && t < s.start_s + s.duration_s));
  const scene = scenes[index] ?? scenes[0];
  const p = scene ? clamp((t - scene.start_s) / scene.duration_s) : 0;
  return <div style={{position: 'absolute', inset: 0, background: C.ink}}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <Blueprint f={f} />
      <SceneArt index={index} p={p} frame={f} />
      {scene && <TitleBlock scene={scene} p={p} />}
      <Captions cues={captions} t={t} />
      <rect x="0" y="0" width="1080" height="1920" fill="none" stroke="#d36d3f" strokeWidth="6" opacity="0.3" />
    </svg>
  </div>;
};
