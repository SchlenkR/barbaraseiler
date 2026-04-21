import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const VERSIONS_DIR = resolve(__dirname, 'versions');
const MANIFEST = resolve(VERSIONS_DIR, 'manifest.json');
const GEN_SCRIPT = resolve(__dirname, 'scripts/gen-overview.mjs');

function regenerateOverview() {
  execSync(`node "${GEN_SCRIPT}"`, { cwd: __dirname, stdio: 'inherit' });
}

regenerateOverview();

const versionEntries = Object.fromEntries(
  readdirSync(VERSIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^v\d+/.test(d.name))
    .map((d) => [d.name, resolve(VERSIONS_DIR, d.name, 'index.html')])
    .filter(([, path]) => existsSync(path))
);

const overviewRegenPlugin = {
  name: 'barbaraseiler-overview-regen',
  configureServer(server) {
    const trigger = () => {
      try {
        regenerateOverview();
        server.ws.send({ type: 'full-reload', path: '*' });
      } catch (e) {
        server.config.logger.error(`[overview-regen] ${e.message}`);
      }
    };
    server.watcher.add(MANIFEST);
    server.watcher.on('change', (file) => {
      if (file === MANIFEST) trigger();
    });
    server.watcher.on('add', (file) => {
      if (file.startsWith(VERSIONS_DIR) && file.endsWith('/index.html')) trigger();
    });
    server.watcher.on('unlink', (file) => {
      if (file.startsWith(VERSIONS_DIR) && file.endsWith('/index.html')) trigger();
    });
  }
};

export default defineConfig(({ command }) => ({
  root: 'versions',
  base: command === 'build' ? '/barbaraseiler/' : '/',
  plugins: [overviewRegenPlugin],
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
}));
