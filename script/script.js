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

(function () {
  const root  = document.getElementById('pjx');
  const list  = document.getElementById('pjxList');
  const stage = document.getElementById('pjxStage');
  if (!root || !list || !stage) return;

  const slides = Array.from(list.querySelectorAll('.pjx-slide'));
  const N = slides.length;
  if (!N) return;
  const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
  const data = slides.map((s, i) => ({
    ...s.dataset,
    n: txt(s, '.pjx-lab-n') || String(i + 1).padStart(2, '0'),
    name: txt(s, '.pjx-lab-name'),
    type: txt(s, '.pjx-lab-type'),
    year: txt(s, '.pjx-lab-year'),
    stack: txt(s, '.pjx-lab-stack'),
    cta: txt(s, '.pjx-lab-cta')
  }));

  const $ = id => document.getElementById(id);
  const curEl = $('pjxCur');
  const bars = Array.from($('pjxBar').children);
  const pad = n => String(n).padStart(2, '0');
  const mod = (a, n) => ((a % n) + n) % n;
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  $('pjxTot').textContent = pad(N);

  let active = 0;
  let gl = null;

  function paint(i) {
    curEl.textContent = pad(i + 1);
    bars.forEach((b, j) => b.classList.toggle('is-on', j === i));
    slides.forEach((s, j) => s.classList.toggle('is-active', j === i));
  }

  function setActive(i) {
    i = mod(i, N);
    if (i === active) return;
    active = i;
    paint(i);
    if (gl) gl.onActive(i);
  }

  function go(dir) {
    if (gl) { gl.step(dir); return; }
    scrollListTo(mod(active + dir, N));
  }

  $('pjxPrev').addEventListener('click', () => go(-1));
  $('pjxNext').addEventListener('click', () => go(1));
  bars.forEach((b, i) => b.addEventListener('click', () => (gl ? gl.goTo(i) : scrollListTo(i))));

  function scrollListTo(i, smooth = true) {
    const s = slides[i];
    list.scrollTo({ left: s.offsetLeft - (list.clientWidth - s.offsetWidth) / 2, behavior: smooth && !REDUCE_MOTION ? 'smooth' : 'auto' });
  }

  let listTm;
  list.addEventListener('scroll', () => {
    if (gl) return;
    clearTimeout(listTm);
    listTm = setTimeout(() => {
      const c = list.scrollLeft + list.clientWidth / 2;
      let best = 0, bd = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c);
        if (d < bd) { bd = d; best = i; }
      });
      setActive(best);
    }, 60);
  }, { passive: true });

  slides.forEach((s, i) => {
    const a = s.querySelector('.pjx-card');
    a.addEventListener('click', e => {
      if (gl) return;
      if (i !== active) {
        e.preventDefault();
        scrollListTo(i);
      }
    });
    a.addEventListener('focus', () => {
      if (!gl) return;
      gl.goTo(i);
      root.classList.toggle('is-kbd', a.matches(':focus-visible'));
    });
    a.addEventListener('blur', () => root.classList.remove('is-kbd'));
  });

  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); go(-1); }
  });

  paint(0);

  function canUseGL() {
    if (REDUCE_MOTION) return false;
    const c = navigator.connection;
    if (c && c.saveData) return false;
    if (navigator.deviceMemory && navigator.deviceMemory <= 1) return false;
    try {
      const cv = document.createElement('canvas');
      return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
    } catch (e) { return false; }
  }

  function withThree(cb) {
    if (window.THREE) { cb(); return; }
    let tag = document.querySelector('script[src$="three.min.js"]');
    if (!tag) {
      tag = document.createElement('script');
      tag.src = '/script/vendor/three/three.min.js';
      document.head.appendChild(tag);
    }
    tag.addEventListener('load', () => window.THREE && cb(), { once: true });
  }

  const boot = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    boot.disconnect();
    if (canUseGL()) withThree(() => { try { gl = createGL(); } catch (e) { gl = null; } });
  }, { rootMargin: '600px 0px' });
  boot.observe(root);

  function createGL() {
    const T = window.THREE;
    const ASPECT = 1.6;
    const CROP = new T.Vector4(0.117, 0.102, 0.883, 0.905);

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(40, 1, 1, 6000);

    const VS = `
      uniform float uHalfW, uFlat, uBend, uVel, uZMax;
      varying vec2 vUv;
      varying float vSide, vDir;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float s = wp.x < 0.0 ? -1.0 : 1.0;
        float e = max(abs(wp.x) - uFlat, 0.0);
        float R = uHalfW * 0.42 / max(uBend, 0.001);
        float a = min(e / R, 1.45);
        if (e > 0.0) {
          wp.x = s * (uFlat + R * sin(a));
          wp.z += min(R * (1.0 - cos(a)), uZMax);
        }
        wp.y += sin(uv.x * 3.14159) * clamp(uVel, -40.0, 40.0) * -0.5;
        vSide = clamp(e / (uHalfW * 0.55), 0.0, 1.0);
        vDir = s;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;

    const FS = `
      uniform sampler2D uPoster, uVideo, uLabel;
      uniform vec2 uPlane;
      uniform vec4 uCrop;
      uniform float uFocus, uRad, uVidMix, uVel, uHover;
      varying vec2 vUv;
      varying float vSide, vDir;
      vec2 mapUV(vec2 uv) {
        vec2 size = uCrop.zw - uCrop.xy;
        float cr = (size.x / size.y) * (16.0 / 9.0);
        float pr = uPlane.x / uPlane.y;
        vec2 k = pr > cr ? vec2(1.0, cr / pr) : vec2(pr / cr, 1.0);
        k *= 1.0 - 0.035 * uHover;
        return uCrop.xy + ((uv - 0.5) * k + 0.5) * size;
      }
      vec3 tex(vec2 uv) {
        uv = clamp(uv, 0.0, 1.0);
        vec2 m = mapUV(uv);
        vec3 c = texture2D(uPoster, m).rgb;
        if (uVidMix > 0.002) c = mix(c, texture2D(uVideo, m).rgb, uVidMix);
        vec4 l = texture2D(uLabel, uv);
        return mix(c, l.rgb, l.a);
      }
      float sdBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }
      void main() {
        float v = min(abs(uVel) * 0.0035, 0.14);
        float amt = vSide * 0.42 + v;
        float ca = vSide * 0.018 + v * 0.08;
        vec3 col;
        if (amt < 0.003) {
          col = tex(vUv);
        } else {
          col = vec3(0.0);
          for (int i = 0; i < 8; i++) {
            float t = float(i) / 7.0;
            vec2 u = vUv - vec2(vDir * amt * t * t, 0.0);
            col.r += tex(u + vec2(ca, 0.0)).r;
            col.g += tex(u).g;
            col.b += tex(u - vec2(ca, 0.0)).b;
          }
          col /= 8.0;
        }
        float g = dot(col, vec3(0.299, 0.587, 0.114));
        vec3 dim = mix(vec3(g), col, 0.6) * 0.62;
        col = mix(dim, col, uFocus);
        float outer = vDir > 0.0 ? vUv.x : 1.0 - vUv.x;
        vec3 rim = mix(vec3(0.24, 1.0, 0.56), vec3(0.2, 0.85, 1.0), vUv.y);
        float fy = 1.0 - smoothstep(0.0, 0.18, min(vUv.y, 1.0 - vUv.y));
        col += rim * smoothstep(0.35, 1.0, outer) * vSide * (0.25 + 0.55 * fy);
        vec2 p = (vUv - 0.5) * uPlane;
        float d = sdBox(p, uPlane * 0.5, uRad);
        float alpha = 1.0 - smoothstep(-1.0, 0.5, d);
        gl_FragColor = vec4(col, alpha);
      }`;

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'none';
    const useWebm = !!video.canPlayType('video/webm');
    const vTex = new T.VideoTexture(video);
    vTex.minFilter = T.LinearFilter;
    vTex.generateMipmaps = false;
    const blank = new T.DataTexture(new Uint8Array([7, 9, 10, 255]), 1, 1, T.RGBAFormat);
    blank.needsUpdate = true;
    const clear = new T.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, T.RGBAFormat);
    clear.needsUpdate = true;

    function label(d, big) {
      const W = 1280, H = 800, P = big ? 72 : 60, F = big ? 1.6 : 1;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      let g = x.createLinearGradient(0, 0, 0, 330);
      g.addColorStop(0, 'rgba(7,9,10,.94)');
      g.addColorStop(0.45, 'rgba(7,9,10,.78)');
      g.addColorStop(1, 'rgba(7,9,10,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, 330);
      g = x.createLinearGradient(0, H - 260, 0, H);
      g.addColorStop(0, 'rgba(7,9,10,0)');
      g.addColorStop(0.55, 'rgba(7,9,10,.8)');
      g.addColorStop(1, 'rgba(7,9,10,.94)');
      x.fillStyle = g; x.fillRect(0, H - 260, W, 260);
      x.textBaseline = 'alphabetic';
      x.fillStyle = '#3DFF8F';
      x.font = `500 ${26 * F}px Inter, sans-serif`;
      x.fillText(d.n, P, P + 22 * F);
      x.fillStyle = '#ffffff';
      x.font = `700 ${48 * F}px Syne, sans-serif`;
      x.fillText(d.name, P, P + 88 * F, W - P * 2);
      x.fillStyle = 'rgba(220,232,220,.82)';
      x.font = `400 ${30 * F}px Inter, sans-serif`;
      if (d.type && !big) x.fillText(d.type, P, P + 132);
      x.fillText(big ? d.year : [d.year, d.stack].filter(Boolean).join('   ·   '), P, H - P);
      x.fillStyle = '#3DFF8F';
      x.font = `500 ${30 * F}px Inter, sans-serif`;
      x.textAlign = 'right';
      if (d.cta) x.fillText(d.cta + '  →', W - P, H - P);
      const t = new T.CanvasTexture(c);
      t.minFilter = T.LinearFilter;
      t.generateMipmaps = false;
      return t;
    }

    const loader = new T.TextureLoader();
    let pending = N + 1;
    const done = () => { if (--pending === 0) ready(); };

    const meshes = data.map(d => {
      const u = {
        uPoster: { value: blank }, uVideo: { value: blank }, uLabel: { value: clear },
        uPlane: { value: new T.Vector2(1, 1) }, uCrop: { value: CROP },
        uFocus: { value: 0 }, uRad: { value: 18 }, uVidMix: { value: 0 }, uVel: { value: 0 }, uHover: { value: 0 },
        uHalfW: { value: 600 }, uFlat: { value: 300 }, uBend: { value: 1 }, uZMax: { value: 400 }
      };
      loader.load(d.poster, t => {
        t.minFilter = T.LinearFilter;
        t.generateMipmaps = false;
        u.uPoster.value = t;
        done();
      }, undefined, done);
      const m = new T.Mesh(new T.PlaneGeometry(1, 1, 48, 12), new T.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true }));
      m.userData = { u };
      scene.add(m);
      return m;
    });

    const fontsReady = document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load('700 48px Syne'), document.fonts.load('400 30px Inter'), document.fonts.load('500 30px Inter')]).catch(() => {})
      : Promise.resolve();
    let labelBig = null;
    function labels() {
      const big = stage.clientWidth < 768;
      if (big === labelBig) return;
      labelBig = big;
      meshes.forEach((m, i) => {
        const old = m.userData.u.uLabel.value;
        m.userData.u.uLabel.value = label(data[i], big);
        if (old !== clear) old.dispose();
      });
    }
    let fontsOk = false;
    Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))]).then(() => {
      fontsOk = true;
      labels();
      done();
    });

    let W = 0, H = 0, pw = 0, ph = 0, gap = 0, step = 1, total = 1;
    let target = 0, cur = 0, vel = 0, prevStep = 0;
    let visible = false, raf = 0, idleFrames = 0, hover = 0, hoverT = 0;

    function size() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H, false);
      cam.aspect = W / H;
      cam.position.z = (H / 2) / Math.tan(T.MathUtils.degToRad(cam.fov / 2));
      cam.updateProjectionMatrix();
      const mob = W < 768;
      pw = Math.min(mob ? W * 0.74 : W * 0.5, 760, H / 1.32 * ASPECT);
      ph = pw / ASPECT;
      gap = mob ? W * 0.04 : Math.max(W * 0.025, 24);
      step = pw + gap;
      total = step * N;
      meshes.forEach(m => {
        m.geometry.dispose();
        m.geometry = new T.PlaneGeometry(pw, ph, mob ? 32 : 48, 12);
        const u = m.userData.u;
        u.uPlane.value.set(pw, ph);
        u.uHalfW.value = W / 2;
        u.uFlat.value = pw / 2 + 1;
        u.uRad.value = mob ? 14 : 20;
        u.uZMax.value = cam.position.z * 0.72;
      });
      root.style.setProperty('--pjx-fw', pw + 'px');
      root.style.setProperty('--pjx-fh', ph + 'px');
      cur = target = Math.round(target / (prevStep || step)) * step;
      prevStep = step;
    }

    function ready() {
      size();
      stage.appendChild(renderer.domElement);
      root.classList.add('is-gl');
      size();
      kick();
      loadVideo(active, 0);
    }

    function snap() { target = Math.round(target / step) * step; kick(); }
    function goTo(i) {
      const ci = Math.round(target / step);
      let d = i - mod(ci, N);
      if (d > N / 2) d -= N;
      if (d < -N / 2) d += N;
      target = (ci + d) * step;
      kick();
    }

    let vTm, vFor = -1;
    function loadVideo(i, delay = 320) {
      clearTimeout(vTm);
      vTm = setTimeout(() => {
        const d = data[i];
        const src = useWebm && d.videoWebm ? d.videoWebm : d.video;
        if (!src) return;
        vFor = -1;
        video.pause();
        video.src = src;
        video.preload = 'auto';
        video.load();
        video.addEventListener('loadeddata', function onData() {
          video.removeEventListener('loadeddata', onData);
          if (i !== active) return;
          vFor = i;
          meshes.forEach((m, j) => { m.userData.u.uVideo.value = j === i ? vTex : blank; });
          if (visible) video.play().catch(() => {});
          kick();
        });
      }, delay);
    }

    function onActive(i) {
      vFor = -1;
      loadVideo(i);
    }


    let down = false, sx = 0, sy = 0, st0 = 0, moved = 0, lock = '', lastX = 0, lastT = 0, flick = 0;
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      down = true; lock = ''; moved = 0;
      sx = lastX = e.clientX; sy = e.clientY; st0 = target; lastT = performance.now(); flick = 0;
    });
    stage.addEventListener('pointermove', e => {
      if (!FINE || down) return;
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const on = Math.abs(x) <= pw / 2 && Math.abs(y) <= ph / 2;
      stage.classList.toggle('is-link', on);
      hoverT = on ? 1 : 0;
      kick();
    });
    stage.addEventListener('pointerleave', () => { hoverT = 0; stage.classList.remove('is-link'); kick(); });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!lock && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      if (lock === 'y') { down = false; snap(); return; }
      if (lock !== 'x') return;
      stage.classList.add('is-drag');
      hoverT = 0;
      moved = Math.max(moved, Math.abs(dx));
      const now = performance.now();
      flick = (e.clientX - lastX) / Math.max(now - lastT, 1);
      lastX = e.clientX; lastT = now;
      target = st0 - dx * (W < 768 ? 1.15 : 1.35);
      kick();
    }, { passive: true });
    function up(e) {
      if (!down) return;
      down = false;
      stage.classList.remove('is-drag');
      if (moved < 6 && lock !== 'y' && e && e.type === 'pointerup') {
        const r = stage.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        if (Math.abs(x) <= pw / 2) {
          if (Math.abs(y) <= ph / 2) {
            const link = data[active].link;
            if (link) (window.ptNavigate || (h => { location.href = h; }))(link);
          }
        } else go(x > 0 ? 1 : -1);
        return;
      }
      if (Math.abs(flick) > 0.35) {
        const base = Math.round(st0 / step) * step;
        const proj = Math.round(target / step) * step;
        target = proj === base ? base + (flick < 0 ? 1 : -1) * step : proj;
        kick();
      } else snap();
    }
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    let wheelTm;
    stage.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      e.preventDefault();
      target += e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      kick();
      clearTimeout(wheelTm);
      wheelTm = setTimeout(snap, 140);
    }, { passive: false });

    let lastF = 0;
    function frame(now) {
      raf = 0;
      const dt = lastF ? Math.min((now - lastF) / 16.667, 4) : 1;
      lastF = now;
      const k = 1 - Math.pow(1 - 0.085, dt);
      const prev = cur;
      cur += (target - cur) * k;
      if (Math.abs(target - cur) < 0.05) cur = target;
      vel += ((cur - prev) / dt - vel) * 0.25;
      hover += (hoverT - hover) * (1 - Math.pow(0.85, dt));
      const bend = 1 + Math.min(Math.abs(vel) * 0.02, 0.7);
      let busy = Math.abs(target - cur) > 0.05 || Math.abs(vel) > 0.02 || Math.abs(hoverT - hover) > 0.002;

      meshes.forEach((m, i) => {
        let x = i * step - cur;
        x = mod(x + total / 2, total) - total / 2;
        m.position.x = x;
        m.visible = Math.abs(x) < W / 2 + step;
        const u = m.userData.u;
        const f = Math.max(0, 1 - Math.abs(x) / step);
        const ft = f * f;
        u.uFocus.value += (ft - u.uFocus.value) * (1 - Math.pow(0.82, dt));
        u.uVel.value = vel;
        u.uBend.value = bend;
        u.uHover.value = i === active ? hover : 0;
        let mt = 0;
        if (i === vFor && i === active && video.readyState >= 2 && video.duration) {
          const t = video.currentTime;
          mt = t > 1.0 && t < video.duration - 0.6 ? 1 : 0;
        }
        u.uVidMix.value += (mt - u.uVidMix.value) * (1 - Math.pow(0.92, dt));
        if (Math.abs(ft - u.uFocus.value) > 0.002 || Math.abs(mt - u.uVidMix.value) > 0.002) busy = true;
      });

      const idx = mod(Math.round(cur / step), N);
      if (idx !== active) setActive(idx);

      renderer.render(scene, cam);
      const playing = vFor === active && !video.paused;
      idleFrames = busy || playing ? 0 : idleFrames + 1;
      if (visible && idleFrames < 3) raf = requestAnimationFrame(frame);
      else lastF = 0;
    }

    function kick() {
      if (!visible || raf) return;
      idleFrames = 0;
      raf = requestAnimationFrame(frame);
    }

    const vis = new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible) {
        if (vFor === active) video.play().catch(() => {});
        kick();
      } else video.pause();
    }, { threshold: 0.05 });
    vis.observe(root);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) video.pause();
      else if (visible && vFor === active) { video.play().catch(() => {}); kick(); }
    });
    video.addEventListener('playing', kick);

    let rTm;
    window.addEventListener('resize', () => {
      clearTimeout(rTm);
      rTm = setTimeout(() => { size(); if (fontsOk) labels(); kick(); }, 120);
    }, { passive: true });

    renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      video.pause();
      cancelAnimationFrame(raf);
      root.classList.remove('is-gl', 'is-kbd');
      gl = null;
      scrollListTo(active, false);
    });

    window.addEventListener('pageshow', e => {
      if (e.persisted && visible && vFor === active) video.play().catch(() => {});
    });

    return {
      step(dir) { target = Math.round(target / step) * step + dir * step; kick(); },
      goTo,
      onActive
    };
  }

  const head = document.querySelector('.pjx-head');
  if (!REDUCE_MOTION && window.gsap && window.ScrollTrigger) {
    const parts = [head, root, document.querySelector('.pjx-foot')];
    gsap.set(parts, { opacity: 0, y: 40 });
    ScrollTrigger.create({
      trigger: head,
      start: 'top 85%',
      once: true,
      onEnter() { gsap.to(parts, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .1 }); }
    });
  }
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
