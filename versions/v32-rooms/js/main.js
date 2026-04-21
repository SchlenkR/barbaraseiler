// v32-rooms — Räume
// Same-document View Transitions API with graceful <dialog> fallback.
// No external libs. Respects prefers-reduced-motion.

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsVT = typeof document.startViewTransition === 'function' && !prefersReduced;

  // ---------- Panel management ----------
  const panels = new Map();
  document.querySelectorAll('dialog.panel').forEach((el) => {
    const id = el.id.replace(/^panel-/, '');
    panels.set(id, el);
  });

  let lastTrigger = null;

  function openPanel(targetId, trigger) {
    const panel = panels.get(targetId);
    if (!panel) return;

    lastTrigger = trigger || document.activeElement;

    const doOpen = () => {
      if (typeof panel.showModal === 'function') {
        if (!panel.open) {
          try { panel.showModal(); } catch (_) { panel.setAttribute('open', ''); }
        }
      } else {
        panel.setAttribute('open', '');
      }
      // Move focus to close button for accessibility
      const closeBtn = panel.querySelector('.panel-close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
      document.body.style.overflow = 'hidden';
    };

    if (supportsVT) {
      try {
        const t = document.startViewTransition(doOpen);
        // Silent catch: if VT fails mid-transition, the state switch still happened in doOpen()
        t.finished && t.finished.catch(() => {});
      } catch (_) {
        doOpen();
      }
    } else {
      doOpen();
    }
  }

  function closePanel(panel) {
    const doClose = () => {
      if (panel.open && typeof panel.close === 'function') {
        try { panel.close(); } catch (_) { panel.removeAttribute('open'); }
      } else {
        panel.removeAttribute('open');
      }
      document.body.style.overflow = '';
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus({ preventScroll: false });
      }
    };

    if (supportsVT) {
      try {
        const t = document.startViewTransition(doClose);
        t.finished && t.finished.catch(() => {});
      } catch (_) {
        doClose();
      }
    } else {
      doClose();
    }
  }

  // ---------- Hotspot bindings (SVG + stack cards) ----------
  function bindTriggers() {
    const triggers = document.querySelectorAll('[data-target]');
    triggers.forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        const id = el.getAttribute('data-target');
        openPanel(id, el);
      });
      // SVG <g> needs manual keyboard handling
      if (el.tagName.toLowerCase() === 'g') {
        el.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            const id = el.getAttribute('data-target');
            openPanel(id, el);
          }
        });
      }
    });
  }

  // ---------- Panel close bindings ----------
  function bindPanelControls() {
    panels.forEach((panel) => {
      const closeBtn = panel.querySelector('.panel-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => closePanel(panel));
      }
      // Backdrop click (dialog: click outside .panel-inner)
      panel.addEventListener('click', (ev) => {
        if (ev.target === panel) {
          closePanel(panel);
        }
      });
      // Escape: native <dialog> handles this, but we intercept to route through VT
      panel.addEventListener('cancel', (ev) => {
        ev.preventDefault();
        closePanel(panel);
      });
    });

    // Global Escape fallback (for non-dialog browsers)
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        panels.forEach((panel) => {
          if (panel.open || panel.hasAttribute('open')) {
            closePanel(panel);
          }
        });
      }
    });
  }

  // ---------- Phone reveal ----------
  function bindPhoneReveal() {
    const btn = document.getElementById('revealPhone');
    const box = document.getElementById('phoneBox');
    if (!btn || !box) return;
    btn.addEventListener('click', () => {
      const open = !box.hasAttribute('hidden');
      if (open) {
        box.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Telefonnummer zeigen';
      } else {
        box.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Nummer verbergen';
      }
    });
  }

  // ---------- Form validation ----------
  function bindForm() {
    const form = document.getElementById('contactForm');
    const msg = document.getElementById('formMsg');
    if (!form || !msg) return;

    form.addEventListener('submit', (ev) => {
      msg.className = 'form-msg';
      msg.textContent = '';

      // Honeypot
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        ev.preventDefault();
        return;
      }

      const vorname = form.querySelector('input[name="vorname"]');
      const email = form.querySelector('input[name="email"]');
      const consent = form.querySelector('input[name="consent"]');

      let valid = true;
      [vorname, email, consent].forEach((f) => f && f.removeAttribute('aria-invalid'));

      if (!vorname || !vorname.value.trim() || vorname.value.trim().length < 2) {
        vorname && vorname.setAttribute('aria-invalid', 'true');
        valid = false;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email && email.setAttribute('aria-invalid', 'true');
        valid = false;
      }
      if (!consent || !consent.checked) {
        valid = false;
      }

      if (!valid) {
        ev.preventDefault();
        msg.classList.add('err');
        msg.textContent = 'Bitte Vorname, E-Mail und Einverständnis prüfen.';
        return;
      }

      msg.classList.add('ok');
      msg.textContent = 'Wird gesendet …';
      // Native form submission proceeds.
    });
  }

  // ---------- Initial ----------
  function init() {
    bindTriggers();
    bindPanelControls();
    bindPhoneReveal();
    bindForm();

    // Log VT support in DevTools for debugging pitch
    if (supportsVT) {
      console.info('[v32-rooms] View Transitions API aktiv.');
    } else if (prefersReduced) {
      console.info('[v32-rooms] Reduced motion — Transitions deaktiviert.');
    } else {
      console.info('[v32-rooms] View Transitions API nicht verfügbar — Fallback auf <dialog>.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
