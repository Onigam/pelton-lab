import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAT } from '../materials';
import { mesh, rng } from '../util';
import { bake, clipBand, compose, extrudeZ, polyShape } from './common';
import { BED_Y, CREST, FRAME, HALF_W, profileY, STEEL_T } from './dims';
import { woodTexture } from './textures';

// Treated-wood frame of the intake (site B, s09/s10): two thick side boards made of three
// planks cut to the screen profile, four corner posts, the upstream sill under the crest,
// galvanised L-brackets bolting the stainless body to the board ends. Plus the brush.

export interface FramePart {
  group: THREE.Group;
  anchor: THREE.Object3D;
  /** Materials cut in half by the cutaway plane. */
  clipMats: THREE.Material[];
}

/** Top edge of the side boards: 10 cm above the wetted profile, flat over the crest. */
export const boardTop = (x: number) => profileY(x) + FRAME.above + 0.02;

function woodMat(base: THREE.MeshStandardMaterial, tint: number, seed: number): THREE.MeshStandardMaterial {
  const map = woodTexture(seed);
  map.repeat.set(1, 4); // one tile = 1 m along the grain × 0.25 m across
  base.map = map;
  base.color.set(tint);
  return base;
}

/** Side board polygon (x, y) and its three planks. */
function boardPlanks(): THREE.Vector2[][] {
  const poly: THREE.Vector2[] = [new THREE.Vector2(FRAME.x1, FRAME.bottom), new THREE.Vector2(FRAME.x0, FRAME.bottom)];
  for (let i = 0; i <= 24; i++) {
    const x = FRAME.x0 + ((FRAME.x1 - FRAME.x0) * i) / 24;
    poly.push(new THREE.Vector2(x, boardTop(x)));
  }
  const cuts = [FRAME.bottom, 0.432, 0.436, 0.648, 0.652, 1];
  const planks: THREE.Vector2[][] = [];
  for (let i = 0; i < cuts.length; i += 2) {
    const p = clipBand(poly, cuts[i], cuts[i + 1]);
    if (p.length >= 3) planks.push(p);
  }
  return planks;
}

/** Galvanised L-bracket: flange on the board end face (+X) and flange on the stainless side. */
function bracketGeo(side: number): THREE.BufferGeometry {
  const t = 0.0025;
  const a = new THREE.BoxGeometry(t, 0.06, 0.032);
  a.translate(t / 2, 0, -side * 0.016);
  const b = new THREE.BoxGeometry(0.05, 0.06, t);
  b.translate(0.025, 0, (side * t) / 2);
  return mergeGeometries([a.toNonIndexed(), b.toNonIndexed()])!;
}

/** Hex bolt head + washer pointing along +Y. */
function boltGeo(): THREE.BufferGeometry {
  const washer = new THREE.CylinderGeometry(0.011, 0.011, 0.0015, 16);
  washer.translate(0, 0.00075, 0);
  const head = new THREE.CylinderGeometry(0.0075, 0.0075, 0.006, 6);
  head.translate(0, 0.0045, 0);
  return mergeGeometries([washer.toNonIndexed(), head.toNonIndexed()])!;
}

export function buildFrame(): FramePart {
  const group = new THREE.Group();
  group.name = 'in-frame';
  const wood = woodMat(MAT.wood(), 0xd9b48c, 3);
  const dark = woodMat(MAT.woodDark(), 0xb08a68, 8);
  const zinc = MAT.zinc();
  const clipMats: THREE.Material[] = [wood, dark, zinc];

  // side boards: 3 planks each, 35 mm thick, against the stainless cheeks
  for (const side of [-1, 1]) {
    for (const p of boardPlanks()) {
      const z0 = side > 0 ? FRAME.zIn : -FRAME.zOut;
      group.add(mesh(extrudeZ(polyShape(p), z0, z0 + FRAME.zOut - FRAME.zIn, 2), wood));
    }
  }

  // upstream sill (two planks) under the stainless crest flange
  const sillTop = CREST.y - STEEL_T;
  for (const [y0, y1] of [
    [0.5, 0.648],
    [0.652, sillTop],
  ]) {
    const g = new THREE.BoxGeometry(0.068, y1 - y0, 2 * FRAME.zIn);
    group.add(mesh(g, wood, [-0.336, (y0 + y1) / 2, 0]));
  }

  // corner posts with a pyramid cap (rain runs off the end grain)
  const P = FRAME.post;
  const zPost = FRAME.zOut + P / 2;
  const posts: [number, number, number][] = [
    [FRAME.x0 + P / 2, 0.53, 0.94],
    [FRAME.x1 - P / 2, BED_Y - 0.02, boardTop(FRAME.x1) + 0.05],
  ];
  for (const [x, y0, y1] of posts) {
    for (const side of [-1, 1]) {
      group.add(mesh(new THREE.BoxGeometry(P, y1 - y0, P), dark, [x, (y0 + y1) / 2, side * zPost]));
      const cap = new THREE.ConeGeometry(P * 0.71, 0.018, 4, 1);
      cap.rotateY(Math.PI / 4);
      group.add(mesh(cap, dark, [x, y1 + 0.009, side * zPost]));
    }
  }
  bake(group);

  // galvanised brackets at the downstream end of each board + their bolts
  const bolts: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const boltAt = (p: THREE.Vector3, dir: THREE.Vector3) =>
    bolts.push(
      new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(up, dir), new THREE.Vector3(1, 1, 1)),
    );
  const brackets: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    for (const y of [0.43, 0.52]) {
      const g = bracketGeo(side);
      g.translate(FRAME.x1, y, side * (HALF_W + STEEL_T));
      brackets.push(g);
      boltAt(new THREE.Vector3(FRAME.x1 + 0.0025, y, side * (FRAME.zIn + 0.016)), new THREE.Vector3(1, 0, 0));
      boltAt(new THREE.Vector3(FRAME.x1 + 0.03, y, side * (HALF_W + STEEL_T + 0.0025)), new THREE.Vector3(0, 0, side));
    }
    // coach bolts through the posts into the boards
    for (const [x, ys] of [
      [FRAME.x0 + P / 2, [0.72, 0.86]],
      [FRAME.x1 - P / 2, [0.3, 0.55]],
    ] as [number, number[]][]) {
      for (const y of ys) boltAt(new THREE.Vector3(x, y, side * (FRAME.zOut + P)), new THREE.Vector3(0, 0, side));
    }
  }
  group.add(mesh(mergeGeometries(brackets)!, zinc));
  const boltMesh = new THREE.InstancedMesh(boltGeo(), zinc, bolts.length);
  bolts.forEach((m, i) => boltMesh.setMatrixAt(i, m));
  boltMesh.castShadow = true;
  group.add(boltMesh);

  // on top of the near upstream post (clear of the screen and plate labels)
  const anchor = new THREE.Object3D();
  anchor.position.set(FRAME.x0 + P / 2, 0.97, zPost);
  group.add(anchor);
  return { group, anchor, clipMats };
}

/** Scrubbing brush with a wooden handle, lying on the far board (as in the video). */
export function buildBrush(): { group: THREE.Group; anchor: THREE.Object3D } {
  const group = new THREE.Group();
  group.name = 'in-brush';
  const r = rng(29);
  const wood = MAT.woodLight();
  // oval stock, slightly domed
  const oval = new THREE.Shape();
  oval.absellipse(0, 0, 0.085, 0.03, 0, Math.PI * 2, false, 0);
  const body = new THREE.ExtrudeGeometry(oval, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 24,
  });
  body.rotateX(-Math.PI / 2); // lying flat, extruded up
  group.add(mesh(body, wood, [0, 0.006, 0]));
  // handle: a tapered round grip leaving one end, with a hanging hole ring
  const handle = new THREE.CapsuleGeometry(0.011, 0.11, 4, 12);
  handle.rotateZ(Math.PI / 2);
  group.add(mesh(handle, wood, [0.15, 0.016, 0], [0, 0, 0.12]));
  const ring = new THREE.TorusGeometry(0.006, 0.0015, 6, 16);
  group.add(mesh(ring, MAT.zinc(), [0.218, 0.024, 0], [0, 0, 0.12]));
  // natural-fibre bristle tufts (the brush lies on its back, bristles up)
  const tuft = new THREE.CylinderGeometry(0.0042, 0.0032, 0.026, 7, 1);
  const tufts = new THREE.InstancedMesh(tuft, new THREE.MeshStandardMaterial({ color: 0xcdb68a, roughness: 0.95 }), 40);
  let n = 0;
  for (let row = -1; row <= 1; row++) {
    const cnt = row === 0 ? 13 : 11;
    for (let i = 0; i < cnt; i++) {
      const x = (i / (cnt - 1) - 0.5) * (row === 0 ? 0.13 : 0.11);
      tufts.setMatrixAt(
        n++,
        compose([x, 0.034 + r() * 0.002, row * 0.017], [(r() - 0.5) * 0.15, 0, (r() - 0.5) * 0.15], [1, 1, 1]),
      );
    }
  }
  tufts.count = n;
  tufts.castShadow = true;
  tufts.receiveShadow = true;
  group.add(tufts);

  // on the far board top, following its slope
  const x0 = -0.3;
  const x1 = -0.14;
  const slope = Math.atan2(boardTop(x1) - boardTop(x0), x1 - x0);
  group.position.set((x0 + x1) / 2, (boardTop(x0) + boardTop(x1)) / 2 + 0.002, -(FRAME.zIn + FRAME.zOut) / 2);
  group.rotation.set(0, 0.18, slope);
  const anchor = new THREE.Object3D();
  anchor.position.set(0, 0.06, 0);
  group.add(anchor);
  return { group, anchor };
}
