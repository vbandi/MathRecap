import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, rich, svg } from "./kit.js";

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).replace("-", "⁻").split("").map((c) => (c === "⁻" ? c : SUPERSCRIPTS[Number(c)])).join("");
const PLOT = { x0: 40, y0: 10, width: 530, height: 270, xMin: -3, xMax: 4, yMax: 16 };
const toX = (x) => PLOT.x0 + ((x - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * PLOT.width;
const toY = (y) => PLOT.y0 + PLOT.height - (y / PLOT.yMax) * PLOT.height;

// Numbers of any size in a readable Hungarian format.
function show(value) {
  const abs = Math.abs(value);
  if (abs >= 1e6 || (abs > 0 && abs < 1e-4)) return value.toExponential(3).replace(".", ",").replace("e+", " · 10^").replace("e-", " · 10^−");
  return formatNumber(value, abs >= 100 ? 2 : 4);
}

function node(text, color) {
  const box = make("span", "", text);
  box.style.cssText = `display:inline-block;padding:5px 10px;border:2px solid ${color};border-radius:10px;font:15px var(--font-mono);color:var(--fg);white-space:nowrap;`;
  return box;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az a^(p/q) azt jelenti, hogy az a-nak vesszük a q-adik gyökét, és a kapott számot p-edik hatványra emeljük. A tört kitevő tehát egy gyökvonás és egy hatványozás egyszerre, és a sorrendjük nem számít."));

  const state = { a: 8, p: 2, q: 3 };
  const main = card("Gyök és hatvány egyszerre");
  const aSlider = range({ label: "Alap a", min: 1, max: 64, value: state.a, format: String, onInput: (v) => { state.a = v; render(); } });
  const pSlider = range({ label: "Számláló p", min: -6, max: 6, value: state.p, format: (v) => String(v).replace("-", "−"), onInput: (v) => { state.p = v; render(); } });
  const qSlider = range({ label: "Nevező q", min: 1, max: 5, value: state.q, format: String, onInput: (v) => { state.q = v; render(); } });
  const definition = make("div", "il-formula");
  definition.style.fontSize = "20px";
  const routeA = make("div"), routeB = make("div");
  [routeA, routeB].forEach((route) => { route.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:10px 0;"; });
  const message = make("p", "il-message");
  main.append(controls(aSlider.element, pSlider.element, qSlider.element), definition, make("p", "il-muted", "1. út: előbb gyököt vonunk, aztán hatványozunk"), routeA, make("p", "il-muted", "2. út: előbb hatványozunk, aztán gyököt vonunk"), routeB, message);

  const graph = card("Az y = 2ˣ grafikon: törtkitevős pontok az egész pontok között");
  const graphState = { q: 2, k: 3 };
  const denominatorSlider = range({ label: "Beosztás (q)", min: 1, max: 6, value: graphState.q, format: String, onInput: (v) => { graphState.q = v; graphState.k = Math.round((graphState.k * v) / graphState.previousQ); graphState.previousQ = v; clampK(); renderGraph(); } });
  graphState.previousQ = graphState.q;
  const xSlider = range({ label: "Kitevő", min: -6, max: 12, value: graphState.k, format: (v) => `${v}/${graphState.q}`, onInput: (v) => { graphState.k = v; renderGraph(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img" }, graph);
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.y0, y2: PLOT.y0 + PLOT.height, class: x ? "grid" : "axis" }, figure);
    svg("text", { x: toX(x), y: PLOT.y0 + PLOT.height + 16, "text-anchor": "middle", text: formatNumber(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = 0; y <= PLOT.yMax; y += 4) {
    svg("line", { x1: PLOT.x0, x2: PLOT.x0 + PLOT.width, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    svg("text", { x: PLOT.x0 - 6, y: toY(y) + 4, "text-anchor": "end", text: String(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  let curvePath = "";
  for (let i = 0; i <= 350; i++) { const x = PLOT.xMin + (i / 350) * (PLOT.xMax - PLOT.xMin); curvePath += `${i ? "L" : "M"} ${toX(x).toFixed(1)} ${toY(2 ** x).toFixed(1)} `; }
  svg("path", { d: curvePath, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:2.5` }, figure);
  const dotLayer = svg("g", {}, figure);
  const graphLine = make("div", "il-formula start");
  graphLine.style.fontSize = "18px";
  const graphMessage = make("p", "il-message");
  graph.append(controls(denominatorSlider.element, xSlider.element), figure, graphLine, graphMessage);
  root.append(main, graph, keyIdea("a^(p/q) = (a q-adik gyöke)ᵖ = (aᵖ) q-adik gyöke, ha a > 0: mindegy, hogy előbb gyököt vonunk vagy hatványozunk. A törtkitevős hatványok az egész kitevős hatványok közé illeszkednek a grafikonon, és minden hatványazonosság továbbra is érvényes."));

  function clampK() {
    xSlider.input.min = -3 * graphState.q; xSlider.input.max = 4 * graphState.q;
    graphState.k = Math.max(-3 * graphState.q, Math.min(4 * graphState.q, graphState.k));
  }

  function render() {
    const { a, p, q } = state;
    aSlider.set(a); pSlider.set(p); qSlider.set(q);
    definition.replaceChildren(rich(`${a}`, make("sup", "", `${String(p).replace("-", "−")}/${q}`), " = (", make("sup", "", String(q)), `√${a})`, make("sup", "", String(p).replace("-", "−")), ` = ${show(a ** (p / q))}`));
    const root1 = a ** (1 / q), power1 = root1 ** p, power2 = a ** p, root2 = power2 ** (1 / q);
    const arrow = () => make("span", "il-muted", "→");
    const rootLabel = q === 1 ? "gyök (q = 1)" : `${q}. gyök`;
    routeA.replaceChildren(node(String(a), PALETTE.blue), arrow(), node(`${rootLabel}: ${show(root1)}`, PALETTE.violet), arrow(), node(`${p}. hatvány: ${show(power1)}`, PALETTE.green));
    routeB.replaceChildren(node(String(a), PALETTE.blue), arrow(), node(`${p}. hatvány: ${show(power2)}`, PALETTE.violet), arrow(), node(`${rootLabel}: ${show(root2)}`, PALETTE.green));
    const same = Math.abs(power1 - root2) <= 1e-9 * Math.max(1, Math.abs(power1));
    message.className = same ? "il-message good" : "il-message warn";
    message.textContent = `Mindkét úton ugyanaz jön ki: ${show(a ** (p / q))}.${p < 0 ? " A negatív kitevő a reciprokot jelenti: előbb a pozitív kitevős hatvány, aztán 1 per annyi." : ""}${Number.isInteger(Math.round(root1)) && Math.abs(root1 - Math.round(root1)) < 1e-9 ? ` A ${a} pontos ${q}. hatvány (${Math.round(root1)}${sup(q)}), ezért a gyök egész.` : ""}`;
  }

  function renderGraph() {
    const { q, k } = graphState;
    denominatorSlider.set(q);
    xSlider.set(k);
    clampK();
    xSlider.set(graphState.k);
    dotLayer.replaceChildren();
    for (let j = -3 * q; j <= 4 * q; j++) {
      const x = j / q, whole = j % q === 0;
      svg("circle", { cx: toX(x), cy: toY(2 ** x), r: whole ? 5 : 3.5, style: `fill:${whole ? PALETTE.blue : PALETTE.amber}` }, dotLayer);
    }
    const x = graphState.k / q;
    svg("circle", { cx: toX(x), cy: toY(2 ** x), r: 8, fill: "none", style: `stroke:${PALETTE.red};stroke-width:3` }, dotLayer);
    svg("line", { x1: toX(x), x2: toX(x), y1: toY(2 ** x), y2: toY(0), style: `stroke:${PALETTE.red};stroke-dasharray:4 3` }, dotLayer);
    const kText = String(graphState.k).replace("-", "−");
    graphLine.textContent = q === 1 ? `2${sup(graphState.k)} = ${show(2 ** x)}` : `2^(${kText}/${q}) = ${q === 2 ? "" : sup(q)}√(2${sup(graphState.k)}) ${Math.abs(2 ** x - Math.round(2 ** x * 1e4) / 1e4) < 1e-9 ? "=" : "≈"} ${show(2 ** x)}`;
    graphMessage.className = "il-message";
    graphMessage.textContent = `A kék pontok egész kitevőhöz, a narancsok ${q}-ad kitevőkhöz tartoznak. Ahogy q nő, a pontok egyre sűrűbben kitöltik a görbét; a kijelölt pont kitevője ${kText}/${q} = ${formatNumber(x, 3)}.`;
  }

  render();
  renderGraph();
  return () => scope.clearAll();
}
