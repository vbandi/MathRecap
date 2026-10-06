import { card, formatNumber, keyIdea, lead, make, PALETTE, slot, svg } from "./kit.js";

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


export function distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
export function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

const signed = (value) => (value < 0 ? `(${formatNumber(value)})` : formatNumber(value));

export function mount(root) {
  const A = { x: -3, y: -1 }, B = { x: 2, y: 3 };

  root.append(lead("Két pont távolságát a rácson is leolvashatod: lépj az A pontból vízszintesen, majd függőlegesen a B pontba. Ez két befogó, a távolság pedig az átfogó — a Pitagorasz-tétellel kiszámolható. A két pont felezőpontja pedig a koordinátáik átlaga."));

  const main = card("Húzd az A és a B pontot");
  const plane = createPlane(main);
  const distanceLine = make("div", "il-formula start");
  const midLine = make("div", "il-formula start");
  main.append(distanceLine, midLine);
  const handleA = plane.addHandle(A, { color: PALETTE.blue, name: "A", onChange: render });
  const handleB = plane.addHandle(B, { color: PALETTE.red, name: "B", onChange: render });
  root.append(main, keyIdea("az A(x₁; y₁) és B(x₂; y₂) pont távolsága √((x₂ − x₁)² + (y₂ − y₁)²), a felezőpontjuk koordinátái pedig ((x₁ + x₂)/2; (y₁ + y₂)/2)."));

  const text = (x, y, content, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: `fill:${color};font-weight:700;font-size:14px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, plane.layer);

  function render() {
    handleA.refresh(); handleB.refresh();
    const dx = Math.abs(B.x - A.x), dy = Math.abs(B.y - A.y), d = distance(A, B), M = midpoint(A, B);
    plane.layer.replaceChildren();
    const corner = { x: B.x, y: A.y }, layer = plane.layer;
    svg("polygon", { points: [A, corner, B].map((p) => `${plane.toX(p.x)},${plane.toY(p.y)}`).join(" "), style: `fill:${PALETTE.amber};fill-opacity:.15;stroke:none` }, layer);
    svg("line", { x1: plane.toX(A.x), y1: plane.toY(A.y), x2: plane.toX(corner.x), y2: plane.toY(corner.y), style: `stroke:${PALETTE.blue};stroke-width:3;stroke-dasharray:6 5` }, layer);
    svg("line", { x1: plane.toX(corner.x), y1: plane.toY(corner.y), x2: plane.toX(B.x), y2: plane.toY(B.y), style: `stroke:${PALETTE.green};stroke-width:3;stroke-dasharray:6 5` }, layer);
    svg("line", { x1: plane.toX(A.x), y1: plane.toY(A.y), x2: plane.toX(B.x), y2: plane.toY(B.y), style: `stroke:${PALETTE.pink};stroke-width:4;stroke-linecap:round` }, layer);
    if (dx) text(plane.toX((A.x + B.x) / 2), plane.toY(A.y) + (B.y >= A.y ? 18 : -9), `Δx = ${formatNumber(dx)}`, PALETTE.blue);
    if (dy) text(plane.toX(B.x) + (B.x >= A.x ? 8 : -8), plane.toY((A.y + B.y) / 2) + 5, `Δy = ${formatNumber(dy)}`, PALETTE.green, B.x >= A.x ? "start" : "end");
    svg("circle", { cx: plane.toX(M.x), cy: plane.toY(M.y), r: 7, style: `fill:${PALETTE.violet};stroke:var(--input);stroke-width:2.5` }, layer);
    text(plane.toX(M.x) + 10, plane.toY(M.y) + 22, "F", PALETTE.violet, "start");

    const sum = dx * dx + dy * dy;
    const rootText = Number.isInteger(d) ? `= ${formatNumber(d)}` : `≈ ${formatNumber(d, 2)}`;
    const row = (label, body, width = 46) => { const line = make("div"); line.append(slot(label, 15, { align: "left" }), slot(body, width, { align: "left" })); return line; };
    distanceLine.replaceChildren(
      row("Δx, Δy", `|${formatNumber(B.x)} − ${signed(A.x)}| = ${formatNumber(dx)},  |${formatNumber(B.y)} − ${signed(A.y)}| = ${formatNumber(dy)}`),
      row("AB távolság", `√(${formatNumber(dx)}² + ${formatNumber(dy)}²) = √${sum} ${rootText}`),
    );
    midLine.replaceChildren(
      row("F felezőpont", `((${formatNumber(A.x)} + ${signed(B.x)}) / 2 ; (${formatNumber(A.y)} + ${signed(B.y)}) / 2)`),
      row("", `= (${formatNumber(M.x)}; ${formatNumber(M.y)})`),
    );
  }

  render();
  return () => {};
}
