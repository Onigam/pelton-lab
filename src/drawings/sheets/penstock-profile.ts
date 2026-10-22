import { l } from '../../i18n';
import { G, RHO } from '../../sim/physics';
import { bedAt } from '../../three/site/layout';
import { COLORS, Drawing, INK, INK_2, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import { airValve, arrowLine, cat, flowArrow, hydro, levelMark, nf, notes, para } from './hyd-symbols';

// PL-H02 — longitudinal profile of the site A penstock (distorted scales), hydraulic grade
// lines at the two operating flows, pressures along the pipe, typical trench section,
// air-trap sketch, bore comparison and the maker's examples next to the model's values.

const LEN = 350;
const HEAD = 76;
const X0 = 62; // paper x of the intake (distance 0)
const Y0 = 172; // paper y of elevation 0 (turbine)
const SX = 1000 / 2000; // paper mm per metre, horizontal 1:2000
const SY = 1000 / 500; // vertical 1:500
const STATIONS = [0, 50, 100, 150, 200, 250, 300, 350];
const C8 = COLORS.copper;

/** Distance from the intake (m) -> paper x; elevation above the turbine (m) -> paper y. */
const X = (t: number) => X0 + t * SX;
const Y = (z: number) => Y0 - z * SY;
/** Ground elevation at distance t from the intake (the pipe follows the stream bank). */
const zAt = (t: number) => bedAt(LEN - t);
const bar = (m: number) => (RHO * G * m) / 1e5;

function profile(p: View): void {
  const { a6, a8 } = hydro();
  const ts = Array.from({ length: 176 }, (_, i) => i * 2);
  const ground: Pt[] = ts.map((t) => [X(t), Y(zAt(t))]);
  // earth band under the natural ground, buried pipe 0.8 m below it
  p.polyline([...ground, ...ground.map(([x, y]): Pt => [x, y + 5]).reverse()], { closed: true, w: 0, hatch: 'earth' });
  p.polyline(ground, { w: W.medium });
  p.polyline(
    ground.map(([x, y]): Pt => [x, y + 0.8 * SY]),
    { w: 0.7, color: INK },
  );
  // elevation axis
  p.line([X0 - 6, Y(0)], [X0 - 6, Y(80)], { w: W.thin });
  for (let z = 0; z <= 80; z += 10) {
    p.line([X0 - 7.5, Y(z)], [X0 - 6, Y(z)], { w: W.thin });
    p.text([X0 - 8.5, Y(z)], String(z), { size: 1.8, anchor: 'end', baseline: 'middle', mono: true });
  }
  p.text([X0 - 14, Y(40)], l('altitude / turbine (m)', 'elevation above turbine (m)'), {
    size: 1.8,
    rotate: 90,
    anchor: 'middle',
    color: INK_2,
  });
  // energy lines: static (all closed) and dynamic grade lines at the two nozzle sizes
  p.line([X(0), Y(HEAD)], [X(LEN), Y(HEAD)], { w: W.medium, color: INK_2, dash: 'center' });
  p.line([X(0), Y(HEAD)], [X(LEN), Y(HEAD - a6.pt.hf)], { w: W.medium, color: COLORS.water });
  p.line([X(0), Y(HEAD)], [X(LEN), Y(HEAD - a8.pt.hf)], { w: W.medium, color: C8, dash: [3, 1] });
  const endLbl = (z: number, t: Text, c: string, dy = 0) =>
    p.text([X(LEN) + 1.5, Y(z) + dy], t, { size: 1.8, baseline: 'middle', color: c, mono: true });
  endLbl(HEAD, nf(HEAD, 1), INK_2, -0.8);
  endLbl(HEAD - a6.pt.hf, nf(HEAD - a6.pt.hf, 1), COLORS.water, 0.6);
  endLbl(HEAD - a8.pt.hf, nf(HEAD - a8.pt.hf, 1), C8);
  // intake and turbine
  p.rect([X(0) - 5, Y(HEAD)], [X(0), Y(HEAD) + 4], { w: W.medium, fill: COLORS.waterFill });
  levelMark(p, [X(0) - 2.5, Y(HEAD)], '', { water: true });
  p.text(
    [X(0) + 2, Y(HEAD) - 2.2],
    l('Prise Coanda (PL-H03) — niveau de la retenue', 'Coanda intake (PL-H03) — pond level'),
    { size: 1.9 },
  );
  // turbine on its stand at the bottom end, the pipe rising into it
  const tx = X(LEN) + 4.5;
  p.polyline(
    [
      [X(LEN), Y(0) + 1.6],
      [X(LEN) + 0.8, Y(0) - 2.5],
      [tx - 3, Y(0) - 2.5],
    ],
    { w: 0.7 },
  );
  p.rect([tx - 3, Y(0) - 5.5], [tx + 3.5, Y(0) - 0.8], { w: W.medium, fill: COLORS.paper });
  p.line([tx - 2.5, Y(0) - 0.8], [tx - 2.5, Y(0)], { w: W.thin });
  p.line([tx + 3, Y(0) - 0.8], [tx + 3, Y(0)], { w: W.thin });
  p.text([tx, Y(0) + 4.5], l('Turbine ±0', 'Turbine ±0'), { size: 1.9, anchor: 'middle', weight: 'bold' });
  // pressure at a few stations = gap between the static line and the pipe
  for (const t of [100, 200, 300]) {
    const z = zAt(t);
    arrowLine(p, [X(t), Y(HEAD) + 0.4], [X(t), Y(z) - 0.4], COLORS.water, W.thin, true);
    p.text([X(t) - 1.2, (Y(HEAD) + Y(z)) / 2], cat(nf(bar(HEAD - z), 1), ' bar'), {
      size: 1.8,
      rotate: 90,
      anchor: 'middle',
      color: COLORS.water,
      halo: true,
    });
  }
  arrowLine(p, [X(LEN) - 5, Y(HEAD) + 0.4], [X(LEN) - 5, Y(0) - 0.4], COLORS.water, W.thin, true);
  p.line([X(LEN) - 7, Y(0)], [tx - 3, Y(0)], { w: W.thin, color: INK_2, dash: 'hidden' });
  p.text(
    [X(LEN) - 6.2, Y(40)],
    cat(
      l('statique ', 'static '),
      nf(a6.staticBar, 2),
      ' bar · ',
      l('service ', 'running '),
      nf(a6.runBar, 2),
      ' / ',
      nf(a8.runBar, 2),
      ' bar',
    ),
    { size: 1.8, rotate: 90, anchor: 'middle', color: COLORS.water, halo: true },
  );
  // slopes of the reaches, written in the ground along the pipe
  for (const [t0, t1] of [
    [0, 100],
    [100, 200],
    [200, 300],
    [300, 350],
  ]) {
    const a: Pt = [X(t0), Y(zAt(t0))];
    const b: Pt = [X(t1), Y(zAt(t1))];
    const ang = (Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI;
    const r = (ang * Math.PI) / 180;
    const m: Pt = [(a[0] + b[0]) / 2 + Math.sin(r) * 10, (a[1] + b[1]) / 2 + Math.cos(r) * 10];
    p.text(m, cat('i ≈ ', nf((100 * (zAt(t0) - zAt(t1))) / (t1 - t0), 0), ' %'), {
      size: 1.8,
      rotate: ang,
      anchor: 'middle',
      color: INK_2,
    });
  }
  flowArrow(p, [X(160), Y(zAt(160)) + 1.6], -35);
}

function guitar(d: Drawing, y: number): void {
  const { a6, a8 } = hydro();
  const p = d.paper();
  const rh = 6;
  const x0 = 14;
  const x1 = X(LEN) + 6;
  const hgl = (t: number, hf: number) => HEAD - (hf * t) / LEN;
  const rows: [Text, (t: number) => Text][] = [
    [l('Distance depuis la prise (m)', 'Distance from the intake (m)'), (t) => String(t)],
    [l('Altitude du terrain (m)', 'Ground elevation (m)'), (t) => nf(zAt(t), 1)],
    [l('Pression statique (bar)', 'Static pressure (bar)'), (t) => nf(bar(HEAD - zAt(t)), 2)],
    [
      cat(l('En service Ø6 — ', 'Running Ø6 — '), nf(a6.pt.q, 2), ' L/s (bar)'),
      (t) => nf(bar(hgl(t, a6.pt.hf) - zAt(t)), 2),
    ],
    [
      cat(l('En service Ø8 — ', 'Running Ø8 — '), nf(a8.pt.q, 2), ' L/s (bar)'),
      (t) => nf(bar(hgl(t, a8.pt.hf) - zAt(t)), 2),
    ],
  ];
  p.rect([x0, y], [x1, y + rh * rows.length], { w: W.medium });
  p.line([X0 - 4, y], [X0 - 4, y + rh * rows.length], { w: W.thin });
  rows.forEach(([label, f], i) => {
    const ry = y + rh * i;
    if (i) p.line([x0, ry], [x1, ry], { w: W.thin });
    p.text([x0 + 1.5, ry + rh / 2], label, { size: 1.85, baseline: 'middle', weight: i === 0 ? 'bold' : 'normal' });
    for (const t of STATIONS) {
      const anchor = t === 0 ? 'start' : t === LEN ? 'end' : 'middle';
      const tx = t === 0 ? X(t) + 0.8 : t === LEN ? X(t) - 0.8 : X(t);
      p.text([tx, ry + rh / 2], f(t), { size: 1.85, baseline: 'middle', anchor, mono: true });
    }
  });
  for (const t of STATIONS) p.line([X(t), y - 2], [X(t), y], { w: W.thin, color: INK_2 });
}

function trench(d: Drawing, cx: number, gy: number): void {
  const v = d.view(cx, gy, 1 / 20);
  const p = d.paper();
  const hw = 200;
  const top = -800; // pipe crown
  const r = 31.5;
  const bottom = top - 2 * r - 100;
  // ground both sides, trench backfill, sand bed + surround
  v.polyline(
    [
      [-480, 0],
      [-hw, 0],
      [-hw, bottom],
      [hw, bottom],
      [hw, 0],
      [480, 0],
      [480, bottom - 120],
      [-480, bottom - 120],
    ],
    { closed: true, w: 0, hatch: 'earth' },
  );
  v.rect([-hw, bottom], [hw, top + 100], { w: 0, fill: '#efe3c4' });
  v.rect([-hw, top + 100], [hw, -150], { w: 0, fill: '#f3ede0' });
  v.rect([-hw, -150], [hw, 0], { w: 0, fill: '#e2d6bd' });
  v.polyline(
    [
      [-480, 0],
      [-hw, 0],
      [-hw, bottom],
      [hw, bottom],
      [hw, 0],
      [480, 0],
    ],
    { w: W.medium },
  );
  v.line([-hw, top + 100], [hw, top + 100], { w: W.thin, dash: 'hidden', color: INK_2 });
  v.line([-hw + 20, top + 300], [hw - 20, top + 300], { w: 0.4, color: COLORS.acN, dash: [1.2, 0.6] });
  v.circle([0, top - r], r, { w: W.thick, fill: '#2b2f33' });
  v.circle([0, top - r], r - 3.8, { w: 0, fill: COLORS.paper });
  // dimensions
  v.dim([-hw, bottom], [hw, bottom], 4, { dir: 'h', size: 2 });
  v.dim([-hw, 0], [-hw, top], -4, { dir: 'v', size: 2 });
  v.dim([hw, top], [hw, top + 300], 3, { dir: 'v', size: 2 });
  const lab = (y: number, t: Text) => v.leader([hw - 40, y], 36 - (hw - 40) / 20 + 2, 0, t, { size: 1.75 });
  lab(-75, l('terre végétale', 'topsoil'));
  lab(top + 300, l('grillage avertisseur bleu', 'blue warning mesh'));
  lab(top + 190, l('remblai trié, sans pierres', 'sorted backfill, no stones'));
  lab(top + 50, l('enrobage sable 0/4 (+10 cm)', 'sand surround 0/4 (+10 cm)'));
  lab(bottom + 50, l('lit de pose sable 10 cm', 'sand bedding 10 cm'));
  v.leader([18, top - r + 14], 20, 9, l('PEHD Ø63 PN10', 'HDPE Ø63 PN10'), { size: 1.75 });
  p.text([cx, gy + 60], l('COUPE TYPE DE TRANCHÉE', 'TYPICAL TRENCH SECTION'), {
    size: 2.6,
    weight: 'bold',
    anchor: 'middle',
  });
  p.text([cx, gy + 63.6], '1:20', { size: 2, anchor: 'middle', mono: true, color: INK_2 });
}

/** Two small sketches of the same hump: the air pocket it traps, and the fix. */
function airTrap(p: View, x: number, y: number): void {
  p.text([x, y], l('POINTS HAUTS = PIÈGES À AIR', 'HIGH POINTS = AIR TRAPS'), { size: 2.3, weight: 'bold' });
  const sketch = (ox: number, good: boolean) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      pts.push([ox + u * 64, y + 12 + u * 16 - 8 * Math.exp(-(((u - 0.5) / 0.12) ** 2))]);
    }
    p.polyline(pts, { w: 0.9, color: INK });
    flowArrow(p, [ox + 5, y + 13.2], -14, COLORS.water, 0.8);
    // local high point of the hump
    const c = pts.slice(10, 22).reduce((m, q) => (q[1] < m[1] ? q : m));
    p.text([ox, y + 5.5], good ? l('SOLUTION', 'FIX') : l('À ÉVITER', 'AVOID'), {
      size: 2,
      weight: 'bold',
      color: good ? INK : COLORS.red,
    });
    if (good) {
      airValve(p, [c[0], c[1] - 0.5], { scale: 0.6 });
      p.text([c[0] + 3, c[1] - 5], l('ventouse au point haut', 'air valve at the top'), { size: 1.7 });
      p.text(
        [ox, y + 32],
        l('Pente continue (≥ 1 à 2 %) ; sinon ventouse', 'Continuous slope (≥ 1–2 %); otherwise an'),
        { size: 1.7 },
      );
      p.text(
        [ox, y + 34.8],
        l('au point haut et vidange au point bas.', 'air valve at the top, a drain at the bottom.'),
        { size: 1.7 },
      );
    } else {
      p.circle([c[0], c[1] + 0.3], 1.6, { w: W.thin, color: COLORS.red, fill: COLORS.paper });
      p.text([c[0] + 3, c[1] - 3], l('poche d’air', 'air pocket'), { size: 1.7, color: COLORS.red });
      p.text([ox, y + 32], l('La bulle étrangle le débit, le jet', 'The bubble chokes the flow, the jet'), {
        size: 1.7,
      });
      p.text([ox, y + 34.8], l('crache et la puissance chute.', 'sputters and the power drops.'), { size: 1.7 });
    }
  };
  sketch(x, false);
  sketch(x + 80, true);
}

function boreTable(d: Drawing, x: number, y: number): number {
  const { bores } = hydro();
  const ref = bores[0].pt.pElec;
  d.paper().text([x, y - 2], l('DIAMÈTRE — 1,8 L/s (Ø8), 350 m, H = 76 m', 'BORE — 1.8 L/s (Ø8), 350 m, H = 76 m'), {
    size: 2.3,
    weight: 'bold',
  });
  return d.table(
    x,
    y,
    [
      { label: l('Tube PE100 PN10', 'PE100 PN10 pipe'), w: 29 },
      { label: 'Ø int.', w: 13, align: 'end' },
      { label: 'v (m/s)', w: 16, align: 'end' },
      { label: 'hf (m)', w: 15, align: 'end' },
      { label: 'Hn (m)', w: 15, align: 'end' },
      { label: l('P élec. (W)', 'P elec. (W)'), w: 21, align: 'end' },
      { label: l('Gain (W)', 'Gain (W)'), w: 19, align: 'end' },
      { label: l('Pertes', 'Losses'), w: 22, align: 'end' },
    ],
    bores.map((b, i) => [
      i === 0 ? cat('Ø', String(b.od), l(' (actuel)', ' (current)')) : `Ø${b.od}`,
      String(b.bore),
      nf(b.v, 2),
      nf(b.pt.hf, 1),
      nf(b.pt.hn, 1),
      nf(b.pt.pElec, 0),
      i === 0 ? '—' : cat('+', nf(b.pt.pElec - ref, 0)),
      i === 0 ? l('référence', 'reference') : cat('÷ ', nf(bores[0].pt.hf / b.pt.hf, 1)),
    ]),
    4.6,
  );
}

function makerTable(d: Drawing, x: number, y: number): number {
  const { maker } = hydro();
  const p = d.paper();
  p.text(
    [x, y - 2],
    l('DONNÉES CONSTRUCTEUR HYDRONOME (site officiel) ↔ MODÈLE', 'HYDRONOME MAKER DATA (official site) ↔ MODEL'),
    { size: 2.3, weight: 'bold' },
  );
  const h = d.table(
    x,
    y,
    [
      { label: 'H (m)', w: 13, align: 'end' },
      { label: l('Conduite', 'Penstock'), w: 25, align: 'end' },
      { label: 'Q (L/s)', w: 15, align: 'end' },
      { label: l('Constr. (W)', 'Maker (W)'), w: 21, align: 'end' },
      { label: l('Constr. Wh/j', 'Maker Wh/d'), w: 24, align: 'end' },
      { label: l('Modèle (W)', 'Model (W)'), w: 20, align: 'end' },
      { label: l('hf modèle', 'Model hf'), w: 34, align: 'end' },
    ],
    maker.map((m) => [
      String(m.h),
      `Ø${m.bore} × ${m.len} m`,
      String(m.q),
      nf(m.wMaker, 0),
      nf(m.whDay, 0),
      nf(m.pt.pElec, 0),
      cat(nf(m.pt.hf, 1), ' m (', nf((100 * m.pt.hf) / m.h, 1), ' %)'),
    ]),
    4.6,
  );
  para(
    p,
    x,
    y + h + 3.4,
    150,
    l(
      'Modèle : sortie génératrice, roue adaptée au jet. Il reste prudent (η ≈ 50–65 % du brut) ; les valeurs constructeur supposent η ≈ 85–89 % de ρ·g·Q·H. Même conclusion : « il est très important de limiter les pertes de charge », demander conseil au constructeur pour le diamètre.',
      'Model: generator output, runner matched to the jet. It stays cautious (η ≈ 50–65 % of gross); the maker figures imply η ≈ 85–89 % of ρ·g·Q·H. Same conclusion: “it is very important to limit head losses”, ask the maker for advice on the pipe size.',
    ),
    1.7,
    INK_2,
  );
  return h;
}

function legendLines(p: View, x: number, y: number): void {
  const { a6, a8 } = hydro();
  const item = (dy: number, s: { color: string; dash?: 'center' | number[] }, t: Text) => {
    p.line([x, y + dy], [x + 10, y + dy], { w: W.medium, ...s });
    p.text([x + 12, y + dy], t, { size: 1.8, baseline: 'middle' });
  };
  item(
    0,
    { color: INK_2, dash: 'center' },
    l('Ligne de charge statique = niveau de la prise (tout fermé)', 'Static energy line = intake level (all closed)'),
  );
  item(
    4,
    { color: COLORS.water },
    cat(
      l('Ligne piézométrique Ø6 : ', 'Hydraulic grade line Ø6: '),
      nf(a6.pt.q, 2),
      ' L/s, hf = ',
      nf(a6.pt.hf, 2),
      ' m',
    ),
  );
  item(
    8,
    { color: C8, dash: [3, 1] },
    cat(
      l('Ligne piézométrique Ø8 : ', 'Hydraulic grade line Ø8: '),
      nf(a8.pt.q, 2),
      ' L/s, hf = ',
      nf(a8.pt.hf, 2),
      ' m',
    ),
  );
  p.line([x, y + 12], [x + 10, y + 12], { w: 0.7, color: INK });
  p.text(
    [x + 12, y + 12],
    l('Conduite PEHD Ø63 PN10 (Øi 55), enterrée à 0,8 m', 'HDPE Ø63 PN10 penstock (ID 55), buried 0.8 m'),
    { size: 1.8, baseline: 'middle' },
  );
  p.text(
    [x, y + 17],
    l(
      'Pression en un point = écart vertical entre la ligne de charge et la conduite (10 m ≈ 0,98 bar).',
      'Pressure at a point = vertical gap between the energy line and the pipe (10 m ≈ 0.98 bar).',
    ),
    { size: 1.75, color: INK_2 },
  );
}

export const penstockProfile: DrawingSheet = {
  id: 'penstock-profile',
  number: 'PL-H02',
  group: 'hydraulic',
  title: l('Profil en long de la conduite', 'Penstock long profile'),
  description: l(
    'Profil en long de la conduite forcée du site A : 350 m de PEHD Ø63 pour 76 m de dénivelé, avec des échelles déformées (1:2000 en longueur, 1:500 en hauteur). L’écart vertical entre la ligne de charge et la conduite donne la pression en chaque point ; les lignes piézométriques montrent ce que coûtent les frottements avec la buse Ø6 (1,7 m) et la buse Ø8 (4,5 m). À droite : la tranchée type, le piège à air des points hauts, l’effet du diamètre et les exemples du constructeur comparés au modèle.',
    'Long profile of the site A penstock: 350 m of Ø63 HDPE for a 76 m drop, at distorted scales (1:2000 along, 1:500 up). The vertical gap between the energy line and the pipe gives the pressure at each point; the grade lines show what friction costs with the Ø6 nozzle (1.7 m) and the Ø8 nozzle (4.5 m). On the right: the typical trench, the air trap at high points, the effect of the bore and the maker’s examples compared with the model.',
  ),
  scene: 'site',
  parts: ['penstock', 'coanda', 'turbine'],
  render(): Drawing {
    const d = new Drawing();
    d.frame({
      title: l('Profil en long de la conduite', 'Penstock long profile'),
      subtitle: l(
        'Site A — PEHD Ø63 PN10, 350 m, 76 m de chute — lignes de charge et pressions',
        'Site A — HDPE Ø63 PN10, 350 m, 76 m head — energy lines and pressures',
      ),
      number: 'PL-H02',
      scale: '1:2000 / 1:500',
    });
    const p = d.paper();
    profile(p);
    p.text([70, 112], l('PROFIL EN LONG — CONDUITE FORCÉE DU SITE A', 'LONG PROFILE — SITE A PENSTOCK'), {
      size: 3,
      weight: 'bold',
    });
    p.text(
      [70, 116.5],
      l(
        'Éch. horizontale 1:2000 · éch. verticale 1:500 (hauteurs × 4)',
        'Horizontal scale 1:2000 · vertical scale 1:500 (heights × 4)',
      ),
      { size: 2, mono: true, color: INK_2 },
    );
    legendLines(p, 70, 124);
    const slopes = [0, 100, 200, 300].map(
      (t) => (100 * (zAt(t) - zAt(Math.min(LEN, t + 100)))) / (Math.min(LEN, t + 100) - t),
    );
    const [iMin, iMax] = [nf(Math.min(...slopes), 0), nf(Math.max(...slopes), 0)];
    para(
      p,
      70,
      150,
      80,
      cat(
        l(
          'Tracé sans point haut sur le site A : la pente reste comprise entre ',
          'No high point on the site A route: the slope stays between ',
        ),
        iMin,
        l(' et ', ' and '),
        iMax,
        l(
          ' %, toujours descendante (pas de ventouse intermédiaire).',
          ' %, always downhill (no intermediate air valve).',
        ),
      ),
      1.8,
      INK_2,
    );
    guitar(d, 182);
    const { a6, a8, bores } = hydro();
    const thrust = (a6.staticBar * 1e5 * Math.PI * 0.055 ** 2) / 4;
    notes(
      p,
      14,
      220,
      214,
      l('NOTES', 'NOTES'),
      [
        cat(
          l('PN10 (10 bar à 20 °C) pour ', 'PN10 (10 bar at 20 °C) for '),
          nf(a6.staticBar, 2),
          l(
            ' bar statiques au pied : marge 2,5 bar. Fermer plus vite que 2L/a = 2 s ajoute +',
            ' bar static at the bottom: 2.5 bar margin. Closing faster than 2L/a = 2 s adds +',
          ),
          nf(a8.surgeBar, 1),
          l(' bar (Ø8), soit ', ' bar (Ø8), i.e. '),
          nf(a8.staticBar + a8.surgeBar, 1),
          l(
            ' bar > PN10 : manœuvres en 20 s minimum. Épreuve avant mise en service : 1,5 × pression maxi de service ≈ 11 bar, 1 h.',
            ' bar > PN10: operate over 20 s minimum. Test before commissioning: 1.5 × max. operating pressure ≈ 11 bar, 1 h.',
          ),
        ),
        l(
          'Tracé : pente continue, sans contre-pente. Tout point haut inévitable reçoit une ventouse, tout point bas une vidange. Ici le point bas est la turbine : vidange par la dérivation V-02 (PL-H01).',
          'Route: continuous slope, no reverse gradient. Any unavoidable high point gets an air valve, any low point a drain. Here the low point is the turbine: drain through the V-02 bypass (PL-H01).',
        ),
        l(
          'Pose enterrée conseillée (coupe ci-contre) : hors gel, à l’abri des UV et des chutes de pierres. Site A (vidéo) : tube posé au sol en forêt, gaine PVC grise sur les derniers mètres avant la turbine.',
          'Buried laying recommended (section opposite): frost-free, out of UV and falling stones. Site A (video): pipe laid on the forest floor, grey PVC sleeve over the last metres before the turbine.',
        ),
        cat(
          l(
            'Ancrages : poussée sur la vanne fermée ou un coude p·A ≈ ',
            'Anchoring: thrust on the closed valve or a bend p·A ≈ ',
          ),
          nf(thrust / 1000, 1),
          l(
            ' kN : massif ou piquets d’ancrage avant la turbine, la nourrice ne doit rien reprendre. Le PEHD se dilate de 0,2 mm/m/°C, ≈ 1,4 m sur 350 m pour 20 °C : en surface, pose en légères ondulations, colliers tous les 5 à 10 m dans les pentes.',
            ' kN: anchor block or stakes before the turbine, the manifold must carry nothing. HDPE expands 0.2 mm/m/°C, ≈ 1.4 m over 350 m for 20 °C: on the surface, lay it in gentle snakes, clamp every 5–10 m on slopes.',
          ),
        ),
        cat(
          l('Buse Ø6 → Ø8 : le débit passe de ', 'Nozzle Ø6 → Ø8: the flow rises from '),
          nf(a6.pt.q, 2),
          l(' à ', ' to '),
          nf(a8.pt.q, 2),
          l(' L/s mais les pertes de ', ' L/s but the losses from '),
          nf(a6.pt.hf, 1),
          l(' à ', ' to '),
          nf(a8.pt.hf, 1),
          l(' m (≈ Q²) ; en Ø75 elles retomberaient à ', ' m (≈ Q²); with Ø75 they would drop back to '),
          nf(bores[1].pt.hf, 1),
          l(
            ' m (tableau ci-contre). Conseil constructeur : limiter au maximum les pertes de charge.',
            ' m (table opposite). Maker advice: keep head losses as low as possible.',
          ),
        ),
      ],
      2,
    );
    trench(d, 280, 30);
    airTrap(p, 256, 106);
    boreTable(d, 256, 160);
    makerTable(d, 256, 198);
    return d;
  },
};
