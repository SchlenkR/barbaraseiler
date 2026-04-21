// v9 — „Was du mitnimmst"
// Minimal, precise. Respects prefers-reduced-motion.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Feature detect CSS view-timeline. If unsupported, fall back to IntersectionObserver.
const supportsViewTimeline = CSS.supports('animation-timeline: view()');

if (!supportsViewTimeline) {
  document.documentElement.classList.add('no-view-timeline');

  if (!prefersReducedMotion) {
    const items = document.querySelectorAll('.outcome');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

    items.forEach((el) => io.observe(el));
  } else {
    // Reduced motion: just show them.
    document.querySelectorAll('.outcome').forEach((el) => el.classList.add('is-visible'));
  }
}

// Phone reveal — spam-safe, no number in source.
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  const parts = ['+49', '179', '371', '370', '6'];
  let revealed = false;
  phoneBtn.addEventListener('click', () => {
    if (revealed) return;
    const tel = parts.join(' ');
    phoneBtn.classList.add('is-revealed');
    phoneBtn.innerHTML = '';
    const a = document.createElement('a');
    a.href = 'tel:' + parts.join('');
    a.textContent = tel;
    a.style.textDecoration = 'none';
    a.style.color = 'inherit';
    phoneBtn.appendChild(a);
    // Swap button to link semantics by stopping further clicks from firing listeners.
    revealed = true;
  });
}
