import * as THREE from 'three';
import { MAT } from '../materials';
import { canvasTexture } from '../util';
import { smooth } from './common';
import { TURBINE, bedAt, streamFrame } from './layout';
import type { Terrain } from './terrain';

// Penstock: black HDPE Ø63 PN10 (white stripe) laid on the east bank from the Coanda outlet
// down to the turbine. Near the turbine it rises in a grey PVC protective sleeve and ends
// with a straight run on the turbine connection (anchor-local (-1.35, 1.22, 0.11), along +X).

const R_PIPE = 0.0315;
const R_SLEEVE = 0.045;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Turbine connection point and arrival direction, world space (assembled position). */
export function turbineInlet(): { end: THREE.Vector3; dir: THREE.Vector3 } {
  const end = new THREE.Vector3(-1.35, 1.22, 0.11).applyAxisAngle(Y_AXIS, TURBINE.rotY);
  end.add(new THREE.Vector3(TURBINE.x, TURBINE.padY, TURBINE.z));
  const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y_AXIS, TURBINE.rotY);
  return { end, dir };
}

function stripeTexture(): THREE.Texture {
  const { texture } = canvasTexture(4, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1c1e21';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e9ecec';
    ctx.fillRect(0, h * 0.47, w, h * 0.05);
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export interface Penstock {
  group: THREE.Group;
  hotspot: THREE.Object3D;
  /** Centreline (world), intake -> turbine, for the schematic overlay. */
  points: THREE.Vector3[];
  /** Length of the laid pipe (m). */
  length: number;
  rebuild(outlet: THREE.Vector3, outletDir: THREE.Vector3, sIntake: number): void;
}

export function createPenstock(terrain: Terrain): Penstock {
  const group = new THREE.Group();
  group.name = 'penstock';
  const pipeMat = new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.42, metalness: 0 });
  const sleeveMat = MAT.pvcGrey();
  const main = new THREE.Mesh(new THREE.BufferGeometry(), pipeMat);
  const end = new THREE.Mesh(new THREE.BufferGeometry(), pipeMat);
  const sleeve = new THREE.Mesh(new THREE.BufferGeometry(), sleeveMat);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(R_SLEEVE + 0.008, R_SLEEVE + 0.008, 0.07, 16), sleeveMat);
  for (const m of [main, end, sleeve, collar]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  const hotspot = new THREE.Object3D();
  group.add(hotspot);

  const { end: E, dir: D } = turbineInlet();
  const ground = (x: number, z: number) => terrain.groundY(x, z) + R_PIPE + 0.004;

  const pen: Penstock = {
    group,
    hotspot,
    points: [],
    length: 0,
    rebuild(outlet, outletDir, sIntake) {
      // --- run along the bank -------------------------------------------------------------
      const G = E.clone().addScaledVector(D, -3.3);
      G.y = ground(G.x, G.z);
      const pts: THREE.Vector3[] = [outlet.clone(), outlet.clone().addScaledVector(outletDir, 0.7)];
      const f = { x: 0, z: 0, tx: 0, tz: -1 };
      for (let s = sIntake - 2.5; s > 10; s -= 3) {
        streamFrame(s, f);
        const d =
          0.85 +
          1.6 * smooth(sIntake - 1, sIntake - 10, s) +
          0.35 * Math.sin(s * 0.09) * smooth(sIntake - 4, sIntake - 14, s);
        const x = f.x - f.tz * d;
        const z = f.z + f.tx * d;
        pts.push(new THREE.Vector3(x, Math.max(ground(x, z), bedAt(s) - 0.1), z));
      }
      // come down the bank and line up with the connection axis
      for (const k of [7.6, 5.4]) {
        const p = E.clone().addScaledVector(D, -k);
        pts.push(new THREE.Vector3(p.x, ground(p.x, p.z), p.z));
      }
      pts.push(G);
      const run = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const lenRun = run.getLength();

      // --- rise to the turbine inlet ------------------------------------------------------
      const Rp = E.clone().addScaledVector(D, -1.0);
      const rise = new THREE.CubicBezierCurve3(
        G,
        G.clone().addScaledVector(D, 0.95),
        Rp.clone().addScaledVector(D, -0.85),
        Rp,
      );
      const tail = new THREE.CurvePath<THREE.Vector3>();
      tail.add(rise);
      tail.add(new THREE.LineCurve3(Rp, E.clone()));

      main.geometry.dispose();
      main.geometry = new THREE.TubeGeometry(run, Math.max(32, Math.ceil(lenRun / 0.6)), R_PIPE, 8, false);
      end.geometry.dispose();
      end.geometry = new THREE.TubeGeometry(tail, 72, R_PIPE, 14, false);

      // --- grey PVC sleeve on the last ~4 m (stops just before the fitting) ---------------
      const sp: THREE.Vector3[] = [];
      for (let k = 0; k <= 4; k++) sp.push(run.getPointAt(1 - ((4 - k) * 0.6) / lenRun));
      const lenTail = tail.getLength();
      for (let k = 1; k <= 14; k++) sp.push(tail.getPointAt(Math.min(1, (k / 14) * (1 - 0.3 / lenTail))));
      sleeve.geometry.dispose();
      sleeve.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 90, R_SLEEVE, 14, false);
      collar.position.copy(sp[0]);
      collar.quaternion.setFromUnitVectors(Y_AXIS, run.getTangentAt(1 - 2.4 / lenRun));

      // --- outputs for the hotspot and the schematic ---------------------------------------
      hotspot.position.copy(run.getPointAt(Math.max(0, 1 - 22 / lenRun))).add(new THREE.Vector3(0, 0.7, 0));
      const out: THREE.Vector3[] = [];
      const n = Math.max(8, Math.ceil(lenRun / 2));
      for (let k = 0; k <= n; k++) out.push(run.getPointAt(k / n).add(new THREE.Vector3(0, 0.12, 0)));
      for (let k = 1; k <= 10; k++) out.push(tail.getPointAt(k / 10).add(new THREE.Vector3(0, 0.12, 0)));
      pen.points = out;
      pen.length = lenRun + lenTail;
    },
  };
  return pen;
}
