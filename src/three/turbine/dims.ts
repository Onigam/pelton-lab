import * as THREE from 'three';

// Single source of truth for the turbine geometry (metres).
// "Machine" coordinates: origin at the underside of the base plate, centred, +Z = front
// window (wet chamber), -Z = rear panel (dry chamber), shaft along Z.

export const D = {
  /** Height of the base plate underside above ground (top of beams / skid). */
  baseY: 0.92,

  // housing
  W: 0.58, // outer width (X)
  zFront: 0.18, // outer face of the PMMA window
  zBack: -0.18, // outer face of the rear panel
  baseT: 0.02, // base plate thickness
  sideTop: 0.3, // height where vertical sides end and slopes start
  roofHalf: 0.18, // half-width of the flat roof (wide enough for the injector base and its 4 bolts)
  roof: 0.46, // overall height above the base underside
  sheet: 0.002, // aluminium sheet thickness
  lip: 0.014, // width of the folded return lips framing window/rear panel

  // partition (PMMA, between wet and dry chambers)
  zPart: 0.04,
  partT: 0.01,

  // drive train
  axisY: 0.23,
  shaftR: 0.01,
  shaftFront: 0.15,
  shaftBack: -0.172,

  // Pelton runner
  wheelZ: 0.11,
  rPitch: 0.115,
  hubR: 0.085,
  hubT: 0.012,
  buckets: 22,

  // jets: top (vertical, from the roof) and side (horizontal, through the left wall)
  topJetX: -0.115,
  topNozzleY: 0.38,
  sideJetY: 0.115,
  sideNozzleX: -0.15,

  // manifold
  inletY: 0.3,
  pipeZ: 0.11,
  inletX: -1.35,
};

/**
 * Hexagonal "house" profile of the housing in the XY plane (counter-clockwise),
 * every edge moved inwards by `inset` (the bottom one only if `insetBottom`, so plates
 * stay on the base while frames keep a closed ring).
 */
export function profile(inset = 0, insetBottom = false): THREE.Vector2[] {
  const hw = D.W / 2;
  const outer = [
    new THREE.Vector2(-hw, D.baseT),
    new THREE.Vector2(hw, D.baseT),
    new THREE.Vector2(hw, D.sideTop),
    new THREE.Vector2(D.roofHalf, D.roof),
    new THREE.Vector2(-D.roofHalf, D.roof),
    new THREE.Vector2(-hw, D.sideTop),
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

/** Angular velocity sign: runner turns counter-clockwise seen from the front (+Z). */
export const SPIN = 1;
