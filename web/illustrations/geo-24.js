import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170, SHAPE_SCALE = 50;
const RAD = Math.PI / 180;
const toView = ([x, y], scale = UNIT, cx = CX, cy = CY) => [cx + x * scale, cy - y * scale];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const snap = (value) => Math.round(value * 2) / 2;

// Mirror image of a point in the line through p with direction angle (radians, y up).
function reflectInLine(point, through, angle) {
  const ux = Math.cos(angle), uy = Math.sin(angle);
  const dx = point[0] - through[0], dy = point[1] - through[1];
  const along = dx * ux + dy * uy;
  return [through[0] + 2 * along * ux - dx, through[1] + 2 * along * uy - dy];
}
const signedArea = (points) => points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const sameVertices = (first, second) => first.length === second.length && first.every((p) => second.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6));

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

const SHAPES = [
  { name: "H betű", points: [[-1.2, 1.6], [-0.6, 1.6], [-0.6, 0.3], [0.6, 0.3], [0.6, 1.6], [1.2, 1.6], [1.2, -1.6], [0.6, -1.6], [0.6, -0.3], [-0.6, -0.3], [-0.6, -1.6], [-1.2, -1.6]] },
  { name: "A betű", points: [[-0.4, 1.6], [0.4, 1.6], [1.3, -1.6], [0.6, -1.6], [0.45, -0.8], [-0.45, -0.8], [-0.6, -1.6], [-1.3, -1.6]] },
  { name: "F betű", points: [[-0.8, 1.6], [0.9, 1.6], [0.9, 1], [-0.2, 1], [-0.2, 0.3], [0.6, 0.3], [0.6, -0.3], [-0.2, -0.3], [-0.2, -1.6], [-0.8, -1.6]] },
  { name: "Téglalap", points: [[-1.6, 1], [1.6, 1], [1.6, -1], [-1.6, -1]] },
  { name: "Négyzet", points: [[-1.2, 1.2], [1.2, 1.2], [1.2, -1.2], [-1.2, -1.2]] },
  { name: "Szabályos háromszög", points: [[0, 1.4], [-1.4 * Math.cos(30 * RAD), -0.7], [1.4 * Math.cos(30 * RAD), -0.7]] },
];
const ANGLES = Array.from({ length: 36 }, (_, i) => i * 5);
const isAxis = (shape, angle) => sameVertices(shape.points.map((p) => reflectInLine(p, [0, 0], angle * RAD)), shape.points);
SHAPES.forEach((shape) => { shape.axes = ANGLES.filter((angle) => isAxis(shape, angle)); shape.found = new Set(); });

export function mount(root) {
  root.append(lead("Tengelyes tükrözésnél minden pontnak megkeressük a tükörképét a tengely másik oldalán, ugyanolyan messze a tengelytől. A tengely a pont és a képe távolságának felezőmerőlegese."));

  // --- Card 1: reflect a triangle ---
  const triangle = [[-5, -1], [-2, -2], [-4, 2]];
  const axis = [[1, -3], [2, 3]];
  const names = ["A", "B", "C"];
  const main = card("Tükrözz háromszöget");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Háromszög és tükörképe a tengely két oldalán" });
  for (let i = -7; i <= 7; i++) svg("line", { class: "grid", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: "grid", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
  const axisLine = svg("line", { style: `stroke:${PALETTE.red};stroke-width:3` }, figure);
  const imageShape = svg("polygon", { style: `fill:${PALETTE.violet};fill-opacity:.35;stroke:var(--fg);stroke-width:2.5;stroke-dasharray:0` }, figure);
  const originalShape = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.45;stroke:var(--fg);stroke-width:2.5` }, figure);
  const layer = svg("g", {}, figure);
  const triangleHandles = triangle.map((_, index) => addHandle(figure, figure, PALETTE.blue, (x, y) => {
    triangle[index] = [clamp(snap((x - CX) / UNIT), -7, 7), clamp(snap((CY - y) / UNIT), -4, 4)];
    renderMain();
  }));
  const axisHandles = axis.map((_, index) => addHandle(figure, figure, PALETTE.red, (x, y) => {
    axis[index] = [clamp(snap((x - CX) / UNIT), -7, 7), clamp(snap((CY - y) / UNIT), -4, 4)];
    renderMain();
  }));
  const distanceLines = names.map(() => make("div"));
  const orientationLine = make("div");
  const message = make("p", "il-message");
  main.append(figure, ...distanceLines, orientationLine, message);

  function renderMain() {
    const [p, q] = axis;
    const degenerate = p[0] === q[0] && p[1] === q[1];
    const angle = degenerate ? 0 : Math.atan2(q[1] - p[1], q[0] - p[0]);
    const image = triangle.map((point) => degenerate ? point : reflectInLine(point, p, angle));
    layer.replaceChildren();
    const far = 40;
    const a1 = toView([p[0] - far * Math.cos(angle), p[1] - far * Math.sin(angle)]), a2 = toView([p[0] + far * Math.cos(angle), p[1] + far * Math.sin(angle)]);
    Object.entries({ x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1] }).forEach(([name, value]) => axisLine.setAttribute(name, value));
    originalShape.setAttribute("points", pointsOf(triangle.map((point) => toView(point))));
    imageShape.setAttribute("points", pointsOf(image.map((point) => toView(point))));
    triangle.forEach((point, index) => {
      const [x1, y1] = toView(point), [x2, y2] = toView(image[index]);
      svg("line", { x1, y1, x2, y2, style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:5 4" }, layer);
      const foot = toView([(point[0] + image[index][0]) / 2, (point[1] + image[index][1]) / 2]);
      svg("circle", { cx: foot[0], cy: foot[1], r: 3.5, style: "fill:var(--fg)" }, layer);
      svg("text", { x: x1 + 12, y: y1 - 10, text: names[index], style: `font-weight:700;font-size:16px;fill:${PALETTE.blue}` }, layer);
      svg("text", { x: x2 + 12, y: y2 - 10, text: `${names[index]}′`, style: `font-weight:700;font-size:16px;fill:${PALETTE.violet}` }, layer);
      triangleHandles[index].place(x1, y1);
      const distance = degenerate ? 0 : Math.abs(-Math.sin(angle) * (point[0] - p[0]) + Math.cos(angle) * (point[1] - p[1]));
      distanceLines[index].replaceChildren(equation(`${names[index]} távolsága a tengelytől`, slot(`${formatNumber(distance, 2)}   =   ${names[index]}′ távolsága: ${formatNumber(distance, 2)}`, 34, { align: "left" })));
    });
    axisHandles.forEach((handle, index) => handle.place(...toView(axis[index])));
    const clockwise = (points) => (signedArea(points) < 0 ? "óramutató járásával megegyező" : "óramutatóval ellentétes");
    orientationLine.replaceChildren(equation("A → B → C körüljárása", slot(`${clockwise(triangle)}`, 34, { align: "left" })));
    message.textContent = degenerate
      ? "Húzd szét a két piros pontot: ezek határozzák meg a tengelyt."
      : `A → B → C körüljárása ${clockwise(triangle)}, A′ → B′ → C′ körüljárása pedig ${clockwise(image)}: a tükrözés megfordítja a betűsorrendet. A szaggatott szakaszok merőlegesek a tengelyre, és a tengely felezi őket.`;
  }

  // --- Card 2: find the axes of symmetry ---
  const symmetry = card("Keresd meg a szimmetriatengelyeket");
  const state = { shape: 0, angle: 0 };
  const shapeToggles = SHAPES.map((shape, index) => toggle(shape.name, index === 0, () => { state.shape = index; state.angle = 0; sliderAngle.set(0); renderSymmetry(); }));
  const sliderAngle = range({ label: "a tengely iránya", min: 0, max: 175, step: 5, value: 0, format: (value) => `${value}°`, onInput: (value) => { state.angle = value; renderSymmetry(); } });
  const symmetryFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Alakzat és tükörképe a forgatható tengelyre" });
  const symmetryLayer = svg("g", {}, symmetryFigure);
  const foundLine = make("div");
  const symmetryMessage = make("p", "il-message");
  symmetry.append(controls(...shapeToggles), controls(sliderAngle.element), symmetryFigure, foundLine, symmetryMessage);

  function renderSymmetry() {
    shapeToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(index === state.shape)));
    const shape = SHAPES[state.shape], angle = state.angle * RAD, cx = 300, cy = 150;
    const on = isAxis(shape, state.angle);
    if (on) shape.found.add(state.angle);
    symmetryLayer.replaceChildren();
    const far = 400;
    svg("line", { x1: cx - far * Math.cos(angle), y1: cy + far * Math.sin(angle), x2: cx + far * Math.cos(angle), y2: cy - far * Math.sin(angle), style: `stroke:${PALETTE.red};stroke-width:3` }, symmetryLayer);
    const image = shape.points.map((point) => reflectInLine(point, [0, 0], angle));
    svg("polygon", { points: pointsOf(image.map((point) => toView(point, SHAPE_SCALE, cx, cy))), style: `fill:none;stroke:${on ? PALETTE.green : PALETTE.violet};stroke-width:3.5;stroke-dasharray:8 6` }, symmetryLayer);
    svg("polygon", { points: pointsOf(shape.points.map((point) => toView(point, SHAPE_SCALE, cx, cy))), style: `fill:${on ? PALETTE.green : PALETTE.blue};fill-opacity:.5;stroke:var(--fg);stroke-width:2.5` }, symmetryLayer);
    foundLine.replaceChildren(equation("megtalált tengelyek", slot(`${shape.found.size} / ${shape.axes.length}`, 12, { align: "left" })));
    symmetryMessage.className = `il-message ${on ? "good" : ""}`;
    symmetryMessage.textContent = on
      ? `Ez szimmetriatengely (${state.angle}°): a tükörkép pontosan ráfekszik az alakzatra.`
      : shape.axes.length === 0 ? "Forgasd a tengelyt: ennek az alakzatnak nincs szimmetriatengelye. Bármelyik irányba tükrözöd, más lesz a kép."
        : "Forgasd a piros tengelyt. Akkor találtad meg a tengelyt, ha a szaggatott tükörkép pontosan fedi az alakzatot.";
  }

  root.append(main, symmetry, keyIdea("a tengelyes tükrözés a pontot a tengely másik oldalára viszi, ugyanakkora távolságra. A tükörkép egybevágó az eredetivel, de a körüljárása ellentétes. Ha egy alakzat tükörképe fedi önmagát, a tengely szimmetriatengely."));
  renderMain();
  renderSymmetry();
  return () => {};
}
