// Shared helpers for skill illustrations. Must not touch the DOM at import time,
// so the registry and modules stay importable from node tests.

const SVG_NS = "http://www.w3.org/2000/svg";
let uniqueCounter = 0;

export const PALETTE = {
  red: "var(--il-red)", blue: "var(--il-blue)", green: "var(--il-green)",
  amber: "var(--il-amber)", violet: "var(--il-violet)", pink: "var(--il-pink)",
};

export function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function svg(tag, attributes = {}, parent) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (name === "text") element.textContent = value;
    else element.setAttribute(name, value);
  }
  parent?.append(element);
  return element;
}

export function uniqueId(prefix) {
  uniqueCounter += 1;
  return `${prefix}-${uniqueCounter}`;
}

// Hungarian number format: decimal comma, no trailing zeros, real minus sign.
export function formatNumber(value, digits = 3) {
  return Number(value.toFixed(digits)).toString().replace(".", ",").replace("-", "−");
}

// Number with the Hungarian instrumental suffix: 2-vel, 3-mal, 4-gyel, 10-zel.
export function withInstrumental(n) {
  const tens = { 10: "zel", 20: "szal", 30: "cal", 40: "nel", 50: "nel", 60: "nal", 70: "nel", 80: "nal", 90: "nel" };
  const ones = { 1: "gyel", 2: "vel", 3: "mal", 4: "gyel", 5: "tel", 6: "tal", 7: "tel", 8: "cal", 9: "cel" };
  const suffix = n % 10 === 0 ? tens[n % 100] ?? "zal" : ones[n % 10];
  return `${n}-${suffix}`;
}

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function fraction(numerator, denominator, { wide = false } = {}) {
  const element = make("span", wide ? "il-frac wide" : "il-frac");
  element.append(make("span", "", String(numerator)), make("span", "", String(denominator)));
  return element;
}

// Builds inline content from strings and nodes, e.g. rich("P = ", fraction(1, 2)).
export function rich(...parts) {
  const element = make("span");
  element.append(...parts.map((part) => (typeof part === "string" || typeof part === "number" ? String(part) : part)));
  return element;
}

// Fixed-width inline box so changing values don't shift the text around them.
export function slot(content, width, { align = "right", dim = false } = {}) {
  const element = make("span", dim ? "il-slot il-dim" : "il-slot");
  element.style.width = `${width}ch`;
  element.style.textAlign = align;
  element.append(content);
  return element;
}

// Equation with the relation sign pinned to the centre: the left side grows leftwards,
// the right side rightwards, so the sign never moves.
export function equation(left, right, relation = "=") {
  const element = make("div", "il-equation");
  const relationElement = make("b", "", relation);
  const leftElement = make("span"), rightElement = make("span");
  leftElement.append(left);
  rightElement.append(right);
  element.append(leftElement, relationElement, rightElement);
  return element;
}

export function lead(text) {
  return make("p", "il-lead", text);
}

export function card(heading) {
  const element = make("div", "il-card");
  if (heading) element.append(make("h3", "", heading));
  return element;
}

export function keyIdea(...parts) {
  const element = make("div", "il-key");
  element.append(make("b", "", "Kulcsgondolat:"), " ", ...parts);
  return element;
}

export function controls(...children) {
  const element = make("div", "il-controls");
  element.append(...children);
  return element;
}

export function button(text, onClick, { ghost = false } = {}) {
  const element = make("button", ghost ? "il-btn ghost" : "il-btn", text);
  element.type = "button";
  element.addEventListener("click", onClick);
  return element;
}

export function toggle(text, pressed, onClick, color) {
  const element = make("button", "il-toggle", text);
  element.type = "button";
  element.setAttribute("aria-pressed", String(pressed));
  if (color) element.style.setProperty("--c", color);
  element.addEventListener("click", onClick);
  return element;
}

export function range({ label, min, max, step = 1, value, format = formatNumber, onInput }) {
  const wrapper = make("label", "il-range");
  const input = make("input");
  Object.assign(input, { type: "range", min, max, step, value });
  const output = make("b", "", format(Number(value)));
  input.addEventListener("input", () => {
    output.textContent = format(Number(input.value));
    onInput(Number(input.value));
  });
  wrapper.append(label, input, output);
  return { element: wrapper, input, set(next) { input.value = next; output.textContent = format(Number(next)); } };
}

export function stepper({ label, min, max, value, onChange }) {
  const wrapper = make("span", "il-stepper");
  const minus = make("button", "", "−");
  const plus = make("button", "", "+");
  const output = make("b", "", formatNumber(value));
  minus.type = plus.type = "button";
  minus.setAttribute("aria-label", `${label} csökkentése`);
  plus.setAttribute("aria-label", `${label} növelése`);
  let current = value;
  const set = (next) => {
    current = Math.min(max, Math.max(min, next));
    output.textContent = formatNumber(current);
  };
  minus.addEventListener("click", () => { set(current - 1); onChange(current); });
  plus.addEventListener("click", () => { set(current + 1); onChange(current); });
  wrapper.append(minus, output, plus);
  const labelled = make("label", "il-stepper-label");
  labelled.append(`${label}: `, wrapper);
  return { element: labelled, set };
}

// Collects timers and animation frames so an illustration can be torn down cleanly.
export function createScope() {
  const timeouts = new Set();
  const intervals = new Set();
  const frames = new Set();
  return {
    timeout(callback, ms) {
      const id = setTimeout(() => { timeouts.delete(id); callback(); }, ms);
      timeouts.add(id);
      return id;
    },
    interval(callback, ms) {
      const id = setInterval(callback, ms);
      intervals.add(id);
      return id;
    },
    clearInterval(id) { clearInterval(id); intervals.delete(id); },
    frame(callback) {
      const id = requestAnimationFrame((time) => { frames.delete(id); callback(time); });
      frames.add(id);
      return id;
    },
    clearAll() {
      timeouts.forEach(clearTimeout); timeouts.clear();
      intervals.forEach(clearInterval); intervals.clear();
      frames.forEach(cancelAnimationFrame); frames.clear();
    },
  };
}
