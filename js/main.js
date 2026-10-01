  // ── CUSTOM CURSOR ──
  const cur = document.getElementById('cursor');
  let cx = 0, cy = 0;
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    cur.style.left = cx + 'px';
    cur.style.top  = cy + 'px';
  });

  // ── PROGRESS BAR ──
  const pbar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => { pbar.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + '%'; });

  // ── NAV SHADOW ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 20); });



  // ── SCROLL REVEAL ──
  const reveals = document.querySelectorAll('.reveal');
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  reveals.forEach(el => revObs.observe(el));

  // ── CERT PROGRESS BARS ──
  const certObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.cert-bar').forEach(b => { b.style.width = b.dataset.width + '%'; });
        certObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.certs-list').forEach(el => certObs.observe(el));



  // ── CANVAS PARTICLES ──
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [], W, H;
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', () => { resize(); init(); });
  function init() {
    particles = [];
    const cols = Math.floor(W/60), rows = Math.floor(H/60);
    for (let i = 0; i <= cols; i++) for (let j = 0; j <= rows; j++) {
      particles.push({ x:(i/cols)*W, y:(j/rows)*H, ox:(i/cols)*W, oy:(j/rows)*H, vx:0, vy:0, size:Math.random()*1.5+0.5, op:Math.random()*0.4+0.1 });
    }
  }
  init();
  let mx = -1000, my = -1000;
  canvas.parentElement.addEventListener('mousemove', e => { const r = canvas.getBoundingClientRect(); mx = e.clientX-r.left; my = e.clientY-r.top; });
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      const dx=mx-p.x, dy=my-p.y, dist=Math.sqrt(dx*dx+dy*dy), force=Math.max(0,80-dist)/80;
      p.vx += (dist>0?-dx/dist:0)*force*0.4; p.vy += (dist>0?-dy/dist:0)*force*0.4;
      p.vx += (p.ox-p.x)*0.04; p.vy += (p.oy-p.y)*0.04;
      p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx; p.y += p.vy;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle = `rgba(0,212,170,${p.op})`; ctx.fill();
    });
    for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
      const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<65){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=`rgba(0,212,170,${0.06*(1-d/65)})`; ctx.lineWidth=0.5; ctx.stroke(); }
    }
    requestAnimationFrame(draw);
  }
  draw();

  // ── CAROUSEL (infinite loop) ──
  (function() {
    const track    = document.getElementById('carousel-track');
    const dotsWrap = document.getElementById('carousel-dots');
    const btnPrev  = document.getElementById('carousel-prev');
    const btnNext  = document.getElementById('carousel-next');
    if (!track) return;

    const origCards = Array.from(track.querySelectorAll('.blog-card'));
    const total     = origCards.length;

    // Clone first and last groups for infinite loop
    origCards.forEach(c => track.appendChild(c.cloneNode(true)));
    origCards.forEach(c => track.insertBefore(c.cloneNode(true), track.firstChild));

    const allCards = () => track.querySelectorAll('.blog-card');
    const visible  = () => window.innerWidth <= 680 ? 1 : 3;
    let current    = total; // start at real first (after clones)
    let isTransitioning = false;
    let autoTimer;

    // Build 3 dots — one per step, cycling
    const numDots = 3;
    for (let i = 0; i < numDots; i++) {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(d);
    }

    function updateDots() {
      const realIdx = ((current - total) % total + total) % total;
      const dotIdx  = realIdx % numDots;
      dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === dotIdx);
      });
    }

    function getCardWidth() {
      const cards = allCards();
      return cards[0] ? cards[0].offsetWidth + 16 : 0;
    }

    function setPosition(animated) {
      track.style.transition = animated ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none';
      track.style.transform  = `translateX(-${current * getCardWidth()}px)`;
    }

    function goTo(idx, resetTimer) {
      if (isTransitioning) return;
      isTransitioning = true;
      current = idx;
      setPosition(true);
      updateDots();
      if (resetTimer) startAuto();
    }

    track.addEventListener('transitionend', () => {
      isTransitioning = false;
      // Jump silently if we've gone into clone territory
      if (current >= total * 2) { current = total;      setPosition(false); }
      if (current < total)      { current = total * 2 - visible(); setPosition(false); }
    });

    btnNext.addEventListener('click', () => { goTo(current + 1, true); });
    btnPrev.addEventListener('click', () => { goTo(current - 1, true); });

    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(current + 1, false), 10000);
    }

    // Init
    setPosition(false);
    updateDots();
    startAuto();

    window.addEventListener('resize', () => setPosition(false));

    // ── DRAG / SWIPE ──
    let dragStartX = 0, dragDeltaX = 0, dragging = false;

    track.addEventListener('mousedown', e => {
      dragging   = true;
      dragStartX = e.clientX;
      dragDeltaX = 0;
      track.style.transition = 'none';
      clearInterval(autoTimer);
    });

    track.addEventListener('mousemove', e => {
      if (!dragging) return;
      dragDeltaX = e.clientX - dragStartX;
      track.style.transform = `translateX(${-current * getCardWidth() + dragDeltaX}px)`;
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      const threshold = getCardWidth() * 0.25;
      if (dragDeltaX < -threshold)      goTo(current + 1, true);
      else if (dragDeltaX > threshold)  goTo(current - 1, true);
      else { setPosition(true); startAuto(); }
    }

    track.addEventListener('mouseup',    endDrag);
    track.addEventListener('mouseleave', endDrag);

    // Touch support
    track.addEventListener('touchstart', e => {
      dragStartX = e.touches[0].clientX;
      dragDeltaX = 0;
      dragging   = true;
      track.style.transition = 'none';
      clearInterval(autoTimer);
    }, { passive: true });

    track.addEventListener('touchmove', e => {
      if (!dragging) return;
      dragDeltaX = e.touches[0].clientX - dragStartX;
      track.style.transform = `translateX(${-current * getCardWidth() + dragDeltaX}px)`;
    }, { passive: true });

    track.addEventListener('touchend', endDrag);

    // Prevent accidental link clicks after drag
    track.addEventListener('click', e => {
      if (Math.abs(dragDeltaX) > 5) e.preventDefault();
    }, true);

  })();
