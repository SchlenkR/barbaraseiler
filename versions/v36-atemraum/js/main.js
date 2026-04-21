// v36 Atemraum · Breath-Gate
// Vanilla JS, no libs. Web Audio pink-noise synthesised on-device, gain 0.06 max.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'v36-atemraum:completed';
const TOTAL_MS = 60_000;
const CYCLE_MS = 12_000; // 4 in + 2 hold + 6 out
const PHASE_IN_MS = 4_000;
const PHASE_HOLD_MS = 2_000;
// const PHASE_OUT_MS = 6_000;  // derived: CYCLE - IN - HOLD

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

const gate = document.getElementById('gate');
const gateYes = document.getElementById('gate-yes');
const gateNo = document.getElementById('gate-no');

const skipBanner = document.getElementById('skip-banner');
const skipResume = document.getElementById('skip-resume');
const skipClose = document.getElementById('skip-close');

const returnBanner = document.getElementById('return-banner');
const returnBreathe = document.getElementById('return-breathe');
const returnClose = document.getElementById('return-close');

const welcomeBanner = document.getElementById('welcome-banner');

const breath = document.getElementById('breath');
const breathCancel = document.getElementById('breath-cancel');
const breathSound = document.getElementById('breath-sound');
const breathPhase = document.getElementById('breath-phase');
const breathCountdown = document.getElementById('breath-countdown');
const breathCircle = document.getElementById('breath-circle');

const content = document.getElementById('content');

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  running: false,
  startTs: 0,       // performance.now() at start
  elapsedAccum: 0,  // ms accumulated before current segment (for pause)
  rafId: 0,
  lastPhase: '',
  audioOn: false,
};

// ---------------------------------------------------------------------------
// Audio — soft pink noise, gain 0.06
// ---------------------------------------------------------------------------

const audio = {
  ctx: null,
  source: null,
  gain: null,
  filter: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    // pink noise via AudioWorklet-less method: buffer filled with pink noise
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Voss-McCartney approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 800;
    this.filter.Q.value = 0.5;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;

    this.source.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.source.start(0);
  },

  async on() {
    this.init();
    if (!this.ctx) return;
    try { if (this.ctx.state === 'suspended') await this.ctx.resume(); } catch (_) {}
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
  },

  off() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(0, now + 0.6);
  },
};

// ---------------------------------------------------------------------------
// Breath loop
// ---------------------------------------------------------------------------

function currentElapsed() {
  if (!state.running) return state.elapsedAccum;
  return state.elapsedAccum + (performance.now() - state.startTs);
}

function phaseFor(ms) {
  const pos = ms % CYCLE_MS;
  if (pos < PHASE_IN_MS) return 'Einatmen';
  if (pos < PHASE_IN_MS + PHASE_HOLD_MS) return 'Halten';
  return 'Ausatmen';
}

function tick() {
  if (!state.running) return;
  const elapsed = currentElapsed();
  const remaining = Math.max(0, TOTAL_MS - elapsed);
  const secondsLeft = Math.ceil(remaining / 1000);

  breathCountdown.textContent = String(secondsLeft);

  const phase = phaseFor(elapsed);
  if (phase !== state.lastPhase) {
    state.lastPhase = phase;
    breathPhase.textContent = phase;
  }

  if (elapsed >= TOTAL_MS) {
    completeBreath();
    return;
  }
  state.rafId = requestAnimationFrame(tick);
}

function openBreath() {
  // reset
  state.running = true;
  state.elapsedAccum = 0;
  state.startTs = performance.now();
  state.lastPhase = '';

  breath.hidden = false;
  breath.classList.remove('paused');
  document.body.style.overflow = 'hidden';

  // restart CSS animation cleanly
  breathCircle.style.animation = 'none';
  // force reflow so animation restart takes effect
  void breathCircle.offsetWidth;
  breathCircle.style.animation = '';

  breathPhase.textContent = 'Einatmen';
  breathCountdown.textContent = '60';

  // focus for a11y
  breathCancel.focus({ preventScroll: true });

  state.rafId = requestAnimationFrame(tick);
}

function closeBreath({ completed }) {
  cancelAnimationFrame(state.rafId);
  state.running = false;

  const elapsedSec = Math.min(60, Math.round(currentElapsed() / 1000));

  breath.hidden = true;
  document.body.style.overflow = '';
  audio.off();
  state.audioOn = false;
  breathSound.setAttribute('aria-pressed', 'false');
  breathSound.querySelector('.breath-sound-label').textContent = 'Ton: aus';

  revealContent();

  if (completed) {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}
    showWelcome();
  } else if (elapsedSec > 2) {
    // Partial breathe — show a soft skip banner telling them how long.
    skipBanner.hidden = false;
    const p = skipBanner.querySelector('p');
    p.innerHTML = '';
    p.append(
      document.createTextNode(`Du hast ${elapsedSec} Sekunden geatmet. Auch das zählt. `),
    );
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link-button';
    btn.textContent = 'Nochmal von vorn →';
    btn.addEventListener('click', () => {
      skipBanner.hidden = true;
      openBreath();
    });
    p.appendChild(btn);
  }
}

function completeBreath() {
  closeBreath({ completed: true });
}

function showWelcome() {
  welcomeBanner.hidden = false;
  requestAnimationFrame(() => {
    welcomeBanner.setAttribute('data-visible', 'true');
  });
  setTimeout(() => {
    welcomeBanner.setAttribute('data-visible', 'false');
    setTimeout(() => { welcomeBanner.hidden = true; }, 900);
  }, 3500);
}

// ---------------------------------------------------------------------------
// Content reveal
// ---------------------------------------------------------------------------

function revealContent() {
  if (gate && !gate.hidden) {
    gate.hidden = true;
  }
  if (content.hidden) {
    content.hidden = false;
    requestAnimationFrame(() => content.setAttribute('data-visible', 'true'));
  }
}

// ---------------------------------------------------------------------------
// Gate wiring
// ---------------------------------------------------------------------------

gateYes.addEventListener('click', () => {
  gate.hidden = true;
  openBreath();
});

gateNo.addEventListener('click', () => {
  gate.hidden = true;
  revealContent();
  skipBanner.hidden = false;
});

// Skip-banner resume
skipResume.addEventListener('click', () => {
  skipBanner.hidden = true;
  openBreath();
});
skipClose.addEventListener('click', () => { skipBanner.hidden = true; });

// Return-banner
returnBreathe.addEventListener('click', () => {
  returnBanner.hidden = true;
  openBreath();
});
returnClose.addEventListener('click', () => { returnBanner.hidden = true; });

// Breath controls
breathCancel.addEventListener('click', () => closeBreath({ completed: false }));

breathSound.addEventListener('click', async () => {
  state.audioOn = !state.audioOn;
  breathSound.setAttribute('aria-pressed', String(state.audioOn));
  breathSound.querySelector('.breath-sound-label').textContent = state.audioOn ? 'Ton: an' : 'Ton: aus';
  if (state.audioOn) {
    await audio.on();
  } else {
    audio.off();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !breath.hidden) {
    closeBreath({ completed: false });
  }
});

// Pause on hidden, resume on visible
document.addEventListener('visibilitychange', () => {
  if (breath.hidden) return;
  if (document.hidden) {
    if (state.running) {
      state.running = false;
      state.elapsedAccum = state.elapsedAccum + (performance.now() - state.startTs);
      cancelAnimationFrame(state.rafId);
      breath.classList.add('paused');
      audio.off();
    }
  } else {
    if (!state.running && state.elapsedAccum < TOTAL_MS) {
      state.running = true;
      state.startTs = performance.now();
      breath.classList.remove('paused');
      if (state.audioOn) audio.on();
      state.rafId = requestAnimationFrame(tick);
    }
  }
});

// ---------------------------------------------------------------------------
// Phone reveal
// ---------------------------------------------------------------------------

const phoneBtn = document.getElementById('phone-reveal');
const phoneSub = document.getElementById('phone-sub');
if (phoneBtn && phoneSub) {
  phoneBtn.addEventListener('click', () => {
    const expanded = phoneBtn.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      phoneBtn.setAttribute('aria-expanded', 'false');
      phoneSub.textContent = 'Nummer zeigen';
    } else {
      phoneBtn.setAttribute('aria-expanded', 'true');
      phoneSub.textContent = '+49 (0)555 – 123 456 7';
    }
  });
}

// ---------------------------------------------------------------------------
// Form validation (light)
// ---------------------------------------------------------------------------

const form = document.getElementById('contact-form');
const formError = document.getElementById('form-error');
if (form && formError) {
  form.addEventListener('input', (e) => {
    const t = e.target;
    if (t && 'setAttribute' in t) t.setAttribute('data-touched', 'true');
  });

  form.addEventListener('submit', (e) => {
    const fields = form.querySelectorAll('input[required], textarea[required]');
    let ok = true;
    fields.forEach((f) => {
      f.setAttribute('data-touched', 'true');
      if (!f.checkValidity()) ok = false;
    });
    if (!ok) {
      e.preventDefault();
      formError.hidden = false;
      const first = form.querySelector('input[required]:invalid, textarea[required]:invalid');
      if (first) first.focus();
    } else {
      formError.hidden = true;
    }
  });
}

// ---------------------------------------------------------------------------
// Boot — check localStorage flag: returning visitor skips the gate.
// ---------------------------------------------------------------------------

(function boot() {
  let completedFlag = null;
  try { completedFlag = localStorage.getItem(STORAGE_KEY); } catch (_) {}

  if (completedFlag) {
    // Returning visitor — no gate, show dezenter Hinweis
    gate.hidden = true;
    revealContent();
    returnBanner.hidden = false;
  }
})();
