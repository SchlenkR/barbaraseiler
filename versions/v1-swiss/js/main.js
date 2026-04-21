// v1-swiss — minimal, quiet.
// Only job: reveal the phone number on click (anti-spam pattern).
(function () {
  'use strict';

  var el = document.getElementById('phone-reveal');
  if (!el) return;

  // Phone number split and reassembled at runtime.
  var parts = ['+49', ' (0)179', ' — 371', ' 370', ' 6'];
  var plain = '+491793713706';
  var revealed = false;

  function reveal(e) {
    if (revealed) return; // let subsequent clicks be native tel: navigations
    e.preventDefault();
    el.textContent = parts.join('');
    el.setAttribute('href', 'tel:' + plain);
    el.setAttribute('aria-label', 'Telefon — ' + parts.join(''));
    revealed = true;
  }

  el.addEventListener('click', reveal);
  el.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') reveal(ev);
  });
})();
