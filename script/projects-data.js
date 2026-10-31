/* ═══════════════════════════════════════════════════════════════
   PROJECTS DATA  —  shared by projects.html & project-detail.html
   ═══════════════════════════════════════════════════════════════
   All fields are optional except id, title, type.
   Missing fields are simply not rendered — nothing breaks.

   Fields:
   ─────────────────────────────────────────────
   id          number      unique identifier
   title       string      project name
   type        string      "Landing" | "Business" | "E-commerce" | "Platform" | "Web App"
   stack       string[]    tech tags e.g. ["HTML", "CSS", "JavaScript"]
   year        string      e.g. "2024"
   country     string      e.g. "🇺🇸 United States"
   client      string      e.g. "Restaurant Business"
   platform    string      e.g. "Fiverr" | "UpWork" | "Direct"
   image       string      path to main image  e.g. "images/VRLounge.webp"
   gallery     object[]    extra media items:
                           { type: "image" | "video", src: "path/to/file" }
   brief       string      1–2 sentence task description
   deliverables string[]   what you did (bullet points)
   review      object      { text, author, initials, stars, platform, country }
                              stars: 1-5 (optional), platform: "Fiverr"|"UpWork"|"Direct"
                              initials: 2-char avatar e.g. "SK" (optional)
   liveUrl     string      demo URL — the delivered version hosted on GitHub Pages (omit or "#" to hide the "View Demo" button)
   ═══════════════════════════════════════════════════════════════ */

const PROJECTS = [

  {
    id: 17,
    title: "AD Aerospace",
    type: "Corporate Website · WordPress",
    stack: ["WordPress", "PHP", "JavaScript", "Three.js"],
    year: "2026",
    country: "United Kingdom",
    client: "AD Aerospace · Aircraft video surveillance systems",
    platform: "Fiverr",
    image: "images/ADAerospace.webp",
    gallery: [
      { type: "image", src: "images/ADAerospace1.webp" },
      { type: "image", src: "images/ADAerospace2.webp" },
      { type: "image", src: "images/ADAerospace3.webp" },
      { type: "image", src: "images/ADAerospace4.webp" },
      { type: "image", src: "images/ADAerospace5.webp" },
      { type: "image", src: "images/ADAerospace6.webp" },
      { type: "image", src: "images/ADAerospace7.webp" },
      { type: "image", src: "images/ADAerospace8.webp" },
      { type: "image", src: "images/ADAerospace9.webp" },
      { type: "image", src: "images/ADAerospace10.webp" },
      { type: "image", src: "images/ADAerospace11.webp" },
    ],
    brief: "A full redesign and custom WordPress build for AD Aerospace, a British manufacturer of aircraft video surveillance systems. The brief covered a new visual identity and information architecture, a product catalogue the client edits on their own, and a site in four languages.",
    deliverables: [
      "Design, UX and content architecture captured in an HTML/CSS/JS prototype",
      "Custom WordPress theme with custom post types for systems, LRUs, aircraft and documents",
      "Every page, product and document editable from the WordPress admin",
      "Interactive 3D viewer of the 4K camera (Three.js), loaded on scroll",
      "Aircraft hotspot map linking each point to its product range",
      "English, Chinese, Russian and Arabic with a full right-to-left layout",
      "WCAG 2.0 level A and PageSpeed optimisation"
    ],
    liveUrl: "https://ad-aero.com/"
  },

  {
    id: 18,
    title: "STRATA — 3D Watch Landing",
    type: "3D Product Landing Page",
    stack: ["Three.js", "GSAP", "JavaScript", "Vite"],
    year: "2026",
    client: "Concept project · Fictional watch brand",
    image: "images/Strata.webp",
    gallery: [
      { type: "image", src: "images/Strata1.webp" },
      { type: "image", src: "images/Strata2.webp" },
      { type: "image", src: "images/Strata3.webp" },
      { type: "image", src: "images/Strata4.webp" },
      { type: "image", src: "images/Strata5.webp" },
      { type: "image", src: "images/Strata6.webp" },
      { type: "image", src: "images/Strata7.webp" },
    ],
    brief: "A cinematic landing page for a fictional rugged field chronograph, told as a short film in five chapters: real-time WebGL, scroll-driven camera work, weather, sound and a live colour switcher on a single page.",
    deliverables: [
      "One continuous 3D scene driven by scroll through five chapters",
      "Real-time PBR watch whose hands show the visitor's local time",
      "Exploded view, macro dolly and live colour variants on the 3D model",
      "Ambient rain and thunder synthesised with the Web Audio API",
      "Works without WebGL and respects reduced-motion settings",
      "21 automated tests, including accessibility checks"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/Strata.github.io/"
  },

  {
    id: 19,
    title: "Shelf — React Product Catalog",
    type: "Web App · SPA",
    stack: ["React", "TypeScript", "Vite", "React Router"],
    year: "2026",
    client: "Personal project",
    image: "images/ProductCatalog.webp",
    gallery: [
      { type: "image", src: "images/ProductCatalog1.webp" },
      { type: "image", src: "images/ProductCatalog2.webp" },
      { type: "image", src: "images/ProductCatalog3.webp" },
      { type: "image", src: "images/ProductCatalog4.webp" },
      { type: "image", src: "images/ProductCatalog5.webp" },
    ],
    brief: "A single-page product catalog built with React and TypeScript: almost two hundred products from a public API, with search, category filters, product pages and a validated review form.",
    deliverables: [
      "TypeScript in strict mode, form types inferred from the Zod schema",
      "Reusable generic useFetch hook that cancels outdated requests",
      "Search by name and category filter with an empty state and reset",
      "Product pages with image gallery, discount, rating and stock",
      "Accessible review form with React Hook Form and Zod",
      "Responsive layout in CSS Modules, no UI libraries, deployed on Vercel"
    ],
    liveUrl: "https://react-product-catalog-ecru.vercel.app/"
  },

  {
    id: 1,
    title: "Nations On Fire",
    type: "Church / Event Landing Page",
    stack: ["HTML", "CSS", "JavaScript", "GSAP"],
    year: "2024",
    country: "Poland",
    client: "Christian Ministry · Nations On Fire",
    image: "images/NationsOnFire.webp",
    gallery: [
      { type: "image", src: "images/NationsOnFire1.webp" },
      { type: "image", src: "images/NationsOnFire2.webp" },
      { type: "image", src: "images/NationsOnFire3.webp" },
      { type: "image", src: "images/NationsOnFire4.webp" },
      { type: "image", src: "images/NationsOnFire9.webp" },
      { type: "image", src: "images/NationsOnFire5.webp" },
      { type: "image", src: "images/NationsOnFire6.webp" },
      { type: "image", src: "images/NationsOnFire7.webp" },
      { type: "image", src: "images/NationsOnFire8.webp" },
      { type: "image", src: "images/NationsOnFire10.webp" },
    ],
    brief: "A multi-page website for Nations On Fire — a Polish Christian missionary movement, featuring video hero, event listings, media gallery, and support/donation flow.",
    deliverables: [
      "Video background hero section",
      "Events listing page",
      "Media page",
      "Church/NOF info sections",
      "Support & donation CTA",
      "Responsive multi-page structure"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/Nations-On-Fire-git.io/"
  },

  {
    id: 2,
    title: "KAAS Kitchens",
    type: "Business Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "Kazakhstan",
    client: "Furniture & Kitchen Business",
    image: "images/KAAS.webp",
    gallery: [
      { type: "image", src: "images/KAAS8.webp" },
      { type: "image", src: "images/KAAS6.webp" },
      { type: "image", src: "images/KAAS4.webp" },
      { type: "image", src: "images/KAAS3.webp" },
      { type: "image", src: "images/KAAS5.webp" },
      { type: "image", src: "images/KAAS2.webp" },
      { type: "image", src: "images/KAAS1.webp" },
    ],
    brief: "A multi-page landing site for KAAS Kitchens — a Kazakhstan-based furniture company selling custom kitchens and wardrobes, with showroom locations and a callback form.",
    deliverables: [
      "Multi-page structure (kitchens, wardrobes, showrooms, about)",
      "Product catalogue UI",
      "Contact & consultation CTA",
      "Social media integration (WhatsApp, Instagram, TikTok)",
      "Responsive layout"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/KAAS.github.io/"
  },

  {
    id: 3,
    title: "HTP Group — IT Consulting",
    type: "Corporate Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "United States",
    client: "High Tech Pros Group Inc.",
    image: "images/HTP.webp",
    gallery: [
      { type: "image", src: "images/HTP1.webp" },
      { type: "image", src: "images/HTP2.webp" },
      { type: "image", src: "images/HTP5.webp" },
      { type: "image", src: "images/HTP4.webp" },
      { type: "image", src: "images/HTP3.webp" },
    ],
    brief: "A multi-page corporate website for HTP Group Inc. — a US IT staffing, offshore development, payrolling, and billing services company operating since 1997.",
    deliverables: [
      "Multi-page site (Home, Services, About, Contact)",
      "IT expertise & tech stack section",
      "Offshore development services",
      "Payrolling & billing services sections",
      "Phone CTA & LinkedIn integration"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/HTP.github.io/"
  },

  {
    id: 4,
    title: "CaseHug — CS2 Skin Platform",
    type: "Gaming / E-commerce Landing",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "Global",
    client: "CS2 Skin Trading Platform",
    image: "images/CaseHyg.webp",
    gallery: [
      { type: "image", src: "images/CaseHyg1.webp" },
      { type: "image", src: "images/CaseHyg2.webp" },
      { type: "image", src: "images/CaseHyg3.webp" },
      { type: "image", src: "images/CaseHyg4.webp" },
    ],
    brief: "A promo landing page for CaseHug — a CS2 skin case-opening and trading platform, featuring top skins, hot cases, daily rewards, and a partner team section.",
    deliverables: [
      "Hero with promo CTA (+20% bonus)",
      "Top skins & hot cases listings",
      "Daily cases reward section",
      "Official esports partner banner",
      "Live support & instant platform UI",
      "Steam login integration link"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/CaseHyg.github.io/"
  },

  {
    id: 5,
    title: "TaskFlow",
    type: "Web App",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    client: "Concept project",
    platform: "Personal",
    image: "images/TaskFlow.webp",
    gallery: [
      { type: "image", src: "images/TaskFlow4.webp" },
      { type: "image", src: "images/TaskFlow1.webp" },
      { type: "image", src: "images/TaskFlow2.webp" },
      { type: "image", src: "images/TaskFlow3.webp" },
    ],
    brief: "A fully functional AI-powered task manager web app with dashboard, projects, calendar, analytics, AI assistant (Anthropic API), and export — built in Polish.",
    deliverables: [
      "Dashboard with live stats",
      "AI task generation from description (Anthropic API)",
      "AI chat assistant",
      "Project & task management system",
      "Calendar & analytics views",
      "Weekly AI productivity report",
      "Data export"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/TaskFlow.github.io/"
  },

  {
    id: 6,
    title: "Restaurant Business",
    type: "Restaurant Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    client: "Concept project",
    platform: "Personal",
    image: "images/Restaurant.webp",
    gallery: [
      { type: "image", src: "images/Restaurant1.webp" },
      { type: "image", src: "images/Restaurant2.webp" },
      { type: "image", src: "images/Restaurant3.webp" },
      { type: "image", src: "images/Restaurant4.webp" },
    ],
    brief: "A Russian-language restaurant landing page featuring the brand story, food gallery, menu stats, and a table reservation CTA.",
    deliverables: [
      "Full-screen hero with reservation CTA",
      "Brand story section",
      "Dish gallery grid",
      "Menu stats (drinks, food, snacks)",
      "Table booking form",
      "Responsive design"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/Restaurant-Busienss.github.io/"
  },

  {
    id: 7,
    title: "Digital Journalism & CSA",
    type: "Editorial / Interactive Article",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "Europe",
    client: "Academic Project · Journalism",
    image: "images/SexualAssault.webp",
    gallery: [
      { type: "image", src: "images/SexualAssault2.webp" },
      { type: "image", src: "images/SexualAssault1.webp" },
      { type: "image", src: "images/SexualAssault3.webp" },
      { type: "image", src: "images/SexualAssault4.webp" }
    ],
    brief: "A long-form digital journalism project exploring ethics of reporting on child sexual assault, combining survivor storytelling, research, and trauma-informed UX.",
    deliverables: [
      "Long-form editorial layout",
      "Multi-section scroll navigation",
      "Survivor story presentation system",
      "Responsive typography & content hierarchy",
      "Data & research sections"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/SexualAssault.github.io/"
  },

  {
    id: 8,
    title: "Levantine Collective",
    type: "Editorial / Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "United Kingdom",
    client: "Cultural Creative Collective · London",
    image: "images/LevantineCollective.webp",
    gallery: [
      { type: "image", src: "images/LevantineCollective3.webp" },
      { type: "image", src: "images/LevantineCollective2.webp" },
      { type: "image", src: "images/LevantineCollective1.webp" },
      { type: "image", src: "images/LevantineCollective4.webp" },
    ],
    brief: "A cultural landing page for The Levantine Collective — a London-based creative community celebrating Levantine identity through art, story, and community, featuring an interactive quiz and video section.",
    deliverables: [
      "Brand-focused editorial UI",
      "Interactive cultural quiz",
      "Embedded video section (Tatreez)",
      "Responsive layout",
      "Multi-page navigation structure"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/LevantineCollective.github.io/"
  },

  {
    id: 9,
    title: "VR Lounge",
    type: "Landing Page",
    stack: ["HTML", "CSS", "JavaScript", "GSAP"],
    year: "2025",
    country: "United States",
    client: "VR Entertainment Business",
    platform: "Fiverr",
    image: "images/VRLounge.webp",
    gallery: [
      { type: "image", src: "images/VRLounge1.webp" },

    

    ],
    brief: "A conversion-focused landing page for a real VR lounge business, showcasing attractions with pricing, photo gallery, FAQ, and a waiver page.",
    deliverables: [
      "Hero section with animated CTA",
      "Attractions & pricing cards",
      "Real photo gallery",
      "FAQ accordion",
      "Waiver subpage",
      "Responsive layout"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/VRLounge2.github.io/"
  },

  {
    id: 10,
    title: "SwipeRoulette — Chat App",
    type: "Web App",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2024",
    country: "Global",
    client: "Social Chat App",
    image: "images/Chat0.webp",
    gallery: [
      { type: "image", src: "images/Chat1.webp" },
      { type: "image", src: "images/Chat2.webp" },
      { type: "image", src: "images/Chat3.webp" },
      { type: "image", src: "images/Chat4.webp" },

    ],
    brief: "A full-featured random chat web app UI — SwipeRoulette — with gender/region filters, subscription plans, user profiles, and an online counter.",
    deliverables: [
      "Chat interface with message list",
      "User profile & edit system",
      "Gender & region filter UI",
      "Subscription / pricing plans",
      "Authentication modals (Sign In / Register)"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/Chat.github.io/"
  },

  {
    id: 11,
    title: "Matrix Technology",
    type: "Business / Product Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2024",
    country: "Poland",
    client: "Matrix Technology · VR/5D Attractions",
    platform: "Direct",
    image: "images/Matrix.webp",
    gallery: [
      { type: "image", src: "images/Matrix1.webp" },
      { type: "image", src: "images/Matrix2.webp" },
      { type: "image", src: "images/Matrix3.webp" },
      { type: "image", src: "images/Matrix4.webp" },

    ],
    brief: "A corporate product website for Matrix Technology — a Polish company manufacturing VR and 5D attraction capsules for shopping malls, with a product catalogue, about section, and bilingual support (EN/PL).",
    deliverables: [
      "Video hero section",
      "Product catalogue (VR/5D capsules)",
      "Stats & brand growth counters",
      "Bilingual navigation (EN / PL)",
      "Contact page"
    ],
    liveUrl: "http://matrix.dreamerstudio.pl/"
  },

  {
    id: 12,
    title: "QBL — Industrial Storage Systems",
    type: "B2B Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2024",
    country: "Poland",
    client: "Industrial Equipment Manufacturer",
    image: "images/QBL.webp",
    gallery: [
      { type: "image", src: "images/QBL1.webp" },
      { type: "image", src: "images/QBL2.webp" },
      { type: "image", src: "images/QBL3.webp" },
      { type: "image", src: "images/QBL4.webp" },
      { type: "image", src: "images/QBL5.webp" },
      { type: "image", src: "images/QBL6.webp" },
      { type: "image", src: "images/QBL7.webp" },

    ],
    brief: "A multi-page B2B website for an industrial storage and shelving systems company, featuring a full product catalogue, references, technology, and advantages sections.",
    deliverables: [
      "Multi-page B2B structure",
      "Product catalogue (storage, drying, shop display systems)",
      "Full-width banner sections",
      "Bilingual support (EN / PL)",
      "Contact & login UI"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/QBL.github.io/"
  },

  {
    id: 13,
    title: "Dream Apart",
    type: "Apartment Booking Platform",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2024",
    country: "Poland",
    client: "Vacation Rental Platform",
    image: "images/DreamApart.webp",
    gallery: [
      { type: "image", src: "images/DreamApart1.webp" },
      { type: "image", src: "images/DreamApart2.webp" },
      { type: "image", src: "images/DreamApart3.webp" },
      { type: "image", src: "images/DreamApart4.webp" },
      { type: "image", src: "images/DreamApart5.webp" },
      { type: "image", src: "images/DreamApart6.webp" },
      { type: "image", src: "images/DreamApart7.webp" },
      { type: "image", src: "images/DreamApart8.webp" },
      { type: "image", src: "images/DreamApart9.webp" },
      { type: "image", src: "images/DreamApart10.webp" },
     

    ],
    brief: "A Polish vacation apartment booking platform UI with location/guests search, map view, filters, and a ski-resort-focused property listing.",
    deliverables: [
      "Search bar with location, dates & guest count",
      "Property listing cards with ski amenity icons",
      "Map integration placeholder",
      "Filter UI",
      "Bilingual support (PL / EN)",
      "Promo code & discount banner"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/DreamApart/"
  },

  {
    id: 14,
    title: "SkiCarv",
    type: "Service Booking Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "Poland",
    client: "Ski School & Equipment Rental",
    image: "images/Ski.webp",
    gallery: [
      { type: "image", src: "images/Ski1.webp" },
      { type: "image", src: "images/Ski2.webp" },
      { type: "image", src: "images/Ski3.webp" },
      { type: "image", src: "images/Ski4.webp" },
      { type: "image", src: "images/Ski5.webp" },
      { type: "image", src: "images/Ski6.webp" },
      { type: "image", src: "images/Ski7.webp" },

    ],
    brief: "A Polish ski school and equipment rental booking page, featuring lesson type selector, slope chooser, participant counter, and an equipment rental calculator.",
    deliverables: [
      "Lesson type & slope selector UI",
      "Adults / children counter with equipment toggle",
      "Booking inquiry form",
      "Social media links",
      "Responsive layout"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/Ski-Carv.github.io/"
  },

  {
    id: 15,
    title: "KARMA Hair Transplant",
    type: "Medical / Business Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    country: "Germany",
    client: "KARMA Hair · Munich Hair Transplant Clinic",
    platform: "Fiverr",
    image: "images/KARMA.webp",
    gallery: [
      { type: "image", src: "images/KARMA1.webp" },
      { type: "image", src: "images/KARMA2.webp" },
      { type: "image", src: "images/KARMA3.webp" },
      { type: "image", src: "images/KARMA4.webp" },


    ],
    brief: "A German-language medical landing page for KARMA Hair — a Munich hair transplant clinic offering Turkish-standard FUE procedures, with before/after comparison, team, FAQ, and appointment booking.",
    deliverables: [
      "Medical service hero with appointment CTA",
      "Before/after comparison section",
      "Team & specialist profiles",
      "Blog with sidebar variations",
      "FAQ section",
      "Contact & map section",
      "Multi-page blog structure"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/karma-hair.github.io/"
  },

  {
    id: 16,
    title: "Finsweet — Eco NGO Website",
    type: "NGO / Non-Profit Landing Page",
    stack: ["HTML", "CSS", "JavaScript"],
    year: "2025",
    client: "Concept project",
    platform: "Personal",
    image: "images/Finsweet.webp",
    gallery: [
      { type: "image", src: "images/Finsweet1.webp" },
      { type: "image", src: "images/Finsweet2.webp" },
      { type: "image", src: "images/Finsweet3.webp" },
      { type: "image", src: "images/Finsweet4.webp" },
      { type: "image", src: "images/Finsweet5.webp" },
      { type: "image", src: "images/Finsweet6.webp" },
      { type: "image", src: "images/Finsweet7.webp" },
      { type: "image", src: "images/Finsweet8.webp" },
      { type: "image", src: "images/Finsweet9.webp" },
      { type: "image", src: "images/Finsweet10.webp" }
  
     

    ],
    brief: "A Finsweet-style premium agency website built as an environmental NGO concept — featuring tree planting stats, donation flow, project showcase, supporter logos, and a blog.",
    deliverables: [
      "Hero with live stats (trees planted, donations)",
      "Mission & about sections",
      "Project showcase grid",
      "Donation allocation pie chart",
      "Blog with multi-layout support",
      "Volunteer & donate CTA"
    ],
    liveUrl: "https://oleksandr-vyshnevskyi.github.io/finsweetwebsiteoleksandr.github.io/home.html"
  }

];