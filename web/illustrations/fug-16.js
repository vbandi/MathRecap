import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const VIEW = { xMin: -7, xMax: 7, yMin: -6, yMax: 8 };
const BASES = [
  { name: "x²", f: (x) => x * x, point: 1, write: (arg) => (arg === "x" ? "x²" : `(${arg})²`) },
  { name: "|x|", f: Math.abs, point: 2, write: (arg) => `|${arg}|` },
  { name: "√x", f: Math.sqrt, point: 4, write: (arg) => (arg === "x" ? "√x" : `√(${arg})`) },
];
const MODES = [
  { id: "add", name: "f(x) + c", min: -4, max: 4, step: 1, value: 2 },
  { id: "shift", name: "f(x + c)", min: -4, max: 4, step: 1, value: 2 },
  { id: "scale", name: "c · f(x)", min: -3, max: 3, step: 0.5, value: 2 },
  { id: "flip", name: "−f(x)" },
];
const signed = (c) => `${c < 0 ? "−" : "+"} ${formatNumber(Math.abs(c))}`;

export function mount(root) {
  const scope = createScope();
  const state = { base: 0, mode: "shift", c: { add: 2, shift: 2, scale: 2 } };

  root.append(lead("Ha egy függvény grafikonját ismered, a többi hasonló függvényé gyorsan megrajzolható: a képlet apró változtatása a grafikont eltolja, nyújtja vagy tükrözi. Válassz egy alapfüggvényt és egy átalakítást, és nézd meg, hová kerül a grafikon."));

  const main = card("Alapfüggvény és átalakítás");
  const baseButtons = BASES.map((base, index) => toggle(`f(x) = ${base.name}`, index === state.base, () => { state.base = index; render(); }));
  const modeButtons = MODES.map((mode) => toggle(mode.name, mode.id === state.mode, () => { state.mode = mode.id; buildSlider(); render(); }));
  const sliderBox = make("span");
  const ruleLines = make("div");
  main.append(controls(make("span", "il-muted", "Alapfüggvény:"), ...baseButtons), controls(make("span", "il-muted", "Átalakítás:"), ...modeButtons), controls(sliderBox), ruleLines);
  const plot = makePlot(main, { ...VIEW, unitX: 32, label: "Az alapfüggvény és az átalakított függvény grafikonja" });
  const ghost = svg("path", { fill: "none", style: "stroke:var(--dim);stroke-width:2.5;stroke-dasharray:7 6" }, plot.layer);
  const curve = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, plot.layer);
  const arrow = svg("path", { fill: "none", style: `stroke:${PALETTE.pink};stroke-width:2;stroke-dasharray:5 4` }, plot.layer);
  const source = svg("circle", { r: 6, style: `fill:var(--dim);stroke:var(--input);stroke-width:2` }, plot.layer);
  const image = svg("circle", { r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, plot.layer);
  const legend = svg("g", {}, plot.figure);
  svg("line", { x1: 34, x2: 62, y1: 38, y2: 38, style: "stroke:var(--dim);stroke-width:2.5;stroke-dasharray:7 6" }, legend);
  addText(legend, 68, 42, "f(x)", "fill:var(--fg-soft);font-size:12px");
  svg("line", { x1: 34, x2: 62, y1: 58, y2: 58, style: "stroke:var(--accent);stroke-width:3.5" }, legend);
  addText(legend, 68, 62, "g(x)", "fill:var(--accent);font-size:12px");
  const message = make("p", "il-message");
  main.append(message);

  root.append(main, keyIdea("ami a függvényértéket változtatja (f(x) + c, c · f(x), −f(x)), az függőlegesen hat, a megszokott irányban. Ami az x-et változtatja (f(x + c)), az vízszintesen hat, és fordítva: f(x + c) balra tolja a grafikont, ha c > 0."));

  function buildSlider() {
    const mode = MODES.find((m) => m.id === state.mode);
    modeButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(MODES[i].id === state.mode)));
    if (mode.min === undefined) { sliderBox.replaceChildren(make("span", "il-muted", "Ennek az átalakításnak nincs paramétere.")); return; }
    const slider = range({ label: "c", min: mode.min, max: mode.max, step: mode.step, value: state.c[mode.id], onInput: (n) => { state.c[mode.id] = n; render(); } });
    sliderBox.replaceChildren(slider.element);
  }

  function render() {
    const base = BASES[state.base], f = base.f, p = base.point, c = state.c[state.mode] ?? 0;
    baseButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.base)));
    const g = { add: (x) => f(x) + c, shift: (x) => f(x + c), scale: (x) => c * f(x), flip: (x) => -f(x) }[state.mode];
    const [qx, qy] = { add: [p, f(p) + c], shift: [p - c, f(p)], scale: [p, c * f(p)], flip: [p, -f(p)] }[state.mode];
    ghost.setAttribute("d", curveData(plot, f, VIEW.xMin, VIEW.xMax, 280));
    curve.setAttribute("d", curveData(plot, g, VIEW.xMin, VIEW.xMax, 280));
    arrow.setAttribute("d", `M ${plot.toX(p)} ${plot.toY(f(p))} L ${plot.toX(qx)} ${plot.toY(qy)}`);
    source.setAttribute("cx", plot.toX(p)); source.setAttribute("cy", plot.toY(f(p)));
    image.setAttribute("cx", plot.toX(qx)); image.setAttribute("cy", plot.toY(qy));

    const general = { add: `f(x) ${signed(c)}`, shift: `f(x ${c < 0 ? "−" : "+"} ${formatNumber(Math.abs(c))})`, scale: `${formatNumber(c)} · f(x)`, flip: "−f(x)" }[state.mode];
    const explicit = { add: `${base.write("x")} ${signed(c)}`, shift: base.write(`x ${c < 0 ? "−" : "+"} ${formatNumber(Math.abs(c))}`), scale: `${formatNumber(c)} · ${base.write("x")}`, flip: `−${base.write("x")}` }[state.mode];
    ruleLines.replaceChildren(equation("g(x)", slot(general, 16, { align: "left" })), equation("g(x)", slot(explicit, 16, { align: "left" })));

    const pointName = `f(${p}) = ${formatNumber(f(p))}`;
    message.className = "il-message";
    if (state.mode === "shift") {
      message.className = "il-message warn";
      message.textContent = c === 0 ? "c = 0 esetén nem változik semmi. Próbálj ki egy pozitív c-t!"
        : `Meglepetés: c = ${formatNumber(c)} esetén a grafikon ${c > 0 ? "balra" : "jobbra"} tolódik ${formatNumber(Math.abs(c))} egységgel, pedig a képletben ${c > 0 ? "+" : "−"} áll! A g(x) = f(x ${c > 0 ? "+" : "−"} ${formatNumber(Math.abs(c))}) az x helyen azt az értéket veszi fel, amit f az x ${c > 0 ? "+" : "−"} ${formatNumber(Math.abs(c))} helyen, ezért az ${pointName} érték már x = ${formatNumber(qx)} helyen megjelenik.`;
    } else if (state.mode === "add") {
      message.textContent = c === 0 ? "c = 0 esetén nem változik semmi." : `Minden pont ${formatNumber(Math.abs(c))} egységgel ${c > 0 ? "följebb" : "lejjebb"} kerül: a ${pointName} helyett itt ${formatNumber(qy)} az érték.`;
    } else if (state.mode === "scale") {
      message.textContent = c === 0 ? "c = 0 esetén minden érték 0: a grafikon a vízszintes tengely lesz."
        : `Minden függvényértéket megszorzunk ${formatNumber(c)} értékkel: ${Math.abs(c) > 1 ? "a grafikon függőlegesen megnyúlik" : Math.abs(c) < 1 ? "a grafikon lelapul" : "a grafikon alakja nem változik"}${c < 0 ? ", és a vízszintes tengelyre tükröződik" : ""}.`;
    } else {
      message.textContent = `Az ellentettjét vesszük minden értéknek: a grafikon tükörképe lesz a vízszintes tengelyre. A ${pointName} helyett ${formatNumber(qy)} lesz.`;
    }
  }

  buildSlider();
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
