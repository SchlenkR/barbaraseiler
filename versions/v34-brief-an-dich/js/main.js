/* ============================================================
   v34 — Brief an dich
   Form -> paper -> typewriter. Vanilla ES module.
   ============================================================ */

// ---------- utilities ----------

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d) {
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function isValidEmail(v) {
  if (!v) return true; // empty is ok (optional field)
  // simple, forgiving
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// ---------- letter templates ----------

const THEMA_PARAGRAPHS = {
  hoehe: {
    privat: [
      "Dass du bis hierher gelesen hast und dir die Zeit nimmst, vier kleine Fragen zu beantworten, weiß ich zu schätzen. Die meisten klicken schneller weg, als sie denken.",
      "Die Höhe ist fast nie ein Muskelproblem. Sie ist ein Vertrauensproblem. Wenn oben alles eng wird, drückt der Körper meist gegen einen Ton, den er schon vorher entschieden hat, nicht zu geben. Die erste Stunde, die wir zusammen hätten, wäre keine Übung in \"höher singen\". Sie wäre ein leises Herauss finden, wo genau der Körper stoppt — und warum. Sehr oft kommen die Töne dann ganz von selbst.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    buehne: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen — gerade wenn du auftrittst. Denn dann ist jeder Text, den du nicht weiterliest, auch ein Zweifel, den du wegschiebst.",
      "Bei Leuten, die auftreten, ist die fehlende Höhe oft kein technisches Loch, sondern eine alte Gewohnheit, die sich in den Körper geschrieben hat. Ich arbeite dann weniger an Tönen und mehr daran, wo oben überhaupt Platz ist: Kiefer, Zungenwurzel, Haltung, Atem. Meist sind nach zwei, drei Stunden Töne wieder da, die jemand vor Jahren für verloren erklärt hat.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    beruf: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Wer beruflich täglich mit der Stimme arbeitet, kennt meistens alle eigenen Knackpunkte und hört sie täglich — das ist anstrengender, als viele denken.",
      "Wenn die Höhe wegbricht, ist das häufig die Stimme, die um Luft und um Balance bittet. Wir schauen uns in der ersten Stunde an, wo der Körper sich im Sprechen schon verspannt, bevor du überhaupt singst. Denn die Höhe ist, besonders bei Menschen, die viel reden, oft das erste Symptom, nicht die Ursache.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
  },
  atem: {
    privat: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Atem ist so eine leise Baustelle — niemand sieht sie, und doch merkst du sie in jedem Satz.",
      "Atem reicht nie, wenn der Kiefer, die Schultern oder der Bauch dem Körper die Luft abschneiden, bevor die Stimme überhaupt beginnt. In der ersten Stunde würden wir nicht pressen und nicht üben, tief einzuatmen. Wir würden schauen, wo dein Körper das Ausatmen bremst. Das ist fast immer die eigentliche Frage. Und sie lässt sich verändern.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    buehne: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Auf der Bühne wird die Frage nach dem Atem härter: Er ist das Einzige, was dich trägt, wenn alles andere wackelt.",
      "Wenn dir auf Seiten des Auftritts die Luft ausgeht, ist meistens nicht zu wenig Atem da, sondern zu viel Halt-Apparatur. Körper, die sich im Moment zu sehr kontrollieren, atmen flach. Wir würden in der ersten Stunde deinen Stand, deine Einatmung und deine Phrasierung getrennt voneinander anschauen. Du merkst in 45 Minuten, ob da etwas ins Offene geht.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    beruf: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Wer beruflich redet und singt, merkt beim Atem als Erstes, wenn etwas kippt — und das passiert oft schon am Vormittag.",
      "Ich arbeite mit vielen Lehrerinnen, Geistlichen und Coaches zu genau diesem Thema. Der Atem hält nicht, weil der Körper seit Jahren längere Strecken mit hoher Anspannung bewältigt. Wir gehen in der ersten Stunde an die kleinen Dinge: Sitz, Stand, Übergang von Einatmung zu Ton. Keine Übung, die du mitnehmen musst — eine Erfahrung, die der Körper behält.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
  },
  anfang: {
    privat: [
      "Dass du bis hierher gelesen hast und dir vornimmst, wieder anzufangen, weiß ich zu schätzen. Der Anfang ist oft die ganze Arbeit, nicht nur der erste Schritt.",
      "Wenn etwas in dir seit Jahren still ist und wieder reden möchte, gibt es in einer ersten Stunde fast nichts zu tun. Wir hören hin, was jetzt, heute, nach all der Zeit da ist. Keine alte Reichweite wiederherstellen. Keine Skala singen, die du von früher kennst. Wir fangen da an, wo du bist. Das klingt größer als es ist — in Wahrheit ist es sehr leicht.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    buehne: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Wieder anfangen ist für Menschen, die schon einmal auf der Bühne waren, oft schwerer als beim ersten Mal — es gibt einen Vergleich im Kopf, der nicht fair ist.",
      "Eine Rückkehr geht nicht über die Technik, die du damals hattest. Sie geht über das, was jetzt da ist. In der ersten Stunde würden wir nicht gleich ein Stück auspacken. Wir hören, welche Töne, welcher Atem und welche Haltung heute frei sind. Darauf lässt sich danach alles aufbauen — Schritt für Schritt, ohne Eile.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    beruf: [
      "Dass du bis hierher gelesen hast, weiß ich zu schätzen. Wer redet und singt, weiß, wie viel der Körper seit Jahren schon tut — und wie wenig davon gewürdigt wird.",
      "Einen neuen Anfang gibt es auch nach dreiig Jahren Beruf. Meistens ist er leiser und ehrlicher als der erste. Wir würden schauen, was deine Stimme aushalten muss, und was du ihr gerne zurückgeben würdest. Keine Technik vor dem Gefühl. Kein Ziel in der ersten Stunde außer dem: hören, was ist.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
  },
  freitext: {
    privat: [
      "Dass du bis hierher gelesen hast und mir in eigenen Worten geschrieben hast, was los ist, weiß ich zu schätzen. Die meisten Menschen wählen das einfachere Formular.",
      "Was du beschreibst, nehme ich ernst — auch, wenn ich nicht sofort eine Antwort darauf habe. Eine erste Stunde bei mir ist genau dafür da: zuzuhören, was im Raum ist, bevor ich irgendetwas vorschlage. Wir würden reden, ein paar Töne probieren, spüren, wo dein Körper hinwill. Kein Konzept, keine Methode, die ich dir überstülpe.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    buehne: [
      "Dass du dir die Zeit genommen hast, mir in eigenen Worten zu schreiben, weiß ich zu schätzen. Auftritt und Vorbereitung leben von solchen Momenten der Präzision.",
      "Das, was du schilderst, muss ich live hören, bevor ich dir ehrlich raten kann. Darum ist die erste Stunde keine Diagnose, sondern eine Begegnung. Wir würden reden, ein paar Phrasen probieren und schauen, wo dein Körper im Moment Platz hat. Wenn ein Termin oder eine Rolle im Raum ist, nehmen wir das mit — wenn nicht, auch gut.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
    beruf: [
      "Dass du bis hierher gelesen und mir geschrieben hast, weiß ich zu schätzen — gerade mit einem Beruf, der die Stimme täglich fordert.",
      "Ich nehme, was du beschrieben hast, als Ausgangspunkt, nicht als Problem. In einer ersten Stunde geht es weniger um die Lösung als darum, dass wir beide hören, was gerade da ist. Ich arbeite viel mit Menschen, die beruflich mit der Stimme leben, und die ersten 45 Minuten sind meistens Entlastung, nicht zusätzliche Arbeit.",
      "Wenn du magst, komm vorbei. 45 Minuten, 40 €. Nichts, was du vorbereiten müsstest."
    ],
  }
};

function pickParagraphs({ thema, kontext, themaFrei }) {
  // If freetext is non-empty, prefer the "freitext" group
  const bucket = (themaFrei && themaFrei.trim().length > 0) ? "freitext" : thema;
  const ctx = kontext && THEMA_PARAGRAPHS[bucket] && THEMA_PARAGRAPHS[bucket][kontext]
    ? kontext : "privat";
  const group = THEMA_PARAGRAPHS[bucket] || THEMA_PARAGRAPHS.hoehe;
  return group[ctx] || group.privat;
}

// ---------- typewriter ----------

let tw_abort = false;
function stopTypewriter() { tw_abort = true; }

function runTypewriter(target, paragraphs, onDone) {
  target.innerHTML = "";
  tw_abort = false;

  // Flatten: build [{text, breakAfter}] tokens per paragraph
  // One <p> per paragraph; we fill text char-by-char.
  const paraEls = paragraphs.map(() => {
    const p = document.createElement("p");
    target.appendChild(p);
    return p;
  });
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  target.appendChild(cursor);

  const baseDelay = 22; // ms per char
  const punctDelay = 220; // extra after . ! ?
  const commaDelay = 90;  // extra after , ; :

  let pIdx = 0;
  let cIdx = 0;
  let lastTime = 0;
  let accum = 0;

  function pendingDelayFor(ch) {
    if (ch === "." || ch === "!" || ch === "?") return baseDelay + punctDelay;
    if (ch === "," || ch === ";" || ch === ":") return baseDelay + commaDelay;
    if (ch === " ") return baseDelay + 6;
    return baseDelay + (Math.random() * 14 - 4); // tiny jitter
  }

  function tick(now) {
    if (tw_abort) return;
    if (!lastTime) lastTime = now;
    const delta = now - lastTime;
    lastTime = now;
    accum += delta;

    // Insert chars while time budget is used up
    while (accum >= 0 && pIdx < paragraphs.length) {
      const text = paragraphs[pIdx];
      if (cIdx >= text.length) {
        pIdx += 1;
        cIdx = 0;
        // short pause between paragraphs
        accum -= 280;
        continue;
      }
      const ch = text[cIdx];
      paraEls[pIdx].appendChild(document.createTextNode(ch));
      // move cursor to the end
      target.appendChild(cursor);
      cIdx += 1;
      accum -= pendingDelayFor(ch);
    }

    if (pIdx < paragraphs.length) {
      requestAnimationFrame(tick);
    } else {
      cursor.remove();
      if (typeof onDone === "function") onDone();
    }
  }

  requestAnimationFrame(tick);
}

function renderInstant(target, paragraphs) {
  target.innerHTML = "";
  for (const p of paragraphs) {
    const el = document.createElement("p");
    el.textContent = p;
    target.appendChild(el);
  }
}

// ---------- form validation ----------

function validateForm(formEl) {
  const errors = {};
  const name = $("#f-name", formEl).value.trim();
  const thema = formEl.querySelector('input[name="thema"]:checked');
  const kontext = formEl.querySelector('input[name="kontext"]:checked');
  const email = $("#f-email", formEl).value.trim();

  if (!name) errors.name = "Bitte trag deinen Namen ein.";
  if (!thema) errors.thema = "Bitte wähl eine der drei Optionen (oder schreib es selbst).";
  if (!kontext) errors.kontext = "Bitte wähl einen Kontext.";
  if (email && !isValidEmail(email)) errors.email = "Das sieht noch nicht nach einer E-Mail-Adresse aus.";

  return errors;
}

function applyErrors(formEl, errors) {
  const fields = $$(".field", formEl);
  for (const f of fields) {
    const key = f.dataset.field;
    f.classList.remove("has-error");
    const err = $(".field-error", f);
    if (err) err.textContent = "";
    if (errors[key]) {
      f.classList.add("has-error");
      if (err) err.textContent = errors[key];
    }
  }
}

// ---------- scenes ----------

function showLetterScene({ name, thema, themaFrei, kontext, email }) {
  const formScene = $("#form-scene");
  const letterScene = $("#letter-scene");

  // Fill the date
  $("#paper-date").textContent = formatDate(new Date());
  // Fill name in greeting
  $("#paper-name").textContent = name || "Mensch";
  // Update greeting aria visibility
  $("#letter-title").setAttribute("aria-hidden", "false");

  const paragraphs = pickParagraphs({ thema, kontext, themaFrei });

  // Setup WhatsApp link
  const waText = `Hi Barbara, ich hab den Brief gelesen. Mein Name ist ${name}. Ich würde gerne eine Probestunde vereinbaren.`;
  $("#wa-link").href = `https://wa.me/495551234567?text=${encodeURIComponent(waText)}`;

  // transition
  const reduced = prefersReduced();
  if (reduced) {
    formScene.hidden = true;
    letterScene.hidden = false;
    renderInstant($("#paper-body"), paragraphs);
    $("#paper-ps").hidden = false;
    $("#paper-actions").hidden = false;
    letterScene.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  formScene.classList.add("is-leaving");
  setTimeout(() => {
    formScene.hidden = true;
    letterScene.hidden = false;
    letterScene.classList.add("is-entering");
    letterScene.scrollIntoView({ behavior: "smooth", block: "start" });

    // Start typewriter after fold-in completes
    setTimeout(() => {
      runTypewriter($("#paper-body"), paragraphs, () => {
        $("#paper-ps").hidden = false;
        $("#paper-actions").hidden = false;
      });
    }, 700);
  }, 700);
}

function resetToForm() {
  stopTypewriter();
  const formScene = $("#form-scene");
  const letterScene = $("#letter-scene");
  letterScene.hidden = true;
  letterScene.classList.remove("is-entering");
  formScene.hidden = false;
  formScene.classList.remove("is-leaving");
  $("#paper-body").innerHTML = "";
  $("#paper-ps").hidden = true;
  $("#paper-actions").hidden = true;
  formScene.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- wiring ----------

function onFormSubmit(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  const errors = validateForm(form);
  applyErrors(form, errors);
  if (Object.keys(errors).length > 0) {
    // focus first invalid
    const firstError = $(".field.has-error input, .field.has-error textarea", form);
    if (firstError) firstError.focus();
    return;
  }

  const data = {
    name: $("#f-name", form).value.trim(),
    thema: (form.querySelector('input[name="thema"]:checked') || {}).value,
    themaFrei: $("#f-thema-frei", form).value.trim(),
    kontext: (form.querySelector('input[name="kontext"]:checked') || {}).value,
    email: $("#f-email", form).value.trim(),
  };
  showLetterScene(data);
}

function initPhoneReveal() {
  const btn = $("#phone-btn");
  const num = $("#phone-number");
  if (!btn || !num) return;
  btn.addEventListener("click", () => {
    const willShow = num.hidden;
    num.hidden = !willShow;
    btn.setAttribute("aria-expanded", String(willShow));
    if (willShow) btn.textContent = "Nummer ausblenden";
    else btn.textContent = "Telefonnummer zeigen";
  });
}

function initScrollNav() {
  // enhance inline anchor clicks for smoother jumping respecting sticky nav
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (ev) => {
      const id = a.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    });
  });
}

function init() {
  const form = $("#letter-form");
  if (form) form.addEventListener("submit", onFormSubmit);

  const printBtn = $("#print-btn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());

  const backBtn = $("#back-btn");
  if (backBtn) backBtn.addEventListener("click", resetToForm);

  // Clear radio-group errors once the user picks anything
  $$('input[name="thema"]').forEach((r) =>
    r.addEventListener("change", () => {
      const f = r.closest(".field");
      f.classList.remove("has-error");
      const err = $(".field-error", f);
      if (err) err.textContent = "";
    })
  );
  $$('input[name="kontext"]').forEach((r) =>
    r.addEventListener("change", () => {
      const f = r.closest(".field");
      f.classList.remove("has-error");
      const err = $(".field-error", f);
      if (err) err.textContent = "";
    })
  );

  initPhoneReveal();
  initScrollNav();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
