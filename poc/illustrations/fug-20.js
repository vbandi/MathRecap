import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const sub = (text) => make("sub", "", text);
const sup = (text) => make("sup", "", text);
const SEQUENCES = [
  { name: "aₙ = 3n − 2", rule: () => rich("3 · n − 2"), first: 1n, recursion: () => rich("aₙ₊₁ = aₙ + 3"), rest: "aₙ + 3",
    explicit: (n) => 3n * n - 2n, next: (a) => a + 3n, insert: (n) => rich(`3 · ${n} − 2`) },
  { name: "aₙ = 3 · 2ⁿ⁻¹", rule: () => rich("3 · 2", sup("n−1")), first: 3n, recursion: () => rich("aₙ₊₁ = 2 · aₙ"), rest: "2 · aₙ",
    explicit: (n) => 3n * 2n ** (n - 1n), next: (a) => 2n * a, insert: (n) => rich(`3 · 2`, sup(String(n - 1n))) },
  { name: "aₙ = 2ⁿ − 1", rule: () => rich("2", sup("n"), " − 1"), first: 1n, recursion: () => rich("aₙ₊₁ = 2 · aₙ + 1"), rest: "2 · aₙ + 1",
    explicit: (n) => 2n ** n - 1n, next: (a) => 2n * a + 1n, insert: (n) => rich("2", sup(String(n)), " − 1") },
];
const subscript = (n) => String(n).replace(/d/g, (digit) => "₀₁₂₃₄₅₆₇₈₉"[digit]);
const heading = (text) => make("p", "", text);
const SHOWN = 10, TARGET = 50, LINES = 7;

function niceStep(rough) {
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough);
}

export function mount(root) {
  const scope = createScope();
  const state = { index: 0, n: 50, chain: [] };

  root.append(lead("A sorozat olyan függvény, amelynek csak a pozitív egész számokon van értéke: az n-edik helyhez egy aₙ számot rendel. Kétféleképpen lehet megadni: képlettel, amellyel bármelyik tagot egyből kiszámolod, vagy rekurzióval, amikor minden tagot az előzőből kapsz meg."));

  const presetBar = make("div", "il-controls");
  const main = card("Ugyanaz a sorozat, kétféle megadás");
  main.append(presetBar);

  const explicitBox = make("div");
  const slideN = range({ label: "n", min: 1, max: 50, value: state.n, onInput: (n) => { state.n = n; renderExplicit(); renderPlot(); } });
  const explicitRule = make("div", "il-formula start"), explicitResult = make("div");
  explicitBox.append(heading("1. Képlettel (explicit)"), controls(slideN.element, button("Ugorj az 50. tagra", () => { state.n = TARGET; slideN.set(TARGET); renderExplicit(); renderPlot(); }, { ghost: true })), explicitRule, explicitResult);

  const recursiveBox = make("div"), recursionRule = make("div", "il-formula start");
  const chainList = make("div", "il-formula start");
  chainList.style.minHeight = `${LINES * 1.6 + 0.4}em`;
  const progress = make("p", "il-message");
  const stepButtons = [["Következő tag", 1], ["+5 tag", 5]].map(([text, count]) => button(text, () => advance(count)));
  recursiveBox.append(heading("2. Rekurzióval (az előző tagból)"), recursionRule, controls(...stepButtons, button("Újra", reset, { ghost: true })), chainList, progress);
  for (const box of [explicitBox, recursiveBox]) box.firstChild.style.fontWeight = "700";

  const plotCard = card("A sorozat mint függvény: pontok az n fölött");
  const plotBox = make("div");
  plotCard.append(plotBox, make("p", "il-muted", "Zöld kitöltött pont: a rekurzióval már kiszámolt tag. Üres kör: a képlettel kiszámolható, de a rekurzióban még nem értünk oda. A rózsaszín gyűrű a fenti n-edik tag. Nincs köztük összekötő vonal, mert a 2,5. tagnak nincs értelme."));
  main.append(explicitBox, recursiveBox);
  root.append(main, plotCard, keyIdea("a sorozat az n ↦ aₙ hozzárendelés a pozitív egészeken. A képlettel bármelyik tag egy lépésben megvan; a rekurzióval minden tagot végig kell számolni az elsőtől — cserébe gyakran egyszerűbb felírni."));

  let plot, dots;
  const sequence = () => SEQUENCES[state.index];
  const term = (n) => sequence().explicit(BigInt(n));

  SEQUENCES.forEach((item, index) => presetBar.append(toggle(item.name, index === state.index, () => { state.index = index; setSequence(); })));
  function setSequence() {
    [...presetBar.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.index)));
    const top = Math.max(...Array.from({ length: SHOWN }, (_, i) => Number(term(i + 1))));
    const step = niceStep(top / 5), yMax = Math.ceil(top / step) * step;
    plotBox.replaceChildren();
    plot = makePlot(plotBox, { xMin: 0, xMax: SHOWN + 1, yMin: -yMax * 0.06, yMax: yMax * 1.04, unitX: 40, unitY: 220 / (yMax * 1.1), yStep: step, xName: "n", yName: "aₙ", label: "A sorozat első tagjai pontokként" });
    dots = svg("g", {}, plot.figure);
    recursionRule.replaceChildren(rich("a", sub("1"), ` = ${sequence().first},  `), sequence().recursion());
    explicitRule.replaceChildren(rich("aₙ = ", sequence().rule()));
    reset();
  }

  function renderExplicit() {
    const n = state.n, value = term(n);
    explicitResult.replaceChildren(equation(rich("a", sub(String(n))), rich(sequence().insert(BigInt(n)), " = ", slot(make("b", "", groupDigits(value)), 24, { align: "left" }))));
  }

  function renderChain() {
    const { chain } = state, k = chain.length, from = Math.max(0, k - LINES);
    chainList.replaceChildren();
    if (from > 0) chainList.append("⋮", make("br"));
    for (let i = from; i < k; i++) {
      const line = i === 0 ? rich("a", sub("1"), " = ", make("b", "", groupDigits(chain[0])))
        : rich("a", sub(String(i + 1)), ` = ${sequence().rest.replaceAll("aₙ", "a" + subscript(i))} = `, make("b", "", groupDigits(chain[i])));
      chainList.append(line, make("br"));
    }
    const left = TARGET - k;
    progress.className = "il-message";
    progress.textContent = left > 0
      ? `${k} tagot számoltunk ki. Az 50. taghoz még ${left} lépés kell — a képlettel ez egyetlen lépés volt.`
      : "Megvan az 50. tag is: ugyanaz az érték, mint a képletből, csak 49 lépés után.";
    stepButtons.forEach((b) => { b.disabled = left <= 0; });
  }

  function advance(count) {
    for (let i = 0; i < count && state.chain.length < TARGET; i++) state.chain.push(sequence().next(state.chain.at(-1)));
    renderChain(); renderPlot();
  }

  function reset() {
    state.chain = [sequence().first];
    renderExplicit(); renderChain(); renderPlot();
  }

  function renderPlot() {
    dots.replaceChildren();
    for (let n = 1; n <= SHOWN; n++) {
      const known = n <= state.chain.length, x = plot.toX(n), y = plot.toY(Number(term(n)));
      svg("circle", { cx: x, cy: y, r: 6, style: known ? `fill:var(--accent);stroke:var(--input);stroke-width:2` : "fill:none;stroke:var(--dim);stroke-width:2" }, dots);
      if (n === state.n) svg("circle", { cx: x, cy: y, r: 11, style: `fill:none;stroke:${PALETTE.pink};stroke-width:3` }, dots);
    }
    if (state.n > SHOWN) addText(dots, plot.width - 30, 40, `n = ${state.n} már jóval jobbra van →`, `fill:${PALETTE.pink};font-size:12px`, "end");
  }

  setSequence();
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
