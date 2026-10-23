import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { damp, group } from '@onigam/lab-kit/three';
import {
  anchor,
  bake,
  box,
  cyl,
  type Device,
  font,
  gland,
  labelMaterial,
  type Palette,
  plane,
  rbox,
  sticker,
} from './common';
import { POS, SIZE } from './layout';

// Wall enclosures with hinged transparent doors: the DC safety box where the turbine
// cable arrives (rotary DC isolator, fuses, surge arrester) and the AC distribution board
// (RCD + breakers). In cut-away mode the doors swing open.

type V3 = [number, number, number];

/** Enclosure body + mounting plate + hinged door (returned pivot is animated). */
function enclosure(
  g: THREE.Group,
  pal: Palette,
  [W, H, D]: V3,
  doorMat: THREE.Material,
  doorLabel: string,
): THREE.Group {
  rbox(g, pal.enclosure, [W, H, 0.012], [0, 0, 0.006], 0.006); // back
  const t = 0.008;
  // four walls (open front so the interior is visible through the door)
  box(g, pal.enclosure, [W, t, D - 0.014], [0, H / 2 - t / 2, (D - 0.014) / 2]);
  box(g, pal.enclosure, [W, t, D - 0.014], [0, -H / 2 + t / 2, (D - 0.014) / 2]);
  box(g, pal.enclosure, [t, H, D - 0.014], [-W / 2 + t / 2, 0, (D - 0.014) / 2]);
  box(g, pal.enclosure, [t, H, D - 0.014], [W / 2 - t / 2, 0, (D - 0.014) / 2]);
  box(g, pal.darkGrey, [W - 2 * t, H - 2 * t, 0.003], [0, 0, 0.0135]); // mounting plate

  const pivot = new THREE.Group();
  pivot.position.set(-W / 2 + 0.004, 0, D - 0.007);
  pivot.userData.keep = true;
  g.add(pivot);
  const dw = W - 0.006;
  rbox(pivot, doorMat, [dw, H - 0.006, 0.01], [dw / 2, 0, 0], 0.005);
  // opaque frame strip with a printed circuit label along the bottom of the door
  const lbl = labelMaterial(256, 40, (ctx, w, h) => {
    ctx.fillStyle = '#ecece8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#333';
    ctx.font = font(20, 700);
    ctx.textAlign = 'center';
    ctx.fillText(doorLabel, w / 2, 28);
  });
  box(pivot, pal.enclosure, [dw, 0.024, 0.012], [dw / 2, -H / 2 + 0.016, 0]);
  plane(pivot, lbl, dw - 0.02, 0.018, [dw / 2, -H / 2 + 0.016, 0.0065]);
  box(pivot, pal.enclosure, [0.012, 0.04, 0.016], [dw - 0.008, 0, 0.002]); // latch
  return pivot;
}

/** DIN rail at height y. */
function dinRail(g: THREE.Group, pal: Palette, w: number, y: number) {
  box(g, pal.zinc, [w, 0.035, 0.0075], [0, y, 0.019]);
}

function mandatorySticker(): THREE.MeshStandardMaterial {
  return labelMaterial(
    96,
    96,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1f5fbf';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = font(64, 900);
      ctx.textAlign = 'center';
      ctx.fillText('!', w / 2, 72);
    },
    { transparent: true },
  );
}

const doorTarget = (cutaway: boolean) => (cutaway ? -1.85 : 0);

export function buildDcProtect(pal: Palette): Device {
  const [W, H, D] = SIZE.dcProtect;
  const g = group('dc-protect', POS.dcProtect);
  const door = enclosure(g, pal, [W, H, D], pal.clear, 'TURBINE  DC 48 V');
  const yr = 0.01;
  dinRail(g, pal, W - 0.03, yr);
  // rotary DC isolator (4 modules) with its red-on-yellow handle
  box(g, pal.dinGrey, [0.072, 0.09, 0.062], [-0.045, yr, 0.046]);
  box(g, pal.yellow, [0.05, 0.05, 0.004], [-0.045, yr, D - 0.022]);
  cyl(g, pal.plastic, 0.014, 0.024, [-0.045, yr, D - 0.032], 'z', 18);
  box(g, pal.red, [0.012, 0.046, 0.014], [-0.045, yr, D - 0.014]);
  // two DC fuse holders (10×38) and a surge arrester with its green status window
  for (const x of [0.012, 0.031]) {
    box(g, pal.dinGrey, [0.018, 0.085, 0.058], [x, yr, 0.044]);
    box(g, pal.plastic, [0.012, 0.03, 0.006], [x, yr + 0.012, 0.076]);
  }
  box(g, pal.dinGrey, [0.036, 0.085, 0.058], [0.062, yr, 0.044]);
  box(g, pal.cableYG, [0.012, 0.008, 0.002], [0.062, yr + 0.02, 0.0735]);
  // short internal links (red/black) between isolator and fuses
  box(g, pal.cableRed, [0.06, 0.005, 0.005], [-0.005, yr - 0.052, 0.04]);
  box(g, pal.cableBlack, [0.06, 0.005, 0.005], [0.01, yr - 0.06, 0.04]);
  // stickers on the door
  sticker(door, pal, 0.034, [0.03, H / 2 - 0.03, 0.0062]);
  plane(door, mandatorySticker(), 0.022, 0.022, [0.07, H / 2 - 0.03, 0.0062]);
  // glands: turbine conduit on top, outputs below
  gland(g, pal.glandGrey, 0.013, [0, H / 2, 0.06], 'y');
  for (const x of [-0.05, 0, 0.05]) gland(g, pal.glandWhite, 0.008, [x, -H / 2, 0.06], '-y');
  bake(g);

  return {
    id: 'dc-protect',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.03, D]),
    explode: new THREE.Vector3(-0.05, 0.08, 0.45),
    label: l('Boîtier de sécurité DC (arrivée turbine)', 'DC safety box (turbine input)'),
    update: (_s, dt, v) => {
      door.rotation.y = damp(door.rotation.y, doorTarget(v.cutaway), 4, dt);
    },
  };
}

export function buildAcPanel(pal: Palette): Device {
  const [W, H, D] = SIZE.acPanel;
  const g = group('ac-panel', POS.acPanel);
  const door = enclosure(g, pal, [W, H, D], pal.smoked, 'AC 230 V');
  const yr = 0.015;
  dinRail(g, pal, W - 0.03, yr);
  // RCD (2 modules, test button) + 4 MCBs, all ON (toggles up)
  const mods: { x: number; w: number; rcd?: boolean }[] = [{ x: -0.07, w: 0.036, rcd: true }];
  for (let i = 0; i < 4; i++) mods.push({ x: -0.034 + i * 0.0185, w: 0.0175 });
  for (const m of mods) {
    box(g, pal.white, [m.w, 0.085, 0.06], [m.x, yr, 0.044]);
    box(g, pal.white, [m.w - 0.002, 0.045, 0.012], [m.x, yr, 0.08]);
    box(g, pal.plastic, [Math.min(0.012, m.w - 0.006), 0.012, 0.012], [m.x, yr + 0.01, 0.091]);
    if (m.rcd) box(g, pal.yellow, [0.007, 0.007, 0.004], [m.x + 0.01, yr - 0.016, 0.088]);
    else box(g, pal.cableBlue, [0.01, 0.004, 0.001], [m.x, yr - 0.03, 0.0865]);
  }
  // blanking strip for the unused width, neutral/earth terminal bars below
  box(g, pal.white, [0.072, 0.045, 0.012], [0.068, yr, 0.08]);
  box(g, pal.cableBlue, [0.08, 0.012, 0.012], [-0.04, -0.085, 0.03]);
  box(g, pal.cableYG, [0.08, 0.012, 0.012], [0.05, -0.085, 0.03]);
  sticker(door, pal, 0.03, [0.03, H / 2 - 0.028, 0.0062]);
  for (const x of [-0.08, -0.04, 0, 0.04, 0.08]) gland(g, pal.glandWhite, 0.007, [x, -H / 2, 0.055], '-y');
  for (const y of [0.05, -0.03]) gland(g, pal.glandGrey, 0.01, [-W / 2, y, 0.055], '-x');
  bake(g);

  return {
    id: 'ac-panel',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.03, D]),
    explode: new THREE.Vector3(-0.05, 0, 0.45),
    label: l('Tableau AC (différentiel + disjoncteurs)', 'AC board (RCD + breakers)'),
    update: (_s, dt, v) => {
      door.rotation.y = damp(door.rotation.y, doorTarget(v.cutaway), 4, dt);
    },
  };
}
