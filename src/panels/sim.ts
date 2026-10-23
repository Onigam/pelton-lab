import type { PresetId, ScenarioId } from '@onigam/lab-kit/content';
import { colon, t, type UiKey } from '../i18n/ui';
import type { NozzleParams, SimParams } from '../sim/presets';
import { G, RHO } from '../sim/physics';
import type { CtrlMode, Season } from '../sim/types';
import { CurveChart, LineChart, SERIES_COLORS, type SeriesDef } from '@onigam/lab-kit/ui';
import type { AppContext } from '@onigam/lab-kit/ui';
import { fill, h, icon, ICONS } from '@onigam/lab-kit/ui';

// Simulation mode: presets & scenarios, grouped controls, live readouts, charts and
// the "where does the energy go" breakdown.

const SCENARIOS: [ScenarioId, { fr: string; en: string }][] = [
  ['dryIntake', { fr: 'Prise d’eau à sec', en: 'Dry intake' }],
  ['cloggedScreen', { fr: 'Grille colmatée', en: 'Clogged screen' }],
  ['waterHammer', { fr: 'Coup de bélier', en: 'Water hammer' }],
  ['mpptHunting', { fr: 'MPPT qui pompe', en: 'MPPT hunting' }],
  ['dumpFailure', { fr: 'Délesteur en panne', en: 'Dump load failure' }],
  ['longCable', { fr: 'Câble de 400 m', en: '400 m cable' }],
  ['winterNight', { fr: 'Nuit d’hiver', en: 'Winter night' }],
  ['summerDry', { fr: 'Été à sec', en: 'Dry summer' }],
];

/** Standard HDPE PE100 PN10 pipes: outer Ø -> bore (mm). */
const PIPES: [number, number][] = [
  [50, 41],
  [63, 55],
  [75, 66],
  [90, 79],
  [110, 97],
];
const PIPE_RAMP = ['#a9d1ea', '#6fb0da', '#3a8fc4', '#1f6fa3', '#124a70'];

export class SimPanel {
  readonly el = h('div', { class: 'sim' });
  private readouts = h('div', { class: 'readouts' });
  private losses = h('div', { class: 'losses' });
  private dynCharts: LineChart[];
  private energyChart: LineChart;
  private socChart: LineChart;
  private curve: CurveChart;
  private sizingInfo = h('p', { class: 'hint' });
  private sizingTable = h('div', { class: 'sizing' });
  private powerFlow: LineChart;
  private lastSlow = 0;
  private lastCharts = 0;

  constructor(private ctx: AppContext) {
    const secs = (v: number) => `${Math.round(v)} s`;
    this.dynCharts = [
      new LineChart({
        height: 64,
        series: [{ key: 'rpm', label: () => t('liveRpm'), color: SERIES_COLORS.load }],
        yFmt: (v) => `${Math.round(v)}`,
        xFmt: secs,
      }),
      new LineChart({
        height: 64,
        series: [{ key: 'p', label: () => t('liveElec'), color: SERIES_COLORS.hydro }],
        yFmt: (v) => `${Math.round(v)} W`,
        xFmt: secs,
      }),
      new LineChart({
        height: 64,
        series: [{ key: 'bar', label: () => t('livePressure'), color: SERIES_COLORS.dump }],
        yFmt: (v) => `${v.toFixed(1)}`,
        xFmt: secs,
      }),
    ];
    const hours = (v: number) => {
      const hh = ((ctx.engine.params.startHour * 3600 + v) / 3600) % 24;
      return `${String(Math.floor(hh)).padStart(2, '0')}:${String(Math.floor((hh % 1) * 60)).padStart(2, '0')}`;
    };
    this.energyChart = new LineChart({
      height: 140,
      series: [
        { key: 'hydro', label: () => t('hydro'), color: SERIES_COLORS.hydro },
        { key: 'pv', label: () => t('livePv'), color: SERIES_COLORS.pv },
        { key: 'load', label: () => t('liveLoad'), color: SERIES_COLORS.load },
        { key: 'dump', label: () => t('liveDump'), color: SERIES_COLORS.dump },
      ],
      yFmt: (v) => `${Math.round(v)} W`,
      xFmt: hours,
    });
    this.socChart = new LineChart({
      height: 80,
      series: [{ key: 'soc', label: () => t('chartSoc'), color: SERIES_COLORS.hydro }],
      yMin: 0,
      yMax: 100,
      yFmt: (v) => `${Math.round(v)} %`,
      xFmt: hours,
    });
    this.curve = new CurveChart(130, { optimum: () => t('optimum'), operating: () => t('operating') });
    this.powerFlow = new LineChart({
      height: 170,
      series: PIPES.map(([od, id], i): SeriesDef => ({
        key: String(id),
        label: () => `PE Ø${od}`,
        color: PIPE_RAMP[i],
      })).concat([
        {
          key: 'current',
          label: () => `${t('current')} (${ctx.engine.params.pipeDiam} mm)`,
          color: SERIES_COLORS.dump,
          dash: true,
        },
      ]),
      yFmt: (v) => `${Math.round(v)} W`,
      xFmt: (v) => `${v.toFixed(1)} L/s`,
      markers: () => {
        const e = ctx.engine;
        const out: { x: number; y?: number; label: string; color?: string }[] = [
          { x: e.availableFlow(), label: `${t('availableFlow')} ${e.availableFlow().toFixed(1)} L/s` },
        ];
        if (e.state.qPipe > 0.02) {
          out.push({ x: e.state.qPipe, y: e.state.pToBus, label: `${Math.round(e.state.pToBus)} W` });
        }
        return out;
      },
    });
  }

  /** Apply a change live. Sliders pass rerender=false so the dragged input survives. */
  private set(patch: Partial<SimParams>, rerender = true): void {
    this.ctx.engine.set({ ...patch, preset: 'custom' });
    if (rerender) this.render();
    else this.tick(1, true);
  }

  private nozzle(which: 'top' | 'side', patch: Partial<NozzleParams>, rerender = true): void {
    const p = this.ctx.engine.params;
    this.set({ [which]: { ...p[which], ...patch } } as Partial<SimParams>, rerender);
  }

  /** Generator constant giving the battery voltage at the optimal runner speed. */
  private matchKe(): number {
    const e = this.ctx.engine;
    const v = e.state.vJet > 1 ? e.state.vJet : 0.98 * Math.sqrt(2 * G * e.params.headGross * 0.95);
    const omega = (0.47 * v) / 0.115;
    const k = e.params.transportHV ? 4 : 1;
    const target = (e.params.ctrlMode === 'fixed' ? e.params.vSet : e.state.vBatt) + 6 * k;
    return Math.round((target / (omega * k)) * 1000) / 1000;
  }

  render(): void {
    const e = this.ctx.engine;
    const p = e.params;
    const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';

    const presetSel = h(
      'select',
      {
        'aria-label': t('preset'),
        onchange: (ev: Event) => {
          e.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.render();
        },
      },
      ...(
        [
          ['siteA', 'presetA'],
          ['siteA8', 'presetA8'],
          ['siteB', 'presetB'],
        ] as [PresetId, UiKey][]
      ).map(([id, key]) => h('option', { value: id, selected: p.preset === id }, t(key))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, t('custom')),
    );

    const slider = (
      key: UiKey,
      value: number,
      min: number,
      max: number,
      step: number,
      fmt: (v: number) => string,
      on: (v: number) => void,
    ) => {
      const out = h('output', {}, fmt(value));
      return h(
        'label',
        { class: 'field' },
        h('span', { class: 'field__label' }, t(key), out),
        h('input', {
          type: 'range',
          min,
          max,
          step,
          value,
          oninput: (ev: Event) => {
            const v = Number((ev.target as HTMLInputElement).value);
            out.textContent = fmt(v);
            on(v);
          },
        }),
      );
    };
    const select = <T extends string | number>(key: UiKey, value: T, options: [T, string][], on: (v: T) => void) =>
      h(
        'label',
        { class: 'field' },
        h('span', { class: 'field__label' }, t(key)),
        h(
          'select',
          {
            onchange: (ev: Event) => {
              const raw = (ev.target as HTMLSelectElement).value;
              on((typeof value === 'number' ? Number(raw) : raw) as T);
            },
          },
          ...options.map(([v, label]) => h('option', { value: String(v), selected: v === value }, label)),
        ),
      );
    const toggle = (label: string, checked: boolean, on: (v: boolean) => void) =>
      h(
        'label',
        { class: 'toggle' },
        h('input', { type: 'checkbox', checked, onchange: (ev: Event) => on((ev.target as HTMLInputElement).checked) }),
        label,
      );
    const section = (key: UiKey, ...children: (HTMLElement | null)[]) =>
      h(
        'details',
        { class: 'sim-section', open: true },
        h('summary', {}, t(key)),
        h('div', { class: 'sim-grid' }, ...children),
      );

    const seasons: [Season, string][] = (['winter', 'spring', 'summer', 'autumn'] as Season[]).map((s) => [s, t(s)]);
    const natural = p.streamOverride === null;

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, t('simTitle')),
      h(
        'div',
        { class: 'sim-top' },
        presetSel,
        h('button', { class: 'btn', onclick: () => (e.reset(), this.render()) }, icon(ICONS.reset, 16), t('reset')),
      ),
      h('div', { class: 'eyebrow' }, t('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIOS.map(([id, label]) =>
          h('button', { class: 'part-chip', onclick: () => (e.applyScenario(id), this.render()) }, label[lang]),
        ),
      ),
      h('div', { class: 'readouts-wrap' }, this.readouts),
      h('div', { class: 'eyebrow' }, t('losses')),
      this.losses,
      h('div', { class: 'eyebrow' }, t('sizingTitle')),
      h('p', { class: 'hint' }, t('sizingIntro')),
      this.sizingInfo,
      this.sizingTable,
      h('div', { class: 'eyebrow' }, t('powerVsFlow')),
      this.powerFlow.el,
      h('p', { class: 'hint' }, t('sizingNote')),
      section(
        'water',
        slider(
          'head',
          p.headGross,
          5,
          150,
          1,
          (v) => `${v} m`,
          (v) => this.set({ headGross: v }, false),
        ),
        slider(
          'pipeLength',
          p.pipeLength,
          10,
          1000,
          5,
          (v) => `${v} m`,
          (v) => this.set({ pipeLength: v }, false),
        ),
        slider(
          'pipeDiam',
          p.pipeDiam,
          20,
          150,
          1,
          (v) => `${v} mm`,
          (v) => this.set({ pipeDiam: v }, false),
        ),
        h(
          'div',
          { class: 'part-chips' },
          ...PIPES.map(([od, id]) =>
            h(
              'button',
              { class: `part-chip ${p.pipeDiam === id ? 'is-on' : ''}`, onclick: () => this.set({ pipeDiam: id }) },
              `PE Ø${od} → ${id}`,
            ),
          ),
        ),
        select('season', p.season, seasons, (v) => this.set({ season: v })),
        toggle(`${t('streamFlow')}${colon()}${t('natural')}`, natural, (v) =>
          this.set({ streamOverride: v ? null : Math.round(e.state.qStream * 10) / 10 }),
        ),
        natural
          ? null
          : slider(
              'streamFlow',
              p.streamOverride ?? 0,
              0,
              8,
              0.1,
              (v) => `${v.toFixed(1)} L/s`,
              (v) => this.set({ streamOverride: v }, false),
            ),
        slider(
          'clog',
          p.screenClog,
          0,
          1,
          0.01,
          (v) => `${Math.round(v * 100)} %`,
          (v) => this.set({ screenClog: v }, false),
        ),
      ),
      section(
        'machine',
        toggle(t('mainValve'), p.mainOpen, (v) => this.set({ mainOpen: v })),
        // the gear-operated valve takes about 20 s; shorten it to see what a sudden closure does
        slider(
          'valveClose',
          p.valveCloseTime,
          0.2,
          30,
          0.2,
          (v) => `${v.toFixed(1)} s`,
          (v) => this.set({ valveCloseTime: v }, false),
        ),
        toggle(t('bypassValve'), p.bypassOpen, (v) => this.set({ bypassOpen: v })),
        toggle(t('topInjector'), p.top.enabled && p.top.open, (v) => this.nozzle('top', { enabled: true, open: v })),
        slider(
          'spearMax',
          p.top.d,
          6,
          14,
          0.5,
          (v) => `Ø ${v} mm`,
          (v) => this.nozzle('top', { d: v }, false),
        ),
        slider(
          'spear',
          p.top.opening,
          0,
          1,
          0.01,
          (v) => `${Math.round(v * 100)} % → Ø ${(p.top.d * Math.sqrt(v)).toFixed(1)} mm`,
          (v) => this.nozzle('top', { opening: v }, false),
        ),
        toggle(t('sideInjector'), p.side.enabled && p.side.open, (v) =>
          this.nozzle('side', { enabled: true, open: v }),
        ),
        slider(
          'nozzle',
          p.side.d,
          3,
          14,
          0.5,
          (v) => `Ø ${v} mm`,
          (v) => this.nozzle('side', { d: v }, false),
        ),
        select(
          'buckets',
          p.bucketSet,
          [
            ['S', t('bucketsS')],
            ['L', t('bucketsL')],
          ],
          (v) => this.set({ bucketSet: v }),
        ),
        toggle(t('wear'), p.bearingWear, (v) => this.set({ bearingWear: v })),
        h(
          'div',
          { class: 'field field--row' },
          slider(
            'ke',
            p.ke,
            0.15,
            1.6,
            0.005,
            (v) => `${v.toFixed(3)} V·s/rad`,
            (v) => this.set({ ke: v }, false),
          ),
          h('button', { class: 'btn btn--small', onclick: () => this.set({ ke: this.matchKe() }) }, t('matchWinding')),
        ),
      ),
      section(
        'electric',
        select<CtrlMode>(
          'ctrlMode',
          p.ctrlMode,
          [
            ['fixed', t('ctrlFixed')],
            ['mppt', t('ctrlMppt')],
            ['direct', t('ctrlDirect')],
          ],
          (v) => this.set({ ctrlMode: v, transportHV: v === 'direct' ? false : p.transportHV }),
        ),
        p.ctrlMode === 'fixed'
          ? h(
              'div',
              { class: 'field field--row' },
              slider(
                'vSet',
                p.vSet,
                p.transportHV ? 160 : 45,
                p.transportHV ? 480 : 120,
                0.5,
                (v) => `${v} V`,
                (v) => this.set({ vSet: v }, false),
              ),
              h(
                'button',
                { class: 'btn btn--small', onclick: () => this.set({ vSet: e.optimalVSet() }) },
                t('optimise'),
              ),
            )
          : null,
        toggle(`${t('transport')}${colon()}${t('hv')}`, p.transportHV, (v) =>
          this.set({
            transportHV: v,
            ctrlMode: v && p.ctrlMode === 'direct' ? 'fixed' : p.ctrlMode,
            vSet: v ? p.vSet * 4 : p.vSet / 4,
          }),
        ),
        slider(
          'cableLength',
          p.cableLength,
          5,
          600,
          5,
          (v) => `${v} m`,
          (v) => this.set({ cableLength: v }, false),
        ),
        select(
          'cableSection',
          p.cableSection,
          [2.5, 4, 6, 10, 16].map((s) => [s, `${s} mm²`] as [number, string]),
          (v) => this.set({ cableSection: v }),
        ),
        toggle(`${t('dump')}${colon()}${p.dumpEnabled ? t('dumpOk') : t('dumpFail')}`, p.dumpEnabled, (v) =>
          this.set({ dumpEnabled: v }),
        ),
        select(
          'battery',
          p.batteryKWh,
          [2.4, 4.8, 7.2, 9.6, 14.4].map((k) => [k, `${k} kWh`] as [number, string]),
          (v) => this.set({ batteryKWh: v }),
        ),
        slider(
          'pv',
          p.pvPeak,
          0,
          9000,
          100,
          (v) => `${(v / 1000).toFixed(1)} kWc`,
          (v) => this.set({ pvPeak: v }, false),
        ),
        select(
          'load',
          p.load,
          [
            ['eco', t('loadEco')],
            ['chalet', t('loadChalet')],
            ['family', t('loadFamily')],
          ],
          (v) => this.set({ load: v }),
        ),
      ),
      h('div', { class: 'eyebrow' }, t('chartDyn')),
      ...this.dynCharts.map((c) => c.el),
      h('div', { class: 'eyebrow' }, t('chartCurve')),
      this.curve.el,
      h('div', { class: 'eyebrow' }, t('chartEnergy')),
      this.energyChart.el,
      h('div', { class: 'eyebrow' }, t('chartSoc')),
      this.socChart.el,
    );
    this.tick(1, true);
  }

  /** Refresh readouts (5 Hz) and charts (2 Hz). */
  tick(dt: number, force = false): void {
    this.lastSlow += dt;
    this.lastCharts += dt;
    if (force || this.lastSlow > 0.2) {
      this.lastSlow = 0;
      this.renderReadouts();
    }
    if (force || this.lastCharts > 0.5) {
      this.lastCharts = 0;
      this.renderCharts();
    }
  }

  private renderReadouts(): void {
    const s = this.ctx.engine.state;
    const cell = (label: string, value: string, unit = '') =>
      h('div', { class: 'readout' }, h('span', {}, label), h('b', {}, value, unit ? h('small', {}, ` ${unit}`) : null));
    const eff = s.pHyd > 1 ? (s.pToBus / (RHO * G * (s.qPipe / 1000) * s.headGross)) * 100 : 0;
    fill(
      this.readouts,
      cell(t('liveFlow'), s.qPipe.toFixed(2), 'L/s'),
      cell(t('liveHead'), s.headNet.toFixed(1), 'm'),
      cell(t('livePressure'), s.pressureBar.toFixed(2), 'bar'),
      cell(t('liveJet'), s.vJet.toFixed(1), 'm/s'),
      cell(t('liveRpm'), Math.round(s.rpm).toString(), 'tr/min'),
      cell('u/v', s.uOverV.toFixed(2)),
      cell(`η ${t('machine').toLowerCase()}`, Math.round(s.etaTurbine * 100).toString(), '%'),
      cell(`η ${t('efficiency').toLowerCase()}`, Math.round(eff).toString(), '%'),
      cell('U', s.vTurbine.toFixed(1), 'V'),
      cell('I', s.iGen.toFixed(1), 'A'),
      cell(t('liveElec'), Math.round(s.pToBus).toString(), 'W'),
      cell(t('today'), s.energyToday.hydro.toFixed(2), 'kWh'),
      cell(`${t('colPHyd')}`, Math.round(s.pHyd).toString(), 'W'),
      cell(`Q ${t('jetTop')}`, s.nozzles[0].q.toFixed(2), 'L/s'),
      cell(`Q ${t('jetSide')}`, s.nozzles[1].q.toFixed(2), 'L/s'),
    );
    this.renderLosses();
  }

  private renderLosses(): void {
    const s = this.ctx.engine.state;
    const q = s.qPipe / 1000;
    const gross = RHO * G * q * s.headGross;
    if (gross < 5) {
      fill(this.losses, h('p', { class: 'hint' }, '—'));
      return;
    }
    const pipe = RHO * G * q * Math.max(0, s.headGross - s.headNet);
    const runner = Math.max(0, s.pHyd - s.pShaft);
    const gen = Math.max(0, s.pShaft - s.pElec);
    const cable = s.pCableLoss;
    const ctrl = Math.max(0, s.pElec - s.pCableLoss - s.pToBus);
    const useful = Math.max(0, s.pToBus);
    const rows: [string, number, string][] = [
      [t('useful'), useful, SERIES_COLORS.hydro],
      [t('lossPipe'), pipe, '#8a6a4f'],
      [t('lossRunner'), runner, '#a9876a'],
      [t('lossGen'), gen, '#c4a789'],
      [t('lossCable'), cable, '#d9c3aa'],
      [t('lossCtrl'), ctrl, '#e8d9c6'],
    ];
    const total = rows.reduce((a, r) => a + r[1], 0) || 1;
    fill(
      this.losses,
      h(
        'div',
        { class: 'loss-bar', role: 'img', 'aria-label': t('losses') },
        ...rows.map(([label, v, c]) =>
          h('span', { style: `flex:${Math.max(v, 0.0001)};background:${c}`, title: `${label} ${Math.round(v)} W` }),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        ...rows.map(([label, v, c]) =>
          h(
            'span',
            {},
            h('i', { style: `background:${c}` }),
            `${label} `,
            h('b', {}, `${Math.round(v)} W`),
            h('small', {}, ` ${Math.round((v / total) * 100)} %`),
          ),
        ),
      ),
    );
  }

  private renderSizing(): void {
    const e = this.ctx.engine;
    const p = e.params;
    const avail = e.availableFlow();
    fill(
      this.sizingInfo,
      `${t('sizingSite')} ${p.headGross} m · PE ${p.pipeDiam} mm × ${p.pipeLength} m · ${t('availableFlow')} `,
      h('b', {}, `${avail.toFixed(2)} L/s`),
    );
    const rows = e.nozzleTable([3, 4, 5, 6, 7, 8, 9, 10, 12, 14]);
    const best = rows
      .filter((r) => r.sustainable)
      .reduce<(typeof rows)[number] | null>((a, r) => (!a || r.pBus > a.pBus ? r : a), null);
    const cur = p.side.enabled ? p.side.d : null;
    const table = h(
      'table',
      {},
      h(
        'thead',
        {},
        h(
          'tr',
          {},
          h('th', {}, t('colNozzle')),
          h('th', {}, `${t('colFlow')} L/s`),
          h('th', {}, `${t('colNetHead')} m`),
          h('th', {}, `${t('colPOut')} W`),
          h('th', {}, t('colEta')),
          h('th', {}, t('colStream')),
        ),
      ),
      h(
        'tbody',
        {},
        ...rows.map((r) =>
          h(
            'tr',
            {
              class: `${r.nozzle === cur ? 'is-current' : ''} ${r === best ? 'is-best' : ''} ${r.sustainable ? '' : 'is-off'}`,
              title: `${t('colPHyd')} ${Math.round(r.pHyd)} W · ${t('liveJet')} ${r.vJet.toFixed(1)} m/s · ${Math.round(r.rpm)} tr/min — ${t('applyNozzle')}`,
              onclick: () => this.applyNozzle(r.nozzle),
            },
            h('td', {}, `Ø${r.nozzle}`, r === best ? h('span', { class: 'star', title: t('bestNozzle') }, '★') : null),
            h('td', {}, r.q.toFixed(2)),
            h('td', {}, r.hn.toFixed(1)),
            h('td', {}, h('b', {}, String(Math.round(r.pBus)))),
            h('td', {}, `${Math.round(r.eta * 100)}%`),
            h('td', {}, r.sustainable ? `✓ ${t('sustainableYes')}` : `✗ ${t('sustainableNo')}`),
          ),
        ),
      ),
    );
    fill(
      this.sizingTable,
      table,
      h('p', { class: 'hint' }, `${t('sizingLegend')} — ★ ${t('bestNozzle')} · ${t('applyNozzle')}`),
    );

    // output power vs flow for each standard pipe and the current one
    const qMax = Math.min(40, Math.max(2, avail * 1.6, e.state.qPipe * 1.6, ...rows.map((r) => r.q)));
    const xs: number[] = [];
    for (let i = 1; i <= 48; i++) xs.push((qMax * i) / 48);
    const ys: Record<string, number[]> = {};
    for (const [, id] of PIPES) ys[String(id)] = xs.map((q) => e.chainFromFlow(q, id, undefined, true)?.pBus ?? NaN);
    ys.current = xs.map((q) => e.chainFromFlow(q, p.pipeDiam, undefined, true)?.pBus ?? NaN);
    this.powerFlow.setData(xs, ys);
    this.powerFlow.draw();
  }

  /** Clicking a sizing row puts that nozzle on the side injector, live. */
  private applyNozzle(d: number): void {
    const p = this.ctx.engine.params;
    this.set({ side: { ...p.side, enabled: true, open: true, d }, bucketSet: d >= 7 ? 'L' : 'S' });
  }

  private renderCharts(): void {
    const e = this.ctx.engine;
    this.renderSizing();
    const dyn = e.dyn;
    if (dyn.length) {
      const t0 = dyn[dyn.length - 1].t;
      const xs = dyn.map((d) => d.t - t0 + 60);
      this.dynCharts[0].setData(xs, { rpm: dyn.map((d) => d.rpm) });
      this.dynCharts[1].setData(xs, { p: dyn.map((d) => d.pElec) });
      this.dynCharts[2].setData(xs, { bar: dyn.map((d) => d.bar) });
    }
    this.dynCharts.forEach((c) => c.draw());
    this.curve.set(e.powerCurve(), [e.state.rpm, e.state.pShaft]);
    this.curve.draw();
    const en = e.energy;
    const xs = en.map((d) => d.t);
    this.energyChart.setData(xs, {
      hydro: en.map((d) => d.hydro),
      pv: en.map((d) => d.pv),
      load: en.map((d) => d.load),
      dump: en.map((d) => d.dump),
    });
    this.energyChart.draw();
    this.socChart.setData(xs, { soc: en.map((d) => d.soc * 100) });
    this.socChart.draw();
  }
}
