import * as THREE from 'three';
import { MAT } from '../materials';
import { rng } from '../util';
import { boulderGeometry, compose, slabGeometry, tmp, type V3 } from './common';
import { BED_Y, BOX, CREST, FRAME, pondY, terrainH } from './dims';

// Dry-stone slate weir across the stream (two wings on each side of the intake frame), rim
// stones holding the pond, flat slabs supporting the stainless box and an apron of slabs
// where the overflow lands. Two instanced meshes: flat slabs and rounded boulders.

const WEIR_TOP = CREST.y + 0.045;
const X_UP = -0.47;
/** Downstream face of the weir, battered (narrower at the top). */
const xDown = (y: number) => -0.06 - (0.1 * (y - BED_Y)) / (WEIR_TOP - BED_Y);

const SLATE = [0x4d5257, 0x5d6166, 0x6c6a64, 0x7a756c, 0x585a52, 0x6b5d4f, 0x474a4d].map((h) => new THREE.Color(h));

export interface Weir {
  group: THREE.Group;
  anchor: THREE.Object3D;
}

class Stack {
  readonly mesh: THREE.InstancedMesh;
  n = 0;
  constructor(
    geo: THREE.BufferGeometry,
    max: number,
    private r: () => number,
  ) {
    const mat = MAT.slate();
    mat.color.set(0xffffff); // tinted per instance
    mat.roughness = 0.84;
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
  add(pos: V3, size: V3, rot: V3 = [0, 0, 0]): void {
    if (this.n >= this.mesh.instanceMatrix.count) return;
    const r = this.r;
    this.mesh.setMatrixAt(this.n, compose(pos, rot, size));
    this.mesh.setColorAt(this.n, tmp.c.copy(SLATE[Math.floor(r() * SLATE.length)]).multiplyScalar(0.8 + r() * 0.35));
    this.n++;
  }
  done(): THREE.InstancedMesh {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    return this.mesh;
  }
}

/** Coursed slate wings between the frame posts and the block edges. */
function wings(slabs: Stack, r: () => number): void {
  const zIn = FRAME.zOut + FRAME.post + 0.006;
  const zOut = 0.785;
  for (const side of [-1, 1]) {
    let y = BED_Y - 0.01;
    const yMax = WEIR_TOP - 0.05; // the capstones finish the wall
    while (yMax - y > 0.02) {
      const left = yMax - y;
      const hc = left < 0.09 ? left : 0.045 + r() * 0.03;
      const xd = xDown(y + hc);
      // first stone of each course butts against the frame post
      let z = zIn;
      while (z < zOut - 0.03) {
        const w = Math.min(0.12 + r() * 0.15, zOut - z);
        const zc = side * (z + w / 2);
        const split = X_UP + (xd - X_UP) * (0.4 + r() * 0.2);
        for (const [x0, x1] of [
          [X_UP, split],
          [split, xd],
        ]) {
          const xc = (x0 + x1) / 2;
          const top = y + hc;
          if (top < terrainH(xc, zc) - 0.01) continue; // buried in the bank
          slabs.add(
            [xc + (r() - 0.5) * 0.015, y + hc / 2, zc],
            [x1 - x0 - 0.008, hc - 0.005, w - 0.008],
            [(r() - 0.5) * 0.05, (r() - 0.5) * 0.08, (r() - 0.5) * 0.05],
          );
        }
        z += w;
      }
      y += hc;
    }
    // capstones: long slabs across the whole width of the wall
    let z = zIn;
    while (z < zOut - 0.04) {
      const w = Math.min(0.18 + r() * 0.14, zOut - z);
      const x1 = xDown(WEIR_TOP) + 0.02;
      slabs.add(
        [(X_UP + x1) / 2, WEIR_TOP - 0.025, side * (z + w / 2)],
        [x1 - X_UP + 0.02, 0.05, w - 0.01],
        [(r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.04],
      );
      z += w;
    }
  }
}

/** Slabs under the box and the sand trap, and the apron where the overflow lands. */
function supports(slabs: Stack, r: () => number): void {
  const under = BOX.floor - 0.003;
  const half = (under - BED_Y + 0.01) / 2;
  for (const x of [-0.13, -0.01]) {
    for (const z of [-0.15, 0.15]) {
      for (let k = 0; k < 2; k++) {
        slabs.add(
          [x, BED_Y - 0.01 + half * (k + 0.5), z],
          [0.16 + r() * 0.04, half - 0.004, 0.22 + r() * 0.05],
          [0, (r() - 0.5) * 0.2, 0],
        );
      }
    }
  }
  const trapH = BOX.trapBottom - 0.003 - (BED_Y - 0.01);
  for (const z of [-0.14, 0.14]) {
    slabs.add([0.14, BED_Y - 0.01 + trapH / 2, z], [0.13, trapH, 0.24], [0, (r() - 0.5) * 0.15, 0]);
  }
  // apron below the overflow lip
  for (let i = 0; i < 9; i++) {
    const x = 0.27 + r() * 0.42;
    const z = -0.25 + r() * 0.55;
    const h = 0.025 + r() * 0.02;
    slabs.add(
      [x, terrainH(x, z) + h * 0.3, z],
      [0.12 + r() * 0.12, h, 0.1 + r() * 0.12],
      [(r() - 0.5) * 0.12, r() * 3, (r() - 0.5) * 0.12],
    );
  }
}

/** Boulders along the pond shore (found by marching out to the water line). */
function shore(boulders: Stack, r: () => number): void {
  const level = pondY(1);
  const cx = -0.68;
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + r() * 0.1;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    if (dx > 0.35) continue; // the weir side
    let d = 0.1;
    while (d < 0.9 && terrainH(cx + dx * d, dz * d) < level) d += 0.01;
    if (d > 0.75) continue; // inflow channel
    const x = cx + dx * d;
    const z = dz * d;
    const s = 0.035 + r() * 0.04;
    boulders.add([x, level - s * 0.25, z], [s * (1 + r() * 0.5), s * 0.7, s], [r(), r() * 6, r()]);
  }
  // a few boulders along the inflow channel and in the downstream bed
  for (let i = 0; i < 14; i++) {
    const up = i < 7;
    const x = up ? -1.15 + r() * 0.25 : 0.7 + r() * 0.45;
    const z = up ? (r() > 0.5 ? 1 : -1) * (0.15 + r() * 0.1) - 0.05 : (r() > 0.5 ? 0.3 : -0.2) + (r() - 0.5) * 0.1;
    const s = 0.03 + r() * 0.035;
    boulders.add([x, terrainH(x, z) + s * 0.3, z], [s * 1.3, s * 0.8, s], [r(), r() * 6, r()]);
  }
}

export function buildWeir(): Weir {
  const group = new THREE.Group();
  group.name = 'in-weir';
  const r = rng(77);
  const slabs = new Stack(slabGeometry(2), 520, r);
  const boulders = new Stack(boulderGeometry(9, 1), 80, r);
  wings(slabs, r);
  supports(slabs, r);
  shore(boulders, r);
  group.add(slabs.done(), boulders.done());
  const anchor = new THREE.Object3D();
  anchor.position.set(-0.12, 0.62, 0.6); // downstream face of the near wing
  group.add(anchor);
  return { group, anchor };
}
