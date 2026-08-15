import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {HBCUBand, BLACKTX_M} from '../src/lib/blacktexas';
import {Comal, RaspaCup, TEJANO_M} from '../src/lib/tejano';
import {M} from '../src/lib/scale';

const scales = (m: string) => [...m.matchAll(/scale\(([-\d.]+)\)/g)].map((x) => parseFloat(x[1]));

export interface Row {what: string; value: number; lo: number; hi: number; why: string}

/**
 * The band's scale AS IT WAS before the fix, replayed so the measurement is provably
 * able to go red. A gate that only ever sees the corrected code proves nothing.
 */
export function oldBandScale(): number {
  const K = ((BLACKTX_M.sousaphone.h * M) / 90) * 0.16;
  return (90 * 1.09 * K) / M;
}

export function measurements(): Row[] {
  const band = renderToStaticMarkup(<HBCUBand h={90} ranks={4} files={10} spread={620} />);
  // root scale(1), the drum major at K * 1.25, then each rank at K * (1 - r * 0.05).
  const K = Math.max(...scales(band)) / 1.25;

  const comal = renderToStaticMarkup(<Comal h={90} />);
  const ck = scales(comal)[0];
  const cup = scales(renderToStaticMarkup(<RaspaCup h={70} />))[0];

  return [
    {what: 'a marching band member', value: (90 * 1.09 * K) / M, lo: 1.5, hi: 1.95,
     why: 'the same rig height as the cast. It rendered 0.133 m when the fit was on a horn.'},
    {what: 'the band file interval', value: ((620 / 9) * K) / M, lo: 0.6, hi: 1.6,
     why: 'a drill step is about 22.5 inches, so two steps between files.'},
    {what: 'the comal across', value: (90 * 1.2 * ck) / M, lo: 0.26, hi: 0.36,
     why: `TEJANO_M.comal declares ${TEJANO_M.comal.h} m across.`},
    {what: 'the flour tortilla', value: (2 * 90 * 0.46 * ck) / M, lo: 0.17, hi: 0.27,
     why: 'the docstring says seven to ten inches. It rendered 0.92 m.'},
    {what: 'the raspa cup to the rim', value: (70 * 0.86 * cup) / M, lo: 0.16, hi: 0.24,
     why: `TEJANO_M.raspaCup declares ${TEJANO_M.raspaCup.h} m. It rendered 1.03 m.`},
  ];
}
