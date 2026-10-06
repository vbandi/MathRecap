import { button, card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, stepper, svg, toggle, uniqueId } from "./kit.js";

const PUZZLES = [
  { strips: 5, units: 6, p: 2, q: 3 },
  { strips: 7, units: 12, p: 3, q: 4 },
  { strips: 6, units: 8, p: 2, q: 4 },
  { strips: 4, units: 4, p: 2, q: 2 },
  { strips: 6, units: 5, p: 1, q: 5 },
];
const X = 100, U = 24, ORIGIN = { x: 50, y: 34 };
const PLOT = { xMin: -7, xMax: 7, yMin: -10, yMax: 16, xUnit: 36, yUnit: 12, pad: 22 };
const PLOT_WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, PLOT_HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const plotX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const plotY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const n = (value) => formatNumber(value);
const plus = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;
const xTerm = (s) => (Math.abs(s) === 1 ? `${s < 0 ? "−" : "+"} x` : `${plus(s)}x`);
const factor = (shift) => (shift === 0 ? "x" : `x ${plus(shift)}`);

export function mount(root) {
  const state = { puzzle: 0, p: 1, q: 1, a: 2, b: -3, x: 0 };
  const clipId = uniqueId("product-clip");

  root.append(lead("Szorzattá alakítani annyi, mint az összeget téglalappá rendezni: a téglalap két oldalának hossza a két tényező. Ha egy szorzat értéke 0, akkor valamelyik tényezője 0 — ebből lesz az egyenlet megoldása."));

  // --- Tiles ---
  const tiles = card("Rakd téglalappá a lapokat");
  const picker = make("div", "il-controls");
  const tray = make("p", "il-formula start");
  const pStepper = stepper({ label: "az egyik oldal: x +", min: 0, max: 7, value: state.p, onChange: (v) => { state.p = v; renderTiles(); } });
  const qStepper = stepper({ label: "a másik oldal: x +", min: 0, max: 7, value: state.q, onChange: (v) => { state.q = v; renderTiles(); } });
  const solveButton = button("Mutasd a megoldást", () => { const { p, q } = PUZZLES[state.puzzle]; state.p = p; state.q = q; pStepper.set(p); qStepper.set(q); renderTiles(); }, { ghost: true });
  const rectangle = svg("svg", { class: "il-svg", viewBox: "0 0 600 330", role: "img", "aria-label": "Téglalap lapokból" });
  const tileMessage = make("p", "il-message");
  const productLine = make("div");
  tiles.append(picker, tray, controls(pStepper.element, qStepper.element, solveButton), rectangle, tileMessage, productLine);

  // --- Zero-product ---
  const zero = card("Mikor nulla a szorzat?");
  const aSlider = range({ label: "a", min: -5, max: 5, value: state.a, format: n, onInput: (v) => { state.a = v; renderPlot(); } });
  const bSlider = range({ label: "b", min: -5, max: 5, value: state.b, format: n, onInput: (v) => { state.b = v; renderPlot(); } });
  const xSlider = range({ label: "x", min: -6, max: 6, step: 0.5, value: state.x, format: n, onInput: (v) => { state.x = v; renderPlot(); } });
  const plot = svg("svg", { class: "il-svg", viewBox: `0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`, role: "img", "aria-label": "Az y = (x − a)(x − b) parabola" });
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: PLOT_WIDTH - 2 * PLOT.pad, height: PLOT_HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, plot)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: plotX(x), x2: plotX(x), y1: PLOT.pad, y2: PLOT_HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, plot);
    if (x) svg("text", { x: plotX(x), y: plotY(0) + 14, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, plot);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y += 2) {
    svg("line", { x1: PLOT.pad, x2: PLOT_WIDTH - PLOT.pad, y1: plotY(y), y2: plotY(y), class: y ? "grid" : "axis" }, plot);
    if (y && y % 4 === 0) svg("text", { x: plotX(0) - 6, y: plotY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, plot);
  }
  const curve = svg("path", { fill: "none", "clip-path": `url(#${clipId})`, style: "stroke:var(--accent);stroke-width:3.5" }, plot);
  const marks = svg("g", {}, plot);
  const factorLine = make("div");
  const productValue = make("div");
  const zeroMessage = make("p", "il-message");
  zero.append(controls(aSlider.element, bSlider.element, xSlider.element), plot, factorLine, productValue, zeroMessage);
  root.append(tiles, zero, keyIdea("ha egy összeget szorzattá tudsz alakítani, a tényezők nullahelyei adják az egyenlet megoldásait: (x − a)(x − b) = 0 pontosan akkor, ha x = a vagy x = b. A parabola a két gyöknél metszi az x tengelyt."));

  function renderTiles() {
    const puzzle = PUZZLES[state.puzzle], { p, q } = state;
    const label = (s) => `x² + ${s.strips}x + ${s.units}`;
    picker.replaceChildren(make("span", "il-muted", "Lapok:"), ...PUZZLES.map((s, i) => toggle(label(s), i === state.puzzle, () => { state.puzzle = i; state.p = state.q = 1; pStepper.set(1); qStepper.set(1); renderTiles(); })));
    tray.textContent = `Van: 1 db x² lap, ${puzzle.strips} db x csík, ${puzzle.units} db egységlap.`;
    const needStrips = p + q, needUnits = p * q;
    const fits = needStrips === puzzle.strips && needUnits === puzzle.units;
    rectangle.replaceChildren();
    const g = svg("g", {}, rectangle);
    const rect = (x, y, w, h, color, text, fontSize = 13) => {
      svg("rect", { x: ORIGIN.x + x, y: ORIGIN.y + y, width: w, height: h, style: `fill:${color};fill-opacity:.85;stroke:var(--input);stroke-width:2` }, g);
      if (text) svg("text", { x: ORIGIN.x + x + w / 2, y: ORIGIN.y + y + h / 2 + 5, "text-anchor": "middle", text, style: `fill:#fff;font-weight:700;font-size:${fontSize}px` }, g);
    };
    rect(0, 0, X, X, PALETTE.blue, "x²", 22);
    for (let i = 0; i < p; i++) rect(X + i * U, 0, U, X, PALETTE.green, "x");
    for (let j = 0; j < q; j++) rect(0, X + j * U, X, U, PALETTE.green, "x");
    for (let i = 0; i < p; i++) for (let j = 0; j < q; j++) rect(X + i * U, X + j * U, U, U, PALETTE.amber, "1", 11);
    const width = X + p * U, height = X + q * U;
    svg("line", { x1: ORIGIN.x, x2: ORIGIN.x + width, y1: ORIGIN.y - 12, y2: ORIGIN.y - 12, style: "stroke:var(--fg-soft);stroke-width:2" }, g);
    svg("text", { x: ORIGIN.x + width / 2, y: ORIGIN.y - 18, "text-anchor": "middle", text: factor(p), style: "font-weight:700" }, g);
    svg("line", { x1: ORIGIN.x - 12, x2: ORIGIN.x - 12, y1: ORIGIN.y, y2: ORIGIN.y + height, style: "stroke:var(--fg-soft);stroke-width:2" }, g);
    svg("text", { x: ORIGIN.x - 20, y: ORIGIN.y + height / 2 + 5, "text-anchor": "end", text: factor(q), style: "font-weight:700" }, g);
    const info = svg("g", {}, rectangle);
    svg("text", { x: 330, y: 70, text: `Kell: 1 x², ${needStrips} x csík, ${needUnits} egységlap`, style: "font-size:14px" }, info);
    svg("text", { x: 330, y: 96, text: `Van: 1 x², ${puzzle.strips} x csík, ${puzzle.units} egységlap`, style: "font-size:14px" }, info);
    svg("text", { x: 330, y: 130, text: fits ? "Pontosan kijön. ✓" : "Nem egyezik.", style: `font-size:16px;font-weight:700;fill:${fits ? PALETTE.green : PALETTE.red}` }, info);
    tileMessage.className = `il-message ${fits ? "good" : "warn"}`;
    tileMessage.textContent = fits
      ? `A téglalap oldalai x + ${p} és x + ${q}, a területe pedig pontosan ezeknek a lapoknak az összege.`
      : needStrips !== puzzle.strips
        ? `${needStrips < puzzle.strips ? "Felesleges x csík marad" : "Kevés az x csík"}: a két oldal kiegészítő számának összege ${puzzle.strips} kell legyen.`
        : `A csíkok száma stimmel, de ${needUnits < puzzle.units ? "felesleges egységlap marad" : "kevés az egységlap"}: a két kiegészítő szám szorzata ${puzzle.units} kell legyen.`;
    productLine.replaceChildren(equation(slot(`x² + ${puzzle.strips}x + ${puzzle.units}`, 16), slot(fits ? `(${factor(p)})(${factor(q)})` : "?", 16, { align: "left" })));
  }

  function renderPlot() {
    const { a, b, x } = state;
    let d = "";
    for (let px = PLOT.xMin; px <= PLOT.xMax + 1e-9; px += 0.1) d += `${d ? "L" : "M"} ${plotX(px)} ${plotY((px - a) * (px - b))} `;
    curve.setAttribute("d", d);
    marks.replaceChildren();
    const dashed = "stroke:var(--fg);stroke-width:1.5;stroke-dasharray:5 4";
    for (const [root, color] of [[a, PALETTE.blue], [b, PALETTE.amber]]) {
      svg("circle", { cx: plotX(root), cy: plotY(0), r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2` }, marks);
      svg("text", { x: plotX(root), y: plotY(0) + 30, "text-anchor": "middle", text: n(root), style: `fill:${color};font-weight:700` }, marks);
    }
    const value = (x - a) * (x - b), inside = value <= PLOT.yMax && value >= PLOT.yMin;
    if (inside) {
      svg("line", { x1: plotX(x), x2: plotX(x), y1: plotY(0), y2: plotY(value), style: dashed }, marks);
      svg("circle", { cx: plotX(x), cy: plotY(value), r: 6, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, marks);
    }
    const first = x - a, second = x - b;
    factorLine.replaceChildren(equation(slot(`y = (${factor(-a)})(${factor(-b)})`, 20), slot(`x² ${xTerm(-(a + b))} ${plus(a * b)}`, 18, { align: "left" })));
    productValue.replaceChildren(make("p", "il-formula start", `x = ${n(x)}:  (${n(first)}) · (${n(second)}) = ${n(value)}`));
    const zeroFactor = first === 0 || second === 0;
    zeroMessage.className = `il-message ${zeroFactor ? "good" : ""}`;
    zeroMessage.textContent = zeroFactor
      ? `Az egyik tényező 0, ezért a szorzat is 0: a grafikon az x tengelyen van. Ez a megoldás: x = ${n(x)}.`
      : "Nincs nulla tényező, ezért a szorzat sem nulla. Húzd az x csúszkát valamelyik gyökre!";
  }

  renderTiles();
  renderPlot();
  return () => {};
}
