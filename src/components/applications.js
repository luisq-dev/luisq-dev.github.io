import { appData } from "../data/content.js";
import { createElement } from "../utils/dom.js";
import {
  analyzeStationary,
  formatPercent,
  formatProbability,
} from "../utils/markov.js";

function matrixTable(matrix, names) {
  const table = createElement("table", {
    className: "data-table modal-matrix-table",
  });
  table.append(
    createElement("caption", {
      className: "visually-hidden",
      text: "Matriz de transición del caso",
    }),
    createElement("thead", {}, [
      createElement("tr", {}, [
        createElement("th", { scope: "col", text: "Origen / Destino" }),
        ...names.map((name) =>
          createElement("th", { scope: "col", text: name }),
        ),
      ]),
    ]),
  );
  const body = createElement("tbody");
  matrix.forEach((row, rowIndex) => {
    body.append(
      createElement("tr", {}, [
        createElement("th", { scope: "row", text: names[rowIndex] }),
        ...row.map((value) =>
          createElement("td", { text: formatProbability(value) }),
        ),
      ]),
    );
  });
  table.append(body);
  return table;
}

export function initApplications() {
  const modal = document.querySelector("#appModal");
  const modalBody = document.querySelector("#modalBody");
  const closeButton = document.querySelector("#modalClose");
  const backdrop = document.querySelector("#modalBackdrop");
  const buttons = [...document.querySelectorAll(".app-explore[data-app]")];
  if (!modal || !modalBody || !closeButton || !backdrop || !buttons.length)
    return;

  let activeTrigger = null;

  function focusableElements() {
    return [
      ...modal.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ];
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (activeTrigger) {
      activeTrigger.setAttribute("aria-expanded", "false");
      activeTrigger.focus({ preventScroll: true });
    }
    closeButton.removeEventListener("keydown", trapFocus);
    document.removeEventListener("keydown", trapFocus);
  }

  function trapFocus(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openModal(key, trigger) {
    const data = appData[key];
    if (!data) return;
    const analysis = analyzeStationary(data.matrix);
    const stationary = analysis.stationary;
    activeTrigger = trigger;
    modalBody.replaceChildren(
      createElement("p", { className: "modal-kicker", text: data.sector }),
      createElement("h2", { id: "modalTitle", text: data.title }),
      createElement("p", { text: data.description }),
      createElement("div", { className: "modal-matrix" }, [
        matrixTable(data.matrix, data.names),
      ]),
      createElement("section", { className: "math-block" }, [
        createElement("span", {
          className: "math-label",
          text: "Distribución estacionaria calculada",
        }),
        stationary
          ? createElement("div", { className: "formula" }, [
              ...data.names.flatMap((name, index) => [
                createElement("span", {
                  text: `π(${name}) = ${formatPercent(stationary[index], 2)}`,
                }),
                ...(index < data.names.length - 1
                  ? [document.createTextNode(" · ")]
                  : []),
              ]),
            ])
          : createElement("p", {
              text: "La distribución no es única; consulta el análisis por estado inicial.",
            }),
      ]),
      createElement("h3", { text: "Interpretación" }),
      createElement("p", {
        text: stationary ? data.interpretation(stationary) : data.description,
      }),
      createElement("div", { className: "notice info" }, [
        createElement("strong", { text: "Aplicaciones prácticas: " }),
        createElement("span", { text: data.useCase }),
      ]),
      createElement("p", { className: "data-note" }, [
        createElement("strong", { text: "Nota metodológica: " }),
        createElement("span", {
          text: "La matriz es un ejemplo didáctico. La fuente enlazada ofrece contexto y datos originales, pero esta página no afirma haber calculado sus probabilidades.",
        }),
        createElement("br"),
        createElement("a", {
          text: data.contextSource.label,
          attributes: {
            href: data.contextSource.url,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        }),
      ]),
    );
    modal.hidden = false;
    document.body.classList.add("modal-open");
    trigger.setAttribute("aria-expanded", "true");
    closeButton.focus();
    document.addEventListener("keydown", trapFocus);
  }

  buttons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () =>
      openModal(button.dataset.app, button),
    );
  });
  closeButton.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
}
