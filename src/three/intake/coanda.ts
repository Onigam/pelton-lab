import * as THREE from 'three';
import { MAT } from '../materials';
import { mesh } from '../util';
import { bake, profileSheet, stripSolid } from './common';
import {
  BAR,
  BAR_COUNT,
  BAR_PITCH,
  CREST,
  HALF_W,
  PHI_E,
  PHI_S,
  profile,
  profileAt,
  R_SCREEN,
  ROD_R,
  ROD_Z,
  S_END,
  S_LIPARC,
  S_PLATE,
  S_SCREEN,
  SC,
  SCREEN_LEN,
  sOfK,
  STEEL_T,
} from './dims';
import { barsTexture } from './textures';

// The stainless Coanda unit: crest bar + acceleration plate (in-ramp), the curved wedge-wire
// screen with its support rods and side cheeks (in-screen) and the overflow / debris lip
// (in-overflow). The bars are real instanced wedge profiles up close; from further away a
// mip-mapped stripe texture takes over (141 sub-pixel bars would shimmer).

export interface CoandaParts {
  ramp: THREE.Group;
  screen: THREE.Group;
  overflow: THREE.Group;
  anchors: { ramp: THREE.Object3D; screen: THREE.Object3D; overflow: THREE.Object3D };
  /** Materials of each part, cut in half by the cutaway plane (the box shows underneath). */
  clip: { ramp: THREE.Material[]; screen: THREE.Material[]; overflow: THREE.Material[] };
}

/** Polished stainless for the curved, wetted parts. */
function polished(): THREE.MeshStandardMaterial {
  const m = MAT.inox();
  m.roughness = 0.26;
  return m;
}

const anchorAt = (parent: THREE.Object3D, p: THREE.Vector2, z: number) => {
  const a = new THREE.Object3D();
  a.position.set(p.x, p.y, z);
  parent.add(a);
  return a;
};

function buildRamp(clip: THREE.Material[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-ramp';
  const inox = polished();
  // flange over the wooden sill + curved acceleration plate (one folded sheet)
  g.add(mesh(profileSheet(-0.07, S_PLATE, 0, -STEEL_T, -HALF_W, HALF_W, 22), inox));
  // fold down the upstream face of the sill
  const a = profileAt(-0.07);
  g.add(
    mesh(
      stripSolid(
        [new THREE.Vector2(a.x, a.y), new THREE.Vector2(a.x, a.y - 0.035)],
        [new THREE.Vector2(a.x + STEEL_T, a.y - STEEL_T), new THREE.Vector2(a.x + STEEL_T, a.y - 0.035)],
        -HALF_W,
        HALF_W,
      ),
      inox,
    ),
  );
  // black EPDM crest strip with a rounded nose, where the pond spills onto the plate
  const epdm = MAT.epdm();
  const strip = new THREE.BoxGeometry(0.026, 0.004, 2 * HALF_W);
  g.add(mesh(strip, epdm, [CREST.x - 0.048, CREST.y + 0.002, 0]));
  const nose = new THREE.CylinderGeometry(0.0045, 0.0045, 2 * HALF_W, 12, 1, false, Math.PI, Math.PI);
  nose.rotateX(Math.PI / 2);
  g.add(mesh(nose, epdm, [CREST.x - 0.061, CREST.y + 0.0, 0]));
  clip.push(inox, epdm);
  bake(g);
  return g;
}

/** Wedge-wire profile in (u along the flow, v along the normal), top face at v = 0. */
function wedgeGeometry(): THREE.BufferGeometry {
  const w = BAR.top;
  const s = new THREE.Shape([
    new THREE.Vector2(-w / 2, 0),
    new THREE.Vector2(-w * 0.13, -BAR.depth),
    new THREE.Vector2(w * 0.13, -BAR.depth),
    new THREE.Vector2(w / 2, 0),
  ]);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2 * HALF_W - 0.004, bevelEnabled: false });
  g.translate(0, 0, -HALF_W + 0.002);
  return g;
}

/** Matrix of bar i: top centre on the arc, rotated so its upstream edge sticks up by BAR.tilt. */
function barMatrix(i: number, out: THREE.Matrix4): THREE.Matrix4 {
  const margin = (SCREEN_LEN - BAR_COUNT * BAR_PITCH) / 2;
  const q = profile(S_PLATE + margin + (i + 0.5) * BAR_PITCH);
  const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -q.phi - BAR.tilt);
  return out.compose(new THREE.Vector3(q.p.x, q.p.y, 0), rot, new THREE.Vector3(1, 1, 1));
}

/** Smooth strip over the screen surface (far level of detail). */
function screenSurface(): THREE.BufferGeometry {
  const segs = 30;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const q = profile(sOfK(i / segs));
    const p = q.p.clone().addScaledVector(q.n, -0.0004);
    for (const z of [-HALF_W, HALF_W]) {
      pos.push(p.x, p.y, z);
      nor.push(q.n.x, q.n.y, 0);
      uv.push(i / segs, z > 0 ? 1 : 0);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < segs; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Side cheek outline: from the crest flange to the drip lip, -3 cm .. +5.5 cm off the profile. */
function cheekShape(): THREE.Shape {
  const top: THREE.Vector2[] = [];
  const bottom: THREE.Vector2[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const s = -0.07 + ((S_END + 0.07) * i) / n;
    top.push(profileAt(s, 0.055));
    bottom.push(profileAt(s, -0.03));
  }
  return new THREE.Shape([...bottom, ...top.reverse()]);
}

function buildScreen(clip: THREE.Material[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-screen';
  const inox = polished();
  // brushed finish on the flat cheeks: a mirror would only show the dark room floor
  const cheekMat = MAT.inox();
  cheekMat.roughness = 0.42;
  cheekMat.metalness = 0.85;

  // near: real wedge wires; far: textured strip
  const lod = new THREE.LOD();
  const mid = profileAt(sOfK(0.5));
  lod.position.set(mid.x, mid.y, 0);
  const near = new THREE.Group();
  const far = new THREE.Group();
  near.position.set(-mid.x, -mid.y, 0);
  far.position.copy(near.position);
  const bars = new THREE.InstancedMesh(wedgeGeometry(), inox, BAR_COUNT);
  const m = new THREE.Matrix4();
  for (let i = 0; i < BAR_COUNT; i++) bars.setMatrixAt(i, barMatrix(i, m));
  bars.castShadow = true;
  bars.receiveShadow = true;
  bars.name = 'wedge-wires';
  near.add(bars);
  const stripes = new THREE.MeshStandardMaterial({
    map: barsTexture(BAR_COUNT),
    metalness: 0.85,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  far.add(mesh(screenSurface(), stripes));
  lod.addLevel(near, 0);
  lod.addLevel(far, 1.0, 0.1);
  g.add(lod);

  // support rods (along the flow, under the wires) and the transverse end bars
  const rodR = R_SCREEN - BAR.depth - ROD_R + 0.0008;
  const steel = new THREE.Group();
  for (const z of ROD_Z) {
    const rod = new THREE.TorusGeometry(rodR, ROD_R, 8, 48, PHI_E - PHI_S);
    rod.rotateZ(Math.PI / 2 - PHI_E);
    steel.add(mesh(rod, inox, [SC.x, SC.y, z]));
  }
  steel.add(mesh(profileSheet(S_PLATE - 0.004, S_PLATE + 0.008, -0.0006, -0.016, -HALF_W, HALF_W, 2), inox));
  steel.add(mesh(profileSheet(S_SCREEN - 0.008, S_SCREEN + 0.004, -0.0006, -0.016, -HALF_W, HALF_W, 2), inox));
  g.add(steel);
  bake(steel);

  // side cheeks rising above the screen to keep the water sheet on it
  const cheek = new THREE.ExtrudeGeometry(cheekShape(), { depth: STEEL_T, bevelEnabled: false });
  g.add(mesh(cheek, cheekMat, [0, 0, HALF_W]));
  g.add(mesh(cheek, cheekMat, [0, 0, -HALF_W - STEEL_T]));
  clip.push(inox, stripes, cheekMat);
  return g;
}

function buildOverflow(clip: THREE.Material[]): THREE.Group {
  const g = new THREE.Group();
  g.name = 'in-overflow';
  const inox = polished();
  clip.push(inox);
  // solid lip continuing the curve, then a straight drip edge: surplus water and leaves
  // leave the screen here and fall back into the stream
  g.add(mesh(profileSheet(S_SCREEN, S_END, 0, -STEEL_T, -HALF_W, HALF_W, 10), inox));
  const end = profile(S_END);
  const a = end.p;
  const b = a.clone().addScaledVector(end.n, -0.018);
  const a2 = a.clone().addScaledVector(end.t, -STEEL_T);
  const b2 = b.clone().addScaledVector(end.t, -STEEL_T);
  g.add(mesh(stripSolid([a, b], [a2, b2], -HALF_W, HALF_W), inox));
  // stiffening rib under the lip
  const rib = profileSheet(S_LIPARC - 0.01, S_LIPARC + 0.01, -STEEL_T, -0.02, -HALF_W, HALF_W, 2);
  g.add(mesh(rib, inox));
  bake(g);
  return g;
}

export function buildCoanda(): CoandaParts {
  const clip = { ramp: [] as THREE.Material[], screen: [] as THREE.Material[], overflow: [] as THREE.Material[] };
  const ramp = buildRamp(clip.ramp);
  const screen = buildScreen(clip.screen);
  const overflow = buildOverflow(clip.overflow);
  return {
    ramp,
    screen,
    overflow,
    clip,
    anchors: {
      ramp: anchorAt(ramp, profileAt(S_PLATE * 0.45, 0.05), -0.12),
      screen: anchorAt(screen, profileAt(sOfK(0.45), 0.07), -0.04),
      overflow: anchorAt(overflow, profileAt(S_END, 0.07), -0.16),
    },
  };
}
