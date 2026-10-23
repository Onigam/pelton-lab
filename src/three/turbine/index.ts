import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import type { SimState } from '../../sim/types';
import { MAT } from '@onigam/lab-kit/three';
import { PartRegistry } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule, ViewOpts } from '@onigam/lab-kit/three';
import { canvasTexture, group, mesh } from '@onigam/lab-kit/three';
import { D } from './dims';
import { buildBearings, buildDrivetrain } from './drivetrain';
import { buildGenerator } from './generator';
import { buildHousing } from './housing';
import { buildHydraulics } from './hydraulics';
import { buildRunner } from './runner';
import { MachineWater } from './water';

/** Handwheel turns of the gear-operated main valve between fully open and fully closed. */
const MAIN_VALVE_TURNS = 20;

const NOZZLE_COLORS: [number, number][] = [
  [4, 0x8a9099],
  [5, 0x2b6cd1],
  [6, 0x2f9e44],
  [8, 0xf08c00],
  [10, 0xd6336c],
];

export interface TurbineModel {
  root: THREE.Group;
  machine: THREE.Group;
  registry: PartRegistry;
  hotspots: Hotspot[];
  update(s: SimState, dt: number, view: ViewOpts): void;
  setCutaway(on: boolean): void;
}

interface HotspotDef {
  part: string;
  at: [number, number, number];
  fr: string;
  en: string;
  minor?: boolean;
  /** Anchor in root coordinates instead of machine coordinates. */
  rootSpace?: boolean;
}

const HOTSPOTS: HotspotDef[] = [
  { part: 'buckets', at: [0.1, D.axisY + 0.11, 0.15], fr: 'Roue Pelton', en: 'Pelton runner' },
  { part: 'injector-top', at: [D.topJetX, D.roof + 0.25, D.pipeZ], fr: 'Injecteur à pointeau', en: 'Spear injector' },
  { part: 'injector-quick', at: [-0.36, D.sideJetY - 0.045, 0.16], fr: 'Injecteur à buses', en: 'Quick-change nozzle' },
  { part: 'valve-main', at: [-0.97, 0.39, D.pipeZ], fr: 'Vanne principale', en: 'Main valve' },
  { part: 'gauge', at: [-0.82, 0.54, 0.14], fr: 'Manomètre', en: 'Pressure gauge' },
  { part: 'valve-bypass', at: [-0.745, 0.0, 0.14], fr: 'Vanne de dérivation', en: 'Bypass valve' },
  { part: 'manifold', at: [-0.46, 0.64, D.pipeZ], fr: 'Col de cygne', en: 'Gooseneck manifold', minor: true },
  { part: 'valve-branch', at: [-0.66, 0.47, 0.16], fr: 'Vannes de branche', en: 'Branch valves', minor: true },
  { part: 'penstock-end', at: [-1.28, 0.36, D.pipeZ], fr: 'Arrivée PEHD', en: 'HDPE inlet', minor: true },
  { part: 'stator', at: [0.07, D.axisY + 0.05, -0.094], fr: 'Stator bobiné', en: 'Wound stator' },
  { part: 'rotor', at: [-0.05, D.axisY - 0.085, -0.115], fr: 'Rotor à aimants', en: 'Magnet rotor' },
  { part: 'magnets', at: [0.0, D.axisY + 0.06, -0.075], fr: 'Aimants N52', en: 'N52 magnets', minor: true },
  {
    part: 'bearing-cartridge',
    at: [0.04, D.axisY + 0.05, -0.03],
    fr: 'Cartouche palier',
    en: 'Bearing cartridge',
    minor: true,
  },
  { part: 'bearing-1', at: [0, D.axisY + 0.026, -0.017], fr: 'Roulement 1', en: 'Bearing 1', minor: true },
  { part: 'shaft', at: [0.0, D.axisY + 0.015, 0.15], fr: 'Arbre inox', en: 'Stainless shaft', minor: true },
  { part: 'seal', at: [0.02, D.axisY - 0.02, 0.01], fr: 'Joint à lèvre', en: 'Lip seal', minor: true },
  { part: 'cover', at: [0.0, D.roof + 0.01, -0.06], fr: 'Capot alu marin', en: 'Marine-alu cover' },
  { part: 'window', at: [0.2, 0.08, D.zFront], fr: 'Hublot PMMA', en: 'PMMA window', minor: true },
  { part: 'partition', at: [-0.2, 0.2, D.zPart], fr: 'Cloison étanche', en: 'Watertight partition', minor: true },
  { part: 'rear-panel', at: [0.13, 0.2, D.zBack], fr: 'Flasque arrière', en: 'Rear panel', minor: true },
  { part: 'rectifier', at: [0.19, 0.075, -0.1], fr: 'Redresseur', en: 'Rectifier' },
  { part: 'terminal', at: [0.19, 0.05, -0.035], fr: 'Bornier', en: 'Terminal block', minor: true },
  { part: 'cable', at: [0.2, -0.2, -0.5], fr: 'Câble 6 mm²', en: '6 mm² cable', minor: true },
  { part: 'base', at: [0.27, 0.02, 0.21], fr: 'Embase', en: 'Base plate', minor: true },
  { part: 'skid', at: [0.33, 0.5, 0.26], fr: 'Châssis', en: 'Skid frame', rootSpace: true },
  { part: 'deflector', at: [-0.2, 0.31, 0.15], fr: 'Déflecteur', en: 'Jet deflector' },
  { part: 'latches', at: [D.x1 + 0.01, 0.05, 0.13], fr: 'Grenouillères', en: 'Toggle latches', minor: true },
  { part: 'sensors', at: [0, D.axisY + 0.14, -0.1], fr: 'Capteurs', en: 'Sensors' },
  { part: 'controller-box', at: [0.43, 0.72, 0.02], fr: 'Coffret IP65', en: 'IP65 box', rootSpace: true },
  { part: 'air-valve', at: [-0.46, 0.73, D.pipeZ], fr: 'Ventouse', en: 'Air valve', minor: true },
];

export function createTurbineModel(): TurbineModel {
  const registry = new PartRegistry();
  const root = group('turbine');
  const machine = group('machine', [0, D.baseY, 0]);
  root.add(machine);

  const sensors = group('sensors');
  machine.add(sensors);

  const housing = buildHousing(root, machine, registry);
  buildBearings(machine, registry);
  const { spinner } = buildDrivetrain(machine, registry);
  const runner = buildRunner(spinner, registry);
  const gen = buildGenerator(machine, spinner, sensors, registry);
  const hyd = buildHydraulics(machine, sensors, registry);
  registry.add('sensors', sensors, new THREE.Vector3(0, 0.32, -0.3));

  const water = new MachineWater();
  water.setFloor(-D.baseY);
  machine.add(water.group);

  // hotspots: anchors live in machine/root space and follow their part's explode offset
  const hotspots: Hotspot[] = [];
  const follow: { anchor: THREE.Object3D; base: THREE.Vector3; part: string }[] = [];
  for (const h of HOTSPOTS) {
    if (!registry.get(h.part)) continue;
    const anchor = new THREE.Object3D();
    anchor.position.set(...h.at);
    (h.rootSpace ? root : machine).add(anchor);
    hotspots.push({ partId: h.part, anchor, label: l(h.fr, h.en), minor: h.minor });
    follow.push({ anchor, base: anchor.position.clone(), part: h.part });
  }

  // cutaway clipping planes (world space, refreshed every frame)
  const planeHouse = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const planePipe = new THREE.Plane(new THREE.Vector3(0, 0, -1), D.pipeZ);
  const planeHouseWorld = planeHouse.clone();
  const planePipeWorld = planePipe.clone();
  const houseCut = [
    ...housing.houseCut,
    ...[
      'bearing-1',
      'bearing-2',
      'bearing-3',
      'seal',
      'bearing-cartridge',
      'rotor',
      'rectifier',
      'terminal',
      'cable',
      'sensors',
    ].map((id) => registry.get(id)!.object),
  ];
  const setPlanes = (objs: THREE.Object3D[], planes: THREE.Plane[]) => {
    for (const o of objs) {
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = (m.userData.solidMaterial ?? m.material) as THREE.Material;
        mat.clippingPlanes = planes;
        mat.clipShadows = true;
        if (planes.length) mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
      });
    }
  };

  const tmpM = new THREE.Matrix4();
  // Displayed runner angle. Above ~0.4 bucket pitch per frame the eye aliases the 22
  // buckets (wagon-wheel effect) and the runner seems to turn backwards, so the displayed
  // step is capped and a motion-blur disc conveys the real speed.
  const PITCH = (Math.PI * 2) / D.buckets;
  let visAngle = 0;
  const deg = Math.PI / 180;

  function update(s: SimState, dt: number, view: ViewOpts): void {
    // keep the runner still while anything is exploded (radial offsets stay readable) or
    // while the machine is incomplete (assembly guide): no water without nozzles
    let exploded = false;
    for (const p of registry.parts.values()) {
      if (p.factor > 0.001) exploded = true;
      if (p.display === 'wire' || p.display === 'hidden') exploded = true;
    }
    visAngle = (visAngle + Math.min(s.omega * dt * view.slowMo, PITCH * 0.3)) % (Math.PI * 2);
    spinner.rotation.z = exploded ? 0 : visAngle;

    const visRps = (s.rpm / 60) * view.slowMo;
    (runner.blur.material as THREE.MeshBasicMaterial).opacity = exploded
      ? 0
      : THREE.MathUtils.clamp((visRps - 0.8) / 3, 0, 0.6);
    runner.blur.position.z = 0.024;
    runner.setBucketSet(s.bucketSet);

    // valves & spear
    hyd.mainHandwheel.rotation.z = -(1 - s.mainValve) * Math.PI * 2 * MAIN_VALVE_TURNS;
    const top = s.nozzles.find((n) => n.id === 'top');
    const side = s.nozzles.find((n) => n.id === 'side');
    hyd.topLever.rotation.z = Math.PI / 2 - (1 - (top?.valve ?? 0)) * (Math.PI / 2);
    hyd.sideLever.rotation.z = -(1 - (side?.valve ?? 0)) * (Math.PI / 2);
    const opening = top?.opening ?? 0;
    hyd.needle.position.y = opening * 0.024;
    hyd.handwheel.rotation.y = opening * Math.PI * 5;

    // gauge needle: 0..10 bar over 270°, starting at -225° (screen angle, clockwise)
    const bar = THREE.MathUtils.clamp(s.pressureBar, 0, 10.5);
    hyd.gaugeNeedle.rotation.z = -(-225 + (bar / 10) * 270) * deg;

    // deflector blades
    const e = s.deflector;
    hyd.setDeflector(e);
    // vertical bypass valve: lever across the pipe when closed, along it when open
    hyd.bypassLever.rotation.z = s.bypass * (Math.PI / 2);

    // colour-coded nozzle insert follows the side nozzle diameter
    const d = side?.d ?? 6;
    const col = NOZZLE_COLORS.reduce((best, c) => (Math.abs(c[0] - d) < Math.abs(best[0] - d) ? c : best));
    hyd.insertRing.color.setHex(col[1]);

    // LEDs
    gen.rectifierLed.emissiveIntensity = s.pElec > 5 ? 2.2 : 0;
    gen.hallLed.emissiveIntensity = Math.sin(visAngle * 7) > 0.6 && s.rpm > 1 ? 2.5 : 0.1;
    hyd.transducerLed.emissiveIntensity = s.pressureBar > 0.1 ? 2 : 0.2;
    housing.boxLeds[0].emissiveIntensity = s.pElec > 5 ? 2 : 0.1;
    housing.boxLeds[1].emissiveIntensity = s.pDump > 10 ? 2 : 0.1;
    housing.boxLeds[2].emissiveIntensity = s.overspeed || s.bmsOpen ? (Math.sin(view.time * 10) > 0 ? 2.5 : 0.2) : 0.05;

    water.update(s, dt, view.slowMo, e, view.time);
    water.group.visible = !exploded;

    // hotspots follow their parts
    for (const f of follow) {
      const p = registry.get(f.part)!;
      f.anchor.position.copy(f.base).addScaledVector(p.explode, p.factor);
    }

    // refresh world-space clipping planes
    machine.updateWorldMatrix(true, false);
    tmpM.copy(machine.matrixWorld);
    planeHouseWorld.copy(planeHouse).applyMatrix4(tmpM);
    planePipeWorld.copy(planePipe).applyMatrix4(tmpM);
  }

  return {
    root,
    machine,
    registry,
    hotspots,
    update,
    setCutaway(on: boolean) {
      setPlanes(houseCut, on ? [planeHouseWorld] : []);
      setPlanes(hyd.pipeCut, on ? [planePipeWorld] : []);
    },
  };
}

/** Paper-like blueprint floor with a fine grid, like a drafting table. */
function blueprintFloor(): THREE.Mesh {
  const { texture } = canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#efe6d3';
    ctx.fillRect(0, 0, w, h);
    const cell = w / 20;
    for (let i = 0; i <= 20; i++) {
      for (let k = 1; k < 5; k++) {
        ctx.strokeStyle = 'rgba(40,60,90,0.06)';
        ctx.lineWidth = 1;
        const p = i * cell + (k * cell) / 5;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, h);
        ctx.moveTo(0, p);
        ctx.lineTo(w, p);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(40,60,90,0.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, h);
      ctx.moveTo(0, i * cell);
      ctx.lineTo(w, i * cell);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}

/** Stainless test tray catching the tailrace water on the workshop floor. */
function testTray(): THREE.Group {
  const g = group('test-tray');
  const inox = MAT.inox();
  const w = 0.9;
  const dpt = 0.8;
  g.add(mesh(new THREE.BoxGeometry(w, 0.004, dpt), inox, [0, 0.002, 0.05]));
  for (const [x, z, sx, sz] of [
    [0, 0.05 - dpt / 2, w, 0.004],
    [0, 0.05 + dpt / 2, w, 0.004],
    [-w / 2, 0.05, 0.004, dpt],
    [w / 2, 0.05, 0.004, dpt],
  ]) {
    g.add(mesh(new THREE.BoxGeometry(sx, 0.08, sz), inox, [x, 0.04, z]));
  }
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.01, dpt - 0.01),
    new THREE.MeshPhysicalMaterial({ color: 0x6fa9c8, roughness: 0.05, transparent: true, opacity: 0.45 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.03, 0.05);
  water.name = 'tray-water';
  g.add(water);
  // supply hose from the floor to the inlet
  return g;
}

export interface TurbineScene extends SceneModule<SimState> {
  model: TurbineModel;
}

export function createTurbineScene(): TurbineScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xefe6d3);
  scene.fog = new THREE.Fog(0xefe6d3, 7, 16);
  scene.userData.wantsEnv = true;

  const hemi = new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(2.5, 4.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 2;
  key.shadow.camera.bottom = -2;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.01;
  key.target.position.set(-0.3, 0.8, 0);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.7);
  fill.position.set(-3, 2, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8);
  rim.position.set(0, 3, -4);
  scene.add(rim);

  scene.add(blueprintFloor());
  const tray = testTray();
  scene.add(tray);
  // test-bench supply: black HDPE coming from the floor into the inlet
  const supply = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2, 0.03, 0.6),
    new THREE.Vector3(-2.2, 0.03, 0.4),
    new THREE.Vector3(-1.8, 0.4, D.pipeZ),
    new THREE.Vector3(-1.55, D.baseY + D.inletY, D.pipeZ),
    new THREE.Vector3(D.inletX - 0.02, D.baseY + D.inletY, D.pipeZ),
  ]);
  scene.add(mesh(new THREE.TubeGeometry(supply, 80, 0.0315, 16), MAT.pe()));

  const model = createTurbineModel();
  scene.add(model.root);
  const trayWater = tray.getObjectByName('tray-water')!;

  return {
    id: 'turbine',
    scene,
    registry: model.registry,
    hotspots: model.hotspots,
    model,
    home: { position: new THREE.Vector3(1.25, 1.75, 2.35), target: new THREE.Vector3(-0.32, 1.05, 0) },
    minDistance: 0.25,
    maxDistance: 7,
    update(s, dt, view) {
      model.update(s, dt, view);
      trayWater.visible = s.qPipe > 0.02;
    },
  };
}
