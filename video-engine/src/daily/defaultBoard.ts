import type {DispatchProps} from '../Dispatch';

/** A real two-scene daily board, so `remotion still Daily` renders with no props at all. */
export const DEFAULT_DAILY = {
  date: '2026-11-12',
  title: 'The daily lane',
  episode: 'daily-sample',
  runtime_s: 8,
  scenes: [
    {id: 's1', start_s: 0, duration_s: 4, county: 'Taylor', region: 'rolling_plains', interior: false,
      camera_strategy: 'dollyThrough', planes: [],
      visual_events: [{id: 's1-e1', at_s: 0.5, duration_s: 2.5, label: 'Crack found'}]},
    {id: 's2', start_s: 4, duration_s: 4, county: 'Taylor', region: 'rolling_plains', interior: false,
      camera_strategy: 'dollyThrough', planes: [],
      visual_events: [{id: 's2-e1', at_s: 0.4, duration_s: 2.8, label: 'First box ticked'}]},
  ],
  shots: [
    {id: 's1-a', scene_id: 's1', start_s: 0, duration_s: 4, framing: 'wide', transition: 'cut',
      view: 'pole-wide', event_id: 's1-e1', purpose: 'the camera finds the crack', cast: ['lineworker'], carry: ''},
    {id: 's2-a', scene_id: 's2', start_s: 4, duration_s: 4, framing: 'medium', transition: 'cut',
      view: 'worker-medium', event_id: 's2-e1', purpose: 'she ticks the first box', cast: ['lineworker'], carry: ''},
  ],
  captions: [
    {start: 0.3, end: 3.6, text: 'The camera on the pole finds a cracked insulator.'},
    {start: 4.2, end: 7.6, text: 'She ticks the first box on her list.'},
  ],
  credits: 'TEXAS AI DOCKET\nILLUSTRATION\nOriginal authored drawings',
  credits_s: 3,
} as unknown as DispatchProps;
