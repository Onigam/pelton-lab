import * as THREE from 'three';
import { MAT } from '@onigam/lab-kit/three';
import type { PartRegistry } from '@onigam/lab-kit/three';
import { group, mesh } from '@onigam/lab-kit/three';
import { bucketGeometry, bucketSpecFor } from './bucket';
import { D, SPIN } from './dims';

// Pelton runner: hub disc + 26 clamped buckets + clamping ring + taper-lock bush.
// Built inside the rotating "spinner" group (origin on the shaft axis, at the wheel plane).

export interface Runner {
  buckets: THREE.Mesh[];
  setBucketSet(set: 'S' | 'L'): void;
  blur: THREE.Mesh;
}

function hubDisc(): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, D.hubR, 0, Math.PI * 2, false);
  const holes: [number, number, number][] = [[0, 0, D.shaftR + 0.012]];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    holes.push([Math.cos(a) * 0.025, Math.sin(a) * 0.025, 0.0035]);
  }
  // lightening pockets, as printed hubs usually have
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    holes.push([Math.cos(a) * 0.044, Math.sin(a) * 0.044, 0.007]);
  }
  for (const [x, y, r] of holes) {
    const h = new THREE.Path();
    h.absarc(x, y, r, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: D.hubT,
    bevelEnabled: true,
    bevelSize: 0.0008,
    bevelThickness: 0.0008,
    bevelSegments: 2,
    curveSegments: 48,
  });
  geo.translate(0, 0, -D.hubT / 2);
  return mesh(geo, MAT.printGrey());
}

function clampRing(): THREE.Group {
  const g = group('clamp-ring');
  const shape = new THREE.Shape();
  shape.absarc(0, 0, D.hubR + 0.002, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, D.boltR - 0.01, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.005, bevelEnabled: false, curveSegments: 64 });
  g.add(mesh(geo, MAT.printBlack(), [0, 0, D.hubT / 2 + 0.004]));
  // 22 stainless M4 bolts, one per bucket stem
  const head = new THREE.CylinderGeometry(0.0035, 0.0035, 0.003, 6);
  head.rotateX(Math.PI / 2);
  const inox = MAT.inox();
  const heads = new THREE.InstancedMesh(head, inox, D.buckets);
  const m = new THREE.Matrix4();
  for (let i = 0; i < D.buckets; i++) {
    const a = (i / D.buckets) * Math.PI * 2;
    m.makeTranslation(Math.cos(a) * D.boltR, Math.sin(a) * D.boltR, D.hubT / 2 + 0.0105);
    heads.setMatrixAt(i, m);
  }
  heads.castShadow = true;
  g.add(heads);
  // nuts on the back face
  const nuts = new THREE.InstancedMesh(head, inox, D.buckets);
  for (let i = 0; i < D.buckets; i++) {
    const a = (i / D.buckets) * Math.PI * 2;
    m.makeTranslation(Math.cos(a) * D.boltR, Math.sin(a) * D.boltR, -D.hubT / 2 - 0.006);
    nuts.setMatrixAt(i, m);
  }
  g.add(nuts);
  return g;
}

function taperLock(): THREE.Group {
  const g = group('taper-lock');
  // conical bush (cast iron look) + locking nut + washer
  const bush = new THREE.CylinderGeometry(0.016, 0.019, 0.016, 32, 1, false);
  bush.rotateX(Math.PI / 2);
  g.add(mesh(bush, MAT.steel(), [0, 0, D.hubT / 2 + 0.012]));
  const washer = new THREE.CylinderGeometry(0.017, 0.017, 0.002, 32);
  washer.rotateX(Math.PI / 2);
  g.add(mesh(washer, MAT.inox(), [0, 0, D.hubT / 2 + 0.021]));
  const nut = new THREE.CylinderGeometry(0.0145, 0.0145, 0.01, 6);
  nut.rotateX(Math.PI / 2);
  g.add(mesh(nut, MAT.inox(), [0, 0, D.hubT / 2 + 0.027]));
  // two grub screws on the bush
  const screw = new THREE.CylinderGeometry(0.003, 0.003, 0.006, 6);
  screw.rotateX(Math.PI / 2);
  for (const a of [0.4, 0.4 + Math.PI]) {
    g.add(mesh(screw, MAT.steelBlack(), [Math.cos(a) * 0.012, Math.sin(a) * 0.012, D.hubT / 2 + 0.021]));
  }
  return g;
}

/** Motion-blur disc shown when the runner spins faster than the eye can follow. */
function blurDisc(): THREE.Mesh {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.27, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(40,42,46,0)');
  g.addColorStop(0.12, 'rgba(40,42,46,0.55)');
  g.addColorStop(0.75, 'rgba(48,50,54,0.5)');
  g.addColorStop(1, 'rgba(40,42,46,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.25), mat);
  m.userData.noShadow = true;
  return m;
}

export function buildRunner(spinner: THREE.Object3D, reg: PartRegistry): Runner {
  const wheel = group('wheel', [0, 0, D.wheelZ]);
  spinner.add(wheel);

  const hub = group('wheel-hub');
  hub.add(hubDisc());
  wheel.add(hub);

  // buckets: opening must face the incoming jet, i.e. opposite to the rotation direction
  const bucketsGroup = group('buckets');
  const bucketMat = MAT.printBlack();
  const buckets: THREE.Mesh[] = [];
  const geoS = bucketGeometry(bucketSpecFor('S', D.rPitch), D.hubR, D.hubT);
  const geoL = bucketGeometry(bucketSpecFor('L', D.rPitch), D.hubR, D.hubT);
  for (let i = 0; i < D.buckets; i++) {
    const a = (i / D.buckets) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.z = a;
    if (SPIN < 0) pivot.scale.y = -1;
    const b = mesh(geoL, bucketMat);
    b.userData.angle = a;
    pivot.add(b);
    bucketsGroup.add(pivot);
    buckets.push(b);
  }
  wheel.add(bucketsGroup);

  const ring = group('wheel-ring');
  ring.add(clampRing());
  wheel.add(ring);

  const lock = group('wheel-lock');
  lock.add(taperLock());
  wheel.add(lock);

  const blur = blurDisc();
  blur.position.z = 0;
  wheel.add(blur);

  // exploded view: the runner slides forward, buckets fly out radially, ring and lock further out
  reg.add('wheel-hub', hub, new THREE.Vector3(0, 0, 0.18));
  reg.add('buckets', bucketsGroup, new THREE.Vector3(0, 0, 0.18), (f) => {
    for (const b of buckets) b.position.x = f * 0.07;
  });
  reg.add('wheel-ring', ring, new THREE.Vector3(0, 0, 0.27));
  reg.add('wheel-lock', lock, new THREE.Vector3(0, 0, 0.36));

  return {
    buckets,
    blur,
    setBucketSet(set) {
      const geo = set === 'L' ? geoL : geoS;
      for (const b of buckets) b.geometry = geo;
    },
  };
}
