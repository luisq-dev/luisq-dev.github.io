const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initNavigation() {
  const navbar = document.querySelector("#navbar");
  const toggle = document.querySelector("#navToggle");
  const links = document.querySelector("#main-navigation");
  const backButton = document.querySelector("#backToTop");
  if (!navbar || !toggle || !links) return;

  const navLinks = [...links.querySelectorAll('a[href^="#"]')];
  let scrollFrame = 0;

  function closeMenu() {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú de navegación");
  }

  function openMenu() {
    links.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú de navegación");
  }

  function updateScrollState() {
    scrollFrame = 0;
    navbar.classList.toggle("scrolled", window.scrollY > 50);
    backButton?.classList.toggle("visible", window.scrollY > 600);
  }

  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateScrollState);
  }

  toggle.addEventListener("click", () => {
    if (links.classList.contains("open")) closeMenu();
    else openMenu();
  });
  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && links.classList.contains("open")) {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      links.classList.contains("open") &&
      !links.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
  backButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  if (window.location.hash) {
    navbar.classList.add("scrolled");
    backButton?.classList.add("visible");
  }

  if ("IntersectionObserver" in window) {
    const sections = navLinks
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              second.intersectionRatio - first.intersectionRatio,
          )[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-28% 0px -62% 0px", threshold: [0, 0.15, 0.4] },
    );
    sections.forEach((section) => observer.observe(section));
  }
}
