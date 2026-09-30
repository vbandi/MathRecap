import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -7, xMax: 7, yMin: -4, yMax: 8 };
const parenthesized = (n) => (n < 0 ? `(${formatNumber(n)})` : formatNumber(n));

export function mount(root) {
  const scope = createScope();
  const state = { fold: 0, u: 0, v: 0, x: 3 };

  root.append(lead("Az abszolútérték megmondja, milyen messze van egy szám a nullától, ezért sosem negatív: |−3| = 3 és |3| = 3. A grafikonja olyan, mintha az y = x egyenes negatív oldalát felhajtanád a vízszintes tengely fölé."));

  // --- Card 1: folding y = x ---
  const folding = card("Hajtogasd fel az y = x egyenest");
  const foldSlider = range({ label: "hajtogatás", min: 0, max: 1, step: 0.01, value: 0, format: (t) => `${Math.round(t * 100)}%`, onInput: (t) => { scope.clearAll(); state.fold = t; renderFold(); } });
  const foldButton = button("Hajtsd fel!", () => {
    scope.clearAll();
    const from = state.fold >= 0.99 ? 0 : state.fold;
    tween(scope, 1600 * (1 - from) + 300, (e) => { state.fold = from + (1 - from) * e; foldSlider.set(state.fold); renderFold(); });
  });
  const foldMessage = make("p", "il-message");
  const foldPlot = makePlot(folding, { ...VIEW, unitX: 30, unitY: 30, label: "Az y = x egyenes negatív részének felhajtása" });
  const base = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, foldPlot.layer);
  const negative = svg("path", { fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, foldPlot.layer);
  folding.prepend(controls(foldButton, foldSlider.element)); folding.append(foldMessage);

  // --- Card 2: |x - u| + v and distance ---
  const shifted = card("Tolás és távolság: |x − u| + v");
  const slideU = range({ label: "u", min: -4, max: 4, value: 0, onInput: (n) => { state.u = n; renderShift(); } });
  const slideV = range({ label: "v", min: -3, max: 3, value: 0, onInput: (n) => { state.v = n; renderShift(); } });
  const slideX = range({ label: "x", min: -6, max: 6, value: state.x, onInput: (n) => { state.x = n; renderShift(); } });
  const ruleLine = make("div");
  const shiftPlot = makePlot(shifted, { ...VIEW, unitX: 30, unitY: 30, label: "Az f(x) = |x − u| + v függvény grafikonja" });
  const ghost = svg("path", { fill: "none", style: "stroke:var(--dim);stroke-width:2.5;stroke-dasharray:7 6" }, shiftPlot.layer);
  const curve = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, shiftPlot.layer);
  const axisOfSymmetry = svg("line", { style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 5" }, shiftPlot.layer);
  const vertex = svg("circle", { r: 7, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, shiftPlot.layer);
  const vertexLabel = addText(shiftPlot.figure, 0, 0, "", `fill:${PALETTE.blue}`);
  const mover = svg("circle", { r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, shiftPlot.layer);

  const LINE = { width: shiftPlot.width, height: 86, pad: 24, min: -7, max: 7 };
  const lineX = (n) => LINE.pad + ((n - LINE.min) / (LINE.max - LINE.min)) * (LINE.width - 2 * LINE.pad);
  const numberLine = svg("svg", { class: "il-svg", viewBox: `0 0 ${LINE.width} ${LINE.height}`, role: "img", "aria-label": "Számegyenes: az x szám távolsága az u számtól", style: "margin-top:10px" }, shifted);
  svg("line", { x1: lineX(LINE.min), x2: lineX(LINE.max), y1: 50, y2: 50, class: "axis" }, numberLine);
  for (let n = LINE.min; n <= LINE.max; n++) {
    svg("line", { x1: lineX(n), x2: lineX(n), y1: 45, y2: 55, class: "axis" }, numberLine);
    svg("text", { x: lineX(n), y: 72, "text-anchor": "middle", text: formatNumber(n), style: "font-size:11px;fill:var(--dim)" }, numberLine);
  }
  const distanceBar = svg("line", { y1: 50, y2: 50, style: `stroke:${PALETTE.amber};stroke-width:6;stroke-linecap:round` }, numberLine);
  const uDot = svg("circle", { cy: 50, r: 8, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, numberLine);
  const xDot = svg("circle", { cy: 50, r: 8, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, numberLine);
  const uName = addText(numberLine, 0, 30, "u", `fill:${PALETTE.blue}`, "middle");
  const xName = addText(numberLine, 0, 30, "x", `fill:${PALETTE.pink}`, "middle");
  const shiftMessage = make("p", "il-message");
  shifted.append(controls(slideU.element, slideV.element, slideX.element), ruleLine, shiftPlot.figure, numberLine, shiftMessage);

  root.append(folding, shifted, keyIdea("|x − u| azt mondja meg, milyen messze van x az u-tól a számegyenesen. A grafikon V alakú: csúcsa az (u; v) pontban van, ahol a távolság 0, onnan mindkét irányban 1 meredekséggel emelkedik."));

  function renderFold() {
    const { fold } = state;
    base.setAttribute("d", pathOf(foldPlot, [[0, 0], [VIEW.xMax, VIEW.xMax]]));
    negative.setAttribute("d", curveData(foldPlot, (x) => x * Math.cos(Math.PI * fold), VIEW.xMin, 0, 60));
    foldMessage.className = `il-message ${fold > 0.99 ? "good" : ""}`;
    foldMessage.textContent = fold < 0.01
      ? "Ez az y = x egyenes. A bal oldalán (x < 0) negatív értékeket ad, pl. f(−3) = −3."
      : fold > 0.99
        ? "Kész: a negatív rész a tengely fölé került. Így x < 0 esetén y = −x, vagyis |x| = x, ha x ≥ 0, és |x| = −x, ha x < 0."
        : "A narancs szakaszt a vízszintes tengely körül fordítjuk fel: a pontok tükörképei lesznek a tengelyre.";
  }

  function renderShift() {
    const { u, v, x } = state;
    const f = (t) => Math.abs(t - u) + v;
    ghost.setAttribute("d", curveData(shiftPlot, Math.abs, VIEW.xMin, VIEW.xMax, 120));
    curve.setAttribute("d", curveData(shiftPlot, f, VIEW.xMin, VIEW.xMax, 120));
    axisOfSymmetry.setAttribute("x1", shiftPlot.toX(u)); axisOfSymmetry.setAttribute("x2", shiftPlot.toX(u));
    axisOfSymmetry.setAttribute("y1", shiftPlot.toY(VIEW.yMin)); axisOfSymmetry.setAttribute("y2", shiftPlot.toY(VIEW.yMax));
    vertex.setAttribute("cx", shiftPlot.toX(u)); vertex.setAttribute("cy", shiftPlot.toY(v));
    vertexLabel.textContent = `csúcs (${formatNumber(u)}; ${formatNumber(v)})`;
    vertexLabel.setAttribute("x", Math.min(shiftPlot.toX(u) + 12, shiftPlot.width - 130)); vertexLabel.setAttribute("y", Math.min(shiftPlot.toY(v) + 26, shiftPlot.height - 28));
    mover.setAttribute("cx", shiftPlot.toX(x)); mover.setAttribute("cy", shiftPlot.toY(f(x)));

    ruleLine.replaceChildren(equation("f(x)", rich(
      "|x", slot(` ${u < 0 ? "+" : "−"} `, 3, { dim: u === 0 }), slot(formatNumber(Math.abs(u)), 1, { align: "left", dim: u === 0 }), "|",
      slot(` ${v < 0 ? "−" : "+"} `, 3, { dim: v === 0 }), slot(formatNumber(Math.abs(v)), 1, { align: "left", dim: v === 0 }))));

    const [a, b] = [lineX(u), lineX(x)];
    distanceBar.setAttribute("x1", a); distanceBar.setAttribute("x2", b);
    uDot.setAttribute("cx", a); xDot.setAttribute("cx", b);
    uName.setAttribute("x", a); xName.setAttribute("x", b);
    uName.setAttribute("dy", u === x ? -16 : 0); xName.setAttribute("dy", 0);
    uName.textContent = u === x ? "u = x" : "u"; xName.textContent = u === x ? "" : "x";
    const distance = Math.abs(x - u);
    shiftMessage.textContent = `|${formatNumber(x)} − ${parenthesized(u)}| = ${formatNumber(distance)}: ennyire van x az u-tól. Ezért f(${formatNumber(x)}) = ${formatNumber(distance)} ${v < 0 ? "−" : "+"} ${formatNumber(Math.abs(v))} = ${formatNumber(f(x))}.`;
  }

  renderFold();
  renderShift();
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
