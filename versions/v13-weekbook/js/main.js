const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealItems = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-in'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -10% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const sectionLinks = document.querySelectorAll('[data-section-link]');
const sections = [...sectionLinks]
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (sectionLinks.length && sections.length && 'IntersectionObserver' in window) {
  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = `#${entry.target.id}`;
      sectionLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === id));
    });
  }, { threshold: 0.55 });

  sections.forEach((section) => activeObserver.observe(section));
}

const phoneRevealButton = document.getElementById('phoneRevealBtn');
const phoneSlot = document.getElementById('phoneSlot');

if (phoneRevealButton && phoneSlot) {
  phoneRevealButton.addEventListener('click', () => {
    phoneRevealButton.remove();
    const phoneLink = document.createElement('a');
    phoneLink.href = 'tel:+495551234567';
    phoneLink.className = 'contact-chip contact-chip-primary';
    phoneLink.textContent = '+49 (0)555 123 456 7';
    phoneSlot.textContent = '';
    phoneSlot.appendChild(phoneLink);
  });
}

const contactForm = document.querySelector('.contact-form');
const submitLabel = document.querySelector('[data-submit-label]');

if (contactForm && submitLabel) {
  contactForm.addEventListener('submit', () => {
    submitLabel.textContent = 'Wird gesendet …';
  });
}