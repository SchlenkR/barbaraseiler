// v30-feedback — two sliders drive a Canvas 2D particle field + pathway caption.
// No external dependencies. ES module.

const s1El = document.getElementById('s1');
const s2El = document.getElementById('s2');
const s1Out = document.getElementById('s1-out');
const s2Out = document.getElementById('s2-out');
const s1Phrase = document.getElementById('s1-phrase');
const s2Phrase = document.getElementById('s2-phrase');
const captionTitle = document.getElementById('captionTitle');
const captionLine = document.getElementById('captionLine');
const pathCta = document.getElementById('pathCta');
const pathWhats = document.getElementById('pathWhats');
const pfadInput = document.getElementById('pfad');
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const pathCards = document.querySelectorAll('.path-card');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- pathway logic ----------

const PATHWAYS = {
  einsteiger: {
    title: 'Einsteiger*in',
    line: 'Nichts zu verlieren, alles zu entdecken.',
    wa: 'Einsteiger*in'
  },
  'freie-stimme': {
    title: 'Freie Stimme',
    line: 'Du singst bereits. Barbara gibt dir die Technik dazu.',
    wa: 'Freie Stimme'
  },
  wiedereinstieg: {
    title: 'Vorsichtig Wiedereinsteigen',
    line: 'Still anfangen. Kein Publikum, nur ein Raum.',
    wa: 'Vorsichtig Wiedereinsteigen'
  },
  auftritt: {
    title: 'Auftritts-Coaching',
    line: 'Die Stimme sitzt. Wir arbeiten am Rest.',
    wa: 'Auftritts-Coaching'
  }
};

function quadrant(v1, v2) {
  // v1 = singing frequency, v2 = stage nerves
  const hi1 = v1 >= 50;
  const hi2 = v2 >= 50;
  if (!hi1 && !hi2) return 'einsteiger';
  if (hi1 && !hi2) return 'freie-stimme';
  if (!hi1 && hi2) return 'wiedereinstieg';
  return 'auftritt';
}

function phrase1(v) {
  if (v < 10) return 'Innerlich, fast nie';
  if (v < 30) return 'Unter der Dusche, im Auto manchmal';
  if (v < 55) return 'Oft, wenn keiner zuhört';
  if (v < 80) return 'Regelmäßig, auch mit Leuten';
  return 'Jeden Tag, laut, aus vollem Hals';
}
function phrase2(v) {
  if (v < 10) return 'Null Nervosität, ich mag das';
  if (v < 30) return 'Kurz Kribbeln, dann weg';
  if (v < 55) return 'Das Herz klopft vernehmlich';
  if (v < 80) return 'Hände kalt, Stimme bricht';
  return 'Ich würde lieber ausweichen';
}

function render() {
  const v1 = Number(s1El.value);
  const v2 = Number(s2El.value);
  s1Out.textContent = v1;
  s2Out.textContent = v2;
  s1Phrase.textContent = phrase1(v1);
  s2Phrase.textContent = phrase2(v2);

  const q = quadrant(v1, v2);
  const p = PATHWAYS[q];
  captionTitle.textContent = p.title;
  captionLine.textContent = p.line;
  if (pfadInput) pfadInput.value = p.title;
  pathCta.href = `#probestunde`;
  pathCta.textContent = `Probestunde buchen · ${p.title} · 40 €`;
  const msg = encodeURIComponent(
    `Hallo Barbara, ich interessiere mich für eine Probestunde. Mein Weg: ${p.wa}.`
  );
  pathWhats.href = `https://wa.me/495551234567?text=${msg}`;

  pathCards.forEach((c) => {
    c.classList.toggle('is-active', c.dataset.quadrant === q);
  });

  // Feed particle config
  particleConfig.v1 = v1;
  particleConfig.v2 = v2;
}

s1El.addEventListener('input', render);
s2El.addEventListener('input', render);

// Prevent page scroll while touching sliders.
[s1El, s2El].forEach((el) => {
  el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
});

// ---------- canvas particles ----------

const particleConfig = {
  v1: Number(s1El.value),
  v2: Number(s2El.value)
};

let particles = [];
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

function isMobile() { return window.innerWidth < 720; }
function particleCount() { return isMobile() ? 200 : 360; }

function resize() {
  const rect = canvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  if (particles.length !== particleCount()) {
    particles = [];
    const count = particleCount();
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0,
        vy: 0,
        ox: Math.random() * W,
        oy: Math.random() * H,
        seed: Math.random() * 1000,
        r: 0.8 + Math.random() * 1.8
      });
    }
  }
}

// Hand-rolled smooth noise (value-noise) with bilinear interp.
function hash2(ix, iy, seed) {
  let h = (ix * 374761393) ^ (iy * 668265263) ^ (seed * 2246822519);
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 4294967295) * 2 - 1; // -1..1
}
function smooth(t) { return t * t * (3 - 2 * t); }
function noise2(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  const sx = smooth(fx), sy = smooth(fy);
  const top = a + (b - a) * sx;
  const bot = c + (d - c) * sx;
  return top + (bot - top) * sy;
}

// cream → coral → indigo color ramp
// t in [0,1]
function rampColor(t, alpha) {
  // stops: cream (246,239,228), coral (232,106,81), indigo (31,29,58)
  const stops = [
    [246, 239, 228],
    [232, 106, 81],
    [31, 29, 58]
  ];
  const clamp = Math.max(0, Math.min(1, t));
  const idxF = clamp * (stops.length - 1);
  const i = Math.floor(idxF);
  const f = idxF - i;
  const a = stops[i];
  const b = stops[Math.min(stops.length - 1, i + 1)];
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgba(${r},${g},${bl},${alpha})`;
}

let t = 0;
let rafId = null;

function draw() {
  // Flow speed depends on v1 (singing frequency)
  const v1n = particleConfig.v1 / 100;
  const v2n = particleConfig.v2 / 100;
  const flow = 0.0004 + v1n * 0.0022; // bigger = faster field
  const coherence = 1 - v2n; // high v2 = more chaos
  const warp = 0.5 + v2n * 1.8; // domain-warp magnitude
  const speed = 0.2 + v1n * 1.8;

  // Fade trail (warmer when v1+v2 high)
  const fadeAlpha = 0.08 + (1 - coherence) * 0.04;
  ctx.fillStyle = `rgba(246, 239, 228, ${fadeAlpha})`;
  ctx.fillRect(0, 0, W, H);

  t += flow;

  const scale = 0.0028;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // Domain-warp: use a noise to distort inputs to the main flow noise.
    const wx = noise2(p.x * scale + 10, p.y * scale + 10, 7) * warp;
    const wy = noise2(p.x * scale + 31, p.y * scale + 31, 13) * warp;
    const n = noise2(p.x * scale + wx + t, p.y * scale + wy + t, 1);
    const angle = n * Math.PI * 2;

    // Chaos adds random jitter at low coherence
    const jitter = (1 - coherence) * 0.6;
    const jx = (Math.random() - 0.5) * jitter;
    const jy = (Math.random() - 0.5) * jitter;

    p.vx = Math.cos(angle) * speed + jx;
    p.vy = Math.sin(angle) * speed + jy;
    p.x += p.vx;
    p.y += p.vy;

    // Wrap
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    if (p.y < -10) p.y = H + 10;
    if (p.y > H + 10) p.y = -10;

    // Color temp = f(v1 + v2)
    const temp = (v1n * 0.5 + v2n * 0.5);
    // Slight per-particle variance
    const localTemp = Math.max(0, Math.min(1, temp + (n * 0.15)));
    ctx.fillStyle = rampColor(localTemp, 0.55);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  if (!document.hidden) draw();
  rafId = requestAnimationFrame(loop);
}

function drawStatic() {
  // Reduced-motion fallback: paint once, evenly colored.
  ctx.fillStyle = 'rgba(246, 239, 228, 1)';
  ctx.fillRect(0, 0, W, H);
  const v1n = particleConfig.v1 / 100;
  const v2n = particleConfig.v2 / 100;
  const temp = (v1n * 0.5 + v2n * 0.5);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const localTemp = Math.max(0, Math.min(1, temp + (Math.sin(p.seed) * 0.1)));
    ctx.fillStyle = rampColor(localTemp, 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Re-paint static on each slider change (reduced motion only).
if (reducedMotion) {
  s1El.addEventListener('input', () => requestAnimationFrame(drawStatic));
  s2El.addEventListener('input', () => requestAnimationFrame(drawStatic));
}

// ---------- lifecycle ----------

window.addEventListener('resize', () => {
  resize();
  if (reducedMotion) drawStatic();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  } else if (!reducedMotion && !rafId) {
    loop();
  }
});

// Init
resize();
render();
if (reducedMotion) {
  drawStatic();
} else {
  loop();
}

// ---------- phone reveal (spam protection) ----------

const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    phoneBtn.outerHTML = '<a class="btn btn-ghost" href="tel:+495551234567">+49 (0)555 123 456 7</a>';
  });
}
