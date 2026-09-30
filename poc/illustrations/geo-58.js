import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

// ---- Coordinate plane helper: grid, dynamic layer, draggable handles (snap to grid). ----
function createPlane(parent, { xMin = -6, xMax = 6, yMin = -5, yMax = 5, unit = 40, pad = 24 } = {}) {
  const width = (xMax - xMin) * unit + 2 * pad, height = (yMax - yMin) * unit + 2 * pad;
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${width} ${height}`, role: "img" }, parent);
  const toX = (x) => pad + (x - xMin) * unit, toY = (y) => pad + (yMax - y) * unit;
  for (let x = xMin; x <= xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: pad, y2: height - pad, class: x ? "grid" : "axis" }, figure);
    if (x && (x % 2 === 0 || xMax - xMin <= 12)) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  for (let y = yMin; y <= yMax; y++) {
    svg("line", { x1: pad, x2: width - pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: width - pad - 4, y: toY(0) - 7, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 8, y: pad + 12, text: "y", style: "font-style:italic" }, figure);
  const layer = svg("g", {}, figure);
  const handleLayer = svg("g", {}, figure);
  const toMath = (event) => {
    const p = figure.createSVGPoint();
    p.x = event.clientX; p.y = event.clientY;
    const q = p.matrixTransform(figure.getScreenCTM().inverse());
    return [(q.x - pad) / unit + xMin, yMax - (q.y - pad) / unit];
  };
  // point is {x, y}; it is mutated while dragging. name is drawn next to the handle.
  function addHandle(point, { color, name, step = 1, onChange }) {
    const group = svg("g", { style: "cursor:grab;touch-action:none" }, handleLayer);
    svg("circle", { r: 18, style: "fill:transparent" }, group);
    const dot = svg("circle", { r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
    const label = svg("text", { style: `fill:${color};font-weight:700;font-size:15px` }, group);
    const refresh = () => {
      const cx = toX(point.x), cy = toY(point.y);
      group.firstChild.setAttribute("cx", cx); group.firstChild.setAttribute("cy", cy);
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      label.setAttribute("x", cx + 12); label.setAttribute("y", cy - 11); label.textContent = name;
    };
    let dragging = false;
    group.addEventListener("pointerdown", (event) => { dragging = true; group.setPointerCapture(event.pointerId); event.preventDefault(); });
    group.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const [mx, my] = toMath(event);
      point.x = Math.min(xMax, Math.max(xMin, Math.round(mx / step) * step));
      point.y = Math.min(yMax, Math.max(yMin, Math.round(my / step) * step));
      onChange();
    });
    const end = () => { dragging = false; };
    group.addEventListener("pointerup", end);
    group.addEventListener("pointercancel", end);
    refresh();
    return { refresh, group };
  }
  return { figure, layer, toX, toY, unit, addHandle, xMin, xMax, yMin, yMax };
}


const MODES = [["sum", "a + b"], ["difference", "a − b"], ["scalar", "λ · a"]];

export function combine(mode, a, b, lambda) {
  if (mode === "sum") return { x: a.x + b.x, y: a.y + b.y };
  if (mode === "difference") return { x: a.x - b.x, y: a.y - b.y };
  return { x: lambda * a.x, y: lambda * a.y };
}
const length = (v) => Math.hypot(v.x, v.y);
const pair = (v) => `(${formatNumber(v.x)}; ${formatNumber(v.y)})`;
const part = (value) => (value < 0 ? `(${formatNumber(value)})` : formatNumber(value));

function arrow(parent, plane, [x1, y1], [x2, y2], color, width = 3.5, extra = "") {
  const [sx, sy, ex, ey] = [plane.toX(x1), plane.toY(y1), plane.toX(x2), plane.toY(y2)];
  const len = Math.hypot(ex - sx, ey - sy);
  if (len < 1) return;
  const ux = (ex - sx) / len, uy = (ey - sy) / len, head = 12;
  svg("line", { x1: sx, y1: sy, x2: ex - ux * head * 0.6, y2: ey - uy * head * 0.6, style: `stroke:${color};stroke-width:${width};stroke-linecap:round;${extra}` }, parent);
  svg("polygon", { points: `${ex},${ey} ${ex - ux * head + uy * head * 0.45},${ey - uy * head - ux * head * 0.45} ${ex - ux * head - uy * head * 0.45},${ey - uy * head + ux * head * 0.45}`, style: `fill:${color}` }, parent);
}

export function mount(root) {
  const a = { x: 3, y: 1 }, b = { x: 1, y: 2 }, state = { mode: "sum", lambda: 2 };

  root.append(lead("A vektorokat koordinátáikkal adjuk meg, és a műveleteket koordinátánként végezhetjük el. Két vektort úgy adunk össze, hogy a másodikat az első végéhez toljuk; egy számmal úgy szorzunk, hogy mindkét koordinátát megszorozzuk vele."));

  const main = card("Húzd a vektorok végpontját");
  const modeButtons = MODES.map(([mode, text]) => toggle(text, mode === state.mode, () => { state.mode = mode; render(); }));
  const lambdaSlider = range({ label: "λ", min: -2, max: 3, step: 0.5, value: state.lambda, onInput: (value) => { state.lambda = value; render(); } });
  const plane = createPlane(main, { xMin: -8, xMax: 8, yMin: -6, yMax: 6, unit: 30, pad: 20 });
  const table = make("div", "il-formula start");
  main.append(controls(...modeButtons, lambdaSlider.element), table);
  const clamp = (point) => { point.x = Math.max(-4, Math.min(4, point.x)); point.y = Math.max(-3, Math.min(3, point.y)); render(); };
  const handleA = plane.addHandle(a, { color: PALETTE.blue, name: "a", onChange: () => clamp(a) });
  const handleB = plane.addHandle(b, { color: PALETTE.red, name: "b", onChange: () => clamp(b) });
  root.append(main, keyIdea("vektorokat koordinátánként adunk össze és vonunk ki: (a₁; a₂) + (b₁; b₂) = (a₁ + b₁; a₂ + b₂). Számmal úgy szorzunk, hogy mindkét koordinátát megszorozzuk, a hosszt pedig a Pitagorasz-tétellel kapjuk: |v| = √(v₁² + v₂²)."));

  function render() {
    handleA.refresh(); handleB.refresh();
    modeButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(MODES[i][0] === state.mode)));
    const scalar = state.mode === "scalar";
    lambdaSlider.input.disabled = !scalar; lambdaSlider.element.style.opacity = scalar ? 1 : 0.35;
    const layer = plane.layer, dash = "stroke-dasharray:6 5";
    layer.replaceChildren();
    const result = combine(state.mode, a, b, state.lambda), label = state.mode === "sum" ? "a + b" : state.mode === "difference" ? "a − b" : "λ · a";
    const dashed = (from, to) => svg("line", { x1: plane.toX(from.x), y1: plane.toY(from.y), x2: plane.toX(to.x), y2: plane.toY(to.y), style: `stroke:var(--fg-soft);stroke-width:2;${dash}` }, layer);
    if (state.mode === "sum") {
      dashed(a, result); dashed(b, result);
      arrow(layer, plane, [a.x, a.y], [result.x, result.y], PALETTE.red, 2.5, "opacity:.5");
    } else if (state.mode === "difference") {
      arrow(layer, plane, [b.x, b.y], [a.x, a.y], PALETTE.green, 3.5);
      arrow(layer, plane, [0, 0], [result.x, result.y], PALETTE.green, 2.5, "opacity:.5");
    }
    arrow(layer, plane, [0, 0], [a.x, a.y], PALETTE.blue);
    if (state.mode !== "scalar") arrow(layer, plane, [0, 0], [b.x, b.y], PALETTE.red);
    if (state.mode !== "difference") arrow(layer, plane, [0, 0], [result.x, result.y], state.mode === "sum" ? PALETTE.green : PALETTE.pink, state.mode === "sum" ? 4 : 3, state.mode === "scalar" ? "opacity:.9" : "");
    if (Math.abs(result.x) <= 8 && Math.abs(result.y) <= 6) {
      svg("text", { x: plane.toX(result.x) + 10, y: plane.toY(result.y) + (state.mode === "difference" ? 20 : -8), text: label, style: `fill:${state.mode === "scalar" ? PALETTE.pink : PALETTE.green};font-weight:700;font-size:15px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, layer);
    }

    const row = (left, right, width = 44) => { const line = make("div"); line.append(slot(left, 12, { align: "left" }), slot(right, width, { align: "left" })); return line; };
    const l = state.lambda, len = length(result), sum = result.x ** 2 + result.y ** 2;
    const calc = state.mode === "sum" ? `(${part(a.x)} + ${part(b.x)}; ${part(a.y)} + ${part(b.y)})`
      : state.mode === "difference" ? `(${part(a.x)} − ${part(b.x)}; ${part(a.y)} − ${part(b.y)})`
        : `(${part(l)} · ${part(a.x)}; ${part(l)} · ${part(a.y)})`;
    table.replaceChildren(
      row("a", `= ${pair(a)}`), row("b", `= ${pair(b)}`),
      row(state.mode === "scalar" ? `λ = ${formatNumber(l)}` : label, `= ${calc}`),
      row("", `= ${pair(result)}`),
      row(`|${label}|`, `= √(${part(result.x)}² + ${part(result.y)}²) = √${formatNumber(sum)} ${Number.isInteger(len) ? "= " : "≈ "}${formatNumber(len, 2)}`),
    );
  }

  render();
  return () => {};
}
