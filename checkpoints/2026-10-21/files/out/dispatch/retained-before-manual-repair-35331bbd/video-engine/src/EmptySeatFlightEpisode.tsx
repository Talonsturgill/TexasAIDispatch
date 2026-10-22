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

const INK = '#0a101b';
const PAPER = '#f1eadc';
const AMBER = '#f4a340';
const CORAL = '#e46f51';
const CYAN = '#6dd8dc';
const DIM = '#7b8796';
const WHITE = '#fffaf0';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (f: number, a: number, b: number) => interpolate(
  f,
  [a, b],
  [0, 1],
  {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)},
);

const cameraMove = (name: Scene['camera_strategy'] | undefined, p: number, gain: number) => {
  if (name === 'riseWith') return {x: 0, y: -38 * p * gain, scale: 1 + 0.032 * p * gain, rotate: 0};
  if (name === 'dollyThrough') return {x: 0, y: 8 * p * gain, scale: 1 + 0.055 * p * gain, rotate: 0};
  if (name === 'craneDown') return {x: 0, y: (-42 + 42 * p) * gain, scale: 1.025 - 0.018 * p * gain, rotate: 0};
  if (name === 'truckAcross') return {x: (-32 + 64 * p) * gain, y: 0, scale: 1.02, rotate: 0};
  if (name === 'orbitReveal') return {x: 12 * (p - 0.5) * gain, y: 0, scale: 1.018, rotate: 1.2 * (p - 0.5) * gain};
  return {x: 0, y: 0, scale: 1, rotate: 0};
};

const CameraFrame: React.FC<{scene: Scene; local: number; frames: number; children: React.ReactNode}> = ({
  scene, local, frames, children,
}) => {
  const p = clamp(local / Math.max(1, frames - 1));
  const a = cameraMove(scene.camera_strategy, p, 1);
  const b = cameraMove(scene.camera_secondary, p, 0.42);
  return <div style={{position: 'absolute', inset: -26, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: '50% 52%', willChange: 'transform',
      transform: `translate(${a.x + b.x}px, ${a.y + b.y}px) scale(${a.scale * b.scale}) rotate(${a.rotate + b.rotate}deg)`}}>
      {children}
    </div>
  </div>;
};

const Noise: React.FC = () => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: 0.2}}>
    <defs>
      <filter id="esf-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="31" />
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .11 0" />
      </filter>
    </defs>
    <rect width="1080" height="1920" filter="url(#esf-noise)" />
  </svg>
);

const FrameLabel: React.FC<{scene: Scene; local: number}> = ({scene, local}) => {
  const enter = ease(local, 3, 16);
  return (
    <>
      <div style={{position: 'absolute', left: 58, top: 58, color: CORAL, fontFamily: 'Arial, sans-serif',
        fontSize: 21, fontWeight: 800, letterSpacing: 4, opacity: enter}}>
        TEXAS AI DOCKET&nbsp;&nbsp;/&nbsp;&nbsp;FORT WORTH
      </div>
      <div style={{position: 'absolute', left: 58, top: 104, height: 2, width: 964,
        background: `linear-gradient(90deg, ${AMBER}, transparent)`, opacity: enter * 0.8}} />
      <div style={{position: 'absolute', left: 60, right: 58, top: 142,
        transform: `translateY(${(1 - enter) * 22}px)`, opacity: enter}}>
        <div style={{fontFamily: 'Arial, sans-serif', fontSize: 22, fontWeight: 900,
          letterSpacing: 3.5, color: AMBER}}>{scene.super ?? ''}</div>
        <div style={{marginTop: 9, fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: 25, color: PAPER}}>{scene.caption ?? ''}</div>
      </div>
    </>
  );
};

const RouteThread: React.FC<{d: string; progress: number; width?: number; glow?: boolean}> = ({
  d, progress, width = 11, glow = true,
}) => (
  <g>
    {glow && <path d={d} fill="none" stroke={AMBER} strokeWidth={width + 20} opacity={0.12}
      strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(progress)} />}
    <path d={d} fill="none" stroke={AMBER} strokeWidth={width} strokeLinecap="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(progress)} />
    <circle r={width * 1.05} fill={WHITE} opacity={progress > 0.03 && progress < 0.99 ? 1 : 0}>
      <animateMotion dur="1s" repeatCount="indefinite" path={d} />
    </circle>
  </g>
);

const PersonGlyph: React.FC<{x: number; y: number; scale?: number; colour?: string}> = ({
  x, y, scale = 1, colour = PAPER,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx="0" cy="-62" r="28" fill={colour} />
    <path d="M-46 14 Q-42-36 0-36 Q42-36 46 14 L34 98 L-34 98 Z" fill={colour} />
  </g>
);

const EmptySeat: React.FC<{x?: number; y?: number; scale?: number; belt?: number; glow?: number}> = ({
  x = 540, y = 1000, scale = 1, belt = 0, glow = 0,
}) => {
  const beltX = interpolate(clamp(belt), [0, 1], [180, -156]);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="270" rx="280" ry="58" fill="#000" opacity="0.28" />
      <path d="M-210 40 Q-220-170-120-260 Q0-330 120-260 Q220-170 210 40 L172 120 L-172 120 Z"
        fill="#273240" stroke={PAPER} strokeWidth="10" />
      <path d="M-184 32 Q-170-136-92-210 Q0-260 92-210 Q170-136 184 32 Z"
        fill="#151e2a" stroke="#556271" strokeWidth="7" />
      <path d="M-248 92 Q-202 44-150 70 L-110 188 Q-138 234-226 210 Z"
        fill="#303d4b" stroke={PAPER} strokeWidth="10" />
      <path d="M248 92 Q202 44 150 70 L110 188 Q138 234 226 210 Z"
        fill="#303d4b" stroke={PAPER} strokeWidth="10" />
      <path d="M-168 120 Q0 80 168 120 L132 238 Q0 282-132 238 Z"
        fill="#3c4958" stroke={PAPER} strokeWidth="10" />
      <path d={`M-165 -188 L${beltX} 132`} stroke={AMBER} strokeWidth="22" strokeLinecap="round" />
      <rect x={beltX - 28} y="110" width="60" height="50" rx="10" fill={AMBER} stroke={INK} strokeWidth="7" />
      <circle cx="0" cy="30" r="330" fill="none" stroke={AMBER} strokeWidth="20" opacity={glow * 0.18} />
      <text x="0" y="350" textAnchor="middle" fill={AMBER} fontFamily={FONT.body}
        fontSize="30" fontWeight="900" letterSpacing="8">EMPTY</text>
    </g>
  );
};

const EVtol: React.FC<{x: number; y: number; scale?: number; lift?: number; pilot?: boolean}> = ({
  x, y, scale = 1, lift = 0, pilot = true,
}) => {
  const spin = lift * 5000;
  return (
    <g transform={`translate(${x} ${y - lift * 300}) scale(${scale})`}>
      <ellipse cx="0" cy="170" rx="330" ry="45" fill="#000" opacity={0.24 * (1 - lift * 0.5)} />
      <path d="M-210 10 Q-128-110 92-90 Q202-68 265 5 Q198 74 15 82 Q-146 86-252 42 Z"
        fill={WHITE} stroke={INK} strokeWidth="13" />
      <path d="M-120-56 Q-46-104 58-78 L86-18 L-136-10 Z" fill="#294456" stroke={INK} strokeWidth="9" />
      {pilot && <circle cx="8" cy="-52" r="20" fill={CORAL} />}
      <path d="M-158 8 L-430-102 L-382-132 L-70-48 Z" fill={PAPER} stroke={INK} strokeWidth="12" />
      <path d="M130 2 L426-92 L382-124 L58-42 Z" fill={PAPER} stroke={INK} strokeWidth="12" />
      {[-348, -178, 168, 340].map((rx, i) => (
        <g key={rx} transform={`translate(${rx} ${i < 2 ? -103 : -92}) rotate(${spin + i * 31})`}>
          <circle r="20" fill={AMBER} stroke={INK} strokeWidth="8" />
          <path d="M-104 0 Q-36-17 0 0 Q36 17 104 0" fill="none" stroke={CYAN} strokeWidth="10" strokeLinecap="round" />
        </g>
      ))}
      <path d="M-110 80 L-92 130 M126 78 L146 128" stroke={INK} strokeWidth="13" />
      <circle cx="-92" cy="139" r="17" fill={INK} /><circle cx="146" cy="137" r="17" fill={INK} />
    </g>
  );
};

const Caravan: React.FC<{x: number; y: number; scale?: number; fly?: number}> = ({
  x, y, scale = 1, fly = 0,
}) => (
  <g transform={`translate(${x + fly * 180} ${y - fly * 34}) scale(${scale})`}>
    <path d="M-250 10 Q-130-58 146-38 L250 2 L128 42 L-202 54 Z" fill="#bfc9cf" stroke={INK} strokeWidth="12" />
    <path d="M-62-20 L-330-122 L-284-154 L100-30 Z" fill={CYAN} stroke={INK} strokeWidth="11" />
    <path d="M-160 14 L-274 126 L-216 139 L42 30 Z" fill={CYAN} stroke={INK} strokeWidth="11" />
    <path d="M174-20 L260-120 L282-112 L246 8 Z" fill={CORAL} stroke={INK} strokeWidth="11" />
    <circle cx="-226" cy="-4" r="38" fill={AMBER} stroke={INK} strokeWidth="10" />
    <path d={`M-226-118 L-226 110 M-332-4 L-120-4`} stroke={PAPER} strokeWidth="12"
      strokeLinecap="round" transform={`rotate(${fly * 1200} -226 -4)`} />
    <path d="M-30-26 L72-26" stroke="#294456" strokeWidth="18" strokeLinecap="round" />
    {[0, 1, 2].map((i) => <circle key={i} cx={24 + i * 48} cy="-27" r="8" fill={WHITE} />)}
    <path d="M-60-82 Q0-142 60-82" fill="none" stroke={AMBER} strokeWidth="8" strokeDasharray="12 12" opacity={0.8} />
  </g>
);

const Runway: React.FC<{pulse: number}> = ({pulse}) => (
  <g>
    <path d="M130 1480 L950 1480 L760 820 L320 820 Z" fill="#161f2b" stroke="#596472" strokeWidth="6" />
    {Array.from({length: 9}).map((_, i) => {
      const y = 1410 - i * 68;
      const w = 52 - i * 3;
      return <rect key={i} x={540 - w / 2} y={y} width={w} height={34} rx="4"
        fill={i / 9 < pulse ? AMBER : '#4e5b67'} opacity={0.9} />;
    })}
    {Array.from({length: 12}).map((_, i) => (
      <circle key={i} cx={210 + i * 60} cy={1455 - Math.abs(i - 5.5) * 4} r="7"
        fill={i / 12 < pulse ? CYAN : '#394754'} />
    ))}
  </g>
);

const SeatScene: React.FC<{local: number; frames: number; turn?: boolean}> = ({local, frames, turn = false}) => {
  const {fps} = useVideoConfig();
  const arrival = spring({frame: local, fps, config: {damping: 15, mass: 0.8}});
  const belt = turn ? ease(local, frames * 0.38, frames * 0.73) : ease(local, 18, 48);
  const rotor = local * 2.2;
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="seat-light"><stop stopColor="#26384d" /><stop offset="1" stopColor={INK} /></radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#seat-light)" />
      {Array.from({length: 5}).map((_, i) => (
        <rect key={i} x="-120" y={390 + i * 188} width="1320" height="30" fill={PAPER}
          opacity={0.06} transform={`rotate(${rotor + i * 19} 540 960)`} />
      ))}
      <RouteThread d={turn ? 'M70 1280 C260 1200 385 1240 520 1080 C650 930 740 900 1010 820' :
        'M70 1320 C220 1300 340 1240 470 1080 C610 910 760 850 1010 720'} progress={ease(local, 10, frames - 20)} />
      <g transform={`translate(0 ${(1 - arrival) * 220}) scale(${0.88 + arrival * 0.12})`}>
        <EmptySeat y={1035} scale={1.15} belt={belt} glow={ease(local, 35, 70)} />
      </g>
      {!turn && <g opacity={ease(local, 55, 85)}><PersonGlyph x={860} y={1040} scale={0.75} colour={CORAL} /></g>}
      {turn && <g opacity={ease(local, frames * 0.62, frames * 0.78)}>
        <rect x="105" y="1330" width="870" height="96" rx="20" fill={AMBER} />
        <text x="540" y="1392" textAnchor="middle" fill={INK} fontFamily={FONT.body}
          fontSize="38" fontWeight="900" letterSpacing="5">EVIDENCE GATE</text>
      </g>}
      {turn && <g opacity={ease(local, frames * 0.48, frames * 0.68)}>
        <path d="M120 1160 H960" stroke={CORAL} strokeWidth="24" strokeLinecap="round" />
        <rect x="725" y="830" width="290" height="204" rx="22" fill={INK} stroke={CYAN} strokeWidth="5" />
        <text x="870" y="890" textAnchor="middle" fill={CYAN} fontFamily={FONT.body} fontWeight="900" fontSize="22" letterSpacing="3">ROUTE</text>
        <text x="870" y="930" textAnchor="middle" fill={WHITE} fontFamily={FONT.body} fontWeight="900" fontSize="28">TESTING</text>
        <text x="870" y="980" textAnchor="middle" fill={CORAL} fontFamily={FONT.body} fontWeight="900" fontSize="22" letterSpacing="2">PASSENGER: EMPTY</text>
        <g opacity={ease(local, frames * 0.56, frames * 0.73)}>
          <PersonGlyph x={930} y={1200} scale={0.48} colour={DIM} />
        </g>
      </g>}
    </svg>
  );
};

const LiftScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 8, frames - 12);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs><linearGradient id="dawn" x2="0" y2="1"><stop stopColor="#111c2d" /><stop offset="0.65" stopColor="#ad5549" /><stop offset="1" stopColor="#e8aa61" /></linearGradient></defs>
      <rect width="1080" height="1920" fill="url(#dawn)" />
      <circle cx="865" cy="520" r="88" fill={AMBER} opacity={0.5} />
      <path d="M0 900 L210 770 L310 860 L460 735 L620 880 L790 760 L1080 900 V1140 H0Z" fill="#101a25" opacity="0.72" />
      <Runway pulse={p} />
      <RouteThread d="M540 1390 C540 1190 520 1040 560 900 C620 700 790 590 980 520" progress={p} />
      <EVtol x={540} y={1180} scale={0.86} lift={p} />
      <g opacity={ease(local, 8, 28)}>
        <path d="M116 1260 L250 1120" stroke={AMBER} strokeWidth="5" />
        <rect x="72" y="1236" width="264" height="76" rx="16" fill={INK} stroke={AMBER} strokeWidth="4" />
        <text x="204" y="1284" textAnchor="middle" fill={WHITE} fontFamily={FONT.body}
          fontWeight="900" fontSize="23" letterSpacing="3">ALLIANCE / HASLET</text>
      </g>
      <g opacity={ease(local, frames * 0.43, frames * 0.68)}>
        <rect x="650" y="610" width="330" height="208" rx="24" fill={INK} stroke={CYAN} strokeWidth="4" />
        <text x="815" y="660" textAnchor="middle" fill={CYAN} fontFamily={FONT.body}
          fontWeight="900" fontSize="21" letterSpacing="3">DALLAS—FORT WORTH</text>
        <path d="M710 748 C760 685 837 790 925 704" fill="none" stroke={AMBER} strokeWidth="8" strokeLinecap="round" />
        {[710, 790, 865, 925].map((x) => <circle key={x} cx={x}
          cy={x === 790 ? 713 : x === 865 ? 753 : x === 925 ? 704 : 748} r="10" fill={WHITE} />)}
      </g>
      <g opacity={ease(local, frames * 0.55, frames * 0.8)}>
        <rect x="100" y="1288" width="300" height="62" rx="31" fill={INK} stroke={CYAN} strokeWidth="3" />
        <text x="250" y="1329" textAnchor="middle" fill={CYAN} fontFamily={FONT.body}
          fontWeight="800" fontSize="23" letterSpacing="4">ROUTE TEST</text>
      </g>
    </svg>
  );
};

const SplitAircraftScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const split = ease(local, 10, 38);
  const fly = ease(local, 20, frames - 14);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="540" height="1920" fill="#143044" />
      <rect x="540" width="540" height="1920" fill="#252331" />
      <path d={`M${540 - split * 10} 260 L${540 + split * 10} 1500`} stroke={AMBER} strokeWidth="10" />
      <path d="M40 1320 C200 1120 330 1010 520 920" fill="none" stroke={CYAN} strokeWidth="8" strokeDasharray="18 15" />
      <path d="M560 920 C760 850 900 730 1040 570" fill="none" stroke={CORAL} strokeWidth="8" strokeDasharray="18 15" />
      <g transform={`translate(${interpolate(fly, [0, 1], [-500, 0])} 0)`}><EVtol x={275} y={920} scale={0.56} lift={0.28} /></g>
      <g transform={`translate(${interpolate(fly, [0, 1], [500, 0])} 0)`}><Caravan x={800} y={690} scale={0.64} fly={fly} /></g>
      <g opacity={ease(local, frames * 0.58, frames * 0.78)}>
        <rect x="82" y="1190" width="390" height="116" rx="20" fill={INK} stroke={CYAN} strokeWidth="4" />
        <text x="277" y="1240" textAnchor="middle" fill={WHITE} fontFamily={FONT.body} fontSize="26" fontWeight="900">ELECTRIC AIR TAXI</text>
        <text x="277" y="1280" textAnchor="middle" fill={CYAN} fontFamily={FONT.body} fontSize="25" fontWeight="900" letterSpacing="4">PILOTED</text>
        <rect x="610" y="1090" width="388" height="116" rx="20" fill={INK} stroke={CORAL} strokeWidth="4" />
        <text x="804" y="1140" textAnchor="middle" fill={WHITE} fontFamily={FONT.body} fontSize="26" fontWeight="900">J208 DEMO</text>
        <text x="804" y="1180" textAnchor="middle" fill={CORAL} fontFamily={FONT.body} fontSize="25" fontWeight="900" letterSpacing="4">AUTONOMOUS</text>
      </g>
    </svg>
  );
};

const GateScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const walkers = ease(local, 5, frames * 0.48);
  const drop = ease(local, frames * 0.42, frames * 0.68);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#101723" />
      <Runway pulse={ease(local, 0, frames)} />
      <RouteThread d="M60 1260 C320 1240 520 1140 1020 840" progress={ease(local, 10, frames - 8)} />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${interpolate(walkers, [0, 1], [-110 - i * 130, 380 - i * 130])} 0)`}>
          <PersonGlyph x={220} y={1160 + i * 30} scale={0.72} colour={i === 0 ? PAPER : DIM} />
        </g>
      ))}
      <g transform={`rotate(${interpolate(drop, [0, 1], [-72, 0])} 540 810)`}>
        <rect x="116" y="790" width="848" height="84" rx="14" fill={CORAL} stroke={INK} strokeWidth="10" />
        {Array.from({length: 8}).map((_, i) => <rect key={i} x={150 + i * 100} y="800" width="48" height="64" fill={i % 2 ? WHITE : INK} opacity="0.74" />)}
      </g>
      <g opacity={drop}>
        <rect x="210" y="920" width="660" height="112" rx="24" fill={INK} stroke={CORAL} strokeWidth="4" />
        <text x="540" y="992" textAnchor="middle" fill={WHITE} fontFamily={FONT.body}
          fontSize="42" fontWeight="900" letterSpacing="7">NO PASSENGERS</text>
      </g>
    </svg>
  );
};

const RouteMapScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 8, frames - 16);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#d9d0c1" />
      <g opacity="0.35" stroke="#6e675c" strokeWidth="3">
        {Array.from({length: 10}).map((_, i) => <path key={i} d={`M${80 + i * 105} 360 Q${220 + i * 65} 830 ${40 + i * 104} 1430`} fill="none" />)}
        {Array.from({length: 9}).map((_, i) => <path key={i} d={`M70 ${420 + i * 118} Q520 ${350 + i * 138} 1010 ${420 + i * 110}`} fill="none" />)}
      </g>
      <circle cx="284" cy="1060" r="52" fill={CORAL} opacity={0.9} />
      <circle cx="805" cy="630" r="40" fill={CYAN} opacity={0.9} />
      <circle cx="752" cy="1260" r="46" fill={DIM} opacity={0.9} />
      <RouteThread d="M284 1060 C365 690 630 920 805 630 C930 830 900 1120 752 1260 C530 1430 210 1350 284 1060" progress={p} width={15} />
      <g transform={`translate(${interpolate(p, [0, 1], [-220, 500])} ${interpolate(p, [0, 1], [1260, 760])})`}>
        <path d="M-72 10 L0-28 L84 6 L0 42 Z" fill={INK} stroke={WHITE} strokeWidth="5" />
        <circle cx="0" cy="8" r="11" fill={AMBER} />
      </g>
      {['DEPART', 'CROSS', 'RETURN'].map((x, i) => (
        <g key={x} opacity={ease(local, 34 + i * 24, 54 + i * 24)}>
          <rect x="94" y={460 + i * 82} width="250" height="58" rx="12" fill={INK} />
          <text x="219" y={498 + i * 82} textAnchor="middle" fill={i === 2 ? AMBER : WHITE}
            fontFamily={FONT.body} fontSize="23" fontWeight="900" letterSpacing="4">{x}</text>
        </g>
      ))}
    </svg>
  );
};

const EvidenceScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 5, frames - 10);
  const validate = ease(local, frames * 0.42, frames * 0.62);
  const handoff = ease(local, frames * 0.62, frames * 0.84);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#101723" />
      <RouteThread d="M40 520 C290 400 380 610 520 500 C650 390 760 590 1040 430" progress={p} />
      {Array.from({length: 3}).map((_, i) => {
        const enter = ease(local, 20 + i * 18, 38 + i * 18);
        return (
          <g key={i} transform={`translate(${interpolate(enter, [0, 1], [1100, 0])} ${i * 112})`}>
            <rect x="92" y="700" width="610" height="88" rx="13" fill={i === 2 ? AMBER : PAPER}
              stroke={INK} strokeWidth="6" />
            <circle cx="142" cy="744" r="16" fill={i === 2 ? INK : CORAL} />
            <path d="M184 730 H620 M184 758 H510" stroke={i === 2 ? INK : '#6d746f'} strokeWidth="9" strokeLinecap="round" />
          </g>
        );
      })}
      <text x="105" y="652" opacity={ease(local, 25, 52)} fill={CYAN} fontFamily={FONT.body}
        fontSize="23" fontWeight="900" letterSpacing="4">FLIGHT LOG / ROUTE + RESULT</text>
      <g opacity={validate}>
        <PersonGlyph x={776} y={1020} scale={0.76} colour={CORAL} />
        <path d="M708 932 L642 980" stroke={CORAL} strokeWidth="16" strokeLinecap="round" />
        <g transform="translate(475 956) rotate(-9)">
          <rect width="240" height="78" rx="14" fill="none" stroke={CORAL} strokeWidth="9" />
          <text x="120" y="52" textAnchor="middle" fill={CORAL} fontFamily={FONT.body}
            fontSize="27" fontWeight="900" letterSpacing="3">VALIDATED</text>
        </g>
      </g>
      <g opacity={handoff} transform={`translate(${interpolate(handoff, [0, 1], [-80, 0])} 0)`}>
        <path d="M570 1250 H795 M770 1224 L812 1250 L770 1276" fill="none" stroke={AMBER} strokeWidth="12" />
        <rect x="806" y="1148" width="224" height="204" rx="26" fill="#25313e" stroke={CYAN} strokeWidth="6" />
        <text x="918" y="1216" textAnchor="middle" fill={CYAN} fontFamily={FONT.body} fontSize="28" fontWeight="900">FAA</text>
        <text x="918" y="1260" textAnchor="middle" fill={WHITE} fontFamily={FONT.body} fontSize="23" fontWeight="900">STANDARDS</text>
        <path d="M872 1302 H964" stroke={AMBER} strokeWidth="8" strokeDasharray="14 10" />
      </g>
      <g opacity={ease(local, frames * 0.7, frames * 0.88)}>
        <path d="M150 1450 H870" stroke={CYAN} strokeWidth="5" strokeDasharray="20 16" />
        <text x="510" y="1525" textAnchor="middle" fill={CYAN} fontFamily={FONT.body}
          fontSize="29" fontWeight="900" letterSpacing="4">FLIGHT → EVIDENCE → STANDARD</text>
      </g>
    </svg>
  );
};

const TexasNetworkScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 10, frames - 14);
  const nodes = [
    {x: 600, y: 520, name: 'DALLAS', at: 0.08},
    {x: 520, y: 885, name: 'AUSTIN', at: 0.38},
    {x: 455, y: 1060, name: 'SAN ANTONIO', at: 0.63},
    {x: 705, y: 1015, name: 'HOUSTON', at: 0.88},
  ];
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#0b1422" />
      <path d="M285 280 L520 300 L640 390 L830 460 L770 680 L875 830 L758 1045 L655 1110 L555 1395 L390 1280 L258 980 L180 760 L245 600 L170 485 Z"
        fill="#172c3b" stroke={PAPER} strokeWidth="8" opacity={0.96} />
      <path d="M600 520 C570 670 545 785 520 885 C500 958 475 1014 455 1060 C552 1088 636 1055 705 1015"
        fill="none" stroke={AMBER} strokeWidth="14" strokeLinecap="round" pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - p} />
      {nodes.map((n, i) => {
        const on = clamp((p - n.at) * 8);
        return (
          <g key={n.name} opacity={on * (i === 3 ? 0.55 : 1)}>
            <circle cx={n.x} cy={n.y} r={22 + on * 8} fill={AMBER} />
            <circle cx={n.x} cy={n.y} r={48 + on * 14} fill="none" stroke={AMBER} strokeWidth="4" opacity="0.28" />
            <text x={n.x + (i % 2 ? -40 : 40)} y={n.y - 42} textAnchor={i % 2 ? 'end' : 'start'}
              fill={WHITE} fontFamily={FONT.body} fontWeight="900" fontSize="24" letterSpacing="3">{n.name}</text>
            {i === 3 && <text x={n.x + 42} y={n.y + 54} fill={DIM} fontFamily={FONT.body}
              fontWeight="800" fontSize="19" letterSpacing="3">EVENTUALLY</text>}
          </g>
        );
      })}
      <g opacity={ease(local, frames * 0.64, frames * 0.84)}>
        <rect x="160" y="1460" width="760" height="82" rx="20" fill={INK} stroke={AMBER} strokeWidth="4" />
        <text x="540" y="1513" textAnchor="middle" fill={AMBER} fontFamily={FONT.body}
          fontSize="29" fontWeight="900" letterSpacing="5">PROPOSED NETWORK</text>
      </g>
    </svg>
  );
};

const LadderScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 5, frames - 15);
  const steps = [
    {x: 120, y: 1230, w: 270, label: 'PILOT ONLY', open: true},
    {x: 405, y: 1020, w: 270, label: 'NON-PAYING', open: false},
    {x: 690, y: 810, w: 270, label: 'PAYING', open: false},
  ];
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <rect width="1080" height="1920" fill="#111825" />
      <RouteThread d="M50 1430 L250 1365 L540 1145 L820 935 L1020 670" progress={p * 0.38} />
      {steps.map((s, i) => {
        const enter = ease(local, 12 + i * 22, 32 + i * 22);
        return (
          <g key={s.label} transform={`translate(0 ${(1 - enter) * 100})`} opacity={enter}>
            <rect x={s.x} y={s.y} width={s.w} height="170" rx="18" fill={s.open ? AMBER : '#25313e'}
              stroke={s.open ? WHITE : DIM} strokeWidth="6" />
            <text x={s.x + s.w / 2} y={s.y + 105} textAnchor="middle" fill={s.open ? INK : PAPER}
              fontFamily={FONT.body} fontWeight="900" fontSize="25" letterSpacing="3">{s.label}</text>
            {!s.open && <g>
              <rect x={s.x + s.w / 2 - 34} y={s.y - 30} width="68" height="64" rx="12" fill={CORAL} />
              <path d={`M${s.x + s.w / 2 - 19} ${s.y - 30} Q${s.x + s.w / 2} ${s.y - 72} ${s.x + s.w / 2 + 19} ${s.y - 30}`}
                fill="none" stroke={CORAL} strokeWidth="12" />
            </g>}
          </g>
        );
      })}
      <g opacity={ease(local, frames * 0.66, frames * 0.84)}>
        <text x="540" y="1510" textAnchor="middle" fill={CYAN} fontFamily={FONT.body}
          fontSize="27" fontWeight="900" letterSpacing="6">FAA OVERSIGHT</text>
      </g>
    </svg>
  );
};

const FlightLogScene: React.FC<{local: number; frames: number}> = ({local, frames}) => {
  const p = ease(local, 8, frames * 0.7);
  const labels = ['ROUTE', 'RESULT', 'NEXT STAGE'];
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs><linearGradient id="log-dawn" x2="0" y2="1"><stop stopColor="#13243a" /><stop offset="1" stopColor="#8a4b45" /></linearGradient></defs>
      <rect width="1080" height="1920" fill="url(#log-dawn)" />
      <Runway pulse={p} />
      <g transform={`translate(0 ${interpolate(ease(local, 4, 35), [0, 1], [120, 0])})`}>
        <rect x="112" y="430" width="856" height="720" rx="34" fill={PAPER} stroke={INK} strokeWidth="12" />
        <rect x="112" y="430" width="856" height="118" rx="28" fill={INK} />
        <text x="540" y="505" textAnchor="middle" fill={AMBER} fontFamily={FONT.body}
          fontSize="36" fontWeight="900" letterSpacing="7">FLIGHT LOG</text>
        {labels.map((label, i) => {
          const fill = ease(local, 38 + i * 24, 58 + i * 24);
          return (
            <g key={label}>
              <text x="178" y={662 + i * 150} fill={INK} fontFamily={FONT.body} fontSize="29" fontWeight="900" letterSpacing="4">{label}</text>
              <rect x="480" y={618 + i * 150} width="380" height="60" rx="13" fill="#c7c3b8" />
              {i < 2 && <rect x="480" y={618 + i * 150} width={380 * fill} height="60" rx="13" fill={AMBER} />}
              {i === 2 && <g opacity={ease(local, 78, 105)}>
                <rect x="632" y={610 + i * 150} width="76" height="76" rx="13" fill={CORAL} />
                <path d={`M648 ${618 + i * 150} Q670 ${574 + i * 150} 692 ${618 + i * 150}`}
                  fill="none" stroke={CORAL} strokeWidth="12" />
              </g>}
            </g>
          );
        })}
      </g>
      <RouteThread d="M50 1350 C300 1260 480 1200 540 1110 C610 1000 780 1080 1030 900" progress={p} />
      <g opacity={ease(local, frames * 0.48, frames * 0.68)}>
        <PersonGlyph x={180} y={1295} scale={0.62} colour={CORAL} />
        <path d="M235 1198 L400 1060" stroke={CORAL} strokeWidth="14" strokeLinecap="round" />
        <PersonGlyph x={930} y={1275} scale={0.52} colour={DIM} />
        <path d="M820 1170 H895" stroke={DIM} strokeWidth="7" strokeDasharray="12 10" />
      </g>
      <g opacity={ease(local, frames * 0.68, frames * 0.86)} transform={`scale(${0.92 + ease(local, frames * 0.68, frames * 0.86) * 0.08})`}>
        <rect x="126" y="1320" width="828" height="142" rx="27" fill={AMBER} stroke={INK} strokeWidth="10" />
        <text x="540" y="1380" textAnchor="middle" fill={INK} fontFamily={FONT.body} fontSize="31" fontWeight="900" letterSpacing="5">WATCH THE FLIGHT LOG</text>
        <text x="540" y="1423" textAnchor="middle" fill={INK} fontFamily={FONT.display} fontSize="24" fontStyle="italic">not the promise</text>
      </g>
    </svg>
  );
};

const SceneArt: React.FC<{scene: Scene; local: number; frames: number}> = ({scene, local, frames}) => {
  if (scene.id === 's1') return <SeatScene local={local} frames={frames} />;
  if (scene.id === 's2') return <LiftScene local={local} frames={frames} />;
  if (scene.id === 's3') return <SplitAircraftScene local={local} frames={frames} />;
  if (scene.id === 's4') return <GateScene local={local} frames={frames} />;
  if (scene.id === 's5') return <RouteMapScene local={local} frames={frames} />;
  if (scene.id === 's6') return <EvidenceScene local={local} frames={frames} />;
  if (scene.id === 's7') return <TexasNetworkScene local={local} frames={frames} />;
  if (scene.id === 's8') return <LadderScene local={local} frames={frames} />;
  if (scene.id === 's9') return <SeatScene local={local} frames={frames} turn />;
  return <FlightLogScene local={local} frames={frames} />;
};

const EpisodeScene: React.FC<{scene: Scene}> = ({scene}) => {
  const local = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1, Math.round(scene.duration_s * fps));
  const out = interpolate(local, [frames - 8, frames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: INK, opacity: out}}>
      <CameraFrame scene={scene} local={local} frames={frames}>
        <SceneArt scene={scene} local={local} frames={frames} />
      </CameraFrame>
      <Noise />
      <FrameLabel scene={scene} local={local} />
    </AbsoluteFill>
  );
};

export const EmptySeatFlightEpisode: React.FC<{
  runtime_s: number;
  scenes: Scene[];
  captions?: Cue[];
  credits?: string;
  credits_s?: number;
}> = ({scenes, captions, credits, credits_s = 5}) => {
  const {fps} = useVideoConfig();
  const end = scenes.reduce((m, s) => Math.max(m, s.start_s + s.duration_s), 0);
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={Math.round(scene.start_s * fps)}
          durationInFrames={Math.max(1, Math.round(scene.duration_s * fps))}>
          <EpisodeScene scene={scene} />
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
