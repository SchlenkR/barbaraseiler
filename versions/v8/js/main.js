// v8 — Zweifel & Antworten
// Minimal JS: fade-in on scroll + phone reveal.
// Respects prefers-reduced-motion; no animations then.

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fade-in reveal per section block
(() => {
  const targets = document.querySelectorAll(".doubt, .cta, .about");
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );
  targets.forEach((el) => io.observe(el));
})();

// Phone reveal — obfuscated against naive scrapers
(() => {
  const btn = document.getElementById("phoneBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const parts = ["+49", "179", "371", "370", "6"];
    const tel = "+49" + "1793713706";
    const pretty = parts.join(" ");
    const a = document.createElement("a");
    a.href = "tel:" + tel;
    a.textContent = pretty;
    btn.replaceWith(a);
  });
})();
