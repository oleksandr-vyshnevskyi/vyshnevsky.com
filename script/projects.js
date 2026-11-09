/* ─────────────────────────────────────────────
   DATA is in script/projects-data.js
   CONFIG
──────────────────────────────────────────────── */
const PER_PAGE = 6;

/* ─── STATE ─── */
let shown = 0;

/* Scroll progress, nav state, burger, clock — handled by common.js */

gsap.registerPlugin(ScrollTrigger);

/* ─── INIT ─── */
window.addEventListener('DOMContentLoaded', () => {
  // Total count in header
  const countEl = document.getElementById('pgTotalCount');
  if (countEl) countEl.textContent = `${PROJECTS.length} Projects`;

  renderCards(PER_PAGE);
});

/* ─────────────────────────────────────────────
   CARD RENDERING
──────────────────────────────────────────────── */
function renderCards(count) {
  const grid = document.getElementById('pgGrid');
  const end = Math.min(shown + count, PROJECTS.length);
  const newCards = [];

  for (let i = shown; i < end; i++) {
    const card = buildCard(PROJECTS[i], i);
    grid.appendChild(card);
    newCards.push(card);
  }

  shown = end;

  // Staggered entrance
  newCards.forEach((card, idx) => {
    setTimeout(() => {
      card.style.transition = `opacity .55s cubic-bezier(.16,1,.3,1) ${idx * 55}ms, transform .55s cubic-bezier(.16,1,.3,1) ${idx * 55}ms`;
      card.classList.add('visible');
    }, 30);
  });

  updateLoadBtn();
}

function buildCard(p, idx) {
  const card = document.createElement('a');
  card.className = 'pg-card';
  card.href = `/projects/${p.slug}/`;
  card.setAttribute('data-id', p.id);

  const mediaEl = p.image
    ? `<img class="pg-card-img" src="/${p.image.replace(/^\//, '')}" alt="${p.title}" loading="lazy">`
    : `<div class="pg-card-placeholder"><span class="pg-card-placeholder-ico">${p.title.charAt(0)}</span></div>`;

  const stackTags = (p.stack || []).slice(0, 3)
    .map(t => `<span class="pg-stack-tag">${t}</span>`).join('');

  card.innerHTML = `
    ${mediaEl}
    <span class="pg-card-num">${String(idx + 1).padStart(2, '0')}</span>
    ${p.type ? `<span class="pg-card-type">${p.type}</span>` : ''}
    <div class="pg-card-hover">
      <div class="pg-card-title">${p.title}</div>
      ${p.stack?.length ? `<div class="pg-card-stack">${stackTags}</div>` : ''}
      <span class="pg-card-cta btn btn--secondary btn--s">View Project <span class="btn__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></span>
    </div>
  `;

  /* Real <a href> — crawlable, middle-click/new-tab works; transition.js animates the navigation */
  return card;
}

/* ─── LOAD MORE + PROGRESS ─── */
function updateLoadBtn() {
  const wrap     = document.getElementById('pgLoadWrap');
  const bar      = document.getElementById('pgProgressBar');
  const label    = document.getElementById('pgProgressLabel');
  const pct      = Math.round((shown / PROJECTS.length) * 100);

  // Update progress bar
  if (bar)   bar.style.width = pct + '%';
  if (label) label.textContent = `${shown} of ${PROJECTS.length}`;

  // Hide button when all shown
  if (shown >= PROJECTS.length) {
    document.getElementById('pgLoadBtn').style.display = 'none';
  }
}

document.getElementById('pgLoadBtn').addEventListener('click', () => {
  const btn = document.getElementById('pgLoadBtn');
  btn.style.transform = 'scale(.97)';
  setTimeout(() => btn.style.transform = '', 180);
  renderCards(PER_PAGE);
});

/* ─────────────────────────────────────────────
   PAGE TRANSITION handled by transition.js
   ptNavigate() is available globally
──────────────────────────────────────────────── */
function navigateToProject(id) {
  const p = PROJECTS.find(x => x.id === id);
  window.ptNavigate(p ? `/projects/${p.slug}/` : '/projects/');
}
