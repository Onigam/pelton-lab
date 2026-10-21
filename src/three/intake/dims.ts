import * as THREE from 'three';
import { clamp, lerp } from '../util';

// Geometry of the Coanda intake diorama (metres, Y up, flow along +X, z = 0 on the
// screen centre line, +Z = near bank, towards the home camera). The hydraulic profile is a
// 2D curve in the X–Y plane extruded across the stream:
//   crest bar → acceleration plate (R 0.3 m) → wedge-wire screen (R 1 m, 28°→54°) → overflow lip.

export const DEG = Math.PI / 180;

/** Cut-out block of stream bed (rounded corners in plan). */
export const BLOCK = { x0: -1.2, x1: 1.2, z0: -0.8, z1: 0.8, corner: 0.16 };

/** Inner half width of the stainless body: the screen is 0.6 m wide. */
export const HALF_W = 0.3;
/** Stainless sheet thickness (slightly exaggerated so it reads at a distance). */
export const STEEL_T = 0.0025;

export const CREST = new THREE.Vector2(-0.3, 0.8);
export const R_PLATE = 0.3;
export const R_SCREEN = 1.0;
export const PHI_S = 28 * DEG; // plate → screen (tangent continuity)
export const PHI_E = 54 * DEG; // end of the screen
export const PHI_L = 60 * DEG; // end of the curved part of the overflow lip
export const LIP_LEN = 0.075; // straight drip lip after the arc

const PC = new THREE.Vector2(CREST.x, CREST.y - R_PLATE);
/** Centre of the screen arc (below the screen, upstream). */
export const SC = PC.clone().addScaledVector(new THREE.Vector2(Math.sin(PHI_S), Math.cos(PHI_S)), R_PLATE - R_SCREEN);

/** Developed length (s) of each profile section, measured from the crest. */
export const S_PLATE = R_PLATE * PHI_S;
export const S_SCREEN = S_PLATE + R_SCREEN * (PHI_E - PHI_S);
export const S_LIPARC = S_SCREEN + R_SCREEN * (PHI_L - PHI_E);
export const S_END = S_LIPARC + LIP_LEN;
export const SCREEN_LEN = S_SCREEN - S_PLATE;

/** Wedge-wire: 2.2 mm flat top, 3.6 mm deep V, 1 mm slot, tilted 5° (upstream edge up). */
export const BAR = { top: 0.0022, depth: 0.0036, slot: 0.001, tilt: 5 * DEG };
export const BAR_PITCH = BAR.top + BAR.slot;
export const BAR_COUNT = Math.floor(SCREEN_LEN / BAR_PITCH);
/** Support rods under the wedge wires, running along the flow. */
export const ROD_R = 0.004;
export const ROD_Z = [-0.2, 0, 0.2];

export interface ProfilePoint {
  p: THREE.Vector2;
  /** Unit tangent, downstream. */
  t: THREE.Vector2;
  /** Unit normal, out of the water side (up). */
  n: THREE.Vector2;
  phi: number;
}

/** Point of the hydraulic profile at developed length `s` (s < 0: flat approach over the crest). */
export function profile(s: number): ProfilePoint {
  let phi = 0;
  const p = new THREE.Vector2();
  if (s <= 0) {
    p.set(CREST.x + s, CREST.y);
  } else if (s <= S_PLATE) {
    phi = s / R_PLATE;
    p.set(PC.x + R_PLATE * Math.sin(phi), PC.y + R_PLATE * Math.cos(phi));
  } else if (s <= S_LIPARC) {
    phi = PHI_S + (s - S_PLATE) / R_SCREEN;
    p.set(SC.x + R_SCREEN * Math.sin(phi), SC.y + R_SCREEN * Math.cos(phi));
  } else {
    phi = PHI_L;
    const d = s - S_LIPARC;
    p.set(
      SC.x + R_SCREEN * Math.sin(PHI_L) + Math.cos(PHI_L) * d,
      SC.y + R_SCREEN * Math.cos(PHI_L) - Math.sin(PHI_L) * d,
    );
  }
  return {
    p,
    t: new THREE.Vector2(Math.cos(phi), -Math.sin(phi)),
    n: new THREE.Vector2(Math.sin(phi), Math.cos(phi)),
    phi,
  };
}

/** Profile point offset along its normal (positive = above the wetted surface). */
export function profileAt(s: number, off = 0): THREE.Vector2 {
  const q = profile(s);
  return q.p.addScaledVector(q.n, off);
}

/** Screen parameter k (0 = top edge, 1 = bottom edge) → developed length. */
export const sOfK = (k: number) => S_PLATE + k * SCREEN_LEN;

/** Height of the wetted surface above `x` (the profile is monotonic in x). */
export function profileY(x: number): number {
  if (x <= CREST.x) return CREST.y;
  let a = 0;
  let b = S_END;
  for (let i = 0; i < 28; i++) {
    const m = (a + b) / 2;
    if (profile(m).p.x < x) a = m;
    else b = m;
  }
  return profile((a + b) / 2).p.y;
}

// ---- collection box, outlet, sand trap ---------------------------------------------------

/** Stainless collection box under the screen (inner faces). The sand trap is a deeper
 *  hopper across the full width at the downstream end, under the outlet strainer. */
export const BOX = {
  x0: -0.2,
  x1: 0.205,
  floor: 0.3,
  trapX: 0.07,
  trapBottom: 0.23,
  levelMin: 0.305,
  levelMax: 0.425,
};

/** Outlet: bulkhead through the far side wall (z = -HALF_W), axis along -Z. */
export const OUTLET = new THREE.Vector3(0.15, 0.345, -HALF_W);
/** Purge drain at the bottom of the sand trap, through the near side wall, axis along +Z. */
export const DRAIN = new THREE.Vector3(0.14, 0.256, HALF_W);

/** Wooden frame: side boards against the stainless cheeks, 4 corner posts. */
export const FRAME = { zIn: 0.304, zOut: 0.339, post: 0.05, x0: -0.42, x1: 0.1, bottom: 0.22, above: 0.08 };

/** Downstream stream-bed level. */
export const BED_Y = 0.19;

export const boxLevelY = (level: number) => lerp(BOX.levelMin, BOX.levelMax, clamp(level, 0, 1));
/** Pond surface: just over the crest, a little lower when the intake buffer runs down. */
export const pondY = (level: number) => CREST.y + 0.004 + 0.014 * clamp(level, 0, 1);

// ---- penstock -------------------------------------------------------------------------------

export const PIPE_R = 0.0315; // HDPE Ø63
/** HDPE centre line from inside the compression coupling to the block edge (always falling). */
export const PIPE_PTS = [
  new THREE.Vector3(OUTLET.x, OUTLET.y, -0.45),
  new THREE.Vector3(OUTLET.x, OUTLET.y - 0.002, -0.565),
  new THREE.Vector3(0.31, 0.339, -0.615),
  new THREE.Vector3(0.72, 0.318, -0.615),
  new THREE.Vector3(1.0, 0.305, -0.59),
  new THREE.Vector3(BLOCK.x1, 0.297, -0.575),
];
/** Air vent (reniflard) tee on the straight run of the penstock. */
export const VENT = new THREE.Vector3(0.5, 0.3297, -0.615);
export const VENT_TOP = 1.02;

// ---- terrain --------------------------------------------------------------------------------

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
const mixS = (a: number, b: number, x0: number, x1: number, x: number) => a + (b - a) * smoothstep(x0, x1, x);

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 2D value noise in [-1, 1]. */
export function vnoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

export const channelZ = (x: number) => mixS(-0.06 + 0.05 * Math.sin(x * 4 + 1), 0.02, -0.9, -0.5, x);

export function channelHalfW(x: number): number {
  let w = mixS(0.2, 0.47, -1.1, -0.86, x); // inflow → pond
  w = mixS(w, 0.43, -0.42, -0.2, x); // weir → wide plunge reach beside the box
  return mixS(w, 0.33, 0.45, 0.85, x);
}

export function bedY(x: number): number {
  let y = mixS(0.75, 0.585, -1.2, -0.92, x); // inflow channel → pond bottom
  y = mixS(y, BED_Y, -0.4, -0.25, x); // step under the weir sill
  y -= 0.035 * smoothstep(-0.25, 1.2, x);
  return y - 0.03 * Math.exp(-(((x - 0.4) / 0.13) ** 2)); // plunge pool under the overflow
}

/** Pipe bedding: height of the HDPE centre line at the nearest point in plan, and distance. */
function pipeNear(x: number, z: number): { y: number; d: number } {
  let best = { y: 0, d: Infinity };
  for (let i = 0; i < PIPE_PTS.length - 1; i++) {
    const a = PIPE_PTS[i];
    const b = PIPE_PTS[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const t = clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1);
    const d = Math.hypot(a.x + abx * t - x, a.z + abz * t - z);
    if (d < best.d) best = { y: lerp(a.y, b.y, t), d };
  }
  return best;
}

/** Height of the block's top surface. */
export function terrainH(x: number, z: number): number {
  const dz = z - channelZ(x);
  const hw = channelHalfW(x);
  const bed = bedY(x);
  // banks: high upstream (they hold the pond), a low gravel shelf on the far side downstream
  // where the penstock lies, a low grassy bank on the near side (keeps the intake in view)
  const near = mixS(0.95, 0.37, -0.42, 0.04, x) - 0.04 * smoothstep(0.1, 1.2, x);
  const far = mixS(0.95, 0.305 - 0.04 * smoothstep(0.1, 1.2, x), -0.36, -0.08, x);
  const bank = dz > 0 ? near : far;
  const ramp = smoothstep(hw, hw + 0.2, Math.abs(dz));
  let h = bed + (bank - bed) * ramp;
  h += (0.006 + 0.02 * ramp) * vnoise(x * 9, z * 9) + 0.004 * vnoise(x * 31 + 7, z * 31);
  if (x > 0.05) {
    const p = pipeNear(x, z);
    if (p.d < 0.12) h = Math.min(h, p.y - PIPE_R - 0.004 + Math.max(0, p.d - 0.03) * 0.9);
  }
  return h;
}
