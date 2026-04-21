// v18-chapbook — scroll-driven page turns with slight overlap.
// GSAP ScrollTrigger maps scroll progress 0→1 across all pages.

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;

const book = document.getElementById("book");
const pages = book ? Array.from(book.querySelectorAll(".page")) : [];
const rcNum = document.getElementById("rcNum");
const stage = document.getElementById("bookStage");

if (rcNum) {
  const tot = document.querySelector(".rc-tot");
  if (tot) tot.textContent = String(pages.length);
}

// Reduced-motion: bail entirely — CSS renders all pages flat/stacked.
if (REDUCED_MOTION) {
  // Make sure pages are all visible; no JS interaction needed.
  pages.forEach((p) => p.classList.remove("turned"));
} else {
  // Initial z-index: top page is the cover (highest), last is bottom.
  // When a page turns, its z-index drops so the next page shows through.
  const applyStack = () => {
    pages.forEach((p, i) => {
      p.style.zIndex = String(pages.length - i);
    });
  };
  applyStack();

  // Load GSAP + ScrollTrigger from CDN as ES modules is clunky; use plain script tags loaded async.
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

  const boot = async () => {
    try {
      await loadScript("https://unpkg.com/gsap@3/dist/gsap.min.js");
      await loadScript("https://unpkg.com/gsap@3/dist/ScrollTrigger.min.js");
    } catch (e) {
      // If CDN fails, fall back to flat layout
      console.warn("[chapbook] GSAP load failed — using flat fallback", e);
      stage.style.height = "auto";
      book.style.position = "static";
      book.style.height = "auto";
      book.style.flexDirection = "column";
      book.style.padding = "40px 16px";
      pages.forEach((p) => {
        p.style.position = "relative";
        p.style.transform = "none";
        p.style.width = "min(640px, 92vw)";
        p.style.height = "auto";
        p.style.marginBottom = "24px";
      });
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    // Each page turn takes its own slice of total scroll.
    // Pages 2..N turn; page 1 (cover) is the very first turn.
    // We use overlap so that page N-1 is still turning when N starts (0.12 overlap).
    const turnCount = pages.length - 1; // final page stays visible at end
    const OVERLAP = 0.12;

    // Map: for each turn index t (0-based), it runs from
    //   start = t * (1 - OVERLAP) / turnCount
    //   end   = start + 1 / turnCount
    const slotStart = (t) => (t * (1 - OVERLAP)) / turnCount;
    const slotEnd = (t) => slotStart(t) + 1 / turnCount;

    // Mobile uses a simpler fade/slide model (.active + .turned).
    // Desktop uses 3D rotateY.

    ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress; // 0..1

        if (IS_MOBILE) {
          // Determine active page index
          let activeIdx = Math.min(pages.length - 1, Math.floor(p * pages.length));
          pages.forEach((page, i) => {
            page.classList.toggle("active", i === activeIdx);
            page.classList.toggle("turned", i < activeIdx);
          });
          if (rcNum) rcNum.textContent = String(activeIdx + 1);
          return;
        }

        // Desktop: compute rotateY per page based on slot progress.
        let currentPage = 1;
        pages.forEach((page, i) => {
          if (i >= turnCount) {
            // Last page never turns
            page.style.transform = "rotateY(0deg)";
            return;
          }
          const s = slotStart(i);
          const e = slotEnd(i);
          let local;
          if (p <= s) local = 0;
          else if (p >= e) local = 1;
          else local = (p - s) / (e - s);

          // Ease — custom cubic for paper-like feel (fast start, slow settle)
          const eased = local < 0.5
            ? 2 * local * local
            : 1 - Math.pow(-2 * local + 2, 2) / 2;

          const angle = eased * -178;
          page.style.transform = `rotateY(${angle}deg)`;

          // Z-index: once past ~0.5, drop this page behind later pages
          if (eased > 0.5) {
            page.style.zIndex = String(i);
          } else {
            page.style.zIndex = String(pages.length - i);
          }

          // Count turned pages to drive the reader cue
          if (eased >= 0.5) currentPage = i + 2;
        });

        if (rcNum) rcNum.textContent = String(Math.min(pages.length, currentPage));
      }
    });

    // Refresh on load to catch font reflows
    window.addEventListener("load", () => ScrollTrigger.refresh());
  };

  boot();
}
