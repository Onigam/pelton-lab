import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages under /pelton-lab/ and on any static host.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500 },
});
