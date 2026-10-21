import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import type { Season } from '../../sim/types';
import { canvasTexture, clamp, lerp } from '../util';
import { DEG, smooth } from './common';

// Sky dome (Preetham + clouds, with stars injected at night), sun / moon light with a
// shadow box focused on the turbine and the house, hemisphere fill and fog.

const LAT = 42.98 * DEG; // Saint-Girons, Ariège

/** Solar declination and local clock time of solar noon (DST included) per season. */
const SUN: Record<Season, { decl: number; noon: number }> = {
  winter: { decl: -23 * DEG, noon: 12.87 }, // ~08:30 - 17:15
  spring: { decl: 10 * DEG, noon: 13.9 },
  summer: { decl: 23 * DEG, noon: 14.0 }, // ~06:30 - 21:30
  autumn: { decl: -8 * DEG, noon: 13.75 },
};

/** Focus of the shadow camera: between turbine and house. */
const FOCUS = new THREE.Vector3(12, 1.5, 5);
const SHADOW_HALF = 42;

export interface SkyRig {
  sky: Sky;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  /** 0 = full day, 1 = deep night. */
  night: number;
  /** Direct sunlight reaching the valley floor (0..1, mountains and clouds included). */
  sunlight: number;
  sunDir: THREE.Vector3;
  update(hour: number, season: Season, time: number): void;
}

/** Sun direction (unit, world: X east, Y up, Z south) for a clock hour and season. */
export function sunDirection(hour: number, season: Season, out = new THREE.Vector3()): THREE.Vector3 {
  const { decl, noon } = SUN[season];
  const H = (hour - noon) * 15 * DEG;
  const east = -Math.cos(decl) * Math.sin(H);
  const north = Math.sin(decl) * Math.cos(LAT) - Math.cos(decl) * Math.sin(LAT) * Math.cos(H);
  const up = Math.sin(decl) * Math.sin(LAT) + Math.cos(decl) * Math.cos(LAT) * Math.cos(H);
  return out.set(east, up, -north).normalize();
}

function injectNight(sky: Sky): void {
  const m = sky.material;
  m.uniforms.uNight = { value: 0 };
  const hook = 'gl_FragColor = vec4( texColor, 1.0 );';
  if (!m.fragmentShader.includes(hook)) return;
  m.fragmentShader = m.fragmentShader.replace('void main() {', 'uniform float uNight;\nvoid main() {').replace(
    hook,
    /* glsl */ `
      {
        float up = max(direction.y, 0.0);
        vec3 nightCol = mix(vec3(0.010, 0.016, 0.040), vec3(0.0025, 0.004, 0.012), pow(up, 0.6));
        vec3 sd = direction * 260.0;
        vec3 cell = floor(sd);
        float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = step(0.9965, h) * smoothstep(0.45, 0.05, length(fract(sd) - 0.5));
        star *= smoothstep(0.02, 0.25, up) * (0.5 + 0.5 * fract(h * 91.7));
        texColor = mix(texColor, nightCol + vec3(star) * 0.9, uNight);
      }
      ${hook}`,
  );
}

/** Simple equirectangular gradient used as environment (reflections on water, metal, glass). */
function envTexture(): THREE.Texture {
  const { texture } = canvasTexture(128, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#6f9cd0');
    g.addColorStop(0.42, '#bcd2e6');
    g.addColorStop(0.5, '#d9e2e4');
    g.addColorStop(0.53, '#6e7a52');
    g.addColorStop(1, '#3a3a2c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

export function createSky(scene: THREE.Scene, horizon: Float32Array): SkyRig {
  const sky = new Sky();
  sky.name = 'sky';
  sky.scale.setScalar(9000);
  sky.frustumCulled = false;
  const u = sky.material.uniforms;
  u.turbidity.value = 4;
  u.rayleigh.value = 1.4;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.82;
  if (u.cloudCoverage) u.cloudCoverage.value = 0.32;
  injectNight(sky);
  scene.add(sky);

  scene.environment = envTexture();
  scene.fog = new THREE.FogExp2(0xc6d4e0, 0.0009);

  const sun = new THREE.DirectionalLight(0xfff2e0, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -SHADOW_HALF;
  cam.right = SHADOW_HALF;
  cam.top = SHADOW_HALF;
  cam.bottom = -SHADOW_HALF;
  cam.near = 1;
  cam.far = 420;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.target.position.copy(FOCUS);
  scene.add(sun, sun.target);

  const hemi = new THREE.HemisphereLight(0xbcd3ee, 0x4a4a32, 0.9);
  scene.add(hemi);

  const sunDir = new THREE.Vector3(0, 1, 0);
  const moonDir = new THREE.Vector3(-0.35, 0.8, 0.45).normalize();
  const warm = new THREE.Color(0xffa860);
  const white = new THREE.Color(0xfff3e2);
  const moonCol = new THREE.Color(0x9fb4d8);
  const fogDay = new THREE.Color(0xc4d3e2);
  const fogDusk = new THREE.Color(0xd8b49a);
  const fogNight = new THREE.Color(0x0b1222);
  const hemiDay = new THREE.Color(0xbcd3ee);
  const hemiNight = new THREE.Color(0x3a4f80);

  const rig: SkyRig = {
    sky,
    sun,
    hemi,
    night: 0,
    sunlight: 1,
    sunDir,
    update(hour, season, time) {
      sunDirection(hour, season, sunDir);
      const alt = Math.asin(clamp(sunDir.y, -1, 1));
      let az = Math.atan2(sunDir.x, -sunDir.z);
      if (az < 0) az += 2 * Math.PI;
      const k = (az / (5 * DEG)) % 72;
      const k0 = Math.floor(k);
      const hz = lerp(horizon[k0], horizon[(k0 + 1) % 72], k - k0);

      const day = smooth(-7 * DEG, 3 * DEG, alt); // civil twilight -> day
      const visible = smooth(hz - 0.6 * DEG, hz + 2.5 * DEG, alt); // hidden by the ridges
      const low = 1 - smooth(4 * DEG, 25 * DEG, alt); // warm, dim low sun
      rig.night = 1 - day;
      rig.sunlight = visible * day;

      u.sunPosition.value.copy(sunDir);
      u.uNight.value = smooth(-2 * DEG, -10 * DEG, alt);
      if (u.time) u.time.value = time;

      const sunI = 3.3 * visible * smooth(-1 * DEG, 6 * DEG, alt) * (1 - 0.45 * low);
      const moonI = 0.5 * (1 - day);
      if (sunI >= moonI) {
        sun.position.copy(FOCUS).addScaledVector(sunDir, 200);
        sun.color.copy(white).lerp(warm, low);
        sun.intensity = sunI;
      } else {
        sun.position.copy(FOCUS).addScaledVector(moonDir, 200);
        sun.color.copy(moonCol);
        sun.intensity = moonI;
      }

      hemi.intensity = lerp(0.22, 1.0, day) * lerp(1, 0.75, low * day);
      hemi.color.copy(hemiNight).lerp(hemiDay, day);
      scene.environmentIntensity = lerp(0.06, 0.55, day);

      const fog = scene.fog as THREE.FogExp2;
      fog.color
        .copy(fogNight)
        .lerp(fogDay, day)
        .lerp(fogDusk, low * day * 0.6);
    },
  };
  rig.update(13, 'spring', 0);
  return rig;
}
