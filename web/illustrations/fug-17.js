import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -4, xMax: 5, yMin: -1, yMax: 10 };
const TABLE_X = [-2, -1, 0, 1, 2, 3];
const formatBig = (value) => (value >= 1000 ? groupDigits(value) : formatNumber(value, 2));

export function mount(root) {
  const scope = createScope();
  const state = { a: 2, x: 3 };
  let raceTimer = null;

  root.append(lead("Az exponenciális függvényben az x a kitevőben van: y = aˣ. Ez azt jelenti, hogy minden lépés ugyanazzal a számmal szoroz, nem ugyanannyit ad hozzá. Ezért lesz a növekedés egyre gyorsabb — vagy a csökkenés egyre lassabb."));

  // --- Card 1: graph and stairs ---
  const main = card("Állítsd be az a alapot");
  const slideA = range({ label: "a", min: 0.2, max: 3, step: 0.1, value: state.a, onInput: (n) => { state.a = n; render(); } });
  const ruleLine = make("div");
  main.append(controls(slideA.element), ruleLine);
  const plot = makePlot(main, { ...VIEW, unitX: 44, unitY: 32, yStep: 1, label: "Az y = aˣ függvény grafikonja lépcsővel" });
  const curve = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer);
  const stairs = svg("g", {}, plot.layer);
  const stairLabels = svg("g", {}, plot.figure);
  const anchor = svg("circle", { cx: plot.toX(0), cy: plot.toY(1), r: 7, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, plot.layer);
  addText(plot.figure, plot.toX(0) - 12, plot.toY(1) - 10, "(0; 1)", `fill:${PALETTE.blue}`, "end");
  const message = make("p", "il-message");
  const table = make("table", "il-table");
  main.append(message, table);

  // --- Card 2: race against linear growth ---
  const race = card("Verseny: exponenciális és lineáris");
  const slideX = range({ label: "x (lépések)", min: 0, max: 10, step: 0.5, value: state.x, onInput: (n) => { stopRace(); state.x = n; renderRace(); } });
  const playButton = button("Indítsd a versenyt", startRace);
  const bar = (label, color) => {
    const row = make("div", "il-bar"), track = make("div", "track"), fill = make("div", "fill"), value = make("b");
    fill.style.background = color; track.append(fill);
    row.append(make("span", "", label), track, value);
    return { row, fill, value };
  };
  const exponentialBar = bar("exponenciális: aˣ", "var(--accent)"), linearBar = bar("lineáris: 1 + (a − 1)·x", PALETTE.amber);
  const raceMessage = make("p", "il-message");
  race.append(controls(playButton, slideX.element), exponentialBar.row, linearBar.row, raceMessage);

  root.append(main, race, keyIdea("az y = aˣ függvényben minden +1 lépés x-ben az y-t az a számmal szorozza. Ha a > 1, nő, ha 0 < a < 1, csökken — de sosem lesz nulla vagy negatív. Hosszú távon a szorzás mindig lekörözi az összeadást."));

  function render() {
    const a = state.a, f = (x) => a ** x;
    curve.setAttribute("d", curveData(plot, f, VIEW.xMin, VIEW.xMax));
    ruleLine.replaceChildren(equation("y", rich(slot(formatNumber(a, 1), 4, { align: "right" }), "ˣ")));
    stairs.replaceChildren(); stairLabels.replaceChildren();
    for (let k = 0; k < 4; k++) {
      svg("path", { d: `M ${plot.toX(k)} ${plot.toY(f(k))} H ${plot.toX(k + 1)} V ${plot.toY(f(k + 1))}`, fill: "none", style: `stroke:${PALETTE.pink};stroke-width:2.5;stroke-dasharray:6 4` }, stairs);
      if (f(k + 1) <= VIEW.yMax - 0.3 && Math.abs(f(k + 1) - f(k)) > 0.15)
        addText(stairLabels, plot.toX(k + 1) + 6, plot.toY((f(k) + f(k + 1)) / 2) + 4, `· ${formatNumber(a, 1)}`, `fill:${PALETTE.pink};font-size:12px`);
    }
    message.className = "il-message";
    message.textContent = Math.abs(a - 1) < 1e-9
      ? "a = 1 esetén minden lépés 1-gyel szoroz, vagyis semmi sem változik: az y = 1 vízszintes egyenest kapjuk."
      : a > 1
        ? `a = ${formatNumber(a, 1)} > 1: növekedés. Minden +1 lépésnél az y-t megszorozzuk ${formatNumber(a, 1)} értékkel (rózsaszín lépcső), ezért egyre meredekebb a görbe.`
        : `a = ${formatNumber(a, 1)} < 1: csökkenés. Minden +1 lépésnél az y-t megszorozzuk ${formatNumber(a, 1)} értékkel, ezért kisebb lesz, de soha nem éri el a nullát.`;
    const row = (heading, values) => { const tr = make("tr"); tr.append(make("th", "", heading), ...values.map((value) => make("td", "", value))); return tr; };
    table.replaceChildren(row("x", TABLE_X.map((n) => formatNumber(n))), row("y = aˣ", TABLE_X.map((n) => formatNumber(f(n), 2))));
    renderRace();
  }

  function renderRace() {
    const a = state.a, x = state.x;
    const exponential = a ** x, linear = Math.max(0, 1 + (a - 1) * x), top = Math.max(exponential, linear, 1e-9);
    exponentialBar.fill.style.width = `${(exponential / top) * 100}%`; linearBar.fill.style.width = `${(linear / top) * 100}%`;
    exponentialBar.value.textContent = formatBig(exponential); linearBar.value.textContent = formatBig(linear);
    raceMessage.className = "il-message";
    raceMessage.textContent = Math.abs(a - 1) < 1e-9 ? "a = 1 esetén mindkettő 1 marad."
      : x <= 1 ? "Induláskor (x = 0) és az első lépés végén (x = 1) egyforma az eredmény. Nézd meg, mi történik utána!"
        : a > 1 ? `Az exponenciális eredmény már ${formatNumber(exponential / linear, 1)} × akkora, mint a lineáris, pedig ugyanonnan indultak, és az első lépésben ugyanannyit tettek meg.`
          : linear === 0 ? "A lineáris csökkenés elérte a nullát, az exponenciális még mindig pozitív, és mindig az marad."
            : "Az exponenciális csökkenés lassul, mert mindig az éppen meglévő érték egy részét veszi el; a lineáris egyenletesen fogy.";
  }

  function stopRace() { if (raceTimer !== null) scope.clearInterval(raceTimer); raceTimer = null; playButton.disabled = false; }

  function startRace() {
    stopRace();
    state.x = 0; slideX.set(0); renderRace();
    playButton.disabled = true;
    raceTimer = scope.interval(() => {
      state.x = Math.min(10, state.x + 0.5); slideX.set(state.x); renderRace();
      if (state.x >= 10) stopRace();
    }, 350);
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
