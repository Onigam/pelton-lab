import * as THREE from 'three';

// Site layout. World frame: X = east, Y = up, Z = south (so -Z is north).
// The turbine stands on the east bank at the origin; the stream comes from the north
// (upstream, s > 0), runs past the turbine and continues south (downstream, s < 0).

export const BOUNDS = { x0: -300, x1: 400, z0: -450, z1: 250 };

/**
 * Turbine anchor: ground pad height and orientation. rotY = -75 deg: local +Z (window, tailrace)
 * faces west-south-west toward the stream and the home camera; local +X (penstock arrival)
 * points south-south-east, so the pipe comes down the east bank from upstream.
 */
export const TURBINE = { x: 0, z: 0, padY: 0.55, rotY: (-75 * Math.PI) / 180 };

/** House footprint (main block) and tech-room annex on its west gable. */
export const CABIN = { x0: 25, x1: 33, z0: 9, z1: 15 };
export const ANNEX = { x0: 21.8, x1: 25, z0: 9.6, z1: 13.8 };

/** Dry-stone wall behind the turbine (retains the meadow terrace). */
export const WALL = { x0: 2.3, x1: 2.9, z0: -6.5, z1: 5.5 };

/** Stream centreline control points, from far downstream (south) to far upstream (north-east). */
const CTRL: [number, number][] = [
  [-118, 420],
  [-95, 330],
  [-62, 240],
  [-38, 160],
  [-20, 85],
  [-11, 35],
  [-4.5, 0],
  [-4.8, -28],
  [-1.5, -58],
  [-9, -96],
  [-5, -140],
  [9, -184],
  [22, -228],
  [46, -268],
  [80, -302],
  [116, -333],
  [152, -362],
  [190, -388],
  [232, -412],
  [278, -438],
  [330, -466],
  [390, -500],
  [450, -535],
];
const P0 = new THREE.Vector2(-4.5, 0); // stream point level with the turbine: s = 0, elevation 0

/** Bed elevation (m) vs distance along the stream from the turbine (m, + upstream). */
const PROFILE: [number, number][] = [
  [-460, -25],
  [-150, -8.2],
  [-40, -2],
  [0, 0],
  [55, 21],
  [150, 42],
  [250, 60],
  [350, 76],
  [450, 90],
  [520, 100],
  [700, 124],
  [900, 150],
];

// ---- dense samples of the centreline (1 m) ----------------------------------------------
const curve = new THREE.CatmullRomCurve3(
  CTRL.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'centripetal',
);
curve.arcLengthDivisions = 4000;
const LENGTH = curve.getLength();
const N = Math.ceil(LENGTH);
const SX = new Float32Array(N + 1);
const SZ = new Float32Array(N + 1);
const TX = new Float32Array(N + 1);
const TZ = new Float32Array(N + 1);
let i0 = 0;
{
  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  let best = Infinity;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t);
    SX[i] = p.x;
    SZ[i] = p.z;
    const l = Math.hypot(t.x, t.z) || 1;
    TX[i] = t.x / l;
    TZ[i] = t.z / l;
    const d = (p.x - P0.x) ** 2 + (p.z - P0.y) ** 2;
    if (d < best) {
      best = d;
      i0 = i;
    }
  }
}
const STEP = LENGTH / N;
/** Arc position of sample i, relative to the turbine (+ upstream). */
const sOf = (i: number) => (i - i0) * STEP;
export const S_MIN = sOf(0);
export const S_MAX = sOf(N);

export interface StreamHit {
  /** Distance along the stream (+ upstream). */
  s: number;
  /** Signed distance to the centreline, + = east bank (the turbine side). */
  d: number;
  cx: number;
  cz: number;
  /** Unit tangent pointing upstream. */
  tx: number;
  tz: number;
}

const HIT: StreamHit = { s: 0, d: 0, cx: 0, cz: 0, tx: 0, tz: -1 };

/** Nearest point on the stream centreline (coarse scan, then exact segment projection). */
export function nearestStream(x: number, z: number, out: StreamHit = HIT): StreamHit {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i <= N; i += 8) {
    const dx = SX[i] - x;
    const dz = SZ[i] - z;
    const q = dx * dx + dz * dz;
    if (q < bd) {
      bd = q;
      best = i;
    }
  }
  const a = Math.max(0, best - 10);
  const b = Math.min(N - 1, best + 10);
  bd = Infinity;
  let bi = a;
  let bt = 0;
  for (let i = a; i <= b; i++) {
    const ex = SX[i + 1] - SX[i];
    const ez = SZ[i + 1] - SZ[i];
    const len2 = ex * ex + ez * ez || 1e-9;
    let t = ((x - SX[i]) * ex + (z - SZ[i]) * ez) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = SX[i] + ex * t - x;
    const pz = SZ[i] + ez * t - z;
    const q = px * px + pz * pz;
    if (q < bd) {
      bd = q;
      bi = i;
      bt = t;
    }
  }
  const cx = SX[bi] + (SX[bi + 1] - SX[bi]) * bt;
  const cz = SZ[bi] + (SZ[bi + 1] - SZ[bi]) * bt;
  const tx = TX[bi] + (TX[bi + 1] - TX[bi]) * bt;
  const tz = TZ[bi] + (TZ[bi + 1] - TZ[bi]) * bt;
  const tl = Math.hypot(tx, tz) || 1;
  out.cx = cx;
  out.cz = cz;
  out.tx = tx / tl;
  out.tz = tz / tl;
  out.s = sOf(bi + bt);
  const side = out.tx * (z - cz) - out.tz * (x - cx);
  out.d = Math.sign(side || 1) * Math.sqrt(bd);
  return out;
}

export interface StreamFrame {
  x: number;
  z: number;
  /** Unit tangent pointing upstream. */
  tx: number;
  tz: number;
}

/** Centreline point and tangent at arc position s. */
export function streamFrame(s: number, out: StreamFrame = { x: 0, z: 0, tx: 0, tz: -1 }): StreamFrame {
  const f = Math.min(N - 1e-6, Math.max(0, s / STEP + i0));
  const i = Math.floor(f);
  const t = f - i;
  out.x = SX[i] + (SX[i + 1] - SX[i]) * t;
  out.z = SZ[i] + (SZ[i + 1] - SZ[i]) * t;
  const tx = TX[i] + (TX[i + 1] - TX[i]) * t;
  const tz = TZ[i] + (TZ[i + 1] - TZ[i]) * t;
  const l = Math.hypot(tx, tz) || 1;
  out.tx = tx / l;
  out.tz = tz / l;
  return out;
}

// ---- bed elevation: monotone cubic (Fritsch-Carlson) through PROFILE -----------------------
const PX = PROFILE.map((p) => p[0]);
const PY = PROFILE.map((p) => p[1]);
const PM: number[] = (() => {
  const n = PX.length;
  const dl: number[] = [];
  for (let i = 0; i < n - 1; i++) dl.push((PY[i + 1] - PY[i]) / (PX[i + 1] - PX[i]));
  const m: number[] = new Array(n).fill(0);
  m[0] = dl[0];
  m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (dl[i - 1] * dl[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * (PX[i + 1] - PX[i]) + (PX[i] - PX[i - 1]);
      const w2 = PX[i + 1] - PX[i] + 2 * (PX[i] - PX[i - 1]);
      m[i] = (w1 + w2) / (w1 / dl[i - 1] + w2 / dl[i]);
    }
  }
  return m;
})();

/** Stream bed elevation (m) at arc position s (turbine = 0). */
export function bedAt(s: number): number {
  const n = PX.length;
  if (s <= PX[0]) return PY[0] + PM[0] * (s - PX[0]);
  if (s >= PX[n - 1]) return PY[n - 1] + PM[n - 1] * (s - PX[n - 1]);
  let k = 0;
  while (s > PX[k + 1]) k++;
  const h = PX[k + 1] - PX[k];
  const t = (s - PX[k]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * PY[k] +
    (t3 - 2 * t2 + t) * h * PM[k] +
    (-2 * t3 + 3 * t2) * PY[k + 1] +
    (t3 - t2) * h * PM[k + 1]
  );
}

/** Upstream arc position where the bed reaches `elev` (inverse of bedAt for s >= 0). */
export function sAtElevation(elev: number): number {
  let lo = 0;
  let hi = S_MAX;
  if (elev <= 0) return 0;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (bedAt(mid) < elev) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

let BED: Float32Array | undefined;
/** bedAt() at every centreline sample (lazy: bedAt's tables are defined below). */
function bedSamples(): Float32Array {
  if (!BED) {
    BED = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) BED[i] = bedAt(sOf(i));
  }
  return BED;
}

/**
 * Bed elevation "seen" from a point: exact near the stream, a distance-weighted blend of the
 * whole bed far from it. The nearest-point arc position jumps on the medial axis of a meander;
 * blending keeps the valley sides continuous (no cliffs where two reaches are equidistant).
 */
export function baseElevation(x: number, z: number, hit: StreamHit): number {
  const ad = Math.abs(hit.d);
  const exact = bedAt(hit.s);
  if (ad < 12) return exact;
  const lambda = 6 + 0.25 * ad;
  let sw = 0;
  let sb = 0;
  for (let i = 0; i <= N; i += 8) {
    const dist = Math.hypot(SX[i] - x, SZ[i] - z);
    const w = Math.exp(-(dist - ad) / lambda);
    sw += w;
    sb += w * bedSamples()[i];
  }
  const t = Math.min(1, (ad - 12) / 40);
  const k = t * t * (3 - 2 * t);
  return exact + (sb / sw - exact) * k;
}

/** Channel bottom sits this far below the nominal bed line (incised stream). */
export const CHANNEL_DEPTH = 0.35;

/** Home camera (3/4 view from the west bank: turbine window, lower penstock and house). */
export const HOME = { position: [-24, 14, 34] as const, target: [13, 1.5, 2] as const };
