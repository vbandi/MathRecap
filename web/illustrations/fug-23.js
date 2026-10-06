import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const CHART = { width: 640, height: 280, left: 86, right: 16, top: 16, bottom: 34 };
const ft = (value) => `${groupDigits(value)} Ft`;

// Pure finance formulas (monthly compounding, payments at the end of each month).
export function futureValue(deposit, annualPercent, months) {
  const r = annualPercent / 1200;
  return r === 0 ? deposit * months : (deposit * ((1 + r) ** months - 1)) / r;
}
export function monthlyPayment(amount, annualPercent, months) {
  const r = annualPercent / 1200;
  return r === 0 ? amount / months : (amount * r) / (1 - (1 + r) ** -months);
}
export function remainingDebt(amount, annualPercent, months, paid) {
  const r = annualPercent / 1200, payment = monthlyPayment(amount, annualPercent, months);
  return r === 0 ? amount - payment * paid : amount * (1 + r) ** paid - (payment * ((1 + r) ** paid - 1)) / r;
}

function niceStep(rough) {
  const power = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough);
}

// Axes for a chart whose y range is 0..peak; returns the mapping functions.
function drawAxes(figure, peak, xLabels, xOf) {
  const { width, height, left, right, top, bottom } = CHART;
  const step = niceStep(peak / 5), yTop = Math.ceil(peak / step) * step;
  const toY = (y) => top + (1 - y / yTop) * (height - top - bottom);
  figure.replaceChildren();
  for (let y = 0; y <= yTop + 1e-9; y += step) {
    svg("line", { x1: left, x2: width - right, y1: toY(y), y2: toY(y), class: y === 0 ? "axis" : "grid" }, figure);
    addText(figure, left - 8, toY(y) + 4, groupDigits(y), "fill:var(--dim);font-size:11px;font-weight:400", "end");
  }
  xLabels.forEach((label) => addText(figure, xOf(label), height - bottom + 16, String(label), "fill:var(--dim);font-size:11px;font-weight:400", "middle"));
  return toY;
}

export function mount(root) {
  const scope = createScope();
  const save = { deposit: 30000, rate: 4, years: 10 };
  const loan = { amount: 5000000, rate: 8, years: 5 };

  root.append(lead("Ha rendszeresen félreteszel pénzt, a bank kamatot ad rá, és a kamat is kamatozik. Ha hitelt veszel fel, fordítva: a bank kér kamatot, és minden hónapban ugyanazt a részletet fizeted vissza. Mindkettő mértani sorozat összege, amit most kiszámolhatsz."));

  // --- Savings ---
  const savings = card("Megtakarítás: havi betét kamatos kamattal");
  const slideDeposit = range({ label: "havi betét (Ft)", min: 10000, max: 100000, step: 10000, value: save.deposit, format: groupDigits, onInput: (v) => { save.deposit = v; renderSavings(); } });
  const slideSaveRate = range({ label: "éves kamat (%)", min: 0, max: 10, step: 0.5, value: save.rate, onInput: (v) => { save.rate = v; renderSavings(); } });
  const slideSaveYears = range({ label: "évek", min: 1, max: 30, value: save.years, format: String, onInput: (v) => { save.years = v; renderSavings(); } });
  const saveFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${CHART.width} ${CHART.height}`, role: "img", "aria-label": "Megtakarítás évenként: befizetett pénz és kamat" });
  const saveLegend = make("p", "il-muted", "Kék: a befizetett összeg. Zöld: a kamat, amit a bank hozzáad. Egy oszlop az adott év végi állapot.");
  const saveFormula = make("div", "il-formula start"), saveResult = make("p", "il-message");
  savings.append(controls(slideDeposit.element, slideSaveRate.element, slideSaveYears.element), saveFigure, saveLegend, saveFormula, saveResult);

  // --- Loan ---
  const credit = card("Hitel: havi törlesztőrészlet");
  const slideAmount = range({ label: "hitel (Ft)", min: 500000, max: 20000000, step: 500000, value: loan.amount, format: groupDigits, onInput: (v) => { loan.amount = v; renderLoan(); } });
  const slideLoanRate = range({ label: "éves kamat (%)", min: 1, max: 20, step: 0.5, value: loan.rate, onInput: (v) => { loan.rate = v; renderLoan(); } });
  const slideLoanYears = range({ label: "futamidő (év)", min: 1, max: 30, value: loan.years, format: String, onInput: (v) => { loan.years = v; renderLoan(); } });
  const loanFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${CHART.width} ${CHART.height}`, role: "img", "aria-label": "A hátralévő tartozás alakulása hónapról hónapra" });
  const loanFormula = make("div", "il-formula start"), loanResult = make("p", "il-message");
  credit.append(controls(slideAmount.element, slideLoanRate.element, slideLoanYears.element), loanFigure,
    make("p", "il-muted", "A görbe a még vissza nem fizetett tartozás. A törlesztőrészlet végig ugyanakkora, de az elején a nagy része kamat, a végén a nagy része tőketörlesztés."),
    loanFormula, loanResult);

  root.append(savings, credit, make("p", "il-muted", "Egyszerűsített modell: a havi kamat az éves kamat tizenketted része, a betétek és a részletek hónap végén esedékesek. Valódi termékeknél a díjak, az adók és a kamatozás módja miatt az eredmény eltérhet, ezért hitelnél mindig hasonlítsd össze a teljes visszafizetett összeget is."),
    keyIdea("a megtakarítás végösszege S = D · ((1 + r)ᵐ − 1) / r, a törlesztőrészlet pedig A = L · r / (1 − (1 + r)⁻ᵐ), ahol r a havi kamatláb, m a hónapok száma. Hosszabb futamidő kisebb havi részletet jelent, de összesen több kamatot."));

  function renderSavings() {
    const { deposit, rate, years } = save, months = years * 12, r = rate / 1200;
    const balance = (y) => futureValue(deposit, rate, 12 * y), total = balance(years), paidIn = deposit * months;
    const slotWidth = (CHART.width - CHART.left - CHART.right) / years;
    const toY = drawAxes(saveFigure, total, Array.from({ length: years }, (_, i) => i + 1).filter((y) => years <= 15 || y % 5 === 0 || y === 1), (y) => CHART.left + (y - 0.5) * slotWidth);
    for (let y = 1; y <= years; y++) {
      const x = CHART.left + (y - 1) * slotWidth + slotWidth * 0.12, w = slotWidth * 0.76, paid = deposit * 12 * y, sum = balance(y);
      svg("rect", { x, y: toY(paid), width: w, height: toY(0) - toY(paid), style: `fill:${PALETTE.blue};fill-opacity:.85` }, saveFigure);
      svg("rect", { x, y: toY(sum), width: w, height: toY(paid) - toY(sum), style: "fill:var(--accent);fill-opacity:.9" }, saveFigure);
    }
    saveFormula.replaceChildren(rich(`r = ${formatNumber(rate)}%/12 = ${formatNumber(r * 100, 4)}%,  m = ${years}·12 = ${months}`), make("br"),
      rich(r === 0 ? `S = D·m = ${groupDigits(deposit)}·${months} = ` : `S = D·((1 + r)`, ...(r === 0 ? [] : [make("sup", "", "m"), `− 1)/r = ${groupDigits(deposit)}·((1 + ${formatNumber(r, 6)})`, make("sup", "", String(months)), ` − 1)/${formatNumber(r, 6)} = `]), make("b", "", ft(total))));
    saveResult.className = "il-message";
    saveResult.textContent = `Befizetett összeg: ${ft(paidIn)}. Kamat: ${ft(total - paidIn)}. Végösszeg: ${ft(total)}. A kamat a befizetések ${formatNumber(((total - paidIn) / paidIn) * 100, 1)}%-a.`;
  }

  function renderLoan() {
    const { amount, rate, years } = loan, months = years * 12;
    const payment = monthlyPayment(amount, rate, months), paid = payment * months, r = rate / 1200;
    const toY = drawAxes(loanFigure, amount, Array.from({ length: years + 1 }, (_, i) => i).filter((y) => years <= 15 || y % 5 === 0), (y) => CHART.left + (y / years) * (CHART.width - CHART.left - CHART.right));
    const toX = (k) => CHART.left + (k / months) * (CHART.width - CHART.left - CHART.right);
    const line = Array.from({ length: months + 1 }, (_, k) => `${k ? "L" : "M"}${toX(k).toFixed(1)} ${toY(Math.max(0, remainingDebt(amount, rate, months, k))).toFixed(1)}`).join(" ");
    svg("path", { d: `${line} L ${toX(months)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`, style: `fill:${PALETTE.amber};fill-opacity:.25;stroke:none` }, loanFigure);
    svg("path", { d: line, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, loanFigure);
    addText(loanFigure, CHART.width - CHART.right, CHART.height - 4, "év", "fill:var(--dim);font-size:12px;font-weight:400", "end");
    loanFormula.replaceChildren(rich(`r = ${formatNumber(rate)}%/12 = ${formatNumber(r * 100, 4)}%,  m = ${years}·12 = ${months}`), make("br"),
      rich(r === 0 ? `A = L/m = ` : `A = L·r/(1 − (1 + r)`, ...(r === 0 ? [] : [make("sup", "", "−m"), `) = ${groupDigits(amount)}·${formatNumber(r, 6)}/(1 − ${formatNumber(1 + r, 6)}`, make("sup", "", `−${months}`), `) = `]), make("b", "", ft(payment))));
    loanResult.className = "il-message";
    loanResult.textContent = `Havi törlesztőrészlet: ${ft(payment)}. Összesen visszafizetsz: ${ft(paid)}, ebből kamat ${ft(paid - amount)}. Minden kölcsönkapott 1 Ft után ${formatNumber(paid / amount, 2)} Ft-ot fizetsz vissza.`;
  }

  renderSavings();
  renderLoan();
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
