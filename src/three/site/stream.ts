import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import { clamp, rng } from '@onigam/lab-kit/three';
import { fbm, hex, noShadow, vnoise } from './common';
import { BOUNDS, CHANNEL_DEPTH, S_MAX, S_MIN, bedAt, streamFrame } from './layout';
import type { Terrain } from './terrain';
import { ribbonGeometry, waterMaterial, type RibbonPoint, type WaterUniforms } from './water';

// Stream water ribbon (one mesh along the whole valley) + stones in the bed and boulders on
// the banks. The width/depth of each reach follows the simulated flows.

/** Irregular low-poly stone (20 flat-shaded triangles). */
export function rockGeometry(seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 0.78 + 0.32 * (vnoise(v.x * 2.1 + seed, v.z * 2.3 + v.y * 1.7) * 0.5 + 0.5);
    pos.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export interface Stream {
  group: THREE.Group;
  water: THREE.Mesh;
  rocks: THREE.InstancedMesh;
  hotspot: THREE.Object3D;
  update(state: SimState, time: number, sIntake: number): void;
}

/** Arc range of the stream inside the map. */
function streamRange(): [number, number] {
  const f = { x: 0, z: 0, tx: 0, tz: -1 };
  const inside = (s: number) => {
    streamFrame(s, f);
    return f.x > BOUNDS.x0 && f.x < BOUNDS.x1 && f.z > BOUNDS.z0 && f.z < BOUNDS.z1;
  };
  let lo = 0;
  while (lo > S_MIN + 2 && inside(lo - 2)) lo -= 2;
  let hi = 0;
  while (hi < S_MAX - 2 && inside(hi + 2)) hi += 2;
  return [lo, hi];
}

export function createStream(terrain: Terrain): Stream {
  const group = new THREE.Group();
  group.name = 'stream';
  const [sLo, sHi] = streamRange();

  // centreline samples from upstream to downstream so that the travel coordinate grows downstream
  const pts: RibbonPoint[] = [];
  const f = { x: 0, z: 0, tx: 0, tz: -1 };
  let tau = 0;
  let prev: number | undefined;
  for (let s = sHi; s >= sLo;) {
    streamFrame(s, f);
    const grad = Math.abs(bedAt(s + 1) - bedAt(s - 1)) / 2;
    const speed = 0.45 + 2.4 * Math.sqrt(grad);
    if (prev !== undefined) tau += (prev - s) / speed;
    prev = s;
    // the thread of water wanders a little inside the channel and changes width
    const off = 0.22 * fbm(s * 0.08, 3.1, 2);
    const x = f.x - f.tz * off;
    const z = f.z + f.tx * off;
    const y = Math.max(bedAt(s) - CHANNEL_DEPTH + 0.05, terrain.groundY(x, z) + 0.03);
    pts.push({
      p: new THREE.Vector3(x, y, z),
      side: new THREE.Vector3(-f.tz, 0, f.tx),
      halfWidth: 0.5,
      tau,
      slope: clamp(grad * 2.3, 0, 1),
      s,
      widthK: 0.95 + 0.45 * fbm(s * 0.11, 7.7, 2),
    });
    s -= Math.abs(s) < 120 ? 0.75 : 2;
  }
  const { material, uniforms } = waterMaterial({ stream: true, color: 0x2c4547 });
  const water = noShadow(new THREE.Mesh(ribbonGeometry(pts, 5), material));
  water.name = 'stream-water';
  water.receiveShadow = true;
  water.renderOrder = 1;
  group.add(water);

  const rocks = buildRocks(terrain);

  const hotspot = new THREE.Object3D();
  streamFrame(-16, f);
  hotspot.position.set(f.x, terrain.groundY(f.x, f.z) + 0.8, f.z);
  group.add(hotspot);

  const u: WaterUniforms = uniforms;
  return {
    group,
    water,
    rocks,
    hotspot,
    update(state, time, sIntake) {
      u.uTime.value = time;
      u.uQUp.value = state.qStream;
      u.uQMid.value = state.qOverflow;
      u.uQDown.value = state.qOverflow + state.qPipe;
      u.uSIntake.value = sIntake;
    },
  };
}

/** Stones in the bed (visible when the stream runs dry) and boulders along the banks. */
function buildRocks(terrain: Terrain): THREE.InstancedMesh {
  const r = rng(4242);
  const count = 1700;
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, flatShading: true });
  const mesh = new THREE.InstancedMesh(rockGeometry(3), mat, count);
  mesh.name = 'stream-rocks';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const f = { x: 0, z: 0, tx: 0, tz: -1 };
  const palette = [0x7b7b78, 0x6a6e72, 0x8a847a, 0x5e5f60, 0x938b7e, 0x6f6a5f].map(hex);
  const c = new THREE.Color();
  let n = 0;
  const place = (s: number, d: number, size: number) => {
    if (n >= count) return;
    streamFrame(s, f);
    const x = f.x - f.tz * d;
    const z = f.z + f.tx * d;
    if (x < BOUNDS.x0 + 2 || x > BOUNDS.x1 - 2 || z < BOUNDS.z0 + 2 || z > BOUNDS.z1 - 2) return;
    // keep the turbine pad, the tailrace mouth and the penstock strip on the east bank clear
    if (Math.abs(x) < 3.2 && Math.abs(z) < 4) return;
    if (d > 1.5 && d < 3.6 && s > -2 && s < 360) return;
    p.set(x, terrain.groundY(x, z) - size * 0.3, z);
    e.set(r() * 0.6 - 0.3, r() * Math.PI * 2, r() * 0.6 - 0.3);
    q.setFromEuler(e);
    sc.set(size * (0.8 + r() * 0.5), size * (0.45 + r() * 0.3), size * (0.7 + r() * 0.4));
    m.compose(p, q, sc);
    mesh.setMatrixAt(n, m);
    c.copy(palette[Math.floor(r() * palette.length)]).multiplyScalar(0.85 + r() * 0.3);
    mesh.setColorAt(n, c);
    n++;
  };
  // bed stones, many more near the turbine where the camera goes; some break the surface
  for (let i = 0; i < 1300; i++) {
    const s = i < 650 ? -60 + r() * 180 : -200 + r() * 760;
    place(s, (r() * 2 - 1) * 1.2, 0.07 + r() * r() * 0.4);
  }
  // bank boulders
  for (let i = 0; i < 330; i++) {
    const s = -220 + r() * 800;
    const side = r() < 0.5 ? -1 : 1;
    place(s, side * (1.3 + r() * 4.5), 0.25 + r() * r() * 1.1);
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
