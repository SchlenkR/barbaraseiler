#!/usr/bin/env node
// Generates versions/index.html from manifest.json + filesystem + git log.
// Convention: any folder in versions/ matching /^v\d+/ with an index.html becomes a card.
// Numbering: explicit "num" field per manifest.versions entry (stable across rebuilds).
// Date display: still derived from first git commit (purely cosmetic, no sort impact).

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERSIONS = join(ROOT, 'versions');
const MANIFEST = join(VERSIONS, 'manifest.json');
const OUT = join(VERSIONS, 'index.html');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

function scanFolders() {
  return readdirSync(VERSIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^v\d+/.test(d.name))
    .map((d) => d.name)
    .filter((name) => existsSync(join(VERSIONS, name, 'index.html')));
}

function firstCommitDate(folder) {
  try {
    const out = execSync(`git log --reverse --format=%aI -- "versions/${folder}/"`, {
      cwd: ROOT,
      encoding: 'utf8'
    });
    return out.split('\n').find((l) => l.trim()) || null;
  } catch {
    return null;
  }
}

const pad2 = (n) => String(n).padStart(2, '0');
const laneKey = (folder) => folder.match(/^(v\d+)/)?.[1] ?? folder;
const laneNum = (lk) => parseInt(lk.slice(1), 10);

function build() {
  const manifest = loadManifest();
  const folders = scanFolders();
  const today = new Date().toISOString();

  const numberOf = {};
  const dateOf = {};
  const seenNums = new Set();
  for (const name of folders) {
    const entry = manifest.versions[name];
    if (!entry) {
      console.warn(`[gen-overview] folder "${name}" missing from manifest.versions — skipping`);
      continue;
    }
    if (typeof entry.num !== 'number') {
      console.warn(`[gen-overview] manifest entry "${name}" missing "num" field`);
      continue;
    }
    if (seenNums.has(entry.num)) {
      console.warn(`[gen-overview] duplicate num ${entry.num} on "${name}"`);
    }
    seenNums.add(entry.num);
    numberOf[name] = '#' + pad2(entry.num);
    const iso = firstCommitDate(name) || today;
    dateOf[name] = iso.slice(0, 10);
  }

  for (const name of Object.keys(manifest.versions)) {
    if (!folders.includes(name)) {
      console.warn(`[gen-overview] manifest entry "${name}" has no matching folder`);
    }
  }

  const childrenOf = {};
  for (const [name, meta] of Object.entries(manifest.versions)) {
    if (!meta.parent) continue;
    (childrenOf[meta.parent] ??= []).push(name);
  }
  for (const k of Object.keys(childrenOf)) {
    childrenOf[k].sort((a, b) => (numberOf[a] ?? '#99') < (numberOf[b] ?? '#99') ? -1 : 1);
  }

  const mainFolderOf = (lk) => {
    if (folders.includes(lk) && manifest.versions[lk] && !manifest.versions[lk].parent) {
      return lk;
    }
    const candidates = folders.filter(
      (f) => laneKey(f) === lk && manifest.versions[f] && !manifest.versions[f].parent
    );
    if (candidates.length > 1) {
      console.warn(`[gen-overview] lane ${lk} has multiple main candidates: ${candidates.join(', ')}`);
    }
    return candidates[0] ?? null;
  };

  const laneEntries = Object.entries(manifest.lanes)
    .filter(([lk]) => mainFolderOf(lk) !== null)
    .sort(([a], [b]) => laneNum(b) - laneNum(a));

  const exists = new Set(folders);

  const renderMainCard = (name, meta) => {
    const phase = meta.phaseTag ? ` · ${meta.phaseTag}` : '';
    const tag = `${numberOf[name]} · ${name}${phase}`;
    return `        <a class="card" href="./${name}/" target="_blank" rel="noopener">
          <div class="card-top">
            <span class="card-tag">${esc(tag)}</span>
            <span class="arrow">→</span>
          </div>
          <h3 class="card-title">${esc(meta.title)}</h3>
          <p class="card-desc">${esc(meta.desc ?? '')}</p>
          <span class="card-meta">Parent: — · Stil: ${esc(meta.style)} · ${dateOf[name]}</span>
          <span class="card-by">${esc(meta.by)}</span>
        </a>`;
  };

  const renderVariantCard = (name, meta, pad) => {
    const tag = `${numberOf[name]} · ${name}`;
    return `${pad}<a class="card variant" href="./${name}/" target="_blank" rel="noopener">
${pad}  <div class="card-top"><span class="card-tag">${esc(tag)}</span><span class="arrow">→</span></div>
${pad}  <h3 class="card-title">${esc(meta.title)}</h3>
${pad}  <span class="card-meta">← ${esc(meta.parent)} · ${esc(meta.style)} · ${dateOf[name]}</span>
${pad}  <span class="card-by">${esc(meta.by)}</span>
${pad}</a>`;
  };

  const renderSubtree = (children) => {
    const items = (children ?? [])
      .filter((c) => exists.has(c) && manifest.versions[c])
      .map((c) => `            <li>${renderVariantCard(c, manifest.versions[c], '              ').trimStart()}</li>`);
    if (items.length === 0) return '';
    return `          <ul class="sub-tree">
${items.join('\n')}
          </ul>`;
  };

  const renderTree = (children) => {
    const items = (children ?? [])
      .filter((c) => exists.has(c) && manifest.versions[c])
      .map((c) => {
        const meta = manifest.versions[c];
        const grand = childrenOf[c] ?? [];
        const card = renderVariantCard(c, meta, '            ').trimStart();
        const sub = renderSubtree(grand);
        if (!sub) return `          <li>${card}</li>`;
        return `          <li>${card}
${sub}
          </li>`;
      });
    if (items.length === 0) return '';
    return `        <ul class="tree">
${items.join('\n')}
        </ul>`;
  };

  const renderLane = (lk, laneMeta) => {
    const mainFolder = mainFolderOf(lk);
    if (!mainFolder) return '';
    const meta = manifest.versions[mainFolder];
    const cls = laneMeta.featured ? 'lane featured' : 'lane';
    const body = [renderMainCard(mainFolder, meta), renderTree(childrenOf[mainFolder] ?? [])].filter(Boolean).join('\n');
    return `    <div class="${cls}" style="--accent: var(--${lk});">
      <div class="lane-num">${pad2(laneNum(lk))}</div>
      <div class="lane-body">
${body}
      </div>
    </div>`;
  };

  const lanesHtml = laneEntries.map(([lk, m]) => renderLane(lk, m)).filter(Boolean).join('\n\n');

  const laneVars = Object.entries(manifest.lanes)
    .sort(([a], [b]) => laneNum(a) - laneNum(b))
    .map(([lk, m]) => `      --${lk}: ${m.color};`)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barbara Sailer · Versions</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,400;9..144,600;9..144,800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0b0c;
      --fg: #f5f3ee;
      --muted: #d6d2c4;
      --dim:   #9b978a;
      --line: #32323a;
${laneVars}
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--fg);
      font-family: "Inter", -apple-system, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      padding: 24px 20px 60px;
    }

    header, footer {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: "JetBrains Mono", monospace;
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      padding: 0 4px;
      max-width: 1400px;
      margin: 0 auto;
    }
    header { margin-bottom: 40px; }
    header .brand { color: var(--fg); display: flex; gap: 14px; align-items: baseline; }
    header .brand span { color: var(--muted); }
    header .clock::before {
      content: "●";
      color: var(--v1);
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    .title-row {
      max-width: 1400px;
      margin: 40px auto 60px;
      padding: 0 4px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 40px;
      flex-wrap: wrap;
    }
    .title-row h1 {
      font-family: "Fraunces", Georgia, serif;
      font-variation-settings: "SOFT" 50, "opsz" 144;
      font-weight: 600;
      font-size: clamp(3rem, 7vw, 6rem);
      line-height: 0.9;
      letter-spacing: -0.04em;
    }
    .title-row h1 em {
      font-style: italic;
      background: linear-gradient(135deg, var(--v3), var(--v5));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .title-row p {
      color: var(--muted);
      max-width: 44ch;
      font-size: 15px;
      line-height: 1.6;
    }

    .lanes {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .lane {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      gap: 24px;
      padding: 24px 24px 24px 20px;
      border: 1px solid var(--line);
      background: #111113;
      border-radius: 4px;
      align-items: stretch;
      position: relative;
    }
    .lane.featured { padding: 32px 32px 32px 24px; grid-template-columns: 104px minmax(0, 1fr); }
    .lane::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--accent);
      opacity: 0.8;
    }

    .lane-num {
      font-family: "Fraunces", Georgia, serif;
      font-variation-settings: "SOFT" 50, "opsz" 144;
      font-weight: 800;
      font-size: 3rem;
      line-height: 0.85;
      color: var(--accent);
      letter-spacing: -0.04em;
      align-self: flex-start;
      padding-top: 6px;
    }
    .lane.featured .lane-num { font-size: 4rem; }

    .lane-body {
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
      gap: 32px;
      min-width: 0;
      align-items: start;
    }
    .lane.featured .lane-body { grid-template-columns: minmax(320px, 400px) minmax(0, 1fr); }

    .tree, .sub-tree {
      list-style: none;
      margin: 0;
      padding: 0 0 0 4px;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .tree > li, .sub-tree > li {
      position: relative;
      padding: 6px 0 6px 32px;
      min-width: 0;
    }
    .tree > li:first-child { padding-top: 0; }
    .tree > li:last-child { padding-bottom: 0; }
    .tree > li::before,
    .sub-tree > li::before {
      content: "";
      position: absolute;
      left: 4px;
      top: 0;
      bottom: 0;
      border-left: 1px dashed var(--accent);
      opacity: 0.55;
    }
    .tree > li:first-child::before { top: 0; }
    .tree > li:last-child::before {
      bottom: auto;
      height: 34px;
    }
    .sub-tree > li:last-child::before {
      bottom: auto;
      height: 30px;
    }
    .tree > li::after,
    .sub-tree > li::after {
      content: "";
      position: absolute;
      left: 4px;
      top: 34px;
      width: 20px;
      height: 1px;
      background: var(--accent);
      opacity: 0.55;
    }
    .sub-tree > li::after { top: 30px; }
    .sub-tree {
      margin-top: 10px;
      padding-left: 4px;
    }
    .tree .card, .sub-tree .card {
      min-height: auto;
      padding: 14px 18px;
      gap: 10px;
    }
    .tree .card-title, .sub-tree .card-title { font-size: 1.05rem; }
    .tree .card.variant::after, .sub-tree .card.variant::after { display: none; }

    .card {
      position: relative;
      padding: 20px 22px;
      background: #1c1c21;
      border: 1px solid var(--line);
      border-radius: 3px;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      min-height: 120px;
      min-width: 0;
      transition: background 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.25s ease;
    }
    .card.variant {
      background: #16161a;
      border-style: dashed;
      border-color: var(--line);
    }
    .card.variant::after {
      content: "";
      position: absolute;
      top: 50%;
      left: -13px;
      width: 12px;
      height: 1px;
      background: var(--accent);
      opacity: 0.4;
    }
    .card:hover {
      background: var(--accent);
      color: #0a0a0a;
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    .card:hover .card-meta,
    .card:hover .card-desc { color: #0a0a0a; }
    .card:hover .card-tag { background: #0a0a0a; color: var(--accent); }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .card-tag {
      font-family: "JetBrains Mono", monospace;
      font-size: 10.5px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: var(--accent);
      color: #0a0a0a;
      padding: 3px 8px;
      border-radius: 2px;
      font-weight: 600;
      transition: background 0.3s, color 0.3s;
      white-space: nowrap;
    }
    .card.variant .card-tag {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
    }
    .arrow {
      font-family: "JetBrains Mono", monospace;
      font-size: 14px;
      color: inherit;
      transition: transform 0.3s ease;
    }
    .card:hover .arrow { transform: translateX(5px); }
    .card-title {
      font-family: "Fraunces", Georgia, serif;
      font-weight: 600;
      font-size: 1.2rem;
      line-height: 1.1;
      letter-spacing: -0.01em;
    }
    .lane.featured .card:not(.variant) .card-title {
      font-size: 1.6rem;
    }
    .card-desc {
      color: #e6e2d4;
      font-size: 13.5px;
      line-height: 1.55;
    }
    .card-meta {
      font-family: "JetBrains Mono", monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .card-by {
      font-family: "JetBrains Mono", monospace;
      font-size: 10.5px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--fg);
      margin-top: 2px;
      font-weight: 500;
    }
    .card-by::before { content: "by "; color: var(--dim); font-weight: 400; }
    .card:hover .card-by { color: #0a0a0a; }
    .card:hover .card-by::before { color: #0a0a0a; opacity: 0.6; }

    .placeholder {
      border: 1px dashed var(--line);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--line);
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.5;
      cursor: default;
      min-height: 120px;
    }

    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--line); }
    footer .hint code {
      color: var(--fg);
      background: #111113;
      padding: 2px 6px;
      border-radius: 2px;
    }

    @media (max-width: 1000px) {
      .lane { grid-template-columns: 50px 1fr; padding: 18px; }
      .lane.featured { padding: 22px; grid-template-columns: 60px 1fr; }
      .lane-body,
      .lane.featured .lane-body { grid-template-columns: 1fr; gap: 20px; }
      .card.variant::after { display: none; }
      .lane-num { font-size: 2.5rem; }
      .lane.featured .lane-num { font-size: 3rem; }
      .title-row { flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <strong>BARBARA&nbsp;SAILER</strong>
      <span>/ VERSIONS INDEX</span>
    </div>
    <div class="clock" id="clock">LIVE</div>
  </header>

  <div class="title-row">
    <h1>Versionen <em>&amp; Branches</em>.</h1>
    <p>${esc(manifest.intro)}</p>
  </div>

  <div class="lanes">

${lanesHtml}

  </div>

  <footer>
    <span class="hint">Neue Variante: <code>cp -r versions/vN versions/vN-label</code> · Routing ergibt sich automatisch via Vite</span>
    <span id="stamp"></span>
  </footer>

  <script>
    const stamp = document.getElementById('stamp');
    const tick = () => {
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      stamp.textContent = \`\${now.toISOString().slice(0,10)} · \${t}\`;
    };
    tick();
    setInterval(tick, 1000);
  </script>
</body>
</html>
`;

  writeFileSync(OUT, html);
  console.log(`[gen-overview] wrote ${OUT} — ${folders.length} versions, ${laneEntries.length} lanes`);
}

build();
