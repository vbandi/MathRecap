import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40;
const COLORS = [PALETTE.blue, PALETTE.violet, PALETTE.pink, PALETTE.green, PALETTE.amber];
const NAMES = ["A", "B", "C", "D", "E", "F"];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);

function addHandle(figure, parent, color, onMove) {
  const group = svg("g", { style: "cursor:grab;touch-action:none" }, parent);
  svg("circle", { r: 20, fill: "transparent" }, group);
  svg("circle", { r: 9, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
  group.addEventListener("pointerdown", (event) => { group.setPointerCapture(event.pointerId); event.preventDefault(); });
  group.addEventListener("pointermove", (event) => {
    if (!group.hasPointerCapture(event.pointerId)) return;
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(figure.getScreenCTM().inverse());
    onMove(local.x, local.y);
  });
  return { place(x, y) { group.setAttribute("transform", `translate(${x} ${y})`); } };
}

export function mount(root) {
  const vertices = [[1, 1], [6, 1], [9, 3], [8, 6], [4, 6], [2, 4]];
  const state = { fan: true, n: 6 };

  root.append(lead("Bármilyen sokszöget fel lehet vágni háromszögekre, és a háromszögek területét már tudjuk számolni. A sokszög területe ezek összege."));

  // --- Card 1: irregular polygon ---
  const irregular = card("Szabálytalan sokszög a rácson");
  const fanToggle = toggle("Háromszögekre osztás az A csúcsból", true, () => { state.fan = !state.fan; fanToggle.setAttribute("aria-pressed", String(state.fan)); renderIrregular(); });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img", "aria-label": "Szabálytalan hatszög rácson, háromszögekre osztva" });
  const view = (x, y) => [20 + x * UNIT, 300 - y * UNIT];
  for (let i = 0; i <= 14; i++) svg("line", { class: "grid", x1: 20 + i * UNIT, x2: 20 + i * UNIT, y1: 20, y2: 300 }, figure);
  for (let i = 0; i <= 7; i++) svg("line", { class: "grid", x1: 20, x2: 580, y1: 300 - i * UNIT, y2: 300 - i * UNIT }, figure);
  const shapeLayer = svg("g", {}, figure);
  const handles = vertices.map((vertex, index) => addHandle(figure, figure, PALETTE.amber, (x, y) => {
    vertices[index] = [clamp(Math.round((x - 20) / UNIT), 0, 14), clamp(Math.round((300 - y) / UNIT), 0, 7)];
    renderIrregular();
  }));
  const sumLine = make("div"), checkLine = make("div");
  const irregularMessage = make("p", "il-message");
  irregular.append(controls(fanToggle), figure, sumLine, checkLine, irregularMessage);

  function renderIrregular() {
    shapeLayer.replaceChildren();
    const total = vertices.reduce((sum, p, i) => { const q = vertices[(i + 1) % vertices.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
    const sign = total < 0 ? -1 : 1;
    const screen = vertices.map(([x, y]) => view(x, y));
    svg("polygon", { points: pointsOf(screen), style: `fill:${PALETTE.green};fill-opacity:${state.fan ? 0.08 : 0.35};stroke:var(--fg);stroke-width:2.5` }, shapeLayer);
    const areas = [];
    for (let i = 1; i < vertices.length - 1; i++) areas.push(sign * cross(vertices[0], vertices[i], vertices[i + 1]) / 2);
    if (state.fan) {
      areas.forEach((area, i) => {
        const tri = [vertices[0], vertices[i + 1], vertices[i + 2]];
        svg("polygon", { points: pointsOf(tri.map(([x, y]) => view(x, y))), style: `fill:${area < 0 ? PALETTE.red : COLORS[i % COLORS.length]};fill-opacity:.55;stroke:var(--fg);stroke-width:1.5;stroke-dasharray:${area < 0 ? "5 4" : "0"}` }, shapeLayer);
        const [cx, cy] = view(...tri.reduce((acc, p) => [acc[0] + p[0] / 3, acc[1] + p[1] / 3], [0, 0]));
        svg("text", { x: cx, y: cy + 5, "text-anchor": "middle", text: formatNumber(area, 1), style: "font-weight:700;fill:var(--fg)" }, shapeLayer);
      });
    }
    screen.forEach(([x, y], i) => {
      handles[i].place(x, y);
      const [cx, cy] = view(...vertices.reduce((acc, p) => [acc[0] + p[0] / 6, acc[1] + p[1] / 6], [0, 0]));
      svg("text", { x: x + (x < cx ? -22 : 14), y: y + (y < cy ? -12 : 20), text: NAMES[i], style: "font-weight:700;font-size:16px;fill:var(--fg)" }, shapeLayer);
    });
    const sum = areas.reduce((acc, area) => acc + area, 0);
    sumLine.replaceChildren(equation("háromszögek összege", slot(state.fan ? `${areas.map((area) => formatNumber(area, 1)).join(" + ")} = ${formatNumber(sum, 1)}` : "(kapcsold be az osztást)", 34, { align: "left", dim: !state.fan })));
    checkLine.replaceChildren(equation("egész sokszög területe", slot(formatNumber(Math.abs(total), 1), 34, { align: "left" })));
    const bad = areas.some((area) => area < -1e-9);
    irregularMessage.className = `il-message ${bad ? "warn" : ""}`;
    irregularMessage.textContent = bad
      ? "Piros háromszög: az A csúcsból nem látszik minden oldal, ezért a felosztás kilóg. Ilyenkor a piros háromszög területét ki kell vonni. Próbáld kevésbé csipkésre húzni az alakzatot."
      : "Húzd a sárga pontokat a rács metszéspontjaira: az összeg mindig egyezik az egész sokszög területével.";
  }

  // --- Card 2: regular polygon ---
  const regular = card("Szabályos sokszög: n darab egyforma háromszög");
  const slider = range({ label: "n (oldalak száma)", min: 3, max: 12, value: state.n, onInput: (value) => { state.n = value; renderRegular(); } });
  const regularFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Szabályos sokszög a középpontból háromszögekre osztva" });
  const sideLine = make("div"), triangleLine = make("div"), totalLine = make("div"), circleLine = make("div");
  regular.append(controls(slider.element), regularFigure, sideLine, triangleLine, totalLine, circleLine);

  function renderRegular() {
    const n = state.n, R = 5, pixel = 30, cx = 300, cy = 170;
    const a = 2 * R * Math.sin(Math.PI / n), r = R * Math.cos(Math.PI / n);
    const corners = Array.from({ length: n }, (_, i) => [cx + R * pixel * Math.sin(2 * Math.PI * i / n), cy - R * pixel * Math.cos(2 * Math.PI * i / n)]);
    regularFigure.replaceChildren();
    svg("circle", { cx, cy, r: R * pixel, fill: "none", style: "stroke:var(--line-strong);stroke-dasharray:4 5" }, regularFigure);
    corners.forEach((p, i) => {
      const q = corners[(i + 1) % n];
      svg("polygon", { points: pointsOf([[cx, cy], p, q]), style: `fill:${i === 0 ? PALETTE.amber : [PALETTE.blue, PALETTE.violet][i % 2]};fill-opacity:${i === 0 ? 0.9 : 0.5};stroke:var(--fg);stroke-width:1.5` }, regularFigure);
    });
    const [p, q] = [corners[0], corners[1]];
    const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    svg("line", { x1: cx, y1: cy, x2: mid[0], y2: mid[1], style: "stroke:var(--fg);stroke-width:2.5;stroke-dasharray:5 4" }, regularFigure);
    svg("text", { x: (cx + mid[0]) / 2 + 8, y: (cy + mid[1]) / 2, text: "r", style: "font-weight:700;font-style:italic;fill:var(--fg)" }, regularFigure);
    svg("text", { x: mid[0] + (mid[0] - cx) * 0.12 - 4, y: mid[1] + (mid[1] - cy) * 0.12 - 4, "text-anchor": "middle", text: "a", style: "font-weight:700;font-style:italic;fill:var(--fg)" }, regularFigure);
    const one = a * r / 2;
    sideLine.replaceChildren(equation(`n = ${n}`, slot(`a = ${formatNumber(a, 2)}, r = ${formatNumber(r, 2)}`, 28, { align: "left" })));
    triangleLine.replaceChildren(equation("egy háromszög: a · r / 2", slot(formatNumber(one, 2), 28, { align: "left" })));
    totalLine.replaceChildren(equation("T = n · (a · r / 2)", slot(`${n} · ${formatNumber(one, 2)} = ${formatNumber(n * one, 2)}`, 28, { align: "left" })));
    circleLine.replaceChildren(equation("a körülírt kör területe", slot(formatNumber(Math.PI * R * R, 2), 28, { align: "left", dim: true })));
  }

  root.append(irregular, regular, keyIdea("sokszög területe = a belőle kivágott háromszögek területének összege. Szabályos sokszögnél a háromszögek egyformák: T = n · (a · r / 2), ahol r a középpontból az oldalra húzott merőleges."));
  renderIrregular();
  renderRegular();
  return () => {};
}
