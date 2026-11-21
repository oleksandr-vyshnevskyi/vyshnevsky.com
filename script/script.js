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
    gsap.set("#globeCanvas", { clearProps: "all" });
  } else {
    gsap.set("#globeCanvas", { opacity: 0 });
  }

  function startHeroAnim() {
    if (REDUCE_MOTION) return;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const heroStart = (fcp ? fcp.startTime : performance.now()) + 550;
    globeIntro.heroAt = heroStart;
    gsap.to("#globeCanvas", { opacity: 1, duration: 1.2, ease: "power2.out", delay: Math.max(0, (heroStart - performance.now()) / 1000) });
  }

  startHeroAnim();
})();

(function () {
  const about = document.getElementById('about');
  if (!about) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...about.querySelectorAll('.xp')];

  const scrollers = [...about.querySelectorAll('.xp-scroll')];
  const syncFade = el => {
    el.classList.toggle('can-up', el.scrollTop > 2);
    el.classList.toggle('can-down', el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  };
  scrollers.forEach(el => {
    el.addEventListener('scroll', () => syncFade(el), { passive: true });
    const cards = el.querySelectorAll('.xp-pj');
    if (cards.length > 3) {
      const lbl = el.parentElement.querySelector('.xp-col-lbl');
      if (lbl) lbl.insertAdjacentHTML('beforeend', `<span class="xp-col-cnt">${String(cards.length).padStart(2, '0')}</span>`);
    }
  });
  const syncAll = root => (root || about).querySelectorAll('.xp-scroll').forEach(syncFade);
  window.addEventListener('resize', () => syncAll(), { passive: true });

  items.forEach(item => {
    const head = item.querySelector('button.xp-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach(other => {
        if (other === item) return;
        other.classList.remove('is-open');
        const h = other.querySelector('button.xp-head');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) requestAnimationFrame(() => syncAll(item));
    });
  });

  const portrait = about.querySelector('.ab-portrait');
  if (portrait && !reduce) {
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      setTimeout(() => portrait.classList.add('is-lit'), 700);
    }, { threshold: .45 });
    io.observe(portrait);
  } else if (portrait) {
    portrait.classList.add('is-lit', 'no-anim');
  }

  if (reduce || !window.gsap) return;
  const intro = [about.querySelector('.ab-stag'), about.querySelector('.ab-title'), about.querySelector('.ab-bio'), about.querySelector('.ab-actions')].filter(Boolean);
  gsap.set(portrait, { opacity: 0, y: 40, scale: .97 });
  gsap.set(intro, { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: about.querySelector('.ab-top'),
    start: 'top 78%',
    once: true,
    onEnter() {
      gsap.to(portrait, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' });
      gsap.to(intro, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .1, delay: .1 });
    }
  });

  const path = about.querySelector('.ab-path');
  const rows = about.querySelectorAll('.ab-path-head, .xp');
  gsap.set(rows, { opacity: 0, y: 24 });
  ScrollTrigger.create({
    trigger: path,
    start: 'top 82%',
    once: true,
    onEnter() {
      gsap.to(rows, { opacity: 1, y: 0, duration: .7, ease: 'power3.out', stagger: .08, clearProps: 'transform' });
    }
  });
})();


/* Scroll progress, burger menu, clock, footer reveal — handled by common.js */

(function () {
  const stk = document.getElementById('stk');
  if (!stk) return;
  const chips = [...stk.querySelectorAll('.stk-chip')];
  const panel = document.getElementById('stkPanel');
  const techEl = document.getElementById('stkTech');
  const items = [...panel.querySelectorAll('.stk-item')];
  const panelHome = panel.parentNode;
  const narrow = window.matchMedia('(max-width: 1024px)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let current = chips.find(c => c.classList.contains('is-on')) || chips[0];

  function place() {
    if (narrow.matches) {
      const group = current.closest('.stk-g');
      if (panel.parentNode !== group) group.appendChild(panel);
    } else if (panel.parentNode !== panelHome) {
      panelHome.appendChild(panel);
    }
  }

  const list = panel.querySelector('.stk-items');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let swapTween = null;

  function apply(chip) {
    const used = chip.dataset.used.split(/\s+/);
    techEl.textContent = chip.textContent.trim();
    items.forEach(it => { it.hidden = !used.includes(it.dataset.key); });
    used.forEach((k, i) => { const it = items.find(x => x.dataset.key === k); if (it) it.style.order = i; });
    return items.filter(it => !it.hidden);
  }

  function select(chip, instant) {
    if (!chip || (chip === current && !instant)) return;
    current = chip;
    chips.forEach(c => {
      const on = c === chip;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    const moved = narrow.matches && panel.parentNode !== chip.closest('.stk-g');
    if (instant || reduce.matches || !window.gsap) { apply(chip); place(); return; }

    const visible = items.filter(it => !it.hidden);
    gsap.killTweensOf([list, techEl, ...items]);
    if (swapTween) swapTween.kill();

    const startH = moved ? 0 : list.offsetHeight;
    swapTween = gsap.to([techEl, ...visible], {
      opacity: 0, y: -8, duration: moved ? 0 : .14, ease: 'power1.in',
      onComplete() {
        const shown = apply(chip);
        place();
        gsap.set(shown, { opacity: 0, y: 14 });
        list.style.height = 'auto';
        const endH = list.offsetHeight;
        gsap.fromTo(list, { height: startH }, { height: endH, duration: .45, ease: 'power3.out', clearProps: 'height' });
        gsap.fromTo(techEl, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4, ease: 'power3.out' });
        gsap.to(shown, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .07, delay: .05 });
        panel.classList.remove('is-pulse');
        void panel.offsetWidth;
        panel.classList.add('is-pulse');
      }
    });
  }

  let hoverTimer = 0;
  chips.forEach(chip => {
    chip.addEventListener('click', () => { clearTimeout(hoverTimer); select(chip); });
    chip.addEventListener('focus', () => { if (fine.matches && chip.matches(':focus-visible')) select(chip); });
    chip.addEventListener('pointerenter', () => {
      if (!fine.matches || narrow.matches) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => select(chip), 220);
    });
    chip.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
  });
  narrow.addEventListener('change', place);
  select(current, true);

  const stag  = document.getElementById('skStag');
  const title = document.getElementById('skTitle');
  const sub   = document.getElementById('skSub');
  const groups = stk.querySelectorAll('.stk-g, .stk-legend');

  if (stag && title && sub) {
    gsap.set([stag, sub], { opacity: 0, y: 20 });
    gsap.set(title, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: '#skills',
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.to(stag,  { opacity: 1, y: 0, duration: .7, ease: 'power2.out' });
        gsap.to(title, { opacity: 1, y: 0, duration: .9, delay: .12, ease: 'power3.out' });
        gsap.to(sub,   { opacity: 1, y: 0, duration: .7, delay: .28, ease: 'power2.out' });
      }
    });
  }

  gsap.set([...groups, panelHome === panel.parentNode ? panel : null].filter(Boolean), { opacity: 0, y: 40 });
  ScrollTrigger.create({
    trigger: stk,
    start: 'top 82%',
    once: true,
    onEnter() {
      gsap.to(groups, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .08 });
      if (panel.parentNode === panelHome) gsap.to(panel, { opacity: 1, y: 0, duration: .8, delay: .2, ease: 'power3.out' });
    }
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



// ── Deferred refresh for remaining ScrollTrigger instances (skills etc.) ──
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => { ScrollTrigger.refresh(); }, 100);
  });
});

document.querySelectorAll('.cv-pick').forEach(pick => {
  const btn = pick.querySelector('.cv-pick__btn');
  const menu = pick.querySelector('.cv-pick__menu');
  if (!btn || !menu) return;
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
});

(function () {
  const section = document.getElementById('contact');
  const form = document.getElementById('ctxForm');
  if (!section || !form) return;
  const T = window.T || (s => s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const name = document.getElementById('cf-name');
  const email = document.getElementById('cf-email');
  const msg = document.getElementById('cf-msg');
  const send = document.getElementById('ctxSend');
  const sendErr = document.getElementById('ctxSendErr');
  const done = document.getElementById('ctxDone');
  const topics = Array.from(form.querySelectorAll('input[name="topic"]'));

  topics.forEach(r => r.addEventListener('change', () => {
    topics.forEach(x => x.closest('.ctx-topic').classList.toggle('is-on', x.checked));
    msg.placeholder = T(r.dataset.ph);
  }));
  const first = topics.find(r => r.checked);
  if (first) msg.placeholder = T(first.dataset.ph);

  const rules = [
    [name, v => v ? '' : T('Name is required')],
    [email, v => !v ? T('Email is required') : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : T('Enter a valid email address')],
    [msg, v => v.length >= 10 ? '' : T('Please write a short message')]
  ];

  function check(input, rule, show) {
    const err = rule(input.value.trim());
    const out = document.getElementById(input.id + '-err');
    if (show) {
      out.textContent = err;
      input.classList.toggle('is-invalid', !!err);
      input.setAttribute('aria-invalid', err ? 'true' : 'false');
    }
    return !err;
  }

  rules.forEach(([input, rule]) => {
    input.addEventListener('blur', () => { if (input.value.trim()) check(input, rule, true); });
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) check(input, rule, true); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    sendErr.classList.remove('is-visible');
    const ok = rules.map(([input, rule]) => check(input, rule, true));
    if (ok.includes(false)) {
      rules[ok.indexOf(false)][0].focus();
      return;
    }
    const topic = (topics.find(r => r.checked) || {}).value || 'Other';
    send.classList.add('is-loading');
    send.disabled = true;
    fetch('https://formspree.io/f/mpqneqjq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        topic,
        name: name.value.trim(),
        email: email.value.trim(),
        message: msg.value.trim(),
        _subject: `[${topic}] ${name.value.trim()}`,
        _gotcha: document.getElementById('cf-website').value
      })
    })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); showDone(); })
      .catch(() => sendErr.classList.add('is-visible'))
      .finally(() => { send.classList.remove('is-loading'); send.disabled = false; });
  });

  function showDone() {
    const reveal = () => {
      form.hidden = true;
      done.hidden = false;
      if (window.gsap && !reduce) gsap.fromTo(done, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out' });
    };
    if (window.gsap && !reduce) gsap.to(form, { opacity: 0, y: -10, duration: .25, ease: 'power1.in', onComplete: reveal });
    else reveal();
  }

  const copy = document.getElementById('ctxCopy');
  if (copy) copy.addEventListener('click', () => {
    const text = copy.dataset.copy;
    const ok = () => { copy.classList.add('is-done'); setTimeout(() => copy.classList.remove('is-done'), 1600); };
    const fallback = () => {
      const t = document.createElement('textarea');
      t.value = text;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { if (document.execCommand('copy')) ok(); } catch (err) {}
      t.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok).catch(fallback);
    else fallback();
  });

  const time = document.getElementById('ctTime');
  if (time) {
    const tick = () => { time.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', hour12: false }); };
    tick();
    setInterval(tick, 30000);
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  const head = section.querySelectorAll('.ctx-stag, .ctx-title, .ctx-sub');
  const body = section.querySelectorAll('.ctx-form, .ctx-side');
  gsap.set([...head, ...body], { opacity: 0, y: 30 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 78%',
    once: true,
    onEnter() {
      gsap.to(head, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .08 });
      gsap.to(body, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .12, delay: .2, clearProps: 'transform' });
    }
  });
})();
