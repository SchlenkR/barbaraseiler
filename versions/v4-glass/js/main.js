/* v4-glass — minimal interactivity.
   Phone reveal via canvas (spam resistance) + smooth-scroll anchor polish. */

(() => {
  // --- Phone reveal as canvas image ---
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneContainer = document.getElementById('phoneReveal');
  if (phoneBtn && phoneContainer) {
    phoneBtn.addEventListener('click', () => {
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
      ctx.fillStyle = '#1a1528';
      ctx.font = '500 22px "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, 0, height / 2 + 1);

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

  // --- Parallax aurora on scroll (cheap, reduced-motion aware) ---
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    const aurora = document.querySelector('.aurora');
    if (aurora) {
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const y = window.scrollY;
            aurora.style.transform = `translate3d(0, ${y * -0.08}px, 0)`;
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  // --- Header hide-on-scroll-down, show on up ---
  const header = document.querySelector('.site-header');
  if (header) {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 80 && y > lastY) {
        header.style.transform = 'translateX(-50%) translateY(-120%)';
      } else {
        header.style.transform = 'translateX(-50%) translateY(0)';
      }
      lastY = y;
    }, { passive: true });
  }
})();
