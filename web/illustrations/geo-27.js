import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170;
const toView = ([x, y]) => [CX + x * UNIT, CY - y * UNIT];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const snap = (value) => Math.round(value * 2) / 2;

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

function grid(figure) {
  for (let i = -7; i <= 7; i++) svg("line", { class: "grid", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: "grid", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
}

// Arrow with a simple head, drawn from (x1, y1) to (x2, y2) in view coordinates.
function arrow(parent, [x1, y1], [x2, y2], color, width = 3, dash = "0") {
  svg("line", { x1, y1, x2, y2, style: `stroke:${color};stroke-width:${width};stroke-dasharray:${dash}` }, parent);
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 6) return;
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length, size = 11;
  svg("polygon", { points: pointsOf([[x2, y2], [x2 - size * ux + size * 0.5 * uy, y2 - size * uy - size * 0.5 * ux], [x2 - size * ux - size * 0.5 * uy, y2 - size * uy + size * 0.5 * ux]]), style: `fill:${color}` }, parent);
}

export function mount(root) {
  root.append(lead("Eltolásnál az alakzat minden pontját ugyanazzal a nyíllal, vagyis ugyanakkora és ugyanolyan irányú lépéssel mozdítjuk el. Az alakzat közben nem fordul el, és nem változik a mérete."));

  // --- Card 1 ---
  const shape = [[-5, -1], [-3, -2], [-4, 1.5]];
  const names = ["A", "B", "C"];
  const vector = [6, 2];
  const main = card("Állítsd be az eltolásvektort");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Háromszög eltolása egy nyíllal" });
  grid(figure);
  const imageShape = svg("polygon", { style: `fill:${PALETTE.violet};fill-opacity:.4;stroke:var(--fg);stroke-width:2.5` }, figure);
  const originalShape = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.45;stroke:var(--fg);stroke-width:2.5` }, figure);
  const layer = svg("g", {}, figure);
  const tipHandle = addHandle(figure, figure, PALETTE.red, (x, y) => {
    const target = [snap((x - CX) / UNIT), snap((CY - y) / UNIT)];
    vector[0] = clamp(target[0] - shape[0][0], -7 - shape[0][0], 7 - shape[0][0]);
    vector[1] = clamp(target[1] - shape[0][1], -4 - shape[0][1], 4 - shape[0][1]);
    renderMain();
  });
  const vectorLine = make("div");
  const message = make("p", "il-message");
  main.append(figure, vectorLine, message);

  function renderMain() {
    const image = shape.map(([x, y]) => [x + vector[0], y + vector[1]]);
    layer.replaceChildren();
    originalShape.setAttribute("points", pointsOf(shape.map(toView)));
    imageShape.setAttribute("points", pointsOf(image.map(toView)));
    shape.forEach((point, index) => {
      arrow(layer, toView(point), toView(image[index]), index === 0 ? PALETTE.red : "var(--fg-soft)", index === 0 ? 3.5 : 2, index === 0 ? "0" : "6 5");
      const [x1, y1] = toView(point), [x2, y2] = toView(image[index]);
      svg("text", { x: x1 - 16, y: y1 - 8, text: names[index], style: `font-weight:700;font-size:16px;fill:${PALETTE.blue}` }, layer);
      svg("text", { x: x2 + 10, y: y2 - 8, text: `${names[index]}′`, style: `font-weight:700;font-size:16px;fill:${PALETTE.violet}` }, layer);
    });
    tipHandle.place(...toView(image[0]));
    const length = Math.hypot(vector[0], vector[1]);
    vectorLine.replaceChildren(equation("v", slot(`(${formatNumber(vector[0])}; ${formatNumber(vector[1])}),  hossza ${formatNumber(length, 2)}`, 30, { align: "left" })));
    message.textContent = `A piros nyíl A-ból A′-be mutat, és a szaggatott nyilak ugyanezt a lépést teszik B-nél és C-nél is: ${formatNumber(vector[0])} egység vízszintesen, ${formatNumber(vector[1])} egység függőlegesen. Húzd a piros pontot!`;
  }

  // --- Card 2 ---
  const composite = card("Két párhuzamos tengelyes tükrözés = eltolás");
  const state = { d: 2, steps: true, vector: false };
  const SHAPE2 = [[-6, -1], [-4.5, -1.5], [-5.5, 1.5]];
  const FIRST_AXIS = -3;
  const sliderD = range({ label: "d (a tengelyek távolsága)", min: 1, max: 4, step: 0.5, value: state.d, onInput: (value) => { state.d = value; renderComposite(); } });
  const stepToggle = toggle("a két tükörkép", true, () => { state.steps = !state.steps; stepToggle.setAttribute("aria-pressed", String(state.steps)); renderComposite(); }, PALETTE.violet);
  const vectorToggle = toggle("eltolásvektor (2d)", false, () => { state.vector = !state.vector; vectorToggle.setAttribute("aria-pressed", String(state.vector)); renderComposite(); }, PALETTE.red);
  const compositeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Két párhuzamos tengelyre tükrözés egymás után" });
  grid(compositeFigure);
  const compositeLayer = svg("g", {}, compositeFigure);
  const relationLine = make("div");
  const compositeMessage = make("p", "il-message");
  composite.append(controls(sliderD.element, stepToggle, vectorToggle), compositeFigure, relationLine, compositeMessage);

  function renderComposite() {
    const { d } = state, secondAxis = FIRST_AXIS + d;
    const first = SHAPE2.map(([x, y]) => [2 * FIRST_AXIS - x, y]);
    const second = first.map(([x, y]) => [2 * secondAxis - x, y]);
    compositeLayer.replaceChildren();
    const axis = (x, color, label) => {
      svg("line", { x1: toView([x, 0])[0], x2: toView([x, 0])[0], y1: 0, y2: 340, style: `stroke:${color};stroke-width:3` }, compositeLayer);
      svg("text", { x: toView([x, 0])[0] + 6, y: 20, text: label, style: `font-weight:700;fill:${color}` }, compositeLayer);
    };
    axis(FIRST_AXIS, PALETTE.violet, "e₁");
    axis(secondAxis, PALETTE.amber, "e₂");
    const polygon = (points, color, label) => {
      svg("polygon", { points: pointsOf(points.map(toView)), style: `fill:${color};fill-opacity:.4;stroke:var(--fg);stroke-width:2.5` }, compositeLayer);
      const [x, y] = toView(points[0]);
      svg("text", { x: x + 10, y: y - 10, text: label, style: "font-weight:700;font-size:16px;fill:var(--fg)" }, compositeLayer);
    };
    polygon(SHAPE2, PALETTE.blue, "A");
    if (state.steps) polygon(first, PALETTE.violet, "A′");
    polygon(second, PALETTE.amber, "A″");
    const [ax, ay] = toView([FIRST_AXIS, -3.4]), [bx] = toView([secondAxis, -3.4]);
    arrow(compositeLayer, [ax, ay], [bx, ay], "var(--fg)", 2);
    arrow(compositeLayer, [bx, ay], [ax, ay], "var(--fg)", 2);
    svg("text", { x: (ax + bx) / 2, y: ay - 8, "text-anchor": "middle", text: `d = ${formatNumber(d)}`, style: "font-weight:700;fill:var(--fg)" }, compositeLayer);
    if (state.vector) {
      const start = toView(SHAPE2[0]), end = toView(second[0]);
      arrow(compositeLayer, [start[0], start[1] - 4], [end[0], end[1] - 4], PALETTE.red, 3.5);
      svg("text", { x: (start[0] + end[0]) / 2, y: start[1] - 14, "text-anchor": "middle", text: `2d = ${formatNumber(2 * d)}`, style: `font-weight:700;fill:${PALETTE.red}` }, compositeLayer);
    }
    relationLine.replaceChildren(equation(`d = ${formatNumber(d)}`, slot(`eltolás ${formatNumber(2 * d)} egységgel, a tengelyekre merőlegesen`, 44, { align: "left" })));
    compositeMessage.textContent = "Az első tükrözés megfordítja a körüljárást, a második visszafordítja. A két tükrözés együtt a tengelyekre merőleges eltolás, és a hossza a tengelyek távolságának kétszerese.";
  }

  root.append(main, composite, keyIdea("az eltolás minden pontot ugyanazzal a vektorral mozgat: a pont és a képe közötti szakasz mindenhol egyforma hosszú és párhuzamos. Két párhuzamos tengelyre tükrözve a tengelyek távolságának kétszeresével tolunk el."));
  renderMain();
  renderComposite();
  return () => {};
}
