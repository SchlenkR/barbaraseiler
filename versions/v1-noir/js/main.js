/* Barbara Sophia Sailer — v1-noir
   Minimal, intentional JS. Reveals + small interactions.
*/

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll reveal via IntersectionObserver ----
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
  }

  // ---- Reel-style timecode in top letterbox (updates slowly) ----
  const tc = document.querySelector('[data-tc]');
  if (tc) {
    const start = Date.now();
    const update = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed / 60) % 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      const f = String(Math.floor((Date.now() % 1000) / (1000 / 24))).padStart(2, '0');
      tc.textContent = `${h}:${m}:${s}:${f}`;
    };
    update();
    setInterval(update, 1000 / 12);
  }

  // ---- Phone reveal (spam-safe) ----
  const telBtn = document.querySelector('[data-tel-reveal]');
  if (telBtn) {
    telBtn.addEventListener('click', () => {
      const raw = '+491793713706';
      const display = '+49 (0)179 – 371 370 6';
      telBtn.outerHTML = `<a href="tel:${raw}" class="info-item-link">${display}</a>`;
    });
  }

  // ---- Scene counter for current section in top-right letterbox ----
  const sceneLabel = document.querySelector('[data-scene]');
  if (sceneLabel) {
    const acts = [...document.querySelectorAll('[data-scene-name]')];
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const name = entry.target.getAttribute('data-scene-name');
          const num = entry.target.getAttribute('data-scene-num') || '';
          sceneLabel.textContent = `SC. ${num} — ${name}`;
        }
      });
    }, { threshold: 0.3 });
    acts.forEach((a) => io2.observe(a));
  }

})();
