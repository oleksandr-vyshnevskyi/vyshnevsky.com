const FEATURED = ['react-product-catalog', 'ad-aerospace', 'strata', 'qbl'];

const arrowRight = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const imgPath = p => '/' + p.image.replace(/^\//, '');
const smallPath = p => imgPath(p).replace(/\.webp$/, '-960.webp');
const projectHref = p => `${window.LANG_BASE}/projects/${p.slug}/`;

window.addEventListener('DOMContentLoaded', () => {
  const featured = FEATURED.map(s => PROJECTS.find(p => p.slug === s)).filter(Boolean);
  const other = PROJECTS.filter(p => !FEATURED.includes(p.slug))
    .sort((a, b) => (b.year || '').localeCompare(a.year || ''));

  const countEl = document.getElementById('pgTotalCount');
  if (countEl) countEl.textContent = `${PROJECTS.length} ${T('Projects')}`;
  document.getElementById('pgFeatCount').textContent = String(featured.length).padStart(2, '0');
  document.getElementById('pgOtherCount').textContent = String(other.length).padStart(2, '0');

  const grid = document.getElementById('pgGrid');
  featured.forEach((p, i) => grid.appendChild(buildCard(p, i)));

  const list = document.getElementById('pgList');
  other.forEach((p, i) => list.appendChild(buildRow(p, i)));

  const cards = grid.querySelectorAll('.pg-card');
  cards.forEach((card, idx) => {
    setTimeout(() => {
      card.style.transition = `opacity .55s cubic-bezier(.16,1,.3,1) ${idx * 70}ms, transform .55s cubic-bezier(.16,1,.3,1) ${idx * 70}ms`;
      card.classList.add('visible');
    }, 30);
  });

  initPreview(list);
});

function buildCard(p, idx) {
  const card = document.createElement('a');
  card.className = 'pg-card';
  card.href = projectHref(p);
  card.setAttribute('data-id', p.id);

  const media = p.image
    ? `<img class="pg-card-img" src="${imgPath(p)}" srcset="${smallPath(p)} 960w, ${imgPath(p)} 1920w" sizes="(max-width: 640px) 100vw, 50vw" alt="${p.title}" loading="${idx < 2 ? 'eager' : 'lazy'}">`
    : `<div class="pg-card-placeholder"><span class="pg-card-placeholder-ico">${p.title.charAt(0)}</span></div>`;

  const tags = (p.stack || []).slice(0, 4).map(t => `<span class="pg-stack-tag">${t}</span>`).join('');

  card.innerHTML = `
    <div class="pg-card-media">
      ${media}
      <span class="pg-card-num">${String(idx + 1).padStart(2, '0')}</span>
      <span class="pg-card-go btn__icon">${arrowRight}</span>
    </div>
    <div class="pg-card-info">
      <div class="pg-card-head">
        <h3 class="pg-card-title">${p.title}</h3>
        <span class="pg-card-year">${p.year || ''}</span>
      </div>
      ${p.type ? `<div class="pg-card-type">${p.type}</div>` : ''}
      ${tags ? `<div class="pg-card-stack">${tags}</div>` : ''}
    </div>
  `;
  return card;
}

function buildRow(p, idx) {
  const li = document.createElement('li');
  li.className = 'pg-row-item';
  li.innerHTML = `
    <a class="pg-row" href="${projectHref(p)}" data-img="${p.image ? smallPath(p) : ''}">
      <span class="pg-row-num">${String(idx + 1).padStart(2, '0')}</span>
      <span class="pg-row-title">${p.title}</span>
      <span class="pg-row-type">${p.type || ''}</span>
      <span class="pg-row-stack">${(p.stack || []).slice(0, 3).join(' · ')}</span>
      <span class="pg-row-year">${p.year || ''}</span>
      <span class="pg-row-go">${arrowRight}</span>
    </a>
  `;
  return li;
}

function initPreview(list) {
  const box = document.getElementById('pgPreview');
  const img = document.getElementById('pgPreviewImg');
  if (!box || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    box.style.transform = `translate(${cx}px, ${cy}px)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  list.addEventListener('pointermove', e => {
    x = e.clientX + 24;
    y = e.clientY - 90;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  list.querySelectorAll('.pg-row').forEach(row => {
    row.addEventListener('pointerenter', e => {
      const src = row.dataset.img;
      if (!src) return;
      if (!box.classList.contains('on')) {
        cx = x = e.clientX + 24;
        cy = y = e.clientY - 90;
        box.style.transform = `translate(${cx}px, ${cy}px)`;
      }
      img.src = src;
      box.classList.add('on');
    });
  });
  list.addEventListener('pointerleave', () => box.classList.remove('on'));
}
