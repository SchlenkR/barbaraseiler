// v10 — Das Gespräch
// Minimal JS: reveal-on-scroll stagger for dialog turns + phone reveal.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fade-in stagger for each dialog turn
if (!reduced && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.turn, .pause, .attachment');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // small cumulative delay within batch for the stagger effect
        const delay = Math.min(i * 60, 240);
        setTimeout(() => entry.target.classList.add('in'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => io.observe(el));
} else {
  // reveal immediately
  document.querySelectorAll('.turn, .pause, .attachment').forEach((el) => el.classList.add('in'));
}

// Phone reveal (spam protection pattern)
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const parent = phoneBtn.parentElement;
    const num = '+49 179 371 370 6';
    const href = 'tel:+491793713706';
    parent.innerHTML = `<p>Lieber anrufen?</p><a href="${href}" class="phone-btn">${num}</a>`;
  });
}
