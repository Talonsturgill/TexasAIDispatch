// The engine's own type helpers and banner layout, re-exported for the checker.
//
// ONE CALCULATION, NOT TWO. The gate calls the same `alertBanner` the drawing calls,
// so it cannot pass while the picture overflows. A checker with its own copy of the
// layout is a checker that agrees with itself.
export {widthEm, widthOf, wrapBreakableToWidth, wrapToWidth, overflows} from '../src/lib/type';
export {alertBanner, BANNER_INNER, HOME_BAR} from '../src/lib/water';
export {captionLayout, captionBandHeight, creditLayout, CAPTION_BAND, CAPTION_TEXT_WIDTH, CAPTION_THIRD_LINE_BELOW, CAPTION_ENTRANCE_PX} from '../src/lib/editorial';
export {SAFE_RIGHT, SAFE_BOTTOM} from '../src/lib/safearea';
