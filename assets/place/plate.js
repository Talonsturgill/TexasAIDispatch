/* plate.js: one region's world, rendered once and cut into layers by distance.
 *
 * WHY THIS EXISTS (2026-10-09). Place is the Dispatch's weakest axis: 6.36 on the mean of the last
 * ten report cards, and the weakest axis in eight of ten panels. Every current-route film painted a
 * flat gradient behind its generated props, so a Harris County story and a Reeves County story
 * stood in the same nowhere. REGIONS.md has always said what each region looks like, and the
 * Docket's carousel engine (txthree.js and its kit of true-scale Texas models) can already draw it.
 * This module builds one region's world in that engine and frames it for a vertical 9:16 film.
 *
 * THE LAYERS ARE RENDERED, NOT CUT OUT OF A PICTURE. A layer cut from one finished picture has a
 * hole wherever something nearer stood, and the hole opens the moment the layers move. So every
 * layer is its own render of the same world, each with the rest of the world taken away, which
 * leaves it whole behind everything nearer. Shadows are drawn once, with every caster in the world,
 * and every layer reuses that map, so a tree's shadow stays on the ground it falls on.
 *
 * THE GROUND IS ONE LAYER, AND THE THINGS ON IT ARE CARDS. The first cut of this module sliced the
 * world into three bands by distance, and the bands had to move at three rates. Ground runs
 * unbroken from the camera to the horizon, so wherever a band ended the ground tore: on the
 * Blackland plate the near band moved as if it were 7 m away and the next as if it were 213 m away,
 * and a sideways move of a few centimetres sheared the crop rows along the seam. A camera moving
 * over a flat ground moves its picture by one exact perspective transform, so the ground is
 * rendered alone, as one layer, and the film moves it by that transform: no seam is possible. Each
 * thing standing on the ground is a card at its own measured distance, grouped with others no more
 * than CLUSTER_RATIO apart, so its base slides on the ground by a share of a pixel the bake measures.
 * The sky is a layer of its own, at infinity.
 *
 * A plate page calls:
 *   import { bake } from '@@PLACE@@/plate.js';
 *   bake({ THREE, init, initKit, spec, build: (R, K, TXT, P) => { ...the region's world... } });
 *
 * The URL hash picks the pass: #preview (one picture at 1x, for iterating), #beauty (the picture at
 * 2x), #depth (the depth map at 2x) and #layers (the picture, the sky, the ground, every card and
 * the depth map, for the bake script, which reads them back through window.plateExport). Nothing
 * in here is random: every seeded thing takes the spec's seed, so every pass sees the same world.
 */

export const PLATE_W = 1242, PLATE_H = 2208;   // 1080x1920 with 15 percent overscan for the camera

// The depth encoding the bake script decodes: v = log(1 + z) / log(1 + ZMAX), z in metres along the
// camera's axis, in sixteen bits (red the high byte, green the low), so a band's edge is exact to
// about a part in four thousand of its distance.
export const ZMAX = 30000;

// Surfaces take a layer bit of their own, so a pass can draw them alone, and the card being drawn
// takes another. Lights take every bit, since three gathers only the lights the camera can see.
export const SURFACE_LAYER = 7, CARD_LAYER = 8;
// A card holds things standing no further apart than this ratio of distances, and moves as the
// geometric mean of its nearest and farthest, so a base slides by at most a few per cent of its own
// parallax. Beyond FAR_MERGE_M every thing moves as one: its parallax is under a pixel.
export const CLUSTER_RATIO = 1.12, FAR_MERGE_M = 600;
// The kit's flat models: roads, fields and water lie on the ground from near to far.
const SURFACE_KITS = new Set(['caliche_road', 'highway', 'creek', 'reservoir_shore', 'crop_rows', 'pasture',
  'earthen_berm', 'fill_basin', 'riprap_bank', 'hill_country_terrain', 'plate.rolling']);

// A page that throws says so where the bake script is waiting, rather than leaving it to time out.
export async function bake(args) {
  try { return await bakeWorld(args); }
  catch (e) { window.plateFailed = String((e && e.stack) || e); throw e; }
}

async function bakeWorld({ THREE, init, initKit, spec, build }) {
  const hash = location.hash;
  const mode = hash.includes('layers') ? 'layers' : hash.includes('depth') ? 'depth'
    : hash.includes('preview') ? 'preview' : 'beauty';
  const TXT = init(THREE), K = initKit(THREE, TXT);
  const canvas = document.getElementById('plate');
  canvas.width = PLATE_W * (mode === 'preview' ? 1 : 2); canvas.height = PLATE_H * (mode === 'preview' ? 1 : 2);
  // A LAYER NEEDS AN ALPHA CHANNEL, and TXT.setup asks three for an opaque buffer. A canvas keeps the
  // attributes of the first context made on it, so this one is made first, with alpha, and three
  // takes it over as it finds it.
  if (mode === 'layers') canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true,
                                                       preserveDrawingBuffer: true });
  const W = TXT.worlds[spec.world.base];
  if (!W) throw new Error('plate: no world preset ' + spec.world.base);
  const world = Object.assign({}, W, spec.world.overrides || {});
  if (spec.world.rig) world.rig = mergeRig(W.rig, spec.world.rig);
  // ONE SUN. The sky draws its disc and glow from world.sunAt, and the key light below is placed
  // along the same direction, so the light on the ground and the bright side of the sky agree.
  world.sunAt = spec.sun;
  const R = TXT.setup(canvas, { w: PLATE_W, h: PLATE_H, fov: spec.camera.fov, far: ZMAX,
                                exposure: world.exposure, tone: world.tone, shadows: 'pcss' });
  const surface = (obj) => { obj.traverse((m) => { m.userData.placeSurface = true; }); return obj; };
  const P = { THREE, world, rng: TXT.rng(spec.seed), shapes: shapes(THREE, TXT), surface };   // P.rng() is a seeded uniform
  await build(R, K, TXT, P);
  TXT.frame(R, { from: spec.camera.from, look: spec.camera.look, fov: spec.camera.fov });
  TXT.sky(R, world);
  if (world.rig) {
    const d = TXT.sunDir(world), t = spec.camera.look, reach = spec.shadow?.reach ?? 300;
    const rig = JSON.parse(JSON.stringify(world.rig));
    rig.key.pos = [t[0] + d.x * reach, t[1] + d.y * reach, t[2] + d.z * reach];
    rig.key.shadowSize = spec.shadow?.size ?? 90;
    rig.key.mapSize = spec.shadow?.mapSize ?? 4096;
    const made = TXT.rig(R, rig);
    made[0].target.position.set(t[0], t[1], t[2]); R.scene.add(made[0].target);
  }
  if (spec.weather !== false) TXT.weather(R, Object.assign({ grime: 0.22, height: 1.4 }, spec.weather || {}));
  const base = { w: PLATE_W, h: PLATE_H, zmax: ZMAX, mode };
  if (mode === 'depth') {
    renderDepth(THREE, R);
    window.plateResult = Object.assign(base, { ok: true });
    return window.plateResult;
  }
  const result = await TXT.snapshot(R, { stage: false });
  if (mode !== 'layers') {
    const out = graded(canvas, spec.grade, true);
    out.id = 'plate'; out.style.cssText = canvas.style.cssText; canvas.id = 'plate-raw'; canvas.replaceWith(out);
    window.plateResult = Object.assign(base, result);
    return result;
  }
  const passes = { raw: copy(canvas), full: graded(canvas, spec.grade, true) };
  const layers = renderLayers(THREE, R, spec, passes);
  delete passes.raw;
  renderDepth(THREE, R);
  passes.depth = copy(canvas);
  window.plateCanvases = passes;
  window.plateExport = (name) => passes[name].toDataURL('image/png');
  window.plateResult = Object.assign(base, result, layers, { camera: cameraOf(R.camera), passes: Object.keys(passes) });
  return window.plateResult;
}

function copy(canvas) {
  const out = document.createElement('canvas');
  out.width = canvas.width; out.height = canvas.height;
  out.getContext('2d').drawImage(canvas, 0, 0);
  return out;
}

/* THE HOUSE GRADE (txpost.js, the carousel's finishing pass), applied to a copy of what the renderer
 * drew. The renderer already tone maps with ACES, so the grade's filmic curve stays OFF: a second
 * filmic curve is the defect the Docket removed on 2026-09-24. No grain and no vignette, because the
 * layers move: grain would ride them like dirt on glass, and a vignette belongs to the finished frame.
 * Every operation but two is one pixel at a time, with a fixed pivot, so the layers grade exactly as
 * the whole picture does. The two that reach across pixels, bloom and sharpening, run on the whole
 * picture and on the far layer's sky only (`spatial`): across a layer's transparent edge they would
 * draw a halo out of nothing. */
function graded(canvas, o, spatial) {
  const out = copy(canvas);
  if (o === false || typeof TXPOST === 'undefined') return out;
  const cx = out.getContext('2d');
  TXPOST.grade(cx, Object.assign({ exposure: 0, saturation: 1.06, contrast: 1.1, filmic: false,
    lift: [0.006, 0.009, 0.016], gain: [1.012, 1.0, 0.985], vignette: 0,
    bloom: spatial ? { threshold: 0.82, strength: 0.18, radius: 8 } : { threshold: 1, strength: 0, radius: 1 },
    grain: { amount: 0, size: 2, seed: 1 }, aberration: 0, dither: true, sharpen: spatial === true ? 0.25 : 0 },
    o || {}));
  return out;
}

function mergeRig(base, over) {
  const out = JSON.parse(JSON.stringify(base || {}));
  for (const k of Object.keys(over)) out[k] = Object.assign({}, out[k] || {}, over[k]);
  return out;
}

/* The camera as the film needs it to move the layers: where it stands, its three axes in the world
 * (right, up, forward) and its vertical field of view. */
function cameraOf(cam) {
  cam.updateMatrixWorld();
  const e = cam.matrixWorld.elements;
  const right = [e[0], e[1], e[2]], up = [e[4], e[5], e[6]], forward = [-e[8], -e[9], -e[10]];
  return { position: cam.position.toArray(), right, up, forward, fov: cam.fov, aspect: cam.aspect, near: cam.near };
}

/* THE LAYER PASSES. Every child of the scene is either SURFACE (the ground, water, roads, grass,
 * anything flat or long and low) or a THING standing on it. The sky dome is a shader no clipping
 * plane reaches, so it is rendered alone, first, with every mesh clipped away. The ground is
 * rendered with every thing hidden. Each card is rendered with only its own things, over the ground
 * drawn into depth alone, so a hill still hides the part of a far barn behind it and a grass blade
 * still stands in front of a near trunk, and the ground layer under the card shows them. */
function renderLayers(THREE, R, spec, passes) {
  const cam = R.camera, renderer = R.renderer, dome = R._txDome;
  if (!dome) throw new Error('plate: the world has no sky dome; call TXT.sky');
  cam.updateMatrixWorld();
  const f = new THREE.Vector3(); cam.getWorldDirection(f);
  const depthOf = (p) => p.clone().sub(cam.position).dot(f);
  const W2 = renderer.domElement.width, H2 = renderer.domElement.height;
  const pixelOf = (p) => { const q = p.clone().project(cam); return [(q.x + 1) / 2 * PLATE_W, (1 - q.y) / 2 * PLATE_H]; };
  R.scene.traverse((o) => { if (o.isLight) o.layers.enableAll(); });
  const items = [];
  for (const child of R.scene.children) {
    if (child === dome || child.isLight || child.isCamera) continue;
    let meshes = 0; child.traverse((m) => { if (m.isMesh) meshes++; });
    if (!meshes) continue;
    const box = new THREE.Box3().setFromObject(child);
    if (box.isEmpty()) continue;
    const size = box.getSize(new THREE.Vector3());
    const zs = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) zs.push(depthOf(new THREE.Vector3(x, y, z)));
    const extent = Math.max(...zs) - Math.min(...zs);
    const base = new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
    const surface = isSurface(child) || size.y < 0.6 || (extent > 4 * size.y && size.y < 4);
    items.push({ obj: child, surface, depth: depthOf(base), base, height: size.y, extent });
  }
  const ground = items.filter((i) => i.surface);
  if (!ground.length) throw new Error('plate: no surface in the world, so the ground layer would be empty');
  ground.forEach((i) => i.obj.traverse((m) => { if (m.isMesh) m.layers.enable(SURFACE_LAYER); }));
  const things = items.filter((i) => !i.surface && i.depth > cam.near).sort((a, b) => a.depth - b.depth);
  const cards = [];
  for (const it of things) {
    const last = cards[cards.length - 1];
    if (last && (it.depth <= last.min * CLUSTER_RATIO || last.min >= FAR_MERGE_M)) { last.items.push(it); last.max = it.depth; }
    else cards.push({ min: it.depth, max: it.depth, items: [it] });
  }
  renderer.shadowMap.autoUpdate = false;       // the map the snapshot drew, with every caster in it
  renderer.shadowMap.needsUpdate = false;
  renderer.setClearColor(0x000000, 0);
  // the sky: every mesh clipped away, and the dome, which no plane reaches, is all that is left
  cam.layers.set(0);
  renderer.clippingPlanes = [new THREE.Plane(f.clone(), -(cam.position.dot(f) + ZMAX))];
  renderer.render(R.scene, cam);
  renderer.clippingPlanes = [];
  passes.sky = graded(renderer.domElement, spec.grade, 'sky');
  // the ground, every thing hidden
  cam.layers.set(SURFACE_LAYER);
  renderer.render(R.scene, cam);
  passes.ground = graded(renderer.domElement, spec.grade, false);
  // the cards, far first, each over the ground drawn into depth alone
  const surfaceMats = new Set();
  ground.forEach((i) => i.obj.traverse((m) => { if (m.isMesh) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => surfaceMats.add(x)); }));
  const auto = renderer.autoClear;
  const out = [];
  cards.slice().reverse().forEach((c, k) => {
    c.items.forEach((i) => i.obj.traverse((m) => { if (m.isMesh) m.layers.enable(CARD_LAYER); }));
    renderer.autoClear = false;
    renderer.clear(true, true, true);
    const kept = [...surfaceMats].map((m) => [m, m.colorWrite]);
    kept.forEach(([m]) => { m.colorWrite = false; });
    cam.layers.set(SURFACE_LAYER);
    renderer.render(R.scene, cam);
    kept.forEach(([m, w]) => { m.colorWrite = w; });
    cam.layers.set(CARD_LAYER);
    renderer.render(R.scene, cam);
    renderer.autoClear = auto;
    c.items.forEach((i) => i.obj.traverse((m) => { if (m.isMesh) m.layers.disable(CARD_LAYER); }));
    const name = 'card' + String(k).padStart(2, '0');
    passes[name] = graded(renderer.domElement, spec.grade, false);
    const depth = c.min >= FAR_MERGE_M && c.items.length > 1
      ? c.items[Math.floor(c.items.length / 2)].depth : Math.sqrt(c.min * c.max);
    out.push({ name, depth, min: c.min, max: c.max, things: c.items.map((i) => ({
      depth: i.depth, base: pixelOf(i.base), kit: i.obj.userData.kit || i.obj.type, height: i.height })) });
  });
  cam.layers.set(0);
  renderer.autoClear = auto;
  passes.flat = graded(passes.raw, spec.grade, false);   // the whole picture, graded as the layers are
  return { cards: out, surfaces: ground.length, things: things.length, w2: W2, h2: H2 };
}

// A surface by what it is: tagged so by the scene, laid by TXT.ground or TXT.scatter, or a flat kit model.
function isSurface(o) {
  let hit = false;
  o.traverse((m) => {
    if (m.userData.placeSurface || m.userData.txSurface || m.userData.txScatter || m.userData.txGround ||
        SURFACE_KITS.has(m.userData.kit) || (m.isMesh && isGround(m))) hit = true;
  });
  return hit;
}

// A ground TXT.ground made flat (no `surface`) carries only the define that keeps it under a road.
function isGround(o) {
  const m = o.material;
  return !!(m && !Array.isArray(m) && m.defines && 'TX_GROUND' in m.defines);
}

/* THE DEPTH PASS. Every mesh draws its distance along the camera's axis, log encoded so the far
 * field keeps resolution, in sixteen bits over red and green, through one override material.
 * project_vertex applies instance and batch matrices, so the instanced grass and the merged kit land
 * where they land in the picture. The sky dome is drawn too, at its own great distance, which is what
 * puts the sky in the far layer. Fog, tone mapping and the background are off: this is a
 * measurement, not a picture. */
function renderDepth(THREE, R) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { zmax: { value: ZMAX } },
    vertexShader: `
      #include <common>
      #include <batching_pars_vertex>
      varying float vDist;
      void main() {
        #include <batching_vertex>
        #include <begin_vertex>
        #include <project_vertex>
        vDist = -mvPosition.z;
      }`,
    fragmentShader: `
      uniform float zmax;
      varying float vDist;
      void main() {
        float v = clamp(log(1.0 + max(vDist, 0.0)) / log(1.0 + zmax), 0.0, 1.0);
        float q = floor(v * 65535.0 + 0.5);
        float hi = floor(q / 256.0);
        gl_FragColor = vec4(hi / 255.0, (q - hi * 256.0) / 255.0, 0.0, 1.0);
      }`,
    side: THREE.DoubleSide,
  });
  R.scene.overrideMaterial = mat;
  R.scene.fog = null;
  R.scene.background = new THREE.Color(1, 1, 0);   // nothing drawn reads as the farthest code
  R.renderer.toneMapping = THREE.NoToneMapping;
  R.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // the codes are numbers, not colours
  R.renderer.shadowMap.enabled = false;
  R.renderer.setClearColor(new THREE.Color(1, 1, 0), 1);
  R.renderer.render(R.scene, R.camera);
}

/* ---- shapes the kit doesn't model yet, for the far field only ------------------------------
 * These are silhouettes at a kilometre or more, seen through haze. They are original geometry,
 * drawn from what the structures are (a fractionation column is a tall cylinder ringed with
 * platforms; a floating roof tank is wide and low; a flare stack is a thin mast with a flame), and
 * they never stand nearer than the far layer, where a kit model would spend triangles nobody sees. */
function shapes(THREE, TXT) {
  const steel = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r ?? 0.62, metalness: 0.35 });
  const cyl = (r, h, m, seg) => { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 20), m); mesh.position.y = h / 2; const g = new THREE.Group(); g.add(mesh); return g; };
  return {
    /* A Gulf Coast refinery block as it stands on the Houston Ship Channel: columns, a cracking
     * unit's reactor and regenerator, pipe racks, spheres, a tank farm and a flare. */
    refinery(opts) {
      const o = Object.assign({ seed: 3, width: 900, depth: 500, tanks: 18, columns: 9, flare: true, fat: 1 }, opts || {});
      const rnd = TXT.rng(o.seed), g = new THREE.Group();
      const grey = steel(0xa4a9ad, 0.5), dark = steel(0x6c7276, 0.55), white = steel(0xdcdedc, 0.7);
      for (let i = 0; i < o.columns; i++) {
        const h = 38 + rnd() * 46, r = (1.6 + rnd() * 2.4) * o.fat;
        const c = cyl(r, h, i % 3 ? grey : dark, 18);
        c.position.set(-o.width * 0.3 + rnd() * o.width * 0.5, 0, -rnd() * o.depth * 0.5);
        g.add(c);
        for (let k = 1; k < 5; k++) {            // the ringed platforms that make it read as a column
          const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.7, 0.18, 4, 22), dark);
          ring.rotation.x = Math.PI / 2; ring.position.set(c.position.x, h * k / 5, c.position.z); g.add(ring);
        }
      }
      for (let i = 0; i < 7; i++) {               // process units: steel frames clad to their height
        const w = 24 + rnd() * 30, h = 14 + rnd() * 22, d = 18 + rnd() * 20;
        const u = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), i % 2 ? grey : dark);
        u.position.set(-o.width * 0.3 + rnd() * o.width * 0.6, h / 2, -o.depth * (0.05 + rnd() * 0.4)); g.add(u);
      }
      for (let i = 0; i < 4; i++) {               // pipe racks running across the block
        const rack = new THREE.Mesh(new THREE.BoxGeometry(o.width * (0.35 + rnd() * 0.3), 6, 5), dark);
        rack.position.set(-o.width * 0.15 + rnd() * o.width * 0.3, 7, -o.depth * (0.1 + 0.18 * i)); g.add(rack);
      }
      for (let i = 0; i < 4; i++) {               // LPG spheres on their legs
        const s = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), white);
        s.position.set(o.width * (0.05 + 0.06 * i), 13, -o.depth * 0.25); g.add(s);
      }
      for (let i = 0; i < o.tanks; i++) {         // the tank farm: wide, low, white and pale grey
        const r = 18 + rnd() * 22, h = 12 + rnd() * 8;
        const t = cyl(r, h, i % 4 ? white : grey, 40);
        t.position.set(o.width * 0.2 + (i % 6) * 52, 0, -o.depth * 0.45 - Math.floor(i / 6) * 55); g.add(t);
      }
      if (o.flare) {
        const stack = cyl(1.2, 92, dark, 10); stack.position.set(-o.width * 0.42, 0, -o.depth * 0.3); g.add(stack);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9, 12),
          new THREE.MeshBasicMaterial({ color: 0xffb35a, toneMapped: false }));
        flame.position.set(stack.position.x, 96.5, stack.position.z); g.add(flame);
        g.userData.flare = flame.position.clone();
      }
      g.userData.kit = 'plate.refinery';
      return g;
    },
    /* Loblolly and shortleaf pine as a far stand: tall straight boles and a crown held high, never
     * the triangle tree REGIONS.md calls the mistake. */
    pineStand(opts) {
      const o = Object.assign({ seed: 5, n: 140, area: [-300, -900, 300, -200], h: [24, 34] }, opts || {});
      const rnd = TXT.rng(o.seed), g = new THREE.Group();
      const bark = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.95 });
      const needles = new THREE.MeshStandardMaterial({ color: 0x2c4430, roughness: 0.9 });
      const bole = new THREE.CylinderGeometry(0.22, 0.38, 1, 7), crown = new THREE.IcosahedronGeometry(1, 1);
      for (let i = 0; i < o.n; i++) {
        const x = o.area[0] + rnd() * (o.area[2] - o.area[0]), z = o.area[1] + rnd() * (o.area[3] - o.area[1]);
        const h = o.h[0] + rnd() * (o.h[1] - o.h[0]);
        const b = new THREE.Mesh(bole, bark); b.scale.set(1, h, 1); b.position.set(x, h / 2, z); g.add(b);
        for (let k = 0; k < 3; k++) {
          const c = new THREE.Mesh(crown, needles), s = 2.2 + rnd() * 1.6;
          c.scale.set(s, s * 0.7, s); c.position.set(x + (rnd() - 0.5) * 2.4, h * (0.78 + 0.08 * k), z + (rnd() - 0.5) * 2.4); g.add(c);
        }
      }
      g.userData.kit = 'plate.pineStand';
      return g;
    },
    /* Gentle relief for the breaks, the Cross Timbers and the savannah: a ground mesh lifted by
     * smooth seeded noise, coloured toward `color` with a little variation, never hill_country_terrain,
     * whose limestone ledges and junipers belong to one region only. */
    rolling(opts) {
      const o = Object.assign({ seed: 2, width: 9000, near: -160, far: -7000, relief: 18, scale: 260, color: 0x8a7a58, segments: 180 }, opts || {});
      const depth = o.near - o.far;
      const geo = new THREE.PlaneGeometry(o.width, depth, o.segments, o.segments); geo.rotateX(-Math.PI / 2);
      geo.translate(0, 0, (o.near + o.far) / 2);    // world coordinates from here on
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), base = new THREE.Color(o.color);
      const h = (x, z) => {
        let v = 0, a = 1, f = 1 / o.scale;
        for (let k = 0; k < 4; k++) { v += a * Math.sin(x * f + o.seed * 1.7 + k) * Math.cos(z * f * 1.3 - o.seed + k * 2.1); a *= 0.5; f *= 2.1; }
        return v;
      };
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const d = Math.min(1, Math.max(0, (o.near - z) / 700));   // nothing at the near edge, full relief 700 m on
        pos.setY(i, Math.max(h(x, z) * o.relief * d, 0) - 0.05);
        const c = base.clone().offsetHSL(0, 0, h(x * 3.1, z * 2.7) * 0.04);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
      m.receiveShadow = true; m.userData.kit = 'plate.rolling';
      return m;
    },
    /* The Trans-Pecos plants, each standing apart and reading as a silhouette (REGIONS.md). */
    ocotillo(opts) {
      const o = Object.assign({ seed: 1, h: 4.2, canes: 14 }, opts || {}), rnd = TXT.rng(o.seed), g = new THREE.Group();
      const cane = new THREE.MeshStandardMaterial({ color: 0x5e6a46, roughness: 0.9 });
      for (let i = 0; i < o.canes; i++) {
        const len = o.h * (0.65 + rnd() * 0.4), tilt = 0.12 + rnd() * 0.32, az = rnd() * Math.PI * 2;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, len, 5), cane);
        c.position.set(Math.sin(az) * len * 0.5 * Math.sin(tilt), len * 0.5 * Math.cos(tilt), Math.cos(az) * len * 0.5 * Math.sin(tilt));
        c.rotation.set(Math.cos(az) * tilt, 0, -Math.sin(az) * tilt); g.add(c);
        if (rnd() < 0.5) {                         // the red flower at a cane's tip in spring
          const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), new THREE.MeshStandardMaterial({ color: 0xc8402a, roughness: 0.8 }));
          f.position.set(c.position.x * 2, len * Math.cos(tilt), c.position.z * 2); g.add(f);
        }
      }
      g.userData.kit = 'plate.ocotillo'; return g;
    },
    rosette(opts) {                                 // yucca, sotol and lechuguilla: a fountain of blades
      const o = Object.assign({ seed: 1, r: 0.7, blades: 46, color: 0x7a8256, stalk: 0, trunk: 0 }, opts || {}), rnd = TXT.rng(o.seed), g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.8, side: THREE.DoubleSide });
      const blade = new THREE.ConeGeometry(0.035, 1, 3);
      if (o.trunk) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, o.trunk, 7), new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 })); t.position.y = o.trunk / 2; g.add(t); }
      for (let i = 0; i < o.blades; i++) {
        const az = rnd() * Math.PI * 2, tilt = 0.15 + rnd() * 1.1, len = o.r * (0.7 + rnd() * 0.5);
        const b = new THREE.Mesh(blade, mat); b.scale.set(1, len, 1);
        b.position.set(Math.sin(az) * Math.sin(tilt) * len * 0.5, o.trunk + Math.cos(tilt) * len * 0.5, Math.cos(az) * Math.sin(tilt) * len * 0.5);
        b.rotation.set(Math.cos(az) * tilt, 0, -Math.sin(az) * tilt); g.add(b);
      }
      if (o.stalk) {                                // the flower stalk standing out of it
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, o.stalk, 5), new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.9 }));
        st.position.y = o.trunk + o.stalk / 2; g.add(st);
        const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe9e2c8, roughness: 0.9 }));
        bloom.scale.set(0.8, 2.2, 0.8); bloom.position.y = o.trunk + o.stalk; g.add(bloom);
      }
      g.userData.kit = 'plate.rosette'; return g;
    },
    creosote(opts) {                                // a low, open, olive shrub, never a ball
      const o = Object.assign({ seed: 1, h: 1.4, w: 1.6 }, opts || {}), rnd = TXT.rng(o.seed), g = new THREE.Group();
      const leaf = new THREE.MeshStandardMaterial({ color: 0x6b7442, roughness: 0.95 });
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + rnd() * 0.2, 0), leaf);
        c.position.set((rnd() - 0.5) * o.w, o.h * (0.35 + rnd() * 0.6), (rnd() - 0.5) * o.w); g.add(c);
      }
      g.userData.kit = 'plate.creosote'; return g;
    },
    /* Prickly pear: flat pads stacked edge on edge, with magenta tunas upright on the rims. */
    pricklyPear(opts) {
      const o = Object.assign({ seed: 1, pads: 14 }, opts || {}), rnd = TXT.rng(o.seed), g = new THREE.Group();
      const pad = new THREE.MeshStandardMaterial({ color: 0x6e8a4e, roughness: 0.7 }), tuna = new THREE.MeshStandardMaterial({ color: 0xa3265f, roughness: 0.6 });
      const geo = new THREE.SphereGeometry(0.22, 12, 8);
      const tips = [[0, 0.25, 0, 0]];
      for (let i = 0; i < o.pads; i++) {
        const [x, y, z, a] = tips[Math.floor(rnd() * tips.length)];
        const na = a + (rnd() - 0.5) * 1.2, ny = y + 0.3 + rnd() * 0.12, nx = x + Math.sin(na) * 0.2, nz = z + (rnd() - 0.5) * 0.15;
        const m = new THREE.Mesh(geo, pad); m.scale.set(1, 1.35, 0.25); m.position.set(nx, ny, nz); m.rotation.set(0, rnd() * 3, na * 0.6); g.add(m);
        tips.push([nx, ny, nz, na]);
        if (rnd() < 0.4) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), tuna); t.scale.set(1, 1.4, 1); t.position.set(nx, ny + 0.3, nz); g.add(t); }
      }
      g.userData.kit = 'plate.pricklyPear'; return g;
    },
    /* Near pines: a straight bole three quarters bare, and the crown in uneven tiers at the top. */
    pine(opts) {
      const o = Object.assign({ seed: 1, h: 28 }, opts || {}), rnd = TXT.rng(o.seed), g = new THREE.Group();
      const bark = new THREE.MeshStandardMaterial({ color: 0x564232, roughness: 0.95 });
      const tones = [0x2c4630, 0x34503a, 0x27402b, 0x3a5640].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, flatShading: true }));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.4, o.h, 8), bark); b.position.y = o.h / 2; g.add(b);
      const lump = new THREE.IcosahedronGeometry(1, 0);
      for (let k = 0; k < 22; k++) {               // an open, irregular crown held in the top third
        const y = o.h * (0.66 + rnd() * 0.32), s = 0.7 + rnd() * 1.1, az = rnd() * Math.PI * 2, out = rnd() * 2.4;
        const c = new THREE.Mesh(lump, tones[k % tones.length]); c.scale.set(s * 1.3, s * 0.7, s * 1.3);
        c.position.set(Math.sin(az) * out, y, Math.cos(az) * out); c.rotation.set(rnd(), rnd() * 3, rnd()); g.add(c);
      }
      for (let k = 0; k < 4; k++) {                // a few dead lower limbs on the bare bole
        const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 1.6, 4), bark), az = rnd() * Math.PI * 2;
        l.position.set(Math.sin(az) * 0.6, o.h * (0.35 + rnd() * 0.25), Math.cos(az) * 0.6); l.rotation.set(Math.cos(az) * 1.2, 0, -Math.sin(az) * 1.2); g.add(l);
      }
      g.userData.kit = 'plate.pine'; return g;
    },
    /* A desert range for the Trans-Pecos: blocky, faulted, with the cleanest air in the state, so
     * it is drawn saturated and NOT hazed out (REGIONS.md: the atmospheric rule inverts here). */
    range(opts) {
      const o = Object.assign({ seed: 9, width: 9000, height: 900, depth: -12000, color: 0x8a6a5a, steps: 160 }, opts || {});
      const rnd = TXT.rng(o.seed), pts = [], n = [];
      for (let i = 0; i <= o.steps; i++) n.push(rnd());
      const smooth = (i, r) => { let a = 0, c = 0; for (let k = -r; k <= r; k++) { const j = Math.min(o.steps, Math.max(0, i + k)); a += n[j]; c++; } return a / c; };
      for (let i = 0; i <= o.steps; i++) {
        const t = i / o.steps, mass = Math.sin(t * Math.PI) * 0.55 + 0.45;
        const ridge = 0.55 * smooth(i, 12) + 0.3 * smooth(i, 4) + 0.15 * n[i];   // big masses, faulted shoulders, a little crag
        pts.push(new THREE.Vector2(-o.width / 2 + t * o.width, o.height * mass * (0.35 + ridge * 0.9)));
      }
      pts.push(new THREE.Vector2(o.width / 2, 0), new THREE.Vector2(-o.width / 2, 0));
      const shape = new THREE.Shape(pts);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 400, bevelEnabled: false });
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.95 }));
      m.position.set(0, 0, o.depth); m.userData.kit = 'plate.range';
      return m;
    },
  };
}
