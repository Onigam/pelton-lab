import { tr, type L } from '../../i18n';
import { SimEngine, type SizingPoint } from '../../sim/engine';
import { G, RHO, WAVE_SPEED_HDPE } from '../../sim/physics';
import { COLORS, INK, INK_2, W, type Drawing, type Pt, type Text, type View } from '../svg';

// Shared helpers for the hydraulic sheets (PL-H01..H03): P&ID symbols drawn in paper space
// (ISO 10628 / ISA S5.1 style), a few annotations the kit lacks (angle and arc dimensions,
// level marks, break marks, wrapped notes) and the steady-state values computed with the
// simulation engine, so the drawings always agree with the simulator.

// ------------------------------------------------------------------ text helpers

/** Join strings and bilingual values into one bilingual value. */
export function cat(...parts: (string | L)[]): L {
  const pick = (k: 'fr' | 'en') => parts.map((p) => (typeof p === 'string' ? p : p[k])).join('');
  return { fr: pick('fr'), en: pick('en') };
}

/** Number with `dec` decimals: decimal comma and thin-space thousands in French. */
export function nf(v: number, dec = 1): L {
  const [i, f] = Math.abs(v).toFixed(dec).split('.');
  const sign = v < 0 && Number(v.toFixed(dec)) !== 0 ? '\u2212' : '';
  const group = (sep: string) => i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return { fr: sign + group('\u202f') + (f ? ',' + f : ''), en: sign + group(',') + (f ? '.' + f : '') };
}

/** Rough text width (paper mm) for a cap height: the kit cannot measure detached SVG text. */
export const textW = (s: string, size: number) => s.length * size * 0.74;

function wrap(s: string, maxChars: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    if (line && (line + ' ' + word).length > maxChars) {
      out.push(line);
      line = word;
    } else line = line ? line + ' ' + word : word;
  }
  if (line) out.push(line);
  return out;
}

/** Numbered notes wrapped to a width (paper mm). Returns the y after the last line. */
export function notes(
  p: View,
  x: number,
  y: number,
  width: number,
  title: Text | null,
  items: Text[],
  size = 1.9,
  start = 1,
): number {
  if (title) p.text([x, y], title, { size: 2.3, weight: 'bold' });
  let cy = title ? y + size * 2.2 : y;
  const lh = size * 1.5;
  const maxChars = Math.floor((width - 4) / (size * 0.74));
  items.forEach((it, i) => {
    const lines = wrap(tr(it), maxChars);
    p.text([x, cy], `${i + start}.`, { size, weight: 'bold' });
    lines.forEach((ln, k) => p.text([x + 4, cy + k * lh], ln, { size }));
    cy += lines.length * lh + size * 0.45;
  });
  return cy;
}

/** Multi-line text (wrapped) without numbering. Returns the y after the last line. */
export function para(p: View, x: number, y: number, width: number, text: Text, size = 1.9, color = INK): number {
  const lines = wrap(tr(text), Math.floor(width / (size * 0.74)));
  lines.forEach((ln, k) => p.text([x, y + k * size * 1.5], ln, { size, color }));
  return y + lines.length * size * 1.5;
}

// ------------------------------------------------------------------ annotations

const mark = (e: SVGElement, start: boolean, end: boolean) => {
  if (start) e.setAttribute('marker-start', 'url(#arrow)');
  if (end) e.setAttribute('marker-end', 'url(#arrow)');
  return e;
};

/** Line with arrowheads (paper or model view). */
export function arrowLine(v: View, a: Pt, b: Pt, color = INK, w = W.thin, both = false): SVGElement {
  return mark(v.line(a, b, { w, color }), both, true);
}

/** Arc dimension (angle or developed length) around centre c, label at mid-angle. */
export function arcDim(
  v: View,
  c: Pt,
  r: number,
  a0: number,
  a1: number,
  label: Text,
  o: { color?: string; labelOff?: number; size?: number } = {},
): void {
  mark(v.arc(c, r, a0, a1, { w: W.thin, color: o.color ?? INK }), true, true);
  const am = (((a0 + a1) / 2) * Math.PI) / 180;
  const q = v.map([c[0] + r * Math.cos(am), c[1] + r * Math.sin(am)]);
  const off = o.labelOff ?? 2.6;
  const dir = v.map([c[0] + (r + 1) * Math.cos(am), c[1] + (r + 1) * Math.sin(am)]);
  const len = Math.hypot(dir[0] - q[0], dir[1] - q[1]) || 1;
  const t: Pt = [q[0] + ((dir[0] - q[0]) / len) * off, q[1] + ((dir[1] - q[1]) / len) * off];
  v.drawing.paper().text(t, label, {
    size: o.size ?? 2.3,
    mono: true,
    anchor: 'middle',
    baseline: 'middle',
    halo: true,
    color: o.color,
  });
}

/** Radius dimension with a shortened radial line (centre far off the view). */
export function radiusPartial(
  v: View,
  c: Pt,
  r: number,
  angle: number,
  len: number,
  label: Text,
  labelSide: 1 | -1 | 0 = 1,
): void {
  const a = (angle * Math.PI) / 180;
  const p0: Pt = [c[0] + (r - len) * Math.cos(a), c[1] + (r - len) * Math.sin(a)];
  const p1: Pt = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  arrowLine(v, p0, p1);
  const q = v.map(p0);
  const anchor = labelSide > 0 ? 'start' : labelSide < 0 ? 'end' : 'middle';
  v.drawing.paper().text([q[0] + labelSide * 1, q[1] + 2.6], label, { size: 2.3, mono: true, anchor, halo: true });
}

/** Level mark ▽ with its value; `water` adds the free-surface ticks. */
export function levelMark(
  p: View,
  at: Pt,
  label: Text,
  o: { water?: boolean; color?: string; left?: boolean; size?: number } = {},
): void {
  const [x, y] = at;
  const c = o.color ?? INK;
  p.polyline(
    [
      [x - 1.5, y - 2.4],
      [x + 1.5, y - 2.4],
      [x, y],
    ],
    { closed: true, w: W.thin, color: c, fill: COLORS.paper },
  );
  if (o.water) {
    p.line([x - 2.2, y + 0.9], [x + 2.2, y + 0.9], { w: W.thin, color: COLORS.water });
    p.line([x - 1.2, y + 1.8], [x + 1.2, y + 1.8], { w: W.thin, color: COLORS.water });
  }
  p.text([x + (o.left ? -2.4 : 2.4), y - 1.4], label, {
    size: o.size ?? 2,
    anchor: o.left ? 'end' : 'start',
    color: c,
    halo: true,
  });
}

/** Break mark across a line drawn at `angle` (deg, ccw): masks the line and draws two slashes. */
export function breakMark(p: View, at: Pt, angle = 0, color = INK): void {
  const g = p.group(at, angle);
  g.rect([-1.6, -3.2], [1.6, 3.2], { w: 0, fill: COLORS.paper });
  g.line([-2.2, 3], [-0.6, -3], { w: W.medium, color });
  g.line([0.6, 3], [2.2, -3], { w: W.medium, color });
}

/** Filled flow arrow on a line, pointing along `angle` (deg, ccw, 0 = right). */
export function flowArrow(p: View, at: Pt, angle = 0, color = COLORS.water, s = 1): void {
  p.group(at, angle, s).polyline(
    [
      [2, 0],
      [-1.4, -1.4],
      [-1.4, 1.4],
    ],
    { closed: true, w: 0, fill: color },
  );
}

/** Irregular dry-stone masonry pattern, added once to the sheet defs (fill: 'url(#h-stone)'). */
export function stonePattern(d: Drawing): string {
  const defs = d.svg.querySelector('defs');
  if (defs && !defs.querySelector('#h-stone')) {
    const ns = 'http://www.w3.org/2000/svg';
    const pat = document.createElementNS(ns, 'pattern');
    for (const [k, v] of Object.entries({ id: 'h-stone', patternUnits: 'userSpaceOnUse', width: 9, height: 5 }))
      pat.setAttribute(k, String(v));
    const paths = [
      'M0.3,0.4 L3.9,0.2 L4.3,2.2 L0.5,2.4 Z',
      'M4.8,0.3 L8.6,0.5 L8.4,2.3 L4.9,2.1 Z',
      'M-0.2,2.9 L2.4,2.8 L2.6,4.7 L-0.2,4.6 Z',
      'M3,2.9 L6.6,2.7 L6.8,4.6 L3.2,4.8 Z',
      'M7.2,2.9 L9.2,2.9 L9.2,4.6 L7.3,4.7 Z',
    ];
    for (const dd of paths) {
      const e = document.createElementNS(ns, 'path');
      e.setAttribute('d', dd);
      e.setAttribute('fill', '#e4ddcf');
      e.setAttribute('stroke', '#7d7468');
      e.setAttribute('stroke-width', '0.15');
      pat.append(e);
    }
    defs.append(pat);
  }
  return 'url(#h-stone)';
}

// ------------------------------------------------------------------ P&ID symbols (paper mm)

export interface SymOpts {
  rot?: number;
  color?: string;
  scale?: number;
}

/**
 * Ball valve: bow-tie with a ball (filled = normally closed). Operator: quarter-turn lever
 * (coloured like the real handle), gear box + handwheel, or none.
 */
export function ballValve(
  p: View,
  at: Pt,
  o: SymOpts & { closed?: boolean; op?: 'lever' | 'gear' | 'none'; lever?: string; opSide?: 1 | -1 } = {},
): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  const c = o.color ?? INK;
  const fill = o.closed ? c : COLORS.paper;
  g.polyline(
    [
      [-4, -2.5],
      [0, 0],
      [-4, 2.5],
    ],
    { closed: true, w: W.medium, color: c, fill },
  );
  g.polyline(
    [
      [4, -2.5],
      [0, 0],
      [4, 2.5],
    ],
    { closed: true, w: W.medium, color: c, fill },
  );
  g.circle([0, 0], 1.15, { w: W.thin, color: c, fill: o.closed ? c : COLORS.paper });
  const s = o.opSide ?? 1;
  if ((o.op ?? 'lever') === 'lever') {
    g.line([0, -1.2 * s], [0, -4.4 * s], { w: W.thin, color: c });
    g.line([0, -4.4 * s], [4.2, -4.4 * s], { w: 0.7, color: o.lever ?? c });
  } else if (o.op === 'gear') {
    g.line([0, -1.2 * s], [0, -3.2 * s], { w: W.thin, color: c });
    g.rect([-2.2, -3.2 * s], [2.2, -6.2 * s], { w: W.thin, color: c, fill: COLORS.paper });
    g.line([-1.4, -4.7 * s], [1.4, -4.7 * s], { w: W.thin, color: c });
    g.line([0, -6.2 * s], [0, -7.6 * s], { w: W.thin, color: c });
    g.line([-3.2, -7.6 * s], [3.2, -7.6 * s], { w: 0.6, color: o.lever ?? c });
  }
}

/** Instrument bubble (field mounted, ISA): function letters over the loop number. */
export function instrument(p: View, at: Pt, letters: string, num: string, color = INK): void {
  p.circle(at, 4.2, { w: W.medium, color, fill: COLORS.paper });
  p.text([at[0], at[1] - 1.2], letters, { size: 1.9, weight: 'bold', anchor: 'middle', baseline: 'middle', color });
  p.text([at[0], at[1] + 1.7], num, { size: 1.7, anchor: 'middle', baseline: 'middle', color, mono: true });
}

/** Automatic air-release valve (float type) on a pipe top: `at` = connection point. */
export function airValve(p: View, at: Pt, o: SymOpts = {}): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  const c = o.color ?? INK;
  g.line([0, 0], [0, -2], { w: W.medium, color: c });
  g.rect([-2.4, -2], [2.4, -8], { w: W.medium, color: c, fill: COLORS.paper });
  g.circle([0, -4.6], 1.4, { w: W.thin, color: c });
  mark(g.line([0, -8], [0, -11.2], { w: W.thin, color: c }), false, true);
}

/** Strainer / filter: box with the screen drawn dashed. */
export function strainer(p: View, at: Pt, o: SymOpts = {}): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  const c = o.color ?? INK;
  g.rect([-3, -2.4], [3, 2.4], { w: W.medium, color: c, fill: COLORS.paper });
  g.line([-3, 2.4], [3, -2.4], { w: W.thin, color: c, dash: [0.8, 0.6] });
}

/** Compression coupling (blue nuts of the PE fitting). */
export function coupling(p: View, at: Pt, o: SymOpts = {}): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  const c = o.color ?? COLORS.acN;
  g.rect([-1.9, -2.9], [-0.7, 2.9], { w: W.thin, color: c, fill: c });
  g.rect([0.7, -2.9], [1.9, 2.9], { w: W.thin, color: c, fill: c });
}

/** Concentric reducer (large end on the left in local axes). */
export function reducer(p: View, at: Pt, o: SymOpts = {}): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  g.polyline(
    [
      [-2.4, -2.5],
      [2.4, -1.5],
      [2.4, 1.5],
      [-2.4, 2.5],
    ],
    { closed: true, w: W.medium, color: o.color ?? INK, fill: COLORS.paper },
  );
}

/** Pipe junction dot (tee / cross). */
export function junction(p: View, at: Pt, color = INK): void {
  p.circle(at, 0.8, { w: 0, fill: color });
}

/**
 * Injector, tip at `at`, jet along local +x. 'spear' = body + needle + handwheel (variable),
 * 'quick' = lance with flange and a bayonet insert (fixed diameter, quick change).
 */
export function nozzle(p: View, at: Pt, kind: 'spear' | 'quick', o: SymOpts & { accent?: string } = {}): void {
  const g = p.group(at, o.rot ?? 0, o.scale ?? 1);
  const c = o.color ?? INK;
  g.polyline(
    [
      [-7, -2.6],
      [0, -0.9],
      [0, 0.9],
      [-7, 2.6],
    ],
    { closed: true, w: W.medium, color: c, fill: COLORS.paper },
  );
  if (kind === 'spear') {
    g.rect([-15, -2.6], [-7, 2.6], { w: W.medium, color: c, fill: COLORS.paper });
    g.line([-19, 0], [-1.6, 0], { w: W.thin, color: c });
    g.polyline(
      [
        [-3.4, -0.7],
        [-1.2, 0],
        [-3.4, 0.7],
      ],
      { w: W.thin, color: c, closed: true, fill: c },
    );
    g.line([-19, -3.2], [-19, 3.2], { w: 0.7, color: o.accent ?? COLORS.red });
  } else {
    g.line([-7, -3.6], [-7, 3.6], { w: W.thick, color: c });
    g.rect([-2.6, -1.9], [-0.9, 1.9], { w: W.thin, color: o.accent ?? c, fill: o.accent ?? c });
  }
}

/** Pelton runner seen from the front: pitch circle, disc, hub and cupped buckets; turns ccw. */
export function pelton(p: View, c: Pt, r: number, color = INK, n = 18): void {
  const k = r / 14;
  p.circle(c, r * 0.8, { w: W.medium, color, fill: COLORS.paper });
  p.circle(c, r * 0.3, { w: W.thin, color });
  // half-moon cups, open side facing the jet (against the rotation)
  const cup: Pt[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = Math.PI / 2 + (i / 8) * Math.PI;
    cup.push([1.5 * Math.cos(t), -1.7 + 1.7 * Math.sin(t)]);
  }
  for (let i = 0; i < n; i++) {
    const a = (360 * i) / n + 5;
    const ar = (a * Math.PI) / 180;
    const b = p.group([c[0] + (r - 1.8 * k) * Math.cos(ar), c[1] - (r - 1.8 * k) * Math.sin(ar)], a - 90, k);
    b.polyline(cup, { closed: true, w: W.thin / k, color, fill: COLORS.paper });
  }
  p.center([c[0] - r - 3 * k, c[1]], [c[0] + r + 3 * k, c[1]]);
  p.center([c[0], c[1] - r - 3 * k], [c[0], c[1] + r + 3 * k]);
  p.circle(c, r, { w: W.thin, color: INK_2, dash: 'center' });
  mark(p.arc(c, r + 3.8 * k, 145, 205, { w: W.thin, color }), false, true);
}

// ------------------------------------------------------------------ computed values

export interface Case {
  hGross: number;
  len: number;
  bore: number;
  /** Flow per nozzle (L/s) with its name and diameter (mm). */
  jets: { d: number; q: number }[];
  pt: SizingPoint;
  staticBar: number;
  runBar: number;
  vPipe: number;
  /** Joukowsky surge for an instantaneous closure (bar). */
  surgeBar: number;
  /** Pressure-wave round trip 2L/a (s). */
  twoLa: number;
}

function finish(e: SimEngine, jets: { d: number; q: number }[], pt: SizingPoint): Case {
  const p = e.params;
  const d = p.pipeDiam / 1000;
  const vPipe = pt.q / 1000 / ((Math.PI * d * d) / 4);
  return {
    hGross: p.headGross,
    len: p.pipeLength,
    bore: p.pipeDiam,
    jets,
    pt,
    staticBar: (RHO * G * p.headGross) / 1e5,
    runBar: (RHO * G * pt.hn) / 1e5,
    vPipe,
    surgeBar: (RHO * WAVE_SPEED_HDPE * vPipe) / 1e5,
    twoLa: (2 * p.pipeLength) / WAVE_SPEED_HDPE,
  };
}

function single(preset: 'siteA' | 'siteA8', dMm: number): Case {
  const e = new SimEngine(preset);
  const q = e.nozzleFlow(dMm);
  return finish(e, [{ d: dMm, q }], e.chainFromFlow(q, e.params.pipeDiam, dMm)!);
}

/** Site B: spear (12 mm max, 55 % open) and fixed 7 mm nozzle sharing the penstock. */
function siteB(): Case {
  const e = new SimEngine('siteB');
  const p = e.params;
  const dTop = p.top.d * Math.sqrt(p.top.opening);
  // same Cd as the engine: 0.95 for the spear, 0.97 for the fixed nozzle
  const aTop = 0.95 * dTop * dTop;
  const aSide = 0.97 * p.side.d * p.side.d;
  const qT = e.nozzleFlow(Math.sqrt((aTop + aSide) / 0.97));
  const share = aTop / (aTop + aSide);
  const dMean = share * dTop + (1 - share) * p.side.d;
  return finish(
    e,
    [
      { d: dTop, q: qT * share },
      { d: p.side.d, q: qT * (1 - share) },
    ],
    e.chainFromFlow(qT, p.pipeDiam, dMean)!,
  );
}

export interface HydroValues {
  a6: Case;
  a8: Case;
  b: Case;
  /** Site A bores at 1.8 L/s (Ø8 jet): internal diameter → steady state. */
  bores: { bore: number; od: number; pt: SizingPoint; v: number }[];
  /** Maker examples vs this model (runner matched to the jet). */
  maker: { h: number; bore: number; len: number; q: number; wMaker: number; whDay: number; pt: SizingPoint }[];
}

let cache: HydroValues | undefined;

export function hydro(): HydroValues {
  if (cache) return cache;
  const e8 = new SimEngine('siteA8');
  const bores = [
    [55, 63],
    [66, 75],
    [79, 90],
  ].map(([bore, od]) => ({
    bore,
    od,
    pt: e8.chainFromFlow(1.8, bore, 8)!,
    v: 1.8e-3 / ((Math.PI * (bore / 1000) ** 2) / 4),
  }));
  const maker = (
    [
      [50, 40, 150, 1, 416, 9984],
      [30, 80, 150, 4, 1016, 24384],
      [80, 70, 250, 2, 1393, 33432],
    ] as const
  ).map(([h, bore, len, q, wMaker, whDay]) => {
    const e = new SimEngine();
    e.set({ headGross: h, pipeLength: len, pipeDiam: bore });
    return { h, bore, len, q, wMaker, whDay, pt: e.chainFromFlow(q, bore, undefined, true)! };
  });
  cache = { a6: single('siteA', 6), a8: single('siteA8', 8), b: siteB(), bores, maker };
  return cache;
}
