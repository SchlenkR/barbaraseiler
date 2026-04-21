/* v4-terminal — boot log + clock + phone reveal.
   All lightweight. No external deps. Respects prefers-reduced-motion. */

(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- STATUSBAR CLOCK ---
  var clock = document.getElementById('sbClock');
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' CET';
  }
  tick();
  setInterval(tick, 1000);

  // --- BOOT LOG (typing effect, skipped on reduced motion) ---
  var bootLog = document.getElementById('bootLog');
  if (bootLog) {
    var lines = [
      { t: '[  OK  ] ', body: 'Verbindung aufgebaut -> sailer.bbs:23', c: 'ok' },
      { t: '[  OK  ] ', body: 'Hostname: sailer.bbs (node 01)',        c: 'ok' },
      { t: '[ INFO ] ', body: 'Loading GESANG.SYS ........ done',       c: '' },
      { t: '[ INFO ] ', body: 'Loading STIMME.DRV ........ done',       c: '' },
      { t: '[ WARN ] ', body: 'Modem audio: bitte nicht nachsingen.',   c: 'warn' },
      { t: '[  OK  ] ', body: 'Profil geladen: Barbara Sophia Sailer', c: 'ok' },
      { t: '[ INFO ] ', body: 'Press [P] fuer Probestunde, [A] fuer Angebot.', c: '' }
    ];

    if (reduced) {
      // render instantly
      bootLog.innerHTML = lines.map(function (l) {
        var cls = l.c ? ' class="' + l.c + '"' : '';
        return '<span' + cls + '>' + escapeHtml(l.t + l.body) + '</span>';
      }).join('\n');
    } else {
      typeBootLog(bootLog, lines);
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function typeBootLog(el, lines) {
    el.innerHTML = '';
    var i = 0;
    function nextLine() {
      if (i >= lines.length) return;
      var l = lines[i++];
      var span = document.createElement('span');
      if (l.c) span.className = l.c;
      el.appendChild(span);
      typeInto(span, l.t + l.body, 0, function () {
        el.appendChild(document.createTextNode('\n'));
        setTimeout(nextLine, 120 + Math.random() * 160);
      });
    }
    function typeInto(node, text, idx, done) {
      if (idx >= text.length) { done(); return; }
      node.appendChild(document.createTextNode(text.charAt(idx)));
      // variable speed for character-feel
      var delay = 10 + Math.random() * 18;
      if (text.charAt(idx) === ' ') delay = 4;
      setTimeout(function () { typeInto(node, text, idx + 1, done); }, delay);
    }
    setTimeout(nextLine, 300);
  }

  // --- PHONE REVEAL (anti-spam, same obfuscation pattern as parent) ---
  var btn = document.getElementById('phoneRevealBtn');
  var out = document.getElementById('phoneOut');
  if (btn && out) {
    btn.addEventListener('click', function () {
      // assemble number from parts
      var parts = ['+49', '179', '371', '370', '6'];
      var nr = parts.join(' ');
      out.hidden = false;
      out.innerHTML = '&gt; <a href="tel:+491793713706">' + nr + '</a>';
      btn.style.display = 'none';
    });
  }

  // --- KEYBOARD SHORTCUTS ([U][A][O][P][F][K][T][W]) ---
  var keymap = {
    'u': '#ueber-mich',
    'a': '#ziele',
    'o': '#ort',
    'p': '#preise',
    'f': '#faq',
    'k': '#kontakt',
    't': '#top'
  };
  document.addEventListener('keydown', function (e) {
    // don't hijack when user types in fields
    var tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (keymap[k]) {
      var el = document.querySelector(keymap[k]);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
    } else if (k === 'w') {
      var wa = document.querySelector('.btn-whatsapp');
      if (wa) { e.preventDefault(); wa.click(); }
    }
  });

  // --- YEAR ---
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

})();
