import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Season } from '../../sim/types';
import { canvasTexture, rng } from '@onigam/lab-kit/three';
import { SEASON_LOOK, hex, smooth, vnoise } from './common';
import { cabinPadWeight, meadowMask, pathMask, turbinePadWeight } from './ground';
import { BOUNDS, HOME, nearestStream, streamFrame } from './layout';
import { rockGeometry } from './stream';
import type { Terrain } from './terrain';

// Instanced vegetation: silver firs / spruces, beeches and birches, ferns and grass tufts near
// the stream, boulders on the slopes. Placement is deterministic (rng); seasons only swap
// instance colours and hide the deciduous crowns in winter.

/** Paint a height gradient (fake ambient occlusion) as vertex colours. */
function shadeByHeight(g: THREE.BufferGeometry, y0: number, y1: number, lo: number, hi = 1): THREE.BufferGeometry {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = lo + (hi - lo) * smooth(y0, y1, pos.getY(i));
    col.set([k, k, k], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Unit-height conifer: 4 stacked open cones (foliage) + trunk. */
function coniferGeometries(): { trunk: THREE.BufferGeometry; foliage: THREE.BufferGeometry } {
  const trunk = new THREE.CylinderGeometry(0.012, 0.028, 0.4, 5, 1, true).translate(0, 0.2, 0);
  const tiers: THREE.BufferGeometry[] = [];
  const spec: [number, number, number][] = [
    [0.23, 0.42, 0.34],
    [0.18, 0.36, 0.53],
    [0.13, 0.3, 0.71],
    [0.075, 0.24, 0.87],
  ];
  for (const [r, h, y] of spec) {
    const c = new THREE.ConeGeometry(r, h, 8, 1, true).translate(0, y, 0);
    tiers.push(shadeByHeight(c, y - h / 2, y + h / 2, 0.55));
  }
  return { trunk, foliage: mergeGeometries(tiers)! };
}

/** Unit-height broadleaf: trunk + 5 branches, and a lumpy crown. */
function broadleafGeometries(): { wood: THREE.BufferGeometry; crown: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.018, 0.032, 0.62, 6, 1, true).translate(0, 0.31, 0),
  ];
  for (let k = 0; k < 5; k++) {
    const b = new THREE.CylinderGeometry(0.006, 0.013, 0.34, 4, 1, true).translate(0, 0.17, 0);
    b.rotateZ(0.55 + (k % 2) * 0.25);
    b.rotateY((k * 2 * Math.PI) / 5 + 0.3);
    b.translate(0, 0.38 + k * 0.05, 0);
    parts.push(b);
  }
  const wood = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  const blobs: THREE.BufferGeometry[] = [
    new THREE.IcosahedronGeometry(1, 1).scale(0.34, 0.25, 0.34).translate(0, 0.66, 0),
    new THREE.IcosahedronGeometry(1, 0).scale(0.2, 0.16, 0.2).translate(0.15, 0.8, 0.06),
    new THREE.IcosahedronGeometry(1, 0).scale(0.19, 0.15, 0.19).translate(-0.16, 0.6, -0.1),
  ];
  for (const b of blobs) {
    const p = b.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + 0.24 * vnoise(p.getX(i) * 9 + 1, p.getY(i) * 9 + p.getZ(i) * 7);
      p.setXYZ(i, p.getX(i) * k, 0.66 + (p.getY(i) - 0.66) * k, p.getZ(i) * k);
    }
    b.deleteAttribute('uv');
    b.deleteAttribute('normal');
  }
  const crown = mergeVertices(mergeGeometries(blobs)!);
  crown.computeVertexNormals();
  return { wood, crown: shadeByHeight(crown, 0.42, 0.9, 0.5) };
}

function fernTexture(): THREE.Texture {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#d9e6cf';
    ctx.fillStyle = '#eef5e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, h);
    ctx.quadraticCurveTo(w / 2 + 6, h / 2, w / 2 - 4, 4);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const y = h - 12 - t * (h - 20);
      const x = w / 2 + 6 * Math.sin(t * 3) - 4 * t;
      const len = (1 - t) * 40 + 6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(x + (s * len) / 2, y - 3, len / 2, 3.2, s * -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }).texture;
}

function grassTexture(): THREE.Texture {
  return canvasTexture(128, 64, (ctx, w, h) => {
    const r = rng(12);
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      const x = 8 + r() * (w - 16);
      const top = r() * h * 0.6;
      const g = 200 + r() * 55;
      ctx.strokeStyle = `rgb(${g * 0.92},${g},${g * 0.85})`;
      ctx.lineWidth = 1 + r() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + (r() - 0.5) * 10, (h + top) / 2, x + (r() - 0.5) * 22, top);
      ctx.stroke();
    }
  }).texture;
}

/** Crossed quads around the origin with up-facing normals (lit like the ground). */
function cardGeometry(w: number, h: number, count: number, tilt: number): THREE.BufferGeometry {
  const cards: THREE.BufferGeometry[] = [];
  for (let k = 0; k < count; k++) {
    const p = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
    p.rotateX(tilt);
    p.rotateY((k * Math.PI * 2) / count);
    cards.push(p);
  }
  const g = mergeGeometries(cards)!;
  const n = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

/** Double-sided cards: do not flip the (up) normal on back faces, both sides are lit like the ground. */
function keepNormalUp(mat: THREE.MeshStandardMaterial): void {
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n  normal = normalize( vNormal );',
    );
  };
}

/** Distance from point to segment (2D). */
function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const ex = bx - ax;
  const ez = bz - az;
  const t = Math.min(1, Math.max(0, ((px - ax) * ex + (pz - az) * ez) / (ex * ex + ez * ez)));
  return Math.hypot(ax + ex * t - px, az + ez * t - pz);
}

export interface Vegetation {
  group: THREE.Group;
  applySeason(season: Season): void;
}

export function createVegetation(terrain: Terrain): Vegetation {
  const group = new THREE.Group();
  group.name = 'vegetation';
  const r = rng(2026);
  const nrm = new THREE.Vector3();
  const [cx, , cz] = HOME.position;

  /** Free spot for a tree? (not in the meadow, the stream, the pads or the home view corridor) */
  const treeOk = (x: number, z: number): boolean => {
    if (x < BOUNDS.x0 + 2 || x > BOUNDS.x1 - 2 || z < BOUNDS.z0 + 2 || z > BOUNDS.z1 - 2) return false;
    const hit = nearestStream(x, z);
    if (Math.abs(hit.d) < 4.5) return false;
    if (meadowMask(x, z) * smooth(2.5, 6, hit.d) > 0.12 + r() * 0.3) return false;
    if (turbinePadWeight(x, z) > 0 || cabinPadWeight(x, z) > 0) return false;
    // keep the home view clear: camera -> turbine, house and lower penstock
    if (segDist(x, z, cx, cz, 0, 0) < 7 || segDist(x, z, cx, cz, 29, 12) < 7 || segDist(x, z, cx, cz, -3, -16) < 6)
      return false;
    return terrain.normalAt(x, z, nrm).y > 0.55;
  };

  // --- trees ---------------------------------------------------------------------------------
  type Tree = { x: number; z: number; y: number; h: number; w: number; rot: number; kind: 0 | 1 | 2; v: number };
  const trees: Tree[] = [];
  const grid = 10.5;
  for (let z = BOUNDS.z0; z < BOUNDS.z1; z += grid) {
    for (let x = BOUNDS.x0; x < BOUNDS.x1; x += grid) {
      const tx = x + r() * grid;
      const tz = z + r() * grid;
      if (r() > 0.74 || !treeOk(tx, tz)) continue;
      const y = terrain.groundY(tx, tz);
      const d = nearestStream(tx, tz).d;
      const pCon = 0.12 + 0.7 * smooth(15, 85, y) + (d < 0 ? 0.12 : 0) - 0.3 * (1 - smooth(10, 35, Math.abs(d)));
      const kind: 0 | 1 | 2 = r() < pCon ? 0 : r() < 0.22 ? 2 : 1;
      const h = kind === 0 ? 15 + r() * 15 : kind === 1 ? 12 + r() * 11 : 11 + r() * 8;
      trees.push({
        x: tx,
        z: tz,
        y,
        h,
        w: kind === 2 ? 0.6 + r() * 0.2 : 0.85 + r() * 0.35,
        rot: r() * Math.PI * 2,
        kind,
        v: r(),
      });
    }
  }
  // a few hand-placed trees framing the turbine and the house
  for (const [x, z, kind, h] of [
    [7, -13, 1, 19],
    [-13, -17, 1, 16],
    [12, -9, 2, 14],
    [40, 2, 2, 13],
    [43, 20, 1, 17],
    [-32, 10, 2, 12],
  ] as const) {
    trees.push({ x, z, y: terrain.groundY(x, z), h, w: kind === 2 ? 0.7 : 1.05, rot: x * 1.7, kind, v: 0.5 });
  }

  // Trees near the turbine/house cast shadows (the shadow box is ~85 m wide); far ones do
  // not, which keeps the shadow pass cheap. Each set = trunk/wood mesh + foliage/crown mesh.
  const near = (t: Tree) => Math.hypot(t.x - 12, t.z - 5) < 75;
  const cg = coniferGeometries();
  const bg = broadleafGeometries();
  const mats = {
    conTrunk: new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 }),
    conFoliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
    wood: new THREE.MeshStandardMaterial({ roughness: 0.95 }),
    crown: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }),
  };
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const birchBark = hex(0xd8d4cc);
  const beechBark = hex(0x7d7a72);
  interface TreeSet {
    list: Tree[];
    stem: THREE.InstancedMesh;
    leaves: THREE.InstancedMesh;
  }
  const makeSet = (list: Tree[], conifer: boolean, shadow: boolean): TreeSet => {
    const stem = new THREE.InstancedMesh(
      conifer ? cg.trunk : bg.wood,
      conifer ? mats.conTrunk : mats.wood,
      Math.max(1, list.length),
    );
    const leaves = new THREE.InstancedMesh(
      conifer ? cg.foliage : bg.crown,
      conifer ? mats.conFoliage : mats.crown,
      Math.max(1, list.length),
    );
    list.forEach((t, i) => {
      m.compose(
        new THREE.Vector3(t.x, t.y - 0.3, t.z),
        q.setFromAxisAngle(up, t.rot),
        new THREE.Vector3(t.h * t.w, t.h, t.h * t.w),
      );
      stem.setMatrixAt(i, m);
      leaves.setMatrixAt(i, m);
      if (!conifer) stem.setColorAt(i, t.kind === 2 ? birchBark : beechBark);
    });
    for (const im of [stem, leaves]) {
      im.count = list.length;
      im.castShadow = shadow;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      group.add(im);
    }
    return { list, stem, leaves };
  };
  const coniferSets = [true, false].map((n) =>
    makeSet(
      trees.filter((t) => t.kind === 0 && near(t) === n),
      true,
      n,
    ),
  );
  const broadSets = [true, false].map((n) =>
    makeSet(
      trees.filter((t) => t.kind !== 0 && near(t) === n),
      false,
      n,
    ),
  );

  // --- ferns and grass tufts -----------------------------------------------------------------
  // alphaMap (not map): colour comes from material + instance colour, no dark texture fringes
  const fernMat = new THREE.MeshStandardMaterial({
    alphaMap: fernTexture(),
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 0.9,
  });
  const grassMat = new THREE.MeshStandardMaterial({
    alphaMap: grassTexture(),
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  for (const mat of [fernMat, grassMat]) keepNormalUp(mat);
  const ferns = new THREE.InstancedMesh(cardGeometry(0.42, 0.85, 3, 0.65), fernMat, 2000);
  const grass = new THREE.InstancedMesh(cardGeometry(0.55, 0.32, 2, 0.08), grassMat, 5200);
  const scatter = (
    im: THREE.InstancedMesh,
    max: number,
    tries: number,
    pick: () => [number, number] | null,
    size: () => number,
  ) => {
    let n = 0;
    for (let k = 0; k < tries && n < max; k++) {
      const p = pick();
      if (!p) continue;
      const [x, z] = p;
      const s = size();
      m.compose(
        new THREE.Vector3(x, terrain.groundY(x, z) - 0.03, z),
        q.setFromAxisAngle(up, r() * 6.28),
        new THREE.Vector3(s, s * (0.8 + r() * 0.4), s),
      );
      im.setMatrixAt(n, m);
      im.setColorAt(n++, new THREE.Color().setScalar(0.8 + r() * 0.35));
    }
    im.count = n;
    im.computeBoundingSphere();
  };
  const clearOf = (x: number, z: number) =>
    turbinePadWeight(x, z) < 0.2 && cabinPadWeight(x, z) < 0.2 && pathMask(x, z) < 0.3;
  scatter(
    ferns,
    2000,
    9000,
    () => {
      const s = -60 + r() * 330;
      const side = r() < 0.5 ? -1 : 1;
      const d = side * (1.6 + Math.pow(r(), 1.6) * 28);
      const f = streamPoint(s, d);
      if (!f || !clearOf(f[0], f[1]) || meadowMask(f[0], f[1]) * smooth(2.5, 6, d) > 0.4) return null;
      return f;
    },
    () => 0.7 + r() * 0.8,
  );
  scatter(
    grass,
    5200,
    12000,
    () => {
      if (r() < 0.6) {
        const x = -6 + r() * 60;
        const z = -14 + r() * 50;
        if (meadowMask(x, z) < 0.3 || !clearOf(x, z) || (x > 20.5 && x < 34.5 && z > 8 && z < 16)) return null;
        return [x, z];
      }
      const s = -120 + r() * 480;
      const d = (r() < 0.5 ? -1 : 1) * (0.9 + r() * 5);
      const f = streamPoint(s, d);
      return f && clearOf(f[0], f[1]) ? f : null;
    },
    () => 0.6 + r() * 0.9,
  );
  for (const im of [ferns, grass]) {
    im.receiveShadow = true;
    group.add(im);
  }

  // --- boulders on the slopes ----------------------------------------------------------------
  const boulders = new THREE.InstancedMesh(
    rockGeometry(7),
    new THREE.MeshStandardMaterial({ color: 0x8a8780, roughness: 0.9, flatShading: true }),
    320,
  );
  let nb = 0;
  for (let k = 0; k < 4000 && nb < 320; k++) {
    const x = BOUNDS.x0 + r() * (BOUNDS.x1 - BOUNDS.x0);
    const z = BOUNDS.z0 + r() * (BOUNDS.z1 - BOUNDS.z0);
    const ny = terrain.normalAt(x, z, nrm).y;
    if (ny > 0.8 && r() < 0.85) continue;
    if (!treeOk(x, z)) continue;
    const s = 0.5 + r() * r() * 2.4;
    m.compose(
      new THREE.Vector3(x, terrain.groundY(x, z) - s * 0.35, z),
      q.setFromEuler(new THREE.Euler(r(), r() * 6, r())),
      new THREE.Vector3(s * 1.2, s * 0.7, s),
    );
    boulders.setMatrixAt(nb, m);
    boulders.setColorAt(nb++, new THREE.Color().setScalar(0.75 + r() * 0.35));
  }
  boulders.count = nb;
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  group.add(boulders);

  const c = new THREE.Color();
  return {
    group,
    applySeason(season) {
      const look = SEASON_LOOK[season];
      const con = hex(look.conifer);
      for (const set of coniferSets) {
        set.list.forEach((t, i) => set.leaves.setColorAt(i, c.copy(con).multiplyScalar(0.8 + t.v * 0.4)));
        if (set.leaves.instanceColor) set.leaves.instanceColor.needsUpdate = true;
      }
      const leaves = look.leaves.map(hex);
      for (const set of broadSets) {
        set.list.forEach((t, i) => {
          c.copy(leaves[Math.floor(t.v * leaves.length) % leaves.length]);
          if (t.kind === 2) c.offsetHSL(0.02, 0, 0.05); // birch: lighter, yellower
          set.leaves.setColorAt(i, c.multiplyScalar(0.85 + ((t.v * 7.3) % 1) * 0.3));
        });
        if (set.leaves.instanceColor) set.leaves.instanceColor.needsUpdate = true;
        set.leaves.visible = look.leavesOn;
      }
      fernMat.color.setHex(look.fern).multiplyScalar(0.85);
      grassMat.color.setHex(look.grass).lerp(hex(0xc8cfc4), look.frost).multiplyScalar(0.78);
    },
  };
}

const F = { x: 0, z: 0, tx: 0, tz: -1 };
/** World (x, z) at arc s and signed offset d from the stream, or null if off the map. */
function streamPoint(s: number, d: number): [number, number] | null {
  const f = streamFrame(s, F);
  const x = f.x - f.tz * d;
  const z = f.z + f.tx * d;
  if (x < BOUNDS.x0 + 1 || x > BOUNDS.x1 - 1 || z < BOUNDS.z0 + 1 || z > BOUNDS.z1 - 1) return null;
  return [x, z];
}
