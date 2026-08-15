import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {HBCUBand, BLACKTX_M} from '../src/lib/blacktexas';
import {Bleachers, TOWN_M} from '../src/lib/hometown';
import {Comal, RaspaCup, PanaderiaRack, TEJANO_M} from '../src/lib/tejano';
import {Gantry, CLINIC_M} from '../src/lib/clinic';
import {AutonomousRig, FREIGHT_M} from '../src/lib/freight';
import {M} from '../src/lib/scale';

// A two argument `scale(sx sy)` is how a component flips its facing, so the closing
// paren does not follow the first number. Matching only `scale(n)` read those as NaN.
const scales = (m: string) =>
  [...m.matchAll(/scale\(([-\d.]+)(?:[\s,]+[-\d.]+)?\)/g)].map((x) => parseFloat(x[1]));

/** Render as the film does: inside an <svg>. Outside one React treats SVG elements as
 *  HTML and warns about the casing of linearGradient, which is the harness being wrong
 *  about the context rather than the drawing being wrong. */
const draw = (node: React.ReactElement) =>
  renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg">{node}</svg>);

export interface Row {what: string; value: number; lo: number; hi: number; why: string}

/** One numeric attribute out of the drawing, by a pattern that names the thing. */
const attr = (markup: string, re: RegExp, group = 1) => {
  const m = re.exec(markup);
  if (!m) throw new Error(`nothing in the markup matched ${re}. The drawing changed shape, `
    + 'so this measurement is reading nothing and would pass on an empty string.');
  return parseFloat(m[group]);
};

/**
 * The band's scale AS IT WAS before the fix, replayed so the measurement is provably
 * able to go red. A gate that only ever sees the corrected code proves nothing.
 */
export function oldBandScale(): number {
  const K = ((BLACKTX_M.sousaphone.h * M) / 90) * 0.16;
  return (90 * 1.09 * K) / M;
}

/**
 * THE ROOF POD'S SIZE AS A FRACTION OF THE TRUCK, under the pre-fix expression, at
 * two staging scales. Replayed for the same reason as the band.
 *
 * `scale={0.42 / (K * scale)}` cancelled the STAGING scale as well as the parent's
 * fit, so the pod came out a fixed size on the page and its size relative to the
 * truck moved with however the truck was staged. These two numbers should be equal
 * and they differ by a factor of 6.25.
 */
export function oldPodFractions(): [number, number] {
  const podFit = (0.42 * M) / 100;               // fit('sensorMast', 100) at the old 0.42 m
  const rigFit = (4.15 * M) / 100;               // fit('autonomousRig', 100)
  const frac = (staging: number) => (83 * podFit * (0.42 / (rigFit * staging))) / 108;
  return [frac(1), frac(0.16)];                  // 108 was the typed cab roof
}

/**
 * `attr` REFUSES A SHAPE THAT IS NOT THERE.
 *
 * The failure this guards is the quiet one. A regex that stops matching because the
 * drawing was restructured would hand back NaN, every comparison against NaN is
 * false, and a measurement that reads nothing at all would report as a pass under
 * any bound written the other way round. Exported so the self-test can prove it.
 */
export function attrMisses(): boolean {
  try {
    attr('<rect x="1"/>', /y="(-[\d.]+)"/);
    return false;
  } catch {
    return true;
  }
}

export function measurements(): Row[] {
  const band = draw(<HBCUBand h={90} ranks={4} files={10} spread={620} />);
  // root scale(1), the drum major at K * 1.25, then each rank at K * (1 - r * 0.05).
  const K = Math.max(...scales(band)) / 1.25;

  const comal = draw(<Comal h={90} />);
  const ck = scales(comal)[0];
  const cup = scales(draw(<RaspaCup h={70} />))[0];

  // The sousaphone bell, inside the band block, sized through sub() off the player.
  const bell = 90 * 1.09 * (BLACKTX_M.sousaphone.h / BLACKTX_M.bandMember.h);
  // The bakery tray, sized through sub() off the rack rather than off however wide the
  // rack happened to be drawn.
  const rk = scales(draw(<PanaderiaRack h={200} w={300} charola />))[0];
  const tray = 200 * (TEJANO_M.charola.h / TEJANO_M.panaderiaRack.h);

  // The bleacher stack emits `scale(K facing K)`, so the first number is K.
  const bk = scales(draw(<Bleachers h={120} w={520} />))[0];
  const boxLocal = 120 * (TOWN_M.pressBox.h / TOWN_M.bleacher.h);

  // ---- the CT, read off the two shapes the whole machine is judged on. The cradle
  // is the only #c9c4bb rect and the bore the only circle painted with the bore
  // gradient, so both are named rather than counted.
  const ctM = draw(<Gantry kind="ct" scale={1} />);
  const ctK = scales(ctM)[0];
  const couch = -attr(ctM, /y="(-[\d.]+)"[^>]*fill="#c9c4bb"/);
  const bore = attr(ctM, /<circle[^>]*\br="([\d.]+)"[^>]*url\(#\w+_bore\)/);

  // ---- the rig. The van comes off its own rect. The cab roof and the pod's emitted
  // scale are taken as ONE match, because a drive wheel also sits at translate(-30 y)
  // and matching the mount alone would have read a tyre radius as the roof.
  const VAN = /<rect x="-436" y="(-[\d.]+)" width="390" height="([\d.]+)"/;
  const POD = /translate\(-30 (-[\d.]+)\)"><g transform="translate\(0 0\) scale\(([\d.]+)\)/;
  const rig = (staging: number) => draw(<AutonomousRig scale={staging} />);
  const r1 = rig(1);
  const rigK = scales(r1)[0];
  const vanTop = -attr(r1, VAN, 1);
  const vanFloor = vanTop - attr(r1, VAN, 2);
  // The pod's height as a FRACTION of the cab roof it stands on. A fraction rather
  // than a metre value, because the defect it exists for is that the pod used to
  // change size relative to the truck when the truck was staged.
  const podShare = (markup: string) =>
    (83 * attr(markup, POD, 2)) / -attr(markup, POD, 1);

  return [
    {what: 'a marching band member', value: (90 * 1.09 * K) / M, lo: 1.5, hi: 1.95,
     why: 'the same rig height as the cast. It rendered 0.133 m when the fit was on a horn.'},
    {what: 'the band file interval', value: ((620 / 9) * K) / M, lo: 0.6, hi: 1.6,
     why: 'a drill step is about 22.5 inches, so two steps between files.'},
    {what: 'the comal across', value: (90 * 1.2 * ck) / M, lo: 0.26, hi: 0.36,
     why: `TEJANO_M.comal declares ${TEJANO_M.comal.h} m across.`},
    {what: 'the flour tortilla', value: (2 * 90 * 0.46 * ck) / M, lo: 0.17, hi: 0.27,
     why: 'the docstring says seven to ten inches. It rendered 0.92 m.'},
    {what: 'the bleacher stack', value: (120 * bk) / M, lo: 6.3, hi: 7.7,
     why: `TOWN_M.bleacher declares ${TOWN_M.bleacher.h} m at the top row.`},
    {what: 'the press box', value: (boxLocal * bk) / M, lo: 2.9, hi: 3.5,
     why: `TOWN_M.pressBox declares ${TOWN_M.pressBox.h} m. It rendered 2.10 m as h * 0.30.`},
    {what: 'the sousaphone bell', value: (bell * K) / M, lo: 0.66, hi: 0.86,
     why: `BLACKTX_M.sousaphone declares ${BLACKTX_M.sousaphone.h} m. It drew 0.873 m as a `
          + 'fraction of the player.'},
    {what: 'the bakery tray across', value: (tray * rk) / M, lo: 0.40, hi: 0.52,
     why: `TEJANO_M.charola declares ${TEJANO_M.charola.h} m across. Its entry used to record `
          + 'thickness, which scales nothing, so the tray was a fraction of the rack width.'},
    {what: 'the raspa cup to the rim', value: (70 * 0.86 * cup) / M, lo: 0.16, hi: 0.24,
     why: `TEJANO_M.raspaCup declares ${TEJANO_M.raspaCup.h} m. It rendered 1.03 m.`},
    {what: 'the CT patient couch', value: (couch * ctK) / M, lo: 0.68, hi: 0.82,
     why: `CLINIC_M.couch declares ${CLINIC_M.couch.h} m. It rendered 1.06 m, chest height on `
          + 'the clinician standing beside it, because it had been raised to meet a bore drawn '
          + 'at a linac\'s size.'},
    {what: 'the CT bore across', value: (2 * bore * ctK) / M, lo: 0.62, hi: 0.80,
     why: 'a CT bore is 0.70 m and this one drew 1.41 m, which is a linac drum face. It is the '
          + 'number the couch was bent to fit.'},
    {what: 'the day cab roof', value: (-attr(r1, POD, 1) * rigK) / M, lo: 3.85, hi: 4.15,
     why: `FREIGHT_M.tractor declares ${FREIGHT_M.tractor.h} m. It rendered 4.48 m, ABOVE the `
          + 'declared height of the whole rig, with the roof pod standing on top of that.'},
    {what: 'the van trailer roof', value: (vanTop * rigK) / M, lo: 3.95, hi: 4.25,
     why: `FREIGHT_M.vanTrailer declares ${FREIGHT_M.vanTrailer.h} m, the 13 foot 6 a dry van `
          + 'is built to. It rendered 3.24 m, more than a metre below the cab roof.'},
    {what: 'the van trailer floor', value: (vanFloor * rigK) / M, lo: 1.10, hi: 1.35,
     why: `FREIGHT_M.trailerDeck declares ${FREIGHT_M.trailerDeck.h} m, which is also the fifth `
          + 'wheel plate. It rendered 0.91 m, BELOW the coupling the trailer rests on.'},
    {what: 'the roof pod', value: (podShare(r1) * FREIGHT_M.tractor.h), lo: 0.20, hi: 0.32,
     why: `FREIGHT_M.sensorMast declares ${FREIGHT_M.sensorMast.h} m. It rendered 0.92 m, a `
          + 'box the size of a bar stool on the roof of a truck.'},
    // NOT A SIZE, A RATIO OF TWO SIZES. The pod used to be scaled by an expression that
    // cancelled the rig's staging scale, so the same truck got a pod six times bigger at
    // one staging than another and no single measurement could have caught it.
    {what: 'the roof pod staged at 0.16, over the same pod staged at 1',
     value: podShare(rig(0.16)) / podShare(r1), lo: 0.999, hi: 1.001,
     why: 'a part of a vehicle is the same part at every size the vehicle is drawn. This came '
          + 'out 6.25 when the pod was scaled by 0.42 / (K * scale).'},
  ];
}
