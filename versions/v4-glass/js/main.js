/* v4-glass — minimal interactivity.
   Phone reveal via canvas (spam resistance) + smooth-scroll anchor polish. */

(() => {
  // --- Phone reveal as canvas image ---
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneContainer = document.getElementById('phoneReveal');
  if (phoneBtn && phoneContainer) {
    phoneBtn.addEventListener('click', () => {
      const parts = ['+49', ' (0)', '555', ' – ', '123', ' 456', ' 7'];
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

  // --- Header hide-on-scroll-down, show on up (hysteresis) ---
  const header = document.querySelector('.site-header');
  if (header) {
    const SHOW_THRESHOLD = 8;
    const HIDE_THRESHOLD = 14;
    const TOP_GUARD = 80;
    let lastY = window.scrollY;
    let accUp = 0;
    let accDown = 0;
    let hidden = false;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < TOP_GUARD) {
        if (hidden) {
          header.style.transform = 'translateX(-50%) translateY(0)';
          hidden = false;
        }
        accUp = accDown = 0;
        lastY = y;
        return;
      }
      const dy = y - lastY;
      if (dy > 0) { accDown += dy; accUp = 0; }
      else if (dy < 0) { accUp += -dy; accDown = 0; }

      if (!hidden && accDown > HIDE_THRESHOLD) {
        header.style.transform = 'translateX(-50%) translateY(-120%)';
        hidden = true; accDown = 0;
      } else if (hidden && accUp > SHOW_THRESHOLD) {
        header.style.transform = 'translateX(-50%) translateY(0)';
        hidden = false; accUp = 0;
      }
      lastY = y;
    }, { passive: true });
  }
})();
