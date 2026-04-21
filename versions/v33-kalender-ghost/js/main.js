// v33-kalender-ghost · Rolling Social Proof
// Acht Wochen, anonymisierte Mikro-Eintraege, sanftes Auto-Rolling.

(() => {
  'use strict';

  // ----- Eintrags-Daten (>= 50 Momente, anonymisiert) ------------------------
  // Kategorien: break | routine | first | feedback | free
  // Slot: mo|di|mi|do|fr  +  time: morgen|mittag|abend
  // weekOffset: 0 = aktuelle Woche, 1 = vorige Woche, ... 7 = vor 7 Wochen, -1 = naechste Woche
  const entries = [
    // Woche 0 (aktuelle)
    { w: 0, d: 'mo', t: 'abend',  cat: 'break',    text: 'M. hat die Hoehe wieder weich bekommen.' },
    { w: 0, d: 'di', t: 'morgen', cat: 'routine',  text: 'Eine Lehrerin: zweite Woche Uebung stabil.' },
    { w: 0, d: 'di', t: 'abend',  cat: 'first',    text: 'Erste Probestunde: "war anders als ich dachte".' },
    { w: 0, d: 'mi', t: 'mittag', cat: 'feedback', text: 'Kurze Nachricht: "nach dem Konzert kaum heiser".' },
    { w: 0, d: 'do', t: 'abend',  cat: 'break',    text: 'S. traute sich zum ersten Mal mit Mikro.' },
    { w: 0, d: 'fr', t: 'morgen', cat: 'routine',  text: 'Kantor: Atem sitzt ueber die ganze Messe.' },
    { w: 0, d: 'fr', t: 'abend',  cat: 'free',     text: 'frei, 1 Probe-Slot' },

    // Woche -1 (kommende) --> als Ausblick
    { w: -1, d: 'mo', t: 'abend',  cat: 'free', text: 'frei, 1 Probe-Slot' },
    { w: -1, d: 'mi', t: 'morgen', cat: 'free', text: 'frei' },
    { w: -1, d: 'fr', t: 'abend',  cat: 'free', text: 'frei' },

    // Woche 1 (vor 1)
    { w: 1, d: 'mo', t: 'mittag', cat: 'routine',  text: 'A. hat gemerkt: Atem ist kein Trick, er ist Fundament.' },
    { w: 1, d: 'di', t: 'abend',  cat: 'break',    text: 'J. hat sich ein eigenes Lied gewaehlt.' },
    { w: 1, d: 'mi', t: 'abend',  cat: 'feedback', text: 'Chorgruppe - drei singen jetzt solo.' },
    { w: 1, d: 'do', t: 'morgen', cat: 'first',    text: 'Neue Anmeldung: Liturgie-Thema, spannend.' },
    { w: 1, d: 'fr', t: 'mittag', cat: 'routine',  text: 'Ein Schauspieler: Stimme haelt den ganzen Tag.' },
    { w: 1, d: 'fr', t: 'abend',  cat: 'break',    text: 'P. singt jetzt vor Publikum (Geburtstag Mutter).' },

    // Woche 2
    { w: 2, d: 'mo', t: 'abend',  cat: 'break',    text: 'K. ist durch die Schoenberg-Passage - endlich.' },
    { w: 2, d: 'di', t: 'morgen', cat: 'routine',  text: 'Morgenstimme: fuenf Minuten, aber taeglich.' },
    { w: 2, d: 'mi', t: 'mittag', cat: 'first',    text: 'Erste Stunde nach langer Pause - ohne Drama.' },
    { w: 2, d: 'do', t: 'abend',  cat: 'feedback', text: 'Eine Kollegin: "Probe neulich lief ruhig".' },
    { w: 2, d: 'fr', t: 'abend',  cat: 'break',    text: 'Wiedereinstieg nach Krankheit: Ton traegt.' },

    // Woche 3
    { w: 3, d: 'mo', t: 'mittag', cat: 'routine',  text: 'Ein Kantor hat ein Schuljahr ohne Heiserkeit geschafft.' },
    { w: 3, d: 'di', t: 'abend',  cat: 'first',    text: 'Probestunde: "ich wusste nicht, dass ich Sopran bin".' },
    { w: 3, d: 'mi', t: 'abend',  cat: 'break',    text: 'L. findet endlich das Piano ohne Gehauch.' },
    { w: 3, d: 'do', t: 'morgen', cat: 'feedback', text: 'Nachricht: "Aufnahme war brauchbar, erstes Mal".' },
    { w: 3, d: 'fr', t: 'abend',  cat: 'routine',  text: 'Drei Wochen in Folge geuebt - kleine Wunderkette.' },

    // Woche 4
    { w: 4, d: 'mo', t: 'abend',  cat: 'break',    text: 'B. hat die Scham beim Einsingen verloren.' },
    { w: 4, d: 'di', t: 'mittag', cat: 'first',    text: 'Erste Probestunde einer Lehrerin, Stimme schon muede.' },
    { w: 4, d: 'mi', t: 'morgen', cat: 'routine',  text: 'R. macht drei Uebungen am Morgen, eine am Abend.' },
    { w: 4, d: 'do', t: 'abend',  cat: 'feedback', text: 'Nach Chorprobe: "keiner hat sich raeuspern muessen".' },
    { w: 4, d: 'fr', t: 'abend',  cat: 'break',    text: 'T. singt Mezzo-Partie, die lange unerreichbar schien.' },

    // Woche 5
    { w: 5, d: 'mo', t: 'mittag', cat: 'routine',  text: 'Eine Schauspielerin: Stuetze jetzt bewusst auf Buehne.' },
    { w: 5, d: 'di', t: 'abend',  cat: 'first',    text: 'Erste Probestunde: Abi-Vorbereitung, ruhiger Einstieg.' },
    { w: 5, d: 'mi', t: 'abend',  cat: 'break',    text: 'H. hat die Registerbrueche verschwinden lassen.' },
    { w: 5, d: 'do', t: 'morgen', cat: 'feedback', text: 'Kurz per WhatsApp: "Erkaeltung, Stimme kam schneller zurueck".' },
    { w: 5, d: 'fr', t: 'abend',  cat: 'routine',  text: 'Kleiner Chor: alle fuenf kommen vorbereitet.' },

    // Woche 6
    { w: 6, d: 'mo', t: 'abend',  cat: 'break',    text: 'E. hoert sich zum ersten Mal selbst auf Aufnahme - und laechelt.' },
    { w: 6, d: 'di', t: 'mittag', cat: 'first',    text: 'Probestunde: Wiedereinstieg nach 15 Jahren.' },
    { w: 6, d: 'mi', t: 'morgen', cat: 'routine',  text: 'N. uebt auf dem Weg zur Arbeit - im Auto, aber konsequent.' },
    { w: 6, d: 'do', t: 'abend',  cat: 'feedback', text: 'Rueckmeldung: "Referat gehalten, Stimme blieb ruhig".' },
    { w: 6, d: 'fr', t: 'abend',  cat: 'break',    text: 'F. hat die erste Arie ganz durchgesungen, ohne Notstopp.' },

    // Woche 7
    { w: 7, d: 'mo', t: 'mittag', cat: 'routine',  text: 'U. hat Uebung und Job getrennt - Stimme atmet wieder.' },
    { w: 7, d: 'di', t: 'abend',  cat: 'first',    text: 'Erste Probestunde: "ich wollte nur mal hoeren".' },
    { w: 7, d: 'mi', t: 'abend',  cat: 'break',    text: 'G. hat den Umbruch zum Kopfregister geschafft.' },
    { w: 7, d: 'do', t: 'morgen', cat: 'feedback', text: 'Nachricht: "Predigt heute - niemand hat mich gefragt, ob ich muede bin".' },
    { w: 7, d: 'fr', t: 'abend',  cat: 'routine',  text: 'Zwei Monate durchgehalten - die leise Art Stolz.' },

    // Zusatzeintraege (mehr Leben im Kalender)
    { w: 1, d: 'mo', t: 'morgen', cat: 'routine',  text: 'Einsingen unterwegs, drei Minuten.' },
    { w: 2, d: 'mi', t: 'abend',  cat: 'feedback', text: 'SMS nach Auftritt: "hat gehalten".' },
    { w: 4, d: 'mo', t: 'morgen', cat: 'first',    text: 'Erste Probestunde: klassisch, leicht skeptisch.' },
    { w: 5, d: 'do', t: 'abend',  cat: 'break',    text: 'O. traut sich an Schubert heran.' },
    { w: 6, d: 'fr', t: 'morgen', cat: 'routine',  text: 'Eine Mutter: 10 Minuten, waehrend das Kind schlaeft.' },
    { w: 3, d: 'di', t: 'morgen', cat: 'feedback', text: 'Kurznotiz: "Sprachstimme traegt wieder".' },
    { w: 7, d: 'mi', t: 'mittag', cat: 'break',    text: 'V. hoert die Stille zwischen den Toenen neu.' },
    { w: 0, d: 'do', t: 'morgen', cat: 'routine',  text: 'Eine Saengerin: Technik und Vertrauen ruhen nebeneinander.' }
  ];

  // ----- Datums-Helfer -------------------------------------------------------
  const DAYS = ['mo', 'di', 'mi', 'do', 'fr'];
  const DAY_LABELS = { mo: 'Mo', di: 'Di', mi: 'Mi', do: 'Do', fr: 'Fr' };
  const TIME_LABELS = { morgen: 'morgens', mittag: 'mittags', abend: 'abends' };

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=So..6=Sa
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function fmtDM(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.';
  }

  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // ----- Render --------------------------------------------------------------
  const root = document.getElementById('calendar');
  if (!root) return;

  // Wochen: -1 (naechste), 0, 1, 2, 3, 4, 5, 6, 7 ==> total 9 Zeilen
  // Aufgabe fordert 8 Wochen --> wir nehmen current + 7 zurueck und naechste.
  const WEEK_ORDER = [-1, 0, 1, 2, 3, 4, 5, 6, 7];

  const now = new Date();
  const currentWeekStart = startOfWeek(now);

  function renderWeek(weekOffset) {
    const weekStart = addDays(currentWeekStart, -weekOffset * 7);
    const weekEnd = addDays(weekStart, 4);
    const kw = isoWeek(weekStart);

    const weekEl = document.createElement('div');
    weekEl.className = 'cal-week';
    weekEl.setAttribute('role', 'row');
    weekEl.dataset.offset = String(weekOffset);

    if (weekOffset === 0) {
      weekEl.dataset.current = 'true';
      weekEl.dataset.ghost = '0';
    } else if (weekOffset < 0) {
      weekEl.dataset.ghost = 'future';
    } else {
      // 1 -> 1, 2 -> 1, 3 -> 2, 4 -> 2, 5 -> 3, 6 -> 3, 7 -> 3
      const g = weekOffset <= 2 ? '1' : weekOffset <= 4 ? '2' : '3';
      weekEl.dataset.ghost = g;
    }

    const label = document.createElement('div');
    label.className = 'cal-week-label';
    label.innerHTML =
      '<span class="cal-week-kw">KW ' + String(kw).padStart(2, '0') + '</span>' +
      '<span class="cal-week-range">' + fmtDM(weekStart) + ' – ' + fmtDM(weekEnd) + '</span>';
    weekEl.appendChild(label);

    DAYS.forEach((dayKey, idx) => {
      const dayDate = addDays(weekStart, idx);
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.setAttribute('role', 'cell');

      const head = document.createElement('div');
      head.className = 'cal-day-head';
      head.innerHTML =
        '<span class="cal-day-name">' + DAY_LABELS[dayKey] + '</span>' +
        '<span class="cal-day-date">' + fmtDM(dayDate) + '</span>';
      cell.appendChild(head);

      const dayEntries = entries.filter(e => e.w === weekOffset && e.d === dayKey);

      // Sortiere morgen -> mittag -> abend
      const timeOrder = { morgen: 0, mittag: 1, abend: 2 };
      dayEntries.sort((a, b) => (timeOrder[a.t] || 9) - (timeOrder[b.t] || 9));

      dayEntries.forEach(e => {
        const el = document.createElement('div');
        el.className = 'cal-entry';
        if (e.cat === 'free') {
          el.classList.add('cal-entry-free-wrap');
          el.innerHTML =
            '<span class="dot dot-free" aria-hidden="true"></span>' +
            '<span class="cal-entry-text">' +
              '<span class="cal-entry-free">' + escapeHtml(e.text) + '</span>' +
              '<span class="cal-entry-meta">' + (TIME_LABELS[e.t] || '') + '</span>' +
            '</span>';
        } else {
          el.innerHTML =
            '<span class="dot dot-' + e.cat + '" aria-hidden="true"></span>' +
            '<span class="cal-entry-text">' +
              escapeHtml(e.text) +
              '<span class="cal-entry-meta">' + (TIME_LABELS[e.t] || '') + ' · ' + categoryLabel(e.cat) + '</span>' +
            '</span>';
        }
        cell.appendChild(el);
      });

      weekEl.appendChild(cell);
    });

    return weekEl;
  }

  function categoryLabel(cat) {
    switch (cat) {
      case 'break':    return 'Durchbruch';
      case 'routine':  return 'Routine';
      case 'first':    return 'Erste Probestunde';
      case 'feedback': return 'Rueckmeldung';
      default:         return '';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  WEEK_ORDER.forEach(off => {
    root.appendChild(renderWeek(off));
  });

  // ----- Rolling-Logik -------------------------------------------------------
  // Subtiles Weiterruecken: der Ghost-Grad aendert sich langsam.
  // Wir simulieren "Zeit laeuft" indem wir alle 8s ein floatendes Extra-Fading
  // um 0..1 auf die aktuelle Woche legen.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rollTimer = null;
  let phase = 0;

  function tick() {
    if (document.hidden) return;
    phase = (phase + 1) % 8;
    // Mikro-Variation: aktuelle Woche bekommt eine ganz leichte Pulsation ueber Shadow.
    const current = root.querySelector('.cal-week[data-current="true"]');
    if (!current) return;
    const intensity = 0.03 + 0.04 * Math.sin(phase * (Math.PI / 4));
    current.style.boxShadow = 'inset 4px 0 0 rgba(138, 61, 43, ' + intensity.toFixed(3) + ')';
  }

  function startRolling() {
    if (reduceMotion) return;
    stopRolling();
    rollTimer = window.setInterval(tick, 8000);
  }
  function stopRolling() {
    if (rollTimer) { window.clearInterval(rollTimer); rollTimer = null; }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRolling();
    else startRolling();
  });

  startRolling();

  // ----- IntersectionObserver: Fade-In + Ghost-Akzent beim Scrollen ----------
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transition = 'filter 900ms ease, opacity 900ms ease';
        }
      });
    }, { threshold: 0.15 });
    root.querySelectorAll('.cal-week').forEach(w => io.observe(w));
  }

  // ----- Telefon-Reveal ------------------------------------------------------
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneSlot = document.getElementById('phoneSlot');
  if (phoneBtn && phoneSlot) {
    phoneBtn.addEventListener('click', () => {
      phoneSlot.innerHTML = '<a href="tel:+495551234567">+49 (0)555 123 456 7</a>';
      phoneBtn.setAttribute('aria-expanded', 'true');
      phoneBtn.disabled = true;
      phoneBtn.textContent = 'Nummer angezeigt';
    });
  }

  // ----- Form-Validierung ----------------------------------------------------
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      status.textContent = '';
      status.style.color = '';

      // Honeypot
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) return;

      const vorname = form.querySelector('input[name="vorname"]');
      const name = form.querySelector('input[name="name"]');
      const email = form.querySelector('input[name="email"]');

      let ok = true;
      const missing = [];
      if (!vorname.value.trim()) { ok = false; missing.push('Vorname'); }
      if (!name.value.trim())    { ok = false; missing.push('Name'); }
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (!emailValid) { ok = false; missing.push('E-Mail'); }

      if (!ok) {
        status.textContent = 'Bitte prüfen: ' + missing.join(', ') + '.';
        return;
      }

      status.style.color = 'var(--cat-routine)';
      status.textContent = 'Danke, das ist angekommen. (Demo — kein Versand.)';
      form.reset();
    });
  }

})();
