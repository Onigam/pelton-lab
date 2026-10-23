import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAT } from '@onigam/lab-kit/three';
import { mesh } from '@onigam/lab-kit/three';
import { DEG, boxUV, noShadow } from './common';
import { CABIN_Y } from './ground';
import { ANNEX, CABIN } from './layout';
import { plankTexture, pvCellTexture, renderTexture, slateTexture, stoneWallTexture } from './textures';

// Small Pyrenean house: rubble-stone walls, wooden gables, 40 deg slate roof with 11 PV panels
// (4.5 kWp) on the south side, and a lean-to technical room on the west gable (facing the turbine).

const PITCH = 40 * DEG;
const WALL_H = 4.6;
const HALF_D = (CABIN.z1 - CABIN.z0) / 2;
const RISE = HALF_D * Math.tan(PITCH);
const CX = (CABIN.x0 + CABIN.x1) / 2;
const CZ = (CABIN.z0 + CABIN.z1) / 2;
const RIDGE_Y = CABIN_Y + WALL_H + RISE + 0.16;
const PANEL = { w: 1.13, h: 1.72, t: 0.035 };

export interface Cabin {
  cabin: THREE.Group;
  pv: THREE.Group;
  techroom: THREE.Group;
  hotspots: { cabin: THREE.Object3D; pv: THREE.Object3D; techroom: THREE.Object3D };
  /** World points PV array -> annex (schematic overlay). */
  pvPoints: THREE.Vector3[];
  /** `snowCabin` / `snowTech`: show roof snow (winter and the part displayed solid). */
  update(night: number, snowCabin: boolean, snowTech: boolean): void;
}

/** Collects box geometries per material and merges them into one mesh each. */
class Batch {
  private geos = new Map<THREE.Material, THREE.BufferGeometry[]>();
  box(mat: THREE.Material, size: [number, number, number], pos: [number, number, number], rotY = 0, tile = 0): void {
    const g = new THREE.BoxGeometry(...size);
    if (tile) boxUV(g, tile);
    if (rotY) g.rotateY(rotY);
    g.translate(...pos);
    this.add(mat, g);
  }
  add(mat: THREE.Material, g: THREE.BufferGeometry): void {
    const list = this.geos.get(mat) ?? [];
    list.push(g.index ? g.toNonIndexed() : g);
    this.geos.set(mat, list);
  }
  flush(into: THREE.Group): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const [mat, list] of this.geos) {
      const m = mesh(mergeGeometries(list)!, mat);
      into.add(m);
      out.push(m);
    }
    this.geos.clear();
    return out;
  }
}

/** Triangular gable prism in the (z, y) plane, extruded along -X by `depth`. */
function gableGeometry(depth: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-HALF_D - 0.02, 0);
  s.lineTo(HALF_D + 0.02, 0);
  s.lineTo(0, RISE + 0.05);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  return g;
}

export function createCabin(): Cabin {
  const cabin = new THREE.Group();
  cabin.name = 'cabin';
  const stoneTex = stoneWallTexture();
  const stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 });
  const slate = new THREE.MeshStandardMaterial({ map: slateTexture(), roughness: 0.7, metalness: 0.1 });
  const planksTex = plankTexture();
  planksTex.repeat.set(0.8, 0.8);
  const planks = new THREE.MeshStandardMaterial({ map: planksTex, roughness: 0.85 });
  const woodDark = MAT.woodDark();
  const shutter = new THREE.MeshStandardMaterial({ color: 0x5d7a86, roughness: 0.7 });
  const glassDark = new THREE.MeshStandardMaterial({ color: 0x1b2730, roughness: 0.08, metalness: 0.4 });
  const glassLit = new THREE.MeshStandardMaterial({
    color: 0x2a2620,
    emissive: 0xffb46b,
    emissiveIntensity: 0,
    roughness: 0.2,
  });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf2f5f8, roughness: 0.9 });

  const b = new Batch();
  // walls (sunk 0.25 m in the ground) + gables
  b.box(stone, [CABIN.x1 - CABIN.x0, WALL_H + 0.25, 2 * HALF_D], [CX, CABIN_Y + (WALL_H - 0.25) / 2, CZ], 0, 2);
  const gable = gableGeometry(0.45);
  b.add(planks, gable.clone().translate(CABIN.x1, CABIN_Y + WALL_H, CZ));
  b.add(planks, gable.clone().translate(CABIN.x0 + 0.45, CABIN_Y + WALL_H, CZ));

  // windows: [face, along, bottom, w, h, lit]
  const southZ = CABIN.z1;
  type Win = [string, number, number, number, number, boolean];
  const wins: Win[] = [
    ['S', 27.0, 0.9, 0.9, 1.1, false],
    ['S', 31.8, 0.9, 0.9, 1.1, true],
    ['S', 26.8, 2.9, 0.8, 1.0, true],
    ['S', 29.3, 2.9, 0.8, 1.0, false],
    ['S', 31.8, 2.9, 0.8, 1.0, false],
    ['N', 30.5, 1.2, 0.6, 0.8, false],
    ['E', 12.0, 2.9, 0.8, 1.0, false],
    ['W', 12.0, 3.4, 0.7, 0.9, true],
  ];
  for (const [face, a, y0, w, h, lit] of wins) {
    const y = CABIN_Y + y0 + h / 2;
    const glass = lit ? glassLit : glassDark;
    if (face === 'S' || face === 'N') {
      const z = face === 'S' ? southZ : CABIN.z0;
      const o = face === 'S' ? 1 : -1;
      b.box(woodDark, [w + 0.14, h + 0.14, 0.1], [a, y, z + o * 0.02]);
      b.box(glass, [w, h, 0.02], [a, y, z + o * 0.075]);
      b.box(woodDark, [w + 0.5, 0.14, 0.18], [a, y + h / 2 + 0.14, z + o * 0.04]);
      for (const sx of [-1, 1]) b.box(shutter, [w / 2, h, 0.04], [a + sx * (w * 0.75 + 0.1), y, z + o * 0.08]);
    } else {
      const x = face === 'E' ? CABIN.x1 : CABIN.x0;
      const o = face === 'E' ? 1 : -1;
      b.box(woodDark, [0.1, h + 0.14, w + 0.14], [x + o * 0.02, y, a]);
      b.box(glass, [0.02, h, w], [x + o * 0.075, y, a]);
      for (const sz of [-1, 1]) b.box(shutter, [0.04, h, w / 2], [x + o * 0.08, y, a + sz * (w * 0.75 + 0.1)]);
    }
  }
  // front door with a stone step
  b.box(planks, [1.0, 2.1, 0.08], [29.8, CABIN_Y + 1.05, southZ + 0.04]);
  b.box(woodDark, [1.2, 0.14, 0.18], [29.8, CABIN_Y + 2.2, southZ + 0.05]);
  b.box(MAT.stone(), [1.4, 0.18, 0.6], [29.8, CABIN_Y + 0.02, southZ + 0.3]);
  // chimney
  b.box(stone, [0.7, 2.0, 0.7], [31.4, RIDGE_Y - 0.2, CZ - 0.9], 0, 1);
  b.box(slate, [0.9, 0.08, 0.9], [31.4, RIDGE_Y + 0.85, CZ - 0.9]);
  b.flush(cabin);

  // roof: two slabs hinged on the ridge, ridge cap, winter snow on the north side
  const eave = 0.45;
  const slopeLen = (HALF_D + eave) / Math.cos(PITCH);
  const roofLen = CABIN.x1 - CABIN.x0 + 0.8;
  const roofSnow: THREE.Mesh[] = [];
  for (const side of [1, -1]) {
    const g = new THREE.Group();
    g.position.set(CX, RIDGE_Y, CZ);
    g.rotation.x = side * PITCH;
    const slab = mesh(boxUV(new THREE.BoxGeometry(roofLen, 0.12, slopeLen), 1.5), slate, [
      0,
      -0.06,
      side * (slopeLen / 2 - 0.05),
    ]);
    g.add(slab);
    const snow = noShadow(
      mesh(new THREE.BoxGeometry(roofLen - 0.1, 0.07, slopeLen * (side < 0 ? 0.98 : 0.35)), snowMat),
    );
    snow.position.set(0, 0.035, side < 0 ? -slopeLen / 2 : slopeLen * 0.8);
    snow.visible = false;
    snow.userData.ownerPart = 'snow'; // keep it out of the registry: visibility is seasonal
    g.add(snow);
    roofSnow.push(snow);
    cabin.add(g);
  }
  cabin.add(mesh(new THREE.BoxGeometry(roofLen, 0.12, 0.3), slate, [CX, RIDGE_Y + 0.05, CZ]));

  // --- PV array: 2 rows (6 + 5) of 1.72 x 1.13 m panels, portrait, on rails -----------------
  const pv = new THREE.Group();
  pv.name = 'pv';
  pv.position.set(CX, RIDGE_Y, CZ);
  pv.rotation.x = PITCH;
  const frames = new THREE.InstancedMesh(new THREE.BoxGeometry(PANEL.w, PANEL.t, PANEL.h), MAT.alu(), 11);
  const cellGeo = new THREE.PlaneGeometry(PANEL.w - 0.04, PANEL.h - 0.04).rotateX(-Math.PI / 2);
  const cells = new THREE.InstancedMesh(
    cellGeo,
    new THREE.MeshStandardMaterial({ map: pvCellTexture(), roughness: 0.22, metalness: 0.35 }),
    11,
  );
  frames.castShadow = cells.castShadow = true;
  frames.receiveShadow = cells.receiveShadow = true;
  const m = new THREE.Matrix4();
  let k = 0;
  const standoff = 0.13;
  for (const [count, u] of [
    [6, 1.25],
    [5, 2.99],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * (PANEL.w + 0.02) + 0.15;
      frames.setMatrixAt(k, m.makeTranslation(x, standoff, u));
      cells.setMatrixAt(k, m.makeTranslation(x, standoff + PANEL.t / 2 + 0.002, u));
      k++;
    }
  }
  pv.add(frames, cells);
  for (const u of [0.75, 1.75, 2.5, 3.5])
    pv.add(mesh(new THREE.BoxGeometry(7.2, 0.04, 0.04), MAT.aluDark(), [0.15, 0.06, u]));

  // --- technical room: lean-to annex in cement render, mono-pitch slate roof ---------------
  const techroom = new THREE.Group();
  techroom.name = 'techroom';
  techroom.position.set(ANNEX.x0, CABIN_Y - 0.2, ANNEX.z0);
  const aw = ANNEX.x1 - ANNEX.x0;
  const ad = ANNEX.z1 - ANNEX.z0;
  const prof = new THREE.Shape();
  prof.moveTo(0, 0);
  prof.lineTo(aw + 0.05, 0);
  prof.lineTo(aw + 0.05, 2.95);
  prof.lineTo(0, 2.4);
  prof.closePath();
  const renderTex = renderTexture();
  renderTex.repeat.set(0.5, 0.5);
  const render = new THREE.MeshStandardMaterial({ map: renderTex, roughness: 0.95 });
  techroom.add(mesh(new THREE.ExtrudeGeometry(prof, { depth: ad, bevelEnabled: false }), render));
  const roofA = Math.atan2(0.55, aw);
  const roof = mesh(
    boxUV(new THREE.BoxGeometry(aw + 0.6, 0.08, ad + 0.5), 1.5),
    slate,
    [aw / 2 - 0.15, 2.72, ad / 2],
    [0, 0, roofA],
  );
  techroom.add(roof);
  const annexSnow = noShadow(
    mesh(new THREE.BoxGeometry(aw + 0.5, 0.06, ad + 0.4), snowMat, [aw / 2 - 0.15, 2.8, ad / 2], [0, 0, roofA]),
  );
  annexSnow.visible = false;
  annexSnow.userData.ownerPart = 'snow';
  techroom.add(annexSnow);
  const tb = new Batch();
  const doorPlanks = plankTexture('#5a4630');
  tb.box(
    new THREE.MeshStandardMaterial({ map: doorPlanks, roughness: 0.85 }),
    [0.92, 2.0, 0.06],
    [1.25, 1.2, ad + 0.03],
  );
  tb.box(woodDark, [1.08, 0.1, 0.1], [1.25, 2.25, ad + 0.04]);
  tb.box(MAT.steel(), [0.05, 0.05, 0.03], [1.62, 1.2, ad + 0.075]);
  tb.box(MAT.concrete(), [1.3, 0.16, 0.5], [1.25, 0.18, ad + 0.25]);
  tb.box(MAT.enclosureGrey(), [0.32, 0.22, 0.03], [2.5, 2.1, ad + 0.015]); // vent grille
  tb.flush(techroom);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffc27a, emissiveIntensity: 0 });
  techroom.add(noShadow(mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), lampMat, [1.25, 2.45, ad + 0.06])));
  const lamp = new THREE.PointLight(0xffb66e, 0, 14, 2);
  lamp.position.set(1.25, 2.35, ad + 0.5);
  techroom.add(lamp);

  // hotspots
  const hc = new THREE.Object3D();
  hc.position.set(CX + 1.5, RIDGE_Y + 1.4, CZ);
  cabin.add(hc);
  const hp = new THREE.Object3D();
  hp.position.set(0.15, 0.9, 2.1);
  pv.add(hp);
  const ht = new THREE.Object3D();
  ht.position.set(1.25, 3.3, ad + 0.4);
  techroom.add(ht);

  pv.updateMatrixWorld(true);
  const pvCentre = new THREE.Vector3(0.15, 0.4, 2.1).applyMatrix4(pv.matrixWorld);
  const pvPoints = [
    pvCentre,
    new THREE.Vector3(CABIN.x0 + 0.6, CABIN_Y + WALL_H + 0.15, CABIN.z1 + 0.5),
    new THREE.Vector3(CABIN.x0 + 0.1, CABIN_Y + WALL_H - 0.4, CABIN.z1 + 0.25),
    new THREE.Vector3(CABIN.x0 - 0.1, CABIN_Y + 3.0, ANNEX.z1 + 0.15),
    new THREE.Vector3(ANNEX.x0 + 1.25, CABIN_Y + 2.6, ANNEX.z1 + 0.2),
  ];

  return {
    cabin,
    pv,
    techroom,
    hotspots: { cabin: hc, pv: hp, techroom: ht },
    pvPoints,
    update(night, snowCabin, snowTech) {
      glassLit.emissiveIntensity = 2.4 * night;
      lampMat.emissiveIntensity = 3 * night;
      lamp.intensity = 6 * night;
      for (const s of roofSnow) s.visible = snowCabin;
      annexSnow.visible = snowTech;
    },
  };
}
