// Pure physics helpers (SI units unless stated). Kept free of state so they can be
// reused for steady-state sweeps (power curve, optimal set-point).

export const G = 9.81;
export const RHO = 1000;
export const NU = 1.31e-6; // kinematic viscosity of water at 10 °C
export const WAVE_SPEED_HDPE = 350; // pressure wave celerity in HDPE pipe, m/s
export const CU_RHO = 0.0175; // copper resistivity, Ω·mm²/m

/** Darcy friction factor (Swamee–Jain, laminar fallback). */
export function frictionFactor(v: number, d: number, roughness = 7e-6): number {
  const re = (Math.abs(v) * d) / NU;
  if (re < 1) return 0.05;
  if (re < 2300) return 64 / re;
  const a = roughness / (3.7 * d) + 5.74 / Math.pow(re, 0.9);
  return 0.25 / Math.pow(Math.log10(a), 2);
}

/** Friction head loss in a pipe (m). */
export function frictionLoss(q: number, d: number, len: number): number {
  const area = (Math.PI * d * d) / 4;
  const v = q / area;
  return (frictionFactor(v, d) * (len / d) * (v * v)) / (2 * G);
}

/** Loss coefficient of a quarter-turn ball valve as a function of its opening (0..1). */
export function ballValveK(pos: number): number {
  const p = Math.max(pos, 0.004);
  return 0.05 + 50 * Math.pow((1 - p) / p, 2);
}

/** Nozzle area (m²) for a diameter in mm, including the discharge coefficient. */
export function nozzleArea(dMm: number, cd = 0.96): number {
  const d = dMm / 1000;
  return (cd * (Math.PI * d * d)) / 4;
}

/** Bucket efficiency vs. jet diameter: buckets are designed for one jet size. */
export function bucketEfficiency(jetMm: number, set: 'S' | 'L'): number {
  const match = set === 'L' ? 8 : 6;
  const m = (jetMm - match) / match;
  const k = m > 0 ? 0.8 : 0.5; // too big a jet spills over the rim, too small loses less
  return 0.86 * Math.max(0.35, 1 - k * m * m);
}

export const PELTON_DEFLECTION = 1 + 0.9 * Math.cos((15 * Math.PI) / 180); // 165° turn, 10 % friction

/** Torque (N·m) given by a jet of flow q (m³/s) and speed v on buckets moving at u. */
export function jetTorque(q: number, v: number, u: number, r: number, etaBucket: number): number {
  return RHO * q * r * (v - u) * PELTON_DEFLECTION * etaBucket;
}

/** Bearing + seal friction and windage torque (N·m). */
export function frictionTorque(omega: number, wear: boolean, cartridge: boolean): number {
  const w = Math.abs(omega);
  const bearings = (0.025 + 0.00012 * w) * (wear ? 4 : 1) * (cartridge ? 0.8 : 1);
  return Math.sign(omega) * (bearings + 1.2e-6 * w * w);
}

/** 15S LiFePO4 open-circuit voltage vs state of charge (Pylontech-like). */
const OCV: [number, number][] = [
  [0, 44.0],
  [0.05, 47.0],
  [0.1, 48.6],
  [0.2, 49.6],
  [0.4, 50.4],
  [0.6, 50.9],
  [0.8, 51.6],
  [0.9, 52.2],
  [0.97, 53.0],
  [1, 54.0],
];

export function ocv(soc: number): number {
  const s = Math.min(1, Math.max(0, soc));
  for (let i = 1; i < OCV.length; i++) {
    if (s <= OCV[i][0]) {
      const [s0, v0] = OCV[i - 1];
      const [s1, v1] = OCV[i];
      return v0 + ((v1 - v0) * (s - s0)) / (s1 - s0);
    }
  }
  return OCV[OCV.length - 1][1];
}

/** Cable loop resistance (Ω) for a one-way length (m) and a section (mm²). */
export function cableResistance(len: number, section: number): number {
  return (CU_RHO * 2 * len) / section;
}
