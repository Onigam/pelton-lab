import { COLORS, W, type Pt, type Stroke, type View } from '@onigam/lab-kit/drawings';
import { BASE, CX, DRAIN_MM, M, PIPE, pipe, pipeBreak, PROFILE, R_TIP_MM, SIDE, SKID_MM, SPEAR } from './turbine-geom';

// PL-T01, second part: top view (1:5) and installation elevation (1:20) with the bypass
// branch. Geometry from the 3D model through turbine-geom.ts (mm).

const PAPER = COLORS.paper;
const AX = M.axisY;
const thin = (fill = PAPER): Stroke => ({ w: W.thin, fill });
const med = (fill = PAPER): Stroke => ({ w: W.medium, fill });

/** Top view (first-angle: below the front view, window side at the bottom). Model (x, −z). */
export function topView(v: View): void {
  const P = (x: number, z: number): Pt => [x, -z];
  const z = M.pipeZ;
  v.rect(P(BASE.x0, BASE.z0), P(BASE.x1, BASE.z1), med());
  v.rect(P(M.x0, M.zBack), P(M.x1, M.zFront), { w: W.thick, fill: PAPER });
  for (const x of [M.x0 + M.bevel, M.peakX]) v.line(P(x, M.zBack), P(x, M.zFront), { w: W.medium });
  // cable gland + cable at the rear
  v.rect(P(189, M.zBack - 13), P(211, M.zBack + 5), med());
  v.rect(P(194.5, M.zBack - 30), P(205.5, M.zBack - 13), med('#3a3f46'));
  // side injector flange / bayonet collar and wall plate (partly under the gooseneck)
  v.rect(P(SIDE.collar[1], z - 48), P(SIDE.collar[2], z + 48), med());
  v.rect(
    P(SIDE.flangeX - SIDE.flangeL / 2, z - SIDE.flangeR),
    P(SIDE.flangeX + SIDE.flangeL / 2, z + SIDE.flangeR),
    med(),
  );
  v.rect(P(M.x0 - 8, z - SIDE.plate / 2), P(M.x0, z + SIDE.plate / 2), med());
  for (const wx of [M.x0 - 6, M.x1 + 6])
    for (const zz of [-130, 130]) v.rect(P(wx - 3, zz - 15), P(wx + 3, zz + 15), thin());
  // gooseneck seen from above (all pipes at z = pipeZ) and the spear injector on its roof flange
  const inl = SPEAR.inlet;
  pipe(v, [P(-490, z), P(inl.x - inl.len / 2, z)], PIPE.r50);
  pipeBreak(v, -490, -z, PIPE.r50);
  v.rect(P(inl.x - inl.len / 2, z - inl.r), P(inl.x + inl.len / 2, z + inl.r), med());
  const x = SPEAR.x;
  const f = SPEAR.flange;
  v.rect(P(x - f.half, z - f.half), P(x + f.half, z + f.half), med());
  for (const [dx, dz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    v.circle(P(x + dx * f.bolt, z + dz * f.bolt), 4, { w: W.thin });
  const wh = SPEAR.wheel;
  v.circle(P(x, z), wh.r + wh.tube, med('#f3d5d2'));
  v.circle(P(x, z), wh.r - wh.tube, med());
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    v.line(P(x - Math.cos(a) * wh.r, z - Math.sin(a) * wh.r), P(x + Math.cos(a) * wh.r, z + Math.sin(a) * wh.r), {
      w: W.medium,
    });
  }
  v.circle(P(x, z), 8, med());
  v.center(P(0, BASE.z0 - 6), P(0, BASE.z1 + 6));
  v.center(P(-500, z), P(BASE.x1 + 8, z));
  v.center(P(x, z - 60), P(x, z + 60));
}

/** Installation elevation 1:20: ground, stand, housing, manifold with bypass. Y from the ground. */
export function installation(v: View): void {
  const Y = (y: number) => y + M.baseY;
  v.rect([-1400, -45], [580, 0], { w: 0, hatch: 'earth' });
  v.rect([-260, -210], [260, 0], { w: 0, fill: PAPER });
  v.polyline(
    [
      [-1400, 0],
      [-260, 0],
      [-260, -210],
      [260, -210],
      [260, 0],
      [580, 0],
    ],
    { w: W.thick },
  );
  v.rect([-258, -208], [258, -130], { w: W.thin, color: COLORS.water, fill: COLORS.waterFill });
  const dx = (DRAIN_MM.x0 + DRAIN_MM.x1) / 2;
  // aluminium skid (housing.ts buildSkid) + controller box
  const top = SKID_MM.top;
  const [xa, xb] = SKID_MM.xs;
  const half = (xb - xa) / 2 + 40;
  for (const x of [xa, xb]) {
    v.rect([x - 20, 60], [x + 20, top], med());
    v.rect([x - 6, 5], [x + 6, 60], thin());
    v.rect([x - 40, 0], [x + 40, 12], thin('#555'));
    v.rect([x - 18, top + 20], [x + 18, top + 30], thin('#555'));
    v.circle([x, top + 35], 18, { w: W.thin });
  }
  v.rect([CX - half, top - 20], [CX + half, top + 20], med());
  v.rect([CX - half, 230], [CX + half, 270], med());
  v.polyline(
    [
      [xa + 20, 270],
      [xa + 20, 294],
      [xb - 20, top - 20],
      [xb - 20, top - 44],
    ],
    { closed: true, ...thin() },
  );
  v.polyline(
    [
      [dx - 155.6, top - 20],
      [dx + 155.6, top - 20],
      [dx + 56.6, top - 200],
      [dx - 56.6, top - 200],
    ],
    { closed: true, ...thin() },
  );
  v.roundRect([xb + 30, 430], [xb + 230, 690], 12, med('#e6e8ea'));
  v.rect([xb - 20, 460], [xb + 40, 660], thin());
  // machine: base funnel, base, housing, runner, injectors
  v.polyline(
    [
      [dx - 150, Y(0)],
      [dx + 150, Y(0)],
      [dx + 92, Y(-80)],
      [dx - 92, Y(-80)],
    ],
    { closed: true, ...thin() },
  );
  v.rect([BASE.x0, Y(0)], [BASE.x1, Y(M.baseT)], med());
  v.polyline(
    PROFILE.map(([x, y]) => [x, Y(y)] as Pt),
    { closed: true, ...med() },
  );
  v.circle([0, Y(AX)], R_TIP_MM, { w: W.thin });
  v.circle([0, Y(AX)], M.rPitch, { w: W.thin, dash: 'center', color: COLORS.muted });
  const x = SPEAR.x;
  const wh = SPEAR.wheel;
  v.rect([x - SPEAR.bodyR, Y(SPEAR.bodyBot)], [x + SPEAR.bodyR, Y(SPEAR.bodyTop)], thin());
  v.line([x, Y(SPEAR.bodyTop)], [x, Y(wh.y)], { w: W.thin });
  v.rect([x - wh.r - wh.tube, Y(wh.y - wh.tube)], [x + wh.r + wh.tube, Y(wh.y + wh.tube)], thin('#f3d5d2'));
  const sideL = SIDE.collar[1];
  v.rect([sideL, Y(SIDE.y - 40)], [M.x0, Y(SIDE.y + 40)], thin());
  // manifold: HDPE Ø63 + compression coupling, main valve, gauge tee, bypass, reducer, cross
  const r63 = PIPE.r63;
  const [c0, c1] = PIPE.coupling;
  pipe(
    v,
    [
      [-1400, Y(M.inletY)],
      [c0, Y(M.inletY)],
    ],
    r63,
    70,
    { fill: '#3a3f46' },
  );
  v.rect([c0 - 25, Y(M.inletY - 47)], [c1 + 25, Y(M.inletY + 47)], thin('#cfe0f5'));
  pipe(
    v,
    [
      [c1 + 25, Y(M.inletY)],
      [PIPE.reducer[0], Y(M.inletY)],
    ],
    r63,
  );
  const mv = PIPE.mainValveX;
  v.rect([mv - 71, Y(M.inletY - 50)], [mv + 71, Y(M.inletY + 50)], thin());
  v.rect([mv - 15, Y(M.inletY - 11)], [mv + 135, Y(M.inletY + 11)], thin('#2b6cd1'));
  const gx = PIPE.gaugeX;
  v.rect([gx - 45, Y(M.inletY - 37)], [gx + 45, Y(M.inletY + 37)], thin());
  v.rect([gx - 7, Y(M.inletY + 37)], [gx + 7, Y(M.inletY + 123)], thin());
  v.circle([gx, Y(M.inletY + 175)], 52, thin());
  bypass(v, Y);
  const [rd0, rd1] = PIPE.reducer;
  v.polyline(
    [
      [rd0, Y(M.inletY + r63)],
      [rd1, Y(M.inletY + PIPE.r50)],
      [rd1, Y(M.inletY - PIPE.r50)],
      [rd0, Y(M.inletY - r63)],
    ],
    { closed: true, ...thin() },
  );
  const tx = PIPE.teeX;
  const inl = SPEAR.inlet;
  pipe(
    v,
    [
      [rd1, Y(M.inletY)],
      [tx, Y(M.inletY)],
      [tx, Y(PIPE.riserTop)],
      [PIPE.riserOverX, Y(PIPE.riserTop)],
      [PIPE.riserOverX, Y(inl.y)],
      [inl.x - inl.len / 2, Y(inl.y)],
    ],
    PIPE.r50,
  );
  pipe(
    v,
    [
      [tx, Y(M.inletY)],
      [tx, Y(SIDE.y)],
      [sideL, Y(SIDE.y)],
    ],
    PIPE.r50,
    60,
  );
  const tv = PIPE.topValveY;
  v.rect([tx - 27, Y(tv - 58)], [tx + 27, Y(tv + 58)], thin('#e03131'));
  v.rect([PIPE.sideValveX - 58, Y(SIDE.y - 41)], [PIPE.sideValveX + 58, Y(SIDE.y + 41)], thin('#2b6cd1'));
  const [ax0, ay0] = PIPE.airValve;
  v.rect([ax0 - 12, Y(ay0)], [ax0 + 12, Y(ay0 + 20)], thin());
  v.rect([ax0 - 24, Y(ay0 + 20)], [ax0 + 24, Y(ay0 + 86)], thin('#e9d8a6'));
  pipeBreak(v, -1400, Y(M.inletY), r63);
  v.center([-250, Y(AX)], [250, Y(AX)]);
}

/** Bypass / drain branch Ø40 with its ball valve (hydraulics.ts `valve-bypass`), closed in service. */
function bypass(v: View, Y: (y: number) => number): void {
  const b = PIPE.bypass;
  pipe(
    v,
    [
      [b.x, Y(M.inletY)],
      [b.x, Y(b.bendY)],
      [b.end[0], Y(b.end[1])],
    ],
    b.r,
    50,
  );
  v.rect([b.x - 35.3, Y(M.inletY - 31.5)], [b.x + 35.3, Y(M.inletY + 31.5)], thin());
  const k = b.scale;
  const vy = b.valveY;
  for (const s of [-1, 1]) v.rect([b.x - 50 * k, Y(vy + s * 45 * k)], [b.x + 50 * k, Y(vy + s * 71 * k)], thin());
  v.rect([b.x - 33 * k, Y(vy - 45 * k)], [b.x + 33 * k, Y(vy + 45 * k)], thin());
  v.rect([b.x - 15 * k, Y(vy - 11 * k)], [b.x + 135 * k, Y(vy + 11 * k)], thin('#3a3f46')); // lever across: closed
  const e: Pt = [b.end[0], Y(b.end[1])];
  v.line([e[0] + 10, e[1] - 6], [e[0] + 110, e[1] - 140], {
    w: W.medium,
    color: COLORS.water,
    dash: 'hidden',
  }).setAttribute('marker-end', 'url(#arrow)');
}
