import { createSvgElement } from "./svg.js";

function addNumber(value) {
  return Number(value.toFixed(2));
}

function point(x, y) {
  return { x, y };
}

function addPoints(first, second) {
  return point(addNumber(first.x + second.x), addNumber(first.y + second.y));
}

function multiplyPoint(value, amount) {
  return point(addNumber(value.x * amount), addNumber(value.y * amount));
}

function cubicPoint(start, control1, control2, end, amount) {
  const inverse = 1 - amount;
  return point(
    addNumber(
      inverse ** 3 * start.x +
        3 * inverse ** 2 * amount * control1.x +
        3 * inverse * amount ** 2 * control2.x +
        amount ** 3 * end.x,
    ),
    addNumber(
      inverse ** 3 * start.y +
        3 * inverse ** 2 * amount * control1.y +
        3 * inverse * amount ** 2 * control2.y +
        amount ** 3 * end.y,
    ),
  );
}

function cubicPathData(start, control1, control2, end) {
  return `M${start.x},${start.y} C${control1.x},${control1.y} ${control2.x},${control2.y} ${end.x},${end.y}`;
}

export function pairNormal(first, second) {
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const distance = Math.hypot(dx, dy) || 1;
  return point(-dy / distance, dx / distance);
}

// The normal is calculated once for an unordered pair of nodes. Reversing an
// edge therefore changes the offset sign without flipping the normal again.
export function edgeGeometry(from, to, radius, normal, offset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const direction = point(dx / distance, dy / distance);
  const start = addPoints(from, multiplyPoint(direction, radius));
  const end = addPoints(to, multiplyPoint(direction, -(radius + 10)));
  const controlOffset = multiplyPoint(normal, offset);
  const control1 = addPoints(
    start,
    addPoints(multiplyPoint(direction, distance * 0.28), controlOffset),
  );
  const control2 = addPoints(
    end,
    addPoints(multiplyPoint(direction, -distance * 0.28), controlOffset),
  );
  return { start, end, control1, control2, normal, offset };
}

// Labels are sampled from the same cubic path as their transition. The short
// leader preserves that relationship when the label is offset for legibility.
export function labelPlacement({
  geometry,
  normal,
  offset,
  labelOffset = 14,
  labelAmount = 0.5,
}) {
  const anchor = cubicPoint(
    geometry.start,
    geometry.control1,
    geometry.control2,
    geometry.end,
    labelAmount,
  );
  return {
    anchor,
    position: addPoints(
      anchor,
      multiplyPoint(normal, labelOffset * Math.sign(offset || 1)),
    ),
  };
}

function addEdgeMetadata(element, metadata) {
  Object.entries(metadata).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.setAttribute(`data-${name}`, String(value));
    }
  });
}

export function createPointLabel({
  text,
  position,
  fill = "var(--text-secondary)",
  opacity = 1,
  metadata = {},
}) {
  const label = String(text);
  const width = Math.max(34, label.length * 7 + 12);
  const group = createSvgElement("g", {
    class: "diagram-edge-label-group",
    transform: `translate(${position.x} ${position.y})`,
    "aria-hidden": "true",
  });
  addEdgeMetadata(group, {
    ...metadata,
    labelX: position.x,
    labelY: position.y,
  });
  group.append(
    createSvgElement("rect", {
      x: -width / 2,
      y: -10,
      width,
      height: 20,
      rx: 6,
      fill: "var(--surface)",
      stroke: "var(--border)",
      "stroke-width": 0.8,
      opacity: 0.96,
    }),
    createSvgElement(
      "text",
      {
        x: 0,
        y: 4,
        "text-anchor": "middle",
        class: "diagram-edge-label",
        fill,
        opacity,
      },
      label,
    ),
  );
  return group;
}

function createArrowHead(end, control, fill, opacity) {
  const dx = end.x - control.x;
  const dy = end.y - control.y;
  const distance = Math.hypot(dx, dy) || 1;
  const direction = point(dx / distance, dy / distance);
  const perpendicular = point(-direction.y, direction.x);
  const size = 9;
  const base = addPoints(end, multiplyPoint(direction, -size));
  const left = addPoints(base, multiplyPoint(perpendicular, size * 0.55));
  const right = addPoints(base, multiplyPoint(perpendicular, -size * 0.55));
  return createSvgElement("path", {
    class: "diagram-arrowhead",
    d: `M${end.x},${end.y} L${left.x},${left.y} L${right.x},${right.y} Z`,
    fill,
    opacity,
    "pointer-events": "none",
    "aria-hidden": "true",
  });
}

function createLeader(anchor, position, stroke, opacity) {
  return createSvgElement("path", {
    class: "diagram-label-leader",
    d: `M${anchor.x},${anchor.y} L${position.x},${position.y}`,
    fill: "none",
    stroke,
    "stroke-width": 1.2,
    opacity,
    "vector-effect": "non-scaling-stroke",
    "aria-hidden": "true",
  });
}

export function createDirectedEdge({
  id,
  from,
  to,
  radius,
  normal,
  offset,
  probability,
  label,
  stroke,
  width,
  opacity,
  labelFill,
  labelOpacity,
  labelOffset = 14,
  labelAmount = 0.5,
  metadata = {},
}) {
  const geometry = edgeGeometry(from, to, radius, normal, offset);
  const path = createSvgElement("path", {
    id,
    d: cubicPathData(
      geometry.start,
      geometry.control1,
      geometry.control2,
      geometry.end,
    ),
    fill: "none",
    stroke,
    "stroke-width": width,
    opacity,
    "vector-effect": "non-scaling-stroke",
  });
  const arrowhead = createArrowHead(
    geometry.end,
    geometry.control2,
    stroke,
    opacity,
  );
  const { anchor, position: labelPosition } = labelPlacement({
    geometry,
    normal,
    offset,
    labelOffset,
    labelAmount,
  });
  const leader = createLeader(anchor, labelPosition, stroke, opacity * 0.8);
  const labelElement = createPointLabel({
    text: label,
    position: labelPosition,
    fill: labelFill,
    opacity: labelOpacity,
    metadata: {
      ...metadata,
      anchorX: anchor.x,
      anchorY: anchor.y,
    },
  });
  const group = createSvgElement("g", {
    class: "diagram-edge",
    "aria-hidden": "true",
  });
  addEdgeMetadata(group, {
    edgeId: id,
    ...metadata,
    probability,
    anchorX: anchor.x,
    anchorY: anchor.y,
  });
  addEdgeMetadata(path, metadata);
  group.append(path, arrowhead, leader, labelElement);
  return {
    group,
    path,
    arrowhead,
    label: labelElement,
    leader,
    geometry,
    anchor,
  };
}

export function createSelfLoop({
  id,
  point: node,
  center,
  radius,
  probability,
  label,
  stroke,
  width,
  opacity,
  labelFill,
  labelOpacity,
  labelOffset = 18,
  metadata = {},
}) {
  const dx = node.x - center.x;
  const dy = node.y - center.y;
  const distance = Math.hypot(dx, dy) || 1;
  const outward = point(dx / distance, dy / distance);
  const angle = Math.atan2(outward.y, outward.x) + Math.PI / 2;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotate = (value) =>
    point(
      addNumber(value.x * cosine - value.y * sine),
      addNumber(value.x * sine + value.y * cosine),
    );
  const start = addPoints(node, rotate(point(-radius * 0.38, -radius + 2)));
  const control1 = addPoints(
    node,
    rotate(point(-radius * 1.25, -radius * 2.05)),
  );
  const control2 = addPoints(
    node,
    rotate(point(radius * 1.25, -radius * 2.05)),
  );
  const end = addPoints(node, rotate(point(radius * 0.38, -radius + 2)));
  const path = createSvgElement("path", {
    id,
    d: cubicPathData(start, control1, control2, end),
    fill: "none",
    stroke,
    "stroke-width": width,
    opacity,
    "vector-effect": "non-scaling-stroke",
  });
  const arrowhead = createArrowHead(end, control2, stroke, opacity);
  const anchor = cubicPoint(start, control1, control2, end, 0.5);
  const labelPosition = addPoints(anchor, multiplyPoint(outward, labelOffset));
  const leader = createLeader(anchor, labelPosition, stroke, opacity * 0.8);
  const labelElement = createPointLabel({
    text: label,
    position: labelPosition,
    fill: labelFill,
    opacity: labelOpacity,
    metadata: {
      ...metadata,
      anchorX: anchor.x,
      anchorY: anchor.y,
    },
  });
  const group = createSvgElement("g", {
    class: "diagram-edge diagram-edge-loop",
    "aria-hidden": "true",
  });
  addEdgeMetadata(group, {
    edgeId: id,
    ...metadata,
    probability,
    anchorX: anchor.x,
    anchorY: anchor.y,
  });
  addEdgeMetadata(path, metadata);
  group.append(path, arrowhead, leader, labelElement);
  return { group, path, arrowhead, label: labelElement, leader, anchor };
}
