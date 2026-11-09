/* ═══════════════════════════════════════════════
   PROJECT DETAIL — project-detail.js
   Reads ?id=N from URL, finds project in PROJECTS,
   builds and animates the full detail page.
═══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* Scroll progress, nav state, burger, clock — handled by common.js */

const R       = window.ProjectRender;
const params  = new URLSearchParams(window.location.search);
const id      = parseInt(document.body.dataset.projectId || params.get('id'), 10);
const project = PROJECTS.find(p => p.id === id);

if (!project) {
  const robots = document.querySelector('meta[name="robots"]');
  if (robots) robots.setAttribute('content', 'noindex, follow');
  document.title = 'Project not found — Oleksandr Vyshnevskyi';
  document.getElementById('pd404').style.display = 'flex';
  document.getElementById('pdMain').style.display = 'none';
} else {
  try {
    renderPage(project);
  } catch (err) {
    console.error('[project-detail] renderPage failed:', err);
    document.getElementById('pd404').style.display = 'flex';
    document.getElementById('pdMain').style.display = 'none';
  }
}

function renderPage(p) {
  document.title = `${p.title} — Oleksandr Vyshnevskyi`;

  if (p.image) document.getElementById('pdHeroBg').style.backgroundImage = `url(${R.asset(p.image)})`;
  document.getElementById('pdHeroMeta').innerHTML = R.heroMeta(p);
  document.getElementById('pdHeroTitle').textContent = p.title;
  const brief = document.getElementById('pdHeroBrief');
  if (p.brief) brief.textContent = p.brief; else brief.style.display = 'none';
  document.getElementById('pdHeroActions').innerHTML = R.heroActions(p);
  document.getElementById('pdLeft').innerHTML = R.left(p);
  document.getElementById('pdSidebar').innerHTML = R.sidebar(p);

  if (R.media(p).length) {
    document.getElementById('pdGallerySection').style.display = 'block';
    document.getElementById('pdGalleryCountLabel').textContent = R.galleryCount(p);
    const grid = document.getElementById('pdGalleryGrid');
    grid.innerHTML = R.gallery(p);
    grid.querySelectorAll('.pd-gal-item').forEach(item => {
      const i = Number(item.dataset.index);
      item.addEventListener('click', () => openLightbox(i));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
      });
    });
  }

  const navEl = document.getElementById('pdNavProjects');
  const navHtml = R.nav(PROJECTS, p);
  if (navHtml) {
    navEl.innerHTML = navHtml;
    navEl.querySelectorAll('.pd-nav-card').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        window.ptNavigate(card.getAttribute('href'));
      });
    });
  } else {
    navEl.style.display = 'none';
  }

  /* ── Show main & animate ── */
  const main = document.getElementById('pdMain');
  main.style.opacity = '1';

  /* ── prefers-reduced-motion check ── */
  const prefersReduced = window.SITE ? window.SITE.REDUCE_MOTION : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── set initial gsap states BEFORE the timeout so elements are hidden from frame 0 ── */
  if (!prefersReduced) {
    gsap.set('.pd-breadcrumb', { opacity: 0, y: 10 });
    gsap.set('.pd-hero-meta',  { opacity: 0, y: 10 });
    gsap.set('.pd-hero-title', { opacity: 0, y: 20 });
    gsap.set('.pd-hero-brief', { opacity: 0, y: 16 });
    gsap.set('.pd-hero-actions', { opacity: 0, y: 14 });
    gsap.set('#pdLeft',        { opacity: 0, y: 30 });
    gsap.set('#pdSidebar',     { opacity: 0, y: 20 });
    gsap.set('#pdNavProjects', { opacity: 0 });
    gsap.set('.pd-del-item',   { opacity: 0, x: -10 });
    gsap.set('.pd-review',     { opacity: 0 });
  }

  // Staggered entrance after page-enter overlay finishes (~650ms)
  setTimeout(() => {
    if (prefersReduced) return; // skip all animations if user prefers reduced motion

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.pd-breadcrumb', { opacity: 1, y: 0, duration: .6 }, 0)
      .to('.pd-hero-meta',  { opacity: 1, y: 0, duration: .6 }, .1)
      .to('.pd-hero-title', { opacity: 1, y: 0, duration: .8 }, .2)
      .to('.pd-hero-brief', { opacity: 1, y: 0, duration: .7 }, .4)
      .to('.pd-hero-actions', { opacity: 1, y: 0, duration: .7 }, .55);

    // Strip
    if (document.getElementById('pdStrip')) gsap.to('#pdStrip', { opacity: 1, duration: .7, delay: .5 });

    // Left + sidebar on scroll
    ScrollTrigger.create({
      trigger: '#pdLeft',
      start: 'top 80%',
      onEnter: () => {
        gsap.to('#pdLeft',    { opacity: 1, y: 0, duration: .8, ease: 'power3.out' });
        gsap.to('#pdSidebar', { opacity: 1, y: 0, duration: .8, delay: .15, ease: 'power3.out' });

        // deliverables stagger
        if (document.querySelector('.pd-del-item')) gsap.to('.pd-del-item', {
          opacity: 1, x: 0,
          duration: .55,
          stagger: .07,
          delay: .2,
          ease: 'power3.out'
        });

        // review
        if (document.querySelector('.pd-review')) gsap.to('.pd-review', { opacity: 1, duration: .7, delay: .5, ease: 'power3.out' });
      }
    });

    // Nav projects
    ScrollTrigger.create({
      trigger: '#pdNavProjects',
      start: 'top 85%',
      onEnter: () => gsap.to('#pdNavProjects', { opacity: 1, duration: .7, ease: 'power3.out' })
    });

  }, 650);

} // end renderPage

/* ═══════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════ */
let lbMedia  = [];
let lbIdx    = 0;

function buildLbMedia() {
  lbMedia = project ? R.media(project) : [];
}

function openLightbox(idx) {
  buildLbMedia();
  lbIdx = idx;
  renderLb();
  document.getElementById('pdLightbox').classList.add('open');
  window.lockScroll && window.lockScroll(); /* shared scroll lock (transition.js) */
  lbReturnFocus = document.activeElement;
  document.getElementById('pdLbClose').focus();
}

let lbReturnFocus = null;
function closeLightbox() {
  const lb = document.getElementById('pdLightbox');
  if (!lb.classList.contains('open')) return;
  lb.classList.remove('open');
  window.unlockScroll && window.unlockScroll();
  if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
}

function renderLb() {
  const m = lbMedia[lbIdx];
  if (!m) return;
  document.getElementById('pdLbMedia').innerHTML = m.type === 'video'
    ? `<video src="${m.src}" controls autoplay></video>`
    : `<img src="${m.src}" alt="${project.title} — image ${lbIdx + 1}" loading="eager">`;
  document.getElementById('pdLbCounter').textContent = `${lbIdx + 1} / ${lbMedia.length}`;
}

document.getElementById('pdLbClose').addEventListener('click', closeLightbox);

document.getElementById('pdLbPrev').addEventListener('click', () => {
  lbIdx = (lbIdx - 1 + lbMedia.length) % lbMedia.length;
  renderLb();
});

document.getElementById('pdLbNext').addEventListener('click', () => {
  lbIdx = (lbIdx + 1) % lbMedia.length;
  renderLb();
});

document.getElementById('pdLightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('pdLightbox')) closeLightbox();
});

document.addEventListener('keydown', e => {
  const lb = document.getElementById('pdLightbox');
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  { lbIdx = (lbIdx - 1 + lbMedia.length) % lbMedia.length; renderLb(); }
  if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbMedia.length; renderLb(); }
});
