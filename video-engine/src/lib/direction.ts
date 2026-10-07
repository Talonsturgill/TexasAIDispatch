/** Film-global, board-driven action timing. Remotion Sequences must not reset this clock. */
export type DirectedScene = {
  id: string; start_s: number; duration_s: number;
  visual_events?: {id?: string; at_s: number; duration_s?: number; item_ids?: string[];
    motion?: {curve: 'smoothstep'|'linear'|'travel'|'contact'|'landing'; anticipation?: number; settle?: number;free_prop_reason?:string}}[];
};
export type ActionWindow = {start: number; end: number; scene: string; itemIds: string[];
  motion?: NonNullable<DirectedScene['visual_events']>[number]['motion']};
export function actionWindows(scenes: DirectedScene[]): Record<string, ActionWindow> {
  const windows: Record<string, ActionWindow> = Object.create(null);
  for (const scene of scenes) for (const event of scene.visual_events ?? []) {
    if (!event.id) continue;
    if (windows[event.id]) throw new Error('Duplicate action id '+event.id);
    const start = scene.start_s + event.at_s;
    const duration = event.duration_s ?? .6;
    if (!Number.isFinite(start) || !Number.isFinite(duration) || duration<=0 ||
        event.at_s<0 || event.at_s+duration>scene.duration_s+.001) {
      throw new Error('Action '+event.id+' falls outside its scene');
    }
    windows[event.id]={start,end:start+duration,scene:scene.id,itemIds:event.item_ids??[],
      ...(event.motion ? {motion:event.motion} : {})};
  }
  return windows;
}
export function requireAction(windows: Record<string, ActionWindow>, id: string): ActionWindow {
  const found=windows[id];
  if (!found) throw new Error('Missing board action '+id);
  return found;
}
export function actionProgress(window: ActionWindow, storyTime: number): number {
  const p=Math.max(0,Math.min(1,(storyTime-window.start)/(window.end-window.start)));
  if (!window.motion) return p*p*(3-2*p);
  const {curve,anticipation=0,settle=0}=window.motion;
  if (!['smoothstep','linear','travel','contact','landing'].includes(curve) ||
      !Number.isFinite(anticipation) || anticipation<0 || anticipation>.3 ||
      !Number.isFinite(settle) || settle<0 || settle>.4) {
    throw new Error('Invalid directed event motion');
  }
  if (p===0 || p===1) return p;
  const q=Math.max(0,Math.min(1,(p-anticipation)/(1-anticipation-settle)));
  if (curve==='linear') return q;
  // Both constrained curves enter and leave a hold with zero velocity and
  // acceleration. The old contact ease jumped straight to maximum speed;
  // the two-piece travel curve changed acceleration abruptly at its midpoint.
  if (curve==='contact') return q*q*q*(20+q*(-45+q*(36-10*q)));
  if (curve==='travel') return q*q*q*(10+q*(-15+6*q));
  if (curve==='landing') {
    // A small overshoot is opt-in for free props, never for a constrained contact.
    const base=1-Math.pow(1-q,3);
    const bounce=q>.6?.035*Math.sin((q-.6)/.4*Math.PI)*Math.exp(-(q-.6)*2):0;
    return q===0 || q===1 ? q : base+bounce;
  }
  return q*q*(3-2*q);
}
export function directedValue(window: ActionWindow, storyTime: number, from: number, to: number) {
  return from+(to-from)*actionProgress(window,storyTime);
}

/** Explicitly join adjacent stages of one stroke without restarting its speed.
 * Interior authored rests must never disappear into a continuous movement. */
export function joinedActionWindow(windows: Record<string,ActionWindow>, ids: string[]): ActionWindow {
  if(ids.length<2 || new Set(ids).size!==ids.length)throw new Error('Joined action needs distinct consecutive events');
  const rows=ids.map(id=>requireAction(windows,id)),first=rows[0],last=rows[rows.length-1];
  const curve=first.motion?.curve;
  if(curve!=='travel' && curve!=='contact')throw new Error('Joined action needs a constrained continuous curve');
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(row.scene!==first.scene || row.motion?.curve!==curve ||
       (i>0 && (Math.abs(row.start-rows[i-1].end)>.001 || (row.motion.anticipation??0)!==0)) ||
       (i<rows.length-1 && (row.motion.settle??0)!==0)) {
      throw new Error('Joined action cannot cross a scene, gap, curve change or interior hold');
    }
  }
  const duration=last.end-first.start;
  return {start:first.start,end:last.end,scene:first.scene,itemIds:[...new Set(rows.flatMap(r=>r.itemIds))],
    motion:{curve,anticipation:(first.motion?.anticipation??0)*(first.end-first.start)/duration,
      settle:(last.motion?.settle??0)*(last.end-last.start)/duration}};
}
