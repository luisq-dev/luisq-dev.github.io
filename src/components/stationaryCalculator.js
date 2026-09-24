import { getMatrixExample } from "../data/examples.js";
import { createElement, announceStatus } from "../utils/dom.js";
import {
  analyzeStationary,
  formatPercent,
  formatProbability,
  matMul,
} from "../utils/markov.js";
import { MatrixEditor } from "./matrixEditor.js";

function warningList(warnings) {
  return createElement("ul", { className: "warning-list" }, [
    ...warnings.map((warning) => createElement("li", { text: warning })),
  ]);
}

function distributionTable(names, distribution, title) {
  const table = createElement("table", {
    className: "data-table stationary-result-table",
  });
  table.append(
    createElement("caption", { text: title }),
    createElement("thead", {}, [
      createElement("tr", {}, [
        createElement("th", { scope: "col", text: "Estado" }),
        createElement("th", { scope: "col", text: "πᵢ" }),
        createElement("th", { scope: "col", text: "Porcentaje" }),
      ]),
    ]),
  );
  const body = createElement("tbody");
  names.forEach((name, index) => {
    body.append(
      createElement("tr", {}, [
        createElement("th", { scope: "row", text: name }),
        createElement("td", {
          text: formatProbability(distribution[index], 6),
        }),
        createElement("td", { text: formatPercent(distribution[index], 2) }),
      ]),
    );
  });
  table.append(body);
  return table;
}

function distributionChart(names, distribution) {
  const group = createElement("div", { className: "chart-bar-group" });
  names.forEach((name, index) => {
    group.append(
      createElement("div", { className: "chart-bar-item" }, [
        createElement("span", { className: "chart-bar-label", text: name }),
        createElement(
          "div",
          {
            className: "chart-bar-track",
            attributes: {
              role: "meter",
              "aria-label": `Probabilidad estacionaria del estado ${name}`,
              "aria-valuemin": "0",
              "aria-valuemax": "100",
              "aria-valuenow": (distribution[index] * 100).toFixed(2),
            },
          },
          [
            createElement("div", {
              className: "chart-bar-fill",
              text: formatPercent(distribution[index], 1),
              style: { width: `${Math.max(0, distribution[index] * 100)}%` },
            }),
          ],
        ),
      ]),
    );
  });
  return group;
}

export function initStationaryCalculator() {
  const sizeSelect = document.querySelector("#stationarySize");
  const inputArea = document.querySelector("#stationaryInputArea");
  const exampleButton = document.querySelector("#stationaryExample");
  const computeButton = document.querySelector("#computeStationary");
  const status = document.querySelector("#stationaryStatus");
  const results = document.querySelector("#stationaryResults");
  const chart = document.querySelector("#stationaryChart");
  if (
    !sizeSelect ||
    !inputArea ||
    !exampleButton ||
    !computeButton ||
    !status ||
    !results ||
    !chart
  ) {
    return;
  }

  let size = Number(sizeSelect.value);
  const editor = new MatrixEditor({
    inputArea,
    size,
    idPrefix: "stationary-matrix",
    onChange: ({ validation }) => {
      announceStatus(
        status,
        validation.valid ? "Matriz válida." : validation.errors.join(" "),
        validation.valid ? "ok" : "error",
      );
    },
  });

  function loadExample() {
    editor.setMatrix(getMatrixExample(size));
    results.replaceChildren();
    chart.replaceChildren();
  }

  function renderAnalysis(analysis) {
    const names = editor.getNames();
    const section = createElement("section", {
      className: "stationary-analysis",
    });
    results.replaceChildren(section);

    if (analysis.warnings.length) {
      section.append(
        createElement(
          "div",
          { className: "notice warning", attributes: { role: "note" } },
          [
            createElement("strong", {
              text: "Revisa las condiciones de la cadena:",
            }),
            warningList(analysis.warnings),
          ],
        ),
      );
    } else {
      section.append(
        createElement(
          "div",
          { className: "notice success", attributes: { role: "note" } },
          [
            createElement("strong", { text: "Cadena ergódica: " }),
            createElement("span", {
              text: "la distribución estacionaria es única y Pⁿ converge desde cualquier estado inicial.",
            }),
          ],
        ),
      );
    }

    if (analysis.unique) {
      const row = matMul([analysis.stationary], editor.getMatrix())[0];
      const error = Math.max(
        ...analysis.stationary.map((value, index) =>
          Math.abs(value - row[index]),
        ),
      );
      section.append(
        distributionTable(
          names,
          analysis.stationary,
          "Distribución estacionaria única",
        ),
        createElement("p", {
          className: "verification",
          text: `Verificación πP = π; error máximo: ${error.toExponential(2)}.`,
        }),
      );
      chart.replaceChildren(distributionChart(names, analysis.stationary));
      return;
    }

    section.append(
      createElement("p", {
        text: "No existe una distribución estacionaria única. Las siguientes distribuciones de largo plazo se calculan como promedios de Cesàro y dependen del estado inicial.",
      }),
    );
    const table = createElement("table", { className: "data-table" });
    table.append(
      createElement("caption", {
        text: "Distribuciones de largo plazo por estado inicial",
      }),
      createElement("thead", {}, [
        createElement("tr", {}, [
          createElement("th", { scope: "col", text: "Inicio" }),
          ...names.map((name) =>
            createElement("th", { scope: "col", text: name }),
          ),
        ]),
      ]),
    );
    const body = createElement("tbody");
    analysis.initialDistributions.forEach((distribution, initialState) => {
      body.append(
        createElement("tr", {}, [
          createElement("th", { scope: "row", text: names[initialState] }),
          ...distribution.map((value) =>
            createElement("td", { text: formatPercent(value, 2) }),
          ),
        ]),
      );
    });
    table.append(body);
    section.append(table);
    chart.replaceChildren();
  }

  sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    editor.setSize(size);
    loadExample();
  });
  exampleButton.addEventListener("click", loadExample);
  computeButton.addEventListener("click", () => {
    const { matrix, validation } = editor.validate();
    if (!validation.valid) {
      announceStatus(status, validation.errors.join(" "), "error");
      computeButton.focus();
      return;
    }
    renderAnalysis(analyzeStationary(matrix));
    announceStatus(
      status,
      "Cálculo completado. Revisa las condiciones de convergencia.",
      "ok",
    );
  });

  loadExample();
}
