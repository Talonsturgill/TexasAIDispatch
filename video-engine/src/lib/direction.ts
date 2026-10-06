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
  if (curve==='contact') return 1-Math.pow(1-q,3);
  if (curve==='travel') return q<.5 ? 4*q*q*q : 1-Math.pow(-2*q+2,3)/2;
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
