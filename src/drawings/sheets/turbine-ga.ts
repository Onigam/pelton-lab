import { l, tr } from '../../i18n';
import { presetParams } from '../../sim/presets';
import { COLORS, Drawing, W, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import { hydro, nf } from './hyd-symbols';
import { installation, topView } from './turbine-ga-views';
import {
  BASE,
  BELL,
  CX,
  DEFLECTORS,
  DRAIN_MM,
  insetProfile,
  M,
  note,
  PIPE,
  pipe,
  pipeBreak,
  PROFILE,
  R_TIP_MM,
  rot,
  RUNNER,
  SHAFT,
  SIDE,
  silhouette,
  SKID_MM,
  spec,
  SPEAR,
  STATOR,
  tipR,
} from './turbine-geom';

// PL-T01 — general arrangement. Every dimension comes from the 3D model (src/three/turbine,
// through turbine-geom.ts), in mm. Machine origin: underside of the base plate on the shaft
// axis line; +Z = window side.

const PAPER = COLORS.paper;
const AX = M.axisY;
const thin = (fill = PAPER): Stroke => ({ w: W.thin, fill });
const med = (fill = PAPER): Stroke => ({ w: W.medium, fill });
const deg = Math.PI / 180;
const tip = (p: Pt, len: number, a: number): Pt => [p[0] + len * Math.cos(a * deg), p[1] + len * Math.sin(a * deg)];

/** Runner seen along the shaft: L buckets with their stems, clamp ring, flange, nut. */
function runnerFace(v: View): void {
  const L = spec('L');
  const stemTop = L.rc - 0.35 * L.a;
  for (let i = 0; i < M.buckets; i++) {
    const a = (i / M.buckets) * Math.PI * 2;
    const at = (p: Pt): Pt => {
      const [x, y] = rot(p, a);
      return [x, AX + y];
    };
    const stem: Pt[] = [
      [RUNNER.ring[1] - 1, 0.045 * L.depth],
      [stemTop, 0.045 * L.depth],
      [stemTop, 1.195 * L.depth],
      [RUNNER.ring[1] - 1, 1.195 * L.depth],
    ];
    v.polyline(stem.map(at), { closed: true, ...thin() });
    v.polyline(silhouette(L, 14).map(at), { closed: true, ...thin() });
  }
  v.circle([0, AX], RUNNER.ring[1], thin());
  v.circle([0, AX], RUNNER.ring[0], { w: W.thin });
  v.circle([0, AX], RUNNER.flangeR, thin());
  v.circle([0, AX], 14.5, { w: W.thin });
  v.circle([0, AX], M.rPitch, { w: W.thin, dash: 'center', color: COLORS.muted });
}

/** Side injector seen from the front (V1 printed nozzle / V2 alu lance with bayonet insert). */
function sideInjector(v: View, v2: boolean): void {
  const y = SIDE.y;
  const s = v2 ? SIDE.v2 : SIDE.v1;
  const fx0 = SIDE.flangeX - s.flangeL / 2;
  const fx1 = SIDE.flangeX + s.flangeL / 2;
  if (v2) {
    const [r, c0, c1] = SIDE.v2.collar;
    v.rect([c0, y - r], [c1, y + r], med());
    for (const k of [-1, 1]) {
      v.line([c0, y + (k * r) / 2], [c1, y + (k * r) / 2], { w: W.thin });
      v.rect([-465, y + k * 44], [-445, y + k * 56], thin());
    }
  } else {
    for (const k of [-1, 1]) v.rect([fx0 - 8, y + k * 30 - 4], [fx0, y + k * 30 + 4], thin());
  }
  v.rect([fx0, y - s.flangeR], [fx1, y + s.flangeR], med());
  v.polyline(
    [
      [fx1, y + s.r0],
      [SIDE.tip, y + s.r1],
      [SIDE.tip, y - s.r1],
      [fx1, y - s.r0],
    ],
    { closed: true, ...med() },
  );
  const [rr, rl] = s.ring;
  v.rect([SIDE.tip - rl, y - rr], [SIDE.tip, y + rr], { w: W.medium, fill: v2 ? '#2f9e44' : '#6b7178', opacity: 0.7 });
  v.rect([M.x0 - 8, y - s.plate / 2], [M.x0, y + s.plate / 2], med());
}

/** Front view (from the window side): housing, runner through the PMMA, injectors, jets. */
function frontView(v: View, v2: boolean, dTop: number, dSide: number): void {
  const x = SPEAR.x;
  v.rect([BASE.x0, 0], [BASE.x1, M.baseT], { w: W.thick, fill: PAPER });
  runnerFace(v);
  // top spear injector inside: cone, stainless tip, jet down to the tangent point
  v.polyline(
    [
      [x - SPEAR.bodyR, SPEAR.bodyBot],
      [x - SPEAR.coneR, SPEAR.tip + 6],
      [x + SPEAR.coneR, SPEAR.tip + 6],
      [x + SPEAR.bodyR, SPEAR.bodyBot],
    ],
    { w: W.medium },
  );
  v.rect([x - SPEAR.tipR, SPEAR.tip], [x + SPEAR.tipR, SPEAR.tip + 8], med());
  v.rect([x - dTop / 2, AX], [x + dTop / 2, SPEAR.tip], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  sideInjector(v, v2);
  v.rect([SIDE.tip, SIDE.y - dSide / 2], [0, SIDE.y + dSide / 2], {
    w: W.thin,
    color: COLORS.water,
    fill: COLORS.waterFill,
  });
  if (v2) {
    // fail-safe deflector blades (at rest) and toggle latches
    for (const dfl of DEFLECTORS) {
      v.line(dfl.pivot, tip(dfl.pivot, dfl.len, dfl.rest), { w: W.thick, color: COLORS.v2 });
      v.circle(dfl.pivot, 5, { w: W.thin, fill: PAPER, color: COLORS.v2 });
    }
    for (const [s, wx, y] of [
      [-1, M.x0 - 6, 70],
      [1, M.x1 + 6, 42],
    ]) {
      v.rect([wx - 3, y - 20], [wx + 3, y + 20], thin());
      v.rect([wx + s * 4 - 4, y - 56], [wx + s * 4 + 4, y - 44], thin());
    }
  }
  // housing: wedge profile + folded return lips framing the window
  v.polyline(PROFILE, { closed: true, w: W.thick });
  v.polyline(insetProfile(M.lip, true), { closed: true, w: W.thin });
  // top injector above the roof: flange, body, gland, spindle, handwheel, side inlet
  const f = SPEAR.flange;
  v.rect([x - f.half, f.y0], [x + f.half, f.y1], med());
  v.rect([x - SPEAR.bodyR, SPEAR.bodyBot], [x + SPEAR.bodyR, SPEAR.bodyTop], med());
  const g1 = SPEAR.bodyTop + SPEAR.glandH;
  v.rect([x - 20, SPEAR.bodyTop], [x + 20, g1], med());
  for (const k of [-1, 1]) v.line([x + k * 10, SPEAR.bodyTop], [x + k * 10, g1], { w: W.thin });
  const wh = SPEAR.wheel;
  v.rect([x - 5, g1], [x + 5, wh.y - 6], med());
  v.roundRect([x - wh.r - wh.tube, wh.y - wh.tube], [x + wh.r + wh.tube, wh.y + wh.tube], wh.tube, med('#f3d5d2'));
  v.rect([x - 8, wh.y - 6], [x + 8, wh.y + 6], med());
  const inl = SPEAR.inlet;
  pipe(
    v,
    [
      [inl.x - inl.len / 2, inl.y],
      [PIPE.riserOverX, inl.y],
      [PIPE.riserOverX, PIPE.riserTop],
      [-430, PIPE.riserTop],
    ],
    PIPE.r50,
  );
  pipeBreak(v, -430, PIPE.riserTop, PIPE.r50);
  v.rect([inl.x - inl.len / 2, inl.y - inl.r], [inl.x + inl.len / 2, inl.y + inl.r], med());
  const sideL = v2 ? SIDE.v2.collar[1] : SIDE.flangeX - SIDE.v1.flangeL / 2 - 8;
  pipe(
    v,
    [
      [sideL, SIDE.y],
      [-500, SIDE.y],
    ],
    PIPE.r50,
  );
  pipeBreak(v, -500, SIDE.y, PIPE.r50);
  v.center([M.x0 + 40, AX], [M.x1 + 15, AX]);
  v.center([0, 40], [0, M.roof - 10]);
  v.center([x, AX - 6], [x, wh.y + 15]);
  v.center([-512, SIDE.y], [5, SIDE.y]);
}

/** Section A–A in the plane x = 0, looking towards +X (window on the right). Model (z, y). */
function sectionA(v: View, v2: boolean): void {
  const ax = (r: number) => AX + r;
  const both = (z0: number, z1: number, r0: number, r1: number, st: Stroke) => {
    v.rect([z0, ax(r0)], [z1, ax(r1)], st);
    v.rect([z0, ax(-r0)], [z1, ax(-r1)], st);
  };
  const mirror = (pts: Pt[], st: Stroke) => {
    for (const s of [1, -1])
      v.polyline(
        pts.map(([z, r]) => [z, ax(s * r)] as Pt),
        { closed: true, ...st },
      );
  };
  const hatch = (h: Stroke['hatch'], w = W.medium): Stroke => ({ w, hatch: h, fill: PAPER });
  const top = M.roof - M.sheet;
  const { z0: d0, z1: d1 } = DRAIN_MM;
  // base plate (cut through the drain), stainless funnel, falling water
  v.rect([BASE.z0, 0], [d0, M.baseT], hatch('pmma', W.thick));
  v.rect([d1, 0], [BASE.z1, M.baseT], hatch('pmma', W.thick));
  const dm = (d0 + d1) / 2;
  const half = ((d1 - d0) / 2) * (92 / 150); // funnel: 0.212 → 0.13 m radius over 80 mm
  v.line([d0, 0], [dm - half, -80], { w: W.medium });
  v.line([d1, 0], [dm + half, -80], { w: W.medium });
  for (const k of [-1, 0, 1])
    v.line([dm + k * 25, 30], [dm + k * 25, -95], { w: W.thin, color: COLORS.water }).setAttribute(
      'marker-end',
      'url(#arrow)',
    );
  // window, partition (hole Ø50), rear panel + bearing boss, grease cap
  v.rect([SHAFT.window[0], M.baseT], [SHAFT.window[1], top], hatch('pmma'));
  v.rect([SHAFT.partDry, M.baseT], [SHAFT.partWet, ax(-25)], hatch('pmma'));
  v.rect([SHAFT.partDry, ax(25)], [SHAFT.partWet, top], hatch('pmma'));
  const [r0, r1] = SHAFT.rear;
  v.rect([r0, M.baseT], [r1, top], hatch('plastic'));
  mirror(
    [
      [r1, 23.5],
      [r1, 34],
      [r1 + 20, 32],
      [r1 + 20, 23.5],
    ],
    hatch('plastic'),
  );
  v.rect([r0 - 12, ax(-22)], [r0, ax(22)], hatch('steel'));
  // cover roof, return lips, EPDM gaskets
  v.rect([M.zBack, top], [M.zFront, M.roof], { w: W.medium, fill: COLORS.ink });
  for (const z of [M.zBack, M.zFront - M.sheet]) {
    v.rect([z, M.roof - M.lip], [z + M.sheet, M.roof], { w: W.thin, fill: COLORS.ink });
    v.rect([z, M.baseT], [z + M.sheet, M.baseT + M.lip], { w: W.thin, fill: COLORS.ink });
  }
  for (const z of [SHAFT.window[0] - 3, M.zBack + M.sheet + 8]) {
    v.rect([z, top - 8], [z + 3, top], hatch('rubber', W.thin));
    v.rect([z, M.baseT], [z + 3, M.baseT + 8], hatch('rubber', W.thin));
  }
  // behind the cut (x = 190–200): rectifier on its heatsink, terminal block, cable gland + cable
  v.rect([-130, M.baseT], [-70, M.baseT + 38], thin());
  v.rect([-114, M.baseT + 39], [-86, M.baseT + 49], thin());
  v.rect([-45, M.baseT], [-25, M.baseT + 25], thin());
  v.rect([M.zBack - 13, 19], [M.zBack + 5, 41], med());
  v.rect([M.zBack - 30, 24.5], [M.zBack - 13, 35.5], med('#3a3f46'));
  // bearing housing (V1 printed block / V2 aluminium cartridge), from drivetrain.ts
  const pd = SHAFT.partDry;
  const end = SHAFT.b2 - 9;
  mirror(
    v2
      ? [
          [pd, 23.5],
          [pd, 62],
          [pd - 12, 62],
          [pd - 14, 36],
          [end, 34],
          [end, 23.5],
        ]
      : [
          [pd, 23.5],
          [pd, 60],
          [pd - 14, 60],
          [pd - 14, 34],
          [end, 34],
          [end, 23.5],
        ],
    hatch(v2 ? 'alu' : 'plastic'),
  );
  // generator: stator, rotor bell (fan + wall), magnets, hub (generator.ts)
  const [b0, b1] = BELL.z;
  both(STATOR.z[0], STATOR.z[1], STATOR.rBore, STATOR.rTip, hatch('steel', W.thin));
  mirror(
    [
      [b0, 21],
      [b0, BELL.r],
      [b1, BELL.r],
      [b1, BELL.rIron],
      [b0 + 6, BELL.rIron],
      [b0 + 6, 21],
    ],
    hatch('plastic', W.thin),
  );
  both(STATOR.z[0] - 1, STATOR.z[1] + 1, BELL.rMag[0], BELL.rMag[1], { w: W.thin, fill: '#c9ced6' });
  both(b0 - 15, b0 + 3, M.shaftR, 21, hatch('alu', W.thin));
  // runner: hub disc, clamp ring, flange + bush, buckets (not sectioned)
  const wz = M.wheelZ;
  both(wz - M.hubT / 2, wz + M.hubT / 2, RUNNER.bore, M.hubR, hatch('plastic', W.thin));
  both(wz + RUNNER.ringZ[0], wz + RUNNER.ringZ[1], RUNNER.ring[0], RUNNER.ring[1], hatch('plastic', W.thin));
  both(wz + M.hubT / 2, wz + 26, 10, RUNNER.flangeR, hatch('steel', W.thin));
  const L = spec('L');
  for (const s of [1, -1]) {
    const cup: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const e = -0.985 + (1.97 * i) / 24;
      cup.push([wz + L.b * Math.sqrt(1 - e * e), ax(s * (L.rc + e * L.a))]);
    }
    for (let i = 24; i >= 0; i--) cup.push([2 * wz - cup[i][0], cup[i][1]]);
    v.rect([wz - 10, ax(s * M.hubR)], [wz + 10, ax(s * (L.rc - 0.35 * L.a))], thin());
    v.polyline(cup, { closed: true, ...med() });
  }
  both(SHAFT.partWet, SHAFT.partWet + 9, 17.5, 30, hatch(v2 ? 'alu' : 'plastic', W.thin));
  // shaft (not sectioned) + bearings (simplified symbol)
  v.rect([SHAFT.z0, ax(-M.shaftR)], [SHAFT.z1, ax(M.shaftR)], med());
  v.rect([wz + 28, ax(-14.5)], [wz + 38, ax(14.5)], thin());
  for (const z of [SHAFT.b1, SHAFT.b2, SHAFT.b3]) {
    for (const s of [1, -1]) {
      const a: Pt = [z - 7, ax(s * 10)];
      const b: Pt = [z + 7, ax(s * 23.5)];
      v.rect(a, b, thin());
      v.polyline([a, b, [a[0], b[1]], [b[0], a[1]]], { w: W.thin }); // ISO simplified bearing cross
    }
  }
  if (v2) v.rect([-106, ax(82)], [-94, ax(137)], thin()); // Hall sensor + bracket
  v.center([M.zBack - 20, AX], [M.zFront + 10, AX]);
  v.center([wz, -90], [wz, M.roof + 15]);
}

const NOTES = (dPitch: number): Text[] => [
  l(
    'Chute libre ≥ 300–400 mm sous l’embase (vidéo) : l’eau doit s’évacuer sans remonter vers la roue. Constructeur : turbine ≥ 500 mm au-dessus du sol.',
    'Free fall ≥ 300–400 mm under the base (video): the water must drain without backing up to the runner. Maker: turbine ≥ 500 mm above ground.',
  ),
  l(
    `Raccordement : PEHD Ø63 PN10 (Ø int. 55), raccord à compression, vanne principale + manomètre 0–10 bar. Jets dans le plan de roue, tangents au primitif Ø${dPitch}.`,
    `Connection: HDPE Ø63 PN10 (55 ID), compression coupling, main valve + 0–10 bar gauge. Jets in the runner plane, tangent to the Ø${dPitch} pitch circle.`,
  ),
  l(
    'Dérivation Ø40 (rep. 16) piquée entre le manomètre et les vannes d’injecteurs, fermée en service : purge de l’air et du sable vers le canal de fuite sans passer par la roue (schéma constructeur).',
    'Ø40 bypass (item 16) teed in between the gauge and the injector valves, closed in service: purges air and sand to the tailrace without going through the runner (maker’s layout).',
  ),
  l(
    'Sortie électrique : presse-étoupe sur le flasque arrière, câble 2 × 6 mm² vers le coffret de protection DC.',
    'Power out: cable gland on the rear panel, 2 × 6 mm² cable to the DC protection box.',
  ),
];

/** Model vs maker data: the envelope and runner follow hydronome.fr, the inside is ours. */
function makerTable(d: Drawing, x: number, y: number): void {
  const p = d.paper();
  const S = spec('S');
  const pA = hydro().a6.pt.pElec;
  p.text([x, y - 2], l('MODÈLE 3D vs DONNÉES CONSTRUCTEUR', '3D MODEL vs MAKER DATA'), { size: 2, weight: 'bold' });
  const same = '=';
  const diff = '≠';
  const env = `${M.W} × ${M.roof} × ${M.depth}`;
  const h = d.table(
    x,
    y,
    [
      { label: '', w: 28 },
      { label: l('Modèle 3D', '3D model'), w: 36 },
      { label: 'Hydronome', w: 31 },
      { label: '', w: 6, align: 'middle' },
    ],
    [
      [l('L × H × P', 'L × H × D'), env, '574 × 328 × 402', same],
      [
        l('Augets', 'Buckets'),
        l(`${M.buckets}, imprimés`, `${M.buckets}, printed`),
        l('26, injectés', '26, moulded'),
        same,
      ],
      [l('Roue Ø ext.', 'Runner OD'), `Ø${2 * R_TIP_MM} (L) / Ø${Math.round(2 * tipR(S))} (S)`, 'Ø244', same],
      [l('Buse maxi', 'Max nozzle'), `Ø${M.maxNozzle}`, 'Ø14', same],
      [l('Chambre sèche', 'Dry chamber'), `${-M.zBack}`, '200', '≈'],
      [
        l('Générateur', 'Generator'),
        l(`≈ ${tr(nf(pA, 0))} W (site A)`, `≈ ${nf(pA, 0).en} W (site A)`),
        l('PMA 5 kW nominal', 'PMA 5 kW rated'),
        diff,
      ],
      [l('Roulements', 'Bearings'), '3 × 6204-2RS', l('3 SKF opposés', '3 SKF, opposed'), diff],
      [l('Masse', 'Weight'), l('non estimée', 'not estimated'), '22 kg', diff],
    ],
    4.2,
  );
  note(
    d,
    x,
    y + h + 1.6,
    101,
    l(
      'Enveloppe, roue, buse maxi et compartiment générateur repris du site du constructeur (hydronome.fr) ; générateur, paliers et injecteurs restent une reconstruction pédagogique, pas le produit.',
      'Envelope, runner, max nozzle and generator bay taken from the maker’s site (hydronome.fr); generator, bearings and injectors remain an educational reconstruction, not the product.',
    ),
    { size: 1.75, color: COLORS.v2 },
  );
}

function partsList(d: Drawing, v2: boolean, dTop: number): void {
  const p = d.paper();
  p.text([305, 138], l('NOMENCLATURE', 'PARTS LIST'), { size: 2.2, weight: 'bold' });
  const rows: Text[][] = [
    ['1', l('Embase PMMA noir coulé ép. 20 + entonnoir inox', '20 mm black cast PMMA base + stainless funnel')],
    ['2', l('Capot alu marin 5083 ép. 2, plié', 'Folded 2 mm 5083 marine-alu cover')],
    ['3', l('Hublot PMMA ép. 8 + joints EPDM', '8 mm PMMA window + EPDM gaskets')],
    ['4', l(`Cloison étanche PMMA ép. ${M.partT}`, `${M.partT} mm PMMA watertight partition`)],
    ['5', l('Flasque arrière ép. 6, ouïes', '6 mm rear panel, vents')],
    [
      '6',
      l(
        `Roue Pelton ${M.buckets} augets Ø${2 * R_TIP_MM} (PL-T03)`,
        `${M.buckets}-bucket Ø${2 * R_TIP_MM} Pelton runner (PL-T03)`,
      ),
    ],
    ['7', l(`Arbre Ø20 × ${SHAFT.len} + 3 × 6204-2RS (PL-T02)`, `Ø20 × ${SHAFT.len} shaft + 3 × 6204-2RS (PL-T02)`)],
    [
      '8',
      v2
        ? l('Cartouche de palier alu 6082', '6082 alu bearing cartridge')
        : l('Palier imprimé PETG-CF', 'Printed PETG-CF bearing housing'),
    ],
    ['9', l('Générateur 12 dents / 14 aimants', 'Generator 12 teeth / 14 magnets')],
    ['10', l(`Injecteur à pointeau Ø${dTop} (PL-T04)`, `Ø${dTop} spear injector (PL-T04)`)],
    [
      '11',
      v2
        ? l('Lance à inserts baïonnette Ø4–10', 'Bayonet insert lance Ø4–10')
        : l('Injecteur fixe imprimé Ø6 / Ø8', 'Printed fixed nozzle Ø6 / Ø8'),
    ],
    ['12', l('Col de cygne PVC Ø50 + vannes de branche', 'Ø50 PVC gooseneck + branch valves')],
    ['13', l('Arrivée PEHD Ø63, vanne, manomètre', 'Ø63 HDPE inlet, valve, gauge')],
    [
      '14',
      v2
        ? l('Châssis alu 40 × 40, plots, entonnoir', '40 × 40 alu skid, mounts, funnel')
        : l('Tréteaux + madriers 75 × 150', 'Trestles + 75 × 150 beams'),
    ],
    ['15', l('Redresseur, bornier, presse-étoupe', 'Rectifier, terminals, cable gland')],
    ['16', l('Dérivation Ø40 + vanne de purge (fermée)', 'Ø40 bypass + purge valve (closed)')],
  ];
  if (v2)
    rows.push(
      ['17', l('Déflecteurs de jet + gâche 12 V', 'Jet deflectors + 12 V latch')],
      ['18', l('Grenouillères ×4, coffret IP65', '4 toggle latches, IP65 box')],
    );
  d.table(
    305,
    140,
    [
      { label: l('Rep.', 'Item'), w: 9, align: 'middle' },
      { label: l('Désignation', 'Description'), w: 91 },
    ],
    rows,
    4,
  );
  note(
    d,
    305,
    140 + (rows.length + 1) * 4 + 3,
    100,
    v2
      ? l(
          'V2 : repères 8, 11, 14, 17 et 18 remplacent les pièces du prototype ; même enveloppe, mêmes raccordements.',
          'V2: items 8, 11, 14, 17 and 18 replace the prototype parts; same envelope, same connections.',
        )
      : l(
          'V1 : prototype filmé (site A). Les repères 8, 11 et 14 changent en V2 (cartouche, lance à inserts, châssis alu).',
          'V1: the filmed prototype (site A). Items 8, 11 and 14 change in V2 (cartridge, insert lance, alu skid).',
        ),
    { size: 1.8, color: COLORS.muted },
  );
}

/** Balloons: [model point, balloon centre in paper mm, item]. */
function balloons(vw: View, list: [Pt, number, number, string][]): void {
  list.forEach(([at, bx, by, n]) => vw.leader(at, bx - vw.map(at)[0], by - vw.map(at)[1], n, { balloon: true }));
}

export const turbineGa: DrawingSheet = {
  id: 'turbine-ga',
  number: 'PL-T01',
  group: 'turbine',
  title: l('Turbine — plan d’ensemble', 'Turbine — general arrangement'),
  description: l(
    'Plan d’ensemble de la turbine, cotes tirées du modèle 3D aligné sur les données du constructeur (574 × 328 × 402, roue 26 augets Ø244) : vue de face côté hublot (profil en coin, deux jets tangents au cercle primitif Ø190), coupe A–A par l’axe (chambre humide, cloison, compartiment générateur de 200) et vue de dessus, à 1:5, plus une élévation d’implantation à 1:20 avec les hauteurs au sol et la dérivation de purge. Les repères renvoient à la nomenclature ; un tableau compare le modèle aux données publiées.',
    'General arrangement of the turbine, dimensions taken from the 3D model aligned on the maker’s data (574 × 328 × 402, 26-bucket Ø244 runner): front view from the window side (wedge profile, two jets tangent to the Ø190 pitch circle), section A–A through the axis (wet chamber, partition, 200 mm generator bay) and top view, at 1:5, plus a 1:20 installation elevation with heights above ground and the purge bypass. Balloons refer to the parts list; a table compares the model with the published data.',
  ),
  scene: 'turbine',
  parts: ['base', 'cover', 'window', 'partition', 'rear-panel', 'valve-bypass'],
  render(ctx) {
    const v2 = ctx.version === 'v2';
    const pre = presetParams('siteA');
    const [dTop, dSide] = [pre.top.d, pre.side.d];
    const d = new Drawing();
    d.frame({
      title: l('Turbine — plan d’ensemble', 'Turbine — general arrangement'),
      subtitle: v2
        ? l(
            'V2 industrialisée : châssis alu 40 × 40, lance à inserts, déflecteur',
            'V2 industrialised: 40 × 40 alu skid, insert lance, deflector',
          )
        : l(
            'V1 prototype : tréteaux + madriers, injecteur fixe imprimé',
            'V1 prototype: trestles + beams, printed fixed nozzle',
          ),
      number: 'PL-T01',
      scale: '1:5 · 1:20',
    });
    const p = d.paper();
    const x = SPEAR.x;

    // ---- front view 1:5
    const fv = d.view(114, 152, 0.2);
    frontView(fv, v2, dTop, dSide);
    fv.sectionMark([0, M.roof + 28], [0, -8], 'A', -1);
    fv.dim([BASE.x1, 0], [M.x1, M.lowH], 6, { dir: 'v', size: 2.2 });
    fv.dim([BASE.x1, 0], [BASE.x1, AX], 13, { dir: 'v' });
    fv.dim([BASE.x1, 0], [M.peakX, M.roof], 20, { dir: 'v' });
    fv.dim([x + 45, M.roof], [x + 45, SPEAR.wheel.y + 6], 3, { dir: 'v', size: 2.2 });
    fv.dim([x, M.roof - 22], [0, M.roof - 22], 0, { dir: 'h', size: 2.2 });
    fv.dim([-205, SIDE.y], [-205, AX], 0, { dir: 'v', size: 2.2 });
    fv.dimDiameter([0, AX], M.rPitch, 28, { label: l(`Ø${2 * M.rPitch} prim.`, `Ø${2 * M.rPitch} pitch`), size: 2.2 });
    fv.leader(
      [M.x0 + M.bevel / 2, (M.wallH + M.roof) / 2],
      -10,
      -8,
      l(`${M.bevel} × ${M.bevel}, mur ${M.wallH}`, `${M.bevel} × ${M.bevel}, wall ${M.wallH}`),
      { size: 2 },
    );
    balloons(fv, [
      [[250, 10], 172, 160, '1'],
      [[200, 222], 166, 92, '2'],
      [[210, 110], 178, 110, '3'],
      [[60, AX + 100], 148, 78, '6'],
      [[x + 32, 450], 122, 56, '10'],
      [[-360, SIDE.y + 20], 26, 118, '11'],
      [[-300, 520], 30, 60, '12'],
    ]);
    if (v2)
      balloons(fv, [
        [[-170, 250], 72, 78, '17'],
        [[M.x1 + 6, 50], 192, 160, '18'],
      ]);
    fv.caption([0, -42], l('VUE DE FACE (côté hublot)', 'FRONT VIEW (window side)'), '1:5');

    // ---- section A–A 1:5 (z → right), aligned with the front view
    const sa = d.view(256, 152, 0.2);
    sectionA(sa, v2);
    const zc = [M.zBack, M.zPart, M.wheelZ, M.zFront];
    zc.slice(1).forEach((z, i) => sa.dim([zc[i], M.roof], [z, M.roof], -6, { dir: 'h', size: 2.2 }));
    sa.dim([M.zBack, M.roof], [M.zFront, M.roof], -12, { dir: 'h' });
    p.text(sa.map([M.wheelZ + 8, -100]), l('plan des jets', 'jet plane'), {
      size: 1.8,
      color: COLORS.water,
      anchor: 'middle',
      halo: true,
    });
    p.text(sa.map([140, -60]), l('chute libre', 'free fall'), { size: 1.8, color: COLORS.water });
    p.text(sa.map([160, 35]), l('HUMIDE', 'WET'), {
      size: 1.8,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'middle',
    });
    p.text(sa.map([-165, 75]), l('SÈCHE', 'DRY'), {
      size: 1.8,
      weight: 'bold',
      color: COLORS.muted,
      anchor: 'middle',
    });
    balloons(sa, [
      [[SHAFT.partWet, 290], 266, 96, '4'],
      [[SHAFT.rear[0], 290], 211, 96, '5'],
      [[-170, AX], 211, 108, '7'],
      [[-40, AX + 30], 248, 96, '8'],
      [[-100, AX + 70], 234, 96, '9'],
      [[M.zBack - 4, 30], 211, 134, '15'],
    ]);
    sa.caption([0, -135], l('COUPE A–A', 'SECTION A–A'), '1:5');

    // ---- top view 1:5 (below the front view)
    const tv = d.view(114, 236, 0.2);
    topView(tv, v2);
    const zb = BASE.z0;
    const chain = [M.x0, M.x0 + M.bevel, 0, M.peakX, M.x1];
    chain.slice(1).forEach((xx, i) => tv.dim([chain[i], -zb], [xx, -zb], -6, { dir: 'h', size: 2 }));
    tv.dim([M.x0, -zb], [M.x1, -zb], -12, { dir: 'h' });
    tv.dim([BASE.x0, -zb], [BASE.x1, -zb], -18, { dir: 'h', size: 2.2 });
    tv.dim([BASE.x1, -M.zBack], [BASE.x1, -M.zFront], 7, { dir: 'v' });
    tv.dim([BASE.x1, -BASE.z0], [BASE.x1, -BASE.z1], 14, { dir: 'v', size: 2.2 });
    tv.dim([M.x1 + 10, 0], [M.x1 + 10, -M.pipeZ], 0, { dir: 'v', size: 2 });
    p.text(tv.map([M.x1 - 10, -M.pipeZ - 12]), l(`plan des jets (z = ${M.pipeZ})`, `jet plane (z = ${M.pipeZ})`), {
      size: 1.8,
      color: COLORS.water,
      anchor: 'end',
    });
    p.text(tv.map([-30, 160]), l('ARRIÈRE (générateur)', 'REAR (generator)'), {
      size: 1.8,
      color: COLORS.muted,
      anchor: 'end',
    });
    p.text(tv.map([40, -190]), l('AVANT (hublot)', 'FRONT (window)'), {
      size: 1.8,
      color: COLORS.muted,
    });
    tv.caption([-390, -175], l('VUE DE DESSUS', 'TOP VIEW'), '1:5');

    // ---- installation elevation 1:20
    const iv = d.view(374, 110, 0.05);
    installation(iv, v2);
    const Yg = (y: number) => y + M.baseY;
    iv.dim([M.inletX, 0], [M.inletX, Yg(M.inletY)], -3, { dir: 'v', size: 2 });
    iv.dim([-440, 0], [-440, M.baseY], 0, { dir: 'v', size: 2 });
    iv.dim([540, 0], [540, Yg(AX)], 2, { dir: 'v', size: 2 });
    iv.dim([M.inletX, Yg(M.inletY)], [0, Yg(AX)], -24, { dir: 'h', size: 2 });
    iv.dim([90, 0], [90, v2 ? SKID_MM.top - 200 : M.baseY - 80], 0, { dir: 'v', size: 1.9, color: COLORS.water });
    p.text(iv.map([-1400, Yg(M.inletY) - 90]), l('PEHD Ø63 PN10', 'HDPE Ø63 PN10'), { size: 1.7 });
    p.text(iv.map([-1400, -120]), l('sol', 'ground'), { size: 1.7, color: COLORS.muted });
    p.text(iv.map([0, -190]), l('canal de fuite', 'tailrace'), { size: 1.7, color: COLORS.water, anchor: 'middle' });
    p.text(iv.map([PIPE.bypass.end[0] + 40, Yg(PIPE.bypass.end[1]) - 150]), l('purge', 'purge'), {
      anchor: 'end',
      size: 1.7,
      color: COLORS.water,
    });
    balloons(iv, [
      [[-1300, Yg(M.inletY)], 318, 64, '13'],
      [v2 ? [SKID_MM.xs[1], 400] : [CX + 360, 400], 398, 118, '14'],
      [[PIPE.bypass.x, Yg(PIPE.bypass.valveY)], 316, 92, '16'],
    ]);
    iv.caption([-400, -330], l('IMPLANTATION', 'INSTALLATION'), '1:20');

    // ---- notes, comparison with the maker, parts list
    let ny = 14;
    NOTES(2 * M.rPitch).forEach((t, i) => (ny = note(d, 205, ny, 96, t, { bullet: `${i + 1}.` })));
    makerTable(d, 202, 197);
    partsList(d, v2, dTop);
    return d;
  },
};
