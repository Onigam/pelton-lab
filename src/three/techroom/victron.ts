import * as THREE from 'three';
import { l } from '../../i18n';
import { canvasTexture, group } from '../util';
import {
  anchor,
  bake,
  blink,
  box,
  cyl,
  type Device,
  font,
  gland,
  labelMaterial,
  led,
  ledMaterial,
  type Palette,
  partVisible,
  plane,
  rbox,
  setLed,
  sticker,
  throttle,
} from './common';
import { drawMultiLcd } from './displays';
import { POS, PV_ISO_OFFSET, SIZE } from './layout';

// Victron-style blue devices: MultiPlus-II GX inverter/charger, SmartSolar MPPT with its
// PV string isolator, and a pair of Lynx-like DC distributor modules acting as busbars.
// Plain model text only, no brand logos.

// ---- MultiPlus-II 48/3000 GX ---------------------------------------------------------

function inverterDecal(): THREE.MeshStandardMaterial {
  return labelMaterial(
    512,
    832,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const ys = h * 0.55;
      ctx.fillStyle = '#d8343d';
      ctx.fillRect(0, ys, w, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = font(34, 700);
      ctx.fillText('MultiPlus-II GX', 22, ys + 62);
      ctx.font = font(19, 500);
      ctx.fillText('48 | 3000 | 35-32   230 V', 22, ys + 92);
      ctx.font = font(13, 500);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Inverter / charger · 48 V DC · 3000 VA', 22, ys + 116);
      // certification icons and a QR sticker on the right
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) ctx.strokeRect(300 + i * 30, ys + 140, 22, 22);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(400, ys + 40, 52, 52);
      ctx.fillStyle = '#222';
      for (let i = 0; i < 40; i++) ctx.fillRect(404 + ((i * 7) % 44), ys + 44 + ((i * 13) % 44), 5, 5);
      // fine print at the bottom
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 4; i++) ctx.fillRect(300, h - 70 + i * 10, 180, 3);
    },
    { transparent: true, roughness: 0.4 },
  );
}

function ventDecal(): THREE.MeshStandardMaterial {
  return labelMaterial(
    256,
    96,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      for (let i = 0; i < 22; i++) ctx.fillRect(12 + i * 10.6, h * 0.62, 5, h * 0.3);
    },
    { transparent: true },
  );
}

export function buildInverter(pal: Palette): Device {
  const [W, H, D] = SIZE.inverter;
  const g = group('inverter', POS.inverter);
  box(g, pal.victronDark, [W - 0.012, H - 0.012, 0.012], [0, 0, 0.006]); // wall bracket
  const blueH = 0.44;
  const yBlue = H / 2 - blueH / 2;
  rbox(g, pal.victron, [W, blueH, D - 0.012], [0, yBlue, 0.012 + (D - 0.012) / 2], 0.01);
  const yBot = -H / 2 + (H - blueH) / 2;
  rbox(g, pal.victronDark, [W - 0.004, H - blueH, D - 0.016], [0, yBot, 0.012 + (D - 0.016) / 2], 0.008);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1])
      rbox(
        g,
        pal.plastic,
        [0.026, 0.026, D - 0.006],
        [sx * (W / 2 - 0.011), sy * (H / 2 - 0.011), 0.006 + (D - 0.006) / 2],
        0.005,
      );
  }
  plane(g, inverterDecal(), W - 0.012, blueH - 0.012, [0, yBlue, D + 0.0006]);
  plane(g, ventDecal(), W - 0.03, H - blueH - 0.02, [0, yBot, D - 0.0034]);

  // display window: bezel, LCD, push button, status LEDs
  const dy = -0.075;
  rbox(g, pal.plastic, [0.095, 0.036, 0.004], [-0.048, dy, D + 0.002], 0.004);
  const lcd = canvasTexture(256, 80, (ctx, w, h) => {
    ctx.fillStyle = '#2b49c8';
    ctx.fillRect(0, 0, w, h);
  });
  const lcdMat = new THREE.MeshStandardMaterial({
    map: lcd.texture,
    emissive: 0xffffff,
    emissiveMap: lcd.texture,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });
  plane(g, lcdMat, 0.052, 0.0165, [-0.062, dy, D + 0.0042]);
  cyl(g, pal.charcoal, 0.0055, 0.004, [-0.019, dy, D + 0.005], 'z', 16);
  const onMat = ledMaterial(0x39e36b);
  const almMat = ledMaterial(0xff3020);
  led(g, onMat, 0.0018, [-0.008, dy + 0.007, D + 0.0045]);
  led(g, almMat, 0.0018, [-0.008, dy - 0.007, D + 0.0045]);

  // bottom cable glands: DC (big black), AC (grey), comms
  const yb = -H / 2;
  for (const x of [-0.06, -0.03]) gland(g, pal.plastic, 0.011, [x, yb, 0.07], '-y');
  for (const x of [0.06, 0.09]) gland(g, pal.glandGrey, 0.008, [x, yb, 0.07], '-y');
  gland(g, pal.glandGrey, 0.005, [-0.1, yb, 0.07], '-y');
  bake(g);

  const redraw = throttle(0.25);
  return {
    id: 'inverter',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.02, D]),
    explode: new THREE.Vector3(0.15, 0, 0.5),
    label: l('Onduleur-chargeur 48 V / 3 kVA', 'Inverter/charger 48 V / 3 kVA'),
    update: (s, _dt, v) => {
      if (redraw(v.time)) lcd.redraw((ctx, w, h) => drawMultiLcd(ctx, w, h, s));
      // steady when feeding loads, slow blink in "search" (idle) mode
      setLed(onMat, s.pLoad > 1 ? true : blink(v.time, 0.5, 0.1), 2.2);
      const alarm = s.bmsOpen || s.alarms.includes('lowSoc');
      setLed(almMat, alarm && blink(v.time, 2), 2.6);
    },
  };
}

// ---- SmartSolar MPPT 250/100 VE.Can + PV string isolator ---------------------------------------

function mpptDecal(): THREE.MeshStandardMaterial {
  return labelMaterial(
    512,
    360,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = font(30, 700);
      ctx.fillText('SmartSolar', 26, 90);
      ctx.font = font(22, 500);
      ctx.fillText('charge controller', 26, 120);
      ctx.font = font(26, 700);
      ctx.fillText('MPPT 250 | 100', 26, 162);
      ctx.fillStyle = '#e8562a';
      ctx.fillRect(26, 178, 300, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = font(15, 500);
      ctx.fillText('PV ≤ 150 V   ·   48 V   ·   45 A', 26, 220);
      ctx.font = font(14, 600);
      ['Bulk', 'Abs', 'Float'].forEach((t, i) => ctx.fillText(t, 360, 250 + i * 30));
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(26, 40, 46, 22);
      ctx.strokeRect(80, 40, 22, 22);
    },
    { transparent: true, roughness: 0.4 },
  );
}

function pvIsolator(g: THREE.Group, pal: Palette) {
  const [W, H, D] = SIZE.pvIso;
  const iso = new THREE.Group();
  iso.position.set(...PV_ISO_OFFSET);
  g.add(iso);
  rbox(iso, pal.enclosure, [W, H, D - 0.012], [0, 0, (D - 0.012) / 2], 0.008);
  // DIN rail with the rotary PV isolator and two string fuse holders behind the door
  box(iso, pal.zinc, [W - 0.03, 0.035, 0.006], [0, -0.01, D - 0.05]);
  box(iso, pal.plastic, [0.054, 0.08, 0.03], [-0.025, -0.01, D - 0.035]);
  cyl(iso, pal.red, 0.012, 0.012, [-0.025, -0.01, D - 0.014], 'z', 16);
  box(iso, pal.yellow, [0.03, 0.03, 0.002], [-0.025, -0.01, D - 0.02]);
  for (const x of [0.025, 0.045]) box(iso, pal.dinGrey, [0.018, 0.07, 0.03], [x, -0.01, D - 0.035]);
  rbox(iso, pal.smoked, [W - 0.016, H - 0.03, 0.01], [0, 0.005, D - 0.005], 0.004);
  box(iso, pal.enclosure, [W - 0.016, 0.022, 0.012], [0, -H / 2 + 0.013, D - 0.005]);
  sticker(iso, pal, 0.028, [-0.03, H / 2 - 0.035, D + 0.001]);
  sticker(iso, pal, 0.028, [0.03, H / 2 - 0.035, D + 0.001]);
  for (const x of [-0.03, 0.03]) {
    gland(iso, pal.glandWhite, 0.007, [x, H / 2, 0.05], 'y');
    gland(iso, pal.glandWhite, 0.007, [x, -H / 2, 0.05], '-y');
  }
}

export function buildMppt(pal: Palette): Device {
  const [W, H, D] = SIZE.mppt;
  const g = group('mppt-pv', POS.mppt);
  // anodised heatsink: base plate + vertical fins exposed on both sides
  box(g, pal.charcoal, [W - 0.01, H, 0.03], [0, 0, 0.015]);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++)
      box(g, pal.charcoal, [0.0022, H - 0.004, 0.062], [s * (W / 2 - 0.002 - k * 0.0055), 0, 0.031]);
  }
  rbox(g, pal.victron, [W - 0.044, H - 0.006, D - 0.028], [0, 0, 0.028 + (D - 0.028) / 2], 0.012);
  plane(g, mpptDecal(), W - 0.06, H - 0.03, [0, 0.006, D + 0.0006]);
  // terminal cover and VE.Direct port at the bottom
  box(g, pal.plastic, [0.17, 0.016, 0.05], [0, -H / 2 + 0.002, 0.055]);
  box(g, pal.plastic, [0.016, 0.006, 0.012], [-0.105, -H / 2 - 0.001, 0.05]); // VE.Direct
  for (const x of [-0.07, -0.035, 0.035, 0.07]) gland(g, pal.plastic, 0.0065, [x, -H / 2 - 0.006, 0.05], '-y');
  const leds = [0, 1, 2].map(() => ledMaterial(0x2a8cff));
  leds.forEach((m, i) => led(g, m, 0.0022, [0.068, -0.024 - i * 0.0145, D + 0.0012]));
  pvIsolator(g, pal);
  bake(g);

  return {
    id: 'mppt-pv',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.02, D]),
    explode: new THREE.Vector3(0, 0.05, 0.45),
    label: l('Régulateur solaire MPPT + sectionneur PV', 'Solar MPPT controller + PV isolator'),
    update: (s, _dt, v) => {
      const on = s.pPv > 5;
      const stage = s.soc < 0.85 ? 0 : s.soc < 0.98 ? 1 : 2;
      leds.forEach((m, i) =>
        setLed(m, on && i === stage ? (stage === 0 ? 0.6 + 0.4 * Math.min(1, s.pPv / 3000) : 1) : 0, 2.4),
      );
      if (!on) setLed(leds[0], blink(v.time, 0.25, 0.05) ? 0.4 : 0, 2.4);
    },
  };
}

// ---- Lynx-like DC distributor pair (busbars) ------------------------------------------

function lynxDecal(vents: boolean): THREE.MeshStandardMaterial {
  return labelMaterial(
    512,
    320,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (vents) {
        ctx.fillStyle = 'rgba(10,25,45,0.85)';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) ctx.fillRect(28 + c * 26, 26 + r * 22, 16, 12);
        for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++) ctx.fillRect(28 + c * 26, h - 70 + r * 22, 16, 12);
      }
      ctx.fillStyle = '#d8343d';
      ctx.fillRect(28, 112, w - 56, 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = font(26, 700);
      ctx.fillText(vents ? 'DC Power In' : 'DC Distributor', 28, 160);
      ctx.font = font(18, 500);
      ctx.fillText('48 V · 1000 A busbar', 28, 188);
    },
    { transparent: true, roughness: 0.4 },
  );
}

export function buildBusbar(pal: Palette): Device {
  const [W, H, D] = SIZE.lynx;
  const g = group('busbar', POS.busbar);
  const covers: THREE.Mesh[] = [];
  const leds: THREE.MeshStandardMaterial[] = [];
  for (const [i, x] of [-W / 2, W / 2].entries()) {
    box(g, pal.victronDark, [W - 0.002, H, 0.02], [x, 0, 0.01]);
    const cover = rbox(g, pal.victron, [W - 0.004, H, D - 0.02], [x, 0, 0.02 + (D - 0.02) / 2], 0.01);
    cover.userData.keep = true;
    const decal = plane(cover, lynxDecal(i === 0), W - 0.02, H - 0.012, [0, 0, (D - 0.02) / 2 + 0.0006]);
    decal.userData.keep = true;
    covers.push(cover);
    const m = ledMaterial(0x3be36e);
    leds.push(m);
    led(cover, m, 0.0022, [W / 2 - 0.02, H / 2 - 0.018, (D - 0.02) / 2 + 0.0012]);
  }
  // the copper bars themselves (seen in cut-away mode) on insulators
  for (const [y, mat] of [
    [0.028, pal.copper],
    [-0.028, pal.copper],
  ] as [number, THREE.Material][]) {
    box(g, mat, [2 * W - 0.02, 0.022, 0.007], [0, y, 0.04]);
    for (const x of [-W + 0.03, 0, W - 0.03]) cyl(g, pal.plastic, 0.007, 0.018, [x, y, 0.028], 'z', 10);
  }
  // studs with ring lugs, top and bottom
  const studs = [-0.155, -0.125, -0.065, -0.035, 0.035, 0.065];
  const bottom = [-0.155, -0.125, 0.125, 0.155];
  for (const [xs, sgn] of [
    [studs, 1],
    [bottom, -1],
  ] as [number[], number][]) {
    for (const x of xs) {
      cyl(g, pal.zinc, 0.0045, 0.02, [x, sgn * (H / 2 + 0.006), 0.05], 'y', 8);
      box(g, pal.copper, [0.012, 0.016, 0.003], [x, sgn * (H / 2 + 0.008), 0.05]);
    }
  }
  bake(g);

  return {
    id: 'busbar',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.03, D]),
    explode: new THREE.Vector3(0, -0.05, 0.42),
    label: l('Jeu de barres DC 48 V', '48 V DC busbars'),
    update: (s, _dt, v, reg) => {
      const show = !v.cutaway && partVisible(reg, 'busbar');
      for (const c of covers) c.visible = show;
      for (const m of leds) setLed(m, s.vBatt > 40, 2);
    },
  };
}
