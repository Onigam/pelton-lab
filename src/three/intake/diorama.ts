import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { canvasTexture, rng } from '@onigam/lab-kit/three';
import { boulderGeometry, compose, noShadow, tmp } from './common';
import {
  BLOCK,
  bedY,
  channelHalfW,
  channelZ,
  FRAME,
  HALF_W,
  PIPE_PTS,
  pondY,
  smoothstep,
  terrainH,
  vnoise,
} from './dims';
import { groundTexture, strataTexture } from './textures';

// The stage: drafting-paper floor (same as the turbine workshop), lights, and the cut-out
// block of stream bed with layered cut faces, gravel, pebbles and grass on the banks.

export const PLINTH_H = 0.035;

/** Paper-like blueprint floor with a fine grid, like a drafting table. */
function blueprintFloor(): THREE.Mesh {
  const { texture } = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#efe6d3';
    ctx.fillRect(0, 0, w, h);
    const cell = w / 20;
    for (let i = 0; i <= 20; i++) {
      for (let k = 1; k < 5; k++) {
        ctx.strokeStyle = 'rgba(40,60,90,0.06)';
        ctx.lineWidth = 1;
        const p = i * cell + (k * cell) / 5;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, h);
        ctx.moveTo(0, p);
        ctx.lineTo(w, p);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(40,60,90,0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, h);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(w, i * cell);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}

export function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 1.05));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.5);
  key.position.set(2.2, 4.2, 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const c = key.shadow.camera;
  c.left = -1.7;
  c.right = 1.7;
  c.top = 1.7;
  c.bottom = -1.7;
  c.near = 0.5;
  c.far = 10;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  key.target.position.set(0, 0.45, 0);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.7);
  fill.position.set(-3, 2, 1.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.7);
  rim.position.set(-0.5, 3, -4);
  scene.add(rim);
}

/** Grid (u, v ∈ [-1, 1]) → plan position inside the rounded rectangle of the block. */
function blockXZ(u: number, v: number): [number, number] {
  const hx = (BLOCK.x1 - BLOCK.x0) / 2;
  const hz = (BLOCK.z1 - BLOCK.z0) / 2;
  const r = BLOCK.corner;
  let x = u * hx;
  let z = v * hz;
  const cx = hx - r;
  const cz = hz - r;
  if (Math.abs(x) > cx && Math.abs(z) > cz) {
    // square corner cell → quarter disc (concentric mapping, continuous with the edges)
    const dx = Math.abs(x) - cx;
    const dz = Math.abs(z) - cz;
    const t = Math.max(dx, dz);
    const l = Math.hypot(dx, dz);
    x = Math.sign(x) * (cx + (dx / l) * t);
    z = Math.sign(z) * (cz + (dz / l) * t);
  }
  return [x + (BLOCK.x0 + BLOCK.x1) / 2, z + (BLOCK.z0 + BLOCK.z1) / 2];
}

const COL = {
  gravel: new THREE.Color(0x8e877a),
  gravelWet: new THREE.Color(0x5f5a50),
  mud: new THREE.Color(0x4f4a3a),
  soil: new THREE.Color(0x6a5139),
  moss: new THREE.Color(0x5f7a35),
  grass: new THREE.Color(0x77913f),
  topsoil: new THREE.Color(0x3d2c1e),
};

/** Ground colour at a point of the top surface. */
function groundColor(x: number, z: number, h: number, out: THREE.Color): THREE.Color {
  const dz = Math.abs(z - channelZ(x));
  const hw = channelHalfW(x);
  const ramp = smoothstep(hw - 0.02, hw + 0.16, dz);
  const pond = x > -1.0 && x < -0.3 && h < pondY(1) + 0.004;
  out.copy(pond ? COL.mud : COL.gravel);
  if (!pond && h < bedY(x) + 0.03) out.lerp(COL.gravelWet, 0.6);
  // banks: soil on the slopes, moss and grass on top (not on the far gravel shelf downstream)
  const shelf = x > -0.05 && z < channelZ(x);
  const n = 0.5 + 0.5 * vnoise(x * 6, z * 6);
  const green = shelf ? 0 : smoothstep(0.35, 0.9, ramp) * (0.6 + 0.4 * n);
  out.lerp(COL.soil, ramp * 0.8 * (shelf ? 0.3 : 1));
  out.lerp(n > 0.5 ? COL.grass : COL.moss, green);
  return out;
}

function blockTop(): THREE.Mesh {
  const nx = 120;
  const nz = 80;
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const c = new THREE.Color();
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const [x, z] = blockXZ((i / nx) * 2 - 1, (j / nz) * 2 - 1);
      const h = terrainH(x, z);
      pos.push(x, h, z);
      groundColor(x, z, h, c);
      col.push(c.r, c.g, c.b);
      uv.push(x * 2, z * 2);
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + nx + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({ map: groundTexture(), vertexColors: true, roughness: 0.95 }),
  );
  m.receiveShadow = true;
  m.castShadow = true;
  m.name = 'block-top';
  return m;
}

/** Perimeter of the block, counter-clockwise seen from above, sampled like the top grid. */
function perimeter(): [number, number][] {
  const pts: [number, number][] = [];
  const nx = 120;
  const nz = 80;
  for (let i = 0; i < nx; i++) pts.push(blockXZ((i / nx) * 2 - 1, 1));
  for (let j = nz; j > 0; j--) pts.push(blockXZ(1, (j / nz) * 2 - 1));
  for (let i = nx; i > 0; i--) pts.push(blockXZ((i / nx) * 2 - 1, -1));
  for (let j = 0; j < nz; j++) pts.push(blockXZ(-1, (j / nz) * 2 - 1));
  return pts;
}

/** Cut faces: strata texture in absolute height, a dark topsoil band under the surface. */
function blockWalls(): THREE.Mesh {
  const ring = perimeter();
  const n = ring.length;
  const rows = 9;
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  let s = 0;
  const c = new THREE.Color();
  for (let i = 0; i <= n; i++) {
    const [x, z] = ring[i % n];
    const [xa, za] = ring[(i - 1 + n) % n];
    const [xb, zb] = ring[(i + 1) % n];
    if (i > 0) s += Math.hypot(x - xa, z - za);
    // outward normal of the ring (it runs +X along the near edge first)
    const nl = Math.hypot(zb - za, xb - xa);
    const nxv = -(zb - za) / nl;
    const nzv = (xb - xa) / nl;
    const h = terrainH(x, z);
    const dz = Math.abs(z - channelZ(x));
    const inBed = dz < channelHalfW(x) + 0.05;
    for (let k = 0; k <= rows; k++) {
      const y =
        k < rows - 2
          ? PLINTH_H + ((h - 0.07 - PLINTH_H) * k) / (rows - 2)
          : k === rows - 2
            ? h - 0.07
            : k === rows - 1
              ? h - 0.025
              : h;
      pos.push(x, y, z);
      nor.push(nxv, 0, nzv);
      uv.push(s, y);
      if (k >= rows - 1) groundColor(x, z, h, c).multiplyScalar(k === rows ? 1 : 0.8);
      else if (k === rows - 2 && !inBed) c.copy(COL.topsoil).lerp(new THREE.Color(1, 1, 1), 0.35);
      else c.setRGB(1, 1, 1);
      col.push(c.r, c.g, c.b);
    }
  }
  const idx: number[] = [];
  const stride = rows + 1;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < rows; k++) {
      const a = i * stride + k;
      const b = (i + 1) * stride + k;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({ map: strataTexture(), vertexColors: true, roughness: 0.97 }),
  );
  m.castShadow = true;
  m.receiveShadow = true;
  m.name = 'block-walls';
  return m;
}

/** Dark walnut plinth under the block, like a museum diorama. */
function plinth(): THREE.Mesh {
  const w = BLOCK.x1 - BLOCK.x0 + 0.06;
  const d = BLOCK.z1 - BLOCK.z0 + 0.06;
  const m = new THREE.Mesh(
    new RoundedBoxGeometry(w, PLINTH_H, d, 3, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.55, metalness: 0 }),
  );
  m.position.set((BLOCK.x0 + BLOCK.x1) / 2, PLINTH_H / 2, (BLOCK.z0 + BLOCK.z1) / 2);
  m.receiveShadow = true;
  m.castShadow = true;
  return m;
}

/** Is (x, z) occupied by the intake (weir, frame, box, outlet) or the penstock? */
function occupied(x: number, z: number): boolean {
  if (x > -0.5 && x < -0.04) return true; // weir
  if (x > -0.5 && x < 0.32 && Math.abs(z) < FRAME.zOut + FRAME.post + 0.02) return true;
  if (x > 0.05 && x < 0.24 && z < -HALF_W && z > -0.5) return true;
  for (let i = 0; i < PIPE_PTS.length - 1; i++) {
    const a = PIPE_PTS[i];
    const b = PIPE_PTS[i + 1];
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * (b.x - a.x) + (z - a.z) * (b.z - a.z)) / ((b.x - a.x) ** 2 + (b.z - a.z) ** 2)),
    );
    if (Math.hypot(a.x + (b.x - a.x) * t - x, a.z + (b.z - a.z) * t - z) < 0.06) return true;
  }
  return false;
}

/** River pebbles on the beds and banks. */
function pebbles(): THREE.InstancedMesh {
  const r = rng(41);
  const max = 420;
  const inst = new THREE.InstancedMesh(boulderGeometry(5, 0), new THREE.MeshStandardMaterial({ roughness: 0.75 }), max);
  const pal = [0x77736b, 0x8d887e, 0x5d6166, 0x9b9282, 0x6c655a, 0xa9a194].map((h) => new THREE.Color(h));
  let n = 0;
  for (let k = 0; k < 4000 && n < max; k++) {
    const [x, z] = blockXZ(r() * 2 - 1, r() * 2 - 1);
    if (Math.abs(x) > 1.17 || Math.abs(z) > 0.77 || occupied(x, z)) continue;
    const dz = Math.abs(z - channelZ(x));
    const inBed = dz < channelHalfW(x) + 0.08;
    const shelf = x > -0.05 && z < channelZ(x) - 0.3;
    if (!inBed && !shelf && r() > 0.12) continue;
    const s = 0.008 + Math.pow(r(), 2.2) * 0.04;
    const h = terrainH(x, z);
    inst.setMatrixAt(
      n,
      compose([x, h + s * 0.25, z], [r() * 0.4, r() * 6.28, r() * 0.4], [s * (1 + r() * 0.6), s * 0.55, s]),
    );
    inst.setColorAt(n, tmp.c.copy(pal[Math.floor(r() * pal.length)]).multiplyScalar(0.8 + r() * 0.35));
    n++;
  }
  inst.count = n;
  inst.castShadow = true;
  inst.receiveShadow = true;
  inst.name = 'pebbles';
  return inst;
}

/** Tuft of grass blades (merged triangles with a dark base). */
function tuftGeometry(seed: number): THREE.BufferGeometry {
  const r = rng(seed);
  const pos: number[] = [];
  const col: number[] = [];
  for (let b = 0; b < 9; b++) {
    const a = r() * Math.PI * 2;
    const lean = 0.2 + r() * 0.5;
    const hgt = 0.6 + r() * 0.4;
    const w = 0.045;
    const ox = Math.cos(a) * 0.08;
    const oz = Math.sin(a) * 0.08;
    const tx = ox + Math.cos(a) * lean * hgt;
    const tz = oz + Math.sin(a) * lean * hgt;
    const px = -Math.sin(a) * w;
    const pz = Math.cos(a) * w;
    pos.push(ox - px, 0, oz - pz, ox + px, 0, oz + pz, tx, hgt, tz);
    col.push(0.35, 0.4, 0.25, 0.35, 0.4, 0.25, 1, 1, 0.9);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function grass(): THREE.InstancedMesh {
  const r = rng(57);
  const max = 300;
  const inst = new THREE.InstancedMesh(
    tuftGeometry(3),
    new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 }),
    max,
  );
  const pal = [0x6f8f35, 0x5c7a2c, 0x86a043, 0x7a8a3a].map((h) => new THREE.Color(h));
  let n = 0;
  for (let k = 0; k < 6000 && n < max; k++) {
    const [x, z] = blockXZ(r() * 2 - 1, r() * 2 - 1);
    if (Math.abs(x) > 1.15 || Math.abs(z) > 0.76 || occupied(x, z)) continue;
    const h = terrainH(x, z);
    const dz = Math.abs(z - channelZ(x));
    const shelf = x > -0.05 && z < channelZ(x);
    if (dz < channelHalfW(x) + 0.1 || shelf || h < 0.3) continue;
    const s = 0.05 + r() * 0.07;
    inst.setMatrixAt(n, compose([x, h - 0.004, z], [0, r() * 6.28, 0], [s, s * (0.8 + r() * 0.6), s]));
    inst.setColorAt(n, tmp.c.copy(pal[Math.floor(r() * pal.length)]));
    n++;
  }
  inst.count = n;
  inst.receiveShadow = true;
  inst.name = 'grass';
  return noShadow(inst);
}

/** Floor, plinth and the earth block with its decoration (not selectable). */
export function buildDiorama(scene: THREE.Scene): THREE.Group {
  scene.add(blueprintFloor());
  const g = new THREE.Group();
  g.name = 'diorama';
  g.add(plinth(), blockTop(), blockWalls(), pebbles(), grass());
  return g;
}
