import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import { canvasTexture } from '../util';
import { D } from './dims';

// Water inside the machine: jet cores (textured tubes), spray particles splitting
// sideways off the buckets, and the sheet of water falling through the drain.

const MAX = 1800;
const WET = { zMin: D.zPart + D.partT / 2 + 0.002, zMax: D.zFront - 0.012 };

function streakTexture(): THREE.CanvasTexture {
  const { texture } = canvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(210,235,250,0.55)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 10 + Math.random() * 40);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function dropSprite(): THREE.CanvasTexture {
  return canvasTexture(64, 64, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(220,240,255,0.85)');
    g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  }).texture;
}

interface Jet {
  core: THREE.Mesh;
  origin: THREE.Vector3;
  dir: THREE.Vector3;
  /** Distance from the nozzle to where the jet meets the buckets. */
  reach: number;
  /** Distance to the deflector blade when it is engaged. */
  deflectAt: number;
}

export class MachineWater {
  readonly group = new THREE.Group();
  private jets: Jet[] = [];
  private streaks = streakTexture();
  private positions = new Float32Array(MAX * 3);
  private velocities = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private cursor = 0;
  private points: THREE.Points;
  private drain: THREE.Mesh;
  private drainTex: THREE.CanvasTexture;
  private emitCarry = 0;

  constructor() {
    this.group.name = 'machine-water';
    const coreMat = () =>
      new THREE.MeshBasicMaterial({ map: this.streaks, transparent: true, opacity: 0.85, depthWrite: false });
    const mk = (origin: THREE.Vector3, dir: THREE.Vector3, reach: number, deflectAt: number) => {
      const geo = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true);
      geo.translate(0, -0.5, 0); // origin at the top, extends along -Y
      const core = new THREE.Mesh(geo, coreMat());
      core.position.copy(origin);
      core.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      core.userData.noShadow = true;
      this.group.add(core);
      this.jets.push({ core, origin, dir, reach, deflectAt });
    };
    // top jet: vertical, down to the pitch circle tangent point
    mk(new THREE.Vector3(D.topJetX, D.topNozzleY, D.pipeZ), new THREE.Vector3(0, -1, 0), D.topNozzleY - D.axisY, 0.02);
    // side jet: horizontal towards +X under the shaft
    mk(new THREE.Vector3(D.sideNozzleX, D.sideJetY, D.pipeZ), new THREE.Vector3(1, 0, 0), -D.sideNozzleX, 0.03);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setDrawRange(0, MAX);
    const mat = new THREE.PointsMaterial({
      size: 0.009,
      map: dropSprite(),
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
      color: 0xdff1ff,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    this.life.fill(0);
    for (let i = 0; i < MAX; i++) this.positions[i * 3 + 1] = -10;

    // falling sheet under the drain
    this.drainTex = streakTexture();
    const drainMat = new THREE.MeshBasicMaterial({
      map: this.drainTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sheet = new THREE.CylinderGeometry(0.16, 0.05, 1, 16, 1, true);
    sheet.scale(1, 1, 0.25);
    this.drain = new THREE.Mesh(sheet, drainMat);
    this.drain.userData.noShadow = true;
    this.group.add(this.drain);
  }

  /** Drain sheet length: from the base down to `floorY` (machine coordinates). */
  setFloor(floorY: number): void {
    const h = Math.max(0.05, -floorY);
    this.drain.scale.set(1, h, 1);
    this.drain.position.set(0, -h / 2, 0.089);
  }

  private spawn(p: THREE.Vector3, v: THREE.Vector3, life: number) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % MAX;
    this.positions.set([p.x, p.y, p.z], i * 3);
    this.velocities.set([v.x, v.y, v.z], i * 3);
    this.life[i] = life;
  }

  update(s: SimState, dt: number, slowMo: number, deflect: number, time: number): void {
    const flows = s.nozzles.map((n) => (n.enabled ? n.q : 0));
    const vis = Math.max(0.04, Math.min(1, slowMo)) * 0.45;
    const tmp = new THREE.Vector3();
    const vel = new THREE.Vector3();

    this.jets.forEach((jet, k) => {
      const q = flows[k] ?? 0;
      const on = q > 0.02 && s.vJet > 0.5;
      const len = deflect > 0.5 ? jet.deflectAt + 0.008 : jet.reach;
      const radius = Math.max(0.0018, ((s.nozzles[k]?.d ?? 6) / 1000) * 0.55);
      jet.core.visible = on;
      jet.core.scale.set(radius, len, radius);
      this.streaks.offset.y = (time * s.vJet * 0.6 * Math.max(slowMo, 0.05)) % 1;

      if (!on) return;
      // particles per second proportional to the flow (plus a floor so a trickle is still visible)
      this.emitCarry += dt * (120 + q * 520);
      while (this.emitCarry > 1) {
        this.emitCarry -= 1;
        if (deflect > 0.5) {
          // jet hits the deflector blade and is thrown against the wall, away from the runner
          tmp.copy(jet.origin).addScaledVector(jet.dir, jet.deflectAt + Math.random() * 0.01);
          vel.set(-1.2 - Math.random(), -0.4 - Math.random() * 0.6, (Math.random() - 0.5) * 1.6);
        } else {
          // impact along the last part of the jet, split sideways by the bucket ridge
          tmp.copy(jet.origin).addScaledVector(jet.dir, jet.reach * (0.6 + Math.random() * 0.4));
          const side = Math.random() < 0.5 ? -1 : 1;
          const lateral = 1.2 + Math.random() * 1.8;
          vel.copy(jet.dir).multiplyScalar(-0.3 + Math.random() * 0.4);
          vel.z += side * lateral;
          vel.x += (Math.random() - 0.5) * 0.5;
          vel.y += (Math.random() - 0.5) * 0.5;
          tmp.z += side * 0.01;
        }
        this.spawn(tmp, vel, 0.9 + Math.random() * 0.8);
      }
    });

    // integrate particles (slowed down for readability), bounce on the wet-chamber walls
    const pdt = dt * vis * 3;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const o = i * 3;
      this.velocities[o + 1] -= 9.81 * pdt;
      this.positions[o] += this.velocities[o] * pdt;
      this.positions[o + 1] += this.velocities[o + 1] * pdt;
      this.positions[o + 2] += this.velocities[o + 2] * pdt;
      const z = this.positions[o + 2];
      if (z < WET.zMin || z > WET.zMax) {
        this.positions[o + 2] = Math.min(WET.zMax, Math.max(WET.zMin, z));
        this.velocities[o + 2] *= -0.15;
        this.velocities[o] *= 0.4;
      }
      const x = this.positions[o];
      if (x < -D.W / 2 + 0.01 || x > D.W / 2 - 0.01) this.velocities[o] *= -0.2;
      if (this.positions[o + 1] < D.baseT + 0.004 || this.life[i] <= 0) {
        this.life[i] = 0;
        this.positions[o + 1] = -10;
      }
    }
    (this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

    // drain sheet
    const total = flows.reduce((a, b) => a + b, 0);
    const dm = this.drain.material as THREE.MeshBasicMaterial;
    dm.opacity = Math.min(0.75, total * 0.35);
    this.drain.visible = total > 0.02;
    this.drainTex.offset.y = (this.drainTex.offset.y - dt * 2.5 * Math.max(slowMo, 0.05)) % 1;
  }

  /** Hide every droplet instantly (used when the user isolates or explodes parts). */
  clear(): void {
    this.life.fill(0);
    for (let i = 0; i < MAX; i++) this.positions[i * 3 + 1] = -10;
  }
}
