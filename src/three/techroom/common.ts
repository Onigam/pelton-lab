import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { L } from '../../i18n';
import type { SimState } from '../../sim/types';
import { MAT, pmma } from '../materials';
import type { PartRegistry } from '../registry';
import type { ViewOpts } from '../types';
import { canvasTexture, mesh } from '../util';

// Shared building blocks of the technical room: palette, primitive helpers working on
// shared unit geometries, small hardware (glands, screws, LEDs, stickers) and `bake()`,
// which merges the static meshes of a device per material to keep draw calls low.

export type V3 = [number, number, number];

export type DeviceUpdate = (s: SimState, dt: number, v: ViewOpts, reg: PartRegistry) => void;

export interface Device {
  id: string;
  group: THREE.Group;
  /** Hotspot anchor (child of the group so the label follows the explode). */
  anchor: THREE.Object3D;
  explode: THREE.Vector3;
  label: L;
  update?: DeviceUpdate;
}

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/** One instance of every material shared by the devices of the room. */
export function createPalette() {
  return {
    victron: MAT.victronBlue(),
    victronDark: std({ color: 0x1e2226, roughness: 0.55, metalness: 0.2 }),
    plastic: MAT.printBlack(),
    charcoal: std({ color: 0x2a2d31, roughness: 0.42, metalness: 0.55 }),
    battBody: std({ color: 0x1a1b1e, roughness: 0.42, metalness: 0.45 }),
    enclosure: std({ color: 0xe6e7e3, roughness: 0.5 }),
    dinGrey: std({ color: 0xb9bdbf, roughness: 0.55 }),
    darkGrey: std({ color: 0x45494e, roughness: 0.6 }),
    smoked: new THREE.MeshPhysicalMaterial({
      color: 0x2e353b,
      roughness: 0.06,
      clearcoat: 1,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    clear: pmma(0.16),
    steel: MAT.steel(),
    zinc: MAT.zinc(),
    copper: MAT.copperBright(),
    brass: MAT.brass(),
    rubber: MAT.rubber(),
    cableRed: MAT.cableRed(),
    cableBlack: MAT.cableBlack(),
    cableGrey: std({ color: 0x8b9095, roughness: 0.5 }),
    cableYG: MAT.cableYellowGreen(),
    cableBlue: MAT.cableBlue(),
    orange: std({ color: 0xe5591f, roughness: 0.42 }),
    red: MAT.pvcRed(),
    yellow: MAT.warningYellow(),
    white: MAT.printWhite(),
    ceramic: std({ color: 0xf1ece2, roughness: 0.32 }),
    wood: std({ color: 0xa87b4c, roughness: 0.8 }),
    glandWhite: std({ color: 0xdcdcd6, roughness: 0.5 }),
    glandGrey: std({ color: 0x6f757b, roughness: 0.5 }),
    lightning: stickerMaterial(),
  };
}
export type Palette = ReturnType<typeof createPalette>;

// ---- shared unit geometries ---------------------------------------------------------
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL: Record<number, THREE.CylinderGeometry> = {};
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const RBOX_CACHE = new Map<string, THREE.BufferGeometry>();

function unitCyl(seg: number): THREE.CylinderGeometry {
  return (UNIT_CYL[seg] ??= new THREE.CylinderGeometry(1, 1, 1, seg));
}

/** Axis-aligned box from the shared unit geometry. */
export function box(parent: THREE.Object3D, mat: THREE.Material, size: V3, pos: V3): THREE.Mesh {
  const m = mesh(UNIT_BOX, mat, pos);
  m.scale.set(...size);
  parent.add(m);
  return m;
}

/** Rounded box (geometry cached per size). */
export function rbox(parent: THREE.Object3D, mat: THREE.Material, size: V3, pos: V3, radius = 0.008): THREE.Mesh {
  const key = `${size.join(',')}|${radius}`;
  let geo = RBOX_CACHE.get(key);
  if (!geo) {
    geo = new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(radius, Math.min(...size) / 2 - 1e-4));
    RBOX_CACHE.set(key, geo);
  }
  const m = mesh(geo, mat, pos);
  parent.add(m);
  return m;
}

/** Cylinder of radius r and length h along an axis. */
export function cyl(
  parent: THREE.Object3D,
  mat: THREE.Material,
  r: number,
  h: number,
  pos: V3,
  axis: 'x' | 'y' | 'z' = 'z',
  seg = 16,
): THREE.Mesh {
  const m = mesh(unitCyl(seg), mat, pos);
  m.scale.set(r, h, r);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  parent.add(m);
  return m;
}

/** Flat plane facing +z (labels, screens, stickers). No shadow casting. */
export function plane(parent: THREE.Object3D, mat: THREE.Material, w: number, h: number, pos: V3): THREE.Mesh {
  const m = mesh(UNIT_PLANE, mat, pos);
  m.scale.set(w, h, 1);
  m.castShadow = false;
  m.userData.noShadow = true;
  parent.add(m);
  return m;
}

/** Material showing a canvas drawing (static label). */
export function labelMaterial(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { transparent?: boolean; roughness?: number } = {},
): THREE.MeshStandardMaterial {
  const { texture } = canvasTexture(w, h, draw);
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: opts.roughness ?? 0.55,
    transparent: opts.transparent ?? false,
    alphaTest: opts.transparent ? 0.05 : 0,
  });
}

/** Font shorthand for canvas drawings. */
export function font(px: number, weight = 600, family = 'system-ui, -apple-system, "Segoe UI", sans-serif'): string {
  return `${weight} ${Math.round(px)}px ${family}`;
}
export const MONO = '"SF Mono", Menlo, Consolas, monospace';

/** Yellow triangle with a lightning bolt (electrical hazard sticker). */
function stickerMaterial(): THREE.MeshStandardMaterial {
  return labelMaterial(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w / 2, 8);
      ctx.lineTo(w - 6, h - 12);
      ctx.lineTo(6, h - 12);
      ctx.closePath();
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#141414';
      ctx.stroke();
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.moveTo(70, 38);
      ctx.lineTo(48, 78);
      ctx.lineTo(64, 78);
      ctx.lineTo(54, 104);
      ctx.lineTo(84, 66);
      ctx.lineTo(67, 66);
      ctx.lineTo(78, 38);
      ctx.closePath();
      ctx.fill();
    },
    { transparent: true },
  );
}

/** Hazard sticker of side `s` on a front face at z. */
export function sticker(parent: THREE.Object3D, pal: Palette, s: number, pos: V3): THREE.Mesh {
  return plane(parent, pal.lightning, s, s, pos);
}

/** Cable gland: hex nut + dome, pointing along `dir` from a face. */
export function gland(
  parent: THREE.Object3D,
  mat: THREE.Material,
  r: number,
  pos: V3,
  dir: 'x' | '-x' | 'y' | '-y',
): void {
  const g = new THREE.Group();
  g.position.set(...pos);
  if (dir === '-y') g.rotation.z = Math.PI;
  if (dir === 'x') g.rotation.z = -Math.PI / 2;
  if (dir === '-x') g.rotation.z = Math.PI / 2;
  cyl(g, mat, r * 1.25, r * 0.5, [0, r * 0.25, 0], 'y', 6);
  cyl(g, mat, r, r * 0.7, [0, r * 0.85, 0], 'y', 12);
  cyl(g, mat, r * 0.7, r * 0.3, [0, r * 1.35, 0], 'y', 12);
  parent.add(g);
}

/** Small screw heads at the given (x, y) positions on a face at z. */
export function screws(
  parent: THREE.Object3D,
  mat: THREE.Material,
  r: number,
  z: number,
  xy: [number, number][],
): void {
  for (const [x, y] of xy) cyl(parent, mat, r, 0.002, [x, y, z + 0.001], 'z', 8);
}

// ---- LEDs ---------------------------------------------------------------------------
/** LED lens: dark when off, `emissiveIntensity` drives the light. */
export function ledMaterial(color: THREE.ColorRepresentation): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1d201e,
    emissive: color,
    emissiveIntensity: 0,
    roughness: 0.25,
  });
}

export function led(parent: THREE.Object3D, mat: THREE.Material, r: number, pos: V3): THREE.Mesh {
  const m = cyl(parent, mat, r, 0.003, pos, 'z', 10);
  m.castShadow = false;
  return m;
}

/** Set an LED on/off (or a 0..1 level). */
export function setLed(mat: THREE.MeshStandardMaterial, level: number | boolean, max = 2.6): void {
  const v = typeof level === 'boolean' ? (level ? 1 : 0) : level;
  mat.emissiveIntensity = v * max;
}

/** Square-wave blink in real time. */
export const blink = (t: number, hz: number, duty = 0.5) => (t * hz) % 1 < duty;

/** Returns true at most every `period` seconds (throttles canvas redraws). */
export function throttle(period: number): (t: number) => boolean {
  let last = -Infinity;
  return (t) => {
    if (t - last < period && t >= last) return false;
    last = t;
    return true;
  };
}

/** Hide/show helper meshes that must also respect the part display mode. */
export function partVisible(reg: PartRegistry, id: string): boolean {
  const p = reg.get(id);
  return !p || p.display !== 'hidden';
}

/** Hotspot anchor object. */
export function anchor(parent: THREE.Object3D, pos: V3): THREE.Object3D {
  const a = new THREE.Object3D();
  a.name = 'hotspot-anchor';
  a.position.set(...pos);
  parent.add(a);
  return a;
}

// ---- static mesh merging -------------------------------------------------------------
/**
 * Merge every static mesh below `root` that shares a material into one mesh.
 * Meshes (or subtrees) flagged `userData.keep` are left alone (animated parts, LEDs
 * whose material is toggled and must stay pickable separately are fine either way).
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
      const g = m.geometry.clone().applyMatrix4(tmp);
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      }
      if (!g.attributes.uv) {
        g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      }
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
    const indexed = b.geos.every((g) => g.index);
    const geos = indexed ? b.geos : b.geos.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) continue;
    const out = mesh(merged, b.mat);
    out.castShadow = b.cast;
    if (!b.cast) out.userData.noShadow = true;
    root.add(out);
  }
}

/** Planar UVs in metres / `tile` (walls, boards): projection chosen per face normal. */
export function planarUv(geo: THREE.BufferGeometry, tile: number, offset: [number, number] = [0, 0]): void {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    let u: number;
    let v: number;
    if (nz >= nx && nz >= ny) [u, v] = [pos.getX(i), pos.getY(i)];
    else if (nx >= ny) [u, v] = [pos.getZ(i), pos.getY(i)];
    else [u, v] = [pos.getX(i), pos.getZ(i)];
    uv[i * 2] = u / tile + offset[0];
    uv[i * 2 + 1] = v / tile + offset[1];
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/** Repeat-wrapped canvas texture (for planar UVs). */
export function tiledTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const { texture } = canvasTexture(size, size, draw);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
