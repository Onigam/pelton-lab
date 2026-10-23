import * as THREE from 'three';
import { glass } from '@onigam/lab-kit/three';
import { group, mesh } from '@onigam/lab-kit/three';
import { bake, box, cyl, planarUv, type Palette, screws, type V3 } from './common';
import { BENCH, OSB, OSB_Z, ROOM, TRUNKING, WINDOW } from './layout';
import { blockTexture, floorTexture, osbTexture, renderTexture, skyTexture, woodTexture } from './textures';

// The room shell as a cut-away diorama: floor, back wall in concrete blocks with a small
// window, rendered side wall (turbine cable entry), ceiling beam with an LED batten,
// OSB backboard, wooden workbench, parts organiser and slotted grey cable trunking.

export interface Room {
  group: THREE.Group;
  /** Side wall, hidden in cut-away mode. */
  sideWall: THREE.Object3D;
}

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/** Box spanning [x0,x1]×[y0,y1]×[z0,z1] with planar UVs (metres / tile). */
function slab(
  parent: THREE.Object3D,
  mat: THREE.Material,
  [x0, x1]: [number, number],
  [y0, y1]: [number, number],
  [z0, z1]: [number, number],
  tile = 1,
  cast = true,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  planarUv(geo, tile);
  const m = mesh(geo, mat);
  m.castShadow = cast;
  parent.add(m);
  return m;
}

function walls(g: THREE.Group, mats: ReturnType<typeof roomMaterials>): THREE.Object3D {
  const { x0, x1, h, d, wall } = ROOM;
  const W = WINDOW;
  slab(g, mats.floor, [x0 - wall, x1], [-0.1, 0], [-wall, d], 1.5, false);
  // back wall in four pieces around the window opening
  slab(g, mats.blocks, [x0 - wall, W.x0], [0, h], [-wall, 0]);
  slab(g, mats.blocks, [W.x1, x1], [0, h], [-wall, 0]);
  slab(g, mats.blocks, [W.x0, W.x1], [0, W.y0], [-wall, 0]);
  slab(g, mats.blocks, [W.x0, W.x1], [W.y1, h], [-wall, 0]);

  const side = slab(g, mats.render, [x0 - wall, x0], [0, h], [0, d], 1);
  side.userData.keep = true;
  // mortar patch where the turbine conduit goes through the wall
  const patch = cyl(g, mats.patch, 0.06, 0.006, [x0 + 0.003, 2.25, 0.35], 'x', 20);
  patch.userData.keep = true;
  side.add(patch);
  patch.position.set(x0 + 0.003, 2.25, 0.35);

  // ceiling: wall plate on the back wall + one beam across (no shadows: keeps the wall lit)
  slab(g, mats.beam, [x0 - wall, x1], [2.38, h], [0, 0.12], 0.6, false);
  slab(g, mats.beam, [x0 - wall, x1], [2.3, h], [1.0, 1.16], 0.6, false);
  return side;
}

function windowFrame(g: THREE.Group, pal: Palette) {
  const W = WINDOW;
  const frame = std({ color: 0xf1efe8, roughness: 0.5 });
  const t = 0.045;
  const z: V3 = [0, 0, -0.09];
  const cx = (W.x0 + W.x1) / 2;
  const cy = (W.y0 + W.y1) / 2;
  const w = W.x1 - W.x0;
  const hh = W.y1 - W.y0;
  box(g, frame, [w, t, 0.06], [cx, W.y0 + t / 2, z[2]]);
  box(g, frame, [w, t, 0.06], [cx, W.y1 - t / 2, z[2]]);
  box(g, frame, [t, hh, 0.06], [W.x0 + t / 2, cy, z[2]]);
  box(g, frame, [t, hh, 0.06], [W.x1 - t / 2, cy, z[2]]);
  box(g, frame, [0.03, hh, 0.04], [cx, cy, z[2]]);
  const pane = mesh(new THREE.PlaneGeometry(w - t, hh - t), glass(0.12), [cx, cy, z[2]]);
  pane.castShadow = false;
  g.add(pane);
  // sill and the outside view
  box(g, pal.white, [w + 0.06, 0.025, 0.09], [cx, W.y0 - 0.012, 0.015]);
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 0.3, hh + 0.3),
    new THREE.MeshBasicMaterial({ map: skyTexture() }),
  );
  sky.position.set(cx, cy, -ROOM.wall - 0.05);
  g.add(sky);
}

function bench(g: THREE.Group, mats: ReturnType<typeof roomMaterials>) {
  const B = BENCH;
  slab(g, mats.wood, [B.x0, B.x1], [B.top - B.t, B.top], [B.z0, B.z1], 0.6);
  // joint between the two boards of the top
  box(g, mats.gap, [B.x1 - B.x0, 0.002, 0.004], [(B.x0 + B.x1) / 2, B.top, (B.z0 + B.z1) / 2]);
  slab(g, mats.wood, [B.x0, B.x1], [B.top - 0.1, B.top - B.t], [0.045, 0.085], 0.6); // wall cleat
  slab(g, mats.wood, [B.x0, B.x1], [B.top - 0.1, B.top - B.t], [B.z1 - 0.045, B.z1 - 0.005], 0.6);
  for (const x of [-0.45, 0.55, 1.52]) {
    slab(g, mats.wood, [x - 0.035, x + 0.035], [0, B.top - B.t], [B.z1 - 0.08, B.z1 - 0.01], 0.6);
  }
  slab(g, mats.osb, [B.x0, B.x0 + 0.018], [0, B.top - B.t], [B.z0, B.z1], 0.6); // OSB end panel
}

function backboard(g: THREE.Group, mats: ReturnType<typeof roomMaterials>, pal: Palette) {
  slab(g, mats.osb, [OSB.x0, OSB.x1], [OSB.y0, OSB.y1], [0, OSB_Z], 0.6, false);
  const xy: [number, number][] = [];
  for (let x = OSB.x0 + 0.04; x < OSB.x1; x += 0.6) {
    for (const y of [OSB.y0 + 0.04, (OSB.y0 + OSB.y1) / 2, OSB.y1 - 0.04]) xy.push([x, y]);
  }
  screws(g, pal.zinc, 0.006, OSB_Z, xy);
}

/** Two stacked parts organisers with translucent drawers (instanced). */
function organiser(g: THREE.Group, pal: Palette) {
  const x = 1.25;
  const z0 = 0.07;
  const body = std({ color: 0x5c6267, roughness: 0.6 });
  const drawerMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8c4cc,
    roughness: 0.3,
    transparent: true,
    opacity: 0.75,
  });
  const units = [
    { y0: BENCH.top, h: 0.5, cols: 5, rows: 10 },
    { y0: BENCH.top + 0.5, h: 0.27, cols: 3, rows: 4 },
  ];
  const fronts: THREE.Matrix4[] = [];
  const tags: THREE.Matrix4[] = [];
  const W = 0.38;
  const D = 0.16;
  for (const u of units) {
    box(g, body, [W, u.h, D], [x, u.y0 + u.h / 2, z0 + D / 2]);
    const cw = (W - 0.02) / u.cols;
    const rh = (u.h - 0.02) / u.rows;
    for (let c = 0; c < u.cols; c++) {
      for (let r = 0; r < u.rows; r++) {
        const px = x - W / 2 + 0.01 + cw * (c + 0.5);
        const py = u.y0 + 0.01 + rh * (r + 0.5);
        fronts.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(px, py, z0 + D + 0.004),
            new THREE.Quaternion(),
            new THREE.Vector3(cw - 0.006, rh - 0.005, 0.012),
          ),
        );
        tags.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(px, py + rh * 0.12, z0 + D + 0.0105),
            new THREE.Quaternion(),
            new THREE.Vector3(cw * 0.5, rh * 0.28, 0.001),
          ),
        );
      }
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const inst = (mat: THREE.Material, ms: THREE.Matrix4[]) => {
    const im = new THREE.InstancedMesh(geo, mat, ms.length);
    ms.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = false;
    im.receiveShadow = true;
    g.add(im);
  };
  inst(drawerMat, fronts);
  inst(pal.white, tags);
}

/** Slotted grey trunking with clip-on lid; the comb slots are one instanced mesh. */
function trunking(g: THREE.Group) {
  const bodyMat = std({ color: 0x969b9e, roughness: 0.55 });
  const lidMat = std({ color: 0xa3a8ab, roughness: 0.5 });
  const slotMat = std({ color: 0x55595d, roughness: 0.7 });
  const slots: THREE.Matrix4[] = [];
  const W = 0.06;
  const D = 0.045;
  const pitch = 0.012;
  const q = new THREE.Quaternion();
  for (const run of TRUNKING) {
    const [ax, ay] = run.a;
    const [bx, by] = run.b;
    const horiz = Math.abs(bx - ax) > Math.abs(by - ay);
    const L = horiz ? Math.abs(bx - ax) : Math.abs(by - ay);
    const cx = (ax + bx) / 2;
    const cy = (ay + by) / 2;
    const zc = OSB_Z + D / 2;
    box(g, bodyMat, horiz ? [L, W, D] : [W, L, D], [cx, cy, zc]);
    box(g, lidMat, horiz ? [L, W + 0.006, 0.005] : [W + 0.006, L, 0.005], [cx, cy, OSB_Z + D + 0.0025]);
    const n = Math.floor(L / pitch) - 1;
    for (let i = 1; i <= n; i++) {
      const s = -L / 2 + i * pitch;
      for (const side of [-1, 1]) {
        const p = horiz
          ? new THREE.Vector3(cx + s, cy + side * (W / 2 + 0.0006), zc - 0.002)
          : new THREE.Vector3(cx + side * (W / 2 + 0.0006), cy + s, zc - 0.002);
        const sc = horiz ? new THREE.Vector3(0.0045, 0.0014, D - 0.012) : new THREE.Vector3(0.0014, 0.0045, D - 0.012);
        slots.push(new THREE.Matrix4().compose(p, q, sc));
      }
    }
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), slotMat, slots.length);
  slots.forEach((m, i) => im.setMatrixAt(i, m));
  im.castShadow = false;
  g.add(im);
}

/** Ceiling LED batten (the emissive diffuser; the light itself is added by index.ts). */
function batten(g: THREE.Group, pal: Palette) {
  box(g, pal.white, [1.2, 0.035, 0.07], [-0.35, 2.282, 1.08]);
  const diff = std({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 1.6, roughness: 0.4 });
  const m = box(g, diff, [1.17, 0.01, 0.05], [-0.35, 2.26, 1.08]);
  m.castShadow = false;
}

/** Details from the video: wall socket, notice sheets on the bench. */
function details(g: THREE.Group, pal: Palette) {
  const grey = std({ color: 0xa9aeb1, roughness: 0.55 });
  box(g, grey, [0.075, 0.075, 0.045], [-0.05, 1.13, OSB_Z + 0.0225]);
  box(g, grey, [0.068, 0.06, 0.012], [-0.05, 1.125, OSB_Z + 0.05]);
  const paper = std({ color: 0xf6f5f0, roughness: 0.9 });
  const p1 = box(g, paper, [0.21, 0.002, 0.15], [-1.0, BENCH.top + 0.001, 0.2]);
  p1.rotation.y = 0.25;
  const p2 = box(g, paper, [0.15, 0.003, 0.1], [-0.92, BENCH.top + 0.003, 0.24]);
  p2.rotation.y = -0.15;
  // a multimeter left on the bench
  const meter = new THREE.Group();
  meter.position.set(0.2, BENCH.top, 0.36);
  meter.rotation.y = -0.4;
  box(meter, pal.yellow, [0.085, 0.03, 0.17], [0, 0.015, 0]);
  box(meter, pal.plastic, [0.06, 0.002, 0.035], [0, 0.031, -0.045]);
  box(meter, pal.plastic, [0.07, 0.004, 0.08], [0, 0.031, 0.03]);
  g.add(meter);
}

function roomMaterials() {
  return {
    blocks: std({ map: blockTexture(), roughness: 0.95 }),
    render: std({ map: renderTexture(), roughness: 0.97 }),
    floor: std({ map: floorTexture(), roughness: 0.88 }),
    osb: std({ map: osbTexture(), roughness: 0.88 }),
    wood: std({ map: woodTexture(), roughness: 0.72 }),
    beam: std({ map: woodTexture(), color: 0x8a6a4a, roughness: 0.85 }),
    gap: std({ color: 0x5a4028, roughness: 1 }),
    patch: std({ color: 0xa9a49a, roughness: 1 }),
  };
}

export function buildRoom(pal: Palette): Room {
  const g = group('techroom-shell');
  const mats = roomMaterials();
  const sideWall = walls(g, mats);
  windowFrame(g, pal);
  bench(g, mats);
  backboard(g, mats, pal);
  organiser(g, pal);
  trunking(g);
  batten(g, pal);
  details(g, pal);
  bake(g);
  return { group: g, sideWall };
}
