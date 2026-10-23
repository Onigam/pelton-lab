import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import type { SimState } from '../../sim/types';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { buildBox } from './box';
import { buildCoanda } from './coanda';
import { buildDebris } from './debris';
import { OUTLET } from './dims';
import { addLights, buildDiorama } from './diorama';
import { IntakeFlows } from './flows';
import { buildBrush, buildFrame } from './frame';
import { buildLoupe } from './loupe';
import { buildSchematic } from './schematic';
import { IntakeWater } from './water';
import { buildWeir } from './weir';

// Dedicated, detailed scene of the Coanda intake of site B as a cut-out diorama of the stream
// bed: dry-stone weir and pond, treated-wood frame, stainless crest + acceleration plate,
// curved wedge-wire screen, collection box with sand trap, outlet strainer and HDPE penstock,
// air vent and the cleaning brush. The water shows how the screen works: a thin sheet runs
// down the screen, threads of water fall through the slots into the box, the surplus and the
// leaves slide off the lip back into the stream.

interface PartDef {
  id: string;
  object: THREE.Object3D;
  explode: THREE.Vector3;
  anchor: THREE.Object3D;
  label: [string, string];
  minor?: boolean;
}

/** A material set cut by one plane in cutaway mode; the plane follows its part's explode. */
interface Cut {
  plane: THREE.Plane;
  mats: THREE.Material[];
  object: THREE.Object3D;
  axis: 'x' | 'z';
  base: number;
}

export function createIntakeScene(): SceneModule {
  const scene = new THREE.Scene();
  scene.name = 'intake';
  scene.background = new THREE.Color(0xefe6d3);
  scene.fog = new THREE.Fog(0xefe6d3, 7, 16);
  // the lead fills scene.environment from the shared PMREM RoomEnvironment (stainless reflections)
  scene.userData.wantsEnv = true;
  scene.environmentIntensity = 1;
  addLights(scene);
  scene.add(buildDiorama(scene));

  const root = new THREE.Group();
  root.name = 'intake-parts';
  scene.add(root);

  const weir = buildWeir();
  const frame = buildFrame();
  const brush = buildBrush();
  const co = buildCoanda();
  const bx = buildBox();
  const debris = buildDebris();
  co.screen.add(debris.screen); // stuck leaves belong to (and explode with) the screen
  root.add(weir.group, frame.group, brush.group, co.ramp, co.screen, co.overflow, bx.box, bx.trap, bx.outlet, bx.vent);

  // ---- parts, explode offsets and hotspots ------------------------------------------------
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const defs: PartDef[] = [
    {
      id: 'in-weir',
      object: weir.group,
      explode: V(0, 0, 0),
      anchor: weir.anchor,
      label: ['Seuil en pierres sèches', 'Dry-stone weir'],
    },
    {
      id: 'in-frame',
      object: frame.group,
      explode: V(0, 0.42, 0),
      anchor: frame.anchor,
      label: ['Cadre bois traité', 'Treated-wood frame'],
    },
    {
      id: 'in-ramp',
      object: co.ramp,
      explode: V(-0.12, 0.62, 0),
      anchor: co.anchors.ramp,
      label: ["Plaque d'accélération", 'Acceleration plate'],
    },
    {
      id: 'in-screen',
      object: co.screen,
      explode: V(0.06, 0.84, 0),
      anchor: co.anchors.screen,
      label: ['Grille Coanda 1 mm', 'Coanda screen 1 mm'],
    },
    {
      id: 'in-overflow',
      object: co.overflow,
      explode: V(0.34, 0.5, 0),
      anchor: co.anchors.overflow,
      label: ['Bec de surverse', 'Overflow lip'],
      minor: true,
    },
    {
      id: 'in-box',
      object: bx.box,
      explode: V(0, 0.3, 0.55),
      anchor: bx.anchors.box,
      label: ['Bac de collecte', 'Collection box'],
    },
    {
      id: 'in-sandtrap',
      object: bx.trap,
      explode: V(0.28, 0.16, 0.55),
      anchor: bx.anchors.trap,
      label: ['Dessableur + purge', 'Sand trap + purge'],
      minor: true,
    },
    {
      id: 'in-outlet',
      object: bx.outlet,
      explode: V(0.3, 0, -0.12),
      anchor: bx.anchors.outlet,
      label: ['Crépine + sortie PEHD Ø63', 'Strainer + HDPE Ø63 outlet'],
    },
    {
      id: 'in-vent',
      object: bx.vent,
      explode: V(0.42, 0.25, -0.05),
      anchor: bx.anchors.vent,
      label: ['Reniflard (évent)', 'Air vent'],
      minor: true,
    },
    {
      id: 'in-brush',
      object: brush.group,
      explode: V(0, 0.55, -0.5),
      anchor: brush.anchor,
      label: ['Brosse de nettoyage', 'Cleaning brush'],
      minor: true,
    },
  ];
  const registry = new PartRegistry();
  const hotspots: Hotspot[] = [];
  for (const d of defs) {
    registry.add(d.id, d.object, d.explode);
    hotspots.push({ partId: d.id, anchor: d.anchor, label: l(...d.label), minor: d.minor });
  }

  // ---- water, flows, overlays (not selectable) ------------------------------------------
  const water = new IntakeWater();
  const flows = new IntakeFlows(bx.pipePath);
  const schematic = buildSchematic();
  const loupe = buildLoupe();
  scene.add(water.group, flows.group, debris.moving, schematic.group, loupe.group);

  // ---- cutaway: the whole intake unit is cut along the flow and the near half (z > 0, camera
  // side) removed: section through frame, plate, screen, lip, box, sand trap and the water;
  // the outlet fittings are cut along their own axis. Planes follow the explode offsets. ----
  const zCut = (mats: THREE.Material[], object: THREE.Object3D): Cut => ({
    plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    mats,
    object,
    axis: 'z',
    base: 0,
  });
  const cuts: Cut[] = [
    zCut(frame.clipMats, frame.group),
    zCut(co.clip.ramp, co.ramp),
    zCut([...co.clip.screen, ...debris.screenMats, ...water.sheetMats], co.screen),
    zCut(co.clip.overflow, co.overflow),
    zCut([...bx.boxMats, ...water.boxMats, ...flows.clipMats], bx.box),
    zCut(bx.trapMats, bx.trap),
    // outlet fittings and strainer: cut along their own axis, downstream half removed
    {
      plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), OUTLET.x),
      mats: bx.outletMats,
      object: bx.outlet,
      axis: 'x',
      base: OUTLET.x,
    },
  ];
  for (const c of cuts) for (const m of c.mats) m.userData.side = m.side;
  let cutOn = false;
  const setCutaway = (on: boolean) => {
    cutOn = on;
    for (const c of cuts) {
      for (const m of c.mats) {
        m.clippingPlanes = on ? [c.plane] : null;
        m.clipShadows = on;
        m.side = on ? THREE.DoubleSide : (m.userData.side as THREE.Side);
        m.needsUpdate = true;
      }
    }
  };

  // ghosted (x-ray) still counts as present: the water stays visible through the walls
  const present = (id: string) => ['solid', 'ghost'].includes(registry.get(id)?.display ?? 'hidden');
  /** View options for the overlays (hidden while anything is exploded). */
  const overlay: ViewOpts = { slowMo: 1, cutaway: false, schematic: false, time: 0 };

  function update(state: SimState, dt: number, view: ViewOpts): void {
    if (view.cutaway !== cutOn) setCutaway(view.cutaway);
    for (const c of cuts) c.plane.constant = c.base + c.object.position[c.axis];

    // water only on the assembled intake (screen and trough present)
    let exploded = false;
    for (const p of registry.parts.values()) if (p.factor > 0.01) exploded = true;
    const wet = !exploded && present('in-screen') && present('in-box');
    water.group.visible = wet;
    flows.group.visible = wet;
    debris.moving.visible = wet;
    debris.update(state, dt, view);
    if (wet) {
      water.update(state, dt, view);
      flows.update(state, dt, view, water.boxLevel(state));
    }
    Object.assign(overlay, view);
    overlay.schematic = view.schematic && !exploded;
    schematic.update(state, dt, overlay);
    loupe.update(state, dt, overlay);
  }

  return {
    id: 'intake',
    scene,
    registry,
    hotspots,
    // 3/4 view from the downstream near bank, slightly above
    home: { position: new THREE.Vector3(1.95, 1.55, 1.85), target: new THREE.Vector3(0.0, 0.52, -0.05) },
    minDistance: 0.25,
    maxDistance: 8,
    update,
  };
}
