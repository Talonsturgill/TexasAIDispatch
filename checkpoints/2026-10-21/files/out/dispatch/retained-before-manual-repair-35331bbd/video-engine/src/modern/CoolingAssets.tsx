import React from 'react';
import {ArtSprite} from './StoryArt';
export type CoolingColors={ink:string;paper:string;hero:string;accent:string;midground:string;foreground:string;background:string};

// Current edition artwork supplies the finished props. Native overlays own facts.
export const Condenser:React.FC<{x:number;y:number;scale?:number;heat:number;c:CoolingColors;identity:'a'|'b';fan?:number}>=
 ({x,y,scale=1,heat,c,identity})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
  <ellipse cx={15} cy={624} rx={180} ry={24} fill={c.ink} opacity={.16}/>
  <ArtSprite role="hero" x={-211} y={-23} width={432} height={648}/>
  <ellipse cx={-34} cy={267} rx={138} ry={220} fill={c.accent} opacity={Math.max(0,heat)*.13}/>
  <g opacity={Math.max(0,heat)}>
   {[0,1,2].map(i=><path key={i} d={`M${-188+i*54} 220Q${-213+i*54} ${170-heat*35} ${-187+i*54} 145Q${-163+i*54} 117 ${-190+i*54} ${78-heat*38}`}
    fill="none" stroke={c.accent} strokeWidth={7} strokeLinecap="round" opacity={.55}/>) }
  </g>
  <rect x={-43} y={-6} width={83} height={22} rx={7} fill={identity==='a'?c.paper:c.ink} opacity={.95}/>
 </g>;

export const InspectionEye:React.FC<{x:number;y:number;scale?:number;angle?:number;c:CoolingColors}>=
 ({x,y,scale=1,angle=0})=><g transform={`translate(${x} ${y}) scale(${scale}) rotate(${angle})`}>
  <ArtSprite role="support" slice="inspection" x={-93} y={-128} width={186} height={282}/>
 </g>;
export const Handheld:React.FC<{x:number;y:number;scale?:number;rotation?:number;confirmed?:number;c:CoolingColors}>=
 ({x,y,scale=1,rotation=0})=><g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
  <ArtSprite role="support" slice="handheld" x={-180} y={-180} width={330} height={475}/>
 </g>;
export const Wrench:React.FC<{x:number;y:number;rotation:number;c:CoolingColors}>=
 ({x,y,rotation})=><g transform={`translate(${x} ${y}) rotate(${rotation})`}>
  <ArtSprite role="support" slice="wrench" x={-145} y={-170} width={285} height={490}/>
 </g>;
