import * as THREE from 'three';
import { noShadow } from './common';

// Animated water: MeshStandardMaterial + injected flow noise, so it keeps PBR lighting, fog
// and environment reflections. Geometry carries a few attributes:
//   aSide (vec3)  lateral unit vector        aAcross (-1..1) position across the ribbon
//   aTau          travel coordinate (scrolls)  aSlope (0..1)  steepness -> foam
// Stream mode (define STREAM) also reads aS (arc position) and widens/raises the ribbon
// with the flow of the reach it belongs to (above intake / between intake and turbine / below).

export interface WaterUniforms {
  uTime: { value: number };
  uOpacity: { value: number };
  uFoam: { value: number };
  uQUp: { value: number };
  uQMid: { value: number };
  uQDown: { value: number };
  uSIntake: { value: number };
  /** Opacity of clear (non-foam) water. */
  uAlphaMin: { value: number };
}

const NOISE = /* glsl */ `
  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

/** Ribbon width (m) and extra depth for a flow in L/s (a small mountain stream: 5 L/s ~ 1 m wide). */
const WIDTH_GLSL = /* glsl */ `
  float qWidth(float q) { return q < 0.02 ? 0.0 : clamp(0.25 + 0.75 * sqrt(q / 5.0), 0.25, 2.6); }
  float qDepth(float q) { return clamp(0.02 + 0.07 * sqrt(q / 5.0), 0.0, 0.2); }
`;

export function waterMaterial(opts: { stream?: boolean; color?: number; opacity?: number } = {}): {
  material: THREE.MeshStandardMaterial;
  uniforms: WaterUniforms;
} {
  const uniforms: WaterUniforms = {
    uTime: { value: 0 },
    uOpacity: { value: opts.opacity ?? 1 },
    uFoam: { value: 1 },
    uQUp: { value: 5 },
    uQMid: { value: 1 },
    uQDown: { value: 2 },
    uSIntake: { value: 55 },
    uAlphaMin: { value: 0.5 },
  };
  const material = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0x4f6f72,
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  if (opts.stream) material.defines = { STREAM: '' };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        attribute vec3 aSide; attribute float aAcross; attribute float aTau; attribute float aSlope;
        varying float vAcross; varying float vTau; varying float vSlope; varying float vQ;
        #ifdef STREAM
          attribute float aS; attribute float aWidthK;
          uniform float uQUp; uniform float uQMid; uniform float uQDown; uniform float uSIntake;
          ${WIDTH_GLSL}
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        vAcross = aAcross; vTau = aTau; vSlope = aSlope; vQ = 1.0;
        #ifdef STREAM
          // flow of this reach, blended over a few metres at the intake and at the turbine
          float qa = mix(uQMid, uQUp, smoothstep(uSIntake - 1.0, uSIntake + 2.0, aS));
          float q = mix(uQDown, qa, smoothstep(-4.0, 1.0, aS));
          vQ = q;
          // positions are baked for a 1 m wide ribbon: rescale across and lift with depth
          transformed += aSide * aAcross * 0.5 * (qWidth(q) * aWidthK - 1.0);
          transformed.y += qDepth(q);
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime; uniform float uOpacity; uniform float uFoam; uniform float uAlphaMin;
        varying float vAcross; varying float vTau; varying float vSlope; varying float vQ;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        float n1 = wNoise(vec2(vAcross * 2.2 + 3.0, vTau * 1.6 - uTime * 1.3));
        float n2 = wNoise(vec2(vAcross * 6.0 - 1.0, vTau * 4.5 - uTime * 2.7));
        float n3 = wNoise(vec2(vAcross * 13.0, vTau * 11.0 - uTime * 4.0));
        float rough = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;
        float edge = smoothstep(0.55, 1.0, abs(vAcross));
        float foam = smoothstep(0.8, 1.02, rough * 0.95 + vSlope * 0.38 * uFoam + edge * 0.08 + clamp(vQ / 80.0, 0.0, 0.12));
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.85 + 0.3 * n2), vec3(0.93, 0.95, 0.95), foam);
        // irregular soft banks: the edge wobbles with the flow noise
        float fade = 1.0 - smoothstep(0.45 + 0.3 * n1, 0.8 + 0.2 * n1, abs(vAcross));
        float qa = smoothstep(0.0, 0.25, vQ);
        diffuseColor.a = uOpacity * qa * fade * mix(uAlphaMin, 0.95, foam);
        if (diffuseColor.a < 0.01) discard;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.7, foam);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = normalize(normal + vec3(n2 - 0.5, n3 - 0.5, n1 - 0.5) * 0.35);`,
      );
  };
  material.customProgramCacheKey = () => (opts.stream ? 'site-water-stream' : 'site-water-sheet');
  return { material, uniforms };
}

/** Attribute arrays for a ribbon built from a centreline. */
export interface RibbonPoint {
  p: THREE.Vector3;
  /** Lateral unit vector (horizontal). */
  side: THREE.Vector3;
  halfWidth: number;
  tau: number;
  slope: number;
  s?: number;
  /** Stream mode: local width factor (natural irregularity). */
  widthK?: number;
}

/** Build a ribbon geometry (cols vertices across) with the water attributes. */
export function ribbonGeometry(pts: RibbonPoint[], cols = 5): THREE.BufferGeometry {
  const n = pts.length;
  const pos = new Float32Array(n * cols * 3);
  const side = new Float32Array(n * cols * 3);
  const across = new Float32Array(n * cols);
  const tau = new Float32Array(n * cols);
  const slope = new Float32Array(n * cols);
  const sArr = new Float32Array(n * cols);
  const wk = new Float32Array(n * cols);
  for (let i = 0; i < n; i++) {
    const q = pts[i];
    for (let c = 0; c < cols; c++) {
      const v = i * cols + c;
      const a = (c / (cols - 1)) * 2 - 1;
      pos[v * 3] = q.p.x + q.side.x * a * q.halfWidth;
      pos[v * 3 + 1] = q.p.y + q.side.y * a * q.halfWidth;
      pos[v * 3 + 2] = q.p.z + q.side.z * a * q.halfWidth;
      side[v * 3] = q.side.x;
      side[v * 3 + 1] = q.side.y;
      side[v * 3 + 2] = q.side.z;
      across[v] = a;
      tau[v] = q.tau;
      slope[v] = q.slope;
      sArr[v] = q.s ?? 0;
      wk[v] = q.widthK ?? 1;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = i * cols + c;
      const b = a + cols;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSide', new THREE.BufferAttribute(side, 3));
  geo.setAttribute('aAcross', new THREE.BufferAttribute(across, 1));
  geo.setAttribute('aTau', new THREE.BufferAttribute(tau, 1));
  geo.setAttribute('aSlope', new THREE.BufferAttribute(slope, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(sArr, 1));
  geo.setAttribute('aWidthK', new THREE.BufferAttribute(wk, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** A water sheet mesh (falls, overflow nappes, films) along a centreline. */
export function waterSheet(
  centre: THREE.Vector3[],
  side: THREE.Vector3,
  halfWidth: number | number[],
  opts: { slope?: number; color?: number; cols?: number } = {},
): { mesh: THREE.Mesh; uniforms: WaterUniforms } {
  let tau = 0;
  const pts: RibbonPoint[] = centre.map((p, i) => {
    if (i > 0) tau += p.distanceTo(centre[i - 1]);
    const hw = typeof halfWidth === 'number' ? halfWidth : halfWidth[i];
    return { p, side, halfWidth: hw, tau, slope: opts.slope ?? 0.6 };
  });
  const { material, uniforms } = waterMaterial({ color: opts.color ?? 0x8aa3a6 });
  const mesh = noShadow(new THREE.Mesh(ribbonGeometry(pts, opts.cols ?? 3), material));
  mesh.receiveShadow = false;
  mesh.renderOrder = 2;
  return { mesh, uniforms };
}
