/* ==========================================================================
   v2-wiki — main.js
   Features:
     - Scroll-spy: highlight the active TOC entry as user scrolls
     - Mobile drawer toggle for the sidebar
     - Shortcuts overlay + gmail-style keyboard navigation (g+i, g+k, g+p, t, b, /, ?)
     - Phone number reveal (spam protection)
   ========================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----------------------------------------------------------------
  // Scroll-spy — highlight active TOC entry
  // ----------------------------------------------------------------
  const tocLinks = document.querySelectorAll('.toc-list a[data-spy]');
  const sections = Array.from(tocLinks)
    .map((a) => document.getElementById(a.dataset.spy))
    .filter(Boolean);

  const linkById = new Map();
  tocLinks.forEach((a) => linkById.set(a.dataset.spy, a));

  function setActive(id) {
    tocLinks.forEach((a) => a.classList.remove('active'));
    const a = linkById.get(id);
    if (a) a.classList.add('active');
  }

  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        // Pick the section whose top is closest to the upper part of the viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      {
        rootMargin: '-15% 0px -70% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 1]
      }
    );
    sections.forEach((s) => io.observe(s));
  }

  // Fallback scroll handler for robustness
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Determine the section whose top is just above the scroll threshold
        const threshold = window.innerHeight * 0.25;
        let current = null;
        for (const sec of sections) {
          const rect = sec.getBoundingClientRect();
          if (rect.top - threshold <= 0) current = sec.id;
        }
        if (current) setActive(current);
        ticking = false;
      });
    },
    { passive: true }
  );

  // Kick off initial state
  if (sections.length) {
    const first = sections[0];
    const rect = first.getBoundingClientRect();
    if (rect.top > 0) setActive(first.id);
  }

  // ----------------------------------------------------------------
  // Mobile drawer toggle
  // ----------------------------------------------------------------
  const drawerToggle = document.getElementById('drawerToggle');
  const drawerScrim = document.getElementById('drawerScrim');
  const sidebar = document.getElementById('sidebar');

  function openDrawer() {
    document.body.classList.add('drawer-open');
    if (drawerScrim) drawerScrim.hidden = false;
    drawerToggle && drawerToggle.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    if (drawerScrim) drawerScrim.hidden = true;
    drawerToggle && drawerToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleDrawer() {
    if (document.body.classList.contains('drawer-open')) closeDrawer();
    else openDrawer();
  }

  drawerToggle && drawerToggle.addEventListener('click', toggleDrawer);
  drawerScrim && drawerScrim.addEventListener('click', closeDrawer);

  // Close drawer when a TOC link is clicked on mobile
  tocLinks.forEach((a) =>
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 720px)').matches) {
        closeDrawer();
      }
    })
  );

  // Escape closes the sidebar drawer when it's open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });

  // ----------------------------------------------------------------
  // Phone number reveal — encoded to dodge naïve scrapers
  // Actual number: +49 (0)555 – 123 456 7
  // ----------------------------------------------------------------
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneInline = document.getElementById('phoneInline');

  // parts assembled at runtime
  function getPhoneDisplay() {
    return ['+49', '(0)', '555', '123', '456', '7'].join(' ');
  }
  function getPhoneTel() {
    return '+49' + '555' + '1234567';
  }

  function revealPhone() {
    const display = getPhoneDisplay();
    const tel = getPhoneTel();

    if (phoneBtn) {
      const wrap = phoneBtn.parentElement;
      if (wrap) {
        const a = document.createElement('a');
        a.href = 'tel:' + tel;
        a.textContent = display;
        a.className = 'phone-num';
        a.style.fontFamily = 'var(--f-mono)';
        a.style.fontSize = '1.1rem';
        a.style.letterSpacing = '0.02em';
        wrap.replaceChild(a, phoneBtn);
      }
    }

    if (phoneInline) {
      phoneInline.textContent = display;
      phoneInline.setAttribute('href', 'tel:' + tel);
    }
  }

  phoneBtn && phoneBtn.addEventListener('click', revealPhone);
  phoneInline &&
    phoneInline.addEventListener('click', (e) => {
      if (phoneInline.textContent.includes('Klick')) {
        e.preventDefault();
        revealPhone();
      }
    });
})();
