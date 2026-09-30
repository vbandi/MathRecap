import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 360 }, CENTER = { x: 320, y: 200 }, RADIUS = 140;
const A_POINT = { x: CENTER.x - RADIUS, y: CENTER.y }, B_POINT = { x: CENTER.x + RADIUS, y: CENTER.y };
const DEGREES = 180 / Math.PI;

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

const angleBetween = (vertex, p, q) => {
  const ux = p.x - vertex.x, uy = p.y - vertex.y, vx = q.x - vertex.x, vy = q.y - vertex.y;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / Math.hypot(ux, uy) / Math.hypot(vx, vy)))) * DEGREES;
};

// Small arc at `vertex` from the direction of p to the direction of q (the angle p-vertex-q).
function arcPath(vertex, p, q, radius) {
  const first = Math.atan2(p.y - vertex.y, p.x - vertex.x), second = Math.atan2(q.y - vertex.y, q.x - vertex.x);
  let difference = second - first;
  while (difference > Math.PI) difference -= 2 * Math.PI;
  while (difference < -Math.PI) difference += 2 * Math.PI;
  return `M ${vertex.x + radius * Math.cos(first)} ${vertex.y + radius * Math.sin(first)} A ${radius} ${radius} 0 0 ${difference > 0 ? 1 : 0} ${vertex.x + radius * Math.cos(second)} ${vertex.y + radius * Math.sin(second)}`;
}

export function mount(root) {
  const state = { c: { x: CENTER.x + RADIUS * Math.cos(1.15), y: CENTER.y - RADIUS * Math.sin(1.15) }, free: false, proof: false };

  root.append(lead("Rajzolj egy kört, és vedd fel rajta egy átmérő két végpontját (A és B). Ha a kör bármely más pontját összekötöd A-val és B-vel, a C-nél keletkező szög mindig ugyanakkora lesz. Mekkora? Mozgasd a C pontot, és nézd meg!"));

  const main = card("Mozgasd a C pontot");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Kör AB átmérővel és a kör C pontja" });
  const layer = svg("g", {}, figure);
  const handle = svg("circle", { r: 13, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, figure);
  makeDraggable(figure, handle, (x, y) => {
    if (state.free) {
      state.c = { x: Math.min(VIEW.width - 15, Math.max(15, x)), y: Math.min(VIEW.height - 15, Math.max(15, y)) };
      if (Math.abs(state.c.y - CENTER.y) < 10) state.c.y = CENTER.y + (state.c.y >= CENTER.y ? 10 : -10);
    } else {
      let theta = Math.atan2(y - CENTER.y, x - CENTER.x);
      if (Math.abs(Math.sin(theta)) < 0.05) theta = Math.sign(Math.sin(theta) || 1) * (Math.cos(theta) > 0 ? 0.05 : Math.PI - 0.05);
      state.c = { x: CENTER.x + RADIUS * Math.cos(theta), y: CENTER.y + RADIUS * Math.sin(theta) };
    }
    render();
  });
  const freeToggle = toggle("Engedd el a körről", false, () => {
    state.free = !state.free;
    if (!state.free) state.c = snapToCircle(state.c);
    if (state.free) state.proof = false;
    render();
  });
  const proofToggle = toggle("Bizonyítás", false, () => { state.proof = !state.proof; if (state.proof && state.free) { state.free = false; state.c = snapToCircle(state.c); } render(); }, PALETTE.violet);
  const readout = make("div", "il-formula start");
  readout.style.whiteSpace = "pre-wrap";
  const message = make("p", "il-message");
  main.append(controls(freeToggle, proofToggle), figure, readout, message);
  root.append(main, keyIdea("az átmérő fölé rajzolt félkörív bármely pontjából az átmérő derékszögben látszik (Thalész-tétel). És fordítva: ha egy pontból az AB szakasz derékszögben látszik, akkor az a pont rajta van az AB átmérőjű körön."));

  function snapToCircle(point) {
    const theta = Math.atan2(point.y - CENTER.y, point.x - CENTER.x) || 1;
    const fixed = Math.abs(Math.sin(theta)) < 0.05 ? 1.0 : theta;
    return { x: CENTER.x + RADIUS * Math.cos(fixed), y: CENTER.y + RADIUS * Math.sin(fixed) };
  }

  function render() {
    const { c, free, proof } = state;
    freeToggle.setAttribute("aria-pressed", String(free));
    proofToggle.setAttribute("aria-pressed", String(proof));
    handle.setAttribute("cx", c.x); handle.setAttribute("cy", c.y);
    layer.replaceChildren();
    const gamma = angleBetween(c, A_POINT, B_POINT), alpha = angleBetween(A_POINT, B_POINT, c), beta = angleBetween(B_POINT, A_POINT, c);
    const distance = Math.hypot(c.x - CENTER.x, c.y - CENTER.y);
    const right = Math.abs(gamma - 90) < 0.05;
    svg("circle", { cx: CENTER.x, cy: CENTER.y, r: RADIUS, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, layer);
    svg("polygon", { points: `${A_POINT.x},${A_POINT.y} ${B_POINT.x},${B_POINT.y} ${c.x},${c.y}`, style: `fill:${right ? PALETTE.green : PALETTE.red};fill-opacity:.2;stroke:var(--fg);stroke-width:2.5` }, layer);
    if (proof) {
      svg("line", { x1: CENTER.x, y1: CENTER.y, x2: c.x, y2: c.y, style: `stroke:${PALETTE.violet};stroke-width:3;stroke-dasharray:7 5` }, layer);
      const arcs = [[A_POINT, B_POINT, c, PALETTE.amber, "α"], [c, A_POINT, CENTER, PALETTE.amber, "α"], [B_POINT, A_POINT, c, PALETTE.pink, "β"], [c, CENTER, B_POINT, PALETTE.pink, "β"]];
      arcs.forEach(([vertex, p, q, color, name], index) => {
        const radius = index === 1 || index === 3 ? 26 : 34;
        svg("path", { d: arcPath(vertex, p, q, radius), fill: "none", style: `stroke:${color};stroke-width:3.5` }, layer);
        const toward = (point) => ({ x: point.x - vertex.x, y: point.y - vertex.y });
        const u = toward(p), v = toward(q), lu = Math.hypot(u.x, u.y), lv = Math.hypot(v.x, v.y);
        const bisector = { x: u.x / lu + v.x / lv, y: u.y / lu + v.y / lv }, lb = Math.hypot(bisector.x, bisector.y) || 1;
        svg("text", { x: vertex.x + bisector.x / lb * (radius + 14) - 5, y: vertex.y + bisector.y / lb * (radius + 14) + 5, text: name, style: `font-weight:800;font-size:15px;fill:${color}` }, layer);
      });
    } else {
      svg("path", { d: arcPath(c, A_POINT, B_POINT, 26), fill: "none", style: `stroke:${right ? PALETTE.green : PALETTE.red};stroke-width:3.5` }, layer);
      if (right) {
        const toUnit = (p) => { const l = Math.hypot(p.x - c.x, p.y - c.y); return { x: (p.x - c.x) / l, y: (p.y - c.y) / l }; };
        const u = toUnit(A_POINT), v = toUnit(B_POINT), s = 14;
        svg("path", { d: `M ${c.x + u.x * s} ${c.y + u.y * s} l ${v.x * s} ${v.y * s} L ${c.x + v.x * s} ${c.y + v.y * s}`, fill: "none", style: "stroke:var(--fg);stroke-width:2" }, layer);
      }
    }
    for (const [point, name, dx, dy] of [[A_POINT, "A", -20, 22], [B_POINT, "B", 10, 22], [CENTER, "O", -4, 22], [c, "C", 14, c.y < CENTER.y ? -14 : 24]]) {
      svg("circle", { cx: point.x, cy: point.y, r: name === "C" ? 0 : 4.5, style: "fill:var(--fg)" }, layer);
      svg("text", { x: point.x + dx, y: point.y + dy, text: name, style: "font-weight:800;fill:var(--fg)" }, layer);
    }
    readout.replaceChildren(
      "α = ", slot(`${formatNumber(alpha, 1)}°`, 7), " β = ", slot(`${formatNumber(beta, 1)}°`, 7), " ∠ACB = ", slot(make("b", "", `${formatNumber(gamma, 1)}°`), 7),
      make("br"), "α + β = ", slot(make("b", "", `${formatNumber(alpha + beta, 1)}°`), 7), "  180° − ∠ACB = ", slot(`${formatNumber(180 - gamma, 1)}°`, 7),
    );
    message.className = `il-message ${right ? "good" : "warn"}`;
    message.textContent = proof
      ? "Az OA, OB és OC ugyanannyi (a kör sugarai), ezért az OAC és az OBC háromszög egyenlő szárú: az alapon fekvő szögek egyenlők. A C-nél levő szög így α + β. Az ABC háromszög szögösszege: α + β + (α + β) = 180°, tehát α + β = 90°."
      : right
        ? (distance < RADIUS + 0.5 && !free ? "A C pont a körön van, és ∠ACB = 90°. Húzd máshová: a szög nem változik." : "A szög éppen 90°: a C pont pontosan a körön van.")
        : distance < RADIUS ? "A C pont a körön belül van: a szög nagyobb 90°-nál." : "A C pont a körön kívül van: a szög kisebb 90°-nál.";
  }

  render();
  return () => {};
}
