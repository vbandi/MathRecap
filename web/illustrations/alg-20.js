import { button, card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, uniqueId } from "./kit.js";

const X = 110, U = 28, ORIGIN = { x: 50, y: 30 };
const PLOT = { xMin: -7, xMax: 7, yMin: -22, yMax: 14, xUnit: 38, yUnit: 9, pad: 22 };
const PLOT_WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, PLOT_HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const plotX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const plotY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const STAGES = ["x² + bx + c", "A csíkok kettéosztása", "A négyzet kiegészítése", "Kivonjuk, amit hozzátettünk"];
const n = (value) => formatNumber(value);
const signed = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;
const linearTerm = (value) => (value === 1 ? "x" : `${n(value)}x`);

export function mount(root) {
  const state = { b: 6, c: 2, stage: 0 };
  const clipId = uniqueId("vertex-clip");

  root.append(lead("Az x² + 6x kifejezést kirakhatjuk lapokból: egy x oldalú négyzet és 6 darab, x hosszú és 1 széles csík. Ha a csíkokat félig jobbra, félig lefelé tesszük, már majdnem egy nagy négyzetet kapunk — csak a sarok hiányzik."));

  const main = card("Rakd ki, majd egészítsd ki négyzetté");
  const bSlider = range({ label: "b (páros)", min: 0, max: 8, step: 2, value: state.b, format: String, onInput: (v) => { state.b = v; render(false); } });
  const cSlider = range({ label: "c", min: -5, max: 5, value: state.c, format: n, onInput: (v) => { state.c = v; render(false); } });
  const stageName = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Lapokból kirakott négyzetté alakítás" });
  const tiles = svg("g", {}, figure);
  const algebra = make("div");
  const message = make("p", "il-message");
  const previous = button("Vissza", () => { state.stage -= 1; render(true, false); }, { ghost: true });
  const next = button("Következő lépés", () => { state.stage += 1; render(true, false); });
  main.append(controls(bSlider.element, cSlider.element), controls(previous, next), stageName, figure, algebra, message);

  const parabola = card("Mit jelent ez a parabolán?");
  const plot = svg("svg", { class: "il-svg", viewBox: `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`, role: "img", "aria-label": "A parabola és a csúcsa" }, parabola);
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: PLOT_WIDTH - 2 * PLOT.pad, height: PLOT_HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, plot)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: plotX(x), x2: plotX(x), y1: PLOT.pad, y2: PLOT_HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, plot);
    if (x) svg("text", { x: plotX(x), y: plotY(0) + 14, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, plot);
  }
  for (let y = -20; y <= 14; y += 2) {
    svg("line", { x1: PLOT.pad, x2: PLOT_WIDTH - PLOT.pad, y1: plotY(y), y2: plotY(y), class: y ? "grid" : "axis" }, plot);
    if (y && y % 4 === 0) svg("text", { x: plotX(0) - 6, y: plotY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, plot);
  }
  const plotLayer = svg("g", { "clip-path": `url(#${clipId})` }, plot);
  const curve = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plotLayer);
  const vertexLayer = svg("g", {}, plot);
  const vertexLine = make("div");
  parabola.append(make("p", "il-muted", "A két tengelyen a beosztás eltérő, hogy a csúcs mindig látszódjon."), vertexLine);
  root.append(main, parabola, keyIdea("az x² + bx + c kifejezést (x + b/2)² − (b/2)² + c alakra hozhatjuk: a négyzetté kiegészítéshez a csíkok felét kell minden oldalra tenni. Ebből az alakból a parabola csúcsa közvetlenül leolvasható: (−b/2; c − (b/2)²)."));

  const at = (dx, dy, rotation = 0) => `translate(${ORIGIN.x + dx}px, ${ORIGIN.y + dy}px) rotate(${rotation}deg)`;
  let movers = [];

  // A tile is a group whose position (and, for corner tiles, look) depends on the stage.
  function tile(w, h, color, label, { dashed = false, where, hole = false } = {}) {
    const group = svg("g", { class: "il-move" }, tiles);
    const solid = svg("rect", { x: 0, y: 0, width: w, height: h, class: "il-fade", style: dashed ? `fill:none;stroke:${color};stroke-width:2;stroke-dasharray:4 3` : `fill:${color};fill-opacity:.85;stroke:var(--input);stroke-width:2` }, group);
    const text = label ? svg("text", { x: w / 2, y: h / 2 + 5, "text-anchor": "middle", text: label, style: `font-weight:700;font-size:${w > 60 ? 20 : 12}px;fill:${dashed ? color : "#fff"}` }, group) : null;
    const hint = hole ? svg("rect", { x: 0, y: 0, width: w, height: h, class: "il-fade", style: `fill:none;stroke:${color};stroke-width:2;stroke-dasharray:4 3` }, group) : null;
    movers.push({ group, where, solid, text, hint });
  }

  function build() {
    const { b, c } = state, half = b / 2;
    tiles.replaceChildren();
    movers = [];
    tile(X, X, PALETTE.blue, "x²", { where: () => at(0, 0) });
    for (let i = 0; i < b; i++) {
      tile(U, X, PALETTE.green, "x", {
        where: (stage) => (stage === 0 ? at(X + 16 + i * (U + 3), 0) : i < half ? at(X + i * U, 0) : at(X, X + (i - half) * U, 90)),
      });
    }
    for (let row = 0; row < half; row++) for (let col = 0; col < half; col++) tile(U, U, PALETTE.pink, "1", { where: () => at(X + col * U, X + row * U), hole: true });
    for (let i = 0; i < Math.abs(c); i++) tile(U, U, PALETTE.amber, c > 0 ? "1" : "−1", { dashed: c < 0, where: () => `translate(${370 + (i % 5) * (U + 4)}px, ${ORIGIN.y}px) rotate(0deg)` });
    svg("text", { x: 370, y: ORIGIN.y - 8, text: c === 0 ? "c = 0: nincs egységlap" : c > 0 ? `c = ${n(c)} egységlap` : `c = ${n(c)}: ennyi hiányzik`, style: "font-size:13px" }, tiles);
  }

  function place(animate) {
    const { stage } = state;
    for (const { group, where, solid, text, hint } of movers) {
      if (!animate) group.style.transition = "none";
      group.style.transform = where(stage);
      if (!hint) { if (!animate) { group.getBoundingClientRect(); group.style.transition = ""; } continue; }
      // Corner tile: invisible, then a dashed hole, then filled, then faded again.
      solid.style.opacity = stage >= 2 ? (stage === 3 ? 0.3 : 1) : 0;
      if (text) text.style.opacity = stage >= 2 ? 1 : 0;
      hint.style.opacity = stage === 1 ? 1 : 0;
      if (!animate) { group.getBoundingClientRect(); group.style.transition = ""; }
    }
  }

  function render(animate, rebuild = true) {
    const { b, c, stage } = state, half = b / 2, h = half, k = c - h * h;
    if (rebuild) build();
    place(animate);
    tiles.querySelectorAll(".x-label").forEach((node) => node.remove());
    if (stage >= 2 && half > 0) {
      svg("text", { x: ORIGIN.x + X + half * U + 10, y: ORIGIN.y + X / 2, class: "x-label", text: "x + " + n(half), style: "font-weight:700;font-size:13px" }, tiles);
    }

    stageName.replaceChildren(make("b", "", `${stage + 1}/4  ${STAGES[stage]}`));
    previous.disabled = stage === 0; next.disabled = stage === 3;
    const xTerm = half === 0 ? "x" : `(x + ${n(half)})`;
    const left = `x² + ${linearTerm(b)} ${signed(c)}`;
    const rightByStage = [
      "…",
      `x² + ${linearTerm(half)} + ${linearTerm(half)} ${signed(c)}`,
      `(x + ${n(half)})² ${signed(-h * h)} ${signed(c)}`,
      `(x + ${n(half)})² ${signed(k)}`,
    ];
    const finalRight = half === 0 ? `x² ${signed(c)}` : rightByStage[stage];
    algebra.replaceChildren(equation(slot(left, 18), slot(stage === 0 ? "?" : finalRight, 24, { align: "left" })));
    message.className = "il-message";
    message.textContent = [
      `Egy x² négyzet, ${n(b)} csík (mindegyik x hosszú, 1 széles) és c egységlap.`,
      half === 0 ? "b = 0: nincs csík, az x² már négyzet." : `A ${n(b)} csíkból ${n(half)} kerül a négyzet jobb, ${n(half)} az alsó oldalára. Így egy (x + ${n(half)}) oldalú négyzet sarka hiányzik.`,
      half === 0 ? "Nincs mit kiegészíteni." : `A hiányzó sarok ${n(half)} × ${n(half)} = ${n(half * half)} egységlap. Ha ezt hozzátesszük, teljes négyzetet kapunk: ${xTerm}².`,
      `A ${n(h * h)} egységlapot mi tettük hozzá, ezért ugyanannyit le kell vonni. Eredmény: (x + ${n(half)})² ${signed(k)}, ahol ${n(k)} = ${n(c)} − ${n(h * h)}.`,
    ][stage];

    // Parabola
    let d = "";
    for (let px = PLOT.xMin; px <= PLOT.xMax + 1e-9; px += 0.1) d += `${d ? "L" : "M"} ${plotX(px)} ${plotY(px * px + b * px + c)} `;
    curve.setAttribute("d", d);
    vertexLayer.replaceChildren();
    const vx = -h, vy = k;
    svg("line", { x1: plotX(vx), x2: plotX(vx), y1: plotY(vy), y2: plotY(0), style: "stroke:var(--fg);stroke-width:1.5;stroke-dasharray:5 4" }, vertexLayer);
    svg("circle", { cx: plotX(vx), cy: plotY(vy), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, vertexLayer);
    svg("text", { x: plotX(vx) + 12, y: plotY(vy) + (vy < 0 ? 18 : -10), text: `(${n(vx)}; ${n(vy)})`, style: "fill:var(--fg);font-weight:700" }, vertexLayer);
    vertexLine.replaceChildren(equation(slot(`y = x² + ${linearTerm(b)} ${signed(c)}`, 20), slot(`y = (x + ${n(half)})² ${signed(k)}`, 22, { align: "left" })));
    void animate;
  }

  render(false);
  return () => {};
}
