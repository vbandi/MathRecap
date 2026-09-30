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


// Profiles in the (radius, height) half-plane; the axis is the line radius = 0.
const semicircle = Array.from({ length: 25 }, (_, i) => { const t = -Math.PI / 2 + (Math.PI * i) / 24; return [2.2 * Math.cos(t), 2.2 * Math.sin(t) + 2.2]; });
export const SHAPES = [
  { id: "rectangle", name: "téglalap", solid: "henger", points: [[0, 0], [2, 0], [2, 3], [0, 3]], generator: [[2, 0], [2, 3]],
    text: "A téglalapot az egyik oldala körül megforgatva hengert kapunk. A forgástengelyre merőleges oldalak körlapokat (alap, fedőlap) rajzolnak, a tengellyel párhuzamos szemközti oldal pedig a palástot." },
  { id: "triangle", name: "derékszögű háromszög", solid: "kúp", points: [[0, 0], [2, 0], [0, 3]], generator: [[2, 0], [0, 3]],
    text: "A derékszögű háromszöget az egyik befogója körül megforgatva kúpot kapunk. Az átfogó súrolja a palástot — ezt az átfogót hívjuk a kúp alkotójának." },
  { id: "semicircle", name: "félkör", solid: "gömb", points: semicircle, generator: null,
    text: "A félkört az átmérője körül megforgatva gömböt kapunk. A gömbnek nincs éle, nincs két egyforma alapja: minden pontja ugyanolyan messze van a középpontjától." },
  { id: "trapezoid", name: "derékszögű trapéz", solid: "csonkakúp", points: [[0, 0], [3, 0], [1.5, 3], [0, 3]], generator: [[3, 0], [1.5, 3]],
    text: "A derékszögű trapézt a merőleges szára körül megforgatva csonkakúpot kapunk: olyan kúpot, amelynek a csúcsát egy alaplappal párhuzamos síkkal levágtuk. Két különböző méretű körlap az alap és a fedőlap." },
];

export function mount(root) {
  const scope = createScope();
  const state = { shape: 0, angle: 360 };
  camera.yaw = 0.5; camera.pitch = 0.3;

  root.append(lead("Ha egy lapos síkidomot egy egyenes (a forgástengely) körül körbeforgatunk, egy térbeli test keletkezik — ez a forgástest. Válassz síkidomot, és nézd meg, milyen testet súrol a forgatás közben!"));

  const main = card("Forgasd meg a síkidomot");
  const shapeButtons = SHAPES.map((shape, i) => toggle(shape.name, i === state.shape, () => { scope.clearAll(); state.shape = i; render(); }));
  const angle = range({ label: "elforgatás", min: 0, max: 360, step: 5, value: state.angle, format: (v) => `${v}°`, onInput: (value) => { scope.clearAll(); state.angle = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Forgástest keletkezése" });
  const message = make("p", "il-message");
  const legend = make("div", "il-controls");
  main.append(controls(...shapeButtons), controls(angle.element, button("Forgasd meg!", spin)), figure, legend, message);
  root.append(main, keyIdea("a forgástest a síkidom forgatásával keletkezik: a tengelyre merőleges oldal körlapot súrol, a tengelytől távolodó oldal pedig a palástot. A palástot súroló oldalt alkotónak hívjuk — a hengernél, kúpnál és csonkakúpnál is."));
  enableRotation(figure, render);

  function spin() {
    scope.clearAll();
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 3500);
      state.angle = Math.round(360 * t); angle.set(state.angle); render();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }

  function render() {
    const shape = SHAPES[state.shape], phi = (state.angle * Math.PI) / 180;
    shapeButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.shape)));
    const heights = shape.points.map(([, z]) => z), zc = (Math.min(...heights) + Math.max(...heights)) / 2;
    const scale = 58, cx = 300, cy = 175;
    const at = (r, z, a) => { const q = rotate3([r * Math.cos(a), r * Math.sin(a), z - zc]); return { x: cx + q[0] * scale, y: cy - q[1] * scale, depth: q[2] }; };
    figure.replaceChildren();
    const top = Math.max(...heights) + 0.6;
    const axisTop = at(0, top, 0), axisBottom = at(0, Math.min(...heights) - 0.6, 0);
    svg("line", { x1: axisBottom.x, y1: axisBottom.y, x2: axisTop.x, y2: axisTop.y, style: `stroke:${PALETTE.green};stroke-width:2.5;stroke-dasharray:9 5` }, figure);
    svg("text", { x: axisTop.x + 8, y: axisTop.y + 4, text: "tengely", style: `fill:${PALETTE.green};font-weight:700;font-size:15px` }, figure);

    const slices = Math.max(1, Math.round(phi / 0.12));
    const copies = Array.from({ length: slices + 1 }, (_, k) => (phi * k) / slices).map((a) => {
      const points = shape.points.map(([r, z]) => at(r, z, a));
      return { a, points, depth: points.reduce((s, p) => s + p.depth, 0) / points.length };
    }).sort((p, q) => q.depth - p.depth);
    if (phi > 0) copies.forEach(({ points }) => svg("polygon", { points: points.map((p) => `${p.x},${p.y}`).join(" "), style: `fill:${PALETTE.blue};fill-opacity:.17;stroke:none` }, figure));
    // Circles traced by the profile's corner points.
    const step = shape.points.length > 8 ? 4 : 1;
    shape.points.forEach(([r, z], i) => {
      if (r < 1e-9 || i % step) return;
      const ring = Array.from({ length: Math.max(2, Math.round(phi / 0.1) + 1) }, (_, k) => at(r, z, (phi * k) / Math.max(1, Math.round(phi / 0.1)))).map((p) => `${p.x},${p.y}`).join(" ");
      if (phi > 0) svg("polyline", { points: ring, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:1.6;opacity:.8` }, figure);
    });
    const outline = (a, style) => svg("polygon", { points: shape.points.map(([r, z]) => { const p = at(r, z, a); return `${p.x},${p.y}`; }).join(" "), style: `${style};stroke-linejoin:round` }, figure);
    outline(phi, `fill:${PALETTE.amber};fill-opacity:.35;stroke:${PALETTE.amber};stroke-width:2`);
    outline(0, `fill:${PALETTE.amber};fill-opacity:.55;stroke:${PALETTE.amber};stroke-width:3`);
    if (shape.generator) {
      const [[r1, z1], [r2, z2]] = shape.generator, p1 = at(r1, z1, 0), p2 = at(r2, z2, 0);
      svg("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, style: `stroke:${PALETTE.pink};stroke-width:5;stroke-linecap:round` }, figure);
      svg("text", { x: (p1.x + p2.x) / 2 + 12, y: (p1.y + p2.y) / 2, text: "alkotó", style: `fill:${PALETTE.pink};font-weight:700;font-size:15px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, figure);
      if (phi > 1) {
        const mid = at((r1 + r2) / 2, (z1 + z2) / 2, Math.min(phi, Math.PI) / 2 + 0.6);
        svg("text", { x: mid.x, y: mid.y, "text-anchor": "middle", text: "palást", style: `fill:var(--fg);font-weight:700;font-size:15px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, figure);
      }
    }
    legend.replaceChildren(...[["tengely", PALETTE.green], ["síkidom", PALETTE.amber], ...(shape.generator ? [["alkotó", PALETTE.pink]] : [])].map(([text, color]) => {
      const item = make("span", "il-muted", `— ${text}`); item.style.color = color; item.style.fontWeight = "700"; return item;
    }));
    message.textContent = state.angle === 360 ? `${shape.name[0].toUpperCase()}${shape.name.slice(1)} → ${shape.solid}. ${shape.text}` : `A ${shape.name} már ${state.angle}°-ot fordult el. Húzd tovább a csúszkát, vagy nyomd meg a Forgasd meg! gombot.`;
  }

  render();
  return () => scope.clearAll();
}
