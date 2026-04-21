/* v43-stimm-orakel · Tarot-Draw-Flow / Ritual
 * Vanilla ES module, no framework. 22 cards → fan → draw 3 → flip → reading.
 *
 * Tags drive the reading-template + aria selection:
 *   anfang      — Einstieg, blockade, atem
 *   blockade    — Angst, Enge
 *   bridge      — Übergang, Verbindung, Verwandlung
 *   kind        — spielerisch, Unschuld
 *   ruf         — Berufung, Bühne, Durchbruch
 *   buehne      — Performance, Präsenz, Angst auch
 *   reflexion   — Selbstbild, Spiegel
 *   maske       — Rolle, Fassade
 *   echo        — Raum, Resonanz, Gedächtnis
 *   stille      — Pause, Reduktion
 *   licht       — Klarheit, Fenster, Kerze
 *   flamme      — Leidenschaft, Energie
 *   schatten    — Unausgesprochenes, Trauer
 *   wurzel      — Stütze, Körper, tiefe Lage
 *   leicht      — Vogel, Flug, Höhe
 *   welle       — Legato, Fluss
 *   siegel      — Abschluss, Entscheidung
 *   schluessel  — Aufschluss, Durchbruch
 *   kerze       — Wärme, Ausdauer
 *   schwelle    — Zwischenraum, Übergang
 *   klang       — Timbre, Eigenton
 *   gabe        — Talent, Geschenk
 */

// --- 22 Cards ---------------------------------------------------------
const CARDS = [
  { id:"atem",       title:"Der Atem",      roman:"I",     tags:["anfang","atem"],          meaning:"Wo alles beginnt. Noch nicht Ton, schon Richtung." },
  { id:"blockade",   title:"Die Blockade",  roman:"II",    tags:["blockade","schatten"],    meaning:"Etwas hält dich zurück. Es darf gesehen werden." },
  { id:"bruecke",    title:"Die Brücke",    roman:"III",   tags:["bridge","schwelle"],      meaning:"Von einer Seite zur anderen. Du trägst dich selbst hinüber." },
  { id:"kind",       title:"Das Kind",      roman:"IV",    tags:["kind","leicht"],          meaning:"Der erste Impuls. Vor jedem Gelerntsein." },
  { id:"ruf",        title:"Der Ruf",       roman:"V",     tags:["ruf","anfang"],           meaning:"Etwas in dir will heraus. Das ist kein Zufall." },
  { id:"buehne",     title:"Die Bühne",     roman:"VI",    tags:["buehne","ruf"],           meaning:"Der Raum, in dem du sichtbar wirst. Und der, vor dem du dich versteckst." },
  { id:"spiegel",    title:"Der Spiegel",   roman:"VII",   tags:["reflexion","maske"],      meaning:"Du siehst dich – und fragst, wer da singt." },
  { id:"maske",      title:"Die Maske",     roman:"VIII",  tags:["maske","buehne"],         meaning:"Sie schützt und sie verbirgt. Zeit, sie einmal abzunehmen." },
  { id:"echo",       title:"Das Echo",      roman:"IX",    tags:["echo","klang"],           meaning:"Was zurückkommt, ist nie ganz das, was du gesendet hast." },
  { id:"stille",     title:"Die Stille",    roman:"X",     tags:["stille","reflexion"],     meaning:"Der Ton, der nicht klingt, gehört dazu." },
  { id:"fenster",    title:"Das Fenster",   roman:"XI",    tags:["licht","schwelle"],       meaning:"Ein Blick nach außen. Ein Einlass nach innen." },
  { id:"flamme",     title:"Die Flamme",    roman:"XII",   tags:["flamme","ruf"],           meaning:"Das, was brennt, will genährt werden – nicht gelöscht." },
  { id:"schatten",   title:"Der Schatten",  roman:"XIII",  tags:["schatten","blockade"],    meaning:"Was du nicht singst, singt trotzdem mit." },
  { id:"wurzel",     title:"Die Wurzel",    roman:"XIV",   tags:["wurzel","stille"],        meaning:"Unten. Wo der Ton gehalten wird, bevor er aufsteigt." },
  { id:"vogel",      title:"Der Vogel",     roman:"XV",    tags:["leicht","kind"],          meaning:"Ohne Schwere. Ohne Absicht. Einfach Flug." },
  { id:"welle",      title:"Die Welle",     roman:"XVI",   tags:["welle","bridge"],         meaning:"Eine Linie, die sich selbst trägt. Legato ist Vertrauen." },
  { id:"siegel",     title:"Das Siegel",    roman:"XVII",  tags:["siegel","reflexion"],     meaning:"Eine Entscheidung will verschlossen werden, damit sie wirkt." },
  { id:"schluessel", title:"Der Schlüssel", roman:"XVIII", tags:["schluessel","ruf"],       meaning:"Ein Klang passt. Plötzlich stimmt etwas." },
  { id:"kerze",      title:"Die Kerze",     roman:"XIX",   tags:["kerze","licht"],          meaning:"Klein, stetig, warm. Ausdauer statt Effekt." },
  { id:"schwelle",   title:"Die Schwelle",  roman:"XX",    tags:["schwelle","bridge"],      meaning:"Noch nicht drinnen. Nicht mehr draußen." },
  { id:"klang",      title:"Der Klang",     roman:"XXI",   tags:["klang","echo"],           meaning:"Dein Timbre ist kein Zufall. Es gehört zu dir." },
  { id:"gabe",       title:"Das Geschenk", roman:"XXII",   tags:["gabe","kind"],            meaning:"Was du mitbringst, hast du dir nicht verdient. Nur: es ist da." },
];

// --- 10 arias — each with a tag-affinity and a short text --------------
const ARIAS = [
  {
    id: "purcell-music",
    tagAffinity: ["anfang","bridge","welle","stille"],
    title: "Purcell · „Music for a while“",
    offer: "Erste Probestunde mit Purcell",
    body: "Eine Linie, die dich trägt, ohne zu fordern. Wir arbeiten am Atem, an Legato und am Vertrauen, dass der Ton kommen darf."
  },
  {
    id: "mozart-voi-che-sapete",
    tagAffinity: ["kind","leicht","anfang"],
    title: "Mozart · „Voi che sapete“",
    offer: "Erste Probestunde mit Mozart",
    body: "Spielerisch, klar, ehrlich. Ein Einstieg, der deine natürliche Stimme zum Strahlen bringt, ohne Druck."
  },
  {
    id: "bizet-habanera",
    tagAffinity: ["flamme","buehne","ruf","maske"],
    title: "Bizet · „L’amour est un oiseau rebelle“ (Habanera)",
    offer: "Probestunde mit Carmen",
    body: "Farbe, Präsenz, Text. Wir schärfen die Mittellage und die Geste — damit aus „laut“ „erzählend“ wird."
  },
  {
    id: "handel-lascia",
    tagAffinity: ["schatten","stille","welle","wurzel"],
    title: "Händel · „Lascia ch’io pianga“",
    offer: "Probestunde mit Händel",
    body: "Ein schlichtes Lamento. Wir arbeiten an der Linie, die im Raum stehen bleibt, ohne zu drücken."
  },
  {
    id: "puccini-mi-chiamano",
    tagAffinity: ["reflexion","klang","kind","anfang"],
    title: "Puccini · „Mi chiamano Mimì“",
    offer: "Probestunde mit Puccini",
    body: "Sprechnah, zart, intim. Deine Stimme lernt, Nähe zu erzeugen statt Volumen."
  },
  {
    id: "mozart-papageno",
    tagAffinity: ["kind","leicht","gabe","echo"],
    title: "Mozart · „Der Vogelfänger bin ich ja“",
    offer: "Probestunde mit Papageno",
    body: "Direkt, warm, unprätentiös. Wir suchen Tragfähigkeit, damit aus „einfach“ nicht „leise“ wird."
  },
  {
    id: "mozart-koenigin",
    tagAffinity: ["ruf","flamme","schluessel","siegel"],
    title: "Mozart · „Der Hölle Rache“",
    offer: "Probestunde mit der Königin",
    body: "Höhe, Koloratur, Fokus. Wir bauen das Fundament, das die Spitzen trägt — ohne Kompromiss am Sitz."
  },
  {
    id: "mozart-sarastro",
    tagAffinity: ["wurzel","stille","kerze","klang"],
    title: "Mozart · „In diesen heil’gen Hallen“",
    offer: "Probestunde mit Sarastro",
    body: "Tiefe, die trägt. Wir arbeiten an Stütze, damit der tiefe Ton nicht schwer wird."
  },
  {
    id: "schumann-mondnacht",
    tagAffinity: ["licht","fenster","schwelle","bridge"],
    title: "Schumann · „Mondnacht“",
    offer: "Probestunde mit Schumann",
    body: "Fast unhörbar am Anfang, dann eine einzige lange Linie. Wir arbeiten am Schweben."
  },
  {
    id: "brahms-wiegenlied",
    tagAffinity: ["kerze","stille","kind","wurzel"],
    title: "Brahms · „Wiegenlied“",
    offer: "Probestunde mit Brahms",
    body: "Ausdauer, Wärme, Ruhe. Ein kleines Lied, das große Stützarbeit braucht."
  },
];

// --- Reading text templates --------------------------------------------
// Each template returns a personalized sentence using the drawn card titles.
const TEMPLATES = [
  {
    match: (tags) => tags.has("anfang") && tags.has("bridge"),
    text: (a,b,c) => `Du hast <strong>${a}</strong>, <strong>${b}</strong> und <strong>${c}</strong> gezogen. Das ist ein Anfangsritual — du weißt, dass etwas in dir klingen will, aber der Weg ist noch unscharf. Genau dort lässt sich am ehrlichsten beginnen.`
  },
  {
    match: (tags) => tags.has("blockade") && tags.has("ruf"),
    text: (a,b,c) => `Zwischen <strong>${a}</strong>, <strong>${b}</strong> und <strong>${c}</strong> steht ein Widerspruch: etwas ruft dich, und etwas hält dich. Das ist nicht selten – es ist der ehrlichste Ausgangspunkt, den eine Stimme haben kann.`
  },
  {
    match: (tags) => tags.has("buehne") && tags.has("maske"),
    text: (a,b,c) => `<strong>${a}</strong>, <strong>${b}</strong>, <strong>${c}</strong> — du bist schon nah an der Bühne, aber noch nicht ganz bei dir. Wir arbeiten daran, dass der Raum dich hält, nicht deine Rolle.`
  },
  {
    match: (tags) => tags.has("leicht") || tags.has("kind"),
    text: (a,b,c) => `Du hast <strong>${a}</strong>, <strong>${b}</strong> und <strong>${c}</strong> gezogen. Das ist ein leichter Zug – deine Stimme will nicht beweisen, sie will spielen. Wir geben ihr Raum, ohne sie zu erziehen.`
  },
  {
    match: (tags) => tags.has("wurzel") || tags.has("stille"),
    text: (a,b,c) => `<strong>${a}</strong>, <strong>${b}</strong>, <strong>${c}</strong> – das ist ein stiller Zug. Deine Stimme will nicht lauter werden, sondern tiefer wurzeln. Daraus entsteht Tragfähigkeit.`
  },
  {
    match: (tags) => tags.has("flamme") || tags.has("schluessel"),
    text: (a,b,c) => `Mit <strong>${a}</strong>, <strong>${b}</strong> und <strong>${c}</strong> brennt etwas. Deine Stimme hat schon eine Richtung — wir bauen jetzt das Fundament, damit das Feuer dich trägt, nicht verbrennt.`
  },
  {
    match: (tags) => tags.has("echo") || tags.has("klang"),
    text: (a,b,c) => `<strong>${a}</strong>, <strong>${b}</strong>, <strong>${c}</strong> – das ist ein Zug des Hinhörens. Dein Timbre ist schon da. Wir arbeiten daran, dass du ihm vertraust.`
  },
  {
    match: () => true, // Fallback
    text: (a,b,c) => `<strong>${a}</strong>, <strong>${b}</strong>, <strong>${c}</strong>. Drei Karten, die zusammen eine Frage stellen: Was in dir will jetzt klingen? Wir fangen genau dort an, wo du bist.`
  }
];

// --- Symbols (tiny SVGs per card) --------------------------------------
// Abstract, symbolic. No figure detail realism.
const SYMBOLS = {
  atem:       `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="24" cy="24" r="4"/><circle cx="24" cy="24" r="10" opacity=".55"/><circle cx="24" cy="24" r="16" opacity=".28"/><circle cx="24" cy="24" r="22" opacity=".14"/></svg>`,
  blockade:   `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="10" y="10" width="28" height="28"/><line x1="10" y1="10" x2="38" y2="38"/></svg>`,
  bruecke:    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 32 Q24 14 42 32"/><line x1="6" y1="32" x2="6" y2="40"/><line x1="18" y1="26" x2="18" y2="40"/><line x1="30" y1="26" x2="30" y2="40"/><line x1="42" y1="32" x2="42" y2="40"/></svg>`,
  kind:       `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="24" cy="18" r="6"/><path d="M12 38 Q24 26 36 38"/></svg>`,
  ruf:        `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M14 24 L30 14 L30 34 Z" fill="currentColor" opacity=".35"/><path d="M32 18 Q38 24 32 30"/><path d="M36 14 Q44 24 36 34" opacity=".55"/></svg>`,
  buehne:     `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="24" cy="36" rx="18" ry="4"/><line x1="24" y1="10" x2="24" y2="32"/><circle cx="24" cy="14" r="4" fill="currentColor" opacity=".35"/></svg>`,
  spiegel:    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="24" cy="24" rx="10" ry="16"/><ellipse cx="24" cy="24" rx="10" ry="16" transform="translate(4 0)" opacity=".35"/></svg>`,
  maske:      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M10 18 Q24 10 38 18 Q38 34 24 38 Q10 34 10 18 Z"/><circle cx="18" cy="24" r="2" fill="currentColor"/><circle cx="30" cy="24" r="2" fill="currentColor"/></svg>`,
  echo:       `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M10 24 Q14 16 18 24 Q22 32 26 24 Q30 16 34 24 Q38 32 42 24" opacity=".8"/><path d="M10 30 Q14 22 18 30 Q22 38 26 30 Q30 22 34 30 Q38 38 42 30" opacity=".4"/></svg>`,
  stille:     `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="24" cy="24" r="18" opacity=".45"/><circle cx="24" cy="24" r="1.5" fill="currentColor"/></svg>`,
  fenster:    `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="10" y="8" width="28" height="32"/><line x1="24" y1="8" x2="24" y2="40"/><line x1="10" y1="24" x2="38" y2="24"/></svg>`,
  flamme:     `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M24 8 Q34 22 28 30 Q34 34 24 42 Q14 34 20 30 Q14 22 24 8 Z" fill="currentColor" opacity=".25"/><path d="M24 8 Q34 22 28 30 Q34 34 24 42 Q14 34 20 30 Q14 22 24 8 Z"/></svg>`,
  schatten:   `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="20" cy="20" r="10"/><circle cx="28" cy="28" r="10" fill="currentColor" opacity=".4"/></svg>`,
  wurzel:     `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><line x1="24" y1="10" x2="24" y2="26"/><path d="M24 26 Q14 32 10 42"/><path d="M24 26 Q34 32 38 42"/><path d="M24 26 Q22 34 18 42"/><path d="M24 26 Q26 34 30 42"/></svg>`,
  vogel:      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 30 Q16 20 24 26 Q32 20 40 30"/><path d="M4 36 Q12 30 20 34" opacity=".45"/></svg>`,
  welle:      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 24 Q12 14 20 24 T36 24 T52 24"/><path d="M4 32 Q12 22 20 32 T36 32 T52 32" opacity=".45"/></svg>`,
  siegel:     `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="24" cy="24" r="16"/><path d="M24 12 L26 24 L36 26 L26 28 L24 36 L22 28 L12 26 L22 24 Z" fill="currentColor" opacity=".35"/></svg>`,
  schluessel: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="18" cy="20" r="6"/><line x1="23" y1="22" x2="40" y2="30"/><line x1="36" y1="28" x2="36" y2="34"/><line x1="40" y1="30" x2="40" y2="34"/></svg>`,
  kerze:      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="20" y="20" width="8" height="22"/><path d="M24 10 Q28 14 26 18 Q22 18 22 14 Z" fill="currentColor" opacity=".5"/></svg>`,
  schwelle:   `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="12" y="10" width="24" height="32"/><line x1="12" y1="26" x2="36" y2="26"/></svg>`,
  klang:      `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="24" cy="24" r="4"/><circle cx="24" cy="24" r="8" opacity=".7"/><circle cx="24" cy="24" r="13" opacity=".45"/><circle cx="24" cy="24" r="18" opacity=".2"/></svg>`,
  gabe:       `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="10" y="20" width="28" height="20"/><line x1="24" y1="14" x2="24" y2="40"/><line x1="10" y1="20" x2="38" y2="20"/><path d="M24 20 Q18 12 14 14 Q12 18 24 20"/><path d="M24 20 Q30 12 34 14 Q36 18 24 20"/></svg>`,
};

const BACK_PATTERN = `
<svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="lattice" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <path d="M0 7 L14 7 M7 0 L7 14" stroke="#d4a24c" stroke-opacity=".18" stroke-width=".6"/>
    </pattern>
  </defs>
  <rect width="120" height="200" fill="url(#lattice)"/>
  <rect x="6" y="6" width="108" height="188" fill="none" stroke="#d4a24c" stroke-opacity=".55" stroke-width=".8" rx="6"/>
  <g transform="translate(60 100)" fill="none" stroke="#d4a24c" stroke-width=".8">
    <circle r="22" opacity=".8"/>
    <circle r="14" opacity=".55"/>
    <circle r="6" opacity=".4"/>
    <path d="M0 -28 L4 0 L0 28 L-4 0 Z" fill="#d4a24c" fill-opacity=".3"/>
  </g>
  <g fill="#d4a24c" fill-opacity=".6" font-family="Fraunces, serif" font-style="italic" text-anchor="middle">
    <text x="60" y="38" font-size="11" letter-spacing="2">STIMM</text>
    <text x="60" y="172" font-size="11" letter-spacing="2">ORAKEL</text>
  </g>
</svg>`;

// --- State ------------------------------------------------------------
let deck = [];          // shuffled copy of CARDS
let drawn = [];         // up to 3 cards in draw-order
const SLOTS = ["Der Atem","Die Brücke","Der Ruf"];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- DOM helpers ------------------------------------------------------
const $ = (id) => document.getElementById(id);
const fanEl     = $("fan");
const ritualEl  = $("ritual");
const spreadEl  = $("spread");
const readingEl = $("reading");
const readingBody = $("readingBody");
const offerTitleEl = $("offerTitle");
const offerBodyEl  = $("offerBody");
const hiddenDraw = $("hiddenDraw");

// --- Fisher–Yates shuffle --------------------------------------------
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- Fan layout ------------------------------------------------------
function layoutFan() {
  const cards = Array.from(fanEl.querySelectorAll(".card"));
  const n = cards.length;
  if (n === 0) return;

  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  if (isMobile) {
    // Mobile: linear row (CSS handles layout via flex). Clear any transform.
    cards.forEach(c => {
      if (!c.classList.contains("is-drawn") && !c.classList.contains("is-flipped")) {
        c.style.removeProperty("--fan-transform");
        c.style.transform = "";
      }
    });
    return;
  }

  // Desktop/tablet: arc fan
  const spread = Math.min(90, 6 + n * 3.6);   // degrees total spread
  const step = spread / (n - 1);
  const start = -spread / 2;
  const radius = 420;

  cards.forEach((card, i) => {
    if (card.classList.contains("is-drawn")) return;
    const angle = start + step * i;
    // translate downward to sit on pivot, then rotate around pivot
    const tx = Math.sin(angle * Math.PI / 180) * (radius * 0.08);
    const ty = -Math.cos(angle * Math.PI / 180) * 20 + 40;
    const transform = `translate(${tx}px, ${ty}px) rotate(${angle}deg)`;
    card.style.setProperty("--fan-transform", transform);
    if (!card.classList.contains("is-flipped")) {
      card.style.transform = transform;
    }
  });
}

// --- Build card DOM --------------------------------------------------
function buildCardEl(card, index) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "card";
  btn.dataset.cardId = card.id;
  btn.setAttribute("aria-label", `Karte ${index + 1} ziehen`);

  const back = document.createElement("div");
  back.className = "card-face card-face-back";
  back.innerHTML = BACK_PATTERN;
  back.setAttribute("aria-hidden", "true");

  const front = document.createElement("div");
  front.className = "card-face card-face-front";
  front.innerHTML = `
    <div class="card-front-frame">
      <p class="card-front-roman">${card.roman}</p>
      <div class="card-front-art" aria-hidden="true">${SYMBOLS[card.id] || ""}</div>
      <p class="card-front-title">${card.title}</p>
    </div>
  `;

  btn.appendChild(back);
  btn.appendChild(front);
  btn.addEventListener("click", () => onCardClick(card, btn));
  return btn;
}

// --- Build fan ------------------------------------------------------
function renderDeck() {
  fanEl.innerHTML = "";
  deck.forEach((card, i) => {
    const el = buildCardEl(card, i);
    // stagger reveal
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    fanEl.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "1";
      layoutFan();
    }, 30 + i * 22);
  });
}

// --- Card click -----------------------------------------------------
function onCardClick(card, btn) {
  if (drawn.length >= 3) return;
  if (btn.classList.contains("is-drawn") || btn.classList.contains("is-flipped")) return;

  drawn.push(card);
  btn.classList.add("is-flipped", "is-drawn");
  btn.setAttribute("aria-label", `${card.title}: ${card.meaning}`);
  btn.setAttribute("aria-pressed", "true");

  // mark slot as filled
  const slotEl = ritualEl.querySelector(`.slot[data-slot="${drawn.length - 1}"]`);
  if (slotEl) slotEl.classList.add("is-filled");

  // Animate card flying to slot: fade it out after flip, JS layer reveals spread after 3.
  const delay = reduceMotion ? 50 : 700;
  setTimeout(() => {
    btn.style.opacity = "0";
    btn.style.pointerEvents = "none";
  }, delay);

  if (drawn.length === 3) {
    setTimeout(() => revealSpread(), reduceMotion ? 120 : 1100);
  }
}

// --- Spread reveal --------------------------------------------------
function revealSpread() {
  spreadEl.innerHTML = "";
  drawn.forEach((card, i) => {
    const el = document.createElement("article");
    el.className = "spread-card";
    el.innerHTML = `
      <p class="spread-card-slot">${SLOTS[i]}</p>
      <div class="spread-card-frame">
        <div class="spread-card-art" aria-hidden="true">${SYMBOLS[card.id] || ""}</div>
        <p class="spread-card-title">${card.title}</p>
        <p class="spread-card-meaning">${card.meaning}</p>
      </div>
    `;
    spreadEl.appendChild(el);
  });
  spreadEl.hidden = false;
  // fade fan
  fanEl.style.transition = "opacity .5s ease";
  fanEl.style.opacity = "0.25";
  setTimeout(() => { fanEl.style.display = "none"; }, reduceMotion ? 80 : 600);

  // Build reading
  const tagSet = new Set();
  drawn.forEach(c => c.tags.forEach(t => tagSet.add(t)));

  const tpl = TEMPLATES.find(t => t.match(tagSet)) || TEMPLATES[TEMPLATES.length - 1];
  readingBody.innerHTML = tpl.text(drawn[0].title, drawn[1].title, drawn[2].title);

  // Pick aria with max affinity score
  let best = ARIAS[0]; let bestScore = -1;
  for (const aria of ARIAS) {
    let score = 0;
    for (const t of aria.tagAffinity) if (tagSet.has(t)) score++;
    if (score > bestScore) { bestScore = score; best = aria; }
  }
  offerTitleEl.textContent = best.offer;
  offerBodyEl.innerHTML = `Barbara arbeitet mit Zügen wie deinem gerne mit <strong>${best.title}</strong>. ${best.body}`;

  // Hidden form field
  hiddenDraw.value = drawn.map(c => c.title).join(" · ") + " → " + best.title;

  readingEl.hidden = false;
  // Scroll into view
  setTimeout(() => {
    readingEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, reduceMotion ? 80 : 300);
}

// --- Reshuffle -----------------------------------------------------
function reshuffle() {
  drawn = [];
  spreadEl.hidden = true;
  spreadEl.innerHTML = "";
  readingEl.hidden = true;
  hiddenDraw.value = "";
  ritualEl.querySelectorAll(".slot").forEach(s => s.classList.remove("is-filled"));
  fanEl.style.display = "";
  fanEl.style.opacity = "1";

  deck = shuffle(CARDS);
  renderDeck();
}

// --- Open deck (hero CTA) ------------------------------------------
function openDeck() {
  ritualEl.hidden = false;
  deck = shuffle(CARDS);
  renderDeck();
  setTimeout(() => {
    ritualEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, 80);
}

// --- Wire up -------------------------------------------------------
$("openDeckBtn").addEventListener("click", openDeck);
$("reshuffleBtn").addEventListener("click", reshuffle);

window.addEventListener("resize", () => {
  // Debounce would be nice but keep it simple
  layoutFan();
});
