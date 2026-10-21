import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import { MAT } from '../materials';
import { canvasTexture, clamp, lerp, mesh, pipeAlong, rng } from '../util';
import { DEG, hex, noShadow, smooth } from './common';
import { bedAt, streamFrame } from './layout';
import { waterSheet, type WaterUniforms } from './water';

// Coanda intake (site B style, s09/s10): a small pond held by a dry-stone slate weir, and a
// wooden Coanda box with a curved stainless wedge-wire screen set in the weir. Local frame:
// origin on the nominal bed line, +Z = downstream, +X = east bank (penstock side).

const COANDA_X = 0.25; // box centre across the channel
const R = 0.6; // screen radius
const YC = 0.24 - R; // screen arc centre height (crest at y = 0.24)
const PHI_PLATE = 12 * DEG;
const PHI_END = 55 * DEG;
/** Penstock connection on the outlet, in the coanda group frame. */
const OUTLET = new THREE.Vector3(0.5, -0.3, 0.93);
const MAX_DEBRIS = 90;

const arc = (phi: number, r = R) => new THREE.Vector3(0, YC + r * Math.cos(phi), r * Math.sin(phi));

export interface Intake {
  weir: THREE.Group;
  coanda: THREE.Group;
  weirHotspot: THREE.Object3D;
  coandaHotspot: THREE.Object3D;
  /** Current arc position (m upstream of the turbine). */
  s: number;
  place(s: number): void;
  /** Outlet end (world, assembled position) and its direction. */
  outlet(out?: THREE.Vector3): THREE.Vector3;
  outletDir(out?: THREE.Vector3): THREE.Vector3;
  update(state: SimState, time: number): void;
}

function barsTexture(): THREE.Texture {
  const { texture } = canvasTexture(64, 16, (ctx, w, h) => {
    ctx.fillStyle = '#4a4f55';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const g = ctx.createLinearGradient(i * 8, 0, i * 8 + 6, 0);
      g.addColorStop(0, '#9aa1a8');
      g.addColorStop(0.5, '#f4f6f8');
      g.addColorStop(1, '#b9bfc5');
      ctx.fillStyle = g;
      ctx.fillRect(i * 8, 0, 6, h);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 1);
  return texture;
}

/** Dry-stone weir across the channel, with a gap for the Coanda box. */
function buildWeirStones(): THREE.InstancedMesh {
  const r = rng(77);
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const stones = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.85 }), 160);
  stones.name = 'weir-stones';
  stones.castShadow = true;
  stones.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const c = new THREE.Color();
  const palette = [0x5d6166, 0x6c6a64, 0x4f5459, 0x7a756c, 0x585a52].map(hex);
  let n = 0;
  const add = (x: number, y: number, z: number, w: number, h: number, d: number) => {
    if (n >= 160) return;
    e.set((r() - 0.5) * 0.08, (r() - 0.5) * 0.12, (r() - 0.5) * 0.08);
    m.compose(new THREE.Vector3(x, y, z), q.setFromEuler(e), new THREE.Vector3(w, h, d));
    stones.setMatrixAt(n, m);
    stones.setColorAt(n, c.copy(palette[Math.floor(r() * palette.length)]).multiplyScalar(0.85 + r() * 0.3));
    n++;
  };
  const gap0 = COANDA_X - 0.32;
  const gap1 = COANDA_X + 0.32;
  for (let y = -0.42; y < 0.25;) {
    const h = 0.07 + r() * 0.05;
    let x = -2.3 + r() * 0.2;
    while (x < 2.3) {
      const w = 0.22 + r() * 0.32;
      const cx = x + w / 2;
      // the box occupies the gap down to the bottom; the outlet pipe runs under the east part
      if (cx < gap0 || cx > gap1) add(cx, y + h / 2, (r() - 0.5) * 0.06, w - 0.015, h, 0.42 + r() * 0.12);
      x += w;
    }
    y += h;
  }
  // flat apron stones below the weir, where the overflow lands
  for (let i = 0; i < 9; i++) add(-1.9 + i * 0.45 + r() * 0.1, -0.38, 0.45 + r() * 0.25, 0.4, 0.06, 0.35);
  // rim stones around the pond
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    add(side * (1.75 + r() * 0.35), -0.05 + r() * 0.15, -0.5 - (i >> 1) * 0.45, 0.35, 0.22, 0.4);
  }
  stones.count = n;
  stones.instanceMatrix.needsUpdate = true;
  return stones;
}

function buildCoanda(group: THREE.Group, woodMat: THREE.Material): { debris: THREE.InstancedMesh } {
  // side frames following the screen curve
  const shape = new THREE.Shape();
  shape.moveTo(-0.12, 0.3);
  shape.lineTo(0, 0.3);
  for (let phi = 10 * DEG; phi <= PHI_END + 1e-6; phi += 9 * DEG) {
    const p = arc(phi);
    shape.lineTo(p.z, p.y + 0.05);
  }
  shape.lineTo(0.56, 0.0);
  shape.lineTo(0.56, -0.4);
  shape.lineTo(-0.12, -0.4);
  shape.closePath();
  const sideGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false });
  sideGeo.rotateY(-Math.PI / 2);
  for (const x of [-0.26, 0.305]) group.add(mesh(sideGeo, woodMat, [x, 0, 0]));
  group.add(mesh(new THREE.BoxGeometry(0.6, 0.08, 0.12), woodMat, [0, 0.26, -0.07]));

  const inox = MAT.inox();
  const screenMat = new THREE.MeshStandardMaterial({
    map: barsTexture(),
    metalness: 0.85,
    roughness: 0.32,
    side: THREE.DoubleSide,
  });
  const cyl = (phi0: number, phi1: number, mat: THREE.Material) => {
    const g = new THREE.CylinderGeometry(R, R, 0.52, 24, 1, true, Math.PI / 2 - phi1, phi1 - phi0);
    g.rotateZ(Math.PI / 2);
    g.translate(0, YC, 0);
    return mesh(g, mat);
  };
  group.add(cyl(-2 * DEG, PHI_PLATE, inox), cyl(PHI_PLATE, PHI_END, screenMat));

  // collection box under the screen, brackets, outlet pipe and blue compression fitting
  group.add(mesh(new THREE.BoxGeometry(0.54, 0.3, 0.5), inox, [0, -0.2, 0.25]));
  for (const x of [-0.29, 0.335]) {
    for (const z of [0.08, 0.42]) group.add(mesh(new THREE.BoxGeometry(0.012, 0.09, 0.07), inox, [x, 0.0, z]));
  }
  group.add(
    pipeAlong(
      [
        new THREE.Vector3(0.26, -0.22, 0.3),
        new THREE.Vector3(0.44, -0.22, 0.3),
        new THREE.Vector3(0.5, -0.3, 0.52),
        new THREE.Vector3(0.5, -0.3, 0.8),
      ],
      0.0315,
      inox,
      { bend: 0.1 },
    ),
  );
  const fit = mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.13, 16),
    MAT.pvcBlue(),
    [0.5, -0.3, 0.865],
    [Math.PI / 2, 0, 0],
  );
  group.add(fit);

  // scrubbing brush left on the weir next to the box
  const brush = new THREE.Group();
  brush.add(mesh(new THREE.BoxGeometry(0.24, 0.035, 0.075), MAT.woodLight(), [0, 0.0175, 0]));
  brush.add(
    mesh(
      new THREE.BoxGeometry(0.22, 0.03, 0.065),
      new THREE.MeshStandardMaterial({ color: 0xcbb98f, roughness: 1 }),
      [0, 0.05, 0],
    ),
  );
  brush.position.set(-0.5, 0.29, 0.02);
  brush.rotation.set(0, 0.5, Math.PI);
  group.add(brush);

  // leaves and twigs stuck on the screen (count follows the clogging)
  const r = rng(91);
  const debris = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.045, 0.03),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }),
    MAX_DEBRIS,
  );
  debris.name = 'coanda-debris';
  const leafCols = [0x7a4a22, 0x9a6a2a, 0x5a3a1c, 0xb07a34, 0x6b5a2a].map(hex);
  const nrm = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const spin = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < MAX_DEBRIS; i++) {
    const phi = lerp(PHI_PLATE + 2 * DEG, PHI_END - 2 * DEG, Math.pow(r(), 0.7));
    nrm.set(0, Math.cos(phi), Math.sin(phi));
    const p = arc(phi, R + 0.005);
    p.x = (r() - 0.5) * 0.46;
    q.setFromUnitVectors(zAxis, nrm);
    spin.setFromAxisAngle(nrm, r() * Math.PI * 2);
    const s = 0.6 + r() * 0.9;
    debris.setMatrixAt(i, new THREE.Matrix4().compose(p, spin.multiply(q), new THREE.Vector3(s, s * (0.5 + r()), 1)));
    debris.setColorAt(i, leafCols[Math.floor(r() * leafCols.length)]);
  }
  debris.count = 0;
  debris.castShadow = false;
  debris.userData.noShadow = true;
  group.add(debris);
  return { debris };
}

export function createIntake(): Intake {
  const weir = new THREE.Group();
  weir.name = 'weir';
  const coanda = new THREE.Group();
  coanda.name = 'coanda';

  weir.add(buildWeirStones());
  // pond: an oval sheet behind the weir (the terrain banks cut the rest of its outline)
  const pondPts: THREE.Vector3[] = [];
  const pondW: number[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8; // 0 upstream end .. 1 at the weir
    pondPts.push(new THREE.Vector3(0, 0, -3.3 + t * 3.1));
    pondW.push(0.35 + 1.35 * Math.sqrt(Math.sin(t * Math.PI * 0.62)));
  }
  const pond = waterSheet(pondPts, new THREE.Vector3(1, 0, 0), pondW, { slope: 0, color: 0x4a5236, cols: 7 });
  pond.uniforms.uFoam.value = 0;
  pond.uniforms.uAlphaMin.value = 0.88;
  weir.add(pond.mesh);
  // overflow nappe over the stone crest (west part)
  const nappe = waterSheet(
    [
      new THREE.Vector3(0, 0.28, -0.12),
      new THREE.Vector3(0, 0.3, 0.2),
      new THREE.Vector3(0, 0.12, 0.36),
      new THREE.Vector3(0, -0.15, 0.48),
      new THREE.Vector3(0, -0.36, 0.56),
    ],
    new THREE.Vector3(1, 0, 0),
    1,
    { slope: 0.45 },
  );
  nappe.mesh.position.x = -1.1;
  weir.add(nappe.mesh);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb06a3a, roughness: 0.8 });
  const { debris } = buildCoanda(coanda, woodMat);
  // thin water film on the screen (captured flow) and the excess sliding off the tail
  const filmPts: THREE.Vector3[] = [];
  for (let phi = -6 * DEG; phi <= PHI_END; phi += 4 * DEG) filmPts.push(arc(phi, R + 0.012));
  const film = waterSheet(filmPts, new THREE.Vector3(1, 0, 0), 0.25, { slope: 0.55 });
  const tail = waterSheet(
    [
      arc(PHI_END, R + 0.012),
      new THREE.Vector3(0, -0.07, 0.58),
      new THREE.Vector3(0, -0.22, 0.65),
      new THREE.Vector3(0, -0.4, 0.68),
    ],
    new THREE.Vector3(1, 0, 0),
    0.25,
    { slope: 0.95 },
  );
  coanda.add(film.mesh, tail.mesh);
  const sheets: WaterUniforms[] = [pond.uniforms, nappe.uniforms, film.uniforms, tail.uniforms];

  const weirHotspot = new THREE.Object3D();
  weirHotspot.position.set(-1.2, 0.9, 0);
  weir.add(weirHotspot);
  const coandaHotspot = new THREE.Object3D();
  coandaHotspot.position.set(0, 0.85, 0.2);
  coanda.add(coandaHotspot);

  noShadow(pond.mesh);
  const f = { x: 0, z: 0, tx: 0, tz: -1 };
  let angle = 0;
  const yAxis = new THREE.Vector3(0, 1, 0);
  const basePos = new THREE.Vector3();

  const intake: Intake = {
    weir,
    coanda,
    weirHotspot,
    coandaHotspot,
    s: 0,
    place(s) {
      intake.s = s;
      streamFrame(s, f);
      angle = Math.atan2(-f.tx, -f.tz); // local +Z = downstream
      const y = bedAt(s);
      weir.position.set(f.x, y, f.z);
      weir.rotation.y = angle;
      basePos.set(COANDA_X, 0, 0).applyAxisAngle(yAxis, angle).add(weir.position);
      coanda.position.copy(basePos);
      coanda.rotation.y = angle;
    },
    outlet(out = new THREE.Vector3()) {
      return out.copy(OUTLET).applyAxisAngle(yAxis, angle).add(basePos);
    },
    outletDir(out = new THREE.Vector3()) {
      return out.set(0, 0, 1).applyAxisAngle(yAxis, angle);
    },
    update(state, time) {
      for (const u of sheets) u.uTime.value = time;
      pond.uniforms.uTime.value = time * 0.25;
      pond.mesh.position.y =
        lerp(-0.22, 0.25, clamp(state.intakeLevel, 0, 1)) + clamp(state.qOverflow * 0.004, 0, 0.04);
      const over = smooth(0.01, 3, state.qOverflow);
      nappe.uniforms.uOpacity.value = 0.75 * over;
      nappe.mesh.scale.x = 0.25 + 0.75 * smooth(0, 15, state.qOverflow);
      tail.uniforms.uOpacity.value = smooth(0.01, 1.2, state.qOverflow);
      film.uniforms.uOpacity.value = 0.85 * smooth(0.01, 0.8, state.qCaptured);
      debris.count = Math.round(clamp(state.screenClog, 0, 1) * MAX_DEBRIS);
    },
  };
  return intake;
}
