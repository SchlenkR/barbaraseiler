/* v3-neobrutal — minimal JS
 * Phone reveal (anti-spam pattern). No other enhancement needed;
 * the CSS carries the design on its own.
 */
(function () {
  'use strict';

  // Phone number reveal — assembled on click to avoid scrape bots
  var btn = document.getElementById('phoneRevealBtn');
  var wrap = document.getElementById('phoneReveal');
  if (btn && wrap) {
    btn.addEventListener('click', function () {
      var parts = ['+49', ' (0)', '179', ' – ', '371', ' ', '370', ' 6'];
      var tel = parts.join('');
      var telHref = 'tel:+49179' + '3713706';
      var link = document.createElement('a');
      link.href = telHref;
      link.className = 'phone-number';
      link.textContent = tel;
      btn.replaceWith(link);
    });
  }
})();
