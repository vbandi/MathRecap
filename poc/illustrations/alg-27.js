import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle, uniqueId } from "./kit.js";

const PLOT = { xMin: -8, xMax: 8, yMin: -8, yMax: 8, xUnit: 36, yUnit: 22, pad: 22 };
const WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const toX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const toY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const n = (value, digits = 2) => formatNumber(value, digits);
const RELATIONS = [
  { symbol: "<", test: (v) => v < 0 },
  { symbol: "≤", test: (v) => v <= 0 },
  { symbol: ">", test: (v) => v > 0 },
  { symbol: "≥", test: (v) => v >= 0 },
];
const coefficientText = (value, suffix, first) => `${first ? (value < 0 ? "−" : "") : value < 0 ? " − " : " + "}${Math.abs(value) === 1 && suffix ? "" : n(Math.abs(value))}${suffix}`;
const rootText = (value) => `${Number.isInteger(value) ? "" : "≈ "}${n(value)}`;
const sign = (value) => (value > 0 ? "+" : value < 0 ? "−" : "0");

// Solution intervals of a·x² + b·x + c (relation) 0 as [{ from, to, fromClosed, toClosed }].
function solve(a, b, c, relation) {
  const D = b * b - 4 * a * c;
  const points = D < 0 ? [] : D === 0 ? [-b / (2 * a)] : [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((u, v) => u - v);
  const value = (x) => a * x * x + b * x + c;
  const regions = [];
  const edges = [-Infinity, ...points, Infinity];
  for (let i = 0; i < edges.length - 1; i++) {
    const low = edges[i], high = edges[i + 1];
    const sample = low === -Infinity ? (high === Infinity ? 0 : high - 1) : high === Infinity ? low + 1 : (low + high) / 2;
    regions.push({ from: low, to: high, closed: false, ok: relation.test(value(sample)) });
    if (i < points.length) regions.push({ from: points[i], to: points[i], closed: true, ok: relation.test(0) });
  }
  const intervals = [];
  for (const region of regions) {
    const last = intervals[intervals.length - 1];
    if (!region.ok) continue;
    if (last && last.to === region.from) { last.to = region.to; last.toClosed = region.closed; continue; }
    intervals.push({ from: region.from, to: region.to, fromClosed: region.closed, toClosed: region.closed });
  }
  return { points, D, intervals };
}

const intervalText = (intervals) => intervals.length
  ? intervals.map(({ from, to, fromClosed, toClosed }) => `${fromClosed ? "[" : "]"}${from === -Infinity ? "−∞" : n(from)}; ${to === Infinity ? "∞" : n(to)}${toClosed ? "]" : "["}`).join(" ∪ ")
  : "∅ (üres halmaz)";

export function mount(root) {
  const state = { a: 1, b: -2, c: -3, relation: 0 };
  const clipId = uniqueId("inequality-clip");

  root.append(lead("Egy másodfokú egyenlőtlenség azt kérdezi: mely x-eknél van a parabola az x tengely alatt vagy fölött. Ehhez nem kell minden x-et kipróbálni: elég megkeresni, hol metszi a parabola az x tengelyt, és megnézni, merre nyílik."));

  const main = card("Olvasd le a parabolából");
  const aSlider = range({ label: "a", min: -2, max: 2, value: state.a, format: n, onInput: (v) => { state.a = v; render(); } });
  const bSlider = range({ label: "b", min: -6, max: 6, value: state.b, format: n, onInput: (v) => { state.b = v; render(); } });
  const cSlider = range({ label: "c", min: -8, max: 8, value: state.c, format: n, onInput: (v) => { state.c = v; render(); } });
  const relationToggles = make("div", "il-controls");
  const inequalityLine = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Parabola és a megoldás az x tengelyen" });
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: WIDTH - 2 * PLOT.pad, height: HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.pad, y2: HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, figure);
    if (x && x % 2 === 0) svg("text", { x: toX(x), y: toY(0) + 30, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y++) {
    svg("line", { x1: PLOT.pad, x2: WIDTH - PLOT.pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 2 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const curve = svg("path", { fill: "none", "clip-path": `url(#${clipId})`, style: "stroke:var(--accent);stroke-width:3.5" }, figure);
  const marks = svg("g", {}, figure);
  const answer = make("p", "il-formula start");
  const message = make("p", "il-message");
  const chartTitle = make("p", "il-muted");
  const chart = make("table", "il-table");
  main.append(controls(aSlider.element, bSlider.element, cSlider.element), relationToggles, inequalityLine, figure, answer, message, chartTitle, chart);
  root.append(main, keyIdea("másodfokú egyenlőtlenségnél előbb a gyököket keresd meg, azok osztják részekre az x tengelyt. Minden részben a kifejezés előjele állandó: a parabola vagy végig az x tengely fölött, vagy végig alatta van. A nem szigorú relációnál (≤, ≥) a gyökök is beletartoznak, ezért zárójelük szögletes."));

  function render() {
    const { a, b, c } = state, relation = RELATIONS[state.relation];
    relationToggles.replaceChildren(...RELATIONS.map((r, i) => toggle(`${r.symbol} 0`, i === state.relation, () => { state.relation = i; render(); })));
    const expression = `${coefficientText(a, "x²", true)}${coefficientText(b, "x", false)}${coefficientText(c, "", false)}`;
    inequalityLine.replaceChildren(equation(slot(a === 0 ? "a ≠ 0 kell" : expression, 22), slot("0", 3, { align: "left" }), relation.symbol));
    if (a === 0) {
      curve.setAttribute("d", ""); marks.replaceChildren();
      answer.textContent = "Megoldás: —"; message.textContent = "Az a nem lehet 0, különben nem másodfokú."; chartTitle.textContent = ""; chart.replaceChildren();
      return;
    }
    let d = "";
    for (let x = PLOT.xMin; x <= PLOT.xMax + 1e-9; x += 0.1) d += `${d ? "L" : "M"} ${toX(x)} ${toY(a * x * x + b * x + c)} `;
    curve.setAttribute("d", d);
    const { points, D, intervals } = solve(a, b, c, relation);
    marks.replaceChildren();
    for (const { from, to, fromClosed, toClosed } of intervals) {
      const x1 = toX(Math.max(from, PLOT.xMin)), x2 = toX(Math.min(to, PLOT.xMax));
      svg("line", { x1, x2, y1: toY(0), y2: toY(0), style: `stroke:${PALETTE.green};stroke-width:8;stroke-linecap:butt;opacity:.85` }, marks);
      for (const [edge, closed] of [[from, fromClosed], [to, toClosed]]) {
        if (Math.abs(edge) > PLOT.xMax) continue;
        svg("circle", { cx: toX(edge), cy: toY(0), r: 7, style: `fill:${closed ? PALETTE.green : "var(--input)"};stroke:${PALETTE.green};stroke-width:3` }, marks);
      }
    }
    for (const p of points) {
      svg("line", { x1: toX(p), x2: toX(p), y1: toY(0), y2: toY(0) + 26, style: "stroke:var(--fg);stroke-width:1.5;stroke-dasharray:4 3" }, marks);
      svg("text", { x: toX(p), y: toY(0) + 42, "text-anchor": "middle", text: rootText(p), style: "font-weight:700" }, marks);
    }
    answer.textContent = `Megoldás: ${intervals.length ? `x ∈ ${intervalText(intervals)}` : intervalText(intervals)}`;
    message.className = `il-message ${intervals.length ? "good" : "warn"}`;
    message.textContent = D < 0
      ? `Nincs gyök (D < 0): a parabola végig az x tengely ${a > 0 ? "fölött" : "alatt"} van, ezért a kifejezés előjele mindenhol ${a > 0 ? "pozitív" : "negatív"}.`
      : `A parabola ${a > 0 ? "felfelé" : "lefelé"} nyílik, ${D === 0 ? "az x tengelyt egy pontban érinti" : "két helyen metszi az x tengelyt"}. A zöld szakaszokon teljesül: ${expression} ${relation.symbol} 0.`;

    // Sign chart of a(x − x₁)(x − x₂)
    chart.replaceChildren();
    if (D < 0) { chartTitle.textContent = "Előjeltáblázat: nincs gyök, az előjel állandó."; chart.append(chartRow("a·x² + bx + c", [sign(a)], ["(−∞; ∞)"])); return; }
    chartTitle.textContent = `Előjeltáblázat a gyöktényezős alakból: ${n(a)}(x − ${rootText(points[0])})${D > 0 ? `(x − ${rootText(points[1])})` : `²`}`;
    const r = D === 0 ? [points[0], points[0]] : points;
    const samples = D === 0 ? [r[0] - 1, r[0], r[0] + 1] : [r[0] - 1, r[0], (r[0] + r[1]) / 2, r[1], r[1] + 1];
    const labels = D === 0 ? ["x < x₁", "x = x₁", "x > x₁"] : ["x < x₁", "x = x₁", "x₁ < x < x₂", "x = x₂", "x > x₂"];
    const rows = [
      ["a", samples.map(() => sign(a))],
      ["x − x₁", samples.map((x) => sign(x - r[0]))],
      ...(D > 0 ? [["x − x₂", samples.map((x) => sign(x - r[1]))]] : [["x − x₁", samples.map((x) => sign(x - r[0]))]]),
      ["szorzat", samples.map((x) => sign(a * (x - r[0]) * (x - r[1])))],
    ];
    chart.append(chartRow("", labels, null, true));
    for (const [name, values] of rows) chart.append(chartRow(name, values, null, false, name === "szorzat"));
  }

  function chartRow(name, values, _unused, header = false, bold = false) {
    const row = make("tr");
    row.append(make("th", "", name));
    for (const value of values) {
      const cell = make(header ? "th" : "td", "", value);
      cell.style.width = header ? "11ch" : "";
      if (!header && bold) { cell.style.fontWeight = "700"; cell.style.color = value === "+" ? PALETTE.green : value === "−" ? PALETTE.red : "var(--fg-soft)"; }
      row.append(cell);
    }
    return row;
  }

  render();
  return () => {};
}
