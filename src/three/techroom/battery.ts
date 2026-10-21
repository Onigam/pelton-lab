import * as THREE from 'three';
import { l } from '../../i18n';
import { group, mesh, pipeAlong } from '../util';
import {
  anchor,
  bake,
  blink,
  box,
  cyl,
  type Device,
  font,
  labelMaterial,
  led,
  ledMaterial,
  type Palette,
  plane,
  setLed,
} from './common';
import { BATT, battModuleY, POS, SIZE } from './layout';

// Four 48 V / 2.4 kWh LiFePO4 rack modules (Pylontech US2000C class) stacked with wooden
// spacers on two planks under the bench, as in the video. Paralleled module to module
// with short orange (+) / black (-) links and daisy-chained CAN/RS485 patch cables.

const [W, H, D] = SIZE.battery;
const PX = 2317; // canvas pixels per metre on the front panel

/** Module-local x/y (metres, origin at the panel centre) to canvas pixels. */
const cx = (x: number) => (x + W / 2) * PX;
const cy = (y: number) => (H / 2 - y) * PX;

const LAYOUT = {
  rocker: -0.196,
  run: -0.184,
  alm: -0.172,
  soc: [-0.152, -0.141, -0.13, -0.119],
  ledY: -0.022,
  ports: [-0.105, -0.085, -0.065, -0.045],
  portY: 0.012,
  dip: -0.022,
  button: 0.045,
  plus: 0.1,
  minus: 0.14,
};

function frontPanel(): THREE.MeshStandardMaterial {
  return labelMaterial(1024, Math.round(H * PX), (ctx, w, h) => {
    ctx.fillStyle = '#17181b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(0, 0, w, 6);
    ctx.fillStyle = '#9a9ca0';
    ctx.font = font(13, 600);
    ctx.textAlign = 'center';
    ctx.fillText('RUN', cx(LAYOUT.run), cy(LAYOUT.ledY - 0.012));
    ctx.fillText('ALM', cx(LAYOUT.alm), cy(LAYOUT.ledY - 0.012));
    ctx.fillText('SOC', cx(-0.1355), cy(LAYOUT.ledY - 0.012));
    ['CAN', 'RS485', 'RS485', 'CONSOLE'].forEach((t, i) =>
      ctx.fillText(t, cx(LAYOUT.ports[i]), cy(LAYOUT.portY - 0.016)),
    );
    ctx.fillText('ADD', cx(LAYOUT.dip), cy(0.0));
    ctx.fillText('POWER', cx(LAYOUT.rocker), cy(0.028));
    ctx.font = font(24, 800);
    ctx.fillStyle = '#e9e9ea';
    ctx.fillText('+', cx(LAYOUT.plus), cy(0.03));
    ctx.fillText('−', cx(LAYOUT.minus), cy(0.03));
    // model name and rating plate
    ctx.font = font(32, 700);
    ctx.textAlign = 'left';
    ctx.fillText('US2000C', cx(-0.034), cy(0.024));
    ctx.fillStyle = '#d9dadc';
    ctx.fillRect(cx(0.162), cy(0.03), 0.034 * PX, 0.05 * PX);
    ctx.fillStyle = '#222';
    ctx.font = font(12, 600);
    ['LiFePO4', '48 V 50 Ah', '2.4 kWh'].forEach((t, i) => ctx.fillText(t, cx(0.165), cy(0.017) + i * 18));
    // DIP switch body
    ctx.fillStyle = '#c4362c';
    ctx.fillRect(cx(LAYOUT.dip) - 18, cy(0.022), 36, 16);
  });
}

interface Shared {
  pal: Palette;
  front: THREE.Material;
  socMats: THREE.MeshStandardMaterial[];
  runMat: THREE.MeshStandardMaterial;
  almMat: THREE.MeshStandardMaterial;
}

function module(parent: THREE.Group, y0: number, sh: Shared) {
  const { pal } = sh;
  const m = new THREE.Group();
  m.position.y = y0 + H / 2;
  parent.add(m);
  box(m, pal.battBody, [W - 0.004, H, D - 0.008], [0, 0, (D - 0.008) / 2]);
  box(m, pal.charcoal, [W, H, 0.008], [0, 0, D - 0.004]);
  plane(m, sh.front, W - 0.002, H - 0.002, [0, 0, D + 0.0006]);
  const zf = D + 0.001;

  // rack ears with handles
  for (const s of [-1, 1]) {
    box(m, pal.charcoal, [0.004, H, 0.03], [s * (W / 2 + 0.002), 0, D - 0.015]);
    const hx = s * (W / 2 - 0.011);
    cyl(m, pal.zinc, 0.0042, 0.064, [hx, 0, zf + 0.022], 'y', 10);
    for (const yy of [-0.032, 0.032]) cyl(m, pal.zinc, 0.0035, 0.022, [hx, yy, zf + 0.011], 'z', 8);
  }
  // power rocker, LEDs, ports, DIP, red start button
  box(m, pal.red, [0.012, 0.018, 0.006], [LAYOUT.rocker, 0.008, zf + 0.003]);
  led(m, sh.runMat, 0.0024, [LAYOUT.run, LAYOUT.ledY, zf + 0.0015]);
  led(m, sh.almMat, 0.0024, [LAYOUT.alm, LAYOUT.ledY, zf + 0.0015]);
  LAYOUT.soc.forEach((x, i) => led(m, sh.socMats[i], 0.0024, [x, LAYOUT.ledY, zf + 0.0015]));
  for (const x of LAYOUT.ports) {
    box(m, pal.plastic, [0.015, 0.013, 0.004], [x, LAYOUT.portY, zf + 0.002]);
    box(m, pal.zinc, [0.011, 0.008, 0.001], [x, LAYOUT.portY, zf + 0.0042]);
  }
  cyl(m, pal.plastic, 0.012, 0.004, [LAYOUT.button, -0.008, zf + 0.002], 'z', 20);
  cyl(m, pal.red, 0.0085, 0.008, [LAYOUT.button, -0.008, zf + 0.005], 'z', 20);
  // power connectors (+ orange, - black): square flange + round barrel
  for (const [x, mat] of [
    [LAYOUT.plus, pal.orange],
    [LAYOUT.minus, pal.plastic],
  ] as [number, THREE.Material][]) {
    box(m, mat, [0.026, 0.026, 0.006], [x, 0, zf + 0.003]);
    cyl(m, mat, 0.0095, 0.032, [x, 0, zf + 0.022], 'z', 14);
  }
}

/** Short paralleling links and comms patch cables between modules i and i+1. */
function links(g: THREE.Group, pal: Palette) {
  const zc = D + 0.04;
  for (let i = 0; i < BATT.count - 1; i++) {
    const ya = battModuleY(i) + H / 2;
    const yb = battModuleY(i + 1) + H / 2;
    const mid = (ya + yb) / 2;
    for (const [x, mat, bulge] of [
      [LAYOUT.plus, pal.orange, -0.018],
      [LAYOUT.minus, pal.cableBlack, 0.02],
    ] as [number, THREE.Material, number][]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, ya, zc - 0.004),
        new THREE.Vector3(x + bulge * 0.6, ya + 0.01, zc + 0.03),
        new THREE.Vector3(x + bulge, mid, zc + 0.045),
        new THREE.Vector3(x + bulge * 0.6, yb - 0.01, zc + 0.03),
        new THREE.Vector3(x, yb, zc - 0.004),
      ]);
      g.add(mesh(new THREE.TubeGeometry(curve, 24, 0.0055, 8), mat));
    }
    const ca = new THREE.CatmullRomCurve3([
      new THREE.Vector3(LAYOUT.ports[1], ya + LAYOUT.portY, D + 0.006),
      new THREE.Vector3(LAYOUT.ports[1] + 0.01, mid, D + 0.03),
      new THREE.Vector3(LAYOUT.ports[0], yb + LAYOUT.portY, D + 0.006),
    ]);
    g.add(mesh(new THREE.TubeGeometry(ca, 16, 0.0025, 6), pal.cableBlack));
  }
  // earth bonding wire down the left ears, then back to the wall
  const pts = [new THREE.Vector3(-W / 2 - 0.006, battModuleY(0) + H / 2, D - 0.02)];
  pts.push(new THREE.Vector3(-W / 2 - 0.008, battModuleY(BATT.count - 1) + H, D - 0.03));
  pts.push(new THREE.Vector3(-W / 2 - 0.01, 0.6, D - 0.05));
  pts.push(new THREE.Vector3(-W / 2 - 0.01, 0.62, 0.0));
  g.add(pipeAlong(pts, 0.0025, pal.cableYG, { radialSegments: 6, bend: 0.05 }));
}

export function buildBattery(pal: Palette): Device {
  const g = group('battery', POS.battery);
  const shared: Shared = {
    pal,
    front: frontPanel(),
    socMats: [0, 1, 2, 3].map(() => ledMaterial(0x34e06a)),
    runMat: ledMaterial(0x34e06a),
    almMat: ledMaterial(0xff2a1c),
  };
  // the "shelf": two planks on the floor
  for (const x of [-0.13, 0.13]) box(g, pal.wood, [0.12, BATT.plank, 0.56], [x, BATT.plank / 2, 0.25]);
  for (let i = 0; i < BATT.count; i++) {
    module(g, battModuleY(i), shared);
    if (i < BATT.count - 1) {
      const y = battModuleY(i) + H + BATT.spacer / 2;
      for (const x of [-0.17, 0.17]) {
        for (const z of [0.07, D - 0.07]) box(g, pal.wood, [0.05, BATT.spacer, 0.05], [x, y, z]);
      }
    }
  }
  links(g, pal);
  bake(g);

  const top = battModuleY(BATT.count - 1) + H;
  return {
    id: 'battery',
    group: g,
    anchor: anchor(g, [0, top + 0.04, D]),
    explode: new THREE.Vector3(0, 0, 0.75),
    label: l('Batteries lithium 4 × 2,4 kWh (48 V)', 'Lithium batteries 4 × 2.4 kWh (48 V)'),
    update: (s, _dt, v) => {
      const lit = Math.max(0, Math.min(4, Math.ceil(s.soc * 4 - 1e-3)));
      const charging = s.iBatt > 0.5 && !s.bmsOpen;
      shared.socMats.forEach((m, k) => {
        // while charging, the next 25 % step flashes (as on the real BMS)
        const on = k < lit || (charging && k === lit && blink(v.time, 1));
        setLed(m, on, 2.2);
      });
      setLed(shared.runMat, charging || blink(v.time, 0.5, 0.15), 2.2);
      setLed(shared.almMat, s.bmsOpen && blink(v.time, 2), 2.8);
    },
  };
}
