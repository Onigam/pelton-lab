import { l, tr, type L } from '../../i18n';
import { COLORS, Drawing, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import { hydro, nf } from './hyd-symbols';
import { M, matchedJet, note, rot, RUNNER, silhouette, spec, tipR, type Spec } from './turbine-geom';

// PL-T03 — Pelton runner (front view + section at 1:2) and one bucket at 1:1.
// Every value comes from the 3D model (dims.ts, bucket.ts, runner.ts through turbine-geom.ts), mm.

const R_PITCH = M.rPitch;
const HUB_R = M.hubR;
const HUB_T = M.hubT;
const N = M.buckets;
const BOLT_R = M.boltR;
const RING = RUNNER.ring;
const FLANGE_R = RUNNER.flangeR;
const [CHEEK0, CHEEK1] = RUNNER.cheek;
const { holes: HOLES, pockets: POCKETS } = RUNNER;

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

const dec = (v: number, n = 1): L => l(v.toFixed(n).replace('.', ','), v.toFixed(n));
const deg = Math.PI / 180;
const both = (v: View, pts: Pt[], st: Parameters<View['polyline']>[1]) => {
  v.polyline(pts, { closed: true, ...st });
  v.polyline(
    pts.map(([x, y]) => [x, -y] as Pt),
    { closed: true, ...st },
  );
};
const box = (x0: number, x1: number, y0: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

/** Front view of the whole runner (seen from the window side, +Z). */
function frontView(v: View, s: Spec): void {
  const stemTop = s.rc - 0.35 * s.a;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const stem = box(RING[1] - 1, stemTop, 0.045 * s.depth, 1.195 * s.depth);
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
  // hub disc between flange and clamp ring: lightening pockets (runner.ts hubDisc)
  v.circle([0, 0], POCKETS.at, { w: W.thin, dash: 'center', color: COLORS.muted });
  for (let i = 0; i < POCKETS.n; i++) {
    const a = ((i * 360) / POCKETS.n) * deg;
    v.circle([Math.cos(a) * POCKETS.at, Math.sin(a) * POCKETS.at], POCKETS.r, { w: W.medium, fill: COLORS.paper });
  }
  // steel flange + taper bush + washer + M16 nut
  v.circle([0, 0], FLANGE_R, { w: W.thick, fill: COLORS.paper });
  v.circle([0, 0], HOLES.at, { w: W.thin, dash: 'center', color: COLORS.muted });
  for (let i = 0; i < HOLES.n; i++) {
    const a = (45 + (i * 360) / HOLES.n) * deg;
    v.circle([Math.cos(a) * HOLES.at, Math.sin(a) * HOLES.at], HOLES.r, { w: W.thin, dash: 'hidden' });
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
  const stemTop = s.rc - 0.35 * s.a;
  const hz = HUB_T / 2;
  const [z0, z1] = RUNNER.ringZ;
  // bucket rotated into the plane (not hatched, by convention): cup outline + forked stem
  const cup: Pt[] = [];
  for (let i = 0; i <= 32; i++) {
    const e = -0.985 + (1.97 * i) / 32;
    cup.push([s.b * Math.sqrt(1 - e * e), s.rc + e * s.a]);
  }
  for (let i = 32; i >= 0; i--) cup.push([-cup[i][0], cup[i][1]]);
  both(v, box(-hz - 4, hz + 4, HUB_R, stemTop), { w: W.medium, fill: COLORS.paper });
  both(v, cup, { w: W.thick, fill: COLORS.paper });
  both(v, box(-hz - 4, -hz, CHEEK0, CHEEK1), { w: W.medium, fill: COLORS.paper });
  both(v, box(hz, hz + 4, CHEEK0, RING[0]), { w: W.medium, fill: COLORS.paper });
  // sectioned parts: hub disc, clamp ring, flange, taper bush, washer
  const sec = (h: 'plastic' | 'steel', w = W.thick) => ({ w, hatch: h, fill: COLORS.paper });
  both(v, box(-hz, hz, RUNNER.bore, HUB_R), sec('plastic'));
  both(v, box(z0, z1, RING[0], RING[1]), sec('plastic'));
  both(
    v,
    [
      [-hz, 11],
      [-hz, RUNNER.bore],
      [hz, RUNNER.bore],
      [hz, FLANGE_R],
      [hz + 20, FLANGE_R],
      [hz + 20, 16],
      [hz + 4, 19],
      [hz + 4, 11],
    ],
    sec('steel'),
  );
  both(
    v,
    [
      [hz + 4, 10],
      [hz + 4, 19],
      [hz + 20, 16],
      [hz + 20, 10],
    ],
    sec('steel'),
  );
  both(v, box(hz + 20, hz + 22, 10, 17), sec('steel', W.medium));
  // M4 bolts (not sectioned): head, shank, nut
  both(v, box(z1, z1 + 3, BOLT_R - 3.5, BOLT_R + 3.5), { w: W.medium, fill: COLORS.paper });
  both(v, box(-hz - 6, z1, BOLT_R - 2, BOLT_R + 2), { w: W.thin, fill: COLORS.paper });
  both(v, box(-hz - 8.5, -hz - 5.5, BOLT_R - 3.5, BOLT_R + 3.5), { w: W.medium, fill: COLORS.paper });
  // shaft (not sectioned) with key, M16 nut
  const t0 = hz + 22;
  v.rect([-21, -10], [t0, 10], { w: W.thick, fill: COLORS.paper });
  v.rect([t0, -8], [M.shaftFront - M.wheelZ, 8], { w: W.thick, fill: COLORS.paper });
  v.rect([t0, -14.5], [t0 + 10, 14.5], { w: W.thick, fill: COLORS.paper });
  for (const r of [7.2, -7.2]) v.line([t0, r], [t0 + 10, r], { w: W.thin });
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
  v.center([-24, 0], [M.shaftFront - M.wheelZ + 4, 0]);
  v.center([0, -tipR(s) - 4], [0, tipR(s) + 4]);
}

/** Bucket seen along the jet (axial × radial), 1:1, origin at the cup centre (r = rc). */
function bucketFront(v: View, s: Spec, dj: number): void {
  const ns = s.rc + 0.45 * s.a;
  const hz = HUB_T / 2;
  const r = (x: number) => x - s.rc;
  // fork + hub disc + clamp ring (phantom) + M4 bolt (hidden)
  v.rect([-hz, r(CHEEK0)], [hz, r(HUB_R)], { w: W.thin, dash: 'phantom', color: COLORS.muted });
  v.rect([RUNNER.ringZ[0], r(RING[0])], [RUNNER.ringZ[1], r(RING[1])], {
    w: W.thin,
    dash: 'phantom',
    color: COLORS.muted,
  });
  v.polyline(
    [
      [-hz - 4, r(CHEEK0)],
      [-hz - 4, r(s.rc - 0.35 * s.a)],
      [hz + 4, r(s.rc - 0.35 * s.a)],
      [hz + 4, r(CHEEK0)],
      [hz, r(CHEEK0)],
      [hz, r(HUB_R)],
      [-hz, r(HUB_R)],
      [-hz, r(CHEEK0)],
    ],
    { closed: true, w: W.thick, fill: COLORS.paper },
  );
  v.rect([-hz - 6, r(BOLT_R - 2)], [RUNNER.ringZ[1] + 3, r(BOLT_R + 2)], { w: W.thin, dash: 'hidden' });
  v.center([-hz - 10, r(BOLT_R)], [RUNNER.ringZ[1] + 7, r(BOLT_R)]);
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
  const mirror = (pts: Pt[]) => pts.map(([x, y]) => [-x, y] as Pt);
  const outline: Pt[] = [...right, ...notch, ...mirror(notch.slice().reverse()), ...mirror(right.slice().reverse())];
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
  // jet footprint (matched jet of the set)
  v.circle([0, 0], dj / 2, { w: W.thin, color: COLORS.water, dash: 'hidden' });
  v.center([-s.b - 4, 0], [s.b + 4, 0]);
  v.center([0, r(CHEEK0) - 3], [0, tipR(s) - s.rc + 4]);
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
  v.rect([-d / 2, 1.2], [d / 2, 26], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  const arrow = (a: Pt, b: Pt) =>
    v.line(a, b, { w: W.medium, color: COLORS.water }).setAttribute('marker-end', 'url(#arrow)');
  arrow([0, 30], [0, 16]);
  // flow along both cups and out at 15° from the jet axis (≈ 165° deflection)
  for (const sg of [-1, 1]) {
    const path: Pt[] = [];
    for (let i = 1; i <= 20; i++) {
      const z = (s.b * i) / 20;
      path.push([sg * z * 0.94, -s.depth * Math.pow(Math.sin((Math.PI * z) / s.b), 0.85) + 1.6]);
    }
    v.polyline(path, { w: W.thin, color: COLORS.water });
    const start: Pt = [sg * (s.b + 0.5), 2];
    const end: Pt = [start[0] + sg * Math.sin(15 * deg) * 20, start[1] + Math.cos(15 * deg) * 20];
    arrow(start, end);
    v.line(start, [start[0], start[1] + 18], { w: W.thin, dash: 'center', color: COLORS.muted });
    v.arc(start, 13, 90, sg > 0 ? 75 : 105, { w: W.thin });
  }
  v.center([0, -20], [0, 32]);
}

export const runner: DrawingSheet = {
  id: 'runner',
  number: 'PL-T03',
  group: 'turbine',
  title: l('Roue Pelton et augets', 'Pelton runner and buckets'),
  description: l(
    `La roue vue de face et en coupe (1:2) : ${N} augets serrés entre le moyeu et la bague par ${N} vis M4, montés sur l’arbre par une bride acier et une douille conique. Le détail 1:1 montre un auget du jeu L (jet Ø${matchedJet('L')}) : arête médiane, échancrure, profondeur de coquille et renvoi de l’eau à ≈ 165°. Le tableau compare les proportions classiques (en multiples du diamètre de jet d) aux cotes réelles des jeux S et L du modèle.`,
    `The runner in front view and section (1:2): ${N} buckets clamped between the hub disc and the ring by ${N} M4 bolts, mounted on the shaft through a steel flange and a taper bush. The 1:1 detail shows one bucket of the L set (Ø${matchedJet('L')} jet): splitter ridge, notch, cup depth and the ≈ 165° turn of the water. The table compares the classic proportions (multiples of the jet diameter d) with the actual S and L bucket sets of the model.`,
  ),
  scene: 'turbine',
  parts: ['wheel-hub', 'buckets', 'wheel-ring', 'wheel-lock'],
  render(ctx) {
    const d = new Drawing();
    const LS = spec('L');
    const SS = spec('S');
    const dL = matchedJet('L');
    const dS = matchedJet('S');
    const tipL = tipR(LS);
    d.frame({
      title: l(`Roue Pelton — ${N} augets`, `Pelton runner — ${N} buckets`),
      subtitle: l(
        `Roue commune V1 / V2 (planche ${ctx.version.toUpperCase()}) — augets jeu L, buse Ø${dL}`,
        `Same runner on V1 / V2 (${ctx.version.toUpperCase()} sheet) — L bucket set, Ø${dL} nozzle`,
      ),
      number: 'PL-T03',
      scale: '1:2 · 1:1',
    });
    const p = d.paper();

    // ---- front view 1:2
    const fv = d.view(106, 116, 0.5);
    frontView(fv, LS);
    fv.sectionMark([0, tipL + 12], [0, -tipL - 12], 'B', -1);
    fv.dimDiameter([0, 0], tipL, 52, { label: `Ø${2 * tipL}` });
    fv.dimDiameter([0, 0], R_PITCH, 18, { label: l(`Ø${2 * R_PITCH} primitif`, `Ø${2 * R_PITCH} pitch`) });
    fv.leader(rot([BOLT_R, 0], 290 * deg), 34, 44, `${N} × M4 A4 / Ø${2 * BOLT_R}`);
    fv.leader(rot([POCKETS.at, 0], 240 * deg), -38, 54, `${POCKETS.n} × Ø${2 * POCKETS.r} / Ø${2 * POCKETS.at}`);
    fv.leader(
      rot([HOLES.at, 0], 135 * deg),
      -40,
      -75,
      l(
        `${HOLES.n} × Ø${2 * HOLES.r} / Ø${2 * HOLES.at} (cachés)`,
        `${HOLES.n} × Ø${2 * HOLES.r} / Ø${2 * HOLES.at} (hidden)`,
      ),
    );
    // bucket pitch 360/N and direction of rotation
    for (const k of [4, 5])
      fv.line(rot([tipL - 4, 0], (k / N) * Math.PI * 2), rot([tipL + 10, 0], (k / N) * Math.PI * 2), {
        w: W.thin,
        color: COLORS.muted,
      });
    fv.arc([0, 0], tipL + 7, (4 / N) * 360, (5 / N) * 360, { w: W.thin });
    p.text(fv.map(rot([tipL + 11, 0], (4.5 * (Math.PI * 2)) / N)), tr(dec(360 / N, 2)) + '°', {
      size: 2.3,
      mono: true,
      anchor: 'middle',
      halo: true,
    });
    const rotArc = fv.arc([0, 0], tipL + 7, 140, 165, { w: W.medium, color: COLORS.water });
    rotArc.setAttribute('marker-end', 'url(#arrow)');
    p.text(fv.map(rot([tipL + 16, 0], 152 * deg)), l('sens de rotation', 'rotation'), {
      size: 2,
      anchor: 'end',
      color: COLORS.water,
      halo: true,
    });
    // balloons
    fv.leader(rot([POCKETS.at + 4, 0], 115 * deg), -16, -52, '1', { balloon: true });
    fv.leader(rot([tipL - 10, 3], 40 * deg), 24, -40, '2', { balloon: true });
    fv.leader(rot([(RING[0] + RING[1]) / 2, 0], 196 * deg), -44, 12, '3', { balloon: true });
    fv.leader(rot([BOLT_R, 0], 104 * deg), -8, -66, '4', { balloon: true });
    fv.caption([0, -tipL - 26], l('VUE DE FACE (côté hublot)', 'FRONT VIEW (window side)'), '1:2');

    // ---- section B–B 1:2
    const sb = d.view(206, 116, 0.5);
    sectionB(sb, LS);
    sb.dim([-LS.b, LS.rc], [LS.b, LS.rc], -(tipL - LS.rc) / 2 - 6, { dir: 'h', size: 2.2 });
    sb.leader([20, 26], 20, -26, '5', { balloon: true });
    sb.leader([18, 12], 20, -12, '6', { balloon: true });
    sb.leader([34, -9], -2, 30, '7', { balloon: true });
    sb.caption([0, -tipL - 26], l('COUPE B–B', 'SECTION B–B'), '1:2');

    // ---- bucket detail 1:1 (L set), seen along the jet
    const bf = d.view(268, 50, 1);
    bucketFront(bf, LS, dL);
    const tipOff = tipL - LS.rc;
    bf.dim([-LS.b, 0], [LS.b, 0], -tipOff - 8, { dir: 'h', label: `B = ${2 * LS.b}` });
    bf.dim([0, -0.985 * LS.a], [0, 0.985 * LS.a], LS.b + 12, { dir: 'v', label: `L = ${2 * LS.a}` });
    bf.dim([0, 0.45 * LS.a], [0, 0.985 * LS.a], -(LS.b + 6), { dir: 'v', size: 2.2 });
    bf.dim([-HUB_T / 2 - 4, CHEEK0 - LS.rc], [HUB_T / 2 + 4, CHEEK0 - LS.rc], 5, { dir: 'h', size: 2.2 });
    bf.leader(
      [notchHalf(LS, 0.8), 0.8 * LS.a],
      16,
      -6,
      l(`échancrure ≈ ${tr(dec(maxNotch(LS)))}`, `notch ≈ ${dec(maxNotch(LS)).en}`),
    );
    bf.leader([0, -16], 26, 6, l('arête médiane', 'splitter ridge'));
    bf.leader([3, -3], 28, 28, l(`jet Ø${dL}`, `Ø${dL} jet`), { color: COLORS.water });
    bf.leader(
      [HUB_T / 2 + 4, BOLT_R - LS.rc - 6],
      22,
      8,
      l(`fourche sur moyeu ép. ${HUB_T}`, `fork on ${HUB_T} mm hub disc`),
    );
    bf.leader([0, 0], -20, 14, `R${LS.rc} = R${R_PITCH} + ${LS.rc - R_PITCH}`);
    p.text(bf.map([0, CHEEK0 - LS.rc - 12]), l('DÉTAIL C — AUGET (jeu L)', 'DETAIL C — BUCKET (L set)'), {
      size: 3,
      weight: 'bold',
      anchor: 'middle',
    });
    p.text(bf.map([0, CHEEK0 - LS.rc - 16]), l('vu suivant le jet — 1:1', 'seen along the jet — 1:1'), {
      size: 2.2,
      anchor: 'middle',
      color: COLORS.muted,
    });

    // ---- bucket section D–D 1:1
    const back = LS.t + 1.25 * LS.depth;
    const bs = d.view(372, 70, 1);
    bucketSection(bs, LS, dL);
    bs.dim([-LS.b, 0], [LS.b, 0], back + 4, { dir: 'h', label: `B = ${2 * LS.b}` });
    bs.dim([LS.b / 2, 0], [LS.b / 2, -LS.depth], LS.b / 2 + 7, { dir: 'v', label: `T = ${LS.depth}` });
    bs.dim([0, 0], [0, -back], -(LS.b + 5), { dir: 'v', size: 2.2, label: tr(dec(back)) });
    bs.dim([-dL / 2, 26], [dL / 2, 26], -3, { dir: 'h', label: `d = ${dL}`, size: 2.2, color: COLORS.water });
    p.text(bs.map([LS.b + 3, 16]), '15°', { size: 2.2, mono: true });
    p.text(bs.map([-LS.b - 3, 16]), '15°', { size: 2.2, mono: true, anchor: 'end' });
    p.text(bs.map([0, 36]), l('déviation ≈ 165°', 'deflection ≈ 165°'), {
      size: 2.2,
      color: COLORS.water,
      anchor: 'middle',
    });
    bs.leader([-LS.b + 0.6, -1.4], -10, 15, l(`rive ép. ${tr(dec(LS.t))}`, `rim ${dec(LS.t).en} thick`));
    bs.caption([0, -28], l(`COUPE D–D (au rayon R${LS.rc})`, `SECTION D–D (at R${LS.rc})`), '1:1');
    bf.sectionMark([-LS.b - 4, 0], [LS.b + 4, 0], 'D', 1);

    // ---- design table: classic ratios vs the model's S and L sets
    const ty = 150;
    const D = 2 * R_PITCH;
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
      return [label, rule, cell(SS, dS), cell(LS, dL)];
    };
    d.table(
      236,
      ty,
      [
        { label: l('Grandeur', 'Quantity'), w: 46 },
        { label: l('Règle', 'Rule'), w: 24 },
        { label: l(`Jeu S (d = ${dS})`, `S set (d = ${dS})`), w: 49 },
        { label: l(`Jeu L (d = ${dL})`, `L set (d = ${dL})`), w: 49 },
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
        row(l('Ø extérieur roue', 'Runner tip Ø'), '—', (s) => `Ø${tr(dec(2 * tipR(s), 0))}`),
        row(
          l('z nombre d’augets', 'z bucket count'),
          '15 + D/2d',
          (_s, dj) => `${Math.round(15 + D / (2 * dj))} → ${N}`,
        ),
        row(l('D/d (≥ 10)', 'D/d (≥ 10)'), `D = ${D}`, (_s, dj) => tr(dec(D / dj))),
      ],
      5,
    );
    let ny = ty + 8 * 5 + 5;
    const kS = (2 * SS.b) / (3.2 * dS);
    const { a6, b } = hydro();
    const paras: [Text, string?][] = [
      [
        l(
          `Jeu L proche de la règle pour d = ${dL} : z calculé ≈ ${Math.round(15 + D / (2 * dL))} → ${N} augets. Le jeu S (prototype, d = ${dS}) est ≈ ${tr(dec(kS))} fois plus large que la règle : parois imprimées épaisses, tolérance au désalignement du jet.`,
          `The L set is close to the rule for d = ${dL}: computed z ≈ ${Math.round(15 + D / (2 * dL))} → ${N} buckets. The S set (prototype, d = ${dS}) is ≈ ${dec(kS).en} times wider than the rule: thick printed walls, tolerance to jet misalignment.`,
        ),
      ],
      [
        l(
          `Vitesse optimale (simulateur) : u/v ≈ 0,47 avec u = π·D·n/60 → n ≈ ${tr(nf(a6.pt.rpm, 0))} tr/min sur le site A (v ≈ ${tr(nf(a6.pt.vJet))} m/s), ≈ ${tr(nf(b.pt.rpm, 0))} tr/min sur le site B (v ≈ ${tr(nf(b.pt.vJet))} m/s).`,
          `Best speed (simulator): u/v ≈ 0.47 with u = π·D·n/60 → n ≈ ${nf(a6.pt.rpm, 0).en} rpm on site A (v ≈ ${nf(a6.pt.vJet).en} m/s), ≈ ${nf(b.pt.rpm, 0).en} rpm on site B (v ≈ ${nf(b.pt.vJet).en} m/s).`,
        ),
      ],
      [
        l(
          `Données constructeur Hydronome (site officiel) : 26 augets en polymère renforcé injecté, roue Ø244 ext., buse Ø14 maxi — reprises par le modèle (${N} augets, Ø${2 * tipL}, Ø${M.maxNozzle}).`,
          `Hydronome maker data (official site): 26 injection-moulded reinforced-polymer buckets, Ø244 runner OD, Ø14 max nozzle — used by the model (${N} buckets, Ø${2 * tipL}, Ø${M.maxNozzle}).`,
        ),
        COLORS.v2,
      ],
      [
        l(
          `Calage : axe du jet dans le plan médian de la roue (± 1 mm) et tangent au cercle primitif Ø${D} ; le jet doit frapper l’arête médiane, sinon une coquille travaille plus que l’autre.`,
          `Alignment: jet axis in the runner mid-plane (± 1 mm) and tangent to the Ø${D} pitch circle; the jet must hit the splitter ridge, otherwise one half-cup works harder than the other.`,
        ),
      ],
    ];
    for (const [t, color] of paras) ny = note(d, 236, ny, 168, t, { size: 2, lh: 1.75, color });

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
        [
          '1',
          l(
            `Moyeu Ø${2 * HUB_R} × ${HUB_T}, alésage Ø${2 * RUNNER.bore}`,
            `Hub disc Ø${2 * HUB_R} × ${HUB_T}, Ø${2 * RUNNER.bore} bore`,
          ),
          'PETG 100 %',
          '1',
        ],
        ['2', l('Auget à pied fourchu (jeu S ou L)', 'Bucket with forked root (S or L set)'), 'PETG / ASA', `${N}`],
        [
          '3',
          l(
            `Bague de serrage Ø${2 * RING[1]} / Ø${2 * RING[0]} × 5`,
            `Clamping ring Ø${2 * RING[1]} / Ø${2 * RING[0]} × 5`,
          ),
          'PETG',
          '1',
        ],
        ['4', l('Vis M4 × 30 + écrou nylstop', 'M4 × 30 bolt + nyloc nut'), l('inox A4', 'A4 stainless'), `${N}`],
        [
          '5',
          l(`Bride Ø${2 * FLANGE_R}, alésage conique`, `Ø${2 * FLANGE_R} flange, taper bore`),
          l('acier', 'steel'),
          '1',
        ],
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
        `Emboîter les ${N} augets sur le moyeu, poser la bague, serrer les M4 en croix à 2,5 N·m.`,
        `Fit the ${N} buckets on the hub, add the ring, tighten the M4 bolts crosswise to 2.5 N·m.`,
      ),
      l(
        `Équilibrer la roue seule (balourd ≤ 2 g à R${Math.round(tipL)}), puis visser la bride (4 × M5, 3 N·m).`,
        `Balance the bare runner (≤ 2 g at R${Math.round(tipL)}), then screw on the flange (4 × M5, 3 N·m).`,
      ),
      l(
        'Douille propre et sèche, 2 vis 1/4" BSW à 5,7 N·m, puis rondelle et écrou M16.',
        'Bush clean and dry, 2 × 1/4" BSW screws at 5.7 N·m, then washer and M16 nut.',
      ),
    ];
    steps.forEach((s, i) => {
      ay = note(d, 14, ay, 192, s, { bullet: `${i + 1}.`, size: 2, lh: 1.75 }) - 0.4;
    });
    return d;
  },
};
