import * as THREE from 'three';
import { l } from '../../i18n';
import type { Season } from '../../sim/types';
import { PartRegistry } from '../registry';
import type { Hotspot, SceneModule } from '../types';
import { SEASON_LOOK } from './common';
import { buildCableRun, buildTailrace, buildWall } from './bank';
import { createCabin } from './cabin';
import { createIntake } from './intake';
import { HOME, TURBINE, sAtElevation } from './layout';
import { createPenstock } from './penstock';
import { createSchematic } from './schematic';
import { createSky } from './sky';
import { createStream } from './stream';
import { buildTerrain } from './terrain';
import { createVegetation } from './vegetation';

// Site scene: a wooded Ariège valley with the stream, the Coanda intake (moves with the head),
// the HDPE penstock, the turbine anchor, the tailrace, the house with its PV roof and the
// technical room. World: X east, Y up, Z south, metres; the turbine stands at the origin.

export interface SiteScene extends SceneModule {
  /** Empty object where the turbine model goes (origin = ground under the housing, +Z = window side). */
  turbineAnchor: THREE.Object3D;
  /** Add the turbine model under the anchor and register its meshes as part 'turbine' (pick / ghost). */
  attachTurbine(model: THREE.Object3D): void;
}

export function createSiteScene(): SiteScene {
  const scene = new THREE.Scene();
  scene.name = 'site';
  const registry = new PartRegistry();

  const terrain = buildTerrain();
  scene.add(terrain.mesh, terrain.backdrop);
  const sky = createSky(scene, terrain.horizon);
  const stream = createStream(terrain);
  scene.add(stream.group, stream.rocks);
  const intake = createIntake();
  scene.add(intake.weir, intake.coanda);
  const penstock = createPenstock(terrain);
  scene.add(penstock.group);

  const anchor = new THREE.Group();
  anchor.name = 'turbine-anchor';
  anchor.position.set(TURBINE.x, TURBINE.padY, TURBINE.z);
  anchor.rotation.y = TURBINE.rotY;
  const turbineHotspot = new THREE.Object3D();
  turbineHotspot.position.set(0, 1.85, 0);
  anchor.add(turbineHotspot);
  scene.add(anchor);

  const tailrace = buildTailrace(terrain);
  const cable = buildCableRun(terrain);
  scene.add(tailrace.group, cable.group, buildWall(terrain));
  const cabin = createCabin();
  scene.add(cabin.cabin, cabin.pv, cabin.techroom);
  const vegetation = createVegetation(terrain);
  scene.add(vegetation.group);
  const schematic = createSchematic(cable.points, cabin.pvPoints);
  scene.add(schematic.group);

  // intake position follows the gross head (site A 76 m -> 350 m upstream, site B 21 m -> 55 m)
  let head = NaN;
  const placeIntake = (h: number) => {
    head = h;
    const s = Math.min(540, Math.max(12, sAtElevation(h)));
    intake.place(s);
    for (const id of ['weir', 'coanda']) {
      const p = registry.get(id);
      if (!p) continue;
      p.base.copy(p.object.position);
      registry.setFactor(id, p.factor);
    }
    penstock.rebuild(intake.outlet(), intake.outletDir(), s);
    schematic.setPenstock(penstock.points);
  };
  placeIntake(21);

  const up = (y: number) => new THREE.Vector3(0, y, 0);
  registry.add('stream', stream.group, up(1.5));
  registry.add('weir', intake.weir, up(2.5));
  registry.add('coanda', intake.coanda, up(4));
  registry.add('penstock', penstock.group, up(2));
  registry.add('turbine', anchor, up(3));
  registry.add('tailrace', tailrace.group, up(1.2));
  registry.add('cable-run', cable.group, up(1.8));
  registry.add('cabin', cabin.cabin, up(6));
  registry.add('pv', cabin.pv, up(11));
  registry.add('techroom', cabin.techroom, new THREE.Vector3(-4, 3, 0));

  const hotspots: Hotspot[] = [
    { partId: 'stream', anchor: stream.hotspot, label: l('Ruisseau', 'Stream') },
    { partId: 'weir', anchor: intake.weirHotspot, label: l('Seuil et bassin', 'Weir and pond') },
    { partId: 'coanda', anchor: intake.coandaHotspot, label: l("Prise d'eau Coanda", 'Coanda intake') },
    { partId: 'penstock', anchor: penstock.hotspot, label: l('Conduite forcée PEHD Ø63', 'HDPE penstock Ø63') },
    { partId: 'turbine', anchor: turbineHotspot, label: l('Turbine Pelton', 'Pelton turbine'), goto: 'turbine' },
    { partId: 'tailrace', anchor: tailrace.hotspot, label: l('Canal de fuite', 'Tailrace') },
    { partId: 'cable-run', anchor: cable.hotspot, label: l('Câble vers le local', 'Cable to the tech room') },
    { partId: 'cabin', anchor: cabin.hotspots.cabin, label: l('Maison', 'House') },
    { partId: 'pv', anchor: cabin.hotspots.pv, label: l('Panneaux PV 4,5 kWc', 'PV array 4.5 kWp') },
    {
      partId: 'techroom',
      anchor: cabin.hotspots.techroom,
      label: l('Local technique', 'Technical room'),
      goto: 'techroom',
    },
  ];

  let season: Season | undefined;
  let waterTime = 0;

  return {
    id: 'site',
    scene,
    registry,
    hotspots,
    home: { position: new THREE.Vector3(...HOME.position), target: new THREE.Vector3(...HOME.target) },
    minDistance: 2,
    maxDistance: 700,
    turbineAnchor: anchor,
    attachTurbine(model) {
      anchor.add(model);
      const part = registry.get('turbine');
      if (!part) return;
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.userData.ownerPart = 'turbine';
        m.userData.solidMaterial = m.material;
        part.meshes.push(m);
      });
      const display = part.display;
      part.display = 'solid';
      registry.setDisplay('turbine', display);
    },
    update(state, dt, view) {
      waterTime += dt * view.slowMo;
      if (Number.isFinite(state.headGross) && !(Math.abs(state.headGross - head) <= 0.5)) placeIntake(state.headGross);
      if (state.season !== season) {
        season = state.season;
        terrain.applySeason(season);
        vegetation.applySeason(season);
      }
      sky.update(state.hour, state.season, view.time);
      stream.update(state, waterTime, intake.s);
      intake.update(state, waterTime);
      tailrace.update(state, waterTime);
      const snow = SEASON_LOOK[state.season].roofSnow;
      cabin.update(
        sky.night,
        snow && registry.get('cabin')?.display === 'solid',
        snow && registry.get('techroom')?.display === 'solid',
      );
      schematic.update(state, view, dt);
    },
  };
}
