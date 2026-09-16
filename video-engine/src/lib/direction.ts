/** Film-global, board-driven action timing. Remotion Sequences must not reset this clock. */
export type DirectedScene = {
  id: string; start_s: number; duration_s: number;
  visual_events?: {id?: string; at_s: number; duration_s?: number; item_ids?: string[]}[];
};
export type ActionWindow = {start: number; end: number; scene: string; itemIds: string[]};
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
    windows[event.id]={start,end:start+duration,scene:scene.id,itemIds:event.item_ids??[]};
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
  return p*p*(3-2*p);
}
export function directedValue(window: ActionWindow, storyTime: number, from: number, to: number) {
  return from+(to-from)*actionProgress(window,storyTime);
}
