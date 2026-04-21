// v24 Tagesmotiv — generative per-hour note-scape.
// Canvas 2D, seeded PRNG, warm editorial palette. No deps.

// --- mulberry32 seeded PRNG --------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// djb2-ish string hash -> int32
function strHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}

// --- caption -----------------------------------------------------------------
function updateCaption() {
  const el = document.getElementById("caption-text");
  if (!el) return;
  try {
    const fmt = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "long"
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t) => { const p = parts.find((x) => x.type === t); return p ? p.value : ""; };
    const weekday = get("weekday");
    const hour = get("hour");
    const minute = get("minute");
    el.textContent = `Tagesmotiv für Frankfurt, ${hour}:${minute} · ${weekday}`;
  } catch (e) {
    el.textContent = "Tagesmotiv für Frankfurt";
  }
}

// --- seed --------------------------------------------------------------------
function computeSeed() {
  // deterministic within one hour, new each hour
  const now = new Date();
  // Use Berlin hour & weekday via Intl
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit", weekday: "short", hourCycle: "h23"
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour").value, 10) || 0;
  const weekdayStr = (parts.find((p) => p.type === "weekday") || { value: "" }).value;
  const dayIdx = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].indexOf(weekdayStr.replace(".", "").slice(0, 2));
  const day = dayIdx < 0 ? now.getDay() : dayIdx;
  return strHash("Europe/Berlin") ^ (hour << 8) ^ day;
}

// --- palette (cohesive warm editorial) ---------------------------------------
// ink, terracotta, sage, warm brown, dusty cream accents
const PALETTE = [
  "#2a2420", // ink
  "#b8563a", // terracotta
  "#7a8b72", // sage
  "#8a6a4f", // walnut
  "#d9a88a"  // clay tint
];

// --- render ------------------------------------------------------------------
function render(canvas) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width));
  const h = Math.max(1, Math.floor(rect.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // background tint — slight vertical warmth
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#efe6d4");
  bg.addColorStop(1, "#f6f1e7");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const seed = computeSeed();
  const rand = mulberry32(seed >>> 0);

  // five horizontal staff-ish guide lines, very faint (notation nod)
  ctx.strokeStyle = "rgba(42,36,32,0.06)";
  ctx.lineWidth = 1;
  const staffCount = 5;
  const staffTop = h * 0.32;
  const staffGap = h * 0.08;
  for (let i = 0; i < staffCount; i++) {
    const y = staffTop + i * staffGap;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, y);
    ctx.lineTo(w * 0.96, y);
    ctx.stroke();
  }

  // phrase contours: 40–80 flowing Bezier curves, each a "phrase"
  const curveCount = 40 + Math.floor(rand() * 41); // 40..80
  for (let i = 0; i < curveCount; i++) {
    const color = PALETTE[Math.floor(rand() * PALETTE.length)];
    const alpha = 0.18 + rand() * 0.55;
    const lineW = 0.6 + rand() * 2.4;

    // phrase anchored along an invisible diagonal, offset per curve
    const yBase = h * (0.2 + rand() * 0.6);
    const amp = h * (0.06 + rand() * 0.22);
    const x0 = w * (-0.05 + rand() * 0.3);
    const x3 = w * (0.7 + rand() * 0.35);
    const cx1 = x0 + (x3 - x0) * (0.2 + rand() * 0.2);
    const cx2 = x0 + (x3 - x0) * (0.6 + rand() * 0.25);
    const dir = rand() < 0.5 ? -1 : 1;
    const y0 = yBase;
    const y1 = yBase + dir * amp * (0.5 + rand());
    const y2 = yBase - dir * amp * (0.5 + rand());
    const y3 = yBase + (rand() - 0.5) * amp * 0.5;

    ctx.strokeStyle = hexAlpha(color, alpha);
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(cx1, y1, cx2, y2, x3, y3);
    ctx.stroke();

    // sprinkle 2–6 "notes" along the curve
    const noteCount = 2 + Math.floor(rand() * 5);
    for (let n = 0; n < noteCount; n++) {
      const t = rand();
      const p = cubicPoint(t, x0, y0, cx1, y1, cx2, y2, x3, y3);
      const r = 1.4 + rand() * 3.2;
      ctx.fillStyle = hexAlpha(color, Math.min(0.85, alpha + 0.15));
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();

      // occasional stem (quarter-note silhouette)
      if (rand() < 0.35) {
        ctx.strokeStyle = hexAlpha(color, alpha + 0.1);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(p.x + r * 0.9, p.y);
        ctx.lineTo(p.x + r * 0.9, p.y - (8 + rand() * 16));
        ctx.stroke();
      }
    }
  }

  // scatter dots — quiet editorial punctuation
  const dotCount = 40 + Math.floor(rand() * 60);
  for (let i = 0; i < dotCount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * 1.4;
    ctx.fillStyle = hexAlpha("#2a2420", 0.12 + rand() * 0.18);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // subtle vignette — editorial softness
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(246,241,231,0)");
  vg.addColorStop(1, "rgba(42,36,32,0.08)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function cubicPoint(t, x0, y0, x1, y1, x2, y2, x3, y3) {
  const it = 1 - t;
  const b0 = it * it * it;
  const b1 = 3 * it * it * t;
  const b2 = 3 * it * t * t;
  const b3 = t * t * t;
  return { x: b0 * x0 + b1 * x1 + b2 * x2 + b3 * x3, y: b0 * y0 + b1 * y1 + b2 * y2 + b3 * y3 };
}

function hexAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// --- boot --------------------------------------------------------------------
const canvas = document.getElementById("tagesmotiv");
if (canvas) {
  updateCaption();
  render(canvas);

  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // resize: re-render (seed same within the hour)
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => render(canvas));
  });

  // tick caption every 30s and re-render if the hour rolled over
  // (skip polling under reduced motion — render once, update caption less often)
  if (!reduced) {
    let lastSeed = computeSeed();
    setInterval(() => {
      updateCaption();
      const s = computeSeed();
      if (s !== lastSeed) { lastSeed = s; render(canvas); }
    }, 30000);
  } else {
    // still refresh caption every 5 min so the time stays roughly accurate
    setInterval(updateCaption, 300000);
  }
}
