import type { L } from '../i18n';
import type { SceneId } from '../three/types';
import type { Drawing } from './svg';

export interface DrawCtx {
  /** Machine version shown by the drawing (V1 prototype / V2 industrialised). */
  version: 'v1' | 'v2';
}

export type SheetGroup = 'turbine' | 'hydraulic' | 'electrical' | 'assembly';

/** One A3 drawing of the "Plans" mode. */
export interface DrawingSheet {
  id: string;
  /** Drawing number shown in the title block, e.g. "PL-T01". */
  number: string;
  group: SheetGroup;
  title: L;
  /** 2–4 sentences shown next to the drawing: what it shows and how to read it. */
  description: L;
  /** 3D world and parts to open from the drawing ("see in 3D"). */
  scene?: SceneId;
  parts?: string[];
  render(ctx: DrawCtx): Drawing;
}
