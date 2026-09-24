export const DEFAULT_TOLERANCE = 0.005;
export const NUMERIC_EPSILON = 1e-10;

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

export function validateTransitionMatrix(matrix, options = {}) {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const errors = [];

  if (!Array.isArray(matrix) || matrix.length === 0) {
    return {
      valid: false,
      errors: ["La matriz debe contener al menos una fila."],
      rowSums: [],
      tolerance,
    };
  }

  const size = matrix.length;
  if (
    !matrix.every(Array.isArray) ||
    matrix.some((row) => row.length !== size)
  ) {
    return {
      valid: false,
      errors: ["La matriz debe ser cuadrada."],
      rowSums: [],
      tolerance,
    };
  }

  const rowSums = [];
  matrix.forEach((row, rowIndex) => {
    if (row.some((value) => !isFiniteNumber(value))) {
      errors.push(`La fila ${rowIndex + 1} contiene valores no numéricos.`);
      rowSums.push(Number.NaN);
      return;
    }

    if (
      row.some(
        (value) => value < -NUMERIC_EPSILON || value > 1 + NUMERIC_EPSILON,
      )
    ) {
      errors.push(
        `La fila ${rowIndex + 1} contiene valores fuera del intervalo [0, 1].`,
      );
    }

    const sum = row.reduce((total, value) => total + value, 0);
    rowSums.push(sum);
    if (Math.abs(sum - 1) > tolerance + NUMERIC_EPSILON) {
      errors.push(
        `La fila ${rowIndex + 1} suma ${sum.toFixed(4)} y debe sumar 1.`,
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    rowSums,
    tolerance,
  };
}

export function matMul(a, b) {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    b.length === 0
  ) {
    throw new TypeError("matMul requiere matrices no vacías.");
  }

  const rows = a.length;
  const shared = b.length;
  const columns = b[0].length;

  if (
    a.some((row) => row.length !== shared) ||
    b.some((row) => row.length !== columns)
  ) {
    throw new TypeError("Las dimensiones de las matrices no son compatibles.");
  }

  const result = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let sum = 0;
      for (let index = 0; index < shared; index += 1) {
        sum += a[row][index] * b[index][column];
      }
      result[row][column] = sum;
    }
  }
  return result;
}

export function matPow(matrix, exponent) {
  if (!Number.isInteger(exponent) || exponent < 0) {
    throw new RangeError(
      "El exponente debe ser un entero mayor o igual que cero.",
    );
  }

  const size = matrix.length;
  let result = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  );
  let base = matrix.map((row) => [...row]);

  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result = matMul(result, base);
    }
    exponent = Math.floor(exponent / 2);
    if (exponent > 0) {
      base = matMul(base, base);
    }
  }
  return result;
}

export function rref(matrix, tolerance = NUMERIC_EPSILON) {
  if (!matrix.length || matrix.some((row) => row.length !== matrix[0].length)) {
    throw new TypeError("rref requiere una matriz rectangular válida.");
  }

  const result = matrix.map((row) => [...row]);
  const rows = result.length;
  const columns = result[0].length;
  const pivotColumns = [];
  let pivotRow = 0;

  for (let column = 0; column < columns && pivotRow < rows; column += 1) {
    let candidate = pivotRow;
    for (let row = pivotRow + 1; row < rows; row += 1) {
      if (Math.abs(result[row][column]) > Math.abs(result[candidate][column])) {
        candidate = row;
      }
    }

    if (Math.abs(result[candidate][column]) <= tolerance) {
      continue;
    }

    [result[pivotRow], result[candidate]] = [
      result[candidate],
      result[pivotRow],
    ];
    const pivot = result[pivotRow][column];
    for (let index = column; index < columns; index += 1) {
      result[pivotRow][index] /= pivot;
    }

    for (let row = 0; row < rows; row += 1) {
      if (row === pivotRow) continue;
      const factor = result[row][column];
      if (Math.abs(factor) <= tolerance) continue;
      for (let index = column; index < columns; index += 1) {
        result[row][index] -= factor * result[pivotRow][index];
      }
    }

    pivotColumns.push(column);
    pivotRow += 1;
  }

  return { matrix: result, pivotColumns, rank: pivotColumns.length };
}

export function nullspace(matrix, tolerance = NUMERIC_EPSILON) {
  const reduced = rref(matrix, tolerance);
  const columns = matrix[0].length;
  const pivotSet = new Set(reduced.pivotColumns);
  const freeColumns = Array.from(
    { length: columns },
    (_, index) => index,
  ).filter((index) => !pivotSet.has(index));

  return freeColumns.map((freeColumn) => {
    const vector = Array(columns).fill(0);
    vector[freeColumn] = 1;
    reduced.pivotColumns.forEach((pivotColumn, rowIndex) => {
      vector[pivotColumn] = -reduced.matrix[rowIndex][freeColumn];
    });
    return vector;
  });
}

export function solveLinear(matrix, vector, options = {}) {
  const tolerance = options.tolerance ?? NUMERIC_EPSILON;
  if (
    !Array.isArray(matrix) ||
    !Array.isArray(vector) ||
    matrix.length !== vector.length
  ) {
    throw new TypeError(
      "solveLinear requiere una matriz y un vector compatibles.",
    );
  }

  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  const reduced = rref(augmented, tolerance);
  const columns = matrix[0].length;

  for (let row = 0; row < reduced.matrix.length; row += 1) {
    const coefficients = reduced.matrix[row].slice(0, columns);
    const constant = reduced.matrix[row][columns];
    const zeroEquation = coefficients.every(
      (value) => Math.abs(value) <= tolerance,
    );
    if (zeroEquation && Math.abs(constant) > tolerance) {
      return {
        solution: null,
        rank: reduced.pivotColumns.filter((column) => column < columns).length,
        consistent: false,
        unique: false,
      };
    }
  }

  const coefficientPivots = reduced.pivotColumns.filter(
    (column) => column < columns,
  );
  if (coefficientPivots.length < columns) {
    return {
      solution: null,
      rank: coefficientPivots.length,
      consistent: true,
      unique: false,
    };
  }

  const solution = Array(columns).fill(0);
  coefficientPivots.forEach((pivotColumn) => {
    const pivotRow = reduced.matrix.findIndex(
      (row) =>
        Math.abs(row[pivotColumn] - 1) <= tolerance &&
        row
          .slice(0, columns)
          .every(
            (value, index) =>
              index === pivotColumn || Math.abs(value) <= tolerance,
          ),
    );
    solution[pivotColumn] = reduced.matrix[pivotRow][columns];
  });
  return {
    solution,
    rank: coefficientPivots.length,
    consistent: true,
    unique: true,
  };
}

function normalize(vector) {
  const sum = vector.reduce((total, value) => total + value, 0);
  if (Math.abs(sum) <= NUMERIC_EPSILON) return null;
  const normalized = vector.map((value) => value / sum);
  return normalized.every((value) => value >= -NUMERIC_EPSILON)
    ? normalized.map((value) => Math.max(0, value))
    : null;
}

function distancesFrom(matrix, start, tolerance) {
  const size = matrix.length;
  const distances = Array(size).fill(Number.POSITIVE_INFINITY);
  const queue = [start];
  distances[start] = 0;

  while (queue.length) {
    const current = queue.shift();
    for (let next = 0; next < size; next += 1) {
      if (
        matrix[current][next] <= tolerance ||
        distances[next] !== Number.POSITIVE_INFINITY
      ) {
        continue;
      }
      distances[next] = distances[current] + 1;
      queue.push(next);
    }
  }
  return distances;
}

function statePeriod(matrix, state, tolerance) {
  const fromState = distancesFrom(matrix, state, tolerance);
  let period = matrix[state][state] > tolerance ? 1 : 0;
  for (let target = 0; target < matrix.length; target += 1) {
    const toState = distancesFrom(matrix, target, tolerance);
    if (!Number.isFinite(fromState[target]) || !Number.isFinite(toState[state]))
      continue;
    const roundTrip = fromState[target] + toState[state];
    if (roundTrip > 0) period = gcd(period, roundTrip);
  }
  return period || null;
}

function cesaroLimit(matrix, initialState, iterations = 2000) {
  let distribution = Array.from({ length: matrix.length }, (_, index) =>
    index === initialState ? 1 : 0,
  );
  const accumulator = Array(matrix.length).fill(0);

  for (let step = 0; step < iterations; step += 1) {
    accumulator.forEach((value, index) => {
      accumulator[index] = value + distribution[index];
    });
    distribution = matMul([distribution], matrix)[0];
  }

  return normalize(accumulator.map((value) => value / iterations));
}

function hasOrdinaryLimit(matrix, tolerance) {
  const size = matrix.length;
  let previous = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0)),
  );
  let current = previous;

  for (let step = 0; step < 1200; step += 1) {
    current = matMul(current, matrix);
    const stable = current.every((row, rowIndex) =>
      row.every(
        (value, column) =>
          Math.abs(value - previous[rowIndex][column]) <= tolerance,
      ),
    );
    previous = current;
    if (stable) {
      const reference = current[0];
      return current.every((row) =>
        row.every(
          (value, index) => Math.abs(value - reference[index]) <= tolerance,
        ),
      );
    }
  }
  return false;
}

export function analyzeStationary(matrix, options = {}) {
  const validationTolerance = options.validationTolerance ?? DEFAULT_TOLERANCE;
  const numericTolerance = options.tolerance ?? 1e-9;
  const validation = validateTransitionMatrix(matrix, {
    tolerance: validationTolerance,
  });

  if (!validation.valid) {
    return {
      valid: false,
      validation,
      stationary: null,
      unique: false,
      irreducible: false,
      periods: [],
      ergodic: false,
      ordinaryLimit: false,
      initialDistributions: [],
      warnings: validation.errors,
    };
  }

  const size = matrix.length;
  const system = matrix.map((row, rowIndex) =>
    row.map(
      (_, columnIndex) =>
        matrix[columnIndex][rowIndex] - (rowIndex === columnIndex ? 1 : 0),
    ),
  );
  const basis = nullspace(system, numericTolerance);
  const unique = basis.length === 1;
  const stationary = unique ? normalize(basis[0]) : null;
  const irreducible = Array.from({ length: size }, (_, state) =>
    distancesFrom(matrix, state, numericTolerance).every(Number.isFinite),
  ).every(Boolean);
  const periods = Array.from({ length: size }, (_, state) =>
    statePeriod(matrix, state, numericTolerance),
  );
  const ergodic = irreducible && periods.every((period) => period === 1);
  const ordinaryLimit = hasOrdinaryLimit(matrix, 1e-8);
  const initialDistributions = Array.from(
    { length: size },
    (_, initialState) =>
      unique ? [...stationary] : cesaroLimit(matrix, initialState),
  );

  const warnings = [];
  if (!unique) {
    warnings.push(
      "La distribución estacionaria no es única: depende de la clase o del estado inicial.",
    );
  }
  if (!irreducible) {
    warnings.push(
      "La cadena es reducible: no todos los estados se comunican entre sí.",
    );
  }
  if (irreducible && periods.some((period) => period > 1)) {
    warnings.push(
      "La cadena es periódica: Pⁿ puede oscilar aunque la distribución estacionaria exista.",
    );
  }
  if (!ordinaryLimit && !warnings.length) {
    warnings.push(
      "No fue posible garantizar numéricamente la convergencia habitual de Pⁿ.",
    );
  }

  return {
    valid: true,
    validation,
    stationary,
    unique,
    basis,
    irreducible,
    periods,
    ergodic,
    ordinaryLimit,
    initialDistributions,
    warnings,
  };
}

export function stationaryDist(matrix, options = {}) {
  const analysis = analyzeStationary(matrix, options);
  if (!analysis.valid) throw new Error(analysis.validation.errors.join(" "));
  if (!analysis.unique) {
    throw new Error(
      "La distribución estacionaria no es única para la matriz proporcionada.",
    );
  }
  return analysis.stationary;
}

export function formatProbability(value, digits = 4) {
  return Number(value.toFixed(digits)).toString();
}

export function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}
