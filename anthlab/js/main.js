// ── NAV SHADOW ──
const navbar = document.getElementById('navbar');

if (navbar) {
  const updateNavbar = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };

  updateNavbar();
  window.addEventListener('scroll', updateNavbar, { passive: true });
}

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  reveals.forEach((element) => revealObserver.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('visible'));
}

// ── ARTICLES CAROUSEL ──
(() => {
  const track = document.getElementById('carousel-track');
  const dotsWrap = document.getElementById('carousel-dots');
  const previousButton = document.getElementById('carousel-prev');
  const nextButton = document.getElementById('carousel-next');

  if (!track || !dotsWrap || !previousButton || !nextButton) return;

  const originalCards = Array.from(track.querySelectorAll('.blog-card'));
  const total = originalCards.length;

  if (!total) return;

  const beforeClones = originalCards.map((card) => card.cloneNode(true));
  const afterClones = originalCards.map((card) => card.cloneNode(true));

  beforeClones.reverse().forEach((card) => {
    track.insertBefore(card, track.firstChild);
  });

  afterClones.forEach((card) => {
    track.appendChild(card);
  });

  const cards = () => track.querySelectorAll('.blog-card');
  const visibleCards = () => (window.innerWidth <= 680 ? 1 : 3);

  let current = total;
  let isTransitioning = false;
  let autoTimer;
  let dragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;

  const dotCount = Math.min(3, total);

  for (let index = 0; index < dotCount; index += 1) {
    const dot = document.createElement('button');
    dot.className = `carousel-dot${index === 0 ? ' active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('aria-label', `Grupo de artículos ${index + 1}`);
    dotsWrap.appendChild(dot);
  }

  const getCardWidth = () => {
    const firstCard = cards()[0];
    return firstCard ? firstCard.offsetWidth + 16 : 0;
  };

  const updateDots = () => {
    const realIndex = ((current - total) % total + total) % total;
    const activeDot = realIndex % dotCount;

    dotsWrap.querySelectorAll('.carousel-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === activeDot);
    });
  };

  const setPosition = (animated) => {
    track.style.transition = animated
      ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)'
      : 'none';

    track.style.transform = `translateX(-${current * getCardWidth()}px)`;
  };

  const startAuto = () => {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      goTo(current + 1, false);
    }, 10000);
  };

  const goTo = (index, resetTimer = false) => {
    if (isTransitioning) return;

    isTransitioning = true;
    current = index;
    setPosition(true);
    updateDots();

    if (resetTimer) startAuto();
  };

  track.addEventListener('transitionend', () => {
    isTransitioning = false;

    if (current >= total * 2) {
      current = total;
      setPosition(false);
    } else if (current < total) {
      current = total * 2 - visibleCards();
      setPosition(false);
    }

    updateDots();
  });

  nextButton.addEventListener('click', () => {
    goTo(current + 1, true);
  });

  previousButton.addEventListener('click', () => {
    goTo(current - 1, true);
  });

  const endDrag = () => {
    if (!dragging) return;

    dragging = false;
    const threshold = getCardWidth() * 0.25;

    if (dragDeltaX < -threshold) {
      goTo(current + 1, true);
    } else if (dragDeltaX > threshold) {
      goTo(current - 1, true);
    } else {
      setPosition(true);
      startAuto();
    }
  };

  track.addEventListener('mousedown', (event) => {
    dragging = true;
    dragStartX = event.clientX;
    dragDeltaX = 0;
    track.style.transition = 'none';
    clearInterval(autoTimer);
  });

  track.addEventListener('mousemove', (event) => {
    if (!dragging) return;

    dragDeltaX = event.clientX - dragStartX;
    track.style.transform = `translateX(${-current * getCardWidth() + dragDeltaX}px)`;
  });

  track.addEventListener('mouseup', endDrag);
  track.addEventListener('mouseleave', endDrag);

  track.addEventListener('touchstart', (event) => {
    dragging = true;
    dragStartX = event.touches[0].clientX;
    dragDeltaX = 0;
    track.style.transition = 'none';
    clearInterval(autoTimer);
  }, { passive: true });

  track.addEventListener('touchmove', (event) => {
    if (!dragging) return;

    dragDeltaX = event.touches[0].clientX - dragStartX;
    track.style.transform = `translateX(${-current * getCardWidth() + dragDeltaX}px)`;
  }, { passive: true });

  track.addEventListener('touchend', endDrag);

  track.addEventListener('click', (event) => {
    if (Math.abs(dragDeltaX) > 5) event.preventDefault();
  }, true);

  window.addEventListener('resize', () => {
    setPosition(false);
  });

  setPosition(false);
  updateDots();
  startAuto();
})();
