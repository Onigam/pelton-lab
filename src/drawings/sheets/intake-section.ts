import type * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import {
  BAR,
  BAR_COUNT,
  BAR_PITCH,
  BOX,
  CREST,
  DRAIN,
  FRAME,
  HALF_W,
  OUTLET,
  PHI_E,
  PHI_S,
  PIPE_PTS,
  R_PLATE,
  R_SCREEN,
  ROD_R,
  ROD_Z,
  S_END,
  S_LIPARC,
  S_PLATE,
  S_SCREEN,
  SC,
  SCREEN_LEN,
  VENT,
  VENT_TOP,
  bedY,
  pondY,
  profile,
  profileAt,
  profileY,
} from '../../three/intake/dims';
import { COLORS, Drawing, INK, INK_2, View, W, type Pt, type Text } from '@onigam/lab-kit/drawings';
import type { DrawingSheet } from '@onigam/lab-kit/drawings';
import {
  arcDim,
  arrowLine,
  breakMark,
  cat,
  flowArrow,
  levelMark,
  nf,
  notes,
  radiusPartial,
  stonePattern,
} from './hyd-symbols';

// PL-H03 — Coanda intake of site B at 1:10, straight from the 3D geometry (dims.ts, model
// metres -> drawing millimetres): longitudinal section A–A on the screen centre line, top
// view (first-angle: under the section), 10:1 detail of the wedge wires, parts list, notes.

const mm = (v: THREE.Vector2): Pt => [v.x * 1000, v.y * 1000];
const P = (s: number, off = 0): Pt => mm(profileAt(s, off));
const yProf = (xMm: number) => profileY(xMm / 1000) * 1000;
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const CREST_Y = CREST.y * 1000;
const POND = pondY(1) * 1000;
const T = 2.5; // stainless sheet
const LEVEL_FULL = profile(S_SCREEN).p.y * 1000; // box brim-full = lowest point of the screen
const OUT = { x: OUTLET.x * 1000, y: OUTLET.y * 1000 };
const STEEL = '#e6e9ec';
/** Model window (mm) of detail B, around the outlet and the sand trap. */
const DB = { x0: -10, x1: 330, y0: 212, y1: 520 };
const SAND = '#dcc79c';

/** Water sheet thickness over the profile (m): thins as it accelerates, then is drawn off. */
const sheet = (s: number) =>
  s < S_PLATE
    ? 0.018 - (0.011 * Math.max(0, s + 0.07)) / (S_PLATE + 0.07)
    : 0.007 - 0.0055 * Math.min(1, (s - S_PLATE) / SCREEN_LEN);

function ground(v: View, d: Drawing): void {
  const stone = stonePattern(d);
  const bed = (x0: number, x1: number) => range(x0, x1, 40).map((x): Pt => [x, bedY(x / 1000) * 1000]);
  const up = bed(-1000, -470);
  const down = bed(-250, 760);
  v.polyline([...up, [-470, 130], [-1000, 130]], { closed: true, w: 0, hatch: 'earth' });
  v.polyline([...down, [760, 130], [-250, 130]], { closed: true, w: 0, hatch: 'earth' });
  v.polyline(up, { w: W.medium });
  v.polyline(down, { w: W.medium });
  // weir core under the sill (dry stone, cut), slabs carrying the box and the sand trap
  v.polyline(
    [
      [-470, up[up.length - 1][1]],
      [-370, 585],
      [-370, 500],
      [-250, 500],
      [-250, 190],
      [-250, 130],
      [-470, 130],
    ],
    { closed: true, w: W.medium, fill: stone },
  );
  for (const [x, top] of [
    [-130, 297],
    [-10, 297],
    [140, 227],
  ] as const) {
    v.rect([x - (x > 100 ? 65 : 90), 180], [x + (x > 100 ? 65 : 90), top], { w: W.thin, fill: stone });
  }
}

function water(v: View): void {
  const top = range(-0.07, S_END, 50).map((s) => P(s, sheet(s)));
  const bottom = range(S_END, -0.07, 50).map((s) => P(s));
  // pond against the sill, then the sheet over the plate, the screen and the lip
  v.polyline(
    [
      [-1000, POND],
      [-370, POND],
      [-370, 585],
      [-470, 585],
      ...range(-470, -1000, 20).map((x): Pt => [x, bedY(x / 1000) * 1000]),
    ],
    { closed: true, w: 0, fill: COLORS.waterFill, hatch: 'water' },
  );
  v.polyline([...top, ...bottom], { closed: true, w: 0, fill: COLORS.waterFill });
  v.polyline([[-1000, POND], [-370, POND], ...top], { w: W.thin, color: COLORS.water });
  // overflow nappe falling into the plunge pool, downstream water
  const end = P(S_END);
  const nappe = (dx: number): Pt[] => range(0, 1, 12).map((t) => [end[0] + dx + 75 * t, end[1] - 115 * t * t - 40 * t]);
  v.polyline([...nappe(0), ...nappe(-14).reverse()], { closed: true, w: 0, fill: COLORS.waterFill });
  v.polyline(nappe(0), { w: W.thin, color: COLORS.water });
  const surf = 212;
  v.polyline(
    [
      [230, surf],
      ...range(240, 760, 20)
        .map((x): Pt => [x, bedY(x / 1000) * 1000])
        .reverse()
        .slice(0, 1),
      [760, surf],
    ],
    { w: 0 },
  );
  v.polyline(
    [[232, surf], [760, surf], ...range(760, 232, 30).map((x): Pt => [x, Math.min(surf, bedY(x / 1000) * 1000)])],
    { closed: true, w: 0, fill: COLORS.waterFill, hatch: 'water' },
  );
  v.line([232, surf], [760, surf], { w: W.thin, color: COLORS.water });
  // collection box brim-full up to the screen, rain of water through the slots
  const lip = range(S_SCREEN, S_LIPARC + 0.03, 8).map((s) => P(s, -T / 1000));
  v.polyline(
    [
      [-198, LEVEL_FULL],
      ...lip.filter((q) => q[0] < 203),
      [203, yProf(203) - T],
      [203, 232],
      [116, 232],
      [71, 301],
      [-198, 301],
    ],
    { closed: true, w: 0, fill: COLORS.waterFill },
  );
  v.line([-198, LEVEL_FULL], [180, LEVEL_FULL], { w: W.thin, color: COLORS.water });
  for (const x of range(-140, 150, 7))
    v.line([x, yProf(x) - 12], [x, LEVEL_FULL + 6], { w: 0.12, color: COLORS.water, dash: [1, 1.4] });
}

function steel(v: View): void {
  // far frame board and cheek seen beyond the cutting plane
  // (only its top edge shows above the cheek; the rest hides behind the cut parts)
  const fx1 = FRAME.x1 * 1000;
  v.polyline([...range(-370, fx1, 30).map((x): Pt => [x, yProf(x) + 100]), [fx1, yProf(fx1) + 40]], {
    w: W.thin,
    color: INK_2,
  });
  v.polyline(
    range(-0.07, S_END, 40).map((s) => P(s, 0.055)),
    { w: W.thin, color: INK_2 },
  );
  v.polyline(
    range(-0.07, S_END, 40).map((s) => P(s, -0.03)),
    { w: W.thin, color: INK_2 },
  );
  v.line(P(S_END, 0.055), P(S_END, -0.03), { w: W.thin, color: INK_2 });
  // sill (two planks, cut) under the crest flange
  v.rect([-370, 500], [-302, 648], { w: W.medium, fill: '#f1e4cf', hatch: 'wood' });
  v.rect([-370, 652], [-302, CREST_Y - T], { w: W.medium, fill: '#f1e4cf', hatch: 'wood' });
  // stainless profile (cut): flange + plate, wedge-wire screen, lip and drip edge
  v.polyline([[-370, 765], ...range(-0.07, S_PLATE, 12).map((s) => P(s))], { w: W.thick });
  v.polyline(
    range(S_PLATE, S_SCREEN, 30).map((s) => P(s)),
    { w: 0.9, dash: [0.25, 0.3] },
  );
  v.polyline(
    range(S_PLATE, S_SCREEN, 30).map((s) => P(s, -BAR.depth - ROD_R)),
    { w: W.thin },
  );
  v.polyline([...range(S_SCREEN, S_END, 12).map((s) => P(s)), P(S_END, -0.018)], { w: W.thick });
  v.line(P(S_LIPARC, -T / 1000), P(S_LIPARC, -0.02), { w: W.medium });
  for (const s of [S_PLATE, S_SCREEN])
    v.polyline([P(s - 0.006), P(s + 0.006), P(s + 0.006, -0.016), P(s - 0.006, -0.016)], {
      closed: true,
      w: 0,
      fill: INK,
    });
  v.rect([CREST.x * 1000 - 61, CREST_Y], [CREST.x * 1000 - 35, CREST_Y + 4], { w: 0, fill: INK });
  // collection box, sand-trap hopper and its sill (cut)
  v.polyline(
    [
      [-200, yProf(-200) - T],
      [-200, BOX.floor * 1000],
      [BOX.trapX * 1000, BOX.floor * 1000],
      [BOX.trapX * 1000 + 45, BOX.trapBottom * 1000],
      [205, BOX.trapBottom * 1000],
      [205, yProf(205) - T],
    ],
    { w: W.thick },
  );
  v.line([BOX.trapX * 1000, BOX.floor * 1000], [BOX.trapX * 1000, BOX.floor * 1000 + 30], { w: W.thick });
  v.polyline(
    [
      [102, 250],
      [203, 250],
      [203, 232],
      [116, 232],
    ],
    { closed: true, w: 0, fill: SAND, hatch: 'earth' },
  );
}

function outlet(v: View): void {
  const { x, y } = OUT;
  // strainer seen end-on in the far wall, bulkhead nut behind, critical level
  v.circle([x, y], 46, { w: W.thin, dash: 'hidden', color: INK_2 });
  v.circle([x, y], 30, { w: W.medium, fill: STEEL });
  for (const [dx, dy] of [
    [0, 0],
    [14, 8],
    [-14, 8],
    [14, -8],
    [-14, -8],
    [0, 16],
    [0, -16],
  ])
    v.circle([x + dx, y + dy], 2.6, { w: 0.1 });
  v.line([-195, y + 31.5], [203, y + 31.5], { w: W.thin, color: COLORS.red, dash: 'hidden' });
  // flush drain on the near side, in front of the plane (phantom)
  v.circle([DRAIN.x * 1000, DRAIN.y * 1000], 21, { w: W.thin, dash: 'phantom' });
  // penstock behind the box (hidden), then on the far bank, with the vent tee
  const yc = (xm: number) => {
    const pts = PIPE_PTS.map((p) => [p.x * 1000, p.y * 1000]);
    for (let i = 1; i < pts.length; i++)
      if (xm <= pts[i][0])
        return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (xm - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0] || 1);
    return pts[pts.length - 1][1];
  };
  for (const k of [-1, 1]) {
    v.polyline(
      range(205, 700, 20).map((xm): Pt => [xm, yc(xm) + k * 31.5]),
      { w: W.thin },
    );
    v.line([x, yc(x) + k * 31.5], [205, yc(205) + k * 31.5], { w: W.thin, dash: 'hidden', color: INK_2 });
  }
  const vx = VENT.x * 1000;
  const vt = VENT_TOP * 1000;
  v.rect([vx - 55, yc(vx) - 40], [vx + 55, yc(vx) + 40], { w: W.thin, fill: COLORS.paper });
  v.polyline(
    [
      [vx - 16, yc(vx) + 40],
      [vx - 16, vt + 16],
      [vx + 86, vt + 16],
      [vx + 86, vt - 70],
      [vx + 54, vt - 70],
      [vx + 54, vt - 16],
      [vx + 16, vt - 16],
      [vx + 16, yc(vx) + 40],
    ],
    { closed: true, w: W.thin, fill: '#eceae4' },
  );
}

function sectionView(d: Drawing): View {
  const v = d.view(125, 125, 1 / 10);
  ground(v, d);
  water(v);
  steel(v);
  outlet(v);
  const p = d.paper();
  breakMark(p, v.map([700, 330]), 70);
  // radii, angles, developed lengths
  const PCm: Pt = [CREST.x * 1000, CREST_Y - R_PLATE * 1000];
  const SCm = mm(SC);
  radiusPartial(v, PCm, R_PLATE * 1000, 72, 150, 'R300', 0);
  radiusPartial(v, SCm, R_SCREEN * 1000, 56, 180, 'R1000');
  arcDim(v, PCm, R_PLATE * 1000 + 85, 62, 90, cat('⌒ ', nf(S_PLATE * 1000, 0)), { size: 2 });
  arcDim(v, SCm, R_SCREEN * 1000 + 85, 36, 62, cat('⌒ ', nf(SCREEN_LEN * 1000, 0), l(' grille', ' screen')), {
    size: 2,
  });
  for (const [s, phi] of [
    [S_PLATE, PHI_S],
    [S_SCREEN, PHI_E],
  ]) {
    const a = P(s);
    const deg = (phi * 180) / Math.PI;
    v.line(a, [a[0] + 75, a[1]], { w: W.thin, color: INK_2 });
    v.line(a, [a[0] + 75 * Math.cos(phi), a[1] - 75 * Math.sin(phi)], { w: W.thin, color: INK_2 });
    arcDim(v, a, 60, -deg, 0, `${Math.round(deg)}°`, { size: 2, labelOff: 3 });
  }
  // detail A call-out on the screen
  const da = P(S_PLATE + SCREEN_LEN * 0.3);
  v.circle(da, 40, { w: W.thin, color: INK_2 });
  p.text(v.map([da[0] - 52, da[1] - 30]), 'A', { size: 2.6, weight: 'bold', anchor: 'middle' });
  // detail B window (outlet and sand trap), levels referred to the crest
  v.rect([DB.x0, DB.y0], [DB.x1, DB.y1], { w: W.thin, color: INK_2, dash: 'hidden' });
  p.text(v.map([DB.x0 + 12, DB.y0 + 22]), 'B', { size: 2.6, weight: 'bold' });
  const lvl = (x: number, y: number, t: Text, o: { water?: boolean; left?: boolean } = {}) =>
    levelMark(p, v.map([x, y]), t, { ...o, size: 1.8 });
  lvl(-930, POND, cat('+', nf(POND - CREST_Y, 0)), { water: true });
  v.line([-560, CREST_Y], [-372, CREST_Y], { w: W.thin, color: INK_2 });
  lvl(-520, CREST_Y, l('±0 crête', '±0 crest'), { left: true });
  lvl(-150, LEVEL_FULL, cat(nf(LEVEL_FULL - CREST_Y, 0), l(' bac plein', ' box full')), { water: true });
  lvl(560, VENT_TOP * 1000 + 16, cat('+', nf(VENT_TOP * 1000 - CREST_Y, 0)));
  // part balloons (see the parts list)
  const b = (at: Pt, dx: number, dy: number, n: string) => v.leader(at, dx, dy, n, { balloon: true, size: 2.3 });
  b([-420, 300], -8, 6, '1');
  b(P(S_PLATE * 0.45), -2, -20, '2');
  b(P(S_PLATE + SCREEN_LEN * 0.6, 0.004), 17, -4, '3');
  b(P(S_LIPARC + 0.03), 12, -8, '4');
  b([-200, 420], -7, 6, '5');
  b([170, 236], 3, 13, '6');
  b([OUT.x + 22, OUT.y + 20], 13, -9, '7');
  b([VENT.x * 1000 - 16, 800], -9, 0, '8');
  b([-360, 880], -3, -16, '9');
  v.leader([650, 352], 2, -13, l('PEHD Ø63 → turbine (arrière-plan)', 'HDPE Ø63 → turbine (beyond)'), { size: 1.7 });
  v.leader(P(S_END + 0.02, -0.07), 8, 7, l('surplus + débris', 'surplus + debris'), { size: 1.7, color: COLORS.water });
  flowArrow(p, v.map([-640, 720]), 0, COLORS.water, 1.1);
  p.text(v.map([-990, 640]), l('retenue', 'pond'), { size: 2, color: COLORS.water, italic: true });
  return v;
}

function planView(d: Drawing): void {
  const v = d.view(125, 177, 1 / 10);
  const Q = (x: number, z: number): Pt => [x, -z];
  const R = (x0: number, z0: number, x1: number, z1: number, s: Parameters<View['rect']>[2]) =>
    v.rect(Q(x0, z0), Q(x1, z1), s);
  const zb = FRAME.zIn * 1000;
  const zo = FRAME.zOut * 1000;
  const fx0 = FRAME.x0 * 1000;
  const fx1 = FRAME.x1 * 1000;
  for (const k of [-1, 1]) {
    R(fx0, k * zb, fx1, k * zo, { w: W.medium, fill: '#f1e4cf', hatch: 'wood' });
    for (const x of [fx0, fx1 - 50]) R(x, k * zo, x + 50, k * (zo + 50), { w: W.medium, fill: '#dccbb0' });
  }
  const xs = profile(S_PLATE).p.x * 1000;
  const xe = profile(S_SCREEN).p.x * 1000;
  const xl = profile(S_END).p.x * 1000;
  const hw = HALF_W * 1000;
  R(-370, -hw, xl, hw, { w: W.medium, fill: STEEL });
  R(CREST.x * 1000 - 61, -hw, CREST.x * 1000 - 35, hw, { w: 0, fill: INK });
  R(xs, -hw, xe, hw, { w: W.thin, fill: COLORS.paper });
  for (let i = 0; i < BAR_COUNT; i += 6) {
    const x = profile(S_PLATE + (i + 0.5) * BAR_PITCH).p.x * 1000;
    v.line(Q(x, -hw), Q(x, hw), { w: 0.12 });
  }
  for (const z of ROD_Z) v.line(Q(xs, z * 1000), Q(xe, z * 1000), { w: W.thin, dash: 'hidden', color: INK_2 });
  for (const x of [-200, 205, -370, -302]) v.line(Q(x, -hw), Q(x, hw), { w: W.thin, dash: 'hidden', color: INK_2 });
  v.line(Q(xl, -hw), Q(xl, hw), { w: W.thick });
  // outlet through the far wall: bulkhead, reducer, blue compression nuts, HDPE
  const ox = OUT.x;
  R(ox - 30, -hw + 12, ox + 30, -120, { w: W.thin, dash: 'hidden', color: INK_2 });
  R(ox - 38.5, -hw, ox + 38.5, -370, { w: W.medium, fill: '#3a3d40' });
  for (const [z0, z1] of [
    [-370, -392],
    [-453, -475],
  ])
    R(ox - 45, z0, ox + 45, z1, { w: W.thin, fill: COLORS.acN });
  R(ox - 40, -392, ox + 40, -453, { w: W.medium, fill: '#3a3d40' });
  R(ox - 31.5, -475, ox + 31.5, -520, { w: W.medium, fill: '#2b2f33' });
  breakMark(d.paper(), v.map(Q(ox, -510)), 0);
  // flush drain on the near side: stub, valve, red lever, drain back to the stream
  const dx = DRAIN.x * 1000;
  R(dx - 21, hw, dx + 21, hw + 45, { w: W.medium, fill: STEEL });
  v.circle(Q(dx, hw + 70), 26, { w: W.medium, fill: '#cfd2d4' });
  v.line(Q(dx - 15, hw + 70), Q(dx + 85, hw + 70), { w: 0.7, color: COLORS.red });
  v.polyline([Q(dx, hw + 96), Q(dx + 10, hw + 120), Q(320, hw + 125)], { w: 4, color: '#c9ccce' });
  v.sectionMark(Q(-560, 0), Q(360, 0), 'A', -1);
  flowArrow(d.paper(), v.map(Q(-470, 150)), 0, COLORS.water, 1.1);
  flowArrow(d.paper(), v.map(Q(330, 150)), 0, COLORS.water, 1.1);
  // dimensions
  v.dim(Q(xl, -hw), Q(xl, hw), 6, { dir: 'v', size: 2 });
  v.dim(Q(fx1, -zo), Q(fx1, zo), 34, { dir: 'v', size: 2 });
  v.dim(Q(-200, hw), Q(205, hw), 19, { dir: 'h', size: 2 });
  v.dim(Q(CREST.x * 1000, hw), Q(xs, hw), 25, { dir: 'h', size: 2 });
  v.dim(Q(xs, hw), Q(xe, hw), 25, { dir: 'h', size: 2 });
  v.dim(Q(xe, hw), Q(xl, hw), 25, { dir: 'h', size: 2 });
  v.leader(
    Q(-50, ROD_Z[2] * 1000),
    -40,
    12,
    l('3 barres support Ø8 sous les fils', '3 Ø8 support rods under the wires'),
    { size: 1.7 },
  );
  v.leader(Q(-120, -200), -46, -6, l('141 fils (1 sur 6 représenté)', '141 wires (1 in 6 drawn)'), { size: 1.7 });
}

function detailA(d: Drawing): void {
  const v = d.view(282, 46, 10);
  const p = d.paper();
  const a = -BAR.tilt;
  const rot = ([u, w]: Pt, c: number): Pt => [c + u * Math.cos(a) - w * Math.sin(a), u * Math.sin(a) + w * Math.cos(a)];
  const half = (BAR.top * 1000) / 2;
  const dep = BAR.depth * 1000;
  const pitch = BAR_PITCH * 1000;
  const [u0, u1] = [-1.9, 8.1];
  // water sheet, support rod (cut lengthwise, broken), three wedge wires (local developed frame)
  v.rect([u0, 0.12], [u1, 1.7], { w: 0, fill: COLORS.waterFill, hatch: 'water' });
  v.line([u0, 1.7], [u1, 1.7], { w: W.thin, color: COLORS.water });
  const rodTop = -dep + 0.8;
  v.rect([u0, rodTop], [u1, -5.2], { w: 0, fill: STEEL, hatch: 'steel' });
  v.line([u0, rodTop], [u1, rodTop], { w: W.medium });
  v.polyline(
    range(u0, u1, 14).map((u, i): Pt => [u, -5.2 + (i % 2 ? 0.12 : -0.12)]),
    { w: W.thin },
  );
  for (const u of [u0, u1])
    v.polyline(
      range(-5.3, 1.8, 10).map((w, i): Pt => [u + (i % 2 ? 0.08 : -0.08), w]),
      { w: W.thin },
    );
  v.center([u0, 0], [u1, 0]);
  for (let i = 0; i < 3; i++) {
    const pts: Pt[] = [
      [-half, 0],
      [-0.13 * 2 * half, -dep],
      [0.13 * 2 * half, -dep],
      [half, 0],
    ];
    v.polyline(
      pts.map((q) => rot(q, i * pitch)),
      { closed: true, w: W.thick, fill: STEEL, hatch: 'steel' },
    );
  }
  // sheared layer diving into each slot, main flow, a grain riding over
  for (let i = 1; i < 3; i++) {
    const edge = rot([-half, 0], i * pitch);
    const sl = v.polyline(
      range(0, 1, 10).map((t): Pt => [edge[0] - 0.9 + 0.75 * t, edge[1] + 0.05 - 2.4 * t * t]),
      { w: 0.35, color: COLORS.water },
    );
    sl.setAttribute('marker-end', 'url(#arrow)');
  }
  arrowLine(v, [-1.7, 1.42], [0.2, 1.42], COLORS.water, W.medium);
  v.circle([7.1, 0.92], 0.75, { w: W.thin, fill: '#b9a27a' });
  // dimensions
  const b0l = rot([-half, 0], 0);
  const b0r = rot([half, 0], 0);
  const b1l = rot([-half, 0], pitch);
  v.dim(b0l, b0r, 6.5, { size: 2, label: '2,2' });
  v.dim(b0r, b1l, 6.5, { size: 2, label: l('1,0', '1.0') });
  v.dim([0, 0], [pitch, 0], -27, { dir: 'h', size: 2, label: l('pas 3,2', 'pitch 3.2') });
  v.dim(b0l, [b0l[0], -dep], -5, { dir: 'v', size: 2, label: '3,6' });
  const c2 = 2 * pitch;
  v.line([c2, 0], [c2 + 1.9, 0], { w: W.thin, color: INK_2 });
  v.line([c2, 0], rot([1.9, 0], c2), { w: W.thin, color: INK_2 });
  arcDim(v, [c2, 0], 1.6, -5, 0, '5°', { size: 2, labelOff: 3.4 });
  const lab = (at: Pt, dx: number, dy: number, t: Text, color?: string) =>
    v.leader(at, dx, dy, t, { size: 1.6, color });
  lab([-1.4, 1.45], 2, -10, l('lame rapide 1,5–2,5 m/s', 'fast sheet 1.5–2.5 m/s'), COLORS.water);
  lab(
    rot([-half, 0.02], pitch),
    30,
    -16,
    l('arête amont en saillie : découpe Δ ≈ 0,2 mm', 'proud upstream edge: slices Δ ≈ 0.2 mm'),
  );
  lab([7.4, 1.5], 6, -6, l('grain > 1 mm : passe dessus', 'grain > 1 mm rides over'));
  lab(rot([0.25, -2.4], c2), 13, 4, l('fil profilé inox,', 'stainless wedge wire,'));
  const wq = v.map(rot([0.25, -2.4], c2));
  p.text([wq[0] + 18, wq[1] + 6.6], l('pointe en bas', 'point down'), { size: 1.6, halo: true });
  lab([7.6, -4.4], 6, 7, l('barre support Ø8 soudée', 'welded Ø8 support rod'));
  lab([2.65, -1.5], 4, 30, l('fente 1 mm, s’élargit vers le bas', '1 mm slot, widening downwards'));
  p.text([331, 110], l('DÉTAIL A — FILS PROFILÉS (grille développée)', 'DETAIL A — WEDGE WIRES (screen developed)'), {
    size: 2.6,
    weight: 'bold',
    anchor: 'middle',
  });
  p.text([331, 114], '10:1', { size: 2.2, anchor: 'middle', mono: true, color: INK_2 });
}

/** Detail B at 1:5: the same geometry redrawn in a clipped view. */
function detailB(d: Drawing): void {
  const ox = 180;
  const oy = 226;
  const k = 1 / 5;
  const ns = 'http://www.w3.org/2000/svg';
  const box = { x: ox + DB.x0 * k, y: oy - DB.y1 * k, w: (DB.x1 - DB.x0) * k, h: (DB.y1 - DB.y0) * k };
  const clip = document.createElementNS(ns, 'clipPath');
  clip.setAttribute('id', 'clip-detail-b');
  const r = document.createElementNS(ns, 'rect');
  for (const [key, val] of Object.entries({ x: box.x, y: box.y, width: box.w, height: box.h, rx: 3 }))
    r.setAttribute(key, String(val));
  clip.append(r);
  d.svg.querySelector('defs')?.append(clip);
  const g = document.createElementNS(ns, 'g');
  g.setAttribute('clip-path', 'url(#clip-detail-b)');
  d.content.append(g);
  const v = new View(d, g, ox, oy, k);
  ground(v, d);
  water(v);
  steel(v);
  outlet(v);
  const p = d.paper();
  p.roundRect([box.x, box.y], [box.x + box.w, box.y + box.h], 3, { w: W.thin, color: INK_2 });
  v.center([OUT.x - 45, OUT.y], [OUT.x + 45, OUT.y]);
  v.center([OUT.x, OUT.y - 45], [OUT.x, OUT.y + 45]);
  v.dim([OUT.x, OUT.y], [OUT.x, LEVEL_FULL], 9, {
    dir: 'v',
    label: cat('S = ', nf(LEVEL_FULL - OUT.y, 0), ' ≥ 2 D'),
    size: 1.9,
  });
  v.dim([55, BOX.floor * 1000], [OUT.x, OUT.y], -3, { dir: 'v', size: 1.9 });
  const lvl = (x: number, y: number, t: Text, left = false, water = false) =>
    levelMark(p, v.map([x, y]), t, { size: 1.75, left, water });
  lvl(10, LEVEL_FULL, cat(nf(LEVEL_FULL - CREST_Y, 0), l(' bac plein', ' box full')), false, true);
  lvl(-5, BOX.floor * 1000, nf(BOX.floor * 1000 - CREST_Y, 0));
  lvl(300, BOX.trapBottom * 1000, nf(BOX.trapBottom * 1000 - CREST_Y, 0), true);
  p.text(v.map([0, OUT.y + 36]), l('entrée d’air', 'air entry'), { size: 1.6, color: COLORS.red, halo: true });
  v.leader([170, 241], 12, 7, l('sable', 'sand'), { size: 1.6 });
  p.text(
    [box.x + box.w / 2, box.y + box.h + 4.6],
    l('DÉTAIL B — SORTIE ET DESSABLEUR', 'DETAIL B — OUTLET AND SAND TRAP'),
    { size: 2.4, weight: 'bold', anchor: 'middle' },
  );
  p.text(
    [box.x + box.w / 2, box.y + box.h + 8.4],
    l('1:5 — crépine Ø60 perforée 3 mm vue de bout', '1:5 — Ø60 strainer, 3 mm holes, end view'),
    { size: 1.8, anchor: 'middle', color: INK_2 },
  );
  p.text(
    [box.x + box.w / 2, box.y + box.h + 11.6],
    l('purge DN32 côté rive en trait mixte', 'DN32 flush (bank side) in phantom line'),
    { size: 1.8, anchor: 'middle', color: INK_2 },
  );
}

function partsList(d: Drawing, x: number, y: number): void {
  const rows: [string, Text, Text][] = [
    [
      '1',
      l('Seuil + retenue', 'Weir + pond'),
      l('pierres sèches, ailes de part et d’autre', 'dry stone, wings on both sides'),
    ],
    [
      '2',
      l('Plaque d’accélération', 'Acceleration plate'),
      l('inox 304 ép. 2, R300, 0→28°, crête EPDM', '304 stainless 2 mm, R300, 0→28°, EPDM crest'),
    ],
    [
      '3',
      l('Grille Coanda', 'Coanda screen'),
      l('fil profilé inox, R1000, 28°→54°, fente 1 mm', 'stainless wedge wire, R1000, 28°→54°, 1 mm slot'),
    ],
    [
      '4',
      l('Lèvre de trop-plein', 'Overflow lip'),
      l('inox plié 54°→60° + bec 75, raidisseur', 'bent stainless 54°→60° + 75 drip, stiffener'),
    ],
    [
      '5',
      l('Bac de collecte', 'Collection box'),
      l('inox 304, 405 × 600, tampon ≈ 50 L', '304 stainless, 405 × 600, ≈ 50 L buffer'),
    ],
    [
      '6',
      l('Dessableur + purge', 'Sand trap + flush'),
      l('fosse −70, vanne ¼ tour DN32 (rouge)', '−70 pit, DN32 quarter-turn valve (red)'),
    ],
    [
      '7',
      l('Crépine + départ', 'Strainer + outlet'),
      l('inox perforé 3 mm, traversée, PEHD Ø63 PN10', 'perforated 3 mm, bulkhead, HDPE Ø63 PN10'),
    ],
    [
      '8',
      l('Évent (reniflard)', 'Air vent'),
      l('PVC Ø32, col de cygne, sommet > retenue', 'PVC Ø32, gooseneck, top > pond'),
    ],
    [
      '9',
      l('Cadre bois', 'Timber frame'),
      l('mélèze, planches 35, poteaux 50 × 50', 'larch, 35 boards, 50 × 50 posts'),
    ],
  ];
  d.paper().text([x, y - 2], l('NOMENCLATURE', 'PARTS LIST'), { size: 2.3, weight: 'bold' });
  d.table(
    x,
    y,
    [
      { label: 'Rep.', w: 9, align: 'middle' },
      { label: l('Désignation', 'Item'), w: 38 },
      { label: l('Caractéristiques', 'Specification'), w: 103 },
    ],
    rows,
    4.6,
  );
}

export const intakeSection: DrawingSheet = {
  id: 'intake-section',
  number: 'PL-H03',
  group: 'hydraulic',
  title: l('Prise d’eau Coanda — coupe', 'Coanda intake — section'),
  description: l(
    'Coupe longitudinale de la prise d’eau Coanda du site B au 1:10, tracée à partir de la géométrie du modèle 3D : plaque d’accélération R300, grille en fil profilé R1000 de 28° à 54°, bac de collecte, dessableur, crépine et évent. Le détail A au 10:1 montre comment chaque fil, incliné de 5°, découpe une fine couche d’eau qui tombe par la fente de 1 mm, tandis que les débris restent dans la lame et repartent au trop-plein. La vue de dessus donne la largeur utile de 600 mm et les barres support.',
    'Longitudinal section of the site B Coanda intake at 1:10, drawn from the 3D model geometry: R300 acceleration plate, R1000 wedge-wire screen from 28° to 54°, collection box, sand trap, strainer and vent. Detail A at 10:1 shows how each wire, tilted 5°, slices off a thin layer of water that drops through the 1 mm slot, while debris stays in the sheet and leaves over the overflow. The top view gives the 600 mm working width and the support rods.',
  ),
  scene: 'intake',
  parts: ['in-weir', 'in-ramp', 'in-screen', 'in-box', 'in-overflow', 'in-sandtrap', 'in-outlet', 'in-vent'],
  render(): Drawing {
    const d = new Drawing();
    d.frame({
      title: l('Prise d’eau Coanda', 'Coanda intake'),
      subtitle: l(
        'Site B — coupe A–A, vue de dessus et détail des fils profilés',
        'Site B — section A–A, top view and wedge-wire detail',
      ),
      number: 'PL-H03',
      scale: '1:10 · 10:1',
    });
    const p = d.paper();
    sectionView(d);
    p.text([20, 121], l('COUPE A–A', 'SECTION A–A'), { size: 3, weight: 'bold' });
    p.text([20, 125], l('1:10 — cotes en mm, niveaux / crête', '1:10 — mm, levels from the crest'), {
      size: 2,
      mono: true,
      color: INK_2,
    });
    planView(d);
    p.text([20, 229], l('VUE DE DESSUS', 'TOP VIEW'), { size: 3, weight: 'bold' });
    p.text([20, 233], l('1:10 — sans eau', '1:10 — without water'), { size: 2, mono: true, color: INK_2 });
    detailB(d);
    detailA(d);
    partsList(d, 255, 125);
    notes(
      p,
      255,
      180,
      150,
      l('NOTES', 'NOTES'),
      [
        l(
          'Principe : la lame accélérée sur la plaque épouse la grille (effet Coanda) ; l’arête amont de chaque fil découpe une couche d’environ 0,2 mm qui tombe dans le bac. Feuilles, brindilles et grains de plus de 1 mm restent dans la lame et partent au trop-plein : la grille est autonettoyante.',
          'Principle: the sheet accelerated on the plate clings to the screen (Coanda effect); the upstream edge of each wire slices off a layer of about 0.2 mm that drops into the box. Leaves, twigs and grains over 1 mm stay in the sheet and leave over the overflow: the screen cleans itself.',
        ),
        l(
          'Toujours garder un débordement visible au bout de la grille : le bac reste plein, la sortie reste noyée (S ≥ 2 D) et aucune bulle n’entre dans la conduite. S’il disparaît, réduire la buse ou fermer l’injecteur variable.',
          'Always keep a visible overflow at the end of the screen: the box stays full, the outlet stays submerged (S ≥ 2 D) and no bubble enters the penstock. If it disappears, use a smaller nozzle or close the variable injector.',
        ),
        l(
          'Entretien : un coup de brosse par trimestre, dans le sens du courant (plus souvent à la chute des feuilles) ; purger le dessableur à chaque visite et après chaque crue : un injecteur à pointeau ne tolère pas le sable.',
          'Maintenance: brush once a quarter, along the flow (more often when leaves fall); flush the sand trap at every visit and after every flood: a spear injector does not tolerate sand.',
        ),
      ],
      1.85,
    );
    notes(
      p,
      14,
      242,
      214,
      null,
      [
        l(
          'Pose : fils face plate en haut, arête amont en saillie ; joues latérales jointives contre le cadre pour que l’eau ne contourne pas la grille. Capacité grille propre retenue dans le simulateur : ≈ 12 L/s.',
          'Fitting: wires flat face up, upstream edge proud; side cheeks tight against the frame so water cannot bypass the screen. Clean-screen capacity used in the simulator: ≈ 12 L/s.',
        ),
        l(
          'Débit réservé : la prise ne doit jamais assécher le ruisseau ; laisser passer au moins le débit minimal biologique (en général 1/10 du module, art. L214-18 du Code de l’environnement).',
          'Residual flow: the intake must never dry up the stream; always let at least the minimum ecological flow through (usually 1/10 of the mean annual flow, French Environment Code art. L214-18).',
        ),
        l(
          'Réglementation : un seuil et une prise d’eau en cours d’eau sont soumis à déclaration ou autorisation (loi sur l’eau) : se renseigner auprès de la DDT et de l’OFB avant tout travaux.',
          'Regulation: a weir and an intake in a watercourse require a declaration or an authorisation (French water law): check with the DDT and the OFB before any work.',
        ),
      ],
      1.85,
      4,
    );
    return d;
  },
};
