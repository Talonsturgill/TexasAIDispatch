/** Preserve the story renderer while giving a fractional-frame ending its full credit hold. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {renderBatch} from './render-batch.mjs';

export function withCompleteCredits(composition,board){
  const credits=Number(board.credits_s??0);
  const ends=(board.scenes??[]).map(s=>Number(s.start_s)+Number(s.duration_s));
  const end=Math.max(Number(board.runtime_s),...ends);
  if(!Number.isFinite(end)||!Number.isFinite(credits)||end<0||credits<0)throw new Error('Invalid story or credit duration');
  // A time-based renderer can show its final story frame after rounded metadata
  // starts the credit sequence. Ceil the story boundary, then add all credit frames.
  const minimum=Math.ceil(end*composition.fps)+Math.ceil(credits*composition.fps);
  return {...composition,durationInFrames:Math.max(composition.durationInFrames,minimum)};
}

export async function renderCompleteCredits(boardPath,output,api){
  const board=JSON.parse(fs.readFileSync(boardPath,'utf8'));
  const base=api??{bundle,openBrowser,renderMedia,renderStill,selectComposition};
  return renderBatch({jobs:[{kind:'video',props:boardPath,output,preview:false}]},{...base,
    selectComposition:async options=>withCompleteCredits(await base.selectComposition(options),board),
    renderMedia:async options=>{
      const fps=options.composition.fps;
      const end=Math.max(Number(board.runtime_s),...(board.scenes??[]).map(s=>Number(s.start_s)+Number(s.duration_s)));
      const gap=Math.ceil(end*fps)-Math.round(end*fps);
      // Extending only the file leaves the original Sequence expired, producing
      // an empty last frame. Extend its derived duration by the same boundary gap.
      const inputProps={...options.inputProps,credits_s:(Math.ceil(Number(board.credits_s??0)*fps)+gap)/fps};
      return base.renderMedia({...options,inputProps,composition:{...options.composition,props:{...options.composition.props,...inputProps}}});
    }});
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+i*2],process.argv[3+i*2]]));
  if(!args['--board']||!args['--output'])throw new Error('--board and --output required');
  console.log(JSON.stringify(await renderCompleteCredits(path.resolve(args['--board']),path.resolve(args['--output']))));
}
