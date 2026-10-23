import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import { MAT } from '@onigam/lab-kit/three';
import { pipeAlong, rng } from '@onigam/lab-kit/three';
import { hex, noShadow, smooth } from './common';
import { ANNEX, TURBINE, WALL } from './layout';
import type { Terrain } from './terrain';
import { waterSheet, type WaterUniforms } from './water';

// Everything on the bank around the turbine: the dry-stone wall it stands against, the
// tailrace channel taking the water back to the stream, and the cable run to the annex.

const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Anchor-local (x, y, z) -> world, using the assembled turbine transform. */
export function anchorToWorld(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z)
    .applyAxisAngle(Y_AXIS, TURBINE.rotY)
    .add(new THREE.Vector3(TURBINE.x, TURBINE.padY, TURBINE.z));
}

/** Dry-stone (slate) wall retaining the meadow terrace behind the turbine. */
export function buildWall(terrain: Terrain): THREE.Group {
  const g = new THREE.Group();
  g.name = 'dry-stone-wall';
  const r = rng(512);
  const top = (z: number) => terrain.groundY(WALL.x1 + 0.25, z);
  const bottom = (z: number) => terrain.groundY(WALL.x0 - 0.25, z) - 0.12;
  const max = 700;
  const stones = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    max,
  );
  stones.castShadow = true;
  stones.receiveShadow = true;
  const pal = [0x77736c, 0x86807a, 0x6a6c6c, 0x948c80, 0x7a776d, 0x6c6a5c].map(hex);
  const moss = hex(0x56693a);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  let n = 0;
  for (let z = WALL.z0; z < WALL.z1;) {
    const len = 0.28 + r() * 0.3;
    const zc = z + len / 2;
    const y0 = bottom(zc);
    const y1 = top(zc);
    for (let y = y0 + (r() - 0.5) * 0.05; y < y1 - 0.03 && n < max;) {
      const h = 0.06 + r() * 0.08;
      const d = 0.3 + r() * 0.2;
      const face = WALL.x0 + 0.1 * (y - y0); // slight batter
      const zz = zc + (r() - 0.5) * len * 0.5;
      e.set((r() - 0.5) * 0.06, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1);
      m.compose(
        new THREE.Vector3(face + d / 2, y + h / 2, zz),
        q.setFromEuler(e),
        new THREE.Vector3(d, h, len * (0.85 + r() * 0.3)),
      );
      stones.setMatrixAt(n, m);
      c.copy(pal[Math.floor(r() * pal.length)]).multiplyScalar(0.8 + r() * 0.35);
      if (r() < 0.18) c.lerp(moss, 0.5);
      stones.setColorAt(n++, c);
      y += h;
    }
    z += len;
  }
  stones.count = n;
  g.add(stones);

  // dark backing so the gaps between stones read as shadow, not as holes
  const pos: number[] = [];
  const idx: number[] = [];
  for (let z = WALL.z0, k = 0; z <= WALL.z1 + 1e-6; z += 0.5, k++) {
    pos.push(WALL.x0 + 0.14, bottom(z), z, WALL.x0 + 0.14 + 0.08 * (top(z) - bottom(z)), top(z) - 0.03, z);
    if (k > 0) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k, 2 * k - 1, 2 * k + 1);
  }
  const back = new THREE.BufferGeometry();
  back.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  back.setIndex(idx);
  back.computeVertexNormals();
  g.add(
    new THREE.Mesh(back, new THREE.MeshStandardMaterial({ color: 0x24221f, roughness: 1, side: THREE.DoubleSide })),
  );
  return g;
}

export interface Tailrace {
  group: THREE.Group;
  hotspot: THREE.Object3D;
  update(state: SimState, time: number): void;
}

/** Stone-lined ditch from under the turbine (anchor-local +Z, i.e. west) back to the stream. */
export function buildTailrace(terrain: Terrain): Tailrace {
  const group = new THREE.Group();
  group.name = 'tailrace';
  group.position.set(TURBINE.x, TURBINE.padY, TURBINE.z);
  group.rotation.y = TURBINE.rotY;
  const localGround = (x: number, z: number) => {
    const w = anchorToWorld(x, 0, z);
    return terrain.groundY(w.x, w.z) - TURBINE.padY;
  };
  const r = rng(808);
  const stones = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }),
    60,
  );
  stones.castShadow = true;
  stones.receiveShadow = true;
  const pal = [0x6a6d70, 0x7d786e, 0x5a5d60].map(hex);
  let n = 0;
  for (let z = -0.25; z < 4.0; z += 0.3) {
    for (const side of [-1, 1]) {
      const x = side * (0.3 + r() * 0.06);
      const s = 0.09 + r() * 0.07;
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, localGround(x, z) + s * 0.25, z + (r() - 0.5) * 0.1),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r(), r() * 6, r())),
        new THREE.Vector3(s * 1.3, s * 0.7, s),
      );
      stones.setMatrixAt(n, m);
      stones.setColorAt(n++, pal[n % pal.length]);
    }
  }
  stones.count = n;
  group.add(stones);

  const sheets: WaterUniforms[] = [];
  // channel flow
  const flow: THREE.Vector3[] = [];
  for (let z = 0.05; z <= 4.25; z += 0.25) flow.push(new THREE.Vector3(0, localGround(0, z) + 0.05, z));
  const channel = waterSheet(flow, new THREE.Vector3(1, 0, 0), 0.2, { slope: 0.55, color: 0x6f8a8c });
  // jet water falling from the housing base (anchor-local x in [-0.15, 0.15], z in [0.04, 0.18])
  const yb = localGround(0, 0.11) + 0.04;
  const fall = waterSheet(
    [0.9, 0.62, 0.34, yb + 0.02].map((y, i) => new THREE.Vector3(0, y, 0.11 + i * 0.012)),
    new THREE.Vector3(1, 0, 0),
    0.13,
    { slope: 1, color: 0xb9c9cc },
  );
  const splash = waterSheet(
    [new THREE.Vector3(0, yb + 0.03, -0.12), new THREE.Vector3(0, yb + 0.03, 0.34)],
    new THREE.Vector3(1, 0, 0),
    0.24,
    { slope: 1, color: 0xc9d6d8 },
  );
  for (const w of [channel, fall, splash]) {
    group.add(w.mesh);
    sheets.push(w.uniforms);
  }
  const hotspot = new THREE.Object3D();
  hotspot.position.set(0, localGround(0, 2.4) + 0.7, 2.4);
  group.add(hotspot);

  return {
    group,
    hotspot,
    update(state, time) {
      const a = smooth(0.02, 0.6, state.qPipe);
      for (const u of sheets) {
        u.uTime.value = time * 1.6;
        u.uOpacity.value = a;
      }
      fall.mesh.scale.x = 0.6 + 0.4 * smooth(0, 2, state.qPipe);
    },
  };
}

export interface CableRun {
  group: THREE.Group;
  hotspot: THREE.Object3D;
  /** World points turbine -> annex (schematic overlay). */
  points: THREE.Vector3[];
}

/** Output cable: turbine rear panel -> along the wall -> buried conduit in a trench -> annex. */
export function buildCableRun(terrain: Terrain): CableRun {
  const group = new THREE.Group();
  group.name = 'cable-run';
  const gy = (x: number, z: number) => terrain.groundY(x, z);
  const start = anchorToWorld(0.2, 0.95, -0.2);
  const dir = new THREE.Vector3(0, 0, -1).applyAxisAngle(Y_AXIS, TURBINE.rotY);
  const wallTop = gy(WALL.x1 + 0.25, 0.3);
  const wallFoot = gy(WALL.x0 - 0.2, 0.3);

  const cablePts = [
    start,
    start.clone().addScaledVector(dir, 0.22),
    new THREE.Vector3(start.x + 0.5, start.y - 0.35, start.z),
    new THREE.Vector3(start.x + 0.7, gy(start.x + 0.7, start.z) + 0.03, start.z + 0.05),
    new THREE.Vector3(WALL.x0 - 0.15, wallFoot + 0.12, 0.3),
  ];
  group.add(pipeAlong(cablePts, 0.009, MAT.cableBlack(), { bend: 0.15 }));

  const trench: [number, number][] = [
    [3.5, 0.55],
    [8.5, 2.9],
    [14.5, 6.6],
    [19.4, 9.9],
    [21.25, 11.0],
  ];
  const conduitUp = [
    new THREE.Vector3(WALL.x0 - 0.15, wallFoot + 0.08, 0.3),
    new THREE.Vector3(WALL.x0 - 0.03, wallTop - 0.05, 0.3),
    new THREE.Vector3(WALL.x1 + 0.2, wallTop + 0.03, 0.35),
    new THREE.Vector3(3.5, gy(3.5, 0.55) - 0.12, 0.55),
  ];
  const tpc = new THREE.MeshStandardMaterial({ color: 0xb8402e, roughness: 0.6 });
  group.add(pipeAlong(conduitUp, 0.022, tpc, { bend: 0.18 }));
  const end = trench[trench.length - 1];
  const conduitAnnex = [
    new THREE.Vector3(end[0], gy(end[0], end[1]) - 0.12, end[1]),
    new THREE.Vector3(ANNEX.x0 - 0.15, gy(end[0], end[1]) + 0.2, end[1]),
    new THREE.Vector3(ANNEX.x0 - 0.05, gy(end[0], end[1]) + 0.45, end[1]),
    new THREE.Vector3(ANNEX.x0 + 0.05, gy(end[0], end[1]) + 0.45, end[1]),
  ];
  group.add(pipeAlong(conduitAnnex, 0.022, tpc, { bend: 0.12 }));

  // trench: a low mound of disturbed soil following the ground
  const curve = new THREE.CatmullRomCurve3(trench.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const N = 60;
  const pos: number[] = [];
  const idx: number[] = [];
  const t = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const p = curve.getPointAt(i / N);
    curve.getTangentAt(i / N, t);
    const sx = -t.z;
    const sz = t.x;
    for (const a of [-1, -0.4, 0.4, 1]) {
      const x = p.x + sx * a * 0.24;
      const z = p.z + sz * a * 0.24;
      pos.push(x, gy(x, z) + 0.015 + 0.05 * (1 - a * a), z);
    }
    if (i > 0) {
      const b = (i - 1) * 4;
      for (let c = 0; c < 3; c++) idx.push(b + c, b + c + 4, b + c + 1, b + c + 1, b + c + 4, b + c + 5);
    }
  }
  const trenchGeo = new THREE.BufferGeometry();
  trenchGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  trenchGeo.setIndex(idx);
  trenchGeo.computeVertexNormals();
  const soil = new THREE.Mesh(
    trenchGeo,
    new THREE.MeshStandardMaterial({ color: 0x6b5238, roughness: 1, side: THREE.DoubleSide }),
  );
  soil.receiveShadow = true;
  group.add(noShadow(soil));
  // cable gland on the annex wall
  group.add(
    new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), MAT.pvcGrey())
      .translateX(ANNEX.x0 + 0.02)
      .translateY(conduitAnnex[3].y)
      .translateZ(end[1]),
  );

  const hotspot = new THREE.Object3D();
  const mid = curve.getPointAt(0.5);
  hotspot.position.set(mid.x, gy(mid.x, mid.z) + 0.7, mid.z);
  group.add(hotspot);

  const lift = new THREE.Vector3(0, 0.15, 0);
  const points = [
    ...cablePts.map((p) => p.clone().add(lift)),
    ...conduitUp.slice(1).map((p) => p.clone().add(lift)),
    ...curve.getSpacedPoints(24).map((p) => new THREE.Vector3(p.x, gy(p.x, p.z) + 0.2, p.z)),
    conduitAnnex[3].clone().add(lift),
  ];
  return { group, hotspot, points };
}
