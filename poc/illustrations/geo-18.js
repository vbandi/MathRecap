import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40;
const snap = (value) => Math.round(value * 2) / 2;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// A draggable round handle; moves through onMove(x, y) in SVG user units.
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
  return { group, place(x, y) { group.setAttribute("transform", `translate(${x} ${y})`); } };
}

const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const shoelace = (points) => Math.abs(points.reduce((sum, [x1, y1], i) => { const [x2, y2] = points[(i + 1) % points.length]; return sum + x1 * y2 - x2 * y1; }, 0)) / 2;

export function mount(root) {
  root.append(lead("A háromszög területe az alap és a hozzá tartozó magasság szorzatának fele. A magasság az alappal párhuzamos egyenesek távolsága, nem az oldal hossza."));

  // --- Card 1: sliding apex and doubling ---
  const state = { apexX: 3, height: 3, doubled: false };
  const BASE = 6, baseLeft = 1;
  const slide = card("Húzd a csúcsot az alappal párhuzamos egyenesen");
  const sliderHeight = range({ label: "magasság (m)", min: 1, max: 5, value: state.height, onInput: (value) => { state.height = value; renderSlide(); } });
  const doubleToggle = toggle("Megkettőzés paralelogrammává", false, () => { state.doubled = !state.doubled; doubleToggle.setAttribute("aria-pressed", String(state.doubled)); renderSlide(true); });
  const slideFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 270", role: "img", "aria-label": "Háromszög, amelynek csúcsa az alappal párhuzamos egyenesen mozog" });
  const slideEquation = make("div");
  const slideMessage = make("p", "il-message");
  slide.append(controls(sliderHeight.element, doubleToggle), slideFigure, slideEquation, slideMessage);

  const view1 = (x, y) => [30 + x * UNIT, 235 - y * UNIT];
  svg("line", { class: "axis", x1: 10, x2: 590, y1: 235, y2: 235 }, slideFigure);
  const parallelLine = svg("line", { x1: 10, x2: 590, style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:7 6" }, slideFigure);
  const copy = svg("polygon", { style: `fill:${PALETTE.violet};fill-opacity:.45;stroke:var(--fg-soft);stroke-width:2;transition:transform .8s cubic-bezier(.45,0,.2,1),opacity .4s;transform-box:view-box;transform-origin:0 0` }, slideFigure);
  const triangle = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.65;stroke:var(--fg);stroke-width:2.5` }, slideFigure);
  const heightLine = svg("line", { style: "stroke:var(--fg);stroke-width:2;stroke-dasharray:5 4" }, slideFigure);
  const labels = svg("g", {}, slideFigure);
  const apexHandle = addHandle(slideFigure, slideFigure, PALETTE.amber, (x) => {
    copy.style.transition = "none";
    state.apexX = clamp(snap((x - 30) / UNIT), 0, 14);
    renderSlide();
  });

  function renderSlide(animate = false) {
    const { apexX, height, doubled } = state;
    const a = [baseLeft, 0], b = [baseLeft + BASE, 0], c = [apexX, height];
    const [ax, ay] = view1(...a), [bx, by] = view1(...b), [cx, cy] = view1(...c);
    triangle.setAttribute("points", pointsOf([[ax, ay], [bx, by], [cx, cy]]));
    copy.setAttribute("points", pointsOf([[ax, ay], [bx, by], [cx, cy]]));
    if (animate) copy.style.transition = "";
    const mx = (bx + cx) / 2, my = (by + cy) / 2;
    copy.style.transform = `translate(${mx}px, ${my}px) rotate(${doubled ? 180 : 0}deg) translate(${-mx}px, ${-my}px)`;
    copy.style.opacity = doubled ? 1 : 0;
    parallelLine.setAttribute("y1", cy); parallelLine.setAttribute("y2", cy);
    heightLine.setAttribute("x1", cx); heightLine.setAttribute("x2", cx); heightLine.setAttribute("y1", cy); heightLine.setAttribute("y2", 235);
    apexHandle.place(cx, cy);
    labels.replaceChildren();
    svg("text", { x: (ax + bx) / 2, y: 255, "text-anchor": "middle", text: `a = ${BASE}`, style: "font-weight:700;fill:var(--fg)" }, labels);
    svg("text", { x: cx + 8, y: (cy + 235) / 2 + 5, text: `m = ${height}`, style: "font-weight:700;fill:var(--fg)" }, labels);
    svg("text", { x: 14, y: cy - 8, text: "ezen az egyenesen mozog a csúcs", style: "fill:var(--dim)" }, labels);
    const area = BASE * height / 2;
    slideEquation.replaceChildren(equation("T = a · m / 2", slot(`${BASE} · ${height} / 2 = ${formatNumber(area)}`, 16, { align: "left" })));
    slideMessage.className = "il-message good";
    slideMessage.textContent = doubled
      ? `Két egybevágó háromszögből paralelogramma lett: alapja ${BASE}, magassága ${height}, területe ${BASE * height}. A háromszög ennek a fele: ${formatNumber(area)}.`
      : "Mozgasd a sárga pontot balra-jobbra: az alap és a magasság nem változik, ezért a terület sem.";
  }

  // --- Card 2: any side can be the base ---
  const free = card("Bármelyik oldal lehet az alap");
  const points = [[1, 1], [8, 2], [4, 5]];
  const names = ["A", "B", "C"];
  let baseIndex = 0; // the base is the side from points[baseIndex] to points[baseIndex + 1]
  const sideNames = ["AB", "BC", "CA"];
  const sideToggles = sideNames.map((name, index) => toggle(`${name} oldal legyen az alap`, index === 0, () => { baseIndex = index; renderFree(); }));
  const freeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Háromszög az alapnak választott oldallal és a hozzá tartozó magassággal" });
  const freeEquation = make("div"), areaEquation = make("div");
  const freeMessage = make("p", "il-message");
  free.append(controls(...sideToggles), freeFigure, freeEquation, areaEquation, freeMessage);
  const view2 = (x, y) => [20 + x * UNIT, 280 - y * UNIT];
  for (let i = 0; i <= 14; i++) svg("line", { class: "grid", x1: 20 + i * UNIT, x2: 20 + i * UNIT, y1: 0, y2: 300 }, freeFigure);
  for (let i = 0; i <= 7; i++) svg("line", { class: "grid", x1: 0, x2: 600, y1: 280 - i * UNIT, y2: 280 - i * UNIT }, freeFigure);
  const freeTriangle = svg("polygon", { style: `fill:${PALETTE.green};fill-opacity:.3;stroke:var(--fg);stroke-width:2.5` }, freeFigure);
  const extension = svg("line", { style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:7 6" }, freeFigure);
  const baseLine = svg("line", { style: `stroke:${PALETTE.blue};stroke-width:6;stroke-linecap:round` }, freeFigure);
  const heightSegment = svg("line", { style: `stroke:${PALETTE.red};stroke-width:3;stroke-dasharray:6 4` }, freeFigure);
  const freeLabels = svg("g", {}, freeFigure);
  const handles = points.map((point, index) => addHandle(freeFigure, freeFigure, PALETTE.amber, (x, y) => {
    points[index] = [clamp(snap((x - 20) / UNIT), 0.5, 14), clamp(snap((280 - y) / UNIT), 0.5, 6.5)];
    renderFree();
  }));

  function renderFree() {
    sideToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(index === baseIndex)));
    const p = points.map(([x, y]) => view2(x, y));
    freeTriangle.setAttribute("points", pointsOf(p));
    const from = points[baseIndex], to = points[(baseIndex + 1) % 3], apex = points[(baseIndex + 2) % 3];
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
    const area = shoelace(points);
    let heightValue = 0;
    freeLabels.replaceChildren();
    if (length > 0) {
      const t = ((apex[0] - from[0]) * dx + (apex[1] - from[1]) * dy) / (length * length);
      const foot = [from[0] + t * dx, from[1] + t * dy];
      heightValue = 2 * area / length;
      const [fx, fy] = view2(...foot), [px, py] = view2(...apex);
      const [ex1, ey1] = view2(from[0] - dx * 0.5, from[1] - dy * 0.5), [ex2, ey2] = view2(to[0] + dx * 0.5, to[1] + dy * 0.5);
      Object.entries({ x1: ex1, y1: ey1, x2: ex2, y2: ey2 }).forEach(([name, value]) => extension.setAttribute(name, value));
      Object.entries({ x1: px, y1: py, x2: fx, y2: fy }).forEach(([name, value]) => heightSegment.setAttribute(name, value));
      svg("text", { x: (fx + px) / 2 + 8, y: (fy + py) / 2, text: "m", style: `font-weight:700;fill:${PALETTE.red}` }, freeLabels);
    }
    const [bx1, by1] = view2(...from), [bx2, by2] = view2(...to);
    Object.entries({ x1: bx1, y1: by1, x2: bx2, y2: by2 }).forEach(([name, value]) => baseLine.setAttribute(name, value));
    p.forEach(([x, y], index) => svg("text", { x: x + 12, y: y - 12, text: names[index], style: "font-weight:700;font-size:16px;fill:var(--fg)" }, freeLabels));
    handles.forEach((handle, index) => handle.place(...p[index]));
    freeEquation.replaceChildren(equation(`${sideNames[baseIndex].toLowerCase()} alap`, slot(`${formatNumber(length, 2)} hosszú, magassága ${formatNumber(heightValue, 2)}`, 34, { align: "left" })));
    areaEquation.replaceChildren(equation("T = alap · m / 2", slot(`${formatNumber(length * heightValue / 2, 2)}`, 34, { align: "left" })));
    freeMessage.textContent = "Húzd a sárga pontokat, és válts az alapok között: mindhárom oldallal ugyanaz a terület jön ki, mert a hosszabb oldalhoz kisebb magasság tartozik.";
  }

  root.append(slide, free, keyIdea("a háromszög területe alap · magasság / 2. A magasság a szemközti csúcsból az alapot tartalmazó egyenesre húzott merőleges szakasz, és bármelyik oldalt választhatod alapnak."));
  renderSlide();
  renderFree();
  return () => {};
}
