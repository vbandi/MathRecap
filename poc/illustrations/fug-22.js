import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const W = 640, H = 290, TOP = 34, PLOT_HEIGHT = 200;
const sub = (text) => make("sub", "", text);
const sup = (text) => make("sup", "", text);
const paren = (n) => (n < 0 ? `(${formatNumber(n)})` : formatNumber(n));
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";
const SUM_CAPTIONS = [
  "Írjuk fel az első n tag összegét, és nevezzük Sₙ-nek: minden tag az előzőnek a q-szorosa.",
  "Szorozzuk meg az egész összeget q-val: minden tag eggyel jobbra csúszik (a₁ → a₁q, a₁q → a₁q², …).",
  "A két sort egymás alá írva majdnem minden tag megegyezik: ezek kivonáskor kiesnek (elhalványítottuk őket).",
  "Csak két tag marad: Sₙ − q·Sₙ = a₁ − a₁qⁿ. Kiemelve: Sₙ · (1 − q) = a₁ · (1 − qⁿ), ahonnan q ≠ 1 esetén leosztva megkapjuk az összegképletet.",
];

export function mount(root) {
  const scope = createScope();
  const state = { a1: 1, q: 2, n: 6, phase: 0, square: 10 };
  const term = (k) => state.a1 * state.q ** (k - 1);

  root.append(lead("Mértani sorozatban minden tag az előzőnek ugyanannyiszorosa: ezt a szorzót hívjuk hányadosnak, jele q. Ezért a sorozat nem egyenletesen, hanem egyre gyorsabban nő (vagy zsugorodik), a tagok összegére pedig van egy ügyes trükk."));

  const bars = card("Oszlopok: minden oszlop q-szorosa az előzőnek");
  const slideA = range({ label: "a₁", min: 1, max: 3, value: state.a1, onInput: (v) => { state.a1 = v; render(); } });
  const slideQ = range({ label: "q", min: -2, max: 3, step: 0.5, value: state.q, onInput: (v) => { state.q = v; render(); } });
  const slideN = range({ label: "n", min: 1, max: 8, value: state.n, onInput: (v) => { state.n = v; render(); } });
  const termLine = make("div");
  bars.append(controls(slideA.element, slideQ.element, slideN.element), termLine);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "A mértani sorozat tagjai oszlopokként" }, bars);
  const barMessage = make("p", "il-message");
  bars.append(barMessage);

  const sumCard = card("Az összeg trükkje: kivonás eltolt sorokkal");
  const gridBox = make("div");
  gridBox.style.overflowX = "auto";
  const sumCaption = make("p", "il-message");
  const sumResult = make("div", "il-formula start");
  const stepButton = button("Következő lépés", () => { state.phase = Math.min(3, state.phase + 1); renderSum(); });
  sumCard.append(controls(stepButton, button("Újra", () => { state.phase = 0; renderSum(); }, { ghost: true })), gridBox, sumCaption, sumResult);

  const chess = card("Sakktábla-gabona");
  const slideSquare = range({ label: "mező sorszáma", min: 1, max: 64, value: state.square, onInput: (v) => { state.square = v; renderChess(); } });
  const board = make("div");
  board.style.cssText = "display:grid;grid-template-columns:repeat(8,1fr);gap:2px;max-width:320px;margin:10px 0";
  const squares = Array.from({ length: 64 }, () => { const cell = make("div"); cell.style.cssText = "aspect-ratio:1;border-radius:3px"; board.append(cell); return cell; });
  const chessLine = make("p", "il-message");
  chess.append(make("p", "", "A legenda szerint a sakk feltalálója gabonát kért: az első mezőre 1 szemet, és minden következő mezőre az előző kétszeresét (a₁ = 1, q = 2)."), controls(slideSquare.element), board, chessLine);

  root.append(bars, sumCard, chess, keyIdea("mértani sorozatban aₙ = a₁ · qⁿ⁻¹, az első n tag összege pedig Sₙ = a₁ · (1 − qⁿ) / (1 − q), ha q ≠ 1. Ha q = 1, minden tag egyenlő, és Sₙ = n · a₁."));

  function render() {
    const { a1, q, n } = state;
    const values = Array.from({ length: n }, (_, i) => term(i + 1));
    const up = Math.max(0, ...values), down = Math.max(0, ...values.map((v) => -v)), span = Math.max(up + down, 1e-9);
    const baseY = TOP + (up / span) * PLOT_HEIGHT, scale = PLOT_HEIGHT / span, slotWidth = (W - 60) / 8;
    figure.replaceChildren();
    svg("line", { x1: 20, x2: W - 20, y1: baseY, y2: baseY, class: "axis" }, figure);
    values.forEach((v, i) => {
      const x = 40 + i * slotWidth, height = Math.abs(v) * scale;
      svg("rect", { x, y: v >= 0 ? baseY - height : baseY, width: slotWidth * 0.68, height, rx: 3, style: `fill:${v >= 0 ? "var(--accent)" : PALETTE.pink};fill-opacity:.85` }, figure);
      addText(figure, x + slotWidth * 0.34, v >= 0 ? baseY - height - 6 : baseY + height + 15, formatNumber(v, 3), "fill:var(--fg);font-size:12px", "middle");
      addText(figure, x + slotWidth * 0.34, H - 8, `a${SUBSCRIPTS[i + 1]}`, "fill:var(--dim);font-size:12px", "middle");
      if (i > 0) addText(figure, x - slotWidth * 0.16, 18, `· ${paren(q)}`, `fill:${PALETTE.amber};font-size:12px`, "middle");
    });
    const an = term(n);
    termLine.replaceChildren(equation(rich("a", sub("n")), slot(rich(`a₁·qⁿ⁻¹ = ${a1}·${paren(q)}`, sup(String(n - 1)), " = ", make("b", "", formatNumber(an, 4))), 40, { align: "left" })));
    barMessage.className = "il-message";
    barMessage.textContent = q === 0 ? "q = 0 esetén az első tag után minden tag 0: ez már nem igazi mértani sorozat."
      : q === 1 ? "q = 1: minden tag egyenlő, a sorozat állandó."
        : q < 0 ? "Negatív q: az előjel minden lépésben váltakozik, az oszlopok hol felfelé, hol lefelé állnak."
          : q > 1 ? "q > 1: a tagok egyre gyorsabban nőnek, mert mindig az éppen meglévő értéket szorozzuk."
            : "0 < q < 1: a tagok egyre kisebbek, de sosem érik el a nullát.";
    renderSum();
  }

  function renderSum() {
    const { a1, q, n, phase } = state;
    stepButton.disabled = phase >= 3;
    const grid = make("div");
    grid.style.cssText = `display:grid;grid-template-columns:12ch repeat(${n + 1},6.4ch);gap:6px 4px;align-items:center;min-width:max-content;font:14px var(--font-mono);color:var(--fg-soft)`;
    const chip = (power, color, cancelled, column, row) => {
      const element = make("span", "il-fade");
      element.append(power === 0 ? "a₁" : rich("a₁q", power === 1 ? "" : sup(String(power))));
      element.style.cssText = `grid-column:${column};grid-row:${row};padding:3px 5px;text-align:center;border:1px solid ${color};border-radius:8px;opacity:${cancelled ? 0.25 : 1};text-decoration:${cancelled ? "line-through" : "none"}`;
      return element;
    };
    const label = (text, row) => { const element = make("span", "", text); element.style.cssText = `grid-column:1;grid-row:${row}`; return element; };
    grid.append(label("Sₙ =", 1));
    for (let p = 0; p < n; p++) grid.append(chip(p, PALETTE.blue, phase >= 2 && p >= 1, p + 2, 1));
    if (phase >= 1) {
      grid.append(label("q·Sₙ =", 2));
      for (let p = 1; p <= n; p++) grid.append(chip(p, PALETTE.amber, phase >= 2 && p <= n - 1, p + 1, 2));
    }
    if (phase >= 3) {
      grid.append(label("Sₙ − q·Sₙ =", 3));
      grid.append(chip(0, "var(--accent)", false, 2, 3));
      const last = chip(n, "var(--accent)", false, n + 2, 3);
      last.prepend("−");
      grid.append(last);
    }
    gridBox.replaceChildren(grid);
    sumCaption.textContent = SUM_CAPTIONS[phase];
    let direct = 0;
    for (let k = 1; k <= n; k++) direct += term(k);
    const formula = q === 1 ? n * a1 : (a1 * (1 - q ** n)) / (1 - q);
    if (phase < 3) { sumResult.replaceChildren(" "); return; }
    sumResult.replaceChildren(q === 1
      ? rich(`q = 1 esetén Sₙ = n·a₁ = ${n}·${a1} = `, make("b", "", formatNumber(formula, 4)))
      : rich(`Sₙ = a₁·(1 − qⁿ)/(1 − q) = ${a1}·(1 − ${paren(q)}`, sup(String(n)), `)/(1 − ${paren(q)}) = `, make("b", "", formatNumber(formula, 4)), `   (összeadva: ${formatNumber(direct, 4)})`));
  }

  function renderChess() {
    const k = state.square;
    squares.forEach((cell, i) => { cell.style.background = i < k ? "var(--accent)" : "var(--input)"; cell.style.border = i === k - 1 ? `2px solid ${PALETTE.pink}` : "1px solid var(--line)"; });
    chessLine.textContent = `Mező sorszáma: ${k}. Ezen a mezőn 2^${k - 1} = ${groupDigits(2n ** BigInt(k - 1))} szem van. Az első ${k} mezőn összesen 2^${k} − 1 = ${groupDigits(2n ** BigInt(k) - 1n)} szem.`;
  }

  render();
  renderChess();
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
