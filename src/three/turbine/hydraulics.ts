import * as THREE from 'three';
import { emissive, glass, MAT } from '../materials';
import type { PartRegistry } from '../registry';
import { canvasTexture, group, mesh, pipeAlong } from '../util';
import { D } from './dims';
import { DEFLECTOR } from './housing';

// Water side of the machine: HDPE inlet + compression fitting, main ball valve, gauge tee,
// manifold (gooseneck to the top spear injector, lower branch to the side nozzle),
// branch valves, injectors, and the V2 extras (quick-change nozzle, jet deflector, air valve).

const R63 = 0.0315;
const R50 = 0.025;
const Y = D.inletY;
const Z = D.pipeZ;
/** Gooseneck crest and the height of the top injector's side inlet. */
export const RISER_TOP = 0.6;
export const TOP_INLET_Y = D.roof + 0.1;

export interface Hydraulics {
  mainLever: THREE.Object3D;
  bypassLever: THREE.Object3D;
  topLever: THREE.Object3D;
  sideLever: THREE.Object3D;
  needle: THREE.Object3D;
  handwheel: THREE.Object3D;
  gaugeNeedle: THREE.Object3D;
  /** Put the deflector linkage at e (0 latched .. 1 tripped). */
  setDeflector: (e: number) => void;
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

/**
 * Extension spring between two pins, along +X from the origin: straight leads leaving the hook
 * loops and a coiled body. Rebuilt when its length changes (no scaling, so the wire stays round).
 */
function springGeometry(len: number): THREE.BufferGeometry {
  const lead = 0.006;
  const coils = 8;
  const r = 0.005;
  const body = Math.max(0.005, len - 2 * lead);
  const pts: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  for (let i = 0; i <= 220; i++) {
    const t = i / 220;
    const a = t * coils * Math.PI * 2;
    // the first and last half turn blend from the axis to the coil radius
    const k = Math.min(1, t * 2 * coils, (1 - t) * 2 * coils);
    pts.push(new THREE.Vector3(lead + t * body, Math.sin(a) * r * k, (1 - Math.cos(a)) * r * 0.5 * k));
  }
  pts.push(new THREE.Vector3(len, 0, 0));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 260, 0.0011, 6, false);
}

/**
 * Deflector blades + the linkage outside the rear panel. Returns the kinematic update. Everything
 * lives in the `deflector` part group (machine coordinates).
 */
function buildDeflector(defl: THREE.Group): (e: number) => void {
  const inox = MAT.inox();
  const steel = MAT.steel();
  // layers behind the rear panel, from the panel outwards
  const zLever = D.zBack - 0.012;
  const zRod = D.zBack - 0.0175;
  const zSpring = D.zBack - 0.024;
  const zClip = D.zBack - 0.0275;
  const pinR = 0.0028;
  const loopR = 0.0045;
  const zAxis = (geo: THREE.BufferGeometry) => geo.rotateX(Math.PI / 2);

  const blades = DEFLECTOR.pivots.map(([x, y], i) => {
    const b = group(i ? 'deflector-side' : 'deflector-top', [x, y, Z]);
    const len = DEFLECTOR.blade[i];
    const plate = new THREE.BoxGeometry(len, 0.004, 0.05);
    plate.translate(len / 2, 0, 0);
    b.add(mesh(plate, inox));
    // hub clamped on the shaft
    b.add(mesh(zAxis(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 16)), inox));
    defl.add(b);
    return b;
  });
  // shafts through the partition and the rear panel: a flanged bronze bushing screwed on the
  // wet side of the partition carries each cantilevered blade, a second one sits in the panel
  const zWet = D.zPart + D.partT / 2;
  for (const [x, y] of DEFLECTOR.pivots) {
    const len = Z - zLever + 0.006;
    defl.add(mesh(zAxis(new THREE.CylinderGeometry(0.005, 0.005, len, 12)), inox, [x, y, Z - len / 2]));
    defl.add(mesh(zAxis(new THREE.CylinderGeometry(0.015, 0.015, 0.003, 24)), MAT.brass(), [x, y, zWet + 0.0015]));
    defl.add(mesh(zAxis(new THREE.CylinderGeometry(0.0085, 0.0085, 0.016, 20)), MAT.brass(), [x, y, zWet + 0.011]));
    for (const a of [Math.PI / 4, (5 * Math.PI) / 4]) {
      const screw = zAxis(new THREE.CylinderGeometry(0.0022, 0.0022, 0.002, 8));
      defl.add(mesh(screw, inox, [x + Math.cos(a) * 0.0115, y + Math.sin(a) * 0.0115, zWet + 0.004]));
    }
    // shaft collar against the blade hub
    defl.add(mesh(zAxis(new THREE.CylinderGeometry(0.0085, 0.0085, 0.006, 16)), steel, [x, y, Z - 0.028]));
    defl.add(
      mesh(zAxis(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 16)), MAT.printBlack(), [x, y, D.zBack - 0.003]),
    );
  }
  // levers keyed on the shafts (they turn with the blades)
  const levers = DEFLECTOR.pivots.map(([x, y], i) => {
    const g = group('deflector-lever', [x, y, zLever]);
    const L = DEFLECTOR.lever[i];
    const arm = new THREE.BoxGeometry(L, 0.01, 0.005);
    arm.translate(L / 2, 0, 0);
    g.add(mesh(arm, steel));
    g.add(mesh(zAxis(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 16)), steel));
    g.add(mesh(zAxis(new THREE.CylinderGeometry(0.005, 0.005, 0.005, 12)), steel, [L, 0, 0]));
    defl.add(g);
    return g;
  });
  // catch tooth under the end of the side lever: it rests on the solenoid plunger while latched
  levers[1].add(mesh(new THREE.BoxGeometry(0.006, 0.006, 0.005), steel, [DEFLECTOR.lever[1] - 0.003, -0.0075, 0]));

  // link rod (unit length, stretched between the lever pins) and the pins with their circlips
  const rod = mesh(new THREE.BoxGeometry(1, 0.007, 0.004), MAT.zinc());
  rod.position.z = zRod;
  defl.add(rod);
  const pinLen = zLever + 0.003 - zClip;
  const pinGeo = zAxis(new THREE.CylinderGeometry(pinR, pinR, pinLen, 10));
  const clipGeo = zAxis(new THREE.CylinderGeometry(0.0045, 0.0045, 0.0012, 12));
  const pins = [0, 1].map(() => {
    const p = group('deflector-pin');
    p.add(mesh(pinGeo, inox, [0, 0, zClip + pinLen / 2]), mesh(clipGeo, MAT.steelBlack(), [0, 0, zClip + 0.0006]));
    defl.add(p);
    return p;
  });

  // tension spring: one hook on a post bolted to the rear panel, the other on the side lever pin
  const [ax, ay] = DEFLECTOR.springAnchor;
  const post = group('spring-post', [ax, ay, D.zBack]);
  post.add(mesh(new THREE.BoxGeometry(0.016, 0.034, 0.003), MAT.alu(), [0, 0, -0.0015]));
  const bolt = zAxis(new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 6));
  post.add(mesh(bolt, inox, [0, 0.011, -0.0045]), mesh(bolt, inox, [0, -0.011, -0.0045]));
  const studLen = -(zClip - D.zBack);
  post.add(mesh(zAxis(new THREE.CylinderGeometry(pinR, pinR, studLen, 10)), inox, [0, 0, -studLen / 2]));
  post.add(mesh(clipGeo, MAT.steelBlack(), [0, 0, zClip - D.zBack + 0.0006]));
  defl.add(post);
  const loopGeo = new THREE.TorusGeometry(loopR, 0.0011, 6, 20);
  const loops = [0, 1].map(() => {
    const m = mesh(loopGeo, MAT.zinc());
    m.position.z = zSpring;
    defl.add(m);
    return m;
  });
  loops[0].position.x = ax;
  loops[0].position.y = ay;
  const spring = mesh(springGeometry(0.1), MAT.zinc());
  spring.position.z = zSpring;
  defl.add(spring);
  let springLen = 0;

  // 12 V solenoid latch on its bracket; the plunger slides out under the catch tooth
  const sol = group('solenoid', [-0.08, 0.1005, D.zBack]);
  sol.add(mesh(new THREE.BoxGeometry(0.034, 0.042, 0.003), MAT.alu(), [0.002, 0, -0.0015]));
  sol.add(mesh(new THREE.BoxGeometry(0.024, 0.03, 0.024), MAT.steelBlack(), [0, 0, -0.015]));
  sol.add(mesh(new THREE.BoxGeometry(0.016, 0.004, 0.02), MAT.copper(), [0, 0.017, -0.015]));
  for (const dy of [-0.016, 0.016]) sol.add(mesh(bolt, inox, [0.014, dy, -0.0045]));
  const plungerGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 1, 10);
  plungerGeo.rotateZ(Math.PI / 2);
  plungerGeo.translate(-0.5, 0, 0);
  const plunger = mesh(plungerGeo, inox, [-0.012, 0, zLever - D.zBack]);
  sol.add(plunger);
  defl.add(sol);

  const deg = Math.PI / 180;
  const ends = [new THREE.Vector2(), new THREE.Vector2()];
  const u = new THREE.Vector2();
  return (e: number) => {
    DEFLECTOR.pivots.forEach(([x, y], i) => {
      const a = THREE.MathUtils.lerp(DEFLECTOR.latched[i], DEFLECTOR.tripped[i], e) * deg;
      blades[i].rotation.z = a;
      const la = a + DEFLECTOR.leverOffset[i] * deg;
      levers[i].rotation.z = la;
      ends[i].set(x + DEFLECTOR.lever[i] * Math.cos(la), y + DEFLECTOR.lever[i] * Math.sin(la));
      pins[i].position.set(ends[i].x, ends[i].y, 0);
    });
    u.subVectors(ends[1], ends[0]);
    rod.position.set((ends[0].x + ends[1].x) / 2, (ends[0].y + ends[1].y) / 2, zRod);
    rod.rotation.z = Math.atan2(u.y, u.x);
    rod.scale.x = u.length() + 0.01;
    // spring from the anchor loop to the loop on the side pin
    loops[1].position.set(ends[1].x, ends[1].y, zSpring);
    u.set(ends[1].x - ax, ends[1].y - ay);
    const len = u.length() - 2 * loopR;
    spring.rotation.z = Math.atan2(u.y, u.x);
    u.normalize();
    spring.position.set(ax + u.x * loopR, ay + u.y * loopR, zSpring);
    if (Math.abs(len - springLen) > 0.0005) {
      spring.geometry.dispose();
      spring.geometry = springGeometry(len);
      springLen = len;
    }
    // the plunger pulls back first, then the spring trips the linkage
    plunger.scale.x = THREE.MathUtils.lerp(0.0205, 0.006, Math.min(1, e * 4));
  };
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
      new THREE.Vector3(-0.62, RISER_TOP, Z),
      new THREE.Vector3(-0.3, RISER_TOP, Z),
      new THREE.Vector3(-0.3, TOP_INLET_Y, Z),
      new THREE.Vector3(D.topJetX - 0.045, TOP_INLET_Y, Z),
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
    [-0.62, 0.37, 'y'],
    [-0.45, RISER_TOP, 'x'],
    [-0.22, TOP_INLET_Y, 'x'],
    [-0.5, D.sideJetY, 'x'],
  ] as [number, number, 'x' | 'y'][]) {
    manifold.add(ax === 'x' ? cylX(R50 * 1.15, 0.03, grey, x, y) : cylY(R50 * 1.15, 0.03, grey, x, y));
  }
  machine.add(manifold);
  pipeCut.push(manifold);

  // --- bypass / drain branch (maker's layout): between the gauge and the injector valves, it
  // flushes the penstock and purges air without sending water through the runner
  const bypass = group('valve-bypass');
  const BX = -0.745;
  bypass.add(cylX(R63 * 1.12, 0.06, grey, BX, Y));
  bypass.add(
    pipeAlong(
      [new THREE.Vector3(BX, Y, Z), new THREE.Vector3(BX, -0.42, Z), new THREE.Vector3(BX + 0.12, -0.48, Z)],
      0.02,
      grey,
      { bend: 0.05, radialSegments: 20 },
    ),
  );
  const bp = ballValve(MAT.pvcDark(), 'y');
  bp.g.scale.setScalar(0.7);
  bp.g.position.set(BX, 0.08, Z);
  bypass.add(bp.g);
  machine.add(bypass);
  pipeCut.push(bypass);

  // --- branch valves: red on the riser (top injector), blue on the lower branch (side injector)
  const valves = group('valve-branch');
  const top = ballValve(MAT.pvcRed(), 'y');
  top.g.scale.setScalar(0.82);
  top.g.position.set(-0.62, 0.47, Z);
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
  const bodyBot = D.roof + 0.01;
  const bodyTop = bodyBot + 0.17;
  injTop.add(cylY(0.032, bodyTop - bodyBot, white, D.topJetX, (bodyTop + bodyBot) / 2, Z, 40));
  const cone = new THREE.CylinderGeometry(0.032, 0.011, bodyBot - D.topNozzleY - 0.006, 40);
  injTop.add(mesh(cone, white, [D.topJetX, (bodyBot + D.topNozzleY + 0.006) / 2, Z]));
  injTop.add(cylY(0.012, 0.008, MAT.inox(), D.topJetX, D.topNozzleY + 0.004, Z, 24)); // stainless nozzle tip
  injTop.add(cylX(0.026, 0.035, white, D.topJetX - 0.045, TOP_INLET_Y, Z)); // side inlet
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
  needle.add(cylY(0.0045, 0.24, MAT.inox(), 0, D.topNozzleY + 0.135, 0, 12));
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
  injSide.add(mesh(new THREE.BoxGeometry(0.008, 0.09, 0.09), grey3d, [D.x0 - 0.004, D.sideJetY, Z]));
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
  injQuick.add(mesh(new THREE.BoxGeometry(0.008, 0.1, 0.1), alu, [D.x0 - 0.004, D.sideJetY, Z]));
  machine.add(injQuick);

  // --- V2 jet deflectors (fail-safe): two blades on shafts; outside the rear panel, a lever
  // on each shaft, a link rod, a tension spring pulling towards "tripped" and a solenoid
  // latch holding the linkage while it is powered
  const defl = group('deflector');
  const setDeflector = buildDeflector(defl);
  machine.add(defl);

  // --- V2 automatic air-release valve on the high point of the gooseneck
  const air = group('air-valve', [-0.46, RISER_TOP + R50, Z]);
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
  reg.add('valve-bypass', bypass, new THREE.Vector3(-0.25, -0.15, 0.2));
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
    bypassLever: bp.pivot,
    topLever: top.pivot,
    sideLever: side.pivot,
    needle,
    handwheel,
    gaugeNeedle,
    setDeflector,
    insertRing,
    sideInsertRing,
    transducerLed,
    pipeCut,
  };
}
