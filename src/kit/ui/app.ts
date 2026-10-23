import { LESSONS } from '../../data/lessons';
import { SHEETS } from '../../drawings';
import { getLang, onLangChange, setLang, tr } from '../i18n';
import { colon, t, type UiKey } from '../../i18n/ui';
import type { SimEngine } from '../../sim/engine';
import type { Season } from '../../sim/types';
import type { Stage } from '../three/core';
import type { SceneId } from '../three/types';
import { AppContext, partInfo } from './context';
import type { DisplayController } from './display';
import { fill, h, icon, ICONS, rich } from './dom';
import { renderGuidePanel } from './panels/guide';
import { lessonsDone, renderAboutPanel, renderLessonsPanel, renderPartsPanel } from './panels/misc';
import { renderPartPanel } from './panels/part';
import { renderPlansPanel } from './panels/plans';
import { SimPanel } from '../../panels/sim';
import { panelEdge } from './panel-size';
import { DrawingViewer } from './viewer';
import type { Mode, Store, UiState } from './state';

// Application shell: header, mode rail, contextual right panel, viewport toolbar and
// the live measurement strip. Wires the store to the 3D stage and the simulation.

const MODES: [Mode, UiKey, keyof typeof ICONS][] = [
  ['explore', 'modeExplore', 'explore'],
  ['assembly', 'modeAssembly', 'assembly'],
  ['install', 'modeInstall', 'install'],
  ['sim', 'modeSim', 'sim'],
  ['plans', 'modePlans', 'plans'],
  ['lessons', 'modeLessons', 'lessons'],
  ['parts', 'modeParts', 'parts'],
  ['about', 'modeAbout', 'about'],
];

const SCENES: [SceneId, UiKey][] = [
  ['site', 'sceneSite'],
  ['intake', 'sceneIntake'],
  ['turbine', 'sceneTurbine'],
  ['techroom', 'sceneTech'],
];

const SPEEDS = [1, 60, 600, 3600];
const SLOWMO: [number, string][] = [
  [1, '×1'],
  [0.2, '×1/5'],
  [0.05, '×1/20'],
  [0.02, '×1/50'],
];

export class App {
  readonly ctx: AppContext;
  private header = h('header', { class: 'topbar' });
  private rail = h('nav', { class: 'rail' });
  private panel = h('aside', { class: 'panel' });
  private panelBody = h('div', { class: 'panel__body' });
  private toolbar = h('div', { class: 'toolbar' });
  private strip = h('footer', { class: 'strip' });
  private stripValues = h('div', { class: 'strip__values' });
  private stripAlarms = h('div', { class: 'strip__alarms', 'aria-live': 'polite' });
  private stripClock = h('div', { class: 'strip__clock' });
  private peek = h('div', { class: 'peek' });
  private panelToggle = h('button', { class: 'panel-toggle' });
  private viewer: DrawingViewer;
  private simPanel: SimPanel;
  private lastStrip = 0;
  private lastAlarmKey = '';
  /** Worlds already framed once (the first visit starts on an overview). */
  private visited = new Set<string>();

  constructor(
    host: HTMLElement,
    viewport: HTMLElement,
    stage: Stage,
    engine: SimEngine,
    private store: Store,
    private display: DisplayController,
  ) {
    this.ctx = new AppContext(stage, engine, store);
    this.visited.add(store.state.scene);
    this.simPanel = new SimPanel(this.ctx);
    this.panel.append(
      panelEdge(),
      h('button', {
        class: 'panel__grip',
        'aria-label': t('menu'),
        onclick: () => store.set({ sheet: !store.state.sheet }),
      }),
      this.panelBody,
    );
    this.viewer = new DrawingViewer(
      () => SHEETS,
      (id) => store.set({ drawing: id }),
    );
    viewport.append(this.toolbar, this.peek, this.panelToggle, this.viewer.el);
    this.panelToggle.addEventListener('click', () => store.set({ panelOpen: !store.state.panelOpen }));
    this.strip.append(this.stripClock, this.stripValues, this.stripAlarms);
    host.append(this.header, this.rail, this.panel, this.strip);

    stage.labelMode = store.state.labels;
    store.on((s, prev) => this.onState(s, prev));
    engine.onChange(() => {
      this.renderHeader();
      if (this.store.state.mode !== 'sim') this.renderPanel();
    });
    onLangChange(() => this.renderAll());
    this.renderAll();
  }

  private onState(s: UiState, prev: UiState): void {
    const stage = this.ctx.stage;
    if (s.scene !== prev.scene) {
      stage.setActive(s.scene);
      if (!this.visited.has(s.scene)) {
        this.visited.add(s.scene);
        requestAnimationFrame(() => stage.frameAll(0.01));
      }
    }
    if (s.selected !== prev.selected || s.scene !== prev.scene) stage.setSelection(s.selected);
    if (s.labels !== prev.labels) {
      stage.labelMode = s.labels;
      stage.refreshLabels();
    }
    if (s.cutaway !== prev.cutaway || s.scene !== prev.scene) this.applyCutaway();
    document.body.classList.toggle('sheet-open', s.sheet);
    document.body.classList.toggle('panel-closed', !s.panelOpen);
    document.body.classList.toggle('mode-plans', s.mode === 'plans');
    if (s.mode === 'plans' && (prev.mode !== 'plans' || s.drawing !== prev.drawing)) this.showDrawing(false);
    if (s.panelOpen !== prev.panelOpen) requestAnimationFrame(() => stage.frameAll(0.4));
    const panelKeys: (keyof UiState)[] = [
      'mode',
      'scene',
      'selected',
      'step',
      'lesson',
      'isolate',
      'playing',
      'ghost',
      'autoFrame',
    ];
    if (panelKeys.some((k) => s[k] !== prev[k])) {
      if (!(s.mode === 'sim' && prev.mode === 'sim' && s.scene === prev.scene)) this.renderPanel();
      this.renderRail();
      this.renderToolbar();
      this.renderHeader();
    } else {
      this.renderToolbar();
    }
    this.renderPeek();
  }

  private applyCutaway(): void {
    const tm = this.ctx.stage.get('turbine') as unknown as { model?: { setCutaway(on: boolean): void } } | undefined;
    tm?.model?.setCutaway(this.store.state.cutaway && this.store.state.scene === 'turbine');
  }

  renderAll(): void {
    document.documentElement.lang = getLang();
    if (this.store.state.mode === 'plans') this.showDrawing(true);
    this.renderHeader();
    this.renderRail();
    this.renderPanel();
    this.renderToolbar();
    this.renderPeek();
    this.ctx.stage.refreshLabels();
  }

  // ------------------------------------------------------------ header

  private renderHeader(): void {
    const s = this.store.state;
    const done = lessonsDone().size;
    fill(
      this.header,
      h(
        'div',
        { class: 'brand' },
        h('img', { src: './favicon.svg', alt: '', width: 34, height: 34 }),
        h('div', {}, h('h1', {}, t('appTitle')), h('p', {}, t('tagline'))),
      ),
      h(
        'div',
        { class: 'segmented scene-switch', role: 'tablist', 'aria-label': 'Scene' },
        ...SCENES.map(([id, key]) =>
          h(
            'button',
            {
              class: s.scene === id ? 'is-active' : '',
              role: 'tab',
              'aria-selected': s.scene === id ? 'true' : 'false',
              onclick: () => this.ctx.gotoScene(id),
            },
            t(key),
          ),
        ),
      ),
      h(
        'div',
        { class: 'topbar__right' },
        h(
          'button',
          { class: 'progress', onclick: () => this.ctx.setMode('lessons') },
          icon(ICONS.lessons, 16),
          h('span', {}, t('modeLessons')),
          h('b', {}, `${done}/${LESSONS.length}`),
          h('i', { style: `--p:${(done / LESSONS.length) * 100}%` }),
        ),
        h(
          'div',
          { class: 'segmented lang-switch' },
          ...(['fr', 'en'] as const).map((l) =>
            h('button', { class: getLang() === l ? 'is-active' : '', onclick: () => setLang(l) }, l.toUpperCase()),
          ),
        ),
      ),
    );
  }

  private renderRail(): void {
    const s = this.store.state;
    fill(
      this.rail,
      ...MODES.map(([mode, key, ic]) =>
        h(
          'button',
          {
            class: `rail__btn ${s.mode === mode ? 'is-active' : ''}`,
            'aria-label': t(key),
            'aria-pressed': s.mode === mode ? 'true' : 'false',
            onclick: () => {
              this.ctx.setMode(mode);
              this.store.set({ sheet: true, panelOpen: true });
            },
          },
          icon(ICONS[ic], 21),
          h('span', {}, t(key)),
        ),
      ),
    );
  }

  private renderPanel(): void {
    const s = this.store.state;
    const body = this.panelBody;
    body.scrollTop = 0;
    switch (s.mode) {
      case 'explore':
        renderPartPanel(this.ctx, body);
        break;
      case 'assembly':
      case 'install':
        renderGuidePanel(this.ctx, body);
        break;
      case 'sim':
        fill(body, this.simPanel.el);
        this.simPanel.render();
        break;
      case 'lessons':
        renderLessonsPanel(this.ctx, body, () => this.renderHeader());
        break;
      case 'parts':
        renderPartsPanel(this.ctx, body);
        break;
      case 'about':
        renderAboutPanel(this.ctx, body);
        break;
      case 'plans':
        renderPlansPanel(this.ctx, body);
        break;
    }
  }

  /** Render the current drawing (keepView: keep zoom/pan, e.g. after a language change). */
  private showDrawing(keepView: boolean): void {
    const sheet = SHEETS.find((x) => x.id === this.store.state.drawing) ?? SHEETS[0];
    this.viewer.show(sheet, keepView);
  }

  // ------------------------------------------------------------ viewport toolbar

  private renderToolbar(): void {
    const s = this.store.state;
    const e = this.ctx.engine;
    const guide = s.mode === 'assembly' || s.mode === 'install';
    const btn = (label: string, on: boolean, click: () => void, extra = '') =>
      h(
        'button',
        { class: `tool ${on ? 'is-on' : ''} ${extra}`, 'aria-pressed': on ? 'true' : 'false', onclick: click },
        label,
      );
    const nextLabels = { main: 'all', all: 'none', none: 'main' } as const;
    const labelKey: Record<UiState['labels'], UiKey> = { main: 'labelsMain', all: 'labelsAll', none: 'labelsNone' };
    const slow = SLOWMO.find(([v]) => v === e.params.slowMo) ?? SLOWMO[0];
    const sel = s.selected;
    fill(
      this.toolbar,
      h(
        'button',
        {
          class: 'tool',
          onclick: () => (this.store.set({ isolate: false }), this.ctx.stage.frameAll()),
          title: t('overviewHint'),
        },
        icon(ICONS.home, 16),
        h('span', {}, t('overviewBtn')),
      ),
      guide
        ? null
        : h(
            'div',
            { class: 'tool tool--range' },
            h(
              'button',
              { class: 'tool__mini', onclick: () => this.store.set({ explode: 0 }), title: t('assemble') },
              '◀',
            ),
            h('label', {}, t('explode')),
            h('input', {
              type: 'range',
              min: 0,
              max: 1,
              step: 0.01,
              value: s.explode,
              'aria-label': t('explode'),
              oninput: (ev: Event) => this.store.set({ explode: Number((ev.target as HTMLInputElement).value) }),
            }),
            h(
              'button',
              { class: 'tool__mini', onclick: () => this.store.set({ explode: 1 }), title: t('disassemble') },
              '▶',
            ),
          ),
      guide || !sel
        ? null
        : btn(t('isolate'), s.isolate, () => {
            this.store.set({ isolate: !s.isolate });
            if (!s.isolate) requestAnimationFrame(() => this.ctx.stage.frameParts([sel], 1.5));
            else this.ctx.stage.frameAll();
          }),
      // in the landscape, X-ray only makes sense around a selected part
      guide || (s.scene === 'site' && !sel) ? null : btn(t('xray'), s.xray, () => this.store.set({ xray: !s.xray })),
      s.scene !== 'site' ? btn(t('cutaway'), s.cutaway, () => this.store.set({ cutaway: !s.cutaway })) : null,
      btn(t('flows'), s.schematic, () => this.store.set({ schematic: !s.schematic })),
      btn(`${t('labels')}${colon()}${t(labelKey[s.labels])}`, s.labels !== 'none', () =>
        this.store.set({ labels: nextLabels[s.labels] }),
      ),
      s.scene !== 'techroom'
        ? btn(`${t('slowMo')} ${slow[1]}`, e.params.slowMo < 1, () => {
            const i = SLOWMO.findIndex(([v]) => v === e.params.slowMo);
            e.set({ slowMo: SLOWMO[(i + 1) % SLOWMO.length][0] });
            this.renderToolbar();
          })
        : null,
    );
  }

  private renderPeek(): void {
    const s = this.store.state;
    fill(this.panelToggle, icon(s.panelOpen ? ICONS.next : ICONS.prev, 16));
    this.panelToggle.setAttribute('aria-label', s.panelOpen ? t('hidePanel') : t('showPanel'));
    this.panelToggle.title = s.panelOpen ? t('hidePanel') : t('showPanel');
    const info = s.selected ? partInfo(s.selected) : undefined;
    // in explore mode the panel already shows the sheet, unless it is collapsed
    const show = !!info && (s.mode !== 'explore' || !s.panelOpen) && s.mode !== 'parts';
    this.peek.classList.toggle('is-visible', show);
    if (!show || !info) return;
    fill(
      this.peek,
      h('b', {}, tr(info.name)),
      h('p', {}, rich(tr(info.short))),
      h(
        'div',
        { class: 'actions' },
        h(
          'button',
          {
            class: 'btn btn--small',
            onclick: () => {
              this.ctx.selectPart(info.id, { mode: 'explore', frame: false });
              this.store.set({ panelOpen: true });
            },
          },
          t('overview'),
        ),
        h(
          'button',
          {
            class: `btn btn--small ${s.isolate ? 'is-on' : ''}`,
            onclick: () => {
              this.store.set({ isolate: !s.isolate });
              requestAnimationFrame(() =>
                s.isolate ? this.ctx.stage.frameAll() : this.ctx.stage.frameParts([info.id], 1.5),
              );
            },
          },
          s.isolate ? t('showAll') : t('isolate'),
        ),
        h(
          'button',
          { class: 'icon-btn', 'aria-label': t('close'), onclick: () => this.store.set({ selected: null }) },
          icon(ICONS.close, 16),
        ),
      ),
    );
  }

  // ------------------------------------------------------------ live strip

  private renderStrip(): void {
    const st = this.ctx.engine.state;
    const p = this.ctx.engine.params;
    const v = (label: string, value: string, unit: string, cls = '') =>
      h('div', { class: `live ${cls}` }, h('span', {}, label), h('b', {}, value, h('small', {}, ` ${unit}`)));
    fill(
      this.stripValues,
      v(t('liveFlow'), st.qPipe.toFixed(2), 'L/s', 'live--water'),
      v(t('livePressure'), st.pressureBar.toFixed(1), 'bar', 'live--water'),
      v(t('liveRpm'), String(Math.round(st.rpm)), 'tr/min'),
      v(t('liveElec'), String(Math.round(st.pToBus)), 'W', 'live--hydro'),
      v(t('liveSoc'), String(Math.round(st.soc * 100)), '%'),
      v(t('livePv'), String(Math.round(st.pPv)), 'W', 'live--pv'),
      v(t('liveLoad'), String(Math.round(st.pLoad)), 'W', 'live--load'),
      v(t('liveDump'), String(Math.round(st.pDump)), 'W', 'live--dump'),
    );
    const hh = Math.floor(st.hour);
    const mm = Math.floor((st.hour % 1) * 60);
    const seasonKey = st.season as Season;
    fill(
      this.stripClock,
      h(
        'button',
        {
          class: 'icon-btn',
          'aria-label': p.running ? t('pause') : t('play'),
          onclick: () => this.ctx.engine.set({ running: !p.running }),
        },
        icon(p.running ? ICONS.pause : ICONS.play, 16),
      ),
      h(
        'div',
        { class: 'clock' },
        h('b', {}, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`),
        h('small', {}, `${t(seasonKey)} · J${st.day + 1}`),
      ),
      h(
        'div',
        { class: 'segmented segmented--tiny', 'aria-label': t('speed') },
        ...SPEEDS.map((sp) =>
          h(
            'button',
            {
              class: p.timeScale === sp ? 'is-active' : '',
              onclick: () => this.ctx.engine.set({ timeScale: sp }),
              title: sp === 1 ? t('realTime') : '',
            },
            sp === 1 ? '×1' : `×${sp}`,
          ),
        ),
      ),
    );
    const key = st.alarms.join(',');
    if (key !== this.lastAlarmKey) {
      this.lastAlarmKey = key;
      const severe = new Set(['air', 'overspeed', 'bmsOpen', 'overpressure', 'surge']);
      fill(
        this.stripAlarms,
        ...(st.alarms.length
          ? st.alarms.map((a) =>
              h(
                'span',
                { class: `alarm ${severe.has(a) ? 'alarm--severe' : ''}` },
                icon(ICONS.warn, 14),
                t(`alarm_${a}` as UiKey),
              ),
            )
          : [h('span', { class: 'alarm alarm--ok' }, icon(ICONS.ok, 14), t('allGood'))]),
      );
    }
  }

  /** Per-frame UI work (throttled). */
  tick(dt: number): void {
    this.lastStrip += dt;
    if (this.lastStrip > 0.2) {
      this.lastStrip = 0;
      this.renderStrip();
    }
    if (this.store.state.mode === 'sim') this.simPanel.tick(dt);
    this.display.update(dt);
  }
}
