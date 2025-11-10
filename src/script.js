// Mobile menu toggle
// Mobile menu toggle
const btnMenu = document.getElementById('btnMenu');
const mobileNav = document.getElementById('mobileNav');

if(btnMenu && mobileNav){
  let mobileOpen = false;
  btnMenu.addEventListener('click', () => {
    mobileOpen = !mobileOpen;
    mobileNav.setAttribute('aria-hidden', String(!mobileOpen));
    mobileNav.style.display = mobileOpen ? 'flex' : 'none';
  });
}

btnMenu.addEventListener('click', () => {
  mobileOpen = !mobileOpen;
  mobileNav.setAttribute('aria-hidden', String(!mobileOpen));
  mobileNav.style.display = mobileOpen ? 'flex' : 'none';
});

// Smooth reveal with IntersectionObserver
const revealEls = document.querySelectorAll('.reveal, .reveal-section, .card, .why-item, .slide, .prop-card');
const obsOptions = { root: null, rootMargin: '0px', threshold: 0.12 };
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      entry.target.classList.add('show');
      obs.unobserve(entry.target);
    }
  });
}, obsOptions);
revealEls.forEach(el => revealObserver.observe(el));

// Parallax subtle hero background movement
const hero = document.querySelector('.hero');
const heroBg = document.querySelector('.hero-bg');
window.addEventListener('scroll', () => {
  if(!hero || !heroBg) return;
  const rect = hero.getBoundingClientRect();
  if(rect.bottom > 0) {
    const pct = Math.min(Math.max((rect.top * -1) / (window.innerHeight * 0.8), 0), 1);
    heroBg.style.transform = `translateY(${ -20 * pct }px) scale(${1 - pct * 0.02})`;
  }
});

// Carousel simple controls
(function carouselInit(){
  const track = document.querySelector('.carousel-track');
  const prev = document.querySelector('.carousel-btn.prev');
  const next = document.querySelector('.carousel-btn.next');
  if(!track) return;
  const step = 340; // px slide
  if(prev) prev.addEventListener('click', () => { track.scrollBy({ left: -step, behavior:'smooth' }); });
  if(next) next.addEventListener('click', () => { track.scrollBy({ left: step, behavior:'smooth' }); });
})();

// Contact form demo handler
const contactForm = document.getElementById('contactForm');
if(contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.name.value.trim();
    if(!name) { alert('Merci de saisir votre nom'); return; }
    alert(`Merci ${name} — message envoyé (simulation).`);
    contactForm.reset();
  });
}

// Highlight nav on click + close mobile menu
document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
  link.addEventListener('click', (e) => {
    // close mobile nav if open
    if(mobileOpen) { mobileNav.style.display='none'; mobileOpen=false; }
    // small click animation
    link.animate([{ transform: 'translateY(0)'},{ transform: 'translateY(-6px)' }, { transform: 'translateY(0)'}], { duration: 240 });
  });
});
