// IEC 60617-style electrical symbols and small text/table helpers for the electrical and
// assembly sheets. Everything is drawn in a paper-space view (mm, Y down). Inline symbols
// are defined along the local +X axis, centred on the insertion point, 8 mm long, and mask
// the wire bundle under them, so wires are drawn first and symbols on top.
import { l, tr, type L } from '../../i18n';
import { COLORS, INK, INK_2, W, type Pt, type Stroke, type Text, type View } from '../svg';

/** Yellow stripe of the green-yellow protective conductor. */
export const PE_YELLOW = '#e2bf1a';
/** Phase lead colours of the generator (red, black, blue, as in the 3D model). */
export const PHASE = { U: COLORS.dcPos, V: INK, W: COLORS.acN };
export const PAPER_FILL = COLORS.paper;
export const HEAD_FILL = '#efe6d3';

// ---------------------------------------------------------------- wires

/** Offset a polyline sideways by d (paper mm, positive = left of the direction of travel). */
export function offsetPath(pts: Pt[], d: number): Pt[] {
  const nrm = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dy / len, -dx / len];
  };
  return pts.map((pt, i) => {
    const m1 = nrm(pts[Math.max(0, i - 1)], pts[Math.max(1, i)]);
    const m2 = nrm(pts[Math.min(pts.length - 2, i)], pts[Math.min(pts.length - 1, i + 1)]);
    let mx = m1[0] + m2[0];
    let my = m1[1] + m2[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const k = d / Math.max(0.3, mx * m1[0] + my * m1[1]); // miter
    return [pt[0] + mx * k, pt[1] + my * k];
  });
}

const DASHED = [1.6, 1];

/** DC cable drawn as its two cores: + red on the left of travel, − black on the right. */
export function dcWire(p: View, pts: Pt[], o: { dash?: boolean; gap?: number } = {}): void {
  const g = (o.gap ?? 1.1) / 2;
  const dash = o.dash ? DASHED : undefined;
  p.polyline(offsetPath(pts, g), { w: 0.35, color: COLORS.dcPos, dash });
  p.polyline(offsetPath(pts, -g), { w: 0.3, color: COLORS.dcNeg, dash });
}

/** Green-yellow protective conductor. */
export function peWire(p: View, pts: Pt[], w = 0.35): void {
  p.polyline(pts, { w, color: COLORS.pe });
  p.polyline(pts, { w, color: PE_YELLOW, dash: [0.9, 0.9] });
}

/** AC cable L (brown) / N (blue) / PE (green-yellow). */
export function acWire(p: View, pts: Pt[], gap = 0.9): void {
  p.polyline(offsetPath(pts, gap), { w: 0.3, color: COLORS.acL });
  p.polyline(pts, { w: 0.3, color: COLORS.acN });
  peWire(p, offsetPath(pts, -gap), 0.3);
}

/** Generator phase leads U / V / W (red, black, blue). */
export function phaseWire(p: View, pts: Pt[], gap = 0.9): void {
  p.polyline(offsetPath(pts, gap), { w: 0.3, color: PHASE.U });
  p.polyline(pts, { w: 0.3, color: PHASE.V });
  p.polyline(offsetPath(pts, -gap), { w: 0.3, color: PHASE.W });
}

/** Signal / data link (thin dashed). */
export function sigWire(p: View, pts: Pt[], color = COLORS.signal): void {
  p.polyline(pts, { w: 0.25, color, dash: [1.2, 0.8] });
}

export function dot(p: View, at: Pt, color = INK, r = 0.55): void {
  p.circle(at, r, { w: 0, fill: color, color });
}

/** Filled arrow head with its tip at `tip`, pointing along `deg` (0 = +X, 90 = up on paper). */
export function arrowHead(p: View, tip: Pt, deg: number, color = INK, size = 1.6): void {
  const a = (deg * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = -Math.sin(a);
  const bx = tip[0] - ux * size;
  const by = tip[1] - uy * size;
  const s = size * 0.38;
  p.polyline([tip, [bx - uy * s, by + ux * s], [bx + uy * s, by - ux * s]], {
    w: 0.1,
    color,
    fill: color,
    closed: true,
  });
}

// ---------------------------------------------------------------- inline symbols

function maskRect(g: View, a: Pt, b: Pt): void {
  g.rect(a, b, { w: 0, color: PAPER_FILL, fill: PAPER_FILL });
}

/** Inline symbol frame: a rotated local view with the bundle masked over its length. */
function inline(p: View, at: Pt, rot: number, top = 2, bottom = 2): View {
  const g = p.group(at, rot);
  maskRect(g, [-4, -top], [4, bottom]);
  return g;
}

export function fuse(p: View, at: Pt, rot = 0, color = INK): void {
  const g = inline(p, at, rot);
  g.line([-4, 0], [4, 0], { w: W.medium, color });
  g.rect([-2.6, -1.1], [2.6, 1.1], { w: W.medium, fill: PAPER_FILL, color });
  g.line([-2.6, 0], [2.6, 0], { w: W.thin, color });
}

export type ContactKind = 'switch' | 'disconnector' | 'switch-disconnector' | 'breaker' | 'rcd';

/** Make contact (drawn open) with the IEC function mark at the fixed contact. */
export function contact(p: View, at: Pt, rot: number, kind: ContactKind, color = INK): void {
  const g = inline(p, at, rot, kind === 'rcd' ? 3.8 : 3.2, 1.6);
  const s: Stroke = { w: W.medium, color };
  g.line([-4, 0], [-2.4, 0], s);
  g.line([2.6, 0], [4, 0], s);
  g.line([-2.4, 0], [2.3, -2.6], s);
  if (kind === 'disconnector' || kind === 'switch-disconnector') g.line([2.6, -1.1], [2.6, 1.1], s);
  if (kind === 'switch-disconnector') g.circle([2.6, 0], 0.5, { w: W.thin, color, fill: PAPER_FILL });
  if (kind === 'breaker' || kind === 'rcd') {
    g.line([1.9, -0.7], [3.3, 0.7], { w: W.thin, color });
    g.line([1.9, 0.7], [3.3, -0.7], { w: W.thin, color });
  }
  if (kind === 'rcd') {
    // toroid on the incoming side, mechanically linked to the contact
    g.pathPaper('M -3.7 0 A 0.5 1.3 0 1 0 -2.7 0 A 0.5 1.3 0 1 0 -3.7 0', { w: W.thin, color });
    g.polyline(
      [
        [-3.2, -1.3],
        [-3.2, -3.4],
        [-0.1, -3.4],
        [-0.1, -1.5],
      ],
      { w: W.thin, color, dash: [0.8, 0.5] },
    );
  }
}

/** Plug-and-socket connector (MC4, IP68…): pin on the -X side, socket on the +X side. */
export function connector(p: View, at: Pt, rot = 0, color = INK): void {
  const g = inline(p, at, rot, 2, 2);
  g.line([-4, 0], [-1.6, 0], { w: W.medium, color });
  g.rect([-1.6, -0.45], [0.7, 0.45], { w: 0.1, color, fill: color });
  g.arc([0.9, 0], 1.3, -90, 90, { w: W.medium, color });
  g.line([2.2, 0], [4, 0], { w: W.medium, color });
}

/** Measuring shunt: resistor with two sense taps. */
export function shunt(p: View, at: Pt, rot = 0, color = INK): void {
  const g = inline(p, at, rot, 2, 3);
  g.line([-4, 0], [4, 0], { w: W.medium, color });
  g.rect([-2.6, -1.1], [2.6, 1.1], { w: W.medium, fill: PAPER_FILL, color });
  for (const x of [-1.8, 1.8]) {
    g.line([x, 1.1], [x, 2.6], { w: W.thin, color });
    g.circle([x, 2.8], 0.3, { w: W.thin, color, fill: PAPER_FILL });
  }
}

export function resistor(p: View, at: Pt, rot = 0, color = INK, len = 6): void {
  const g = inline(p, at, rot);
  g.line([-4, 0], [4, 0], { w: W.medium, color });
  g.rect([-len / 2, -1.2], [len / 2, 1.2], { w: W.medium, fill: PAPER_FILL, color });
}

/** Diode pointing along +X (anode at -X). */
export function diode(p: View, at: Pt, rot = 0, color = INK, size = 1.5): void {
  const g = p.group(at, rot);
  maskRect(g, [-size - 0.3, -size - 0.2], [size + 0.3, size + 0.2]);
  g.line([-size - 1.2, 0], [size + 1.2, 0], { w: W.thin, color });
  g.polyline(
    [
      [-size, -size],
      [-size, size],
      [size, 0],
    ],
    { w: W.thin, color, fill: color, closed: true },
  );
  g.line([size, -size], [size, size], { w: W.medium, color });
}

// ---------------------------------------------------------------- device symbols

/** IEC converter: square with a diagonal, input sign top-left, output sign bottom-right. */
export function converter(
  p: View,
  c: Pt,
  s: number,
  tl: string,
  br: string,
  o: { color?: string; dash?: boolean } = {},
): void {
  const color = o.color ?? INK;
  const h = s / 2;
  p.rect([c[0] - h, c[1] - h], [c[0] + h, c[1] + h], {
    w: W.medium,
    color,
    fill: PAPER_FILL,
    dash: o.dash ? DASHED : undefined,
  });
  p.line([c[0] - h, c[1] + h], [c[0] + h, c[1] - h], { w: W.thin, color });
  const ts = Math.max(1.8, s * 0.2);
  p.text([c[0] - s / 4.2, c[1] - s / 4.2], tl, {
    size: ts,
    anchor: 'middle',
    baseline: 'middle',
    weight: 'bold',
    color,
  });
  p.text([c[0] + s / 4.2, c[1] + s / 4.2], br, {
    size: ts,
    anchor: 'middle',
    baseline: 'middle',
    weight: 'bold',
    color,
  });
}

export function generator(p: View, c: Pt, r: number, color = INK): void {
  p.circle(c, r, { w: W.medium, color, fill: PAPER_FILL });
  p.text([c[0], c[1] - r * 0.18], 'G', { size: r * 0.5, anchor: 'middle', baseline: 'middle', weight: 'bold', color });
  p.text([c[0], c[1] + r * 0.48], '3~', { size: r * 0.3, anchor: 'middle', baseline: 'middle', color });
}

/** Battery (two cells) on a vertical feeder; `at` = top terminal. Returns the bottom terminal. */
export function battery(p: View, at: Pt, color = INK): Pt {
  const [x, y] = at;
  p.line([x, y], [x, y + 2], { w: W.medium, color });
  for (const dy of [2, 6.2]) {
    p.line([x - 3.6, y + dy], [x + 3.6, y + dy], { w: W.medium, color });
    p.line([x - 1.8, y + dy + 1.4], [x + 1.8, y + dy + 1.4], { w: 0.8, color });
  }
  p.line([x, y + 3.4], [x, y + 6.2], { w: W.thin, color, dash: [0.6, 0.5] });
  p.line([x, y + 7.6], [x, y + 9.6], { w: W.medium, color });
  p.text([x + 2.6, y + 1.2], '+', { size: 1.8, color: COLORS.dcPos, weight: 'bold', baseline: 'middle' });
  return [x, y + 9.6];
}

/** Photovoltaic array: framed cells with incident light arrows. */
export function pvArray(p: View, c: Pt, w: number, h: number): void {
  const x0 = c[0] - w / 2;
  const y0 = c[1] - h / 2;
  p.rect([x0, y0], [x0 + w, y0 + h], { w: W.medium, fill: PAPER_FILL });
  for (let i = 1; i < 5; i++) p.line([x0 + (w * i) / 5, y0], [x0 + (w * i) / 5, y0 + h], { w: W.thin, color: INK_2 });
  p.line([x0, y0 + h / 2], [x0 + w, y0 + h / 2], { w: W.thin, color: INK_2 });
  for (const k of [0, 1]) {
    const tip: Pt = [x0 + 2 + k * 3.2, y0 - 0.4];
    p.line([tip[0] - 3, tip[1] - 3.4], tip, { w: W.thin });
    arrowHead(p, tip, -48.6, INK, 1.3);
  }
}

/** Earth (functional) or protective earth (circled). `at` = connection point above. */
export function earth(p: View, at: Pt, protective = false, color = INK): void {
  const [x, y] = at;
  p.line([x, y], [x, y + 1.6], { w: W.thin, color });
  p.line([x - 2, y + 1.6], [x + 2, y + 1.6], { w: W.medium, color });
  p.line([x - 1.3, y + 2.4], [x + 1.3, y + 2.4], { w: W.medium, color });
  p.line([x - 0.6, y + 3.2], [x + 0.6, y + 3.2], { w: W.medium, color });
  if (protective) p.circle([x, y + 2.3], 2.7, { w: W.thin, color });
}

/** Surge protective device on a branch from `node` down to earth. */
export function spd(p: View, node: Pt, color = INK): void {
  const [x, y] = node;
  p.line([x, y], [x, y + 3], { w: W.thin, color });
  p.rect([x - 1.6, y + 3], [x + 1.6, y + 8.4], { w: W.medium, color, fill: PAPER_FILL });
  p.polyline(
    [
      [x - 1, y + 7.6],
      [x + 0.9, y + 3.8],
      [x + 1.6, y + 3.8],
    ],
    { w: W.thin, color },
  );
  p.line([x, y + 8.4], [x, y + 9.4], { w: W.thin, color });
  earth(p, [x, y + 9.4], false, color);
  dot(p, node, color);
}

export function sensor(p: View, c: Pt, letter: string, color = INK): void {
  p.circle(c, 2.4, { w: W.medium, color, fill: PAPER_FILL });
  p.text(c, letter, { size: 2, anchor: 'middle', baseline: 'middle', weight: 'bold', color, italic: letter === 'θ' });
}

/** Relay / solenoid coil: rectangle with an optional inscription (e.g. "U>"). */
export function coil(p: View, c: Pt, label = '', color = INK, w = 7, h = 3.6): void {
  p.rect([c[0] - w / 2, c[1] - h / 2], [c[0] + w / 2, c[1] + h / 2], { w: W.medium, color, fill: PAPER_FILL });
  if (label) p.text(c, label, { size: 1.8, anchor: 'middle', baseline: 'middle', weight: 'bold', color });
  else p.line([c[0] - w / 2, c[1] + h / 2], [c[0] + w / 2, c[1] - h / 2], { w: W.thin, color });
}

/** Off-sheet / cross-reference tag (pentagon pointing toward `dir`). */
export function tag(p: View, at: Pt, label: string, dir: 'left' | 'right', color = COLORS.signal): void {
  const [x, y] = at;
  const w = 7;
  const h = 3.4;
  const s = dir === 'right' ? 1 : -1;
  const pts: Pt[] = [
    [x, y - h / 2],
    [x + s * (w - 1.6), y - h / 2],
    [x + s * w, y],
    [x + s * (w - 1.6), y + h / 2],
    [x, y + h / 2],
  ];
  p.polyline(pts, { w: W.thin, color, fill: PAPER_FILL, closed: true });
  p.text([x + s * (w - 1.2) * 0.5, y], label, {
    size: 1.8,
    anchor: 'middle',
    baseline: 'middle',
    weight: 'bold',
    color,
  });
}

/** Dashed enclosure with a title tab (equipment box). */
export function enclosure(p: View, a: Pt, b: Pt, title: Text, color = INK_2, size = 1.9): void {
  p.roundRect(a, b, 1.2, { w: W.thin, color, dash: [2.4, 1.1] });
  p.text([a[0] + 1.6, a[1] + 1.3], title, { size, weight: 'bold', color, baseline: 'top' });
}

// ---------------------------------------------------------------- text helpers

/** Rough text width (paper mm) for the sheet fonts; deliberately a little generous. */
export function estW(s: string, size: number, mono = false, bold = false): number {
  return s.length * size * (mono ? 0.86 : bold ? 0.78 : 0.7);
}

/** Greedy word wrap of `s` into lines no wider than `maxW`. Explicit "\n" are kept. */
export function wrap(s: string, maxW: number, size: number, mono = false, bold = false): string[] {
  const out: string[] = [];
  // no break between a number and its unit, inside "1 500", after ± ≈ ≤…, or before : ; ! ? »
  const glued = s
    .replace(/(\d) (?=[A-Za-zΩ°%µ€]|\d{3}\b)/g, '$1\u00a0')
    .replace(/([±≈≤≥<>=×→]) (?=[\dA-Za-z])/g, '$1\u00a0')
    .replace(/ ([:;!?»])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0');
  for (const para of glued.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && estW(next, size, mono, bold) > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}

/** Shorten `s` with an ellipsis so that it fits in `maxW` on one line. */
export function fit(s: string, maxW: number, size: number, mono = false): string {
  if (estW(s, size, mono) <= maxW) return s;
  let out = s;
  while (out.length > 1 && estW(`${out}…`, size, mono) > maxW) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

/** Wrapped paragraph; returns the height used. */
export function para(
  p: View,
  x: number,
  y: number,
  text: Text,
  maxW: number,
  o: { size?: number; lineH?: number; color?: string; bold?: boolean; mono?: boolean; italic?: boolean } = {},
): number {
  const size = o.size ?? 1.9;
  const lh = o.lineH ?? size * 1.62;
  const lines = wrap(tr(text), maxW, size, o.mono, o.bold);
  lines.forEach((ln, i) =>
    p.text([x, y + i * lh], ln, {
      size,
      color: o.color,
      weight: o.bold ? 'bold' : 'normal',
      mono: o.mono,
      italic: o.italic,
      baseline: 'top',
    }),
  );
  return lines.length * lh;
}

// ---------------------------------------------------------------- table

export interface GridCol {
  label: Text;
  w: number;
  align?: 'start' | 'middle' | 'end';
  mono?: boolean;
}
export type Cell = Text | { t: Text; color?: string; bold?: boolean; mono?: boolean };

const cellOf = (c: Cell): { t: Text; color?: string; bold?: boolean; mono?: boolean } =>
  typeof c === 'object' && 't' in c ? c : { t: c };

/**
 * Table with word-wrapped cells (the kit's table() is single-line and mono-spaced).
 * Returns its height. `fills` optionally tints whole rows.
 */
export function grid(
  p: View,
  x: number,
  y: number,
  cols: GridCol[],
  rows: Cell[][],
  o: { size?: number; pad?: number; lineH?: number; headSize?: number; fills?: (string | undefined)[] } = {},
): number {
  const size = o.size ?? 1.9;
  const lh = o.lineH ?? size * 1.55;
  const pad = o.pad ?? 1.1;
  const headSize = o.headSize ?? size;
  const total = cols.reduce((a, c) => a + c.w, 0);
  const lay = (t: Text, c: GridCol, cell: { mono?: boolean; bold?: boolean }, sz: number) =>
    wrap(tr(t), c.w - 3.4, sz, cell.mono ?? c.mono, cell.bold);
  const headLines = cols.map((c) => lay(c.label, c, { bold: true }, headSize));
  const headH = Math.max(...headLines.map((l) => l.length)) * lh + pad * 2;
  const body = rows.map((r) =>
    r.map((c, i) => ({ cell: cellOf(c), lines: lay(cellOf(c).t, cols[i], cellOf(c), size) })),
  );
  const heights = body.map((r) => Math.max(...r.map((c) => c.lines.length)) * lh + pad * 2);
  const h = headH + heights.reduce((a, b) => a + b, 0);
  p.rect([x, y], [x + total, y + h], { w: W.medium, fill: PAPER_FILL });
  p.rect([x, y], [x + total, y + headH], { w: W.thin, fill: HEAD_FILL });
  const put = (
    lines: string[],
    cx: number,
    cy: number,
    c: GridCol,
    cell: { color?: string; bold?: boolean; mono?: boolean },
    sz: number,
  ) => {
    const align = c.align ?? 'start';
    const tx = align === 'start' ? cx + 1.3 : align === 'end' ? cx + c.w - 1.3 : cx + c.w / 2;
    lines.forEach((ln, i) =>
      p.text([tx, cy + pad + i * lh + lh * 0.12], ln, {
        size: sz,
        anchor: align,
        baseline: 'top',
        mono: cell.mono ?? c.mono,
        weight: cell.bold ? 'bold' : 'normal',
        color: cell.color,
      }),
    );
  };
  let cx = x;
  cols.forEach((c, i) => {
    if (i) p.line([cx, y], [cx, y + h], { w: W.thin });
    put(headLines[i], cx, y, c, { bold: true }, headSize);
    cx += c.w;
  });
  let ry = y + headH;
  body.forEach((r, ri) => {
    const fill = o.fills?.[ri];
    if (fill) p.rect([x + 0.2, ry], [x + total - 0.2, ry + heights[ri]], { w: 0, color: fill, fill, opacity: 0.6 });
    p.line([x, ry], [x + total, ry], { w: W.thin });
    let rx = x;
    r.forEach((c, ci) => {
      put(c.lines, rx, ry, cols[ci], c.cell, size);
      rx += cols[ci].w;
    });
    ry += heights[ri];
  });
  // redraw column separators over row fills
  cx = x;
  cols.forEach((c, i) => {
    if (i) p.line([cx, y + headH], [cx, y + h], { w: W.thin });
    cx += c.w;
  });
  return h;
}

// ---------------------------------------------------------------- legend

/** Legend of the symbols and wire colours of this module: a 134 × 89 mm box at (x, y). */
export function iecLegend(p: View, x: number, y: number): void {
  const g = p.group([x, y]); // local frame: box origin
  const txt = (at: Pt, t: Text, bold = false) =>
    g.text(at, t, { size: bold ? 1.9 : 1.8, baseline: 'middle', weight: bold ? 'bold' : 'normal', halo: true });
  g.rect([0, 0], [134, 89], { w: W.thin, fill: PAPER_FILL });
  txt([2, 3.5], l('LÉGENDE (IEC 60617)', 'LEGEND (IEC 60617)'), true);
  const row = (i: number) => 9.5 + i * 7.3;
  const c1: [(y: number) => void, L][] = [
    [(y) => generator(g, [9, y], 3), l('Générateur à aimants triphasé', 'Three-phase PM generator')],
    [
      (y) => converter(g, [9, y], 6, '~', '='),
      l('Convertisseur : pont, MPPT, onduleur', 'Converter: bridge, MPPT, inverter'),
    ],
    [
      (y) => {
        g.polyline(
          [
            [4, y],
            [7.4, y],
            [7.4, y - 2.6],
            [7.4, y + 2.6],
          ],
          { w: W.medium },
        );
        g.line([9, y - 1.3], [9, y + 1.3], { w: 0.8 });
        g.line([9, y], [14, y], { w: W.medium });
      },
      l('Batterie (élément long = +)', 'Battery (long plate = +)'),
    ],
    [(y) => pvArray(g, [9, y + 1.6], 9, 4), l('Champ photovoltaïque', 'Photovoltaic array')],
    [(y) => fuse(g, [9, y]), l('Fusible (gPV, MEGA)', 'Fuse (gPV, MEGA)')],
    [(y) => contact(g, [9, y + 1], 0, 'switch-disconnector'), l('Interrupteur-sectionneur', 'Switch-disconnector')],
    [(y) => contact(g, [9, y + 1], 0, 'breaker'), l('Disjoncteur', 'Circuit breaker')],
    [(y) => contact(g, [9, y + 1.4], 0, 'rcd'), l('Interrupteur différentiel 30 mA', 'RCD 30 mA')],
    [
      (y) => {
        g.rect([6.4, y - 1.6], [11.6, y + 1.6], { w: W.medium });
        g.polyline(
          [
            [7.2, y + 1],
            [10.8, y - 0.9],
            [11.6, y - 0.9],
          ],
          { w: W.thin },
        );
      },
      l('Parafoudre (SPD type 2)', 'Surge protective device (type 2)'),
    ],
    [(y) => shunt(g, [9, y - 0.6]), l('Shunt de mesure', 'Measuring shunt')],
    [(y) => resistor(g, [9, y]), l('Résistance (délestage, chauffe)', 'Resistor (dump load, heater)')],
  ];
  const c2: [(y: number) => void, L][] = [
    [(y) => connector(g, [74, y]), l('Connecteur débrochable (MC4, IP68)', 'Plug-in connector (MC4, IP68)')],
    [
      (y) => sensor(g, [74, y], 'n'),
      l('Capteur : n vitesse, θ temp., p pression', 'Sensor: n speed, θ temp., p pressure'),
    ],
    [(y) => coil(g, [74, y], 'U>'), l('Bobine de relais / gâche', 'Relay coil / solenoid latch')],
    [(y) => earth(g, [74, y - 2.4], true), l('Terre de protection (PE)', 'Protective earth (PE)')],
    [
      (y) => tag(g, [70.5, y], 'S1', 'right'),
      l('Renvoi de liaison de données vers le GX', 'Data link cross-reference to the GX'),
    ],
    [
      (y) =>
        dcWire(g, [
          [68, y],
          [80, y],
        ]),
      l('Câble DC : + rouge, − noir', 'DC cable: + red, − black'),
    ],
    [
      (y) =>
        acWire(g, [
          [68, y],
          [80, y],
        ]),
      l('AC : L marron · N bleu · PE vert-jaune', 'AC: L brown · N blue · PE green-yellow'),
    ],
    [
      (y) =>
        phaseWire(g, [
          [68, y],
          [80, y],
        ]),
      l('Phases U · V · W : rouge, noir, bleu', 'Phases U · V · W: red, black, blue'),
    ],
    [
      (y) =>
        sigWire(g, [
          [68, y],
          [80, y],
        ]),
      l('Données : CAN, VE.Can, MQTT', 'Data: CAN, VE.Can, MQTT'),
    ],
    [
      (y) =>
        dcWire(
          g,
          [
            [68, y],
            [80, y],
          ],
          { dash: true },
        ),
      l('Variante ou option (tireté)', 'Variant or option (dashed)'),
    ],
    [(y) => dot(g, [74, y], INK, 0.9), l('Jonction (raccordement)', 'Junction (connection)')],
  ];
  c1.forEach(([draw, t], i) => (draw(row(i)), txt([18, row(i)], t)));
  c2.forEach(([draw, t], i) => (draw(row(i)), txt([83, row(i)], t)));
}
