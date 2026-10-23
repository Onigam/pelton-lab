import * as THREE from 'three';
import { ASSEMBLY } from '../../data/assembly';
import { INSTALL } from '../../data/install';
import type { GuideStep } from '../content/types';
import type { Stage } from '../three/core';
import type { PartDisplay } from '../three/registry';
import { damp, ease } from '../three/util';
import type { SceneId } from '../three/types';
import type { Store } from './state';

// Decides, every frame, how each part of the active scene is shown: solid, ghost,
// wire or hidden, and how far it is exploded. Handles the animated guide steps.

/** Parts made transparent by X-ray when nothing is selected, per world. */
const XRAY_SHELL: Partial<Record<SceneId, (id: string) => boolean>> = {
  // turbine: the housing, to see the runner, shaft line and generator
  turbine: (id) => ['cover', 'rear-panel', 'window', 'partition', 'gasket', 'latches'].includes(id),
  // intake: frame, trough, weir and sand trap walls, to see the water going through the screen
  intake: (id) => ['in-frame', 'in-box', 'in-weir', 'in-sandtrap'].includes(id),
  // power room: every device except the cabling, to read the wiring
  techroom: (id) => id !== 'wiring' && id !== 'busbar',
};
const STEP_ANIM = 1.4;
const AUTOPLAY = 6;

export function guideFor(mode: string, scene: string): GuideStep[] | null {
  if (mode === 'assembly' && scene === 'turbine') return ASSEMBLY;
  if (mode === 'install' && scene === 'site') return INSTALL;
  return null;
}

export class DisplayController {
  private explode = 0;
  private stepKey = '';
  private stepStart = 0;
  private time = 0;

  constructor(
    private stage: Stage,
    private store: Store,
  ) {}

  update(dt: number): void {
    this.time += dt;
    const ui = this.store.state;
    const mod = this.stage.active;
    const reg = mod.registry;
    const guide = guideFor(ui.mode, mod.id);
    let changed = false;
    const show = (id: string, d: PartDisplay) => {
      const before = reg.get(id)?.display;
      if (before !== d) {
        reg.setDisplay(id, d);
        changed = true;
      }
    };

    if (guide) {
      const step = Math.min(ui.step, guide.length - 1);
      const key = `${ui.mode}:${step}`;
      if (key !== this.stepKey) {
        this.stepKey = key;
        this.stepStart = this.time;
        this.onStepChange(guide, step);
      }
      const before = new Set<string>();
      const all = new Set<string>();
      guide.forEach((s, i) => {
        for (const p of s.parts) {
          all.add(p);
          if (i < step) before.add(p);
        }
      });
      const current = new Set(guide[step].parts);
      const k = ease.out(Math.min(1, (this.time - this.stepStart) / STEP_ANIM));
      for (const id of reg.ids()) {
        if (current.has(id)) {
          show(id, 'solid');
          reg.setFactor(id, 1 - k);
        } else if (before.has(id) || !all.has(id)) {
          show(id, 'solid');
          reg.setFactor(id, 0);
        } else {
          show(id, ui.ghost ? 'wire' : 'hidden');
          reg.setFactor(id, 0);
        }
      }
      this.stage.highlight(this.time - this.stepStart < STEP_ANIM + 2.5 ? [...current] : []);
      if (ui.playing && this.time - this.stepStart > AUTOPLAY) {
        if (step < guide.length - 1) this.store.set({ step: step + 1 });
        else this.store.set({ playing: false });
      }
    } else {
      if (this.stepKey) {
        // leaving a guide: drop the step highlight
        this.stepKey = '';
        this.stage.refreshOutline();
      }
      this.explode = damp(this.explode, ui.explode, 6, dt);
      for (const id of reg.ids()) {
        reg.setFactor(id, this.explode);
        let d: PartDisplay = 'solid';
        if (ui.isolate && ui.selected) d = id === ui.selected ? 'solid' : 'hidden';
        else if (ui.xray && ui.selected) d = id === ui.selected ? 'solid' : 'ghost';
        else if (ui.xray && XRAY_SHELL[mod.id]?.(id)) d = 'ghost';
        show(id, d);
      }
    }
    if (changed) {
      this.stage.refreshLabels();
      if (!guide) this.stage.refreshOutline();
    }
  }

  /** Frame the parts of the new step (at their final position). */
  private onStepChange(guide: GuideStep[], step: number): void {
    if (!this.store.state.autoFrame) return;
    const reg = this.stage.active.registry;
    const ids = guide[step].parts.filter((id) => reg.get(id));
    if (!ids.length) {
      this.stage.home();
      return;
    }
    const saved = ids.map((id) => reg.get(id)!.factor);
    ids.forEach((id) => reg.setFactor(id, 0));
    const box = new THREE.Box3();
    for (const id of ids) box.union(reg.bounds(id));
    ids.forEach((id, i) => reg.setFactor(id, saved[i]));
    // keep some context around small parts (a nut should not fill the screen)
    const site = this.stage.active.id === 'site';
    this.stage.frameBox(box, site ? 1.6 : 1.5, 1.1, undefined, site ? 8 : 0.24);
  }
}
