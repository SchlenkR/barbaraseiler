// Barbara Sailer — v10-letter
// Minimal: fade-in per letter on scroll + phone reveal.

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Letter fade-in
const letters = document.querySelectorAll('.letter');
if (prefersReduced || !('IntersectionObserver' in window)) {
  letters.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );
  letters.forEach((el) => io.observe(el));
}

// Phone reveal
const phoneBtn = document.getElementById('phoneBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const number = '+49 179 371 370 6';
    const a = document.createElement('a');
    a.className = 'phone-number';
    a.href = 'tel:+491793713706';
    a.textContent = number;
    phoneBtn.replaceWith(a);
  });
}
