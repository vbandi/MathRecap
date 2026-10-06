import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -8, xMax: 8, yMin: -8, yMax: 8 };
const TABLE_X = [-10, -1, -0.1, 0, 0.1, 1, 10];

export function mount(root) {
  const scope = createScope();
  const state = { a: 4, exponent: 0.3, side: 1 };

  root.append(lead("Az x ↦ a/x függvény a fordított arányosság: ha x kétszer akkora, az eredmény a felére csökken, mert az x · y szorzat mindig ugyanannyi (a). A grafikonja két külön ágból áll, mert x = 0-nál nem lehet osztani."));

  const main = card("Állítsd be a-t, és mozgasd a pontot");
  const slideA = range({ label: "a", min: -6, max: 6, value: state.a, onInput: (n) => { state.a = n; render(); } });
  const slideX = range({ label: "x", min: -2, max: 1, step: 0.01, value: state.exponent, format: (e) => formatNumber(10 ** e, 2), onInput: (n) => { state.exponent = n; render(); } });
  const branchButtons = [1, -1].map((side) => toggle(side === 1 ? "jobb ág (x > 0)" : "bal ág (x < 0)", side === state.side, () => { state.side = side; render(); }));
  const ruleLine = make("div");
  main.append(controls(slideA.element, slideX.element, ...branchButtons), ruleLine);
  const plot = makePlot(main, { ...VIEW, unitX: 28, label: "Az y = a/x függvény grafikonja: két hiperbolaág" });
  const asymptotes = svg("path", { d: `M ${plot.toX(0)} ${plot.toY(VIEW.yMin)} V ${plot.toY(VIEW.yMax)} M ${plot.toX(VIEW.xMin)} ${plot.toY(0)} H ${plot.toX(VIEW.xMax)}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:8 6` }, plot.layer);
  addText(plot.figure, plot.toX(0.3), plot.toY(VIEW.yMax) + 40, "x = 0 (aszimptota)", `fill:${PALETTE.amber};font-size:12px`);
  addText(plot.figure, plot.toX(VIEW.xMax) - 4, plot.toY(0) + 30, "y = 0 (aszimptota)", `fill:${PALETTE.amber};font-size:12px`, "end");
  const branches = [svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer), svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer)];
  const guide = svg("path", { fill: "none", style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, plot.layer);
  const dot = svg("circle", { r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, plot.layer);
  const message = make("p", "il-message");
  const table = make("table", "il-table");
  main.append(message, table);

  root.append(main, keyIdea("az a/x értéke annál kisebb (nullához közelebbi), minél nagyobb |x|, és minden határon túl nő, ha x közelít 0-hoz. A grafikon soha nem éri el a két tengelyt: ezek az aszimptoták. Ha a > 0, az ágak az I. és III. síknegyedben vannak, ha a < 0, akkor a II. és IV.-ben."));

  function render() {
    const { a, side } = state;
    const x = side * 10 ** state.exponent, y = a / x;
    branchButtons.forEach((button, i) => button.setAttribute("aria-pressed", String([1, -1][i] === side)));
    ruleLine.replaceChildren(equation("y", rich(slot(formatNumber(a), 3), "/x")));
    branches[0].setAttribute("d", curveData(plot, (t) => a / t, 0.005, VIEW.xMax, 700));
    branches[1].setAttribute("d", curveData(plot, (t) => a / t, VIEW.xMin, -0.005, 700));
    dot.setAttribute("cx", plot.toX(x)); dot.setAttribute("cy", plot.toY(y));
    dot.style.opacity = Math.abs(y) <= VIEW.yMax + 0.5 ? 1 : 0;
    guide.setAttribute("d", Math.abs(y) <= VIEW.yMax ? `M ${plot.toX(x)} ${plot.toY(0)} V ${plot.toY(y)} H ${plot.toX(0)}` : "");

    const big = Math.abs(y) > VIEW.yMax;
    message.className = "il-message";
    message.textContent = a === 0
      ? "a = 0 esetén minden x ≠ 0 helyen y = 0, vagyis a grafikon maga a vízszintes tengely (x = 0 nélkül), nem hiperbola."
      : `x = ${formatNumber(x, 2)}, y = ${formatNumber(a)}/${formatNumber(x, 2)} = ${formatNumber(y, 2)}; a szorzat x · y = ${formatNumber(x * y, 2)} = a. ${big ? "Az y értéke kilóg a képből: x közelít 0-hoz, |y| egyre nagyobb. " : Math.abs(x) >= 5 ? "Nagy |x| esetén y már majdnem 0, de sosem pontosan 0. " : ""}`;
    const row = (heading, values) => { const tr = make("tr"); tr.append(make("th", "", heading), ...values.map((value) => make("td", "", value))); return tr; };
    table.replaceChildren(row("x", TABLE_X.map((n) => formatNumber(n))), row("y", TABLE_X.map((n) => (n === 0 ? "—" : formatNumber(a / n, 2)))));
  }

  render();
  return () => scope.clearAll();
}

// ---- local helpers (kept inside the module; shared files are off limits) ----

// Coordinate plot with grid, axes, tick labels and a clipped drawing layer.
function makePlot(parent, { xMin, xMax, yMin, yMax, unitX = 34, unitY = unitX, pad = 24, xStep = 1, yStep = 1, label = "", xName = "x", yName = "y" }) {
  const width = (xMax - xMin) * unitX + 2 * pad, height = (yMax - yMin) * unitY + 2 * pad;
  const toX = (x) => pad + (x - xMin) * unitX, toY = (y) => pad + (yMax - y) * unitY;
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label }, parent);
  const clipId = uniqueId("plot-clip");
  svg("rect", { x: pad, y: pad, width: width - 2 * pad, height: height - 2 * pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  const tickStyle = "font-size:11px;fill:var(--dim)";
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    svg("line", { x1: toX(x), x2: toX(x), y1: pad, y2: height - pad, class: Math.abs(x) < 1e-9 ? "axis" : "grid" }, figure);
    if (Math.abs(x) > 1e-9) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: tickStyle }, figure);
  }
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    svg("line", { x1: pad, x2: width - pad, y1: toY(y), y2: toY(y), class: Math.abs(y) < 1e-9 ? "axis" : "grid" }, figure);
    if (Math.abs(y) > 1e-9) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: tickStyle }, figure);
  }
  svg("text", { x: width - pad - 4, y: toY(0) - 7, "text-anchor": "end", text: xName, style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 8, y: pad + 13, text: yName, style: "font-style:italic" }, figure);
  const layer = svg("g", { "clip-path": `url(#${clipId})` }, figure);
  return { figure, layer, toX, toY, width, height };
}

// Path data of y = fn(x); gaps where fn is not finite or far outside the view.
function curveData(plot, fn, from, to, samples = 240) {
  let d = "", pen = false;
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples, y = fn(x);
    if (!Number.isFinite(y) || Math.abs(y) > 1e4) { pen = false; continue; }
    d += `${pen ? "L" : "M"}${plot.toX(x).toFixed(1)} ${plot.toY(y).toFixed(1)} `;
    pen = true;
  }
  return d;
}

function pathOf(plot, points) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${plot.toX(x).toFixed(1)} ${plot.toY(y).toFixed(1)}`).join(" ");
}

function addText(parent, x, y, text, style = "", anchor = "start") {
  return svg("text", { x, y, "text-anchor": anchor, text, style: `font-weight:700;${style}` }, parent);
}

// Eased 0..1 animation driven by the scope's animation frames.
function tween(scope, ms, onFrame, onDone) {
  let start = null;
  const tick = (time) => {
    start ??= time;
    const t = Math.min(1, (time - start) / ms);
    onFrame(t * t * (3 - 2 * t));
    if (t < 1) scope.frame(tick); else onDone?.();
  };
  scope.frame(tick);
}

// Whole number with thin-space digit groups (works for BigInt too).
function groupDigits(value) {
  const text = (typeof value === "bigint" ? value : Math.round(value)).toString();
  const negative = text.startsWith("-");
  const grouped = (negative ? text.slice(1) : text).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return (negative ? "−" : "") + grouped;
}
