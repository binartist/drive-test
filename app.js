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
  /** Drawer root screens — peer switch (replace). Everything else is secondary (push + back). */
  const PRIMARY_SCREENS = ["guide", "checklist", "quiz"];
  const SCREEN_TITLES = {
    guide: "Guide",
    checklist: "Checklist",
    quiz: "Knowledge check",
    settings: "Settings",
  };
  const screenTitle = document.getElementById("screenTitle");
  let currentScreen = "guide";
  /** Last primary screen under a pushed secondary (for Back when history cannot pop). */
  let stackBase = "guide";
  let secondaryPushed = false;
  /** In-screen stack (e.g. quiz questions) — same back chrome as secondary screens. */
  let nestedMode = false;
  let nestedTitle = null;

  const MENU_ICON_HTML =
    '<span class="drawer-icon" aria-hidden="true"><span></span><span></span><span></span></span>';
  const BACK_ICON_HTML =
    '<svg class="back-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  function isSecondary(name) {
    return SCREENS.includes(name) && !PRIMARY_SCREENS.includes(name);
  }

  function quizNestedFromHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    const route = raw.startsWith("/") ? raw.slice(1) : raw;
    const parts = route.split(/[/?#]/).filter(Boolean);
    if ((parts[0] || "").toLowerCase() !== "quiz") return false;
    const sub = (parts[1] || "").toLowerCase();
    return sub === "session" || sub === "results";
  }

  function setNestedMode(on, { title = null } = {}) {
    nestedMode = !!on;
    nestedTitle = nestedMode ? title : null;
    syncNavChrome(currentScreen);
  }

  function leadingIsBack() {
    return isSecondary(currentScreen) || nestedMode || quizNestedFromHash();
  }

  function syncNavChrome(name) {
    if (name !== "quiz") {
      nestedMode = false;
      nestedTitle = null;
    }
    // Flag from quiz.js OR hash sub-route — either is enough to show Back.
    const secondary = isSecondary(name) || nestedMode || (name === "quiz" && quizNestedFromHash());
    document.body.classList.toggle("is-secondary", secondary);
    if (navOpen) {
      navOpen.removeAttribute("hidden");
      if (secondary) {
        navOpen.classList.add("is-back");
        navOpen.dataset.mode = "back";
        navOpen.setAttribute("aria-label", "Back");
        navOpen.removeAttribute("aria-controls");
        navOpen.removeAttribute("aria-expanded");
        navOpen.innerHTML = BACK_ICON_HTML;
        closeNav();
      } else {
        navOpen.classList.remove("is-back");
        navOpen.dataset.mode = "menu";
        navOpen.setAttribute("aria-label", "Open menu");
        navOpen.setAttribute("aria-controls", "sidebar");
        navOpen.setAttribute("aria-expanded", sidebar?.classList.contains("open") ? "true" : "false");
        navOpen.innerHTML = MENU_ICON_HTML;
      }
    }
    if (screenTitle) {
      if (secondary && name === "quiz" && nestedTitle) {
        screenTitle.textContent = nestedTitle;
      } else if (secondary && name === "quiz") {
        screenTitle.textContent = SCREEN_TITLES.quiz;
      } else {
        screenTitle.textContent = SCREEN_TITLES[name] || "Guide";
      }
    }
  }

  document.addEventListener("nz-set-nested", (e) => {
    const d = e.detail || {};
    setNestedMode(!!d.on, { title: d.title || null });
  });

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
    if (leadingIsBack()) {
      popSecondary();
      return;
    }
    if (sidebar?.classList.contains("open")) closeNav();
    else openNav();
  });
  const navClose = document.getElementById("navClose");
  backdrop?.addEventListener("click", closeNav);
  navClose?.addEventListener("click", closeNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (leadingIsBack()) {
        popSecondary();
        return;
      }
      closeNav();
    }
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
    if (!isSecondary(name)) {
      stackBase = name;
      secondaryPushed = false;
    }
    screens.forEach((el) => {
      const on = el.dataset.screen === name;
      el.classList.toggle("is-active", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    screenLinks.forEach((link) => {
      const match = link.dataset.screen === name;
      link.classList.toggle("is-active", match);
      link.classList.toggle("active", match);
    });
    syncNavChrome(name);
    if (progressWrap) {
      progressWrap.hidden = name !== "guide";
    }
    if (name !== "guide" && progressBar) progressBar.style.width = "0%";
    if (scrollTop) window.scrollTo({ top: 0, behavior: "auto" });
    updateProgress();
    document.dispatchEvent(new CustomEvent("nz-screen-change", { detail: { screen: name } }));
  }

  function goScreen(name, { replace = false, scrollTop = true } = {}) {
    if (!SCREENS.includes(name)) name = "guide";
    // Always land on the screen hub hash (quiz session sub-routes are owned by quiz.js).
    const hash = "#/" + name;
    const toSecondary = isSecondary(name);
    const fromSecondary = isSecondary(currentScreen);
    // Roots replace each other; secondary is pushed onto the current root.
    const shouldReplace =
      replace ||
      !toSecondary ||
      (fromSecondary && toSecondary);

    if (toSecondary && !fromSecondary && !shouldReplace) {
      secondaryPushed = true;
    }

    if (shouldReplace) {
      if (location.hash !== hash) history.replaceState(null, "", hash);
      showScreen(name, { scrollTop });
    } else if (location.hash !== hash) {
      location.hash = hash;
    } else {
      showScreen(name, { scrollTop });
    }
  }

  function popSecondary() {
    if (nestedMode || quizNestedFromHash()) {
      document.dispatchEvent(new CustomEvent("nz-nav-back", { detail: { screen: currentScreen } }));
      return;
    }
    if (secondaryPushed && isSecondary(currentScreen)) {
      secondaryPushed = false;
      history.back();
      return;
    }
    goScreen(stackBase || "guide", { replace: true, scrollTop: true });
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
