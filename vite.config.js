import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSIONS_DIR = resolve(__dirname, 'versions');

const versionEntries = Object.fromEntries(
  readdirSync(VERSIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^v\d+/.test(d.name))
    .map((d) => [d.name, resolve(VERSIONS_DIR, d.name, 'index.html')])
);

export default defineConfig({
  root: 'versions',
  server: {
    port: 8080,
    open: '/',
    strictPort: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(VERSIONS_DIR, 'index.html'),
        ...versionEntries
      }
    }
  }
});
