/**
 * v19 · Methode Horizontal
 *
 * Approach:
 *  - The page is a normal vertical editorial layout EXCEPT the `.methode`
 *    section, which is pinned and translates horizontally as the user
 *    scrolls vertically (GSAP ScrollTrigger, classic `containerAnimation`
 *    setup: one pin-timeline on the track, per-spread sub-triggers
 *    that use `containerAnimation` to fire on horizontal position).
 *  - Each spread has its own SVG diagram. Diagrams use the `stroke-dashoffset`
 *    reveal pattern (poor-person's drawSVG). A dedicated timeline per spread
 *    animates stroke reveal, and for spreads #1/#2/#4/#5 also runs a small
 *    continuous loop (breath morph, pitch dot, vowel morph, resonance rings).
 *  - Mobile (<768px) and prefers-reduced-motion: no pin, no scrub. The CSS
 *    fallback stacks the 5 spreads vertically and reveals all SVG strokes
 *    statically. We also skip all GSAP setup in those cases.
 */

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMobile = () => window.innerWidth < 768;
const methodeEl = document.querySelector('.methode');
const trackEl = document.querySelector('.methode-track');
const spreads = Array.from(document.querySelectorAll('.spread'));
const progressCurrent = document.querySelector('.methode-progress .pg-current');

/* --------------------------------------------------------------- */
/* Utility: set dasharray based on measured path length             */
/* --------------------------------------------------------------- */
function primeStrokes(root = document) {
  const nodes = root.querySelectorAll('.diagram path, .diagram circle, .diagram ellipse');
  nodes.forEach((n) => {
    // Only prime shapes that we've marked as animated via the class list.
    const animated = n.classList.contains('atem-curve') ||
                     n.classList.contains('ton-contour') ||
                     n.classList.contains('stuetze-ribs') ||
                     n.classList.contains('stuetze-diaphragm') ||
                     n.classList.contains('stuetze-abdomen') ||
                     n.classList.contains('ring') ||
                     n.classList.contains('vokal') ||
                     n.closest('.reso-figure');
    if (!animated) return;
    let len = 0;
    try { len = n.getTotalLength ? n.getTotalLength() : 0; } catch (e) { len = 0; }
    if (!len || !isFinite(len)) len = 600;
    n.style.strokeDasharray = String(len);
    n.style.strokeDashoffset = String(len);
    n.dataset.len = String(len);
  });
}

/* --------------------------------------------------------------- */
/* Mobile / reduced-motion path: stack vertically, show everything  */
/* --------------------------------------------------------------- */
function enableFallback() {
  methodeEl?.classList.add('no-horizontal');
  document.querySelectorAll('.diagram path, .diagram circle, .diagram ellipse')
    .forEach((n) => {
      n.style.strokeDasharray = 'none';
      n.style.strokeDashoffset = '0';
      if (n.classList.contains('vokal')) n.style.opacity = '1';
    });
  document.querySelectorAll('.vokal-letters .vl').forEach((t) => t.classList.add('active'));
}

/* --------------------------------------------------------------- */
/* Horizontal pin + per-spread reveals                              */
/* --------------------------------------------------------------- */
function setupHorizontal() {
  if (!window.gsap || !window.ScrollTrigger) {
    enableFallback();
    return;
  }
  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  primeStrokes();

  const distance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);

  // Master horizontal animation.
  const horizontalTween = gsap.to(trackEl, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: methodeEl,
      pin: true,
      scrub: 0.5,
      end: () => '+=' + distance(),
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });

  // Per-spread sub-triggers using the horizontal container animation.
  spreads.forEach((spread, i) => {
    const idx = i + 1;

    // Draw-stroke reveal on enter
    window.ScrollTrigger.create({
      trigger: spread,
      containerAnimation: horizontalTween,
      start: 'left 80%',
      end: 'right 20%',
      onEnter: () => playSpread(idx, spread),
      onEnterBack: () => playSpread(idx, spread),
      onToggle: (self) => {
        if (self.isActive && progressCurrent) {
          progressCurrent.textContent = String(idx).padStart(2, '0');
        }
      },
    });
  });

  // On resize, re-prime stroke lengths (paths rescale with viewport font-size,
  // but lengths stay stable since viewBox is fixed — still safer to refresh).
  window.addEventListener('resize', () => {
    window.ScrollTrigger.refresh();
  });
}

/* --------------------------------------------------------------- */
/* Per-spread micro-animations                                      */
/* --------------------------------------------------------------- */
const looping = new Set();

function playSpread(idx, spreadEl) {
  const { gsap } = window;
  // Always reveal strokes in this spread
  spreadEl.querySelectorAll('.diagram path, .diagram circle, .diagram ellipse').forEach((n) => {
    const len = Number(n.dataset.len) || 0;
    if (!len) return;
    gsap.to(n, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' });
  });

  if (looping.has(idx)) return;
  looping.add(idx);

  if (idx === 1) animateAtem(spreadEl);
  else if (idx === 2) animateTon(spreadEl);
  else if (idx === 3) animateStuetze(spreadEl);
  else if (idx === 4) animateVokale(spreadEl);
  else if (idx === 5) animateResonanz(spreadEl);
}

function animateAtem(root) {
  const { gsap } = window;
  const curve = root.querySelector('.atem-curve');
  const dot = root.querySelector('.atem-dot');
  if (!curve) return;
  // Morph curve between "inhale" (peak up) and "exhale" (peak down)
  const inhale = 'M 40 200 Q 200 100 400 200 T 760 200';
  const exhale = 'M 40 200 Q 200 300 400 200 T 760 200';
  gsap.set(curve, { attr: { d: inhale } });
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut', duration: 2.2 } });
  tl.to(curve, { attr: { d: exhale } })
    .to(curve, { attr: { d: inhale } });
  if (dot) {
    gsap.to(dot, {
      attr: { cx: 760 },
      duration: 4.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }
}

function animateTon(root) {
  const { gsap } = window;
  const path = root.querySelector('.ton-contour');
  const dot = root.querySelector('.ton-dot');
  if (!path || !dot) return;
  // Animate a dot along the pitch contour via getPointAtLength sampling.
  const len = path.getTotalLength();
  const obj = { t: 0 };
  gsap.to(obj, {
    t: 1,
    duration: 3.8,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
    onUpdate: () => {
      const p = path.getPointAtLength(obj.t * len);
      dot.setAttribute('cx', p.x.toFixed(1));
      dot.setAttribute('cy', p.y.toFixed(1));
    },
  });
}

function animateStuetze(root) {
  const { gsap } = window;
  const diaphragm = root.querySelector('.stuetze-diaphragm');
  const ribs = root.querySelector('.stuetze-ribs');
  const abdomen = root.querySelector('.stuetze-abdomen');
  if (!diaphragm || !ribs) return;

  // Ribcage expands, diaphragm arch flattens (inhale) and releases (exhale).
  const ribsIn  = 'M 325 135 Q 400 110 475 135 L 475 232 Q 400 252 325 232 Z';
  const ribsOut = 'M 330 140 Q 400 120 470 140 L 470 230 Q 400 250 330 230 Z';
  const diaIn   = 'M 330 240 Q 400 225 470 240';
  const diaOut  = 'M 330 225 Q 400 200 470 225';
  const abIn    = 'M 335 240 Q 400 290 465 240 L 465 310 Q 400 340 335 310 Z';
  const abOut   = 'M 335 230 Q 400 280 465 230 L 465 310 Q 400 340 335 310 Z';

  const tl = gsap.timeline({ repeat: -1, defaults: { duration: 2.4, ease: 'sine.inOut' } });
  tl.to(ribs, { attr: { d: ribsIn } }, 0)
    .to(diaphragm, { attr: { d: diaIn } }, 0)
    .to(abdomen, { attr: { d: abIn } }, 0)
    .to(ribs, { attr: { d: ribsOut } }, 2.4)
    .to(diaphragm, { attr: { d: diaOut } }, 2.4)
    .to(abdomen, { attr: { d: abOut } }, 2.4);
}

function animateVokale(root) {
  const { gsap } = window;
  const order = ['a', 'e', 'i', 'o', 'u'];
  const shapes = order.map((v) => root.querySelector('.v-' + v));
  const letters = order.map((v) => root.querySelector('.vl-' + v));
  if (!shapes[0]) return;

  // Ensure all shapes have dashoffset 0 (strokes fully drawn) for morph.
  shapes.forEach((s) => { if (s) s.style.strokeDashoffset = '0'; });

  let current = 0;
  const tick = () => {
    const next = (current + 1) % order.length;
    // cross-fade
    gsap.to(shapes[current], { opacity: 0, duration: 0.5, ease: 'sine.inOut' });
    gsap.to(shapes[next], { opacity: 1, duration: 0.5, ease: 'sine.inOut' });
    if (letters[current]) letters[current].classList.remove('active');
    if (letters[next]) letters[next].classList.add('active');
    current = next;
  };
  if (letters[0]) letters[0].classList.add('active');
  setInterval(tick, 1400);
}

function animateResonanz(root) {
  const { gsap } = window;
  const rings = Array.from(root.querySelectorAll('.reso-rings .ring'));
  if (!rings.length) return;
  rings.forEach((ring, i) => {
    const baseR = parseFloat(ring.getAttribute('r'));
    gsap.fromTo(ring,
      { attr: { r: baseR * 0.35 }, opacity: 0.8 },
      {
        attr: { r: baseR },
        opacity: 0,
        duration: 3,
        delay: i * 0.55,
        ease: 'sine.out',
        repeat: -1,
      }
    );
  });
}

/* --------------------------------------------------------------- */
/* Kickoff                                                          */
/* --------------------------------------------------------------- */
function boot() {
  if (mqReduce.matches || isMobile()) {
    enableFallback();
    return;
  }
  setupHorizontal();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// If the user toggles reduced-motion or resizes across the breakpoint,
// reload the page state (simplest correct behavior).
mqReduce.addEventListener?.('change', () => window.location.reload());
let lastMobile = isMobile();
window.addEventListener('resize', () => {
  const now = isMobile();
  if (now !== lastMobile) {
    lastMobile = now;
    window.location.reload();
  }
});
