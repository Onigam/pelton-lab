import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Pelton bucket ("auget") built as a real shell: two elliptical half-cups meeting on a
// sharp central splitter, a notch cut at the outer tip, a convex back and a forked stem
// that clamps on the hub disc. Local frame: X = radial distance from the shaft axis,
// Y = tangential (the cup opens towards -Y, facing the incoming jet), Z = axial.

export interface BucketSpec {
  /** Radial centre of the cup ellipse (m). */
  rc: number;
  /** Half radial length (m). */
  a: number;
  /** Half axial width (m). */
  b: number;
  /** Cup depth (m). */
  depth: number;
  /** Shell thickness (m). */
  t: number;
}

const NS = 26; // radial samples
const NV = 14; // samples from splitter to rim

/** Build the inner/outer surfaces of one half cup (z >= 0) and stitch the borders. */
function halfCup(spec: BucketSpec): THREE.BufferGeometry {
  const { rc, a, b, depth, t } = spec;
  const r0 = rc - a * 0.985;
  const r1 = rc + a * 0.985;
  const notchStart = rc + a * 0.45;

  const pos: number[] = [];
  const idx: number[] = [];

  const sample = (i: number, j: number, outer: boolean): [number, number, number] => {
    const s = i / (NS - 1);
    const r = r0 + (r1 - r0) * s;
    const e = (r - rc) / a;
    const hw = b * Math.sqrt(Math.max(0, 1 - e * e));
    // the notch removes the splitter near the tip: z starts at zMin instead of 0
    const k = Math.max(0, (r - notchStart) / (r1 - notchStart));
    const zMin = hw * 0.42 * Math.pow(k, 0.8);
    const v = j / (NV - 1);
    const z = zMin + (hw - zMin) * v;
    const w = hw > 1e-6 ? z / hw : 0;
    const q = hw / b;
    let y: number;
    if (!outer) {
      y = depth * q * Math.pow(Math.sin(Math.PI * Math.min(1, w)), 0.85);
    } else {
      y = t + 1.25 * depth * Math.sqrt(Math.max(0, q * q - w * w * q * q));
    }
    return [r, y, z];
  };

  const grid = (outer: boolean) => {
    const base = pos.length / 3;
    for (let i = 0; i < NS; i++) for (let j = 0; j < NV; j++) pos.push(...sample(i, j, outer));
    for (let i = 0; i < NS - 1; i++) {
      for (let j = 0; j < NV - 1; j++) {
        const p = base + i * NV + j;
        const pr = p + NV;
        if (outer) idx.push(p, p + 1, pr, pr, p + 1, pr + 1);
        else idx.push(p, pr, p + 1, pr, pr + 1, p + 1);
      }
    }
    return base;
  };

  const inner = grid(false);
  const outer = grid(true);

  // stitch rim (j = NV-1) and notch/splitter edge (j = 0) and both ends
  const stitch = (a0: number, a1: number, b0: number, b1: number) => idx.push(a0, b0, a1, a1, b0, b1);
  for (let i = 0; i < NS - 1; i++) {
    // rim faces +Z, splitter/notch edge faces -Z
    const rimI = inner + i * NV + (NV - 1);
    const rimO = outer + i * NV + (NV - 1);
    stitch(rimO, rimO + NV, rimI, rimI + NV);
    const edgeI = inner + i * NV;
    const edgeO = outer + i * NV;
    stitch(edgeI, edgeI + NV, edgeO, edgeO + NV);
  }
  for (const i of [0, NS - 1]) {
    for (let j = 0; j < NV - 1; j++) {
      const pi = inner + i * NV + j;
      const po = outer + i * NV + j;
      if (i === 0) stitch(po, po + 1, pi, pi + 1);
      else stitch(pi, pi + 1, po, po + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Forked stem: a block behind the cup plus two cheeks clamping the hub disc. */
function stem(spec: BucketSpec, hubR: number, hubT: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const rIn = hubR - 0.02;
  const block = new THREE.BoxGeometry(spec.rc - spec.a * 0.35 - rIn, spec.depth * 1.15, hubT + 0.008);
  block.translate((spec.rc - spec.a * 0.35 + rIn) / 2, spec.depth * 0.62, 0);
  parts.push(block);
  for (const side of [-1, 1]) {
    const cheek = new THREE.BoxGeometry(0.026, spec.depth * 1.0, 0.004);
    cheek.translate(rIn + 0.006, spec.depth * 0.55, side * (hubT / 2 + 0.002));
    parts.push(cheek);
  }
  for (const p of parts) p.deleteAttribute('uv');
  return mergeGeometries(parts)!;
}

/** Complete bucket geometry (both half cups + stem), merged for a single draw call. */
export function bucketGeometry(spec: BucketSpec, hubR: number, hubT: number): THREE.BufferGeometry {
  const half = halfCup(spec);
  const mirror = half.clone();
  mirror.scale(1, 1, -1);
  // mirroring flips the winding: swap two indices of every triangle
  const ix = mirror.getIndex()!;
  for (let i = 0; i < ix.count; i += 3) {
    const tmp = ix.getX(i + 1);
    ix.setX(i + 1, ix.getX(i + 2));
    ix.setX(i + 2, tmp);
  }
  mirror.computeVertexNormals();
  // keep each piece's normals: smooth cups, sharp splitter, flat stem
  return mergeGeometries([half, mirror, stem(spec, hubR, hubT)])!;
}

/** Bucket size matched to a jet diameter: width ≈ 3.2 d is the classic rule (scaled up for printability). */
export function bucketSpecFor(set: 'S' | 'L', rPitch: number): BucketSpec {
  const k = set === 'L' ? 1 : 0.84;
  return { rc: rPitch + 0.006, a: 0.034 * k, b: 0.021 * k, depth: 0.013 * k, t: 0.0024 };
}
