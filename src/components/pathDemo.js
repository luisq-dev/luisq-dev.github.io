import { getStateColors } from "../data/content.js";
import { createElement } from "../utils/dom.js";

const stateColors = getStateColors();
const states = ["A", "B", "C"];
const transitions = {
  A: { A: 0.6, B: 0.3, C: 0.1 },
  B: { A: 0.2, B: 0.5, C: 0.3 },
  C: { A: 0.4, B: 0.1, C: 0.5 },
};

export function initPathDemo() {
  const container = document.querySelector("#pathDemo");
  const stepsElement = document.querySelector("#pathSteps");
  const predictionElement = document.querySelector("#pathPrediction");
  const stepButton = document.querySelector("#pathStep");
  const autoButton = document.querySelector("#pathAuto");
  const resetButton = document.querySelector("#pathReset");
  if (
    !container ||
    !stepsElement ||
    !predictionElement ||
    !stepButton ||
    !autoButton ||
    !resetButton
  ) {
    return;
  }

  let path = [];
  let timer = null;
  let inViewport = true;

  function nextState(state) {
    const random = Math.random();
    let cumulative = 0;
    const row = transitions[state];
    for (const candidate of states) {
      cumulative += row[candidate];
      if (random <= cumulative) return candidate;
    }
    return state;
  }

  function render() {
    stepsElement.replaceChildren();
    path.forEach((state, index) => {
      const stateIndex = states.indexOf(state);
      const isCurrent = index === path.length - 1;
      const button = createElement("button", {
        className: `path-step${isCurrent ? " current" : ""}`,
        attributes: {
          type: "button",
          "aria-label": `Usar el estado ${state} como estado actual`,
          "aria-pressed": String(isCurrent),
        },
        text: state,
        style: {
          "--state-color": stateColors[stateIndex],
          "--state-background": `color-mix(in srgb, ${stateColors[stateIndex]} 15%, transparent)`,
        },
      });
      button.addEventListener("click", () => {
        path = path.slice(0, index + 1);
        stopAuto();
        render();
      });
      stepsElement.append(button);
    });

    predictionElement.replaceChildren();
    if (!path.length) {
      predictionElement.textContent =
        "Pulsa “Paso” para iniciar una realización de la cadena.";
      return;
    }

    const current = path.at(-1);
    const row = transitions[current];
    const prefix = createElement("span", {
      text: `Desde ${current}, las probabilidades son: `,
    });
    const values = states.map((state, index) =>
      createElement("span", {
        className: "path-probability",
        text: `${state} ${(row[state] * 100).toFixed(0)}%`,
        style: { "--state-color": stateColors[index] },
      }),
    );
    values.forEach((value, index) => {
      if (index) predictionElement.append(document.createTextNode(" · "));
      predictionElement.append(value);
    });
    predictionElement.prepend(prefix);
  }

  function step() {
    if (!path.length) {
      path.push(states[Math.floor(Math.random() * states.length)]);
    } else {
      path.push(nextState(path.at(-1)));
    }
    if (path.length > 20) path.shift();
    render();
  }

  function startAuto() {
    stopAuto();
    if (!inViewport || document.hidden) return;
    timer = window.setInterval(step, 1500);
    autoButton.textContent = "Pausar automático";
    autoButton.setAttribute("aria-pressed", "true");
  }

  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
    autoButton.textContent = "Automático";
    autoButton.setAttribute("aria-pressed", "false");
  }

  function reset() {
    stopAuto();
    path = [];
    render();
    stepButton.focus({ preventScroll: true });
  }

  stepButton.addEventListener("click", () => {
    stopAuto();
    step();
  });
  autoButton.addEventListener("click", () =>
    timer ? stopAuto() : startAuto(),
  );
  resetButton.addEventListener("click", reset);

  const observer = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    if (!inViewport) stopAuto();
  });
  observer.observe(container);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
  });

  render();
}
