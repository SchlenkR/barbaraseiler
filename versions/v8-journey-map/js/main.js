// v8-journey-map — Kartografische Route.
// Route segments animate via stroke-dashoffset when the corresponding
// station enters the viewport. No scroll-hijack. Progressive enhancement.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Route segments: prepare stroke animation ---------- */
// We use getTotalLength() to calculate each segment's length, then
// set a large stroke-dasharray (length + length) plus an initial
// dashoffset equal to -length, so the segment starts fully "undrawn".
// When the paired station enters view, we set dashoffset to 0 and
// the path draws itself along its length.
const routeSegments = Array.from(document.querySelectorAll(".route-seg"));

function prepareSegment(seg) {
  if (!seg || typeof seg.getTotalLength !== "function") return;
  const len = seg.getTotalLength();
  if (!isFinite(len) || len <= 0) return;
  // Override dasharray with one long dash + gap to cover full length.
  // This keeps the "dashed old-map look" while also being offset-animatable.
  // Trick: draw a solid line via dashArray [L, L] and use dashoffset.
  // We layer the visual dashed style differently by leaving stroke-dasharray
  // here to produce a drawn line; the hand-drawn dashed feel is provided
  // by dash + gap = 6 6 pattern we re-introduce after the draw completes.
  seg.style.strokeDasharray = `${len} ${len}`;
  seg.style.strokeDashoffset = `${len}`;
  seg.dataset.len = String(len);
}

routeSegments.forEach(prepareSegment);

function drawSegment(seg) {
  if (!seg) return;
  if (prefersReducedMotion) {
    seg.style.strokeDashoffset = "0";
    seg.style.opacity = "1";
    seg.classList.add("is-drawn");
    return;
  }
  // Make sure the browser has painted the initial state before animating.
  requestAnimationFrame(() => {
    seg.style.opacity = "1";
    seg.style.strokeDashoffset = "0";
    seg.classList.add("is-drawn");
    // After draw completes, re-apply the dashed "old-map" pattern so the
    // route keeps its hand-drawn stylistic dashes rather than a solid line.
    const len = parseFloat(seg.dataset.len || "0") || 0;
    window.setTimeout(() => {
      seg.style.strokeDasharray = "6 6";
      seg.style.strokeDashoffset = "0";
    }, 650);
  });
}

/* If prefers-reduced-motion: show all segments immediately, solid,
   but still with their old-map dashed visual pattern. */
if (prefersReducedMotion) {
  routeSegments.forEach((seg) => {
    seg.style.strokeDasharray = "6 6";
    seg.style.strokeDashoffset = "0";
    seg.style.opacity = "1";
    seg.classList.add("is-drawn");
  });
}

/* ---------- Station reveal + route activation ---------- */
const stations = Array.from(document.querySelectorAll(".station"));
const miniLinks = Array.from(document.querySelectorAll("#routeMini a"));
const mapStations = Array.from(document.querySelectorAll(".map-station"));

function stationIndex(id) {
  const m = /^s(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) - 1 : -1;
}

function setActiveStation(idx) {
  miniLinks.forEach((a, i) => {
    a.classList.toggle("is-active", i === idx);
    a.classList.toggle("is-passed", i < idx);
  });
  mapStations.forEach((g, i) => {
    g.classList.toggle("is-active", i === idx);
  });
}

/* IntersectionObserver: reveal stations + draw the preceding route segment */
if ("IntersectionObserver" in window) {
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");

      // Draw the segment that leads *to* this station.
      // Station index 1-based from data-station; segment N connects
      // station N (start) to station N+1 (end). So when station k enters,
      // we draw segment k-1 (the segment whose end = station k).
      const stationN = parseInt(entry.target.dataset.station || "0", 10);
      if (stationN >= 2) {
        const seg = document.querySelector(`.route-seg[data-seg="${stationN - 1}"]`);
        drawSegment(seg);
      }
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px"
  });
  stations.forEach((s) => revealIo.observe(s));

  // Active tracking for mini-nav / map highlight
  const activeIo = new IntersectionObserver((entries) => {
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
  // Fallback: reveal all and draw all
  stations.forEach((s) => s.classList.add("is-visible"));
  routeSegments.forEach((seg) => drawSegment(seg));
}

/* ---------- Smooth-scroll on mini-nav / map station click (native, no hijack) ---------- */
function bindAnchorScroll(a) {
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
    const idx = stationIndex(target.id);
    if (idx >= 0) setActiveStation(idx);
    if (history.replaceState) history.replaceState(null, "", href);
  });
}

miniLinks.forEach(bindAnchorScroll);
mapStations.forEach(bindAnchorScroll);

/* ---------- Phone reveal (obfuscation) ---------- */
const phoneBtn = document.getElementById("phoneRevealBtn");
const phoneLabel = document.getElementById("phoneLabel");

if (phoneBtn && phoneLabel) {
  phoneBtn.addEventListener("click", () => {
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
