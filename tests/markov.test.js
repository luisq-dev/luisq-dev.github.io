import { describe, expect, it } from "vitest";
import { appData } from "../src/data/content.js";
import { getMatrixExample, matrixExamples } from "../src/data/examples.js";
import {
  analyzeStationary,
  matMul,
  matPow,
  solveLinear,
  stationaryDist,
  validateTransitionMatrix,
} from "../src/utils/markov.js";

const closeToArray = (actual, expected, precision = 8) => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) =>
    expect(value).toBeCloseTo(expected[index], precision),
  );
};

describe("operaciones matriciales", () => {
  it("multiplica matrices compatibles", () => {
    expect(
      matMul(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    ).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });

  it("rechaza dimensiones incompatibles", () => {
    expect(() => matMul([[1, 2, 3]], [[1], [2]])).toThrow(TypeError);
  });

  it("calcula potencias enteras no negativas", () => {
    const matrix = [
      [0.6, 0.4],
      [0.2, 0.8],
    ];
    expect(matPow(matrix, 0)).toEqual([
      [1, 0],
      [0, 1],
    ]);
    closeToArray(matPow(matrix, 1).flat(), matrix.flat());
    closeToArray(matPow(matrix, 2).flat(), [0.44, 0.56, 0.28, 0.72]);
  });

  it("rechaza exponentes no enteros o negativos", () => {
    expect(() => matPow([[1]], -1)).toThrow(RangeError);
    expect(() => matPow([[1]], 1.5)).toThrow(RangeError);
  });
});

describe("sistema lineal", () => {
  it("resuelve un sistema único", () => {
    const result = solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    );
    expect(result.consistent).toBe(true);
    expect(result.unique).toBe(true);
    closeToArray(result.solution, [1, 3]);
  });

  it("detecta sistemas subdeterminados", () => {
    const result = solveLinear([[1, 1]], [1]);
    expect(result.consistent).toBe(true);
    expect(result.unique).toBe(false);
    expect(result.solution).toBeNull();
  });

  it("detecta sistemas inconsistentes", () => {
    const result = solveLinear(
      [
        [1, 1],
        [2, 2],
      ],
      [1, 3],
    );
    expect(result.consistent).toBe(false);
  });
});

describe("validación de matrices", () => {
  it("acepta una matriz estocástica", () => {
    const validation = validateTransitionMatrix([
      [0.6, 0.4],
      [0.1, 0.9],
    ]);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("rechaza filas que no suman uno y valores fuera de rango", () => {
    const validation = validateTransitionMatrix([
      [0.2, 0.2],
      [1.2, -0.2],
    ]);
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("debe sumar 1");
    expect(validation.errors.join(" ")).toContain("[0, 1]");
  });

  it("todos los ejemplos tienen una fila válida por estado", () => {
    Object.entries(matrixExamples).forEach(([size, matrix]) => {
      expect(validateTransitionMatrix(matrix).valid).toBe(true);
      expect(getMatrixExample(Number(size))).toEqual(matrix);
    });
  });
});

describe("análisis estacionario", () => {
  const standard = [
    [0.6, 0.3, 0.1],
    [0.2, 0.5, 0.3],
    [0.4, 0.1, 0.5],
  ];

  it("calcula una distribución única para una cadena ergódica", () => {
    const analysis = analyzeStationary(standard);
    expect(analysis.valid).toBe(true);
    expect(analysis.unique).toBe(true);
    expect(analysis.irreducible).toBe(true);
    expect(analysis.ergodic).toBe(true);
    expect(analysis.ordinaryLimit).toBe(true);
    expect(analysis.warnings).toEqual([]);
    closeToArray(
      analysis.stationary,
      [0.4230769231, 0.3076923077, 0.2692307692],
    );
    closeToArray(stationaryDist(standard), analysis.stationary);
  });

  it("detecta múltiples distribuciones estacionarias", () => {
    const analysis = analyzeStationary([
      [1, 0],
      [0, 1],
    ]);
    expect(analysis.valid).toBe(true);
    expect(analysis.unique).toBe(false);
    expect(analysis.stationary).toBeNull();
    expect(analysis.warnings.join(" ")).toContain("no es única");
    expect(() =>
      stationaryDist([
        [1, 0],
        [0, 1],
      ]),
    ).toThrow("no es única");
  });

  it("distingue una cadena periódica de una ergódica", () => {
    const analysis = analyzeStationary([
      [0, 1],
      [1, 0],
    ]);
    expect(analysis.unique).toBe(true);
    expect(analysis.irreducible).toBe(true);
    expect(analysis.ergodic).toBe(false);
    expect(analysis.periods).toEqual([2, 2]);
    expect(analysis.ordinaryLimit).toBe(false);
    expect(analysis.warnings.join(" ")).toContain("periódica");
    closeToArray(analysis.stationary, [0.5, 0.5]);
  });

  it("detecta una cadena reducible con distribución única", () => {
    const analysis = analyzeStationary([
      [0.85, 0.14, 0.01],
      [0, 0.65, 0.35],
      [0, 0, 1],
    ]);
    expect(analysis.unique).toBe(true);
    expect(analysis.irreducible).toBe(false);
    closeToArray(analysis.stationary, [0, 0, 1]);
  });
});

describe("datos de aplicaciones", () => {
  it("mantiene matrices válidas e interpretaciones coherentes", () => {
    Object.entries(appData).forEach(([key, data]) => {
      const analysis = analyzeStationary(data.matrix);
      expect(analysis.valid, key).toBe(true);
      expect(analysis.unique, key).toBe(true);
      const interpretation = data.interpretation(analysis.stationary);
      analysis.stationary.forEach((value) => {
        expect(interpretation).toContain(`${(value * 100).toFixed(1)}%`);
      });
    });
  });

  it("usa los valores corregidos de los tres casos señalados", () => {
    expect(
      analyzeStationary(appData.clima.matrix).stationary.map((x) =>
        Number(x.toFixed(3)),
      ),
    ).toEqual([0.275, 0.375, 0.35]);
    closeToArray(
      analyzeStationary(appData.mercado.matrix).stationary,
      [0.25, 0.5, 0.25],
    );
    expect(
      analyzeStationary(appData.cliente.matrix).stationary.map((x) =>
        Number((x * 100).toFixed(1)),
      ),
    ).toEqual([32.6, 25.6, 41.9]);
  });
});
