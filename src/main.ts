import '@onigam/lab-kit/styles.css';
import { mountLab } from '@onigam/lab-kit/ui';
import { pelton } from './lab';

// Boot: the lab definition (simulation, 3D worlds, content) mounted in the kit's application shell.

mountLab(pelton, {
  app: document.getElementById('app')!,
  viewport: document.getElementById('viewport')!,
  expose: import.meta.env.DEV,
});
