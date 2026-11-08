/* ═══════════════════════════════════════════════
   PROJECT DETAIL — project-detail.js
   Reads ?id=N from URL, finds project in PROJECTS,
   builds and animates the full detail page.
═══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* Scroll progress, nav state, burger, clock — handled by common.js */

/* ─── Read id from URL ─── */
const params  = new URLSearchParams(window.location.search);
const id      = parseInt(params.get('id'), 10);
const project = PROJECTS.find(p => p.id === id);

/* ─── 404 ─── */
if (!project) {
  /* Unknown id: tell search engines not to index this "not found" view */
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

/* ═══════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════ */
function renderPage(p) {

  /* ── page title ── */
  document.title = `${p.title} — Oleksandr Vyshnevskyi`;

  /* ── per-project SEO: canonical, description, OG ── */
  const pageUrl = `https://vyshnevsky.com/project-detail?id=${p.id}`;
  const setAttr = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
  setAttr('link[rel="canonical"]', 'href', pageUrl);
  setAttr('meta[property="og:url"]', 'content', pageUrl);
  setAttr('meta[property="og:title"]', 'content', document.title);
  setAttr('meta[name="twitter:title"]', 'content', document.title);
  if (p.brief) {
    setAttr('meta[name="description"]', 'content', p.brief);
    setAttr('meta[property="og:description"]', 'content', p.brief);
    setAttr('meta[name="twitter:description"]', 'content', p.brief);
  }

  /* ── HERO ── */
  if (p.image) {
    document.getElementById('pdHeroBg').style.backgroundImage = `url(${p.image})`;
  }

  // type badge + context string
  const ctxParts = [p.country, p.year].filter(Boolean);
  document.getElementById('pdHeroMeta').innerHTML = `
    ${p.type ? `<span class="pd-badge-type">${p.type}</span>` : ''}
    ${ctxParts.length ? `<span class="pd-badge-context">${ctxParts.join(' · ')}</span>` : ''}
  `;

  document.getElementById('pdHeroTitle').textContent = p.title;

  if (p.brief) {
    document.getElementById('pdHeroBrief').textContent = p.brief;
  } else {
    document.getElementById('pdHeroBrief').style.display = 'none';
  }

  /* ── Hero actions ── */
  const heroActions = document.getElementById('pdHeroActions');
  let actionsHtml = '';
  if (p.liveUrl && p.liveUrl !== '#') {
    actionsHtml += `
      <a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="pd-hero-btn btn btn--primary">View Demo <span class="btn__icon btn__icon--up-right"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></span></a>`;
  }
  actionsHtml += `
    <a href="/?section=contact" class="pd-hero-btn btn btn--secondary">Start a Similar Project <span class="btn__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>`;
  heroActions.innerHTML = actionsHtml;

  /* ── INFO STRIP — removed, content moved to sidebar ── */

  /* ── LEFT COLUMN ── */
  const left = document.getElementById('pdLeft');
  let leftHtml = '';

  // Brief is already shown in hero — skip it here to avoid duplication.
  // Show only deliverables + review in the body.

  if (p.deliverables?.length) {
    leftHtml += `<div class="pd-section-label">What I Did</div>`;
    leftHtml += `<ul class="pd-deliverables">`;
    p.deliverables.forEach((d, i) => {
      leftHtml += `
        <li class="pd-del-item">
          <span class="pd-del-text">${d}</span>
          <span class="pd-del-num">${String(i + 1).padStart(2, '0')}</span>
        </li>
      `;
    });
    leftHtml += `</ul>`;
  }

  if (p.review) {
    const r = p.review;

    // Stars HTML
    const starsHtml = r.stars
      ? `<div class="pd-review-stars" aria-label="${r.stars} out of 5 stars">
           ${'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'.repeat(r.stars)}
         </div>`
      : '';

    // Platform badge
    const platformHtml = r.platform
      ? `<span class="pd-review-platform pd-review-platform--${r.platform.toLowerCase()}">${r.platform}</span>`
      : '';

    // Location
    const locationHtml = r.country
      ? `<span class="pd-review-location">${r.country}</span>`
      : '';

    // Avatar initials
    const initials = r.initials || (r.author ? r.author.slice(0, 2).toUpperCase() : '?');

    leftHtml += `
      <div class="pd-review">
        ${starsHtml}
        <blockquote class="pd-review-quote">"${r.text}"</blockquote>
        <div class="pd-review-footer">
          <div class="pd-review-avatar">${initials}</div>
          <div class="pd-review-meta">
            <div class="pd-review-author">${r.author}</div>
            <div class="pd-review-tags">
              ${locationHtml}
              ${platformHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  left.innerHTML = leftHtml;

  /* ── SIDEBAR ── */
  const sidebar = document.getElementById('pdSidebar');
  let sidebarHtml = '';

  // Live site banner
  if (p.liveUrl && p.liveUrl !== '#') {
    sidebarHtml += `
      <a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="pd-live-banner">
        <span class="pd-live-banner-label">View Demo</span>
        <span class="pd-live-banner-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
        </span>
      </a>`;
  }

  // CTA box
  sidebarHtml += `<div class="pd-sidebar-box">
    <div class="pd-sb-head">Get in touch</div>
    <div class="pd-sb-body">
      <div class="pd-sb-cta">
        <a href="/?section=contact" class="pd-sb-btn btn btn--primary btn--s">Start a Similar Project <span class="btn__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a>
        <a href="/projects" class="pd-sb-btn btn btn--secondary btn--s btn--icon-left"><span class="btn__icon btn__icon--left"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></span> All Projects</a>
      </div>
    </div>
  </div>`;

  // Project Info box — all fields, each in its own clearly labelled row
  const infoFields = [
    p.type     && { label: 'Project Type', val: p.type,     accent: true },
    p.year     && { label: 'Year',         val: p.year },
    p.country  && { label: 'Country',      val: p.country },
    p.client   && { label: 'Client',       val: p.client },
    p.platform && { label: 'Platform',     val: p.platform },
  ].filter(Boolean);

  if (infoFields.length) {
    sidebarHtml += `<div class="pd-sidebar-box">
      <div class="pd-sb-head">Project Info</div>
      <div class="pd-sb-body">`;
    infoFields.forEach(f => {
      sidebarHtml += `
        <div class="pd-sb-field">
          <div class="pd-sb-field-label">${f.label}</div>
          <div class="pd-sb-field-val${f.accent ? ' accent' : ''}">${f.val}</div>
        </div>`;
    });

    // Stack as its own block at the bottom of info box
    if (p.stack?.length) {
      sidebarHtml += `
        <div class="pd-sb-field">
          <div class="pd-sb-field-label">Tech Stack</div>
          <div class="pd-sb-field-chips">
            ${p.stack.map(t => `<span class="pd-sb-chip">${t}</span>`).join('')}
          </div>
        </div>`;
    }

    sidebarHtml += `</div></div>`;
  }

  sidebar.innerHTML = sidebarHtml;

  /* ── GALLERY ── */
  const allMedia = [];
  if (p.image) allMedia.push({ type: 'image', src: p.image });
  (p.gallery || []).forEach(m => allMedia.push(m));

  if (allMedia.length > 0) {
    const gallerySection = document.getElementById('pdGallerySection');
    gallerySection.style.display = 'block';
    const grid = document.getElementById('pdGalleryGrid');
    const countLbl = document.getElementById('pdGalleryCountLabel');
    if (countLbl) countLbl.textContent = `${allMedia.length} ${allMedia.length === 1 ? 'image' : 'images'}`;

    allMedia.forEach((m, i) => {
      const item = document.createElement('div');
      item.className = 'pd-gal-item' + (m.type === 'video' ? ' is-video' : '');

      const media = m.type === 'video'
        ? `<video src="${m.src}" muted loop preload="metadata" playsinline></video>`
        : `<img src="${m.src}" alt="${p.title} — ${i + 1}" loading="lazy">`;

      // overlay div (works reliably vs ::after with display:flex)
      const numStr = String(i + 1).padStart(2, '0');
      item.innerHTML = `
        ${media}
        <div class="pd-gal-overlay"></div>
        <span class="pd-gal-num">${numStr}</span>
      `;

      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Open image ${i + 1} of ${allMedia.length}`);
      item.addEventListener('click', () => openLightbox(i));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
      });
      grid.appendChild(item);
    });
  }

  /* ── NEXT / PREV ── */
  const idx  = PROJECTS.indexOf(p);
  const prev = PROJECTS[idx - 1];
  const next = PROJECTS[idx + 1];
  const navEl = document.getElementById('pdNavProjects');

  if (prev || next) {
    let navHtml = '';

    if (prev) {
      navHtml += `
        <a class="pd-nav-card" href="/project-detail?id=${prev.id}">
          <div class="pd-nav-card-bg" style="${prev.image ? `background-image:url(${prev.image})` : ''}"></div>
          <div class="pd-nav-card-overlay"></div>
          <div class="pd-nav-card-body">
            <div class="pd-nav-dir">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Previous
            </div>
            <div class="pd-nav-title">${prev.title}</div>
          </div>
        </a>`;
    } else {
      navHtml += `<div></div>`;
    }

    if (next) {
      navHtml += `
        <a class="pd-nav-card is-next" href="/project-detail?id=${next.id}">
          <div class="pd-nav-card-bg" style="${next.image ? `background-image:url(${next.image})` : ''}"></div>
          <div class="pd-nav-card-overlay"></div>
          <div class="pd-nav-card-body" style="text-align:right;">
            <div class="pd-nav-dir" style="justify-content:flex-end;">
              Next
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div class="pd-nav-title">${next.title}</div>
          </div>
        </a>`;
    } else {
      navHtml += `<div></div>`;
    }

    navEl.innerHTML = navHtml;

    // Animate nav cards on click (uses shared transition.js)
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
  lbMedia = [];
  if (project?.image) lbMedia.push({ type: 'image', src: project.image });
  (project?.gallery || []).forEach(m => lbMedia.push(m));
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
