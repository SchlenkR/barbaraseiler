/* v28-mirror — main.js
   Vanilla JS. Privacy first.
   Stream stays local: no fetch, no WebSocket, no MediaRecorder.
*/

(() => {
  'use strict';

  // ---- State -------------------------------------------------------------

  const state = {
    mediaStream: null,
    audioCtx: null,
    analyser: null,
    sourceNode: null,
    video: null,            // off-DOM <video>
    rafId: null,
    running: false
  };

  // ---- DOM ---------------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  const dlg        = $('consent');
  const yesBtn     = $('consentYes');
  const noBtn      = $('consentNo');
  const stopBtn    = $('stopBtn');
  const stageFrame = $('stageFrame');
  const mirror     = $('mirrorCanvas');
  const bars       = $('barsCanvas');
  const rings      = $('rings');
  const stagePriv  = $('stagePrivacy');
  const status     = $('stageStatus');

  const form       = $('probeForm');
  const fName      = $('f-name');
  const fEmail     = $('f-email');
  const fMsg       = $('f-msg');
  const eName      = $('err-name');
  const eEmail     = $('err-email');
  const eMsg       = $('err-msg');
  const formOk     = $('formOk');

  const revealBtn  = $('revealPhone');
  const phoneBox   = $('phoneReveal');

  // ---- Consent dialog ---------------------------------------------------

  function openConsent() {
    // Defer until DOM ready + a tick so focus works reliably
    try {
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        // Fallback for very old browsers: treat as open
        dlg.setAttribute('open', '');
      }
    } catch (_) {
      dlg.setAttribute('open', '');
    }
  }
  function closeConsent() {
    try { if (dlg.open) dlg.close(); } catch (_) {}
    dlg.removeAttribute('open');
  }

  yesBtn.addEventListener('click', () => {
    closeConsent();
    startMirror().catch((err) => {
      setStatus(friendlyMediaError(err));
      showFallback();
    });
  });

  noBtn.addEventListener('click', () => {
    closeConsent();
    setStatus('Alles gut — nur lesen. Der Spiegel bleibt eine Zeichnung.');
    showFallback();
  });

  // ---- Mirror mode (camera + audio) -------------------------------------

  async function startMirror() {
    if (state.running) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('NOT_SUPPORTED');
    }

    setStatus('Frage Kamera und Mikrofon an…');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 } },
      audio: true
    });

    state.mediaStream = stream;

    // Video element (off-DOM; just used as source for canvas)
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;            // important: no audio feedback
    video.playsInline = true;
    video.srcObject = stream;

    await new Promise((resolve) => {
      if (video.readyState >= 2) return resolve();
      video.addEventListener('loadedmetadata', () => resolve(), { once: true });
    });

    try { await video.play(); } catch (_) { /* ignore */ }

    state.video = video;

    // Audio graph
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
        src.connect(analyser);
        // DO NOT connect analyser to ctx.destination (no feedback)
        state.audioCtx = ctx;
        state.sourceNode = src;
        state.analyser = analyser;
      }
    } catch (e) {
      // Audio is optional — camera still works
      console.warn('Audio setup failed:', e);
    }

    // UI swap
    if (rings) rings.setAttribute('hidden', '');
    mirror.hidden = false;
    bars.hidden = false;
    stopBtn.hidden = false;
    stagePriv.hidden = false;

    state.running = true;
    setStatus('Live. Nichts wird übertragen.');

    loop();
  }

  function loop() {
    if (!state.running) return;
    if (document.hidden) {
      // pause drawing while tab hidden (privacy + perf)
      state.rafId = requestAnimationFrame(loop);
      return;
    }

    drawMirror();
    drawBars();

    state.rafId = requestAnimationFrame(loop);
  }

  function drawMirror() {
    const v = state.video;
    if (!v || v.readyState < 2) return;
    const ctx = mirror.getContext('2d');
    if (!ctx) return;

    // Fit canvas to its CSS size (cheaply)
    const cssW = mirror.clientWidth || 960;
    const cssH = mirror.clientHeight || 540;
    if (mirror.width !== cssW) mirror.width = cssW;
    if (mirror.height !== cssH) mirror.height = cssH;

    // Mirror horizontally (feels like looking into a mirror)
    ctx.save();
    ctx.translate(mirror.width, 0);
    ctx.scale(-1, 1);

    // Grayscale + high contrast via ctx.filter (where supported)
    const supportsFilter = typeof ctx.filter === 'string';
    if (supportsFilter) {
      ctx.filter = 'grayscale(1) contrast(1.15)';
    }

    // cover
    const vr = v.videoWidth / v.videoHeight;
    const cr = mirror.width / mirror.height;
    let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
    if (vr > cr) {
      sw = v.videoHeight * cr;
      sx = (v.videoWidth - sw) / 2;
    } else {
      sh = v.videoWidth / cr;
      sy = (v.videoHeight - sh) / 2;
    }
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, mirror.width, mirror.height);

    if (supportsFilter) ctx.filter = 'none';
    ctx.restore();

    // Fallback pixel grayscale for browsers without ctx.filter
    if (!supportsFilter) {
      try {
        const img = ctx.getImageData(0, 0, mirror.width, mirror.height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const g = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) | 0;
          // contrast 1.15 around 128
          const c = clamp((g - 128) * 1.15 + 128);
          d[i] = d[i+1] = d[i+2] = c;
        }
        ctx.putImageData(img, 0, 0);
      } catch (_) { /* ignore */ }
    }
  }

  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  function drawBars() {
    const a = state.analyser;
    if (!a) return;
    const ctx = bars.getContext('2d');
    if (!ctx) return;

    const cssW = bars.clientWidth || 320;
    const cssH = bars.clientHeight || 540;
    if (bars.width !== cssW) bars.width = cssW;
    if (bars.height !== cssH) bars.height = cssH;

    const W = bars.width;
    const H = bars.height;

    const BARS = 32;
    const binCount = a.frequencyBinCount;      // fftSize/2 = 1024
    const data = new Uint8Array(binCount);
    a.getByteFrequencyData(data);

    ctx.clearRect(0, 0, W, H);

    // Use logarithmic bin grouping so low/mid freqs get more resolution
    // We ignore highest bins (mostly noise)
    const maxBin = Math.floor(binCount * 0.55);
    const minBin = 2;

    const gap = 2;
    const barW = (W - gap * (BARS + 1)) / BARS;

    for (let i = 0; i < BARS; i++) {
      const t0 = i / BARS;
      const t1 = (i + 1) / BARS;
      const b0 = Math.floor(minBin + (maxBin - minBin) * Math.pow(t0, 1.6));
      const b1 = Math.max(b0 + 1, Math.floor(minBin + (maxBin - minBin) * Math.pow(t1, 1.6)));

      let sum = 0;
      for (let b = b0; b < b1; b++) sum += data[b];
      const avg = sum / (b1 - b0); // 0..255

      const v = avg / 255;
      const h = Math.max(1, v * (H - 4));
      const x = gap + i * (barW + gap);
      const y = H - h - 2;

      // warm off-white; alpha follows value
      ctx.fillStyle = `rgba(244, 240, 234, ${0.35 + 0.55 * v})`;
      ctx.fillRect(x, y, barW, h);
    }
  }

  // ---- Stop / cleanup ---------------------------------------------------

  function stopMirror(silent) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    state.running = false;

    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach((t) => {
        try { t.stop(); } catch (_) {}
      });
      state.mediaStream = null;
    }

    if (state.video) {
      try { state.video.pause(); } catch (_) {}
      state.video.srcObject = null;
      state.video = null;
    }

    if (state.audioCtx) {
      try { state.audioCtx.close(); } catch (_) {}
      state.audioCtx = null;
    }
    state.analyser = null;
    state.sourceNode = null;

    mirror.hidden = true;
    bars.hidden = true;
    stopBtn.hidden = true;
    stagePriv.hidden = true;
    if (rings) rings.removeAttribute('hidden');

    // wipe canvases so stale pixels don't linger
    try {
      const mc = mirror.getContext('2d');
      if (mc) mc.clearRect(0, 0, mirror.width, mirror.height);
      const bc = bars.getContext('2d');
      if (bc) bc.clearRect(0, 0, bars.width, bars.height);
    } catch (_) {}

    if (!silent) setStatus('Gestoppt. Kamera und Mikrofon sind aus.');
  }

  function showFallback() {
    if (rings) rings.removeAttribute('hidden');
    mirror.hidden = true;
    bars.hidden = true;
    stopBtn.hidden = true;
    stagePriv.hidden = true;
  }

  function setStatus(text) {
    if (status) status.textContent = text || '';
  }

  function friendlyMediaError(err) {
    if (!err) return 'Etwas ist schiefgelaufen. Versuch es später nochmal.';
    const name = err.name || err.message || '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Kein Problem — du hast die Freigabe verweigert. Der Spiegel bleibt eine Zeichnung.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'Keine Kamera oder kein Mikrofon gefunden. Der Spiegel bleibt eine Zeichnung.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'Die Kamera ist gerade von einem anderen Programm belegt.';
    }
    if (err.message === 'NOT_SUPPORTED') {
      return 'Dein Browser unterstützt die lokale Kamera-Ansicht leider nicht.';
    }
    return 'Zugriff war nicht möglich. Nichts wurde übertragen.';
  }

  // ---- Events ------------------------------------------------------------

  stopBtn.addEventListener('click', () => stopMirror(false));

  // Stop on tab leave / nav
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.running) {
      // keep stream but pause loop — we already handle that in loop()
    }
  });
  window.addEventListener('pagehide', () => stopMirror(true));
  window.addEventListener('beforeunload', () => stopMirror(true));

  // ESC on dialog = "no"
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeConsent();
    setStatus('Alles gut — nur lesen.');
    showFallback();
  });

  // Phone reveal ----------------------------------------------------------

  if (revealBtn && phoneBox) {
    revealBtn.addEventListener('click', () => {
      phoneBox.hidden = false;
      revealBtn.setAttribute('aria-expanded', 'true');
      revealBtn.hidden = true;
    });
  }

  // Form validation -------------------------------------------------------

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const okName = validateName();
      const okMail = validateEmail();
      const okMsg = validateMsg();
      if (okName && okMail && okMsg) {
        // This is a playground draft — no real submit endpoint.
        form.reset();
        formOk.hidden = false;
      } else {
        // focus the first invalid field
        const firstErr = form.querySelector('[aria-invalid="true"]');
        if (firstErr) firstErr.focus();
      }
    });

    fName.addEventListener('blur', validateName);
    fEmail.addEventListener('blur', validateEmail);
    fMsg.addEventListener('blur', validateMsg);
    [fName, fEmail, fMsg].forEach((el) => {
      el.addEventListener('input', () => {
        if (el.getAttribute('aria-invalid') === 'true') {
          el.setAttribute('aria-invalid', 'false');
          const id = el.id;
          if (id === 'f-name') eName.textContent = '';
          if (id === 'f-email') eEmail.textContent = '';
          if (id === 'f-msg') eMsg.textContent = '';
        }
      });
    });
  }

  function validateName() {
    const v = fName.value.trim();
    if (v.length < 2) {
      fName.setAttribute('aria-invalid', 'true');
      eName.textContent = 'Bitte mindestens zwei Zeichen.';
      return false;
    }
    fName.setAttribute('aria-invalid', 'false');
    eName.textContent = '';
    return true;
  }

  function validateEmail() {
    const v = fEmail.value.trim();
    // RFC-lite check
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (!ok) {
      fEmail.setAttribute('aria-invalid', 'true');
      eEmail.textContent = 'Bitte eine gültige E-Mail-Adresse.';
      return false;
    }
    fEmail.setAttribute('aria-invalid', 'false');
    eEmail.textContent = '';
    return true;
  }

  function validateMsg() {
    const v = fMsg.value.trim();
    if (v.length < 4) {
      fMsg.setAttribute('aria-invalid', 'true');
      eMsg.textContent = 'Schreib ein, zwei Wörter zu deinem Anlass.';
      return false;
    }
    fMsg.setAttribute('aria-invalid', 'false');
    eMsg.textContent = '';
    return true;
  }

  // ---- Init --------------------------------------------------------------

  // Open the consent dialog once the DOM is painted.
  // Slight delay so the user sees the page first (no jarring modal on load).
  const BOOT_DELAY_MS = 450;

  function boot() {
    const hasDialog = !!dlg && (typeof dlg.showModal === 'function' || typeof dlg.close === 'function');
    if (!hasDialog) {
      // No <dialog> support — show gentle inline fallback
      setStatus('Tipp: scroll runter zur Probestunde, um Kontakt aufzunehmen.');
      return;
    }
    setTimeout(openConsent, BOOT_DELAY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

})();
