import { getStateColors } from "../data/content.js";
import { createSvgElement, setSvgAccessibleName } from "../utils/svg.js";
import {
  createDirectedEdge,
  createSelfLoop,
  pairNormal,
} from "../utils/diagram.js";

const stateColors = getStateColors();
const center = { x: 260, y: 200 };
const nodes = [
  {
    id: "S1",
    x: 72,
    y: 200,
    label: "S₁",
    type: "absorbente",
    color: stateColors[2],
  },
  {
    id: "S2",
    x: 205,
    y: 86,
    label: "S₂",
    type: "transitorio",
    color: stateColors[3],
  },
  {
    id: "S3",
    x: 205,
    y: 314,
    label: "S₃",
    type: "transitorio",
    color: stateColors[3],
  },
  {
    id: "S4",
    x: 350,
    y: 200,
    label: "S₄",
    type: "recurrente",
    color: stateColors[4],
  },
  {
    id: "S5",
    x: 455,
    y: 98,
    label: "S₅",
    type: "recurrente",
    color: stateColors[1],
  },
  {
    id: "S6",
    x: 455,
    y: 302,
    label: "S₆",
    type: "recurrente",
    color: stateColors[1],
  },
];

const nodeIndexes = new Map(nodes.map((node, index) => [node.id, index]));
const pairNormals = new Map();
const getPairNormal = (fromId, toId) => {
  const firstIndex = nodeIndexes.get(fromId);
  const secondIndex = nodeIndexes.get(toId);
  const first = Math.min(firstIndex, secondIndex);
  const second = Math.max(firstIndex, secondIndex);
  const key = `${first}-${second}`;
  if (!pairNormals.has(key)) {
    pairNormals.set(key, pairNormal(nodes[first], nodes[second]));
  }
  return pairNormals.get(key);
};

const edges = [
  { from: "S1", to: "S1", value: 1 },
  { from: "S2", to: "S1", value: 0.3 },
  { from: "S2", to: "S3", value: 0.3 },
  { from: "S2", to: "S4", value: 0.4 },
  { from: "S3", to: "S1", value: 0.2 },
  { from: "S3", to: "S2", value: 0.3 },
  { from: "S3", to: "S4", value: 0.5 },
  { from: "S4", to: "S5", value: 0.5 },
  { from: "S4", to: "S6", value: 0.5 },
  { from: "S5", to: "S4", value: 0.2 },
  { from: "S5", to: "S5", value: 0.3 },
  { from: "S5", to: "S6", value: 0.5 },
  { from: "S6", to: "S4", value: 0.1 },
  { from: "S6", to: "S5", value: 0.5 },
  { from: "S6", to: "S6", value: 0.4 },
];

const descriptions = {
  absorbente:
    "S₁ es absorbente: p₁₁ = 1. Una vez alcanzado, el proceso permanece en S₁.",
  transitorio:
    "S₂ y S₃ son transitorios: pueden pasar a S₁ o a la clase cerrada sin garantías de regresar.",
  recurrente:
    "S₄, S₅ y S₆ pertenecen a una clase cerrada irreducible; desde cualquiera de ellos se vuelve a cada estado de la clase con probabilidad 1.",
  periodo:
    "S₄, S₅ y S₆ tienen período 1 porque la clase cerrada contiene bucles propios; por ello es aperiódica.",
  ergodica:
    "La clase cerrada C = {S₄, S₅, S₆} es irreducible y aperiódica: restringida a C, la cadena es ergódica y tiene una distribución estacionaria única. La cadena completa es reducible.",
};

function isHighlighted(edge, selection) {
  if (!selection) return false;
  if (selection === "ergodica" || selection === "periodo") {
    return (
      ["S4", "S5", "S6"].includes(edge.from) &&
      ["S4", "S5", "S6"].includes(edge.to)
    );
  }
  const from = nodes.find((node) => node.id === edge.from);
  const to = nodes.find((node) => node.id === edge.to);
  return from.type === selection || to.type === selection;
}

function isNodeHighlighted(node, selection) {
  if (!selection) return false;
  if (selection === "ergodica" || selection === "periodo") {
    return ["S4", "S5", "S6"].includes(node.id);
  }
  return node.type === selection;
}

function render(svg, selection) {
  setSvgAccessibleName(
    svg,
    "Diagrama de estados y clases de comunicación",
    "S₁ es absorbente; S₂ y S₃ son transitorios; S₄, S₅ y S₆ forman una clase cerrada ergódica.",
  );

  const edgeEntries = [];
  edges.forEach((edge) => {
    const from = nodes.find((node) => node.id === edge.from);
    const to = nodes.find((node) => node.id === edge.to);
    const active = isHighlighted(edge, selection);
    const stroke = active ? "var(--accent)" : "var(--text-secondary)";
    const labelFill = active ? "var(--accent)" : "var(--text-secondary)";
    const id = `statesDiagram-transition-${edge.from}-${edge.to}`;
    const metadata = {
      from: edge.from,
      to: edge.to,
    };

    if (edge.from === edge.to) {
      const loop = createSelfLoop({
        id,
        point: from,
        center,
        radius: 25,
        probability: edge.value,
        label: edge.value.toFixed(1),
        stroke,
        width: active ? 2.4 : 1.4,
        opacity: active ? 1 : 0.7,
        labelFill,
        labelOpacity: active ? 1 : 0.86,
        labelOffset: 11,
        metadata,
      });
      edgeEntries.push({ active, ...loop });
      return;
    }

    const fromIndex = nodeIndexes.get(edge.from);
    const toIndex = nodeIndexes.get(edge.to);
    const edgeEntry = createDirectedEdge({
      id,
      from,
      to,
      radius: 25,
      normal: getPairNormal(edge.from, edge.to),
      offset: fromIndex < toIndex ? 30 : -30,
      probability: edge.value,
      label: edge.value.toFixed(1),
      stroke,
      width: active ? 2.2 : 1.3,
      opacity: active ? 1 : 0.7,
      labelFill,
      labelOpacity: active ? 1 : 0.86,
      labelOffset: 10,
      metadata,
    });
    edgeEntries.push({ active, ...edgeEntry });
  });

  edgeEntries.sort(
    (first, second) => Number(first.active) - Number(second.active),
  );
  const edgeLayer = createSvgElement("g", { class: "diagram-edges" });
  edgeEntries.forEach(({ group }) => edgeLayer.append(group));
  svg.append(edgeLayer);

  const nodeLayer = createSvgElement("g", { class: "diagram-nodes" });
  nodes.forEach((node) => {
    const highlighted = isNodeHighlighted(node, selection);
    const color = highlighted ? node.color : "var(--text-secondary)";
    nodeLayer.append(
      createSvgElement("circle", {
        cx: node.x,
        cy: node.y,
        r: 25,
        fill: highlighted ? "var(--surface-raised)" : "var(--surface)",
        stroke: color,
        "stroke-width": highlighted ? 3 : 1.5,
      }),
      createSvgElement(
        "text",
        {
          x: node.x,
          y: node.y + 5,
          "text-anchor": "middle",
          class: "diagram-node-label",
          fill: color,
        },
        node.label,
      ),
    );
  });
  svg.append(nodeLayer);
}

export function initStatesDiagram() {
  const svg = document.querySelector("#statesDiagram");
  const legend = document.querySelector("#diagramLegend");
  const cards = [...document.querySelectorAll(".state-card[data-state]")];
  if (!svg || !legend || !cards.length) return;

  const select = (card) => {
    const alreadySelected = card.getAttribute("aria-pressed") === "true";
    cards.forEach((candidate) =>
      candidate.setAttribute("aria-pressed", "false"),
    );
    const selection = alreadySelected ? null : card.dataset.state;
    card.setAttribute("aria-pressed", String(!alreadySelected));
    render(svg, selection);
    legend.textContent = selection
      ? descriptions[selection]
      : "Selecciona una propiedad para resaltar los estados o la clase correspondientes.";
  };

  cards.forEach((card) => card.addEventListener("click", () => select(card)));
  render(svg, null);
}
