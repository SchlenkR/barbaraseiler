// v27 — Jahresleiste · Physics Timeline
//
// Twelve month-tokens drop onto a baseline and settle at their month-slot
// positions — like beads on a string. Matter.js drives the physics; we
// render the tokens ourselves on a 2D canvas for typographic control.
//
// Interactions:
//   - drop sequence on load (tokens fall with small delay)
//   - pointer-drag on a token (pan-y friendly on touch)
//   - tap → milestone note appears in the fixed note panel
//   - "neu werfen" shakes all tokens back into the air
//
// A11y / perf:
//   - prefers-reduced-motion → instant placement, no physics
//   - document.hidden → pause rAF
//   - resize → engine re-init with preserved state
//   - legal pages bail before any import

import Matter from 'https://esm.sh/matter-js@0.19.0?bundle';

// -------------------------------------------------
// Phone reveal — available on index + legal pages
// -------------------------------------------------
{
  const phoneBtn = document.getElementById('phoneRevealBtn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', () => {
      phoneBtn.textContent = '+49 (0)555 123 456 7';
      phoneBtn.disabled = true;
    }, { once: true });
  }
}

// -------------------------------------------------
// Form — client-side validation + graceful "submit"
// -------------------------------------------------
{
  const form = document.getElementById('probe-form');
  const note = document.getElementById('form-note');
  if (form && note) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      note.classList.remove('is-error');

      // Honeypot
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        return; // silently drop bots
      }

      if (!form.checkValidity()) {
        note.classList.add('is-error');
        note.textContent = 'Bitte Vorname, Name, E-Mail und eine Nachricht ausfüllen.';
        form.reportValidity();
        return;
      }

      // In this pitch-playground build we compose a mailto and pretend to send.
      const data = new FormData(form);
      const subject = encodeURIComponent('Probestunden-Anfrage — v27 (Jahresleiste)');
      const bodyLines = [
        `Hallo Barbara,`,
        ``,
        `mein Name: ${data.get('vorname') || ''} ${data.get('name') || ''}`.trim(),
        `E-Mail: ${data.get('email') || ''}`,
        ``,
        `Nachricht:`,
        `${data.get('nachricht') || ''}`,
        ``,
        `— bis bald!`
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));
      const href = `mailto:barbara@example.de?subject=${subject}&body=${body}`;

      note.textContent = 'Danke — dein Mail-Programm öffnet sich gleich.';
      // Slight delay so the note is readable before the client hijacks focus
      setTimeout(() => { window.location.href = href; }, 250);
    });
  }
}

// -------------------------------------------------
// Early exits
// -------------------------------------------------
if (document.body.classList.contains('legal')) {
  // Legal pages: nothing else to do.
} else {
  bootTimeline();
}

// -------------------------------------------------
// Timeline physics
// -------------------------------------------------
function bootTimeline() {
  const canvas = document.getElementById('timeline-canvas');
  const stage  = canvas && canvas.parentElement;
  const noteEl = document.getElementById('stage-note');
  const hintEl = document.getElementById('stage-hint');
  const reshakeBtn = document.getElementById('reshake-btn');
  if (!canvas || !stage) return;

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Twelve milestones. "caption" is what we show in the note panel.
  const MILESTONES = [
    { m:  1, label: 'M1',  caption: 'Atem findest du wieder.' },
    { m:  2, label: 'M2',  caption: 'Dein Ton trägt vom ersten Mal.' },
    { m:  3, label: 'M3',  caption: 'Erster Auftritt im Raum, nur wir.' },
    { m:  4, label: 'M4',  caption: 'Höhe, die nicht mehr zumacht.' },
    { m:  5, label: 'M5',  caption: 'Das erste Lied, das dir gehört.' },
    { m:  6, label: 'M6',  caption: 'Halbjahr — wir hören uns zurück.' },
    { m:  7, label: 'M7',  caption: 'Stimme im Alltag, nicht nur in Übung.' },
    { m:  8, label: 'M8',  caption: 'Wort und Ton rücken zusammen.' },
    { m:  9, label: 'M9',  caption: 'Du führst, nicht mehr die Angst.' },
    { m: 10, label: 'M10', caption: 'Ein Publikum, das du willst.' },
    { m: 11, label: 'M11', caption: 'Die Stimme, die andere an dir erkennen.' },
    { m: 12, label: 'M12', caption: 'Ein Jahr — und es fängt erst an.' }
  ];

  const COLOR = {
    bgTop:    '#f7f0df',
    bgBot:    '#e8dcc4',
    baseline: '#8c7452',
    tick:     '#b8a478',
    monthLbl: '#7a6a55',
    tokenFill: '#f7f0df',
    tokenFillActive: '#fff5e1',
    tokenStroke: '#6a4e2e',
    tokenInk:  '#201810',
    accent:    '#8a5a2c',
    shadow:    'rgba(47, 30, 10, .18)'
  };

  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);

  // Physics & render state — gets rebuilt on resize / reshake
  let engine, runner, world;
  let bodiesByMonth = new Map();   // m -> body
  let slotByMonth   = new Map();   // m -> {x,y} target
  let width = 0, height = 0;
  let cssW = 0, cssH = 0;
  let ctx = canvas.getContext('2d');
  let mouseConstraint = null;
  let activeMonth = null;          // highlighted token
  let rafId = null;
  let paused = false;
  let destroyed = false;
  let dropOrder = [];              // schedule of drops
  let dropIndex = 0;
  let dropTimer = 0;

  const { Engine, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

  init();
  wireGlobalEvents();

  // ---------- init / rebuild ----------
  function init() {
    layoutCanvas();
    buildWorld();
    schedulePointer();
    startLoop();
    updateHint('Die Monate landen gerade…');
  }

  function layoutCanvas() {
    const rect = stage.getBoundingClientRect();
    cssW = Math.max(320, Math.floor(rect.width));
    cssH = Math.max(260, Math.floor(rect.height));
    const dpr = DPR();
    canvas.width  = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width  = cssW;
    height = cssH;
  }

  function buildWorld() {
    // Tear down previous
    if (runner) { Runner.stop(runner); runner = null; }
    if (engine) { Engine.clear(engine); engine = null; }
    bodiesByMonth.clear();
    slotByMonth.clear();

    engine = Engine.create({ enableSleeping: false });
    world = engine.world;
    world.gravity.y = 1.1;

    // Slot geometry: baseline near bottom, 12 equally spaced x positions.
    const margin = Math.max(24, Math.min(56, width * 0.05));
    const usable = width - margin * 2;
    const baselineY = Math.round(height * 0.72);
    const tokenR = computeTokenRadius(usable);

    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12; // centered in each month-slice
      const x = Math.round(margin + usable * t);
      slotByMonth.set(i + 1, { x, y: baselineY - tokenR });
    }

    // Walls: floor (under baseline, so tokens settle above it) + sides + ceiling
    const wallThick = 200;
    const floorY = baselineY + tokenR;
    const floor = Bodies.rectangle(
      width / 2, floorY + wallThick / 2,
      width * 2, wallThick,
      { isStatic: true, friction: 0.9, restitution: 0.05 }
    );
    const leftWall = Bodies.rectangle(
      -wallThick / 2, height / 2,
      wallThick, height * 2,
      { isStatic: true }
    );
    const rightWall = Bodies.rectangle(
      width + wallThick / 2, height / 2,
      wallThick, height * 2,
      { isStatic: true }
    );
    const ceiling = Bodies.rectangle(
      width / 2, -wallThick / 2 - 100,
      width * 4, wallThick,
      { isStatic: true }
    );
    Composite.add(world, [floor, leftWall, rightWall, ceiling]);

    // Tokens
    const startY = -40;
    for (const ms of MILESTONES) {
      const slot = slotByMonth.get(ms.m);
      // Spread drops across the top, slight jitter so they don't fall in a straight column
      const xStart = slot.x + (Math.random() - 0.5) * 40;
      const body = Bodies.circle(xStart, startY - Math.random() * 120, tokenR, {
        restitution: 0.45,
        friction: 0.05,
        frictionAir: 0.015,
        density: 0.0025,
        label: 'token:' + ms.m,
        plugin: { month: ms.m, radius: tokenR, milestone: ms }
      });
      // Start frozen until scheduled drop
      Body.setStatic(body, true);
      bodiesByMonth.set(ms.m, body);
      Composite.add(world, body);
    }

    // Drop schedule (or instant for reduced-motion)
    if (prefersReducedMotion) {
      // Place each token directly at its slot
      for (const ms of MILESTONES) {
        const b = bodiesByMonth.get(ms.m);
        const slot = slotByMonth.get(ms.m);
        Body.setPosition(b, { x: slot.x, y: slot.y });
        Body.setStatic(b, true);
      }
      dropOrder = [];
      updateHint('Zwölf Monate, zwölf Meilensteine.');
    } else {
      // Randomize the visual order of drops, but not the destinations
      dropOrder = MILESTONES.map(m => m.m).sort(() => Math.random() - 0.5);
      dropIndex = 0;
      dropTimer = 0;
    }

    // Runner
    runner = Runner.create();
    Runner.run(runner, engine);

    // Magnetic pull: after drop, gently nudge each token toward its slot
    // (purely gravity-fed settling is too chaotic with 12 bodies).
    Events.on(engine, 'beforeUpdate', () => {
      for (const ms of MILESTONES) {
        const b = bodiesByMonth.get(ms.m);
        if (!b || b.isStatic) continue;
        const slot = slotByMonth.get(ms.m);
        const dx = slot.x - b.position.x;
        // Horizontal "spring" pulling the token toward its slot x.
        const strength = 0.00018 * b.mass;
        Body.applyForce(b, b.position, { x: dx * strength, y: 0 });
      }
    });
  }

  function computeTokenRadius(usable) {
    // Fit 12 tokens across `usable` width, with breathing room. Min 18, max 34.
    const slotWidth = usable / 12;
    return Math.max(18, Math.min(34, Math.floor(slotWidth * 0.42)));
  }

  // ---------- pointer ----------
  function schedulePointer() {
    if (prefersReducedMotion) return;

    const mouse = Mouse.create(canvas);
    // Pointer-events on the canvas itself (Matter uses mouse events internally;
    // but we also bind pointerdown/up below for tap highlight).
    mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        damping: 0.15,
        render: { visible: false }
      }
    });
    Composite.add(world, mouseConstraint);

    // Tap highlight: use pointerdown on canvas, hit-test against bodies
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerHover);
    canvas.addEventListener('pointerleave', () => {
      canvas.style.cursor = 'default';
    });
  }

  function pointerPos(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  function findTokenAt(px, py) {
    for (const ms of MILESTONES) {
      const b = bodiesByMonth.get(ms.m);
      if (!b) continue;
      const r = b.plugin.radius;
      const dx = b.position.x - px;
      const dy = b.position.y - py;
      if (dx * dx + dy * dy <= r * r) return b;
    }
    return null;
  }

  function onPointerDown(ev) {
    const p = pointerPos(ev);
    const hit = findTokenAt(p.x, p.y);
    if (hit) {
      setActiveMonth(hit.plugin.month, hit.plugin.milestone);
    }
  }

  function onPointerHover(ev) {
    const p = pointerPos(ev);
    const hit = findTokenAt(p.x, p.y);
    canvas.style.cursor = hit ? 'grab' : 'default';
  }

  function setActiveMonth(m, ms) {
    activeMonth = m;
    if (!noteEl) return;
    noteEl.classList.remove('is-empty');
    const tag = noteEl.querySelector('.note-tag');
    const text = noteEl.querySelector('.note-text');
    if (tag)  tag.textContent = ms.label;
    if (text) text.textContent = '— ' + ms.caption;
  }

  // ---------- drops & loop ----------
  function stepDrops(dt) {
    if (prefersReducedMotion) return;
    if (dropIndex >= dropOrder.length) return;
    dropTimer += dt;
    const DROP_INTERVAL = 140; // ms between drops
    while (dropTimer >= DROP_INTERVAL && dropIndex < dropOrder.length) {
      dropTimer -= DROP_INTERVAL;
      const m = dropOrder[dropIndex++];
      const b = bodiesByMonth.get(m);
      if (b) {
        Body.setStatic(b, false);
        Body.setVelocity(b, { x: (Math.random() - 0.5) * 1.5, y: 0 });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.08);
      }
      if (dropIndex === dropOrder.length) {
        setTimeout(() => updateHint('Tipp ein Token an — dann erzählen sie.'), 900);
      }
    }
  }

  function startLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    let last = performance.now();
    const tick = (now) => {
      if (destroyed) return;
      const dt = Math.min(64, now - last);
      last = now;
      if (!paused) {
        stepDrops(dt);
        draw();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  // ---------- render ----------
  function draw() {
    // Background gradient (cheap — done every frame for simplicity)
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, COLOR.bgTop);
    g.addColorStop(1, COLOR.bgBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // Baseline: thin line with month ticks + month numerals
    const margin = Math.max(24, Math.min(56, width * 0.05));
    const usable = width - margin * 2;
    const baselineY = Math.round(height * 0.72);

    // Soft band along the baseline
    ctx.fillStyle = 'rgba(138, 90, 44, 0.06)';
    ctx.fillRect(margin - 8, baselineY - 1.5, usable + 16, 14);

    // Baseline stroke
    ctx.strokeStyle = COLOR.baseline;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(margin, baselineY);
    ctx.lineTo(margin + usable, baselineY);
    ctx.stroke();

    // Ticks + month numerals
    ctx.fillStyle = COLOR.monthLbl;
    ctx.strokeStyle = COLOR.tick;
    ctx.lineWidth = 1;
    ctx.font = '500 11px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12;
      const x = Math.round(margin + usable * t);
      ctx.beginPath();
      ctx.moveTo(x, baselineY);
      ctx.lineTo(x, baselineY + 6);
      ctx.stroke();
      ctx.fillText(String(i + 1), x, baselineY + 10);
    }

    // "Start" / "Jahr" labels at both ends
    ctx.font = 'italic 400 12px "Fraunces", serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.monthLbl;
    ctx.fillText('Anfang', margin, baselineY + 26);
    ctx.textAlign = 'right';
    ctx.fillText('ein Jahr später', margin + usable, baselineY + 26);

    // Tokens
    for (const ms of MILESTONES) {
      const b = bodiesByMonth.get(ms.m);
      if (!b) continue;
      const isActive = activeMonth === ms.m;
      drawToken(ctx, b.position.x, b.position.y, b.angle, b.plugin.radius, ms.label, isActive);
    }
  }

  function drawToken(ctx, x, y, angle, r, label, active) {
    // Shadow
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Drop-shadow
    ctx.fillStyle = COLOR.shadow;
    ctx.beginPath();
    ctx.arc(0, 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    grad.addColorStop(0, active ? '#fffaea' : '#fff7e8');
    grad.addColorStop(1, active ? '#f0d9a8' : '#ead9b3');
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim
    ctx.lineWidth = active ? 1.8 : 1.2;
    ctx.strokeStyle = active ? COLOR.accent : COLOR.tokenStroke;
    ctx.stroke();

    // Inner hairline
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = active ? 'rgba(138,90,44,.55)' : 'rgba(106,78,46,.35)';
    ctx.stroke();

    // Label (upright-ish — we counter-rotate only a bit, letting motion feel natural)
    // For small rotations we render as-is; past ±0.5rad we counter-rotate for readability.
    if (Math.abs(angle) > 0.5) {
      ctx.rotate(-angle);
    }
    ctx.fillStyle = COLOR.tokenInk;
    const size = Math.max(10, Math.round(r * 0.48));
    ctx.font = `italic 500 ${size}px "Fraunces", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 1);

    ctx.restore();
  }

  // ---------- hint text ----------
  function updateHint(text) {
    if (hintEl) hintEl.textContent = text;
  }

  // ---------- reshake ----------
  function reshake() {
    if (prefersReducedMotion) return;
    activeMonth = null;
    if (noteEl) {
      noteEl.classList.add('is-empty');
      const tag = noteEl.querySelector('.note-tag');
      const text = noteEl.querySelector('.note-text');
      if (tag) tag.textContent = 'Tipp ein Token an';
      if (text) text.textContent = '— und lies, was in dem Monat passiert.';
    }
    for (const ms of MILESTONES) {
      const b = bodiesByMonth.get(ms.m);
      if (!b) continue;
      Body.setStatic(b, false);
      Body.setPosition(b, {
        x: Math.random() * width,
        y: -20 - Math.random() * 200
      });
      Body.setVelocity(b, {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 2
      });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.12);
    }
    updateHint('Die Monate landen gerade…');
    setTimeout(() => updateHint('Tipp ein Token an — dann erzählen sie.'), 1800);
  }

  // ---------- global events ----------
  function wireGlobalEvents() {
    if (reshakeBtn) reshakeBtn.addEventListener('click', reshake);

    // Visibility pause
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
    });

    // Debounced resize: full rebuild
    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        layoutCanvas();
        buildWorld();
        // Re-wire pointer (Mouse is bound to canvas rect; rebuild catches new size)
        if (mouseConstraint) {
          Composite.remove(world, mouseConstraint);
          mouseConstraint = null;
        }
        schedulePointer();
      });
    });

    // Page unload: stop
    window.addEventListener('pagehide', () => {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (runner) Runner.stop(runner);
    });
  }
}
