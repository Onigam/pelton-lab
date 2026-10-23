import { l, type L } from '../../i18n';
import { WAVE_SPEED_HDPE } from '../../sim/physics';
import { presetParams } from '../../sim/presets';
import { COLORS, Drawing, INK, INK_2, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import {
  airValve,
  ballValve,
  breakMark,
  cat,
  coupling,
  flowArrow,
  hydro,
  instrument,
  junction,
  levelMark,
  nf,
  notes,
  nozzle,
  para,
  pelton,
  reducer,
  strainer,
  type Case,
} from './hyd-symbols';

// PL-H01 — P&ID-style hydraulic diagram, paper space (not to scale): Coanda intake ->
// HDPE penstock -> turbine manifold (main valve, gauge tee, bypass, branch valves) -> two
// injectors -> runner -> tailrace. Values come from the simulator (steady state).

const BLUE = COLORS.acN;
const LINE = { w: W.thick };
/** Main valve closing time (s), from the simulator presets. */
const CLOSE_S = presetParams('siteA').valveCloseTime;

/** Process line through a list of paper points. */
const pipe = (p: View, pts: Pt[]) => p.polyline(pts, LINE);

/** Tag (bold) + up to two description lines, centred under/over a symbol. */
function tag(
  p: View,
  at: Pt,
  id: string,
  lines: Text[],
  o: { color?: string; anchor?: 'start' | 'middle' | 'end' } = {},
): void {
  const anchor = o.anchor ?? 'middle';
  p.text(at, id, { size: 2.1, weight: 'bold', anchor, color: o.color, halo: true });
  lines.forEach((t, i) =>
    p.text([at[0], at[1] + 3.1 * (i + 1)], t, { size: 1.75, anchor, color: o.color ?? INK_2, halo: true }),
  );
}

function intake(p: View): void {
  // stream and pond
  p.line([16, 36], [35, 36], { w: W.medium, color: COLORS.water });
  flowArrow(p, [20, 36]);
  p.text([16, 33], l('Ruisseau', 'Stream'), { size: 1.9, color: COLORS.water });
  const { a6, b } = hydro();
  levelMark(p, [29.5, 36], cat(l('retenue +', 'pond +'), nf(a6.hGross, 0), ' m (A) · +', nf(b.hGross, 0), ' m (B)'), {
    water: true,
  });
  // collection box with the sand-trap hopper downstream, water level under the screen
  const box: Pt[] = [
    [36, 38],
    [36, 76],
    [52, 76],
    [55, 82],
    [64, 82],
    [64, 57],
  ];
  p.polyline(
    [
      [36, 61],
      [64, 61],
      [64, 82],
      [55, 82],
      [52, 76],
      [36, 76],
    ],
    { closed: true, w: 0, fill: COLORS.waterFill },
  );
  p.line([36.3, 61], [63.7, 61], { w: W.thin, color: COLORS.water });
  p.polyline(box, { w: W.medium });
  // curved wedge-wire screen from the crest to the lip, the water sheet on top
  const k = Math.sin(0.95);
  const scr = (t: number, off = 0): Pt => {
    const a = t * 0.95;
    return [
      35 + (28 * Math.sin(a)) / k - off * Math.sin(a),
      36 + (20 * (1 - Math.cos(a))) / (1 - Math.cos(0.95)) - off * Math.cos(a),
    ];
  };
  const ts = Array.from({ length: 13 }, (_, i) => i / 12);
  p.polyline(
    ts.map((t) => scr(t, 1.2)),
    { w: W.medium, color: COLORS.water },
  );
  p.polyline(
    ts.map((t) => scr(t)),
    { w: W.thin },
  );
  p.polyline(
    ts.filter((t) => t > 0.2).map((t) => scr(t)),
    { w: 1.1, dash: [0.3, 0.5] },
  );
  p.line(scr(1), [66.5, 58.6], { w: W.medium });
  // overflow: surplus water and debris back to the stream
  p.polyline(
    [
      [66.5, 58.6],
      [69, 60.5],
      [70.5, 64],
    ],
    { w: W.medium, color: COLORS.water },
  );
  flowArrow(p, [70.5, 64], -70);
  p.text([73, 63.6], l('surplus + débris → ruisseau', 'surplus + debris → stream'), { size: 1.75, color: INK_2 });
  // sand-trap flush valve V-10
  pipe(p, [
    [64, 79.5],
    [79, 79.5],
  ]);
  ballValve(p, [71, 79.5], { closed: true, lever: COLORS.red, scale: 0.75 });
  flowArrow(p, [79, 79.5], 0, COLORS.water, 0.8);
  p.text([82, 80.3], 'V-10', { size: 2.1, weight: 'bold' });
  p.text([89, 80.3], l('purge du dessableur → ruisseau', 'sand-trap flush → stream'), { size: 1.75, color: INK_2 });
  // outlet strainer ST-01 (submerged), penstock start and vent VT-01
  strainer(p, [42, 70], { rot: 90 });
  p.line([33.5, 69], [39, 69.6], { w: W.thin });
  p.text([33, 68], 'ST-01', { size: 2.1, weight: 'bold', anchor: 'end' });
  p.text([33, 71.4], l('crépine', 'strainer'), { size: 1.75, color: INK_2, anchor: 'end' });
  pipe(p, [
    [42, 73],
    [42, 96],
  ]);
  flowArrow(p, [42, 88], -90);
  junction(p, [58, 96]);
  p.line([58, 96], [58, 89.5], { w: W.medium });
  p.arc([60, 89.5], 2, 90, 180, { w: W.medium });
  p.text([58, 101.5], 'VT-01', { size: 2.1, weight: 'bold', anchor: 'middle' });
  p.text([58, 104.6], l('évent Ø32', 'vent Ø32'), { size: 1.75, color: INK_2, anchor: 'middle' });
  p.text([16, 114], l("PRISE D'EAU COANDA", 'COANDA INTAKE'), { size: 2.3, weight: 'bold' });
  p.text([16, 117.6], l('grille inox 1 mm — voir PL-H03', '1 mm stainless screen — see PL-H03'), {
    size: 1.75,
    color: INK_2,
  });
}

function penstock(p: View): void {
  pipe(p, [
    [42, 96],
    [128, 96],
    [140, 108],
    [151, 108],
  ]);
  breakMark(p, [116, 96]);
  flowArrow(p, [76, 96]);
  flowArrow(p, [134, 102], -45);
  const { a6, b } = hydro();
  p.text([68, 94], cat(l('L-01 · PEHD PE100 Ø63 PN10 (Øi ', 'L-01 · HDPE PE100 Ø63 PN10 (ID '), nf(a6.bore, 0), ')'), {
    size: 1.8,
  });
  p.text([82, 100.5], cat(l('longueur ', 'length '), nf(a6.len, 0), ' m (A) · ', nf(b.len, 0), ' m (B)'), {
    size: 1.75,
    color: INK_2,
  });
}

function manifold(p: View): void {
  // main line Ø63 then Ø50
  pipe(p, [
    [151, 108],
    [224, 108],
  ]);
  coupling(p, [154, 108]);
  tag(p, [154, 101], 'CC-01', []);
  ballValve(p, [165, 108], { op: 'gear' });
  tag(p, [165, 115.5], 'V-01', [
    l('principale DN50', 'main DN50'),
    l(`à réducteur ≥ ${CLOSE_S} s`, `gear-operated ≥ ${CLOSE_S} s`),
  ]);
  // gauge tee: PI-01 above, PT-01 below
  junction(p, [184, 108]);
  p.line([184, 108], [184, 99.2], { w: W.medium });
  instrument(p, [184, 95], 'PI', '01');
  p.text([189, 93.5], '0–10 bar', { size: 1.75, color: INK_2 });
  p.text([189, 96.6], l('glycérine', 'glycerine'), { size: 1.75, color: INK_2 });
  p.line([184, 108], [184, 117.8], { w: W.medium });
  instrument(p, [184, 122], 'PT', '01');
  const sig = p.polyline(
    [
      [184, 126.2],
      [184, 150],
    ],
    { w: W.thin, color: COLORS.signal, dash: [1.6, 0.8] },
  );
  sig.setAttribute('marker-end', 'url(#arrow)');
  p.text([182, 148.5], l('4–20 mA → contrôleur', '4–20 mA → controller'), { size: 1.75, color: INK_2, anchor: 'end' });
  // bypass / drain branch Ø40 (3D part `valve-bypass`), normally closed: purges to the tailrace
  junction(p, [199, 108]);
  pipe(p, [
    [199, 108],
    [199, 162],
  ]);
  ballValve(p, [199, 126], { rot: 90, closed: true, lever: INK });
  tag(
    p,
    [203, 125],
    'V-02',
    [l('dérivation / purge Ø40', 'bypass / drain Ø40'), l('fermée en service', 'closed in service')],
    {
      anchor: 'start',
    },
  );
  flowArrow(p, [199, 145], -90);
  reducer(p, [212, 108]);
  tag(p, [212, 103.4], 'R-01', []);
  p.text([212, 115.5], '63 → 50', { size: 1.75, anchor: 'middle', color: INK_2, mono: true });
  // branch tee: gooseneck riser to the top injector, lower branch to the side injector
  junction(p, [224, 108]);
  pipe(p, [
    [224, 108],
    [224, 44],
    [290, 44],
    [290, 89],
    [313.4, 89],
  ]);
  pipe(p, [
    [224, 108],
    [224, 132],
    [299, 132],
  ]);
  ballValve(p, [224, 76], { rot: 90, lever: COLORS.red });
  tag(p, [229, 74.5], 'V-03', [l('injecteur haut', 'top injector'), l('rouge, DN32', 'red, DN32')], {
    anchor: 'start',
  });
  flowArrow(p, [224, 58], 90);
  flowArrow(p, [270, 44]);
  flowArrow(p, [290, 70], -90);
  p.text([226.5, 41.5], l('L-03 · col de cygne Ø50', 'L-03 · gooseneck Ø50'), { size: 1.75, color: INK_2 });
  junction(p, [262, 44]);
  airValve(p, [262, 44]);
  tag(p, [266, 34.5], 'AV-01', [l('ventouse, point haut', 'air valve, high point')], { anchor: 'start' });
  ballValve(p, [252, 132], { lever: BLUE });
  tag(p, [252, 139.5], 'V-04', [l('injecteur côté', 'side injector'), l('bleue, DN32', 'blue, DN32')]);
  flowArrow(p, [236, 132]);
  p.text([230, 129.4], 'L-04 · Ø50', { size: 1.75, color: INK_2 });
}

function machine(p: View): void {
  // housing, runner and jets
  p.rect([302, 94], [360, 152], { w: W.medium, dash: 'hidden', color: INK_2 });
  p.text([358, 149.5], 'T-01', { size: 2.1, weight: 'bold', anchor: 'end' });
  pelton(p, [330, 118], 14);
  nozzle(p, [316, 100], 'spear', { rot: -90 });
  p.line([316, 100], [316, 118], { w: 0.7, color: COLORS.water });
  nozzle(p, [306, 132], 'quick');
  p.line([306, 132], [330, 132], { w: 0.7, color: COLORS.water });
  const spear = presetParams('siteA').top.d;
  tag(p, [321, 84], 'N-01', [l(`pointeau Ø${spear} max`, `spear Ø${spear} max`)], { anchor: 'start' });
  tag(p, [289, 139.5], 'N-02', [l('inserts Ø4–10', 'inserts Ø4–10')]);
  // fail-safe jet deflector
  p.line([319.6, 104.5], [322.5, 98.5], { w: W.thick, color: COLORS.accent });
  p.circle([322.5, 98.5], 0.7, { w: W.thin, color: COLORS.accent, fill: COLORS.paper });
  p.text([325, 98.6], l('DF-01 déflecteur', 'DF-01 deflector'), { size: 1.7, color: COLORS.accent });
  levelMark(p, [298, 118], l('±0 injecteurs', '±0 nozzles'), { left: true });
  // generator on the shaft
  p.line([360, 117.2], [372.5, 117.2], { w: W.thin });
  p.line([360, 118.8], [372.5, 118.8], { w: W.thin });
  p.circle([378, 118], 5.5, { w: W.medium, fill: COLORS.paper });
  p.text([378, 118], 'G 3~', { size: 1.9, anchor: 'middle', baseline: 'middle', weight: 'bold' });
  p.text([378, 127], l('→ 48 V DC', '→ 48 V DC'), { size: 1.75, anchor: 'middle', color: INK_2 });
  // free fall and tailrace (the bypass joins it)
  p.line([330, 152], [330, 160], { w: 0.7, color: COLORS.water });
  flowArrow(p, [330, 159.5], -90);
  pipe(p, [
    [199, 162],
    [318, 162],
  ]);
  p.polyline(
    [
      [318, 160],
      [318, 163.5],
      [398, 163.5],
      [398, 160],
    ],
    { w: W.medium },
  );
  p.line([318.6, 162], [397.4, 162], { w: W.thin, color: COLORS.water });
  flowArrow(p, [385, 162]);
  p.text([392, 158.8], l('canal de fuite → ruisseau', 'tailrace → stream'), {
    size: 1.75,
    anchor: 'end',
    color: INK_2,
  });
  p.text([362, 146], l('chute libre', 'free fall'), { size: 1.75, color: INK_2 });
  p.text([362, 149.2], l('≥ 0,3–0,5 m', '≥ 0.3–0.5 m'), { size: 1.75, color: INK_2 });
  // skid boundary
  p.rect([144, 28], [403, 168], { w: W.thin, dash: 'phantom', color: INK_2 });
  p.text([147, 32.5], l('TURBINE PELTON — nourrice et injecteurs', 'PELTON TURBINE — manifold and injectors'), {
    size: 2.3,
    weight: 'bold',
  });
  p.text([147, 36], l('Châssis alu 40 × 40, déflecteur en violet', '40 × 40 alu skid, deflector in purple'), {
    size: 1.75,
    color: INK_2,
  });
}

const fmt = (v: number, d = 1) => nf(v, d);
const jetsTxt = (c: Case) =>
  c.jets.length > 1 ? cat(...c.jets.flatMap((j, i) => (i ? [' + ', nf(j.q, 2)] : [nf(j.q, 2)]))) : nf(c.jets[0].q, 2);

function valueTable(d: Drawing, x: number, y: number): number {
  const { a6, a8, b } = hydro();
  const cs = [a6, a8, b];
  const row = (label: L, unit: Text, f: (c: Case) => Text): Text[] => [label, unit, ...cs.map(f)];
  const p = d.paper();
  p.text(
    [x, y - 2],
    l('VALEURS DE FONCTIONNEMENT — régime permanent (simulateur)', 'OPERATING VALUES — steady state (simulator)'),
    { size: 2.3, weight: 'bold' },
  );
  return d.table(
    x,
    y,
    [
      { label: l('Grandeur', 'Quantity'), w: 60 },
      { label: l('Unité', 'Unit'), w: 13 },
      { label: l('A · Ø6', 'A · Ø6'), w: 22, align: 'end' },
      { label: l('A · Ø8 (prévu)', 'A · Ø8 (planned)'), w: 25, align: 'end' },
      { label: l('B · 2 injecteurs', 'B · 2 injectors'), w: 30, align: 'end' },
    ],
    [
      row(l('Chute brute H', 'Gross head H'), 'm', (c) => fmt(c.hGross, 0)),
      row(l('Conduite L × Ø intérieur', 'Penstock L × bore'), 'm × mm', (c) => `${c.len} × ${c.bore}`),
      row(l('Pression statique (tout fermé)', 'Static pressure (all closed)'), 'bar', (c) => fmt(c.staticBar, 2)),
      row(l('Pertes de charge hf', 'Head loss hf'), 'm', (c) => fmt(c.pt.hf, 2)),
      row(l('Pression en service (PI-01)', 'Running pressure (PI-01)'), 'bar', (c) => fmt(c.runBar, 2)),
      row(l('Débit par injecteur (haut + côté)', 'Flow per injector (top + side)'), 'L/s', jetsTxt),
      row(l('Vitesse du jet', 'Jet velocity'), 'm/s', (c) => fmt(c.pt.vJet)),
      row(l('Puissance hydraulique ρ·g·Q·Hn', 'Hydraulic power ρ·g·Q·Hn'), 'W', (c) => fmt(c.pt.pHyd, 0)),
      row(l('Puissance électrique (génératrice)', 'Electrical power (generator)'), 'W', (c) => fmt(c.pt.pElec, 0)),
      row(l('Vitesse optimale de la roue', 'Optimal runner speed'), l('tr/min', 'rpm'), (c) => fmt(c.pt.rpm, 0)),
      row(l('Coup de bélier, fermeture instantanée', 'Surge, instantaneous closure'), 'bar', (c) =>
        cat('+', fmt(c.surgeBar, 1)),
      ),
      row(l('Aller-retour de l’onde 2L/a', 'Wave round trip 2L/a'), 's', (c) => fmt(c.twoLa, c.twoLa < 1 ? 2 : 1)),
    ],
    4.5,
  );
}

const LEGEND: [L, (p: View, at: Pt) => void][] = [
  [l('Vanne à boisseau ¼ tour', 'Quarter-turn ball valve'), (p, at) => ballValve(p, at, { scale: 0.8 })],
  [l('Vanne fermée en service', 'Normally closed valve'), (p, at) => ballValve(p, at, { scale: 0.8, closed: true })],
  [
    l('Vanne à réducteur', 'Gear-operated valve'),
    (p, at) => ballValve(p, [at[0], at[1] + 1.5], { scale: 0.7, op: 'gear' }),
  ],
  [l('Manomètre (PI)', 'Pressure gauge (PI)'), (p, at) => instrument(p, at, 'PI', '')],
  [l('Transmetteur (PT)', 'Transmitter (PT)'), (p, at) => instrument(p, at, 'PT', '')],
  [l('Ventouse automatique', 'Air-release valve'), (p, at) => airValve(p, [at[0], at[1] + 4.5], { scale: 0.75 })],
  [l('Crépine / filtre', 'Strainer / filter'), (p, at) => strainer(p, at)],
  [l('Raccord à compression', 'Compression coupling'), (p, at) => coupling(p, at)],
  [l('Réduction concentrique', 'Concentric reducer'), (p, at) => reducer(p, at)],
  [l('Injecteur à pointeau', 'Spear injector'), (p, at) => nozzle(p, [at[0] + 5.5, at[1]], 'spear', { scale: 0.5 })],
  [l('Lance à inserts', 'Insert lance'), (p, at) => nozzle(p, [at[0] + 4, at[1]], 'quick', { scale: 0.8 })],
  [l('Roue Pelton', 'Pelton runner'), (p, at) => pelton(p, at, 4.4, INK, 12)],
  [
    l('Sens d’écoulement', 'Flow direction'),
    (p, at) => {
      p.line([at[0] - 4, at[1]], [at[0] + 4, at[1]], LINE);
      flowArrow(p, at);
    },
  ],
  [
    l('Signal 4–20 mA', '4–20 mA signal'),
    (p, at) => p.line([at[0] - 4, at[1]], [at[0] + 4, at[1]], { w: W.thin, color: COLORS.signal, dash: [1.6, 0.8] }),
  ],
];

function legend(p: View, x: number, y: number): void {
  p.text([x, y], l('SYMBOLES (ISO 10628 / ISA S5.1, simplifiés)', 'SYMBOLS (ISO 10628 / ISA S5.1, simplified)'), {
    size: 2.3,
    weight: 'bold',
  });
  LEGEND.forEach(([label, draw], i) => {
    const cx = x + (i % 7) * 34;
    const cy = y + 8 + Math.floor(i / 7) * 12;
    draw(p, [cx + 5, cy]);
    para(p, cx + 12, cy - 0.8, 21, label, 1.6);
  });
  para(
    p,
    x,
    y + 31,
    236,
    l(
      'Lignes : L-01 PEHD PE100 SDR17 Ø63 PN10 (Øi 55) · L-02 PVC-U Ø63 PN16 · L-03/L-04 PVC-U Ø50 × 3,7 PN16 collé (décapant + colle pression). Repères V = vanne, N = injecteur, PI/PT = instruments (ISA).',
      'Lines: L-01 PE100 SDR17 HDPE Ø63 PN10 (ID 55) · L-02 PVC-U Ø63 PN16 · L-03/L-04 PVC-U Ø50 × 3.7 PN16 solvent-welded (primer + pressure cement). Tags V = valve, N = injector, PI/PT = instruments (ISA).',
    ),
    1.7,
    INK_2,
  );
}

function makerBox(p: View, x: number, y: number, w: number): void {
  p.text([x, y], l('DONNÉES CONSTRUCTEUR HYDRONOME (site officiel)', 'HYDRONOME MAKER DATA (official site)'), {
    size: 2.1,
    weight: 'bold',
    color: INK_2,
  });
  para(
    p,
    x,
    y + 3.8,
    w,
    l(
      'Ordre de montage 2 injecteurs : vanne principale → manomètre (toujours entre la vanne principale et les vannes d’injecteur) → dérivation vers le bas avec sa vanne (purge de la conduite sans passer par la turbine) → vannes d’injecteur. Turbine ≥ 50 cm au-dessus du sol ; buse Ø14 maxi ; chute 15–130 m ; débit 1–40 L/s ; 5 kW nominal. Un injecteur variable exige une bonne filtration à la prise, sinon le sable le grippe et l’use vite.',
      'Two-injector piping order: main valve → pressure gauge (always between the main valve and the injector valves) → downward bypass with its own valve (flushes the penstock without going through the turbine) → injector valves. Turbine ≥ 50 cm above the ground; Ø14 nozzle max; head 15–130 m; flow 1–40 L/s; 5 kW nominal. A variable injector needs good filtration at the intake, otherwise sand jams it and wears it early.',
    ),
    1.7,
  );
}

export const hydraulicDiagram: DrawingSheet = {
  id: 'hydraulic-diagram',
  number: 'PL-H01',
  group: 'hydraulic',
  title: l('Schéma hydraulique', 'Hydraulic diagram'),
  description: l(
    'Schéma de principe de type P&ID, sans échelle : l’eau part de la prise Coanda, descend la conduite PEHD Ø63, traverse la vanne principale, le té du manomètre et la dérivation, puis se partage entre l’injecteur à pointeau du haut (vanne rouge) et la lance latérale à inserts (vanne bleue). Chaque organe porte un repère (V-01, PI-01…) et le tableau donne pressions, débits, vitesse du jet et puissances calculés par le simulateur pour les sites A et B. Le déflecteur de sécurité DF-01 apparaît en violet.',
    'P&ID-style schematic, not to scale: water leaves the Coanda intake, runs down the Ø63 HDPE penstock, through the main valve, the gauge tee and the bypass, then splits between the top spear injector (red valve) and the side insert lance (blue valve). Every item carries a tag (V-01, PI-01…) and the table gives pressures, flows, jet velocity and powers computed by the simulator for sites A and B. The DF-01 safety deflector is shown in purple.',
  ),
  scene: 'turbine',
  parts: [
    'penstock-end',
    'valve-main',
    'gauge',
    'manifold',
    'valve-bypass',
    'valve-branch',
    'injector-top',
    'air-valve',
  ],
  render(): Drawing {
    const d = new Drawing();
    d.frame({
      title: l('Schéma hydraulique', 'Hydraulic diagram'),
      subtitle: l(
        'Prise Coanda → conduite → nourrice → injecteurs → canal de fuite',
        'Coanda intake → penstock → manifold → injectors → tailrace',
      ),
      number: 'PL-H01',
      scale: '—',
    });
    const p = d.paper();
    intake(p);
    penstock(p);
    manifold(p);
    machine(p);
    valueTable(d, 14, 177);
    legend(p, 170, 177);
    makerBox(p, 16, 128, 122);
    const { a6, a8 } = hydro();
    const items = [
      cat(
        l(
          'Manœuvrer V-01 lentement : l’onde fait l’aller-retour en 2L/a ≈ ',
          'Operate V-01 slowly: the pressure wave travels back and forth in 2L/a ≈ ',
        ),
        nf(a6.twoLa, 0),
        ' s (',
        nf(a6.len, 0),
        ' m, a ≈ ',
        nf(WAVE_SPEED_HDPE, 0),
        l(' m/s). Plus rapide, la fermeture ajoute +', ' m/s). Any faster closure adds +'),
        nf(a6.surgeBar, 1),
        l(' à +', ' to +'),
        nf(a8.surgeBar, 1),
        l(
          ` bar à la pression statique. Vanne à réducteur : fermeture en ${CLOSE_S} s au moins.`,
          ` bar to the static pressure. Gear-operated valve: at least ${CLOSE_S} s to close.`,
        ),
      ),
      l(
        'Mise en eau : vannes d’injecteur fermées, V-02 ouverte pour chasser l’air et le sable, puis fermer V-02 et ouvrir V-01 progressivement ; purger l’air au point haut du col de cygne (AV-01).',
        'Filling: injector valves closed, V-02 open to flush air and sand, then close V-02 and open V-01 gradually; bleed the air at the gooseneck high point (AV-01).',
      ),
      cat(
        l('Conduite PN10 pour ', 'PN10 penstock for '),
        nf(a6.staticBar, 1),
        l(' bar statiques (site A) : ', ' bar static (site A): only '),
        nf(10 - a6.staticBar, 1),
        l(
          ' bar de marge seulement, donc jamais de fermeture brusque. Nourrice, vannes et raccords PN16, collages au décapant + colle « pression ».',
          ' bar of margin, so never close abruptly. Manifold, valves and fittings PN16, joints with primer + pressure cement.',
        ),
      ),
      l(
        'Régler le débit au pointeau ou en changeant de buse, jamais avec une vanne entrouverte (V-03/V-04 tout ouvert ou tout fermé).',
        'Set the flow with the spear or by changing the nozzle, never with a half-open valve (V-03/V-04 fully open or fully closed).',
      ),
      l(
        'Garder un débordement permanent à la prise (pas d’air dans la conduite) ; purger le dessableur V-10 à chaque visite : le sable use la pointe du pointeau et les augets.',
        'Keep a permanent overflow at the intake (no air in the penstock); flush the sand trap V-10 at every visit: sand wears the spear tip and the buckets.',
      ),
    ];
    notes(p, 170, 219, 236, l('NOTES', 'NOTES'), items.slice(0, 2), 1.8);
    notes(p, 14, 244, 214, null, items.slice(2), 1.8, 3);
    return d;
  },
};
