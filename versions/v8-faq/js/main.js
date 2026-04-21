// v8-faq — minimal interactions
// <details>/<summary> handles accordion natively.
// We only handle: phone reveal, and optional close-others behavior on open.

// Phone reveal (spam protection)
const phoneBtn = document.getElementById('phoneBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = 'tel:+491793713706';
    a.className = 'inline-link';
    a.textContent = '+49 179 371 370 6';
    phoneBtn.replaceWith(a);
  });
}

// Inline "Ich will's probieren →" links scroll smoothly;
// CSS handles scroll-behavior. Ensure the details stays open if user
// returned via back-nav (no action needed — native <details> preserves state in session).

// Nice-to-have: when an inline link is clicked, don't close the currently-open details.
// No code required — anchor navigation doesn't collapse <details>.

// Respect reduced motion for anchor scroll (redundant to CSS but defensive).
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReduced) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}
