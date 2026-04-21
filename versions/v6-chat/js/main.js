// v6-chat — Messenger-IA interactions
// Handles quick-reply chip clicks, pathway injection, typing indicator, phone reveal.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const injection = document.getElementById('injection');
const thread = document.getElementById('thread');
const chips = document.querySelectorAll('.chip');
const quickRepliesEl = document.querySelector('.quick-replies');

// Track state so pressing the same chip twice doesn't re-inject
let activePath = null;

function makeUserBubble(text) {
  const wrap = document.createElement('div');
  wrap.className = 'user-said-wrap';
  const bubble = document.createElement('div');
  bubble.className = 'user-said-bubble';
  bubble.textContent = text;
  wrap.appendChild(bubble);
  return wrap;
}

function makeTyping() {
  const t = document.createElement('div');
  t.className = 'typing';
  t.setAttribute('aria-hidden', 'true');
  t.innerHTML = `
    <span class="avatar avatar-xs">B</span>
    <div class="typing-dots"><span></span><span></span><span></span></div>
  `;
  return t;
}

function makeDivider() {
  const d = document.createElement('div');
  d.className = 'path-divider';
  d.textContent = 'und nochmal von vorn';
  return d;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function showPath(pathKey, chipLabel) {
  const tpl = document.getElementById(`tpl-${pathKey}`);
  if (!tpl) return;

  // If switching paths, divide visually
  if (activePath && activePath !== pathKey) {
    injection.appendChild(makeDivider());
  }
  // If clicking same chip, no-op
  if (activePath === pathKey) return;

  // Remove any previous path content (clean re-injection for other paths)
  // We keep history — just append. User may want to compare.
  // But for clarity on re-select of another path, we still append.

  // 1. Echo user's chip click as a user bubble
  const userBubble = makeUserBubble(chipLabel);
  injection.appendChild(userBubble);

  // 2. Typing indicator (once per path, skipped for reduced motion)
  let typingEl = null;
  if (!reducedMotion) {
    typingEl = makeTyping();
    injection.appendChild(typingEl);
    // Scroll to keep typing visible
    scrollIntoView(typingEl);
    await wait(600 + Math.random() * 200);
    typingEl.remove();
  }

  // 3. Inject the pathway bubbles
  const clone = tpl.content.cloneNode(true);
  // Strip the user-said text element (we already built a bubble)
  const hiddenUserSaid = clone.querySelector('.user-said');
  if (hiddenUserSaid) hiddenUserSaid.remove();

  const pathBubbles = clone.querySelector('.path-bubbles');
  if (pathBubbles) {
    // Append bubbles one-by-one with small stagger for organic feel
    const bubbles = Array.from(pathBubbles.querySelectorAll('.bubble'));
    // Insert the wrapper, then move children into injection for staggered add
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      injection.appendChild(b);
      scrollIntoView(b);
      if (!reducedMotion && i < bubbles.length - 1) {
        await wait(140);
      }
    }
  }

  activePath = pathKey;

  // Focus last bubble's CTA link for keyboard flow
  const lastLink = injection.querySelector('.bubble:last-of-type .inline-cta-link');
  if (lastLink) {
    // Don't steal focus aggressively; only mark tabbable
    lastLink.setAttribute('tabindex', '0');
  }
}

function scrollIntoView(el) {
  // Native smooth scroll — no hijack, no library.
  // Only scroll if the element is below the viewport.
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (rect.bottom > vh - 40) {
    el.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const path = chip.dataset.path;
    const label = chip.textContent.trim();
    // Visual pressed state on active chip
    chips.forEach((c) => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
    showPath(path, label);
  });
});

// PHONE REVEAL — simple spam-protection pattern
const phoneBtn = document.getElementById('phoneRevealBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    // Obfuscated reconstruction
    const parts = ['+49', ' (0)555', ' – 371', ' 370', ' 6'];
    const num = parts.join('');
    const tel = 'tel:+495551234567';
    const a = document.createElement('a');
    a.href = tel;
    a.className = 'phone-number';
    a.textContent = num;
    phoneBtn.replaceWith(a);
  });
}

// Hide sticky CTA when kontakt section is in view (avoid overlap)
const stickyCta = document.querySelector('.sticky-cta');
const kontakt = document.getElementById('kontakt');
if (stickyCta && kontakt && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      stickyCta.style.opacity = e.isIntersecting ? '0' : '1';
      stickyCta.style.pointerEvents = e.isIntersecting ? 'none' : 'auto';
    });
  }, { rootMargin: '-20% 0px -20% 0px' });
  io.observe(kontakt);
}
