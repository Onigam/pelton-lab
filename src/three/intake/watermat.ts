import * as THREE from 'three';

// Water materials of the intake. Sheets keep PBR lighting (MeshStandardMaterial with injected
// flow noise); geometry carries aU (metres along the flow, scrolled by uPhase), aV (-1..1
// across) and aK (screen parameter: <0 on the plate, 0..1 on the screen, >1 on the lip).
// SHEET mode thins the layer along the screen as the wires shear water off, and ends it at
// uKEnd when everything has gone through (no overflow → the lower screen runs dry).

export interface FlowUniforms {
  uPhase: { value: number };
  uOpacity: { value: number };
  uFoam: { value: number };
  uAlphaMin: { value: number };
  /** Screen sheet: inflow, captured flow (L/s) and the k where the sheet ends. */
  uQIn: { value: number };
  uQCap: { value: number };
  uKEnd: { value: number };
}

const NOISE = /* glsl */ `
  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

const REM = /* glsl */ `
  // flow left on the screen at parameter k (capture spread evenly over [0, uKEnd])
  float remaining(float k) { return uQIn - uQCap * clamp(k / max(uKEnd, 0.001), 0.0, 1.0); }
`;

export function flowMaterial(
  opts: { color?: number; opacity?: number; foam?: number; alphaMin?: number; sheet?: boolean; scale?: number } = {},
): { material: THREE.MeshStandardMaterial; uniforms: FlowUniforms } {
  const uniforms: FlowUniforms = {
    uPhase: { value: 0 },
    uOpacity: { value: opts.opacity ?? 1 },
    uFoam: { value: opts.foam ?? 0.5 },
    uAlphaMin: { value: opts.alphaMin ?? 0.45 },
    uQIn: { value: 1 },
    uQCap: { value: 0 },
    uKEnd: { value: 1 },
  };
  const material = new THREE.MeshStandardMaterial({
    color: opts.color ?? 0x7fa6b5,
    roughness: 0.12,
    metalness: 0,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const scale = (opts.scale ?? 1).toFixed(3);
  if (opts.sheet) material.defines = { SHEET: '' };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    const decl = /* glsl */ `
      uniform float uQIn; uniform float uQCap; uniform float uKEnd;
      varying float vU; varying float vV; varying float vK;`;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\n attribute float aU; attribute float aV; attribute float aK; ${decl} ${REM}`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        vU = aU; vV = aV; vK = aK;
        #ifdef SHEET
          // a thicker layer where more water is left (the geometry sits on the bar tops)
          transformed += objectNormal * (0.0012 + 0.005 * clamp(remaining(aK) / 4.0, 0.0, 1.0));
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n uniform float uPhase; uniform float uOpacity; uniform float uFoam; uniform float uAlphaMin; ${decl} ${NOISE} ${REM}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        float su = vU * ${scale};
        float n1 = wNoise(vec2(vV * 2.0 + 3.0, su * 7.0 - uPhase * 7.0));
        float n2 = wNoise(vec2(vV * 9.0 - 1.0, su * 18.0 - uPhase * 18.0));
        float n3 = wNoise(vec2(vV * 31.0, su * 46.0 - uPhase * 46.0));
        float streak = n1 * 0.45 + n2 * 0.35 + n3 * 0.2;
        float foam = smoothstep(0.62, 0.95, streak * 0.9 + uFoam * 0.35);
        float fade = 1.0 - smoothstep(0.82, 1.0, abs(vV));
        float a = uOpacity * fade * mix(uAlphaMin, 0.95, foam);
        #ifdef SHEET
          float rem = remaining(vK);
          a *= smoothstep(0.0, 0.25, rem) * (1.0 - smoothstep(uKEnd - 0.05, uKEnd + 0.002, vK) * step(uQIn - uQCap, 0.05));
          foam = max(foam, smoothstep(0.6, 0.0, rem) * 0.5);
        #endif
        diffuseColor.rgb = mix(diffuseColor.rgb * (0.82 + 0.35 * n2), vec3(0.94, 0.97, 0.98), foam);
        diffuseColor.a = a;
        if (diffuseColor.a < 0.01) discard;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        normal = normalize(normal + vec3(n2 - 0.5, n3 - 0.5, n1 - 0.5) * 0.4);`,
      );
  };
  material.customProgramCacheKey = () => `intake-water-${opts.sheet ? 'sheet' : 'plain'}-${scale}`;
  return { material, uniforms };
}

export interface RibbonPoint {
  p: THREE.Vector3;
  /** Lateral unit vector. */
  side: THREE.Vector3;
  halfWidth: number;
  k?: number;
}

/** Ribbon geometry (cols vertices across) with the aU / aV / aK attributes. */
export function ribbon(pts: RibbonPoint[], cols = 5): THREE.BufferGeometry {
  const n = pts.length;
  const pos = new Float32Array(n * cols * 3);
  const aU = new Float32Array(n * cols);
  const aV = new Float32Array(n * cols);
  const aK = new Float32Array(n * cols);
  let u = 0;
  for (let i = 0; i < n; i++) {
    const q = pts[i];
    if (i > 0) u += q.p.distanceTo(pts[i - 1].p);
    for (let c = 0; c < cols; c++) {
      const v = i * cols + c;
      const a = (c / (cols - 1)) * 2 - 1;
      pos[v * 3] = q.p.x + q.side.x * a * q.halfWidth;
      pos[v * 3 + 1] = q.p.y + q.side.y * a * q.halfWidth;
      pos[v * 3 + 2] = q.p.z + q.side.z * a * q.halfWidth;
      aU[v] = u;
      aV[v] = a;
      aK[v] = q.k ?? 0;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = i * cols + c;
      const b = a + cols;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  g.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
  g.setAttribute('aK', new THREE.BufferAttribute(aK, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Threads of water falling through the slots: vertical sheets from the screen underside down
 *  to the box water level (uWaterY), drawn as many thin dashed streams. */
export function curtainMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uWaterY: { value: 0.4 },
      uPhase: { value: 0 },
      uAmount: { value: 1 },
      uDensity: { value: 1 },
      uKEnd: { value: 1 },
      uColor: { value: new THREE.Color(0xdcefff) },
    },
    vertexShader: /* glsl */ `
      attribute float aTop; attribute float aBot; attribute float aK;
      uniform float uWaterY;
      varying float vZ; varying float vFall; varying float vK;
      #include <common>
      #include <clipping_planes_pars_vertex>
      void main() {
        vec3 p = position;
        p.y = mix(aTop, min(uWaterY, aTop), aBot);
        vZ = position.z; vFall = aTop - p.y; vK = aK;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform float uPhase; uniform float uAmount; uniform float uDensity; uniform float uKEnd; uniform vec3 uColor;
      varying float vZ; varying float vFall; varying float vK;
      #include <clipping_planes_pars_fragment>
      float h1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
      void main() {
        #include <clipping_planes_fragment>
        float lanes = vZ * 110.0;
        float lane = floor(lanes);
        float f = fract(lanes);
        float h = h1(lane + floor(vK * 50.0) * 17.0);
        if (h > uDensity) discard;
        float thread = 1.0 - smoothstep(0.08, 0.2 + 0.1 * h, abs(f - 0.5));
        float dash = smoothstep(0.25, 0.55, fract(vFall * (9.0 + 8.0 * h) - uPhase * (1.0 + 0.6 * h) + h * 7.0));
        float a = thread * mix(0.25, 0.95, dash) * uAmount * (1.0 - smoothstep(uKEnd - 0.04, uKEnd + 0.01, vK));
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    clipping: true,
  });
}
