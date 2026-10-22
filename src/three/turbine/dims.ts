import * as THREE from 'three';

// Single source of truth for the turbine geometry (metres), aligned on the maker's published
// data (hydronome.fr): housing 574 × 328 × 402 mm, 26-bucket runner Ø244 mm outside, nozzles up
// to Ø14 mm, 200 mm generator compartment.
// "Machine" coordinates: origin at the underside of the base plate on the shaft axis line,
// +X towards the sloped end, +Z = front window (wet chamber), -Z = rear panel (dry chamber),
// shaft along Z. The housing is not centred on the shaft: the tall wall is on the injector
// side (-X), the roof slopes down towards +X like the commercial model.

export const D = {
  /** Height of the base plate underside above ground (top of beams / skid; maker: ≥ 0.5 m). */
  baseY: 0.92,

  // housing (outer)
  x0: -0.247, // tall end wall (injector side)
  x1: 0.327, // low end of the sloped roof
  W: 0.574, // overall length x1 - x0
  depth: 0.402, // overall depth along the shaft
  zFront: 0.201, // outer face of the PMMA window
  zBack: -0.201, // outer face of the rear panel
  baseT: 0.02, // base plate thickness
  roof: 0.328, // overall height above the base underside
  wallH: 0.288, // tall end wall height before the bevel
  bevel: 0.04, // horizontal size of the bevel at the top of the tall wall
  peakX: 0.118, // end of the flat roof, start of the slope
  lowH: 0.06, // height of the low end wall
  sheet: 0.002, // aluminium sheet thickness
  lip: 0.014, // width of the folded return lips framing window/rear panel

  // partition (PMMA, between wet and dry chambers): 200 mm generator compartment behind it
  zPart: 0.0,
  partT: 0.01,

  // drive train
  axisY: 0.174,
  shaftR: 0.01,
  shaftFront: 0.15,
  shaftBack: -0.193,

  // Pelton runner: 26 buckets, Ø244 outside, pitch Ø190
  wheelZ: 0.11,
  rPitch: 0.095,
  hubR: 0.07,
  hubT: 0.012,
  buckets: 26,
  /** Bolt circle of the clamping ring (one M4 per bucket). */
  boltR: 0.062,

  // jets: top (vertical, through the flat roof) and side (horizontal, through the tall wall)
  topJetX: -0.095,
  topNozzleY: 0.3,
  sideJetY: 0.079,
  sideNozzleX: -0.125,
  /** Largest nozzle the runner accepts (maker data). */
  maxNozzle: 14,

  // manifold
  inletY: 0.3,
  pipeZ: 0.11,
  inletX: -1.35,
};

/** Outer radius of the bucket tips (Ø244). */
export const R_TIP = 0.122;

/**
 * Housing profile in the XY plane (counter-clockwise): base, low end wall, sloped roof,
 * flat roof, bevel, tall wall. Every edge is moved inwards by `inset` (the bottom one only if
 * `insetBottom`, so plates stay on the base while frames keep a closed ring).
 */
export function profile(inset = 0, insetBottom = false): THREE.Vector2[] {
  const outer = [
    new THREE.Vector2(D.x0, D.baseT),
    new THREE.Vector2(D.x1, D.baseT),
    new THREE.Vector2(D.x1, D.lowH),
    new THREE.Vector2(D.peakX, D.roof),
    new THREE.Vector2(D.x0 + D.bevel, D.roof),
    new THREE.Vector2(D.x0, D.wallH),
  ];
  if (inset === 0) return outer;
  const n = outer.length;
  // offset lines: point + inward normal * inset (bottom edge index 0 is not offset)
  const lines = outer.map((p, i) => {
    const q = outer[(i + 1) % n];
    const dir = q.clone().sub(p).normalize();
    const normal = new THREE.Vector2(-dir.y, dir.x); // inward for CCW polygons
    const d = i === 0 && !insetBottom ? 0 : inset;
    return { p: p.clone().addScaledVector(normal, d), dir };
  });
  return lines.map((cur, i) => {
    const prev = lines[(i - 1 + n) % n];
    // intersect prev line with current line
    const cross = prev.dir.x * cur.dir.y - prev.dir.y * cur.dir.x;
    const diff = cur.p.clone().sub(prev.p);
    const t = (diff.x * cur.dir.y - diff.y * cur.dir.x) / cross;
    return prev.p.clone().addScaledVector(prev.dir, t);
  });
}

export function profileShape(inset = 0): THREE.Shape {
  return new THREE.Shape(profile(inset));
}

/** Outer height of the housing at abscissa x (top of the profile), useful to place parts. */
export function roofAt(x: number): number {
  if (x <= D.x0 + D.bevel) return D.wallH + ((x - D.x0) / D.bevel) * (D.roof - D.wallH);
  if (x <= D.peakX) return D.roof;
  return D.roof - ((x - D.peakX) / (D.x1 - D.peakX)) * (D.roof - D.lowH);
}

/** Angular velocity sign: runner turns counter-clockwise seen from the front (+Z). */
export const SPIN = 1;
