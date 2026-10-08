import React,{createContext,useContext} from 'react';
import {Img,staticFile} from 'remotion';

export type ArtRequest={id:string;role:'hero'|'support';file:string;scene_ids:string[];purpose:string;prompt:string;source_limit:string};
export type ArtEntry={request_id:string;file:string;sha256:string;generation_id:string;generated_at:string;tool:string;
 width:number;height:number;slices?:Record<string,[number,number,number,number]>};
export type StoryArt={version:'fresh-story-art-v1';requests:ArtRequest[];entries:ArtEntry[]};
const ArtContext=createContext<StoryArt|undefined>(undefined);
export const StoryArtProvider:React.FC<{plan?:StoryArt;children:React.ReactNode}>=({plan,children})=>{
 if(plan?.version!=='fresh-story-art-v1'||plan.entries.length!==2)throw new Error('Fresh generated storyboard artwork is required');
 return <ArtContext.Provider value={plan}>{children}</ArtContext.Provider>;
};
export const ArtSprite:React.FC<{role:'hero'|'support';slice?:string;x:number;y:number;width:number;height:number}>=
 ({role,slice,x,y,width,height})=>{
 const plan=useContext(ArtContext);
 const req=plan?.requests.find(r=>r.role===role),entry=plan?.entries.find(e=>e.request_id===req?.id);
 if(!entry||!entry.file.startsWith('generated/story-art/'))throw new Error('Current story art is missing; no old prop fallback');
 const rect=slice?entry.slices?.[slice]:[0,0,entry.width,entry.height];
 if(!rect)throw new Error('Unimplemented generated prop slice');
 return <svg x={x} y={y} width={width} height={height} viewBox={rect.join(' ')} overflow="hidden" data-art-file={entry.file}>
  <foreignObject x={0} y={0} width={entry.width} height={entry.height}>
   <Img src={staticFile(entry.file)} style={{width:entry.width,height:entry.height,display:'block'}}/>
  </foreignObject>
 </svg>;
};
