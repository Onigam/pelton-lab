import * as THREE from 'three';
import { MAT } from '../materials';
import type { PartRegistry } from '../registry';
import { group, mesh } from '../util';
import { D } from './dims';

// Shaft line: stainless shaft, three 6204-2RS bearings, lip seal and the machined bearing
// cartridge.

/** Lathe a closed (r, z) profile around the Z axis. */
function lathe(points: [number, number][], material: THREE.Material, segments = 48): THREE.Mesh {
  const geo = new THREE.LatheGeometry(
    points.map(([r, z]) => new THREE.Vector2(r, z)),
    segments,
  );
  geo.rotateX(Math.PI / 2); // lathe axis Y -> Z
  return mesh(geo, material);
}

/** Ring with rectangular section (inner radius, outer radius, z0, z1). */
function ring(r0: number, r1: number, z0: number, z1: number, material: THREE.Material, seg = 48): THREE.Mesh {
  return lathe(
    [
      [r0, z0],
      [r1, z0],
      [r1, z1],
      [r0, z1],
      [r0, z0],
    ],
    material,
    seg,
  );
}

/** Deep-groove ball bearing 6204-2RS (20 × 47 × 14 mm) centred on z = 0. */
export function bearing6204(): THREE.Group {
  const g = group('6204-2RS');
  const B = 0.014;
  const steel = MAT.inox();
  // outer ring with raceway groove
  g.add(
    lathe(
      [
        [0.0195, -B / 2],
        [0.0235, -B / 2],
        [0.0235, B / 2],
        [0.0195, B / 2],
        [0.0195, 0.0035],
        [0.0207, 0.0015],
        [0.0207, -0.0015],
        [0.0195, -0.0035],
        [0.0195, -B / 2],
      ],
      steel,
    ),
  );
  // inner ring with raceway groove
  g.add(
    lathe(
      [
        [0.01, -B / 2],
        [0.0142, -B / 2],
        [0.0142, -0.0035],
        [0.013, -0.0015],
        [0.013, 0.0015],
        [0.0142, 0.0035],
        [0.0142, B / 2],
        [0.01, B / 2],
        [0.01, -B / 2],
      ],
      steel,
    ),
  );
  // 8 balls + cage
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0039, 16, 12), MAT.nickel(), 8);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    m.makeTranslation(Math.cos(a) * 0.0168, Math.sin(a) * 0.0168, 0);
    balls.setMatrixAt(i, m);
  }
  g.add(balls);
  g.add(ring(0.0158, 0.0178, -0.0012, 0.0012, MAT.brass(), 32));
  // two rubber seals (2RS) — brick red like most branded bearings
  const seal = new THREE.MeshStandardMaterial({ color: 0x8a2f22, roughness: 0.8 });
  g.add(ring(0.0145, 0.0198, B / 2 - 0.0012, B / 2 - 0.0002, seal));
  g.add(ring(0.0145, 0.0198, -B / 2 + 0.0002, -B / 2 + 0.0012, seal));
  return g;
}

/** Radial lip seal 20 × 35 × 7 (NBR) centred on z = 0, lip on the +Z (water) side. */
function lipSeal(): THREE.Group {
  const g = group('lip-seal');
  const nbr = MAT.rubber();
  g.add(
    lathe(
      [
        [0.0102, 0.0035],
        [0.0125, 0.0018],
        [0.0155, 0.0035],
        [0.0175, 0.0035],
        [0.0175, -0.0035],
        [0.012, -0.0035],
        [0.0104, -0.002],
        [0.0102, 0.0035],
      ],
      nbr,
    ),
  );
  // garter spring visible on the lip
  const spring = new THREE.TorusGeometry(0.0128, 0.0007, 6, 48);
  g.add(mesh(spring, MAT.steel(), [0, 0, 0.0012]));
  return g;
}

export interface Drivetrain {
  spinner: THREE.Group;
}

export function buildDrivetrain(machine: THREE.Object3D, reg: PartRegistry): Drivetrain {
  // Rotating assembly: everything attached to the shaft turns with this group.
  const spinner = group('spinner', [0, D.axisY, 0]);
  machine.add(spinner);

  // --- shaft (stainless 316L Ø20 with keyway and threaded front end)
  const shaft = group('shaft');
  const len = D.shaftFront - D.shaftBack;
  const body = new THREE.CylinderGeometry(D.shaftR, D.shaftR, len - 0.012, 32);
  body.rotateX(Math.PI / 2);
  shaft.add(mesh(body, MAT.inox(), [0, 0, (D.shaftFront + D.shaftBack) / 2 - 0.006]));
  const thread = new THREE.CylinderGeometry(D.shaftR * 0.8, D.shaftR * 0.8, 0.024, 24);
  thread.rotateX(Math.PI / 2);
  shaft.add(mesh(thread, MAT.steel(), [0, 0, D.shaftFront - 0.012]));
  const key = new THREE.BoxGeometry(0.006, 0.004, 0.03);
  shaft.add(mesh(key, MAT.steel(), [0, D.shaftR, D.wheelZ]));
  const chamfer = new THREE.CylinderGeometry(D.shaftR * 0.85, D.shaftR, 0.002, 32);
  chamfer.rotateX(-Math.PI / 2);
  shaft.add(mesh(chamfer, MAT.inox(), [0, 0, D.shaftBack - 0.001]));
  spinner.add(shaft);
  reg.add('shaft', shaft, new THREE.Vector3(0, 0, 0.62));

  return { spinner };
}

/** Static parts of the shaft line: housings, bearings and seal (not rotating). */
export function buildBearings(machine: THREE.Object3D, reg: PartRegistry): void {
  const y = D.axisY;
  const zPartDry = D.zPart - D.partT / 2; // dry face of the partition

  // bearing positions
  const zB1 = zPartDry - 0.012;
  const zB2 = zPartDry - 0.105;
  const zB3 = D.zBack + 0.006 + 0.009;

  const b1 = bearing6204();
  b1.position.set(0, y, zB1);
  const b2 = bearing6204();
  b2.position.set(0, y, zB2);
  const b3 = bearing6204();
  b3.position.set(0, y, zB3);

  // machined aluminium cartridge with round flange, grease nipple and V-ring slinger
  const cart = group('bearing-cartridge');
  {
    cart.add(
      lathe(
        [
          [0.0235, zPartDry],
          [0.062, zPartDry],
          [0.062, zPartDry - 0.012],
          [0.036, zPartDry - 0.014],
          [0.034, zB2 - 0.009],
          [0.0235, zB2 - 0.009],
          [0.0235, zPartDry],
        ],
        MAT.alu(),
        64,
      ),
    );
    const bolt = new THREE.CylinderGeometry(0.0045, 0.0045, 0.006, 24);
    bolt.rotateX(Math.PI / 2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      cart.add(mesh(bolt, MAT.inox(), [Math.cos(a) * 0.052, y + Math.sin(a) * 0.052, zPartDry - 0.015]));
    }
    cart.children.forEach((c) => {
      if (c.position.y === 0) c.position.y = y;
    });
    // grease nipple on top
    const nipple = new THREE.CylinderGeometry(0.003, 0.004, 0.014, 12);
    cart.add(mesh(nipple, MAT.brass(), [0, y + 0.041, zPartDry - 0.06]));
    const ball = new THREE.SphereGeometry(0.0035, 12, 8);
    cart.add(mesh(ball, MAT.brass(), [0, y + 0.049, zPartDry - 0.06]));
    // V-ring slinger on the wet side
    const vring = ring(0.0102, 0.019, D.zPart + D.partT / 2 + 0.009, D.zPart + D.partT / 2 + 0.014, MAT.rubber());
    vring.position.y = y;
    cart.add(vring);
  }
  machine.add(cart);

  // the lathe helpers are centred on the axis at y = 0: shift them up
  cart.children.forEach((c) => {
    if ((c as THREE.Mesh).geometry instanceof THREE.LatheGeometry && c.position.y === 0) c.position.y = y;
  });

  machine.add(b1, b2, b3);

  // lip seal on the wet face of the partition
  const seal = lipSeal();
  seal.position.set(0, y, D.zPart + D.partT / 2 + 0.0045);
  machine.add(seal);

  reg.add('bearing-1', b1, new THREE.Vector3(0, 0.0, -0.16));
  reg.add('bearing-2', b2, new THREE.Vector3(0, 0.0, -0.3));
  reg.add('bearing-3', b3, new THREE.Vector3(0, 0, -0.3));
  reg.add('seal', seal, new THREE.Vector3(0, 0, 0.2));
  reg.add('bearing-cartridge', cart, new THREE.Vector3(0, 0, -0.42));
}
