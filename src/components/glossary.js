import { glossaryTerms } from "../data/content.js";
import { createElement, normalizeSearch } from "../utils/dom.js";

export function initGlossary() {
  const grid = document.querySelector("#glossaryGrid");
  const search = document.querySelector("#glossarySearch");
  const count = document.querySelector("#glossaryCount");
  const empty = document.querySelector("#glossaryEmpty");
  if (!grid || !search || !count || !empty) return;

  const cards = glossaryTerms.map((item) => {
    const card = createElement("article", { className: "glossary-card" });
    card.append(
      createElement("h3", { className: "glossary-term", text: item.term }),
      createElement("p", { className: "glossary-def", text: item.definition }),
    );
    grid.append(card);
    return {
      element: card,
      searchText: normalizeSearch(`${item.term} ${item.definition}`),
    };
  });

  search.addEventListener("input", () => {
    const query = normalizeSearch(search.value.trim());
    let visible = 0;
    cards.forEach((card) => {
      const matches = !query || card.searchText.includes(query);
      card.element.hidden = !matches;
      if (matches) visible += 1;
    });
    empty.hidden = visible !== 0;
    count.textContent = `${visible} de ${cards.length} términos`;
  });
}
