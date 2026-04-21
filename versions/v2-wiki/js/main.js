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

  // ----------------------------------------------------------------
  // Shortcuts overlay
  // ----------------------------------------------------------------
  const kbdHint = document.getElementById('kbdHint');
  const overlay = document.getElementById('shortcutsOverlay');
  const overlayClose = document.getElementById('shortcutsClose');

  function showShortcuts() {
    if (!overlay) return;
    overlay.hidden = false;
  }
  function hideShortcuts() {
    if (!overlay) return;
    overlay.hidden = true;
  }
  kbdHint && kbdHint.addEventListener('click', showShortcuts);
  overlayClose && overlayClose.addEventListener('click', hideShortcuts);
  overlay &&
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideShortcuts();
    });

  // Gmail-style keyboard shortcuts (g+letter chords)
  let gMode = false;
  let gModeTimer = null;

  function enterGMode() {
    gMode = true;
    clearTimeout(gModeTimer);
    gModeTimer = setTimeout(() => {
      gMode = false;
    }, 1200);
  }

  function isTypingInForm(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  document.addEventListener('keydown', (e) => {
    if (isTypingInForm(e.target)) return;

    // Escape closes overlay / drawer
    if (e.key === 'Escape') {
      if (overlay && !overlay.hidden) {
        hideShortcuts();
        return;
      }
      if (document.body.classList.contains('drawer-open')) {
        closeDrawer();
        return;
      }
    }

    // ? opens overlay
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      showShortcuts();
      return;
    }

    // / focuses (fake) search input
    if (e.key === '/') {
      const search = document.querySelector('.sidebar-search input');
      if (search) {
        e.preventDefault();
        search.focus();
      }
      return;
    }

    // t/b = top/bottom
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      return;
    }
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      return;
    }

    // g chord prefix
    if (!gMode && (e.key === 'g' || e.key === 'G')) {
      enterGMode();
      return;
    }

    if (gMode) {
      const k = e.key.toLowerCase();
      if (k === 'i') {
        e.preventDefault();
        scrollToId('abstract');
      } else if (k === 'k') {
        e.preventDefault();
        scrollToId('kontakt');
      } else if (k === 'p') {
        e.preventDefault();
        scrollToId('konditionen');
      } else if (k === 'f') {
        e.preventDefault();
        scrollToId('faq');
      } else if (k === 'b') {
        e.preventDefault();
        scrollToId('biographie');
      } else if (k === 'm') {
        e.preventDefault();
        scrollToId('methode');
      }
      gMode = false;
      clearTimeout(gModeTimer);
    }
  });

  // ----------------------------------------------------------------
  // Phone number reveal — encoded to dodge naïve scrapers
  // Actual number: +49 (0)179 – 371 370 6
  // ----------------------------------------------------------------
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneInline = document.getElementById('phoneInline');

  // parts assembled at runtime
  function getPhoneDisplay() {
    return ['+49', '(0)', '179', '371', '370', '6'].join(' ');
  }
  function getPhoneTel() {
    return '+49' + '179' + '3713706';
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
