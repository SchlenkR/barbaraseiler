// v7-split — minimal, no scroll-hijack
// 1) IntersectionObserver fallback fade-in for the left content column
// 2) Phone reveal on click

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsViewTimeline = CSS.supports('animation-timeline: view()');

// --- Reveal on scroll ---
if (!prefersReducedMotion && !supportsViewTimeline) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} else {
  // Reduced motion or modern scroll-driven animations: just show
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

// --- Phone reveal ---
const phoneBtn = document.getElementById('phoneRevealBtn');
const phoneNum = document.getElementById('phoneNum');
if (phoneBtn && phoneNum) {
  phoneBtn.addEventListener('click', () => {
    phoneNum.hidden = false;
    phoneBtn.hidden = true;
  });
}

// --- Mobile CTA: hide once user reaches the form ---
const mobileCta = document.getElementById('mobileCta');
const rightCol = document.querySelector('.split-right');
if (mobileCta && rightCol && 'IntersectionObserver' in window) {
  const ctaObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          mobileCta.style.opacity = '0';
          mobileCta.style.pointerEvents = 'none';
          mobileCta.style.transition = 'opacity 0.3s ease';
        } else {
          mobileCta.style.opacity = '';
          mobileCta.style.pointerEvents = '';
        }
      });
    },
    { threshold: 0.1 }
  );
  // Only engage on mobile (where right column stacks inline)
  const mq = window.matchMedia('(max-width: 999px)');
  if (mq.matches) ctaObs.observe(rightCol);
}
