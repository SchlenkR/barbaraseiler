(() => {
  const { gsap } = window;
  if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  if (!gsap) return;

  // --- Split lines into spans for stagger ---
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.innerHTML = text.split('').map((ch) =>
      ch === ' ' ? ' ' : `<span class="ch" style="display:inline-block;will-change:transform">${ch}</span>`
    ).join('');
  });

  // Hero title entrance
  gsap.from('.hero-title .ch', {
    yPercent: 110,
    rotate: 8,
    duration: 1.1,
    ease: 'expo.out',
    stagger: { each: 0.02, from: 'start' },
    delay: 0.15
  });
  gsap.from('.hero-kicker, .hero-sub p, .hero-sub .btn-lnk, .hero-scroll', {
    opacity: 0, y: 20, duration: 0.9, delay: 0.8, stagger: 0.1, ease: 'power2.out'
  });

  // Footer mega
  gsap.from('.foot-mega .ch', {
    scrollTrigger: { trigger: '.foot-mega', start: 'top 85%' },
    yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.015
  });

  // Reveals on scroll
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out'
    });
  });

  // Chapter numbers parallax
  gsap.utils.toArray('.chapter-num').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      },
      yPercent: 40
    });
  });

  // Blob morph
  const blob = document.getElementById('blobPath');
  if (blob) {
    const paths = [
      'M300,100 Q460,160 480,320 Q500,480 320,500 Q140,520 120,340 Q100,160 300,100 Z',
      'M280,80 Q480,180 500,340 Q490,500 300,520 Q120,500 110,320 Q110,140 280,80 Z',
      'M320,90 Q470,170 490,330 Q520,490 300,500 Q150,520 130,330 Q120,150 320,90 Z'
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % paths.length;
      gsap.to(blob, { attr: { d: paths[i] }, duration: 4, ease: 'sine.inOut' });
    }, 4500);

    gsap.to('.blob-bg', {
      scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 },
      rotation: 60,
      x: '10vw',
      y: '20vh'
    });
  }

  // Banner scroll-velocity
  const bannerTrack = document.querySelector('.banner-track');
  if (bannerTrack && window.ScrollTrigger) {
    let baseSpeed = -0.5;
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        const velocity = self.getVelocity() / 600;
        gsap.to(bannerTrack, { x: `+=${baseSpeed * 6 + velocity * 2}`, duration: 0.4, ease: 'power2.out' });
      }
    });
  }

  // --- Phone reveal (from v3) ---
  const phoneBtn = document.getElementById('phoneRevealBtn');
  const phoneContainer = document.getElementById('phoneReveal');
  if (phoneBtn && phoneContainer) {
    phoneBtn.addEventListener('click', () => {
      const parts = ['+49', ' (0)', '555', ' – ', '123', ' 456', ' 7'];
      const number = parts.join('');
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      const w = 280, h = 44;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.style.marginTop = '14px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#1a1713';
      ctx.font = '600 20px "Fraunces", Georgia, serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(number, 0, h / 2 + 1);
      canvas.title = 'Klick zum Kopieren';
      canvas.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(number);
          canvas.title = 'Kopiert';
        } catch (_) {}
      });
      phoneBtn.remove();
      phoneContainer.appendChild(canvas);
    }, { once: true });
  }
})();
