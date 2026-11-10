/** Native PNG batches feed one continuous pinned encoder; no lossy chunk joins. */
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {crc32} from "node:zlib";
import {finished} from "node:stream/promises";
import {renderFrames, makeCancelSignal} from "@remotion/renderer";
const require=createRequire(import.meta.url);
const rendererDirectory=path.dirname(require.resolve("@remotion/renderer"));
const {prespawnFfmpeg}=require(path.join(rendererDirectory,"prespawn-ffmpeg.js"));
const root=path.resolve(import.meta.dirname,"../..");
export const policy=JSON.parse(fs.readFileSync(path.join(root,"config/bounded_png_capture_v1.json"),"utf8"));
const expected={schema:"dispatch-bounded-png-capture/1",max_frames:60,width:1080,height:1920,fps:30,image_format:"png",crf:16,pixel_format:"yuv420p",remotion_version:"4.0.399",max_png_bytes_per_frame:9437184,reserve_gib:5};
export function validatePolicy(value=policy){
  if(JSON.stringify(Object.keys(value).sort())!==JSON.stringify(Object.keys(expected).sort())||Object.entries(expected).some(([k,v])=>value[k]!==v))throw new Error("Unverified bounded PNG policy");
  const installed=require(path.join(rendererDirectory,"../package.json")).version;
  if(installed!==expected.remotion_version)throw new Error("Bounded PNG encoder requires the tested exact Remotion version");
}
export function frameRanges(first,last,batch=policy.max_frames){
  if(!Number.isSafeInteger(first)||!Number.isSafeInteger(last)||first<0||last<first||!Number.isSafeInteger(batch)||batch<1||batch>policy.max_frames)throw new Error("Invalid bounded frame range");
  const ranges=[];for(let start=first;start<=last;start+=batch)ranges.push([start,Math.min(last,start+batch-1)]);return ranges;
}
export function inspectPng(file){
  const stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>policy.max_png_bytes_per_frame||stat.size<33)throw new Error("Invalid or oversized native PNG");
  const header=fs.readFileSync(file);
  if(header.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||header.readUInt32BE(8)!==13||header.toString("ascii",12,16)!=="IHDR"||header.readUInt32BE(16)!==1080||header.readUInt32BE(20)!==1920||header[24]!==8||![2,6].includes(header[25])||header[26]!==0||header[27]!==0||header[28]!==0)throw new Error("PNG differs from native frame contract");
  let offset=8,sawData=false,sawEnd=false;
  while(offset<header.length){
    if(offset+12>header.length)throw new Error("Truncated native PNG chunk");
    const length=header.readUInt32BE(offset),end=offset+12+length;
    if(end>header.length||crc32(header.subarray(offset+4,end-4))!==header.readUInt32BE(end-4))throw new Error("Corrupt native PNG chunk");
    const type=header.toString("ascii",offset+4,offset+8);
    if(type==="IDAT")sawData=true;
    if(type==="IHDR"&&offset!==8)throw new Error("Duplicate PNG header");
    if(type==="IEND"){if(length!==0||end!==header.length)throw new Error("Invalid native PNG ending");sawEnd=true;}
    offset=end;
  }
  if(!sawData||!sawEnd)throw new Error("Incomplete native PNG");
  return stat.size;
}
export function inspectJpeg(file){
  const stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>policy.max_png_bytes_per_frame||stat.size<4)throw new Error("Invalid or oversized preview JPEG");
  const bytes=fs.readFileSync(file);
  if(bytes.readUInt16BE(0)!==0xffd8||bytes.readUInt16BE(bytes.length-2)!==0xffd9)throw new Error("Incomplete preview JPEG");
  let offset=2;
  while(offset+4<bytes.length){
    if(bytes[offset]!==255)throw new Error("Invalid JPEG marker");
    const type=bytes[offset+1],length=bytes.readUInt16BE(offset+2);
    if(length<2||offset+2+length>bytes.length)throw new Error("Invalid JPEG segment");
    if([0xc0,0xc1,0xc2].includes(type)){
      if(length<8||bytes[offset+4]!==8||bytes.readUInt16BE(offset+5)!==480||bytes.readUInt16BE(offset+7)!==270)throw new Error("JPEG differs from existing quarter-scale preview contract");
      return stat.size;
    }
    offset+=length+2;
  }
  throw new Error("Missing preview JPEG dimensions");
}
export async function writeFrame(stream,buffer){
  if(stream.destroyed||stream.writableEnded)throw new Error("Encoder input closed before final frame");
  if(!stream.write(buffer))await new Promise((resolve,reject)=>{
    const cleanup=()=>{stream.removeListener("drain",drain);stream.removeListener("error",error);stream.removeListener("close",close);};
    const drain=()=>{cleanup();resolve();},error=err=>{cleanup();reject(err);},close=()=>error(new Error("Encoder closed before backpressure drained"));
    stream.once("drain",drain);stream.once("error",error);stream.once("close",close);
    if(stream.destroyed)close();
  });
}
function freeBytes(directory){const st=fs.statfsSync(directory);return st.bavail*st.bsize;}
function makeEncoder(options){return prespawnFfmpeg({width:options.width,height:options.height,fps:30,outputLocation:options.output,
  pixelFormat:"yuv420p",codec:"h264",crf:options.crf,x264Preset:null,onProgress:()=>{},proResProfile:undefined,
  logLevel:"error",imageFormat:options.imageFormat,ffmpegOverride:({args})=>args,signal:options.signal,
  videoBitrate:null,encodingMaxRate:null,encodingBufferSize:null,indent:false,colorSpace:"default",
  binariesDirectory:null,hardwareAcceleration:"disable"});}

export async function boundedPngRender(options,dependencies={}){
  validatePolicy();
  const {composition,frameRange,outputLocation}=options;
  const native=options.imageFormat==="png"&&options.crf===16&&options.scale===1;
  const preview=options.imageFormat==="jpeg"&&options.crf===32&&options.scale===.25;
  if(!composition||composition.width!==1080||composition.height!==1920||composition.fps!==30||
      (!native&&!preview)||options.codec!=="h264"||options.pixelFormat!=="yuv420p"||
      options.muted!==true||typeof outputLocation!=="string")throw new Error("Bounded capture requires the exact native silent PNG recipe");
  for(const key of ["ffmpegOverride","colorSpace","videoBitrate","encodingMaxRate","encodingBufferSize","everyNthFrame","x264Preset","hardwareAcceleration","compositionStart","binariesDirectory","repro"]){if(options[key]!==undefined)throw new Error("Unverified bounded capture option: "+key);}
  const first=frameRange?.[0]??0,last=frameRange?.[1]??composition.durationInFrames-1;
  if(frameRange!==undefined&&(!Array.isArray(frameRange)||frameRange.length!==2))throw new Error("Expected contiguous inclusive native frame range");
  if(last>=composition.durationInFrames)throw new Error("Native range exceeds composition");
  const ranges=frameRanges(first,last);
  const width=native?1080:270,height=native?1920:480,imageFormat=options.imageFormat;
  const render=dependencies.renderFrames??renderFrames,encode=dependencies.makeEncoder??makeEncoder,available=dependencies.freeBytes??freeBytes;
  const output=path.resolve(outputLocation),directory=path.dirname(output);
  fs.mkdirSync(directory,{recursive:true});
  const reserve=policy.reserve_gib*1024**3,budget=policy.max_frames*policy.max_png_bytes_per_frame;
  if(available(directory)<reserve+budget)throw new Error("Insufficient bounded PNG headroom before capture");
  const outputReceipt=output+".bounded-png.json";
  for(const target of [output,outputReceipt])if(fs.existsSync(target)&&(!fs.lstatSync(target).isFile()||fs.lstatSync(target).isSymbolicLink()))throw new Error("Preserve non-file or symbolic-link output");
  const scratch=fs.mkdtempSync(path.join(directory,".bounded-png-"));
  const framesDirectory=path.join(scratch,"frames");fs.mkdirSync(framesDirectory);
  const temporary=path.join(scratch,"encoded.mp4"),receipt=path.join(scratch,"receipt.json");
  const cancel=makeCancelSignal();let aborted=false,encoder,encoderFailure,peak=0,count=0,succeeded=false;
  let oldOutput=false,oldReceipt=false,newOutput=false,newReceipt=false;
  const previousOutput=path.join(scratch,"previous-output.mp4"),previousReceipt=path.join(scratch,"previous-receipt.json");
  const interrupt=()=>{aborted=true;cancel.cancel();};
  process.once("SIGINT",interrupt);process.once("SIGTERM",interrupt);options.cancelSignal?.(interrupt);
  const record=(status,error)=>fs.writeFileSync(receipt,JSON.stringify({schema:"dispatch-bounded-png-render/1",status,first,last,frames:count,peak_png_bytes:peak,max_batch_frames:policy.max_frames,image_format:imageFormat,width,height,crf:options.crf,partial_output:temporary,error:error?.message??null},null,2)+"\n");
  try{
    if(aborted)throw new Error("Bounded capture cancelled before encoding");
    encoder=encode({output:temporary,signal:cancel.cancelSignal,width,height,imageFormat,crf:options.crf});
    // Attach rejection handlers immediately, including an early EPIPE while Chromium is busy.
    const encoding=Promise.resolve(encoder.task).then(()=>{if(count!==last-first+1)throw new Error("Encoder exited before all frames were supplied");}).catch(error=>{encoderFailure=error;interrupt();});
    const stream=encoder.task.stdin;stream.on("error",error=>{encoderFailure=error;interrupt();});
    for(const [start,end] of ranges){
      if(aborted||encoderFailure)throw encoderFailure??new Error("Bounded capture cancelled");
      if(available(directory)<reserve+budget)throw new Error("Insufficient remaining bounded PNG headroom");
      await render({serveUrl:options.serveUrl,puppeteerInstance:options.puppeteerInstance,composition,inputProps:options.inputProps,
        chromiumOptions:options.chromiumOptions,timeoutInMilliseconds:options.timeoutInMilliseconds,logLevel:options.logLevel??"error",
        imageFormat,scale:options.scale,muted:true,concurrency:Math.min(2,Number(options.concurrency)||2),
        frameRange:[start,end],outputDir:framesDirectory,imageSequencePattern:"frame-[frame].[ext]",cancelSignal:cancel.cancelSignal});
      const files=fs.readdirSync(framesDirectory).map(name=>{const match=/^frame-(\d+)\.(png|jpeg)$/.exec(name);if(!match||match[2]!==imageFormat)throw new Error("Unexpected native batch entry");return {frame:Number(match[1]),file:path.join(framesDirectory,name)};}).sort((a,b)=>a.frame-b.frame);
      if(files.length!==end-start+1||files.some((row,i)=>row.frame!==start+i))throw new Error("Missing, duplicated or out-of-order native frames");
      const bytes=files.reduce((sum,row)=>sum+(native?inspectPng(row.file):inspectJpeg(row.file)),0);peak=Math.max(peak,bytes);
      if(bytes>budget)throw new Error("Native PNG batch exceeded the admitted storage bound");
      for(const row of files){
        if(aborted||encoderFailure)throw encoderFailure??new Error("Bounded capture cancelled");
        await writeFrame(stream,fs.readFileSync(row.file));count++;fs.unlinkSync(row.file);
      }
    }
    stream.end();await finished(stream);await encoding;
    if(aborted||encoderFailure)throw encoderFailure??new Error("Bounded capture cancelled");
    if(!fs.existsSync(temporary)||fs.statSync(temporary).size===0)throw new Error("Encoder produced no native video");
    record("complete");
    // Complete fallible scratch cleanup before touching a previously reviewed output.
    fs.rmdirSync(framesDirectory);
    if(fs.existsSync(outputReceipt)){fs.renameSync(outputReceipt,previousReceipt);oldReceipt=true;}
    if(fs.existsSync(output)){fs.renameSync(output,previousOutput);oldOutput=true;}
    fs.renameSync(receipt,outputReceipt);newReceipt=true;
    fs.renameSync(temporary,output);newOutput=true;
    succeeded=true;
    // Prior output/receipt bytes remain in the owned scratch directory when replaced.
    // Removing an empty directory is optional housekeeping, never a failed capture.
    if(!oldOutput&&!oldReceipt)try{fs.rmdirSync(scratch);}catch{}
    return {buffer:null,slowestFrames:[],boundedPng:{frames:count,peakPngBytes:peak}};
  }catch(error){
    interrupt();if(encoder?.task)await Promise.resolve(encoder.task).catch(()=>{});
    // A failed final rename cannot destroy the original reviewed output or receipt.
    if(oldOutput)fs.renameSync(previousOutput,output);else if(newOutput)fs.renameSync(output,temporary);
    if(oldReceipt)fs.renameSync(previousReceipt,outputReceipt);else if(newReceipt)fs.renameSync(outputReceipt,receipt);
    record("failed",error);throw error;
  }finally{
    process.removeListener("SIGINT",interrupt);process.removeListener("SIGTERM",interrupt);
    // Failed batch and partial encoder output are intentionally retained as bounded evidence.
    if(!succeeded)cancel.cancel();
  }
}
