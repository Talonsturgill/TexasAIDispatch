import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {withFonts} from '../lib/fonts';
import {FONT} from '../lib/type';
import cues from './cues';

import {ramp, mix, ink, teal, copper, paper, Pump, Network} from './mechanism';
const MotionStudy:React.FC=()=>{
 const f=useCurrentFrame(),t=f/30,pull=ramp(t,3.2,7.9),twin=ramp(t,8.1,11.5),inputs=ramp(t,12.1,15.5),forecast=ramp(t,16.65,19.8);
 const z=mix(2.75,1.05,pull),cx=mix(-180,55,pull),cy=mix(0,140,twin);
 const cue=cues.find(c=>t>=c.start&&t<c.end);
 return <div style={{position:'absolute',inset:0,background:ink,color:paper,overflow:'hidden'}}>
 <svg width="1080" height="1920" viewBox="0 0 1080 1920">
 <defs>
 <radialGradient id="light"><stop stopColor="#234951"/><stop offset="1" stopColor={ink}/></radialGradient>
 <linearGradient id="metal" x2=".8" y2="1"><stop stopColor="#aec3b5"/><stop offset=".22" stopColor="#395c60"/><stop offset=".5" stopColor="#152b31"/><stop offset=".8" stopColor="#577d7a"/><stop offset="1" stopColor="#233b41"/></linearGradient>
 <linearGradient id="blade" x2="1" y2="1"><stop stopColor="#d4e8ce"/><stop offset=".45" stopColor="#629f9b"/><stop offset="1" stopColor="#173b43"/></linearGradient>
 <radialGradient id="water"><stop stopColor="#325a5d"/><stop offset="1" stopColor="#0c282f"/></radialGradient>
 <linearGradient id="shade" x2="0" y2="1"><stop stopColor={ink}/><stop offset=".3" stopColor={ink} stopOpacity="0"/><stop offset=".8" stopColor={ink} stopOpacity="0"/><stop offset="1" stopColor={ink}/></linearGradient>
 </defs>
 <rect width="1080" height="1920" fill="url(#light)"/>
 <g opacity={.10}>{Array.from({length:24},(_,i)=><path key={i} d={'M'+(i*65-200)+' 260 V1580 M-200 '+(i*65+260)+' H1280'} stroke={teal}/>)}</g>
 <g transform={'translate(540 820) scale('+z+') translate('+(-cx)+' '+(-cy)+')'}>
 <g opacity={1-twin*.3}><Network t={t} reveal={pull} warning={ramp(t,2.65,5)}/><Pump t={t}/></g>
 <g opacity={twin} transform={'translate(0 '+mix(0,380,twin)+')'}><Network t={t} wire reveal={twin} warning={forecast}/><Pump t={t} wire/></g>
 <g opacity={twin*.5}><path d="M-180 166 V210 M-180 260 V218 M-180 292 V340" stroke={teal} strokeWidth={2} strokeDasharray="4 6"/></g>
 </g>
 {Array.from({length:3},(_,i)=>{const x=210+i*270;return <g key={i} opacity={inputs}><text x={x} y={435} fill={paper} textAnchor="middle" fontFamily={FONT.mono} fontSize={24}>{['SENSORS','WEATHER','MAINTENANCE'][i]}</text><path d={'M'+x+' 456 V'+(510+i*22)+' Q'+x+' '+(540+i*22)+' 540 580 V980'} stroke={teal} strokeWidth={2} fill="none" strokeDasharray="3 12" strokeDashoffset={-f*2}/><circle cx={x} cy={468+(t*55+i*38)%90} r={4} fill={teal}/></g>})}
 <rect width="1080" height="1920" fill="url(#shade)"/>
 <text x={150} y={175} fill={copper} fontFamily={FONT.mono} fontSize={25} letterSpacing={5}>TEXAS AI DOCKET</text>
 <g opacity={1-ramp(t,4.1,4.8)}><text x={150} y={300} fill={paper} fontFamily={FONT.display} fontSize={76}>One failure.</text><text x={150} y={390} fill={paper} fontFamily={FONT.display} fontSize={76}>A wider problem.</text><text x={150} y={1335} fill="#a9c5c0" fontFamily={FONT.mono} fontSize={24}>ILLUSTRATIVE MECHANISM</text></g>
 <g opacity={ramp(t,4.8,5.3)*(1-ramp(t,11.8,12.3))}><text x={150} y={295} fill={paper} fontFamily={FONT.display} fontSize={61}>Before trouble travels.</text><text x={150} y={355} fill="#a9c5c0" fontFamily={FONT.body} fontSize={29}>Texas A&amp;M · College Station</text></g>
 <g opacity={twin}><text x={150} y={1320} fill={teal} fontFamily={FONT.mono} fontSize={27}>PROPOSED DIGITAL TWIN</text><text x={150} y={1375} fill="#a9c5c0" fontFamily={FONT.body} fontSize={26}>Research concept · no deployed result shown</text></g>
 <g opacity={inputs}><text x={150} y={290} fill={paper} fontFamily={FONT.display} fontSize={54}>{forecast>.1?'Anticipate the cascade.':'Bring the signals together.'}</text></g>
 </svg>
 {cue&&<div style={{position:'absolute',left:150,right:165,top:1440,fontFamily:FONT.body,fontSize:35,lineHeight:1.38,color:paper}}>{cue.text}</div>}
 {t>=20.33&&<div style={{position:'absolute',inset:0,background:ink,display:'flex',flexDirection:'column',justifyContent:'center',padding:'150px',fontFamily:FONT.body}}><div style={{fontFamily:FONT.display,fontSize:66,marginBottom:45}}>Motion study</div><div style={{fontSize:31,lineHeight:1.8}}>Illustrative research concept.<br/>Source · National Science Foundation<br/>Narration · September 15 Dispatch excerpt</div><div style={{fontSize:25,lineHeight:1.7,marginTop:60,color:'#a9c5c0'}}>Music · Immersed by Kevin MacLeod<br/>incompetech.com · CC BY 4.0<br/>creativecommons.org/licenses/by/4.0/<br/>Trimmed and synced to picture</div></div>}
 </div>;
};
registerRoot(()=> <Composition id="MotionStudy" component={withFonts(MotionStudy)} width={1080} height={1920} fps={30} durationInFrames={750}/>);
