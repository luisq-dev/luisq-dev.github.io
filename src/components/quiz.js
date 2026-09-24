import { quizData } from "../data/content.js";
import { createElement } from "../utils/dom.js";

export function initQuiz() {
  const container = document.querySelector("#quizContainer");
  if (!container) return;
  const answered = new Set();
  let correct = 0;

  function renderScore() {
    const score = createElement("section", {
      className: "quiz-score",
      attributes: { "aria-live": "polite" },
    });
    const message =
      correct === quizData.length
        ? "¡Perfecto! Dominas los fundamentos."
        : correct >= quizData.length * 0.7
          ? "¡Muy bien! Tienes una comprensión sólida."
          : "Buen intento. Repasa los conceptos e inténtalo de nuevo.";
    score.append(
      createElement("div", {
        className: "quiz-score-num",
        text: `${correct}/${quizData.length}`,
      }),
      createElement("p", { text: message }),
    );
    const retry = createElement("button", {
      className: "btn btn-primary",
      attributes: { type: "button" },
      text: "Repetir autoevaluación",
    });
    retry.addEventListener("click", () => {
      container.replaceChildren();
      container.focus({ preventScroll: true });
      renderQuestions();
    });
    score.append(retry);
    container.append(score);
    retry.focus({ preventScroll: true });
  }

  function renderQuestions() {
    answered.clear();
    correct = 0;
    quizData.forEach((item, questionIndex) => {
      const fieldset = createElement("fieldset", {
        className: "quiz-question",
      });
      const legend = createElement("legend", {}, [
        createElement("span", {
          className: "quiz-q-number",
          text: `Pregunta ${questionIndex + 1} de ${quizData.length}`,
        }),
        createElement("span", {
          className: "quiz-q-text",
          text: item.question,
        }),
      ]);
      const options = createElement("div", { className: "quiz-options" });
      const feedback = createElement("div", {
        className: "quiz-feedback",
        id: `quiz-feedback-${questionIndex}`,
        attributes: { role: "status", "aria-live": "polite" },
        hidden: true,
      });

      item.options.forEach((option, optionIndex) => {
        const inputId = `quiz-${questionIndex}-${optionIndex}`;
        const label = createElement("label", {
          className: "quiz-option",
          attributes: { for: inputId },
        });
        const input = createElement("input", {
          attributes: {
            id: inputId,
            type: "radio",
            name: `quiz-${questionIndex}`,
            value: String(optionIndex),
          },
        });
        label.append(input, createElement("span", { text: option }));
        options.append(label);
      });

      fieldset.append(legend, options, feedback);
      container.append(fieldset);

      options.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () => {
          if (answered.has(questionIndex)) return;
          const selected = Number(input.value);
          const isCorrect = selected === item.answer;
          options.querySelectorAll("input").forEach((candidate) => {
            candidate.disabled = true;
            const candidateLabel = candidate.closest("label");
            if (Number(candidate.value) === item.answer)
              candidateLabel.classList.add("correct");
          });
          if (!isCorrect) input.closest("label").classList.add("wrong");
          feedback.textContent = `${isCorrect ? "✓ Correcto. " : "✗ Incorrecto. "}${item.explanation}`;
          feedback.classList.add(isCorrect ? "correct" : "wrong");
          feedback.hidden = false;
          answered.add(questionIndex);
          correct += isCorrect ? 1 : 0;
          if (answered.size === quizData.length) renderScore();
        });
      });
    });
  }

  container.setAttribute("tabindex", "-1");
  renderQuestions();
}
