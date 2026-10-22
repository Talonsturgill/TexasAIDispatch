import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import type {DispatchProps, Scene} from './Dispatch';
import {Stage3D, Plane, PERSPECTIVE, composeCams} from './lib/stage3d';
import {Element} from './lib/registry';
import type {Placed} from './lib/registry';
import {FONT} from './lib/type';
import {FAX_PALETTE, FAX_CHART_PAGE} from './lib/faxwork';
import {actionWindows, actionProgress, directedValue, requireAction} from './lib/direction';

/** The board supplies every event and semantic mode. No scene-specific schedule
 * lives here, so retiming narration moves the same authored physical actions. */
export const FaxChartEpisode: React.FC<DispatchProps> = ({scenes,captions,credits,credits_s=4}) => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps;
  const windows=React.useMemo(()=>actionWindows(scenes),[scenes]);
  const end=scenes.reduce((m,s)=>Math.max(m,s.start_s+s.duration_s),0);
  const scene=scenes.find(s=>time>=s.start_s && time<s.start_s+s.duration_s)??scenes[0];
  const camera=React.useMemo(()=> {
    const motion=scene?.camera_motion;
    if(!motion) return scene?.camera_base??{};
    const window=requireAction(windows,motion.event_id);
    if(window.scene!==scene.id) throw new Error(`Camera event ${motion.event_id} belongs to another scene`);
    const delta: {x?: number; y?: number; z?: number}={};
    for(const axis of ['x','y','z'] as const) {
      const from=motion.from[axis]??0;
      const to=motion.to[axis]??from;
      if(!Number.isFinite(from)||!Number.isFinite(to)) throw new Error(`Nonfinite camera ${axis}`);
      delta[axis]=directedValue(window,time,from,to);
    }
    return composeCams(scene.camera_base??{},delta);
  },[scene,time,windows]);
  const controls=(item: Placed) => {
    const props={...item.props};
    const motion=(props.motion??{}) as Record<string,string>;
    for(const [control,eventId] of Object.entries(motion)) {
      const window=requireAction(windows,eventId);
      if(!item.id || !window.itemIds.includes(item.id)) {
        throw new Error(`Fax action ${eventId} does not bind item ${item.id}`);
      }
      props[control]=actionProgress(window,time);
    }
    delete props.motion;
    return props;
  };
  const placed=(item: Placed,depth: number,current: Scene): Placed => {
    const props=controls(item);
    if(item.kind==='faxDocument' && props.target_id) {
      const entries=current.planes.flatMap(p=>p.items.map(i=>({item:i,z:p.z})));
      const target=entries.find(e=>e.item.id===props.target_id);
      if(!target) throw new Error(`Missing fax target ${props.target_id}`);
      const targetProps=controls(target.item);
      const handoff=Number(targetProps.handoff??0);
      const relative=(PERSPECTIVE+depth)/(PERSPECTIVE+target.z);
      const targetScale=target.item.scale??1;
      const ownScale=item.scale??1;
      const targetX=(target.item.x??0)+handoff*155+targetScale*FAX_CHART_PAGE.x;
      const targetY=(target.item.y??0)-handoff*45+targetScale*FAX_CHART_PAGE.y;
      props.targetX=(540+(targetX-540)*relative-(item.x??0))/ownScale;
      props.targetY=(960+(targetY-960)*relative-(item.y??0))/ownScale;
      props.targetScale=targetScale*FAX_CHART_PAGE.scale*relative/ownScale;
      if(targetProps.close!==undefined) props.close=targetProps.close;
    }
    return {...item,props};
  };
  return <>
    {time<end && scene && <>
      <Stage3D camera={camera} background={FAX_PALETTE.mist}>
        {scene.planes.map((plane,pi)=><Plane key={pi} z={plane.z}>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{overflow:'visible'}}>
            {plane.items.map((item,ii)=><Element key={item.id??ii} item={placed(item,plane.z,scene)} frame={frame}
              at={{scene:scene.id,plane:pi,item:ii}}/>)}
          </svg>
        </Plane>)}
      </Stage3D>
      <svg width={1080} height={1920} style={{position:'absolute',inset:0}}>
        <text x={72} y={145} fontSize={26} fontFamily={FONT.mono} fill={FAX_PALETTE.ink}>
          Illustrated workflow
        </text>
        <text x={72} y={230} fontSize={54} fontFamily={FONT.display} fontWeight={700}
          fill={FAX_PALETTE.ink}>{scene.super}</text>
      </svg>
    </>}
    {captions?.length ? <Sequence from={0} durationInFrames={Math.max(1,Math.round(end*fps))}>
      <SubtitleTrack cues={captions} fps={fps}/>
    </Sequence> : null}
    {credits?.trim() && <Sequence from={Math.round(end*fps)}
      durationInFrames={Math.max(1,Math.round(credits_s*fps))}><CreditsCard text={credits}/></Sequence>}
  </>;
};
