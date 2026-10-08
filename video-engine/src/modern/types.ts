import type {DispatchProps, Scene} from '../Dispatch';
export type FilmShot = {
  id:string; scene_id:string; start_s:number; duration_s:number;
  framing:'wide'|'medium'|'close'|'detail'|'overhead'|'split';
  transition:'cut'|'match'|'occlusion'|'continuous';
  view:string; event_id:string; purpose:string; carry:string;
};
export type FilmDirection = {
  version:'directed-film-v2'; episode:string; variant:'a'|'b';
  renderer_inputs:{path:string;sha256:string}[];
  angle:string; opening_promise:string; performed_turn:string; closing_answer:string;
  shots:FilmShot[];
  rewards:{shot_id:string;event_id:string;at_s:number;kind:string;visible_change:string}[];
};
export type FilmRenderProps={board:DispatchProps;scene:Scene;shot:FilmShot;
  time_s:number;shot_s:number;variant:'a'|'b'};
