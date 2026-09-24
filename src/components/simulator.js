import { getStateColors } from "../data/content.js";
import { createElement, announceStatus } from "../utils/dom.js";
import { analyzeStationary, formatPercent } from "../utils/markov.js";
import { MatrixEditor } from "./matrixEditor.js";
import { renderCircularDiagram } from "./diagrams.js";

const stateColors = getStateColors();

const scenarios = {
  clima: {
    names: ["Sol", "Nublado", "Lluvia"],
    short: ["S", "N", "L"],
    matrix: [
      [0.6, 0.3, 0.1],
      [0.3, 0.4, 0.3],
      [0.2, 0.3, 0.5],
    ],
  },
  mercado: {
    names: ["Alcista", "Estable", "Bajista"],
    short: ["A", "E", "B"],
    matrix: [
      [0.5, 0.3, 0.2],
      [0.2, 0.6, 0.2],
      [0.1, 0.3, 0.6],
    ],
  },
  cliente: {
    names: ["Activo", "En riesgo", "Perdido"],
    short: ["A", "R", "P"],
    matrix: [
      [0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0, 0.1, 0.9],
    ],
  },
  custom: {
    names: ["A", "B", "C"],
    short: ["A", "B", "C"],
    matrix: [
      [0.5, 0.3, 0.2],
      [0.3, 0.4, 0.3],
      [0.2, 0.3, 0.5],
    ],
  },
};

export function initSimulator() {
  const scenarioSelect = document.querySelector("#simScenario");
  const matrixArea = document.querySelector("#simMatrixArea");
  const matrixStatus = document.querySelector("#simMatrixStatus");
  const initialSelect = document.querySelector("#simInitState");
  const speedInput = document.querySelector("#simSpeed");
  const speedOutput = document.querySelector("#simSpeedOutput");
  const stepButton = document.querySelector("#simStep");
  const autoButton = document.querySelector("#simAuto");
  const resetButton = document.querySelector("#simReset");
  const stepStat = document.querySelector("#statSteps");
  const currentStat = document.querySelector("#statCurrent");
  const currentAnnouncement = document.querySelector("#simCurrentDescription");
  const chain = document.querySelector("#simChain");
  const chart = document.querySelector("#simChart");
  const chartTable = document.querySelector("#simChartTable");
  const diagram = document.querySelector("#simDiagram");
  if (
    !scenarioSelect ||
    !matrixArea ||
    !matrixStatus ||
    !initialSelect ||
    !speedInput ||
    !speedOutput ||
    !stepButton ||
    !autoButton ||
    !resetButton ||
    !stepStat ||
    !currentStat ||
    !currentAnnouncement ||
    !chain ||
    !chart ||
    !chartTable ||
    !diagram
  ) {
    return;
  }

  let current = null;
  let customEditor = null;
  let timer = null;
  let running = false;
  let history = [];
  let counts = [];
  let stepCount = 0;
  let initialState = 0;
  let chartWidth = 600;
  let stationaryCache = { key: "", analysis: null, values: null };

  function setAutoButton() {
    autoButton.textContent = running ? "Pausar" : "Automático";
    autoButton.setAttribute("aria-pressed", String(running));
  }

  function stopAuto() {
    running = false;
    if (timer) window.clearInterval(timer);
    timer = null;
    setAutoButton();
  }

  function startAuto() {
    if (!current || !validateCurrent()) return;
    stopAuto();
    running = true;
    timer = window.setInterval(() => doStep(), Number(speedInput.value));
    setAutoButton();
  }

  function getStationary() {
    const key = `${initialState}:${JSON.stringify(current.matrix)}`;
    if (stationaryCache.key !== key) {
      const analysis = analyzeStationary(current.matrix);
      const values = !analysis.valid
        ? null
        : analysis.unique
          ? analysis.stationary
          : analysis.initialDistributions[initialState];
      stationaryCache = { key, analysis, values };
    }
    return stationaryCache;
  }

  function updateStationaryTable(empirical, stationary) {
    const table = createElement("table", {
      className: "data-table simulator-data-table",
    });
    table.append(
      createElement("caption", { text: "Datos numéricos de la simulación" }),
      createElement("thead", {}, [
        createElement("tr", {}, [
          createElement("th", { scope: "col", text: "Estado" }),
          createElement("th", { scope: "col", text: "Empírica" }),
          createElement("th", {
            scope: "col",
            text: "Referencia estacionaria",
          }),
        ]),
      ]),
    );
    const body = createElement("tbody");
    current.names.forEach((name, index) => {
      body.append(
        createElement("tr", {}, [
          createElement("th", { scope: "row", text: name }),
          createElement("td", { text: formatPercent(empirical[index], 2) }),
          createElement("td", {
            text: stationary
              ? formatPercent(stationary[index], 2)
              : "No definida",
          }),
        ]),
      );
    });
    table.append(body);
    chartTable.replaceChildren(table);
  }

  function drawChart(empirical, stationary) {
    const context = chart.getContext("2d");
    if (!context) return;
    const cssWidth = Math.max(300, chartWidth);
    const height = 220;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (
      chart.width !== Math.round(cssWidth * ratio) ||
      chart.height !== Math.round(height * ratio)
    ) {
      chart.width = Math.round(cssWidth * ratio);
      chart.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, cssWidth, height);

    const baseline = height - 38;
    const chartHeight = baseline - 28;
    const groupWidth = cssWidth / current.names.length;
    const barWidth = Math.min(46, groupWidth * 0.24);
    const gap = Math.min(18, groupWidth * 0.08);

    context.font = '11px "Space Mono", monospace';
    context.textAlign = "center";
    current.names.forEach((name, index) => {
      const center = groupWidth * index + groupWidth / 2;
      const empiricalHeight = empirical[index] * chartHeight;
      if (empiricalHeight > 0.5) {
        context.fillStyle = `${stateColors[index % stateColors.length]}cc`;
        context.fillRect(
          center - barWidth - gap / 2,
          baseline - empiricalHeight,
          barWidth,
          empiricalHeight,
        );
      }
      if (stationary) {
        const stationaryHeight = stationary[index] * chartHeight;
        context.fillStyle = "rgba(231, 235, 244, .24)";
        context.fillRect(
          center + gap / 2,
          baseline - stationaryHeight,
          barWidth,
          stationaryHeight,
        );
      }
      context.fillStyle = stateColors[index % stateColors.length];
      context.fillText(
        `${current.short[index]} ${(empirical[index] * 100).toFixed(0)}%`,
        center,
        baseline + 18,
      );
    });

    context.textAlign = "left";
    context.font = '10px "Space Mono", monospace';
    context.fillStyle = stateColors[0];
    context.fillRect(12, 10, 11, 11);
    context.fillStyle = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--text2");
    context.fillText("Empírica", 29, 20);
    context.fillStyle = "rgba(231, 235, 244, .35)";
    context.fillRect(92, 10, 11, 11);
    context.fillText("Estacionaria", 109, 20);
  }

  function renderVisualization() {
    const total = counts.reduce((sum, count) => sum + count, 0) || 1;
    const empirical = counts.map((count) => count / total);
    const { analysis, values } = getStationary();
    drawChart(empirical, values);
    updateStationaryTable(empirical, values);
    if (!analysis.unique && values) {
      announceStatus(
        matrixStatus,
        "La distribución estacionaria no es única; la referencia depende del estado inicial.",
        "warning",
      );
    }
    renderCircularDiagram(diagram, current.matrix, current.names, {
      title: "Diagrama de la simulación",
      description: `Estado activo: ${current.names[history.at(-1)]}.`,
      activeState: history.at(-1),
      shortNames: current.short,
      showNames: true,
      width: 540,
      height: 440,
      radius: 36,
      ringRadius: 118,
    });
  }

  function addToken(state) {
    const index = history.length - 1;
    chain
      .querySelectorAll(".latest")
      .forEach((token) => token.classList.remove("latest"));
    const token = createElement("li", {
      className: "sim-token latest",
      attributes: {
        "aria-label": `Paso ${index}: ${current.names[state]}`,
      },
      text: current.short[state],
      style: {
        "--state-color": stateColors[state % stateColors.length],
        "--state-background": `color-mix(in srgb, ${stateColors[state % stateColors.length]} 15%, transparent)`,
      },
    });
    chain.append(token);
    while (chain.children.length > 80) chain.firstElementChild.remove();
    chain.scrollLeft = chain.scrollWidth;
  }

  function reset() {
    stopAuto();
    stepCount = 0;
    history = [initialState];
    counts = Array(current.names.length).fill(0);
    counts[initialState] = 1;
    stepStat.textContent = "0";
    currentStat.textContent = current.names[initialState];
    currentAnnouncement.textContent = `Estado actual: ${current.names[initialState]}.`;
    chain.replaceChildren();
    addToken(initialState);
    renderVisualization();
  }

  function validateCurrent() {
    const analysis = analyzeStationary(current.matrix);
    if (!analysis.valid) {
      announceStatus(
        matrixStatus,
        analysis.validation.errors.join(" "),
        "error",
      );
      return false;
    }
    announceStatus(
      matrixStatus,
      "Matriz válida; la simulación puede continuar.",
      "ok",
    );
    return true;
  }

  function nextState(state) {
    const random = Math.random();
    let cumulative = 0;
    for (let next = 0; next < current.matrix[state].length; next += 1) {
      cumulative += current.matrix[state][next];
      if (random <= cumulative) return next;
    }
    return state;
  }

  function doStep() {
    if (!validateCurrent()) {
      stopAuto();
      return false;
    }
    const next = nextState(history.at(-1));
    history.push(next);
    if (history.length > 81) history.shift();
    counts[next] += 1;
    stepCount += 1;
    stepStat.textContent = String(stepCount);
    currentStat.textContent = current.names[next];
    currentAnnouncement.textContent = `Paso ${stepCount}. Estado actual: ${current.names[next]}.`;
    addToken(next);
    renderVisualization();
    return true;
  }

  function populateInitialStates() {
    initialSelect.replaceChildren(
      ...current.names.map((name, index) =>
        createElement("option", {
          attributes: { value: String(index) },
          text: name,
        }),
      ),
    );
    initialSelect.value = String(initialState);
  }

  function loadScenario(key) {
    stopAuto();
    const scenario = scenarios[key];
    current = {
      names: [...scenario.names],
      short: [...scenario.short],
      matrix: scenario.matrix.map((row) => [...row]),
    };
    initialState = Math.min(initialState, current.names.length - 1);
    populateInitialStates();
    matrixArea.hidden = key !== "custom";
    customEditor = null;
    if (key === "custom") {
      customEditor = new MatrixEditor({
        inputArea: matrixArea,
        size: 3,
        names: current.names,
        idPrefix: "simulator-matrix",
        onChange: ({ matrix, validation }) => {
          current.matrix = matrix;
          if (validation.valid) {
            initialState = Math.min(initialState, current.names.length - 1);
            reset();
          } else {
            stopAuto();
            announceStatus(matrixStatus, validation.errors.join(" "), "error");
          }
        },
      });
      customEditor.setMatrix(current.matrix, { notify: false });
      announceStatus(matrixStatus, "Matriz personalizada válida.", "ok");
    } else {
      matrixStatus.textContent = "Escenario predefinido: matriz válida.";
    }
    reset();
  }

  const chartResizeObserver = new ResizeObserver(([entry]) => {
    chartWidth = Math.max(300, Math.round(entry.contentRect.width));
    if (!current) return;
    const total = counts.reduce((sum, count) => sum + count, 0) || 1;
    const empirical = counts.map((count) => count / total);
    drawChart(empirical, getStationary().values);
  });
  chartResizeObserver.observe(chart);

  scenarioSelect.addEventListener("change", () =>
    loadScenario(scenarioSelect.value),
  );
  initialSelect.addEventListener("change", () => {
    initialState = Number(initialSelect.value);
    reset();
  });
  speedInput.addEventListener("input", () => {
    speedOutput.value = `${speedInput.value} ms`;
    speedOutput.textContent = `${speedInput.value} ms`;
    if (running) startAuto();
  });
  stepButton.addEventListener("click", () => {
    stopAuto();
    doStep();
  });
  autoButton.addEventListener("click", () =>
    running ? stopAuto() : startAuto(),
  );
  resetButton.addEventListener("click", reset);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) stopAuto();
  });

  loadScenario(scenarioSelect.value || "clima");
}
