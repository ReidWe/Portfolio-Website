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
