import { initApplications } from "./components/applications.js";
import { initGlossary } from "./components/glossary.js";
import { initHeroCanvas } from "./components/heroCanvas.js";
import { initMatrixModule } from "./components/matrixModule.js";
import { initNavigation } from "./components/navigation.js";
import { initNStepsCalculator } from "./components/nstepsCalculator.js";
import { initPathDemo } from "./components/pathDemo.js";
import { initQuiz } from "./components/quiz.js";
import { initReveal } from "./components/reveal.js";
import { initSimulator } from "./components/simulator.js";
import { initStationaryCalculator } from "./components/stationaryCalculator.js";
import { initStatesDiagram } from "./components/statesDiagram.js";

const initializers = [
  initHeroCanvas,
  initPathDemo,
  initStatesDiagram,
  initMatrixModule,
  initStationaryCalculator,
  initSimulator,
  initNStepsCalculator,
  initApplications,
  initQuiz,
  initGlossary,
  initNavigation,
  initReveal,
];

export function initApp() {
  initializers.forEach((initializer) => {
    try {
      initializer();
    } catch (error) {
      console.error(`No se pudo inicializar ${initializer.name}.`, error);
    }
  });
}
