import { getMatrixExample } from "../data/examples.js";
import { createElement, announceStatus } from "../utils/dom.js";
import { matMul, matPow, formatPercent } from "../utils/markov.js";
import { MatrixEditor } from "./matrixEditor.js";

export function initNStepsCalculator() {
  const sizeSelect = document.querySelector("#nstepSize");
  const inputArea = document.querySelector("#nstepMatrixArea");
  const exampleButton = document.querySelector("#nstepExample");
  const computeButton = document.querySelector("#computeNstep");
  const initialSelect = document.querySelector("#nstepInit");
  const stepsInput = document.querySelector("#nstepN");
  const status = document.querySelector("#nstepStatus");
  const results = document.querySelector("#nstepResults");
  if (
    !sizeSelect ||
    !inputArea ||
    !exampleButton ||
    !computeButton ||
    !initialSelect ||
    !stepsInput ||
    !status ||
    !results
  ) {
    return;
  }

  let size = Number(sizeSelect.value);
  const editor = new MatrixEditor({
    inputArea,
    size,
    idPrefix: "nstep-matrix",
    onChange: ({ validation }) => {
      announceStatus(
        status,
        validation.valid ? "Matriz válida." : validation.errors.join(" "),
        validation.valid ? "ok" : "error",
      );
    },
  });

  function updateInitialStates() {
    initialSelect.replaceChildren(
      ...editor.getNames().map((name, index) =>
        createElement("option", {
          attributes: { value: String(index) },
          text: `Estado ${name}`,
        }),
      ),
    );
  }

  function loadExample() {
    editor.setMatrix(getMatrixExample(size));
    results.replaceChildren(
      createElement("p", {
        className: "placeholder-text",
        text: "Ejemplo cargado. Pulsa Calcular para ver el resultado.",
      }),
    );
  }

  sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    editor.setSize(size);
    updateInitialStates();
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

    const steps = Number(stepsInput.value);
    if (!Number.isInteger(steps) || steps < 1 || steps > 50) {
      announceStatus(
        status,
        "El número de pasos debe ser un entero entre 1 y 50.",
        "error",
      );
      stepsInput.focus();
      return;
    }

    const initialState = Number(initialSelect.value);
    const names = editor.getNames();
    const finalProbabilities = matPow(matrix, steps)[initialState];
    const result = createElement("section", {
      className: "nstep-result-block",
    });
    const formula = createElement("div", { className: "formula" }, [
      "P(X",
      createElement("sub", { text: String(steps) }),
      ` = j | X`,
      createElement("sub", { text: "0" }),
      ` = ${names[initialState]})`,
    ]);
    result.append(
      createElement("h4", {
        text: `Probabilidad condicional después de ${steps} pasos`,
      }),
      formula,
      createElement("p", {
        className: "result-intro",
        text: `Probabilidades después de exactamente ${steps} pasos.`,
      }),
    );

    const bars = createElement("div", { className: "prob-bars" });
    names.forEach((name, index) => {
      const percentage = finalProbabilities[index] * 100;
      bars.append(
        createElement("div", { className: "prob-bar-item" }, [
          createElement("div", { className: "prob-bar-header" }, [
            createElement("span", {
              className: "prob-bar-state",
              text: `→ ${name}`,
            }),
            createElement("span", {
              className: "prob-bar-value",
              text: formatPercent(finalProbabilities[index], 2),
            }),
          ]),
          createElement(
            "div",
            {
              className: "prob-bar-track",
              attributes: {
                role: "meter",
                "aria-label": `Probabilidad de llegar a ${name}`,
                "aria-valuemin": "0",
                "aria-valuemax": "100",
                "aria-valuenow": (finalProbabilities[index] * 100).toFixed(2),
              },
            },
            [
              createElement("div", {
                className: "prob-bar-fill",
                style: { width: `${percentage}%` },
              }),
            ],
          ),
        ]),
      );
    });
    result.append(bars);

    const evolution = createElement("div", { className: "nstep-evolution" });
    evolution.append(createElement("h4", { text: "Evolución paso a paso" }));
    const tableScroll = createElement("div", {
      className: "table-scroll",
      attributes: {
        tabindex: "0",
        role: "region",
        "aria-label": "Tabla de evolución",
      },
    });
    const table = createElement("table", {
      className: "data-table evolution-table",
    });
    table.append(
      createElement("caption", {
        className: "visually-hidden",
        text: "Evolución de probabilidades durante los primeros pasos",
      }),
      createElement("thead", {}, [
        createElement("tr", {}, [
          createElement("th", { scope: "col", text: "Paso" }),
          ...names.map((name) =>
            createElement("th", { scope: "col", text: `P(→${name})` }),
          ),
        ]),
      ]),
    );
    const body = createElement("tbody");
    let power = matrix;
    for (let step = 1; step <= Math.min(steps, 10); step += 1) {
      body.append(
        createElement("tr", {}, [
          createElement("th", { scope: "row", text: `n = ${step}` }),
          ...power[initialState].map((value) =>
            createElement("td", { text: formatPercent(value, 2) }),
          ),
        ]),
      );
      power = matMul(power, matrix);
    }
    table.append(body);
    tableScroll.append(table);
    evolution.append(tableScroll);
    result.append(evolution);
    results.replaceChildren(result);
    announceStatus(status, "Cálculo completado.", "ok");
  });

  updateInitialStates();
  loadExample();
}
