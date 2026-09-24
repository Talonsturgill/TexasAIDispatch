import {cue, mix, pointOn, V3} from '../lib/cinema/motion';

export const STUDY = {
  fps:30, seconds:20,
  title:'Through the lens',
  subtitle:'A study in light, motion and perception',
  disclosure:'ILLUSTRATIVE MECHANISM',
  events:[
    {at:0.25,end:1.45,verb:'Iris blades open',sound:'iris'},
    {at:2.4,end:4.8,verb:'Macro reveals the camera body',sound:'pull'},
    {at:5.0,end:7.8,verb:'Lens groups separate along the optical axis',sound:'separate'},
    {at:8.0,end:10.5,verb:'Light paths converge on the sensor',sound:'light'},
    {at:10.5,end:13.6,verb:'Sensor cells respond in a travelling wave',sound:'sensor'},
    {at:14.0,end:16.7,verb:'Assembly closes around the optical path',sound:'close'},
    {at:17.0,end:19.0,verb:'Return to the opening eye with a live sensor',sound:'resolve'},
  ],
};
const CAMERA:{at:number;value:V3}[]=[
  {at:0,value:[0.25,.18,4.8]}, {at:2.4,value:[.4,.28,5.1]},
  {at:4.8,value:[5.8,3.2,8.2]}, {at:7.8,value:[8.3,3.8,6.5]},
  {at:10.5,value:[7.9,2.6,5.3]}, {at:13.6,value:[5.8,2,3.7]},
  {at:16.7,value:[4.6,2.5,7.5]}, {at:19.2,value:[.2,.12,5.4]},
];
export function stateAt(t:number) {
  const apart=cue(t,5,7.8)*(1-cue(t,14,16.7));
  return {
    t, apart, iris:mix(.14,.64,cue(t,.25,1.45)),
    spin:mix(-.13,0,cue(t,0,1.6))+cue(t,14,16.7)*.1,
    light:cue(t,8,8.6)*(1-cue(t,14.8,15.7)),
    sensor:cue(t,10.4,12.8), camera:pointOn(CAMERA,t).map(v=>v*(1+cue(t,2.4,5)*.46)) as V3,
    target:pointOn([{at:0,value:[0,0,.5]},{at:4.8,value:[0,0,0]},
      {at:7.8,value:[0,0,.7]},{at:10.5,value:[0,0,.1]},
      {at:13.6,value:[0,0,-.7]},{at:17,value:[0,0,.3]}],t),
  };
}
