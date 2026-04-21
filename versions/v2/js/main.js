(() => {
  const hero = document.getElementById('hero');
  const header = document.getElementById('siteHeader');

  // --- Hero fade on scroll ---
  if (hero) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const progress = Math.min(y / vh, 1);
      hero.style.opacity = String(1 - progress);
      hero.style.pointerEvents = progress >= 1 ? 'none' : 'auto';

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
  }

  // --- Phone reveal as canvas image (invisible to non-vision crawlers) ---
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneContainer = document.getElementById('phoneReveal');
  if (phoneBtn && phoneContainer) {
    phoneBtn.addEventListener('click', () => {
      // Fragmented so the full number never appears literally in source
      const parts = ['+49', ' (0)', '179', ' – ', '371', ' 370', ' 6'];
      const number = parts.join('');

      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      const width = 280;
      const height = 44;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Telefonnummer');

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = '500 22px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, 0, height / 2 + 1);

      // Copy-to-clipboard on click
      canvas.title = 'Klick zum Kopieren';
      canvas.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(number);
          canvas.title = 'In Zwischenablage kopiert';
        } catch (_) { /* no-op */ }
      });

      phoneBtn.remove();
      phoneContainer.appendChild(canvas);
    }, { once: true });
  }
})();
