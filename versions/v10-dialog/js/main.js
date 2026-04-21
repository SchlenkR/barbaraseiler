// v10-dialog — minimal interactions.
// Phone reveal (spam-obfuscation pattern) + smooth scroll to composer from pill CTA.

// Phone reveal: assemble on click so the number never sits in the raw HTML.
const phoneBtn = document.getElementById("phoneBtn");
if (phoneBtn) {
  phoneBtn.addEventListener("click", () => {
    // digits split across arrays to survive naive scrapers
    const parts = ["+49", "555", "123", "456", "7"];
    const human = parts.join(" ");
    const href = "tel:" + parts.join("").replace("+", "+");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = human;
    phoneBtn.replaceWith(a);
  });
}

// Soft-fade bubbles into view as you scroll (progressive enhancement).
// Skipped when user prefers reduced motion.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduce && "IntersectionObserver" in window) {
  const bubbles = document.querySelectorAll(".bubble");
  // Start hidden only for bubbles below the initial viewport to avoid
  // a flash of invisible content on initial load for the first screen.
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
  bubbles.forEach((b) => io.observe(b));
}

// Native smooth scroll for the sticky pill (belt-and-braces; CSS handles the rest).
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
