export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function createSvgElement(tagName, attributes = {}, text) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null)
      element.setAttribute(name, String(value));
  });
  if (text !== undefined) element.textContent = text;
  return element;
}

export function setSvgAccessibleName(svg, title, description = "") {
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-labelledby", `${svg.id}-title ${svg.id}-description`);
  svg.replaceChildren();
  svg.append(
    createSvgElement("title", { id: `${svg.id}-title` }, title),
    createSvgElement("desc", { id: `${svg.id}-description` }, description),
  );
}
