import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Cue, Scene} from './Dispatch';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import {FONT} from './lib/type';

const NIGHT = '#08131d';
const STORM = '#172936';
const SLATE = '#263d49';
const LIMESTONE = '#b6ab94';
const MUD = '#5a4a37';
const CYAN = '#4ce2e1';
const CORAL = '#ff765d';
const AMBER = '#f5bc63';
const PAPER = '#f5efe3';
const DIM = '#78909b';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (f: number, a: number, b: number) => interpolate(
  f,
  [a, b],
  [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
);

const sceneItem = (scene: Scene, id: string) => {
  for (const plane of scene.planes ?? []) {
    for (const item of plane.items ?? []) {
      if (item.id === id) return item as unknown as {props?: Record<string, unknown>};
    }
  }
  return undefined;
};

const rows = (scene: Scene, id: string): string[][] => {
  const value = sceneItem(scene, id)?.props?.rows;
  return Array.isArray(value) ? value as string[][] : [];
};

const cameraMove = (name: Scene['camera_strategy'] | undefined, p: number) => {
  if (name === 'riseWith') return `translateY(${-32 * p}px) scale(${1 + 0.035 * p})`;
  if (name === 'craneDown') return `translateY(${-34 + 34 * p}px) scale(${1.02 - 0.01 * p})`;
  if (name === 'truckAcross') return `translateX(${-30 + 60 * p}px) scale(1.025)`;
  if (name === 'orbitReveal') return `translateX(${18 * (p - 0.5)}px) rotate(${1.1 * (p - 0.5)}deg) scale(1.02)`;
  return `scale(${1 + 0.055 * p}) translateY(${8 * p}px)`;
};

const Rain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.36}) => (
  <g opacity={opacity} stroke={PAPER} strokeWidth="3" strokeLinecap="round">
    {Array.from({length: 42}).map((_, i) => {
      const x = (i * 83 + 41) % 1160 - 40;
      const y = (i * 137 + frame * (12 + i % 4)) % 2060 - 100;
      return <path key={i} d={`M${x} ${y} l-24 56`} opacity={0.25 + (i % 5) * 0.1} />;
    })}
  </g>
);

const StormWorld: React.FC<{frame: number; water?: number; flash?: number}> = ({
  frame, water = 0.18, flash = 0,
}) => {
  const wave = Math.sin(frame / 8) * 8;
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="lfn-sky" x2="0" y2="1">
          <stop stopColor={NIGHT} />
          <stop offset="0.58" stopColor={STORM} />
          <stop offset="1" stopColor="#3c4d51" />
        </linearGradient>
        <linearGradient id="lfn-water" x2="0" y2="1">
          <stop stopColor="#7e7158" stopOpacity="0.92" />
          <stop offset="1" stopColor={MUD} />
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#lfn-sky)" />
      <g fill="#0b171d" opacity="0.94">
        <path d="M42 1070 C48 962 89 906 145 910 C194 914 220 966 218 1070Z" />
        <path d="M854 1050 C858 930 906 876 962 886 C1014 895 1038 948 1038 1050Z" />
        <path d="M70 955 C120 905 182 908 236 968 M884 934 C930 875 998 882 1042 946" fill="none" stroke="#0b171d" strokeWidth="24" strokeLinecap="round" />
      </g>
      <path d="M0 960 L148 900 L292 924 L420 864 L610 922 L750 848 L932 910 L1080 842 V1280 H0Z"
        fill="#101c24" opacity="0.82" />
      <path d="M0 1190 Q260 1128 540 1178 Q822 1226 1080 1154 V1600 H0Z" fill={LIMESTONE} opacity="0.72" />
      <path d="M0 1218 L190 1175 L318 1198 L468 1163 L622 1210 L808 1180 L1080 1208" fill="none" stroke="#ded1b7" strokeWidth="13" opacity="0.38" />
      <path d="M0 1290 Q260 1242 540 1288 Q810 1330 1080 1264 V1650 H0Z" fill="#30363a" />
      <path d="M0 1450 Q250 ${1425 + wave} 520 1452 T1080 ${1440 - wave} V1920 H0Z" fill="url(#lfn-water)" />
      <path d={`M0 ${1450 - water * 520} Q270 ${1418 - water * 510 + wave} 540 ${1450 - water * 520} T1080 ${1444 - water * 520 - wave} V1920 H0Z`}
        fill="#665843" opacity="0.96" />
      <path d={`M0 ${1450 - water * 520} Q270 ${1418 - water * 510 + wave} 540 ${1450 - water * 520} T1080 ${1444 - water * 520 - wave}`}
        fill="none" stroke={AMBER} strokeWidth="6" opacity="0.55" />
      <Rain frame={frame} />
      <rect width="1080" height="1920" fill={PAPER} opacity={flash * 0.2} />
    </svg>
  );
};

const Node: React.FC<{
  x?: number; y?: number; scale?: number; pulse?: number; water?: number; exploded?: number;
}> = ({x = 540, y = 1220, scale = 1, pulse = 1, water = 0, exploded = 0}) => {
  const beat = 0.76 + 0.24 * Math.sin(pulse * Math.PI * 2);
  const sensorY = [-30, 100, 230, 360];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="430" rx="170" ry="36" fill="#000" opacity="0.28" />
      <g transform={`translate(${-220 * exploded} ${-145 * exploded}) rotate(${-8 * exploded})`}>
        <path d="M-68-402 L88-430 L124-326 L-56-298 Z" fill="#193f51" stroke={CYAN} strokeWidth="9" />
        <path d="M-40-380 L98-405 M-26-340 L110-364 M18-414 L-4-316 M68-422 L47-324"
          stroke="#6cb6bd" strokeWidth="4" opacity="0.75" />
      </g>
      <rect x="-54" y="-305" width="108" height="716" rx="28" fill="#17242c" stroke={PAPER} strokeWidth="10" />
      <rect x="-78" y="-230" width="156" height="150" rx="22" fill="#263c47" stroke={CYAN} strokeWidth="7" />
      <rect x="-46" y="-198" width="92" height="86" rx="12" fill={NIGHT} stroke={DIM} strokeWidth="4" />
      <path d="M-28-156 H28 M0-184 V-128" stroke={CYAN} strokeWidth="7" strokeLinecap="round" />
      <g transform={`translate(${190 * exploded} ${-42 * exploded})`}>
        <rect x="-98" y="-22" width="72" height="148" rx="14" fill="#3a4650" stroke={AMBER} strokeWidth="7" />
        <path d="M-82 12 H-42 M-82 42 H-42 M-82 72 H-42" stroke={AMBER} strokeWidth="5" />
      </g>
      {sensorY.map((sy, i) => {
        const on = water > i / 4 || exploded > 0.25;
        return (
          <g key={sy} transform={`translate(${(i % 2 ? 154 : -154) * exploded} ${sy})`}>
            <circle cx={i % 2 ? 68 : -68} cy="0" r="28" fill={on ? CYAN : '#35444c'} stroke={PAPER} strokeWidth="6" />
            <circle cx={i % 2 ? 68 : -68} cy="0" r={on ? 56 * beat : 34} fill="none" stroke={CYAN} strokeWidth="5" opacity={on ? 0.42 : 0.08} />
          </g>
        );
      })}
      <circle cx="0" cy="-156" r={126 + beat * 22} fill="none" stroke={CYAN} strokeWidth="9" opacity={0.16 + beat * 0.18} />
      <path d="M0 410 V468" stroke={PAPER} strokeWidth="16" />
    </g>
  );
};

const Label: React.FC<{x: number; y: number; text: string; colour?: string; delay?: number; frame: number}> = ({
  x, y, text, colour = PAPER, delay = 0, frame,
}) => {
  const p = ease(frame, delay, delay + 16);
  return (
    <g opacity={p} transform={`translate(${(1 - p) * 28} 0)`}>
      <rect x={x} y={y - 38} width={Math.max(170, text.length * 17)} height="58" rx="14" fill={NIGHT} stroke={colour} strokeWidth="3" />
      <text x={x + 18} y={y} fill={colour} fontFamily={FONT.body} fontWeight="900" fontSize="22" letterSpacing="2">{text}</text>
    </g>
  );
};

const SceneChrome: React.FC<{scene: Scene; local: number}> = ({scene, local}) => {
  const p = ease(local, 3, 16);
  return (
    <>
      <div style={{position: 'absolute', left: 56, top: 54, right: 56, opacity: p}}>
        <div style={{display: 'flex', justifyContent: 'space-between', color: CYAN,
          fontFamily: FONT.body, fontWeight: 900, fontSize: 19, letterSpacing: 4}}>
          <span>TEXAS AI DOCKET</span><span>BEXAR COUNTY</span>
        </div>
        <div style={{marginTop: 18, height: 2, background: `linear-gradient(90deg, ${CYAN}, ${CORAL}, transparent)`}} />
        <div style={{marginTop: 32, color: PAPER, fontFamily: FONT.body, fontSize: 31,
          fontWeight: 950, letterSpacing: 3.4, lineHeight: 1.08, maxWidth: 920}}>{scene.super}</div>
        <div style={{marginTop: 13, color: AMBER, fontFamily: FONT.display, fontSize: 25,
          fontStyle: 'italic', maxWidth: 900}}>{scene.caption}</div>
      </div>
    </>
  );
};

const OutageScene: React.FC<{scene: Scene; local: number; frames: number}> = ({scene, local, frames}) => {
  const die = ease(local, 12, 34);
  const pulse = ease(local, 24, frames - 18);
  const water = 0.18 + ease(local, 18, frames - 8) * 0.3;
  const systemRows = rows(scene, 'outage-status');
  return (
    <>
      <StormWorld frame={local} water={water} flash={1 - die} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <path data-item-id="dark-crossing" d="M40 1392 Q310 1340 560 1372 T1040 1348" fill="none" stroke={LIMESTONE} strokeWidth="12" opacity="0.5" />
        <g data-item-id="live-node" transform={`translate(0 ${ease(local, 0, frames) * -24})`}>
          <Node x={640} y={1280} scale={0.98} pulse={local / 24} water={water} />
          <path data-item-id="grid-line" d="M680 860 C760 730 850 690 965 600" fill="none" stroke={CYAN} strokeWidth="9" opacity={pulse}
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pulse} />
        </g>
        <g data-item-id="outage-status" transform="translate(76 470)">
          {systemRows.map((row, i) => {
            const off = i < systemRows.length - 1;
            const reveal = ease(local, 5 + i * 8, 18 + i * 8);
            return (
              <g key={row[0]} opacity={reveal} transform={`translate(0 ${i * 88})`}>
                <rect width="360" height="68" rx="17" fill={NIGHT} stroke={off ? CORAL : CYAN} strokeWidth="4" />
                <circle cx="33" cy="34" r="10" fill={off ? CORAL : CYAN} opacity={off ? 1 - die * 0.35 : 0.72 + Math.sin(local / 5) * 0.28} />
                <text x="58" y="42" fill={PAPER} fontFamily={FONT.body} fontWeight="900" fontSize="21">{row[0]}</text>
                <text x="328" y="42" textAnchor="end" fill={off ? CORAL : CYAN} fontFamily={FONT.body} fontWeight="900" fontSize="21">{row[1]}</text>
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
};

const PrototypeScene: React.FC<{scene: Scene; local: number; frames: number}> = ({scene, local, frames}) => {
  const assemble = spring({frame: local - 18, fps: 30, config: {damping: 14, mass: 0.75}});
  const source = sceneItem(scene, 'utsa-source')?.props ?? {};
  return (
    <>
      <StormWorld frame={local} water={0.06} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="utsa-source" transform="translate(76 430)">
          <rect width="928" height="220" rx="28" fill={NIGHT} stroke={AMBER} strokeWidth="5" opacity={ease(local, 2, 20)} />
          <text x="36" y="64" fill={AMBER} fontFamily={FONT.body} fontSize="22" fontWeight="900" letterSpacing="4">OFFICIAL SOURCE</text>
          <text x="36" y="118" fill={PAPER} fontFamily={FONT.body} fontSize="35" fontWeight="950">{String(source.title ?? '')}</text>
          <text x="36" y="166" fill={CYAN} fontFamily={FONT.body} fontSize="24" fontWeight="900" letterSpacing="2">{String(source.count ?? '')}</text>
          <text x="892" y="166" textAnchor="end" fill={CORAL} fontFamily={FONT.body} fontSize="21" fontWeight="900">{String(source.sample ?? '')}</text>
        </g>
        <g data-item-id="bench-node"><Node x={555} y={1210} scale={0.83} pulse={local / 22} water={0.6} exploded={1 - clamp(assemble)} /></g>
        <g data-item-id="radio-mast"><Label x={710} y={1325} text="LORA RADIO" colour={AMBER} delay={54} frame={local} /></g>
        <Label x={90} y={920} text="AMBIENT LIGHT" colour={AMBER} delay={24} frame={local} />
        <Label x={720} y={990} text="ON-DEVICE AI" colour={CYAN} delay={34} frame={local} />
        <Label x={92} y={1230} text="WATER LEVELS" colour={CORAL} delay={44} frame={local} />
        <g data-item-id="builder" opacity={ease(local, 28, 48)} transform="translate(170 1360)">
          <circle cy="-170" r="38" fill={LIMESTONE} />
          <path d="M-62-112 Q0-152 62-112 L82 96 H-82Z" fill={CORAL} />
          <path d="M54-70 L178-138" stroke={LIMESTONE} strokeWidth="24" strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};

const PowerScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const charge = ease(local, 6, frames * 0.48);
  const outage = ease(local, frames * 0.46, frames * 0.72);
  const pulse = ease(local, frames * 0.58, frames - 12);
  return (
    <>
      <StormWorld frame={local} water={0.12} flash={0.2 * (1 - outage)} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="dead-transformer" opacity={1 - outage * 0.92}>
          <path d="M120 690 H330 L400 760 H520" fill="none" stroke={CORAL} strokeWidth="14" />
          <path d="M170 600 V760 M275 600 V760" stroke={CORAL} strokeWidth="11" />
          <text x="120" y="820" fill={CORAL} fontFamily={FONT.body} fontSize="24" fontWeight="900" letterSpacing="4">GRID</text>
        </g>
        <g data-item-id="power-loop" transform={`translate(${interpolate(charge, [0, 1], [-180, 0])} 0)`}>
          <path d="M94 480 L340 420 L388 585 L128 640 Z" fill="#1a5064" stroke={AMBER} strokeWidth="8" />
          <path d="M130 520 L354 468 M142 570 L370 518" stroke={CYAN} strokeWidth="4" />
          <text x="240" y="700" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="23" fontWeight="900">AMBIENT LIGHT</text>
        </g>
        <path d="M380 540 C520 580 500 780 620 800" fill="none" stroke={AMBER} strokeWidth="13" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - charge} strokeLinecap="round" />
        <g transform="translate(690 725)">
          <rect x="-170" y="-115" width="340" height="230" rx="36" fill={NIGHT} stroke={AMBER} strokeWidth="8" />
          <rect x="170" y="-38" width="25" height="76" rx="6" fill={AMBER} />
          <rect x="-136" y="-78" width={248 * charge} height="156" rx="21" fill={AMBER} opacity="0.82" />
          <text x="0" y="12" textAnchor="middle" fill={charge > 0.55 ? NIGHT : PAPER} fontFamily={FONT.body} fontSize="29" fontWeight="950">BATTERY + BACKUP</text>
        </g>
        <path d="M700 860 C700 1010 600 1010 585 1110" fill="none" stroke={CYAN} strokeWidth="12" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - pulse} />
        <g data-item-id="powered-node"><Node x={585} y={1320} scale={0.7} pulse={local / 20} water={0.55} /></g>
        <g opacity={outage}>
          <rect x="72" y="912" width="350" height="80" rx="18" fill={CORAL} />
          <text x="247" y="965" textAnchor="middle" fill={NIGHT} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="3">GRID OUT / NODE ON</text>
        </g>
      </svg>
    </>
  );
};

const WaterColumnScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const water = ease(local, 6, frames - 14);
  const marks = ['LOW', 'RISING', 'HIGH', 'WEATHER LIVE'];
  return (
    <>
      <StormWorld frame={local} water={0.12 + water * 0.66} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="level-node"><Node x={540} y={1300} scale={0.9} pulse={local / 20} water={water} /></g>
        <g data-item-id="level-readout">{marks.map((mark, i) => {
          const on = ease(local, 18 + i * 23, 30 + i * 23);
          const y = 1260 - i * 136;
          return (
            <g key={mark} opacity={0.28 + on * 0.72}>
              <path d={`M620 ${y} H910`} stroke={on > 0.2 ? CYAN : DIM} strokeWidth="5" strokeDasharray="13 11" />
              <rect x="756" y={y - 40} width="252" height="65" rx="16" fill={NIGHT} stroke={on > 0.2 ? CYAN : DIM} strokeWidth="4" />
              <text x="882" y={y + 4} textAnchor="middle" fill={on > 0.2 ? CYAN : DIM} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">{mark}</text>
            </g>
          );
        })}</g>
        <g data-item-id="flooded-crossing" opacity={ease(local, frames * 0.6, frames * 0.82)}>
          <path d="M90 1200 H320 M90 1110 H280 M90 1020 H240" stroke={AMBER} strokeWidth="7" strokeLinecap="round" />
          <text x="90" y="970" fill={AMBER} fontFamily={FONT.body} fontSize="21" fontWeight="900" letterSpacing="3">WATER RISES / LEVELS WAKE</text>
        </g>
      </svg>
    </>
  );
};

const ChipScene: React.FC<{local: number; frames: number; sever?: boolean}> = ({local, frames, sever = false}) => {
  const enter = ease(local, 5, frames * 0.45);
  const decide = ease(local, frames * 0.45, frames * 0.74);
  const cut = sever ? ease(local, 16, 45) : 0;
  const signals = [
    {label: 'WATER', y: 650, c: CYAN}, {label: 'RAIN', y: 790, c: AMBER},
    {label: 'LIGHT', y: 930, c: PAPER}, {label: 'HUMIDITY', y: 1070, c: CORAL},
  ];
  return (
    <>
      <StormWorld frame={local} water={0.32} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {signals.map((s, i) => {
          const p = ease(local, 6 + i * 9, 28 + i * 9);
          return (
            <g data-item-id="signal-stream" key={s.label} opacity={p}>
              <rect x="72" y={s.y - 38} width="210" height="72" rx="16" fill={NIGHT} stroke={s.c} strokeWidth="4" />
              <text x="177" y={s.y + 9} textAnchor="middle" fill={s.c} fontFamily={FONT.body} fontSize="23" fontWeight="900" letterSpacing="3">{s.label}</text>
              <path d={`M282 ${s.y} C390 ${s.y} 390 ${920 + i * 10} 470 ${920 + i * 10}`} fill="none" stroke={s.c} strokeWidth="7"
                pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            </g>
          );
        })}
        <g data-item-id="local-compute" transform={`translate(650 930) scale(${0.82 + enter * 0.18})`}>
          <rect x="-190" y="-190" width="380" height="380" rx="45" fill="#102832" stroke={CYAN} strokeWidth="12" />
          {Array.from({length: 9}).map((_, i) => <path key={i} d={`M${-160 + i * 40}-230 V-190 M${-160 + i * 40}190 V230 M-230 ${-160 + i * 40} H-190 M190 ${-160 + i * 40} H230`} stroke={AMBER} strokeWidth="7" />)}
          <circle data-item-id="compute-node" r={70 + 22 * Math.sin(local / 7)} fill={CYAN} opacity={0.12 + decide * 0.32} />
          <text x="0" y="-20" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="31" fontWeight="950">TINYML</text>
          <text x="0" y="30" textAnchor="middle" fill={CYAN} fontFamily={FONT.body} fontSize="22" fontWeight="900" letterSpacing="3">ON DEVICE</text>
        </g>
        <g data-item-id="risk-decision" opacity={ease(local, frames * 0.58, frames * 0.8)}>
          <rect x="280" y="1270" width="520" height="105" rx="24" fill={decide ? CYAN : NIGHT} stroke={CYAN} strokeWidth="6" />
          <text x="540" y="1338" textAnchor="middle" fill={decide ? NIGHT : PAPER} fontFamily={FONT.body} fontSize="29" fontWeight="950" letterSpacing="4">LOCAL RISK DECISION</text>
        </g>
        {sever && <g>
          <path d="M760 760 C860 650 900 560 1000 500" fill="none" stroke={DIM} strokeWidth="9" strokeDasharray="18 15" opacity={1 - cut} />
          <g opacity={cut}>
            <path d="M826 645 L922 548 M922 645 L826 548" stroke={CORAL} strokeWidth="17" strokeLinecap="round" />
            <rect x="720" y="410" width="310" height="82" rx="18" fill={NIGHT} stroke={CORAL} strokeWidth="4" />
            <text x="875" y="463" textAnchor="middle" fill={CORAL} fontFamily={FONT.body} fontSize="23" fontWeight="950" letterSpacing="3">DISTANT CLOUD / CUT</text>
          </g>
        </g>}
      </svg>
    </>
  );
};

const TopologyScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const breakAway = ease(local, 8, frames * 0.52);
  const close = ease(local, frames * 0.42, frames * 0.82);
  const remote = [
    {label: 'GRID', x: 118}, {label: 'CELL', x: 392}, {label: 'CLOUD', x: 666},
  ];
  return (
    <>
      <StormWorld frame={local} water={0.26} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="remote-status">
          {remote.map((r, i) => (
            <g key={r.label} transform={`translate(${r.x} ${520 - breakAway * (70 + i * 28)}) rotate(${breakAway * (i - 1) * 8})`} opacity={1 - breakAway * 0.72}>
              <rect width="240" height="92" rx="22" fill={NIGHT} stroke={CORAL} strokeWidth="5" />
              <text x="120" y="57" textAnchor="middle" fill={CORAL} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="4">{r.label} / OFF</text>
            </g>
          ))}
        </g>
        <g data-item-id="server-route">
          {remote.map((r, i) => (
            <path key={r.label} d={`M${r.x + 120} 612 C${r.x + 120} 760 ${440 + i * 55} 760 540 930`} fill="none" stroke={DIM} strokeWidth="8"
              strokeDasharray="18 15" opacity={1 - breakAway} />
          ))}
          <path d="M314 742 L412 840 M412 742 L314 840" stroke={CORAL} strokeWidth="15" strokeLinecap="round" opacity={breakAway} />
          <path d="M664 742 L762 840 M762 742 L664 840" stroke={CORAL} strokeWidth="15" strokeLinecap="round" opacity={breakAway} />
        </g>
        <g data-item-id="turn-node">
          <Node x={540} y={1240} scale={0.82} pulse={local / 16} water={0.58} />
          <ellipse cx="540" cy="1110" rx={220 + close * 72} ry={290 + close * 34} fill="none" stroke={CYAN} strokeWidth="12"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - close} opacity={0.2 + close * 0.8} />
        </g>
        <g data-item-id="local-result" opacity={ease(local, frames * 0.55, frames * 0.82)}>
          <rect x="184" y="1510" width="712" height="116" rx="30" fill={close ? CYAN : NIGHT} stroke={CYAN} strokeWidth="7" />
          <text x="540" y="1583" textAnchor="middle" fill={close ? NIGHT : PAPER} fontFamily={FONT.body} fontSize="30" fontWeight="950" letterSpacing="4">LOCAL DECISION / COMPLETE</text>
        </g>
      </svg>
    </>
  );
};

const RadioScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const flight = ease(local, 10, frames - 20);
  const alert = ease(local, frames * 0.58, frames * 0.8);
  const path = 'M250 1120 C390 770 620 800 835 1020';
  return (
    <>
      <StormWorld frame={local} water={0.38} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="radio-node"><Node x={220} y={1290} scale={0.62} pulse={local / 18} water={0.65} /></g>
        <path data-item-id="lora-path" d={path} fill="none" stroke={CORAL} strokeWidth="14" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - flight} strokeLinecap="round" />
        {[0.25, 0.45, 0.65].map((k) => <circle key={k} cx="220" cy="1110" r={flight * 150 * k} fill="none" stroke={CORAL} strokeWidth="5" opacity={0.5 * (1 - flight * k)} />)}
        <g transform={`translate(${250 + flight * 585} ${1120 - Math.sin(flight * Math.PI) * 310})`}>
          <path d="M-28-20 H24 L48 0 L24 20 H-28 L-48 0 Z" fill={CORAL} stroke={PAPER} strokeWidth="4" />
        </g>
        <g data-item-id="hub-alert" transform="translate(810 1050)">
          <rect x="-230" y="-150" width="460" height="300" rx="30" fill={NIGHT} stroke={alert ? CYAN : DIM} strokeWidth="9" />
          <rect x="-190" y="-98" width="380" height="150" rx="18" fill="#17313d" />
          <path d="M-150 4 C-90-42-44 48 8-12 S104-44 152 8" fill="none" stroke={alert ? CORAL : DIM} strokeWidth="12" />
          <circle cx="150" cy="-52" r={18 + alert * 9} fill={alert ? CORAL : DIM} />
          <path d="M0 150 V202 M-100 202 H100" stroke={PAPER} strokeWidth="15" strokeLinecap="round" />
          <text y="98" textAnchor="middle" fill={CYAN} fontFamily={FONT.body} fontSize="22" fontWeight="950" letterSpacing="3">LOCAL MONITORING CONSOLE</text>
        </g>
        <g data-item-id="dispatcher" opacity={alert} transform="translate(930 1430)">
          <circle cy="-150" r="34" fill={LIMESTONE} />
          <path d="M-54-92 Q0-132 54-92 L72 90 H-72Z" fill={SLATE} stroke={CYAN} strokeWidth="5" />
          <path d="M-42-54 L-130-130" stroke={LIMESTONE} strokeWidth="21" strokeLinecap="round" />
        </g>
        <g opacity={ease(local, 6, 24)}>
          <rect x="110" y="540" width="860" height="102" rx="24" fill={NIGHT} stroke={AMBER} strokeWidth="4" />
          <text x="540" y="604" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="28" fontWeight="950" letterSpacing="5">LORA REPORT / NOT CELLULAR</text>
        </g>
      </svg>
    </>
  );
};

const LimitScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const stamp = ease(local, 8, 32);
  const block = spring({frame: local - frames * 0.48, fps: 30, config: {damping: 13, mass: 0.7}});
  const travel = ease(local, 15, frames * 0.58) * (1 - clamp(block) * 0.2);
  return (
    <>
      <StormWorld frame={local} water={0.16} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <g data-item-id="bench-prototype" transform={`translate(${100 + travel * 320} 0)`}><Node x={220} y={1280} scale={0.67} pulse={local / 20} water={0.4} /></g>
        <path d="M170 1420 H900" stroke={CYAN} strokeWidth="10" strokeDasharray="20 17" opacity="0.55" />
        <g data-item-id="prototype-record" opacity={stamp} transform={`scale(${0.8 + stamp * 0.2})`}>
          <rect x="76" y="500" width="640" height="148" rx="24" fill={NIGHT} stroke={AMBER} strokeWidth="6" />
          <text x="396" y="558" textAnchor="middle" fill={AMBER} fontFamily={FONT.body} fontSize="27" fontWeight="950" letterSpacing="4">FIELD-READY PROTOTYPE</text>
          <text x="396" y="610" textAnchor="middle" fill={PAPER} fontFamily={FONT.body} fontSize="23" fontWeight="900">INITIAL MODEL VALIDATION</text>
        </g>
        <g data-item-id="empty-site" opacity={clamp(block)} transform={`translate(0 ${(1 - clamp(block)) * -170})`}>
          <path d="M760 870 C760 735 928 735 928 870 C928 1000 844 1088 844 1088 C844 1088 760 1000 760 870Z" fill={NIGHT} stroke={CORAL} strokeWidth="12" />
          <circle cx="844" cy="868" r="44" fill="none" stroke={CORAL} strokeWidth="9" />
          <path d="M700 780 L982 1060 M982 780 L700 1060" stroke={CORAL} strokeWidth="17" strokeLinecap="round" />
          <rect x="584" y="1125" width="420" height="88" rx="18" fill={CORAL} />
          <text x="794" y="1182" textAnchor="middle" fill={NIGHT} fontFamily={FONT.body} fontSize="25" fontWeight="950" letterSpacing="3">NO NAMED INSTALLATION</text>
        </g>
        <g data-item-id="measured-engineer" opacity={clamp(block)} transform="translate(880 1480)">
          <circle cy="-170" r="37" fill={LIMESTONE} />
          <path d="M-58-110 Q0-150 58-110 L76 96 H-76Z" fill={SLATE} stroke={AMBER} strokeWidth="5" />
          <path d="M-48-66 L-118 8 M48-66 L118 8" stroke={LIMESTONE} strokeWidth="22" strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};

const FieldScene: React.FC<{local: number; frames: number; button?: boolean}> = ({local, frames, button = false}) => {
  const walkRaw = ease(local, 6, frames - 18);
  const walk = walkRaw * (button ? 0.58 : 0.68);
  const marker = ease(local, frames * 0.57, frames * 0.83);
  const water = 0.2 + ease(local, 20, frames - 10) * 0.25;
  return (
    <>
      <StormWorld frame={local} water={water} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <path data-item-id={button ? 'button-crossing' : 'test-crossing'} d="M70 1390 C340 1250 600 1260 1010 1070" fill="none" stroke={button ? CORAL : CYAN} strokeWidth="13" pathLength={1}
          strokeDasharray="0.035 0.025" strokeDashoffset={1 - walk} strokeLinecap="round" />
        <g data-item-id={button ? 'button-node' : 'closing-node'} transform={`translate(${button ? 170 : -150 + walk * 600} ${button ? 0 : -Math.sin(walk * Math.PI) * 42})`}>
          <Node x={button ? 230 : 300} y={1320} scale={button ? 0.72 : 0.58} pulse={local / 17} water={water + 0.35} />
        </g>
        {!button && <g data-item-id="field-engineer" transform={`translate(${-160 + walk * 570} 0)`}>
          <circle cx="180" cy="1090" r="42" fill={LIMESTONE} />
          <path d="M140 1160 Q180 1118 220 1160 L240 1330 H120Z" fill={CORAL} />
          <path d="M204 1190 L300 1240" stroke={LIMESTONE} strokeWidth="24" strokeLinecap="round" />
        </g>}
        <g data-item-id={button ? 'button-alert' : 'street-alert'} opacity={marker}>
          <circle cx="858" cy="1010" r={60 + marker * 18} fill="none" stroke={CORAL} strokeWidth="8" strokeDasharray="17 15" opacity="0.82" />
          <circle cx="858" cy="1010" r="42" fill={NIGHT} stroke={CORAL} strokeWidth="7" />
          <path d="M858 1052 V1195 M800 1195 H916" stroke={DIM} strokeWidth="14" strokeLinecap="round" />
          <rect x="566" y="650" width="444" height="112" rx="25" fill={NIGHT} stroke={CORAL} strokeWidth="6" />
          <text x="788" y="720" textAnchor="middle" fill={CORAL} fontFamily={FONT.body} fontSize="27" fontWeight="950" letterSpacing="3">{button ? 'FIELD PROOF / STILL OPEN' : 'FIELD TEST / NEXT'}</text>
        </g>
        <g data-item-id={button ? 'warning-button' : 'field-test'} opacity={ease(local, 5, 24)}>
          <rect x="76" y="480" width="480" height="140" rx="24" fill={NIGHT} stroke={button ? CORAL : AMBER} strokeWidth="5" />
          <text x="106" y="535" fill={button ? CORAL : AMBER} fontFamily={FONT.body} fontSize="24" fontWeight="950" letterSpacing="4">{button ? 'LOCAL NODE / ALIVE' : 'FIELD TEST / NEXT'}</text>
          <text x="106" y="584" fill={PAPER} fontFamily={FONT.body} fontSize="23" fontWeight="900">{button ? 'FIELD PROOF / STILL OPEN' : 'WEATHERIZATION · DEPLOYMENT'}</text>
        </g>
      </svg>
    </>
  );
};

const Art: React.FC<{scene: Scene; local: number; frames: number}> = ({scene, local, frames}) => {
  if (scene.id === 's1') return <OutageScene scene={scene} local={local} frames={frames} />;
  if (scene.id === 's2') return <PrototypeScene scene={scene} local={local} frames={frames} />;
  if (scene.id === 's3') return <PowerScene local={local} frames={frames} />;
  if (scene.id === 's4') return <WaterColumnScene local={local} frames={frames} />;
  if (scene.id === 's5') return <ChipScene local={local} frames={frames} />;
  if (scene.id === 's6') return <TopologyScene local={local} frames={frames} />;
  if (scene.id === 's7') return <RadioScene local={local} frames={frames} />;
  if (scene.id === 's8') return <LimitScene local={local} frames={frames} />;
  if (scene.id === 's9') return <FieldScene local={local} frames={frames} />;
  return <FieldScene local={local} frames={frames} button />;
};

const FloodScene: React.FC<{scene: Scene; fps: number}> = ({scene, fps}) => {
  const local = useCurrentFrame();
  const frames = Math.max(1, Math.round(scene.duration_s * fps));
  const p = clamp(local / Math.max(1, frames - 1));
  const cutIn = ease(local, 0, 8);
  const cutOut = 1 - ease(local, frames - 7, frames - 1);
  return (
    <AbsoluteFill style={{background: NIGHT, opacity: scene.id === 's1' ? cutOut : Math.min(cutIn, cutOut)}}>
      <div style={{position: 'absolute', inset: -24, transform: cameraMove(scene.camera_strategy, p), transformOrigin: '50% 55%'}}>
        <Art scene={scene} local={local} frames={frames} />
      </div>
      <SceneChrome scene={scene} local={local} />
      <div style={{position: 'absolute', left: 55, bottom: 250, width: 5, height: 124,
        background: `linear-gradient(${CYAN}, ${CORAL})`, opacity: 0.65}} />
    </AbsoluteFill>
  );
};

export const LocalFloodNodeEpisode: React.FC<{
  runtime_s: number;
  scenes: Scene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
}> = ({runtime_s, scenes, captions, credits, credits_s = 5}) => {
  const {fps} = useVideoConfig();
  const end = Math.max(runtime_s, ...scenes.map((scene) => scene.start_s + scene.duration_s));
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={Math.round(scene.start_s * fps)} durationInFrames={Math.max(1, Math.round(scene.duration_s * fps))}>
          <FloodScene scene={scene} fps={fps} />
        </Sequence>
      ))}
      {captions && captions.length > 0 && (
        <Sequence from={0} durationInFrames={Math.max(1, Math.round(end * fps))}>
          <SubtitleTrack cues={captions} fps={fps} />
        </Sequence>
      )}
      {credits && credits.trim() && (
        <Sequence from={Math.round(end * fps)} durationInFrames={Math.max(1, Math.round(credits_s * fps))}>
          <CreditsCard text={credits} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
