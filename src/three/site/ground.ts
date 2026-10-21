import { lerp } from '../util';
import { fbm, smooth, vnoise } from './common';
import {
  BOUNDS,
  CABIN,
  ANNEX,
  CHANNEL_DEPTH,
  TURBINE,
  WALL,
  baseElevation,
  bedAt,
  nearestStream,
  type StreamHit,
} from './layout';

// Analytic height field of the valley. The rendered mesh samples it; objects are placed on
// the rendered mesh (terrain.groundY) so nothing floats.

/** Meadow clearing on the east bank, around the turbine and the house. */
export function meadowMask(x: number, z: number): number {
  const r = Math.hypot((x - 24) / 40, (z - 12) / 38);
  return 1 - smooth(0.6, 1.15, r);
}

/** Wide, gentle hollow of the valley around the hamlet (lets the morning sun in). */
function hamletHollow(x: number, z: number): number {
  const r = Math.hypot((x - 30) / 80, (z - 5) / 90);
  return 1 - smooth(0.7, 2.6, r);
}

/** Gentle meadow surface: rises east (valley side) and north (upstream). */
export function meadowPlane(x: number, z: number): number {
  const east = Math.max(0, x - 34);
  return 2.0 + 0.07 * (x - 3) + 0.02 * east * east - 0.17 * Math.min(z, 12) - 0.06 * Math.max(0, z - 12);
}

/** Flat platform height of the house + annex. */
export const CABIN_Y = meadowPlane((CABIN.x0 + CABIN.x1) / 2, (CABIN.z0 + CABIN.z1) / 2);

/** Distance outside a rectangle (0 inside). */
function outside(x: number, z: number, x0: number, x1: number, z0: number, z1: number): number {
  const dx = Math.max(x0 - x, 0, x - x1);
  const dz = Math.max(z0 - z, 0, z - z1);
  return Math.hypot(dx, dz);
}

/** 1 inside the wall's north-south extent, fading out past its ends. */
export function wallZMask(z: number): number {
  return 1 - smooth(0, 1.5, Math.max(WALL.z0 - z, z - WALL.z1, 0));
}

/** Turbine pad weight (flat gravel platform on the bank). */
export function turbinePadWeight(x: number, z: number): number {
  return 1 - smooth(0, 2.5, outside(x, z, -2.8, 2.25, -3.2, 3.2));
}

/** House platform weight. */
export function cabinPadWeight(x: number, z: number): number {
  return 1 - smooth(0, 3, outside(x, z, ANNEX.x0 - 1, CABIN.x1 + 0.8, CABIN.z0 - 0.6, CABIN.z1 + 0.6));
}

const COS_T = Math.cos(TURBINE.rotY);
const SIN_T = Math.sin(TURBINE.rotY);

/** Tailrace ditch: from under the turbine along anchor-local +Z to the stream. Returns [weight, bottom y]. */
function tailraceCarve(x: number, z: number): [number, number] {
  const lx = (x - TURBINE.x) * COS_T - (z - TURBINE.z) * SIN_T;
  const lz = (x - TURBINE.x) * SIN_T + (z - TURBINE.z) * COS_T;
  if (lz < -0.9 || lz > 5.2 || Math.abs(lx) > 0.7) return [0, 0];
  const t = Math.min(1, Math.max(0, (lz + 0.3) / 4.3));
  const bottom = lerp(TURBINE.padY - 0.24, -0.22, t);
  const w = (1 - smooth(0.22, 0.6, Math.abs(lx))) * (1 - smooth(0.4, 0.9, -lz));
  return [w, bottom];
}

const H: StreamHit = { s: 0, d: 0, cx: 0, cz: 0, tx: 0, tz: -1 };

/** Natural V-shaped valley: incised channel, narrow floor, steep wooded sides. */
function valley(x: number, z: number, h: StreamHit): number {
  const ad = Math.abs(h.d);
  const bank = -CHANNEL_DEPTH + 0.7 * smooth(0.5, 2.2, ad);
  const floor = 0.05 * Math.max(0, ad - 2.2);
  const xs = Math.max(0, ad - 10);
  // east side (house) a bit gentler; uniform far away so the medial axis of meanders stays smooth
  const k = 0.975 - 0.125 * Math.sign(h.d) * (1 - smooth(60, 140, ad));
  const side = (88 * (1 - Math.exp(-xs / 150)) + 0.1 * xs) * smooth(0, 40, xs) * k * (1 - 0.4 * hamletHollow(x, z));
  const big = fbm(x * 0.0045 + 3.7, z * 0.0045 - 1.3, 3) * 30 * smooth(15, 120, ad);
  const mid = fbm(x * 0.03 + 7, z * 0.03, 3) * 3.2 * smooth(4, 30, ad);
  const fine = vnoise(x * 0.35, z * 0.35) * 0.08;
  return baseElevation(x, z, h) + bank + floor + side + big + mid + fine;
}

/** Terrain height (m) at world (x, z). */
export function heightAt(x: number, z: number): number {
  const h = nearestStream(x, z, H);
  let y = valley(x, z, h);
  const ad = Math.abs(h.d);
  const bed = bedAt(h.s);

  // meadow terrace on the east bank, never below the stream banks
  const wm = meadowMask(x, z) * smooth(2.5, 6, h.d);
  if (wm > 0) {
    const m = meadowPlane(x, z) + 0.3 * fbm(x * 0.06, z * 0.06, 2);
    y = lerp(y, Math.max(m, bed + 0.4 + 0.05 * ad), wm);
  }

  // turbine pad: cut into the bank west of the dry-stone wall (the wall hides the step)
  let wp = turbinePadWeight(x, z) * smooth(1.4, 2.4, h.d);
  if (x > WALL.x0) wp *= 1 - wallZMask(z) * smooth(WALL.x0, WALL.x0 + 0.35, x);
  if (wp > 0) y = lerp(y, TURBINE.padY, wp);

  const wc = cabinPadWeight(x, z);
  if (wc > 0) y = lerp(y, CABIN_Y, wc);

  const [wt, bottom] = tailraceCarve(x, z);
  if (wt > 0) y = Math.min(y, lerp(y, bottom, wt));
  return y;
}

/** Height including the distant mountains outside the map (backdrop, sun horizon). */
export function farHeight(x: number, z: number): number {
  const dOut = outside(x, z, BOUNDS.x0, BOUNDS.x1, BOUNDS.z0, BOUNDS.z1);
  const y = heightAt(x, z);
  if (dOut <= 0) return y;
  return y + smooth(40, 900, dOut) * (170 + 190 * fbm(x * 0.0018 + 11, z * 0.0018 - 5, 3));
}

/** Trodden path from the annex door down to the turbine (0..1 mask for colours). */
const PATH: [number, number][] = [
  [23.5, 14.6],
  [17, 11.5],
  [10, 8.6],
  [5, 7.2],
  [2.2, 4.6],
  [0.6, 3.3],
];
export function pathMask(x: number, z: number): number {
  let best = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i];
    const [bx, bz] = PATH[i + 1];
    const ex = bx - ax;
    const ez = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez)));
    best = Math.min(best, Math.hypot(ax + ex * t - x, az + ez * t - z));
  }
  return 1 - smooth(0.35, 0.9 + 0.3 * vnoise(x * 0.8, z * 0.8), best);
}
