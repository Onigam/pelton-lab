import type * as THREE from 'three';
import type { L } from '../i18n';
import type { SimState } from '../../sim/types';
import type { PartRegistry } from './registry';

export type SceneId = 'site' | 'intake' | 'turbine' | 'techroom';

/** A clickable label anchored in 3D (Learn-Arduino style dot + caption). */
export interface Hotspot {
  /** Part (or scene) the hotspot selects when clicked. */
  partId: string;
  /** Anchor object: the label follows it (e.g. during explode). */
  anchor: THREE.Object3D;
  label: L;
  /** Optional: jump to another scene when clicked (site -> turbine, site -> techroom). */
  goto?: SceneId;
  /** Secondary label: only shown when "all labels" is on or its part is selected. */
  minor?: boolean;
}

/** Per-frame view options decided by the UI. */
export interface ViewOpts {
  /** Factor applied to visual motion (1 real speed, 0.02 = slow motion). */
  slowMo: number;
  /** Cut the housing / enclosures in half. */
  cutaway: boolean;
  /** Show animated flow overlays (water / electricity). */
  schematic: boolean;
  /** Real elapsed seconds since app start (for shader animation). */
  time: number;
}

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

/** A self-contained 3D world (site, turbine workshop, technical room). */
export interface SceneModule {
  id: SceneId;
  scene: THREE.Scene;
  registry: PartRegistry;
  hotspots: Hotspot[];
  home: CameraPose;
  /** Camera distance limits for the orbit controls. */
  minDistance: number;
  maxDistance: number;
  update(state: SimState, dt: number, view: ViewOpts): void;
}
