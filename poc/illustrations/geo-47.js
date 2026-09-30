import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

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


const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink];
// Nets as [column, row] cells. Whether a net is valid is computed by folding it, not hard-coded.
const NETS = [
  { name: "kereszt", cells: [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]] },
  { name: "1-4-1", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]] },
  { name: "lépcső", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]] },
  { name: "2-3-1", cells: [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]] },
  { name: "2×2 blokk", cells: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]] },
  { name: "5 egy sorban", cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1]] },
];
const add = (a, b, k = 1) => a.map((v, i) => v + k * b[i]);
const scaleVec = (a, k) => a.map((v) => v * k);

// Folds the net by rotating every square 90 degrees * fold around the edge it shares with its parent.
function foldNet(cells, fold) {
  const keyOf = ([x, y]) => `${x},${y}`;
  const index = new Map(cells.map((cell, i) => [keyOf(cell), i]));
  const frames = new Array(cells.length).fill(null);
  frames[0] = { center: [0.5, -0.5, 0], ex: [1, 0, 0], ey: [0, -1, 0], inside: [0, 0, 1] };
  const angle = fold * Math.PI / 2;
  const queue = [0];
  while (queue.length) {
    const parentIndex = queue.shift(), parent = frames[parentIndex], [px, py] = cells[parentIndex];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const childIndex = index.get(keyOf([px + dx, py + dy]));
      if (childIndex === undefined || frames[childIndex]) continue;
      const direction = add(scaleVec(parent.ex, dx), parent.ey, dy);
      const along = add(scaleVec(direction, Math.cos(angle)), parent.inside, Math.sin(angle));
      frames[childIndex] = {
        center: add(add(parent.center, direction, 0.5), along, 0.5),
        ex: dx ? scaleVec(along, dx) : parent.ex,
        ey: dy ? scaleVec(along, dy) : parent.ey,
        inside: add(scaleVec(parent.inside, Math.cos(angle)), direction, -Math.sin(angle)),
      };
      queue.push(childIndex);
    }
  }
  return frames;
}

// Net squares that land on the same cube face when fully folded.
export function overlappingCells(cells) {
  const seen = new Map(), overlapping = new Set();
  foldNet(cells, 1).forEach((frame, i) => {
    const key = frame.center.map((v) => Math.round(v * 2)).join(",");
    if (seen.has(key)) { overlapping.add(i); overlapping.add(seen.get(key)); } else seen.set(key, i);
  });
  return overlapping;
}

export function mount(root) {
  const scope = createScope();
  const state = { net: 0, fold: 0, heights: [[0, 0, 0, 0], [0, 2, 1, 0], [0, 1, 1, 0], [1, 0, 0, 0]] };
  camera.yaw = 0.35; camera.pitch = 0.85;

  root.append(lead("A háló az a lapos alakzat, amit a kocka lapjaiból kapsz, ha felvágod és kiterített állapotban lefekteted. Nem minden hat négyzetből álló alakzat hajtogatható kockává — próbáld ki! Utána magad is építhetsz kis kockatornyokat, és megnézheted, hogyan látszanak különböző irányból."));

  const netCard = card("Hajtogasd össze a hálót");
  const netButtons = NETS.map((net, i) => toggle(net.name, i === state.net, () => { state.net = i; state.fold = 0; foldSlider.set(0); render(); }));
  const foldSlider = range({ label: "hajtogatás", min: 0, max: 1, step: 0.01, value: 0, format: (v) => `${Math.round(v * 100)}%`, onInput: (value) => { state.fold = value; render(); } });
  const netFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Kockahálo hajtogatása" });
  const netMessage = make("p", "il-message");
  netCard.append(controls(...netButtons), controls(foldSlider.element, button("Hajtogasd!", animate), button("Vissza", () => setFold(0), { ghost: true })), netFigure, netMessage);
  enableRotation(netFigure, render);

  const buildCard = card("Építs kockatornyokat");
  const buildFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img", "aria-label": "Kockaépítmény és három nézete" });
  const viewsFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img", "aria-label": "Elölnézet, felülnézet és oldalnézet" });
  viewsFigure.style.marginTop = "10px";
  buildCard.append(make("p", "il-muted", "Kattints egy négyzetre a bal oldali alaprajzon: eggyel magasabb lesz a torony (4 után újra nulla)."),
    controls(button("Törlés", () => { state.heights = state.heights.map((row) => row.map(() => 0)); render(); }, { ghost: true }),
      button("Véletlen építmény", () => { state.heights = state.heights.map((row) => row.map(() => (Math.random() < 0.55 ? 1 + Math.floor(Math.random() * 3) : 0))); render(); }, { ghost: true })),
    buildFigure, viewsFigure);
  root.append(netCard, buildCard, keyIdea("a kocka hálója 6 négyzet, amelyek összehajtva 6 különböző lapot adnak — ha két négyzet ugyanarra a lapra esne, az nem kockaháló. Egy építményt mindig több nézetből kell megnézni, mert egy nézet elrejti a mögötte álló kockákat."));

  function setFold(value) { scope.clearAll(); state.fold = value; foldSlider.set(value); render(); }
  function animate() {
    scope.clearAll();
    const start = performance.now(), from = state.fold >= 0.99 ? 0 : state.fold;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 2200);
      state.fold = from + (1 - from) * (t * t * (3 - 2 * t)); foldSlider.set(state.fold); renderNet();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }

  function renderNet() {
    const net = NETS[state.net];
    const frames = foldNet(net.cells, state.fold);
    const bad = overlappingCells(net.cells);
    netButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.net)));
    netFigure.replaceChildren();
    const drawn = frames.map((frame, i) => {
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => add(add(frame.center, frame.ex, a / 2), frame.ey, b / 2));
      return { i, corners, depth: rotate3(frame.center)[2] };
    });
    const focus = scaleVec(frames.reduce((s, f) => add(s, f.center), [0, 0, 0]), 1 / frames.length);
    const scale = 92;
    const toScreen = (p) => { const q = rotate3(add(p, focus, -1)); return [300 + q[0] * scale, 170 - q[1] * scale]; };
    drawn.sort((a, b) => b.depth - a.depth).forEach(({ i, corners }) => {
      const colliding = state.fold > 0.97 && bad.has(i);
      svg("polygon", { points: corners.map((p) => toScreen(p).join(",")).join(" "), style: `fill:${COLORS[i]};fill-opacity:.78;stroke:${colliding ? "var(--fg)" : "var(--input)"};stroke-width:${colliding ? 4 : 2};stroke-linejoin:round` }, netFigure);
    });
    const ok = bad.size === 0;
    netMessage.className = `il-message ${state.fold > 0.97 ? (ok ? "good" : "warn") : ""}`;
    netMessage.textContent = state.fold <= 0.97
      ? "Húzd a csúszkát, vagy nyomd meg a Hajtogasd! gombot. A rajzot az egérrel el is forgathatod."
      : ok ? "Ez a háló jó: a 6 négyzet 6 különböző lapot ad, kész a kocka."
        : "Ez nem kockaháló: két négyzet ugyanarra a lapra esik (vastag kerettel jelöltük), a kocka egyik lapja pedig üresen marad.";
  }

  function renderBuild() {
    const heights = state.heights; // heights[row][column], row 0 = back
    buildFigure.replaceChildren();
    const s = 34, cos = Math.cos(Math.PI / 6), sin = 0.5;
    const toScreen = (x, y, z) => [330 + (x + y - 3) * cos * s, 170 + (x - y) * sin * s - z * s];
    const poly = (points, fill) => svg("polygon", { points: points.map((p) => toScreen(...p).join(",")).join(" "), style: `fill:${fill};stroke:var(--input);stroke-width:1.5;stroke-linejoin:round` }, buildFigure);
    for (let y = 3; y >= 0; y--) for (let x = 0; x < 4; x++) {
      const h = heights[3 - y][x];
      poly([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]], "var(--line)");
      for (let z = 0; z < h; z++) {
        poly([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], PALETTE.blue);
        poly([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], PALETTE.violet);
        poly([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], PALETTE.green);
      }
    }
    // Clickable plan on the left.
    const cell = 40, left = 30, top = 45;
    svg("text", { x: left, y: 28, text: "Alaprajz (kattints)", style: "font-weight:700" }, buildFigure);
    heights.forEach((row, r) => row.forEach((h, c) => {
      const group = svg("g", { style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": `Torony magassága: ${h}` }, buildFigure);
      svg("rect", { x: left + c * cell, y: top + r * cell, width: cell, height: cell, style: `fill:${h ? PALETTE.blue : "var(--surface)"};fill-opacity:${h ? 0.25 + 0.17 * h : 1};stroke:var(--line-strong)` }, group);
      svg("text", { x: left + c * cell + cell / 2, y: top + r * cell + cell / 2 + 5, "text-anchor": "middle", text: String(h), style: "font-weight:700;fill:var(--fg)" }, group);
      const bump = () => { state.heights[r][c] = (h + 1) % 5; render(); };
      group.addEventListener("click", bump);
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); bump(); } });
    }));
    svg("text", { x: left + 2 * cell, y: top + 4 * cell + 18, "text-anchor": "middle", text: "hátul ↑ elöl ↓", style: "font-size:11px;fill:var(--dim)" }, buildFigure);

    // Three views: front (column maxima), top (occupied columns) and right side (row maxima, front to back).
    viewsFigure.replaceChildren();
    const u = 28;
    const panel = (x0, title, cellsAt) => {
      svg("text", { x: x0, y: 22, text: title, style: "font-weight:700" }, viewsFigure);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const filled = cellsAt(i, j);
        svg("rect", { x: x0 + i * u, y: 35 + j * u, width: u, height: u, style: `fill:${filled ? PALETTE.blue : "transparent"};fill-opacity:.6;stroke:var(--line-strong)` }, viewsFigure);
      }
    };
    const columnMax = (c) => Math.max(...heights.map((row) => row[c]));
    const frontRowMax = (r) => Math.max(...heights[r]);
    panel(30, "Elölnézet", (i, j) => 3 - j < columnMax(i));
    panel(225, "Felülnézet", (i, j) => heights[j][i] > 0);
    // Seen from the right, the left edge of the picture is the front (row 3).
    panel(420, "Oldalnézet (jobbról)", (i, j) => 3 - j < frontRowMax(3 - i));
  }

  function render() { renderNet(); renderBuild(); }
  render();
  return () => scope.clearAll();
}

