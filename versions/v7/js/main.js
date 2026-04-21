// Barbara Sailer v7 — Probestunde zuerst
// Minimal JS: phone reveal + reveal fallback for browsers without animation-timeline

// --- Phone reveal (spam protection pattern)
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const local = '179 371 370 6';
    const full = '+49 ' + local;
    const sub = document.getElementById('phoneSub');
    if (sub) {
      sub.innerHTML = `<a href="tel:+491793713706" style="color:var(--cognac);font-weight:600;text-decoration:none;">${full}</a>`;
    }
  });
}

// --- Reveal-on-scroll fallback (for browsers that don't support animation-timeline: view())
const supportsViewTimeline = CSS.supports('animation-timeline: view()');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!supportsViewTimeline && !prefersReducedMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else if (prefersReducedMotion || supportsViewTimeline) {
  // If reduced motion or native view-timeline, make sure nothing stays hidden from the fallback
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// --- Smoothly update hero CTA target if form anchors
// (native smooth-scroll via CSS handles the rest; no scroll-hijack)
