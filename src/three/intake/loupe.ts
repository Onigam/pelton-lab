import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { getLang } from '../../i18n';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '../types';
import { canvasTexture, clamp } from '../util';
import { profileAt, sOfK } from './dims';

// "Magnifier" shown with the schematic overlay: a ×20 cross-section of a few wedge wires,
// animated. The water layer slides over the bars; the raised upstream edge of every bar
// shears a thin sliver off the bottom of the layer and turns it down through the 1 mm slot
// (Coanda effect + shearing); leaves stay on top and ride on to the overflow.

const SIZE = 512;
const MM = 24; // canvas px per real mm
const BAR = { top: 2.2 * MM, depth: 3.6 * MM, slot: 1.0 * MM, tilt: (9 * Math.PI) / 180 };
const PITCH = BAR.top + BAR.slot;
const ANGLE = 0.36; // screen slope shown in the loupe
const ORIGIN = { x: SIZE / 2 - 6, y: SIZE / 2 + 18 };

const TXT = {
  fr: {
    title: 'Grille en coupe ×20',
    layer: "lame d'eau",
    slot: 'fente 1 mm',
    cap: 'eau captée',
    over: 'surverse + feuilles',
    dry: 'plus de surverse !',
    tilt: 'arête amont relevée',
  },
  en: {
    title: 'Screen section ×20',
    layer: 'water layer',
    slot: '1 mm slot',
    cap: 'captured water',
    over: 'overflow + leaves',
    dry: 'no overflow!',
    tilt: 'raised upstream edge',
  },
};

interface LoupeState {
  t: number;
  cap: number;
  over: number;
}

/** Local flow frame (+x downstream, +y into the screen) → canvas pixels. */
function toCanvas(x: number, y: number): [number, number] {
  const c = Math.cos(ANGLE);
  const s = Math.sin(ANGLE);
  return [ORIGIN.x + x * c - y * s, ORIGIN.y + x * s + y * c];
}

/** Layer thickness (px) along the local flow axis: thins as the bars shear it. */
function layerT(x: number, st: LoupeState): number {
  if (st.cap + st.over <= 0.02) return 0;
  const k = clamp((x + SIZE / 2) / SIZE, 0, 1);
  const inflow = 0.75 + 0.5 * clamp((st.cap + st.over) / 4, 0, 1);
  const end = st.over > 0.03 ? 0.35 + 0.4 * clamp(st.over / 3, 0, 1) : 0;
  return Math.max(0, inflow + (end - inflow) * k) * 2.2 * MM;
}

/** Corners of bar i (local frame): upstream corner raised by the tilt. */
function barPoly(i: number): [number, number][] {
  const xc = i * PITCH;
  const h = BAR.top / 2;
  const s = Math.sin(BAR.tilt) * h;
  return [
    [xc - h, -s],
    [xc + h, s],
    [xc + BAR.top * 0.13, BAR.depth],
    [xc - BAR.top * 0.13, BAR.depth],
  ];
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, size: number): void {
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang) * size, y + Math.sin(ang) * size);
  ctx.lineTo(x + Math.cos(ang + 2.5) * size, y + Math.sin(ang + 2.5) * size);
  ctx.lineTo(x + Math.cos(ang - 2.5) * size, y + Math.sin(ang - 2.5) * size);
  ctx.closePath();
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, st: LoupeState): void {
  const w = SIZE;
  const c = w / 2;
  const R = c - 8;
  const T = TXT[getLang()];
  ctx.clearRect(0, 0, w, w);
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, R, 0, Math.PI * 2);
  ctx.fillStyle = '#fbf8f2';
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(40,60,90,0.07)';
  ctx.lineWidth = 1;
  for (let g = 0; g < w; g += 32) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, w);
    ctx.moveTo(0, g);
    ctx.lineTo(w, g);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(ORIGIN.x, ORIGIN.y);
  ctx.rotate(ANGLE);
  const on = st.cap + st.over > 0.02;
  if (on) {
    // water layer over the bars, its surface line, and streaks travelling with the flow
    ctx.beginPath();
    ctx.moveTo(-w, 2);
    for (let x = -w; x <= w; x += 8) ctx.lineTo(x, -layerT(x, st));
    ctx.lineTo(w, 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(47,140,255,0.3)';
    ctx.fill();
    ctx.strokeStyle = '#1f6fd1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = -w; x <= w; x += 8) x === -w ? ctx.moveTo(x, -layerT(x, st)) : ctx.lineTo(x, -layerT(x, st));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(31,111,209,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 20]);
    for (const f of [0.35, 0.7]) {
      ctx.lineDashOffset = -st.t * 150 * (1.3 - f * 0.5);
      ctx.beginPath();
      for (let x = -w; x <= w; x += 8) x === -w ? ctx.moveTo(x, -layerT(x, st) * f) : ctx.lineTo(x, -layerT(x, st) * f);
      ctx.stroke();
    }
  }
  // slivers sheared off the bottom of the layer by each raised upstream edge, down the slot
  if (st.cap > 0.02) {
    ctx.strokeStyle = 'rgba(31,111,209,0.9)';
    ctx.fillStyle = 'rgba(31,111,209,0.9)';
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 8]);
    ctx.lineDashOffset = -st.t * 80;
    for (let i = -3; i <= 4; i++) {
      const up = barPoly(i)[0];
      const prev = barPoly(i - 1)[1];
      if (layerT(up[0], st) < 3) continue;
      const xs = (up[0] + prev[0]) / 2;
      ctx.beginPath();
      ctx.moveTo(xs - PITCH * 0.6, -5);
      ctx.quadraticCurveTo(up[0] - 6, -3, xs + 1, BAR.depth * 0.5);
      ctx.quadraticCurveTo(xs + 4, BAR.depth * 1.15, xs + 10, BAR.depth * 1.55);
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([]);
      arrowHead(ctx, xs + 12, BAR.depth * 1.62, 1.25, 11);
      ctx.restore();
    }
  }
  ctx.setLineDash([]);
  // the wedge wires
  for (let i = -5; i <= 5; i++) {
    const p = barPoly(i);
    const grad = ctx.createLinearGradient(p[0][0], 0, p[1][0], 0);
    grad.addColorStop(0, '#8d969e');
    grad.addColorStop(0.5, '#eef1f3');
    grad.addColorStop(1, '#a7afb6');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#3f4952';
    ctx.lineWidth = 2;
    ctx.beginPath();
    p.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // raised upstream edge of bar 1 highlighted
  const e = barPoly(1)[0];
  ctx.strokeStyle = '#ff8a1f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e[0], e[1], 9, 0, Math.PI * 2);
  ctx.stroke();
  // a leaf riding on top of the layer: too big for the slots, it goes on to the overflow
  if (on) {
    const lx = ((st.t * 70) % (w * 1.3)) - w * 0.65;
    ctx.save();
    ctx.translate(lx, -layerT(lx, st) - 7);
    ctx.rotate(Math.sin(st.t * 3) * 0.12);
    ctx.fillStyle = '#9a6a2a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // 1 mm dimension between bars 0 and 1
  const a = barPoly(0)[1];
  const b = barPoly(1)[0];
  const yd = -layerT(0, st) - 26;
  ctx.strokeStyle = '#1d2b3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a[0], yd);
  ctx.lineTo(b[0], yd);
  for (const x of [a[0], b[0]]) {
    ctx.moveTo(x, yd - 8);
    ctx.lineTo(x, a[1] - 2);
  }
  ctx.stroke();
  ctx.restore();

  // labels in screen space, anchored on features of the rotated drawing
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1d2b3a';
  ctx.font = '600 25px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(T.title.toUpperCase(), c, 70);
  ctx.font = '600 23px "Space Grotesk", system-ui, sans-serif';
  const label = (text: string, x: number, y: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillText(text, x, y);
  };
  const [lx, ly] = toCanvas(-2.3 * PITCH, -layerT(-2.3 * PITCH, st) - 22);
  if (on) label(T.layer, lx, ly, '#1f6fd1');
  const [dx, dy] = toCanvas((a[0] + b[0]) / 2, -layerT(0, st) - 36);
  label(T.slot, dx + 6, dy, '#1d2b3a');
  // raised edge: label under the bars with a short leader to the highlighted corner
  const [ex, ey] = toCanvas(e[0], e[1]);
  const [tx, ty] = [c + 22, c + 192];
  ctx.strokeStyle = '#c4610f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex + 6, ey + 8);
  ctx.lineTo(tx - 10, ty - 22);
  ctx.stroke();
  label(T.tilt, tx, ty, '#c4610f');
  if (st.cap > 0.02) label('↓ ' + T.cap, c - 95, c + 150, '#1f6fd1');
  label(st.over > 0.03 ? T.over + ' ↘' : T.dry, c + 70, 120, st.over > 0.03 ? '#1b8fb0' : '#b3261e');
  ctx.restore();
  // magnifier rim
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#1d2b3a';
  ctx.beginPath();
  ctx.arc(c, c, R - 2, 0, Math.PI * 2);
  ctx.stroke();
}

export interface Loupe {
  group: THREE.Group;
  update(s: SimState, dt: number, view: ViewOpts): void;
}

export function buildLoupe(): Loupe {
  const group = new THREE.Group();
  group.name = 'intake-loupe';
  group.visible = false;
  const st: LoupeState = { t: 0, cap: 1, over: 1 };
  const { texture, redraw } = canvasTexture(SIZE, SIZE, (ctx) => draw(ctx, st));
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 64),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  disc.renderOrder = 30;
  const at = new THREE.Vector3(-0.25, 1.27, 0.42);
  disc.position.copy(at);
  // billboard: face the camera (onBeforeRender runs before the model-view matrix is built)
  disc.onBeforeRender = (_r, _s, camera) => {
    disc.quaternion.copy(camera.quaternion);
    disc.updateMatrixWorld();
  };
  const target = profileAt(sOfK(0.5), 0.004);
  const geo = new LineGeometry();
  geo.setPositions([at.x, at.y, at.z, target.x, target.y, 0.15]);
  const leader = new Line2(
    geo,
    new LineMaterial({
      color: 0x1d2b3a,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
      depthWrite: false,
    }),
  );
  leader.renderOrder = 29;
  const dot = new THREE.Mesh(
    new THREE.RingGeometry(0.012, 0.018, 24),
    new THREE.MeshBasicMaterial({
      color: 0x1d2b3a,
      depthTest: false,
      side: THREE.DoubleSide,
      transparent: true,
      toneMapped: false,
    }),
  );
  dot.position.set(target.x, target.y, 0.15);
  dot.onBeforeRender = (_r, _s, camera) => {
    dot.quaternion.copy(camera.quaternion);
    dot.updateMatrixWorld();
  };
  dot.renderOrder = 29;
  group.add(leader, dot, disc);
  let acc = 0;
  return {
    group,
    update(s, dt, view) {
      group.visible = view.schematic;
      if (!view.schematic) return;
      st.t += dt * Math.max(view.slowMo, 0.12);
      st.cap = s.qCaptured;
      st.over = s.qOverflow;
      acc += dt;
      if (acc > 1 / 30) {
        acc = 0;
        redraw();
      }
    },
  };
}
