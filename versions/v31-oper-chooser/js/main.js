/* v31-oper-chooser · Welche Oper bist du?
 * Vanilla ES module, no framework. Quiz → axis scoring → archetype → share card.
 *
 * Scoring axes (each answer adds 0–3 points to 2–3 axes):
 *   lyrisch      ←→ dramatisch
 *   introvertiert←→ extrovertiert
 *   technisch    ←→ erzaehlend
 *   hoch (höhe)  ←→ tief (tiefe)
 *
 * Each character has a target signature on these axes; winner is min Euclidean distance.
 * Axes log tagged `[axes]` in console during dev.
 */

// --------------------------------------------------------------
// CHARACTERS — 7 opera archetypes with axis signatures
// axes: [lyrisch, dramatisch, introvertiert, extrovertiert, technisch, erzaehlend, hoch, tief]
// signatures are expressed as a target vector across those same keys.
// --------------------------------------------------------------

const CHARACTERS = {
  mimi: {
    id: "mimi",
    name: "Mimì",
    work: "La Bohème · Puccini",
    accent: "#9cb8d4",        // pale blue
    accentInk: "#0d2033",
    gradient: ["#c8d9ea", "#7f9ab5"],
    axes: { lyrisch: 3, dramatisch: 0, introvertiert: 2, extrovertiert: 1, technisch: 1, erzaehlend: 2, hoch: 2, tief: 0 },
    line: "Eine Stimme, die flüstern kann und trotzdem trägt.",
    profile: "Deine Stimme ist lyrisch und zart — sie gewinnt nicht durch Lautstärke, sondern durch Nähe. Wir arbeiten am Ton, der im Raum steht, ohne zu drücken.",
    focus: "Atem & Legato",
    pathway: "Lied / Kunstlied",
    cta: "Einen Ton finden, der trägt",
    share: "Mi chiamano Mimì."
  },
  carmen: {
    id: "carmen",
    name: "Carmen",
    work: "Carmen · Bizet",
    accent: "#a31f2b",        // deep red
    accentInk: "#ffffff",
    gradient: ["#d94a56", "#6b1018"],
    axes: { lyrisch: 0, dramatisch: 3, introvertiert: 0, extrovertiert: 3, technisch: 1, erzaehlend: 3, hoch: 1, tief: 2 },
    line: "Eine Stimme, die eine Geschichte mitbringt.",
    profile: "Du bringst Farbe, Körper und Präsenz mit — dein Ton will erzählen, nicht dienen. Wir schärfen Mittellage und Text, damit die Geste nicht zur Lautstärke wird.",
    focus: "Mittellage & Text-Fokus",
    pathway: "Oper / Bühne",
    cta: "Eine Stimme, die erzählt",
    share: "L'amour est un oiseau rebelle."
  },
  papageno: {
    id: "papageno",
    name: "Papageno",
    work: "Die Zauberflöte · Mozart",
    accent: "#3f5d3c",        // forest
    accentInk: "#ffffff",
    gradient: ["#7fa36a", "#2a3f28"],
    axes: { lyrisch: 1, dramatisch: 1, introvertiert: 0, extrovertiert: 3, technisch: 0, erzaehlend: 3, hoch: 0, tief: 2 },
    line: "Eine Stimme ohne Pose — und genau deshalb stark.",
    profile: "Dein Ton ist warm, unprätentiös, direkt. Wir lassen die Natürlichkeit, suchen aber Tragfähigkeit, damit aus „einfach“ nicht „leise“ wird.",
    focus: "Tragfähigkeit & Diktion",
    pathway: "Lied / Pop / Musical",
    cta: "Singen wie du sprichst — nur tragender",
    share: "Der Vogelfänger bin ich ja."
  },
  graf: {
    id: "graf",
    name: "Der Graf",
    work: "Le nozze di Figaro · Mozart",
    accent: "#2d3e50",        // deep steel blue
    accentInk: "#ffffff",
    gradient: ["#5c748d", "#15212e"],
    axes: { lyrisch: 1, dramatisch: 2, introvertiert: 2, extrovertiert: 1, technisch: 3, erzaehlend: 2, hoch: 0, tief: 2 },
    line: "Eine Stimme, die sich zusammennimmt, ohne eng zu werden.",
    profile: "Du arbeitest präzise, kontrolliert, sprechnah — Rezitativ-Affinität, klare Linien. Wir öffnen die Kontrolle, damit aus Beherrschung Ausdruck wird.",
    focus: "Register-Ausgleich",
    pathway: "Klassik / Sprechstimme",
    cta: "Präzision, die trotzdem atmet",
    share: "Vedrò mentr'io sospiro."
  },
  sarastro: {
    id: "sarastro",
    name: "Sarastro",
    work: "Die Zauberflöte · Mozart",
    accent: "#3a2a5c",        // deep violet
    accentInk: "#ffffff",
    gradient: ["#6b549b", "#1f1436"],
    axes: { lyrisch: 2, dramatisch: 1, introvertiert: 2, extrovertiert: 1, technisch: 2, erzaehlend: 2, hoch: 0, tief: 3 },
    line: "Eine Stimme, die nicht laut sein muss, um Raum zu füllen.",
    profile: "Du hast Tiefe — klangliche und menschliche. Wir arbeiten am Stütz-Gefühl, damit die tiefe Lage nicht schwer wird, sondern getragen.",
    focus: "Tiefe & Stütze",
    pathway: "Klassik / Chor / Oratorium",
    cta: "Eine Tiefe, die trägt, nicht drückt",
    share: "In diesen heil'gen Hallen."
  },
  koenigin: {
    id: "koenigin",
    name: "Königin der Nacht",
    work: "Die Zauberflöte · Mozart",
    accent: "#1a1a2e",        // near-black with blue
    accentInk: "#f0c87a",
    gradient: ["#3d3d62", "#0a0a1a"],
    axes: { lyrisch: 1, dramatisch: 3, introvertiert: 1, extrovertiert: 2, technisch: 3, erzaehlend: 1, hoch: 3, tief: 0 },
    line: "Eine Stimme, die oben nichts verschenkt.",
    profile: "Du suchst Präzision in der Höhe, Koloratur, Fokus. Wir bauen das Fundament, das die Spitzen trägt — ohne Kompromiss an den Sitz.",
    focus: "Höhe & Koloratur",
    pathway: "Klassik / Koloratur",
    cta: "Höhe, die sitzt — nicht zittert",
    share: "Der Hölle Rache kocht in meinem Herzen."
  },
  hanssachs: {
    id: "hanssachs",
    name: "Hans Sachs",
    work: "Die Meistersinger · Wagner",
    accent: "#7a5a2f",        // bronze / walnut
    accentInk: "#fff8e7",
    gradient: ["#b38947", "#3b2a12"],
    axes: { lyrisch: 2, dramatisch: 2, introvertiert: 2, extrovertiert: 1, technisch: 2, erzaehlend: 3, hoch: 0, tief: 2 },
    line: "Eine Stimme, in der schon etwas gelebt hat.",
    profile: "Du bringst Reife, Geduld, langen Atem mit — erzählerisches Tempo statt Effekt. Wir arbeiten an Ausdauer und Linie, damit die Stimme ein langes Stück trägt.",
    focus: "Ausdauer & Linie",
    pathway: "Lied / Oratorium / Wiedereinstieg",
    cta: "Eine Stimme mit Geduld",
    share: "Wahn, Wahn, überall Wahn."
  }
};

// --------------------------------------------------------------
// QUIZ — 5 questions, each choice adds points to 2–3 axes
// axes schema: { axisKey: points } — values 0–3
// --------------------------------------------------------------

const QUESTIONS = [
  {
    eyebrow: "Frage 1 · Deine Haltung",
    text: "Wenn du singst — was soll im Raum passieren?",
    choices: [
      { text: "Nähe. Eine leise Bewegung, fast ein Flüstern, das ankommt.",            axes: { lyrisch: 3, introvertiert: 2, technisch: 1 } },
      { text: "Eine Geschichte. Ich will erzählen, nicht nur schön sein.",             axes: { erzaehlend: 3, extrovertiert: 2, dramatisch: 2 } },
      { text: "Präzision. Eine Linie, die sitzt — auch in den Spitzen.",               axes: { technisch: 3, dramatisch: 2, hoch: 2 } },
      { text: "Wärme. Ich mag's natürlich, ohne Pose.",                                 axes: { lyrisch: 1, extrovertiert: 1, erzaehlend: 2 } }
    ]
  },
  {
    eyebrow: "Frage 2 · Deine Lage",
    text: "Wo fühlst du dich in deiner Stimme zu Hause?",
    choices: [
      { text: "Oben. Helle Höhe, leichte Spitzen — auch wenn's herausfordert.",        axes: { hoch: 3, technisch: 2, lyrisch: 1 } },
      { text: "Mittellage. Das ist mein Gesprächs-Ton, meine natürliche Farbe.",       axes: { erzaehlend: 3, extrovertiert: 2, lyrisch: 1 } },
      { text: "Unten. Ich liebe die tiefe Lage, sie gibt mir Boden.",                  axes: { tief: 3, introvertiert: 1, dramatisch: 1 } },
      { text: "Ich weiß es nicht genau — irgendwo dazwischen.",                        axes: { introvertiert: 1, technisch: 1, erzaehlend: 1 } }
    ]
  },
  {
    eyebrow: "Frage 3 · Dein Publikum",
    text: "Vor welchem Raum siehst du dich eher?",
    choices: [
      { text: "Ein Liederabend. Flügel, wenige Menschen, viel Zuhören.",               axes: { lyrisch: 3, introvertiert: 3, technisch: 1 } },
      { text: "Eine Opernbühne. Kostüm, Licht, eine Figur, die ich werde.",            axes: { dramatisch: 3, extrovertiert: 3, erzaehlend: 2 } },
      { text: "Ein Konzertsaal. Oratorium, Orchester, lange Linie.",                    axes: { tief: 2, technisch: 2, lyrisch: 2 } },
      { text: "Ein Kreis Menschen, die zuhören, weil sie mich mögen.",                 axes: { erzaehlend: 2, extrovertiert: 2, lyrisch: 1 } }
    ]
  },
  {
    eyebrow: "Frage 4 · Dein Stil",
    text: "Was reizt dich an einem Stück am meisten?",
    choices: [
      { text: "Eine technische Hürde, an der man gemeinsam arbeiten kann.",            axes: { technisch: 3, dramatisch: 1, hoch: 2 } },
      { text: "Eine emotionale Wahrheit, die ich verkörpern kann.",                    axes: { dramatisch: 3, erzaehlend: 2, extrovertiert: 2 } },
      { text: "Ein Text, der jeden Ton begründet.",                                    axes: { erzaehlend: 3, technisch: 1, lyrisch: 1 } },
      { text: "Die Ruhe. Eine Phrase, die ich endlos halten kann.",                    axes: { lyrisch: 3, introvertiert: 2, tief: 1 } }
    ]
  },
  {
    eyebrow: "Frage 5 · Dein Temperament",
    text: "Wenn du nervös wirst — was passiert?",
    choices: [
      { text: "Ich werde leiser, ziehe mich zurück, atme flach.",                      axes: { introvertiert: 3, lyrisch: 1 } },
      { text: "Ich überspiele es mit Energie, manchmal zu viel davon.",                axes: { extrovertiert: 3, dramatisch: 2, erzaehlend: 1 } },
      { text: "Ich kontrolliere mehr, spiele sicher, lasse weniger zu.",               axes: { technisch: 3, introvertiert: 1 } },
      { text: "Ich werde redseliger, suche Kontakt zum Publikum.",                     axes: { erzaehlend: 2, extrovertiert: 2, dramatisch: 1 } }
    ]
  }
];

// --------------------------------------------------------------
// STATE
// --------------------------------------------------------------

const state = {
  index: 0,
  answers: new Array(QUESTIONS.length).fill(null), // chosen choice index per question
  scores: null
};

// --------------------------------------------------------------
// BOOT
// --------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const screens = {
  intro: $("screen-intro"),
  quiz: $("screen-quiz"),
  result: $("screen-result")
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showScreen(which) {
  for (const [key, el] of Object.entries(screens)) {
    if (key === which) {
      el.hidden = false;
      // two-frame to allow transition
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-active")));
    } else {
      el.classList.remove("is-active");
      el.hidden = true;
    }
  }
  // scroll to top on screen change
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

$("startBtn").addEventListener("click", () => {
  state.index = 0;
  state.answers.fill(null);
  renderQuestion();
  showScreen("quiz");
});

$("nextBtn").addEventListener("click", onNext);
$("backBtn").addEventListener("click", onBack);
$("restartBtn").addEventListener("click", () => {
  state.index = 0;
  state.answers.fill(null);
  showScreen("intro");
});

// --------------------------------------------------------------
// RENDER QUESTION
// --------------------------------------------------------------

function renderQuestion() {
  const q = QUESTIONS[state.index];
  const card = $("quizCard");
  const letters = ["A", "B", "C", "D"];

  card.innerHTML = `
    <p class="q-eyebrow">${escapeHtml(q.eyebrow)}</p>
    <h2 class="q-question">${escapeHtml(q.text)}</h2>
    <ul class="choices" role="radiogroup" aria-label="${escapeHtml(q.text)}">
      ${q.choices.map((c, i) => `
        <li>
          <label class="choice${state.answers[state.index] === i ? " is-selected" : ""}" data-index="${i}">
            <input type="radio" name="q${state.index}" value="${i}"${state.answers[state.index] === i ? " checked" : ""}>
            <span class="choice-key">${letters[i]}</span>
            <span class="choice-text">${escapeHtml(c.text)}</span>
          </label>
        </li>
      `).join("")}
    </ul>
  `;

  // attach handlers
  card.querySelectorAll(".choice").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const i = parseInt(el.dataset.index, 10);
      selectChoice(i);
    });
  });

  // progress
  const progress = ((state.index + 1) / QUESTIONS.length) * 100;
  $("progressBar").style.width = `${progress}%`;
  $("progressLabel").textContent = `Frage ${state.index + 1} / ${QUESTIONS.length}`;

  // buttons
  $("backBtn").disabled = state.index === 0;
  $("nextBtn").disabled = state.answers[state.index] === null;
  $("nextBtn").textContent = state.index === QUESTIONS.length - 1 ? "Ergebnis" : "Weiter";

  // focus first choice for keyboard users
  const firstChoice = card.querySelector(".choice");
  if (firstChoice) firstChoice.setAttribute("tabindex", "0");
}

function selectChoice(i) {
  state.answers[state.index] = i;
  // visual update
  document.querySelectorAll("#quizCard .choice").forEach((el, idx) => {
    el.classList.toggle("is-selected", idx === i);
    const input = el.querySelector("input");
    if (input) input.checked = idx === i;
  });
  $("nextBtn").disabled = false;
}

function onNext() {
  if (state.answers[state.index] === null) return;
  if (state.index === QUESTIONS.length - 1) {
    computeResult();
    renderResult();
    showScreen("result");
    return;
  }
  state.index += 1;
  renderQuestion();
}

function onBack() {
  if (state.index === 0) return;
  state.index -= 1;
  renderQuestion();
}

// --------------------------------------------------------------
// KEYBOARD SHORTCUTS
// --------------------------------------------------------------

document.addEventListener("keydown", (e) => {
  if (screens.quiz.hidden) return;

  const key = e.key;
  if (["1", "2", "3", "4"].includes(key)) {
    const i = parseInt(key, 10) - 1;
    const q = QUESTIONS[state.index];
    if (i < q.choices.length) {
      e.preventDefault();
      selectChoice(i);
    }
  } else if (key === "ArrowRight" || key === "Enter") {
    if (!$("nextBtn").disabled) {
      e.preventDefault();
      onNext();
    }
  } else if (key === "ArrowLeft") {
    if (!$("backBtn").disabled) {
      e.preventDefault();
      onBack();
    }
  }
});

// --------------------------------------------------------------
// SCORING
// --------------------------------------------------------------

function computeResult() {
  // accumulate axis scores
  const axes = { lyrisch: 0, dramatisch: 0, introvertiert: 0, extrovertiert: 0, technisch: 0, erzaehlend: 0, hoch: 0, tief: 0 };
  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const ai = state.answers[qi];
    if (ai === null) continue;
    const contrib = QUESTIONS[qi].choices[ai].axes;
    for (const [k, v] of Object.entries(contrib)) {
      axes[k] = (axes[k] || 0) + v;
    }
  }
  state.scores = axes;
  console.log("[axes]", axes);

  // find best-match character via euclidean distance
  let best = null;
  let bestDist = Infinity;
  for (const c of Object.values(CHARACTERS)) {
    let d = 0;
    for (const k of Object.keys(axes)) {
      const diff = (axes[k] || 0) - (c.axes[k] || 0) * 2; // scale target since 5 questions can contribute
      d += diff * diff;
    }
    if (d < bestDist) { bestDist = d; best = c; }
  }
  state.character = best;
  console.log("[match]", best.name, { distance: bestDist });
}

// --------------------------------------------------------------
// RESULT RENDER
// --------------------------------------------------------------

function renderResult() {
  const c = state.character;
  const card = $("resultCard");

  // set accent CSS vars on the result card for per-character coloring
  card.style.setProperty("--accent", c.accent);
  card.style.setProperty("--accent-soft", mixRgb(c.accent, "#ffffff", 0.75));
  document.documentElement.style.setProperty("--accent", c.accent);

  card.innerHTML = `
    <p class="r-overline">Dein Ergebnis · Figur Nº ${Object.keys(CHARACTERS).indexOf(c.id) + 1} von 7</p>
    <h2 class="r-name">${escapeHtml(c.name)}</h2>
    <p class="r-work">${escapeHtml(c.work)}</p>
    <blockquote class="r-line">„${escapeHtml(c.line)}“</blockquote>
    <p class="r-profile">${escapeHtml(c.profile)}</p>
    <div class="r-meta">
      <div class="r-meta-item">
        <p class="r-meta-label">Stimm-Fokus</p>
        <p class="r-meta-value">${escapeHtml(c.focus)}</p>
      </div>
      <div class="r-meta-item">
        <p class="r-meta-label">Repertoire-Richtung</p>
        <p class="r-meta-value">${escapeHtml(c.pathway)}</p>
      </div>
    </div>
    <div class="r-actions">
      <button type="button" class="btn-ghost" id="shareBtn">Teilen · PNG herunterladen</button>
      <a class="btn-ghost" id="waFigurCta" href="${buildWhatsAppLink(c)}" target="_blank" rel="noopener">Figur an Barbara schicken</a>
    </div>
  `;

  // update aside
  $("asideSub").textContent = `„${c.cta}.“`;
  $("bookCta").setAttribute("href", "#kontakt");
  $("bookCta").textContent = c.cta;
  $("waCta").setAttribute("href", buildWhatsAppLink(c));

  // prefill hidden form field
  $("hiddenFigur").value = `${c.name} (${c.work}) — Fokus: ${c.focus}, Pfad: ${c.pathway}`;

  // share button
  $("shareBtn").addEventListener("click", async () => {
    await generateShareCard(c);
  });
}

// --------------------------------------------------------------
// WHATSAPP DEEPLINK
// --------------------------------------------------------------

function buildWhatsAppLink(c) {
  const text = `Hallo Barbara, das Quiz sagt ich bin ${c.name} (${c.work}). Ich hätte gerne eine Probestunde — Fokus: ${c.focus}.`;
  return `https://wa.me/495551234567?text=${encodeURIComponent(text)}`;
}

// --------------------------------------------------------------
// SHARE CARD · Canvas 2D, 1200×630 PNG download
// --------------------------------------------------------------

async function generateShareCard(c) {
  const canvas = $("shareCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // ensure Fraunces is loaded before drawing
  try {
    await document.fonts.ready;
    await document.fonts.load("italic 120px 'Fraunces'");
    await document.fonts.load("500 32px 'Inter'");
  } catch (_) { /* font API best-effort */ }

  // background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c.gradient[0]);
  grad.addColorStop(1, c.gradient[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // subtle paper grain overlay
  ctx.fillStyle = "rgba(246, 238, 222, 0.06)";
  for (let i = 0; i < 80; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  // top gold rule
  ctx.fillStyle = "#d8b36a";
  ctx.fillRect(60, 60, W - 120, 2);

  // eyebrow
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 22px 'Inter', sans-serif";
  ctx.textBaseline = "top";
  ctx.letterSpacing = "4px"; // may not apply in all browsers
  ctx.fillText("WELCHE OPER BIST DU?", 60, 80);

  // character name — huge serif italic
  ctx.fillStyle = c.accentInk;
  const nameSize = c.name.length > 10 ? 150 : 190;
  ctx.font = `italic 500 ${nameSize}px 'Fraunces', Georgia, serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(c.name, 60, 320);

  // work subtitle
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "italic 400 32px 'Fraunces', Georgia, serif";
  ctx.fillText(c.work, 60, 370);

  // poetic share line
  ctx.fillStyle = c.accentInk;
  ctx.font = "italic 400 42px 'Fraunces', Georgia, serif";
  wrapText(ctx, `„${c.share}“`, 60, 450, W - 120, 52);

  // bottom rule + footer
  ctx.fillStyle = "rgba(216, 179, 106, 0.7)";
  ctx.fillRect(60, H - 80, W - 120, 1);

  // brand footer
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 22px 'Inter', sans-serif";
  ctx.fillText("bei Barbara Sailer · barbarasailer.de", 60, H - 55);

  // character count
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "italic 400 22px 'Fraunces', Georgia, serif";
  ctx.fillText(`Figur ${Object.keys(CHARACTERS).indexOf(c.id) + 1} / 7`, W - 60, H - 55);
  ctx.textAlign = "left";

  // export
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oper-${c.id}-welcheoperbin-ich.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

// --------------------------------------------------------------
// UTIL
// --------------------------------------------------------------

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mixRgb(hex1, hex2, t) {
  const c1 = hex2rgb(hex1);
  const c2 = hex2rgb(hex2);
  const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
  const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
  const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
  return `rgb(${r}, ${g}, ${b})`;
}
function hex2rgb(hex) {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
