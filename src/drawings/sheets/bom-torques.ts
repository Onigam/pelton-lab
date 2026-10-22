// PL-A01 — turbine bill of materials (from the parts catalogue), tightening torques,
// consumables, maker data and the 19-step assembly order (from the assembly guide).
// Torques come from the parts / assembly data where they exist, otherwise they are usual
// values for A4-70 stainless fasteners, reduced on PMMA and printed parts.
import { ASSEMBLY } from '../../data/assembly';
import { PARTS } from '../../data/parts';
import { l, tr, type L } from '../../i18n';
import { COLORS, Drawing, INK, INK_2, W, type Pt, type Text, type View } from '../svg';
import type { DrawingSheet } from '../types';
import { estW, fit, grid, HEAD_FILL, para, wrap, type Cell } from './elec-symbols';

const V2C = COLORS.v2;
const SZ = 1.9;

function lab(
  p: View,
  at: Pt,
  t: Text,
  o: { a?: 'start' | 'middle' | 'end'; c?: string; b?: boolean; s?: number } = {},
): void {
  p.text(at, t, {
    size: o.s ?? SZ,
    anchor: o.a ?? 'start',
    baseline: 'middle',
    color: o.c,
    weight: o.b ? 'bold' : 'normal',
  });
}

/** Reference / standard column of the BOM (dimensions in mm). */
const REF: Record<string, string | L> = {
  base: '580 × 360 × 10',
  partition: '580 × 460 × 8',
  window: '580 × 460 × 8',
  gasket: l('EPDM 10 × 4, ≈ 4 m', 'EPDM 10 × 4, ≈ 4 m'),
  'rear-panel': l('grille Ø100, PE M20', 'Ø100 grille, M20 gland'),
  cover: l('EN AW-5083 H111 ép. 2', 'EN AW-5083 H111 t. 2'),
  'bearing-1': '6204-2RS C3 · 20×47×14',
  'bearing-2': '6204-2RS C3 · 20×47×14',
  'bearing-3': '6204-2RS C3 · 20×47×14',
  seal: 'TC 20 × 35 × 7',
  shaft: 'Ø20 h6 × 400',
  'wheel-hub': 'Ø190 × 12, 4 × M5',
  buckets: l('Ø primitif 230, jeu S/L', 'pitch Ø230, set S/L'),
  'wheel-ring': '22 × M4 A4 + nylstop',
  'wheel-lock': 'Taper-Lock 1108 Ø20 + M16',
  stator: l('12 dents Ø113 × 36', '12 teeth Ø113 × 36'),
  rotor: l('cloche Ø156, 14 pôles', 'Ø156 bell, 14 poles'),
  magnets: 'N52 · 30 × 12 × 5',
  rectifier: '3~ 90 A / 1 600 V',
  terminal: l('16 mm², PE M20 IP68', '16 mm², M20 IP68 gland'),
  cable: 'H1Z2Z2-K 2 × 6 mm²',
  'injector-top': l('buse Ø10 max', 'Ø10 max nozzle'),
  manifold: 'PVC-U Ø50 PN16',
  'valve-branch': 'DN32 PN16',
  gauge: '0–10 bar · Ø63 · 1/4" BSP',
  'valve-main': 'DN50 PN16',
  'penstock-end': 'PE100 Ø63 PN10',
  trestles: l('madriers 75 × 200', '75 × 200 beams'),
  'bearing-block': '2 × 6204 · 6 × M6',
  'injector-side': l('buse Ø6 / Ø8', 'Ø6 / Ø8 nozzle'),
  skid: l('profilés 40 × 40 rainure 8', '40 × 40 slot-8 extrusions'),
  'bearing-cartridge': '6082-T6 · 2 × 6204 · 4 × M6',
  'injector-quick': l('inserts Ø4–10, DN25 PN16', 'Ø4–10 inserts, DN25 PN16'),
  deflector: l('gâche 12 V, < 0,5 s', '12 V latch, < 0.5 s'),
  latches: l('inox 304, ≈ 900 N', '304 stainless, ≈ 900 N'),
  sensors: l('4–20 mA · Hall · CTN 10 kΩ', '4–20 mA · Hall · NTC 10 kΩ'),
  'controller-box': 'IP65 · DIN · 2P 32 A',
  'air-valve': '1/2" BSP PN16',
};

// ------------------------------------------------------------------ BOM

function bom(p: View, v2: boolean): void {
  const parts = PARTS.filter((pt) => pt.scene === 'turbine');
  lab(p, [12, 15.4], l('NOMENCLATURE DE LA TURBINE', 'TURBINE BILL OF MATERIALS'), { b: true, s: 2.1 });
  lab(
    p,
    [228, 15.4],
    l(
      `${parts.length} repères · ● présent dans la version · grisé : hors version ${v2 ? 'V2' : 'V1'}`,
      `${parts.length} items · ● fitted in that version · grey: not in ${v2 ? 'V2' : 'V1'}`,
    ),
    { a: 'end', c: INK_2, s: 1.8 },
  );
  const cols = [
    { label: l('Rep.', 'Item'), w: 9, align: 'middle' as const },
    { label: l('Désignation', 'Part'), w: 52 },
    { label: l('Matière', 'Material'), w: 66 },
    { label: l('Qté', 'Qty'), w: 9, align: 'end' as const },
    { label: l('Référence / dimensions', 'Reference / size'), w: 58 },
    { label: 'V1', w: 11, align: 'middle' as const },
    { label: 'V2', w: 11, align: 'middle' as const },
  ];
  const rows: Cell[][] = parts.map((pt, i) => {
    const inV1 = pt.version !== 'v2';
    const inV2 = pt.version !== 'v1';
    const here = v2 ? inV2 : inV1;
    const color = here ? (pt.version === 'v2' ? V2C : INK) : INK_2;
    const mat = tr(pt.material);
    const ref = REF[pt.id] ?? '';
    return [
      { t: String(i + 1), color },
      { t: fit(tr(pt.name), cols[1].w - 3, SZ, false), color, bold: here },
      { t: fit(mat, cols[2].w - 3, SZ), color },
      { t: String(pt.qty ?? 1), color },
      { t: fit(tr(ref), cols[4].w - 3, SZ), color },
      { t: inV1 ? '●' : '—', color: inV1 ? INK : INK_2 },
      { t: inV2 ? '●' : '—', color: inV2 ? V2C : INK_2 },
    ];
  });
  grid(p, 12, 17.6, cols, rows, { size: SZ, pad: 0.72, lineH: 2.9 });
}

// ------------------------------------------------------------------ torques, consumables, maker data

function torques(p: View, v2: boolean): number {
  const x = 232;
  lab(p, [x, 15.4], l('COUPLES DE SERRAGE', 'TIGHTENING TORQUES'), { b: true, s: 2.1 });
  // [assembly, fastener, torque, note, version, from project data?]
  const rows: [L, string | L, string, L, '' | 'v1' | 'v2', boolean][] = [
    [
      l('Augets / bague de serrage', 'Buckets / clamping ring'),
      '22 × M4 A4 nylstop',
      '2',
      l('en étoile, 3 passes ; recontrôle à 50 h', 'star pattern, 3 passes; re-check at 50 h'),
      '',
      true,
    ],
    [
      l('Moyeu conique', 'Taper-lock bush'),
      '2 × 1/4" BSW',
      '5,7',
      l('cône propre et sec, serrage alterné', 'clean, dry taper, alternate'),
      '',
      true,
    ],
    [
      l('Écrou de bout d’arbre', 'Shaft-end nut'),
      'M16 A4 nylstop',
      '40',
      l('arrêt axial, le cône transmet le couple', 'axial stop, the taper carries the torque'),
      '',
      false,
    ],
    [
      l('Moyeu de roue / bride', 'Hub disc / flange'),
      '4 × M5 A4',
      '3',
      l('disque PETG : couple réduit', 'PETG disc: reduced torque'),
      '',
      false,
    ],
    [
      l('Palier imprimé', 'Printed bearing housing'),
      '6 × M6',
      '3',
      l('à travers la cloison PMMA', 'through the PMMA partition'),
      'v1',
      true,
    ],
    [
      l('Cartouche de palier', 'Bearing cartridge'),
      '4 × M6 A4',
      '3',
      l('bride alu sur PMMA, rondelles larges', 'alu flange on PMMA, large washers'),
      'v2',
      false,
    ],
    [
      l('Stator sur platine', 'Stator on its plate'),
      'M5',
      '4',
      l('centré sur l’arbre', 'centred on the shaft'),
      '',
      true,
    ],
    [
      l('Rotor (cloche)', 'Rotor (bell)'),
      'M5',
      '5',
      l('descente guidée par tige filetée', 'lowered on a threaded rod'),
      '',
      true,
    ],
    [
      l('Bornier, bornes du pont', 'Terminals, bridge lugs'),
      l('vis de borne', 'terminal screws'),
      '1,5–2',
      l('embouts sertis ; resserrer à 1 mois', 'crimped ferrules; re-tighten after 1 month'),
      '',
      true,
    ],
    [
      l('Pont sur dissipateur', 'Bridge on heatsink'),
      '2 × M5',
      '2,5',
      l('pâte thermique ; voir fiche du module', 'thermal paste; see module data sheet'),
      '',
      false,
    ],
    [
      l('Vitre avant', 'Front window'),
      l('M5 A4 + rondelles larges', 'M5 A4 + large washers'),
      '2',
      l('PMMA : jamais plus', 'PMMA: never more'),
      '',
      true,
    ],
    [
      l('Panneau arrière, capot', 'Rear panel, cover'),
      'M5 A4',
      '3',
      l('en V2 le capot passe aux grenouillères', 'in V2 the cover uses toggle latches'),
      '',
      true,
    ],
    [
      l('Châssis-skid', 'Skid frame'),
      l('M8, écrous rainure 8', 'M8, slot-8 T-nuts'),
      '15',
      l('profilés alu 40 × 40', '40 × 40 alu extrusions'),
      'v2',
      false,
    ],
    [
      l('Ancrage châssis', 'Frame anchors'),
      'M10 A4-70',
      '32',
      l('dans béton / dalle', 'into concrete / slab'),
      '',
      false,
    ],
    [
      l('Presse-étoupe M20', 'M20 cable gland'),
      l('corps / chapeau', 'body / cap'),
      '4 / 2,5',
      l('polyamide, selon fabricant', 'polyamide, per maker'),
      '',
      false,
    ],
  ];
  const rowsOut: Cell[][] = rows.map(([what, fast, nm, note, ver, data]) => {
    const here = !ver || (ver === 'v2') === v2;
    const color = here ? (ver === 'v2' ? V2C : INK) : INK_2;
    const tagV = ver ? ` (${ver.toUpperCase()})` : '';
    return [
      { t: l(`${tr(what)}${tagV}`, `${tr(what)}${tagV}`), color, bold: here },
      { t: fast, color },
      {
        t: l(`${nm}${data ? '' : ' *'}`, `${nm.replace(/(\d),(\d)/g, '$1.$2')}${data ? '' : ' *'}`),
        color,
        bold: true,
      },
      { t: note, color },
    ];
  });
  const h = grid(
    p,
    x,
    17.6,
    [
      { label: l('Assemblage', 'Joint'), w: 47 },
      { label: l('Fixation', 'Fastener'), w: 37 },
      { label: 'N·m', w: 18, align: 'end' },
      { label: l('Remarque', 'Note'), w: 74 },
    ],
    rowsOut,
    { size: SZ, pad: 0.6, lineH: 2.85 },
  );
  const y = 17.6 + h + 2.6;
  p.text(
    [x, y],
    l(
      '* valeur usuelle (A4-70, filetage lubrifié) ; sans * : donnée du projet. Réf. A4-70 dans le métal : M5 3,8 · M6 6,5 · M8 16 · M10 32 · M16 135 N·m.',
      '* usual value (A4-70, lubricated thread); no *: project data. A4-70 in metal: M5 3.8 · M6 6.5 · M8 16 · M10 32 · M16 135 N·m.',
    ),
    { size: 1.8, color: INK_2, baseline: 'middle' },
  );
  return y + 2;
}

function consumables(p: View, y0: number): number {
  const x = 232;
  lab(p, [x, y0 + 2.4], l('CONSOMMABLES', 'CONSUMABLES'), { b: true, s: 2.1 });
  const rows: [L, L][] = [
    [
      l('Graisse hydrofuge NLGI 2', 'Water-resistant grease NLGI 2'),
      l('graisseur de la cartouche (V2), lèvres du joint', 'cartridge nipple (V2), seal lips'),
    ],
    [
      l('Pâte anti-grippage', 'Anti-seize paste'),
      l('visserie inox dans l’inox (grippage)', 'stainless into stainless (galling)'),
    ],
    [
      l('Frein-filet moyen (bleu)', 'Medium threadlocker (blue)'),
      l('métal/métal ; jamais sur PMMA : il le fissure', 'metal/metal; never on PMMA: it cracks it'),
    ],
    [
      l('Colle PMMA bi-composant', 'Two-part PMMA cement'),
      l('plaques de la cloison et du socle', 'partition and base plates'),
    ],
    [
      l('Mastic MS-polymère', 'MS-polymer sealant'),
      l('cordon cloison / socle, traversées', 'partition / base bead, pass-throughs'),
    ],
    [
      l('Colle PVC-U pression + décapant', 'PVC-U pressure cement + primer'),
      l('nourrice PN16 : 24 h avant pleine pression', 'PN16 manifold: 24 h before full pressure'),
    ],
    [
      l('Joint EPDM cellulaire 10 × 4', 'Closed-cell EPDM 10 × 4'),
      l('carter, ≈ 4 m, compression 25–30 %', 'housing, ≈ 4 m, 25–30% compression'),
    ],
    [
      l('Époxy structurale', 'Structural epoxy'),
      l('collage des 14 aimants, polarité repérée', 'bonding the 14 magnets, polarity marked'),
    ],
    [
      l('Pâte thermique, vernis classe H', 'Thermal paste, class H varnish'),
      l('pont redresseur ; imprégnation du bobinage', 'bridge rectifier; winding impregnation'),
    ],
    [
      l('Graisse silicone, ruban PTFE', 'Silicone grease, PTFE tape'),
      l('joints toriques, MC4 / IP68 ; filetages BSP', 'O-rings, MC4 / IP68; BSP threads'),
    ],
  ];
  const h = grid(
    p,
    x,
    y0 + 4.6,
    [
      { label: l('Produit', 'Product'), w: 66 },
      { label: l('Usage', 'Use'), w: 110 },
    ],
    rows,
    { size: SZ, pad: 0.6, lineH: 2.85 },
  );
  return y0 + 4.6 + h;
}

function makerData(p: View, y0: number): void {
  const x = 232;
  const y = y0 + 3;
  const box = p.rect([x, y], [408, y + 30], { w: W.thin, color: COLORS.water, fill: '#edf4f9' });
  lab(p, [x + 2, y + 3], l('DONNÉES CONSTRUCTEUR HYDRONOME (site officiel)', 'HYDRONOME MAKER DATA (official site)'), {
    b: true,
    c: COLORS.water,
  });
  const facts: [L, L][] = [
    [
      l('Gamme', 'Range'),
      l(
        '≈ 100 W à 20–25 kW ; alternateur PMA Hydronome 5 000 W nominal',
        '≈ 100 W to 20–25 kW; Hydronome PMA alternator, 5,000 W rated',
      ),
    ],
    [l('Sortie', 'Output'), l('pont triphasé 90 A, connecteurs MC4', '3-phase 90 A bridge, MC4 connectors')],
    [
      l('Roulements', 'Bearings'),
      l('3 SKF en montage opposé, sans entretien (≥ 4 ans)', '3 SKF, opposed mounting, maintenance-free (≥ 4 years)'),
    ],
    [l('Masse', 'Weight'), l('22 kg', '22 kg')],
    [
      l('Prix TTC', 'Price incl. VAT'),
      l(
        'turbine 1 990 € · + délesteur TS-45 et résistances 2 490 € · + TriStar MPPT 45 3 150 € · injecteur variable + 150 €',
        'turbine 1,990 € · + TS-45 diversion and resistor box 2,490 € · + TriStar MPPT 45 3,150 € · variable injector + 150 €',
      ),
    ],
  ];
  let yy = y + 6.4;
  for (const [k, v] of facts) {
    lab(p, [x + 2, yy + 1.2], k, { b: true, s: 1.8 });
    yy += para(p, x + 24, yy, v, 150, { size: 1.8, lineH: 2.75 }) + 0.5;
  }
  box.setAttribute('height', String(yy + 1 - y));
}

// ------------------------------------------------------------------ assembly order strip

function assemblyStrip(p: View, v2: boolean): void {
  const y0 = 197.5;
  lab(
    p,
    [12, y0],
    l(
      `ORDRE DE MONTAGE — ${ASSEMBLY.length} étapes (${v2 ? 'V2' : 'V1'}) · repères = identifiants du modèle 3D${v2 ? ', en violet : propres à la V2' : ''}`,
      `ASSEMBLY ORDER — ${ASSEMBLY.length} steps (${v2 ? 'V2' : 'V1'}) · tags = 3D model ids${v2 ? ', purple: V2 only' : ''}`,
    ),
    { b: true, s: 2.1 },
  );
  const perRow = 10;
  const cw = 396 / perRow;
  const ch = 22.5;
  ASSEMBLY.forEach((st, i) => {
    const x = 12 + (i % perRow) * cw;
    const y = y0 + 2.6 + Math.floor(i / perRow) * (ch + 1.4);
    const parts = v2 && st.v2?.parts ? st.v2.parts : st.parts;
    const added = parts.filter((id) => !st.parts.includes(id));
    p.rect([x, y], [x + cw - 1.4, y + ch], { w: W.thin, fill: i % 2 ? COLORS.paper : '#f4efe4' });
    p.rect([x, y], [x + 5.6, y + 4.4], { w: 0, fill: HEAD_FILL, color: HEAD_FILL });
    lab(p, [x + 2.8, y + 2.3], String(i + 1), { a: 'middle', b: true, s: 2 });
    const tl = wrap(tr(st.title), cw - 9, 1.8, false, true).slice(0, 2);
    tl.forEach((t, k) => p.text([x + 6.6, y + 2.3 + k * 2.75], t, { size: 1.8, weight: 'bold', baseline: 'middle' }));
    let py = y + 8.6;
    const list = parts.length ? parts : [tr(l('(aucune pièce)', '(no part)'))];
    const lines = wrap(list.join(', '), cw - 4.4, 1.8, true).slice(0, 3);
    lines.forEach((t) => {
      // one tspan per id so that the V2-only parts stand out in purple
      const el = p.text([x + 1.6, py], '', {
        size: 1.8,
        mono: true,
        baseline: 'middle',
        color: parts.length ? INK : INK_2,
      });
      t.split(/(?<=, )/).forEach((chunk) => {
        const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        if (added.includes(chunk.replace(/,\s*$/, '').trim())) span.setAttribute('fill', V2C);
        span.textContent = chunk;
        el.append(span);
      });
      py += 2.75;
    });
    const both = [st.torque, st.duration].filter(Boolean).join(' · ');
    const foot = estW(both, 1.8) > cw - 4 ? (st.torque ?? '') : both;
    if (foot) p.text([x + 1.6, y + ch - 1.9], foot, { size: 1.8, baseline: 'middle', color: INK_2 });
  });
}

export const bomTorques: DrawingSheet = {
  id: 'bom-torques',
  number: 'PL-A01',
  group: 'assembly',
  title: l('Nomenclature et couples de serrage', 'Bill of materials and torques'),
  description: l(
    'Nomenclature complète de la turbine, tirée du catalogue des pièces du labo : repère, matière, quantité, référence et présence en V1 ou en V2. À droite, les couples de serrage (réduits sur le PMMA et les pièces imprimées), les consommables et les données publiées par le constructeur. En bas, l’ordre des 19 étapes de montage avec les pièces posées à chacune, selon la version choisie.',
    'Complete bill of materials of the turbine, taken from the lab’s parts catalogue: item, material, quantity, reference and whether it is fitted in V1 or V2. On the right, the tightening torques (reduced on PMMA and printed parts), the consumables and the data published by the maker. At the bottom, the order of the 19 assembly steps with the parts fitted at each one, for the selected version.',
  ),
  scene: 'turbine',
  render(ctx) {
    const v2 = ctx.version === 'v2';
    const d = new Drawing();
    d.frame({
      title: l('Nomenclature et couples de serrage', 'Bill of materials and torques'),
      subtitle: l(
        `Turbine Pelton ${v2 ? 'V2 industrialisée' : 'V1 prototype'} · masse constructeur ≈ 22 kg · Sans échelle`,
        `Pelton turbine ${v2 ? 'V2 industrialised' : 'V1 prototype'} · maker weight ≈ 22 kg · Not to scale`,
      ),
      number: 'PL-A01',
      scale: tr(l('SO', 'NTS')),
    });
    const p = d.paper();
    bom(p, v2);
    const y = torques(p, v2);
    const y2 = consumables(p, y);
    makerData(p, y2);
    assemblyStrip(p, v2);
    p.text(
      [14, 251],
      l(
        'Visserie inox A4 sauf mention. Sur PMMA et pièces imprimées, couples volontairement réduits : serrer à la clé dynamométrique 1–25 N·m.',
        'A4 stainless fasteners unless stated. On PMMA and printed parts torques are deliberately reduced: use a 1–25 N·m torque wrench.',
      ),
      { size: 1.8, color: INK_2, baseline: 'middle' },
    );
    return d;
  },
};
