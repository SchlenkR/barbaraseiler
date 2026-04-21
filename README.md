# Barbara Sailer — Design Playground

Design-Experimentiergarten für die Website von **Barbara Sophia Sailer**, Mezzosopranistin und Stimmbildnerin in Frankfurt-Niederrad.

**Live**: https://schlenkr.github.io/barbaraseiler/

Jede Variante in `versions/v<N>[-label]/` ist **self-contained**: eigenes HTML, CSS, JS, Impressum und Datenschutz. Die [Overview-Seite](https://schlenkr.github.io/barbaraseiler/) listet alle Würfe mit Parent-Tracking und dient als Einstieg.

## Struktur

```
versions/
├── index.html          # Catalog / Overview
├── v1/                 # Initial static rebuild
├── v1-brutal/          # Swiss Brutalism (variant of v1)
├── v1-noir/            # Cinematic Noir
├── v1-clay/            # Claymorphism
├── v1-swiss/           # Classic Swiss International
├── v2/                 # 9 Sektionen IA
├── v2-bento/           # Apple-Bento Grid
├── v2-wiki/            # Notion-dense Knowledge Base
├── v2-mag/             # Print Magazine
├── v3/                 # Barbara-Stimme (Originalton)
├── v3-kinetic/         # Kinetic Typography (GSAP)
├── v3-collage/         # Paper Scrapbook
├── v3-neobrutal/       # Neo-Brutalism
├── v3-riso/            # Risograph Zine
├── v4/                 # UX-Hierarchie
├── v4-terminal/        # CRT / BBS
├── v4-glass/           # Modern Glassmorphism
├── v4-linear/          # Linear.app Dark
├── v5/                 # Du-Perspektive (Hauptstand)
├── v5-y2k/             # Y2K / Aero / Chrome
├── v5-lenis/           # Smooth-Scroll Cinematic
├── v5-didone/          # Luxury Didone
└── v5-three/           # Three.js WebGL
```

Naming: `v<N>-<label>` — `<N>` ist die Parent-Version, `<label>` der Design-Descriptor.

## Lokal entwickeln

```bash
npm install
npm run dev
# http://localhost:8080
```

Vite entdeckt neue Versionen automatisch über den Regex `/^v\d+/` in `versions/`. Kein Config-Update nötig.

## Neue Variante anlegen

```bash
cp -r versions/v1 versions/v1-<label>
# Datei bearbeiten, fertig. Auto-discovery.
```

## Deployment

Push auf `main` → GitHub Actions baut mit Vite und deployt `dist/` auf GitHub Pages.

## Design-Brief für Agents

Siehe [`DESIGNER_BRIEF.md`](DESIGNER_BRIEF.md) — Projektkontext, Tech-Setup, Constraints, Qualitätsmesslatte.
