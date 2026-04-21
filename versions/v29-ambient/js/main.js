// v29-ambient — Web Audio ambient bed with breathing variable-font typography.
// Vanilla JS, no external deps. Pure-synth (oscillators + noise + convolver), no sample files.
// Audio gated behind a user gesture. Mute toggle always reachable. Visibility pauses context.
// Scroll position controls the gain: loud at top, silent at the bottom — silence is the CTA moment.

(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------
  const consentBanner = document.getElementById('consent');
  const soundOnBtn = document.getElementById('sound-on');
  const soundOffBtn = document.getElementById('sound-off');
  const muteToggle = document.getElementById('mute-toggle');
  const muteLabel = document.getElementById('mute-label');
  const phoneReveal = document.getElementById('phone-reveal');
  const phoneSub = document.getElementById('phone-sub');
  const contactForm = document.getElementById('kontakt');
  const formError = document.getElementById('form-error');

  // Default static values (used when sound off / reduced motion)
  const DEFAULTS = { wght: 380, opsz: 96, soft: 40 };

  // Amplitude smoothing (EMA). 0.85 smoothing → alpha = 0.15
  const SMOOTH = 0.85;
  let smoothedAmp = 0;

  // Audio state
  let audioCtx = null;
  let masterGain = null;
  let analyser = null;
  let byteBuffer = null;
  let currentScrollGain = 1.0;    // 1.0 at top → 0.0 at bottom
  let isAudioEnabled = false;     // user has consented and audio built
  let isMuted = false;            // user toggled mute after enabling
  let rafId = 0;

  // ---------------------------------------------------------------
  // 1. Consent & audio bootstrap
  // ---------------------------------------------------------------
  function hideConsent() {
    consentBanner.classList.add('hidden');
    muteToggle.hidden = false;
  }

  soundOnBtn.addEventListener('click', async () => {
    try {
      await enableAudio();
      updateMuteUI();
      hideConsent();
    } catch (err) {
      console.warn('[ambient] could not start audio', err);
      hideConsent();
    }
  });

  soundOffBtn.addEventListener('click', () => {
    // User wants silence — still show mute button so they can change mind
    isAudioEnabled = false;
    isMuted = true;
    hideConsent();
    updateMuteUI();
  });

  muteToggle.addEventListener('click', async () => {
    if (!audioCtx) {
      // User didn't enable audio originally; build it now
      try {
        await enableAudio();
      } catch (err) {
        console.warn('[ambient] could not start audio', err);
        return;
      }
    } else {
      isMuted = !isMuted;
      applyGain();
    }
    updateMuteUI();
  });

  function updateMuteUI() {
    const playing = isAudioEnabled && !isMuted;
    muteToggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
    // Visual volume cue (also without sound)
    const volumeWord = !isAudioEnabled
      ? 'aus'
      : isMuted
        ? 'stumm'
        : currentScrollGain < 0.15
          ? 'leise'
          : 'an';
    muteLabel.textContent = 'Ton: ' + volumeWord;
  }

  // ---------------------------------------------------------------
  // 2. Build the ambient audio graph
  // ---------------------------------------------------------------
  async function enableAudio() {
    if (audioCtx) {
      // context may be suspended; resume
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      isAudioEnabled = true;
      isMuted = false;
      applyGain();
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('WebAudio unsupported');
    audioCtx = new Ctx();

    // Master gain — controls fade-out via scroll
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.0001;

    // Reverb convolver with a procedurally generated impulse response
    const convolver = audioCtx.createConvolver();
    convolver.buffer = makeImpulseResponse(audioCtx, 3.2, 2.4);

    // Dry/wet blend
    const dry = audioCtx.createGain(); dry.gain.value = 0.25;
    const wet = audioCtx.createGain(); wet.gain.value = 0.75;

    // Voice 1: sustained low drone with slow detune
    const drone1 = makeDrone(audioCtx, 110, 'sine', 0.12);
    // Voice 2: fifth above, slight detune → gentle chorus
    const drone2 = makeDrone(audioCtx, 164.81, 'triangle', 0.08);
    // Voice 3: very soft high shimmer
    const shimmer = makeDrone(audioCtx, 329.63, 'sine', 0.04);

    // Filtered noise bed — airy pad
    const noiseBuf = makePinkNoise(audioCtx, 6);
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 0.7;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.06;
    noiseSrc.connect(noiseFilter).connect(noiseGain);

    // Gentle LFO on filter cutoff for slow "breath"
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08; // ~12s period
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(noiseFilter.frequency);
    lfo.start();

    // Mix bus feeding convolver
    const mix = audioCtx.createGain(); mix.gain.value = 1.0;
    drone1.connect(mix);
    drone2.connect(mix);
    shimmer.connect(mix);
    noiseGain.connect(mix);

    // Dry path
    mix.connect(dry);
    // Wet path
    mix.connect(convolver);
    convolver.connect(wet);

    // Combine & analyser
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    byteBuffer = new Uint8Array(analyser.fftSize);

    dry.connect(masterGain);
    wet.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Start sources
    noiseSrc.start();

    // Fade in slowly to scroll-based gain
    isAudioEnabled = true;
    isMuted = false;
    applyGain({ fadeIn: true });

    // Start breath loop (amplitude → font-variation-settings)
    if (!rafId) rafId = requestAnimationFrame(breatheLoop);
  }

  // ---------------------------------------------------------------
  // 3. Sound-design helpers
  // ---------------------------------------------------------------
  function makeDrone(ctx, freq, type, gainVal) {
    // Two detuned oscillators for a chorused, slightly alive drone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = type;
    osc2.type = type;
    osc1.frequency.value = freq;
    osc2.frequency.value = freq;
    osc1.detune.value = -4;
    osc2.detune.value = 5;

    // Slow vibrato via another LFO on the detune
    const vib = ctx.createOscillator();
    vib.frequency.value = 0.15 + Math.random() * 0.1;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 3;
    vib.connect(vibGain);
    vibGain.connect(osc1.detune);
    vibGain.connect(osc2.detune);
    vib.start();

    const g = ctx.createGain();
    g.gain.value = gainVal;

    osc1.connect(g);
    osc2.connect(g);
    osc1.start();
    osc2.start();

    return g;
  }

  function makePinkNoise(ctx, seconds) {
    // Paul Kellet's approximation for pink noise — cheap and warm.
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  function makeImpulseResponse(ctx, duration = 3, decay = 2) {
    // Simple exponentially decaying noise IR — yields a wide, warm hall.
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    return impulse;
  }

  // ---------------------------------------------------------------
  // 4. Scroll → master gain (loud top, silent bottom)
  // ---------------------------------------------------------------
  function scrollProgress() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / max));
  }

  function applyGain(opts = {}) {
    if (!audioCtx || !masterGain) return;
    const p = scrollProgress();
    // Sound loud 0..0.45 then fade toward 0 at the finale.
    // Shape: 1 until 35%, then cosine taper to 0 by 95%.
    let g;
    if (p < 0.35) g = 1;
    else if (p > 0.95) g = 0;
    else {
      const k = (p - 0.35) / (0.95 - 0.35);
      g = 0.5 * (1 + Math.cos(k * Math.PI)); // 1 → 0 smooth
    }
    currentScrollGain = g;

    const target = (isAudioEnabled && !isMuted ? 1 : 0) * g * 0.7; // global headroom 0.7
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    const ramp = opts.fadeIn ? 1.8 : 0.5;
    masterGain.gain.linearRampToValueAtTime(Math.max(target, 0.0001), now + ramp);
  }

  let scrollRaf = 0;
  window.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      applyGain();
      updateMuteUI();
    });
  }, { passive: true });

  // ---------------------------------------------------------------
  // 5. Breath loop — amplitude → variable font axes
  // ---------------------------------------------------------------
  function breatheLoop() {
    rafId = requestAnimationFrame(breatheLoop);
    if (!analyser || !byteBuffer) return;
    analyser.getByteTimeDomainData(byteBuffer);

    // RMS in [0..~0.5], normalize to [0..1]
    let sum = 0;
    for (let i = 0; i < byteBuffer.length; i++) {
      const v = (byteBuffer[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / byteBuffer.length); // 0..1-ish
    const normalized = Math.min(1, rms * 4);        // boost — ambient signal is quiet

    // EMA smoothing
    smoothedAmp = SMOOTH * smoothedAmp + (1 - SMOOTH) * normalized;

    // Expose as CSS var for mute-icon waves etc.
    root.style.setProperty('--amp', smoothedAmp.toFixed(3));

    if (reducedMotion) return; // no font-axes coupling in reduced-motion mode

    // Map amplitude to Fraunces axes. Headings feel heavier, wider when louder.
    // wght 320..560, opsz 60..144, SOFT 0..100
    const wght = 320 + smoothedAmp * 240;
    const opsz = 60 + smoothedAmp * 84;
    const soft = 0 + smoothedAmp * 100;

    root.style.setProperty('--wght', wght.toFixed(1));
    root.style.setProperty('--opsz', opsz.toFixed(1));
    root.style.setProperty('--soft', soft.toFixed(1));
  }

  // Even without audio we still need default amp + defaults (already set in CSS)
  root.style.setProperty('--amp', '0');
  root.style.setProperty('--wght', String(DEFAULTS.wght));
  root.style.setProperty('--opsz', String(DEFAULTS.opsz));
  root.style.setProperty('--soft', String(DEFAULTS.soft));

  // ---------------------------------------------------------------
  // 6. Visibility: pause audio when tab hidden
  // ---------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) {
      if (audioCtx.state === 'running') audioCtx.suspend();
    } else {
      if (isAudioEnabled && !isMuted && audioCtx.state === 'suspended') audioCtx.resume();
    }
  });

  // ---------------------------------------------------------------
  // 7. Phone reveal — spam mitigation
  // ---------------------------------------------------------------
  if (phoneReveal) {
    phoneReveal.addEventListener('click', () => {
      const expanded = phoneReveal.getAttribute('aria-expanded') === 'true';
      if (!expanded) {
        phoneSub.textContent = '+49 (0)555 123 456 7';
        phoneReveal.setAttribute('aria-expanded', 'true');
        // swap to tel: link after reveal for easy tap
        const tel = document.createElement('a');
        tel.href = 'tel:+495551234567';
        tel.className = 'cta cta-phone';
        tel.innerHTML = '<span class="cta-label">Telefon</span><span class="cta-sub">+49 (0)555 123 456 7</span>';
        phoneReveal.replaceWith(tel);
      }
    });
  }

  // ---------------------------------------------------------------
  // 8. Form validation
  // ---------------------------------------------------------------
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const required = contactForm.querySelectorAll('[required]');
      let ok = true;
      required.forEach((el) => {
        el.classList.remove('error');
        const v = String(el.value || '').trim();
        if (!v) { ok = false; el.classList.add('error'); }
        else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          ok = false; el.classList.add('error');
        }
      });
      if (!ok) {
        e.preventDefault();
        formError.hidden = false;
      } else {
        formError.hidden = true;
      }
    });
  }

  // Smooth-scroll anchors (non-hijacking; native smooth already set in CSS).
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
