export function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  if (options.html !== undefined) element.innerHTML = options.html;

  Object.entries(options.attributes ?? {}).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== false) {
      element.setAttribute(name, value === true ? "" : String(value));
    }
  });

  Object.entries(options.dataset ?? {}).forEach(([name, value]) => {
    element.dataset[name] = String(value);
  });

  if (options.style) {
    Object.entries(options.style).forEach(([name, value]) =>
      element.style.setProperty(name, value),
    );
  }

  const childList = Array.isArray(options.children)
    ? options.children
    : [options.children];
  const allChildren = [
    ...childList,
    ...(Array.isArray(children) ? children : [children]),
  ];
  allChildren.filter(Boolean).forEach((child) => {
    element.append(
      child instanceof Node ? child : document.createTextNode(String(child)),
    );
  });

  return element;
}

export function clearElement(element) {
  element.replaceChildren();
}

export function setHidden(element, hidden) {
  element.hidden = hidden;
}

export function createTextElement(tagName, className, text) {
  return createElement(tagName, { className, text });
}

export function formatCell(value) {
  if (value === null || value === undefined || value === "") return "";
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toFixed(6)));
}

export function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

export function announceStatus(element, message, kind = "") {
  element.textContent = message;
  element.className = `validation-message${kind ? ` ${kind}` : ""}`;
  element.dataset.kind = kind;
}
