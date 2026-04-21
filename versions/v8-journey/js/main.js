// v8-journey — Progress indicator + scroll-linked progress bar + station reveal.
// No scroll-hijack. All enhancements progressive.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Progress line (scroll-linked) ---------- */
const progressFill = document.getElementById("progressLineFill");

function updateProgress() {
  if (!progressFill) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
  progressFill.style.width = (pct * 100).toFixed(2) + "%";
}

/* ---------- Journey dots state (active/passed) ---------- */
const stations = Array.from(document.querySelectorAll(".station"));
const dotLinks = Array.from(document.querySelectorAll("#journeyDots a"));

function stationIndex(id) {
  // id looks like "s3" -> index 2
  const match = /^s(\d+)$/.exec(id);
  return match ? parseInt(match[1], 10) - 1 : -1;
}

function setActiveStation(idx) {
  dotLinks.forEach((a, i) => {
    a.classList.toggle("is-active", i === idx);
    a.classList.toggle("is-passed", i < idx);
  });
}

/* ---------- IntersectionObserver: reveal stations + track active ---------- */
if ("IntersectionObserver" in window) {
  // Reveal
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px"
  });
  stations.forEach((s) => revealIo.observe(s));

  // Active tracking — use a center-line observer
  const activeIo = new IntersectionObserver((entries) => {
    // pick entry with highest intersectionRatio currently intersecting
    let best = null;
    entries.forEach((entry) => {
      if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
        best = entry;
      }
    });
    if (best) {
      const idx = stationIndex(best.target.id);
      if (idx >= 0) setActiveStation(idx);
    }
  }, {
    threshold: [0.35, 0.55, 0.75],
    rootMargin: "-30% 0px -30% 0px"
  });
  stations.forEach((s) => activeIo.observe(s));
} else {
  // Fallback: reveal all immediately
  stations.forEach((s) => s.classList.add("is-visible"));
}

/* ---------- Smooth-scroll on dot click (native, no hijack) ---------- */
dotLinks.forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
    // update active immediately for responsive feel
    const idx = stationIndex(target.id);
    if (idx >= 0) setActiveStation(idx);
    // update hash without jump
    if (history.replaceState) history.replaceState(null, "", href);
  });
});

/* ---------- Progress update on scroll ---------- */
let ticking = false;
function onScroll() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateProgress();
      ticking = false;
    });
    ticking = true;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();

/* ---------- Phone reveal (obfuscation) ---------- */
const phoneBtn = document.getElementById("phoneRevealBtn");
const phoneLabel = document.getElementById("phoneLabel");

if (phoneBtn && phoneLabel) {
  phoneBtn.addEventListener("click", () => {
    // Reassemble number client-side: +49 179 371 370 6
    const parts = ["+49", "179", "371", "370", "6"];
    const display = parts.join(" ");
    const href = "tel:+49" + parts.slice(1).join("");
    phoneLabel.innerHTML = "";
    const link = document.createElement("a");
    link.href = href;
    link.textContent = display;
    link.style.color = "inherit";
    link.style.textDecoration = "underline";
    link.style.textUnderlineOffset = "3px";
    phoneLabel.appendChild(link);
    phoneBtn.setAttribute("aria-expanded", "true");
    phoneBtn.disabled = true;
    phoneBtn.style.cursor = "default";
  });
}
