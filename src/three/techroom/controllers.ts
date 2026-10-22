import * as THREE from 'three';
import { l } from '../../i18n';
import { canvasTexture, clamp, group } from '../util';
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
  plane,
  rbox,
  setLed,
  throttle,
} from './common';
import { drawTriStar } from './displays';
import { POS, SIZE } from './layout';

// Hydro-side controllers: a TriStar MPPT 45 class charge controller (used in constant
// input-voltage mode so the turbine runs at a fixed speed) with its small backlit meter,
// and a generic DIN-box diversion (dump-load) controller with a duty-cycle bargraph.

function tristarDecal(): THREE.MeshStandardMaterial {
  return labelMaterial(
    256,
    384,
    (ctx, w) => {
      ctx.clearRect(0, 0, w, 384);
      ctx.fillStyle = '#e9e9e9';
      ctx.font = font(30, 800);
      ctx.fillText('TriStar', 18, 250);
      ctx.font = font(24, 600);
      ctx.fillText('MPPT 45', 18, 282);
      ctx.fillStyle = '#e0a21b';
      ctx.fillRect(18, 296, 120, 6);
      ctx.fillStyle = 'rgba(233,233,233,0.7)';
      ctx.font = font(15, 500);
      ctx.fillText('150 Voc · 45 A · 12-48 V', 18, 326);
      ctx.font = font(13, 600);
      ctx.textAlign = 'center';
      ['CHG', 'MPP', 'ERR'].forEach((t, i) => ctx.fillText(t, 68 + i * 62, 80));
    },
    { transparent: true },
  );
}

export function buildHydroCtrl(pal: Palette): Device {
  const [W, H, D] = SIZE.hydroCtrl;
  const g = group('hydro-ctrl', POS.hydroCtrl);
  // black anodised heatsink: back plate + deep vertical fins on both sides
  box(g, pal.charcoal, [W, H, 0.012], [0, 0, 0.006]);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++)
      box(g, pal.charcoal, [0.0024, H - 0.006, 0.1], [s * (W / 2 - 0.0012 - k * 0.0062), 0, 0.062]);
  }
  const cw = W - 0.056;
  rbox(g, pal.plastic, [cw, H - 0.008, D - 0.012], [0, 0, 0.012 + (D - 0.012) / 2], 0.008);
  plane(g, tristarDecal(), cw - 0.006, (cw - 0.006) * 1.5, [0, -0.02, D + 0.0006]);

  // meter: bezel, backlit LCD, 4 keys, 3 status LEDs
  const ym = 0.085;
  rbox(g, pal.darkGrey, [cw - 0.008, 0.06, 0.006], [0, ym, D + 0.003], 0.004);
  const lcd = canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#a9c46a';
    ctx.fillRect(0, 0, w, h);
  });
  const lcdMat = new THREE.MeshStandardMaterial({
    map: lcd.texture,
    emissive: 0xffffff,
    emissiveMap: lcd.texture,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  });
  plane(g, lcdMat, cw - 0.018, (cw - 0.018) / 2, [0, ym + 0.006, D + 0.0062]);
  for (let i = 0; i < 4; i++)
    cyl(g, pal.dinGrey, 0.0026, 0.003, [-0.0165 + i * 0.011, ym - 0.022, D + 0.0065], 'z', 10);
  const leds = [0x37e36a, 0xffc21a, 0xff2a1c].map((c) => ledMaterial(c));
  leds.forEach((m, i) => led(g, m, 0.0022, [-0.016 + i * 0.0165, 0.02, D + 0.0012]));
  // knock-outs with cable glands at the bottom
  for (const x of [-0.035, -0.012, 0.012, 0.035]) gland(g, pal.plastic, 0.006, [x, -H / 2, 0.07], '-y');
  bake(g);

  const redraw = throttle(0.25);
  return {
    id: 'hydro-ctrl',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.02, D]),
    explode: new THREE.Vector3(0, 0.06, 0.5),
    label: l("Contrôleur turbine (tension d'entrée fixe)", 'Turbine controller (fixed input voltage)'),
    update: (s, _dt, v) => {
      if (redraw(v.time)) lcd.redraw((ctx, w, h) => drawTriStar(ctx, w, h, s));
      const active = s.ctrlMode !== 'direct';
      setLed(leds[0], active && s.iGen > 0.2 ? true : blink(v.time, 0.3, 0.1), 2.2);
      setLed(leds[1], s.ctrlMode === 'mppt' && blink(v.time, 1.5), 2.2);
      setLed(leds[2], (s.overspeed || s.alarms.includes('overspeed')) && blink(v.time, 3), 2.6);
    },
  };
}

// ---- diversion (dump-load) controller ---------------------------------------------------

const BAR_N = 10;

function diversionDecal(): THREE.MeshStandardMaterial {
  return labelMaterial(
    320,
    400,
    (ctx, w) => {
      ctx.clearRect(0, 0, w, 400);
      ctx.fillStyle = '#e9ebec';
      ctx.fillRect(14, 14, w - 28, 92);
      ctx.fillStyle = '#20262c';
      ctx.font = font(22, 800);
      ctx.fillText('DIVERSION', 28, 50);
      ctx.font = font(17, 600);
      ctx.fillText('load controller', 28, 74);
      ctx.font = font(14, 500);
      ctx.fillText('48 V · 2 kW · PWM', 28, 96);
      ctx.fillStyle = '#2b3036';
      ctx.font = font(13, 700);
      ['BUS', 'DUMP', 'FAULT'].forEach((t, i) => ctx.fillText(t, 36 + i * 88, 150));
      ctx.fillText('DUTY', 28, 212);
      ctx.fillText('0', 34, 262);
      ctx.fillText('100 %', w - 76, 262);
      ctx.fillText('SET 53.5 V', 112, 342);
    },
    { transparent: true },
  );
}

export function buildDiversion(pal: Palette): Device {
  const [W, H, D] = SIZE.diversion;
  const g = group('diversion', POS.diversion);
  rbox(g, pal.dinGrey, [W, H, D], [0, 0, D / 2], 0.012);
  plane(g, diversionDecal(), W - 0.012, (W - 0.012) * 1.25, [0, 0, D + 0.0006]);
  // bargraph: 10 rectangular LEDs green → amber → red, on a dark window
  box(g, pal.plastic, [W - 0.03, 0.016, 0.002], [0, -0.02, D + 0.001]);
  const bar: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < BAR_N; i++) {
    const c = i < 6 ? 0x3be36e : i < 8 ? 0xffb81c : 0xff3324;
    const m = ledMaterial(c);
    bar.push(m);
    const x = -0.0585 + i * 0.013;
    const b = box(g, m, [0.009, 0.008, 0.002], [x, -0.02, D + 0.0022]);
    b.castShadow = false;
  }
  const status = [0x3be36e, 0xffb81c, 0xff3324].map((c) => ledMaterial(c));
  status.forEach((m, i) => led(g, m, 0.0028, [-0.051 + i * 0.044, 0.03, D + 0.0015]));
  // set-point knob
  cyl(g, pal.plastic, 0.011, 0.012, [-0.04, -0.064, D + 0.006], 'z', 20);
  box(g, pal.white, [0.0018, 0.008, 0.001], [-0.04, -0.058, D + 0.0125]);
  for (const x of [-0.04, -0.015]) gland(g, pal.glandWhite, 0.006, [x, -H / 2, 0.045], '-y');
  for (const y of [-0.05, -0.075]) gland(g, pal.glandWhite, 0.006, [W / 2, y, 0.045], 'x');
  bake(g);

  return {
    id: 'diversion',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.02, D]),
    explode: new THREE.Vector3(0, 0.06, 0.45),
    label: l('Contrôleur de délestage (dérivation)', 'Diversion (dump-load) controller'),
    update: (s, _dt, v) => {
      const n = clamp(s.pDump / 2000, 0, 1) * BAR_N;
      bar.forEach((m, i) => setLed(m, clamp(n - i, 0, 1), 2.4));
      setLed(status[0], s.vBatt > 40, 2);
      setLed(status[1], s.pDump > 5 && (s.pDump > 60 || blink(v.time, 4)), 2.4);
      setLed(status[2], !s.dumpEnabled && s.bmsOpen && blink(v.time, 2), 2.6);
    },
  };
}
