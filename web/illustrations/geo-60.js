import { button, card, controls, formatNumber, gcd, keyIdea, lead, make, PALETTE, range, slot, svg, uniqueId } from "./kit.js";

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


export function rational(n, d) {
  const g = gcd(n, d) || 1, sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}
const text = ({ n, d }) => (d === 1 ? (n < 0 ? `−${-n}` : String(n)) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`);
const integer = (n) => (n < 0 ? `−${-n}` : String(n));

// Right-hand side of y = mx + b, written the usual way.
export function expression(m, b) {
  const slopeTerm = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "−x" : `${integer(m)}x`;
  if (!slopeTerm) return integer(b);
  return b === 0 ? slopeTerm : `${slopeTerm} ${b < 0 ? "−" : "+"} ${Math.abs(b)}`;
}

// Relation of y = m1 x + b1 and y = m2 x + b2, with the intersection point when there is exactly one.
export function solveSystem(m1, b1, m2, b2) {
  if (m1 === m2) return { kind: b1 === b2 ? "coincident" : "parallel" };
  const x = rational(b2 - b1, m1 - m2);
  return { kind: "intersecting", x, y: rational(m1 * (b2 - b1) + b1 * (m1 - m2), m1 - m2) };
}

export function mount(root) {
  const state = { m1: 1, b1: 1, m2: -1, b2: 3, step: 5 };
  const clipId = uniqueId("system-clip");

  root.append(lead("Két egyenes a síkban háromféleképpen állhat: metszheti egymást egy pontban, lehet párhuzamos (soha nem találkoznak), vagy lehet ugyanaz az egyenes. A metszéspontot az egyenletek közös megoldásaként számoljuk ki — állítsd be a két egyenest, és kövesd végig a számolást!"));

  const main = card("Két egyenes egyenletei");
  const sliders = [
    range({ label: "m₁", min: -3, max: 3, value: state.m1, onInput: (v) => { state.m1 = v; render(); } }),
    range({ label: "b₁", min: -4, max: 4, value: state.b1, onInput: (v) => { state.b1 = v; render(); } }),
    range({ label: "m₂", min: -3, max: 3, value: state.m2, onInput: (v) => { state.m2 = v; render(); } }),
    range({ label: "b₂", min: -4, max: 4, value: state.b2, onInput: (v) => { state.b2 = v; render(); } }),
  ];
  sliders[0].element.style.color = PALETTE.blue; sliders[1].element.style.color = PALETTE.blue;
  sliders[2].element.style.color = PALETTE.red; sliders[3].element.style.color = PALETTE.red;
  const plane = createPlane(main);
  svg("rect", { x: 24, y: 24, width: 480, height: 400 }, svg("clipPath", { id: clipId }, svg("defs", {}, plane.figure)));
  plane.layer.setAttribute("clip-path", `url(#${clipId})`);
  const stepLines = Array.from({ length: 5 }, () => make("div"));
  const steps = make("div", "il-formula start");
  steps.append(...stepLines);
  const message = make("p", "il-message");
  main.append(controls(sliders[0].element, sliders[1].element), controls(sliders[2].element, sliders[3].element), plane.figure,
    controls(button("Lépésenként", () => { state.step = 1; render(); }), button("Következő lépés", () => { state.step = Math.min(5, state.step + 1); render(); }, { ghost: true }), button("Mind", () => { state.step = 5; render(); }, { ghost: true })), steps, message);
  root.append(main, keyIdea("két egyenes metszéspontját az egyenletrendszer megoldása adja: a két y-t egyenlővé téve kapsz egy egyismeretlenes egyenletet. Ha az x együtthatója kiesik, akkor vagy nincs megoldás (párhuzamos egyenesek), vagy végtelen sok van (egybeeső egyenesek)."));

  function render() {
    const { m1, b1, m2, b2, step } = state, result = solveSystem(m1, b1, m2, b2);
    const layer = plane.layer;
    layer.replaceChildren();
    const draw = (m, b, color, dash = "") => svg("line", { x1: plane.toX(-7), y1: plane.toY(-7 * m + b), x2: plane.toX(7), y2: plane.toY(7 * m + b), style: `stroke:${color};stroke-width:3.5;${dash}` }, layer);
    draw(m1, b1, PALETTE.blue);
    draw(m2, b2, PALETTE.red, result.kind === "coincident" ? "stroke-dasharray:10 10" : "");
    if (result.kind === "intersecting") {
      const x = result.x.n / result.x.d, y = result.y.n / result.y.d;
      svg("circle", { cx: plane.toX(x), cy: plane.toY(y), r: 8, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:3` }, layer);
      svg("text", { x: plane.toX(x) + 12, y: plane.toY(y) - 10, text: `M(${text(result.x)}; ${text(result.y)})`, style: `fill:${PALETTE.amber};font-weight:700;font-size:14px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, layer);
    }
    const colored = (content, color) => { const s = slot(content, 52, { align: "left" }); s.style.color = color; return s; };
    const diff = m1 - m2, rhs = b2 - b1;
    const contents = [
      [`y = ${expression(m1, b1)}`, `y = ${expression(m2, b2)}`].map((t, i) => colored(t, i ? PALETTE.red : PALETTE.blue)),
      [slot(`${expression(m1, b1)} = ${expression(m2, b2)}   (a két y egyenlő)`, 52, { align: "left" })],
      [slot(`${diff === 0 ? "0 · x" : `${diff === 1 ? "" : diff === -1 ? "−" : integer(diff)}x`} = ${integer(rhs)}   (x-es tagok balra, számok jobbra)`, 52, { align: "left" })],
      [slot(result.kind === "intersecting" ? `x = ${text(result.x)}` : result.kind === "parallel" ? `0 = ${integer(rhs)} — ez nem igaz, nincs megoldás` : "0 = 0 — ez mindig igaz, bármely x jó", 52, { align: "left" })],
      [slot(result.kind === "intersecting" ? `y = ${expression(m1, b1).replace(/x/, `·(${text(result.x)})`)} = ${text(result.y)}` : "", 52, { align: "left" })],
    ];
    stepLines.forEach((line, i) => {
      line.replaceChildren(...(i === 0 ? [make("div"), make("div")].map((_, k) => { const d = make("div"); d.append(contents[0][k]); return d; }) : contents[i]));
      line.style.opacity = i < step ? 1 : 0;
    });
    message.className = `il-message ${result.kind === "intersecting" ? "good" : "warn"}`;
    message.textContent = result.kind === "intersecting" ? `Egy metszéspont van: M(${text(result.x)}; ${text(result.y)}). Ez az egyetlen pont, amely mindkét egyenesen rajta van.`
      : result.kind === "parallel" ? "A két egyenes párhuzamos (egyenlő a meredekségük, de a tengelymetszetük különbözik), ezért nincs közös pontjuk: az egyenletrendszernek nincs megoldása."
        : "A két egyenes egybeesik, ezért minden pontjuk közös: az egyenletrendszernek végtelen sok megoldása van.";
  }

  render();
  return () => {};
}
