import { configureDrawings } from '@onigam/lab-kit/drawings';
import { strL } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import * as THREE from 'three';
import { ASSEMBLY } from './data/assembly';
import { INSTALL } from './data/install';
import { LESSONS } from './data/lessons';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { t } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { SimEngine } from './sim/engine';
import type { Season, SimState } from './sim/types';
import { createIntakeScene } from './three/intake';
import { createSiteScene } from './three/site';
import { createTechRoomScene } from './three/techroom';
import { createTurbineModel, createTurbineScene } from './three/turbine';

// Pelton Lab described to the kit: simulation, 3D worlds, content and the few lab-specific hooks.

configureDrawings({
  project: { fr: 'PELTON LAB — micro-turbine hydroélectrique', en: 'PELTON LAB — micro-hydro turbine' },
  date: '2026-10-22',
});

const engine = new SimEngine('siteA');

const turbine = createTurbineScene();
const site = createSiteScene();
// the site gets its own instance of the detailed turbine model, standing on the bank
// (in the site the whole machine is one selectable part: 'turbine')
const siteTurbine = createTurbineModel();
site.attachTurbine(siteTurbine.root);
const siteTurbinePart = site.registry.get('turbine');
const intake = createIntakeScene();
const tech = createTechRoomScene();

/** Show the site's machine instance only while the 'turbine' part of the site is visible. */
function syncSiteTurbine(): void {
  const shown = siteTurbinePart?.display !== 'hidden';
  for (const p of siteTurbine.registry.parts.values()) {
    for (const m of p.meshes) m.visible = shown;
  }
}

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

function about(ctx: AppContext): HTMLElement[] {
  const fr = document.documentElement.lang !== 'en';
  const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  return [
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
      ...CHAPTERS.map(([ts, f, e]) => h('li', {}, link(ctx.videoUrl(ts), ts), ' ', fr ? f : e)),
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
  ];
}

export const pelton: LabDefinition<SimEngine> = {
  id: 'pelton-lab',
  brand: { title: 'PELTON LAB', tagline: strL('tagline'), icon: './favicon.svg' },
  sim: engine,
  defaultScene: 'site',
  video: { id: '0MixMbSYJ0g' },
  parts: PARTS,
  scenes: [
    {
      id: 'site',
      label: strL('sceneSite'),
      module: site,
      cutaway: false,
      xrayNeedsSelection: true,
      partPadding: 1.8,
      stepFrame: { padding: 1.6, minRadius: 8 },
      overview: {
        title: {
          fr: 'Le site : de la source au watt',
          en: 'The site: from the spring to the watt',
        },
        text: {
          fr: 'Un petit ruisseau de montagne, une **prise d’eau Coanda** qui filtre à 1 mm, une **conduite forcée** qui transforme le dénivelé en pression, la **turbine** au bord de l’eau et le **local technique** où l’énergie est stockée. La hauteur de chute du préréglage déplace la prise d’eau le long du ruisseau.',
          en: 'A small mountain stream, a **Coanda intake** filtering at 1 mm, a **penstock** turning the drop into pressure, the **turbine** by the water and the **power room** where energy is stored. The head of the selected preset moves the intake along the stream.',
        },
        actions: [
          { label: strL('goTurbine'), scene: 'turbine', primary: true },
          { label: strL('goIntake'), scene: 'intake' },
          { label: strL('goTech'), scene: 'techroom' },
        ],
      },
    },
    {
      id: 'intake',
      label: strL('sceneIntake'),
      module: intake,
      xrayShell: (id) => ['in-frame', 'in-box', 'in-weir', 'in-sandtrap'].includes(id),
      overview: {
        title: { fr: 'La prise d’eau Coanda', en: 'The Coanda intake' },
        text: {
          fr: 'Le seuil crée une petite **retenue** ; l’eau dévale la **plaque d’accélération** puis la **grille en fil profilé** : chaque fil découpe une fine lame qui tombe dans le **bac de collecte**, pendant que feuilles et surplus glissent vers le **trop-plein**. Le bac alimente la **conduite forcée** par une crépine immergée. Activez **Flux** pour suivre l’eau et **Coupe** pour voir l’intérieur du bac.',
          en: 'The weir holds a small **pond**; water runs down the **acceleration plate** then over the **wedge-wire screen**: each wire slices off a thin sheet that drops into the **collection trough**, while leaves and surplus slide to the **overflow**. The trough feeds the **penstock** through a submerged strainer. Turn on **Flows** to follow the water and **Section** to see inside the trough.',
        },
      },
    },
    {
      id: 'turbine',
      label: strL('sceneTurbine'),
      module: turbine,
      xrayShell: (id) => ['cover', 'rear-panel', 'window', 'partition', 'gasket', 'latches'].includes(id),
      overview: {
        title: { fr: 'La micro-turbine Pelton', en: 'The Pelton micro-turbine' },
        text: {
          fr: 'Une chambre **humide** où le jet frappe les augets de la roue, une **cloison étanche** en PMMA, et une chambre **sèche** où la génératrice à aimants produit le courant. Carter (574 × 328 × 402 mm) et roue (26 augets, Ø244) reprennent les cotes publiées par le constructeur.',
          en: 'A **wet** chamber where the jet hits the runner buckets, a PMMA **watertight partition**, and a **dry** chamber where the magnet generator makes the current. Housing (574 × 328 × 402 mm) and runner (26 buckets, Ø244) follow the maker’s published dimensions.',
        },
      },
    },
    {
      id: 'techroom',
      label: strL('sceneTech'),
      module: tech,
      slowMo: false,
      xrayShell: (id) => id !== 'wiring' && id !== 'busbar',
      overview: {
        title: { fr: 'Le local technique', en: 'The power room' },
        text: {
          fr: 'Le bus 48 V relie la turbine, les **batteries LiFePO4**, le **régulateur solaire**, l’**onduleur-chargeur** et le **délesteur** qui brûle le surplus dans des résistances : une turbine ne doit jamais tourner à vide.',
          en: 'The 48 V bus links the turbine, the **LiFePO4 batteries**, the **solar charger**, the **inverter/charger** and the **dump load** that burns the surplus in resistors: a turbine must never run unloaded.',
        },
      },
    },
  ],
  partLinks: {
    coanda: { scene: 'intake', label: strL('goIntake') },
    weir: { scene: 'intake', label: strL('goIntake') },
    turbine: { scene: 'turbine', label: strL('goTurbine') },
    techroom: { scene: 'techroom', label: strL('goTech') },
  },
  guides: {
    assembly: { scene: 'turbine', steps: ASSEMBLY },
    install: { scene: 'site', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [
      { id: 'turbine', label: strL('groupTurbine') },
      { id: 'hydraulic', label: strL('groupHydraulic') },
      { id: 'electrical', label: strL('groupElectrical') },
      { id: 'assembly', label: strL('groupAssembly') },
    ],
    intro: strL('plansIntro'),
    footer: () =>
      h(
        'p',
        { class: 'hint' },
        h(
          'a',
          {
            href: 'https://www.hydronome.fr/index.php/turbines-pelton/',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          t('makerSource'),
        ),
      ),
  },
  simPanel: (ctx: AppContext<SimEngine>) => new SimPanel(ctx),
  strip: {
    values: (e) => {
      const st = e.state;
      const v = (label: string, value: string, unit: string, cls = '') => ({ label, value, unit, cls });
      return [
        v(t('liveFlow'), st.qPipe.toFixed(2), 'L/s', 'live--water'),
        v(t('livePressure'), st.pressureBar.toFixed(1), 'bar', 'live--water'),
        v(t('liveRpm'), String(Math.round(st.rpm)), 'tr/min'),
        v(t('liveElec'), String(Math.round(st.pToBus)), 'W', 'live--hydro'),
        v(t('liveSoc'), String(Math.round(st.soc * 100)), '%'),
        v(t('livePv'), String(Math.round(st.pPv)), 'W', 'live--pv'),
        v(t('liveLoad'), String(Math.round(st.pLoad)), 'W', 'live--load'),
        v(t('liveDump'), String(Math.round(st.pDump)), 'W', 'live--dump'),
      ];
    },
    clock: (e) => {
      const st = e.state;
      const hh = Math.floor(st.hour);
      const mm = Math.floor((st.hour % 1) * 60);
      return {
        time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        sub: `${t(st.season as Season)} · J${st.day + 1}`,
      };
    },
    alarms: (e) => {
      const severe = new Set(['air', 'overspeed', 'bmsOpen', 'overpressure', 'surge']);
      return e.state.alarms.map((a) => ({
        key: a,
        label: t(`alarm_${a}` as `alarm_${typeof a}`),
        severe: severe.has(a),
      }));
    },
  },
  about,
  partActions: (ctx, info) =>
    info.id === 'deflector'
      ? [
          h(
            'button',
            {
              class: 'btn btn--primary',
              onclick: () => {
                // look at the blades through the window, then trip once the camera is there
                ctx.stage.frameParts([info.id], 1.7, new THREE.Vector3(-0.25, 0.12, 1));
                setTimeout(() => ctx.sim.testDeflector(), 900);
              },
            },
            icon(ICONS.bolt, 16),
            t('testTrip'),
          ),
        ]
      : [],
  onFrame: ({ sim, dt, view, activeScene }) => {
    if (activeScene === 'site') {
      siteTurbine.update(sim.state as SimState, dt, view);
      syncSiteTurbine();
    }
  },
  onCutaway: (on, scene) => turbine.model.setCutaway(on && scene === 'turbine'),
};
