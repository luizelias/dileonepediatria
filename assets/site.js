const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  navigation?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
  navigation.classList.toggle('is-open', expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header-inner')) closeMenu();
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
matchMedia('(min-width: 1001px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const carousel = document.querySelector('.testimonial-carousel');
if (carousel) {
  const track = carousel.querySelector('.testimonial-track');
  const slides = [...track.children];
  const position = carousel.querySelector('.carousel-position');
  let index = 0;
  function showSlide(next) {
    index = (next + slides.length) % slides.length;
    track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft - (track.clientWidth - slides[index].clientWidth) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    position.textContent = `${index + 1} / ${slides.length}`;
  }
  carousel.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => showSlide(index + (button.dataset.slide === 'next' ? 1 : -1))));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let scrollFrame;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const center = track.scrollLeft + track.clientWidth / 2;
      index = slides.reduce((best, slide, i) => Math.abs(slide.offsetLeft - track.offsetLeft + slide.clientWidth / 2 - center) < Math.abs(slides[best].offsetLeft - track.offsetLeft + slides[best].clientWidth / 2 - center) ? i : best, 0);
      position.textContent = `${index + 1} / ${slides.length}`;
    });
  }, { passive: true });
}

const topLink = document.querySelector('.back-to-top');
function updateTopLink() {
  topLink?.classList.toggle('is-visible', scrollY > 600);
  document.querySelector('.site-header')?.classList.toggle('is-scrolled', scrollY > 40);
}
addEventListener('scroll', updateTopLink, { passive: true });
updateTopLink();

document.querySelector('.share-article')?.addEventListener('click', async () => {
  const status = document.querySelector('.share-status');
  try {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else {
      await navigator.clipboard.writeText(location.href);
      status.textContent = 'Link copiado!';
    }
  } catch (error) {
    if (error.name !== 'AbortError') status.textContent = 'Copie o endereço na barra do navegador para compartilhar.';
  }
});
