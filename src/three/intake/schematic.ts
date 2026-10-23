import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { l, onLangChange, tr, type L } from '@onigam/lab-kit/i18n';
import type { SimState } from '../../sim/types';
import type { ViewOpts } from '@onigam/lab-kit/three';
import { canvasTexture, clamp, roundedPath } from '@onigam/lab-kit/three';
import { BLOCK, bedY, channelZ, DRAIN, OUTLET, PIPE_PTS, pondY, profileAt, S_END, smoothstep, sOfK } from './dims';
import { nappePoints } from './water';

// Schematic overlay: fat dashed lines whose dashes travel with the flows — blue = water
// captured through the screen to the penstock, light cyan = overflow back to the stream,
// brown = debris riding the overflow and sand settling into the trap and purged. Each path
// ends with an arrowhead and the three families carry a small bilingual tag.

const COLORS = { captured: 0x2f8cff, overflow: 0x5fd8f0, debris: 0xa86a2c };
type Kind = keyof typeof COLORS;

interface Flow {
  kind: Kind;
  /** Sand settling into the trap: slow, follows the captured flow. */
  sand: boolean;
  line: Line2;
  mat: LineMaterial;
  head: THREE.Mesh;
}

const v3 = (p: THREE.Vector2, z: number) => new THREE.Vector3(p.x, p.y, z);

/** Points along the hydraulic profile (offset above the surface) between screen params. */
function alongProfile(s0: number, s1: number, off: number, z: number, step = 0.02): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let s = s0; s < s1; s += step) out.push(v3(profileAt(s, off), z));
  out.push(v3(profileAt(s1, off), z));
  return out;
}

function paths(): { kind: Kind; pts: THREE.Vector3[]; sand?: boolean }[] {
  const yP = pondY(1);
  const zc = 0.1;
  const captured = [
    new THREE.Vector3(-0.8, yP + 0.03, zc),
    new THREE.Vector3(-0.42, yP + 0.03, zc),
    ...alongProfile(-0.06, sOfK(0.32), 0.02, zc),
    v3(profileAt(sOfK(0.36), -0.04), zc),
    new THREE.Vector3(0.0, 0.36, zc),
    new THREE.Vector3(OUTLET.x - 0.04, OUTLET.y + 0.01, -0.02),
    new THREE.Vector3(OUTLET.x, OUTLET.y, -0.16),
    new THREE.Vector3(OUTLET.x, OUTLET.y, -0.45),
    ...PIPE_PTS.slice(1).map((p) => p.clone().setY(p.y + 0.002)),
  ];
  const drip = (k: number, z: number) => [
    v3(profileAt(sOfK(k), 0.02), z),
    v3(profileAt(sOfK(k), -0.03), z),
    new THREE.Vector3(profileAt(sOfK(k), 0).x + 0.03, 0.4, z),
  ];
  const zo = -0.12;
  const overflow = [
    new THREE.Vector3(-0.8, yP + 0.045, zo),
    new THREE.Vector3(-0.42, yP + 0.045, zo),
    ...alongProfile(-0.06, S_END, 0.035, zo),
    ...nappePoints()
      .filter((p) => p.x > profileAt(S_END).x)
      .map((p) =>
        p
          .clone()
          .setZ(zo)
          .add(new THREE.Vector3(0.02, 0.02, 0)),
      ),
  ];
  const last = overflow[overflow.length - 1];
  for (let x = last.x + 0.12; x <= BLOCK.x1; x += 0.12)
    overflow.push(new THREE.Vector3(x, bedY(x) + 0.06, channelZ(x) + zo * 0.5));
  const zd = 0.2;
  const debris = [
    ...alongProfile(sOfK(0.1), S_END, 0.055, zd),
    ...nappePoints()
      .filter((p) => p.x > profileAt(S_END).x)
      .map((p) =>
        p
          .clone()
          .setZ(zd)
          .add(new THREE.Vector3(0.04, 0.035, 0)),
      ),
    new THREE.Vector3(0.62, bedY(0.62) + 0.07, zd),
    new THREE.Vector3(0.9, bedY(0.9) + 0.07, zd - 0.05),
  ];
  const sand = [
    new THREE.Vector3(-0.1, 0.32, 0.18),
    new THREE.Vector3(0.06, 0.315, 0.18),
    new THREE.Vector3(0.12, 0.25, 0.18),
    new THREE.Vector3(DRAIN.x, DRAIN.y, 0.25),
    new THREE.Vector3(DRAIN.x, DRAIN.y, DRAIN.z + 0.13),
    new THREE.Vector3(0.33, 0.22, DRAIN.z + 0.13),
  ];
  return [
    { kind: 'captured', pts: captured },
    { kind: 'captured', pts: drip(0.12, -0.06) },
    { kind: 'captured', pts: drip(0.62, 0.0) },
    { kind: 'overflow', pts: overflow },
    { kind: 'debris', pts: debris },
    { kind: 'debris', pts: sand, sand: true },
  ];
}

function flowLine(kind: Kind, pts: THREE.Vector3[], sand = false): Flow {
  const path = roundedPath(pts, 0.03);
  const n = Math.max(8, Math.ceil(path.getLength() / 0.01));
  const sampled = path.getSpacedPoints(n);
  const geo = new LineGeometry();
  geo.setPositions(sampled.flatMap((p) => [p.x, p.y, p.z]));
  const mat = new LineMaterial({
    color: COLORS[kind],
    linewidth: kind === 'captured' && pts.length > 4 ? 5 : 4,
    dashed: true,
    dashSize: 0.035,
    gapSize: 0.022,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const line = new Line2(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 20;
  // arrowhead on the last segment
  const a = sampled[sampled.length - 2];
  const b = sampled[sampled.length - 1];
  const cone = new THREE.ConeGeometry(0.014, 0.04, 14);
  cone.translate(0, 0.02, 0);
  const head = new THREE.Mesh(
    cone,
    new THREE.MeshBasicMaterial({
      color: COLORS[kind],
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  head.position.copy(b);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  head.renderOrder = 21;
  return { kind, sand, line, mat, head };
}

/** Pill-shaped bilingual tag (canvas sprite) redrawn when the language changes. */
function tag(label: L, color: number, at: THREE.Vector3): { sprite: THREE.Sprite; redraw: () => void } {
  const hex = `#${color.toString(16).padStart(6, '0')}`;
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace';
    const text = tr(label).toUpperCase();
    const tw = Math.min(w - 70, ctx.measureText(text).width);
    const bw = tw + 70;
    const x0 = (w - bw) / 2;
    ctx.fillStyle = 'rgba(251,248,242,0.95)';
    ctx.strokeStyle = hex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x0 + 2, 6, bw - 4, h - 12, (h - 12) / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.arc(x0 + 30, h / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d2b3a';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x0 + 50, h / 2 + 1, tw);
  };
  const { texture, redraw } = canvasTexture(640, 64, draw);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    }),
  );
  sprite.scale.set(0.56, 0.056, 1);
  sprite.position.copy(at);
  sprite.renderOrder = 22;
  return { sprite, redraw: () => redraw() };
}

export interface Schematic {
  group: THREE.Group;
  update(s: SimState, dt: number, view: ViewOpts): void;
}

export function buildSchematic(): Schematic {
  const group = new THREE.Group();
  group.name = 'intake-schematic';
  group.visible = false;
  const flows = paths().map(({ kind, pts, sand }) => flowLine(kind, pts, sand));
  for (const f of flows) group.add(f.line, f.head);
  const tags = [
    tag(l('Eau captée → conduite', 'Captured water → penstock'), COLORS.captured, new THREE.Vector3(1.0, 0.43, -0.64)),
    tag(l('Surverse → ruisseau', 'Overflow → stream'), COLORS.overflow, new THREE.Vector3(0.95, 0.34, 0.02)),
    tag(l('Débris & sable', 'Debris & sand'), COLORS.debris, new THREE.Vector3(0.5, 0.3, 0.58)),
  ];
  for (const t of tags) group.add(t.sprite);
  onLangChange(() => tags.forEach((t) => t.redraw()));
  // the fonts may arrive after the first draw
  document.fonts?.ready.then(() => tags.forEach((t) => t.redraw()));

  return {
    group,
    update(s, dt, view) {
      group.visible = view.schematic;
      if (!view.schematic) return;
      const k = dt * Math.max(view.slowMo, 0.05);
      const rate: Record<Kind, number> = {
        captured: s.qCaptured,
        overflow: s.qOverflow,
        debris: s.qOverflow > 0.05 ? 0.5 + s.screenClog * 2 : 0,
      };
      for (const f of flows) {
        const q = f.sand ? s.qCaptured * 0.25 : rate[f.kind];
        const on = q > 0.02;
        f.mat.dashOffset -= on ? k * (0.12 + 0.25 * clamp(q / 3, 0, 1)) : 0;
        f.mat.opacity = on ? 0.95 : 0.3;
        f.mat.linewidth = (f.kind === 'captured' ? 3 : 2.5) + 3 * smoothstep(0, 4, q);
        (f.head.material as THREE.MeshBasicMaterial).opacity = on ? 1 : 0.3;
      }
    },
  };
}
