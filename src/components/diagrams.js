import { getStateColors } from "../data/content.js";
import { createSvgElement, setSvgAccessibleName } from "../utils/svg.js";

function addMarkers(defs, idPrefix, colors) {
  colors.forEach((color, index) => {
    const marker = createSvgElement("marker", {
      id: `${idPrefix}-arrow-${index}`,
      markerWidth: 8,
      markerHeight: 8,
      refX: 7,
      refY: 4,
      orient: "auto",
      markerUnits: "strokeWidth",
    });
    marker.append(
      createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", fill: color }),
    );
    defs.append(marker);
  });
}

function edgeGeometry(from, to, radius, bend) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
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
    x: (start.x + end.x) / 2 + offsetX * 0.35,
    y: (start.y + end.y) / 2 + offsetY * 0.35,
  };
  return { start, end, middle };
}

export function renderCircularDiagram(svg, matrix, names, options = {}) {
  if (!svg) return;
  const size = matrix.length;
  const width = options.width ?? 600;
  const height = options.height ?? 460;
  const radius = options.radius ?? 32;
  const ringRadius = options.ringRadius ?? (size <= 3 ? 145 : 170);
  const centerX = width / 2;
  const centerY = height / 2;
  const colors = options.colors ?? getStateColors();
  const activeState = options.activeState;
  const points = Array.from({ length: size }, (_, index) => ({
    x:
      centerX +
      ringRadius * Math.cos((2 * Math.PI * index) / size - Math.PI / 2),
    y:
      centerY +
      ringRadius * Math.sin((2 * Math.PI * index) / size - Math.PI / 2),
  }));

  const title = options.title ?? "Diagrama de transición";
  const description =
    options.description ??
    `Diagrama circular con ${size} estados. Las flechas muestran las probabilidades registradas en la matriz.`;
  setSvgAccessibleName(svg, title, description);

  const defs = createSvgElement("defs");
  addMarkers(defs, `${svg.id}-default`, colors);
  addMarkers(
    defs,
    `${svg.id}-muted`,
    colors.map(() => "var(--border2)"),
  );
  svg.append(defs);

  const edgeLayer = createSvgElement("g", { class: "diagram-edges" });
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const probability = matrix[row][column];
      if (probability < 0.0005) continue;
      const color = colors[row % colors.length];
      const isActive =
        activeState === undefined ||
        row === activeState ||
        column === activeState;
      const stroke = isActive ? color : "var(--border2)";
      const marker = `${svg.id}-${isActive ? "default" : "muted"}-${row % colors.length}`;

      if (row === column) {
        const point = points[row];
        edgeLayer.append(
          createSvgElement("path", {
            d: `M${point.x - 12},${point.y - radius - 3} C${point.x - 42},${point.y - radius - 54} ${point.x + 42},${point.y - radius - 54} ${point.x + 12},${point.y - radius - 3}`,
            fill: "none",
            stroke,
            "stroke-width": Math.max(1.2, probability * 4),
            opacity: isActive ? 0.95 : 0.35,
            "marker-end": `url(#${marker})`,
          }),
          createSvgElement(
            "text",
            {
              x: point.x,
              y: point.y - radius - 43,
              "text-anchor": "middle",
              class: "diagram-edge-label",
              fill: stroke,
            },
            probability.toFixed(2),
          ),
        );
        continue;
      }

      const bend = row < column ? 18 : -18;
      const { start, end, middle } = edgeGeometry(
        points[row],
        points[column],
        radius,
        bend,
      );
      edgeLayer.append(
        createSvgElement("path", {
          d: `M${start.x},${start.y} Q${middle.x},${middle.y} ${end.x},${end.y}`,
          fill: "none",
          stroke,
          "stroke-width": Math.max(1.2, probability * 4),
          opacity: isActive ? 0.95 : 0.3,
          "marker-end": `url(#${marker})`,
        }),
        createSvgElement(
          "text",
          {
            x: middle.x,
            y: middle.y - 5,
            "text-anchor": "middle",
            class: "diagram-edge-label",
            fill: stroke,
            opacity: isActive ? 1 : 0.6,
          },
          probability.toFixed(2),
        ),
      );
    }
  }
  svg.append(edgeLayer);

  const nodeLayer = createSvgElement("g", { class: "diagram-nodes" });
  points.forEach((point, index) => {
    const color = colors[index % colors.length];
    const isActive = activeState === index;
    const group = createSvgElement("g", {
      class: `diagram-node${isActive ? " active" : ""}`,
      "aria-hidden": "true",
    });
    group.append(
      createSvgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: radius,
        fill: isActive ? `${color}24` : "var(--surface)",
        stroke: isActive ? color : "var(--border2)",
        "stroke-width": isActive ? 3.5 : 1.5,
      }),
      createSvgElement(
        "text",
        {
          x: point.x,
          y: point.y - (options.showNames ? 3 : 5),
          "text-anchor": "middle",
          class: "diagram-node-label",
          fill: color,
        },
        options.shortNames?.[index] ?? String.fromCharCode(65 + index),
      ),
    );
    if (options.showNames) {
      group.append(
        createSvgElement(
          "text",
          {
            x: point.x,
            y: point.y + 14,
            "text-anchor": "middle",
            class: "diagram-node-name",
            fill: "var(--text2)",
          },
          names[index],
        ),
      );
    }
    nodeLayer.append(group);
  });
  svg.append(nodeLayer);
}
