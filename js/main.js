/* ══════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════
   Fades in sections as they enter the viewport.
*/

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});


/* ══════════════════════════════════════
   SMOOTH SCROLL
   ══════════════════════════════════════
   Handles anchor links for smooth navigation.
*/

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* ══════════════════════════════════════
   PHONE NUMBER DISPLAY
   ══════════════════════════════════════
   Shows phone number and copies to clipboard on click.
*/

function copyPhone(e) {
  e.preventDefault();
  var btn = document.getElementById('phoneBtn');
  if (btn.dataset.showing === 'true') {
    btn.textContent = '📞 Phone';
    btn.dataset.showing = 'false';
  } else {
    btn.textContent = '📞 315-956-2749';
    btn.dataset.showing = 'true';
  }
}