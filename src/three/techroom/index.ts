import * as THREE from 'three';
import type { SimState } from '../../sim/types';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { buildBattery } from './battery';
import { createPalette, type Device } from './common';
import { buildDiversion, buildHydroCtrl } from './controllers';
import { buildGxDisplay } from './displays';
import { buildDumpLoad } from './dumpload';
import { buildFlows } from './flows';
import { PORT } from './layout';
import { buildAcPanel, buildDcProtect } from './panels';
import { buildRoom } from './room';
import { buildBusbar, buildInverter, buildMppt } from './victron';
import { buildWiring, cableRoutes } from './wiring';

// Technical room of site B (hybrid solar + hydro) as a cut-away diorama: OSB backboard
// with the inverter/charger, PV and hydro controllers, diversion controller and dump load,
// DC safety box, AC board, busbars and GX display; 4 lithium modules under the bench.

/** Where the turbine cable (in its conduit) comes through the side wall, scene space. */
export const TURBINE_CABLE_ENTRY = PORT.wallEntry.clone();

function lights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8d8273, 0.85));

  const key = new THREE.DirectionalLight(0xfff0dc, 2.3);
  key.position.set(2.6, 4.4, 4.8);
  key.target.position.set(-0.3, 1.0, 0.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const c = key.shadow.camera;
  c.left = -2.5;
  c.right = 2.5;
  c.top = 2.5;
  c.bottom = -2.5;
  c.near = 0.5;
  c.far = 13;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xdde7ff, 0.45);
  fill.position.set(-3, 2.2, 3.5);
  scene.add(fill);

  // LED batten under the ceiling beam
  const batten = new THREE.PointLight(0xfff2dc, 5, 0, 2);
  batten.position.set(-0.35, 2.2, 1.08);
  scene.add(batten);
}

export function createTechRoomScene(): SceneModule {
  const scene = new THREE.Scene();
  scene.name = 'techroom';
  scene.background = new THREE.Color(0xece6da);
  // the lead fills scene.environment from a shared PMREM RoomEnvironment
  scene.userData.wantsEnv = true;
  scene.environmentIntensity = 0.55;
  lights(scene);

  const pal = createPalette();
  const room = buildRoom(pal);
  scene.add(room.group);

  const registry = new PartRegistry();
  const routes = cableRoutes();
  const devices: Device[] = [
    buildBattery(pal),
    buildInverter(pal),
    buildMppt(pal),
    buildHydroCtrl(pal),
    buildDiversion(pal),
    buildDumpLoad(pal),
    buildDcProtect(pal),
    buildAcPanel(pal),
    buildBusbar(pal),
    buildGxDisplay(pal),
    buildWiring(pal, routes),
  ];
  for (const d of devices) {
    scene.add(d.group);
    registry.add(d.id, d.group, d.explode);
  }

  const flows = buildFlows(routes);
  scene.add(flows.group);

  const hotspots: Hotspot[] = devices.map((d) => ({ partId: d.id, anchor: d.anchor, label: d.label }));

  return {
    id: 'techroom',
    scene,
    registry,
    hotspots,
    home: {
      position: new THREE.Vector3(1.45, 1.8, 3.45),
      target: new THREE.Vector3(-0.4, 1.3, 0.2),
    },
    minDistance: 0.4,
    maxDistance: 8,
    update(state: SimState, dt: number, view: ViewOpts) {
      for (const d of devices) d.update?.(state, dt, view, registry);
      room.sideWall.visible = !view.cutaway;
      flows.group.visible = view.schematic;
      if (view.schematic) flows.update(state, dt);
    },
  };
}
