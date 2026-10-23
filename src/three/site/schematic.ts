import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '@onigam/lab-kit/three';
import { noShadow } from './common';

// Schematic overlay: fat dashed lines whose dashes travel with the flows
// (water in the penstock, hydro power in the cable, PV power to the annex).

interface Flow {
  line: Line2;
  mat: LineMaterial;
}

const size = new THREE.Vector2();

function flowLine(points: THREE.Vector3[], color: number, dash: number): Flow {
  const geo = new LineGeometry();
  geo.setPositions(points.flatMap((p) => [p.x, p.y, p.z]));
  const mat = new LineMaterial({
    color,
    linewidth: 4,
    dashed: true,
    dashSize: dash,
    gapSize: dash * 0.7,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const line = new Line2(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 10;
  // LineMaterial needs the viewport size in pixels: read it from the renderer at draw time
  line.onBeforeRender = (renderer) => {
    renderer.getSize(size);
    mat.resolution.copy(size);
  };
  return { line, mat };
}

export interface Schematic {
  group: THREE.Group;
  setPenstock(points: THREE.Vector3[]): void;
  update(state: SimState, view: ViewOpts, dt: number): void;
}

export function createSchematic(cable: THREE.Vector3[], pv: THREE.Vector3[]): Schematic {
  const group = new THREE.Group();
  group.name = 'schematic';
  group.visible = false;
  let water = flowLine([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)], 0x2f8cff, 1.4);
  const power = flowLine(cable, 0xff8a1f, 0.45);
  const solar = flowLine(pv, 0xffd21f, 0.4);
  group.add(water.line, power.line, solar.line);
  noShadow(group);

  return {
    group,
    setPenstock(points) {
      group.remove(water.line);
      water.line.geometry.dispose();
      water.mat.dispose();
      water = flowLine(points, 0x2f8cff, 1.4);
      group.add(noShadow(water.line));
    },
    update(state, view, dt) {
      group.visible = view.schematic;
      if (!view.schematic) return;
      const k = dt * Math.max(view.slowMo, 0.05);
      water.mat.dashOffset -= k * (state.qPipe > 0.01 ? 1.5 + 1.2 * state.qPipe : 0);
      power.mat.dashOffset -= k * (state.pToBus > 1 ? 0.4 + state.pToBus / 300 : 0);
      solar.mat.dashOffset -= k * (state.pPv > 1 ? 0.3 + state.pPv / 1500 : 0);
      water.mat.opacity = state.qPipe > 0.01 ? 0.95 : 0.35;
      power.mat.opacity = state.pToBus > 1 ? 0.95 : 0.35;
      solar.mat.opacity = state.pPv > 1 ? 0.95 : 0.35;
    },
  };
}
