import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SimState } from '../../sim/types';
import { roundedPath } from '@onigam/lab-kit/three';
import { FLOW_COLORS } from './displays';
import { at, BATT, battModuleY, POS, SIZE } from './layout';
import type { Routes } from './wiring';

// Schematic overlay: animated dashed fat lines along the + conductors. Dash speed and
// width follow the power; the battery line reverses with the sign of the current.
// Drawn without depth test so the paths stay readable through the enclosures.

type FlowKey = keyof typeof FLOW_COLORS;

interface Flow {
  key: FlowKey;
  dash: Line2;
  dashMat: LineMaterial;
  baseMat: LineMaterial;
}

const DASH = 0.05;
const GAP = 0.04;

/** Front centre of a wall device (the line crosses the device there). */
const face = (dev: keyof typeof POS, sizeKey: string, dz = 0.01) => at(dev, 0, 0, SIZE[sizeKey][2] + dz);

function flowPaths(r: Routes): Record<FlowKey, THREE.Vector3[]> {
  const lynx = face('busbar', 'lynx');
  const battFront = new THREE.Vector3(
    POS.battery[0],
    battModuleY(BATT.count - 1) + SIZE.battery[1] / 2,
    POS.battery[2] + SIZE.battery[2] + 0.01,
  );
  const iso = at('mppt', 0.31, 0.01, SIZE.pvIso[2] + 0.01);
  return {
    hydro: [
      ...r.turbine,
      face('dcProtect', 'dcProtect'),
      ...r.dcTsP,
      face('hydroCtrl', 'hydroCtrl'),
      ...r.tsBusP,
      lynx,
    ],
    pv: [...r.pvInP, iso, ...r.pvP, face('mppt', 'mppt'), ...r.mpptP, lynx],
    battery: [lynx, ...r.battP, battFront],
    load: [lynx, ...r.invP, face('inverter', 'inverter'), ...r.acOut, face('acPanel', 'acPanel'), ...r.house1],
    dump: [lynx, ...r.divP, face('diversion', 'diversion'), ...r.dumpP, face('dump', 'dump', -0.1)],
  };
}

/** Rounded polyline sampled into a flat [x,y,z,...] array for LineGeometry. */
function sample(points: THREE.Vector3[]): number[] {
  const pts: THREE.Vector3[] = [];
  for (const p of points) if (!pts.length || pts[pts.length - 1].distanceTo(p) > 1e-4) pts.push(p);
  const path = roundedPath(pts, 0.025);
  const n = Math.max(8, Math.ceil(path.getLength() / 0.012));
  return path.getSpacedPoints(n).flatMap((p) => [p.x, p.y, p.z]);
}

function lineMat(color: string, dashed: boolean): LineMaterial {
  return new LineMaterial({
    color: new THREE.Color(color).getHex(),
    linewidth: dashed ? 4 : 2,
    dashed,
    dashSize: DASH,
    gapSize: GAP,
    transparent: true,
    opacity: dashed ? 1 : 0.35,
    depthTest: false,
    depthWrite: false,
  });
}

function power(key: FlowKey, s: SimState): number {
  switch (key) {
    case 'hydro':
      return s.pToBus;
    case 'pv':
      return s.pPv;
    case 'battery':
      return Math.abs(s.iBatt * s.vBatt);
    case 'load':
      return s.pLoad;
    case 'dump':
      return s.pDump;
  }
}

export function buildFlows(routes: Routes): { group: THREE.Group; update: (s: SimState, dt: number) => void } {
  const g = new THREE.Group();
  g.name = 'schematic-flows';
  g.visible = false;
  const flows: Flow[] = [];
  const paths = flowPaths(routes);
  for (const key of Object.keys(paths) as FlowKey[]) {
    const geo = new LineGeometry();
    geo.setPositions(sample(paths[key]));
    const baseMat = lineMat(FLOW_COLORS[key], false);
    const dashMat = lineMat(FLOW_COLORS[key], true);
    const base = new Line2(geo, baseMat);
    const dash = new Line2(geo, dashMat);
    dash.computeLineDistances();
    base.renderOrder = 20;
    dash.renderOrder = 21;
    g.add(base, dash);
    flows.push({ key, dash, dashMat, baseMat });
  }

  return {
    group: g,
    update: (s, dt) => {
      for (const f of flows) {
        const p = power(f.key, s);
        const on = p > 2;
        const k = Math.min(1, p / 2000);
        f.dash.visible = on;
        f.baseMat.opacity = on ? 0.4 : 0.15;
        if (!on) continue;
        f.dashMat.linewidth = 3 + 4 * k;
        // battery: + current = charging = flow from the bus towards the modules
        const dir = f.key === 'battery' && s.iBatt < 0 ? -1 : 1;
        const speed = 0.06 + 0.45 * k;
        f.dashMat.dashOffset = (f.dashMat.dashOffset - dir * speed * dt) % (DASH + GAP);
      }
    },
  };
}
