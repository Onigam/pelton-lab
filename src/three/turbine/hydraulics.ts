import * as THREE from 'three';
import { emissive, glass, MAT } from '../materials';
import type { PartRegistry } from '../registry';
import { canvasTexture, group, mesh, pipeAlong } from '../util';
import { D } from './dims';

// Water side of the machine: HDPE inlet + compression fitting, main ball valve, gauge tee,
// manifold (gooseneck to the top spear injector, lower branch to the side nozzle),
// branch valves, injectors, and the V2 extras (quick-change nozzle, jet deflector, air valve).

const R63 = 0.0315;
const R50 = 0.025;
const Y = D.inletY;
const Z = D.pipeZ;

export interface Hydraulics {
  mainLever: THREE.Object3D;
  topLever: THREE.Object3D;
  sideLever: THREE.Object3D;
  needle: THREE.Object3D;
  handwheel: THREE.Object3D;
  gaugeNeedle: THREE.Object3D;
  deflectorTop: THREE.Object3D;
  deflectorSide: THREE.Object3D;
  insertRing: THREE.MeshStandardMaterial;
  sideInsertRing: THREE.MeshStandardMaterial;
  transducerLed: THREE.MeshStandardMaterial;
  /** Meshes cut by the "pipe" clipping plane in cutaway mode. */
  pipeCut: THREE.Object3D[];
}

function cylX(r: number, len: number, mat: THREE.Material, x: number, y: number, z = Z, seg = 32): THREE.Mesh {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateZ(Math.PI / 2);
  return mesh(g, mat, [x, y, z]);
}

function cylY(r: number, len: number, mat: THREE.Material, x: number, y: number, z = Z, seg = 32): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(r, r, len, seg), mat, [x, y, z]);
}

/** PVC union ball valve. Axis along X or Y; returns the group and its lever pivot. */
function ballValve(
  lever: THREE.Material,
  axis: 'x' | 'y',
  bodyMat = MAT.pvcGrey(),
): { g: THREE.Group; pivot: THREE.Group } {
  const g = group('ball-valve');
  const cyl = axis === 'x' ? cylX : cylY;
  g.add(cyl(R63 * 1.05, 0.07, bodyMat, 0, 0, 0));
  const ball = new THREE.SphereGeometry(0.046, 32, 16);
  ball.scale(axis === 'x' ? 0.8 : 1, axis === 'y' ? 0.8 : 1, 1);
  g.add(mesh(ball, bodyMat));
  for (const s of [-1, 1]) {
    const nut = cyl(0.05, 0.026, bodyMat, 0, 0, 0, 12);
    if (axis === 'x') nut.position.x = s * 0.058;
    else nut.position.y = s * 0.058;
    g.add(nut);
  }
  // stem + lever (lever parallel to the pipe = open)
  const pivot = group('lever-pivot', [0, 0, 0.05]);
  const stem = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 12);
  stem.rotateX(Math.PI / 2);
  pivot.add(mesh(stem, MAT.pvcDark(), [0, 0, -0.008]));
  const handle = new THREE.BoxGeometry(0.15, 0.022, 0.012);
  handle.translate(0.06, 0, 0.006);
  pivot.add(mesh(handle, lever));
  if (axis === 'y') pivot.rotation.z = Math.PI / 2;
  g.add(pivot);
  return { g, pivot };
}

function gaugeDial(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#f7f5ef';
    ctx.beginPath();
    ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 0..10 bar over 270°
    for (let v = 0; v <= 100; v++) {
      const a = (-225 + (v / 100) * 270) * (Math.PI / 180);
      const major = v % 10 === 0;
      const r0 = w * (major ? 0.36 : 0.4);
      ctx.lineWidth = major ? 3 : 1;
      if (v > 85) ctx.strokeStyle = '#c0261f';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * w * 0.44, cy + Math.sin(a) * w * 0.44);
      ctx.stroke();
      ctx.strokeStyle = '#222';
      if (major) {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(String(v / 10), cx + Math.cos(a) * w * 0.27, cy + Math.sin(a) * w * 0.27);
      }
    }
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('bar', cx, cy + h * 0.2);
    ctx.font = '12px sans-serif';
    ctx.fillText('PN10 · glycérine', cx, cy + h * 0.3);
  }).texture;
}

export function buildHydraulics(machine: THREE.Object3D, sensors: THREE.Group, reg: PartRegistry): Hydraulics {
  const pipeCut: THREE.Object3D[] = [];

  // --- penstock end: HDPE Ø63 PN10 (black, white stripe) + blue compression coupling
  const pen = group('penstock-end');
  pen.add(cylX(R63, 0.2, MAT.pe(), D.inletX + 0.07, Y));
  pen.add(mesh(new THREE.BoxGeometry(0.2, 0.002, 0.008), MAT.printWhite(), [D.inletX + 0.07, Y + R63, Z]));
  const blue = MAT.pvcBlue();
  pen.add(cylX(0.042, 0.1, blue, -1.13, Y, Z, 32));
  for (const x of [-1.19, -1.07]) pen.add(cylX(0.047, 0.03, blue, x, Y, Z, 16));
  // ribs on the nuts for grip
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    for (const x of [-1.19, -1.07]) {
      pen.add(
        mesh(new THREE.BoxGeometry(0.028, 0.006, 0.006), blue, [x, Y + Math.cos(a) * 0.048, Z + Math.sin(a) * 0.048]),
      );
    }
  }
  machine.add(pen);

  // --- main ball valve (blue lever)
  const main = ballValve(MAT.pvcBlue(), 'x');
  main.g.position.set(-0.97, Y, Z);
  machine.add(main.g);
  pipeCut.push(main.g);

  // --- manifold: Ø63 then Ø50 PVC, gauge tee, branch tee, gooseneck riser, lower branch
  const manifold = group('manifold');
  const grey = MAT.pvcGrey();
  manifold.add(cylX(R63, 0.11, grey, -1.025 - 0.07, Y));
  manifold.add(cylX(R63, 0.18, grey, -0.82, Y));
  // gauge tee
  manifold.add(cylX(R63 * 1.18, 0.09, grey, -0.82, Y, Z, 32));
  manifold.add(cylY(R63 * 1.1, 0.05, grey, -0.82, Y + 0.045));
  // reducer 63 -> 50
  const red = new THREE.CylinderGeometry(R50, R63, 0.04, 32);
  red.rotateZ(-Math.PI / 2);
  manifold.add(mesh(red, grey, [-0.71, Y, Z]));
  manifold.add(cylX(R50, 0.05, grey, -0.665, Y));
  // branch tee (cross): up to the top injector, down to the side injector
  manifold.add(mesh(new THREE.SphereGeometry(R50 * 1.25, 24, 16), grey, [-0.62, Y, Z]));
  const riser = pipeAlong(
    [
      new THREE.Vector3(-0.62, Y, Z),
      new THREE.Vector3(-0.62, 0.7, Z),
      new THREE.Vector3(-0.34, 0.7, Z),
      new THREE.Vector3(-0.34, 0.55, Z),
      new THREE.Vector3(-0.15, 0.55, Z),
    ],
    R50,
    grey,
    { bend: 0.07, radialSegments: 24 },
  );
  manifold.add(riser);
  const lower = pipeAlong(
    [new THREE.Vector3(-0.62, Y, Z), new THREE.Vector3(-0.62, D.sideJetY, Z), new THREE.Vector3(-0.42, D.sideJetY, Z)],
    R50,
    grey,
    { bend: 0.06, radialSegments: 24 },
  );
  manifold.add(lower);
  // socket collars at the joints (solvent-welded PVC)
  for (const [x, y, ax] of [
    [-0.62, 0.42, 'y'],
    [-0.47, 0.7, 'x'],
    [-0.25, 0.55, 'x'],
    [-0.5, D.sideJetY, 'x'],
  ] as [number, number, 'x' | 'y'][]) {
    manifold.add(ax === 'x' ? cylX(R50 * 1.15, 0.03, grey, x, y) : cylY(R50 * 1.15, 0.03, grey, x, y));
  }
  machine.add(manifold);
  pipeCut.push(manifold);

  // --- branch valves: red on the riser (top injector), blue on the lower branch (side injector)
  const valves = group('valve-branch');
  const top = ballValve(MAT.pvcRed(), 'y');
  top.g.scale.setScalar(0.82);
  top.g.position.set(-0.62, 0.5, Z);
  const side = ballValve(MAT.pvcBlue(), 'x');
  side.g.scale.setScalar(0.82);
  side.g.position.set(-0.53, D.sideJetY, Z);
  valves.add(top.g, side.g);
  machine.add(valves);
  pipeCut.push(top.g, side.g);

  // --- glycerine pressure gauge 0–10 bar (Ø100) on the tee
  const gauge = group('gauge', [-0.82, Y + 0.07, Z]);
  gauge.add(cylY(0.007, 0.05, MAT.brass(), 0, 0.025, 0, 12));
  gauge.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 6), MAT.brass(), [0, 0.012, 0]));
  const caseGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.032, 48);
  caseGeo.rotateX(Math.PI / 2);
  gauge.add(mesh(caseGeo, MAT.inox(), [0, 0.105, 0]));
  const dial = new THREE.Mesh(
    new THREE.CircleGeometry(0.047, 48),
    new THREE.MeshStandardMaterial({ map: gaugeDial(), roughness: 0.5 }),
  );
  dial.position.set(0, 0.105, 0.0161);
  gauge.add(dial);
  const gaugeNeedle = group('needle', [0, 0.105, 0.018]);
  const ndl = new THREE.BoxGeometry(0.038, 0.0025, 0.001);
  ndl.translate(0.014, 0, 0);
  gaugeNeedle.add(mesh(ndl, new THREE.MeshStandardMaterial({ color: 0x111111 })));
  gaugeNeedle.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.003, 16).rotateX(Math.PI / 2), MAT.steelBlack()));
  gauge.add(gaugeNeedle);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.049, 48), glass(0.18));
  lens.position.set(0, 0.105, 0.0175);
  gauge.add(lens);
  const bezel = new THREE.TorusGeometry(0.05, 0.003, 8, 48);
  gauge.add(mesh(bezel, MAT.inox(), [0, 0.105, 0.0165]));
  machine.add(gauge);

  // --- top injector: Italian spear valve (white body), handwheel on top, needle inside
  const injTop = group('injector-top');
  const white = MAT.printWhite();
  const bodyTop = 0.64;
  const bodyBot = 0.47;
  injTop.add(cylY(0.032, bodyTop - bodyBot, white, D.topJetX, (bodyTop + bodyBot) / 2, Z, 40));
  const cone = new THREE.CylinderGeometry(0.032, 0.011, bodyBot - D.topNozzleY - 0.006, 40);
  injTop.add(mesh(cone, white, [D.topJetX, (bodyBot + D.topNozzleY + 0.006) / 2, Z]));
  injTop.add(cylY(0.012, 0.008, MAT.inox(), D.topJetX, D.topNozzleY + 0.004, Z, 24)); // stainless nozzle tip
  injTop.add(cylX(0.026, 0.035, white, D.topJetX - 0.045, 0.55, Z)); // side inlet
  // roof flange
  injTop.add(mesh(new THREE.BoxGeometry(0.1, 0.008, 0.1), MAT.printBlack(), [D.topJetX, D.roof + 0.004, Z]));
  for (const [dx, dz] of [
    [-0.04, -0.04],
    [0.04, -0.04],
    [0.04, 0.04],
    [-0.04, 0.04],
  ]) {
    injTop.add(cylY(0.004, 0.006, MAT.inox(), D.topJetX + dx, D.roof + 0.011, Z + dz, 6));
  }
  // gland + threaded spindle + handwheel
  injTop.add(cylY(0.02, 0.022, MAT.brass(), D.topJetX, bodyTop + 0.011, Z, 6));
  const handwheel = group('handwheel', [D.topJetX, bodyTop + 0.05, Z]);
  handwheel.add(cylY(0.005, 0.06, MAT.inox(), 0, -0.02, 0, 12));
  const rim = new THREE.TorusGeometry(0.038, 0.005, 10, 40);
  rim.rotateX(Math.PI / 2);
  handwheel.add(mesh(rim, MAT.pvcRed(), [0, 0.012, 0]));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.BoxGeometry(0.076, 0.004, 0.006);
    const s = mesh(spoke, MAT.pvcRed(), [0, 0.012, 0]);
    s.rotation.y = (i / 3) * Math.PI;
    handwheel.add(s);
  }
  handwheel.add(cylY(0.008, 0.012, MAT.pvcRed(), 0, 0.012, 0, 16));
  injTop.add(handwheel);
  // needle ("olive") moving inside the body: visible in cutaway
  const needle = group('needle', [D.topJetX, 0, Z]);
  needle.add(cylY(0.0045, 0.24, MAT.inox(), 0, 0.53, 0, 12));
  const olive = new THREE.SphereGeometry(0.0115, 24, 16);
  olive.scale(1, 2.2, 1);
  needle.add(mesh(olive, MAT.inox(), [0, D.topNozzleY + 0.03, 0]));
  const tip = new THREE.ConeGeometry(0.0085, 0.022, 24);
  tip.rotateX(Math.PI);
  needle.add(mesh(tip, MAT.inox(), [0, D.topNozzleY + 0.01, 0]));
  injTop.add(needle);
  machine.add(injTop);
  pipeCut.push(injTop);

  // --- V1 side injector: 3D-printed fixed nozzle (dark grey) bolted on the left wall
  const injSide = group('injector-side');
  const grey3d = MAT.printGrey();
  injSide.add(cylX(0.04, 0.012, grey3d, -0.416, D.sideJetY, Z, 40));
  // body from the flange (x = -0.41) to the nozzle tip, narrowing towards the runner
  const bodyLen = D.sideNozzleX + 0.41;
  const sideCone = new THREE.CylinderGeometry(0.011, 0.026, bodyLen, 40);
  sideCone.rotateZ(-Math.PI / 2);
  injSide.add(mesh(sideCone, grey3d, [(-0.41 + D.sideNozzleX) / 2, D.sideJetY, Z]));
  injSide.add(mesh(new THREE.BoxGeometry(0.008, 0.09, 0.09), grey3d, [-0.294, D.sideJetY, Z]));
  const sideInsertRing = new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.5 });
  injSide.add(cylX(0.012, 0.006, sideInsertRing, D.sideNozzleX - 0.003, D.sideJetY, Z, 24));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    injSide.add(cylX(0.004, 0.008, MAT.inox(), -0.426, D.sideJetY + Math.cos(a) * 0.03, Z + Math.sin(a) * 0.03, 6));
  }
  machine.add(injSide);

  // --- V2 side injector: aluminium lance with bayonet quick-change nozzle inserts (colour coded)
  const injQuick = group('injector-quick');
  const alu = MAT.alu();
  injQuick.add(cylX(0.042, 0.014, alu, -0.416, D.sideJetY, Z, 40));
  const lance = new THREE.CylinderGeometry(0.014, 0.024, bodyLen, 40);
  lance.rotateZ(-Math.PI / 2);
  injQuick.add(mesh(lance, alu, [(-0.41 + D.sideNozzleX) / 2, D.sideJetY, Z]));
  const insertRing = new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.45 });
  injQuick.add(cylX(0.016, 0.012, insertRing, D.sideNozzleX - 0.005, D.sideJetY, Z, 24));
  // bayonet collar outside the wall + two lugs
  injQuick.add(cylX(0.048, 0.02, insertRing, -0.44, D.sideJetY, Z, 6));
  for (const s of [-1, 1]) {
    injQuick.add(mesh(new THREE.BoxGeometry(0.02, 0.012, 0.03), MAT.inox(), [-0.455, D.sideJetY + s * 0.05, Z]));
  }
  injQuick.add(mesh(new THREE.BoxGeometry(0.008, 0.1, 0.1), alu, [-0.294, D.sideJetY, Z]));
  machine.add(injQuick);

  // --- V2 jet deflectors (fail-safe): two blades on shafts, linked to a spring + solenoid on the rear
  const defl = group('deflector');
  const blade = (len: number) => {
    const g = new THREE.BoxGeometry(len, 0.004, 0.05);
    g.translate(len / 2, 0, 0);
    return g;
  };
  const deflectorTop = group('deflector-top', [-0.17, 0.4, Z]);
  deflectorTop.add(mesh(blade(0.088), MAT.inox()));
  deflectorTop.add(cylX(0.004, 0.088, MAT.inox(), 0.044, -0.004, 0.025, 8)); // curled lip
  const deflectorSide = group('deflector-side', [-0.17, 0.05, Z]);
  deflectorSide.add(mesh(blade(0.093), MAT.inox()));
  defl.add(deflectorTop, deflectorSide);
  for (const y of [0.4, 0.05]) {
    const shaft = new THREE.CylinderGeometry(0.005, 0.005, Z - D.zBack + 0.04, 12);
    shaft.rotateX(Math.PI / 2);
    defl.add(mesh(shaft, MAT.inox(), [-0.17, y, (Z + D.zBack - 0.04) / 2]));
    // lever outside the rear panel
    defl.add(mesh(new THREE.BoxGeometry(0.05, 0.012, 0.006), MAT.steel(), [-0.15, y, D.zBack - 0.03]));
  }
  // link rod, spring and solenoid
  defl.add(mesh(new THREE.BoxGeometry(0.006, 0.35, 0.004), MAT.steel(), [-0.125, 0.225, D.zBack - 0.035]));
  const spring = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      Array.from(
        { length: 60 },
        (_, i) =>
          new THREE.Vector3(
            -0.09 + Math.cos(i * 0.9) * 0.008,
            0.28 + i * 0.0015,
            D.zBack - 0.035 + Math.sin(i * 0.9) * 0.008,
          ),
      ),
    ),
    120,
    0.0012,
    5,
  );
  defl.add(mesh(spring, MAT.steel()));
  defl.add(mesh(new THREE.BoxGeometry(0.03, 0.045, 0.03), MAT.steelBlack(), [-0.09, 0.2, D.zBack - 0.04]));
  defl.add(mesh(new THREE.BoxGeometry(0.02, 0.006, 0.02), MAT.copper(), [-0.09, 0.226, D.zBack - 0.04]));
  machine.add(defl);

  // --- V2 automatic air-release valve on the high point of the gooseneck
  const air = group('air-valve', [-0.48, 0.7 + R50, Z]);
  air.add(cylY(0.012, 0.02, MAT.brass(), 0, 0.01, 0, 6));
  air.add(cylY(0.022, 0.05, MAT.brass(), 0, 0.045, 0, 32));
  air.add(cylY(0.024, 0.012, MAT.printBlack(), 0, 0.075, 0, 32));
  air.add(cylY(0.003, 0.012, MAT.inox(), 0, 0.087, 0, 8));
  machine.add(air);

  // --- V2 pressure transducer (4–20 mA) on the gauge tee, facing the back
  const tx = group('pressure-transducer', [-0.82, Y, Z - 0.05]);
  const txBody = new THREE.CylinderGeometry(0.011, 0.011, 0.05, 24);
  txBody.rotateX(Math.PI / 2);
  tx.add(mesh(txBody, MAT.inox(), [0, 0, -0.03]));
  const m12 = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 16);
  m12.rotateX(Math.PI / 2);
  tx.add(mesh(m12, MAT.printBlack(), [0, 0, -0.065]));
  const transducerLed = emissive(0x39d353, 0);
  tx.add(mesh(new THREE.SphereGeometry(0.0022, 8, 6), transducerLed, [0, 0.011, -0.04]));
  sensors.add(tx);

  reg.add('penstock-end', pen, new THREE.Vector3(-0.65, 0, 0));
  reg.add('valve-main', main.g, new THREE.Vector3(-0.45, 0.22, 0));
  reg.add('manifold', manifold, new THREE.Vector3(-0.3, 0.32, 0));
  reg.add('valve-branch', valves, new THREE.Vector3(-0.32, 0.36, 0.16));
  reg.add('gauge', gauge, new THREE.Vector3(-0.3, 0.62, 0));
  reg.add('injector-top', injTop, new THREE.Vector3(0, 0.78, 0));
  reg.add('injector-side', injSide, new THREE.Vector3(-0.42, 0, 0));
  reg.add('injector-quick', injQuick, new THREE.Vector3(-0.42, 0, 0));
  reg.add('deflector', defl, new THREE.Vector3(0, 0.12, 0.45));
  reg.add('air-valve', air, new THREE.Vector3(-0.3, 0.7, 0));

  return {
    mainLever: main.pivot,
    topLever: top.pivot,
    sideLever: side.pivot,
    needle,
    handwheel,
    gaugeNeedle,
    deflectorTop,
    deflectorSide,
    insertRing,
    sideInsertRing,
    transducerLed,
    pipeCut,
  };
}
