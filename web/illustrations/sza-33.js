import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, stepper, svg, toggle } from "./kit.js";

const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).split("").map((d) => SUBSCRIPTS[Number(d)]).join("");
const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((d) => SUPERSCRIPTS[Number(d)]).join("");
const PLOT = { x0: 40, y0: 10, width: 530, height: 270, xMin: -1, xMax: 7, yMax: 130 };
const toX = (x) => PLOT.x0 + ((x - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * PLOT.width;
const toY = (y) => PLOT.y0 + PLOT.height - (Math.min(y, PLOT.yMax * 1.2) / PLOT.yMax) * PLOT.height;
const logBase = (base, value) => Math.log(value) / Math.log(base);

export function mount(root) {
  const scope = createScope();
  root.append(lead("A logaritmus egy kérdésre válaszol: hányadik hatványra kell emelni az alapot, hogy egy adott számot kapjunk? Például log₂ 8 = 3, mert 2 · 2 · 2 = 8, vagyis háromszor kell 2-vel szorozni 1-ből indulva."));

  const state = { base: 2, target: 32, shown: 99 };
  const main = card("Hányszor kell szorozni?");
  const baseToggles = [2, 3, 5].map((b) => toggle(`alap: ${b}`, b === state.base, () => { state.base = b; state.shown = 99; render(); }));
  const targetSlider = range({ label: "Cél (N)", min: 1, max: 128, value: state.target, format: String, onInput: (v) => { state.target = v; state.shown = 99; render(); } });
  const bars = make("div");
  const stepButton = button("Szorozz még egyszer", () => { state.shown = Math.min(state.shown === 99 ? 1 : state.shown + 1, rowCount()); render(); });
  const replayButton = button("Újra, lépésenként", () => { state.shown = 1; render(); }, { ghost: true });
  const message = make("p", "il-message");
  main.append(controls(...baseToggles, targetSlider.element), bars, controls(stepButton, replayButton), message);

  const graph = card("Ugyanez a grafikonon: olvasd visszafelé");
  graph.append(make("p", "", "Az y = bˣ görbén az x a kitevő. A logaritmus az, amikor a magasságból (y) visszaolvasod a kitevőt (x)."));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img" }, graph);
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.y0, y2: PLOT.y0 + PLOT.height, class: x ? "grid" : "axis" }, figure);
    svg("text", { x: toX(x), y: PLOT.y0 + PLOT.height + 16, "text-anchor": "middle", text: formatNumber(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = 0; y <= 120; y += 20) {
    svg("line", { x1: PLOT.x0, x2: PLOT.x0 + PLOT.width, y1: toY(y), y2: toY(y), class: "grid" }, figure);
    svg("text", { x: PLOT.x0 - 6, y: toY(y) + 4, "text-anchor": "end", text: String(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const curve = svg("path", { fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3` }, figure);
  const readLayer = svg("g", {}, figure);
  const graphLine = make("div", "il-formula start");
  graphLine.style.fontSize = "20px";
  graph.append(graphLine);

  // --- Product rule as chains of factors ---
  const product = card("log(a · b) = log a + log b");
  const chainState = { m: 3, n: 2 };
  const mControl = stepper({ label: "a = 2^m, m", min: 0, max: 5, value: chainState.m, onChange: (v) => { chainState.m = v; renderChain(); } });
  const nControl = stepper({ label: "b = 2^n, n", min: 0, max: 5, value: chainState.n, onChange: (v) => { chainState.n = v; renderChain(); } });
  const chainFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 90", role: "img" }, product);
  const chainLayer = svg("g", {}, chainFigure);
  const chainLines = [make("div", "il-formula start"), make("div", "il-formula start")];
  product.append(controls(mControl.element, nControl.element), chainFigure, ...chainLines);

  // --- Change of base ---
  const change = card("Áttérés másik alapra");
  const changeState = { base: 3, value: 50 };
  const changeBase = stepper({ label: "Alap b", min: 2, max: 9, value: 3, onChange: (v) => { changeState.base = v; renderChange(); } });
  const changeValue = range({ label: "Szám (a)", min: 2, max: 200, value: 50, format: String, onInput: (v) => { changeState.value = v; renderChange(); } });
  const changeLines = [make("div", "il-formula start"), make("div", "il-formula start"), make("div", "il-formula start")];
  change.append(controls(changeBase.element, changeValue.element), ...changeLines, make("p", "il-muted", "Így számolják ki a zsebszámológépen is: az lg (10-es alapú) vagy az ln (e alapú) gombjával."));
  root.append(main, graph, product, change, keyIdea("log_b a az a kitevő, amelyre b^kitevő = a. A szorzás kitevők összeadására vezet (log(a · b) = log a + log b), ezért a logaritmus a szorzásból összeadást csinál. Alapváltás: log_b a = lg a : lg b."));

  function rowCount() {
    let k = 0;
    while (state.base ** k < state.target) k += 1;
    return k + 1;
  }

  function render() {
    const { base, target } = state;
    baseToggles.forEach((t, i) => t.setAttribute("aria-pressed", String([2, 3, 5][i] === base)));
    targetSlider.set(target);
    const count = rowCount(), exponent = count - 1, shown = Math.min(state.shown, count);
    const maxValue = base ** exponent;
    bars.replaceChildren();
    for (let i = 0; i < shown; i++) {
      const row = make("div", "il-bar");
      const label = make("span", "", i === 0 ? "kezdet" : `${i}. szorzás`);
      label.style.flexBasis = "120px";
      const track = make("div", "track");
      const fill = make("div", "fill");
      fill.style.width = `${(base ** i / maxValue) * 100}%`;
      fill.style.background = base ** i === target ? PALETTE.green : base ** i > target ? PALETTE.amber : PALETTE.blue;
      const marker = make("div");
      marker.style.cssText = `position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--fg);left:${(target / maxValue) * 100}%;`;
      track.append(fill, marker);
      const value = make("b", "", `${base}${sup(i)} = ${base ** i}`);
      value.style.minWidth = "9ch";
      row.append(label, track, value);
      bars.append(row);
    }
    stepButton.disabled = shown >= count;
    const done = shown >= count;
    const exact = base ** exponent === target;
    message.className = done && exact ? "il-message good" : "il-message";
    message.textContent = !done ? `A fehér vonal a cél (${target}). Még nem értük el: szorozz tovább ${base}-mal!`
      : exact ? `${base}${sup(exponent)} = ${target}, tehát log${sub(base)} ${target} = ${exponent}: ${exponent === 0 ? "egyszer sem kell szorozni, hiszen a kezdőérték már 1" : `${exponent}-szor kellett ${base}-mal szorozni`}.`
        : `${base}${sup(exponent - 1)} = ${base ** (exponent - 1)} még kevés, ${base}${sup(exponent)} = ${base ** exponent} már túl sok: log${sub(base)} ${target} ${exponent - 1} és ${exponent} között van, ≈ ${formatNumber(logBase(base, target), 4)}.`;

    let d = "";
    for (let i = 0; i <= 300; i++) { const x = PLOT.xMin + (i / 300) * (PLOT.xMax - PLOT.xMin); d += `${i ? "L" : "M"} ${toX(x).toFixed(1)} ${toY(base ** x).toFixed(1)} `; }
    curve.setAttribute("d", d);
    readLayer.replaceChildren();
    const x = logBase(base, target);
    svg("line", { x1: PLOT.x0, x2: toX(x), y1: toY(target), y2: toY(target), style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:6 4` }, readLayer);
    svg("line", { x1: toX(x), x2: toX(x), y1: toY(target), y2: toY(0), style: `stroke:${PALETTE.red};stroke-width:2;stroke-dasharray:6 4` }, readLayer);
    svg("circle", { cx: toX(x), cy: toY(target), r: 7, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2` }, readLayer);
    svg("text", { x: toX(x) + 10, y: toY(0) - 8, text: `x = ${formatNumber(x, 3)}`, style: `fill:${PALETTE.red};font-weight:700` }, readLayer);
    svg("text", { x: PLOT.x0 + 8, y: toY(target) - 6, text: `y = ${target}`, style: `fill:${PALETTE.amber};font-weight:700` }, readLayer);
    graphLine.textContent = `${base}${x === Math.round(x) ? sup(Math.round(x)) : "^" + formatNumber(x, 3)} = ${target}  →  log${sub(base)} ${target} ${x === Math.round(x) ? "=" : "≈"} ${formatNumber(x, 4)}`;
  }

  function renderChain() {
    const { m, n } = chainState;
    chainLayer.replaceChildren();
    const chip = (index, color) => {
      const x = 30 + index * 40;
      svg("circle", { cx: x, cy: 45, r: 16, style: `fill:${color}` }, chainLayer);
      svg("text", { x, y: 50, "text-anchor": "middle", text: "2", style: "fill:#fff;font-weight:700" }, chainLayer);
    };
    for (let i = 0; i < m; i++) chip(i, PALETTE.blue);
    for (let i = 0; i < n; i++) chip(m + i, PALETTE.green);
    if (!m && !n) svg("text", { x: 30, y: 50, text: "(üres lánc: 1)", style: "font-size:13px" }, chainLayer);
    const a = 2 ** m, b = 2 ** n;
    chainLines[0].textContent = `a = ${a}, b = ${b}, a · b = ${a * b}`;
    chainLines[1].textContent = `log₂ ${a} + log₂ ${b} = ${m} + ${n} = ${m + n} = log₂ ${a * b}`;
  }

  function renderChange() {
    const { base, value } = changeState;
    const result = logBase(base, value);
    changeLines[0].textContent = `log${sub(base)} ${value} = lg ${value} : lg ${base} = ${formatNumber(Math.log10(value), 4)} : ${formatNumber(Math.log10(base), 4)} ≈ ${formatNumber(result, 4)}`;
    changeLines[1].textContent = `log${sub(base)} ${value} = ln ${value} : ln ${base} = ${formatNumber(Math.log(value), 4)} : ${formatNumber(Math.log(base), 4)} ≈ ${formatNumber(result, 4)}`;
    changeLines[2].textContent = `Ellenőrzés: ${base}^${formatNumber(result, 4)} ≈ ${formatNumber(base ** result, 2)} ≈ ${value}`;
  }

  render();
  renderChain();
  renderChange();
  return () => scope.clearAll();
}
