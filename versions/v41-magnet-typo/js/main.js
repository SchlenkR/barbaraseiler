/* v41-magnet-typo · Zug der Stimme
   Cursor-gravity physics, vanilla JS, no libraries.
   - Custom cursor (lerped), hover states with label
   - Hero letters translate toward cursor (quadratic falloff)
   - Prose words swell / breathe with cursor proximity (variable font wght)
   - Testimonials repulse from cursor
   - Tarif cards 3D tilt (rotateX/Y)
   - Submit button magnetic (attracts when close, escapes in edge band)
   - SVG divider bends toward cursor Y
   - IntersectionObserver filters to visible sections only
   - Touch + prefers-reduced-motion graceful fallback
*/

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const enableMagnet = !prefersReducedMotion && !isTouch;

  /* ------------------------------------------------------------------
     Global mouse state (lerped)
     ------------------------------------------------------------------ */
  const mouse = {
    // raw
    rx: window.innerWidth / 2,
    ry: window.innerHeight / 2,
    // lerped (for cursor visual)
    lx: window.innerWidth / 2,
    ly: window.innerHeight / 2,
    active: false,
  };

  window.addEventListener('mousemove', (e) => {
    mouse.rx = e.clientX;
    mouse.ry = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('mouseenter', () => { mouse.active = true; });

  /* ------------------------------------------------------------------
     Custom Cursor
     ------------------------------------------------------------------ */
  const cursor = document.querySelector('.cursor');
  const cursorLabel = cursor ? cursor.querySelector('.cursor__label') : null;

  if (enableMagnet && cursor) {
    document.body.classList.add('cursor-active');

    // Hover-label sources
    const hoverables = document.querySelectorAll('[data-cursor-label], a, button, input, textarea, select');
    hoverables.forEach((el) => {
      const label = el.getAttribute('data-cursor-label');
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        if (cursorLabel) cursorLabel.textContent = label || '';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover');
        if (cursorLabel) cursorLabel.textContent = '';
      });
    });
  }

  /* ------------------------------------------------------------------
     Hero letters — translate toward cursor
     ------------------------------------------------------------------ */
  const headlineText = 'Resonanz';
  const headline = document.querySelector('.hero__headline');
  const letterSpans = [];

  if (headline) {
    headline.innerHTML = '';
    for (const ch of headlineText) {
      const span = document.createElement('span');
      span.className = 'ltr';
      span.textContent = ch;
      headline.appendChild(span);
      letterSpans.push({ el: span, tx: 0, ty: 0, cx: 0, cy: 0 });
    }
  }

  function measureLetterCenters() {
    letterSpans.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      l.cx = r.left + r.width / 2;
      l.cy = r.top + r.height / 2;
    });
  }

  /* ------------------------------------------------------------------
     Prose words — breathe + swell with cursor proximity
     ------------------------------------------------------------------ */
  const proseWords = [];
  document.querySelectorAll('[data-prose]').forEach((p) => {
    const raw = p.innerHTML;
    // Keep <em>-marked accent words, wrap everything else in per-word spans
    // Strategy: tokenize by regex, preserve tags
    const nodes = [];
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    // Flatten: text nodes become words, <em> wrapped as em-word
    const processNode = (node, isEm) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.nodeValue.split(/(\s+)/);
        parts.forEach((part) => {
          if (part.length === 0) return;
          if (/^\s+$/.test(part)) {
            nodes.push({ type: 'space', text: part });
          } else {
            nodes.push({ type: 'word', text: part, em: isEm });
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const em = isEm || node.tagName === 'EM';
        node.childNodes.forEach((c) => processNode(c, em));
      }
    };
    tmp.childNodes.forEach((c) => processNode(c, false));

    p.innerHTML = '';
    nodes.forEach((n) => {
      if (n.type === 'space') {
        p.appendChild(document.createTextNode(n.text));
      } else {
        const span = document.createElement('span');
        span.className = 'w' + (n.em ? ' em' : '');
        span.textContent = n.text;
        p.appendChild(span);
        proseWords.push({ el: span, cx: 0, cy: 0, w: 400, tx: 0, ty: 0 });
      }
    });
  });

  function measureProseCenters() {
    proseWords.forEach((w) => {
      const r = w.el.getBoundingClientRect();
      w.cx = r.left + r.width / 2;
      w.cy = r.top + r.height / 2;
    });
  }

  /* ------------------------------------------------------------------
     Testimonials — repulsion
     ------------------------------------------------------------------ */
  const quotes = [];
  document.querySelectorAll('.quote').forEach((el) => {
    quotes.push({ el, tx: 0, ty: 0, cx: 0, cy: 0, w: 0, h: 0 });
  });

  function measureQuoteCenters() {
    quotes.forEach((q) => {
      const r = q.el.getBoundingClientRect();
      q.cx = r.left + r.width / 2;
      q.cy = r.top + r.height / 2;
      q.w = r.width;
      q.h = r.height;
    });
  }

  /* ------------------------------------------------------------------
     Tarif cards — 3D tilt on hover
     ------------------------------------------------------------------ */
  const tarifs = [];
  document.querySelectorAll('.tarif').forEach((el) => {
    tarifs.push({ el, rx: 0, ry: 0, trx: 0, try: 0, hover: false });
    el.addEventListener('mouseenter', () => {
      const t = tarifs.find((x) => x.el === el);
      if (t) t.hover = true;
    });
    el.addEventListener('mouseleave', () => {
      const t = tarifs.find((x) => x.el === el);
      if (t) { t.hover = false; t.trx = 0; t.try = 0; }
    });
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Set gradient origin for CSS shimmer
      el.style.setProperty('--mx', (mx / rect.width * 100) + '%');
      el.style.setProperty('--my', (my / rect.height * 100) + '%');
      const t = tarifs.find((x) => x.el === el);
      if (!t) return;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const nx = (mx - cx) / cx; // -1..1
      const ny = (my - cy) / cy; // -1..1
      t.try = nx * 8;  // rotateY
      t.trx = -ny * 8; // rotateX
    });
  });

  /* ------------------------------------------------------------------
     Submit button — magnetic
     ------------------------------------------------------------------ */
  const submitBtn = document.querySelector('.submit');
  const submitState = { tx: 0, ty: 0, cx: 0, cy: 0 };

  function measureSubmit() {
    if (!submitBtn) return;
    const r = submitBtn.getBoundingClientRect();
    submitState.cx = r.left + r.width / 2;
    submitState.cy = r.top + r.height / 2;
  }

  /* ------------------------------------------------------------------
     SVG divider path — bends near cursor Y
     ------------------------------------------------------------------ */
  const dividers = Array.from(document.querySelectorAll('.divider path'));

  /* ------------------------------------------------------------------
     IntersectionObserver — only animate visible sections
     ------------------------------------------------------------------ */
  const visibility = new WeakMap();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visibility.set(e.target, e.isIntersecting));
  }, { rootMargin: '10% 0px' });

  document.querySelectorAll('[data-observe]').forEach((el) => io.observe(el));
  function visible(el) { return visibility.get(el) !== false; }

  /* ------------------------------------------------------------------
     Recompute on resize/scroll
     ------------------------------------------------------------------ */
  let recomputeTimer = null;
  function recompute() {
    measureLetterCenters();
    measureProseCenters();
    measureQuoteCenters();
    measureSubmit();
  }
  window.addEventListener('resize', () => {
    clearTimeout(recomputeTimer);
    recomputeTimer = setTimeout(recompute, 80);
  });
  window.addEventListener('scroll', () => {
    clearTimeout(recomputeTimer);
    recomputeTimer = setTimeout(recompute, 50);
  }, { passive: true });

  // Font-load dependent: re-measure after fonts settle
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(recompute, 60));
  }
  window.addEventListener('load', () => setTimeout(recompute, 120));
  recompute();

  /* ------------------------------------------------------------------
     Animation loop
     ------------------------------------------------------------------ */
  let lastRAF = 0;
  let timePhase = 0;

  function loop(t) {
    const dt = Math.min(0.05, (t - lastRAF) / 1000 || 0.016);
    lastRAF = t;
    timePhase += dt;

    // Cursor lerp
    if (enableMagnet && cursor) {
      mouse.lx += (mouse.rx - mouse.lx) * 0.22;
      mouse.ly += (mouse.ry - mouse.ly) * 0.22;
      cursor.style.transform = `translate3d(${mouse.lx}px, ${mouse.ly}px, 0) translate(-50%, -50%)`;
    }

    if (enableMagnet) {
      // Hero letters
      const headlineSection = document.querySelector('.hero');
      const headlineVisible = headlineSection ? visible(headlineSection) : true;
      if (headlineVisible) {
        const radius = 220;
        const radiusSq = radius * radius;
        const maxPull = 60;
        for (let i = 0; i < letterSpans.length; i++) {
          const l = letterSpans[i];
          const dx = mouse.rx - l.cx;
          const dy = mouse.ry - l.cy;
          const dSq = dx * dx + dy * dy;
          let targetX = 0, targetY = 0;
          if (dSq < radiusSq) {
            const d = Math.sqrt(dSq) || 1;
            const falloff = 1 - d / radius; // 0..1
            const strength = falloff * falloff; // quadratic
            const ux = dx / d;
            const uy = dy / d;
            targetX = ux * maxPull * strength;
            targetY = uy * maxPull * strength;
          }
          l.tx += (targetX - l.tx) * 0.18;
          l.ty += (targetY - l.ty) * 0.18;
          l.el.style.transform = `translate3d(${l.tx.toFixed(2)}px, ${l.ty.toFixed(2)}px, 0)`;
        }
      }

      // Prose words
      const proseSection = document.querySelector('.prose');
      const proseVisible = proseSection ? visible(proseSection) : true;
      if (proseVisible) {
        const radius = 180;
        const radiusSq = radius * radius;
        for (let i = 0; i < proseWords.length; i++) {
          const w = proseWords[i];
          const dx = mouse.rx - w.cx;
          const dy = mouse.ry - w.cy;
          const dSq = dx * dx + dy * dy;
          let targetWght = 300 + 60 * Math.sin(timePhase * 0.9 + i * 0.3); // baseline breath
          if (dSq < radiusSq) {
            const d = Math.sqrt(dSq) || 1;
            const falloff = 1 - d / radius;
            const strength = falloff * falloff;
            targetWght += 350 * strength;
          }
          w.w += (targetWght - w.w) * 0.12;
          w.el.style.fontVariationSettings = `"wght" ${Math.max(100, Math.min(900, w.w)).toFixed(0)}, "opsz" 72`;
        }
      }

      // Testimonials repulse
      const testifySection = document.querySelector('.testify');
      const testifyVisible = testifySection ? visible(testifySection) : true;
      if (testifyVisible) {
        const radius = 260;
        const radiusSq = radius * radius;
        const maxPush = 38;
        for (let i = 0; i < quotes.length; i++) {
          const q = quotes[i];
          const dx = q.cx - mouse.rx;
          const dy = q.cy - mouse.ry;
          const dSq = dx * dx + dy * dy;
          let targetX = 0, targetY = 0;
          if (dSq < radiusSq && dSq > 1) {
            const d = Math.sqrt(dSq);
            const falloff = 1 - d / radius;
            const strength = falloff * falloff;
            const ux = dx / d;
            const uy = dy / d;
            targetX = ux * maxPush * strength;
            targetY = uy * maxPush * strength;
          }
          q.tx += (targetX - q.tx) * 0.12;
          q.ty += (targetY - q.ty) * 0.12;
          q.el.style.transform = `translate3d(${q.tx.toFixed(2)}px, ${q.ty.toFixed(2)}px, 0)`;
        }
      }

      // Tarif cards — tilt (already handled by mousemove, here we lerp rx/ry)
      for (let i = 0; i < tarifs.length; i++) {
        const t = tarifs[i];
        t.rx += (t.trx - t.rx) * 0.14;
        t.ry += (t.try - t.ry) * 0.14;
        t.el.style.transform = `perspective(1000px) rotateX(${t.rx.toFixed(2)}deg) rotateY(${t.ry.toFixed(2)}deg) translateZ(0)`;
      }

      // Submit magnet
      if (submitBtn) {
        const dx = mouse.rx - submitState.cx;
        const dy = mouse.ry - submitState.cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        const attractRadius = 140;
        const escapeRing = 200; // outside attract, within this — push away
        let targetX = 0, targetY = 0;
        if (d < attractRadius) {
          // Attract: move toward cursor strongly (catches it)
          const falloff = 1 - d / attractRadius;
          targetX = dx * falloff * 0.5;
          targetY = dy * falloff * 0.5;
        } else if (d < escapeRing) {
          // Escape band: slip away slightly perpendicular
          const ring = (d - attractRadius) / (escapeRing - attractRadius); // 0..1
          const shrink = 1 - ring; // fades out at outer edge
          const ux = dx / (d || 1);
          const uy = dy / (d || 1);
          targetX = -ux * 24 * shrink;
          targetY = -uy * 24 * shrink;
        }
        submitState.tx += (targetX - submitState.tx) * 0.18;
        submitState.ty += (targetY - submitState.ty) * 0.18;
        submitBtn.style.transform = `translate3d(${submitState.tx.toFixed(2)}px, ${submitState.ty.toFixed(2)}px, 0)`;
      }

      // Dividers — bend toward cursor
      dividers.forEach((p) => {
        const parent = p.closest('.divider');
        if (!parent || !visible(parent)) return;
        const r = p.getBoundingClientRect();
        const w = r.width;
        const midX = r.left + w / 2;
        const cursorLocalX = Math.max(0, Math.min(w, mouse.rx - r.left));
        // Closer cursor Y = more bend; above baseline bends up, below bends down
        const dyRel = mouse.ry - (r.top + 30);
        const dist = Math.abs(dyRel);
        const maxDist = 260;
        const strength = Math.max(0, 1 - dist / maxDist);
        const bend = Math.sign(dyRel) * -28 * strength * strength; // -28..28
        const cp1x = cursorLocalX;
        const cp1y = 30 + bend;
        p.setAttribute('d', `M 0 30 Q ${cp1x} ${cp1y} ${w} 30`);
      });
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ------------------------------------------------------------------
     Quote dialog
     ------------------------------------------------------------------ */
  const dialog = document.getElementById('quoteDialog');
  const dialogBody = dialog ? dialog.querySelector('.quote-dialog__body') : null;
  const dialogAuthor = dialog ? dialog.querySelector('.quote-dialog__author') : null;

  document.querySelectorAll('.quote').forEach((q) => {
    q.addEventListener('click', () => {
      if (!dialog) return;
      const full = q.getAttribute('data-full') || q.querySelector('p')?.textContent || '';
      const author = q.querySelector('.quote__author')?.textContent || '';
      if (dialogBody) dialogBody.textContent = full;
      if (dialogAuthor) dialogAuthor.textContent = author;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });

  if (dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    const closeBtn = dialog.querySelector('.quote-dialog__close');
    if (closeBtn) closeBtn.addEventListener('click', () => dialog.close());
  }
})();
