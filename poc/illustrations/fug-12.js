import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -7, xMax: 7, yMin: -6, yMax: 10 };
const sign = (n, negative = "−", positive = "+") => (n < 0 ? negative : positive);

export function mount(root) {
  const scope = createScope();
  const state = { a: 1, u: 2, v: -1 };

  root.append(lead("A másodfokú függvény grafikonja parabola: egy ívelt, tengelyesen szimmetrikus görbe. Az x² alapparabolát három számmal lehet mozgatni: az a nyújtja (vagy fejjel lefelé fordítja), az u jobbra-balra, a v fel-le tolja."));

  const main = card("Mozgasd az alapparabolát");
  const slideA = range({ label: "a", min: -3, max: 3, step: 0.5, value: state.a, onInput: (n) => { scope.clearAll(); state.a = n; render(); } });
  const slideU = range({ label: "u", min: -4, max: 4, value: state.u, onInput: (n) => { scope.clearAll(); state.u = n; render(); } });
  const slideV = range({ label: "v", min: -4, max: 4, value: state.v, onInput: (n) => { scope.clearAll(); state.v = n; render(); } });
  const morph = button("Alakítsd át az x²-ből", () => {
    scope.clearAll();
    const target = { ...state };
    tween(scope, 1800, (e) => render({ a: 1 + (target.a - 1) * e, u: target.u * e, v: target.v * e }), () => render());
  }, { ghost: true });
  const vertexForm = make("div"), expandedForm = make("div");
  main.append(controls(slideA.element, slideU.element, slideV.element, morph), vertexForm, expandedForm);
  const plot = makePlot(main, { ...VIEW, unitX: 30, unitY: 30, yStep: 2, label: "Az a(x − u)² + v függvény parabolája" });
  const ghost = svg("path", { fill: "none", style: "stroke:var(--dim);stroke-width:2.5;stroke-dasharray:7 6" }, plot.layer);
  const axisLine = svg("line", { style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 5" }, plot.layer);
  const curve = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer);
  const vertexDot = svg("circle", { r: 7, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, plot.layer);
  const vertexLabel = addText(plot.figure, 0, 0, "", `fill:${PALETTE.blue}`);
  const axisLabel = addText(plot.figure, 0, plot.toY(VIEW.yMax) + 16, "", "fill:var(--fg-soft);font-size:12px");
  const facts = make("p", "il-message");
  main.append(make("p", "il-muted", "Szürke szaggatott: az alap x² parabola. Zöld: az általad beállított görbe."));
  const steps = make("div", "il-formula start");
  main.append(facts);

  const complete = card("Fordítva: ha csak az ax² + bx + c alakot ismered");
  complete.append(make("p", "", "A teljes négyzetté alakítás megmutatja a csúcspontot. Ha f(x) = ax² + bx + c, akkor a(x − u)² + v alakban u = −b/(2a) és v = c − b²/(4a)."), steps);
  root.append(main, complete, keyIdea("a(x − u)² + v alakból azonnal leolvasható a csúcs (u; v), a szimmetriatengely (x = u) és a nyílásirány (a > 0: felfelé, a < 0: lefelé). Az ax² + bx + c alakot teljes négyzetté alakítással hozod erre az alakra."));

  function render(shown = state) {
    const { a, u, v } = shown;
    const b = -2 * a * u, c = a * u * u + v;
    ghost.setAttribute("d", curveData(plot, (x) => x * x, VIEW.xMin, VIEW.xMax));
    curve.setAttribute("d", curveData(plot, (x) => a * (x - u) ** 2 + v, VIEW.xMin, VIEW.xMax));
    axisLine.setAttribute("x1", plot.toX(u)); axisLine.setAttribute("x2", plot.toX(u));
    axisLine.setAttribute("y1", plot.toY(VIEW.yMin)); axisLine.setAttribute("y2", plot.toY(VIEW.yMax));
    vertexDot.setAttribute("cx", plot.toX(u)); vertexDot.setAttribute("cy", plot.toY(v));
    vertexLabel.textContent = `csúcs (${formatNumber(u, 2)}; ${formatNumber(v, 2)})`;
    vertexLabel.setAttribute("x", Math.min(plot.toX(u) + 12, plot.width - 140));
    vertexLabel.setAttribute("y", Math.max(40, Math.min(plot.toY(v) + (a > 0 ? 22 : -14), plot.height - 30)));
    axisLabel.textContent = `x = ${formatNumber(u, 2)}`;
    axisLabel.setAttribute("x", plot.toX(u) + 6);

    vertexForm.replaceChildren(equation("f(x)", rich(
      slot(formatNumber(a, 2), 5), "(x", slot(` ${sign(u, "+", "−")} `, 3, { dim: u === 0 }), slot(formatNumber(Math.abs(u), 2), 4, { align: "left", dim: u === 0 }), ")²",
      slot(` ${sign(v)} `, 3, { dim: v === 0 }), slot(formatNumber(Math.abs(v), 2), 4, { align: "left", dim: v === 0 }))));
    expandedForm.replaceChildren(equation("f(x)", rich(
      slot(formatNumber(a, 2), 5), "x²", slot(` ${sign(b)} `, 3, { dim: b === 0 }), slot(formatNumber(Math.abs(b), 2), 5, { align: "left", dim: b === 0 }), "x",
      slot(` ${sign(c)} `, 3, { dim: c === 0 }), slot(formatNumber(Math.abs(c), 2), 6, { align: "left", dim: c === 0 }))));
    facts.className = "il-message";
    facts.textContent = a === 0
      ? "a = 0 esetén nincs x²-es tag, ezért ez nem parabola, hanem vízszintes egyenes."
      : `Csúcs: (${formatNumber(u, 2)}; ${formatNumber(v, 2)}). Tengely: x = ${formatNumber(u, 2)}. A parabola ${a > 0 ? "felfelé nyílik, a csúcs a minimumhely" : "lefelé nyílik, a csúcs a maximumhely"}${Math.abs(a) > 1 ? ", keskenyebb az x²-nél" : Math.abs(a) < 1 ? ", szélesebb az x²-nél" : ""}.`;
    renderSteps();
  }

  function renderSteps() {
    const { a, u, v } = state;
    const b = -2 * a * u, c = a * u * u + v;
    if (a === 0) { steps.replaceChildren("Az a = 0 nem másodfokú függvény."); return; }
    const uCalc = -b / (2 * a), vCalc = c - (b * b) / (4 * a);
    steps.replaceChildren(
      rich("a = ", slot(formatNumber(a, 2), 5, { align: "left" }), ", b = ", slot(formatNumber(b, 2), 6, { align: "left" }), ", c = ", slot(formatNumber(c, 2), 6, { align: "left" })), make("br"),
      rich("u = −b/(2a) = ", slot(formatNumber(uCalc, 2), 6, { align: "left" })), make("br"),
      rich("v = c − b²/(4a) = ", slot(formatNumber(vCalc, 2), 6, { align: "left" })));
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
