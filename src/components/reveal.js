export function initReveal() {
  const elements = [
    ...document.querySelectorAll(
      ".section-title, .section-intro, .concept-grid, .states-layout, .matrix-layout, .stationary-layout, .simulator-layout, .apps-grid, .quiz-question, .glossary-card, .reference-list",
    ),
  ];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  elements.forEach((element) => element.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );
  elements.forEach((element) => observer.observe(element));
}
