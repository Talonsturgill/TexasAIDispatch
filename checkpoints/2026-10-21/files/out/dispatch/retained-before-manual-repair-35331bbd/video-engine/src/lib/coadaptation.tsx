import React from 'react';
import {FONT} from './type';

// Original illustrative props for the reach question. No likeness, product UI or care outcome.
type Props = {x?: number; y?: number; scale?: number; frame?: number; label?: string;
  mode?: string; progress?: number; wristX?: number; wristY?: number; release?: number; open?: number};
const ink='#243632', cream='#f4ecd9', sage='#809484', coral='#d96749';
const line={stroke:ink,strokeWidth:5,strokeLinejoin:'round' as const};
export const CoadaptRobot: React.FC<Props> = ({x=230,y=1350,scale=1,wristX=425,wristY=1020,release=0}) => {
  const wx=(wristX-x)/scale-30, wy=(wristY-y)/scale+35;
  const ex=60+(wx-60)*.35, ey=-460-Math.max(0,wx-180)*.12;
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx={0} cy={20} rx={150} ry={29} fill={ink} opacity={.17}/>
    <path d="M-104,-85 L95,-85 L126,-21 L112,15 L-110,15 L-125,-21 Z" fill={sage} {...line}/>
    <path d="M-99,-70 L86,-70 L97,-38 L-110,-38" fill="none" stroke="#bac9b4" strokeWidth={9}/>
    <rect x={-83} y={-9} width={39} height={28} rx={10} fill={ink}/><rect x={64} y={-9} width={39} height={28} rx={10} fill={ink}/>
    <path d="M-39,-83 L-34,-436 L31,-446 L44,-82 Z" fill="#cfdbcd" {...line}/>
    <rect x={-66} y={-499} width={144} height={87} rx={23} fill={cream} {...line}/>
    <rect x={-42} y={-478} width={81} height={32} rx={12} fill={ink}/>
    <circle cx={-17} cy={-462} r={8} fill="#b6d9c0"/><circle cx={14} cy={-462} r={8} fill="#b6d9c0"/>
    <path d={`M23,-366 L${ex},${ey} L${wx},${wy}`} fill="none" stroke={ink} strokeWidth={45} strokeLinecap="round"/>
    <path d={`M23,-366 L${ex},${ey} L${wx},${wy}`} fill="none" stroke="#c4d1be" strokeWidth={31} strokeLinecap="round"/>
    <circle cx={ex} cy={ey} r={29} fill={sage} {...line}/><circle cx={ex} cy={ey} r={9} fill={ink}/>
    <circle cx={wx} cy={wy} r={18} fill={sage} {...line}/>
    <path d={`M${wx},${wy} l${28},${-17-release*23} l24,${6-release*8} M${wx},${wy} l28,${17+release*23} l24,${-6+release*8}`} fill="none" stroke={ink} strokeWidth={10} strokeLinecap="round"/>
    <path d="M-80,-28 l23,-4 M-22,-204 l21,2" stroke={ink} strokeWidth={3} opacity={.4}/>
  </g>;
};
export const HandoffCup: React.FC<Props> = ({x=425,y=1020,scale=1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M34,9 C101,-8 96,80 39,72" fill="none" stroke={ink} strokeWidth={22}/>
  <path d="M34,9 C101,-8 96,80 39,72" fill="none" stroke={coral} strokeWidth={12}/>
  <path d="M-43,0 L-37,76 Q-1,94 39,73 L45,0 Z" fill={coral} {...line}/>
  <ellipse cx={1} cy={0} rx={44} ry={12} fill="#f4e4bd" {...line}/>
  <path d="M-26,18 L-24,57" stroke="#f49d77" strokeWidth={8} strokeLinecap="round"/>
  <path d="M-11,81 l17,1" stroke={ink} strokeWidth={2}/>
</g>;
export const CoadaptRoom: React.FC<Props> = ({mode='laboratory-room',open=0,label=''}) => <g>
  <rect width={1080} height={1920} fill="#e4ddc9"/>
  <path d="M0,1300 L1080,1300 L1080,1920 L0,1920Z" fill="#8a947c"/>
  <path d="M0,1300 L1080,1300 M90,1540 L970,1540 M215,1760 L1060,1760" stroke="#62735f" strokeWidth={6}/>
  <path d="M65,345 H408 V811 H65Z" fill="#acc2b0" stroke={ink} strokeWidth={9}/>
  <path d="M78,772 Q148,700 213,743 Q300,663 395,726 V797 H78Z" fill="#70866a"/>
  <path d="M207,797 L220,660 M220,711 L187,680 M220,696 L249,666" stroke="#495e49" strokeWidth={12}/>
  <path d="M232,352 V798 M72,564 H400" stroke="#f3ead7" strokeWidth={12}/>
  <path d="M50,825 L426,825" stroke={ink} strokeWidth={10}/>
  <rect x={649} y={380} width={259} height={412} fill="#c7cbb7" stroke={ink} strokeWidth={7}/>
  <path d="M640,372 H920 V393 H640" fill={cream} {...line}/>
  <path d="M672,406 H877 V764 H672Z" fill="#637b6d"/>
  <path d={`M672,406 L${672+open*163},${406+open*37} V${764-open*34} L672,764Z`} fill="#b7bfa6" {...line}/>
  <rect x={474} y={950} width={87} height={315} fill="#ccd0b6" stroke={ink} strokeWidth={4}/>
  <path d="M482,954 Q505,919 555,945" stroke="#697d60" strokeWidth={10} fill="none"/>
  {mode==='shared-building'&&<g><path d="M562,300 V1285" stroke="#f5efde" strokeWidth={20}/><path d="M615,877 H870 V1030 H615Z" fill="#edeee3" {...line}/><path d="M620,1030 V1112 M866,1030 V1112" stroke={ink} strokeWidth={12}/></g>}
  <path d="M28,1280 H1054" stroke="#c6c8b5" strokeWidth={18}/>
  {label&&<text x={580} y={342} fontFamily={FONT.body} fontWeight={700} fontSize={40} fill={ink}>{label}</text>}
</g>;
export const CoadaptEvidence: React.FC<Props> = ({x=110,y=475,scale=1,label='Research',mode='award',progress=1}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M12,14 H707 V270 H12Z" fill={ink} opacity={.2}/>
  <path d="M0,0 H695 L713,252 H-7Z" fill={cream} {...line}/>
  <rect x={0} y={0} width={695} height={51} fill={ink}/>
  <text x={24} y={36} fontFamily={FONT.body} fontSize={28} fontWeight={700} fill={cream}>{mode==='award'?'NSF AWARD RECORD':'UT AUSTIN ANNOUNCEMENT'}</text>
  <text x={25} y={112} fontFamily={FONT.display} fontWeight={700} fontSize={40} fill={ink}>{label}</text>
  {mode==='source'?<g>
    <path d="M22,136 H320 V250 H22Z" fill="#ced7c4" stroke={ink} strokeWidth={3}/>
    <g transform="translate(85 183) scale(.55)"><HandoffCup x={0} y={0}/></g>
    <text x={140} y={188} fontFamily={FONT.body} fontSize={25} fill={ink}>Demonstration</text>
    <g transform={`translate(${progress*35} ${progress*75})`}>
      <path d="M342,136 H645 V250 H342Z" fill={cream} stroke={ink} strokeWidth={3} strokeDasharray="9 7"/>
      <text x={363} y={180} fontFamily={FONT.body} fontWeight={700} fontSize={26} fill={ink}>Care results</text>
      <text x={363} y={224} fontFamily={FONT.body} fontSize={25} fill={ink}>Not established</text>
    </g>
  </g>:<path d="M26,145 H648 M26,170 H608 M26,195 H628" stroke="#aeb5a3" strokeWidth={7}/> }
  {mode!=='source'&&<rect x={22} y={218} width={progress*630} height={9} fill={coral}/>}
</g>;
export const ConsentDoor: React.FC<Props> = ({x=610,y=550,scale=1,open=0,label='Participation'}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  <path d="M-34,0 H239 V562 H-34Z" fill="#f5e9ce" {...line}/>
  <path d="M-9,31 H211 V536 H-9Z" fill={ink}/>
  <path d={`M-9,31 L${210-open*160},${31+open*38} V${536-open*42} L-9,536 Z`} fill="#beceb2" {...line}/>
  <circle cx={174-open*131} cy={306} r={10} fill={coral}/>
  <text x={-27} y={-28} fontFamily={FONT.body} fontSize={29} fontWeight={700} fill={ink}>{label}</text>
</g>;

export const CoadaptFurnishing: React.FC<Props> = ({mode='floor'}) => mode==='shelf' ? <g><path d="M0,1490 H1080 V1534 H0Z" fill="#718169" stroke="#4a5e4e" strokeWidth={4}/></g> : <g><path d="M-250,1450 H1400 V2100 H-250Z" fill="#8a947c"/><path d="M-200,1560 H1350 M-200,1810 H1350" stroke="#718169" strokeWidth={6}/></g>;
