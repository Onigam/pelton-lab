// PL-E02 — generator wiring: developed 12-slot / 14-pole concentrated winding, star
// connection, phase leads to the terminal block and the 6-diode bridge on its heatsink,
// front view of the stator at 1:2, EMF versus speed and the acceptance tests.
// Geometry follows src/three/turbine/generator.ts, numbers follow sim/presets.ts + engine.ts.
import { l, tr, type L } from '../../i18n';
import { presetParams } from '../../sim/presets';
import { COLORS, Drawing, INK, INK_2, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import {
  arrowHead,
  connector,
  dcWire,
  diode,
  dot,
  enclosure,
  grid,
  para,
  PHASE,
  sensor,
  sigWire,
  tag,
} from './elec-symbols';
import { hydro, nf } from './hyd-symbols';

/** Operating speeds (rpm) of sites A (Ø6) and B from the simulator steady state. */
const speeds = () => ({ nA: hydro().a6.pt.rpm, nB: hydro().b.pt.rpm });
const NMAX = 4000;

const PATTERN = 'AabBCcaABbcC'; // standard 12N14P layout, uppercase = clockwise
const PH_COL = [PHASE.U, PHASE.V, PHASE.W];
const PH_NAME = ['U', 'V', 'W'];
const phaseOf = (k: number) => 'ABC'.indexOf(PATTERN[k].toUpperCase());
const N_FILL = '#3a4656';
const S_FILL = '#e4e7eb';
const STEEL = '#d9dde3';
const fr = (v: number, d: number) => v.toFixed(d).replace('.', ',');

function lab(
  p: View,
  at: Pt,
  t: Text,
  o: { a?: 'start' | 'middle' | 'end'; c?: string; b?: boolean; s?: number } = {},
): void {
  p.text(at, t, {
    size: o.s ?? 1.8,
    anchor: o.a ?? 'start',
    baseline: 'middle',
    color: o.c,
    weight: o.b ? 'bold' : 'normal',
    halo: true,
  });
}

// ------------------------------------------------------------------ developed winding

const XK = (k: number) => 34 + k * 18; // tooth centre, k = 0..11
const LEAD_Y = [21, 26, 31];

function developed(p: View): void {
  lab(
    p,
    [16, 15.6],
    l(
      'BOBINAGE DÉVELOPPÉ — 12 dents / 14 pôles, bobines concentrées',
      'DEVELOPED WINDING — 12 teeth / 14 poles, concentrated coils',
    ),
    { b: true, s: 2 },
  );
  const start = (k: number) => XK(k) - 3.5;
  const end = (k: number) => XK(k) + 3.5;
  const wire = (pts: Pt[], k: number) => p.polyline(pts, { w: W.medium, color: PH_COL[phaseOf(k)] });
  // phase leads, star point, jumpers and pair links (drawn first, coils on top)
  [0, 2, 4].forEach((k, ph) =>
    wire(
      [
        [start(k), 64],
        [start(k), LEAD_Y[ph]],
        [262, LEAD_Y[ph]],
      ],
      k,
    ),
  );
  [7, 9, 11].forEach((k) =>
    wire(
      [
        [end(k), 64],
        [end(k), 35],
      ],
      k,
    ),
  );
  p.line([end(7), 35], [end(11), 35], { w: W.medium });
  [7, 9, 11].forEach((k) => dot(p, [end(k), 35], INK, 0.7));
  const jumpers: [number, number, number][] = [
    [1, 6, 53],
    [3, 8, 48.5],
    [5, 10, 44],
  ];
  for (const [a, b, y] of jumpers)
    wire(
      [
        [end(a), 64],
        [end(a), y],
        [start(b), y],
        [start(b), 64],
      ],
      a,
    );
  for (const k of [0, 2, 4, 6, 8, 10])
    wire(
      [
        [end(k), 64],
        [end(k), 58.5],
        [start(k + 1), 58.5],
        [start(k + 1), 64],
      ],
      k,
    );
  lab(p, [177.5, 38], l('N (point étoile)', 'N (star point)'), { a: 'middle' });
  PH_NAME.forEach((n, ph) => lab(p, [start(ph * 2) - 1.5, LEAD_Y[ph]], n, { a: 'end', b: true, c: PH_COL[ph] }));
  // teeth, coils, magnets
  for (let k = 0; k < 12; k++) {
    const x = XK(k);
    const col = PH_COL[phaseOf(k)];
    const cw = PATTERN[k] === PATTERN[k].toUpperCase();
    p.rect([x - 3, 61], [x + 3, 83], { w: W.thin, fill: STEEL });
    p.rect([x - 8.2, 83], [x + 8.2, 85.2], { w: W.thin, fill: STEEL });
    p.roundRect([x - 6, 64], [x + 6, 80], 1.2, { w: W.medium, color: col });
    arrowHead(p, [x - 6, cw ? 70.5 : 73.5], cw ? 90 : -90, col, 2);
    arrowHead(p, [x + 6, cw ? 73.5 : 70.5], cw ? -90 : 90, col, 2);
    dot(p, [start(k), 64], col, 0.75);
    p.circle([x, 101], 2.3, { w: W.thin, fill: COLORS.paper });
    lab(p, [x, 101], String(k + 1), { a: 'middle', s: 1.8 });
    lab(p, [x, 106.6], PATTERN[k], { a: 'middle', b: true, c: col, s: 2.4 });
  }
  const pitch = 216 / 14;
  p.rect([25, 94.5], [241, 97], { w: W.thin, hatch: 'steel' });
  for (let i = 0; i < 14; i++) {
    const c = XK(0) + i * pitch;
    const n = i % 2 === 0;
    p.rect([c - pitch * 0.37, 87.5], [c + pitch * 0.37, 94.5], { w: W.thin, fill: n ? N_FILL : S_FILL });
    p.text([c, 91], n ? 'N' : 'S', {
      size: 1.9,
      anchor: 'middle',
      baseline: 'middle',
      weight: 'bold',
      color: n ? '#fff' : INK,
    });
  }
  p.line([243, 91], [249, 91], { w: W.thin });
  arrowHead(p, [250, 91], 0, INK, 1.8);
  lab(p, [246, 87.4], l('rotor', 'rotor'), { a: 'middle', c: INK_2 });
  lab(p, [16, 91], l('aimants', 'magnets'), { c: INK_2 });
  lab(p, [16, 72], l('bobines', 'coils'), { c: INK_2 });
  lab(p, [16, 101], l('dent', 'tooth'), { c: INK_2 });
  lab(p, [16, 106.6], l('phase', 'phase'), { c: INK_2 });
  lab(
    p,
    [25, 113],
    l(
      'Majuscule = sens horaire, minuscule = sens inverse · • = début de bobine · A, B, C → U, V, W · 4 bobines en série par phase (1-2 + 7-8 pour A)',
      'Uppercase = clockwise, lowercase = counter-clockwise · • = coil start · A, B, C → U, V, W · 4 coils in series per phase (1-2 + 7-8 for A)',
    ),
    { c: INK_2 },
  );
}

// ------------------------------------------------------------------ terminal block, bridge, cable

function connection(p: View): void {
  lab(p, [256, 15.6], l('RACCORDEMENT DES PHASES', 'PHASE CONNECTIONS'), { b: true, s: 2 });
  // terminal block X1
  p.rect([262, 18.5], [270, 33.5], { w: W.medium, fill: '#e9e3d6' });
  LEAD_Y.forEach((y) => {
    p.circle([266, y], 1.3, { w: W.thin, fill: COLORS.paper });
    p.line([265.1, y + 0.9], [266.9, y - 0.9], { w: W.thin });
  });
  lab(p, [266, 36], 'X1', { a: 'middle', b: true });
  // phase wires routed under the module, nested so that they never cross
  const tabs = [300, 307, 314, 321, 328];
  const route: [number, number][] = [
    [290, 50],
    [286, 53],
    [282, 56],
  ];
  LEAD_Y.forEach((y, i) => {
    const [jx, by] = route[i];
    p.polyline(
      [
        [270, y],
        [jx, y],
        [jx, by],
        [tabs[i], by],
        [tabs[i], 43],
      ],
      { w: W.medium, color: PH_COL[i] },
    );
  });
  // heatsink + module
  p.rect([292, 19.5], [336, 45.5], { w: W.thin, hatch: 'alu', fill: '#eef0f2' });
  p.rect([296, 23.5], [332, 42.5], { w: W.medium, fill: '#2c333b' });
  p.text([314, 28.5], 'U1', { size: 2.2, anchor: 'middle', baseline: 'middle', weight: 'bold', color: '#fff' });
  ['~', '~', '~', '+', '−'].forEach((t, i) => {
    p.rect([tabs[i] - 1.6, 39.7], [tabs[i] + 1.6, 43.1], { w: W.thin, fill: '#c9a46a' });
    p.text([tabs[i], 36.8], t, { size: 2, anchor: 'middle', baseline: 'middle', weight: 'bold', color: '#fff' });
  });
  // DC output to the rear-panel gland and the cable
  p.polyline(
    [
      [321, 43],
      [321, 63],
      [344, 63],
      [349, 58.6],
    ],
    { w: W.medium, color: COLORS.dcPos },
  );
  p.polyline(
    [
      [328, 43],
      [328, 59],
      [344, 59],
      [349, 57.4],
    ],
    { w: W.medium, color: COLORS.dcNeg },
  );
  dcWire(p, [
    [349, 58],
    [405, 58],
  ]);
  p.rect([348, 47], [351, 69], { w: W.thin, hatch: 'pmma' });
  p.polyline(
    [
      [351, 55],
      [355, 55.6],
      [355, 60.4],
      [351, 61],
    ],
    { w: W.medium, fill: '#4a5560', closed: true },
  );
  connector(p, [372, 58], 0);
  lab(p, [372, 53.2], 'X2 IP68', { a: 'middle' });
  lab(p, [349.5, 72], l('presse-étoupe M20', 'M20 gland'), { a: 'middle' });
  lab(p, [404, 62.6], 'W1 2 × 6 mm²', { a: 'end', b: true });
  lab(p, [404, 66.2], l('→ coffret contrôleur A1', '→ controller box A1'), { a: 'end' });
  lab(
    p,
    [256, 66.5],
    l(
      'U1 : pont triphasé 90 A / 1 600 V sur dissipateur alu ≈ 1 K/W',
      'U1: 3-phase bridge 90 A / 1,600 V on an alu heatsink ≈ 1 K/W',
    ),
  );
  lab(
    p,
    [256, 70],
    l(
      'pâte thermique sous le module ; + rouge, − noir repérés',
      'thermal paste under the module; + red, − black marked',
    ),
    { c: INK_2 },
  );
  // internal diagram of the bridge
  const x0 = 362;
  p.rect([x0 - 6, 17], [405, 47], { w: W.thin, dash: [1.2, 0.8], color: INK_2 });
  lab(p, [x0 - 4.5, 19.6], l('schéma interne', 'internal diagram'), { c: INK_2 });
  p.line([x0, 24], [x0 + 30, 24], { w: W.thin, color: COLORS.dcPos });
  p.line([x0, 42], [x0 + 30, 42], { w: W.thin });
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * 12;
    p.line([x, 24], [x, 42], { w: W.thin });
    diode(p, [x, 28.5], 90, INK, 1.3);
    diode(p, [x, 37.5], 90, INK, 1.3);
    p.line([x, 33], [x - 3.4, 33], { w: W.thin, color: PH_COL[i] });
    p.circle([x - 3.9, 33], 0.5, { w: W.thin, fill: COLORS.paper, color: PH_COL[i] });
    dot(p, [x, 33], INK, 0.45);
    lab(p, [x - 3.9, 30.8], '~', { a: 'middle', c: PH_COL[i] });
  }
  lab(p, [x0 + 31, 24], '+', { b: true, c: COLORS.dcPos, s: 2.2 });
  lab(p, [x0 + 31, 42], '−', { b: true, s: 2.2 });

  // sensors to the controller box
  enclosure(
    p,
    [254, 76],
    [405, 88.5],
    l('CAPTEURS (câbles blindés, à l’écart des phases)', 'SENSORS (shielded, away from the phase leads)'),
    INK_2,
    1.8,
  );
  sensor(p, [262, 84], 'n', COLORS.signal);
  lab(p, [266, 84], l('B1 Hall : +5 V, 0 V, signal', 'B1 Hall: +5 V, 0 V, signal'), { c: COLORS.signal });
  sensor(p, [322, 84], 'θ', COLORS.signal);
  lab(p, [326, 84], l('B2 CTN 10 kΩ', 'B2 NTC 10 kΩ'), { c: COLORS.signal });
  sigWire(p, [
    [350, 84],
    [390, 84],
  ]);
  tag(p, [390, 84], 'A1', 'right');
}

/** Inductor with three bumps between a and b. */
function inductor(p: View, a: Pt, b: Pt, color: string): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;
  const g = p.group(a, ang);
  const r = 1.1;
  const s0 = len / 2 - 3 * r;
  g.line([0, 0], [s0, 0], { w: W.medium, color });
  for (let i = 0; i < 3; i++) g.arc([s0 + r + i * 2 * r, 0], r, 180, 0, { w: W.medium, color });
  g.line([s0 + 6 * r, 0], [len, 0], { w: W.medium, color });
}

function starDelta(p: View): void {
  const y0 = 94;
  lab(p, [256, y0], l('COUPLAGE : ÉTOILE RETENU', 'CONNECTION: STAR (Y) CHOSEN'), { b: true, s: 1.9 });
  const c: Pt = [271, y0 + 13];
  [90, 210, 330].forEach((a, i) => {
    const e: Pt = [c[0] + 9.5 * Math.cos((a * Math.PI) / 180), c[1] - 9.5 * Math.sin((a * Math.PI) / 180)];
    inductor(p, c, e, PH_COL[i]);
    lab(p, [e[0] + (i === 1 ? -1.2 : 1.2), e[1] + (i === 0 ? 0 : 1.2)], PH_NAME[i], {
      a: i === 1 ? 'end' : 'start',
      b: true,
      c: PH_COL[i],
    });
  });
  dot(p, c, INK, 0.7);
  // delta, struck through
  const d: Pt[] = [
    [296, y0 + 5],
    [289, y0 + 17],
    [303, y0 + 17],
  ];
  for (let i = 0; i < 3; i++) inductor(p, d[i], d[(i + 1) % 3], INK_2);
  p.line([288, y0 + 3], [304, y0 + 19], { w: W.medium, color: COLORS.red });
  p.line([304, y0 + 3], [288, y0 + 19], { w: W.medium, color: COLORS.red });
  para(
    p,
    309,
    y0 - 1.2,
    l(
      'Étoile : 4 bobines en série par phase, tension entre phases = √3 × tension de phase, aucun courant de circulation. En triangle, les harmoniques de rang 3 des trois phases s’additionnent dans la boucle fermée : courant de circulation et échauffement, même à vide. À proscrire sur ce bobinage concentré.',
      'Star: 4 coils in series per phase, line voltage = √3 × phase voltage, no circulating current. In delta, the third harmonics of the three phases add up around the closed loop: circulating current and heating, even with no load. Avoid it on this concentrated winding.',
    ),
    97,
    { size: 1.8, lineH: 2.75 },
  );
}

// ------------------------------------------------------------------ front view 1:2

function frontView(d: Drawing): void {
  const v = d.view(66, 176, 0.5);
  const pp = d.paper();
  const pol = (r: number, deg: number): Pt => [
    r * Math.cos((deg * Math.PI) / 180),
    r * Math.sin((deg * Math.PI) / 180),
  ];
  const toothAng = (k: number) => 90 - k * 30; // tooth 1 on top, numbered clockwise
  v.circle([0, 0], 78, { w: W.medium, fill: '#f3ead9' });
  v.circle([0, 0], 61.5, { w: W.thin, fill: '#c9ced6' });
  for (let i = 0; i < 14; i++) {
    const a = 90 - (i * 360) / 14;
    const h = (360 / 14) * 0.37;
    const pts: Pt[] = [];
    for (let s = 0; s <= 6; s++) pts.push(pol(61.4, a - h + (2 * h * s) / 6));
    for (let s = 6; s >= 0; s--) pts.push(pol(57.5, a - h + (2 * h * s) / 6));
    v.polyline(pts, { w: W.thin, fill: i % 2 ? S_FILL : N_FILL, closed: true });
    pp.text(v.map(pol(70, a)), i % 2 ? 'S' : 'N', {
      size: 1.8,
      anchor: 'middle',
      baseline: 'middle',
      weight: 'bold',
      color: INK_2,
    });
  }
  v.circle([0, 0], 57.2, { w: 0, fill: COLORS.paper, color: COLORS.paper });
  // lamination outline (same profile as the 3D stator)
  const lam: Pt[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (toothAng(k) * Math.PI) / 180;
    const t = (r: number, s: number): Pt => [r * Math.cos(a) - s * Math.sin(a), r * Math.sin(a) + s * Math.cos(a)];
    lam.push(pol(42, toothAng(k) + 15), t(42, 5.2), t(53, 5.2));
    for (let s = 0; s <= 6; s++) lam.push(pol(s === 0 || s === 6 ? 54.5 : 56.5, toothAng(k) + 11.7 - (23.4 * s) / 6));
    lam.push(t(53, -5.2), t(42, -5.2));
  }
  v.polyline(lam, { w: W.medium, fill: STEEL, closed: true });
  v.circle([0, 0], 34.2, { w: W.medium, fill: COLORS.paper });
  v.circle([0, 0], 10, { w: W.thin, fill: '#c9ced6' });
  v.center([-80, 0], [80, 0]);
  v.center([0, -80], [0, 80]);
  for (let k = 0; k < 12; k++) {
    const a = toothAng(k);
    const col = PH_COL[phaseOf(k)];
    const g = pp.group(v.map([0, 0]), a - 90, 0.5);
    for (const sx of [-1, 1])
      g.rect([sx * 5.5, -43.5], [sx * 8.3, -52], { w: W.thin, color: col, fill: col, opacity: 0.55 });
    pp.text(v.map(pol(26, a)), String(k + 1), { size: 1.8, anchor: 'middle', baseline: 'middle' });
    lab(pp, v.map(pol(87, a)), PATTERN[k], { a: 'middle', b: true, c: col, s: 2.2 });
  }
  v.dimDiameter([0, 0], 78, 28, { label: 'Ø156', size: 2 });
  v.dimDiameter([0, 0], 56.5, -32, { label: 'Ø113', size: 2 });
  const hp = v.map(pol(92, 105));
  pp.rect([hp[0] - 2, hp[1] - 1.6], [hp[0] + 2, hp[1] + 1.6], {
    w: W.medium,
    color: COLORS.signal,
    fill: COLORS.paper,
  });
  lab(pp, [hp[0] - 3, hp[1]], 'B1 Hall', { a: 'end', c: COLORS.signal });
  const tp = v.map(pol(47, 90 - 6.9));
  dot(pp, tp, COLORS.signal, 0.8);
  pp.polyline([tp, [tp[0] + 8, tp[1] - 26], [tp[0] + 11, tp[1] - 26]], { w: W.thin, color: COLORS.signal });
  lab(pp, [tp[0] + 12, tp[1] - 26], l('B2 CTN', 'B2 NTC'), { c: COLORS.signal });
  v.caption([0, -100], l('VUE DE FACE DU STATOR ET DU ROTOR', 'STATOR AND ROTOR, FRONT VIEW'), '1:2');
}

// ------------------------------------------------------------------ EMF chart and figures

function emfChart(p: View): void {
  const ox = 140;
  const oy = 190;
  const w = 88;
  const h = 58;
  const X = (n: number) => ox + (n / NMAX) * w;
  const Yv = (e: number) => oy - (e / 160) * h;
  lab(p, [128, 124.6], l('TENSION À VIDE E = ke · ω', 'OPEN-CIRCUIT VOLTAGE E = ke · ω'), { b: true, s: 1.9 });
  for (let n = 0; n <= NMAX; n += 500) p.line([X(n), oy], [X(n), Yv(160)], { w: 0.1, color: '#d6cfc2' });
  for (let e = 0; e <= 160; e += 40) {
    p.line([ox, Yv(e)], [ox + w, Yv(e)], { w: 0.1, color: '#d6cfc2' });
    lab(p, [ox - 1.2, Yv(e)], String(e), { a: 'end' });
  }
  for (let n = 0; n <= NMAX; n += 1000) {
    lab(p, [X(n), oy + 3], String(n), { a: 'middle' });
    lab(p, [X(n), Yv(160) - 3.4], n ? String(Math.round((7 * n) / 60)) : 'f (Hz)', { a: 'middle', c: INK_2 });
  }
  p.line([ox, oy], [ox + w, oy], { w: W.medium });
  p.line([ox, oy], [ox, Yv(160)], { w: W.medium });
  lab(p, [ox + w, oy + 6.4], l('n (tr/min)', 'n (rpm)'), { a: 'end', c: INK_2 });
  p.text([130.6, Yv(80)], 'E (V)', { size: 1.8, anchor: 'middle', baseline: 'middle', rotate: 90, color: INK_2 });
  const limit = (e: number, t: L) => {
    p.line([ox, Yv(e)], [ox + w, Yv(e)], { w: W.thin, color: COLORS.red, dash: [1.6, 0.9] });
    lab(p, [ox + 1.5, Yv(e) - 1.8], t, { c: COLORS.red });
  };
  limit(150, l('150 V : entrée max TS-MPPT-45', '150 V: TS-MPPT-45 max input'));
  limit(120, l('120 V : limite TBTS en continu', '120 V: DC extra-low-voltage limit'));
  const { nA, nB } = speeds();
  const sites: [number, number, string][] = [
    [presetParams('siteA').ke, nA, 'A'],
    [presetParams('siteB').ke, nB, 'B'],
  ];
  for (const [ke, nNom, s] of sites) {
    const k = (ke * 2 * Math.PI) / 60;
    const nMax = Math.min(NMAX, 160 / k);
    const col = s === 'A' ? COLORS.acN : COLORS.copper;
    p.line([X(0), Yv(0)], [X(nMax), Yv(k * nMax)], { w: W.medium, color: col });
    dot(p, [X(nNom), Yv(k * nNom)], INK, 0.9);
    p.circle([X(2 * nNom), Yv(k * 2 * nNom)], 1.1, { w: W.medium, color: COLORS.red, fill: COLORS.paper });
    const at: Pt = s === 'A' ? [X(2600) + 2, Yv(k * 2600) + 4.6] : [X(1000) - 2, Yv(k * 1000) - 3.6];
    lab(p, at, l(`site ${s} · ke ${fr(ke, 2)}`, `site ${s} · ke ${ke.toFixed(2)}`), {
      a: s === 'A' ? 'start' : 'end',
      c: col,
      b: true,
    });
  }
  const kA = (sites[0][0] * 2 * Math.PI) / 60;
  const kB = (sites[1][0] * 2 * Math.PI) / 60;
  lab(p, [X(nA) + 1.6, Yv(kA * nA) + 2.4], l('nominal', 'rated'));
  lab(p, [X(2 * nB) + 2.4, Yv(kB * 2 * nB) + 1.4], l('emballement', 'runaway'), { c: COLORS.red });
}

function figures(p: View): void {
  const ke = presetParams('siteA').ke;
  const kB = presetParams('siteB').ke;
  const { nA, nB } = speeds();
  const w = (n: number) => (n * 2 * Math.PI) / 60;
  const e = ke * w(nA);
  const perRpm = (ke * 2 * Math.PI) / 60;
  const [fA, rA, rB] = [nf((7 * nA) / 60, 0), nf(nA, 0), nf(nB, 0)];
  const over = 2 * e > 120;
  lab(p, [128, 204.6], l('REPÈRES (modèle du simulateur)', 'KEY FIGURES (simulator model)'), { b: true, s: 1.9 });
  const lines: L[] = [
    l(
      `Site A : ke = ${fr(ke, 2)} V·s/rad = ${fr(perRpm, 3)} V par tr/min → à ${rA.fr} tr/min, E ≈ ${fr(e, 0)} V DC, ≈ ${fr(e / 1.35, 0)} V AC entre phases, ${fA.fr} Hz.`,
      `Site A: ke = ${ke.toFixed(2)} V·s/rad = ${perRpm.toFixed(3)} V per rpm → at ${rA.en} rpm, E ≈ ${e.toFixed(0)} V DC, ≈ ${(e / 1.35).toFixed(0)} V AC line-to-line, ${fA.en} Hz.`,
    ),
    l(
      `Site B : ke = ${fr(kB, 2)} V·s/rad (plus de spires, chute de 21 m) → ≈ ${rB.fr} tr/min, E ≈ ${fr(kB * w(nB), 0)} V.`,
      `Site B: ke = ${kB.toFixed(2)} V·s/rad (more turns, 21 m head) → ≈ ${rB.en} rpm, E ≈ ${(kB * w(nB)).toFixed(0)} V.`,
    ),
    l(
      'I = (E − 1,6 V − U bus) / (R gén + R câble), avec R gén = 0,55 Ω (phase + pont, vu côté DC) ; f = 7 · n / 60.',
      'I = (E − 1.6 V − U bus) / (R gen + R cable), with R gen = 0.55 Ω (phase + bridge, seen from DC); f = 7 · n / 60.',
    ),
    l(
      `À vide, la roue s’emballe vers 2 × n : E ≈ ${fr(2 * e, 0)} V sur le site A, ${over ? 'au-delà de' : 'sous'} la TBTS. Option HT : bobinage × 4 → E × 4, R × 16, I ÷ 4.`,
      `Unloaded, the runner races to about 2 × n: E ≈ ${(2 * e).toFixed(0)} V on site A, ${over ? 'above' : 'below'} extra-low voltage. HV option: winding × 4 → E × 4, R × 16, I ÷ 4.`,
    ),
  ];
  let y = 207.6;
  for (const t of lines) y += para(p, 128, y, t, 104, { size: 1.8, lineH: 2.75 }) + 1;
}

// ------------------------------------------------------------------ tests, safety, dimensions

function tests(p: View): number {
  const perRpm = (presetParams('siteA').ke * 2 * Math.PI) / 60;
  const u300 = (perRpm * 300) / 1.35; // AC line voltage at 300 rpm
  lab(p, [238, 124.6], l('ESSAIS DE RÉCEPTION DU GÉNÉRATEUR', 'GENERATOR ACCEPTANCE TESTS'), { b: true, s: 1.9 });
  const rows: [L, L, L][] = [
    [
      l('Résistance entre phases', 'Phase-to-phase resistance'),
      l(
        'Pont débranché, ohmmètre petit calibre (idéal : 4 fils), à 20 °C : U-V, V-W, W-U.',
        'Bridge disconnected, low-range ohmmeter (ideally 4-wire), at 20 °C: U-V, V-W, W-U.',
      ),
      l('≈ 0,5 Ω chacune (2 × R phase) ; écart ≤ ± 5 %.', '≈ 0.5 Ω each (2 × R phase); spread ≤ ± 5%.'),
    ],
    [
      l('Tensions à vide', 'Open-circuit voltages'),
      l(
        'Rotor entraîné à la main ou à la perceuse (≈ 300 tr/min), voltmètre AC entre phases.',
        'Rotor turned by hand or with a drill (≈ 300 rpm), AC voltmeter between phases.',
      ),
      l(
        `3 tensions égales à ± 5 % (≈ ${fr(u300, 0)} V à 300 tr/min, 35 Hz).`,
        `3 equal voltages within ± 5% (≈ ${u300.toFixed(0)} V at 300 rpm, 35 Hz).`,
      ),
    ],
    [
      l('Polarité des aimants', 'Magnet polarity'),
      l(
        'Boussole ou aimant témoin devant chacun des 14 aimants, avant collage.',
        'Compass or reference magnet in front of each of the 14 magnets, before bonding.',
      ),
      l('N et S strictement alternés.', 'N and S strictly alternating.'),
    ],
    [
      l('Isolement', 'Insulation'),
      l(
        'Mégohmmètre 500 V DC entre les 3 phases reliées et les tôles (carter), pont et capteurs débranchés.',
        '500 V DC insulation tester between the 3 phases tied together and the core (frame), bridge and sensors disconnected.',
      ),
      l('> 10 MΩ ; jamais < 1 MΩ.', '> 10 MΩ; never < 1 MΩ.'),
    ],
    [
      l('Pont redresseur', 'Bridge rectifier'),
      l('Multimètre en test diode sur chacune des 6 diodes.', 'Multimeter in diode mode on each of the 6 diodes.'),
      l('0,4–0,7 V en direct, OL en inverse.', '0.4–0.7 V forward, OL reverse.'),
    ],
    [
      l('Sortie DC', 'DC output'),
      l(
        'Rotor entraîné, voltmètre DC sur + et − du bornier ; repérer la polarité.',
        'Rotor turning, DC voltmeter on + and − of the terminals; mark the polarity.',
      ),
      l(`U ≈ ${fr(perRpm, 3)} V par tr/min − 1,6 V (site A).`, `U ≈ ${perRpm.toFixed(3)} V per rpm − 1.6 V (site A).`),
    ],
    [
      l('Capteurs', 'Sensors'),
      l(
        'CTN à l’ohmmètre ; Hall : faire passer l’aimant cible devant le capteur.',
        'NTC with an ohmmeter; Hall: pass the target magnet in front of the sensor.',
      ),
      l('≈ 10 kΩ à 25 °C ; 1 impulsion par tour.', '≈ 10 kΩ at 25 °C; 1 pulse per revolution.'),
    ],
  ];
  const h = grid(
    p,
    238,
    127,
    [
      { label: 'N°', w: 7, align: 'middle' },
      { label: l('Essai', 'Test'), w: 31 },
      { label: l('Méthode', 'Method'), w: 76 },
      { label: l('Critère d’acceptation', 'Acceptance criterion'), w: 56 },
    ],
    rows.map((r, i) => [String(i + 1), { t: r[0], bold: true }, r[1], r[2]]),
    { size: 1.9, pad: 1, lineH: 2.9 },
  );
  // blank log to fill in at commissioning and at every yearly service
  const y = 127 + h + 4.5;
  lab(p, [238, y], l('RELEVÉS (à remplir)', 'READINGS (fill in)'), { b: true, s: 1.9 });
  const blank = ['', '', '', '', ''];
  grid(
    p,
    238,
    y + 2.4,
    [
      { label: l('Grandeur', 'Quantity'), w: 50 },
      { label: 'U-V', w: 20, align: 'middle' },
      { label: 'V-W', w: 20, align: 'middle' },
      { label: 'W-U', w: 20, align: 'middle' },
      { label: l('Écart max', 'Max spread'), w: 24, align: 'middle' },
      { label: l('Date / visa', 'Date / initials'), w: 36 },
    ],
    [
      [l('R à 20 °C (Ω)', 'R at 20 °C (Ω)'), ...blank],
      [l('U AC à vide à …… tr/min (V)', 'Open-circuit U AC at …… rpm (V)'), ...blank],
      [l('Isolement phases → masse (MΩ)', 'Insulation phases → frame (MΩ)'), ...blank],
    ],
    { size: 1.9, pad: 1.3, lineH: 2.9 },
  );
  return y;
}

function safety(p: View): void {
  p.rect([238, 226], [408, 245.5], { w: W.thin, color: COLORS.red });
  lab(p, [240, 228.6], l('⚠ SÉCURITÉ', '⚠ SAFETY'), { b: true, c: COLORS.red, s: 1.9 });
  para(
    p,
    240,
    231,
    l(
      'Un générateur à aimants produit dès qu’il tourne : on ne touche jamais aux bornes roue en mouvement, même lentement. Fermer l’eau et bloquer la roue avant toute intervention. Aimants N52 : risque d’écrasement des doigts ; éloigner téléphones, cartes et stimulateurs cardiaques.',
      'A magnet generator produces as soon as it turns: never touch the terminals while the runner moves, even slowly. Shut the water and lock the runner before any work. N52 magnets: finger-crush hazard; keep phones, cards and pacemakers away.',
    ),
    166,
    { size: 1.9, lineH: 2.95 },
  );
}

function mainDims(p: View): void {
  const { nA } = speeds();
  const [fA, rA] = [nf((7 * nA) / 60, 0), nf(nA, 0)];
  lab(p, [14, 250.6], l('COTES PRINCIPALES (reconstitution)', 'MAIN DIMENSIONS (reconstruction)'), { b: true, s: 1.9 });
  const cells: [L, string][] = [
    [l('Stator, épanouissements', 'Stator, tooth tips'), 'Ø 113'],
    [l('Culasse / alésage', 'Yoke / bore'), 'Ø 84 / Ø 68,4'],
    [l('Largeur de dent', 'Tooth width'), '10,4'],
    [l('Paquet de tôles 0,35', 'Stack of 0.35 sheets'), '36'],
    [l('Aimants N52 (× 14)', 'N52 magnets (× 14)'), '30 × 12 × 5'],
    [l('Rotor : cloche / aimants', 'Rotor: bell / magnets'), 'Ø 156 / Ø 115'],
    [l('Entrefer', 'Air gap'), '≈ 1'],
    [l('Arbre inox 316L', '316L stainless shaft'), 'Ø 20 h6'],
  ];
  cells.forEach(([k, v], i) => {
    const x = 14 + (i % 4) * 48;
    const y = 255 + Math.floor(i / 4) * 7;
    lab(p, [x, y], k, { c: INK_2 });
    lab(p, [x, y + 3.2], `${tr(l(v, v.replace(/(\d),(\d)/g, '$1.$2')))} mm`, { b: true });
  });
  lab(
    p,
    [14, 271.5],
    l(
      `7 paires de pôles → ${fA.fr} Hz à ${rA.fr} tr/min (site A) · classe d’isolation H (200 °C) · vernis d’imprégnation après bobinage.`,
      `7 pole pairs → ${fA.en} Hz at ${rA.en} rpm (site A) · insulation class H (200 °C) · varnish impregnation after winding.`,
    ),
    { c: INK_2 },
  );
  lab(
    p,
    [14, 275.2],
    l(
      'Données constructeur Hydronome (site officiel) : alternateur PMA conçu par Hydronome, 5 000 W nominal, pont 90 A, sortie MC4.',
      'Hydronome maker data (official site): Hydronome-designed PMA, 5,000 W rated, 90 A bridge, MC4 output.',
    ),
    { c: INK_2 },
  );
}

export const generatorWiring: DrawingSheet = {
  id: 'generator-wiring',
  number: 'PL-E02',
  group: 'electrical',
  title: l('Câblage du générateur', 'Generator wiring'),
  description: l(
    'Le bobinage des 12 bobines est « déroulé » : on lit, dent par dent, la phase, le sens d’enroulement et les liaisons entre bobines, avec les 14 aimants en dessous. Les trois phases (rouge, noir, bleu) sont couplées en étoile puis vont au bornier et au pont de 6 diodes monté sur son dissipateur, avant de sortir en courant continu par le presse-étoupe. La vue de face au 1:2 situe chaque bobine, la courbe montre que la tension croît avec la vitesse et double à l’emballement, et le tableau d’essais valide le générateur avant la mise en eau.',
    'The 12 coils are “unrolled”: tooth by tooth you read the phase, the winding direction and the coil-to-coil links, with the 14 magnets underneath. The three phases (red, black, blue) are star-connected, then go to the terminal block and to the 6-diode bridge on its heatsink, before leaving as DC through the cable gland. The 1:2 front view locates every coil, the chart shows that voltage rises with speed and doubles at runaway, and the test table validates the generator before the water is turned on.',
  ),
  scene: 'turbine',
  parts: ['stator', 'rotor', 'magnets', 'rectifier', 'terminal', 'cable', 'sensors'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Câblage du générateur', 'Generator wiring'),
      subtitle: l(
        '12 dents / 14 pôles, étoile, pont triphasé · Vue de face 1:2, schémas sans échelle',
        '12 teeth / 14 poles, star, 3-phase bridge · Front view 1:2, diagrams not to scale',
      ),
      number: 'PL-E02',
      scale: '1:2',
    });
    const p = d.paper();
    developed(p);
    connection(p);
    starDelta(p);
    frontView(d);
    emfChart(p);
    figures(p);
    tests(p);
    safety(p);
    mainDims(p);
    return d;
  },
};
