/* ============================================================
   ADMIN PANEL — in-page site editor.
   Open the site with #admin in the URL (e.g. index.html#admin)
   to reveal the "Edit site" button. Every change applies live;
   Save keeps it in this browser; Export downloads config.js to
   replace in the site folder (that's what publishes it).
   ============================================================ */
(() => {
  "use strict";

  const wrap = document.getElementById("admin");
  const body = document.getElementById("adminBody");
  if (!wrap || !window.BTF) return;

  /* ---------- activation ---------- */
  const pill = document.createElement("button");
  pill.className = "admin-pill";
  pill.textContent = "✎ Edit site";
  pill.hidden = true;
  document.body.appendChild(pill);

  function checkHash() {
    const on = location.hash.replace("#", "").split("&").includes("admin") || window.BTF_ADMIN_ALWAYS;
    pill.hidden = !on;
    if (!on) close();
  }
  addEventListener("hashchange", checkHash);
  checkHash();

  pill.addEventListener("click", open);
  document.getElementById("adminClose").addEventListener("click", close);
  document.getElementById("adminScrim").addEventListener("click", close);

  function open() {
    build();
    wrap.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function close() {
    wrap.hidden = true;
    document.body.style.overflow = "";
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !wrap.hidden) close();
  });

  /* ---------- toast ---------- */
  const toast = document.createElement("div");
  toast.className = "admin-toast";
  document.body.appendChild(toast);
  let toastTimer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  /* ---------- state helpers ---------- */
  const cfg = () => window.BTF.config;
  let commitTimer;
  function commit() {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(() => {
      window.BTF.update(cfg());
      window.BTF.save();
    }, 140);
  }
  const setPath = (path, value) => {
    const keys = path.split(".");
    const last = keys.pop();
    keys.reduce((o, k) => o[k], cfg())[last] = value;
    commit();
  };
  const getPath = path => path.split(".").reduce((o, k) => o[k], cfg());

  /* ---------- form builders ---------- */
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  function field(label, path, opts = {}) {
    const f = el("div", "admin-field");
    const id = "af-" + path.replace(/\W/g, "-");
    f.appendChild(Object.assign(el("label", "", label), { htmlFor: id }));
    const input = el(opts.long ? "textarea" : "input");
    if (!opts.long) input.type = "text";
    input.id = id;
    input.value = getPath(path) ?? "";
    input.addEventListener("input", () => setPath(path, input.value));
    f.appendChild(input);
    if (opts.hint) f.appendChild(el("div", "admin-field__hint", opts.hint));
    return f;
  }

  /* editable string-list (venues, artists, rotator, ticker) */
  function listEditor(label, path, hint) {
    const f = el("div", "admin-field");
    f.appendChild(el("label", "", label));
    const input = el("textarea");
    input.value = getPath(path).join("\n");
    input.rows = Math.min(8, getPath(path).length + 1);
    input.addEventListener("input", () => {
      setPath(path, input.value.split("\n").map(s => s.trim()).filter(Boolean));
    });
    f.appendChild(input);
    f.appendChild(el("div", "admin-field__hint", hint || "One per line."));
    return f;
  }

  function section(title, openByDefault) {
    const d = el("details", "admin-sec");
    if (openByDefault) d.open = true;
    d.appendChild(el("summary", "", title));
    const inner = el("div", "admin-sec__inner");
    d.appendChild(inner);
    return [d, inner];
  }

  /* ---------- theme presets ---------- */
  const PRESETS = {
    paper: {
      label: "Paper & Blush",
      theme: { preset: "paper", bg: "#faf6ef", bgSoft: "#f3ecdf", ink: "#262220", ink2: "#4a443c", muted: "#6e675c", line: "#e3dccd", accent: "#b06e55", accent2: "#cf9d84", mark: "#c0392b", reelBg: "#141210", reelInk: "#f0ede5" },
    },
    porcelain: {
      label: "Porcelain (crisp)",
      theme: { preset: "porcelain", bg: "#fbfaf6", bgSoft: "#f1efe7", ink: "#161410", ink2: "#3a362c", muted: "#5f5a4a", line: "#e0ddd1", accent: "#7a4f1d", accent2: "#996f37", mark: "#c0392b", reelBg: "#141210", reelInk: "#f0ede5" },
    },
    ivory: {
      label: "Ivory & Clay",
      theme: { preset: "ivory", bg: "#f5f0e6", bgSoft: "#ece5d4", ink: "#1f1a12", ink2: "#494130", muted: "#71674f", line: "#d5cbb4", accent: "#8d5f28", accent2: "#a97f42", mark: "#c4442a", reelBg: "#171310", reelInk: "#efe8da" },
    },
    gallery: {
      label: "Gallery White",
      theme: { preset: "gallery", bg: "#fbfaf7", bgSoft: "#f1efe9", ink: "#191a18", ink2: "#43453f", muted: "#6e6f68", line: "#dedcd3", accent: "#3d5c50", accent2: "#688a7c", mark: "#c4442a", reelBg: "#161715", reelInk: "#eceae4" },
    },
    darkroom: {
      label: "Darkroom",
      theme: { preset: "darkroom", bg: "#14110e", bgSoft: "#1e1a16", ink: "#f1eadd", ink2: "#c6bca7", muted: "#948b78", line: "#2c261e", accent: "#c9a26b", accent2: "#e4c186", mark: "#d9482b", reelBg: "#0c0a08", reelInk: "#efe8da" },
    },
    dusk: {
      label: "Dubai Dusk",
      theme: { preset: "dusk", bg: "#f4ece8", bgSoft: "#eadfd8", ink: "#271d22", ink2: "#54444c", muted: "#84706a", line: "#d9c8be", accent: "#8e4156", accent2: "#b3705f", mark: "#b3382e", reelBg: "#221a1e", reelInk: "#f2e8e2" },
    },
  };
  const THEME_TOKENS = [
    ["bg", "Background"], ["bgSoft", "Soft background"], ["ink", "Headlines"], ["ink2", "Body text"], ["muted", "Small labels"],
    ["line", "Hairlines"], ["accent", "Accent"], ["accent2", "Accent light"], ["mark", "Hover mark"],
    ["reelBg", "Film strip"], ["reelInk", "Film-strip text"],
  ];

  /* ---------- photos editor ---------- */
  function photoRow(photo, idx, container) {
    const row = el("div", "admin-row");
    const top = el("div", "admin-row__top");
    top.appendChild(el("span", "admin-row__title", `FR ${String(idx + 1).padStart(3, "0")}`));
    const btns = el("div", "admin-row__btns");
    const mk = (txt, title, fn) => {
      const b = el("button", "admin-mini", txt);
      b.title = title;
      b.addEventListener("click", fn);
      btns.appendChild(b);
    };
    mk("↑", "Move up", () => { movePhoto(idx, -1); });
    mk("↓", "Move down", () => { movePhoto(idx, 1); });
    mk("✕", "Delete photo", () => { cfg().photos.splice(idx, 1); commit(); buildPhotos(container); });
    top.appendChild(btns);
    row.appendChild(top);

    const mkInput = (label, key, long) => {
      const f = el("div", "admin-field");
      f.appendChild(el("label", "", label));
      const input = el(long ? "textarea" : "input");
      if (!long) input.type = "text";
      input.value = photo[key] || "";
      input.addEventListener("input", () => { photo[key] = input.value; commit(); });
      f.appendChild(input);
      return f;
    };
    row.appendChild(mkInput("Google Drive link (or leave empty)", "drive"));
    row.appendChild(mkInput("Caption", "title"));
    row.appendChild(mkInput("Artist / performer (optional)", "artist"));
    row.appendChild(mkInput("Margin note (handwritten, beside the frame)", "note"));

    const g2 = el("div", "admin-row__grid2");
    const catField = el("div", "admin-field");
    catField.appendChild(el("label", "", "Category"));
    const sel = el("select", "admin-select");
    const cats = [...cfg().categories.map(c => c.key), "portrait"];
    cats.forEach(c => {
      const o = el("option", "", c);
      o.value = c;
      if (photo.category === c) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { photo.category = sel.value; commit(); });
    catField.appendChild(sel);
    g2.appendChild(catField);
    g2.appendChild(mkInput("Year", "year"));
    row.appendChild(g2);

    const checks = el("div", "admin-checks");
    const mkCheck = (label, key) => {
      const l = el("label");
      const c = el("input");
      c.type = "checkbox";
      c.checked = !!photo[key];
      c.addEventListener("change", () => { photo[key] = c.checked; commit(); });
      l.appendChild(c);
      l.appendChild(document.createTextNode(" " + label));
      checks.appendChild(l);
    };
    mkCheck("Wide frame", "wide");
    mkCheck("In film strip", "featured");
    row.appendChild(checks);
    return row;
  }
  function movePhoto(idx, dir) {
    const arr = cfg().photos;
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    commit();
    build(); /* rebuild to renumber rows */
  }
  function buildPhotos(container) {
    container.innerHTML = "";
    cfg().photos.forEach((p, i) => container.appendChild(photoRow(p, i, container)));
    const add = el("button", "admin-add", "+ Add photo");
    add.addEventListener("click", () => {
      cfg().photos.push({ drive: "", src: "", title: "", category: cfg().categories[0]?.key || "events", year: "", wide: false, featured: false });
      commit();
      buildPhotos(container);
      container.lastElementChild.previousElementSibling.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    container.appendChild(add);
  }

  /* ---------- drive folders editor ---------- */
  let refetchTimer;
  function refetchSoon() {
    clearTimeout(refetchTimer);
    refetchTimer = setTimeout(() => {
      window.BTF.reloadFolders().then(() => say("Drive galleries refreshed"));
    }, 900);
  }
  function buildFolders(container) {
    container.innerHTML = "";
    const folders = (cfg().drive = cfg().drive || { apiKey: "", folders: [] }).folders;
    folders.forEach((f, i) => {
      const row = el("div", "admin-row");
      const top = el("div", "admin-row__top");
      top.appendChild(el("span", "admin-row__title", `Folder ${String(i + 1).padStart(2, "0")}`));
      const btns = el("div", "admin-row__btns");
      const del = el("button", "admin-mini", "✕");
      del.title = "Remove folder";
      del.addEventListener("click", () => { folders.splice(i, 1); commit(); buildFolders(container); refetchSoon(); });
      btns.appendChild(del);
      top.appendChild(btns);
      row.appendChild(top);

      const mkInput = (label, key) => {
        const fd = el("div", "admin-field");
        fd.appendChild(el("label", "", label));
        const input = el("input");
        input.type = "text";
        input.value = f[key] || "";
        input.addEventListener("input", () => { f[key] = input.value; commit(); refetchSoon(); });
        fd.appendChild(input);
        return fd;
      };
      row.appendChild(mkInput("Drive folder link", "link"));
      row.appendChild(mkInput("Caption label (e.g. the show's name)", "label"));
      row.appendChild(mkInput("Artist / performer (links to the Artists list)", "artist"));

      const g2 = el("div", "admin-row__grid2");
      const catField = el("div", "admin-field");
      catField.appendChild(el("label", "", "Category"));
      const sel = el("select", "admin-select");
      cfg().categories.forEach(c => {
        const o = el("option", "", c.label);
        o.value = c.key;
        if (f.category === c.key) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", () => { f.category = sel.value; commit(); refetchSoon(); });
      catField.appendChild(sel);
      g2.appendChild(catField);
      g2.appendChild(mkInput("Year", "year"));
      row.appendChild(g2);

      const featField = el("div", "admin-field");
      featField.appendChild(el("label", "", "Photos from here in the film strip"));
      const feat = el("input");
      feat.type = "text";
      feat.value = String(f.featured ?? 0);
      feat.addEventListener("input", () => { f.featured = Math.max(0, parseInt(feat.value, 10) || 0); commit(); refetchSoon(); });
      featField.appendChild(feat);
      row.appendChild(featField);

      container.appendChild(row);
    });
    const add = el("button", "admin-add", "+ Add Drive folder");
    add.addEventListener("click", () => {
      folders.push({ link: "", category: cfg().categories[0]?.key || "events", label: "", year: "", featured: 0 });
      commit();
      buildFolders(container);
    });
    container.appendChild(add);
  }

  /* ---------- build the whole panel ---------- */
  function build() {
    body.innerHTML = "";

    let [sec, inner] = section("Identity & contact", true);
    inner.appendChild(field("Your name", "site.name"));
    inner.appendChild(field("Tagline", "site.tagline"));
    inner.appendChild(field("Email", "site.email"));
    inner.appendChild(field("WhatsApp number", "site.whatsapp", { hint: "Digits only, with country code — e.g. 971501234567" }));
    inner.appendChild(field("Instagram handle", "site.instagram", { hint: "Without the @" }));
    body.appendChild(sec);

    [sec, inner] = section("Colour scheme");
    const presets = el("div", "admin-presets");
    for (const [key, p] of Object.entries(PRESETS)) {
      const b = el("button", "admin-preset" + (cfg().theme.preset === key ? " is-active" : ""));
      const dots = el("span", "admin-preset__dots");
      [p.theme.bg, p.theme.accent, p.theme.ink].forEach(c => {
        const i = el("i");
        i.style.background = c;
        dots.appendChild(i);
      });
      b.appendChild(dots);
      b.appendChild(document.createTextNode(p.label));
      b.addEventListener("click", () => {
        Object.assign(cfg().theme, p.theme);
        commit();
        build();
        say(`Theme: ${p.label}`);
      });
      presets.appendChild(b);
    }
    inner.appendChild(presets);
    const colors = el("div", "admin-colors");
    THEME_TOKENS.forEach(([key, label]) => {
      const c = el("label", "admin-color");
      const input = el("input");
      input.type = "color";
      input.value = cfg().theme[key];
      input.addEventListener("input", () => {
        cfg().theme[key] = input.value;
        cfg().theme.preset = "custom";
        commit();
      });
      c.appendChild(input);
      c.appendChild(document.createTextNode(label));
      colors.appendChild(c);
    });
    inner.appendChild(colors);
    body.appendChild(sec);

    if (cfg().themeNight) {
      [sec, inner] = section("Night mode colours");
      inner.appendChild(el("div", "admin-field__hint",
        "Design C follows each visitor's system setting; these are the after-dark tokens."));
      const nightColors = el("div", "admin-colors");
      THEME_TOKENS.filter(([k]) => !["reelBg", "reelInk"].includes(k)).forEach(([key, label]) => {
        const c = el("label", "admin-color");
        const input = el("input");
        input.type = "color";
        input.value = cfg().themeNight[key] || "#131311";
        input.addEventListener("input", () => { cfg().themeNight[key] = input.value; commit(); });
        c.appendChild(input);
        c.appendChild(document.createTextNode(label));
        nightColors.appendChild(c);
      });
      inner.appendChild(nightColors);
      body.appendChild(sec);
    }

    if (cfg().curator) {
      [sec, inner] = section("The Curator");
      inner.appendChild(el("div", "admin-field__hint",
        "Design C scores every Drive frame (metadata, filename, sharpness/exposure) and hangs the best automatically. Pin or hide individual frames from the enlarged view while in #admin mode."));
      const pf = el("div", "admin-field");
      pf.appendChild(el("label", "", "Top frames per folder in the reel"));
      const input = el("input");
      input.type = "text";
      input.value = String(cfg().curator.perFolder ?? 3);
      input.addEventListener("input", () => {
        cfg().curator.perFolder = Math.max(1, parseInt(input.value, 10) || 3);
        commit();
      });
      pf.appendChild(input);
      inner.appendChild(pf);
      body.appendChild(sec);
    }

    [sec, inner] = section("Hero");
    inner.appendChild(field("Eyebrow line", "hero.eyebrow"));
    inner.appendChild(field("Headline start", "hero.lineStart"));
    inner.appendChild(listEditor("Rotating words", "hero.rotator", "One per line — cycles in the headline."));
    inner.appendChild(field("Headline end", "hero.lineEnd"));
    inner.appendChild(field("Intro paragraph", "hero.sub", { long: true }));
    body.appendChild(sec);

    [sec, inner] = section("Artists & venues");
    inner.appendChild(field("Section heading", "credits.heading"));
    inner.appendChild(field("Section subtitle", "credits.sub"));
    inner.appendChild(field("Artists column title", "credits.artistsTitle"));
    const artistsEd = el("div", "admin-field");
    artistsEd.appendChild(el("label", "", "Artists & performers"));
    const at = el("textarea");
    at.rows = Math.min(9, cfg().credits.artists.length + 2);
    at.value = cfg().credits.artists
      .map(a => (typeof a === "string" ? a : a.note ? `${a.name} | ${a.note}` : a.name))
      .join("\n");
    at.addEventListener("input", () => {
      cfg().credits.artists = at.value.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        const [name, note] = l.split("|").map(x => x.trim());
        return { name, note: note || "" };
      });
      commit();
    });
    artistsEd.appendChild(at);
    artistsEd.appendChild(el("div", "admin-field__hint",
      "One per line: Name | note. An artist becomes clickable when photos or folders carry the same name in their \u201cartist\u201d field."));
    inner.appendChild(artistsEd);
    inner.appendChild(field("Venues column title", "credits.venuesTitle"));
    inner.appendChild(listEditor("Venues & stages", "credits.venues"));
    body.appendChild(sec);

    [sec, inner] = section("Kind words");
    (cfg().testimonials || []).forEach((t, i) => {
      inner.appendChild(field(`Quote ${i + 1}`, `testimonials.${i}.quote`, { long: true }));
      const g = el("div", "admin-row__grid2");
      g.appendChild(field("From", `testimonials.${i}.name`));
      g.appendChild(field("Context", `testimonials.${i}.role`));
      inner.appendChild(g);
    });
    const addT = el("button", "admin-add", "+ Add quote");
    addT.addEventListener("click", () => {
      (cfg().testimonials = cfg().testimonials || []).push({ quote: "", name: "", role: "" });
      commit();
      build();
    });
    inner.appendChild(addT);
    body.appendChild(sec);

    [sec, inner] = section("About");
    inner.appendChild(field("Heading", "about.heading"));
    const paras = el("div", "admin-field");
    paras.appendChild(el("label", "", "Paragraphs"));
    const pt = el("textarea");
    pt.rows = 8;
    pt.value = getPath("about.paragraphs").join("\n\n");
    pt.addEventListener("input", () => setPath("about.paragraphs", pt.value.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)));
    paras.appendChild(pt);
    paras.appendChild(el("div", "admin-field__hint", "Separate paragraphs with a blank line."));
    inner.appendChild(paras);
    inner.appendChild(field("Pull quote", "about.quote", { long: true }));
    inner.appendChild(field("Portrait caption", "about.portraitCaption"));
    body.appendChild(sec);

    [sec, inner] = section("Stats");
    cfg().stats.forEach((s, i) => {
      const g = el("div", "admin-row__grid2");
      g.appendChild(field("Number", `stats.${i}.number`));
      g.appendChild(field("Label", `stats.${i}.label`));
      inner.appendChild(g);
    });
    body.appendChild(sec);

    [sec, inner] = section("Ticker & process");
    inner.appendChild(listEditor("Ticker words", "ticker"));
    inner.appendChild(field("Process heading", "process.heading"));
    cfg().process.steps.forEach((s, i) => {
      inner.appendChild(field(`Step ${i + 1} title`, `process.steps.${i}.title`));
      inner.appendChild(field(`Step ${i + 1} text`, `process.steps.${i}.text`, { long: true }));
    });
    body.appendChild(sec);

    [sec, inner] = section("Contact & footer");
    inner.appendChild(field("Eyebrow", "contact.eyebrow"));
    inner.appendChild(field("Title line 1", "contact.titleLine1"));
    inner.appendChild(field("Title line 2 (italic)", "contact.titleLine2"));
    inner.appendChild(field("Note under buttons", "contact.note"));
    inner.appendChild(field("Footer tag", "footer.tag"));
    inner.appendChild(field("Footer rights", "footer.rights"));
    body.appendChild(sec);

    [sec, inner] = section("Google Drive galleries");
    inner.appendChild(el("div", "admin-field__hint",
      "Paste whole Drive folders (shared as “Anyone with the link”) and every image inside loads automatically. Needs a free Google API key — see the README for the 5-minute setup."));
    const keyField = el("div", "admin-field");
    keyField.appendChild(el("label", "", "Google API key"));
    const keyInput = el("input");
    keyInput.type = "text";
    keyInput.value = cfg().drive?.apiKey || "";
    keyInput.addEventListener("input", () => {
      cfg().drive = cfg().drive || { folders: [] };
      cfg().drive.apiKey = keyInput.value.trim();
      commit();
      refetchSoon();
    });
    keyField.appendChild(keyInput);
    inner.appendChild(keyField);
    const foldersBox = el("div");
    foldersBox.style.display = "grid";
    foldersBox.style.gap = "0.6rem";
    buildFolders(foldersBox);
    inner.appendChild(foldersBox);
    body.appendChild(sec);

    [sec, inner] = section(`Photos (${cfg().photos.length})`);
    const photosBox = el("div", "admin-sec__inner");
    photosBox.style.padding = "0";
    buildPhotos(photosBox);
    inner.appendChild(photosBox);
    body.appendChild(sec);
  }

  /* ---------- export / copy / reset ---------- */
  function configFileText() {
    return (
      "/* Site config — generated by the admin panel on " +
      new Date().toISOString().slice(0, 10) +
      ".\n   Replace the old config.js in your site folder with this file. */\n\n" +
      "const CONFIG = " + JSON.stringify(cfg(), null, 2) + ";\n"
    );
  }
  document.getElementById("adminExport").addEventListener("click", () => {
    try {
      const blob = new Blob([configFileText()], { type: "text/javascript" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "config.js";
      a.click();
      URL.revokeObjectURL(a.href);
      say("config.js downloaded — replace the file in your site folder");
    } catch {
      say("Download blocked here — use Copy JSON instead");
    }
  });
  document.getElementById("adminCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(configFileText());
      say("Copied — paste into config.js");
    } catch {
      say("Couldn't access the clipboard");
    }
  });
  document.getElementById("adminReset").addEventListener("click", () => {
    if (!confirm("Discard all edits and return to the published config?")) return;
    window.BTF.reset();
    build();
    say("Back to the published version");
  });
})();
