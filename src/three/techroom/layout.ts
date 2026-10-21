import * as THREE from 'three';

// Single source of truth for the technical-room layout (metres, Y up).
// Floor at y = 0, back wall inner face at z = 0, room open towards +z (diorama cut).
// The left side wall (x = -1.6) is where the turbine cable comes in, as in the video.
// Every wall device has its origin at the centre of its back face, sitting on the OSB.

export const ROOM = {
  x0: -1.6, // inner face of the side wall
  x1: 1.6, // open right end
  h: 2.5,
  d: 2.2,
  wall: 0.2,
};

/** Front face of the OSB backboard: wall devices are screwed onto it. */
export const OSB_Z = 0.018;
export const OSB = { x0: -1.56, x1: 0.82, y0: 0.86, y1: 2.32 };

export const BENCH = { top: 0.85, t: 0.04, z0: 0.04, z1: 0.62, x0: -1.58, x1: 1.58 };

/** Small window in the back wall (rendered part, right of the OSB). */
export const WINDOW = { x0: 1.0, x1: 1.45, y0: 1.65, y1: 2.15 };

type V3 = [number, number, number];

/** Device origins (centre of the back face). */
export const POS: Record<string, V3> = {
  battery: [-0.95, 0, 0.03], // stack origin: floor, back of the modules
  dcProtect: [-1.32, 2.0, OSB_Z],
  hydroCtrl: [-0.98, 1.99, OSB_Z],
  diversion: [-0.7, 2.02, OSB_Z],
  dump: [-0.15, 2.1, OSB_Z + 0.035], // on stand-offs: hot box kept off the wood
  acPanel: [-1.32, 1.58, OSB_Z],
  mppt: [-0.78, 1.6, OSB_Z],
  busbar: [-1.02, 1.18, OSB_Z],
  inverter: [0.3, 1.42, OSB_Z],
  gx: [0.62, 1.52, OSB_Z],
};

/** Outer sizes [w, h, d]. */
export const SIZE: Record<string, V3> = {
  battery: [0.442, 0.089, 0.41], // one US2000C module
  dcProtect: [0.2, 0.25, 0.12],
  hydroCtrl: [0.13, 0.291, 0.142],
  diversion: [0.16, 0.2, 0.09],
  dump: [0.5, 0.24, 0.2],
  acPanel: [0.24, 0.26, 0.11],
  mppt: [0.25, 0.185, 0.095],
  pvIso: [0.17, 0.19, 0.1],
  lynx: [0.19, 0.12, 0.085],
  inverter: [0.275, 0.546, 0.141],
  gx: [0.192, 0.132, 0.018],
};

/** PV isolator box offset inside the mppt-pv group. */
export const PV_ISO_OFFSET: V3 = [0.31, 0.01, 0];

/** Battery stack geometry. */
export const BATT = { spacer: 0.02, plank: 0.025, count: 4 };
export const battModuleY = (i: number) => BATT.plank + i * (SIZE.battery[1] + BATT.spacer);

/** Scene-space point = device origin + local offset. */
export function at(dev: keyof typeof POS, dx: number, dy: number, dz: number): THREE.Vector3 {
  const p = POS[dev];
  return new THREE.Vector3(p[0] + dx, p[1] + dy, p[2] + dz);
}

// ---- cable ports (scene space, at the tip of each gland / stud) -------------------------
const half = (k: string, i: 0 | 1 | 2) => SIZE[k][i] / 2;
const GL = 0.014; // gland / stud protrusion

export const PORT = {
  // turbine conduit: side-wall entry and top gland of the DC safety box
  wallEntry: new THREE.Vector3(ROOM.x0, 2.25, 0.35),
  dcIn: at('dcProtect', 0, half('dcProtect', 1) + GL, 0.06),
  dcOutP: at('dcProtect', 0.05, -half('dcProtect', 1) - GL, 0.06),
  dcOutN: at('dcProtect', 0.0, -half('dcProtect', 1) - GL, 0.06),

  // TriStar: input (from turbine) on the left, battery output on the right
  tsInP: at('hydroCtrl', -0.035, -half('hydroCtrl', 1) - GL, 0.07),
  tsInN: at('hydroCtrl', -0.012, -half('hydroCtrl', 1) - GL, 0.07),
  tsOutN: at('hydroCtrl', 0.012, -half('hydroCtrl', 1) - GL, 0.07),
  tsOutP: at('hydroCtrl', 0.035, -half('hydroCtrl', 1) - GL, 0.07),

  // diversion controller: bus sense/feed below, dump output on the right side
  divBusP: at('diversion', -0.04, -half('diversion', 1) - GL, 0.045),
  divBusN: at('diversion', -0.015, -half('diversion', 1) - GL, 0.045),
  divOutP: at('diversion', half('diversion', 0) + GL, -0.05, 0.045),
  divOutN: at('diversion', half('diversion', 0) + GL, -0.075, 0.045),
  dumpInP: at('dump', -half('dump', 0) - GL, -0.03, 0.1),
  dumpInN: at('dump', -half('dump', 0) - GL, -0.06, 0.1),

  // Lynx-style busbar pair: studs on top and bottom
  lynxHydroP: at('busbar', -0.125, 0.072, 0.05),
  lynxHydroN: at('busbar', -0.155, 0.072, 0.05),
  lynxDivP: at('busbar', -0.065, 0.072, 0.05),
  lynxDivN: at('busbar', -0.035, 0.072, 0.05),
  lynxMpptP: at('busbar', 0.035, 0.072, 0.05),
  lynxMpptN: at('busbar', 0.065, 0.072, 0.05),
  lynxBatP: at('busbar', -0.155, -0.072, 0.05),
  lynxBatN: at('busbar', -0.125, -0.072, 0.05),
  lynxInvP: at('busbar', 0.125, -0.072, 0.05),
  lynxInvN: at('busbar', 0.155, -0.072, 0.05),

  // SmartSolar MPPT terminals (bottom: battery left, PV right) and PV isolator glands
  mpptBatP: at('mppt', -0.07, -half('mppt', 1) - GL, 0.05),
  mpptBatN: at('mppt', -0.035, -half('mppt', 1) - GL, 0.05),
  mpptPvP: at('mppt', 0.035, -half('mppt', 1) - GL, 0.05),
  mpptPvN: at('mppt', 0.07, -half('mppt', 1) - GL, 0.05),
  mpptCom: at('mppt', -0.105, -half('mppt', 1) - 0.004, 0.05),
  isoInP: at('mppt', PV_ISO_OFFSET[0] - 0.03, PV_ISO_OFFSET[1] + half('pvIso', 1) + GL, 0.05),
  isoInN: at('mppt', PV_ISO_OFFSET[0] + 0.03, PV_ISO_OFFSET[1] + half('pvIso', 1) + GL, 0.05),
  isoOutP: at('mppt', PV_ISO_OFFSET[0] + 0.03, PV_ISO_OFFSET[1] - half('pvIso', 1) - GL, 0.05),
  isoOutN: at('mppt', PV_ISO_OFFSET[0] - 0.03, PV_ISO_OFFSET[1] - half('pvIso', 1) - GL, 0.05),

  // MultiPlus-II: DC on the left of the bottom plate, AC on the right
  invDcP: at('inverter', -0.03, -half('inverter', 1) - GL, 0.07),
  invDcN: at('inverter', -0.06, -half('inverter', 1) - GL, 0.07),
  invAcIn: at('inverter', 0.06, -half('inverter', 1) - GL, 0.07),
  invAcOut: at('inverter', 0.09, -half('inverter', 1) - GL, 0.07),
  invCom: at('inverter', -0.1, -half('inverter', 1) - GL, 0.07),

  // AC board glands
  acIn: at('acPanel', -0.04, -half('acPanel', 1) - GL, 0.055),
  acEarth: at('acPanel', 0.07, -half('acPanel', 1) - GL, 0.055),
  // outgoing house circuits leave through the left face, straight into the side wall
  acOut1: at('acPanel', -half('acPanel', 0) - GL, 0.05, 0.055),
  acOut2: at('acPanel', -half('acPanel', 0) - GL, -0.03, 0.055),

  gxCable: at('gx', 0, -half('gx', 1) - 0.01, 0.03),
};

/** Battery-side power connectors on the top module (scene space). */
export function batteryPort(pos: boolean): THREE.Vector3 {
  const top = battModuleY(BATT.count - 1) + SIZE.battery[1] / 2;
  const p = POS.battery;
  return new THREE.Vector3(p[0] + (pos ? 0.1 : 0.14), top, p[2] + SIZE.battery[2] + 0.04);
}

/** CAN port of the top module (BMS link to the inverter). */
export function batteryCanPort(): THREE.Vector3 {
  const top = battModuleY(BATT.count - 1) + SIZE.battery[1] / 2;
  const p = POS.battery;
  return new THREE.Vector3(p[0] - 0.105, top + 0.012, p[2] + SIZE.battery[2] + 0.008);
}

/** Cable trunking runs (axis-aligned, centre line on the wall). */
export const TRUNKING: { a: V3; b: V3 }[] = [
  { a: [-1.47, 1.4, 0], b: [-0.3, 1.4, 0] },
  { a: [-0.36, 1.0, 0], b: [-0.36, 1.43, 0] },
  { a: [-0.8, 1.0, 0], b: [0.7, 1.0, 0] },
];
