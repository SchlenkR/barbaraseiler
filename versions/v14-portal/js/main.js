// v14-portal — horizontal chapter-book with sound & light
// self-contained, ES modules from esm.sh CDN

import Lenis from 'https://esm.sh/lenis@1.1.14';
import { gsap } from 'https://esm.sh/gsap@3.12.5';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.12.5/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// -----------------------------------------------------------
// Mode detection (once on load, no live resize handling)
// -----------------------------------------------------------
const isMobile = window.innerWidth < 900;
document.body.dataset.mode = isMobile ? 'mobile' : 'desktop';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// -----------------------------------------------------------
// Lenis smooth-scroll (outer vertical scroll)
// -----------------------------------------------------------
let lenis;
if (!prefersReducedMotion) {
  lenis = new Lenis({
    lerp: 0.09,
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// -----------------------------------------------------------
// Horizontal pin scroll (desktop only)
// -----------------------------------------------------------
const panels = gsap.utils.toArray('.panel');
const portal = document.querySelector('.portal');
const panelsEl = document.querySelector('.panels');

let horizontalST = null;

if (!isMobile && panels.length) {
  horizontalST = gsap.to(panelsEl, {
    x: () => -(panelsEl.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: portal,
      pin: true,
      scrub: 0.5,
      start: 'top top',
      end: () => '+=' + (panelsEl.scrollWidth - window.innerWidth),
      invalidateOnRefresh: true,
    },
  });
}

// -----------------------------------------------------------
// Per-panel entrance detection + parallax + clip-veil morph
// -----------------------------------------------------------
panels.forEach((panel, i) => {
  const parallaxLayers = panel.querySelectorAll('.parallax');
  const clipVeil = panel.querySelector('.clip-veil');

  // desktop: chapter "enters" when its left edge is within the viewport center
  // mobile: classic scroll-into-view
  const triggerCfg = isMobile
    ? { trigger: panel, start: 'top 65%', end: 'bottom 20%' }
    : {
        trigger: panel,
        containerAnimation: horizontalST,
        start: 'left 80%',
        end: 'right 20%',
      };

  ScrollTrigger.create({
    ...triggerCfg,
    onEnter: () => {
      panel.classList.add('is-entered');
      setActiveChapter(i + 1);
      audio.switchTo(panel.dataset.key);
    },
    onEnterBack: () => {
      panel.classList.add('is-entered');
      setActiveChapter(i + 1);
      audio.switchTo(panel.dataset.key);
    },
    onLeave: () => {
      // keep is-entered so panels don't flash out when scrolled past
    },
  });

  // parallax via progress mapping on the same horizontal animation
  if (!prefersReducedMotion && parallaxLayers.length) {
    parallaxLayers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth || '0');
      if (depth === 0) return;

      gsap.fromTo(
        layer,
        { xPercent: 30 * depth },
        {
          xPercent: -30 * depth,
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            containerAnimation: horizontalST || undefined,
            start: isMobile ? 'top bottom' : 'left right',
            end: isMobile ? 'bottom top' : 'right left',
            scrub: true,
          },
        }
      );
    });
  }

  // clip-path morph veil on entry
  if (clipVeil && !prefersReducedMotion) {
    gsap.fromTo(
      clipVeil,
      { clipPath: 'circle(0% at 50% 50%)' },
      {
        clipPath: 'circle(150% at 50% 50%)',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: panel,
          containerAnimation: horizontalST || undefined,
          start: isMobile ? 'top 90%' : 'left 90%',
          end: isMobile ? 'top 30%' : 'left 30%',
          scrub: 0.6,
        },
      }
    );
  }
});

// -----------------------------------------------------------
// Active chapter indicator
// -----------------------------------------------------------
const dots = document.querySelectorAll('.nav-dots .dot');
function setActiveChapter(n) {
  dots.forEach((d) => d.classList.toggle('is-active', String(n) === d.dataset.chapter));
}

// Dot click — scroll to that panel
dots.forEach((dot) => {
  dot.addEventListener('click', (e) => {
    e.preventDefault();
    const n = parseInt(dot.dataset.chapter, 10);
    scrollToChapter(n);
  });
});

function scrollToChapter(n) {
  if (isMobile) {
    const target = document.getElementById('kap-' + n);
    if (target && lenis) lenis.scrollTo(target, { offset: -60 });
    else if (target) target.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (!horizontalST) return;
  const st = horizontalST.scrollTrigger;
  const panelWidth = window.innerWidth;
  const idx = n - 1;
  const totalDistance = st.end - st.start;
  const progress = (idx * panelWidth) / (panelsEl.scrollWidth - panelWidth);
  const target = st.start + totalDistance * progress;
  if (lenis) lenis.scrollTo(target);
  else window.scrollTo({ top: target, behavior: 'smooth' });
}

// Intro "Eintreten" button — scroll into portal and unlock audio gesture
const introStart = document.getElementById('introStart');
introStart?.addEventListener('click', () => {
  audio.unlock(); // first user gesture — unlock AudioContext (but don't play yet)
  scrollToChapter(1);
});

// =============================================================
// AUDIO — synthesized ambient per chapter
// =============================================================
const audio = (() => {
  let ctx = null;
  let masterGain = null;
  let unlocked = false;
  let enabled = false;
  let currentKey = null;
  const nodes = {}; // active nodes for current chapter

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  function synthesizeImpulse(seconds = 2.2, decay = 2.5) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  function stopAll(fadeSec = 1.2) {
    if (!ctx) return;
    Object.values(nodes).forEach((n) => {
      try {
        if (n.gain) n.gain.gain.cancelScheduledValues(ctx.currentTime);
        if (n.gain) n.gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
      } catch (e) {}
    });
    setTimeout(() => {
      Object.values(nodes).forEach((n) => {
        try { n.osc && n.osc.stop(); } catch (e) {}
        try { n.osc2 && n.osc2.stop(); } catch (e) {}
        try { n.noise && n.noise.stop(); } catch (e) {}
        try { n.lfo && n.lfo.stop(); } catch (e) {}
      });
      for (const k in nodes) delete nodes[k];
    }, fadeSec * 1000 + 100);
  }

  function makeReverb(wetGain = 0.25) {
    const convolver = ctx.createConvolver();
    convolver.buffer = synthesizeImpulse(2.4, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = wetGain;
    convolver.connect(wet);
    wet.connect(masterGain);
    return { input: convolver, wet };
  }

  function build(key) {
    if (!ctx) return;
    stopAll();

    const verb = makeReverb(0.3);
    const dry = ctx.createGain();
    dry.gain.value = 0.65;
    dry.connect(masterGain);

    if (key === 'door') {
      // Warm C3 drone (~130.81 Hz) with slow lowpass sweep
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 130.81;
      osc2.type = 'sine';
      osc2.frequency.value = 130.81 * 2.003; // subtle detune above
      filt.type = 'lowpass';
      filt.frequency.value = 400;
      filt.Q.value = 0.6;
      gain.gain.value = 0;

      lfo.type = 'sine';
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain).connect(filt.frequency);

      osc.connect(filt);
      osc2.connect(filt);
      filt.connect(dry);
      filt.connect(verb.input);

      osc.start(); osc2.start(); lfo.start();
      gain.gain.setTargetAtTime(0.18, ctx.currentTime, 1.0);
      nodes.door = { osc, osc2, filt, gain, lfo };
      // attach gain via mastergain envelope instead — set master directly
      fadeMaster(0.7, 1.4);
    } else if (key === 'room') {
      // G3 + perfect fifth (D4)
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const filt = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      o1.type = 'sine'; o1.frequency.value = 196.00; // G3
      o2.type = 'sine'; o2.frequency.value = 293.66; // D4
      filt.type = 'lowpass';
      filt.frequency.value = 600;
      filt.Q.value = 0.8;

      lfo.type = 'sine'; lfo.frequency.value = 0.11;
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(filt.frequency);

      o1.connect(filt); o2.connect(filt);
      filt.connect(dry); filt.connect(verb.input);
      o1.start(); o2.start(); lfo.start();
      nodes.room = { osc: o1, osc2: o2, filt, lfo };
      fadeMaster(0.75, 1.4);
    } else if (key === 'warmup') {
      // silence + occasional single piano-like note (E4)
      const scheduleNote = () => {
        if (currentKey !== 'warmup' || !ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filt = ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.value = 329.63; // E4
        filt.type = 'lowpass';
        filt.frequency.value = 1800;
        gain.gain.value = 0;

        osc.connect(filt); filt.connect(gain);
        gain.connect(dry); gain.connect(verb.input);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

        osc.start(now);
        osc.stop(now + 3.2);

        const next = 5 + Math.random() * 6;
        nodes.warmupTimer = setTimeout(scheduleNote, next * 1000);
      };
      scheduleNote();
      fadeMaster(0.9, 1.2);
    } else if (key === 'lesson') {
      // Breath-like filtered noise
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 700;
      filt.Q.value = 0.7;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.22; // slow breath rhythm
      lfoGain.gain.value = 380;
      lfo.connect(lfoGain).connect(filt.frequency);

      const gain = ctx.createGain();
      gain.gain.value = 0.3;

      noise.connect(filt).connect(gain);
      gain.connect(dry); gain.connect(verb.input);
      noise.start(); lfo.start();
      nodes.lesson = { noise, filt, gain, lfo };
      fadeMaster(0.6, 1.4);
    } else if (key === 'home') {
      // fade to near-silence
      fadeMaster(0.15, 2.2);
    }
  }

  function fadeMaster(target, sec) {
    if (!ctx || !masterGain || !enabled) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setTargetAtTime(target, ctx.currentTime, sec / 3);
  }

  return {
    unlock() {
      const c = ensureCtx();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      unlocked = true;
    },
    toggle() {
      const c = ensureCtx();
      if (!c) return false;
      if (c.state === 'suspended') c.resume();
      unlocked = true;
      enabled = !enabled;
      if (enabled) {
        if (currentKey) build(currentKey);
        else build('door');
      } else {
        fadeMaster(0, 1.0);
        setTimeout(() => {
          stopAll(0.1);
          if (nodes.warmupTimer) { clearTimeout(nodes.warmupTimer); delete nodes.warmupTimer; }
        }, 1200);
      }
      return enabled;
    },
    switchTo(key) {
      currentKey = key;
      if (!enabled || !unlocked || !ctx) return;
      if (nodes.warmupTimer) { clearTimeout(nodes.warmupTimer); delete nodes.warmupTimer; }
      build(key);
    },
    isEnabled() { return enabled; },
  };
})();

// Sound toggle button
const soundToggleBtn = document.getElementById('soundToggle');
const soundLabel = soundToggleBtn?.querySelector('.sound-label');
soundToggleBtn?.addEventListener('click', () => {
  const on = audio.toggle();
  soundToggleBtn.setAttribute('aria-pressed', String(on));
  if (soundLabel) soundLabel.textContent = on ? 'Ton aus' : 'Ton an';
});

// =============================================================
// Phone reveal (dummy number)
// =============================================================
const phoneBtn = document.getElementById('phoneRevealBtn');
const phoneSlot = document.getElementById('phoneSlot');
phoneBtn?.addEventListener('click', () => {
  if (!phoneSlot) return;
  phoneSlot.innerHTML = '<a href="tel:+495551234567">+49 (0)555 &ndash; 123 456 7</a>';
  phoneBtn.style.display = 'none';
});

// =============================================================
// Refresh ScrollTrigger after fonts load to avoid offset issues
// =============================================================
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

// Mark first chapter as entered on load (so intro transition works)
window.addEventListener('load', () => {
  panels[0]?.classList.add('is-entered');
  ScrollTrigger.refresh();
});
