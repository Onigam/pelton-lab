import { l } from '../../i18n';
import { COLORS, Drawing, W, type HatchKind, type Pt, type Stroke, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import { BELL, clipPoly, M, note, RUNNER, SHAFT, spec, STATOR, type Box } from './turbine-geom';

// PL-T02 — shaft line, axial section A–A at 1:2 (z along the sheet, radius up).
// Positions from the 3D model (drivetrain.ts, generator.ts, runner.ts through turbine-geom.ts), mm.

const { b1: ZB1, b2: ZB2, b3: ZB3, seal: SEAL_Z, partDry: PD, partWet: PW } = SHAFT;
const WHEEL_Z = M.wheelZ;
const [S0, S1] = STATOR.z;
const [B0, B1] = BELL.z;
const BIG = 1000; // sentinel radius: replaced by the break radius of each half
const R_TOP = 150;
const R_BOT = -95;

interface Shape {
  pts: Pt[];
  st: Stroke;
  mirror: boolean;
  open?: boolean;
}

const sec = (hatch: HatchKind, w = W.medium): Stroke => ({ w, hatch, fill: COLORS.paper });
const solid = (w = W.medium): Stroke => ({ w, fill: COLORS.paper });
const rect = (z0: number, z1: number, r0: number, r1: number): Pt[] => [
  [z0, r0],
  [z1, r0],
  [z1, r1],
  [z0, r1],
];
const shift = (pts: Pt[], dz: number): Pt[] => pts.map(([z, r]) => [z + dz, r]);
const circle = ([cz, cr]: Pt, r: number, n = 20): Pt[] =>
  Array.from(
    { length: n },
    (_, i) => [cz + r * Math.cos((i / n) * Math.PI * 2), cr + r * Math.sin((i / n) * Math.PI * 2)] as Pt,
  );

/** 6204-2RS section (top half) centred on z. */
function bearing(z: number): Shape[] {
  const outer: Pt[] = [
    [-7, 19.5],
    [-7, 23.5],
    [7, 23.5],
    [7, 19.5],
    [3.5, 19.5],
    [1.5, 20.7],
    [-1.5, 20.7],
    [-3.5, 19.5],
  ];
  const inner: Pt[] = [
    [-7, 10],
    [-7, 14.2],
    [-3.5, 14.2],
    [-1.5, 13],
    [1.5, 13],
    [3.5, 14.2],
    [7, 14.2],
    [7, 10],
  ];
  return [
    { pts: shift(outer, z), st: sec('steel'), mirror: true },
    { pts: shift(inner, z), st: sec('steel'), mirror: true },
    { pts: rect(z - 6.6, z - 5.6, 14.6, 19.4), st: sec('rubber', W.thin), mirror: true },
    { pts: rect(z + 5.6, z + 6.6, 14.6, 19.4), st: sec('rubber', W.thin), mirror: true },
    { pts: circle([z, 16.8], 3.9), st: solid(W.medium), mirror: true },
  ];
}

function shapes(): Shape[] {
  const s: Shape[] = [];
  const add = (pts: Pt[], st: Stroke, mirror = true) => s.push({ pts, st, mirror });
  const [r0, r1] = SHAFT.rear;
  const [w0, w1] = SHAFT.window;
  // housing plates (cut by break lines at R_TOP / R_BOT): rear panel + bearing boss, partition, window
  add(
    [
      [r0, 16],
      [r0, BIG],
      [r1, BIG],
      [r1, 34],
      [r1 + 20, 32],
      [r1 + 20, 23.5],
      [r1, 23.5],
      [r1, 16],
    ],
    sec('plastic'),
  );
  add(rect(PD, PW, 25, BIG), sec('pmma'));
  add(rect(w0, w1, -BIG, BIG), sec('pmma'), false);
  // grease cap (stainless cup) on the rear panel
  const c0 = r0 - 12;
  add(
    [
      [c0, -22],
      [c0, 22],
      [r0, 20],
      [r0, 17],
      [c0 + 3, 17],
      [c0 + 3, -17],
      [r0, -17],
      [r0, -20],
    ],
    sec('steel'),
    false,
  );
  // bearing housing: turned aluminium cartridge (Ø124 flange)
  const end = ZB2 - 9;
  add(
    [
      [PD, 23.5],
      [PD, 62],
      [PD - 12, 62],
      [PD - 14, 36],
      [end, 34],
      [end, 21],
      [end + 2, 21],
      [end + 2, 23.5],
    ],
    sec('alu'),
  );
  add(rect(PD - 4.8, PD - 3.2, 23.5, 25.5), solid(W.thin)); // internal circlip DIN 472 Ø47
  add(rect(ZB2 + 7, ZB1 - 7, 10, 14), sec('steel', W.thin)); // spacer between inner rings
  for (const z of [ZB1, ZB2, ZB3]) s.push(...bearing(z));
  // seal carrier + lip seal 20 × 35 × 7 (main lip and garter spring on the water side, +z)
  add(rect(PW, PW + 9, 17.5, 30), sec('alu'));
  add(
    shift(
      [
        [3.5, 10.2],
        [1.8, 12.5],
        [3.5, 15.5],
        [3.5, 17.5],
        [-3.5, 17.5],
        [-3.5, 12],
        [-2, 10.4],
      ],
      SEAL_Z,
    ),
    sec('rubber', W.thin),
  );
  add(circle([SEAL_Z + 1.2, 12.8], 0.7, 10), solid(W.thin));
  add(
    shift(
      [
        [19, 10.2],
        [19, 14],
        [16.5, 14],
        [14.2, 19],
        [14, 18.4],
        [15.6, 13],
        [16, 10.2],
      ],
      PW - 5,
    ),
    sec('rubber', W.thin),
  ); // V-ring
  const gz = PD - 60; // grease nipple (drivetrain.ts)
  add(
    [
      [gz - 4, 35.2],
      [gz + 4, 35.2],
      [gz + 3, 46],
      [gz - 3, 46],
    ],
    solid(W.thin),
    false,
  );
  add(circle([gz, 49], 3.2, 14), solid(W.thin), false);
  // generator: stator stack + coil end turns, rotor (hub, fan disc, bell, back iron, magnets)
  add(rect(S0, S1, STATOR.rBore, STATOR.rTip), sec('steel'));
  add(rect(S0 - 6.2, S0, 43.2, 51.4), sec('copper', W.thin));
  add(rect(S1, S1 + 6.2, 43.2, 51.4), sec('copper', W.thin));
  add(rect(B0 - 15, B0 + 3, M.shaftR, 21), sec('alu'));
  add(rect(B0, B0 + 6, 21, 50), sec('plastic'));
  add(rect(B0, B0 + 6, 68, BELL.r), sec('plastic'));
  add(rect(B0 + 6, B1, 65, BELL.r), sec('plastic'));
  add(rect(B0 + 6, B1, BELL.rIron, 65), sec('steel', W.thin));
  add(rect(S0 - 1, S1 + 1, BELL.rMag[0], BELL.rMag[1]), { w: W.thin, fill: '#c9ced6' });
  add(rect(B0 - 9, B0 - 3, 15, 21), solid(W.thin), false); // set screw
  add(rect(-106, -94, 82, 112), { w: W.thin, fill: COLORS.paper }, false); // Hall sensor (generator.ts)
  // runner: hub disc, clamp ring, steel flange, taper bush, washer, M4 bolts, bucket (top only)
  const hz = M.hubT / 2;
  const [g0, g1] = RUNNER.ring;
  const FR = RUNNER.flangeR;
  add(rect(WHEEL_Z - hz, WHEEL_Z + hz, RUNNER.bore, M.hubR), sec('plastic'));
  add(rect(WHEEL_Z + RUNNER.ringZ[0], WHEEL_Z + RUNNER.ringZ[1], g0, g1), sec('plastic'));
  add(
    shift(
      [
        [-hz, 11],
        [-hz, RUNNER.bore],
        [hz, RUNNER.bore],
        [hz, FR],
        [hz + 20, FR],
        [hz + 20, 16],
        [hz + 4, 19],
        [hz + 4, 11],
      ],
      WHEEL_Z,
    ),
    sec('steel'),
  );
  add(
    shift(
      [
        [hz + 4, 10],
        [hz + 4, 19],
        [hz + 20, 16],
        [hz + 20, 10],
      ],
      WHEEL_Z,
    ),
    sec('steel'),
  );
  add(rect(WHEEL_Z + hz + 20, WHEEL_Z + hz + 22, 10, 17), sec('steel', W.thin));
  const [k0, k1] = RUNNER.cheek;
  add(rect(WHEEL_Z - hz - 4, WHEEL_Z - hz, k0, k1), solid(W.thin));
  add(rect(WHEEL_Z + hz, WHEEL_Z + hz + 4, k0, k1), solid(W.thin));
  const br = M.boltR;
  add(rect(WHEEL_Z - hz - 6, WHEEL_Z + hz + 12, br - 2, br + 2), solid(W.thin));
  add(rect(WHEEL_Z + hz + 9, WHEEL_Z + hz + 12, br - 3.5, br + 3.5), solid(W.thin));
  add(rect(WHEEL_Z - hz - 7.5, WHEEL_Z - hz - 4.5, br - 3.5, br + 3.5), solid(W.thin));
  const L = spec('L');
  add(rect(WHEEL_Z - 10, WHEEL_Z + 10, M.hubR, L.rc - 0.35 * L.a), solid(W.medium), false);
  const cup: Pt[] = [];
  for (let i = 0; i <= 32; i++) {
    const e = -0.985 + (1.97 * i) / 32;
    cup.push([WHEEL_Z + L.b * Math.sqrt(1 - e * e), L.rc + e * L.a]);
  }
  for (let i = 32; i >= 0; i--) cup.push([2 * WHEEL_Z - cup[i][0], cup[i][1]]);
  add(cup, solid(W.medium), false);
  // shaft (not sectioned): Ø20, chamfer, M16 end, 6 × 6 key
  const [z0, z1] = [SHAFT.z0, SHAFT.z1];
  const t0 = WHEEL_Z + hz + 22; // thread starts under the nut
  add(
    [
      [z0, 8.5],
      [z0 + 1.5, 10],
      [t0, 10],
      [t0, 8],
      [z1 - 1, 8],
      [z1, 7],
      [z1, -7],
      [z1 - 1, -8],
      [t0, -8],
      [t0, -10],
      [z0 + 1.5, -10],
      [z0, -8.5],
    ],
    solid(W.thick),
    false,
  );
  add(rect(WHEEL_Z - 15, WHEEL_Z + 15, 6.5, 12.5), solid(W.thin), false);
  add(rect(t0, t0 + 10, -14.5, 14.5), solid(W.medium), false); // M16 nut (not sectioned)
  for (const r of [12, -12])
    s.push({
      pts: [
        [t0, r],
        [t0 + 10, r],
      ],
      st: { w: W.thin },
      mirror: false,
      open: true,
    });
  return s;
}

function render(v: View, list: Shape[], clip?: Box): void {
  for (const sh of list) {
    for (const sign of sh.mirror ? [1, -1] : [1]) {
      let pts: Pt[] = sh.pts.map(([z, r]) => [z, Math.abs(r) === BIG ? (r * sign > 0 ? R_TOP : R_BOT) : r * sign]);
      if (clip) pts = clipPoly(pts, clip);
      if (pts.length > 2 || (pts.length === 2 && !clip))
        v.polyline(pts, { ...sh.st, closed: pts.length > 2 && !sh.open });
    }
  }
}

/** Short S-shaped break line across a plate (z0..z1) at radius r. */
function breakLine(v: View, z0: number, z1: number, r: number): void {
  const m = (z0 + z1) / 2;
  const w = z1 - z0;
  v.polyline(
    [
      [z0 - 2, r],
      [m - w * 0.15, r + 2.5],
      [m + w * 0.15, r - 2.5],
      [z1 + 2, r],
    ],
    { w: W.thin },
  );
}

/** Small square tag referring to the fits table. */
function tag(v: View, at: Pt, dx: number, dy: number, letter: string): void {
  const p = v.drawing.paper();
  const q = v.map(at);
  const e: Pt = [q[0] + dx, q[1] + dy];
  p.circle(q, 0.45, { w: 0, fill: COLORS.signal });
  p.line(q, e, { w: W.thin, color: COLORS.signal });
  p.rect([e[0] - 2.2, e[1] - 2.2], [e[0] + 2.2, e[1] + 2.2], { w: W.thin, color: COLORS.signal, fill: COLORS.paper });
  p.text(e, letter, { size: 2.3, anchor: 'middle', baseline: 'middle', weight: 'bold', color: COLORS.signal });
}

export const shaftLine: DrawingSheet = {
  id: 'shaft-line',
  number: 'PL-T02',
  group: 'turbine',
  title: l('Ligne d’arbre — coupe A–A', 'Shaft line — section A–A'),
  description: l(
    'Coupe par l’axe de l’arbre à l’échelle 1:2 : roue Pelton côté eau, cloison étanche avec joint à lèvre, palier à deux roulements, générateur à rotor extérieur et troisième roulement dans le flasque arrière. Les cotes axiales donnent la position de chaque roulement et du plan de roue ; les repères a à g renvoient au tableau des ajustements. Le palier est une cartouche alu avec graisseur et V-ring.',
    'Section through the shaft axis at 1:2: Pelton runner on the water side, watertight partition with lip seal, two-bearing housing, outer-rotor generator and third bearing in the rear panel. Axial dimensions give the position of each bearing and of the wheel plane; tags a to g refer to the fits table. The bearing housing is an aluminium cartridge with grease nipple and V-ring.',
  ),
  scene: 'turbine',
  parts: ['shaft', 'bearing-1', 'bearing-2', 'bearing-3', 'seal', 'bearing-cartridge', 'wheel-lock', 'rotor', 'stator'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Ligne d’arbre — coupe A–A', 'Shaft line — section A–A'),
      subtitle: l('Cartouche alu 6082, graisseur, V-ring', '6082 alu cartridge, grease nipple, V-ring'),
      number: 'PL-T02',
      scale: '1:2 · 2:1',
    });
    const p = d.paper();
    const list = shapes();

    // ---- main section 1:2
    const v = d.view(120, 98, 0.5);
    render(v, list);
    for (const [z0, z1] of [SHAFT.rear, [PD, PW], SHAFT.window]) {
      breakLine(v, z0, z1, R_TOP);
      breakLine(v, z0, z1, R_BOT);
    }
    v.center([SHAFT.rear[0] - 20, 0], [SHAFT.window[1] + 6, 0]);
    for (const z of [ZB3, ZB2, ZB1, WHEEL_Z]) v.center([z, -26], [z, -101]);
    v.center([WHEEL_Z, 26], [WHEEL_Z, 140]);
    // water / dry sides
    p.text(v.map([(PW + SHAFT.window[0]) / 2, -86]), l('CHAMBRE HUMIDE', 'WET CHAMBER'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'middle',
      halo: true,
    });
    p.text(v.map([(SHAFT.rear[1] + PD) / 2, -86]), l('CHAMBRE SÈCHE', 'DRY CHAMBER'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.muted,
      anchor: 'middle',
      halo: true,
    });
    // axial dimension chain (datum: rear end of the shaft)
    const yb = -101;
    const chain = [ZB3, ZB2, ZB1, WHEEL_Z, SHAFT.z1];
    chain.slice(1).forEach((z, i) => v.dim([chain[i], yb], [z, yb], 4, { dir: 'h' }));
    v.dim([SHAFT.z0, yb], [SHAFT.z1, yb], 11, {
      dir: 'h',
      label: l(`${SHAFT.len} (arbre)`, `${SHAFT.len} (shaft)`),
    });
    v.dim([SHAFT.z0, -42], [ZB3, -42], 0, { dir: 'h', size: 2 });
    v.dim([-160, -10], [-160, 10], 0, { dir: 'v', label: 'Ø20 h6', size: 2 });
    v.dim([WHEEL_Z + 50, -M.hubR], [WHEEL_Z + 50, M.hubR], 0, { dir: 'v', label: `Ø${2 * M.hubR}`, size: 2.2 });
    // fits tags (see table)
    tag(v, [ZB2 + 4, -10], 4, 13, 'a');
    tag(v, [ZB2 - 4, -23.5], -4, 16, 'b');
    tag(v, [ZB3 + 3, -23.5], 6, 12, 'c');
    tag(v, [SEAL_Z - 2, -10.4], -3, 22, 'd');
    tag(v, [SEAL_Z + 2, -17.5], 6, 16, 'e');
    tag(v, [B0 - 6, -10], -2, 18, 'f');
    tag(v, [WHEEL_Z + 18, -10], 2, 14, 'g');
    // balloons: target point in the model, balloon centre in paper mm
    const b = (at: Pt, bx: number, by: number, n: string) => {
      const q = v.map(at);
      v.leader(at, bx - q[0], by - q[1], n, { balloon: true });
    };
    const [r0] = SHAFT.rear;
    b([r0 - 10, 15], 16, 64, '16');
    b([r0 + 3, 120], 28, 18, '15');
    b([ZB3, 22], 34, 40, '4');
    b([-160, 10], 44, 28, '1');
    b([B0 + 4, 75], 56, 40, '13');
    b([ZB2, 22], 66, 28, '3');
    b([S0 + 18, 52], 80, 36, '14');
    b([-70, 13], 92, 26, '8');
    b([-45, 34.5], 104, 34, '7');
    b([ZB1, 22], 112, 17, '2');
    b([PD - 60, 47], 98, 50, '17');
    b([M.zPart, 120], 130, 22, '9');
    b([PW + 5, 28], 138, 52, '6');
    b([SEAL_Z + 2, 16], 145, 68, '5');
    b([WHEEL_Z - 4, 50], 160, 74, '10');
    b([WHEEL_Z + 24, 28], 190, 50, '11');
    b([WHEEL_Z + 35, 13], 197, 66, '12');
    // detail E mark
    v.circle([SEAL_Z + 1, 20], 17, { w: W.thin, dash: 'phantom' });
    p.text(v.map([SEAL_Z + 11, 37]), 'E', { size: 3.4, weight: 'bold', halo: true });
    v.caption([0, -142], l('COUPE A–A — ligne d’arbre', 'SECTION A–A — shaft line'), '1:2');

    // ---- detail E, 2:1 (seal on the partition)
    const box: Box = { x0: PD - 8, x1: PW + 18, y0: 7, y1: 33 };
    const de = d.view(18 - box.x0 * 2, 186 + box.y1 * 2, 2);
    render(de, list, box);
    de.rect([box.x0, box.y0], [box.x1, box.y1], { w: W.thin, dash: 'phantom', color: COLORS.muted });
    de.leader([SEAL_Z + 3.4, 10.4], 26, 10, l('lèvre principale côté eau', 'main lip, water side'), {
      color: COLORS.water,
    });
    de.leader([SEAL_Z + 1.2, 12.8], 24, -6, l('ressort jarretière', 'garter spring'));
    de.leader([SEAL_Z - 2.6, 10.6], 36, 17, l('lèvre pare-poussière', 'dust lip'));
    de.leader(
      [PW + 11.5, 16.5],
      14,
      -18,
      l('V-ring déflecteur (tourne avec l’arbre)', 'V-ring slinger (turns with the shaft)'),
    );
    p.text(de.map([box.x1 - 3, 30.5]), l('EAU →', 'WATER →'), {
      size: 2.2,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'end',
    });
    p.text(de.map([box.x0 + 2, 30.5]), l('← SEC', '← DRY'), { size: 2.2, weight: 'bold', color: COLORS.muted });
    p.text(
      de.map([(box.x0 + box.x1) / 2, box.y0 - 5]),
      l('DÉTAIL E — étanchéité de cloison', 'DETAIL E — partition seal'),
      { size: 2.8, weight: 'bold', anchor: 'middle' },
    );
    p.text(de.map([(box.x0 + box.x1) / 2, box.y0 - 7.2]), '2:1', {
      size: 2.2,
      anchor: 'middle',
      mono: true,
      color: COLORS.muted,
    });

    // ---- material legend
    const mats: [HatchKind | 'magnet', Text][] = [
      ['steel', l('Acier / inox', 'Steel / stainless')],
      ['alu', l('Aluminium', 'Aluminium')],
      ['plastic', l('Plastique imprimé', 'Printed plastic')],
      ['pmma', l('PMMA', 'PMMA')],
      ['rubber', l('Élastomère NBR / EPDM', 'NBR / EPDM rubber')],
      ['copper', l('Cuivre (bobinage)', 'Copper (winding)')],
      ['magnet', l('Aimants NdFeB N52', 'NdFeB N52 magnets')],
    ];
    p.text([152, 190], l('MATIÈRES (hachures)', 'MATERIALS (hatching)'), { size: 2.2, weight: 'bold' });
    mats.forEach(([h, label], i) => {
      const y = 193 + i * 5.6;
      p.rect(
        [152, y],
        [161, y + 4],
        h === 'magnet' ? { w: W.thin, fill: '#c9ced6' } : { w: W.thin, hatch: h, fill: COLORS.paper },
      );
      p.text([164, y + 2], label, { size: 2, baseline: 'middle' });
    });

    // ---- notes under the detail
    let ny = 256;
    ny = note(
      d,
      14,
      ny,
      190,
      l(
        'Roulements 1–2 : palier fixe (bague extérieure de 2 en butée sur l’épaulement, 1 tenu par circlip). Roulement 3 : palier libre, glissant dans son alésage pour absorber la dilatation de l’arbre.',
        'Bearings 1–2: locating pair (outer ring of 2 against the shoulder, 1 held by a circlip). Bearing 3: floating, sliding in its bore to absorb shaft expansion.',
      ),
    );
    note(
      d,
      14,
      ny,
      190,
      l(
        'Porte-joint, entretoise, circlip et bride de roue : pièces de montage proposées (non modélisées en 3D).',
        'Seal carrier, spacer, circlip and runner flange: suggested assembly parts (not modelled in 3D).',
      ),
      { color: COLORS.muted },
    );

    // ---- right column: parts list, fits, torques, assembly
    const X = 224;
    p.text([X, 14], l('NOMENCLATURE', 'PARTS LIST'), { size: 2.4, weight: 'bold' });
    const rows: Text[][] = [
      [
        '1',
        l(`Arbre Ø20 h6 × ${SHAFT.len}, M16 + rainure 6`, `Shaft Ø20 h6 × ${SHAFT.len}, M16 + 6 mm keyway`),
        l('inox 316L rectifié', 'ground 316L'),
        '1',
      ],
      ['2', l('Roulement 1 (côté roue)', 'Bearing 1 (runner side)'), '6204-2RS C3', '1'],
      ['3', l('Roulement 2', 'Bearing 2'), '6204-2RS C3', '1'],
      ['4', l('Roulement 3 (palier libre)', 'Bearing 3 (floating)'), '6204-2RS C3', '1'],
      ['5', l('Joint à lèvre 20 × 35 × 7, double lèvre', 'Lip seal 20 × 35 × 7, double lip'), 'NBR', '1'],
      ['6', l('Porte-joint Ø60, vissé sur la cloison', 'Ø60 seal carrier, screwed on partition'), 'alu 6082', '1'],
      ['7', l('Cartouche Ø124, 6 × M5 sur Ø104', 'Ø124 cartridge, 6 × M5 on Ø104'), 'alu 6082-T6', '1'],
      [
        '8',
        l('Entretoise Ø20 / Ø28 entre bagues int.', 'Ø20 / Ø28 spacer between inner rings'),
        l('acier', 'steel'),
        '1',
      ],
      ['9', l('Cloison étanche ép. 10', '10 mm watertight partition'), 'PMMA', '1'],
      [
        '10',
        l(
          `Moyeu Ø${2 * M.hubR} + bague + ${M.buckets} augets (PL-T03)`,
          `Ø${2 * M.hubR} hub + ring + ${M.buckets} buckets (PL-T03)`,
        ),
        'PETG',
        '1',
      ],
      [
        '11',
        l('Bride + douille Taper-Lock 1108 + clavette 6 × 6', 'Flange + Taper-Lock 1108 bush + 6 × 6 key'),
        l('acier / fonte', 'steel / cast iron'),
        '1',
      ],
      ['12', l('Rondelle + écrou M16 nylstop', 'Washer + M16 nyloc nut'), l('inox A4', 'A4 stainless'), '1'],
      [
        '13',
        l(`Rotor Ø${2 * BELL.r} : cloche, culasse, 14 aimants`, `Ø${2 * BELL.r} rotor: bell, back iron, 14 magnets`),
        l('PETG / acier / N52', 'PETG / steel / N52'),
        '1',
      ],
      [
        '14',
        l('Stator 12 dents, alésage Ø68,4', '12-tooth stator, Ø68.4 bore'),
        l('tôles + cuivre', 'laminations + copper'),
        '1',
      ],
      ['15', l('Flasque arrière ép. 6 + bossage Ø47', '6 mm rear panel + Ø47 boss'), l('imprimé', 'printed'), '1'],
      ['16', l('Chapeau de graisse Ø44', 'Ø44 grease cap'), l('inox', 'stainless'), '1'],
      [
        '17',
        l('Graisseur M6 + V-ring V-20A', 'M6 grease nipple + V-20A V-ring'),
        l('laiton / NBR', 'brass / NBR'),
        '1 + 1',
      ],
    ];
    const rh = 4.1;
    d.table(
      X,
      16,
      [
        { label: l('Rep.', 'Item'), w: 8, align: 'middle' },
        { label: l('Désignation', 'Description'), w: 98 },
        { label: l('Matière / réf.', 'Material / ref.'), w: 64 },
        { label: l('Qté', 'Qty'), w: 11, align: 'end' },
      ],
      rows,
      rh,
    );
    let y = 16 + (rows.length + 1) * rh + 6;
    p.text([X, y - 2], l('AJUSTEMENTS (ISO 286)', 'FITS (ISO 286)'), { size: 2.4, weight: 'bold' });
    const fits: Text[][] = [
      [
        'a',
        l('Arbre / bagues int. 1-2-3', 'Shaft / inner rings 1-2-3'),
        'Ø20 k5',
        '+11 / +2',
        l('bague tournante : léger serrage', 'rotating ring: light press'),
      ],
      [
        'b',
        l('Logement roulements 1-2', 'Bearings 1-2 housing'),
        'Ø47 H7',
        '+25 / 0',
        l('alésé, bague fixe', 'bored, stationary ring'),
      ],
      [
        'c',
        l('Logement roulement 3', 'Bearing 3 housing'),
        'Ø47 H7',
        '+25 / 0',
        l('glissant : palier libre', 'sliding: floating bearing'),
      ],
      [
        'd',
        l('Portée du joint', 'Seal journal'),
        'Ø20 h6',
        '0 / −13',
        l('Ra ≤ 0,4 µm, chanfrein 15°', 'Ra ≤ 0.4 µm, 15° lead-in'),
      ],
      ['e', l('Logement du joint', 'Seal housing'), 'Ø35 H8', '+39 / 0', l('emmanché à la presse', 'pressed in')],
      [
        'f',
        l('Moyeu rotor / arbre', 'Rotor hub / shaft'),
        'Ø20 H7/h6',
        '+21 / −13',
        l('glissant + vis pointeau M6', 'slide fit + M6 set screw'),
      ],
      [
        'g',
        l('Douille conique / arbre', 'Taper bush / shaft'),
        'Ø20 H7/h6',
        '6 P9 / JS9',
        l('clavette 6 × 6 × 30', '6 × 6 × 30 key'),
      ],
    ];
    d.table(
      X,
      y,
      [
        { label: '', w: 6, align: 'middle' },
        { label: l('Portée', 'Seat'), w: 52 },
        { label: l('Ajust.', 'Fit'), w: 23 },
        { label: l('Écarts µm', 'Dev. µm'), w: 23 },
        { label: l('Remarque', 'Note'), w: 77 },
      ],
      fits,
      4.3,
    );
    y += 8 * 4.3 + 6;
    p.text([X, y - 2], l('COUPLES DE SERRAGE', 'TIGHTENING TORQUES'), { size: 2.4, weight: 'bold' });
    const torques: Text[][] = [
      [
        l('Douille Taper-Lock', 'Taper-Lock bush'),
        '2 × 1/4" BSW',
        '5,7 N·m',
        l('à sec, sans graisse', 'dry, no grease'),
      ],
      [l('Écrou de roue', 'Runner nut'), 'M16 A4 nylstop', '40 N·m', l('sécurité axiale', 'axial safety')],
      [l('Cartouche → cloison', 'Cartridge → partition'), '6 × M5 A4', '4 N·m', 'Loctite 243'],
      [l('Bride → moyeu roue', 'Flange → runner hub'), '4 × M5 A4', '3 N·m', 'Loctite 243'],
      [l('Vis pointeau rotor', 'Rotor set screw'), 'M6 A4', '4 N·m', 'Loctite 243'],
    ];
    d.table(
      X,
      y,
      [
        { label: l('Assemblage', 'Joint'), w: 58 },
        { label: l('Visserie', 'Fasteners'), w: 46 },
        { label: l('Couple', 'Torque'), w: 22, align: 'end' },
        { label: l('Frein / remarque', 'Locking / note'), w: 55 },
      ],
      torques,
      4.3,
    );
    y += 6 * 4.3 + 6;
    p.text([X, y - 2], l('MONTAGE', 'ASSEMBLY'), { size: 2.4, weight: 'bold' });
    y += 1;
    const steps: Text[] = [
      l(
        'Emmancher les roulements en appuyant uniquement sur la bague intérieure (tube Ø20/Ø28) ; jamais de coup sur la bague extérieure.',
        'Press the bearings on by the inner ring only (Ø20/Ø28 tube); never strike the outer ring.',
      ),
      l(
        'Monter la cartouche à l’établi (roulements, entretoise, circlip, graisse hydrofuge) puis la visser d’un bloc sur la cloison.',
        'Build the cartridge on the bench (bearings, spacer, circlip, waterproof grease) and bolt it to the partition as one unit.',
      ),
      l(
        'Joint : lèvre et ressort tournés vers l’eau, lèvre graissée, passer l’arbre avec une douille de protection sur la rainure.',
        'Seal: lip and spring facing the water, lip greased, slide the shaft through with a sleeve over the keyway.',
      ),
      l(
        'Flasque arrière en dernier en tournant l’arbre à la main : il doit rester libre.',
        'Rear panel last while turning the shaft by hand: it must stay free.',
      ),
    ];
    steps.forEach((s, i) => {
      y = note(d, X, y, 181, s, { bullet: `${i + 1}.` });
    });
    return d;
  },
};
