import React from 'react';
import {registerRoot, Composition} from 'remotion';
import type {DispatchProps} from './Dispatch';
import {DailyActionsEpisode} from './DailyActionsEpisode';
import {withFonts} from './lib/fonts';

// Kept exactly equal to the legacy composition metadata by the renderer regression test.
export const dispatchMetadata = ({props}: {props: Record<string, unknown>}) => {
  const board = props as unknown as DispatchProps;
  const last = (board.scenes ?? []).reduce(
    (m, s) => Math.max(m, (s.start_s ?? 0) + (s.duration_s ?? 0)), 0);
  // The credits card is APPENDED, so the composition has to grow by its length. Without
  // this the card renders past the end of the film and is simply never seen, which for
  // a permissively licensed bed means the attribution silently went unpaid.
  const tail = (board.credits ?? '').trim() ? (board.credits_s ?? 4) : 0;
  const seconds = Math.max(board.runtime_s ?? 0, last) + tail;
  if (seconds <= 0) {
    throw new Error(
      'Dispatch: the board declares no runtime and no scenes, so there is nothing to render. ' +
      'A zero-length composition renders "successfully" as an empty file.');
  }
  return {durationInFrames: Math.round(seconds * 30)};
};
const defaults:DispatchProps={runtime_s:1,scenes:[],captions:[],credits:''};
const DailyRoot:React.FC=()=> <Composition id="Dispatch" component={withFonts(DailyActionsEpisode)}
  fps={30} width={1080} height={1920} durationInFrames={30}
  defaultProps={defaults} calculateMetadata={dispatchMetadata}/>;
registerRoot(DailyRoot);
