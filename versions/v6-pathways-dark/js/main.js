// v6-pathways-dark — Apple-chooser interaction (dark-mode flip of v6-pathways)
// Click a card → other cards fade out, chosen card expands in place.
// Uses View Transitions API when available, otherwise CSS transitions.

const chooser = document.getElementById('chooser');
const backBtn = document.getElementById('chooserBack');

function open(card) {
  if (!card) return;
  const run = () => {
    chooser.querySelectorAll('.card').forEach(c => {
      c.removeAttribute('data-active');
      c.setAttribute('aria-expanded', 'false');
    });
    card.setAttribute('data-active', '');
    card.setAttribute('aria-expanded', 'true');
    chooser.setAttribute('data-state', 'open');
    backBtn.hidden = false;
  };
  if (document.startViewTransition) {
    document.startViewTransition(run);
  } else {
    run();
  }
}

function close() {
  const run = () => {
    chooser.querySelectorAll('.card').forEach(c => {
      c.removeAttribute('data-active');
      c.setAttribute('aria-expanded', 'false');
    });
    chooser.setAttribute('data-state', 'idle');
    backBtn.hidden = true;
  };
  if (document.startViewTransition) {
    document.startViewTransition(run);
  } else {
    run();
  }
}

chooser.addEventListener('click', (e) => {
  // Ignore clicks on CTA link inside expanded card — let anchor scroll happen
  if (e.target.closest('.cta-inline')) return;
  const card = e.target.closest('.card');
  if (!card) return;
  if (card.hasAttribute('data-active')) return;
  open(card);
});

chooser.addEventListener('keydown', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!card.hasAttribute('data-active')) open(card);
  }
  if (e.key === 'Escape' && chooser.getAttribute('data-state') === 'open') {
    close();
  }
});

backBtn.addEventListener('click', close);

// Phone reveal (spam-protection pattern)
const phoneBtn = document.getElementById('phoneBtn');
if (phoneBtn) {
  phoneBtn.addEventListener('click', () => {
    const number = '+49 555 123 456 7';
    phoneBtn.outerHTML = `<a href="tel:+495551234567" class="btn-link">${number}</a>`;
  });
}
