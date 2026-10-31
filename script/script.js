// ── Scroll restoration fix ──
// GSAP pin adds pinSpacing (margin-bottom) to sections dynamically.
// If the browser restores a mid-page scroll position before GSAP runs,
// pin trigger positions are calculated wrong and break on scroll-up.
// Solution: always start from 0, let the user re-scroll if needed.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ── Accessibility: prefers-reduced-motion (detected once in common.js) ──
const REDUCE_MOTION = window.SITE ? window.SITE.REDUCE_MOTION
  : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════
//  HERO ENTRANCE
// ═══════════════════════════════════════════════
(function () {
  /* Remove overflow:hidden on .line — was needed for the slide-up, now it clips the glow */
  document.querySelectorAll(".hero-name .line").forEach((line) => {
    line.style.overflow = "visible";
    line.style.display  = "block";
  });

  const globeIntro = window.__globeIntro = window.__globeIntro || { p: 0 };

  if (REDUCE_MOTION) {
    globeIntro.p = 1;
    gsap.set(["#heroTag","#heroL1","#heroL2",".hero-cta",".hero-stat","#heroScroll","#heroBtns","#globeCanvas"],
      { clearProps: "all" });
  } else {
    /* Initial states */
    gsap.set("#heroTag",       { opacity: 0, y: 15 });
    gsap.set("#heroL1",        { opacity: 0, y: 20 });
    gsap.set("#heroL2",        { opacity: 0, y: 20 });
    gsap.set(".hero-cta",      { opacity: 0, x: 20 });
    gsap.set(".hero-stat",     { opacity: 0, x: 20 });
    gsap.set("#heroScroll",    { opacity: 0 });
    gsap.set("#heroBtns",      { opacity: 1, y: 0 }); /* heroBtns is just a wrapper, don't animate it */
    gsap.set("#globeCanvas",   { opacity: 0 });
  }

  function startHeroAnim() {
    if (REDUCE_MOTION) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    /* 1. Tagline */
    tl.to("#heroTag",   { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "0");

    /* 2. Name line 1 */
    tl.to("#heroL1",    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "0.3");

    /* 3. Name line 2 — glow fully visible, no clip */
    tl.to("#heroL2",    { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "0.5");

    /* 4. CTA + Stats — each element staggers in from right */
    tl.to(".hero-cta",  { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, "0.8");
    tl.to(".hero-stat", { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.1 }, "0.85");

    /* 5. Scroll hint */
    tl.to("#heroScroll", { opacity: 1, duration: 0.5, ease: "power2.out" }, "1.1");

    /* 6. Globe — bounces in like a ball, elastic overshoot */
    tl.to("#globeCanvas", { opacity: 1, duration: 1.2, ease: "power2.out" }, "0");
    globeIntro.heroAt = performance.now();
  }

  /* No video — start hero animation directly (or after page transition overlay) */
  function startHeroAnimOnce() {
    let started = false;
    return function() { if (started) return; started = true; startHeroAnim(); };
  }
  const onceStart = startHeroAnimOnce();

  const overlay = document.getElementById("ptOverlay");
  if (overlay) {
    overlay.addEventListener("animationend", onceStart, { once: true });
  } else {
    /* Small delay to let Three.js initialize the globe canvas */
    setTimeout(onceStart, 120);
  }
})();

// ═══════════════════════════════════════════════════════════════
//  ABOUT SECTION — CSS sticky + scroll-driven reveal
//  No GSAP pin — same pattern as Projects (reliable on reload)
// ═══════════════════════════════════════════════════════════════
(function () {

  const section    = document.querySelector('#about');
  const stickyWrap = document.querySelector('.about-sticky-wrap');
  const bentoInner = document.querySelector('.about-bento-inner');
  const bento      = document.querySelector('.about-bento');
  if (!section || !stickyWrap || !bentoInner || !bento) return;

  const photo    = document.querySelector('.ab-photo');
  const headline = document.querySelector('.ab-headline');
  const ph1      = document.querySelector('.ab-ph-1');
  const ph2      = document.querySelector('.ab-ph-2');
  const bio      = document.querySelector('.ab-bio');
  const exp      = document.querySelector('.ab-exp');
  const cv       = document.querySelector('.ab-cv');
  const imgBack  = document.getElementById('aboutImgBack');
  const imgFront = document.getElementById('aboutImgFront');
  const hasGlitch = imgBack && imgFront;

  // Each card: progress window [from, to] within 0..1 scroll through section
  // All cards animate bottom-up only — consistent, calm entrance
  // Staggered by column: col1 (photo) → col2 (headline/bio) → col3 (ph1/ph2) → row3 (exp/cv)
  const cards = [
    { el: photo,    from: 0.00, to: 0.24, opacity: [0,1], y: [40,0] },
    { el: headline, from: 0.08, to: 0.32, opacity: [0,1], y: [36,0] },
    { el: ph1,      from: 0.14, to: 0.38, opacity: [0,1], y: [36,0] },
    { el: bio,      from: 0.14, to: 0.38, opacity: [0,1], y: [36,0] },
    { el: ph2,      from: 0.20, to: 0.44, opacity: [0,1], y: [36,0] },
  ].filter(c => c.el);

  const bottomCards = [
    { el: exp, from: 0.40, to: 0.62, opacity: [0,1], y: [40,0] },
    { el: cv,  from: 0.46, to: 0.68, opacity: [0,1], y: [40,0] },
  ].filter(c => c.el);
  let bottomObserver = null;
  let bottomScrub = false;

  const PHOTO_FROM = 0.30;
  const PHOTO_TO   = 0.92;

  function lerpCl(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function prog(val, from, to) { return Math.max(0, Math.min(1, (val - from) / (to - from))); }
  // power2.out — fast start, smooth deceleration (replaces symmetric eio)
  function eio(t) { return 1 - (1 - t) * (1 - t); }

  function resetCards() {
    cards.forEach(c => {
      gsap.set(c.el, {
        opacity: c.opacity ? c.opacity[0] : 1,
        x:       c.x       ? c.x[0]       : 0,
        y:       c.y       ? c.y[0]       : 0,
        scale:   c.scale   ? c.scale[0]   : 1,
      });
    });
    if (hasGlitch) {
      gsap.set(imgBack,  { opacity: 1, clipPath: 'inset(0 0 0 0)' });
      gsap.set(imgFront, { opacity: 1, clipPath: 'inset(100% 0 0 0)' });
    }
    photoTxLastP = -1;
  }

  // ── Reveal bottom-to-top — scroll-driven, fully reversible (About photo) ──
  let photoTxLastP = -1;

  function initPhotoTx() {
    if (!hasGlitch) return;
    const wrap = imgBack.parentNode;
    wrap.style.position = 'relative';
    wrap.style.overflow = 'hidden';

    [imgBack, imgFront].forEach(img => {
      img.style.position  = 'absolute';
      img.style.inset     = '0';
      img.style.width     = '100%';
      img.style.height    = '100%';
      img.style.objectFit = 'cover';
    });

    gsap.set(imgBack,  { opacity: 1, clipPath: 'inset(0 0 0 0)' });
    gsap.set(imgFront, { opacity: 1, clipPath: 'inset(100% 0 0 0)' });
  }

  function renderPhotoTx(p) {
    if (!hasGlitch) return;
    p = Math.max(0, Math.min(1, p));
    if (Math.abs(p - photoTxLastP) < 0.002) return;
    photoTxLastP = p;

    // ease in-out cubic
    const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3) / 2;

    // imgFront reveals from bottom: inset top goes 100% → 0%
    const insetTop = ((1 - e) * 100).toFixed(2);
    gsap.set(imgFront, { clipPath: `inset(${insetTop}% 0 0 0)` });

    // imgBack fades out gently in the second half
    const backOpacity = p < 0.5 ? 1 : 1 - (p - 0.5) * 2;
    gsap.set(imgBack,  { opacity: backOpacity.toFixed(3) });
  }

  function isMobile() { return window.innerWidth <= 1024; }

  // ── Desktop: stickyWrap gets height, bentoInner is sticky ──
  function setupDesktop() {
    const extra = 1100;
    stickyWrap.style.height  = (window.innerHeight + extra) + 'px';
    bentoInner.style.position  = 'sticky';
    bentoInner.style.top       = '0px';
    const innerTop = bentoInner.getBoundingClientRect().top;
    const fits = bottomCards.every(c => {
      const r = c.el.getBoundingClientRect();
      const top = r.top - innerTop - gsap.getProperty(c.el, 'y');
      return top + r.height * 0.6 <= window.innerHeight;
    });
    if (fits !== bottomScrub) {
      bottomScrub = fits;
      initBottomCards();
    }
  }

  function teardownDesktop() {
    stickyWrap.style.height    = '';
    bentoInner.style.position  = '';
    bentoInner.style.top       = '';
  }

  function onScroll() {
    if (isMobile()) return;
    const rect  = stickyWrap.getBoundingClientRect();
    const total = stickyWrap.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const p = Math.max(0, Math.min(1, -rect.top / total));

    cards.forEach(c => {
      const t = eio(prog(p, c.from, c.to));
      gsap.set(c.el, {
        opacity: c.opacity ? lerpCl(c.opacity[0], c.opacity[1], t) : 1,
        x:       c.x       ? lerpCl(c.x[0],       c.x[1],       t) : 0,
        y:       c.y       ? lerpCl(c.y[0],        c.y[1],       t) : 0,
        scale:   c.scale   ? lerpCl(c.scale[0],    c.scale[1],   t) : 1,
      });
    });

    // Scale + Fade photo transition — scroll-driven, works forward & backward
    if (bottomScrub) {
      bottomCards.forEach(c => {
        const t = eio(prog(p, c.from, c.to));
        gsap.set(c.el, { opacity: lerpCl(0, 1, t), y: lerpCl(40, 0, t) });
      });
    }

    const photoP = prog(p, PHOTO_FROM, PHOTO_TO);
    renderPhotoTx(photoP);
  }

  // ── Mobile: IntersectionObserver one-shot reveals ──
  function initMobile() {
    teardownDesktop();
    resetCards();
    cards.forEach(c => {
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        gsap.to(c.el, {
          opacity: 1,
          y:       0,
          duration: 0.65, ease: 'power2.out'
        });
        io.disconnect();
      }, { threshold: 0.15 });
      io.observe(c.el);
    });
    if (hasGlitch) {
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        // On mobile: animate the transition with a quick tween
        gsap.to({ p: 0 }, {
          p: 1, duration: 0.9, ease: 'power3.inOut',
          onUpdate() { renderPhotoTx(this.targets()[0].p); }
        });
        io.disconnect();
      }, { threshold: 0.3 });
      io.observe(photo);
    }
  }

  function initBottomCards() {
    const els = bottomCards.map(c => c.el);
    if (bottomObserver) { bottomObserver.disconnect(); bottomObserver = null; }
    gsap.killTweensOf(els);
    gsap.set(els, { opacity: 0, y: 40 });
    if (!isMobile() && bottomScrub) return;
    bottomObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const i = els.indexOf(entry.target);
        if (entry.isIntersecting) {
          gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.65, delay: i * 0.08, ease: 'power2.out', overwrite: true });
        } else if (!isMobile() && entry.boundingClientRect.top >= window.innerHeight * 0.5) {
          gsap.to(entry.target, { opacity: 0, y: 40, duration: 0.3, ease: 'power2.out', overwrite: true });
        }
      });
    }, { threshold: isMobile() ? 0.15 : 0.6 });
    els.forEach(el => bottomObserver.observe(el));
  }

  function init() {
    initPhotoTx();
    bottomScrub = false;
    initBottomCards();
    if (isMobile()) {
      initMobile();
    } else {
      setupDesktop();
      resetCards();
      onScroll();
    }
  }

  init();
  window.addEventListener('scroll', onScroll, { passive: true });

  let _rt;
  let _lastMode = isMobile() ? 'mobile' : 'desktop';
  window.addEventListener('resize', () => {
    clearTimeout(_rt);
    _rt = setTimeout(() => {
      const newMode = isMobile() ? 'mobile' : 'desktop';
      /* Only reinit when crossing the breakpoint, not on every resize tick */
      if (newMode !== _lastMode) {
        _lastMode = newMode;
        init();
      } else if (newMode === 'desktop') {
        /* Desktop: recalculate sticky height on resize */
        setupDesktop();
        onScroll();
      }
    }, 150);
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => { init(); onScroll(); }, 400);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onScroll();
  });

})();

/* ─── SCROLL LOCK — defined in transition.js as window.lockScroll / window.unlockScroll ─── */
const lockScroll   = () => window.lockScroll?.();
const unlockScroll = () => window.unlockScroll?.();

/* Scroll progress, burger menu, clock, footer reveal — handled by common.js */

/* ─── SKILLS ACCORDION ─── */
(function () {
  const rows = document.querySelectorAll('.sk-row');
  if (!rows.length) return;

  // ── Accordion: header acts as a button (click, Enter, Space) ──
  function syncAria() {
    rows.forEach(r => {
      const head = r.querySelector('.sk-acc-head');
      if (head) head.setAttribute('aria-expanded', r.classList.contains('open') ? 'true' : 'false');
    });
  }
  function toggleRow(row) {
    const wasOpen = row.classList.contains('open');
    rows.forEach(r => r.classList.remove('open'));
    if (!wasOpen) row.classList.add('open');
    syncAria();
  }
  rows.forEach(function (row, i) {
    const head = row.querySelector('.sk-acc-head');
    const body = row.querySelector('.sk-body');
    if (head) {
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      if (body) { body.id = body.id || 'skBody' + i; head.setAttribute('aria-controls', body.id); }
      head.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(row); }
      });
    }
    row.addEventListener('click', () => toggleRow(row));
  });
  syncAria();

  // ── Intro: stag line + title + sub scrub in ──
  const stag  = document.getElementById('skStag');
  const title = document.getElementById('skTitle');
  const sub   = document.getElementById('skSub');
  const list  = document.getElementById('skList');

  if (stag && title && sub) {
    gsap.set([stag, sub], { opacity: 0, y: 20 });
    gsap.set(title,       { opacity: 0, y: 40 });

    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top 80%',
      onEnter() {
        gsap.to(stag,  { opacity: 1, y: 0, duration: .7, ease: 'power2.out' });
        gsap.to(title, { opacity: 1, y: 0, duration: .9, delay: .12, ease: 'power3.out' });
        gsap.to(sub,   { opacity: 1, y: 0, duration: .7, delay: .28, ease: 'power2.out' });
      },
      once: true
    });
  }

  // ── Rows: stagger slide-in from bottom with scrub ──
  if (list) {
    // Top border line — draws in from left on scroll
    gsap.fromTo(list,
      { '--line-w': '0%' },
      { '--line-w': '100%',
        ease: 'none',
        scrollTrigger: { trigger: list, start: 'top 85%', end: 'top 60%', scrub: 1 }
      }
    );

    // Each row flies in with stagger
    rows.forEach(function (row, i) {
      gsap.fromTo(row,
        { opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0 0 0% 0)',
          duration: .8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: list,
            start: 'top 78%',
            toggleActions: 'play none none none'
          },
          delay: i * 0.09
        }
      );
    });

    // First row opens automatically after animation
    ScrollTrigger.create({
      trigger: list,
      start: 'top 70%',
      onEnter() {
        setTimeout(function () {
          if (!document.querySelector('.sk-row.open')) {
            rows[0].classList.add('open');
            syncAria();
          }
        }, 700);
      },
      once: true
    });
  }

  // ── Hover: number colour pulse on row hover ──
  rows.forEach(function (row) {
    const num = row.querySelector('.sk-num');
    if (!num) return;
    row.addEventListener('mouseenter', function () {
      gsap.to(num, { color: '#3DFF8F', duration: .25, ease: 'power2.out' });
    });
    row.addEventListener('mouseleave', function () {
      if (!row.classList.contains('open')) {
        gsap.to(num, { color: 'rgba(61,255,143,0.65)', duration: .3, ease: 'power2.out' });
      }
    });
  });

})();

/* ─── PROJECTS SPLIT LAYOUT ─── */
(function () {
  const wrap   = document.getElementById('pjsWrap');
  const sticky = document.getElementById('pjsSticky');
  const list   = document.getElementById('pjsList');
  if (!list) return;
  const cards  = Array.from(list.querySelectorAll('.pjs-card'));
  const video  = document.getElementById('pjsVideo');
  const info   = document.getElementById('pjsInfo');
  const curEl  = document.getElementById('pjsCur');
  const totEl  = document.getElementById('pjsTot');

  if (!wrap || !cards.length) return;

  const COUNT = cards.length;
  totEl.textContent = String(COUNT).padStart(2, '0');

  function pad(n) { return String(n).padStart(2, '0'); }
  function isMobile() { return window.innerWidth <= 1024; }

  let activeIdx  = 0;
  let switchTimer = null;
  let _initialised = false;

  function setActive(idx, fromScroll) {
    /* Skip only if this card is already active AND its video is already loaded.
       (Card 0 is marked .active in the HTML, so the old check skipped the first video forever.) */
    if (idx === activeIdx && _currentSrc === cards[idx].dataset.video) return;
    activeIdx = idx;
    cards.forEach((c, i) => c.classList.toggle('active', i === idx));
    if (fromScroll) scrollListToCard(idx);
    curEl.textContent = pad(idx + 1);
    const d = cards[idx].dataset;
    updateVideo(d.video, d.poster, d.videoWebm);
    updateInfo(d);
  }

  function scrollListToCard(idx) {
    if (isMobile()) return;
    const card    = cards[idx];
    const listH   = list.clientHeight;
    const cardTop = card.offsetTop;
    const cardH   = card.offsetHeight;
    list.scrollTo({ top: Math.max(0, cardTop - listH / 2 + cardH / 2), behavior: 'smooth' });
  }

  // ── Poster → Video transition (Projects) ──
  // Layout (z-index): video(0) | poster(1) | overlay(2) | info(3)
  // Sequence on every project (including first):
  //   poster fades IN (0.35s) → video loads → poster fades OUT + video fades IN simultaneously (0.45s)
  // On project switch: video fades OUT (0.3s) while next poster fades IN → then same sequence.

  const posterEl = document.getElementById('pjsPoster');
  let _playTm    = null;
  let _currentSrc = '';

  // Ensure video starts fully hidden; poster is fully visible (set in CSS/HTML)
  gsap.set(video, { opacity: 0 });
  if (posterEl) gsap.set(posterEl, { opacity: 1 });

  function showPosterThenVideo(poster, src, srcWebm) {
    clearTimeout(_playTm);
    if (!video) return;

    // Step 1: show poster
    if (posterEl && poster) {
      posterEl.src = poster;
      gsap.killTweensOf(posterEl);
      gsap.to(posterEl, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    }

    // Step 2: load new video source
    video.pause();
    gsap.killTweensOf(video);
    gsap.set(video, { opacity: 0 });

    video.innerHTML = '';
    if (srcWebm) {
      const webmEl = document.createElement('source');
      webmEl.src  = srcWebm;
      webmEl.type = 'video/webm';
      video.appendChild(webmEl);
    }
    const mp4El = document.createElement('source');
    mp4El.src  = src;
    mp4El.type = 'video/mp4';
    video.appendChild(mp4El);
    video.preload = 'auto';
    video.load();

    // Step 3: when ready — crossfade poster out + video in
    // Guard: doPlay fires exactly once per call, even if canplay + timeout both fire
    let played = false;
    function doPlay() {
      if (played) return;
      played = true;
      clearTimeout(_playTm);
      video.play().catch(() => {});
      gsap.killTweensOf(video);
      gsap.to(video, { opacity: 1, duration: 0.45, ease: 'power2.inOut' });
      if (posterEl) {
        /* The presentation videos open with a ~1s fade-in from an empty backdrop
           (needed for a seamless loop). Keep the poster — a frame with the site
           already visible — on top a little longer, so switching projects never
           flashes an empty frame. No seeking: it's unreliable before full buffering. */
        gsap.killTweensOf(posterEl);
        gsap.to(posterEl, { opacity: 0, duration: 0.5, delay: 0.9, ease: 'power2.inOut' });
      }
    }

    // Fallback: if video never loads, keep poster visible
    function onError() {
      if (played) return;
      played = true;
      clearTimeout(_playTm);
      if (posterEl) gsap.set(posterEl, { opacity: 1 });
    }

    if (video.readyState >= 3) {
      doPlay();
    } else {
      _playTm = setTimeout(() => {
        video.removeEventListener('canplay', doPlay);
        video.removeEventListener('error', onError);
        doPlay(); // fallback after timeout — video may still be buffering, try anyway
      }, 450);
      video.addEventListener('canplay', doPlay, { once: true });
      video.addEventListener('error',   onError, { once: true });
    }
  }

  function updateVideo(src, poster, srcWebm) {
    if (!_initialised || !src || src === _currentSrc) return;
    clearTimeout(switchTimer);
    clearTimeout(_playTm);

    // Mark src immediately so rapid calls don't trigger duplicate loads
    const prevSrc = _currentSrc;
    _currentSrc = src;

    if (prevSrc === '') {
      // First project on page load — just run the sequence directly
      showPosterThenVideo(poster, src, srcWebm);
    } else {
      // Switching project: fade out current video first (0.3s), then show poster + load new
      video.pause();
      gsap.killTweensOf(video);
      gsap.to(video, {
        opacity: 0, duration: 0.3, ease: 'power2.inOut',
        onComplete: () => showPosterThenVideo(poster, src, srcWebm)
      });
    }
  }

  function updateInfo(d) {
    const badge = document.getElementById('pjsBadge');
    const year  = document.getElementById('pjsYear');
    const name  = document.getElementById('pjsName');
    const desc  = document.getElementById('pjsDesc');
    const cta   = document.getElementById('pjsCta');
    if (badge) badge.textContent = d.type || '';
    if (year)  year.textContent  = d.year || '';
    if (name)  name.textContent  = d.name || '';
    if (desc)  desc.textContent  = d.desc || '';
    if (cta)   cta.href          = d.link || '#';
    info.classList.remove('pjs-info-fade');
    void info.offsetWidth;
    info.classList.add('pjs-info-fade');
  }

  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => { if (!isMobile()) setActive(i, false); });
    /* Keyboard: Tab focuses & previews, Enter/Space opens the project */
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) setActive(i, false); });
    card.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (card.dataset.link) window.location.href = card.dataset.link;
    });
    card.addEventListener('click', () => {
      if (isMobile()) {
        /* First tap: select card (show info in video box above).
           Second tap on same already-active card: navigate to project. */
        if (card.classList.contains('active')) {
          const link = card.dataset.link;
          if (link) window.location.href = link;
        } else {
          setActive(i, false);
          /* Scroll video box into view so user sees the preview */
          const right = document.querySelector('.pjs-right');
          if (right) right.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        setActive(i, false);
      }
    });
  });

  /* Desktop: the section is N×100vh tall, scroll position picks the active card.
     Handlers are registered ONCE and check the current mode themselves
     (previously they were re-added on every resize / tab switch → listener leak). */
  function onDesktopScroll() {
    if (isMobile()) return;
    const scrolled = -wrap.getBoundingClientRect().top;
    if (scrolled < 0) { setActive(0, true); return; }
    const totalScroll = wrap.offsetHeight - window.innerHeight;
    if (totalScroll <= 0) return;
    const step = totalScroll / COUNT;
    setActive(Math.min(COUNT - 1, Math.floor(scrolled / step)), true);
  }

  /* Mobile: horizontal card strip — the card closest to the left edge becomes active */
  let listScrollTimer;
  function onMobileListScroll() {
    if (!isMobile()) return;
    clearTimeout(listScrollTimer);
    listScrollTimer = setTimeout(() => {
      const listLeft = list.getBoundingClientRect().left;
      let best = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.getBoundingClientRect().left - listLeft);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best, true);
    }, 60);
  }

  function applyLayout() {
    wrap.style.height = isMobile() ? '' : (100 + (COUNT - 1) * 60) + 'vh';
  }

  window.addEventListener('scroll', onDesktopScroll, { passive: true });
  list.addEventListener('scroll', onMobileListScroll, { passive: true });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { applyLayout(); onDesktopScroll(); }, 150);
  }, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { applyLayout(); onDesktopScroll(); }, 400);
  });

  applyLayout();

  // Delay initial video load until the section is actually visible.
  // Calling video.play() before the user has scrolled to the section
  // gets blocked by browser autoplay policy — the video stays invisible.
  const _sectionObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting || _initialised) return;
    _initialised = true;
    _sectionObserver.disconnect();
    setActive(0, true);
  }, { threshold: 0.1 });
  _sectionObserver.observe(wrap);

  // Resume after bfcache restore (browser Back/Forward)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && video) video.play().catch(() => {});
  });
})();

/* ─── REVEAL BUTTON — soft top glow + sparks ─── */
(function () {
  const section = document.getElementById('projReveal');
  const btn     = document.getElementById('revealBtn');
  const lbl     = document.getElementById('revealLabel');
  const canvas  = document.getElementById('revealCanvas');
  if (!section || !canvas) return;
  if (REDUCE_MOTION) {
    canvas.style.display = 'none';           /* decorative only */
    if (btn) btn.style.opacity = '1';        /* CSS starts it hidden for the GSAP reveal */
    if (lbl) lbl.style.opacity = '1';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H, sparks = [];

  function resize() {
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
  }
  resize();
  let resizeTm;
  window.addEventListener('resize', () => { clearTimeout(resizeTm); resizeTm = setTimeout(resize, 150); });

  function spawnSparks(n) {
    const cx = W / 2, cy = H * .45;
    for (let i = 0; i < n; i++) {
      const a   = (Math.random() - .5) * Math.PI * .9 - Math.PI / 2;
      const spd = .6 + Math.random() * 2.2;
      sparks.push({
        x: cx + (Math.random() - .5) * 80,
        y: cy + (Math.random() - .5) * 20,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        r: .5 + Math.random() * 1.2,
        alpha: .8 + Math.random() * .2,
        life: 0, maxLife: 50 + Math.random() * 40,
        glow: Math.random() > .5
      });
    }
  }

  let t = 0, progress = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (progress > 0.01) {
      const cx = W / 2;
      const g1 = ctx.createRadialGradient(cx, 0, 0, cx, 0, H * .9);
      g1.addColorStop(0,   `rgba(61,255,143,${.09 * progress})`);
      g1.addColorStop(.35, `rgba(61,255,143,${.04 * progress})`);
      g1.addColorStop(1,   'rgba(61,255,143,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      const by = H * .45;
      const g2 = ctx.createRadialGradient(cx, 0, 0, cx, by, H * .55);
      g2.addColorStop(0,  `rgba(61,255,143,${.12 * progress})`);
      g2.addColorStop(.5, `rgba(61,255,143,${.05 * progress})`);
      g2.addColorStop(1,  'rgba(61,255,143,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

      const g3 = ctx.createRadialGradient(cx, by, 0, cx, by, 160 * progress);
      g3.addColorStop(0,  `rgba(61,255,143,${.14 * progress})`);
      g3.addColorStop(.5, `rgba(61,255,143,${.05 * progress})`);
      g3.addColorStop(1,  'rgba(61,255,143,0)');
      ctx.fillStyle = g3;
      ctx.beginPath(); ctx.arc(cx, by, 160 * progress, 0, 6.283); ctx.fill();
    }

    sparks = sparks.filter(s => {
      s.life++; s.x += s.vx; s.y += s.vy; s.vy += .04;
      const p = 1 - s.life / s.maxLife;
      ctx.globalAlpha = s.alpha * p;
      if (s.glow) { ctx.shadowColor = '#3DFF8F'; ctx.shadowBlur = 6; }
      ctx.fillStyle = '#3DFF8F';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (s.glow) ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return s.life < s.maxLife;
    });
  }

  /* Single rAF loop that runs only while the section is on screen.
     (Previously draw() re-scheduled itself AND drawLoop() called it every frame,
     spawning a new never-ending loop each frame → growing lag.) */
  let revealRaf = 0;
  function drawLoop() { draw(); revealRaf = requestAnimationFrame(drawLoop); }
  new IntersectionObserver(e => {
    if (e[0].isIntersecting) { if (!revealRaf) revealRaf = requestAnimationFrame(drawLoop); }
    else if (revealRaf) { cancelAnimationFrame(revealRaf); revealRaf = 0; }
  }, { threshold: 0 }).observe(section);

  ScrollTrigger.create({
    trigger: section, start: 'top 90%', end: 'top 35%', scrub: 1.8,
    onUpdate(self) {
      const prev = progress;
      progress = self.progress;
      if (prev < .2  && progress >= .2)  spawnSparks(22);
      if (prev < .55 && progress >= .55) spawnSparks(14);
      if (prev < .85 && progress >= .85) spawnSparks(10);
    }
  });

  if (lbl) gsap.fromTo(lbl, { opacity: 0, y: 14 }, { opacity: 1, y: 0, ease: 'power2.out', duration: .7,
    scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' } });
  gsap.fromTo(btn, { opacity: 0, y: 28, scale: .88 }, { opacity: 1, y: 0, scale: 1, ease: 'power3.out', duration: .8,
    scrollTrigger: { trigger: section, start: 'top 72%', toggleActions: 'play none none none' } });
})();

/* ─── FOOTER CANVAS PARTICLES ─── */
(function () {
  const footer = document.getElementById('footer');
  const fc     = document.getElementById('footCanvas');
  if (!footer || !fc) return;
  if (REDUCE_MOTION) { fc.style.display = 'none'; return; } /* decorative only */
  const fctx = fc.getContext('2d');
  let fW, fH, fp = [];

  function fResize() {
    const dpr = window.devicePixelRatio || 1;
    fW = footer.offsetWidth;
    fH = footer.offsetHeight;
    fc.width  = fW * dpr;
    fc.height = fH * dpr;
    fc.style.width  = fW + 'px';
    fc.style.height = fH + 'px';
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset + set (prevents scale accumulation on resize)
  }
  fResize();
  let fResizeTm;
  window.addEventListener('resize', () => { clearTimeout(fResizeTm); fResizeTm = setTimeout(fResize, 150); });

  class FP {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * fW;
      this.y = init ? Math.random() * fH : fH + 10;
      this.vx = (Math.random() - .5) * .15;
      this.vy = -(Math.random() * .2 + .06);
      this.r = Math.random() * 1.2 + .2;
      this.alpha = Math.random() * .28 + .05;
      this.life = 0; this.maxLife = 220 + Math.random() * 260;
      this.glow = Math.random() > .78;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life++; if (this.life > this.maxLife || this.y < -5) this.reset(); }
    draw() {
      const p    = this.life / this.maxLife;
      const fade = p < .12 ? p / .12 : p > .8 ? (1 - p) / .2 : 1;
      fctx.globalAlpha = this.alpha * fade;
      if (this.glow) { fctx.shadowColor = '#3DFF8F'; fctx.shadowBlur = 8; }
      fctx.fillStyle = '#3DFF8F';
      fctx.beginPath(); fctx.arc(this.x, this.y, this.r, 0, 6.283); fctx.fill();
      if (this.glow) fctx.shadowBlur = 0;
    }
  }
  for (let i = 0; i < 40; i++) fp.push(new FP());

  /* Run the particle loop only while the footer is visible */
  let fRaf = 0;
  function fLoop() {
    fctx.clearRect(0, 0, fW, fH);
    fctx.globalAlpha = 1;
    fp.forEach(p => { p.update(); p.draw(); });
    fRaf = requestAnimationFrame(fLoop);
  }
  new IntersectionObserver(e => {
    if (e[0].isIntersecting) { if (!fRaf) fRaf = requestAnimationFrame(fLoop); }
    else if (fRaf) { cancelAnimationFrame(fRaf); fRaf = 0; }
  }, { threshold: 0 }).observe(footer);
})();


/* ─── FOOTER ENTRANCE ANIMATION ─── */



(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  let heroH = window.innerHeight;
  let lastY = window.scrollY;
  let ticking = false;

  /* Recalculate on resize/orientation change so nav doesn't get stuck */
  window.addEventListener('resize', () => { heroH = window.innerHeight; }, { passive: true });
  window.addEventListener('orientationchange', () => { setTimeout(() => { heroH = window.innerHeight; }, 300); });

  function update() {
    const y = window.scrollY;
    const pastHero = y > heroH * 0.6;

    // Switch position: absolute → fixed
    nav.classList.toggle('s', pastHero);

    if (pastHero) {
      if (y > lastY + 8) {
        nav.classList.add('nav-hidden');
      } else if (y < lastY - 4) {
        nav.classList.remove('nav-hidden');
      }
    } else {
      nav.classList.remove('nav-hidden');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
})();


/* ═══════════════════════════════════════════════════════════════
   REVIEWS — single review list + dynamic distribution across columns
   Seamless infinite scroll via modulo-wrapped translateY (no getBoundingClientRect
   or DOM recycling in the animation loop — expensive and janky at 60fps).

   Previously each review was hard-wired to its column (data-col),
   so on mobile (1 column) only 2 of 6 reviews were visible —
   the other 4 just sat in hidden columns.
   Now all cards are one list; when the breakpoint changes the columns
   are rebuilt and the list is dealt out round-robin, so
   mobile shows the full set of reviews, just in one strip.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  // Master list of reviews — HTML order = display order.
  // Stored once as the "source of truth"; columns clone from it.
  const masterCards = Array.from(grid.querySelectorAll('.review-card'));
  if (!masterCards.length) return;
  grid.innerHTML = '';

  // Pause all rAF loops while the section is off-screen (saves CPU/battery)
  let reviewsVisible = false;
  new IntersectionObserver(([e]) => { reviewsVisible = e.isIntersecting; }, { threshold: 0 }).observe(grid);

  const autoSpeeds = REDUCE_MOTION ? [0, 0, 0] : [0.55, 0.42, 0.50];
  const GAP = 24;

  function visibleCols() {
    if (window.innerWidth <= 640)  return 1;
    if (window.innerWidth <= 1100) return 2;
    return 3;
  }

  function buildColumn(cardsForCol, ci) {
    const col = document.createElement('div');
    col.className = `reviews-col col-${ci}`;
    col.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      will-change: transform;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      position: relative;
    `;

    const originals = cardsForCol.map(c => {
      const clone = c.cloneNode(true);
      clone.style.flexShrink = '0';
      col.appendChild(clone);
      return clone;
    });
    grid.appendChild(col);

    // "Period" of the loop — total height of one full set of the column's cards
    const setHeight = originals.reduce((s, el) => s + el.offsetHeight + GAP, 0); // 1 measurement, not in the loop

    // Duplicate the set until the column covers the grid at least 2.5 times
    const gridH = grid.offsetHeight || 520;
    const minH  = gridH * 2.5;
    let totalH  = setHeight;
    let safety  = 0;
    while (totalH < minH && safety++ < 40) {
      cardsForCol.forEach(c => {
        const clone = c.cloneNode(true);
        clone.style.flexShrink = '0';
        clone.setAttribute('aria-hidden', 'true'); /* loop filler — screen readers read each review once */
        col.appendChild(clone);
      });
      totalH += setHeight;
    }

    let offset = 0;
    let vel = 0;
    let dragging = false;
    let hovered = false;
    let prevY = 0;
    let lastY = 0;
    let lastT = 0;
    let initialized = false;
    let destroyed = false;
    const speed = autoSpeeds[ci % autoSpeeds.length];

    function apply() {
      col.style.transform = `translateY(${offset}px)`;
    }

    // Keep offset within (-setHeight, 0] — pure arithmetic, no DOM/layout.
    function wrap() {
      if (setHeight <= 0) return;
      if (offset <= -setHeight) offset += setHeight * Math.ceil(-offset / setHeight);
      else if (offset > 0) offset -= setHeight * Math.ceil(offset / setHeight);
    }

    function tick() {
      if (destroyed) return;
      if (reviewsVisible && !dragging) {
        if (hovered) {
          /* Paused — smoothly decelerate to zero */
          vel *= 0.85;
          if (Math.abs(vel) > 0.05) {
            offset += vel;
            wrap();
            apply();
          }
        } else {
          /* Auto-scroll — accelerate or hold speed */
          if (Math.abs(vel) > speed) {
            vel *= 0.93;
          } else {
            vel = -speed;
          }
          offset += vel;
          wrap();
          apply();
        }
      }
      requestAnimationFrame(tick);
    }

    function init() {
      if (initialized) return;
      initialized = true;
      vel = -speed;
      requestAnimationFrame(tick);
    }

    setTimeout(init, 100);

    /* ── Hover pause (not while dragging) ── */
    col.addEventListener('mouseenter', () => { hovered = true; });
    col.addEventListener('mouseleave', () => { hovered = false; });

    /* ── Hide the hint after the first drag ── */
    function hideHint() {
      const hint = grid.parentElement.querySelector('.reviews-hint');
      if (hint) hint.classList.add('is-hidden');
    }

    /* ══ MOUSE ══ */
    function onMouseDown(e) {
      init();
      hideHint();
      dragging = true;
      prevY = e.clientY;
      lastY = e.clientY;
      lastT = performance.now();
      vel = 0;
      col.style.cursor = 'grabbing';
    }

    function onMouseMove(e) {
      if (!dragging) return;
      const dy = e.clientY - prevY;
      prevY = e.clientY;

      const now = performance.now();
      const dt = now - lastT || 16;
      vel = (e.clientY - lastY) / dt * 16;
      lastY = e.clientY;
      lastT = now;

      offset += dy;
      wrap();
      apply();
    }

    function onMouseUp() {
      if (!dragging) return;
      dragging = false;
      col.style.cursor = 'grab';
    }

    col.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    /* ══ TOUCH ══ */
    let touchStartX = 0;
    let touchIntent = null;

    function onTouchStart(e) {
      init();
      hideHint();
      prevY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      lastY = prevY;
      lastT = performance.now();
      vel = 0;
      touchIntent = null;
      dragging = true;
    }

    function onTouchMove(e) {
      if (!dragging) return;
      const curY = e.touches[0].clientY;
      const dy = curY - prevY;
      const dx = e.touches[0].clientX - touchStartX;

      if (touchIntent === null && (Math.abs(curY - lastY) > 4 || Math.abs(dx) > 4)) {
        touchIntent = Math.abs(curY - lastY) >= Math.abs(dx) ? 'col' : 'page';
      }

      if (touchIntent === 'page') {
        dragging = false;
        return;
      }

      if (touchIntent === 'col') {
        if (e.cancelable) e.preventDefault();

        const now = performance.now();
        const dt = now - lastT || 16;
        vel = dy / dt * 16;
        lastY = curY;
        lastT = now;

        prevY = curY;
        offset += dy;
        wrap();
        apply();
      }
    }

    function onTouchEnd() {
      if (!dragging) return;
      dragging = false;
    }

    col.addEventListener('touchstart', onTouchStart, { passive: true });
    col.addEventListener('touchmove', onTouchMove, { passive: false });
    col.addEventListener('touchend', onTouchEnd, { passive: true });

    return {
      destroy() {
        destroyed = true;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
    };
  }

  let activeCols = [];
  let currentN = 0;

  function rebuild() {
    const n = visibleCols();
    currentN = n;

    activeCols.forEach(c => c.destroy());
    activeCols = [];
    grid.innerHTML = '';

    const buckets = Array.from({ length: n }, () => []);
    masterCards.forEach((card, i) => buckets[i % n].push(card));

    activeCols = buckets
      .filter(cards => cards.length)
      .map((cards, ci) => buildColumn(cards, ci));
  }

  rebuild();

  /* ── single resize handler: rebuild columns only when the breakpoint changes ── */
  let _rvResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_rvResizeTimer);
    _rvResizeTimer = setTimeout(() => {
      const n = visibleCols();
      if (n !== currentN) rebuild();
    }, 150);
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      const n = visibleCols();
      if (n !== currentN) rebuild();
    }, 400);
  });

})();



/* ─── CONTACT DRAWER ─── */
(function () {
  'use strict';

  const openBtn   = document.getElementById('drawerOpen');
  const closeBtn  = document.getElementById('drawerClose');
  const drawer    = document.getElementById('contactDrawer');
  const overlay   = document.getElementById('drawerOverlay');
  const form      = document.getElementById('drawerForm');
  const successEl = document.getElementById('drawerSuccess');
  const submitBtn = document.getElementById('drawerSubmit');

  if (!openBtn || !drawer || !form) return;

  const fieldName  = document.getElementById('d-name');
  const fieldEmail = document.getElementById('d-email');
  const fieldMsg   = document.getElementById('d-msg');
  const counterEl  = document.getElementById('d-counter');

  // Character counter for the textarea
  if (fieldMsg && counterEl) {
    fieldMsg.addEventListener('input', function () {
      const n = this.value.length;
      counterEl.textContent = n + (n === 1 ? ' char' : ' chars');
      counterEl.className = 'cf-counter' + (n >= 50 ? ' ok' : '');
    });
  }

  let isOpen    = false;
  let prevFocus = null;

  /* ══════════════════════════════════════
     VALIDATION
  ══════════════════════════════════════ */

  function validate(field, groupId, errId, ruleFn) {
    const group = document.getElementById(groupId);
    const errEl = document.getElementById(errId) || { textContent: '' };
    const error = ruleFn(field.value.trim());

    if (error) {
      group.classList.add('has-error');
      group.classList.remove('is-valid');
      errEl.textContent = error;
      return false;
    } else {
      group.classList.remove('has-error');
      group.classList.add('is-valid');
      errEl.textContent = '';
      return true;
    }
  }

  function validateAll() {
    const okName  = validate(fieldName,  'grp-name',  'err-name',  v => !v ? 'Name is required' : null);
    const okEmail = validate(fieldEmail, 'grp-email', 'err-email', v => {
      if (!v) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
      return null;
    });
    const okMsg   = validate(fieldMsg,   'grp-msg',   'err-msg',   v => !v ? 'Please describe your project' : null);

    const typeEl     = document.getElementById('d-type');
    const deadlineEl = document.getElementById('d-deadline');

    const okType     = !typeEl     || validate(typeEl,     'grp-type',     'err-type',     v => !v ? 'Choose a project type' : null);
    const okDeadline = !deadlineEl || validate(deadlineEl, 'grp-deadline', 'err-deadline', v => !v ? 'Choose a deadline' : null);

    return okName && okEmail && okMsg && okType && okDeadline;
  }

  /* ══════════════════════════════════════
     DRAWER OPEN / CLOSE
  ══════════════════════════════════════ */

  function openDrawer() {
    if (isOpen) return;
    isOpen    = true;
    prevFocus = document.activeElement;

    drawer.removeAttribute('aria-hidden');
    drawer.inert = false; /* closed drawer is inert: no Tab stops inside an invisible form */
    openBtn.setAttribute('aria-expanded', 'true');
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    lockScroll();

    /* iOS keyboard fix: resize drawer when virtual keyboard appears */
    if (window.visualViewport) {
      function onVVResize() {
        const vv = window.visualViewport;
        drawer.style.height = vv.height + 'px';
        drawer.style.top    = vv.offsetTop + 'px';
      }
      window.visualViewport.addEventListener('resize', onVVResize);
      window.visualViewport.addEventListener('scroll', onVVResize);
      drawer._vvCleanup = () => {
        window.visualViewport.removeEventListener('resize', onVVResize);
        window.visualViewport.removeEventListener('scroll', onVVResize);
        drawer.style.height = '';
        drawer.style.top = '';
      };
    }

    if (typeof gsap !== 'undefined') {
      const items = form.querySelectorAll('.cf-g, .cf-sub');
      gsap.fromTo(items,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.2 }
      );
    }

    setTimeout(() => {
      const first = drawer.querySelector('input');
      if (first) first.focus();
    }, 540);
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;

    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    openBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    unlockScroll();

    /* Clean up iOS keyboard listener */
    if (drawer._vvCleanup) { drawer._vvCleanup(); drawer._vvCleanup = null; }

    if (prevFocus) prevFocus.focus();
  }

  function resetDrawer() {
    form.reset();

    /* Clear all validation states */
    ['grp-name','grp-email','grp-msg','grp-type','grp-deadline'].forEach(id => {
      const g = document.getElementById(id);
      if (g) g.classList.remove('has-error','is-valid');
    });
    ['err-name','err-email','err-msg','err-type','err-deadline'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    /* Hide send-error */
    const sendErr = form.querySelector('.cf-send-error');
    if (sendErr) sendErr.classList.remove('is-visible');

    /* Reset the button */
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;

    /* Hide success, show the form */
    successEl.classList.remove('is-visible');
    form.style.display = '';
    form.style.opacity = '';
  }

  /* ══════════════════════════════════════
     EVENTS
  ══════════════════════════════════════ */

  openBtn.addEventListener('click', () => {
    resetDrawer();
    openDrawer();
  });

  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  });

  /* Focus trap */
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll(
      'button:not([disabled]),[href],input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  /* ══════════════════════════════════════
     FORM SUBMIT
  ══════════════════════════════════════ */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Clear the previous send-error */
    const sendErr = form.querySelector('.cf-send-error');
    if (sendErr) sendErr.classList.remove('is-visible');

    if (!validateAll()) return;

    /* Loading */
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    const name  = fieldName.value.trim();
    const email = fieldEmail.value.trim();
    const msg   = fieldMsg.value.trim();

    const type      = (document.getElementById('d-type')      || {}).value || '';
    const deadline  = (document.getElementById('d-deadline')   || {}).value || '';
    const messenger = (document.getElementById('d-messenger')  || {}).value.trim() || '';

    fetch('https://formspree.io/f/mpqneqjq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name,
        email,
        message:      msg,
        project_type: type,
        deadline,
        messenger,
        _gotcha: (document.getElementById('d-website') || {}).value || ''
      })
    })
    .then(function (r) {
      if (r.ok) showSuccess();
      else showSendError();
    })
    .catch(showSendError)
    .finally(function () {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    });
  });

  /* ══════════════════════════════════════
     SUCCESS / ERROR
  ══════════════════════════════════════ */

  function showSuccess() {
    submitBtn.classList.remove('is-loading');

    if (typeof gsap !== 'undefined') {
      gsap.to(form, {
        opacity: 0, y: -12, duration: 0.28, ease: 'power2.in',
        onComplete: () => {
          form.style.display = 'none';
          successEl.classList.add('is-visible');
          gsap.fromTo(successEl,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }
          );
        }
      });
    } else {
      form.style.display = 'none';
      successEl.classList.add('is-visible');
    }
  }

  function showSendError() {
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;

    let sendErr = form.querySelector('.cf-send-error');
    if (!sendErr) {
      sendErr = document.createElement('p');
      sendErr.className = 'cf-send-error';
      sendErr.textContent = 'Something went wrong — please try emailing directly.';
      form.appendChild(sendErr);
    }
    sendErr.classList.add('is-visible');
  }

})();

// ═══════════════════════════════════════════════════════════════
//  CONTACT TIMELINE — ScrollTrigger pin + canvas snake animation
// ═══════════════════════════════════════════════════════════════
(function () {
  const canvas  = document.getElementById('ctLineCanvas');
  const tlWrap  = document.getElementById('ctTimeline');
  const section = document.getElementById('contact');
  if (!canvas || !tlWrap || !section) return;

  const ctx = canvas.getContext('2d');

  const isMobile = () => window.innerWidth <= 1024;

  // ── math helpers ────────────────────────────────────────────
  const cl  = (v, a, b) => Math.max(a, Math.min(b, v));
  const lp  = (a, b, t) => a + (b - a) * t;
  const eo3 = t => 1 - Math.pow(1 - t, 3);
  const eo5 = t => 1 - Math.pow(1 - t, 5);
  const eio = t => t < .5 ? 4*t*t*t : (1 - Math.pow(-2*t+2, 3) / 2);

  // ── canvas resize ────────────────────────────────────────────
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const W   = tlWrap.offsetWidth;
    const H   = tlWrap.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── layout ───────────────────────────────────────────────────
  // cy measured once at init (while elements are in flow)
  let _cy = null;
  function measureCy() {
    const dw = document.getElementById('ctD1')?.closest('.ct-tl-item')?.querySelector('.ct-dot-wrap');
    if (dw) {
      const tlRect = tlWrap.getBoundingClientRect();
      const dwRect = dw.getBoundingClientRect();
      _cy = dwRect.top - tlRect.top + dwRect.height / 2;
    }
    if (!_cy) _cy = tlWrap.offsetHeight * 0.42;
  }

  function getLayout() {
    const W  = tlWrap.offsetWidth;
    const H  = tlWrap.offsetHeight;
    const cy = _cy || H * 0.42;
    return {
      s1: { x: W * .16, y: cy },
      s2: { x: W * .50, y: cy },
      s3: { x: W * .84, y: cy },
      cx: W * .50, cy, W, H
    };
  }

  // ── position items absolutely ────────────────────────────────
  function positionItems(lyt) {
    if (isMobile()) return; // on mobile items stay in flow (position:relative)
    // ct-tl-item has padding-top: 28px, dot-wrap = 64px
    // so the dot-wrap centre sits on cy: top = cy - 28 - 32
    [['ctS1'], ['ctS2'], ['ctS3']].forEach(([id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.position  = 'absolute';
      el.style.top       = (lyt.cy - 60) + 'px';
    });
  }

  // ── snake points ─────────────────────────────────────────────
  function snakePoints(worm, phase, lyt, count = 80) {
    const amp = worm * 46;
    const x1  = lyt.s1.x, x2 = lyt.s3.x, cy = lyt.cy;
    const pts = [];
    for (let i = 0; i <= count; i++) {
      const tx = i / count;
      pts.push([
        lp(x1, x2, tx),
        cy + amp * Math.sin(tx * Math.PI * 3.1 + phase * 2.5) * .60
           + amp * Math.sin(tx * Math.PI * 5.6 + phase * 1.8) * .26
           + amp * Math.sin(tx * Math.PI * 1.4 + phase * 1.0) * .20
      ]);
    }
    return pts;
  }

  // ── draw canvas ───────────────────────────────────────────────
  function drawCanvas(pts, drawFrac, pulsePos, pulseOp, lyt) {
    ctx.clearRect(0, 0, lyt.W, lyt.H);
    if (drawFrac < 0.001) return;

    const total   = pts.length - 1;
    const drawn   = Math.floor(eo3(drawFrac) * total);
    const dPts    = pts.slice(0, drawn + 1);
    if (dPts.length < 2) return;

    // main gradient line
    const grd = ctx.createLinearGradient(lyt.s1.x, 0, lyt.s3.x, 0);
    grd.addColorStop(0,    'rgba(61,255,143,0)');
    grd.addColorStop(0.08, 'rgba(61,255,143,0.65)');
    grd.addColorStop(0.92, 'rgba(61,255,143,0.45)');
    grd.addColorStop(1,    'rgba(61,255,143,0)');

    function strokePath(pArr) {
      ctx.beginPath();
      ctx.moveTo(pArr[0][0], pArr[0][1]);
      for (let i = 1; i < pArr.length - 1; i++) {
        const mx = (pArr[i][0] + pArr[i+1][0]) / 2;
        const my = (pArr[i][1] + pArr[i+1][1]) / 2;
        ctx.quadraticCurveTo(pArr[i][0], pArr[i][1], mx, my);
      }
      ctx.lineTo(pArr[pArr.length-1][0], pArr[pArr.length-1][1]);
    }

    strokePath(dPts);
    ctx.strokeStyle = grd;
    ctx.lineWidth   = 1.2;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // travelling pulse glow — only after line fully drawn
    if (pulseOp > 0.01 && drawFrac > 0.99) {
      const pi  = Math.round(pulsePos * (pts.length - 1));
      const px  = pts[pi][0], py = pts[pi][1];
      const gp  = ctx.createRadialGradient(px, py, 0, px, py, lyt.W * 0.18);
      gp.addColorStop(0,   `rgba(255,255,255,${(pulseOp * 0.9).toFixed(3)})`);
      gp.addColorStop(0.3, `rgba(61,255,143,${(pulseOp * 0.6).toFixed(3)})`);
      gp.addColorStop(1,   'rgba(61,255,143,0)');
      strokePath(pts);
      ctx.strokeStyle = gp;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }
  }

  // ── pulse rings ───────────────────────────────────────────────
  let lT = 0;
  function pulseRings(id, t, offset, active) {
    const ra = document.getElementById('ctPr' + id + 'a');
    const rb = document.getElementById('ctPr' + id + 'b');
    if (!ra) return;
    if (!active) {
      [ra, rb].forEach(r => { r.style.border = '1px solid rgba(61,255,143,0)'; r.style.transform = 'scale(1)'; });
      return;
    }
    const per = 3.0;
    const pa  = ((t + offset) / per) % 1,   pb = ((t + offset) / per + 0.5) % 1;
    const sa  = lp(1.0, 1.32, eo5(pa)),     oa = lp(0.28, 0, Math.pow(pa, 0.5));
    const sb  = lp(1.0, 1.32, eo5(pb)),     ob = lp(0.28, 0, Math.pow(pb, 0.5));
    ra.style.border    = `1px solid rgba(61,255,143,${oa.toFixed(3)})`;
    ra.style.transform = `scale(${sa.toFixed(3)})`;
    rb.style.border    = `1px solid rgba(61,255,143,${ob.toFixed(3)})`;
    rb.style.transform = `scale(${sb.toFixed(3)})`;
  }

  // ── scroll progress proxy ─────────────────────────────────────
  const state = { p: 0 };   // driven by ScrollTrigger onUpdate

  // ── rAF loop — reads state.p ──────────────────────────────────
  let loopRafId = null;

  function startLoop() {
    if (!loopRafId) loopRafId = requestAnimationFrame(loop);
  }
  function stopLoop() {
    if (loopRafId) { cancelAnimationFrame(loopRafId); loopRafId = null; }
  }

  function loop(ts) {
    loopRafId = null;
    if (loop.last) lT += (ts - loop.last) * .001;
    loop.last = ts;

    const p   = state.p;
    const lyt = getLayout();
    positionItems(lyt);

    // ── breakpoints per spec ────────────────────────────────
    // p 0.00→0.08  icon 1 appears
    const i1dot   = cl((p - .00) / .08, 0, 1);
    // p 0.08→0.16  label 1 appears
    const i1label = cl((p - .08) / .08, 0, 1);
    // p 0.16→0.32  icon 1 flies into place
    const i1move  = cl((p - .16) / .16, 0, 1);

    // p 0.26→0.66  the snake line draws
    const lineDraw = cl((p - .26) / .40, 0, 1);
    const wormOn   = cl((p - .26) / .34, 0, 1);

    // p 0.30→0.38  icon 2 appears
    const i2dot   = cl((p - .30) / .08, 0, 1);
    // p 0.38→0.46  label 2 appears
    const i2label = cl((p - .38) / .08, 0, 1);
    // p 0.46→0.60  icon 2 flies into place
    const i2move  = cl((p - .46) / .14, 0, 1);

    // p 0.52→0.60  icon 3 appears
    const i3dot   = cl((p - .52) / .08, 0, 1);
    // p 0.60→0.68  label 3 appears
    const i3label = cl((p - .60) / .08, 0, 1);
    // p 0.68→0.82  icon 3 flies into place
    const i3move  = cl((p - .68) / .14, 0, 1);

    const wormOff  = cl((p - .84) / .10, 0, 1);
    const worm     = wormOn * (1 - eio(wormOff));

    const allSettled = i1move > .95 && i2move > .95 && i3move > .95;
    const pulsePos   = allSettled ? ((lT / 2.4) % 1) : 0;
    const pulseOp    = allSettled ? eo3(cl((p - .80) / .10, 0, 1)) * 0.8 : 0;

    // ── finale: p 0.82→0.84 light → p 0.84→0.94 heading → p 0.88→0.98 descriptions → p 0.93→1.0 button → bottom
    const glowP   = cl((p - .82) / .02, 0, 1);
    const headP   = cl((p - .84) / .10, 0, 1);
    const descP   = eo3(cl((p - .88) / .10, 0, 1));
    const ctaP    = cl((p - .93) / .07, 0, 1);
    // section bottom (avail-row) — appears after the button
    const availP  = eo3(cl((p - .96) / .04, 0, 1));

    // background light
    document.querySelector('.ct-bg-glow')?.classList.toggle('show', glowP > 0.1);

    // heading
    const ctHead = document.getElementById('ctHead');
    if (ctHead) {
      ctHead.style.opacity   = headP.toFixed(3);
      ctHead.style.transform = `translateY(${lp(-14, 0, eo3(headP)).toFixed(2)}px)`;
    }
    // descriptions under the icons
    ['ctDesc1','ctDesc2','ctDesc3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = descP.toFixed(3);
    });
    // button
    const ctCta = document.getElementById('ctCta');
    if (ctCta) {
      ctCta.style.opacity   = ctaP.toFixed(3);
      ctCta.style.transform = `translateY(${lp(12, 0, eo3(ctaP)).toFixed(2)}px)`;
    }
    // availability row — section bottom
    const ctAvail = document.getElementById('ctAvailRow');
    if (ctAvail) {
      ctAvail.style.opacity   = availP.toFixed(3);
      ctAvail.style.transform = `translateY(${lp(10, 0, availP).toFixed(2)}px)`;
    }

    // ── canvas ───────────────────────────────────────────────────
    const pts = snakePoints(worm, lT, lyt);
    drawCanvas(pts, lineDraw, pulsePos, pulseOp, lyt);

    // ── item 1 ───────────────────────────────────────────────────
    const s1 = document.getElementById('ctS1');
    if (s1) {
      if (isMobile()) { s1.style.left = ''; s1.style.transform = ''; }
      else {
        s1.style.opacity   = i1dot;
        s1.style.left      = lp(lyt.cx, lyt.s1.x, eo3(i1move)) + 'px';
        s1.style.transform = `translateX(-50%) scale(${lp(1.65, 1.0, eo3(i1move)).toFixed(3)})`;
      }
    }
    document.getElementById('ctD1')?.classList.toggle('lit', i1move > .92);
    pulseRings('1', lT, 0, allSettled);
    // label 1 (num + title) appears separately
    ['ctNum1','ctTitle1'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = i1label.toFixed(3);
    });

    // ── item 2 ───────────────────────────────────────────────────
    const s2 = document.getElementById('ctS2');
    if (s2) {
      if (isMobile()) { s2.style.left = ''; s2.style.transform = ''; }
      else {
        s2.style.opacity   = i2dot;
        s2.style.left      = lp(lyt.cx, lyt.s2.x, eo3(i2move)) + 'px';
        s2.style.transform = `translateX(-50%) scale(${lp(1.65, 1.0, eo3(i2move)).toFixed(3)})`;
      }
    }
    document.getElementById('ctD2')?.classList.toggle('lit', i2move > .92);
    pulseRings('2', lT, 0.9, allSettled);
    ['ctNum2','ctTitle2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = i2label.toFixed(3);
    });

    // ── item 3 ───────────────────────────────────────────────────
    const s3 = document.getElementById('ctS3');
    if (s3) {
      if (isMobile()) { s3.style.left = ''; s3.style.transform = ''; }
      else {
        s3.style.opacity   = i3dot;
        s3.style.left      = lp(lyt.cx, lyt.s3.x, eo3(i3move)) + 'px';
        s3.style.transform = `translateX(-50%) scale(${lp(1.65, 1.0, eo3(i3move)).toFixed(3)})`;
      }
    }
    document.getElementById('ctD3')?.classList.toggle('lit', i3move > .92);
    pulseRings('3', lT, 1.8, allSettled);
    ['ctNum3','ctTitle3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = i3label.toFixed(3);
    });

    loopRafId = requestAnimationFrame(loop);
  }

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      loop.last = null;
      startLoop();
    } else {
      stopLoop();
    }
  }, { threshold: 0 }).observe(document.getElementById('ctSticky') || section);

  // ── initial state ─────────────────────────────────────────────
  resize();
  measureCy(); // measure cy while elements are still in flow

  // ── CSS sticky scroll ────────────────────────────────────────
  const ctScroll = document.getElementById('ctScroll');

  const SCROLL_MULT = 1.4; // viewport height multiplier = scroll length

  function setScrollHeight() {
    if (!ctScroll) return;
    if (isMobile()) {
      ctScroll.style.height = '';
      return;
    }
    // ct-sticky is now min-height:100vh — its real height can exceed vh
    // Container height = sticky height + scroll distance (SCROLL_MULT * vh)
    const stickyH = ctScroll.querySelector('#ctSticky')?.offsetHeight || window.innerHeight;
    ctScroll.style.height = (stickyH + Math.round(window.innerHeight * SCROLL_MULT)) + 'px';
  }

  function readProgress() {
    if (!ctScroll) return;
    if (isMobile()) { state.p = 1; return; }
    const rect      = ctScroll.getBoundingClientRect();
    const scrolled  = -rect.top;                          // px scrolled within the section
    const total     = ctScroll.offsetHeight - window.innerHeight; // max scroll
    if (total <= 0) { state.p = 1; return; }
    state.p = Math.max(0, Math.min(1, scrolled / total));
  }

  // ── mobile init — show everything at once ──────────────────────
  function initMobile() {
    state.p = 1;
    ['ctHead','ctCta','ctAvailRow'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    ['ctDesc1','ctDesc2','ctDesc3','ctNum1','ctNum2','ctNum3',
     'ctTitle1','ctTitle2','ctTitle3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = '1';
    });
    ['ctS1','ctS2','ctS3'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.opacity   = '1';
      el.style.position  = 'relative';
      el.style.left      = '';
      el.style.top       = '';
      el.style.transform = 'none';
    });
    if (ctScroll) ctScroll.style.height = '';
  }

  // ── desktop init — hide and prepare the animation ───────────────
  function initDesktop() {
    const W0      = tlWrap.offsetWidth;
    const cx0     = W0 * .50;
    const topOff0 = (_cy || tlWrap.offsetHeight * 0.42) - 60;

    ['ctS1','ctS2','ctS3'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.position  = 'absolute';
      el.style.top       = topOff0 + 'px';
      el.style.left      = cx0 + 'px';
      el.style.transform = 'translateX(-50%) scale(1.65)';
      el.style.opacity   = '0';
    });

    ['ctNum1','ctTitle1','ctNum2','ctTitle2','ctNum3','ctTitle3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = '0';
    });

    const ctHeadEl = document.getElementById('ctHead');
    if (ctHeadEl) { ctHeadEl.style.opacity = '0'; ctHeadEl.style.transform = 'translateY(-14px)'; }
    const ctCtaEl = document.getElementById('ctCta');
    if (ctCtaEl)  { ctCtaEl.style.opacity  = '0'; ctCtaEl.style.transform  = 'translateY(12px)'; }
    ['ctDesc1','ctDesc2','ctDesc3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.opacity = '0';
    });
    const ctAvailEl = document.getElementById('ctAvailRow');
    if (ctAvailEl) { ctAvailEl.style.opacity = '0'; ctAvailEl.style.transform = 'translateY(10px)'; }

    setScrollHeight();
    readProgress();
  }

  // ── initial run ─────────────────────────────────────────
  requestAnimationFrame(() => {
    if (isMobile()) {
      initMobile();
    } else {
      initDesktop();
    }
  });

  // Read progress from scroll
  window.addEventListener('scroll', readProgress, { passive: true });
  readProgress();

  // ── single resize pattern / orientationchange / visibility ───
  let _ctLastMode = isMobile() ? 'mobile' : 'desktop';
  let _ctResizeTimer;

  function ctReinit() {
    const newMode = isMobile() ? 'mobile' : 'desktop';
    resize();
    measureCy();
    if (newMode !== _ctLastMode) {
      _ctLastMode = newMode;
      if (newMode === 'mobile') initMobile();
      else initDesktop();
    } else {
      setScrollHeight();
      readProgress();
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(_ctResizeTimer);
    _ctResizeTimer = setTimeout(ctReinit, 150);
  }, { passive: true });

  window.addEventListener('orientationchange', () => {
    setTimeout(ctReinit, 400);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { setScrollHeight(); readProgress(); }
  });

})();

// ── Deferred refresh for remaining ScrollTrigger instances (skills etc.) ──
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => { ScrollTrigger.refresh(); }, 100);
  });
});

(function () {
  const pick = document.getElementById('cvPick');
  const btn  = document.getElementById('cvPickBtn');
  const menu = document.getElementById('cvPickMenu');
  if (!pick || !btn || !menu) return;
  const items = Array.from(menu.querySelectorAll('a'));

  function setOpen(open, focusFirst) {
    pick.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open && focusFirst) items[0].focus();
  }

  btn.addEventListener('click', () => setOpen(!pick.classList.contains('is-open'), false));
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true, true); }
  });
  menu.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  items.forEach(a => a.addEventListener('click', () => setOpen(false, false)));
  document.addEventListener('click', e => { if (!pick.contains(e.target)) setOpen(false, false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pick.classList.contains('is-open')) { setOpen(false, false); btn.focus(); }
  });
  pick.addEventListener('focusout', e => { if (!pick.contains(e.relatedTarget)) setOpen(false, false); });
})();
