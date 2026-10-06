import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -2, xMax: 9, yMin: -2, yMax: 9 };
const SQUARES = [0, 1, 4, 9, 16, 25];

export function mount(root) {
  const scope = createScope();
  const state = { fold: 0, x: 4 };

  root.append(lead("A négyzetre emelés és a négyzetgyökvonás egymás párja: ha 3² = 9, akkor √9 = 3. A √x függvény grafikonját megkapod, ha az x² jobb oldali ágát (x ≥ 0) átfordítod az y = x egyenesre."));

  // --- Card 1: mirror x² across y = x ---
  const mirror = card("Tükrözd az x² jobb ágát az y = x egyenesre");
  const slider = range({ label: "tükrözés", min: 0, max: 1, step: 0.01, value: 0, format: (t) => `${Math.round(t * 100)}%`, onInput: (t) => { scope.clearAll(); state.fold = t; renderMirror(); } });
  const play = button("Tükrözd!", () => {
    scope.clearAll();
    const from = state.fold >= 0.99 ? 0 : state.fold;
    tween(scope, 1800 * (1 - from) + 300, (e) => { state.fold = from + (1 - from) * e; slider.set(state.fold); renderMirror(); });
  });
  const mirrorMessage = make("p", "il-message");
  mirror.append(controls(play, slider.element));
  const plot = makePlot(mirror, { ...VIEW, unitX: 34, label: "Az x² jobb ága és tükörképe, a négyzetgyökfüggvény grafikonja" });
  svg("line", { x1: plot.toX(VIEW.xMin), y1: plot.toY(VIEW.xMin), x2: plot.toX(VIEW.xMax), y2: plot.toY(VIEW.xMax), style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:5 5" }, plot.layer);
  addText(plot.figure, plot.toX(7.4), plot.toY(8.6), "y = x", "fill:var(--fg-soft);font-size:12px");
  const domainBar = svg("line", { x1: plot.toX(0), x2: plot.toX(VIEW.xMax), y1: plot.toY(0), y2: plot.toY(0), style: `stroke:${PALETTE.amber};stroke-width:7;stroke-linecap:round` }, plot.layer);
  const domainLabel = addText(plot.figure, plot.toX(0.4), plot.toY(0) + 30, "értelmezési tartomány: x ≥ 0", `fill:${PALETTE.amber};font-size:12px`);
  const original = svg("path", { fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3;stroke-dasharray:1 0` }, plot.layer);
  const moving = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer);
  const originalLabel = addText(plot.figure, plot.toX(2.4), plot.toY(8.6), "y = x²  (x ≥ 0)", `fill:${PALETTE.blue};font-size:12px`);
  const rootLabel = addText(plot.figure, plot.toX(6.2), plot.toY(3.6), "y = √x", "fill:var(--accent);font-size:13px");
  mirror.append(mirrorMessage);

  // --- Card 2: read values ---
  const reading = card("Olvass le értékeket: mennyi √x?");
  const slideX = range({ label: "x", min: -2, max: 9, step: 0.25, value: state.x, onInput: (n) => { state.x = n; renderReading(); } });
  const quick = SQUARES.slice(0, 4).map((n) => button(String(n), () => { state.x = n; slideX.set(n); renderReading(); }, { ghost: true }));
  reading.append(controls(slideX.element, make("span", "il-muted", "Ugrás:"), ...quick));
  const plot2 = makePlot(reading, { ...VIEW, unitX: 26, label: "A √x grafikonja és egy kiválasztott pontja" });
  svg("path", { d: curveData(plot2, Math.sqrt, 0, VIEW.xMax, 200), fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot2.layer);
  const guide = svg("path", { fill: "none", style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, plot2.layer);
  const dot = svg("circle", { r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, plot2.layer);
  const crossX = svg("path", { fill: "none", style: `stroke:${PALETTE.red};stroke-width:3` }, plot2.layer);
  const readMessage = make("p", "il-message");
  const table = make("table", "il-table");
  reading.append(readMessage, table);

  root.append(mirror, reading, keyIdea("a √x csak x ≥ 0 esetén értelmezett, és az értéke is mindig 0 vagy pozitív. Az x² és a √x grafikonja egymás tükörképe az y = x egyenesre, mert a két művelet egymás visszafordítása."));

  function renderMirror() {
    const t = state.fold, pieces = [];
    for (let i = 0; i <= 120; i++) { const p = (3.2 * i) / 120; pieces.push([(1 - t) * p + t * p * p, (1 - t) * p * p + t * p]); }
    moving.setAttribute("d", pathOf(plot, pieces));
    original.setAttribute("d", curveData(plot, (x) => x * x, 0, 3.2, 120));
    original.style.opacity = t < 0.01 ? 0 : 0.45;
    originalLabel.style.opacity = t < 0.01 ? 0 : 0.8;
    domainBar.style.opacity = t; domainLabel.style.opacity = t; rootLabel.style.opacity = t > 0.99 ? 1 : 0;
    mirrorMessage.className = `il-message ${t > 0.99 ? "good" : ""}`;
    mirrorMessage.textContent = t < 0.01
      ? "Itt az x² jobb ága: az (x; x²) pontok, pl. (2; 4) és (3; 9). Húzd a csúszkát, vagy kattints a Tükrözd! gombra."
      : t > 0.99
        ? "A (2; 4) pont átkerült a (4; 2) pontba, a (3; 9) pedig a (9; 3)-ba: ha 2² = 4, akkor √4 = 2. Az új görbe a √x grafikonja; csak a jobb oldalon létezik."
        : "Minden (x; y) pont a tükörképébe, az (y; x) pontba megy át.";
  }

  function renderReading() {
    const x = state.x, valid = x >= 0, r = valid ? Math.sqrt(x) : 0;
    const exact = valid && Math.abs(Math.round(r * 1000) / 1000 - r) < 1e-9;
    dot.style.opacity = valid ? 1 : 0; guide.setAttribute("d", valid ? `M ${plot2.toX(x)} ${plot2.toY(0)} V ${plot2.toY(r)} H ${plot2.toX(0)}` : "");
    dot.setAttribute("cx", plot2.toX(x)); dot.setAttribute("cy", plot2.toY(r));
    crossX.setAttribute("d", valid ? "" : `M ${plot2.toX(x)} ${plot2.toY(0) - 8} V ${plot2.toY(0) + 8}`);
    readMessage.className = `il-message ${valid ? "" : "warn"}`;
    readMessage.textContent = !valid
      ? `Negatív számnak nincs valós négyzetgyöke (√${formatNumber(x)} nem értelmezett), mert semmit négyzetre emelve nem kapunk negatívat. A grafikon itt véget ér.`
      : exact
        ? `√${formatNumber(x)} = ${formatNumber(r)}, mert ${formatNumber(r)}² = ${formatNumber(x)}.${Number.isInteger(r) ? " Az x teljes négyzet." : ""}`
        : `√${formatNumber(x)} ≈ ${formatNumber(r, 3)}: ez két egész szám közé esik (${Math.floor(r)} és ${Math.floor(r) + 1}), mert ${Math.floor(r) ** 2} < ${formatNumber(x)} < ${(Math.floor(r) + 1) ** 2}.`;
    const cells = (heading, values) => { const row = make("tr"); row.append(make("th", "", heading), ...values.map((value, i) => make("td", "", String(value)))); return row; };
    table.replaceChildren(cells("x", SQUARES), cells("√x", SQUARES.map(Math.sqrt)));
    [...table.children].forEach((row) => [...row.children].slice(1).forEach((cell, i) => { cell.style.color = SQUARES[i] === x ? "var(--accent)" : ""; cell.style.fontWeight = SQUARES[i] === x ? "700" : ""; }));
  }

  renderMirror();
  renderReading();
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
