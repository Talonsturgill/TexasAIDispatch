import React from 'react';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(t:number)=>{const p=clamp(t);return p*p*(3-2*p);};
export const ramp=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const ink='#07191e', teal='#7ce2da', copper='#ed9971', paper='#f5eddd';
const paths=(gap:number)=>['M0 0 H165 Q200 0 200 -35 V-'+(gap-35)+' Q200 -'+gap+' 235 -'+gap+' H365','M0 0 H365','M0 0 H165 Q200 0 200 35 V'+(gap-35)+' Q200 '+gap+' 235 '+gap+' H365'];
export const Pump:React.FC<{t:number;wire?:boolean}>=({t,wire=false})=>{
 const stop=ramp(t,1.15,2.15);
 const angle=t<1.15?t*230:264.5+115*(1-Math.pow(1-clamp(t-1.15),2));
 return <g transform={'translate(-180 '+Math.sin(t*78)*(1-stop)*1.6+')'}>
 <path d="M-250 0 H-122 M118 0 H180" stroke={wire?teal:'#526768'} strokeWidth={wire?3:72}/>
 {!wire&&<path d="M-250 -19 H-122 M118 -19 H180" stroke="#a9bdb7" strokeWidth={3} opacity={.45}/>}
 <path d="M-90 91 L-112 154 H115 L91 91" fill={wire?'none':'#1e3539'} stroke={wire?teal:'#688383'} strokeWidth={3}/>
 <circle r={148} fill={wire?'none':'url(#metal)'} stroke={wire?teal:'#718c8a'} strokeWidth={3}/>
 <circle r={119} fill={wire?'none':ink} stroke={wire?teal:'#172c31'} strokeWidth={12}/>
 <circle r={105} fill={wire?'none':'url(#water)'} stroke={teal} strokeOpacity={.35} strokeWidth={2}/>
 {!wire&&Array.from({length:10},(_,i)=><g key={i} transform={'rotate('+i*36+')'}><circle cy={-132} r={9} fill="#12282e" stroke="#91a7a0" strokeWidth={2}/><path d="M-4 -132 H4" stroke="#a9bdb7"/></g>)}
 <g transform={'rotate('+(wire?t*25:angle)+')'}>{[0,60,120,180,240,300].map(a=><path key={a} transform={'rotate('+a+')'} d="M10 -15 C32 -20 42 -98 82 -61 C108 -24 51 10 14 15Z" fill={wire?'none':'url(#blade)'} stroke={wire?teal:'#b1ded2'} strokeWidth={wire?2:1.5}/>)}</g>
 <circle r={24} fill={wire?ink:'#87aaa0'} stroke={teal} strokeWidth={2}/><circle r={8} fill={ink}/>
 {!wire&&<><path d="M-109 75 l8 9 M65 116 l17 -8 M-63 -138 l25 5" stroke={copper} strokeWidth={3} opacity={.5}/><circle cx={-102} cy={-112} r={7} fill={stop>.8?copper:teal}/></>}
 </g>;
};
export const Network:React.FC<{t:number;wire?:boolean;reveal:number;warning:number;gap?:number;pulse?:number}>=({t,wire=false,reveal,warning,gap=180,pulse=50})=><g>
 {paths(gap).map((d,i)=><g key={d} opacity={reveal}>
 <path d={d} fill="none" stroke={wire?teal:'#344d50'} strokeWidth={wire?2:23} pathLength={1} strokeDasharray="1" strokeDashoffset={1-reveal}/>
 <path d={d} fill="none" stroke={teal} opacity={wire?.65:.8} strokeWidth={wire?2:5} strokeDasharray={wire?'4 11':'2 27'} strokeDashoffset={-t*(wire?45:24)}/>
 <path d={d} fill="none" stroke={copper} strokeWidth={wire?5:9} pathLength={1} strokeDasharray="1" strokeDashoffset={1-clamp((warning-i*.13)*1.4)} opacity={warning>0?1:0}/>
 <g transform={'translate(380 '+(i-1)*gap+')'} opacity={ramp(reveal,.45,.9)}><circle r={32} fill={ink} stroke={warning>i*.22&&warning>.1?copper:teal} strokeWidth={3}/><path d="M-16 13 V-3 L0-18 L16-3 V13Z M-4 13 V3 H4 V13" fill="none" stroke={paper} strokeWidth={2}/>{warning>i*.22&&warning>.1&&<circle r={35+((t*30+i*10)%pulse)} stroke={copper} opacity={1-((t*30+i*10)%pulse)/pulse} fill="none"/>}</g>
 </g>)}
</g>;
