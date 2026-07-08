/* ============================================================
   THE PRINT ROOM — prototype B engine.
   Same CONFIG (config.js), same saved edits, same admin panel
   as design A — only the presentation differs.
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORAGE_KEY = "btf-config-v1"; /* shared with design A on purpose */

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
  const printroom = () => Object.assign(
    { coverLine1: "A private", coverLine2: "viewing.", medium: "Archival pigment print" },
    cfg.printroom || {}
  );

  /* ---------- Drive plumbing (same as design A) ---------- */
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
    const cacheKey = `btf-folder-${fid}`;
    try { const hit = sessionStorage.getItem(cacheKey); if (hit) return JSON.parse(hit); } catch {}
    const q = encodeURIComponent(`'${fid}' in parents and mimeType contains 'image/' and trashed=false`);
    const fields = encodeURIComponent("files(id,name,imageMediaMetadata(width,height))");
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
            title: f.label ? `${f.label} — frame ${String(i + 1).padStart(2, "0")}` : file.name.replace(/\.[a-z0-9]+$/i, ""),
            category: f.category || "events", artist: f.artist || "", year: f.year || "",
            wide: ratio > 1.7, featured: i < (f.featured ?? 0),
          };
        });
      } catch (err) { console.warn("Drive folder failed:", f.link, err); return []; }
    }));
    dynamicPhotos = groups.flat();
  }
  function allPhotos() {
    const dynCats = new Set(dynamicPhotos.map(p => p.category));
    return cfg.photos.filter(p => p.drive || p.src || !dynCats.has(p.category)).concat(dynamicPhotos);
  }

  /* ---------- placeholder ---------- */
  const PH_HUES = { comedy: [290, 20], concerts: [215, 24], events: [28, 14], sports: [200, 24], portrait: [45, 12] };
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

  /* ---------- theme ---------- */
  const THEME_VARS = {
    bg: "--bg", bgSoft: "--bg-soft", ink: "--ink", ink2: "--ink-2", muted: "--muted", line: "--line",
    accent: "--accent", accent2: "--accent-2", mark: "--mark", reelBg: "--reel-bg", reelInk: "--reel-ink",
  };
  function applyTheme(theme) {
    for (const [k, v] of Object.entries(THEME_VARS)) if (theme[k]) document.documentElement.style.setProperty(v, theme[k]);
  }

  /* ---------- helpers ---------- */
  const $ = id => document.getElementById(id);
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  const norm = s => (s || "").trim().toLowerCase();
  let photosNow = [];
  const artistPhotosOf = name => photosNow.filter(p => norm(p.artist) === norm(name));
  let collected = new Set();
  try { collected = new Set(JSON.parse(localStorage.getItem("btf-collected") || "[]")); } catch {}
  const photoKey = photo => photo.drive || photo.src || photo.title || "untitled";
  const plateText = photo => {
    const bits = [photo.title || "Untitled", photo.year, printroom().medium].filter(Boolean);
    return bits.join(" · ");
  };

  /* ---------- preloader (first visit per session only) ---------- */
  let seenLoader = false;
  try { seenLoader = sessionStorage.getItem("btf-visited") === "1"; sessionStorage.setItem("btf-visited", "1"); } catch {}
  const loader = document.createElement("div");
  loader.setAttribute("aria-hidden", "true");
  loader.style.cssText =
    "position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;justify-content:center;gap:1rem;" +
    "font-family:'Space Grotesk',sans-serif;color:var(--accent);letter-spacing:.3em;font-size:.75rem;transition:opacity .5s,visibility .5s";
  loader.innerHTML = `<span>FR</span><span id="ldn" style="font-variant-numeric:tabular-nums">000</span><span>HANGING PRINTS</span>`;
  document.body.prepend(loader);
  {
    const num = loader.querySelector("#ldn");
    const t0 = performance.now(), dur = (reduceMotion || seenLoader) ? 1 : 1100;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      num.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else { loader.style.opacity = "0"; loader.style.visibility = "hidden"; setTimeout(() => loader.remove(), 600); }
    })(t0);
  }

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver(
    es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );

  /* ---------- generic horizontal track behaviors ----------
     - drag applies to mouse only (touch gets native scrolling)
     - vertical wheel drives the track ONLY while it still has
       somewhere to go; at either end the page scrolls on normally,
       so you're never trapped in a horizontal section. */
  function trackBehaviors(track, opts = {}) {
    let sx = 0, ss = 0, dragging = false;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse") return;
      dragging = true; delete track.dataset.dragged;
      sx = e.clientX; ss = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 6) track.dataset.dragged = "1";
      track.scrollLeft = ss - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false; track.classList.remove("is-dragging");
      setTimeout(() => delete track.dataset.dragged, 50);
    });

    /* Wheel: paged mode advances exactly one panel per gesture
       (snap-friendly); continuous mode nudges freely. Both RELEASE
       to normal page scrolling at either end of the track. */
    let acc = 0, lockUntil = 0;
    track.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; /* native horizontal */
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = e.deltaY > 0 && track.scrollLeft >= max - 2;
      const atStart = e.deltaY < 0 && track.scrollLeft <= 2;
      if (atEnd || atStart || max <= 0) return;             /* let the page move on */
      e.preventDefault();
      if (!opts.paged) { track.scrollLeft += e.deltaY; return; }
      const now = performance.now();
      if (now < lockUntil) return;                          /* one panel per gesture */
      acc += e.deltaY;
      if (Math.abs(acc) < 50) return;
      const dir = Math.sign(acc);
      acc = 0;
      lockUntil = now + 500;
      track.scrollBy({ left: dir * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    }, { passive: false });
  }

  /* ---------- zoom ---------- */
  const zoom = $("zoom");
  let zoomPhoto = null, zoomFr = 1;
  function openZoom(photo, idx) {
    zoomPhoto = photo;
    zoomFr = Math.max(1, photosNow.indexOf(photo) + 1);
    refreshZoomCollect();
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
    $("zoomPlate").textContent = plateText(photo);
    zoom.hidden = false;
  }
  function refreshZoomCollect() {
    if (!zoomPhoto) return;
    const on = collected.has(photoKey(zoomPhoto));
    $("zoomCollect").textContent = on ? "\u25cf Collected \u2014 return it" : "\u25cf Collect this frame";
    $("zoomCollect").classList.toggle("is-on", on);
  }
  $("zoomCollect").addEventListener("click", () => {
    if (!zoomPhoto) return;
    toggleCollect(zoomPhoto);
    refreshZoomCollect();
  });
  $("zoomPostcard").addEventListener("click", () => {
    if (zoomPhoto) makePostcard(zoomPhoto, zoomFr);
  });
  $("zoomClose").addEventListener("click", () => { zoom.hidden = true; });
  zoom.addEventListener("click", e => { if (e.target === zoom) zoom.hidden = true; });

  /* ---------- exhibition room overlay ---------- */
  const roomview = $("roomview");
  const ROOM_CAP = 80;
  function openRoom(name, note) {
    const shots = name ? artistPhotosOf(name) : photosNow.filter(p => p.category !== "portrait");
    $("roomviewName").textContent = name || "The full archive";
    $("roomviewNote").textContent = note || (name ? "Exhibition" : `Every frame · ${shots.length} prints`);
    const track = $("roomviewTrack");
    track.innerHTML = "";
    shots.slice(0, ROOM_CAP).forEach((photo, i) => {
      const item = document.createElement("figure");
      item.className = "roomview__item";
      const print = document.createElement("div");
      print.className = "roomview__print";
      print.appendChild(frameMedia(photo, i, 1300));
      print.addEventListener("click", () => { if (!track.dataset.dragged) openZoom(photo, i); });
      item.appendChild(print);
      const plate = document.createElement("figcaption");
      plate.className = "wall__plate";
      plate.innerHTML = `<strong>FR ${String(i + 1).padStart(3, "0")}</strong>${plateText(photo)}`;
      armPlate(plate, photo);
      item.appendChild(plate);
      track.appendChild(item);
    });
    if (shots.length > ROOM_CAP) {
      const more = document.createElement("p");
      more.className = "roomview__hint";
      more.style.alignSelf = "center";
      more.textContent = `+ ${shots.length - ROOM_CAP} more in the full gallery`;
      track.appendChild(more);
    }
    roomview.hidden = false;
    document.body.style.overflow = "hidden";
    $("roomviewClose").focus();
    track.scrollLeft = 0;
  }
  function closeRoom() {
    roomview.hidden = true;
    document.body.style.overflow = "";
  }
  $("roomviewClose").addEventListener("click", closeRoom);
  document.addEventListener("keydown", e => {
    if (!zoom.hidden && e.key === "Escape") { zoom.hidden = true; return; }
    if (!roomview.hidden) {
      if (e.key === "Escape") closeRoom();
      if (e.key === "ArrowRight") $("roomviewTrack").scrollLeft += innerWidth * 0.5;
      if (e.key === "ArrowLeft") $("roomviewTrack").scrollLeft -= innerWidth * 0.5;
    }
  });
  trackBehaviors($("roomviewTrack"));

  /* ---------- walls ---------- */
  const wallsTrack = $("wallsTrack");
  trackBehaviors(wallsTrack, { paged: true });
  $("wallsPrev").addEventListener("click", () => wallsTrack.scrollBy({ left: -wallsTrack.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }));
  $("wallsNext").addEventListener("click", () => wallsTrack.scrollBy({ left: wallsTrack.clientWidth, behavior: reduceMotion ? "auto" : "smooth" }));
  wallsTrack.addEventListener("scroll", () => updateWallCount(), { passive: true });
  function updateWallCount() {
    const walls = wallsTrack.children.length;
    if (!walls) return;
    const i = Math.round(wallsTrack.scrollLeft / wallsTrack.clientWidth) + 1;
    $("wallsCount").textContent = `wall ${String(Math.min(i, walls)).padStart(2, "0")} / ${String(walls).padStart(2, "0")} — click a print to zoom`;
  }

  /* ---------- hover peek over artist rows ---------- */
  const hoverPeek = document.createElement("div");
  hoverPeek.className = "hover-peek";
  hoverPeek.setAttribute("aria-hidden", "true");
  document.body.appendChild(hoverPeek);
  let peekCycle = null;
  function startPeek(name) {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    const shots = artistPhotosOf(name).filter(p => imageUrl(p, 600));
    let i = 0;
    const show = () => {
      const url = shots.length ? imageUrl(shots[i % shots.length], 600) : null;
      hoverPeek.style.backgroundImage = url ? `url("${url}")` : `linear-gradient(150deg, hsl(28 25% 32%), hsl(20 18% 14%))`;
      i++;
    };
    show();
    clearInterval(peekCycle);
    peekCycle = setInterval(show, 900);
    hoverPeek.classList.add("is-on");
  }
  function stopPeek() { clearInterval(peekCycle); hoverPeek.classList.remove("is-on"); }

  /* ---------- cursor label (rAF-throttled, transform-only, no layout reads) ---------- */
  const cursorLabel = $("cursorLabel");
  let peekW = 200, peekH = 266;                 /* cached; refreshed when the peek shows */
  new ResizeObserver(en => {
    if (en[0]) { peekW = en[0].contentRect.width; peekH = en[0].contentRect.height; }
  }).observe(hoverPeek);
  let ptrX = 0, ptrY = 0, ptrTarget = null, ptrQueued = false;
  document.addEventListener("pointermove", e => {
    ptrX = e.clientX; ptrY = e.clientY; ptrTarget = e.target;
    if (ptrQueued) return;
    ptrQueued = true;
    requestAnimationFrame(() => {
      ptrQueued = false;
      let label = null;
      if (ptrTarget.closest?.(".wall__print, .roomview__print")) label = "ZOOM";
      else if (ptrTarget.closest?.("button.show-row")) label = "ENTER";
      if (label) cursorLabel.textContent = label;
      cursorLabel.classList.toggle("is-on", !!label && zoom.hidden);
      cursorLabel.style.transform = `translate3d(${ptrX}px, ${ptrY}px, 0) translate(-50%, -50%)`;
      const px = Math.min(ptrX + 36, innerWidth - peekW - 16);
      const py = Math.min(Math.max(ptrY - peekH / 2, 16), innerHeight - peekH - 16);
      hoverPeek.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    });
  }, { passive: true });

  /* ============================================================
     EASTER EGGS — five secrets hang in this gallery.
     1. Click a label plate → a red collector's dot (galleries mark
        sold works with red dots). Your collection is remembered.
     2. Press "f" → the room fires a camera flash.
     3. Type "noir" → the gallery rehangs in darkroom light.
        Type "ivory" → daylight again. (Never saved — just a mood.)
     4. Click the DXB clock → how long until Dubai's golden hour.
     5. Reach the end of the gallery → the visitors' book notices.
     ============================================================ */

  /* toast for whispers */
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

  /* 1 · the collector's red dot — plates, zoom button, and the tray */
  function persistCollected() {
    try { localStorage.setItem("btf-collected", JSON.stringify([...collected])); } catch {}
  }
  function syncPlates(key) {
    document.querySelectorAll(`.wall__plate[data-key]`).forEach(p => {
      if (p.dataset.key === key) p.classList.toggle("is-collected", collected.has(key));
    });
  }
  function toggleCollect(photo, quiet) {
    const key = photoKey(photo);
    if (collected.has(key)) {
      collected.delete(key);
      if (!quiet) whisper("Returned to the wall.");
    } else {
      collected.add(key);
      const n = collected.size;
      if (!quiet) whisper(n === 1
        ? "A red dot — this frame is yours now."
        : `Collected. ${n} frames in your private collection.`);
    }
    persistCollected();
    syncPlates(key);
    refreshDock();
    return collected.has(key);
  }
  function armPlate(plate, photo) {
    const key = photoKey(photo);
    plate.dataset.key = key;
    if (collected.has(key)) plate.classList.add("is-collected");
    plate.addEventListener("click", () => toggleCollect(photo));
  }

  /* ---- the collection tray: what visitors take away ---- */
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
    return photosNow
      .map((p, i) => ({ photo: p, fr: i + 1 }))
      .filter(x => collected.has(photoKey(x.photo)));
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
    list.innerHTML = picks.length ? "" : `<li class="tray__empty">Nothing collected yet — click a print's label plate.</li>`;
    picks.forEach(({ photo, fr }) => {
      const li = document.createElement("li");
      const url = imageUrl(photo, 300);
      li.innerHTML =
        `<span class="tray__thumb" style="${url ? `background-image:url('${url}')` : "background:linear-gradient(150deg,hsl(28 25% 30%),hsl(20 18% 12%))"}"></span>` +
        `<span class="tray__meta"><b>FR ${String(fr).padStart(3, "0")}</b>${photo.title || "Untitled"}</span>`;
      const rm = document.createElement("button");
      rm.className = "tray__rm";
      rm.setAttribute("aria-label", `Return FR ${fr}`);
      rm.textContent = "✕";
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
    document.querySelectorAll(".wall__plate.is-collected").forEach(p => p.classList.remove("is-collected"));
    refreshDock();
    buildTray();
    whisper("Every frame returned to the wall.");
  });
  refreshDock();

  /* ---- the postcard: a souvenir any visitor can leave with ---- */
  async function makePostcard(photo, fr) {
    const W = 1500, H = 1060;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const t = cfg.theme;
    /* card + gilded double border */
    x.fillStyle = t.bg || "#fbfaf6";
    x.fillRect(0, 0, W, H);
    x.strokeStyle = t.accent || "#7a4f1d";
    x.lineWidth = 3;
    x.strokeRect(34, 34, W - 68, H - 68);
    x.lineWidth = 1;
    x.strokeRect(48, 48, W - 96, H - 96);
    /* the print: dark frame + white matte */
    const px = 150, py = 110, pw = W - 300, ph = 620;
    x.fillStyle = "#2a231a";
    x.fillRect(px - 16, py - 16, pw + 32, ph + 32);
    x.fillStyle = "#ffffff";
    x.fillRect(px, py, pw, ph);
    const ix = px + 26, iy = py + 26, iw = pw - 52, ih = ph - 52;
    const url = imageUrl(photo, 1300);
    let drawn = false;
    if (url) {
      try {
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = url;
        });
        const scale = Math.max(iw / img.width, ih / img.height);
        const sw = iw / scale, sh = ih / scale;
        x.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, ix, iy, iw, ih);
        drawn = true;
      } catch {}
    }
    if (!drawn) {
      const g = x.createLinearGradient(ix, iy, ix + iw, iy + ih);
      g.addColorStop(0, "hsl(28 24% 26%)");
      g.addColorStop(1, "hsl(215 20% 12%)");
      x.fillStyle = g;
      x.fillRect(ix, iy, iw, ih);
      x.fillStyle = "rgba(241,234,221,0.75)";
      x.font = "italic 300 44px Fraunces, Georgia, serif";
      x.textAlign = "center";
      x.fillText("awaiting film", ix + iw / 2, iy + ih / 2);
    }
    /* the plate text */
    x.textAlign = "center";
    x.fillStyle = t.accent || "#7a4f1d";
    x.font = "600 24px 'Space Grotesk', sans-serif";
    x.fillText(`FR ${String(fr).padStart(3, "0")} · ${(photo.artist || photo.category || "").toUpperCase()}`, W / 2, py + ph + 88);
    x.fillStyle = t.ink || "#161410";
    x.font = "italic 400 42px Fraunces, Georgia, serif";
    x.fillText(photo.title || "Untitled", W / 2, py + ph + 148, W - 320);
    x.fillStyle = t.muted || "#5f5a4a";
    x.font = "300 26px 'Space Grotesk', sans-serif";
    x.fillText(`${cfg.site.name} \u2014 The Print Room, Dubai \u00b7 @${cfg.site.instagram}`, W / 2, py + ph + 210);
    try {
      const blob = await new Promise(res => cv.toBlob(res, "image/png"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `postcard-fr-${String(fr).padStart(3, "0")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      whisper("Your postcard is in your downloads \u2014 send it to someone.");
    } catch {
      whisper("The postcard printer jammed \u2014 try another frame.");
    }
  }

  /* 2 · press "f" for flash — 3 · type noir / ivory to rehang */
  const flash = document.createElement("div");
  flash.className = "flash";
  flash.setAttribute("aria-hidden", "true");
  document.body.appendChild(flash);
  const NOIR = { bg: "#14110e", bgSoft: "#1e1a16", ink: "#f1eadd", ink2: "#c6bca7", muted: "#948b78", line: "#2c261e", accent: "#c9a26b", accent2: "#e4c186", mark: "#d9482b", reelBg: "#0c0a08", reelInk: "#efe8da" };
  let typed = "";
  document.addEventListener("keydown", e => {
    if (e.target.closest("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "f") {
      flash.classList.remove("is-firing");
      void flash.offsetWidth; /* restart the animation */
      flash.classList.add("is-firing");
      whisper("1/2000 s \u00b7 f/1.8 \u00b7 got it.", 1600);
      return;
    }
    if (k.length === 1) {
      typed = (typed + k).slice(-8);
      if (typed.endsWith("noir")) { applyTheme(NOIR); whisper("The gallery rehangs after dark. Type \u201civory\u201d for daylight."); }
      if (typed.endsWith("ivory")) { applyTheme(cfg.theme); whisper("Daylight restored."); }
    }
  });

  /* 4 · the clock knows golden hour */
  const SUNSET_BY_MONTH = [17.9, 18.2, 18.5, 18.75, 19.0, 19.2, 19.25, 19.0, 18.6, 18.1, 17.7, 17.6];
  function goldenHourWhisper() {
    const now = new Date();
    const dxb = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dubai" }));
    const sunset = SUNSET_BY_MONTH[dxb.getMonth()];
    const t = dxb.getHours() + dxb.getMinutes() / 60;
    const start = sunset - 1;
    if (t >= start && t <= sunset) { whisper("It's golden hour in Dubai right now \u2014 someone should be shooting."); return; }
    let hrs = t < start ? start - t : 24 - t + start;
    const h = Math.floor(hrs), m = Math.round((hrs - h) * 60);
    whisper(`Golden hour in Dubai in ${h ? h + "h " : ""}${m}m.`);
  }
  ["railClock", "dubaiClock"].forEach(id => {
    const el = $(id);
    el.style.cursor = "help";
    el.addEventListener("click", goldenHourWhisper);
  });

  /* 5 · the visitors' book notices you made it */
  let bowed = false;
  new IntersectionObserver(es => {
    es.forEach(en => {
      if (en.isIntersecting && !bowed) {
        bowed = true;
        whisper("You've walked every room \u2014 the visitors' book is right here.", 4200);
      }
    });
  }, { threshold: 0.9 }).observe(document.querySelector(".visit__footer"));

  /* a note for the curious */
  console.log(
    "%c\u25a3 The Print Room %c\nfive secrets hang in this gallery \u2014 a red dot, a flash,\na darker hang, golden hour, and a bow at the end.",
    "font-family:Georgia,serif;font-size:16px;font-style:italic;color:#8d5f28",
    "color:#71674f;font-size:11px;line-height:1.6"
  );

  /* ---------- rail active room ---------- */
  const roomIO = new IntersectionObserver(es => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      document.querySelectorAll(".rail__index a").forEach(a =>
        a.classList.toggle("is-here", a.dataset.room === en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["cover", "walls", "shows", "her", "visit"].forEach(id => roomIO.observe($(id)));

  /* ---------- clocks ---------- */
  function tickClock() {
    const t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }).format(new Date());
    $("dubaiClock").textContent = t;
    $("railClock").textContent = t;
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- testimonial rotation ---------- */
  let wordsTimer = null, wordsIdx = 0;
  function rotateWords() {
    const box = $("herWords");
    const list = cfg.testimonials || [];
    clearInterval(wordsTimer);
    if (!list.length) { box.style.display = "none"; return; }
    box.style.display = "";
    const show = () => {
      const w = list[wordsIdx % list.length];
      box.innerHTML = `<blockquote>“${w.quote}”<cite>${w.name}${w.role ? " · " + w.role : ""}</cite></blockquote>`;
      wordsIdx++;
    };
    show();
    if (!reduceMotion && list.length > 1) wordsTimer = setInterval(show, 5200);
  }

  /* ---------- render ---------- */
  function render() {
    photosNow = allPhotos();
    applyTheme(cfg.theme);
    const pr = printroom();

    document.querySelectorAll("[data-bind]").forEach(el => {
      const val = getPath(cfg, el.dataset.bind);
      if (val !== undefined) el.textContent = val;
    });
    document.title = `The Print Room — ${cfg.site.name}`;
    $("railName").textContent = cfg.site.name;
    $("footerName").textContent = `© ${new Date().getFullYear()} ${cfg.site.name}`;
    $("emailLink").href = `mailto:${cfg.site.email}?subject=${encodeURIComponent("Photography enquiry")}`;
    $("whatsappLink").href = `https://wa.me/${cfg.site.whatsapp}`;
    $("instagramLink").href = `https://instagram.com/${cfg.site.instagram}`;
    $("coverLine1").textContent = pr.coverLine1;
    $("coverLine2").textContent = pr.coverLine2;
    $("coverSig").textContent = `\u2014 ${cfg.site.name}`;

    /* cover photo + plate */
    const featured = photosNow.filter(p => p.featured);
    const coverPhoto = featured.find(p => imageUrl(p, 2000)) || featured[0] || photosNow[0];
    const coverEl = $("coverPhoto");
    const cUrl = coverPhoto && imageUrl(coverPhoto, 2000);
    coverEl.style.backgroundImage = cUrl
      ? `url("${cUrl}")`
      : "radial-gradient(ellipse at 30% 20%, hsl(28 30% 30% / .85), transparent 60%), radial-gradient(ellipse at 75% 75%, hsl(215 25% 22% / .8), transparent 65%), linear-gradient(160deg, hsl(30 18% 16%), hsl(24 14% 9%))";
    $("coverPlate").innerHTML = coverPhoto
      ? `<strong>On the cover</strong>${plateText(coverPhoto)}`
      : "";

    /* walls */
    wallsTrack.innerHTML = "";
    (featured.length ? featured : photosNow.slice(0, 6)).forEach((photo, i) => {
      const wall = document.createElement("figure");
      wall.className = "wall";
      const print = document.createElement("div");
      print.className = "wall__print";
      print.appendChild(frameMedia(photo, i, 1600));
      print.addEventListener("click", () => { if (!wallsTrack.dataset.dragged) openZoom(photo, i); });
      wall.appendChild(print);
      const plate = document.createElement("figcaption");
      plate.className = "wall__plate";
      plate.innerHTML = `<strong>FR ${String(i + 1).padStart(3, "0")} · ${photo.artist || photo.category}</strong>${plateText(photo)}`;
      armPlate(plate, photo);
      wall.appendChild(plate);
      wallsTrack.appendChild(wall);
    });
    updateWallCount();

    /* exhibitions */
    const list = $("showsList");
    list.innerHTML = "";
    let no = 1;
    (cfg.credits.artists || []).forEach(a => {
      const entry = typeof a === "string" ? { name: a, note: "" } : a;
      const shots = artistPhotosOf(entry.name);
      const li = document.createElement("li");
      const row = document.createElement(shots.length ? "button" : "div");
      row.className = "show-row" + (shots.length ? "" : " show-row--static");
      row.innerHTML =
        `<span class="show-row__no">No. ${String(no++).padStart(2, "0")}</span>` +
        `<span class="show-row__name">${entry.name}</span>` +
        (entry.note ? `<span class="show-row__note">${entry.note}</span>` : "") +
        `<span class="show-row__count">${shots.length} ${shots.length === 1 ? "print" : "prints"}</span>`;
      if (shots.length) {
        row.setAttribute("aria-label", `Enter the ${entry.name} exhibition — ${shots.length} prints`);
        row.addEventListener("click", () => openRoom(entry.name, entry.note));
        row.addEventListener("pointerenter", () => startPeek(entry.name));
        row.addEventListener("pointerleave", stopPeek);
      }
      li.appendChild(row);
      list.appendChild(li);
    });
    /* the standing archive room */
    const totalShots = photosNow.filter(p => p.category !== "portrait").length;
    if (totalShots) {
      const li = document.createElement("li");
      const row = document.createElement("button");
      row.className = "show-row";
      row.innerHTML =
        `<span class="show-row__no">No. ${String(no).padStart(2, "0")}</span>` +
        `<span class="show-row__name">The full archive</span>` +
        `<span class="show-row__note">everything, one room</span>` +
        `<span class="show-row__count">${totalShots} prints</span>`;
      row.addEventListener("click", () => openRoom(null));
      li.appendChild(row);
      list.appendChild(li);
    }

    /* venues flow */
    $("venuesFlow").innerHTML = (cfg.credits.venues || []).join('<i aria-hidden="true">◉</i>');

    /* the photographer */
    $("herParagraphs").innerHTML = cfg.about.paragraphs.map(p => `<p>${p}</p>`).join("");
    $("herQuote").textContent = `“${cfg.about.quote}”`;
    const portrait = photosNow.find(p => p.category === "portrait" && imageUrl(p, 1200));
    const pf = $("herPortrait");
    pf.classList.toggle("has-img", !!portrait);
    pf.style.backgroundImage = portrait ? `url("${imageUrl(portrait, 1200)}")` : "";
    $("herStats").innerHTML = cfg.stats.map(s => `<div><dt>${s.number}</dt><dd>${s.label}</dd></div>`).join("");
    rotateWords();

    /* visit steps */
    $("visitSteps").innerHTML = cfg.process.steps
      .map(s => `<li class="reveal"><h3>${s.title}</h3><p>${s.text}</p></li>`)
      .join("");

    document.querySelectorAll(".reveal, .show-row").forEach(el => io.observe(el));
  }

  /* ---------- boot + admin bridge ---------- */
  render();
  function applyDeepLink() {
    const p = location.hash.replace("#", "").split("&").find(x => x.startsWith("artist="));
    if (!p) return;
    const name = decodeURIComponent(p.slice(7));
    if (artistPhotosOf(name).length) openRoom(name);
  }
  applyDeepLink();
  loadFolders().then(() => { if (dynamicPhotos.length) { render(); } });

  window.BTF = {
    get config() { return cfg; },
    get photosNow() { return photosNow; },
    defaults: CONFIG,
    storageKey: STORAGE_KEY,
    update(next) { cfg = next; render(); },
    save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); return true; } catch { return false; } },
    reset() {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      cfg = deepMerge(CONFIG, {});
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
