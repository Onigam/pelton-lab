import * as THREE from 'three';
import { l, type L, tr } from '../../i18n';
import type { AlarmKey, SimState } from '../../sim/types';
import { canvasTexture, group } from '../util';
import { anchor, bake, box, cyl, type Device, font, MONO, type Palette, plane, rbox, throttle } from './common';
import { POS, SIZE } from './layout';

// Canvas drawings of the live screens (GX touch panel, TriStar meter, MultiPlus LCD) and
// the GX touch device itself. Screens are redrawn at most 4 times per second.

export const FLOW_COLORS = {
  hydro: '#ff8a1f',
  pv: '#ffd23f',
  battery: '#3ddc84',
  load: '#a66bff',
  dump: '#ff4d4d',
};

const ALARM_TEXT: Record<AlarmKey, L> = {
  air: l('Air dans la conduite forcée', 'Air in the penstock'),
  noOverflow: l('Plus de surverse à la prise', 'No overflow at the intake'),
  overspeed: l('Survitesse turbine', 'Turbine overspeed'),
  bmsOpen: l('BMS ouvert : charge coupée', 'BMS open: charging cut'),
  lowFlow: l('Débit faible (mode dégradé)', 'Low flow (degraded mode)'),
  surge: l('Coup de bélier', 'Water hammer'),
  overpressure: l('Surpression conduite', 'Penstock overpressure'),
  clogged: l('Grille Coanda colmatée', 'Coanda screen clogged'),
  bearing: l('Roulements usés', 'Worn bearings'),
  lowSoc: l('Batterie faible', 'Battery low'),
  hunting: l('Vitesse instable (MPPT)', 'Speed hunting (MPPT)'),
};

const fmtW = (p: number) => (Math.abs(p) >= 1000 ? `${(p / 1000).toFixed(2)} kW` : `${Math.round(p)} W`);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function tile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  title: string,
  value: string,
  sub?: string,
) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#17222f';
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 10, 5, h - 20);
  ctx.fillStyle = '#9fb0c2';
  ctx.font = font(17, 600);
  ctx.fillText(title, x + 16, y + 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = font(38, 700);
  ctx.fillText(value, x + 16, y + 74);
  if (sub) {
    ctx.fillStyle = '#7f92a6';
    ctx.font = font(15, 500);
    ctx.fillText(sub, x + 16, y + h - 14);
  }
}

/** Main supervision screen (640 × 384). */
export function drawGx(ctx: CanvasRenderingContext2D, w: number, h: number, s: SimState): void {
  ctx.fillStyle = '#0d141c';
  ctx.fillRect(0, 0, w, h);
  // header
  ctx.fillStyle = '#123a63';
  ctx.fillRect(0, 0, w, 40);
  ctx.fillStyle = '#e6f0fa';
  ctx.font = font(19, 700);
  ctx.textAlign = 'left';
  ctx.fillText(tr(l('Vue d’ensemble', 'Overview')), 14, 27);
  const hh = Math.floor(s.hour);
  const mm = Math.floor((s.hour - hh) * 60);
  ctx.textAlign = 'right';
  ctx.font = font(17, 600);
  ctx.fillText(
    `${tr(l('Jour', 'Day'))} ${s.day + 1}  ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    w - 14,
    27,
  );
  ctx.textAlign = 'left';

  // battery tile with SOC gauge
  const bx = 12;
  const by = 52;
  const bw = 226;
  const bh = 250;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fillStyle = '#17222f';
  ctx.fill();
  ctx.fillStyle = '#9fb0c2';
  ctx.font = font(18, 600);
  ctx.fillText(tr(l('Batterie', 'Battery')), bx + 16, by + 30);
  const soc = Math.round(s.soc * 100);
  ctx.fillStyle = s.soc < 0.2 ? FLOW_COLORS.dump : '#ffffff';
  ctx.font = font(68, 800);
  ctx.fillText(`${soc}%`, bx + 16, by + 104);
  roundRect(ctx, bx + 16, by + 122, bw - 32, 16, 8);
  ctx.fillStyle = '#26384a';
  ctx.fill();
  roundRect(ctx, bx + 16, by + 122, Math.max(16, (bw - 32) * s.soc), 16, 8);
  ctx.fillStyle = FLOW_COLORS.battery;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(24, 700);
  ctx.fillText(`${s.vBatt.toFixed(1)} V`, bx + 16, by + 176);
  const sign = s.iBatt >= 0 ? '+' : '−';
  ctx.fillText(`${sign}${Math.abs(s.iBatt).toFixed(1)} A`, bx + 120, by + 176);
  const state = s.bmsOpen
    ? l('BMS ouvert', 'BMS open')
    : s.iBatt > 0.5
      ? l('En charge', 'Charging')
      : s.iBatt < -0.5
        ? l('Décharge', 'Discharging')
        : l('Repos', 'Idle');
  ctx.fillStyle = s.bmsOpen ? FLOW_COLORS.dump : FLOW_COLORS.battery;
  ctx.font = font(18, 600);
  ctx.fillText(tr(state), bx + 16, by + 212);
  ctx.fillStyle = '#7f92a6';
  ctx.font = font(15, 500);
  ctx.fillText(`${s.batteryKWh.toFixed(1)} kWh · 48 V`, bx + 16, by + 236);

  // power tiles
  const tx = 250;
  const tw = (w - tx - 12 - 10) / 2;
  const th = 120;
  tile(
    ctx,
    tx,
    52,
    tw,
    th,
    FLOW_COLORS.pv,
    tr(l('Solaire PV', 'Solar PV')),
    fmtW(s.pPv),
    `${tr(l('dispo', 'avail.'))} ${fmtW(s.pPvAvail)}`,
  );
  tile(
    ctx,
    tx + tw + 10,
    52,
    tw,
    th,
    FLOW_COLORS.hydro,
    tr(l('Hydro', 'Hydro')),
    fmtW(s.pToBus),
    `${s.vTurbine.toFixed(1)} V · ${Math.round(s.rpm)} rpm`,
  );
  tile(
    ctx,
    tx,
    182,
    tw,
    th,
    FLOW_COLORS.load,
    tr(l('Conso AC', 'AC loads')),
    fmtW(s.pLoad),
    `${tr(l('onduleur', 'inverter'))} ${fmtW(s.pInverter)}`,
  );
  tile(
    ctx,
    tx + tw + 10,
    182,
    tw,
    th,
    FLOW_COLORS.dump,
    tr(l('Délestage', 'Dump load')),
    fmtW(s.pDump),
    s.dumpEnabled ? tr(l('actif', 'enabled')) : tr(l('désactivé', 'disabled')),
  );

  // alarm line
  const ay = 314;
  const alarm = s.alarms[0];
  roundRect(ctx, 12, ay, w - 24, 58, 10);
  ctx.fillStyle = alarm ? '#7a1616' : '#123524';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = font(21, 700);
  const more = s.alarms.length > 1 ? `  (+${s.alarms.length - 1})` : '';
  const text = alarm ? `⚠  ${tr(ALARM_TEXT[alarm])}${more}` : `✓  ${tr(l('Aucune alarme', 'No alarm'))}`;
  ctx.fillText(text, 30, ay + 37);
}

/** TriStar backlit meter (256 × 128). */
export function drawTriStar(ctx: CanvasRenderingContext2D, w: number, h: number, s: SimState): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#b5cf74');
  g.addColorStop(1, '#9cb95e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1b2a10';
  ctx.font = font(25, 700, MONO);
  ctx.fillText(`${s.vTurbine.toFixed(1)}V ${s.iGen.toFixed(1)}A`, 10, 34);
  ctx.fillText(
    `${String(Math.round(s.rpm)).padStart(4, ' ')}rpm ${String(Math.round(s.pElec)).padStart(3, ' ')}W`,
    10,
    72,
  );
  const mode =
    s.ctrlMode === 'fixed' ? `FIX Vin ${s.vSet.toFixed(0)}V` : s.ctrlMode === 'mppt' ? 'MPPT sweep' : 'BYPASS';
  ctx.fillText(mode, 10, 110);
}

/** MultiPlus-II small LCD (256 × 80). */
export function drawMultiLcd(ctx: CanvasRenderingContext2D, w: number, h: number, s: SimState): void {
  ctx.fillStyle = '#2b49c8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8eeff';
  ctx.font = font(27, 700, MONO);
  ctx.fillText(s.bmsOpen ? 'BMS OPEN' : s.pLoad > 1 ? `INV ${Math.round(s.pLoad)}W` : 'INV search', 10, 33);
  ctx.fillText(`${s.vBatt.toFixed(1)}V ${Math.round(s.soc * 100)}%`, 10, 70);
}

// ---- GX touch panel --------------------------------------------------------------------

export function buildGxDisplay(pal: Palette): Device {
  const [W, H, D] = SIZE.gx;
  const g = group('gx-display', POS.gx);
  box(g, pal.zinc, [0.06, 0.08, 0.004], [0, 0, 0.002]); // wall bracket
  rbox(g, pal.plastic, [W, H, D - 0.004], [0, 0, 0.004 + (D - 0.004) / 2], 0.006);
  const screen = canvasTexture(640, 384, (ctx, w, h) => {
    ctx.fillStyle = '#0d141c';
    ctx.fillRect(0, 0, w, h);
  });
  const screenMat = new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false });
  const sh = 0.096;
  plane(g, screenMat, sh * (640 / 384), sh, [0, 0.004, D + 0.0006]);
  cyl(g, pal.darkGrey, 0.0015, 0.001, [0, H / 2 - 0.009, D + 0.0006], 'z', 8); // light sensor
  bake(g);

  const redraw = throttle(0.25);
  return {
    id: 'gx-display',
    group: g,
    anchor: anchor(g, [0, H / 2 + 0.02, D]),
    explode: new THREE.Vector3(0.1, 0.05, 0.45),
    label: l('Écran de supervision (GX)', 'Monitoring display (GX)'),
    update: (s, _dt, v) => {
      if (redraw(v.time)) screen.redraw((ctx, w, h) => drawGx(ctx, w, h, s));
    },
  };
}
