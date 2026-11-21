/* ═══════════════════════════════════════════════
   PAGE TRANSITION  —  shared across all pages
   ═══════════════════════════════════════════════
   Automatically intercepts all internal <a> links
   and wraps navigation with a slide animation.

   Usage: include this script on every page,
   BEFORE any page-specific scripts.
   No configuration needed.
═══════════════════════════════════════════════ */

(function () {

  /* ── Create overlay element ── */
  let overlay = document.getElementById('ptOverlay');
  const preset = !!overlay;
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'pt-overlay';
    overlay.id = 'ptOverlay';
    document.body.appendChild(overlay);
  }

  function finishEnter() {
    overlay.classList.remove('pt-in');
    overlay.style.transform = 'translateY(100%)';
    handleSectionParam();
  }

  function adoptPresetOverlay() {
    const running = overlay.getAnimations && overlay.getAnimations().some(a => a.playState === 'running' || a.playState === 'pending');
    if (!running) { finishEnter(); return; }
    let done = false;
    const end = () => { if (done) return; done = true; finishEnter(); };
    overlay.addEventListener('animationend', end, { once: true });
    setTimeout(end, 900);
  }

  /* ── Play enter animation: overlay slides out upward ── */
  function playEnterAnimation() {
    // Reset state in case we came from bfcache
    overlay.classList.remove('pt-in', 'pt-out');
    overlay.style.transform = '';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('pt-in');
        overlay.addEventListener('animationend', () => {
          overlay.classList.remove('pt-in');
          overlay.style.transform = 'translateY(100%)';
          // After overlay is gone, handle deep-link scroll
          handleSectionParam();
        }, { once: true });
      });
    });
  }

  /* ── Handle ?section=NAME deep-link scroll ── */
  function handleSectionParam() {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (!section) return;

    // Clean URL immediately
    history.replaceState(null, '', window.location.pathname);

    const target = document.getElementById(section);
    if (!target) return;

    // For sections with a pin/sticky animation, scroll to the END of the
    // animation so the user lands on a fully-revealed section, not mid-animation.
    // Scroll container lookup: contact uses #ctScroll
    const scrollContainerMap = {
      contact: () => document.getElementById('ctScroll'),
    };

    const getContainer = scrollContainerMap[section];
    if (getContainer) {
      const container = getContainer();
      if (container) {
        const top = container.getBoundingClientRect().top + window.pageYOffset;
        // Scroll to the very end of the pin zone
        const scrollTarget = top + container.offsetHeight - window.innerHeight;
        window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'instant' });
        return;
      }
    }

    // Fallback: scroll to top of section
    const top = target.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }

  /* ── On page load: play enter animation ── */
  if (preset) adoptPresetOverlay();
  else window.addEventListener('DOMContentLoaded', playEnterAnimation);

  /* ── bfcache fix: browser restored page from cache ── */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      // Page was restored from bfcache — re-run enter animation
      playEnterAnimation();
    }
  });

  /* ── Navigate with transition ── */
  function navigateTo(href) {
    // Already animating — ignore
    if (overlay.classList.contains('pt-out')) return;

    overlay.style.transform = ''; // reset
    overlay.classList.add('pt-out');

    overlay.addEventListener('animationend', () => {
      window.location.href = href;
    }, { once: true });
  }

  /* ── Intercept all internal links ── */
  function isInternal(a) {
    if (!a || a.tagName !== 'A') return false;
    const href = a.getAttribute('href');
    if (!href) return false;
    // Skip: external, blank target, anchors only, mailto, tel, download
    if (a.target === '_blank') return false;
    if (a.hasAttribute('download')) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    // Pure anchor — check if it's a pin-section we should handle
    if (href.startsWith('#')) return PIN_SECTIONS.includes(href.slice(1));
    // External URL
    try {
      const url = new URL(href, window.location.href);
      if (url.hostname !== window.location.hostname) return false;
      return true;
    } catch {
      return false;
    }
  }

  /* ── Sections with pin animations — links to these scroll to end of pin ── */
  const PIN_SECTIONS = ['contact'];

  /* ── Rewrite cross-page anchor links to use ?section= ── */
  function rewriteHref(href) {
    try {
      const url = new URL(href, window.location.href);
      // Only rewrite same-hostname links that have a hash (cross-page anchors)
      if (url.hostname !== window.location.hostname) return href;
      if (!url.hash) return href;
      // e.g. index.html#contact  →  index.html?section=contact
      const sectionName = url.hash.slice(1); // strip '#'
      url.hash = '';
      url.searchParams.set('section', sectionName);
      return url.toString();
    } catch {
      return href;
    }
  }

  document.addEventListener('click', (e) => {
    // Walk up DOM tree in case click was on child element of <a>
    let target = e.target;
    while (target && target !== document) {
      if (target.tagName === 'A' && isInternal(target)) {
        const href = target.getAttribute('href');

        // Same-page pin section anchor (e.g. #about, #contact on index.html)
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const sectionName = href.slice(1);
          scrollToPinEnd(sectionName);
          return;
        }

        e.preventDefault();
        const rewritten = rewriteHref(target.href);
        navigateTo(rewritten);
        return;
      }
      target = target.parentElement;
    }
  });

  /* ── Scroll to end of pin section (same-page) ── */
  function scrollToPinEnd(sectionName) {
    const containerMap = {
      contact: () => document.getElementById('ctScroll'),
    };
    const getContainer = containerMap[sectionName];
    if (getContainer) {
      const container = getContainer();
      if (container) {
        const top = container.getBoundingClientRect().top + window.pageYOffset;
        const scrollTarget = top + container.offsetHeight - window.innerHeight;
        window.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' });
        return;
      }
    }
    // Fallback: scroll to section top
    const el = document.getElementById(sectionName);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Programmatic navigation helper (used by projects.js) ── */
  window.ptNavigate = navigateTo;

})();

/* ── Scroll lock — used by mobile nav & contact drawer ── */
(function () {
  var _locks = 0;

  window.lockScroll = function () {
    if (_locks++ > 0) return; /* already locked */
    var sb = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scroll-lock-sb', sb + 'px');
    document.body.classList.add('scroll-locked');
  };

  window.unlockScroll = function () {
    if (--_locks > 0) return; /* still locked by another caller */
    if (_locks < 0) _locks = 0;
    document.body.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scroll-lock-sb');
  };
})();

