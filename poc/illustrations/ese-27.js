import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, stepper, svg, toggle } from "./kit.js";

const W = 720;
const COLOR = { red: PALETTE.red, blue: PALETTE.blue };
const NAME = { red: "piros", blue: "kék" };
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function frac(top, bottom) {
  const element = make("span", "il-frac");
  const t = make("span"), b = make("span");
  t.append(top); b.append(bottom);
  element.append(t, b);
  return element;
}
function binomNode(n, k) {
  const wrapper = make("span");
  wrapper.style.whiteSpace = "nowrap";
  const inner = make("span", "il-frac");
  inner.style.margin = "0 2px";
  const top = make("span", "", String(n)), bottom = make("span", "", String(k));
  top.style.borderBottom = "none";
  inner.append(top, bottom);
  wrapper.append("(", inner, ")");
  return wrapper;
}
const sup = (text) => { const e = make("sup", "", String(text)); return e; };
const binom = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

export function mount(root) {
  const scope = createScope();

  root.append(lead("Ha az urnából egymás után több golyót húzunk, nagyon számít, visszatesszük-e a kihúzottat. Visszatevéssel minden húzásnál ugyanaz az urna, ezért az esélyek nem változnak. Visszatevés nélkül a kihúzott golyó kint marad, így a következő húzásnál megváltozik az esély."));

  // ---------------- Card 1: two draws ----------------
  const counts = { red: 3, blue: 2 };
  let withReplacement = true, available = [], drawn = [], busy = false, tallyTotal = 0;
  const tally = { RR: 0, RB: 0, BR: 0, BB: 0 };
  const bag = () => [...Array(counts.red).fill("red"), ...Array(counts.blue).fill("blue")];
  const code = (color) => (color === "red" ? "R" : "B");

  const draw = card("Két golyót húzunk");
  const modeControls = controls();
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 170`, role: "img", "aria-label": "Az urna és a kihúzott golyók" }, draw);
  const jarLayer = svg("g", {}, figure), trayLayer = svg("g", {}, figure);
  const nextLine = make("div", "il-formula start");
  nextLine.style.minHeight = "3.2em";
  const drawButton = button("Húzás", drawOne);
  draw.append(modeControls, controls(
    stepper({ label: "piros", min: 1, max: 6, value: counts.red, onChange: (v) => { counts.red = v; setMode(withReplacement); } }).element,
    stepper({ label: "kék", min: 1, max: 6, value: counts.blue, onChange: (v) => { counts.blue = v; setMode(withReplacement); } }).element), figure,
    controls(drawButton, button("Új próba", () => { if (!busy) renderJar(); }, { ghost: true })), nextLine);
  let marbleNodes = [];

  function renderModes() {
    modeControls.replaceChildren(toggle("Visszatevéses", withReplacement, () => setMode(true)), toggle("Visszatevés nélküli", !withReplacement, () => setMode(false)));
  }

  function renderJar() {
    jarLayer.replaceChildren(); trayLayer.replaceChildren();
    scope.clearAll(); busy = false;
    svg("path", { d: "M 14 14 V 70 Q 14 84 40 84 H 680 Q 706 84 706 70 V 14", fill: "none", style: "stroke:var(--line-strong);stroke-width:2" }, jarLayer);
    marbleNodes = bag().map((color, i) => svg("circle", { cx: 44 + i * 40, cy: 58, r: 15, style: `fill:${COLOR[color]};transition:transform .3s, opacity .3s` }, jarLayer));
    available = bag().map((_, i) => i); drawn = [];
    [0, 1].forEach((i) => {
      svg("circle", { cx: 120 + i * 70, cy: 132, r: 18, style: "fill:none;stroke:var(--line-strong);stroke-width:2;stroke-dasharray:4 4" }, trayLayer);
    });
    svg("text", { x: 20, y: 137, text: "Kihúzott:", style: "font-weight:700" }, trayLayer);
    drawButton.disabled = false;
    updateNext();
  }

  function updateNext() {
    const all = bag(), red = available.filter((i) => all[i] === "red").length, blue = available.length - red;
    nextLine.replaceChildren();
    if (drawn.length === 2) { nextLine.append(`Eredmény: ${drawn.map((c) => NAME[c]).join(", ")}`); return; }
    nextLine.append(`${drawn.length + 1}. húzás: P(piros) = ${red}/${available.length} = `, slot(formatNumber(red / available.length), 6, { align: "left" }),
      make("br"), `          P(kék) = ${blue}/${available.length} = `, slot(formatNumber(blue / available.length), 6, { align: "left" }));
  }

  function drawOne() {
    if (busy || drawn.length >= 2 || !available.length) return;
    busy = true;
    const all = bag(), index = pick(available), color = all[index], node = marbleNodes[index];
    node.style.transform = "translateY(-24px)";
    scope.timeout(() => {
      svg("circle", { cx: 120 + drawn.length * 70, cy: 132, r: 15, style: `fill:${COLOR[color]}` }, trayLayer);
      drawn.push(color);
      node.style.transform = "";
      if (!withReplacement) { node.style.opacity = "0.15"; available = available.filter((i) => i !== index); }
      scope.timeout(() => {
        if (drawn.length === 2) { tally[code(drawn[0]) + code(drawn[1])] += 1; tallyTotal += 1; drawButton.disabled = true; renderTable(); }
        updateNext(); busy = false;
      }, 300);
    }, 450);
  }

  // ---------------- Card 2: theory and experiment ----------------
  const experiment = card("Az elmélet és a kísérlet");
  const tallyInfo = make("span", "il-muted");
  const table = make("table", "il-table");
  const bars = make("div");
  experiment.append(controls(button("1000 próba egyszerre", () => simulate(1000)), button("Nullázás", () => { tallyTotal = 0; Object.keys(tally).forEach((k) => { tally[k] = 0; }); renderTable(); }, { ghost: true }), tallyInfo), table, bars);
  const ROWS = [["RR", "piros, piros"], ["RB", "piros, kék"], ["BR", "kék, piros"], ["BB", "kék, kék"]];

  function theoryOf(pattern, replacement) {
    const r = counts.red, bl = counts.blue, all = r + bl;
    const first = pattern[0] === "R" ? r : bl, secondPool = pattern[1] === "R" ? r : bl;
    if (replacement) return { num: first * secondPool, den: all * all };
    return { num: first * (pattern[0] === pattern[1] ? secondPool - 1 : secondPool), den: all * (all - 1) };
  }
  function simulate(times) {
    for (let t = 0; t < times; t++) {
      const pool = bag(), first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const second = withReplacement ? pick(bag()) : pick(pool);
      tally[code(first) + code(second)] += 1; tallyTotal += 1;
    }
    renderTable();
  }
  function renderTable() {
    const head = make("tr");
    head.append(make("th", "", "kihúzott"), make("th", "", "visszatevéssel"), make("th", "", "visszatevés nélkül"), make("th", "", "kísérlet"));
    table.replaceChildren(head, ...ROWS.map(([pattern, name]) => {
      const tr = make("tr"), a = theoryOf(pattern, true), b = theoryOf(pattern, false);
      const cell = (t, on) => { const td = make("td", "", t); td.style.opacity = on ? "1" : "0.45"; td.style.width = "auto"; return td; };
      tr.append(make("th", "", name), cell(`${a.num}/${a.den} = ${formatNumber(a.num / a.den)}`, withReplacement), cell(`${b.num}/${b.den} = ${formatNumber(b.num / b.den)}`, !withReplacement),
        cell(tallyTotal ? `${formatNumber((tally[pattern] / tallyTotal) * 100, 1)} %` : "–", true));
      return tr;
    }));
    tallyInfo.textContent = tallyTotal ? `${tallyTotal} próba, ${withReplacement ? "visszatevéses" : "visszatevés nélküli"} módban` : "";
    bars.replaceChildren(...ROWS.map(([pattern, name]) => {
      const { num, den } = theoryOf(pattern, withReplacement), observed = tallyTotal ? tally[pattern] / tallyTotal : 0;
      const row = make("div", "il-bar"), track = make("div", "track"), fill = make("div", "fill"), marker = make("div");
      fill.style.background = PALETTE.blue; fill.style.width = `${observed * 100}%`;
      marker.style.cssText = `position:absolute;top:-4px;bottom:-4px;width:3px;left:calc(${(num / den) * 100}% - 1px);background:${PALETTE.amber}`;
      track.append(fill, marker);
      const label = make("span", "", name); label.style.flexBasis = "110px";
      row.append(label, track, make("b", "", tallyTotal ? formatNumber(observed, 2) : ""));
      return row;
    }));
    bars.append(make("p", "il-muted", "A kék sáv a kísérlet relatív gyakorisága, a narancs jel az elméleti valószínűség."));
  }

  function setMode(value) {
    withReplacement = value;
    tallyTotal = 0; Object.keys(tally).forEach((k) => { tally[k] = 0; });
    renderModes(); renderJar(); renderTable();
  }

  // ---------------- Card 3: general case ----------------
  const general = card("Általános eset: n golyót húzunk N-ből, ebből K jó");
  let total = 10, good = 4, drawCount = 3, wanted = 1, replacement = false, hits = Array(9).fill(0), samples = 0;
  const pmf = (x) => (replacement
    ? binom(drawCount, x) * (good / total) ** x * (1 - good / total) ** (drawCount - x)
    : binom(good, x) * binom(total - good, drawCount - x) / binom(total, drawCount));
  const gModes = controls();
  const sTotal = range({ label: "Összes golyó (N):", min: 4, max: 20, value: total, format: String, onInput: (v) => { total = v; resetSamples(); renderGeneral(); } });
  const sGood = range({ label: "Ebből jó (K):", min: 0, max: 20, value: good, format: String, onInput: (v) => { good = v; resetSamples(); renderGeneral(); } });
  const sDraw = range({ label: "Húzunk (n):", min: 1, max: 8, value: drawCount, format: String, onInput: (v) => { drawCount = v; resetSamples(); renderGeneral(); } });
  const sWanted = range({ label: "Kérdés: pontosan k =", min: 0, max: 8, value: wanted, format: String, onInput: (v) => { wanted = v; renderGeneral(); } });
  const gFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 60`, role: "img", "aria-label": "Az urna golyói" });
  const gResult = make("p", "il-message");
  const genericFormula = make("div", "il-formula"), numericFormula = make("div", "il-formula");
  const chart = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 230`, role: "img", "aria-label": "A jó golyók számának eloszlása" });
  const meanLine = make("div", "il-formula");
  const explainLine = make("p", "il-muted");
  general.append(gModes, controls(sTotal.element, sGood.element, sDraw.element, sWanted.element), gFigure,
    controls(button("Húzás", drawSample), button("1000 húzás", () => { for (let t = 0; t < 1000; t++) record(drawGoods()); gResult.className = "il-message"; gResult.textContent = `${samples} húzás, ebből pontosan ${wanted} jó: ${hits[wanted]} alkalommal (${formatNumber((hits[wanted] / samples) * 100, 1)} %).`; renderChart(); }), button("Nullázás", () => { resetSamples(); renderChart(); }, { ghost: true })),
    gResult, genericFormula, numericFormula, chart,
    make("p", "il-muted", "Az oszlopok annak valószínűségét mutatják, hogy a húzott n golyó között pontosan 0, 1, 2, ... jó van. A kiemelt oszlop a kérdéses k, a narancs jel a kísérletekben megfigyelt relatív gyakoriság, a zöld szaggatott vonal a várható érték."),
    meanLine, explainLine);

  function resetSamples() { hits = Array(9).fill(0); samples = 0; gResult.textContent = ""; }
  function drawGoods() {
    if (replacement) return Array.from({ length: drawCount }, () => Math.floor(Math.random() * total)).filter((i) => i < good).length;
    const order = [...Array(total).keys()];
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return order.slice(0, drawCount).filter((i) => i < good).length;
  }
  function record(goods) { hits[goods] += 1; samples += 1; }
  function drawSample() {
    const goods = drawGoods();
    record(goods);
    gResult.className = `il-message ${goods === wanted ? "good" : ""}`;
    gResult.textContent = `Kihúztunk ${drawCount} golyót, ebből ${goods} jó${goods === wanted ? " – ez a keresett eset!" : "."}`;
    renderChart();
  }

  function renderGeneral() {
    sGood.input.max = total; if (good > total) { good = total; sGood.set(good); }
    sDraw.input.max = replacement ? 8 : Math.min(8, total); if (drawCount > Number(sDraw.input.max)) { drawCount = Number(sDraw.input.max); sDraw.set(drawCount); }
    sWanted.input.max = drawCount; if (wanted > drawCount) { wanted = drawCount; sWanted.set(wanted); }
    gModes.replaceChildren(toggle("Visszatevés nélkül", !replacement, () => { replacement = false; resetSamples(); renderGeneral(); }), toggle("Visszatevéssel", replacement, () => { replacement = true; resetSamples(); renderGeneral(); }));
    gFigure.replaceChildren();
    for (let i = 0; i < total; i++) svg("circle", { cx: 30 + i * 34, cy: 30, r: 12, style: `fill:${i < good ? PALETTE.red : PALETTE.blue};opacity:${i < good ? 1 : 0.5}` }, gFigure);
    const value = pmf(wanted);
    if (replacement) {
      genericFormula.replaceChildren(rich("P(X = k) = ", binomNode("n", "k"), " · ", frac("K", "N"), sup("k"), " · ", frac("N − K", "N"), sup("n − k")));
      numericFormula.replaceChildren(rich(`P(X = ${wanted}) = `, binomNode(drawCount, wanted), " · ", frac(String(good), String(total)), sup(wanted), " · ", frac(String(total - good), String(total)), sup(drawCount - wanted), ` = ${formatNumber(value, 4)}`));
      explainLine.textContent = `Visszatevéssel minden húzásnál ugyanaz az esély (${good}/${total}) a jó golyóra. A ${wanted} jó golyó helyét ${binom(drawCount, wanted)}-féleképpen választhatjuk ki a ${drawCount} húzás közül, a valószínűségeket összeszorozzuk.`;
    } else {
      genericFormula.replaceChildren(rich("P(X = k) = ", frac(rich(binomNode("K", "k"), " · ", binomNode("N − K", "n − k")), binomNode("N", "n"))));
      numericFormula.replaceChildren(rich(`P(X = ${wanted}) = `, frac(rich(binomNode(good, wanted), " · ", binomNode(total - good, drawCount - wanted)), binomNode(total, drawCount)),
        " = ", frac(`${binom(good, wanted)} · ${binom(total - good, drawCount - wanted)}`, String(binom(total, drawCount))), ` = ${formatNumber(value, 4)}`));
      explainLine.textContent = `Kedvező esetek: a ${good} jó golyóból ${wanted}-t választunk (${binom(good, wanted)}-féleképpen), a ${total - good} rossz golyóból a maradék ${drawCount - wanted}-t (${binom(total - good, drawCount - wanted)}-féleképpen), és ezeket szorozzuk. Összes eset: a ${total} golyóból ${drawCount}-t választunk (${binom(total, drawCount)}-féleképpen). A sorrend nem számít, ezért kombinációkat használunk.`;
    }
    const expected = (drawCount * good) / total;
    meanLine.replaceChildren(rich(`E(X) = n · K/N = ${drawCount} · ${good}/${total} = `, make("b", "", formatNumber(expected))));
    renderChart();
  }

  function renderChart() {
    chart.replaceChildren();
    const values = Array.from({ length: drawCount + 1 }, (_, x) => pmf(x)), max = Math.max(...values, 0.01) * 1.2;
    const left = 40, right = W - 20, base = 175, top = 15, bw = (right - left) / (drawCount + 1), y = (v) => base - (v / max) * (base - top);
    svg("line", { x1: left, x2: right, y1: base, y2: base, class: "axis" }, chart);
    values.forEach((v, x) => {
      const bx = left + x * bw;
      svg("rect", { x: bx + 6, y: y(v), width: bw - 12, height: base - y(v), rx: 4, style: `fill:${x === wanted ? PALETTE.green : PALETTE.blue};opacity:${x === wanted ? 1 : 0.55}` }, chart);
      svg("text", { x: bx + bw / 2, y: base + 18, "text-anchor": "middle", text: String(x), style: "font-weight:700" }, chart);
      svg("text", { x: bx + bw / 2, y: base + 34, "text-anchor": "middle", text: `${formatNumber(v * 100, 1)} %`, style: "font-size:11px" }, chart);
      if (samples) svg("line", { x1: bx + 3, x2: bx + bw - 3, y1: y(hits[x] / samples), y2: y(hits[x] / samples), style: `stroke:${PALETTE.amber};stroke-width:4` }, chart);
    });
    const ex = left + ((drawCount * good) / total + 0.5) * bw;
    svg("line", { x1: ex, x2: ex, y1: top, y2: base, style: `stroke:${PALETTE.green};stroke-width:2.5;stroke-dasharray:6 5` }, chart);
    svg("text", { x: W - 20, y: 222, "text-anchor": "end", text: "a jó golyók száma a kihúzottak között", style: "font-size:12px;fill:var(--dim)" }, chart);
  }

  root.append(draw, experiment, general, keyIdea("visszatevéssel a húzások függetlenek, ezért az esélyeket egyszerűen összeszorozzuk. Visszatevés nélkül a második tört nevezője és általában a számlálója is megváltozik, mert az első húzás után kevesebb golyó maradt."));
  renderModes(); renderJar(); renderTable(); renderGeneral();
  return () => scope.clearAll();
}
