import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '@onigam/lab-kit/three';
import { clamp } from '@onigam/lab-kit/three';
import { noShadow } from './common';
import {
  BLOCK,
  BOX,
  bedY,
  boxLevelY,
  channelHalfW,
  channelZ,
  CREST,
  HALF_W,
  pondY,
  profile,
  profileAt,
  S_END,
  S_PLATE,
  S_SCREEN,
  SCREEN_LEN,
  smoothstep,
  terrainH,
} from './dims';
import { flowMaterial, ribbon, type FlowUniforms, type RibbonPoint } from './watermat';

// Water surfaces of the intake: incoming stream and pond, the sheet over the crest, plate and
// screen (thinning as the wires shear it), the overflow nappe off the lip with its splash and
// the stream below, the water in the collection box and in the sand trap.

const Z = new THREE.Vector3(0, 0, 1);
const g = 9.81;

/** Real flow velocities (m/s) used to scroll each surface. */
const SPEED = { pond: 0.04, inflow: 0.35, sheet: 1.6, nappe: 1.9, down: 0.45, box: 0.05 };

interface Surface {
  mesh: THREE.Mesh;
  u: FlowUniforms;
  speed: number;
}

/** Plunge-pool water level under the overflow. */
export const LAND_Y = bedY(0.4) + 0.02;

/** Overflow trajectory: drip edge, then a free-falling nappe down to the plunge pool. */
export function nappePoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let s = S_SCREEN - 0.01; s < S_END; s += 0.012) {
    const p = profileAt(s, 0.004);
    pts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  const end = profile(S_END);
  const p0 = end.p.clone().addScaledVector(end.n, 0.004);
  const v0 = end.t.clone().multiplyScalar(1.3);
  for (let t = 0; t < 0.4; t += 0.012) {
    const x = p0.x + v0.x * t;
    const y = p0.y + v0.y * t - 0.5 * g * t * t;
    pts.push(new THREE.Vector3(x, y, 0));
    if (y < LAND_Y) break;
  }
  return pts;
}

/** Cross-section of the water where the block is cut (x = const). */
function cutFace(x: number, zc: number, hw: number, yTop: number, mat: THREE.Material): THREE.Mesh {
  const n = 24;
  const pos: number[] = [];
  const aV: number[] = [];
  for (let i = 0; i <= n; i++) {
    const z = zc - hw + (2 * hw * i) / n;
    const bottom = Math.min(yTop, terrainH(x, z));
    pos.push(x, yTop, z, x, bottom, z);
    aV.push((i / n) * 2 - 1, (i / n) * 2 - 1);
  }
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aU', new THREE.Float32BufferAttribute(new Float32Array((n + 1) * 2), 1));
  geo.setAttribute('aV', new THREE.Float32BufferAttribute(aV, 1));
  geo.setAttribute('aK', new THREE.Float32BufferAttribute(new Float32Array((n + 1) * 2), 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

export class IntakeWater {
  readonly group = new THREE.Group();
  private surfaces: Surface[] = [];
  private pond!: Surface;
  private inflow!: Surface;
  private sheet!: Surface;
  private nappe!: Surface;
  private splash!: Surface;
  private down!: Surface;
  private boxTop!: Surface;
  private inflowCut!: THREE.Mesh;
  private downCut!: THREE.Mesh;
  private boxBody: THREE.Mesh;
  private trapBody: THREE.Mesh;
  /** Materials cut in half with the box in cutaway mode. */
  readonly boxMats: THREE.Material[] = [];
  /** Sheet over the screen, overflow nappe and splash: cut with the stainless unit. */
  readonly sheetMats: THREE.Material[] = [];

  constructor() {
    this.group.name = 'intake-water';
    this.buildStream();
    this.buildScreenSheet();
    this.buildOverflow();
    const body = new THREE.MeshStandardMaterial({
      color: 0x4f86a3,
      transparent: true,
      opacity: 0.42,
      roughness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const boxGeo = new THREE.BoxGeometry(BOX.x1 - BOX.x0 - 0.002, 1, 2 * HALF_W - 0.002);
    boxGeo.translate((BOX.x0 + BOX.x1) / 2, 0.5, 0);
    this.boxBody = new THREE.Mesh(boxGeo, body);
    this.boxBody.position.y = BOX.floor;
    const trapGeo = new THREE.BoxGeometry(
      BOX.x1 - BOX.trapX - 0.05,
      BOX.floor - BOX.trapBottom - 0.018,
      2 * HALF_W - 0.002,
    );
    this.trapBody = new THREE.Mesh(trapGeo, body);
    this.trapBody.position.set((BOX.trapX + 0.05 + BOX.x1) / 2, (BOX.floor + BOX.trapBottom + 0.018) / 2, 0);
    this.trapBody.renderOrder = 1;
    this.boxBody.renderOrder = 1;
    // rippled free surface in the box, hit by the falling threads
    const pts: RibbonPoint[] = [];
    for (let x = BOX.x0 + 0.002; x <= BOX.x1; x += 0.02)
      pts.push({ p: new THREE.Vector3(x, 0, 0), side: Z, halfWidth: HALF_W - 0.002 });
    this.boxTop = this.add(ribbon(pts, 14), { color: 0x6c9fb8, foam: 0.75, alphaMin: 0.5, scale: 2 }, SPEED.box);
    this.group.add(this.boxBody, this.trapBody);
    this.boxMats.push(body, this.boxTop.mesh.material as THREE.Material);
    for (const f of [this.sheet, this.nappe, this.splash]) this.sheetMats.push(f.mesh.material as THREE.Material);
    noShadow(this.group);
  }

  private add(geo: THREE.BufferGeometry, opts: Parameters<typeof flowMaterial>[0], speed: number): Surface {
    const { material, uniforms } = flowMaterial(opts);
    const mesh = new THREE.Mesh(geo, material);
    mesh.renderOrder = 2;
    this.group.add(mesh);
    const s = { mesh, u: uniforms, speed };
    this.surfaces.push(s);
    return s;
  }

  /** Incoming stream (cut at the upstream edge), pond, and the reach below the intake. */
  private buildStream(): void {
    // pond surface: geometry at y = 0, moved with the intake level
    const pond: RibbonPoint[] = [];
    for (let x = -1.0; x <= -0.374; x += 0.03) pond.push({ p: new THREE.Vector3(x, 0, 0), side: Z, halfWidth: 0.66 });
    this.pond = this.add(ribbon(pond, 16), { color: 0x5a6449, foam: 0.05, alphaMin: 0.84, scale: 0.6 }, SPEED.pond);

    const yIn = pondY(1) + 0.003;
    const inflow: RibbonPoint[] = [];
    for (let x = BLOCK.x0; x <= -0.84; x += 0.02) {
      const t = (x - BLOCK.x0) / (-0.84 - BLOCK.x0);
      inflow.push({
        p: new THREE.Vector3(x, THREE.MathUtils.lerp(0.838, yIn, smoothstep(0, 1, t)), channelZ(x)),
        side: Z,
        halfWidth: THREE.MathUtils.lerp(0.165, 0.3, t * t),
      });
    }
    this.inflow = this.add(ribbon(inflow, 7), { color: 0x6b7a5c, foam: 0.35, alphaMin: 0.7 }, SPEED.inflow);
    this.inflowCut = cutFace(
      BLOCK.x0 + 0.0005,
      channelZ(BLOCK.x0),
      0.165,
      0.838,
      this.inflow.mesh.material as THREE.Material,
    );
    this.group.add(this.inflowCut);

    // below the overflow: plunge pool water, splash, and the stream leaving the block
    const down: RibbonPoint[] = [];
    for (let x = 0.3; x <= BLOCK.x1; x += 0.03) {
      const xx = Math.min(x, BLOCK.x1);
      down.push({
        p: new THREE.Vector3(xx, Math.max(bedY(xx) + 0.02, xx < 0.55 ? LAND_Y : 0), channelZ(xx)),
        side: Z,
        halfWidth: Math.min(0.3, channelHalfW(xx) - 0.04),
      });
    }
    this.down = this.add(ribbon(down, 9), { color: 0x6f8580, foam: 0.4, alphaMin: 0.6 }, SPEED.down);
    const xe = BLOCK.x1 - 0.0005;
    this.downCut = cutFace(xe, channelZ(xe), 0.22, bedY(xe) + 0.02, this.down.mesh.material as THREE.Material);
    this.group.add(this.downCut);
  }

  /** Sheet from the pond over the crest bar, down the plate and the screen. */
  private buildScreenSheet(): void {
    const pts: RibbonPoint[] = [];
    const head = pondY(1) - CREST.y;
    for (let s = -0.09; s <= S_SCREEN + 1e-6; s += 0.006) {
      // draw-down over the crest, then a thin accelerating layer on the plate
      const off =
        s < 0
          ? THREE.MathUtils.lerp(head, 0.01, (s + 0.09) / 0.09)
          : s < S_PLATE
            ? THREE.MathUtils.lerp(0.01, 0.003, s / S_PLATE)
            : 0.0016;
      const p = profileAt(s, off);
      pts.push({
        p: new THREE.Vector3(p.x, p.y, 0),
        side: Z,
        halfWidth: HALF_W - 0.003,
        k: (s - S_PLATE) / SCREEN_LEN,
      });
    }
    this.sheet = this.add(
      ribbon(pts, 9),
      { color: 0xa8d4e6, foam: 0.2, alphaMin: 0.16, sheet: true, scale: 1 },
      SPEED.sheet,
    );
  }

  private buildOverflow(): void {
    const pts = nappePoints().map((p, i, a) => ({
      p,
      side: Z,
      halfWidth: HALF_W - 0.003 - 0.02 * (i / a.length),
      k: 2,
    }));
    this.nappe = this.add(ribbon(pts, 9), { color: 0xa8d0de, foam: 0.25, alphaMin: 0.2 }, SPEED.nappe);
    const land = pts[pts.length - 1].p;
    const splash: RibbonPoint[] = [];
    for (let x = land.x - 0.05; x <= land.x + 0.16; x += 0.02)
      splash.push({ p: new THREE.Vector3(x, LAND_Y + 0.004, 0.0), side: Z, halfWidth: HALF_W + 0.02 });
    this.splash = this.add(
      ribbon(splash, 11),
      { color: 0xdfeef3, foam: 1.6, alphaMin: 0.0, scale: 2.5 },
      SPEED.down * 2,
    );
  }

  update(s: SimState, dt: number, view: ViewOpts): void {
    const vdt = dt * view.slowMo;
    for (const f of this.surfaces) f.u.uPhase.value += f.speed * vdt;
    const level = clamp(s.intakeLevel, 0, 1);
    const qIn = s.qCaptured + s.qOverflow;
    const on = (q: number, a = 0.02, b = 0.8) => smoothstep(a, b, q);

    this.pond.mesh.position.y = pondY(level);
    this.inflow.u.uOpacity.value = 0.25 + 0.75 * on(s.qStream);
    this.inflow.u.uFoam.value = 0.15 + 0.4 * on(s.qStream, 0.5, 8);
    this.inflowCut.visible = s.qStream > 0.02;

    // screen sheet: capture spread over [0, kEnd]; with no overflow the sheet stops early
    const cap = 12 * Math.pow(1 - clamp(s.screenClog, 0, 1), 1.5);
    const kEnd = s.qOverflow > 0.03 ? 1 : clamp(s.qCaptured / Math.max(cap, 0.1), 0.06, 1);
    const u = this.sheet.u;
    u.uQIn.value = qIn;
    u.uQCap.value = s.qCaptured;
    u.uKEnd.value = kEnd;
    u.uOpacity.value = on(qIn, 0.01, 0.4);
    u.uFoam.value = 0.1 + 0.5 * clamp(s.screenClog, 0, 1);

    const over = on(s.qOverflow, 0.01, 2.5);
    this.nappe.u.uOpacity.value = 0.85 * over;
    this.nappe.u.uFoam.value = 0.1 + 0.4 * on(s.qOverflow, 0.5, 8);
    this.nappe.mesh.visible = over > 0.01;
    this.splash.u.uOpacity.value = 0.6 * over;
    this.splash.mesh.visible = over > 0.01;
    this.down.u.uOpacity.value = 0.35 + 0.6 * over;
    this.down.mesh.scale.z = 0.55 + 0.45 * over;
    this.downCut.scale.z = this.down.mesh.scale.z;
    this.downCut.visible = over > 0.05;

    // collection box: level follows the intake buffer
    const y = boxLevelY(level);
    this.boxBody.scale.y = Math.max(0.001, y - BOX.floor);
    this.boxBody.visible = level > 0.005;
    this.boxTop.mesh.position.y = y;
    this.boxTop.mesh.visible = level > 0.005;
    this.boxTop.u.uOpacity.value = 0.9;
    this.boxTop.u.uFoam.value = 0.15 + 0.45 * on(s.qCaptured, 0.05, 4);
  }

  /** Box water level (world y) for the falling threads. */
  boxLevel(s: SimState): number {
    return s.intakeLevel > 0.005 ? boxLevelY(s.intakeLevel) : BOX.trapBottom + 0.02;
  }
}
