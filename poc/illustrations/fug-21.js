import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const W = 640, H = 320, BASE_Y = 272, X0 = 20, MAX_HEIGHT = 235;
const sub = (text) => make("sub", "", text);
const paren = (n) => (n < 0 ? `(${formatNumber(n)})` : formatNumber(n));
const CAPTIONS = [
  "Minden oszlop az előzőnél ugyanannyival magasabb (vagy alacsonyabb): ez a d különbség. Az Sₙ összeg az összes kocka száma.",
  "Készítsünk egy másolatot a lépcsőről (narancs).",
  "Fordítsuk meg a másolatot fejjel lefelé.",
  "A két lépcső pontosan egymásba illeszkedik: téglalapot kaptunk. Minden oszlopa a₁ + aₙ magas, mert ami az egyik lépcsőből hiányzik, azt a másik pótolja. Két lépcső területe n · (a₁ + aₙ), vagyis Sₙ = n · (a₁ + aₙ) / 2.",
];

export function mount(root) {
  const scope = createScope();
  const state = { a1: 3, d: 2, n: 6, phase: 0 };
  const term = (k) => state.a1 + (k - 1) * state.d;

  root.append(lead("Számtani sorozatban minden tag az előzőnél ugyanannyival nagyobb (vagy kisebb): ez az állandó különbség, a d. Ha a tagokat kockaoszlopokkal rajzoljuk, lépcsőt kapunk. Az összeadást is megúszhatjuk: Gauss ötlete az volt, hogy két lépcsőt összeilleszt."));

  const main = card("Lépcső és összeg");
  const slideA = range({ label: "a₁", min: 1, max: 8, value: state.a1, onInput: (v) => { state.a1 = v; render(); } });
  const slideD = range({ label: "d", min: -2, max: 3, value: state.d, onInput: (v) => { state.d = v; render(); } });
  const slideN = range({ label: "n", min: 1, max: 8, value: state.n, onInput: (v) => { state.n = v; render(); } });
  const termLine = make("div"), sumLine = make("div");
  main.append(controls(slideA.element, slideD.element, slideN.element), make("p", "il-muted", "Negatív d esetén n csak addig nőhet, amíg a tagok nem lesznek negatívak (kockából nem lehet negatív oszlop)."), termLine);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Kockaoszlopokból álló lépcső és a másolata" }, main);
  const gA = svg("g", {}, figure), gB = svg("g", { class: "il-move" }, figure), gLabels = svg("g", { class: "il-fade" }, figure);
  const caption = make("p", "il-message");
  const stepButton = button("Következő lépés", () => { state.phase = Math.min(3, state.phase + 1); render(); });
  const again = button("Újra", () => { state.phase = 0; render(); }, { ghost: true });
  main.append(controls(stepButton, again), caption, sumLine);

  root.append(main, keyIdea("számtani sorozatban aₙ = a₁ + (n − 1) · d, az első n tag összege pedig Sₙ = n · (a₁ + aₙ) / 2: az első és az utolsó tag átlagát szorozzuk a tagok számával."));

  function columns(group, color) {
    const n = state.n, sx = Math.min(44, 600 / (2 * n + 1.5)), sy = MAX_HEIGHT / Math.max(state.a1 + term(n), 1);
    group.replaceChildren();
    for (let k = 1; k <= n; k++) {
      const x = X0 + (k - 1) * sx, height = term(k) * sy;
      svg("rect", { x, y: BASE_Y - height, width: sx - 2, height, style: `fill:${color};fill-opacity:.8` }, group);
      if (sy >= 7) for (let j = 1; j < term(k); j++) svg("line", { x1: x, x2: x + sx - 2, y1: BASE_Y - j * sy, y2: BASE_Y - j * sy, style: "stroke:var(--input);stroke-width:1;opacity:.6" }, group);
    }
    return { sx, sy };
  }

  function render() {
    const { a1, d, phase } = state;
    const nMax = d < 0 ? Math.floor(a1 / -d) + 1 : 8;
    if (state.n > nMax) { state.n = nMax; slideN.set(nMax); }
    const n = state.n, an = term(n), total = a1 + an;
    const { sx, sy } = columns(gA, PALETTE.blue);
    columns(gB, PALETTE.amber);
    const pivotX = X0 + (n * sx) / 2, pivotY = BASE_Y - (total * sy) / 2, shift = (n + 1) * sx;
    gB.style.transformOrigin = `${pivotX}px ${pivotY}px`;
    gB.style.transform = `translate(${phase >= 3 ? 0 : shift}px, 0px) rotate(${phase >= 2 ? 180 : 0}deg)`;
    gB.style.opacity = phase >= 1 ? 1 : 0;

    gLabels.replaceChildren();
    for (let k = 1; k <= n; k++) {
      const x = X0 + (k - 1) * sx + (sx - 2) / 2;
      addText(gA, x, BASE_Y - term(k) * sy + 15, String(term(k)), "fill:#fff;font-size:12px", "middle");
      addText(gLabels, x, BASE_Y + 16, `a${"₀₁₂₃₄₅₆₇₈₉"[k]}`, "fill:var(--dim);font-size:12px", "middle");
    }
    gLabels.style.opacity = 1;
    if (phase >= 3) {
      svg("rect", { x: X0, y: BASE_Y - total * sy, width: n * sx - 2, height: total * sy, style: "fill:none;stroke:var(--fg);stroke-width:2;stroke-dasharray:6 4" }, gLabels);
      addText(gLabels, X0 + (n * sx) / 2, BASE_Y + 34, `n = ${n} oszlop`, "fill:var(--fg);font-size:13px", "middle");
      addText(gLabels, X0 + n * sx + 8, BASE_Y - (total * sy) / 2 + 5, `a₁ + aₙ = ${a1} + ${an} = ${total}`, "fill:var(--fg);font-size:13px");
    }

    let sum = 0;
    for (let k = 1; k <= n; k++) sum += term(k);
    termLine.replaceChildren(equation(rich("a", sub("n")), slot(rich(`a₁ + (n − 1)·d = ${a1} + (${n} − 1)·${paren(d)} = `, make("b", "", String(an))), 40, { align: "left" })));
    sumLine.replaceChildren(equation(rich("S", sub("n")), slot(rich(`n·(a₁ + aₙ)/2 = ${n}·(${a1} + ${an})/2 = `, make("b", "", String((n * total) / 2))), 40, { align: "left" })));
    sumLine.firstChild.style.opacity = phase >= 3 ? 1 : 0.4;
    caption.textContent = CAPTIONS[phase];
    stepButton.disabled = phase >= 3;
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
