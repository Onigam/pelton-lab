// PL-E01 — single-line diagram of the whole installation: turbine, DC protection, hydro
// controller variants, 48 V busbar, PV, battery bank, diversion load, inverter and AC board.
// Ratings follow the currents of the project model (≈ 10 A turbine, 100 A PV charger,
// 3 kVA inverter); cable sections are labelled on every link.
import { l, tr, type L } from '../../i18n';
import { cableResistance } from '../../sim/physics';
import { COLORS, Drawing, INK, INK_2, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import {
  acWire,
  arrowHead,
  battery,
  coil,
  connector,
  contact,
  converter,
  dcWire,
  dot,
  earth,
  enclosure,
  fuse,
  generator,
  grid,
  iecLegend,
  para,
  peWire,
  phaseWire,
  pvArray,
  resistor,
  sensor,
  shunt,
  sigWire,
  spd,
  tag,
} from './elec-symbols';

const Y = 36; // main turbine line
const BUS = { x0: 150, x1: 396, y0: 107.5, y1: 110.5 };
const V2C = COLORS.v2;
const fr = (v: number, d: number) => v.toFixed(d).replace('.', ',');
const both = (f: (n: (v: number, d: number) => string) => string): L =>
  l(
    f(fr),
    f((v, d) => v.toFixed(d)),
  );

/** Small label (cap height 1.8 mm), anchored at its left / centre / right. */
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

function variantMark(p: View, at: Pt, letter: string): void {
  p.circle(at, 2.3, { w: W.thin, fill: COLORS.paper });
  p.text(at, letter, { size: 2, anchor: 'middle', baseline: 'middle', weight: 'bold' });
}

// ------------------------------------------------------------------ turbine side

function turbineSide(p: View, v2: boolean): void {
  enclosure(p, [14, 17], [58, 68], l('TURBINE', 'TURBINE'));
  phaseWire(p, [
    [28, Y],
    [35.5, Y],
  ]);
  dcWire(p, [
    [45.5, Y],
    [235.5, Y],
  ]); // turbine -> DC box -> TriStar (symbols mask it)
  generator(p, [23, Y], 5);
  converter(p, [40.5, Y], 10, '~', '=');
  connector(p, [52, Y], 0, v2 ? V2C : INK);
  lab(p, [16, 46.5], l('G1 alternateur PMA 3~', 'G1 PM alternator 3~'));
  lab(p, [16, 50], l('U1 pont 3~ 90 A / 1 600 V', 'U1 3~ bridge 90 A / 1,600 V'));
  lab(
    p,
    [16, 53.5],
    v2 ? l('X2 connecteur IP68 détrompé', 'X2 keyed IP68 connector') : l('X2 connecteurs MC4', 'X2 MC4 connectors'),
    { c: v2 ? V2C : INK },
  );
  lab(p, [16, 57], l('50–57 V · 10 A (18 A à 950 W)', '50–57 V · 10 A (18 A at 950 W)'), { c: INK_2 });
  earth(p, [52.5, 59.5], true);
  lab(p, [31, 31.5], 'U V W', { a: 'middle', c: INK_2 });

  if (!v2) {
    para(
      p,
      64,
      44,
      l(
        'V1 (prototype) : aucune protection côté turbine, la sécurité repose entièrement sur le délesteur.',
        'V1 (prototype): no protection at the turbine, safety relies entirely on the dump load.',
      ),
      56,
      { size: 1.8, color: INK_2, italic: true },
    );
    return;
  }
  // V2 controller box on the skid
  enclosure(p, [62, 17], [124, 102], l('A1 COFFRET CONTRÔLEUR V2 · IP65', 'A1 V2 CONTROLLER BOX · IP65'), V2C, 1.8);
  contact(p, [70, Y], 0, 'breaker', V2C);
  lab(p, [70, 30], 'Q1 2P 32 A', { a: 'middle', c: V2C });
  spd(p, [79, Y], V2C);
  lab(p, [81.8, 41.7], 'F1 SPD', { c: V2C });
  p.line([95, Y], [95, 48.2], { w: W.thin, color: V2C });
  dot(p, [95, Y], V2C, 0.8);
  coil(p, [95, 50], 'U>', V2C);
  lab(p, [99.5, 50], l('K1 66 V', 'K1 66 V'), { c: V2C });
  sigWire(
    p,
    [
      [95, 51.8],
      [95, 61.2],
    ],
    V2C,
  );
  coil(p, [95, 63], '', V2C);
  lab(p, [99.5, 61.4], l('Y1 gâche 12 V', 'Y1 12 V latch'), { c: V2C });
  lab(p, [99.5, 64.9], l('→ déflecteur', '→ deflector'), { c: V2C });
  // sensors -> ESP32 -> GX
  const sens: [number, string, number][] = [
    [70, 'n', 78],
    [78, 'θ', 82],
    [86, 'p', 86],
  ];
  for (const [x, letter, y] of sens) {
    sigWire(
      p,
      [
        [x, 89.6],
        [x, y],
        [100, y],
      ],
      V2C,
    );
    sensor(p, [x, 92], letter, V2C);
  }
  p.rect([100, 75], [114, 89], { w: W.medium, color: V2C, fill: COLORS.paper });
  lab(p, [107, 79.5], 'A2', { a: 'middle', c: V2C, b: true });
  lab(p, [107, 84], 'ESP32', { a: 'middle', c: V2C });
  sigWire(
    p,
    [
      [114, 82],
      [115.5, 82],
    ],
    V2C,
  );
  tag(p, [115.5, 82], 'S1', 'right', V2C);
  lab(p, [66, 97.6], l('B1 Hall · B2 CTN · B3 4–20 mA', 'B1 Hall · B2 NTC · B3 4–20 mA'), { c: V2C });
  lab(p, [107, 92], 'MQTT · VE.Can', { a: 'middle', c: V2C });
}

// ------------------------------------------------------------------ cable, DC box, controller

function cableAndProtection(p: View): void {
  // cable break symbol
  p.rect([148.4, 33.4], [151.8, 38.6], { w: 0, color: COLORS.paper, fill: COLORS.paper });
  p.line([148.2, 38.8], [149.8, 33.2], { w: W.thin });
  p.line([150.2, 38.8], [151.8, 33.2], { w: W.thin });
  lab(p, [150, 30.5], l('W1 · 2 × 6 mm² H1Z2Z2-K', 'W1 · 2 × 6 mm² H1Z2Z2-K'), { a: 'middle', b: true });
  lab(p, [150, 41], l('A : 70 m · ΔU ≈ 4,1 V', 'A: 70 m · ΔU ≈ 4.1 V'), { a: 'middle' });
  lab(p, [150, 44.5], l('B : 15 m · ΔU ≈ 0,9 V', 'B: 15 m · ΔU ≈ 0.9 V'), { a: 'middle' });
  lab(p, [150, 48], l('(à 10 A, voir tableau)', '(at 10 A, see table)'), { a: 'middle', c: INK_2 });

  // site boundary
  p.line([171, 12], [171, 102], { w: W.thin, dash: 'center', color: INK_2 });
  lab(p, [16, 13.6], l('CÔTÉ TURBINE (ruisseau)', 'TURBINE SIDE (stream)'), { c: INK_2, b: true });
  lab(p, [174, 13.6], l('LOCAL TECHNIQUE', 'TECHNICAL ROOM'), { c: INK_2, b: true });

  enclosure(p, [178, 17], [222, 68], l('COFFRET DE PROTECTION DC', 'DC PROTECTION BOX'), INK_2, 1.8);
  contact(p, [186, Y], 0, 'switch-disconnector');
  lab(p, [186, 30], 'Q2 2P 32 A', { a: 'middle' });
  fuse(p, [198, Y]);
  lab(p, [197, 40.6], l('F2 2 × gPV 25 A', 'F2 2 × gPV 25 A'), { a: 'middle' });
  spd(p, [212, Y]);
  lab(p, [212, 52], 'F3 SPD T2', { a: 'middle' });

  // variant B: straight onto the bus; variant A: fixed-voltage TriStar
  dcWire(
    p,
    [
      [228, Y],
      [228, BUS.y0],
    ],
    { dash: true },
  );
  dot(p, [228, Y], INK, 0.9);
  variantMark(p, [223.4, 80], 'B');
  dcWire(p, [
    [248.5, Y],
    [262, Y],
    [262, BUS.y0],
  ]);
  converter(p, [242, Y], 13, '=', '=');
  lab(p, [242, 27.4], 'U2 TS-MPPT-45', { a: 'middle', b: true });
  lab(p, [233, 45.2], l('entrée fixe ≈ 57 V', 'fixed input ≈ 57 V'));
  variantMark(p, [267.5, 55], 'A');
  lab(p, [265.6, 70], '2 × 16 mm²');
  fuse(p, [262, 88], -90);
  lab(p, [265.6, 88], 'F4 60 A');
}

function variantsNote(p: View): void {
  const x = 282;
  const w = 75;
  lab(p, [x, 20.5], l('VARIANTES DE RACCORDEMENT', 'TURBINE CONNECTION VARIANTS'), { b: true, s: 1.9 });
  const items: [string, L][] = [
    [
      'A',
      l(
        'Site A : TriStar TS-MPPT-45 en tension d’entrée fixe (≈ 57 V) → vitesse constante ≈ 1 500 tr/min. Un MPPT classique fait « pomper » la vitesse.',
        'Site A: TriStar TS-MPPT-45 in fixed input-voltage mode (≈ 57 V) → constant speed ≈ 1,500 rpm. A plain MPPT makes the speed hunt.',
      ),
    ],
    [
      'B',
      l(
        'Site B : turbine 48 V directement sur le bus. Liaison courte (15 m, ΔU ≈ 1 V), pas de régulateur (≈ 500 € économisés) ; F2 protège le câble.',
        'Site B: 48 V turbine straight onto the bus. Short run (15 m, ΔU ≈ 1 V), no controller (≈ 500 € saved); F2 protects the cable.',
      ),
    ],
    [
      'C',
      l(
        'Données constructeur Hydronome (site officiel) : pont 90 A, sortie MC4 → TS-MPPT-45 ou direct → bus 12/24/48 V ; délesteur TS-45 PWM 45 A → 3 résistances. Toute turbine sur batteries tourne 24 h/24 : délesteur obligatoire.',
        'Hydronome maker data (official site): 90 A bridge, MC4 output → TS-MPPT-45 or direct → 12/24/48 V bus; TS-45 PWM 45 A diversion → 3 resistors. A turbine on batteries runs 24/7: a dump load is mandatory.',
      ),
    ],
    [
      'HT',
      l(
        'Liaison longue : générateur 150–250 V et régulateur à entrée ≥ 250 V (le TS-MPPT-45 est limité à 150 V Voc).',
        'Long run: 150–250 V generator and a controller rated ≥ 250 V input (the TS-MPPT-45 is limited to 150 V Voc).',
      ),
    ],
  ];
  let y = 25;
  for (const [k, t] of items) {
    p.text([x, y], k, { size: 1.9, weight: 'bold', baseline: 'top' });
    y += para(p, x + 6, y, t, w - 7, { size: 1.9, lineH: 3 }) + 1.8;
  }
  p.rect([x - 2, 17], [x + w, y + 0.6], { w: W.thin });
}

// ------------------------------------------------------------------ PV + busbar

function pvChain(p: View): void {
  const x = 372;
  dcWire(p, [
    [x, 30],
    [x, 63.5],
  ]);
  dcWire(p, [
    [x, 76.5],
    [x, BUS.y0],
  ]);
  pvArray(p, [x, 25], 22, 10);
  lab(p, [385, 21], l('PV 4,5 kWc', 'PV 4.5 kWp'), { b: true });
  lab(p, [385, 24.6], '2 × 5 × 450 Wc');
  lab(p, [385, 28.2], 'Voc ≈ 200 V');
  contact(p, [x, 40], -90, 'switch-disconnector');
  lab(p, [377, 40], 'Q3 2P 32 A');
  fuse(p, [x, 50], -90);
  lab(p, [377, 50], 'F5 gPV 20 A');
  lab(p, [377, 57], '2 × 6 mm²');
  converter(p, [x, 70], 13, '=', '=');
  lab(p, [380.5, 66.6], 'U3 SmartSolar', { b: true });
  lab(p, [380.5, 70.1], 'MPPT 250/100');
  lab(p, [380.5, 73.6], 'VE.Can');
  sigWire(p, [
    [365.5, 74],
    [364.6, 74],
  ]);
  tag(p, [364.6, 74], 'S2', 'left');
  fuse(p, [x, 90], -90);
  lab(p, [377, 88.4], 'F6 125 A');
  lab(p, [377, 91.9], '2 × 35 mm²');
}

function busbar(p: View): void {
  p.rect([BUS.x0, BUS.y0], [BUS.x1, BUS.y1], { w: 0, color: '#f2dcc8', fill: '#f2dcc8' });
  p.line([BUS.x0, BUS.y0], [BUS.x1, BUS.y0], { w: 0.6, color: COLORS.dcPos });
  p.line([BUS.x0, BUS.y1], [BUS.x1, BUS.y1], { w: 0.6, color: COLORS.dcNeg });
  lab(p, [BUS.x0 + 1, 104.6], l('JEU DE BARRES 48 V DC (+ / −) · 250 A', '48 V DC BUSBAR (+ / −) · 250 A'), {
    b: true,
    s: 1.9,
  });
  for (const x of [228, 262, 372]) dot(p, [x, BUS.y0], INK, 0.9);
  for (const x of [175, 225, 290]) dot(p, [x, BUS.y1], INK, 0.9);
  // single DC−/PE bond at the negative bar
  peWire(p, [
    [156, BUS.y1],
    [156, 114],
  ]);
  earth(p, [156, 114]);
  lab(p, [156, 120.2], 'DC− / PE', { a: 'middle' });
}

// ------------------------------------------------------------------ loads side

function batteryBank(p: View): void {
  dcWire(p, [
    [175, BUS.y1],
    [175, 152],
  ]);
  dcWire(p, [
    [158, 152],
    [188, 152],
  ]);
  const xs = [158, 168, 178, 188];
  for (const x of xs)
    dcWire(p, [
      [x, 152],
      [x, 155],
    ]);
  fuse(p, [175, 117.5], -90);
  lab(p, [179.5, 117.5], 'F7 MEGA 125 A');
  contact(p, [175, 126.5], -90, 'switch-disconnector');
  lab(p, [179.5, 126.5], l('Q4 coupe-batterie', 'Q4 battery switch'));
  shunt(p, [175, 135.5], -90);
  lab(p, [179.5, 135.5], l('P1 shunt (sur le −)', 'P1 shunt (on −)'));
  lab(p, [179.5, 142], '2 × 35 mm²');
  enclosure(p, [148, 146], [201, 192], l('G2 BATTERIES', 'G2 BATTERIES'));
  for (const x of xs) battery(p, [x, 155]);
  for (const x of [...xs, 175]) dot(p, [x, 152], INK, 0.9);
  sigWire(p, [
    [154, 168.5],
    [192, 168.5],
  ]);
  tag(p, [192, 168.5], 'S3', 'right');
  lab(p, [154, 171.2], 'CAN BMS', { c: COLORS.signal });
  lab(p, [150, 175.5], '4 × Pylontech US2000C (48 V, 50 Ah)');
  lab(p, [150, 179], l('9,6 kWh · 4 × 25 A conseillés', '9.6 kWh · 4 × 25 A recommended'));
  lab(p, [150, 182.5], l('DVCC : charge limitée à 100 A', 'DVCC: charge limited to 100 A'));
}

function diversion(p: View): void {
  dcWire(p, [
    [225, BUS.y1],
    [225, 126],
  ]);
  dcWire(p, [
    [225, 136],
    [225, 141.5],
  ]);
  dcWire(p, [
    [219, 149],
    [219, 161],
  ]);
  dcWire(p, [
    [219, 156],
    [209, 156],
    [209, 161],
  ]);
  dcWire(
    p,
    [
      [231, 149],
      [231, 152],
      [238, 152],
      [238, 161],
    ],
    { dash: true },
  );
  fuse(p, [225, 117.5], -90);
  lab(p, [229.5, 117.5], 'F8 60 A · 2 × 16 mm²');
  p.rect([219, 126], [231, 136], { w: W.medium, fill: COLORS.paper });
  lab(p, [225, 131], 'PWM', { a: 'middle', b: true });
  lab(p, [233.5, 128.6], l('U4 délesteur', 'U4 diversion'), { b: true });
  lab(p, [233.5, 132.1], l('seuil ≈ 53,5 V', 'set ≈ 53.5 V'));
  // KM1 changeover: air resistors (rest position) / water heater (option)
  p.rect([216.5, 141.5], [233.5, 149.5], { w: 0, color: COLORS.paper, fill: COLORS.paper });
  p.line([225, 141.5], [225, 143.5], { w: W.medium });
  p.line([225, 143.5], [220.4, 147.5], { w: W.medium });
  p.polyline(
    [
      [219, 149],
      [219, 147.6],
      [220.8, 147.6],
    ],
    { w: W.medium },
  );
  p.polyline(
    [
      [231, 149],
      [231, 147.6],
      [229.2, 147.6],
    ],
    { w: W.medium },
  );
  lab(p, [227.2, 143.4], 'KM1');
  resistor(p, [209, 161], -90);
  resistor(p, [219, 161], -90);
  resistor(p, [238, 161], -90, INK_2);
  dot(p, [219, 156], INK, 0.9);
  lab(p, [203.5, 170.5], l('R1–R2 : 2 × 1 kW (air)', 'R1–R2: 2 × 1 kW (air)'), { b: true });
  lab(p, [203.5, 174], l('2,9 Ω · silicone 2 × 10 mm²', '2.9 Ω · silicone 2 × 10 mm²'));
  lab(p, [242, 159.5], l('E1 eau chaude', 'E1 hot water'), { c: INK_2 });
  lab(p, [242, 163], l('(option)', '(option)'), { c: INK_2 });
}

function inverterAndAc(p: View, v2: boolean): void {
  dcWire(p, [
    [290, BUS.y1],
    [290, 126],
  ]);
  acWire(p, [
    [297, 133],
    [334.8, 133],
  ]);
  fuse(p, [290, 117.5], -90);
  lab(p, [294.5, 115.8], 'F9 MEGA 125 A');
  lab(p, [294.5, 119.3], '2 × 35 mm²');
  converter(p, [290, 133], 14, '=', '~');
  lab(p, [281, 129.5], 'U5 MultiPlus-II GX', { a: 'end', b: true });
  lab(p, [281, 133], '48/3000/35-32 · 3 kVA', { a: 'end' });
  lab(p, [281, 136.5], l('2 400 W en continu', '2,400 W continuous'), { a: 'end' });
  sigWire(p, [
    [290, 140],
    [290, 145],
  ]);
  p.rect([283, 145], [297, 159], { w: W.medium, fill: COLORS.paper });
  lab(p, [290, 152], 'GX', { a: 'middle', b: true, s: 2.2 });
  lab(p, [281, 152], l('A3 GX → VRM', 'A3 GX → VRM'), { a: 'end' });
  const tags: [string, string][] = v2
    ? [
        ['S1', V2C],
        ['S2', COLORS.signal],
        ['S3', COLORS.signal],
      ]
    : [
        ['S2', COLORS.signal],
        ['S3', COLORS.signal],
      ];
  tags.forEach(([t, c], i) => tag(p, [305, 148 + i * 4], t, 'left', c));
  lab(p, [305.5, 130.6], '3G6');

  enclosure(p, [314, 117], [405, 196], l('TABLEAU AC 230 V (TT)', 'AC BOARD 230 V (TT)'));
  contact(p, [324, 133], 0, 'rcd');
  lab(p, [324, 138.6], 'Q5 ID 40 A', { a: 'middle' });
  lab(p, [324, 142.1], l('30 mA type A', '30 mA type A'), { a: 'middle' });
  const circuits: [number, string, L][] = [
    [127, 'Q6 C10 · 3G1,5', l('éclairage', 'lighting')],
    [145, 'Q7 C20 · 3G2,5', l('prises', 'sockets')],
    [163, 'Q8 C20 · 3G2,5', l('cuisine', 'kitchen')],
    [181, 'Q9 C20 · 3G2,5', l('congélateur', 'freezer')],
  ];
  for (const [y] of circuits)
    acWire(p, [
      [337.2, y],
      [361, y],
    ]);
  p.rect([334.8, 124], [337.2, 184], { w: W.thin, fill: '#f3e9df' });
  for (const [y, name, use] of circuits) {
    contact(p, [347, y], 0, 'breaker');
    arrowHead(p, [364, y], 0, INK, 2);
    lab(p, [366, y - 1.8], name);
    lab(p, [366, y + 1.8], use, { c: INK_2 });
  }
  peWire(
    p,
    [
      [318, 176],
      [330, 176],
    ],
    0.6,
  );
  peWire(p, [
    [324, 176],
    [324, 179.5],
  ]);
  earth(p, [324, 179.5]);
  lab(p, [316, 187.5], l('Barrette de terre', 'Main earth bar'));
  lab(p, [316, 191], l('piquet R ≤ 100 Ω', 'rod R ≤ 100 Ω'));
}

// ------------------------------------------------------------------ legend, notes, tables

function gridTieInset(p: View): void {
  enclosure(p, [12, 205], [108, 263], l('VARIANTE RÉSEAU SANS BATTERIE', 'GRID-TIE VARIANT, NO BATTERY'));
  // sizing rules used for every rating of the sheet
  p.rect([12, 266], [108, 285], { w: W.thin });
  lab(p, [14, 268.8], l('RÈGLES DE DIMENSIONNEMENT', 'SIZING RULES'), { b: true, s: 1.9 });
  const rules: Text[] = [
    'I = P / U      R = ρ · 2L / S',
    l('ΔU = R · I     pertes = R · I²', 'ΔU = R · I     losses = R · I²'),
    l('I fusible ≥ 1,25 × I max', 'I fuse ≥ 1.25 × I max'),
    l('I admissible câble ≥ I fusible', 'I cable rating ≥ I fuse'),
  ];
  rules.forEach((t, i) => p.text([15, 272.4 + i * 3.1], t, { size: 1.8, mono: true, baseline: 'middle' }));
  lab(p, [72, 272.4], l('turbine 18 A → 25 A', 'turbine 18 A → 25 A'), { c: INK_2 });
  lab(p, [72, 275.5], l('onduleur 70 A → 125 A', 'inverter 70 A → 125 A'), { c: INK_2 });
  lab(p, [72, 278.6], l('MPPT 100 A → 125 A', 'MPPT 100 A → 125 A'), { c: INK_2 });
  lab(p, [72, 281.7], l('délestage 37 A → 60 A', 'dump load 37 A → 60 A'), { c: INK_2 });
  const y = 224;
  phaseWire(p, [
    [25, y],
    [29, y],
  ]);
  dcWire(p, [
    [39, y],
    [52, y],
  ]);
  acWire(p, [
    [64, y],
    [90, y],
  ]);
  generator(p, [20, y], 5);
  converter(p, [34, y], 10, '~', '=');
  converter(p, [58, y], 12, '=', '~');
  p.rect([71, y - 3.5], [80, y + 3.5], { w: W.medium, fill: COLORS.paper });
  lab(p, [75.5, y], 'kWh', { a: 'middle', b: true });
  arrowHead(p, [93, y], 0, INK, 2);
  lab(p, [94.5, y], l('réseau', 'grid'));
  lab(p, [20, y + 8.5], '150/250 V', { a: 'middle' });
  lab(p, [34, y - 7.5], l('pont', 'bridge'), { a: 'middle' });
  lab(p, [58, y - 8.5], l('onduleur réseau', 'grid inverter'), { a: 'middle' });
  lab(p, [58, y + 8.5], l('entrée 150/250 V Voc', '150/250 V Voc input'), { a: 'middle' });
  lab(p, [58, y + 12], l('(ex. Growatt MIC 1500TL-X)', '(e.g. Growatt MIC 1500TL-X)'), { a: 'middle', c: INK_2 });
  lab(p, [75.5, y - 6], l('compteur', 'meter'), { a: 'middle', c: INK_2 });
  para(
    p,
    15,
    242,
    l(
      'Données constructeur Hydronome (site officiel) : le réseau absorbe toute la production et joue le rôle de délesteur. Attention : sur coupure réseau, l’onduleur se découple et la turbine part à vide → déflecteur (V2) ou délestage local indispensable. Raccordement à déclarer au gestionnaire de réseau.',
      'Hydronome maker data (official site): the grid absorbs all the output and acts as the dump load. Beware: on a grid outage the inverter disconnects and the turbine runs unloaded → a deflector (V2) or a local dump load is essential. The connection must be declared to the grid operator.',
    ),
    90,
    { size: 1.9, lineH: 3 },
  );
}

function notes(p: View): void {
  lab(p, [112, 207.5], l('NOTES', 'NOTES'), { b: true, s: 1.9 });
  const items: L[] = [
    l(
      'Fusibles au plus près de la batterie : c’est elle qui fournit le courant de court-circuit (plusieurs kA). Courant admissible du câble ≥ calibre du fusible.',
      'Fuses as close to the battery as possible: it supplies the short-circuit current (several kA). Cable current rating ≥ fuse rating.',
    ),
    l(
      'Jamais de turbine à vide : à l’emballement (≈ 2 × la vitesse), la tension double (≈ 140 V pour le bobinage 48 V). Seuil de K1 (V2) : 66 V, au-dessus des ≈ 61 V vus côté turbine derrière un TriStar à 57 V et loin des ≈ 140 V d’emballement.',
      'Never run the turbine unloaded: at runaway (≈ 2 × speed) the voltage doubles (≈ 140 V for the 48 V winding). K1 threshold (V2): 66 V, above the ≈ 61 V seen at the turbine behind a TriStar at 57 V and far below the ≈ 140 V at runaway.',
    ),
    l(
      'Schéma TT : le MultiPlus-II relie N et PE en mode onduleur ; toutes les masses (châssis, cadres PV, coffrets) vont à la barrette de terre. DC− mis à la terre en un seul point.',
      'TT earthing: the MultiPlus-II bonds N to PE when inverting; all exposed metal (chassis, PV frames, boxes) goes to the earth bar. DC− earthed at a single point.',
    ),
    l(
      'Option eau chaude (constructeur) : thermoplongeur E1 ; KM1, commandé par le thermostat du ballon, rebascule sur les résistances à air quand l’eau est chaude.',
      'Hot-water option (maker): immersion heater E1; KM1, driven by the tank thermostat, switches back to the air resistors once the water is hot.',
    ),
    l(
      'Câble de liaison (constructeur) : 10 ou 16 mm² selon la distance et la puissance ; 6 mm² possible sur une liaison courte.',
      'Link cable (maker): 10 or 16 mm² depending on distance and power; 6 mm² is possible on a short run.',
    ),
    l(
      'Valeurs indicatives : vérifier les notices Victron, Morningstar, Pylontech, la NF C 15-100 et le guide UTE C 15-712-2.',
      'Indicative values: check the Victron, Morningstar and Pylontech manuals and local wiring rules.',
    ),
  ];
  let y = 211.5;
  items.forEach((t, i) => {
    p.text([112, y], `${i + 1}.`, { size: 1.9, weight: 'bold', baseline: 'top' });
    y += para(p, 116, y, t, 89, { size: 1.9, lineH: 2.95 }) + 1.3;
  });
}

function dropTable(p: View): void {
  const rows: { site: L; len: number; s: number; u: number; p: number; note: L }[] = [
    { site: l('Site B', 'Site B'), len: 15, s: 6, u: 48, p: 500, note: l('≈ 1 V dans la vidéo', '≈ 1 V in the video') },
    {
      site: l('Site A', 'Site A'),
      len: 70,
      s: 6,
      u: 48,
      p: 500,
      note: l('≈ 35 W à 9,4 A (vidéo)', '≈ 35 W at 9.4 A (video)'),
    },
    { site: l('Site A', 'Site A'), len: 70, s: 16, u: 48, p: 500, note: l('section constructeur', 'maker cable size') },
    {
      site: l('Site A, HT', 'Site A, HV'),
      len: 70,
      s: 6,
      u: 200,
      p: 500,
      note: l('générateur 200 V', '200 V generator'),
    },
    { site: l('Longue', 'Long'), len: 400, s: 6, u: 48, p: 500, note: l('la moitié est perdue', 'half is lost') },
    { site: l('Longue', 'Long'), len: 400, s: 16, u: 48, p: 500, note: l('même en 16 mm²', 'even with 16 mm²') },
    {
      site: l('Longue, HT', 'Long, HV'),
      len: 400,
      s: 6,
      u: 200,
      p: 500,
      note: l('choix de la vidéo', 'the video’s choice'),
    },
    {
      site: l('Longue, HT', 'Long, HV'),
      len: 400,
      s: 10,
      u: 200,
      p: 500,
      note: l('section constructeur', 'maker cable size'),
    },
  ];
  const cells = rows.map((r) => {
    const i = r.p / r.u;
    const res = cableResistance(r.len, r.s);
    const du = res * i;
    const pct = (du / r.u) * 100;
    const ok =
      pct <= 3 ? l('✓ ≤ 3 %', '✓ ≤ 3%') : pct <= 10 ? l('acceptable', 'acceptable') : l('✗ à proscrire', '✗ avoid');
    const verdict = l(`${ok.fr} · ${r.note.fr}`, `${ok.en} · ${r.note.en}`);
    const color = pct <= 3 ? COLORS.pe : pct <= 10 ? INK_2 : COLORS.red;
    return [
      r.site,
      `${r.len} m`,
      `${r.s} mm²`,
      `${r.u} V`,
      both((n) => `${n(i, 1)} A`),
      both((n) => `${n(res, res < 1 ? 3 : 2)} Ω`),
      both((n) => `${n(du, 1)} V`),
      both((n) => `${n(i * i * res, i * i * res < 10 ? 1 : 0)} W · ${n(pct, pct < 10 ? 1 : 0)} %`),
      { t: verdict, color, bold: true },
    ];
  });
  lab(
    p,
    [210, 202.5],
    l(
      'CHUTE DE TENSION SUR LE CÂBLE TURBINE — 500 W, cuivre, R = ρ·2L/S (ρ = 0,0175 Ω·mm²/m)',
      'VOLTAGE DROP ON THE TURBINE CABLE — 500 W, copper, R = ρ·2L/S (ρ = 0.0175 Ω·mm²/m)',
    ),
    { b: true, s: 1.9 },
  );
  grid(
    p,
    210,
    205,
    [
      { label: l('Liaison', 'Run'), w: 22 },
      { label: 'L', w: 13, align: 'end', mono: true },
      { label: 'S', w: 17, align: 'end', mono: true },
      { label: 'U', w: 14, align: 'end', mono: true },
      { label: 'I', w: 16, align: 'end', mono: true },
      { label: l('R boucle', 'Loop R'), w: 19, align: 'end', mono: true },
      { label: 'ΔU', w: 17, align: 'end', mono: true },
      { label: l('Pertes', 'Losses'), w: 24, align: 'end', mono: true },
      { label: l('Verdict', 'Verdict'), w: 56 },
    ],
    cells,
    { size: 1.8, pad: 0.75, lineH: 2.75 },
  );
}

export const singleLine: DrawingSheet = {
  id: 'single-line',
  number: 'PL-E01',
  group: 'electrical',
  title: l('Schéma unifilaire de l’installation', 'Installation single-line diagram'),
  description: l(
    'Schéma unifilaire de toute la chaîne : turbine et son pont redresseur, câble, coffret de protection DC, régulateur hydro (site A) ou liaison directe (site B), jeu de barres 48 V, champ PV, batteries, délesteur, onduleur et tableau AC. Chaque liaison porte sa section et chaque protection son calibre ; les couleurs suivent les conducteurs (DC + rouge / − noir, AC marron / bleu / vert-jaune). Le tableau en bas à droite montre pourquoi on monte la tension ou la section sur les longues liaisons. En V2, le coffret contrôleur (violet) ajoute disjoncteur, parafoudre, relais de surtension et télémesure côté turbine.',
    'Single-line diagram of the whole chain: turbine and its rectifier, cable, DC protection box, hydro controller (site A) or direct link (site B), 48 V busbar, PV array, batteries, dump load, inverter and AC board. Every link shows its cable size and every protection its rating; colours follow the conductors (DC + red / − black, AC brown / blue / green-yellow). The table at the bottom right shows why long runs need a higher voltage or a bigger cable. In V2 the controller box (purple) adds a breaker, surge arrester, overvoltage relay and telemetry at the turbine.',
  ),
  scene: 'techroom',
  parts: [
    'dc-protect',
    'hydro-ctrl',
    'busbar',
    'battery',
    'diversion',
    'dump-load',
    'inverter',
    'mppt-pv',
    'ac-panel',
    'gx-display',
    'wiring',
  ],
  render(ctx) {
    const v2 = ctx.version === 'v2';
    const d = new Drawing();
    d.frame({
      title: l('Schéma unifilaire de l’installation', 'Installation single-line diagram'),
      subtitle: l(
        `Hydro + PV, bus 48 V DC · ${v2 ? 'V2 industrialisée' : 'V1 prototype'} · Sans échelle`,
        `Hydro + PV, 48 V DC bus · ${v2 ? 'V2 industrialised' : 'V1 prototype'} · Not to scale`,
      ),
      number: 'PL-E01',
      scale: tr(l('SO', 'NTS')),
    });
    const p = d.paper();
    turbineSide(p, v2);
    cableAndProtection(p);
    variantsNote(p);
    pvChain(p);
    busbar(p);
    batteryBank(p);
    diversion(p);
    inverterAndAc(p, v2);
    iecLegend(p, 12, 104);
    gridTieInset(p);
    notes(p);
    dropTable(p);
    return d;
  },
};
