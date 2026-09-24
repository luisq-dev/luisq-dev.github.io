import { createElement, formatCell } from "../utils/dom.js";
import {
  DEFAULT_TOLERANCE,
  formatProbability,
  validateTransitionMatrix,
} from "../utils/markov.js";

const stateNames = (size) =>
  Array.from({ length: size }, (_, index) => String.fromCharCode(65 + index));

export class MatrixEditor {
  constructor({
    inputArea,
    size = 3,
    idPrefix = "matrix",
    names = null,
    tolerance = DEFAULT_TOLERANCE,
    onChange = () => {},
  }) {
    this.inputArea = inputArea;
    this.size = size;
    this.idPrefix = idPrefix;
    this.names = names ?? stateNames(size);
    this.tolerance = tolerance;
    this.onChange = onChange;
    this.render();
  }

  getNames() {
    return this.names.slice(0, this.size);
  }

  setSize(size) {
    this.size = Number(size);
    if (!this.names || this.names.length !== this.size) {
      this.names = stateNames(this.size);
    }
    this.render();
    this.notify();
  }

  render() {
    const table = createElement("table", { className: "matrix-table" });
    const caption = createElement("caption", {
      className: "visually-hidden",
      text: `Matriz de transición de ${this.size} estados. Las filas indican el estado actual y las columnas el estado siguiente.`,
    });
    const head = createElement("thead");
    const headRow = createElement("tr");
    const emptyHeader = createElement("th", {
      scope: "col",
      text: "Desde ↓ / Hacia →",
    });
    headRow.append(emptyHeader);

    this.getNames().forEach((name) => {
      headRow.append(createElement("th", { scope: "col", text: name }));
    });
    headRow.append(createElement("th", { scope: "col", text: "Suma" }));
    head.append(headRow);

    const body = createElement("tbody");
    for (let rowIndex = 0; rowIndex < this.size; rowIndex += 1) {
      const row = createElement("tr");
      row.append(
        createElement("th", { scope: "row", text: this.getNames()[rowIndex] }),
      );

      for (let columnIndex = 0; columnIndex < this.size; columnIndex += 1) {
        const cell = createElement("td");
        const inputId = `${this.idPrefix}-${rowIndex}-${columnIndex}`;
        const from = this.getNames()[rowIndex];
        const to = this.getNames()[columnIndex];
        const input = createElement("input", {
          className: "matrix-input",
          attributes: {
            id: inputId,
            type: "number",
            min: "0",
            max: "1",
            step: "0.01",
            inputmode: "decimal",
            "aria-label": `Probabilidad de transición de ${from} hacia ${to}`,
          },
        });
        input.addEventListener("input", () => {
          this.updateRowState(rowIndex);
          this.notify();
        });
        cell.append(input);
        row.append(cell);
      }

      row.append(
        createElement("td", {}, [
          createElement("span", {
            className: "row-sum",
            id: `${this.idPrefix}-sum-${rowIndex}`,
            attributes: { "aria-live": "polite" },
            text: "—",
          }),
        ]),
      );
      body.append(row);
    }

    table.append(caption, head, body);
    const wrapper = createElement("div", {
      className: "table-scroll",
      attributes: {
        tabindex: "0",
        role: "region",
        "aria-label": `Editar matriz de ${this.size} estados`,
      },
    });
    wrapper.append(table);
    this.inputArea.replaceChildren(wrapper);
  }

  getMatrix() {
    return Array.from({ length: this.size }, (_, rowIndex) =>
      Array.from({ length: this.size }, (_, columnIndex) => {
        const input = this.inputArea.querySelector(
          `#${CSS.escape(`${this.idPrefix}-${rowIndex}-${columnIndex}`)}`,
        );
        if (!input || input.value.trim() === "") return 0;
        return Number(input.value);
      }),
    );
  }

  setMatrix(matrix, options = {}) {
    if (matrix.length !== this.size) {
      throw new RangeError(
        "La matriz no tiene el tamaño configurado en el editor.",
      );
    }
    matrix.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const input = this.inputArea.querySelector(
          `#${CSS.escape(`${this.idPrefix}-${rowIndex}-${columnIndex}`)}`,
        );
        if (input) input.value = formatCell(value);
      });
    });
    this.validate();
    if (options.notify !== false) this.notify();
  }

  clear(options = {}) {
    this.inputArea.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
    this.validate();
    if (options.notify !== false) this.notify();
  }

  randomize(options = {}) {
    const matrix = Array.from({ length: this.size }, () => {
      const values = Array.from({ length: this.size }, () => Math.random());
      const total = values.reduce((sum, value) => sum + value, 0);
      const rounded = values.map(
        (value) => Math.floor((value / total) * 10000) / 10000,
      );
      const current = rounded.reduce((sum, value) => sum + value, 0);
      rounded[rounded.length - 1] = Number((1 - current).toFixed(4));
      return rounded;
    });
    this.setMatrix(matrix, { notify: false });
    if (options.notify !== false) this.notify();
  }

  validate() {
    const matrix = this.getMatrix();
    const validation = validateTransitionMatrix(matrix, {
      tolerance: this.tolerance,
    });
    const names = this.getNames();
    const inputs = [...this.inputArea.querySelectorAll(".matrix-input")];

    inputs.forEach((input) => {
      const rowIndex = Number(input.id.split("-").at(-2));
      const columnIndex = Number(input.id.split("-").at(-1));
      const value = Number(input.value);
      const invalidProbability =
        input.value !== "" &&
        (!Number.isFinite(value) || value < 0 || value > 1);
      const invalidRow =
        !Number.isFinite(validation.rowSums[rowIndex]) ||
        Math.abs(validation.rowSums[rowIndex] - 1) > this.tolerance;
      input.classList.toggle("error", invalidProbability || invalidRow);
      input.setAttribute(
        "aria-invalid",
        String(invalidProbability || invalidRow),
      );
      input.title = invalidProbability
        ? "Introduce una probabilidad entre 0 y 1."
        : invalidRow
          ? `La fila ${names[rowIndex]} debe sumar 1; suma ${formatProbability(validation.rowSums[rowIndex])}.`
          : `${names[rowIndex]} → ${names[columnIndex]}`;
    });

    validation.rowSums.forEach((sum, rowIndex) => {
      const element = this.inputArea.querySelector(
        `#${CSS.escape(`${this.idPrefix}-sum-${rowIndex}`)}`,
      );
      if (!element) return;
      element.textContent = Number.isFinite(sum) ? formatProbability(sum) : "—";
      const valid = Number.isFinite(sum) && Math.abs(sum - 1) <= this.tolerance;
      element.classList.toggle("valid", valid);
      element.classList.toggle("invalid", !valid);
    });

    return { matrix, validation };
  }

  getSearchableText() {
    return `${this.getNames().join(" ")} ${this.getMatrix().flat().join(" ")}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  notify() {
    const { matrix, validation } = this.validate();
    this.onChange({ matrix, validation, editor: this });
  }
}

export { stateNames };
