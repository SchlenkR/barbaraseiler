// v21-stimmfach — Physics-Pile of voice-category pills.
// Matter.js UMD (loaded by <script> in index.html) exposes window.Matter.
// This module: bail early on legal pages, respect prefers-reduced-motion,
// set up the canvas, the engine, the pills, mouse/touch drag, and the
// afterRender label pass.

(() => {
  // ---- Phone reveal (used on index.html + legal if button present) ----
  const phoneBtn = document.getElementById('phoneRevealBtn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', () => {
      const tel = '+49 (0)555 – 123 456 7';
      phoneBtn.textContent = tel;
      phoneBtn.disabled = true;
    }, { once: true });
  }

  // ---- Bail on legal pages: no physics, no canvas ----
  if (document.body.classList.contains('legal')) return;

  const canvas = document.getElementById('stimmfach-canvas');
  if (!canvas) return;

  // ---- Reduced motion: no engine ----
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    canvas.remove();
    return;
  }

  // ---- Wait for Matter to load (UMD script tag is before the module) ----
  const Matter = window.Matter;
  if (!Matter) {
    // Matter failed to load (offline, blocked) — hide canvas, fallback section
    // below the fold carries the meaning.
    canvas.remove();
    return;
  }

  const { Engine, Render, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

  // ---- Pill config ----
  const PILLS = [
    { label: 'Koloratur',    color: '#f4e7c8', ink: '#3a2f1a' }, // cream
    { label: 'Mezzo',        color: '#f6cfa9', ink: '#3a2814' }, // peach
    { label: 'Bariton',      color: '#c9d6b5', ink: '#1e2a15' }, // sage
    { label: 'Sprechstimme', color: '#d6cae0', ink: '#241a32' }, // lavender
    { label: 'Kirche',       color: '#e2a58a', ink: '#331a12' }, // terracotta
    { label: 'Musical',      color: '#f6e19a', ink: '#3a2f10' }, // butter
    { label: 'Pop',          color: '#f2c5c5', ink: '#3a1c1c' }, // blush
    { label: 'Chor',         color: '#bfdecb', ink: '#122b1e' }, // mint
    { label: 'Berufsredner', color: '#a9b0c6', ink: '#1a1c26' }  // dusk
  ];

  // ---- Engine & renderer ----
  const engine = Engine.create({ enableSleeping: false });
  engine.world.gravity.y = 1;

  let width = canvas.clientWidth || window.innerWidth;
  let height = canvas.clientHeight || (window.innerHeight - 62);

  const render = Render.create({
    canvas,
    engine,
    options: {
      width,
      height,
      pixelRatio: window.devicePixelRatio || 1,
      wireframes: false,
      background: 'transparent'
    }
  });

  // ---- Build walls (floor, left, right, ceiling just in case) ----
  const WALL_THICKNESS = 200;
  let floor, leftWall, rightWall, ceiling;

  function makeWalls() {
    floor = Bodies.rectangle(width / 2, height + WALL_THICKNESS / 2 - 2, width * 2, WALL_THICKNESS, {
      isStatic: true, render: { visible: false }
    });
    leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, {
      isStatic: true, render: { visible: false }
    });
    rightWall = Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height * 2, {
      isStatic: true, render: { visible: false }
    });
    ceiling = Bodies.rectangle(width / 2, -WALL_THICKNESS / 2, width * 2, WALL_THICKNESS, {
      isStatic: true, render: { visible: false }
    });
    Composite.add(engine.world, [floor, leftWall, rightWall, ceiling]);
  }
  makeWalls();

  // ---- Measure text with a tmp context to size each pill ----
  const tmpCanvas = document.createElement('canvas');
  const tmpCtx = tmpCanvas.getContext('2d');
  const isSmall = width < 520;
  const fontSize = isSmall ? 15 : 18;
  const fontStack = `600 ${fontSize}px 'Inter', system-ui, sans-serif`;
  tmpCtx.font = fontStack;

  const PAD_X = isSmall ? 18 : 24;
  const PAD_Y = isSmall ? 12 : 16;

  // ---- Build pill bodies ----
  const bodies = PILLS.map((p, i) => {
    const metrics = tmpCtx.measureText(p.label);
    const w = Math.ceil(metrics.width) + PAD_X * 2;
    const h = Math.ceil(fontSize * 1.25) + PAD_Y * 2;

    // Spread starting positions across the top half
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = (width / 4) + col * (width / 4) + (Math.random() - 0.5) * 40;
    const y = 60 + row * 60 + Math.random() * 20;

    const body = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: Math.min(h / 2, 20) },
      restitution: 0.6,
      friction: 0.3,
      frictionAir: 0.015,
      density: 0.0018,
      render: {
        fillStyle: p.color,
        strokeStyle: 'rgba(28,26,23,0.08)',
        lineWidth: 1
      }
    });

    // Slight random initial spin for liveliness
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

    // Attach metadata for label rendering + pin detection
    body.plugin = body.plugin || {};
    body.plugin.stimmfach = {
      label: p.label,
      color: p.color,
      ink: p.ink,
      width: w,
      height: h,
      pinned: false,
      highlight: 0 // 0..1
    };

    return body;
  });

  Composite.add(engine.world, bodies);

  // ---- Mouse + drag ----
  const mouse = Mouse.create(canvas);
  // Critical: do NOT block scroll wheel on the canvas.
  // Matter binds mousewheel by default — disable it cleanly.
  if (mouse.element) {
    if (mouse.mousewheel) {
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    }
  }

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.18,
      damping: 0.08,
      render: { visible: false }
    }
  });
  Composite.add(engine.world, mouseConstraint);
  render.mouse = mouse;

  // Ensure touch events on the canvas do not also scroll the page, but
  // wheel events still bubble so the page scrolls when user wheels over hero.
  // (CSS `touch-action: none` on canvas handles touch; we leave wheel alone.)

  // ---- Click-without-drag detection ("pin") ----
  let downBody = null;
  let downPos = null;
  let downTime = 0;

  Events.on(mouseConstraint, 'mousedown', () => {
    downBody = mouseConstraint.body || null;
    downPos = { x: mouse.position.x, y: mouse.position.y };
    downTime = performance.now();
  });

  Events.on(mouseConstraint, 'mouseup', () => {
    if (!downBody || !downPos) {
      downBody = null; downPos = null; return;
    }
    const dx = mouse.position.x - downPos.x;
    const dy = mouse.position.y - downPos.y;
    const dist = Math.hypot(dx, dy);
    const dt = performance.now() - downTime;
    if (dist < 6 && dt < 400) {
      // Pin: toggle highlight
      bodies.forEach(b => { b.plugin.stimmfach.pinned = false; });
      downBody.plugin.stimmfach.pinned = true;
      downBody.plugin.stimmfach.highlight = 1;
    }
    downBody = null; downPos = null;
  });

  // ---- afterRender: draw labels + pin hint on top of shapes ----
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    const pinnedBody = bodies.find(b => b.plugin.stimmfach.pinned);

    bodies.forEach(body => {
      const info = body.plugin.stimmfach;
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      // Optional highlight ring for pinned
      if (info.pinned) {
        ctx.strokeStyle = 'rgba(160, 65, 43, 0.85)';
        ctx.lineWidth = 2;
        const rx = info.width / 2 - 0.5;
        const ry = info.height / 2 - 0.5;
        const r = Math.min(ry, 20);
        roundRect(ctx, -rx, -ry, info.width, info.height, r);
        ctx.stroke();
      }

      ctx.fillStyle = info.ink;
      ctx.font = fontStack;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.label, 0, 0);
      ctx.restore();
    });

    // Pin callout: "→ Passt zu dir?" linking to probestunde
    if (pinnedBody) {
      const info = pinnedBody.plugin.stimmfach;
      const px = pinnedBody.position.x;
      const py = pinnedBody.position.y - (info.height / 2) - 16;

      const text = '→ Passt zu dir? Probestunde.';
      ctx.save();
      ctx.font = "500 14px 'Inter', system-ui, sans-serif";
      const metrics = ctx.measureText(text);
      const bw = metrics.width + 24;
      const bh = 30;
      const bx = Math.max(8, Math.min(width - bw - 8, px - bw / 2));
      const by = Math.max(8, py - bh / 2);

      ctx.fillStyle = '#1c1a17';
      roundRect(ctx, bx, by, bw, bh, 15);
      ctx.fill();

      ctx.fillStyle = '#f6f1e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5);
      ctx.restore();
    }
  });

  // ---- Pin callout is a hotspot — handle click on it ----
  canvas.addEventListener('click', (ev) => {
    const pinned = bodies.find(b => b.plugin.stimmfach.pinned);
    if (!pinned) return;
    const info = pinned.plugin.stimmfach;
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const px = pinned.position.x;
    const py = pinned.position.y - (info.height / 2) - 16;
    // Rough hotspot — 200 wide x 30 high around callout
    if (Math.abs(cx - px) < 120 && Math.abs(cy - py) < 18) {
      // Unpin + scroll to probestunde
      pinned.plugin.stimmfach.pinned = false;
      document.getElementById('probestunde')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ---- Round-rect helper (older Safari lacks roundRect) ----
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y,     x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x,     y + h, rr);
    ctx.arcTo(x,     y + h, x,     y,     rr);
    ctx.arcTo(x,     y,     x + w, y,     rr);
    ctx.closePath();
  }

  // ---- Start it ----
  Render.run(render);
  const runner = Runner.create();
  Runner.run(runner, engine);

  // ---- Resize handling ----
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || (window.innerHeight - 62);

      render.canvas.width = width * (window.devicePixelRatio || 1);
      render.canvas.height = height * (window.devicePixelRatio || 1);
      render.options.width = width;
      render.options.height = height;
      Render.setPixelRatio(render, window.devicePixelRatio || 1);

      // Rebuild walls so bodies don't fall off on resize
      Composite.remove(engine.world, [floor, leftWall, rightWall, ceiling]);
      makeWalls();
    }, 150);
  });
})();
