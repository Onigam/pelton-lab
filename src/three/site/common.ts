import * as THREE from 'three';
import type { Season } from '../../sim/types';
import { clamp } from '@onigam/lab-kit/three';

// Small shared helpers for the site scene: noise, smoothstep, seasonal palette.

export const DEG = Math.PI / 180;

export function smooth(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 2D value noise in [-1, 1]. */
export function vnoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

/** Fractal value noise in roughly [-1, 1]. */
export function fbm(x: number, z: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * f + i * 17.31, z * f - i * 9.13);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

/** Colours that change with the season (sRGB hex). */
export interface SeasonLook {
  grass: number;
  grassDry: number;
  forestFloor: number;
  leaves: number[];
  leavesOn: boolean;
  conifer: number;
  fern: number;
  fernScale: number;
  /** Elevation above the turbine where snow patches start (Infinity = none). */
  snowLine: number;
  /** Snow / frost on roofs. */
  roofSnow: boolean;
  frost: number;
}

export const SEASON_LOOK: Record<Season, SeasonLook> = {
  winter: {
    grass: 0x7b8656,
    grassDry: 0x948d66,
    forestFloor: 0x5a4632,
    leaves: [0x8a5a2e, 0x7a4f2a],
    leavesOn: false,
    conifer: 0x55705a,
    fern: 0x7d5a35,
    fernScale: 0.55,
    snowLine: 48,
    roofSnow: true,
    frost: 0.35,
  },
  spring: {
    grass: 0x5d9b34,
    grassDry: 0x7fb348,
    forestFloor: 0x4b4a2a,
    leaves: [0x5f8a36, 0x557f30, 0x6a9640, 0x4f7a34],
    leavesOn: true,
    conifer: 0x3f6a3c,
    fern: 0x6aa83a,
    fernScale: 1,
    snowLine: 150,
    roofSnow: false,
    frost: 0,
  },
  summer: {
    grass: 0x8f9a45,
    grassDry: 0xb7aa5c,
    forestFloor: 0x4d4628,
    leaves: [0x46702a, 0x517c30, 0x3f6826, 0x587f34],
    leavesOn: true,
    conifer: 0x37603a,
    fern: 0x5a8f30,
    fernScale: 1.1,
    snowLine: Infinity,
    roofSnow: false,
    frost: 0,
  },
  autumn: {
    grass: 0x748a42,
    grassDry: 0x998a45,
    forestFloor: 0x5e4a2c,
    leaves: [0xc8742a, 0xb5541e, 0xd9a03a, 0x9a6a2a, 0x8a8a35, 0xc98b2c],
    leavesOn: true,
    conifer: 0x3a6239,
    fern: 0xa0672c,
    fernScale: 0.9,
    snowLine: Infinity,
    roofSnow: false,
    frost: 0,
  },
};

const tmpColor = new THREE.Color();
/** Write a (linear) colour into a flat RGB array at vertex `i`. */
export function writeColor(out: Float32Array, i: number, c: THREE.Color): void {
  out[i * 3] = c.r;
  out[i * 3 + 1] = c.g;
  out[i * 3 + 2] = c.b;
}

export function hex(h: number): THREE.Color {
  return tmpColor.setHex(h).clone();
}

/** Mark meshes that must never cast shadows (water, overlays): the registry respects it. */
export function noShadow<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    c.castShadow = false;
    c.userData.noShadow = true;
  });
  return o;
}

/** Rescale BoxGeometry UVs so that 1 UV unit = `tile` metres on every face. */
export function boxUV(geo: THREE.BoxGeometry, tile = 1): THREE.BoxGeometry {
  const { width: w, height: h, depth: d } = geo.parameters;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z ; 4 vertices each (1 segment)
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  return geo;
}
