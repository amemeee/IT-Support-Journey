import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

// Two pages: the landing page (index.html) and the simulator (sim.html).
// base './' keeps every link relative, so the build works on GitHub Pages
// whatever the repository name is.
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sim: resolve(import.meta.dirname, 'sim.html')
      }
    }
  }
});
