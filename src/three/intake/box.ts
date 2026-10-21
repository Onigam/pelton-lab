import * as THREE from 'three';
import { MAT } from '../materials';
import { mesh, pipeAlong, rng, roundedPath } from '../util';
import { bake, extrudeZ, stripSolid } from './common';
import {
  BOX,
  DRAIN,
  HALF_W,
  OUTLET,
  PIPE_PTS,
  PIPE_R,
  profileAt,
  profileY,
  S_END,
  STEEL_T,
  terrainH,
  VENT,
  VENT_TOP,
} from './dims';
import { perforatedAlpha } from './textures';

// Under the screen: the stainless collection box (in-box), the sand-trap hopper with its
// purge valve (in-sandtrap), the outlet — perforated strainer, bulkhead, reducer, compression
// coupling and the black HDPE Ø63 penstock (in-outlet) — and the air vent (in-vent).

export interface BoxParts {
  box: THREE.Group;
  trap: THREE.Group;
  outlet: THREE.Group;
  vent: THREE.Group;
  anchors: Record<'box' | 'trap' | 'outlet' | 'vent', THREE.Object3D>;
  boxMats: THREE.Material[];
  trapMats: THREE.Material[];
  outletMats: THREE.Material[];
  /** Penstock centre line (rounded), for the water core and flow markers. */
  pipePath: THREE.CurvePath<THREE.Vector3>;
}

const v2 = (x: number, y: number) => new THREE.Vector2(x, y);

function anchor(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Object3D {
  const a = new THREE.Object3D();
  a.position.set(x, y, z);
  parent.add(a);
  return a;
}

/** Height of the cheek's lower edge (profile offset -3 cm) above x: top of the box side walls. */
function cheekBottomY(x: number): number {
  let a = -0.07;
  let b = S_END;
  for (let i = 0; i < 26; i++) {
    const m = (a + b) / 2;
    if (profileAt(m, -0.03).x < x) a = m;
    else b = m;
  }
  return profileAt((a + b) / 2, -0.03).y;
}

/** Cylinder along Z (axis through (x, y)), from z0 to z1. */
function cylZ(r0: number, r1: number, z0: number, z1: number, mat: THREE.Material, x: number, y: number, seg = 24) {
  const g = new THREE.CylinderGeometry(r1, r0, Math.abs(z1 - z0), seg, 1);
  g.rotateX(Math.sign(z1 - z0) * (Math.PI / 2));
  return mesh(g, mat, [x, y, (z0 + z1) / 2]);
}

function buildShell(inox: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-box';
  const T = STEEL_T;
  // side walls: floor → lower edge of the cheeks; the far one is drilled for the outlet
  for (const side of [-1, 1]) {
    const pts = [v2(BOX.x0 - T, BOX.floor - T), v2(BOX.x1 + T, BOX.floor - T)];
    for (let i = 0; i <= 30; i++) {
      const x = BOX.x1 + T - ((BOX.x1 + 2 * T - BOX.x0) * i) / 30;
      pts.push(v2(x, cheekBottomY(x)));
    }
    const shape = new THREE.Shape(pts);
    if (side < 0) shape.holes.push(new THREE.Path().absarc(OUTLET.x, OUTLET.y, 0.04, 0, Math.PI * 2, true));
    const z0 = side > 0 ? HALF_W : -HALF_W - T;
    g.add(mesh(extrudeZ(shape, z0, z0 + T, 32), inox));
  }
  // upstream wall up to the plate, downstream wall up to the lip, floor up to the sand trap
  const yUp = profileY(BOX.x0) - T;
  g.add(
    mesh(new THREE.BoxGeometry(T, yUp - BOX.floor + T, 2 * HALF_W), inox, [
      BOX.x0 - T / 2,
      (yUp + BOX.floor - T) / 2,
      0,
    ]),
  );
  const yDn = profileY(BOX.x1 + T) - T;
  g.add(
    mesh(new THREE.BoxGeometry(T, yDn - BOX.floor + T, 2 * HALF_W), inox, [
      BOX.x1 + T / 2,
      (yDn + BOX.floor - T) / 2,
      0,
    ]),
  );
  g.add(
    mesh(new THREE.BoxGeometry(BOX.trapX - BOX.x0, T, 2 * HALF_W), inox, [
      (BOX.x0 + BOX.trapX) / 2,
      BOX.floor - T / 2,
      0,
    ]),
  );
  bake(g);
  return g;
}

function buildTrap(inox: THREE.Material, extra: THREE.Material[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-sandtrap';
  const T = STEEL_T;
  const x0 = BOX.trapX;
  const xb = x0 + 0.045;
  // side walls of the hopper (the near one drilled for the purge drain)
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape([
      v2(x0, BOX.floor - T),
      v2(xb, BOX.trapBottom - T),
      v2(BOX.x1 + T, BOX.trapBottom - T),
      v2(BOX.x1 + T, BOX.floor - T),
    ]);
    if (side > 0) shape.holes.push(new THREE.Path().absarc(DRAIN.x, DRAIN.y, 0.021, 0, Math.PI * 2, true));
    const z0 = side > 0 ? HALF_W : -HALF_W - T;
    g.add(mesh(extrudeZ(shape, z0, z0 + T, 20), inox));
  }
  // sloped and flat bottom, downstream plate, and the low sill that stops sand creeping on
  g.add(
    mesh(
      stripSolid(
        [v2(x0, BOX.floor), v2(xb, BOX.trapBottom)],
        [v2(x0 - T * 0.7, BOX.floor - T), v2(xb - T * 0.7, BOX.trapBottom - T)],
        -HALF_W,
        HALF_W,
      ),
      inox,
    ),
  );
  g.add(
    mesh(new THREE.BoxGeometry(BOX.x1 - xb + T, T, 2 * HALF_W), inox, [
      (xb + BOX.x1 + T) / 2,
      BOX.trapBottom - T / 2,
      0,
    ]),
  );
  g.add(
    mesh(new THREE.BoxGeometry(T, BOX.floor - BOX.trapBottom + T, 2 * HALF_W), inox, [
      BOX.x1 + T / 2,
      (BOX.floor + BOX.trapBottom - T) / 2,
      0,
    ]),
  );
  g.add(mesh(new THREE.BoxGeometry(T, 0.03, 2 * HALF_W), inox, [x0 - T / 2, BOX.floor + 0.015, 0]));

  // settled sand and grit
  const r = rng(61);
  const sandGeo = new THREE.BoxGeometry(BOX.x1 - xb, 0.02, 2 * HALF_W - 0.004, 12, 1, 24);
  const p = sandGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0) p.setY(i, 0.01 + 0.006 * Math.sin(p.getZ(i) * 23 + 1) + 0.004 * r());
  }
  sandGeo.computeVertexNormals();
  const sand = new THREE.MeshStandardMaterial({ color: 0xa98f66, roughness: 1 });
  g.add(mesh(sandGeo, sand, [(xb + BOX.x1) / 2, BOX.trapBottom + 0.01, 0]));

  // purge: threaded stub + lock nut, PVC ball valve with red lever (closed: across the pipe),
  // elbow and a short drain discharging back into the stream
  const pvc = MAT.pvcGrey();
  const red = MAT.pvcRed();
  const zW = HALF_W + T;
  g.add(cylZ(0.021, 0.021, zW, zW + 0.045, pvc, DRAIN.x, DRAIN.y, 16));
  g.add(cylZ(0.029, 0.029, zW, zW + 0.01, pvc, DRAIN.x, DRAIN.y, 6));
  const vz = zW + 0.07;
  g.add(cylZ(0.026, 0.026, vz - 0.03, vz + 0.03, pvc, DRAIN.x, DRAIN.y, 20));
  const ball = new THREE.SphereGeometry(0.031, 20, 12);
  ball.scale(1, 1, 0.8);
  g.add(mesh(ball, pvc, [DRAIN.x, DRAIN.y, vz]));
  g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 10), pvc, [DRAIN.x, DRAIN.y + 0.035, vz]));
  const lever = new THREE.BoxGeometry(0.1, 0.008, 0.016);
  lever.translate(0.035, 0, 0);
  g.add(mesh(lever, red, [DRAIN.x, DRAIN.y + 0.047, vz]));
  const ground = terrainH(0.32, vz + 0.02);
  g.add(
    pipeAlong(
      [
        new THREE.Vector3(DRAIN.x, DRAIN.y, vz + 0.025),
        new THREE.Vector3(DRAIN.x, DRAIN.y, vz + 0.055),
        new THREE.Vector3(DRAIN.x + 0.1, DRAIN.y - 0.02, vz + 0.055),
        new THREE.Vector3(0.32, Math.max(ground + 0.024, DRAIN.y - 0.045), vz + 0.06),
      ],
      0.02,
      pvc,
      { bend: 0.03 },
    ),
  );
  extra.push(sand, pvc, red);
  bake(g);
  return g;
}

/** Thin strip on top of the pipe: the white stripe of irrigation-grade HDPE. */
function stripe(path: THREE.CurvePath<THREE.Vector3>, r: number): THREE.BufferGeometry {
  const n = 160;
  const pos: number[] = [];
  const nor: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const w = 0.0045;
  for (let i = 0; i <= n; i++) {
    const p = path.getPointAt(i / n);
    const t = path.getTangentAt(i / n);
    const u = up.clone().addScaledVector(t, -t.dot(up)).normalize();
    const s = new THREE.Vector3().crossVectors(t, u).normalize();
    const c = p.clone().addScaledVector(u, r + 0.0004);
    for (const k of [-1, 1]) {
      const q = c.clone().addScaledVector(s, k * w);
      pos.push(q.x, q.y, q.z);
      nor.push(u.x, u.y, u.z);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function buildOutlet(clipMats: THREE.Material[]): { group: THREE.Group; path: THREE.CurvePath<THREE.Vector3> } {
  const g = new THREE.Group();
  g.name = 'in-outlet';
  const { x, y } = OUTLET;
  const zW = -HALF_W - STEEL_T;
  // perforated stainless strainer inside the box (keeps leaves and gravel out of the pipe)
  const holes = perforatedAlpha(9, 9);
  const strainerMat = new THREE.MeshStandardMaterial({
    color: 0xd9dcdf,
    metalness: 1,
    roughness: 0.3,
    alphaMap: holes,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  g.add(cylZ(0.03, 0.03, -HALF_W + 0.012, -0.12, strainerMat, x, y, 28));
  const cap = new THREE.CircleGeometry(0.03, 28);
  g.add(mesh(cap, strainerMat, [x, y, -0.12]));
  const pp = MAT.printBlack();
  pp.roughness = 0.55;
  const blue = MAT.pvcBlue();
  const epdm = MAT.epdm();
  // bulkhead: inner nut, wall, gasket, outer nut, spigot; then reducer and compression coupling
  g.add(cylZ(0.046, 0.046, -HALF_W, -HALF_W + 0.012, pp, x, y, 8));
  g.add(cylZ(0.046, 0.046, zW, zW - 0.002, epdm, x, y, 28));
  g.add(cylZ(0.046, 0.046, zW - 0.002, zW - 0.015, pp, x, y, 8));
  g.add(cylZ(0.0385, 0.0385, zW - 0.015, -0.335, pp, x, y, 24));
  const grey = MAT.pvcGrey();
  g.add(cylZ(0.0385, 0.034, -0.335, -0.37, grey, x, y, 24));
  g.add(cylZ(0.04, 0.04, -0.37, -0.475, pp, x, y, 24));
  for (const [z0, z1] of [
    [-0.37, -0.392],
    [-0.453, -0.475],
  ]) {
    g.add(cylZ(0.045, 0.045, z0, z1, blue, x, y, 12));
  }
  // the fittings are cut in half along their axis in cutaway mode (not the HDPE pipe)
  clipMats.push(strainerMat, pp, blue, epdm, grey);

  // HDPE Ø63 penstock resting on the gravel shelf, cut at the block edge
  const pe = MAT.pe();
  pe.side = THREE.DoubleSide; // the bore shows at the cut end
  const path = roundedPath(PIPE_PTS, 0.1);
  const tube = new THREE.TubeGeometry(path, 140, PIPE_R, 20, false);
  g.add(mesh(tube, pe));
  const white = new THREE.MeshStandardMaterial({
    color: 0xf2f2ee,
    roughness: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  g.add(mesh(stripe(path, PIPE_R), white));
  const end = PIPE_PTS[PIPE_PTS.length - 1];
  const ring = new THREE.RingGeometry(PIPE_R - 0.0038, PIPE_R, 28);
  ring.rotateY(Math.PI / 2);
  g.add(
    mesh(ring, new THREE.MeshStandardMaterial({ color: 0x2c2e31, roughness: 0.8 }), [end.x + 0.0005, end.y, end.z]),
  );
  // galvanised U-pins holding the pipe on the shelf
  const zinc = MAT.zinc();
  for (const t of [0.55, 0.85]) {
    const p = path.getPointAt(t);
    const tan = path.getTangentAt(t);
    const pin = new THREE.TorusGeometry(PIPE_R + 0.003, 0.0022, 6, 16, Math.PI);
    const legs = [-1, 1].map((k) => {
      const l = new THREE.CylinderGeometry(0.0022, 0.0022, 0.05, 6);
      l.translate(k * (PIPE_R + 0.003), -0.025, 0);
      return l;
    });
    for (const geo of [pin, ...legs]) {
      const m = mesh(geo, zinc, [p.x, p.y, p.z]);
      m.rotation.y = Math.atan2(-tan.z, tan.x) + Math.PI / 2;
      g.add(m);
    }
  }
  bake(g);
  return { group: g, path };
}

function buildVent(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-vent';
  const pp = MAT.printBlack();
  pp.roughness = 0.55;
  const blue = MAT.pvcBlue();
  const pvc = MAT.pvcGrey();
  const { x, y, z } = VENT;
  // compression tee on the penstock (run along +X), branch up
  const run = new THREE.CylinderGeometry(0.04, 0.04, 0.11, 24);
  run.rotateZ(Math.PI / 2);
  g.add(mesh(run, pp, [x, y, z]));
  for (const k of [-1, 1]) {
    const nut = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12);
    nut.rotateZ(Math.PI / 2);
    g.add(mesh(nut, blue, [x + k * 0.048, y, z]));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.06, 20), pp, [x, y + 0.055, z]));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.016, 12), blue, [x, y + 0.08, z]));
  // Ø32 riser above the pond level so it never spills, gooseneck against rain and leaves
  const r = 0.016;
  const top = VENT_TOP;
  g.add(
    pipeAlong(
      [
        new THREE.Vector3(x, y + 0.07, z),
        new THREE.Vector3(x, top, z),
        new THREE.Vector3(x + 0.07, top, z),
        new THREE.Vector3(x + 0.07, top - 0.07, z),
      ],
      r,
      pvc,
      { bend: 0.035 },
    ),
  );
  const mesh2 = new THREE.CircleGeometry(r * 0.95, 16);
  mesh2.rotateX(Math.PI / 2);
  g.add(mesh(mesh2, MAT.inox(), [x + 0.07, top - 0.07, z]));
  // wooden stake with two hose clamps
  const stake = MAT.woodDark();
  const sx = x + 0.04;
  const base = terrainH(sx, z - 0.04);
  g.add(
    mesh(new THREE.BoxGeometry(0.025, top - 0.05 - base + 0.06, 0.025), stake, [
      sx,
      (top - 0.05 + base - 0.06) / 2,
      z - 0.035,
    ]),
  );
  for (const cy of [y + 0.3, top - 0.12]) {
    const clamp = new THREE.TorusGeometry(r + 0.003, 0.003, 6, 20);
    clamp.rotateX(Math.PI / 2);
    g.add(mesh(clamp, MAT.zinc(), [x, cy, z]));
  }
  bake(g);
  return g;
}

export function buildBox(): BoxParts {
  const boxMat = MAT.inox();
  boxMat.roughness = 0.4;
  boxMat.metalness = 0.85;
  const trapMat = MAT.inox();
  trapMat.roughness = 0.42;
  trapMat.metalness = 0.85;
  const trapMats: THREE.Material[] = [trapMat];
  const outletMats: THREE.Material[] = [];
  const box = buildShell(boxMat);
  const trap = buildTrap(trapMat, trapMats);
  const { group: outlet, path } = buildOutlet(outletMats);
  const vent = buildVent();
  return {
    box,
    trap,
    outlet,
    vent,
    boxMats: [boxMat],
    trapMats,
    outletMats,
    pipePath: path,
    anchors: {
      box: anchor(box, 0.12, 0.38, HALF_W + 0.01),
      trap: anchor(trap, DRAIN.x + 0.03, DRAIN.y + 0.06, DRAIN.z + 0.07),
      outlet: anchor(outlet, 0.27, 0.39, -0.6),
      vent: anchor(vent, VENT.x + 0.03, VENT_TOP + 0.05, VENT.z),
    },
  };
}
