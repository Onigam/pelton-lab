import type { PresetId, ScenarioId } from '@onigam/lab-kit/content';
import {
  ballValveK,
  bucketEfficiency,
  cableResistance,
  frictionFactor,
  frictionLoss,
  frictionTorque,
  G,
  jetTorque,
  nozzleArea,
  ocv,
  RHO,
  WAVE_SPEED_HDPE,
} from './physics';
import { presetParams, scenarioParams, STREAM, type SimParams } from './presets';
import type { AlarmKey, NozzleState, Season, SimState } from './types';

// Real-time simulation of the whole chain: stream -> Coanda intake -> penstock (rigid
// water column with water hammer) -> nozzles -> Pelton runner -> PM generator ->
// controller -> 48 V battery bus <- PV, -> inverter loads and dump load.
// Hydraulics and mechanics run in real time (fast dynamics, sub-stepped); the energy
// balance (battery, sun, consumption) runs on an accelerated clock.

/** Pitch radius of the 26-bucket Ø244 runner (pitch Ø190), see three/turbine/dims.ts. */
const R_PITCH = 0.095;
const INERTIA = 0.022; // kg·m², runner + rotor bell
const R_GEN = 0.55; // Ω, phase + rectifier equivalent (48 V winding)
const V_DIODE = 1.6;
const K_IRON = 0.0008; // W/(rad/s)²
const INTAKE_VOLUME = 0.06; // m³ (small pond + Coanda box)
const SCREEN_CAPACITY = 12; // L/s through a clean 0.6 m screen
const K_MINOR = 2.0; // intake entrance + bends
const SUBSTEP = 1 / 240;

export interface DynSample {
  t: number;
  rpm: number;
  pElec: number;
  bar: number;
  q: number;
}

/** Steady-state operating point used by the sizing table and the power/flow chart. */
export interface SizingPoint {
  q: number; // L/s at the turbine
  hf: number; // head lost in the penstock, m
  hn: number; // net head at the nozzle, m
  vJet: number; // m/s
  dJet: number; // equivalent jet diameter, mm
  pHyd: number; // W in the jet
  pShaft: number; // W on the shaft
  pElec: number; // W at the generator terminals
  pBus: number; // W delivered to the battery bus
  eta: number; // pBus / gross hydraulic power
  rpm: number; // optimal runner speed
}

export interface EnergySample {
  t: number; // sim seconds
  hydro: number;
  pv: number;
  load: number;
  dump: number;
  soc: number;
}

function emptyState(): SimState {
  const nz = (id: 'top' | 'side', kind: 'variable' | 'fixed'): NozzleState => ({
    id,
    kind,
    enabled: false,
    valve: 0,
    opening: 0,
    d: 0,
    q: 0,
  });
  return {
    simTime: 0,
    day: 0,
    hour: 0,
    season: 'winter',
    timeScale: 1,
    running: true,
    headGross: 0,
    pipeLength: 0,
    pipeDiam: 0,
    qStream: 0,
    qCaptured: 0,
    qOverflow: 0,
    intakeLevel: 1,
    screenClog: 0,
    air: false,
    qPipe: 0,
    vPipe: 0,
    headLoss: 0,
    headNet: 0,
    pressureBar: 0,
    staticBar: 0,
    vJet: 0,
    mainValve: 1,
    bypass: 0,
    nozzles: [nz('top', 'variable'), nz('side', 'fixed')],
    omega: 0,
    rpm: 0,
    angle: 0,
    uOverV: 0,
    etaTurbine: 0,
    overspeed: false,
    bucketSet: 'S',
    deflector: 0,
    emf: 0,
    vTurbine: 0,
    iGen: 0,
    pHyd: 0,
    pShaft: 0,
    pElec: 0,
    pCableLoss: 0,
    pToBus: 0,
    vBatt: 51,
    iBatt: 0,
    soc: 0.6,
    batteryKWh: 4.8,
    bmsOpen: false,
    pPv: 0,
    pPvAvail: 0,
    pvPeak: 0,
    pLoad: 0,
    pDump: 0,
    pInverter: 0,
    ctrlMode: 'fixed',
    vSet: 57,
    dumpEnabled: true,
    transportHV: false,
    energyToday: { hydro: 0, pv: 0, load: 0, dump: 0 },
    alarms: [],
  };
}

/** Deterministic pseudo-random value in [0,1) for a given integer (weather per day). */
function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const DAYLIGHT: Record<Season, [number, number, number, number]> = {
  // sunrise, sunset (behind the mountains), peak irradiance factor, mean clearness
  winter: [9.6, 16.2, 0.5, 0.55],
  spring: [7.4, 20.0, 0.85, 0.7],
  summer: [7.0, 21.0, 0.95, 0.85],
  autumn: [8.6, 18.4, 0.7, 0.6],
};

export class SimEngine {
  params: SimParams;
  readonly state: SimState = emptyState();
  readonly dyn: DynSample[] = [];
  readonly energy: EnergySample[] = [];
  private listeners = new Set<() => void>();

  // hidden dynamic state
  private q = 0;
  private omega = 0;
  private buffer = INTAKE_VOLUME;
  private airFactor = 1;
  private airTimer = 0;
  private surgeAmp = 0;
  private surgeT = 0;
  private mainPos = 1;
  private bypassPos = 0;
  private topPos = 1;
  private sidePos = 1;
  private deflectTimer = 0;
  private mppt = { v: 60, dir: 1, lastP: 0, timer: 0 };
  private realTime = 0;
  private dynTimer = 0;
  private energyTimer = 0;
  private lastDay = 0;
  private rpmWindow: number[] = [];
  /** Current water-hammer head (m), for the alarm. */
  private surge = 0;

  constructor(preset: PresetId = 'siteA') {
    this.params = presetParams(preset);
    this.reset();
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Notify listeners that params changed (UI re-render). */
  emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Restart from the current params (clock, battery, hydraulics). */
  reset(): void {
    const p = this.params;
    this.q = 0;
    this.omega = 0;
    this.buffer = INTAKE_VOLUME;
    this.airFactor = 1;
    this.airTimer = 0;
    this.surgeAmp = 0;
    this.mainPos = p.mainOpen ? 1 : 0;
    this.bypassPos = p.bypassOpen ? 1 : 0;
    this.topPos = p.top.open ? 1 : 0;
    this.sidePos = p.side.open ? 1 : 0;
    this.mppt = { v: p.vSet, dir: 1, lastP: 0, timer: 0 };
    this.dyn.length = 0;
    this.energy.length = 0;
    const s = this.state;
    s.simTime = 0;
    s.angle = 0;
    s.deflector = 0;
    s.bmsOpen = false;
    s.soc = p.preset === 'siteB' ? 0.62 : 0.55;
    if (p.preset === 'custom') s.soc = this.state.soc;
    s.energyToday = { hydro: 0, pv: 0, load: 0, dump: 0 };
    this.lastDay = 0;
    this.energyTimer = 0;
    this.syncStatic();
    this.emit();
  }

  applyPreset(id: PresetId): void {
    this.params = presetParams(id);
    this.reset();
  }

  /** Trip the jet deflector as a fault would; it re-arms by itself a few seconds later. */
  testDeflector(): void {
    this.deflectTimer = 8;
  }

  applyScenario(id: ScenarioId): void {
    this.params = scenarioParams(id, this.params);
    this.reset();
    if (id === 'dumpFailure') this.state.soc = 0.975;
  }

  /** Change params live (no reset). */
  set(patch: Partial<SimParams>): void {
    Object.assign(this.params, patch);
    this.syncStatic();
    this.emit();
  }

  private syncStatic(): void {
    const p = this.params;
    const s = this.state;
    s.headGross = p.headGross;
    s.pipeLength = p.pipeLength;
    s.pipeDiam = p.pipeDiam;
    s.season = p.season;
    s.timeScale = p.timeScale;
    s.running = p.running;
    s.screenClog = p.screenClog;
    s.bucketSet = p.bucketSet;
    s.ctrlMode = p.ctrlMode;
    s.vSet = p.ctrlMode === 'mppt' ? this.mppt.v : p.vSet;
    s.dumpEnabled = p.dumpEnabled;
    s.transportHV = p.transportHV;
    s.batteryKWh = p.batteryKWh;
    s.pvPeak = p.pvPeak;
    s.staticBar = (RHO * G * p.headGross) / 1e5;
  }

  // ------------------------------------------------------------------ helpers

  private kHV(): number {
    return this.params.transportHV ? 4 : 1;
  }

  private nozzleAreas(): { top: number; side: number; dTop: number; dSide: number } {
    const p = this.params;
    const dTop = p.top.d * Math.sqrt(Math.max(0, p.top.opening));
    const dSide = p.side.d;
    const vf = (pos: number) => Math.pow(Math.max(0, pos), 1.5);
    const top = p.top.enabled ? nozzleArea(dTop, 0.95) * vf(this.topPos) : 0;
    const side = p.side.enabled ? nozzleArea(dSide, 0.97) * vf(this.sidePos) : 0;
    return { top, side, dTop, dSide };
  }

  /** Electrical current (A) out of the generator for a given speed. */
  private current(omega: number, vBus: number, vCtrl: number): { i: number; e: number; vTerm: number; rLine: number } {
    const p = this.params;
    const k = this.kHV();
    const e = p.ke * k * omega;
    const rGen = R_GEN * k * k;
    const rLine = cableResistance(p.cableLength, p.cableSection);
    const vIn = p.ctrlMode === 'direct' && !p.transportHV ? vBus : vCtrl;
    let i = (e - V_DIODE - vIn) / (rGen + rLine);
    if (i < 0 || this.state.bmsOpen) i = 0;
    const vTerm = e - V_DIODE - i * rGen;
    return { i, e, vTerm, rLine };
  }

  private streamFlow(): number {
    const p = this.params;
    if (p.streamOverride !== null) return p.streamOverride;
    const base = STREAM[p.siteProfile][p.season];
    const day = this.state.day;
    const dayFactor = 0.85 + 0.3 * hash01(day + 17);
    const diurnal = 1 + 0.06 * Math.sin(((this.state.hour - 15) / 24) * Math.PI * 2);
    return base * dayFactor * diurnal;
  }

  private pvAvailable(): number {
    const p = this.params;
    const [rise, set, peak, clear] = DAYLIGHT[p.season];
    const h = this.state.hour;
    if (h <= rise || h >= set) return 0;
    const x = (h - rise) / (set - rise);
    const day = this.state.day;
    const weather = p.weatherOverride ?? Math.min(1, Math.max(0.12, clear + (hash01(day * 3 + 5) - 0.5) * 0.8));
    const flicker = 1 - 0.12 * Math.max(0, Math.sin(h * 9.1 + day)) * (1 - weather);
    return p.pvPeak * peak * Math.pow(Math.sin(Math.PI * x), 1.3) * weather * flicker * 0.85;
  }

  private houseLoad(): number {
    const h = this.state.hour;
    let w = 110;
    if (h >= 6.5 && h < 8.5) w += 350;
    if (h >= 12 && h < 13.5) w += 450;
    if (h >= 18.5 && h < 22) w += 500;
    if (h >= 22 && h < 23.5) w += 200;
    if (this.params.season === 'winter' && (h >= 17 || h < 7)) w += 100;
    // fridge compressor cycling
    w += Math.sin(this.state.simTime / 600) > 0.3 ? 90 : 0;
    const k = { eco: 0.6, chalet: 1, family: 1.6 }[this.params.load];
    return w * k;
  }

  // ------------------------------------------------------------------ sizing (steady state)

  /**
   * Whole chain at steady state for a flow imposed at the turbine (L/s), with the runner at
   * its optimal speed (u/v = 0.47): penstock losses -> jet -> runner -> generator -> cable
   * -> controller. Returns null when the penstock friction eats the whole head.
   * With `matchedBuckets` the runner is assumed designed for that jet (potential of the site).
   */
  chainFromFlow(
    qLs: number,
    pipeDiamMm = this.params.pipeDiam,
    jetMm?: number,
    matchedBuckets = false,
  ): SizingPoint | null {
    const p = this.params;
    const q = qLs / 1000;
    if (q <= 0) return null;
    const d = pipeDiamMm / 1000;
    const ap = (Math.PI * d * d) / 4;
    const vPipe = q / ap;
    const hf = frictionLoss(q, d, Math.max(5, p.pipeLength)) + ((K_MINOR + ballValveK(1)) * vPipe * vPipe) / (2 * G);
    const hn = p.headGross - hf;
    if (hn < 0.5) return null;
    const vJet = 0.98 * Math.sqrt(2 * G * hn);
    const dJet = jetMm ?? Math.sqrt((4 * q) / (Math.PI * 0.96 * Math.sqrt(2 * G * hn))) * 1000;
    const pHyd = RHO * G * q * hn;
    // runner at optimal speed
    const u = 0.47 * vJet;
    const omega = u / R_PITCH;
    // matchedBuckets: assume a runner designed for this jet (sizing curves), else the mounted set
    const etaB = matchedBuckets ? bucketEfficiency(10, 'L') : bucketEfficiency(dJet, p.bucketSet);
    const tHyd = jetTorque(q, vJet, u, R_PITCH, etaB);
    const pShaft = Math.max(0, (tHyd - frictionTorque(omega, p.bearingWear)) * omega);
    // generator + cable + controller
    const k = this.kHV();
    const e = p.ke * k * omega;
    const avail = Math.max(0, pShaft - K_IRON * omega * omega);
    const i = e > 1 ? avail / e : 0;
    const pElec = Math.max(0, avail - i * i * R_GEN * k * k - V_DIODE * i);
    const pCable = i * i * cableResistance(p.cableLength, p.cableSection);
    const pIn = Math.max(0, pElec - pCable);
    const pBus = p.ctrlMode === 'direct' && !p.transportHV ? pIn : pIn * (p.transportHV ? 0.96 : 0.97);
    return {
      q: qLs,
      hf,
      hn,
      vJet,
      dJet,
      pHyd,
      pShaft,
      pElec,
      pBus,
      eta: pBus / (RHO * G * q * p.headGross),
      rpm: (omega * 60) / (2 * Math.PI),
    };
  }

  /** Steady flow (L/s) through a single nozzle of diameter dMm on the current penstock. */
  nozzleFlow(dMm: number): number {
    const p = this.params;
    const an = nozzleArea(dMm, 0.97);
    const d = p.pipeDiam / 1000;
    const ap = (Math.PI * d * d) / 4;
    let lo = 0;
    let hi = an * Math.sqrt(2 * G * p.headGross);
    for (let it = 0; it < 50; it++) {
      const q = (lo + hi) / 2;
      const v = q / ap;
      const hf = frictionLoss(q, d, Math.max(5, p.pipeLength)) + ((K_MINOR + ballValveK(1)) * v * v) / (2 * G);
      const qn = an * Math.sqrt(2 * G * Math.max(0, p.headGross - hf));
      if (q < qn) lo = q;
      else hi = q;
    }
    return lo * 1000;
  }

  /** One row per nozzle diameter: flow, net head and output power (W) on the current site. */
  nozzleTable(diameters = [4, 5, 6, 7, 8, 10, 12, 14]): (SizingPoint & { nozzle: number; sustainable: boolean })[] {
    const available = this.availableFlow();
    const rows: (SizingPoint & { nozzle: number; sustainable: boolean })[] = [];
    for (const dn of diameters) {
      const q = this.nozzleFlow(dn);
      const pt = this.chainFromFlow(q, this.params.pipeDiam, dn);
      if (pt) rows.push({ ...pt, nozzle: dn, sustainable: q <= available * 0.95 });
    }
    return rows;
  }

  /** Flow the intake can deliver continuously (stream, limited by the screen), L/s. */
  availableFlow(): number {
    return Math.min(this.state.qStream, SCREEN_CAPACITY * Math.pow(1 - this.params.screenClog, 1.5));
  }

  /** Optimal speed (rpm) for the current jet velocity (u/v ≈ 0.47). */
  rpmOptimal(): number {
    return ((0.47 * this.state.vJet) / R_PITCH) * (60 / (2 * Math.PI));
  }

  /**
   * Steady-state power curve: shaft power vs rpm for the current flow and jet speed
   * (used by the "constant speed" chart). Returns [rpm, watts][].
   */
  powerCurve(points = 60): [number, number][] {
    const s = this.state;
    const v = s.vJet;
    if (v < 0.5) return [];
    const omegaMax = v / R_PITCH;
    const out: [number, number][] = [];
    for (let k = 0; k <= points; k++) {
      const w = (k / points) * omegaMax;
      let t = 0;
      for (const n of s.nozzles) {
        if (n.q > 0) t += jetTorque(n.q / 1000, v, w * R_PITCH, R_PITCH, bucketEfficiency(n.d, s.bucketSet));
      }
      t -= frictionTorque(w, this.params.bearingWear);
      out.push([(w * 60) / (2 * Math.PI), Math.max(0, t * w)]);
    }
    return out;
  }

  /** Find the controller set-point that maximises the power sent to the battery bus. */
  optimalVSet(): number {
    const s = this.state;
    const v = s.vJet;
    if (v < 0.5) return this.params.vSet;
    const k = this.kHV();
    let best = this.params.vSet;
    let bestP = -1;
    for (let vs = 40 * k; vs <= 140 * k; vs += 0.5 * k) {
      // bisection on omega where hydraulic torque = electrical + friction torque
      let lo = 0;
      let hi = v / R_PITCH;
      for (let it = 0; it < 40; it++) {
        const w = (lo + hi) / 2;
        let th = 0;
        for (const n of s.nozzles) {
          if (n.q > 0) th += jetTorque(n.q / 1000, v, w * R_PITCH, R_PITCH, bucketEfficiency(n.d, s.bucketSet));
        }
        const { i, e } = this.current(w, s.vBatt, vs);
        const te = w > 0.5 ? (e * i + K_IRON * w * w) / w : 0;
        const net = th - te - frictionTorque(w, this.params.bearingWear);
        if (net > 0) lo = w;
        else hi = w;
      }
      const { i } = this.current(lo, s.vBatt, vs);
      const pw = vs * i;
      if (pw > bestP) {
        bestP = pw;
        best = vs;
      }
    }
    return Math.round(best * 2) / 2;
  }

  // ------------------------------------------------------------------ stepping

  step(dtReal: number): void {
    const p = this.params;
    this.syncStatic();
    if (!p.running) return;
    const dt = Math.min(dtReal, 0.1);
    this.realTime += dt;
    const n = Math.max(1, Math.ceil(dt / SUBSTEP));
    for (let k = 0; k < n; k++) this.physics(dt / n);
    this.energyStep(dt * p.timeScale);
    this.alarms(dt);
    this.record(dt);
  }

  private physics(h: number): void {
    const p = this.params;
    const s = this.state;

    // --- valves move towards their targets
    const moveTo = (pos: number, open: boolean, time: number) =>
      Math.min(1, Math.max(0, pos + (open ? 1 : -1) * (h / Math.max(0.05, time))));
    this.mainPos = moveTo(this.mainPos, p.mainOpen, p.valveCloseTime);
    this.topPos = moveTo(this.topPos, p.top.open, 1);
    this.sidePos = moveTo(this.sidePos, p.side.open, 1);
    this.bypassPos = moveTo(this.bypassPos, p.bypassOpen, 1.5);

    // --- intake
    const captured = Math.min(s.qStream, SCREEN_CAPACITY * Math.pow(1 - p.screenClog, 1.5)) / 1000;

    // --- penstock (rigid water column, implicit in Q)
    const d = p.pipeDiam / 1000;
    const ap = (Math.PI * d * d) / 4;
    const len = Math.max(5, p.pipeLength);
    const noz = this.nozzleAreas();
    // the bypass drains water out of the manifold without reaching the runner
    const aBypass = nozzleArea(25, 0.6) * Math.pow(this.bypassPos, 1.5);
    const an = noz.top + noz.side + aBypass;
    const sputter = this.airTimer > 0 ? 1 - 0.18 * (0.5 + 0.5 * Math.sin(this.realTime * 11)) : 1;
    const head = p.headGross * this.airFactor * sputter;
    const v0 = this.q / ap;
    const kf = (frictionFactor(v0, d) * (len / d)) / (2 * G * ap * ap);
    const kv = (ballValveK(this.mainPos) + K_MINOR) / (2 * G * ap * ap);
    const c = (G * ap) / len;
    let q1 = 0;
    if (an > 1e-10 && this.mainPos > 0.001) {
      const kn = 1 / (2 * G * an * an);
      const a = c * h * (kf + kv + kn);
      const b = this.q + c * h * head;
      q1 = a > 1e-14 ? (-1 + Math.sqrt(1 + 4 * a * Math.max(0, b))) / (2 * a) : Math.max(0, b);
    }
    // water hammer: inertia head when the column decelerates, capped by Joukowsky
    const dqdt = (q1 - this.q) / h;
    const inertia = -(len / (G * ap)) * dqdt;
    const jouk = (WAVE_SPEED_HDPE * v0) / G;
    if (inertia > 2 && inertia > this.surgeAmp * 0.5) {
      this.surgeAmp = Math.min(Math.max(this.surgeAmp, inertia), Math.max(jouk, 2));
      this.surgeT = 0;
    }
    this.q = q1;
    this.surgeT += h;
    const period = (4 * len) / WAVE_SPEED_HDPE;
    const surge =
      this.surgeAmp * Math.exp(-this.surgeT / (1.5 * period)) * Math.cos((2 * Math.PI * this.surgeT) / period);
    if (this.surgeAmp * Math.exp(-this.surgeT / (1.5 * period)) < 0.2) this.surgeAmp = 0;

    const hf = frictionLoss(q1, d, len) + (K_MINOR * Math.pow(q1 / ap, 2)) / (2 * G);
    const hv = (ballValveK(this.mainPos) * Math.pow(q1 / ap, 2)) / (2 * G);
    const hNozzle = an > 1e-10 ? Math.pow(q1 / an, 2) / (2 * G) : 0;
    const vJet = 0.98 * Math.sqrt(2 * G * Math.max(0, hNozzle));

    // --- intake buffer and air ingress
    this.buffer += (captured - q1) * h;
    let extraOverflow = 0;
    if (this.buffer > INTAKE_VOLUME) {
      extraOverflow = (this.buffer - INTAKE_VOLUME) / h;
      this.buffer = INTAKE_VOLUME;
    }
    if (this.buffer <= 0) {
      this.buffer = 0;
      // the pipe drains faster than the intake fills: air is sucked in, the head collapses
      this.airTimer = 6;
      this.airFactor = Math.max(0.15, this.airFactor - 1.5 * h * ((q1 - captured) / Math.max(q1, 1e-4)));
    } else if (this.buffer > 0.02 * INTAKE_VOLUME) {
      this.airTimer = Math.max(0, this.airTimer - h);
      if (this.airTimer === 0) this.airFactor = Math.min(1, this.airFactor + 0.2 * h);
    }

    // --- runner mechanics
    const omega = this.omega;
    const u = omega * R_PITCH;
    const jetOn = 1 - s.deflector;
    const qTop = an > 0 ? (q1 * noz.top) / an : 0;
    const qSide = an > 0 ? (q1 * noz.side) / an : 0;
    const tHyd =
      (jetTorque(qTop, vJet, u, R_PITCH, bucketEfficiency(noz.dTop, p.bucketSet)) +
        jetTorque(qSide, vJet, u, R_PITCH, bucketEfficiency(noz.dSide, p.bucketSet))) *
      jetOn;

    const vCtrl = p.ctrlMode === 'mppt' ? this.mppt.v : p.vSet;
    const el = this.current(omega, s.vBatt, vCtrl);
    const pIron = K_IRON * omega * omega;
    const tEl = omega > 0.5 ? (el.e * el.i + pIron) / omega : 0;
    const tFr = frictionTorque(omega, p.bearingWear);
    this.omega = Math.max(0, omega + (h * (tHyd - tEl - tFr)) / INERTIA);
    s.angle = (s.angle + this.omega * h * p.slowMo) % (Math.PI * 2000);

    // --- MPPT tracker (perturb & observe) hunting on a machine with inertia
    if (p.ctrlMode === 'mppt') {
      this.mppt.timer += h;
      if (this.mppt.timer > 0.4) {
        this.mppt.timer = 0;
        const pw = vCtrl * el.i;
        if (pw < this.mppt.lastP) this.mppt.dir *= -1;
        this.mppt.lastP = pw;
        const k = this.kHV();
        this.mppt.v = Math.min(140 * k, Math.max(s.vBatt + 2, this.mppt.v + this.mppt.dir * 3 * k));
      }
    } else {
      this.mppt.v = p.vSet;
    }

    // --- jet deflector: trips on load loss / overspeed, resets 20 s after
    {
      const rpm = (this.omega * 60) / (2 * Math.PI);
      const trip = s.bmsOpen || (rpm > 1.3 * this.rpmOptimal() && this.rpmOptimal() > 50);
      if (trip) this.deflectTimer = 20;
      else this.deflectTimer = Math.max(0, this.deflectTimer - h);
      const target = this.deflectTimer > 0 ? 1 : 0;
      s.deflector = Math.min(1, Math.max(0, s.deflector + (target ? 3 : -0.5) * h));
    }

    // --- publish
    const pHyd = RHO * G * (qTop + qSide) * hNozzle;
    s.qCaptured = captured * 1000;
    s.qOverflow = Math.max(0, s.qStream - s.qCaptured) + extraOverflow * 1000;
    s.intakeLevel = this.buffer / INTAKE_VOLUME;
    s.air = this.airTimer > 0;
    s.qPipe = q1 * 1000;
    s.vPipe = q1 / ap;
    s.headLoss = hf + hv;
    s.headNet = hNozzle;
    s.pressureBar = Math.max(0, (RHO * G * (head - hf + surge)) / 1e5);
    s.vJet = vJet;
    s.mainValve = this.mainPos;
    s.bypass = this.bypassPos;
    const [top, side] = s.nozzles;
    Object.assign(top, {
      enabled: p.top.enabled,
      valve: this.topPos,
      opening: p.top.opening,
      d: noz.dTop,
      q: qTop * 1000,
    });
    Object.assign(side, { enabled: p.side.enabled, valve: this.sidePos, opening: 1, d: noz.dSide, q: qSide * 1000 });
    s.omega = this.omega;
    s.rpm = (this.omega * 60) / (2 * Math.PI);
    s.uOverV = vJet > 0.1 ? u / vJet : 0;
    s.pHyd = pHyd;
    s.pShaft = Math.max(0, tHyd * omega);
    s.etaTurbine = pHyd > 1 ? Math.max(0, (tHyd - tFr) * omega) / pHyd : 0;
    s.emf = el.e;
    s.vTurbine = el.vTerm;
    s.iGen = el.i;
    s.pElec = el.vTerm * el.i;
    s.pCableLoss = el.i * el.i * el.rLine;
    const pIn = s.pElec - s.pCableLoss;
    s.pToBus = p.ctrlMode === 'direct' && !p.transportHV ? pIn : pIn * (p.transportHV ? 0.96 : 0.97);
    s.vSet = vCtrl;
    this.surge = surge;
  }

  private energyStep(dtSim: number): void {
    const p = this.params;
    const s = this.state;
    s.simTime += dtSim;
    const abs = p.startHour * 3600 + s.simTime;
    s.day = Math.floor(abs / 86400);
    s.hour = (abs / 3600) % 24;
    if (s.day !== this.lastDay) {
      s.energyToday = { hydro: 0, pv: 0, load: 0, dump: 0 };
      this.lastDay = s.day;
    }
    s.qStream = this.streamFlow();

    const pvAvail = this.pvAvailable();
    let load = this.houseLoad();
    if (s.soc < 0.05) load = 0; // inverter low-voltage cut-off
    const pInv = load > 0 ? load / 0.93 + 20 : 0;
    const hydro = s.pToBus;
    const full = s.soc >= 0.995;

    let pv = pvAvail;
    let dump = 0;
    if (full) {
      // PV charger backs off first, the diversion controller burns the hydro surplus
      pv = Math.min(pvAvail, Math.max(0, pInv - hydro));
      const surplus = hydro + pv - pInv;
      if (surplus > 0 && p.dumpEnabled) dump = Math.min(surplus, p.dumpCapacity);
      if (surplus - dump > 5 && !p.dumpEnabled) s.bmsOpen = true;
    }
    if (s.bmsOpen && s.soc < 0.97) s.bmsOpen = false;

    let pBatt = hydro + pv - pInv - dump;
    if (s.bmsOpen && pBatt > 0) {
      pv = Math.min(pv, Math.max(0, pInv - (s.pToBus > 0 ? hydro : 0)));
      pBatt = Math.min(0, hydro + pv - pInv);
    }
    const ah = (p.batteryKWh * 1000) / 48;
    const v = ocv(s.soc);
    const i = pBatt / v;
    const eff = i > 0 ? 0.98 : 1;
    s.soc = Math.min(1, Math.max(0, s.soc + (i * eff * dtSim) / (3600 * ah)));
    s.vBatt = v + i * 0.015;
    s.iBatt = i;
    s.pPv = pv;
    s.pPvAvail = pvAvail;
    s.pLoad = load;
    s.pInverter = pInv;
    s.pDump = dump;

    const kwh = dtSim / 3600000;
    s.energyToday.hydro += hydro * kwh;
    s.energyToday.pv += pv * kwh;
    s.energyToday.load += load * kwh;
    s.energyToday.dump += dump * kwh;

    // 24 h energy history, one sample every 5 simulated minutes
    this.energyTimer += dtSim;
    while (this.energyTimer >= 300) {
      this.energyTimer -= 300;
      this.energy.push({ t: s.simTime, hydro, pv, load, dump, soc: s.soc });
      if (this.energy.length > 288) this.energy.shift();
    }
  }

  private alarms(dt: number): void {
    const s = this.state;
    const p = this.params;
    const a: AlarmKey[] = [];
    const rpmOpt = this.rpmOptimal();
    s.overspeed = !s.air && rpmOpt > 50 && s.rpm > 1.3 * rpmOpt;
    this.rpmWindow.push(s.rpm);
    if (this.rpmWindow.length > Math.round(5 / Math.max(dt, 0.005))) this.rpmWindow.shift();
    const mean = this.rpmWindow.reduce((x, y) => x + y, 0) / this.rpmWindow.length;
    const sd = Math.sqrt(this.rpmWindow.reduce((x, y) => x + (y - mean) ** 2, 0) / this.rpmWindow.length);

    if (s.air) a.push('air');
    else if (s.qPipe > 0.05 && s.qOverflow < 0.05 && s.intakeLevel < 0.98) a.push('noOverflow');
    if (s.overspeed) a.push('overspeed');
    if (s.bmsOpen) a.push('bmsOpen');
    if (s.qPipe > 0.05 && s.qPipe < 1) a.push('lowFlow');
    if (Math.abs(this.surge) > 0.12 * p.headGross) a.push('surge');
    if (s.pressureBar > 10) a.push('overpressure');
    if (p.screenClog > 0.6) a.push('clogged');
    if (p.bearingWear) a.push('bearing');
    if (s.soc < 0.2) a.push('lowSoc');
    if (p.ctrlMode === 'mppt' && mean > 100 && sd / mean > 0.015) a.push('hunting');
    s.alarms = a;
  }

  private record(dt: number): void {
    this.dynTimer += dt;
    if (this.dynTimer < 0.1) return;
    this.dynTimer = 0;
    const s = this.state;
    this.dyn.push({ t: this.realTime, rpm: s.rpm, pElec: s.pToBus, bar: s.pressureBar, q: s.qPipe });
    if (this.dyn.length > 600) this.dyn.shift();
  }
}
