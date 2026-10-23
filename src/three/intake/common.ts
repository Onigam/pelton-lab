import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mesh } from '@onigam/lab-kit/three';
import { profile, vnoise } from './dims';

// Shared helpers of the intake diorama: geometry builders for sheet-metal parts that follow
// the hydraulic profile, polygon clipping for planks, irregular stone geometries and `bake()`,
// which merges static meshes per material to keep the draw calls low.

export type V3 = [number, number, number];

/** Do not cast shadows, even when the registry switches the part back to 'solid'. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/**
 * Merge every plain mesh under `root` into one mesh per material (instanced meshes and
 * objects flagged `userData.keep` stay as they are).
 */
export function bake(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map<string, { mat: THREE.Material; cast: boolean; geos: THREE.BufferGeometry[] }>();
  const doomed: THREE.Mesh[] = [];
  const tmp = new THREE.Matrix4();
  const visit = (o: THREE.Object3D) => {
    if (o !== root && o.userData.keep) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material)) {
      const mat = m.material as THREE.Material;
      const key = `${mat.uuid}|${m.castShadow}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mat, cast: m.castShadow, geos: [] }));
      tmp.multiplyMatrices(inv, m.matrixWorld);
      let g = m.geometry.clone().applyMatrix4(tmp);
      if (g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      }
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(g.attributes.position.count * 2, 2));
      g.morphAttributes = {};
      g.clearGroups();
      b.geos.push(g);
      doomed.push(m);
    }
    for (const c of [...o.children]) visit(c);
  };
  visit(root);
  for (const m of doomed) m.removeFromParent();
  for (const b of buckets.values()) {
    const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!merged) continue;
    const out = mesh(merged, b.mat);
    out.castShadow = b.cast;
    if (!b.cast) out.userData.noShadow = true;
    root.add(out);
  }
}

/** Flat 2D shape (X–Y) extruded across the stream between z0 and z1. */
export function extrudeZ(shape: THREE.Shape, z0: number, z1: number, curveSegments = 12): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments });
  g.translate(0, 0, z0);
  return g;
}

/** Shape from a closed polygon. */
export function polyShape(pts: THREE.Vector2[]): THREE.Shape {
  return new THREE.Shape(pts);
}

/**
 * Solid strip between two polylines in the X–Y plane (`outer` and `inner`, same count),
 * extruded from z0 to z1. The long faces get smooth normals, so a curved stainless sheet
 * reflects like one (ExtrudeGeometry would facet it).
 */
export function stripSolid(
  outer: THREE.Vector2[],
  inner: THREE.Vector2[],
  z0: number,
  z1: number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const n = outer.length;
  // smooth 2D normals of the outer line, pointing away from the inner line
  const nOut = outer.map((_, i) => {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(n - 1, i + 1)];
    const v = new THREE.Vector2(-(b.y - a.y), b.x - a.x).normalize();
    return v.dot(outer[i].clone().sub(inner[i])) < 0 ? v.negate() : v;
  });
  const e1 = new THREE.Vector3();
  const e2 = new THREE.Vector3();
  const nAvg = new THREE.Vector3();
  /** Quad a-b-c-d with per-corner normals; the winding is fixed to face the normals. */
  const quad = (q: THREE.Vector3[], ns: THREE.Vector3[], us: number[][]) => {
    nAvg.copy(ns[0]).add(ns[1]).add(ns[2]).add(ns[3]);
    e1.subVectors(q[1], q[0]);
    e2.subVectors(q[2], q[0]);
    const order = e1.cross(e2).dot(nAvg) >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const k of order) {
      pos.push(q[k].x, q[k].y, q[k].z);
      nor.push(ns[k].x, ns[k].y, ns[k].z);
      uv.push(us[k][0], us[k][1]);
    }
  };
  const v3 = (p: THREE.Vector2, z: number) => new THREE.Vector3(p.x, p.y, z);
  const n3 = (p: THREE.Vector2, s = 1) => new THREE.Vector3(p.x * s, p.y * s, 0);
  const zP = new THREE.Vector3(0, 0, 1);
  const zN = new THREE.Vector3(0, 0, -1);
  let len = 0;
  for (let i = 0; i < n - 1; i++) {
    const u0 = len;
    const u1 = (len += outer[i].distanceTo(outer[i + 1]));
    const [o0, o1, i0, i1] = [outer[i], outer[i + 1], inner[i], inner[i + 1]];
    const uvs = [
      [u0, 0],
      [u1, 0],
      [u1, 1],
      [u0, 1],
    ];
    quad(
      [v3(o0, z0), v3(o1, z0), v3(o1, z1), v3(o0, z1)],
      [n3(nOut[i]), n3(nOut[i + 1]), n3(nOut[i + 1]), n3(nOut[i])],
      uvs,
    );
    quad(
      [v3(i0, z0), v3(i1, z0), v3(i1, z1), v3(i0, z1)],
      [n3(nOut[i], -1), n3(nOut[i + 1], -1), n3(nOut[i + 1], -1), n3(nOut[i], -1)],
      uvs,
    );
    quad([v3(o0, z1), v3(o1, z1), v3(i1, z1), v3(i0, z1)], [zP, zP, zP, zP], uvs);
    quad([v3(o0, z0), v3(o1, z0), v3(i1, z0), v3(i0, z0)], [zN, zN, zN, zN], uvs);
  }
  // end caps
  for (const [i, j] of [
    [0, 1],
    [n - 1, n - 2],
  ]) {
    const d = outer[i].clone().sub(outer[j]).normalize();
    const nd = new THREE.Vector3(d.x, d.y, 0);
    quad(
      [v3(outer[i], z0), v3(inner[i], z0), v3(inner[i], z1), v3(outer[i], z1)],
      [nd, nd, nd, nd],
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
    );
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Sheet following the hydraulic profile from s0 to s1, between offsets `top` and `bottom`. */
export function profileSheet(s0: number, s1: number, top: number, bottom: number, z0: number, z1: number, segs = 24) {
  const outer: THREE.Vector2[] = [];
  const inner: THREE.Vector2[] = [];
  for (let i = 0; i <= segs; i++) {
    const q = profile(s0 + ((s1 - s0) * i) / segs);
    outer.push(q.p.clone().addScaledVector(q.n, top));
    inner.push(q.p.clone().addScaledVector(q.n, bottom));
  }
  return stripSolid(outer, inner, z0, z1);
}

/** Sutherland–Hodgman clip of a polygon to the horizontal band y0 ≤ y ≤ y1. */
export function clipBand(poly: THREE.Vector2[], y0: number, y1: number): THREE.Vector2[] {
  const clip = (pts: THREE.Vector2[], inside: (p: THREE.Vector2) => boolean, yc: number) => {
    const out: THREE.Vector2[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const t = (yc - a.y) / (b.y - a.y);
        out.push(new THREE.Vector2(a.x + (b.x - a.x) * t, yc));
      }
    }
    return out;
  };
  return clip(
    clip(poly, (p) => p.y >= y0, y0),
    (p) => p.y <= y1,
    y1,
  );
}

/** Chamfered slab with jittered vertices: dry-stone slate (unit size, scale per instance). */
export function slabGeometry(seed: number): THREE.BufferGeometry {
  const g = new RoundedBoxGeometry(1, 1, 1, 1, 0.16);
  jitter(g, seed, 0.07);
  return g;
}

/** Rounded boulder / pebble (unit radius). */
export function boulderGeometry(seed: number, detail = 1): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detail);
  jitter(g, seed, 0.18);
  return g;
}

function jitter(g: THREE.BufferGeometry, seed: number, amp: number): void {
  const p = g.attributes.position;
  // displace by a positional noise so the duplicated seam vertices move together
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 1 + amp * vnoise(x * 2.7 + seed, z * 2.7 - y * 1.9 + seed * 0.37);
    p.setXYZ(i, x * k, y * (1 + amp * 0.5 * vnoise(z * 3 + seed, x * 3)), z * k);
  }
  g.computeVertexNormals();
}

/** Scratch objects for instance matrices. */
export const tmp = {
  m: new THREE.Matrix4(),
  q: new THREE.Quaternion(),
  e: new THREE.Euler(),
  p: new THREE.Vector3(),
  s: new THREE.Vector3(),
  c: new THREE.Color(),
};

/** Compose an instance matrix from position, Euler rotation and scale. */
export function compose(pos: V3, rot: V3, scl: V3, out = tmp.m): THREE.Matrix4 {
  tmp.e.set(rot[0], rot[1], rot[2]);
  return out.compose(tmp.p.set(...pos), tmp.q.setFromEuler(tmp.e), tmp.s.set(...scl));
}
