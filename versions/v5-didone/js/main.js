/* ============================================================
   Barbara Sophia Sailer — v5-didone
   Minimal, patient interactions. Luxury sites should feel calm.
   ============================================================ */

(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Reveal-on-scroll (slow fade + rise) ----------
  const revealItems = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(el => io.observe(el));
  }

  // ---------- 2. Masthead visibility after first viewport ----------
  const mast = document.getElementById('masthead');
  if (mast) {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      // Reveal masthead after scrolling ~50% of viewport height
      const threshold = window.innerHeight * 0.5;
      mast.classList.toggle('is-visible', y > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------- 3. Phone-number reveal (spam-obfuscation) ----------
  const btn = document.getElementById('phoneRevealBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      // Reconstruct number at click time
      const parts = ['+49', '(0)555', '371', '370', '6'];
      const number = parts.join(' ');
      const wrap = document.getElementById('phoneReveal');
      if (!wrap) return;
      btn.remove();
      const a = document.createElement('a');
      a.href = 'tel:+495551234567';
      a.className = 'phone-number';
      a.textContent = number;
      wrap.appendChild(a);
    });
  }

  // ---------- 4. Form: graceful submission feedback ----------
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', () => {
      const send = form.querySelector('.btn-send span:first-child');
      if (send) send.textContent = 'Wird gesendet …';
    });
  }
})();
