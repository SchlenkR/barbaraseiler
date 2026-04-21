(() => {
  const hero = document.getElementById('hero');
  const header = document.getElementById('siteHeader');
  if (!hero) return;

  let ticking = false;

  const update = () => {
    const vh = window.innerHeight;
    const y = window.scrollY;
    // Fade the hero out over the first 100vh of scroll
    const progress = Math.min(y / vh, 1);
    hero.style.opacity = String(1 - progress);

    // When hero is faded out enough, disable its pointer events
    hero.style.pointerEvents = progress >= 1 ? 'none' : 'auto';

    // Reveal the sticky header once we've scrolled past the hero's halfway point
    if (header) {
      if (progress > 0.6) header.classList.add('visible');
      else header.classList.remove('visible');
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', update);
  update();
})();
