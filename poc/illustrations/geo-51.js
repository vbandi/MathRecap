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


const EDGE_COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink];

// Base polygon (counter-clockwise), its area T and perimeter P.
export function baseShape(kind, size, other) {
  if (kind === "triangle") {
    const p = size, q = other, points = [[0, 0], [p, 0], [0, q]];
    const centroid = [p / 3, q / 3];
    return { points: points.map(([x, y]) => [x - centroid[0], y - centroid[1]]), area: (p * q) / 2 };
  }
  const points = Array.from({ length: 6 }, (_, i) => [size * Math.cos((Math.PI * i) / 3), size * Math.sin((Math.PI * i) / 3)]);
  return { points, area: (3 * Math.sqrt(3) / 2) * size * size };
}
const edgeLengths = (points) => points.map(([x, y], i) => Math.hypot(points[(i + 1) % points.length][0] - x, points[(i + 1) % points.length][1] - y));

export function mount(root) {
  const scope = createScope();
  const state = { kind: "triangle", p: 3, q: 4, a: 2, m: 3, layers: 3, unrolled: 0 };

  root.append(lead("Az egyenes hasáb olyan, mint egy egymásra rakott lapkákból álló torony: minden lapka pontosan az alap alakját veszi fel. Ebből kiderül a térfogat. A palástját pedig ki lehet teríteni egyetlen téglalappá — abból pedig a felszín."));

  const main = card("Térfogat: az alap rétegenként egymásra rakva");
  const kindButtons = [["triangle", "háromszög alap"], ["hexagon", "szabályos hatszög alap"]].map(([kind, text]) => toggle(text, state.kind === kind, () => { state.kind = kind; render(); }));
  const pSlider = range({ label: "befogó", min: 1, max: 6, value: state.p, onInput: (value) => { state.p = value; render(); } });
  const qSlider = range({ label: "másik befogó", min: 1, max: 6, value: state.q, onInput: (value) => { state.q = value; render(); } });
  const aSlider = range({ label: "oldal", min: 1, max: 4, value: state.a, onInput: (value) => { state.a = value; render(); } });
  const mSlider = range({ label: "magasság (m)", min: 1, max: 5, value: state.m, onInput: (value) => { state.m = value; state.layers = Math.min(state.layers, value); layerSlider.input.max = value; layerSlider.set(state.layers); render(); } });
  const layerSlider = range({ label: "megtöltött rétegek", min: 0, max: state.m, value: state.layers, onInput: (value) => { state.layers = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Forgatható egyenes hasáb, rétegekre bontva" });
  const volumeLine = make("div", "il-formula start");
  main.append(controls(...kindButtons), controls(pSlider.element, qSlider.element, aSlider.element, mSlider.element), controls(layerSlider.element), figure, volumeLine);
  enableRotation(figure, render);

  const side = card("Palást: a hasáb oldallapjai egy téglalappá terítve");
  const stripFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img", "aria-label": "A hasáb alaplapja és kiterített palástja" });
  const surfaceLine = make("div", "il-formula start");
  side.append(controls(button("Terítsd ki / hajtsd vissza", unroll)), stripFigure, surfaceLine);
  root.append(main, side, keyIdea("az egyenes hasáb térfogata V = T · m (alapterület · magasság), felszíne A = 2T + P · m, ahol P az alap kerülete — mert a palást kiterítve egy P hosszú és m magas téglalap."));

  function unroll() {
    scope.clearAll();
    const from = state.unrolled, to = from > 0.5 ? 0 : 1, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1500);
      state.unrolled = from + (to - from) * (t * t * (3 - 2 * t)); renderStrips();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }

  const shape = () => (state.kind === "triangle" ? baseShape("triangle", state.p, state.q) : baseShape("hexagon", state.a));

  function renderSolid() {
    const { m, layers } = state, { points, area } = shape(), n = points.length;
    kindButtons.forEach((b, i) => b.setAttribute("aria-pressed", String((i === 0) === (state.kind === "triangle"))));
    const tri = state.kind === "triangle";
    [pSlider, qSlider].forEach((s) => { s.input.disabled = !tri; s.element.style.opacity = tri ? 1 : 0.35; });
    aSlider.input.disabled = tri; aSlider.element.style.opacity = tri ? 0.35 : 1;
    const reach = Math.max(...points.map(([x, y]) => Math.hypot(x, y)));
    const verts = [...points.map(([x, y]) => [x, y, -m / 2]), ...points.map(([x, y]) => [x, y, m / 2])];
    const faces = [points.map((_, i) => i).reverse()];
    for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
    faces.push(points.map((_, i) => n + i));
    const scale = Math.min(50, 330 / (m + 1.6 * reach));
    const fills = []; fills[n + 1] = PALETTE.amber;
    figure.replaceChildren();
    const solid = drawSolid(figure, verts, faces, { scale, cx: 300, cy: 175, fills, fillOpacity: 0.25 });
    const at = (i, z, t = 0) => {
      const a = verts[i], b = verts[(i + 1) % n];
      return solid.project([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, -m / 2 + z]);
    };
    // Layer stripes on the visible side faces (layers that are filled are tinted).
    for (let i = 0; i < n; i++) {
      if (!solid.info[i + 1].front) continue;
      for (let k = 0; k < m; k++) {
        const corners = [at(i, k), at(i, k + 1), at(i, k + 1, 1), at(i, k, 1)];
        svg("polygon", { points: corners.map((p) => p.join(",")).join(" "), style: `fill:${k < layers ? PALETTE.blue : "transparent"};fill-opacity:${k % 2 ? 0.55 : 0.4};stroke:var(--fg-soft);stroke-width:1` }, figure);
      }
    }
    if (layers > 0 && layers < m) {
      const cut = points.map(([x, y]) => solid.project([x, y, -m / 2 + layers]));
      svg("polygon", { points: cut.map((p) => p.join(",")).join(" "), style: `fill:${PALETTE.amber};fill-opacity:.55;stroke:${PALETTE.amber};stroke-width:2` }, figure);
    }
    const top = solid.info[n + 1];
    svg("text", { x: top.centroid[0], y: top.centroid[1] + 5, "text-anchor": "middle", text: "T", style: `fill:var(--fg);font-weight:800;font-size:20px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, figure);

    volumeLine.replaceChildren(
      slot(`alapterület: T = ${formatNumber(area, 2)}`, 26, { align: "left" }), make("br"),
      slot(`${layers} réteg: ${formatNumber(area, 2)} · ${layers} = ${formatNumber(area * layers, 2)}`, 34, { align: "left" }), make("br"),
      slot(`V = T · m = ${formatNumber(area, 2)} · ${m} = ${formatNumber(area * m, 2)}`, 34, { align: "left", dim: layers < m }),
    );
  }

  function renderStrips() {
    const { m, unrolled } = state, { points, area } = shape(), n = points.length, lengths = edgeLengths(points);
    const perimeter = lengths.reduce((s, v) => s + v, 0);
    stripFigure.replaceChildren();
    const s = Math.min((520 - 14 * (n - 1)) / perimeter, 22), left = 300 - (perimeter * s + 14 * (n - 1)) / 2, baseReach = Math.max(...points.map(([x, y]) => Math.hypot(x, y)));
    // Base outline, edges coloured like the strips beneath.
    const bs = Math.min(20, 70 / baseReach), bx = 300, by = 62;
    points.forEach(([x, y], i) => {
      const [x2, y2] = points[(i + 1) % n];
      svg("line", { x1: bx + x * bs, y1: by - y * bs, x2: bx + x2 * bs, y2: by - y2 * bs, style: `stroke:${EDGE_COLORS[i]};stroke-width:5;stroke-linecap:round` }, stripFigure);
    });
    svg("text", { x: bx - baseReach * bs - 12, y: by + 5, "text-anchor": "end", text: "az alap, felülnézetből", style: "fill:var(--dim)" }, stripFigure);
    const gap = (1 - unrolled) * 14;
    let x = 300 - (perimeter * s + gap * (n - 1)) / 2;
    lengths.forEach((length, i) => {
      svg("rect", { x, y: 135, width: length * s, height: m * s, style: `fill:${EDGE_COLORS[i]};fill-opacity:.75;stroke:var(--input);stroke-width:2` }, stripFigure);
      svg("text", { x: x + length * s / 2, y: 135 + m * s / 2 + 5, "text-anchor": "middle", text: formatNumber(length, 2), style: "fill:#fff;font-weight:700" }, stripFigure);
      x += length * s + gap;
    });
    svg("text", { x: left - 6, y: 135 + m * s / 2 + 5, "text-anchor": "end", text: `m = ${m}`, style: "fill:var(--fg);font-weight:700" }, stripFigure);
    if (unrolled > 0.98) svg("text", { x: 300, y: 135 + m * s + 22, "text-anchor": "middle", text: `kerület P = ${formatNumber(perimeter, 2)}`, style: "fill:var(--fg);font-weight:700" }, stripFigure);
    const lateral = perimeter * m;
    surfaceLine.replaceChildren(
      slot(`palást: P · m = ${formatNumber(perimeter, 2)} · ${m} = ${formatNumber(lateral, 2)}`, 40, { align: "left" }), make("br"),
      slot(`A = 2T + P · m = ${formatNumber(2 * area, 2)} + ${formatNumber(lateral, 2)} = ${formatNumber(2 * area + lateral, 2)}`, 52, { align: "left" }),
    );
  }

  function render() { renderSolid(); renderStrips(); }
  render();
  return () => scope.clearAll();
}
