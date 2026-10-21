import type { L } from '../i18n';
import type { SceneId } from '../three/types';

export type PartCategory = 'hydraulic' | 'mechanical' | 'electrical' | 'structure' | 'site';

export interface Spec {
  label: L;
  value: L | string;
}

/** Catalogue entry for one 3D part (turbine, site or technical room). */
export interface PartInfo {
  id: string;
  scene: SceneId;
  category: PartCategory;
  name: L;
  /** One line: what it does. */
  short: L;
  /** 2–5 sentences: how it works and why it is designed that way. */
  description: L;
  material: L;
  specs: Spec[];
  /** Maintenance advice, if any. */
  maintenance?: L;
  /** Practical tip / common mistake. */
  tip?: L;
  /** Timestamp(s) in the source video where the part is shown or discussed, e.g. "07:38". */
  video?: string[];
  /** Quantity in the assembly (default 1). */
  qty?: number;
  /** Absent = present in both versions. 'v1' = prototype only, 'v2' = industrialised design only. */
  version?: 'v1' | 'v2';
  /** For v2 parts (or parts changed in v2): what changes versus the prototype and why. */
  upgrade?: L;
}

/** V1 (prototype seen in the video) vs V2 (industrialisable, still DIY-friendly) comparison row. */
export interface UpgradeRow {
  id: string;
  area: L;
  v1: L;
  v2: L;
  /** Gain: reliability, assembly time, cost, safety… */
  benefit: L;
  /** How it stays buildable by a maker (tools, sourcing). */
  diy: L;
  /** Part ids to highlight in the 3D view. */
  parts?: string[];
}

/** One step of an assembly or installation guide. `text` may use **bold** around part names. */
export interface GuideStep {
  id: string;
  title: L;
  text: L;
  /** Part ids that get installed during this step (animated into place). */
  parts: string[];
  tools?: L[];
  tip?: L;
  warning?: L;
  /** e.g. "2 N·m" */
  torque?: string;
  /** e.g. "10 min" */
  duration?: string;
  /** Industrialised variant of this step (shown as a "V2 pro" callout when V2 is selected). */
  v2?: { text: L; parts?: string[] };
}

export type PresetId = 'siteA' | 'siteA8' | 'siteB';
export type ScenarioId =
  | 'dryIntake'
  | 'dumpFailure'
  | 'mpptHunting'
  | 'waterHammer'
  | 'longCable'
  | 'winterNight'
  | 'summerDry'
  | 'cloggedScreen';

export interface QuizItem {
  q: L;
  choices: L[];
  answer: number;
  explain: L;
}

export interface Lesson {
  id: string;
  /** Short title shown on the lesson card. */
  title: L;
  /** One-line teaser for the card. */
  summary: L;
  /** Body paragraphs. May use **bold**. Keep each paragraph 2–4 sentences. */
  body: L[];
  /** Key figures shown as chips, e.g. { label: "Head", value: "76 m" }. */
  figures?: Spec[];
  /** Formula shown in a monospace box, e.g. "P = ρ · g · Q · H · η". */
  formula?: string;
  /** What the 3D view focuses on when the lesson opens. */
  focus: { scene: SceneId; part?: string; preset?: PresetId; scenario?: ScenarioId };
  /** Timestamp in the source video. */
  video?: string;
  quiz?: QuizItem[];
}
