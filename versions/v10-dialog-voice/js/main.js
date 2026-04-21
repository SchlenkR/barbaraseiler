// v10-dialog-voice — voice-memo interactions.
// Responsibilities:
//   1) Phone reveal (spam-obfuscation pattern, identical to parent).
//   2) Smooth-scroll for in-page anchors.
//   3) Simulated voice-memo playback: clicking the play button lights up the
//      waveform bars left-to-right over ~3-5 seconds. No real audio is played.
//   4) Respect prefers-reduced-motion: when active, we do NOT animate the
//      waveform — bars stay static, and the play button just toggles visual
//      state without simulating progress.
//   5) Only one voice-memo "plays" at a time — starting a new one pauses the
//      previous one (mirrors WhatsApp / iMessage behaviour).

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Phone reveal -----------------------------------------------------------
const phoneBtn = document.getElementById("phoneBtn");
if (phoneBtn) {
  phoneBtn.addEventListener("click", () => {
    const parts = ["+49", "555", "123", "456", "7"];
    const human = parts.join(" ");
    const href = "tel:" + parts.join("").replace("+", "+");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = human;
    phoneBtn.replaceWith(a);
  });
}

// --- In-page smooth-scroll --------------------------------------------------
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  });
});

// --- Voice-memo playback simulation ----------------------------------------

/**
 * Simulated-playback controller for a single voice-memo figure.
 * Playback duration is clamped to 3-5 seconds regardless of the data-duration
 * label (the brief specifies the *visual* sweep should take 3-5 s).
 */
function createVoiceMemo(figure) {
  const button = figure.querySelector(".play");
  const bars = Array.from(figure.querySelectorAll(".wave > span"));
  if (!button || bars.length === 0) return null;

  // Clamp visual sweep duration to 3-5 s, scaled loosely with the nominal
  // data-duration so longer memos feel slightly slower.
  const nominal = parseFloat(figure.dataset.duration || "6");
  const sweepMs = Math.max(3000, Math.min(5000, 2500 + nominal * 150));

  let rafId = null;
  let startTs = 0;
  let playing = false;

  function lightUpTo(ratio) {
    const cutoff = Math.floor(ratio * bars.length);
    for (let i = 0; i < bars.length; i++) {
      if (i < cutoff) bars[i].classList.add("lit");
      else bars[i].classList.remove("lit");
    }
  }

  function resetBars() {
    bars.forEach((b) => b.classList.remove("lit"));
  }

  function stop(finished) {
    playing = false;
    figure.classList.remove("playing");
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    // On manual pause we keep the partial fill; on finish we reset so the
    // next click starts fresh.
    if (finished) resetBars();
  }

  function tick(ts) {
    if (!startTs) startTs = ts;
    const elapsed = ts - startTs;
    const ratio = Math.min(1, elapsed / sweepMs);
    lightUpTo(ratio);
    if (ratio >= 1) {
      stop(true);
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (reduce) {
      // Reduced motion: no sweep animation. Flash all bars lit for a brief
      // moment to acknowledge the click, then clear. Non-animated: we just
      // toggle state without rAF.
      figure.classList.add("playing");
      bars.forEach((b) => b.classList.add("lit"));
      setTimeout(() => {
        resetBars();
        figure.classList.remove("playing");
      }, 350);
      return;
    }
    playing = true;
    startTs = 0;
    resetBars();
    figure.classList.add("playing");
    rafId = requestAnimationFrame(tick);
  }

  button.addEventListener("click", () => {
    if (playing) {
      stop(false);
      return;
    }
    // Pause every other memo before starting this one.
    window.__vmRegistry?.forEach((vm) => {
      if (vm !== api && vm.isPlaying()) vm.pause();
    });
    start();
  });

  const api = {
    isPlaying: () => playing,
    pause: () => stop(false),
  };
  return api;
}

// Register all voice-memos on the page.
window.__vmRegistry = [];
document.querySelectorAll("figure.vm").forEach((fig) => {
  const vm = createVoiceMemo(fig);
  if (vm) window.__vmRegistry.push(vm);
});

// --- Progressive-enhancement fade-in for memos as you scroll ---------------
if (!reduce && "IntersectionObserver" in window) {
  const memos = document.querySelectorAll(".vm");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );
  memos.forEach((m) => io.observe(m));
}
