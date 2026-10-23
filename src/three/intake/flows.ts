import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '@onigam/lab-kit/three';
import { clamp, rng, roundedPath } from '@onigam/lab-kit/three';
import { noShadow } from './common';
import { BOX, HALF_W, OUTLET, PIPE_PTS, PIPE_R, profile, profileAt, S_END, smoothstep, sOfK } from './dims';
import { bubbleSprite, dropSprite, streakTexture } from './textures';
import { LAND_Y } from './water';
import { curtainMaterial } from './watermat';

// Moving water that is not a surface: threads and drops falling through the slots into the
// box, drops leaving the overflow lip, air bubbles drawn into the strainer when the intake
// runs dry, the water core inside the outlet / penstock and flow chevrons along the pipe.

const CURTAINS = 16;
const MAX_DROPS = 1600;
const MAX_BUBBLES = 90;
const CHEVRONS = 9;
const GRAV = 9.81;

/** Threads of water under the screen (one vertical sheet of threads per screen station). */
function buildCurtains(): { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } {
  const pos: number[] = [];
  const top: number[] = [];
  const bot: number[] = [];
  const ks: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < CURTAINS; i++) {
    const k = (i + 0.5) / CURTAINS;
    const p = profileAt(sOfK(k), -0.012);
    const x = Math.min(p.x + 0.01, BOX.x1 - 0.01);
    const base = i * 4;
    for (const [z, b] of [
      [-HALF_W + 0.008, 0],
      [HALF_W - 0.008, 0],
      [-HALF_W + 0.008, 1],
      [HALF_W - 0.008, 1],
    ]) {
      pos.push(x, p.y, z);
      top.push(p.y);
      bot.push(b);
      ks.push(k);
    }
    idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aTop', new THREE.Float32BufferAttribute(top, 1));
  geo.setAttribute('aBot', new THREE.Float32BufferAttribute(bot, 1));
  geo.setAttribute('aK', new THREE.Float32BufferAttribute(ks, 1));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.55, 0), 0.6);
  const mat = curtainMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 3;
  mesh.frustumCulled = false;
  return { mesh, mat };
}

/** Pool of point particles with simple ballistic motion. */
class Particles {
  readonly points: THREE.Points;
  readonly pos: Float32Array;
  readonly vel: Float32Array;
  readonly life: Float32Array;
  readonly kind: Uint8Array;
  private attr: THREE.BufferAttribute;
  private cursor = 0;

  constructor(
    readonly max: number,
    mat: THREE.PointsMaterial,
  ) {
    this.pos = new Float32Array(max * 3).fill(-50);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.kind = new Uint8Array(max);
    const geo = new THREE.BufferGeometry();
    this.attr = new THREE.BufferAttribute(this.pos, 3);
    this.attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.attr);
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
  }

  spawn(p: THREE.Vector3, v: THREE.Vector3, life: number, kind: number): void {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = life;
    this.kind[i] = kind;
  }

  kill(i: number): void {
    this.life[i] = 0;
    this.pos[i * 3 + 1] = -50;
  }

  commit(): void {
    this.attr.needsUpdate = true;
  }
}

export class IntakeFlows {
  readonly group = new THREE.Group();
  /** Threads and drops inside the box: cut with it in cutaway mode. */
  readonly clipMats: THREE.Material[];
  private curtains: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial };
  private drops: Particles;
  private bubbles: Particles;
  private core: THREE.Mesh;
  private coreTex: THREE.Texture;
  private coreLen: number;
  private chevrons: THREE.InstancedMesh;
  private chevMat: THREE.MeshBasicMaterial;
  private pipePath: THREE.CurvePath<THREE.Vector3>;
  private pipeLen: number;
  private r = rng(97);
  private carry = { screen: 0, lip: 0, bubble: 0 };
  private phase = { curtain: 0, chev: 0 };
  private tmpP = new THREE.Vector3();
  private tmpV = new THREE.Vector3();

  constructor(pipePath: THREE.CurvePath<THREE.Vector3>) {
    this.group.name = 'intake-flows';
    this.pipePath = pipePath;
    this.pipeLen = pipePath.getLength();
    this.curtains = buildCurtains();
    this.drops = new Particles(
      MAX_DROPS,
      new THREE.PointsMaterial({
        size: 0.0075,
        map: dropSprite(),
        color: 0xe6f5ff,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.bubbles = new Particles(
      MAX_BUBBLES,
      new THREE.PointsMaterial({
        size: 0.011,
        map: bubbleSprite(),
        color: 0xffffff,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );

    // water core: strainer → bulkhead → coupling → penstock, visible through the strainer
    // holes, in the cut fittings and at the cut end of the pipe
    const corePath = roundedPath(
      [new THREE.Vector3(OUTLET.x, OUTLET.y, -0.125), ...PIPE_PTS.slice(1).map((p) => p.clone())],
      0.1,
    );
    this.coreLen = corePath.getLength();
    this.coreTex = streakTexture();
    this.coreTex.repeat.set(this.coreLen / 0.3, 1);
    this.core = new THREE.Mesh(
      new THREE.TubeGeometry(corePath, 160, PIPE_R - 0.006, 12, false),
      new THREE.MeshBasicMaterial({
        map: this.coreTex,
        color: 0x9fd4ff,
        transparent: true,
        depthWrite: false,
        opacity: 0.8,
      }),
    );
    this.core.renderOrder = 1;

    // chevrons riding on top of the penstock, pointing downstream
    const chev = new THREE.BufferGeometry();
    const w = 0.012;
    // two arms of a '>' lying flat (X = downstream, Z = across)
    const v = (x: number, z: number) => [x * w, 0, z * w];
    chev.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          [0, 0],
          [-1, -1],
          [-1.5, -1],
          [0, 0],
          [-1.5, -1],
          [-0.5, 0],
          [0, 0],
          [-0.5, 0],
          [-1.5, 1],
          [0, 0],
          [-1.5, 1],
          [-1, 1],
        ].flatMap(([x, z]) => v(x, z)),
        3,
      ),
    );
    this.chevMat = new THREE.MeshBasicMaterial({
      color: 0x5ec8ff,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.chevrons = new THREE.InstancedMesh(chev, this.chevMat, CHEVRONS);
    this.chevrons.frustumCulled = false;
    this.chevrons.renderOrder = 5;

    this.clipMats = [this.curtains.mat, this.drops.points.material as THREE.Material];
    this.group.add(this.curtains.mesh, this.drops.points, this.bubbles.points, this.core, this.chevrons);
    noShadow(this.group);
  }

  update(s: SimState, dt: number, view: ViewOpts, boxY: number): void {
    const vdt = Math.min(dt * view.slowMo, 0.05);
    const r = this.r;
    const cap = 12 * Math.pow(1 - clamp(s.screenClog, 0, 1), 1.5);
    const kEnd = s.qOverflow > 0.03 ? 1 : clamp(s.qCaptured / Math.max(cap, 0.1), 0.06, 1);

    // threads under the screen
    const cm = this.curtains.mat.uniforms;
    this.phase.curtain += vdt * 2.2;
    cm.uPhase.value = this.phase.curtain;
    cm.uWaterY.value = boxY;
    cm.uAmount.value = smoothstep(0.01, 0.5, s.qCaptured);
    cm.uDensity.value = 0.12 + 0.7 * smoothstep(0, 5, s.qCaptured);
    cm.uKEnd.value = kEnd;
    this.curtains.mesh.visible = s.qCaptured > 0.01;

    // drops: through the slots (∝ captured flow) and off the lip (∝ overflow)
    const P = this.tmpP;
    const V = this.tmpV;
    this.carry.screen += vdt * 150 * s.qCaptured;
    while (this.carry.screen >= 1) {
      this.carry.screen -= 1;
      const q = profile(sOfK(r() * kEnd));
      P.set(q.p.x - q.n.x * 0.006, q.p.y - q.n.y * 0.006, (r() * 2 - 1) * (HALF_W - 0.01));
      const sp = 0.9 + r() * 0.6;
      V.set(q.t.x * sp - q.n.x * 0.35, q.t.y * sp - q.n.y * 0.35, (r() - 0.5) * 0.05);
      this.drops.spawn(P, V, 1, 0);
    }
    this.carry.lip += vdt * 90 * s.qOverflow;
    while (this.carry.lip >= 1) {
      this.carry.lip -= 1;
      const q = profile(S_END);
      P.set(q.p.x + q.n.x * 0.004, q.p.y + q.n.y * 0.004, (r() * 2 - 1) * (HALF_W - 0.01));
      const sp = 1.1 + r() * 0.5;
      V.set(q.t.x * sp, q.t.y * sp + r() * 0.1, (r() - 0.5) * 0.08);
      this.drops.spawn(P, V, 1, 1);
    }
    const d = this.drops;
    for (let i = 0; i < d.max; i++) {
      if (d.life[i] <= 0) continue;
      const k = i * 3;
      d.vel[k + 1] -= GRAV * vdt;
      d.pos[k] += d.vel[k] * vdt;
      d.pos[k + 1] += d.vel[k + 1] * vdt;
      d.pos[k + 2] += d.vel[k + 2] * vdt;
      d.life[i] -= vdt;
      const kind = d.kind[i];
      if (kind === 0) {
        // into the box water (or against the downstream wall)
        if (d.pos[k + 1] < boxY || d.pos[k] > BOX.x1 - 0.004) d.kill(i);
      } else if (kind === 1 && d.pos[k + 1] < LAND_Y) {
        // splash: a couple of short hops
        d.kind[i] = 2;
        d.life[i] = 0.12 + r() * 0.12;
        d.pos[k + 1] = LAND_Y + 0.002;
        d.vel[k] = (r() - 0.3) * 0.6;
        d.vel[k + 1] = 0.4 + r() * 0.6;
        d.vel[k + 2] = (r() - 0.5) * 0.6;
      } else if (d.life[i] <= 0 || d.pos[k + 1] < LAND_Y - 0.01) {
        d.kill(i);
      }
    }
    d.commit();

    // air drawn into the strainer: bubbles swirling down into it
    const b = this.bubbles;
    const sucking = s.air || (s.qPipe > 0.05 && s.intakeLevel < 0.25);
    if (sucking) this.carry.bubble += vdt * (s.air ? 45 : 15);
    while (this.carry.bubble >= 1) {
      this.carry.bubble -= 1;
      const a = r() * Math.PI * 2;
      const rad = 0.03 + r() * 0.06;
      P.set(OUTLET.x + Math.cos(a) * rad, Math.max(boxY - 0.005, OUTLET.y + 0.02), -0.2 + Math.sin(a) * rad * 0.8);
      b.spawn(P, V.set(a, rad, 0), 3, 0);
    }
    for (let i = 0; i < b.max; i++) {
      if (b.life[i] <= 0) continue;
      const k = i * 3;
      // vel holds (angle, radius, along-pipe progress): spiral in, then down the outlet
      b.vel[k] += vdt * 9;
      b.vel[k + 1] = Math.max(0, b.vel[k + 1] - vdt * 0.12);
      if (b.vel[k + 1] < 0.012) {
        b.vel[k + 2] += vdt * 0.6;
        b.pos[k] = OUTLET.x + (r() - 0.5) * 0.01;
        b.pos[k + 1] = OUTLET.y + (r() - 0.5) * 0.01;
        b.pos[k + 2] = -0.2 - b.vel[k + 2];
        if (b.pos[k + 2] < -0.47) b.kill(i);
      } else {
        b.pos[k] = OUTLET.x + Math.cos(b.vel[k]) * b.vel[k + 1];
        b.pos[k + 2] = -0.2 + Math.sin(b.vel[k]) * b.vel[k + 1] * 0.8;
        b.pos[k + 1] += (OUTLET.y - b.pos[k + 1]) * Math.min(1, vdt * 3);
      }
      b.life[i] -= vdt;
      if (b.life[i] <= 0) b.kill(i);
    }
    b.commit();

    // water core and chevrons along the penstock: speed of the water in the pipe
    const vPipe = Math.max(0, s.vPipe);
    const qOn = smoothstep(0.02, 0.4, s.qPipe);
    this.coreTex.offset.x -= (vPipe * vdt) / 0.3;
    const coreMat = this.core.material as THREE.MeshBasicMaterial;
    coreMat.opacity = 0.8 * qOn;
    this.core.visible = qOn > 0.01;
    this.chevrons.visible = qOn > 0.01 && !view.schematic;
    if (this.chevrons.visible) this.placeChevrons(vPipe * vdt, qOn);
  }

  private chev = {
    m: new THREE.Matrix4(),
    up: new THREE.Vector3(0, 1, 0),
    p: new THREE.Vector3(),
    t: new THREE.Vector3(),
    sd: new THREE.Vector3(),
    u2: new THREE.Vector3(),
    k: new THREE.Vector3(),
  };

  private placeChevrons(step: number, alpha: number): void {
    this.phase.chev = (this.phase.chev + step / this.pipeLen) % 1;
    const { m, up, p, t, sd, u2, k: kv } = this.chev;
    const u0 = 0.12;
    const u1 = 0.97;
    for (let i = 0; i < CHEVRONS; i++) {
      const f = (i / CHEVRONS + this.phase.chev) % 1;
      const u = u0 + (u1 - u0) * f;
      this.pipePath.getPointAt(u, p);
      this.pipePath.getTangentAt(u, t);
      u2.copy(up).addScaledVector(t, -t.dot(up)).normalize();
      sd.crossVectors(t, u2);
      p.addScaledVector(u2, PIPE_R + 0.005);
      // fade in/out at both ends of the run
      const k = Math.min(1, f * 6, (1 - f) * 6);
      m.makeBasis(t, u2, sd)
        .scale(kv.set(k, 1, k))
        .setPosition(p);
      this.chevrons.setMatrixAt(i, m);
    }
    this.chevrons.instanceMatrix.needsUpdate = true;
    this.chevMat.opacity = 0.85 * alpha;
  }
}
