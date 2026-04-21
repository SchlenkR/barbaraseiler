// v9-outcomes — minimal JS
// - IntersectionObserver for tile fade-in-stagger (respects reduced-motion)
// - Phone reveal button

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tile fade-in stagger on scroll
const tiles = document.querySelectorAll('.tile');
if (tiles.length && !reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  tiles.forEach((t) => observer.observe(t));
} else {
  // Reduced motion or no IO — show tiles immediately
  tiles.forEach((t) => t.classList.add('in-view'));
}

// Phone reveal — basic obfuscation against trivial scrapers
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const parts = ['+49', '179', '371', '370', '6'];
    const number = parts.join(' ');
    const href = 'tel:+491793713706';
    const link = document.createElement('a');
    link.href = href;
    link.textContent = number;
    link.className = 'phone-number';
    phoneBtn.replaceWith(link);
  });
}
