import React from 'react';
import {FONT} from './type';

type Visual = {
  mode?: string;
  label?: string;
  status?: string;
  value?: string;
  progress?: number;
  secondary?: number;
  tertiary?: number;
  frame?: number;
};

const clay = '#a77d70';
const paper = '#f0e4cf';
const ink = '#172633';
const copper = '#f2a67d';
const cyan = '#83d1dc';
const road = '#415667';
const ease = (n: number) => Math.max(0, Math.min(1, n));

export const FreightBackdrop: React.FC<Visual> = ({mode = 'cab', progress = 0, secondary = 0}) => {
  const p = ease(progress), q=ease(secondary);
  const interior = ['cab', 'invite', 'close', 'drive'].includes(mode);
  return <g>
    <rect width="1080" height="1920" fill={interior ? '#26394b' : '#617986'}/>
    {!interior && <>
      <rect y="450" width="1080" height="1100" fill={mode === 'dock' ? '#728588' : '#8b8e86'}/>
      <path d="M0 1060 Q250 1010 480 1060 T1080 1060 L1080 1450 L0 1450Z" fill={clay}/>
      <path d="M0 980 H1080" stroke="#d8c5ae" strokeWidth="9" opacity=".55"/>
      {mode === 'dock' && <>
        <rect x="70" y="580" width="940" height="720" rx="24" fill="#4f5e62" stroke={paper} strokeWidth="10"/>
        <rect x="270" y="690" width="540" height="540" fill="#263845" stroke="#b2b4a8" strokeWidth="25"/>
        {Array.from({length: 5},(_,i)=><path key={i} d={`M270 ${760+i*87} H810`} stroke="#576f75" strokeWidth="8"/>)}
      </>}
      {mode === 'route' && <>
        <path d="M0 700 L1080 600 M0 760 L1080 660" stroke="#d7c7b4" strokeWidth="5" opacity=".25"/>
        <circle cx={850} cy={300} r={90+p*15} fill="#f1c9a2" opacity=".5"/>
      </>}
    </>}
    {interior && <>
      <path d="M90 250 H990 L940 1200 H140 Z" fill="#93adb3" stroke="#101d2a" strokeWidth="28"/>
      <path d="M95 850 L985 800" stroke="#e6dbca" strokeWidth="15" opacity=".5"/>
      <path d="M470 250 L510 1210" stroke="#182d3a" strokeWidth="24"/>
      <path d="M90 1200 H990 L1080 1590 H0 Z" fill="#162b3a"/>
      <path d="M130 1100 Q540 970 950 1100" fill="none" stroke="#435767" strokeWidth="24"/>
      <path d="M490 280 L600 1170" stroke="#d5c9b3" strokeWidth="8" opacity=".42"/>
      {mode === 'drive' && <>
        <path d="M510 590 L145 1200 M560 590 L950 1200" stroke="#485663" strokeWidth="125"/>
        <path d="M530 640 L530 1180" stroke={paper} strokeWidth="10" strokeDasharray="45 65" strokeDashoffset={-p*100} opacity=".85"/>
        <defs><clipPath id="freight-gantry-window"><path d="M145 285 H940 L915 1170 H165Z"/></clipPath></defs>
        <g clipPath="url(#freight-gantry-window)" transform={`translate(0 ${q*330})`}>
          <path d="M125 475 H960" stroke="#354e5c" strokeWidth="90"/>
          <path d="M125 500 H960" stroke="#c6c6b8" strokeWidth="12" opacity=".8"/>
          <path d="M225 500 V755 M855 500 V755" stroke="#354e5c" strokeWidth="31"/>
        </g>
      </>}
    </>}
    <rect y="1580" width="1080" height="340" fill={ink}/>
  </g>;
};

export const FreightRoute: React.FC<Visual> = ({mode = 'cab', progress = 0, secondary = 0}) => {
  const p = ease(progress), q = ease(secondary);
  if (['cab', 'invite', 'close', 'drive'].includes(mode)) return <g>
    <path d="M525 630 Q610 740 555 980" fill="none" stroke="#75878b" strokeWidth="75" opacity=".72"/>
    {mode === 'drive' ? <g>
      <defs><clipPath id="freight-drive-window"><path d="M190 330 H900 L870 1120 H215Z"/></clipPath></defs>
      <g clipPath="url(#freight-drive-window)">
        {[0,1,2].map((i) => {
          const y=530+i*185+q*260;
          const width=14+i*12+q*17;
          return <g key={i}>
            <path d={`M${540-width} ${y} L${540+width} ${y} L${555+width*1.6} ${y+75} L${555-width*1.6} ${y+75}Z`}
              fill={paper} opacity=".72"/>
            <path d={`M${735+i*38+q*65} ${y-22} L${735+i*38+q*65} ${y+80}`}
              stroke={paper} strokeWidth={8+i*4} opacity=".48"/>
          </g>;
        })}
      </g>
    </g> : <path d="M540 690 L560 735 M555 825 L560 875" stroke={paper} strokeWidth="8" opacity=".85"/>}
    {mode === 'close' && <path d={`M525 720 Q620 835 ${570+q*280} 1060`} fill="none" stroke={copper} strokeWidth="13" strokeLinecap="round"/>}
    <g transform={`translate(${p*190} 0)`}><path d="M608 590 L640 610 L622 640" fill="none" stroke={cyan} strokeWidth="10"/></g>
  </g>;
  if (mode === 'route') return <g>
    <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke="#203542" strokeWidth="150" strokeLinecap="round"/>
    <path d="M225 390 C610 410 180 950 760 1160" fill="none" stroke={paper} strokeWidth="9" strokeDasharray="14 24" opacity=".66"/>
    <path d="M390 620 Q360 800 480 875" fill="none" stroke={copper} strokeWidth="19" strokeLinecap="round" strokeDasharray={`${Math.max(1,q*310)} 400`}/>
    <circle cx="225" cy="390" r="42" fill={paper}/><circle cx="760" cy="1160" r="42" fill={paper}/>
    <text x="93" y="330" fill={paper} fontSize="49" fontWeight="700">DALLAS</text>
    <text x="690" y="1260" fill={paper} fontSize="49" fontWeight="700">HOUSTON</text>
    {p>.02 && <circle cx={400+55*p} cy={650+180*p} r="22" fill={cyan}/>}
  </g>;
  if (mode === 'mileage') return <g>
    <circle cx="540" cy="860" r="425" fill="none" stroke="#263845" strokeWidth="90"/>
    <circle cx="540" cy="860" r="425" fill="none" stroke={copper} strokeWidth="40" strokeDasharray={`${Math.max(1,p*2680)} 2700`} transform="rotate(-90 540 860)"/>
    {Array.from({length: 12},(_,i)=>{const a=(i/12)*Math.PI*2;return <circle key={i} cx={540+425*Math.cos(a)} cy={860+425*Math.sin(a)} r="10" fill={paper} opacity=".8"/>;})}
  </g>;
  if (mode === 'dock') return <g>
    <path d="M150 1200 H930" stroke="#d0b69b" strokeWidth="35"/>
    <rect x="155" y="1210" width="770" height="150" fill="#4b5860"/>
    <path d="M530 1180 L530 1320" stroke={copper} strokeWidth="20" strokeDasharray="35 25" strokeDashoffset={-p*55}/>
  </g>;
  return <g>
    <path d="M110 500 Q510 430 950 1080" fill="none" stroke="#344a58" strokeWidth="165" strokeLinecap="round"/>
    <path d="M110 500 Q510 430 950 1080" fill="none" stroke={copper} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${Math.max(1,p*390)} 1400`}/>
    <path d="M565 720 L890 1100" stroke={paper} strokeWidth="7" strokeDasharray="20 27" opacity={.25+.55*q}/>
  </g>;
};

const Truck: React.FC<{x:number;y:number;scale?:number;wheel?:number}> = ({x,y,scale=1,wheel=0}) =>
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x="-350" y="-125" width="395" height="150" rx="12" fill="#e3dfd4" stroke={ink} strokeWidth="13"/>
    <path d="M45 -100 L195 -100 L255 -20 L255 26 L45 26Z" fill="#3a6682" stroke={ink} strokeWidth="13"/>
    <path d="M174 -93 L225 -25 L166 -25Z" fill="#9bd3d9"/>
    <rect x="240" y="-15" width="50" height="34" fill={copper}/>
    <path d="M120 -104 L120 -148 L183 -148 L183 -104" fill="none" stroke={ink} strokeWidth="10"/>
    <circle cx="150" cy="-151" r="20" fill={cyan}/>
    {[-250,-120,155].map((w,i)=><g key={i} transform={`translate(${w} 32) rotate(${wheel*360})`}><circle r="40" fill={ink}/><circle r="18" fill="#abb8b6"/><path d="M-28 0 H28 M0 -28 V28" stroke="#e7e2d6" strokeWidth="5"/></g>)}
  </g>;

export const FreightCab: React.FC<Visual> = ({mode = 'cab', progress = 0, secondary = 0, tertiary = 0}) => {
  const p=ease(progress), q=ease(secondary), z=ease(tertiary);
  if (['cab','invite','close','drive'].includes(mode)) return <g>
    <path d="M290 1030 Q280 800 405 785 Q530 800 515 1030 L540 1410 H265 Z" fill="#455967" stroke={ink} strokeWidth="22"/>
    <path d="M615 1030 Q600 800 730 785 Q855 800 845 1030 L870 1410 H590 Z" fill="#4f626e" stroke={ink} strokeWidth="22"/>
    <circle cx="400" cy="1000" r="124" fill="none" stroke={ink} strokeWidth="30"/>
    <circle cx="400" cy="1000" r="22" fill={ink}/>
    <path d={`M400 1000 L${400+90*Math.sin(p*.9)} ${910+25*p}`} stroke={ink} strokeWidth="17"/>
    {mode==='cab' && <g transform={`translate(${-670*p} 0)`}><path d="M0 230 H650 L730 1510 H0 Z" fill="#304758" stroke={ink} strokeWidth="35"/><path d="M80 370 H520 L570 950 H110Z" fill="#71949f" stroke="#a5c2c5" strokeWidth="14"/></g>}
    {(mode==='close'||mode==='cab'&&q>.04) && <g transform={`translate(0 ${-120+120*q})`} opacity={Math.max(.1,q)}>
      <rect x="635" y="1060" width="185" height="130" rx="8" fill={paper} stroke={copper} strokeWidth="8"/>
      <path d="M662 1100 H790 M662 1130 H755" stroke={ink} strokeWidth="10"/>
    </g>}
    {mode==='close' && <circle cx="760" cy="930" r={95+35*z} fill="none" stroke={cyan} strokeWidth="10" opacity={.7-z*.35}/>}
  </g>;
  if (mode==='route') return <g><Truck x={315+180*p} y={870+35*p} scale={1.0} wheel={p}/></g>;
  if (mode==='mileage') return <g><Truck x={590} y={1010} scale={.55} wheel={p*2}/></g>;
  if (mode==='dock') return <g>
    <Truck x={360+215*p} y={1100} scale={.9} wheel={p}/>
    <g transform={`translate(${780+80*q} 1060)`}>
      <g transform={`translate(${22*q} 0)`}><circle cy="-105" r="47" fill="#b9856c" stroke={ink} strokeWidth="8"/>
      <circle cx="-15" cy="-110" r="4" fill={ink}/><circle cx="20" cy="-110" r="4" fill={ink}/></g>
      <path d="M-65 -45 Q0 -70 65 -45 L85 130 H-85Z" fill="#d8b796" stroke={ink} strokeWidth="10"/>
      <path d={`M-25 10 L${-8+35*q} 75`} stroke={ink} strokeWidth="20" strokeLinecap="round"/>
    </g>
    <g opacity=".7"><circle cx="1010" cy="950" r="42" fill="#9a735f" stroke={ink} strokeWidth="8"/><path d="M955 1080 Q1010 990 1080 1070" fill="#445b62" stroke={ink} strokeWidth="10"/></g>
  </g>;
  return <g><Truck x={300+280*p} y={1000+90*p} scale={.7} wheel={p}/></g>;
};

export const FreightEvidence: React.FC<Visual> = ({mode = 'cab',label='',status='',value='',progress=0,secondary=0,tertiary=0}) => {
  const p=ease(progress), q=ease(secondary), r=ease(tertiary);
  const headerOpacity=mode==='cab'?Math.max(.06,q):1;
  const statusOpacity=mode==='invite'||mode==='limit'?Math.max(.04,p):1;
  return <g>
    <g opacity={headerOpacity}><rect x="64" y="160" width="952" height="130" rx="8" fill="#172633" opacity=".94"/>
    <path d="M64 290 H1016" stroke={copper} strokeWidth="7"/>
    <text x="95" y="238" fill={paper} fontFamily={FONT.body} fontWeight="700" fontSize={label.length>29?38:49} letterSpacing="1">{label}</text></g>
    {status && <g opacity={statusOpacity}>
      <rect x="64" y="297" width="952" height="66" rx="6" fill={ink} opacity=".91"/>
      <text x="85" y="342" fill={cyan} fontFamily={FONT.body} fontSize={status.length>38?25:32} letterSpacing="1.4">{status}</text>
    </g>}
    {mode==='cab' && <path d={`M700 450 L${860+90*q} 450`} stroke={copper} strokeWidth="14" strokeLinecap="round"/>}
    {mode==='mileage' && <g opacity={Math.max(.08,p)}><rect x="335" y="570" width="510" height="200" rx="22" fill={ink} stroke={paper} strokeWidth="11"/><text x="400" y="700" fill={paper} fontFamily={FONT.body} fontWeight="800" fontSize="90">{value}</text></g>}
    {mode==='invite' && <g>
      <rect x="110" y="880" width="395" height="260" rx="15" fill={ink} stroke={copper} strokeWidth="10"/>
      <rect x="570" y="880" width="395" height="260" rx="15" fill={ink} stroke={paper} strokeWidth="9" strokeDasharray="18 19" opacity=".62"/>
      <text x="175" y="1100" fill={paper} fontFamily={FONT.body} fontWeight="700" fontSize="42">OFFERED</text>
      <text x="610" y="1100" fill={paper} fontFamily={FONT.body} fontWeight="700" fontSize="40" opacity=".7">COMPLETED</text>
      <g transform={`translate(${165+65*p} ${655+230*p})`}><rect width="235" height="117" rx="10" fill={paper} stroke={copper} strokeWidth="8"/><path d="M28 43 H205 M28 75 H175" stroke={ink} strokeWidth="9"/></g>
    </g>}
    {mode==='limit' && <g>
      <rect x="145" y="810" width="790" height="103" rx="10" fill={ink}/>
      <text x="190" y="880" fill={paper} fontFamily={FONT.body} fontSize="38">DISTANCE REPORTED</text>
      <path d={`M610 880 H${610+275*q}`} stroke={copper} strokeWidth="18"/>
      <g opacity={Math.max(.05,p)}><rect x="145" y="950" width="790" height="230" rx="10" fill={ink} stroke={paper} strokeDasharray="18 20" strokeWidth="8"/>
      <text x="265" y="1030" fill={paper} fontFamily={FONT.body} fontSize="41">SAFETY COMPARISON</text>
      <g opacity={r} transform={`translate(${(1-r)*170} 0)`}>
        <rect x="225" y="1082" width="630" height="58" rx="8" fill="none" stroke={paper} strokeWidth="6" strokeDasharray="12 16"/>
        <path d="M500 1092 V1130" stroke={paper} strokeWidth="5" strokeDasharray="9 9"/>
      </g></g>
    </g>}
    {mode==='close' && <g>
      <rect x="245" y="1085" width="650" height="158" rx="10" fill={ink} opacity=".92"/>
      <path d={`M290 1150 H${290+140*p}`} stroke={copper} strokeWidth="20" strokeLinecap="round"/>
      <path d="M450 1150 H850" stroke={paper} strokeWidth="9" strokeDasharray="14 22" opacity=".6"/>
      <text x="290" y="1210" fill={paper} fontFamily={FONT.body} fontSize="25">OFFERED SEGMENT  /  OPEN COMPARISON</text>
    </g>}
  </g>;
};
