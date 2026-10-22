import { l, tr, type L } from '../../i18n';
import { COLORS, Drawing, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';

// PL-T03 — Pelton runner (front view + section at 1:2) and one bucket at 1:1.
// Every value comes from src/three/turbine (dims.ts, bucket.ts, runner.ts), metres → mm.

const R_PITCH = 115; // D.rPitch
const HUB_R = 85; // D.hubR
const HUB_T = 12; // D.hubT
const N = 22; // D.buckets
const BOLT_R = 75; // clamp-ring bolt circle (Ø150)
const RING: [number, number] = [62, 87]; // clamp ring radii (D.hubR + 2)
const FLANGE_R = 45; // steel flange receiving the taper bush (parts.ts "bride acier")

interface Spec {
  rc: number;
  a: number;
  b: number;
  depth: number;
  t: number;
}
/** bucketSpecFor() in bucket.ts, in mm. */
const spec = (set: 'S' | 'L'): Spec => {
  const k = set === 'L' ? 1 : 0.84;
  return { rc: R_PITCH + 6, a: 34 * k, b: 21 * k, depth: 13 * k, t: 2.4 };
};
const tipR = (s: Spec) => s.rc + 0.985 * s.a;
/** Half-width of the notch (bucket.ts: zMin) at relative radius e = (r - rc) / a. */
const notchHalf = (s: Spec, e: number) => {
  const k = Math.max(0, (e - 0.45) / (0.985 - 0.45));
  return s.b * Math.sqrt(Math.max(0, 1 - e * e)) * 0.42 * Math.pow(k, 0.8);
};
const maxNotch = (s: Spec) => {
  let m = 0;
  for (let e = 0.45; e <= 0.985; e += 0.005) m = Math.max(m, 2 * notchHalf(s, e));
  return m;
};

const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
const dec = (v: number, n = 1): L => l(v.toFixed(n).replace('.', ','), v.toFixed(n));
const deg = Math.PI / 180;

/** Wrapped paragraph in paper space; returns the next free y. */
function note(
  d: Drawing,
  x: number,
  y: number,
  w: number,
  text: Text,
  o: { size?: number; bullet?: string; color?: string; bold?: boolean } = {},
): number {
  const size = o.size ?? 2;
  const p = d.paper();
  const indent = o.bullet ? 4 : 0;
  const max = Math.floor((w - indent) / (size * 0.64));
  const words = tr(text).split(' ');
  const rows: string[] = [];
  let cur = '';
  for (const word of words) {
    if (cur && (cur + ' ' + word).length > max) {
      rows.push(cur);
      cur = word;
    } else cur = cur ? cur + ' ' + word : word;
  }
  if (cur) rows.push(cur);
  if (o.bullet) p.text([x, y], o.bullet, { size, baseline: 'top', weight: 'bold', color: o.color });
  rows.forEach((r, i) =>
    p.text([x + indent, y + i * size * 1.75], r, {
      size,
      baseline: 'top',
      color: o.color,
      weight: o.bold ? 'bold' : 'normal',
    }),
  );
  return y + rows.length * size * 1.75 + size * 0.6;
}

/** Bucket outline seen along the shaft (radial × tangential), local frame of bucket.ts. */
function silhouette(s: Spec): Pt[] {
  const pts: Pt[] = [
    [s.rc - 0.985 * s.a, 0],
    [tipR(s), 0],
  ];
  for (let i = 0; i <= 28; i++) {
    const e = 0.985 - (1.97 * i) / 28;
    pts.push([s.rc + e * s.a, s.t + 1.25 * s.depth * Math.sqrt(1 - e * e)]);
  }
  return pts;
}

/** Front view of the whole runner (seen from the window side, +Z). */
function frontView(v: View, s: Spec): void {
  const stemTop = s.rc - 0.35 * s.a;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const stem: Pt[] = [
      [RING[1] - 1, 0.045 * s.depth],
      [stemTop, 0.045 * s.depth],
      [stemTop, 1.195 * s.depth],
      [RING[1] - 1, 1.195 * s.depth],
    ];
    v.polyline(
      stem.map((p) => rot(p, a)),
      { closed: true, w: W.medium, fill: COLORS.paper },
    );
    v.polyline(
      silhouette(s).map((p) => rot(p, a)),
      { closed: true, w: W.thick, fill: COLORS.paper },
    );
  }
  v.circle([0, 0], R_PITCH, { w: W.thin, dash: 'center', color: COLORS.muted });
  v.circle([0, 0], RING[1], { w: W.thick, fill: COLORS.paper });
  v.circle([0, 0], RING[0], { w: W.medium });
  v.circle([0, 0], BOLT_R, { w: W.thin, dash: 'center', color: COLORS.muted });
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c: Pt = [Math.cos(a) * BOLT_R, Math.sin(a) * BOLT_R];
    const hex: Pt[] = [];
    for (let k = 0; k < 6; k++)
      hex.push([c[0] + 3.5 * Math.cos(k * 60 * deg + a), c[1] + 3.5 * Math.sin(k * 60 * deg + a)]);
    v.polyline(hex, { closed: true, w: W.thin });
  }
  // hub disc between flange and clamp ring: 6 lightening holes Ø18 on Ø104
  v.circle([0, 0], 52, { w: W.thin, dash: 'center', color: COLORS.muted });
  for (let i = 0; i < 6; i++)
    v.circle([Math.cos(i * 60 * deg) * 52, Math.sin(i * 60 * deg) * 52], 9, { w: W.medium, fill: COLORS.paper });
  // steel flange + taper bush + washer + M16 nut
  v.circle([0, 0], FLANGE_R, { w: W.thick, fill: COLORS.paper });
  v.circle([0, 0], 30, { w: W.thin, dash: 'center', color: COLORS.muted });
  for (let i = 0; i < 4; i++) {
    const a = (45 + i * 90) * deg;
    v.circle([Math.cos(a) * 30, Math.sin(a) * 30], 3.5, { w: W.thin, dash: 'hidden' });
  }
  v.circle([0, 0], 19, { w: W.medium });
  v.circle([0, 0], 17, { w: W.thin });
  const nut: Pt[] = [];
  for (let k = 0; k < 6; k++) nut.push([14.5 * Math.cos(k * 60 * deg), 14.5 * Math.sin(k * 60 * deg)]);
  v.polyline(nut, { closed: true, w: W.thick, fill: COLORS.paper });
  v.circle([0, 0], 12, { w: W.thin });
  v.circle([0, 0], 8, { w: W.medium });
  v.arc([0, 0], 6.9, 20, 300, { w: W.thin });
  v.center([-tipR(s) - 6, 0], [tipR(s) + 6, 0]);
  v.center([0, -tipR(s) - 6], [0, tipR(s) + 6]);
}

/** Axial section B–B (z relative to the wheel plane → paper x, radius → paper y). */
function sectionB(v: View, s: Spec): void {
  const both = (pts: Pt[], st: Parameters<View['polyline']>[1]) => {
    v.polyline(pts, { closed: true, ...st });
    v.polyline(
      pts.map(([x, y]) => [x, -y] as Pt),
      { closed: true, ...st },
    );
  };
  const stemTop = s.rc - 0.35 * s.a;
  // bucket rotated into the plane (not hatched, by convention): cup outline + forked stem
  const cup: Pt[] = [];
  for (let i = 0; i <= 32; i++) {
    const e = -0.985 + (1.97 * i) / 32;
    cup.push([s.b * Math.sqrt(1 - e * e), s.rc + e * s.a]);
  }
  for (let i = 32; i >= 0; i--) cup.push([-cup[i][0], cup[i][1]]);
  both(
    [
      [-10, HUB_R],
      [10, HUB_R],
      [10, stemTop],
      [-10, stemTop],
    ],
    { w: W.medium, fill: COLORS.paper },
  );
  both(cup, { w: W.thick, fill: COLORS.paper });
  both(
    [
      [-10, 58],
      [-6, 58],
      [-6, HUB_R],
      [-10, HUB_R],
    ],
    { w: W.medium, fill: COLORS.paper },
  );
  both(
    [
      [6, 58],
      [10, 58],
      [10, RING[0]],
      [6, RING[0]],
    ],
    { w: W.medium, fill: COLORS.paper },
  );
  // sectioned parts
  both(
    [
      [-HUB_T / 2, 22],
      [HUB_T / 2, 22],
      [HUB_T / 2, HUB_R],
      [-HUB_T / 2, HUB_R],
    ],
    { w: W.thick, hatch: 'plastic', fill: COLORS.paper },
  );
  both(
    [
      [10, RING[0]],
      [15, RING[0]],
      [15, RING[1]],
      [10, RING[1]],
    ],
    { w: W.thick, hatch: 'plastic', fill: COLORS.paper },
  );
  both(
    [
      [-6, 11],
      [-6, 22],
      [6, 22],
      [6, FLANGE_R],
      [26, FLANGE_R],
      [26, 16],
      [10, 19],
      [10, 11],
    ],
    { w: W.thick, hatch: 'steel', fill: COLORS.paper },
  );
  both(
    [
      [10, 10],
      [10, 19],
      [26, 16],
      [26, 10],
    ],
    { w: W.thick, hatch: 'steel', fill: COLORS.paper },
  );
  both(
    [
      [26, 10],
      [28, 10],
      [28, 17],
      [26, 17],
    ],
    { w: W.medium, hatch: 'steel', fill: COLORS.paper },
  );
  // M4 bolts (not sectioned): head, shank, nut
  both(
    [
      [15, BOLT_R - 3.5],
      [18, BOLT_R - 3.5],
      [18, BOLT_R + 3.5],
      [15, BOLT_R + 3.5],
    ],
    { w: W.medium, fill: COLORS.paper },
  );
  both(
    [
      [-12, BOLT_R - 2],
      [15, BOLT_R - 2],
      [15, BOLT_R + 2],
      [-12, BOLT_R + 2],
    ],
    { w: W.thin, fill: COLORS.paper },
  );
  both(
    [
      [-14.5, BOLT_R - 3.5],
      [-11.5, BOLT_R - 3.5],
      [-11.5, BOLT_R + 3.5],
      [-14.5, BOLT_R + 3.5],
    ],
    { w: W.medium, fill: COLORS.paper },
  );
  // shaft (not sectioned) with key, M16 nut
  v.rect([-21, -10], [28, 10], { w: W.thick, fill: COLORS.paper });
  v.rect([28, -8], [40, 8], { w: W.thick, fill: COLORS.paper });
  v.line([28, 6.9], [40, 6.9], { w: W.thin });
  v.line([28, -6.9], [40, -6.9], { w: W.thin });
  v.rect([28, -14.5], [38, 14.5], { w: W.thick, fill: COLORS.paper });
  v.line([28, 7.2], [38, 7.2], { w: W.thin });
  v.line([28, -7.2], [38, -7.2], { w: W.thin });
  v.rect([-15, 6.5], [15, 12.5], { w: W.medium, fill: COLORS.paper });
  // break line on the shaft (left)
  v.polyline(
    [
      [-21, 12],
      [-22.5, 4],
      [-19.5, -4],
      [-21, -12],
    ],
    { w: W.thin },
  );
  v.center([-24, 0], [44, 0]);
  v.center([0, -tipR(s) - 4], [0, tipR(s) + 4]);
}

/** Bucket seen along the jet (axial × radial), 1:1, origin at the cup centre (r = rc). */
function bucketFront(v: View, s: Spec): void {
  const ns = s.rc + 0.45 * s.a;
  // fork + hub disc + clamp ring (phantom) + M4 bolt (hidden)
  v.rect([-6, 58 - s.rc], [6, HUB_R - s.rc], { w: W.thin, dash: 'phantom', color: COLORS.muted });
  v.rect([10, RING[0] - s.rc], [15, RING[1] - s.rc], { w: W.thin, dash: 'phantom', color: COLORS.muted });
  v.polyline(
    [
      [-10, 58 - s.rc],
      [-10, s.rc - 0.35 * s.a - s.rc],
      [10, s.rc - 0.35 * s.a - s.rc],
      [10, 58 - s.rc],
      [6, 58 - s.rc],
      [6, HUB_R - s.rc],
      [-6, HUB_R - s.rc],
      [-6, 58 - s.rc],
    ],
    { closed: true, w: W.thick, fill: COLORS.paper },
  );
  v.rect([-12, BOLT_R - 2 - s.rc], [18, BOLT_R + 2 - s.rc], { w: W.thin, dash: 'hidden' });
  v.center([-16, BOLT_R - s.rc], [22, BOLT_R - s.rc]);
  // cup outline with the notch at the tip
  const right: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const e = -0.985 + (1.97 * i) / 40;
    right.push([s.b * Math.sqrt(1 - e * e), e * s.a]);
  }
  const notch: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const e = 0.985 - ((0.985 - 0.45) * i) / 24;
    notch.push([notchHalf(s, e), e * s.a]);
  }
  const outline: Pt[] = [
    ...right,
    ...notch,
    ...notch
      .slice()
      .reverse()
      .map(([x, y]) => [-x, y] as Pt),
    ...right
      .slice()
      .reverse()
      .map(([x, y]) => [-x, y] as Pt),
  ];
  v.polyline(outline, { closed: true, w: W.thick, fill: COLORS.paper });
  // splitter ridge up to the notch, cup bottoms (thin)
  v.line([0, -0.985 * s.a], [0, ns - s.rc], { w: W.medium });
  for (const sg of [-1, 1]) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const e = -0.9 + (1.8 * i) / 24;
      pts.push([(sg * s.b * Math.sqrt(1 - e * e)) / 2, e * s.a]);
    }
    v.polyline(pts, { w: W.thin, dash: 'phantom', color: COLORS.muted });
  }
  // jet footprint (Ø8 for the L set)
  v.circle([0, 0], 4, { w: W.thin, color: COLORS.water, dash: 'hidden' });
  v.center([-s.b - 4, 0], [s.b + 4, 0]);
  v.center([0, 58 - s.rc - 3], [0, tipR(s) - s.rc + 4]);
}

/** Section D–D across both half cups at r = rc: the jet comes from above. */
function bucketSection(v: View, s: Spec, d: number): void {
  const n = 30;
  const inner: Pt[] = [];
  const outer: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const z = -s.b + (2 * s.b * i) / n;
    const w = Math.abs(z) / s.b;
    inner.push([z, -s.depth * Math.pow(Math.sin(Math.PI * Math.min(1, w)), 0.85)]);
    outer.push([z, -(s.t + 1.25 * s.depth * Math.sqrt(Math.max(0, 1 - w * w)))]);
  }
  v.polyline([...inner, ...outer.reverse()], { closed: true, w: W.thick, hatch: 'plastic', fill: COLORS.paper });
  // incoming jet
  v.rect([-d / 2, 1.2], [d / 2, 30], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  const arrow = (a: Pt, b: Pt) =>
    v.line(a, b, { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  arrow([0, 34], [0, 20]);
  // flow along both cups and out at 15° from the jet axis (≈ 165° deflection)
  for (const sg of [-1, 1]) {
    const path: Pt[] = [];
    for (let i = 1; i <= 20; i++) {
      const z = (s.b * i) / 20;
      const w = z / s.b;
      path.push([sg * z * 0.94, -s.depth * Math.pow(Math.sin(Math.PI * w), 0.85) + 1.6]);
    }
    v.polyline(path, { w: W.thin, color: COLORS.water });
    const start: Pt = [sg * (s.b + 0.5), 2];
    const end: Pt = [start[0] + sg * Math.sin(15 * deg) * 22, start[1] + Math.cos(15 * deg) * 22];
    arrow(start, end);
    v.line(start, [start[0], start[1] + 20], { w: W.thin, dash: 'center', color: COLORS.muted });
    v.arc(start, 14, 90, sg > 0 ? 75 : 105, { w: W.thin });
  }
  v.center([0, -24], [0, 36]);
}

export const runner: DrawingSheet = {
  id: 'runner',
  number: 'PL-T03',
  group: 'turbine',
  title: l('Roue Pelton et augets', 'Pelton runner and buckets'),
  description: l(
    'La roue vue de face et en coupe (1:2) : 22 augets serrés entre le moyeu et la bague par 22 vis M4, montés sur l’arbre par une bride acier et une douille conique. Le détail 1:1 montre un auget du jeu L (jet Ø8) : arête médiane, échancrure, profondeur de coquille et renvoi de l’eau à ≈ 165°. Le tableau compare les proportions classiques (en multiples du diamètre de jet d) aux cotes réelles des jeux S et L du modèle.',
    'The runner in front view and section (1:2): 22 buckets clamped between the hub disc and the ring by 22 M4 bolts, mounted on the shaft through a steel flange and a taper bush. The 1:1 detail shows one bucket of the L set (Ø8 jet): splitter ridge, notch, cup depth and the ≈ 165° turn of the water. The table compares the classic proportions (multiples of the jet diameter d) with the actual S and L bucket sets of the model.',
  ),
  scene: 'turbine',
  parts: ['wheel-hub', 'buckets', 'wheel-ring', 'wheel-lock'],
  render(ctx) {
    const d = new Drawing();
    const L8 = spec('L');
    const S6 = spec('S');
    d.frame({
      title: l('Roue Pelton — 22 augets', 'Pelton runner — 22 buckets'),
      subtitle:
        ctx.version === 'v2'
          ? l(
              'Roue commune V1 / V2 (planche V2) — augets jeu L, buse Ø8',
              'Same runner on V1 / V2 (V2 sheet) — L bucket set, Ø8 nozzle',
            )
          : l(
              'Roue commune V1 / V2 (planche V1) — augets jeu L, buse Ø8',
              'Same runner on V1 / V2 (V1 sheet) — L bucket set, Ø8 nozzle',
            ),
      number: 'PL-T03',
      scale: '1:2 · 1:1',
    });
    const p = d.paper();

    // ---- front view 1:2
    const fv = d.view(106, 116, 0.5);
    frontView(fv, L8);
    fv.sectionMark([0, tipR(L8) + 12], [0, -tipR(L8) - 12], 'B', -1);
    fv.dimDiameter([0, 0], tipR(L8), 52, { label: `Ø${(2 * tipR(L8)).toFixed(0)}` });
    fv.dimDiameter([0, 0], R_PITCH, 18, { label: l('Ø230 primitif', 'Ø230 pitch') });
    fv.leader(rot([BOLT_R, 0], 290 * deg), 34, 44, l('22 × M4 A4 / Ø150', '22 × M4 A4 / Ø150'));
    fv.leader(rot([52, 0], 240 * deg), -38, 54, l('6 × Ø18 / Ø104', '6 × Ø18 / Ø104'));
    fv.leader(rot([30, 0], 135 * deg), -40, -75, l('4 × Ø7 / Ø60 (cachés)', '4 × Ø7 / Ø60 (hidden)'));
    // bucket pitch 360/22 and direction of rotation
    for (const k of [4, 5])
      fv.line(rot([tipR(L8) - 4, 0], (k / N) * Math.PI * 2), rot([tipR(L8) + 10, 0], (k / N) * Math.PI * 2), {
        w: W.thin,
        color: COLORS.muted,
      });
    fv.arc([0, 0], tipR(L8) + 7, (4 / N) * 360, (5 / N) * 360, { w: W.thin });
    p.text(fv.map(rot([tipR(L8) + 11, 0], (4.5 * (Math.PI * 2)) / N)), tr(dec(360 / N, 2)) + '°', {
      size: 2.3,
      mono: true,
      anchor: 'middle',
      halo: true,
    });
    const rotArc = fv.arc([0, 0], tipR(L8) + 7, 140, 165, { w: W.medium, color: COLORS.water });
    rotArc.setAttribute('marker-end', 'url(#arrow)');
    p.text([30, 60], l('sens de rotation', 'rotation'), { size: 2, anchor: 'middle', color: COLORS.water, halo: true });
    // balloons
    fv.leader(rot([56, 0], 115 * deg), -16, -52, '1', { balloon: true });
    fv.leader(rot([tipR(L8) - 10, 3], 40 * deg), 24, -40, '2', { balloon: true });
    fv.leader(rot([66, 0], 196 * deg), -44, 12, '3', { balloon: true });
    fv.leader(rot([BOLT_R, 0], 104 * deg), -8, -66, '4', { balloon: true });
    fv.caption([0, -tipR(L8) - 26], l('VUE DE FACE (côté hublot)', 'FRONT VIEW (window side)'), '1:2');

    // ---- section B–B 1:2
    const sb = d.view(206, 116, 0.5);
    sectionB(sb, L8);
    sb.dim([-21, tipR(L8) - 30], [21, tipR(L8) - 30], -34, { dir: 'h', size: 2.2 });
    sb.leader([20, 30], 20, -26, '5', { balloon: true });
    sb.leader([18, 12], 20, -12, '6', { balloon: true });
    sb.leader([36, -9], -2, 30, '7', { balloon: true });
    sb.caption([0, -tipR(L8) - 26], l('COUPE B–B', 'SECTION B–B'), '1:2');

    // ---- bucket detail 1:1 (L set), seen along the jet
    const bf = d.view(268, 58, 1);
    bucketFront(bf, L8);
    bf.dim([-L8.b, 0], [L8.b, 0], -(tipR(L8) - L8.rc) - 8, { dir: 'h', label: `B = ${(2 * L8.b).toFixed(0)}` });
    bf.dim([0, -0.985 * L8.a], [0, 0.985 * L8.a], L8.b + 8, { dir: 'v', label: `L = ${(2 * L8.a).toFixed(0)}` });
    bf.dim([0, 0.45 * L8.a], [0, 0.985 * L8.a], -(L8.b + 6), { dir: 'v', size: 2.2 });
    bf.dim([-10, 58 - L8.rc], [10, 58 - L8.rc], 5, { dir: 'h', size: 2.2 });
    bf.leader(
      [notchHalf(L8, 0.8), 0.8 * L8.a],
      16,
      -6,
      l(`échancrure ≈ ${tr(dec(maxNotch(L8)))}`, `notch ≈ ${tr(dec(maxNotch(L8)))}`),
    );
    bf.leader([0, -14], 26, 8, l('arête médiane', 'splitter ridge'));
    bf.leader([3, -3], 30, 12, l('jet Ø8', 'Ø8 jet'), { color: COLORS.water });
    bf.leader([10, BOLT_R - L8.rc - 6], 26, 10, l('fourche sur moyeu ép. 12', 'fork on 12 mm hub disc'));
    bf.leader([0, 0], -27, -20, l('R121 = R115 + 6', 'R121 = R115 + 6'));
    p.text(bf.map([0, 58 - L8.rc - 13]), l('DÉTAIL C — AUGET (jeu L)', 'DETAIL C — BUCKET (L set)'), {
      size: 3,
      weight: 'bold',
      anchor: 'middle',
    });
    p.text(bf.map([0, 58 - L8.rc - 17]), l('vu suivant le jet — 1:1', 'seen along the jet — 1:1'), {
      size: 2.2,
      anchor: 'middle',
      color: COLORS.muted,
    });

    // ---- bucket section D–D 1:1
    const bs = d.view(360, 74, 1);
    bucketSection(bs, L8, 8);
    bs.dim([-L8.b, 0], [L8.b, 0], L8.t + 1.25 * L8.depth + 4, { dir: 'h', label: `B = ${(2 * L8.b).toFixed(0)}` });
    bs.dim([L8.b / 2, 0], [L8.b / 2, -L8.depth], L8.b / 2 + 7, { dir: 'v', label: `T = ${L8.depth.toFixed(0)}` });
    bs.dim([0, 0], [0, -(L8.t + 1.25 * L8.depth)], -(L8.b + 5), {
      dir: 'v',
      size: 2.2,
      label: tr(dec(L8.t + 1.25 * L8.depth)),
    });
    bs.dim([-4, 30], [4, 30], -3, { dir: 'h', label: 'd = 8', size: 2.2, color: COLORS.water });
    p.text(bs.map([L8.b + 3, 18]), '15°', { size: 2.2, mono: true });
    p.text(bs.map([-L8.b - 3, 18]), '15°', { size: 2.2, mono: true, anchor: 'end' });
    p.text(bs.map([L8.b + 2, 34]), l('déviation ≈ 165°', 'deflection ≈ 165°'), { size: 2.2, color: COLORS.water });
    bs.leader([-L8.b + 0.6, -1.4], -12, 10, l('rive ép. 2,4', 'rim 2.4 thick'));
    bs.caption([0, -32], l('COUPE D–D (au rayon R121)', 'SECTION D–D (at R121)'), '1:1');
    bf.sectionMark([-L8.b - 9, 0], [L8.b + 9, 0], 'D', 1);

    // ---- design table: classic ratios vs the model's S and L sets
    const ty = 150;
    p.text(
      [236, ty - 3],
      l('PROPORTIONS D’AUGET — règle classique → modèle 3D', 'BUCKET PROPORTIONS — classic rule → 3D model'),
      { size: 2.4, weight: 'bold' },
    );
    const row = (label: Text, rule: Text, f: (s: Spec, dj: number) => [number, number] | string): Text[] => {
      const cell = (s: Spec, dj: number): Text => {
        const r = f(s, dj);
        return typeof r === 'string'
          ? r
          : l(`${tr(dec(r[0]))} → ${tr(dec(r[1]))}`, `${dec(r[0]).en} → ${dec(r[1]).en}`);
      };
      return [label, rule, cell(S6, 6), cell(L8, 8)];
    };
    d.table(
      236,
      ty,
      [
        { label: l('Grandeur', 'Quantity'), w: 46 },
        { label: l('Règle', 'Rule'), w: 24 },
        { label: l('Jeu S (d = 6)', 'S set (d = 6)'), w: 49 },
        { label: l('Jeu L (d = 8)', 'L set (d = 8)'), w: 49 },
      ],
      [
        row(l('B largeur (axiale)', 'B width (axial)'), l('3,2 d', '3.2 d'), (s, dj) => [3.2 * dj, 2 * s.b]),
        row(
          l('L longueur (radiale)', 'L length (radial)'),
          l('2,7–3 d', '2.7–3 d'),
          (s, dj) => `${tr(dec(2.7 * dj))}–${tr(dec(3 * dj))} → ${tr(dec(2 * s.a))}`,
        ),
        row(l('T profondeur', 'T depth'), l('0,9 d', '0.9 d'), (s, dj) => [0.9 * dj, s.depth]),
        row(l('M échancrure', 'M notch width'), l('1,1 d', '1.1 d'), (s, dj) => [1.1 * dj, maxNotch(s)]),
        row(l('Ø extérieur roue', 'Runner tip Ø'), '—', (s) => `Ø${(2 * tipR(s)).toFixed(0)}`),
        row(
          l('z nombre d’augets', 'z bucket count'),
          '15 + D/2d',
          (_s, dj) => `${Math.round(15 + 230 / (2 * dj))} → 22`,
        ),
        row(l('D/d (≥ 10)', 'D/d (≥ 10)'), 'D = 230', (_s, dj) => (230 / dj).toFixed(1).replace('.', tr(l(',', '.')))),
      ],
      5,
    );
    let ny = ty + 8 * 5 + 5;
    ny = note(
      d,
      236,
      ny,
      168,
      l(
        'Le modèle utilise des augets ≈ 1,6 à 1,8 fois plus grands que la règle classique (parois imprimées épaisses, tolérance au désalignement du jet) ; d’où 22 augets au lieu de 29 à 34.',
        'The model uses buckets ≈ 1.6–1.8 times larger than the classic rule (thick printed walls, tolerance to jet misalignment); hence 22 buckets instead of 29–34.',
      ),
    );
    ny = note(
      d,
      236,
      ny,
      168,
      l(
        'Vitesse optimale : u/v ≈ 0,46 avec u = π·D·n/60 → n ≈ 1 480 tr/min à 76 m (v ≈ 38,6 m/s), ≈ 780 tr/min à 21 m (v ≈ 20,3 m/s).',
        'Best speed: u/v ≈ 0.46 with u = π·D·n/60 → n ≈ 1,480 rpm at 76 m (v ≈ 38.6 m/s), ≈ 780 rpm at 21 m (v ≈ 20.3 m/s).',
      ),
    );
    ny = note(
      d,
      236,
      ny,
      168,
      l(
        'Données constructeur Hydronome (site officiel, 2024) : 26 augets en polymère renforcé injecté, roue Ø244 ext., buse Ø14 maxi.',
        'Hydronome maker data (official site, 2024): 26 injection-moulded reinforced-polymer buckets, Ø244 runner OD, Ø14 max nozzle.',
      ),
      { color: COLORS.v2 },
    );
    note(
      d,
      236,
      ny,
      168,
      l(
        'Calage : axe du jet dans le plan médian de la roue (± 1 mm) et tangent au cercle primitif Ø230 ; le jet doit frapper l’arête médiane, sinon une coquille travaille plus que l’autre.',
        'Alignment: jet axis in the runner mid-plane (± 1 mm) and tangent to the Ø230 pitch circle; the jet must hit the splitter ridge, otherwise one half-cup works harder than the other.',
      ),
    );

    // ---- parts list + assembly notes (bottom left)
    const ly = 214;
    d.table(
      14,
      ly,
      [
        { label: l('Rep.', 'Item'), w: 9, align: 'middle' },
        { label: l('Désignation', 'Description'), w: 92 },
        { label: l('Matière', 'Material'), w: 34 },
        { label: l('Qté', 'Qty'), w: 9, align: 'end' },
      ],
      [
        ['1', l('Moyeu Ø170 × 12, alésage Ø44', 'Hub disc Ø170 × 12, Ø44 bore'), 'PETG 100 %', '1'],
        ['2', l('Auget à pied fourchu (jeu S ou L)', 'Bucket with forked root (S or L set)'), 'PETG / ASA', '22'],
        ['3', l('Bague de serrage Ø174 / Ø124 × 5', 'Clamping ring Ø174 / Ø124 × 5'), 'PETG', '1'],
        ['4', l('Vis M4 × 30 + écrou nylstop', 'M4 × 30 bolt + nyloc nut'), l('inox A4', 'A4 stainless'), '22'],
        ['5', l('Bride Ø90, alésage conique', 'Ø90 flange, taper bore'), l('acier', 'steel'), '1'],
        [
          '6',
          l('Douille Taper-Lock 1108 Ø20 + clavette 6 × 6', 'Taper-Lock 1108 bush Ø20 + 6 × 6 key'),
          l('fonte', 'cast iron'),
          '1',
        ],
        ['7', l('Rondelle + écrou M16 nylstop', 'Washer + M16 nyloc nut'), l('inox A4', 'A4 stainless'), '1'],
      ],
      4.4,
    );
    let ay = ly + 8 * 4.4 + 3;
    const steps: Text[] = [
      l(
        'Emboîter les 22 augets sur le moyeu, poser la bague, serrer les M4 en croix à 2,5 N·m.',
        'Fit the 22 buckets on the hub, add the ring, tighten the M4 bolts crosswise to 2.5 N·m.',
      ),
      l(
        'Équilibrer la roue seule (balourd ≤ 2 g à R120), puis visser la bride (4 × M5, 4 N·m).',
        'Balance the bare runner (≤ 2 g at R120), then screw on the flange (4 × M5, 4 N·m).',
      ),
      l(
        'Douille propre et sèche, 2 vis 1/4" BSW à 5,7 N·m, puis rondelle et écrou M16.',
        'Bush clean and dry, 2 × 1/4" BSW screws at 5.7 N·m, then washer and M16 nut.',
      ),
    ];
    steps.forEach((s, i) => {
      ay = note(d, 14, ay, 192, s, { bullet: `${i + 1}.` }) - 0.4;
    });
    return d;
  },
};
