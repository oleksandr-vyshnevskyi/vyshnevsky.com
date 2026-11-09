import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(ROOT, f), 'utf8');

const ctx = { window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(read('script/projects-data.js') + '\nwindow.PROJECTS = PROJECTS;', ctx);
vm.runInContext(read('script/project-render.js'), ctx);
const PROJECTS = ctx.window.PROJECTS;
const R = ctx.window.ProjectRender;
const SITE = R.SITE_URL;

const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = s => String(s ?? '').replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

const seen = new Set();
for (const p of PROJECTS) {
  if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`Bad slug for project ${p.id}: ${p.slug}`);
  if (seen.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
  seen.add(p.slug);
}

const template = read('templates/project.html');
const outDir = join(ROOT, 'projects');
for (const name of readdirSync(outDir, { withFileTypes: true })) {
  if (name.isDirectory()) rmSync(join(outDir, name.name), { recursive: true, force: true });
}

for (const p of PROJECTS) {
  const title = `${p.title} — Oleksandr Vyshnevskyi`;
  const desc = clip(p.brief || `${p.title} — project by Oleksandr Vyshnevskyi, front-end developer.`, 160);
  const url = R.projectUrl(p);
  const media = R.media(p);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.title,
    description: p.brief || desc,
    url,
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
    JSONLD: JSON.stringify(jsonld).replace(/</g, '\\u003c'),
    HERO_BG: p.image ? attr(`background-image:url(${R.asset(p.image)})`) : '',
    HERO_META: R.heroMeta(p),
    HERO_TITLE: text(p.title),
    HERO_BRIEF: text(p.brief || ''),
    HERO_ACTIONS: R.heroActions(p),
    LEFT: R.left(p),
    SIDEBAR: R.sidebar(p),
    GALLERY_STYLE: media.length ? '' : 'display:none;',
    GALLERY_COUNT: media.length ? R.galleryCount(p) : '',
    GALLERY: R.gallery(p),
    NAV: R.nav(PROJECTS, p),
  };
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!(k in values)) throw new Error(`Unknown placeholder ${m}`);
    return values[k];
  });
  const dir = join(outDir, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

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
writeFileSync(join(ROOT, 'project-detail.html'), redirect(
  'Project — Oleksandr Vyshnevskyi',
  `${SITE}/projects/`,
  `var m=${JSON.stringify(map)};var s=m[new URLSearchParams(location.search).get('id')];location.replace(s?'/projects/'+s+'/':'/projects/');`
));
writeFileSync(join(ROOT, 'projects.html'), redirect(
  'Projects — Oleksandr Vyshnevskyi',
  `${SITE}/projects/`,
  `location.replace('/projects/'+location.hash);`
));

const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: `${SITE}/`, freq: 'monthly', pr: '1.0' },
  { loc: `${SITE}/projects/`, freq: 'monthly', pr: '0.8' },
  ...PROJECTS.map(p => ({ loc: R.projectUrl(p), freq: 'monthly', pr: '0.6' })),
  { loc: `${SITE}/privacy`, freq: 'yearly', pr: '0.2' },
];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pr}</priority>
  </url>`).join('\n')}
</urlset>
`);

console.log(`Built ${PROJECTS.length} project pages, project-detail.html, projects.html and sitemap.xml`);
