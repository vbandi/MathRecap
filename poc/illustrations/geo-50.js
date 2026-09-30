import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, rich, slot, svg } from "./kit.js";

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


const PAIR_COLORS = [PALETTE.green, PALETTE.blue, PALETTE.red]; // a·b, a·c, b·c

export function surfaceArea(a, b, c) { return 2 * (a * b + b * c + c * a); }
export function volume(a, b, c) { return a * b * c; }

export function mount(root) {
  const scope = createScope();
  const state = { a: 4, b: 3, c: 2, layers: 1, fold: 0 };
  camera.yaw = -0.3; camera.pitch = 0.9;

  root.append(lead("A téglatest térfogata azt mondja meg, hány egységkocka fér bele, a felszíne pedig azt, mekkora papír kell a beburkolásához. Rakd ki a testet kockákkal rétegről rétegre, majd vágd fel és terítsd ki a lapjait!"));

  const sliders = ["a", "b", "c"].map((name) => range({ label: `${name} él`, min: 1, max: 6, value: state[name], onInput: (value) => { state[name] = value; state.layers = Math.min(state.layers, state.c); layerSlider.input.max = state.c; layerSlider.set(state.layers); render(); } }));

  // --- Volume ---
  const volumeCard = card("Térfogat: kockák rétegenként");
  const layerSlider = range({ label: "rétegek", min: 0, max: state.c, value: state.layers, onInput: (value) => { scope.clearAll(); state.layers = value; render(); } });
  const boxFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 330", role: "img", "aria-label": "Téglatest kirakása egységkockákból" });
  const volumeLine = make("div", "il-formula start");
  volumeCard.append(controls(...sliders.map((s) => s.element)), controls(layerSlider.element, button("Töltsd fel!", fill), button("Ürítsd ki", () => { scope.clearAll(); state.layers = 0; layerSlider.set(0); render(); }, { ghost: true })), boxFigure, volumeLine);

  // --- Surface ---
  const surfaceCard = card("Felszín: a téglatest hálója");
  const foldSlider = range({ label: "összehajtás", min: 0, max: 1, step: 0.01, value: 0, format: (v) => `${Math.round(v * 100)}%`, onInput: (value) => { scope.clearAll(); state.fold = value; renderNet(); } });
  const netFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Téglatest kiterített hálója" });
  const surfaceLine = make("div", "il-formula start");
  surfaceCard.append(controls(foldSlider.element, button("Kiterít / összehajt", toggleFold)), netFigure, surfaceLine);
  enableRotation(netFigure, renderNet);
  root.append(volumeCard, surfaceCard, keyIdea("a téglatest térfogata V = a · b · c (egy réteg a · b kocka, és c réteg van), felszíne A = 2 · (ab + bc + ca), mert három lappár van, és minden lappárban két egyforma téglalap."));

  function fill() {
    scope.clearAll();
    state.layers = 0; layerSlider.set(0); render();
    const step = () => { if (state.layers >= state.c) return; state.layers += 1; layerSlider.set(state.layers); render(); scope.timeout(step, 800); };
    scope.timeout(step, 400);
  }
  function toggleFold() {
    scope.clearAll();
    const from = state.fold, to = from > 0.5 ? 0 : 1, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1800);
      state.fold = from + (to - from) * (t * t * (3 - 2 * t)); foldSlider.set(state.fold); renderNet();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }

  function renderBox() {
    const { a, b, c, layers } = state;
    const s = Math.min(40, 330 / ((a + b) / 2 + c + 0.8)), cos = Math.cos(Math.PI / 6);
    const cy0 = 165 - (-(b * 0.5 * s) - c * s + a * 0.5 * s) / 2;
    const at = (x, y, z) => [300 + (x + y - (a + b) / 2) * cos * s, cy0 + (x - y) * 0.5 * s - z * s];
    boxFigure.replaceChildren();
    const poly = (points, color, opacity = 1) => svg("polygon", { points: points.map((p) => at(...p).join(",")).join(" "), style: `fill:${color};fill-opacity:${opacity};stroke:var(--input);stroke-width:1;stroke-linejoin:round` }, boxFigure);
    // Floor of the box and the thin outline of the whole cuboid.
    poly([[0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0]], "var(--line)", 0.7);
    for (let z = 0; z < layers; z++) for (let y = b - 1; y >= 0; y--) for (let x = 0; x < a; x++) {
      poly([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], PAIR_COLORS[1]);
      poly([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], PAIR_COLORS[2]);
      poly([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], PAIR_COLORS[0]);
    }
    const outline = (p, q) => { const [x1, y1] = at(...p), [x2, y2] = at(...q); svg("line", { x1, y1, x2, y2, style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4;opacity:.7" }, boxFigure); };
    for (const z of [0, c]) { outline([0, 0, z], [a, 0, z]); outline([a, 0, z], [a, b, z]); outline([a, b, z], [0, b, z]); outline([0, b, z], [0, 0, z]); }
    for (const [x, y] of [[0, 0], [a, 0], [a, b], [0, b]]) outline([x, y, 0], [x, y, c]);
    const { a: A, b: B, c: C } = state;
    volumeLine.replaceChildren(
      slot(`egy réteg: a · b = ${A} · ${B} = ${A * B} kocka`, 38, { align: "left" }), make("br"),
      slot(`${layers} réteg: ${A * B} · ${layers} = ${A * B * layers} kocka`, 38, { align: "left" }), make("br"),
      slot(`teljes test: a · b · c = ${A} · ${B} · ${C} = ${volume(A, B, C)}`, 44, { align: "left", dim: layers < C }),
    );
  }

  function renderNet() {
    const { a, b, c, fold } = state, theta = fold * Math.PI / 2;
    const cosT = Math.cos(theta), sinT = Math.sin(theta), cos2 = Math.cos(2 * theta), sin2 = Math.sin(2 * theta);
    const scale = Math.min(60, 540 / (a + 2 * c + 0.5), 290 / (2 * b + c + 0.5));
    const faces = [
      { pair: 0, name: "a·b", pts: [[0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0]] },
      { pair: 1, name: "a·c", pts: [[0, 0, 0], [a, 0, 0], [a, -c * cosT, c * sinT], [0, -c * cosT, c * sinT]] },
      { pair: 1, name: "a·c", pts: [[0, b, 0], [a, b, 0], [a, b + c * cosT, c * sinT], [0, b + c * cosT, c * sinT]] },
      { pair: 2, name: "b·c", pts: [[0, 0, 0], [0, b, 0], [-c * cosT, b, c * sinT], [-c * cosT, 0, c * sinT]] },
      { pair: 2, name: "b·c", pts: [[a, 0, 0], [a, b, 0], [a + c * cosT, b, c * sinT], [a + c * cosT, 0, c * sinT]] },
    ];
    const backEnd = [b + c * cosT, c * sinT];
    faces.push({ pair: 0, name: "a·b", pts: [[0, backEnd[0], backEnd[1]], [a, backEnd[0], backEnd[1]], [a, backEnd[0] + b * cos2, backEnd[1] + b * sin2], [0, backEnd[0] + b * cos2, backEnd[1] + b * sin2]] });
    const mid = [a / 2, b - fold * b / 2, c / 2 * fold];
    const project = (p) => { const q = rotate3([p[0] - mid[0], p[1] - mid[1], p[2] - mid[2]]); return { x: 300 + q[0] * scale, y: 170 - q[1] * scale, depth: q[2] }; };
    netFigure.replaceChildren();
    faces.map((face) => ({ ...face, q: face.pts.map(project) })).map((face) => ({ ...face, depth: face.q.reduce((s, p) => s + p.depth, 0) }))
      .sort((p, q) => q.depth - p.depth).forEach((face) => {
        svg("polygon", { points: face.q.map((p) => `${p.x},${p.y}`).join(" "), style: `fill:${PAIR_COLORS[face.pair]};fill-opacity:.72;stroke:var(--input);stroke-width:2;stroke-linejoin:round` }, netFigure);
        const cx = face.q.reduce((s, p) => s + p.x, 0) / 4, cy = face.q.reduce((s, p) => s + p.y, 0) / 4;
        svg("text", { x: cx, y: cy + 5, "text-anchor": "middle", text: face.name, style: "fill:#fff;font-weight:700;font-size:15px" }, netFigure);
      });
    const term = (value, pair) => { const el = make("b", "", String(value)); el.style.color = PAIR_COLORS[pair]; return slot(el, 3); };
    surfaceLine.replaceChildren(
      rich("A = 2 · (ab + bc + ca)"), make("br"),
      rich("A = 2 · (", term(a * b, 0), " + ", term(b * c, 2), " + ", term(c * a, 1), ") = ", slot(make("b", "", String(surfaceArea(a, b, c))), 3)),
    );
  }

  function render() { renderBox(); renderNet(); }
  render();
  return () => scope.clearAll();
}
