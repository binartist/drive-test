(function () {
  const root = document.documentElement;
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const navOpen = document.getElementById("navOpen");
  const themeToggle = document.getElementById("themeToggle");
  const progressBar = document.getElementById("progressBar");
  const tocLinks = [...document.querySelectorAll(".toc-link")];
  const sections = tocLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  // Theme
  const savedTheme = localStorage.getItem("nz-guide-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  themeToggle?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    if (next === "light") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", "dark");
    localStorage.setItem("nz-guide-theme", next === "light" ? "" : "dark");
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
  tocLinks.forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  // Active section + reading progress
  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    if (progressBar) progressBar.style.width = pct + "%";

    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 120) current = section;
    }
    tocLinks.forEach((link) => {
      const match = link.getAttribute("href") === "#" + current.id;
      link.classList.toggle("active", match);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
