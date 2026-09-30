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


const RADIUS = 1.6;

// Base polygon in the plane z = 0; a prism's top copy is the base shifted up by `height` and sideways by `slant`.
export function buildSolid({ n, kind, height, slant }) {
  const base = Array.from({ length: n }, (_, i) => [RADIUS * Math.cos((2 * Math.PI * i) / n), RADIUS * Math.sin((2 * Math.PI * i) / n), 0]);
  const faces = [base.map((_, i) => i).reverse()];
  if (kind === "prism") {
    const top = base.map(([x, y]) => [x + slant, y, height]);
    for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
    faces.push(top.map((_, i) => n + i));
    return { verts: [...base, ...top], faces, apex: null };
  }
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n]);
  return { verts: [...base, [0, 0, height]], faces, apex: n };
}

export function counts(n, kind) {
  return kind === "prism" ? { vertices: 2 * n, edges: 3 * n, faces: n + 2 } : { vertices: n + 1, edges: 2 * n, faces: n + 1 };
}

export function mount(root) {
  const state = { n: 4, kind: "prism", height: 3, slant: 0 };

  root.append(lead("A hasáb és a gúla is sokszög alakú lapra épül — ezt nevezzük alapnak. A hasábnak az alap egy másolata is ott van fent, a gúlának viszont az oldalsó lapok egyetlen pontban, a csúcsban találkoznak. Változtasd az alap oldalszámát, és figyeld, mi változik!"));

  const main = card("Hasáb vagy gúla?");
  const kindButtons = [["prism", "hasáb"], ["pyramid", "gúla"]].map(([kind, text]) => toggle(text, state.kind === kind, () => { state.kind = kind; render(); }));
  const sides = range({ label: "alap oldalszáma", min: 3, max: 8, value: state.n, onInput: (value) => { state.n = value; render(); } });
  const height = range({ label: "testmagasság", min: 1, max: 4, step: 0.5, value: state.height, onInput: (value) => { state.height = value; render(); } });
  const slant = range({ label: "ferdeség", min: 0, max: 2, step: 0.5, value: state.slant, onInput: (value) => { state.slant = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 360", role: "img", "aria-label": "Forgatható hasáb vagy gúla" });
  const legend = make("div", "il-controls");
  legend.append(...[["alapél", PALETTE.amber], ["oldalél", PALETTE.pink], ["testmagasság", PALETTE.green]].map(([text, color]) => {
    const item = make("span", "il-muted", `— ${text}`);
    item.style.color = color; item.style.fontWeight = "700";
    return item;
  }));
  const table = make("div", "il-formula start");
  const note = make("p", "il-message");
  main.append(controls(...kindButtons, sides.element), controls(height.element, slant.element), figure, legend, table, note);
  root.append(main, keyIdea("a hasáb és a gúla az alapjáról kapja a nevét (háromszög alapú, négyszög alapú…). A testmagasság az alaplapra merőleges távolság: hasábnál a két alaplap között, gúlánál a csúcstól az alaplapig — ferde hasábnál ez rövidebb, mint az oldalél."));
  enableRotation(figure, render);

  function render() {
    const { n, kind, height: h } = state;
    const shift = kind === "prism" ? state.slant : 0;
    slant.input.disabled = kind !== "prism";
    slant.element.style.opacity = kind === "prism" ? 1 : 0.35;
    kindButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(["prism", "pyramid"][i] === kind)));
    const { verts, faces, apex } = buildSolid({ n, kind, height: h, slant: shift });
    const centred = verts.map(([x, y, z]) => [x - shift / 2, y, z - h / 2]);
    figure.replaceChildren();
    const solid = drawSolid(figure, centred, faces, { scale: 52, cx: 300, cy: 185, fillOpacity: 0.22 });
    const line = (from, to, color, extra = "") => {
      const [x1, y1] = solid.project(from), [x2, y2] = solid.project(to);
      svg("line", { x1, y1, x2, y2, style: `stroke:${color};stroke-width:4;stroke-linecap:round;${extra}` }, figure);
      return [(x1 + x2) / 2, (y1 + y2) / 2];
    };
    const text = (point, content, color, dx = 10) => svg("text", { x: point[0] + dx, y: point[1] - 6, text: content, style: `fill:${color};font-weight:700;font-size:15px;paint-order:stroke;stroke:var(--input);stroke-width:4px` }, figure);
    text(line(centred[0], centred[1], PALETTE.amber), "alapél", PALETTE.amber, -20);
    const sideTop = apex ?? n + 1;
    text(line(centred[1], centred[sideTop], PALETTE.pink), "oldalél", PALETTE.pink);
    const tip = apex ? centred[apex] : centred[n];
    const foot = [tip[0], tip[1], -h / 2];
    const heightMid = line(tip, foot, PALETTE.green, "stroke-dasharray:7 5;stroke-width:3.5");
    text([heightMid[0], heightMid[1] + 34], "testmagasság", PALETTE.green);
    const [fx, fy] = solid.project(foot);
    svg("circle", { cx: fx, cy: fy, r: 4, style: `fill:${PALETTE.green}` }, figure);

    const c = counts(n, kind), sideLength = kind === "prism" ? Math.hypot(h, shift) : null;
    table.replaceChildren(
      "csúcsok ", slot(String(c.vertices), 2), "  élek ", slot(String(c.edges), 2), "  lapok ", slot(String(c.faces), 2),
      make("br"), slot(`V − E + F = ${c.vertices} − ${c.edges} + ${c.faces} = ${c.vertices - c.edges + c.faces}`, 32, { align: "left" }),
    );
    note.textContent = kind === "prism"
      ? (shift === 0
        ? `Egyenes hasáb: az oldalélek merőlegesek az alapra, ezért az oldalél hossza (${formatNumber(h)}) egyenlő a testmagassággal. Az oldallapok téglalapok.`
        : `Ferde hasáb: az oldalél (${formatNumber(sideLength, 2)}) hosszabb a testmagasságnál (${formatNumber(h)}), mert nem merőleges az alapra. Az oldallapok paralelogrammák.`)
      : `A gúla minden oldallapja háromszög, és mind a ${n} oldalél a csúcsban találkozik.`;
  }

  render();
  return () => {};
}
