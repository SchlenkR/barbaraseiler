// v25-opera-scenes
// A single full-viewport fragment shader persists across scene changes.
// Each scene has its own colour palette (uPaletteA, uPaletteB, uPaletteC).
// Transitions are animated via a custom JS lerp on uTransition (0 -> 1 over 0.8s),
// which triggers a chromatic-aberration + radial displacement curtain in the fragment.
// Content <section>s are cross-faded (opacity + translateY) synchronised with the shader.

import * as THREE from 'https://unpkg.com/three@0.160/build/three.module.js';

const SCENES = ['empfang', 'studio', 'buehne', 'verabredung'];

// Palettes per scene: [base, mid, highlight] — RGB in 0..1.
const PALETTES = {
  empfang: [
    [0.94, 0.88, 0.78], // warm cream base
    [0.82, 0.65, 0.43], // amber mid
    [0.63, 0.34, 0.11], // deep amber highlight
  ],
  studio: [
    [0.06, 0.17, 0.17], // deep teal base
    [0.14, 0.32, 0.30], // teal mid
    [0.88, 0.68, 0.38], // candle-warm highlight
  ],
  buehne: [
    [0.16, 0.04, 0.05], // deep maroon base
    [0.55, 0.09, 0.12], // stage red mid
    [0.96, 0.78, 0.38], // gold highlight
  ],
  verabredung: [
    [0.23, 0.10, 0.14], // ink base
    [0.72, 0.38, 0.35], // rose mid
    [0.98, 0.66, 0.52], // sunset highlight
  ],
};

// Legal pages bail early — no shader at all.
if (document.body.classList.contains('legal')) {
  // no-op, legal layout is pure CSS.
} else {
  initOpera();
}

function initOpera() {
  const canvas = document.getElementById('scene-canvas');
  const sections = Array.from(document.querySelectorAll('.scene[data-scene]'));
  const navLinks = Array.from(document.querySelectorAll('[data-scene-link]'));
  if (!canvas || sections.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene activation works without the shader — the DOM [data-active] + [data-current]
  // transitions still run (CSS handles both). On reduced motion we don't attach any
  // click handlers so the anchors scroll the stacked page naturally.
  if (prefersReduced) {
    // Ensure all scenes are visible + nav highlights current section while scrolling.
    sections.forEach((s) => s.setAttribute('data-active', ''));
    markCurrentNav(currentSceneFromHash());
    window.addEventListener('hashchange', () => markCurrentNav(currentSceneFromHash()));
    return;
  }

  // === WebGL setup ===
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  } catch (err) {
    // No WebGL — degrade: just show scenes via DOM-only logic.
    sections.forEach((s) => s.removeAttribute('data-active'));
    activateDomOnly(currentSceneFromHash());
    return;
  }

  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const maxDpr = isMobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Start state: empfang -> empfang (no transition). paletteFrom == paletteTo.
  const startScene = currentSceneFromHash();
  const startPal = PALETTES[startScene];

  const uniforms = {
    uTime:        { value: 0 },
    uResolution:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTransition:  { value: 0 },      // 0..1 during a scene change
    uFromA:       { value: new THREE.Vector3(...startPal[0]) },
    uFromB:       { value: new THREE.Vector3(...startPal[1]) },
    uFromC:       { value: new THREE.Vector3(...startPal[2]) },
    uToA:         { value: new THREE.Vector3(...startPal[0]) },
    uToB:         { value: new THREE.Vector3(...startPal[1]) },
    uToC:         { value: new THREE.Vector3(...startPal[2]) },
  };

  const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment shader strategy:
  // 1. Build a slow domain-warped fBm "curtain field" per palette (from + to).
  // 2. Compute a transition mask based on a radial wave expanding from centre, shaped by
  //    a curtain-like sine displacement. The mask says: "which pixels have dissolved yet?"
  // 3. Chromatic aberration during transition: sample the to-colour three times with
  //    slightly offset UV per channel; offsets are strongest around the curtain edge,
  //    producing an R/G/B split that peaks at the dissolve boundary.
  const fragmentShader = /* glsl */`
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uTransition;   // 0..1 during scene change
    uniform vec3  uFromA;
    uniform vec3  uFromB;
    uniform vec3  uFromC;
    uniform vec3  uToA;
    uniform vec3  uToB;
    uniform vec3  uToC;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.03; a *= 0.5;
      }
      return v;
    }

    // Atmospheric field — slow domain warp, palette-tinted.
    vec3 atmos(vec2 uv, vec3 A, vec3 B, vec3 C, float aspect, float t) {
      vec2 p = uv * vec2(aspect, 1.0) * 2.0;
      vec2 w1 = vec2(fbm(p + vec2(0.0, t * 0.04)), fbm(p + vec2(5.2, t * 0.03 + 1.7)));
      vec2 w2 = vec2(fbm(p * 1.7 + w1), fbm(p * 1.7 + w1 + 3.1));
      float f = fbm(p + w2 * 0.7);
      // Palette ramp A -> B -> C by f.
      vec3 col = (f < 0.5)
        ? mix(A, B, smoothstep(0.0, 0.5, f))
        : mix(B, C, smoothstep(0.5, 1.0, f));
      // Painterly grain (low amplitude so reduced-motion-ish surfaces still calm).
      float grain = (hash(uv * uResolution.xy + t) - 0.5) * 0.025;
      return col + grain;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      float t = uTime;

      // From-scene and to-scene atmospheric fields.
      vec3 colFrom = atmos(uv, uFromA, uFromB, uFromC, aspect, t);

      // CURTAIN MASK:
      // Centre-radial wave that sweeps outward as uTransition grows, modulated by a
      // vertical sine so the boundary ripples like a stage curtain.
      vec2 c = uv - 0.5;
      c.x *= aspect;
      float r = length(c);
      // Curtain wobble: horizontal bands that offset the radius — gives a "curtain folds"
      // look rather than a clean circle.
      float wobble = 0.06 * sin(uv.y * 18.0 + t * 1.2) + 0.04 * sin(uv.y * 6.0 - t * 0.7);
      float mask = smoothstep(uTransition * 1.6 - 0.15, uTransition * 1.6 + 0.15, r + wobble);
      // When uTransition == 0, mask is ~1 everywhere (only from). When == 1, ~0 everywhere (only to).

      // CHROMATIC ABERRATION: strongest exactly at the moving boundary.
      // Boundary proximity = how close this pixel is to mask == 0.5.
      float edge = 1.0 - abs(mask - 0.5) * 2.0; // 1 at the edge, 0 far from it
      float chromaBoost = edge * (1.0 - abs(uTransition - 0.5) * 2.0); // also peaks mid-transition
      // Direction away from centre for the colour split.
      vec2 dir = normalize(c + vec2(0.0001));
      float amt = 0.015 * chromaBoost;

      // Sample the to-field three times with per-channel offsets.
      vec3 toR = atmos(uv + dir * amt * 1.2, uToA, uToB, uToC, aspect, t);
      vec3 toG = atmos(uv,                    uToA, uToB, uToC, aspect, t);
      vec3 toB = atmos(uv - dir * amt * 1.2, uToA, uToB, uToC, aspect, t);
      vec3 colTo = vec3(toR.r, toG.g, toB.b);

      // Radial displacement of the from-field too, to sell the "curtain lifting" feel.
      vec3 colFromDisp = atmos(uv + dir * amt * 0.6, uFromA, uFromB, uFromC, aspect, t);

      vec3 col = mix(colTo, mix(colFrom, colFromDisp, chromaBoost), mask);

      // Soft vignette shared across scenes.
      vec2 v = uv - 0.5;
      v.x *= aspect;
      float vig = smoothstep(1.2, 0.3, length(v));
      col *= mix(0.7, 1.05, vig);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    depthTest: false, depthWrite: false, transparent: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  // === Scene transition state machine ===
  let activeScene = startScene;
  let transitionStart = 0;
  let transitioning = false;
  const TRANSITION_MS = 800;

  setBodyScene(activeScene);
  markCurrentNav(activeScene);
  setActiveSection(activeScene, /* immediate = */ true);

  function applyPaletteInstant(pal) {
    uniforms.uFromA.value.set(...pal[0]);
    uniforms.uFromB.value.set(...pal[1]);
    uniforms.uFromC.value.set(...pal[2]);
    uniforms.uToA.value.set(...pal[0]);
    uniforms.uToB.value.set(...pal[1]);
    uniforms.uToC.value.set(...pal[2]);
    uniforms.uTransition.value = 0;
  }
  applyPaletteInstant(PALETTES[activeScene]);

  function startTransition(toScene) {
    if (toScene === activeScene || transitioning) return;
    const fromPal = PALETTES[activeScene];
    const toPal = PALETTES[toScene];
    uniforms.uFromA.value.set(...fromPal[0]);
    uniforms.uFromB.value.set(...fromPal[1]);
    uniforms.uFromC.value.set(...fromPal[2]);
    uniforms.uToA.value.set(...toPal[0]);
    uniforms.uToB.value.set(...toPal[1]);
    uniforms.uToC.value.set(...toPal[2]);
    uniforms.uTransition.value = 0;
    transitionStart = performance.now();
    transitioning = true;

    // Cross-fade DOM sections: at ~50% of transition, swap which <section> is [data-active].
    // This keeps the content swap hidden inside the shader's bright-chroma peak.
    setTimeout(() => setActiveSection(toScene, false), TRANSITION_MS * 0.45);
    // Body background / theme-colour lags slightly behind.
    setTimeout(() => setBodyScene(toScene), TRANSITION_MS * 0.4);
    markCurrentNav(toScene);

    activeScene = toScene;
    if (window.location.hash !== '#' + toScene) {
      history.pushState(null, '', '#' + toScene);
    }
  }

  // === Event bindings ===
  navLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('data-scene-link');
      if (!SCENES.includes(target)) return;
      e.preventDefault();
      startTransition(target);
    });
  });

  window.addEventListener('hashchange', () => {
    const s = currentSceneFromHash();
    if (s !== activeScene) startTransition(s);
  });

  // Resize — debounced via rAF.
  let resizeScheduled = false;
  window.addEventListener('resize', () => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      resizeScheduled = false;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mob = window.matchMedia('(max-width: 640px)').matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1.5 : 2));
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    });
  });

  // Visibility pause — save battery.
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  const startT = performance.now();
  function frame() {
    if (!running) return;
    const now = performance.now();
    uniforms.uTime.value = (now - startT) / 1000;
    if (transitioning) {
      const k = Math.min((now - transitionStart) / TRANSITION_MS, 1);
      // Custom easeInOut lerp — shapes uTransition as an s-curve so the chroma peak is mid-way.
      uniforms.uTransition.value = k < 0.5
        ? 2 * k * k
        : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (k >= 1) {
        transitioning = false;
        // After transition, "from" becomes identical to "to" so idle rendering is stable.
        applyPaletteInstant(PALETTES[activeScene]);
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // === Phone reveal (spam protection pattern) ===
  const btn = document.getElementById('phoneRevealBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      btn.outerHTML = '<a class="chip" href="tel:+495551234567">+49 (0)555 – 123 456 7</a>';
    });
  }
}

// === Helpers (shared across the module) ===

function currentSceneFromHash() {
  const raw = (window.location.hash || '').replace('#', '');
  return SCENES.includes(raw) ? raw : 'empfang';
}

function setActiveSection(name, immediate) {
  const all = document.querySelectorAll('.scene[data-scene]');
  all.forEach((s) => {
    if (s.getAttribute('data-scene') === name) s.setAttribute('data-active', '');
    else s.removeAttribute('data-active');
  });
  if (immediate) {
    // Ensure focus starts at the top of the scene on first paint.
    window.scrollTo(0, 0);
  }
}

function setBodyScene(name) {
  document.body.setAttribute('data-scene', name);
}

function markCurrentNav(name) {
  document.querySelectorAll('[data-scene-link]').forEach((a) => {
    if (a.getAttribute('data-scene-link') === name) a.setAttribute('data-current', '');
    else a.removeAttribute('data-current');
  });
}

function activateDomOnly(name) {
  setActiveSection(name, true);
  setBodyScene(name);
  markCurrentNav(name);
}
