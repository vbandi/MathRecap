import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 360, unit: 40 };
const LINES = [
  { key: "perpendicularBisector", name: "Oldalfelező merőleges", color: PALETTE.blue, text: "az oldal felezőpontján átmenő, az oldalra merőleges egyenes (minden pontja egyenlő távol van az oldal két végétől)" },
  { key: "angleBisector", name: "Szögfelező", color: PALETTE.green, text: "a szöget két egyenlő részre osztó félegyenes (minden pontja egyenlő távol van a szög két szárától)" },
  { key: "altitude", name: "Magasságvonal", color: PALETTE.red, text: "a csúcsból a szemközti oldal egyenesére bocsátott merőleges" },
  { key: "median", name: "Súlyvonal", color: PALETTE.violet, text: "a csúcsot a szemközti oldal felezőpontjával összekötő szakasz" },
  { key: "midsegment", name: "Középvonal", color: PALETTE.amber, text: "két oldal felezőpontját összekötő szakasz" },
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

const midpoint = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const doubleArea = (a, b, c) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));

export function mount(root) {
  const state = { points: [{ x: 120, y: 300 }, { x: 480, y: 310 }, { x: 260, y: 70 }], active: { median: true } };
  const names = ["A", "B", "C"];

  root.append(lead("A háromszögben sok különleges egyenest és szakaszt szoktunk húzni: olyanokat, amelyek az oldalakat felezik, a szögeket felezik, vagy merőlegesek valamire. Kapcsold be őket egyenként, és mozgasd a csúcsokat!"));

  const main = card("Nevezetes vonalak");
  const toggles = LINES.map((line) => toggle(line.name, Boolean(state.active[line.key]), () => { state.active[line.key] = !state.active[line.key]; render(); }, line.color));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Háromszög nevezetes vonalai" });
  const layer = svg("g", {}, figure);
  const handles = state.points.map((point) => {
    const handle = svg("circle", { r: 12, style: `fill:var(--fg);fill-opacity:.85;stroke:var(--input);stroke-width:2` }, figure);
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
  const definitionItems = LINES.map((line) => {
    const item = make("li");
    item.append(make("b", "", `${line.name}: `), line.text);
    item.firstChild.style.color = line.color;
    definitions.append(item);
    return item;
  });
  const midsegmentBox = make("div", "il-formula start");
  midsegmentBox.style.whiteSpace = "pre-wrap";
  main.append(controls(...toggles), figure, definitions, midsegmentBox);
  root.append(main, keyIdea("a középvonal párhuzamos a harmadik oldallal, és feleakkora. A többi vonal metszéspontjai különleges pontok lesznek: ezeket a következő témában nézzük meg."));

  function render() {
    const [a, b, c] = state.points;
    const { active } = state;
    layer.replaceChildren();
    toggles.forEach((button, index) => button.setAttribute("aria-pressed", String(Boolean(active[LINES[index].key]))));
    definitionItems.forEach((item, index) => item.classList.toggle("il-dim", !active[LINES[index].key]));
    const longLine = (p, q, style) => {
      const length = distance(p, q), dx = (q.x - p.x) / length, dy = (q.y - p.y) / length;
      svg("line", { x1: p.x - dx * 900, y1: p.y - dy * 900, x2: p.x + dx * 900, y2: p.y + dy * 900, style }, layer);
    };
    const segment = (p, q, style) => svg("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, style }, layer);
    const dot = (p, color) => svg("circle", { cx: p.x, cy: p.y, r: 4.5, style: `fill:${color}` }, layer);
    svg("polygon", { points: state.points.map((p) => `${p.x},${p.y}`).join(" "), style: "fill:var(--fg);fill-opacity:.05;stroke:var(--fg);stroke-width:2.5" }, layer);
    const color = (key) => LINES.find((line) => line.key === key).color;
    // Each triple is (vertex, other end 1, other end 2), so the opposite side is the last two.
    const triples = [[a, b, c], [b, c, a], [c, a, b]];
    if (active.perpendicularBisector) {
      triples.forEach(([, p, q]) => {
        const m = midpoint(p, q);
        longLine(m, { x: m.x - (q.y - p.y), y: m.y + (q.x - p.x) }, `stroke:${color("perpendicularBisector")};stroke-width:2;stroke-dasharray:8 5`);
        dot(m, color("perpendicularBisector"));
      });
    }
    if (active.angleBisector) {
      triples.forEach(([v, p, q]) => {
        const lp = distance(v, p), lq = distance(v, q);
        const foot = { x: (lq * p.x + lp * q.x) / (lp + lq), y: (lq * p.y + lp * q.y) / (lp + lq) };
        segment(v, foot, `stroke:${color("angleBisector")};stroke-width:2.5`);
        dot(foot, color("angleBisector"));
      });
    }
    if (active.altitude) {
      triples.forEach(([v, p, q]) => {
        const dx = q.x - p.x, dy = q.y - p.y, t = ((v.x - p.x) * dx + (v.y - p.y) * dy) / (dx * dx + dy * dy);
        const foot = { x: p.x + t * dx, y: p.y + t * dy };
        if (t < 0 || t > 1) segment(t < 0 ? p : q, foot, `stroke:${color("altitude")};stroke-width:1.5;stroke-dasharray:4 4`);
        segment(v, foot, `stroke:${color("altitude")};stroke-width:2.5`);
        dot(foot, color("altitude"));
      });
    }
    if (active.median) {
      triples.forEach(([v, p, q]) => { const m = midpoint(p, q); segment(v, m, `stroke:${color("median")};stroke-width:2.5`); dot(m, color("median")); });
    }
    const midpointOfAc = midpoint(a, c), midpointOfBc = midpoint(b, c);
    if (active.midsegment) {
      segment(midpointOfAc, midpointOfBc, `stroke:${color("midsegment")};stroke-width:4`);
      [midpoint(a, b), midpointOfAc, midpointOfBc].forEach((p) => dot(p, color("midsegment")));
      segment(midpoint(a, b), midpointOfAc, `stroke:${color("midsegment")};stroke-width:2;stroke-dasharray:3 4`);
      segment(midpoint(a, b), midpointOfBc, `stroke:${color("midsegment")};stroke-width:2;stroke-dasharray:3 4`);
    }
    state.points.forEach((p, index) => {
      svg("text", { x: p.x + (index === 2 ? 0 : index === 0 ? -24 : 16), y: p.y + (index === 2 ? -18 : 6), text: names[index], style: "font-weight:800;fill:var(--fg)" }, layer);
    });
    handles.forEach((handle, index) => { handle.setAttribute("cx", state.points[index].x); handle.setAttribute("cy", state.points[index].y); });

    const lengthOf = (p, q) => distance(p, q) / VIEW.unit;
    const mid = lengthOf(midpointOfAc, midpointOfBc), side = lengthOf(a, b);
    const angle = Math.abs(Math.atan2(midpointOfBc.y - midpointOfAc.y, midpointOfBc.x - midpointOfAc.x) - Math.atan2(b.y - a.y, b.x - a.x));
    const deviation = Math.min(angle % Math.PI, Math.PI - (angle % Math.PI)) * 180 / Math.PI;
    midsegmentBox.style.opacity = active.midsegment ? 1 : 0.35;
    midsegmentBox.replaceChildren(
      "középvonal: ", slot(formatNumber(mid, 2), 5), " AB: ", slot(formatNumber(side, 2), 5), " arány: ", slot(make("b", "", formatNumber(mid / side, 2)), 5),
      make("br"), "a középvonal és az AB által bezárt szög: ", slot(`${formatNumber(deviation, 1)}°`, 6),
    );
  }

  render();
  return () => {};
}
