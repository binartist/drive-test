(function () {
  const root = document.documentElement;
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const navOpen = document.getElementById("navOpen");
  const themeToggle = document.getElementById("themeToggle");
  const progressBar = document.getElementById("progressBar");
  const progressWrap = document.querySelector(".progress");
  const screens = [...document.querySelectorAll(".screen[data-screen]")];
  const screenLinks = [...document.querySelectorAll(".toc-link[data-screen]")];
  const SCREENS = ["guide", "checklist", "quiz", "settings"];
  const SCREEN_TITLES = {
    guide: "Guide",
    checklist: "Checklist",
    quiz: "Knowledge check",
    settings: "Settings",
  };
  const screenTitle = document.getElementById("screenTitle");
  let currentScreen = "guide";

  // Theme (Settings screen)
  const themeStatus = document.getElementById("themeStatus");
  function syncThemeUi() {
    const dark = root.getAttribute("data-theme") === "dark";
    if (themeToggle) {
      themeToggle.setAttribute("aria-checked", dark ? "true" : "false");
      themeToggle.classList.toggle("is-on", dark);
    }
    if (themeStatus) themeStatus.textContent = dark ? "Dark mode" : "Light mode";
  }
  const savedTheme = localStorage.getItem("nz-guide-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  syncThemeUi();
  themeToggle?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    if (next === "light") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", "dark");
    localStorage.setItem("nz-guide-theme", next === "light" ? "" : "dark");
    syncThemeUi();
  });

  // Mobile nav
  function closeNav() {
    sidebar?.classList.remove("open");
    backdrop?.classList.remove("show");
    backdrop?.setAttribute("hidden", "");
    navOpen?.setAttribute("aria-expanded", "false");
  }
  function openNav() {
    sidebar?.classList.add("open");
    backdrop?.classList.add("show");
    backdrop?.removeAttribute("hidden");
    navOpen?.setAttribute("aria-expanded", "true");
  }
  navOpen?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) closeNav();
    else openNav();
  });
  const navClose = document.getElementById("navClose");
  backdrop?.addEventListener("click", closeNav);
  navClose?.addEventListener("click", closeNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  // —— Screen routing (#/guide, #/tips, …) ——
  function parseHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    // Support #/guide and legacy #guide
    const route = raw.startsWith("/") ? raw.slice(1) : raw;
    const name = (route.split(/[/?#]/)[0] || "").toLowerCase();
    if (SCREENS.includes(name)) return name;
    // Legacy chapter hashes → stay on guide (scroll handled separately)
    return null;
  }

  function showScreen(name, { scrollTop = true } = {}) {
    if (!SCREENS.includes(name)) name = "guide";
    currentScreen = name;
    screens.forEach((el) => {
      const on = el.dataset.screen === name;
      el.classList.toggle("is-active", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    screenLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.screen === name);
      link.classList.toggle("active", link.dataset.screen === name);
    });
    if (screenTitle) {
      screenTitle.textContent = SCREEN_TITLES[name] || "Guide";
    }
    if (progressWrap) {
      progressWrap.hidden = name !== "guide";
    }
    if (name !== "guide" && progressBar) progressBar.style.width = "0%";
    if (scrollTop) window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
    // syncTocButton defined later; called from onHashChange end and after TOC setup
    document.dispatchEvent(new CustomEvent("nz-screen-change", { detail: { screen: name } }));
  }

  function goScreen(name, { replace = false, scrollTop = true } = {}) {
    const hash = "#/" + name;
    if (replace) history.replaceState(null, "", hash);
    else if (location.hash !== hash) location.hash = hash;
    else showScreen(name, { scrollTop });
  }

  function onHashChange() {
    const fromHash = parseHash();
    if (fromHash) {
      showScreen(fromHash, { scrollTop: true });
      return;
    }
    // Bare #start / #drive etc. → ensure guide visible, then scroll
    const frag = (location.hash || "").replace(/^#/, "");
    if (frag && !frag.startsWith("/") && document.getElementById(frag)) {
      showScreen("guide", { scrollTop: false });
      requestAnimationFrame(() => {
        const target = document.getElementById(frag);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    showScreen("guide", { scrollTop: true });
    if (!location.hash || location.hash === "#") {
      history.replaceState(null, "", "#/guide");
    }
  }

  screenLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeNav();
      goScreen(link.dataset.screen, { scrollTop: true });
    });
  });

  // Footer / other data-screen links outside the sidebar
  document.querySelectorAll('a[data-screen]:not(.toc-link)').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      goScreen(link.dataset.screen, { scrollTop: true });
    });
  });

  // —— Guide contents popover (header) ——
  const tocWrap = document.getElementById("tocPopoverWrap");
  const tocOpen = document.getElementById("tocOpen");
  const tocPopover = document.getElementById("tocPopover");
  const guideTocLinks = [...document.querySelectorAll(".guide-toc-link")];

  function setTocPopover(open) {
    if (!tocOpen || !tocPopover) return;
    tocOpen.setAttribute("aria-expanded", open ? "true" : "false");
    tocWrap?.classList.toggle("is-open", open);
    if (open) tocPopover.removeAttribute("hidden");
    else tocPopover.setAttribute("hidden", "");
  }

  function syncTocButton() {
    if (!tocWrap) return;
    const onGuide = currentScreen === "guide";
    if (onGuide) tocWrap.removeAttribute("hidden");
    else {
      tocWrap.setAttribute("hidden", "");
      setTocPopover(false);
    }
  }

  document.addEventListener("nz-screen-change", syncTocButton);
  syncTocButton();

  tocOpen?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = tocOpen.getAttribute("aria-expanded") !== "true";
    setTocPopover(open);
  });
  document.addEventListener("click", (e) => {
    if (!tocWrap || tocPopover?.hasAttribute("hidden")) return;
    if (tocWrap.contains(e.target)) return;
    setTocPopover(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setTocPopover(false);
  });

  guideTocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = (link.getAttribute("href") || "").replace(/^#/, "");
      const target = document.getElementById(id);
      if (!target) return;
      setTocPopover(false);
      if (currentScreen !== "guide") {
        showScreen("guide", { scrollTop: false });
      }
      history.replaceState(null, "", "#/guide");
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  });

  // Hero "Start chapter 1" and in-page #chapter links inside guide
  document.querySelectorAll('#screen-guide a[href^="#"]').forEach((link) => {
    if (link.classList.contains("guide-toc-link")) return;
    const href = link.getAttribute("href") || "";
    if (!href.match(/^#[a-z0-9-]+$/i)) return;
    if (href.startsWith("#/")) return;
    link.addEventListener("click", (e) => {
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target || !document.getElementById("screen-guide")?.contains(target)) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Progress bar — guide screen only
  const guideChapters = ["start", "drive", "roundabouts", "give-way", "signs", "parking", "petrol", "tips", "playlist"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function updateProgress() {
    if (currentScreen !== "guide") {
      if (progressBar) progressBar.style.width = "0%";
      return;
    }
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + "%";

    let current = guideChapters[0];
    for (const section of guideChapters) {
      if (section.getBoundingClientRect().top <= 140) current = section;
    }
    guideTocLinks.forEach((link) => {
      const match = link.getAttribute("href") === "#" + current?.id;
      link.classList.toggle("active", match);
    });
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("hashchange", onHashChange);
  onHashChange();

  // Checklist persistence
  const todoInputs = document.querySelectorAll('#todoList input[type="checkbox"]');
  todoInputs.forEach((input) => {
    const key = "nz-guide-todo-" + input.dataset.key;
    input.checked = localStorage.getItem(key) === "1";
    input.addEventListener("change", () => {
      localStorage.setItem(key, input.checked ? "1" : "0");
    });
  });
})();
