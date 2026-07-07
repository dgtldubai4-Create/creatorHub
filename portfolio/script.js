/* ============================================================
   BETWEEN THE FRAMES — behavior
   Reads PHOTOS + SITE from photos.js. No libraries.
   ============================================================ */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Google Drive link → image URL ----------
     Accepts:
       https://drive.google.com/file/d/FILE_ID/view?usp=sharing
       https://drive.google.com/open?id=FILE_ID
       https://drive.google.com/uc?id=FILE_ID
       or a bare FILE_ID
  */
  function driveId(link) {
    if (!link) return null;
    const m =
      link.match(/\/d\/([\w-]{20,})/) ||
      link.match(/[?&]id=([\w-]{20,})/) ||
      link.match(/^([\w-]{25,})$/);
    return m ? m[1] : null;
  }

  function imageUrl(photo, size) {
    const id = driveId(photo.drive);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
    if (photo.src) return photo.src;
    return null;
  }

  /* ---------- art-directed placeholder (SVG data URI) ---------- */
  const PH_HUES = { events: [28, 14], fashion: [340, 20], sports: [200, 24], portrait: [45, 12] };
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

  /* ---------- preloader (counter as branding) ---------- */
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.setAttribute("aria-hidden", "true");
  loader.style.cssText =
    "position:fixed;inset:0;z-index:200;background:#14110e;display:flex;align-items:center;" +
    "justify-content:center;gap:1rem;font-family:'Space Grotesk',sans-serif;color:#c9a26b;" +
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

  /* ---------- site identity ---------- */
  document.getElementById("brandName").textContent = SITE.name;
  document.getElementById("footerName").textContent = `© ${new Date().getFullYear()} ${SITE.name}`;
  document.title = `${SITE.name} — ${SITE.tagline}`;
  document.getElementById("emailLink").href =
    `mailto:${SITE.email}?subject=${encodeURIComponent("Photography enquiry")}`;
  document.getElementById("whatsappLink").href = `https://wa.me/${SITE.whatsapp}`;
  document.getElementById("instagramLink").href = `https://instagram.com/${SITE.instagram}`;

  /* ---------- stats strip ---------- */
  document.getElementById("statsStrip").innerHTML = SITE.stats
    .map(s => `<div class="stats__cell reveal"><span class="stats__num">${s.number}</span><span class="stats__label">${s.label}</span></div>`)
    .join("");

  /* ---------- featured reel ---------- */
  const featured = PHOTOS.filter(p => p.featured);
  const reelFrames = document.getElementById("reelFrames");
  featured.forEach((photo, i) => {
    const idx = PHOTOS.indexOf(photo);
    const frame = document.createElement("figure");
    frame.className = "reel__frame";
    frame.appendChild(frameMedia(photo, idx, 1200));
    const tag = document.createElement("figcaption");
    tag.className = "reel__frame-tag";
    tag.textContent = `FR ${String(idx + 1).padStart(3, "0")} · ${photo.category}`;
    frame.appendChild(tag);
    frame.addEventListener("click", () => { if (!strip.dataset.dragged) openLightbox(idx); });
    reelFrames.appendChild(frame);
  });

  /* drag-to-scroll on the reel */
  const strip = document.getElementById("reelStrip");
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

  /* ---------- about portrait (first "portrait" photo with an image) ---------- */
  const portraitPhoto = PHOTOS.find(p => p.category === "portrait" && imageUrl(p, 1200));
  if (portraitPhoto) {
    const el = document.getElementById("aboutPortrait");
    el.classList.add("has-img");
    el.style.backgroundImage = `url("${imageUrl(portraitPhoto, 1200)}")`;
  }

  /* ---------- contact sheet grid ---------- */
  const grid = document.getElementById("workGrid");
  PHOTOS.forEach((photo, idx) => {
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
  });

  /* filters */
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip =>
    chip.addEventListener("click", () => {
      chips.forEach(c => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-selected", c === chip ? "true" : "false");
      });
      const filter = chip.dataset.filter;
      grid.querySelectorAll(".sheet-frame").forEach(cell => {
        const show = filter === "all" || cell.dataset.category === filter;
        cell.classList.toggle("is-hidden", !show);
        if (show) requestAnimationFrame(() => cell.classList.add("is-in"));
      });
    })
  );

  /* ---------- lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbTitle = document.getElementById("lightboxTitle");
  const lbFrame = document.getElementById("lightboxFrame");
  const lbMeta = document.getElementById("lightboxMeta");
  let lbIndex = 0;

  function visibleIndices() {
    const filter = document.querySelector(".chip.is-active").dataset.filter;
    return PHOTOS.map((p, i) => i).filter(i => filter === "all" || PHOTOS[i].category === filter);
  }

  function openLightbox(idx) {
    lbIndex = idx;
    renderLightbox();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("lightboxClose").focus();
  }
  function renderLightbox() {
    const photo = PHOTOS[lbIndex];
    const url = imageUrl(photo, 2200);
    const wrap = lbImg.parentElement;
    wrap.querySelector(".ph")?.remove();
    lbImg.style.display = url ? "" : "none";
    if (url) {
      lbImg.src = url;
      lbImg.alt = photo.title || "";
    } else {
      const ph = placeholderEl(photo, lbIndex);
      ph.style.width = "min(76vw, 900px)";
      ph.style.aspectRatio = "3 / 2";
      wrap.appendChild(ph);
    }
    lbTitle.textContent = photo.title || "Untitled";
    lbFrame.textContent = `FR ${String(lbIndex + 1).padStart(3, "0")}`;
    lbMeta.textContent = `${photo.category} · ${photo.year || ""}`;
  }
  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  function stepLightbox(dir) {
    const vis = visibleIndices();
    const pos = vis.indexOf(lbIndex);
    lbIndex = vis[(pos + dir + vis.length) % vis.length];
    renderLightbox();
  }
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxPrev").addEventListener("click", () => stepLightbox(-1));
  document.getElementById("lightboxNext").addEventListener("click", () => stepLightbox(1));
  lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  /* ---------- rotating hero word ---------- */
  const rotator = document.getElementById("rotator");
  const words = rotator.querySelectorAll("span");
  let wordIdx = 0;
  if (!reduceMotion) {
    setInterval(() => {
      words[wordIdx].classList.remove("is-active");
      wordIdx = (wordIdx + 1) % words.length;
      words[wordIdx].classList.add("is-active");
    }, 2600);
  }

  /* ---------- cursor-following peek in hero ---------- */
  const hero = document.getElementById("hero");
  const peek = document.getElementById("heroPeek");
  const peekInner = document.getElementById("heroPeekInner");
  const peekPhotos = featured.length ? featured : PHOTOS;
  let peekTarget = { x: 0, y: 0 }, peekPos = { x: 0, y: 0 }, peekShot = -1;

  function setPeekImage(i) {
    const photo = peekPhotos[i % peekPhotos.length];
    const url = imageUrl(photo, 800);
    peekInner.style.backgroundImage = url
      ? `url("${url}")`
      : `linear-gradient(150deg, hsl(28 25% 22%), hsl(20 18% 9%))`;
  }
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      peekTarget.x = e.clientX - r.left;
      peekTarget.y = e.clientY - r.top;
      const shot = Math.floor((e.clientX / innerWidth) * peekPhotos.length);
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

  /* ---------- "VIEW" cursor label over gallery frames ---------- */
  const cursorLabel = document.getElementById("cursorLabel");
  document.addEventListener("pointermove", e => {
    cursorLabel.style.left = e.clientX + "px";
    cursorLabel.style.top = e.clientY + "px";
    const overFrame = e.target.closest(".sheet-frame, .reel__frame");
    cursorLabel.classList.toggle("is-on", !!overFrame && lb.hidden);
  });

  /* ---------- frame counter = scroll progress ---------- */
  const counter = document.getElementById("frameCounter");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    counter.textContent = String(Math.round(p * 100)).padStart(3, "0");
  }, { passive: true });

  /* ---------- ticker: duplicate track for a seamless -50% loop ---------- */
  const track = document.getElementById("tickerTrack");
  track.innerHTML += track.innerHTML;

  /* ---------- scroll reveals ---------- */
  const io = new IntersectionObserver(
    entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".sheet-frame, .reveal, .process__step, .about__quote").forEach(el => io.observe(el));

  /* ---------- live Dubai clock (GST, UTC+4) ---------- */
  const clock = document.getElementById("dubaiClock");
  function tickClock() {
    clock.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai",
    }).format(new Date());
  }
  tickClock();
  setInterval(tickClock, 30000);
})();
