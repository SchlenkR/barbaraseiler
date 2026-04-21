// Barbara Sophia Sailer — v5-three
// WebGL "voice ribbon": flowing line geometry that reads like a sung phrase.
// Three.js ESM via esm.sh, degrades to CSS fallback when WebGL is unavailable.

import * as THREE from 'https://esm.sh/three@0.160.0';

// ----------------------------------------------------------------------------
// DOM WIRING (header, phone reveal, smooth scroll) — runs regardless of WebGL
// ----------------------------------------------------------------------------
const siteHeader = document.getElementById('siteHeader');
const hero = document.getElementById('hero');

if (siteHeader && hero) {
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e) return;
      // Show header when hero is mostly scrolled past
      if (e.intersectionRatio < 0.15) siteHeader.classList.add('visible');
      else siteHeader.classList.remove('visible');
    },
    { threshold: [0, 0.15, 0.5, 1] }
  );
  io.observe(hero);
}

// Phone reveal
const phoneBtn = document.getElementById('phoneRevealBtn');
const phoneWrap = document.getElementById('phoneReveal');
if (phoneBtn && phoneWrap) {
  phoneBtn.addEventListener('click', () => {
    const nr = '+49 555 1234567';
    phoneBtn.remove();
    const a = document.createElement('a');
    a.href = 'tel:+495551234567';
    a.textContent = nr;
    phoneWrap.appendChild(a);
  });
}

// ----------------------------------------------------------------------------
// WEBGL CAPABILITY CHECK
// ----------------------------------------------------------------------------
function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (_) {
    return false;
  }
}

const canvas = document.getElementById('voice-canvas');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!canvas || !webglSupported()) {
  hero?.classList.add('webgl-failed');
} else {
  initVoiceScene(canvas, { reduced: prefersReducedMotion });
}

// ----------------------------------------------------------------------------
// VOICE-RIBBON SCENE
// Concept: 6 parametric "breath lines" flowing horizontally like phrasing.
// Each line is a thin tube whose control points oscillate via summed sines —
// evoking the envelope of a sustained mezzo phrase. Subtle particle breath
// sparkles float through them. Camera reacts to mouse with gentle parallax.
// ----------------------------------------------------------------------------
function initVoiceScene(canvas, opts) {
  const reduced = !!opts?.reduced;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1028, 0.08);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Lights — a warm rim + cool fill + cream key to match palette
  const keyLight = new THREE.DirectionalLight(0xf6f1e6, 0.9);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x2ae2c9, 1.1);
  rimLight.position.set(-4, -2, 2);
  scene.add(rimLight);

  const ochreFill = new THREE.PointLight(0xe9a94b, 1.2, 16, 1.8);
  ochreFill.position.set(2, -1.5, 2.5);
  scene.add(ochreFill);

  scene.add(new THREE.AmbientLight(0x1a2048, 0.4));

  // ----- Ribbons -----
  const ribbonGroup = new THREE.Group();
  scene.add(ribbonGroup);

  const RIBBON_COUNT = reduced ? 3 : 6;
  const SEGMENTS = reduced ? 120 : 220;      // points along the length
  const TUBULAR_SEGS = reduced ? 80 : 140;   // tube longitudinal segments
  const RADIAL_SEGS = 6;                     // tube cross-section (low poly)

  const ribbons = [];

  // Palette mapped across ribbons: teal spectrum + cream accents
  const palette = [
    new THREE.Color(0x2ae2c9),
    new THREE.Color(0x7cf0dd),
    new THREE.Color(0xf6f1e6),
    new THREE.Color(0xe9a94b),
    new THREE.Color(0xeb6a7a),
    new THREE.Color(0x1bb8a1),
  ];

  // Parametric curve whose samples are rewritten each frame.
  class BreathCurve extends THREE.Curve {
    constructor() {
      super();
      this.points = new Array(SEGMENTS);
      for (let i = 0; i < SEGMENTS; i++) this.points[i] = new THREE.Vector3();
    }
    getPoint(t, target = new THREE.Vector3()) {
      // t in [0,1] — sample interpolated point
      const f = t * (SEGMENTS - 1);
      const i = Math.floor(f);
      const a = this.points[i];
      const b = this.points[Math.min(i + 1, SEGMENTS - 1)];
      const k = f - i;
      target.set(
        a.x + (b.x - a.x) * k,
        a.y + (b.y - a.y) * k,
        a.z + (b.z - a.z) * k
      );
      return target;
    }
  }

  for (let r = 0; r < RIBBON_COUNT; r++) {
    const curve = new BreathCurve();
    // Build initial geometry with straight baseline — it will be replaced each frame
    const initialGeom = new THREE.TubeGeometry(curve, TUBULAR_SEGS, 0.02, RADIAL_SEGS, false);
    const color = palette[r % palette.length];

    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.35,
      metalness: 0.2,
      transmission: 0.0,
      emissive: color.clone().multiplyScalar(0.25),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: r === 2 ? 0.95 : 0.72, // cream ribbon is the "lead voice"
    });

    const mesh = new THREE.Mesh(initialGeom, material);
    ribbonGroup.add(mesh);

    ribbons.push({
      curve,
      mesh,
      radius: r === 2 ? 0.035 : 0.018 + Math.random() * 0.012,
      // Each ribbon has its own phase and slight vertical offset
      phase: r * 0.8,
      yOffset: (r - (RIBBON_COUNT - 1) / 2) * 0.22,
      zOffset: (r % 2 === 0 ? -1 : 1) * (0.15 + r * 0.05),
      amp1: 0.45 + Math.random() * 0.2,
      amp2: 0.15 + Math.random() * 0.12,
      freq1: 0.7 + r * 0.08,
      freq2: 1.8 + r * 0.12,
      speed: 0.18 + r * 0.03,
    });
  }

  // Tilt whole ribbon group slightly for depth
  ribbonGroup.rotation.z = -0.08;
  ribbonGroup.rotation.y = 0.25;

  // ----- Breath particles -----
  let particles = null;
  if (!reduced) {
    const PCOUNT = 220;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(PCOUNT * 3);
    const seeds = new Float32Array(PCOUNT);
    for (let i = 0; i < PCOUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
      seeds[i] = Math.random();
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pmat = new THREE.PointsMaterial({
      size: 0.018,
      color: 0xf6f1e6,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    particles = new THREE.Points(geom, pmat);
    particles.userData.seeds = seeds;
    scene.add(particles);
  }

  // ----- Update ribbon geometry each frame -----
  function updateRibbon(r, time) {
    const pts = r.curve.points;
    const len = 6.5;
    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / (SEGMENTS - 1);
      const x = (t - 0.5) * len;

      // Envelope — ribbon fades towards both ends (like a breath)
      const envelope = Math.sin(t * Math.PI);

      // Summed sines that behave like a voice-waveform
      const y =
        r.yOffset +
        envelope *
          (Math.sin(x * r.freq1 + time * r.speed + r.phase) * r.amp1 +
            Math.sin(x * r.freq2 - time * r.speed * 1.4 + r.phase * 1.6) * r.amp2);

      const z =
        r.zOffset +
        envelope *
          (Math.cos(x * r.freq1 * 0.6 + time * r.speed * 0.7 + r.phase) * 0.3 +
            Math.sin(x * r.freq2 * 0.5 - time * 0.2 + r.phase) * 0.18);

      pts[i].set(x, y, z);
    }

    // Rebuild tube geometry — low-poly so this is cheap
    const newGeom = new THREE.TubeGeometry(r.curve, TUBULAR_SEGS, r.radius, RADIAL_SEGS, false);
    r.mesh.geometry.dispose();
    r.mesh.geometry = newGeom;
  }

  // ----- Pointer parallax -----
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ----- Resize -----
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('resize', resize);

  // ----- Animation loop with visibility + reduced-motion handling -----
  let running = true;
  let lastFrameTime = 0;
  const clock = new THREE.Clock();
  // Fixed frame shown in reduced-motion: render once at a pleasing t, then stop.
  const staticTime = 2.3;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);

    const now = performance.now();
    // Throttle to ~60fps cap (but avoid piling up if tab woke up)
    if (now - lastFrameTime < 14) return;
    lastFrameTime = now;

    const t = reduced ? staticTime : clock.getElapsedTime();

    for (const r of ribbons) updateRibbon(r, t);

    if (particles && !reduced) {
      const pos = particles.geometry.attributes.position.array;
      const seeds = particles.userData.seeds;
      for (let i = 0; i < seeds.length; i++) {
        const k = i * 3;
        // Gentle rightward drift + sine bob; wrap around
        pos[k] += 0.004 + seeds[i] * 0.004;
        pos[k + 1] += Math.sin(t * 0.6 + seeds[i] * 10) * 0.001;
        if (pos[k] > 7) pos[k] = -7;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.z = Math.sin(t * 0.05) * 0.02;
    }

    // Parallax
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    camera.position.x = pointer.x * 0.4;
    camera.position.y = -pointer.y * 0.25;
    camera.lookAt(0, 0, 0);

    // Whole-group breath — very slow zoom/rotate
    if (!reduced) {
      ribbonGroup.rotation.z = -0.08 + Math.sin(t * 0.15) * 0.02;
      ribbonGroup.position.y = Math.sin(t * 0.22) * 0.05;
    }

    renderer.render(scene, camera);
  }

  // Pause when tab hidden or hero off-screen to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      clock.start();
      lastFrameTime = 0;
      frame();
    }
  });

  const pauseIO = new IntersectionObserver((entries) => {
    const e = entries[0];
    if (!e) return;
    if (e.isIntersecting) {
      if (!running && !document.hidden) {
        running = true;
        clock.start();
        lastFrameTime = 0;
        frame();
      }
    } else {
      running = false;
    }
  }, { threshold: 0.01 });
  pauseIO.observe(canvas);

  // In reduced-motion: render one frame only, then stop the loop.
  if (reduced) {
    for (const r of ribbons) updateRibbon(r, staticTime);
    renderer.render(scene, camera);
    running = false;
  } else {
    frame();
  }

  // Surface fatal errors to the user via fallback
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
    hero?.classList.add('webgl-failed');
  });
}
