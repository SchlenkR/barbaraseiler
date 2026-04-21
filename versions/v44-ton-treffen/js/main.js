/* v44-ton-treffen — Pitch-Matching-Game
   Vanilla JS ES module, no external libs.
   Privacy-first: mic stream stays local, no upload, no recording.

   State-Machine:   idle -> consent -> countdown -> playing -> result
   Scoring:         +1 per 100ms within +/- 50 cent of target;
                    +5 bonus per 20 consecutive frames (streak).
*/

'use strict';

// =========================================================
// Config
// =========================================================

const TARGETS = [
  { name: 'A3', freq: 220.00 },
  { name: 'D4', freq: 293.66 },
  { name: 'G4', freq: 392.00 },
  { name: 'C5', freq: 523.25 },
  { name: 'E3', freq: 164.81 },
];

const GAME_DURATION_MS    = 60_000;
const TONE_DURATION_MS    = 10_000;
const TICK_INTERVAL_MS    = 100;      // scoring granularity
const PITCH_RANGE_LOW     = 130.81;   // C3
const PITCH_RANGE_HIGH    = 523.25;   // C5
const CENT_TOLERANCE      = 50;       // +/- 50 cent = hit
const STREAK_FRAMES       = 20;       // 20 * 100ms = 2s for bonus
const STREAK_BONUS        = 5;
const SILENCE_RMS         = 0.010;
const FFT_SIZE            = 2048;
const KEYBOARD_STEP_HZ    = 4;        // pitch per arrow-key tick

// =========================================================
// DOM
// =========================================================

const $ = (id) => document.getElementById(id);

const heroSection    = document.querySelector('.hero');
const heroStartBtn   = $('hero-start');

const consentSec     = $('consent');
const consentGoBtn   = $('consent-go');
const consentSkipBtn = $('consent-skip');

const countdownSec   = $('countdown');
const countdownNum   = $('countdown-num');

const gameSec        = $('game');
const hudTimer       = $('hud-timer');
const hudScore       = $('hud-score');
const hudStreak      = $('hud-streak');
const hudTone        = $('hud-tone');
const hudToneIdx     = $('hud-tone-idx');
const gameStatus     = $('game-status');
const cancelBtn      = $('game-cancel');
const canvas         = $('field');
const ctx            = canvas.getContext('2d');

const resultSec      = $('result');
const resultScoreEl  = $('result-score');
const resultVerdict  = $('result-verdict');
const raBest         = $('ra-best');
const raHardest      = $('ra-hardest');
const raStreakEl     = $('ra-streak');
const resultPush     = $('result-push');
const resultAgainBtn = $('result-again');
const resultShareBtn = $('result-share');
const hiddenScore    = $('hidden-score');

const contactForm    = $('contact-form');
const formError      = $('form-error');

// =========================================================
// State
// =========================================================

const state = {
  mode: 'idle',          // idle | consent | countdown | playing | result
  useKeyboard: false,
  audioCtx: null,
  analyser: null,
  sourceNode: null,
  stream: null,
  timeData: null,
  rafId: null,
  tickId: null,
  gameStartMs: 0,
  currentToneIdx: 0,
  currentToneStartMs: 0,
  score: 0,
  streakFrames: 0,
  maxStreakFrames: 0,
  perToneHits: [0, 0, 0, 0, 0],         // 100ms frames in-tolerance per tone
  perToneFrames: [0, 0, 0, 0, 0],       // 100ms frames total (sung, non-silent) per tone
  userPitchHz: 0,
  userPitchCents: null,                  // cents diff from current target
  isSilent: true,
  displayUserY: 0,                       // eased Y for rendering
  displayTargetY: 0,
  keyboardPitchHz: 260,
  prefersReducedMotion: false,
};

// =========================================================
// Utils
// =========================================================

function show(el)  { if (el) el.hidden = false; }
function hide(el)  { if (el) el.hidden = true;  }

function freqToY(hz, height) {
  // Log-space mapping: low at bottom, high at top.
  const lnLow  = Math.log(PITCH_RANGE_LOW);
  const lnHigh = Math.log(PITCH_RANGE_HIGH);
  const t = (Math.log(clamp(hz, PITCH_RANGE_LOW, PITCH_RANGE_HIGH)) - lnLow) / (lnHigh - lnLow);
  const margin = 40;
  return (height - margin) - t * (height - margin * 2);
}

function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }

function centsBetween(fUser, fTarget) {
  return 1200 * Math.log2(fUser / fTarget);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function freqToNoteName(f) {
  if (!f || f < 20) return '—';
  const midi = Math.round(69 + 12 * Math.log2(f / 440));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${name}${octave}`;
}

// =========================================================
// Pitch detection (autocorrelation, inspired by Wilson ~2014)
// =========================================================

function autocorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < SILENCE_RMS) return { hz: 0, rms };

  // Trim: find where signal is above threshold.
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const bufT = buf.slice(r1, r2);
  const N = bufT.length;
  if (N < 64) return { hz: 0, rms };

  const c = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < N - i; j++) sum += bufT[j] * bufT[j + i];
    c[i] = sum;
  }

  // Find first trough.
  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 <= 0) return { hz: 0, rms };

  // Parabolic interpolation.
  if (T0 > 0 && T0 < N - 1) {
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
  }

  const hz = sampleRate / T0;
  if (hz < 60 || hz > 1200) return { hz: 0, rms };
  return { hz, rms };
}

// =========================================================
// Mic setup
// =========================================================

async function startMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('NO_MIC_API');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  state.stream = stream;

  const AC = window.AudioContext || window.webkitAudioContext;
  state.audioCtx = new AC();
  const source = state.audioCtx.createMediaStreamSource(stream);
  state.sourceNode = source;

  const analyser = state.audioCtx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);
  state.analyser = analyser;
  state.timeData = new Float32Array(analyser.fftSize);
}

function stopMic() {
  if (state.rafId)  cancelAnimationFrame(state.rafId);
  if (state.tickId) clearInterval(state.tickId);
  state.rafId = null;
  state.tickId = null;
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
  if (state.audioCtx) {
    state.audioCtx.close().catch(() => {});
    state.audioCtx = null;
  }
  state.analyser = null;
  state.sourceNode = null;
  state.timeData = null;
}

// =========================================================
// Game loop
// =========================================================

function startGame() {
  state.mode = 'playing';
  state.gameStartMs = performance.now();
  state.currentToneIdx = 0;
  state.currentToneStartMs = state.gameStartMs;
  state.score = 0;
  state.streakFrames = 0;
  state.maxStreakFrames = 0;
  state.perToneHits  = [0, 0, 0, 0, 0];
  state.perToneFrames = [0, 0, 0, 0, 0];
  state.userPitchHz = 0;
  state.userPitchCents = null;
  state.isSilent = true;

  hide(countdownSec);
  show(gameSec);
  gameSec.setAttribute('aria-live', 'polite');

  updateHudStatic();

  // Render loop (60fps-ish).
  state.rafId = requestAnimationFrame(renderTick);

  // Scoring loop (10 Hz).
  state.tickId = setInterval(scoreTick, TICK_INTERVAL_MS);
}

function updateHudStatic() {
  const t = TARGETS[state.currentToneIdx];
  hudTone.textContent = t.name;
  hudToneIdx.textContent = `${state.currentToneIdx + 1} / ${TARGETS.length}`;
}

function scoreTick() {
  if (state.mode !== 'playing') return;

  const now = performance.now();
  const elapsed = now - state.gameStartMs;
  const remaining = GAME_DURATION_MS - elapsed;

  // End of game.
  if (remaining <= 0) {
    endGame();
    return;
  }

  // Tone progression.
  const toneElapsed = now - state.currentToneStartMs;
  if (toneElapsed >= TONE_DURATION_MS && state.currentToneIdx < TARGETS.length - 1) {
    state.currentToneIdx++;
    state.currentToneStartMs = now;
    state.streakFrames = 0;
    updateHudStatic();
    flashStatus(`N&auml;chster Ton: ${TARGETS[state.currentToneIdx].name}`);
  }

  // Pitch detection (if mic).
  if (state.analyser && state.timeData) {
    state.analyser.getFloatTimeDomainData(state.timeData);
    const { hz } = autocorrelate(state.timeData, state.audioCtx.sampleRate);
    if (hz > 0) {
      state.userPitchHz = hz;
      state.isSilent = false;
    } else {
      state.isSilent = true;
    }
  } else if (state.useKeyboard) {
    // Keyboard demo mode: treat pitch as active only if not silent flag set.
    state.userPitchHz = state.keyboardPitchHz;
    state.isSilent = false;
  }

  // Score this frame.
  if (!state.isSilent && state.userPitchHz > 0) {
    const target = TARGETS[state.currentToneIdx];
    const cents = centsBetween(state.userPitchHz, target.freq);
    state.userPitchCents = cents;

    state.perToneFrames[state.currentToneIdx]++;

    if (Math.abs(cents) <= CENT_TOLERANCE) {
      state.score += 1;
      state.streakFrames++;
      state.perToneHits[state.currentToneIdx]++;

      if (state.streakFrames > state.maxStreakFrames) state.maxStreakFrames = state.streakFrames;

      // Streak bonus.
      if (state.streakFrames > 0 && state.streakFrames % STREAK_FRAMES === 0) {
        state.score += STREAK_BONUS;
      }
    } else {
      state.streakFrames = 0;
    }
  } else {
    state.userPitchCents = null;
    state.streakFrames = 0;
  }

  // HUD updates.
  hudTimer.textContent  = (remaining / 1000).toFixed(1);
  hudScore.textContent  = String(state.score);
  hudStreak.textContent = (state.streakFrames / 10).toFixed(1);
}

// Render loop: draws canvas.
function renderTick() {
  if (state.mode !== 'playing') return;

  drawField();

  state.rafId = requestAnimationFrame(renderTick);
}

let lastStatusMs = 0;
function flashStatus(msg) {
  gameStatus.innerHTML = msg;
  lastStatusMs = performance.now();
}

// =========================================================
// Canvas rendering
// =========================================================

function resizeCanvasForDPR() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== Math.round(cssW * dpr)) {
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: cssW, h: cssH };
}

function drawField() {
  const { w, h } = resizeCanvasForDPR();

  // Background gradient with subtle vignette.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1f0f18');
  bg.addColorStop(1, '#0e0409');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Pitch scale (vertical skala) — reference notes.
  drawScale(w, h);

  // Target.
  const target = TARGETS[state.currentToneIdx];
  const targetY = freqToY(target.freq, h);
  drawTargetLane(targetY, w, h);

  // Ease display values.
  const ease = state.prefersReducedMotion ? 1 : 0.25;
  state.displayTargetY += (targetY - state.displayTargetY) * ease;

  // User pitch line/dot.
  if (!state.isSilent && state.userPitchHz > 0) {
    const userY = freqToY(state.userPitchHz, h);
    if (state.displayUserY === 0) state.displayUserY = userY;
    state.displayUserY += (userY - state.displayUserY) * (state.prefersReducedMotion ? 1 : 0.35);

    drawUserDot(state.displayUserY, w, h);
  }

  // Target ball (pulsing).
  drawTargetBall(state.displayTargetY, w, h, target);

  // Top-left per-tone progress meter.
  drawProgressBar(w, h);

  // Top-right tone timeline.
  drawToneTimeline(w, h);
}

function drawScale(w, h) {
  const scaleX = 64;
  const margin = 40;

  // Vertical skala line.
  ctx.strokeStyle = 'rgba(255, 201, 214, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(scaleX, margin);
  ctx.lineTo(scaleX, h - margin);
  ctx.stroke();

  // Ticks — every semitone from C3 to C5 (25 notes). Labels every octave.
  const startMidi = 48;  // C3
  const endMidi   = 72;  // C5
  for (let m = startMidi; m <= endMidi; m++) {
    const hz = 440 * Math.pow(2, (m - 69) / 12);
    const y = freqToY(hz, h);
    const isOctave = (m % 12 === 0);
    const isNatural = ![1, 3, 6, 8, 10].includes(m % 12);

    ctx.strokeStyle = isOctave
      ? 'rgba(255, 201, 214, 0.55)'
      : (isNatural ? 'rgba(255, 201, 214, 0.22)' : 'rgba(255, 201, 214, 0.10)');
    ctx.lineWidth = isOctave ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(scaleX - (isOctave ? 14 : 8), y);
    ctx.lineTo(scaleX, y);
    ctx.stroke();

    if (isOctave) {
      ctx.fillStyle = 'rgba(255, 201, 214, 0.7)';
      ctx.font = "500 11px 'Inter', system-ui, sans-serif";
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(freqToNoteName(hz), scaleX - 18, y);
    }
  }
}

function drawTargetLane(y, w, h) {
  // Green tolerance lane (+/- 50 cent strip).
  const target = TARGETS[state.currentToneIdx];
  const yTop = freqToY(target.freq * Math.pow(2, CENT_TOLERANCE / 1200), h);
  const yBot = freqToY(target.freq * Math.pow(2, -CENT_TOLERANCE / 1200), h);

  const grad = ctx.createLinearGradient(80, 0, w - 40, 0);
  grad.addColorStop(0,    'rgba(255, 61, 107, 0.05)');
  grad.addColorStop(0.5,  'rgba(255, 61, 107, 0.18)');
  grad.addColorStop(1,    'rgba(255, 61, 107, 0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(80, yTop, w - 120, yBot - yTop);

  // Dashed centerline.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, y);
  ctx.lineTo(w - 40, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTargetBall(y, w, h, target) {
  const x = w * 0.60;
  const pulse = state.prefersReducedMotion
    ? 0
    : Math.sin(performance.now() / 340) * 0.12;
  const r = 42 + pulse * 8;

  // Glow.
  const grd = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.2);
  grd.addColorStop(0, 'rgba(255, 61, 107, 0.55)');
  grd.addColorStop(1, 'rgba(255, 61, 107, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Ball.
  ctx.fillStyle = '#ff3d6b';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Label.
  ctx.fillStyle = '#fff';
  ctx.font = "italic 500 22px 'Fraunces', Georgia, serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(target.name, x, y);
}

function drawUserDot(y, w, h) {
  const x = w * 0.60 - 160;
  const inTol = state.userPitchCents !== null && Math.abs(state.userPitchCents) <= CENT_TOLERANCE;

  // Trail under the dot — previous positions not stored, draw a soft pulse instead.
  ctx.strokeStyle = inTol ? 'rgba(181, 255, 163, 0.55)' : 'rgba(255, 201, 214, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(80, y);
  ctx.lineTo(x + 16, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dot.
  ctx.fillStyle = inTol ? '#b5ffa3' : '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();

  // Halo.
  ctx.strokeStyle = inTol ? 'rgba(181, 255, 163, 0.8)' : 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Cents readout.
  if (state.userPitchCents !== null) {
    ctx.fillStyle = inTol ? '#b5ffa3' : 'rgba(255, 201, 214, 0.85)';
    ctx.font = "500 12px 'Inter', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const sign = state.userPitchCents > 0 ? '+' : '';
    ctx.fillText(`${sign}${state.userPitchCents.toFixed(0)} cent`, x + 24, y);
  }
}

function drawProgressBar(w, h) {
  // Tone time progress top-center.
  const now = performance.now();
  const toneElapsed = now - state.currentToneStartMs;
  const toneFrac = clamp(toneElapsed / TONE_DURATION_MS, 0, 1);

  const bx = 80, by = 18, bw = w - 160, bh = 4;
  ctx.fillStyle = 'rgba(255, 201, 214, 0.18)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = '#ff3d6b';
  ctx.fillRect(bx, by, bw * toneFrac, bh);
}

function drawToneTimeline(w, h) {
  // Dots at bottom right: 5 tones.
  const total = TARGETS.length;
  const size = 9, gap = 14;
  const baseX = w - 40 - ((size + gap) * total) + gap;
  const y = h - 22;

  for (let i = 0; i < total; i++) {
    const cx = baseX + i * (size + gap);
    if (i < state.currentToneIdx) {
      ctx.fillStyle = 'rgba(181, 255, 163, 0.6)';
    } else if (i === state.currentToneIdx) {
      ctx.fillStyle = '#ff3d6b';
    } else {
      ctx.fillStyle = 'rgba(255, 201, 214, 0.25)';
    }
    ctx.beginPath();
    ctx.arc(cx, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =========================================================
// End game / result
// =========================================================

function endGame() {
  state.mode = 'result';
  if (state.rafId)  cancelAnimationFrame(state.rafId);
  if (state.tickId) clearInterval(state.tickId);
  state.rafId = null;
  state.tickId = null;

  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
  if (state.audioCtx) {
    state.audioCtx.close().catch(() => {});
    state.audioCtx = null;
  }
  state.analyser = null;
  state.sourceNode = null;

  renderResult();

  hide(gameSec);
  show(resultSec);
  // Focus result heading for a11y.
  const heading = document.getElementById('result-title');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  resultSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderResult() {
  const score = state.score;
  resultScoreEl.textContent = String(score);
  if (hiddenScore) hiddenScore.value = String(score);

  // Verdict by tier.
  let verdict;
  let push;
  if (score < 800) {
    verdict = 'Du hast ein intuitives Gefühl. Mit Übung öffnet sich deine Range schnell.';
    push = 'Willst du wissen, was sich bewegen lässt? → Probestunde mit Barbara';
  } else if (score < 1600) {
    verdict = 'Solides Fundament. Du triffst die mittleren Töne zuverlässig.';
    push = 'Willst du wissen, wo genau dein Potenzial liegt? → Probestunde mit Barbara';
  } else if (score < 2400) {
    verdict = 'Trainiert — du hast Töne im Ohr.';
    push = 'Willst du sie feinjustieren? → Probestunde mit Barbara';
  } else {
    verdict = 'Du singst schon. Lass uns feinjustieren.';
    push = 'Bereit für Arbeit an Interpretation und Range? → Probestunde mit Barbara';
  }
  resultVerdict.textContent = verdict;
  resultPush.textContent = push;

  // Best / hardest tone analysis.
  const rates = state.perToneFrames.map((f, i) =>
    f > 0 ? (state.perToneHits[i] / f) : -1
  );
  const sungIdx = rates
    .map((r, i) => ({ r, i }))
    .filter(x => x.r >= 0);

  if (sungIdx.length > 0) {
    const best = sungIdx.reduce((a, b) => (b.r > a.r ? b : a));
    const hardest = sungIdx.reduce((a, b) => (b.r < a.r ? b : a));
    raBest.textContent = `${TARGETS[best.i].name} — ${Math.round(best.r * 100)}%`;
    raHardest.textContent = sungIdx.length > 1
      ? `${TARGETS[hardest.i].name} — ${Math.round(hardest.r * 100)}%`
      : '—';
  } else {
    raBest.textContent = '—';
    raHardest.textContent = '—';
  }

  const maxStreakSec = (state.maxStreakFrames / 10).toFixed(1);
  raStreakEl.textContent = `${maxStreakSec} s`;
}

// =========================================================
// Share-Card: paint a simple summary, offer download.
// =========================================================

function buildShareCard() {
  const sc = document.createElement('canvas');
  sc.width = 1200;
  sc.height = 630;
  const c = sc.getContext('2d');

  // Background.
  const bg = c.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, '#fff8f4');
  bg.addColorStop(1, '#ffeff3');
  c.fillStyle = bg;
  c.fillRect(0, 0, 1200, 630);

  // Pink bar left.
  c.fillStyle = '#ff3d6b';
  c.fillRect(0, 0, 16, 630);

  // Heading.
  c.fillStyle = '#150811';
  c.font = "500 36px 'Fraunces', Georgia, serif";
  c.fillText('Triff den Ton.', 70, 100);

  // Score.
  c.fillStyle = '#ff3d6b';
  c.font = "italic 400 160px 'Fraunces', Georgia, serif";
  c.fillText(String(state.score), 70, 280);

  c.fillStyle = '#3a2530';
  c.font = "400 28px 'Inter', system-ui, sans-serif";
  c.fillText('von 3000 Punkten', 70, 330);

  // Mini-graph: five bars = per-tone hit-rate.
  const graphX = 70, graphY = 400, graphW = 520, graphH = 140;
  c.strokeStyle = 'rgba(21, 8, 17, 0.15)';
  c.beginPath(); c.moveTo(graphX, graphY + graphH); c.lineTo(graphX + graphW, graphY + graphH); c.stroke();

  const barW = graphW / TARGETS.length - 12;
  for (let i = 0; i < TARGETS.length; i++) {
    const rate = state.perToneFrames[i] > 0
      ? state.perToneHits[i] / state.perToneFrames[i]
      : 0;
    const x = graphX + i * (barW + 12);
    const h = rate * graphH;
    c.fillStyle = '#ff3d6b';
    c.fillRect(x, graphY + graphH - h, barW, h);
    c.fillStyle = '#3a2530';
    c.font = "500 18px 'Inter', system-ui, sans-serif";
    c.fillText(TARGETS[i].name, x + 6, graphY + graphH + 24);
  }

  // Right-side label.
  c.fillStyle = '#150811';
  c.font = "italic 400 42px 'Fraunces', Georgia, serif";
  c.fillText('Barbara Sophia Sailer', 650, 360);
  c.fillStyle = '#3a2530';
  c.font = "400 22px 'Inter', system-ui, sans-serif";
  c.fillText('Gesangsunterricht in Frankfurt', 650, 395);
  c.fillText(`Längste Streak: ${(state.maxStreakFrames / 10).toFixed(1)} s`, 650, 430);

  // Footer.
  c.fillStyle = '#3a2530';
  c.font = "400 18px 'Inter', system-ui, sans-serif";
  c.fillText('barbarasailer.example / triff-den-ton', 70, 600);

  return sc;
}

function downloadShareCard() {
  const sc = buildShareCard();
  sc.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triff-den-ton_score_${state.score}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}

// =========================================================
// Flow wiring
// =========================================================

function goConsent() {
  state.mode = 'consent';
  hide(heroSection);
  show(consentSec);
  consentSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => consentGoBtn.focus(), 100);
}

async function goCountdown(withMic) {
  state.useKeyboard = !withMic;
  state.mode = 'countdown';
  hide(consentSec);
  show(countdownSec);
  countdownSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Start mic early (user already consented).
  if (withMic) {
    try {
      await startMic();
    } catch (err) {
      // Fallback: keyboard mode.
      state.useKeyboard = true;
      flashStatus('Mikrofon nicht verf&uuml;gbar &mdash; Tastatur-Modus aktiv.');
    }
  }

  // 3-2-1-go
  const steps = ['3', '2', '1', 'Sing!'];
  for (let i = 0; i < steps.length; i++) {
    countdownNum.textContent = steps[i];
    countdownNum.style.animation = 'none';
    // Trigger reflow for re-animation.
    void countdownNum.offsetWidth;
    countdownNum.style.animation = '';
    await wait(800);
  }
  startGame();
}

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function cancelGame() {
  if (state.rafId)  cancelAnimationFrame(state.rafId);
  if (state.tickId) clearInterval(state.tickId);
  state.rafId = null;
  state.tickId = null;
  stopMic();
  state.mode = 'idle';

  hide(gameSec);
  hide(consentSec);
  hide(countdownSec);
  hide(resultSec);
  show(heroSection);
  heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function playAgain() {
  hide(resultSec);
  goConsent();
}

// =========================================================
// Keyboard demo mode
// =========================================================

function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (state.mode === 'playing' || state.mode === 'countdown') cancelGame();
    return;
  }
  if (state.mode !== 'playing' || !state.useKeyboard) return;
  if (e.key === 'ArrowUp') {
    state.keyboardPitchHz = Math.min(PITCH_RANGE_HIGH, state.keyboardPitchHz * 1.01);
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    state.keyboardPitchHz = Math.max(PITCH_RANGE_LOW, state.keyboardPitchHz / 1.01);
    e.preventDefault();
  }
}

// =========================================================
// Form validation
// =========================================================

function validateForm(e) {
  if (!contactForm) return;
  const required = contactForm.querySelectorAll('[required]');
  let invalid = false;
  required.forEach((el) => {
    if (!el.value.trim()) invalid = true;
  });
  if (invalid) {
    e.preventDefault();
    formError.hidden = false;
    setTimeout(() => { formError.hidden = true; }, 4000);
  }
}

// =========================================================
// Boot
// =========================================================

function boot() {
  // Preferences.
  state.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Attach listeners.
  if (heroStartBtn)   heroStartBtn.addEventListener('click', goConsent);
  if (consentGoBtn)   consentGoBtn.addEventListener('click', () => goCountdown(true));
  if (consentSkipBtn) consentSkipBtn.addEventListener('click', () => goCountdown(false));
  if (cancelBtn)      cancelBtn.addEventListener('click', cancelGame);
  if (resultAgainBtn) resultAgainBtn.addEventListener('click', playAgain);
  if (resultShareBtn) resultShareBtn.addEventListener('click', downloadShareCard);

  window.addEventListener('keydown', onKeyDown);

  if (contactForm) contactForm.addEventListener('submit', validateForm);

  // Stop mic if user leaves tab mid-game.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state.mode === 'playing' || state.mode === 'countdown')) {
      cancelGame();
    }
  });

  // Initial HUD text.
  if (hudTimer)  hudTimer.textContent = '60.0';
  if (hudScore)  hudScore.textContent = '0';
  if (hudStreak) hudStreak.textContent = '0.0';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
