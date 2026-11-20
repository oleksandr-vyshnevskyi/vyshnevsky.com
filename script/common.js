/* ═══════════════════════════════════════════════════════════════
   COMMON — shared by every page (index, projects, project-detail)
   Load order: gsap → ScrollTrigger → transition.js → common.js → page script

   Owns:
     • Local clock (nav, mobile menu, footer) + footer year
     • Scroll progress bar
     • Mobile burger menu
     • Inner-page nav state (always "scrolled" on non-home pages)
     • Footer entrance reveal
   Exposes: window.SITE = { REDUCE_MOTION, BP, isMobile() }
   ═══════════════════════════════════════════════════════════════ */

window.T = s => (window.I18N && window.I18N[s]) || s;
window.LANG = document.documentElement.lang === 'pl' ? 'pl' : 'en';
window.LANG_BASE = window.LANG === 'pl' ? '/pl' : '';

(function () {
  'use strict';

  /* ── Shared constants ─────────────────────────────────────────
     Breakpoints — keep in sync with the scale documented at the top of style.css */
  const BP = { xs: 390, sm: 640, md: 768, lg: 1024, xl: 1100 };
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.SITE = {
    BP,
    REDUCE_MOTION,
    /* "mobile layout" for the scroll-driven sections (about / projects / contact) */
    isMobile: () => window.innerWidth <= BP.lg,
  };

  const isHome = document.body.dataset.page === 'home';

  /* ── Clock + year ── */
  (function () {
    const ids = ['navTime', 'navTimeS', 'footTime', 'nmTime'];
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    const fmt = { timeZone: 'Europe/Warsaw', hour12: false };
    function tick() {
      const t = new Date().toLocaleTimeString('en-GB', fmt);
      els.forEach(el => { el.textContent = t; });
    }
    if (els.length) { tick(); setInterval(tick, 1000); }

    const year = String(new Date().getFullYear());
    const footYear = document.getElementById('footYear');
    if (footYear) footYear.textContent = year;
    const pgYears = document.getElementById('pgYears');
    if (pgYears) pgYears.textContent = '2022 — ' + year;
  })();

  /* ── Scroll progress bar ── */
  (function () {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    function update() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ── Inner pages: nav is always in its compact "scrolled" state ──
     (Home page manages the nav itself in script.js — hero ↔ scrolled.) */
  if (!isHome) {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.add('s');
  }

  /* ── Mobile burger menu ── */
  (function () {
    const burger = document.getElementById('navBurger');
    const menu   = document.getElementById('navMobile');
    if (!burger || !menu) return;

    const lock   = () => window.lockScroll && window.lockScroll();
    const unlock = () => window.unlockScroll && window.unlockScroll();
    const isOpen = () => menu.classList.contains('open');

    function setOpen(open) {
      if (open === isOpen()) return;
      burger.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.inert = !open; /* closed menu links are not focusable */
      open ? lock() : unlock();
    }

    burger.setAttribute('aria-expanded', 'false');
    menu.inert = true;
    burger.addEventListener('click', () => setOpen(!isOpen()));
    /* Tap on the backdrop, or on any link inside, closes the menu */
    menu.addEventListener('click', e => {
      if (e.target === menu || e.target.closest('a')) setOpen(false);
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    /* bfcache restore (Back/Forward) — make sure the menu is closed */
    window.addEventListener('pageshow', e => { if (e.persisted) setOpen(false); });
  })();

  /* ── Footer entrance ── */
  (function () {
    const footer = document.getElementById('footer');
    if (!footer) return;

    /* Reveal the sticky "curtain" footer only when the end of the page is
       within one screen (see style.css for why it starts hidden). */
    const content = document.querySelector('.page-content');
    if (content && 'IntersectionObserver' in window) {
      const sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      content.appendChild(sentinel);
      new IntersectionObserver(entries => {
        footer.classList.toggle('is-near', entries[0].isIntersecting);
      }, { rootMargin: '0px 0px 100% 0px' }).observe(sentinel);
    } else {
      footer.classList.add('is-near');
    }
    const els = footer.querySelectorAll('.foot-col, .foot-divider, .foot-bottom');
    const revealAll = () => els.forEach(el => el.classList.add('is-visible'));

    if (REDUCE_MOTION || !('IntersectionObserver' in window)) { revealAll(); return; }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    els.forEach(el => io.observe(el));
  })();
})();
