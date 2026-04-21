// v17-breath-shader
// Full-viewport painterly fragment shader. Breathes at ~12 BPM (0.2 Hz).
// Three atmospheric states driven by scroll: Morgen (cool dawn) → Mittag (cream) → Abend (amber).
// Content reads above the canvas; the canvas never captures pointer events.

import * as THREE from 'https://unpkg.com/three@0.160/build/three.module.js';

// Bail out on legal pages — they set <body class="legal"> to skip WebGL entirely.
if (document.body.classList.contains('legal')) {
  // no-op
} else {
  initBreathShader();
}

function initBreathShader() {
  const canvas = document.getElementById('breath-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  } catch (err) {
    // WebGL unavailable — static fallback gradient stays visible.
    return;
  }

  const maxDpr = isMobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime:           { value: 0 },
    uBreath:         { value: 0 },            // 0..1, 12 BPM = 0.2 Hz sine
    uScrollProgress: { value: prefersReduced ? 0.5 : 0 }, // midpoint on reduced motion
    uResolution:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment: 2D FBM field (4 octaves) warped by breath; three-anchor palette mix;
  // soft elliptical silhouette in upper-center that pulses with uBreath; vignette.
  const fragmentShader = /* glsl */`
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform float uBreath;
    uniform float uScrollProgress;
    uniform vec2  uResolution;

    // Hash-based value noise — cheap, no textures.
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    // 4-octave fBm — the breathing field.
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return v;
    }

    // Smooth 3-anchor palette mix: dawn → cream → amber.
    vec3 palette(float t) {
      // Cool dawn — bluish grey with a hint of lavender.
      vec3 dawn   = vec3(0.42, 0.48, 0.58);
      // Warm cream — midday Niederrad, paper-ish.
      vec3 cream  = vec3(0.93, 0.86, 0.72);
      // Amber — evening, candle-warm.
      vec3 amber  = vec3(0.78, 0.42, 0.15);

      t = clamp(t, 0.0, 1.0);
      if (t < 0.5) {
        return mix(dawn, cream, smoothstep(0.0, 0.5, t));
      } else {
        return mix(cream, amber, smoothstep(0.5, 1.0, t));
      }
    }

    // Soft elliptical silhouette, upper-center, pulses with breath.
    // Returns a mask 0..1 where 1 = silhouette center.
    float silhouette(vec2 uv, float breath, float aspect) {
      // Centre around upper-third; aspect-correct so she isn't squashed on wide screens.
      vec2 c = vec2(0.5, 0.62);
      vec2 d = uv - c;
      d.x *= aspect;
      // Slightly vertical ellipse — head/shoulder abstraction.
      d.x /= 0.32;
      d.y /= 0.44;
      float r = length(d);
      // Breath modulates size subtly (±4%).
      float size = 1.0 + 0.04 * (breath - 0.5) * 2.0;
      return 1.0 - smoothstep(0.55 * size, 1.15 * size, r);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / max(uResolution.y, 1.0);

      // Slow time base for breathing. uBreath arrives already shaped as 0..1 sine;
      // we turn it into a centred delta for warping.
      float bDelta = (uBreath - 0.5) * 2.0;

      // Sample coordinate gets warped by its own FBM — classic domain-warp trick for
      // painterly, organic movement rather than grid-like noise.
      vec2 p = uv * vec2(aspect, 1.0) * 2.2;
      vec2 warp1 = vec2(
        fbm(p + vec2(0.0, uTime * 0.04)),
        fbm(p + vec2(5.2, uTime * 0.03 + 1.7))
      );
      vec2 warp2 = vec2(
        fbm(p * 1.8 + warp1 + vec2(uTime * 0.02, 0.0)),
        fbm(p * 1.8 + warp1 + vec2(0.0, uTime * 0.025))
      );
      float field = fbm(p + warp2 * (0.6 + 0.25 * bDelta));

      // Base colour from scroll progress; field adds organic variation.
      float t = uScrollProgress + (field - 0.5) * 0.35;
      vec3 col = palette(t);

      // Silhouette — brightened by breath, multiplied by warm core when in cream/amber range.
      float sil = silhouette(uv, uBreath, aspect);
      vec3 silHue = mix(vec3(0.96, 0.82, 0.60), vec3(0.55, 0.27, 0.08), uScrollProgress);
      col = mix(col, silHue, sil * (0.45 + 0.25 * uBreath));

      // Painterly grain tied to field + tiny time jitter — keeps the surface from banding.
      float grain = (hash(uv * uResolution.xy + uTime) - 0.5) * 0.035;
      col += grain;

      // Soft vignette, biased slightly upward so the silhouette stays the brightest centre.
      vec2 vUvc = uv - vec2(0.5, 0.55);
      vUvc.x *= aspect;
      float vig = smoothstep(1.1, 0.35, length(vUvc));
      col *= mix(0.72, 1.05, vig);

      // Tiny overall breath on brightness (±3%).
      col *= 1.0 + 0.03 * bDelta;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Mark shader ready — CSS fades out the static-bg fallback.
  requestAnimationFrame(() => document.body.classList.add('shader-ready'));

  // Scroll uniform updated via rAF-throttled listener; no per-frame DOM reads inside render loop.
  let targetScroll = prefersReduced ? 0.5 : 0;
  let currentScroll = targetScroll;

  function readScroll() {
    if (prefersReduced) return;
    const docHeight = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );
    targetScroll = Math.min(Math.max(window.scrollY / docHeight, 0), 1);
  }

  if (!prefersReduced) {
    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();
  }

  // Resize: debounce via rAF to avoid thrash.
  let resizeScheduled = false;
  function handleResize() {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      resizeScheduled = false;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = window.matchMedia('(max-width: 640px)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    });
  }
  window.addEventListener('resize', handleResize);

  const BREATH_HZ = 0.2;    // 12 BPM
  const TWO_PI   = Math.PI * 2;
  const startTime = performance.now();

  let rafId = 0;
  let running = true;

  function frame() {
    if (!running) return;
    const tSec = (performance.now() - startTime) / 1000;
    uniforms.uTime.value = tSec;
    // uBreath: sinus 0..1, freq 0.2 Hz = 12 cycles per minute.
    uniforms.uBreath.value = 0.5 + 0.5 * Math.sin(tSec * TWO_PI * BREATH_HZ);
    // Ease scroll uniform toward its target — removes jitter from sub-pixel scroll events.
    currentScroll += (targetScroll - currentScroll) * 0.08;
    uniforms.uScrollProgress.value = currentScroll;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // Reduced motion: render ONCE at midpoint and never loop.
  if (prefersReduced) {
    uniforms.uTime.value = 0;
    uniforms.uBreath.value = 0.5;
    uniforms.uScrollProgress.value = 0.5;
    renderer.render(scene, camera);
    running = false;
  } else {
    running = false; // ensure start() kicks off cleanly
    start();
  }

  // Pause when tab hidden to save battery.
  document.addEventListener('visibilitychange', () => {
    if (prefersReduced) return;
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
}
