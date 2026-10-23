import { l, tr, type L } from '../../i18n';
import { bucketEfficiency } from '../../sim/physics';
import { presetParams } from '../../sim/presets';
import { COLORS, Drawing, W, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import {
  clipPoly,
  DEFLECTORS,
  M,
  note,
  R_TIP_MM,
  rot,
  RUNNER,
  SIDE,
  silhouette,
  spec,
  SPEAR,
  tipR,
  type Box,
} from './turbine-geom';

// PL-T04 — injectors. Geometry from the 3D model (hydraulics.ts, dims.ts, index.ts through
// turbine-geom.ts), mm: spear injector on the roof, side lance through the tall wall,
// deflector pivots, blades and angles. Inner bores are not modelled in 3D: they are drawn
// with a 4–10 mm wall.

const PAPER = COLORS.paper;
const deg = Math.PI / 180;
const G = 9.81;
const AX = M.axisY;
const N = SPEAR.tip;
const R = M.roof;
/** Quick-change inserts modelled in 3D (turbine/index.ts colours) + optional sizes (*). */
const INSERTS: [number, string, L][] = [
  [4, '#8a9099', l('gris', 'grey')],
  [5, '#2b6cd1', l('bleu', 'blue')],
  [6, '#2f9e44', l('vert', 'green')],
  [7, '#e8b923', l('jaune *', 'yellow *')],
  [8, '#f08c00', l('orange', 'orange')],
  [10, '#d6336c', l('magenta', 'magenta')],
  [12, '#7048e8', l('violet *', 'violet *')],
  [M.maxNozzle, 'none', l('maxi roue *', 'runner max *')],
];
/** Q = Cd·π·d²/4·√(2gH), Cd = 0.96, in L/s. */
const flow = (dMm: number, h: number) => 0.96 * ((Math.PI * (dMm / 1000) ** 2) / 4) * Math.sqrt(2 * G * h) * 1000;
const dec = (v: number, n: number): L => l(v.toFixed(n).replace('.', ','), v.toFixed(n));
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y]);
const mirrorIf = (pts: Pt[], sg: number): Pt[] => (sg > 0 ? pts : mirror(pts));
const flipY = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x, -y]);
const st = (h: Stroke['hatch'], w = W.medium): Stroke => ({ w, hatch: h, fill: PAPER });
const box = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];
/** Bucket set suited to a jet diameter (simulator bucket efficiency). */
const setFor = (d: number): string => {
  const s = bucketEfficiency(d, 'S');
  const lg = bucketEfficiency(d, 'L');
  return Math.abs(s - lg) < 0.03 ? 'S / L' : s > lg ? 'S' : 'L';
};

/** Spear (needle) outline, right half, for a lift s: olive Ø23 × 50.6 + tip cone, rod Ø9. */
function needleHalf(s: number, rodTop: number): Pt[] {
  const pts: Pt[] = [];
  for (let y = N - 1; y <= N + 53.3; y += 0.6) {
    const cone = y <= N + 21 ? (8.5 * (y - N + 1)) / 22 : 0;
    const e = (y - N - 30) / 25.3;
    const ell = Math.abs(e) < 1 ? 11.5 * Math.sqrt(1 - e * e) : 0;
    pts.push([Math.max(cone, ell, y > N + 40 ? 4.5 : 0), y + s]);
  }
  pts.push([4.5, rodTop + s]);
  return pts;
}

/** Section of the spear injector in the plane z = pipeZ (x' = x − topJetX, y = machine height). */
function spearSection(v: View): void {
  const T = SPEAR.bodyTop;
  const B = SPEAR.bodyBot;
  const iy = SPEAR.inlet.y;
  const ix = -SPEAR.inlet.len / 2 - (SPEAR.x - SPEAR.inlet.x); // left end of the inlet stub
  const c = N + 32; // top of the inner cone
  // water in the bore and the jet (drawn first, under the parts)
  v.polyline(
    [
      [-22, T - 10],
      [22, T - 10],
      [22, c],
      [7.5, N + 8],
      [6, N],
      [-6, N],
      [-7.5, N + 8],
      [-22, c],
      [-22, iy - 20],
      [ix, iy - 20],
      [ix, iy + 20],
      [-22, iy + 20],
    ],
    { closed: true, w: 0, fill: COLORS.waterFill },
  );
  v.rect([-6, N - 44], [6, N], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.line([0, N - 8], [0, N - 40], { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  // body (right half closed, left half split by the side inlet)
  v.polyline(
    [
      [32, T],
      [32, B],
      [11.5, N + 8],
      [7.5, N + 8],
      [22, c],
      [22, T - 10],
      [9, T - 10],
      [9, T],
    ],
    { closed: true, ...st('steel') },
  );
  v.polyline(
    [
      [-9, T],
      [-9, T - 10],
      [-22, T - 10],
      [-22, iy + 20],
      [ix, iy + 20],
      [ix, iy + 26],
      [-32, iy + 26],
      [-32, T],
    ],
    { closed: true, ...st('steel') },
  );
  v.polyline(
    [
      [ix, iy - 20],
      [-22, iy - 20],
      [-22, c],
      [-7.5, N + 8],
      [-11.5, N + 8],
      [-32, B],
      [-32, iy - 26],
      [ix, iy - 26],
    ],
    { closed: true, ...st('steel') },
  );
  // stainless nozzle tip (orifice = spear maximum)
  for (const sg of [1, -1]) {
    v.polyline(
      mirrorIf(
        [
          [6, N],
          [SPEAR.tipR, N],
          [SPEAR.tipR, N + 8],
          [7.5, N + 8],
        ],
        sg,
      ),
      { closed: true, ...st('alu', W.thin) },
    );
    // gland nut + packing
    v.polyline(
      mirrorIf(
        [
          [9, T],
          [20, T],
          [20, T + SPEAR.glandH],
          [5, T + SPEAR.glandH],
          [5, T + 18],
          [9, T + 18],
        ],
        sg,
      ),
      { closed: true, ...st('steel', W.thin) },
    );
    v.polyline(mirrorIf(box(5, T, 9, T + 18), sg), { closed: true, ...st('rubber', W.thin) });
    // roof flange (printed), gasket, roof sheet, 4 × M5
    const f = SPEAR.flange;
    v.polyline(mirrorIf(box(30.5, f.y0, f.half, f.y1), sg), { closed: true, ...st('plastic', W.thin) });
    v.polyline(mirrorIf(box(30.5, f.y1, 40, B), sg), { closed: true, ...st('rubber', W.thin) });
    v.polyline(mirrorIf(box(25.4, R - M.sheet, sg > 0 ? 66 : 80, R), sg), {
      closed: true,
      w: W.thin,
      fill: COLORS.ink,
    });
    v.rect([sg * (f.bolt - 2.5), R - 6], [sg * (f.bolt + 2.5), f.y1], { w: W.thin, fill: PAPER });
    v.rect([sg * (f.bolt - 4), f.y1], [sg * (f.bolt + 4), f.y1 + 6], { w: W.thin, fill: PAPER });
  }
  // spear: closed (solid) and fully open (phantom)
  const rodTop = T + 10;
  const half = needleHalf(0, rodTop);
  v.polyline([...half, ...mirror(half).reverse()], { closed: true, w: W.medium, fill: PAPER });
  const open = needleHalf(SPEAR.stroke, rodTop);
  v.polyline([...open, ...mirror(open).reverse()], { closed: true, w: W.thin, dash: 'phantom', color: COLORS.muted });
  // operating spindle + handwheel (not sectioned)
  const wy = SPEAR.wheel.y;
  const wr = SPEAR.wheel.r;
  v.rect([-5, rodTop], [5, wy + 10], { w: W.medium, fill: PAPER });
  v.line([-4.5, rodTop], [4.5, rodTop], { w: W.thin });
  for (const sg of [1, -1]) {
    v.rect([sg * 8, wy - 2], [sg * (wr - 5), wy + 2], { w: W.thin, fill: PAPER });
    v.circle([sg * wr, wy], SPEAR.wheel.tube, { w: W.medium, fill: '#f3d5d2' });
  }
  v.rect([-8, wy - 6], [8, wy + 6], { w: W.medium, fill: PAPER });
  // PVC Ø50 riser end into the side inlet
  v.rect([ix - 37.5, iy - 25], [ix, iy + 25], { w: W.medium, fill: PAPER });
  v.polyline(
    [
      [ix - 37.5, iy + 27],
      [ix - 40.5, iy + 10],
      [ix - 34.5, iy - 10],
      [ix - 37.5, iy - 27],
    ],
    { w: W.thin },
  );
  v.center([0, N - 50], [0, wy + 14]);
  v.center([ix - 41, iy], [-20, iy]);
}

/** Side injector section in the plane z = pipeZ (x machine, y' = y − sideJetY). */
function sideSection(v: View, d: number): void {
  const both = (pts: Pt[], s: Stroke) => {
    v.polyline(pts, { closed: true, ...s });
    v.polyline(flipY(pts), { closed: true, ...s });
  };
  const tip = SIDE.tip;
  const fx0 = SIDE.flangeX - SIDE.flangeL / 2;
  const fx1 = SIDE.flangeX + SIDE.flangeL / 2;
  /** Outer radius of the lance at x (linear taper in hydraulics.ts). */
  const ro = (x: number) => SIDE.r0 + ((SIDE.r1 - SIDE.r0) * (x - fx1)) / (tip - fx1);
  const exit = tip + 1;
  // water + jet
  const bore: Pt[] = [
    [-450, 20],
    [fx1, 19],
    [tip - 11, 7],
    [tip - 2, 7],
    [tip - 0.5, d / 2],
    [exit, d / 2],
  ];
  v.polyline([...bore, ...flipY(bore).reverse()], { closed: true, w: 0, fill: COLORS.waterFill });
  v.rect([exit, -d / 2], [exit + 25, d / 2], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.line([exit + 4, 0], [exit + 24, 0], { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  // housing wall (2 mm alu sheet) and the reinforcing plate outside it
  both(box(M.x0, 20, M.x0 + M.sheet, 62), { w: W.thin, fill: COLORS.ink });
  both(box(M.x0 - 8, 20, M.x0, SIDE.plate / 2), st('alu', W.thin));
  // bayonet collar (colour = nozzle size) with two grip lugs, DN25 flange, aluminium lance
  const [cr, c0, c1] = SIDE.collar;
  v.rect([-490, 22], [c0, 25], st('plastic', W.thin));
  v.rect([-490, -25], [c0, -22], st('plastic', W.thin));
  both(box(c0, 20, c1, cr), { w: W.medium, hatch: 'plastic', fill: '#d3ecd9' });
  both(box(-465, 44, -445, 56), { w: W.thin, fill: PAPER });
  both(box(c1, 19.5, fx0, 24), st('alu', W.thin));
  both(
    [
      [fx0, 19.4],
      [fx1, 19],
      [fx1, SIDE.flangeR],
      [fx0, SIDE.flangeR],
    ],
    st('alu'),
  );
  both(
    [
      [fx1, 19],
      [fx1, SIDE.r0],
      [tip - 11, ro(tip - 11)],
      [tip - 11, 11.5],
      [tip - 2, 11.5],
      [tip - 2, 7],
      [tip - 11, 7],
    ],
    st('alu'),
  );
  // nozzle insert (coloured cap) with O-ring and bayonet pin on the spigot
  const [rr, rl] = SIDE.ring;
  both(
    [
      [exit - rl, 11.5],
      [exit - rl, rr],
      [exit, rr],
      [exit, d / 2],
      [tip - 0.5, d / 2],
      [tip - 2, 7],
      [tip - 2, 11.5],
    ],
    { w: W.medium, hatch: 'plastic', fill: '#d3ecd9' },
  );
  for (const sg of [1, -1]) {
    v.circle([tip - 7.5, sg * 11.5], 1.1, { w: W.thin, fill: COLORS.ink });
    v.rect([tip - 5, sg * 11.5], [tip - 3.5, sg * 13.2], { w: W.thin, fill: PAPER });
  }
  const left = -490;
  v.polyline(
    [
      [left, 27],
      [left - 3, 10],
      [left + 3, -10],
      [left, -27],
    ],
    { w: W.thin },
  );
  v.center([left - 4, 0], [exit + 28, 0]);
}

/** Partial front view (machine x, y) of the runner, both jets and the deflectors. */
function jetGeometry(v: View, b: Box, dTop: number, dSide: number): void {
  const ring = (r: number, s: Stroke) => {
    const a = (Math.acos(Math.min(1, b.x1 / r)) * 180) / Math.PI;
    v.arc([0, AX], r, a, 360 - a, s);
  };
  const L = spec('L');
  for (let i = 0; i < M.buckets; i++) {
    const a = (i / M.buckets) * Math.PI * 2;
    const pts = silhouette(L, 14).map((p) => {
      const [x, y] = rot(p, a);
      return [x, AX + y] as Pt;
    });
    const c = clipPoly(pts, b);
    if (c.length > 2) v.polyline(c, { closed: true, w: W.thin, fill: PAPER });
  }
  ring(RUNNER.ring[1], { w: W.thin });
  ring(M.rPitch, { w: W.thin, dash: 'center', color: COLORS.muted });
  ring(R_TIP_MM, { w: W.thin, dash: 'hidden', color: COLORS.muted });
  v.polyline(
    [
      [b.x1, AX - 120],
      [b.x1 - 3, AX - 40],
      [b.x1 + 3, AX + 40],
      [b.x1, AX + 120],
    ],
    { w: W.thin },
  );
  v.center([b.x0 + 40, AX], [b.x1 + 2, AX]);
  v.center([0, AX - 120], [0, AX + 120]);
  // roof sheet, spear injector (flange, cone, stainless tip) and side nozzle
  const x = SPEAR.x;
  const br = SPEAR.bodyR;
  v.rect([b.x0, R - M.sheet], [-30, R], { w: W.thin, fill: COLORS.ink });
  v.rect([x - SPEAR.flange.half, SPEAR.flange.y0], [x + SPEAR.flange.half, SPEAR.flange.y1], {
    w: W.medium,
    fill: PAPER,
  });
  v.polyline(
    [
      [x - br, b.y1],
      [x - br, SPEAR.bodyBot],
      [x - SPEAR.coneR, N + 6],
      [x + SPEAR.coneR, N + 6],
      [x + br, SPEAR.bodyBot],
      [x + br, b.y1],
    ],
    { w: W.medium },
  );
  v.rect([x - SPEAR.tipR, N], [x + SPEAR.tipR, N + 8], { w: W.medium, fill: PAPER });
  const fx1 = SIDE.flangeX + SIDE.flangeL / 2;
  const r0 = SIDE.r0 + ((SIDE.r1 - SIDE.r0) * (b.x0 - fx1)) / (SIDE.tip - fx1);
  const y = SIDE.y;
  const [rr, rl] = SIDE.ring;
  const ringX = SIDE.tip + 1;
  v.polyline(
    [
      [b.x0, y + r0],
      [ringX - rl, y + SIDE.r1 + 0.4],
      [ringX - rl, y - SIDE.r1 - 0.4],
      [b.x0, y - r0],
    ],
    { w: W.medium, fill: PAPER },
  );
  v.rect([ringX - rl, y - rr], [ringX, y + rr], { w: W.medium, fill: '#d3ecd9' });
  // jets, tangent to the pitch circle
  v.rect([x - dTop / 2, AX], [x + dTop / 2, N], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.rect([ringX, y - dSide / 2], [0, y + dSide / 2], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  v.center([x, AX - 8], [x, b.y1]);
  v.center([b.x0, y], [6, y]);
  for (const t of [
    [x, AX],
    [0, y],
  ] as Pt[])
    v.circle(t, 2, { w: W.thin, color: COLORS.water, fill: COLORS.water });
  // deflector blades: rest (solid) and tripped (phantom); the cut jets slide off the blades,
  // away from the runner (water.ts)
  const end = (p: Pt, len: number, ang: number): Pt => [
    p[0] + Math.cos(ang * deg) * len,
    p[1] + Math.sin(ang * deg) * len,
  ];
  for (const dfl of DEFLECTORS) {
    const p = dfl.pivot;
    v.line(p, [p[0] + 60, p[1]], { w: W.thin, color: COLORS.muted, dash: 'center' });
    v.line(p, end(p, dfl.len, dfl.rest), { w: W.thick, color: COLORS.accent });
    v.line(p, end(p, dfl.len, dfl.trip), { w: W.medium, color: COLORS.accent, dash: 'phantom' });
    if (dfl.rest) v.arc(p, 30, 0, dfl.rest, { w: W.thin, color: COLORS.accent });
    v.arc(p, 46, 0, dfl.trip, { w: W.thin, color: COLORS.accent });
    v.circle(p, 7, { w: W.medium, fill: PAPER, color: COLORS.accent });
    v.circle(p, 5, { w: W.thin, color: COLORS.accent });
  }
  const jets: [Pt, Pt][] = [
    [x, N - DEFLECTORS[0].hit],
    [SIDE.tip + DEFLECTORS[1].hit, y],
  ].map((h, i) => [h as Pt, (i ? [h[0] + 26, h[1] - 40] : [h[0] - 60, h[1] - 22]) as Pt]);
  for (const [from, to] of jets)
    v.line(from, to, { w: W.medium, color: COLORS.water, dash: 'hidden' }).setAttribute('marker-end', 'url(#arrow)');
}

export const injectors: DrawingSheet = {
  id: 'injectors',
  number: 'PL-T04',
  group: 'turbine',
  title: l('Injecteurs et jets', 'Injectors and jets'),
  description: l(
    `Coupe de l’injecteur à pointeau du haut (1:2) avec l’olive fermée et ouverte (course ${SPEAR.stroke} mm), coupe de la lance latérale en alu à inserts à baïonnette et tableau des inserts Ø4 à Ø${M.maxNozzle} avec leur débit à 76 m et 21 m de chute nette. À droite, la géométrie des jets (tangents au cercle primitif Ø${2 * M.rPitch}) et la cinématique des déflecteurs de sécurité.`,
    `Section of the top spear injector (1:2) with the olive closed and open (${SPEAR.stroke} mm stroke), section of the aluminium side lance with bayonet inserts and a table of Ø4 to Ø${M.maxNozzle} inserts with their flow at 76 m and 21 m net head. On the right, the jet geometry (tangent to the Ø${2 * M.rPitch} pitch circle) and the kinematics of the safety deflectors.`,
  ),
  scene: 'turbine',
  parts: ['injector-top', 'injector-quick', 'deflector', 'valve-branch'],
  render() {
    const pre = presetParams('siteA');
    const [dTop, dSide] = [pre.top.d, pre.side.d];
    const d = new Drawing();
    d.frame({
      title: l('Injecteurs et jets', 'Injectors and jets'),
      subtitle: l('Lance à inserts baïonnette + déflecteurs de sécurité', 'Bayonet insert lance + safety deflectors'),
      number: 'PL-T04',
      scale: '1:2',
    });
    const p = d.paper();
    const T = SPEAR.bodyTop;
    const wy = SPEAR.wheel.y;

    // ---- spear injector, section 1:2 (axis x' = 0)
    const sv = d.view(66, 312, 0.5);
    spearSection(sv);
    sv.dim([-dTop / 2, N], [dTop / 2, N], 13, { dir: 'h', label: `Ø${dTop}`, size: 2.2 });
    sv.dim([-43, wy], [43, wy], -6, { dir: 'h', size: 2.2, prefix: 'Ø' });
    sv.dim([12, N + 30], [12, N + 30 + SPEAR.stroke], 12, {
      dir: 'v',
      size: 2.2,
      label: l(`course ${SPEAR.stroke}`, `stroke ${SPEAR.stroke}`),
    });
    sv.dim([50, N], [50, SPEAR.flange.y1], 6, { dir: 'v', size: 2.2 });
    sv.dim([50, N], [43, wy + SPEAR.wheel.tube], 13, { dir: 'v', size: 2.2 });
    sv.leader([32, T - 30], 8, -8, `Ø${2 * SPEAR.bodyR}`);
    sv.leader([-26, T - 20], -16, -10, l('corps métal', 'metal body'));
    sv.leader([-6, N + 20], -18, 7, l('olive fermée', 'olive closed'));
    sv.leader([-8, N + 60], -20, 4, l('ouverte (fantôme)', 'open (phantom)'), { color: COLORS.muted });
    sv.leader([-10, N + 4], -14, 12, l('buse inox', 'stainless tip'));
    sv.leader([-14, T + 12], -12, -12, l('presse-étoupe', 'gland'));
    sv.leader([-38, wy], -8, -8, l('volant', 'handwheel'));
    sv.leader([-80, SPEAR.inlet.y + 10], 2, -14, 'PVC Ø50');
    sv.leader([-45, M.roof + 4], -8, 6, l('bride 4 × M5', '4 × M5 flange'));
    sv.caption([-10, N - 66], l('INJECTEUR À POINTEAU — coupe', 'SPEAR INJECTOR — section'), '1:2');

    // ---- side injector, section 1:2
    const exit = SIDE.tip + 1;
    const fx0 = SIDE.flangeX - SIDE.flangeL / 2;
    const xv = d.view(345, 58, 0.5);
    sideSection(xv, dSide);
    xv.dim([M.x0, 62], [exit, 16], -5, { dir: 'h', size: 2.2 });
    xv.dim([fx0, 42], [exit, 16], -22, { dir: 'h', size: 2.2 });
    xv.dim([exit, -dSide / 2], [exit, dSide / 2], 10, { dir: 'v', label: `Ø${dSide}`, size: 2.2 });
    const lab = (at: Pt, ex: number, ey: number, t: Text) => {
      const q = xv.map(at);
      xv.leader(at, ex - q[0], ey - q[1], t);
    };
    lab([M.x0 - 4, -SIDE.plate / 2 + 4], 226, 91, l('paroi + platine', 'wall + plate'));
    p.text(xv.map([SIDE.flangeX, 47]), 'DN25', { size: 2, anchor: 'middle' });
    lab([-447, -50], 126, 91, l('collier baïonnette ¼ tour, oreilles', '¼-turn bayonet collar, grips'));
    lab([-320, -20], 176, 98, l('lance alu', 'alu lance'));
    lab([SIDE.tip - 5, -16], 258, 98, l('insert + joint', 'insert + O-ring'));
    xv.caption([-400, -92], l('LANCE À INSERTS — coupe', 'INSERT LANCE — section'), '1:2');

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
      setFor(dm),
    ]);
    const cols = [
      { label: l('Buse', 'Nozzle'), w: 16 },
      { label: l('Couleur', 'Colour'), w: 30 },
      { label: l('Q à 76 m', 'Q at 76 m'), w: 28, align: 'end' as const },
      { label: l('Q à 21 m', 'Q at 21 m'), w: 28, align: 'end' as const },
      { label: l('P hydr. 76 m', 'Hydr. P 76 m'), w: 30, align: 'end' as const },
      { label: l('Augets', 'Buckets'), w: 20, align: 'middle' as const },
    ];
    const rh = 4.6;
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
        `Chute nette 76 m (site A) et 21 m (site B) ; le débit réel baisse avec les pertes de la conduite (Ø55 int., 350 m). * Ø7, Ø12 et Ø${M.maxNozzle} : inserts optionnels, non modélisés. Jeu d’augets selon le rendement d’auget du simulateur : S jusqu’à Ø7, L dès Ø8.`,
        `Net head 76 m (site A) and 21 m (site B); real flow drops with penstock losses (55 ID, 350 m). * Ø7, Ø12 and Ø${M.maxNozzle}: optional inserts, not modelled. Bucket set from the simulator’s bucket efficiency: S up to Ø7, L from Ø8.`,
      ),
    );
    ny = note(
      d,
      tx,
      ny,
      152,
      l(
        `Données constructeur Hydronome (site officiel) : buse Ø14 maxi (Q ≈ ${tr(dec(flow(14, 76), 1))} L/s à 76 m), 2 injecteurs ou 1 injecteur variable ; la roue L ${M.buckets} augets Ø${2 * R_TIP_MM} du modèle accepte cette buse.`,
        `Hydronome maker data (official site): Ø14 max nozzle (Q ≈ ${flow(14, 76).toFixed(1)} L/s at 76 m), 2 injectors or 1 variable injector; the model’s ${M.buckets}-bucket Ø${2 * R_TIP_MM} L runner takes this nozzle.`,
      ),
    );

    // ---- jet geometry + deflector kinematics, partial view 1:2
    const jb: Box = { x0: -196, x1: 12, y0: 26, y1: M.roof + 20 };
    const jv = d.view(396, 245, 0.5);
    jetGeometry(jv, jb, dTop, dSide);
    const x = SPEAR.x;
    const yTip = AX + Math.sqrt(R_TIP_MM ** 2 - x * x);
    const corner: Pt = [x + SPEAR.tipR, N];
    const dist = (q: Pt) => Math.hypot(q[0], q[1] - AX);
    const gapL = dist(corner) - R_TIP_MM;
    const k = gapL / dist(corner);
    jv.dim([x, AX], [0, AX], 0, { dir: 'h', size: 2 });
    jv.dim([0, SIDE.y], [0, AX], 0, { dir: 'v', size: 2 });
    jv.dim([x, N], [x, yTip], -4, { dir: 'v', size: 2 });
    jv.dim(corner, [corner[0] - corner[0] * k, corner[1] - (corner[1] - AX) * k], -3, {
      size: 2,
      label: tr(dec(gapL, 1)),
    });
    jv.dimRadius([0, AX], M.rPitch, 200, { label: `R${M.rPitch}`, size: 2 });
    jv.leader([x, AX], -12, 10, l('tangence', 'tangent point'), { color: COLORS.water });
    jv.leader([x + dTop / 2, N - 40], 14, 10, l('jet libre', 'free jet'), { color: COLORS.water });
    jv.leader(
      [R_TIP_MM * Math.cos(247 * deg), AX + R_TIP_MM * Math.sin(247 * deg)],
      -6,
      10,
      l(`Ø${2 * R_TIP_MM} augets`, `Ø${2 * R_TIP_MM} tips`),
    );
    const [dt, ds] = DEFLECTORS;
    const ang = (a: number) => tr(dec(a, Number.isInteger(a) ? 0 : 1)) + '°';
    const at = (dfl: typeof dt, r: number, a: number): Pt => [
      dfl.pivot[0] + r * Math.cos(a * deg),
      dfl.pivot[1] + r * Math.sin(a * deg),
    ];
    p.text(jv.map(at(dt, 34, -55)), ang(dt.rest), { size: 2, mono: true, color: COLORS.accent });
    p.text(jv.map(at(dt, 52, 9)), ang(dt.trip), { size: 2, mono: true, color: COLORS.accent });
    p.text(jv.map(at(ds, 52, ds.trip / 2)), ang(ds.trip), { size: 2, mono: true, color: COLORS.accent });
    p.text(jv.map(at(ds, 18, 38)), ang(ds.rest), { size: 2, mono: true, color: COLORS.accent });
    jv.leader(dt.pivot, -4, 8, l('pivot Ø10', 'Ø10 pivot'), { color: COLORS.accent });
    jv.leader([x - 45, N - dt.hit - 16.5], -2, -8, l('jet coupé → paroi', 'cut jet → wall'), { color: COLORS.water });
    jv.caption(
      [-92, 10],
      l('JETS ET DÉFLECTEURS', 'JETS AND DEFLECTORS'),
      tr(l('1:2 — vue partielle', '1:2 — partial view')),
    );

    // ---- jet notes (bottom centre)
    let ry = Math.max(ny + 2, 186);
    p.text([tx, ry], l('JETS — CALAGE', 'JETS — SETTING OUT'), { size: 2.3, weight: 'bold' });
    ry += 2.5;
    const nz = dist([x, N]);
    const free = N - yTip;
    const gapS = dist(corner) - tipR(spec('S'));
    const D = 2 * M.rPitch;
    const jn: Text[] = [
      l(
        `Les deux jets sont dans le plan médian de la roue et tangents au cercle primitif Ø${D} : jet haut à ${-x} à gauche de l’axe, jet latéral à ${AX - SIDE.y} sous l’axe.`,
        `Both jets lie in the runner mid-plane, tangent to the Ø${D} pitch circle: top jet ${-x} left of the axis, side jet ${AX - SIDE.y} below it.`,
      ),
      l(
        `Buses à ≈ ${Math.round(nz)} du centre de roue : jet libre ≈ ${Math.round(free)} avant le cercle des pointes Ø${2 * R_TIP_MM}, jeu buse / augets ≈ ${tr(dec(gapL, 1))} (jeu L) – ${Math.round(gapS)} (jeu S).`,
        `Nozzles ≈ ${Math.round(nz)} from the runner centre: free jet ≈ ${Math.round(free)} before the Ø${2 * R_TIP_MM} tip circle, nozzle / bucket clearance ≈ ${dec(gapL, 1).en} (L set) – ${Math.round(gapS)} (S set).`,
      ),
      l(
        `Déflecteurs : volets inox (${dt.len} et ${ds.len}) sur axes Ø10 traversant la cloison. Repos ${ang(dt.rest)} / ${ang(ds.rest)} (trait plein), déclenchés ${ang(dt.trip)} / ${ang(ds.trip)} (fantôme) en < 0,5 s : à l’arrière, levier sur chaque axe + biellette, ressort de traction entre un goujon du flasque et l’axe du levier bas, retenu par le noyau d’une gâche 12 V à manque de courant. Le jet coupé part contre la paroi, la conduite reste en débit : pas de coup de bélier.`,
        `Deflectors: stainless blades (${dt.len} and ${ds.len}) on Ø10 shafts through the partition. Rest ${ang(dt.rest)} / ${ang(ds.rest)} (solid), tripped ${ang(dt.trip)} / ${ang(ds.trip)} (phantom) in < 0.5 s: at the rear, a lever on each shaft + link rod, tension spring between a rear-panel stud and the lower lever pin, held by the plunger of a fail-safe 12 V latch. The cut jet goes to the wall and the penstock keeps flowing: no water hammer.`,
      ),
    ];
    jn.forEach((t, i) => {
      ry = note(d, tx, ry, 172, t, { bullet: `${i + 1}.` });
    });

    // ---- spear notes (bottom left)
    let sy = 234;
    const sn: Text[] = [
      l(
        `L’olive Ø23 vient en appui sur le cône de buse (fermé) ; une levée de ${SPEAR.stroke} mm (≈ 2,5 tours de volant) dégage tout l’orifice Ø${dTop}.`,
        `The Ø23 olive seats on the nozzle cone (closed); a ${SPEAR.stroke} mm lift (≈ 2.5 handwheel turns) clears the whole Ø${dTop} orifice.`,
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
