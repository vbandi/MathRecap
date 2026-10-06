import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

// ---- Small orthographic 3D helper (z is up); drag the figure to rotate. ----
const camera = { yaw: -0.6, pitch: 0.5 };
function rotate3([x, y, z]) {
  const cosYaw = Math.cos(camera.yaw), sinYaw = Math.sin(camera.yaw), cosPitch = Math.cos(camera.pitch), sinPitch = Math.sin(camera.pitch);
  const x1 = x * cosYaw - y * sinYaw, y1 = x * sinYaw + y * cosYaw;
  return [x1, z * cosPitch + y1 * sinPitch, y1 * cosPitch - z * sinPitch]; // screen x, screen up, depth (bigger = farther)
}
function enableRotation(element, onChange) {
  let last = null;
  element.style.touchAction = "none";
  element.style.cursor = "grab";
  element.addEventListener("pointerdown", (event) => { last = [event.clientX, event.clientY]; element.setPointerCapture(event.pointerId); });
  element.addEventListener("pointermove", (event) => {
    if (!last) return;
    camera.yaw += (event.clientX - last[0]) * 0.01;
    camera.pitch = Math.min(1.45, Math.max(-1.45, camera.pitch + (event.clientY - last[1]) * 0.01));
    last = [event.clientX, event.clientY];
    onChange();
  });
  const end = () => { last = null; };
  element.addEventListener("pointerup", end);
  element.addEventListener("pointercancel", end);
}
// Draws a convex solid: hidden edges dashed, front faces tinted. faces are vertex index cycles.
function drawSolid(parent, verts, faces, { scale = 40, cx = 300, cy = 200, fills = [], fillOpacity = 0.3, edgeStyle = () => null } = {}) {
  const rotated = verts.map(rotate3);
  const mean = (points) => points.reduce((sum, p) => sum.map((v, k) => v + p[k] / points.length), [0, 0, 0]);
  const center = mean(rotated);
  const project = (p) => { const q = rotate3(p); return [cx + q[0] * scale, cy - q[1] * scale]; };
  const edgeVisible = new Map();
  const info = faces.map((face, index) => {
    const points = face.map((i) => rotated[i]);
    const centroid = mean(points);
    const [p0, p1, p2] = points;
    const u = p1.map((v, k) => v - p0[k]), w = p2.map((v, k) => v - p0[k]);
    const normal = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const side = normal.reduce((sum, v, k) => sum + v * (centroid[k] - center[k]), 0) > 0 ? 1 : -1;
    const front = normal[2] * side < 0;
    face.forEach((vertex, k) => {
      const other = face[(k + 1) % face.length];
      const key = vertex < other ? `${vertex}-${other}` : `${other}-${vertex}`;
      edgeVisible.set(key, Boolean(edgeVisible.get(key)) || front);
    });
    return { index, front, centroid: project(face.reduce((s, i) => s.map((v, k) => v + verts[i][k] / face.length), [0, 0, 0])) };
  });
  const drawEdges = (wantVisible) => {
    for (const [key, visible] of edgeVisible) {
      if (visible !== wantVisible) continue;
      const [i, j] = key.split("-").map(Number);
      const [x1, y1] = project(verts[i]), [x2, y2] = project(verts[j]);
      const style = edgeStyle(i, j, visible) ?? (visible ? "stroke:var(--fg);stroke-width:2" : "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:5 4");
      svg("line", { x1, y1, x2, y2, style: `${style};stroke-linecap:round` }, parent);
    }
  };
  drawEdges(false);
  for (const face of info) {
    if (!face.front) continue;
    const points = faces[face.index].map((i) => project(verts[i]).join(",")).join(" ");
    svg("polygon", { points, style: `fill:${fills[face.index] ?? "var(--fg-soft)"};fill-opacity:${fills[face.index] ? fillOpacity + 0.15 : fillOpacity * 0.4};stroke:none` }, parent);
  }
  drawEdges(true);
  return { project, info };
}


const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
const VERTS = Array.from({ length: 8 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
const bitCount = (n) => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1);

const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));

// Relation of two lines through p1 (direction d1) and p2 (direction d2).
export function relation(line1, line2) {
  const d1 = sub(line1.q, line1.p), d2 = sub(line2.q, line2.p), n = cross(d1, d2);
  if (norm(n) < 1e-9) return norm(cross(d1, sub(line2.p, line1.p))) < 1e-9 ? "coincident" : "parallel";
  return Math.abs(dot(sub(line2.p, line1.p), n)) < 1e-9 ? "intersecting" : "skew";
}
export function angleBetween(line1, line2) {
  const d1 = sub(line1.q, line1.p), d2 = sub(line2.q, line2.p);
  return (Math.acos(Math.min(1, Math.abs(dot(d1, d2)) / (norm(d1) * norm(d2)))) * 180) / Math.PI;
}

function candidateLines(withDiagonals) {
  const lines = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
    const bits = bitCount(i ^ j);
    if (bits === 1 || (withDiagonals && bits === 2)) lines.push({ p: VERTS[i], q: VERTS[j], kind: bits === 1 ? "edge" : "diagonal" });
  }
  return lines;
}
const distanceToSegment = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

export function mount(root) {
  const scope = createScope();
  const state = { diagonals: false, picks: [], shift: 0, height: 3, ax: 2, ay: 1 };

  root.append(lead("Két egyenes a térben háromféleképpen állhat egymáshoz képest: lehet párhuzamos, lehet metsző (egy pontban találkoznak), vagy lehet kitérő — ilyenkor nem találkoznak, és nem is párhuzamosak. A kocka éleivel jól kipróbálhatod mindhármat: kattints két élre!"));

  const main = card("Válassz ki két egyenest a kockán");
  const diagonalToggle = toggle("lapátlók is", false, () => { state.diagonals = !state.diagonals; state.picks = []; state.shift = 0; render(); });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 330", role: "img", "aria-label": "Forgatható kocka, két kiválasztható egyenessel" });
  const message = make("p", "il-message");
  const angleLine = make("p", "il-message");
  main.append(controls(diagonalToggle, button("Törlés", () => { state.picks = []; state.shift = 0; render(); }, { ghost: true }), button("Told el a kék egyenest a pirosig", slide)), make("p", "il-muted", "Kattints egy élre (vagy lapátlóra): az első piros, a második kék. Az ábrát húzással forgathatod."), figure, message, angleLine);

  const distanceCard = card("Pont és sík távolsága");
  const heightSlider = range({ label: "a P pont magassága a sík fölött", min: 1, max: 4, step: 0.5, value: state.height, onInput: (value) => { state.height = value; renderDistance(); } });
  const axSlider = range({ label: "A pont x", min: -2, max: 2, value: state.ax, onInput: (value) => { state.ax = value; renderDistance(); } });
  const aySlider = range({ label: "A pont y", min: -2, max: 2, value: state.ay, onInput: (value) => { state.ay = value; renderDistance(); } });
  const distanceFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Pont és sík távolsága" });
  const distanceLine = make("div", "il-formula start");
  distanceCard.append(controls(heightSlider.element, axSlider.element, aySlider.element), distanceFigure, distanceLine);
  root.append(main, distanceCard, keyIdea("két egyenes kitérő, ha nincs olyan sík, amely mindkettőt tartalmazza. Egy pont és egy sík távolsága a pontból a síkra húzott merőleges szakasz hossza — ez a legrövidebb út a ponttól a síkig."));
  enableRotation(figure, render); enableRotation(distanceFigure, render);

  function slide() {
    if (state.picks.length < 2) return;
    scope.clearAll();
    const from = state.shift, to = from > 0.5 ? 0 : 1, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1400);
      state.shift = from + (to - from) * (t * t * (3 - 2 * t)); render();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }

  let down = null;
  figure.addEventListener("pointerdown", (event) => { down = [event.clientX, event.clientY]; });
  figure.addEventListener("pointerup", (event) => {
    if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 4) { down = null; return; }
    down = null;
    const pt = figure.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
    const here = pt.matrixTransform(figure.getScreenCTM().inverse()), point = [here.x, here.y];
    let best = null, bestDistance = 14;
    for (const line of candidateLines(state.diagonals)) {
      const distance = distanceToSegment(point, screen(line.p), screen(line.q));
      if (distance < bestDistance) { best = line; bestDistance = distance; }
    }
    if (!best) return;
    const same = (l1, l2) => l1.p === l2.p && l1.q === l2.q;
    if (state.picks.some((l) => same(l, best))) return;
    state.picks = state.picks.length >= 2 ? [best] : [...state.picks, best];
    state.shift = 0;
    render();
  });

  const SCALE = 66, CX = 300, CY = 165;
  const screen = (p) => { const q = rotate3(p); return [CX + q[0] * SCALE, CY - q[1] * SCALE]; };

  function render() {
    diagonalToggle.setAttribute("aria-pressed", String(state.diagonals));
    figure.replaceChildren();
    const solid = drawSolid(figure, VERTS, FACES, { scale: SCALE, cx: CX, cy: CY, fillOpacity: 0.15 });
    const draw = (a, b, style) => { const [x1, y1] = solid.project(a), [x2, y2] = solid.project(b); svg("line", { x1, y1, x2, y2, style: `${style};stroke-linecap:round` }, figure); };
    if (state.diagonals) for (const line of candidateLines(true)) if (line.kind === "diagonal") draw(line.p, line.q, "stroke:var(--dim);stroke-width:1.2;stroke-dasharray:3 4");
    const colors = [PALETTE.red, PALETTE.blue];
    state.picks.forEach((line, i) => draw(line.p, line.q, `stroke:${colors[i]};stroke-width:5`));
    const [first, second] = state.picks;
    if (first && second) {
      const v = sub(first.p, second.p);
      const moved = { p: second.p.map((c, k) => c + state.shift * v[k]), q: second.q.map((c, k) => c + state.shift * v[k]) };
      if (state.shift > 0) draw(moved.p, moved.q, `stroke:${PALETTE.blue};stroke-width:4;stroke-dasharray:8 5`);
    }
    const kind = first && second ? relation(first, second) : null;
    const names = { parallel: "párhuzamos", intersecting: "metsző", skew: "kitérő", coincident: "egybeeső" };
    const why = {
      parallel: "Egy síkban vannak, és soha nem találkoznak: az irányuk azonos.",
      intersecting: "Egy síkban vannak, és nem párhuzamosak, ezért egy pontban metszik egymást (akár a kockán kívül is).",
      skew: "Nincs olyan sík, amely mindkettőt tartalmazná. Nem találkoznak, és nem is párhuzamosak.",
      coincident: "Ugyanarra az egyenesre esnek.",
    };
    message.className = `il-message ${kind ? "good" : ""}`;
    message.textContent = !first ? "Kattints az első egyenesre." : !second ? "Kattints a másodikra." : `A két egyenes ${names[kind]}. ${why[kind]}`;
    const angle = kind ? angleBetween(first, second) : null;
    angleLine.textContent = kind === "skew" ? (state.shift > 0.98 ? `A kék egyenest eltoltuk: metszik egymást, a hajlásszögük ${formatNumber(angle, 1)}°.` : `A kitérő egyenesek szöge: az egyiket eltolva metsző egyeneseket kapunk (${formatNumber(angle, 1)}°).`) : kind ? `A két egyenes hajlásszöge: ${formatNumber(angle, 1)}°.` : "";
    renderDistance();
  }

  function renderDistance() {
    distanceFigure.replaceChildren();
    const scale = 38, cx = 300, cy = 160, h = state.height, A = [state.ax, state.ay, 0], P = [0, 0, h], F = [0, 0, 0];
    const at = (p) => { const q = rotate3([p[0], p[1], p[2] - h / 2]); return [cx + q[0] * scale, cy - q[1] * scale]; };
    const plane = [[-3, -3, 0], [3, -3, 0], [3, 3, 0], [-3, 3, 0]];
    svg("polygon", { points: plane.map((p) => at(p).join(",")).join(" "), style: `fill:${PALETTE.violet};fill-opacity:.25;stroke:${PALETTE.violet};stroke-width:2` }, distanceFigure);
    const seg = (a, b, style) => { const [x1, y1] = at(a), [x2, y2] = at(b); svg("line", { x1, y1, x2, y2, style: `${style};stroke-linecap:round` }, distanceFigure); };
    const dot = (p, color, label, dx = 10) => { const [x, y] = at(p); svg("circle", { cx: x, cy: y, r: 6, style: `fill:${color};stroke:var(--input);stroke-width:2` }, distanceFigure); svg("text", { x: x + dx, y: y - 8, text: label, style: `fill:${color};font-weight:700;font-size:15px` }, distanceFigure); };
    const horizontal = Math.hypot(A[0], A[1]);
    if (horizontal > 0) seg(F, A, "stroke:var(--fg-soft);stroke-width:2.5;stroke-dasharray:5 4");
    if (horizontal > 0) seg(P, A, `stroke:${PALETTE.pink};stroke-width:3.5`);
    seg(P, F, `stroke:${PALETTE.green};stroke-width:4.5`);
    if (horizontal > 0) {
      const k = 0.35, u = [A[0] / horizontal, A[1] / horizontal, 0];
      const corner = [[k * u[0], k * u[1], 0], [k * u[0], k * u[1], k], [0, 0, k]];
      svg("polyline", { points: corner.map((p) => at(p).join(",")).join(" "), fill: "none", style: "stroke:var(--fg);stroke-width:1.5" }, distanceFigure);
    }
    dot(F, PALETTE.green, "F", -22); dot(P, PALETTE.green, "P"); if (horizontal > 0) dot(A, PALETTE.pink, "A");
    svg("text", { x: 24, y: 34, text: "a sík", style: `fill:${PALETTE.violet};font-weight:700` }, distanceFigure);
    const slant = Math.hypot(h, horizontal);
    distanceLine.replaceChildren(
      slot(`merőleges: PF = ${formatNumber(h)}`, 24, { align: "left" }), make("br"),
      slot(horizontal > 0 ? `ferde: PA = √(${formatNumber(h)}² + ${formatNumber(horizontal * horizontal)}) = ${formatNumber(slant, 2)}` : "Az A pont éppen az F lábpont: PA = PF.", 50, { align: "left" }), make("br"),
      slot(horizontal > 0 ? "A merőleges szakasz mindig rövidebb: PF < PA." : "", 50, { align: "left" }),
    );
  }

  render();
  return () => scope.clearAll();
}
