import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, uniqueId } from "./kit.js";

const PLOT = { xMin: -8, xMax: 8, yMin: -10, yMax: 10, xUnit: 36, yUnit: 18, pad: 22 };
const WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const toX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const toY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const n = (value) => formatNumber(value, 2);
const wrap = (value) => (value < 0 ? `(${n(value)})` : n(value));
const plus = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;
const factor = (root) => (root === 0 ? "x" : `x ${plus(-root)}`);

export function mount(root) {
  const state = { a: 1, x1: -1, x2: 3 };
  const clipId = uniqueId("factored-clip");

  root.append(lead("Ha ismerjük a másodfokú függvény két gyökét, akkor a függvény egyből felírható szorzatként: y = a(x − x₁)(x − x₂). A gyökök az x tengelyen azok a helyek, ahol a parabola átmegy, az a pedig megmondja, mennyire meredek és merre nyílik."));

  const main = card("Húzd a gyököket");
  const sliders = {
    a: range({ label: "a", min: -3, max: 3, step: 0.5, value: state.a, format: n, onInput: (v) => { state.a = v; render(); } }),
    x1: range({ label: "x₁", min: -7, max: 7, step: 0.5, value: state.x1, format: n, onInput: (v) => { state.x1 = v; render(); } }),
    x2: range({ label: "x₂", min: -7, max: 7, step: 0.5, value: state.x2, format: n, onInput: (v) => { state.x2 = v; render(); } }),
  };
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Parabola két húzható gyökkel", style: "touch-action:none" });
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: WIDTH - 2 * PLOT.pad, height: HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.pad, y2: HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, figure);
    if (x && x % 2 === 0) svg("text", { x: toX(x), y: toY(0) + 30, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y++) {
    svg("line", { x1: PLOT.pad, x2: WIDTH - PLOT.pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 2 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const curve = svg("path", { fill: "none", "clip-path": `url(#${clipId})`, style: "stroke:var(--accent);stroke-width:3.5" }, figure);
  const handles = {};
  for (const [key, color] of [["x1", PALETTE.blue], ["x2", PALETTE.amber]]) {
    const group = svg("g", { tabindex: 0, role: "slider", "aria-label": key === "x1" ? "x₁ gyök" : "x₂ gyök", style: "cursor:ew-resize;outline:none" }, figure);
    const ring = svg("circle", { r: 14, style: `fill:${color};fill-opacity:.25` }, group);
    const dot = svg("circle", { r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2` }, group);
    const text = svg("text", { "text-anchor": "middle", style: `fill:${color};font-weight:700` }, group);
    handles[key] = { group, ring, dot, text };
    const move = (value) => { state[key] = Math.max(-7, Math.min(7, Math.round(value * 2) / 2)); sliders[key].set(state[key]); render(); };
    group.addEventListener("pointerdown", (event) => {
      group.setPointerCapture(event.pointerId);
      const drag = (e) => { const box = figure.getBoundingClientRect(); move(PLOT.xMin + (((e.clientX - box.left) / box.width) * WIDTH - PLOT.pad) / PLOT.xUnit); };
      group.addEventListener("pointermove", drag);
      group.addEventListener("pointerup", () => group.removeEventListener("pointermove", drag), { once: true });
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(state[key] - 0.5); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(state[key] + 0.5); }
    });
  }
  const vertex = svg("circle", { r: 5, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, figure);
  const factoredLine = make("div");
  const expandedLine = make("div");
  const bLine = make("p", "il-formula start"), cLine = make("p", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(sliders.a.element, sliders.x1.element, sliders.x2.element), make("p", "il-muted", "A kék és narancs pontot húzhatod az egérrel, vagy nyilakkal mozgathatod."), figure, factoredLine, expandedLine, bLine, cLine, message);
  root.append(main, keyIdea("a gyöktényezős alak y = a(x − x₁)(x − x₂). A zárójelek felbontásából jön a megszokott alak: b = −a(x₁ + x₂) és c = a · x₁ · x₂ — ez a gyökök és együtthatók közötti Viète-összefüggés."));

  function render() {
    const { a, x1, x2 } = state, b = -a * (x1 + x2), c = a * x1 * x2;
    let d = "";
    for (let x = PLOT.xMin; x <= PLOT.xMax + 1e-9; x += 0.1) d += `${d ? "L" : "M"} ${toX(x)} ${toY(a * (x - x1) * (x - x2))} `;
    curve.setAttribute("d", a === 0 ? "" : d);
    for (const [key, x] of [["x1", x1], ["x2", x2]]) {
      const handle = handles[key];
      handle.group.setAttribute("transform", `translate(${toX(x)}, ${toY(0)})`);
      handle.text.setAttribute("y", key === "x1" ? -22 : -36);
      handle.text.textContent = `${key === "x1" ? "x₁" : "x₂"} = ${n(x)}`;
      handle.group.setAttribute("aria-valuenow", x);
    }
    const vx = (x1 + x2) / 2, vy = a * (vx - x1) * (vx - x2);
    vertex.setAttribute("cx", toX(vx)); vertex.setAttribute("cy", toY(vy));
    vertex.style.opacity = a !== 0 && Math.abs(vy) <= PLOT.yMax ? 1 : 0;
    const aText = a === 1 ? "" : a === -1 ? "−" : n(a);
    factoredLine.replaceChildren(equation(slot("y =", 4), slot(a === 0 ? "0" : `${aText}(${factor(x1)})(${factor(x2)})`, 28, { align: "left" })));
    const xSquared = a === 1 ? "x²" : a === -1 ? "−x²" : `${n(a)}x²`;
    expandedLine.replaceChildren(equation(slot("y =", 4), slot(`${xSquared} ${plus(b)}x ${plus(c)}`, 28, { align: "left" })));
    bLine.textContent = `b = −a(x₁ + x₂) = −${wrap(a)}·(${n(x1)} ${plus(x2)}) = ${n(b)}`;
    cLine.textContent = `c = a · x₁ · x₂ = ${wrap(a)}·${wrap(x1)}·${wrap(x2)} = ${n(c)}`;
    message.className = `il-message ${x1 === x2 ? "warn" : ""}`;
    message.textContent = a === 0 ? "Ha a = 0, nem parabola, hanem vízszintes egyenes."
      : x1 === x2 ? "A két gyök egybeesik: a parabola az x tengelyt csak érinti, a csúcsa a gyöknél van."
        : `A parabola ${a > 0 ? "felfelé" : "lefelé"} nyílik, a csúcs az x = ${n(vx)} helyen van — pontosan a két gyök között félúton.`;
  }

  render();
  return () => {};
}
