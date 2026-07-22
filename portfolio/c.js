/* ============================================================
   FOCUS PULL — design C engine.
   Same CONFIG, saved edits and admin panel as designs A and B.
   New here: the Curator (methodical best-image selection),
   day/night modes, depth-of-field interaction, and The Cull.
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "btf-config-v1";

  /* ---------- config ---------- */
  function deepMerge(base, over) {
    if (Array.isArray(over)) return over.slice();
    if (over && typeof over === "object") {
      const out = { ...base };
      for (const k of Object.keys(over)) out[k] = deepMerge(base ? base[k] : undefined, over[k]);
      return out;
    }
    return over === undefined ? base : over;
  }
  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  }
  let cfg = deepMerge(CONFIG, loadSaved() || {});
  const curatorCfg = () => Object.assign({ perFolder: 3, pins: [], vetoes: [] }, cfg.curator || {});

  /* ---------- Drive plumbing ---------- */
  function driveId(link) {
    if (!link) return null;
    const m = link.match(/\/d\/([\w-]{20,})/) || link.match(/[?&]id=([\w-]{20,})/) || link.match(/^([\w-]{25,})$/);
    return m ? m[1] : null;
  }
  function imageUrl(photo, size) {
    if (photo.src) return photo.src;
    const id = driveId(photo.drive);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
    return null;
  }
  let dynamicPhotos = [];
  function folderId(link) {
    if (!link) return null;
    const m = link.match(/\/folders\/([\w-]{20,})/) || link.match(/^([\w-]{25,})$/);
    return m ? m[1] : null;
  }
  async function fetchFolder(fid, apiKey) {
    const cacheKey = `btf-folder-v2-${fid}`;
    try { const hit = sessionStorage.getItem(cacheKey); if (hit) return JSON.parse(hit); } catch {}
    const q = encodeURIComponent(`'${fid}' in parents and mimeType contains 'image/' and trashed=false`);
    const fields = encodeURIComponent("files(id,name,imageMediaMetadata(width,height,time,cameraModel,aperture,exposureTime,isoSpeed))");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=name&pageSize=1000&key=${apiKey}`);
    if (!res.ok) throw new Error(`Drive API ${res.status}`);
    const files = (await res.json()).files || [];
    try { sessionStorage.setItem(cacheKey, JSON.stringify(files)); } catch {}
    return files;
  }
  async function loadFolders() {
    const d = cfg.drive || {};
    if (!d.apiKey || !Array.isArray(d.folders) || !d.folders.length) { dynamicPhotos = []; return; }
    const groups = await Promise.all(d.folders.map(async f => {
      const fid = folderId(f.link);
      if (!fid) return [];
      try {
        const files = await fetchFolder(fid, d.apiKey);
        return files.map((file, i) => {
          const meta = file.imageMediaMetadata || {};
          const ratio = meta.width && meta.height ? meta.width / meta.height : 1.5;
          return {
            drive: file.id, src: "",
            name: file.name,
            meta,
            folder: fid,
            title: f.label ? `${f.label} — frame ${String(i + 1).padStart(2, "0")}` : file.name.replace(/\.[a-z0-9]+$/i, ""),
            category: f.category || "events", artist: f.artist || "", year: f.year || "",
            wide: ratio > 1.7,
          };
        });
      } catch (err) { console.warn("Drive folder failed:", f.link, err); return []; }
    }));
    dynamicPhotos = groups.flat();
    curate();
  }
  function allPhotos() {
    const vetoes = new Set(curatorCfg().vetoes);
    const dynCats = new Set(dynamicPhotos.map(p => p.category));
    return cfg.photos
      .filter(p => p.drive || p.src || !dynCats.has(p.category))
      .concat(dynamicPhotos)
      .filter(p => !vetoes.has(p.drive));
  }

  /* ============================================================
     THE CURATOR — methodical best-image selection.
     Every frame is scored from three kinds of evidence:
       1. Drive metadata — resolution, shutter, aperture, and
          burst clustering (the last frames of a burst usually
          survive the photographer's own cull).
       2. Filename forensics — "final", "edit", "pick" and
          retouch suffixes leak the photographer's judgement.
       3. A pixel pass (where the browser is allowed) — sharpness
          by edge variance, clipped highlights and shadows,
          and overall colorfulness, measured on a small thumb.
     Pins always win; vetoes never show. The photographer signs
     off from the zoom view while in #admin mode.
     ============================================================ */
  let scoreCache = {};
  try { scoreCache = JSON.parse(localStorage.getItem("btf-scores-v1") || "{}"); } catch {}
  function saveScores() {
    try { localStorage.setItem("btf-scores-v1", JSON.stringify(scoreCache)); } catch {}
  }

  function metadataScore(photo, burstBonus) {
    let s = 50;
    const m = photo.meta || {};
    if (m.width && m.height) {
      const mp = (m.width * m.height) / 1e6;
      s += Math.min(10, mp);                             /* resolution */
      const r = m.width / m.height;
      if (r > 2.4 || r < 0.4) s -= 4;                    /* extreme crops */
    }
    if (m.exposureTime && m.exposureTime <= 1 / 500) s += 4;  /* frozen action */
    if (m.aperture && m.aperture <= 2.8) s += 3;              /* shallow depth */
    if (m.isoSpeed && m.isoSpeed >= 6400) s -= 3;             /* noisy frames */
    const n = (photo.name || photo.title || "").toLowerCase();
    if (/final|edit|pick|sel|best|keeper/.test(n)) s += 15;   /* her own words */
    if (/-e\d|_e\d|retouch/.test(n)) s += 8;
    if (/copy|dup|test/.test(n)) s -= 6;
    s += burstBonus || 0;
    return s;
  }

  /* burst clustering: frames shot within 8s of each other form a
     burst; later frames in a burst get a small bonus (the moment
     usually resolves at the end). */
  function burstBonuses(photos) {
    const stamped = photos
      .map(p => ({ p, t: Date.parse((p.meta || {}).time?.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3") || "") }))
      .filter(x => !isNaN(x.t))
      .sort((a, b) => a.t - b.t);
    const bonus = new Map();
    let run = [];
    const flush = () => {
      if (run.length >= 3) run.forEach((x, i) => bonus.set(x.p, Math.round((i / (run.length - 1)) * 4)));
      run = [];
    };
    stamped.forEach((x, i) => {
      if (i && x.t - stamped[i - 1].t > 8000) flush();
      run.push(x);
    });
    flush();
    return bonus;
  }

  async function pixelScore(photo) {
    const url = imageUrl(photo, 220);
    if (!url) return 0;
    try {
      const img = await new Promise((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = url;
      });
      const cv = document.createElement("canvas");
      const w = (cv.width = 64), h = (cv.height = Math.max(1, Math.round(64 * img.height / img.width)));
      const x = cv.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data;
      const g = new Float32Array(w * h);
      let dark = 0, bright = 0, sat = 0;
      for (let i = 0; i < w * h; i++) {
        const r = d[i * 4], gr = d[i * 4 + 1], b = d[i * 4 + 2];
        g[i] = 0.299 * r + 0.587 * gr + 0.114 * b;
        if (g[i] < 8) dark++;
        if (g[i] > 247) bright++;
        sat += Math.max(r, gr, b) - Math.min(r, gr, b);
      }
      /* sharpness: variance of a 4-neighbour laplacian */
      let lapSum = 0, lapSq = 0, count = 0;
      for (let yy = 1; yy < h - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
        const i = yy * w + xx;
        const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
        lapSum += v; lapSq += v * v; count++;
      }
      const lapVar = count ? lapSq / count - (lapSum / count) ** 2 : 0;
      const sharp = Math.min(15, Math.sqrt(lapVar) * 0.55);          /* 0..15 */
      const clipPenalty = Math.min(10, ((dark + bright) / (w * h)) * 60);
      const color = Math.min(6, (sat / (w * h)) / 14);
      return Math.round(sharp - clipPenalty + color);
    } catch {
      return 0; /* canvas tainted or image failed — metadata still stands */
    }
  }

  function curate() {
    /* group per folder for burst analysis */
    const byFolder = new Map();
    dynamicPhotos.forEach(p => {
      if (!byFolder.has(p.folder)) byFolder.set(p.folder, []);
      byFolder.get(p.folder).push(p);
    });
    byFolder.forEach(list => {
      const bursts = burstBonuses(list);
      list.forEach(p => {
        const cached = scoreCache[p.drive];
        p.score = cached ? cached.s : metadataScore(p, bursts.get(p) || 0);
        p.pxDone = cached ? !!cached.px : false;
      });
    });
    /* manual photos: the photographer's hand outranks the machine */
    cfg.photos.forEach(p => { p.score = 60 + (p.featured ? 20 : 0); p.pxDone = true; });
    schedulePixelPass();
  }

  let pxTimer = null;
  function schedulePixelPass() {
    clearTimeout(pxTimer);
    pxTimer = setTimeout(async () => {
      /* refine only the contenders — the top slice per folder */
      const per = curatorCfg().perFolder + 4;
      const byFolder = new Map();
      dynamicPhotos.forEach(p => {
        if (!byFolder.has(p.folder)) byFolder.set(p.folder, []);
        byFolder.get(p.folder).push(p);
      });
      let touched = false;
      for (const list of byFolder.values()) {
        const contenders = list.slice().sort((a, b) => b.score - a.score).slice(0, per).filter(p => !p.pxDone);
        for (const p of contenders) {
          const px = await pixelScore(p);
          p.score += px;
          p.pxDone = true;
          scoreCache[p.drive] = { s: p.score, px: true };
          touched = true;
        }
      }
      if (touched) { saveScores(); render(); }
    }, 400);
  }

  function reelPhotos() {
    const pins = new Set(curatorCfg().pins);
    const pinned = photosNow.filter(p => pins.has(p.drive));
    const rest = photosNow
      .filter(p => !pins.has(p.drive) && p.category !== "portrait")
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    /* respect the per-folder cap so one show doesn't hog the reel */
    const per = curatorCfg().perFolder;
    const used = new Map();
    const chosen = [];
    for (const p of rest) {
      const k = p.folder || photoKey(p); /* hand-added frames aren't one bucket */
      if ((used.get(k) || 0) >= per) continue;
      used.set(k, (used.get(k) || 0) + 1);
      chosen.push(p);
      if (pinned.length + chosen.length >= 8) break;
    }
    return pinned.concat(chosen);
  }

  /* ---------- placeholder ---------- */
  const PH_HUES = { comedy: [290, 20], concerts: [215, 24], events: [345, 16], sports: [200, 24], portrait: [265, 14] };
  function placeholderEl(photo, index) {
    const [hue] = PH_HUES[photo.category] || [30, 15];
    const el = document.createElement("div");
    el.className = "ph";
    el.style.background = [
      `radial-gradient(ellipse at ${20 + (index * 17) % 60}% ${25 + (index * 29) % 50}%, hsl(${hue} 28% 26% / .9), transparent 70%)`,
      `radial-gradient(ellipse at ${75 - (index * 13) % 45}% ${80 - (index * 23) % 55}%, hsl(${(hue + 40) % 360} 22% 18% / .8), transparent 65%)`,
      `linear-gradient(160deg, hsl(${hue} 18% 12%), hsl(${hue} 12% 7%))`,
    ].join(",");
    el.innerHTML = `<span class="ph__label">frame ${String(index + 1).padStart(3, "0")} · ${photo.category}<strong>awaiting film</strong></span>`;
    return el;
  }
  function frameMedia(photo, index, size) {
    const url = imageUrl(photo, size);
    if (!url) return placeholderEl(photo, index);
    const img = document.createElement("img");
    img.src = url;
    img.alt = photo.title || `Photograph ${index + 1}`;
    img.loading = index < 2 ? "eager" : "lazy";
    img.onerror = () => img.replaceWith(placeholderEl(photo, index));
    return img;
  }

  /* ---------- day / night ---------- */
  const THEME_VARS = {
    bg: "--bg", bgSoft: "--bg-soft", ink: "--ink", ink2: "--ink-2", muted: "--muted", line: "--line",
    accent: "--accent", accent2: "--accent-2", mark: "--mark",
  };
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)");
  let modePref = "auto";
  try { modePref = localStorage.getItem("btf-mode") || "auto"; } catch {}
  function resolvedMode() {
    return modePref === "auto" ? (sysDark.matches ? "dark" : "light") : modePref;
  }
  function applyMode() {
    const mode = resolvedMode();
    const theme = mode === "dark" ? Object.assign({}, cfg.theme, cfg.themeNight || {}) : cfg.theme;
    for (const [k, v] of Object.entries(THEME_VARS)) if (theme[k]) document.documentElement.style.setProperty(v, theme[k]);
    document.documentElement.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.bg || "#fbfaf6");
  }
  sysDark.addEventListener?.("change", () => { if (modePref === "auto") applyMode(); });
  document.getElementById("modeToggle").addEventListener("click", () => {
    modePref = resolvedMode() === "dark" ? "light" : "dark";
    try { localStorage.setItem("btf-mode", modePref); } catch {}
    applyMode();
  });

  /* ---------- helpers ---------- */
  const $ = id => document.getElementById(id);
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  const norm = s => (s || "").trim().toLowerCase();
  let photosNow = [];
  const artistPhotosOf = name => photosNow.filter(p => norm(p.artist) === norm(name));
  let collected = new Set();
  try { collected = new Set(JSON.parse(localStorage.getItem("btf-collected") || "[]")); } catch {}
  const photoKey = photo => photo.drive || photo.src || photo.title || "untitled";
  const plateText = photo => [photo.title || "Untitled", photo.year].filter(Boolean).join(" · ");
  const exifLine = photo => {
    const m = photo.meta || {};
    const bits = [];
    if (m.cameraModel) bits.push(m.cameraModel);
    if (m.aperture) bits.push(`f/${m.aperture}`);
    if (m.exposureTime) bits.push(m.exposureTime < 1 ? `1/${Math.round(1 / m.exposureTime)}s` : `${m.exposureTime}s`);
    return bits.join(" · ");
  };

  /* ---------- whispers ---------- */
  const egg = document.createElement("div");
  egg.className = "egg-toast";
  document.body.appendChild(egg);
  let eggTimer;
  function whisper(msg, ms = 3000) {
    egg.textContent = msg;
    egg.classList.add("is-on");
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => egg.classList.remove("is-on"), ms);
  }

  /* ---------- preloader ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem("btf-visited-c") === "1"; sessionStorage.setItem("btf-visited-c", "1"); } catch {}
  const loader = document.createElement("div");
  loader.setAttribute("aria-hidden", "true");
  loader.style.cssText =
    "position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;justify-content:center;gap:1rem;" +
    "font-family:'Space Grotesk',sans-serif;color:var(--accent);letter-spacing:.3em;font-size:.75rem;transition:opacity .5s,visibility .5s";
  loader.innerHTML = `<span>FR</span><span id="ldn" style="font-variant-numeric:tabular-nums">000</span><span>PULLING FOCUS</span>`;
  document.body.prepend(loader);
  {
    const num = loader.querySelector("#ldn");
    const t0 = performance.now(), dur = (reduceMotion || seen) ? 1 : 1000;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      num.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else { loader.style.opacity = "0"; loader.style.visibility = "hidden"; setTimeout(() => loader.remove(), 600); }
    })(t0);
  }

  /* ---------- focus observers ---------- */
  const revealIO = new IntersectionObserver(
    es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); revealIO.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  /* frames rack sharp when they own the middle of the viewport */
  const focusIO = new IntersectionObserver(
    es => es.forEach(en => en.target.classList.toggle("is-focus", en.isIntersecting)),
    { rootMargin: "-18% 0px -18% 0px", threshold: 0.35 }
  );
  function observe() {
    document.querySelectorAll(".reveal, .settle").forEach(el => revealIO.observe(el));
    document.querySelectorAll(".soft").forEach(el => focusIO.observe(el));
  }

  /* hand-drawn squiggles under every section's accent word */
  document.querySelectorAll(".sect__title em").forEach(em => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 12");
    svg.setAttribute("class", "squiggle");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<path d="M2 8 Q 18 2 36 7 T 70 6 T 118 4"/>';
    em.appendChild(svg);
  });
  document.querySelectorAll(".sect").forEach(el => revealIO.observe(el));

  /* hero racks focus on first scroll; the pen thread and the
     drifting strip ride the same rAF-throttled handler */
  let heroRacked = false, scrollQueued = false;
  const threadFill = $("threadFill"), threadDot = $("threadDot"), driftRow = $("driftRow");
  function onScroll() {
    const racked = scrollY > innerHeight * 0.12;
    if (racked !== heroRacked) {
      heroRacked = racked;
      $("hero").classList.toggle("is-racked", racked);
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    threadFill.style.transform = `scaleY(${p})`;
    threadDot.style.transform = `translate(-50%, ${p * innerHeight}px) translateY(-50%)`;
    threadDot.style.top = `${p * 100}%`;
    if (driftRow.dataset.ready) {
      const r = $("drift").getBoundingClientRect();
      const vis = 1 - Math.min(1, Math.max(0, r.top / innerHeight));
      driftRow.style.transform = `translate3d(${-vis * (driftRow.scrollWidth - innerWidth) * 0.6}px, 0, 0)`;
    }
  }
  addEventListener("scroll", () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
  }, { passive: true });

  /* ---------- archive filters ---------- */
  const filterState = { cat: "all", artist: null };
  const GRID_BATCH = 30;
  let gridLimit = GRID_BATCH;

  function photoVisible(p) {
    if (p.category === "portrait") return false;
    if (filterState.artist) return norm(p.artist) === norm(filterState.artist);
    return filterState.cat === "all" || p.category === filterState.cat;
  }
  function renderFilters() {
    const box = $("archiveFilters");
    box.innerHTML =
      `<button class="chip${filterState.cat === "all" && !filterState.artist ? " is-active" : ""}" data-filter="all" role="tab">All</button>` +
      cfg.categories.map(c =>
        `<button class="chip${filterState.cat === c.key && !filterState.artist ? " is-active" : ""}" data-filter="${c.key}" role="tab">${c.label}</button>`
      ).join("") +
      (filterState.artist ? `<button class="chip is-active" data-artist-clear="1" role="tab">${filterState.artist}&nbsp;&nbsp;✕</button>` : "");
    box.querySelectorAll(".chip").forEach(chip => {
      chip.setAttribute("aria-selected", chip.classList.contains("is-active") ? "true" : "false");
      chip.addEventListener("click", () => {
        if (chip.dataset.artistClear) filterState.artist = null;
        else { filterState.cat = chip.dataset.filter; filterState.artist = null; }
        gridLimit = GRID_BATCH;
        renderFilters();
        renderGrid();
      });
    });
  }
  function renderGrid() {
    const grid = $("archiveGrid");
    grid.innerHTML = "";
    grid.parentElement.querySelector(".archive__more")?.remove();
    const matches = photosNow.map((p, i) => i).filter(i => photoVisible(photosNow[i]));
    matches.slice(0, gridLimit).forEach(idx => {
      const photo = photosNow[idx];
      const cell = document.createElement("figure");
      cell.className = "cell" + (photo.wide ? " cell--wide" : "");
      cell.tabIndex = 0;
      cell.appendChild(frameMedia(photo, idx, 900));
      const bar = document.createElement("figcaption");
      bar.className = "cell__bar";
      bar.innerHTML = `<span>${photo.title || ""}</span><b>FR ${String(idx + 1).padStart(3, "0")}</b>`;
      cell.appendChild(bar);
      cell.addEventListener("click", () => openZoom(photo, idx));
      cell.addEventListener("keydown", e => { if (e.key === "Enter") openZoom(photo, idx); });
      grid.appendChild(cell);
    });
    if (matches.length > gridLimit) {
      const more = document.createElement("button");
      more.className = "archive__more";
      more.textContent = `Load more (${matches.length - gridLimit} left)`;
      more.addEventListener("click", () => { gridLimit += GRID_BATCH; renderGrid(); });
      grid.parentElement.insertBefore(more, $("cullDoor"));
    }
    $("archiveEmpty").hidden = matches.length > 0;
  }
  function showArtist(name) {
    filterState.artist = name;
    filterState.cat = "all";
    gridLimit = GRID_BATCH;
    renderFilters();
    renderGrid();
    $("archive").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- hover peek ---------- */
  const hoverPeek = document.createElement("div");
  hoverPeek.className = "hover-peek";
  hoverPeek.setAttribute("aria-hidden", "true");
  document.body.appendChild(hoverPeek);
  let peekCycle = null, peekW = 200, peekH = 266;
  new ResizeObserver(en => { if (en[0]) { peekW = en[0].contentRect.width; peekH = en[0].contentRect.height; } }).observe(hoverPeek);
  function startPeek(name) {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    const shots = artistPhotosOf(name).filter(p => imageUrl(p, 600));
    let i = 0;
    const show = () => {
      const url = shots.length ? imageUrl(shots[i % shots.length], 600) : null;
      hoverPeek.style.backgroundImage = url ? `url("${url}")` : `linear-gradient(150deg, hsl(265 20% 32%), hsl(230 16% 14%))`;
      i++;
    };
    show();
    clearInterval(peekCycle);
    peekCycle = setInterval(show, 900);
    hoverPeek.classList.add("is-on");
  }
  function stopPeek() { clearInterval(peekCycle); hoverPeek.classList.remove("is-on"); }
  let px = 0, py = 0, queued = false;
  document.addEventListener("pointermove", e => {
    px = e.clientX; py = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const nx = Math.min(px + 36, innerWidth - peekW - 16);
      const ny = Math.min(Math.max(py - peekH / 2, 16), innerHeight - peekH - 16);
      hoverPeek.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
    });
  }, { passive: true });

  /* ---------- zoom + take-aways ---------- */
  const zoom = $("zoom");
  let zoomPhoto = null, zoomFr = 1;
  const adminOn = () => location.hash.replace("#", "").split("&").includes("admin") || window.BTF_ADMIN_ALWAYS;
  function openZoom(photo, idx) {
    zoomPhoto = photo;
    zoomFr = Math.max(1, photosNow.indexOf(photo) + 1);
    const url = imageUrl(photo, Math.min(2200, Math.ceil(innerWidth * (devicePixelRatio || 1))));
    const img = $("zoomImg");
    zoom.querySelector(".ph")?.remove();
    img.style.display = url ? "" : "none";
    if (url) { img.src = url; img.alt = photo.title || ""; }
    else {
      const ph = placeholderEl(photo, idx);
      ph.style.cssText += ";width:min(80vw,900px);aspect-ratio:3/2";
      zoom.insertBefore(ph, $("zoomPlate"));
    }
    $("zoomPlate").textContent = [plateText(photo), exifLine(photo)].filter(Boolean).join(" — ");
    refreshZoomCollect();
    const admin = adminOn() && photo.drive;
    $("zoomPin").hidden = !admin;
    $("zoomVeto").hidden = !admin;
    if (admin) $("zoomPin").textContent = curatorCfg().pins.includes(photo.drive) ? "Unpin from reel" : "Pin to reel";
    zoom.hidden = false;
  }
  $("zoomClose").addEventListener("click", () => { zoom.hidden = true; });
  zoom.addEventListener("click", e => { if (e.target === zoom) zoom.hidden = true; });
  $("zoomPin").addEventListener("click", () => {
    if (!zoomPhoto?.drive) return;
    cfg.curator = curatorCfg();
    const pins = cfg.curator.pins;
    const i = pins.indexOf(zoomPhoto.drive);
    if (i >= 0) { pins.splice(i, 1); whisper("Unpinned."); }
    else { pins.push(zoomPhoto.drive); whisper("Pinned — this frame now leads the reel."); }
    window.BTF.save();
    render();
    $("zoomPin").textContent = pins.includes(zoomPhoto.drive) ? "Unpin from reel" : "Pin to reel";
  });
  $("zoomVeto").addEventListener("click", () => {
    if (!zoomPhoto?.drive) return;
    cfg.curator = curatorCfg();
    cfg.curator.vetoes.push(zoomPhoto.drive);
    window.BTF.save();
    zoom.hidden = true;
    render();
    whisper("Hidden. It won't be shown again (undo in the exported config).");
  });

  /* collect + dock + tray (the take-aways, shared with design B) */
  function persistCollected() { try { localStorage.setItem("btf-collected", JSON.stringify([...collected])); } catch {} }
  function toggleCollect(photo, quiet) {
    const key = photoKey(photo);
    if (collected.has(key)) { collected.delete(key); if (!quiet) whisper("Returned to the wall."); }
    else {
      collected.add(key);
      if (!quiet) whisper(collected.size === 1 ? "A red dot — this frame is yours now." : `Collected. ${collected.size} frames in your private collection.`);
    }
    persistCollected();
    refreshDock();
    return collected.has(key);
  }
  function refreshZoomCollect() {
    if (!zoomPhoto) return;
    const on = collected.has(photoKey(zoomPhoto));
    $("zoomCollect").textContent = on ? "● Collected — return it" : "● Collect this frame";
    $("zoomCollect").classList.toggle("is-on", on);
  }
  $("zoomCollect").addEventListener("click", () => { if (zoomPhoto) { toggleCollect(zoomPhoto); refreshZoomCollect(); } });

  const dock = document.createElement("button");
  dock.className = "collect-dock";
  dock.hidden = true;
  document.body.appendChild(dock);
  const tray = document.createElement("div");
  tray.className = "tray";
  tray.setAttribute("role", "dialog");
  tray.setAttribute("aria-label", "Your collection");
  tray.hidden = true;
  tray.innerHTML = `
    <div class="tray__card">
      <header class="tray__head">
        <h3>Your collection</h3>
        <p class="tray__sub">Send me your picks and I'll prepare the full-resolution frames for you.</p>
        <button class="tray__close" aria-label="Close">✕</button>
      </header>
      <ul class="tray__list"></ul>
      <footer class="tray__foot">
        <a class="tray__btn tray__btn--primary" target="_blank" rel="noopener" data-send="wa">WhatsApp my picks</a>
        <a class="tray__btn" data-send="mail">Email my picks</a>
        <button class="tray__btn tray__btn--ghost" data-clear>Return all</button>
      </footer>
    </div>`;
  document.body.appendChild(tray);
  tray.addEventListener("click", e => { if (e.target === tray) tray.hidden = true; });
  tray.querySelector(".tray__close").addEventListener("click", () => { tray.hidden = true; });
  dock.addEventListener("click", () => { buildTray(); tray.hidden = false; });
  function collectedPhotos() {
    return photosNow.map((p, i) => ({ photo: p, fr: i + 1 })).filter(x => collected.has(photoKey(x.photo)));
  }
  function refreshDock() {
    const n = collected.size;
    dock.hidden = n === 0;
    dock.innerHTML = `<i></i>${n} frame${n === 1 ? "" : "s"} collected — view`;
    if (!tray.hidden) buildTray();
  }
  function picksMessage() {
    const items = collectedPhotos().map(x => `FR ${String(x.fr).padStart(3, "0")} — ${x.photo.title || "Untitled"}`);
    return `Hello ${cfg.site.name}! From your gallery I'd love these frames:%0A%0A` +
      items.map(t => encodeURIComponent(t)).join("%0A");
  }
  function buildTray() {
    const list = tray.querySelector(".tray__list");
    const picks = collectedPhotos();
    list.innerHTML = picks.length ? "" : `<li class="tray__empty">Nothing collected yet — collect frames from the enlarged view.</li>`;
    picks.forEach(({ photo, fr }) => {
      const li = document.createElement("li");
      const url = imageUrl(photo, 300);
      li.innerHTML =
        `<span class="tray__thumb" style="${url ? `background-image:url('${url}')` : "background:linear-gradient(150deg,hsl(28 25% 30%),hsl(20 18% 12%))"}"></span>` +
        `<span class="tray__meta"><b>FR ${String(fr).padStart(3, "0")}</b>${photo.title || "Untitled"}</span>`;
      const rm = document.createElement("button");
      rm.className = "tray__rm";
      rm.textContent = "✕";
      rm.setAttribute("aria-label", `Return FR ${fr}`);
      rm.addEventListener("click", () => toggleCollect(photo, true));
      li.appendChild(rm);
      list.appendChild(li);
    });
    tray.querySelector('[data-send="wa"]').href = `https://wa.me/${cfg.site.whatsapp}?text=${picksMessage()}`;
    tray.querySelector('[data-send="mail"]').href =
      `mailto:${cfg.site.email}?subject=${encodeURIComponent("My picks from your gallery")}&body=${picksMessage().replace(/%0A/g, "%0D%0A")}`;
  }
  tray.querySelector("[data-clear]").addEventListener("click", () => {
    collected.clear();
    persistCollected();
    refreshDock();
    buildTray();
    whisper("Every frame returned to the wall.");
  });
  refreshDock();

  /* postcard (same souvenir as design B) */
  async function makePostcard(photo, fr) {
    const W = 1500, H = 1060;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const t = resolvedMode() === "dark" ? Object.assign({}, cfg.theme, cfg.themeNight || {}) : cfg.theme;
    x.fillStyle = t.bg || "#fbfaf6";
    x.fillRect(0, 0, W, H);
    x.strokeStyle = t.accent || "#7a4f1d";
    x.lineWidth = 3; x.strokeRect(34, 34, W - 68, H - 68);
    x.lineWidth = 1; x.strokeRect(48, 48, W - 96, H - 96);
    const pxa = 150, pya = 110, pw = W - 300, ph = 620;
    x.fillStyle = "#2a231a"; x.fillRect(pxa - 16, pya - 16, pw + 32, ph + 32);
    x.fillStyle = "#ffffff"; x.fillRect(pxa, pya, pw, ph);
    const ix = pxa + 26, iy = pya + 26, iw = pw - 52, ih = ph - 52;
    const url = imageUrl(photo, 1300);
    let drawn = false;
    if (url) {
      try {
        const img = await new Promise((res, rej) => {
          const im = new Image(); im.crossOrigin = "anonymous";
          im.onload = () => res(im); im.onerror = rej; im.src = url;
        });
        const scale = Math.max(iw / img.width, ih / img.height);
        const sw = iw / scale, sh = ih / scale;
        x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, ix, iy, iw, ih);
        drawn = true;
      } catch {}
    }
    if (!drawn) {
      const g = x.createLinearGradient(ix, iy, ix + iw, iy + ih);
      g.addColorStop(0, "hsl(340 22% 28%)"); g.addColorStop(1, "hsl(230 20% 13%)");
      x.fillStyle = g; x.fillRect(ix, iy, iw, ih);
      x.fillStyle = "rgba(241,234,221,0.75)";
      x.font = "italic 300 44px Fraunces, Georgia, serif";
      x.textAlign = "center";
      x.fillText("awaiting film", ix + iw / 2, iy + ih / 2);
    }
    x.textAlign = "center";
    x.fillStyle = t.accent || "#7a4f1d";
    x.font = "600 24px 'Space Grotesk', sans-serif";
    x.fillText(`FR ${String(fr).padStart(3, "0")} · ${(photo.artist || photo.category || "").toUpperCase()}`, W / 2, pya + ph + 88);
    x.fillStyle = t.ink || "#161410";
    x.font = "italic 400 42px Fraunces, Georgia, serif";
    x.fillText(photo.title || "Untitled", W / 2, pya + ph + 148, W - 320);
    x.fillStyle = t.muted || "#5f5a4a";
    x.font = "300 26px 'Space Grotesk', sans-serif";
    x.fillText(`${cfg.site.name} — Dubai · @${cfg.site.instagram}`, W / 2, pya + ph + 210);
    try {
      const blob = await new Promise(res => cv.toBlob(res, "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `postcard-fr-${String(fr).padStart(3, "0")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      whisper("Your postcard is in your downloads — send it to someone.");
    } catch { whisper("The postcard printer jammed — try another frame."); }
  }
  $("zoomPostcard").addEventListener("click", () => { if (zoomPhoto) makePostcard(zoomPhoto, zoomFr); });

  /* ============================================================
     THE CULL — ten rounds against the Curator.
     ============================================================ */
  const cull = $("cull");
  $("cullDoor").addEventListener("click", () => { cull.hidden = false; resetCull(); });
  $("cullClose").addEventListener("click", endCull);
  cull.addEventListener("click", e => { if (e.target === cull) endCull(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!zoom.hidden) { zoom.hidden = true; return; }
      if (!cull.hidden) endCull();
    }
  });
  let cullState = null;
  function endCull() {
    cull.hidden = true;
    if (cullState?.timer) clearTimeout(cullState.timer);
    cullState = null;
  }
  function resetCull() {
    $("cullStage").innerHTML = `<button class="cull__start" id="cullStart">Start culling</button>`;
    $("cullFoot").textContent = "";
    $("cullStage").querySelector("#cullStart").addEventListener("click", startCull);
  }
  function startCull() {
    const pool = photosNow
      .filter(p => p.category !== "portrait")
      .slice()
      .sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i + 1 < pool.length && pairs.length < 10; i += 2) {
      const a = pool[i], b = pool[i + 1];
      pairs.push((a.score || 0) >= (b.score || 0) ? { keep: a, drop: b } : { keep: b, drop: a });
    }
    if (pairs.length < 3) { whisper("Not enough frames to cull yet — connect your Drive folders first."); return; }
    cullState = { pairs, round: 0, right: 0, timer: null };
    nextRound();
  }
  function nextRound() {
    const s = cullState;
    if (!s) return;
    if (s.round >= s.pairs.length) return showResult();
    const { keep } = s.pairs[s.round];
    const pairEls = [s.pairs[s.round].keep, s.pairs[s.round].drop].sort(() => Math.random() - 0.5);
    const stage = $("cullStage");
    stage.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "cull__pair";
    pairEls.forEach(photo => {
      const shot = document.createElement("button");
      shot.className = "cull__shot";
      shot.setAttribute("aria-label", photo.title || "Photograph");
      shot.appendChild(frameMedia(photo, s.round * 2, 700));
      shot.addEventListener("click", () => pick(photo, shot, wrap));
      wrap.appendChild(shot);
    });
    stage.appendChild(wrap);
    const timerBar = document.createElement("div");
    timerBar.className = "cull__timer";
    timerBar.innerHTML = "<i></i>";
    stage.appendChild(timerBar);
    $("cullFoot").textContent = `Round ${s.round + 1} / ${s.pairs.length} · kept ${s.right}`;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => { s.round++; nextRound(); }, reduceMotion ? 6000 : 3000);

    function pick(photo, el, container) {
      clearTimeout(s.timer);
      const right = photo === keep;
      if (right) s.right++;
      el.classList.add(right ? "is-right" : "is-wrong");
      container.querySelectorAll(".cull__shot").forEach(b => (b.disabled = true));
      setTimeout(() => { s.round++; nextRound(); }, 650);
    }
  }
  function showResult() {
    const s = cullState;
    const n = s.pairs.length, r = s.right;
    let best = 0;
    try {
      best = Math.max(r, +(localStorage.getItem("btf-cull-best") || 0));
      localStorage.setItem("btf-cull-best", String(best));
    } catch {}
    const verdict =
      r >= n * 0.8 ? "You'd survive a night in the pit. Call me — you can second-shoot." :
      r >= n * 0.5 ? "A good eye. The last picks are always the hardest — that's why it's my job." :
      "The camera loves confidence. Come back after another lap of the gallery.";
    $("cullStage").innerHTML =
      `<div class="cull__result">
        <h3>You matched the photographer's eye ${r} / ${n}.</h3>
        <p>${verdict}</p>
        <button class="cull__again">Cull again</button>
      </div>`;
    $("cullFoot").textContent = `best so far: ${best} / ${n}`;
    $("cullStage").querySelector(".cull__again").addEventListener("click", startCull);
  }

  /* ---------- small pleasures ---------- */
  const flash = document.createElement("div");
  flash.className = "flash";
  flash.setAttribute("aria-hidden", "true");
  document.body.appendChild(flash);
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.toLowerCase() === "f" && zoom.hidden && cull.hidden) {
      flash.classList.remove("is-firing");
      void flash.offsetWidth;
      flash.classList.add("is-firing");
      whisper("1/2000 s · f/1.8 · got it.", 1600);
    }
  });
  console.log(
    "%c◎ Focus Pull %c\nthe Curator scored every frame on this page — press f,\nor find The Cull at the end of the archive and beat her eye.",
    "font-family:Georgia,serif;font-size:16px;font-style:italic;color:#7a4f1d",
    "color:#5f5a4a;font-size:11px;line-height:1.6"
  );

  /* ---------- render ---------- */
  let wordsTimer = null, wordsIdx = 0;
  function render() {
    photosNow = allPhotos();
    applyMode();

    document.querySelectorAll("[data-bind]").forEach(el => {
      const val = getPath(cfg, el.dataset.bind);
      if (val !== undefined) el.textContent = val;
    });
    document.title = `${cfg.site.name} — ${cfg.site.tagline}`;
    $("footerName").textContent = `© ${new Date().getFullYear()} ${cfg.site.name}`;
    $("emailLink").href = `mailto:${cfg.site.email}?subject=${encodeURIComponent("Photography enquiry")}`;
    $("whatsappLink").href = `https://wa.me/${cfg.site.whatsapp}`;
    $("instagramLink").href = `https://instagram.com/${cfg.site.instagram}`;

    /* hero: the Curator's top frame */
    const reel = reelPhotos();
    const heroPhoto = reel.find(p => imageUrl(p, 2000)) || reel[0] || photosNow[0];
    const hUrl = heroPhoto && imageUrl(heroPhoto, 2000);
    $("heroPhoto").style.backgroundImage = hUrl
      ? `url("${hUrl}")`
      : "radial-gradient(ellipse at 30% 20%, hsl(340 26% 32% / .85), transparent 60%), radial-gradient(ellipse at 75% 75%, hsl(215 28% 26% / .8), transparent 65%), linear-gradient(160deg, hsl(260 16% 17%), hsl(230 14% 10%))";
    $("heroMeta").textContent = heroPhoto
      ? [`FR ${String(Math.max(1, photosNow.indexOf(heroPhoto) + 1)).padStart(3, "0")}`, plateText(heroPhoto), exifLine(heroPhoto)].filter(Boolean).join("  ·  ")
      : "";

    /* the reel */
    const frames = $("reelFrames");
    frames.innerHTML = "";
    reel.forEach((photo, i) => {
      const idx = photosNow.indexOf(photo);
      const f = document.createElement("figure");
      f.className = `reel-frame settle reel-frame--${["a", "b", "c"][i % 3]} w${i % 4}`;
      const imgWrap = document.createElement("div");
      imgWrap.className = "reel-frame__img soft";
      imgWrap.appendChild(frameMedia(photo, idx, 1600));
      imgWrap.addEventListener("click", () => openZoom(photo, idx));
      f.appendChild(imgWrap);
      const plate = document.createElement("figcaption");
      plate.className = "reel-frame__plate";
      plate.innerHTML =
        `<b>FR ${String(idx + 1).padStart(3, "0")}</b>` +
        `<i>${photo.title || "Untitled"}</i>` +
        (exifLine(photo) ? `<span>${exifLine(photo)}</span>` : "") +
        (photo.artist ? `<span>${photo.artist}</span>` : "");
      f.appendChild(plate);
      if (photo.note) {
        const note = document.createElement("p");
        note.className = "reel-frame__note";
        note.setAttribute("aria-hidden", "true");
        note.textContent = photo.note;
        f.appendChild(note);
      }
      frames.appendChild(f);
    });

    /* the drifting strip between rooms */
    driftRow.innerHTML = "";
    const driftPool = photosNow.filter(p => p.category !== "portrait").slice(0, 14);
    driftPool.forEach((p, i) => {
      const cell = document.createElement("span");
      cell.className = "drift__cell";
      const url = imageUrl(p, 500);
      cell.style.background = url
        ? `url("${url}") center/cover`
        : `linear-gradient(${140 + i * 25}deg, hsl(${[340, 215, 265, 160][i % 4]} 22% 30%), hsl(${[230, 260, 200, 215][i % 4]} 18% 14%))`;
      driftRow.appendChild(cell);
    });
    driftRow.dataset.ready = driftPool.length ? "1" : "";
    $("drift").style.display = driftPool.length ? "" : "none";

    /* artists */
    const list = $("artistsList");
    list.innerHTML = "";
    (cfg.credits.artists || []).forEach(a => {
      const entry = typeof a === "string" ? { name: a, note: "" } : a;
      const shots = artistPhotosOf(entry.name);
      const li = document.createElement("li");
      const row = document.createElement(shots.length ? "button" : "div");
      row.className = "artist-row" + (shots.length ? "" : " artist-row--static");
      row.innerHTML =
        `<span class="artist-row__name">${entry.name}</span>` +
        (entry.note ? `<span class="artist-row__note">${entry.note}</span>` : "") +
        `<span class="artist-row__count">${shots.length} ${shots.length === 1 ? "frame" : "frames"}</span>`;
      if (shots.length) {
        row.setAttribute("aria-label", `Show ${shots.length} photographs of ${entry.name}`);
        row.addEventListener("click", () => showArtist(entry.name));
        row.addEventListener("pointerenter", () => startPeek(entry.name));
        row.addEventListener("pointerleave", stopPeek);
      }
      li.appendChild(row);
      list.appendChild(li);
    });
    $("venuesFlow").innerHTML = (cfg.credits.venues || []).join('<i aria-hidden="true">◉</i>');

    /* archive */
    renderFilters();
    renderGrid();

    /* about */
    $("aboutParas").innerHTML = cfg.about.paragraphs.map(p => `<p>${p}</p>`).join("");
    $("aboutQuote").textContent = `“${cfg.about.quote}”`;
    const portrait = photosNow.concat(cfg.photos).find(p => p.category === "portrait" && imageUrl(p, 1200));
    const pf = $("aboutPortrait");
    pf.classList.toggle("has-img", !!portrait);
    pf.style.backgroundImage = portrait ? `url("${imageUrl(portrait, 1200)}")` : "";
    $("aboutStats").innerHTML = cfg.stats.map(s => `<div><dt>${s.number}</dt><dd>${s.label}</dd></div>`).join("");

    const words = cfg.testimonials || [];
    const box = $("aboutWords");
    clearInterval(wordsTimer);
    if (!words.length) box.style.display = "none";
    else {
      box.style.display = "";
      const show = () => {
        const w = words[wordsIdx % words.length];
        box.innerHTML = `<blockquote>“${w.quote}”<cite>${w.name}${w.role ? " · " + w.role : ""}</cite></blockquote>`;
        wordsIdx++;
      };
      show();
      if (!reduceMotion && words.length > 1) wordsTimer = setInterval(show, 5200);
    }

    observe();
  }

  /* clock */
  function tickClock() {
    $("dubaiClock").textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai",
    }).format(new Date());
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- boot + admin bridge ---------- */
  curate();
  render();
  loadFolders().then(() => { if (dynamicPhotos.length) render(); });

  window.BTF = {
    get config() { return cfg; },
    get photosNow() { return photosNow; },
    defaults: CONFIG,
    storageKey: STORAGE_KEY,
    update(next) { cfg = next; curate(); render(); },
    save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); return true; } catch { return false; } },
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      cfg = deepMerge(CONFIG, {});
      curate();
      loadFolders().then(render);
      render();
    },
    reloadFolders() {
      try {
        Object.keys(sessionStorage).filter(k => k.startsWith("btf-folder-")).forEach(k => sessionStorage.removeItem(k));
      } catch {}
      return loadFolders().then(render);
    },
    deepMerge,
  };
})();
