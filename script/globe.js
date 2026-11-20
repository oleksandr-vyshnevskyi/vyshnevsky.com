(async () => {

  /* ── Constants ── */
  const HEX       = '#3DFF8F';
  const GCOL      = new THREE.Color(HEX);
  const BG        = 0x07090A;
  const RADIUS    = 1;
  const AUTO_ROT  = 0.0008;
  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Module-level refs filled in by async loaders below (were window.* globals) */
  let updateGlow = null;
  let landGlowMatRef = null;
  const isMobile  = window.innerWidth < 768;
  const globeIntro = window.__globeIntro = window.__globeIntro || { p: 0 };
  if (REDUCE_MOTION) globeIntro.p = 1;

  /* ── Round dot sprite ── */
  function makeCircleTexture(size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const r = size / 2;
    const grad = ctx.createRadialGradient(r,r,0, r,r,r);
    grad.addColorStop(0,   'rgba(61,255,143,1)');
    grad.addColorStop(0.45,'rgba(61,255,143,0.7)');
    grad.addColorStop(1,   'rgba(61,255,143,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(r,r,r,0,Math.PI*2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }
  const dotTex = makeCircleTexture();

  /* ── Canvas target: render INTO #globeCanvas ── */
  const canvas = document.getElementById('globeCanvas');
  const heroEl = document.getElementById('hero');

  /* ── Renderer ── */
  /* WebGL can still fail here (context limit, driver blocklist) — fall back to the static image */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
  } catch (e) {
    canvas.classList.add('globe-fallback');
    return;
  }
  const dpr = isMobile ? Math.min(devicePixelRatio, 1) : Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.01, 100);

  /* Globe fills ~60% of hero height, bottom slightly cropped */
  camera.position.set(0, 0.5, 3);
  camera.lookAt(0, 0.5, 0);

  /* ── Bloom post-processing ── */
  const renderPass = new THREE.RenderPass(scene, camera);
  const bloomPass  = new THREE.UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    0.75, 0.18, 0.08
  );
  const composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderPass);
  if (!isMobile) composer.addPass(bloomPass); /* Mobile: skip bloom — 3 render passes saved */

  /* ── Globe group ── */
  const globe = new THREE.Group();
  const HOME = { lat: 52.0, lng: 19.4 };
  globe.rotation.x = 0.22;
  globe.rotation.y = -(HOME.lng + 90) * Math.PI / 180;
  scene.add(globe);

  /* ── Back glow ── */
  {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 512;
    const gctx = glowCanvas.getContext('2d');
    const img = gctx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const r = Math.hypot(x - 255.5, y - 255.5) / 256;
        const k = Math.min(1, Math.max(0, (r - 0.15) / 0.85));
        const a = r >= 1 ? 0 : 0.1 * Math.pow(1 - k * k * (3 - 2 * k), 1.6);
        const i = (y * 512 + x) * 4;
        img.data[i] = 61; img.data[i + 1] = 255; img.data[i + 2] = 143;
        img.data[i + 3] = Math.max(0, Math.min(255, Math.round(a * 255 + Math.random() - 0.5)));
      }
    }
    gctx.putImageData(img, 0, 0);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(8.0, 8.0, 1);
    glowSprite.position.set(0, -0.15, -1.8);
    scene.add(glowSprite);
    updateGlow = (t, intro) => {
      const base = 0.72 + Math.sin(t * 0.2) * 0.08;
      glowMat.opacity = base * intro;
    };
  }

  /* ── Fresnel atmosphere ── */
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor:    { value: GCOL.clone() },
      uStrength: { value: isMobile ? 2.2 : 1.4 }, /* Mobile: stronger fresnel compensates for no bloom */
      uPower:    { value: isMobile ? 3.8 : 5.2 },
    },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vViewDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position,1.0);
        vViewDir = normalize(cameraPosition - wp.xyz);
        vNormal  = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uStrength; uniform float uPower;
      varying vec3 vNormal; varying vec3 vViewDir;
      void main() {
        float ndv = abs(dot(vNormal, vViewDir));
        float f = pow(1.0 - ndv, uPower);
        f *= smoothstep(0.0, 0.3, 1.0 - ndv);
        float a = clamp(f * uStrength, 0.0, 1.0);
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.FrontSide,
  });
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS*1.002, isMobile?32:64, isMobile?32:64), fresnelMat));

  /* ── Helpers ── */
  function ll(lat, lng, r) {
    const phi   = (90-lat)*Math.PI/180;
    const theta = (lng+180)*Math.PI/180;
    return new THREE.Vector3(
      -r*Math.sin(phi)*Math.cos(theta),
       r*Math.cos(phi),
       r*Math.sin(phi)*Math.sin(theta)
    );
  }
  function lmat(op) {
    const m = new THREE.LineBasicMaterial({
      transparent:true, opacity:op,
      blending:THREE.AdditiveBlending, depthWrite:false
    });
    m.color = GCOL.clone();
    return m;
  }

  /* ── TopoJSON decoder ── */
  function topo2geo(topo, key) {
    const obj=topo.objects[key], arcs=topo.arcs;
    const sc=topo.transform.scale, tr=topo.transform.translate;
    function decArc(i) {
      const rev=i<0, idx=rev?~i:i; let x=0,y=0;
      const pts=arcs[idx].map(([dx,dy])=>{x+=dx;y+=dy;
        return[+(x*sc[0]+tr[0]).toFixed(4),+(y*sc[1]+tr[1]).toFixed(4)]});
      return rev?pts.reverse():pts;
    }
    const features=[];
    for(const geom of obj.geometries) {
      const bR=idxs=>idxs.flatMap(decArc);
      if(geom.type==='Polygon')
        features.push({type:'Polygon',coordinates:geom.arcs.map(bR)});
      else if(geom.type==='MultiPolygon')
        features.push({type:'MultiPolygon',coordinates:geom.arcs.map(p=>p.map(bR))});
    }
    return features;
  }

  function decodeArcs(topo) {
    const sc = topo.transform.scale, tr = topo.transform.translate;
    return topo.arcs.map(arc => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sc[0] + tr[0], y * sc[1] + tr[1]]; });
    });
  }

  function arcUsage(topo, key) {
    const use = new Map();
    const add = i => { const k = i < 0 ? ~i : i; use.set(k, (use.get(k) || 0) + 1); };
    for (const g of topo.objects[key].geometries) {
      if (g.type === 'Polygon') g.arcs.forEach(ring => ring.forEach(add));
      else if (g.type === 'MultiPolygon') g.arcs.forEach(p => p.forEach(ring => ring.forEach(add)));
    }
    return use;
  }

  function arcsToVerts(lines) {
    let n = 0;
    for (const l of lines) n += Math.max(0, l.length - 1);
    const out = new Float32Array(n * 6);
    let o = 0;
    for (const l of lines) {
      let prev = ll(l[0][1], l[0][0], 1);
      for (let i = 1; i < l.length; i++) {
        const cur = ll(l[i][1], l[i][0], 1);
        out[o++] = prev.x; out[o++] = prev.y; out[o++] = prev.z;
        out[o++] = cur.x;  out[o++] = cur.y;  out[o++] = cur.z;
        prev = cur;
      }
    }
    return out;
  }

  function linesGeometry(unitVerts, r) {
    const v = new Float32Array(unitVerts.length);
    for (let i = 0; i < v.length; i++) v[i] = unitVerts[i] * r;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
    return geo;
  }

  /* ── Prefetch both geo files in parallel immediately — single fetch each ── */
  /* Mobile: 110m maps (~5× lighter) — the globe is small there, detail difference is invisible */
  const GEO_RES = isMobile ? '110m' : '50m';
  /* world-atlas@2 TopoJSON — self-hosted in data/geo.
     Loaded as <script> (not fetch) so the globe also works when index.html
     is opened straight from disk (file://), where fetch() is blocked. */
  function loadGeo(name) {
    return new Promise((resolve, reject) => {
      const cached = window.GEO_DATA && window.GEO_DATA[name];
      if (cached) return resolve(cached);
      const s = document.createElement('script');
      s.src = `/data/geo/${name}.js`;
      s.async = true;
      s.onload  = () => (window.GEO_DATA && window.GEO_DATA[name]) ? resolve(window.GEO_DATA[name]) : reject(new Error('Geo data missing: ' + name));
      s.onerror = () => reject(new Error('Geo load failed: ' + name));
      document.head.appendChild(s);
    });
  }
  let _landTopoPromise      = loadGeo(`land-${GEO_RES}`);
  let _countriesTopoPromise = loadGeo(`countries-${GEO_RES}`);

  function fetchLandTopo()      { return _landTopoPromise; }
  function fetchCountriesTopo() { return _countriesTopoPromise; }

  /* ── Countries ── */
  async function loadCountries() {
    const topo  = await fetchCountriesTopo();
    const arcs  = decodeArcs(topo);
    const use   = arcUsage(topo, 'countries');
    const inner = [];
    use.forEach((count, k) => { if (count > 1) inner.push(arcs[k]); });
    const geo = linesGeometry(arcsToVerts(inner), RADIUS+0.004);
    const mat = new THREE.LineBasicMaterial({
      color:GCOL.clone(), transparent:true, opacity:0.55,
      blending:THREE.AdditiveBlending, depthWrite:false
    });
    globe.add(new THREE.LineSegments(geo, mat));
  }

  /* ── Land layers ── */
  async function loadLand() {
    const topo  = await fetchLandTopo();
    const arcs  = decodeArcs(topo);
    const used  = [];
    arcUsage(topo, 'land').forEach((_, k) => used.push(arcs[k]));
    const unit  = arcsToVerts(used);
    const layers = isMobile ? [
      { r: RADIUS+0.004, op: 0.95 },
      { r: RADIUS-0.010, op: 0.18 },
    ] : [
      { r: RADIUS+0.004, op: 0.95 },
      { r: RADIUS+0.000, op: 0.40 },
      { r: RADIUS-0.010, op: 0.16 },
      { r: RADIUS-0.028, op: 0.05 },
    ];
    for(const {r, op} of layers){
      globe.add(new THREE.LineSegments(linesGeometry(unit, r), lmat(op)));
    }
  }

  /* ── Cities ── */
  const CITIES = [
    [51.5,-0.1,'London',1], [48.9,2.3,'Paris',1], [52.5,13.4,'Berlin',0],
    [40.7,-74.0,'New York',1], [34.1,-118.2,'Los Angeles',0], [37.8,-122.4,'San Francisco',1],
    [43.7,-79.4,'Toronto',0], [19.4,-99.1,'Mexico City',0],
    [35.7,139.7,'Tokyo',1], [31.2,121.5,'Shanghai',1], [39.9,116.4,'Beijing',1],
    [37.6,127.0,'Seoul',0], [1.35,103.8,'Singapore',1], [28.6,77.2,'Delhi',0],
    [19.1,72.9,'Mumbai',0], [25.0,55.2,'Dubai',1], [41.0,28.9,'Istanbul',0],
    [55.8,37.6,'Moscow',0], [59.3,18.1,'Stockholm',0], [52.2,21.0,'Warsaw',0],
    [30.1,31.2,'Cairo',0], [-26.2,28.0,'Johannesburg',0], [-1.3,36.8,'Nairobi',0],
    [-23.5,-46.6,'São Paulo',0], [-34.6,-58.4,'Buenos Aires',0],
    [-33.9,151.2,'Sydney',0], [-37.8,145.0,'Melbourne',0],
    [22.3,114.2,'Hong Kong',1], [13.8,100.5,'Bangkok',0], [3.1,101.7,'KL',0],
  ];

  const ARC_PAIRS = [
    [0,3],[0,9],[1,22],[2,18],[3,6],[3,10],[4,7],[5,16],
    [6,14],[8,3],[8,9],[9,11],[10,8],[11,12],[12,15],[13,15],
    [14,12],[15,0],[16,0],[17,2],[18,17],[19,2],[20,21],[21,22],
    [23,3],[24,23],[25,8],[26,25],[27,11],[28,12],
  ];

  function makeArc(latA,lngA,latB,lngB,segments=80){
    const vA = ll(latA,lngA,RADIUS+0.008);
    const vB = ll(latB,lngB,RADIUS+0.008);
    const pts = [];
    const mid = vA.clone().add(vB).multiplyScalar(0.5);
    const lift = 0.18 + mid.length() * 0.12;
    mid.normalize().multiplyScalar(RADIUS + lift);
    for(let i=0;i<=segments;i++){
      const t = i/segments;
      const p = new THREE.Vector3()
        .addScaledVector(vA,(1-t)*(1-t))
        .addScaledVector(mid,2*t*(1-t))
        .addScaledVector(vB,t*t);
      pts.push(p);
    }
    return pts;
  }

  const cityPulseObjs = [];
  const nearHome = (lat, lng) => Math.abs(lat - HOME.lat) < 3 && Math.abs(lng - HOME.lng) < 4;
  function addCities(){
    const vertsNorm = [], vertsMajor = [];
    CITIES.forEach(([lat,lng,,tier]) => {
      if (nearHome(lat, lng)) return;
      const v = ll(lat, lng, RADIUS+0.008);
      if(tier) vertsMajor.push(v.x,v.y,v.z);
      else     vertsNorm.push(v.x,v.y,v.z);
    });
    const makePointsGeo = verts => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts),3));
      return g;
    };
    globe.add(new THREE.Points(makePointsGeo(vertsNorm), new THREE.PointsMaterial({
      color:GCOL.clone(), size:0.014, map:dotTex,
      alphaTest:0.01, transparent:true, opacity:0.85,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    })));
    globe.add(new THREE.Points(makePointsGeo(vertsMajor), new THREE.PointsMaterial({
      color:GCOL.clone(), size:0.024, map:dotTex,
      alphaTest:0.01, transparent:true, opacity:1.0,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    })));
    CITIES.forEach(([lat,lng,,tier], idx) => {
      if (nearHome(lat, lng)) return;
      const origin = ll(lat, lng, RADIUS+0.008);
      const segments = 24;
      const normal = origin.clone().normalize();
      const up = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0,1,0) : new THREE.Vector3(1,0,0);
      const tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
      const unitRing = new Float32Array((segments+1)*3);
      for (let i = 0; i <= segments; i++) {
        const a = (i/segments)*Math.PI*2, c = Math.cos(a), sn = Math.sin(a);
        unitRing[i*3]   = tangent.x*c + bitangent.x*sn;
        unitRing[i*3+1] = tangent.y*c + bitangent.y*sn;
        unitRing[i*3+2] = tangent.z*c + bitangent.z*sn;
      }
      const ringVerts = new Float32Array((segments+1)*3);
      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(ringVerts, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: GCOL.clone(), transparent:true, opacity:0,
        blending:THREE.AdditiveBlending, depthWrite:false,
      });
      const ring = new THREE.LineLoop(ringGeo, ringMat);
      globe.add(ring);
      cityPulseObjs.push({ origin, unitRing, ringGeo, ringMat, segments, offset: idx * 0.4, tier: tier||0, lat });
    });
  }

  function updateCityPulse(t){
    cityPulseObjs.forEach(({origin, unitRing, ringGeo, ringMat, segments, offset, tier, lat}) => {
      if(Math.abs(lat) > 65){ ringMat.opacity = 0; return; }
      const cycle = 3.0;
      const local = (t * 0.8 + offset) % cycle;
      const progress = local / cycle;
      const maxR = tier ? 0.038 : 0.022;
      const peakOpacity = tier ? 0.9 : 0.7;
      const r = progress * maxR;
      ringMat.opacity = Math.sin(progress * Math.PI) * peakOpacity;
      const arr = ringGeo.attributes.position.array;
      for(let i=0;i<=segments;i++){
        arr[i*3]   = origin.x + unitRing[i*3]   * r;
        arr[i*3+1] = origin.y + unitRing[i*3+1] * r;
        arr[i*3+2] = origin.z + unitRing[i*3+2] * r;
      }
      ringGeo.attributes.position.needsUpdate = true;
    });
  }

  const homeRings = [];
  let homePos = null, homeLabel = null, homeShown = 0, introDoneAt = 0, homeLeft = false, homeSideFade = 1;
  const tmpV = new THREE.Vector3();
  function addHome() {
    homePos = ll(HOME.lat, HOME.lng, RADIUS + 0.008);
    const core = new THREE.BufferGeometry();
    core.setAttribute('position', new THREE.BufferAttribute(new Float32Array([homePos.x, homePos.y, homePos.z]), 3));
    globe.add(new THREE.Points(core, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.05, map: dotTex, alphaTest: 0.01, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })));
    globe.add(new THREE.Points(core, new THREE.PointsMaterial({
      color: GCOL.clone(), size: 0.12, map: dotTex, alphaTest: 0.01, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })));
    const normal = homePos.clone().normalize();
    const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    const seg = 48;
    for (let k = 0; k < 2; k++) {
      const unit = new Float32Array((seg + 1) * 3);
      for (let i = 0; i <= seg; i++) {
        const an = (i / seg) * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
        unit[i * 3] = tangent.x * c + bitangent.x * sn;
        unit[i * 3 + 1] = tangent.y * c + bitangent.y * sn;
        unit[i * 3 + 2] = tangent.z * c + bitangent.z * sn;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((seg + 1) * 3), 3));
      const mat = new THREE.LineBasicMaterial({ color: GCOL.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      globe.add(new THREE.LineLoop(geo, mat));
      homeRings.push({ geo, mat, unit, seg, offset: k * 1.2 });
    }
    homeLabel = document.createElement('div');
    homeLabel.className = 'globe-home';
    homeLabel.setAttribute('aria-hidden', 'true');
    homeLabel.textContent = window.T ? window.T('Currently in Poland') : 'Currently in Poland';
    heroEl.appendChild(homeLabel);
  }

  function updateHome(t) {
    if (!homePos) return;
    for (const r of homeRings) {
      const pr = ((t + r.offset) % 2.4) / 2.4;
      const rad = 0.02 + pr * 0.07;
      r.mat.opacity = Math.sin(pr * Math.PI) * 0.8;
      const arr = r.geo.attributes.position.array;
      for (let i = 0; i <= r.seg; i++) {
        arr[i * 3] = homePos.x + r.unit[i * 3] * rad;
        arr[i * 3 + 1] = homePos.y + r.unit[i * 3 + 1] * rad;
        arr[i * 3 + 2] = homePos.z + r.unit[i * 3 + 2] * rad;
      }
      r.geo.attributes.position.needsUpdate = true;
    }
    tmpV.copy(homePos).applyMatrix4(globe.matrixWorld);
    const facing = tmpV.clone().normalize().dot(tmpV.clone().sub(camera.position).negate().normalize());
    if (!introDoneAt && globeIntro.p >= 1) introDoneAt = t;
    homeShown = introDoneAt && t - introDoneAt > 1.4 ? Math.min(1, homeShown + 0.03) : 0;
    const vis = Math.max(0, Math.min(1, (facing - 0.25) / 0.2)) * homeShown;
    tmpV.project(camera);
    const x = (tmpV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-tmpV.y * 0.5 + 0.5) * canvas.clientHeight;
    const room = canvas.clientWidth - 16 - (x + 22 + homeLabel.offsetWidth);
    const wantLeft = homeLeft ? room < 40 : room < 0;
    if (wantLeft !== homeLeft) {
      homeSideFade = Math.max(0, homeSideFade - 0.12);
      if (homeSideFade === 0) homeLeft = wantLeft;
    } else {
      homeSideFade = Math.min(1, homeSideFade + 0.08);
    }
    homeLabel.classList.toggle('is-left', homeLeft);
    homeLabel.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)${homeLeft ? ' translateX(-100%)' : ''}`;
    homeLabel.style.opacity = (vis * homeSideFade).toFixed(3);
  }

  /* ── Arcs ── */
  const arcObjects = [];
  const meteorGeo = new THREE.BufferGeometry();
  meteorGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const meteorPoints = new THREE.Points(meteorGeo, new THREE.PointsMaterial({
    color: GCOL.clone(), size: 0.032, map: dotTex,
    alphaTest:0.01, transparent:true, opacity:0.95,
    blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
  }));
  globe.add(meteorPoints);

  function buildArcs(){
    ARC_PAIRS.forEach(([i,j], idx) => {
      const [latA,lngA] = CITIES[i];
      const [latB,lngB] = CITIES[j];
      const pts = makeArc(latA,lngA,latB,lngB);
      const N = pts.length;
      const allPos = new Float32Array(N*3);
      const normIdx = new Float32Array(N);
      pts.forEach((p,k)=>{
        allPos[k*3]=p.x; allPos[k*3+1]=p.y; allPos[k*3+2]=p.z;
        normIdx[k] = k / (N - 1);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(allPos,3));
      geo.setAttribute('aIdx',     new THREE.BufferAttribute(normIdx,1));
      geo.setDrawRange(0,0);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uColor:   { value: GCOL.clone() },
          uOpacity: { value: 0.0 },
          uTail:    { value: 0.0 },
          uHead:    { value: 0.0 },
        },
        vertexShader: `
          attribute float aIdx; varying float vIdx;
          void main(){ vIdx = aIdx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uOpacity, uTail, uHead; varying float vIdx;
          void main(){
            float range = uHead - uTail;
            float frac  = range > 0.0 ? (vIdx - uTail) / range : 1.0;
            frac = clamp(frac, 0.0, 1.0);
            float bright = frac * frac;
            gl_FragColor = vec4(uColor * bright, bright * uOpacity);
          }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      globe.add(line);
      arcObjects.push({ line, geo, mat, pts, total: N,
        offset: idx * 0.7 + Math.random()*2,
        duration: 2.0 + Math.random()*1.0,
        pause:    1.5 + Math.random()*2.0,
      });
    });
    const mPos = new Float32Array(arcObjects.length*3);
    meteorGeo.setAttribute('position', new THREE.BufferAttribute(mPos,3));
  }

  function updateArcs(t){
    const TAIL_FRAC = 0.35;
    const mPos = meteorGeo.attributes.position;
    arcObjects.forEach((arc, idx) => {
      const cycle = arc.duration + arc.pause;
      const local = ((t + arc.offset) % cycle);
      if(local < arc.duration){
        const progress = local / arc.duration;
        const head = Math.min(arc.total-1, Math.floor(progress * arc.total));
        const tailLen = Math.floor(arc.total * TAIL_FRAC);
        const tail = Math.max(0, head - tailLen);
        arc.geo.setDrawRange(tail, head - tail + 1);
        arc.mat.uniforms.uTail.value    = tail    / (arc.total - 1);
        arc.mat.uniforms.uHead.value    = head    / (arc.total - 1);
        arc.mat.uniforms.uOpacity.value = 0.9 * Math.sin(progress * Math.PI);
        const hp = arc.pts[head];
        mPos.setXYZ(idx, hp.x, hp.y, hp.z);
      } else {
        arc.geo.setDrawRange(0,0);
        arc.mat.uniforms.uOpacity.value = 0;
        mPos.setXYZ(idx, 0, 0, 0);
      }
    });
    mPos.needsUpdate = true;
  }

  /* ── Land mask ── */
  async function buildLandMask(features) {
    const W = 1024, H = 512;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    const project = (lng, lat) => [(lng+180)/360*W, (90-lat)/180*H];
    const drawRing = coords => {
      if(coords.length < 2) return;
      ctx.beginPath();
      const [x0,y0] = project(coords[0][0], coords[0][1]);
      ctx.moveTo(x0, y0);
      for(let i=1;i<coords.length;i++){
        const [x,y] = project(coords[i][0], coords[i][1]);
        ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.fill();
    };
    for(const f of features){
      if(f.type==='Polygon')           f.coordinates.forEach(drawRing);
      else if(f.type==='MultiPolygon') f.coordinates.forEach(p=>p.forEach(drawRing));
    }
    return new THREE.CanvasTexture(c);
  }

  /* ── Noise mesh ── */
  let noiseMat = null;
  function buildNoiseMesh() {
    noiseMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: GCOL.clone() }, uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldPos;
        void main(){
          vec4 wp = modelMatrix * vec4(position,1.0);
          vWorldPos = wp.xyz;
          vViewDir  = normalize(cameraPosition - wp.xyz);
          vNormal   = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uTime;
        varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldPos;
        vec3 hash3(vec3 p){
          p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
          return fract(sin(p)*43758.5453);
        }
        float vnoise3(vec3 p){
          vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
          float n000=dot(hash3(i),f),n100=dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0));
          float n010=dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),n110=dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0));
          float n001=dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),n101=dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1));
          float n011=dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),n111=dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1));
          return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y),mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y),u.z)*0.5+0.5;
        }
        float fbm3(vec3 p){
          float v=0.0,a=0.5;
          for(int i=0;i<3;i++){v+=a*vnoise3(p);p=p*2.1+vec3(1.7,9.2,3.4);a*=0.5;}
          return v;
        }
        void main(){
          float fresnel=pow(1.0-abs(dot(vNormal,vViewDir)),2.5);
          vec3 p=vWorldPos*3.5;
          float n=fbm3(p+uTime*0.018),n2=fbm3(p*1.8+uTime*0.009+vec3(4.3,1.7,2.1));
          n=smoothstep(0.32,0.72,n); n2=smoothstep(0.34,0.70,n2);
          float noise=max(n,n2*0.6);
          float brightness=noise*0.07+fresnel*0.03+0.007;
          gl_FragColor=vec4(uColor*clamp(brightness,0.0,1.0),1.0);
        }`,
      transparent: false, depthWrite: true, depthTest: true, side: THREE.FrontSide,
    });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS, isMobile?32:64, isMobile?32:64), noiseMat));
  }

  /* ── Load geo ── */
  let landFeatures = null;
  try {
    await Promise.all([loadCountries(), loadLand()]);
    landFeatures = topo2geo(await fetchLandTopo(), 'land');
  }
  catch(e) { console.warn('Geo load failed:', e); }

  addCities();
  buildArcs();
  if (isMobile) {
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0a120d })));
  } else {
    buildNoiseMesh();
  }
  addHome();

  /* ── Land glow — land mask built on idle to avoid blocking main thread ── */
  try {
    const features = landFeatures;
    if (!features) throw new Error('no land data');
    const buildWhenIdle = (resolve) => {
      const run = () => resolve(buildLandMask(features));
      if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 });
      else setTimeout(run, 200);
    };
    const landTex = await new Promise(buildWhenIdle);
    const landGlowMat = new THREE.ShaderMaterial({
      uniforms: { uLandMask: { value: landTex }, uColor: { value: GCOL.clone() }, uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldPos;
        void main(){
          vec4 wp=modelMatrix*vec4(position,1.0);
          vWorldPos=normalize(wp.xyz); vViewDir=normalize(cameraPosition-wp.xyz);
          vNormal=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }`,
      fragmentShader: `
        uniform sampler2D uLandMask; uniform vec3 uColor; uniform float uTime;
        varying vec3 vNormal; varying vec3 vViewDir; varying vec3 vWorldPos;
        vec2 sphereUV(vec3 n){
          float u=atan(n.z,-n.x)/(2.0*3.14159265)+0.5;
          float v=asin(clamp(n.y,-1.0,1.0))/3.14159265+0.5;
          return vec2(u,v);
        }
        vec3 hash3(vec3 p){
          p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
          return fract(sin(p)*43758.5453);
        }
        float vnoise3(vec3 p){
          vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
          float n000=dot(hash3(i),f),n100=dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0));
          float n010=dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),n110=dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0));
          float n001=dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),n101=dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1));
          float n011=dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),n111=dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1));
          return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y),mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y),u.z)*0.5+0.5;
        }
        float fbm3(vec3 p){
          float v=0.0,a=0.5;
          for(int i=0;i<${isMobile ? 2 : 3};i++){v+=a*vnoise3(p);p=p*2.1+vec3(1.7,9.2,3.4);a*=0.5;}
          return v;
        }
        void main(){
          vec2 suv=sphereUV(vWorldPos);
          float land=texture2D(uLandMask,suv).r;
          if(land<0.5) discard;
          float fresnel=pow(1.0-abs(dot(vNormal,vViewDir)),2.0);
          vec3 p=vWorldPos*4.0;
          float n=fbm3(p+uTime*0.025);
          n=smoothstep(0.35,0.75,n);
          float brightness=n*0.14+fresnel*0.18+0.015;
          brightness=clamp(brightness,0.0,1.0);
          gl_FragColor=vec4(uColor*brightness,brightness);
        }`,
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, depthTest: true, side: THREE.FrontSide,
    });
    globe.add(new THREE.Mesh(new THREE.SphereGeometry(RADIUS+0.001, isMobile?32:64, isMobile?32:64), landGlowMat));
    landGlowMatRef = landGlowMat;
  } catch(e) { console.warn('Land glow failed:', e); }



  /* ══════════════════════════════════════════════════
     INTERACTION — Y-axis only, inertia, auto-rotation
  ══════════════════════════════════════════════════ */
  let isDragging   = false;
  let prevX        = 0;
  let velocityY    = 0;       // inertia accumulator
  let autoRotSpeed = REDUCE_MOTION ? 0 : AUTO_ROT; /* still draggable, just no auto-spin */


  function onDragStart(x) {
    isDragging      = true;
    prevX           = x;
    velocityY       = 0;
    heroEl.style.cursor = 'grabbing';
  }

  function onDragMove(x) {
    if (!isDragging) return;
    const delta = (x - prevX) * 0.004;
    globe.rotation.y += delta;
    /* Accumulate velocity — weighted average for smoothness */
    velocityY = velocityY * 0.6 + delta * 0.4;
    prevX = x;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    heroEl.style.cursor = 'grab';
  }

  /* Mouse */
  heroEl.addEventListener('mousedown',  e => onDragStart(e.clientX));
  window.addEventListener('mousemove',  e => onDragMove(e.clientX));
  window.addEventListener('mouseup',    () => onDragEnd());

  /* Touch — single finger, horizontal swipe only */
  let touchStartX = 0, touchStartY = 0, touchIntent = null;

  heroEl.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchIntent = null;
  }, { passive: true });

  heroEl.addEventListener('touchmove', e => {
    if (e.touches.length !== 1) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (touchIntent === null && (dx > 6 || dy > 6)) {
      touchIntent = dx >= dy ? 'horizontal' : 'vertical';
      if (touchIntent === 'horizontal') onDragStart(e.touches[0].clientX);
    }
    if (touchIntent === 'horizontal') onDragMove(e.touches[0].clientX);
  }, { passive: true });

  heroEl.addEventListener('touchend', () => { touchIntent = null; onDragEnd(); }, { passive: true });

  /* Cursor style on hero */
  heroEl.style.cursor = 'grab';

  /* ── Resize ── */
  function onResize() {
    const w = heroEl.clientWidth;
    const h = heroEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  /* ── Pause when hero out of view (performance) ── */
  let heroVisible = true;
  const observer = new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
  }, { threshold: 0.01 });
  observer.observe(heroEl);

  /* ── Animate ── */
  const clock = new THREE.Clock();
  let introProgress = 0;
  const FRICTION = 0.92; // inertia decay per frame

  /* Globe canvas opacity and scale driven by GSAP in script.js */
  /* introProgress tracks canvas opacity for glow sync */


  const introStartTime = performance.now();
  const INTRO_DURATION = 2000;

  function startPop() {
    if (REDUCE_MOTION || !window.gsap) { globeIntro.p = 1; return; }
    let tries = 0;
    const wait = () => {
      if (globeIntro.heroAt == null && ++tries < 40) return setTimeout(wait, 100);
      if (globeIntro.heroAt == null) globeIntro.heroAt = performance.now() - 1400;
      const delay = Math.max(0.5, (globeIntro.heroAt + 1400 - performance.now()) / 1000);
      gsap.to(globeIntro, { p: 1, duration: 1.8, delay, ease: 'elastic.out(1, 0.55)' });
    };
    wait();
  }
  startPop();

  (function tick() {
    requestAnimationFrame(tick);
    if (!heroVisible) return;

    const t = clock.getElapsedTime();

    /* Drive introProgress for glow opacity sync */
    introProgress = Math.min(1, (performance.now() - introStartTime) / INTRO_DURATION);

    if (isDragging) {
      /* User actively dragging — no auto-rotation */
    } else if (Math.abs(velocityY) > 0.00005) {
      /* Inertia phase — apply & decay */
      globe.rotation.y += velocityY;
      velocityY *= FRICTION;
      if (Math.abs(velocityY) <= 0.00005) {
        velocityY = 0;
      }
    } else {
      /* Auto-rotation — smooth resume */
      globe.rotation.y += autoRotSpeed;
    }

    globe.visible = globeIntro.p > 0.002;
    globe.scale.setScalar(Math.max(globeIntro.p, 0.002));

    /* Subtle wobble on X — read-only, user cannot change X */
    globe.rotation.x = 0.22 + Math.sin(t * 0.15) * 0.004;

    /* Animate arcs, cities, shaders */
    updateArcs(t);
    updateCityPulse(t);
    if (noiseMat)           noiseMat.uniforms.uTime.value = t;
    if (landGlowMatRef) landGlowMatRef.uniforms.uTime.value = t;
    if (updateGlow)  updateGlow(t, introProgress);

    /* Breathing fresnel + bloom */
    fresnelMat.uniforms.uStrength.value = (isMobile ? 2.2 : 1.38) + Math.sin(t * 0.28) * 0.06;
    const overshoot = Math.max(1, globeIntro.p);
    if (!isMobile) bloomPass.strength = (0.73 + Math.sin(t * 0.22) * 0.05) / Math.pow(overshoot, 6);

    updateHome(t);

    composer.render();
  })();

})();
