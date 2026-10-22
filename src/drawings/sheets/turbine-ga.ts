import { l, tr } from '../../i18n';
import { COLORS, Drawing, W, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';

// PL-T01 — general arrangement. All values from src/three/turbine (dims.ts, housing.ts,
// hydraulics.ts, drivetrain.ts, generator.ts), metres → mm. Machine origin: underside of
// the base plate, centred; +Z = window side; shaft axis at y = 230.

const BASE_Y = 920;
const AXIS = 230;
const PROFILE: Pt[] = [
  [-290, 20],
  [290, 20],
  [290, 300],
  [180, 460],
  [-180, 460],
  [-290, 300],
];
const ZB = [23, -70, -165]; // bearing centres
const PAPER = COLORS.paper;

/** Offset a convex counter-clockwise polygon inwards by d (same idea as dims.ts profile()). */
function inset(poly: Pt[], d: number): Pt[] {
  const n = poly.length;
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const dir: Pt = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
    return { p: [p[0] - dir[1] * d, p[1] + dir[0] * d] as Pt, dir };
  });
  return lines.map((cur, i) => {
    const prev = lines[(i - 1 + n) % n];
    const cross = prev.dir[0] * cur.dir[1] - prev.dir[1] * cur.dir[0];
    const t = ((cur.p[0] - prev.p[0]) * cur.dir[1] - (cur.p[1] - prev.p[1]) * cur.dir[0]) / cross;
    return [prev.p[0] + prev.dir[0] * t, prev.p[1] + prev.dir[1] * t] as Pt;
  });
}

/** Pipe of radius r along an orthogonal centre line with bends of radius R (quadratic fillets). */
function pipe(v: View, pts: Pt[], r: number, R = 70, st: Stroke = {}): void {
  const unit = (p: Pt, q: Pt): Pt => [
    (q[0] - p[0]) / Math.hypot(q[0] - p[0], q[1] - p[1]),
    (q[1] - p[1]) / Math.hypot(q[0] - p[0], q[1] - p[1]),
  ];
  const c: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const b = pts[i];
    const [u1, u2] = [unit(pts[i - 1], b), unit(b, pts[i + 1])];
    const [p1, p2]: Pt[] = [
      [b[0] - u1[0] * R, b[1] - u1[1] * R],
      [b[0] + u2[0] * R, b[1] + u2[1] * R],
    ];
    for (let t = 0; t <= 1.001; t += 0.1)
      c.push([0, 1].map((k) => (1 - t) ** 2 * p1[k] + 2 * t * (1 - t) * b[k] + t * t * p2[k]) as Pt);
  }
  c.push(pts[pts.length - 1]);
  for (let i = c.length - 1; i > 0; i--)
    if (Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]) < 1e-6) c.splice(i, 1);
  const side = (d: number): Pt[] =>
    c.map((p, i) => {
      const n = unit(c[Math.max(0, i - 1)], c[Math.min(c.length - 1, i + 1)]);
      return [p[0] - n[1] * d, p[1] + n[0] * d];
    });
  v.polyline([...side(r), ...side(-r).reverse()], { closed: true, w: W.medium, fill: PAPER, ...st });
  v.polyline(c, { w: W.thin, dash: 'center', color: COLORS.muted });
}

/** Wavy break across a pipe end at x (horizontal pipe) of radius r around y. */
function pipeBreak(v: View, x: number, y: number, r: number): void {
  v.polyline(
    [
      [x, y + r],
      [x - r * 0.3, y + r * 0.4],
      [x + r * 0.3, y - r * 0.4],
      [x, y - r],
    ],
    { w: W.thin },
  );
}

/** Pelton bucket outline seen along the shaft (L set, bucket.ts), rotated by a. */
function bucket(a: number): Pt[] {
  const [rc, A, B, t] = [121, 34, 13, 2.4];
  const pts: Pt[] = [
    [rc - 0.985 * A, 0],
    [rc + 0.985 * A, 0],
  ];
  for (let i = 0; i <= 16; i++) {
    const e = 0.985 - (1.97 * i) / 16;
    pts.push([rc + e * A, t + 1.25 * B * Math.sqrt(1 - e * e)]);
  }
  return pts.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), AXIS + x * Math.sin(a) + y * Math.cos(a)]);
}

/** Wrapped paragraph in paper space (optional bullet); returns the next free y. */
function note(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  text: Text,
  o: { size?: number; bullet?: string; color?: string } = {},
): number {
  const [size, indent] = [o.size ?? 1.9, o.bullet ? 3.5 : 0];
  const max = Math.floor((w - indent) / (size * 0.64));
  const rows = tr(text)
    .split(' ')
    .reduce<string[]>((acc, word) => {
      const last = acc[acc.length - 1];
      if (last !== undefined && (last + ' ' + word).length <= max) acc[acc.length - 1] = last + ' ' + word;
      else acc.push(word);
      return acc;
    }, []);
  const p = d.paper();
  if (o.bullet) p.text([x, y], o.bullet, { size, baseline: 'top', weight: 'bold', color: o.color });
  rows.forEach((r, i) => p.text([x + indent, y + i * size * 1.7], r, { size, baseline: 'top', color: o.color }));
  return y + rows.length * size * 1.7 + size * 0.5;
}

/** Front view (from the window side): housing, runner seen through the PMMA, injectors, jets. */
function frontView(v: View, v2: boolean): void {
  v.rect([-310, 0], [310, 20], { w: W.thick, fill: PAPER });
  // runner through the window
  for (let i = 0; i < 22; i++) v.polyline(bucket((i / 22) * Math.PI * 2), { closed: true, w: W.thin, fill: PAPER });
  v.circle([0, AXIS], 87, { w: W.thin, fill: PAPER });
  v.circle([0, AXIS], 45, { w: W.thin });
  v.circle([0, AXIS], 14.5, { w: W.thin });
  v.circle([0, AXIS], 115, { w: W.thin, dash: 'center', color: COLORS.muted });
  // top spear injector inside (cone + stainless tip) and its jet
  v.polyline(
    [
      [-144.5, 460],
      [-126, 386],
      [-104, 386],
      [-85.5, 460],
    ],
    { w: W.medium },
  );
  v.rect([-127, 380], [-103, 388], { w: W.medium, fill: PAPER });
  v.rect([-121, 230], [-109, 380], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  // side injector (V1 printed fixed nozzle / V2 aluminium lance + bayonet) and its jet
  if (v2) {
    v.rect([-423, 73], [-409, 157], { w: W.medium, fill: PAPER });
    v.rect([-450, 67], [-430, 163], { w: W.medium, fill: PAPER });
    v.line([-450, 91], [-430, 91], { w: W.thin });
    v.line([-450, 139], [-430, 139], { w: W.thin });
    v.rect([-465, 159], [-445, 171], { w: W.thin, fill: PAPER });
    v.rect([-465, 59], [-445, 71], { w: W.thin, fill: PAPER });
    v.polyline(
      [
        [-409, 139],
        [-161, 129],
        [-161, 101],
        [-409, 91],
      ],
      { closed: true, w: W.medium, fill: PAPER },
    );
    v.rect([-161, 99], [-149, 131], { w: W.medium, fill: '#2f9e44', opacity: 0.85 });
    v.rect([-298, 65], [-290, 165], { w: W.medium, fill: PAPER });
  } else {
    v.rect([-422, 75], [-410, 155], { w: W.medium, fill: PAPER });
    v.polyline(
      [
        [-410, 141],
        [-156, 126],
        [-156, 104],
        [-410, 89],
      ],
      { closed: true, w: W.medium, fill: PAPER },
    );
    v.rect([-156, 103], [-150, 127], { w: W.medium, fill: '#6b7178', opacity: 0.6 });
    v.rect([-298, 70], [-290, 160], { w: W.medium, fill: PAPER });
  }
  v.rect([-150, 112], [0, 118], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  // V2 fail-safe deflector blades (retracted) and toggle latches
  if (v2) {
    for (const [y, ang, len] of [
      [400, -66, 88],
      [50, 18.7, 93],
    ]) {
      const a = (ang * Math.PI) / 180;
      v.line([-170, y], [-170 + Math.cos(a) * len, y + Math.sin(a) * len], { w: W.thick, color: COLORS.v2 });
      v.circle([-170, y], 6, { w: W.thin, fill: PAPER, color: COLORS.v2 });
    }
    for (const s of [-1, 1]) {
      v.rect([s * 290, 50], [s * 299, 90], { w: W.thin, fill: PAPER });
      v.rect([s * 290, 14], [s * 298, 26], { w: W.thin, fill: PAPER });
    }
  }
  // housing: hexagonal "house" profile + folded return lips framing the window
  v.polyline(PROFILE, { closed: true, w: W.thick });
  v.polyline(inset(PROFILE, 14), { closed: true, w: W.thin });
  // top injector above the roof: flange, body, gland, spindle, handwheel, side inlet
  v.rect([-165, 460], [-65, 468], { w: W.medium, fill: PAPER });
  v.rect([-147, 470], [-83, 640], { w: W.medium, fill: PAPER });
  v.rect([-135, 640], [-95, 662], { w: W.medium, fill: PAPER });
  v.line([-125, 640], [-125, 662], { w: W.thin });
  v.line([-105, 640], [-105, 662], { w: W.thin });
  v.rect([-120, 662], [-110, 697], { w: W.medium, fill: PAPER });
  v.roundRect([-158, 697], [-72, 707], 5, { w: W.medium, fill: '#f3d5d2' });
  v.rect([-123, 696], [-107, 708], { w: W.medium, fill: PAPER });
  pipe(
    v,
    [
      [-177.5, 550],
      [-340, 550],
      [-340, 700],
      [-490, 700],
    ],
    25,
  );
  pipeBreak(v, -490, 700, 25);
  v.rect([-177.5, 524], [-147, 576], { w: W.medium, fill: PAPER });
  pipe(
    v,
    [
      [v2 ? -450 : -422, 115],
      [-490, 115],
    ],
    25,
  );
  pipeBreak(v, -490, 115, 25);
  // centre lines
  v.center([-205, AXIS], [330, AXIS]);
  v.center([0, 60], [0, 430]);
  v.center([-115, 228], [-115, 725]);
  v.center([-500, 115], [5, 115]);
}

/** Section A–A in the plane x = 0, seen from −X (window on the right). Model coords (z, y). */
function sectionA(v: View, v2: boolean): void {
  const ax = (r: number) => AXIS + r;
  const both = (z0: number, z1: number, r0: number, r1: number, st: Stroke) => {
    v.rect([z0, ax(r0)], [z1, ax(r1)], st);
    v.rect([z0, ax(-r0)], [z1, ax(-r1)], st);
  };
  const hatch = (h: Stroke['hatch'], w = W.medium): Stroke => ({ w, hatch: h, fill: PAPER });
  // base plate with the drain opening, stainless funnel, falling water
  v.rect([-200, 0], [50, 20], hatch('plastic', W.thick));
  v.rect([128, 0], [200, 20], hatch('plastic', W.thick));
  v.polyline(
    [
      [51, 0],
      [66, -80],
    ],
    { w: W.medium },
  );
  v.polyline(
    [
      [127, 0],
      [112, -80],
    ],
    { w: W.medium },
  );
  for (const z of [72, 89, 106])
    v.line([z, 30], [z, -95], { w: W.thin, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  // window, partition, rear panel + boss, cover (roof) with return lips, gaskets
  v.rect([170, 20], [178, 458], hatch('pmma'));
  v.rect([35, 20], [45, ax(-25)], hatch('pmma'));
  v.rect([35, ax(25)], [45, 458], hatch('pmma'));
  v.rect([-178, 20], [-172, 458], hatch('plastic'));
  v.polyline(
    [
      [-172, ax(23.5)],
      [-172, ax(34)],
      [-152, ax(32)],
      [-152, ax(23.5)],
    ],
    { closed: true, ...hatch('plastic') },
  );
  v.polyline(
    [
      [-172, ax(-23.5)],
      [-172, ax(-34)],
      [-152, ax(-32)],
      [-152, ax(-23.5)],
    ],
    { closed: true, ...hatch('plastic') },
  );
  v.rect([-190, ax(-22)], [-178, ax(22)], hatch('steel'));
  v.rect([-180, 458], [180, 460], { w: W.medium, fill: COLORS.ink });
  for (const z of [-180, 178]) {
    v.rect([z, 446], [z + 2, 460], { w: W.thin, fill: COLORS.ink });
    v.rect([z, 20], [z + 2, 34], { w: W.thin, fill: COLORS.ink });
  }
  for (const z of [167, -170]) {
    v.rect([z, 450], [z + 3, 458], hatch('rubber', W.thin));
    v.rect([z, 20], [z + 3, 28], hatch('rubber', W.thin));
  }
  // behind the cut (x = 190): rectifier on its heatsink, terminal block, cable gland + cable
  v.rect([-130, 20], [-70, 58], { w: W.thin, fill: PAPER });
  v.rect([-114, 59], [-86, 69], { w: W.thin, fill: PAPER });
  v.rect([-45, 20], [-25, 45], { w: W.thin, fill: PAPER });
  v.rect([-193, 20], [-178, 40], { w: W.medium, fill: PAPER });
  v.rect([-232, 24.5], [-193, 35.5], { w: W.medium, fill: '#3a3f46' });
  // bearing housing (V1 printed block / V2 aluminium cartridge)
  const housing: Pt[] = v2
    ? [
        [35, 23.5],
        [35, 62],
        [23, 62],
        [21, 36],
        [-79, 34],
        [-79, 23.5],
      ]
    : [
        [35, 23.5],
        [35, 60],
        [19, 60],
        [19, 34],
        [-79, 34],
        [-79, 23.5],
      ];
  for (const s of [1, -1])
    v.polyline(
      housing.map(([z, r]) => [z, ax(s * r)] as Pt),
      { closed: true, ...hatch(v2 ? 'alu' : 'plastic') },
    );
  // generator: stator, rotor bell (fan + wall), magnets, hub
  both(-72, -36, 34.2, 56.5, hatch('steel', W.thin));
  const bell: Pt[] = [
    [-88, 21],
    [-88, 78],
    [-30, 78],
    [-30, 61.5],
    [-82, 61.5],
    [-82, 21],
  ];
  for (const s of [1, -1])
    v.polyline(
      bell.map(([z, r]) => [z, ax(s * r)] as Pt),
      { closed: true, ...hatch('plastic', W.thin) },
    );
  both(-73, -35, 57.5, 61.4, { w: W.thin, fill: '#c9ced6' });
  both(-103, -85, 10, 21, hatch('alu', W.thin));
  // runner: hub disc, clamp ring, flange + bush, buckets (not sectioned), seal carrier + seal
  both(104, 116, 22, 85, hatch('plastic', W.thin));
  both(120, 125, 62, 87, hatch('plastic', W.thin));
  both(104, 136, 10, 45, hatch('steel', W.thin));
  for (const s of [1, -1]) {
    const cup: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const e = -0.985 + (1.97 * i) / 24;
      cup.push([110 + 21 * Math.sqrt(1 - e * e), ax(s * (121 + e * 34))]);
    }
    for (let i = 24; i >= 0; i--) cup.push([220 - cup[i][0], cup[i][1]]);
    v.polyline(cup, { closed: true, w: W.medium, fill: PAPER });
  }
  both(45, 54, 17.5, 30, hatch(v2 ? 'alu' : 'plastic', W.thin));
  // shaft (not sectioned) + bearings (simplified symbol)
  v.rect([-172, ax(-10)], [150, ax(10)], { w: W.medium, fill: PAPER });
  v.rect([138, ax(-14.5)], [148, ax(14.5)], { w: W.thin, fill: PAPER });
  for (const z of ZB) {
    for (const s of [1, -1]) {
      const [a, b]: Pt[] = [
        [z - 7, ax(s * 10)],
        [z + 7, ax(s * 23.5)],
      ];
      v.rect(a, b, { w: W.thin, fill: PAPER });
      v.polyline([a, b, [a[0], b[1]], [b[0], a[1]]], { w: W.thin }); // ISO simplified bearing cross
    }
  }
  if (v2) v.rect([-66, ax(80)], [-54, ax(130)], { w: W.thin, fill: PAPER });
  v.center([-205, AXIS], [185, AXIS]);
  v.center([110, -90], [110, 475]);
}

/** Top view (first-angle: below the front view, window side at the bottom). Model (x, −z). */
function topView(v: View, v2: boolean): void {
  const P = (x: number, z: number): Pt => [x, -z];
  v.rect(P(-310, -200), P(310, 200), { w: W.medium, fill: PAPER });
  v.rect(P(-290, -180), P(290, 180), { w: W.thick, fill: PAPER });
  for (const x of [-180, 180]) v.line(P(x, -180), P(x, 180), { w: W.medium });
  // cable gland + cable at the rear
  v.rect(P(189, -193), P(211, -180), { w: W.medium, fill: PAPER });
  v.rect(P(194.5, -232), P(205.5, -193), { w: W.medium, fill: '#3a3f46' });
  // side injector flange / bayonet collar and wall plate (partly under the gooseneck)
  if (v2) {
    v.rect(P(-450, 62), P(-430, 158), { w: W.medium, fill: PAPER });
    v.rect(P(-423, 68), P(-409, 152), { w: W.medium, fill: PAPER });
    v.rect(P(-298, 60), P(-290, 160), { w: W.medium, fill: PAPER });
    for (const s of [-1, 1]) v.rect(P(s * 290, 95), P(s * 299, 125), { w: W.thin, fill: PAPER });
  } else {
    v.rect(P(-422, 70), P(-410, 150), { w: W.medium, fill: PAPER });
    v.rect(P(-298, 65), P(-290, 155), { w: W.medium, fill: PAPER });
  }
  // gooseneck seen from above (all pipes at z = 110) and the spear injector on its roof flange
  pipe(v, [P(-490, 110), P(-177.5, 110)], 25);
  pipeBreak(v, -490, -110, 25);
  v.rect(P(-177.5, 84), P(-147, 136), { w: W.medium, fill: PAPER });
  v.rect(P(-165, 60), P(-65, 160), { w: W.medium, fill: PAPER });
  for (const [dx, dz] of [
    [-40, -40],
    [40, -40],
    [40, 40],
    [-40, 40],
  ])
    v.circle(P(-115 + dx, 110 + dz), 4, { w: W.thin });
  v.circle(P(-115, 110), 32, { w: W.thin });
  v.circle(P(-115, 110), 43, { w: W.medium, fill: '#f3d5d2' });
  v.circle(P(-115, 110), 33, { w: W.medium, fill: PAPER });
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    v.line(P(-115 - Math.cos(a) * 38, 110 - Math.sin(a) * 38), P(-115 + Math.cos(a) * 38, 110 + Math.sin(a) * 38), {
      w: W.medium,
    });
  }
  v.circle(P(-115, 110), 8, { w: W.medium, fill: PAPER });
  v.center(P(0, -225), P(0, 225));
  v.center(P(-500, 110), P(335, 110));
  v.center(P(-115, 60), P(-115, 160));
}

/** Installation elevation 1:20: ground, stand, housing, manifold up to the HDPE inlet. Y from ground. */
function installation(v: View, v2: boolean): void {
  const Y = (y: number) => y + BASE_Y;
  v.rect([-1420, -45], [600, 0], { w: 0, hatch: 'earth' });
  v.rect([-260, -210], [260, 0], { w: 0, fill: PAPER });
  v.polyline(
    [
      [-1420, 0],
      [-260, 0],
      [-260, -210],
      [260, -210],
      [260, 0],
      [600, 0],
    ],
    { w: W.thick },
  );
  v.rect([-258, -208], [258, -130], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  if (v2) {
    for (const s of [-1, 1]) {
      v.rect([s * 280, 60], [s * 320, 890], { w: W.medium, fill: PAPER });
      v.rect([s * 265, 0], [s * 335, 12], { w: W.thin, fill: '#555' });
      v.rect([s * 294, 12], [s * 306, 60], { w: W.thin, fill: PAPER });
      v.circle([s * 300, 928], 18, { w: W.thin });
    }
    v.rect([-320, 870], [320, 910], { w: W.medium, fill: PAPER });
    v.rect([-320, 230], [320, 270], { w: W.medium, fill: PAPER });
    v.polyline(
      [
        [-266, 290],
        [-248, 304],
        [266, 850],
        [248, 836],
      ],
      { closed: true, w: W.thin, fill: PAPER },
    );
    v.polyline(
      [
        [-147, 870],
        [147, 870],
        [55, 690],
        [-55, 690],
      ],
      { closed: true, w: W.thin, fill: PAPER },
    );
    v.roundRect([350, 430], [550, 690], 12, { w: W.medium, fill: '#e6e8ea' });
    v.rect([300, 460], [350, 660], { w: W.thin, fill: PAPER });
  } else {
    for (const s of [-1, 1]) {
      v.rect([s * 342, 0], [s * 378, 750], { w: W.medium, fill: '#f1d4d1' });
      v.rect([s * 212, 770], [s * 288, 920], { w: W.medium, hatch: 'wood', fill: '#efe2cf' });
    }
    v.rect([-450, 730], [450, 770], { w: W.medium, fill: '#f1d4d1' });
    v.rect([-375, 288], [375, 312], { w: W.thin, fill: '#f1d4d1' });
  }
  // machine
  v.polyline(
    [
      [-198, Y(0)],
      [198, Y(0)],
      [119, Y(-80)],
      [-119, Y(-80)],
    ],
    { closed: true, w: W.thin, fill: PAPER },
  );
  v.rect([-310, Y(0)], [310, Y(20)], { w: W.medium, fill: PAPER });
  v.polyline(
    PROFILE.map(([x, y]) => [x, Y(y)] as Pt),
    { closed: true, w: W.medium, fill: PAPER },
  );
  v.circle([0, Y(AXIS)], 154.5, { w: W.thin });
  v.circle([0, Y(AXIS)], 115, { w: W.thin, dash: 'center', color: COLORS.muted });
  v.rect([-147, Y(468)], [-83, Y(640)], { w: W.thin, fill: PAPER });
  v.rect([-158, Y(697)], [-72, Y(707)], { w: W.thin, fill: '#f3d5d2' });
  v.line([-115, Y(640)], [-115, Y(697)], { w: W.thin });
  v.rect([v2 ? -450 : -422, Y(75)], [-290, Y(155)], { w: W.thin, fill: PAPER });
  // manifold: HDPE Ø63 + compression coupling, main valve, gauge tee, reducer, cross, gooseneck, lower branch
  pipe(
    v,
    [
      [-1420, Y(300)],
      [-1180, Y(300)],
    ],
    31.5,
    70,
    { fill: '#3a3f46' },
  );
  v.rect([-1205, Y(253)], [-1055, Y(347)], { w: W.thin, fill: '#cfe0f5' });
  pipe(
    v,
    [
      [-1055, Y(300)],
      [-730, Y(300)],
    ],
    31.5,
  );
  v.rect([-1041, Y(250)], [-899, Y(350)], { w: W.thin, fill: PAPER });
  v.rect([-985, Y(289)], [-835, Y(311)], { w: W.thin, fill: '#2b6cd1' });
  v.rect([-865, Y(263)], [-775, Y(337)], { w: W.thin, fill: PAPER });
  v.rect([-827, Y(337)], [-813, Y(423)], { w: W.thin, fill: PAPER });
  v.circle([-820, Y(475)], 52, { w: W.thin, fill: PAPER });
  v.polyline(
    [
      [-730, Y(331.5)],
      [-690, Y(325)],
      [-690, Y(275)],
      [-730, Y(268.5)],
    ],
    { closed: true, w: W.thin, fill: PAPER },
  );
  pipe(
    v,
    [
      [-690, Y(300)],
      [-620, Y(300)],
      [-620, Y(700)],
      [-340, Y(700)],
      [-340, Y(550)],
      [-177.5, Y(550)],
    ],
    25,
  );
  pipe(
    v,
    [
      [-620, Y(300)],
      [-620, Y(115)],
      [v2 ? -450 : -422, Y(115)],
    ],
    25,
    60,
  );
  v.rect([-648, Y(452)], [-592, Y(548)], { w: W.thin, fill: '#e03131' });
  v.rect([-578, Y(87)], [-482, Y(143)], { w: W.thin, fill: '#2b6cd1' });
  if (v2) {
    v.rect([-492, Y(725)], [-468, Y(745)], { w: W.thin, fill: PAPER });
    v.rect([-502, Y(750)], [-458, Y(806)], { w: W.thin, fill: '#e9d8a6' });
  }
  pipeBreak(v, -1420, Y(300), 31.5);
  v.center([-250, Y(AXIS)], [250, Y(AXIS)]);
}

export const turbineGa: DrawingSheet = {
  id: 'turbine-ga',
  number: 'PL-T01',
  group: 'turbine',
  title: l('Turbine — plan d’ensemble', 'Turbine — general arrangement'),
  description: l(
    'Plan d’ensemble de la turbine : vue de face côté hublot (roue, deux jets tangents au cercle primitif), coupe A–A par l’axe (chambres humide et sèche, cloison, générateur) et vue de dessus (injecteur sur le toit, col de cygne), à 1:5, plus une élévation d’implantation à 1:20 avec les hauteurs au sol. Les repères renvoient à la nomenclature ; un tableau compare notre reconstruction aux données publiées par le constructeur.',
    'General arrangement of the turbine: front view from the window side (runner, two jets tangent to the pitch circle), section A–A through the axis (wet and dry chambers, partition, generator) and top view (injector on the roof, gooseneck), at 1:5, plus a 1:20 installation elevation with heights above ground. Balloons refer to the parts list; a table compares our reconstruction with the maker’s published data.',
  ),
  scene: 'turbine',
  render(ctx) {
    const v2 = ctx.version === 'v2';
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

    // ---- front view 1:5
    const fv = d.view(112, 158, 0.2);
    frontView(fv, v2);
    fv.sectionMark([0, 485], [0, -8], 'A', 1);
    fv.dim([310, 0], [310, AXIS], 6, { dir: 'v' });
    fv.dim([310, 0], [180, 460], 13, { dir: 'v' });
    fv.dim([310, 0], [-72, 708], 20, { dir: 'v' });
    fv.dim([-115, 425], [0, 425], 0, { dir: 'h', size: 2.2 });
    fv.dim([-205, 115], [-205, AXIS], 0, { dir: 'v', size: 2.2 });
    fv.dimDiameter([0, AXIS], 115, 28, { label: l('Ø230 prim.', 'Ø230 pitch'), size: 2.2 });
    // balloons: [model point, balloon centre in paper mm, item]
    const balloons = (vw: View, list: [Pt, number, number, string][]) =>
      list.forEach(([at, bx, by, n]) => vw.leader(at, bx - vw.map(at)[0], by - vw.map(at)[1], n, { balloon: true }));
    balloons(fv, [
      [[250, 10], 164, 166, '1'],
      [[243, 368], 177, 76, '2'],
      [[210, 150], 162, 140, '3'],
      [[121, 300], 158, 92, '6'],
      [[-83, 600], 62, 28, '10'],
      [[-360, 133], 28, 112, '11'],
      [[-340, 620], 28, 60, '12'],
    ]);
    if (v2)
      balloons(fv, [
        [[-150, 355], 62, 84, '16'],
        [[-295, 70], 36, 150, '17'],
      ]);
    fv.caption([0, -42], l('VUE DE FACE (côté hublot)', 'FRONT VIEW (window side)'), '1:5');

    // ---- section A–A 1:5 (z → right), aligned with the front view
    const sa = d.view(258, 158, 0.2);
    sectionA(sa, v2);
    sa.dim([-180, 460], [180, 460], -6, { dir: 'h' });
    sa.dim([-180, 460], [40, 460], -12, { dir: 'h', size: 2.2 });
    sa.dim([-180, 460], [110, 460], -18, { dir: 'h', size: 2.2 });
    p.text(sa.map([110, 480]), l('plan des jets', 'jet plane'), {
      size: 1.8,
      color: COLORS.water,
      anchor: 'middle',
      halo: true,
    });
    p.text(sa.map([140, -60]), l('chute libre', 'free fall'), { size: 1.8, color: COLORS.water });
    p.text(sa.map([140, 425]), l('HUMIDE', 'WET'), {
      size: 1.8,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'middle',
    });
    p.text(sa.map([-60, 425]), l('SÈCHE', 'DRY'), { size: 1.8, weight: 'bold', color: COLORS.muted, anchor: 'middle' });
    balloons(sa, [
      [[45, 400], 275, 72, '4'],
      [[-175, 400], 230, 72, '5'],
      [[-140, AXIS], 228, 140, '7'],
      [[-40, AXIS + 34], 262, 86, '8'],
      [[-54, AXIS + 50], 244, 86, '9'],
      [[-185, 30], 214, 140, '15'],
    ]);
    sa.caption([0, -135], l('COUPE A–A', 'SECTION A–A'), '1:5');

    // ---- top view 1:5 (below the front view)
    const tv = d.view(112, 232, 0.2);
    topView(tv, v2);
    tv.dim([-180, 180], [180, 180], -8, { dir: 'h', size: 2.2 });
    tv.dim([-290, 180], [290, 180], -13, { dir: 'h' });
    tv.dim([-310, 200], [310, 200], -14, { dir: 'h', size: 2.2 });
    tv.dim([330, 0], [330, -110], 0, { dir: 'v', size: 2.2 });
    tv.dim([290, 180], [290, -180], 14, { dir: 'v' });
    tv.dim([310, 200], [310, -200], 16, { dir: 'v', size: 2.2 });
    p.text(tv.map([280, -122]), l('plan des jets (z = 110)', 'jet plane (z = 110)'), {
      size: 1.8,
      color: COLORS.water,
      anchor: 'end',
    });
    p.text(tv.map([-30, 160]), l('ARRIÈRE (générateur)', 'REAR (generator)'), {
      size: 1.8,
      color: COLORS.muted,
      anchor: 'end',
    });
    p.text(tv.map([-30, -170]), l('AVANT (hublot)', 'FRONT (window)'), {
      size: 1.8,
      color: COLORS.muted,
      anchor: 'end',
    });
    tv.caption([0, -235], l('VUE DE DESSUS', 'TOP VIEW'), '1:5');

    // ---- installation elevation 1:20
    const iv = d.view(375, 112, 0.05);
    installation(iv, v2);
    iv.dim([-1350, 0], [-1350, BASE_Y + 300], -3, { dir: 'v', size: 2 });
    iv.dim([-310, 0], [-310, BASE_Y], -11, { dir: 'v', size: 2 });
    iv.dim([-310, 0], [-310, BASE_Y + AXIS], -17, { dir: 'v', size: 2 });
    iv.dim([-1350, BASE_Y + 300], [0, BASE_Y + AXIS], -31, { dir: 'h', size: 2 });
    iv.dim([90, 0], [90, v2 ? 690 : BASE_Y - 80], 0, { dir: 'v', size: 1.9, color: COLORS.water });
    p.text(iv.map([-1400, 1130]), l('PEHD Ø63 PN10', 'HDPE Ø63 PN10'), { size: 1.7 });
    p.text(iv.map([-1400, -120]), l('sol', 'ground'), { size: 1.7, color: COLORS.muted });
    p.text(iv.map([0, -190]), l('canal de fuite', 'tailrace'), { size: 1.7, color: COLORS.water, anchor: 'middle' });
    balloons(iv, [
      [[-1300, 1220], 318, 64, '13'],
      [v2 ? [300, 500] : [360, 500], 398, 95, '14'],
    ]);
    iv.caption([-400, -330], l('IMPLANTATION', 'INSTALLATION'), '1:20');

    // ---- notes (top centre)
    let ny = 14;
    const notes: Text[] = [
      l(
        'Chute libre ≥ 300–400 mm sous l’embase (vidéo) : l’eau doit s’évacuer sans remonter vers la roue. Constructeur : turbine ≥ 500 mm au-dessus du sol.',
        'Free fall ≥ 300–400 mm under the base (video): the water must drain without backing up to the runner. Maker: turbine ≥ 500 mm above ground.',
      ),
      l(
        'Raccordement : PEHD Ø63 PN10 (Ø int. 55), raccord à compression, vanne principale + manomètre 0–10 bar. Jets dans le plan de roue, tangents au primitif Ø230.',
        'Connection: HDPE Ø63 PN10 (55 ID), compression coupling, main valve + 0–10 bar gauge. Jets in the runner plane, tangent to the Ø230 pitch circle.',
      ),
      l(
        'Sortie électrique : presse-étoupe sur le flasque arrière, câble 2 × 6 mm² vers le coffret de protection DC.',
        'Power out: cable gland on the rear panel, 2 × 6 mm² cable to the DC protection box.',
      ),
    ];
    notes.forEach((t, i) => (ny = note(d, 205, ny, 96, t, { bullet: `${i + 1}.` })));

    // ---- comparison with the maker's published data
    p.text([199, 195], l('NOTRE RECONSTRUCTION vs DONNÉES CONSTRUCTEUR', 'OUR RECONSTRUCTION vs MAKER DATA'), {
      size: 2,
      weight: 'bold',
    });
    d.table(
      199,
      197,
      [
        { label: '', w: 24 },
        { label: l('Modèle 3D', '3D model'), w: 37 },
        { label: 'Hydronome', w: 40 },
      ],
      [
        [l('L × H × P', 'L × H × D'), '580 × 460 × 360', '574 × 328 × 402'],
        [l('Augets', 'Buckets'), l('22, imprimés', '22, printed'), l('26, injectés', '26, moulded')],
        [l('Roue Ø ext.', 'Runner OD'), l('Ø309 (L) / Ø298 (S)', 'Ø309 (L) / Ø298 (S)'), 'Ø244'],
        [l('Buse maxi', 'Max nozzle'), l('Ø12 (pointeau)', 'Ø12 (spear)'), 'Ø14'],
        [l('Roulements', 'Bearings'), '3 × 6204-2RS', l('3 SKF en opposition', '3 SKF, opposed')],
        [l('Masse', 'Weight'), l('non estimée', 'not estimated'), '22 kg'],
        [l('Puissance', 'Power'), l('0,5–1 kW (site A)', '0.5–1 kW (site A)'), l('5 kW nominal', '5 kW rated')],
      ],
      4.3,
    );
    note(
      d,
      199,
      233.5,
      101,
      l(
        'Données constructeur Hydronome (site officiel, 2024) ; 1 990 € TTC, 15–130 m, 1–40 L/s. Notre modèle est une reconstruction pédagogique, pas le produit.',
        'Hydronome maker data (official site, 2024); 1,990 € incl. VAT, 15–130 m, 1–40 L/s. Our model is an educational reconstruction, not the product.',
      ),
      { size: 1.75, color: COLORS.v2 },
    );

    // ---- parts list
    p.text([305, 138], l('NOMENCLATURE', 'PARTS LIST'), { size: 2.2, weight: 'bold' });
    const rows: Text[][] = [
      ['1', l('Embase PEHD ép. 20 + entonnoir inox', '20 mm HDPE base + stainless funnel')],
      ['2', l('Capot alu marin 5083 ép. 2, plié', 'Folded 2 mm 5083 marine-alu cover')],
      ['3', l('Hublot PMMA ép. 8 + joints EPDM', '8 mm PMMA window + EPDM gaskets')],
      ['4', l('Cloison étanche PMMA ép. 10', '10 mm PMMA watertight partition')],
      ['5', l('Flasque arrière ép. 6, ouïes', '6 mm rear panel, vents')],
      ['6', l('Roue Pelton 22 augets (PL-T03)', '22-bucket Pelton runner (PL-T03)')],
      ['7', l('Arbre Ø20 + 3 × 6204-2RS (PL-T02)', 'Ø20 shaft + 3 × 6204-2RS (PL-T02)')],
      [
        '8',
        v2
          ? l('Cartouche de palier alu 6082', '6082 alu bearing cartridge')
          : l('Palier imprimé PETG-CF', 'Printed PETG-CF bearing housing'),
      ],
      ['9', l('Générateur 12 dents / 14 aimants', 'Generator 12 teeth / 14 magnets')],
      ['10', l('Injecteur à pointeau Ø12 (PL-T04)', 'Ø12 spear injector (PL-T04)')],
      [
        '11',
        v2
          ? l('Lance à inserts baïonnette Ø4–12', 'Bayonet insert lance Ø4–12')
          : l('Injecteur fixe imprimé Ø6 / Ø8', 'Printed fixed nozzle Ø6 / Ø8'),
      ],
      ['12', l('Col de cygne PVC Ø50 + vannes', 'Ø50 PVC gooseneck + valves')],
      ['13', l('Arrivée PEHD Ø63, vanne, manomètre', 'Ø63 HDPE inlet, valve, gauge')],
      [
        '14',
        v2
          ? l('Châssis alu 40 × 40, plots, entonnoir', '40 × 40 alu skid, mounts, funnel')
          : l('Tréteaux + madriers 75 × 150', 'Trestles + 75 × 150 beams'),
      ],
      ['15', l('Redresseur, bornier, presse-étoupe', 'Rectifier, terminals, cable gland')],
    ];
    if (v2)
      rows.push(
        ['16', l('Déflecteurs de jet + gâche 12 V', 'Jet deflectors + 12 V latch')],
        ['17', l('Grenouillères ×4, coffret IP65', '4 toggle latches, IP65 box')],
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
            'V2 : repères 8, 11, 14, 16 et 17 remplacent les pièces du prototype ; même enveloppe, mêmes raccordements.',
            'V2: items 8, 11, 14, 16 and 17 replace the prototype parts; same envelope, same connections.',
          )
        : l(
            'V1 : prototype filmé (site A). Les repères 8, 11 et 14 changent en V2 (cartouche, lance à inserts, châssis alu).',
            'V1: the filmed prototype (site A). Items 8, 11 and 14 change in V2 (cartridge, insert lance, alu skid).',
          ),
      { size: 1.8, color: COLORS.muted },
    );
    return d;
  },
};
