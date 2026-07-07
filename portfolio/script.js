/* ============================================================
   BETWEEN THE FRAMES — behavior
   Renders everything from CONFIG (config.js), merged with any
   edits saved by the admin panel (localStorage). No libraries.
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "btf-config-v1";

  /* ---------- config loading ---------- */
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
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch { return null; }
  }
  let cfg = deepMerge(CONFIG, loadSaved() || {});

  /* ---------- Google Drive link → image URL ---------- */
  function driveId(link) {
    if (!link) return null;
    const m =
      link.match(/\/d\/([\w-]{20,})/) ||
      link.match(/[?&]id=([\w-]{20,})/) ||
      link.match(/^([\w-]{25,})$/);
    return m ? m[1] : null;
  }
  function imageUrl(photo, size) {
    if (photo.src) return photo.src; /* direct/embedded URLs win */
    const id = driveId(photo.drive);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
    return null;
  }

  /* ---------- Google Drive FOLDERS → photos ----------
     Paste whole folder links in config.drive.folders and every
     image inside is loaded automatically (needs the free API key,
     see the admin panel / README). Results cache per session.   */
  let dynamicPhotos = [];
  function folderId(link) {
    if (!link) return null;
    const m = link.match(/\/folders\/([\w-]{20,})/) || link.match(/^([\w-]{25,})$/);
    return m ? m[1] : null;
  }
  async function fetchFolder(fid, apiKey) {
    const cacheKey = `btf-folder-${fid}`;
    try {
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) return JSON.parse(hit);
    } catch {}
    const q = encodeURIComponent(`'${fid}' in parents and mimeType contains 'image/' and trashed=false`);
    const fields = encodeURIComponent("files(id,name,imageMediaMetadata(width,height))");
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=name&pageSize=1000&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Drive API ${res.status}`);
    const data = await res.json();
    const files = data.files || [];
    try { sessionStorage.setItem(cacheKey, JSON.stringify(files)); } catch {}
    return files;
  }
  async function loadFolders() {
    const d = cfg.drive || {};
    if (!d.apiKey || !Array.isArray(d.folders) || !d.folders.length) {
      dynamicPhotos = [];
      return;
    }
    const groups = await Promise.all(
      d.folders.map(async f => {
        const fid = folderId(f.link);
        if (!fid) return [];
        try {
          const files = await fetchFolder(fid, d.apiKey);
          return files.map((file, i) => {
            const meta = file.imageMediaMetadata || {};
            const ratio = meta.width && meta.height ? meta.width / meta.height : 1.5;
            return {
              drive: file.id,
              src: "",
              title: f.label ? `${f.label} — frame ${String(i + 1).padStart(2, "0")}` : file.name.replace(/\.[a-z0-9]+$/i, ""),
              category: f.category || "events",
              artist: f.artist || "",
              year: f.year || "",
              wide: ratio > 1.7,
              featured: i < (f.featured ?? 0),
            };
          });
        } catch (err) {
          console.warn("Drive folder failed:", f.link, err);
          return [];
        }
      })
    );
    dynamicPhotos = groups.flat();
  }

  /* The list the page renders: manual photos + folder photos.
     Once a category has real folder photos, its empty placeholder
     entries step aside automatically. */
  function allPhotos() {
    const dynCats = new Set(dynamicPhotos.map(p => p.category));
    const manual = cfg.photos.filter(
      p => p.drive || p.src || !dynCats.has(p.category)
    );
    return manual.concat(dynamicPhotos);
  }

  /* ---------- art-directed placeholder (used until photos exist) ---------- */
  const PH_HUES = { comedy: [290, 20], concerts: [215, 24], events: [28, 14], fashion: [340, 20], sports: [200, 24], portrait: [45, 12] };
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
    img.loading = "lazy";
    img.onerror = () => img.replaceWith(placeholderEl(photo, index));
    return img;
  }

  /* ---------- theme ---------- */
  const THEME_VARS = {
    bg: "--bg", bgSoft: "--bg-soft", ink: "--ink", ink2: "--ink-2", muted: "--muted", line: "--line",
    accent: "--accent", accent2: "--accent-2", mark: "--mark", reelBg: "--reel-bg", reelInk: "--reel-ink",
  };
  function applyTheme(theme) {
    for (const [key, cssVar] of Object.entries(THEME_VARS)) {
      if (theme[key]) document.documentElement.style.setProperty(cssVar, theme[key]);
    }
  }

  /* ---------- tiny helpers ---------- */
  const $ = id => document.getElementById(id);
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  const catLabel = key => (cfg.categories.find(c => c.key === key) || {}).label || key;
  const norm = s => (s || "").trim().toLowerCase();
  const artistPhotosOf = name => photosNow.filter(p => norm(p.artist) === norm(name));

  /* ---------- preloader (counter as branding) ---------- */
  const loader = document.createElement("div");
  loader.setAttribute("aria-hidden", "true");
  loader.style.cssText =
    "position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;" +
    "justify-content:center;gap:1rem;font-family:'Space Grotesk',sans-serif;color:var(--accent);" +
    "letter-spacing:.3em;font-size:.75rem;transition:opacity .5s,visibility .5s";
  loader.innerHTML = `<span>FR</span><span id="loaderNum" style="font-variant-numeric:tabular-nums">000</span><span>DEVELOPING</span>`;
  document.body.prepend(loader);
  {
    const num = loader.querySelector("#loaderNum");
    const t0 = performance.now();
    const dur = reduceMotion ? 1 : 1100;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      num.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        setTimeout(() => loader.remove(), 600);
      }
    })(t0);
  }

  /* ---------- scroll reveals (re-attachable after render) ---------- */
  const io = new IntersectionObserver(
    entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  function observeReveals() {
    document.querySelectorAll(".sheet-frame, .reveal, .process__step, .about__quote").forEach(el => io.observe(el));
  }

  /* ---------- lightbox ---------- */
  let photosNow = [];   /* combined list, refreshed on every render */
  const lb = $("lightbox");
  let lbIndex = 0;
  function visibleIndices() {
    return photosNow.map((p, i) => i).filter(i => photoVisible(photosNow[i]));
  }
  function lightboxSize() {
    const px = Math.min(2200, Math.ceil(innerWidth * (devicePixelRatio || 1)));
    return px <= 900 ? 900 : px <= 1300 ? 1300 : px <= 1700 ? 1700 : 2200;
  }
  function renderLightbox() {
    const photo = photosNow[lbIndex];
    const url = imageUrl(photo, lightboxSize());
    const img = $("lightboxImg");
    const wrap = img.parentElement;
    wrap.querySelector(".ph")?.remove();
    img.style.display = url ? "" : "none";
    if (url) { img.src = url; img.alt = photo.title || ""; }
    else {
      const ph = placeholderEl(photo, lbIndex);
      ph.style.width = "min(76vw, 900px)";
      ph.style.aspectRatio = "3 / 2";
      wrap.appendChild(ph);
    }
    $("lightboxTitle").textContent = photo.title || "Untitled";
    $("lightboxFrame").textContent = `FR ${String(lbIndex + 1).padStart(3, "0")}`;
    $("lightboxMeta").textContent = `${catLabel(photo.category)} · ${photo.year || ""}`;
  }
  function openLightbox(idx) {
    lbIndex = idx;
    renderLightbox();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("lightboxClose").focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  function stepLightbox(dir) {
    const vis = visibleIndices();
    if (!vis.length) return;
    const pos = Math.max(0, vis.indexOf(lbIndex));
    lbIndex = vis[(pos + dir + vis.length) % vis.length];
    renderLightbox();
  }
  $("lightboxClose").addEventListener("click", closeLightbox);
  $("lightboxPrev").addEventListener("click", () => stepLightbox(-1));
  $("lightboxNext").addEventListener("click", () => stepLightbox(1));
  lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
    if (e.key === "Tab") { /* keep focus cycling inside the dialog */
      const focusables = lb.querySelectorAll("button");
      const list = [...focusables];
      const i = list.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i >= list.length - 1 ? 0 : i + 1);
      list[next].focus();
    }
  });

  /* ---------- gallery filter state ---------- */
  const filterState = { cat: "all", artist: null };

  function renderFilters() {
    const filters = document.querySelector(".work__filters");
    filters.innerHTML =
      `<button class="chip${filterState.cat === "all" && !filterState.artist ? " is-active" : ""}" data-filter="all" role="tab">All</button>` +
      cfg.categories.map(c =>
        `<button class="chip${filterState.cat === c.key && !filterState.artist ? " is-active" : ""}" data-filter="${c.key}" role="tab">${c.label}</button>`
      ).join("") +
      (filterState.artist
        ? `<button class="chip is-active" data-artist-clear="1" role="tab" title="Show everything again">${filterState.artist}&nbsp;&nbsp;✕</button>`
        : "");
    filters.querySelectorAll(".chip").forEach(chip => {
      chip.setAttribute("aria-selected", chip.classList.contains("is-active") ? "true" : "false");
      chip.addEventListener("click", () => {
        if (chip.dataset.artistClear) { filterState.artist = null; setArtistHash(null); }
        else { filterState.cat = chip.dataset.filter; filterState.artist = null; setArtistHash(null); }
        gridLimit = GRID_BATCH;
        renderFilters();
        applyGridFilter();
      });
    });
  }

  function photoVisible(p) {
    if (filterState.artist) return norm(p.artist) === norm(filterState.artist);
    return filterState.cat === "all" || p.category === filterState.cat;
  }

  const GRID_BATCH = 36;
  let gridLimit = GRID_BATCH;

  function applyGridFilter() {
    renderGrid();
  }

  function renderGrid() {
    const grid = $("workGrid");
    grid.innerHTML = "";
    grid.parentElement.querySelector(".work__more")?.remove();
    const matches = photosNow.map((p, i) => i).filter(i => photoVisible(photosNow[i]));
    matches.slice(0, gridLimit).forEach(idx => {
      const photo = photosNow[idx];
      const cell = document.createElement("figure");
      cell.className = "sheet-frame" + (photo.wide ? " sheet-frame--wide" : "");
      cell.dataset.category = photo.category;
      cell.dataset.index = idx;
      cell.appendChild(frameMedia(photo, idx, 1000));
      const bar = document.createElement("figcaption");
      bar.className = "sheet-frame__bar";
      bar.innerHTML = `<span>${photo.title || ""}</span><span class="sheet-frame__num">FR ${String(idx + 1).padStart(3, "0")}</span>`;
      cell.appendChild(bar);
      cell.addEventListener("click", () => openLightbox(idx));
      grid.appendChild(cell);
      io.observe(cell);
    });
    if (matches.length > gridLimit) {
      const more = document.createElement("button");
      more.className = "work__more";
      more.textContent = `Load ${Math.min(GRID_BATCH, matches.length - gridLimit)} more frames (${matches.length - gridLimit} left)`;
      more.addEventListener("click", () => { gridLimit += GRID_BATCH; renderGrid(); });
      grid.parentElement.appendChild(more);
    }
    $("workEmpty").hidden = matches.length > 0;
  }

  function setArtistHash(name) {
    const keep = location.hash.replace("#", "").split("&").filter(p => p && !p.startsWith("artist="));
    if (name) keep.push("artist=" + encodeURIComponent(name));
    history.replaceState(null, "", keep.length ? "#" + keep.join("&") : location.pathname + location.search);
  }

  function showArtist(name, scroll = true) {
    filterState.artist = name;
    filterState.cat = "all";
    gridLimit = GRID_BATCH;
    setArtistHash(name);
    renderFilters();
    applyGridFilter();
    if (scroll) $("work").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ---------- render everything from config ---------- */
  let rotatorTimer = null;

  function render() {
    photosNow = allPhotos();
    applyTheme(cfg.theme);

    /* text bindings */
    document.querySelectorAll("[data-bind]").forEach(el => {
      const val = getPath(cfg, el.dataset.bind);
      if (val !== undefined) el.textContent = val;
    });

    document.title = `${cfg.site.name} — ${cfg.site.tagline}`;
    $("footerName").textContent = `© ${new Date().getFullYear()} ${cfg.site.name}`;
    $("emailLink").href = `mailto:${cfg.site.email}?subject=${encodeURIComponent("Photography enquiry")}`;
    $("whatsappLink").href = `https://wa.me/${cfg.site.whatsapp}`;
    $("instagramLink").href = `https://instagram.com/${cfg.site.instagram}`;

    /* credits heading keeps its accent word */
    $("creditsHeading").innerHTML = "";
    const ch = (cfg.credits.heading || "").split(" ");
    const last = ch.pop();
    $("creditsHeading").append(ch.join(" ") + " ");
    const em = document.createElement("em");
    em.textContent = last;
    $("creditsHeading").appendChild(em);

    /* rotator */
    const rot = $("rotator");
    rot.innerHTML = "";
    (cfg.hero.rotator.length ? cfg.hero.rotator : ["event"]).forEach((w, i) => {
      const s = document.createElement("span");
      s.textContent = w;
      if (i === 0) s.classList.add("is-active");
      rot.appendChild(s);
    });
    clearInterval(rotatorTimer);
    if (!reduceMotion && cfg.hero.rotator.length > 1) {
      let wi = 0;
      rotatorTimer = setInterval(() => {
        const words = rot.querySelectorAll("span");
        words[wi].classList.remove("is-active");
        wi = (wi + 1) % words.length;
        words[wi].classList.add("is-active");
      }, 2600);
    }

    /* ticker (duplicated for a seamless -50% loop) */
    const items = cfg.ticker.map(t => `<span>${t}</span><i>◉</i>`).join("");
    $("tickerTrack").innerHTML = items + items;

    /* featured reel */
    const reelFrames = $("reelFrames");
    reelFrames.innerHTML = "";
    photosNow.forEach((photo, idx) => {
      if (!photo.featured) return;
      const frame = document.createElement("figure");
      frame.className = "reel__frame";
      frame.appendChild(frameMedia(photo, idx, 1200));
      const tag = document.createElement("figcaption");
      tag.className = "reel__frame-tag";
      tag.textContent = `FR ${String(idx + 1).padStart(3, "0")} · ${catLabel(photo.category)}`;
      frame.appendChild(tag);
      frame.addEventListener("click", () => { if (!$("reelStrip").dataset.dragged) openLightbox(idx); });
      reelFrames.appendChild(frame);
    });

    /* credits lists */
    $("venuesList").innerHTML = cfg.credits.venues.map(v => `<li>${v}</li>`).join("");
    const artistsList = $("artistsList");
    artistsList.innerHTML = "";
    cfg.credits.artists.forEach(a => {
      const entry = typeof a === "string" ? { name: a, note: "" } : a;
      const li = document.createElement("li");
      const shots = artistPhotosOf(entry.name);
      const row = document.createElement(shots.length ? "button" : "div");
      row.className = "artist-row" + (shots.length ? "" : " artist-row--static");
      row.innerHTML =
        `<span class="artist-row__arrow" aria-hidden="true">\u25c9</span>` +
        `<span class="artist-row__name">${entry.name}</span>` +
        (entry.note ? `<span class="artist-row__note">${entry.note}</span>` : "") +
        (shots.length ? `<span class="artist-row__count">${shots.length} fr</span>` : "");
      if (shots.length) {
        row.setAttribute("aria-label", `Show ${shots.length} photographs of ${entry.name}`);
        row.addEventListener("click", () => showArtist(entry.name));
        row.addEventListener("pointerenter", () => startArtistPeek(entry.name));
        row.addEventListener("pointerleave", stopArtistPeek);
      }
      li.appendChild(row);
      artistsList.appendChild(li);
    });

    /* about */
    $("aboutParagraphs").innerHTML = cfg.about.paragraphs.map(p => `<p>${p}</p>`).join("");
    $("aboutQuote").textContent = `“${cfg.about.quote}”`;
    const portraitPhoto = photosNow.find(p => p.category === "portrait" && imageUrl(p, 1200));
    const pf = $("aboutPortrait");
    pf.classList.toggle("has-img", !!portraitPhoto);
    pf.style.backgroundImage = portraitPhoto ? `url("${imageUrl(portraitPhoto, 1200)}")` : "";

    /* stats */
    $("statsStrip").innerHTML = cfg.stats
      .map(s => `<div class="stats__cell reveal"><span class="stats__num">${s.number}</span><span class="stats__label">${s.label}</span></div>`)
      .join("");

    /* filters (from config categories + artist deep-filter) */
    renderFilters();

    /* contact sheet grid (batched — folders can hold hundreds of frames) */
    renderGrid();

    /* kind words */
    const words = cfg.testimonials || [];
    $("words").style.display = words.length ? "" : "none";
    $("wordsGrid").innerHTML = words.map(w =>
      `<div class="words__card reveal"><p class="words__quote">${w.quote}</p>` +
      `<p class="words__who"><b>${w.name}</b>${w.role ? " \u00b7 " + w.role : ""}</p></div>`
    ).join("");

    /* process steps */
    $("processSteps").innerHTML = cfg.process.steps
      .map(s => `<li class="process__step"><h3>${s.title}</h3><p>${s.text}</p></li>`)
      .join("");
    const ph = cfg.process.heading.split(" ");
    const phLast = ph.pop();
    $("processHeading").innerHTML = "";
    $("processHeading").append(ph.join(" ") + " ");
    const em2 = document.createElement("em");
    em2.textContent = phLast;
    $("processHeading").appendChild(em2);

    observeReveals();
    setPeekImage(0);
  }

  /* ---------- one-time interactions ---------- */

  /* drag-to-scroll on the reel */
  const strip = $("reelStrip");
  let dragStartX = 0, dragStartScroll = 0, dragging = false;
  strip.addEventListener("pointerdown", e => {
    dragging = true;
    delete strip.dataset.dragged;
    dragStartX = e.clientX;
    dragStartScroll = strip.scrollLeft;
    strip.classList.add("is-dragging");
  });
  window.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    if (Math.abs(dx) > 6) strip.dataset.dragged = "1";
    strip.scrollLeft = dragStartScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
    strip.classList.remove("is-dragging");
    setTimeout(() => delete strip.dataset.dragged, 50);
  });

  /* cursor-following peek in hero */
  const hero = $("hero");
  const peek = $("heroPeek");
  const peekInner = $("heroPeekInner");
  let peekTarget = { x: 0, y: 0 }, peekPos = { x: 0, y: 0 }, peekShot = -1;
  function peekPhotos() {
    const feat = photosNow.filter(p => p.featured);
    return feat.length ? feat : photosNow;
  }
  function setPeekImage(i) {
    const pool = peekPhotos();
    if (!pool.length) return;
    const photo = pool[((i % pool.length) + pool.length) % pool.length];
    const url = imageUrl(photo, 800);
    peekInner.style.backgroundImage = url
      ? `url("${url}")`
      : `linear-gradient(150deg, hsl(28 25% 32%), hsl(20 18% 14%))`;
  }
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      peekTarget.x = e.clientX - r.left;
      peekTarget.y = e.clientY - r.top;
      const shot = Math.floor((e.clientX / innerWidth) * peekPhotos().length);
      if (shot !== peekShot) { peekShot = shot; setPeekImage(shot); }
    });
    (function lerpPeek() {
      peekPos.x += (peekTarget.x - peekPos.x) * 0.08;
      peekPos.y += (peekTarget.y - peekPos.y) * 0.08;
      peek.style.transform =
        `translate(${peekPos.x - peek.offsetWidth / 2}px, ${peekPos.y - peek.offsetHeight * 0.55}px) rotate(${(peekTarget.x - peekPos.x) * 0.02}deg)`;
      requestAnimationFrame(lerpPeek);
    })();
  }

  /* floating photo peek over artist names (cycles their frames) */
  const hoverPeek = document.createElement("div");
  hoverPeek.className = "hover-peek";
  hoverPeek.setAttribute("aria-hidden", "true");
  document.body.appendChild(hoverPeek);
  let peekCycle = null;
  function startArtistPeek(name) {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    const shots = artistPhotosOf(name).filter(p => imageUrl(p, 600));
    let i = 0;
    const show = () => {
      const url = shots.length ? imageUrl(shots[i % shots.length], 600) : null;
      hoverPeek.style.backgroundImage = url
        ? `url("${url}")`
        : `linear-gradient(150deg, hsl(28 25% 32%), hsl(20 18% 14%))`;
      i++;
    };
    show();
    clearInterval(peekCycle);
    peekCycle = setInterval(show, 900);
    hoverPeek.classList.add("is-on");
  }
  function stopArtistPeek() {
    clearInterval(peekCycle);
    hoverPeek.classList.remove("is-on");
  }

  /* vertical wheel drives the film strip sideways while hovering it */
  strip.addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      strip.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  /* clicking the hero opens the photo the peek is showing */
  hero.addEventListener("click", e => {
    if (e.target.closest("a, button")) return;
    if (!matchMedia("(hover: hover)").matches) return;
    const pool = peekPhotos();
    if (!pool.length) return;
    const photo = pool[((peekShot % pool.length) + pool.length) % pool.length];
    const idx = photosNow.indexOf(photo);
    if (idx >= 0) openLightbox(idx);
  });

  /* context-aware cursor label over gallery frames */
  const cursorLabel = $("cursorLabel");
  document.addEventListener("pointermove", e => {
    cursorLabel.style.left = e.clientX + "px";
    cursorLabel.style.top = e.clientY + "px";
    const overFrame = e.target.closest(".sheet-frame, .reel__frame");
    const overArtist = e.target.closest(".artist-row:not(.artist-row--static)");
    const overHero = e.target.closest(".hero") && !e.target.closest("a, button");
    let label = null;
    if (overFrame) label = "VIEW";
    else if (overArtist) label = "FRAMES";
    else if (overHero) label = "OPEN";
    if (label) cursorLabel.textContent = label;
    cursorLabel.classList.toggle("is-on", !!label && lb.hidden);
    const px = Math.min(e.clientX + 36, innerWidth - hoverPeek.offsetWidth - 16);
    const py = Math.min(Math.max(e.clientY - hoverPeek.offsetHeight / 2, 16), innerHeight - hoverPeek.offsetHeight - 16);
    hoverPeek.style.transform = `translate(${px}px, ${py}px)`;
  });

  /* frame counter = scroll progress */
  const counter = $("frameCounter");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    counter.textContent = String(Math.round(p * 100)).padStart(3, "0");
  }, { passive: true });

  /* live Dubai clock */
  function tickClock() {
    $("dubaiClock").textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai",
    }).format(new Date());
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- boot + admin bridge ---------- */
  render();
  function applyArtistDeepLink() {
    const p = location.hash.replace("#", "").split("&").find(x => x.startsWith("artist="));
    if (!p) return;
    const name = decodeURIComponent(p.slice(7));
    if (artistPhotosOf(name).length) showArtist(name, false);
  }
  applyArtistDeepLink();
  loadFolders().then(() => { if (dynamicPhotos.length) { render(); applyArtistDeepLink(); } });

  window.BTF = {
    get config() { return cfg; },
    defaults: CONFIG,
    storageKey: STORAGE_KEY,
    update(next) { cfg = next; render(); },
    get photosNow() { return photosNow; },
    save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); return true; }
      catch { return false; }
    },
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      cfg = deepMerge(CONFIG, {});
      loadFolders().then(render);
      render();
    },
    reloadFolders() {
      try {
        Object.keys(sessionStorage)
          .filter(k => k.startsWith("btf-folder-"))
          .forEach(k => sessionStorage.removeItem(k));
      } catch {}
      return loadFolders().then(render);
    },
    deepMerge,
  };
})();
