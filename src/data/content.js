const percent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export const darkStateColors = [
  "#5ce1e6",
  "#9b8cff",
  "#ff7b7b",
  "#ffd166",
  "#43d9ad",
  "#f4c430",
];

export const lightStateColors = [
  "#006f73",
  "#5a43d6",
  "#b93648",
  "#7a5800",
  "#087a57",
  "#6b4f00",
];

export function getStateColors() {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? lightStateColors
    : darkStateColors;
}

export const appData = {
  clima: {
    title: "Predicción climática — Cartagena",
    sector: "Meteorología",
    description:
      "Un modelo didácticamente ilustrativo clasifica el estado climático diario como soleado, nublado o lluvioso y estima su probabilidad de transición.",
    matrix: [
      [0.6, 0.3, 0.1],
      [0.2, 0.5, 0.3],
      [0.1, 0.3, 0.6],
    ],
    names: ["Soleado", "Nublado", "Lluvioso"],
    interpretation: (pi) =>
      `Si las probabilidades se mantuvieran constantes, el proceso dedicaría aproximadamente ${percent(pi[0])} de sus días al estado soleado, ${percent(pi[1])} al nublado y ${percent(pi[2])} al lluvioso. Estos valores muestran la estructura del modelo, no el clima observado en una fecha concreta.`,
    useCase:
      "Planificación turística, logística portuaria y gestión de eventos al aire libre.",
    contextSource: {
      label: "IDEAM — datos climáticos de Colombia",
      url: "https://www.ideam.gov.co/",
    },
  },
  mercado: {
    title: "Análisis de mercado — Bolsa de Colombia",
    sector: "Finanzas",
    description:
      "Este ejemplo representa el mercado mediante los estados alcista, estable y bajista. Las probabilidades son ilustrativas y no constituyen una recomendación de inversión.",
    matrix: [
      [0.6, 0.3, 0.1],
      [0.15, 0.7, 0.15],
      [0.1, 0.3, 0.6],
    ],
    names: ["Alcista", "Estable", "Bajista"],
    interpretation: (pi) =>
      `La distribución estacionaria del ejemplo asigna aproximadamente ${percent(pi[0])} al estado alcista, ${percent(pi[1])} al estable y ${percent(pi[2])} al bajista. Un modelo real requiere datos históricos, una definición operativa de los estados y validación fuera de muestra.`,
    useCase:
      "Gestión de portafolios, análisis de riesgo y diseño de escenarios; no predicción garantizada.",
    contextSource: {
      label: "Bolsa de Colombia — información de mercado",
      url: "https://www.bvc.com.co/",
    },
  },
  cliente: {
    title: "Fidelización de clientes — retail",
    sector: "Mercadeo",
    description:
      "Una cadena de retail ficticia clasifica a sus clientes como activos, en riesgo o perdidos y modela la transición mensual entre esas categorías.",
    matrix: [
      [0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0.05, 0.15, 0.8],
    ],
    names: ["Activo", "En riesgo", "Perdido"],
    interpretation: (pi) =>
      `El ejemplo arroja una distribución de largo plazo aproximada de ${percent(pi[0])} para clientes activos, ${percent(pi[1])} en riesgo y ${percent(pi[2])} perdidos. Estos valores deben reemplazarse con datos de cohortes antes de tomar decisiones.`,
    useCase:
      "CRM, programas de fidelización y diseño de campañas de recuperación.",
    contextSource: {
      label: "DANE — estadísticas del comercio minorista",
      url: "https://www.dane.gov.co/",
    },
  },
  salud: {
    title: "Cadena de estados sanitarios — epidemiología",
    sector: "Salud pública",
    description:
      "El ejemplo representa las transiciones entre susceptible, infectado y recuperado. El estado recuperado es absorbente, por lo que representa el flujo poblacional de una enfermedad. Es una simplificación pedagógica, no un modelo epidemiological completo.",
    matrix: [
      [0.85, 0.14, 0.01],
      [0, 0.65, 0.35],
      [0, 0, 1],
    ],
    names: ["Susceptible", "Infectado", "Recuperado"],
    interpretation: (pi) =>
      `La distribución estacionaria concentra aproximadamente ${percent(pi[0])} en susceptible, ${percent(pi[1])} en infectado y ${percent(pi[2])} en recuperado. La cadena es reducible, pero en esta matriz el único estado recurrente cerrado es Recuperado y Pⁿ converge hacia él. Este ejemplo no sustituye un modelo epidémico completo.`,
    useCase:
      "Ilustración de flujos entre estados sanitarios; no sustituye un modelo SIR-SEIR con parámetros epidemiológicos.",
    contextSource: {
      label: "Organización Mundial de la Salud",
      url: "https://www.who.int/health-topics/epidemic-control",
    },
  },
  inventario: {
    title: "Control de inventarios",
    sector: "Logística",
    description:
      "Un centro de distribución ficticio clasifica el inventario como alto, normal o bajo y modela sus cambios entre períodos de reposición.",
    matrix: [
      [0.7, 0.2, 0.1],
      [0.3, 0.5, 0.2],
      [0.4, 0.4, 0.2],
    ],
    names: ["Alto", "Normal", "Bajo"],
    interpretation: (pi) =>
      `El modelo asigna aproximadamente ${percent(pi[0])} del tiempo al nivel alto, ${percent(pi[1])} al normal y ${percent(pi[2])} al bajo. Las probabilidades y los umbrales deben calibrarse con demanda, pedidos y tiempos de entrega reales.`,
    useCase:
      "Políticas de reorden, optimización de almacenes y dimensionamiento de inventarios.",
    contextSource: {
      label: "DANE — encuesta mensual de comercio",
      url: "https://www.dane.gov.co/",
    },
  },
  demografico: {
    title: "Movilidad social en Colombia",
    sector: "Demografía",
    description:
      "Este modelo simplificado representa el paso entre estratos socioeconomicos. Las probabilidades son ilustrativas y no reproducen una medición demográfica nacional.",
    matrix: [
      [0.75, 0.22, 0.03],
      [0.15, 0.7, 0.15],
      [0.02, 0.18, 0.8],
    ],
    names: ["Estrato bajo", "Estrato medio", "Estrato alto"],
    interpretation: (pi) =>
      `La distribución estacionaria del ejemplo corresponde aproximadamente a ${percent(pi[0])} en estrato bajo, ${percent(pi[1])} en estrato medio y ${percent(pi[2])} en estrato alto. Las diferencias entre grupos no se interpretan como relaciones causales.`,
    useCase:
      "Discusión de movilidad, desigualdad y diseño de estudios longitudinales; no causalidad.",
    contextSource: {
      label: "DANE — indicadores demográficos y de censo",
      url: "https://www.dane.gov.co/",
    },
  },
};

export const quizData = [
  {
    question: "¿Cuál es la propiedad de Markov?",
    options: [
      "El futuro depende de toda la historia",
      "El futuro depende únicamente del estado presente",
      "El presente depende del futuro",
      "Los estados siempre son finitos",
    ],
    answer: 1,
    explanation:
      "La distribución del siguiente estado depende únicamente del estado actual, no de la historia pasada.",
  },
  {
    question:
      "¿Qué condición debe cumplir cada fila de una matriz de transición?",
    options: [
      "Sumar 0",
      "Sumar 1",
      "Sumar infinito",
      "Tener elementos iguales",
    ],
    answer: 1,
    explanation:
      "Una matriz de transición por filas es estocástica: sus entradas son no negativas y cada fila suma 1.",
  },
  {
    question: "¿Qué caracteriza a un estado absorbente?",
    options: [
      "Sale con probabilidad 0,5",
      "Tiene pᵢᵢ = 1",
      "Regresa exactamente en dos pasos",
      "Siempre tiene período 1",
    ],
    answer: 1,
    explanation:
      "Un estado absorbente cumple pᵢᵢ = 1: una vez alcanzado, el proceso permanece allí indefinidamente.",
  },
  {
    question: "La distribución estacionaria de una matriz por filas satisface:",
    options: ["π = Pπ", "π = πP", "π = π²P", "πᵢ = 1 para todo estado"],
    answer: 1,
    explanation:
      "Con la convención de matriz por filas, π es un vector fila y cumple π = πP, además de Σπᵢ = 1.",
  },
  {
    question: "Una cadena ergódica finita es:",
    options: [
      "Absorbente y periódica",
      "Irreducible, recurrente positiva y aperiódica",
      "Reducible y transitoria",
      "Periódica con distribución única",
    ],
    answer: 1,
    explanation:
      "La irreducibilidad, la recurrencia positiva y la aperiodicidad permiten que Pⁿ converja a una distribución estacionaria única.",
  },
  {
    question: "Si un estado tiene período 1, entonces es:",
    options: ["Periódico", "Transitorio", "Aperiódico", "Absorbente"],
    answer: 2,
    explanation: "El período d(i) = 1 caracteriza a un estado aperiódico.",
  },
  {
    question: "¿Cómo se obtienen las probabilidades de transición en n pasos?",
    options: ["P⁽ⁿ⁾ = nP", "P⁽ⁿ⁾ = Pⁿ", "P⁽ⁿ⁾ = P + n", "P⁽ⁿ⁾ = √Pⁿ"],
    answer: 1,
    explanation:
      "La Chapman–Kolmogorov implica que la matriz de probabilidades en n pasos es Pⁿ.",
  },
  {
    question:
      "Partiendo de π₀, ¿cuál es la distribución después de tres pasos?",
    options: ["π₀ + 3P", "π₀P³", "3π₀P", "π₀³P"],
    answer: 1,
    explanation:
      "La distribución evoluciona multiplicando por P en cada paso: π₃ = π₀P³.",
  },
];

export const glossaryTerms = [
  {
    term: "Cadena de Markov",
    definition:
      "Proceso estocástico con la propiedad de que el estado futuro depende únicamente del estado presente.",
  },
  {
    term: "Propiedad de Markov",
    definition:
      "Propiedad sin memoria: P(Xₙ₊₁=j | Xₙ=i, Xₙ₋₁, …) = P(Xₙ₊₁=j | Xₙ=i).",
  },
  {
    term: "Proceso estocástico",
    definition:
      "Colección de variables aleatorias indexadas por el tiempo que describe la evolución aleatoria de un sistema.",
  },
  {
    term: "Espacio de estados",
    definition:
      "Conjunto de todos los valores que puede tomar el proceso. Puede ser finito o numerable.",
  },
  {
    term: "Probabilidad de transición",
    definition:
      "pᵢⱼ = P(Xₙ₊₁=j | Xₙ=i): probabilidad de pasar del estado i al estado j en un paso.",
  },
  {
    term: "Matriz de transición",
    definition:
      "Matriz P = [pᵢⱼ] que reúne las probabilidades de transición. En la convención del proyecto, sus filas suman 1.",
  },
  {
    term: "Matriz estocástica",
    definition:
      "Matriz con entradas no negativas cuyas filas suman 1. Es la representación de una cadena de Markov.",
  },
  {
    term: "Cadena homogénea",
    definition:
      "Cadena cuyas probabilidades de transición no cambian con el tiempo.",
  },
  {
    term: "Estado absorbente",
    definition:
      "Estado i con pᵢᵢ = 1, una vez alcanzado y sin cambios posteriores en el modelo.",
  },
  {
    term: "Estado transitorio",
    definition:
      "Estado cuya probabilidad de retorno es menor que 1; el proceso puede abandonarlo sin garantías.",
  },
  {
    term: "Estado recurrente",
    definition: "Estado al que el proceso regresa con probabilidad 1.",
  },
  {
    term: "Recurrente positivo",
    definition:
      "Estado recurrente con tiempo medio de retorno finito. En una cadena finita, todo estado recurrente es positivo.",
  },
  {
    term: "Recurrente nulo",
    definition:
      "Estado recurrente con tiempo medio de retorno infinito. No puede presentarse en una cadena finita.",
  },
  {
    term: "Período",
    definition:
      "d(i) = mcd{n ≥ 1: pᵢᵢ⁽ⁿ⁾ > 0}. Si d(i)=1, el estado es aperiódico.",
  },
  {
    term: "Estado aperiódico",
    definition:
      "Estado cuyo período es 1 y que puede regresar en uno o varios pasos.",
  },
  {
    term: "Cadena irreducible",
    definition:
      "Cadena en la que todos los estados se comunican entre sí: cualquier estado puede alcanzar a todos los demás.",
  },
  {
    term: "Clase de comunicación",
    definition:
      "Conjunto maximal de estados que se comunican entre sí. Una cadena irreducible tiene una sola clase.",
  },
  {
    term: "Distribución estacionaria",
    definition:
      "Vector π ≥ 0 tal que π = πP y Σπᵢ = 1. Puede ser único o no, según la estructura de la cadena.",
  },
  {
    term: "Distribución límite",
    definition:
      "Distribución a la que converge Pⁿ cuando la cadena es irreducible y aperiódica.",
  },
  {
    term: "Cadena ergódica",
    definition:
      "Cadena finita irreducible, recurrente positiva y aperiódica. Tiene una distribución estacionaria única a la que converge desde cualquier estado inicial.",
  },
  {
    term: "Ecuación de Chapman–Kolmogorov",
    definition: "pᵢⱼ⁽ᵐ⁺ⁿ⁾ = Σₖ pᵢₖ⁽ᵐ⁾pₖⱼ⁽ⁿ⁾; conduce a P⁽ᵐ⁺ⁿ⁾ = PᵐPⁿ.",
  },
  {
    term: "Tiempo medio de retorno",
    definition:
      "Esperanza del tiempo necesario para regresar a i. Para un estado recurrente positivo, μᵢ = 1/πᵢ.",
  },
];

export const references = [
  {
    id: "norris-1998",
    text: "Norris, M. (1998). Markov Chains. Cambridge University Press.",
    url: "https://doi.org/10.1017/CBO9780511626941",
  },
  {
    id: "kemeny-snell-1960",
    text: "Kemeny, J. G. y Snell, J. L. (1960). Finite Markov Chains. D. Van Nostrand.",
  },
  {
    id: "grinstead-snell-1997",
    text: "Grinstead, C. M. y Snell, J. L. (1997). Introduction to Probability. AMS.",
  },
];
