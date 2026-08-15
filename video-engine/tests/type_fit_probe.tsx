// The engine's own type helpers and banner layout, re-exported for the checker.
//
// ONE CALCULATION, NOT TWO. The gate calls the same `alertBanner` the drawing calls,
// so it cannot pass while the picture overflows. A checker with its own copy of the
// layout is a checker that agrees with itself.
export {widthEm, widthOf, wrapToWidth, overflows} from '../src/lib/type';
export {alertBanner, BANNER_INNER, HOME_BAR} from '../src/lib/water';
