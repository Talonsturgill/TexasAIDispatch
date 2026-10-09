import React from 'react';
import {Easing,interpolate} from 'remotion';
import map from './texasCounties.json';

/** WHERE IN TEXAS, for a few seconds near the start of a current film (October 9th, 2026).
 *
 * A small card in the top right draws the state's outline, fills the story's county and pins it.
 * The map is computed from the committed Census county file by scripts/county_map.py, never drawn by
 * hand. It carries no words: the county is a board field that no claim stands behind, so naming it
 * on screen would put an unsourced fact in the film, and the narration names the place anyway.
 *
 * THE TIMING is the map-explainer rule vetted from the Remotion skills (map-explainer-architecture.md):
 * each phase runs a fixed time from its own start rather than a slice of a reveal, so a long border
 * never flashes by. The border draws in BORDER_S on the house draw curve, the county fills in FILL_S
 * with its opacity overshooting to 1.25 times its rest before settling, and the pin lands in PIN_S,
 * the rule's label phase. It starts after the first frame's decision, holds, and leaves.
 *
 * Its card sits inside the feed's safe area (lib/safearea.ts reserves the right 15 percent and the
 * bottom 26 percent) and above both episodes' title band, which starts at y 279. */
export const LOCATOR_START_S=2.0,BORDER_S=2.5,FILL_S=1.0,PIN_S=0.7,HOLD_S=1.4,FADE_S=0.5;
export const LOCATOR_END_S=LOCATOR_START_S+BORDER_S+FILL_S+PIN_S+HOLD_S+FADE_S;
const CARD={x:704,y:80,w:200,h:190,pad:14},FILL_REST=.8;   // 1.25 times the rest is full opacity
const DRAW=Easing.bezier(.645,.045,.355,1);
type CountyMap={width:number;height:number;outline:string;islands:string;counties:Record<string,{fips:string;d:string;label:[number,number]}>};
const MAP=map as unknown as CountyMap;

export function countyKey(county:string):string{
 const want=county.trim().replace(/\s+county$/i,'').toLowerCase();
 const key=Object.keys(MAP.counties).find(k=>k.toLowerCase()===want);
 if(!key)throw new Error('County '+county+' is not on the Texas county map');
 return key;
}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));

export const CountyLocator:React.FC<{county:string;time_s:number;ink:string;paper:string;accent:string}>=
 ({county,time_s,ink,paper,accent})=>{
 const t=time_s-LOCATOR_START_S;
 if(t<0||time_s>=LOCATOR_END_S)return null;
 const c=MAP.counties[countyKey(county)];
 const border=DRAW(clamp(t/BORDER_S));
 const f=clamp((t-BORDER_S)/FILL_S);
 // the fill's opacity overshoots to 1.25 times its rest, then settles
 const fill=interpolate(f,[0,.6,1],[0,FILL_REST*1.25,FILL_REST],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const pin=Easing.out(Easing.back(1.6))(clamp((t-BORDER_S-FILL_S)/PIN_S));
 const out=clamp((time_s-(LOCATOR_END_S-FADE_S))/FADE_S);
 const card=clamp(t/.3)*(1-out);
 const inner=CARD.w-2*CARD.pad,k=Math.min(inner/MAP.width,(CARD.h-2*CARD.pad)/MAP.height);
 const ox=CARD.x+(CARD.w-MAP.width*k)/2,oy=CARD.y+(CARD.h-MAP.height*k)/2;
 const [lx,ly]=c.label;
 return <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}
  data-county-locator={countyKey(county)} opacity={card}>
  <rect x={CARD.x+5} y={CARD.y+7} width={CARD.w} height={CARD.h} rx={12} fill={ink} opacity={.16}/>
  <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={paper} stroke={ink} strokeWidth={3}/>
  <g transform={`translate(${ox} ${oy}) scale(${k})`}>
   {/* the whole state, faint, from the first frame, so a still caught mid-draw is a map being marked */}
   <path d={MAP.outline} fill="none" stroke={ink} strokeWidth={2.2/k} strokeLinejoin="round" opacity={.16}/>
   <path d={c.d} fill={accent} opacity={fill}/>
   {MAP.islands&&<path d={MAP.islands} fill="none" stroke={ink} strokeWidth={1.4/k} opacity={border}/>}
   <path d={MAP.outline} fill="none" stroke={ink} strokeWidth={2.6/k} strokeLinejoin="round"
    pathLength={1} strokeDasharray={1} strokeDashoffset={1-border}/>
   <g transform={`translate(${lx} ${ly}) scale(${pin/k})`} opacity={clamp(pin*2)}>
    <circle r={12} fill="none" stroke={ink} strokeWidth={3}/>
   </g>
  </g>
 </svg>;
};
