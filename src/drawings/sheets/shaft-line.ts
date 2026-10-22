import { l, tr } from '../../i18n';
import { COLORS, Drawing, W, type HatchKind, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';

// PL-T02 — shaft line, axial section A–A at 1:2 (z along the sheet, radius up).
// Positions from src/three/turbine (dims.ts, drivetrain.ts, generator.ts, runner.ts), m → mm.

const Z_PART = 40; // partition centre, 10 thick → dry face 35, wet face 45
const ZB1 = 23; // zPartDry - 12
const ZB2 = -70; // zPartDry - 105
const ZB3 = -165; // zBack + 15
const SHAFT: [number, number] = [-172, 150];
const WHEEL_Z = 110;
const SEAL_Z = 49.5;
const BIG = 1000; // sentinel radius: replaced by the break radius of each half
const R_TOP = 160;
const R_BOT = -95;

interface Shape {
  pts: Pt[];
  st: Stroke;
  mirror: boolean;
  open?: boolean;
}
type Box = { z0: number; z1: number; r0: number; r1: number };

const sec = (hatch: HatchKind, w = W.medium): Stroke => ({ w, hatch, fill: COLORS.paper });
const solid = (w = W.medium): Stroke => ({ w, fill: COLORS.paper });
const rect = (z0: number, z1: number, r0: number, r1: number): Pt[] => [
  [z0, r0],
  [z1, r0],
  [z1, r1],
  [z0, r1],
];
const shift = (pts: Pt[], dz: number): Pt[] => pts.map(([z, r]) => [z + dz, r]);
const circle = ([cz, cr]: Pt, r: number, n = 20): Pt[] =>
  Array.from(
    { length: n },
    (_, i) => [cz + r * Math.cos((i / n) * Math.PI * 2), cr + r * Math.sin((i / n) * Math.PI * 2)] as Pt,
  );

/** Sutherland–Hodgman clip of a closed polygon against an axis-aligned box. */
function clipPoly(pts: Pt[], b: Box): Pt[] {
  const edges: [(p: Pt) => boolean, (p: Pt, q: Pt) => Pt][] = [
    [(p) => p[0] >= b.z0, (p, q) => [b.z0, p[1] + ((q[1] - p[1]) * (b.z0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= b.z1, (p, q) => [b.z1, p[1] + ((q[1] - p[1]) * (b.z1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= b.r0, (p, q) => [p[0] + ((q[0] - p[0]) * (b.r0 - p[1])) / (q[1] - p[1]), b.r0]],
    [(p) => p[1] <= b.r1, (p, q) => [p[0] + ((q[0] - p[0]) * (b.r1 - p[1])) / (q[1] - p[1]), b.r1]],
  ];
  let out = pts;
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    src.forEach((p, i) => {
      const q = src[(i + 1) % src.length];
      if (inside(p)) {
        out.push(p);
        if (!inside(q)) out.push(cut(p, q));
      } else if (inside(q)) out.push(cut(p, q));
    });
    if (!out.length) break;
  }
  return out;
}

/** 6204-2RS section (top half) centred on z. */
function bearing(z: number): Shape[] {
  const outer: Pt[] = [
    [-7, 19.5],
    [-7, 23.5],
    [7, 23.5],
    [7, 19.5],
    [3.5, 19.5],
    [1.5, 20.7],
    [-1.5, 20.7],
    [-3.5, 19.5],
  ];
  const inner: Pt[] = [
    [-7, 10],
    [-7, 14.2],
    [-3.5, 14.2],
    [-1.5, 13],
    [1.5, 13],
    [3.5, 14.2],
    [7, 14.2],
    [7, 10],
  ];
  return [
    { pts: shift(outer, z), st: sec('steel'), mirror: true },
    { pts: shift(inner, z), st: sec('steel'), mirror: true },
    { pts: rect(z - 6.6, z - 5.6, 14.6, 19.4), st: sec('rubber', W.thin), mirror: true },
    { pts: rect(z + 5.6, z + 6.6, 14.6, 19.4), st: sec('rubber', W.thin), mirror: true },
    { pts: circle([z, 16.8], 3.9), st: solid(W.medium), mirror: true },
  ];
}

function shapes(v2: boolean): Shape[] {
  const s: Shape[] = [];
  const add = (pts: Pt[], st: Stroke, mirror = true) => s.push({ pts, st, mirror });
  // housing plates (cut by break lines at R_TOP / R_BOT)
  add(
    [
      [-178, 16],
      [-178, BIG],
      [-172, BIG],
      [-172, 34],
      [-152, 32],
      [-152, 23.5],
      [-172, 23.5],
      [-172, 16],
    ],
    sec('plastic'),
  );
  add(
    [
      [Z_PART - 5, 25],
      [Z_PART - 5, BIG],
      [Z_PART + 5, BIG],
      [Z_PART + 5, 25],
    ],
    sec('pmma'),
  );
  add(
    [
      [170, -BIG],
      [178, -BIG],
      [178, BIG],
      [170, BIG],
    ],
    sec('pmma'),
    false,
  );
  // grease cap (stainless cup) on the rear panel
  add(
    [
      [-190, -22],
      [-190, 22],
      [-178, 20],
      [-178, 17],
      [-187, 17],
      [-187, -17],
      [-178, -17],
      [-178, -20],
    ],
    sec('steel'),
    false,
  );
  // bearing housing: V1 printed block (square flange 120) / V2 turned cartridge (Ø124 flange)
  if (v2) {
    add(
      [
        [35, 23.5],
        [35, 62],
        [23, 62],
        [21, 36],
        [-79, 34],
        [-79, 21],
        [-77, 21],
        [-77, 23.5],
      ],
      sec('alu'),
    );
  } else {
    add(
      [
        [35, 24],
        [35, 60],
        [19, 60],
        [19, 34],
        [-79, 34],
        [-79, 21],
        [-77, 21],
        [-77, 23.5],
        [30, 23.5],
        [30, 24],
      ],
      sec('plastic'),
    );
  }
  add(rect(30.2, 31.8, 23.5, 25.5), solid(W.thin)); // internal circlip DIN 472 Ø47
  add(rect(-63, 16, 10, 14), sec('steel', W.thin)); // spacer between inner rings
  for (const z of [ZB1, ZB2, ZB3]) s.push(...bearing(z));
  // seal carrier + lip seal 20 × 35 × 7 (main lip and garter spring on the water side, +z)
  add(
    [
      [45, 17.5],
      [45, 30],
      [54, 30],
      [54, 17.5],
    ],
    sec(v2 ? 'alu' : 'plastic'),
  );
  add(
    shift(
      [
        [3.5, 10.2],
        [1.8, 12.5],
        [3.5, 15.5],
        [3.5, 17.5],
        [-3.5, 17.5],
        [-3.5, 12],
        [-2, 10.4],
      ],
      SEAL_Z,
    ),
    sec('rubber', W.thin),
  );
  add(circle([SEAL_Z + 1.2, 12.8], 0.7, 10), solid(W.thin));
  if (v2) {
    add(
      [
        [59, 10.2],
        [59, 14],
        [56.5, 14],
        [54.2, 19],
        [54, 18.4],
        [55.6, 13],
        [56, 10.2],
      ],
      sec('rubber', W.thin),
    ); // V-ring
    add(
      [
        [-29, 35.2],
        [-21, 35.2],
        [-22, 46],
        [-28, 46],
      ],
      solid(W.thin),
      false,
    ); // grease nipple
    add(circle([-25, 49], 3.2, 14), solid(W.thin), false);
  }
  // generator: stator stack + coil end turns, rotor (hub, fan disc, bell, back iron, magnets)
  add(rect(-72, -36, 34.2, 56.5), sec('steel'));
  add(rect(-78.2, -72, 43.2, 51.4), sec('copper', W.thin));
  add(rect(-36, -29.8, 43.2, 51.4), sec('copper', W.thin));
  add(rect(-103, -85, 10, 21), sec('alu'));
  add(rect(-88, -82, 21, 50), sec('plastic'));
  add(rect(-88, -82, 68, 78), sec('plastic'));
  add(rect(-82, -30, 65, 78), sec('plastic'));
  add(rect(-82, -30, 61.5, 65), sec('steel', W.thin));
  add(rect(-73, -35, 57.5, 61.4), { w: W.thin, fill: '#c9ced6' });
  add(rect(-97, -91, 15, 21), solid(W.thin), false); // set screw
  if (v2) add(rect(-66, -54, 80, 108), { w: W.thin, fill: COLORS.paper }, false); // Hall sensor
  // runner: hub disc, clamp ring, steel flange, taper bush, washer, M4 bolts, bucket (top only)
  add(rect(WHEEL_Z - 6, WHEEL_Z + 6, 22, 85), sec('plastic'));
  add(rect(WHEEL_Z + 10, WHEEL_Z + 15, 62, 87), sec('plastic'));
  add(
    [
      [104, 11],
      [104, 22],
      [116, 22],
      [116, 45],
      [136, 45],
      [136, 16],
      [120, 19],
      [120, 11],
    ],
    sec('steel'),
  );
  add(
    [
      [120, 10],
      [120, 19],
      [136, 16],
      [136, 10],
    ],
    sec('steel'),
  );
  add(rect(136, 138, 10, 17), sec('steel', W.thin));
  add(rect(100, 104, 58, 85), solid(W.thin));
  add(rect(116, 120, 58, 62), solid(W.thin));
  add(rect(98, 128, 73, 77), solid(W.thin));
  add(rect(125, 128, 71.5, 78.5), solid(W.thin));
  add(rect(96.5, 99.5, 71.5, 78.5), solid(W.thin));
  add(rect(100, 120, 85, 109.1), solid(W.medium), false);
  const cup: Pt[] = [];
  for (let i = 0; i <= 32; i++) {
    const e = -0.985 + (1.97 * i) / 32;
    cup.push([WHEEL_Z + 21 * Math.sqrt(1 - e * e), 121 + e * 34]);
  }
  for (let i = 32; i >= 0; i--) cup.push([2 * WHEEL_Z - cup[i][0], cup[i][1]]);
  add(cup, solid(W.medium), false);
  // shaft (not sectioned): Ø20, chamfer, M16 end, 6 × 6 key
  add(
    [
      [-172, 8.5],
      [-170.5, 10],
      [138, 10],
      [138, 8],
      [149, 8],
      [150, 7],
      [150, -7],
      [149, -8],
      [138, -8],
      [138, -10],
      [-170.5, -10],
      [-172, -8.5],
    ],
    solid(W.thick),
    false,
  );
  add(rect(95, 125, 6.5, 12.5), solid(W.thin), false);
  add(rect(138, 148, -14.5, 14.5), solid(W.medium), false); // M16 nut (not sectioned)
  add(
    [
      [138, 12],
      [148, 12],
    ],
    { w: W.thin },
    false,
  );
  add(
    [
      [138, -12],
      [148, -12],
    ],
    { w: W.thin },
    false,
  );
  return s;
}

function render(v: View, list: Shape[], clip?: Box): void {
  for (const sh of list) {
    for (const sign of sh.mirror ? [1, -1] : [1]) {
      let pts: Pt[] = sh.pts.map(([z, r]) => [z, Math.abs(r) === BIG ? (r * sign > 0 ? R_TOP : R_BOT) : r * sign]);
      if (clip) pts = clipPoly(pts, clip);
      if (pts.length > 2 || (pts.length === 2 && !clip))
        v.polyline(pts, { ...sh.st, closed: pts.length > 2 && !sh.open });
    }
  }
}

/** Short S-shaped break line across a plate (z0..z1) at radius r. */
function breakLine(v: View, z0: number, z1: number, r: number): void {
  const m = (z0 + z1) / 2;
  const w = z1 - z0;
  v.polyline(
    [
      [z0 - 2, r],
      [m - w * 0.15, r + 2.5],
      [m + w * 0.15, r - 2.5],
      [z1 + 2, r],
    ],
    { w: W.thin },
  );
}

function note(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  text: Text,
  o: { size?: number; bullet?: string; color?: string } = {},
): number {
  const size = o.size ?? 2;
  const indent = o.bullet ? 4 : 0;
  const max = Math.floor((w - indent) / (size * 0.64));
  const rows: string[] = [];
  let cur = '';
  for (const word of tr(text).split(' ')) {
    if (cur && (cur + ' ' + word).length > max) {
      rows.push(cur);
      cur = word;
    } else cur = cur ? cur + ' ' + word : word;
  }
  if (cur) rows.push(cur);
  const p = d.paper();
  if (o.bullet) p.text([x, y], o.bullet, { size, baseline: 'top', weight: 'bold', color: o.color });
  rows.forEach((r, i) => p.text([x + indent, y + i * size * 1.75], r, { size, baseline: 'top', color: o.color }));
  return y + rows.length * size * 1.75 + size * 0.5;
}

/** Small square tag referring to the fits table. */
function tag(v: View, at: Pt, dx: number, dy: number, letter: string): void {
  const p = v.drawing.paper();
  const q = v.map(at);
  const e: Pt = [q[0] + dx, q[1] + dy];
  p.circle(q, 0.45, { w: 0, fill: COLORS.signal });
  p.line(q, e, { w: W.thin, color: COLORS.signal });
  p.rect([e[0] - 2.2, e[1] - 2.2], [e[0] + 2.2, e[1] + 2.2], { w: W.thin, color: COLORS.signal, fill: COLORS.paper });
  p.text(e, letter, { size: 2.3, anchor: 'middle', baseline: 'middle', weight: 'bold', color: COLORS.signal });
}

export const shaftLine: DrawingSheet = {
  id: 'shaft-line',
  number: 'PL-T02',
  group: 'turbine',
  title: l('Ligne d’arbre — coupe A–A', 'Shaft line — section A–A'),
  description: l(
    'Coupe par l’axe de l’arbre à l’échelle 1:2 : roue Pelton côté eau, cloison étanche avec joint à lèvre, palier à deux roulements, générateur à rotor extérieur et troisième roulement dans le flasque arrière. Les cotes axiales donnent la position de chaque roulement et du plan de roue ; les repères a à g renvoient au tableau des ajustements. En V1 le palier est imprimé, en V2 c’est une cartouche alu avec graisseur et V-ring.',
    'Section through the shaft axis at 1:2: Pelton runner on the water side, watertight partition with lip seal, two-bearing housing, outer-rotor generator and third bearing in the rear panel. Axial dimensions give the position of each bearing and of the wheel plane; tags a to g refer to the fits table. On V1 the housing is printed, on V2 it is an aluminium cartridge with grease nipple and V-ring.',
  ),
  scene: 'turbine',
  parts: [
    'shaft',
    'bearing-1',
    'bearing-2',
    'bearing-3',
    'seal',
    'bearing-block',
    'bearing-cartridge',
    'wheel-lock',
    'rotor',
    'stator',
  ],
  render(ctx) {
    const v2 = ctx.version === 'v2';
    const d = new Drawing();
    d.frame({
      title: l('Ligne d’arbre — coupe A–A', 'Shaft line — section A–A'),
      subtitle: v2
        ? l(
            'V2 industrialisée : cartouche alu 6082, graisseur, V-ring',
            'V2 industrialised: 6082 alu cartridge, grease nipple, V-ring',
          )
        : l(
            'V1 prototype : palier imprimé PETG-CF (4 × M6 sur la cloison)',
            'V1 prototype: printed PETG-CF housing (4 × M6 on the partition)',
          ),
      number: 'PL-T02',
      scale: '1:2 · 2:1',
    });
    const p = d.paper();
    const list = shapes(v2);

    // ---- main section 1:2
    const v = d.view(118, 98, 0.5);
    render(v, list);
    for (const [z0, z1] of [
      [-178, -172],
      [35, 45],
      [170, 178],
    ]) {
      breakLine(v, z0, z1, R_TOP);
      breakLine(v, z0, z1, R_BOT);
    }
    v.center([-196, 0], [184, 0]);
    for (const z of [ZB3, ZB2, ZB1, WHEEL_Z]) v.center([z, -26], [z, -101]);
    v.center([WHEEL_Z, 26], [WHEEL_Z, 158]);
    // water / dry sides
    p.text(v.map([71, -86]), l('CHAMBRE HUMIDE', 'WET CHAMBER'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'middle',
      halo: true,
    });
    p.text(v.map([-128, -86]), l('CHAMBRE SÈCHE', 'DRY CHAMBER'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.muted,
      anchor: 'middle',
      halo: true,
    });
    // axial dimension chain (datum: rear end of the shaft)
    const yb = -101;
    v.dim([ZB3, yb], [ZB2, yb], 4, { dir: 'h' });
    v.dim([ZB2, yb], [ZB1, yb], 4, { dir: 'h' });
    v.dim([ZB1, yb], [WHEEL_Z, yb], 4, { dir: 'h' });
    v.dim([WHEEL_Z, yb], [SHAFT[1], yb], 4, { dir: 'h' });
    v.dim([SHAFT[0], yb], [SHAFT[1], yb], 11, { dir: 'h', label: l('322 (arbre)', '322 (shaft)') });
    v.dim([SHAFT[0], -30], [ZB3, -30], 0, { dir: 'h', size: 2 });
    v.dim([-130, -10], [-130, 10], 0, { dir: 'v', label: 'Ø20 h6', size: 2 });
    v.dim([164, -85], [164, 85], 0, { dir: 'v', label: 'Ø170', size: 2.2 });
    // fits tags (see table)
    tag(v, [ZB2 + 4, -10], 4, 13, 'a');
    tag(v, [ZB2 - 4, -23.5], -4, 16, 'b');
    tag(v, [ZB3 + 3, -23.5], 6, 12, 'c');
    tag(v, [SEAL_Z - 2, -10.4], -3, 22, 'd');
    tag(v, [SEAL_Z + 2, -17.5], 6, 16, 'e');
    tag(v, [-94, -10], -2, 18, 'f');
    tag(v, [128, -10], 2, 14, 'g');
    // balloons (parts list)
    // balloons: target point in the model, balloon centre in paper mm
    const b = (at: Pt, bx: number, by: number, n: string) => {
      const q = v.map(at);
      v.leader(at, bx - q[0], by - q[1], n, { balloon: true });
    };
    b([-188, 15], 20, 70, '16');
    b([-175, 130], 22, 26, '15');
    b([-165, 22], 40, 40, '4');
    b([-140, 10], 50, 28, '1');
    b([-84, 75], 62, 40, '13');
    b([-70, 22], 76, 24, '3');
    b([-54, 52], 98, 30, '14');
    b([-30, 13], 110, 22, '8');
    b([-5, 34.5], 118, 38, '7');
    b([ZB1, 22], 130, 26, '2');
    if (v2) b([-25, 47], 126, 54, '17');
    b([Z_PART, 120], 148, 24, '9');
    b([50, 28], 150, 60, '6');
    b([51.5, 16], 157, 74, '5');
    b([105, 70], 154, 44, '10');
    b([130, 40], 189, 52, '11');
    b([145, 13], 194, 66, '12');
    // detail E mark
    v.circle([50, 20], 17, { w: W.thin, dash: 'phantom' });
    p.text(v.map([60, 37]), 'E', { size: 3.4, weight: 'bold', halo: true });
    v.caption([0, -130], l('COUPE A–A — ligne d’arbre', 'SECTION A–A — shaft line'), '1:2');

    // ---- detail E, 2:1 (seal on the partition)
    const box: Box = { z0: 27, z1: 63, r0: 7, r1: 33 };
    const de = d.view(18 - box.z0 * 2, 186 + box.r1 * 2, 2);
    render(de, list, box);
    de.rect([box.z0, box.r0], [box.z1, box.r1], { w: W.thin, dash: 'phantom', color: COLORS.muted });
    de.leader([SEAL_Z + 3.4, 10.4], 26, 10, l('lèvre principale côté eau', 'main lip, water side'), {
      color: COLORS.water,
    });
    de.leader([SEAL_Z + 1.2, 12.8], 24, -6, l('ressort jarretière', 'garter spring'));
    de.leader([SEAL_Z - 2.6, 10.6], 36, 17, l('lèvre pare-poussière', 'dust lip'));
    if (v2)
      de.leader(
        [56.5, 16.5],
        14,
        -18,
        l('V-ring déflecteur (tourne avec l’arbre)', 'V-ring slinger (turns with the shaft)'),
      );
    p.text(de.map([60, 30.5]), l('EAU →', 'WATER →'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'end',
    });
    p.text(de.map([29, 30.5]), l('← SEC', '← DRY'), { size: 2.2, weight: 'bold', color: COLORS.muted });
    p.text(
      de.map([(box.z0 + box.z1) / 2, box.r0 - 5]),
      l('DÉTAIL E — étanchéité de cloison', 'DETAIL E — partition seal'),
      { size: 2.8, weight: 'bold', anchor: 'middle' },
    );
    p.text(de.map([(box.z0 + box.z1) / 2, box.r0 - 7.2]), '2:1', {
      size: 2.2,
      anchor: 'middle',
      mono: true,
      color: COLORS.muted,
    });

    // ---- material legend
    const mats: [HatchKind | 'magnet', Text][] = [
      ['steel', l('Acier / inox', 'Steel / stainless')],
      ['alu', l('Aluminium', 'Aluminium')],
      ['plastic', l('Plastique imprimé', 'Printed plastic')],
      ['pmma', l('PMMA', 'PMMA')],
      ['rubber', l('Élastomère NBR / EPDM', 'NBR / EPDM rubber')],
      ['copper', l('Cuivre (bobinage)', 'Copper (winding)')],
      ['magnet', l('Aimants NdFeB N52', 'NdFeB N52 magnets')],
    ];
    p.text([152, 190], l('MATIÈRES (hachures)', 'MATERIALS (hatching)'), { size: 2.2, weight: 'bold' });
    mats.forEach(([h, label], i) => {
      const y = 193 + i * 5.6;
      p.rect(
        [152, y],
        [161, y + 4],
        h === 'magnet' ? { w: W.thin, fill: '#c9ced6' } : { w: W.thin, hatch: h, fill: COLORS.paper },
      );
      p.text([164, y + 2], label, { size: 2, baseline: 'middle' });
    });

    // ---- notes under the detail
    let ny = 256;
    ny = note(
      d,
      14,
      ny,
      190,
      l(
        'Roulements 1–2 : palier fixe (bague extérieure de 2 en butée sur l’épaulement, 1 tenu par circlip). Roulement 3 : palier libre, glissant dans son alésage pour absorber la dilatation de l’arbre.',
        'Bearings 1–2: locating pair (outer ring of 2 against the shoulder, 1 held by a circlip). Bearing 3: floating, sliding in its bore to absorb shaft expansion.',
      ),
    );
    note(
      d,
      14,
      ny,
      190,
      l(
        'Porte-joint, entretoise et circlip : pièces de montage proposées (non modélisées en 3D).',
        'Seal carrier, spacer and circlip: suggested assembly parts (not modelled in 3D).',
      ),
      { color: COLORS.muted },
    );

    // ---- right column: parts list, fits, torques, assembly
    const X = 224;
    p.text([X, 14], l('NOMENCLATURE', 'PARTS LIST'), { size: 2.4, weight: 'bold' });
    const rows: Text[][] = [
      [
        '1',
        l('Arbre Ø20 h6 × 322, M16 + rainure 6', 'Shaft Ø20 h6 × 322, M16 + 6 mm keyway'),
        l('inox 316L rectifié', 'ground 316L'),
        '1',
      ],
      ['2', l('Roulement 1 (côté roue)', 'Bearing 1 (runner side)'), '6204-2RS C3', '1'],
      ['3', l('Roulement 2', 'Bearing 2'), '6204-2RS C3', '1'],
      ['4', l('Roulement 3 (palier libre)', 'Bearing 3 (floating)'), '6204-2RS C3', '1'],
      ['5', l('Joint à lèvre 20 × 35 × 7, double lèvre', 'Lip seal 20 × 35 × 7, double lip'), 'NBR', '1'],
      [
        '6',
        l('Porte-joint Ø60, vissé sur la cloison', 'Ø60 seal carrier, screwed on partition'),
        v2 ? 'alu 6082' : 'PETG',
        '1',
      ],
      v2
        ? ['7', l('Cartouche Ø124, 6 × M5 sur Ø104', 'Ø124 cartridge, 6 × M5 on Ø104'), 'alu 6082-T6', '1']
        : [
            '7',
            l('Palier imprimé, bride 120 × 120, 4 × M6', 'Printed housing, 120 × 120 flange, 4 × M6'),
            'PETG-CF 100 %',
            '1',
          ],
      [
        '8',
        l('Entretoise Ø20 / Ø28 entre bagues int.', 'Ø20 / Ø28 spacer between inner rings'),
        l('acier', 'steel'),
        '1',
      ],
      ['9', l('Cloison étanche ép. 10', '10 mm watertight partition'), 'PMMA', '1'],
      ['10', l('Moyeu Ø170 + bague + 22 augets (PL-T03)', 'Ø170 hub + ring + 22 buckets (PL-T03)'), 'PETG', '1'],
      [
        '11',
        l('Bride + douille Taper-Lock 1108 + clavette 6 × 6', 'Flange + Taper-Lock 1108 bush + 6 × 6 key'),
        l('acier / fonte', 'steel / cast iron'),
        '1',
      ],
      ['12', l('Rondelle + écrou M16 nylstop', 'Washer + M16 nyloc nut'), l('inox A4', 'A4 stainless'), '1'],
      [
        '13',
        l('Rotor Ø156 : cloche, culasse, 14 aimants', 'Ø156 rotor: bell, back iron, 14 magnets'),
        l('PETG / acier / N52', 'PETG / steel / N52'),
        '1',
      ],
      [
        '14',
        l('Stator 12 dents, alésage Ø68,4', '12-tooth stator, Ø68.4 bore'),
        l('tôles + cuivre', 'laminations + copper'),
        '1',
      ],
      ['15', l('Flasque arrière ép. 6 + bossage Ø47', '6 mm rear panel + Ø47 boss'), l('imprimé', 'printed'), '1'],
      ['16', l('Chapeau de graisse Ø44', 'Ø44 grease cap'), l('inox', 'stainless'), '1'],
    ];
    if (v2)
      rows.push([
        '17',
        l('Graisseur M6 + V-ring V-20A', 'M6 grease nipple + V-20A V-ring'),
        l('laiton / NBR', 'brass / NBR'),
        '1 + 1',
      ]);
    const rh = 4.1;
    d.table(
      X,
      16,
      [
        { label: l('Rep.', 'Item'), w: 8, align: 'middle' },
        { label: l('Désignation', 'Description'), w: 98 },
        { label: l('Matière / réf.', 'Material / ref.'), w: 64 },
        { label: l('Qté', 'Qty'), w: 11, align: 'end' },
      ],
      rows,
      rh,
    );
    let y = 16 + (rows.length + 1) * rh + 6;
    p.text([X, y - 2], l('AJUSTEMENTS (ISO 286)', 'FITS (ISO 286)'), { size: 2.4, weight: 'bold' });
    const fits: Text[][] = [
      [
        'a',
        l('Arbre / bagues int. 1-2-3', 'Shaft / inner rings 1-2-3'),
        'Ø20 k5',
        '+11 / +2',
        l('bague tournante : léger serrage', 'rotating ring: light press'),
      ],
      [
        'b',
        l('Logement roulements 1-2', 'Bearings 1-2 housing'),
        'Ø47 H7',
        '+25 / 0',
        v2
          ? l('alésé, bague fixe', 'bored, stationary ring')
          : l('imprimé puis alésé + Loctite 641', 'printed, reamed + Loctite 641'),
      ],
      [
        'c',
        l('Logement roulement 3', 'Bearing 3 housing'),
        'Ø47 H7',
        '+25 / 0',
        l('glissant : palier libre', 'sliding: floating bearing'),
      ],
      [
        'd',
        l('Portée du joint', 'Seal journal'),
        'Ø20 h6',
        '0 / −13',
        l('Ra ≤ 0,4 µm, chanfrein 15°', 'Ra ≤ 0.4 µm, 15° lead-in'),
      ],
      ['e', l('Logement du joint', 'Seal housing'), 'Ø35 H8', '+39 / 0', l('emmanché à la presse', 'pressed in')],
      [
        'f',
        l('Moyeu rotor / arbre', 'Rotor hub / shaft'),
        'Ø20 H7/h6',
        '+21 / −13',
        l('glissant + vis pointeau M6', 'slide fit + M6 set screw'),
      ],
      [
        'g',
        l('Douille conique / arbre', 'Taper bush / shaft'),
        'Ø20 H7/h6',
        '6 P9 / JS9',
        l('clavette 6 × 6 × 30', '6 × 6 × 30 key'),
      ],
    ];
    d.table(
      X,
      y,
      [
        { label: '', w: 6, align: 'middle' },
        { label: l('Portée', 'Seat'), w: 52 },
        { label: l('Ajust.', 'Fit'), w: 23 },
        { label: l('Écarts µm', 'Dev. µm'), w: 23 },
        { label: l('Remarque', 'Note'), w: 77 },
      ],
      fits,
      4.3,
    );
    y += 8 * 4.3 + 6;
    p.text([X, y - 2], l('COUPLES DE SERRAGE', 'TIGHTENING TORQUES'), { size: 2.4, weight: 'bold' });
    const torques: Text[][] = [
      [
        l('Douille Taper-Lock', 'Taper-Lock bush'),
        '2 × 1/4" BSW',
        '5,7 N·m',
        l('à sec, sans graisse', 'dry, no grease'),
      ],
      [l('Écrou de roue', 'Runner nut'), 'M16 A4 nylstop', '40 N·m', l('sécurité axiale', 'axial safety')],
      v2
        ? [l('Cartouche → cloison', 'Cartridge → partition'), '6 × M5 A4', '4 N·m', 'Loctite 243']
        : [
            l('Palier → cloison PMMA', 'Housing → PMMA partition'),
            '4 × M6 A4',
            '3 N·m',
            l('rondelles larges', 'wide washers'),
          ],
      [l('Bride → moyeu roue', 'Flange → runner hub'), '4 × M5 A4', '4 N·m', 'Loctite 243'],
      [l('Vis pointeau rotor', 'Rotor set screw'), 'M6 A4', '4 N·m', 'Loctite 243'],
    ];
    d.table(
      X,
      y,
      [
        { label: l('Assemblage', 'Joint'), w: 58 },
        { label: l('Visserie', 'Fasteners'), w: 46 },
        { label: l('Couple', 'Torque'), w: 22, align: 'end' },
        { label: l('Frein / remarque', 'Locking / note'), w: 55 },
      ],
      torques,
      4.3,
    );
    y += 6 * 4.3 + 6;
    p.text([X, y - 2], l('MONTAGE', 'ASSEMBLY'), { size: 2.4, weight: 'bold' });
    y += 1;
    const steps: Text[] = [
      l(
        'Emmancher les roulements en appuyant uniquement sur la bague intérieure (tube Ø20/Ø28) ; jamais de coup sur la bague extérieure.',
        'Press the bearings on by the inner ring only (Ø20/Ø28 tube); never strike the outer ring.',
      ),
      v2
        ? l(
            'Monter la cartouche à l’établi (roulements, entretoise, circlip, graisse hydrofuge) puis la visser d’un bloc sur la cloison.',
            'Build the cartridge on the bench (bearings, spacer, circlip, waterproof grease) and bolt it to the partition as one unit.',
          )
        : l(
            'Graisser le logement imprimé, monter 2, l’entretoise, 1 et le circlip, puis visser le palier sur la cloison.',
            'Grease the printed housing, fit 2, the spacer, 1 and the circlip, then bolt the housing to the partition.',
          ),
      l(
        'Joint : lèvre et ressort tournés vers l’eau, lèvre graissée, passer l’arbre avec une douille de protection sur la rainure.',
        'Seal: lip and spring facing the water, lip greased, slide the shaft through with a sleeve over the keyway.',
      ),
      l(
        'Flasque arrière en dernier en tournant l’arbre à la main : il doit rester libre.',
        'Rear panel last while turning the shaft by hand: it must stay free.',
      ),
    ];
    steps.forEach((s, i) => {
      y = note(d, X, y, 181, s, { bullet: `${i + 1}.` });
    });
    return d;
  },
};
