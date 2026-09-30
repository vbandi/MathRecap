import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const CHART = { width: 640, height: 300, left: 74, right: 20, top: 16, bottom: 36 };
const sup = (text) => make("sup", "", text);
const SCENARIOS = [
  { id: "bacteria", name: "Baktériumok", tMax: 12, tUnit: "óra", yName: "N (db)", dataTimes: [0, 3, 6, 9],
    initial: { label: "kezdeti szám (db)", min: 100, max: 1000, step: 100, value: 200 },
    rate: { label: "duplázódási idő (óra)", min: 1, max: 6, step: 0.5, value: 2 },
    model: (p0, r, t) => p0 * 2 ** (t / r),
    marker: (r, tMax) => Array.from({ length: 8 }, (_, k) => ({ t: (k + 1) * r, label: `×${2 ** (k + 1)}` })).filter((m) => m.t <= tMax),
    rule: (p0, r) => rich(`N(t) = ${groupDigits(p0)} · 2`, sup(`t/${formatNumber(r)}`)),
    story: "A baktériumok egyenletes időközönként megduplázódnak. Minden duplázódási idő alatt a szám kétszeresére nő, vagyis 2-vel szorzódik." },
  { id: "decay", name: "Radioaktív bomlás", tMax: 24, tUnit: "nap", yName: "m (mg)", dataTimes: [0, 6, 12, 18],
    initial: { label: "kezdeti tömeg (mg)", min: 10, max: 200, step: 10, value: 80 },
    rate: { label: "felezési idő (nap)", min: 1, max: 6, step: 0.5, value: 3 },
    model: (p0, r, t) => p0 * 0.5 ** (t / r),
    marker: (r, tMax) => Array.from({ length: 8 }, (_, k) => ({ t: (k + 1) * r, label: k === 0 ? "½" : `1/${2 ** (k + 1)}` })).filter((m) => m.t <= tMax),
    rule: (p0, r) => rich(`m(t) = ${groupDigits(p0)} · (½)`, sup(`t/${formatNumber(r)}`)),
    story: "A radioaktív anyag egyenletesen fogy: minden felezési idő alatt az éppen meglévő mennyiség fele marad. Ez 0,5-tel való szorzás, sosem lesz pontosan nulla." },
  { id: "interest", name: "Kamatos kamat", tMax: 30, tUnit: "év", yName: "K (Ft)", dataTimes: [0, 8, 16, 24],
    initial: { label: "betett összeg (Ft)", min: 100000, max: 1000000, step: 100000, value: 200000 },
    rate: { label: "éves kamat (%)", min: 1, max: 12, step: 0.5, value: 5 },
    model: (p0, r, t) => p0 * (1 + r / 100) ** t,
    marker: (r, tMax) => { const t = Math.log(2) / Math.log(1 + r / 100); return t <= tMax ? [{ t, label: "×2" }] : []; },
    rule: (p0, r) => rich(`K(t) = ${groupDigits(p0)} · ${formatNumber(1 + r / 100, 3)}`, sup("t")),
    story: "A kamatos kamat azt jelenti, hogy a kamat is kamatozik: minden évben az egész összeg nő (1 + kamat) szorosára. Például 5% kamat esetén ez évente 1,05-tel való szorzás." },
];

function niceStep(rough) {
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough);
}

export function mount(root) {
  const scope = createScope();
  const state = { index: 0, p0: 0, r: 0, probe: 6, target: null };
  const scenario = () => SCENARIOS[state.index];
  const value = (t) => scenario().model(state.p0, state.r, t);

  root.append(lead("Sok folyamat úgy változik, hogy egyenlő idő alatt mindig ugyanannyiszorosára nő vagy csökken: a baktériumok szaporodása, egy radioaktív anyag bomlása, a bankba tett pénz. Ezeket az y = kezdeti érték · aᵗ alakú exponenciális függvények írják le."));

  const main = card("Válassz folyamatot, és állítsd be a paramétereit");
  const scenarioBar = make("div", "il-controls");
  const sliderBar = make("div", "il-controls");
  const storyLine = make("p", "il-muted");
  const ruleLine = make("div", "il-formula start");
  main.append(scenarioBar, storyLine, sliderBar, ruleLine);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${CHART.width} ${CHART.height}`, role: "img", "aria-label": "A folyamat grafikonja az idő függvényében" }, main);
  const probeBar = make("div", "il-controls");
  const probeMessage = make("p", "il-message");
  main.append(probeBar, probeMessage);

  const challenge = card("Kihívás: illeszd a görbét az adatokra");
  const challengeMessage = make("p", "il-message");
  challenge.append(make("p", "", "Mérési adatokat (narancs pontok) kaptál. Állítsd be a két csúszkát úgy, hogy a zöld görbe mindegyik ponton átmenjen."), controls(button("Új feladat", newChallenge), button("Kilépés", () => { state.target = null; render(); }, { ghost: true })), challengeMessage);

  root.append(main, challenge, keyIdea("az exponenciális folyamat mindig két számmal írható le: a kezdeti értékkel és azzal, hogy mennyi idő alatt szorzódik meg egy adott számmal (duplázódási idő, felezési idő, vagy évenkénti szorzó). Ha adatokra illesztesz görbét, e két számot keresed."));

  SCENARIOS.forEach((item, index) => scenarioBar.append(toggle(item.name, index === state.index, () => { state.index = index; state.target = null; setScenario(); })));

  function setScenario() {
    const s = scenario();
    [...scenarioBar.children].forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.index)));
    state.p0 = s.initial.value; state.r = s.rate.value; state.probe = Math.round(s.tMax / 2);
    storyLine.textContent = s.story;
    sliderBar.replaceChildren(
      range({ ...s.initial, format: groupDigits, onInput: (v) => { state.p0 = v; render(); } }).element,
      range({ ...s.rate, format: (v) => formatNumber(v), onInput: (v) => { state.r = v; render(); } }).element);
    probeBar.replaceChildren(range({ label: `${s.tUnit} (leolvasás)`, min: 0, max: s.tMax, step: 1, value: state.probe, format: (v) => String(v), onInput: (v) => { state.probe = v; render(); } }).element);
    render();
  }

  function newChallenge() {
    const s = scenario();
    const pick = (spec, avoid) => { let v; do v = spec.min + Math.floor(Math.random() * Math.round((spec.max - spec.min) / spec.step + 1)) * spec.step; while (v === avoid); return v; };
    state.target = { p0: pick(s.initial, state.p0), r: pick(s.rate, state.r) };
    render();
  }

  function render() {
    const s = scenario(), { width, height, left, right, top, bottom } = CHART;
    const data = state.target ? s.dataTimes.map((t) => ({ t, y: s.model(state.target.p0, state.target.r, t) })) : [];
    const peak = Math.max(value(s.tMax), value(0), ...data.map((d) => d.y));
    const step = niceStep(peak / 5), yTop = Math.ceil((peak * 1.05) / step) * step;
    const toX = (t) => left + (t / s.tMax) * (width - left - right), toY = (y) => top + (1 - y / yTop) * (height - top - bottom);
    figure.replaceChildren();
    for (let y = 0; y <= yTop + 1e-9; y += step) {
      svg("line", { x1: left, x2: width - right, y1: toY(y), y2: toY(y), class: y === 0 ? "axis" : "grid" }, figure);
      addText(figure, left - 8, toY(y) + 4, groupDigits(y), "fill:var(--dim);font-size:11px;font-weight:400", "end");
    }
    const xStep = s.tMax / 6;
    for (let t = 0; t <= s.tMax + 1e-9; t += xStep) addText(figure, toX(t), height - bottom + 16, String(Math.round(t)), "fill:var(--dim);font-size:11px;font-weight:400", "middle");
    addText(figure, width - right, height - 6, s.tUnit, "fill:var(--dim);font-size:12px;font-weight:400", "end");
    addText(figure, left + 4, top + 10, s.yName, "fill:var(--dim);font-size:12px;font-weight:400");
    const points = Array.from({ length: 121 }, (_, i) => [toX((s.tMax * i) / 120), toY(value((s.tMax * i) / 120))]);
    svg("path", { d: points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "), fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, figure);
    if (!state.target) s.marker(state.r, s.tMax).forEach((m) => {
      svg("line", { x1: toX(m.t), x2: toX(m.t), y1: toY(0), y2: toY(value(m.t)), style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, figure);
      svg("circle", { cx: toX(m.t), cy: toY(value(m.t)), r: 5, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, figure);
      addText(figure, toX(m.t) + 7, toY(value(m.t)) - 8, m.label, `fill:${PALETTE.blue};font-size:12px`);
    });
    data.forEach((d) => svg("circle", { cx: toX(d.t), cy: toY(d.y), r: 8, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:2` }, figure));
    svg("circle", { cx: toX(state.probe), cy: toY(value(state.probe)), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, figure);

    ruleLine.replaceChildren(s.rule(state.p0, state.r));
    const tail = s.id === "interest" ? ` Kb. ${formatNumber(Math.log(2) / Math.log(1 + state.r / 100), 1)} év alatt megduplázódik.` : s.id === "decay" ? " A kék pontok a felezési idők végén: ½, ¼, ⅛, …" : " A kék pontok a duplázódási idők végén: ×2, ×4, ×8, …";
    probeMessage.className = "il-message";
    probeMessage.textContent = `${state.probe} ${s.tUnit} után: ${value(state.probe) < 100 ? formatNumber(value(state.probe), 2) : groupDigits(value(state.probe))}${s.id === "interest" ? " Ft" : s.id === "decay" ? " mg" : " db"}.${state.target ? "" : tail}`;
    challenge.style.display = "";
    if (!state.target) { challengeMessage.className = "il-message"; challengeMessage.textContent = "Kattints az Új feladat gombra!"; return; }
    const errors = data.map((d) => (value(d.t) - d.y) / d.y);
    const solved = errors.every((e) => Math.abs(e) <= 0.02);
    challengeMessage.className = `il-message ${solved ? "good" : ""}`;
    challengeMessage.textContent = solved ? `Jó az illesztés! A paraméterek: kezdeti érték ${groupDigits(state.target.p0)}, ${s.rate.label} = ${formatNumber(state.target.r)}.`
      : Math.abs(errors[0]) > 0.02 ? "Nézd az első pontot (t = 0): ott a görbe értéke a kezdeti érték. Az első csúszkával ezt állítsd be."
        : `A kezdőpont stimmel. A görbe a végén a pontok ${errors.at(-1) > 0 ? "fölött" : "alatt"} halad: a második csúszkával változtasd a folyamat gyorsaságát.`;
  }

  setScenario();
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
