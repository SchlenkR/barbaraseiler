// v6 — "Was bringt dich her?" — pathway IA
// Minimal progressive enhancement: chip->path marking, hide-on-scroll nav,
// IntersectionObserver reveal fallback, phone reveal.

const prefersReduced =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- 1. Hide-on-scroll nav with hysteresis (accumulated delta) ----
(() => {
  const nav = document.getElementById("nav");
  if (!nav) return;

  let lastY = window.scrollY;
  let accDown = 0;
  let accUp = 0;
  const THRESHOLD = 56; // px of accumulated delta before toggling
  const SCROLLED_AT = 12;

  const onScroll = () => {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;

    // Scrolled state (border)
    nav.classList.toggle("is-scrolled", y > SCROLLED_AT);

    // Always visible near the top
    if (y < 120) {
      nav.classList.remove("is-hidden");
      accDown = 0;
      accUp = 0;
      return;
    }

    if (dy > 0) {
      accDown += dy;
      accUp = 0;
      if (accDown > THRESHOLD) nav.classList.add("is-hidden");
    } else if (dy < 0) {
      accUp += -dy;
      accDown = 0;
      if (accUp > THRESHOLD) nav.classList.remove("is-hidden");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
})();

// ---- 2. Chip -> path active marking ----
(() => {
  const chips = document.querySelectorAll(".chip[data-path]");
  const paths = document.querySelectorAll(".path[data-path]");

  const setActive = (key) => {
    paths.forEach((p) => {
      p.classList.toggle("is-active", p.dataset.path === key);
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const key = chip.dataset.path;
      setActive(key);
      // smooth scroll handled natively via href="#..."
    });
  });

  // Also honor deep-links (#anfaenger etc.)
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const match = Array.from(paths).find((p) => p.dataset.path === hash);
    if (match) setActive(match.dataset.path);
  }
})();

// ---- 3. Reveal-on-scroll fallback (only if CSS scroll-driven not supported) ----
(() => {
  if (prefersReduced) return;
  const supportsTimeline = CSS.supports("animation-timeline: view()");
  if (supportsTimeline) return; // CSS handles it

  const targets = document.querySelectorAll(
    ".path, .about, .prices, .contact, .hero-q, .chips"
  );
  targets.forEach((t) => t.classList.add("reveal"));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
})();

// ---- 4. Phone reveal on click ----
(() => {
  const btn = document.getElementById("phoneRevealBtn");
  if (!btn) return;
  const parts = ["+49", "555", "123", "456", "7"]; // split to make copy-scraping harder
  btn.addEventListener("click", () => {
    const tel = parts.join(" ");
    const a = document.createElement("a");
    a.href = "tel:+495551234567";
    a.textContent = tel;
    a.className = "btn btn-ghost";
    btn.replaceWith(a);
  }, { once: true });
})();
