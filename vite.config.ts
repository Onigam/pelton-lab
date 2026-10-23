import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /pelton-lab/ and on any static host.
// `@onigam/lab-kit` points at the kit sources while it is incubated in src/kit.
export default defineConfig({
  base: './',
  resolve: { alias: { '@onigam/lab-kit': fileURLToPath(new URL('./src/kit', import.meta.url)) } },
  build: { chunkSizeWarningLimit: 1500 },
});
