/** One bundle and browser for a reserved batch, using the installed Remotion APIs. */
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const engine=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const entryFor=(props)=>path.join(engine,'src',props.cinematic_template==='daily-actions-v1'?'daily.tsx':'index.ts');

export async function renderBatch(spec, api={bundle,openBrowser,renderMedia,renderStill,selectComposition}){
  if(!Array.isArray(spec.jobs)||!spec.jobs.length)throw new Error('A reserved render batch needs at least one job');
  const props=new Map();
  for(const job of spec.jobs){
    if(!['still','video'].includes(job.kind))throw new Error('Unknown render job kind');
    props.set(job.props,JSON.parse(fs.readFileSync(job.props,'utf8')));
  }
  const entries=new Set([...props.values()].map(entryFor));
  if(entries.size!==1)throw new Error('A batch cannot mix renderer entry points');
  const serveUrl=await api.bundle({entryPoint:[...entries][0],publicDir:path.join(engine,'public'),enableCaching:true});
  const browser=await api.openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE,
    chromeMode:'headless-shell',chromiumOptions:{gl:'angle'}});
  const common={serveUrl,puppeteerInstance:browser,chromiumOptions:{gl:'angle'},logLevel:'error',timeoutInMilliseconds:120000};
  const compositions=new Map(),started=Date.now();
  try{
    for(const job of spec.jobs){
      const inputProps=props.get(job.props);
      if(!compositions.has(job.props))compositions.set(job.props,await api.selectComposition({...common,id:'Dispatch',inputProps}));
      const composition=compositions.get(job.props);
      if(composition.width!==1080||composition.height!==1920||composition.fps!==30)throw new Error('Unexpected Dispatch frame contract');
      fs.mkdirSync(path.dirname(job.output),{recursive:true});
      if(job.kind==='still'){
        await api.renderStill({...common,composition,inputProps,frame:job.frame,output:job.output,imageFormat:'png'});
      }else{
        const scale=job.preview===true?.25:1;
        await api.renderMedia({...common,composition,inputProps,outputLocation:job.output,codec:'h264',
          imageFormat:job.preview===true?'jpeg':'png',crf:job.preview===true?32:16,
          pixelFormat:'yuv420p',muted:true,scale,frameRange:job.frames,
          concurrency:process.env.DISPATCH_RENDER_CONCURRENCY??'50%'});
      }
    }
  }finally{await browser.close({silent:true});}
  return {schema:'dispatch-render-batch/1',bundles:1,browsers:1,jobs:spec.jobs.length,
    native:!spec.jobs.some(j=>j.preview===true),elapsed_ms:Date.now()-started};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  let spec;
  if(process.argv[2]==='--board'){
    const args=Object.fromEntries(Array.from({length:(process.argv.length-2)/2},(_,i)=>[process.argv[2+i*2],process.argv[3+i*2]]));
    if(!args['--output'])throw new Error('--output is required');
    spec={jobs:[{kind:'video',props:path.resolve(args['--board']),output:path.resolve(args['--output']),preview:args['--preview']==='true'}]};
  }else spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const result=await renderBatch(spec);
  if(spec.report)fs.writeFileSync(spec.report,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}
