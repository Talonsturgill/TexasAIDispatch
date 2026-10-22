import React, {useEffect, useState} from 'react';
import {staticFile, delayRender, continueRender} from 'remotion';

// =============================================================================
// FONTS — the three faces this film is set in, shipped with it.
//
// WHY THIS FILE EXISTS
//
// Every drawing in this engine asked for `Georgia, serif` and the repo shipped no
// font. Georgia is a Microsoft face and is not on a Linux render box, so
// `fc-match Georgia` returned DejaVu Serif and the film was set in whatever the
// machine happened to have. Seventy-four text sites, two more stacks asking for a
// monospace nobody supplied, and **the film was not the same film on two machines.**
//
// It is worse than a wrong typeface. Every width in the picture came from a face
// nobody chose, so a panel sized to hold a line held it or did not depending on the
// host, and the one caption about an emergency ran off the phone it was drawn on.
// A drawing cannot be checked against type it does not control.
//
// THE THREE FACES ARE THE SITE'S. alaskaaihq's successor publishes in Fraunces,
// Manrope and JetBrains Mono, and the products are meant to read as siblings, so the
// film now sets in the same three rather than inventing a fourth voice. All three are
// SIL Open Font License 1.1, which permits embedding and redistribution, and the
// licence travels with them in `public/fonts/OFL.txt`.
//
// HOW IT IS LOADED. Remotion captures a frame the moment React settles, and a font
// that is still arriving at that moment is a frame set in the fallback. `delayRender`
// holds the capture until `document.fonts` reports every face ready. Without that the
// first frames of a render come out in a different typeface from the rest, which is
// the kind of fault that looks like a compression artefact and is not.
// =============================================================================

export interface Face {
  family: string;
  file: string;
  /** A range for a variable font, a single value for a static one. */
  weight: string;
  /** What to ask `document.fonts.load` for. A range is not a valid query. */
  probe: string;
}

/** THE FACES THIS REPO SHIPS. `font_check.py` reads this list and refuses a family
 *  named anywhere in the engine that is not in it, and a file here that is not on
 *  disk. A font stack that names something unshipped is the original defect. */
export const FACES: Face[] = [
  {family: 'Fraunces', file: 'fonts/Fraunces-Var.ttf', weight: '400 700', probe: '700 16px'},
  {family: 'Manrope', file: 'fonts/Manrope-Var.ttf', weight: '300 800', probe: '400 16px'},
  {family: 'JetBrains Mono', file: 'fonts/JetBrainsMono-Regular.ttf', weight: '400',
   probe: '400 16px'},
  {family: 'JetBrains Mono', file: 'fonts/JetBrainsMono-Bold.ttf', weight: '700',
   probe: '700 16px'},
];

const faceCss = (f: Face) =>
  `@font-face{font-family:"${f.family}";src:url("${staticFile(f.file)}") format("truetype");`
  + `font-weight:${f.weight};font-style:normal;font-display:block;}`;

/**
 * The `@font-face` block, plus the hold that stops a frame being captured before the
 * faces are ready.
 *
 * Renders a `<style>`, which is valid inside an `<svg>` and inside the document, so
 * the same component serves the review sheets and the film.
 */
export const FontFaces: React.FC = () => {
  const [handle] = useState(() => delayRender('loading the three faces'));

  useEffect(() => {
    let live = true;
    Promise.all(FACES.map((f) => document.fonts.load(`${f.probe} "${f.family}"`)))
      .then(() => document.fonts.ready)
      .catch(() => undefined)          // a missing face must not hang the render forever
      .then(() => {
        if (live) continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);

  return <style>{FACES.map(faceCss).join('')}</style>;
};

/**
 * Wrap a composition so it carries the faces.
 *
 * EVERY COMPOSITION GOES THROUGH THIS, and `composition_check.py` refuses one that
 * does not. Mounting `<FontFaces/>` by hand inside twenty-three components is
 * twenty-three chances to forget, and the one that forgot would render in the
 * fallback and look like every other frame until somebody measured it.
 */
export function withFonts<P extends object>(Inner: React.ComponentType<P>): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <>
      <FontFaces />
      <Inner {...props} />
    </>
  );
  Wrapped.displayName = `withFonts(${Inner.displayName || Inner.name || 'Component'})`;
  return Wrapped;
}
