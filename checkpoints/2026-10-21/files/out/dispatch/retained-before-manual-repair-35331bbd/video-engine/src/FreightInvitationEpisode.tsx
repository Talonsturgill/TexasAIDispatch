import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {CreditsCard, SubtitleTrack} from './Dispatch';
import type {DispatchProps} from './Dispatch';
import {Element} from './lib/registry';
import {actionProgress, actionWindows, requireAction} from './lib/direction';
import {GradeLayer} from './lib/lighting';
import {FONT} from './lib/type';

// The board supplies every cut and action window. A source-bound offer travels through
// the same cab, route and customer handoff; no completed passenger ride is reconstructed.
export const FreightInvitationEpisode: React.FC<DispatchProps> = ({
  runtime_s, scenes, captions = [], credits = '', credits_s = 5,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const windows = actionWindows(scenes);
  const scene = scenes.find((candidate) => time >= candidate.start_s &&
    time < candidate.start_s + candidate.duration_s) ?? scenes[scenes.length - 1];
  const progress = (id: unknown) => typeof id === 'string'
    ? actionProgress(requireAction(windows, id), time) : 0;
  const current = time < runtime_s;
  return <div style={{position: 'absolute', inset: 0, background: '#172633'}}>
    {current && <>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
        {scene.planes.map((plane, pi) => <g key={pi}>
          {plane.items.map((item, ii) => {
            const props = item.props ?? {};
            return <Element key={item.id ?? ii} frame={frame}
              at={{scene: scene.id, plane: pi, item: ii}}
              item={{...item, props: {...props,
                progress: progress(props.primary_event),
                secondary: progress(props.secondary_event),
                tertiary: progress(props.tertiary_event),
              }}}/>;
          })}
        </g>)}
        <text x="66" y="113" fill="#f0e4cf" fontSize="31" fontFamily={FONT.body}
          letterSpacing="3">TEXAS AI DISPATCH</text>
        <text x="66" y="156" fill="#83d1dc" fontSize="25" fontFamily={FONT.body}
          letterSpacing="2">
          {scene.id === 's4' ? 'COMPANY REPORTED' : 'ORIGINAL ILLUSTRATION'}
        </text>
      </svg>
      <GradeLayer f={frame} vignette={0.12} grain={0.018} bloom={0.018}/>
      <SubtitleTrack cues={captions} fps={fps}/>
    </>}
    <Sequence from={Math.round(runtime_s * fps)} durationInFrames={Math.round(credits_s * fps)}>
      <CreditsCard text={credits}/>
    </Sequence>
  </div>;
};
