// v7-offer — minimal JS. Nav border, phone reveal, subtle reveals.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Sticky nav border-on-scroll (with hysteresis to avoid jitter) ---
(() => {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let lastState = false;
  const THRESHOLD_IN = 8;
  const THRESHOLD_OUT = 2;
  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (!lastState && y > THRESHOLD_IN) {
      nav.classList.add("is-scrolled");
      lastState = true;
    } else if (lastState && y < THRESHOLD_OUT) {
      nav.classList.remove("is-scrolled");
      lastState = false;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// --- Phone number reveal (spam protection) ---
(() => {
  const btn = document.getElementById("phoneBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    // reconstruct number
    const parts = ["+49", "555", "123", "456", "7"];
    const tel = "+49" + "5551234567";
    const display = parts.join(" ");
    const link = document.createElement("a");
    link.href = `tel:${tel}`;
    link.textContent = display;
    link.className = "phone-link";
    link.style.fontWeight = "600";
    link.style.fontSize = "18px";
    link.style.letterSpacing = "-0.01em";
    link.style.color = "var(--text)";
    btn.replaceWith(link);
  });
})();

// --- Reveal on scroll (IntersectionObserver) ---
(() => {
  if (prefersReducedMotion) return;
  const targets = document.querySelectorAll(
    ".section .h2, .hero .display, .card, .price-card, .step, .segment, .contact-card"
  );
  targets.forEach((el) => el.setAttribute("data-reveal", ""));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((t) => io.observe(t));
})();

// --- Year in footer ---
(() => {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
