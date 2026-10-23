import { bomTorques } from './sheets/bom-torques';
import { generatorWiring } from './sheets/generator-wiring';
import { hydraulicDiagram } from './sheets/hydraulic-diagram';
import { injectors } from './sheets/injectors';
import { intakeSection } from './sheets/intake-section';
import { penstockProfile } from './sheets/penstock-profile';
import { runner } from './sheets/runner';
import { shaftLine } from './sheets/shaft-line';
import { singleLine } from './sheets/single-line';
import { turbineGa } from './sheets/turbine-ga';
import type { DrawingSheet } from '@onigam/lab-kit/drawings';

/** Every drawing of the "Plans" mode, in reading order. */
export const SHEETS: DrawingSheet[] = [
  turbineGa,
  shaftLine,
  runner,
  injectors,
  hydraulicDiagram,
  penstockProfile,
  intakeSection,
  singleLine,
  generatorWiring,
  bomTorques,
];

export function sheetsForPart(id: string): DrawingSheet[] {
  return SHEETS.filter((s) => s.parts?.includes(id));
}
