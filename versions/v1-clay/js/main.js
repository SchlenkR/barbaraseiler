// v1-clay — minimal interactivity
// Phone reveal on click (basic spam obfuscation)

(function () {
  'use strict';

  const btn = document.getElementById('phoneReveal');
  const txt = document.getElementById('phoneText');
  if (!btn || !txt) return;

  // Obfuscated phone parts
  const parts = ['+49', '(0)179', '371', '370', '6'];

  btn.addEventListener('click', function () {
    const number = parts.join(' ').replace('+49 (0)', '+49 ');
    const tel = '+49' + parts.slice(1).join('').replace(/\D/g, '');
    txt.innerHTML = '';
    const a = document.createElement('a');
    a.href = 'tel:' + tel;
    a.textContent = parts.join(' ');
    a.style.color = 'inherit';
    a.style.fontWeight = '800';
    txt.appendChild(a);
    btn.setAttribute('aria-label', 'Telefonnummer ' + parts.join(' '));
  }, { once: true });
})();
