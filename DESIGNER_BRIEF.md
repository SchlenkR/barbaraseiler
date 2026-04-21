# Design Brief — Barbara Sailer Website

Du bist Designer*in mit einem Faible für neue Web-Tech (Smooth-Scroll, View Transitions, Three.js, scroll-linked animations, variable fonts, CSS `@container`, `color-mix()` etc.). Deine Aufgabe: **radikal unterschiedliche Entwürfe** für eine existierende Content-Basis. Konservativ bis abgefahren. **Nicht nur Visuals — auch strukturell iterieren** (IA, Section-Reihenfolge, Navigations-Paradigma, Single- vs. Multipage, Dichte vs. Weite).

---

## 1. Kundin

**Barbara Sophia Sailer** — Mezzosopranistin und Stimmbildnerin in Frankfurt-Niederrad. Gesangsunterricht für Anfänger, Aufnahmeprüflinge, Profis, Wiedereinsteiger, Berufsredner*innen (Lehrerinnen, Geistliche, Coaches). Bietet auch therapeutische Stimmarbeit (ISA-Zertifikat, Atemcoach).

**Kernfakten (dürfen nicht variieren):**
- Adresse: Musterstraße 1, 60528 Frankfurt _(Dummy — echte Adresse wird erst kurz vor Go-Live eingetragen, NICHT in Drafts)_
- Telefon: +49 (0)555 – 123 456 7 _(Dummy — echte Nummer wird erst kurz vor Go-Live eingetragen, NICHT in Drafts)_
- E-Mail via Form: `https://formsubmit.co/barbarasailer@web.de`
- WhatsApp: `https://wa.me/495551234567` _(Dummy-Number)_
- Probestunde: 40 € / 45 min · Einzel: 50 € / 45 min oder 60 € / 60 min · 10er-Karte: 11 für 10, ohne Ablauf
- Verkehr: Tram 12, 15, 21 aus der Innenstadt
- Credentials: Staatsexamen Musik (Gesang + Klavier) und Germanistik in Augsburg · Opernschule HfM Würzburg · Meisterkurse (Fassbaender, Deutsch, Ludwig) · BDG-Mitglied · ISA-Zertifikat · Hamburger Stimmsymposium 2022–24 · Liederabend-Reihe „Blutrot" (Würzburger Residenz)

**Pflicht-Pages pro Variante:**
- `index.html` (Hauptseite)
- `impressum.html`
- `datenschutz.html`

---

## 2. Tech-Setup (WICHTIG)

**Repo**: `/Users/ronald/repos/github/barbaraseiler`
**Dev-Server**: `npm run dev` → Vite auf Port 8080 (läuft vermutlich schon).
**Multi-Page Auto-Discovery**: Vite scannt `versions/` nach Ordnern matching `/^v\d+/` und macht sie unter `http://localhost:8080/<folder>/` erreichbar. **Du musst die Vite-Config NICHT anfassen.**

**Self-contained Regel:** Jeder `versions/v<N>-<label>/` Ordner muss komplett eigenständig sein. **Kein shared code.** Jeder Ordner enthält:
```
versions/v<N>-<label>/
├── index.html
├── impressum.html
├── datenschutz.html
├── css/style.css
├── js/main.js       (optional, nur wenn nötig)
└── assets/          (optional)
```

**Dependencies**: ausschließlich via **CDN** (unpkg, jsdelivr, Google Fonts). **Kein npm install**. Beispiele:
- GSAP + ScrollTrigger: `https://unpkg.com/gsap@3/dist/gsap.min.js`
- Lenis (smooth scroll): `https://unpkg.com/@studio-freight/lenis@1/dist/lenis.min.js`
- Three.js: `https://unpkg.com/three@0.160/build/three.module.js` (ESM)
- Splitting.js, Matter.js, p5.js, Tone.js, Anime.js — alle als UMD via unpkg

**Vite HMR funktioniert** — Edits reloaden live.

---

## 3. Naming-Konvention

Aktueller Stand:

- **Hauptversionen** heißen `v<N>`.
- **Unterversionen** hängen per Minus an der Hauptversion: `v<N>-<label>`.
- **Tiefere Unterversionen** bleiben ebenfalls minus-getrennt: `v<N>-<label>-<twist>`.

Beispiele: `v10-dialog`, `v10-dialog-voice`, `v11-checklist`, `v13-weekbook`.

**Parent = die Hauptversion, deren IA-Strang du fortschreibst.** Der Parent beschreibt also inzwischen nicht mehr nur die Phase-1-Ursprünge, sondern die jeweilige strukturelle Familie.

**Bereits vergeben — NICHT dupliziere diese Dialekte:**
- `v1-brutal` → Swiss Brutalism, Acid Green + Hot Pink, IBM Plex Mono
- `v3-kinetic` → Kinetic Typography, GSAP ScrollTrigger, Fraunces variable, Cream/Terracotta
- `v5-y2k` → Y2K / Aero / Chrome-Gradient, Instrument Serif + VT323, Sparkle canvas trail, Glassmorphism

---

## 4. Content-Basis (Parents)

Lies die bestehenden `versions/v1/`, `v2/`, `v3/`, `v4/`, `v5/` index.html für Content und Struktur-Logik. Kurzfassung:

- **v1** — Initial Static-Rebuild. Editorial Light. Einfacher Seitenaufbau. Content-roh.
- **v2** — 9 Sektionen. Neue Informationsarchitektur mit klar getrennten Zweckbereichen.
- **v3** — Barbara-Stimme. Copy im Originalton neu formuliert. Persönlicher, wärmer.
- **v4** — UX-Hierarchie. Layer-Cake-Pattern, progressive disclosure, typografische Hierarchie.
- **v5** — Du-Perspektive. Aktueller Hauptstand. Reader-zentriert, „Du willst singen lernen."

---

## 5. Deine Aufgabe — 15 Varianten

**Pro Parent (v1–v5) drei neue Design-Varianten.** 5 × 3 = 15 total.

Spektrum explizit: **konservativ bis extrem abgefahren.** Pro Parent sollen alle drei Würfe klar voneinander unterscheidbar sein — nicht drei Spielarten derselben Idee.

### Dimensionen, die du variieren sollst

- **Visueller Stil**: Swiss Grid / Magazine / Brutalism / Clay / Glass / Terminal / Risograph / Collage / Luxury-Editorial / Tech-Demo / Memphis / Bauhaus / Y2K-Evolution / Monospace-Doc / …
- **Typografie**: Didone / Humanist Sans / Grotesk / Monospace / Display-Serif / handwritten / variable-font-axes
- **Farbsystem**: duotone, pastell, high-contrast b/w, acidic neon, earth tones, holographic, single-color monochrome
- **Layout-Paradigma**: single-page scroll, multi-page, sidebar-nav, full-bleed immersive, card-grid, magazine-multi-column, bento, split-screen
- **Informationsarchitektur**: dichte IA (viel, klein) vs. radikal reduziert (wenig, groß). Reihenfolge umstellen. Sections zusammenlegen/aufteilen. Nav anders strukturieren.
- **Interaktion**: scroll-linked animation, hover states, page transitions, cursor-follow effects (aber **kein custom-rendered Cursor-Pointer** — siehe Constraint), parallax, morphing shapes, sound (nur wenn wirklich passend)
- **Tech-Showcase**: Three.js 3D-Hero, Lenis Smooth-Scroll, View Transitions API, CSS Scroll-Driven Animations, Canvas effects, SVG-Morphing

### Beispielrichtungen (Inspiration, nicht zwingend)

```
v1-noir      Cinematic B/W, Bodoni XXL, letterboxing, slow fades
v1-clay      Claymorphism, soft 3D, pastel rounded
v1-swiss     Strenges 12-col Grid, Helvetica Now, Tabellen

v2-wiki      Notion/Wiki-dicht, Sidebar-Nav, Inter+Source Serif
v2-bento     Apple-Bento, Pastell-Blöcke, Icon-Cards
v2-mag       Magazine, Drop Caps, Multi-Column, Serif-heavy

v3-collage   Paper-Texturen, handschriftliche Marginalien, Polaroids
v3-neobrutal Flache Knallfarben, dicke Borders, Archivo Black
v3-riso      Risograph-Print, Grain, Halftone, Duotone

v4-terminal  CRT/BBS, Scanlines, ASCII, Mono everything
v4-glass     iOS-26 Glass-Panels (modern, nicht Y2K), Depth-Layers
v4-linear    Linear.app-dark, subtile Gradients, sharp edges

v5-lenis     Smooth-Scroll (Lenis), scroll-linked Reveals, image-heavy
v5-didone    Luxury Editorial (Hermès-esque), Didone XXL, viel Weißraum
v5-three     Three.js Hero, isometrische 3D-Tiefe
```

Du darfst davon abweichen. Das sind Vorschläge, keine Vorgaben.

---

## 6. Harte Constraints

- **Kein custom-rendered Maus-Cursor.** Native Pointer only. (Mouse-Trails / Sparkles / Follow-Effects sind OK — aber der Pointer selbst bleibt normal.)
- **Funktionierende Navigation**: Alle Links (`#anchor`, `impressum.html`, `datenschutz.html`) müssen auflösen.
- **WhatsApp + Form** müssen funktionieren (URL/endpoint s.o.).
- **Telefonnummer** darf als "reveal on click" verschleiert bleiben (Spam-Schutz-Pattern).
- **Accessibility**: Semantisches HTML, alt-Texte, kontrastreiche Farben, `prefers-reduced-motion` respektieren für schwere Animationen.
- **Deutsch als Content-Sprache.** Code-Kommentare Englisch.
- **Mobile**: Min. funktional bei 375px Viewport. Muss nicht perfekt designed sein, aber nicht kaputt.

---

## 7. Workflow

1. **Lies** `versions/v<Parent>/index.html` für Content + Struktur der Ausgangsversion.
2. **Entscheide** Design-Dialekt und IA-Twist für deinen Wurf.
3. **Baue** den neuen Ordner `versions/v<N>-<label>/` komplett aus — index + impressum + datenschutz + css (+ js).
4. **Trage die Variante ein** in `versions/index.html`: neue `<a class="card variant">` in die passende Lane. Schema siehe bestehende Einträge für `v1-brutal`, `v3-kinetic`, `v5-y2k`. Placeholder-Divs (`<div class="placeholder">+ variant</div>`) ersetzen.
5. **Teste** über `http://localhost:8080/v<N>-<label>/` dass die Seite lädt und nichts kaputt ist.

---

## 8. Qualitätsmesslatte

- **Nicht lame.** Ronald hat mehrfach gesagt: das erste Editorial-Layout „sieht aus wie Claude Code". Er will **überraschen**.
- **Handwerk zählt.** Whitespace, Typo-Hierarchie, Farb-Konsistenz, Micro-Interactions — alles soll intentional wirken. Keine Default-Bootstrap-Optik.
- **Jede Variante soll Haltung haben.** Kein weichgespültes „könnte alles sein". Lieber polarisierend als beliebig.
- **Tech soll die Idee tragen**, nicht andersrum. Three.js nur, wenn 3D das Konzept verstärkt — nicht als Gimmick.

---

## 9. Antwort-Format (falls als Agent beauftragt)

- Für jeden gebauten Ordner: Pfad + 1–2 Sätze Konzept + genutzte Tech.
- Liste aller Dateien, die du in `versions/index.html` verändert hast.
- Am Ende: Liste noch offener Placeholders, falls du nicht alle 15 schaffst.

---

## 10. Phase 2 — Schüler-fokussierte Versionen (v6–v10)

Neuer Fokus, **anders als Phase 1**:

- **Hauptziel = Conversion**: neue Schüler gewinnen. Kein Künstler-Portrait.
- **Barbara steht NICHT im Fokus — der Schüler wird angesprochen.** Konsequente Du-Perspektive.
- **Originalton Barbara** aus v3 und v5 bleibt als Klangbasis, wird aber systematisch auf den Leser umformuliert: „Ich biete…" → „Bei dir…", „Meine Methode…" → „Wir suchen gemeinsam…".
- **Verben > Substantive.** „Du singst ungezwungen" statt „Erwerb natürlicher Stimmentfaltung".
- **Konkrete Situationen > abstrakte Claims.** Statt „Individuelle Betreuung" → „Wir suchen die Lieder, die zu dir passen".

### Harte Research-Constraints (NN/g 2023, zielgruppen-begründet)

Barbaras Zielgruppe ist **zielorientiert** (Aufnahmeprüfung, Casting, Wiedereinstieg, Beruf). Zielorientierte Nutzer sind laut NN/g-Studie am empfindlichsten gegen Scroll-Hijacking — sie wollen in 10–20 s wissen: kompetent? passt sie? wie Kontakt?

Daraus folgt **absolut bindend**:

1. **Kein Scroll-Hijacking above the fold.** Hero scrollt nativ. Kein Pin+Animation im Hero-Bereich.
2. **Kein horizontaler Scroll-Hijack überhaupt** — die Studie zeigt, dass Nutzer dort „nicht mehr rauskommen".
3. **Kein Scroll-Rate-Kidnapping während der Nutzer Text liest.** Lesbarkeit ist heilig.
4. **`prefers-reduced-motion` respektieren** — gerade ältere/heterogene Zielgruppe, vestibuläre Probleme.
5. **Permanenter Kontakt-Notausgang**: sticky CTA (Probestunde / WhatsApp) oder fixed Nav mit Buchungs-Button.
6. **Mobile 375 px ganz ohne Scroll-Tricks.**
7. **Performance heilig**: Lenis (~10 kB) + GSAP core + ScrollTrigger ist das Maximum. Keine WebGL-Hero-Shows, keine Three.js, keine Matter.js-Physics, kein Tone.js-Audio-Experiment.
8. **Mikro-Animationen sind explizit erwünscht**: fade-in bei Section-Eintritt, hover-states auf CTAs, dezente reveal-on-scroll, CSS `animation-timeline: view()` (State-of-the-Art 2026).
9. **Scrollytelling nur, wenn es funktionalen Mehrwert hat** (z.B. eine Schüler-Transformation in 3 Steps): kurz, unter dem Fold, klar abgegrenzt, **nicht auf Mobile** (oder stark vereinfacht).

### Pflicht-Tech-Details (gelernt aus Phase 1)

- **Script-Tag**: `<script type="module" src="./js/main.js"></script>` — sonst bundelt Vite die Datei nicht, 404 auf GH Pages.
- **hrefs relativ**: `./`, `impressum.html`, `datenschutz.html` — nie absolutes `/barbaraseiler/…`.
- **Kein custom gerenderter Maus-Cursor** (hängt hinterher). Mouse-Trails/Sparkles OK — Pointer bleibt nativ.
- **Keine Scroll-Jitter-Patterns**: Hide-on-scroll Header nur mit Hysterese (akkumuliertes Delta), nicht per-Frame-Toggle.
- **Overview `versions/index.html` NIE anfassen** — Ronald updatet zentral nach dem Spawn.

### Die 5 Hauptversionen (Content-IA)

| Ordner | Titel | IA-Idee |
|---|---|---|
| `v6/` | „Was bringt dich her?" | Pathway-basiert. 5 Schüler-Segmente — Anfänger / Aufnahmeprüfung / Wiedereinsteiger / Berufsredner / Chor. Hero stellt die Frage, jeder Pfad bekommt eigenen Block. |
| `v7/` | „Probestunde zuerst" | Single-Offer-IA. Alles kreist um die 40-€-Probestunde als primäre Aktion. SaaS-Landing-Logik, aber warm. |
| `v8/` | „Zweifel & Antworten" | Objection-Handling-IA. Seite adressiert typische innere Zweifel: „Ich kann nicht singen." / „Zu alt." / „Keine Zeit." / „Zu teuer." / „Was wenn…" |
| `v9/` | „Was du mitnimmst" | Outcome-First-IA. Ergebnisse im Fokus vor Methode. „In 3 Monaten: so fühlt sich deine Stimme an." |
| `v10/` | „Das Gespräch" | Dialog-IA. Die Seite liest sich als Gespräch Schüler ↔ Barbara. Keine klassischen Sektionen, durchgängige Konversation. |

Pro Hauptversion zwei Design-Subvarianten, IA bleibt identisch, nur die Design-Sprache/das Interaktionsmodell ändert sich — der Agent-Brief beschreibt pro Ordner die spezifische Richtung.

### Phase 3 (v11–v15) — Conversion-Vertiefung

Ausgangspunkt für Phase 3 war die Lücke zwischen den bestehenden Schüler-IAs und dem, was goal-oriented Nutzer laut NN/g besonders schnell brauchen:

1. **starke Information Scent above the fold**: sofort klar machen, worum es auf genau dieser Seite geht;
2. **eine dominante Nutzerfrage pro Version** statt Mischformen;
3. **scanbare Layer-Cake-Hierarchie** mit klaren Zwischenüberschriften;
4. **schneller Kontakt-Exit** auf jeder Seite.

Darum wurden fünf neue Haupt-IAs definiert:

| Ordner | Titel | IA-Idee |
|---|---|---|
| `v11/` | „Bist du hier richtig?” | Fit-/Passungscheck. Die Seite hilft in wenigen Blöcken zu entscheiden, ob diese Art Unterricht zur aktuellen Lage passt. |
| `v12/` | „Was macht deine Stimme gerade?” | Symptom-/Signal-IA. Start nicht über Genre oder Vita, sondern über konkrete Stimm-Signale aus Alltag, Chor, Beruf. |
| `v13/` | „So könnte dein erster Monat aussehen.” | Zeitachsen-IA. Macht den Unterrichtsbeginn als realistischen Ablauf und nicht als vages Versprechen sichtbar. |
| `v14/` | „So fühlt sich deine erste Stunde an.” | Experience-IA. Nimmt die Angst vor der ersten Stunde, indem der Raum und der Ablauf konkretisiert werden. |
| `v15/` | „Kannst du das heute entscheiden?” | Decision-Sheet-IA. Maximal verdichtete Antworten für zielorientierte Nutzer, die schnell zu einer Anfrage kommen wollen. |

---

## 11 — Design-Ideen-Log (lebendig)

Zentrale Liste aller Design-Varianten mit ihrem Konzept. Bei jeder neuen Variante pflegen. Sub-Varianten nennen explizit den **Twist gegenüber ihrem Parent**, damit der Unterschied nachvollziehbar bleibt.

### Phase 1 (v1–v5) — Barbara-fokussiert

| Ordner | Parent | Idee |
|---|---|---|
| `v1/` | — | Initial Static-Rebuild der Bestandsseite, Editorial Light |
| `v1-brutal/` | v1 | Swiss Brutal, Acid-Akzente, Mono-Typo, harte Raster |
| `v1-noir/` | v1 | Cinematic B/W, Didone-Display, filmisch |
| `v1-clay/` | v1 | Claymorphism, weiche Schatten, runde Formen |
| `v1-swiss/` | v1 | Classic Swiss International, strenger Grid, rote Akzente |
| `v2/` | — | 9-Sektionen-IA, inhaltsneutral |
| `v2-bento/` | v2 | Apple-Style Bento-Grid |
| `v2-mag/` | v2 | Magazin Nº 04, Drop Caps, Editorial Deluxe |
| `v2-wiki/` | v2 | Enzyklopädisch-dichte Wiki-Ansicht |
| `v3/` | — | Barbara-Stimme, Copy im Originalton |
| `v3-kinetic/` | v3 | Kinetic Typography via GSAP |
| `v3-collage/` | v3 | Scrapbook / Polaroids / Paper-Textur |
| `v3-neobrutal/` | v3 | Neo-Brutalismus, flat, harte Schatten |
| `v3-riso/` | v3 | Risograph Duotone Print |
| `v4/` | — | UX-Hierarchie, Progressive Disclosure |
| `v4-glass/` | v4 | visionOS-Aurora-Glass |
| `v4-linear/` | v4 | Linear.app Product Dark |
| `v4-terminal/` | v4 | CRT/BBS Phosphor-Terminal |
| `v5/` | — | Du-Perspektive konsequent, Editorial Warm |
| `v5-y2k/` | v5 | Y2K Chrome / Aero / Holo |
| `v5-didone/` | v5 | Didone Salon, Luxury Editorial |
| `v5-lenis/` | v5 | Stage-Scroll via Lenis+GSAP |
| `v5-three/` | v5 | Voice-Ribbons via Three.js/WebGL |

### Phase 2 (v6–v10) — Schüler-fokussiert

| Ordner | Parent | Idee |
|---|---|---|
| `v6/` | — | Pathway Chooser: 5 Schüler-Typen wählen Lernpfad, Cream/Cognac |
| `v6-pathways/` | v6 | Apple-Shop-by-Need Chooser, Ivory/Jade hell |
| `v6-chat/` | v6 | Messenger-Conversation als IA |
| `v7/` | — | Probestunden-Angebot, 40€-Coin-Badge, SaaS Warm |
| `v7-offer/` | v7 | Stripe/Linear-Dark SaaS |
| `v7-split/` | v7 | 50/50 Split mit Sticky Form rechts, Aubergine |
| `v8/` | — | Weg zum Abitur, Editorial Sepia, Schritt-für-Schritt |
| `v8-faq/` | v8 | Zen-Accordion via `<details>` |
| `v8-journey/` | v8 | 6 nummerierte Stationen mit Progress-Dots |
| `v9/` | — | Outcomes First, Display-Typo |
| `v9-outcomes/` | v9 | Bento-Grid 6 Tiles, Pastels |
| `v9-audio/` | v9 | Voice-Memo / Podcast-UI, Dark+Orange |
| `v10/` | — | Dialog, Du=Inter vs Barbara=Fraunces-Italic |
| `v10-dialog/` | v10 | Chat-Bubbles Messenger, warm (nicht iMessage-blau) |
| `v10-letter/` | v10 | Briefwechsel-Form, Cormorant+Fraunces+Caveat |

### Phase 3 (v11–v15) — Conversion-Vertiefung

| Ordner | Parent | Idee |
|---|---|---|
| `v11/` | — | Passungscheck: fit-first, schnelle Selbstprüfung, ruhig-editorial |
| `v11-checklist/` | v11 | Selbe IA als grün getönte Checkliste, noch stärker scanbar |
| `v11-match/` | v11 | Selbe IA als Match-Logik: „Du suchst” vs. „Barbara arbeitet so” |
| `v12/` | — | Signal-Chooser: konkrete Stimm-Signale statt Genre-Einstieg |
| `v12-signals/` | v12 | Direktes Signal-Testing, komprimierter und entscheidungsnäher |
| `v12-notes/` | v12 | Selbe IA als weichere Beobachtungs-/Notiz-Version |
| `v13/` | — | Erster Monat: Zeitachse vom ersten Kontakt bis zur Routine |
| `v13-steps/` | v13 | Selbe IA als klare Schrittfolge, stärker prozessorientiert |
| `v13-weekbook/` | v13 | Selbe IA als Wochenbuch, persönlicher und reflexiver |
| `v14/` | — | First-Lesson Experience: Vor der Tür, im Raum, danach |
| `v14-room/` | v14 | Selbe IA mit Fokus auf geschütztem Raum und Sicherheit |
| `v14-rhythm/` | v14 | Selbe IA mit Fokus auf Wiederholbarkeit und Unterrichts-Rhythmus |
| `v15/` | — | Decision Sheet: sechs harte Fragen, drei Merkpunkte, schneller Kontakt |
| `v15-grid/` | v15 | Selbe IA als stärker gerasterte Übersicht |
| `v15-plain/` | v15 | Selbe IA als fast dekofreier Klartext |

### Sub-Sub-Varianten (Tiefe 2)

| Ordner | Parent | Twist gegenüber Parent |
|---|---|---|
| `v6-pathways-dark/` | v6-pathways | Gleicher Chooser, aber Dark-Mode-Flip: Deep-Teal Hintergrund, warmer Cognac-Akzent statt Jade. Höhere Kontrast-Spannung für Abend-Besuche. |
| `v8-journey-map/` | v8-journey | Stationen werden zur kartografischen Route: handgezeichneter Pfad zwischen Stationen statt Progress-Dots, SVG-Topo-Linien. |
| `v10-dialog-voice/` | v10-dialog | Chat-Bubbles werden Voice-Memos: Waveform-Visuals, Play-Buttons, Zeitstempel — als wären Du & Barbara in WhatsApp-Sprachnachrichten. |
