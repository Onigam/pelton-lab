import * as THREE from 'three';
import type { Season } from '../../sim/types';
import { canvasTexture, rng } from '../util';
import { SEASON_LOOK, fbm, hex, smooth, vnoise, writeColor } from './common';
import { BOUNDS, nearestStream } from './layout';
import { cabinPadWeight, farHeight, heightAt, meadowMask, pathMask, turbinePadWeight } from './ground';

// Terrain mesh: 25 m tiles merged into ONE geometry, each tile with its own resolution
// (0.6 m around the turbine/house, 1.6 m along the stream, 3-6 m on the far slopes).
// Skirts hide the cracks between tiles of different resolution. A ring of distant
// mountains (backdrop) continues the valley beyond the map.

const TILE = 25;
const NX = Math.round((BOUNDS.x1 - BOUNDS.x0) / TILE);
const NZ = Math.round((BOUNDS.z1 - BOUNDS.z0) / TILE);

interface Tile {
  x0: number;
  z0: number;
  seg: number;
  /** (seg+1)^2 heights, row-major along x. */
  h: Float32Array;
}

function tileSeg(x0: number, z0: number): number {
  // fine: turbine, wall, tailrace, house
  if (x0 < 42 && x0 + TILE > -18 && z0 < 28 && z0 + TILE > -22) return 40;
  const cx = x0 + TILE / 2;
  const cz = z0 + TILE / 2;
  const hit = nearestStream(cx, cz);
  const dT = Math.hypot(cx, cz);
  if ((Math.abs(hit.d) < 22 && hit.s > -160 && hit.s < 560) || dT < 60) return 16;
  if (dT < 240 || Math.abs(hit.d) < 70) return 8;
  return 4;
}

/** Per-vertex inputs of the colour function (re-evaluated when the season changes). */
interface ColorInputs {
  y: Float32Array;
  slope: Float32Array;
  ad: Float32Array;
  meadow: Float32Array;
  path: Float32Array;
  pad: Float32Array;
  noise: Float32Array;
  kind: Uint8Array; // 0 ground, 1 cut face (map border skirt)
}

export interface Terrain {
  mesh: THREE.Mesh;
  backdrop: THREE.Mesh;
  /** Height of the rendered surface (exact triangle interpolation). */
  groundY(x: number, z: number): number;
  /** Approximate surface normal (y component = cos slope). */
  normalAt(x: number, z: number, out?: THREE.Vector3): THREE.Vector3;
  /** Elevation angle (rad) of the skyline seen from the turbine area, per azimuth bin (5 deg, 0 = north, clockwise). */
  horizon: Float32Array;
  applySeason(season: Season): void;
}

function detailTexture(): THREE.Texture {
  const { texture } = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 5000; i++) {
      const g = Math.floor(170 + r() * 85);
      ctx.fillStyle = `rgba(${g},${g},${Math.floor(g * 0.97)},0.35)`;
      const x = r() * w;
      const y = r() * h;
      const s = 1 + r() * 4;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) ctx.fillRect(x + ox, y + oy, s, s * (0.5 + r()));
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function buildTerrain(): Terrain {
  const tiles: Tile[] = [];
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x0 = BOUNDS.x0 + i * TILE;
      const z0 = BOUNDS.z0 + j * TILE;
      tiles.push({ x0, z0, seg: tileSeg(x0, z0), h: new Float32Array(0) });
    }
  }
  const tileAt = (i: number, j: number) => (i < 0 || j < 0 || i >= NX || j >= NZ ? undefined : tiles[j * NX + i]);

  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const inputs = {
    y: [] as number[],
    slope: [] as number[],
    ad: [] as number[],
    meadow: [] as number[],
    path: [] as number[],
    pad: [] as number[],
    noise: [] as number[],
    kind: [] as number[],
  };
  const pushVertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number, kind: number) => {
    pos.push(x, y, z);
    nrm.push(nx, ny, nz);
    uv.push(x / 7, z / 7);
    const hit = nearestStream(x, z);
    inputs.y.push(y);
    inputs.slope.push(1 - ny);
    inputs.ad.push(Math.abs(hit.d));
    inputs.meadow.push(meadowMask(x, z) * smooth(2.5, 6, hit.d));
    inputs.path.push(pathMask(x, z));
    inputs.pad.push(Math.max(turbinePadWeight(x, z) * smooth(1.6, 2.6, hit.d), cabinPadWeight(x, z) > 0.98 ? 1 : 0));
    inputs.noise.push(fbm(x * 0.08, z * 0.08, 3));
    inputs.kind.push(kind);
    return pos.length / 3 - 1;
  };

  for (let tj = 0; tj < NZ; tj++) {
    for (let ti = 0; ti < NX; ti++) {
      const t = tiles[tj * NX + ti];
      const n = t.seg;
      const step = TILE / n;
      const W = n + 3; // padded grid (one extra ring) for consistent normals across tiles
      const ph = new Float32Array(W * W);
      for (let b = 0; b < W; b++) {
        for (let a = 0; a < W; a++) ph[b * W + a] = heightAt(t.x0 + (a - 1) * step, t.z0 + (b - 1) * step);
      }
      t.h = new Float32Array((n + 1) * (n + 1));
      const base = pos.length / 3;
      for (let b = 0; b <= n; b++) {
        for (let a = 0; a <= n; a++) {
          const y = ph[(b + 1) * W + a + 1];
          t.h[b * (n + 1) + a] = y;
          const dx = (ph[(b + 1) * W + a + 2] - ph[(b + 1) * W + a]) / (2 * step);
          const dz = (ph[(b + 2) * W + a + 1] - ph[b * W + a + 1]) / (2 * step);
          const l = Math.hypot(dx, 1, dz);
          pushVertex(t.x0 + a * step, y, t.z0 + b * step, -dx / l, 1 / l, -dz / l, 0);
        }
      }
      for (let b = 0; b < n; b++) {
        for (let a = 0; a < n; a++) {
          const v00 = base + b * (n + 1) + a;
          const v10 = v00 + 1;
          const v01 = v00 + n + 1;
          const v11 = v01 + 1;
          idx.push(v00, v01, v10, v10, v01, v11);
        }
      }
      // skirts where the neighbour has another resolution (or at the map border)
      const sides: [number, number, (k: number) => number][] = [
        [ti - 1, tj, (k) => base + k * (n + 1)], // west edge (a = 0)
        [ti + 1, tj, (k) => base + k * (n + 1) + n], // east edge
        [ti, tj - 1, (k) => base + k], // north edge (b = 0)
        [ti, tj + 1, (k) => base + n * (n + 1) + k], // south edge
      ];
      for (const [ni, nj, vert] of sides) {
        const nb = tileAt(ni, nj);
        if (nb && nb.seg === n) continue;
        const depth = nb ? 1.5 : 40;
        let prevTop = -1;
        let prevBot = -1;
        for (let k = 0; k <= n; k++) {
          const v = vert(k);
          const x = pos[v * 3];
          const y = pos[v * 3 + 1];
          const z = pos[v * 3 + 2];
          const top = pushVertex(x, y, z, nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2], nb ? 0 : 1);
          const bot = pushVertex(x, y - depth, z, nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2], nb ? 0 : 1);
          if (k > 0) idx.push(prevTop, prevBot, top, top, prevBot, bot, prevTop, top, prevBot, top, bot, prevBot);
          prevTop = top;
          prevBot = bot;
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const colors = new Float32Array(pos.length);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();

  const ci: ColorInputs = {
    y: Float32Array.from(inputs.y),
    slope: Float32Array.from(inputs.slope),
    ad: Float32Array.from(inputs.ad),
    meadow: Float32Array.from(inputs.meadow),
    path: Float32Array.from(inputs.path),
    pad: Float32Array.from(inputs.pad),
    noise: Float32Array.from(inputs.noise),
    kind: Uint8Array.from(inputs.kind),
  };

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: detailTexture(),
    roughness: 0.97,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'terrain';
  mesh.receiveShadow = true;
  mesh.castShadow = false; // the ridges are handled by the sun horizon test; saves a big shadow pass

  const groundY = (x: number, z: number): number => {
    const fi = (x - BOUNDS.x0) / TILE;
    const fj = (z - BOUNDS.z0) / TILE;
    const ti = Math.floor(fi);
    const tj = Math.floor(fj);
    const t = tileAt(Math.min(NX - 1, ti), Math.min(NZ - 1, tj));
    if (!t || fi < 0 || fj < 0 || fi > NX || fj > NZ) return farHeight(x, z);
    const n = t.seg;
    const gx = Math.min(n - 1e-6, Math.max(0, ((x - t.x0) / TILE) * n));
    const gz = Math.min(n - 1e-6, Math.max(0, ((z - t.z0) / TILE) * n));
    const a = Math.floor(gx);
    const b = Math.floor(gz);
    const fx = gx - a;
    const fz = gz - b;
    const h00 = t.h[b * (n + 1) + a];
    const h10 = t.h[b * (n + 1) + a + 1];
    const h01 = t.h[(b + 1) * (n + 1) + a];
    const h11 = t.h[(b + 1) * (n + 1) + a + 1];
    // same diagonal as the index buffer (v10-v01)
    if (fx + fz <= 1) return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
    return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  };

  const normalAt = (x: number, z: number, out = new THREE.Vector3()) => {
    const e = 0.8;
    const dx = (groundY(x + e, z) - groundY(x - e, z)) / (2 * e);
    const dz = (groundY(x, z + e) - groundY(x, z - e)) / (2 * e);
    return out.set(-dx, 1, -dz).normalize();
  };

  const backdrop = buildBackdrop();
  const horizon = computeHorizon(14, 6);

  const applySeason = (season: Season) => {
    paintTerrain(colors, ci, season);
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    paintBackdrop(backdrop.geometry, season);
  };
  applySeason('spring');

  return { mesh, backdrop, groundY, normalAt, horizon, applySeason };
}

// ---- colours ----------------------------------------------------------------------------

const C = {
  gravel: hex(0x6e695e),
  rock: hex(0x77746d),
  rockDark: hex(0x5d5a54),
  path: hex(0x8a7a58),
  snow: hex(0xf1f4f8),
  frost: hex(0xc4ccc4),
  cut: hex(0x4d3b2a),
  pad: hex(0x948a78),
};

function paintTerrain(out: Float32Array, ci: ColorInputs, season: Season): void {
  const look = SEASON_LOOK[season];
  const grass = hex(look.grass);
  const grassDry = hex(look.grassDry);
  const forest = hex(look.forestFloor);
  const c = new THREE.Color();
  const g = new THREE.Color();
  const n = ci.y.length;
  for (let i = 0; i < n; i++) {
    if (ci.kind[i] === 1) {
      writeColor(out, i, c.copy(C.cut).multiplyScalar(0.8 + 0.2 * ci.noise[i]));
      continue;
    }
    const nz = ci.noise[i];
    const slope = ci.slope[i];
    const ad = ci.ad[i];
    g.copy(grass).lerp(grassDry, smooth(-0.3, 0.5, nz));
    const open = Math.max(ci.meadow[i], (1 - smooth(4, 11, ad)) * 0.85);
    c.copy(forest).lerp(g, open);
    // mossy patches in the forest
    if (open < 0.5) c.lerp(g, 0.25 * smooth(0.1, 0.5, -nz));
    if (look.frost > 0) c.lerp(C.frost, look.frost * open * (0.6 + 0.4 * nz));
    c.lerp(C.gravel, 1 - smooth(0.45, 1.4, ad));
    c.lerp(C.pad, ci.pad[i] * 0.85);
    c.lerp(C.path, ci.path[i] * 0.7);
    c.lerp(nz > 0 ? C.rock : C.rockDark, smooth(0.42, 0.6, slope));
    if (look.snowLine < Infinity) {
      const s = smooth(look.snowLine, look.snowLine + 18, ci.y[i] + nz * 14) * (1 - smooth(0.3, 0.5, slope));
      c.lerp(C.snow, s * 0.92);
    }
    c.multiplyScalar(0.92 + 0.16 * vnoise(i * 0.37, 1.3));
    writeColor(out, i, c);
  }
}

// ---- backdrop mountains ------------------------------------------------------------------

const RING_OFFSETS = [0, 10, 30, 70, 130, 220, 350, 520, 750, 1050, 1450, 2000];

function buildBackdrop(): THREE.Mesh {
  const cx = (BOUNDS.x0 + BOUNDS.x1) / 2;
  const cz = (BOUNDS.z0 + BOUNDS.z1) / 2;
  // inner boundary = map rectangle, walked clockwise every 12.5 m
  const ring: [number, number][] = [];
  const stepB = 12.5;
  const { x0, x1, z0, z1 } = BOUNDS;
  for (let x = x0; x < x1; x += stepB) ring.push([x, z0]);
  for (let z = z0; z < z1; z += stepB) ring.push([x1, z]);
  for (let x = x1; x > x0; x -= stepB) ring.push([x, z1]);
  for (let z = z1; z > z0; z -= stepB) ring.push([x0, z]);
  const M = ring.length;
  const R = RING_OFFSETS.length;
  const pos = new Float32Array(M * R * 3);
  for (let m = 0; m < M; m++) {
    const [bx, bz] = ring[m];
    const dl = Math.hypot(bx - cx, bz - cz);
    const ux = (bx - cx) / dl;
    const uz = (bz - cz) / dl;
    for (let r = 0; r < R; r++) {
      const off = RING_OFFSETS[r];
      const x = bx + ux * off;
      const z = bz + uz * off;
      const y = r === 0 ? heightAt(x, z) - 0.4 : farHeight(x, z);
      pos.set([x, y, z], (m * R + r) * 3);
    }
  }
  const idx: number[] = [];
  for (let m = 0; m < M; m++) {
    const m2 = (m + 1) % M;
    for (let r = 0; r < R - 1; r++) {
      const a = m * R + r;
      const b = m2 * R + r;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(M * R * 3), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  // make sure the triangles face up whatever the walking direction was
  const nrm = geo.attributes.normal as THREE.BufferAttribute;
  let up = 0;
  for (let i = 0; i < nrm.count; i++) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    geo.setIndex(idx);
    geo.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.name = 'backdrop';
  mesh.receiveShadow = false;
  return mesh;
}

function paintBackdrop(geo: THREE.BufferGeometry, season: Season): void {
  const look = SEASON_LOOK[season];
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nrm = geo.attributes.normal as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const forest = hex(look.conifer).multiplyScalar(0.75);
  const rock = hex(0x6f6d68);
  const snow = hex(0xeef2f6);
  const c = new THREE.Color();
  // high peaks keep snow most of the year
  const line = season === 'winter' ? 120 : season === 'spring' ? 230 : season === 'autumn' ? 330 : 420;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const n = fbm(pos.getX(i) * 0.01, pos.getZ(i) * 0.01, 2);
    c.copy(forest).lerp(rock, smooth(0.25, 0.5, 1 - nrm.getY(i)) + smooth(260, 380, y) * 0.6);
    c.lerp(snow, smooth(line, line + 40, y + n * 40));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}

/** Skyline elevation angle per 5 deg azimuth seen from (x, z), used to hide the low winter sun. */
function computeHorizon(x: number, z: number): Float32Array {
  const out = new Float32Array(72);
  const y0 = heightAt(x, z) + 2;
  for (let k = 0; k < 72; k++) {
    const az = (k * 5 * Math.PI) / 180;
    const dx = Math.sin(az);
    const dz = -Math.cos(az); // azimuth 0 = north = -Z
    let best = -0.2;
    for (let r = 20; r < 2600; r *= 1.08) {
      const a = Math.atan2(farHeight(x + dx * r, z + dz * r) - y0, r);
      if (a > best) best = a;
    }
    out[k] = best;
  }
  return out;
}
