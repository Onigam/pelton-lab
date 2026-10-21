import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '../types';
import { clamp, rng } from '../util';
import { noShadow } from './common';
import { bedY, BLOCK, channelZ, HALF_W, pondY, profile, profileAt, S_END, sOfK } from './dims';
import { LAND_Y, nappePoints } from './water';

// Leaves and twigs: stuck on the screen (count follows the clogging), floating on the pond,
// and carried away by the overflow over the lip into the stream (the self-cleaning effect).

const MAX_SCREEN = 130;
const MAX_TWIGS = 16;
const POND = 11;
const SLIDE = 6;
const LEAF_COLORS = [0x6b3a1a, 0x8a4f1f, 0x4a2e15, 0xa0612a, 0x5c4a1e, 0x7a6a2a, 0x3f5420].map(
  (h) => new THREE.Color(h),
);

/** Small pointed, slightly cupped leaf lying in the X–Z plane (unit ≈ 1 cm). */
function leafGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-1.6, 0);
  s.quadraticCurveTo(-0.4, 1.0, 1.7, 0);
  s.quadraticCurveTo(-0.4, -1.0, -1.6, 0);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, 0.12 * p.getZ(i) * p.getZ(i));
  g.scale(0.011, 0.011, 0.011);
  g.computeVertexNormals();
  return g;
}

/** Leaves sort with the water (transparent queue) and draw after it, so the thin sheet
 *  running over them does not wash them out. */
function leafMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ roughness: 0.85, side: THREE.DoubleSide, transparent: true });
}

export interface Debris {
  /** Leaves and twigs stuck on the screen (child of the screen part). */
  screen: THREE.Group;
  /** Their materials (cut with the screen in cutaway mode). */
  screenMats: THREE.Material[];
  /** Floating and drifting leaves (hidden with the water). */
  moving: THREE.Group;
  update(s: SimState, dt: number, view: ViewOpts): void;
}

export function buildDebris(): Debris {
  const r = rng(91);
  const screen = new THREE.Group();
  screen.name = 'screen-debris';
  const moving = new THREE.Group();
  moving.name = 'moving-debris';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const spin = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const n3 = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  // leaves pinned on the wires by the flow (more on the upper part, where most water goes through)
  const leaves = new THREE.InstancedMesh(leafGeometry(), leafMaterial(), MAX_SCREEN);
  for (let i = 0; i < MAX_SCREEN; i++) {
    const k = Math.pow(r(), 1.3) * 0.96 + 0.02;
    const qq = profile(sOfK(k));
    const p = profileAt(sOfK(k), 0.0012);
    n3.set(qq.n.x, qq.n.y, 0);
    q.setFromUnitVectors(yAxis, n3);
    spin.setFromAxisAngle(n3, r() * Math.PI * 2);
    const sc = 0.6 + r() * 0.9;
    m.compose(
      new THREE.Vector3(p.x, p.y, (r() * 2 - 1) * (HALF_W - 0.02)),
      spin.multiply(q),
      new THREE.Vector3(sc, sc, sc * (0.7 + r() * 0.5)),
    );
    leaves.setMatrixAt(i, m);
    leaves.setColorAt(i, LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)]);
  }
  leaves.count = 0;
  leaves.receiveShadow = true;
  leaves.renderOrder = 3;
  leaves.name = 'screen-leaves';
  const twigGeo = new THREE.CylinderGeometry(0.0018, 0.0024, 1, 5, 1);
  twigGeo.rotateZ(Math.PI / 2);
  const twigs = new THREE.InstancedMesh(
    twigGeo,
    new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 0.9 }),
    MAX_TWIGS,
  );
  for (let i = 0; i < MAX_TWIGS; i++) {
    const k = 0.05 + r() * 0.85;
    const qq = profile(sOfK(k));
    const p = profileAt(sOfK(k), 0.0025);
    n3.set(qq.n.x, qq.n.y, 0);
    q.setFromUnitVectors(yAxis, n3);
    spin.setFromAxisAngle(n3, r() * Math.PI);
    const len = 0.04 + r() * 0.09;
    m.compose(
      new THREE.Vector3(p.x, p.y, (r() * 2 - 1) * (HALF_W - 0.06)),
      spin.multiply(q),
      new THREE.Vector3(len, 1, 1),
    );
    twigs.setMatrixAt(i, m);
  }
  twigs.count = 0;
  // the instanced bounding sphere is computed once, with count = 0 it would cull them forever
  leaves.frustumCulled = false;
  twigs.frustumCulled = false;
  twigs.renderOrder = 3;
  screen.add(noShadow(leaves), noShadow(twigs));

  // pond leaves drifting towards the crest
  const pond = new THREE.InstancedMesh(leafGeometry(), leafMaterial(), POND);
  const pondState = Array.from({ length: POND }, () => ({
    x: -0.95 + r() * 0.55,
    z: (r() - 0.5) * 0.8,
    a: r() * 6.28,
    sp: 0.4 + r() * 0.6,
    c: r(),
  }));
  pondState.forEach((p, i) => pond.setColorAt(i, LEAF_COLORS[Math.floor(p.c * LEAF_COLORS.length)]));

  // leaves carried over the screen and the lip into the stream below
  const pathPts: THREE.Vector3[] = [];
  for (let k = 0.25; k < 1; k += 0.08) {
    const p = profileAt(sOfK(k), 0.004);
    pathPts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  const tail = nappePoints().filter((_, i) => i % 3 === 0);
  pathPts.push(...tail.map((p) => p.clone()));
  for (let x = tail[tail.length - 1].x + 0.08; x < BLOCK.x1 - 0.05; x += 0.12) {
    pathPts.push(new THREE.Vector3(x, Math.max(bedY(x) + 0.024, x < 0.55 ? LAND_Y + 0.003 : 0), channelZ(x)));
  }
  const slidePath = new THREE.CatmullRomCurve3(pathPts);
  const slideLen = slidePath.getLength();
  const sEnd = profile(S_END).p.x;
  const slide = new THREE.InstancedMesh(leafGeometry(), leafMaterial(), SLIDE);
  const slideState = Array.from({ length: SLIDE }, (_, i) => ({
    u: i / SLIDE,
    z: (r() - 0.5) * 0.45,
    a: r() * 6.28,
    c: r(),
  }));
  slideState.forEach((p, i) => slide.setColorAt(i, LEAF_COLORS[Math.floor(p.c * LEAF_COLORS.length)]));
  moving.add(noShadow(pond), noShadow(slide));
  for (const im of [pond, slide]) {
    im.renderOrder = 3;
    im.frustumCulled = false;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const e = new THREE.Euler();
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  return {
    screen,
    screenMats: [leaves.material as THREE.Material, twigs.material as THREE.Material],
    moving,
    update(s, dt, view) {
      const clog = clamp(s.screenClog, 0, 1);
      leaves.count = Math.round(Math.pow(clog, 0.8) * MAX_SCREEN);
      twigs.count = Math.round(clog * MAX_TWIGS);
      const vdt = dt * view.slowMo;

      // pond: slow drift towards the crest, then back upstream (respawn)
      const yPond = pondY(s.intakeLevel) + 0.0015;
      const drift = 0.02 + 0.02 * clamp(s.qStream / 5, 0, 1);
      pondState.forEach((p, i) => {
        p.x += drift * p.sp * vdt;
        p.z *= 1 - 0.15 * vdt;
        p.a += 0.2 * vdt * (p.sp - 0.7);
        if (p.x > -0.42) {
          p.x = -0.98 + r() * 0.1;
          p.z = (r() - 0.5) * 0.5;
        }
        e.set(0, p.a, 0);
        m.compose(pos.set(p.x, yPond, p.z), q.setFromEuler(e), one);
        pond.setMatrixAt(i, m);
      });
      pond.instanceMatrix.needsUpdate = true;

      // overflow leaves: only with a real overflow (the self-cleaning effect needs it)
      const carry = s.qOverflow > 0.05;
      slide.visible = carry;
      if (carry) {
        const n = Math.max(2, Math.round(SLIDE * clamp(0.35 + clog, 0, 1)));
        slide.count = n;
        const speed = 0.45 + 0.25 * clamp(s.qOverflow / 3, 0, 1);
        slideState.forEach((p, i) => {
          p.u = (p.u + (speed * vdt) / slideLen) % 1;
          p.a += vdt * 4;
          slidePath.getPointAt(p.u, pos);
          slidePath.getTangentAt(p.u, tan);
          pos.z = THREE.MathUtils.lerp(p.z, pos.z + p.z * 0.6, 0.5);
          // aligned with the flow, own yaw; tumbling while falling off the lip
          const falling = pos.x > sEnd && pos.y > LAND_Y + 0.01;
          q.setFromAxisAngle(zAxis, Math.atan2(tan.y, tan.x));
          if (falling) q.multiply(spin.setFromAxisAngle(xAxis, p.a));
          q.multiply(spin.setFromAxisAngle(yAxis, p.c * 6.28));
          m.compose(pos, q, one);
          slide.setMatrixAt(i, m);
        });
        slide.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
