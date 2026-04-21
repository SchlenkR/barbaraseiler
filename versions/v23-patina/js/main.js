// v23-patina — Idle-patina shader.
// A warm painterly ground (FBM noise) that gradually acquires oxidation
// rings, golden-brown patina, and edge-darkening as the visitor stays.
// Time-tracked via uTimeOnPage (seconds, paused when tab hidden).
// Target: subtle at 60s, clearly noticeable, dramatic by 180s, max at 300s.

import * as THREE from 'https://esm.sh/three@0.160.0';

// Bail early on legal pages — no shader needed.
if (document.body.classList.contains('legal')) {
  // still expose phone-reveal handler below if present
} else {
  initPatinaShader();
}

initPhoneReveal();

function initPhoneReveal() {
  const phoneBtn = document.getElementById('phoneRevealBtn');
  if (!phoneBtn) return;
  phoneBtn.addEventListener('click', () => {
    const display = '+49 (0)555 – 123 456 7';
    phoneBtn.outerHTML = `<a href="tel:+495551234567" class="phone-link">${display}</a>`;
  });
}

function initPatinaShader() {
  const canvas = document.getElementById('patina-canvas');
  const meterEl = document.getElementById('meter');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 640px)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTimeOnPage: { value: prefersReducedMotion ? 60.0 : 0.0 }, // seconds
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  const vert = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float uTimeOnPage;
    uniform vec2  uResolution;

    // ---- hash / noise / fbm ----
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
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.03;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      // Aspect-correct uv centered at origin
      vec2 uv = vUv;
      vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);

      // ---- Base: warm cream/ochre painterly ground ----
      vec3 creamLight = vec3(0.976, 0.933, 0.835);  // #f9f0d5
      vec3 creamMid   = vec3(0.933, 0.871, 0.756);  // #eedeC1
      vec3 ochre      = vec3(0.776, 0.596, 0.305);  // #c6984e

      // Underlayer paint-texture FBM
      float under = fbm(p * 2.2 + vec2(13.0, 7.0));
      float fine  = fbm(p * 8.0);
      float paint = mix(under, fine, 0.35);

      vec3 col = mix(creamLight, creamMid, smoothstep(0.35, 0.75, paint));
      col = mix(col, ochre, smoothstep(0.78, 0.98, paint) * 0.35);

      // Subtle warm gradient — brighter top-left, deeper bottom-right.
      float grad = clamp(0.5 + 0.55 * (uv.x + (1.0 - uv.y)) * 0.5, 0.0, 1.0);
      col *= mix(0.92, 1.06, grad);

      // ---- Patina intensity ramps with time-on-page ----
      // maxes out at 300s (5 min)
      float t = clamp(uTimeOnPage / 300.0, 0.0, 1.0);
      float patinaMain = smoothstep(0.0, 1.0, t);

      // Non-uniform patina distribution (edges and corners first)
      vec2 d = uv - 0.5;
      float edge = smoothstep(0.15, 0.7, dot(d, d) * 2.2);  // 0 center, 1 corners
      float patSpatial = fbm(p * 3.5 + vec2(uTimeOnPage * 0.002, -uTimeOnPage * 0.001));
      float patMask = clamp(edge * 0.65 + patSpatial * 0.75, 0.0, 1.0);

      // Patina color — deep gold/bronze with a touch of green-olive
      vec3 patinaGold   = vec3(0.478, 0.318, 0.118); // #7a511e
      vec3 patinaBronze = vec3(0.298, 0.188, 0.078); // #4c3014

      vec3 patinaCol = mix(patinaGold, patinaBronze, patSpatial);
      float patinaStrength = patinaMain * patMask;
      col = mix(col, patinaCol, patinaStrength * 0.55);

      // ---- Oxidation rings: animated with t, concentric blobs ----
      // Rings anchored at a few offset centers — these become darker/warmer.
      float rings = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 c = vec2(sin(fi * 2.31) * 0.5, cos(fi * 1.73) * 0.35);
        float r = length(p - c);
        float ring = 0.5 + 0.5 * sin(r * (8.0 + fi * 3.0) - fi * 1.3);
        ring *= exp(-r * 1.2);
        rings += ring * (0.3 + 0.2 * fi);
      }
      rings *= patinaMain * 0.18;
      col = mix(col, patinaBronze, rings);

      // ---- Vignette that also intensifies with time ----
      float vig = smoothstep(0.55, 1.15, length(d * vec2(1.0, 1.15)));
      float vigStrength = 0.15 + 0.40 * patinaMain;
      col *= (1.0 - vig * vigStrength);

      // ---- Fine grain / paper tooth ----
      float grain = (hash(uv * uResolution.xy) - 0.5) * 0.035;
      col += grain;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry, material);
  scene.add(quad);

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w, h);
    renderer.render(scene, camera);
  }
  window.addEventListener('resize', onResize);

  // ---------- Reduced motion: fixed middle-warm patina, static caption ----------
  if (prefersReducedMotion) {
    renderer.render(scene, camera);
    if (meterEl) meterEl.textContent = 'Das ist dein Ort zum Bleiben.';
    return;
  }

  // ---------- Time accumulator: paused on hidden ----------
  let accumulated = 0;     // seconds
  let lastTick = performance.now();
  let lastSecondUpdate = -1;

  function tick() {
    requestAnimationFrame(tick);
    const now = performance.now();
    const dtMs = now - lastTick;
    lastTick = now;

    if (document.hidden) return; // pause accumulation, don't reset

    accumulated += dtMs / 1000;

    // Update uniform once per second only — patina is slow.
    const secs = Math.floor(accumulated);
    if (secs !== lastSecondUpdate) {
      lastSecondUpdate = secs;
      uniforms.uTimeOnPage.value = accumulated;
      renderer.render(scene, camera);
      updateMeter(accumulated);
    }
  }

  function updateMeter(secs) {
    if (!meterEl) return;
    const mins = Math.floor(secs / 60);
    if (mins < 1) {
      meterEl.textContent = 'Der Glanz wird gleich wärmer.';
    } else if (mins === 1) {
      meterEl.textContent = 'Du bist 1 Minute hier. Der Glanz wird wärmer.';
    } else if (mins < 5) {
      meterEl.textContent = `Du bist ${mins} Minuten hier. Der Glanz wird wärmer.`;
    } else {
      meterEl.textContent = `Du bist ${mins} Minuten hier. Die Patina hat sich gesetzt.`;
    }
  }

  // Handle visibility: reset the frame timer on return so we don't
  // dump a huge dt into the accumulator.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      lastTick = performance.now();
    }
  });

  // Initial paint.
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
