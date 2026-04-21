// v20-spectrogram — live voice spectrogram as aurora ribbons.
// Pure Web Audio API. No deps. Mic access is strictly gesture-gated.

// Bail early on legal pages.
if (document.body.classList.contains('legal')) {
  // nothing to do
} else {
  init();
}

function init() {
  const canvas = document.getElementById('spectro');
  if (!canvas) return;

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const overlay = document.getElementById('stageOverlay');
  const noteOut = document.getElementById('noteOut');
  const overtonesOut = document.getElementById('overtonesOut');
  const statusOut = document.getElementById('statusOut');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx2d = canvas.getContext('2d', { alpha: false });

  // Device-pixel-ratio aware canvas sizing.
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(canvas);
  resizeCanvas();

  // State.
  let audioCtx = null;
  let stream = null;
  let sourceNode = null;
  let analyser = null;
  let rafId = null;
  let ribbonHistory = []; // array of Float32Array snapshots (normalized bin energies)
  const RIBBON_COUNT = 48;
  const HISTORY_FRAMES = 140;

  // Pre-baked static example — so the canvas is never empty.
  const exampleHistory = buildExampleHistory();
  drawRibbons(exampleHistory, 1.0);

  // --- Controls ---
  startBtn.addEventListener('click', onStart);
  stopBtn.addEventListener('click', onStop);

  window.addEventListener('pagehide', cleanup);
  window.addEventListener('beforeunload', cleanup);

  async function onStart() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      failMic('Dein Browser unterstützt das Mikrofon nicht. Schreib mir stattdessen gerne direkt.');
      return;
    }

    try {
      statusOut.textContent = 'Frage Mikrofon an …';
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
    } catch (err) {
      failMic('Kein Mikrofon? Macht nichts — hör dir stattdessen Barbara an: Schreib eine kurze Nachricht und buch direkt eine Probestunde.');
      return;
    }

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.7;
    sourceNode.connect(analyser);

    // Switch UI.
    overlay.classList.add('is-hidden');
    startBtn.hidden = true;
    stopBtn.hidden = false;
    statusOut.textContent = 'Lauf. Sing ein langes „Ah".';

    ribbonHistory = [];

    if (reduceMotion) {
      // Single snapshot, no animation loop.
      captureSnapshotOnce();
      return;
    }

    loop();
  }

  function captureSnapshotOnce() {
    const binCount = analyser.frequencyBinCount;
    const freqData = new Uint8Array(binCount);
    // Give the mic a moment to settle; wait ~300ms via a couple of rAFs.
    let frame = 0;
    const step = () => {
      analyser.getByteFrequencyData(freqData);
      frame++;
      if (frame < 12) { requestAnimationFrame(step); return; }
      const ribbons = computeRibbons(freqData);
      const stacked = new Array(HISTORY_FRAMES).fill(null).map(() => ribbons);
      drawRibbons(stacked, 1.0);
      updateReadouts(freqData);
    };
    requestAnimationFrame(step);
  }

  function loop() {
    const binCount = analyser.frequencyBinCount;
    const freqData = new Uint8Array(binCount);
    const timeData = new Float32Array(analyser.fftSize);

    let lastReadout = 0;

    const tick = (now) => {
      analyser.getByteFrequencyData(freqData);
      const ribbons = computeRibbons(freqData);

      ribbonHistory.push(ribbons);
      if (ribbonHistory.length > HISTORY_FRAMES) ribbonHistory.shift();

      drawRibbons(ribbonHistory, 1.0);

      // Update text readouts ~4x per second.
      if (now - lastReadout > 220) {
        analyser.getFloatTimeDomainData(timeData);
        updateReadouts(freqData, timeData);
        lastReadout = now;
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function onStop() {
    // Stop rendering loop, stop mic, keep final frame visible.
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (audioCtx) audioCtx.close().catch(() => {});
    audioCtx = null;
    sourceNode = null;
    analyser = null;

    stopBtn.hidden = true;
    startBtn.hidden = false;
    startBtn.querySelector('.btn-dot')?.removeAttribute('style');
    statusOut.textContent = 'Letztes Bild eingefroren. Noch mal?';
  }

  function cleanup() {
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
  }

  function failMic(msg) {
    statusOut.textContent = msg;
    noteOut.textContent = '—';
    overtonesOut.textContent = '—';
    // Make sure overlay stays or returns.
    overlay.classList.remove('is-hidden');
  }

  // --- Analysis ---

  // Fold FFT bins (256 useful bins up to ~11 kHz at 44.1 kHz SR) into RIBBON_COUNT log-spaced ribbons.
  function computeRibbons(freqData) {
    const ribbons = new Float32Array(RIBBON_COUNT);
    const sampleRate = (audioCtx && audioCtx.sampleRate) || 48000;
    const nyquist = sampleRate / 2;
    const binHz = nyquist / freqData.length;
    // Log-space: 80 Hz .. 8000 Hz.
    const fMin = 80, fMax = 8000;
    const lnMin = Math.log(fMin), lnMax = Math.log(fMax);
    for (let r = 0; r < RIBBON_COUNT; r++) {
      const f0 = Math.exp(lnMin + (lnMax - lnMin) * (r / RIBBON_COUNT));
      const f1 = Math.exp(lnMin + (lnMax - lnMin) * ((r + 1) / RIBBON_COUNT));
      const b0 = Math.max(1, Math.floor(f0 / binHz));
      const b1 = Math.min(freqData.length - 1, Math.max(b0 + 1, Math.ceil(f1 / binHz)));
      let sum = 0;
      for (let b = b0; b < b1; b++) sum += freqData[b];
      ribbons[r] = sum / ((b1 - b0) * 255); // 0..1
    }
    return ribbons;
  }

  function updateReadouts(freqData, timeData) {
    const sampleRate = (audioCtx && audioCtx.sampleRate) || 48000;
    let fundamental = 0;

    if (timeData) {
      fundamental = autocorrelate(timeData, sampleRate);
    }
    if (!fundamental || fundamental < 60) {
      // Fallback: strongest bin below 500 Hz.
      const nyquist = sampleRate / 2;
      const binHz = nyquist / freqData.length;
      const maxBin = Math.min(freqData.length - 1, Math.floor(500 / binHz));
      let peakIdx = 0, peakVal = 0;
      for (let i = 2; i <= maxBin; i++) {
        if (freqData[i] > peakVal) { peakVal = freqData[i]; peakIdx = i; }
      }
      if (peakVal > 20) fundamental = peakIdx * binHz;
    }

    // Basic silence detection.
    let total = 0;
    for (let i = 0; i < freqData.length; i++) total += freqData[i];
    const avg = total / freqData.length;
    if (avg < 6) {
      noteOut.textContent = '… still …';
      overtonesOut.textContent = '—';
      statusOut.textContent = 'Ich höre noch nichts. Sing ein langes „Ah".';
      return;
    }

    if (fundamental > 60 && fundamental < 1500) {
      const note = freqToNote(fundamental);
      noteOut.textContent = `${note} · ${Math.round(fundamental)} Hz`;
    } else {
      noteOut.textContent = `— · ${Math.round(avg)} dB~`;
    }

    // Overtones: compare energy in 2f..6f range to fundamental band.
    const nyquist = sampleRate / 2;
    const binHz = nyquist / freqData.length;
    if (fundamental > 60) {
      let fundE = 0, harmE = 0, count = 0;
      const fBand = (f) => {
        const lo = Math.max(1, Math.floor((f * 0.9) / binHz));
        const hi = Math.min(freqData.length - 1, Math.ceil((f * 1.1) / binHz));
        let s = 0;
        for (let i = lo; i < hi; i++) s += freqData[i];
        return s / Math.max(1, (hi - lo));
      };
      fundE = fBand(fundamental);
      for (let k = 2; k <= 6; k++) {
        const f = fundamental * k;
        if (f < nyquist * 0.95) { harmE += fBand(f); count++; }
      }
      const ratio = count > 0 ? (harmE / count) / (fundE + 1e-6) : 0;
      let label;
      if (ratio > 0.55) label = 'reich';
      else if (ratio > 0.28) label = 'deutlich hörbar';
      else label = 'gedämpft';
      overtonesOut.textContent = label;
      statusOut.textContent = `Grundfrequenz ~ ${Math.round(fundamental)} Hz. Obertöne: ${label}.`;
    } else {
      overtonesOut.textContent = '—';
    }
  }

  // Simple autocorrelation for pitch. Returns Hz or 0.
  function autocorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return 0;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    const bufT = buf.slice(r1, r2);
    const N = bufT.length;
    if (N < 64) return 0;

    const c = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N - i; j++) c[i] += bufT[j] * bufT[j + i];
    }
    let d = 0;
    while (d < N - 1 && c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < N; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }
    let T0 = maxpos;
    // Parabolic interpolation.
    if (T0 > 0 && T0 < N - 1) {
      const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }
    return sampleRate / T0;
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function freqToNote(f) {
    const midi = Math.round(69 + 12 * Math.log2(f / 440));
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${name}${octave}`;
  }

  // --- Rendering ---

  // Aurora-style ribbons. For each ribbon r we draw a horizontal band whose
  // vertical offset and thickness is driven by its energy history.
  function drawRibbons(history, alpha) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;

    // Background: warm dark with subtle vignette.
    const g = ctx2d.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a1210');
    g.addColorStop(1, '#2a1f16');
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, 0, w, h);

    const count = history.length || 1;
    const frames = history; // newest at the end

    // Draw each ribbon as a filled path across time.
    for (let r = 0; r < RIBBON_COUNT; r++) {
      const yBase = h * (1 - (r + 0.5) / RIBBON_COUNT);
      const maxThickness = h / RIBBON_COUNT * 2.4;

      // Color per ribbon: amber -> rose -> violet, low to high.
      const t = r / (RIBBON_COUNT - 1);
      const color = ribbonColor(t);

      ctx2d.beginPath();
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1 || 1)) * w;
        const e = (frames[i] && frames[i][r]) || 0;
        const y = yBase - e * maxThickness;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      for (let i = count - 1; i >= 0; i--) {
        const x = (i / (count - 1 || 1)) * w;
        const e = (frames[i] && frames[i][r]) || 0;
        const y = yBase + e * maxThickness * 0.85;
        ctx2d.lineTo(x, y);
      }
      ctx2d.closePath();

      // Glow halo.
      ctx2d.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.18 * alpha})`;
      ctx2d.filter = 'blur(6px)';
      ctx2d.fill();
      ctx2d.filter = 'none';

      // Core.
      ctx2d.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.75 * alpha})`;
      ctx2d.fill();
    }
  }

  // Interpolate amber -> rose -> violet along t in [0,1].
  function ribbonColor(t) {
    // Stops:
    // 0.0 amber  rgb(212,137, 56)
    // 0.5 rose   rgb(194, 90,106)
    // 1.0 violet rgb(106, 78,143)
    const stops = [
      { p: 0.0, r: 224, g: 160, b: 70 },
      { p: 0.5, r: 202, g: 96, b: 110 },
      { p: 1.0, r: 120, g: 84, b: 168 }
    ];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (t >= a.p && t <= b.p) {
        const lt = (t - a.p) / (b.p - a.p);
        return {
          r: Math.round(a.r + (b.r - a.r) * lt),
          g: Math.round(a.g + (b.g - a.g) * lt),
          b: Math.round(a.b + (b.b - a.b) * lt)
        };
      }
    }
    return stops[stops.length - 1];
  }

  // Pre-baked ribbon history so the canvas is never empty.
  function buildExampleHistory() {
    const frames = [];
    for (let i = 0; i < HISTORY_FRAMES; i++) {
      const t = i / HISTORY_FRAMES;
      const arr = new Float32Array(RIBBON_COUNT);
      for (let r = 0; r < RIBBON_COUNT; r++) {
        const u = r / (RIBBON_COUNT - 1);
        // Low-frequency dominant "Ah" with harmonic peaks around 1f, 2f, 3f.
        const fund = 0.75 * Math.exp(-Math.pow((u - 0.18) / 0.06, 2));
        const h2 = 0.55 * Math.exp(-Math.pow((u - 0.35) / 0.07, 2));
        const h3 = 0.40 * Math.exp(-Math.pow((u - 0.52) / 0.08, 2));
        const h4 = 0.22 * Math.exp(-Math.pow((u - 0.70) / 0.10, 2));
        // Gentle horizontal undulation so it looks alive.
        const wave = 0.08 * Math.sin(t * Math.PI * 2 * 1.5 + r * 0.4);
        arr[r] = Math.max(0, Math.min(1, (fund + h2 + h3 + h4) * (0.92 + wave)));
      }
      frames.push(arr);
    }
    return frames;
  }
}
