// v4-linear — minimal enhancements: nav scrolled state, phone reveal, current year

(function () {
  'use strict';

  // Nav scrolled state — sharpens hairline border after initial scroll.
  const nav = document.getElementById('siteNav');
  if (nav) {
    const update = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  // Phone reveal — obfuscated number assembled client-side (spam protection).
  const phoneBtn = document.getElementById('phoneRevealBtn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', () => {
      // Assemble: +49 (0)179 - 371 370 6
      const parts = ['+49', '(0)179', '371', '370', '6'];
      const num = parts.join(' ').replace('+49 (0)', '+49 ');
      const tel = '+491793713706';

      const wrap = document.getElementById('phoneReveal');
      wrap.innerHTML = `<a class="phone-number" href="tel:${tel}">${num}</a>`;
    });
  }

  // Current year
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
