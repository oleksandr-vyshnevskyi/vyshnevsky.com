(function (root) {
  const SITE_URL = 'https://vyshnevsky.com';

  const asset = src => {
    if (!src || /^([a-z]+:)?\/\//i.test(src) || src.startsWith('/') || src.startsWith('data:')) return src;
    return '/' + src;
  };

  const projectPath = p => `/projects/${p.slug}/`;
  const projectUrl = p => SITE_URL + projectPath(p);

  const hasLive = p => p.liveUrl && p.liveUrl !== '#';

  const arrowRight = '<span class="btn__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
  const arrowLeft = '<span class="btn__icon btn__icon--left"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></span>';
  const arrowUpRight = '<span class="btn__icon btn__icon--up-right"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></span>';
  const star = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  function heroMeta(p) {
    const ctx = [p.country, p.year].filter(Boolean);
    return (p.type ? `<span class="pd-badge-type">${p.type}</span>` : '') +
      (ctx.length ? `<span class="pd-badge-context">${ctx.join(' · ')}</span>` : '');
  }

  function heroActions(p) {
    let html = '';
    if (hasLive(p)) {
      html += `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="pd-hero-btn btn btn--primary">View Demo ${arrowUpRight}</a>`;
    }
    html += `<a href="/?section=contact" class="pd-hero-btn btn btn--secondary">Start a Similar Project ${arrowRight}</a>`;
    return html;
  }

  function left(p) {
    let html = '';
    if (p.deliverables && p.deliverables.length) {
      html += '<div class="pd-section-label">What I Did</div><ul class="pd-deliverables">';
      p.deliverables.forEach((d, i) => {
        html += `<li class="pd-del-item"><span class="pd-del-text">${d}</span><span class="pd-del-num">${String(i + 1).padStart(2, '0')}</span></li>`;
      });
      html += '</ul>';
    }
    if (p.review) {
      const r = p.review;
      const stars = r.stars ? `<div class="pd-review-stars" aria-label="${r.stars} out of 5 stars">${star.repeat(r.stars)}</div>` : '';
      const platform = r.platform ? `<span class="pd-review-platform pd-review-platform--${r.platform.toLowerCase()}">${r.platform}</span>` : '';
      const location = r.country ? `<span class="pd-review-location">${r.country}</span>` : '';
      const initials = r.initials || (r.author ? r.author.slice(0, 2).toUpperCase() : '?');
      html += `<div class="pd-review">${stars}<blockquote class="pd-review-quote">"${r.text}"</blockquote><div class="pd-review-footer"><div class="pd-review-avatar">${initials}</div><div class="pd-review-meta"><div class="pd-review-author">${r.author}</div><div class="pd-review-tags">${location}${platform}</div></div></div></div>`;
    }
    return html;
  }

  function sidebar(p) {
    let html = '';
    if (hasLive(p)) {
      html += `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="pd-live-banner"><span class="pd-live-banner-label">View Demo</span><span class="pd-live-banner-arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg></span></a>`;
    }
    html += `<div class="pd-sidebar-box"><div class="pd-sb-head">Get in touch</div><div class="pd-sb-body"><div class="pd-sb-cta"><a href="/?section=contact" class="pd-sb-btn btn btn--primary btn--s">Start a Similar Project ${arrowRight}</a><a href="/projects/" class="pd-sb-btn btn btn--secondary btn--s btn--icon-left">${arrowLeft} All Projects</a></div></div></div>`;
    const fields = [
      p.type && { label: 'Project Type', val: p.type, accent: true },
      p.year && { label: 'Year', val: p.year },
      p.country && { label: 'Country', val: p.country },
      p.client && { label: 'Client', val: p.client },
      p.platform && { label: 'Platform', val: p.platform },
    ].filter(Boolean);
    if (fields.length) {
      html += '<div class="pd-sidebar-box"><div class="pd-sb-head">Project Info</div><div class="pd-sb-body">';
      fields.forEach(f => {
        html += `<div class="pd-sb-field"><div class="pd-sb-field-label">${f.label}</div><div class="pd-sb-field-val${f.accent ? ' accent' : ''}">${f.val}</div></div>`;
      });
      if (p.stack && p.stack.length) {
        html += `<div class="pd-sb-field"><div class="pd-sb-field-label">Tech Stack</div><div class="pd-sb-field-chips">${p.stack.map(t => `<span class="pd-sb-chip">${t}</span>`).join('')}</div></div>`;
      }
      html += '</div></div>';
    }
    return html;
  }

  function media(p) {
    const list = [];
    if (p.image) list.push({ type: 'image', src: p.image });
    (p.gallery || []).forEach(m => list.push(m));
    return list.map(m => ({ type: m.type, src: asset(m.src) }));
  }

  function galleryCount(p) {
    const n = media(p).length;
    return `${n} ${n === 1 ? 'image' : 'images'}`;
  }

  function gallery(p) {
    const list = media(p);
    return list.map((m, i) => {
      const el = m.type === 'video'
        ? `<video src="${m.src}" muted loop preload="metadata" playsinline></video>`
        : `<img src="${m.src}" alt="${p.title} — ${i + 1}" loading="lazy">`;
      return `<div class="pd-gal-item${m.type === 'video' ? ' is-video' : ''}" role="button" tabindex="0" data-index="${i}" aria-label="Open image ${i + 1} of ${list.length}">${el}<div class="pd-gal-overlay"></div><span class="pd-gal-num">${String(i + 1).padStart(2, '0')}</span></div>`;
    }).join('');
  }

  function navCard(p, isNext) {
    const dir = isNext
      ? 'Next <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> Previous';
    return `<a class="pd-nav-card${isNext ? ' is-next' : ''}" href="${projectPath(p)}"><div class="pd-nav-card-bg" style="${p.image ? `background-image:url(${asset(p.image)})` : ''}"></div><div class="pd-nav-card-overlay"></div><div class="pd-nav-card-body"${isNext ? ' style="text-align:right;"' : ''}><div class="pd-nav-dir"${isNext ? ' style="justify-content:flex-end;"' : ''}>${dir}</div><div class="pd-nav-title">${p.title}</div></div></a>`;
  }

  function nav(projects, p) {
    const i = projects.indexOf(p);
    const prev = projects[i - 1];
    const next = projects[i + 1];
    if (!prev && !next) return '';
    return (prev ? navCard(prev, false) : '<div></div>') + (next ? navCard(next, true) : '<div></div>');
  }

  root.ProjectRender = { SITE_URL, asset, projectPath, projectUrl, heroMeta, heroActions, left, sidebar, media, galleryCount, gallery, nav };
})(typeof window !== 'undefined' ? window : globalThis);
