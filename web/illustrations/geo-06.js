import { button, card, controls, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380, MARGIN = 20;
const PRESETS = {
  5: { convex: [[300, 40], [510, 160], [430, 330], [170, 330], [90, 160]], concave: [[300, 50], [520, 330], [300, 210], [80, 330], [140, 140]] },
  6: { convex: [[200, 50], [400, 50], [530, 190], [400, 330], [200, 330], [70, 190]], concave: [[90, 70], [310, 160], [520, 70], [520, 320], [310, 250], [90, 320]] },
};

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
const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function properlyCross(p, q, r, s) {
  const d1 = cross(p, q, r), d2 = cross(p, q, s), d3 = cross(r, s, p), d4 = cross(r, s, q);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function insidePolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function analyse(points) {
  const n = points.length;
  let simple = true;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (j === i + 1 || (i === 0 && j === n - 1)) continue;
    if (properlyCross(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) simple = false;
  }
  const area = points.reduce((sum, p, i) => sum + p[0] * points[(i + 1) % n][1] - points[(i + 1) % n][0] * p[1], 0);
  const orientation = Math.sign(area) || 1;
  const angles = points.map((p, i) => {
    const prev = points[(i + n - 1) % n], next = points[(i + 1) % n];
    const a = Math.atan2(prev[1] - p[1], prev[0] - p[0]), b = Math.atan2(next[1] - p[1], next[0] - p[0]);
    let between = Math.abs(a - b) * 180 / Math.PI;
    if (between > 180) between = 360 - between;
    const convexHere = cross(prev, p, next) * orientation > 0;
    return { degrees: convexHere ? between : 360 - between, reflex: !convexHere };
  });
  const diagonals = [];
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    const p = points[i], q = points[j];
    const middle = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    let inside = simple && insidePolygon(middle, points);
    for (let k = 0; k < n && inside; k++) if (properlyCross(p, q, points[k], points[(k + 1) % n])) inside = false;
    diagonals.push({ from: p, to: q, inside });
  }
  return { simple, angles, diagonals, convex: simple && angles.every((angle) => !angle.reflex) };
}

export function mount(root) {
  const state = { n: 5, points: { 5: PRESETS[5].convex.map((p) => [...p]), 6: PRESETS[6].convex.map((p) => [...p]) } };

  root.append(lead("A sokszög zárt töröttvonal: oldalak kötik össze a csúcsait. Az átló két olyan csúcsot köt össze, amelyek nem szomszédosak. Megnézzük, hogyan függ össze az, hogy a sokszög „kidudorodó” (konvex) vagy „behorpadó” (konkáv), azzal, hogy az átlói hova esnek."));

  const main = card("Formáld át a sokszöget");
  const countButtons = [5, 6].map((n) => toggle(`${n} csúcs`, n === state.n, () => { state.n = n; render(); }, PALETTE.blue));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Húzható csúcsú sokszög átlókkal" });
  const readout = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(...countButtons, button("Konvex minta", () => { state.points[state.n] = PRESETS[state.n].convex.map((p) => [...p]); render(); }, { ghost: true }),
    button("Konkáv minta", () => { state.points[state.n] = PRESETS[state.n].concave.map((p) => [...p]); render(); }, { ghost: true })),
  figure, readout, message, make("p", "il-muted", "Húzd a csúcsokat. A zöld átlók a sokszögön belül futnak, a pirosak részben kívülre esnek."));

  const drawLayer = svg("g", {}, figure), handleLayer = svg("g", {}, figure);
  const handles = [0, 1, 2, 3, 4, 5].map((index) => {
    const group = svg("g", {}, handleLayer);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2.5` }, group);
    svg("text", { y: -14, "text-anchor": "middle", text: "ABCDEF"[index], style: `font-weight:800;fill:${PALETTE.blue}` }, group);
    makeDraggable(figure, group, (x, y) => { state.points[state.n][index] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)]; render(); });
    return group;
  });

  function render() {
    const points = state.points[state.n], info = analyse(points), n = state.n;
    countButtons.forEach((b, i) => b.setAttribute("aria-pressed", String([5, 6][i] === n)));
    drawLayer.replaceChildren();
    const fill = info.simple ? (info.convex ? PALETTE.green : PALETTE.amber) : PALETTE.red;
    svg("polygon", { points: points.map((p) => p.join(",")).join(" "), style: `fill:${fill};fill-opacity:.15;stroke:var(--fg);stroke-width:3;stroke-linejoin:round` }, drawLayer);
    for (const d of info.diagonals) {
      svg("line", { x1: d.from[0], y1: d.from[1], x2: d.to[0], y2: d.to[1], style: `stroke:${d.inside ? PALETTE.green : PALETTE.red};stroke-width:2;${d.inside ? "" : "stroke-dasharray:7 5"}` }, drawLayer);
    }
    handles.forEach((group, index) => {
      group.style.display = index < n ? "" : "none";
      if (index >= n) return;
      group.setAttribute("transform", `translate(${points[index][0]} ${points[index][1]})`);
    });
    const centre = points.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
    points.forEach((p, i) => {
      const dx = centre[0] - p[0], dy = centre[1] - p[1], l = Math.hypot(dx, dy) || 1;
      const angle = info.angles[i];
      svg("text", { x: p[0] + (dx / l) * 34, y: p[1] + (dy / l) * 34 + 4, "text-anchor": "middle", text: info.simple ? `${Math.round(angle.degrees)}°` : "", style: `font-size:12px;font-weight:${angle.reflex ? 800 : 400};fill:${angle.reflex ? PALETTE.red : "var(--fg-soft)"}` }, drawLayer);
    });
    const total = info.diagonals.length, outside = info.diagonals.filter((d) => !d.inside).length;
    readout.replaceChildren("Átlók száma: ", slot(String(total), 2), "  belül: ", slot(info.simple ? String(total - outside) : "–", 2), "  kívül: ", slot(info.simple ? String(outside) : "–", 2));
    message.className = `il-message ${info.simple ? (info.convex ? "good" : "warn") : "warn"}`;
    message.textContent = !info.simple ? "Az oldalak metszik egymást, ez nem egyszerű sokszög. Húzd úgy a csúcsokat, hogy az oldalak ne keresztezzék egymást."
      : info.convex ? `Konvex sokszög: minden belső szöge legfeljebb 180°, és mind a ${total} átlója belül van.`
        : `Konkáv sokszög: van ${info.angles.filter((a) => a.reflex).length} db 180°-nál nagyobb belső szöge (piros szám), és ${outside} átlója kívülre lóg.`;
  }

  root.append(main, keyIdea("konvex sokszögben minden átló belül van és minden belső szög kisebb 180°-nál. Ha egy belső szög nagyobb 180°-nál, a sokszög konkáv, és legalább egy átlója kívülre esik. Az n oldalú sokszögnek n(n − 3)/2 átlója van."));
  render();
  return () => {};
}
