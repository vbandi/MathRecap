import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170, TURN_MS = 2000;
const RAD = Math.PI / 180;
const toView = ([x, y]) => [CX + x * UNIT, CY - y * UNIT];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const snap = (value) => Math.round(value * 2) / 2;
// Counter-clockwise rotation (radians) around a centre; y points up.
const rotateAround = ([x, y], [ox, oy], angle) => [ox + (x - ox) * Math.cos(angle) - (y - oy) * Math.sin(angle), oy + (x - ox) * Math.sin(angle) + (y - oy) * Math.cos(angle)];
const reflectInAxis = ([x, y], angle) => [x * Math.cos(2 * angle) + y * Math.sin(2 * angle), x * Math.sin(2 * angle) - y * Math.cos(2 * angle)];

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

function gridLines(figure) {
  for (let i = -7; i <= 7; i++) svg("line", { class: "grid", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: "grid", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Forgatásnál van egy középpont és egy szög. Minden pont a középpont körül körívet fut be, a középponttól mért távolsága közben nem változik. A pozitív szög az óramutatóval ellentétes irány."));

  // --- Card 1 ---
  const triangle = [[2, 1], [4, 2], [2, 3]];
  const centre = [-1, 0];
  const names = ["A", "B", "C"];
  const state = { angle: 90 };
  let shownAngle = state.angle;
  const main = card("Forgass a középpont körül");
  const sliderAngle = range({ label: "φ (forgásszög)", min: -180, max: 180, step: 5, value: state.angle, format: (value) => `${formatNumber(value)}°`, onInput: (value) => { stopAnimation(); state.angle = shownAngle = value; renderMain(); } });
  const playButton = button("Forgatás animációval", play);
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Háromszög elforgatása a középpont körül" });
  gridLines(figure);
  const imageShape = svg("polygon", { style: `fill:${PALETTE.violet};fill-opacity:.4;stroke:var(--fg);stroke-width:2.5` }, figure);
  const originalShape = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.45;stroke:var(--fg);stroke-width:2.5` }, figure);
  const layer = svg("g", {}, figure);
  const handles = triangle.map((_, index) => addHandle(figure, figure, PALETTE.blue, (x, y) => {
    triangle[index] = [clamp(snap((x - CX) / UNIT), -7, 7), clamp(snap((CY - y) / UNIT), -4, 4)];
    stopAnimation(); renderMain();
  }));
  const centreHandle = addHandle(figure, figure, PALETTE.red, (x, y) => {
    centre[0] = clamp(snap((x - CX) / UNIT), -7, 7); centre[1] = clamp(snap((CY - y) / UNIT), -4, 4);
    stopAnimation(); renderMain();
  });
  const angleLine = make("div"), distanceLine = make("div");
  const message = make("p", "il-message");
  main.append(controls(sliderAngle.element, playButton), figure, angleLine, distanceLine, message);

  function stopAnimation() { scope.clearAll(); playButton.disabled = false; shownAngle = state.angle; }

  function play() {
    scope.clearAll();
    playButton.disabled = true;
    let start = null;
    const step = (time) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / TURN_MS);
      shownAngle = state.angle * progress;
      renderMain();
      if (progress < 1) scope.frame(step); else playButton.disabled = false;
    };
    scope.frame(step);
  }

  function renderMain() {
    const angle = shownAngle * RAD;
    const image = triangle.map((p) => rotateAround(p, centre, angle));
    layer.replaceChildren();
    originalShape.setAttribute("points", pointsOf(triangle.map(toView)));
    imageShape.setAttribute("points", pointsOf(image.map(toView)));
    const [ox, oy] = toView(centre);
    triangle.forEach((point, index) => {
      const radius = Math.hypot(point[0] - centre[0], point[1] - centre[1]) * UNIT;
      const [x1, y1] = toView(point), [x2, y2] = toView(image[index]);
      if (Math.abs(shownAngle) > 0.5 && radius > 0) {
        svg("path", { d: `M ${x1} ${y1} A ${radius} ${radius} 0 0 ${shownAngle > 0 ? 0 : 1} ${x2} ${y2}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2;stroke-dasharray:5 4" }, layer);
      }
      svg("text", { x: x1 + 12, y: y1 - 10, text: names[index], style: `font-weight:700;font-size:16px;fill:${PALETTE.blue}` }, layer);
      svg("text", { x: x2 + 12, y: y2 - 10, text: `${names[index]}′`, style: `font-weight:700;font-size:16px;fill:${PALETTE.violet}` }, layer);
      handles[index].place(x1, y1);
    });
    const [ax, ay] = toView(triangle[0]), [bx, by] = toView(image[0]);
    svg("line", { x1: ox, y1: oy, x2: ax, y2: ay, style: `stroke:${PALETTE.red};stroke-width:1.5` }, layer);
    svg("line", { x1: ox, y1: oy, x2: bx, y2: by, style: `stroke:${PALETTE.red};stroke-width:1.5` }, layer);
    svg("text", { x: ox + 12, y: oy + 22, text: "O", style: `font-weight:700;font-size:16px;fill:${PALETTE.red}` }, layer);
    centreHandle.place(ox, oy);
    const distance = Math.hypot(triangle[0][0] - centre[0], triangle[0][1] - centre[1]);
    angleLine.replaceChildren(equation("∠AOA′ = ∠BOB′ = ∠COC′", slot(`${formatNumber(Math.abs(shownAngle), 0)}°`, 10, { align: "left" })));
    distanceLine.replaceChildren(equation("OA = OA′", slot(`${formatNumber(distance, 2)}`, 10, { align: "left" })));
    message.textContent = Math.abs(state.angle) < 1 ? "Állítsd a φ szöget nullától eltérőre."
      : `Minden pont ugyanakkora szöggel fordult el O körül (${state.angle > 0 ? "az óramutatóval ellentétesen" : "az óramutató járásával megegyezően"}). A szaggatott ívek a pontok útját mutatják. Húzd a piros középpontot is!`;
  }

  // --- Card 2: two reflections ---
  const composite = card("Két tengelyes tükrözés = forgatás");
  const shape = [[1.5, 0.5], [3.5, 1], [2, 2.5]];
  const view = { first: true, second: true, rotation: false };
  const phiState = { phi: 30 };
  const sliderPhi = range({ label: "φ (a két tengely szöge)", min: 10, max: 90, step: 5, value: phiState.phi, format: (value) => `${value}°`, onInput: (value) => { phiState.phi = value; renderComposite(); } });
  const toggles = [
    toggle("1. tükrözés (e₁)", true, () => flip("first"), PALETTE.violet),
    toggle("2. tükrözés (e₂)", true, () => flip("second"), PALETTE.amber),
    toggle("forgatás 2φ-vel", false, () => flip("rotation"), PALETTE.green),
  ];
  function flip(key) { view[key] = !view[key]; toggles[["first", "second", "rotation"].indexOf(key)].setAttribute("aria-pressed", String(view[key])); renderComposite(); }
  const compositeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Két tengelyes tükrözés egymás után" });
  gridLines(compositeFigure);
  const compositeLayer = svg("g", {}, compositeFigure);
  const relationLine = make("div");
  const compositeMessage = make("p", "il-message");
  composite.append(controls(sliderPhi.element), controls(...toggles), compositeFigure, relationLine, compositeMessage);

  function renderComposite() {
    const phi = phiState.phi * RAD;
    const first = shape.map((p) => reflectInAxis(p, 0)), second = first.map((p) => reflectInAxis(p, phi));
    const target = shape.map((p) => rotateAround(p, [0, 0], 2 * phi));
    compositeLayer.replaceChildren();
    const axisLine = (angle, color, label) => {
      const [x1, y1] = toView([-9 * Math.cos(angle), -9 * Math.sin(angle)]), [x2, y2] = toView([9 * Math.cos(angle), 9 * Math.sin(angle)]);
      svg("line", { x1, y1, x2, y2, style: `stroke:${color};stroke-width:3` }, compositeLayer);
      const [lx, ly] = toView([3.9 * Math.cos(angle), 3.9 * Math.sin(angle)]);
      svg("text", { x: lx, y: ly - 6, text: label, style: `font-weight:700;fill:${color}` }, compositeLayer);
    };
    axisLine(0, PALETTE.violet, "e₁");
    axisLine(phi, PALETTE.amber, "e₂");
    const polygon = (points, color, dashed, label, filled = true) => {
      svg("polygon", { points: pointsOf(points.map(toView)), style: `fill:${filled ? color : "none"};fill-opacity:.4;stroke:${dashed ? color : "var(--fg)"};stroke-width:${dashed ? 3.5 : 2.5};stroke-dasharray:${dashed ? "8 6" : "0"}` }, compositeLayer);
      const [x, y] = toView(points[0]);
      if (label) svg("text", { x: x + 10, y: y - 10, text: label, style: `font-weight:700;font-size:16px;fill:var(--fg)` }, compositeLayer);
    };
    if (view.rotation) polygon(target, PALETTE.green, true, "", false);
    polygon(shape, PALETTE.blue, false, "A");
    if (view.first) polygon(first, PALETTE.violet, false, "A′");
    if (view.second) polygon(second, PALETTE.amber, false, "A″");
    if (view.second) {
      const [ox, oy] = toView([0, 0]), [px, py] = toView(shape[0]), [qx, qy] = toView(second[0]);
      const radius = Math.hypot(shape[0][0], shape[0][1]) * UNIT;
      svg("path", { d: `M ${px} ${py} A ${radius} ${radius} 0 0 0 ${qx} ${qy}`, fill: "none", style: `stroke:${PALETTE.green};stroke-width:2;stroke-dasharray:4 4` }, compositeLayer);
      svg("circle", { cx: ox, cy: oy, r: 5, style: "fill:var(--fg)" }, compositeLayer);
    }
    relationLine.replaceChildren(equation(`e₁ és e₂ szöge: ${phiState.phi}°`, slot(`forgatás ${2 * phiState.phi}°-kal`, 22, { align: "left" })));
    compositeMessage.textContent = view.rotation
      ? "A zöld szaggatott kép az A alakzat forgatottja 2φ-vel a tengelyek metszéspontja körül: pontosan ott van, ahová a két tükrözés vitte."
      : "Először tükrözd az alakzatot e₁-re (lila), aztán a kapott képet e₂-re (narancs). Kapcsold be a forgatást, és nézd meg, hogy a végeredmény egy 2φ-s elforgatás.";
  }

  root.append(main, composite, keyIdea("a forgatást a középpont és a forgásszög határozza meg; a pontok körívek mentén mozognak, a középponttól mért távolságuk állandó. Két metsző tengelyre egymás után tükrözve a tengelyek szögének kétszeresével forgatunk."));
  renderMain();
  renderComposite();
  return () => scope.clearAll();
}
