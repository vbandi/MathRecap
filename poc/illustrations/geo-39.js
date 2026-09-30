import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 360, unit: 40 };
const FEATURES = [
  { key: "circumcircle", name: "Körülírt kör", color: PALETTE.blue, text: "a három oldalfelező merőleges metszéspontja a körülírt kör középpontja: a csúcsoktól egyenlő távol van." },
  { key: "incircle", name: "Beírt kör", color: PALETTE.green, text: "a három szögfelező metszéspontja a beírt kör középpontja: az oldalaktól egyenlő távol van." },
  { key: "centroid", name: "Súlypont", color: PALETTE.violet, text: "a három súlyvonal metszéspontja; minden súlyvonalat a csúcstól számítva 2 : 1 arányban oszt." },
  { key: "orthocenter", name: "Magasságpont", color: PALETTE.red, text: "a három magasságvonal metszéspontja." },
  { key: "euler", name: "Euler-egyenes", color: PALETTE.amber, text: "a körülírt kör középpontja, a súlypont és a magasságpont mindig egy egyenesen van." },
];

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

const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const doubleArea = (a, b, c) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));

function circumcenter(a, b, c) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const sa = a.x * a.x + a.y * a.y, sb = b.x * b.x + b.y * b.y, sc = c.x * c.x + c.y * c.y;
  return { x: (sa * (b.y - c.y) + sb * (c.y - a.y) + sc * (a.y - b.y)) / d, y: (sa * (c.x - b.x) + sb * (a.x - c.x) + sc * (b.x - a.x)) / d };
}

export function mount(root) {
  const state = { points: [{ x: 110, y: 300 }, { x: 500, y: 310 }, { x: 280, y: 70 }], active: { circumcircle: true } };

  root.append(lead("Minden háromszögben vannak különleges pontok, ahol a nevezetes vonalak találkoznak. Némelyik körnek is a középpontja: egy kör a csúcsokon megy át, egy másik az oldalakat érinti belülről. Húzd a csúcsokat, és nézd meg, hová kerülnek ezek a pontok!"));

  const main = card("Nevezetes pontok és körök");
  const toggles = FEATURES.map((feature) => toggle(feature.name, Boolean(state.active[feature.key]), () => { state.active[feature.key] = !state.active[feature.key]; render(); }, feature.color));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Háromszög nevezetes pontjai és körei" });
  const layer = svg("g", {}, figure);
  const handles = state.points.map((point) => {
    const handle = svg("circle", { r: 12, style: "fill:var(--fg);fill-opacity:.85;stroke:var(--input);stroke-width:2" }, figure);
    makeDraggable(figure, handle, (x, y) => {
      const next = { x: Math.min(VIEW.width - 20, Math.max(20, x)), y: Math.min(VIEW.height - 20, Math.max(20, y)) };
      const others = state.points.filter((p) => p !== point);
      if (doubleArea(next, others[0], others[1]) < 600) return;
      Object.assign(point, next);
      render();
    });
    return handle;
  });
  const definitions = make("ul", "il-steps");
  definitions.style.listStyle = "none"; definitions.style.paddingLeft = "0";
  const definitionItems = FEATURES.map((feature) => {
    const item = make("li");
    item.append(make("b", "", `${feature.name}: `), feature.text);
    item.firstChild.style.color = feature.color;
    definitions.append(item);
    return item;
  });
  const ratioBox = make("div", "il-formula start");
  ratioBox.style.whiteSpace = "pre-wrap";
  const message = make("p", "il-message");
  main.append(controls(...toggles), figure, definitions, ratioBox, message);
  root.append(main, keyIdea("mindegyik nevezetes pont más-más vonalak találkozása. Hegyesszögű háromszögben mind a háromszögön belül van. Tompaszögű háromszögben a körülírt kör középpontja és a magasságpont kívülre kerül, derékszögűben a körülírt kör középpontja az átfogó felezőpontja."));

  function render() {
    const [a, b, c] = state.points;
    const { active } = state;
    layer.replaceChildren();
    toggles.forEach((button, index) => button.setAttribute("aria-pressed", String(Boolean(active[FEATURES[index].key]))));
    definitionItems.forEach((item, index) => item.classList.toggle("il-dim", !active[FEATURES[index].key]));
    const color = (key) => FEATURES.find((feature) => feature.key === key).color;
    const dot = (p, key, name, dx = 10, dy = -10) => {
      svg("circle", { cx: p.x, cy: p.y, r: 6, style: `fill:${color(key)};stroke:var(--input);stroke-width:1.5` }, layer);
      svg("text", { x: p.x + dx, y: p.y + dy, text: name, style: `font-weight:800;fill:${color(key)}` }, layer);
    };
    const segment = (p, q, style) => svg("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, style }, layer);
    svg("polygon", { points: state.points.map((p) => `${p.x},${p.y}`).join(" "), style: "fill:var(--fg);fill-opacity:.05;stroke:var(--fg);stroke-width:2.5" }, layer);

    const sides = { a: distance(b, c), b: distance(c, a), c: distance(a, b) };
    const circumcentre = circumcenter(a, b, c);
    const centroid = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
    const orthocentre = { x: a.x + b.x + c.x - 2 * circumcentre.x, y: a.y + b.y + c.y - 2 * circumcentre.y };
    const perimeter = sides.a + sides.b + sides.c;
    const incentre = { x: (sides.a * a.x + sides.b * b.x + sides.c * c.x) / perimeter, y: (sides.a * a.y + sides.b * b.y + sides.c * c.y) / perimeter };
    const inradius = doubleArea(a, b, c) / perimeter;

    if (active.circumcircle) {
      svg("circle", { cx: circumcentre.x, cy: circumcentre.y, r: distance(circumcentre, a), style: `fill:${color("circumcircle")};fill-opacity:.06;stroke:${color("circumcircle")};stroke-width:2.5` }, layer);
      dot(circumcentre, "circumcircle", "O");
    }
    if (active.incircle) {
      svg("circle", { cx: incentre.x, cy: incentre.y, r: inradius, style: `fill:${color("incircle")};fill-opacity:.1;stroke:${color("incircle")};stroke-width:2.5` }, layer);
      dot(incentre, "incircle", "I");
    }
    const midpointOfBc = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
    if (active.centroid) {
      [[a, b, c], [b, c, a], [c, a, b]].forEach(([v, p, q]) => segment(v, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, `stroke:${color("centroid")};stroke-width:2`));
      dot(centroid, "centroid", "S");
      svg("text", { x: midpointOfBc.x + 8, y: midpointOfBc.y + 18, text: "F", style: `font-weight:800;fill:${color("centroid")}` }, layer);
    }
    if (active.orthocenter) {
      [[a, b, c], [b, c, a], [c, a, b]].forEach(([v, p, q]) => {
        const dx = q.x - p.x, dy = q.y - p.y, t = ((v.x - p.x) * dx + (v.y - p.y) * dy) / (dx * dx + dy * dy);
        const foot = { x: p.x + t * dx, y: p.y + t * dy };
        segment(v, foot, `stroke:${color("orthocenter")};stroke-width:2`);
        if (t < 0 || t > 1) segment(t < 0 ? p : q, foot, `stroke:${color("orthocenter")};stroke-width:1.5;stroke-dasharray:4 4`);
      });
      dot(orthocentre, "orthocenter", "M");
    }
    const eulerLength = distance(circumcentre, orthocentre);
    if (active.euler && eulerLength > 1) {
      const dx = (orthocentre.x - circumcentre.x) / eulerLength, dy = (orthocentre.y - circumcentre.y) / eulerLength;
      segment({ x: circumcentre.x - dx * 900, y: circumcentre.y - dy * 900 }, { x: circumcentre.x + dx * 900, y: circumcentre.y + dy * 900 }, `stroke:${color("euler")};stroke-width:3;stroke-dasharray:10 6`);
      if (!active.circumcircle) dot(circumcentre, "circumcircle", "O");
      if (!active.centroid) dot(centroid, "centroid", "S");
      if (!active.orthocenter) dot(orthocentre, "orthocenter", "M");
    }
    ["A", "B", "C"].forEach((name, index) => {
      const p = state.points[index];
      svg("text", { x: p.x + (index === 2 ? 0 : index === 0 ? -24 : 16), y: p.y + (index === 2 ? -18 : 6), text: name, style: "font-weight:800;fill:var(--fg)" }, layer);
    });
    handles.forEach((handle, index) => { handle.setAttribute("cx", state.points[index].x); handle.setAttribute("cy", state.points[index].y); });

    const units = (value) => formatNumber(value / VIEW.unit, 2);
    const dimmed = (visible, node) => { node.style.opacity = visible ? 1 : 0.35; return node; };
    const lineOne = make("span");
    lineOne.append("AS = ", slot(units(distance(a, centroid)), 5), " SF = ", slot(units(distance(centroid, midpointOfBc)), 5), " AS : SF = ", slot(make("b", "", formatNumber(distance(a, centroid) / distance(centroid, midpointOfBc), 2)), 5));
    const lineTwo = make("span");
    lineTwo.append("OS = ", slot(units(distance(circumcentre, centroid)), 5), " SM = ", slot(units(distance(centroid, orthocentre)), 5), " SM : OS = ", slot(make("b", "", eulerLength > 1 ? formatNumber(distance(centroid, orthocentre) / distance(circumcentre, centroid), 2) : "—"), 5));
    ratioBox.replaceChildren(dimmed(active.centroid, lineOne), make("br"), dimmed(active.euler, lineTwo));

    const cosines = [[a, b, c], [b, c, a], [c, a, b]].map(([v, p, q]) => ((p.x - v.x) * (q.x - v.x) + (p.y - v.y) * (q.y - v.y)) / distance(v, p) / distance(v, q));
    const right = cosines.some((value) => Math.abs(value) < 0.0087), obtuse = !right && cosines.some((value) => value < 0);
    message.className = "il-message";
    message.textContent = right
      ? "Derékszögű háromszög: a körülírt kör középpontja az átfogó felezőpontja, a magasságpont pedig a derékszögű csúcsba esik."
      : obtuse ? "Tompaszögű háromszög: a körülírt kör középpontja és a magasságpont a háromszögön kívülre esett. A súlypont és a beírt kör középpontja mindig belül marad."
      : "Hegyesszögű háromszög: mind a négy nevezetes pont a háromszög belsejében van.";
  }

  render();
  return () => {};
}
