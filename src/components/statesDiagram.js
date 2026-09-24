import { getStateColors } from "../data/content.js";
import { createSvgElement, setSvgAccessibleName } from "../utils/svg.js";

const stateColors = getStateColors();

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

function curve(from, to, bend) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  const radius = 25;
  const offsetX = -ny * bend;
  const offsetY = nx * bend;
  const start = {
    x: from.x + nx * radius + offsetX,
    y: from.y + ny * radius + offsetY,
  };
  const end = {
    x: to.x - nx * radius + offsetX,
    y: to.y - ny * radius + offsetY,
  };
  const middle = {
    x: (start.x + end.x) / 2 + offsetX * 0.45,
    y: (start.y + end.y) / 2 + offsetY * 0.45,
  };
  return { start, end, middle };
}

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

  const defs = createSvgElement("defs");
  ["var(--text3)", "var(--accent)"].forEach((color, index) => {
    const marker = createSvgElement("marker", {
      id: `states-arrow-${index}`,
      markerWidth: 8,
      markerHeight: 8,
      refX: 7,
      refY: 4,
      orient: "auto",
    });
    marker.append(
      createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", fill: color }),
    );
    defs.append(marker);
  });
  svg.append(defs);

  const edgeLayer = createSvgElement("g");
  edges.forEach((edge) => {
    const from = nodes.find((node) => node.id === edge.from);
    const to = nodes.find((node) => node.id === edge.to);
    const highlighted = isHighlighted(edge, selection);
    const stroke = highlighted ? "var(--accent)" : "var(--border)";
    const marker = highlighted ? "states-arrow-1" : "states-arrow-0";

    if (edge.from === edge.to) {
      edgeLayer.append(
        createSvgElement("path", {
          d: `M${from.x - 10},${from.y - 24} C${from.x - 34},${from.y - 62} ${from.x + 34},${from.y - 62} ${from.x + 10},${from.y - 24}`,
          fill: "none",
          stroke,
          "stroke-width": highlighted ? 2 : 1,
          "marker-end": `url(#${marker})`,
        }),
        createSvgElement(
          "text",
          {
            x: from.x,
            y: from.y - 52,
            "text-anchor": "middle",
            class: "diagram-edge-label",
            fill: stroke,
          },
          edge.value.toFixed(1),
        ),
      );
      return;
    }

    const { start, end, middle } = curve(from, to, from.id < to.id ? 18 : -18);
    edgeLayer.append(
      createSvgElement("path", {
        d: `M${start.x},${start.y} Q${middle.x},${middle.y} ${end.x},${end.y}`,
        fill: "none",
        stroke,
        "stroke-width": highlighted ? 2 : 1,
        opacity: highlighted ? 1 : 0.65,
        "marker-end": `url(#${marker})`,
      }),
      createSvgElement(
        "text",
        {
          x: middle.x,
          y: middle.y - 4,
          "text-anchor": "middle",
          class: "diagram-edge-label",
          fill: stroke,
        },
        edge.value.toFixed(1),
      ),
    );
  });
  svg.append(edgeLayer);

  const nodeLayer = createSvgElement("g");
  nodes.forEach((node) => {
    const highlighted = isNodeHighlighted(node, selection);
    const color = highlighted ? node.color : "var(--text2)";
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
