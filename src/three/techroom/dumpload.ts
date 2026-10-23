import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { canvasTexture, clamp, damp, group, mesh, rng } from '@onigam/lab-kit/three';
import {
  anchor,
  bake,
  box,
  cyl,
  type Device,
  font,
  gland,
  labelMaterial,
  type Palette,
  partVisible,
  plane,
} from './common';
import { POS, SIZE } from './layout';

// Dump load: white vented steel box on stand-offs with four open-coil air-heating
// resistors ("braking resistors"). Coils glow with the diverted power (with some thermal
// inertia) and a faint heat haze rises above the box beyond ~300 W.

const [W, H, D] = SIZE.dump;
const COILS = [-0.075, -0.025, 0.025, 0.075];
const HAZE_N = 70;

class Helix extends THREE.Curve<THREE.Vector3> {
  private len: number;
  private r: number;
  private turns: number;
  constructor(len: number, r: number, turns: number) {
    super();
    this.len = len;
    this.r = r;
    this.turns = turns;
  }
  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * this.turns * Math.PI * 2;
    return target.set(-this.len / 2 + t * this.len, Math.cos(a) * this.r, Math.sin(a) * this.r);
  }
}

/** White perforated sheet: alpha map with staggered round holes, uv scaled per panel. */
function perforated(): THREE.MeshStandardMaterial {
  const { texture } = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    const p = w / 4;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c <= 4; c++) {
        ctx.beginPath();
        ctx.arc(c * p + (r % 2 ? p / 2 : 0), r * p + p / 2, p * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({
    color: 0xf3f3ef,
    roughness: 0.45,
    metalness: 0.1,
    alphaMap: texture,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
}

function sheet(w: number, h: number, tile: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tile, (uv.getY(i) * h) / tile);
  return g;
}

function plates(): { rating: THREE.Material; hot: THREE.Material } {
  const rating = labelMaterial(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f7f7f2';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#222';
    ctx.font = font(22, 800);
    ctx.fillText('DUMP LOAD', 16, 38);
    ctx.font = font(16, 600);
    ctx.fillText('Air heater · 2 × 1 kW', 16, 66);
    ctx.fillText('48 V DC · IP20', 16, 90);
    ctx.fillText('Keep 30 cm clear', 16, 114);
  });
  const hot = labelMaterial(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.moveTo(w / 2, 8);
      ctx.lineTo(w - 6, h - 12);
      ctx.lineTo(6, h - 12);
      ctx.closePath();
      ctx.fillStyle = '#f5c518';
      ctx.fill();
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#141414';
      ctx.stroke();
      ctx.lineWidth = 6;
      for (const x of [48, 64, 80]) {
        ctx.beginPath();
        ctx.moveTo(x, 98);
        ctx.bezierCurveTo(x - 8, 86, x + 8, 74, x, 58);
        ctx.stroke();
      }
    },
    { transparent: true },
  );
  return { rating, hot };
}

function haze(): { points: THREE.Points; base: Float32Array; phase: Float32Array; mat: THREE.PointsMaterial } {
  const rand = rng(91);
  const pos = new Float32Array(HAZE_N * 3);
  const base = new Float32Array(HAZE_N * 3);
  const phase = new Float32Array(HAZE_N);
  for (let i = 0; i < HAZE_N; i++) {
    base[i * 3] = (rand() - 0.5) * (W - 0.06);
    base[i * 3 + 1] = H / 2 + 0.01;
    base[i * 3 + 2] = 0.03 + rand() * (D - 0.06);
    phase[i] = rand();
  }
  pos.set(base);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(HAZE_N * 3), 3));
  const { texture } = canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const mat = new THREE.PointsMaterial({
    size: 0.06,
    map: texture,
    color: 0xfff1e2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  return { points, base, phase, mat };
}

export function buildDumpLoad(pal: Palette): Device {
  const g = group('dump-load', POS.dump);
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f3ef, roughness: 0.45, metalness: 0.1 });
  const t = 0.002;
  // stand-offs keep the hot box away from the OSB
  for (const x of [-0.2, 0.2]) for (const y of [-0.08, 0.08]) cyl(g, pal.zinc, 0.006, 0.035, [x, y, -0.0175], 'z', 10);
  box(g, white, [W, H, t], [0, 0, t / 2]);
  box(g, white, [W, t, D], [0, -H / 2 + t / 2, D / 2]);
  for (const s of [-1, 1]) box(g, white, [t, H, D], [s * (W / 2 - t / 2), 0, D / 2]);
  // folded lips framing the perforated front, solid bottom band for the plates
  box(g, white, [W, 0.012, 0.012], [0, H / 2 - 0.006, D - 0.006]);
  box(g, white, [W, 0.034, 0.012], [0, -H / 2 + 0.017, D - 0.006]);
  for (const s of [-1, 1]) box(g, white, [0.012, H, 0.012], [s * (W / 2 - 0.006), 0, D - 0.006]);

  const perf = perforated();
  const front = mesh(sheet(W - 0.024, H - 0.046, 0.06), perf, [0, 0.011, D - 0.001]);
  front.castShadow = false;
  front.userData.keep = true;
  g.add(front);
  const top = mesh(sheet(W, D, 0.06), perf, [0, H / 2, D / 2], [-Math.PI / 2, 0, 0]);
  top.castShadow = false;
  g.add(top);

  // resistor coils: ceramic cores, glowing helix wire, end insulators and brackets
  const coilMat = new THREE.MeshStandardMaterial({
    color: 0x6d6862,
    metalness: 0.6,
    roughness: 0.45,
    emissive: 0xff7a1e,
    emissiveIntensity: 0,
  });
  // ceramic cores get a faint glow too at full power
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xf1ece2,
    roughness: 0.32,
    emissive: 0xff7a1e,
    emissiveIntensity: 0,
  });
  const helix = new THREE.TubeGeometry(new Helix(W - 0.08, 0.013, 26), 26 * 14, 0.0022, 6);
  for (const y of COILS) {
    cyl(g, coreMat, 0.0085, W - 0.07, [0, y, D / 2], 'x', 14);
    const c = mesh(helix, coilMat, [0, y, D / 2]);
    c.castShadow = false;
    g.add(c);
    for (const s of [-1, 1]) box(g, pal.ceramic, [0.014, 0.03, 0.03], [s * (W / 2 - 0.025), y, D / 2]);
  }
  for (const s of [-1, 1]) box(g, pal.zinc, [0.004, H - 0.03, 0.05], [s * (W / 2 - 0.016), 0, D / 2]);
  box(g, pal.plastic, [0.02, 0.05, 0.03], [-W / 2 + 0.03, -0.045, 0.05]); // terminal block
  for (const y of [-0.03, -0.06]) gland(g, pal.glandWhite, 0.0065, [-W / 2, y, 0.1], '-x');

  const { rating, hot } = plates();
  plane(g, rating, 0.06, 0.03, [W / 2 - 0.06, -H / 2 + 0.017, D + 0.0006]);
  plane(g, hot, 0.028, 0.028, [W / 2 - 0.12, -H / 2 + 0.017, D + 0.0006]);
  const side = plane(g, hot, 0.05, 0.05, [W / 2 + 0.0006, 0.02, D / 2]);
  side.rotation.y = Math.PI / 2;
  bake(g);

  const light = new THREE.PointLight(0xff7a2a, 0, 1.4, 2);
  light.position.set(0, 0, D * 0.75);
  g.add(light);
  const hz = haze();
  g.add(hz.points);

  let heat = 0;
  const cold = new THREE.Color(0x8a1c00);
  const warm = new THREE.Color(0xff8a2a);
  return {
    id: 'dump-load',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.03, D]),
    explode: new THREE.Vector3(0, 0.12, 0.45),
    label: l('Résistances de délestage (chauffage air)', 'Dump-load resistors (air heating)'),
    update: (s, dt, v, reg) => {
      // coils heat up and cool down over a few seconds
      heat = damp(heat, clamp(s.pDump / 2000, 0, 1), 0.8, dt);
      coilMat.emissive.copy(cold).lerp(warm, Math.sqrt(heat));
      coilMat.emissiveIntensity = Math.pow(heat, 0.8) * 5.5;
      coreMat.emissive.copy(coilMat.emissive);
      coreMat.emissiveIntensity = heat * heat * 1.2;
      const shown = partVisible(reg, 'dump-load');
      light.intensity = shown ? heat * 7 : 0;
      front.visible = shown && !v.cutaway;
      const a = clamp((s.pDump - 300) / 1700, 0, 1) * clamp(heat * 2, 0, 1);
      hz.points.visible = shown && a > 0.01;
      hz.mat.opacity = 0.22 * a;
      if (!hz.points.visible) return;
      const attrs = hz.points.geometry.attributes;
      const p = attrs.position as THREE.BufferAttribute;
      const c = attrs.color as THREE.BufferAttribute;
      const arr = p.array as Float32Array;
      const col = c.array as Float32Array;
      for (let i = 0; i < HAZE_N; i++) {
        // each puff rises, wobbles and fades in/out over its life
        const k = (v.time * (0.35 + 0.25 * a) + hz.phase[i]) % 1;
        arr[i * 3] = hz.base[i * 3] + Math.sin(v.time * 3 + i) * 0.01 * k;
        arr[i * 3 + 1] = hz.base[i * 3 + 1] + k * 0.38;
        arr[i * 3 + 2] = hz.base[i * 3 + 2];
        const f = Math.sin(Math.PI * k);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = f;
      }
      p.needsUpdate = true;
      c.needsUpdate = true;
    },
  };
}
