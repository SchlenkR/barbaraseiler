// v9-audio — voice-memo / podcast app inspired
// No real audio. Track cards expand inline; a "now playing" indicator
// tracks whichever card is nearest the viewport center, as a homage
// to audio UIs. Respects prefers-reduced-motion.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- Track expand/collapse --------------------------------------------------
const tracks = document.querySelectorAll(".track");

tracks.forEach((track) => {
  const toggle = track.querySelector(".track-toggle");
  const body = track.querySelector(".track-body");
  if (!toggle || !body) return;

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    body.hidden = isOpen;
  });
});

// ---- "Now playing" indicator ------------------------------------------------
// Only if motion is allowed. Highlights the track closest to viewport center.
if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const trackEls = Array.from(document.querySelectorAll(".track"));

  const updateNowPlaying = () => {
    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let closestDist = Infinity;

    trackEls.forEach((t) => {
      const rect = t.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - viewportCenter);
      // only consider tracks currently partially visible
      if (rect.bottom > 0 && rect.top < window.innerHeight && dist < closestDist) {
        closest = t;
        closestDist = dist;
      }
    });

    trackEls.forEach((t) => {
      t.classList.toggle("is-playing", t === closest);
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateNowPlaying();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateNowPlaying();
}

// ---- Phone reveal -----------------------------------------------------------
const phoneBtn = document.getElementById("phoneRevealBtn");
if (phoneBtn) {
  phoneBtn.addEventListener("click", () => {
    const container = document.getElementById("phoneReveal");
    if (!container) return;
    container.innerHTML =
      '<p>Lieber anrufen?</p>' +
      '<a class="phone-revealed" href="tel:+495551234567">+49 (0)555 – 123 456 7</a>';
  });
}
