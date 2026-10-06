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


function arrow(parent, plane, [x1, y1], [x2, y2], color, width = 3.5, extra = "") {
  const [sx, sy, ex, ey] = [plane.toX(x1), plane.toY(y1), plane.toX(x2), plane.toY(y2)];
  const length = Math.hypot(ex - sx, ey - sy);
  if (length < 1) return;
  const ux = (ex - sx) / length, uy = (ey - sy) / length, head = 13;
  svg("line", { x1: sx, y1: sy, x2: ex - ux * head * 0.6, y2: ey - uy * head * 0.6, style: `stroke:${color};stroke-width:${width};stroke-linecap:round;${extra}` }, parent);
  svg("polygon", { points: `${ex},${ey} ${ex - ux * head + uy * head * 0.45},${ey - uy * head - ux * head * 0.45} ${ex - ux * head - uy * head * 0.45},${ey - uy * head + ux * head * 0.45}`, style: `fill:${color}` }, parent);
}
const pair = (x, y) => `(${formatNumber(x)}; ${formatNumber(y)})`;

export function mount(root) {
  const P = { x: 3, y: 2 }, A = { x: -3, y: -2 }, B = { x: 2, y: 1 };

  root.append(lead("A síkban minden pontot két szám ír le: az első azt mondja meg, hány egységet kell jobbra (vagy balra) lépni az origótól, a második pedig azt, hogy hányat fel (vagy le). A vektor egy nyíl, amelynek iránya és hossza van — és ugyanúgy két számmal adható meg."));

  // --- Position vector ---
  const first = card("Egy pont és az origóból hozzá mutató vektor");
  first.append(make("p", "il-muted", "Húzd a P pontot a rácson!"));
  const plane1 = createPlane(first);
  const line1 = make("div", "il-formula start");
  first.append(line1);
  const handle1 = plane1.addHandle(P, { color: PALETTE.red, name: "P", onChange: render });

  // --- Vector between two points ---
  const second = card("Két pont közötti vektor: AB = B − A");
  second.append(make("p", "il-muted", "Húzd az A és a B pontot! A vektor koordinátái a végpont és a kezdőpont koordinátáinak különbsége."));
  const plane2 = createPlane(second);
  const line2 = make("div", "il-formula start");
  second.append(line2);
  const handleA = plane2.addHandle(A, { color: PALETTE.blue, name: "A", onChange: render });
  const handleB = plane2.addHandle(B, { color: PALETTE.red, name: "B", onChange: render });
  root.append(first, second, keyIdea("a P pont helyvektora az origóból P-be mutató nyíl, koordinátái megegyeznek a P pont koordinátáival. Az AB vektor koordinátáit úgy kapod, hogy a végpont (B) koordinátáiból kivonod a kezdőpont (A) koordinátáit; két vektor akkor egyenlő, ha a koordinátáik egyenlők."));

  const text = (layer, x, y, content, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: `fill:${color};font-weight:700;font-size:14px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, layer);

  function render() {
    handle1.refresh(); handleA.refresh(); handleB.refresh();
    // First plane
    plane1.layer.replaceChildren();
    const l1 = plane1.layer, dash = "stroke-dasharray:6 5";
    svg("line", { x1: plane1.toX(0), y1: plane1.toY(0), x2: plane1.toX(P.x), y2: plane1.toY(0), style: `stroke:${PALETTE.blue};stroke-width:3;${dash}` }, l1);
    svg("line", { x1: plane1.toX(P.x), y1: plane1.toY(0), x2: plane1.toX(P.x), y2: plane1.toY(P.y), style: `stroke:${PALETTE.green};stroke-width:3;${dash}` }, l1);
    arrow(l1, plane1, [0, 0], [P.x, P.y], PALETTE.red);
    if (P.x) text(l1, plane1.toX(P.x / 2), plane1.toY(0) + (P.y >= 0 ? 18 : -10), formatNumber(P.x), PALETTE.blue);
    if (P.y) text(l1, plane1.toX(P.x) + (P.x >= 0 ? 16 : -16), plane1.toY(P.y / 2) + 5, formatNumber(P.y), PALETTE.green);
    line1.replaceChildren(rowEquation("P", pair(P.x, P.y)), rowEquation("OP vektor", pair(P.x, P.y), true));

    // Second plane
    plane2.layer.replaceChildren();
    const l2 = plane2.layer, dx = B.x - A.x, dy = B.y - A.y;
    arrow(l2, plane2, [0, 0], [dx, dy], "var(--dim)", 2.5, "stroke-dasharray:3 5");
    svg("line", { x1: plane2.toX(A.x), y1: plane2.toY(A.y), x2: plane2.toX(B.x), y2: plane2.toY(A.y), style: `stroke:${PALETTE.blue};stroke-width:2.5;${dash}` }, l2);
    svg("line", { x1: plane2.toX(B.x), y1: plane2.toY(A.y), x2: plane2.toX(B.x), y2: plane2.toY(B.y), style: `stroke:${PALETTE.green};stroke-width:2.5;${dash}` }, l2);
    arrow(l2, plane2, [A.x, A.y], [B.x, B.y], PALETTE.pink);
    if (dx) text(l2, plane2.toX((A.x + B.x) / 2), plane2.toY(A.y) + (dy >= 0 ? 18 : -9), formatNumber(dx), PALETTE.blue);
    if (dy) text(l2, plane2.toX(B.x) + (dx >= 0 ? 16 : -16), plane2.toY((A.y + B.y) / 2) + 5, formatNumber(dy), PALETTE.green);
    line2.replaceChildren(
      rowEquation("A", pair(A.x, A.y)), rowEquation("B", pair(B.x, B.y)),
      rowEquation("AB = B − A", `(${formatNumber(B.x)} − ${A.x < 0 ? `(${formatNumber(A.x)})` : formatNumber(A.x)}; ${formatNumber(B.y)} − ${A.y < 0 ? `(${formatNumber(A.y)})` : formatNumber(A.y)})`),
      rowEquation("", pair(dx, dy), true),
    );
  }
  const rowEquation = (left, right, bold = false) => {
    const row = make("div");
    row.append(slot(left, 12, { align: "left" }), slot("=", 2, { align: "left" }), slot(bold ? make("b", "", right) : right, 26, { align: "left" }));
    return row;
  };

  render();
  return () => {};
}
