import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 340 }, CENTER = { x: 320, y: 170 }, RADIUS = 150, UNIT = 30;
const RADIANS = Math.PI / 180, DEGREES = 180 / Math.PI;
const NAMES = ["A", "B", "C"], COLORS = [PALETTE.red, PALETTE.green, PALETTE.blue];

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

const onCircle = (degrees) => ({ x: CENTER.x + RADIUS * Math.cos(degrees * RADIANS), y: CENTER.y - RADIUS * Math.sin(degrees * RADIANS) });
const angleAt = (v, p, q) => {
  const ux = p.x - v.x, uy = p.y - v.y, wx = q.x - v.x, wy = q.y - v.y;
  return Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / Math.hypot(ux, uy) / Math.hypot(wx, wy)))) * DEGREES;
};
function arcPath(vertex, p, q, radius) {
  const first = Math.atan2(p.y - vertex.y, p.x - vertex.x), second = Math.atan2(q.y - vertex.y, q.x - vertex.x);
  let difference = second - first;
  while (difference > Math.PI) difference -= 2 * Math.PI;
  while (difference < -Math.PI) difference += 2 * Math.PI;
  return `M ${vertex.x + radius * Math.cos(first)} ${vertex.y + radius * Math.sin(first)} A ${radius} ${radius} 0 0 ${difference > 0 ? 1 : 0} ${vertex.x + radius * Math.cos(second)} ${vertex.y + radius * Math.sin(second)}`;
}

export function mount(root) {
  const state = { angles: [100, 215, 335], proof: false };

  root.append(lead("Minden háromszög köré rajzolható olyan kör, amely mindhárom csúcson átmegy. Ha ennek a körnek a sugara R, akkor a háromszög bármelyik oldalának és a vele szemközti szög szinuszának hányadosa ugyanaz a szám: 2R. Húzd a csúcsokat, és nézd a hányadosokat!"));

  const main = card("Háromszög a körülírt körében");
  const proofToggle = toggle("Miért igaz? Bizonyítás", false, () => { state.proof = !state.proof; render(); }, PALETTE.violet);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Körbe írt háromszög" });
  const layer = svg("g", {}, figure);
  const handles = state.angles.map((_, index) => {
    const handle = svg("circle", { r: 13, style: `fill:${COLORS[index]};stroke:var(--fg);stroke-width:2` }, figure);
    makeDraggable(figure, handle, (x, y) => {
      const degrees = Math.atan2(CENTER.y - y, x - CENTER.x) * DEGREES;
      const gap = (other) => Math.abs(((degrees - other + 540) % 360) - 180);
      if (state.angles.some((other, i) => i !== index && gap(other) < 12)) return;
      state.angles[index] = degrees;
      render();
    });
    return handle;
  });
  const readout = make("div", "il-formula start");
  readout.style.whiteSpace = "pre-wrap";
  const message = make("p", "il-message");
  message.style.minHeight = "6em";
  main.append(controls(proofToggle, make("span", "il-muted", "Húzd a színes pontokat a körön.")), figure, readout, message);
  root.append(main, keyIdea("a szinusztétel: a / sin α = b / sin β = c / sin γ = 2R. Nagyobb szöggel szemben nagyobb oldal van, és az arány mindig a körülírt kör átmérője. Ebből két oldalból és egy szögből a többi szög, vagy két szögből és egy oldalból a többi oldal kiszámolható."));

  function render() {
    const points = state.angles.map(onCircle);
    const [a, b, c] = points;
    const angles = [angleAt(a, b, c), angleAt(b, c, a), angleAt(c, a, b)];
    const sides = [Math.hypot(b.x - c.x, b.y - c.y), Math.hypot(c.x - a.x, c.y - a.y), Math.hypot(a.x - b.x, a.y - b.y)].map((length) => length / UNIT);
    proofToggle.setAttribute("aria-pressed", String(state.proof));
    layer.replaceChildren();
    svg("circle", { cx: CENTER.x, cy: CENTER.y, r: RADIUS, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, layer);
    svg("polygon", { points: points.map((p) => `${p.x},${p.y}`).join(" "), style: "fill:var(--fg);fill-opacity:.07;stroke:var(--fg);stroke-width:2.5" }, layer);
    svg("circle", { cx: CENTER.x, cy: CENTER.y, r: 3.5, style: "fill:var(--fg)" }, layer);
    svg("line", { x1: CENTER.x, y1: CENTER.y, x2: CENTER.x + RADIUS * 0.7, y2: CENTER.y, style: `stroke:${PALETTE.amber};stroke-width:2.5` }, layer);
    svg("text", { x: CENTER.x + RADIUS * 0.35, y: CENTER.y - 8, "text-anchor": "middle", text: "R", style: `font-weight:800;fill:${PALETTE.amber}` }, layer);
    points.forEach((p, index) => {
      const dx = p.x - CENTER.x, dy = p.y - CENTER.y, length = Math.hypot(dx, dy);
      svg("text", { x: p.x + dx / length * 26 - 5, y: p.y + dy / length * 26 + 5, text: NAMES[index], style: `font-weight:800;fill:${COLORS[index]}` }, layer);
      handles[index].setAttribute("cx", p.x); handles[index].setAttribute("cy", p.y);
    });
    let proofAngle = null;
    if (state.proof) {
      // Diameter BB' and the right angle at C: then sin(angle at B') = a / 2R.
      const bPrime = { x: 2 * CENTER.x - b.x, y: 2 * CENTER.y - b.y };
      svg("line", { x1: b.x, y1: b.y, x2: bPrime.x, y2: bPrime.y, style: `stroke:${PALETTE.violet};stroke-width:2.5;stroke-dasharray:8 5` }, layer);
      svg("polygon", { points: `${b.x},${b.y} ${c.x},${c.y} ${bPrime.x},${bPrime.y}`, style: `fill:${PALETTE.violet};fill-opacity:.15;stroke:${PALETTE.violet};stroke-width:2` }, layer);
      svg("circle", { cx: bPrime.x, cy: bPrime.y, r: 5, style: `fill:${PALETTE.violet}` }, layer);
      svg("text", { x: bPrime.x + (bPrime.x - CENTER.x) / RADIUS * 18 - 8, y: bPrime.y + (bPrime.y - CENTER.y) / RADIUS * 18 + 5, text: "B'", style: `font-weight:800;fill:${PALETTE.violet}` }, layer);
      svg("path", { d: arcPath(a, b, c, 30), fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, layer);
      svg("path", { d: arcPath(bPrime, b, c, 30), fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, layer);
      const toward = (p) => { const l = Math.hypot(p.x - c.x, p.y - c.y); return { x: (p.x - c.x) / l * 12, y: (p.y - c.y) / l * 12 }; };
      const u = toward(b), v = toward(bPrime);
      svg("path", { d: `M ${c.x + u.x} ${c.y + u.y} l ${v.x} ${v.y} L ${c.x + v.x} ${c.y + v.y}`, fill: "none", style: "stroke:var(--fg);stroke-width:1.8" }, layer);
      proofAngle = angleAt(bPrime, b, c);
    }
    const row = (name, angleName, side, angle, color) => {
      const line = make("span");
      line.append(slot(make("b", "", name), 2, { align: "left" }), " / sin ", slot(angleName, 1, { align: "left" }), " = ", slot(formatNumber(side, 2), 5), " / ", slot(formatNumber(Math.sin(angle * RADIANS), 3), 5), " = ", slot(make("b", "", formatNumber(side / Math.sin(angle * RADIANS), 2)), 6), "  (", slot(`${formatNumber(angle, 1)}°`, 6), ")");
      line.firstChild.firstChild.style.color = color;
      return line;
    };
    readout.replaceChildren(
      row("a", "α", sides[0], angles[0], COLORS[0]), make("br"), row("b", "β", sides[1], angles[1], COLORS[1]), make("br"), row("c", "γ", sides[2], angles[2], COLORS[2]), make("br"),
      "2R = 2 · ", slot(formatNumber(RADIUS / UNIT, 0), 1), " = ", slot(make("b", "", formatNumber(2 * RADIUS / UNIT, 2)), 6),
    );
    message.className = "il-message";
    message.textContent = state.proof
      ? `Húzzuk meg a B-n átmenő átmérőt: BB' = 2R. A BB'C háromszög C-nél derékszögű (Thalész-tétel), ezért sin ∠BB'C = a / 2R. Az azonos íven nyugvó kerületi szögek egyenlők, így ∠BB'C = α (${formatNumber(proofAngle, 1)}°; ha B' és A a BC különböző oldalán van, akkor 180° − α, aminek ugyanaz a szinusza). Tehát a / sin α = 2R. A másik két oldalra ugyanígy.`
      : "Mozgasd a csúcsokat: a szögek és az oldalak változnak, de a három hányados egyforma marad, és mindig 2R.";
  }

  render();
  return () => {};
}
