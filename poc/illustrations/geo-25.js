import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170, SHAPE_SCALE = 50, SPIN_MS = 2200;
const toView = ([x, y], scale = UNIT, cx = CX, cy = CY) => [cx + x * scale, cy - y * scale];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const snap = (value) => Math.round(value * 2) / 2;
const signedArea = (points) => points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const sameVertices = (first, second) => first.every((p) => second.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6));
// Counter-clockwise rotation by angle (radians) around a centre; y points up.
const rotateAround = ([x, y], [ox, oy], angle) => [ox + (x - ox) * Math.cos(angle) - (y - oy) * Math.sin(angle), oy + (x - ox) * Math.sin(angle) + (y - oy) * Math.cos(angle)];

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
  { name: "Paralelogramma", points: [[-1.8, -1], [0.6, -1], [1.8, 1], [-0.6, 1]] },
  { name: "S alakzat", points: [[-1.4, -1.4], [1.4, -1.4], [1.4, -0.8], [-0.5, 0.8], [1.4, 0.8], [1.4, 1.4], [-1.4, 1.4], [-1.4, 0.8], [0.5, -0.8], [-1.4, -0.8]] },
  { name: "Z alakzat", points: [[1.4, -1.4], [-1.4, -1.4], [-1.4, -0.8], [0.5, 0.8], [-1.4, 0.8], [-1.4, 1.4], [1.4, 1.4], [1.4, 0.8], [-0.5, -0.8], [1.4, -0.8]] },
  { name: "Négyzet", points: [[-1.2, -1.2], [1.2, -1.2], [1.2, 1.2], [-1.2, 1.2]] },
  { name: "Szimmetrikus trapéz", points: [[-1.6, -1], [1.6, -1], [0.9, 1], [-0.9, 1]] },
  { name: "Háromszög", points: [[0, 1.4], [-1.2, -0.7], [1.2, -0.7]] },
];
SHAPES.forEach((shape) => { shape.symmetric = sameVertices(shape.points.map((p) => rotateAround(p, [0, 0], Math.PI)), shape.points); });

export function mount(root) {
  const scope = createScope();
  root.append(lead("Középpontos tükrözésnél minden pontot átviszünk a középponton, és ugyanolyan messze a másik oldalon tesszük le. A kép ugyanaz, mintha az alakzatot fél fordulattal elforgatnád a középpont körül."));

  // --- Card 1 ---
  const triangle = [[-5, 1], [-2, 2], [-3, -2]];
  const centre = [0.5, 0];
  const names = ["A", "B", "C"];
  const main = card("Tükrözés a középpontra");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Háromszög és a középpontos tükörképe" });
  for (let i = -7; i <= 7; i++) svg("line", { class: "grid", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: "grid", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
  const imageShape = svg("polygon", { style: `fill:${PALETTE.violet};fill-opacity:.35;stroke:var(--fg);stroke-width:2.5` }, figure);
  const originalShape = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.45;stroke:var(--fg);stroke-width:2.5` }, figure);
  const spinner = svg("polygon", { style: `fill:${PALETTE.amber};fill-opacity:.5;stroke:var(--fg);stroke-width:2.5;stroke-dasharray:6 5`, opacity: 0 }, figure);
  const layer = svg("g", {}, figure);
  const triangleHandles = triangle.map((_, index) => addHandle(figure, figure, PALETTE.blue, (x, y) => {
    triangle[index] = [clamp(snap((x - CX) / UNIT), -7, 7), clamp(snap((CY - y) / UNIT), -4, 4)];
    stopSpin(); renderMain();
  }));
  const centreHandle = addHandle(figure, figure, PALETTE.red, (x, y) => {
    centre[0] = clamp(snap((x - CX) / UNIT), -7, 7); centre[1] = clamp(snap((CY - y) / UNIT), -4, 4);
    stopSpin(); renderMain();
  });
  const spinButton = button("Forgatás 180°-kal", spin);
  const distanceLines = names.map(() => make("div"));
  const message = make("p", "il-message");
  main.append(figure, controls(spinButton), ...distanceLines, message);

  function stopSpin() { scope.clearAll(); spinner.setAttribute("opacity", 0); spinButton.disabled = false; }

  function spin() {
    stopSpin();
    spinButton.disabled = true;
    spinner.setAttribute("opacity", 1);
    let start = null;
    const step = (time) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / SPIN_MS);
      spinner.setAttribute("points", pointsOf(triangle.map((p) => toView(rotateAround(p, centre, Math.PI * progress)))));
      if (progress < 1) scope.frame(step);
      else { spinButton.disabled = false; scope.timeout(() => spinner.setAttribute("opacity", 0), 900); }
    };
    scope.frame(step);
  }

  function renderMain() {
    const image = triangle.map(([x, y]) => [2 * centre[0] - x, 2 * centre[1] - y]);
    layer.replaceChildren();
    originalShape.setAttribute("points", pointsOf(triangle.map((p) => toView(p))));
    imageShape.setAttribute("points", pointsOf(image.map((p) => toView(p))));
    triangle.forEach((point, index) => {
      const [x1, y1] = toView(point), [x2, y2] = toView(image[index]);
      svg("line", { x1, y1, x2, y2, style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:5 4" }, layer);
      svg("text", { x: x1 + 12, y: y1 - 10, text: names[index], style: `font-weight:700;font-size:16px;fill:${PALETTE.blue}` }, layer);
      svg("text", { x: x2 + 12, y: y2 - 10, text: `${names[index]}′`, style: `font-weight:700;font-size:16px;fill:${PALETTE.violet}` }, layer);
      triangleHandles[index].place(x1, y1);
      const distance = Math.hypot(point[0] - centre[0], point[1] - centre[1]);
      distanceLines[index].replaceChildren(equation(`${names[index]}O`, slot(`${formatNumber(distance, 2)}   =   ${names[index]}′O: ${formatNumber(distance, 2)}`, 28, { align: "left" })));
    });
    const [ox, oy] = toView(centre);
    svg("text", { x: ox + 12, y: oy + 22, text: "O", style: `font-weight:700;font-size:16px;fill:${PALETTE.red}` }, layer);
    centreHandle.place(ox, oy);
    const direction = (points) => (signedArea(points) < 0 ? "óramutató járásával megegyező" : "óramutatóval ellentétes");
    message.textContent = `Mindhárom szakasz átmegy O-n, és O felezi őket. A körüljárás nem változik: A → B → C ${direction(triangle)}, és A′ → B′ → C′ is ${direction(image)}. Nyomd meg a gombot: a fél fordulat ugyanoda viszi az alakzatot.`;
  }

  // --- Card 2 ---
  const symmetry = card("Melyik alakzat középpontosan szimmetrikus?");
  const state = { shape: 0, angle: 0 };
  const shapeToggles = SHAPES.map((shape, index) => toggle(shape.name, index === 0, () => { state.shape = index; renderSymmetry(); }));
  const sliderAngle = range({ label: "elforgatás a középpont körül", min: 0, max: 180, step: 5, value: 0, format: (value) => `${value}°`, onInput: (value) => { state.angle = value; renderSymmetry(); } });
  const quarterButton = button("180°", () => { state.angle = 180; sliderAngle.set(180); renderSymmetry(); }, { ghost: true });
  const symmetryFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Alakzat és elforgatott képe" });
  const symmetryLayer = svg("g", {}, symmetryFigure);
  const symmetryMessage = make("p", "il-message");
  symmetry.append(controls(...shapeToggles), controls(sliderAngle.element, quarterButton), symmetryFigure, symmetryMessage);

  function renderSymmetry() {
    shapeToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(index === state.shape)));
    const shape = SHAPES[state.shape], angle = state.angle * Math.PI / 180;
    const cx = 300, cy = 150, rotated = shape.points.map((p) => rotateAround(p, [0, 0], angle));
    const match = sameVertices(rotated, shape.points);
    symmetryLayer.replaceChildren();
    svg("polygon", { points: pointsOf(rotated.map((p) => toView(p, SHAPE_SCALE, cx, cy))), style: `fill:none;stroke:${match && state.angle > 0 ? PALETTE.green : PALETTE.violet};stroke-width:3.5;stroke-dasharray:8 6` }, symmetryLayer);
    svg("polygon", { points: pointsOf(shape.points.map((p) => toView(p, SHAPE_SCALE, cx, cy))), style: `fill:${PALETTE.blue};fill-opacity:.5;stroke:var(--fg);stroke-width:2.5` }, symmetryLayer);
    svg("circle", { cx, cy, r: 5, style: `fill:${PALETTE.red}` }, symmetryLayer);
    const full = state.angle === 180;
    symmetryMessage.className = `il-message ${full && shape.symmetric ? "good" : full ? "warn" : ""}`;
    symmetryMessage.textContent = full
      ? shape.symmetric ? "Fél fordulat után az alakzat pontosan önmagára illik: középpontosan szimmetrikus. A középpont a szemközti pontok felezőpontja."
        : "Fél fordulat után az alakzat nem illik önmagára (a szaggatott vonal eltér), tehát nem középpontosan szimmetrikus."
      : "Forgasd el az alakzatot a piros középpont körül 180°-ig. Fedi-e a szaggatott kép az eredetit?";
  }

  root.append(main, symmetry, keyIdea("a középpontos tükrözés egy 180°-os forgatás. Egy alakzat középpontosan szimmetrikus, ha a fél fordulat önmagára viszi; ilyen a paralelogramma, a négyzet, az S és a Z alakzat, de a trapéz vagy a háromszög nem."));
  renderMain();
  renderSymmetry();
  return () => scope.clearAll();
}
