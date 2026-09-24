import { getStateColors } from "../data/content.js";
import { createSvgElement, setSvgAccessibleName } from "../utils/svg.js";
import {
  createDiagramLabel,
  createSelfLoop,
  edgeGeometry,
  offsetPoint,
  quadraticPoint,
  resolveLabelCollisions,
} from "../utils/diagram.js";

function addMarkers(defs, idPrefix, colors) {
  colors.forEach((color, index) => {
    const marker = createSvgElement("marker", {
      id: `${idPrefix}-arrow-${index}`,
      markerWidth: 8,
      markerHeight: 8,
      refX: 7,
      refY: 4,
      orient: "auto",
      markerUnits: "userSpaceOnUse",
    });
    marker.append(
      createSvgElement("path", { d: "M0,0 L8,4 L0,8 Z", fill: color }),
    );
    defs.append(marker);
  });
}

function edgeLabelPoint(start, control, end, direction) {
  const point = quadraticPoint(
    start,
    control,
    end,
    direction > 0 ? 0.38 : 0.52,
  );
  return offsetPoint(point, start, end, 12);
}

export function renderCircularDiagram(svg, matrix, names, options = {}) {
  if (!svg) return;
  const size = matrix.length;
  const width = options.width ?? 600;
  const height = options.height ?? 460;
  const radius = options.radius ?? 32;
  const ringRadius = options.ringRadius ?? (size <= 3 ? 145 : 170);
  const center = { x: width / 2, y: height / 2 };
  const colors = options.colors ?? getStateColors();
  const activeState = options.activeState;
  const points = Array.from({ length: size }, (_, index) => ({
    x:
      center.x +
      ringRadius * Math.cos((2 * Math.PI * index) / size - Math.PI / 2),
    y:
      center.y +
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

  const edges = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const probability = matrix[row][column];
      if (!Number.isFinite(probability) || probability < 0.0005) continue;
      const color = colors[row % colors.length];
      const isActive =
        activeState === undefined ||
        row === activeState ||
        column === activeState;
      const stroke = isActive ? color : "var(--border2)";
      const labelFill = isActive ? color : "var(--text-secondary)";
      const marker = `${svg.id}-${isActive ? "default" : "muted"}-${row % colors.length}`;

      if (row === column) {
        const loop = createSelfLoop({
          point: points[row],
          center,
          radius,
          probability,
          stroke,
          marker,
          active: isActive,
          labelFill,
        });
        edges.push({
          active: isActive,
          path: loop.pathGroup,
          label: loop.label,
        });
        continue;
      }

      const direction = row < column ? 1 : -1;
      const bend = direction * (size <= 3 ? 38 : 46);
      const { start, end, control } = edgeGeometry(
        points[row],
        points[column],
        radius,
        bend,
      );
      const labelPoint = edgeLabelPoint(start, control, end, direction);
      const path = createSvgElement("path", {
        d: `M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`,
        fill: "none",
        stroke,
        "stroke-width": Math.max(1.2, probability * 4),
        opacity: isActive ? 0.95 : 0.38,
        "marker-end": `url(#${marker})`,
      });
      edges.push({
        active: isActive,
        path,
        label: createDiagramLabel(probability.toFixed(2), labelPoint, {
          fill: labelFill,
          opacity: isActive ? 1 : 0.72,
        }),
      });
    }
  }

  // Draw inactive transitions first so the active state remains readable.
  edges.sort((first, second) => Number(first.active) - Number(second.active));
  const edgeLayer = createSvgElement("g", { class: "diagram-edges" });
  edges.forEach(({ path, label }) => edgeLayer.append(path, label));
  resolveLabelCollisions(edgeLayer);
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
            fill: "var(--text-secondary)",
          },
          names[index],
        ),
      );
    }
    nodeLayer.append(group);
  });
  svg.append(nodeLayer);
}
