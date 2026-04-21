/* ============================================================
   v5-lenis · Smooth-scroll cinematic choreography
   Lenis drives scroll. GSAP ScrollTrigger choreographs reveals.
   Respects prefers-reduced-motion.
   ============================================================ */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const LenisCtor = window.Lenis || (window.lenis && window.lenis.default);

  if (hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // --------------------------------------------------------
  // 1. Lenis smooth-scroll
  // --------------------------------------------------------
  let lenis = null;

  if (!prefersReduced && LenisCtor) {
    try {
      lenis = new LenisCtor({
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.4,
      });

      // Drive Lenis from RAF and let ScrollTrigger read from it
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      if (hasScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
      }

      // Anchor links route through Lenis for smooth jumps
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          const id = link.getAttribute('href');
          if (!id || id === '#') return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { offset: -20, duration: 1.4 });
        });
      });
    } catch (err) {
      console.warn('Lenis init failed:', err);
      lenis = null;
    }
  }

  // --------------------------------------------------------
  // 2. Progress bar
  // --------------------------------------------------------
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const setProgress = () => {
      const doc = document.documentElement;
      const h = doc.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      progressBar.style.width = (p * 100) + '%';
    };
    if (lenis) {
      lenis.on('scroll', setProgress);
    } else {
      window.addEventListener('scroll', setProgress, { passive: true });
    }
    setProgress();
  }

  // --------------------------------------------------------
  // 3. Nav hide-on-scroll-down
  //    Hysteresis + accumulated delta so Lenis subpixel scrolls
  //    don't flip the class every frame and fight the transition.
  // --------------------------------------------------------
  const nav = document.getElementById('nav');
  if (nav) {
    const SHOW_THRESHOLD = 8;   // px of upward travel before show
    const HIDE_THRESHOLD = 14;  // px of downward travel before hide
    const TOP_GUARD = 120;
    let lastY = window.scrollY;
    let accUp = 0;
    let accDown = 0;
    let hidden = false;

    const handle = (y) => {
      if (y < TOP_GUARD) {
        if (hidden) { nav.classList.remove('is-hidden'); hidden = false; }
        accUp = accDown = 0;
        lastY = y;
        return;
      }
      const dy = y - lastY;
      if (dy > 0) { accDown += dy; accUp = 0; }
      else if (dy < 0) { accUp += -dy; accDown = 0; }

      if (!hidden && accDown > HIDE_THRESHOLD) {
        nav.classList.add('is-hidden'); hidden = true; accDown = 0;
      } else if (hidden && accUp > SHOW_THRESHOLD) {
        nav.classList.remove('is-hidden'); hidden = false; accUp = 0;
      }
      lastY = y;
    };

    if (lenis) {
      lenis.on('scroll', (e) => handle(e.scroll));
    } else {
      window.addEventListener('scroll', () => handle(window.scrollY), { passive: true });
    }
  }

  // --------------------------------------------------------
  // 4. GSAP choreography
  // --------------------------------------------------------
  if (hasScrollTrigger && !prefersReduced) {

    // Hero title lines slide up on load
    gsap.to('.reveal-line > span', {
      y: '0%',
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.12,
      delay: 0.15,
    });

    // Hero background parallax — each layer drifts at its own speed
    gsap.utils.toArray('.hero-layer').forEach(layer => {
      const speed = parseFloat(layer.dataset.parallax || '0.1');
      gsap.to(layer, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    // Hero arcs drift slowly too
    gsap.to('.hero-arcs', {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Hero content fades as you scroll past
    gsap.to('.hero-inner', {
      opacity: 0,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom center',
        scrub: true,
      },
    });

    // Prolog — word-by-word highlight
    const prologLine = document.querySelector('.prolog-line[data-split]');
    if (prologLine) {
      const text = prologLine.textContent.trim();
      prologLine.textContent = '';
      const frag = document.createDocumentFragment();
      text.split(/\s+/).forEach(w => {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = w + ' ';
        frag.appendChild(span);
      });
      prologLine.appendChild(frag);

      gsap.utils.toArray('.prolog-line .word').forEach((word, i, arr) => {
        ScrollTrigger.create({
          trigger: prologLine,
          start: `top+=${(i / arr.length) * 60}% 70%`,
          end: `top+=${((i + 1) / arr.length) * 60}% 40%`,
          onEnter: () => word.classList.add('is-lit'),
          onLeaveBack: () => word.classList.remove('is-lit'),
        });
      });
    }

    // Split pull quote letters for small flourish
    const pullSplit = document.querySelector('.pull-quote [data-split]');
    if (pullSplit) {
      const chars = pullSplit.textContent.split('');
      pullSplit.textContent = '';
      chars.forEach(c => {
        const s = document.createElement('span');
        s.textContent = c;
        s.style.display = 'inline-block';
        s.style.opacity = '0.15';
        pullSplit.appendChild(s);
      });
      gsap.to('.pull-quote [data-split] span', {
        opacity: 1,
        stagger: 0.02,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.pull-quote',
          start: 'top 75%',
          end: 'bottom 40%',
          scrub: 0.5,
        },
      });
    }

    // Generic reveals for scene-titles, ledes, eyebrows, stanzas, prices
    const revealTargets = [
      '.scene-eyebrow',
      '.scene-title',
      '.lede',
      '.stanza',
      '.pull-quote',
      '.whisper',
      '.obj-item',
      '.price-row',
      '.wege-head',
      '.preise-footnote',
      '.ledger',
      '.ort-meta',
      '.inline-cta',
      '.q',
      '.btn-whatsapp',
      '.form',
      '.phone-reveal',
      '.divider',
    ];
    revealTargets.forEach(sel => {
      gsap.utils.toArray(sel).forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    });

    // Parallax drift for sticky visual panels
    gsap.utils.toArray('[data-parallax-inner]').forEach(el => {
      gsap.fromTo(el,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });

    // --------------------------------------------------------
    // 5. Horizontal scroll — "Wege"
    // --------------------------------------------------------
    const wegeSection = document.querySelector('.wege');
    const wegeTrack = document.getElementById('wegeTrack');
    const wegeWrap = document.getElementById('wegeTrackWrap');

    if (wegeSection && wegeTrack && wegeWrap) {
      // Only enable horizontal scroll when there's meaningful overflow (i.e. desktop)
      const enableHorizontal = () => {
        const trackW = wegeTrack.scrollWidth;
        const viewW = window.innerWidth;
        return trackW > viewW + 40;
      };

      ScrollTrigger.matchMedia({
        '(min-width: 900px)': function () {
          if (!enableHorizontal()) return;

          const distance = () => wegeTrack.scrollWidth - window.innerWidth + 36;

          const tween = gsap.to(wegeTrack, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: wegeSection,
              start: 'top top',
              end: () => '+=' + distance(),
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });

          return () => { tween.kill(); };
        },
      });
    }

    // Refresh after fonts load (prevents mis-measured distances)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  } else {
    // Reduced-motion fallback: show everything immediately
    document.querySelectorAll('.reveal-line > span').forEach(s => s.style.transform = 'translateY(0)');
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    const prologLine = document.querySelector('.prolog-line');
    if (prologLine) prologLine.querySelectorAll('.word, span').forEach(s => s.style.opacity = '1');
  }

  // --------------------------------------------------------
  // 6. Phone reveal (canvas, spam-hardened)
  // --------------------------------------------------------
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
      ctx.fillStyle = '#e8b775';
      ctx.font = '500 22px Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
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
})();
