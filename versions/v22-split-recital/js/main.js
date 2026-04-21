// v22-split-recital
// Scroll-scrubbed split-screen film sync via GSAP ScrollTrigger.
// Top film runs 1.0x scroll-speed; bottom runs 0.85x → gradual desync,
// with forced re-alignment moments at 0%, 50% where captions appear.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile  = window.matchMedia('(max-width: 720px)').matches;

// ---------- Phone reveal (spam-shield pattern) ----------
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    // Dummy number per DESIGNER_BRIEF — replaced pre-launch.
    const n = ['+49', '(0)555', '123', '456', '7'].join(' ');
    phoneBtn.textContent = n;
    phoneBtn.classList.add('revealed');
    phoneBtn.setAttribute('role', 'text');
  });
}

// ---------- Reduced motion / mobile short-circuit ----------
if (reduced || mobile || !window.gsap || !window.ScrollTrigger) {
  // Static split fallback: no scrub, no pans.
  // Captions-static is already shown via CSS in reduced-motion;
  // on plain mobile we let CSS handle the stacked caption flow.
  if (mobile) {
    // Cross-fade captions on simple interval (soft ambient only)
    const caps = document.querySelectorAll('.caption');
    if (caps.length && !reduced) {
      let i = 0;
      caps.forEach((c, k) => { c.style.opacity = k === 0 ? '1' : '0'; c.style.position = 'absolute'; });
      setInterval(() => {
        caps[i].style.opacity = '0';
        i = (i + 1) % caps.length;
        caps[i].style.opacity = '1';
      }, 3200);
    }
  }
} else {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  const top    = document.querySelector('.film--top .film-gradient');
  const bottom = document.querySelector('.film--bottom .film-gradient');
  const caps   = document.querySelectorAll('.caption');
  const driver = document.getElementById('scroll-driver');

  // Pre-set caption 0 visible at the top.
  if (caps[0]) caps[0].style.opacity = '1';

  // --- Main scrub timeline ---
  // Driver is 300vh tall and sits beneath the hero (via negative margin).
  // ScrollTrigger scrubs both films in parallel at *different* rates so
  // they gradually desync, then "realign" at 50% (caption 2) and
  // re-separate through the last quarter.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: driver,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6
    }
  });

  // Top film: full-range pan (1.0x).
  tl.fromTo(top,
    { xPercent: 0, yPercent: 0 },
    { xPercent: -14, yPercent: -6, ease: 'none' },
    0
  );

  // Bottom film: shorter pan (0.85x), opposite direction → desync.
  tl.fromTo(bottom,
    { xPercent: 0, yPercent: 0 },
    { xPercent: 11.9, yPercent: 5.1, ease: 'none' }, // 14 * 0.85
    0
  );

  // Caption fades at 0, 25, 50, 75 of the driver.
  const showCap = (i, atProgress) => {
    const trigger = ST.create({
      trigger: driver,
      start: `top+=${atProgress * 300}vh top`,
      end:   `top+=${(atProgress * 300) + 40}vh top`,
      onEnter:     () => fade(i, 1),
      onLeave:     () => fade(i, 0),
      onEnterBack: () => fade(i, 1),
      onLeaveBack: () => fade(i, 0)
    });
    return trigger;
  };

  const fade = (i, to) => {
    if (!caps[i]) return;
    gsap.to(caps[i], { opacity: to, y: to ? 0 : 8, duration: 0.5, overwrite: true });
  };

  // Hide caption 0 once past 5%, then drive 1/2/3 on their bands.
  ST.create({
    trigger: driver, start: 'top top', end: 'top+=15vh top',
    onLeave: () => fade(0, 0), onEnterBack: () => fade(0, 1)
  });
  showCap(1, 0.25);
  showCap(2, 0.50);
  showCap(3, 0.75);

  // Realign moment at 50%: briefly equalize both films' pan rates.
  // We do this by layering a small "pull-back" tween on the bottom film
  // so it catches up to the top around 45–55%.
  gsap.to(bottom, {
    xPercent: '-=2.1',
    yPercent: '-=0.9',
    ease: 'sine.inOut',
    scrollTrigger: {
      trigger: driver,
      start: 'top+=135vh top',
      end:   'top+=165vh top',
      scrub: 0.4
    }
  });
}
