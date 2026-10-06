import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const W = 720, AXIS_Y = 150, MIN = 0, MAX = 30, MAX_STACK = 6, MAX_VALUES = 18;
const px = (v) => 40 + ((v - MIN) / (MAX - MIN)) * (W - 80);

const sortedCopy = (values) => [...values].sort((a, b) => a - b);
const medianOfSorted = (sorted) => { const mid = sorted.length >> 1; return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
// Convention: the median splits the data in two halves (the middle value of an odd-sized data set belongs to neither),
// Q1 and Q3 are the medians of the lower and the upper half.
export function summary(values) {
  const sorted = sortedCopy(values), n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const q1 = medianOfSorted(sorted.slice(0, n >> 1)), q3 = medianOfSorted(sorted.slice(Math.ceil(n / 2)));
  return { sorted, n, min: sorted[0], max: sorted[n - 1], median: medianOfSorted(sorted), q1, q3, range: sorted[n - 1] - sorted[0], iqr: q3 - q1, mean, variance, sd: Math.sqrt(variance) };
}

export function mount(root) {
  const scope = createScope();
  let values = [8, 9, 10, 10, 11, 12, 13, 14], outlierOn = false, outlier = 28;
  const all = () => (outlierOn ? [...values, outlier] : [...values]);

  root.append(lead("Két adatsornak lehet ugyanaz az átlaga, mégis nagyon különbözhetnek: az egyikben az értékek szorosan egymás mellett vannak, a másikban szétszórtan. A terjedelem, a kvartilisek és a szórás azt mérik, mennyire szóródnak az adatok."));

  const plotCard = card("Mérjük meg a szóródást");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 250`, role: "img", "aria-label": "Pontdiagram a minimummal, maximummal, kvartilisekkel" }, plotCard);
  const layer = svg("g", {}, figure);
  const outlierSlider = range({ label: "A kiugró érték:", min: 15, max: 30, step: 1, value: outlier, format: String, onInput: (n) => { outlier = n; renderAll(); } });
  const outlierToggle = toggle("Kiugró érték hozzáadása", false, () => { outlierOn = !outlierOn; renderAll(); }, PALETTE.red);
  const table = make("table", "il-table");
  const message = make("p", "il-message");
  plotCard.append(make("p", "il-muted", "Kattints egy szám fölé, hogy új pont kerüljön oda, egy pontra kattintva pedig leveszed (legalább 4 pont marad)."), figure,
    controls(outlierToggle, outlierSlider.element, button("Alaphelyzet", () => { values = [8, 9, 10, 10, 11, 12, 13, 14]; outlierOn = false; renderAll(); }, { ghost: true })),
    table, message,
    make("p", "il-muted", "Kvartilisek: a mediánnál kettéosztjuk az adatokat (páratlan számú adatnál a középső érték egyik félhez sem tartozik). Az alsó kvartilis (Q1) az alsó fél mediánja, a felső kvartilis (Q3) a felső fél mediánja. A terjedelem a legnagyobb és a legkisebb érték különbsége, a kvartilisek távolsága (Q3 − Q1) a középső fél szórási tartománya."));

  const squareCard = card("A szórás: az eltérések négyzetei");
  const squareFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 250`, role: "img", "aria-label": "Az átlagtól való eltérések négyzetei" }, squareCard);
  const squareLayer = svg("g", {}, squareFigure);
  const squareText = make("div", "il-formula start");
  const meanText = make("span"), varianceText = make("span"), sdText = make("span");
  squareText.append(meanText, make("br"), varianceText, make("br"), sdText);
  squareCard.append(make("p", "", "Minden adatponthoz rajzolunk egy négyzetet, amelynek oldala az adat és az átlag távolsága. A zöld négyzet területe a többi négyzet területének átlaga, az oldala a szórás."), squareFigure, squareText);

  root.append(plotCard, squareCard, keyIdea("a terjedelem csak a két szélső értéket nézi, ezért egyetlen kiugró érték is nagyon megváltoztatja. A kvartilisek távolsága és a szórás kevésbé érzékeny, a szórás viszont minden adatot figyelembe vesz."));

  function renderPlot() {
    layer.replaceChildren();
    const s = summary(all());
    svg("line", { x1: 30, x2: W - 30, y1: AXIS_Y, y2: AXIS_Y, class: "axis" }, layer);
    for (let v = MIN; v <= MAX; v += 1) {
      if (v % 2 === 0) svg("text", { x: px(v), y: AXIS_Y + 18, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, layer);
      const hit = svg("rect", { x: px(v) - 10.5, y: 36, width: 21, height: AXIS_Y - 26, fill: "transparent", style: "cursor:pointer" }, layer);
      hit.addEventListener("click", () => { if (values.length < MAX_VALUES && values.filter((x) => x === v).length < MAX_STACK) { values.push(v); renderAll(); } });
    }
    const markers = [["min", s.min, "var(--dim)"], ["Q1", s.q1, PALETTE.amber], ["medián", s.median, PALETTE.blue], ["Q3", s.q3, PALETTE.amber], ["max", s.max, "var(--dim)"]];
    markers.forEach(([name, v, color], i) => {
      svg("line", { x1: px(v), x2: px(v), y1: 34, y2: AXIS_Y, style: `stroke:${color};stroke-width:2;stroke-dasharray:5 4` }, layer);
      svg("text", { x: px(v), y: 14 + (i % 2) * 13, "text-anchor": "middle", text: `${name} ${formatNumber(v, 1)}`, style: `fill:${color === "var(--dim)" ? "var(--fg-soft)" : color};font-weight:700;font-size:12px` }, layer);
    });
    const counts = {}, userSorted = sortedCopy(values);
    [...userSorted.map((v) => [v, false]), ...(outlierOn ? [[outlier, true]] : [])].forEach(([v, isOutlier]) => {
      const level = counts[v] = (counts[v] ?? 0) + 1;
      const dot = svg("circle", { cx: px(v), cy: AXIS_Y - 4 - level * 15, r: 6.5, style: `fill:${isOutlier ? PALETTE.red : PALETTE.green};stroke:var(--input);stroke-width:1.5;cursor:pointer` }, layer);
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        if (isOutlier) { outlierOn = false; renderAll(); return; }
        if (values.length > 4) { values.splice(values.lastIndexOf(v), 1); renderAll(); }
      });
    });
    const bracket = (from, to, y, color, text) => {
      svg("path", { d: `M ${px(from)} ${y - 6} V ${y} H ${px(to)} V ${y - 6}`, fill: "none", style: `stroke:${color};stroke-width:2.5` }, layer);
      svg("text", { x: (px(from) + px(to)) / 2, y: y + 16, "text-anchor": "middle", text, style: `fill:${color};font-weight:700;font-size:12px` }, layer);
    };
    bracket(s.min, s.max, 184, PALETTE.violet, `terjedelem = ${formatNumber(s.range, 1)}`);
    bracket(s.q1, s.q3, 222, PALETTE.amber, `Q3 − Q1 = ${formatNumber(s.iqr, 1)}`);
  }

  function renderTable() {
    const without = summary(values), withOut = summary([...values, outlier]);
    const row = (name, key, digits) => {
      const tr = make("tr");
      tr.append(make("th", "", name), make("td", "", formatNumber(without[key], digits)));
      const cell = make("td", "", outlierOn ? formatNumber(withOut[key], digits) : "–");
      const change = make("td", "", outlierOn ? `${without[key] ? "×" + formatNumber(withOut[key] / without[key], 2) : "–"}` : "");
      tr.append(cell, change);
      return tr;
    };
    const head = make("tr");
    head.append(make("th", "", ""), make("th", "", "kiugró nélkül"), make("th", "", "kiugróval"), make("th", "", "változás"));
    table.replaceChildren(head, row("terjedelem", "range", 1), row("Q3 − Q1", "iqr", 1), row("szórás", "sd", 2));
    const a = summary(values), b = withOut;
    message.className = `il-message ${outlierOn ? "warn" : ""}`;
    message.textContent = outlierOn
      ? `A kiugró érték a terjedelmet ${formatNumber(a.range, 1)}-ről ${formatNumber(b.range, 1)}-re növelte (×${formatNumber(b.range / a.range, 2)}), a kvartilisek távolsága csak ${formatNumber(a.iqr, 1)}-ről ${formatNumber(b.iqr, 1)}-re változott.`
      : "Kapcsold be a kiugró értéket, és nézd meg, melyik mérőszám mozdul el a legjobban!";
  }

  function renderSquares() {
    squareLayer.replaceChildren();
    const s = summary(all()), devs = s.sorted.map((v) => Math.abs(v - s.mean));
    const sumDev = devs.reduce((a, b) => a + b, 0), gap = 6, baseY = 225;
    const unit = Math.min(26, 190 / Math.max(Math.max(...devs), s.sd, 0.01), (W - 70 - gap * s.n - 30) / Math.max(sumDev + s.sd, 0.01));
    let x = 30;
    svg("line", { x1: 20, x2: W - 20, y1: baseY, y2: baseY, class: "axis" }, squareLayer);
    devs.forEach((d, i) => {
      const side = Math.max(d * unit, 1.5);
      svg("rect", { x, y: baseY - side, width: side, height: side, style: `fill:${PALETTE.blue};opacity:.55;stroke:${PALETTE.blue}` }, squareLayer);
      if (side > 22) svg("text", { x: x + side / 2, y: baseY - side / 2 + 4, "text-anchor": "middle", text: formatNumber(d * d, 1), style: "font-size:11px;fill:var(--fg)" }, squareLayer);
      svg("text", { x: x + side / 2, y: baseY + 14, "text-anchor": "middle", text: formatNumber(s.sorted[i], 0), style: "font-size:10px;fill:var(--dim)" }, squareLayer);
      x += side + gap;
    });
    x += 20;
    const side = s.sd * unit;
    svg("rect", { x, y: baseY - side, width: side, height: side, style: `fill:${PALETTE.green};opacity:.8;stroke:${PALETTE.green}` }, squareLayer);
    svg("text", { x: x + side / 2, y: baseY - side - 6, "text-anchor": "middle", text: `σ = ${formatNumber(s.sd, 2)}`, style: `fill:${PALETTE.green};font-weight:700` }, squareLayer);
    meanText.replaceChildren("átlag = ", slot(formatNumber(s.mean, 2), 8, { align: "left" }));
    varianceText.replaceChildren("a négyzetek területének átlaga = ", slot(formatNumber(s.variance, 2), 8, { align: "left" }));
    sdText.replaceChildren("szórás = √", slot(formatNumber(s.variance, 2), 8, { align: "left" }), "= ", slot(formatNumber(s.sd, 2), 8, { align: "left" }));
  }

  function renderAll() {
    outlierToggle.setAttribute("aria-pressed", String(outlierOn));
    renderPlot(); renderTable(); renderSquares();
  }

  renderAll();
  return () => scope.clearAll();
}
