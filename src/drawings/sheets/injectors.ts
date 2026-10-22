import { l, tr, type L } from '../../i18n';
import { COLORS, Drawing, W, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';

// PL-T04 — injectors. Geometry from src/three/turbine/hydraulics.ts and dims.ts (m → mm):
// spear injector on the roof (axis x = −115, nozzle exit y = 380, needle stroke 24 mm),
// side nozzle on the left wall (axis y = 115, exit x = −150), V2 deflector pivots and angles
// from turbine/index.ts. Inner bores are not modelled in 3D: they are drawn with a 4–6 mm wall.

const PAPER = COLORS.paper;
const deg = Math.PI / 180;
const G = 9.81;
const INSERTS: [number, string, L][] = [
  [4, '#8a9099', l('gris', 'grey')],
  [5, '#2b6cd1', l('bleu', 'blue')],
  [6, '#2f9e44', l('vert', 'green')],
  [7, '#e8b923', l('jaune *', 'yellow *')],
  [8, '#f08c00', l('orange', 'orange')],
  [10, '#d6336c', l('magenta', 'magenta')],
  [12, '#7048e8', l('violet *', 'violet *')],
];
/** Q = Cd·π·d²/4·√(2gH), Cd = 0.96, in L/s. */
const flow = (dMm: number, h: number) => 0.96 * ((Math.PI * (dMm / 1000) ** 2) / 4) * Math.sqrt(2 * G * h) * 1000;
const dec = (v: number, n: number): L => l(v.toFixed(n).replace('.', ','), v.toFixed(n));
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y]);
const flipY = (pts: Pt[], c: number): Pt[] => pts.map(([x, y]) => [x, 2 * c - y]);

function note(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  text: Text,
  o: { size?: number; bullet?: string; color?: string } = {},
): number {
  const size = o.size ?? 1.9;
  const indent = o.bullet ? 3.5 : 0;
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
  rows.forEach((r, i) => p.text([x + indent, y + i * size * 1.7], r, { size, baseline: 'top', color: o.color }));
  return y + rows.length * size * 1.7 + size * 0.5;
}

/** Spear (needle) outline, right half, for a lift s: olive ellipsoid 23 × 50.6 + tip cone, rod Ø9. */
function needleHalf(s: number): Pt[] {
  const pts: Pt[] = [];
  for (let y = 379; y <= 433.3; y += 0.6) {
    const cone = y <= 401 ? (8.5 * (y - 379)) / 22 : 0;
    const e = (y - 410) / 25.3;
    const ell = Math.abs(e) < 1 ? 11.5 * Math.sqrt(1 - e * e) : 0;
    pts.push([Math.max(cone, ell, y > 420 ? 4.5 : 0), y + s]);
  }
  pts.push([4.5, 650 + s]);
  return pts;
}

/** Section of the spear injector in the plane z = 110 (x' = x + 115, y = machine height). */
function spearSection(v: View): void {
  const st = (h: Stroke['hatch'], w = W.medium): Stroke => ({ w, hatch: h, fill: PAPER });
  // water in the bore and the jet (drawn first, under the parts)
  v.polyline(
    [
      [-22, 630],
      [22, 630],
      [22, 446],
      [7.5, 388],
      [6, 380],
      [-6, 380],
      [-7.5, 388],
      [-22, 446],
      [-22, 530],
      [-62.5, 530],
      [-62.5, 570],
      [-22, 570],
    ],
    { closed: true, w: 0, fill: COLORS.waterFill },
  );
  v.rect([-6, 336], [6, 380], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.line([0, 372], [0, 340], { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  // body (right half closed, left half split by the side inlet)
  v.polyline(
    [
      [32, 640],
      [32, 470],
      [11.5, 388],
      [7.5, 388],
      [22, 446],
      [22, 630],
      [9, 630],
      [9, 640],
    ],
    { closed: true, ...st('steel') },
  );
  v.polyline(
    [
      [-9, 640],
      [-9, 630],
      [-22, 630],
      [-22, 570],
      [-62.5, 570],
      [-62.5, 576],
      [-32, 576],
      [-32, 640],
    ],
    { closed: true, ...st('steel') },
  );
  v.polyline(
    [
      [-62.5, 530],
      [-22, 530],
      [-22, 446],
      [-7.5, 388],
      [-11.5, 388],
      [-32, 470],
      [-32, 524],
      [-62.5, 524],
    ],
    { closed: true, ...st('steel') },
  );
  // stainless nozzle tip (orifice Ø12)
  v.polyline(
    [
      [6, 380],
      [12, 380],
      [12, 388],
      [7.5, 388],
    ],
    { closed: true, ...st('alu', W.thin) },
  );
  v.polyline(
    [
      [-6, 380],
      [-12, 380],
      [-12, 388],
      [-7.5, 388],
    ],
    { closed: true, ...st('alu', W.thin) },
  );
  // gland nut + packing
  for (const sg of [1, -1]) {
    v.polyline(
      mirrorIf(
        [
          [9, 640],
          [20, 640],
          [20, 662],
          [5, 662],
          [5, 658],
          [9, 658],
        ],
        sg,
      ),
      { closed: true, ...st('steel', W.thin) },
    );
    v.polyline(
      mirrorIf(
        [
          [5, 640],
          [9, 640],
          [9, 658],
          [5, 658],
        ],
        sg,
      ),
      { closed: true, ...st('rubber', W.thin) },
    );
  }
  // roof flange (printed), gasket, roof sheet, 4 × M5
  for (const sg of [1, -1]) {
    v.polyline(
      mirrorIf(
        [
          [30.5, 460],
          [50, 460],
          [50, 468],
          [30.5, 468],
        ],
        sg,
      ),
      { closed: true, ...st('plastic', W.thin) },
    );
    v.polyline(
      mirrorIf(
        [
          [30.5, 468],
          [40, 468],
          [40, 470],
          [30.5, 470],
        ],
        sg,
      ),
      { closed: true, ...st('rubber', W.thin) },
    );
    v.polyline(
      mirrorIf(
        [
          [30.5, 458],
          [sg > 0 ? 66 : 80, 458],
          [sg > 0 ? 66 : 80, 460],
          [30.5, 460],
        ],
        sg,
      ),
      { closed: true, w: W.thin, fill: COLORS.ink },
    );
    v.rect([sg * 37.5, 452], [sg * 42.5, 468], { w: W.thin, fill: PAPER });
    v.rect([sg * 36, 468], [sg * 44, 472], { w: W.thin, fill: PAPER });
  }
  // spear: closed (solid) and fully open (phantom, +24 mm)
  const half = needleHalf(0);
  v.polyline([...half, ...mirror(half).reverse()], { closed: true, w: W.medium, fill: PAPER });
  const open = needleHalf(24);
  v.polyline([...open, ...mirror(open).reverse()], { closed: true, w: W.thin, dash: 'phantom', color: COLORS.muted });
  // operating spindle + handwheel (not sectioned)
  v.rect([-5, 650], [5, 712], { w: W.medium, fill: PAPER });
  v.line([-4.5, 650], [4.5, 650], { w: W.thin });
  for (const sg of [1, -1]) {
    v.rect([sg * 8, 700], [sg * 33, 704], { w: W.thin, fill: PAPER });
    v.circle([sg * 38, 702], 5, { w: W.medium, fill: '#f3d5d2' });
  }
  v.rect([-8, 696], [8, 708], { w: W.medium, fill: PAPER });
  // PVC Ø50 riser end into the side inlet
  v.rect([-100, 525], [-62.5, 575], { w: W.medium, fill: PAPER });
  v.polyline(
    [
      [-100, 577],
      [-103, 560],
      [-97, 540],
      [-100, 523],
    ],
    { w: W.thin },
  );
  v.center([0, 330], [0, 716]);
  v.center([-104, 550], [-20, 550]);
}

const mirrorIf = (pts: Pt[], sg: number): Pt[] => (sg > 0 ? pts : mirror(pts));

/** Side injector section in the plane z = 110 (x machine, y' = y − 115). */
function sideSection(v: View, v2: boolean, d: number): void {
  const st = (h: Stroke['hatch'], w = W.medium): Stroke => ({ w, hatch: h, fill: PAPER });
  const both = (pts: Pt[], s: Stroke) => {
    v.polyline(pts, { closed: true, ...s });
    v.polyline(flipY(pts, 0), { closed: true, ...s });
  };
  const ro = (x: number, r0: number, r1: number, x0: number, x1: number) => r0 + ((r1 - r0) * (x - x0)) / (x1 - x0);
  // water + jet
  const bore: Pt[] = v2
    ? [
        [-450, 20],
        [-409, 19],
        [-161, 7],
        [-152, 7],
        [-150.5, d / 2],
        [-149, d / 2],
      ]
    : [
        [-480, 22],
        [-422, 20],
        [-410, 20],
        [-175, ro(-175, 26, 11, -410, -150) - 6],
        [-158, d / 2],
        [-150, d / 2],
      ];
  v.polyline([...bore, ...flipY(bore, 0).reverse()], { closed: true, w: 0, fill: COLORS.waterFill });
  const exit = v2 ? -149 : -150;
  v.rect([exit, -d / 2], [-125, d / 2], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.line([exit + 4, 0], [-126, 0], { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  // housing wall (2 mm alu) and the reinforcing plate
  both(
    [
      [-290, v2 ? 20 : 19.5],
      [-288, v2 ? 20 : 19.5],
      [-288, 62],
      [-290, 62],
    ],
    { w: W.thin, fill: COLORS.ink },
  );
  both(
    [
      [-298, v2 ? 20 : 19.5],
      [-290, v2 ? 20 : 19.5],
      [-290, v2 ? 50 : 45],
      [-298, v2 ? 50 : 45],
    ],
    st(v2 ? 'alu' : 'plastic', W.thin),
  );
  if (v2) {
    // bayonet collar (colour = nozzle size) with two grip lugs, DN25 flange, aluminium lance
    v.rect([-490, 22], [-450, 25], st('plastic', W.thin));
    v.rect([-490, -25], [-450, -22], st('plastic', W.thin));
    both(
      [
        [-450, 20],
        [-430, 20],
        [-430, 48],
        [-450, 48],
      ],
      { w: W.medium, hatch: 'plastic', fill: '#d3ecd9' },
    );
    both(
      [
        [-465, 44],
        [-445, 44],
        [-445, 56],
        [-465, 56],
      ],
      { w: W.thin, fill: PAPER },
    );
    both(
      [
        [-430, 19.5],
        [-423, 19.5],
        [-423, 24],
        [-430, 24],
      ],
      st('alu', W.thin),
    );
    both(
      [
        [-423, 19.4],
        [-409, 19],
        [-409, 42],
        [-423, 42],
      ],
      st('alu'),
    );
    both(
      [
        [-409, 19],
        [-409, 24],
        [-161, 14.4],
        [-161, 11.5],
        [-152, 11.5],
        [-152, 7],
        [-161, 7],
      ],
      st('alu'),
    );
    // nozzle insert (coloured cap) with O-ring and bayonet pin on the spigot
    both(
      [
        [-161, 11.5],
        [-161, 16],
        [-149, 16],
        [-149, d / 2],
        [-150.5, d / 2],
        [-152, 7],
        [-152, 11.5],
      ],
      { w: W.medium, hatch: 'plastic', fill: '#d3ecd9' },
    );
    for (const sg of [1, -1]) {
      v.circle([-157.5, sg * 11.5], 1.1, { w: W.thin, fill: COLORS.ink });
      v.rect([-155, sg * 11.5], [-153.5, sg * 13.2], { w: W.thin, fill: PAPER });
    }
  } else {
    v.rect([-480, 22], [-422, 25], st('plastic', W.thin));
    v.rect([-480, -25], [-422, -22], st('plastic', W.thin));
    both(
      [
        [-422, 20],
        [-410, 20],
        [-410, 40],
        [-422, 40],
      ],
      st('plastic'),
    );
    const r175 = ro(-175, 26, 11, -410, -150);
    both(
      [
        [-410, 20],
        [-410, 26],
        [-150, 11],
        [-150, d / 2],
        [-158, d / 2],
        [-175, r175 - 6],
      ],
      st('plastic'),
    );
    both(
      [
        [-156, 11.2],
        [-150, 11],
        [-150, 12.5],
        [-156, 12.5],
      ],
      { w: W.thin, fill: '#9aa0a6' },
    );
    for (const sg of [1, -1]) v.rect([-430, sg * 26], [-422, sg * 34], { w: W.thin, fill: PAPER });
  }
  const left = v2 ? -490 : -480;
  v.polyline(
    [
      [left, 27],
      [left - 3, 10],
      [left + 3, -10],
      [left, -27],
    ],
    { w: W.thin },
  );
  v.center([left - 4, 0], [-122, 0]);
}

type Box = { x0: number; x1: number; y0: number; y1: number };

/** Sutherland–Hodgman clip of a closed polygon against an axis-aligned box. */
function clip(pts: Pt[], b: Box): Pt[] {
  const edges: [(p: Pt) => boolean, (p: Pt, q: Pt) => Pt][] = [
    [(p) => p[0] >= b.x0, (p, q) => [b.x0, p[1] + ((q[1] - p[1]) * (b.x0 - p[0])) / (q[0] - p[0])]],
    [(p) => p[0] <= b.x1, (p, q) => [b.x1, p[1] + ((q[1] - p[1]) * (b.x1 - p[0])) / (q[0] - p[0])]],
    [(p) => p[1] >= b.y0, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y0 - p[1])) / (q[1] - p[1]), b.y0]],
    [(p) => p[1] <= b.y1, (p, q) => [p[0] + ((q[0] - p[0]) * (b.y1 - p[1])) / (q[1] - p[1]), b.y1]],
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

/** Partial front view (machine x, y) of the runner, both jets and the V2 deflectors. */
function jetGeometry(v: View, v2: boolean, box: Box): void {
  const ring = (r: number, s: Stroke) => {
    const a = (Math.acos(Math.min(1, box.x1 / r)) * 180) / Math.PI;
    v.arc([0, 230], r, a, 360 - a, s);
  };
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const pts: Pt[] = [
      [87.5, 0],
      [154.5, 0],
    ];
    for (let k = 0; k <= 14; k++) {
      const e = 0.985 - (1.97 * k) / 14;
      pts.push([121 + e * 34, 2.4 + 16.25 * Math.sqrt(1 - e * e)]);
    }
    const c = clip(
      pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), 230 + x * Math.sin(a) + y * Math.cos(a)] as Pt),
      box,
    );
    if (c.length > 2) v.polyline(c, { closed: true, w: W.thin, fill: PAPER });
  }
  ring(87, { w: W.thin });
  ring(115, { w: W.thin, dash: 'center', color: COLORS.muted });
  ring(154.5, { w: W.thin, dash: 'hidden', color: COLORS.muted });
  v.polyline(
    [
      [box.x1, 60],
      [box.x1 - 3, 180],
      [box.x1 + 3, 280],
      [box.x1, 400],
    ],
    { w: W.thin },
  );
  v.center([-150, 230], [box.x1 + 2, 230]);
  v.center([0, 60], [0, 400]);
  // roof sheet, spear injector (flange, cone, stainless tip) and side nozzle
  v.rect([box.x0, 458], [-30, 460], { w: W.thin, fill: COLORS.ink });
  v.rect([-165, 460], [-65, 468], { w: W.medium, fill: PAPER });
  v.polyline(
    [
      [-147, box.y1],
      [-147, 470],
      [-126, 386],
      [-104, 386],
      [-83, 470],
      [-83, box.y1],
    ],
    { w: W.medium },
  );
  v.rect([-127, 380], [-103, 388], { w: W.medium, fill: PAPER });
  if (v2) {
    v.polyline(
      [
        [box.x0, 131.8],
        [-161, 129.4],
        [-161, 100.6],
        [box.x0, 98.2],
      ],
      { w: W.medium, fill: PAPER },
    );
    v.rect([-161, 99], [-149, 131], { w: W.medium, fill: '#d3ecd9' });
  } else {
    v.polyline(
      [
        [box.x0, 128.7],
        [-150, 126],
        [-150, 104],
        [box.x0, 101.3],
      ],
      { w: W.medium, fill: PAPER },
    );
    v.rect([-156, 102.5], [-150, 127.5], { w: W.thin, fill: '#9aa0a6' });
  }
  // jets, tangent to the pitch circle
  v.rect([-121, 230], [-109, 380], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.rect([v2 ? -149 : -150, 112], [0, 118], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.center([-115, 222], [-115, box.y1]);
  v.center([box.x0, 115], [6, 115]);
  for (const t of [
    [-115, 230],
    [0, 115],
  ] as Pt[])
    v.circle(t, 2, { w: W.thin, color: COLORS.water, fill: COLORS.water });
  if (!v2) return;
  // deflector blades: rest (solid) and tripped (phantom); the cut jet is thrown at the wall
  const tip = (pivot: Pt, len: number, ang: number): Pt => [
    pivot[0] + Math.cos(ang * deg) * len,
    pivot[1] + Math.sin(ang * deg) * len,
  ];
  for (const [pivot, len, a0, a1] of [
    [[-170, 400], 88, -66, -31],
    [[-170, 50], 93, 18.7, 53.7],
  ] as [Pt, number, number, number][]) {
    v.line(pivot, [pivot[0] + 70, pivot[1]], { w: W.thin, color: COLORS.muted, dash: 'center' });
    v.line(pivot, tip(pivot, len, a0), { w: W.thick, color: COLORS.v2 });
    v.line(pivot, tip(pivot, len, a1), { w: W.medium, color: COLORS.v2, dash: 'phantom' });
    v.arc(pivot, 34, 0, a0, { w: W.thin, color: COLORS.v2 });
    v.arc(pivot, 50, 0, a1, { w: W.thin, color: COLORS.v2 });
    v.circle(pivot, 7, { w: W.medium, fill: PAPER, color: COLORS.v2 });
    v.circle(pivot, 5, { w: W.thin, color: COLORS.v2 });
  }
  for (const [from, to] of [
    [
      [-115, 366],
      [-182, 328],
    ],
    [
      [-122, 115],
      [-186, 82],
    ],
  ] as [Pt, Pt][]) {
    v.line(from, to, { w: W.medium, color: COLORS.water, dash: 'hidden' }).setAttribute('marker-end', 'url(#arrow)');
  }
}

export const injectors: DrawingSheet = {
  id: 'injectors',
  number: 'PL-T04',
  group: 'turbine',
  title: l('Injecteurs et jets', 'Injectors and jets'),
  description: l(
    'Coupe de l’injecteur à pointeau du haut (1:2) avec l’olive fermée et ouverte (course 24 mm), coupe de l’injecteur latéral — buse fixe imprimée en V1, lance alu à inserts à baïonnette en V2 — et tableau des inserts Ø4 à Ø12 avec leur débit à 76 m et 21 m de chute nette. À droite, la géométrie des jets (tangents au cercle primitif) et, en V2, la cinématique des déflecteurs de sécurité.',
    'Section of the top spear injector (1:2) with the olive closed and open (24 mm stroke), section of the side injector — printed fixed nozzle on V1, aluminium lance with bayonet inserts on V2 — and a table of Ø4 to Ø12 inserts with their flow at 76 m and 21 m net head. On the right, the jet geometry (tangent to the pitch circle) and, on V2, the kinematics of the safety deflectors.',
  ),
  scene: 'turbine',
  parts: ['injector-top', 'injector-side', 'injector-quick', 'deflector', 'valve-branch'],
  render(ctx) {
    const v2 = ctx.version === 'v2';
    const d = new Drawing();
    d.frame({
      title: l('Injecteurs et jets', 'Injectors and jets'),
      subtitle: v2
        ? l('V2 : lance à inserts baïonnette + déflecteurs de sécurité', 'V2: bayonet insert lance + safety deflectors')
        : l(
            'V1 prototype : buse fixe imprimée Ø6 (Ø8 en option), sans déflecteur',
            'V1 prototype: printed Ø6 fixed nozzle (Ø8 option), no deflector',
          ),
      number: 'PL-T04',
      scale: '1:2',
    });
    const p = d.paper();

    // ---- spear injector, section B–B 1:2 (axis x' = 0)
    const sv = d.view(66, 375, 0.5);
    spearSection(sv);
    sv.dim([-6, 380], [6, 380], 13, { dir: 'h', label: 'Ø12', size: 2.2 });
    sv.dim([-43, 702], [43, 702], -6, { dir: 'h', size: 2.2, prefix: 'Ø' });
    sv.dim([12, 410], [12, 434], 12, { dir: 'v', size: 2.2, label: l('course 24', 'stroke 24') });
    sv.dim([50, 380], [50, 468], 6, { dir: 'v', size: 2.2 });
    sv.dim([50, 380], [43, 708], 13, { dir: 'v', size: 2.2 });
    sv.leader([32, 600], 8, -8, 'Ø64');
    sv.leader([-26, 600], -16, -10, l('corps métal', 'metal body'));
    sv.leader([-6, 400], -18, -4, l('olive fermée', 'olive closed'));
    sv.leader([-8, 440], -20, 2, l('ouverte (fantôme)', 'open (phantom)'), { color: COLORS.muted });
    sv.leader([-10, 384], -14, 12, l('buse inox', 'stainless tip'));
    sv.leader([-14, 650], -12, -14, l('presse-étoupe', 'gland'));
    sv.leader([-38, 702], -8, -8, l('volant', 'handwheel'));
    sv.leader([-80, 560], 2, -16, 'PVC Ø50');
    sv.leader([-45, 464], -6, -10, l('bride 4 × M5', '4 × M5 flange'));
    sv.caption([-10, 302], l('INJECTEUR À POINTEAU — coupe', 'SPEAR INJECTOR — section'), '1:2');

    // ---- side injector, section 1:2
    const dSide = 6;
    const exit = v2 ? -149 : -150;
    const xv = d.view(350, 58, 0.5);
    sideSection(xv, v2, dSide);
    xv.dim([-290, 62], [exit, 16], -5, { dir: 'h', size: 2.2 });
    xv.dim([v2 ? -423 : -422, 42], [exit, 16], -22, { dir: 'h', size: 2.2 });
    xv.dim([exit, -dSide / 2], [exit, dSide / 2], 10, { dir: 'v', label: `Ø${dSide}`, size: 2.2 });
    const lab = (at: Pt, ex: number, ey: number, t: Text) => {
      const q = xv.map(at);
      xv.leader(at, ex - q[0], ey - q[1], t);
    };
    lab([-294, -50], 209, 91, l('paroi + platine', 'wall + plate'));
    p.text(xv.map([v2 ? -416 : -416, 47]), v2 ? 'DN25' : l('4 × M6', '4 × M6'), { size: 2, anchor: 'middle' });
    if (v2) {
      lab([-447, -50], 131, 91, l('collier baïonnette ¼ tour, oreilles', '¼-turn bayonet collar, grips'));
      lab([-240, -18], 232, 98, l('lance alu', 'alu lance'));
      lab([-155, -16], 268, 91, l('insert + joint', 'insert + O-ring'));
    } else {
      lab([-440, -24], 131, 91, l('tube PVC Ø50 → bride imprimée', 'PVC Ø50 pipe → printed flange'));
      lab([-260, -16], 232, 98, l('corps imprimé PETG / ASA', 'printed PETG / ASA body'));
      lab([-153, -12.5], 268, 91, l('bague repère', 'marker ring'));
    }
    xv.caption(
      [-400, -92],
      v2
        ? l('LANCE À INSERTS (V2) — coupe', 'INSERT LANCE (V2) — section')
        : l('BUSE FIXE IMPRIMÉE (V1) — coupe', 'PRINTED FIXED NOZZLE (V1) — section'),
      '1:2',
    );

    // ---- nozzle inserts table
    const tx = 114;
    const ty = 120;
    p.text(
      [tx, ty - 3],
      l('INSERTS DE BUSE — Q = 0,96 · π d²/4 · √(2 g H)', 'NOZZLE INSERTS — Q = 0.96 · π d²/4 · √(2 g H)'),
      { size: 2.3, weight: 'bold' },
    );
    const rows: Text[][] = INSERTS.map(([dm, , name]) => [
      `Ø${dm}`,
      name,
      l(`${tr(dec(flow(dm, 76), 2))} L/s`, `${flow(dm, 76).toFixed(2)} L/s`),
      l(`${tr(dec(flow(dm, 21), 2))} L/s`, `${flow(dm, 21).toFixed(2)} L/s`),
      `${Math.round(1000 * G * (flow(dm, 76) / 1000) * 76)} W`,
      dm <= 6 ? 'S' : dm === 7 ? 'S / L' : 'L',
    ]);
    const cols = [
      { label: l('Buse', 'Nozzle'), w: 16 },
      { label: l('Couleur', 'Colour'), w: 30 },
      { label: l('Q à 76 m', 'Q at 76 m'), w: 28, align: 'end' as const },
      { label: l('Q à 21 m', 'Q at 21 m'), w: 28, align: 'end' as const },
      { label: l('P hydr. 76 m', 'Hydr. P 76 m'), w: 30, align: 'end' as const },
      { label: l('Augets', 'Buckets'), w: 20, align: 'middle' as const },
    ];
    const rh = 4.8;
    d.table(tx, ty, cols, rows, rh);
    INSERTS.forEach(([, color], i) => {
      const y = ty + rh * (i + 1) + 1.1;
      p.rect([tx + 16 + 30 - 7, y], [tx + 16 + 30 - 2, y + rh - 2.2], { w: W.thin, fill: color });
    });
    let ny = ty + rh * (INSERTS.length + 1) + 3;
    ny = note(
      d,
      tx,
      ny,
      152,
      l(
        'Chute nette 76 m (site A, jet ≈ 38,6 m/s) et 21 m (site B, ≈ 20,3 m/s) ; le débit réel baisse avec les pertes de la conduite (Ø55 int., 350 m). * Ø7 et Ø12 : inserts optionnels, non modélisés. Jeu d’augets : S jusqu’à Ø6, L dès Ø8.',
        'Net head 76 m (site A, jet ≈ 38.6 m/s) and 21 m (site B, ≈ 20.3 m/s); real flow drops with penstock losses (55 ID, 350 m). * Ø7 and Ø12: optional inserts, not modelled. Bucket set: S up to Ø6, L from Ø8.',
      ),
    );
    ny = note(
      d,
      tx,
      ny,
      152,
      l(
        `Données constructeur Hydronome (site officiel, 2024) : buse Ø14 maxi (Q ≈ ${tr(dec(flow(14, 76), 1))} L/s à 76 m), 2 injecteurs ou 1 injecteur variable.`,
        `Hydronome maker data (official site, 2024): Ø14 max nozzle (Q ≈ ${flow(14, 76).toFixed(1)} L/s at 76 m), 2 injectors or 1 variable injector.`,
      ),
      { color: COLORS.v2 },
    );

    // ---- jet geometry + deflector kinematics, partial view 1:2
    const box: Box = { x0: -196, x1: 12, y0: 40, y1: 470 };
    const jv = d.view(394, 255, 0.5);
    jetGeometry(jv, v2, box);
    jv.dim([-115, 230], [0, 230], 0, { dir: 'h', size: 2 });
    jv.dim([0, 115], [0, 230], 0, { dir: 'v', size: 2 });
    jv.dim([-121, 380], [-121, 333.2], -4, { dir: 'v', size: 2 });
    jv.dim([-103, 380], [-87.45, 357.4], -3, { size: 2, label: tr(dec(27.5, 1)) });
    jv.dimRadius([0, 230], 115, 200, { label: 'R115', size: 2 });
    jv.leader([-115, 230], -12, 10, l('tangence', 'tangent point'), { color: COLORS.water });
    jv.leader([-109, 345], 10, 4, l('jet libre', 'free jet'), { color: COLORS.water });
    jv.leader([-60, 230 - 154.5 * Math.sin(67 * deg)], -6, 10, l('Ø309 augets', 'Ø309 tips'));
    if (v2) {
      p.text(jv.map([-144, 362]), '−66°', { size: 2, mono: true, color: COLORS.v2, anchor: 'end' });
      p.text(jv.map([-98, 388]), '−31°', { size: 2, mono: true, color: COLORS.v2 });
      p.text(jv.map([-128, 58]), '18,7°', { size: 2, mono: true, color: COLORS.v2 });
      p.text(jv.map([-132, 100]), '53,7°', { size: 2, mono: true, color: COLORS.v2, anchor: 'end' });
      jv.leader([-170, 400], -4, -10, l('pivot Ø10', 'Ø10 pivot'), { color: COLORS.v2 });
      jv.leader([-160, 330], -2, -8, l('jet coupé → paroi', 'cut jet → wall'), { color: COLORS.water });
    }
    jv.caption(
      [-92, 28],
      v2 ? l('JETS ET DÉFLECTEURS', 'JETS AND DEFLECTORS') : l('GÉOMÉTRIE DES JETS', 'JET GEOMETRY'),
      tr(l('1:2 — vue partielle', '1:2 — partial view')),
    );

    // ---- jet notes (bottom centre)
    let ry = Math.max(ny + 2, 186);
    p.text([tx, ry], l('JETS — CALAGE', 'JETS — SETTING OUT'), { size: 2.3, weight: 'bold' });
    ry += 2.5;
    const jn: Text[] = [
      l(
        'Les deux jets sont dans le plan médian de la roue et tangents au cercle primitif Ø230 : jet haut à 115 à gauche de l’axe, jet latéral à 115 sous l’axe.',
        'Both jets lie in the runner mid-plane, tangent to the Ø230 pitch circle: top jet 115 left of the axis, side jet 115 below it.',
      ),
      l(
        'Buses à 189 du centre de roue : jet libre ≈ 47 avant le premier auget, jeu buse / augets ≈ 27,5 (jeu L) – 33 (jeu S).',
        'Nozzles 189 from the runner centre: free jet ≈ 47 before the first bucket, nozzle / bucket clearance ≈ 27.5 (L set) – 33 (S set).',
      ),
      v2
        ? l(
            'Déflecteurs : volets inox sur axes Ø10 traversant la cloison. Repos −66° / 18,7° (trait plein), déclenchés −31° / 53,7° (fantôme) en < 0,5 s par ressort, gâche 12 V à manque de courant. Le jet coupé part contre la paroi, la conduite reste en débit : pas de coup de bélier.',
            'Deflectors: stainless blades on Ø10 shafts through the partition. Rest −66° / 18.7° (solid), tripped −31° / 53.7° (phantom) in < 0.5 s by spring, fail-safe 12 V latch. The cut jet goes to the wall and the penstock keeps flowing: no water hammer.',
          )
        : l(
            'V1 : pas de déflecteur ; en cas de perte de charge électrique, seul le délesteur empêche l’emballement de la roue (voir la V2).',
            'V1: no deflector; on loss of electrical load, only the dump load keeps the runner from racing (see V2).',
          ),
    ];
    jn.forEach((t, i) => {
      ry = note(d, tx, ry, 172, t, { bullet: `${i + 1}.` });
    });

    // ---- spear notes (bottom left)
    let sy = 234;
    const sn: Text[] = [
      l(
        'L’olive Ø23 vient en appui sur le cône de buse (fermé) ; une levée de 24 mm (≈ 2,5 tours de volant) dégage tout l’orifice Ø12.',
        'The Ø23 olive seats on the nozzle cone (closed); a 24 mm lift (≈ 2.5 handwheel turns) clears the whole Ø12 orifice.',
      ),
      l(
        'Le débit varie, la vitesse du jet reste ≈ √(2 g H). Fermer lentement : coup de bélier.',
        'Flow changes, jet speed stays ≈ √(2 g H). Close slowly: water hammer.',
      ),
    ];
    sn.forEach((t, i) => {
      sy = note(d, 14, sy, 92, t, { bullet: `${i + 1}.`, size: 1.8 });
    });
    return d;
  },
};
