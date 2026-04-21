// v10-dialog-wave — main.js
// Voice memos that actually sound. Breathing typography. Lenis smooth scroll.

import Lenis from 'https://esm.sh/lenis@1.1.14';
import { gsap } from 'https://esm.sh/gsap@3.12.5';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- 1. Lenis smooth scroll ---------- */
let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1,
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // anchor links work through Lenis
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -40, duration: 1.2 });
        }
      }
    });
  });
}

/* ---------- 2. Breathing font-variation loop ---------- */
// Sine wave oscillates 0..1 on a ~6s cycle.
// Only elements with .breathe use var(--breath) in their font-variation-settings.
if (!reducedMotion) {
  const periodMs = 6000;
  let start = performance.now();

  const breathe = (now) => {
    const t = ((now - start) % periodMs) / periodMs;         // 0..1
    const sine = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1 shifted so we start low
    root.style.setProperty('--breath', sine.toFixed(4));
    requestAnimationFrame(breathe);
  };
  requestAnimationFrame(breathe);
} else {
  root.style.setProperty('--breath', '0.5');
}

/* ---------- 3. Reveal turns on scroll ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
);
document.querySelectorAll('.turn').forEach((el) => revealObserver.observe(el));

/* ---------- 4. Deterministic waveform synthesis ---------- */
// Each memo gets a reproducible waveform from sine + layered pseudo-noise (seeded by index).
// Returns array of 80 values in [0.08..1].
function makeWaveform(seed, bars = 80) {
  const values = [];
  // tiny seeded PRNG (mulberry32)
  let s = seed * 1234567 + 987654321;
  const rnd = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // envelope: rise -> plateau -> taper (like a spoken phrase)
  for (let i = 0; i < bars; i++) {
    const x = i / (bars - 1);
    // envelope
    const env =
      x < 0.08 ? x / 0.08 :
      x > 0.88 ? 1 - (x - 0.88) / 0.12 :
      1;
    // carrier: two beating sines
    const s1 = Math.sin(x * Math.PI * (3 + (seed % 3)));
    const s2 = Math.sin(x * Math.PI * (7 + (seed % 5)) + seed);
    const carrier = (s1 * 0.5 + s2 * 0.4);
    // noise
    const n = (rnd() - 0.5) * 0.9;
    // combine
    let v = 0.5 + (carrier * 0.35) + n * 0.45;
    v = Math.max(0.06, Math.min(1, v * env));
    values.push(v);
  }
  return values;
}

/* ---------- 5. Render waveforms + wire audio ---------- */
let audioCtx = null;
const ensureAudio = () => {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

// one active player at a time
let currentMemo = null;
let currentRafId = null;

function stopCurrent() {
  if (!currentMemo) return;
  currentMemo.memo.classList.remove('playing');
  currentMemo.memo.querySelectorAll('.bar').forEach((b) => b.classList.remove('active'));
  if (currentRafId) cancelAnimationFrame(currentRafId);
  if (currentMemo.stopFn) currentMemo.stopFn();
  currentMemo = null;
  currentRafId = null;
}

function playMemo(memoEl, durSec, basePitch) {
  const ctx = ensureAudio();
  const bars = [...memoEl.querySelectorAll('.bar')];
  const wave = memoEl._wave;
  const now = ctx.currentTime;
  const dur = Math.min(Math.max(durSec, 0.8), 2.0); // placeholder tone: 0.8–2s

  // Two oscillators for a warmer tone
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.08);
  master.gain.setValueAtTime(0.22, now + dur - 0.25);
  master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  master.connect(ctx.destination);

  // subtle lowpass filter for warmth
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2400, now);
  lp.frequency.linearRampToValueAtTime(1400, now + dur);
  lp.Q.value = 0.6;
  lp.connect(master);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(basePitch, now);
  // small natural vibrato
  osc1.frequency.linearRampToValueAtTime(basePitch * 1.02, now + dur * 0.4);
  osc1.frequency.linearRampToValueAtTime(basePitch * 0.98, now + dur * 0.8);
  osc1.connect(lp);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(basePitch * 2, now);
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.value = 0.12;
  osc2.connect(osc2Gain).connect(lp);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + dur + 0.05);
  osc2.stop(now + dur + 0.05);

  memoEl.classList.add('playing');

  // visual scrub — advance through bars over `dur` seconds
  const startMs = performance.now();
  const totalMs = dur * 1000;

  const tick = (t) => {
    const elapsed = t - startMs;
    const p = Math.min(1, elapsed / totalMs);
    const idx = Math.floor(p * bars.length);
    bars.forEach((b, i) => {
      b.classList.toggle('played', i < idx);
      b.classList.toggle('active', i === idx);
    });
    if (p < 1) {
      currentRafId = requestAnimationFrame(tick);
    } else {
      stopCurrent();
    }
  };
  currentRafId = requestAnimationFrame(tick);

  currentMemo = {
    memo: memoEl,
    stopFn: () => {
      try {
        osc1.stop();
        osc2.stop();
      } catch (_) {}
    },
  };
}

document.querySelectorAll('.memo').forEach((memoEl) => {
  const idx = parseInt(memoEl.dataset.memo || '0', 10);
  const durStr = memoEl.dataset.duration || '0:08';
  const pitch = parseFloat(memoEl.dataset.pitch || '220');

  // parse "m:ss" → seconds (used only for display label; playback = 1.2–1.8s)
  const [m, s] = durStr.split(':').map(Number);
  const labelSec = (m || 0) * 60 + (s || 0);
  // placeholder audio: scale visible duration into a short musical blip
  const audioDur = 1.0 + (labelSec / 20) * 0.7; // 1.0..1.7s

  // render bars
  const waveEl = memoEl.querySelector('.memo-wave');
  const values = makeWaveform(idx + 1, 80);
  memoEl._wave = values;
  const barsHtml = values
    .map((v) => {
      const h = Math.round(4 + v * 44); // 4..48px
      return `<span class="bar" style="height:${h}px"></span>`;
    })
    .join('');
  waveEl.innerHTML = barsHtml;

  // scrub-seek: click on wave jumps (simple stop+play)
  waveEl.addEventListener('click', () => {
    if (currentMemo && currentMemo.memo === memoEl) {
      stopCurrent();
    } else {
      stopCurrent();
      playMemo(memoEl, audioDur, pitch);
    }
  });

  const playBtn = memoEl.querySelector('.memo-play');
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMemo && currentMemo.memo === memoEl) {
      stopCurrent();
    } else {
      stopCurrent();
      playMemo(memoEl, audioDur, pitch);
    }
  });
});

/* ---------- 6. Subtle parallax scrub of the intro ---------- */
// Uses GSAP — just a soft fade-out as the user leaves the hero.
if (!reducedMotion) {
  const intro = document.querySelector('.intro');
  if (intro) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const h = intro.offsetHeight;
      const p = Math.min(1, y / h);
      gsap.set(intro, { opacity: 1 - p * 0.85, y: -p * 40 });
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }
}

/* ---------- 7. Phone reveal ---------- */
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    // dummy number per brief — rendered only on user action
    phoneBtn.outerHTML = `<a class="btn btn-ghost revealed" href="tel:+495551234567">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span>+49 (0)555 &ndash; 123 456 7</span>
    </a>`;
  });
}

// by GPT… just kidding — by Claude, effect-variant 2026-04
