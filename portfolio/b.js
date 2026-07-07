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
  const plateText = photo => {
    const bits = [photo.title || "Untitled", photo.year, printroom().medium].filter(Boolean);
    return bits.join(" · ");
  };

  /* ---------- preloader ---------- */
  const loader = document.createElement("div");
  loader.setAttribute("aria-hidden", "true");
  loader.style.cssText =
    "position:fixed;inset:0;z-index:200;background:var(--bg);display:flex;align-items:center;justify-content:center;gap:1rem;" +
    "font-family:'Space Grotesk',sans-serif;color:var(--accent);letter-spacing:.3em;font-size:.75rem;transition:opacity .5s,visibility .5s";
  loader.innerHTML = `<span>FR</span><span id="ldn" style="font-variant-numeric:tabular-nums">000</span><span>HANGING PRINTS</span>`;
  document.body.prepend(loader);
  {
    const num = loader.querySelector("#ldn");
    const t0 = performance.now(), dur = reduceMotion ? 1 : 1100;
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

  /* ---------- generic horizontal track behaviors ---------- */
  function trackBehaviors(track) {
    let sx = 0, ss = 0, dragging = false;
    track.addEventListener("pointerdown", e => {
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
      dragging = false; track.classList.remove("is-dragging");
      setTimeout(() => delete track.dataset.dragged, 50);
    });
    track.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); track.scrollLeft += e.deltaY; }
    }, { passive: false });
  }

  /* ---------- zoom ---------- */
  const zoom = $("zoom");
  function openZoom(photo, idx) {
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
  trackBehaviors(wallsTrack);
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
