/* v39 · Zwei Farben
   Minimaler Vanilla-JS:
   - Split reveal-Headlines in <span class="char"> für staggered fade-in
   - IntersectionObserver schaltet .is-visible
   - CTA-Click setzt Fach-Dropdown per data-intent Mapping
   - Respects prefers-reduced-motion
*/

(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1) Split Headlines in <span class="char"> ----------
  const revealEls = document.querySelectorAll('[data-reveal]');

  revealEls.forEach((el) => {
    // If element already has spans as children (pre-split), skip char-splitting.
    const hasSpanChildren = el.querySelector(':scope > span');
    if (hasSpanChildren) return;

    const text = el.textContent;
    el.textContent = '';
    const frag = document.createDocumentFragment();
    // Walk characters; wrap non-space in .char, space stays as text (width from line-height)
    for (const ch of text) {
      if (ch === ' ' || ch === ' ') {
        frag.appendChild(document.createTextNode(' '));
      } else if (ch === '\n') {
        // ignore
      } else {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        frag.appendChild(span);
      }
    }
    el.appendChild(frag);
  });

  // Stagger per char/span via transition-delay
  const STEP_MS = 30;
  revealEls.forEach((el) => {
    const items = el.querySelectorAll(':scope > span, :scope .char');
    items.forEach((item, i) => {
      item.style.transitionDelay = `${i * STEP_MS}ms`;
    });
  });

  // ---------- 2) IntersectionObserver ----------
  if (reduced) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------- 3) CTA-Intent → Fach-Dropdown ----------
  // Gleiche Section (#kontakt) für alle drei CTAs — aber wir mappen die Absicht
  // auf ein sinnvolles Default-Fach, damit Barbara den Intent sieht.
  const intentToFach = {
    beginner:  'Pop',      // Einsteiger kommen meist aus Pop/Musical
    advanced:  'Klassik',  // Fortgeschrittene oft Klassik
    inbetween: 'Chanson',  // Dazwischen: Chanson als sanfter Default
  };

  const fachSelect = document.getElementById('fachSelect');
  const form = document.getElementById('contactForm');

  const setIntent = (intent) => {
    if (!intent || !fachSelect) return;
    const fach = intentToFach[intent];
    if (fach) {
      fachSelect.value = fach;
      // Hidden-Feld mit Roh-Intent für Barbara
      let hidden = form?.querySelector('input[name="Intent"]');
      if (form && !hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = 'Intent';
        form.appendChild(hidden);
      }
      if (hidden) hidden.value = intent;
    }
  };

  document.querySelectorAll('.cta[data-intent]').forEach((cta) => {
    cta.addEventListener('click', () => {
      const intent = cta.dataset.intent;
      // Warte einen Tick, bis Scroll-Snap die Section eingerastet hat
      setTimeout(() => setIntent(intent), 50);
    });
  });

  // ---------- 4) URL-Hash respect (für Direktlinks von außerhalb) ----------
  const hashIntentMap = {
    '#a1': 'beginner',
    '#a2': 'advanced',
    '#a3': 'inbetween',
  };
  if (window.location.hash && hashIntentMap[window.location.hash]) {
    setIntent(hashIntentMap[window.location.hash]);
  }
})();
