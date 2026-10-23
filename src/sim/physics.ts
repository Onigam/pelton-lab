// Pelton-specific physics (SI units unless stated). The generic hydraulic and electrical
// helpers come from the kit and are re-exported so the engine imports them from one place.

export { cableResistance, ocv } from '@onigam/lab-kit/sim/electric';
export {
  ballValveK,
  frictionFactor,
  frictionLoss,
  G,
  nozzleArea,
  RHO,
  WAVE_SPEED_HDPE,
} from '@onigam/lab-kit/sim/hydraulic';
import { RHO } from '@onigam/lab-kit/sim/hydraulic';

/** Bucket efficiency vs. jet diameter: buckets are designed for one jet size. */
export function bucketEfficiency(jetMm: number, set: 'S' | 'L'): number {
  // S: small buckets for a Ø6 jet; L: the 26-bucket Ø244 runner, good from Ø8 to Ø14
  const match = set === 'L' ? 10 : 6;
  const m = (jetMm - match) / match;
  const k = m > 0 ? 0.8 : 0.5; // too big a jet spills over the rim, too small loses less
  return 0.86 * Math.max(0.35, 1 - k * m * m);
}

export const PELTON_DEFLECTION = 1 + 0.9 * Math.cos((15 * Math.PI) / 180); // 165° turn, 10 % friction

/** Torque (N·m) given by a jet of flow q (m³/s) and speed v on buckets moving at u. */
export function jetTorque(q: number, v: number, u: number, r: number, etaBucket: number): number {
  return RHO * q * r * (v - u) * PELTON_DEFLECTION * etaBucket;
}

/** Bearing + seal friction and windage torque (N·m); the sealed bearing cartridge runs 20 % cooler. */
export function frictionTorque(omega: number, wear: boolean): number {
  const w = Math.abs(omega);
  const bearings = (0.025 + 0.00012 * w) * (wear ? 4 : 1) * 0.8;
  return Math.sign(omega) * (bearings + 1.2e-6 * w * w);
}
