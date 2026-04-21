// v40-stimme-zeigen — pitch-responsive live mic visualisation.
// Pure Web Audio + autocorrelation pitch detection. No deps. Client-side only.

(function () {
  'use strict';

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const RECORD_SECONDS = 5;
  const MIN_FREQ = 70;   // ~C#2
  const MAX_FREQ = 1000; // ~B5
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM references
  const panelCta = document.getElementById('panelCta');
  const panelConsent = document.getElementById('panelConsent');
  const panelLive = document.getElementById('panelLive');
  const panelResult = document.getElementById('panelResult');
  const panelFallback = document.getElementById('panelFallback');

  const startBtn = document.getElementById('startBtn');
  const consentYes = document.getElementById('consentYes');
  const consentNo = document.getElementById('consentNo');
  const stopBtn = document.getElementById('stopBtn');
  const retryBtn = document.getElementById('retryBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const revealPhone = document.getElementById('revealPhone');
  const phoneReveal = document.getElementById('phoneReveal');

  const liveCounter = document.getElementById('liveCounter');
  const liveNote = document.getElementById('liveNote');

  const demoCanvas = document.getElementById('demoCanvas');
  const liveCanvas = document.getElementById('liveCanvas');
  const resultCanvas = document.getElementById('resultCanvas');
  const fallbackCanvas = document.getElementById('fallbackCanvas');
  const resultAnalysis = document.getElementById('resultAnalysis');
  const fallbackMsg = document.getElementById('fallbackMsg');

  // Audio state
  let audioCtx = null;
  let stream = null;
  let sourceNode = null;
  let analyser = null;
  let rafId = null;
  let recordingStart = 0;
  let samples = []; // { t, freq, rms }

  // --- Init demo canvases ---
  drawDemoWave(demoCanvas, reduceMotion ? null : 'animate');
  drawDemoWave(fallbackCanvas, null);

  // --- Panel switching ---
  function showPanel(panelEl) {
    [panelCta, panelConsent, panelLive, panelResult, panelFallback].forEach((p) => {
      if (!p) return;
      if (p === panelEl) { p.hidden = false; }
      else { p.hidden = true; }
    });
  }

  // --- CTA button: show consent panel ---
  startBtn?.addEventListener('click', () => {
    showPanel(panelConsent);
  });

  consentNo?.addEventListener('click', () => {
    // Skip to content below the fold
    showPanel(panelCta);
    const wie = document.getElementById('wie');
    if (wie) wie.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  consentYes?.addEventListener('click', async () => {
    await startRecording();
  });

  stopBtn?.addEventListener('click', () => {
    stopAll();
    showPanel(panelCta);
  });

  retryBtn?.addEventListener('click', async () => {
    showPanel(panelConsent);
  });

  tryAgainBtn?.addEventListener('click', async () => {
    showPanel(panelConsent);
  });

  downloadBtn?.addEventListener('click', () => {
    if (!resultCanvas) return;
    try {
      const url = resultCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stimme-zeigen.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      // ignore (cross-origin / memory)
    }
  });

  revealPhone?.addEventListener('click', () => {
    const expanded = revealPhone.getAttribute('aria-expanded') === 'true';
    revealPhone.setAttribute('aria-expanded', String(!expanded));
    if (phoneReveal) phoneReveal.hidden = expanded;
  });

  window.addEventListener('pagehide', stopAll);
  window.addEventListener('beforeunload', stopAll);

  // --- Recording flow ---
  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showFallback('Dein Browser kennt die Mikrofon-API nicht. Schreib mir stattdessen gerne — das Formular weiter unten funktioniert überall.');
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
    } catch (err) {
      showFallback('Kein Zugriff aufs Mikrofon &mdash; kein Problem. Du siehst hier eine Beispielkurve. Du kannst das Mikrofon später in den Browser-Einstellungen erlauben und nochmal klicken.');
      return;
    }

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      sourceNode.connect(analyser);
    } catch (err) {
      showFallback('Deine Audio-Engine macht gerade Pause. Probier es in ein paar Sekunden nochmal oder nimm das Kontaktformular.');
      return;
    }

    samples = [];
    showPanel(panelLive);
    // Clear live canvas
    const ctx = liveCanvas.getContext('2d');
    setupCanvas(liveCanvas);
    clearCanvas(liveCanvas, ctx);

    recordingStart = performance.now();

    if (reduceMotion) {
      // static: wait for RECORD_SECONDS, then finalize
      liveCounter.textContent = `Sing jetzt — ${RECORD_SECONDS} Sekunden.`;
      collectSamplesStatic();
    } else {
      loop();
    }
  }

  function collectSamplesStatic() {
    const sampleRate = audioCtx.sampleRate;
    const buf = new Float32Array(analyser.fftSize);
    const intervalMs = 60; // ~16 samples per second
    const totalMs = RECORD_SECONDS * 1000;
    const startT = performance.now();

    const step = () => {
      const elapsed = performance.now() - startT;
      analyser.getFloatTimeDomainData(buf);
      const rms = computeRMS(buf);
      const freq = autocorrelate(buf, sampleRate);
      samples.push({ t: elapsed / 1000, freq: freq || 0, rms });
      liveNote.textContent = freq ? `Du singst bei ${freqToLabel(freq)}` : '… still …';

      if (elapsed < totalMs) {
        setTimeout(step, intervalMs);
      } else {
        finalizeRecording();
      }
    };
    step();
  }

  function loop() {
    const sampleRate = audioCtx.sampleRate;
    const buf = new Float32Array(analyser.fftSize);
    const ctx = liveCanvas.getContext('2d');
    let lastNoteUpdate = 0;

    const tick = (now) => {
      const elapsed = (now - recordingStart) / 1000;
      analyser.getFloatTimeDomainData(buf);
      const rms = computeRMS(buf);
      const freq = autocorrelate(buf, sampleRate);
      samples.push({ t: elapsed, freq: freq || 0, rms });

      // Draw live curve incrementally
      drawLiveFrame(ctx, liveCanvas, samples, elapsed);

      // Counter
      const remaining = Math.max(0, RECORD_SECONDS - elapsed);
      const secLeft = Math.ceil(remaining);
      liveCounter.textContent = remaining > 0
        ? `Sing weiter — ${secLeft}`
        : 'Fertig.';

      // Note text (throttled)
      if (now - lastNoteUpdate > 150) {
        if (rms < 0.01) {
          liveNote.textContent = '… still …';
        } else if (freq > MIN_FREQ && freq < MAX_FREQ) {
          liveNote.textContent = `Du singst bei ${freqToLabel(freq)}`;
        } else {
          liveNote.textContent = '… suche Ton …';
        }
        lastNoteUpdate = now;
      }

      if (elapsed < RECORD_SECONDS) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
        finalizeRecording();
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  function finalizeRecording() {
    stopAudio();
    const analysis = analyseSamples(samples);
    renderResult(analysis);
    showPanel(panelResult);
  }

  function stopAudio() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (stream) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    }
    stream = null;
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
    }
    audioCtx = null;
    sourceNode = null;
    analyser = null;
  }

  function stopAll() {
    stopAudio();
  }

  function showFallback(msg) {
    if (fallbackMsg && msg) fallbackMsg.innerHTML = msg;
    showPanel(panelFallback);
    drawDemoWave(fallbackCanvas, null);
  }

  // --- DSP ---
  function computeRMS(buf) {
    let s = 0;
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  // Autocorrelation-based pitch detection with parabolic interpolation.
  // Adapted from the well-known `cwilso/PitchDetect` approach.
  function autocorrelate(buf, sampleRate) {
    const SIZE = buf.length;
    const rms = computeRMS(buf);
    if (rms < 0.01) return 0;

    // Trim silence at start and end
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    const trimmed = buf.slice(r1, r2);
    const N = trimmed.length;
    if (N < 128) return 0;

    // Difference function-ish autocorrelation
    const c = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let j = 0; j < N - i; j++) sum += trimmed[j] * trimmed[j + i];
      c[i] = sum;
    }

    // Find first local minimum (skip initial descent from lag 0)
    let d = 0;
    while (d < N - 1 && c[d] > c[d + 1]) d++;

    // Then find the peak after that
    let maxVal = -Infinity, maxPos = -1;
    for (let i = d; i < N; i++) {
      if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
    }

    let T0 = maxPos;
    if (T0 <= 0) return 0;

    // Parabolic interpolation
    if (T0 > 0 && T0 < N - 1) {
      const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      if (a) T0 = T0 - b / (2 * a);
    }
    const freq = sampleRate / T0;
    if (freq < MIN_FREQ || freq > MAX_FREQ) return 0;
    return freq;
  }

  function freqToMidi(f) {
    return 12 * Math.log2(f / 440) + 69;
  }
  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  function freqToNoteName(f) {
    const midi = Math.round(freqToMidi(f));
    const name = NOTE_NAMES[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${name}${octave}`;
  }
  function freqToLabel(f) {
    const note = freqToNoteName(f);
    return `${note} (${Math.round(f)} Hz)`;
  }

  // --- Analysis of the whole 5s take ---
  function analyseSamples(all) {
    const voiced = all.filter((s) => s.freq && s.rms > 0.015 && s.freq >= MIN_FREQ && s.freq <= MAX_FREQ);
    if (voiced.length < 4) {
      return {
        hasVoice: false,
        message: 'Ich habe fast nichts gehört — vielleicht war es zu leise. Probier es nochmal, ganz nah am Mikro.',
      };
    }

    // Median pitch (robust)
    const freqs = voiced.map((s) => s.freq).slice().sort((a, b) => a - b);
    const median = freqs[Math.floor(freqs.length / 2)];
    const medianNote = freqToNoteName(median);

    // Dominant note by mode of rounded MIDI notes
    const midiCounts = new Map();
    for (const f of freqs) {
      const m = Math.round(freqToMidi(f));
      midiCounts.set(m, (midiCounts.get(m) || 0) + 1);
    }
    let dominantMidi = null, dominantCount = 0;
    for (const [m, c] of midiCounts.entries()) {
      if (c > dominantCount) { dominantMidi = m; dominantCount = c; }
    }
    const dominantFreq = midiToFreq(dominantMidi);
    const dominantNote = freqToNoteName(dominantFreq);

    // Stability: RMS deviation in cents from dominant note
    const cents = voiced.map((s) => 1200 * Math.log2(s.freq / dominantFreq));
    let sumSq = 0;
    for (const c of cents) sumSq += c * c;
    const rmsCents = Math.sqrt(sumSq / cents.length);

    // Range: from lowest to highest voiced freq
    const minFreq = freqs[0];
    const maxFreq = freqs[freqs.length - 1];
    const semitones = Math.round(12 * Math.log2(maxFreq / minFreq));

    return {
      hasVoice: true,
      median,
      medianNote,
      dominantFreq,
      dominantNote,
      rmsCents,
      minFreq,
      maxFreq,
      minNote: freqToNoteName(minFreq),
      maxNote: freqToNoteName(maxFreq),
      semitones,
    };
  }

  function stabilityDescription(cents) {
    if (cents < 15) return { label: 'sehr sauber', detail: `deine Tonhöhe war ±${Math.round(cents)} Cent — das ist ziemlich genau auf dem Ton.` };
    if (cents < 30) return { label: 'klar', detail: `deine Tonhöhe war ±${Math.round(cents)} Cent — für fünf Sekunden spontan sehr ordentlich.` };
    if (cents < 50) return { label: 'leicht wackelig', detail: `deine Tonhöhe war ±${Math.round(cents)} Cent — da ist noch Platz nach oben, aber das ist kein Grund zu zweifeln.` };
    return { label: 'suchend', detail: `deine Tonhöhe war ±${Math.round(cents)} Cent — das hört sich erstmal unsicher an, ist aber völlig normal ohne Übung.` };
  }

  function intervalDescription(semitones) {
    if (semitones <= 0) return 'ein Ton — du hast sehr ruhig gehalten.';
    if (semitones === 1) return 'einen Halbtonschritt.';
    if (semitones === 2) return 'eine große Sekunde.';
    if (semitones === 3) return 'eine kleine Terz.';
    if (semitones === 4) return 'eine große Terz.';
    if (semitones === 5) return 'eine Quarte.';
    if (semitones === 7) return 'eine Quinte.';
    if (semitones === 9) return 'eine große Sexte.';
    if (semitones === 12) return 'eine ganze Oktave.';
    if (semitones > 12) return `mehr als eine Oktave (${semitones} Halbtöne).`;
    return `${semitones} Halbtöne.`;
  }

  function renderResult(analysis) {
    // Draw the final curve on the result canvas
    setupCanvas(resultCanvas);
    const ctx = resultCanvas.getContext('2d');
    drawFinalCurve(ctx, resultCanvas, samples, analysis);

    if (!analysis.hasVoice) {
      resultAnalysis.innerHTML = `
        <div class="metric" style="grid-column: 1 / -1;">
          <span class="metric-label">Kurz</span>
          <span class="metric-value">… noch nichts gehört.</span>
          <span class="metric-note">${analysis.message}</span>
        </div>
      `;
      return;
    }

    const stability = stabilityDescription(analysis.rmsCents);
    const interval = intervalDescription(analysis.semitones);

    resultAnalysis.innerHTML = `
      <div class="metric">
        <span class="metric-label">Dominanter Ton</span>
        <span class="metric-value">${analysis.dominantNote} · ${Math.round(analysis.dominantFreq)} Hz</span>
        <span class="metric-note">Du hast meistens um ${analysis.dominantNote} gesungen.</span>
      </div>
      <div class="metric">
        <span class="metric-label">Stabilität</span>
        <span class="metric-value">±${Math.round(analysis.rmsCents)} Cent — ${stability.label}</span>
        <span class="metric-note">${stability.detail}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Umfang</span>
        <span class="metric-value">${analysis.minNote} &rarr; ${analysis.maxNote}</span>
        <span class="metric-note">Du hast ${interval}</span>
      </div>
    `;
  }

  // --- Canvas rendering ---
  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clearCanvas(canvas, ctx) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0f1412');
    g.addColorStop(1, '#1a2220');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, w, h);
  }

  function drawGrid(ctx, w, h) {
    // Horizontal reference lines at octave boundaries
    ctx.strokeStyle = 'rgba(255, 251, 243, 0.06)';
    ctx.lineWidth = 1;
    const lnMin = Math.log(MIN_FREQ);
    const lnMax = Math.log(MAX_FREQ);
    // Reference A-notes with labels
    const refs = [
      { hz: 110, label: 'A2' },
      { hz: 220, label: 'A3' },
      { hz: 440, label: 'A4' },
      { hz: 880, label: 'A5' }
    ];
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 251, 243, 0.3)';
    for (const ref of refs) {
      if (ref.hz < MIN_FREQ || ref.hz > MAX_FREQ) continue;
      const y = h * (1 - (Math.log(ref.hz) - lnMin) / (lnMax - lnMin));
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillText(`${ref.label} · ${ref.hz} Hz`, 8, y - 4);
    }
  }

  function freqToY(freq, h) {
    if (!freq) return null;
    const lnMin = Math.log(MIN_FREQ);
    const lnMax = Math.log(MAX_FREQ);
    const t = (Math.log(freq) - lnMin) / (lnMax - lnMin);
    return h * (1 - Math.max(0, Math.min(1, t)));
  }

  function stabilityColor(localVariance) {
    // localVariance in cents (0..100)
    // stable => mint (#00d4a6); wobbly => rose/amber
    const v = Math.min(1, localVariance / 80);
    // interpolate mint -> amber -> rose
    const mint = [0, 212, 166];
    const amber = [234, 168, 90];
    const rose = [224, 118, 145];
    let a, b, lt;
    if (v < 0.5) { a = mint; b = amber; lt = v / 0.5; }
    else { a = amber; b = rose; lt = (v - 0.5) / 0.5; }
    return [
      Math.round(a[0] + (b[0] - a[0]) * lt),
      Math.round(a[1] + (b[1] - a[1]) * lt),
      Math.round(a[2] + (b[2] - a[2]) * lt)
    ];
  }

  function drawLiveFrame(ctx, canvas, all, elapsed) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    clearCanvas(canvas, ctx);

    if (all.length < 2) return;
    drawCurveOn(ctx, w, h, all, elapsed, RECORD_SECONDS);
  }

  function drawFinalCurve(ctx, canvas, all, analysis) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    clearCanvas(canvas, ctx);
    // Overlay: dominant note line
    if (analysis && analysis.hasVoice) {
      const y = freqToY(analysis.dominantFreq, h);
      ctx.strokeStyle = 'rgba(0, 212, 166, 0.45)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0, 212, 166, 0.95)';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.fillText(`${analysis.dominantNote} (${Math.round(analysis.dominantFreq)} Hz)`, w - 140, y - 6);
    }

    drawCurveOn(ctx, w, h, all, RECORD_SECONDS, RECORD_SECONDS);

    // Title overlay in bottom left
    ctx.fillStyle = 'rgba(255, 251, 243, 0.82)';
    ctx.font = 'italic 13px Fraunces, serif';
    ctx.fillText('Stimme zeigen · 5 s', 12, h - 10);
  }

  function drawCurveOn(ctx, w, h, all, elapsed, totalSeconds) {
    // Time axis: 0..totalSeconds maps to 0..w
    const filtered = all.filter((s) => s.freq && s.freq >= MIN_FREQ && s.freq <= MAX_FREQ);
    if (filtered.length < 2) return;

    // Compute local variance in cents over a sliding window (±3 samples) for color
    const cents = [];
    for (let i = 0; i < filtered.length; i++) {
      // Use a reference of the point itself to look at local jitter
      let sumSq = 0, count = 0;
      for (let j = Math.max(0, i - 3); j <= Math.min(filtered.length - 1, i + 3); j++) {
        if (j === i) continue;
        const c = 1200 * Math.log2(filtered[j].freq / filtered[i].freq);
        sumSq += c * c; count++;
      }
      cents.push(count > 0 ? Math.sqrt(sumSq / count) : 0);
    }

    // Draw as segmented polyline so we can vary color per segment
    for (let i = 0; i < filtered.length - 1; i++) {
      const s0 = filtered[i];
      const s1 = filtered[i + 1];
      const x0 = (s0.t / totalSeconds) * w;
      const x1 = (s1.t / totalSeconds) * w;
      const y0 = freqToY(s0.freq, h);
      const y1 = freqToY(s1.freq, h);
      if (y0 === null || y1 === null) continue;

      const rmsAvg = (s0.rms + s1.rms) / 2;
      const thickness = Math.max(1.2, Math.min(8, 1.5 + rmsAvg * 60));
      const varC = (cents[i] + cents[i + 1]) / 2;
      const [r, g, b] = stabilityColor(varC);

      // Halo
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.25)`;
      ctx.lineWidth = thickness + 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Core
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // Current position indicator (only during live)
    if (elapsed < totalSeconds) {
      const x = (elapsed / totalSeconds) * w;
      ctx.strokeStyle = 'rgba(255, 251, 243, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  // --- Demo wave (CTA state) ---
  function drawDemoWave(canvas, mode) {
    if (!canvas) return;
    setupCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    function render(phase) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0f1412');
      g.addColorStop(1, '#1a2220');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Reference grid
      ctx.strokeStyle = 'rgba(255, 251, 243, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Demo curve: pseudo-stimme (sinus with harmonic wobble)
      const yCenter = h * 0.55;
      const amplitudeBase = h * 0.15;

      // Two layered curves for depth
      const colors = [
        { r: 0, g: 212, b: 166, a: 0.55 },     // mint halo
        { r: 224, g: 160, b: 70, a: 0.4 },     // amber low
      ];

      for (const c of colors) {
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
        ctx.lineWidth = c.a > 0.5 ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = x / w;
          const y = yCenter
            + Math.sin(t * Math.PI * 4 + phase) * amplitudeBase
            + Math.sin(t * Math.PI * 11 + phase * 1.3) * amplitudeBase * 0.3
            + (c.a > 0.5 ? 0 : amplitudeBase * 0.8);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = 'rgba(255, 251, 243, 0.32)';
      ctx.font = 'italic 13px Fraunces, serif';
      ctx.fillText('… so könnte deine Stimme aussehen', 14, h - 14);
    }

    if (mode === 'animate') {
      let phase = 0;
      let running = true;
      let raf = null;
      const step = () => {
        if (!running) return;
        phase += 0.02;
        render(phase);
        raf = requestAnimationFrame(step);
      };
      // Stop when the CTA panel is hidden (we avoid burning CPU on unused state)
      const observer = new MutationObserver(() => {
        const hidden = canvas.closest('.stage-panel')?.hidden;
        if (hidden && running) {
          running = false;
          if (raf) cancelAnimationFrame(raf);
        } else if (!hidden && !running) {
          running = true;
          step();
        }
      });
      observer.observe(canvas.closest('.stage-panel'), { attributes: true, attributeFilter: ['hidden'] });
      step();
    } else {
      render(1.2);
    }
  }

})();
