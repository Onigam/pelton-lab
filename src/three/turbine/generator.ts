import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { emissive, MAT } from '@onigam/lab-kit/three';
import type { PartRegistry } from '@onigam/lab-kit/three';
import { group, mesh, pipeAlong } from '@onigam/lab-kit/three';
import { D } from './dims';

// Outer-rotor permanent-magnet generator in the dry chamber:
// 12-tooth laminated stator on the bearing tube, printed rotor bell with 14 N52 magnets
// and a fan face, 3-phase leads to a terminal block and a rectifier on a heatsink.

const TEETH = 12;
const POLES = 14;
/** Axial extents (Z) of the stator stack and of the rotor bell, in the 200 mm dry chamber. */
export const Z_STATOR: [number, number] = [-0.112, -0.076];
export const Z_BELL: [number, number] = [-0.128, -0.07];
const R_SHOE = 0.0565;

function statorLamination(thick: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const rYoke = 0.042;
  const toothHalf = 0.0052;
  const shoeHalfAngle = (Math.PI / TEETH) * 0.78;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < TEETH; i++) {
    const a = (i / TEETH) * Math.PI * 2;
    const dir = new THREE.Vector2(Math.cos(a), Math.sin(a));
    const nrm = new THREE.Vector2(-dir.y, dir.x);
    const at = (r: number, s: number) => dir.clone().multiplyScalar(r).addScaledVector(nrm, s);
    const prevGap = a - Math.PI / TEETH;
    pts.push(new THREE.Vector2(Math.cos(prevGap) * rYoke, Math.sin(prevGap) * rYoke));
    pts.push(at(rYoke, -toothHalf));
    pts.push(at(0.053, -toothHalf));
    // shoe: arc segment at the tip
    for (let k = 0; k <= 6; k++) {
      const s = -shoeHalfAngle + (2 * shoeHalfAngle * k) / 6;
      const aa = a + s;
      const rr = k === 0 || k === 6 ? 0.0545 : R_SHOE;
      pts.push(new THREE.Vector2(Math.cos(aa) * rr, Math.sin(aa) * rr));
    }
    pts.push(at(0.053, toothHalf));
    pts.push(at(rYoke, toothHalf));
  }
  shape.setFromPoints(pts);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.0342, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 24 });
}

function coilGeometry(): THREE.BufferGeometry {
  // a few turns of enamelled wire around each tooth (rounded rectangles in the tangential/axial plane)
  const geos: THREE.BufferGeometry[] = [];
  const zMid = (Z_STATOR[0] + Z_STATOR[1]) / 2;
  const halfLen = (Z_STATOR[1] - Z_STATOR[0]) / 2 + 0.003;
  for (let i = 0; i < TEETH; i++) {
    const a = (i / TEETH) * Math.PI * 2;
    for (let layer = 0; layer < 3; layer++) {
      const r = 0.0445 + layer * 0.0028;
      const halfW = 0.0052 + 0.0022 + layer * 0.0016;
      const hl = halfLen + layer * 0.0016;
      const rr = 0.0022;
      const pts: THREE.Vector3[] = [];
      const corners: [number, number][] = [
        [halfW, hl],
        [-halfW, hl],
        [-halfW, -hl],
        [halfW, -hl],
      ];
      corners.forEach(([s, z], k) => {
        const start = (k * Math.PI) / 2;
        for (let q = 0; q <= 4; q++) {
          const ang = start + (q / 4) * (Math.PI / 2);
          const cs = s - Math.sign(s) * rr + Math.cos(ang) * rr;
          const cz = z - Math.sign(z) * rr + Math.sin(ang) * rr;
          const x = Math.cos(a) * r - Math.sin(a) * cs;
          const y = Math.sin(a) * r + Math.cos(a) * cs;
          pts.push(new THREE.Vector3(x, y, zMid + cz));
        }
      });
      const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
      geos.push(new THREE.TubeGeometry(curve, 48, 0.0013, 6, true));
    }
  }
  return mergeGeometries(geos)!;
}

function buildStator(machine: THREE.Object3D): THREE.Group {
  const stator = group('stator', [0, D.axisY, 0]);
  const lamThick = 0.0026;
  const n = Math.round((Z_STATOR[1] - Z_STATOR[0]) / (lamThick + 0.0003));
  const lam = statorLamination(lamThick);
  const stack: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const g = lam.clone();
    g.translate(0, 0, Z_STATOR[0] + i * (lamThick + 0.0003));
    stack.push(g);
  }
  stator.add(mesh(mergeGeometries(stack)!, MAT.laminations()));
  stator.add(mesh(coilGeometry(), MAT.copper()));
  // insulating end plates (printed) holding the coils
  const plate = new THREE.RingGeometry(0.0342, 0.043, 48);
  const p1 = mesh(plate, MAT.printWhite(), [0, 0, Z_STATOR[1] + 0.0004]);
  const p2 = mesh(plate, MAT.printWhite(), [0, 0, Z_STATOR[0] - 0.0004], [Math.PI, 0, 0]);
  stator.add(p1, p2);
  machine.add(stator);
  return stator;
}

function kidneyFan(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.078, 0, Math.PI * 2, false);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.06;
    const a1 = a0 + (Math.PI * 2) / n - 0.16;
    const h = new THREE.Path();
    h.absarc(0, 0, 0.068, a0, a1, false);
    h.absarc(Math.cos(a1) * 0.059, Math.sin(a1) * 0.059, 0.009, a1, a1 + Math.PI, false);
    h.absarc(0, 0, 0.05, a1, a0, true);
    h.absarc(Math.cos(a0) * 0.059, Math.sin(a0) * 0.059, 0.009, a0 + Math.PI, a0 + Math.PI * 2, false);
    shape.holes.push(h);
  }
  const hub = new THREE.Path();
  hub.absarc(0, 0, 0.021, 0, Math.PI * 2, true);
  shape.holes.push(hub);
  return new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: false, curveSegments: 32 });
}

function buildRotor(spinner: THREE.Object3D, reg: PartRegistry): THREE.Group {
  const rotor = group('rotor');
  const cream = MAT.printCream();
  // bell (open towards the partition)
  const bell = new THREE.CylinderGeometry(0.078, 0.078, Z_BELL[1] - Z_BELL[0] - 0.006, 64, 1, true);
  bell.rotateX(Math.PI / 2);
  const bellMesh = mesh(bell, cream, [0, 0, (Z_BELL[0] + 0.006 + Z_BELL[1]) / 2]);
  (bellMesh.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  rotor.add(bellMesh);
  const inner = new THREE.CylinderGeometry(0.0615, 0.0615, Z_BELL[1] - Z_BELL[0] - 0.006, 64, 1, true);
  inner.rotateX(Math.PI / 2);
  const innerMesh = mesh(inner, MAT.steelBlack(), [0, 0, (Z_BELL[0] + 0.006 + Z_BELL[1]) / 2]);
  (innerMesh.material as THREE.MeshStandardMaterial).side = THREE.BackSide;
  rotor.add(innerMesh); // steel back-iron ring
  const lip = new THREE.RingGeometry(0.0615, 0.078, 64);
  rotor.add(mesh(lip, cream, [0, 0, Z_BELL[1]]));
  // fan face with kidney-shaped vents (what you see through the rear vent in the video)
  rotor.add(mesh(kidneyFan(), cream, [0, 0, Z_BELL[0]]));
  // aluminium hub with set screw
  const hub = new THREE.CylinderGeometry(0.021, 0.021, 0.018, 32);
  hub.rotateX(Math.PI / 2);
  rotor.add(mesh(hub, MAT.alu(), [0, 0, Z_BELL[0] - 0.006]));
  const screw = new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8);
  rotor.add(mesh(screw, MAT.steelBlack(), [0, 0.021, Z_BELL[0] - 0.006]));

  // magnets: 14 arc segments, alternating N / S
  const magnets = group('magnets');
  const arc = ((Math.PI * 2) / POLES) * 0.74;
  const magShape = new THREE.Shape();
  magShape.absarc(0, 0, 0.0614, -arc / 2, arc / 2, false);
  magShape.absarc(0, 0, R_SHOE + 0.001, arc / 2, -arc / 2, true);
  const magGeo = new THREE.ExtrudeGeometry(magShape, {
    depth: Z_STATOR[1] - Z_STATOR[0] + 0.002,
    bevelEnabled: false,
    curveSegments: 6,
  });
  const matN = MAT.magnetN();
  const matS = MAT.magnetS();
  const mags: THREE.Mesh[] = [];
  for (let i = 0; i < POLES; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / POLES) * Math.PI * 2;
    const m = mesh(magGeo, i % 2 ? matS : matN, [0, 0, Z_STATOR[0] - 0.001]);
    pivot.add(m);
    magnets.add(pivot);
    mags.push(m);
  }
  rotor.add(magnets);
  spinner.add(rotor);

  reg.add('magnets', magnets, new THREE.Vector3(0, 0, 0), (f) => {
    for (const m of mags) m.position.x = f * 0.05;
  });
  reg.add('rotor', rotor, new THREE.Vector3(0, 0, -0.46));
  return rotor;
}

export interface GeneratorParts {
  rectifierLed: THREE.MeshStandardMaterial;
  hallLed: THREE.MeshStandardMaterial;
}

/** `sensors` is the shared sensor group (the hydraulics add the pressure transducer to it). */
export function buildGenerator(
  machine: THREE.Object3D,
  spinner: THREE.Object3D,
  sensors: THREE.Group,
  reg: PartRegistry,
): GeneratorParts {
  const stator = buildStator(machine);
  buildRotor(spinner, reg);

  // --- rectifier: finned aluminium heatsink + black 3-phase bridge module (on the dry chamber floor)
  const rect = group('rectifier', [0.19, D.baseT, -0.1]);
  const sink = new THREE.BoxGeometry(0.08, 0.008, 0.06);
  rect.add(mesh(sink, MAT.alu(), [0, 0.004, 0]));
  for (let i = 0; i < 9; i++) {
    rect.add(mesh(new THREE.BoxGeometry(0.0016, 0.03, 0.06), MAT.alu(), [-0.036 + i * 0.009, 0.023, 0]));
  }
  const bridge = new THREE.BoxGeometry(0.028, 0.01, 0.028);
  rect.add(mesh(bridge, MAT.printBlack(), [0, 0.044, 0]));
  rect.add(mesh(new THREE.BoxGeometry(0.03, 0.002, 0.03), MAT.alu(), [0, 0.0385, 0]));
  for (let i = 0; i < 5; i++) {
    rect.add(mesh(new THREE.BoxGeometry(0.0025, 0.008, 0.0008), MAT.brass(), [-0.01 + i * 0.005, 0.053, 0.008]));
  }
  const rectifierLed = emissive(0x39d353, 0);
  rect.add(mesh(new THREE.SphereGeometry(0.0018, 8, 6), rectifierLed, [0.012, 0.05, -0.012]));
  machine.add(rect);

  // --- terminal block (3 phases) + its leads (one part, so the wires follow the block)
  const termRoot = group('terminal');
  const term = group('terminal-block', [0.19, D.baseT, -0.035]);
  termRoot.add(term);
  term.add(mesh(new THREE.BoxGeometry(0.05, 0.004, 0.02), MAT.steel(), [0, 0.002, 0]));
  const colors = [MAT.cableRed(), MAT.cableBlack(), MAT.cableBlue()];
  for (let i = 0; i < 3; i++) {
    term.add(mesh(new THREE.BoxGeometry(0.012, 0.018, 0.016), MAT.printGrey(), [-0.016 + i * 0.016, 0.013, 0]));
    term.add(mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.003, 12), MAT.zinc(), [-0.016 + i * 0.016, 0.0235, 0]));
  }
  machine.add(termRoot);

  // phase leads from the stator to the terminal block, then DC from the rectifier to the gland
  const leads = group('leads');
  for (let i = 0; i < 3; i++) {
    const start = new THREE.Vector3(0.03 + i * 0.006, D.axisY - 0.035, Z_STATOR[0] - 0.002);
    const pts = [
      start,
      new THREE.Vector3(0.05 + i * 0.006, D.axisY - 0.08, -0.1),
      new THREE.Vector3(0.12, 0.06, -0.07 + i * 0.002),
      new THREE.Vector3(0.19 - 0.016 + i * 0.016, D.baseT + 0.025, -0.035),
    ];
    leads.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0016, 6), colors[i]));
    const pts2 = [
      new THREE.Vector3(0.19 - 0.016 + i * 0.016, D.baseT + 0.025, -0.035),
      new THREE.Vector3(0.19 - 0.012 + i * 0.006, D.baseT + 0.05, -0.07),
      new THREE.Vector3(0.19 - 0.01 + i * 0.005, D.baseT + 0.054, -0.09),
    ];
    leads.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 16, 0.0016, 6), colors[i]));
  }
  termRoot.add(leads);

  // --- output cable 2 × 6 mm² (black sheath) through the gland in the rear panel
  const cable = group('cable');
  const gland = new THREE.CylinderGeometry(0.009, 0.011, 0.018, 6);
  gland.rotateX(Math.PI / 2);
  cable.add(mesh(gland, MAT.pvcDark(), [0.2, 0.03, D.zBack - 0.004]));
  cable.add(
    pipeAlong(
      [
        new THREE.Vector3(0.19, D.baseT + 0.05, -0.1),
        new THREE.Vector3(0.2, 0.03, -0.15),
        new THREE.Vector3(0.2, 0.03, D.zBack - 0.05),
        new THREE.Vector3(0.2, 0.03, D.zBack - 0.35),
        new THREE.Vector3(0.2, -0.3, D.zBack - 0.5),
      ],
      0.0055,
      MAT.cableBlack(),
      { bend: 0.06 },
    ),
  );
  machine.add(cable);

  // --- sensors: Hall RPM sensor facing the rotor, NTC on a coil (pressure transducer: see hydraulics)
  const hallBracket = new THREE.BoxGeometry(0.012, 0.05, 0.012);
  sensors.add(mesh(hallBracket, MAT.alu(), [0, D.axisY + 0.112, -0.1]));
  const hall = new THREE.CylinderGeometry(0.006, 0.006, 0.03, 16);
  sensors.add(mesh(hall, MAT.printBlack(), [0, D.axisY + 0.097, -0.1]));
  const hallLed = emissive(0xff8a00, 0);
  sensors.add(mesh(new THREE.SphereGeometry(0.0022, 8, 6), hallLed, [0.007, D.axisY + 0.106, -0.1]));
  const ntc = new THREE.SphereGeometry(0.003, 10, 8);
  sensors.add(mesh(ntc, MAT.printBlack(), [0, D.axisY + 0.051, -0.094]));
  sensors.add(
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, D.axisY + 0.051, -0.094),
          new THREE.Vector3(0.05, D.axisY + 0.07, -0.12),
          new THREE.Vector3(0.12, 0.12, -0.14),
          new THREE.Vector3(0.19, 0.075, -0.14),
        ]),
        24,
        0.0011,
        5,
      ),
      MAT.printWhite(),
    ),
  );

  reg.add('stator', stator, new THREE.Vector3(0, 0, -0.3));
  reg.add('rectifier', rect, new THREE.Vector3(0.28, 0, -0.12));
  reg.add('terminal', termRoot, new THREE.Vector3(0.28, 0, 0.02));
  reg.add('cable', cable, new THREE.Vector3(0.1, 0, -0.35));

  return { rectifierLed, hallLed };
}
