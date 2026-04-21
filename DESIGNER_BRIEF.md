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
| `v14-portal/` | v14 | **Effects-Show:** horizontal pinned Chapter-Book durch 5 Räume (Tür/Raum/Einsingen/Stunde/Nach Hause), Web-Audio Ambient pro Kapitel, clip-path Morph, 3-Layer Parallax, Mobile-Fallback vertikal. GSAP ScrollTrigger + Lenis. |
| `v15/` | — | Decision Sheet: sechs harte Fragen, drei Merkpunkte, schneller Kontakt |
| `v15-grid/` | v15 | Selbe IA als stärker gerasterte Übersicht |
| `v15-plain/` | v15 | Selbe IA als fast dekofreier Klartext |

### Sub-Sub-Varianten (Tiefe 2)

| Ordner | Parent | Twist gegenüber Parent |
|---|---|---|
| `v6-pathways-dark/` | v6-pathways | Gleicher Chooser, aber Dark-Mode-Flip: Deep-Teal Hintergrund, warmer Cognac-Akzent statt Jade. Höhere Kontrast-Spannung für Abend-Besuche. |
| `v8-journey-map/` | v8-journey | Stationen werden zur kartografischen Route: handgezeichneter Pfad zwischen Stationen statt Progress-Dots, SVG-Topo-Linien. |
| `v10-dialog-voice/` | v10-dialog | Chat-Bubbles werden Voice-Memos: Waveform-Visuals, Play-Buttons, Zeitstempel — als wären Du & Barbara in WhatsApp-Sprachnachrichten. |
| `v10-dialog-wave/` | v10-dialog | **Effects-Show:** Voice-Memos mit echter WebAudio-Synthese pro Zeile, atmende Fraunces-Typografie (variable wght-Achse auf 6s-Sinus), Lenis+GSAP. Jede Memo eigener Pitch (174–294 Hz). |
| `v5-resonance/` | v5-three | **Effects-Show:** ganze Seite ist eine atmende WebGL-Szene (fullscreen Quad + Fragment-Shader), 5 Akte (Atem/Ton/Raum/Klang/Begegnung), Scroll steuert Shader-Uniforms, Content via `mix-blend-mode: difference` drüber, optionaler Audio-Drohnen-Modus mit AnalyserNode → Shader. |

### Phase 5 (v26–v35) — Ehe aus Wow + Conversion

Jeder Entwurf ist eigenständige Main-Version. Phase-4-Wow-Technik wird mit Phase-2/3-Conversion-Disziplin verheiratet. Alle `Claude · wow+convert`. Siehe §13 für Konzeptkerne.

| Ordner | Content-Source | Idee |
|---|---|---|
| `v26-gespraech/` | v6 (Pathway) + v10 (Dialog) | **Scripted-LLM-Feel Chat.** 5-Stufen-FSM, Typewriter 22 ms/char, Intent-Matching gegen kuratierte Knowledge-Base, 5 Pfad-Auswertungen mit personalisierter Narrative + WhatsApp-Deeplink pro Pfad. Popover API für Term-Klärungen. |
| `v27-timeline-physics/` | v13 (Erster Monat) | **Matter.js Jahresleiste.** 12 Monats-Token fallen physikalisch in Zeit-Slots, settlen zur Jahresachse, Meilenstein-Noten auf Hover. Commitment spielerisch gemacht. |
| `v28-mirror/` | v3 (Barbara-Stimme) + v14 | **Camera-Opt-in Mirror.** getUserMedia → Canvas-Grayscale + Pitch-FFT-Bars, rein client-side, explizites Consent-Gate. Graceful fallback auf pulsierende SVG-Kreise. |
| `v29-ambient/` | v5 (Du-Perspektive) | **Web-Audio-Ambient + VF-Breath.** Hall-Drone-Bed nach Consent, Variable-Font-Achsen gekoppelt an RMS-Amplitude. Scroll-Ende = Stille = CTA-Moment. |
| `v30-feedback/` | v11 (Passungscheck) + v6 | **Dual-Slider + Canvas-Particles.** „Singen im Alltag" / „Bühnen-Nervosität" steuern Partikelfeld + routen zu 4 Pathways mit Live-Quadranten-Logik. Hidden Form-Field für Barbara. |
| `v31-oper-chooser/` | v5-y2k + v9 | **Opera-Buzzfeed-Quiz.** 5 Fragen, 4 bipolare Achsen, 7 Charaktere (Mimì, Carmen, Papageno, …). Canvas-2D Share-Card 1200×630 zum Download. Per-Character Accent + CTA-Wording. |
| `v32-rooms/` | v14 (First Lesson) | **Isometric SVG + View Transitions API.** Klickzonen auf Klavier/Stuhl/Spiegel öffnen Panels via `document.startViewTransition()`, Fallback auf `<dialog>`. Raum-Familiarität = niedrigere Booking-Angst. |
| `v33-kalender-ghost/` | v7 + v9 | **Rolling Social Proof.** Wochenraster 6-8 Wochen, anonymisierte Meilensteine (Initial-basiert, poetisch), Ghost-Fade auf ältere Wochen, Auto-Rolling-Cursor. Ehrlicher Disclaimer „Beispiele, keine echten Namen". |
| `v34-brief-an-dich/` | v10-letter + v5 | **Personalisierter Brief.** Formular → typewriter-animierter Brief auf Briefpapier, Signatur in Fraunces-Italic groß, Print-to-PDF. Take-away-Asset, Kühlschrank-Effekt. |
| `v35-zine/` | v3 + v8 | **Contrarian Zero-JS Zine.** Reclam-Style Editorial, 6 ausformulierte „Notizen", Marginalien via `<aside>`, CSS `animation-timeline: view()` für Scroll-Reveals. Substanz statt Effekte. |
| `v36-atemraum/` | v5 + v17 | **Breath-Gate.** 60s Atemübung als Content-Gate vor Seite. Gate-Screen → Path A Breathing-Dialog (5 Zyklen × 12s) → Content; Path B persistentes „Jetzt nachholen" Banner. `localStorage`-Flag für Return-Besucher. Pink-Noise optional via Web Audio. |
| `v37-jetzt-in-niederrad/` | v5 + v7 | **Hyperlocal Urgency.** Live-Uhr im sticky Header via `Intl.DateTimeFormat`, SVG-S-Bahn-Route, Verfügbarkeits-Widget („Diese Woche noch 2 Slots frei") mit atmendem Rahmen, Standort-Prosa. Local-SEO trifft Dringlichkeits-Ästhetik. |
| `v38-portraet-marquee/` | v1 + v3 | **Infinite Testimonial Marquee.** 2-3 Reihen endlos scrollender Porträt-Karten, jede mit SVG-Avatar aus Initialen-Hash, Pause-on-Hover via `:has()`, Klick öffnet `<dialog>` mit Vollzitat + CTA. |
| `v39-zwei-farben/` | v11 + v5-didone | **Brutalist Radical Reduction.** Nur zwei Farben (Schwarz + Signal-Pink), riesige Didone/Fraunces-Typografie (clamp 80–240px), Scroll-Snap-Sections mit drei „Antworten"-Blöcken, Inputs nur mit Unterstrichen. |

### Phase 5 Ausblick (v40–v45) — Aktiver Stimm-Layer

Nach Abschluss der contemplativen/strukturellen Varianten kommt die Eskalationsstufe: der User singt mit.

| Ordner | Content-Source | Idee |
|---|---|---|
| `v40-stimme-zeigen/` | v28-mirror + v20-spectrogram | **Pitch-Responsive WebGL-Szene.** Mikrofon-Opt-in (client-side-only) → Autokorrelations-Pitch-Detection → generative Visualisierung als teilbare Share-Card + Mini-Ermutigung („du triffst A4 sauber"). Stärkster Conversion-Trigger. |
| `v41-magnet-typo/` | v39-zwei-farben | **Cursor-Gravity Typography.** Brutalistisch, aber mit Mastromarino-Physik: Hero-Wort „Resonanz" dehnt sich zur Maus, Testimonials schweben in Magnetfeldern. Stimme als physische Resonanz. |
| `v42-spektrogramm/` | v27-timeline-physics + v5-three | **Audio-Scroll-Cinema.** Barbaras 60s-Arienaufnahme ist der Scroll-Track; Spektrogramm-Rendering synchron mit Chapter-Text („Atem · Ansatz · Klangfarbe"). Diegetisches Audio-Storytelling. |
| `v43-stimm-orakel/` | v31-oper-chooser | **Tarot-Draw-Flow.** 22 Karten (Der Atem, Die Blockade, Die Bühne, Das Kind, Die Brücke…), Fan-Physik + Flip, 3 gezogene Karten → personalisiertes Probestunden-Angebot. Ritualisiert-haptisch. |
| `v44-ton-treffen/` | v36-atemraum + v30-feedback | **Tone-Matching-Game.** 60s Challenge, 5 Zieltöne, Canvas-2D-Pitch-Line, Streak + Share-Score. „Du bist besser als 72% — willst du die letzten 28% mit Barbara schließen?" |
| `v45-duett/` | v29-ambient | **Playback-Duett.** Barbara singt vorgespeichert, User singt zweite Stimme ins Mic, Seite zeigt beide Wellen überlagert und mixt zurück + Download. Aktives Co-Performing. |

### Phase 4 (v16–v25) — Attraction-Layer (Exploration)

Jeder Entwurf ist eigenständige Main-Version (kein Parent). Content aus einer Phase-1–3-Source gezogen. Primärziel bleibt Probestunden-Konversion; der Wow-Effekt dient Discovery/Share-Worthiness, nicht sich selbst. Alle `Claude · crazy`.

| Ordner | Content-Source | Idee |
|---|---|---|
| `v16-libretto/` | v5 (Du-Perspektive) | **Giant-Type IS the design.** Fraunces auf allen Achsen (opsz, wght, SOFT), Foto ausgeschnitten im „Ö", sechs Akte als Spreads. Null JavaScript — pure Typografie + SVG clipPath. Liest sich wie ein Libretto. |
| `v17-breath-shader/` | v3 (Barbara-Stimme) | **Ganzseitiger Fragment-Shader.** 12-BPM-Atemrhythmus deformiert die Oberfläche, Szene morpht Morgen → Mittag → Abend mit Scroll. Three.js ESM, fullscreen Quad. Nonverbale Einladung zur Stimmarbeit. |
| `v18-chapbook/` | v3 + v5 | **3D Page-Flip-Chapbook.** Zehn Seiten „Stimmbiografie", Scroll = Page-Turn mit Papier-Physik (`perspective` + rotateY), GSAP-scrubbed. Privates Reading-Erlebnis statt Scroll-Feed. |
| `v19-methode-horizontal/` | v4 (UX-Hierarchie) | **Horizontal Scrollytelling EINER Section.** Vertikales Editorial, nur „Methode" wird horizontal gepinnt — 5 animierte SVG-Spreads (Atem/Ton/Stütze/Vokale/Resonanz). GSAP ScrollTrigger + `containerAnimation`. Punktueller Glanz, kein Gesamt-Hijack. |
| `v20-spectrogram/` | v12 (Signal-Chooser) | **Live-Mic FFT → Aurora-Ribbons.** Visitor singt „Ah", sieht eigene Obertöne. On-device Pitch-Detection via Autokorrelation (kein Cloud-Leak). Direktester Vertrauensbeweis: Barbara sieht, was du nicht hörst. |
| `v21-stimmfach/` | v6 (Pathway Chooser) | **Matter.js Physics-Pile.** Neun weiche Stimmfach-Pillen (Koloratur, Mezzo, Bariton, Sprechstimme, Kirche, …) in Sandbox — wirf sie herum, pinne eine an, direkt zur Probestunde. Spielerische Selbstverortung. |
| `v22-split-recital/` | v10 (Dialog) | **Split-Screen Divergent Narrative.** Oben Barbara singt, unten unterrichtet — zwei CSS-Filme scrollen desynchron, treffen sich mittendrin. Mensch + Lehrerin in derselben Sekunde sichtbar. |
| `v23-patina/` | v9 (Outcomes) | **Idle-Shader, Zeit = Wert.** Je länger Visitor bleibt, desto wärmer und goldener das Hero-Foto. Nach 5 Minuten ist das Gold tief. Nonverbales Signal: ein Ort zum Bleiben. |
| `v24-tagesmotiv/` | v1 (Editorial Base) | **Generative Per-Visit Canvas.** Pro Stunde ein neues, deterministisches Notenbild via mulberry32 + djb2-Seed aus Timezone × Stunde × Wochentag. Unikat pro Visit, Caption macht's explizit — Share-Bait. |
| `v25-opera-scenes/` | v14 (First-Lesson Experience) | **Shared-Canvas Scene-Transitions.** Vier Akte (Empfang / Studio / Bühne / Verabredung), Chromatic-Aberration-Dissolve zwischen Szenen. Nav-Klicks öffnen wie Opernvorhänge. Igloo-Inc-Vorbild, warm statt eisig. |

---

## 12. Phase 4 — Exploration Deep-Dive (v16–v25)

**Mandat (Ronald, 2026-04-21):** radikal weitergehen. Visuelles/Interaktives Maximum aus dem aktuellen Stand der Web-Technik. Primärziel bleibt: Leute zu Barbaras Unterricht. Wow dient der Attraction (Discovery, Share-Worthiness, Erinnerbarkeit), nicht sich selbst.

### Research-Grundlage (Stand April 2026)

State-of-the-Art Moves aus aktueller Awwwards / Codrops / Lusion / Lapa-Ninja Landschaft, gefiltert auf Voice-Teacher-Tauglichkeit (muss warm + vertrauenswürdig bleiben, kein Tech-Bro-Nihilismus):

- **Scroll-Drive**: CSS `animation-timeline: view()` / `scroll()` nativ (Safari 18+, Chromium 115+, FF flag), Lenis+GSAP ScrollTrigger mit Rubato-Feeling, Codrops Sticky-Grid (Mar 2026), Dual-Wave-Text (Jan 2026), Reactive Depth 3D Image Tube (Feb 2026).
- **WebGL/Shader**: Three.js + TSL Node Materials, Codrops Dual-Scene Fluid X-Ray (Mar 2026), Ruinart Digital Fresco (Layered-Zoom ins Kunstwerk), OGL für Minimal-Bundles, Patina-Weathering-Shader, Post-FX (Bloom + Chromatic Aberration als One-Frame-Peak).
- **Typografie**: Variable-Font-Achsen `wght + opsz + GRAD + SOFT` als Breath-Loop, Giant-Type-IS-Design (Porto Rocha / Base / Readymag 2026 Jury), SVG `textPath` + MorphSVG, `mix-blend-mode: difference` über Video, GRAD-Achse für Zero-Shift Hover.
- **Physics**: Rapier.js WASM (2–5× schneller in 2026) für Throwable/Draggable auf Landing-Pages, Motion (ex-Framer-Motion) Spring-Gestures, Cursor-Reactive Whole-Page-Warp (Design Embraced, CUSP).
- **Audio**: Tone.js FFT-Analyser → Shader-Uniform, Chrome-Music-Lab-Style Spectrogram als Content, Scroll-into-View Audio pro Section, on-device Pitch-Detection (WebML, kein Cloud-Leak).
- **Konzept**: 3D Page-Flip Chapbook (The Search for Work Happiness / HTWKAR), Cross-document View Transitions für MPA (stable 2026), Split-Screen Divergent Narrative, Generative Per-Visit-Seed, Horizontal Scrollytelling für EINE Section (nicht Gesamt-Page).

**Referenz-Sites (live, April 2026):** Igloo Inc, Ruinart Digital Fresco, Shader Development Studio, Obsidian Assembly, Oryzo AI (Lusion), NaughtyDuk©, Maxima Therapy, SŌM (.RAW), Artefakt.mov, Max Mara Jacket Circle (Game-as-Landing).

### Die 10 Entwürfe

Jeder Entwurf ist eigenständige Main-Version (v16–v25). Content wird aus einer existierenden Phase-1–3-Version gezogen (`Content-Source`). Die Design-Identität ist so dominant, dass sie als eigene Hauptnummer steht — analog v7 hat eigene IA, zieht aber Copy aus v5.

| Ordner | Titel / dominante Metapher | Tech-Stack (CDN-only) | Content-Source | Barbara-Hook |
|---|---|---|---|---|
| `v16/` | **Libretto** — Giant-Type IS the design. Fotos nur in Buchstaben-Aperturen („O", „ö"). | CSS Variable Font (Instrument Serif Display / Fraunces), `animation-timeline: view()`, null JS. | v5 (Du-Perspektive) | Seite liest sich wie ein Libretto. Bindet ans Oper-/Liederabend-Profil, signalisiert Kultiviertheit ohne Kitsch. |
| `v17/` | **Breath-Shader** — ganzseitiger Fragment-Shader. Hero-Portrait atmet 12 BPM; Shader-Oberfläche deformiert bei Scroll. | Three.js ESM + GLSL Fragment, optional TSL. | v3 (Barbara-Stimme) | Das Bild atmet mit dir. Nonverbale Einladung zur Stimmarbeit; prä-rational überzeugend. |
| `v18/` | **Chapbook** — 24-seitiges 3D Page-Flip-Buch „Stimmbiografie". Scroll = Page-Turn mit Papier-Physik. | GSAP 3D CSS-Transform + `perspective`, Scroll-gescrubbt. | v3 + v5 | Intimes Büchlein, Probestunde auf der inneren Rückseite. Privates Reading-Erlebnis statt Scroll-Feed. |
| `v19/` | **Methode Horizontal** — genau EINE Sektion („Methode") wird horizontal; oben/unten alles normal vertikal. | GSAP ScrollTrigger + `containerAnimation`, pin+scrub. | v4 (UX-Hierarchie) | „Methode" = 5 Spreads, jede Übung bewegte Vignette. Kein Gesamt-Hijack, punktueller Glanz. |
| `v20/` | **Spectrogram** — Live-Mic FFT → Aurora-Ribbons. „Was deine Stimme gerade tut." | Tone.js AnalyserNode + Canvas 2D / WebGL. | v12 (Signal-Chooser) | Visitor singt „Ah" ins Mic, sieht eigene Overtones. Direktester Vertrauensbeweis: Barbara sieht, was ich nicht höre. |
| `v21/` | **Stimmfach** — Rapier.js Physics-Pile aus weichen Pillen (Koloratur, Mezzo, Bariton, Sprechstimme, Kirche). | Rapier.js WASM + Canvas-Renderer. | v6 (Pathway Chooser) | Visitor wirft Fächer herum, sie settlen mit Inertia — sortieren sich am Ende zu Barbaras Schwerpunkt. |
| `v22/` | **Split-Recital** — Split-Screen, oben Barbara singt, unten sie unterrichtet; Scroll = beide Timelines gleichzeitig. | Zwei synchronisierte `<video>`, Scroll-Position → currentTime. | v10 (Dialog) | Zwei Stimmen, eine Phrase. Mensch + Lehrerin in derselben Sekunde sichtbar. |
| `v23/` | **Patina** — Idle-Shader, je länger Visitor bleibt, desto mehr goldene Patina übers Hero-Foto. | Fragment-Shader + `requestAnimationFrame`, time-tracked. | v9 (Outcomes) | Zeit = Wert. Nach 60 s spürbar warm/weich. Nonverbal: dies ist ein Ort zum Bleiben. |
| `v24/` | **Tagesmotiv** — Generative Per-Visit Note-Scape im Hero, Seed aus Timezone + Stunde. | Canvas 2D + `mulberry32` PRNG. | v1 (Editorial Base) | „Tagesmotiv für Frankfurt, 14:20". Unikat pro Visit, Caption macht's explizit — Lebendigkeit + Share-Bait. |
| `v25/` | **Opera Scenes** — Frost-Transition Navigation zwischen 4 Räumen (Empfang / Studio / Bühne / Booking). | Three.js Shared Canvas + Chromatic-Aberration Dissolve Shader. | v14 (First-Lesson Experience) | Nav-Klicks öffnen „Szenen" wie Opernvorhänge. Igloo-Inc-Vorbild, aber warm statt eisig. |

### Pflicht-Elemente jedes Entwurfs

- funktionierende `impressum.html` + `datenschutz.html` (Legal-Seiten laden **ohne** den Hauptshader/Physics — Legal muss schnell + barrierearm sein).
- sticky CTA „Probestunde buchen" (40 € / 45 min) — permanent greifbar, der Wow-Effekt darf die Conversion nie verstellen.
- Dummy-PII (Musterstraße 1 / +49 (0)555 … / `wa.me/495551234567`). Niemals echte Adresse/Telefon.
- `prefers-reduced-motion`-Fallback für den dominanten Effekt (Shader → statisches Bild, Physics → statische Grid, Audio → off).
- Mobile ≥ 375 px funktional — Effekt darf auf Mobile reduziert sein, darf aber nicht kaputtgehen.
- Script-Tag `type="module"`, hrefs relativ (`./`, `impressum.html`).

### Strategie: selbstständige Entwicklung

**Per-Entwurf Workflow (Agent-tauglich):**

1. **Scout** — Content-Source-Ordner via Read komplett einlesen. Copy + IA + CTA-Positionen extrahieren.
2. **Spec** — Internes Micro-Brief (Hero-Move, Section-Choreo, CDN-Libs, Reduced-Motion-Fallback, Audio-Gate falls Audio).
3. **Build** — 5 Dateien: `index.html`, `impressum.html`, `datenschutz.html`, `css/style.css`, `js/main.js`. Self-contained, CDN-only.
4. **Verify** — `npm run build` grün. Keine 404. Gzip < 50 kB außer wo Shader/Physics zwingen.
5. **PII-Scrub** — Grep auf `0179`, `wa.me/4917` als Canary.
6. **Register** — neue `<a class="card">` in `versions/index.html` mit `#NN · `-Prefix + Datum.
7. **Log** — Eintrag in §11 Design-Ideen-Log dieses Briefs.

**Parallelisierung — 3 Batches:**

- **Batch A (Low-JS, schnellste Wins):** v16-libretto, v24-tagesmotiv, v18-chapbook → ~30 Min via 3 parallele Agents.
- **Batch B (Mid-JS, Shader/Physics):** v17-breath-shader, v23-patina, v21-stimmfach → ~45 Min, 3 Agents.
- **Batch C (Audio/Video/Shared-Canvas, komplexer):** v20-spectrogram, v22-split-recital, v19-methode-horizontal, v25-opera-scenes → 4 Agents, sequenziell nach Batch B um Ressourcen-Kollisionen zu vermeiden.

**Quality Gates nach jedem Batch:** `npm run build`, PII-Grep, Spot-Check Reduced-Motion, Spot-Check Mobile 375 px, Spot-Check Legal-Pages ohne Shader-Overhead.

**Commit-Rhythmus:** 1 Commit pro Batch, Push nach allen 10.

**Bewusster Bruch mit Phase 2/3-Constraints:** Phase 4 darf Scroll-Hijack (punktuell), horizontalen Scroll (punktuell) und WebGL-Hero nutzen. Das ist der Punkt. Conversion-Strenge der Phase 2/3 wird suspendiert, weil Phase 4 als **Attraction-Layer** dient (Discovery, Share, Memorability), während Phase 2/3 für Suchende-im-Tunnel bleibt. Beide Tracks existieren parallel, Barbara bekommt am Ende **beide Angebote** als auswählbare Varianten.

---

## 13. Phase 5 — Ehe aus Wow + Conversion (v26–v35)

**Mandat (Ronald, 2026-04-21, später Abend):** „mach jetzt alles mögliche, weiter iterieren, neue Entwürfe, noch mehr crazy, Research, Struktur, Wording, design – bis ich abbrechen sage, spätestens 23:50." Phase 5 verheiratet die Phase-4-Attraction-Techniken mit Phase-2/3-Konversionsdisziplin: jeder Entwurf hat EINEN Wow-Move UND EINEN spezifischen Conversion-Hebel (Selbst-Check, Qualifizierung, Social Proof, persönliche Ansprache, Asset zum Mitnehmen).

### Konzeptkerne

| Ordner | Wow-Move (Phase-4-DNA) | Conversion-Hebel | Content-Source | Barbara-Hook |
|---|---|---|---|---|
| `v26-gespraech/` | Scripted-LLM-Feel Chat-Advisor: Intent-Matching gegen kuratierte Knowledge-Base, Typewriter-Ausgabe, Popover API für inline-Klärungen. Fühlt sich wie on-device LLM an, ist deterministisch. | Lead-Qualifizierung: 5 Fragen → personalisierte Pathway-Empfehlung + vorausgefüllter Probestunden-Link. | v6 (Pathway) + v10 (Dialog) | Barbara „spricht zurück". Visitor fühlt sich gehört, bevor er klickt. |
| `v27-timeline-physics/` | Matter.js Timeline — 12 Monats-Token fallen in eine physikalische Zeitleiste, settlen zum Jahr. | Commitment visualisieren als machbar/spielerisch — jeder Monat mit Meilenstein-Note. | v13 (Erster Monat) | „Ein Jahr mit Barbara" ist greifbar, nicht abstrakt. |
| `v28-mirror/` | getUserMedia + Canvas-Grayscale-Filter mit abstrakten Audio-Bars (Pitch → Balken-Höhe). Alles client-side, explizites Opt-in, kein Upload. | Deep-Trust: Barbara = Spiegel. Wer sich traut, sich zu sehen, ist bereit zu buchen. | v3 (Barbara-Stimme) + v14 (First Lesson) | Spiegel-Metapher: Probestunde ist der Moment, wo du dich siehst/hörst. |
| `v29-ambient/` | Scroll-getakteter Ambient-Audio-Bed (Hall-Reverb, leise Klavierresonanz) **nach** Consent-Gesture. Variable-Font-Achsen (wght/opsz) gekoppelt an Audio-Envelope — Wörter atmen mit dem Ton. | Emotionaler Peak vor CTA: „Die Stille danach ist der Unterricht." | v5 (Du-Perspektive) | Scroll = Atemphrase. Räumlich spürbar, nicht erklärt. Codrops 2026-Technik (Amplitude → Type). |
| `v30-feedback/` | Dual-Slider-UI („Wie oft singst du?" / „Wie nervös machst du Bühne?") — Canvas-Partikelfeld morpht zu Pathway-Empfehlung. | Selbst-Audit → Pathway → Booking. Tactile & visuell. | v11 (Passungscheck) + v6 (Pathway) | Du schiebst die Parameter, Barbara zeigt den Weg. |
| `v31-oper-chooser/` | Buzzfeed-Style-Quiz (5 Fragen) → einer von 7 Opern-Charakteren (Mimì, Carmen, Papageno, …). Share-Karte generiert via Canvas. | Viralität als Akquise + niedrige Commitment-Schwelle (Quiz ≪ Probestunde). | v5-y2k (Y2K Chrome) + v9 | „Welche Oper bist du?" — Spielerisch, aber mit echter stimmlicher Zuordnung. |
| `v32-rooms/` | Isometrisches SVG-Zimmer von Barbaras Studio. Klickzonen auf Klavier/Stuhl/Spiegel/Fenster. **View Transitions API** zwischen Raum-Overview und Detail-Ansichten (zero framework, warme Hand-offs). | Raum-Familiarität senkt Booking-Angst („ich weiß, wo ich hingehe"). | v14 (First Lesson) | Puppenhaus-UX: bevor du kommst, bist du schon einmal da gewesen. |
| `v33-kalender-ghost/` | Rolling-Proof-Kalender mit anonymisierten Schüler-Meilensteinen („Letzten Mittwoch: Aufnahmeprüfungs-Zusage"). JSON-Feed, kein echter Name. | Social Proof ohne Testimonial-Kitsch. Zeigt: hier passiert Erfolg, hier ist aktuell Leben. | v7 (Offer) + v9 (Outcomes) | „Bei Barbara läuft was" — ohne peinliche 5-Sterne-Theater. |
| `v34-brief-an-dich/` | User → Formular (Name, Ziel, eine Sorge) → typewriter-animierter Brief von Barbara, addressiert an Visitor. Print-to-PDF. | Take-away-Asset: persönlicher Brief mit eigenem Namen = Kühlschrank-Magnet-Effekt. | v10-letter (Briefwechsel) + v5 | Barbara schreibt dir zurück, bevor du buchst. Warmer Pre-Contact. |
| `v35-zine/` | **Contrarian-Reset:** Editorial Zine/Reclam-Style, grosse Marginalien, Baseline-Grid, Pull-Quotes, keine Animation außer CSS `animation-timeline: view()` für Mask-Reveals. Zero JS. | Ultra-schnelle Ladezeit + Anti-Tech-Bro-Signal: Barbara ist Literatur, nicht Gadget. | v3 (Barbara-Stimme) + v8 (Weg zum Abitur) | Reaktion auf WebGL-Overload; zeigt: Barbara braucht keine Effekte, sie hat Substanz. |

### Pflicht-Elemente (identisch zu Phase 4)

- funktionierende `impressum.html` + `datenschutz.html`, Legal ohne schwere Runtime
- sticky CTA „Probestunde buchen" (40 € / 45 min)
- Dummy-PII (Musterstraße 1 / +49 (0)555 … / `wa.me/495551234567`)
- `prefers-reduced-motion`-Fallback
- Mobile ≥ 375 px
- `type="module"` für alle Scripts, relative `href`

### Zusätzliche Phase-5-Pflicht

- **Mess-Punkt**: jeder Entwurf exponiert einen klaren „Probestunde-ähnlichen" CTA innerhalb des Wow-Moves — nicht erst am Ende der Seite. Booking kann mitten im Flow angeboten werden (z. B. am Ende des Chat-Baums, am Ende des Quiz, nach dem Brief).
- **Graceful Degradation**: falls WebGL/Audio/Camera nicht verfügbar, fällt die Seite auf ein editoriales Phase-2/3-Pendant zurück — niemals „white screen".

### Parallelisierungs-Strategie

- **Batch 5A (Chat/Interaktion):** v26-gespraech, v30-feedback, v31-oper-chooser → 3 Agents ✅
- **Batch 5B (Audio/Physics):** v27-timeline-physics, v28-mirror, v29-ambient → 3 Agents
- **Batch 5C (Content-heavy):** v32-rooms, v33-kalender-ghost, v34-brief-an-dich, v35-zine → 4 Agents

Commit pro Batch, nicht warten auf Runde-Ende. Agents arbeiten in isolierten Worktrees, Parent-Agent merged und buildet zentral.

### Phase 5 vs. Phase 4 — Differenzierung

- Phase 4 = „schau mal, was geht" (Attraction, Erinnerbarkeit).
- Phase 5 = „mach was mit dir" (Interaktion → Entscheidung). Jeder Entwurf fragt den Visitor zu etwas (Frage beantworten, Slider schieben, Kamera-Opt-in, Formular ausfüllen, Audio wählen) und führt diese Interaktion direkt in einen Conversion-Moment über.
