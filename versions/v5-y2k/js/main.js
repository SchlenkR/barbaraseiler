(() => {
  // --- Sparkle cursor trail ---
  const canvas = document.getElementById('sparkles');
  if (canvas && matchMedia('(pointer:fine)').matches) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    const particles = [];
    const palette = ['#ff7eb9', '#b794ff', '#7cc6ff', '#9fffcb', '#fff59d'];

    addEventListener('mousemove', (e) => {
      if (Math.random() < 0.5) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8 - 0.2,
          size: Math.random() * 4 + 2,
          life: 1,
          color: palette[(Math.random() * palette.length) | 0],
          rot: Math.random() * Math.PI
        });
      }
    });

    const drawStar = (x, y, r, color, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        const a2 = a + Math.PI / 5;
        ctx.lineTo(x + Math.cos(a2) * r * 0.45, y + Math.sin(a2) * r * 0.45);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.015;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        drawStar(p.x, p.y, p.size, p.color, p.life);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  // --- Phone reveal ---
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneContainer = document.getElementById('phoneReveal');
  if (phoneBtn && phoneContainer) {
    phoneBtn.addEventListener('click', () => {
      const parts = ['+49', ' (0)', '555', ' – ', '123', ' 456', ' 7'];
      const number = parts.join('');
      const c = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      const w = 280, h = 44;
      c.width = w * dpr; c.height = h * dpr;
      c.style.width = w + 'px'; c.style.height = h + 'px';
      c.style.marginTop = '14px';
      const ctx2 = c.getContext('2d');
      ctx2.scale(dpr, dpr);
      const grad = ctx2.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#ff7eb9');
      grad.addColorStop(0.5, '#b794ff');
      grad.addColorStop(1, '#7cc6ff');
      ctx2.fillStyle = grad;
      ctx2.font = 'italic 600 22px "Instrument Serif", serif';
      ctx2.textBaseline = 'middle';
      ctx2.fillText(number, 0, h / 2 + 1);
      c.title = 'Klick zum Kopieren';
      c.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(number); c.title = 'Kopiert ✨'; } catch (_) {}
      });
      phoneBtn.remove();
      phoneContainer.appendChild(c);
    }, { once: true });
  }
})();
