import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { emissive, MAT, pmma } from '../materials';
import type { PartRegistry } from '../registry';
import { canvasTexture, group, mesh } from '../util';
import { D, profile, profileShape } from './dims';

// Enclosure and support: base plate with drain, PMMA partition and window, EPDM gaskets,
// vented rear panel, folded marine-aluminium cover; V1 trestles + beams, V2 aluminium
// skid, toggle latches and the IP65 controller box.

export interface Housing {
  /** Meshes cut by the "housing" clipping plane in cutaway mode. */
  houseCut: THREE.Object3D[];
  boxLeds: THREE.MeshStandardMaterial[];
}

const depth = D.zFront - D.zBack;

/** Closed ring between a shape outline and the same outline inset by `width`. */
function frameShape(outer: THREE.Vector2[], inner: THREE.Vector2[]): THREE.Shape {
  const s = new THREE.Shape(outer);
  s.holes.push(new THREE.Path([...inner].reverse()));
  return s;
}

function buildBase(): THREE.Group {
  const g = group('base');
  // black HDPE plate with the drain opening under the wet chamber
  const w = D.W / 2 + 0.02;
  const s = new THREE.Shape();
  s.moveTo(-w, D.zBack - 0.02);
  s.lineTo(w, D.zBack - 0.02);
  s.lineTo(w, D.zFront + 0.02);
  s.lineTo(-w, D.zFront + 0.02);
  s.lineTo(-w, D.zBack - 0.02);
  const hole = new THREE.Path();
  hole.moveTo(-0.2, 0.05);
  hole.lineTo(-0.2, 0.128);
  hole.lineTo(0.2, 0.128);
  hole.lineTo(0.2, 0.05);
  hole.lineTo(-0.2, 0.05);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: D.baseT, bevelEnabled: false });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, D.baseT, 0);
  const plate = mesh(geo, MAT.printBlack());
  g.add(plate);
  // drain funnel under the opening (stainless)
  const funnel = new THREE.CylinderGeometry(0.2, 0.12, 0.08, 4, 1, true);
  funnel.rotateY(Math.PI / 4);
  funnel.scale(1.4, 1, 0.27);
  const f = mesh(funnel, MAT.inox(), [0, -0.04, 0.089]);
  (f.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(f);
  // aluminium angles along both long edges where the cover is screwed
  for (const z of [D.zBack + 0.004, D.zFront - 0.004]) {
    g.add(mesh(new THREE.BoxGeometry(D.W, 0.02, 0.003), MAT.aluDark(), [0, D.baseT + 0.01, z]));
  }
  // splash ramp inside the wet chamber guiding water to the drain
  const ramp = new THREE.BoxGeometry(D.W - 0.02, 0.004, 0.06);
  for (const s2 of [-1, 1]) {
    const r = mesh(ramp, MAT.printBlack(), [0, D.baseT + 0.018, 0.09]);
    r.scale.x = 0.15;
    r.position.x = s2 * 0.245;
    r.rotation.z = s2 * 0.5;
    g.add(r);
  }
  return g;
}

function buildPartition(): THREE.Mesh {
  const s = profileShape(D.sheet);
  const hole = new THREE.Path();
  hole.absarc(0, D.axisY, 0.025, 0, Math.PI * 2, true);
  s.holes.push(hole);
  // passages for the V2 deflector shafts (harmless on V1)
  for (const y of [0.4, 0.05]) {
    const h = new THREE.Path();
    h.absarc(-0.17, y, 0.007, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: D.partT, bevelEnabled: false, curveSegments: 32 });
  geo.translate(0, 0, D.zPart - D.partT / 2);
  const mat = pmma(0.18);
  mat.color.set(0xcfe6ee);
  const m = mesh(geo, mat);
  // transparent plates neither cast nor receive shadows (avoids dithered patches)
  m.castShadow = m.receiveShadow = false;
  m.userData.noShadow = true;
  return m;
}

function buildWindow(): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(profileShape(D.sheet), { depth: 0.008, bevelEnabled: false });
  geo.translate(0, 0, D.zFront - D.sheet - 0.008);
  const m = mesh(geo, pmma(0.1));
  m.castShadow = m.receiveShadow = false;
  m.userData.noShadow = true;
  return m;
}

function buildGaskets(): THREE.Group {
  const g = group('gasket');
  const outer = profile(D.sheet);
  const inner = profile(D.sheet + 0.008, true);
  const geo = new THREE.ExtrudeGeometry(frameShape(outer, inner), { depth: 0.003, bevelEnabled: false });
  const front = mesh(geo, MAT.epdm(), [0, 0, D.zFront - D.sheet - 0.011]);
  const back = mesh(geo, MAT.epdm(), [0, 0, D.zBack + D.sheet + 0.008]);
  g.add(front, back);
  return g;
}

function louvreTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1e1f22';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a3c40';
    for (let y = 8; y < h; y += 14) ctx.fillRect(6, y, w - 12, 6);
  }).texture;
}

function buildRearPanel(): THREE.Group {
  const g = group('rear-panel');
  const s = profileShape(D.sheet);
  const round = new THREE.Path();
  round.absarc(-0.15, 0.2, 0.045, 0, Math.PI * 2, true);
  s.holes.push(round);
  const rect = new THREE.Path();
  rect.moveTo(0.13, 0.27);
  rect.lineTo(0.13, 0.34);
  rect.lineTo(0.21, 0.34);
  rect.lineTo(0.21, 0.27);
  rect.lineTo(0.13, 0.27);
  s.holes.push(rect);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments: 32 });
  geo.translate(0, 0, D.zBack + D.sheet);
  g.add(mesh(geo, MAT.printBlack()));
  // grilles behind the vents
  const lv = new THREE.MeshStandardMaterial({ map: louvreTexture(), roughness: 0.7 });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.046, 32), lv);
  disc.position.set(-0.15, 0.2, D.zBack + D.sheet + 0.003);
  disc.rotation.y = Math.PI;
  const ring = new THREE.TorusGeometry(0.048, 0.004, 8, 40);
  g.add(disc, mesh(ring, MAT.printBlack(), [-0.15, 0.2, D.zBack + D.sheet - 0.001]));
  const rc = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.07), lv);
  rc.position.set(0.17, 0.305, D.zBack + D.sheet + 0.003);
  rc.rotation.y = Math.PI;
  g.add(rc);
  // bearing-3 boss on the inside + grease cap outside
  const boss = new THREE.CylinderGeometry(0.032, 0.034, 0.02, 40);
  boss.rotateX(Math.PI / 2);
  g.add(mesh(boss, MAT.printBlack(), [0, D.axisY, D.zBack + D.sheet + 0.016]));
  const cap = new THREE.CylinderGeometry(0.02, 0.022, 0.012, 32);
  cap.rotateX(Math.PI / 2);
  g.add(mesh(cap, MAT.inox(), [0, D.axisY, D.zBack - 0.004]));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const bolt = new THREE.CylinderGeometry(0.004, 0.004, 0.005, 6);
    bolt.rotateX(Math.PI / 2);
    g.add(mesh(bolt, MAT.inox(), [Math.cos(a) * 0.04, D.axisY + Math.sin(a) * 0.04, D.zBack - 0.001]));
  }
  return g;
}

/** Folded 2 mm aluminium 5083 cover: sides + slopes + roof, with return lips front and back. */
function buildCover(): THREE.Group {
  const g = group('cover');
  const outer = profile(0);
  const inner = profile(D.sheet);
  // shell: open polyline (no bottom) extruded along Z
  const shell = new THREE.Shape();
  const o = outer.slice(1).concat([outer[0]]); // start at bottom-right, go round to bottom-left
  const iRev = inner.slice(1).concat([inner[0]]).reverse();
  shell.moveTo(o[0].x, o[0].y);
  for (let k = 1; k < o.length; k++) shell.lineTo(o[k].x, o[k].y);
  shell.lineTo(iRev[0].x, iRev[0].y);
  for (let k = 1; k < iRev.length; k++) shell.lineTo(iRev[k].x, iRev[k].y);
  shell.lineTo(o[0].x, o[0].y);
  const geo = new THREE.ExtrudeGeometry(shell, { depth, bevelEnabled: false });
  geo.translate(0, 0, D.zBack);
  const alu = MAT.alu();
  g.add(mesh(geo, alu));
  // return lips framing the window and the rear panel
  const lipGeo = new THREE.ExtrudeGeometry(frameShape(outer, profile(D.lip, true)), {
    depth: D.sheet,
    bevelEnabled: false,
  });
  g.add(mesh(lipGeo, alu, [0, 0, D.zFront - D.sheet]));
  g.add(mesh(lipGeo, alu, [0, 0, D.zBack]));
  // stainless screws along the lips (A4 M5 button heads)
  const head = new THREE.SphereGeometry(0.0045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  head.rotateX(Math.PI / 2);
  const screwMat = MAT.inox();
  const pts = profile(D.lip / 2);
  const screws = new THREE.InstancedMesh(head, screwMat, 64);
  let n = 0;
  const m = new THREE.Matrix4();
  for (const [z, flip] of [
    [D.zFront + 0.0005, 0],
    [D.zBack - 0.0005, Math.PI],
  ] as [number, number][]) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (i === pts.length - 1) continue;
      const len = a.distanceTo(b);
      const count = Math.max(1, Math.round(len / 0.07));
      for (let k = 0; k <= count && n < 64; k++) {
        const p = a.clone().lerp(b, k / count);
        m.makeRotationY(flip).setPosition(p.x, p.y, z);
        screws.setMatrixAt(n++, m);
      }
    }
  }
  screws.count = n;
  g.add(screws);
  // a discreet stamped label plate on the side
  const label = canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#d7dbdf';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a2f36';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('PELTON µ-HYDRO', 14, 38);
    ctx.font = '18px monospace';
    ctx.fillText('H 21–76 m · Q 0.7–4 L/s', 14, 66);
    ctx.fillText('48 V DC · 1500 tr/min', 14, 88);
  }).texture;
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.0375),
    new THREE.MeshStandardMaterial({ map: label, metalness: 0.6, roughness: 0.4 }),
  );
  plate.position.set(D.W / 2 + 0.0005, 0.16, -0.08);
  plate.rotation.y = Math.PI / 2;
  g.add(plate);
  return g;
}

function buildTrestles(): THREE.Group {
  const g = group('trestles');
  const red = MAT.redPaint();
  const top = D.baseY - 0.15;
  for (const z of [-0.5, 0.5]) {
    // top bar + 4 splayed legs (folding trestle)
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.05), red, [0, top - 0.02, z]));
    for (const x of [-0.36, 0.36]) {
      for (const s of [-1, 1]) {
        const leg = new THREE.BoxGeometry(0.035, top, 0.035);
        const l = mesh(leg, red, [x, top / 2 - 0.02, z + s * 0.1]);
        l.rotation.x = s * 0.24;
        g.add(l);
      }
    }
    g.add(mesh(new THREE.BoxGeometry(0.75, 0.025, 0.02), red, [0, 0.3, z + 0.07]));
  }
  // two wooden beams (madriers 75 × 150) across the trestles, under the base plate
  const wood = MAT.wood();
  for (const x of [-0.25, 0.25]) {
    g.add(mesh(new THREE.BoxGeometry(0.075, 0.15, 1.5), wood, [x, D.baseY - 0.075, 0]));
  }
  // lag screws holding the base
  for (const x of [-0.25, 0.25]) {
    for (const z of [-0.15, 0.15]) {
      g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 6), MAT.zinc(), [x, D.baseY + D.baseT + 0.003, z]));
    }
  }
  return g;
}

function buildSkid(): THREE.Group {
  const g = group('skid');
  const alu = MAT.alu();
  const prof = (len: number, axis: 'x' | 'y' | 'z') =>
    new THREE.BoxGeometry(axis === 'x' ? len : 0.04, axis === 'y' ? len : 0.04, axis === 'z' ? len : 0.04);
  const top = D.baseY - 0.03;
  const xs = [-0.3, 0.3];
  const zs = [-0.22, 0.22];
  for (const x of xs) for (const z of zs) g.add(mesh(prof(top - 0.06, 'y'), alu, [x, (top - 0.06) / 2 + 0.06, z]));
  for (const y of [top, 0.25]) {
    for (const z of zs) g.add(mesh(prof(0.64, 'x'), alu, [0, y, z]));
    for (const x of xs) g.add(mesh(prof(0.4, 'z'), alu, [x, y, 0]));
  }
  // diagonal braces on the sides
  for (const z of zs) {
    const b = mesh(prof(0.75, 'x'), alu, [0, (top + 0.25) / 2, z]);
    b.rotation.z = Math.atan2(top - 0.25, 0.6);
    b.scale.y = 0.6;
    g.add(b);
  }
  // levelling feet + anti-vibration mounts under the base
  for (const x of xs) {
    for (const z of zs) {
      g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 8), MAT.zinc(), [x, 0.035, z]));
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 24), MAT.rubber(), [x, 0.006, z]));
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.022, 20), MAT.rubber(), [x * 0.85, top + 0.031, z * 0.85]));
    }
  }
  // lifting eyes
  for (const x of xs) {
    const eye = new THREE.TorusGeometry(0.018, 0.004, 8, 20);
    g.add(mesh(eye, MAT.inox(), [x, top + 0.035, 0]));
  }
  // stainless tailrace funnel
  const funnel = new THREE.CylinderGeometry(0.16, 0.06, 0.18, 4, 1, true);
  funnel.rotateY(Math.PI / 4);
  funnel.scale(1.3, 1, 0.45);
  const f = mesh(funnel, MAT.inox(), [0, top - 0.11, 0.09]);
  (f.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(f);
  return g;
}

function buildLatches(): THREE.Group {
  const g = group('latches');
  const inox = MAT.inox();
  for (const x of [-1, 1]) {
    for (const z of [-0.11, 0.11]) {
      const latch = group('latch', [x * (D.W / 2 + 0.006), 0.07, z]);
      latch.add(mesh(new THREE.BoxGeometry(0.006, 0.04, 0.03), inox));
      latch.add(mesh(new THREE.BoxGeometry(0.01, 0.012, 0.024), inox, [x * 0.004, 0.022, 0]));
      const hook = new THREE.TorusGeometry(0.008, 0.0015, 6, 16, Math.PI);
      latch.add(mesh(hook, inox, [x * 0.002, -0.03, 0], [0, Math.PI / 2, Math.PI]));
      // keeper on the base
      latch.add(mesh(new THREE.BoxGeometry(0.008, 0.012, 0.02), inox, [x * 0.004, -0.05, 0]));
      g.add(latch);
    }
  }
  return g;
}

function buildControllerBox(): { g: THREE.Group; leds: THREE.MeshStandardMaterial[] } {
  const g = group('controller-box', [0.45, D.baseY - 0.36, -0.05]);
  const box = new RoundedBoxGeometry(0.2, 0.26, 0.13, 3, 0.012);
  g.add(mesh(box, MAT.enclosureGrey()));
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.23), pmma(0.3));
  door.position.set(0, 0, 0.0655);
  g.add(door);
  // DIN rail modules visible through the door
  g.add(mesh(new THREE.BoxGeometry(0.17, 0.035, 0.01), MAT.zinc(), [0, 0.05, 0.03]));
  const modules: [number, number, THREE.Material][] = [
    [-0.06, 0.035, MAT.printWhite()], // DC breaker
    [-0.02, 0.035, MAT.printGrey()], // surge arrester
    [0.025, 0.05, MAT.printBlack()], // rectifier / relay
    [0.07, 0.03, MAT.printWhite()],
  ];
  for (const [x, w, mat] of modules) g.add(mesh(new THREE.BoxGeometry(w, 0.08, 0.05), mat, [x, 0.05, 0.04]));
  g.add(
    mesh(
      new THREE.BoxGeometry(0.06, 0.004, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x1f5f3a, roughness: 0.5 }),
      [-0.04, -0.06, 0.04],
    ),
  ); // ESP32 board
  const leds = [emissive(0x39d353, 0), emissive(0xffb020, 0), emissive(0xe5322d, 0)];
  leds.forEach((m, i) => g.add(mesh(new THREE.SphereGeometry(0.004, 10, 8), m, [0.04 + i * 0.016, -0.06, 0.06])));
  // cable glands + IP68 connector
  for (const x of [-0.05, 0, 0.05]) {
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.02, 6), MAT.pvcDark(), [x, -0.14, 0]));
  }
  // bracket to the skid leg
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.2, 0.01), MAT.alu(), [-0.12, 0, -0.06]));
  return { g, leds };
}

export function buildHousing(root: THREE.Object3D, machine: THREE.Object3D, reg: PartRegistry): Housing {
  const base = buildBase();
  const partition = group('partition');
  partition.add(buildPartition());
  const win = group('window');
  win.add(buildWindow());
  const gaskets = buildGaskets();
  const rear = buildRearPanel();
  const cover = buildCover();
  const latches = buildLatches();
  machine.add(base, partition, win, gaskets, rear, cover, latches);

  const trestles = buildTrestles();
  const skid = buildSkid();
  const box = buildControllerBox();
  root.add(trestles, skid, box.g);

  reg.add('base', base, new THREE.Vector3(0, 0, 0));
  reg.add('partition', partition, new THREE.Vector3(0, 0, 0.02));
  reg.add('window', win, new THREE.Vector3(0, 0, 0.62));
  reg.add('gasket', gaskets, new THREE.Vector3(0, 0, 0.0), (f) => {
    gaskets.children[0].position.z = D.zFront - D.sheet - 0.011 + f * 0.5;
    gaskets.children[1].position.z = D.zBack + D.sheet + 0.008 - f * 0.62;
  });
  reg.add('rear-panel', rear, new THREE.Vector3(0, 0, -0.72));
  reg.add('cover', cover, new THREE.Vector3(0, 0.58, 0));
  reg.add('latches', latches, new THREE.Vector3(0, 0.3, 0));
  reg.add('trestles', trestles, new THREE.Vector3(0, 0, 0));
  reg.add('skid', skid, new THREE.Vector3(0, 0, 0));
  reg.add('controller-box', box.g, new THREE.Vector3(0.3, 0, 0));

  return { houseCut: [cover, rear, partition, win, gaskets, base], boxLeds: box.leds };
}
