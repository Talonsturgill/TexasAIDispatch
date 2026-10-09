/* water.js: still water and channels for the place plates.
 *
 * STILL WATER MIRRORS ITS SHORE (2026-10-09). A lake seen from a standing eye height under a hazy
 * sky mirrors only that sky, and at that angle it mirrors it nearly whole. The kit's reservoir water
 * and a plain glossy sheet both drew Lady Bird Lake as a flat pale grey band that read as a slab of
 * concrete between the bank and the towers. What tells an eye it is looking at water is the far bank
 * standing in it upside down. So mirrorWater renders the world reflected in the water's own plane,
 * the way three's Reflector does, smears it a little downward as a light wind does, and lays it over a
 * dark body by the Fresnel share: nearly all mirror at the far edge, mostly body at the near one.
 *
 * IT IS MADE ONCE PER CAMERA, from the whole world, the first time the water is drawn in colour, which
 * is the full picture. Every later pass of a bake looks through the same camera, so the ground layer
 * carries the very water the full picture did and the bake's reassembly check holds. A clipped pass
 * (the sky, the ground cut at the eye) never makes the reflection, the depth pass overrides every
 * material and a card pass draws the ground into depth alone. The reflection rides the ground layer
 * when a camera moves, as if painted on the water: for the moves the bake allows that is a few pixels
 * against the bank, and the slide check never sees it.
 *
 * GRASS DOES NOT GROW IN THE CHANNEL. TXT.scatter avoids rectangles, and a river is not one, so the
 * San Antonio plate's first bake grew bunchgrass all the way down its river. channel() returns its
 * own outline as a test, and dry() takes every tuft standing on the water out of a scatter. */

/* A channel winding along a centreline of [x, z] points: its surface at `level` and a test for a
 * point on the water. The width at a share t of the way along is width * (vary[0] + vary[1] *
 * sin(t * vary[2])), so a bayou can swell and pinch. */
export function channel(THREE, pts, width, o = {}) {
  const n = o.n || 140, vary = o.vary || [1, 0, 0], level = o.level ?? 0.03;
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPoint(t), d = curve.getTangent(t), w = width * (vary[0] + vary[1] * Math.sin(t * vary[2]));
    left.push([p.x - d.z * w / 2, p.z + d.x * w / 2]);
    right.push([p.x + d.z * w / 2, p.z - d.x * w / 2]);
  }
  const ring = left.concat(right.reverse());
  // the shape's y is -z, so turning its face up (-90 degrees about x) lands it on the ground facing the sky
  const geo = new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))), 1);
  geo.rotateX(-Math.PI / 2); geo.translate(0, level, 0);
  return { geo, inside: (x, z) => inPolygon(ring, x, z) };
}

// An ellipse of water, w by d metres, for a pond; the same pair as a channel.
export function pond(THREE, x, z, w, d, level = 0.035) {
  const geo = new THREE.CircleGeometry(1, 48); geo.rotateX(-Math.PI / 2); geo.scale(w, 1, d); geo.translate(x, level, z);
  return { geo, inside: (px, pz) => ((px - x) / w) ** 2 + ((pz - z) / d) ** 2 < 1 };
}

// A rectangle of water from x0 to x1 and z0 to z1; the same pair as a channel.
export function sheet(THREE, x0, z0, x1, z1, level = 0.03) {
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0); geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, level, (z0 + z1) / 2);
  return { geo, inside: (x, z) => x > x0 && x < x1 && z > z0 && z < z1 };
}

function inPolygon(ring, x, z) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i], [xj, zj] = ring[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}

/* Take out of a scatter (an InstancedMesh, or the Group of them TXT.scatter makes for grass) every
 * instance standing where any of `tests` says there is water. */
export function dry(THREE, field, tests) {
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), c = new THREE.Color();
  (field.isInstancedMesh ? [field] : field.children.filter((k) => k.isInstancedMesh)).forEach((mesh) => {
    let k = 0;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m);
      if (tests.some((t) => t(p.x, p.z))) continue;
      mesh.setMatrixAt(k, m);
      if (mesh.instanceColor) { mesh.getColorAt(i, c); mesh.setColorAt(k, c); }
      k++;
    }
    mesh.count = k; mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return field;
}

/* One mirror for every piece of water standing at `level`: the geometries are merged, so the world is
 * reflected once per pass however many ponds there are. `color` is the body, `smear` the downward
 * smear in texture heights per tap. */
export function mirrorWater(THREE, R, geos, o) {
  const level = o.level, smear = o.smear ?? 0.0035, el = R.renderer.domElement;
  const rt = new THREE.WebGLRenderTarget(el.width / 2, el.height / 2, { type: THREE.HalfFloatType, samples: 4 });
  const tm = new THREE.Matrix4(), cam = new THREE.PerspectiveCamera(), up = new THREE.Vector3(0, 1, 0);
  const at = new THREE.Vector3(0, level, 0), eye = new THREE.Vector3(), look = new THREE.Vector3(), rot = new THREE.Matrix4();
  const plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  const mat = new THREE.MeshPhysicalMaterial({ color: o.color, roughness: 1, metalness: 0, specularIntensity: 0 });
  mat.customProgramCacheKey = () => 'place-mirror';
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.tMirror = { value: rt.texture }; sh.uniforms.mMirror = { value: tm }; sh.uniforms.uSmear = { value: smear };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 mMirror;\nvarying vec4 vMirror;\nvarying vec3 vWet;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMirror = mMirror * vec4(transformed, 1.0);\nvWet = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tMirror;\nuniform float uSmear;\nvarying vec4 vMirror;\nvarying vec3 vWet;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  {
    float c = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
    float F = 0.02 + 0.98 * pow(1.0 - c, 5.0);
    vec2 uv = vMirror.xy / vMirror.w;
    uv.x += (sin(vWet.z * 0.9 + sin(vWet.x * 0.13) * 2.0) + sin(vWet.z * 2.3 + vWet.x * 0.05)) * uSmear * 0.5;
    vec3 refl = vec3(0.0);
    for (int i = 0; i < 5; i++) refl += texture2D(tMirror, uv - vec2(0.0, float(i) * uSmear)).rgb;
    diffuseColor.rgb *= 1.0 - F;
    totalEmissiveRadiance += refl * 0.2 * F;
  }`);
  };
  const mesh = new THREE.Mesh(merge(THREE, Array.isArray(geos) ? geos : [geos]), mat);
  mesh.userData.txGround = true;                     // a surface, and the weathering pass leaves it alone
  mesh.receiveShadow = true;
  let made = '';
  mesh.onBeforeRender = (renderer, scene, camera) => {
    if (scene.overrideMaterial || !mesh.material.colorWrite) return;
    camera.updateMatrixWorld();
    const key = camera.matrixWorld.elements.join() + '|' + camera.projectionMatrix.elements.join();
    if (key === made || renderer.clippingPlanes.length) return;
    eye.setFromMatrixPosition(camera.matrixWorld);
    if (eye.y <= level) return;
    rot.extractRotation(camera.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rot).add(eye);
    // the camera's mirror image under the water, looking at the mirror image of what it looks at
    cam.position.set(eye.x, 2 * level - eye.y, eye.z);
    cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(up);
    cam.lookAt(look.x, 2 * level - look.y, look.z);
    cam.near = camera.near; cam.far = camera.far; cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix); cam.layers.enableAll();
    tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse).multiply(mesh.matrixWorld);
    // an oblique near plane laid on the water, so nothing under it is mirrored
    plane.setFromNormalAndCoplanarPoint(up, at).applyMatrix4(cam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const P = cam.projectionMatrix.elements;
    q.set((Math.sign(clip.x) + P[8]) / P[0], (Math.sign(clip.y) + P[9]) / P[5], -1, (1 + P[10]) / P[14]);
    clip.multiplyScalar(2 / clip.dot(q));
    P[2] = clip.x; P[6] = clip.y; P[10] = clip.z + 1; P[14] = clip.w;
    const target = renderer.getRenderTarget(), auto = renderer.autoClear, shadows = renderer.shadowMap.autoUpdate;
    mesh.visible = false; renderer.shadowMap.autoUpdate = false; renderer.autoClear = true;
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
    renderer.setRenderTarget(target); renderer.autoClear = auto; renderer.shadowMap.autoUpdate = shadows;
    mesh.visible = true; made = key;
  };
  return mesh;
}

// Flat pieces of water as one geometry: positions, normals and uvs, unindexed and concatenated.
function merge(THREE, geos) {
  if (geos.length === 1) return geos[0];
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const size = parts[0].attributes[name].itemSize;
    const all = new Float32Array(parts.reduce((s, g) => s + g.attributes[name].array.length, 0));
    let at = 0;
    parts.forEach((g) => { all.set(g.attributes[name].array, at); at += g.attributes[name].array.length; });
    out.setAttribute(name, new THREE.BufferAttribute(all, size));
  }
  return out;
}
