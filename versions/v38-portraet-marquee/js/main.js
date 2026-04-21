/* ============================================================
   v38 — Porträt-Marquee
   Renders testimonial cards into 3 marquee rows.
   Avatars are inline SVG gradients generated from initials.
   Click opens a <dialog> with the full quote + CTA.
   ============================================================ */

const testimonials = [
  { initials: "LM", name: "Lena M.",     fach: "Pop",      jahr: 2024,
    short: "Ich traute mich zum ersten Mal zu singen.",
    long:  "Ich wollte eigentlich nur einen Geburtstagssong für meinen Freund lernen. Drei Stunden später merkte ich, dass ich seit Jahren die Luft anhalte. Barbara hat mir beigebracht, dass Singen Atmen mit Absicht ist." },

  { initials: "TK", name: "Tom K.",      fach: "Musical",  jahr: 2023,
    short: "Mein Vorsingen klappte.",
    long:  "Ich war kurz vor der Aufnahmeprüfung und total blockiert. Barbara hat nicht an meiner Technik geschraubt — sie hat mir erklärt, wo meine Angst wohnt und wie ich sie atmen lasse. Ich bin jetzt im zweiten Semester." },

  { initials: "AS", name: "Annika S.",   fach: "Klassik",  jahr: 2022,
    short: "Sie hört, was ich noch nicht weiß.",
    long:  "Annika singt seit 15 Jahren in Chören, ohne je Einzelunterricht gehabt zu haben. „Barbara hat in der ersten Stunde gehört, dass ich rechts anders atme als links. Seit ich das weiß, klingt mein oberes Register ganz anders.“" },

  { initials: "JV", name: "Julian V.",   fach: "Chanson",  jahr: 2024,
    short: "Ich hab meine Stimme wiedergefunden.",
    long:  "Nach zwei Jahren Long-Covid konnte ich nicht mal mehr drei Sätze am Stück sprechen. Barbara kennt sich mit kranken Stimmen aus. Wir haben mit Summen begonnen. Heute singe ich wieder Brel — und atme wie ein Mensch." },

  { initials: "RB", name: "Renate B.",   fach: "Chor",     jahr: 2021,
    short: "Mit 68 habe ich angefangen.",
    long:  "Meine Enkelin meinte, ich hätte eine schöne Stimme. Ich dachte, dafür bin ich viel zu alt. Barbara sagte: „Deine Stimme ist nicht alt, sie hat nur zugehört.“ Jetzt singe ich im Kirchenchor und habe drei neue Freundinnen." },

  { initials: "MF", name: "Mira F.",     fach: "Jazz",     jahr: 2023,
    short: "Endlich klingt mein Scat wie meiner.",
    long:  "Ich wollte nie klingen wie Ella. Ich wollte klingen wie ich. Barbara hat geduldig zugehört, wie sich meine eigene Phrasierung anfühlt, und mir geholfen, sie nicht wegzutrainieren." },

  { initials: "DN", name: "David N.",    fach: "Pop",      jahr: 2024,
    short: "Ich hab meine Hochzeit gesungen.",
    long:  "Ich wollte meiner Frau ein Lied schenken. Fünf Monate Vorbereitung, eine Panikattacke im April, und dann: 120 Leute, kein Stolpern, zwei Tränen. Ohne Barbara wäre ich am Altar stumm gewesen." },

  { initials: "ES", name: "Elena S.",    fach: "Klassik",  jahr: 2022,
    short: "Meine Höhe war ein Versteckspiel.",
    long:  "Ich hatte immer Angst vor dem G. Barbara hat mir gezeigt, dass ich dort nicht höher singen muss, sondern offener. Seitdem ist das G einfach ein Ton — kein Prüfstein." },

  { initials: "PH", name: "Pia H.",      fach: "Musical",  jahr: 2025,
    short: "Ich lache beim Üben. Ernsthaft.",
    long:  "Ich hatte vorher Unterricht, bei dem ich jede Stunde mit Bauchschmerzen ankam. Bei Barbara lache ich. Wir probieren Quatsch aus, und daraus wird Technik. Ich hätte nicht gedacht, dass man so lernen darf." },

  { initials: "OK", name: "Olaf K.",     fach: "Rede",     jahr: 2023,
    short: "Ich halte Vorträge, ohne heiser zu werden.",
    long:  "Als Dozent rede ich 15 Stunden die Woche. Mein HNO-Arzt hat mich zu Barbara geschickt. Sie hat nicht an meiner Stimme herumgedoktert, sondern an der Art, wie ich stehe. Ich bin seit einem Jahr beschwerdefrei." },

  { initials: "CK", name: "Clara K.",    fach: "Klassik",  jahr: 2021,
    short: "Mein Rezital war kein Drama.",
    long:  "Ich bin so einer, der ohne Bühnenangst nicht singt. Barbara hat mir beigebracht, dass Adrenalin ein Freund sein kann. Mein erster Liederabend — ich habe ihn genossen. Das ist neu." },

  { initials: "VN", name: "Vincent N.",  fach: "Pop",      jahr: 2024,
    short: "Kopfstimme? Keine Angst mehr.",
    long:  "Ich dachte immer, Kopfstimme ist für Frauen. Barbara hat mir geduldig erklärt, dass sie für alle da ist, und dass meine männliche Mix-Stimme im Pop der Zukunft ist. Ich übe jetzt Sam Smith." },

  { initials: "HL", name: "Hanna L.",    fach: "Chor",     jahr: 2022,
    short: "Ich sehe meine Noten jetzt.",
    long:  "Ich habe drei Jahre im Chor gesungen, ohne Noten lesen zu können — immer nebenher. Barbara hat mir in zwei Monaten das Blattsingen beigebracht. Jetzt bin ich nicht mehr Passagier, ich bin Stimme." },

  { initials: "SB", name: "Sophie B.",   fach: "Chanson",  jahr: 2023,
    short: "Meine Stimme darf auch zart sein.",
    long:  "Ich hab mich früher nur getraut, laut zu singen — aus Angst, sonst nicht ernst genommen zu werden. Barbara hat mir gezeigt, dass Zartheit technisch anspruchsvoller ist als Kraft. Seit dem ist mein Piano mein Lieblingsterritorium." },

  { initials: "MR", name: "Markus R.",   fach: "Musical",  jahr: 2024,
    short: "Ich wurde für Les Misérables genommen.",
    long:  "Nach drei Absagen war ich kurz davor aufzugeben. Barbara hat mich nicht auf Belting gedrillt — sie hat mich gelehrt, den Text wirklich zu meinen. Valjean singe ich seit November, mit Tränen in den Augen." },

  { initials: "KW", name: "Katja W.",    fach: "Klassik",  jahr: 2021,
    short: "Mein Atem kommt jetzt von selbst.",
    long:  "Ich habe 20 Jahre lang versucht, Atem zu „machen“. Barbara hat einen Satz gesagt, den ich nie vergesse: „Du musst ihn nicht nehmen. Er ist schon da.“ Seit dem übe ich entspannter als je zuvor." },

  { initials: "LN", name: "Luca N.",     fach: "Pop",      jahr: 2025,
    short: "Mein eigener Song ist draußen.",
    long:  "Ich wollte immer eigene Songs aufnehmen, konnte mich aber beim Singen nie hören. Barbara hat mit mir Aufnahme-Sessions geübt — im kleinen Raum, mit Kopfhörer. Meine erste Single ist seit März online. Surreal." },

  { initials: "IB", name: "Irene B.",    fach: "Chor",     jahr: 2022,
    short: "Ich leite jetzt selbst eine kleine Gruppe.",
    long:  "Ich bin ursprünglich zu Barbara gekommen, um selbst besser zu singen. Sie hat bemerkt, wie ich während des Aufwärmens zuhöre, und mich ermutigt, einen Seniorinnen-Chor in meinem Viertel zu gründen. Wir treffen uns jeden Mittwoch." },

  { initials: "AT", name: "Anton T.",    fach: "Klassik",  jahr: 2023,
    short: "Mein Bariton hat einen Namen bekommen.",
    long:  "Ich wusste lange nicht, ob ich Bass oder Bariton bin — jede Lehrerin sagte was anderes. Barbara hat mir in einer Stunde mit Tonbeispielen und körperlichen Referenzen gezeigt, wo mein Zentrum liegt. Ich bin Bariton. Und ich weiß warum." },

  { initials: "NM", name: "Nora M.",     fach: "Jazz",     jahr: 2024,
    short: "Ich improvisiere, ohne zu erstarren.",
    long:  "Improvisation war für mich jahrelang eine Angstzone. Barbara hat mit mir mit drei Tönen angefangen, dann fünf, dann einer ganzen Skala. Sie lässt Zeit. Heute singe ich auf Jam-Sessions — nervös, aber da." },

  { initials: "FE", name: "Felicia E.",  fach: "Musical",  jahr: 2025,
    short: "Ich kann jetzt mixen.",
    long:  "Der „Mix“ war für mich ein Mysterium. Barbara hat es mit Metaphern erklärt — Wasser und Farbe, Licht und Glas — und mit sehr konkreten Übungen. Nach drei Monaten hatte ich meinen eigenen Mix. Er klingt wie ich." },
];

/* ---------- Avatar: deterministic gradient from initials ---------- */
function hashInitials(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function avatarColors(initials) {
  const h = hashInitials(initials);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 60)) % 360;
  // Soft but saturated — pastel-ish
  return {
    c1: `hsl(${hue1}, 70%, 62%)`,
    c2: `hsl(${hue2}, 65%, 48%)`,
  };
}

function avatarSVG(initials, size = 48) {
  const { c1, c2 } = avatarColors(initials);
  const gradId = `g${hashInitials(initials)}-${size}`;
  return `
    <svg class="avatar" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#${gradId})"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
            fill="white" font-family="Inter, system-ui, sans-serif" font-weight="600"
            font-size="${size * 0.38}" letter-spacing="0.5">${initials}</text>
    </svg>
  `;
}

/* ---------- Card markup ---------- */
function cardHTML(t) {
  return `
    <button class="testimonial-card" type="button" data-index="${t.__index}">
      <div class="card-top">
        ${avatarSVG(t.initials, 48)}
        <div class="card-meta">
          <span class="card-name">${t.name}</span>
          <span class="card-sub">${t.fach} · ${t.jahr}</span>
        </div>
      </div>
      <p class="card-quote">${t.short}</p>
    </button>
  `;
}

/* ---------- Render marquee rows ---------- */
function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderRows() {
  // Tag each testimonial with its index so we can look it up on click
  testimonials.forEach((t, i) => (t.__index = i));

  const rows = [
    { el: document.querySelector('.marquee[data-row="1"] .marquee-track'), seed: 17 },
    { el: document.querySelector('.marquee[data-row="2"] .marquee-track'), seed: 43 },
    { el: document.querySelector('.marquee[data-row="3"] .marquee-track'), seed: 71 },
  ];

  rows.forEach(({ el, seed }) => {
    if (!el) return;
    const order = shuffle(testimonials, seed);
    const set = order.map(cardHTML).join("");
    // Duplicate content for seamless infinite scroll (50% translate jump)
    el.innerHTML = set + set;
  });
}

/* ---------- Dialog ---------- */
const dialog = document.getElementById("portrait-dialog");
const dAvatar = document.getElementById("dialog-avatar");
const dMeta   = document.getElementById("dialog-meta");
const dName   = document.getElementById("dialog-name");
const dQuote  = document.getElementById("dialog-quote");

function openDialog(t) {
  dAvatar.innerHTML = avatarSVG(t.initials, 92);
  // Replace class on the inner svg so shadow is visible
  const svg = dAvatar.querySelector("svg");
  if (svg) {
    svg.removeAttribute("class");
    svg.setAttribute("width", "92");
    svg.setAttribute("height", "92");
    svg.style.borderRadius = "50%";
  }
  dMeta.textContent = `${t.fach} · ${t.jahr}`;
  dName.textContent = t.name;
  dQuote.textContent = t.long;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function wireDialog() {
  // Card click → open
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".testimonial-card");
    if (card) {
      const idx = Number(card.dataset.index);
      if (!Number.isNaN(idx) && testimonials[idx]) {
        openDialog(testimonials[idx]);
      }
      return;
    }

    // Dialog CTA → close then scroll to contact
    const cta = e.target.closest("[data-close]");
    if (cta && dialog.open) {
      dialog.close();
    }
  });

  // Close on backdrop click
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  // ESC is handled natively by <dialog>
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderRows();
  wireDialog();
});
