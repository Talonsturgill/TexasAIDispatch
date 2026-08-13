import {useId} from 'react';

// =============================================================================
// PER-INSTANCE IDS FOR SVG PAINT SERVERS.
//
// An SVG gradient, clip path or filter is referenced by DOCUMENT-GLOBAL id.
// `fill="url(#lh5_c)"` does not mean "the gradient my component just defined",
// it means "whatever in this document is called lh5_c", and the browser takes
// the FIRST one in document order without warning about the rest.
//
// THE DEFECT THIS EXISTS FOR. Every drawn thing in the library used to build its
// id out of its `seed` prop, and `seed` carries a per-species default:
//
//     const uid = `lh${seed}`;              // Longhorn, seed = 5
//
// so two longhorns staged without explicit distinct seeds both emitted
// `id="lh5_c"`, and the second animal was painted with the first animal's coat.
// The gradient's CONTENT is derived from other props (a hide colour, a paint
// colour, a wear amount), so the two are only interchangeable when the whole
// element is. Pass `hide` to one and not the other and the difference silently
// does not render.
//
// It got worse when the board arrived. Hand-authored review sheets pass seeds
// because a person is looking at a herd while typing it; `Dispatch.tsx` places
// elements from run data where `seed` is optional, so unseeded duplicates went
// from unlikely to ordinary. The one surface that would have shown the fault --
// the fauna sheet's herd row -- passes `seed={51 + i * 7}`, so it cannot.
//
// WHY `useId` AND NOT A COUNTER. A module-level counter would be unique but not
// stable: Remotion renders each frame as a fresh pass, so a counter would hand
// the same animal a different id every frame. That is harmless for paint, and it
// is the kind of harmless that stops being harmless the moment something caches.
// `useId` is derived from the component's position in the React tree, so it is
// the same on every frame that has the same tree, and different for every
// instance in one frame. That is precisely the property a paint-server id needs.
//
// WHAT THIS IS NOT FOR. Anything a viewer can SEE must not be derived from
// `useId`. Tree position shifts when a sibling appears -- and siblings appear on
// a frame condition all the time -- so an appearance keyed to it would change
// mid-shot. Ids are invisible, which is what makes them safe here. Appearance
// stays keyed to `seed`; see `Element` in registry.tsx for where a board-placed
// element gets a stable distinct one.
// =============================================================================

/**
 * A document-unique, frame-stable id prefix for one component instance.
 *
 * @param tag short human-readable species/vehicle tag, so a dumped frame is
 *            still readable in a browser inspector.
 */
export function useUid(tag: string): string {
  // React 19 formats the id `«r0»`. The guillemets are legal in a CSS ident but
  // nothing is gained by carrying them through a `url(#...)` reference, and
  // React 18's `:r0:` colons are NOT legal in a selector. Stripping to word
  // characters is safe for both: the delimiters are fixed, so removing them
  // cannot merge two distinct ids.
  return `${tag}${useId().replace(/[^A-Za-z0-9]/g, '')}`;
}
