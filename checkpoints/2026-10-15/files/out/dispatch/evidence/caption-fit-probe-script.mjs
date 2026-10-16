import {build} from '/home/user/restore/2026-10-15/video-engine/node_modules/esbuild/lib/main.js';
import {createRequire} from 'node:module';
const out='/tmp/claude-0/-home-user/a01b68a5-1011-5253-81df-ddd44b3ea977/scratchpad/probe.cjs';
await build({entryPoints:['/home/user/restore/2026-10-15/video-engine/tests/type_fit_probe.tsx'],bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:out,logLevel:'error'});
const {captionLayout,CAPTION_TEXT_WIDTH}=createRequire(import.meta.url)(out);
for (const t of process.argv.slice(2)) { try { const f=captionLayout(t,CAPTION_TEXT_WIDTH,2); console.log(f.size,f.lines.length,t.length,t.slice(0,50)); } catch(e){ console.log('FAIL',t.length,t.slice(0,50)); } }
