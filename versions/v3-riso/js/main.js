// Barbara Sophia Sailer — v3-riso
// Lightweight interactions. Respects prefers-reduced-motion.

(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------
  // Phone reveal (spam-protection pattern)
  // ---------------------------------------------------------------------
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneWrap = document.getElementById('phoneReveal');
  if (phoneBtn && phoneWrap) {
    phoneBtn.addEventListener('click', function () {
      // Assembled client-side to foil naive scrapers
      const parts = ['+49', ' (0)555', ' – 371', ' 370', ' 6'];
      const number = parts.join('');
      const tel = 'tel:+495551234567';
      phoneBtn.outerHTML =
        '<a class="phone-number" href="' + tel + '">' + number + '</a>';
    });
  }

  // ---------------------------------------------------------------------
  // Tiny parallax on hero scribble / arrow (very subtle — just a little
  // ink-wobble on scroll). Disabled under reduced-motion.
  // ---------------------------------------------------------------------
  if (!reduce) {
    const arrow = document.querySelector('.hero-arrow');
    const scribble = document.querySelector('.hero-scribble');
    if (arrow || scribble) {
      let ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            const y = window.scrollY;
            if (arrow) {
              arrow.style.transform = 'rotate(' + (8 + y * 0.01) + 'deg) translateY(' + (-y * 0.08) + 'px)';
            }
            if (scribble) {
              scribble.style.transform = 'rotate(' + (-5 - y * 0.008) + 'deg) translateY(' + (y * 0.05) + 'px)';
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // ---------------------------------------------------------------------
  // Misregistration intensifier on hover for big headlines
  // ---------------------------------------------------------------------
  if (!reduce) {
    document.querySelectorAll('.misreg').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        el.style.transition = 'none';
        el.style.setProperty('--mx', Math.floor(Math.random() * 4 + 2) + 'px');
      });
    });
  }

})();
