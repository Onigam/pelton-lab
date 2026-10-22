import './styles.css';
import { SimEngine } from './sim/engine';
import { Stage } from './three/core';
import { createIntakeScene } from './three/intake';
import { createSiteScene } from './three/site';
import { createTechRoomScene } from './three/techroom';
import { createTurbineModel, createTurbineScene, inVersion } from './three/turbine';
import type { ViewOpts } from './three/types';
import { App } from './ui/app';
import { DisplayController } from './ui/display';
import { store } from './ui/state';

// Boot: one simulation engine, three 3D worlds sharing one renderer, and the UI shell.

const appEl = document.getElementById('app')!;
const viewport = document.getElementById('viewport')!;

const engine = new SimEngine('siteA');

let app: App | null = null;
const stage = new Stage(viewport, {
  onPick: (id) => app?.ctx.selectPart(id, { frame: false }),
  onHotspot: (hs) => {
    if (!app) return;
    if (hs.goto) app.ctx.gotoScene(hs.goto);
    else app.ctx.selectPart(hs.partId);
  },
  onDoublePick: (id) => {
    if (!app) return;
    // double-click: isolate that part (or come back to the whole device on empty space)
    if (id) {
      app.ctx.selectPart(id, { frame: false });
      store.set({ isolate: true });
      requestAnimationFrame(() => stage.frameParts([id], 1.5));
    } else {
      store.set({ isolate: false, selected: null });
      stage.frameAll();
    }
  },
  onHover: () => {},
});

const turbine = createTurbineScene();
const site = createSiteScene();
// the site gets its own instance of the detailed turbine model, standing on the bank
// (in the site the whole machine is one selectable part: 'turbine')
const siteTurbine = createTurbineModel();
site.attachTurbine(siteTurbine.root);
const siteTurbinePart = site.registry.get('turbine');
/** Show only the parts of the current machine version in the site instance. */
function syncSiteTurbine(): void {
  const shown = siteTurbinePart?.display !== 'hidden';
  for (const p of siteTurbine.registry.parts.values()) {
    const on = shown && inVersion(p.id, engine.params.version);
    for (const m of p.meshes) m.visible = on;
  }
}
const tech = createTechRoomScene();
const intake = createIntakeScene();

stage.register(site);
stage.register(intake);
stage.register(turbine);
stage.register(tech);
stage.setActive(store.state.scene);
// start on an overview of the whole device, sized to the actual viewport
requestAnimationFrame(() => stage.frameAll(0.01));

const display = new DisplayController(stage, engine, store);
// dev-only handle for debugging in the console (stripped from production builds)
if (import.meta.env.DEV) Object.assign(window, { __lab: { stage, engine, store } });
app = new App(appEl, viewport, stage, engine, store, display);

// deep links: #site, #turbine, #techroom, optionally /part-id
function applyHash(): void {
  const [scene, part] = location.hash.replace('#', '').split('/');
  if (scene === 'site' || scene === 'intake' || scene === 'turbine' || scene === 'techroom') {
    store.set({ scene });
    if (part) app!.ctx.selectPart(part);
  }
}
applyHash();
window.addEventListener('hashchange', applyHash);

const view: ViewOpts = { slowMo: 1, cutaway: false, schematic: false, time: 0 };
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  engine.step(dt);
  view.time += dt;
  view.slowMo = engine.params.slowMo;
  view.cutaway = store.state.cutaway;
  view.schematic = store.state.schematic;
  const active = stage.active;
  active.update(engine.state, dt, view);
  if (active.id === 'site') {
    siteTurbine.update(engine.state, dt, view);
    syncSiteTurbine();
  }
  app!.tick(dt);
  // the drawings viewer covers the 3D view: no need to render it meanwhile
  if (store.state.mode !== 'plans') stage.render(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
