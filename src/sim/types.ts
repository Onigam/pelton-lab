// Shared simulation state. The engine (sim/engine.ts) writes it every frame and the
// 3D scenes and UI only read it.

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** How the turbine output is regulated (see lesson "constant speed"). */
export type CtrlMode =
  | 'fixed' // TriStar MPPT 45 in constant-input-voltage mode: fixed voltage => fixed speed
  | 'mppt' // a classic solar MPPT tracking algorithm: speed hunts all the time
  | 'direct'; // rectified output wired straight to the 48 V battery bus

export type AlarmKey =
  | 'air' // intake ran dry, air sucked into the penstock
  | 'noOverflow' // no overflow at the intake: air ingress imminent
  | 'overspeed' // runaway: turbine unloaded
  | 'bmsOpen' // battery full and no dump load: BMS opened the charge path
  | 'lowFlow' // below 1 L/s: degraded mode
  | 'surge' // water hammer pressure spike
  | 'overpressure' // pressure above the PN10 rating of the pipe
  | 'clogged' // Coanda screen clogged
  | 'bearing' // worn bearings
  | 'lowSoc' // battery below 20 %
  | 'hunting'; // speed oscillation caused by an MPPT tracker

export interface NozzleState {
  id: 'top' | 'side';
  kind: 'variable' | 'fixed';
  /** Installed / used in the current configuration. */
  enabled: boolean;
  /** Branch valve position actually reached, 0 closed .. 1 open (animated). */
  valve: number;
  /** Spear (needle) opening for the variable injector, 0..1. Always 1 for fixed nozzles. */
  opening: number;
  /** Equivalent jet diameter in mm. */
  d: number;
  /** Flow through this nozzle, L/s. */
  q: number;
}

export interface SimState {
  // ---- clock -------------------------------------------------------------
  /** Accelerated simulation time in seconds since start. */
  simTime: number;
  /** Day counter (0-based) and hour of day (0..24, fractional). */
  day: number;
  hour: number;
  season: Season;
  /** Simulated seconds per real second for the energy clock. */
  timeScale: number;
  running: boolean;

  // ---- site & hydraulics ---------------------------------------------------
  headGross: number; // m
  pipeLength: number; // m
  pipeDiam: number; // internal diameter, mm
  qStream: number; // natural stream flow, L/s
  qCaptured: number; // flow entering the Coanda box, L/s
  qOverflow: number; // flow passing over the intake, L/s
  intakeLevel: number; // 0 empty .. 1 full (box + pond buffer)
  screenClog: number; // 0 clean .. 1 fully clogged
  air: boolean; // air drawn into the penstock
  qPipe: number; // L/s in the penstock
  vPipe: number; // m/s in the penstock
  headLoss: number; // friction + fittings losses, m
  headNet: number; // head available at the nozzles, m
  pressureBar: number; // gauge pressure at the turbine inlet (incl. water hammer)
  staticBar: number; // gauge pressure with every valve closed
  vJet: number; // jet velocity, m/s
  mainValve: number; // 0..1 actual main valve position
  nozzles: NozzleState[];

  // ---- mechanics -----------------------------------------------------------
  omega: number; // rad/s
  rpm: number;
  /** Wheel angle in radians, already scaled by the visual slow-motion factor. */
  angle: number;
  uOverV: number; // bucket speed / jet speed (optimum ~0.46)
  etaTurbine: number; // hydraulic -> shaft efficiency
  overspeed: boolean;
  /** Bucket set mounted on the runner: S (matched to 6 mm jets) or L (8 mm). */
  bucketSet: 'S' | 'L';
  /** Machine version: V1 prototype or V2 industrialised design. */
  version: 'v1' | 'v2';
  /** V2 jet deflector position: 0 retracted .. 1 cutting the jets. */
  deflector: number;

  // ---- electrical ----------------------------------------------------------
  emf: number; // rectified open-circuit voltage, V
  vTurbine: number; // voltage at the turbine terminals, V
  iGen: number; // DC current out of the turbine, A
  pHyd: number; // hydraulic power of the jets, W
  pShaft: number; // mechanical power on the shaft, W
  pElec: number; // electrical power at the turbine terminals, W
  pCableLoss: number; // W lost in the turbine cable
  pToBus: number; // hydro power delivered to the 48 V bus, W
  vBatt: number; // V
  iBatt: number; // A, + = charging
  soc: number; // 0..1
  batteryKWh: number; // installed capacity
  bmsOpen: boolean;
  pPv: number; // PV power used, W
  pPvAvail: number; // PV power available, W
  pvPeak: number; // installed PV, Wp
  pLoad: number; // AC consumption of the house, W
  pDump: number; // power sent to the dump-load resistors, W
  pInverter: number; // DC power drawn by the inverter, W
  ctrlMode: CtrlMode;
  vSet: number; // controller input voltage set-point, V
  dumpEnabled: boolean;
  transportHV: boolean; // high-voltage generator winding for long cable runs
  energyToday: { hydro: number; pv: number; load: number; dump: number }; // kWh

  alarms: AlarmKey[];
}
