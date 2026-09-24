import { createSvgElement } from "./svg.js";

export function edgeGeometry(from, to, radius, bend) {
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
  const control = {
    x: (start.x + end.x) / 2 + offsetX * 0.55,
    y: (start.y + end.y) / 2 + offsetY * 0.55,
  };
  return { start, end, control };
}

export function quadraticPoint(start, control, end, amount = 0.5) {
  const inverse = 1 - amount;
  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * amount * control.x +
      amount * amount * end.x,
    y:
      inverse * inverse * start.y +
      2 * inverse * amount * control.y +
      amount * amount * end.y,
  };
}

export function offsetPoint(point, start, end, amount) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  return {
    x: point.x + (-dy / distance) * amount,
    y: point.y + (dx / distance) * amount,
  };
}

export function createDiagramLabel(text, point, options = {}) {
  const label = String(text);
  const width = Math.max(34, label.length * 7 + 12);
  const group = createSvgElement("g", {
    class: "diagram-edge-label-group",
    transform: `translate(${point.x} ${point.y})`,
    "aria-hidden": "true",
  });
  group.setAttribute("data-label-x", point.x);
  group.setAttribute("data-label-y", point.y);
  group.setAttribute("data-label-width", width);
  group.setAttribute("data-label-height", 20);
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
        fill: options.fill ?? "var(--text-secondary)",
        opacity: options.opacity ?? 1,
      },
      label,
    ),
  );
  return group;
}

export function resolveLabelCollisions(container, gap = 5) {
  const groups = [...container.querySelectorAll(".diagram-edge-label-group")];
  const labels = groups.map((group) => ({
    group,
    x: Number(group.getAttribute("data-label-x")),
    y: Number(group.getAttribute("data-label-y")),
    width: Number(group.getAttribute("data-label-width")),
    height: Number(group.getAttribute("data-label-height")),
  }));

  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false;
    for (let firstIndex = 0; firstIndex < labels.length; firstIndex += 1) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < labels.length;
        secondIndex += 1
      ) {
        const first = labels[firstIndex];
        const second = labels[secondIndex];
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const overlapX = (first.width + second.width) / 2 + gap - Math.abs(dx);
        const overlapY =
          (first.height + second.height) / 2 + gap - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const direction =
            dx === 0 ? (secondIndex % 2 ? 1 : -1) : Math.sign(dx);
          second.x += direction * overlapX;
        } else {
          const direction =
            dy === 0 ? (secondIndex % 2 ? 1 : -1) : Math.sign(dy);
          second.y += direction * overlapY;
        }
      }
    }
    if (!moved) break;
  }

  labels.forEach(({ group, x, y }) => {
    group.setAttribute("data-label-x", x);
    group.setAttribute("data-label-y", y);
    group.setAttribute("transform", `translate(${x} ${y})`);
  });
}

export function createSelfLoop({
  point,
  center,
  radius,
  probability,
  stroke,
  marker,
  active,
  labelFill,
}) {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const distance = Math.hypot(dx, dy) || 1;
  const outward = { x: dx / distance, y: dy / distance };
  const angle = (Math.atan2(outward.y, outward.x) * 180) / Math.PI + 90;
  const pathGroup = createSvgElement("g", {
    class: "diagram-self-loop",
    transform: `translate(${point.x} ${point.y}) rotate(${angle})`,
    "aria-hidden": "true",
  });
  pathGroup.append(
    createSvgElement("path", {
      d: `M${-radius * 0.38},${-radius + 2} C${-radius * 1.25},${-radius * 2.05} ${radius * 1.25},${-radius * 2.05} ${radius * 0.38},${-radius + 2}`,
      fill: "none",
      stroke,
      "stroke-width": Math.max(1.2, probability * 4),
      opacity: active ? 0.95 : 0.4,
      "marker-end": `url(#${marker})`,
    }),
  );
  const labelPoint = {
    x: point.x + outward.x * (radius + 28),
    y: point.y + outward.y * (radius + 28),
  };
  const label = createDiagramLabel(probability.toFixed(2), labelPoint, {
    fill: labelFill,
    opacity: active ? 1 : 0.72,
  });
  return { pathGroup, label };
}
