import * as THREE from 'three';
import { PARTS } from '../../data/parts';
import type { PartInfo } from '../../data/types';
import { tr } from '../../i18n';
import { t, type UiKey } from '../../i18n/ui';
import { sheetsForPart } from '../../drawings';
import { inVersion } from '../../three/turbine';
import type { SceneId } from '../../three/types';
import { partInfo, videoUrl, type AppContext } from '../context';
import { fill, h, icon, ICONS, rich } from '../dom';

// Explore mode: part sheet (Learn-Arduino-like tabs) or scene overview when nothing is selected.

type Tab = 'overview' | 'specs' | 'maintenance' | 'upgrade';

/** Site parts that have their own detailed 3D view. */
const DETAIL_VIEW: Record<string, { scene: SceneId; label: UiKey }> = {
  coanda: { scene: 'intake', label: 'goIntake' },
  weir: { scene: 'intake', label: 'goIntake' },
  turbine: { scene: 'turbine', label: 'goTurbine' },
  techroom: { scene: 'techroom', label: 'goTech' },
};
let tab: Tab = 'overview';

const CAT_KEY: Record<PartInfo['category'], UiKey> = {
  hydraulic: 'catHydraulic',
  mechanical: 'catMechanical',
  electrical: 'catElectrical',
  structure: 'catStructure',
  site: 'catSite',
};

const SCENE_TEXT = {
  site: {
    title: { fr: 'Le site : de la source au watt', en: 'The site: from the spring to the watt' },
    text: {
      fr: 'Un petit ruisseau de montagne, une **prise d’eau Coanda** qui filtre à 1 mm, une **conduite forcée** qui transforme le dénivelé en pression, la **turbine** au bord de l’eau et le **local technique** où l’énergie est stockée. La hauteur de chute du préréglage déplace la prise d’eau le long du ruisseau.',
      en: 'A small mountain stream, a **Coanda intake** filtering at 1 mm, a **penstock** turning the drop into pressure, the **turbine** by the water and the **power room** where energy is stored. The head of the selected preset moves the intake along the stream.',
    },
  },
  intake: {
    title: { fr: 'La prise d’eau Coanda', en: 'The Coanda intake' },
    text: {
      fr: 'Le seuil crée une petite **retenue** ; l’eau dévale la **plaque d’accélération** puis la **grille en fil profilé** : chaque fil découpe une fine lame qui tombe dans le **bac de collecte**, pendant que feuilles et surplus glissent vers le **trop-plein**. Le bac alimente la **conduite forcée** par une crépine immergée. Activez **Flux** pour suivre l’eau et **Coupe** pour voir l’intérieur du bac.',
      en: 'The weir holds a small **pond**; water runs down the **acceleration plate** then over the **wedge-wire screen**: each wire slices off a thin sheet that drops into the **collection trough**, while leaves and surplus slide to the **overflow**. The trough feeds the **penstock** through a submerged strainer. Turn on **Flows** to follow the water and **Section** to see inside the trough.',
    },
  },
  turbine: {
    title: { fr: 'La micro-turbine Pelton', en: 'The Pelton micro-turbine' },
    text: {
      fr: 'Une chambre **humide** où le jet frappe les augets de la roue, une **cloison étanche** en PMMA, et une chambre **sèche** où la génératrice à aimants produit le courant. Basculez V1 / V2 pour comparer le prototype de la vidéo à notre version industrialisable.',
      en: 'A **wet** chamber where the jet hits the runner buckets, a PMMA **watertight partition**, and a **dry** chamber where the magnet generator makes the current. Toggle V1 / V2 to compare the prototype from the video with our industrialisable version.',
    },
  },
  techroom: {
    title: { fr: 'Le local technique', en: 'The power room' },
    text: {
      fr: 'Le bus 48 V relie la turbine, les **batteries LiFePO4**, le **régulateur solaire**, l’**onduleur-chargeur** et le **délesteur** qui brûle le surplus dans des résistances : une turbine ne doit jamais tourner à vide.',
      en: 'The 48 V bus links the turbine, the **LiFePO4 batteries**, the **solar charger**, the **inverter/charger** and the **dump load** that burns the surplus in resistors: a turbine must never run unloaded.',
    },
  },
};

function chips(info: PartInfo): HTMLElement {
  return h(
    'div',
    { class: 'chips' },
    h('span', { class: `chip chip--${info.category}` }, t(CAT_KEY[info.category])),
    info.version === 'v1' ? h('span', { class: 'chip chip--v1' }, t('onlyV1')) : null,
    info.version === 'v2' ? h('span', { class: 'chip chip--v2' }, t('onlyV2')) : null,
    info.qty && info.qty > 1 ? h('span', { class: 'chip' }, `× ${info.qty}`) : null,
  );
}

function envelope(ctx: AppContext, id: string): string | null {
  const box = ctx.stage.active.registry.bounds(id);
  if (box.isEmpty()) return null;
  const s = box.getSize(new THREE.Vector3());
  const big = s.x >= 1 || s.y >= 1 || s.z >= 1;
  const f = (v: number) => (big ? v.toFixed(2) : String(Math.round(v * 1000)));
  return `${f(s.x)} × ${f(s.y)} × ${f(s.z)} ${big ? 'm' : 'mm'}`;
}

function tabBody(ctx: AppContext, info: PartInfo): HTMLElement {
  switch (tab) {
    case 'overview':
      return h(
        'div',
        { class: 'tab-body' },
        h('p', {}, rich(tr(info.description))),
        info.tip
          ? h('div', { class: 'callout callout--tip' }, h('b', {}, t('tip')), h('span', {}, rich(tr(info.tip))))
          : null,
      );
    case 'specs': {
      const env = envelope(ctx, info.id);
      return h(
        'dl',
        { class: 'specs' },
        h('dt', {}, t('material')),
        h('dd', {}, tr(info.material)),
        ...info.specs.flatMap((s) => [h('dt', {}, tr(s.label)), h('dd', {}, tr(s.value))]),
        env ? h('dt', {}, t('dimensions')) : null,
        env ? h('dd', {}, env) : null,
      );
    }
    case 'maintenance':
      return h('div', { class: 'tab-body' }, h('p', {}, info.maintenance ? rich(tr(info.maintenance)) : '—'));
    case 'upgrade':
      return h(
        'div',
        { class: 'tab-body' },
        info.upgrade
          ? h('div', { class: 'callout callout--v2' }, h('span', {}, rich(tr(info.upgrade))))
          : h('p', {}, '—'),
      );
  }
}

export function renderPartPanel(ctx: AppContext, root: HTMLElement): void {
  const id = ctx.ui.selected;
  const info = id ? partInfo(id) : undefined;
  if (!id || !info) {
    renderOverview(ctx, root);
    return;
  }
  const tabs: [Tab, UiKey][] = [
    ['overview', 'overview'],
    ['specs', 'specs'],
    ['maintenance', 'maintenance'],
  ];
  if (info.upgrade) tabs.push(['upgrade', 'upgrade']);
  if (!tabs.some(([k]) => k === tab)) tab = 'overview';

  const rerender = () => renderPartPanel(ctx, root);
  fill(
    root,
    h(
      'div',
      { class: 'panel-head' },
      chips(info),
      h(
        'button',
        { class: 'icon-btn', 'aria-label': t('close'), onclick: () => ctx.selectPart(null, { frame: false }) },
        icon(ICONS.close, 18),
      ),
    ),
    h('h2', { class: 'panel-title' }, tr(info.name)),
    h('p', { class: 'lead' }, rich(tr(info.short))),
    h(
      'div',
      { class: 'tabs', role: 'tablist' },
      ...tabs.map(([k, key]) =>
        h(
          'button',
          {
            class: `tab ${tab === k ? 'is-active' : ''}`,
            role: 'tab',
            'aria-selected': tab === k ? 'true' : 'false',
            onclick: () => {
              tab = k;
              rerender();
            },
          },
          t(key),
        ),
      ),
    ),
    tabBody(ctx, info),
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: `btn ${ctx.ui.isolate ? 'is-on' : ''}`,
          onclick: () => {
            ctx.store.set({ isolate: !ctx.ui.isolate });
            ctx.stage.frameParts([id], 1.5);
          },
        },
        icon(ICONS.isolate, 16),
        ctx.ui.isolate ? t('showAll') : t('isolate'),
      ),
      h('button', { class: 'btn', onclick: () => ctx.stage.frameParts([id], 1.5) }, icon(ICONS.focus, 16), t('focus')),
      ...sheetsForPart(id).map((sheet) =>
        h(
          'button',
          {
            class: 'btn btn--ghost',
            onclick: () => ctx.store.set({ mode: 'plans', drawing: sheet.id, panelOpen: true }),
          },
          icon(ICONS.plans, 16),
          `${sheet.number} · ${tr(sheet.title)}`,
        ),
      ),
      DETAIL_VIEW[id] && ctx.ui.scene === 'site'
        ? h(
            'button',
            { class: 'btn btn--primary', onclick: () => ctx.gotoScene(DETAIL_VIEW[id].scene) },
            t(DETAIL_VIEW[id].label),
          )
        : null,
      ...(info.video ?? [])
        .slice(0, 2)
        .map((ts) =>
          h(
            'a',
            { class: 'btn btn--ghost', href: videoUrl(ts), target: '_blank', rel: 'noopener noreferrer' },
            icon(ICONS.video, 16),
            `${t('inVideo')} ${ts}`,
          ),
        ),
    ),
  );
}

function renderOverview(ctx: AppContext, root: HTMLElement): void {
  const scene = ctx.ui.scene;
  const version = ctx.engine.params.version;
  const txt = SCENE_TEXT[scene];
  const parts = PARTS.filter((p) => p.scene === scene && (scene !== 'turbine' || inVersion(p.id, version)));
  fill(
    root,
    h('h2', { class: 'panel-title' }, tr(txt.title)),
    h('p', { class: 'lead' }, rich(tr(txt.text))),
    scene === 'site'
      ? h(
          'div',
          { class: 'actions' },
          h('button', { class: 'btn btn--primary', onclick: () => ctx.gotoScene('turbine') }, t('goTurbine')),
          h('button', { class: 'btn', onclick: () => ctx.gotoScene('intake') }, t('goIntake')),
          h('button', { class: 'btn', onclick: () => ctx.gotoScene('techroom') }, t('goTech')),
        )
      : null,
    h('h3', { class: 'section-title' }, t('partsInScene'), h('span', { class: 'count' }, String(parts.length))),
    h(
      'div',
      { class: 'part-chips' },
      ...parts.map((p) =>
        h('button', { class: `part-chip part-chip--${p.category}`, onclick: () => ctx.selectPart(p.id) }, tr(p.name)),
      ),
    ),
    h('p', { class: 'hint' }, t('noSelection')),
    h('p', { class: 'hint' }, t('controlsHelp')),
  );
}
