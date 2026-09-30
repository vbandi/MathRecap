import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -3, xMax: 9, yMin: -3, yMax: 9 };
const BASES = [0.25, 0.5, 1.5, 2, 3, 4, 5];

export function mount(root) {
  const scope = createScope();
  const state = { baseIndex: 3, fold: 0 };

  root.append(lead("A logaritmus azt kérdezi: hányadik hatványra kell emelni az a számot, hogy egy adott számot kapjunk? Például 2³ = 8, ezért a 2-es alapú logaritmus 8 értéke 3. A logaritmusfüggvény az exponenciális függvény megfordítása, ezért a grafikonja annak tükörképe."));

  const main = card("Tükrözd az aˣ grafikonját az y = x egyenesre");
  const slideBase = range({ label: "a alap", min: 0, max: BASES.length - 1, value: state.baseIndex, format: (i) => formatNumber(BASES[i]), onInput: (i) => { state.baseIndex = i; render(); } });
  const slideFold = range({ label: "tükrözés", min: 0, max: 1, step: 0.01, value: 0, format: (t) => `${Math.round(t * 100)}%`, onInput: (t) => { scope.clearAll(); state.fold = t; render(); } });
  const play = button("Tükrözd!", () => {
    scope.clearAll();
    const from = state.fold >= 0.99 ? 0 : state.fold;
    tween(scope, 1800 * (1 - from) + 300, (e) => { state.fold = from + (1 - from) * e; slideFold.set(state.fold); render(); });
  });
  const rule = make("div");
  main.append(controls(slideBase.element, play, slideFold.element), rule);
  const plot = makePlot(main, { ...VIEW, unitX: 32, label: "Az aˣ függvény és tükörképe, a logaritmusfüggvény" });
  svg("line", { x1: plot.toX(VIEW.xMin), y1: plot.toY(VIEW.xMin), x2: plot.toX(VIEW.xMax), y2: plot.toY(VIEW.xMax), style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:5 5" }, plot.layer);
  addText(plot.figure, plot.toX(7.2), plot.toY(8.5), "y = x", "fill:var(--fg-soft);font-size:12px");
  const domainBar = svg("line", { x1: plot.toX(0), x2: plot.toX(VIEW.xMax), y1: plot.toY(0), y2: plot.toY(0), style: `stroke:${PALETTE.amber};stroke-width:7;stroke-linecap:round` }, plot.layer);
  const domainLabel = addText(plot.figure, plot.toX(3.3), plot.toY(0) + 32, "értelmezési tartomány: x > 0", `fill:${PALETTE.amber};font-size:12px`);
  const ghost = svg("path", { fill: "none", style: "stroke:var(--dim);stroke-width:2.5;stroke-dasharray:7 6" }, plot.layer);
  const moving = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer);
  const dots = [0, 1].map(() => svg("circle", { r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, plot.layer));
  const dotLabels = [0, 1].map(() => addText(plot.figure, 0, 0, "", `fill:${PALETTE.pink};font-size:12px`));
  const message = make("p", "il-message");
  main.append(message);

  root.append(main, keyIdea("a logaritmusfüggvény (y = log₍ₐ₎ x) az y = aˣ fordítottja: ha aʸ = x, akkor y = log₍ₐ₎ x. Csak pozitív x-re értelmezett, mert az aˣ értéke sosem nulla vagy negatív. Mindig átmegy az (1; 0) ponton, mert a⁰ = 1, és az (a; 1) ponton, mert a¹ = a."));

  function render() {
    const a = BASES[state.baseIndex], t = state.fold, done = t > 0.99;
    const points = [];
    for (let i = 0; i <= 400; i++) { const p = -9 + (18 * i) / 400, e = a ** p; points.push([(1 - t) * p + t * e, (1 - t) * e + t * p]); }
    moving.setAttribute("d", pathOf(plot, points));
    ghost.setAttribute("d", curveData(plot, (x) => a ** x, VIEW.xMin, VIEW.xMax));
    ghost.style.opacity = t < 0.01 ? 0 : 0.5;
    domainBar.style.opacity = t; domainLabel.style.opacity = t;
    const marks = [[0, 1, 1, 0], [1, a, a, 1]];
    marks.forEach(([x0, y0, x1, y1], i) => {
      const x = (1 - t) * x0 + t * x1, y = (1 - t) * y0 + t * y1;
      dots[i].setAttribute("cx", plot.toX(x)); dots[i].setAttribute("cy", plot.toY(y));
      dotLabels[i].textContent = t < 0.01 ? `(${formatNumber(x0)}; ${formatNumber(y0)})` : done ? `(${formatNumber(x1)}; ${formatNumber(y1)})` : "";
      dotLabels[i].setAttribute("x", Math.min(plot.toX(x) + 10, plot.width - 70)); dotLabels[i].setAttribute("y", plot.toY(y) - 10);
    });
    const base = formatNumber(a);
    rule.replaceChildren(equation(rich("y = ", base, make("sup", "", "x")), rich("y = log", make("sub", "", base), " x"), done ? "⇄" : "→"));
    message.className = `il-message ${done ? "good" : ""}`;
    message.textContent = t < 0.01
      ? `Ez az y = ${base}ˣ. Kiemeltük két pontját: (0; 1) és (1; ${base}). Tükrözd őket az y = x egyenesre!`
      : done
        ? `Kész: az új görbe a ${base} alapú logaritmusfüggvény grafikonja. A pontok (x; y) helyett (y; x) lettek: az (1; 0) azt jelenti, hogy a kitevő 0, ha 1-et kapunk; az (${base}; 1) azt, hogy a kitevő 1, ha a-t kapunk. A grafikon a függőleges tengelytől jobbra van: x > 0.`
        : "Minden (x; y) pont az (y; x) pontba megy át.";
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
