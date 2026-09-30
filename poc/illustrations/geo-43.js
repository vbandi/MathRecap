import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const SIDE_A = 5, SIDE_B = 4, UNIT = 50, CORNER = { x: 230, y: 270 };
const RADIANS = Math.PI / 180;
const MAX_AREA = SIDE_A * SIDE_B / 2;

// Pointer-based dragging for an SVG element; onMove receives SVG user-space coordinates.
function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  const toSvg = (event) => {
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(figure.getScreenCTM().inverse());
  };
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) { const p = toSvg(event); onMove(p.x, p.y); }
  });
}

export function mount(root) {
  const state = { gamma: 50 };

  root.append(lead("Ha egy háromszögnek ismerjük két oldalát és a köztük levő szöget, a területét ki tudjuk számolni anélkül, hogy a magasságot lemérnénk. A magasság ugyanis kiszámolható a szinuszból. Mozgasd az A csúcsot, és nézd meg, mikor a legnagyobb a terület!"));

  const main = card("Két oldal és a bezárt szög");
  const gammaSlider = range({ label: "γ szög", min: 10, max: 170, value: state.gamma, format: (v) => `${v}°`, onInput: (value) => { state.gamma = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 640 300", role: "img", "aria-label": "Háromszög két rögzített oldallal és változó szöggel" });
  const layer = svg("g", {}, figure);
  const handle = svg("circle", { r: 13, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, figure);
  makeDraggable(figure, handle, (x, y) => {
    const degrees = Math.atan2(CORNER.y - y, x - CORNER.x) / RADIANS;
    state.gamma = Math.round(Math.min(170, Math.max(10, y > CORNER.y ? (x > CORNER.x ? 10 : 170) : degrees)));
    render();
  });
  const formulas = make("div");
  const plot = svg("svg", { class: "il-svg", viewBox: "0 0 640 150", role: "img", "aria-label": "A terület a szög függvényében" });
  const plotLayer = svg("g", {}, plot);
  main.append(controls(gammaSlider.element, make("span", "il-muted", `a = ${SIDE_A}, b = ${SIDE_B} rögzített`)), figure, formulas, plotLayer.parentNode);
  root.append(main, keyIdea("két oldalból és a közbezárt szögből a terület: T = a · b · sin γ / 2. A sin γ legfeljebb 1, ezért a terület 90°-nál a legnagyobb, és a tompa γ és a 180° − γ ugyanakkora területet ad."));

  function render() {
    const { gamma } = state;
    gammaSlider.set(gamma);
    const sine = Math.sin(gamma * RADIANS), height = SIDE_B * sine, area = SIDE_A * SIDE_B * sine / 2;
    const c = CORNER, b = { x: c.x + SIDE_A * UNIT, y: c.y };
    const a = { x: c.x + SIDE_B * UNIT * Math.cos(gamma * RADIANS), y: c.y - SIDE_B * UNIT * sine };
    handle.setAttribute("cx", a.x); handle.setAttribute("cy", a.y);
    layer.replaceChildren();
    const label = (x, y, text, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text, style: `font-weight:800;font-size:15px;fill:${color}` }, layer);
    svg("line", { x1: 20, y1: c.y, x2: 620, y2: c.y, class: "axis" }, layer);
    svg("polygon", { points: `${c.x},${c.y} ${b.x},${b.y} ${a.x},${a.y}`, style: `fill:${PALETTE.blue};fill-opacity:.22;stroke:var(--fg);stroke-width:2.5` }, layer);
    const foot = { x: a.x, y: c.y };
    svg("line", { x1: a.x, y1: a.y, x2: foot.x, y2: foot.y, style: `stroke:${PALETTE.red};stroke-width:3;stroke-dasharray:7 5` }, layer);
    const step = a.x >= c.x ? -14 : 14;
    svg("path", { d: `M ${foot.x + step} ${foot.y} v -14 h ${-step}`, fill: "none", style: "stroke:var(--fg);stroke-width:1.5" }, layer);
    svg("path", { d: `M ${c.x + 36} ${c.y} A 36 36 0 0 0 ${c.x + 36 * Math.cos(gamma * RADIANS)} ${c.y - 36 * sine}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, layer);
    label(c.x + 46, c.y - 10, "γ", PALETTE.amber, "start");
    label((c.x + b.x) / 2, c.y + 22, `a = ${SIDE_A}`, PALETTE.green);
    label((c.x + a.x) / 2 - 10, (c.y + a.y) / 2 - 8, `b = ${SIDE_B}`, PALETTE.violet, "end");
    label(foot.x + (a.x >= c.x ? 10 : -10), (foot.y + a.y) / 2, "m", PALETTE.red, a.x >= c.x ? "start" : "end");
    label(c.x - 14, c.y + 22, "C", "var(--fg)"); label(b.x + 14, b.y + 22, "B", "var(--fg)"); label(a.x, a.y - 20, "A", "var(--fg)");
    const line = (...parts) => { const row = make("div", "il-formula start"); row.style.whiteSpace = "pre-wrap"; row.append(...parts); return row; };
    formulas.replaceChildren(
      line("m = b · sin γ = ", slot(String(SIDE_B), 1), " · ", slot(formatNumber(sine, 3), 5), " = ", slot(make("b", "", formatNumber(height, 2)), 5)),
      line("T = a · b · sin γ / 2 = ", slot(String(SIDE_A), 1), " · ", slot(String(SIDE_B), 1), " · ", slot(formatNumber(sine, 3), 5), " / 2 = ", slot(make("b", "", formatNumber(area, 2)), 5)),
    );

    plotLayer.replaceChildren();
    const toPlot = (degrees, value) => [40 + degrees / 180 * 560, 125 - value / MAX_AREA * 95];
    svg("line", { x1: 40, y1: 125, x2: 600, y2: 125, class: "axis" }, plotLayer);
    const points = [];
    for (let d = 0; d <= 180; d += 5) points.push(toPlot(d, SIDE_A * SIDE_B * Math.sin(d * RADIANS) / 2).join(","));
    svg("polyline", { points: points.join(" "), fill: "none", style: `stroke:${PALETTE.blue};stroke-width:2.5` }, plotLayer);
    const [topX, topY] = toPlot(90, MAX_AREA);
    svg("line", { x1: topX, y1: topY, x2: topX, y2: 125, style: "stroke:var(--dim);stroke-dasharray:4 4" }, plotLayer);
    svg("text", { x: topX + 8, y: topY + 4, text: `legnagyobb: ${formatNumber(MAX_AREA)} (90°-nál)`, style: "fill:var(--dim)" }, plotLayer);
    for (const d of [0, 90, 180]) svg("text", { x: toPlot(d, 0)[0], y: 144, "text-anchor": "middle", text: `${d}°`, style: "fill:var(--dim);font-size:11px" }, plotLayer);
    const [px, py] = toPlot(gamma, area);
    svg("circle", { cx: px, cy: py, r: 7, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, plotLayer);
  }

  render();
  return () => {};
}
