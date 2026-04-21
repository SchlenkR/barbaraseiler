// v2-bento — tiny enhancements
// - Initialize Lucide icons
// - Phone reveal (spam protection)

(function () {
  'use strict';

  // Render Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Phone reveal
  var btn = document.getElementById('phoneRevealBtn');
  var num = document.getElementById('phoneNumber');
  if (btn && num) {
    btn.addEventListener('click', function () {
      num.hidden = false;
      btn.hidden = true;
    });
  }
})();
