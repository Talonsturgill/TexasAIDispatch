import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {Writable} from 'node:stream';
import {deflateSync,crc32} from 'node:zlib';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {stitchFramesToVideo} from '@remotion/renderer';
import {boundedPngRender,frameRanges,inspectPng,inspectJpeg,policy,validatePolicy,writeFrame} from './bounded-png-render.mjs';

const require=createRequire(import.meta.url);
const renderer=path.dirname(require.resolve('@remotion/renderer'));
const {makeDownloadMap,cleanDownloadMap}=require(path.join(renderer,'assets/download-map.js'));
// Remotion's pinned binary encodes both paths; the system decoder supplies rawvideo.
const ffmpeg=process.env.DISPATCH_TEST_FFMPEG ?? '/usr/bin/ffmpeg';
const native={width:1080,height:1920,fps:30,durationInFrames:127};
const headroom=policy.reserve_gib*1024**3+policy.max_frames*policy.max_png_bytes_per_frame;
function chunk(name,data){const type=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);type.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([type,data])),out.length-4);return out;}
function png({entropy=false,seed=1}={}){const raw=Buffer.alloc((1080*4+1)*1920);let n=seed>>>0;for(let y=0;y<1920;y++)for(let x=0;x<1080*4;x++){n^=n<<13;n^=n>>>17;n^=n<<5;raw[y*(1080*4+1)+1+x]=entropy?n&255:(x+seed*29)&255;}const hdr=Buffer.alloc(13);hdr.writeUInt32BE(1080);hdr.writeUInt32BE(1920,4);hdr[8]=8;hdr[9]=6;return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',hdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const sample=png();
function sandbox(t){const base=path.resolve(import.meta.dirname,'../../out');fs.mkdirSync(base,{recursive:true});const dir=fs.mkdtempSync(path.join(base,'bounded-png-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function options(dir,extra={}){return {composition:native,outputLocation:path.join(dir,'film.mp4'),imageFormat:'png',codec:'h264',crf:16,pixelFormat:'yuv420p',muted:true,scale:1,frameRange:[0,0],...extra};}
function populate({frameRange,outputDir},image=sample){for(let f=frameRange[0];f<=frameRange[1];f++)fs.writeFileSync(path.join(outputDir,'frame-'+f+'.png'),image);}
function fakeEncoder({output,signal},behavior={}){let resolve,reject;const task=new Promise((a,b)=>{resolve=a;reject=b;});task.stdin=new Writable({highWaterMark:1,write(bytes,encoding,callback){if(behavior.epipe)return callback(Object.assign(new Error('synthetic EPIPE'),{code:'EPIPE'}));behavior.frames?.push(Buffer.from(bytes));setTimeout(callback,behavior.delay??0);},final(callback){fs.writeFileSync(output,'synthetic encoded video');callback();resolve();}});signal(()=>{task.stdin.destroy();reject(new Error('encoder cancelled'));});if(behavior.early)queueMicrotask(resolve);return {task};}
function deps(overrides={}){return {freeBytes:()=>headroom,renderFrames:async o=>populate(o),makeEncoder:o=>fakeEncoder(o),...overrides};}
function failureEvidence(dir){const scratch=fs.readdirSync(dir).filter(n=>n.startsWith('.bounded-png-'));assert.equal(scratch.length,1);const base=path.join(dir,scratch[0]);return {base,receipt:JSON.parse(fs.readFileSync(path.join(base,'receipt.json'),'utf8')),frames:fs.existsSync(path.join(base,'frames'))?fs.readdirSync(path.join(base,'frames')):[]};}

test('inclusive ranges cover nonzero starts and partial tail batches exactly once',()=>{for(const [first,last,batch] of [[0,0,60],[0,60,60],[7,131,60],[59,119,17],[100,102,1]]){const ranges=frameRanges(first,last,batch);assert.deepEqual(ranges.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i)),Array.from({length:last-first+1},(_,i)=>first+i));assert.ok(ranges.every(([a,b])=>b-a+1<=batch));}for(const args of [[-1,5],[2,1],[0,2,0],[0,2,61],[0.5,2],[0,2.5],[0,2,1.5],[0,Infinity]])assert.throws(()=>frameRanges(...args));});
test('policy refuses every changed or extra field',()=>{validatePolicy();for(const key of Object.keys(policy))assert.throws(()=>validatePolicy({...policy,[key]:null}),/policy/);assert.throws(()=>validatePolicy({...policy,extra:true}),/policy/);});
test('PNG dimensions, header, CRC, completeness, size and links are validated',t=>{const dir=sandbox(t),file=path.join(dir,'frame.png');fs.writeFileSync(file,sample);assert.equal(inspectPng(file),sample.length);for(const [offset,value] of [[0,0],[12,0],[19,0],[23,0],[24,16],[25,0],[26,1],[27,1],[28,1],[32,0]]){const bytes=Buffer.from(sample);bytes[offset]=value;fs.writeFileSync(file,bytes);assert.throws(()=>inspectPng(file));}for(const bytes of [sample.subarray(0,32),sample.subarray(0,33),sample.subarray(0,-12),Buffer.concat([sample,Buffer.from('trailing')])]){fs.writeFileSync(file,bytes);assert.throws(()=>inspectPng(file));}fs.writeFileSync(file,sample);fs.truncateSync(file,policy.max_png_bytes_per_frame+1);assert.throws(()=>inspectPng(file));const link=path.join(dir,'link.png');fs.symlinkSync(file,link);assert.throws(()=>inspectPng(link));assert.throws(()=>inspectPng(dir));});
test('native RGBA high-entropy PNG approaches raw size but stays below ceiling',t=>{const dir=sandbox(t),file=path.join(dir,'entropy.png'),bytes=png({entropy:true,seed:1827}),raw=1080*1920*4;fs.writeFileSync(file,bytes);assert.ok(bytes.length>raw*0.99);assert.ok(inspectPng(file)<policy.max_png_bytes_per_frame);t.diagnostic(JSON.stringify({nativeRGBA:raw,pngBytes:bytes.length,ceiling:policy.max_png_bytes_per_frame}));});
test('invalid recipes and unverified options refuse before encoder or render',async t=>{const dir=sandbox(t);const bad=[{imageFormat:'jpeg'},{crf:17},{codec:'h265'},{pixelFormat:'yuv444p'},{muted:false},{scale:0.5},{composition:{...native,width:720}},{composition:{...native,fps:24}},{frameRange:[0,127]},{frameRange:[0,0,1]},{frameRange:[1.5,2]}];for(const key of ['ffmpegOverride','colorSpace','videoBitrate','encodingMaxRate','encodingBufferSize','everyNthFrame','x264Preset','hardwareAcceleration','compositionStart','binariesDirectory','repro'])bad.push({[key]:null});for(const patch of bad)await assert.rejects(boundedPngRender(options(dir,patch),deps({renderFrames:()=>assert.fail('unexpected render'),makeEncoder:()=>assert.fail('unexpected encoder')})));assert.deepEqual(fs.readdirSync(dir),[]);});
test('batches delete consumed PNGs and emit bounded receipt',async t=>{const dir=sandbox(t),ranges=[],frames=[];const result=await boundedPngRender(options(dir,{frameRange:[5,126]}),deps({renderFrames:async o=>{assert.deepEqual(fs.readdirSync(o.outputDir),[]);assert.equal(o.imageFormat,'png');assert.equal(o.scale,1);assert.ok(o.concurrency<=2);ranges.push(o.frameRange);populate(o);},makeEncoder:o=>fakeEncoder(o,{frames})}));assert.deepEqual(ranges,[[5,64],[65,124],[125,126]]);assert.equal(frames.length,122);assert.equal(result.boundedPng.frames,122);assert.equal(result.boundedPng.peakPngBytes,sample.length*60);assert.deepEqual(fs.readdirSync(dir).sort(),['film.mp4','film.mp4.bounded-png.json']);assert.equal(JSON.parse(fs.readFileSync(options(dir).outputLocation+'.bounded-png.json')).status,'complete');});
test('headroom refuses before allocation and between batches',async t=>{const dir=sandbox(t);await assert.rejects(boundedPngRender(options(dir),deps({freeBytes:()=>headroom-1})),/headroom/);assert.deepEqual(fs.readdirSync(dir),[]);let calls=0;await assert.rejects(boundedPngRender(options(dir,{frameRange:[0,60]}),deps({freeBytes:()=>++calls<3?headroom:headroom-1})),/headroom/);const e=failureEvidence(dir);assert.equal(e.receipt.frames,60);assert.equal(e.frames.length,0);});
for(const mode of ['missing','duplicate','unexpected','render failure','early encoder','EPIPE','cancel'])test(mode+' retains bounded failure evidence and original output',async t=>{const dir=sandbox(t),out=options(dir).outputLocation;fs.writeFileSync(out,'existing reviewed film');let cancel;const recipe=options(dir,{frameRange:[0,2],cancelSignal:fn=>{cancel=fn;}});await assert.rejects(boundedPngRender(recipe,deps({makeEncoder:o=>fakeEncoder(o,{early:mode==='early encoder',epipe:mode==='EPIPE'}),renderFrames:async o=>{populate(o);if(mode==='missing')fs.unlinkSync(path.join(o.outputDir,'frame-1.png'));if(mode==='duplicate')fs.renameSync(path.join(o.outputDir,'frame-1.png'),path.join(o.outputDir,'frame-00.png'));if(mode==='unexpected')fs.writeFileSync(path.join(o.outputDir,'extra.txt'),'x');if(mode==='render failure')throw new Error('synthetic render failure');if(mode==='cancel')cancel();await new Promise(r=>setImmediate(r));}})));assert.equal(fs.readFileSync(out,'utf8'),'existing reviewed film');const e=failureEvidence(dir);assert.equal(e.receipt.status,'failed');assert.ok(e.frames.length<=policy.max_frames);assert.ok(e.receipt.frames<=3);});
test('writeFrame waits for drain and refuses closed input',async()=>{let complete=false;const stream=new Writable({highWaterMark:1,write(b,e,cb){setTimeout(()=>{complete=true;cb();},25);}});await writeFrame(stream,Buffer.alloc(100));assert.equal(complete,true);stream.end();await assert.rejects(writeFrame(stream,Buffer.alloc(1)),/closed/);});
test('writeFrame propagates EPIPE under backpressure',async()=>{const stream=new Writable({highWaterMark:1,write(b,e,cb){setImmediate(()=>cb(Object.assign(new Error('EPIPE'),{code:'EPIPE'})));}});await assert.rejects(writeFrame(stream,Buffer.alloc(2)),/EPIPE/);});
test('writeFrame rejects a clean close while waiting for drain',async()=>{
  const stream=new Writable({highWaterMark:1,write(){setImmediate(()=>this.destroy());}});
  let timer;
  try {
    const outcome=await Promise.race([
      writeFrame(stream,Buffer.alloc(2)).then(()=> 'resolved',()=> 'rejected'),
      new Promise(resolve=>{timer=setTimeout(()=>resolve('hung'),200);}),
    ]);
    assert.equal(outcome,'rejected','Closing an encoder pipe must not leave drain pending');
  } finally {clearTimeout(timer);stream.destroy();}
});
test('already cancelled capture never starts encoder or renderer',async t=>{
  const dir=sandbox(t);
  await assert.rejects(boundedPngRender(options(dir,{cancelSignal:fn=>fn()}),deps({
    makeEncoder:()=>assert.fail('encoder started after cancellation'),
    renderFrames:()=>assert.fail('renderer started after cancellation'),
  })),/cancelled/);
  assert.equal(failureEvidence(dir).receipt.status,'failed');
});
test('failed second batch retains only that batch and keeps old output',async t=>{
  const dir=sandbox(t),output=options(dir).outputLocation;
  fs.writeFileSync(output,'reviewed original');
  let batches=0;
  await assert.rejects(boundedPngRender(options(dir,{frameRange:[0,126]}),deps({renderFrames:async o=>{
    assert.deepEqual(fs.readdirSync(o.outputDir),[]);
    populate(o);
    if(++batches===2)throw new Error('second batch failed');
  }})),/second batch failed/);
  const evidence=failureEvidence(dir);
  assert.equal(evidence.receipt.frames,60);
  assert.equal(evidence.frames.length,60);
  assert.equal(fs.readFileSync(output,'utf8'),'reviewed original');
  assert.ok(evidence.frames.every(name=>Number(name.match(/\d+/)[0])>=60));
});
test('symbolic link output and its target are preserved',async t=>{
  const dir=sandbox(t),target=path.join(dir,'target.mp4');
  fs.writeFileSync(target,'reviewed original');
  fs.symlinkSync(target,options(dir).outputLocation);
  await assert.rejects(boundedPngRender(options(dir),deps()),/symbolic-link/);
  assert.equal(fs.readFileSync(target,'utf8'),'reviewed original');
  assert.ok(fs.lstatSync(options(dir).outputLocation).isSymbolicLink());
});
test('actual pinned PNG encoder matches legacy across batch boundary and nonzero start',{timeout:120000},async t=>{
  const dir=sandbox(t),legacyDir=path.join(dir,'legacy');
  fs.mkdirSync(legacyDir);
  const images=[sample,png({seed:2}),png({seed:3})];
  const first=7,count=63,ranges=[];
  for(let i=0;i<count;i++)fs.writeFileSync(path.join(legacyDir,'frame-'+i+'.png'),images[i%3]);
  await boundedPngRender(options(dir,{frameRange:[first,first+count-1]}),{
    freeBytes:()=>headroom,
    renderFrames:async o=>{
      ranges.push(o.frameRange);
      for(let i=o.frameRange[0];i<=o.frameRange[1];i++)fs.writeFileSync(path.join(o.outputDir,'frame-'+i+'.png'),images[(i-first)%3]);
    },
  });
  assert.deepEqual(ranges,[[7,66],[67,69]]);
  const legacy=path.join(dir,'legacy.mp4'),downloadMap=makeDownloadMap();
  try {
    await stitchFramesToVideo({
      width:1080,height:1920,fps:30,codec:'h264',crf:16,pixelFormat:'yuv420p',muted:true,outputLocation:legacy,
      assetsInfo:{assets:[],imageSequenceName:path.join(legacyDir,'frame-%d.png'),firstFrameIndex:0,downloadMap,chunkLengthInSeconds:count/30,trimLeftOffset:0,trimRightOffset:0,forSeamlessAacConcatenation:false},
    });
  } finally {cleanDownloadMap(downloadMap);}
  const hashes=file=>execFileSync(ffmpeg,['-v','error','-i',file,'-map','0:v:0','-f','framemd5','-'],{encoding:'utf8',maxBuffer:1024*1024}).split('\n').filter(line=>line&&!line.startsWith('#'));
  const actual=hashes(options(dir).outputLocation),expected=hashes(legacy);
  assert.equal(actual.length,count);
  assert.deepEqual(actual,expected);
});

function jpeg(seed=1){
  return execFileSync(ffmpeg,['-v','error','-f','image2pipe','-vcodec','png','-i','-','-vf','scale=270:480','-frames:v','1','-c:v','mjpeg','-f','image2pipe','-'],{input:png({seed}),maxBuffer:2*1024*1024});
}
test('preview JPEG validates dimensions, markers, bounds, truncation and links',t=>{
  const dir=sandbox(t),file=path.join(dir,'preview.jpeg'),bytes=jpeg();
  fs.writeFileSync(file,bytes);assert.equal(inspectJpeg(file),bytes.length);
  const sof=bytes.indexOf(Buffer.from([255,192]));
  assert.ok(sof>=0);
  for(const [offset,value] of [[0,0],[bytes.length-1,0],[sof+4,16],[sof+6,0],[sof+8,0],[4,255]]){
    const corrupt=Buffer.from(bytes);corrupt[offset]=value;
    fs.writeFileSync(file,corrupt);assert.throws(()=>inspectJpeg(file));
  }
  for(const corrupt of [bytes.subarray(0,3),bytes.subarray(0,-2),Buffer.from([255,216,255,217])]){
    fs.writeFileSync(file,corrupt);assert.throws(()=>inspectJpeg(file));
  }
  fs.writeFileSync(file,bytes);fs.truncateSync(file,policy.max_png_bytes_per_frame+1);
  assert.throws(()=>inspectJpeg(file));
  const link=path.join(dir,'link.jpeg');fs.symlinkSync(file,link);assert.throws(()=>inspectJpeg(link));
  assert.throws(()=>inspectJpeg(dir));
});
test('preview rejects incomplete or changed recipe tuples before capture',async t=>{
  const dir=sandbox(t);
  for(const patch of [{crf:16},{scale:1},{imageFormat:'png'},{crf:31},{scale:.5}]){
    await assert.rejects(boundedPngRender(options(dir,{imageFormat:'jpeg',crf:32,scale:.25,...patch}),deps({
      makeEncoder:()=>assert.fail('unexpected encoder'),renderFrames:()=>assert.fail('unexpected renderer'),
    })));
  }
});
test('preview pinned encoder matches legacy across 61-frame boundary',{timeout:120000},async t=>{
  const dir=sandbox(t),legacyDir=path.join(dir,'legacy');fs.mkdirSync(legacyDir);
  const images=[jpeg(1),jpeg(2),jpeg(3)],count=61,first=9,ranges=[];
  for(let i=0;i<count;i++)fs.writeFileSync(path.join(legacyDir,'frame-'+i+'.jpeg'),images[i%3]);
  await boundedPngRender(options(dir,{imageFormat:'jpeg',crf:32,scale:.25,frameRange:[first,first+count-1]}),{
    freeBytes:()=>headroom,renderFrames:async o=>{
      assert.equal(o.imageFormat,'jpeg');assert.equal(o.scale,.25);
      assert.deepEqual(fs.readdirSync(o.outputDir),[]);ranges.push(o.frameRange);
      for(let i=o.frameRange[0];i<=o.frameRange[1];i++)fs.writeFileSync(path.join(o.outputDir,'frame-'+i+'.jpeg'),images[(i-first)%3]);
    },
  });
  assert.deepEqual(ranges,[[9,68],[69,69]]);
  const legacy=path.join(dir,'legacy.mp4'),downloadMap=makeDownloadMap();
  try {await stitchFramesToVideo({
    width:270,height:480,fps:30,codec:'h264',crf:32,pixelFormat:'yuv420p',muted:true,outputLocation:legacy,
    assetsInfo:{assets:[],imageSequenceName:path.join(legacyDir,'frame-%d.jpeg'),firstFrameIndex:0,downloadMap,chunkLengthInSeconds:count/30,trimLeftOffset:0,trimRightOffset:0,forSeamlessAacConcatenation:false},
  });}finally{cleanDownloadMap(downloadMap);}
  const hashes=file=>execFileSync(ffmpeg,['-v','error','-i',file,'-map','0:v:0','-f','framemd5','-'],{encoding:'utf8',maxBuffer:1024*1024}).split('\n').filter(line=>line&&!line.startsWith('#'));
  const actual=hashes(options(dir).outputLocation);assert.equal(actual.length,count);assert.deepEqual(actual,hashes(legacy));
  const receipt=JSON.parse(fs.readFileSync(options(dir).outputLocation+'.bounded-png.json'));
  assert.deepEqual([receipt.image_format,receipt.width,receipt.height,receipt.crf],['jpeg',270,480,32]);
});
test('receipt path directory refuses before capture and preserves existing output',async t=>{
  const dir=sandbox(t),output=options(dir).outputLocation;
  fs.writeFileSync(output,'reviewed original');fs.mkdirSync(output+'.bounded-png.json');
  await assert.rejects(boundedPngRender(options(dir),deps({
    makeEncoder:()=>assert.fail('unexpected encoder'),renderFrames:()=>assert.fail('unexpected renderer'),
  })));
  assert.equal(fs.readFileSync(output,'utf8'),'reviewed original');
  assert.ok(fs.statSync(output+'.bounded-png.json').isDirectory());
  assert.deepEqual(fs.readdirSync(dir).sort(),['film.mp4','film.mp4.bounded-png.json']);
});
for(const which of ['encoded.mp4','receipt.json'])test('publication rename failure restores both originals for '+which,async t=>{
  const dir=sandbox(t),output=options(dir).outputLocation,receipt=output+'.bounded-png.json';
  fs.writeFileSync(output,'reviewed original');fs.writeFileSync(receipt,'original receipt');
  const rename=fs.renameSync;let injected=false;
  fs.renameSync=(from,to)=>{
    if(!injected&&path.basename(from)===which&&(to===output||to===receipt)){
      injected=true;throw Object.assign(new Error('injected publication rename failure'),{code:'EIO'});
    }
    return rename(from,to);
  };
  try {await assert.rejects(boundedPngRender(options(dir),deps()),/injected publication rename failure/);}
  finally {fs.renameSync=rename;}
  assert.ok(injected);assert.equal(fs.readFileSync(output,'utf8'),'reviewed original');assert.equal(fs.readFileSync(receipt,'utf8'),'original receipt');
  assert.equal(failureEvidence(dir).receipt.status,'failed');
});
test('frame directory cleanup failure leaves original publication untouched',async t=>{
  const dir=sandbox(t),output=options(dir).outputLocation,receipt=output+'.bounded-png.json';
  fs.writeFileSync(output,'reviewed original');fs.writeFileSync(receipt,'original receipt');
  const rmdir=fs.rmdirSync;let injected=false;
  fs.rmdirSync=(target,...rest)=>{if(path.basename(target)==='frames'){injected=true;throw new Error('injected frame cleanup failure');}return rmdir(target,...rest);};
  try {await assert.rejects(boundedPngRender(options(dir),deps()),/injected frame cleanup failure/);}
  finally {fs.rmdirSync=rmdir;}
  assert.ok(injected);assert.equal(fs.readFileSync(output,'utf8'),'reviewed original');assert.equal(fs.readFileSync(receipt,'utf8'),'original receipt');
});
test('final empty scratch cleanup failure does not misreport completed publication',async t=>{
  const dir=sandbox(t),output=options(dir).outputLocation;
  const rmdir=fs.rmdirSync;let injected=false;
  fs.rmdirSync=(target,...rest)=>{if(path.basename(target).startsWith('.bounded-png-')){injected=true;throw new Error('injected final cleanup failure');}return rmdir(target,...rest);};
  try {const result=await boundedPngRender(options(dir),deps());assert.equal(result.boundedPng.frames,1);}
  finally {fs.rmdirSync=rmdir;}
  assert.ok(injected);assert.equal(fs.readFileSync(output,'utf8'),'synthetic encoded video');
  assert.equal(JSON.parse(fs.readFileSync(output+'.bounded-png.json')).status,'complete');
});
