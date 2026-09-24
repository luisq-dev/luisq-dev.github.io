import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const fillMatrix = async (page, selector, matrix) => {
  const inputs = page.locator(`${selector} input.matrix-input`);
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      await inputs
        .nth(row * matrix[row].length + column)
        .fill(String(matrix[row][column]));
    }
  }
};

test("funciona al abrir index.html directamente", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(pathToFileURL(path.resolve("index.html")).href);

  await expect(page.locator("#pathPrediction")).toContainText("Pulsa “Paso”");
  await expect(page.locator("#statesDiagram circle")).toHaveCount(6);
  await expect(page.locator("#matrixInputArea input")).toHaveCount(9);
  await expect(page.locator("#transitionDiagram circle")).toHaveCount(3);
  await expect(page.locator("#stationaryInputArea input")).toHaveCount(9);
  await expect(page.locator("#simChain li")).toHaveCount(1);
  await expect(page.locator("#simChartTable tbody tr")).toHaveCount(3);
  await expect(page.locator("#simDiagram circle")).toHaveCount(3);
  await expect(page.locator("#nstepMatrixArea input")).toHaveCount(9);
  await expect(page.locator("#quizContainer fieldset")).toHaveCount(8);
  await expect(page.locator("#glossaryGrid article")).toHaveCount(22);
  expect(pageErrors).toEqual([]);
});

test("carga sin errores de consola y cumple las reglas WCAG AA", async ({
  page,
}) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Cadenas de",
    );
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations, `WCAG AA (${colorScheme})`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("los editores de matrices aceptan coma decimal y muestran los valores", async ({
  page,
}) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/#matriz");
  await fillMatrix(page, "#matrixInputArea", [
    ["0,6", "0,3", "0,1"],
    ["0,2", "0,5", "0,3"],
    ["0,4", "0,1", "0,5"],
  ]);
  await expect(page.locator("#matrixValidation")).toContainText(
    "Matriz válida",
  );
  await expect(page.locator("#matrixInputArea input").first()).toHaveValue(
    "0,6",
  );
  await page.getByRole("button", { name: "Calcular P² y P³" }).click();
  await expect(page.locator("#matrixResults")).toContainText("P² (dos pasos)");
  expect(pageErrors).toEqual([]);
});

test("la demo de Markov responde con controles nativos", async ({ page }) => {
  await page.goto("/#concepto");
  await page.locator("#pathStep").click();
  await expect(page.locator("#pathSteps .path-step")).toHaveCount(1);
  await expect(page.locator("#pathPrediction")).toContainText("Desde");
  await page.getByRole("button", { name: "Usar el estado" }).click();
  await expect(page.locator("#pathSteps .path-step")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("las tarjetas de estados funcionan con teclado", async ({ page }) => {
  await page.goto("/#estados");
  const recurrent = page.getByRole("button", { name: /Recurrente/ });
  await recurrent.focus();
  await page.keyboard.press("Enter");
  await expect(recurrent).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#diagramLegend")).toContainText("S₄, S₅ y S₆");
});

test("los diagramas separan sus etiquetas y probabilidades", async ({
  page,
}) => {
  await page.goto("/#simulador");
  for (const selector of [
    "#simDiagram",
    "#transitionDiagram",
    "#statesDiagram",
  ]) {
    const overlapCount = await page.locator(selector).evaluate((svg) => {
      const labels = [...svg.querySelectorAll(".diagram-edge-label-group")].map(
        (group) => {
          const rect = group.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
          };
        },
      );
      let overlaps = 0;
      labels.forEach((first, index) => {
        labels.slice(index + 1).forEach((second) => {
          if (
            first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top
          ) {
            overlaps += 1;
          }
        });
      });
      return overlaps;
    });
    expect(overlapCount, selector).toBe(0);
  }
});

test("la calculadora estacionaria informa cuando no hay unicidad", async ({
  page,
}) => {
  await page.goto("/#estacionaria");
  await page.locator("#stationarySize").selectOption("2");
  await fillMatrix(page, "#stationaryInputArea", [
    [1, 0],
    [0, 1],
  ]);
  await page.getByRole("button", { name: "Calcular π" }).click();
  await expect(page.locator("#stationaryResults")).toContainText(
    "No existe una distribución estacionaria única",
  );
  await expect(page.locator("#stationaryResults")).toContainText("A");
});

test("N pasos valida la matriz y el número de pasos", async ({ page }) => {
  await page.goto("/#npasos");
  await page.locator("#nstepN").fill("0");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator("#nstepStatus")).toContainText("entre 1 y 50");
  await page.locator("#nstepN").fill("2");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator("#nstepResults")).toContainText(
    "después de exactamente 2 pasos",
  );
});

test("el modal de aplicaciones conserva el foco y cierra con Escape", async ({
  page,
}) => {
  await page.goto("/#aplicaciones");
  const trigger = page.getByRole("button", { name: "Explorar caso" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Matriz de transición del caso");
  await expect(
    page.getByRole("button", { name: "Cerrar caso de aplicación" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("el menú móvil expone estado accesible y cierra con Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator("#navToggle");
  await expect(toggle).toHaveAccessibleName("Abrir menú de navegación");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
