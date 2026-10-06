import { card, controls, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 340, MARGIN = 14;
const SNAP = 9, ON_LINE_TOLERANCE = 2;
const MODES = [
  { id: "segment", label: "Szakasz" },
  { id: "ray", label: "Félegyenes" },
  { id: "line", label: "Egyenes" },
];

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) onMove(...toSvgPoint(figure, event));
  });
}

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// Distance from the origin along a direction until the drawing area's border is reached.
function borderDistance([ox, oy], [dx, dy]) {
  const candidates = [];
  if (dx > 0) candidates.push((WIDTH - MARGIN - ox) / dx);
  if (dx < 0) candidates.push((MARGIN - ox) / dx);
  if (dy > 0) candidates.push((HEIGHT - MARGIN - oy) / dy);
  if (dy < 0) candidates.push((MARGIN - oy) / dy);
  return Math.min(...candidates);
}

function arrowHead(parent, [x, y], [dx, dy], color) {
  const length = Math.hypot(dx, dy), ux = dx / length, uy = dy / length;
  const points = [[x, y], [x - 14 * ux - 7 * uy, y - 14 * uy + 7 * ux], [x - 14 * ux + 7 * uy, y - 14 * uy - 7 * ux]];
  svg("polygon", { points: points.map((p) => p.join(",")).join(" "), style: `fill:${color}` }, parent);
}

export function mount(root) {
  const state = { mode: "segment", a: [170, 230], b: [340, 140], p: [440, 150] };

  root.append(lead("Két pont egyértelműen meghatároz egy egyenest. Attól függően, hogy hol állunk meg, háromféle vonalat kapunk: ha mindkét végén megállunk, szakaszt; ha csak az egyik végén, félegyenest; ha egyik végén sem, egyenest."));

  const main = card("Két pont, háromféle vonal");
  const modeButtons = MODES.map((mode) => toggle(mode.label, mode.id === state.mode, () => { state.mode = mode.id; render(); }, PALETTE.blue));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Két pont és a rajtuk átmenő vonal" });
  const indicators = make("div");
  indicators.style.cssText = "display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:10px";
  const message = make("p", "il-message");
  main.append(controls(...modeButtons), figure, indicators, message,
    make("p", "il-muted", "Húzd az A és B pontot, aztán a piros P pontot: az illeszkedés azt jelenti, hogy a pont rajta van a vonalon. A P pont rátapad a vonalra, ha közel viszed."));

  const dynamic = svg("g", {}, figure);
  const handles = {};
  for (const [key, name, color] of [["a", "A", PALETTE.blue], ["b", "B", PALETTE.blue], ["p", "P", PALETTE.red]]) {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 7.5, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
    const label = svg("text", { "text-anchor": "middle", text: name, style: `font-weight:700;fill:${color}` }, group);
    handles[key] = { group, label };
    makeDraggable(figure, group, (x, y) => {
      let point = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)];
      if (key === "p") point = snapToLine(point);
      state[key] = point;
      render();
    });
  }

  function lineGeometry() {
    const [ax, ay] = state.a, [bx, by] = state.b;
    const length = Math.hypot(bx - ax, by - ay) || 1;
    return { unit: [(bx - ax) / length, (by - ay) / length], length };
  }

  // Signed position along AB measured in units of |AB| (A = 0, B = 1) and distance from the line.
  function locate(point) {
    const { unit, length } = lineGeometry();
    const rx = point[0] - state.a[0], ry = point[1] - state.a[1];
    return { t: (rx * unit[0] + ry * unit[1]) / length, distance: Math.abs(rx * unit[1] - ry * unit[0]) };
  }

  function snapToLine(point) {
    const { unit, length } = lineGeometry();
    const { t, distance } = locate(point);
    if (distance > SNAP) return point;
    return [state.a[0] + unit[0] * t * length, state.a[1] + unit[1] * t * length];
  }

  function render() {
    modeButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(MODES[index].id === state.mode)));
    const { unit } = lineGeometry();
    const backward = [-unit[0], -unit[1]];
    const color = PALETTE.blue;
    dynamic.replaceChildren();

    const start = state.mode === "line" ? [state.a[0] + backward[0] * borderDistance(state.a, backward), state.a[1] + backward[1] * borderDistance(state.a, backward)] : state.a;
    const end = state.mode === "segment" ? state.b : [state.b[0] + unit[0] * borderDistance(state.b, unit), state.b[1] + unit[1] * borderDistance(state.b, unit)];
    svg("line", { x1: start[0], y1: start[1], x2: end[0], y2: end[1], style: `stroke:${color};stroke-width:3.5;stroke-linecap:round` }, dynamic);
    if (state.mode !== "segment") arrowHead(dynamic, end, unit, color);
    if (state.mode === "line") arrowHead(dynamic, start, backward, color);

    const { t, distance } = locate(state.p);
    const collinear = distance <= ON_LINE_TOLERANCE;
    const results = { line: collinear, ray: collinear && t >= -1e-9, segment: collinear && t >= -1e-9 && t <= 1 + 1e-9 };
    indicators.replaceChildren(...MODES.map((mode) => {
      const chip = make("span", "", `${results[mode.id] ? "✓" : "✗"} ${mode.label.toLowerCase()}`);
      chip.style.cssText = `display:inline-block;min-width:11ch;font-weight:${mode.id === state.mode ? 700 : 400};color:${results[mode.id] ? "var(--accent)" : "var(--dim)"};opacity:${mode.id === state.mode ? 1 : 0.7}`;
      return chip;
    }));
    const current = results[state.mode];
    message.className = `il-message ${current ? "good" : "warn"}`;
    message.textContent = current
      ? `A P pont illeszkedik erre a vonalra: rajta van ${{ segment: "a szakaszon", ray: "a félegyenesen", line: "az egyenesen" }[state.mode]}.`
      : collinear
        ? `A P pont az egyenesen van, de ${state.mode === "segment" ? "nem a két végpont között" : "a félegyenes kezdőpontja mögött"}, ezért erre a vonalra nem illeszkedik.`
        : "A P pont nincs rajta az egyenesen, ezért egyik vonalra sem illeszkedik.";

    for (const [key, handle] of Object.entries(handles)) {
      handle.group.setAttribute("transform", `translate(${state[key][0]} ${state[key][1]})`);
      handle.label.setAttribute("y", key === "p" ? -16 : 24);
    }
  }

  // --- Plane ---
  const plane = card("A sík");
  const planeModes = [{ id: "in", label: "Egyenes a síkban" }, { id: "through", label: "Egyenes átszúrja a síkot" }];
  let planeMode = "in";
  const planeButtons = planeModes.map((mode) => toggle(mode.label, mode.id === planeMode, () => { planeMode = mode.id; renderPlane(); }, PALETTE.violet));
  const planeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 260", role: "img", "aria-label": "Sík egyenessel" });
  const planeMessage = make("p", "il-message");
  plane.append(make("p", "", "A sík egy végtelenül kiterjedt, sima lap. Ha egy egyenes két pontja a síkban van, az egész egyenes a síkban van. A rajzon a síkot csak egy darabját mutató paralelogramma jelzi."),
    controls(...planeButtons), planeFigure, planeMessage);

  function renderPlane() {
    planeButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(planeModes[index].id === planeMode)));
    planeFigure.replaceChildren();
    svg("polygon", { points: "110,200 400,200 500,90 210,90", style: `fill:${PALETTE.violet};fill-opacity:.22;stroke:${PALETTE.violet};stroke-width:2` }, planeFigure);
    svg("text", { x: 130, y: 190, text: "sík", style: `font-weight:700;font-style:italic;fill:${PALETTE.violet}` }, planeFigure);
    if (planeMode === "in") {
      svg("line", { x1: 150, y1: 170, x2: 460, y2: 120, style: `stroke:${PALETTE.blue};stroke-width:3.5` }, planeFigure);
      for (const [x, y, name] of [[230, 157, "A"], [380, 133, "B"]]) {
        svg("circle", { cx: x, cy: y, r: 6.5, style: `fill:${PALETTE.blue}` }, planeFigure);
        svg("text", { x, y: y + 22, "text-anchor": "middle", text: name, style: `font-weight:700;fill:${PALETTE.blue}` }, planeFigure);
      }
      svg("line", { x1: 180, y1: 120, x2: 320, y2: 185, style: `stroke:${PALETTE.green};stroke-width:3` }, planeFigure);
      svg("text", { x: 170, y: 116, text: "f", style: `fill:${PALETTE.green};font-weight:700;font-style:italic` }, planeFigure);
      svg("text", { x: 468, y: 114, text: "e", style: `fill:${PALETTE.blue};font-weight:700;font-style:italic` }, planeFigure);
      planeMessage.textContent = "Az e és az f egyenes minden pontja a síkban van. Egy síkban sok egyenes húzható.";
    } else {
      svg("line", { x1: 300, y1: 240, x2: 300, y2: 14, style: `stroke:${PALETTE.blue};stroke-width:3.5` }, planeFigure);
      svg("circle", { cx: 300, cy: 145, r: 6.5, style: `fill:${PALETTE.red}` }, planeFigure);
      svg("text", { x: 312, y: 162, text: "metszéspont", style: `fill:${PALETTE.red};font-weight:700` }, planeFigure);
      planeMessage.textContent = "Ez az egyenes csak egyetlen pontban metszi a síkot, a többi pontja a síkon kívül van.";
    }
  }

  root.append(main, plane, keyIdea("két különböző pont egyetlen egyenest határoz meg. A szakasznak két végpontja van, a félegyenesnek egy, az egyenesnek egy sem. Három pont csak akkor illeszkedik egy egyenesre, ha egy vonalba esnek."));
  render();
  renderPlane();
  return () => {};
}
