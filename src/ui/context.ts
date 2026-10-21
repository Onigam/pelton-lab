import { PARTS } from '../data/parts';
import type { PartInfo } from '../data/types';
import type { SimEngine } from '../sim/engine';
import type { Stage } from '../three/core';
import type { SceneId } from '../three/types';
import type { Mode, Store } from './state';

// Glue shared by every panel: navigation between scenes/modes and part selection.

export const VIDEO_ID = '0MixMbSYJ0g';

export function videoUrl(ts: string): string {
  const [m, s] = ts.split(':').map(Number);
  return `https://www.youtube.com/watch?v=${VIDEO_ID}&t=${m * 60 + (s || 0)}s`;
}

const byId = new Map(PARTS.map((p) => [p.id, p]));

export function partInfo(id: string): PartInfo | undefined {
  return byId.get(id);
}

export class AppContext {
  constructor(
    readonly stage: Stage,
    readonly engine: SimEngine,
    readonly store: Store,
  ) {}

  get ui() {
    return this.store.state;
  }

  /** Switch to another 3D world (keeps the current mode when it makes sense). */
  gotoScene(scene: SceneId): void {
    if (scene === this.ui.scene) return;
    const mode: Mode =
      (this.ui.mode === 'assembly' && scene !== 'turbine') || (this.ui.mode === 'install' && scene !== 'site')
        ? 'explore'
        : this.ui.mode;
    this.store.set({ scene, mode, selected: null, isolate: false, explode: 0, upgrade: null });
  }

  setMode(mode: Mode): void {
    const patch: Partial<typeof this.ui> = { mode, playing: false };
    if (mode === 'assembly')
      Object.assign(patch, { scene: 'turbine', step: 0, explode: 0, isolate: false, selected: null });
    if (mode === 'install')
      Object.assign(patch, { scene: 'site', step: 0, explode: 0, isolate: false, selected: null });
    if (mode === 'upgrades') {
      Object.assign(patch, { scene: 'turbine', isolate: false, selected: null });
      if (this.engine.params.version !== 'v2') this.engine.set({ version: 'v2' });
    }
    if (mode !== 'upgrades') patch.upgrade = null;
    this.store.set(patch);
  }

  /** Select a part, switching scene if needed, and frame it. */
  selectPart(id: string | null, opts: { frame?: boolean; mode?: Mode } = {}): void {
    if (id) {
      const info = partInfo(id);
      if (info && info.scene !== this.ui.scene) this.store.set({ scene: info.scene });
      if (info?.version && info.version !== this.engine.params.version && info.scene === 'turbine') {
        this.engine.set({ version: info.version });
      }
    }
    this.store.set({ selected: id, ...(opts.mode ? { mode: opts.mode } : {}) });
    if (id && opts.frame !== false) {
      // wait a frame so a scene switch / version change is applied before measuring
      requestAnimationFrame(() => this.stage.frameParts([id], this.ui.scene === 'site' ? 1.8 : 2.4));
    }
  }
}
