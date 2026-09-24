/** Stateless animation. Any frame can render first, last or out of order. */
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => { const x=clamp(v); return x*x*x*(x*(x*6-15)+10); };
export const cue = (t: number, a: number, b: number) => smooth((t-a)/(b-a));
export const mix = (a: number,b: number,t: number) => a+(b-a)*t;
export type V3 = [number,number,number];
export const mix3 = (a: V3,b: V3,t: number): V3 => a.map((v,i)=>mix(v,b[i],t)) as V3;
export const pointOn = (keys: {at:number;value:V3}[], t:number):V3 => {
  if(t<=keys[0].at) return keys[0].value;
  for(let i=1;i<keys.length;i++) if(t<=keys[i].at)
    return mix3(keys[i-1].value,keys[i].value,cue(t,keys[i-1].at,keys[i].at));
  return keys[keys.length-1].value;
};
