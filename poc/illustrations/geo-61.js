import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

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


const MAX_RADIUS = 5;

// Position of a point relative to a circle: compares (x-u)^2 + (y-v)^2 with r^2.
export function position(circle, point) {
  const left = (point.x - circle.u) ** 2 + (point.y - circle.v) ** 2, right = circle.r ** 2;
  return { left, right, where: left === right ? "on" : left < right ? "inside" : "outside" };
}

const int = (n) => (n < 0 ? `−${-n}` : String(n));
// (x - u)^2 written as x² when u = 0, (x − 2)² or (x + 3)² otherwise.
export function square(variable, shift) { return shift === 0 ? `${variable}²` : `(${variable} ${shift > 0 ? "−" : "+"} ${Math.abs(shift)})²`; }
// Expanded form: x² + y² − 2u·x − 2v·y + (u² + v² − r²) = 0
export function expandedForm({ u, v, r }) {
  const linear = (coefficient, variable) => (coefficient === 0 ? "" : ` ${coefficient < 0 ? "−" : "+"} ${Math.abs(coefficient) === 1 ? "" : Math.abs(coefficient)}${variable}`);
  const constant = u * u + v * v - r * r;
  return `x² + y²${linear(-2 * u, "x")}${linear(-2 * v, "y")}${constant === 0 ? "" : ` ${constant < 0 ? "−" : "+"} ${Math.abs(constant)}`} = 0`;
}

export function mount(root) {
  const circle = { u: 2, v: 1, r: 3 }, centre = { x: 2, y: 1 }, radiusHandle = { x: 5, y: 1 }, test = { x: 3, y: 3 };
  const state = { showSteps: false };

  root.append(lead("A kör azoknak a pontoknak a halmaza, amelyek egy adott ponttól (a középponttól) ugyanolyan messze vannak. A távolságot a Pitagorasz-tétellel számoljuk, és éppen ebből lesz a kör egyenlete. Húzd a középpontot, a sugarat és egy próbapontot!"));

  const main = card("Húzd a középpontot (K), a sugár végét (R) és a T pontot");
  const plane = createPlane(main, { xMin: -8, xMax: 8, yMin: -6, yMax: 6, unit: 34, pad: 22 });
  const equationLines = make("div", "il-formula start");
  const testLine = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(equationLines, testLine, message);
  const handleK = plane.addHandle(centre, { color: PALETTE.blue, name: "K", onChange: () => { circle.u = centre.x; circle.v = centre.y; render(); } });
  const handleR = plane.addHandle(radiusHandle, { color: PALETTE.amber, name: "R", onChange: () => { circle.r = Math.max(1, Math.min(MAX_RADIUS, Math.abs(radiusHandle.x - centre.x))); render(); } });
  const handleT = plane.addHandle(test, { color: PALETTE.red, name: "T", onChange: render });

  const stepsCard = card("Kifejtett alak és teljes négyzetes alak");
  const stepsToggle = toggle("Mutasd a teljes négyzetté alakítást", false, () => { state.showSteps = !state.showSteps; render(); });
  const stepLines = make("div", "il-formula start");
  stepsCard.append(make("p", "", "Ha a kör egyenletét kibontjuk, egy hosszabb egyenletet kapunk. Visszafelé a teljes négyzetté alakítással lehet a kifejtett alakból leolvasni a középpontot és a sugarat."), controls(stepsToggle), stepLines);
  root.append(main, stepsCard, keyIdea("az K(u; v) középpontú, r sugarú kör egyenlete (x − u)² + (y − v)² = r². Egy pont akkor van a körön, ha a koordinátái kielégítik az egyenletet; ha a bal oldal kisebb r²-nél, a pont belül van, ha nagyobb, akkor kívül."));

  const row = (label, body, { width = 50, color } = {}) => { const line = make("div"); const l = slot(label, 10, { align: "left" }); if (color) l.style.color = color; line.append(l, slot(body, width, { align: "left" })); return line; };

  function render() {
    // Keep the radius handle on the circle, to the right of the centre.
    centre.x = Math.min(centre.x, plane.xMax - circle.r);
    circle.u = centre.x; circle.v = centre.y;
    radiusHandle.x = circle.u + circle.r; radiusHandle.y = circle.v;
    handleK.refresh(); handleR.refresh(); handleT.refresh();
    const { u, v, r } = circle, layer = plane.layer, where = position(circle, test);
    layer.replaceChildren();
    svg("circle", { cx: plane.toX(u), cy: plane.toY(v), r: r * plane.unit, style: `fill:${PALETTE.blue};fill-opacity:.12;stroke:${PALETTE.blue};stroke-width:3.5` }, layer);
    svg("line", { x1: plane.toX(u), y1: plane.toY(v), x2: plane.toX(u + r), y2: plane.toY(v), style: `stroke:${PALETTE.amber};stroke-width:2.5;stroke-dasharray:6 4` }, layer);
    svg("line", { x1: plane.toX(u), y1: plane.toY(v), x2: plane.toX(test.x), y2: plane.toY(test.y), style: `stroke:${PALETTE.red};stroke-width:2;stroke-dasharray:3 4` }, layer);
    svg("text", { x: plane.toX(u + r / 2), y: plane.toY(v) - 8, "text-anchor": "middle", text: `r = ${r}`, style: `fill:${PALETTE.amber};font-weight:700;font-size:14px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, layer);

    equationLines.replaceChildren(
      row("általános", "(x − u)² + (y − v)² = r²"),
      row("K, r", `K(${int(u)}; ${int(v)}),  r = ${r}`),
      row("egyenlet", `${square("x", u)} + ${square("y", v)} = ${r * r}`, { color: "var(--accent)" }),
    );
    equationLines.lastChild.lastChild.style.color = "var(--accent)";
    const verdicts = { inside: "belül van a körön (a bal oldal kisebb r²-nél)", on: "rajta van a körön (a bal oldal egyenlő r²-tel)", outside: "kívül van a körön (a bal oldal nagyobb r²-nél)" };
    const symbol = { inside: "<", on: "=", outside: ">" }[where.where];
    testLine.replaceChildren(
      row(`T(${int(test.x)}; ${int(test.y)})`, `(${int(test.x)} − ${u < 0 ? `(${int(u)})` : int(u)})² + (${int(test.y)} − ${v < 0 ? `(${int(v)})` : int(v)})²`),
      row("", `= ${(test.x - u) ** 2} + ${(test.y - v) ** 2} = ${where.left}  ${symbol}  r² = ${where.right}`),
    );
    message.className = `il-message ${where.where === "on" ? "good" : ""}`;
    message.textContent = `A T pont ${verdicts[where.where]}.`;
    testLine.lastChild.lastChild.style.color = where.where === "on" ? PALETTE.amber : where.where === "inside" ? PALETTE.green : PALETTE.red;

    stepsToggle.setAttribute("aria-pressed", String(state.showSteps));
    const F = u * u + v * v - r * r, D = -2 * u, E = -2 * v;
    const signed = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
    const lines = [
      row("kifejtett", expandedForm(circle)),
      row("1. lépés", `(x² ${signed(D)}x) + (y² ${signed(E)}y) = ${int(-F)}`),
      row("2. lépés", `(x² ${signed(D)}x + ${u * u}) + (y² ${signed(E)}y + ${v * v}) = ${int(-F)} + ${u * u} + ${v * v}`),
      row("3. lépés", `${square("x", u)} + ${square("y", v)} = ${r * r}`, { color: "var(--accent)" }),
    ];
    lines.forEach((line, i) => { if (i && !state.showSteps) line.style.opacity = 0.0; });
    stepLines.replaceChildren(...lines);
  }

  render();
  return () => {};
}
