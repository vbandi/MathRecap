import { button, card, controls, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 340, MARGIN = 22;
const RAD = Math.PI / 180;
const PRESETS = {
  convex: [[130, 260], [470, 270], [500, 90], [200, 50]],
  concave: [[110, 280], [500, 280], [330, 70], [330, 200]],
};
const NAMES = "ABCD";
const TRIANGLE_COLORS = [PALETTE.blue, PALETTE.green];

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
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const properlyCross = (p, q, r, s) => cross(p, q, r) * cross(p, q, s) < 0 && cross(r, s, p) * cross(r, s, q) < 0;
const angleBetween = (u, v) => Math.acos(clamp((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1), -1, 1)) / RAD;

function insidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Sector with the given centre between two direction vectors (the smaller angle between them).
function wedgePath(center, radius, u, v) {
  const a = Math.atan2(u[1], u[0]), b = Math.atan2(v[1], v[0]);
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const p = (angle) => `${center[0] + radius * Math.cos(angle)} ${center[1] + radius * Math.sin(angle)}`;
  return `M ${center[0]} ${center[1]} L ${p(a)} A ${radius} ${radius} 0 0 ${d > 0 ? 1 : 0} ${p(a + d)} Z`;
}

function analyse(points) {
  const crossing = properlyCross(points[0], points[1], points[2], points[3]) || properlyCross(points[1], points[2], points[3], points[0]);
  const orientation = Math.sign([0, 1, 2, 3].reduce((s, i) => s + points[i][0] * points[(i + 1) % 4][1] - points[(i + 1) % 4][0] * points[i][1], 0)) || 1;
  const reflex = points.map((p, i) => cross(points[(i + 3) % 4], p, points[(i + 1) % 4]) * orientation < 0);
  const inside = [[0, 2], [1, 3]].map(([i, j]) => {
    const mid = [(points[i][0] + points[j][0]) / 2, (points[i][1] + points[j][1]) / 2];
    return !crossing && insidePolygon(mid, points);
  });
  return { simple: !crossing, reflex, inside };
}

export function mount(root) {
  const state = { points: PRESETS.convex.map((p) => [...p]), diagonal: 0 };

  root.append(lead("A négyszögnek négy csúcsa és négy szöge van. Ha egy átlóval két háromszögre vágod, a dolog visszavezethető arra, amit a háromszögről már tudsz. Nézzük meg, mennyi a négy szög összege!"));

  const main = card("Vágd két háromszögre");
  const diagonalButtons = [["AC átló", 0], ["BD átló", 1]].map(([text, value]) => toggle(text, false, () => { state.diagonal = value; render(); }, PALETTE.green));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Húzható négyszög átlóval" });
  const anglesLine = make("div", "il-formula start");
  const sumLine = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(...diagonalButtons,
    button("Konvex minta", () => { state.points = PRESETS.convex.map((p) => [...p]); render(); }, { ghost: true }),
    button("Konkáv minta", () => { state.points = PRESETS.concave.map((p) => [...p]); render(); }, { ghost: true })),
  figure, anglesLine, sumLine, message, make("p", "il-muted", "Húzd a csúcsokat. Konkáv négyszögnél csak a belső átló vág háromszögekre."));

  const drawLayer = svg("g", {}, figure), labelLayer = svg("g", { style: "pointer-events:none" }, figure);
  const handles = state.points.map((_, index) => {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: "fill:var(--fg);stroke:var(--input);stroke-width:2.5" }, group);
    makeDraggable(figure, group, (x, y) => { state.points[index] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)]; render(); });
    return group;
  });

  root.append(main, keyIdea("bármelyik (egyszerű) négyszöget egy belső átló két háromszögre vág, és mindkét háromszög szögösszege 180°. Ezért a négyszög szögeinek összege 2 · 180° = 360°. Ez konkáv négyszögre is igaz, csak ott a belső átlót kell választani."));

  function render() {
    const { points } = state, info = analyse(points);
    // Keep the chosen diagonal valid: prefer the inside one.
    if (info.simple && !info.inside[state.diagonal]) state.diagonal = info.inside[0] ? 0 : 1;
    const [i, j] = state.diagonal === 0 ? [0, 2] : [1, 3], k = [0, 1, 2, 3].filter((x) => x !== i && x !== j);
    diagonalButtons.forEach((b, index) => { b.setAttribute("aria-pressed", String(info.simple && state.diagonal === index)); b.disabled = !info.simple || !info.inside[index]; });
    drawLayer.replaceChildren(); labelLayer.replaceChildren();
    handles.forEach((group, index) => group.setAttribute("transform", `translate(${points[index][0]} ${points[index][1]})`));
    const centre = points.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]);
    const poly = (list, style) => svg("polygon", { points: list.map((p) => p.join(",")).join(" "), style }, drawLayer);
    const labels = (index, text, color = "var(--fg-soft)") => {
      const d = sub(centre, points[index]), l = Math.hypot(...d) || 1;
      svg("text", { x: points[index][0] - (d[0] / l) * 30, y: points[index][1] - (d[1] / l) * 30 + 5, "text-anchor": "middle", text, style: `font-weight:800;fill:${color}` }, labelLayer);
    };
    NAMES.split("").forEach((name, index) => {
      const d = sub(centre, points[index]), l = Math.hypot(...d) || 1;
      svg("text", { x: points[index][0] - (d[0] / l) * 16, y: points[index][1] - (d[1] / l) * 16 + 5, "text-anchor": "middle", text: name, style: "font-weight:800;fill:var(--fg)" }, labelLayer);
    });
    void labels;

    if (!info.simple) {
      poly(points, `fill:${PALETTE.red};fill-opacity:.1;stroke:var(--fg);stroke-width:3`);
      anglesLine.replaceChildren("Szögek: ", slot("–", 40, { align: "left" }));
      sumLine.replaceChildren("Összeg: ", slot("–", 40, { align: "left" }));
      message.className = "il-message warn";
      message.textContent = "Az oldalak keresztezik egymást, ez nem négyszög. Húzd úgy a csúcsokat, hogy az oldalak ne metsszék egymást.";
      return;
    }
    const triangles = [[points[i], points[k[0]], points[j]], [points[i], points[j], points[k[1]]]];
    const indexes = [[i, k[0], j], [i, j, k[1]]];
    triangles.forEach((t, n) => poly(t, `fill:${TRIANGLE_COLORS[n]};fill-opacity:.2;stroke:none`));
    poly(points, "fill:none;stroke:var(--fg);stroke-width:3;stroke-linejoin:round");
    svg("line", { x1: points[i][0], y1: points[i][1], x2: points[j][0], y2: points[j][1], style: `stroke:${PALETTE.amber};stroke-width:3;stroke-dasharray:8 6` }, drawLayer);
    // Angle pieces of each triangle at their vertices.
    const pieces = [0, 0, 0, 0].map(() => []);
    indexes.forEach((tri, n) => tri.forEach((vertex, m) => {
      const prev = points[tri[(m + 2) % 3]], next = points[tri[(m + 1) % 3]];
      svg("path", { d: wedgePath(points[vertex], 26, sub(prev, points[vertex]), sub(next, points[vertex])), style: `fill:${TRIANGLE_COLORS[n]};fill-opacity:.7;stroke:var(--input);stroke-width:1` }, drawLayer);
      pieces[vertex].push(angleBetween(sub(prev, points[vertex]), sub(next, points[vertex])));
    }));
    const total = pieces.map((list) => list.reduce((s, v) => s + v, 0));
    const shown = total.map(Math.round);
    shown[3] = 360 - shown[0] - shown[1] - shown[2];
    points.forEach((p, index) => {
      const d = sub(centre, p), l = Math.hypot(...d) || 1;
      svg("text", { x: p[0] + (d[0] / l) * 48, y: p[1] + (d[1] / l) * 48 + 5, "text-anchor": "middle", text: `${shown[index]}°`, style: `font-size:13px;font-weight:800;fill:${info.reflex[index] ? PALETTE.red : "var(--fg)"}` }, labelLayer);
    });
    anglesLine.replaceChildren(...NAMES.split("").flatMap((name, index) => [`${["α", "β", "γ", "δ"][index]} = `, slot(`${shown[index]}°`, 5, { align: "left" })]));
    sumLine.replaceChildren("α + β + γ + δ = ", slot(make("b", "", `${shown.reduce((s, v) => s + v, 0)}°`), 6, { align: "left" }), "  = 2 · 180°");
    message.className = "il-message good";
    message.textContent = `A ${NAMES[i]}${NAMES[j]} átló két háromszögre vágja a négyszöget (kék és zöld). Mindkettő szögösszege 180°, ezért a négyszögé 2 · 180° = 360°.${info.reflex.some(Boolean) ? " A piros szög nagyobb 180°-nál, a négyszög konkáv." : ""}`;
  }

  render();
  return () => {};
}
