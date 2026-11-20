import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { parse, visit, norm } from './i18n.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(ROOT, f), 'utf8');
const write = (f, s) => { mkdirSync(dirname(join(ROOT, f)), { recursive: true }); writeFileSync(join(ROOT, f), s); };
const CHECK = process.argv.includes('--check');

const ctx = { window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(read('script/projects-data.js') + '\nwindow.PROJECTS = PROJECTS;', ctx);
vm.runInContext(read('script/project-render.js'), ctx);
const PROJECTS = ctx.window.PROJECTS;
const R = ctx.window.ProjectRender;
const SITE = R.SITE_URL;

const PL = JSON.parse(read('i18n/pl.json'));
const PL_PROJECTS = JSON.parse(read('i18n/projects.pl.json'));
const PROJECTS_PL = JSON.parse(JSON.stringify(PROJECTS)).map(p => Object.assign(p, PL_PROJECTS[p.slug] || {}));

const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = s => String(s ?? '').replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

const seen = new Set();
for (const p of PROJECTS) {
  if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`Bad slug for project ${p.id}: ${p.slug}`);
  if (seen.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
  seen.add(p.slug);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  throw new Error('sharp is not installed: run "npm install" first');
}
const sources = new Set();
for (const p of PROJECTS) {
  if (p.image) sources.add(p.image);
  (p.gallery || []).forEach(m => { if (m.type !== 'video') sources.add(m.src); });
}
let made = 0;
for (const src of sources) {
  if (!R.srcset(src)) continue;
  const from = join(ROOT, src);
  const to = join(ROOT, R.smallSrc(src));
  if (!existsSync(from)) throw new Error(`Missing image: ${src}`);
  if (existsSync(to) && statSync(to).mtimeMs >= statSync(from).mtimeMs) continue;
  await sharp(from).resize({ width: R.SMALL, withoutEnlargement: true }).webp({ quality: 78 }).toFile(to);
  made++;
}

const missing = new Set();
const PAGE_PATH = /^\/(?:$|[?#]|projects(?:\/|$)|privacy(?:$|[?#/]))/;
const SKIP_URL = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/|\{\{)/i;
const URL_ATTRS = ['href', 'src', 'data-link', 'data-video', 'data-video-webm', 'data-poster'];

function localize(html, { dict, lang, url, prefix }) {
  const root = parse(html, { comment: true, blockTextElements: { script: true, style: true, noscript: true, pre: true } });
  const tr = k => {
    if (k in dict.html) return dict.html[k];
    if (dict.keep && dict.keep.includes(k)) return null;
    if (/[a-z]{3,}[ ,.][^<]*[a-z]{3,}/.test(k) && !/\{\{/.test(k)) missing.add(k);
    return null;
  };
  visit(root, {
    onText: (n, k) => { const v = tr(k); if (v != null) { const m = n.rawText.match(/^(\s*)[\s\S]*?(\s*)$/); n.rawText = m[1] + v + m[2]; } },
    onBlock: (n, k) => { const v = tr(k); if (v != null) n.set_content(v); },
    onAttr: (n, a, k) => { const v = tr(k); if (v != null) n.setAttribute(a, v); },
  });
  root.querySelector('html')?.setAttribute('lang', lang);
  for (const el of root.querySelectorAll('*')) {
    if (el.getAttribute('data-lang')) {
      if (el.getAttribute('data-lang') === lang) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
      continue;
    }
    for (const a of URL_ATTRS) {
      const v = el.getAttribute(a);
      if (!v || SKIP_URL.test(v)) continue;
      let nv = v.startsWith('/') ? v : '/' + v;
      if (PAGE_PATH.test(nv)) nv = prefix + nv;
      if (nv !== v) el.setAttribute(a, nv);
    }
  }
  const canonical = root.querySelector('link[rel="canonical"]');
  if (canonical && url) canonical.setAttribute('href', url);
  const ogUrl = root.querySelector('meta[property="og:url"]');
  if (ogUrl && url) ogUrl.setAttribute('content', url);
  root.querySelector('meta[property="og:locale"]')?.setAttribute('content', 'pl_PL');
  for (const s of root.querySelectorAll('script[src]')) {
    if (/projects-data\.js$/.test(s.getAttribute('src'))) s.setAttribute('src', '/script/projects-data.pl.js');
  }
  const firstScript = root.querySelector('body script[src]') || root.querySelector('head script[src]');
  const i18n = `<script>window.I18N=${JSON.stringify(dict.js).replace(/</g, '\\u003c')};</script>\n  `;
  let out = root.toString();
  if (firstScript) {
    const tag = firstScript.toString();
    const i = out.indexOf(tag);
    out = out.slice(0, i) + i18n + out.slice(i);
  }
  return out;
}

function projectPages({ lang, projects, template, outDir }) {
  ctx.window.LANG = lang;
  ctx.window.I18N = lang === 'pl' ? PL.js : undefined;
  for (const name of existsSync(join(ROOT, outDir)) ? readdirSync(join(ROOT, outDir), { withFileTypes: true }) : []) {
    if (name.isDirectory()) rmSync(join(ROOT, outDir, name.name), { recursive: true, force: true });
  }
  for (const p of projects) {
    const title = `${p.title} — Oleksandr Vyshnevskyi`;
    const fallback = lang === 'pl' ? `${p.title} — projekt Oleksandra Vyshnevskyiego, front-end developera.` : `${p.title} — project by Oleksandr Vyshnevskyi, front-end developer.`;
    const desc = clip(p.brief || fallback, 160);
    const url = R.projectUrl(p);
    const media = R.media(p);
    const jsonld = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: p.title,
      description: p.brief || desc,
      url,
      inLanguage: lang,
      image: p.image ? SITE + R.asset(p.image) : undefined,
      dateCreated: p.year,
      keywords: (p.stack || []).join(', ') || undefined,
      genre: p.type,
      author: { '@type': 'Person', name: 'Oleksandr Vyshnevskyi', url: SITE + '/' },
    };
    const values = {
      TITLE: attr(title),
      DESC: attr(desc),
      URL: attr(url),
      ID: String(p.id),
      PATH_EN: `/projects/${p.slug}/`,
      PATH_PL: `/pl/projects/${p.slug}/`,
      JSONLD: JSON.stringify(jsonld).replace(/</g, '\\u003c'),
      HERO_BG: p.image ? attr(`background-image:url(${R.bgSrc(p.image)})`) : '',
      HERO_META: R.heroMeta(p),
      HERO_TITLE: text(p.title),
      HERO_BRIEF: text(p.brief || ''),
      HERO_ACTIONS: R.heroActions(p),
      LEFT: R.left(p),
      SIDEBAR: R.sidebar(p),
      GALLERY_STYLE: media.length ? '' : 'display:none;',
      GALLERY_COUNT: media.length ? R.galleryCount(p) : '',
      GALLERY: R.gallery(p),
      NAV: R.nav(projects, p),
    };
    const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
      if (!(k in values)) throw new Error(`Unknown placeholder ${m}`);
      return values[k];
    });
    write(join(outDir, p.slug, 'index.html'), html);
  }
  ctx.window.LANG = 'en';
  ctx.window.I18N = undefined;
}

const template = read('templates/project.html');
projectPages({ lang: 'en', projects: PROJECTS, template, outDir: 'projects' });

rmSync(join(ROOT, 'pl'), { recursive: true, force: true });
const plTemplate = localize(template, { dict: PL, lang: 'pl', url: null, prefix: '/pl' });
projectPages({ lang: 'pl', projects: PROJECTS_PL, template: plTemplate, outDir: 'pl/projects' });

const STATIC = [
  { src: 'index.html', out: 'pl/index.html', path: '/' },
  { src: 'projects/index.html', out: 'pl/projects/index.html', path: '/projects/' },
  { src: 'privacy.html', out: 'pl/privacy.html', path: '/privacy' },
];
for (const page of STATIC) {
  write(page.out, localize(read(page.src), { dict: PL, lang: 'pl', url: `${SITE}/pl${page.path}`, prefix: '/pl' }));
}
write('script/projects-data.pl.js', `const PROJECTS = ${JSON.stringify(PROJECTS_PL, null, 1)};\n`);

const map = Object.fromEntries(PROJECTS.map(p => [p.id, p.slug]));
const redirect = (title, canonical, script) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, follow">
  <title>${title}</title>
  <link rel="canonical" href="${canonical}">
  <script>${script}</script>
  <noscript><meta http-equiv="refresh" content="0; url=/projects/"></noscript>
</head>
<body>
  <a href="/projects/">All projects</a>
</body>
</html>
`;
write('project-detail.html', redirect(
  'Project — Oleksandr Vyshnevskyi',
  `${SITE}/projects/`,
  `var m=${JSON.stringify(map)};var s=m[new URLSearchParams(location.search).get('id')];location.replace(s?'/projects/'+s+'/':'/projects/');`
));
write('projects.html', redirect(
  'Projects — Oleksandr Vyshnevskyi',
  `${SITE}/projects/`,
  `location.replace('/projects/'+location.hash);`
));

const today = new Date().toISOString().slice(0, 10);
const pages = [
  { path: '/', freq: 'monthly', pr: '1.0' },
  { path: '/projects/', freq: 'monthly', pr: '0.8' },
  ...PROJECTS.map(p => ({ path: `/projects/${p.slug}/`, freq: 'monthly', pr: '0.6' })),
  { path: '/privacy', freq: 'yearly', pr: '0.2' },
];
const alt = path => `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${path}"/>
    <xhtml:link rel="alternate" hreflang="pl" href="${SITE}/pl${path}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path}"/>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.flatMap(u => [`${SITE}${u.path}`, `${SITE}/pl${u.path}`].map(loc => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pr}</priority>
${alt(u.path)}
  </url>`)).join('\n')}
</urlset>
`);

console.log(`Built ${PROJECTS.length} project pages in EN and PL, Polish site pages and sitemap.xml; ${made} new ${R.SMALL}px images`);
if (missing.size) {
  console.log(`${missing.size} strings have no Polish translation in i18n/pl.json${CHECK ? ':' : ' (run with --check to list them)'}`);
  if (CHECK) for (const k of missing) console.log('  - ' + k);
}
