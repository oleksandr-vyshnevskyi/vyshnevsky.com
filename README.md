# vyshnevsky.com — Portfolio

Personal portfolio of **Oleksandr Vyshnevskyi**, Front-End Developer.

Live site: [vyshnevsky.com](https://vyshnevsky.com)

## Stack

HTML · CSS · JavaScript · GSAP (self-hosted) · Three.js · Formspree

## Structure

```
/
├── index.html              # Main page (Hero, About, Skills, Projects, Reviews, Contact)
├── projects/
│   ├── index.html          # All projects grid
│   └── <slug>/index.html   # Generated project pages (not committed)
├── templates/
│   └── project.html        # Template for generated project pages
├── tools/
│   └── build-projects.mjs  # Generates project pages, redirects and sitemap.xml
├── projects.html           # Generated redirect to /projects/
├── project-detail.html     # Generated redirect from old ?id=N links
├── 404.html                # Custom error page
├── CNAME                   # Custom domain for GitHub Pages
├── sitemap.xml
├── robots.txt
├── fonts/                  # Self-hosted Syne + Inter (woff2, latin)
├── styles/
│   ├── fonts.css           # @font-face for /fonts
│   ├── style.css           # Global styles + tokens (colours, z-index, breakpoints)
│   ├── projects.css
│   └── project-detail.css
├── script/
│   ├── vendor/             # GSAP + ScrollTrigger 3.12.5 (no CDN dependency)
│   ├── common.js           # Shared on every page: clock, burger, progress bar, footer reveal
│   ├── script.js           # Home page animations & interactions
│   ├── projects.js         # Projects grid logic
│   ├── project-detail.js   # Single project page logic
│   ├── project-render.js   # Project page markup, shared by the browser and the build
│   ├── projects-data.js    # All project data (single source of truth)
│   ├── transition.js       # Page transitions + shared scroll lock
│   └── globe.js            # Three.js hero globe (home only)
├── images/                 # WebP images, videos, favicons
└── cv/
    ├── cv.pdf
    └── cv-pl.pdf
```

## Local development

Project pages (`/projects/<slug>/`) are generated from `script/projects-data.js` and `templates/project.html`. Build them, then start a static server that supports clean URLs:

```bash
npm run dev
# same as: node tools/build-projects.mjs && npx serve .
```

`npm run build` regenerates the project pages, `project-detail.html`, `projects.html` and `sitemap.xml`. Generated pages are not committed: GitHub Actions builds them on every push.

## Deployment

Hosted on **GitHub Pages** with a custom domain.

DNS records at the registrar:
| Type  | Name | Value                   |
|-------|------|-------------------------|
| A     | @    | 185.199.108.153         |
| A     | @    | 185.199.109.153         |
| A     | @    | 185.199.110.153         |
| A     | @    | 185.199.111.153         |
| CNAME | www  | oleksandr-vyshnevskyi.github.io  |

> Replace `oleksandr-vyshnevskyi` with your actual GitHub username.

GitHub Pages settings: **Source → GitHub Actions** (workflow `.github/workflows/static.yml` builds project pages and deploys)  
Enable **"Enforce HTTPS"** after the domain propagates (~10–30 min).

## Contact form

Powered by [Formspree](https://formspree.io) — no backend required.

## Conventions

- **Script order on every page:** `vendor/gsap` → `vendor/ScrollTrigger` → `transition.js` → `common.js` → page script.
- **Shared UI logic lives in `common.js`** — don't copy nav/footer/clock scripts into pages.
- **Scroll lock:** always `window.lockScroll()` / `window.unlockScroll()` (never `body.style.overflow`).
- **Colours:** use `var(--g)` / `var(--ga-XX)` / `rgba(var(--g-rgb), a)` — no hard-coded green.
- **Layers:** use the `--z-*` scale from `:root`.
- **Breakpoints:** 390 · 640 · 768 · 900 · 1024 · 1100 · 1280 (JS mirror: `window.SITE.BP`).
- **Reduced motion:** check `window.SITE.REDUCE_MOTION` before adding decorative animation.
- **Project data:** edit only `script/projects-data.js`; home-page cards link by `id`.
- **Globe map data:** `data/geo/*.js` (world-atlas TopoJSON wrapped as JS so it works from `file://` too).
