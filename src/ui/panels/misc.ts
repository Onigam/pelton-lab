import { UPGRADES } from '../../data/industrialization';
import { LESSONS } from '../../data/lessons';
import { PARTS } from '../../data/parts';
import type { Lesson, PartCategory } from '../../data/types';
import { tr } from '../../i18n';
import { t, type UiKey } from '../../i18n/ui';
import type { SceneId } from '../../three/types';
import { videoUrl, type AppContext } from '../context';
import { fill, h, icon, ICONS, rich } from '../dom';

// Lessons, parts catalogue, V1→V2 comparison and sources.

// ---------------------------------------------------------------- lessons

const DONE_KEY = 'pelton-lab:lessons-done';

export function lessonsDone(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function markDone(id: string): void {
  const done = lessonsDone();
  done.add(id);
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  } catch {
    /* storage unavailable: progress is just not remembered */
  }
}

/** Apply a lesson's focus: scene, preset/scenario, selected part. */
export function openLesson(ctx: AppContext, lesson: Lesson, runScenario: boolean): void {
  const f = lesson.focus;
  if (f.preset) ctx.engine.applyPreset(f.preset);
  if (runScenario && f.scenario) ctx.engine.applyScenario(f.scenario);
  ctx.store.set({ scene: f.scene, lesson: lesson.id, mode: 'lessons', explode: 0, isolate: false });
  if (f.part) ctx.selectPart(f.part, { mode: 'lessons' });
  else ctx.store.set({ selected: null });
}

export function renderLessonsPanel(ctx: AppContext, root: HTMLElement, onProgress: () => void): void {
  const done = lessonsDone();
  const lesson = LESSONS.find((x) => x.id === ctx.ui.lesson);
  if (!lesson) {
    fill(
      root,
      h('div', { class: 'eyebrow eyebrow--accent' }, t('lessonsTitle')),
      h('p', { class: 'lead' }, t('lessonsIntro')),
      h(
        'ol',
        { class: 'lesson-list' },
        ...LESSONS.map((ls, i) =>
          h(
            'li',
            {},
            h(
              'button',
              { class: `lesson-card ${done.has(ls.id) ? 'is-done' : ''}`, onclick: () => openLesson(ctx, ls, false) },
              h('span', { class: 'lesson-card__num' }, String(i + 1).padStart(2, '0')),
              h('span', { class: 'lesson-card__body' }, h('b', {}, tr(ls.title)), h('small', {}, tr(ls.summary))),
              done.has(ls.id) ? icon(ICONS.ok, 18) : icon(ICONS.next, 18),
            ),
          ),
        ),
      ),
    );
    return;
  }

  const idx = LESSONS.indexOf(lesson);
  const quiz = h('div', { class: 'quiz' });
  let correct = 0;
  (lesson.quiz ?? []).forEach((item, qi) => {
    const feedback = h('p', { class: 'quiz__feedback' });
    const choices = h(
      'div',
      { class: 'quiz__choices' },
      ...item.choices.map((c, ci) =>
        h(
          'button',
          {
            class: 'quiz__choice',
            onclick: (ev: Event) => {
              const btn = ev.currentTarget as HTMLButtonElement;
              const ok = ci === item.answer;
              choices.querySelectorAll('button').forEach((b) => b.classList.remove('is-right', 'is-wrong'));
              btn.classList.add(ok ? 'is-right' : 'is-wrong');
              fill(feedback, h('b', {}, ok ? t('correct') : t('wrong')), ' ', rich(tr(item.explain)));
              if (ok && !btn.dataset.counted) {
                btn.dataset.counted = '1';
                correct++;
                if (correct >= (lesson.quiz?.length ?? 0)) {
                  markDone(lesson.id);
                  onProgress();
                }
              }
            },
          },
          tr(c),
        ),
      ),
    );
    quiz.append(
      h(
        'div',
        { class: 'quiz__item' },
        h('p', { class: 'quiz__q' }, `${qi + 1}. `, rich(tr(item.q))),
        choices,
        feedback,
      ),
    );
  });

  fill(
    root,
    h(
      'div',
      { class: 'panel-head' },
      h(
        'button',
        { class: 'btn btn--ghost btn--small', onclick: () => ctx.store.set({ lesson: null }) },
        icon(ICONS.prev, 16),
        t('back'),
      ),
      h('span', { class: 'eyebrow' }, `${idx + 1} / ${LESSONS.length}`),
    ),
    h('h2', { class: 'panel-title' }, tr(lesson.title)),
    h('p', { class: 'lead' }, rich(tr(lesson.summary))),
    lesson.figures?.length
      ? h(
          'div',
          { class: 'figures' },
          ...lesson.figures.map((f) =>
            h('div', { class: 'figure' }, h('b', {}, tr(f.value)), h('span', {}, tr(f.label))),
          ),
        )
      : null,
    lesson.formula ? h('pre', { class: 'formula' }, lesson.formula) : null,
    ...lesson.body.map((p) => h('p', {}, rich(tr(p)))),
    h(
      'div',
      { class: 'actions' },
      lesson.focus.scenario
        ? h(
            'button',
            { class: 'btn btn--primary', onclick: () => openLesson(ctx, lesson, true) },
            icon(ICONS.play, 16),
            t('runScenario'),
          )
        : null,
      lesson.focus.part
        ? h(
            'button',
            { class: 'btn', onclick: () => ctx.selectPart(lesson.focus.part!, { mode: 'lessons' }) },
            icon(ICONS.focus, 16),
            t('showIn3d'),
          )
        : null,
      lesson.video
        ? h(
            'a',
            { class: 'btn btn--ghost', href: videoUrl(lesson.video), target: '_blank', rel: 'noopener noreferrer' },
            icon(ICONS.video, 16),
            `${t('inVideo')} ${lesson.video}`,
          )
        : null,
    ),
    lesson.quiz?.length ? h('h3', { class: 'section-title' }, t('quiz')) : null,
    quiz,
    h(
      'div',
      { class: 'actions' },
      idx > 0
        ? h(
            'button',
            { class: 'btn btn--ghost', onclick: () => openLesson(ctx, LESSONS[idx - 1], false) },
            icon(ICONS.prev, 16),
            t('prev'),
          )
        : null,
      idx < LESSONS.length - 1
        ? h(
            'button',
            {
              class: 'btn',
              onclick: () => (markDone(lesson.id), onProgress(), openLesson(ctx, LESSONS[idx + 1], false)),
            },
            t('next'),
            icon(ICONS.next, 16),
          )
        : null,
    ),
  );
}

// ---------------------------------------------------------------- parts catalogue

let query = '';
let sceneFilter: SceneId | 'all' = 'all';
let catFilter: PartCategory | 'all' = 'all';

const CATS: [PartCategory, UiKey][] = [
  ['hydraulic', 'catHydraulic'],
  ['mechanical', 'catMechanical'],
  ['electrical', 'catElectrical'],
  ['structure', 'catStructure'],
  ['site', 'catSite'],
];

export function renderPartsPanel(ctx: AppContext, root: HTMLElement): void {
  const list = h('div', { class: 'catalogue' });
  const fillList = () => {
    const q = query.trim().toLowerCase();
    const items = PARTS.filter(
      (p) =>
        (sceneFilter === 'all' || p.scene === sceneFilter) &&
        (catFilter === 'all' || p.category === catFilter) &&
        (!q || `${p.id} ${p.name.fr} ${p.name.en} ${p.short.fr} ${p.short.en}`.toLowerCase().includes(q)),
    );
    fill(
      list,
      ...items.map((p) =>
        h(
          'button',
          { class: `cat-row cat-row--${p.category}`, onclick: () => ctx.selectPart(p.id, { mode: 'explore' }) },
          h('i', {}),
          h('span', {}, h('b', {}, tr(p.name)), h('small', {}, tr(p.short))),
          p.version ? h('span', { class: `chip chip--${p.version}` }, p.version.toUpperCase()) : null,
        ),
      ),
    );
  };
  const filterChip = (label: string, active: boolean, on: () => void) =>
    h(
      'button',
      { class: `filter ${active ? 'is-active' : ''}`, onclick: () => (on(), renderPartsPanel(ctx, root)) },
      label,
    );
  fill(
    root,
    h('div', { class: 'eyebrow eyebrow--accent' }, t('partsTitle')),
    h('input', {
      class: 'search',
      type: 'search',
      placeholder: t('search'),
      value: query,
      oninput: (e: Event) => {
        query = (e.target as HTMLInputElement).value;
        fillList();
      },
    }),
    h(
      'div',
      { class: 'filters' },
      filterChip(t('all'), sceneFilter === 'all', () => (sceneFilter = 'all')),
      filterChip(t('sceneSite'), sceneFilter === 'site', () => (sceneFilter = 'site')),
      filterChip(t('sceneIntake'), sceneFilter === 'intake', () => (sceneFilter = 'intake')),
      filterChip(t('sceneTurbine'), sceneFilter === 'turbine', () => (sceneFilter = 'turbine')),
      filterChip(t('sceneTech'), sceneFilter === 'techroom', () => (sceneFilter = 'techroom')),
    ),
    h(
      'div',
      { class: 'filters' },
      filterChip(t('all'), catFilter === 'all', () => (catFilter = 'all')),
      ...CATS.map(([c, key]) => filterChip(t(key), catFilter === c, () => (catFilter = c))),
    ),
    list,
  );
  fillList();
}

// ---------------------------------------------------------------- V1 → V2

export function renderUpgradesPanel(ctx: AppContext, root: HTMLElement): void {
  fill(
    root,
    h('div', { class: 'eyebrow eyebrow--accent' }, t('modeUpgrades')),
    h('h2', { class: 'panel-title' }, t('upgradesTitle')),
    h('p', { class: 'lead' }, t('upgradesIntro')),
    h(
      'div',
      { class: 'upgrades' },
      ...UPGRADES.map((u) =>
        h(
          'button',
          {
            class: `upgrade ${ctx.ui.upgrade === u.id ? 'is-active' : ''}`,
            onclick: () => {
              const on = ctx.ui.upgrade !== u.id;
              ctx.store.set({ upgrade: on ? u.id : null });
              if (on && u.parts?.length) requestAnimationFrame(() => ctx.stage.frameParts(u.parts!, 1.8));
            },
          },
          h('b', { class: 'upgrade__area' }, tr(u.area)),
          h(
            'span',
            { class: 'upgrade__cols' },
            h('span', {}, h('em', {}, t('colV1')), rich(tr(u.v1))),
            h('span', {}, h('em', { class: 'v2' }, t('colV2')), rich(tr(u.v2))),
          ),
          h('span', { class: 'upgrade__gain' }, h('em', {}, t('colBenefit')), rich(tr(u.benefit))),
          h('span', { class: 'upgrade__gain' }, h('em', {}, t('colDiy')), rich(tr(u.diy))),
        ),
      ),
    ),
  );
}

// ---------------------------------------------------------------- sources

const CHAPTERS: [string, string, string][] = [
  [
    '00:00',
    'Introduction : produire de l’électricité avec un filet d’eau',
    'Intro: making power from a trickle of water',
  ],
  ['01:18', 'Conduite forcée, pression, hauteur de chute', 'Penstock, pressure, head'],
  ['04:05', 'Maintenance : coût et durée de vie des roulements', 'Maintenance: bearing cost and life'],
  ['05:07', 'Fabrication : aluminium marin et impression 3D', 'Build: marine aluminium and 3D printing'],
  ['07:38', 'L’injecteur et la gestion du débit', 'The injector and flow control'],
  ['10:24', 'Optimiser et doubler le rendement', 'Optimising and doubling the output'],
  ['11:48', 'Installation mixte solaire + hydro', 'Hybrid solar + hydro installation'],
  ['15:09', 'Prix d’une installation complète', 'Cost of a complete installation'],
  ['16:46', 'Raccordement direct aux batteries', 'Direct battery connection'],
  ['20:00', 'Contacter Hydronome', 'Contacting Hydronome'],
];

export function renderAboutPanel(_ctx: AppContext, root: HTMLElement): void {
  const fr = document.documentElement.lang !== 'en';
  const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  fill(
    root,
    h('div', { class: 'eyebrow eyebrow--accent' }, t('modeAbout')),
    h('h2', { class: 'panel-title' }, t('aboutTitle')),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer'))),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('legal'))),
    h(
      'p',
      {},
      fr ? 'Source principale : ' : 'Main source: ',
      link(
        'https://www.youtube.com/watch?v=0MixMbSYJ0g',
        '« Son invention permet d’être autonome en électricité avec un simple ruisseau ! »',
      ),
      fr
        ? ' — L’ArchiPelle, avec Sylvain (Hydronome, Ariège).'
        : ' — L’ArchiPelle, with Sylvain (Hydronome, Ariège, France).',
    ),
    h('h3', { class: 'section-title' }, t('chapters')),
    h(
      'ul',
      { class: 'chapters' },
      ...CHAPTERS.map(([ts, f, e]) => h('li', {}, link(videoUrl(ts), ts), ' ', fr ? f : e)),
    ),
    h(
      'ul',
      { class: 'links' },
      h(
        'li',
        {},
        link('http://www.hydronome.fr', 'hydronome.fr'),
        fr ? ' — le constructeur des turbines' : ' — the turbine maker',
      ),
      h(
        'li',
        {},
        link(
          'https://www.hydronome.fr/index.php/turbines-pelton/',
          fr ? 'Fiche turbine Pelton Hydronome' : 'Hydronome Pelton turbine page',
        ),
        fr
          ? ' — 5 kW nominal, chute 15–130 m, 1–40 L/s, roue 26 augets Ø244 mm, plans cotés et schémas de principe officiels'
          : ' — 5 kW rated, 15–130 m head, 1–40 L/s, 26-bucket Ø244 mm runner, official dimensioned drawings and wiring principles',
      ),
      h(
        'li',
        {},
        link('http://www.larchipelle.fr', 'larchipelle.fr'),
        fr ? ' — la chaîne du reportage' : ' — the channel behind the report',
      ),
      h(
        'li',
        {},
        link('https://hydroturbine.info/potentiel-energetique-dune-chute-deau/', 'hydroturbine.info'),
        fr ? ' — calculer le potentiel d’une chute' : ' — estimating the potential of a fall',
      ),
      h(
        'li',
        {},
        link('https://learn-arduino-red.vercel.app', 'Learn Arduino'),
        ' · ',
        link('https://sael.net/', 'sael.net'),
        fr ? ' — inspirations pour l’interface' : ' — interface inspirations',
      ),
    ),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  );
}
