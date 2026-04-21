// v26-gespraech — deterministic scripted-LLM-feel advisor.
// Five questions, keyword intent matching, typewriter, thinking dots,
// pathway recommendation at the end.

const chat = document.getElementById('chat');
const nudge = document.getElementById('ende');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Knowledge base ----------
// Five pathways (aligned with v6 taxonomy)
const PATHWAYS = {
  anfaenger: {
    title: 'Du willst endlich anfangen.',
    narrative: [
      'Kein Vorwissen, kein Notenblatt — nur der Wunsch, mal zu hören, was da eigentlich rauskommt, wenn du singst.',
      'Wir starten ganz ruhig: Atem, ein Ton, ein Lied, das du magst. Du gehst mit einer Idee davon raus, wie deine Stimme klingt, wenn sie nicht gegen dich arbeitet.'
    ],
    subject: 'Probestunde — Anfang',
    waMsg: 'Hallo Barbara, ich möchte mit dem Singen anfangen und würde gern eine Probestunde ausprobieren.'
  },
  wieder: {
    title: 'Du kommst zurück.',
    narrative: [
      'Du hast früher gesungen — Chor, Studium, Küche, Bühne — und merkst: etwas fehlt, das tiefer sitzt als ein Hobby.',
      'Wir hören, was noch da ist (meistens mehr, als du denkst), holen die leisen Stellen zurück und finden Stücke, die zu deiner jetzigen Stimme passen.'
    ],
    subject: 'Probestunde — Wiedereinstieg',
    waMsg: 'Hallo Barbara, ich habe früher gesungen und möchte wieder einsteigen. Ich würde gern eine Probestunde ausprobieren.'
  },
  pruefung: {
    title: 'Du bereitest eine Aufnahmeprüfung vor.',
    narrative: [
      'Ein Termin, eine Liste mit Stücken, ein innerer Druck, der nicht hilft. Du weißt, was du kannst — du brauchst jemanden, der das Fach kennt und dich ruhig hält.',
      'Wir sichten dein Programm, schärfen Technik genau dort, wo die Prüfung hinhört, und üben das Vortragen bis in die ersten 30 Sekunden im Raum.'
    ],
    subject: 'Probestunde — Aufnahmeprüfung',
    waMsg: 'Hallo Barbara, ich bereite eine Aufnahmeprüfung vor und würde gern eine Probestunde ausmachen.'
  },
  beruf: {
    title: 'Du sprichst beruflich — und willst, dass die Stimme hält.',
    narrative: [
      'Du unterrichtest, predigst, moderierst, coachst. Abends ist die Stimme rau, in der zweiten Stunde dünner als in der ersten.',
      'Wir finden deinen Atem wieder, arbeiten an Resonanz und Haltung, damit du leiser sprechen kannst und trotzdem ankommst — und bis zum Abend trägst.'
    ],
    subject: 'Probestunde — Berufsstimme',
    waMsg: 'Hallo Barbara, ich arbeite viel mit meiner Stimme und würde gern eine Probestunde für Stimmtraining ausmachen.'
  },
  chor: {
    title: 'Du singst im Chor und willst freier werden.',
    narrative: [
      'Im Chor trägt dich die Masse. Solistisch wirst du unsicher — die Höhe kippt, die Luft reicht nicht.',
      'Wir klären deine Stimmlage, üben Höhe und Tiefe, ohne dass die Mitte leidet, und geben dir Sicherheit, damit du dir beim Singen zuhören kannst.'
    ],
    subject: 'Probestunde — Chor',
    waMsg: 'Hallo Barbara, ich singe im Chor und würde gern solistisch sicherer werden. Darf ich eine Probestunde buchen?'
  }
};

// Intent / keyword table for free-text answers
const INTENTS = {
  anfaenger: /\b(anfang|neu|noch nie|null|start|beginn|erstmal|zum ersten mal|von vorn)/i,
  wieder: /\b(wieder|zur(ü|ue)ck|fr(ü|ue)her|damals|eingerostet|pause|wiedereinstieg|neu anfangen)/i,
  pruefung: /\b(pr(ü|ue)fung|aufnahme|hochschule|studium|vorsingen|casting|audition|bewerbung)/i,
  beruf: /\b(beruf|arbeit|unterricht|lehr|predig|pfarr|coach|moderat|redner|vortrag|sprech|heiser|rau)/i,
  chor: /\b(chor|ensemble|gemeinsam|gruppe|kirchenchor)/i,
  solo: /\b(solo|allein|alleine|solist|mich selbst)/i,
  duet: /\b(duett|duet|zu zweit|partner)/i,
  wenig_zeit: /\b(wenig zeit|knapp|stress|unregelm|kein|selten|monat)/i,
  viel_zeit: /\b(w(ö|oe)chentlich|regelm|jede woche|oft|viel zeit|intensiv)/i,
  angst: /\b(angst|peinlich|schief|falsch|sch(ä|ae)m|unsicher|trau mich nicht|blocker|blockade)/i,
  atem: /\b(atem|luft|puste|kurzatmig)/i,
  hoch: /\b(hoch|h(ö|oe)he|hohe t(ö|oe)ne|kopfstimme)/i,
  tief: /\b(tief|tiefe|bruststimme)/i
};

function detectIntent(text) {
  for (const [key, re] of Object.entries(INTENTS)) {
    if (re.test(text)) return key;
  }
  return null;
}

// ---------- State machine ----------
const state = {
  step: 0,
  answers: {}
};

const STEPS = [
  // Step 0: welcome + Q1 (goal)
  {
    id: 'q_ziel',
    barbara: 'Schön, dass du da bist. Ich frag dich ganz kurz ein paar Dinge, damit ich dich einordnen kann. Wenn du magst, erzähl mir: was ist gerade dein Gedanke, wenn du ans Singen denkst?',
    choices: [
      { label: 'Ich will endlich mal anfangen.', value: 'anfaenger' },
      { label: 'Ich hab früher gesungen — und will zurück.', value: 'wieder' },
      { label: 'Ich bereite eine Aufnahmeprüfung vor.', value: 'pruefung' },
      { label: 'Ich brauch meine Stimme im Beruf.', value: 'beruf' },
      { label: 'Ich sing im Chor und will solistisch sicherer werden.', value: 'chor' }
    ],
    freetext: 'Oder schreib\'s kurz in eigenen Worten …',
    map: (val, text) => {
      if (val) return val;
      const intent = detectIntent(text);
      if (['anfaenger','wieder','pruefung','beruf','chor'].includes(intent)) return intent;
      return 'anfaenger'; // sensible default
    },
    store: 'ziel'
  },

  // Step 1: experience
  {
    id: 'q_erfahrung',
    barbara: (ans) => {
      const t = {
        anfaenger: 'Okay. Dann fangen wir ganz vorne an — das ist oft der schönste Anfang. Hast du trotzdem schonmal was gesungen, zuhause, im Auto, in der Kirche?',
        wieder: 'Schön. Da ist meistens mehr da, als du denkst. Wie lange liegt\'s denn ungefähr zurück?',
        pruefung: 'Gut. Dann lass uns kurz schauen, wo du stehst — wie viel Unterricht hattest du bisher?',
        beruf: 'Verstehe. Sprichst du gerade täglich viel, oder phasenweise?',
        chor: 'Alles klar. Wie lange singst du schon im Chor?'
      }[ans.ziel];
      return t || 'Erzähl mir kurz: wieviel Erfahrung bringst du mit?';
    },
    choices: (ans) => {
      if (ans.ziel === 'anfaenger') return [
        { label: 'Nur in der Dusche oder im Auto.', value: 'keine' },
        { label: 'Ein bisschen — Kindheit, Schule, Kirche.', value: 'wenig' },
        { label: 'Nichts, ernsthaft nichts.', value: 'null' }
      ];
      if (ans.ziel === 'wieder') return [
        { label: 'Ein paar Jahre.', value: 'mittel' },
        { label: 'Ziemlich lange — 10 Jahre plus.', value: 'lang' },
        { label: 'Eigentlich nie ganz weg.', value: 'kurz' }
      ];
      if (ans.ziel === 'pruefung') return [
        { label: 'Ein paar Jahre regelmäßigen Unterricht.', value: 'viel' },
        { label: 'Hier und da, nichts Kontinuierliches.', value: 'wenig' },
        { label: 'Ich bin quasi Quereinsteigerin.', value: 'null' }
      ];
      if (ans.ziel === 'beruf') return [
        { label: 'Täglich, stundenweise.', value: 'viel' },
        { label: 'Mehrmals pro Woche.', value: 'mittel' },
        { label: 'Unregelmäßig, aber wenn, dann intensiv.', value: 'phasen' }
      ];
      if (ans.ziel === 'chor') return [
        { label: 'Erst ein paar Monate.', value: 'kurz' },
        { label: 'Mehrere Jahre.', value: 'mittel' },
        { label: 'Ewig. Gehört zu meinem Leben.', value: 'lang' }
      ];
      return [{ label: 'Eher wenig.', value: 'wenig' }, { label: 'Einiges.', value: 'viel' }];
    },
    freetext: 'Oder sag\'s mit eigenen Worten …',
    map: (val, text) => val || (detectIntent(text) || 'wenig'),
    store: 'erfahrung'
  },

  // Step 2: worry
  {
    id: 'q_sorge',
    barbara: 'Danke. Und — gibt\'s was, das dich beim Gedanken ans Singen kurz zögern lässt? Sowas wie eine Sorge, die immer auftaucht?',
    choices: [
      { label: 'Dass ich falsch oder peinlich klinge.', value: 'angst' },
      { label: 'Dass mir die Luft ausgeht.', value: 'atem' },
      { label: 'Dass die hohen Töne nicht kommen.', value: 'hoch' },
      { label: 'Dass ich zu alt bin für sowas.', value: 'alt' },
      { label: 'Eigentlich nichts Konkretes.', value: 'nichts' }
    ],
    freetext: 'Schreib ruhig offen …',
    map: (val, text) => val || detectIntent(text) || 'nichts',
    store: 'sorge'
  },

  // Step 3: time budget
  {
    id: 'q_zeit',
    barbara: (ans) => {
      const echo = {
        angst: 'Das kenne ich. Das haben fast alle, die hier sitzen — und es wird leiser, sobald du in einem Raum singst, in dem dir niemand zuhört außer dem Klavier.',
        atem: 'Das ist erstaunlich oft ein Haltungsthema, kein Lungenproblem. Daran arbeiten wir oft in der ersten Stunde schon.',
        hoch: 'Höhe ist Technik, nicht Mut. Die meisten kippen, weil der Hals eng macht — nicht weil der Ton nicht da wäre.',
        alt: 'Du bist nicht zu alt. Wirklich nicht. Die Stimme reift mit, sie bricht nicht ab.',
        nichts: 'Schön. Dann haben wir schonmal freie Bahn.'
      }[ans.sorge] || 'Gut, dass du\'s sagst.';
      return echo + ' Wie viel Zeit könntest du dir regelmäßig nehmen?';
    },
    choices: [
      { label: 'Wöchentlich 45 Minuten — geht klar.', value: 'viel_zeit' },
      { label: 'Alle zwei Wochen wäre realistisch.', value: 'mittel_zeit' },
      { label: 'Eher unregelmäßig, je nach Leben.', value: 'wenig_zeit' },
      { label: 'Intensiv vor einem Termin.', value: 'intensiv' }
    ],
    freetext: 'Oder was realistisch für dich ist …',
    map: (val, text) => val || detectIntent(text) || 'mittel_zeit',
    store: 'zeit'
  },

  // Step 4: context
  {
    id: 'q_kontext',
    barbara: 'Letzte Frage. Wenn du singst — stellst du dir das dann eher alleine vor, im Chor, oder mit einer Person zusammen?',
    choices: [
      { label: 'Alleine. Nur meine Stimme.', value: 'solo' },
      { label: 'Im Chor, in einer Gruppe.', value: 'chor' },
      { label: 'Zu zweit — Duett, Begleitung.', value: 'duet' },
      { label: 'Weiß ich noch nicht.', value: 'offen' }
    ],
    freetext: 'Sag\'s in einem Satz …',
    map: (val, text) => val || detectIntent(text) || 'offen',
    store: 'kontext'
  }
];

// ---------- Rendering helpers ----------

function appendBubble(who, text, attr) {
  const el = document.createElement('div');
  el.className = who === 'b' ? 'bubble bubble-b' : 'bubble bubble-du';
  if (attr) {
    const a = document.createElement('span');
    a.className = 'bubble-attr';
    a.textContent = attr;
    el.appendChild(a);
  }
  const body = document.createElement('span');
  el.appendChild(body);
  chat.appendChild(el);
  scrollToBottom();
  return body;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    const y = chat.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 24;
    if (y > window.scrollY) window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typewrite(target, text) {
  if (prefersReduced) {
    target.textContent = text;
    return;
  }
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  target.appendChild(cursor);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    cursor.insertAdjacentText('beforebegin', ch);
    let delay = 22;
    if (ch === ',' || ch === ';') delay = 140;
    else if (ch === '.' || ch === '!' || ch === '?') delay = 220;
    else if (ch === '—' || ch === '–') delay = 120;
    else if (ch === ' ') delay = 18;
    await sleep(delay);
    if (i % 6 === 0) scrollToBottom();
  }
  cursor.remove();
}

async function thinking() {
  const el = document.createElement('div');
  el.className = 'thinking';
  el.setAttribute('aria-label', 'Barbara denkt nach');
  el.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(el);
  scrollToBottom();
  const wait = prefersReduced ? 120 : 700 + Math.random() * 500;
  await sleep(wait);
  el.remove();
}

async function barbaraSays(text) {
  await thinking();
  const body = appendBubble('b', '', 'Barbara');
  await typewrite(body, text);
  scrollToBottom();
}

function duSays(text) {
  const body = appendBubble('du', '', 'Du');
  body.textContent = text;
  scrollToBottom();
}

function removeControls() {
  chat.querySelectorAll('.choices, .freetext').forEach(n => n.remove());
}

function renderChoices(step) {
  removeControls();
  const wrap = document.createElement('div');
  wrap.className = 'choices';
  const choices = typeof step.choices === 'function' ? step.choices(state.answers) : step.choices;

  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice';
    btn.textContent = c.label;
    btn.addEventListener('click', () => handleAnswer(step, c.value, c.label));
    wrap.appendChild(btn);
  });

  const ft = document.createElement('form');
  ft.className = 'freetext';
  ft.innerHTML = `
    <input type="text" autocomplete="off" placeholder="${step.freetext || 'Oder schreib selbst …'}" aria-label="Eigene Antwort">
    <button type="submit">Senden</button>
  `;
  ft.addEventListener('submit', e => {
    e.preventDefault();
    const val = ft.querySelector('input').value.trim();
    if (!val) return;
    handleAnswer(step, null, val);
  });

  chat.appendChild(wrap);
  chat.appendChild(ft);
  scrollToBottom();
}

async function handleAnswer(step, value, label) {
  removeControls();
  duSays(label);
  const mapped = step.map(value, label);
  state.answers[step.store] = mapped;
  state.step += 1;
  await sleep(prefersReduced ? 0 : 250);
  await advance();
}

async function advance() {
  if (state.step >= STEPS.length) {
    await finish();
    return;
  }
  const step = STEPS[state.step];
  const text = typeof step.barbara === 'function' ? step.barbara(state.answers) : step.barbara;
  await barbaraSays(text);
  renderChoices(step);
}

// ---------- Pathway selection ----------
function selectPathway(a) {
  // The goal answer (ziel) is the primary driver.
  let key = a.ziel || 'anfaenger';

  // Adjust if context strongly disagrees.
  if (a.kontext === 'chor' && key === 'anfaenger') key = 'chor';
  if (a.ziel === 'wieder' && a.kontext === 'chor') key = 'chor';
  return key;
}

function frequencyLine(a) {
  const f = {
    viel_zeit: 'Wöchentlich klingt gut — in dem Rhythmus entwickelt sich die Stimme am schönsten.',
    mittel_zeit: 'Alle zwei Wochen reicht oft — dazwischen arbeitet die Stimme von allein weiter.',
    wenig_zeit: 'Das geht auch unregelmäßig. Keine Mindestlaufzeit, kein Vertrag.',
    intensiv: 'Vor einem Termin dichter, danach wieder lockerer — das lässt sich gut einrichten.'
  };
  return f[a.zeit] || 'Wir finden einen Rhythmus, der in dein Leben passt.';
}

async function finish() {
  const key = selectPathway(state.answers);
  const p = PATHWAYS[key];

  await barbaraSays('Okay — ich glaub, ich weiß, was zu dir passt. Lass mich das kurz zusammenfassen.');
  await sleep(prefersReduced ? 0 : 400);

  // Fill the nudge card
  nudge.hidden = false;
  nudge.innerHTML = `
    <p class="nudge-kicker">Dein Weg</p>
    <h2>${p.title}</h2>
    <div class="nudge-body">
      <p>${p.narrative[0]}</p>
      <p>${p.narrative[1]}</p>
      <p><em>${frequencyLine(state.answers)}</em></p>
    </div>
    <div class="nudge-meta">
      <span><strong>Probestunde</strong> 45 min · 40 €</span>
      <span><strong>Wo</strong> Musterstraße 1, Frankfurt-Niederrad</span>
      <span><strong>Ohne</strong> Vertrag, ohne Mindestlaufzeit</span>
    </div>
    <div class="cta-row">
      <a class="cta-primary" href="https://wa.me/495551234567?text=${encodeURIComponent(p.waMsg)}" target="_blank" rel="noopener">
        Probestunde buchen — per WhatsApp
      </a>
      <button type="button" class="cta-secondary" id="restart-btn">Nochmal von vorn</button>
    </div>

    <details class="alt-form">
      <summary>Lieber per Mail schreiben?</summary>
      <form action="https://formsubmit.co/barbarasailer@web.de" method="POST">
        <input type="hidden" name="_subject" value="${p.subject} (v26-gespraech)">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="true">
        <input type="hidden" name="weg" value="${p.title}">
        <input type="hidden" name="antworten" value="${escapeAttr(JSON.stringify(state.answers))}">
        <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
        <label>Dein Name
          <input type="text" name="name" required autocomplete="name">
        </label>
        <label>E-Mail
          <input type="email" name="email" required autocomplete="email">
        </label>
        <label>Kurz: worum geht's?
          <textarea name="nachricht" rows="3" placeholder="Ein, zwei Sätze reichen."></textarea>
        </label>
        <button type="submit">Nachricht schicken</button>
      </form>
    </details>
  `;

  document.getElementById('restart-btn').addEventListener('click', restart);

  // Scroll the card into view
  requestAnimationFrame(() => {
    nudge.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  });
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function restart() {
  state.step = 0;
  state.answers = {};
  chat.innerHTML = '';
  nudge.hidden = true;
  nudge.innerHTML = '';
  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  setTimeout(start, 300);
}

// ---------- Boot ----------
async function start() {
  await barbaraSays('Hallo. Ich bin Barbara — schön, dass du da bist.');
  await sleep(prefersReduced ? 0 : 400);
  await advance();
}

start();
