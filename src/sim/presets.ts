import type { PresetId, ScenarioId } from '../data/types';
import type { CtrlMode, Season } from './types';

// User-adjustable inputs of the simulation. Presets reproduce the two installations of
// the video; scenarios are small tweaks used by the lessons.

export interface NozzleParams {
  enabled: boolean;
  /** Fixed nozzle: diameter; variable spear: maximum diameter (mm). */
  d: number;
  /** Spear opening 0..1 (variable injector only). */
  opening: number;
  /** Branch valve target: open (true) / closed. */
  open: boolean;
}

export type LoadProfile = 'eco' | 'chalet' | 'family';

export interface SimParams {
  preset: PresetId | 'custom';
  /** Which stream hydrology to use (site A forest / site B hamlet). */
  siteProfile: 'A' | 'B';
  version: 'v1' | 'v2';
  // site
  headGross: number;
  pipeLength: number;
  pipeDiam: number; // internal, mm
  /** null = natural flow from the season profile. */
  streamOverride: number | null;
  season: Season;
  /** null = pseudo-random daily weather; 0..1 forces the sky clearness. */
  weatherOverride: number | null;
  screenClog: number;
  // machine
  mainOpen: boolean;
  /** Seconds to close the main valve (V1 quarter-turn ≈ 1 s, V2 gear valve ≈ 20 s). */
  valveCloseTime: number;
  top: NozzleParams; // variable spear injector
  side: NozzleParams; // fixed nozzle
  bucketSet: 'S' | 'L';
  bearingWear: boolean;
  // electrical
  ctrlMode: CtrlMode;
  vSet: number;
  /** Generator constant for the 48 V winding (V·s/rad, rectified). */
  ke: number;
  transportHV: boolean;
  cableLength: number; // one way, m
  cableSection: number; // mm²
  dumpEnabled: boolean;
  dumpCapacity: number; // W
  batteryKWh: number;
  pvPeak: number; // Wp
  load: LoadProfile;
  // time
  startHour: number;
  timeScale: number;
  running: boolean;
  slowMo: number;
}

const base: SimParams = {
  preset: 'siteA',
  siteProfile: 'A',
  version: 'v1',
  headGross: 76,
  pipeLength: 350,
  pipeDiam: 55,
  streamOverride: null,
  season: 'winter',
  weatherOverride: null,
  screenClog: 0,
  mainOpen: true,
  valveCloseTime: 1,
  top: { enabled: false, d: 12, opening: 0.6, open: false },
  side: { enabled: true, d: 6, opening: 1, open: true },
  bucketSet: 'S',
  bearingWear: false,
  ctrlMode: 'fixed',
  vSet: 57,
  ke: 0.45,
  transportHV: false,
  cableLength: 70,
  cableSection: 6,
  dumpEnabled: true,
  dumpCapacity: 2000,
  batteryKWh: 4.8,
  pvPeak: 0,
  load: 'chalet',
  startHour: 13,
  timeScale: 120,
  running: true,
  slowMo: 1,
};

export function presetParams(id: PresetId): SimParams {
  const p: SimParams = structuredClone(base);
  p.preset = id;
  if (id === 'siteA8') {
    p.side.d = 8;
    p.bucketSet = 'L';
    p.vSet = 56;
  }
  if (id === 'siteB') {
    p.siteProfile = 'B';
    p.headGross = 21;
    p.pipeLength = 55;
    p.top = { enabled: true, d: 12, opening: 0.55, open: true };
    p.side = { enabled: true, d: 7, opening: 1, open: true };
    p.bucketSet = 'L';
    p.ctrlMode = 'direct';
    p.ke = 0.74;
    p.vSet = 52;
    p.cableLength = 15;
    p.batteryKWh = 9.6;
    p.pvPeak = 4500;
    p.startHour = 12;
  }
  return p;
}

/** Natural stream flow (L/s) by preset and season. Site B is dry in summer. */
export const STREAM: Record<'A' | 'B', Record<Season, number>> = {
  A: { winter: 2.6, spring: 3.4, summer: 0.35, autumn: 1.6 },
  B: { winter: 3.8, spring: 2.6, summer: 0, autumn: 1.5 },
};

/** Tweak a copy of the current params for a lesson scenario. */
export function scenarioParams(id: ScenarioId, cur: SimParams): SimParams {
  const p = structuredClone(cur);
  switch (id) {
    case 'dryIntake':
      Object.assign(p, presetParams('siteA8'), { streamOverride: 0.9, season: 'spring' as Season, timeScale: 1 });
      break;
    case 'cloggedScreen':
      Object.assign(p, presetParams('siteA'), { screenClog: 0.93, timeScale: 1 });
      break;
    case 'dumpFailure':
      Object.assign(p, presetParams('siteB'), {
        dumpEnabled: false,
        season: 'spring' as Season,
        weatherOverride: 1,
        load: 'eco',
        startHour: 13.6,
        timeScale: 30,
      });
      break;
    case 'mpptHunting':
      Object.assign(p, presetParams('siteA'), { ctrlMode: 'mppt' as CtrlMode, timeScale: 1 });
      break;
    case 'waterHammer':
      Object.assign(p, presetParams('siteA'), { timeScale: 1 });
      break;
    case 'longCable':
      Object.assign(p, presetParams('siteA'), { cableLength: 400, timeScale: 1 });
      break;
    case 'winterNight':
      Object.assign(p, presetParams('siteB'), { startHour: 20, timeScale: 600 });
      break;
    case 'summerDry':
      Object.assign(p, presetParams('siteB'), { season: 'summer' as Season, startHour: 8, timeScale: 600 });
      break;
  }
  p.version = cur.version;
  if (p.version === 'v2') p.valveCloseTime = 20;
  return p;
}
