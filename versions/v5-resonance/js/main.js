// Resonance Chamber — the whole site is a breathing WebGL scene.
// The canvas stays fixed behind content. Scroll position, time and (optionally)
// audio drive shader uniforms. Content floats above via mix-blend-mode: difference.

import * as THREE from 'https://esm.sh/three@0.160.0';
import Lenis from 'https://esm.sh/lenis@1.1.14';
import { vertexShader, fragmentShader } from './shaders.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 640px)').matches;

// ---------- Lenis smooth scroll ----------
const lenis = new Lenis({
  duration: prefersReducedMotion ? 0.6 : 1.2,
  smoothWheel: !prefersReducedMotion,
  // don't hijack touch — Lenis handles it cleanly but stay gentle on mobile
  smoothTouch: false,
});

function rafLenis(time) {
  lenis.raf(time);
  requestAnimationFrame(rafLenis);
}
requestAnimationFrame(rafLenis);

// ---------- Three.js fullscreen shader stage ----------
const canvas = document.getElementById('resonance-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
// orthographic camera — we just need a fullscreen quad
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTime: { value: 0 },
  uScrollProgress: { value: 0 },
  uBreath: { value: 0.5 },
  uAudioLevel: { value: 0 },
  uQuality: { value: prefersReducedMotion || isMobile ? 0.5 : 1.0 },
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
};

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  depthTest: false,
  depthWrite: false,
});
const geometry = new THREE.PlaneGeometry(2, 2);
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

// ---------- resize ----------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uResolution.value.set(w, h);
}
window.addEventListener('resize', onResize);

// ---------- scroll progress -> shader ----------
function updateScrollProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  uniforms.uScrollProgress.value = Math.max(0, Math.min(1, p));
}
lenis.on('scroll', updateScrollProgress);
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------- audio-reactive mode (opt-in) ----------
let audioCtx = null;
let analyser = null;
let audioData = null;
let audioStarted = false;
let audioSmoothed = 0;

function startAudio() {
  if (audioStarted) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    // synthesize a warm vocal-ish drone — stacked detuned sines, slow vibrato
    const master = audioCtx.createGain();
    master.gain.value = 0.0;
    master.gain.linearRampToValueAtTime(0.12, now + 1.2);

    // soft lowpass to tame the sine pile
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    lp.Q.value = 0.7;

    // chord: root + fifth + octave, detuned
    const freqs = [146.83, 220.0, 293.66, 440.0]; // D3, A3, D4, A4
    freqs.forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = i === 3 ? 'triangle' : 'sine';
      osc.frequency.value = f;

      // gentle vibrato via LFO on detune
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.15 + i * 0.07;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 6 + i * 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      lfo.start();

      const g = audioCtx.createGain();
      g.gain.value = 0.22 / (i + 1);
      osc.connect(g);
      g.connect(lp);
      osc.start();
    });

    lp.connect(master);
    master.connect(audioCtx.destination);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    audioData = new Uint8Array(analyser.frequencyBinCount);
    lp.connect(analyser); // tap pre-master for analysis

    audioStarted = true;
    document.body.classList.add('audio-on');
  } catch (err) {
    console.warn('Audio init failed:', err);
  }
}

function stopAudio() {
  if (!audioStarted) return;
  try {
    audioCtx.close();
  } catch (_) {}
  audioCtx = null;
  analyser = null;
  audioData = null;
  audioStarted = false;
  audioSmoothed = 0;
  uniforms.uAudioLevel.value = 0;
  document.body.classList.remove('audio-on');
}

const audioBtn = document.getElementById('audioToggle');
if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    if (audioStarted) {
      stopAudio();
      audioBtn.textContent = 'mit Klang';
      audioBtn.setAttribute('aria-pressed', 'false');
    } else {
      startAudio();
      audioBtn.textContent = 'ohne Klang';
      audioBtn.setAttribute('aria-pressed', 'true');
    }
  });
}

// ---------- render loop: 60fps cap, pause on hidden ----------
let lastFrame = 0;
const frameInterval = 1000 / 60;

function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) return;
  if (now - lastFrame < frameInterval) return;
  lastFrame = now;

  const tSec = now / 1000;
  uniforms.uTime.value = tSec;

  // breath: 6s sine, 0..1
  const breath = 0.5 + 0.5 * Math.sin((tSec / 6.0) * Math.PI * 2.0);
  uniforms.uBreath.value = breath;

  // audio
  if (analyser && audioData) {
    analyser.getByteFrequencyData(audioData);
    let sum = 0;
    // weight low-mid bands (vocal range)
    const bands = Math.min(24, audioData.length);
    for (let i = 0; i < bands; i++) sum += audioData[i];
    const avg = sum / bands / 255;
    // smooth toward target
    audioSmoothed += (avg - audioSmoothed) * 0.08;
    uniforms.uAudioLevel.value = audioSmoothed;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

// ---------- tiny helpers ----------
// reveal scenes as they scroll in — CSS handles the actual transition
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add('in-view');
    }
  },
  { threshold: 0.2 }
);
document.querySelectorAll('.scene, .reveal').forEach((el) => io.observe(el));

// phone reveal (spam-protect pattern)
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const display = '+49 (0)555 – 123 456 7';
    phoneBtn.outerHTML = `<a href="tel:+495551234567" class="phone-link">${display}</a>`;
  });
}
