/**
 * THE FEED SAFE AREA. What the film may NOT draw in, because something else is already there.
 *
 * A 9:16 film is not watched in a rectangle any more. It is watched inside a feed, and the
 * feed puts its own furniture on top of the picture: a title and a caption along the bottom, a
 * column of round buttons up the right side, a progress hairline on the bottom edge. None of
 * that is the film's to move, and all of it lands on the film's own bottom band.
 *
 * ON 2026-08-19 THAT COLLISION SHIPPED. The Docket's feed went live, the first Dispatch went
 * into it, and the film's subtitle band drew underneath the feed's title and caption. Both were
 * legible on their own and neither was legible together. The band's bottom edge was at y=1752,
 * which is 8.75 percent of the frame height off the bottom, and the feed's overlay claims a
 * quarter of it.
 *
 * Nothing caught it, and nothing could have. Every gate this repo owns reads the board, the
 * claims, the mix or the frame, and each was right: the subtitle was correctly timed,
 * correctly wrapped, inside the frame and over an opaque plate. **The defect was not in the
 * film. It was in the space between the film and the surface that plays it**, which until this
 * file existed had no owner and no number.
 *
 * THE NUMBERS ARE MEASURED, NOT CHOSEN. They come from the live feed, in the browser, at the
 * viewport that gives the worst case, which is a phone rather than a desktop because the
 * narrower the stage the taller the overlay reads against it:
 *
 *   iPhone 13, 390x844, stage 374x664
 *     the title and caption block claims the bottom  25.03%
 *     the button rail claims the right               14.19%, up to 37.80% off the bottom
 *   desktop, 1440x900, stage 476x846
 *     the title and caption block claims the bottom  21.39%
 *     the button rail claims the right               11.35%, up to 29.79% off the bottom
 *
 * TO RE-MEASURE, which is required whenever the feed's CSS changes, read the stage and the
 * overlay rects out of the live page rather than the stylesheet:
 *
 *   const st = card.querySelector('.stage').getBoundingClientRect();
 *   const meta = card.querySelector('.meta').getBoundingClientRect();
 *   (st.bottom - meta.top) * 100 / st.height
 *
 * The reserve is the worst case rounded UP to the next whole percent, plus one point, because a
 * measurement that exactly equals the thing it is protecting against is a measurement that is
 * wrong the first time a font falls back.
 *
 * WHAT IS DELIBERATELY NOT RESERVED. The rail's height stops 37.80 percent off the bottom, so
 * the right reserve could legally be a notch rather than a full column. It is a full column
 * anyway. A notch is a rule with a second rule inside it, and the band that has to respect it
 * is sized by a solver that would then need both; the cost of the simpler rule is about a
 * hundred pixels of line width, and the cost of the cleverer one is the next collision nobody
 * predicts. The reader who taps a caption open is also not reserved for, since that is a
 * momentary state the reader chose and they can tap it shut.
 */

/** The composition, so the fractions below have something to be fractions OF. */
export const FRAME_W = 1080;
export const FRAME_H = 1920;

/** Measured 25.03% on a phone. Rounded up, plus a point. */
export const FEED_BOTTOM_RESERVE = 0.26;

/** Measured 14.19% on a phone. Rounded up, plus a point. */
export const FEED_RIGHT_RESERVE = 0.15;

/** The lowest y a film may draw its own chrome at, and the rightmost x. Everything the film
 *  puts on screen in screen space is solved against these two rather than against the frame. */
export const SAFE_BOTTOM = Math.round(FRAME_H * (1 - FEED_BOTTOM_RESERVE)); // 1421
export const SAFE_RIGHT = Math.round(FRAME_W * (1 - FEED_RIGHT_RESERVE));   // 918
