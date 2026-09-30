import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const UNIT = 45, EYE_HEIGHT = 1.6;
const RADIANS = Math.PI / 180;

export function mount(root) {
  const state = { alpha: 35, size: 5, distance: 20, elevation: 40 };

  root.append(lead("Derékszögű háromszögben az oldalak aránya csak a hegyesszögtől függ, a háromszög méretétől nem. Ezeket az arányokat külön nevük van: szinusz (sin), koszinusz (cos) és tangens (tg). Állítsd a szöget és a méretet, és nézd meg, mi változik és mi nem!"));

  // --- Ratios in a right triangle ---
  const ratios = card("Az oldalak aránya");
  const alphaSlider = range({ label: "α szög", min: 10, max: 80, value: state.alpha, format: (v) => `${v}°`, onInput: (value) => { state.alpha = value; renderTriangle(); } });
  const sizeSlider = range({ label: "Méret (átfogó)", min: 2, max: 6, step: 0.5, value: state.size, format: (v) => formatNumber(v), onInput: (value) => { state.size = value; renderTriangle(); } });
  const triangleFigure = svg("svg", { class: "il-svg", viewBox: "0 0 640 310", role: "img", "aria-label": "Derékszögű háromszög α szöggel" });
  const triangleLayer = svg("g", {}, triangleFigure);
  const formulas = make("div");
  ratios.append(controls(alphaSlider.element, sizeSlider.element), triangleFigure, formulas,
    make("p", "il-muted", "Az a az α-val szemközti befogó, a b az α melletti befogó, a c az átfogó. Csak a méretet csúsztatva az oldalak hossza változik, de a három hányados nem."));

  // --- Tree height ---
  const tree = card("Milyen magas a fa?");
  const distanceSlider = range({ label: "Távolság a fától", min: 10, max: 40, step: 5, value: state.distance, format: (v) => `${v} m`, onInput: (value) => { state.distance = value; renderTree(); } });
  const elevationSlider = range({ label: "Látószög a fa csúcsához", min: 10, max: 70, step: 5, value: state.elevation, format: (v) => `${v}°`, onInput: (value) => { state.elevation = value; renderTree(); } });
  const treeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 640 280", role: "img", "aria-label": "Fa magassága a távolságból és a látószögből" });
  const treeLayer = svg("g", {}, treeFigure);
  const treeFormula = make("div");
  tree.append(controls(distanceSlider.element, elevationSlider.element), treeFigure, treeFormula,
    make("p", "il-muted", `A szemed ${formatNumber(EYE_HEIGHT)} m magasan van a talaj fölött. A rajz a megadott adatokhoz igazodik, ezért a méretarány változik.`));

  root.append(ratios, tree, keyIdea("derékszögű háromszögben sin α = szemközti befogó / átfogó, cos α = melletti befogó / átfogó, tg α = szemközti befogó / melletti befogó. Ezek csak α-tól függenek, ezért a szögből a hosszak, a hosszakból a szög kiszámolható."));

  function renderTriangle() {
    const { alpha, size } = state;
    const a = size * Math.sin(alpha * RADIANS), b = size * Math.cos(alpha * RADIANS);
    const pointA = { x: 70, y: 280 }, pointC = { x: 70 + b * UNIT, y: 280 }, pointB = { x: 70 + b * UNIT, y: 280 - a * UNIT };
    triangleLayer.replaceChildren();
    svg("polygon", { points: `${pointA.x},${pointA.y} ${pointC.x},${pointC.y} ${pointB.x},${pointB.y}`, style: `fill:${PALETTE.blue};fill-opacity:.2;stroke:var(--fg);stroke-width:2.5` }, triangleLayer);
    svg("path", { d: `M ${pointC.x - 14} ${pointC.y} v -14 h 14`, fill: "none", style: "stroke:var(--fg);stroke-width:2" }, triangleLayer);
    svg("path", { d: `M ${pointA.x + 44} ${pointA.y} A 44 44 0 0 0 ${pointA.x + 44 * Math.cos(alpha * RADIANS)} ${pointA.y - 44 * Math.sin(alpha * RADIANS)}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, triangleLayer);
    const text = (x, y, content, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: `font-weight:800;font-size:16px;fill:${color}` }, triangleLayer);
    text(pointA.x + 62, pointA.y - 10, "α", PALETTE.amber, "start");
    text((pointA.x + pointC.x) / 2, pointA.y + 22, `b = ${formatNumber(b, 2)}`, PALETTE.green);
    text(pointC.x + 10, (pointC.y + pointB.y) / 2, `a = ${formatNumber(a, 2)}`, PALETTE.red, "start");
    text((pointA.x + pointB.x) / 2 - 12, (pointA.y + pointB.y) / 2 - 12, `c = ${formatNumber(size)}`, PALETTE.violet, "end");
    const row = (name, top, bottom, value, color) => {
      const line = make("div", "il-formula start");
      line.style.whiteSpace = "pre-wrap";
      line.append(slot(make("b", "", name), 9, { align: "left" }), " = ", slot(top, 2, { align: "left" }), " / ", slot(bottom, 2, { align: "left" }), "  = ", slot(make("b", "", formatNumber(value, 3)), 6));
      line.firstChild.firstChild.style.color = color;
      return line;
    };
    const lengths = (top, bottom) => [`${top}`, `${bottom}`];
    const [sinTop, sinBottom] = lengths("a", "c"), [cosTop, cosBottom] = lengths("b", "c"), [tgTop, tgBottom] = lengths("a", "b");
    formulas.replaceChildren(
      row(`sin ${alpha}°`, sinTop, sinBottom, a / size, PALETTE.red),
      row(`cos ${alpha}°`, cosTop, cosBottom, b / size, PALETTE.green),
      row(`tg ${alpha}°`, tgTop, tgBottom, a / b, PALETTE.blue),
    );
  }

  function renderTree() {
    const { distance, elevation } = state;
    const rise = distance * Math.tan(elevation * RADIANS), height = EYE_HEIGHT + rise;
    const scale = Math.min(400 / distance, 200 / height), ground = 250, personX = 60;
    const treeX = personX + distance * scale, eye = { x: personX, y: ground - EYE_HEIGHT * scale }, top = { x: treeX, y: ground - height * scale };
    treeLayer.replaceChildren();
    svg("line", { x1: 0, y1: ground, x2: 640, y2: ground, class: "axis" }, treeLayer);
    svg("line", { x1: treeX, y1: ground, x2: treeX, y2: top.y + 16, style: "stroke:#7a5230;stroke-width:9;stroke-linecap:round" }, treeLayer);
    svg("circle", { cx: treeX, cy: top.y + 6, r: Math.max(16, Math.min(38, height * scale * 0.2)), style: `fill:${PALETTE.green};fill-opacity:.75` }, treeLayer);
    svg("polygon", { points: `${eye.x},${eye.y} ${treeX},${eye.y} ${top.x},${top.y}`, style: `fill:${PALETTE.blue};fill-opacity:.2;stroke:${PALETTE.blue};stroke-width:2.5` }, treeLayer);
    svg("line", { x1: personX, y1: ground, x2: personX, y2: eye.y, style: "stroke:var(--fg);stroke-width:5;stroke-linecap:round" }, treeLayer);
    svg("circle", { cx: personX, cy: eye.y - 4, r: 6, style: "fill:var(--fg)" }, treeLayer);
    svg("path", { d: `M ${eye.x + 50} ${eye.y} A 50 50 0 0 0 ${eye.x + 50 * Math.cos(elevation * RADIANS)} ${eye.y - 50 * Math.sin(elevation * RADIANS)}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, treeLayer);
    const label = (x, y, content, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: "font-weight:700;fill:var(--fg)" }, treeLayer);
    label(eye.x + 60, eye.y - 8, `${elevation}°`, "start");
    label((personX + treeX) / 2, ground + 22, `${distance} m`);
    label(treeX + 14, (eye.y + top.y) / 2, `x = ?`, "start");
    treeFormula.replaceChildren(
      equation("tg α = x / d", `x / ${distance}`),
      equation(`x = ${distance} · tg ${elevation}°`, make("b", "", `${formatNumber(rise, 1)} m`)),
      equation(`a fa magassága = x + ${formatNumber(EYE_HEIGHT)}`, make("b", "", `${formatNumber(height, 1)} m`)),
    );
  }

  renderTriangle();
  renderTree();
  return () => {};
}
