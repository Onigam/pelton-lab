import { tr } from '../../i18n';
import { bucketEfficiency } from '../../sim/physics';
import { bucketSpecFor } from '../../three/turbine/bucket';
import { D, profile, R_TIP } from '../../three/turbine/dims';
import { Z_BELL, Z_STATOR } from '../../three/turbine/generator';
import { BEAMS_X, DEFLECTOR, DRAIN, SKID, VENT } from '../../three/turbine/housing';
import { RISER_TOP, TOP_INLET_Y } from '../../three/turbine/hydraulics';
import { COLORS, W, type Drawing, type Pt, type Stroke, type Text, type View } from '../svg';

// Turbine geometry for the mechanical sheets PL-T01..T04, read from the 3D model modules
// (src/three/turbine) and converted to millimetres, plus the few drawing helpers they share.
// Values the model only holds as inline literals (bearing seats, valve positions, deflector
// blades) are copied here once, next to the name of the file they come from.

/** Metres → millimetres, rounded to 0.1 mm. */
export const mm = (m: number): number => Math.round(m * 1e4) / 10;
const pt = (x: number, y: number): Pt => [mm(x), mm(y)];

/** dims.ts `D` in millimetres (counts stay counts). */
export const M = Object.fromEntries(
  Object.entries(D).map(([k, v]) => [k, k === 'buckets' || k === 'maxNozzle' ? v : mm(v)]),
) as typeof D;

export const R_TIP_MM = mm(R_TIP);
export const PROFILE: Pt[] = profile().map((p) => pt(p.x, p.y));
/** Housing profile moved inwards by d mm (dims.ts profile()). */
export const insetProfile = (d: number, bottom = false): Pt[] => profile(d / 1000, bottom).map((p) => pt(p.x, p.y));

export const BASE = { x0: M.x0 - 20, x1: M.x1 + 20, z0: M.zBack - 20, z1: M.zFront + 20 }; // housing.ts buildBase
export const DRAIN_MM = { x0: mm(DRAIN.x0), x1: mm(DRAIN.x1), z0: mm(DRAIN.z0), z1: mm(DRAIN.z1) };
export const BEAMS = BEAMS_X.map(mm);
/** Rear-panel vents: round Ø and rectangular w × h. */
export const VENTS = { d: 2 * mm(VENT.r), w: mm(VENT.rect[2] - VENT.rect[0]), h: mm(VENT.rect[3] - VENT.rect[1]) };
/** Partition / window outline (profile inset by the cover sheet): width × height. */
export const PLATE = { w: M.W - 2 * M.sheet, h: M.roof - M.sheet - M.baseT };
export const SKID_MM = { xs: SKID.xs.map(mm), zs: SKID.zs.map(mm), top: M.baseY - 30 };
/** Centre of the housing along X (the shaft is offset towards the tall wall). */
export const CX = (M.x0 + M.x1) / 2;

// ---- shaft line (drivetrain.ts buildBearings, generator.ts, runner.ts)
const zPartDry = M.zPart - M.partT / 2;
export const SHAFT = {
  z0: M.shaftBack,
  z1: M.shaftFront,
  len: M.shaftFront - M.shaftBack,
  partDry: zPartDry,
  partWet: M.zPart + M.partT / 2,
  /** Bearing centres: 1 (runner side), 2, 3 (rear panel). */
  b1: zPartDry - 12,
  b2: zPartDry - 105,
  b3: M.zBack + 15,
  seal: M.zPart + M.partT / 2 + 4.5,
  /** Rear panel (6 mm, inside the cover lip) and window (8 mm) faces. */
  rear: [M.zBack + M.sheet, M.zBack + M.sheet + 6] as [number, number],
  window: [M.zFront - M.sheet - 8, M.zFront - M.sheet] as [number, number],
};
export const STATOR = { z: Z_STATOR.map(mm) as [number, number], rBore: 34.2, rTip: 56.5 };
export const BELL = { z: Z_BELL.map(mm) as [number, number], r: 78, rIron: 61.5, rMag: [57.5, 61.4] };

// ---- runner (runner.ts, bucket.ts)
export const RUNNER = {
  ring: [M.boltR - 10, M.hubR + 2] as [number, number],
  ringZ: [M.hubT / 2 + 4, M.hubT / 2 + 9] as [number, number],
  bore: M.shaftR + 12,
  holes: { n: 4, r: 3.5, at: 25 },
  pockets: { n: 6, r: 7, at: 44 },
  cheek: [M.hubR - 27, M.hubR - 1] as [number, number],
  /** Steel flange carrying the taper bush (drawing-only part, not in the 3D model). */
  flangeR: 32,
};
export interface Spec {
  rc: number;
  a: number;
  b: number;
  depth: number;
  t: number;
}
export const spec = (set: 'S' | 'L'): Spec => {
  const s = bucketSpecFor(set, D.rPitch);
  return { rc: mm(s.rc), a: mm(s.a), b: mm(s.b), depth: mm(s.depth), t: mm(s.t) };
};
/** Outer radius of a bucket set (L = R_TIP). */
export const tipR = (s: Spec): number => s.rc + s.a;
/** Jet diameter a bucket set is matched to (best physics.ts bucketEfficiency). */
export const matchedJet = (set: 'S' | 'L'): number => {
  let best = 4;
  for (let d = 4; d <= 16; d++) if (bucketEfficiency(d, set) > bucketEfficiency(best, set)) best = d;
  return best;
};
/** Bucket outline seen along the shaft (radial × tangential, bucket.ts frame). */
export function silhouette(s: Spec, n = 28): Pt[] {
  const pts: Pt[] = [
    [s.rc - 0.985 * s.a, 0],
    [s.rc + 0.985 * s.a, 0],
  ];
  for (let i = 0; i <= n; i++) {
    const e = 0.985 - (1.97 * i) / n;
    pts.push([s.rc + e * s.a, s.t + 1.25 * s.depth * Math.sqrt(1 - e * e)]);
  }
  return pts;
}
export const rot = ([x, y]: Pt, a: number): Pt => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
];

// ---- injectors (hydraulics.ts) and V2 deflectors (housing.ts DEFLECTOR, hydraulics.ts linkage)
const bodyBot = M.roof + 10;
export const SPEAR = {
  x: M.topJetX,
  tip: M.topNozzleY,
  bodyBot,
  bodyTop: bodyBot + 170,
  bodyR: 32,
  coneR: 11,
  tipR: 12,
  inlet: { x: M.topJetX - 45, y: mm(TOP_INLET_Y), r: 26, len: 35 },
  flange: { half: 50, y0: M.roof, y1: M.roof + 8, bolt: 40 },
  glandH: 22,
  wheel: { y: bodyBot + 170 + 62, r: 38, tube: 5 },
  stroke: 24,
};
export const SIDE = {
  y: M.sideJetY,
  tip: M.sideNozzleX,
  flangeX: -416,
  v1: { flangeR: 40, flangeL: 12, r0: 26, r1: 11, plate: 90, ring: [12, 6] as [number, number] },
  v2: {
    flangeR: 42,
    flangeL: 14,
    r0: 24,
    r1: 14,
    plate: 100,
    ring: [16, 12] as [number, number],
    collar: [48, -450, -430],
  },
};
export const DEFLECTORS = DEFLECTOR.pivots.map((p, i) => ({
  pivot: pt(p[0], p[1]),
  len: mm(DEFLECTOR.blade[i]),
  rest: DEFLECTOR.latched[i],
  trip: DEFLECTOR.tripped[i],
  /** Where the jet meets the tripped blade (water.ts deflectAt). */
  hit: i ? 30 : 18,
}));

/** Rear linkage at e (0 latched .. 1 tripped): lever pins (paper mm) and the spring anchor. */
export function deflectorLinkage(e: number): { pins: Pt[]; anchor: Pt } {
  const pins = DEFLECTOR.pivots.map(([x, y], i) => {
    const a =
      (DEFLECTOR.latched[i] + (DEFLECTOR.tripped[i] - DEFLECTOR.latched[i]) * e + DEFLECTOR.leverOffset[i]) *
      (Math.PI / 180);
    return pt(x + DEFLECTOR.lever[i] * Math.cos(a), y + DEFLECTOR.lever[i] * Math.sin(a));
  });
  return { pins, anchor: pt(...DEFLECTOR.springAnchor) };
}

// ---- manifold (hydraulics.ts buildHydraulics)
export const PIPE = {
  r63: 31.5,
  r50: 25,
  riserTop: mm(RISER_TOP),
  teeX: -620,
  topInletY: mm(TOP_INLET_Y),
  riserOverX: -300,
  coupling: [-1180, -1080] as [number, number],
  mainValveX: -970,
  gaugeX: -820,
  reducer: [-730, -690] as [number, number],
  bypass: { x: -745, r: 20, valveY: 80, end: [-625, -480] as Pt, bendY: -420, scale: 0.7 },
  topValveY: 470,
  sideValveX: -530,
  sideEndX: -420,
  airValve: [-460, mm(RISER_TOP) + 25] as Pt,
};

// ---- shared drawing helpers

/** Wrapped paragraph in paper space (optional bullet); returns the next free y. */
export function note(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  text: Text,
  o: { size?: number; bullet?: string; color?: string; lh?: number } = {},
): number {
  const size = o.size ?? 1.9;
  const lh = size * (o.lh ?? 1.7);
  const indent = o.bullet ? size * 1.9 : 0;
  const max = Math.floor((w - indent) / (size * 0.64));
  const rows: string[] = [];
  for (const word of tr(text).split(' ')) {
    const last = rows[rows.length - 1];
    if (last !== undefined && (last + ' ' + word).length <= max) rows[rows.length - 1] = last + ' ' + word;
    else rows.push(word);
  }
  const p = d.paper();
  if (o.bullet) p.text([x, y], o.bullet, { size, baseline: 'top', weight: 'bold', color: o.color });
  rows.forEach((r, i) => p.text([x + indent, y + i * lh], r, { size, baseline: 'top', color: o.color }));
  return y + rows.length * lh + size * 0.5;
}

export type Box = { x0: number; x1: number; y0: number; y1: number };

/** Sutherland–Hodgman clip of a closed polygon against an axis-aligned box. */
export function clipPoly(pts: Pt[], b: Box): Pt[] {
  const edges: [(p: Pt) => boolean, (p: Pt, q: Pt) => Pt][] = [
    [(p) => p[0] >= b.x0, (p, q) => [b.x0, p[1] + ((q[1] - p[1]) * (b.x0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= b.x1, (p, q) => [b.x1, p[1] + ((q[1] - p[1]) * (b.x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= b.y0, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y0 - p[1])) / (q[1] - p[1]), b.y0]],
    [(p) => p[1] <= b.y1, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y1 - p[1])) / (q[1] - p[1]), b.y1]],
  ];
  let out = pts;
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    src.forEach((p, i) => {
      const q = src[(i + 1) % src.length];
      if (inside(p)) {
        out.push(p);
        if (!inside(q)) out.push(cut(p, q));
      } else if (inside(q)) out.push(cut(p, q));
    });
    if (!out.length) break;
  }
  return out;
}

/** Pipe of radius r along an orthogonal centre line with bends of radius R (quadratic fillets). */
export function pipe(v: View, pts: Pt[], r: number, R = 70, st: Stroke = {}): void {
  const unit = (p: Pt, q: Pt): Pt => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
  };
  const c: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const b = pts[i];
    const [u1, u2] = [unit(pts[i - 1], b), unit(b, pts[i + 1])];
    const p1: Pt = [b[0] - u1[0] * R, b[1] - u1[1] * R];
    const p2: Pt = [b[0] + u2[0] * R, b[1] + u2[1] * R];
    for (let t = 0; t <= 1.001; t += 0.1)
      c.push([0, 1].map((k) => (1 - t) ** 2 * p1[k] + 2 * t * (1 - t) * b[k] + t * t * p2[k]) as Pt);
  }
  c.push(pts[pts.length - 1]);
  for (let i = c.length - 1; i > 0; i--)
    if (Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]) < 1e-6) c.splice(i, 1);
  const side = (d: number): Pt[] =>
    c.map((p, i) => {
      const n = unit(c[Math.max(0, i - 1)], c[Math.min(c.length - 1, i + 1)]);
      return [p[0] - n[1] * d, p[1] + n[0] * d];
    });
  v.polyline([...side(r), ...side(-r).reverse()], { closed: true, w: W.medium, fill: COLORS.paper, ...st });
  v.polyline(c, { w: W.thin, dash: 'center', color: COLORS.muted });
}

/** Wavy break across a pipe end (horizontal pipe at y, or vertical pipe at x when `vertical`). */
export function pipeBreak(v: View, at: number, c: number, r: number, vertical = false): void {
  const s: Pt[] = [
    [r, 0],
    [r * 0.4, -r * 0.3],
    [-r * 0.4, r * 0.3],
    [-r, 0],
  ];
  v.polyline(
    s.map(([a, b]) => (vertical ? [c + a, at + b] : [at + b, c + a]) as Pt),
    { w: W.thin },
  );
}
