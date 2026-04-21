// Barbara Sailer v3-collage — minimal interactions
// Phone number reveal (anti-spam pattern) and gentle polaroid entrance.

(function () {
  'use strict';

  // --- Phone reveal: never embedded plain in markup ---
  var btn = document.getElementById('phoneRevealBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      // Parts so the string never appears as a literal pre-click
      var parts = ['+49', '179', '371', '370', '6'];
      var display = parts[0] + ' (0)' + parts[1] + ' – ' + parts[2] + ' ' + parts[3];
      var telHref = 'tel:+49' + parts[1] + parts[2] + parts[3] + parts[4];

      btn.outerHTML =
        '<a class="phone-number" href="' + telHref + '">' + display + ' ' + parts[4] + '</a>';
    }, { once: true });
  }

  // --- Staggered fade-in for polaroids, unless reduced motion ---
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced || !('IntersectionObserver' in window)) return;

  var polaroids = document.querySelectorAll('.polaroid, .goal-card, .price-tag, .persona, .pillar, .process li, .location');
  polaroids.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    // Preserve existing rotate transform by reading it back
    var cs = window.getComputedStyle(el);
    var currentTransform = cs.transform;
    el.dataset.restTransform = (currentTransform && currentTransform !== 'none') ? currentTransform : '';
    el.style.transform = 'translateY(16px) ' + (el.dataset.restTransform || '');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = el.dataset.restTransform || '';
      }, i * 40);
      io.unobserve(el);
    });
  }, { threshold: 0.12 });

  polaroids.forEach(function (el) { io.observe(el); });
})();
