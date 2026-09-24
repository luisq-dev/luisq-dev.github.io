import { getStateColors } from "../data/content.js";
import { createSvgElement, setSvgAccessibleName } from "../utils/svg.js";
import {
  createDirectedEdge,
  createSelfLoop,
  edgeGeometry,
  labelPlacement,
  pairNormal,
} from "../utils/diagram.js";

const labelAmountCandidates = [0.5, 0.4, 0.6, 0.32, 0.68, 0.24, 0.76];

function transitionId(svg, from, to) {
  return `${svg.id}-transition-${from}-${to}`;
}

function labelBounds(position, text, gap = 4) {
  const width = Math.max(34, String(text).length * 7 + 12);
  return {
    left: position.x - width / 2 - gap,
    right: position.x + width / 2 + gap,
    top: position.y - 10 - gap,
    bottom: position.y + 10 + gap,
  };
}

function overlapArea(first, second) {
  const width = Math.max(
    0,
    Math.min(first.right, second.right) - Math.max(first.left, second.left),
  );
  const height = Math.max(
    0,
    Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
  );
  return width * height;
}

function conflictsWithNode(bounds, node, radius) {
  const nearestX = Math.max(bounds.left, Math.min(node.x, bounds.right));
  const nearestY = Math.max(bounds.top, Math.min(node.y, bounds.bottom));
  return Math.hypot(node.x - nearestX, node.y - nearestY) < radius + 5;
}

// Select a readable point along each edge's own cubic. No label has an
// independent absolute position; the solver only chooses a path parameter.
function chooseLabelAmounts(descriptors, points, radius) {
  const selected = new Map();
  const placed = [];
  const optionsFor = (descriptor) =>
    labelAmountCandidates.map((amount) => {
      const placement = labelPlacement({
        geometry: descriptor.geometry,
        normal: descriptor.normal,
        offset: descriptor.offset,
        labelOffset: descriptor.labelOffset,
        labelAmount: amount,
      });
      const bounds = labelBounds(placement.position, descriptor.label);
      const overlap = placed.reduce(
        (total, current) => total + overlapArea(bounds, current),
        0,
      );
      const nodeConflict = points.some((point) =>
        conflictsWithNode(bounds, point, radius),
      );
      const midpointPenalty = Math.abs(amount - 0.5) * 10;
      return {
        amount,
        placement,
        bounds,
        score: overlap * 100 + (nodeConflict ? 1000 : 0) + midpointPenalty,
      };
    });

  if (descriptors.length <= 8) {
    const search = (index) => {
      if (index === descriptors.length) return true;
      const descriptor = descriptors[index];
      const options = optionsFor(descriptor).sort(
        (first, second) => first.score - second.score,
      );
      for (const option of options) {
        const collides = placed.some((current) =>
          Boolean(overlapArea(option.bounds, current)),
        );
        if (collides) continue;
        placed.push(option.bounds);
        selected.set(descriptor.id, option.amount);
        if (search(index + 1)) return true;
        placed.pop();
        selected.delete(descriptor.id);
      }
      return false;
    };
    if (search(0)) return selected;
  }

  descriptors.forEach((descriptor) => {
    const options = optionsFor(descriptor).sort(
      (first, second) => first.score - second.score,
    );
    const available = options.find(
      (option) =>
        !placed.some((current) => overlapArea(option.bounds, current)),
    );
    const choice = available ?? options[0];
    selected.set(descriptor.id, choice.amount);
    placed.push(choice.bounds);
  });
  return selected;
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
  const pairNormals = new Map();
  const getPairNormal = (from, to) => {
    const first = Math.min(from, to);
    const second = Math.max(from, to);
    const key = `${first}-${second}`;
    if (!pairNormals.has(key)) {
      pairNormals.set(key, pairNormal(points[first], points[second]));
    }
    return pairNormals.get(key);
  };

  const title = options.title ?? "Diagrama de transición";
  const description =
    options.description ??
    `Diagrama circular con ${size} estados. Las flechas muestran las probabilidades registradas en la matriz.`;
  setSvgAccessibleName(svg, title, description);

  const edges = [];
  const descriptors = [];
  const bendMagnitude = size <= 3 ? 52 : 44;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const probability = matrix[row][column];
      if (!Number.isFinite(probability) || probability < 0.0005) continue;
      const color = colors[row % colors.length];
      const isActive =
        activeState === undefined ||
        row === activeState ||
        column === activeState;
      const stroke = isActive ? color : "var(--text-secondary)";
      const labelFill = isActive ? color : "var(--text-secondary)";
      const metadata = {
        from: names[row] ?? row,
        to: names[column] ?? column,
        fromIndex: row,
        toIndex: column,
      };
      const id = transitionId(svg, row, column);

      if (row === column) {
        const loop = createSelfLoop({
          id,
          point: points[row],
          center,
          radius,
          probability,
          label: probability.toFixed(2),
          stroke,
          width: Math.max(1.4, probability * 4.2),
          opacity: isActive ? 0.95 : 0.55,
          labelFill,
          labelOpacity: isActive ? 1 : 0.86,
          labelOffset: size <= 3 ? 18 : 14,
          metadata,
        });
        edges.push({ active: isActive, ...loop });
        continue;
      }

      const normal = getPairNormal(row, column);
      const offset = row < column ? bendMagnitude : -bendMagnitude;
      const geometry = edgeGeometry(
        points[row],
        points[column],
        radius,
        normal,
        offset,
      );
      descriptors.push({
        id,
        row,
        column,
        probability,
        label: probability.toFixed(2),
        normal,
        offset,
        geometry,
        labelOffset: size <= 3 ? 14 : 11,
        metadata,
        isActive,
        stroke,
        labelFill,
      });
    }
  }

  const labelAmounts = chooseLabelAmounts(descriptors, points, radius);
  descriptors.forEach((descriptor) => {
    const edge = createDirectedEdge({
      id: descriptor.id,
      from: points[descriptor.row],
      to: points[descriptor.column],
      radius,
      normal: descriptor.normal,
      offset: descriptor.offset,
      probability: descriptor.probability,
      label: descriptor.label,
      stroke: descriptor.stroke,
      width: Math.max(1.4, descriptor.probability * 4.2),
      opacity: descriptor.isActive ? 0.95 : 0.55,
      labelFill: descriptor.labelFill,
      labelOpacity: descriptor.isActive ? 1 : 0.86,
      labelOffset: descriptor.labelOffset,
      labelAmount: labelAmounts.get(descriptor.id) ?? 0.5,
      metadata: descriptor.metadata,
    });
    edges.push({ active: descriptor.isActive, ...edge });
  });

  edges.sort((first, second) => Number(first.active) - Number(second.active));
  const edgeLayer = createSvgElement("g", { class: "diagram-edges" });
  edges.forEach(({ group }) => edgeLayer.append(group));
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
