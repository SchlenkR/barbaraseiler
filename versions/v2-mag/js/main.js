/* v2-mag — magazine variant
   Minimal JS: phone reveal (spam-obfuscated) + smooth scroll enhancement.
   Respects prefers-reduced-motion. */

(function () {
  'use strict';

  // Phone reveal — number is split to avoid trivial scraping.
  var revealBtn = document.getElementById('phoneRevealBtn');
  if (revealBtn) {
    revealBtn.addEventListener('click', function () {
      var parts = ['+49', ' (0)179', ' – 371 370 6'];
      var num = parts.join('');
      var wrap = document.getElementById('phoneReveal');
      if (!wrap) return;
      // Replace button with a tel: link styled as headline numeral.
      var a = document.createElement('a');
      a.href = 'tel:' + num.replace(/[^+0-9]/g, '');
      a.className = 'phone-number';
      a.textContent = num;
      revealBtn.replaceWith(a);
    }, { once: true });
  }

  // Accent mast-nav link when section is in view — simple IntersectionObserver.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var navLinks = document.querySelectorAll('.mast-nav a[href^="#"]');
    var map = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          navLinks.forEach(function (l) { l.style.color = ''; });
          link.style.color = 'var(--accent)';
        }
      });
    }, { threshold: [0.2, 0.5] });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }
})();
