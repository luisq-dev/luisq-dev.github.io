import { getMatrixExample } from "../data/examples.js";
import { createElement, announceStatus } from "../utils/dom.js";
import { matPow, formatProbability } from "../utils/markov.js";
import { MatrixEditor } from "./matrixEditor.js";
import { renderCircularDiagram } from "./diagrams.js";

function matrixMarkup(matrix, names, label) {
  const wrapper = createElement("div", { className: "matrix-display" });
  const table = createElement("table", { className: "matrix-result-table" });
  table.append(
    createElement("caption", { className: "visually-hidden", text: label }),
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
  wrapper.append(table);
  return wrapper;
}

export function initMatrixModule() {
  const sizeSelect = document.querySelector("#matrixSize");
  const inputArea = document.querySelector("#matrixInputArea");
  const validationElement = document.querySelector("#matrixValidation");
  const randomButton = document.querySelector("#randomMatrix");
  const clearButton = document.querySelector("#clearMatrix");
  const computeButton = document.querySelector("#computeMatrix");
  const results = document.querySelector("#matrixResults");
  const diagram = document.querySelector("#transitionDiagram");
  if (
    !sizeSelect ||
    !inputArea ||
    !validationElement ||
    !randomButton ||
    !clearButton ||
    !computeButton ||
    !results
  ) {
    return;
  }

  let size = Number(sizeSelect.value);
  const editor = new MatrixEditor({
    inputArea,
    size,
    idPrefix: "matrix-module",
    onChange: ({ matrix, validation }) => {
      announceStatus(
        validationElement,
        validation.valid
          ? `Matriz válida. Cada fila suma 1 (± ${validation.tolerance}).`
          : validation.errors.join(" "),
        validation.valid ? "ok" : "error",
      );
      renderCircularDiagram(diagram, matrix, editor.getNames(), {
        title: `Diagrama de transición para ${size} estados`,
        description:
          "Las flechas muestran las probabilidades de la matriz actual.",
      });
    },
  });

  function loadExample() {
    editor.setMatrix(getMatrixExample(size));
  }

  sizeSelect.addEventListener("change", () => {
    size = Number(sizeSelect.value);
    editor.setSize(size);
    results.replaceChildren();
    loadExample();
  });
  randomButton.addEventListener("click", () => {
    editor.randomize();
    results.replaceChildren();
  });
  clearButton.addEventListener("click", () => {
    editor.clear();
    results.replaceChildren();
  });
  computeButton.addEventListener("click", () => {
    const { matrix, validation } = editor.validate();
    if (!validation.valid) {
      announceStatus(validationElement, validation.errors.join(" "), "error");
      computeButton.focus();
      return;
    }
    const names = editor.getNames();
    const powers = [matrix, matPow(matrix, 2), matPow(matrix, 3)];
    const labels = ["P (original)", "P² (dos pasos)", "P³ (tres pasos)"];
    results.replaceChildren(
      createElement("h4", { className: "results-heading", text: "Resultados" }),
      ...powers.map((power, index) =>
        createElement("section", { className: "result-matrix" }, [
          createElement("h5", { text: labels[index] }),
          matrixMarkup(power, names, labels[index]),
        ]),
      ),
    );
  });

  loadExample();
}
