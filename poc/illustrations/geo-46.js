import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

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
const DIRECTION_COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green]; // along a, b, c
const FACE_PAIR_COLORS = [PALETTE.green, PALETTE.blue, PALETTE.red]; // bottom/top (a·b), front/back (a·c), left/right (b·c)
const FACE_PAIR = [0, 0, 1, 1, 2, 2];
const MODES = { faces: "lapok", edges: "élek", vertices: "csúcsok" };

// Vertex i: bit 0 -> x (length a), bit 1 -> y (length b), bit 2 -> z (length c).
const vertexPosition = (i, a, b, c) => [(i & 1 ? 0.5 : -0.5) * a, (i & 2 ? 0.5 : -0.5) * b, (i & 4 ? 0.5 : -0.5) * c];
const edgeDirection = (i, j) => Math.log2(i ^ j);

export function mount(root) {
  const state = { a: 4, b: 3, c: 2, mode: "faces", faceDiagonal: false, spaceDiagonal: false };

  root.append(lead("A téglatest az a doboz, amit a mindennapokban is ismersz: lapjai téglalapok, és minden lappal szemben van egy vele egyforma lap. Forgasd meg a testet az egérrel vagy ujjal, és számold meg, hány lapja, éle és csúcsa van!"));

  const figureCard = card("Forgasd meg, és számold meg az elemeit");
  const sliders = ["a", "b", "c"].map((name, k) => range({ label: `${name} él`, min: 1, max: 6, value: state[name], onInput: (value) => { state[name] = value; render(); } }));
  const modeButtons = Object.entries(MODES).map(([mode, text]) => toggle(text, state.mode === mode, () => { state.mode = state.mode === mode ? null : mode; render(); }));
  const diagonalButtons = [
    toggle("lapátló", false, () => { state.faceDiagonal = !state.faceDiagonal; render(); }, PALETTE.amber),
    toggle("testátló", false, () => { state.spaceDiagonal = !state.spaceDiagonal; render(); }, PALETTE.pink),
  ];
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 360", role: "img", "aria-label": "Forgatható téglatest" });
  const countLine = make("div", "il-formula start");
  const diagonalLine = make("div", "il-formula start");
  figureCard.append(controls(...sliders.map((s) => s.element)), controls(make("span", "il-muted", "Emeld ki:"), ...modeButtons, ...diagonalButtons), figure, countLine, diagonalLine);
  root.append(figureCard, keyIdea("a téglatestnek 6 lapja, 12 éle és 8 csúcsa van; az élek 3 irányban állnak, irányonként 4 egyforma hosszú. A testátló hossza √(a² + b² + c²) — ez a Pitagorasz-tétel kétszer egymás után."));
  enableRotation(figure, render);

  function render() {
    const { a, b, c, mode } = state;
    const scale = 650 / (a + b + c + 4);
    const verts = Array.from({ length: 8 }, (_, i) => vertexPosition(i, a, b, c));
    modeButtons.forEach((button, k) => button.setAttribute("aria-pressed", String(Object.keys(MODES)[k] === mode)));
    diagonalButtons[0].setAttribute("aria-pressed", String(state.faceDiagonal));
    diagonalButtons[1].setAttribute("aria-pressed", String(state.spaceDiagonal));
    figure.replaceChildren();
    const fills = mode === "faces" ? FACES.map((_, k) => FACE_PAIR_COLORS[FACE_PAIR[k]]) : [];
    const solid = drawSolid(figure, verts, FACES, {
      scale, cx: 300, cy: 180, fills,
      edgeStyle: (i, j, visible) => mode === "edges"
        ? `stroke:${DIRECTION_COLORS[edgeDirection(i, j)]};stroke-width:${visible ? 4 : 2.5}${visible ? "" : ";stroke-dasharray:5 4"}` : null,
    });
    const tag = (x, y, text, color) => {
      svg("circle", { cx: x, cy: y, r: 11, style: `fill:var(--input);stroke:${color};stroke-width:2` }, figure);
      svg("text", { x, y: y + 4.5, "text-anchor": "middle", text, style: `fill:${color};font-weight:700;font-size:13px` }, figure);
    };
    if (mode === "faces") solid.info.filter((f) => f.front).forEach((f, k) => tag(f.centroid[0], f.centroid[1], String(k + 1), "var(--fg)"));
    if (mode === "edges") {
      let number = 0;
      for (let i = 0; i < 8; i++) for (let bit = 1; bit < 8; bit <<= 1) if (!(i & bit)) {
        const [x1, y1] = solid.project(verts[i]), [x2, y2] = solid.project(verts[i | bit]);
        number += 1;
        tag((x1 + x2) / 2, (y1 + y2) / 2, String(number), DIRECTION_COLORS[Math.log2(bit)]);
      }
    }
    if (mode === "vertices") verts.forEach((v, i) => { const [x, y] = solid.project(v); tag(x, y, String(i + 1), PALETTE.amber); });
    if (state.faceDiagonal) svg("line", { ...lineAttributes(solid.project(verts[0]), solid.project(verts[3])), style: `stroke:${PALETTE.amber};stroke-width:3.5;stroke-linecap:round` }, figure);
    if (state.spaceDiagonal) svg("line", { ...lineAttributes(solid.project(verts[0]), solid.project(verts[7])), style: `stroke:${PALETTE.pink};stroke-width:3.5;stroke-linecap:round` }, figure);

    const counts = { faces: 6, edges: 12, vertices: 8 };
    const detail = { faces: "3 × 2 szemközti lap", edges: "4 + 4 + 4", vertices: "4 alul + 4 felül" };
    countLine.replaceChildren(mode ? make("span", "", `${MODES[mode]}: `) : "Válaszd ki, mit szeretnél megszámolni.", mode ? slot(make("b", "", String(counts[mode])), 2) : "", mode ? make("span", "il-muted", ` (${detail[mode]})`) : "");
    const faceLength = Math.sqrt(a * a + b * b), spaceLength = Math.sqrt(a * a + b * b + c * c);
    diagonalLine.replaceChildren(
      slot("lapátló: ", 10, { align: "left", dim: !state.faceDiagonal }), slot(`√(${a}² + ${b}²) = ${formatNumber(faceLength, 2)}`, 26, { align: "left", dim: !state.faceDiagonal }), make("br"),
      slot("testátló: ", 10, { align: "left", dim: !state.spaceDiagonal }), slot(`√(${a}² + ${b}² + ${c}²) = ${formatNumber(spaceLength, 2)}`, 34, { align: "left", dim: !state.spaceDiagonal }),
    );
  }

  render();
  return () => {};
}

function lineAttributes([x1, y1], [x2, y2]) { return { x1, y1, x2, y2 }; }

